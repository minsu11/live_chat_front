<template>
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
</template>

<script>
export default {
  name: "ChatRoom",
  props: {
    selectedChat: String,
    messages: Array,
  },
  data() {
    return {
      newMessage: "",
    };
  },
  watch: {
    messages() {
      this.$nextTick(() => this.scrollToBottom());
    },
  },
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return;
      this.$emit("send-message", this.newMessage);
      this.newMessage = "";
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
  },
};
</script>

<style scoped>
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
