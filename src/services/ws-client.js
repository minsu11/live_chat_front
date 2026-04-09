import { Client } from '@stomp/stompjs';
import api from '@/plugins/axios.js';
import SockJS from 'sockjs-client';

let stompClient = null;
let connectPromise = null;
const subscriptionMap = new Map();

export function connectWebSocket() {
    if (stompClient?.connected) {
        console.log('✅ 이미 WebSocket 연결됨');
        return Promise.resolve(stompClient);
    }

    if (connectPromise) {
        console.log('⏳ 기존 WebSocket 연결 진행 중');
        return connectPromise;
    }

    connectPromise = new Promise(async (resolve, reject) => {
        let settled = false;

        const safeResolve = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const safeReject = (error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        try {
            console.log('🔌 WebSocket 연결 시작');

            const res = await api.get('/ws/token');
            console.log('ws token response=', res);

            const accessToken = typeof res === 'string' ? res : res?.data;

            if (!accessToken) {
                throw new Error('WebSocket 토큰이 비어 있음');
            }

            const socketApi = api.defaults.baseURL;
            console.log('socketApi=', socketApi);

            stompClient = new Client({
                webSocketFactory: () => new SockJS(`${socketApi}/ws-chat`),
                connectHeaders: {
                    Authorization: `Bearer ${accessToken}`,
                },
                reconnectDelay: 3000,

                onConnect: () => {
                    console.log('✅ WebSocket connected');
                    safeResolve(stompClient);
                },

                onStompError: (frame) => {
                    console.error('❌ STOMP Error:', frame);
                    safeReject(frame);
                },

                onWebSocketError: (event) => {
                    console.error('❌ WebSocket Error:', event);
                    safeReject(event);
                },

                onWebSocketClose: (event) => {
                    console.warn('🔌 WebSocket closed:', event);
                    // 연결 성공 전에 닫힌 경우만 reject
                    // if (!stompClient?.connected) {
                    //     safeReject(event);
                    // }
                },
            });

            stompClient.activate();

            setTimeout(() => {
                if (!stompClient?.connected) {
                    safeReject(new Error('WebSocket 연결 timeout'));
                }
            }, 5000);
        } catch (e) {
            console.error('❌ connectWebSocket 실패', e);
            safeReject(e);
        }finally {
            connectPromise = null;
        }
    });

    return connectPromise;
}

export async function subscribe(destination, callback, options = {}) {
    await  connectWebSocket();
    console.log('📡 subscribe 시도:', destination, 'connected=', stompClient?.connected);
    const { key = destination, replace = true } = options;

    if (!stompClient || !stompClient.connected) {
        console.warn('WebSocket이 연결되지 않아 구독 실패:', destination);
        return null;
    }
    if (replace && subscriptionMap.has(key)) {
        const oldSub = subscriptionMap.get(key);
        oldSub?.unsubscribe?.();
        subscriptionMap.delete(key);
    }
    const rawSub = stompClient.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        console.log('📥 실시간 메시지 수신:', destination, data);
        callback(data);
    });

    const wrappedSub = {
        unsubscribe() {
            rawSub.unsubscribe();
            if (subscriptionMap.get(key) === wrappedSub) {
                subscriptionMap.delete(key);
            }
        }
    }

    subscriptionMap.set(key, wrappedSub);

    return wrappedSub;
}

export function sendMessage(destination, payload) {
    console.log('📤 sendMessage:', destination, payload, 'connected=', stompClient?.connected);

    if (!stompClient || !stompClient.connected) {
        console.warn('⚠️ WebSocket이 연결되어 있지 않습니다.');
        return;
    }

    stompClient.publish({
        destination,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export function unsubscribeByKey(key){
    const sub = subscriptionMap.get(key);

    if(!sub) return;

    sub.unsubscribe();
    subscriptionMap.delete(key);
}

export function disconnectWebSocket() {
    subscriptionMap.forEach((sub) => sub?.unsubscribe?.());
    subscriptionMap.clear();
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        console.log('🔌 WebSocket disconnected');
    }
    connectPromise = null;
}