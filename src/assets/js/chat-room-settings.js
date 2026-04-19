import api from '@/plugins/axios.js';

export async function updateRoomCustomName(roomId, payload) {
    return await api.patch(`/v1/chat-room/${roomId}/settings/name`, payload);
}

export async function updateRoomNotification(roomId, payload) {
    return await api.patch(`/v1/chat-room/${roomId}/settings/notification`, payload);
}

export async function leaveRoom(roomId) {
    return await api.delete(`/v1/chat-room/${roomId}/settings/me`);
}