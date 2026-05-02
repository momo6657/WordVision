const IMAGE_API_PATH = "/api/images/generate";
const PROD_API_BASE_URL = import.meta.env.VITE_IMAGE_API_BASE_URL || "https://wordvision.vercel.app";
const inFlightRequests = new Map();

const postImageRequest = async (url, { bookId, wordId, force }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, wordId, force }),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
};

const shouldRetryProductionApi = (response, payload) => {
  if (!import.meta.env.DEV) return false;
  if (response.status === 404 || response.status === 405) return true;
  return response.ok && (!payload?.status || !payload?.imageUrl);
};

const requestImage = async ({ bookId, wordId, force }) => {
  try {
    let result = await postImageRequest(IMAGE_API_PATH, { bookId, wordId, force });
    if (shouldRetryProductionApi(result.response, result.payload)) {
      result = await postImageRequest(`${PROD_API_BASE_URL}${IMAGE_API_PATH}`, { bookId, wordId, force });
    }

    const { response, payload } = result;
    if (!response.ok || payload.status === "error") {
      throw new Error(payload.message || `图片生成失败：${response.status}`);
    }
    if (!payload.imageUrl) {
      throw new Error("图片 API 未返回可显示的图片地址。");
    }
    return payload;
  } catch (error) {
    if (import.meta.env.DEV) {
      const result = await postImageRequest(`${PROD_API_BASE_URL}${IMAGE_API_PATH}`, { bookId, wordId, force });
      if (!result.response.ok || result.payload.status === "error") {
        throw new Error(result.payload.message || `图片生成失败：${result.response.status}`);
      }
      if (!result.payload.imageUrl) throw new Error("图片 API 未返回可显示的图片地址。");
      return result.payload;
    }

    throw new Error(error.message || "当前环境没有可用的服务端图片 API。请部署到 Vercel 并配置真实 AI 图片 API Key。");
  }
};

export const generateWordImage = ({ bookId, wordId, force = false }) => {
  const key = `${bookId}:${wordId}:${force ? "force" : "normal"}`;
  if (!force && inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = requestImage({ bookId, wordId, force }).finally(() => {
    inFlightRequests.delete(key);
  });

  if (!force) inFlightRequests.set(key, promise);
  return promise;
};
