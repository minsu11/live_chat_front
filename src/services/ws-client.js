// src/services/ws-client.js
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from '@/plugins/axios.js';

let stompClient = null;
let reconnectTimeout = null;
let subscriptions = []; // 구독 목록 저장
let lastMessageTimestamps = {}; // 채널별 마지막 메시지 시간 기록

export function connectWebSocket() {
    console.log('🔌 WebSocket 연결 시도');

    const socket = new SockJS(`/ws/chat`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        console.log('✅ WebSocket connected');

        // 기존 구독 복원
        reconnectSubscriptions();
    }, async (error) => {
        console.error('❌ WebSocket error:', error);
        attemptReconnect();
    });
}

export function subscribe(destination, callback) {
    if (!stompClient || !stompClient.connected) {
        console.warn('WebSocket이 연결되지 않아 구독 실패:', destination);
        return;
    }

    const sub = stompClient.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        lastMessageTimestamps[destination] = Date.now(); // 마지막 메시지 시간 기록
        callback(data);
    });

    subscriptions.push({ destination, callback });
    return sub;
}

export function sendMessage(destination, payload) {
    if (stompClient && stompClient.connected) {
        stompClient.send(destination, {}, JSON.stringify(payload));
    } else {
        console.warn('⚠️ WebSocket이 연결되어 있지 않습니다.');
    }
}

export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.disconnect();
        console.log('🔌 WebSocket disconnected');
    }
}

async function fetchMissedMessages(destination, callback) {
    const lastTimestamp = lastMessageTimestamps[destination];
    if (!lastTimestamp) return;

    try {
        // 예: /messages API에 채널명과 마지막 시간 전달
        const res = await axios.get(`/messages`, {
            params: { channel: destination, since: lastTimestamp }
        });

        res.forEach(msg => {
            callback(msg);
        });
        console.log(`📥 ${destination} 채널의 누락 메시지 불러옴`);
    } catch (err) {
        console.error(`❌ ${destination} 채널 누락 메시지 불러오기 실패`, err);
    }
}

function reconnectSubscriptions() {
    subscriptions.forEach(({ destination, callback }) => {
        stompClient.subscribe(destination, (message) => {
            const data = JSON.parse(message.body);
            lastMessageTimestamps[destination] = Date.now();
            callback(data);
        });

        // 재구독 직후 누락 메시지 채우기
        fetchMissedMessages(destination, callback);
    });
}

function attemptReconnect() {
    if (reconnectTimeout) return;

    reconnectTimeout = setTimeout(async () => {
        reconnectTimeout = null;
        try {
            await axios.post('/reissue', {}, { withCredentials: true });
            console.log('🔄 토큰 재발급 성공, WebSocket 재연결 시도...');
            connectWebSocket();
        } catch (err) {
            console.error('🚫 토큰 재발급 실패, 로그인 필요');
        }
    }, 3000);
}
