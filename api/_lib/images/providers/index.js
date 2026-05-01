import * as customProvider from "./custom.js";
import * as openAIProvider from "./openai.js";

const providers = {
  custom: customProvider,
  openai: openAIProvider,
};

export const getProvider = (name) => providers[name] || null;
