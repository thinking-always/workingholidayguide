import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:8000/api/posts/${id}/`)
        .then((res) => {
            setPost(res.data);
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

    return (
        <div>
            <h2>{ post.title }</h2>
            <p>{ post.content }</p>
            <button onClick={handleEdit}>수정</button>
            <button onClick={handleDelete}>삭제</button>
        </div>
        
    );
}