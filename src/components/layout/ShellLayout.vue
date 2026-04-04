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
          @group-room-created="handleGroupRoomCreated"
          @toast="showToast"
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
import { fetchChats } from '@/assets/js/chats.js';
import { openExistingChat } from '@/assets/js/chat-navigation.js';

export default {
  name: 'HomePage',
  components: { Sidebar, MenuDropdown},
  data() {
    return {
      currentView: 'friends',
      defaultProfile,
      chats: [],
      selectedChat: '',
      me: null // 내 프로필 상태
    };
  },
  async created(){
    this.me = await api.get("v1/users/me/profile/summary")
    await this.loadChats();
    console.log("create me")
    console.log(this.me)

  },
  methods: {
    changeView(view) {
      this.currentView = view;
    },
    async openChat(payload) {
      try {
        let roomId;

        // 그룹 생성에서 온 경우
        if (typeof payload === 'number') {
          roomId = payload;
        }

        // 기존 채팅 클릭
        else if (payload?.item) {
          roomId = payload.item.id;
        }

        if (!roomId) {
          alert('채팅방 정보 없음');
          return;
        }

        // 🔥 핵심
        await openExistingChat(this.$router, roomId); // 이미 util 있음 :contentReference[oaicite:0]{index=0}

      } catch (e) {
        console.error(e);
      }
    },
    async loadChats() {
      const { items } = await fetchChats()
      this.chats = items
    },
    async handleGroupRoomCreated(roomId) {
      console.log("handleGroupRoomCreated start");
      await this.loadChats();
      await this.openChat(roomId);
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
