// src/components/GoogleCodeLoginButton.jsx
import { useEffect } from "react";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// ✅ env 없으면 현재 origin 기준으로 fallback
const GOOGLE_REDIRECT =
  process.env.REACT_APP_GOOGLE_REDIRECT ||
  `${window.location.origin}/auth/google/callback`;

export default function GoogleCodeLoginButton() {
  useEffect(() => {
    console.log("[DEBUG] GOOGLE_REDIRECT =", GOOGLE_REDIRECT);

    if (!window.google || !GOOGLE_CLIENT_ID) return;
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "redirect",
      // ⬇️ 여기! env 원문 대신, 위에서 계산된 GOOGLE_REDIRECT 사용
      redirect_uri: GOOGLE_REDIRECT,
    });

    const btn = document.getElementById("googleCodeBtn");
    if (btn) btn.onclick = () => codeClient.requestCode();
  }, []);

  return <button id="googleCodeBtn">구글로 로그인</button>;
}
