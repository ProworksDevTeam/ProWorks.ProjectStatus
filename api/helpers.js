const TEST_PRINCIPAL = typeof process.env.TEST_PRINCIPAL === 'string' && process.env.TEST_PRINCIPAL.length > 0 ? process.env.TEST_PRINCIPAL : null;
const axios = require('axios');

function initialize(req, projects, preferences) {
    if (!req) return "No valid request information";

    if (typeof projects === 'string' && projects.length > 0) projects = JSON.parse(projects);
    if (typeof preferences === 'string' && preferences.length > 0) preferences = JSON.parse(preferences);

    const header = req.headers["x-ms-client-principal"] || TEST_PRINCIPAL;
    if (typeof header !== 'string' || !header || header.length === 0) return "Missing authentication header";
    const encoded = Buffer.from(header, "base64");
    const auth = JSON.parse(encoded.toString("ascii"));

    preferences = typeof preferences === 'object' && preferences[auth.userDetails] ? preferences[auth.userDetails] : {};

    return auth ? {auth, projects, preferences} : "Could not verify authentication";
}

function getCurrentProjects(projects, preferences) {
    // Read the projects to identify which ones are active, and then read the preferences for the current user to sort the projects
    return [
        {
            id: 1,
            name: "USDA-ARS Scientific Discoveries Development",
            allowed: 748,
            clientEquals: 'USDA-ARS',
            projectContains: null,
            taskStartsWith: null,
            startDate: null,
            endDate: null,
            report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        },
        {
            id: 2,
            name: "USDA-ARS Scientific Discoveries Support",
            allowed: 90,
            clientEquals: 'USDA-ARS-Support',
            projectContains: null,
            taskStartsWith: null,
            startDate: null,
            endDate: null,
            report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        }
    ];
}

function getTimeEntries(projects) {
    // First find the earliest start date for any active project, then get from Clockify all time since that point
    return [
        {
            client: 'USDA-ARS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 700
        },
        {
            client: 'USDA-ARS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 23
        },
        {
            client: 'USDA-ARS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 12.25
        },
        {
            client: 'USDA-ARS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 12.25
        },
        {
            client: 'USDA-ERS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 16.75
        },
        {
            client: 'USDA-ARS',
            project: '2020-07-02 through 2020-07-15',
            task: '[ARS-105] Update name',
            date: 124324349, // MS since epoch
            hours: 10
        }
    ]
}

function createCharts(projects, timeEntries) {
    // For each project, find all the matching time entries and aggregate the total hours, then create a chart object from that aggregate
    const charts = [];

    for (let i = 0; i < projects.length; i++) {
        let project = projects[i];
        let consumed = 0;
        let startDate = typeof project.startDate === 'string' ? new Date(project.startDate).getTime() : 0;
        let endDate = typeof project.endDate === 'string' ? new Date(project.endDate).getTime() : Number.MAX_SAFE_INTEGER;

        for (let j = 0; j < timeEntries.length; j++) {
            let entry = timeEntries[j];

            if (entry.date < startDate || entry.date > endDate) continue;
            if (project.clientEquals && entry.client !== project.clientEquals) continue;
            if (project.projectContains && entry.project.indexOf(project.projectContains) < 0) continue;
            if (project.taskStartsWith && !entry.task.startsWith(project.taskStartsWith)) continue;

            consumed += entry.hours;
        }

        charts.push({
            id: project.id,
            name: project.name,
            consumed,
            allowed: project.allowed,
            status: consumed > project.allowed ? 'problem' : (consumed > Math.min(project.allowed * 0.95, project.allowed > 10 ? project.allowed - 10 : 0) ? 'watch' : 'good'),
            report: project.report
        })
    }

    return charts;
}

module.exports = {
    initialize,
    getCurrentProjects,
    getTimeEntries,
    createCharts
}