// src/pages/CategoryList.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES, CATEGORY_SLUGS } from "../constants/categories";
import "./CategoryList.css";

const PAGE_SIZE = 15;

export default function CategoryList({ slug }) {
  // ✅ slug prop 우선, 없으면 URL 파라미터 사용
  const { category: paramCategory } = useParams();
  const category = slug ?? paramCategory;

  const valid = CATEGORY_SLUGS.includes(category);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!valid) return;
    api
      .get("/posts/", { params: { category } })
      .then((res) => setPosts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
    setPage(1);
  }, [category, valid]);

  if (!valid) {
    return (
      <div className="home-container">
        잘못된 카테고리입니다.
        <div style={{ marginTop: 8 }}>
          <Link to="/" className="write-btn">홈으로</Link>
        </div>
      </div>
    );
  }

  const totalCount = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = posts.slice(start, start + PAGE_SIZE);

  // 번호: 오래된 글=1, 최신 글=최대 번호
  const calcDisplayNumber = (idxInPage) => totalCount - (start + idxInPage);

  return (
    <div className="home-container">
      {/* 상단 타이틀 + 고정 글쓰기 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{CATEGORIES[category]}</h2>
        <Link to={`/new/${category}`} className="write-btn">게시물 작성</Link>
      </div>

      {/* 목록 테이블 (Home.css 재사용) */}
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
                <td><Link to={`/posts/${post.id}`}>{post.title}</Link></td>
                <td>{post.author}</td>
                <td>{post.date}</td>
                <td>{post.views}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 (버튼 스타일 재사용) */}
      {totalPages > 1 && (
        <div className="category-tabs" aria-label="pagination" style={{ justifyContent: "center" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}
