// src/utils/axios.js
import axios from "axios";

// 1) baseURL 정규화: 끝에 항상 슬래시가 붙도록 보정
const RAW_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const BASE_URL = RAW_BASE.endsWith("/") ? RAW_BASE : RAW_BASE + "/";

// 2) axios 인스턴스
export const api = axios.create({
  baseURL: BASE_URL,             // 예: http://localhost:8000/api/
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// 3) refresh 토큰 요청은 api 인스턴스를 재사용(경로는 항상 슬래시로 시작)
const refreshAccessToken = async (refreshToken) => {
  const res = await api.post("/auth/refresh/", { refresh: refreshToken });
  return res.data.access;
};

// 4) 요청 인터셉터: access 토큰 주입
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 5) 응답 인터셉터: 401 처리 + refresh 루프 방지
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const refreshToken = localStorage.getItem("refresh");

    // (a) refresh 엔드포인트에서는 재시도 금지
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh/");

    // (b) 401이고 refresh 토큰이 있으며, 아직 재시도 안했으면
    if (status === 401 && refreshToken && !originalRequest._retry && !isRefreshCall) {
      // 이미 다른 요청이 refresh 중이면 큐 대기
      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // refresh 시작
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        localStorage.setItem("access", newAccessToken);
        processQueue(null, newAccessToken);

        // 원 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // refresh 실패 → 토큰 제거 후 로그인 페이지로 유도
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        // 선택: 여기서 바로 이동 처리도 가능 (window.location = "/login")
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외 오류는 그대로
    return Promise.reject(error);
  }
);
