import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";


export default function PostEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");


    useEffect(() => {
        axios.get(`http://localhost:8000/api/posts/${id}`)
            .then((res) => {
                setTitle(res.data.title)
                setContent(res.data.content);
            })
            .catch((err) => {
                console.error("불로오기 실패", err)
                alert("글을 찾을수 없습니다.");
                navigate("/");
            });
    }, [id]);

    const handleEdit = async (e) => {
        e.preventDefault();
        const access = localStorage.getItem("access")

        try {
            await axios.patch(`http://localhost:8000/api/posts/${id}/`, {
                title,
                content,
            }, {
                headers: {
                    Authorization: `Bearer ${access}`
                }
            });
            alert("수정 성공!");
            navigate(`/posts/${id}`);
        } catch (err) {
            alert("수정 실패 했습니다.")
            console.error("수정 실패", err);
            navigate(`/posts/${id}`);
        }
    };

    const handleCancle = () => {
        navigate(`/posts/${id}`);
    };

    return (
        <div>
            <h1>수정하기</h1>
            <input
                type="text"
                placeholder="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <br />

            <textarea
                placeholder="내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <br />

            <button onClick={handleEdit}>수정</button>
            <button onClick={handleCancle}>취소</button>
        </div>
    )
}