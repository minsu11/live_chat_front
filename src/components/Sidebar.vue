<template>
  <aside class="sidebar">
    <h2 class="logo">ChatOn</h2>

    <div class="menu-buttons">
      <v-btn small rounded :color="currentView==='friends' ? '#4dabf7' : '#f1f3f5'"
             class="menu-btn" @click="$emit('update-view', 'friends')">👥 친구</v-btn>
      <v-btn small rounded :color="currentView==='chats' ? '#38d9a9' : '#f1f3f5'"
             class="menu-btn" @click="$emit('update-view', 'chats')">💬 대화방</v-btn>
    </div>

    <div v-if="currentView === 'friends'" class="search-box">
      <v-text-field
          v-model="kwProxy"
      dense hide-details placeholder="친구 검색"
      prepend-inner-icon="mdi-magnify"
      outlined clearable
      class="search-input"
      />
    </div>

    <!-- 검색 결과 카드 (키워드가 있을 때만) -->
    <SearchResults
        v-if="currentView === 'friends' && hasKw"
        :keyword="kw"
    @add-friend="addFriend"
    @open-profile="openProfile"
    />

    <!-- 목록 영역 -->
    <div class="list-container">
      <FriendList
          v-if="currentView === 'friends' && !hasKw"
          :keyword="kw"
      @open-chat="$emit('open-chat', $event)"
      />
      <ChatList
          v-else-if="currentView === 'chats'"
          @open-chat="$emit('open-chat', $event)"
      />
    </div>
  </aside>
</template>

<script>
import ChatList from '@/components/sidebar/ChatList.vue';
import SearchResults from '@/components/search/SearchResults.vue';
import api from '@/plugins/axios.js';

export default {
  name: 'Sidebar',
  components: { ChatList, SearchResults },
  props: { currentView: { type: String, default: 'friends' } },
  data() {
    return { searchKeyword: '' };
  },
  computed: {
    // Vuetify clearable가 null을 넣는 경우가 있어 안전 프록시로 교정
    kwProxy: {
      get() { return this.searchKeyword ?? ''; },
      set(v) { this.searchKeyword = (v ?? '').toString(); }
    },
    kw() { return (this.searchKeyword ?? '').trim(); }, // 자식에 내려줄 정규화 값
    hasKw() { return this.kw.length > 0; }
  },
  methods: {
    async addFriend(user) {
      try {
        // 백엔드에 맞게 key 이름만 확인해서 바꾸세요 (예: targetUserId / friendId 등)
        await api.post('/v1/friends/register', {
          targetUserId: user.userId
        });
        this.$emit('toast', `${user.name} 님을 친구로 추가했어요`);
        this.searchKeyword = ''; // 추가 후 검색창 비우기(선택)
      } catch (e) {
        console.error(e);
        this.$emit('toast', '친구 추가에 실패했어요 🥲');
      }
    },
    openProfile(user) {
      this.$emit('open-profile', user);
    }
  }
};
</script>

<style scoped>
.sidebar { display:flex; flex-direction:column; width:300px; border-right:1px solid #e9ecef; }
.logo { font-size:20px; font-weight:bold; margin-bottom:10px; color:#4dabf7; text-align:center; }
.menu-buttons { display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
.search-box { padding:0 4px; margin-bottom:10px; }
.search-input { font-size:13px; margin:10px; padding:8px; width:calc(100% - 20px); border:1px solid #e9ecef; border-radius:8px; }
.list-container { flex:1; overflow-y:auto; }
.list-item { padding:8px; border-radius:5px; cursor:pointer; display:flex; align-items:center; }
.list-item:hover { background:#f1f3f5; }
.profile-img { width:25px; height:25px; border-radius:50%; margin-right:8px; }
.empty-text { font-size:13px; color:#868e96; text-align:center; margin-top:20px; }
</style>
