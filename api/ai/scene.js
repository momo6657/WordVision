import { callTextModel, clampNumber, jsonResponse } from "../_lib/ai/text.js";

const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));

const cleanText = (value, max = 600) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const word = (word, meaning, example, exampleCn, memoryTip, tags = []) => ({
  word,
  meaning,
  phonetic: "",
  example,
  exampleCn,
  memoryTip,
  tags,
});

const scenePacks = [
  {
    match: /餐厅|点餐|饭店|咖啡|菜单|吃饭/,
    title: "餐厅点餐",
    description: "在餐厅入座、查看菜单、询问推荐菜、下单并结账的真实英语交流情景。",
    scenePrompt:
      "A realistic modern restaurant scene with a customer reading a menu, a waiter taking an order, dishes on the table, warm natural lighting, no text, no labels, no watermarks.",
    words: [
      word("menu", "菜单", "Could I have the menu, please?", "请给我菜单，好吗？", "点餐前通常先要 menu，把它和服务员递菜单的画面联系起来。", ["restaurant"]),
      word("reservation", "预约；预订", "We have a reservation for two at seven.", "我们预订了七点的两人位。", "reservation 常用于餐厅、酒店、机票等预订。", ["restaurant"]),
      word("recommend", "推荐", "What dish do you recommend today?", "你今天推荐哪道菜？", "让服务员推荐菜时常用 recommend。", ["restaurant"]),
      word("appetizer", "开胃菜；前菜", "We ordered a salad as an appetizer.", "我们点了一份沙拉作为前菜。", "appetizer 是正餐前先上的小菜。", ["restaurant"]),
      word("main course", "主菜", "The steak is my main course.", "牛排是我的主菜。", "main course 是一餐中最主要的一道菜。", ["restaurant"]),
      word("side dish", "配菜", "Does this meal come with a side dish?", "这份餐配配菜吗？", "side dish 是陪衬主菜的小菜。", ["restaurant"]),
      word("allergy", "过敏", "I have a peanut allergy.", "我对花生过敏。", "点餐时说明 allergy 可以避免食物风险。", ["restaurant"]),
      word("bill", "账单", "Could we have the bill, please?", "请把账单给我们好吗？", "吃完饭要结账时说 bill。", ["restaurant"]),
      word("split the bill", "分摊账单；AA 制", "Let's split the bill.", "我们 AA 制吧。", "split 是分开，split the bill 就是分账。", ["restaurant"]),
      word("tip", "小费", "The tip is included in the bill.", "小费已经包含在账单里了。", "在餐厅语境里 tip 常表示给服务员的小费。", ["restaurant"]),
      word("takeaway", "外带食物", "Can I order this as takeaway?", "这个可以外带吗？", "takeaway 是把食物带走，不在店里吃。", ["restaurant"]),
      word("serve", "端上；服务", "They serve breakfast until ten.", "他们供应早餐到十点。", "餐厅里 serve 常表示供应食物或服务顾客。", ["restaurant"]),
    ],
  },
  {
    match: /买菜|菜市场|蔬菜|水果|超市|摊/,
    title: "菜市场买菜",
    description: "在菜市场挑选新鲜蔬菜水果、询价、称重、扫码付款的真实生活情景。",
    scenePrompt:
      "A realistic open-air vegetable market with a shopper choosing fresh vegetables, a vendor weighing produce on a scale, baskets of fruit, natural daylight, no text, no labels, no watermarks.",
    words: [
      word("vegetable stall", "蔬菜摊", "The vegetable stall sells fresh tomatoes.", "这个蔬菜摊卖新鲜番茄。", "stall 是摊位，vegetable stall 就是菜摊。", ["market"]),
      word("fresh", "新鲜的", "These cucumbers look very fresh.", "这些黄瓜看起来很新鲜。", "买菜最常问食材是否 fresh。", ["market"]),
      word("ripe", "成熟的", "Is this mango ripe enough to eat today?", "这个芒果今天吃够熟了吗？", "ripe 常用于水果成熟。", ["market"]),
      word("weigh", "称重", "Could you weigh these apples?", "请帮我称一下这些苹果好吗？", "weigh 表示把东西放到秤上称重量。", ["market"]),
      word("price", "价格", "What's the price per kilo?", "每公斤多少钱？", "price 是询价时的核心词。", ["market"]),
      word("discount", "折扣", "Can you give me a small discount?", "能给我便宜一点吗？", "discount 表示降价或折扣。", ["market"]),
      word("cash", "现金", "Do you accept cash?", "你们收现金吗？", "cash 和扫码支付、刷卡相对。", ["market"]),
      word("QR code", "二维码", "I paid by scanning the QR code.", "我扫二维码付款了。", "QR code 是移动支付场景里的二维码。", ["market"]),
      word("plastic bag", "塑料袋", "Do you need a plastic bag?", "你需要塑料袋吗？", "买菜装东西常用 plastic bag。", ["market"]),
      word("bunch", "一把；一束", "I bought a bunch of green onions.", "我买了一把葱。", "bunch 常表示一捆、一束植物。", ["market"]),
      word("vendor", "摊主；小贩", "The vendor helped me choose ripe peaches.", "摊主帮我挑了熟桃子。", "vendor 是卖东西的人。", ["market"]),
      word("change", "零钱；找零", "Keep the change.", "零钱不用找了。", "购物付款后 change 可表示找回的钱。", ["market"]),
    ],
  },
  {
    match: /课堂|提问|上课|老师|学生/,
    title: "课堂提问",
    description: "学生在课堂上举手提问、老师解释知识点、同学做笔记的学习情景。",
    scenePrompt:
      "A realistic classroom scene with a student raising a hand, a teacher explaining at the front, classmates taking notes, bright daylight, no text on the board, no labels, no watermarks.",
    words: [
      word("raise a hand", "举手", "Please raise your hand before asking a question.", "提问前请先举手。", "课堂上举手发言就是 raise a hand。", ["classroom"]),
      word("question", "问题", "I have a question about this paragraph.", "我对这一段有个问题。", "question 是课堂互动最常见的词。", ["classroom"]),
      word("explain", "解释", "Could you explain the answer again?", "您能再解释一下答案吗？", "老师讲清楚某个点时用 explain。", ["classroom"]),
      word("example", "例子", "Can you give us another example?", "您能再给我们一个例子吗？", "example 能帮助理解抽象知识。", ["classroom"]),
      word("note", "笔记", "I wrote the grammar rule in my notes.", "我把语法规则写进了笔记。", "note 在学习中常指课堂笔记。", ["classroom"]),
      word("assignment", "作业；任务", "The assignment is due on Friday.", "这项作业周五截止。", "assignment 是老师布置的任务。", ["classroom"]),
      word("discuss", "讨论", "We discussed the topic in pairs.", "我们两人一组讨论了这个话题。", "discuss 是课堂合作学习常用词。", ["classroom"]),
      word("understand", "理解", "I don't understand this sentence.", "我不理解这个句子。", "不懂时可以直接用 understand 表达。", ["classroom"]),
      word("review", "复习", "Let's review yesterday's lesson.", "我们复习一下昨天的课。", "review 表示回顾、复习。", ["classroom"]),
      word("presentation", "展示；演讲", "Our group will give a presentation tomorrow.", "我们小组明天要做展示。", "presentation 是课堂展示或演讲。", ["classroom"]),
    ],
  },
  {
    match: /旅行|问路|路线|地铁|机场|酒店/,
    title: "旅行问路",
    description: "旅行途中向路人询问方向、确认交通方式、寻找目的地的交流情景。",
    scenePrompt:
      "A realistic travel street scene with a tourist holding a map and asking a passerby for directions near a subway entrance, city background, no text, no labels, no watermarks.",
    words: [
      word("direction", "方向；路线", "Could you give me directions to the museum?", "你能告诉我去博物馆的路线吗？", "问路时 direction 常用复数 directions。", ["travel"]),
      word("subway", "地铁", "Is there a subway station nearby?", "附近有地铁站吗？", "城市出行常用 subway。", ["travel"]),
      word("transfer", "换乘", "You need to transfer at the next station.", "你需要在下一站换乘。", "transfer 表示从一条线路换到另一条。", ["travel"]),
      word("intersection", "十字路口", "Turn left at the next intersection.", "在下一个十字路口左转。", "intersection 是道路交叉处。", ["travel"]),
      word("landmark", "地标", "The tower is a famous landmark.", "这座塔是著名地标。", "landmark 能帮助确认位置。", ["travel"]),
      word("nearby", "在附近", "Is the hotel nearby?", "酒店在附近吗？", "nearby 表示距离不远。", ["travel"]),
      word("straight ahead", "一直往前", "Go straight ahead for two blocks.", "一直往前走两个街区。", "问路时 straight ahead 很常见。", ["travel"]),
      word("entrance", "入口", "The entrance is on your right.", "入口在你的右边。", "entrance 和出口 exit 相对。", ["travel"]),
      word("platform", "站台", "Which platform should I use?", "我该去哪个站台？", "火车或地铁候车区域叫 platform。", ["travel"]),
      word("destination", "目的地", "Our destination is the old town.", "我们的目的地是老城区。", "destination 是要到达的地方。", ["travel"]),
    ],
  },
  {
    match: /天气|下雨|晴天|交流|气温/,
    title: "天气交流",
    description: "围绕天气、温度、降雨、穿衣建议和出行安排进行日常交流。",
    scenePrompt:
      "A realistic city park scene showing changing weather, people with umbrellas and jackets under a cloudy sky, natural lighting, no text, no labels, no watermarks.",
    words: [
      word("forecast", "天气预报", "The forecast says it will rain tonight.", "天气预报说今晚会下雨。", "forecast 是提前预测天气。", ["weather"]),
      word("temperature", "温度", "The temperature will drop tomorrow.", "明天气温会下降。", "temperature 是谈天气的基础词。", ["weather"]),
      word("humid", "潮湿的", "It feels humid after the rain.", "雨后感觉很潮湿。", "humid 常形容空气湿度高。", ["weather"]),
      word("shower", "阵雨", "There may be a shower in the afternoon.", "下午可能有阵雨。", "shower 在天气里是短时间降雨。", ["weather"]),
      word("windy", "有风的", "It's too windy to ride a bike.", "风太大，不适合骑车。", "windy 表示风很明显。", ["weather"]),
      word("sunny", "晴朗的", "It will be sunny this weekend.", "这个周末会是晴天。", "sunny 和太阳、晴天画面相连。", ["weather"]),
      word("cloudy", "多云的", "The sky is cloudy but it isn't raining.", "天空多云，但没有下雨。", "cloudy 表示云多。", ["weather"]),
      word("umbrella", "雨伞", "Don't forget your umbrella.", "别忘了带伞。", "下雨出门最容易想到 umbrella。", ["weather"]),
      word("jacket", "夹克；外套", "You should wear a light jacket.", "你应该穿一件薄外套。", "气温变化时常提到 jacket。", ["weather"]),
      word("degree", "度", "It is only ten degrees outside.", "外面只有十度。", "degree 用来表达温度数值。", ["weather"]),
    ],
  },
  {
    match: /快递|柜|包裹|取件|物流/,
    title: "快递柜取件",
    description: "收到取件通知后，在小区快递柜输入取件码、打开柜门并取出包裹的情景。",
    scenePrompt:
      "A realistic residential parcel locker scene with a person collecting a package from an open locker, smartphone in hand, clean apartment lobby, no text, no labels, no watermarks.",
    words: [
      word("parcel", "包裹", "Your parcel has arrived.", "你的包裹到了。", "parcel 是快递包裹。", ["delivery"]),
      word("locker", "储物柜；快递柜", "The parcel is in locker number five.", "包裹在五号柜里。", "locker 表示可锁住的小柜子。", ["delivery"]),
      word("pickup code", "取件码", "Enter the pickup code to open the locker.", "输入取件码打开快递柜。", "pickup code 是取快递时用的编码。", ["delivery"]),
      word("delivery", "配送；投递", "The delivery was faster than expected.", "这次配送比预期更快。", "delivery 是快递配送过程。", ["delivery"]),
      word("courier", "快递员", "The courier left the parcel in the locker.", "快递员把包裹放在快递柜里了。", "courier 是负责送件的人。", ["delivery"]),
      word("notification", "通知", "I received a pickup notification.", "我收到了取件通知。", "手机提醒就是 notification。", ["delivery"]),
      word("scan", "扫描", "Scan the code on the screen.", "扫描屏幕上的二维码。", "scan 常用于扫码。", ["delivery"]),
      word("recipient", "收件人", "Please confirm the recipient's phone number.", "请确认收件人的手机号。", "recipient 是接收包裹的人。", ["delivery"]),
      word("package", "包裹", "The package is quite heavy.", "这个包裹挺重。", "package 是更常见的包裹说法。", ["delivery"]),
      word("confirm", "确认", "Confirm your pickup before leaving.", "离开前确认已取件。", "confirm 表示核对并确认。", ["delivery"]),
    ],
  },
];

const genericWords = [
  word("request", "请求；要求", "I made a polite request in this situation.", "我在这个情景中提出了礼貌请求。", "request 用于表达正式或礼貌的请求。", ["daily"]),
  word("respond", "回应", "She responded clearly and kindly.", "她清楚而友好地回应了。", "respond 是对别人话语或行动做出回应。", ["daily"]),
  word("confirm", "确认", "Let me confirm the details first.", "让我先确认一下细节。", "confirm 能让沟通更准确。", ["daily"]),
  word("suggest", "建议", "He suggested a better choice.", "他建议了一个更好的选择。", "suggest 常用于提出方案。", ["daily"]),
  word("detail", "细节", "Pay attention to the important details.", "注意重要细节。", "detail 是理解情景的关键小信息。", ["daily"]),
  word("prepare", "准备", "We prepared everything before leaving.", "我们出发前准备好了一切。", "prepare 和行动前的准备画面相连。", ["daily"]),
  word("choice", "选择", "This choice is more convenient.", "这个选择更方便。", "choice 表示可选方案。", ["daily"]),
  word("helpful", "有帮助的", "The explanation was very helpful.", "这个解释很有帮助。", "helpful 形容能解决问题的人或信息。", ["daily"]),
  word("available", "可用的；有空的", "Is this option available today?", "这个选项今天可用吗？", "available 表示某物可获得或某人有空。", ["daily"]),
  word("schedule", "日程；安排", "The schedule changed this morning.", "今天早上日程变了。", "schedule 和计划表、时间安排有关。", ["daily"]),
  word("location", "地点；位置", "The location is easy to find.", "这个地点很容易找到。", "location 表示事情发生或要到达的位置。", ["daily"]),
  word("arrange", "安排", "Can we arrange a time to meet?", "我们能安排一个见面时间吗？", "arrange 常用于安排时间、活动或计划。", ["daily"]),
  word("option", "选项", "This option saves more time.", "这个选项更省时间。", "option 强调可选择的一种方案。", ["daily"]),
  word("notice", "注意到；通知", "I noticed a small change in the plan.", "我注意到计划有个小变化。", "notice 可表示看见细节，也可表示通知。", ["daily"]),
  word("polite", "礼貌的", "A polite question makes communication easier.", "礼貌提问会让沟通更顺畅。", "polite 和得体交流联系紧密。", ["daily"]),
  word("solve", "解决", "We solved the problem together.", "我们一起解决了这个问题。", "solve 常用于解决问题或困难。", ["daily"]),
  word("explain", "解释", "Please explain the situation clearly.", "请把情况解释清楚。", "explain 是把不清楚的事说清楚。", ["daily"]),
  word("compare", "比较", "Compare the two choices before deciding.", "决定前比较这两个选择。", "compare 表示找出相同点和不同点。", ["daily"]),
  word("important", "重要的", "This is an important detail.", "这是一个重要细节。", "important 提醒你关注核心信息。", ["daily"]),
  word("comfortable", "舒适的；自在的", "I feel comfortable speaking in this situation.", "在这个情景里说英语我感觉更自在。", "comfortable 可以形容环境舒适，也可形容心理放松。", ["daily"]),
];

const makeLocalSceneBackup = ({ scene, count }) => {
  const sceneText = cleanText(scene || "日常生活", 80);
  const pack = scenePacks.find((item) => item.match.test(sceneText)) || {
    title: `${sceneText}情景`,
    description: `围绕“${sceneText}”整理的实用英语情景词汇，可先用于学习和口语练习。`,
    scenePrompt: `A realistic everyday learning scene about ${sceneText}, with people interacting naturally, clear objects and actions, natural lighting, no text, no labels, no watermarks.`,
    words: genericWords,
  };
  const words = [...pack.words];
  while (words.length < count) words.push(genericWords[words.length % genericWords.length]);
  return {
    title: pack.title,
    description: pack.description,
    scenePrompt: pack.scenePrompt,
    words: words.slice(0, count).map((item) => ({
      ...item,
      scene: pack.title,
      tags: Array.from(new Set([pack.title, ...(item.tags || [])])),
    })),
    generatedBy: "local-backup",
  };
};

const normalizeScene = (generated, { scene, count }) => {
  if (!generated || typeof generated !== "object") throw new Error("文字 AI 未返回有效情景结构。");
  const words = Array.isArray(generated.words)
    ? generated.words
        .map((word) => ({
          word: cleanText(word?.word, 80),
          meaning: cleanText(word?.meaning, 160),
          phonetic: cleanText(word?.phonetic, 80),
          example: cleanText(word?.example, 260),
          exampleCn: cleanText(word?.exampleCn, 260),
          memoryTip: cleanText(word?.memoryTip, 260),
          scene: cleanText(word?.scene || generated.title || scene, 120),
          tags: Array.isArray(word?.tags) ? word.tags.map((tag) => cleanText(tag, 40)).filter(Boolean).slice(0, 6) : [scene],
        }))
        .filter((word) => word.word && word.meaning && hasChinese(word.meaning) && word.example && word.exampleCn && hasChinese(word.exampleCn))
    : [];

  const uniqueWords = new Set(words.map((word) => word.word.toLowerCase()));
  if (words.length < Math.min(8, count)) throw new Error("文字 AI 生成的情景词汇数量不足。");
  if (uniqueWords.size < words.length) throw new Error("文字 AI 生成的情景词汇存在重复。");
  if (words.some((word) => /场景含义|I use ".+" in the/i.test(`${word.meaning} ${word.example}`))) {
    throw new Error("文字 AI 返回了模板化词汇，已拒绝展示。");
  }

  const title = cleanText(generated.title || scene, 100);
  const description = cleanText(generated.description, 360);
  const scenePrompt = cleanText(generated.scenePrompt, 900);
  if (!title || !description || !hasChinese(description) || !scenePrompt) {
    throw new Error("文字 AI 生成的情景说明或图片提示词不完整。");
  }

  return {
    title,
    description,
    scenePrompt,
    words: words.slice(0, count),
  };
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { scene = "校园生活", level = "中级", wordCount = 10, style = "realistic" } = req.body || {};
  const count = clampNumber(wordCount, 8, 20, 10);

  try {
    const generated = await callTextModel({
      system:
        "You generate immersive English-learning scene vocabulary data for Chinese learners. Output realistic, scene-specific vocabulary and examples. Return strict JSON only.",
      user: `Generate an immersive English learning scene for: ${scene}

Difficulty: ${level}
Word count: ${count}
Image style: ${style}

Requirements:
- title and description must be Chinese and specific to the scene.
- scenePrompt must be English and describe one realistic scene image with people, objects, and actions; no text, no labels.
- Generate ${count} useful English words or short phrases that are genuinely used in this scene.
- Each word must include accurate Chinese meaning, natural English example, Chinese example translation, and memoryTip in Chinese.
- Do not output placeholders like "word 的场景含义" or "I use word in the scene".
- For 餐厅点餐 include practical items like menu, reservation, order, appetizer, main course, bill, split the bill, recommend.
- For 买菜 include practical items like vegetable stall, weigh, price, fresh, discount, cash, QR code, plastic bag, bunch, ripe.`,
      schemaHint: 'Schema: {"title":"","description":"","scenePrompt":"","words":[{"word":"","meaning":"","phonetic":"","example":"","exampleCn":"","memoryTip":"","scene":"","tags":[""]}]}',
    });
    const payload = normalizeScene(generated, { scene, count });
    return jsonResponse(res, { scene: payload });
  } catch (error) {
    const payload = makeLocalSceneBackup({ scene, count });
    return jsonResponse(res, {
      scene: payload,
      warning: `${error.message || "文字 AI 当前不可用"} 已启用本地高质量备用情景，避免学习流程中断。`,
    });
  }
}
