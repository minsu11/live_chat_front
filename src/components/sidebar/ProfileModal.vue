<template>
  <div class="overlay" @click.self="close" @keyup.esc="close" tabindex="0">
    <div class="modal">
      <button class="close-btn" @click="close">✕</button>
      <img :src="user.profileUrl || defaultProfile" class="avatar-large" />
      <h3>{{ user.name }}</h3>
      <p class="status">{{ user.statusMessage || '상태 메시지가 없습니다.' }}</p>
      <p class="detail">UUID: {{ user.userUuid }}</p>
      <p class="detail">이메일: {{ user.email || '비공개' }}</p>
      <!-- 필요시 더 많은 필드 -->
    </div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';

export default {
  name: 'ProfileModal',
  props: { user: { type: Object, required: true } },
  data() {
    return { defaultProfile };
  },
  mounted() {
    this.$el.focus(); // ESC 키 감지를 위해 포커스 필요
  },
  methods: {
    close() { this.$emit('close'); }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed; top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.3);
  display:flex; justify-content:center; align-items:center;
  z-index:1000;
}
.modal {
  background:white; padding:20px; border-radius:12px; width:300px; text-align:center;
  position:relative;
}
.close-btn {
  position:absolute; top:8px; right:8px;
  background:none; border:none; font-size:18px; cursor:pointer;
}
.avatar-large {
  width:80px; height:80px; border-radius:50%; margin-bottom:10px;
}
.status { font-size:14px; color:#555; margin:5px 0; }
.detail { font-size:12px; color:#777; margin:2px 0; }
</style>
