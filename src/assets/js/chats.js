// src/api/chats.js
import api from '@/plugins/axios.js';

export async function fetchChats({ limit = 50, cursor = null } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;

  const payload = await api.get('/v1/chat-list', { params });

  console.log(payload)
  console.log(payload.items)
  return {
    items: payload?.items ?? [],
    next: payload?.next ?? null,
    hasNext: !!payload?.hasNext,
  };
}
