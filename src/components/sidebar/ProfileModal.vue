<template>
  <div class="overlay" @click.self="close" @keyup.esc="close" tabindex="0">
    <div class="modal">
      <button class="close-btn" @click="close">✕</button>

      <!-- 프로필 보기 모드 -->
      <div v-if="!isEditing">
        <img :src="user.profileUrl || defaultProfile" class="avatar-large" />
        <h3>{{ user.nickName }}</h3>

        <p class="status">
          {{ user.message && user.message.trim() !== ''
            ? user.message
            : '상태 메시지가 없습니다.' }}
        </p>

        <div class="actions" v-if="isMe">
          <button @click="isEditing = true">프로필 수정</button>
          <button @click="goToSettings">설정</button>
        </div>
      </div>

      <!-- 프로필 수정 모드 -->
      <div v-else>
        <h3>프로필 수정</h3>

        <div class="edit-avatar">
          <img
              :src="previewUrl || user.profileUrl || defaultProfile"
              class="avatar-large clickable"
              @click="triggerFileSelect"
          />
          <input
              ref="fileInput"
              type="file"
              @change="onFileChange"
              style="display: none"
          />
        </div>

        <div class="form-group">
          <label>이름</label>
          <input
              v-model="editName"
              type="text"
              placeholder="닉네임을 입력하세요"
              class="form-input"
          />
        </div>

        <div class="form-group">
          <label>상태메시지</label>
          <textarea
              v-model="editMessage"
              placeholder="상태 메시지를 입력하세요"
              class="form-input"
          ></textarea>
        </div>

        <div class="actions">
          <button class="btn-primary" @click="saveProfile">저장</button>
          <button class="btn-secondary" @click="cancelEdit">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'ProfileModal',
  props: {
    user: {type: Object, required: true},
    isMe: {type: Boolean, required:true }
  },
  data() {
    return {
      defaultProfile,
      isEditing: false,       // 편집 모드 여부
      editName: '',         // 닉네임 입력용
      editMessage: '',        // 수정 중인 상태 메시지
      previewUrl: null,        // 새 프로필 이미지 미리보기
      selectedFile: null
    };
  },
  mounted() {
    this.$el.focus(); // ESC 감지를 위해 포커스 필요
      this.editName = this.user.nickName || '';
      this.editMessage = this.user.message || ''
 },
  methods: {
    close() {
      this.$emit('close');
    },
    goToSettings() {
      this.$emit('close');
      this.$emit('open-settings'); // 부모에서 라우터 이동 처리
    },
    triggerFileSelect() {
      this.$refs.fileInput.click();
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.previewUrl = URL.createObjectURL(file);
        this.selectedFile = file;
      }console.log(file);
    },
    cancelEdit() {
      this.isEditing = false;
      this.editMessage = this.user.message || '';
      this.previewUrl = null;
      this.selectedFile =null;
    },

    saveProfile() {
      // 부모에 수정 이벤트 전달 (API 호출은 부모에서 처리)
      this.$emit('update-profile', {
        name: this.editName,
        message: this.editMessage,
        file: this.selectedFile
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
  background: rgba(10, 15, 25, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* ✨ 유리 + 은은한 블루 조명 효과 */
.modal {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(77, 171, 247, 0.25),
  0 0 40px rgba(30, 144, 255, 0.15);
  padding: 24px;
  border-radius: 16px;
  width: 300px;
  text-align: center;
  position: relative;
  color: #e9f3ff;
  transition: box-shadow 0.3s ease;
}
.modal:hover {
  box-shadow: 0 0 25px rgba(77, 171, 247, 0.35),
  0 0 60px rgba(30, 144, 255, 0.25);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #fff;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 15px rgba(77, 171, 247, 0.3);
}

.status {
  font-size: 14px;
  color: #d6e4f5;
  margin: 5px 0;
}

/* ✨ 버튼 - 유리 위의 은은한 파란 네온 효과 */
.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(6px);
}

.btn-primary {
  background: rgba(77, 171, 247, 0.3);
  color: #fff;
  box-shadow: 0 0 8px rgba(77, 171, 247, 0.4);
}
.btn-primary:hover {
  background: rgba(77, 171, 247, 0.55);
  box-shadow: 0 0 16px rgba(77, 171, 247, 0.7);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #f1f1f1;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ✨ 입력창 */
.form-group {
  text-align: left;
  margin-bottom: 12px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #dbe8f9;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  color: #eaf2ff;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
}
textarea.form-input {
  min-height: 60px;
  resize: none;
}

.actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.edit-avatar {
  margin-bottom: 10px;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.2s;
}
.clickable:hover {
  opacity: 0.8;
}
</style>
