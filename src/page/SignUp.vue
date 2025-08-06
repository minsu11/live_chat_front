<template>
  <main-header>
    <MainHeader></MainHeader>
  </main-header>
  <v-app>
    <v-container>
      <v-card class="mx-auto pa-5" max-width="500">
        <v-card-title class="text-h5 font-weight-bold">회원가입</v-card-title>
        <v-card-text>
          <v-form v-model="valid">
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                    v-model="id"
                    :rules="[rules.required, rules.id]"
                    label="아이디"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-btn small color="primary" @click="duplicate(id)">중복 확인</v-btn>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="password"
                    :rules="[rules.required, rules.password]"
                    label="비밀번호"
                    type="password"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="name"
                    :rules="[rules.required]"
                    label="이름"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="nickName"
                    :rules="[rules.required]"
                    label="닉네임"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                    v-model="gender"
                    :items="['남자', '여자']"
                    label="성별"
                    required
                    outlined
                    dense
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="age"
                    :rules="[rules.required]"
                    label="나이"
                    required
                    outlined
                    dense
                    type="number"
                    min="1"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <p class="mb-2 font-weight-medium">생일</p>
                <VueDatePicker
                    v-model="birth"
                    locale="ko"
                    :enable-time-picker="false"
                    max-date="today"
                    type="date"
                    style="width: 100%;"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="email"
                    :rules="[rules.required, rules.email]"
                    label="이메일"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="phoneNumber"
                    :rules="[rules.required]"
                    label="전화번호"
                    required
                    outlined
                    dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="text-center">
                <v-btn
                    :disabled="!valid"
                    color="primary"
                    @click="submitForm"
                >
                  회원가입
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </v-app>
</template>

<script>
import MainHeader from "@/components/MainHeader.vue";
import moment from 'moment';

const HOST = "";
export default {
  name: "signUp",
  components: {MainHeader},
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
        id: value => value.length >= 5 || '5자 이상이여야합니다.',
        email: value => /.+@.+\..+/.test(value) || '유효한 이메일을 입력해주세요.',
        phoneNumber: value => /010[0-9]{7,8}/.test(value) || '유효한 전화 번호를 입력해주세요',
        password: value => value.length >= 6 || '비밀번호는 6자 이상이어야 합니다.'
      }
    }
  },
  methods: {
    submitForm() {
      if (this.valid) {
        const date = moment(this.birth).format('YYYY-MM-DD');
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
        };
        console.log(signData);

        this.$axios.post(HOST + "/api/v1/users/register", signData)
            .then((res) => {
              if (res.data.isSuccess) {
                console.log("회원가입 성공")
                alert('회원가입 성공');
                this.$router.push("/")
              } else {
                alert('회원가입 실패');

              }
            });
      }
    },
    duplicate(inputId) {
      const id = this.$axios.post();
      return id.toString() === inputId
    }
  }
};
</script>

<style scoped>
v-container {
  margin-top: 25px;
  margin-bottom: 25px;
}
</style>
