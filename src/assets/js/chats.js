// src/api/chats.js
import api from '@/plugins/axios.js';

export async function fetchChats({ limit = 50, cursor = null } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;

  const { data } = await api.get('/v1/chat-list', { params });
  const payload = data?.data ?? data;
  return {
    items: payload?.items ?? [],
    next: payload?.next ?? null,
    hasNext: !!payload?.hasNext,
  };
}
