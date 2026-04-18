<template>
  <AuthLayout title="로그인">
    <v-form>
      <v-text-field
          v-model="userId"
          label="아이디"
          dense
          outlined
          hide-details
          class="mb-4"
      />
      <v-text-field
          v-model="password"
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
      계정이 없으신가요? <router-link to="/sign-up">회원가입 →</router-link>
    </p>
  </AuthLayout>
</template>

<script>
import api from '@/plugins/axios.js'
import { connectWebSocket } from '@/services/ws-client.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'

export default {
  name: 'ChatLogin',
  components: {
    AuthLayout
  },
  data() {
    return {
      userId: '',
      password: '',
    }
  },
  methods: {
    async login() {
      console.log('login request')

      try {
        await api.post('/v1/users/login', {
          userId: this.userId,
          password: this.password
        })

        console.log('login success')

        await new Promise(resolve => setTimeout(resolve, 50))
        this.$cookies.set('loginDummy', 'test', 'test')

        console.log('web socket connect')
        connectWebSocket()

        this.$router.push('/home')
      } catch (e) {
        console.log('login catch', e)
      }
    },
  },
}
</script>

<style scoped src="@/assets/css/auth-login.css">
</style>