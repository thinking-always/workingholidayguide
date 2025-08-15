// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/axios";
import { CATEGORIES } from "../constants/categories";
import "./Home.css";

const SECTION_SLUGS = ["basic", "jobs_housing", "guide", "travel"];
const VISIBLE_PER_SECTION = 5;

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
          nextData[slug] = arr; // 전체 데이터 (검색에 필요)
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

  const norm = (v) => String(v ?? "").toLowerCase();
  const query = norm(q);

  // 🔎 검색 필터 함수
  const matches = (p) => {
    if (!query) return true;
    const title   = norm(p.title);
    const content = norm(p.content);
    const author  = norm(p.author ?? p.username ?? p.user ?? p.writer ?? "");
    switch (mode) {
      case "title":
        return title.includes(query);
      case "content":
        return content.includes(query);
      case "author":
        return author.includes(query);
      default:
        return title.includes(query) || content.includes(query) || author.includes(query);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="home-title">최신 글 한눈에 보기</h2>

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
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#666" }}>불러오는 중…</div>
      ) : (
        <div className="home-sections">
          {SECTION_SLUGS.map((slug) => {
            const filteredPosts = data[slug].filter(matches).slice(0, VISIBLE_PER_SECTION);
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
