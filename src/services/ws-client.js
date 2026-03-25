import { Client } from '@stomp/stompjs';
import api from '@/plugins/axios.js';
import SockJS from 'sockjs-client';

let stompClient = null;
let connectPromise = null;
let subscriptions = [];

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
            connectPromise = null;
            resolve(value);
        };

        const safeReject = (error) => {
            if (settled) return;
            settled = true;
            connectPromise = null;
            reject(error);
        };

        try {
            console.log('🔌 WebSocket 연결 시작');

            const res = await api.get('/ws/token');
            console.log('ws token response=', res);

            // 네 axios 플러그인 구조에 따라 둘 중 하나 선택
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
                reconnectDelay: 0,

                onConnect: (frame) => {
                    console.log('✅ WebSocket connected', frame);
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
                    if (!stompClient?.connected) {
                        safeReject(event);
                    }
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
        }
    });

    return connectPromise;
}

export function subscribe(destination, callback) {
    console.log('📡 subscribe 시도:', destination, 'connected=', stompClient?.connected);

    if (!stompClient || !stompClient.connected) {
        console.warn('WebSocket이 연결되지 않아 구독 실패:', destination);
        return null;
    }

    const sub = stompClient.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        console.log('📥 실시간 메시지 수신:', destination, data);
        callback(data);
    });

    subscriptions.push(sub);
    return sub;
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

export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        connectPromise = null;
        console.log('🔌 WebSocket disconnected');
    }
}