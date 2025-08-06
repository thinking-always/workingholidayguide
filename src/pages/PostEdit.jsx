
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/axios";


export default function PostEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");



    useEffect(() => {
        api.get(`/posts/${id}`)
            .then((res) => {
                setTitle(res.data.title)
                setContent(res.data.content);
            })
            .catch((err) => {
                console.error("불로오기 실패", err)
                alert("글을 찾을수 없습니다.");
                navigate("/");
            });
    }, [id, navigate]);

    const handleEdit = async (e) => {
        e.preventDefault();
        

        try {
            await api.patch(`/posts/${id}/`, {
                title,
                content,
            }
            );
            alert("수정 성공!");
            navigate(`/posts/${id}`);
        } catch (err) {
            alert("수정 실패 했습니다.")
            console.error("수정 실패", err);
            navigate(`/posts/${id}`);
        }
    };

    const handleCancel = () => {
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
            <button onClick={handleCancel}>취소</button>
        </div>
    )
}