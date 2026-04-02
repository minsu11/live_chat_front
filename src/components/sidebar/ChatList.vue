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
import { connectWebSocket, subscribe } from '@/services/ws-client.js';

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
  props: {
    pageSize: { type: Number, default: 50 },
    activeRoomId: { type: [Number, String], default: null },
  },
  data() {
    return {
      defaultProfile,
      items: [],
      cursor: null,
      loading: false,
      observer: null,
      error: null,
      summarySubscription: null,
      refreshTimer: null,
    };
  },
  computed: {
    hasNext() {
      return !!this.cursor;
    },
  },
  async mounted() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });

    this.observer.observe(this.$refs.sentinel);

    await this.loadInitial();
    await this.subscribeRoomSummary();
  },
  beforeUnmount() {
    if (this.observer) {
      console.log("observer disconnect");
      this.observer.disconnect();
    }

    if (this.summarySubscription) {
      if (typeof this.summarySubscription.unsubscribe === 'function') {
        this.summarySubscription.unsubscribe();
      } else if (typeof this.summarySubscription === 'function') {
        this.summarySubscription();
      }
      this.summarySubscription = null;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
  methods: {
    mapRoom(it) {
      return {
        id: it.roomId ?? it.chatRoomId ?? it.id,
        title: it.name ?? it.roomName ?? it.title,
        unreadCount: it.unreadCount ?? 0,
        profile: it.profileUrl ?? null,
        lastMessageAt: it.lastMessageAt ?? null,
        lastMessageAtDisplay: formatTime(it.lastMessageAt),
        lastMessagePreview: it.lastMessagePreview ?? null,
        raw: it,
      };
    },

    async loadInitial() {
      this.loading = true;
      this.error = null;

      try {
        const { items, next } = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });

        this.items = items.map(this.mapRoom);
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

    async loadMore() {
      if (!this.hasNext || this.loading) return;

      this.loading = true;
      this.error = null;

      try {
        const { items, next } = await fetchChats({
          limit: this.pageSize,
          cursor: this.cursor,
        });

        const mapped = items.map(this.mapRoom);
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

      if (this.observer && this.$refs.sentinel) {
        this.observer.unobserve(this.$refs.sentinel);
        this.observer.observe(this.$refs.sentinel);
      }

      await this.loadInitial();
    },

    scheduleRefresh() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      this.refreshTimer = setTimeout(() => {
        this.refresh();
        this.refreshTimer = null;
      }, 150);
    },

    async subscribeRoomSummary() {
      try {
        if (this.summarySubscription) {
          return;
        }

        await connectWebSocket();

        const destination = `/user/api/sub/chat/summary`;

        this.summarySubscription = subscribe(destination, (event) => {
          this.applySummaryEvent(event);
        });

        if (!this.summarySubscription) {
          console.warn('summary 구독 실패: subscription 생성 실패');
          return;
        }

        console.log('summary 구독 완료:', destination);
      } catch (e) {
        console.error('summary 구독 실패', e);
      }
    },

    applySummaryEvent(event) {
      const roomId = event?.roomId;
      if (!roomId) return;

      const normalizedRoomId = String(roomId);
      const index = this.items.findIndex((item) => String(item.id) === normalizedRoomId);

      if (index === -1) {
        this.scheduleRefresh();
        return;
      }

      const existing = this.items[index];
      const isActiveRoom =
          this.activeRoomId != null && String(this.activeRoomId) === normalizedRoomId;

      const updated = {
        ...existing,
        unreadCount: isActiveRoom ? 0 : (event.unreadCount ?? existing.unreadCount ?? 0),
        lastMessagePreview: event.lastMessagePreview ?? existing.lastMessagePreview,
        lastMessageAt: event.lastMessageAt ?? existing.lastMessageAt,
        lastMessageAtDisplay: formatTime(event.lastMessageAt ?? existing.lastMessageAt),
      };

      const copied = [...this.items];
      copied.splice(index, 1);
      copied.unshift(updated);

      this.items = copied;
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