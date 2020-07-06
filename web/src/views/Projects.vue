<template>
  <div class="projects">
    <h1>Current Projects</h1>
    <div class="content">
      <div class="project-list">
        <ol>
          <li v-for="project in projects" :key="project.id" @click="selectedProject = project" :class="{selected: selectedProject===project}">{{project.name}}</li>
        </ol>
      </div>
      <div class="project-detail">
        <div v-if="selectedProject">
          <table>
            <tr>
              <th>*Name:</th>
              <td><input type="text" required v-model="selectedProject.name" /></td>
            </tr>
            <tr>
              <th>*Allowed Hours:</th>
              <td><input type="number" required min="1" max="100000" step="0.25" v-model="selectedProject.allowed" /></td>
            </tr>
            <tr>
              <th>*Client Name:</th>
              <td><input type="text" required v-model="selectedProject.clientEquals" /></td>
            </tr>
            <tr>
              <th>Project Name Contains:</th>
              <td><input type="text" v-model="selectedProject.projectIncludeContains" /></td>
            </tr>
            <tr>
              <th>Project Name Doesn't Contain:</th>
              <td><input type="text" v-model="selectedProject.projectExcludeContains" /></td>
            </tr>
            <tr>
              <th>Task Starts With:</th>
              <td><input type="text" v-model="selectedProject.taskStartsWith" /></td>
            </tr>
            <tr>
              <th>*Start Date:</th>
              <td><input type="date" required v-model="selectedProject.startDate" /></td>
            </tr>
            <tr>
              <th>End Date:</th>
              <td><input type="date" v-model="selectedProject.endDate" /></td>
            </tr>
            <tr>
              <th>Report URL:</th>
              <td><input type="text" v-model="selectedProject.report" /></td>
            </tr>
          </table>
          <p>* - Required field</p>
        </div>
        <div v-else>
          Select a project at left
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const API_PATH = process.env.VUE_APP_API_PATH
export default {
  name: 'Projects',
  data: function () {
    return {
      projects: [
        {
          id: 1,
          name: 'USDA-ARS Scientific Discoveries Development',
          allowed: 748,
          clientEquals: 'USDA ARS - Office of Communications [14613098]',
          clientId: 11,
          projectIncludeContains: null,
          projectIncludeIds: null,
          projectExcludeContains: null,
          projectExcludeIds: null,
          taskStartsWith: null,
          taskIds: null,
          startDate: '2020-01-01',
          startNumber: 18262,
          endDate: '2020-06-22',
          endNumber: 18435,
          report: 'https://clockify.me/reports/detailed?start=2020-01-01T00:00:00.000Z&end=2020-06-22T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        },
        {
          id: 2,
          name: 'USDA-ARS Scientific Discoveries Support',
          allowed: 90,
          clientEquals: 'USDA ARS - Office of Communications [14613098]',
          clientId: 11,
          projectIncludeContains: null,
          projectIncludeIds: null,
          projectExcludeContains: null,
          projectExcludeIds: null,
          taskStartsWith: null,
          taskIds: null,
          startDate: '2020-06-23',
          startNumber: 18436,
          endDate: null,
          endNumber: null,
          report: 'https://clockify.me/reports/detailed?start=2020-06-23T00:00:00.000Z&end=2020-7-04T23:59:59.999Z&filterValuesData=%7B%22clients%22:%5B%225e1f51ea5f73426d90ecb26d%22%5D%7D&filterOptions=%7B%22clients%22:%7B%22status%22:%22ACTIVE%22%7D%7D&page=1&pageSize=50'
        }
      ],
      selectedProject: null
    }
  },
  mounted: async function () {
    const me = this

    const resp = await fetch(API_PATH + '/GetProjects', { cache: 'no-cache' })
    if (resp.status !== 200) return

    const json = await resp.json()
    if (!json || !json.projects) return

    me.projects.splice(0, me.projects.length)
    for (let i = 0; i < json.projects.length; i++) me.projects.push(json.projects[i])
  }
}
</script>

<style scoped>
.content {
  width: 100%;
}
.project-list {
  display: inline-block;
  width: 30%;
  height: 100%;
}
.project-detail {
  display: inline-block;
  width: 65%;
  height: 100%;
  vertical-align: top;
}
li {
  margin: 16px 0;
  padding: 4px;
  cursor: pointer;
  text-align: left;
}
.selected {
  background-color: blanchedalmond;
}
table, tr, td input {
  width: 100%;
}
th {
  text-align: right;
  width: 240px;
}
td {
  text-align: left;
}
</style>
