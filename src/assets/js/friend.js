// src/api/friends.js
import api from '@/plugins/axios.js';

export async function fetchFriends({ limit = 50, cursor = null } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;

  const { data } = await api.get('/v1/friend', { params });
  // 백엔드 ApiResponse<CursorPageResponse<...>> 가정:
  // { code, message, data: { items, next, hasNext } }
  const payload = data?.data ?? data;
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

