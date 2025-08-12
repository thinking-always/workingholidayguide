import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Headers.css";

export default function Headers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access"));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!localStorage.getItem("access"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    document.body.classList.remove("no-scroll");
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    if (isMenuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  const openMenu = () => { setIsMenuOpen(true); document.body.classList.add("no-scroll"); };
  const closeMenu = () => { setIsMenuOpen(false); document.body.classList.remove("no-scroll"); };
  const toggleMenu = () => (isMenuOpen ? closeMenu() : openMenu());

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    navigate("/login");
    window.location.reload();
  };

  const NavLinks = ({ onClick }) => (
    <>
      <Link to="/" onClick={onClick}>홈</Link>
      <Link to="/basic" onClick={onClick}>워홀 기본정보</Link>
      <Link to="/jobs_housing" onClick={onClick}>일자리 & 숙소</Link>
      <Link to="/guide" onClick={onClick}>생활 가이드</Link>
      <Link to="/travel" onClick={onClick}>워홀 후기 & 여행</Link>
      <Link to="/qna" onClick={onClick}>Q&A</Link>
    </>
  );

  return (
    <header className="header">
      {/* 브랜드 */}
      <div className="brand">
        <Link to="/">Creeps</Link>
      </div>

      {/* 데스크톱 네비 */}
      <nav className="nav-links">
        <NavLinks />
      </nav>

      {/* 데스크톱 인증 영역: 설정 → 로그인/로그아웃 순서 */}
      <div className="nav-auth">
        {isLoggedIn ? (
          <>
            <Link to="/settings" className="settings-link">설정</Link>
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/settings" className="settings-link disabled" aria-disabled="true" title="로그인 후 이용 가능">설정</Link>
            <Link to="/login">로그인</Link>
          </>
        )}
      </div>

      {/* 햄버거(모바일) */}
      <button
        className={`hamburger ${isMenuOpen ? "is-open" : ""}`}
        onClick={toggleMenu}
        aria-label="메뉴 열기"
        aria-controls="mobile-menu"
        aria-expanded={isMenuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* 모바일 백드롭 */}
      <div className={`backdrop ${isMenuOpen ? "open" : ""}`} onClick={closeMenu} />

      {/* 모바일 사이드 메뉴 */}
      <aside id="mobile-menu" className={`mobile-menu ${isMenuOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="mobile-menu-header">
          <span className="mobile-title">메뉴</span>
          <button className="close-btn" onClick={closeMenu} aria-label="메뉴 닫기">×</button>
        </div>

        <nav className="mobile-nav">
          <NavLinks onClick={closeMenu} />
        </nav>

        {/* 모바일 인증 영역: 설정(위) → 로그인/로그아웃(아래) */}
        <div className="mobile-auth">
          {isLoggedIn ? (
            <>
              <Link to="/settings" className="settings-btn wide" onClick={closeMenu}>설정</Link>
              <button className="logout-btn wide" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button className="settings-btn wide" disabled title="로그인 후 이용 가능">설정</button>
              <Link to="/login" className="login-btn wide" onClick={closeMenu}>로그인</Link>
            </>
          )}
        </div>
      </aside>
    </header>
  );
}
