const helpers = require('../helpers')
const TASK_CREATED_SECRET = process.env.TASK_CREATED_SECRET;

function validateRequest(context, req, projects, timeTasks, timeProjects) {
    if (!req || !req.headers || req.headers['clockify-signature'] !== TASK_CREATED_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const task = req.body || {};
    if (!task || !task.id) {
        context.log('Task not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Task' };

        return false;
    }

    const timeProject = task.projectId ? timeProjects[task.projectId] : null;
    if (!timeProject) {
        context.log('Project not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Project' };

        return false;
    }

    return {
        projects,
        timeTasks,
        timeTask: timeTasks[task.id],
        timeProjects,
        timeProject,
        task
    };
}

module.exports = async function (context, req, projects, timeTasks, timeProjects) {
    context.log('Received a TaskCreated request');

    const result = validateRequest(context, req, projects || [], timeTasks || {seq:1}, timeProjects || {seq:1});
    if (!result) return;

    if (!result.timeTask) {
        result.timeTasks[result.task.id] = {i:result.timeTasks.seq, n:result.task.name, p:result.timeProject.i};
        result.timeTasks.seq++;
    } else { result.timeTask.n = result.task.name; result.timeTask.p = result.timeProject.i; }

    helpers.updateProjectIds(result.projects, result.timeTasks, result.timeProjects);

    return {
        res: {},
        outProjects: result.projects,
        outTimeTasks: result.timeTasks
    };
}