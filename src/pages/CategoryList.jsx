// src/pages/CategoryList.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES, CATEGORY_SLUGS } from "../constants/categories";
import "./CategoryList.css";



// ... 상단 import/상수 동일
const PAGE_SIZE = 15;

export default function CategoryList({ slug }) {
  const { category: paramCategory } = useParams();
  const category = slug ?? paramCategory;

  const valid = CATEGORY_SLUGS.includes(category);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  // 🔎 검색 상태
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all"); // all | title | content | author

  useEffect(() => {
    if (!valid) return;
    api
      .get("/posts/", { params: { category } })
      .then((res) => setPosts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
    setPage(1);
    setQ("");
    setMode("all");
  }, [category, valid]);

  // 검색어/모드 변경 시 1페이지로
  useEffect(() => {
    setPage(1);
  }, [q, mode]);

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

  const norm = (v) => String(v ?? "").toLowerCase();
  const query = norm(q);

  const matches = (p) => {
    if (!query) return true;

    const title   = norm(p.title);
    const content = norm(p.content); // 시리얼라이저가 content 내려줌
    const author  = norm(p.author ?? p.username ?? p.user ?? p.writer ?? "");

    switch (mode) {
      case "title":
        return title.includes(query);
      case "content":
        return content.includes(query);
      case "author":
        return author.includes(query);
      case "all":
      default:
        return title.includes(query) || content.includes(query) || author.includes(query);
    }
  };

  const filtered = posts.filter(matches);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const calcDisplayNumber = (idxInPage) => totalCount - (start + idxInPage);

  return (
    <div className="home-container">
      {/* 상단 타이틀 + 작성 버튼 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>{CATEGORIES[category]}</h2>
        <Link to={`/new/${category}`} className="write-btn">게시물 작성</Link>
      </div>

      {/* 🔎 검색바: 입력 + 모드 선택 */}
      <div className="search-bar">
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            mode === "title"   ? "제목 검색" :
            mode === "content" ? "내용 검색" :
            mode === "author"  ? "작성자 검색" :
            "제목·내용·작성자 통합 검색"
          }
          aria-label="검색"
        />
        <select
          className="search-select"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="검색 대상 선택"
          title="검색 대상"
        >
          <option value="all">전체</option>
          <option value="title">제목</option>
          <option value="content">내용</option>
          <option value="author">작성자</option>
        </select>
      </div>

      {/* 목록 테이블 */}
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
                {q ? "검색 결과가 없습니다." : "게시물이 없습니다."}
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

      {/* 페이지네이션 */}
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
