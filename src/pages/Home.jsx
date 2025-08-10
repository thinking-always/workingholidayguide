import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/axios";
import "./Home.css";

const PAGE_SIZE = 15;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/posts/")
      .then((res) => setPosts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  const categories = ["all", "공지", "자유", "Q&A"];

  // 카테고리 필터
  const filtered = useMemo(() => {
    if (category === "all") return posts;
    return posts.filter((p) => p.category === category);
  }, [posts, category]);

  // 카테고리 바꾸면 1페이지로
  useEffect(() => {
    setPage(1);
  }, [category]);

  // 페이지네이션 계산
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = filtered.slice(start, end);

  // 번호 계산: 전체 개수 기준 역순 → 오래된 글 1번, 최신 글 최대 번호
  const calcDisplayNumber = (indexInPage) => {
    const globalIndex = start + indexInPage; // 0-based
    return totalCount - globalIndex;
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="home-container">
      {/* 카테고리 탭 */}
      <nav className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={category === cat ? "active" : ""}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* 게시물 작성 버튼 */}
      <Link to="/new" className="write-btn">
        게시물 작성
      </Link>

      {/* 게시판 테이블 */}
      <table className="post-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>날짜</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#777" }}>
                게시물이 없습니다.
              </td>
            </tr>
          ) : (
            pageItems.map((post, idx) => (
              <tr key={post.id}>
                <td>{calcDisplayNumber(idx)}</td>
                <td>
                  <Link to={`posts/${post.id}`}>{post.title}</Link>
                </td>
                <td>{post.author}</td>
                <td>{post.date}</td>
                <td>{post.views}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 (카테고리 버튼 스타일 재사용) */}
      {totalPages > 1 && (
        <div className="category-tabs" aria-label="pagination" style={{ justifyContent: "center" }}>
          <button onClick={() => goToPage(page - 1)} disabled={page === 1}>
            이전
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          ))}

          <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}
