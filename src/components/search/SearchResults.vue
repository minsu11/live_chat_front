<template>
  <section v-if="(keyword || '').trim()" class="search-results">
    <p class="section-title">검색 결과</p>

    <div v-if="loading" class="loading">검색 중...</div>

    <div v-else-if="users.length > 0">
      <SearchUserCard
          v-for="user in users"
          :key="user.userId"
          :user="user"
          @add-friend="$emit('add-friend', $event)"
          @open-profile="$emit('open-profile', $event)"
          @update-status="updateUserStatus"
      />
    </div>

    <p v-else class="empty-text">검색 결과가 없습니다 🐰</p>
  </section>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import { searchUserByKeyword } from '@/assets/js/search.js';
import SearchUserCard from './SearchUserCard.vue';

export default {
  name: 'SearchResults',
  components: { SearchUserCard },
  props: { keyword: { type: String, default: '' } },
  emits: ['add-friend', 'open-profile'],
  data() {
    return {
      defaultProfile,
      users: [],
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
          this.users = [];
          return;
        }
        this._debounceTimer = setTimeout(this.fetchUser, 250);
      },
    },
  },
  methods: {
    async fetchUser() {
      this.loading = true;
      try {
        this.users = await searchUserByKeyword({keyword: this.keyword});
      } finally {
        this.loading = false;
      }
    },
    updateUserStatus({id, status}) {
      const idx = this.users.findIndex(u => u.userId === id);
      if (idx !== -1) this.users[idx].status = status;
    }
  },
};
</script>
