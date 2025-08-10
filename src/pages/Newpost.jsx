import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../utils/axios";
import "./Newpost.css";

// ✅ 폰트 화이트리스트
const Font = Quill.import("formats/font");
Font.whitelist = ["arial", "georgia", "tahoma", "courier"];
Quill.register(Font, true);

// ✅ 사이즈 화이트리스트 (1px~20px 중 적당한 단계)
const Size = Quill.import("attributors/style/size");
Size.whitelist = [
  "10px", "12px", "14px", "16px", "18px",
  "20px", "22px", "24px", "26px", "28px", "30px"
];
Quill.register(Size, true);

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const modules = {
    toolbar: { container: "#editor-toolbar" },
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image",
    "code-block",
    "color",
    "background",
    "font",
    "size",
  ];

  // ✅ 툴팁 설정 (Heading 제거)
  useEffect(() => {
    const toolbar = document.getElementById("editor-toolbar");
    if (!toolbar) return;

    const setTip = (selector, label) => {
      const el = toolbar.querySelector(selector);
      if (!el) return;
      el.setAttribute("title", label);
      el.setAttribute("aria-label", label);
      el.setAttribute("data-tooltip", label);
    };

    setTip("select.ql-font", "폰트(Font): 본문 글꼴을 바꿉니다.");
    setTip("select.ql-size", "글자 크기(Size): px 단위로 변경");

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

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력하세요.");
      return;
    }
    try {
      await api.post("/posts/", { title, content });
      alert("등록 성공!");
      navigate("/");
    } catch (err) {
      alert("등록에 실패했습니다." + (err.response?.data?.detail || "오류"));
      console.log(err.response?.data);
    }
  };

  return (
    <div className="newpost-container">
      <h2 className="newpost-title">새 게시물 작성</h2>


      <form className="newpost-form" onSubmit={handlePost}>
        <input
          className="newpost-input"
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* ✅ 툴바 (Heading 제거, size px 단위) */}
        <div id="editor-toolbar" className="ql-custom-toolbar">
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

        <ReactQuill
          value={content}
          onChange={setContent}
          theme="snow"
          placeholder="내용을 입력하세요"
          modules={modules}
          formats={formats}
          className="newpost-editor"
        />

        <button type="submit" className="newpost-submit-btn">
          등록하기
        </button>
      </form>
    </div>
  );
}
