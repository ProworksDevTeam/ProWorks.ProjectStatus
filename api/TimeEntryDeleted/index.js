const TIME_ENTRY_DELETED_SECRET = process.env.TIME_ENTRY_DELETED_SECRET;

function validateRequest(context, req, timeEntries) {
    if (!req || !req.headers || req.headers['clockify-signature'] !== TIME_ENTRY_DELETED_SECRET) {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Invalid Request' };

        return false;
    }

    const time = req.body || {};
    if (!time || !time.id) {
        context.log('Time Entry not found - ' + JSON.stringify(req));
        context.res = { status: 500, body: 'Missing Time Entry' };

        return false;
    }

    return {
        timeEntries,
        timeEntry: timeEntries[time.id],
        time
    };
}

module.exports = async function (context, req, timeEntries) {
    context.log('Received a TimeEntryDeleted request');

    const result = validateRequest(context, req, timeEntries || {});
    if (!result) return;

    if (result.timeEntry) delete result.timeEntries[result.time.id];

    return {
        res: {},
        outTimeEntries: result.timeEntries
    };
}