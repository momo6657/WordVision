const escapeXml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const clientMockImage = ({ word = "", meaning = "", prompt = "" }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#dcfce7"/></linearGradient></defs>
  <rect width="1024" height="1024" rx="72" fill="url(#bg)"/>
  <rect x="150" y="210" width="724" height="604" rx="56" fill="#fff" opacity=".82"/>
  <text x="512" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="92" font-weight="800" fill="#1d4ed8">${escapeXml(word)}</text>
  <text x="512" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#047857">${escapeXml(meaning)}</text>
  <foreignObject x="220" y="575" width="584" height="150"><div xmlns="http://www.w3.org/1999/xhtml" style="font:28px Arial,sans-serif;color:#334155;line-height:1.45;text-align:center;">${escapeXml(prompt)}</div></foreignObject>
</svg>`;

  return {
    status: "mock",
    imageUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
    cached: false,
    provider: "client-mock",
    model: "local-svg",
    message: "本地 Vite 开发环境未启用 Vercel API，已使用客户端 mock 图片。",
  };
};

export const generateWordImage = async ({ bookId, wordId, force = false, word = "", meaning = "", prompt = "" }) => {
  try {
    const response = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, wordId, force }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status === "error") {
      if (response.status === 404) return clientMockImage({ word, meaning, prompt });
      throw new Error(payload.message || `图片生成失败：${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error instanceof TypeError) return clientMockImage({ word, meaning, prompt });
    throw error;
  }
};
