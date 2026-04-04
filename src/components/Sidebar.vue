<template>
  <aside class="sidebar">
    <h2 class="logo">ChatOn</h2>

    <!-- 내 프로필 -->
    <div class="my-profile" @click="openMyProfile">
      <img :src="me?.profileUrl || defaultProfile" class="avatar" alt="" />
      <div class="info">
        <div class="name">{{ me?.nickName || '나' }}</div>
        <div class="status">{{ me?.statusMessage || '' }}</div>
      </div>
    </div>

    <!-- 메뉴 버튼 -->
    <div class="menu-buttons">
      <v-btn
          small
          rounded
          :color="currentView === 'friends' ? '#4dabf7' : '#f1f3f5'"
          class="menu-btn"
          @click="$emit('changeView', 'friends')"
      >
        👥 친구
      </v-btn>

      <v-btn
          small
          rounded
          :color="currentView === 'chats' ? '#38d9a9' : '#f1f3f5'"
          class="menu-btn"
          @click="$emit('changeView', 'chats')"
      >
        💬 대화방
      </v-btn>
    </div>

    <!-- 친구 검색 -->
    <div v-if="currentView === 'friends'" class="search-box">
      <v-text-field
          v-model="kwProxy"
          dense
          hide-details
          placeholder="친구 검색"
          prepend-inner-icon="mdi-magnify"
          outlined
          clearable
          class="search-input"
      />
    </div>

    <!-- 대화방 헤더 -->
    <div v-if="currentView === 'chats'" class="chat-header">
      <div class="chat-header-title">대화방 목록</div>
      <button class="chat-create-btn" @click="openCreateGroupModal">+</button>
    </div>

    <!-- 검색 결과 -->
    <SearchResults
        v-if="currentView === 'friends' && hasKw"
        :keyword="kw"
        @add-friend="addFriend"
        @open-profile="openProfile"
    />

    <!-- 리스트 -->
    <div class="list-container">
      <FriendList
          v-if="currentView === 'friends' && !hasKw"
          :friends="friends"
          :keyword="kw"
          @open-chat="$emit('open-chat', $event)"
          @open-profile="openProfile"
          @remove-friend="handleRemoveFriend"
      />

      <ChatList
          v-else-if="currentView === 'chats'"
          :chats="chats"
          :active-room-id="$route.params.roomId"
          @open-chat="$emit('open-chat', $event)"
      />
    </div>

    <!-- 그룹 채팅 생성 모달 -->
    <GroupChatCreateModal
        v-if="showGroupCreateModal"
        :friends="friends"
        :loading="isCreatingGroupChat"
        @close="closeCreateGroupModal"
        @submit="handleCreateGroupChat"
    />

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
import FriendList from '@/components/sidebar/FriendList.vue';
import ProfileModal from '@/components/sidebar/ProfileModal.vue';
import GroupChatCreateModal from '@/components/sidebar/GroupChatCreateModal.vue';
import defaultProfile from '@/assets/default_image.png';
import api from '@/plugins/axios.js';
import { getFriends } from '@/assets/js/friend.js';

export default {
  name: 'Sidebar',
  components: {
    ChatList,
    SearchResults,
    FriendList,
    ProfileModal,
    GroupChatCreateModal
  },
  props: {
    currentView: {
      type: String,
      default: 'friends'
    },
    chats: {
      type: Array,
      default: () => []
    },
    me: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      searchKeyword: '',
      selectedProfile: null,
      defaultProfile,

      // 친구 목록 source of truth
      friends: [],
      nextFriendCursor: null,
      hasNextFriends: false,
      loadingFriends: false,

      // 그룹 채팅 생성 모달
      showGroupCreateModal: false,
      isCreatingGroupChat: false
    };
  },
  async mounted() {
    await this.loadFriends();
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
    async loadFriends() {
      try {
        this.loadingFriends = true;

        const {items, next, hasNext} = await getFriends({limit: 50});

        this.friends = items;
        this.nextFriendCursor = next;
        this.hasNextFriends = hasNext;

        console.log('friends loaded:', this.friends);
      } catch (e) {
        console.error('친구 목록 조회 실패', e);
        this.$emit('toast', '친구 목록을 불러오지 못했어요');
      } finally {
        this.loadingFriends = false;
      }
    },

    openCreateGroupModal() {
      console.log('sidebar friends:', this.friends);
      this.showGroupCreateModal = true;
    },

    closeCreateGroupModal() {
      this.showGroupCreateModal = false;
    },

    async handleCreateGroupChat({title, memberUuids}) {
      try {
        this.isCreatingGroupChat = true;

        const res = await api.post('/v1/chat-room/group', {
          title,
          memberUuids
        });

        this.showGroupCreateModal = false;

        // axios wrapper 형태 대응
        const roomId = res?.data?.roomId ?? res?.roomId;

        this.$emit('group-room-created', roomId);
        this.$emit('toast', '그룹 채팅방이 생성되었어요');
      } catch (e) {
        console.error('그룹 채팅방 생성 실패', e);
        this.$emit(
            'toast',
            e?.response?.data?.message ?? '그룹 채팅방 생성에 실패했어요'
        );
      } finally {
        this.isCreatingGroupChat = false;
      }
    },

    async addFriend(user) {
      try {
        await api.post('/v1/friends/register', {targetUserId: user.userId});
        this.$emit('toast', `${user.name} 님을 친구로 추가했어요`);
        this.searchKeyword = '';

        // 친구 추가 후 목록 재조회
        await this.loadFriends();
      } catch (e) {
        console.error(e);
        this.$emit('toast', '친구 추가에 실패했어요 🥲');
      }
    },

    async openProfile(user) {
      try {
        const userId = user.uuid;
        const profile = await api.get(`/v1/users/${userId}/profile/detail`);

        profile.uuid = userId;
        this.selectedProfile = {...profile, isMe: false};
      } catch (e) {
        console.error('프로필 조회 실패', e);
        this.$emit('toast', '프로필을 불러오지 못했어요');
      }
    },

    async openMyProfile() {
      try {
        const user = await api.get('/v1/users/me/profile/detail');
        this.selectedProfile = {...user, isMe: true};
      } catch (e) {
        console.error('내 프로필 조회 실패', e);
        this.$emit('toast', '내 프로필을 불러오지 못했어요');
      }
    },

    closeProfile() {
      this.selectedProfile = null;
    },

    async handleUpdateProfile({name, message, file}) {
      try {
        if (this.me.nickName !== name || this.me.statusMessage !== message) {
          const profile = {
            name,
            message
          };

          const res = await api.post('/v1/users/me/profile', profile);

          this.me.nickName = res.nickName;
          this.me.statusMessage = res.message;

          if (this.selectedProfile) {
            this.selectedProfile.nickName = res.nickName;
            this.selectedProfile.message = res.message;
          }
        }

        if (file instanceof File) {
          const formData = new FormData();
          formData.append('file', file);

          const imageRes = await api.post('/v1/users/me/profile/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          this.me.profileUrl = imageRes.profileUrl;

          if (this.selectedProfile) {
            this.selectedProfile.profileUrl = imageRes.profileUrl;
          }
        }
      } catch (err) {
        console.error('프로필 수정 실패', err);
        this.$emit('toast', '프로필 수정에 실패했어요');
      }
    },

    async handleRemoveFriend(friendId) {
      console.log('remove friend:', friendId);
      // 필요하면 여기서 친구 삭제 API 호출 후 loadFriends() 다시 호출
      // await api.delete(...)
      // await this.loadFriends();
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
  background: #fff;
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
  object-fit: cover;
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
  padding: 0 10px;
}

.menu-btn {
  min-width: 100px;
}

.search-box {
  padding: 0 4px;
  margin-bottom: 10px;
}

.search-input {
  font-size: 13px;
  margin: 10px;
  width: calc(100% - 20px);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 10px 14px;
}

.chat-header-title {
  font-size: 18px;
  font-weight: 700;
  color: #212529;
}

.chat-create-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #38d9a9;
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
}

.chat-create-btn:hover {
  background: #20c997;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}
</style>