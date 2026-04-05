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
          v-for="m in decoratedMessages"
          :key="m.id"
          class="msg"
          :class="{ mine: m.mine, compact: m.groupedTop }"
      >
        <!-- 상대 메시지: 마지막 메시지일 때만 아바타 -->
        <div v-if="!m.mine" class="avatar-slot">
          <div v-if="m.showAvatar" class="avatar">
            <img :src="m.profileImageUrl || defaultImage" alt="profile" />
          </div>
        </div>

        <div class="msg-body" :class="{ mine: m.mine }">
          <!-- 상대 메시지: 묶음 첫 메시지일 때만 이름 -->
          <div v-if="m.showName" class="name">{{ m.name }}</div>

          <div class="message-row" :class="{ mine: m.mine }">
            <!-- 내 메시지: unread/time을 버블 왼쪽 -->
            <template v-if="m.mine && m.showMeta">
              <transition name="unread-pop">
                <div
                    v-if="m.unreadCount > 0"
                    :key="`u-${m.id}-${m.unreadCount}`"
                    class="unread-mark left"
                >
                  {{ m.unreadCount }}
                </div>
              </transition>
              <div class="meta">{{ format(m.at) }}</div>
            </template>

            <div
                class="bubble"
                :class="{
            mine: m.mine,
            groupedTop: m.groupedTop,
            groupedBottom: m.groupedBottom
          }"
            >
              <div class="text">{{ m.text }}</div>
            </div>

            <!-- 상대 메시지: unread/time을 버블 오른쪽 -->
            <template v-if="!m.mine && m.showMeta">
              <div class="meta">{{ format(m.at) }}</div>
              <transition name="unread-pop">
                <div
                    v-if="m.unreadCount > 0"
                    :key="`u-${m.id}-${m.unreadCount}`"
                    class="unread-mark right"
                >
                  {{ m.unreadCount }}
                </div>
              </transition>
            </template>
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
      lastSentReadMessageId: null,
      defaultImage: DefaultImage
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

    decoratedMessages() {
      return this.messages.map((m, index, arr) => {
        const prev = arr[index - 1];
        const next = arr[index + 1];

        const samePrev = this.isSameGroup(prev, m);
        const sameNext = this.isSameGroup(m, next);

        return {
          ...m,
          groupedTop: samePrev,
          groupedBottom: sameNext,
          showName: !m.mine && !samePrev,
          showAvatar: !m.mine && !sameNext,
          showMeta: !sameNext,
        };
      });
    },
  },

  watch: {
    async currentRoomId(newRoomId, oldRoomId) {
      if (String(newRoomId) === String(oldRoomId)) {
        return;
      }

      await this.loadRoom(newRoomId);
    }
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

    isSameGroup(a, b) {
      if (!a || !b) return false;
      if (a.mine !== b.mine) return false;

      const aSender = a.senderUserUuid ?? a.name;
      const bSender = b.senderUserUuid ?? b.name;

      if (aSender !== bSender) return false;

      return this.isSameMinute(a.at, b.at);
    },

    isSameMinute(a, b) {
      const da = new Date(a);
      const db = new Date(b);

      if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) {
        return false;
      }

      return Math.abs(da.getTime() - db.getTime()) < 60 * 1000;
    },

    async loadRoom(roomId) {
      if (!roomId) {
        this.roomTitle = '';
        this.messages = [];
        this.roomId = '';
        this.lastSentReadMessageId = null;
        this.cleanupSubscription();
        return;
      }

      const nextRoomId = String(roomId);

      try {
        this.loading = true;
        this.lastSentReadMessageId = null;
        this.pendingReadMessageId = null;
        this.pendingVisibleReadMessageId = null;

        const res = await Api.get(`/v1/chat-room/${nextRoomId}/enter`);
        const data = res;

        // 여기서 다른 방으로 또 이동했으면 버림
        if (String(this.currentRoomId) !== nextRoomId) {
          return;
        }

        // 이 시점에 실제 전환
        this.cleanupSubscription();

        this.roomId = nextRoomId;
        this.roomTitle = data?.title ?? '채팅방';
        this.messages = (data?.messages ?? []).map(this.mapMessage);

        await this.$nextTick();
        this.scrollToBottom();

        this.unsub = subscribe(`/user/api/sub/chat/rooms/${nextRoomId}`, (msg) => {
          if (String(this.roomId) !== nextRoomId) return;

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

          if (mine) return;
          if (document.visibilityState !== 'visible') {
            this.pendingVisibleReadMessageId = messageId;
            return;
          }

          this.sendReadDebounced(nextRoomId, messageId);
        });

        this.readUnsub = subscribe(`/user/api/sub/chat/rooms/${nextRoomId}/read`, (event) => {
          if (String(this.roomId) !== nextRoomId) return;
          this.applyReadUpdated(event);
        });

      } catch (e) {
        console.error('채팅방 로드 실패', e);
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

      if(!messageId) return;

      if(
          this.lastSentReadMessageId !=null &&
          Number(messageId) <= Number(this.lastSentReadMessageId)
      ){
        return;
      }

      this.pendingReadMessageId = messageId;
      console.log('pending read message id:', this.pendingReadMessageId);

      if (this.readTimer) {
        clearTimeout(this.readTimer);
      }

      this.readTimer = setTimeout(() => {
        const targetMessageId = this.pendingReadMessageId;

        if(!targetMessageId){
          this.readTimer = null;
          return;
        }

        if(
            this.lastSentReadMessageId != null &&
            Number(targetMessageId) <= Number(this.lastSentReadMessageId)
        ){
          this.readTimer = null;
          return;
        }


        sendMessage('/api/pub/chat/read', {
          roomId: Number(roomId),
          messageId: this.pendingReadMessageId,
        });

        this.lastSentReadMessageId = targetMessageId;
        this.readTimer = null;
      }, 200);
    },
    applyReadUpdated(event) {
      console.log("apply read updated start");
      console.log("event: ", event);

      const updatedMap = new Map(
          (event.updatedMessages ?? []).map((m) => [
            String(m.messageId),   // 🔥 문자열로 통일
            m.unreadCount
          ])
      );

      this.messages = this.messages.map((m) => {
        const unreadCount = updatedMap.get(String(m.id));
        // console.log("unread count :", unreadCount)
        if (unreadCount == null) {
          return m;
        }

        return {
          ...m,
          unreadCount,
        };
      });
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
  align-items: flex-end;
  gap: 8px;
  margin: 10px 0;
}

.msg.compact {
  margin-top: 2px;
}

.msg.mine {
  justify-content: flex-end;
}

.avatar-slot {
  width: 34px;
  flex-shrink: 0;
}

.avatar {
  width: 34px;
  height: 34px;
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

.msg-body.mine {
  align-items: flex-end;
}

.name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  padding-left: 2px;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.message-row.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 260px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.bubble.mine {
  background: #4dabf7;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble:not(.mine) {
  border-bottom-left-radius: 4px;
}

.bubble.groupedTop:not(.mine) {
  border-top-left-radius: 6px;
}

.bubble.groupedBottom:not(.mine) {
  border-bottom-left-radius: 6px;
}

.bubble.mine.groupedTop {
  border-top-right-radius: 6px;
}

.bubble.mine.groupedBottom {
  border-bottom-right-radius: 6px;
}

.text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}

.meta {
  font-size: 11px;
  color: #868e96;
  white-space: nowrap;
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

.unread-mark {
  font-size: 12px;
  color: #f03e3e;
  font-weight: 600;
  white-space: nowrap;
}

.unread-mark.left {
  margin-right: 4px;
}

.unread-mark.right {
  margin-left: 4px;
}

.unread-pop-enter-active {
  animation: pop 0.2s ease;
}

.unread-pop-leave-active {
  transition: all 0.18s ease;
}

.unread-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@keyframes pop {
  0% {
    transform: scale(0.7);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>