import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/axios";  // 설정한 axios를 import
import { AuthContext } from "../context/AuthContext";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const navigate = useNavigate();
    const { accessToken, user } = useContext(AuthContext);

    useEffect(() => {
        api.get(`posts/${id}/`)
            .then((res) => {
                setPost(res.data);
                setComments(res.data.comments);
            })
            .catch((err) => {
                console.error("상세불러오기 실패", err);
            });
    }, [id]);

    const handleEdit = () => {
        navigate(`/posts/${id}/edit`);
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("정말 삭제 하시겠습니까?");
        if (!confirmDelete) return;

        try {
            await api.delete(`posts/${id}/`);
            alert("삭제성공");
            navigate('/');
        } catch (error) {
            console.error("삭제 실패", error);
            alert("삭제 실패");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        try {
            const res = await api.post(`posts/${id}/comments/`, {
                post: id,
                content: commentContent
            });
            alert("댓글을 작성하였습니다.");
            //setComments([res.data, ...comments]);//
            setComments([res.data, ...comments]);
            setCommentContent("");
        } catch (err) {
            console.error("댓글 작성 실패", err);
            alert("댓글 작성에 실패했습니다.");
        }
    };

    if (!post) return <div>불러오는 중 ...</div>;

    return (
        <div>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            {user?.username === post.author_username && (
                <>
                    <button onClick={handleEdit}>수정</button>
                    <button onClick={handleDelete}>삭제</button>
                </>
            )}


            {accessToken && (
                <form onSubmit={handleCommentSubmit}>
                    <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="댓글을 입력하세요"
                    />
                    <button type="submit">댓글 작성</button>
                </form>
            )}

            <ul>
                {comments.map((c) => (
                    <li key={c.id}>
                        <strong>{c.author_username}</strong>: {c.content}
                    </li>
                ))}
            </ul>
        </div>
    );
}
