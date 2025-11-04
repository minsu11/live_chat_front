<!-- src/components/sidebar/ChatList.vue -->
<template>
  <div class="list-container">
    <!-- 리스트 제목 -->
    <p class="list-title">대화방 목록</p>

    <!-- 대화방이 하나라도 있을 때 -->
    <ul v-if="items.length > 0">
      <!-- v-for: items 배열을 순회하며 각 대화방(li) 렌더링 -->
      <li
          v-for="(c, idx) in items"
          :key="idx"
          @click="$emit('open-chat', { item: c, type: 'chat' })"
      class="list-item" >
        <!-- 클릭 시 상위 컴포넌트로 'open-chat' 이벤트 발생 -->

        <!-- 프로필 이미지 (없을 시 기본 이미지 표시) -->
      <img :src="c.profile || defaultProfile" class="profile-img" />

      <!-- 대화방 제목, 마지막 메시지 시간 -->
      <div class="room-line">
        <div class="room-title">{{ c.title }}</div>
        <div class="room-sub">{{ c.lastMessageAtDisplay }}</div>
      </div>
      </li>
    </ul>

    <!-- 대화방이 없을 때 -->
    <p v-else class="empty-text">대화방이 없습니다 🐰</p>

    <!-- 로딩 중 표시 -->
    <div v-if="loading" class="loading">로딩 중...</div>

    <!-- 더보기 버튼 (수동 로딩 시 사용) -->
    <button
        v-if="!loading && hasNext"
        class="more-btn"
        @click="loadMore"
    >
      더 보기
    </button>

    <!-- IntersectionObserver가 감시할 마지막 요소 -->
    <div ref="sentinel" style="height:1px;"></div>
  </div>
</template>

<script>
import defaultProfile from '@/assets/default_image.png';      // 기본 프로필 이미지
import { fetchChats } from '@/assets/js/chats.js';           // 서버에서 채팅방 목록을 가져오는 함수

// 날짜/시간을 보기 좋은 문자열로 변환하는 유틸 함수
function formatTime(isoOrLocalDateTime) {
  try {
    const d = new Date(isoOrLocalDateTime);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();  // 로컬 시간 형식으로 변환
  } catch {
    return '';
  }
}

export default {
  name: 'ChatList',
  emits: ['open-chat'], // 부모로 보낼 이벤트 정의
  props: {
    pageSize: { type: Number, default: 50 }, // 한 번에 가져올 대화방 수
  },
  data() {
    return {
      defaultProfile,
      items: [],      // 대화방 목록 데이터
      cursor: null,   // 다음 페이지 요청용 커서
      hasNext: false, // 다음 페이지 존재 여부
      loading: false, // 로딩 상태
      observer: null, // IntersectionObserver 인스턴스
      error: null,    // 에러 저장용
    };
  },
  mounted() {
    this.loadInitial(); // 컴포넌트가 처음 마운트될 때 첫 페이지 로드

    // 스크롤 감지용 IntersectionObserver 등록
    this.observer = new IntersectionObserver((entries) => {
      // sentinel이 화면에 보이면 다음 페이지 자동 로드
      if (entries[0].isIntersecting && this.hasNext && !this.loading) {
        this.loadMore();
      }
    });
    this.observer.observe(this.$refs.sentinel);
  },
  beforeUnmount() {
    // 컴포넌트 해제 시 observer 정리
    if (this.observer) this.observer.disconnect();
  },
  methods: {
    // 처음 한 번 데이터 로드
    async loadInitial() {
      this.loading = true;
      this.error = null;
      try {
        // 서버에서 채팅방 목록 요청
        const { items, next, hasNext } = await fetchChats({
          limit: this.pageSize,
          cursor: null,
        });
        // 응답 데이터를 화면용으로 매핑
        this.items = items.map((it) => ({
          id: it.chatRoomId ?? it.id,
          title: it.name ?? it.title,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          raw: it, // 원본 데이터 보관
        }));
        this.cursor = next;   // 다음 페이지 커서 저장
        this.hasNext = hasNext;
      } catch (e) {
        this.error = e;
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    // 다음 페이지 로드 (무한 스크롤 or 더보기 버튼)
    async loadMore() {
      if (!this.hasNext || this.loading) return;
      this.loading = true;
      this.error = null;
      try {
        const { items, next, hasNext } = await fetchChats({
          limit: this.pageSize,
          cursor: this.cursor,
        });
        const mapped = items.map((it) => ({
          id: it.chatRoomId ?? it.id,
          title: it.name ?? it.title,
          profile: it.profileUrl ?? null,
          lastMessageAt: it.lastMessageAt,
          lastMessageAtDisplay: formatTime(it.lastMessageAt),
          raw: it,
        }));
        // 이전 데이터 뒤에 추가
        this.items = [...this.items, ...mapped];
        this.cursor = next;
        this.hasNext = hasNext;
      } catch (e) {
        this.error = e;
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    // 새로고침 시 초기화 후 다시 로드
    async refresh() {
      this.cursor = null;
      this.items = [];
      this.hasNext = false;
      await this.loadInitial();
    },
  },
};
</script>

<style scoped>
/* 전체 리스트 영역 */
.list-container { flex: 1; overflow-y: auto; }

/* 제목 */
.list-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }

/* 대화방 항목 */
.list-item {
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.list-item:hover { background: #f1f3f5; }

/* 프로필 이미지 */
.profile-img { width: 25px; height: 25px; border-radius: 50%; }

/* 대화방 텍스트 */
.room-line { display: flex; flex-direction: column; }
.room-title { font-weight: 600; }
.room-sub { font-size: 12px; color: #868e96; }

/* 빈 목록 문구 */
.empty-text { font-size: 13px; color: #868e96; text-align: center; margin-top: 20px; }

/* 로딩 표시 */
.loading { font-size: 13px; color: #868e96; text-align: center; margin: 10px 0; }

/* '더 보기' 버튼 */
.more-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.more-btn:hover { background: #f8f9fa; }
</style>
