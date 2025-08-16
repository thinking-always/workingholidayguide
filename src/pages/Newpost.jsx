import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../utils/axios";
import "./Newpost.css";
import { CATEGORIES, CATEGORY_SLUGS } from "../constants/categories";
import { ensureLoggedIn } from "../utils/auth";

const Font = Quill.import("formats/font");
Font.whitelist = ["arial", "georgia", "tahoma", "courier"];
Quill.register(Font, true);

const Size = Quill.import("attributors/style/size");
Size.whitelist = ["10px","12px","14px","16px","18px","20px","22px","24px","26px","28px","30px"];
Quill.register(Size, true);

export default function NewPost() {
  const { category: paramCategory } = useParams();
  const navigate = useNavigate();

  const fixedCategory = CATEGORY_SLUGS.includes(paramCategory) ? paramCategory : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(fixedCategory ?? "basic");

  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const isTransformingRef = useRef(false);

  const modules = { toolbar: { container: "#editor-toolbar" } };
  const formats = [
    "bold","italic","underline","strike",
    "list","bullet","align",
    "link","image","code-block",
    "color","background","font","size"
  ];

  useEffect(() => {
    if (fixedCategory) setCategory(fixedCategory);
  }, [fixedCategory]);

  // 툴바 접근성 라벨링
  useEffect(() => {
    const toolbar = document.getElementById("editor-toolbar");
    if (!toolbar) return;
    const setTip = (sel, label) => {
      const el = toolbar.querySelector(sel);
      if (!el) return;
      el.setAttribute("title", label);
      el.setAttribute("aria-label", label);
      el.setAttribute("data-tooltip", label);
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

  // ★ data:image → 업로드 → URL+data-public-id로 치환
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

  function dataURLtoFile(dataUrl, filename = "image.png") {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  }

  function makeFileNameFromDataURL(dataUrl) {
    const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64/);
    const ext = mimeMatch ? mimeMatch[1].split("/")[1].replace("+xml", "") : "png";
    return `paste-${Date.now()}.${ext}`;
  }

  const handlePost = async (e) => {
    e.preventDefault();
    if (!ensureLoggedIn(navigate, "게시물 작성은 로그인 후 이용 가능합니다.")) return;

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력하세요.");
      return;
    }
    try {
      await api.post("/posts/", { title, content, category });
      alert("등록 성공!");
      navigate(fixedCategory ? `/${fixedCategory}` : "/");
    } catch (err) {
      alert("등록에 실패했습니다. " + (err?.response?.data?.detail || "오류"));
      alert("로그인해주세요");
      navigate("/login");
      console.log(err?.response?.data || err);
    }
  };

  return (
    <div className="newpost-container">
      <h2 className="newpost-title">새 게시물 작성</h2>

      {fixedCategory ? (
        <div style={{ marginBottom: 8 }}>
          <span style={{ display:"inline-block", padding:"6px 10px", borderRadius:8, background:"#eef3ff", color:"#3451d1", fontSize:14 }}>
            카테고리: {CATEGORIES[fixedCategory]} (자동 설정)
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "6px 8px" }}>
            {Object.entries(CATEGORIES).map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </div>
      )}

      <form className="newpost-form" onSubmit={handlePost}>
        {/* ⬇⬇⬇ 제목 + 툴바: sticky 영역 */}
        <div className="newpost-sticky-header">
          <input
            className="newpost-input"
            type="text"
            placeholder="제목을 입력하세요(최대 50자)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
          />

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
        </div>
        {/* ⬆⬆⬆ sticky 끝 */}

        <ReactQuill
          value={content}
          onChange={setContent}
          theme="snow"
          placeholder="내용을 입력하세요"
          modules={modules}
          formats={formats}
          className="newpost-editor"
        />

        {isConvertingImages && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            이미지 업로드 중… (잠시만요)
          </div>
        )}

        <button type="submit" className="newpost-submit-btn">등록하기</button>
      </form>
    </div>
  );
}
