<template>
  <div class="charts">
    <h1>Current Project Status</h1>
    <div>
      <div class="chartContainer" v-for="chart in charts" :key="chart.id">
        <a :href="chart.report" v-if="chart.report">
          <div class="chart" :id="'chart-' + chart.id"></div>
        </a>
        <div class="chart" :id="'chart-' + chart.id" v-else></div>
      </div>
    </div>
  </div>
</template>

<script>
const API_PATH = process.env.VUE_APP_API_PATH
const google = window.google || {}
export default {
  name: 'Charts',
  data: function () {
    return {
      charts: [],
      visualizationApiLoaded: false
    }
  },
  methods: {
    drawCharts: function () {
      const me = this
      console.log('The drawCharts method was called, charts.length=' + me.charts.length + ', visualizationApiLoaded=' + me.visualizationApiLoaded)
      if (!me.visualizationApiLoaded) {
        console.log('Not drawing yet as the Visualization API is not ready')
        return
      }

      for (let i = 0; i < me.charts.length; i++) {
        const data = me.charts[i]
        console.log('Drawing chart for ' + data.name)

        const rows = []
        const colors = []
        const slices = []
        if (data.consumed >= data.allowed) {
          rows.push(['Allowed', data.allowed])
          rows.push(['Overage', data.consumed - data.allowed])
          colors.push('#a8a500')
          colors.push('#de0000')
          slices.push({})
          slices.push({ offset: 0.3, textStyle: { bold: true } })
        } else {
          rows.push(['Used', data.consumed])
          rows.push(['Remaining', data.allowed - data.consumed])
          colors.push(data.status === 'good' ? '#008000' : (data.status === 'watch' ? '#a8a500' : (data.status === 'problem' ? '#de0000' : '#7e00a8')))
          colors.push('#311efc')
        }

        const table = new google.visualization.DataTable()
        table.addColumn('string', 'Type')
        table.addColumn('number', 'Hours')
        table.addRows(rows)

        const options = {
          title: data.name,
          width: 500,
          height: 400,
          colors,
          slices
        }

        const chart = new google.visualization.PieChart(document.getElementById('chart-' + data.id))
        chart.draw(table, options)
      }
    }
  },
  mounted: async function () {
    const me = this

    if (google.charts) {
      google.charts.load('current', { packages: ['corechart'] })
      google.charts.setOnLoadCallback(function () {
        me.visualizationApiLoaded = true
        me.drawCharts()
      })
    }

    const resp = await fetch(API_PATH + '/GetCharts', { cache: 'no-cache' })
    if (resp.status !== 200) return

    const json = await resp.json()
    if (!json || !json.charts) return

    me.charts.splice(0, me.charts.length)
    for (let i = 0; i < json.charts.length; i++) me.charts.push(json.charts[i])

    await me.$nextTick()
    me.drawCharts()
  }
}
</script>

<style scoped>
.chartContainer {
  display: inline-block;
  margin: 40px;
}
</style>
