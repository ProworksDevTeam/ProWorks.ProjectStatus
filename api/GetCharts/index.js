const helpers = require('../helpers')

function validateRequest(context, req) {
    // Ensure the user is logged in, and that we could retrieve projects and preferences, and then identify the current projects to work with   
    let result = helpers.initialize(req, context.bindings.projects, context.bindings.preferences);

    if (typeof result !== 'object' || typeof result.projects !== 'object' || typeof result.preferences !== 'object') {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500 };

        if (typeof result === 'string') context.res.body = result;
        else if (typeof result.projects !== 'object') context.res.body = "Missing project information";
        else if (typeof result.preferences !== 'object') context.res.body = "Missing preference information";
        else context.res.body = 'An unknown error has occurred';

        return false;
    }

    const current = helpers.getCurrentProjects(result.projects, result.preferences);
    if (!current || current.length === 0) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { headers: {'Content-Type':'application/json'}, body: "{\"charts\":[]}" };
        return false;
    }

    result.projects = current;

    return result;
}

module.exports = async function (context, req) {
    context.log('Received a GetCharts request');

    const result = validateRequest(context, req);
    if (!result) return;

    const timeEntries = helpers.getTimeEntries(result.projects);
    const charts = helpers.createCharts(result.projects, timeEntries);

    context.res = {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({charts})
    };
}