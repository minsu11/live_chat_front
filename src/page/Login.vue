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
      // 로그인 요청 처리 로직
    },
  },
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  height: 100vh;
  background: linear-gradient(to right, #e0f7fa, #ffffff);
  font-family: 'Pretendard', sans-serif;
}

.left-panel {
  flex: 1;
  background-color: #f0f9ff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 2rem;
  color: #222;
}

.title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 18px;
  text-align: center;
  line-height: 1.6;
}

.bubbles {
  position: absolute;
  bottom: 2rem;
  display: flex;
  gap: 8px;
}
.bubble {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #9ac8f0;
  animation: float 1.6s infinite ease-in-out;
}
.bubble-2 { animation-delay: 0.2s; }
.bubble-3 { animation-delay: 0.4s; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.right-panel {
  flex: 1;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.form-box {
  width: 100%;
  max-width: 340px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background: #ffffff;
}

.form-box h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}

input {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.btn-login {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  margin-bottom: 1rem;
  cursor: pointer;
}

.divider {
  text-align: center;
  margin: 1rem 0;
  color: #aaa;
}

.social-buttons button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #f8f9fa;
  cursor: pointer;
}
.social-buttons img {
  width: 20px;
  height: 20px;
}

.signup {
  text-align: center;
  margin-top: 1rem;
  font-size: 14px;
}
.signup a {
  color: #007bff;
  text-decoration: none;
}
.signup a:hover {
  text-decoration: underline;
}

@media screen and (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }
  .left-panel, .right-panel {
    flex: none;
    width: 100%;
    min-height: 50vh;
  }
  .left-panel {
    padding-top: 3rem;
    padding-bottom: 1rem;
  }
}
</style>
