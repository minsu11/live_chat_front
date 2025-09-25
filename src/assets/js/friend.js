// src/api/friends.js
import api from '@/plugins/axios.js';

// 친구를 불러오는 메서드
export async function getFriends({ limit = 2, cursor = null } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;

  const res = await api.get('/v1/friends', { params });


  // 백엔드 ApiResponse<CursorPageResponse<...>> 가정:
  // { code, message, data: { items, next, hasNext } }
  const payload = res.data ?? res; // data 래핑 여부 고려
  console.log(res.next)
  console.log("payload : ", payload);
  return {
    items: payload?.items ?? [],
    next: payload?.next ?? null,
    hasNext: !!payload?.hasNext,
  };
}

export async function requestFriend({ targetUserId }) {
  // 백엔드 엔드포인트에 맞게 하나 골라서 쓰기
  // 1) 바디로: POST /api/v1/friends/requests { targetUserId }
  // 2) 쿼리로: POST /api/v1/friends/requests?targetId=...

  console.log("targetUserId: ", targetUserId);
  const res = await api.post('/v1/friends/register', { friendId: targetUserId }, {
    withCredentials: true,
  });
  console.log(res)
  return res;
}

