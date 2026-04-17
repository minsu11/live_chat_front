import { Client } from '@stomp/stompjs';
import api from '@/plugins/axios.js';
import SockJS from 'sockjs-client';

let stompClient = null;
let connectPromise = null;
let connectionState = 'idle'; // idle | connecting | connected | reconnecting | disconnected

const subscriptionRegistry = new Map();
const reconnectListeners = new Set();
const disconnectListeners = new Set();

let hasEverConnected = false;
let manualDisconnect = false;

export function getConnectionState() {
    return connectionState;
}

export function getStompClient() {
    return stompClient;
}

export function addReconnectListener(listener) {
    reconnectListeners.add(listener);
    return () => reconnectListeners.delete(listener);
}

export function addDisconnectListener(listener) {
    disconnectListeners.add(listener);
    return () => disconnectListeners.delete(listener);
}

function notifyReconnectListeners() {
    reconnectListeners.forEach((listener) => {
        try {
            listener();
        } catch (e) {
            console.error('❌ reconnect listener 실행 실패', e);
        }
    });
}

function notifyDisconnectListeners(event) {
    disconnectListeners.forEach((listener) => {
        try {
            listener(event);
        } catch (e) {
            console.error('❌ disconnect listener 실행 실패', e);
        }
    });
}

export async function ensureConnected() {
    return connectWebSocket();
}

export function connectWebSocket() {
    if (stompClient?.connected) {
        connectionState = 'connected';
        console.log('✅ 이미 WebSocket 연결됨');
        return Promise.resolve(stompClient);
    }

    if (connectPromise) {
        console.log('⏳ 기존 WebSocket 연결 진행 중');
        return connectPromise;
    }

    manualDisconnect = false;
    connectionState = connectionState === 'reconnecting' ? 'reconnecting' : 'connecting';

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
            const accessToken = typeof res === 'string' ? res : res?.data;

            if (!accessToken) {
                throw new Error('WebSocket 토큰이 비어 있음');
            }

            const socketApi = api.defaults.baseURL;

            stompClient = new Client({
                webSocketFactory: () => new SockJS(`${socketApi}/ws-chat`),
                connectHeaders: {
                    Authorization: `Bearer ${accessToken}`,
                },
                reconnectDelay: 3000,

                onConnect: () => {
                    console.log('✅ WebSocket connected');

                    const wasReconnect = hasEverConnected;
                    hasEverConnected = true;
                    connectionState = 'connected';

                    resubscribeAll();

                    // 최초 연결이 아니라 "재연결"일 때만 복구 훅 실행
                    if (wasReconnect) {
                        console.log('🔁 reconnect listener 실행');
                        notifyReconnectListeners();
                    }

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
                    connectionState = manualDisconnect ? 'disconnected' : 'reconnecting';
                    notifyDisconnectListeners(event);
                },
            });

            stompClient.activate();

            setTimeout(() => {
                if (!stompClient?.connected) {
                    connectionState = 'disconnected';
                    safeReject(new Error('WebSocket 연결 timeout'));
                }
            }, 5000);
        } catch (e) {
            console.error('❌ connectWebSocket 실패', e);
            connectionState = 'disconnected';
            safeReject(e);
        }
    });

    return connectPromise;
}

export async function registerSubscription(destination, callback, options = {}) {
    const {
        key = destination,
        replace = true,
        parseJson = true,
    } = options;

    if (replace && subscriptionRegistry.has(key)) {
        unsubscribeByKey(key);
    }

    const entry = {
        key,
        destination,
        callback,
        options: {
            key,
            replace,
            parseJson,
        },
        rawSub: null,
    };

    subscriptionRegistry.set(key, entry);

    await connectWebSocket();

    if (stompClient?.connected) {
        attachSubscription(entry);
    }

    return {
        unsubscribe() {
            unsubscribeByKey(key);
        },
    };
}

function attachSubscription(entry) {
    if (!stompClient || !stompClient.connected) {
        return null;
    }

    entry.rawSub?.unsubscribe?.();

    entry.rawSub = stompClient.subscribe(entry.destination, (message) => {
        try {
            const data =
                entry.options.parseJson === false
                    ? message.body
                    : JSON.parse(message.body);

            console.log('📥 실시간 메시지 수신:', entry.destination, data);
            entry.callback(data);
        } catch (e) {
            console.error('❌ 메시지 파싱/콜백 처리 실패:', entry.destination, e);
        }
    });

    return entry.rawSub;
}

function resubscribeAll() {
    if (!stompClient || !stompClient.connected) {
        return;
    }

    console.log('🔁 저장된 구독 자동 복구 시작');

    for (const entry of subscriptionRegistry.values()) {
        attachSubscription(entry);
    }

    console.log('✅ 저장된 구독 자동 복구 완료');
}

export function unsubscribeByKey(key) {
    const entry = subscriptionRegistry.get(key);
    if (!entry) return;

    entry.rawSub?.unsubscribe?.();
    subscriptionRegistry.delete(key);
}

export function unsubscribeAll() {
    for (const entry of subscriptionRegistry.values()) {
        entry.rawSub?.unsubscribe?.();
    }
    subscriptionRegistry.clear();
}

export function sendMessage(destination, payload) {
    console.log('📤 sendMessage:', destination, payload, 'connected=', stompClient?.connected);

    if (!stompClient || !stompClient.connected) {
        console.warn('⚠️ WebSocket이 연결되어 있지 않습니다.');
        return false;
    }

    stompClient.publish({
        destination,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return true;
}

/**
 * 정상 종료용
 * - 로그아웃 / 화면 나가기 등 사용자가 의도적으로 끊을 때 사용
 * - registry도 같이 비운다
 */
export function disconnectWebSocket() {
    manualDisconnect = true;
    unsubscribeAll();

    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        console.log('🔌 WebSocket disconnected');
    }

    connectPromise = null;
    connectionState = 'disconnected';
}

/**
 * 테스트용: "예상치 못한 연결 끊김" 시뮬레이션
 *
 * 목적:
 * - registry는 유지
 * - manualDisconnect=false 상태에서
 * - 실제 websocket만 강제로 끊어서 reconnect 흐름을 검증
 *
 * 주의:
 * - stompjs 내부 private 필드를 사용하므로 dev/test 용으로만 써야 함
 */
export function simulateSocketDropForTest() {
    if (!stompClient) {
        console.warn('🧪 simulateSocketDropForTest: stompClient 없음');
        return false;
    }

    manualDisconnect = false;
    connectionState = 'reconnecting';

    try {
        const rawSocket =
            stompClient?._stompHandler?._webSocket ??
            stompClient?._webSocket ??
            null;

        if (rawSocket && typeof rawSocket.close === 'function') {
            console.warn('🧪 simulateSocketDropForTest: raw websocket close 실행');
            rawSocket.close();
            return true;
        }

        console.warn('🧪 simulateSocketDropForTest: raw websocket 접근 실패, deactivate fallback');
        stompClient.deactivate();
        return true;
    } catch (e) {
        console.error('❌ simulateSocketDropForTest 실패', e);
        return false;
    }
}

if(import.meta.env.DEV && typeof window !== 'undefined') {
    window.__wsTest ={
        connectWebSocket,
        disconnectWebSocket,
        simulateSocketDropForTest,
        getConnectionState,
        getStompClient
    }
}