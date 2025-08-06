<template>
  <div>
    메인 태그
    <div class="user-form">
      <button id="login-btn" @click="loginForm()">
        로그인
      </button>
      <button id="sign-up-btn" @click="signUpForm()">
        회원가입
      </button>

    </div>
  </div>
</template>

<script>
export default {
  name: 'MainHeader',
  methods: {
    loginForm() {
      this.$router.push({path: 'login'})
    },
    signUpForm() {
      this.$router.push({path: 'sign-up'})
    }
  }
}

</script>
<style scoped>

</style>