const helpers = require('../helpers')

function validateRequest(context, req, preferences) {
    // Ensure the user is logged in, and that we could retrieve projects and preferences, and then identify the current projects to work with   
    let result = helpers.initialize(req, preferences);

    if (typeof result !== 'object' || typeof result.preferences !== 'object' || typeof result.userPreferences !== 'object') {
        context.log('Invalid request - ' + JSON.stringify(req));
        context.res = { status: 500 };

        if (typeof result === 'string') context.res.body = result;
        else if (typeof result.preferences !== 'object') context.res.body = "Missing preference information";
        else if (typeof result.userPreferences !== 'object') context.res.body = "Missing user preference information";
        else context.res.body = 'An unknown error has occurred';

        return false;
    }

    return result;
}

module.exports = async function (context, req, preferences) {
    context.log('Received a SetOrder request');

    const result = validateRequest(context, req, preferences);
    if (!result) return;

    result.userPreferences.projectSortOrder = Array.isArray(req.body.sortOrder) ? req.body.sortOrder : [];

    return {
        res: {},
        outPreferences: result.preferences
    };
}