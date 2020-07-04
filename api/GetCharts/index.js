const helpers = require('../helpers')

function validateRequest(context, req, projects, preferences, timeEntries) {
    // Ensure the user is logged in, and that we could retrieve projects and preferences, and then identify the current projects to work with   
    let result = helpers.initialize(req, preferences);

    if (typeof result !== 'object' || typeof result.preferences !== 'object') {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500 };

        if (typeof result === 'string') context.res.body = result;
        else if (typeof result.preferences !== 'object') context.res.body = "Missing preference information";
        else context.res.body = 'An unknown error has occurred';

        return false;
    }

    const hd = parseInt(req.query.historicalDays);
    const historicalDays = Number.isInteger(hd) ? hd : 7;

    const current = helpers.getCurrentProjects(projects, result.preferences, historicalDays);
    if (!current || current.length === 0) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { headers: {'Content-Type':'application/json'}, body: "{\"charts\":[]}" };
        return false;
    }

    result.historicalDays = historicalDays;
    result.projects = current;
    result.timeEntries = timeEntries;

    return result;
}

module.exports = async function (context, req, projects, preferences, timeEntries) {
    context.log('Received a GetCharts request');

    const result = validateRequest(context, req, projects, preferences, timeEntries);
    if (!result) return;

    const projectEntries = helpers.getTimeEntries(result.projects, result.timeEntries);
    const charts = helpers.createCharts(result.projects, projectEntries);

    context.res = {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({charts})
    };
}