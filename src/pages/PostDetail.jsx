// src/pages/PostDetail.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import "react-quill/dist/quill.snow.css";
import { api } from "../utils/axios";
import "./PostDetail.css";
import "./CategoryList.css";               // ✅ 리스트 디자인 재사용
import { AuthContext } from "../contexts/AuthContext";
import { ensureLoggedIn } from "../utils/auth";
import { CATEGORIES } from "../constants/categories";

const RELATED_PAGE_SIZE = 15;

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [postError, setPostError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // ▼ 같은 카테고리 최신글(테이블로 표시)
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [relPage, setRelPage] = useState(1);
  const [relLoading, setRelLoading] = useState(false);
  const [relErr, setRelErr] = useState("");

  useEffect(() => {
    fetchPost();
    fetchComments();
    setRelPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!post?.category) return;
    fetchRelated(post.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.category, id]);

  // 게시글 상세
  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${id}/`);
      setPost(res.data);
      setPostError("");
    } catch {
      setPost(null);
      setPostError("게시글을 불러오지 못했습니다.");
    }
  };

  // 댓글 목록
  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/`, { params: { post: id } });
      setComments(res.data || []);
      setCommentsError("");
    } catch (err) {
      setComments([]);
      setCommentsError("댓글을 불러오지 못했습니다.");
      console.error(err);
    }
  };

  // 같은 카테고리 최신글 불러오기
  const fetchRelated = async (category) => {
    try {
      setRelLoading(true);
      setRelErr("");
      const res = await api.get(`/posts/`, { params: { category } });
      const list = Array.isArray(res.data) ? res.data : [];
      // 현재글 제외 + 고정글 먼저, 그 다음 최신순
      const sorted = [...list]
        .filter((p) => String(p.id) !== String(id))
        .sort((a, b) => {
          const ap = a.is_pinned ? 1 : 0;
          const bp = b.is_pinned ? 1 : 0;
          if (ap !== bp) return bp - ap; // pinned desc
          const ad = new Date(a.created_at || a.createdAt || 0).getTime();
          const bd = new Date(b.created_at || b.createdAt || 0).getTime();
          return bd - ad; // latest first
        });
      setRelatedPosts(sorted);
      setRelPage(1);
    } catch (e) {
      console.error(e);
      setRelatedPosts([]);
      setRelErr("같은 카테고리 최신글을 불러오지 못했습니다.");
    } finally {
      setRelLoading(false);
    }
  };

  if (postError) return <div className="post-detail-container">{postError}</div>;
  if (!post) return <div className="post-detail-container">불러오는 중…</div>;

  // 본문 HTML sanitize
  const safeHtml = DOMPurify.sanitize(post.content ?? "", { USE_PROFILES: { html: true } });

  // 현재 로그인 정보(여러 JWT 형태 대비)
  const currentUserId = user?.user_id ?? user?.id ?? user?.pk ?? null;
  const currentUsername = user?.username ?? user?.nickname ?? user?.sub ?? null;

  // 포스트 작성자 판별
  const postOwnerId = post.user ?? post.user_id ?? post.author_id ?? null;
  const postOwnerUsername = post.author ?? post.user?.username ?? null;
  const isPostOwner =
    ((postOwnerId != null && currentUserId != null &&
      Number(postOwnerId) === Number(currentUserId)) ||
     (!!postOwnerUsername && !!currentUsername &&
      postOwnerUsername === currentUsername));

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("정말 게시글을 삭제할까요?")) return;
    try {
      await api.delete(`/posts/${id}/`);
      alert("삭제 완료");
      navigate("/");
    } catch {
      alert("삭제 실패");
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!ensureLoggedIn(navigate, "댓글 작성은 로그인 후 이용 가능합니다.")) return;

    if (!newComment.trim()) return alert("댓글 내용을 입력하세요.");
    try {
      setIsSubmitting(true);
      await api.post(`/comments/`, { post: Number(id), content: newComment });
      setNewComment("");
      await fetchComments();
    } catch (err) {
      const msg = err?.response?.data?.detail || "댓글 등록 실패";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/comments/${commentId}/`);
      await fetchComments();
    } catch (err) {
      const msg = err?.response?.data?.detail || "댓글 삭제 실패 (권한이 없을 수 있어요).";
      alert(msg);
    }
  };

  // 특정 댓글이 현재 로그인 유저의 것인지 판별
  const isMyComment = (c) => {
    const commentAuthorId =
      typeof c.author === "number" ? c.author
      : typeof c.author === "string" ? Number(c.author)
      : c.author?.id ?? c.author?.pk ?? null;

    const byId =
      commentAuthorId != null && currentUserId != null &&
      Number(commentAuthorId) === Number(currentUserId);

    const commentAuthorUsername =
      c.author_username ?? c.author?.username ?? null;

    const byName =
      !!commentAuthorUsername && !!currentUsername &&
      commentAuthorUsername === currentUsername;

    return byId || byName;
  };

  // 댓글 수정 시작/취소/저장
  const handleCommentEditStart = (comment) => {
    if (!isMyComment(comment)) return;
    setEditCommentId(comment.id);
    setEditContent(comment.content || "");
    setIsEditing(false);
  };
  const handleCommentEditCancel = () => {
    setEditCommentId(null);
    setEditContent("");
    setIsEditing(false);
  };
  const handleCommentEditSave = async () => {
    if (!editContent.trim()) return alert("수정할 내용을 입력하세요.");
    try {
      setIsEditing(true);
      await api.patch(`/comments/${editCommentId}/`, { content: editContent });
      await fetchComments();
      setEditCommentId(null);
      setEditContent("");
    } catch (err) {
      const msg = err?.response?.data?.detail || "댓글 수정 실패 (권한이 없을 수 있어요).";
      alert(msg);
    } finally {
      setIsEditing(false);
    }
  };

  // 작성일/작성자 표기
  const createdAt = post.created_at || post.createdAt || post.created || null;
  const createdText = createdAt ? new Date(createdAt).toLocaleString() : "";
  const authorName =
    post.author_display ??
    post.author?.nickname ??
    post.author?.username ??
    post.author ??
    "익명";

  // ===== 같은 카테고리 최신글 (기존 리스트 디자인 그대로) =====
  // 고정글/일반글 분리
  const pinned = relatedPosts.filter((p) => !!p.is_pinned);
  const regular = relatedPosts.filter((p) => !p.is_pinned);

  // 일반글만 페이지네이션 (고정글은 1페이지 상단에만 노출)
  const totalRegular = regular.length;
  const totalRelPages = Math.max(1, Math.ceil(totalRegular / RELATED_PAGE_SIZE));
  const relStart = (relPage - 1) * RELATED_PAGE_SIZE;
  const pageRegular = regular.slice(relStart, relStart + RELATED_PAGE_SIZE);

  // 1페이지면 고정글 + 일반글 섞어서 보여주되, 번호는 일반글만 계산
  const pageRows = relPage === 1 ? [...pinned, ...pageRegular] : pageRegular;

  // 일반글 번호(최신이 큰 번호). 고정글은 “공지”로 표기
  const numberForRegular = (idxInPageRows) => {
    const regularOffsetOnPage = relPage === 1 ? idxInPageRows - pinned.length : idxInPageRows;
    const globalRegularIndex = relStart + Math.max(0, regularOffsetOnPage);
    return totalRegular - globalRegularIndex;
  };

  return (
    <div className="post-detail-container">
      <div className="post-header">
        <h2>{post.title}</h2>
      </div>

      <div className="post-author">
        작성자: {authorName} {createdText && <>· {createdText}</>}
      </div>

      <div className="post-content">
        <div className="ql-snow">
          <div className="ql-editor" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>
      </div>

      {/* 작성자만 노출 */}
      {isPostOwner && (
        <div className="post-actions">
          <Link to={`/posts/${id}/edit`} className="action-btn">수정</Link>
          <button className="action-btn delete-btn" onClick={handleDeletePost}>삭제</button>
        </div>
      )}

      {/* 댓글 작성 폼 */}
      <form className="comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          className="comment-input"
          placeholder="댓글을 입력하세요"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "등록"}
        </button>
      </form>

      {/* 댓글 타이틀/리스트 */}
      <h3 className="comments-title">댓글 목록</h3>
      {commentsError && <div className="comments-error">{commentsError}</div>}
      <ul className="comments-list">
        {comments.length === 0 ? (
          <li className="comment-item">첫 댓글을 남겨보세요.</li>
        ) : (
          comments.map((comment) => {
            const displayName =
              comment.author_username ??
              comment.author?.nickname ??
              comment.author?.username ??
              "익명";
            const timeText = comment.created_at
              ? new Date(comment.created_at).toLocaleString()
              : "";
            const isEditingThis = editCommentId === comment.id;
            const mine = isMyComment(comment);

            return (
              <li key={comment.id} className="comment-item">
                <strong>{displayName}</strong> · {timeText}

                {!isEditingThis && <p>{comment.content}</p>}

                {isEditingThis && mine && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      className="comment-input"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="댓글 내용을 수정하세요"
                      style={{ minHeight: 60 }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleCommentEditSave}
                        disabled={isEditing}
                      >
                        {isEditing ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        onClick={handleCommentEditCancel}
                        disabled={isEditing}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {!isEditingThis && mine && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleCommentEditStart(comment)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => handleCommentDelete(comment.id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* ===== 같은 카테고리 최신글: 기존 리스트(테이블) 디자인 ===== */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>
            같은 카테고리 최신글
            {post?.category && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#2563eb", background: "#eaf2ff", padding: "2px 8px", borderRadius: 999 }}>
                {CATEGORIES?.[post.category] ?? post.category}
              </span>
            )}
          </h3>
          {post?.category && (
            <Link to={`/${post.category}`} className="write-btn" style={{ textDecoration: "none" }}>
              이 카테고리로 이동
            </Link>
          )}
        </div>

        {/* 동일 디자인 테이블 */}
        <table className="post-table">
          <thead>
            <tr>
              <th>공지</th>
              <th>제목</th>
              <th>작성자</th>
              <th>날짜</th>
              <th>조회수</th>
            </tr>
          </thead>
          <tbody>
            {relLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#777" }}>불러오는 중…</td>
              </tr>
            ) : relErr ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#d00" }}>{relErr}</td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#777" }}>같은 카테고리에 다른 글이 없습니다.</td>
              </tr>
            ) : (
              pageRows.map((p, idx) => {
                const isPinned = !!p.is_pinned;
                const author =
                  p.author_display ??
                  p.author?.nickname ??
                  p.author?.username ??
                  p.author ??
                  "익명";
                const dateText = p.created_at
                  ? new Date(p.created_at).toLocaleDateString()
                  : "";
                const numberCell = isPinned ? "공지" : numberForRegular(idx);

                return (
                  <tr key={p.id} className={isPinned ? "notice-row" : ""}>
                    <td style={{ width: 72, textAlign: "center", fontWeight: isPinned ? 700 : 400 }}>
                      {numberCell}
                    </td>
                    <td>
                      <Link to={`/posts/${p.id}`}>{p.title}</Link>
                    </td>
                    <td>{author}</td>
                    <td>{dateText}</td>
                    <td>{p.views ?? 0}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 페이지네이션: 기존 .category-tabs 재사용 */}
        {totalRelPages > 1 && !relLoading && !relErr && (
          <div className="category-tabs" aria-label="pagination" style={{ justifyContent: "center" }}>
            <button onClick={() => setRelPage((p) => Math.max(1, p - 1))} disabled={relPage === 1}>
              이전
            </button>
            {Array.from({ length: totalRelPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={relPage === p ? "active" : ""}
                onClick={() => setRelPage(p)}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setRelPage((p) => Math.min(totalRelPages, p + 1))} disabled={relPage === totalRelPages}>
              다음
            </button>
          </div>
        )}
      </div>
      {/* ===== /같은 카테고리 최신글 ===== */}
    </div>
  );
}
