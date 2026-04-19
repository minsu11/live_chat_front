<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-window">
        <div class="modal-header">
          <h3>채팅방 이름 변경</h3>
        </div>

        <div class="modal-body">
          <input
              v-model.trim="roomName"
              type="text"
              maxlength="50"
              placeholder="변경할 이름을 입력하세요"
              @keyup.enter="save"
              ref="nameInput"
          />
          <p class="helper-text">나에게만 변경된 이름으로 표시됩니다.</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-save" :disabled="saving || !roomName" @click="save">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { updateRoomCustomName } from '@/assets/js/chat-room-settings.js';

export default {
  name: 'EditRoomNameModal',
  props: {
    modelValue: Boolean,
    roomId: [Number, String],
    initialRoomName: String,
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      roomName: '',
      saving: false,
    };
  },
  watch: {
    modelValue(open) {
      if (open) {
        this.roomName = this.initialRoomName || '';
        this.$nextTick(() => {
          this.$refs.nameInput?.focus();
        });
      }
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    async save() {
      if (this.saving || !this.roomName) return;
      try {
        this.saving = true;
        const res = await updateRoomCustomName(this.roomId, { displayName: this.roomName });
        // 백엔드 응답 구조에 맞게 수정 (ApiResponse.data 사용)
        this.$emit('saved', res);
        this.close();
      } catch (e) {
        alert('이름 변경에 실패했습니다.');
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
/* 1. 화면 전체를 덮는 오버레이 */
.modal-overlay {
  position: fixed; /* 💡 absolute가 아닌 fixed여야 화면에 고정됨 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5); /* 배경 어둡게 */
  display: flex;
  align-items: center; /* 수직 중앙 정렬 */
  justify-content: center; /* 수평 중앙 정렬 */
  z-index: 10000; /* 💡 서랍(9999)보다 높게 설정하여 서랍 위로 띄움 */
}

/* 2. 중앙에 뜨는 모달 창 */
.modal-window {
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  padding: 20px 20px 10px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.modal-body {
  padding: 10px 20px 20px;
}

.modal-body input {
  width: 100%;
  padding: 10px;
  border: none;
  border-bottom: 2px solid #4dabf7;
  font-size: 16px;
  outline: none;
}

.helper-text {
  font-size: 12px;
  color: #868e96;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f1f3f5;
}

.modal-footer button {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  color: #868e96;
  border-right: 1px solid #f1f3f5;
}

.btn-save {
  color: #4dabf7;
}

.modal-footer button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* 애니메이션 */
@keyframes modal-pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>