<template>
  <div v-if="modelValue" class="modal-backdrop">
    <div class="modal">
      <h3>채팅방 나가기</h3>
      <p>정말 이 채팅방을 나가시겠습니까?</p>

      <div class="modal-actions">
        <button @click="close">취소</button>
        <button class="danger" :disabled="leaving" @click="confirmLeave">
          나가기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { leaveRoom } from '@/api/chat-room-settings.js';

export default {
  name: 'LeaveRoomConfirmModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    roomId: {
      type: [Number, String],
      required: true,
    },
  },
  emits: ['update:modelValue', 'confirmed'],
  data() {
    return {
      leaving: false,
    };
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    async confirmLeave() {
      if (this.leaving) return;

      try {
        this.leaving = true;
        await leaveRoom(this.roomId);
        this.$emit('confirmed', this.roomId);
        this.close();
      } finally {
        this.leaving = false;
      }
    },
  },
};
</script>