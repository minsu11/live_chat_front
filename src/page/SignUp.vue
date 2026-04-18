<template>
  <AuthLayout title="회원가입" boxClass="auth-scroll-box signup-box">
    <v-form v-model="valid" class="signup-form">
      <div class="inline-row mb-3">
        <div class="grow">
          <v-text-field
              v-model="id"
              :rules="[rules.required, rules.id]"
              label="아이디"
              required
              outlined
              dense
              hide-details="auto"
          />
        </div>

        <v-btn color="primary" @click="duplicate(id)">
          중복 확인
        </v-btn>
      </div>

      <v-text-field
          v-model="password"
          :rules="[rules.required, rules.password]"
          label="비밀번호"
          type="password"
          required
          outlined
          dense
          class="mb-3"
      />

      <v-text-field
          v-model="name"
          :rules="[rules.required]"
          label="이름"
          required
          outlined
          dense
          class="mb-3"
      />

      <v-text-field
          v-model="nickName"
          :rules="[rules.required]"
          label="닉네임"
          required
          outlined
          dense
          class="mb-3"
      />

      <v-select
          v-model="gender"
          :items="['남자', '여자']"
          label="성별"
          :rules="[rules.required]"
          required
          outlined
          dense
          class="mb-3"
      />

      <v-text-field
          v-model="age"
          :rules="[rules.required]"
          label="나이"
          required
          outlined
          dense
          type="number"
          min="1"
          class="mb-3"
      />

      <div class="date-field mb-4">
        <label class="date-label">생일</label>
        <VueDatePicker
            v-model="birth"
            locale="ko"
            :enable-time-picker="false"
            max-date="today"
            type="date"
            style="width: 100%;"
        />
      </div>

      <v-text-field
          v-model="email"
          :rules="[rules.required, rules.email]"
          label="이메일"
          required
          outlined
          dense
          class="mb-3"
      />

      <v-text-field
          v-model="phoneNumber"
          :rules="[rules.required, rules.phoneNumber]"
          label="전화번호"
          required
          outlined
          dense
          class="mb-4"
      />

      <v-btn
          :disabled="!valid"
          color="primary"
          block
          class="mb-4"
          @click="submitForm"
      >
        회원가입
      </v-btn>
    </v-form>

    <p class="auth-link-text">
      이미 계정이 있으신가요? <router-link to="/">로그인 →</router-link>
    </p>
  </AuthLayout>
</template>

<script>
import moment from 'moment'
import api from '@/plugins/axios.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const HOST = ''

export default {
  name: 'SignUp',
  components: {
    AuthLayout
  },
  data() {
    return {
      valid: false,
      id: '',
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      birth: '',
      nickName: '',
      gender: '',
      age: '',
      rules: {
        required: value => !!value || '필수 항목입니다.',
        id: value => (value && value.length >= 5) || '5자 이상이여야합니다.',
        email: value => /.+@.+\..+/.test(value) || '유효한 이메일을 입력해주세요.',
        phoneNumber: value => /010[0-9]{7,8}/.test(value) || '유효한 전화 번호를 입력해주세요',
        password: value => (value && value.length >= 6) || '비밀번호는 6자 이상이어야 합니다.'
      }
    }
  },
  methods: {
    submitForm() {
      if (!this.valid) {
        return
      }

      const date = moment(this.birth).format('YYYY-MM-DD')

      const signData = {
        id: this.id,
        password: this.password,
        name: this.name,
        email: this.email,
        phoneNumber: this.phoneNumber,
        nickName: this.nickName,
        birth: date,
        gender: this.gender,
        age: this.age
      }

      api.post(HOST + '/v1/users/register', signData)
          .then((res) => {
            console.log('response', res)
            alert('회원가입 성공')
            this.$router.push('/')
          })
          .catch((e) => {
            console.log('회원가입 실패', e)
          })
    },

    duplicate(inputId) {
      console.log('중복 체크 대상:', inputId)
      // TODO: 실제 중복 확인 API 연결
    }
  }
}
</script>

<style scoped src="@/assets/css/auth-signup.css">
</style>