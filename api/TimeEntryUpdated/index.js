const helpers = require('../helpers')
const TIME_ENTRY_CREATED_SECRET = process.env.TIME_ENTRY_CREATED_SECRET;

function validateRequest(context, req, timeEntries, timeTasks, timeProjects) {
    if (!req || !req.headers || req.headers['clockify-signature'] !== TIME_ENTRY_CREATED_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const time = req.body || {};
    if (!time || !time.id) {
        context.log('Time Entry not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Time Entry' };

        return false;
    }

    const timeTask = time.taskId ? timeTasks[time.taskId] : null;
    if (!timeTask) {
        context.log('Task not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Task' };

        return false;
    }

    const timeProject = time.projectId ? timeProjects[time.projectId] : null;
    if (!timeProject) {
        context.log('Project not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Project' };

        return false;
    }

    return {
        timeEntries,
        timeEntry: timeEntries[time.id],
        timeTask,
        timeProject,
        time
    };
}

module.exports = async function (context, req, timeEntries, timeTasks, timeProjects) {
    context.log('Received a TimeEntryUpdated request');

    const result = validateRequest(context, req, timeEntries || {}, timeTasks || {seq:1}, timeProjects || {seq:1});
    if (!result) return;

    const te = result.timeEntry || {};
    if (!result.timeEntry) result.timeEntries[result.time.id] = te;
    te.s = helpers.getDateNumber(new Date(result.time.timeInterval.start), false);
    te.c = result.timeProject.c;
    te.p = result.timeProject.i;
    te.t = result.timeTask.i;
    te.h = helpers.getHours(result.time.timeInterval.duration);

    return {
        res: {},
        outTimeEntries: result.timeEntries
    };
}