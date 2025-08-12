// src/pages/PostDetail.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import "react-quill/dist/quill.snow.css";
import { api } from "../utils/axios";
import "./PostDetail.css";
import { AuthContext } from "../contexts/AuthContext";
import { ensureLoggedIn } from "../utils/auth";

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

  useEffect(() => {
    fetchPost();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // 댓글 목록: GET /comments/?post=:id
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

  if (postError) return <div className="post-detail-container">{postError}</div>;
  if (!post) return <div className="post-detail-container">불러오는 중…</div>;

  // 본문 HTML sanitize 후 렌더
  const safeHtml = DOMPurify.sanitize(post.content ?? "", {
    USE_PROFILES: { html: true },
  });

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

  // 댓글 작성: POST /comments/  body: { post, content }
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

  // 댓글 삭제: DELETE /comments/{id}/
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

  // 댓글 수정 시작 (본인 것만 허용)
  const handleCommentEditStart = (comment) => {
    if (!isMyComment(comment)) return;
    setEditCommentId(comment.id);
    setEditContent(comment.content || "");
    setIsEditing(false);
  };

  // 댓글 수정 취소
  const handleCommentEditCancel = () => {
    setEditCommentId(null);
    setEditContent("");
    setIsEditing(false);
  };

  // 댓글 수정 저장: PATCH /comments/{id}/  body: { content }
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
      setIsEditing(false); // ✅ 항상 상태 복구
    }
  };

  // 작성일/작성자 표기
  const createdAt = post.created_at || post.createdAt || post.created || null;
  const createdText = createdAt ? new Date(createdAt).toLocaleString() : "";
  const authorName =
    post.author?.nickname ??
    post.author?.username ??
    post.author ??
    "익명";

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

      {/* 댓글 섹션 제목 */}
      <h3 className="comments-title">댓글 목록</h3>

      {/* (선택) 에러 메시지 */}
      {commentsError && (
        <div className="comments-error">{commentsError}</div>
      )}

      {/* 댓글 리스트 */}
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

                {/* 보기 모드 */}
                {!isEditingThis && <p>{comment.content}</p>}

                {/* 수정 모드 (본인일 때만) */}
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

                {/* 액션 버튼: 본인 댓글일 때만 노출 */}
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
    </div>
  );
}
