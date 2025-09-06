import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/axios";
import { POLICY_VERSION } from "../constants/policy";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
    agree: false,
    marketing_opt_in: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) navigate("/");
  }, [navigate]);

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const fieldError = (k) =>
    errors?.[k] ? (
      <div className="field-error">
        {Array.isArray(errors[k]) ? String(errors[k][0]) : String(errors[k])}
      </div>
    ) : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.username.trim()) return setErrors({ username: "아이디를 입력하세요." });
    if (!form.password1 || !form.password2)
      return setErrors({ password1: "비밀번호를 입력하세요." });
    if (form.password1 !== form.password2)
      return setErrors({ password2: "비밀번호가 일치하지 않습니다." });
    if (!form.agree)
      return setErrors({ agree_terms: "이용약관 및 개인정보처리방침 동의가 필요합니다." });

    try {
      setSubmitting(true);
      await api.post(
        "/auth/register/",
        {
          username: form.username,
          email: form.email,
          password1: form.password1,
          password2: form.password2,
          agree_terms: form.agree,
          agree_privacy: form.agree,
          agree_marketing: form.marketing_opt_in,
          policy_version: POLICY_VERSION,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      alert("회원가입이 완료되었습니다. 로그인해주세요.");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data || { detail: "가입에 실패했습니다." };
      setErrors(data?.errors ? data.errors : data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">회원가입</h2>
      {errors?.detail && <div className="field-error">{String(errors.detail)}</div>}

      <form className="register-form" onSubmit={onSubmit}>
        <label>
          아이디(유저네임)(필수)
          <input name="username" value={form.username} onChange={onChange} autoComplete="username" />
          {fieldError("username")}
          <p>    게시물 작성시 해당 아이디가 표시 됩니다.(한글 가능)
          </p>
        </label>

        <label>
          이메일(선택)
          <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
          {fieldError("email")}
        </label>

        <label>
          비밀번호(필수)
          <input name="password1" type="password" value={form.password1} onChange={onChange} autoComplete="new-password" />
          {fieldError("password1")}
        </label>

        <label>
          비밀번호 확인(필수)
          <input name="password2" type="password" value={form.password2} onChange={onChange} autoComplete="new-password" />
          {fieldError("password2")}
        </label>

        <div className="consent-box">
          <label className="checkbox-row">
            <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
            <span>
              <Link to="/terms" target="_blank" rel="noreferrer">이용약관</Link> 및{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer">개인정보처리방침</Link>에 동의합니다. (필수)
            </span>
          </label>
          {fieldError("agree_terms")}
          {fieldError("agree_privacy")}

          <label className="checkbox-row optional">
            <input type="checkbox" name="marketing_opt_in" checked={form.marketing_opt_in} onChange={onChange} />
            <span>마케팅 정보 수신 동의 (선택)</span>
          </label>
          {fieldError("agree_marketing")}
        </div>

        <button type="submit" className="register-submit" disabled={submitting || !form.agree}>
          {submitting ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <div className="register-footer">
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </div>
    </div>
  );
}
