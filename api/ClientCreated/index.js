const helpers = require('../helpers')
const CLIENT_CREATED_SECRET = process.env.CLIENT_CREATED_SECRET;

function validateRequest(context, req, projects, timeClients) {
    if (!req || !req.headers || req.headers['clockify-signature'] !== CLIENT_CREATED_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const client = req.body || {};
    if (!client || !client.id) {
        context.log('Client not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Client' };

        return false;
    }

    return {
        projects,
        timeClients,
        timeClient: timeClients[client.id],
        client
    };
}

module.exports = async function (context, req, projects, timeClients) {
    context.log('Received a ClientCreated request');

    const result = validateRequest(context, req, projects || [], timeClients || {seq:1});
    if (!result) return;

    if (!result.timeClient) {
        result.timeClients[result.client.id] = {i:result.timeClients.seq, n:result.client.name};
        result.timeClients.seq++;
    } else result.timeClient.n = result.client.name;

    helpers.updateProjectIds(result.projects, null, null, result.timeClients);

    return {
        res: {},
        outProjects: result.projects,
        outTimeClients: result.timeClients
    };
}