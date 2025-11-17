<template>
  <div class="list-container">
    <p class="list-title">대화방 목록</p>

    <ul v-if="items.length > 0" class="list-ul">
      <li v-for="c in items" :key="c.id" class="list-li">
        <RoomCard
            :room="c"
            @open-chat="payload => $emit('open-chat', { item: payload, type: 'chat' })"
        />
      </li>
    </ul>

    <p v-else class="empty-text">대화방이 없습니다 🐰</p>

    <div v-if="loading" class="loading">로딩 중...</div>

    <button v-if="!loading && hasNext" class="more-btn" @click="loadMore">더 보기</button>

    <div ref="sentinel" style="height:1px;"></div>
  </div>
</template>

<script>
import RoomCard from '@/components/sidebar/RoomCard.vue';
import defaultProfile from '@/assets/default_image.png';
import { fetchChats } from '@/assets/js/chats.js';

function formatTime(isoOrLocalDateTime) {
  try {
    if (!isoOrLocalDateTime) return '';
    const d = new Date(isoOrLocalDateTime);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
}

export default {
  name: 'ChatList',
  components: { RoomCard },
  emits: ['open-chat'],
  props: { pageSize: { type: Number, default: 50 } },
  data() {
    return {
      defaultProfile,
      items: [],
      cursor: null,      // 서버가 준 next 커서만 보관
      loading: false,
      observer: null,
      error: null,
    };
  },
  computed: {
    // next 커서 존재 여부로 다음 페이지 판단
    hasNext() {
      return !!this.cursor;
    },
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
        const { items, next } = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });


        this.items = items.map((it) => ({
          id: it.roomId ?? it.id,
          title: it.name ?? it.roomName,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt ?? null,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          lastMessagePreview: it.lastMessagePreview ?? null,
          raw: it,
        }));

        this.cursor = next; // string | null

        // 더 없음이면 옵저버 해제
        if (!this.hasNext && this.observer) {
          this.observer.unobserve(this.$refs.sentinel);
        }
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
        const {items, next} = await fetchChats({
          limit: this.pageSize,
          cursor: this.cursor,
        });

        const mapped = items.map((it) => ({
          id: it.chatRoomId ?? it.id,
          title: it.name ?? it.title,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt ?? null,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          lastMessagePreview: it.lastMessagePreview ?? null,
          raw: it,
        }));

        this.items = [...this.items, ...mapped];
        this.cursor = next;

        if (!this.hasNext && this.observer) {
          this.observer.unobserve(this.$refs.sentinel);
        }
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
      if (this.observer) this.observer.observe(this.$refs.sentinel);
      await this.loadInitial();
    },
  },
};
</script>

<style scoped>
.list-container {
  flex: 1;
  overflow-y: auto;
}

.list-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.list-ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.list-li {
  margin: 0;
  padding: 0;
}

.empty-text {
  font-size: 13px;
  color: #868e96;
  text-align: center;
  margin-top: 20px;
}

.loading {
  font-size: 13px;
  color: #868e96;
  text-align: center;
  margin: 10px 0;
}

.more-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.more-btn:hover {
  background: #f8f9fa;
}
</style>
