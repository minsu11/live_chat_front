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
        <div v-if="!m.mine" class="avatar">
          <img :src="m.profileImageUrl || defaultImage" alt="profile" />
        </div>

        <div class="msg-body">
          <div v-if="!m.mine" class="name">{{ m.name }}</div>

          <div class="bubble-wrap" :class="{ mine: m.mine }">
            <div v-if="m.mine && m.unreadCount > 0" class="unread-mark">
              {{ m.unreadCount }}
            </div>
            <div class="bubble">
              <div class="text">{{ m.text }}</div>
              <div class="meta">{{ format(m.at) }}</div>
            </div>
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
      readUnsub: null,
      roomId: '',
      loading: false,
      me: null,

      readTimer: null,
      pendingReadMessageId: null,
      pendingVisibleReadMessageId: null,
      isReloadingMessages: false,

      // readerUserId -> lastReadMessageId
      lastReadByUser: {},
      roomMemberCount: 0,

      defaultImage: DefaultImage,
    };
  },

  async mounted() {
    await this.loadMe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
    async loadMe() {
      try {
        const res = await Api.get('/v1/users/me/profile/summary');
        this.me = res?.data ?? res;
        console.log("me: ", this.me);
      } catch (e) {
        console.error('내 정보 조회 실패', e);
      }
    },
    mapMessage(m) {
      return {
        id: m.id ?? m.messageId,
        name: m.senderNickname ?? m.sender?.senderNickname ?? '',
        text: m.content ?? m.text ?? '',
        at: m.createdAt ?? m.at ?? new Date().toISOString(),
        mine: m.mine ?? false,
        unreadCount: m.unreadCount ?? 0,
        senderUserUuid: m.sender?.senderUuid ?? m.senderUserUuid ?? null,
        profileImageUrl:
            m.profileImageUrl ??
            m.sender?.profileImageUrl ??
            this.defaultImage,
      };
    },

    async reloadRoomMessagesOnly(roomId) {
      if (this.isReloadingMessages) return;
      this.isReloadingMessages = true;
      console.log("reloadRoomMessagesOnly", roomId);

      try {
        const res = await Api.get(`/v1/chat-room/${roomId}/messages`);
        console.log("reload success")
        const data = res?.data ?? res;

        this.roomTitle = data?.title ?? '채팅방';
        this.messages = (data?.messages ?? []).map(this.mapMessage);
      } finally {
        this.isReloadingMessages = false;
      }
    },

    async loadRoom(roomId) {
      if (!roomId) {
        this.roomTitle = '';
        this.messages = [];
        this.roomId = '';
        this.lastReadByUser = {};
        this.cleanupSubscription();
        return;
      }

      try {
        this.loading = true;
        this.roomId = String(roomId);
        this.lastReadByUser = {};
        this.pendingReadMessageId = null;
        this.pendingVisibleReadMessageId = null;

        this.cleanupSubscription();

        const res = await Api.get(`/v1/chat-room/${roomId}/enter`);
        const data = res;

        console.log('enter response:', data);

        this.roomTitle = data?.title ?? '채팅방';

        this.messages = (data?.messages ?? []).map(this.mapMessage);

        console.log("sender uuid: ", this.messages);

        await this.$nextTick();
        this.scrollToBottom();

        await connectWebSocket();

        // 메시지 구독
        this.unsub = subscribe(`/user/api/sub/chat/rooms/${roomId}`, (msg) => {
          console.log('실시간 메시지 수신:', msg);

          const mine = msg.sender?.mine ?? msg.mine ?? false;
          const messageId = msg.messageId ?? Date.now();

          this.messages.push({
            id: messageId,
            name: msg.sender?.senderNickname ?? '',
            text: msg.content ?? msg.text ?? '',
            at: msg.createdAt ?? new Date().toISOString(),
            mine,
            unreadCount: msg.unreadCount ?? 0,
            senderUserUuid: msg.sender?.senderUserId ?? msg.sender?.userId ?? null,
            profileImageUrl: msg.sender?.profileImageUrl ?? this.defaultImage,
          });

          this.$nextTick(() => this.scrollToBottom());

          // 내가 보낸 메시지는 서버에서 이미 sender read 처리됨
          if (mine) {
            return;
          }

          // 현재 room이 맞고, 탭이 visible이면 read 전송
          if (String(this.roomId) !== String(roomId)) {
            return;
          }

          if (document.visibilityState !== 'visible') {
            this.pendingVisibleReadMessageId = messageId;
            return;
          }

          this.sendReadDebounced(roomId, messageId);
        });

        // 읽음 업데이트 구독
        this.readUnsub = subscribe(`/user/api/sub/chat/rooms/${roomId}/read`, async (event) => {
          console.log('READ_UPDATED 수신:', event);

          if (String(this.roomId) !== String(roomId)) {
            return;
          }

          await this.reloadRoomMessagesOnly(roomId);
        });
      } catch (e) {
        console.error('채팅방 로드 실패', e);
        this.roomTitle = '';
        this.messages = [];
        this.lastReadByUser = {};
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

    sendReadDebounced(roomId, messageId) {
      this.pendingReadMessageId = messageId;
      console.log('pending read message id:', this.pendingReadMessageId);

      if (this.readTimer) {
        clearTimeout(this.readTimer);
      }

      this.readTimer = setTimeout(() => {
        sendMessage('/api/pub/chat/read', {
          roomId: Number(roomId),
          messageId: this.pendingReadMessageId,
        });

        this.readTimer = null;
      }, 200);
    },

    handleVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        return;
      }

      if (!this.pendingVisibleReadMessageId || !this.roomId) {
        return;
      }

      this.sendReadDebounced(this.roomId, this.pendingVisibleReadMessageId);
      this.pendingVisibleReadMessageId = null;
    },

    cleanupSubscription() {
      if (this.unsub) {
        if (typeof this.unsub === 'function') {
          this.unsub();
        } else if (typeof this.unsub.unsubscribe === 'function') {
          this.unsub.unsubscribe();
        }
        this.unsub = null;
      }

      if (this.readUnsub) {
        if (typeof this.readUnsub === 'function') {
          this.readUnsub();
        } else if (typeof this.readUnsub.unsubscribe === 'function') {
          this.readUnsub.unsubscribe();
        }
        this.readUnsub = null;
      }
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
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
    },

  },

  beforeUnmount() {
    this.cleanupSubscription();

    if (this.readTimer) {
      clearTimeout(this.readTimer);
      this.readTimer = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },
};
</script>

<style scoped>
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

.bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.bubble-wrap.mine {
  justify-content: flex-end;
}

.read-mark {
  font-size: 11px;
  color: #868e96;
  white-space: nowrap;
  margin-bottom: 4px;
}

.unread-mark {
  font-size: 12px;
  color: #f03e3e;
  white-space: nowrap;
  margin-bottom: 4px;
  font-weight: 600;
}
</style>