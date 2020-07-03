const helpers = require('../helpers')
const PROJECT_CREATED_SECRET = process.env.PROJECT_CREATED_SECRET;

function validateRequest(context, req, projects, timeProjects, timeClients) {
    if (!req || !req.headers || req.headers['clockify-signature'] !== PROJECT_CREATED_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const project = req.body || {};
    if (!project || !project.id) {
        context.log('Project not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Project' };

        return false;
    }

    const timeClient = project.clientId ? timeClients[project.clientId] : null;
    if (!timeClient) {
        context.log('Client not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Client' };

        return false;
    }

    return {
        projects,
        timeProjects,
        timeProject: timeProjects[project.id],
        timeClients,
        timeClient,
        project
    };
}

module.exports = async function (context, req, projects, timeProjects, timeClients) {
    context.log('Received a TaskCreated request');

    const result = validateRequest(context, req, projects || [], timeProjects || {seq:1}, timeClients || {seq:1});
    if (!result) return;

    if (!result.timeProject) {
        result.timeProjects[result.project.id] = {i:result.timeProjects.seq, n:result.project.name, c:result.timeClient.i};
        result.timeProjects.seq++;
    } else { result.timeProject.n = result.project.name; result.timeProject.c = result.timeClient.i; }

    helpers.updateProjectIds(result.projects, null, result.timeProjects);

    return {
        res: {},
        outProjects: result.projects,
        outTimeProjects: result.timeProjects
    };
}