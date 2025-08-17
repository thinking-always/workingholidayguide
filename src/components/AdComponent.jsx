// src/components/AdComponent.jsx
import { useEffect } from "react";

export default function AdComponent() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
      style={{ display: "block", width: "100%", minHeight: "250px" }}
      data-ad-client="ca-pub-6741242179376111"
      data-ad-slot="1234567890"   // 👉 AdSense 관리자에서 발급받은 슬롯 ID
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  );
}
