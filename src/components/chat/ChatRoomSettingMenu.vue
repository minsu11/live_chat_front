<template>
  <div>
    <button class="room-settings-trigger" @click="toggleMenu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#495057" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <transition name="fade">
      <div v-if="open" class="drawer-backdrop" @click="toggleMenu"></div>
    </transition>

    <div class="settings-drawer" :class="{ 'is-open': open }">
      <div class="drawer-header">
        <h3>채팅방 설정</h3>
        <button class="close-btn" @click="toggleMenu">✕</button>
      </div>

      <div class="drawer-content">
        <button class="menu-item" @click="emitEditRoomName">
          <span class="icon">✏️</span>
          <span class="text">채팅방 이름 변경</span>
        </button>

        <button class="menu-item" @click="emitToggleNotification">
          <span class="icon">{{ notificationEnabled ? '🔕' : '🔔' }}</span>
          <span class="text">{{ notificationEnabled ? '알림 끄기' : '알림 켜기' }}</span>
        </button>

        <button class="menu-item" @click="openInviteModal">
          <span class="icon">➕</span>
          <span class="text">대화 상대 초대</span>
        </button>

        <div class="divider"></div>

        <button class="menu-item danger" @click="emitLeaveRoom">
          <span class="icon">🚪</span>
          <span class="text">채팅방 나가기</span>
        </button>
      </div>
      <GroupChatCreateModal
      v-if="showInviteModal"
      :friends="inviteableFriends"
      @close="showInviteModal = false"
      @submit="handleInviteSubmit"
      />
    </div>
  </div>
</template>

<script>
import GroupChatCreateModal from "@/components/sidebar/GroupChatCreateModal.vue";
export default {
  name: 'ChatRoomSettingsMenu',
  components:{GroupChatCreateModal}
  ,
  props: {
    roomId: {
      type: [Number, String],
      required: true,
    },
    notificationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      open: false,
    };
  },
  methods: {
    toggleMenu() {
      this.open = !this.open;
    },
    emitEditRoomName() {
      this.open = false;
      this.$emit('edit-room-name');
    },
    emitToggleNotification() {
      this.open = false;
      this.$emit('toggle-notification');
    },
    emitLeaveRoom() {
      this.open = false;
      this.$emit('leave-room');
    },

    async openInviteModal() {
      try {
        // 1. 현재 방에 있는 멤버 목록을 가져옵니다. (백엔드에 GET /v1/chat-room/{roomId}/members API가 있다고 가정)
        const members = await api.get(`/v1/chat-room/${this.roomId}/members`);
        const memberUuids = members.map(m => m.uuid);

        // 2. 내 친구 목록을 가져옵니다.
        const friendsRes = await api.get('/v1/friends', { params: { limit: 100 } });
        const allFriends = friendsRes.items || [];

        // 3. 내 친구 중 '이미 방에 있는 사람'은 제외합니다.
        this.inviteableFriends = allFriends.filter(f => !memberUuids.includes(f.uuid));

        if (this.inviteableFriends.length === 0) {
          alert('초대할 수 있는 친구가 없습니다. (모두 이미 방에 있습니다)');
          return;
        }

        // 4. 모달을 엽니다.
        this.showInviteModal = true;
      } catch (e) {
        console.error('초대 목록을 불러오는데 실패했습니다.', e);
      }
    },

    // 💡 추가: 모달에서 '생성/초대' 버튼을 눌렀을 때
    async handleInviteSubmit({ memberUuids }) {
      if (!memberUuids || memberUuids.length === 0) return;

      try {
        // 백엔드 초대 API 호출
        await api.post(`/v1/chat-room/${this.roomId}/invite`, memberUuids);

        this.showInviteModal = false;
        this.open = false; // 설정 서랍 닫기
        alert('성공적으로 초대했습니다!');
        // (필요하다면 this.$emit('toast', ...) 로 교체)

      } catch (e) {
        console.error('초대 실패:', e);
        alert('초대에 실패했습니다.');
      }
    },
  },
};
</script>

<style scoped>
/* 트리거 버튼 (햄버거 아이콘) */
.room-settings-trigger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.room-settings-trigger:hover {
  background-color: #f1f3f5;
}

/* 1. 뒷배경 어둡게 (Backdrop) */
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998; /* 채팅 패널보다 무조건 위에 */
}

/* 백드롭 부드럽게 나타나는 애니메이션 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 2. 사이드 서랍장 (Drawer) 기본 설정 (화면 오른쪽 밖에 숨어있음) */
.settings-drawer {
  position: fixed;
  top: 0;
  right: -320px; /* 서랍 가로폭만큼 마이너스 줘서 숨김 */
  width: 300px;
  height: 100vh;
  background: #ffffff;
  z-index: 9999; /* 백드롭보다 한 칸 위 */
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 스르륵 나오는 애니메이션 */
}

/* 서랍장이 열렸을 때 (화면 우측에 딱 붙음) */
.settings-drawer.is-open {
  right: 0;
}

/* 서랍장 헤더 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f1f3f5;
}

.drawer-header h3 {
  margin: 0;
  font-size: 18px;
  color: #212529;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #868e96;
}

/* 서랍장 내용물 (버튼들) */
.drawer-content {
  flex: 1;
  padding: 10px 0;
  overflow-y: auto;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-item .icon {
  font-size: 20px;
  margin-right: 14px;
  width: 24px;
  text-align: center;
}

.menu-item .text {
  font-size: 16px;
  color: #495057;
  font-weight: 500;
}

.menu-item.danger .text {
  color: #fa5252; /* 나가기 버튼은 빨간색 포인트 */
}

/* 항목 사이 구분선 */
.divider {
  height: 8px;
  background-color: #f1f3f5;
  margin: 8px 0;
}
</style>