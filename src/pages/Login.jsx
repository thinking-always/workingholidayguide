import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

// 게시물 등 나머지 API는 /api 포함한 BASE
const API_BASE =
  (process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api").replace(
    /\/+$/g,
    ""
  );

// 소셜 진입은 /accounts/... 이므로 오리진만 사용
const BE_ORIGIN =
  (process.env.REACT_APP_BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(
    /\/+$/g,
    ""
  );

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (submitting || redirecting) return;

    setSubmitting(true);
    setError("");

    try {
      const url = `${API_BASE}/auth/login/`;
      const { data } = await axios.post(url, {
        username: usernameOrEmail,
        password,
      });

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      window.location.replace("/");
    } catch (err) {
      const res = err?.response;
      if (res?.status === 401) {
        setError("아이디(또는 이메일)/비밀번호가 올바르지 않습니다.");
      } else {
        setError(
          res?.data?.detail ||
            res?.data?.message ||
            "로그인 중 오류가 발생했습니다."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const socialLogin = (provider) => {
    if (redirecting || submitting) return;
    setRedirecting(true);
    const u = new URL(`/accounts/${provider}/login/`, BE_ORIGIN);
    u.searchParams.set("process", "login");
    window.location.assign(u.toString());
  };

  return (
    <div className="login-container">
      <div className="login-card shadow-xl">
        <h2 className="login-title">로그인</h2>

        {/* 로컬 로그인 폼 */}
        <form onSubmit={handleLocalLogin} className="login-form">
          <label className="field">
            <span className="field-label">아이디(유저네임)</span>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              placeholder="username 또는 email"
              autoComplete="username"
              className="input"
            />
          </label>

          <label className="field">
            <span className="field-label">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호"
              autoComplete="current-password"
              className="input"
            />
          </label>

          {error && (
            <div role="alert" className="alert">
              {String(error)}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || redirecting}
            className="btn btn--primary btn--lg"
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div className="separator">
          <span className="separator-line" />
          <span className="separator-text">또는</span>
          <span className="separator-line" />
        </div>

        {/* 소셜 로그인 (아래) */}
        <div className="social-grid">
          <button
            type="button"
            onClick={() => socialLogin("google")}
            disabled={redirecting}
            className="btn btn--social btn--google"
            aria-label="구글로 로그인"
          >
            Google로 로그인
          </button>

          <button
            type="button"
            onClick={() => socialLogin("naver")}
            disabled={redirecting}
            className="btn btn--social btn--naver"
          >
            Naver로 로그인
          </button>

          <button
            type="button"
            onClick={() => socialLogin("kakao")}
            disabled={redirecting}
            className="btn btn--social btn--kakao"
          >
            Kakao로 로그인
          </button>
        </div>

        <div className="link-row">
          <a href="/register">회원가입</a>
          <a href="/forgot-username">아이디 찾기</a>
          <a href="/forgot-password">비밀번호 찾기</a>
        </div>
      </div>
    </div>
  );
}
