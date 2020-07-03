const helpers = require('../helpers');

function validateRequest(context, req, projects, timeEntries, timeTasks, timeProjects, timeClients) {
    let result = helpers.initialize(req);

    if (typeof result !== 'object' || typeof req.body !== 'object') {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    result.projects = projects || [];
    result.timeEntries = timeEntries || {};
    result.timeTasks = timeTasks || {seq:1};
    result.timeProjects = timeProjects || {seq:1};
    result.timeClients = timeClients || {seq:1};

    result.project = (req.body.id ? result.projects.find(e => e.id === req.body.id) : null) || {};
    if (!result.project.id) {
        result.projects.push(result.project);
        result.project.id = result.projects.length;
    }

    result.project.name = req.body.name;
    if (!result.project.name || !result.project.name.length || /^\s+$/.test(result.project.name)) {
        context.log('Missing name - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing name' };
        return false;
    }

    result.project.allowed = req.body.allowed;
    if (!Number.isInteger(result.project.allowed) || result.project.allowed <= 0 || result.project.allowed >= 100000) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing or invalid allowed hours amount' };
        return false;
    }

    result.project.clientEquals = req.body.clientEquals;
    if (!result.project.clientEquals || !result.project.clientEquals.length || /^\s+$/.test(result.project.clientEquals)) {
        context.log('Missing clientEquals - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing clientEquals' };
        return false;
    }

    result.project.clientId = helpers.getClientId(result.project.clientEquals, result.timeClients);
    if (result.project.clientId <= 0) {
        context.log('Invalid clientEquals - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid clientEquals' };
        return false;
    }

    result.project.projectIncludeContains = req.body.projectIncludeContains;
    result.project.projectExcludeContains = req.body.projectExcludeContains;
    result.project.taskStartsWith = req.body.taskStartsWith;
    result.project.startDate = req.body.startDate;
    if (!result.project.startDate || isNaN(new Date(result.project.startDate)) || isNaN(new Date(result.project.startDate).getTime())) {
        context.log('Missing startDate - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing startDate' };
        return false;
    }

    result.project.endDate = req.body.endDate;
    result.project.report = req.body.report;

    return result;
}

module.exports = async function (context, req, projects, timeEntries, timeTasks, timeProjects, timeClients) {
    context.log('Received an UpsertProject request');

    const result = validateRequest(context, req, projects, timeEntries, timeTasks, timeProjects, timeClients);
    if (!result) return;

    result.project.startNumber = helpers.getDateNumber(new Date(result.project.startDate));

    const endDate = result.project.endDate ? new Date(result.project.endDate) : null;
    if (endDate && !isNaN(endDate) && !isNaN(endDate.getTime())) result.project.endNumber = helpers.getDateNumber(endDate);

    helpers.updateProjectIds(result.projects, result.timeTasks, result.timeProjects, result.timeClients);

    const today = helpers.getDateNumber(new Date(), true);
    if (result.project.endNumber && result.project.endNumber > (today - 7)) {
        const { updates, error } = helpers.updateTimeEntries(result.project.startNumber, result.timeEntries, result.timeTasks, result.timeProjects);
        if (error) { context.res = { status:500, body:'Could not retrieve data from Clockify' }; return; }
    }

    return {
        res: {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({project: result.project})
        },
        outTimeEntries: result.timeEntries
    };
}