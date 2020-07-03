const TEST_PRINCIPAL = typeof process.env.TEST_PRINCIPAL === 'string' && process.env.TEST_PRINCIPAL.length > 0 ? process.env.TEST_PRINCIPAL : null;
const axios = require('axios');
const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;
const dayMs = hourMs * 24;

function initialize(req, preferences) {
    if (!req) return "No valid request information";

    if (typeof preferences === 'string' && preferences.length > 0) preferences = JSON.parse(preferences);

    const header = req.headers["x-ms-client-principal"] || TEST_PRINCIPAL;
    if (typeof header !== 'string' || !header || header.length === 0) return "Missing authentication header";
    const encoded = Buffer.from(header, "base64");
    const auth = JSON.parse(encoded.toString("ascii"));

    preferences = typeof preferences === 'object' && preferences[auth.userDetails] ? preferences[auth.userDetails] : {};

    return auth ? {auth, preferences} : "Could not verify authentication";
}

function getCurrentProjects(projects, preferences) {
    // Read the projects to identify which ones are active, and then read the preferences for the current user to sort the projects
    return [
        {
            id: 1,
            name: "USDA-ARS Scientific Discoveries Development",
            allowed: 748,
            clientEquals: 'USDA-ARS',
            clientId: 23,
            projectIncludeContains: null,
            projectIncludeIds: null,
            projectExcludeContains: "Internal",
            projectExcludeIds: [432],
            taskStartsWith: null,
            taskIds: null,
            startDate: '2020-01-01',
            startNumber: 18002,
            endDate: '2020-06-15',
            endNumber: 18141,
            report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        },
        {
            id: 2,
            name: "USDA-ARS Scientific Discoveries Support",
            allowed: 90,
            clientEquals: 'USDA-ARS',
            clientId: 23,
            projectIncludeContains: null,
            projectIncludeIds: null,
            projectExcludeContains: "Internal",
            projectExcludeIds: [432],
            taskStartsWith: null,
            taskIds: null,
            startDate: '2020-06-16',
            startNumber: 18142,
            endDate: null,
            endNumber: null,
            report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-12-31T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        }
    ];
}

function getTimeEntries(timeEntries) {
    // First find the earliest start date for any active project, then get all matching entries from that point as an array rather than an object
    return [
        {
            c: 23,
            p: 867,
            t: 14323,
            s: 18141, // MS since epoch
            h: 700
        },
        {
            c: 23,
            p: 867,
            t: 14323,
            s: 18121, // MS since epoch
            h: 23
        },
        {
            c: 23,
            p: 867,
            t: 14323,
            s: 18041, // MS since epoch
            h: 12.25
        },
        {
            c: 23,
            p: 867,
            t: 14323,
            s: 18142, // MS since epoch
            h: 12.25
        },
        {
            c: 24,
            p: 868,
            t: 14324,
            s: 18131, // MS since epoch
            h: 16.75
        },
        {
            c: 23,
            p: 867,
            t: 14323,
            s: 18111, // MS since epoch
            h: 10
        }
    ]
}

function createCharts(projects, timeEntries) {
    // For each project, find all the matching time entries and aggregate the total hours, then create a chart object from that aggregate
    const charts = [];

    for (let i = 0; i < projects.length; i++) {
        let project = projects[i];
        let consumed = 0;
        let startNumber = project.startNumber;
        let endNumber = project.endNumber || Number.MAX_SAFE_INTEGER;
        let clientId = project.clientId;
        let projectIncludeIds = project.projectIncludeIds;
        let projectExcludeIds = project.projectExcludeIds;
        let taskIds = project.taskIds;

        for (let j = 0; j < timeEntries.length; j++) {
            let entry = timeEntries[j];

            if (entry.c !== clientId || entry.s < startNumber || entry.s > endNumber) continue;
            if (projectIncludeIds && projectIncludeIds.indexOf(entry.p) < 0) continue;
            if (projectExcludeIds && projectExcludeIds.indexOf(entry.p) >= 0) continue;
            if (taskIds && taskIds.indexOf(entry.p) < 0) continue;

            consumed += entry.h;
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

function updateProjectIds(projects, timeTasks, timeProjects, timeClients) {
    const hasProjs = typeof projects === 'object' && projects.length;
    const hasTasks = typeof timeTasks === 'object';
    const hasProjects = typeof timeProjects === 'object';
    const hasClients = typeof timeClients === 'object';

    if (!hasProjs || (!hasTasks && !hasProjects && !hasClients)) return;

    for (let i = 0; i < projects.length; i++) {
        let proj = projects[i];

        if (hasTasks) proj.taskIds = getTaskIds(proj.taskStartsWith, timeTasks);
        if (hasProjects) {
            proj.projectIncludeIds = getProjectIds(proj.projectIncludeContains, timeProjects);
            proj.projectExcludeIds = getProjectIds(proj.projectExcludeContains, timeProjects);
        }
        if (hasClients) proj.clientId = getClientId(proj.clientEquals, timeClients);
    }
}

const getTaskIds = (taskStartsWith, obj) => getIds(taskStartsWith, obj, n => n.startsWith(taskStartsWith));
const getProjectIds = (projectContains, obj) => getIds(projectContains, obj, n => n.contains(projectContains));
const getClientId = (clientEquals, obj) => { const ids = getIds(clientEquals, obj, n => n === clientEquals); return ids && ids.length ? ids[0] : null; }

function getIds(test, obj, check) {
    if (!test || !test.length || /^\s+$/.test(test)) return null;

    const ids = [];
    for (const [key, value] of Object.entries(obj)) {
        if (!value || !value.i || !value.n || !check(value.n)) continue;
        ids.push(value.i);
    }

    return ids;
}

const getDateNumber = (date, offsetTimeZone) => Math.floor((date.getTime() - (offsetTimeZone ? date.getTimezoneOffset() * minuteMs : 0)) / dayMs);
function getNumberDate(number, suffix) {
    const dt = new Date((number + 1) * dayMs);
    return dt.getFullYear() + '-' +
        (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' +
        (dt.getDate() < 10 ? '0' : '') + dt.getDate() + suffix;
}

const getHours = (duration) => Number.isFinite(duration) && duration > 0 ? Math.ceil(duration / 900) / 4 : 0;


module.exports = {
    initialize,
    getCurrentProjects,
    getTimeEntries,
    createCharts,
    updateProjectIds,
    getDateNumber,
    getNumberDate,
    getHours
}