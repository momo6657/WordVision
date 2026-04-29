import * as customProvider from "./custom.js";
import * as mockProvider from "./mock.js";
import * as openAIProvider from "./openai.js";

const providers = {
  custom: customProvider,
  mock: mockProvider,
  openai: openAIProvider,
};

export const getProvider = (name) => providers[name] || providers.mock;
