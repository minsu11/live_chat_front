// HomePage.vue
<template>
    <div class="chat-layout">
      <Sidebar
          :current-view="currentView"
          :friends="friends"
          :chats="chats"
          :me="me"
          @changeView="changeView"
          @openChat="openChat"
      />

      <router-view/>

      <!-- 점 세 개 버튼 + 메뉴 -->
      <MenuDropdown />
    </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue';
import defaultProfile from '@/assets/default_image.png';
import MenuDropdown from "@/components/MenuDropdown.vue";
import api from "@/plugins/axios.js"
export default {
  name: 'HomePage',
  components: { Sidebar, MenuDropdown},
  data() {
    return {
      currentView: 'friends',
      defaultProfile,
      selectedChat: '',
      messages: [],
      newMessage: '',
      me: null // 내 프로필 상태
    };
  },
  async created(){
    this.me = await api.get("v1/users/me/profile/summary")

    console.log("create me")
    console.log(this.me)

  },
  methods: {
    changeView(view) {
      this.currentView = view;
    },
    async openChat(payload) {
      // DM이면 '방 보장(ensure)' API 호출 후 roomId 받아서 라우팅하는 패턴 권장
      // const { data } = await api.post('/v1/chat-rooms/ensure', { friendUuid: item.uuid });
      // const roomId = data.roomId;
      console.log("open chat start ");
      console.log(payload.item)

      const room = payload.item;
      const roomId = room.id; // 목록에 이미 roomId가 있다면 그대로 사용
      if (!roomId) return;
      this.$router.push({ name: 'chatRoom', params: { roomId } });
    },
    sendMessage() {
      if (!this.newMessage.trim()) return;
      this.messages.push(this.newMessage);
      this.newMessage = '';
    },
    onSearchFriend(keyword) {
      this.searchKeyword = keyword;
    },
    goToSettings() {
      this.$router.push('/settings');
    },
    logout() {
      alert('로그아웃 되었습니다.');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.chat-layout {
  /* App.vue의 <v-main> 안에서 100% 채우기 */
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.menu-button {
  position: absolute;
  top: 10px;
  right: 20px;
}
</style>
