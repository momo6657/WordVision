import { PNG } from "pngjs";

const WIDTH = 1024;
const HEIGHT = 1024;

const sceneTypeFor = ({ word, meaning, imagePrompt }) => {
  const text = `${word?.word || ""} ${meaning || ""} ${imagePrompt || ""}`.toLowerCase();
  if (/(pig|pork|hog|swine|猪|animal|dog|cat|bird|horse|fish|sheep|cow|rabbit)/.test(text)) return "animal";
  if (/(car|bus|truck|train|vehicle|drive|road|transport|arrive|汽车|车辆|火车)/.test(text)) return "vehicle";
  if (/(tree|plant|river|forest|water|environment|nature|grow|develop|danger|树|河|森林|环境)/.test(text)) return "nature";
  if (/(student|people|person|communicate|community|believe|accept|borrow|choice|success|人|学生|交流|社区)/.test(text)) return "people";
  if (/(book|study|school|education|knowledge|academic|analyze|evaluate|idea|innovation|abstract|书|学习|教育|知识)/.test(text)) return "study";
  return "memory";
};

const hex = (value) => {
  const clean = value.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16), 255];
};

const createCanvas = () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const top = hex("#dbeafe");
  const bottom = hex("#fef3c7");
  for (let y = 0; y < HEIGHT; y += 1) {
    const t = y / HEIGHT;
    const color = top.map((v, i) => Math.round(v * (1 - t) + bottom[i] * t));
    for (let x = 0; x < WIDTH; x += 1) {
      const idx = (WIDTH * y + x) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = 255;
    }
  }
  return png;
};

const setPixel = (png, x, y, color) => {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const idx = (WIDTH * y + x) << 2;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3] ?? 255;
};

const rect = (png, x, y, w, h, fill) => {
  const color = hex(fill);
  for (let yy = Math.max(0, y); yy < Math.min(HEIGHT, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(WIDTH, x + w); xx += 1) setPixel(png, xx, yy, color);
  }
};

const circle = (png, cx, cy, r, fill) => {
  const color = hex(fill);
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) setPixel(png, x, y, color);
    }
  }
};

const ellipse = (png, cx, cy, rx, ry, fill) => {
  const color = hex(fill);
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) setPixel(png, x, y, color);
    }
  }
};

const sceneBase = (png) => {
  circle(png, 825, 180, 82, "#fde047");
  rect(png, 0, 735, WIDTH, 170, "#a7f3d0");
};

const animalScene = (png) => {
  sceneBase(png);
  ellipse(png, 520, 555, 250, 150, "#f9a8d4");
  circle(png, 320, 500, 110, "#f9a8d4");
  circle(png, 285, 385, 46, "#f472b6");
  circle(png, 360, 392, 46, "#f472b6");
  ellipse(png, 265, 515, 48, 34, "#fb7185");
  circle(png, 252, 510, 8, "#7f1d1d");
  circle(png, 280, 510, 8, "#7f1d1d");
  circle(png, 340, 480, 12, "#111827");
  rect(png, 420, 680, 42, 92, "#f472b6");
  rect(png, 610, 680, 42, 92, "#f472b6");
  circle(png, 755, 520, 36, "#f472b6");
};

const vehicleScene = (png) => {
  rect(png, 0, 700, WIDTH, 170, "#94a3b8");
  rect(png, 0, 760, WIDTH, 24, "#f8fafc");
  rect(png, 240, 505, 520, 135, "#2563eb");
  rect(png, 360, 400, 250, 120, "#60a5fa");
  rect(png, 430, 430, 75, 65, "#dbeafe");
  rect(png, 525, 430, 75, 65, "#dbeafe");
  circle(png, 360, 655, 64, "#0f172a");
  circle(png, 360, 655, 28, "#e2e8f0");
  circle(png, 650, 655, 64, "#0f172a");
  circle(png, 650, 655, 28, "#e2e8f0");
  circle(png, 770, 560, 20, "#fde68a");
};

const natureScene = (png) => {
  sceneBase(png);
  rect(png, 475, 470, 70, 280, "#92400e");
  circle(png, 520, 350, 145, "#16a34a");
  circle(png, 405, 420, 108, "#22c55e");
  circle(png, 635, 430, 112, "#15803d");
  rect(png, 0, 805, WIDTH, 115, "#38bdf8");
};

const peopleScene = (png) => {
  sceneBase(png);
  circle(png, 365, 365, 70, "#f59e0b");
  ellipse(png, 365, 585, 125, 170, "#2563eb");
  circle(png, 660, 370, 68, "#fbbf24");
  ellipse(png, 660, 590, 120, 170, "#10b981");
  rect(png, 450, 505, 210, 35, "#0f172a");
  circle(png, 505, 462, 18, "#0f172a");
  circle(png, 604, 462, 18, "#0f172a");
};

const studyScene = (png) => {
  sceneBase(png);
  rect(png, 210, 330, 604, 380, "#ffffff");
  rect(png, 255, 390, 260, 300, "#dbeafe");
  rect(png, 515, 390, 255, 300, "#bfdbfe");
  rect(png, 505, 385, 18, 312, "#1d4ed8");
  circle(png, 520, 230, 78, "#facc15");
  circle(png, 520, 230, 34, "#fef3c7");
};

const memoryScene = (png) => {
  sceneBase(png);
  ellipse(png, 512, 580, 310, 120, "#bfdbfe");
  ellipse(png, 512, 440, 210, 230, "#60a5fa");
  circle(png, 512, 260, 76, "#fef3c7");
  circle(png, 325, 410, 58, "#10b981");
  circle(png, 705, 410, 58, "#f97316");
};

const drawScene = (png, type) => {
  if (type === "animal") return animalScene(png);
  if (type === "vehicle") return vehicleScene(png);
  if (type === "nature") return natureScene(png);
  if (type === "people") return peopleScene(png);
  if (type === "study") return studyScene(png);
  return memoryScene(png);
};

export const generateImage = async ({ word, meaning, config }) => {
  const png = createCanvas();
  const type = sceneTypeFor({ word, meaning, imagePrompt: word?.imagePrompt || word?.memoryTip || "" });
  drawScene(png, type);

  return {
    imageBytes: PNG.sync.write(png),
    mimeType: "image/png",
    provider: "mock",
    model: config.model || "mock-anime-png",
    costTier: "free",
  };
};
