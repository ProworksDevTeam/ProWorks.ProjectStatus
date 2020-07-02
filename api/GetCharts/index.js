module.exports = async function (context, req) {
    context.log('Received a GetCharts request');

    // TODO: Read personal preferences for how charts should be ordered
    // TODO: Read company-wide list of which projects we are tracking, what their prefixes are, when they started, and what the total allowed hours for each are
    // TODO: Query Clockify API to get time entries for current projects
    // TODO: From those sources, generate an ordered list of chart entries that the client-side JavaScript can use to create Google Charts (see https://developers.google.com/chart/interactive/docs/quick_start)
    // TODO: Include in chart data hours consumed, hours remaining, status (good, watch, problem), and a link to the Clockify detail report (i.e. https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22tasks%22:%5B%225eea706412d51237f8318c89%22,%225eea706412d51237f8318c8c%22,%225ee3df8412d51237f82138fd%22%5D%7D&page=1&pageSize=50)

    const response = {
        charts: [
            {
                id: 1,
                name: "USDA-ARS Scientific Discoveries Development",
                consumed: 757.5,
                allowed: 748,
                status: 'problem',
                report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
            },
            {
                id: 2,
                name: "USDA-ARS Scientific Discoveries Support",
                consumed: 0,
                allowed: 90,
                status: 'good'
            }
        ]
    };

    context.res = {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
    };
}