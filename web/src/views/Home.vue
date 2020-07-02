<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <div>
      <a href="/login">Login</a>
    </div>
    <div>
      <router-link to="/charts">View the current charts</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
