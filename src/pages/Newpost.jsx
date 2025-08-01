import { useState } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Newpost() {
    const [post, setPost] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();

    const handlepost = async (e) => {
        e.preventDefault();

        const access = localStorage.getItem("access")
        if(!access) {
            alert("로그인 필요")
            return;
        }

        try{
            const res = await axios.post("http://localhost:8000/api/posts/",{title, content},
                { headers: {Authorization: `Bearer ${access}`} }
             );
            alert("등록 성공!")
            navigate('/')
        } catch(err) {
            alert("등록에 실패했습니다." + (err.response?.data?.detail || "오류"));
            console.log(err.response?.data);

        }
    };

    return (
        <div>
            <form onSubmit={handlepost}>
                <input
                type="text"
                placeholder="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                />
            
                <input
                type="text"
                placeholder="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                />
                <button type="submit">등록하기</button>
                
            </form>
        </div>

    );
}