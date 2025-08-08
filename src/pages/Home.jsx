import axios from "axios";
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import './Home.css'
import { api } from "../utils/axios";


export default function Home() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        api.get("/posts/")
            .then((res) => {
                setPosts(res.data);
            })
            .catch((err) => {
                console.error("로그 실페", err)
            });
    }, [])

    return (
        <div>
            <h1>게시판</h1>
            <Link to='/login'>로그인</Link><br />

            <Link to="/new">게시물 올리기 </Link>

            <h2>게시물 목록</h2>
            {posts.map((post) => (
                <div key={post.id} className="postlist">
                    <Link to={`posts/${post.id}`}>
                        <h3>{post.title}</h3>
                    </Link>
                </div>
            ))}
        </div>
    );
};






