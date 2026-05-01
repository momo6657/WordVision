const sceneTypeFor = ({ word = "", meaning = "", prompt = "" }) => {
  const text = `${word} ${meaning} ${prompt}`.toLowerCase();
  if (/(pig|pork|hog|swine|猪|animal|dog|cat|bird|horse|fish|sheep|cow|rabbit)/.test(text)) return "animal";
  if (/(car|bus|truck|train|vehicle|drive|road|transport|arrive|汽车|车辆|火车)/.test(text)) return "vehicle";
  if (/(tree|plant|river|forest|water|environment|nature|grow|develop|danger|树|河|森林|环境)/.test(text)) return "nature";
  if (/(student|people|person|communicate|community|believe|accept|borrow|choice|success|人|学生|交流|社区)/.test(text)) return "people";
  if (/(book|study|school|education|knowledge|academic|analyze|evaluate|idea|innovation|abstract|书|学习|教育|知识)/.test(text)) return "study";
  return "memory";
};

const drawClientScene = (ctx, type) => {
  const circle = (x, y, r, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const ellipse = (x, y, rx, ry, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const rect = (x, y, w, h, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  };

  circle(825, 180, 82, "#fde047");
  rect(0, 735, 1024, 170, "#a7f3d0");

  if (type === "animal") {
    ellipse(520, 555, 250, 150, "#f9a8d4");
    circle(320, 500, 110, "#f9a8d4");
    circle(285, 385, 46, "#f472b6");
    circle(360, 392, 46, "#f472b6");
    ellipse(265, 515, 48, 34, "#fb7185");
    circle(252, 510, 8, "#7f1d1d");
    circle(280, 510, 8, "#7f1d1d");
    circle(340, 480, 12, "#111827");
    rect(420, 680, 42, 92, "#f472b6");
    rect(610, 680, 42, 92, "#f472b6");
    circle(755, 520, 36, "#f472b6");
    return;
  }

  if (type === "vehicle") {
    rect(0, 700, 1024, 170, "#94a3b8");
    rect(0, 760, 1024, 24, "#f8fafc");
    rect(240, 505, 520, 135, "#2563eb");
    rect(360, 400, 250, 120, "#60a5fa");
    rect(430, 430, 75, 65, "#dbeafe");
    rect(525, 430, 75, 65, "#dbeafe");
    circle(360, 655, 64, "#0f172a");
    circle(360, 655, 28, "#e2e8f0");
    circle(650, 655, 64, "#0f172a");
    circle(650, 655, 28, "#e2e8f0");
    circle(770, 560, 20, "#fde68a");
    return;
  }

  if (type === "nature") {
    rect(475, 470, 70, 280, "#92400e");
    circle(520, 350, 145, "#16a34a");
    circle(405, 420, 108, "#22c55e");
    circle(635, 430, 112, "#15803d");
    rect(0, 805, 1024, 115, "#38bdf8");
    return;
  }

  if (type === "people") {
    circle(365, 365, 70, "#f59e0b");
    ellipse(365, 585, 125, 170, "#2563eb");
    circle(660, 370, 68, "#fbbf24");
    ellipse(660, 590, 120, 170, "#10b981");
    rect(450, 505, 210, 35, "#0f172a");
    circle(505, 462, 18, "#0f172a");
    circle(604, 462, 18, "#0f172a");
    return;
  }

  if (type === "study") {
    rect(210, 330, 604, 380, "#ffffff");
    rect(255, 390, 260, 300, "#dbeafe");
    rect(515, 390, 255, 300, "#bfdbfe");
    rect(505, 385, 18, 312, "#1d4ed8");
    circle(520, 230, 78, "#facc15");
    circle(520, 230, 34, "#fef3c7");
    return;
  }

  ellipse(512, 580, 310, 120, "#bfdbfe");
  ellipse(512, 440, 210, 230, "#60a5fa");
  circle(512, 260, 76, "#fef3c7");
  circle(325, 410, 58, "#10b981");
  circle(705, 410, 58, "#f97316");
};

const clientMockImage = ({ word = "", meaning = "", prompt = "" }) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, "#dbeafe");
  gradient.addColorStop(0.62, "#ecfdf5");
  gradient.addColorStop(1, "#fef3c7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  drawClientScene(ctx, sceneTypeFor({ word, meaning, prompt }));

  return {
    status: "mock",
    imageUrl: canvas.toDataURL("image/png"),
    cached: false,
    provider: "client-mock",
    model: "local-anime-png",
    message: "本地 Vite 开发环境未启用 Vercel API，已使用 PNG 情景图片。",
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
