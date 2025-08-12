import { useState } from "react";
import { api } from "../utils/axios";
import "./Register.css"; // 동일 톤 재사용

export default function ForgotUsername() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const res = await api.post("/auth/username-lookup/", { email, password });
      setResult(res.data.usernames || []);
    } catch {
      setResult([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">아이디 찾기</h2>
      <form className="register-form" onSubmit={onSubmit}>
        <label>
          가입 이메일
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </label>
        <button className="register-submit" disabled={submitting}>
          {submitting ? "확인 중..." : "아이디 확인"}
        </button>
      </form>

      {result && (
        <div style={{marginTop:12}}>
          {result.length === 0 ? (
            <div className="field-error">입력한 정보와 일치하는 계정을 찾지 못했습니다.</div>
          ) : (
            <div className="login-info">
              확인된 아이디: <strong>{result.join(", ")}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
