import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES } from "../constants/categories";
import AdComponent from "../components/AdComponent";
import "./Home.css";

const SECTION_SLUGS = ["basic", "jobs_housing", "guide", "travel"];
const VISIBLE_PER_SECTION = 5;
const LATEST_LIMIT = 12; // 상단 가로 레일 개수

export default function Home() {
  const [data, setData] = useState({
    basic: [],
    jobs_housing: [],
    guide: [],
    travel: [],
  });
  const [counts, setCounts] = useState({
    basic: 0,
    jobs_housing: 0,
    guide: 0,
    travel: 0,
  });
  const [loading, setLoading] = useState(true);

  // 🔎 검색 상태
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all"); // all | title | content | author

  useEffect(() => {
    let mounted = true;
    Promise.all(
      SECTION_SLUGS.map((slug) =>
        api.get("/posts/", { params: { category: slug } })
      )
    )
      .then((results) => {
        if (!mounted) return;
        const nextData = {};
        const nextCounts = {};
        results.forEach((res, i) => {
          const slug = SECTION_SLUGS[i];
          const arr = Array.isArray(res.data) ? res.data : [];
          nextCounts[slug] = arr.length; // 전체 개수
          nextData[slug] = arr;          // 전체 데이터 (검색/레일에 사용)
        });
        setCounts(nextCounts);
        setData(nextData);
      })
      .catch(console.error)
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // ---- 날짜 유틸 ----
  const pickDateValue = (p) =>
    p?.created_at || p?.date || p?.updated_at || p?.created || "";
  const dateToNum = (v) => {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  };
  const formatDate = (v) => {
    const t = dateToNum(v);
    if (!t) return "";
    const d = new Date(t);
    // YY.MM.DD
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  // ---- 상단 최신 레일: 모든 카테고리 합쳐서 최신순 ----
  const latestPosts = useMemo(() => {
    const merged = SECTION_SLUGS.flatMap((slug) =>
      (data[slug] || []).map((p) => ({
        ...p,
        _cat: slug,
        _dateRaw: pickDateValue(p),
        _dateNum: dateToNum(pickDateValue(p)),
      }))
    );
    merged.sort((a, b) => b._dateNum - a._dateNum);
    return merged.slice(0, LATEST_LIMIT);
  }, [data]);

  // ---- 검색 ----
  const norm = (v) => String(v ?? "").toLowerCase();
  const query = norm(q);
  const matches = (p) => {
    if (!query) return true;
    const title   = norm(p.title);
    const content = norm(p.content);
    const author  = norm(p.author ?? p.username ?? p.user ?? p.writer ?? "");
    switch (mode) {
      case "title":   return title.includes(query);
      case "content": return content.includes(query);
      case "author":  return author.includes(query);
      default:        return title.includes(query) || content.includes(query) || author.includes(query);
    }
  };

  return (
    <div className="home-layout">
      {/* 메인 콘텐츠 */}
      <div className="home-container">
        {/* 상단: 최신 글 가로 레일 */}
        <div className="home-header-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="home-title">최신 글 한눈에 보기</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#666" }}>불러오는 중…</div>
        ) : latestPosts.length === 0 ? (
          <div className="latest-rail empty">최근 게시물이 없습니다.</div>
        ) : (
          <LatestRail items={latestPosts} formatDate={formatDate} />
        )}

        {/* 🔎 검색바 (레일 아래로 이동) */}
        <div className="search-bar search-bar--below">
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
          />
          <select
            className="search-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="title">제목</option>
            <option value="content">내용</option>
            <option value="author">작성자</option>
          </select>
        </div>

        {/* 카테고리별 섹션 */}
        {loading ? null : (
          <div className="home-sections">
            {SECTION_SLUGS.map((slug) => {
              const filteredPosts = (data[slug] || []).filter(matches).slice(0, VISIBLE_PER_SECTION);
              return (
                <SectionCard
                  key={slug}
                  slug={slug}
                  title={CATEGORIES[slug]}
                  posts={filteredPosts}
                  total={counts[slug]}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 👉 사이드바 */}
      <aside className="sidebar">
        <h3 className="sidebar-title">스폰서</h3>
        <AdComponent slot="XXXXXXXXXX" />
        <div style={{ marginTop: 20 }}>
          <AdComponent slot="YYYYYYYYYY" />
        </div>
      </aside>
    </div>
  );
}

function LatestRail({ items, formatDate }) {
  return (
    <div className="latest-rail">
      <div className="latest-track">
        {items.map((p) => (
          <Link key={`${p._cat}-${p.id}`} to={`/posts/${p.id}`} className="latest-card" title={p.title}>
            <div className="latest-pill">{CATEGORIES[p._cat] || p._cat}</div>
            <div className="latest-title">{p.title}</div>
            <div className="latest-meta">{formatDate(p._dateRaw)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ slug, title, posts, total }) {
  const calcDisplayNumber = (idxInSlice) =>
    Math.max(1, (total || posts.length) - idxInSlice);

  return (
    <div className="home-section">
      <div className="section-header">
        <h3>{title}</h3>
        <Link to={`/${slug}`} className="section-more">더보기</Link>
      </div>

      <table className="post-table post-table--compact">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>날짜</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", color: "#777" }}>
                게시물이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((p, idx) => (
              <tr key={p.id}>
                <td>{calcDisplayNumber(idx)}</td>
                <td className="ellipsis">
                  <Link to={`/posts/${p.id}`} title={p.title}>
                    {p.title}
                  </Link>
                </td>
                <td>{p.author || "익명"}</td>
                <td>{p.date}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
