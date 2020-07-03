const helpers = require('../helpers');
const axios = require('axios');
const CLOCKIFY_REPORT_API = process.env.CLOCKIFY_REPORT_API;
const CLOCKIFY_WORKSPACE_ID = process.env.CLOCKIFY_WORKSPACE_ID;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
const UPDATE_TIME_SECRET = process.env.UPDATE_TIME_SECRET;

function validateRequest(context, req, timeEntries, timeTasks, timeProjects) {
    if (!req || !req.body || req.body.secret !== UPDATE_TIME_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const startNumber = parseInt(req.query.startNumber);

    if (!Number.isInteger(startNumber) || startNumber <= 17532 || startNumber >= 100000) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing or invalid startNumber' };

        return false;
    }

    return {
        timeEntries,
        startNumber,
        timeTasks: timeTasks,
        timeProjects: timeProjects
    };
}

async function retrieveTimeEntries(url, startNumber, endNumber, timeEntries, timeTasks, timeProjects) {
    const startDate = helpers.getNumberDate(startNumber, 'T00:00:00.000Z');
    const endDate = helpers.getNumberDate(endNumber, 'T23:59:59.999Z');

    console.log(`Retrieving time entries from ${startDate} to ${endDate}`);
    const resp = await axios.post(url, {
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        detailedFilter: {page:1, pageSize:200},
        exportType: 'JSON'
    }, {
        headers: {'X-Api-Key': CLOCKIFY_API_KEY, 'Cache-Control': 'no-cache', 'Content-Type': 'application/json'},
        maxContentLength: 2000000000
    });
    if (resp.status !== 200) { console.log('Could not retrieve Clockify data - ' + JSON.stringify(resp)); return -1; }

    let updateCount = 0;

    timeEntries.from = startNumber;
    if (resp.data && resp.data.timeentries && resp.data.timeentries.length) {
        const te = resp.data.timeentries;
        for (let i = 0; i < te.length; i++) {
            let entry = te[i];
            let ti = entry.timeInterval;
            let start = ti && ti.start ? helpers.getDateNumber(new Date(ti.start), false) : null;
            let task = timeTasks[entry.taskId];
            let project = timeProjects[entry.projectId];
            let hours = helpers.getHours(ti.duration);
            if (!start || !task || !project || !entry._id || hours <= 0) continue;
            timeEntries[entry._id] = { s:start, c:project.c, p:project.i, t:task.i, h:hours };
            updateCount++;
        }
    }

    return updateCount;
}

module.exports = async function (context, req, timeEntries, timeTasks, timeProjects) {
    context.log('Received an UpdateTime request');

    const result = validateRequest(context, req, timeEntries || {}, timeTasks || {seq:1}, timeProjects || {seq:1});
    if (!result) return;

    const url = new URL(`workspaces/${CLOCKIFY_WORKSPACE_ID}/reports/detailed`, CLOCKIFY_REPORT_API).href;
    let endNumber = Number.isInteger(result.timeEntries.from) ? result.timeEntries.from : helpers.getDateNumber(new Date(), true);
    let updates = 0, retrieved = 0, currentStart = Math.max(result.startNumber, endNumber - 2);

    while (currentStart <= endNumber && retrieved >= 0) {
        retrieved = await retrieveTimeEntries(url, currentStart, endNumber, result.timeEntries, result.timeTasks, result.timeProjects);
        endNumber = currentStart - 1;
        currentStart = Math.max(result.startNumber, endNumber - 2);
        if (retrieved > 0) updates += retrieved;
    }
    if (retrieved < 0) { context.res = { status:500, body:'Could not retrieve data from Clockify' }; return; }

    return {
        res: {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({updates})
        },
        outTimeEntries: result.timeEntries
    };
}