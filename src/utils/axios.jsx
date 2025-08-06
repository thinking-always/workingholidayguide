import axios from "axios";

// .env에 저장된 API 주소를 불러옴
const baseURL = process.env.REACT_APP_API_BASE_URL;

// axios 인스턴스 생성
export const api = axios.create({
    baseURL,
});

// 액세스 토큰 갱신 함수
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post(`${baseURL}auth/refresh/`, {
            refresh: refreshToken,
        });
        return response.data.access;
    } catch (error) {
        console.error("리프레시 토큰 갱신 실패", error);
        throw error;
    }
};

// ✅ 요청 인터셉터
api.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem("access");
        if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const refreshToken = localStorage.getItem("refresh");
        const originalRequest = error.config;

        if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
            try {
                originalRequest._retry = true; // 무한루프 방지

                const newAccessToken = await refreshAccessToken(refreshToken);

                localStorage.setItem("access", newAccessToken);
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

                alert("🔄 새로운 access 토큰 발급됨!");
                console.log("✅ access 토큰 재발급 완료:", newAccessToken);

                return api(originalRequest); // 다시 보냄 (axios → api로 바꿈)
            } catch (err) {

                console.error("❌ 토큰 갱신 실패", err);
                alert("❌ 리프레시 토큰 만료됨. 다시 로그인하세요.");
            }
        }

        return Promise.reject(error);
    }
);
