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
import api from '@/plugins/axios.js';
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
  components: {RoomCard},
  emits: ['open-chat'],
  props: {
    pageSize: {type: Number, default: 50},
  },
  data() {
    return {
      defaultProfile,
      items: [],
      cursor: null,
      loading: false,
      observer: null,
      error: null,
      me: null,
      summarySubscription: null,
    };
  },
  computed: {
    hasNext() {
      return !!this.cursor;
    },
    myUserId() {

      return this.me?.id ?? this.me?.userId ?? null;
    },
  },
  async mounted() {
    await this.loadMyProfile();
    await this.loadInitial();
    await this.subscribeRoomSummary();

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });

    this.observer.observe(this.$refs.sentinel);
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.summarySubscription) {
      this.summarySubscription.unsubscribe();
      this.summarySubscription = null;
    }
  },
  methods: {
    async loadMyProfile() {
      try {
        const res = await api.get('/v1/users/me/profile/summary');
        this.me = res?.data ?? res;
        console.log("this.me: ",this.me);
      } catch (e) {
        console.error('내 정보 조회 실패', e);
      }
    },

    async loadInitial() {
      this.loading = true;
      this.error = null;

      try {
        const {items, next} = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });

        this.items = items.map((it) => ({
          id: it.roomId ?? it.chatRoomId ?? it.id,
          title: it.name ?? it.roomName ?? it.title,
          unreadCount: it.unreadCount ?? 0,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt ?? null,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          lastMessagePreview: it.lastMessagePreview ?? null,
          raw: it,
        }));

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

        const mapped = items.map((it) => ({
          id: it.roomId ?? it.chatRoomId ?? it.id,
          title: it.name ?? it.roomName ?? it.title,
          unreadCount: it.unreadCount ?? 0,
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

    // async refresh() {
    //   this.cursor = null;
    //   this.items = [];
    //
    //   if (this.observer) {
    //     this.observer.observe(this.$refs.sentinel);
    //   }
    //
    //   await this.loadInitial();
    // },

    async subscribeRoomSummary() {
      // if (!this.myUserId) {
      //   console.warn('summary 구독 실패: myUserId 없음');
      //   return;
      // }

      try {
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

      const index = this.items.findIndex((item) => item.id === roomId);

      if (index === -1) {
        return;
      }

      const existing = this.items[index];

      const updated = {
        ...existing,
        unreadCount: event.unreadCount ?? existing.unreadCount ?? 0,
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