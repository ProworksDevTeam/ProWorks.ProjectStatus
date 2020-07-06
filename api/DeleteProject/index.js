const helpers = require('../helpers')

function validateRequest(context, req, preferences) {
    // Ensure the user is logged in, and that we could retrieve projects and preferences, and then identify the current projects to work with   
    let result = helpers.initialize(req, preferences);

    const projectId = parseInt(req.query.projectId);

    if (typeof result !== 'object' || !Number.isInteger(projectId)) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500 };

        if (typeof result === 'string') context.res.body = result;
        else if (!Number.isInteger(projectId)) context.res.body = "Missing project ID";
        else context.res.body = 'An unknown error has occurred';

        return false;
    }

    result.projectId = projectId;

    return result;
}

module.exports = async function (context, req, projects) {
    context.log('Received a DeleteProject request');

    const result = validateRequest(context, req);
    if (!result) return;

    if (!Array.isArray(projects)) projects = [];
    const projectIdx = projects.findIndex(p => p.id === result.projectId);
    if (projectIdx >= 0) {
        console.log("Removing the project at index " + projectIdx + " with ID #" + result.projectId);
        projects.splice(projectIdx, 1);
    } else console.log("Did not find any project with ID #" + result.projectId);

    return {
        res: {},
        outProjects: projects
    };
}