<!-- src/components/sidebar/FriendList.vue -->
<template>
  <div class="list-container">
    <p class="list-title">친구 목록</p>

    <!-- 검색어가 있을 땐 검색 결과 영역을 우선 표시 -->
    <template v-if="hasKeyword">
      <p class="list-title" style="margin-top:4px;">검색 결과</p>

      <ul v-if="searchResults.length > 0">
        <li
            v-for="(u, i) in searchResults"
            :key="'search-' + i"
            @click="u.id && $emit('open-chat', { item: u, type: 'friend' })"
            class="list-item"
            :class="{ disabled: !u.id }"
            :title="!u.id ? 'id가 없어 채팅 열기 불가(백엔드에서 id 내려주면 활성화)' : ''"
        >
          <img :src="u.profile || defaultProfile" class="profile-img" />
          {{ u.name }}
        </li>
      </ul>

      <p v-else-if="searching" class="loading">검색 중...</p>
      <p v-else class="empty-text">검색 결과가 없습니다 🐰</p>
    </template>

    <!-- 검색어가 없을 땐 기존 친구 목록 + 무한 스크롤 -->
    <template v-else>
      <ul v-if="filteredItems.length > 0">
        <li
            v-for="(f, idx) in filteredItems"
            :key="idx"
            @click="$emit('open-chat', { item: f, type: 'friend' })"
            class="list-item"
        >
          <img :src="f.profile || defaultProfile" class="profile-img" />
          {{ f.name }}
        </li>
      </ul>
      <p v-else class="empty-text">검색 결과가 없습니다 🐰</p>

      <div v-if="loading" class="loading">로딩 중...</div>
      <button v-if="!loading && hasNext" class="more-btn" @click="loadMore">더 보기</button>
      <div ref="sentinel" style="height: 1px;"></div>
    </template>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import { fetchFriends } from '@/assets/js/friend.js';

export default {
  name: 'FriendList',
  props: {
    keyword: { type: String, default: '' },
    pageSize: { type: Number, default: 50 },
  },
  emits: ['open-chat'],
  data() {
    return {
      defaultProfile,
      items: [],
      cursor: null,
      hasNext: false,
      loading: false,
      observer: null,
      error: null,

      // 검색 관련
      searchResults: [],
      searching: false,
      debounceId: null,
      minKeywordLen: 1, // 2로 올리면 트래픽 더 줄일 수 있음
    };
  },
  computed: {
    hasKeyword() {
      return (this.keyword || '').trim().length >= this.minKeywordLen;
    },
    filteredItems() {
      const k = (this.keyword || '').trim().toLowerCase();
      if (!k) return this.items;
      // (키워드 있을 땐 검색 결과를 쓰므로, 이 필터는 hasKeyword=false일 때만 의미)
      return this.items.filter((f) => (f.name || '').toLowerCase().includes(k));
    },
  },
  watch: {
    // 키워드 변경 시 디바운스하여 원격 검색
    keyword: {
      immediate: true,
      handler(newVal) {
        clearTimeout(this.debounceId);
        const q = (newVal || '').trim();
        if (q.length < this.minKeywordLen) {
          this.searchResults = [];
          this.searching = false;
          return;
        }
        this.debounceId = setTimeout(() => this.remoteSearch(q), 250);
      },
    },
  },
  mounted() {
    this.loadInitial();

    // 무한 스크롤(검색 모드일 땐 사용 안 함)
    this.observer = new IntersectionObserver((entries) => {
      if (!this.hasKeyword && entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });
    this.observer.observe(this.$refs.sentinel);
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
    clearTimeout(this.debounceId);
  },
  methods: {
    async remoteSearch(q) {
      this.searching = true;
      try {
        this.searchResults = await searchUsers({ keyword: q });
      } catch (e) {
        console.error(e);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },
    async loadInitial() {
      this.loading = true;
      this.error = null;
      try {
        const { items, next, hasNext } = await fetchFriends({ limit: this.pageSize, cursor: null });
        this.items = items.map((it) => ({
          id: it.friendId ?? it.id,
          name: it.name ?? it.nickname,
          profile: it.profileUrl ?? it.avatarUrl ?? null,
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
        const { items, next, hasNext } = await fetchFriends({ limit: this.pageSize, cursor: this.cursor });
        const mapped = items.map((it) => ({
          id: it.friendId ?? it.id,
          name: it.name ?? it.nickname,
          profile: it.profileUrl ?? it.avatarUrl ?? null,
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
.list-item { padding: 8px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; }
.list-item:hover { background: #f1f3f5; }
.list-item.disabled { cursor: default; opacity: 0.6; }
.profile-img { width: 25px; height: 25px; border-radius: 50%; margin-right: 8px; }
.empty-text { font-size: 13px; color: #868e96; text-align: center; margin-top: 20px; }
.loading { font-size: 13px; color: #868e96; text-align: center; margin: 10px 0; }
.more-btn { width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 6px; background: #fff; cursor: pointer; }
.more-btn:hover { background: #f8f9fa; }
</style>
