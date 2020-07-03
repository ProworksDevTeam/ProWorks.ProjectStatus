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

module.exports = async function (context, req, timeEntries, timeTasks, timeProjects) {
    context.log('Received an UpdateTime request');

    const result = validateRequest(context, req, timeEntries || {}, timeTasks || {seq:1}, timeProjects || {seq:1});
    if (!result) return;

    const { updates, error } = helpers.updateTimeEntries(result.startNumber, result.timeEntries, result.timeTasks, result.timeProjects);
    if (error) { context.res = { status:500, body:'Could not retrieve data from Clockify' }; return; }

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