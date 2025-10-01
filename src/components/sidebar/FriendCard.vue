<template>
  <div class="friend-card" @click="$emit('open-profile', friend)">
    <img :src="friend.profileUrl || defaultProfile" class="avatar" />
    <div class="info">
      <div class="name">{{ friend.name }}</div>
<!--      <div class="message">{{ friend.name }}</div>-->
    </div>
    <div class="actions">
      <button @click="$emit('remove', friend.uuid)">삭제</button>
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'FriendCard',
  props: {
    friend: { type: Object, required: true },
  },
  data() {
    return { defaultProfile };
  },
};
</script>

<style scoped>
.friend-card {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0.75rem;
}
.info {
  flex: 1;
}
.name {
  font-weight: 600;
}
.sub {
  font-size: 0.8rem;
  color: #666;
}
.actions button {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
