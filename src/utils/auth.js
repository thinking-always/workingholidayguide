// src/utils/auth.js
export function ensureLoggedIn(navigate, message = "로그인이 필요합니다.", nextPath) {
  const token = localStorage.getItem("access");
  if (!token) {
    alert(message);
    const here =
      nextPath ||
      window.location.pathname + window.location.search + window.location.hash;
    navigate(`/login?next=${encodeURIComponent(here)}`);
    return false;
  }
  return true;
}
