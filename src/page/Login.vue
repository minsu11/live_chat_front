<template>
  <slot>

    <MainHeader/>
  </slot>
  <v-container>
    <div class="input-container">
      <label>아이디</label>
      <input type="text" :value="id" @input="id = $event.target.value" placeholder="아이디 입력해주세요"/>
    </div>
    <div class="input-container">
      <label>비밀번호</label>
      <input type="text" :value="pw" @input="pw = $event.target.value"/>
    </div>
    <button class="btn btn-primary" @click="login(id, pw)">로그인</button>
  </v-container>
</template>

<script>
import MainHeader from "@/components/component/MainHeader.vue"

const HOST = "";
export default {
  name: 'HelloWorld',
  components: {
    MainHeader,
  },

  methods: {

    login(id, pw) {
      console.log(id)
      console.log(pw)
      const loginData = {
        userId: id,
        password: pw
      };
      console.log(loginData)
      this.$axios
          .post(HOST + "/api/v1/users/login", loginData)
          .then((res) => {

            console.log(res.data)
            console.log(res)
            console.log("log: " + res)
            this.$cookies.set("idCookie", res.data)
            // cookie를


          })
          .catch((error) => {
            console.log(error)
          })
    }
  }
}

</script>

<style scoped>
.input-container {
  margin-bottom: 15px;
}

.input-container label {
  display: block;
  margin-bottom: 5px;
}

.input-container input {
  width: 25%;
  padding: 5px;
  border: 1px solid #ccc; /* 테두리 스타일 지정 */
  border-radius: 4px; /* 테두리 둥글게 */
  box-sizing: border-box; /* 패딩과 테두리 두께를 요소의 너비에 포함 */
}
</style>

