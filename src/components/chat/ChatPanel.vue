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
        <div class="bubble">
          <div class="text">{{ m.text }}</div>
          <div class="meta">{{ format(m.at) }}</div>
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
    };
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

        this.roomTitle = res?.title ?? '채팅방';

        this.messages = (res?.messages ?? []).map((m) => ({
          id: m.id,
          text: m.messageContent ?? m.text ?? '',
          at: m.createdAt ?? m.at ?? new Date().toISOString(),
          mine: Number(m.senderId) === Number(this.me?.id),
        }));
        console.log(this.roomTitle);

        await this.$nextTick();
        this.scrollToBottom();

        await connectWebSocket();
        // todo 임시 주석 차단
        // this.unsub = subscribe(`/sub/chat/rooms/${roomId}`, (msg) => {
        //   this.messages.push({
        //     id: msg.id ?? Date.now(),
        //     text: msg.messageContent ?? msg.text ?? '',
        //     at: msg.createdAt ?? new Date().toISOString(),
        //     mine: Number(msg.senderId) === Number(this.me?.id),
        //   });
        //
        //   this.$nextTick(() => this.scrollToBottom());
        // });
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

      sendMessage('/pub/chat/message', {
        roomId: Number(this.roomId),
        messageType: 'TALK',
        messageContent: text,
      });

      this.messages.push({
        id: Date.now(),
        text,
        at: new Date().toISOString(),
        mine: true,
      });

      this.draft = '';
      this.$nextTick(() => this.scrollToBottom());
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
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
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

<style scoped>
.panel { height:100%; display:flex; flex-direction:column; background:#fff; }
.header { height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid #e9ecef; }
.title { font-weight:600; }
.icon { background:transparent; border:none; cursor:pointer; }
.messages { flex:1; overflow-y:auto; padding:12px; }
.empty { color:#868e96; padding:20px; text-align:center; }
.msg { display:flex; margin:6px 0; }
.msg.mine { justify-content:flex-end; }
.bubble { max-width:65%; padding:8px 10px; border-radius:10px; background:#f1f3f5; }
.msg.mine .bubble { background:#4dabf7; color:#fff; }
.text { white-space:pre-wrap; word-break:break-word; }
.meta { font-size:11px; opacity:.7; margin-top:4px; text-align:right; }
.composer { display:flex; gap:8px; padding:10px; border-top:1px solid #e9ecef; }
.input { flex:1; border:1px solid #dee2e6; border-radius:8px; padding:8px 10px; }
.send { border:none; border-radius:8px; padding:0 14px; background:#4dabf7; color:#fff; cursor:pointer; }
.send:disabled { opacity:.6; cursor:default; }
</style>