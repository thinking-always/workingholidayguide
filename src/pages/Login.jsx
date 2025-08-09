import { useState } from "react"
import axios from 'axios';
import { useNavigate } from "react-router-dom"
import { api } from "../utils/axios"

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    const handleLogin = async (e)  => {
        e.preventDefault();
        setLoading(true);
        try{
            const res = await api.post("/auth/login/", 
                {username, password});
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            console.log('access', res.data.access);
            console.log('refresh', res.data.refresh);
            alert("로그인 성공!");
            navigate("/");
            window.location.reload();
        } catch(err) {
            alert("로그인 실패:" + (err.response?.data?.detail || err.message ||"오류"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleLogin} style={{ opacity: loading ? 0.5 : 1 }}>
                <h2>로그인</h2>
                <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
                <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "로딩 중..." : "로그인" } 
                </button>
            </form>
        </div>
    )
}