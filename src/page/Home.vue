// HomePage.vue
<template>
  <v-app>
    <div class="chat-layout">
      <Sidebar
          :current-view="currentView"
          :friends="friends"
          :chats="chats"
          @changeView="changeView"
          @openChat="openChat"
      />
      <ChatArea
          :selected-chat="selectedChat"
          :messages="messages"
          v-model:newMessage="newMessage"
          @sendMessage="sendMessage"
      />

      <!-- 점 세 개 버튼 + 메뉴 -->
      <MenuDropdown />


    </div>
  </v-app>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue';
import ChatArea from '@/components/ChatArea.vue';
import defaultProfile from '@/assets/default_image.png';
import MenuDropdown from "@/components/MenuDropdown.vue";

export default {
  name: 'HomePage',
  components: { Sidebar, ChatArea , MenuDropdown},
  data() {
    return {
      currentView: 'friends',
      defaultProfile,
      friends: [
        { name: '철수', profile: '' },
        { name: '영희', profile: '' },
      ],
      chats: [
        { title: '철수와의 대화', profile: 'https://example.com/chulsoo.png' },
      ],
      selectedChat: '',
      messages: [],
      newMessage: '',
    };
  },
  methods: {
    changeView(view) {
      this.currentView = view;
    },
    openChat(item, type) {
      // 채팅방 열기
      if (type === 'friend') {
        this.selectedChat = item.name;
        this.messages = [`${item.name}님과 대화를 시작합니다.`];
      } else if (type === 'chat') {
        this.selectedChat = item.title;
        this.messages = ['안녕!', '오랜만이야'];
      }
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
  display: flex;
  height: 100vh;
}

.menu-button {
  position: absolute;
  top: 10px;
  right: 20px;
}
</style>
