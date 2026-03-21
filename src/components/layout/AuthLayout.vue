<template>
  <v-app>
    <div class="auth-wrapper">
      <div class="left-panel">
        <h1 class="title">ChatOn</h1>
        <p class="subtitle">실시간 대화의 시작<br />지금 바로 연결하세요.</p>

        <div class="bubbles">
          <div class="bubble bubble-1"></div>
          <div class="bubble bubble-2"></div>
          <div class="bubble bubble-3"></div>
        </div>
      </div>

      <div class="right-panel">
        <div :class="['form-box', boxClass]">
          <h2>{{ title }}</h2>
          <slot />
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import '@/assets/css/auth-common.css'

export default {
  name: 'AuthLayout',
  props: {
    title: {
      type: String,
      default: ''
    },
    boxClass: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
</style>