<template>
  <v-app>
    <div class="chat-layout">
      <!-- 왼쪽 사이드바 -->
      <aside class="sidebar">
        <!-- 로고 -->
        <h2 class="logo">ChatOn</h2>

        <!-- 메뉴 버튼 -->
        <div class="menu-buttons">
          <v-btn
              small
              rounded
              :color="currentView === 'friends' ? '#4dabf7' : '#f1f3f5'"
              class="menu-btn"
              @click="currentView = 'friends'"
          >
            👥 친구
          </v-btn>
          <v-btn
              small
              rounded
              :color="currentView === 'chats' ? '#38d9a9' : '#f1f3f5'"
              class="menu-btn"
              @click="currentView = 'chats'"
          >
            💬 대화방
          </v-btn>
        </div>

        <!-- 목록 -->
        <div class="list-container">
          <!-- 친구 목록 -->
          <template v-if="currentView === 'friends'">
            <p class="list-title">친구 목록</p>
            <ul v-if="friends.length > 0">
              <li
                  v-for="(friend, idx) in friends"
                  :key="idx"
                  @click="openChat(friend, 'friend')"
                  class="list-item"
              >
                <img :src="friend.profile || defaultProfile" class="profile-img" />
                {{ friend.name }}
              </li>
            </ul>
            <p v-else class="empty-text">친구가 없습니다 🐰</p>
          </template>

          <!-- 대화방 목록 -->
          <template v-if="currentView === 'chats'">
            <p class="list-title">대화방 목록</p>
            <ul v-if="chats.length > 0">
              <li
                  v-for="(chat, idx) in chats"
                  :key="idx"
                  @click="openChat(chat, 'chat')"
                  class="list-item"
              >
                <img :src="chat.profile || defaultProfile" class="profile-img" />
                {{ chat.title }}
              </li>
            </ul>
            <p v-else class="empty-text">대화방이 없습니다 🐰</p>
          </template>
        </div>
      </aside>

      <!-- 오른쪽 채팅창 -->
      <main class="chat-area">
        <div v-if="!selectedChat" class="empty-chat">
          채팅을 선택해주세요 💬
        </div>
        <div v-else class="chat-room">
          <h3 class="chat-title">{{ selectedChat }}</h3>
          <div class="chat-messages" ref="messagesContainer">
            <p v-for="(msg, idx) in messages" :key="idx" class="message">
              {{ msg }}
            </p>
          </div>
          <div class="chat-input">
            <v-text-field
                v-model="newMessage"
                placeholder="메시지를 입력하세요..."
                dense
                outlined
                hide-details
                @keyup.enter="sendMessage"
            />
            <v-btn color="#4dabf7" @click="sendMessage">전송</v-btn>
          </div>
        </div>
      </main>
    </div>
  </v-app>
</template>

<script>
import defaultProfile from '@/assets/default_image.png' // 기본 이미지 import

export default {
  name: "ChatPage",
  data() {
    return {
      currentView: "friends",
      defaultProfile, // 기본 프로필 이미지
      friends: [
        { name: "철수", profile: "" },
        { name: "영희", profile: "" }
      ],
      chats: [
        { title: "철수와의 대화", profile: "https://example.com/chulsoo.png" }
      ],
      selectedChat: "",
      messages: [],
      newMessage: ""
    };
  },
  methods: {
    openChat(item, type) {
      if (type === "friend") {
        this.selectedChat = item.name;
        this.messages = [`${item.name}님과 대화를 시작합니다.`];
      } else if (type === "chat") {
        this.selectedChat = item.title;
        this.messages = ["안녕!", "오랜만이야"];
      }
      this.scrollToBottom();
    },
    sendMessage() {
      if (!this.newMessage.trim()) return;
      this.messages.push(this.newMessage);
      this.newMessage = "";
      this.$nextTick(() => this.scrollToBottom());
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
};
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #e9ecef;
  padding: 15px;
  display: flex;
  flex-direction: column;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #4dabf7;
  text-align: center;
}
.menu-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 15px;
}
.menu-btn {
  font-size: 13px;
  padding: 6px 12px;
  min-width: auto !important;
}
.list-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}
.list-container {
  flex: 1;
  overflow-y: auto;
}
.list-item {
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.list-item:hover {
  background: #f1f3f5;
}
.profile-img {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  margin-right: 8px;
}
.empty-text {
  font-size: 13px;
  color: #868e96;
  text-align: center;
  margin-top: 20px;
}
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.empty-chat {
  margin: auto;
  font-size: 16px;
  color: #868e96;
}
.chat-room {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}
.chat-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}
.chat-messages {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  flex: 1;
  overflow-y: auto;
}
.message {
  margin-bottom: 5px;
}
.chat-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>
