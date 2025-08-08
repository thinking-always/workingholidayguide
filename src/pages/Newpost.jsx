import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { api } from "../utils/axios"

export default function Newpost() {
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();
    

    const handlepost = async (e) => {
        e.preventDefault();

        if ( !title.trim() || !content.trim()){
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        try{
            await api.post("/posts/",{title, content});
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
            
                <textarea
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