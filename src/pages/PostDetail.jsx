import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState("");

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


    return (
        <div>
            <h2>{ post.title }</h2>
            <p>{ post.content }</p>
        </div>
    );
}