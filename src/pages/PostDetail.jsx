import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const access = localStorage.getItem("access")
    const isLoggedIn = !!access;

    useEffect(() => {
        axios.get(`http://localhost:8000/api/posts/${id}/`)
        .then((res) => {
            setPost(res.data);
            setComments(res.data.comments)
        })
        .catch((err) => {
            console.error("상세불러오기 실패", err);
        });
        
    }, [id]);
    if(!post) return <div>불러오는 중 ...</div>

    const handleEdit = () => {
        navigate(`/posts/${id}/edit`);
    };

    const handleDelete = async () => {
        const access = localStorage.getItem("access")
        const confirmDelete = window.confirm("정말 삭제 하시겠습니까?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:8000/api/posts/${id}/`,{
                headers: {
                    Authorization: `Bearer ${access}`
                }
            });
            alert("삭제성공")
            navigate('/')
        } catch (error){
            console.error("삭제 실패", error)
            alert("삭제 식패", error)
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const access = localStorage.getItem("access")
        if (!commentContent.trim()) return;

        try{
            const res = await axios.post(`http://localhost:8000/api/posts/${id}/`,{
            post: id,
            content: commentContent
            },{
                headers: {
                    Authorization: `Bearer ${access}`
                }
            });
            alert("댓글을 작성하였습니다.")
            setComments([res.data, ...comments]);
            setCommentContent("");
        } catch (err) {
            console.error("댓글 작성 실패", err)
            alert("댓글 작성에 실패했습니다.")
        }
    };

    if (!comments) <div> 불러오는중 ...</div>

    return (
        <div>
            <h2>{ post.title }</h2>
            <p>{ post.content }</p>
            <button onClick={handleEdit}>수정</button>
            <button onClick={handleDelete}>삭제</button>

            {isLoggedIn && (
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
                    <li>
                        <strong>{c.author_username}</strong>: {c.content}
                    </li>
                ))}
            </ul>
            
        </div>
        
    );
}