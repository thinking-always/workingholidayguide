import { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../utils/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  // 앱 시작 시 localStorage에서 복구
  useEffect(() => {
    const a = localStorage.getItem("access");
    const r = localStorage.getItem("refresh");
    if (a && r) {
      setAccessToken(a);
      setRefreshToken(r);
      try {
        setUser(jwtDecode(a));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // accessToken이 바뀔 때 axios Authorization 헤더 동기화
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // 로그인 시 호출
  const login = (access, refresh) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
    try {
      setUser(jwtDecode(access));
    } catch {
      setUser(null);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      const r = localStorage.getItem("refresh");
      if (r) {
        // 서버에 로그아웃/블랙리스트 엔드포인트가 있을 때만 사용 (없으면 그냥 패스)
        await api.post("/auth/logout/", { refresh: r });
      }
    } catch {
      // 서버 통신 실패하더라도 클라이언트 정리는 진행
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      delete api.defaults.headers.common["Authorization"];
    }
  };

  // (선택) 다른 탭과 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "access" || e.key === "refresh") {
        const a = localStorage.getItem("access");
        const r = localStorage.getItem("refresh");
        setAccessToken(a);
        setRefreshToken(r);
        if (a) {
          try {
            setUser(jwtDecode(a));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
