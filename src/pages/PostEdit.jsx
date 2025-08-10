import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../utils/axios";
import "./PostEdit.css";

// ✅ 폰트 화이트리스트
const Font = Quill.import("formats/font");
Font.whitelist = ["arial", "georgia", "tahoma", "courier"];
Quill.register(Font, true);

// ✅ px 단위 사이즈 화이트리스트
const Size = Quill.import("attributors/style/size");
Size.whitelist = [
  "10px", "12px", "14px", "16px", "18px",
  "20px", "22px", "24px", "26px", "28px", "30px"
];
Quill.register(Size, true);

export default function PostEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ 툴바 구성 (Heading 제거, size는 px 단위)
  const modules = {
    toolbar: { container: "#editor-toolbar-edit" },
  };

  // ✅ 허용 포맷
  const formats = [
    "bold", "italic", "underline", "strike",
    "list", "bullet", "align",
    "link", "image", "code-block",
    "color", "background",
    "font", "size",
  ];

  useEffect(() => {
    // 상세 불러오기 (트레일링 슬래시 일관)
    api.get(`/posts/${id}/`)
      .then((res) => {
        setTitle(res.data.title ?? "");
        setContent(res.data.content ?? ""); // HTML 문자열
      })
      .catch((err) => {
        console.error("불러오기 실패", err);
        alert("글을 찾을 수 없습니다.");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // ✅ 툴바 버튼/셀렉트에 툴팁(설명) 부여
  useEffect(() => {
    const toolbar = document.getElementById("editor-toolbar-edit");
    if (!toolbar) return;

    const setTip = (selector, label) => {
      const el = toolbar.querySelector(selector);
      if (!el) return;
      el.setAttribute("title", label);          // 브라우저 기본
      el.setAttribute("aria-label", label);     // 접근성
      el.setAttribute("data-tooltip", label);   // 커스텀 툴팁
    };

    setTip("select.ql-font", "폰트(Font): 본문 글꼴 변경");
    setTip("select.ql-size", "글자 크기(Size): px 단위");

    setTip("button.ql-bold", "굵게(Bold)");
    setTip("button.ql-italic", "기울임(Italic)");
    setTip("button.ql-underline", "밑줄(Underline)");
    setTip("button.ql-strike", "취소선(Strikethrough)");

    setTip("select.ql-color", "글자 색(Color)");
    setTip("select.ql-background", "배경 색(Highlight)");

    setTip("button.ql-list[value='ordered']", "번호 목록");
    setTip("button.ql-list[value='bullet']", "점 목록");
    setTip("select.ql-align", "정렬");

    setTip("button.ql-link", "링크");
    setTip("button.ql-image", "이미지");
    setTip("button.ql-code-block", "코드 블록");
    setTip("button.ql-clean", "서식 제거");
  }, []);

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력하세요.");
      return;
    }
    try {
      await api.patch(`/posts/${id}/`, { title, content });
      alert("수정 성공!");
      navigate(`/posts/${id}`);
    } catch (err) {
      console.error("수정 실패", err);
      alert("수정 실패했습니다.");
    }
  };

  const handleCancel = () => navigate(`/posts/${id}`);

  if (loading) {
    return <div className="post-edit-container">불러오는 중…</div>;
  }

  return (
    <div className="post-edit-container">
      <h2 className="post-edit-title">수정하기</h2>

      <form onSubmit={handleEdit} className="post-edit-form">
        <input
          className="post-edit-input"
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* ✅ 커스텀 툴바 (ID만 편집 화면용으로 구분) */}
        <div id="editor-toolbar-edit" className="ql-custom-toolbar">
          <span className="ql-formats">
            <select className="ql-font" defaultValue="">
              <option value=""></option>
              <option value="arial">Arial</option>
              <option value="georgia">Georgia</option>
              <option value="tahoma">Tahoma</option>
              <option value="courier">Courier New</option>
            </select>
            <select className="ql-size" defaultValue="">
              <option value="10px">10px</option>
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="22px">22px</option>
              <option value="24px">24px</option>
              <option value="26px">26px</option>
              <option value="28px">28px</option>
              <option value="30px">30px</option>
            </select>
          </span>

          <span className="ql-formats">
            <button className="ql-bold" />
            <button className="ql-italic" />
            <button className="ql-underline" />
            <button className="ql-strike" />
          </span>

          <span className="ql-formats">
            <select className="ql-color" />
            <select className="ql-background" />
          </span>

          <span className="ql-formats">
            <button className="ql-list" value="ordered" />
            <button className="ql-list" value="bullet" />
            <select className="ql-align" />
          </span>

          <span className="ql-formats">
            <button className="ql-link" />
            <button className="ql-image" />
            <button className="ql-code-block" />
            <button className="ql-clean" />
          </span>
        </div>

        {/* ✅ 에디터 */}
        <ReactQuill
          value={content}
          onChange={setContent}
          theme="snow"
          placeholder="내용을 입력하세요"
          modules={modules}
          formats={formats}
          className="post-edit-editor"
        />

        <div className="post-edit-actions">
          <button type="submit" className="post-edit-submit-btn">수정</button>
          <button type="button" className="post-edit-cancel-btn" onClick={handleCancel}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
