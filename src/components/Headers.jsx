import { Link, useNavigate } from "react-router-dom";
import './Headers.css'
import { useEffect, useState } from "react";

export default function Headers() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access");
        setIsLoggedIn(!!token);


    }, [])

    const handleLogout = () => {
        localStorage.removeItem("access");
        setIsLoggedIn("false")
        navigate("/login");
        window.location.reload();
    }

    return (
        <header className="header">
            {/* 네비게이션 */}
            <nav className="nav-links">
                <Link to="/">홈</Link>
                <Link to="/posts">워홀 기본정보</Link>

                <div>
                    <Link to="/about">일자리 & 숙소</Link>
                    <div>
                        <Link to="/post/1">전체</Link>
                    </div>
                </div>
                <Link to="/about">생활 가이드</Link>
                <Link to="/about">워홀 후기 & 여행</Link>
                <Link to="/about">Q&A & 추천</Link>
            </nav>

            {/* 로그인/로그아웃 영역 */}
            <div className="nav-auth">
                {isLoggedIn ? (
                    <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
                ) : (
                    <Link to="/login">로그인</Link>
                )}
            </div>
        </header>
    );
}
