// src/components/GoogleCodeLoginButton.jsx
import { useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
// ✅ env가 없으면 현재 origin으로 대체
const GOOGLE_REDIRECT = process.env.REACT_APP_GOOGLE_REDIRECT
  || `${window.location.origin}/auth/google/callback`;

export default function GoogleCodeLoginButton() {
  useEffect(() => {
    console.log("[DEBUG] GOOGLE_REDIRECT =", GOOGLE_REDIRECT);

    if (!window.google) return;
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "redirect",
      redirect_uri: process.env.REACT_APP_GOOGLE_REDIRECT, // ✅ env의 콜백       // ← 여기 사용
    });

    const btn = document.getElementById("googleCodeBtn");
    if (btn) btn.onclick = () => codeClient.requestCode();
  }, []);

  return <button id="googleCodeBtn">구글로 로그인</button>;
}
