import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/axios";
import "./Register.css";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!username.trim() || !email.trim()) {
      setErr("아이디와 이메일을 입력하세요.");
      return;
    }

    try {
      setSubmitting(true);
      // 아이디+이메일 확인 → uid/token 발급
      const { data } = await api.post(
        "/auth/password-reset/issue/",
        { username, email },
        { headers: { "Content-Type": "application/json" } }
      );
      // 바로 리셋 페이지 이동
      navigate(`/reset-password?uid=${encodeURIComponent(data.uid)}&token=${encodeURIComponent(data.token)}`);
    } catch (e) {
      const d = e.response?.data || {};
      setErr(d?.errors?.detail?.[0] || d?.detail || "정보가 일치하지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">비밀번호 찾기</h2>
      {err && <div className="field-error">{err}</div>}
      <form className="register-form" onSubmit={onSubmit}>
        <label>
          아이디
          <input value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="username" placeholder="아이디" />
        </label>
        <label>
          가입 이메일
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" placeholder="example@email.com" />
        </label>
        <button className="register-submit" disabled={submitting}>
          {submitting ? "확인 중..." : "비밀번호 재설정으로 이동"}
        </button>
      </form>
    </div>
  );
}
