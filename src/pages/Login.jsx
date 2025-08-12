import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../utils/axios";
import "./Login.css";

export default function Login() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const m = sessionStorage.getItem("auth_redirect_msg");
    if (m) {
      setInfoMsg(m);
      sessionStorage.removeItem("auth_redirect_msg");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/login/", { username, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      const next = sp.get("next") || "/";
      navigate(next);
      window.location.reload();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">로그인</h2>
      {infoMsg && <div className="login-info">{infoMsg}</div>}
      {errorMsg && <div className="login-error">{errorMsg}</div>}

      <form className="login-form" onSubmit={handleLogin} style={{ opacity: loading ? 0.75 : 1 }}>
        <label>
          아이디
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? "로딩 중..." : "로그인"}
        </button>
      </form>

      {/* 가입/찾기 링크들 */}
      <div className="login-helpers">
        <Link to="/register" className="helper-link primary">회원가입</Link>
        <Link to="/forgot-username" className="helper-link">아이디 찾기</Link>
        <Link to="/forgot-password" className="helper-link">비밀번호 재설정</Link>
      </div>
    </div>
  );
}
