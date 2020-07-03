const helpers = require('../helpers');
const axios = require('axios');
const CLOCKIFY_BASE_API = process.env.CLOCKIFY_BASE_API;
const CLOCKIFY_WORKSPACE_ID = process.env.CLOCKIFY_WORKSPACE_ID;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
const UPDATE_LOOKUPS_SECRET = process.env.UPDATE_LOOKUPS_SECRET;

function validateRequest(context, req, projects, timeTasks, timeProjects, timeClients) {
    if (!req || !req.body || req.body.secret !== UPDATE_LOOKUPS_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    return {
        projects: projects || [],
        timeTasks: timeTasks || {seq:1},
        timeProjects: timeProjects || {seq:1},
        timeClients: timeClients || {seq:1}
    };
}

function addUpdateItems(projs, tasks, projects, clients, taskMap, projMap, clientMap) {
    for (let i = 0; i < projs.length; i++) {
        let proj = projs[i];
        let project = projects[proj.id];
        let client = clients[proj.client.id];
        projMap[proj.id] = true;
        clientMap[proj.client.id] = true;

        if (!client) {
            client = {i:clients.seq, n:proj.client.name};
            clients.seq++;
            clients[proj.client.id] = client;
        } else client.n = proj.client.name;

        if (!project) {
            project = {i:projects.seq, n:proj.name, c:client.i};
            projects.seq++;
            projects[proj.id] = project;
        } else { project.n = proj.name; project.c = client.i; }

        for (let j = 0; j < proj.tasks.length; j++) {
            let tsk = proj.tasks[j];
            let task = tasks[tsk.id];
            taskMap[tsk.id] = true;

            if (!task) {
                tasks[tsk.id] = {i:tasks.seq, n:tsk.name, p:project.i};
                tasks.seq++;
            } else { task.n = tsk.name; task.p = project.i; }
        }
    }
}

function deleteItems(obj, map) {
    const toDelete = [];
    let validCount = 0;

    for (const [key, value] of Object.entries(obj)) {
        if (key === 'seq') continue;
        if (map[key] !== true) toDelete.push(key);
        else validCount++;
    }

    for (let i = 0; i < toDelete.length; i++) {
        delete obj[toDelete[i]];
    }

    return validCount;
}

async function addClockifyData(url, page, projs) {
    console.log(`Retrieving page ${page} from Clockify`);
    const resp = await axios.get(url + '&page=' + page, {
        headers: {'X-Api-Key': CLOCKIFY_API_KEY, 'Cache-Control': 'no-cache', 'Content-Type': 'application/json'},
        maxContentLength: 2000000000
    });
    if (resp.status !== 200) { console.log('Could not retrieve Clockify data - ' + JSON.stringify(resp)); return -1; }
    if (resp.data && resp.data.length) {
        projs.push(...resp.data);
        return resp.data.length;
    }

    return 0;
}

module.exports = async function (context, req, projects, timeTasks, timeProjects, timeClients) {
    context.log('Received an UpdateLookups request');

    const result = validateRequest(context, req, projects, timeTasks, timeProjects, timeClients);
    if (!result) return;

    const url = new URL(`workspaces/${CLOCKIFY_WORKSPACE_ID}/projects?hydrated=true`, CLOCKIFY_BASE_API).href;
    const projs = [];

    let taskMap = {}, projMap = {}, clientMap = {};
    let pushed = 0, page = 1;

    do
    {
        pushed = await addClockifyData(url, page++, projs);
    } while (pushed > 0);

    if (pushed < 0) { context.res = {status:500,body:'Could not retrieve data from Clockify'}; return; }

    addUpdateItems(projs, result.timeTasks, result.timeProjects, result.timeClients, taskMap, projMap, clientMap);
    const taskCount = deleteItems(result.timeTasks, taskMap);
    const projectCount = deleteItems(result.timeProjects, projMap);
    const clientCount = deleteItems(result.timeClients, clientMap);
    helpers.updateProjectIds(result.projects, result.timeTasks, result.timeProjects, result.timeClients);

    return {
        res: {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({tasks:taskCount, projects: projectCount, clients: clientCount})
        },
        outProjects: result.projects,
        outTimeTasks: result.timeTasks,
        outTimeProjects: result.timeProjects,
        outTimeClients: result.timeClients
    };
}