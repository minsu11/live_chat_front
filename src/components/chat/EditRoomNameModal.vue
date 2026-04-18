<template>
  <div v-if="modelValue" class="modal-backdrop">
    <div class="modal">
      <h3>채팅방 이름 변경</h3>

      <input
          v-model.trim="roomName"
          type="text"
          maxlength="50"
          placeholder="채팅방 이름을 입력하세요"
      />

      <div class="modal-actions">
        <button @click="close">취소</button>
        <button :disabled="saving" @click="save">저장</button>
      </div>
    </div>
  </div>
</template>

<script>
import { updateRoomCustomName } from '@/api/chat-room-settings.js';

export default {
  name: 'EditRoomNameModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    roomId: {
      type: [Number, String],
      required: true,
    },
    initialRoomName: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      roomName: '',
      saving: false,
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(open) {
        if (open) {
          this.roomName = this.initialRoomName ?? '';
        }
      },
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    async save() {
      if (this.saving) return;

      try {
        this.saving = true;

        const result = await updateRoomCustomName(this.roomId, {
          customRoomName: this.roomName,
        });

        this.$emit('saved', result);
        this.close();
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>