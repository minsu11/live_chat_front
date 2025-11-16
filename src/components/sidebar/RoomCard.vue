<template>
  <div class="room-card" @click="$emit('open-chat', room)">
    <img :src="room.profile || defaultProfile" class="avatar" />
    <div class="info">
      <div class="top">
        <span class="title">{{ room.title }}</span>
        <span class="time" v-if="room.lastMessageAtDisplay">{{ room.lastMessageAtDisplay }}</span>
      </div>
      <div class="preview" v-if="room.lastMessagePreview">{{ room.lastMessagePreview }}</div>
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'RoomCard',
  props: {
    room: { type: Object, required: true }, // { id, title, profile, lastMessageAtDisplay, lastMessagePreview? }
  },
  emits: ['open-chat'],
  data() {
    return { defaultProfile };
  },
};
</script>

<style scoped>
.room-card {
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.room-card:hover { background: #f1f3f5; }

.avatar { width: 25px; height: 25px; border-radius: 50%; flex: 0 0 auto; }

.info { flex: 1; min-width: 0; }

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: #868e96;
  flex: 0 0 auto;
}

.preview {
  font-size: 12px;
  color: #868e96;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
</style>
