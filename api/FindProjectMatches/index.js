const helpers = require('../helpers')

function validateRequest(context, req, timeTasks, timeProjects, timeClients) {
    // Ensure the user is logged in, and that we could retrieve projects and preferences, and then identify the current projects to work with   
    let result = helpers.initialize(req);

    const project = !req.body || typeof req.body.project !== 'object' ? null : req.body.project;

    if (typeof result !== 'object' || !project) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500 };

        if (typeof result === 'string') context.res.body = result;
        else if (!project) context.res.body = "Missing or invalid project";
        else context.res.body = 'An unknown error has occurred';

        return false;
    }

    return {
        project,
        timeTasks: timeTasks || {seq:1},
        timeProjects: timeProjects || {seq:1},
        timeClients: timeClients || {seq:1}
    };
}

module.exports = async function (context, req, timeTasks, timeProjects, timeClients) {
    context.log('Received a FindProjectMatches request');

    const result = validateRequest(context, req, timeTasks, timeProjects, timeClients);
    if (!result) return;

    helpers.updateProjectIds([result.project], result.timeTasks, result.timeProjects, result.timeClients);

    const clientId = result.project.clientId;
    const timeClient = clientId ? Object.entries(result.timeClients).map(p => p[1]).find(c => c.i === clientId) : null;
    const client = timeClient ? { id: timeClient.i, name: timeClient.n } : null;
    const clientProjects = Object.entries(result.timeProjects).map(p => p[1]).filter(p => p && p.c === clientId).map(p => { return { id: p.i, name: p.n }; });
    const projectIncludeIds = result.project.projectIncludeIds;
    const projectExcludeIds = result.project.projectExcludeIds;
    const projects = [];

    if (!projectIncludeIds && !projectExcludeIds) {
        projects.push(...clientProjects);
    } else {
        for (const project of clientProjects)
        {
            if (projectIncludeIds && projectIncludeIds.indexOf(project.id) < 0) continue;
            if (projectExcludeIds && projectExcludeIds.indexOf(project.id) >= 0) continue;
            projects.push(project);
        }
    }

    const projectIds = projects.map(p => p.id);
    const projectTasks = Object.entries(result.timeTasks).map(p => p[1]).filter(t => t && projectIds.indexOf(t.p) >= 0).map(t => { return { id: t.i, name: t.n }; });
    const taskIds = result.project.taskIds;
    const tasks = [];

    if (!taskIds) {
        tasks.push(...projectTasks);
    } else {
        for (const task of projectTasks)
        {
            if (taskIds.indexOf(task.id) < 0) continue;
            tasks.push(task);
        }
    }

    return {
        res: {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({client, projects, tasks})
        }
    };
}