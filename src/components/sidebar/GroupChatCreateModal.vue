<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="modal">

      <h3>{{ isInviteMode ? '대화 상대 초대' : '그룹 채팅 생성' }}</h3>

      <!-- 검색 -->
      <input v-model="search" placeholder="친구 검색" />

      <!-- 선택된 친구 -->
      <div class="chips">
        <div class="chips-header">
          <span class="count">선택 {{ selected.length }}명</span>
        </div>
        <div v-for="f in selectedFriends" :key="f.uuid" class="chip">
          <img :src="f.profileUrl || defaultProfile" class="chip-img" />
          {{ f.nickName || f.name }}
          <span @click="remove(f.uuid)">×</span>
        </div>
      </div>

      <!-- 리스트 -->
      <div class="list">
        <div
            v-for="f in filtered"
            :key="f.uuid"
            class="item"
            :class="{ selected: isSelected(f.uuid) }"
            @click="toggle(f.uuid)"
        >
          <!-- 프로필 -->
          <img
              :src="f.profileUrl || defaultProfile"
              class="avatar"
          />

          <!-- 이름 -->
          <span class="name">
    {{ f.nickName || f.name }}
  </span>

          <!-- 체크 -->
          <div class="check-circle" v-if="isSelected(f.uuid)">
            ✓
          </div>
        </div>
      </div>

      <!-- 제목 -->
      <div v-if="!isInviteMode" class="title-input-wrapper">
        <input v-model="title" placeholder="채팅방 이름 (선택사항)" />
      </div>

      <div class="actions">
        <button class="cancel-btn" @click="$emit('close')">취소</button>
        <button
            class="submit-btn"
            @click="submit"
            :disabled="selected.length === 0 || loading"
        >
          {{ loading ? '처리 중...' : (isInviteMode ? '초대' : '생성') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';
import {no} from "vuetify/locale";

export default {
  props: {
    friends: Array,
    loading: Boolean,
    isInviteMode: {
      type: Boolean,
      default: false
    },
  },

  data() {
    return {
      selected: [],
      title: '',
      search: '',
      defaultProfile
    }
  },

  computed: {
    filtered() {
      if (!this.search) return this.friends
      return this.friends.filter(f =>
          (f.name || '').includes(this.search)
      )
    },

    selectedFriends() {
      return this.friends.filter(f =>
          this.selected.includes(f.uuid)
      )
    }
  },

  methods: {
    toggle(uuid) {
      const i = this.selected.indexOf(uuid)
      i > -1
          ? this.selected.splice(i, 1)
          : this.selected.push(uuid)
    },

    remove(uuid) {
      this.selected = this.selected.filter(v => v !== uuid)
    },

    isSelected(uuid) {
      return this.selected.includes(uuid)
    },


    submit() {
      const normalizedTitle = this.title?.trim();
      this.$emit('submit', {
        title: normalizedTitle ? normalizedTitle : null,
        memberUuids: this.selected
      })
    }
  }
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  /* 💡 채팅 패널 헤더나 설정 서랍(9999)보다 높게 설정 */
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.actions {
  display: flex;
  justify-content: flex-end;
  /* 💡 버튼 사이의 간격을 8px 만큼 벌림 */
  gap: 8px;
  margin-top: 20px;
}

/* (참고) 취소 버튼 스타일이 너무 붙어 보인다면 padding 확인 */
.cancel-btn {
  background: #f1f3f5;
  color: #495057;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}


.modal {
  width: 420px;
  margin: auto;
  background: white;
  padding: 20px;
  border-radius: 14px;
}

/* 검색 */
.search {
  width: 100%;
  height: 38px;
  margin-bottom: 10px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.submit-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
/* chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #e7f5ff;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 12px;
}

.chip-img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}
/* 리스트 */
.list {
  max-height: 240px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid #eee;
}

/* 아이템 */
.item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* hover */
.item:hover {
  background: #f8f9fa;
}

/* 선택 상태 */
.item.selected {
  background: #e7f5ff;
  transform: scale(1.01);
}

/* 클릭 애니메이션 */
.item:active {
  transform: scale(0.98);
}

/* 프로필 */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

/* 이름 */
.name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

/* 체크 (핵심 카카오 스타일) */
.check-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4dabf7;
  color: white;
  font-size: 13px;
  font-weight: bold;

  display: flex;
  align-items: center;
  justify-content: center;

  animation: pop 0.15s ease;
}

/* 체크 애니메이션 */
@keyframes pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #e7f5ff;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  animation: fadeIn 0.2s ease;
}

.chip span {
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chips-header {
  display: flex;
  justify-content: flex-end;
}

.count {
  font-size: 12px;
  color: #868e96;
  margin: 6px 0 8px 4px;
}
</style>