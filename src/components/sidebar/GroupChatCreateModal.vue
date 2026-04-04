<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h3>그룹 채팅 만들기</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="field">
          <label>채팅방 이름 (선택)</label>
          <input
              v-model="title"
              type="text"
              maxlength="100"
              placeholder="입력하지 않으면 자동 이름으로 표시됩니다."
          />
        </div>

        <div class="field">
          <label>친구 선택</label>
          <div class="friend-list">
            <label
                v-for="friend in friends"
                :key="friend.uuid"
                class="friend-item"
            >
              <input
                  v-model="selectedFriendUuids"
                  type="checkbox"
                  :value="friend.uuid"
              />
              <span>{{ friend.nickName || friend.name }}</span>
            </label>
          </div>
        </div>

        <div class="guide">
          최소 2명 이상 선택해야 합니다.
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">취소</button>
        <button
            class="submit-btn"
            :disabled="selectedFriendUuids.length < 2 || loading"
            @click="submit"
        >
          {{ loading ? '생성 중...' : '생성' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GroupChatCreateModal',
  props: {
    friends: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      title: '',
      selectedFriendUuids: []
    };
  },
  methods: {
    submit() {
      if (this.selectedFriendUuids.length < 2) {
        return;
      }

      this.$emit('submit', {
        title: this.title,
        memberUuids: this.selectedFriendUuids
      });
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  width: 420px;
  background: white;
  border-radius: 14px;
  overflow: hidden;
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.modal-body {
  padding: 0 16px 16px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.field input[type="text"] {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.friend-list {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #f1f3f5;
}

.friend-item:last-child {
  border-bottom: none;
}

.guide {
  font-size: 13px;
  color: #868e96;
}

.cancel-btn,
.submit-btn {
  min-width: 80px;
  height: 38px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.cancel-btn {
  background: #f1f3f5;
}

.submit-btn {
  background: #38d9a9;
  color: white;
}

.submit-btn:disabled {
  background: #b2f2dd;
  cursor: not-allowed;
}
</style>