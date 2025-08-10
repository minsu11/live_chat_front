<!-- src/components/sidebar/ChatList.vue -->
<template>
  <div class="list-container">
    <p class="list-title">대화방 목록</p>

    <ul v-if="items.length > 0">
      <li
          v-for="(c, idx) in items"
          :key="idx"
          @click="$emit('open-chat', { item: c, type: 'chat' })"
          class="list-item"
      >
        <img :src="c.profile || defaultProfile" class="profile-img" />
        <div class="room-line">
          <div class="room-title">{{ c.title }}</div>
          <div class="room-sub">{{ c.lastMessageAtDisplay }}</div>
        </div>
      </li>
    </ul>

    <p v-else class="empty-text">대화방이 없습니다 🐰</p>

    <div v-if="loading" class="loading">로딩 중...</div>

    <button
        v-if="!loading && hasNext"
        class="more-btn"
        @click="loadMore"
    >
      더 보기
    </button>

    <div ref="sentinel" style="height:1px;"></div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import { fetchChats } from '@/assets/js/chats.js';

function formatTime(isoOrLocalDateTime) {
  try {
    const d = new Date(isoOrLocalDateTime);
    if (Number.isNaN(d.getTime())) return '';
    // 간단 포맷 (원하면 dayjs/date-fns로 교체)
    return d.toLocaleString();
  } catch {
    return '';
  }
}

export default {
  name: 'ChatList',
  emits: ['open-chat'],
  props: {
    pageSize: { type: Number, default: 50 },
  },
  data() {
    return {
      defaultProfile,
      items: [],
      cursor: null,
      hasNext: false,
      loading: false,
      observer: null,
      error: null,
    };
  },
  mounted() {
    this.loadInitial();

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });
    this.observer.observe(this.$refs.sentinel);
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },
  methods: {
    async loadInitial() {
      this.loading = true;
      this.error = null;
      try {
        const { items, next, hasNext } = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });
        this.items = items.map((it) => ({
          id: it.chatRoomId ?? it.id,     // ChatRoomListResponse 필드명에 맞게 조정
          title: it.name ?? it.title,
          profile: it.profileUrl ?? null, // 필요 시 서버에서 내려주거나 기본 처리
          lastMessageAt: it.lastMessageAt,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          raw: it,
        }));
        this.cursor = next;
        this.hasNext = hasNext;
      } catch (e) {
        this.error = e;
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async loadMore() {
      if (!this.hasNext || this.loading) return;
      this.loading = true;
      this.error = null;
      try {
        const { items, next, hasNext } = await fetchChats({
          limit: this.pageSize,
          cursor: this.cursor,
        });
        const mapped = items.map((it) => ({
          id: it.chatRoomId ?? it.id,
          title: it.name ?? it.title,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          raw: it,
        }));
        this.items = [...this.items, ...mapped];
        this.cursor = next;
        this.hasNext = hasNext;
      } catch (e) {
        this.error = e;
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async refresh() {
      this.cursor = null;
      this.items = [];
      this.hasNext = false;
      await this.loadInitial();
    },
  },
};
</script>

<style scoped>
.list-container { flex: 1; overflow-y: auto; }
.list-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
.list-item { padding: 8px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;}
.list-item:hover { background: #f1f3f5; }
.profile-img { width: 25px; height: 25px; border-radius: 50%; }
.room-line { display: flex; flex-direction: column; }
.room-title { font-weight: 600; }
.room-sub { font-size: 12px; color: #868e96; }
.empty-text { font-size: 13px; color: #868e96; text-align: center; margin-top: 20px; }
.loading { font-size: 13px; color: #868e96; text-align: center; margin: 10px 0; }
.more-btn { width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 6px; background: #fff; cursor: pointer; }
.more-btn:hover { background: #f8f9fa; }
</style>
