<!--&lt;!&ndash; src/components/SidebarContainer.vue &ndash;&gt;-->
<!--<template>-->
<!--  <Sidebar-->
<!--      :current-view="currentView"-->
<!--      :friends="friends"-->
<!--      :chats="chats"-->
<!--      @update-view="onUpdateView"-->
<!--      @open-chat="onOpenChat"-->
<!--  />-->

<!--  &lt;!&ndash; 하단 더보기 버튼 (선택) &ndash;&gt;-->
<!--  <div class="more-box" v-if="currentView === 'friends' && friendsHasNext">-->
<!--    <v-btn small outlined @click="loadMoreFriends">친구 더보기</v-btn>-->
<!--  </div>-->
<!--  <div class="more-box" v-else-if="currentView === 'chats' && chatsHasNext">-->
<!--    <v-btn small outlined @click="loadMoreChats">대화 더보기</v-btn>-->
<!--  </div>-->
<!--</template>-->

<!--<script>-->
<!--import Sidebar from './Sidebar.vue';-->
<!--import { fetchChatRooms, fetchFriends } from '@/api';-->

<!--export default {-->
<!--  name: 'SidebarContainer',-->
<!--  components: { Sidebar },-->
<!--  data() {-->
<!--    return {-->
<!--      userId: 1, // 실제로는 로그인 후 스토어/토큰에서 가져오기-->
<!--      currentView: 'friends',-->
<!--      // 데이터-->
<!--      friends: [],-->
<!--      chats: [],-->
<!--      // 커서-->
<!--      friendsCursor: null,-->
<!--      chatsCursor: null,-->
<!--      // hasNext-->
<!--      friendsHasNext: false,-->
<!--      chatsHasNext: false,-->
<!--      // 로딩 가드-->
<!--      loadingFriends: false,-->
<!--      loadingChats: false,-->
<!--    };-->
<!--  },-->
<!--  mounted() {-->
<!--    // 최초 로드: 친구/대화 둘 다 첫 페이지 당겨놓고 탭 전환해도 즉시 보이게-->
<!--    this.loadMoreFriends(true);-->
<!--    this.loadMoreChats(true);-->
<!--  },-->
<!--  methods: {-->
<!--    onUpdateView(view) {-->
<!--      this.currentView = view;-->
<!--    },-->
<!--    onOpenChat(payload) {-->
<!--      // { item, type: 'friend' | 'chat' }-->
<!--      // 라우팅 또는 상위로 이벤트 emit-->
<!--      this.$emit('open-chat', payload);-->
<!--    },-->
<!--    async loadMoreFriends(initial = false) {-->
<!--      if (this.loadingFriends) return;-->
<!--      this.loadingFriends = true;-->
<!--      try {-->
<!--        const res = await fetchFriends({-->
<!--          userId: this.userId,-->
<!--          limit: 20,-->
<!--          cursor: initial ? null : this.friendsCursor,-->
<!--          // keyword는 Sidebar의 검색창과 연동하려면 prop/emit으로 넘겨서 사용-->
<!--        });-->
<!--        if (initial) this.friends = [];-->
<!--        this.friends.push(...(res.items || []));-->
<!--        this.friendsCursor = res.nextCursor || null;-->
<!--        this.friendsHasNext = !!res.hasNext;-->
<!--      } finally {-->
<!--        this.loadingFriends = false;-->
<!--      }-->
<!--    },-->
<!--    async loadMoreChats(initial = false) {-->
<!--      if (this.loadingChats) return;-->
<!--      this.loadingChats = true;-->
<!--      try {-->
<!--        const res = await fetchChatRooms({-->
<!--          userId: this.userId,-->
<!--          limit: 20,-->
<!--          cursor: initial ? null : this.chatsCursor,-->
<!--        });-->
<!--        if (initial) this.chats = [];-->
<!--        this.chats.push(...(res.items || []));-->
<!--        this.chatsCursor = res.nextCursor || null;-->
<!--        this.chatsHasNext = !!res.hasNext;-->
<!--      } finally {-->
<!--        this.loadingChats = false;-->
<!--      }-->
<!--    },-->
<!--  },-->
<!--};-->
<!--</script>-->

<!--<style scoped>-->
<!--.more-box {-->
<!--  padding: 8px;-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--}-->
<!--</style>-->
