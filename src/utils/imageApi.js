const sceneTypeFor = ({ word = "", meaning = "", prompt = "" }) => {
  const text = `${word} ${meaning} ${prompt}`.toLowerCase();
  if (/(car|bus|truck|train|vehicle|drive|road|transport|arrive)/.test(text)) return "vehicle";
  if (/(tree|plant|river|forest|water|environment|nature|grow|develop|danger)/.test(text)) return "nature";
  if (/(student|people|person|communicate|community|believe|accept|borrow|choice|success)/.test(text)) return "people";
  if (/(book|study|school|education|knowledge|academic|analyze|evaluate|idea|innovation|abstract)/.test(text)) return "study";
  return "memory";
};

const sceneMarkup = (type) => {
  if (type === "vehicle") {
    return `
      <rect x="0" y="690" width="1024" height="190" fill="#94a3b8"/>
      <rect x="0" y="742" width="1024" height="26" fill="#f8fafc" opacity=".9"/>
      <rect x="230" y="500" width="520" height="140" rx="48" fill="#2563eb"/>
      <path d="M330 500 L420 380 H610 L705 500 Z" fill="#60a5fa"/>
      <rect x="440" y="410" width="78" height="74" rx="12" fill="#dbeafe"/>
      <rect x="540" y="410" width="78" height="74" rx="12" fill="#dbeafe"/>
      <circle cx="345" cy="652" r="62" fill="#0f172a"/>
      <circle cx="345" cy="652" r="28" fill="#e2e8f0"/>
      <circle cx="640" cy="652" r="62" fill="#0f172a"/>
      <circle cx="640" cy="652" r="28" fill="#e2e8f0"/>
      <circle cx="758" cy="555" r="18" fill="#fde68a"/>`;
  }
  if (type === "nature") {
    return `
      <rect x="0" y="650" width="1024" height="260" fill="#86efac"/>
      <path d="M0 692 C180 620 320 735 500 675 C705 605 830 715 1024 650 V1024 H0 Z" fill="#22c55e" opacity=".75"/>
      <rect x="488" y="470" width="62" height="240" rx="28" fill="#92400e"/>
      <circle cx="520" cy="380" r="142" fill="#16a34a"/>
      <circle cx="430" cy="420" r="104" fill="#22c55e"/>
      <circle cx="620" cy="430" r="112" fill="#15803d"/>
      <path d="M0 800 C190 740 350 860 520 800 C700 735 865 850 1024 785 V1024 H0 Z" fill="#38bdf8" opacity=".72"/>
      <circle cx="810" cy="220" r="72" fill="#fde047"/>`;
  }
  if (type === "people") {
    return `
      <rect x="0" y="700" width="1024" height="210" fill="#fde68a"/>
      <circle cx="365" cy="360" r="70" fill="#f59e0b"/>
      <path d="M280 520 C300 450 430 450 452 520 L485 700 H250 Z" fill="#2563eb"/>
      <circle cx="660" cy="370" r="68" fill="#fbbf24"/>
      <path d="M585 525 C604 455 724 455 748 525 L790 700 H548 Z" fill="#10b981"/>
      <path d="M450 515 C525 468 585 468 660 515" stroke="#0f172a" stroke-width="24" fill="none" stroke-linecap="round"/>
      <circle cx="505" cy="462" r="18" fill="#0f172a"/>
      <circle cx="604" cy="462" r="18" fill="#0f172a"/>`;
  }
  if (type === "study") {
    return `
      <rect x="190" y="300" width="650" height="430" rx="42" fill="#ffffff" opacity=".9"/>
      <path d="M250 380 H498 C542 380 578 416 578 460 V705 H328 C285 705 250 670 250 627 Z" fill="#dbeafe"/>
      <path d="M578 460 C578 416 614 380 658 380 H774 V627 C774 670 739 705 696 705 H578 Z" fill="#bfdbfe"/>
      <path d="M578 458 V705" stroke="#1d4ed8" stroke-width="12"/>
      <circle cx="520" cy="230" r="70" fill="#facc15"/>
      <path d="M520 120 V70 M520 390 V340 M390 230 H340 M700 230 H650 M428 138 L394 104 M612 138 L646 104 M428 322 L394 356 M612 322 L646 356" stroke="#f59e0b" stroke-width="20" stroke-linecap="round"/>`;
  }
  return `
    <rect x="195" y="525" width="634" height="140" rx="70" fill="#bfdbfe"/>
    <path d="M275 525 C315 380 445 300 512 220 C580 300 710 380 750 525 Z" fill="#60a5fa"/>
    <circle cx="512" cy="260" r="72" fill="#fef3c7"/>
    <path d="M420 680 C455 760 570 790 615 680" stroke="#2563eb" stroke-width="34" fill="none" stroke-linecap="round"/>
    <circle cx="325" cy="410" r="58" fill="#10b981" opacity=".85"/>
    <circle cx="705" cy="410" r="58" fill="#f97316" opacity=".85"/>`;
};

const clientMockImage = ({ word = "", meaning = "", prompt = "" }) => {
  const type = sceneTypeFor({ word, meaning, prompt });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="visual vocabulary scene">
  <defs>
    <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="62%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="72" fill="url(#sky)"/>
  <circle cx="818" cy="180" r="98" fill="#2563eb" opacity=".1"/>
  <circle cx="195" cy="815" r="132" fill="#10b981" opacity=".12"/>
  ${sceneMarkup(type)}
</svg>`;

  return {
    status: "mock",
    imageUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
    cached: false,
    provider: "client-mock",
    model: "local-scene-svg",
    message: "本地 Vite 开发环境未启用 Vercel API，已使用无文字情景 mock 图片。",
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
