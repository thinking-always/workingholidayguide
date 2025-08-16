// src/pages/CategoryList.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES, CATEGORY_SLUGS } from "../constants/categories";
import "./CategoryList.css";

const PAGE_SIZE = 15;

export default function CategoryList({ slug }) {
  // URL 파라미터/prop에서 카테고리 결정
  const { category: paramCategory } = useParams();
  const category = slug ?? paramCategory;
  const valid = CATEGORY_SLUGS.includes(category);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  // 🔎 검색 상태
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all"); // all | title | content | author

  // 데이터 로드
  useEffect(() => {
    if (!valid) return;
    api
      .get("/posts/", { params: { category } })
      .then((res) => setPosts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);

    // 카테고리 바뀌면 초기화
    setPage(1);
    setQ("");
    setMode("all");
  }, [category, valid]);

  // 검색어/모드 변경 시 1페이지로
  useEffect(() => {
    setPage(1);
  }, [q, mode]);

  const norm = (v) => String(v ?? "").toLowerCase();
  const query = norm(q);

  // 검색 필터
  const filtered = useMemo(() => {
    if (!query) return posts;
    return posts.filter((p) => {
      const title = norm(p.title);
      const content = norm(p.content);
      const author =
        norm(p.author_display ?? p.author ?? p.username ?? p.user ?? p.writer ?? "");

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
    });
  }, [posts, query, mode]);

  // 고정글/일반글 분리 (서버가 -is_pinned, -created_at으로 내려줘도 한 번 더 확실히)
  const pinned = useMemo(() => filtered.filter((p) => !!p.is_pinned), [filtered]);
  const normal = useMemo(() => filtered.filter((p) => !p.is_pinned), [filtered]);

  // ✅ 페이지네이션 규칙
  // - 1페이지: [모든 고정글] + [일반글 일부] (고정글 수만큼 페이지 한도에서 차지)
  // - 2페이지~: 일반글만 페이지네이션
  // - 번호는 "일반글"만 계산 (고정글은 '공지')
  const { totalPages, pageItems, normalStartIndex } = useMemo(() => {
    // 고정글이 페이지 사이즈보다 많다면 잘라서 보여줌(예외적 케이스)
    const pinCap = Math.min(pinned.length, PAGE_SIZE);
    const spaceForNormalOnFirst = Math.max(0, PAGE_SIZE - pinCap);

    if (normal.length === 0) {
      // 일반글이 하나도 없으면 페이지는 최소 1
      return {
        totalPages: 1,
        pageItems: page === 1 ? pinned.slice(0, PAGE_SIZE) : [],
        normalStartIndex: 0,
      };
    }

    // 1페이지에 들어가는 일반글 개수
    const firstPageNormalCount = Math.min(spaceForNormalOnFirst, normal.length);
    const remainingNormal = Math.max(0, normal.length - firstPageNormalCount);

    // 2페이지부터 필요한 페이지 수
    const extraPages = Math.ceil(remainingNormal / PAGE_SIZE);
    const total = 1 + (remainingNormal > 0 ? extraPages : 0);

    if (page === 1) {
      const page1Normals = normal.slice(0, firstPageNormalCount);
      return {
        totalPages: Math.max(1, total),
        pageItems: [...pinned.slice(0, pinCap), ...page1Normals],
        normalStartIndex: 0, // 일반글 번호 계산 시작 인덱스
      };
    }

    // page >= 2 → 일반글만
    // 2페이지의 일반글 오프셋 = 첫 페이지에 소비한 일반글 수 + (page-2)*PAGE_SIZE
    const offset = firstPageNormalCount + (page - 2) * PAGE_SIZE;
    const slice = normal.slice(offset, offset + PAGE_SIZE);

    return {
      totalPages: Math.max(1, total),
      pageItems: slice,
      normalStartIndex: offset, // 일반글 번호 계산에 쓰는 전역 인덱스 시작값
    };
  }, [page, pinned, normal]);

  // 번호 계산: 일반글만 카운트(내림차순)
  const totalNormal = normal.length;
  const calcDisplayNumber = (idxInCurrentList, post) => {
    if (post.is_pinned) return "공지";
    const indexAmongAllNormals = normalStartIndex + idxInCurrentList; // 전체 일반글에서의 위치(0-based)
    return totalNormal - indexAmongAllNormals; // 최신글이 큰 번호
  };

  // 날짜 포맷 (YYYY-MM-DD)
  const fmtDate = (iso) => {
    if (!iso) return "";
    // iso: "2025-08-12T08:12:34.000Z" 형태 가정
    return String(iso).slice(0, 10);
  };

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

  return (
    <div className="home-container">
      {/* 상단 타이틀 + 작성 버튼 */}
      <div className="header-row">
        <h2 className="page-title">{CATEGORIES[category]}</h2>
        <Link to={`/new/${category}`} className="write-btn">게시물 작성</Link>
      </div>

      {/* 🔎 검색바 */}
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
            <th style={{ width: 80 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 140 }}>작성자</th>
            <th style={{ width: 120 }}>날짜</th>
            <th style={{ width: 80 }}>조회수</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-cell">
                {q ? "검색 결과가 없습니다." : "게시물이 없습니다."}
              </td>
            </tr>
          ) : (
            pageItems.map((post, idx) => (
              <tr key={post.id} className={post.is_pinned ? "notice-row" : ""}>
                <td className={post.is_pinned ? "notice-cell" : ""}>
                  {calcDisplayNumber(idx, post)}
                </td>
                <td>
                  <Link to={`/posts/${post.id}`} className="post-link">
                    {post.title}
                  </Link>
                </td>
                <td>{post.author_display ?? post.author ?? ""}</td>
                <td>{fmtDate(post.created_at)}</td>
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
