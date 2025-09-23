<!-- src/components/search/SearchUserCard.vue -->
<template>
  <div class="card">
    <img :src="user.profile || defaultProfile" class="avatar" />
    <div class="info">
      <p class="name">{{ user.name }}</p>
    </div>

    <div class="actions">
      <button
          v-if="user.status === 'FRIENDS'"
          class="chat"
          @click="$emit('open-chat', user)"
      >
        대화하기
      </button>

      <button
          v-else
          class="add"
          :disabled="sending || user.status === 'PENDING'"
          @click="onAdd"
      >
        {{ user.status === 'PENDING' ? '요청됨' : (sending ? '요청중...' : '친구 추가') }}
      </button>

      <button class="profile" @click="$emit('open-profile', user)">프로필</button>
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import { requestFriend } from '@/assets/js/friend';

export default {
  name: 'SearchUserCard',
  props: { user: { type: Object, required: true } },
  data() {
    return { defaultProfile, sending: false };
  },
  methods: {
    async onAdd() {
      if (this.sending) return;
      this.sending = true;
      try {
        await requestFriend({ targetUserId: this.user.userId });
        // 낙관적 업데이트: 요청됨 상태로 전환
        this.$emit('update-status', { id: this.user.id, status: 'PENDING' });
      } catch (e) {
        console.error(e);
        alert('친구 요청에 실패했습니다.');
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>

<style scoped>
.card { display:flex; align-items:center; gap:10px; padding:10px; border:1px solid #e9ecef; border-radius:10px; }
.avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; }
.info { flex:1; overflow:hidden; }
.name { font-weight:600; margin:0; }
.id { color:#868e96; font-size:12px; margin:2px 0 0; }
.actions { display:flex; gap:8px; }
.add, .chat, .profile { padding:6px 10px; border:1px solid #dee2e6; background:#fff; border-radius:8px; cursor:pointer; }
.add:hover, .chat:hover, .profile:hover { background:#f8f9fa; }
.add:disabled { opacity:.6; cursor:not-allowed; }
.chat { border-color:#74c0fc; }
</style>
