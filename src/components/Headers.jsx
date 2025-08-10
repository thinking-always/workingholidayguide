import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Headers.css";
import { AuthContext } from "../contexts/AuthContext";

export default function Headers() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useContext(AuthContext);

  // 로그인 여부는 컨텍스트 기준
  const isLoggedIn = !!accessToken;

  // 표시 이름 (JWT 구조에 따라 유연 처리)
  const displayName = useMemo(() => {
    if (!user) return null;
    return (
      user.username ||
      user.nickname ||
      user.email ||
      user.sub || // 일부 JWT
      null
    );
  }, [user]);

  const handleLogout = async () => {
    await logout();          // 토큰/헤더/상태 정리
    navigate("/login");      // 로그인 페이지로 이동
  };

  return (
    <header className="header">
      {/* 네비게이션 */}
      <nav className="nav-links">
        <Link to="/">홈</Link>
        <Link to="/posts">워홀 기본정보</Link>

        <div>
          <Link to="/about">일자리 & 숙소</Link>
          <div>
            <Link to="/post/1">서브1</Link>
            <Link to="/post/1">서브2</Link>
          </div>
        </div>

        <div>
          <Link to="/about">생활 가이드</Link>
          <div>
            <Link to="/">서브1</Link>
            <Link to="/post/1">서브2</Link>
          </div>
        </div>

        <div>
          <Link to="/about">워홀 후기 & 여행</Link>
          <div>
            <Link to="/">서브1</Link>
            <Link to="/post/1">서브2</Link>
          </div>
        </div>

        <div>
          <Link to="/about">Q&A & 추천</Link>
          <div>
            <Link to="/">서브1</Link>
            <Link to="/post/1">서브2</Link>
          </div>
        </div>
      </nav>

      {/* 로그인/로그아웃 영역 */}
      <div className="nav-auth">
        {isLoggedIn ? (
          <>
            {displayName && <span style={{ marginRight: 8 }}>{displayName} 님</span>}
            <button className="logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login">로그인</Link>
        )}
      </div>
    </header>
  );
}
