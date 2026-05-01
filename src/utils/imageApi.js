export const generateWordImage = async ({ bookId, wordId, force = false }) => {
  let response;
  try {
    response = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, wordId, force }),
    });
  } catch {
    throw new Error("当前环境没有可用的服务端图片 API。请部署到 Vercel 并配置真实 AI 图片 API Key。");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "error") {
    throw new Error(payload.message || `图片生成失败：${response.status}`);
  }
  return payload;
};
