<template>
  <v-app>
    <div class="home-wrapper">
      <!-- 왼쪽 브랜드 패널 -->
      <div class="left-panel">
        <h1 class="title">ChatOn</h1>
        <p class="subtitle">다시 만나 반가워요!<br />채팅을 시작해볼까요?</p>
        <div class="bubbles">
          <div class="bubble bubble-1"></div>
          <div class="bubble bubble-2"></div>
          <div class="bubble bubble-3"></div>
        </div>
      </div>

      <!-- 오른쪽 메인 컨텐츠 -->
      <div class="right-panel">
        <!-- 메인 메뉴 -->
        <div v-if="currentView === ''" class="menu-box">
          <h2>메인 메뉴</h2>
          <v-btn block color="primary" class="mb-4" @click="showFriends">
            👥 친구 목록
          </v-btn>
          <v-btn block color="secondary" class="mb-4" @click="showChats">
            💬 대화방 목록
          </v-btn>
        </div>

        <!-- 친구 목록 -->
        <div v-if="currentView === 'friends'" class="list-container">
          <h3>친구 목록</h3>
          <div v-if="friends.length === 0" class="empty-list">
            <img src="@/assets/cute-character.png" alt="Empty" width="80" />
            <p>아무도 없습니다 🐰</p>
          </div>
          <ul v-else>
            <li v-for="(friend, idx) in friends" :key="idx" @click="startChat(friend)">
              {{ friend.name }}
            </li>
          </ul>
        </div>

        <!-- 대화방 목록 -->
        <div v-if="currentView === 'chats'" class="list-container">
          <h3>대화방 목록</h3>
          <div v-if="chats.length === 0" class="empty-list">
            <img src="@/assets/cute-character.png" alt="Empty" width="80" />
            <p>아무도 없습니다 🐰</p>
          </div>
          <ul v-else>
            <li v-for="(chat, idx) in chats" :key="idx" @click="openChat(chat)">
              {{ chat.title }}
            </li>
          </ul>
        </div>

        <!-- 채팅 화면 -->
        <div v-if="currentView === 'chatRoom'" class="chat-room">
          <h3>{{ activeChat.title }}</h3>
          <div class="messages">
            <div
                v-for="(msg, index) in activeChat.messages"
                :key="index"
                class="message"
                :class="{ mine: msg.sender === 'me' }"
            >
              <strong>{{ msg.sender }}</strong>: {{ msg.text }}
            </div>
          </div>
          <div class="chat-input">
            <v-text-field
                v-model="newMessage"
                label="메시지를 입력하세요"
                dense
                outlined
                hide-details
                @keyup.enter="sendMessage"
            />
            <v-btn color="primary" @click="sendMessage">전송</v-btn>
          </div>
          <v-btn text @click="backToChats">← 목록으로</v-btn>
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import '@/assets/css/chat-home.css'

export default {
  name: 'HomePage',
  data() {
    return {
      currentView: '', // '', 'friends', 'chats', 'chatRoom'
      friends: [
        { name: '철수' },
        { name: '영희' }
      ],
      chats: [
        { title: '철수와의 대화', messages: [] },
        { title: '영희와의 대화', messages: [] }
      ],
      activeChat: { title: '', messages: [] },
      newMessage: ''
    }
  },
  methods: {
    showFriends() {
      this.currentView = 'friends';
    },
    showChats() {
      this.currentView = 'chats';
    },
    startChat(friend) {
      this.activeChat = {
        title: `${friend.name}와의 대화`,
        messages: []
      }
      this.currentView = 'chatRoom';
    },
    openChat(chat) {
      this.activeChat = chat;
      this.currentView = 'chatRoom';
    },
    sendMessage() {
      if (!this.newMessage.trim()) return;
      this.activeChat.messages.push({
        sender: 'me',
        text: this.newMessage
      });
      this.newMessage = '';
    },
    backToChats() {
      this.currentView = 'chats';
    }
  }
}
</script>

<style scoped>

</style>
