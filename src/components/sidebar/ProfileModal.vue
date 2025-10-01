<template>
  <div class="overlay" @click.self="close" @keyup.esc="close" tabindex="0">
    <div class="modal">
      <button class="close-btn" @click="close">✕</button>

      <!-- 프로필 보기 모드 -->
      <div v-if="!isEditing">
        <img :src="user.profileUrl || defaultProfile" class="avatar-large" />
        <h3>{{ user.name }}</h3>

        <p class="status">
          {{ user.message && user.message.trim() !== ''
            ? user.message
            : '상태 메시지가 없습니다.' }}
        </p>

        <div class="actions">
          <button @click="isEditing = true">프로필 수정</button>
          <button @click="goToSettings">설정</button>
        </div>
      </div>

      <!-- 프로필 수정 모드 -->
      <div v-else>
        <h3>프로필 수정</h3>

        <!-- 프로필 이미지 -->
        <div class="edit-avatar">
          <img :src="previewUrl || user.profileUrl || defaultProfile" class="avatar-large" />
          <input type="file" @change="onFileChange" />
        </div>

        <!-- 상태 메시지 -->
        <textarea v-model="editMessage" placeholder="상태 메시지를 입력하세요"></textarea>

        <div class="actions">
          <button @click="saveProfile">저장</button>
          <button @click="cancelEdit">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'ProfileModal',
  props: {user: {type: Object, required: true}},
  data() {
    return {
      defaultProfile,
      isEditing: false,       // 편집 모드 여부
      editMessage: '',        // 수정 중인 상태 메시지
      previewUrl: null        // 새 프로필 이미지 미리보기
    };
  },
  mounted() {
    this.$el.focus(); // ESC 감지를 위해 포커스 필요
  },
  methods: {
    close() {
      this.$emit('close');
    },
    goToSettings() {
      this.$emit('close');
      this.$emit('open-settings'); // 부모에서 라우터 이동 처리
    },
    cancelEdit() {
      this.isEditing = false;
      this.editMessage = this.user.message || '';
      this.previewUrl = null;
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.previewUrl = URL.createObjectURL(file);
      }
    },
    saveProfile() {
      // 부모에 수정 이벤트 전달 (API 호출은 부모에서 처리)
      this.$emit('update-profile', {
        message: this.editMessage,
        file: this.previewUrl
      });
      this.isEditing = false;
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 300px;
  text-align: center;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.status {
  font-size: 14px;
  color: #555;
  margin: 5px 0;
}

.actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #4dabf7;
  color: white;
}

.edit-avatar {
  margin-bottom: 10px;
}

textarea {
  width: 100%;
  min-height: 60px;
  resize: none;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>
