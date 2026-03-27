<!-- src/components/chat/ChatPanel.vue -->
<template>
  <div class="panel">
    <header class="header">
      <div class="title">{{ roomTitle }}</div>
      <button class="icon" @click="$router.push({ name: 'homeEmpty' })">✕</button>
    </header>

    <section class="messages" ref="list">
      <div v-if="loading" class="empty">불러오는 중...</div>
      <div v-else-if="messages.length === 0" class="empty">아직 메시지가 없습니다.</div>

      <div
          v-for="m in messages"
          :key="m.id"
          class="msg"
          :class="{ mine: m.mine }"
      >
        <!-- 상대 메시지만 프로필 표시 -->
        <div v-if="!m.mine" class="avatar">
          <img :src="m.profileImageUrl || defaultImage" alt="profile" />
        </div>

        <div class="msg-body">
          <!-- 상대 메시지만 이름 표시 -->
          <div v-if="!m.mine" class="name">{{ m.name }}</div>

          <div class="bubble">
            <div class="text">{{ m.text }}</div>
            <div class="meta">{{ format(m.at) }}</div>
          </div>
        </div>
      </div>
    </section>

    <footer class="composer">
      <input
          v-model="draft"
          class="input"
          placeholder="메시지를 입력하세요"
          @keyup.enter="send"
      />
      <button class="send" :disabled="!draft.trim()" @click="send">전송</button>
    </footer>
  </div>
</template>

<script>
import Api from '@/plugins/axios.js';
import { connectWebSocket, subscribe, sendMessage } from '@/services/ws-client.js';
import DefaultImage from '@/assets/default_image.png';

export default {
  name: 'ChatPanel',

  data() {
    return {
      roomTitle: '',
      messages: [],
      draft: '',
      unsub: null,
      roomId: '',
      loading: false,
      me: null,
      readTimer: null,
      pendingReadMessageId: null,
      defaultImage: DefaultImage,
    };
  },

  beforeMount() {
    if(this.unsub){
      // 구독된 상태라면 구독 취소

      // this.unsub = null;
    }


  },

  async mounted() {
    await this.loadMe();
    await this.loadRoom(this.$route.params.roomId);
  },

  computed: {
    currentRoomId() {
      return this.$route.params.roomId;
    },
  },

  watch: {
    async currentRoomId(nextId) {
      await this.loadRoom(nextId);
    },
  },

  methods: {
    // todo 채팅방에 들어올 때 내꺼 프로필을 한 번 더 조회함, 해당 부분도 업데이트를 시켜서 할 수 있을 거같음
    async loadMe() {
      try {
        const res = await Api.get('/v1/users/me/profile/summary');
        this.me = res.data;
      } catch (e) {
        console.error('내 정보 조회 실패', e);
      }
    },

    async loadRoom(roomId) {
      if (!roomId) {
        this.roomTitle = '';
        this.messages = [];
        this.roomId = '';
        this.cleanupSubscription();
        return;
      }

      try {
        this.loading = true;
        this.roomId = String(roomId);

        this.cleanupSubscription();

        const res = await Api.get(`/v1/chat-room/${roomId}/enter`);
        console.log('response:', res);

        this.roomTitle = res?.title ?? '채팅방';

        this.messages = (res?.messages ?? []).map((m) => ({
          id: m.id ?? m.messageId,
          name: m.senderNickname ?? m.sender?.senderNickname ?? '',
          text: m.content ?? m.text ?? '',
          at: m.createdAt ?? m.at ?? new Date().toISOString(),
          mine: m.mine ?? m.sender?.mine ?? false,
          profileImageUrl:
              m.profileImageUrl ??
              m.sender?.profileImageUrl ??
              this.defaultImage,
        }));

        await this.$nextTick();
        this.scrollToBottom();

        await connectWebSocket();

        this.unsub = subscribe(`/user/api/sub/chat/rooms/${roomId}`, (msg) => {
          console.log('실시간 수신:', msg);
          const mine = msg.sender?.mine ?? msg.mine ?? false;
          this.messages.push({
            id: msg.messageId ?? Date.now(),
            name: msg.sender?.senderNickname ?? '',
            text: msg.content ?? msg.text ?? '',
            at: msg.createdAt ?? new Date().toISOString(),
            mine: mine,
            profileImageUrl: msg.sender?.profileImageUrl ?? this.defaultImage,
          });

          this.$nextTick(() => this.scrollToBottom());

          // 내가 보낸 메시지는 굳이 READ 안 보내도 됨
          if (mine) {
            return;
          }

          const isActiveRoom = String(this.roomId) === String(roomId);
          const isVisibleTab = document.visibilityState === 'visible';

          if(!isVisibleTab){
            return;
          }
          this.sendReadDebounced(roomId, msg.messageId);
        });
      } catch (e) {
        console.error('채팅방 로드 실패', e);
        this.roomTitle = '';
        this.messages = [];
      } finally {
        this.loading = false;
      }
    },

    send() {
      const text = this.draft.trim();
      if (!text || !this.roomId) return;

      sendMessage('/api/pub/chat/message', {
        roomId: Number(this.roomId),
        messageType: 'TEXT',
        messageContent: text,
      });

      this.draft = '';
      this.$nextTick(() => this.scrollToBottom());
    },

    sendReadDebounced(roomId, messageId) { // 실시간으로 read event
      this.pendingReadMessageId = messageId;
      console.log("pending read message id: ", pendingReadMessageId);
      if (this.readTimer) {
        clearTimeout(this.readTimer);
      }

      this.readTimer = setTimeout(() => {
        sendMessage('/api/pub/chat/read', {
          roomId,
          messageId: this.pendingReadMessageId,
        });

        this.readTimer = null;
      }, 200);
    },

    cleanupSubscription() {
      if (!this.unsub) return;

      if (typeof this.unsub === 'function') {
        this.unsub();
      } else if (typeof this.unsub.unsubscribe === 'function') {
        this.unsub.unsubscribe();
      }

      this.unsub = null;
    },

    scrollToBottom() {
      const el = this.$refs.list;
      if (!el) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      });
    },

    format(iso) {
      const d = new Date(iso);
      return Number.isNaN(d) ? '' : d.toLocaleString();
    },
  },

  beforeUnmount() {
    this.cleanupSubscription();
  },
};
</script>

<<style scoped>
.panel {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  min-height: 0;
}

.header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e9ecef;
}

.title {
  font-weight: 600;
}

.icon {
  background: transparent;
  border: none;
  cursor: pointer;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: #f7f7f8;
  overscroll-behavior: contain;
}

.empty {
  color: #868e96;
  padding: 20px;
  text-align: center;
}

.msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0;
}

.msg.mine {
  justify-content: flex-end;
}

.avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  margin-top: 2px;
}

.avatar img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.msg-body {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  padding-left: 2px;
}

.bubble {
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.msg.mine .msg-body {
  align-items: flex-end;
}

.msg.mine .bubble {
  background: #4dabf7;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg:not(.mine) .bubble {
  border-bottom-left-radius: 4px;
}

.text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}

.meta {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.composer {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e9ecef;
  background: #fff;
}

.input {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 10px;
}

.send {
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  background: #4dabf7;
  color: #fff;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>