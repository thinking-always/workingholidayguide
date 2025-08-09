import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/axios";
import './Home.css';

export default function Home() {
    const [posts, setPosts] = useState([]);
    const [category, setCategory] = useState("all");

    useEffect(() => {
        api.get("/posts/")
            .then((res) => setPosts(res.data))
            .catch(console.error);
    }, []);

    const categories = ["all", "공지", "자유", "Q&A"];

    const filtered = category === "all"
        ? posts
        : posts.filter((p) => p.category === category);

    return (
        <div className="home-container">
            {/* 카테고리 탭 */}
            <nav className="category-tabs">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={category === cat ? "active" : ""}
                        onClick={() => setCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </nav>

            {/* 게시물 작성 버튼 */}
            <Link to="/new" className="write-btn">게시물 작성</Link>

            {/* 게시판 테이블 */}
            <table className="post-table">
                <thead>
                    <tr>
                        <th>번호</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>날짜</th>
                        <th>조회수</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post, index) => (
                        <tr key={post.id}>
                            <td>{index + 1}</td>
                            <td><Link to={`posts/${post.id}`}>{post.title}</Link></td>
                            <td>{post.author}</td>
                            <td>{post.date}</td>
                            <td>{post.views}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}
