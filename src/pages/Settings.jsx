// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/axios";
import "./settings.css";

/* ───────────────────────────────────────────
   유틸: base64url → JSON 안전 디코드
─────────────────────────────────────────── */
function safeDecodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // base64url → base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // 패딩 보정
    const pad = base64.length % 4;
    const fixed = base64 + (pad ? "=".repeat(4 - pad) : "");
    const json = JSON.parse(atob(fixed));
    return json || null;
  } catch {
    return null;
  }
}

/* 로컬/세션 스토리지 여러 키를 순회하며 토큰을 찾음 */
function getAnyTokenFromStorage() {
  const keys = ["access", "id_token", "jwt", "token", "authToken"];
  for (const store of [localStorage, sessionStorage]) {
    try {
      for (const k of keys) {
        const raw = store.getItem(k);
        if (!raw) continue;
        // "Bearer xxx" 형태면 분리
        const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
        if (token.split(".").length === 3) return token;
      }
    } catch {}
  }
  return "";
}

/* JWT에서 username 후보 파싱 */
function usernameFromJwt() {
  const token = getAnyTokenFromStorage();
  if (!token) return "";
  const p = safeDecodeJwtPayload(token);
  if (!p) return "";
  const candidates = [
    p.username,
    p?.user?.username,
    p.name,
    p.preferred_username,
    p.nickname,          // 일부 백엔드
    p.handle,            // 소셜 핸들 형태
    p.sub,               // 마지막 수단
  ];
  return (candidates.find(Boolean) || "").toString();
}

/* 여러 프로필 엔드포인트를 순차 시도 → 실패 시 JWT fallback */
async function fetchUsernameBestEffort() {
  const endpoints = [
    "/auth/profile/",
    "/auth/me/",
    "/api/me/",
    "/users/me/",
    "/api/auth/profile/",
    "/api/profile/",
    "/profile/",
    "/me",
    "/v1/me",
  ];

  // 토큰을 스토리지에서 찾아 Authorization 붙이기 (axios 인스턴스 미설정 대비)
  const token = getAnyTokenFromStorage();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  for (const url of endpoints) {
    try {
      const { data } = await api.get(url, { headers, withCredentials: true });
      // 다양한 응답 스키마에서 후보 추출
      const candidates = [
        data?.username,
        data?.user?.username,
        data?.data?.username,
        data?.profile?.username,
        data?.nickname,
        data?.profile?.nickname,
        data?.handle,
      ];
      const found = candidates.find((v) => !!v && typeof v === "string");
      if (found) return found;
    } catch {
      /* 다음 후보 시도 */
    }
  }
  // API 다 실패하면 JWT에서 추출
  return usernameFromJwt();
}

export default function Settings() {
  const navigate = useNavigate();

  // ====== 탈퇴 ======
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const onDelete = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setSubmitting(true);
    setMsg("");
    try {
      await api.post("/auth/delete-account/", { password });
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setMsg("탈퇴가 완료되었습니다.");
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 800);
    } catch (err) {
      setMsg(err?.response?.data?.password?.[0] || "처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ====== 아이디(유저네임) 설정/변경 ======
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [curPwForLocal, setCurPwForLocal] = useState(""); // 로컬 계정만 필요
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // 현재 프로필 로드(다중 시도 + JWT fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const uname = await fetchUsernameBestEffort();
      if (mounted && uname) setCurrentUsername(uname);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 한글 허용 정규식 (백엔드와 동일)
  const usernameRegex = /^[a-zA-Z0-9가-힣._-]{3,20}$/;

  const handleCheck = async () => {
    setCheckMsg("");
    const v = (newUsername || "").trim().normalize("NFC");
    if (!v) return setCheckMsg("아이디를 입력해 주세요.");
    if (!usernameRegex.test(v)) {
      return setCheckMsg("3~20자, 영문/숫자/한글/._- 만 가능합니다.");
    }
    setChecking(true);
    try {
      const { data } = await api.get("/auth/username-lookup/", { params: { username: v } });
      const exists = data?.exists ?? (data?.available === false ? true : false);
      setCheckMsg(exists ? "이미 사용 중인 아이디입니다." : "사용 가능한 아이디입니다.");
    } catch {
      setCheckMsg("중복 확인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg("");
    const v = (newUsername || "").trim().normalize("NFC");
    if (!v) return setSaveMsg("아이디를 입력해 주세요.");
    if (!usernameRegex.test(v)) {
      return setSaveMsg("3~20자, 영문/숫자/한글/._- 만 가능합니다.");
    }
    setSaving(true);
    try {
      const payload = { new_username: v };
      if (curPwForLocal) payload.password = curPwForLocal; // 로컬 계정만 필요
      const { data } = await api.post("/auth/change-username/", payload);
      const updated = data?.username || v;
      setSaveMsg("아이디가 변경되었습니다.");
      setCurrentUsername(updated); // 카드 헤더 즉시 반영
      setNewUsername("");
      setCurPwForLocal("");
    } catch (err) {
      const res = err?.response;
      const m =
        res?.data?.new_username?.[0] ||
        res?.data?.password?.[0] ||
        res?.data?.detail ||
        "변경 중 오류가 발생했습니다.";
      setSaveMsg(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-bg">
      <div className="register-container">
        {/* 카드 내부 헤더: 왼쪽 '설정', 오른쪽 현재 유저네임 (값 없으면 숨김) */}
        <div className="card-header">
          <h2 className="card-title">설정</h2>
          {currentUsername && (
            <div className="nickname-pill" title={currentUsername}>
              <span className="dot" />
              <span>{currentUsername}</span>
            </div>
          )}
        </div>

        {/* ===== 아이디(유저네임) 설정/변경 ===== */}
        <div className="consent-box" style={{ marginTop: 8 }}>
          <strong>아이디(유저네임) 설정/변경</strong>
          <p style={{ margin: "8px 0 12px", color: "#555" }}>
            소셜 가입자는 비밀번호 없이 설정할 수 있고, 로컬 가입자는 현재 비밀번호 확인 후 변경됩니다.
          </p>

          <form className="register-form" onSubmit={handleSave}>
            {currentUsername ? (
              <div className="login-info" style={{ marginBottom: 8 }}>
                현재 아이디: <b>{currentUsername}</b>
              </div>
            ) : null}

            <label>
              새 아이디
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="영문/숫자/한글/._- (3~20자)"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
              />
            </label>

            <div className="check-row">
              <button
                type="button"
                className="register-submit"
                onClick={handleCheck}
                disabled={checking}
              >
                {checking ? "확인 중..." : "중복 확인"}
              </button>
              {checkMsg && (
                <div className="login-info" style={{ alignSelf: "center" }}>
                  {checkMsg}
                </div>
              )}
            </div>

            <label>
              현재 비밀번호 <span style={{ color: "#888" }}>(로컬 계정만, 소셜은 비워두세요)</span>
              <input
                type="password"
                value={curPwForLocal}
                onChange={(e) => setCurPwForLocal(e.target.value)}
                placeholder="로컬 계정만 필요"
              />
            </label>

            <button className="register-submit" disabled={saving}>
              {saving ? "저장 중..." : "아이디 저장"}
            </button>
          </form>

          {saveMsg && (
            <div style={{ marginTop: 10 }} className="login-info">
              {saveMsg}
            </div>
          )}
        </div>

        {/* ===== 계정 삭제(탈퇴) ===== */}
        <div className="consent-box danger" style={{ marginTop: 16 }}>
          <strong>계정 삭제(탈퇴)</strong>
          <p style={{ margin: "8px 0 12px", color: "#555" }}>
            계정을 삭제하면 로그인할 수 없으며, 게시물/댓글은 “탈퇴회원”으로 표기되어 남습니다.
          </p>
          <form className="register-form" onSubmit={onDelete}>
            <label>
              현재 비밀번호
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="register-submit" disabled={submitting}>
              {submitting ? "처리 중..." : "계정 삭제"}
            </button>
          </form>
          {msg && (
            <div style={{ marginTop: 10 }} className="login-info">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
