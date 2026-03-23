import api from '@/plugins/axios.js';

export async function getOrCreateDmRoom(friendUuid) {
    if (!friendUuid) {
        throw new Error('상대 식별자가 없습니다.');
    }

    const res = await api.get(`/v1/chat-room/${friendUuid}/register`);

    if (!res?.roomId) {
        throw new Error('roomId를 받지 못했습니다.');
    }

    return res;
}

export async function moveToChatRoom(router, roomId) {
    if (!roomId) {
        throw new Error('roomId가 없습니다.');
    }

    await router.push({
        name: 'chatRoom',
        params: { roomId }
    });
}

export async function startDirectChat(router, friendUuid) {
    const result = await getOrCreateDmRoom(friendUuid);
    console.log("result: ", result);
    await moveToChatRoom(router, result.roomId);
    return result;
}

export async function openExistingChat(router, roomId) {
    await moveToChatRoom(router, roomId);
}