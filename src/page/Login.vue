<template>
  <v-app>
    <div class="login-wrapper">
      <!-- 왼쪽 브랜드 패널 -->
      <div class="left-panel">
        <h1 class="title">ChatOn</h1>
        <p class="subtitle">실시간 대화의 시작<br />지금 바로 연결하세요.</p>
        <div class="bubbles">
          <div class="bubble bubble-1"></div>
          <div class="bubble bubble-2"></div>
          <div class="bubble bubble-3"></div>
        </div>
      </div>

      <!-- 오른쪽 로그인 박스 -->
      <div class="right-panel">
        <div class="form-box">
          <h2>로그인</h2>
          <v-form>
            <v-text-field
                v-model="id"
                label="아이디"
                dense
                outlined
                hide-details
                class="mb-4"
            />
            <v-text-field
                v-model="pw"
                label="비밀번호"
                type="password"
                dense
                outlined
                hide-details
                class="mb-4"
            />
            <v-btn block color="primary" class="mb-4" @click="login">
              로그인
            </v-btn>
          </v-form>

          <div class="divider">또는</div>

          <div class="social-buttons">
            <v-btn block class="google mb-2" elevation="1">
              <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google Logo"
                  width="20"
                  height="20"
                  class="mr-2"
              />
              Google 로그인
            </v-btn>
            <v-btn block color="#FEE500" class="kakao" dark elevation="1">
              <img
                  src="@/assets/kakao.png"
                  alt="Kakao Logo"
                  width="20"
                  height="20"
                  class="mr-2"
              />
              Kakao 로그인
            </v-btn>
          </div>

          <p class="signup">
            계정이 없으신가요? <a href="/sign-up">회원가입 →</a>
          </p>
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import '@/assets/css/chat-login.css'
export default {
  name: 'ChatLogin',
  data() {
    return {
      id: '',
      pw: '',
    };
  },
  methods: {
    login() {

      console.log('로그인 요청:', this.id, this.pw);

    },
  },
};
</script>

<style scoped>

</style>
