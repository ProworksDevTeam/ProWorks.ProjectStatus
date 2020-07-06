<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <span v-if="loggedIn">
        <router-link to="/charts">Status</router-link> |
        <router-link to="/projects">Projects</router-link> |
        <a href="/logout">Logout</a>
      </span>
      <span v-else>
        <a href="/login">Login</a>
      </span>
    </div>
    <router-view/>
  </div>
</template>

<script>
const NODE_ENV = process.env.NODE_ENV
export default {
  data: function () {
    return {
      loggedIn: false
    }
  },
  mounted: async function () {
    const me = this

    if (NODE_ENV === 'production') {
      const auth = await fetch('/.auth/me')

      if (auth.status !== 200) return
      const payload = await auth.json()

      if (!payload || !payload.clientPrincipal || !payload.clientPrincipal.userDetails) return
    }

    me.loggedIn = true
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
