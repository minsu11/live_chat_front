<template>
  <div class="menu-button">
    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="goToSettings">
          <v-list-item-title>환경설정</v-list-item-title>
        </v-list-item>
        <v-list-item @click="logout">
          <v-list-item-title>로그아웃</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "MenuDropdown",
  methods: {
    goToSettings() {
      // setting 화면 필요
      this.$router.push("/settings");
    },
    logout() {
      // 로그아웃 로직 (토큰 제거 등)
      alert("로그아웃되었습니다.");
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.v-btn {
  margin: 10px;
}
.menu-button {
  position: absolute;
  top: 10px;
  right: 20px;
}
</style>
