import axios from 'axios';
import router from "@/routers/index.js";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
    withCredentials: true, // 쿠키 자동 전송
});

// api.defaults.headers.post['Content-Type'] = 'application/json';
// api.defaults.headers.put['Content-Type'] = 'application/json';

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
}

// 응답 인터셉터
api.interceptors.response.use(
    (response) => {
        console.log("응답")
        const { status, message, data } = response.data;
        console.log("message : " + message);
        console.log("status : " + status);
        if (status >= 200 && status < 300) {
            console.log("성공 처리")
            return data;
        } else {
            return Promise.reject({ status, message });
        }
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log("401 들어옴");

            if (isRefreshing) {
                // 이미 재발급 중이면 대기
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            isRefreshing = true;

            try {
                // Auth 서버에 재발급 요청 (쿠키 기반)
                await axios.post(
                    import.meta.env.VITE_AUTH_BASE_URL + '/reissue',
                    {},
                    { withCredentials: true }
                );

                processQueue(null);
                return api(originalRequest); // 원래 요청 재실행
            } catch (refreshError) {
                processQueue(refreshError, null);
                alert("로그인이 만료되었습니다.");
                await router.push('/login');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
