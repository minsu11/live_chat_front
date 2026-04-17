<template>
  <div class="chat-layout">
    <Sidebar
        :current-view="currentView"
        :chats="chats"
        :me="me"
        :notification-permission="notificationPermission"
        @changeView="changeView"
        @open-chat="openChat"
        @group-room-created="handleGroupRoomCreated"
        @enable-browser-notification="enableBrowserNotification"
        @toast="showToast"
    />

    <router-view />

    <MenuDropdown />

    <div
        v-if="chatToast"
        class="chat-toast"
        @click="handleToastClick"
    >
      <div class="chat-toast-title">{{ chatToast.title }}</div>
      <div class="chat-toast-preview">{{ chatToast.preview }}</div>
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue';
import defaultProfile from '@/assets/default_image.png';
import MenuDropdown from "@/components/MenuDropdown.vue";
import api from "@/plugins/axios.js";
import { fetchChats } from '@/assets/js/chats.js';
import { openExistingChat } from '@/assets/js/chat-navigation.js';
import { connectWebSocket, registerSubscription, disconnectWebSocket } from '@/services/ws-client.js';

export default {
  name: 'HomePage',
  components: { Sidebar, MenuDropdown },
  data() {
    return {
      currentView: 'friends',
      defaultProfile,
      chats: [],
      selectedChat: '',
      me: null,

      chatToast: null,
      chatToastTimer: null,

      globalSummarySubscription: null,
      notificationPermission: 'unsupported',

      roomTitleCache: {},
      roomTitleRequestMap: {},
    };
  },

  async created() {
    this.me = await api.get("v1/users/me/profile/summary");
    await this.loadChats();
    this.syncNotificationPermission();
  },

  async mounted() {
    try{
      await connectWebSocket();
      await this.subscribeGlobalSummary();
      document.addEventListener('visibilitychange', this.syncNotificationPermission);
    }catch(err){
      console.log(err)
    }
  },

  beforeUnmount() {
    if (this.chatToastTimer) {
      clearTimeout(this.chatToastTimer);
      this.chatToastTimer = null;
    }

    if (this.globalSummarySubscription) {
      if (typeof this.globalSummarySubscription.unsubscribe === 'function') {
        this.globalSummarySubscription.unsubscribe();
      } else if (typeof this.globalSummarySubscription === 'function') {
        this.globalSummarySubscription();
      }
      this.globalSummarySubscription = null;
    }
    disconnectWebSocket();

    document.removeEventListener('visibilitychange', this.syncNotificationPermission);
  },

  methods: {
    changeView(view) {
      this.currentView = view;
    },

    syncNotificationPermission() {
      if (!('Notification' in window)) {
        this.notificationPermission = 'unsupported';
        return;
      }

      this.notificationPermission = Notification.permission;
      console.log('Notification.permission =', this.notificationPermission);
    },

    async enableBrowserNotification() {
      if (!('Notification' in window)) {
        this.notificationPermission = 'unsupported';
        this.showToast('이 브라우저는 브라우저 알림을 지원하지 않아요.');
        return;
      }

      // 이미 허용된 상태
      if (Notification.permission === 'granted') {
        this.notificationPermission = 'granted';
        this.showToast('브라우저 알림이 이미 켜져 있어요.');
        return;
      }

      // 이미 차단된 상태
      if (Notification.permission === 'denied') {
        this.notificationPermission = 'denied';
        this.showToast('브라우저에서 알림이 차단되어 있어요. 주소창 왼쪽 사이트 권한에서 알림을 허용해 주세요.');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;

        if (permission === 'granted') {
          this.showToast('브라우저 알림이 켜졌어요.');
        } else if (permission === 'denied') {
          this.showToast('브라우저 알림이 차단되었어요. 사이트 권한에서 다시 허용해 주세요.');
        } else {
          this.showToast('브라우저 알림 권한 요청이 닫혔어요.');
        }
      } catch (e) {
        console.error('브라우저 알림 권한 요청 실패', e);
        this.showToast('브라우저 알림 권한 요청에 실패했어요.');
      }
    },

    async openChat(payload) {
      try {
        let roomId;

        if (typeof payload === 'number' || typeof payload === 'string') {
          roomId = payload;
        } else if (payload?.item) {
          roomId = payload.item.id;
        } else if (payload?.roomId) {
          roomId = payload.roomId;
        }

        if (!roomId) {
          alert('채팅방 정보 없음');
          return;
        }

        await openExistingChat(this.$router, roomId);
      } catch (e) {
        console.error(e);
      }
    },

    async loadChats() {
      const {items} = await fetchChats();
      this.chats = items;
    },

    findRoomTitle(roomId) {
      const room = this.chats.find(
          item => String(item.roomId ?? item.id) === String(roomId));
      return room?.displayName ?? room?.title ?? room?.name ?? null;
    },

    async handleGroupRoomCreated(roomId) {
      await this.loadChats();
      await this.openChat(roomId);
    },

    async subscribeGlobalSummary() {
      try {
        if (this.globalSummarySubscription) {
          return;
        }

        await connectWebSocket();

        const destination = '/user/api/sub/chat/notification';

        this.globalSummarySubscription = await registerSubscription(
            destination,
            (event) => {
          this.handleGlobalSummaryEvent(event);
        },
            { key: 'chat-notification', replace: true }
        );

        console.log('global summary 구독 완료:', destination);
      } catch (e) {
        console.error('global summary 구독 실패', e);
      }
    },

    async handleGlobalSummaryEvent(event) {
      if (!event?.roomId) return;

      const currentRoomId = this.$route.params.roomId;
      const isCurrentRoom =
          currentRoomId != null && String(currentRoomId) === String(event.roomId);
      const isVisible = !document.hidden && document.visibilityState == 'visible';
      // 현재 보고 있는 방이면 브라우저/토스트 알림 안 띄움
      if (isCurrentRoom && isVisible) {
        return;
      }
      const title = await this.resolveNotificationTitle(event.roomId);
      const payload = {
        roomId: event.roomId,
        title,
        preview: event.lastMessagePreview ?? event.preview ?? '새 메시지가 도착했습니다.',
      };

      // 탭 비활성화 상태면 브라우저 알림 우선
      if (!isVisible) {
        this.showBrowserNotification(payload);
        return;
      }

      // 활성 탭이면 토스트
      this.showChatToast(payload);
    },

    showBrowserNotification(payload) {
      this.syncNotificationPermission();

      if (!('Notification' in window)) {
        console.warn('Notification API 미지원');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.warn('브라우저 알림 권한 없음:', Notification.permission);
        return;
      }

      const notification = new Notification(payload.title ?? '채팅방', {
        body: payload.preview ?? '새 메시지가 도착했습니다.',
        tag: `chat-room-${payload.roomId}`,
        renotify: true,
      });

      notification.onclick = async () => {
        window.focus();
        await this.openChat(payload.roomId);
        notification.close();
      };
    },

    showChatToast(payload) {
      if (!payload?.roomId) return;

      this.chatToast = {
        roomId: payload.roomId,
        title: payload.title ?? '채팅방',
        preview: payload.preview ?? '새 메시지가 도착했습니다.',
      };

      if (this.chatToastTimer) {
        clearTimeout(this.chatToastTimer);
      }

      this.chatToastTimer = setTimeout(() => {
        this.chatToast = null;
        this.chatToastTimer = null;
      }, 3000);
    },
    async resolveNotificationTitle(roomId) {
      const key = String(roomId);

      // 이미 캐시에 있으면 재사용
      if (this.roomTitleCache[key]) {
        return this.roomTitleCache[key];
      }

      // 현재 로딩된 chat list에서 먼저 찾아봄
      const loadedTitle = this.findRoomTitle(roomId);
      if (loadedTitle && loadedTitle !== '채팅방') {
        this.roomTitleCache[key] = loadedTitle;
        return loadedTitle;
      }

      // 이미 같은 요청 진행 중이면 그 Promise 재사용
      if (this.roomTitleRequestMap[key]) {
        return this.roomTitleRequestMap[key];
      }

      this.roomTitleRequestMap[key] = api
          .get(`/v1/chat-room/${roomId}/summary`)
          .then((response) => {
            const title = response?.title?.trim() ? response.title : '채팅방';
            this.roomTitleCache[key] = title;
            return title;
          })
          .catch((e) => {
            console.error('알림 제목 조회 실패', roomId, e);
            return loadedTitle || '채팅방';
          })
          .finally(() => {
            delete this.roomTitleRequestMap[key];
          });

      return this.roomTitleRequestMap[key];
    },
    async handleToastClick() {
      if (!this.chatToast?.roomId) return;

      const roomId = this.chatToast.roomId;
      this.chatToast = null;

      await this.openChat(roomId);
    },

    onSearchFriend(keyword) {
      this.searchKeyword = keyword;
    },

    goToSettings() {
      this.$router.push('/settings');
    },

    logout() {
      alert('로그아웃 되었습니다.');
      this.$router.push('/login');
    },

    showToast(message) {
      console.log(message);
    },
  },
};
</script>

<style scoped>
.chat-layout {
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.menu-button {
  position: absolute;
  top: 10px;
  right: 20px;
}

.chat-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 280px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #2f3542;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  z-index: 9999;
}

.chat-toast-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
}

.chat-toast-preview {
  font-size: 13px;
  opacity: 0.9;
  word-break: break-word;
}
</style>