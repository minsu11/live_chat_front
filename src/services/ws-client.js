// ws-client.js (Vue용 WebSocket 클라이언트 with @stomp/stompjs)
import { Client } from '@stomp/stompjs';
import api from '@/plugins/axios.js';
import SockJS from 'sockjs-client';


let stompClient = null;
let reconnectTimeout = null;
let subscriptions = [];
let lastMessageTimestamps = {};
let retryCount = 0;
const MAX_RETRIES = 5;
export async function connectWebSocket() {
    console.log('🔌 WebSocket 연결 시도');
    // access token data 가지고 오기


    try{
        const res = await api.get('/ws/token');
        const accessToken = res;
        console.log("token 가지고 옴")
        console.log("cookie: " + accessToken)

        stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:7070/api/ws-chat'), // 여기 중요
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`, // 헤더에 붙임
            },
            reconnectDelay: 0,
            onConnect: () => {
                console.log('✅ WebSocket connected');

                // reconnectSubscriptions();
            },
            onStompError: (frame) => {
                console.error('❌ STOMP Error:', frame);
                // attemptReconnect();
            },
            onWebSocketClose: () => {
                console.warn('🔌 WebSocket closed');
                // attemptReconnect();
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`🔁 ${retryCount}번째 WebSocket 재연결 시도`);
                    setTimeout(() => connectWebSocket(), 3000);
                } else {
                    console.error('❌ WebSocket 재연결 중단 (최대 시도 초과)');
                }
            },
        });

        stompClient.activate();
    }catch(e){
        console.error("error")
    }

}

export function subscribe(destination, callback) {
    if (!stompClient || !stompClient.connected) {
        console.warn('WebSocket이 연결되지 않아 구독 실패:', destination);
        return;
    }

    const sub = stompClient.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        lastMessageTimestamps[destination] = Date.now();
        callback(data);
    });

    subscriptions.push({ destination, callback });
    return sub;
}

export function sendMessage(destination, payload) {
    if (stompClient && stompClient.connected) {
        stompClient.publish({ destination, body: JSON.stringify(payload) });
    } else {
        console.warn('⚠️ WebSocket이 연결되어 있지 않습니다.');
    }
}

export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.deactivate();
        console.log('🔌 WebSocket disconnected');
    }
}

async function fetchMissedMessages(destination, callback) {
    const lastTimestamp = lastMessageTimestamps[destination];
    if (!lastTimestamp) return;

    try {
        const res = await axios.get(`/messages`, {
            params: { channel: destination, since: lastTimestamp },
        });
        res.forEach(msg => callback(msg));
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

        fetchMissedMessages(destination, callback);
    });
}

function attemptReconnect() {
    if (reconnectTimeout) return;

    reconnectTimeout = setTimeout(async () => {
        reconnectTimeout = null;
        try {
            await axios.post('/api/reissue', {}, { withCredentials: true });
            console.log('🔄 토큰 재발급 성공, WebSocket 재연결 시도...');
            connectWebSocket();
        } catch (err) {
            console.error('🚫 토큰 재발급 실패, 로그인 필요');
        }
    }, 3000);
}
