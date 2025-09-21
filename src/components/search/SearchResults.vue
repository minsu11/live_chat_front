<!-- src/components/search/SearchResults.vue -->
<template>
  <section v-if="(keyword || '').trim()" class="search-results">
    <p class="section-title">검색 결과</p>

    <div v-if="loading" class="loading">검색 중...</div>

    <div v-else-if="user" class="result-card">
      <img :src="user.profileUrl || defaultProfile" class="avatar" />
      <div class="meta">
        <div class="name">{{ user.name }}</div>
        <div class="sub" v-if="user.userUuid">UUID: {{ user.userUuid }}</div>
      </div>
      <div class="actions">
        <button class="btn" @click="$emit('add-friend', user)">친구 추가</button>
        <button class="btn secondary" @click="$emit('open-profile', user)">프로필</button>
      </div>
    </div>

    <p v-else class="empty-text">검색 결과가 없습니다 🐰</p>
  </section>
</template>
<script>
import defaultProfile from '@/assets/default_image.png';
import { searchUserByKeyword } from '@/assets/js/search.js';

export default {
  name: 'SearchResults',
  props: { keyword: { type: String, default: '' } },
  emits: ['add-friend', 'open-profile'],
  data() {
    return {
      defaultProfile,
      user: null,
      loading: false,
      _debounceTimer: null,
    };
  },
  watch: {
    keyword: {
      immediate: true,
      handler(newK) {
        clearTimeout(this._debounceTimer);
        const k = (newK ?? '').trim();
        if (!k) {
          this.user = null;
          return;
        }
        this._debounceTimer = setTimeout(this.fetchUser, 250);
      },
    },
  },
  methods: {
     fetchUser() {
      this.loading = true;
      try {
        this.user = searchUserByKeyword(
            {
          keyword: this.keyword
        }
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.section-title { font-size: 14px; font-weight: 700; margin: 8px 0; }
.result-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; border: 1px solid #e9ecef; border-radius: 10px; background: #fff;
}
.avatar { width: 36px; height: 36px; border-radius: 50%; }
.meta .name { font-weight: 600; }
.meta .sub { font-size: 12px; color: #868e96; }
.actions { margin-left: auto; display: flex; gap: 8px; }
.btn { padding: 6px 10px; border: 1px solid #e9ecef; border-radius: 8px; background: #fff; cursor: pointer; }
.btn.secondary { background: #f8f9fa; }
.loading, .empty-text { font-size: 13px; color: #868e96; margin: 6px 0; }
</style>