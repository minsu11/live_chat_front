import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})
// 공통 응답
api.interceptors.response.use(
    (response) => {
        const { status, message, data } = response.data;
        console.log("message : "+ message)
        if (status >= 200 && status <300) {
            return data;
        } else {
            return Promise.reject({ status, message });
        }
    },
    (error) => {
        // 서버 오류 or 통신 오류 등 처리
        return Promise.reject(error);
    }
)

export default api;
