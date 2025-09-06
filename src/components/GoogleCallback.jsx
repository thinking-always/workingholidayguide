// src/components/GoogleCallback.jsx
import { useEffect, useRef } from "react";
import axios from "axios";

const RAW_API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

/** BASE_URL에 /api가 있든 없든 항상 올바른 엔드포인트를 만든다 */
function buildEndpoint(base) {
  const b = String(base).replace(/\/+$/g, "");
  // BASE가 .../api 인지 체크
  const url = /(\/|^)api$/.test(b)
    ? `${b}/auth/social/google/`
    : `${b}/api/auth/social/google/`;
  // 중복 슬래시 정리
  return url
    .replace(/\/{2,}/g, "/")
    .replace("http:/", "http://")
    .replace("https:/", "https://");
}

const ENDPOINT = buildEndpoint(RAW_API_BASE);

// 프론트 콜백 URL (env 없으면 현재 origin 기준)
const REDIRECT_URI =
  process.env.REACT_APP_GOOGLE_REDIRECT ||
  `${window.location.origin}/auth/google/callback`;

export default function GoogleCallback() {
  const onceRef = useRef(false); // StrictMode 중복 호출 방지

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    console.debug("[AUTH] RAW_API_BASE =", RAW_API_BASE);
    console.debug("[AUTH] ENDPOINT =", ENDPOINT);
    console.debug("[AUTH] REDIRECT_URI =", REDIRECT_URI);
    console.debug("[AUTH] code exists? =", Boolean(code));

    if (!code) {
      alert("Google code가 없습니다. 다시 시도해주세요.");
      return;
    }

    (async () => {
      try {
        // 백엔드에 code + redirect_uri 전달 (백엔드에서 callback_url 사용하더라도 방어)
        const { data } = await axios.post(ENDPOINT, {
          code,
          redirect_uri: REDIRECT_URI,
        });

        console.debug("[AUTH] SUCCESS =", data);
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        // TODO: AuthContext 상태 업데이트가 있다면 여기서 반영
        window.location.replace("/"); // 로그인 후 이동 경로
      } catch (err) {
        const res = err?.response;
        console.error("[AUTH] FAIL =", {
          endpoint: ENDPOINT,
          status: res?.status,
          data: res?.data,
          message: err?.message,
        });

        if (res?.status === 404) {
          alert("로그인 엔드포인트가 없습니다. 백엔드 URL/라우트를 확인하세요.");
        } else if (res?.status === 400 || res?.status === 401) {
          alert("코드가 유효하지 않거나 만료되었습니다. 다시 로그인해주세요.");
        } else if (res?.status === 405) {
          alert("잘못된 메서드입니다. 끝 슬래시(/)와 POST 요청 여부를 확인하세요.");
        } else {
          alert("구글 로그인에 실패했습니다. 콘솔 로그를 확인하세요.");
        }
      }
    })();
  }, []);

  return <div>Signing you in…</div>;
}
