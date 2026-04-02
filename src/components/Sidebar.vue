<template>
  <aside class="sidebar">
    <h2 class="logo">ChatOn</h2>

    <!-- 내 프로필 -->
    <div class="my-profile" @click="openMyProfile()">
      <img :src="me?.profileUrl || defaultProfile" class="avatar"  alt=""/>
      <div class="info">
        <div class="name">{{ me?.nickName || '나' }}</div>
        <div class="status">{{ me?.statusMessage || '' }}</div>
      </div>
    </div>

    <div class="menu-buttons">
      <v-btn small rounded :color="currentView==='friends' ? '#4dabf7' : '#f1f3f5'"
             class="menu-btn" @click="$emit('changeView', 'friends')">👥 친구</v-btn>
      <v-btn small rounded :color="currentView==='chats' ? '#38d9a9' : '#f1f3f5'"
             class="menu-btn" @click="$emit('changeView', 'chats')">💬 대화방</v-btn>
    </div>

    <!-- 검색 -->
    <div v-if="currentView === 'friends'" class="search-box">
      <v-text-field
          v-model="kwProxy"
          dense hide-details placeholder="친구 검색"
          prepend-inner-icon="mdi-magnify"
          outlined clearable
          class="search-input"
      />
    </div>

    <!-- 검색 결과 -->
    <SearchResults
        v-if="currentView === 'friends' && hasKw"
        :keyword="kw"
        @add-friend="addFriend"
        @open-profile="openProfile"
    />

    <!-- 친구 목록 -->
    <div class="list-container">
      <FriendList
          v-if="currentView === 'friends' && !hasKw"
          :friends="friends"
          :keyword="kw"
          @open-chat="$emit('open-chat', $event)"
          @open-profile="openProfile"
      />
      <ChatList
          v-else-if="currentView === 'chats'"
          :chats="chats"
          :active-room-id="$route.params.roomId"
          @open-chat="$emit('open-chat', $event)"
      />
    </div>

    <!-- 프로필 모달 -->
    <ProfileModal
        v-if="selectedProfile"
        :user="selectedProfile"
        :is-me="selectedProfile?.isMe"
        @close="closeProfile"
        @update-profile="handleUpdateProfile"
    />
  </aside>
</template>

<script>
import ChatList from '@/components/sidebar/ChatList.vue';
import SearchResults from '@/components/search/SearchResults.vue';
import FriendList from "@/components/sidebar/FriendList.vue";
import ProfileModal from "@/components/sidebar/ProfileModal.vue";
import defaultProfile from '@/assets/default_image.png';
import api from '@/plugins/axios.js';

export default {
  name: 'Sidebar',
  components: { ChatList, SearchResults, FriendList, ProfileModal },
  props: {
    currentView: {type: String, default: 'friends'},
    friends: {type: Array, default: () => []},
    chats: {type: Array, default: () => []},
    me: {type: Object, default: () => ({})}
  },
  data() {
    return {
      searchKeyword: '',
      selectedProfile: null,
      defaultProfile
    };
  },
  computed: {
    kwProxy: {
      get() {
        return this.searchKeyword ?? '';
      },
      set(v) {
        this.searchKeyword = (v ?? '').toString();
      }
    },
    kw() {
      return (this.searchKeyword ?? '').trim();
    },
    hasKw() {
      return this.kw.length > 0;
    }
  },
  methods: {
    async addFriend(user) {
      try {
        await api.post('/v1/friends/register', {targetUserId: user.userId});
        this.$emit('toast', `${user.name} 님을 친구로 추가했어요`);
        this.searchKeyword = '';
      } catch (e) {
        console.error(e);
        this.$emit('toast', '친구 추가에 실패했어요 🥲');
      }
    },
    async openProfile(user) {
      console.log(user.uuid);
      const userId = user.uuid;
      user = await api.get(`/v1/users/${userId}/profile/detail`)
      console.log(user);
      user.uuid = userId;
      this.selectedProfile = { ...user, isMe:false};
    },
    async openMyProfile() {
      const user = await api.get("/v1/users/me/profile/detail");
      this.selectedProfile = { ...user, isMe:true};
    },
    closeProfile() {
      console.log("profile close")
      this.selectedProfile = null;
    },
    async handleUpdateProfile({ name, message, file }){
      console.log("update 기능")
      try {
        if (this.me.nickName !== name || this.me.statusMessage !== message) {
          const profile = {};
          profile.name = name;
          profile.message = message;
          const res = await api.post('/v1/users/me/profile', profile);
          console.log(res);
          this.me.nickName = res.nickName;
          this.me.statusMessage = res.message;
          this.selectedProfile.nickName = res.nickName;
          this.selectedProfile.message = res.message;
        }

        if (file instanceof File){
          const formData = new FormData();

          formData.append('file', file);
          console.log("api 쏘기 전")
          const imageRes = await api.post('/v1/users/me/profile/image', formData,{
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          console.log(imageRes);
          this.me.profileUrl = imageRes.profileUrl;
          this.selectedProfile.profileUrl = imageRes.profileUrl;
        }

        this.showProfileModal = false;
      } catch (err) {
        console.error('프로필 수정 실패', err);
      }
    }
  }
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 300px;
  border-right: 1px solid #e9ecef;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #4dabf7;
  text-align: center;
}

.my-profile {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}

.my-profile:hover {
  background: #f8f9fa;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: bold;
}

.status {
  font-size: 12px;
  color: #868e96;
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
  margin: 10px;
  padding: 8px;
  width: calc(100% - 20px);
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}
</style>
