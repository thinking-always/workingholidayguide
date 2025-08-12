import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../utils/axios";
import "./Register.css";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const uid = useMemo(() => sp.get("uid") || "", [sp]);
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");

    if (!uid || !token) return setError("잘못된 링크입니다. 다시 요청하세요.");
    if (!p1 || !p2) return setError("비밀번호를 입력하세요.");
    if (p1 !== p2) return setError("비밀번호가 일치하지 않습니다.");

    try {
      setSubmitting(true);
      const res = await api.post(
        "/auth/password-reset-confirm/",
        { uid, token, new_password1: p1, new_password2: p2 },
        { headers: { "Content-Type": "application/json" } }
      );
      setOk(res.data?.detail || "비밀번호가 변경되었습니다.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const d = err.response?.data || {};
      const msg =
        (Array.isArray(d.new_password1) && d.new_password1[0]) ||
        (Array.isArray(d.new_password2) && d.new_password2[0]) ||
        d.detail ||
        "변경에 실패했습니다.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">새 비밀번호 설정</h2>
      {error && <div className="field-error">{error}</div>}
      {ok && <div className="login-info">{ok}</div>}
      <form className="register-form" onSubmit={onSubmit}>
        <label>
          새 비밀번호
          <input type="password" value={p1} onChange={(e)=>setP1(e.target.value)} autoComplete="new-password" placeholder="8자 이상 권장" />
        </label>
        <label>
          새 비밀번호 확인
          <input type="password" value={p2} onChange={(e)=>setP2(e.target.value)} autoComplete="new-password" placeholder="다시 입력" />
        </label>
        <button className="register-submit" disabled={submitting || !uid || !token}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
