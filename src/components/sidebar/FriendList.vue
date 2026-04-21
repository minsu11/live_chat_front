<template>
  <section class="friend-list">
    <section class="friend-list">
      <div class="header-row">
        <p class="section-title">👥 친구 목록</p>
        <button class="add-friend-btn" @click="isSearchModalOpen = true">
          <v-icon>mdi-account-search</v-icon> 찾기
        </button>
      </div>

      <SearchUserModal
          v-model="isSearchModalOpen"
          @toast="$emit('toast', $event)"
          @friend-added="refreshFriends"
      />
    </section>
    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="friends.length > 0" class="friends">
      <FriendCard
          v-for="friend in friends"
          :key="friend.uuid"
          :friend="friend"
          @open-chat="emit('open-chat',$event)"
          @remove="onRemoveFriend"
          @open-profile="$emit('open-profile', $event)"
      />
    </div>

    <div v-else class="empty">친구가 없습니다.</div>

    <button v-if="hasNext" @click="loadMore" :disabled="loadingMore">
      더 보기
    </button>
  </section>
</template>

<script>
import { getFriends } from '@/assets/js/friend.js';
import FriendCard from './FriendCard.vue';
import SearchUserModal from '@/components/search/SearchUserModal.vue';
import {ref} from "vue";
export default {
  name: 'FriendList',
  components: { FriendCard, SearchUserModal },
  props: {
    friends: {
      type: Array,
      default: ()=>[]
    },
    keyword: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      friends: [],
      next: null,
      hasNext: false,
      loading: false,
      loadingMore: false,
      isSearchModalOpen: false,

    };
  },
  async mounted() {
    await this.loadFriends();
  },
  methods: {
    ref,
    async refreshFriends() {
      this.next = null;

      await this.loadFriends();
    },
    async loadFriends() {
      this.loading = true;
      try {
        const { items, next, hasNext } = await getFriends();
        this.friends = items;
        this.next = next;
        this.hasNext = hasNext;

      } catch (e) {
        console.error(e);
        alert('친구 목록을 불러오지 못했습니다.');
      } finally {
        this.loading = false;
      }
    },
    async loadMore() {
      if (!this.hasNext) return;
      this.loadingMore = true;

      try {
        const { items, next, hasNext } = await getFriends({ cursor: this.next });
        this.friends.push(...items);
        this.next = next;
        console.log(items)
        console.log("next: ", this.next)

        this.hasNext = hasNext;
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingMore = false;
      }
    },
    onRemoveFriend(id) {
      this.friends = this.friends.filter(f => f.userId !== id);
    },
  },
};
</script>

<style scoped>
.friend-list {
  padding: 1rem;
}
.section-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.friends {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.empty {
  color: #888;
}
button {
  margin-top: 1rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
}
.add-friend-btn {
  background: transparent;
  border: none;
  color: #4dabf7;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.add-friend-btn:hover {
  text-decoration: underline;
}

</style>
