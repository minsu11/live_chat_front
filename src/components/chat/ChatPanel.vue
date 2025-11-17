<!-- src/components/chat/ChatPanel.vue -->
<template>
  <div class="panel">
    <header class="header">
      <div class="title">{{ roomTitle }}</div>
      <button class="icon" @click="$router.push({ name: 'homeEmpty' })">✕</button>
    </header>

    <section class="messages" ref="list">
      <div v-for="m in messages" :key="m.id" class="msg" :class="{ mine: m.mine }">
        <div class="bubble">
          <div class="text">{{ m.text }}</div>
          <div class="meta">{{ format(m.at) }}</div>
        </div>
      </div>
    </section>

    <footer class="composer">
      <input v-model="draft" class="input" placeholder="메시지를 입력하세요" @keyup.enter="send" />
      <button class="send" :disabled="!draft.trim()" @click="send">전송</button>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'ChatPanel',
  data() {
    return { roomTitle: '', messages: [], draft: '', unsub: null };
  },
  async mounted() { await this.loadRoom(this.$route.params.roomId); },
  watch: {
    '$route.params.roomId': { async handler(nextId) { await this.loadRoom(nextId); } },
  },
  methods: {
    async loadRoom(roomId) {
      if (!roomId) { this.roomTitle = ''; this.messages = []; return; }
      // 방 메타/히스토리 로드(API 연결로 교체)
      this.roomTitle = `Room #${roomId}`;
      this.messages = [];
      this.$nextTick(() => { const el = this.$refs.list; if (el) el.scrollTop = el.scrollHeight; });

      // 실시간 구독 연결/해제 지점
      // this.unsub?.(); this.unsub = subscribe(roomId, (msg)=>{ this.messages.push(msg); ... });
    },
    send() {
      const text = this.draft.trim(); if (!text) return;
      // await api.post(`/v1/chat-rooms/${this.$route.params.roomId}/messages`, { text })
      this.messages.push({ id: Date.now(), text, at: new Date().toISOString(), mine: true });
      this.draft = '';
      this.$nextTick(() => { const el = this.$refs.list; if (el) el.scrollTop = el.scrollHeight; });
    },
    format(iso) { const d = new Date(iso); return Number.isNaN(d) ? '' : d.toLocaleString(); },
  },
  beforeUnmount() { if (this.unsub) this.unsub(); },
};
</script>

<style scoped>
.panel { height:100%; display:flex; flex-direction:column; background:#fff; }
.header { height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid #e9ecef; }
.title { font-weight:600; }
.icon { background:transparent; border:none; cursor:pointer; }
.messages { flex:1; overflow-y:auto; padding:12px; }
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
