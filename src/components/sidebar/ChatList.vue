<template>
  <div class="list-container">
    <p class="list-title">대화방 목록</p>

    <ul v-if="items.length > 0" class="list-ul">
      <li v-for="c in items" :key="c.id" class="list-li">
        <RoomCard
            :room="c"
            @open-chat="payload => {
            console.log('chat list open-chat', payload)
            $emit('open-chat', { item: payload, type: 'chat' })
          }"
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

function toMillis(value) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export default {
  name: 'ChatList',
  components: { RoomCard },
  emits: ['open-chat'],
  props: {
    pageSize: { type: Number, default: 2 },
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
      chatListUpsertSubscription: null,
      refreshTimer: null,
    };
  },
  computed: {
    hasNext() {
      return !!this.cursor;
    },
  },
  watch: {
    activeRoomId: {
      immediate: true,
      handler(newRoomId) {
        if (newRoomId == null) return;

        const normalizedRoomId = String(newRoomId);
        const index = this.items.findIndex(item => String(item.id) === normalizedRoomId);

        if (index === -1) return;

        const target = this.items[index];

        if ((target.unreadCount ?? 0) === 0) return;

        this.upsertRoom({
          ...target,
          unreadCount: 0,
        });
      }
    }
  },
  async mounted() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });

    this.observer.observe(this.$refs.sentinel);

    await this.loadInitial();
    await this.subscribeChatListEvents();
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.unsubscribeSafe(this.summarySubscription);
    this.summarySubscription = null;

    this.unsubscribeSafe(this.chatListUpsertSubscription);
    this.chatListUpsertSubscription = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
  methods: {
    unsubscribeSafe(subscription) {
      if (!subscription) return;

      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
        return;
      }

      if (typeof subscription === 'function') {
        subscription();
      }
    },

    mapRoom(it) {
      return {
        id: it.roomId ?? it.chatRoomId ?? it.id,
        title: it.name ?? it.roomName ?? it.title ?? it.displayName ?? '채팅방',
        unreadCount: it.unreadCount ?? 0,
        profile: it.profileUrl ?? null,
        lastMessageAt: it.lastMessageAt ?? null,
        orderAt: it.orderAt ?? it.lastMessageAt ?? null,
        lastMessageAtDisplay: formatTime(it.lastMessageAt),
        lastMessagePreview: it.lastMessagePreview ?? null,
        raw: it,
      };
    },

    mapChatListUpsertEvent(event) {
      return {
        id: event.roomId,
        title: event.displayName ?? '채팅방',
        unreadCount: event.unreadCount ?? 0,
        profile: null,
        lastMessageAt: event.lastMessageAt ?? null,
        orderAt: event.orderAt ?? event.lastMessageAt ?? null,
        lastMessageAtDisplay: formatTime(event.lastMessageAt),
        lastMessagePreview: null,
        raw: event,
      };
    },

    compareRoomsDesc(a, b) {
      const aOrder = toMillis(a.orderAt ?? a.lastMessageAt);
      const bOrder = toMillis(b.orderAt ?? b.lastMessageAt);

      if (aOrder !== bOrder) {
        return bOrder - aOrder;
      }

      return Number(b.id ?? 0) - Number(a.id ?? 0);
    },

    sortItems(items) {
      return [...items].sort(this.compareRoomsDesc);
    },

    upsertRoom(nextRoom) {
      const roomId = String(nextRoom.id);
      const index = this.items.findIndex((item) => String(item.id) === roomId);

      let merged = nextRoom;

      if (index >= 0) {
        const existing = this.items[index];
        merged = {
          ...existing,
          ...nextRoom,
          id: existing.id,
        };
      }

      const filtered = this.items.filter((item) => String(item.id) !== roomId);
      filtered.push(merged);

      this.items = this.sortItems(filtered);
    },

    async loadInitial() {
      this.loading = true;
      this.error = null;

      try {
        const {items, next} = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });

        this.items = this.sortItems(items.map(this.mapRoom));
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
        const {items, next} = await fetchChats({
          limit: this.pageSize,
          cursor: this.cursor,
        });

        const mapped = items.map(this.mapRoom);

        // 기존 데이터와 합칠 때도 roomId 기준 dedupe
        const mergedMap = new Map(this.items.map(item => [String(item.id), item]));
        mapped.forEach(item => {
          mergedMap.set(String(item.id), {
            ...(mergedMap.get(String(item.id)) ?? {}),
            ...item,
          });
        });

        this.items = this.sortItems([...mergedMap.values()]);
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

    async subscribeChatListEvents() {
      try {
        await connectWebSocket();

        if (!this.summarySubscription) {
          const summaryDestination = `/user/api/sub/chat/summary`;
          this.summarySubscription = subscribe(summaryDestination, (event) => {
            this.applySummaryEvent(event);
          });

          if (this.summarySubscription) {
            console.log('summary 구독 완료:', summaryDestination);
          }
        }

        if (!this.chatListUpsertSubscription) {
          const chatListDestination = `/user/api/sub/chat-list`;
          this.chatListUpsertSubscription = subscribe(chatListDestination, (event) => {
            this.applyChatListUpsertEvent(event);
          });

          if (this.chatListUpsertSubscription) {
            console.log('chat-list upsert 구독 완료:', chatListDestination);
          }
        }
      } catch (e) {
        console.error('chat list 이벤트 구독 실패', e);
      }
    },

    applySummaryEvent(event) {
      const roomId = event?.roomId;
      if (!roomId) return;

      const normalizedRoomId = String(roomId);
      const index = this.items.findIndex((item) => String(item.id) === normalizedRoomId);

      if (index === -1) {
        // 아직 목록에 없는 방이면 서버/이벤트 반영 타이밍 차이일 수 있으니 재조회 fallback
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
        orderAt: event.lastMessageAt ?? existing.orderAt ?? existing.lastMessageAt,
        lastMessageAtDisplay: formatTime(event.lastMessageAt ?? existing.lastMessageAt),
      };

      this.upsertRoom(updated);
    },

    applyChatListUpsertEvent(event) {
      if (!event?.roomId) return;

      const room = this.mapChatListUpsertEvent(event);
      this.upsertRoom(room);
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
  margin-bottom: 4px;
}

.empty-text {
  font-size: 13px;
  color: #868e96;
  margin-top: 12px;
}

.loading {
  margin-top: 12px;
  font-size: 13px;
  color: #868e96;
}

.more-btn {
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: #f1f3f5;
  cursor: pointer;
}
</style>