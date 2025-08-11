// src/pages/PostEdit.jsx
import { useEffect, useRef, useState } from "react";
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
  const [content, setContent] = useState(""); // HTML
  const [loading, setLoading] = useState(true);

  // 이미지 변환 진행표시 + 루프 가드
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const isTransformingRef = useRef(false);

  // ✅ 툴바 구성 (Heading 제거, size는 px 단위)
  const modules = { toolbar: { container: "#editor-toolbar-edit" } };

  // ✅ 허용 포맷
  const formats = [
    "bold", "italic", "underline", "strike",
    "list", "bullet", "align",
    "link", "image", "code-block",
    "color", "background",
    "font", "size",
  ];

  useEffect(() => {
    api.get(`/posts/${id}/`)
      .then((res) => {
        setTitle(res.data.title ?? "");
        setContent(res.data.content ?? "");
      })
      .catch((err) => {
        console.error("불러오기 실패", err);
        alert("글을 찾을 수 없습니다.");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // ✅ 툴바 버튼/셀렉트 툴팁
  useEffect(() => {
    const toolbar = document.getElementById("editor-toolbar-edit");
    if (!toolbar) return;
    const tip = (sel, label) => {
      const el = toolbar.querySelector(sel);
      if (!el) return;
      el.setAttribute("title", label);
      el.setAttribute("aria-label", label);
      el.setAttribute("data-tooltip", label);
    };
    tip("select.ql-font", "폰트(Font): 본문 글꼴 변경");
    tip("select.ql-size", "글자 크기(Size): px 단위");
    tip("button.ql-bold", "굵게(Bold)");
    tip("button.ql-italic", "기울임(Italic)");
    tip("button.ql-underline", "밑줄(Underline)");
    tip("button.ql-strike", "취소선(Strikethrough)");
    tip("select.ql-color", "글자 색(Color)");
    tip("select.ql-background", "배경 색(Highlight)");
    tip("button.ql-list[value='ordered']", "번호 목록");
    tip("button.ql-list[value='bullet']", "점 목록");
    tip("select.ql-align", "정렬");
    tip("button.ql-link", "링크");
    tip("button.ql-image", "이미지");
    tip("button.ql-code-block", "코드 블록");
    tip("button.ql-clean", "서식 제거");
  }, []);

  // ========= ★ 핵심: data:image → 업로드 → URL(+data-public-id) 치환 =========
  useEffect(() => {
    if (isTransformingRef.current) return;
    if (!content || !content.includes("data:image")) return;

    const run = async () => {
      isTransformingRef.current = true;
      setIsConvertingImages(true);
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const imgs = Array.from(doc.querySelectorAll("img[src^='data:image']"));
        if (!imgs.length) return;

        const apiOrigin = (() => {
          try { return new URL(api.defaults.baseURL).origin; }
          catch { return window.location.origin; }
        })();

        for (const img of imgs) {
          const dataUrl = img.getAttribute("src");
          try {
            const file = dataURLtoFile(dataUrl, makeFileNameFromDataURL(dataUrl));
            const form = new FormData();
            form.append("image", file);

            const res = await api.post("/uploads/images/", form, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            const { url: rawUrl, public_id } = res.data || {};
            const finalUrl = rawUrl?.startsWith("/") ? (apiOrigin + rawUrl) : rawUrl;

            if (finalUrl) {
              img.setAttribute("src", finalUrl);
              if (public_id) img.setAttribute("data-public-id", public_id);
            }
          } catch (e) {
            console.error("이미지 업로드 실패:", e);
          }
        }

        const newHtml = doc.body.innerHTML;
        if (newHtml !== content) setContent(newHtml);
      } finally {
        setIsConvertingImages(false);
        isTransformingRef.current = false;
      }
    };

    run();
  }, [content]);
  // ========= ★ 끝 =========

  // helpers
  function dataURLtoFile(dataUrl, filename = "image.png") {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }
  function makeFileNameFromDataURL(dataUrl) {
    const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64/);
    const ext = mimeMatch ? mimeMatch[1].split("/")[1].replace("+xml", "") : "png";
    return `paste-${Date.now()}.${ext}`;
  }

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

  if (loading) return <div className="post-edit-container">불러오는 중…</div>;

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

        {/* ✅ 커스텀 툴바 */}
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

        <ReactQuill
          value={content}
          onChange={setContent}
          theme="snow"
          placeholder="내용을 입력하세요"
          modules={modules}
          formats={formats}
          className="post-edit-editor"
        />

        {isConvertingImages && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            이미지 업로드 중… (잠시만요)
          </div>
        )}

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
