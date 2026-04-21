<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-window">
        <div class="modal-header">
          <h3>친구 찾기</h3>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="modal-body">
          <div class="search-input-wrapper">
            <input
                v-model.trim="keyword"
                type="text"
                placeholder="친구 아이디를 검색하세요"
                @keyup.enter="handleSearch"
            />
            <button class="search-btn" :disabled="loading" @click="handleSearch">
              검색
            </button>
          </div>

          <div class="search-results">
            <div v-if="loading" class="status-text">검색 중...</div>
            <div v-else-if="hasSearched && results.length === 0" class="status-text">
              검색 결과가 없습니다.
            </div>

            <div v-else class="result-list">
              <div v-for="user in results" :key="user.uuid" class="user-card">
                <img :src="user.profileImageUrl || defaultProfile" class="avatar" alt="profile"/>
                <div class="user-info">
                  <div class="name">{{user.name }}</div>
<!--                  <div class="id-text">@{{ user.userId || user.uuid }}</div>-->
                </div>
                <button
                    class="add-btn"
                    :disabled="requestingId === user.uuid || addedUserUuids.includes(user.uuid) || user.isFriend"
                    @click="handleAddFriend(user.uuid)"
                >
                  {{
                    addedUserUuids.includes(user.uuid) ? '추가됨' :
                        (user.isFriend ? '이미 친구' :
                            (requestingId === user.uuid ? '요청 중...' : '추가'))
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import { searchUserByKeyword } from '@/assets/js/search.js';
import { requestFriend } from '@/assets/js/friend.js';

export default {
  name: 'SearchUserModal',
  props: {
    modelValue: Boolean, // v-model 바인딩용
  },
  emits: ['update:modelValue', 'toast', 'friend-added'],
  data() {
    return {
      defaultProfile,
      keyword: '',
      results: [],
      loading: false,
      hasSearched: false,
      requestingId: null,
      addedUserUuids: [],
    };
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
      // 모달 닫을 때 상태 초기화
      this.keyword = '';
      this.results = [];
      this.hasSearched = false;
      this.addedUserUuids = [];
    },

    // 🎯 API 연동: 유저 검색
    async handleSearch() {
      if (!this.keyword) {
        alert("검색어를 입력해주세요.");
        return;
      }

      this.loading = true;
      this.hasSearched = true;
      try {
        const response = await searchUserByKeyword({ keyword: this.keyword });
        // 응답 구조에 맞춰 조정 (search.js에서 바로 배열을 반환한다고 가정)

        if (Array.isArray(response)) {
          this.results = response;
        } else if (response && response.uuid) {
          // 단일 사용자 객체로 응답이 올 경우 배열로 감싸서 할당
          this.results = [response];
        } else if (response && Array.isArray(response.data)) {
          this.results = response.data;
        } else {
          this.results = [];
        }
      } catch (error) {
        console.error("검색 실패:", error);
        this.$emit('toast', { title: '오류', preview: '사용자를 검색하는 데 실패했습니다.' });
      } finally {
        this.loading = false;
      }
    },

    // 🎯 API 연동: 친구 추가 요청
    async handleAddFriend(targetUserId) {
      if (this.requestingId) return;

      this.requestingId = targetUserId;
      try {
        await requestFriend({ targetUserId });

        this.$emit('toast', { title: '알림', preview: '친구 요청을 보냈습니다.' });
        this.$emit('friend-added');

        // 추가 완료 후 목록에서 해당 유저 제거 (또는 버튼 상태를 '추가됨'으로 변경)
        this.results = this.results.filter(u => u.id !== targetUserId);

        this.addedUserUuids.push(targetUserId);

      } catch (error) {
        console.error("친구 요청 실패:", error);
        // 이미 친구인 경우 처리 등
        const errMsg = error.message || '친구 요청에 실패했습니다.';
        this.$emit('toast', { title: '오류', preview: errMsg });
      } finally {
        this.requestingId = null;
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-window {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f5;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
.modal-body { padding: 20px; }

.search-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.search-input-wrapper input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  outline: none;
}
.search-btn {
  padding: 8px 16px;
  background: #4dabf7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.search-btn:disabled { opacity: 0.6; }

.search-results { min-height: 200px; max-height: 300px; overflow-y: auto; }
.status-text { text-align: center; color: #868e96; padding-top: 40px; }

.user-card {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8f9fa;
}
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover;}
.user-info { flex: 1; }
.name { font-weight: 600; font-size: 14px; }
.id-text { font-size: 12px; color: #868e96; }
.add-btn {
  padding: 6px 12px;
  background: #f1f3f5;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.add-btn:hover { background: #e9ecef; }
</style>