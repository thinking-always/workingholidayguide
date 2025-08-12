import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/axios";
import "./Register.css";

export default function Settings() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const onDelete = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setSubmitting(true); setMsg("");
    try {
      await api.post("/auth/delete-account/", { password });
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setMsg("탈퇴가 완료되었습니다.");
      setTimeout(()=>{ navigate("/"); window.location.reload(); }, 800);
    } catch (err) {
      setMsg(err.response?.data?.password?.[0] || "처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">설정</h2>

      <div className="consent-box" style={{ marginTop: 8 }}>
        <strong>계정 삭제(탈퇴)</strong>
        <p style={{ margin: "8px 0 12px", color: "#555" }}>
          계정을 삭제하면 로그인할 수 없으며, 게시물/댓글은 “탈퇴회원”으로 표기되어 남습니다.
        </p>
        <form className="register-form" onSubmit={onDelete}>
          <label>
            현재 비밀번호
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </label>
          <button className="register-submit" disabled={submitting}>
            {submitting ? "처리 중..." : "계정 삭제"}
          </button>
        </form>
        {msg && <div style={{ marginTop: 10 }} className="login-info">{msg}</div>}
      </div>
    </div>
  );
}
