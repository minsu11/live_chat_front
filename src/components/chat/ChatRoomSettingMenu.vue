<template>
  <div class="room-settings-menu">
    <button class="room-settings-menu__trigger" @click="toggleMenu">
      ⚙️
    </button>

    <div v-if="open" class="room-settings-menu__dropdown">
      <button @click="emitEditRoomName">채팅방 이름 변경</button>
      <button @click="emitToggleNotification">
        {{ notificationEnabled ? '알림 끄기' : '알림 켜기' }}
      </button>
      <button class="danger" @click="emitLeaveRoom">채팅방 나가기</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatRoomSettingsMenu',
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
  },
};
</script>