import { callTextModel, clampNumber, jsonError, jsonResponse } from "../_lib/ai/text.js";

const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));

const cleanText = (value, max = 500) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const isFictionalDebateScene = (scene) => /蝙蝠侠|超人|英雄|电影|大战|角色|动漫|漫画|剧情|宇宙|魔法|科幻/.test(String(scene || ""));

const makeLocalBackupDialogue = ({ scene, count }) => {
  const sceneText = cleanText(scene || "日常交流", 80);
  const isMarket = /买菜|菜市场|蔬菜|水果/.test(sceneText);
  const isRestaurant = /餐厅|点餐|饭店|咖啡/.test(sceneText);
  const isHero = /蝙蝠侠|超人|英雄|电影|大战/.test(sceneText);

  const lines = isMarket
    ? [
        ["Customer", "How much are these tomatoes today?", "今天这些西红柿多少钱？", "询问价格"],
        ["Vendor", "They are six yuan a jin, and they are very fresh.", "六元一斤，很新鲜。", "报价并说明新鲜度"],
        ["Customer", "Could you weigh two jin for me, please?", "请帮我称两斤好吗？", "礼貌提出购买数量"],
        ["Vendor", "Sure. Would you like a plastic bag?", "当然。你需要塑料袋吗？", "确认附加需求"],
        ["Customer", "No bag, thanks. Can I pay by QR code?", "不用袋子，谢谢。我可以扫码付款吗？", "表达支付方式"],
        ["Vendor", "Yes, please scan this code.", "可以，请扫这个码。", "完成交易"],
      ]
    : isRestaurant
      ? [
          ["Customer", "Could we see the menu, please?", "请问我们可以看一下菜单吗？", "请求菜单"],
          ["Waiter", "Of course. Today's special is grilled chicken.", "当然。今天的特色菜是烤鸡。", "推荐特色菜"],
          ["Customer", "That sounds good. We'd like one grilled chicken and a salad.", "听起来不错。我们要一份烤鸡和一份沙拉。", "点主菜和配菜"],
          ["Waiter", "Would you like anything to drink?", "你们想喝点什么吗？", "询问饮品"],
          ["Customer", "Just water, please. And could we have the bill later?", "清水就好。等会儿可以给我们账单吗？", "补充需求"],
          ["Waiter", "No problem. I'll bring your order soon.", "没问题。我马上给你们上菜。", "确认订单"],
        ]
      : isHero
        ? [
            ["Fan A", "Who do you think would win, Batman or Superman?", "你觉得蝙蝠侠和超人谁会赢？", "提出观点问题"],
            ["Fan B", "Superman is stronger, but Batman always has a plan.", "超人更强，但蝙蝠侠总有计划。", "对比人物优势"],
            ["Fan A", "True. Batman could use technology and strategy.", "没错。蝙蝠侠可以使用科技和策略。", "表达同意并补充理由"],
            ["Fan B", "But if Superman stops holding back, the fight changes quickly.", "但如果超人不再留手，战局会很快改变。", "使用条件句讨论结果"],
            ["Fan A", "So it depends on the rules of the fight.", "所以这取决于战斗规则。", "总结条件"],
            ["Fan B", "Exactly. That's why the debate is so interesting.", "正是如此。这就是这个争论有趣的原因。", "总结观点"],
          ]
        : [
            ["Learner", `I want to talk about ${sceneText} in English.`, `我想用英语谈论“${sceneText}”。`, "说明话题"],
            ["Partner", "Great. What is the most important thing in this situation?", "很好。这个情景中最重要的事情是什么？", "引导表达重点"],
            ["Learner", "I think clear communication is important.", "我认为清楚沟通很重要。", "表达观点"],
            ["Partner", "Can you give me a simple example?", "你能给我一个简单例子吗？", "要求举例"],
            ["Learner", "Sure. I would ask a question first and then explain what I need.", "当然。我会先提问，然后说明我需要什么。", "描述交流步骤"],
            ["Partner", "That sounds natural. Let's practice it again.", "听起来自然。我们再练一次吧。", "给出反馈"],
          ];

  return {
    title: `${sceneText}口语练习`,
    scene: sceneText,
    lines: lines.slice(0, count).map(([lineRole, sentence, translation, focus]) => ({ role: lineRole, sentence, translation, focus })),
    keyExpressions: ["How much are...?", "Could you...?", "I think...", "It depends on...", "That sounds..."],
    generatedBy: "local-backup",
  };
};

const normalizeDialogue = (generated, { scene, role, count }) => {
  if (!generated || typeof generated !== "object") throw new Error("文字 AI 未返回有效对话结构。");
  const lines = Array.isArray(generated.lines)
    ? generated.lines
        .map((line, index) => ({
          role: cleanText(line?.role || (index % 2 === 0 ? role : "Partner"), 40),
          sentence: cleanText(line?.sentence, 260),
          translation: cleanText(line?.translation, 260),
          focus: cleanText(line?.focus, 160),
        }))
        .filter((line) => line.sentence && line.translation && hasChinese(line.translation))
    : [];

  const uniqueSentences = new Set(lines.map((line) => line.sentence.toLowerCase()));
  if (lines.length < Math.min(4, count)) throw new Error("文字 AI 生成的对话轮次不足。");
  if (uniqueSentences.size < Math.min(4, lines.length)) throw new Error("文字 AI 生成的对话内容重复，未形成真实情景对话。");
  if (lines.some((line) => /Could you help me with this|step by step/i.test(line.sentence))) {
    throw new Error("文字 AI 返回了模板化对话，已拒绝展示。");
  }

  return {
    title: cleanText(generated.title || `${scene}口语对话`, 80),
    scene: cleanText(generated.scene || scene, 120),
    lines: lines.slice(0, count),
    keyExpressions: Array.isArray(generated.keyExpressions)
      ? generated.keyExpressions
          .map((item) => cleanText(typeof item === "string" ? item : item?.expression || item?.phrase || item?.sentence || "", 120))
          .filter(Boolean)
          .slice(0, 8)
      : [],
  };
};

const buildDialogueRequest = ({ scene, role, level, count, strict = false }) => ({
  system:
    "You are a practical spoken English dialogue generator for Chinese learners. Generate realistic, non-repetitive, task-specific dialogues. Return strict JSON only.",
  user: `Generate exactly ${count} realistic spoken English dialogue lines for this exact scene: ${scene}

Learner role: ${role}
Difficulty: ${level}
Turns: ${count}

Requirements:
- The dialogue must be specific to the scene, not generic help phrases.
- If the scene is fictional, cinematic, or unusual, treat it as a role-play discussion scene and still generate useful spoken English.
- Alternate roles naturally, for example Customer/Vendor for 买菜, Customer/Waiter for 餐厅点餐, Fan A/Fan B for movie or superhero debates.
- Every line must have natural English sentence, accurate Chinese translation, and a speaking focus.
- Lines must not repeat.
- Do not mix Chinese words into English sentences unless the target scene naturally requires a proper noun.
- Translation must be valid Simplified Chinese. You may encode Chinese as JSON unicode escapes like \\u8fd9\\u662f.
- Do not output garbled text or mojibake.
- Include 4-8 useful key expressions.
${strict ? "- Important: return exactly the requested number of lines. Do not return fewer lines for any reason." : ""}`,
  schemaHint: 'Schema: {"title":"","scene":"","lines":[{"role":"","sentence":"","translation":"","focus":""}],"keyExpressions":[""]}',
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { scene = "校园生活", role = "Learner", level = "中级", turns = 6 } = req.body || {};
  const count = clampNumber(turns, 4, 10, 6);

  try {
    if (isFictionalDebateScene(scene)) {
      const payload = makeLocalBackupDialogue({ scene, count });
      return jsonResponse(res, { dialogue: payload, warning: "该场景属于角色/影视讨论，已生成快速角色扮演口语练习。" });
    }

    let lastError = null;
    for (const strict of [false, true]) {
      try {
        const generated = await callTextModel(buildDialogueRequest({ scene, role, level, count, strict }));
        const payload = normalizeDialogue(generated, { scene, role, count });
        return jsonResponse(res, { dialogue: payload });
      } catch (error) {
        lastError = error;
      }
    }
    const payload = makeLocalBackupDialogue({ scene, count });
    if (payload.lines.length < Math.min(4, count)) throw lastError || new Error("备用对话生成失败。");
    return jsonResponse(res, { dialogue: payload });
  } catch (error) {
    return jsonError(res, 503, error.message || "口语对话生成失败：文字 AI 当前不可用，请检查模型额度或稍后重试。");
  }
}
