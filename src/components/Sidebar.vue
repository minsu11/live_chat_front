<template>
  <aside class="sidebar">
    <!-- 로고 -->
    <h2 class="logo">ChatOn</h2>

    <!-- 메뉴 버튼 -->
    <div class="menu-buttons">
      <v-btn
          small
          rounded
          :color="currentView === 'friends' ? '#4dabf7' : '#f1f3f5'"
          class="menu-btn"
          @click="$emit('update-view', 'friends')"
      >
        👥 친구
      </v-btn>
      <v-btn
          small
          rounded
          :color="currentView === 'chats' ? '#38d9a9' : '#f1f3f5'"
          class="menu-btn"
          @click="$emit('update-view', 'chats')"
      >
        💬 대화방
      </v-btn>
    </div>

    <!-- 친구 검색창 -->
    <div v-if="currentView === 'friends'" class="search-box">
      <v-text-field
          v-model="searchKeyword"
          dense
          hide-details
          placeholder="친구 검색"
          prepend-inner-icon="mdi-magnify"
          outlined
          clearable
          class="search-input"
      />
    </div>

    <!-- 목록 -->
    <div class="list-container">
      <!-- 친구 목록 -->
      <template v-if="currentView === 'friends'">
        <p class="list-title">친구 목록</p>
        <ul v-if="filteredFriends.length > 0">
          <li
              v-for="(friend, idx) in filteredFriends"
              :key="idx"
              @click="$emit('open-chat', { item: friend, type: 'friend' })"
              class="list-item"
          >
            <img :src="friend.profile || defaultProfile" class="profile-img" />
            {{ friend.name }}
          </li>
        </ul>
        <p v-else class="empty-text">검색 결과가 없습니다 🐰</p>
      </template>

      <!-- 대화방 목록 -->
      <template v-if="currentView === 'chats'">
        <p class="list-title">대화방 목록</p>
        <ul v-if="chats.length > 0">
          <li
              v-for="(chat, idx) in chats"
              :key="idx"
              @click="$emit('open-chat', { item: chat, type: 'chat' })"
              class="list-item"
          >
            <img :src="chat.profile || defaultProfile" class="profile-img" />
            {{ chat.title }}
          </li>
        </ul>
        <p v-else class="empty-text">대화방이 없습니다 🐰</p>
      </template>
    </div>
  </aside>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'Sidebar',
  props: {
    currentView: String,
    friends: Array,
    chats: Array,
  },
  data() {
    return {
      defaultProfile,
      searchKeyword: '',
    };
  },
  computed: {
    filteredFriends() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (!keyword) return this.friends;
      return this.friends.filter((friend) =>
          friend.name.toLowerCase().includes(keyword)
      );
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #e9ecef;
  padding: 15px;
  display: flex;
  flex-direction: column;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #4dabf7;
  text-align: center;
}
.menu-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 10px;
}
.search-box {
  padding: 0 4px;
  margin-bottom: 10px;
}
.search-input {
  font-size: 13px;
}
.list-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}
.list-container {
  flex: 1;
  overflow-y: auto;
}
.list-item {
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.list-item:hover {
  background: #f1f3f5;
}
.profile-img {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  margin-right: 8px;
}
.empty-text {
  font-size: 13px;
  color: #868e96;
  text-align: center;
  margin-top: 20px;
}
</style>
