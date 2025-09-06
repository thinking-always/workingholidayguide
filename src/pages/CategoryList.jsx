import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES, CATEGORY_SLUGS } from "../constants/categories";
import "./CategoryList.css";

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

  // 데이터 로드
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
  useEffect(() => { setPage(1); }, [q, mode]);

  const norm = (v) => String(v ?? "").toLowerCase();
  const query = norm(q);

  // 검색 필터
  const filtered = useMemo(() => {
    if (!query) return posts;
    return posts.filter((p) => {
      const title = norm(p.title);
      const content = norm(p.content);
      const author = norm(
        p.author_display ?? p.author ?? p.username ?? p.user ?? p.writer ?? ""
      );
      switch (mode) {
        case "title":   return title.includes(query);
        case "content": return content.includes(query);
        case "author":  return author.includes(query);
        default:        return title.includes(query) || content.includes(query) || author.includes(query);
      }
    });
  }, [posts, query, mode]);

  // 고정글/일반글 분리
  const pinned = useMemo(() => filtered.filter((p) => !!p.is_pinned), [filtered]);
  const normal = useMemo(() => filtered.filter((p) => !p.is_pinned), [filtered]);

  // 페이지네이션 계산
  const { totalPages, pageItems, normalStartIndex } = useMemo(() => {
    const pinCap = Math.min(pinned.length, PAGE_SIZE);
    const spaceForNormalOnFirst = Math.max(0, PAGE_SIZE - pinCap);

    if (normal.length === 0) {
      return {
        totalPages: 1,
        pageItems: page === 1 ? pinned.slice(0, PAGE_SIZE) : [],
        normalStartIndex: 0,
      };
    }

    const firstPageNormalCount = Math.min(spaceForNormalOnFirst, normal.length);
    const remainingNormal = Math.max(0, normal.length - firstPageNormalCount);
    const extraPages = Math.ceil(remainingNormal / PAGE_SIZE);
    const total = 1 + (remainingNormal > 0 ? extraPages : 0);

    if (page === 1) {
      const page1Normals = normal.slice(0, firstPageNormalCount);
      return {
        totalPages: Math.max(1, total),
        pageItems: [...pinned.slice(0, pinCap), ...page1Normals],
        normalStartIndex: 0,
      };
    }

    const offset = firstPageNormalCount + (page - 2) * PAGE_SIZE;
    const slice = normal.slice(offset, offset + PAGE_SIZE);

    return {
      totalPages: Math.max(1, total),
      pageItems: slice,
      normalStartIndex: offset,
    };
  }, [page, pinned, normal]);

  // 번호 계산(일반글만 카운트, 내림차순)
  const totalNormal = normal.length;
  const calcDisplayNumber = (idxInCurrentList, post) => {
    if (post.is_pinned) return "공지";
    const indexAmongAllNormals = normalStartIndex + idxInCurrentList;
    return totalNormal - indexAmongAllNormals;
  };

  // 값 유틸
  const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : "");
  const getAuthor = (p) =>
    p?.author_display ?? p?.author ?? p?.username ?? p?.user ?? p?.writer ?? "익명";
  const getViews = (p) => Number.isFinite(p?.views) ? p.views : 0;
  const getCommentsCount = (p) => {
    const c =
      p?.comments_count ??
      p?.comment_count ??
      (Array.isArray(p?.comments) ? p.comments.length : undefined) ??
      p?.replies_count ??
      (Array.isArray(p?.replies) ? p.replies.length : undefined);
    return Number.isFinite(c) ? c : 0;
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
            <th style={{ width: 140 }} className="th-author">작성자</th>
            <th style={{ width: 120 }} className="th-date">날짜</th>
            <th style={{ width: 80 }} className="th-views">조회수</th>
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
            pageItems.map((post, idx) => {
              const author = getAuthor(post);
              const date = fmtDate(post.created_at);
              const views = getViews(post);
              const comments = getCommentsCount(post);

              // 모바일 메타 항목들
              const meta = [
                author && { key: "author", label: author },
                date   && { key: "date",   label: date },
                { key: "views", label: `조회 ${views}` },
                { key: "comments", label: `댓글 ${comments}` },
              ].filter(Boolean);

              return (
                <tr key={post.id} className={post.is_pinned ? "notice-row" : ""}>
                  <td className={post.is_pinned ? "notice-cell" : ""}>
                    {calcDisplayNumber(idx, post)}
                  </td>
                  <td className="title-cell">
                    <Link to={`/posts/${post.id}`} className="post-link">
                      {post.title}
                      {comments > 0 && (
                        <span className="comment-count"> ({comments})</span>
                      )}
                    </Link>

                    {/* ✅ 모바일 전용: 메타 정보 */}
                    <div className="meta-strip" aria-label="게시물 요약 정보">
                      {meta.map((m) => (
                        <span className="meta-item" key={m.key} aria-label={m.label}>
                          {m.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="td-author">{author}</td>
                  <td className="td-date">{date}</td>
                  <td className="td-views">{views}</td>
                </tr>
              );
            })
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
