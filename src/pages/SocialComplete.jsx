import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function SocialComplete() {
  const nav = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);

    let access = hashParams.get("access");
    let refresh = hashParams.get("refresh");

    console.debug("[SOCIAL] href =", window.location.href);
    console.debug("[SOCIAL] hash access?", !!access, "refresh?", !!refresh);

    // 해시에 없으면 쿼리스트링에서 시도
    if (!access || !refresh) {
      const qAccess = searchParams.get("access");
      const qRefresh = searchParams.get("refresh");
      console.debug("[SOCIAL] query access?", !!qAccess, "refresh?", !!qRefresh);
      access = access || qAccess;
      refresh = refresh || qRefresh;
    }

    // (옵션) 둘 다 없으면 마지막으로 디버그 쿠키에서 시도
    if (!access || !refresh) {
      const cAccess = getCookie("access_debug");
      const cRefresh = getCookie("refresh_debug");
      console.debug("[SOCIAL] cookie access?", !!cAccess, "refresh?", !!cRefresh);
      access = access || cAccess;
      refresh = refresh || cRefresh;
    }

    if (access && refresh) {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // 쿼리/해시 지우고 홈으로 이동
      nav("/", { replace: true });
    } else {
      alert("소셜 로그인 통신 수신에 실패했습니다.");
      nav("/login", { replace: true });
    }
  }, [nav]);

  return <p>소셜 로그인 처리 중...</p>;
}
