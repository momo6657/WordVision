const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const generateImage = async ({ word, meaning, prompt, config }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="55%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="72" fill="url(#bg)"/>
  <circle cx="806" cy="198" r="90" fill="#2563eb" opacity=".14"/>
  <circle cx="220" cy="820" r="130" fill="#10b981" opacity=".16"/>
  <rect x="140" y="184" width="744" height="656" rx="52" fill="#ffffff" opacity=".76"/>
  <text x="512" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="800" fill="#1e3a8a">${escapeXml(word.word)}</text>
  <text x="512" y="496" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#065f46">${escapeXml(meaning)}</text>
  <foreignObject x="214" y="560" width="596" height="160">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font: 28px Arial, sans-serif; color:#334155; line-height:1.45; text-align:center;">
      ${escapeXml(prompt)}
    </div>
  </foreignObject>
  <text x="512" y="780" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#2563eb">WordVision AI Visual Memory</text>
</svg>`;

  return {
    imageBytes: Buffer.from(svg),
    mimeType: "image/svg+xml",
    provider: "mock",
    model: config.model || "mock-svg",
    costTier: "free",
  };
};
