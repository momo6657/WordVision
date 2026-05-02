const postJSON = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "error") throw new Error(payload.message || `AI 请求失败：${response.status}`);
  return payload;
};

export const generateScene = (body) => postJSON("/api/ai/scene", body);
export const generateDialogue = (body) => postJSON("/api/ai/dialogue", body);
export const analyzeSentence = (body) => postJSON("/api/ai/sentence", body);
