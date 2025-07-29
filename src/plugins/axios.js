import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 자동 전송
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => {

        const { status, message, data } = response.data;
        console.log("message : " + message);
        if (status >= 200 && status < 300) {
            return data;
        } else {
            return Promise.reject({ status, message });
        }
    },
    async (error) => { //
        const originalRequest = error.config;

        const response = error.response;
        const status = response?.status;

        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log("401 들어옴")

            if (isRefreshing) {
                // 다른 재발급 요청이 진행 중이면 기다렸다가 재요청
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                });
            }

            // 재발급
            isRefreshing = true;

            try {
                // Auth 서버에 재발급 요청 (쿠키 기반)
                await axios.post(
                    import.meta.env.VITE_AUTH_BASE_URL + '/reissue',
                    {},
                    { withCredentials: true }
                );

                processQueue(null);
                return api(originalRequest); // 원래 요청 다시 실행
            } catch (refreshError) {
                processQueue(refreshError, null);
                // 로그인 페이지 이동 or 로그아웃 처리 등
                alert("로그인이 만료되었습니다.")
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
