import type {
  CopyType,
  BaseGenerateParams,
  SellingPointParams,
  TitleParams,
  PromoShortParams,
  LongFormParams,
  ToneAdjustParams,
  ToneStyle,
} from './types';

function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getToneStyleText(tone?: ToneStyle): string {
  const toneMap: Record<string, string> = {
    formal: '正式',
    casual: '轻松',
    humorous: '幽默',
    professional: '专业',
    warm: '温暖',
    urgent: '紧迫',
    luxury: '奢华',
    youthful: '年轻',
  };
  return tone ? toneMap[tone] || '通用' : '通用';
}

function simulateDelay(): Promise<void> {
  const delay = 100 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom<T>(arr: T[], seed = -1): T {
  const idx = seed >= 0 ? seed % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function joinNotEmpty(parts: string[], sep = ' '): string {
  return parts.filter(Boolean).join(sep);
}

export type GenerateResponse = {
  id: string;
  candidates: Array<{
    content: string;
    score: number;
    tags: string[];
  }>;
};

export class AIClient {
  private apiKey?: string;
  private apiEndpoint?: string;
  private model?: string;

  constructor(config?: { apiKey?: string; apiEndpoint?: string; model?: string }) {
    this.apiKey = config?.apiKey;
    this.apiEndpoint = config?.apiEndpoint;
    this.model = config?.model || 'gpt-3.5-turbo';
  }

  public async generate(
    type: CopyType,
    params: BaseGenerateParams
  ): Promise<GenerateResponse> {
    await simulateDelay();

    const id = generateId();
    const count = params.candidateCount || 3;

    switch (type) {
      case 'selling_point':
        return this.generateSellingPoints(id, params as SellingPointParams, count);
      case 'title':
        return this.generateTitles(id, params as TitleParams, count);
      case 'promo_short':
        return this.generatePromoShorts(id, params as PromoShortParams, count);
      case 'long_form':
        return this.generateLongForms(id, params as LongFormParams, count);
      case 'tone_adjust':
        return this.generateToneAdjusts(id, params as ToneAdjustParams, count);
      default:
        return { id, candidates: [] };
    }
  }

  // ===== 卖点生成：支持大量候选（20+） =====
  private generateSellingPoints(id: string, params: SellingPointParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const features = product?.features || ['品质卓越', '性价比高', '值得信赖'];
    const tone = getToneStyleText(params.toneStyle);
    const category = product?.category || '精选好物';
    const brand = product?.brand || '';
    const f3 = features[2] || '品质保障';
    const f4 = features[3] || '更多惊喜';

    const prefixes = [
      `【${productName}】`,
      `${tone}推荐！`,
      `${tone}风格：`,
      `精选推荐 | `,
      `${productName}——${category}中的${tone}之选。`,
      `懂生活的人选${productName}。`,
      `【${tone}推荐】${productName}：`,
      `${productName}，${category}新标杆！`,
      `别再犹豫了！${productName}就是你要找的。`,
      `【用户好评】${productName}：`,
      `${productName}为什么这么火？`,
      `${brand ? brand + '：' : ''}`,
      `不容错过的${category}——${productName}`,
      `重磅推荐！${productName}`,
      `亲测好评！${productName}`,
      `${tone}好物：${productName}`,
      `${category}首选！${productName}`,
      `口碑之选：${productName}`,
      `闭眼入不踩雷的${productName}`,
      `回购率超高的${productName}`,
      `${brand ? brand : '品牌'}出品 | ${productName}`,
      `今日主推：${productName}`,
      `种草推荐 | ${productName}`,
      `必入清单 | ${productName}`,
      `【${tone}好价】${productName}`,
    ];

    const midParts = [
      `${features[0]}，${features[1]}，${f3}`,
      `${features[0]}，${features[1]}，${f3}，${f4}`,
      `${features[0]}！${features[1]}！${f3}！`,
      `主打${features[0]}，兼顾${features[1]}，更有${f3}`,
      `${features[0]}体验佳，${features[1]}性能好，${f3}很满意`,
      `${features[0]}出众，${features[1]}靠谱，${f3}到位`,
      `从${features[0]}到${features[1]}，${f3}始终在线`,
      `${features[0]}+${features[1]}+${f3}，三重保障`,
      `${features[0]}不将就，${features[1]}不含糊，${f3}不打折`,
      `${features[0]}看得见，${features[1]}摸得着，${f3}感受到`,
      `${features[0]}、${features[1]}、${f3}，样样拿得出手`,
      `有${features[0]}，有${features[1]}，还有${f3}`,
      `${features[0]}到位，${features[1]}够硬，${f3}贴心`,
      `${features[0]}出色，${features[1]}优秀，${f3}贴心`,
      `${features[0]}拉满，${features[1]}满级，${f3}在线`,
      `${features[0]}加分，${features[1]}省心，${f3}点赞`,
    ];

    const suffixes = [
      '！',
      '，给你' + tone + '体验。',
      '，只为遇见更好的你。',
      '，更多惊喜等你发现。',
      '，三重保障让你买得放心。',
      '，想不火都难！',
      '，好评如潮。',
      '，值得拥有。',
      '，品质生活从此开始。',
      '，用过都说好！',
      '，朋友都在问。',
      '，千万用户的共同选择。',
      '，回购率超高。',
      '，品质看得见。',
      '，放心购买。',
      '，品质保证。',
      '，你值得更好的。',
      '，让生活更美好。',
      '，不容错过。',
      '，限时抢购中！',
    ];

    const bulletFormats = [
      () => `${productName}核心卖点：\n1. ${features[0]}\n2. ${features[1]}\n3. ${f3}\n4. ${f4}`,
      () => `- ${features[0]}\n- ${features[1]}\n- ${f3}\n- ${f4}`,
      () => `• ${features[0]}，${tone}品质\n• ${features[1]}，省心之选\n• ${f3}，用心之作\n• ${f4}，惊喜连连`,
      () => `亮点一：${features[0]}\n亮点二：${features[1]}\n亮点三：${f3}\n亮点四：${f4}`,
      () => `【核心优势】\n  ✓ ${features[0]}\n  ✓ ${features[1]}\n  ✓ ${f3}\n  ✓ ${f4}`,
      () => `✅ ${features[0]}\n✅ ${features[1]}\n✅ ${f3}\n✅ ${f4}`,
      () => `🔥 ${features[0]}\n💎 ${features[1]}\n⭐ ${f3}\n🎁 ${f4}`,
      () => `卖点解析：\n【${features[0]}】出众表现\n【${features[1]}】放心体验\n【${f3}】贴心设计\n【${f4}】惊喜连连`,
    ];

    const baseTemplates: Array<() => string> = [];

    for (let i = 0; i < prefixes.length; i++) {
      for (let j = 0; j < Math.min(2, midParts.length); j++) {
        for (let k = 0; k < Math.min(2, suffixes.length); k++) {
          const seed = i * 4 + j * 2 + k;
          baseTemplates.push(() => {
            const s = seed;
            const p = prefixes[s % prefixes.length];
            const m = midParts[(s + 3) % midParts.length];
            const su = suffixes[(s + 7) % suffixes.length];
            return p + m + su;
          });
        }
      }
    }

    baseTemplates.push(...bulletFormats);

    const finalTemplates = shuffleArray(baseTemplates).slice(0, Math.max(count * 2, 50));
    const results: Array<{ content: string; tags: string[] }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < finalTemplates.length && results.length < count * 2; i++) {
      let content = typeof finalTemplates[i] === 'function'
        ? (finalTemplates[i] as any)(i)
        : (finalTemplates[i] as any);
      if (!content || typeof content !== 'string') {
        const p = pickRandom(prefixes, i);
        const m = pickRandom(midParts, i * 3);
        const s = pickRandom(suffixes, i * 5);
        content = p + m + s;
      }
      const key = content.slice(0, 30);
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ content, tags: [`组合${i + 1}`] });
      }
    }

    while (results.length < count * 2) {
      const seed = results.length;
      const p = pickRandom(prefixes, seed);
      const m = pickRandom(midParts, seed * 3);
      const s = pickRandom(suffixes, seed * 5);
      const content = `${p}${m}${s}[${seed + 1}]`;
      results.push({ content, tags: [`变体${seed + 1}`] });
    }

    const selected = results.slice(0, count);
    const candidates = selected.map((item, index) => ({
      content: item.content,
      score: 0.65 + (Math.random() * 0.35),
      tags: ['卖点', tone, category, ...item.tags],
    }));

    return { id, candidates };
  }

  // ===== 标题生成：支持大量候选（20+） =====
  private generateTitles(id: string, params: TitleParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const brand = product?.brand || '';
    const keywords = params.keywords || [];
    const tone = getToneStyleText(params.toneStyle);
    const category = product?.category || '精选好物';
    const kw1 = keywords[0] || category;
    const kw2 = keywords[1] || tone + '之选';
    const kw3 = keywords[2] || '品质保证';

    const separators = [' - ', ' | ', ' · ', ' / ', ' 】 ', ' ', ' ｜ ', ' — ', ' 、'];

    const titleStructures: Array<(seed: number) => string> = [
      (s) => joinNotEmpty([brand, productName, keywords[s % keywords.length] || ''].filter(Boolean), pickRandom(separators, s)),
      (s) => `${tone}推荐${pickRandom(separators, s)}${joinNotEmpty([productName, kw1].filter(Boolean), pickRandom(separators, s + 1))}`,
      (s) => `【${brand || pickRandom(['热销', '新品', '爆款', '精品', '优选'], s)}】${joinNotEmpty([productName, kw1, kw2].filter(Boolean), ' ')}`,
      (s) => `${joinNotEmpty([productName].filter(Boolean), '')}${pickRandom(separators, s)}${tone}之选，品质生活必备`,
      (s) => joinNotEmpty([brand, productName, kw1, kw2, kw3].filter(Boolean), pickRandom(separators, s)),
      (s) => `「${tone}好物」${joinNotEmpty([productName, kw1].filter(Boolean), ' ')}`,
      (s) => `${joinNotEmpty([productName, kw1].filter(Boolean), ' ')}${pickRandom(separators, s)}${brand || '品牌直营'}`,
      (s) => `【${category}】${joinNotEmpty([brand, productName, kw1].filter(Boolean), ' ')}`,
      (s) => `${tone}榜单${pickRandom(separators, s)}${joinNotEmpty([productName, kw1].filter(Boolean), pickRandom(separators, s + 1))}${pickRandom(separators, s + 2)}首选`,
      (s) => `${joinNotEmpty([brand, productName].filter(Boolean), ' ')}【${tone}品质】${joinNotEmpty([kw1, kw2].filter(Boolean), ' ')}`,
      (s) => `必入好物${pickRandom(separators, s)}${joinNotEmpty([productName, kw1, kw2, category].filter(Boolean), ' ')}`,
      (s) => `【限时特惠】${joinNotEmpty([brand, productName].filter(Boolean), ' ')}${pickRandom(separators, s)}${tone}之选`,
      (s) => `${productName}${s % 2 === 0 ? kw1 : kw2} -  ${pickRandom(['官方直营', '正品保障', '品牌旗舰', '假一赔十'], s)}`,
      (s) => `${joinNotEmpty([brand, productName].filter(Boolean), '')}｜${pickRandom(['销量王', '回头客多', '好评如潮', '明星同款'], s)}${pickRandom(separators, s)}${kw1}`,
      (s) => `【${pickRandom(['年度', '季度', '月度', '本周', '今日'], s)}推荐】${joinNotEmpty([productName, kw1].filter(Boolean), ' ')}`,
      (s) => `${tone}好物${pickRandom(separators, s)}${joinNotEmpty([brand, productName].filter(Boolean), ' ')}${pickRandom(separators, s)}${kw2}`,
      (s) => joinNotEmpty([productName, brand, kw1, kw2, kw3, category].filter(Boolean), pickRandom(separators, s)),
      (s) => `🔥${productName} - ${pickRandom(['年度爆款', '口碑炸裂', '闭眼入', 'yyds', '绝绝子'], s)}`,
      (s) => `${brand ? brand + ' ' : ''}${productName}${pickRandom(['新品上市', '全新升级', '焕新登场', '重磅发布'], s)}`,
      (s) => `${pickRandom(['官方', '旗舰店', '正品', '行货'], s)}${pickRandom(separators, s)}${joinNotEmpty([brand, productName, kw1].filter(Boolean), ' ')}`,
      (s) => `【${pickRandom(['数码', '家电', '美妆', '服饰', '家居'], s % 5)}好物】${joinNotEmpty([productName, kw1].filter(Boolean), ' ')}`,
      (s) => `${productName}${pickRandom(['测评', '推荐', '评测', '种草', '安利'], s)}｜${joinNotEmpty([kw1, kw2].filter(Boolean), ' ')}`,
      (s) => `${joinNotEmpty([brand, productName].filter(Boolean), ' ')} - ${pickRandom(['品质保证', '正品行货', '全国联保', '售后无忧'], s)}`,
      (s) => `「${pickRandom(['精选', '严选', '臻选', '优选'], s)}」${joinNotEmpty([productName, kw1, kw2].filter(Boolean), ' ')}`,
      (s) => `${tone}推荐${pickRandom(separators, s)}${brand ? brand + ' ' : ''}${productName}${pickRandom(separators, s)}${kw1}`,
    ];

    const allTemplates: Array<() => string> = [];
    for (let i = 0; i < Math.max(count * 3, 60); i++) {
      const idx = i;
      allTemplates.push(() => {
        const structure = titleStructures[idx % titleStructures.length];
        return structure(idx).replace(/\s+/g, ' ').trim();
      });
    }

    const shuffled = shuffleArray(allTemplates);
    const results: Array<{ content: string; tags: string[] }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < shuffled.length && results.length < count * 2; i++) {
      let content = '';
      try { content = shuffled[i](); } catch { content = `${productName} - ${kw1}`; }
      const key = content.slice(0, 20);
      if (!seen.has(key)) {
        seen.add(key);
        const variantTags = [`结构${(i % titleStructures.length) + 1}`];
        if (i % 3 === 0) variantTags.push('品牌款');
        if (i % 4 === 0) variantTags.push('关键词款');
        if (i % 5 === 0) variantTags.push('榜单款');
        results.push({ content, tags: variantTags });
      }
    }

    while (results.length < count * 2) {
      const seed = results.length;
      const structure = titleStructures[seed % titleStructures.length];
      const content = structure(seed).replace(/\s+/g, ' ').trim() + `#${seed + 1}`;
      results.push({ content, tags: [`补位${seed + 1}`] });
    }

    const selected = results.slice(0, count);
    const candidates = selected.map((item, index) => ({
      content: item.content,
      score: 0.65 + (Math.random() * 0.35),
      tags: ['标题', tone, ...item.tags, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

  // ===== 促销语生成：支持大量候选（15+） =====
  private generatePromoShorts(id: string, params: PromoShortParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const price = product?.price;
    const originalPrice = product?.originalPrice;
    const promotionType = params.promotionType || 'discount';
    const tone = getToneStyleText(params.toneStyle);
    const brand = product?.brand || '';

    const discount = originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 30;
    const savings = originalPrice && price ? originalPrice - price : 0;
    const fmtPrice = (n?: number) => n !== undefined ? String(n) : 'XX';

    const promoBanks: Record<string, string[]> = {
      discount: [
        `限时${discount}折！${productName}，原价${fmtPrice(originalPrice)}元，现价仅${fmtPrice(price)}元！`,
        `${tone}特惠 | ${productName}直降${savings || 'XX'}元，手慢无！`,
        `【史低价】${productName}仅${fmtPrice(price)}元，错过再等一年！`,
        `${brand}${productName}特惠：${discount}折疯抢，仅剩最后几小时！`,
        `打${discount}折了！${productName}原价${fmtPrice(originalPrice)}元，现价只要${fmtPrice(price)}元！`,
        `【超值优惠】${productName}直降${savings || 'XX'}元，${tone}推荐不容错过！`,
        `${tone}提醒：${productName}限时${discount}折优惠，数量有限先到先得！`,
        `${brand || '品牌'}大促！${productName}现价${fmtPrice(price)}元，立省${savings || 'XX'}元！`,
        `【${discount}折起】${productName}${fmtPrice(price)}元秒杀，原价${fmtPrice(originalPrice)}元！`,
        `降价${savings || 'XX'}元！${productName}${discount}折大促销，速抢！`,
        `${tone}好价！${productName}仅需${fmtPrice(price)}元，直降${savings || 'XX'}！`,
        `今日特惠：${productName}${discount}折，到手价${fmtPrice(price)}元！`,
        `【${discount}%OFF】${brand}${productName} 特价${fmtPrice(price)}元！`,
        `省${savings || 'XX'}元买${productName}，${discount}折限时疯抢！`,
        `${fmtPrice(price)}元带走${productName}！原价${fmtPrice(originalPrice)}元省${savings || 'XX'}元！`,
      ],
      limited: [
        `限量发售！${productName}仅剩最后100件，欲购从速！`,
        `${tone}提醒：${productName}限时供应，售完即止！`,
        `【稀缺好物】${productName}，数量有限，先到先得！`,
        `手慢无！${productName}仅剩最后50件，抢完恢复原价！`,
        `${tone}预警：${productName}库存告急，仅剩最后一批！`,
        `【限量抢】${productName}，全国限量${Math.floor(Math.random() * 500) + 100}份！`,
        `${productName}限时开售，${tone}推荐，错过等半年！`,
        `独家限量！${brand}${productName}，卖完不补！`,
        `只剩最后88件！${productName}库存紧张，欲购从速！`,
        `【T-24H】${productName}限时24小时，售完下架！`,
        `${tone}库存告急！${productName}最后30件清仓！`,
        `限购！${productName}每人限2件，抢完即止！`,
        `【闪购】${productName}限时限量，今日下架！`,
        `${productName}断货预警！仅剩最后N件，速抢！`,
        `【稀缺】${productName}限量定制版，错过不再有！`,
      ],
      gift: [
        `买${productName}送好礼，赠品有限先到先得！`,
        `${tone}福利：购买${productName}即享赠品礼包！`,
        `【买一送一】${productName}，超值组合等你来！`,
        `${brand || '品牌'}回馈：买${productName}赠精美礼品一份！`,
        `${tone}惊喜：${productName}买即送，赠品价值${Math.floor(Math.random() * 100) + 50}元！`,
        `【超值套装】${productName} + 赠品，${tone}之选！`,
        `买就送！${productName}配套好礼等你拿，${tone}推荐！`,
        `${tone}福利时刻：${productName}买一赠N，错过太可惜！`,
        `【赠完即止】买${productName}送${fmtPrice(Math.floor(Math.random()*100+50))}元大礼包！`,
        `买${productName}，送豪华配件大礼包！${tone}必入！`,
        `【赠品加码】购${productName}，赠2件好礼，先到先得！`,
        `${tone}专属：${productName}下单即送神秘礼品！`,
        `买${productName}送同款周边，数量有限送完即止！`,
        `【组合优惠】${productName}+赠品仅需${fmtPrice(price)}元！`,
        `购买${productName}享3重好礼，${tone}福利别错过！`,
      ],
      new: [
        `新品上市！${productName}全新升级，抢先体验！`,
        `${tone}首发 | ${productName}新品来袭，限时优惠！`,
        `【全新上市】${productName}，带给你不一样的体验！`,
        `${brand || '品牌'}新品：${productName}焕新登场，${tone}首发！`,
        `新品驾到！${productName}全新升级，${tone}之选！`,
        `【抢先体验】${productName}新品首发，前100名享优惠！`,
        `${tone}新品推荐：${productName}，焕新你的生活！`,
        `全新${productName}，${tone}品质，全新体验！`,
        `【NEW新品】${productName}全新一代，首发特惠！`,
        `新一代${productName}来了！${tone}首发价${fmtPrice(price)}元！`,
        `新品首发：${productName}全新升级，首批限量${Math.floor(Math.random()*500+100)}件！`,
        `${tone}尝鲜价！${productName}新品上市，限时特惠${discount}折！`,
        `【新品速递】${brand}${productName}，全新体验首发！`,
        `重磅上新！${productName}全新版本，${tone}品质！`,
        `抢先购 | ${productName}新品，前100名赠好礼！`,
      ],
      hot: [
        `爆款热销！${productName}已售10万+，好评如潮！`,
        `${tone}力荐 | ${productName}全网热卖，错过后悔！`,
        `【人气王】${productName}，千万用户的共同选择！`,
        `销量王！${productName}累计销售${Math.floor(Math.random() * 50) + 10}万件！`,
        `${tone}推荐爆款：${productName}，大家都在买！`,
        `【断货王】${productName}，开售即爆款，回购率超高！`,
        `全网热销${productName}，${tone}品质，万人好评！`,
        `${brand || '品牌'}爆款${productName}，销量说话，${tone}之选！`,
        `🔥爆卖！${productName}全网销量TOP1，回购率99%！`,
        `【口碑炸裂】${productName}好评率99%，10万+用户都说好！`,
        `热销榜单第一！${productName}${tone}品质，爆款来袭！`,
        `已售${Math.floor(Math.random() * 50) + 10}万+！${productName}万人追捧！`,
        `【网红爆款】${productName}，明星达人都在用！`,
        `销量说话！${productName}蝉联${Math.floor(Math.random()*5+1)}周销冠！`,
        `疯抢中！${productName}全网热卖，库存告急！`,
      ],
    };

    const allTemplates: Array<() => string> = [];
    const bank = promoBanks[promotionType] || promoBanks.discount;
    allTemplates.push(...bank.map((t) => () => t));

    const crossPromoTypes = Object.keys(promoBanks).filter(k => k !== promotionType);
    for (const pt of crossPromoTypes.slice(0, 2)) {
      const extraBank = promoBanks[pt];
      const tagMap: Record<string, string> = { limited: '限量', gift: '送礼', hot: '爆款', discount: '特惠', new: '新品' };
      const tag = tagMap[pt] || '特惠';
      const crossFuncs = extraBank.map((t) => () => {
        let r = t;
        if (r.startsWith('【')) {
          r = '【' + tag + '+' + r.substring(1);
        } else {
          r = '【' + tag + '】' + r;
        }
        return r;
      });
      allTemplates.push(...crossFuncs);
    }

    const comboTemplates: Array<() => string> = [];
    for (let i = 0; i < Math.max(count * 3, 50); i++) {
      const seed = i;
      comboTemplates.push(() => {
        const base = bank[seed % bank.length];
        const modifiers = [
          '',
          `【${tone}版】`,
          `${brand ? '【' + brand + '】' : ''}`,
          `【限时${Math.floor(Math.random() * 48) + 1}H】`,
          `【${Math.floor(Math.random() * 500) + 100}元券】`,
          `【前${Math.floor(Math.random() * 200) + 50}名】`,
          `【直播间专属】`,
          `【VIP专享】`,
          `【粉丝价】`,
          `【老客回馈】`,
        ];
        const prefix = modifiers[seed % modifiers.length];
        const suffix = seed % 4 === 0 ? ' 立即抢购>' : seed % 4 === 1 ? ' 手慢无>>' : seed % 4 === 2 ? ' →点我下单' : '';
        return prefix + base + suffix;
      });
    }

    allTemplates.push(...comboTemplates);

    const shuffled = shuffleArray(allTemplates);
    const results: Array<{ content: string; tags: string[] }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < shuffled.length && results.length < count * 2; i++) {
      let content = '';
      try { content = shuffled[i](); } catch { content = `${productName}促销中！`; }
      const key = content.slice(0, 25);
      if (!seen.has(key)) {
        seen.add(key);
        const variantTags = [`${promotionType}${(i % 5) + 1}`];
        if (i % bank.length < bank.length) variantTags.push('主模板');
        if (i >= bank.length) variantTags.push('组合模板');
        results.push({ content, tags: variantTags });
      }
    }

    while (results.length < count * 2) {
      const seed = results.length;
      const base = bank[seed % bank.length];
      const content = `【V${seed + 1}】${base}[${seed + 1}]`;
      results.push({ content, tags: [`扩展${seed + 1}`] });
    }

    const selected = results.slice(0, count);
    const candidates = selected.map((item, index) => ({
      content: item.content,
      score: 0.65 + (Math.random() * 0.35),
      tags: ['促销', promotionType, tone, ...item.tags, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

  // ===== 长文生成 =====
  private generateLongForms(id: string, params: LongFormParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const features = product?.features || ['高品质', '优价格', '好服务'];
    const scenarios = product?.usageScenarios || ['日常使用', '送礼佳品', '办公必备'];
    const tone = getToneStyleText(params.toneStyle);
    const format = params.format || 'description';
    const audience = product?.targetAudience?.description || '追求品质生活的你';
    const category = product?.category || '精品好物';
    const brand = product?.brand || '';

    const templates: Array<() => string> = [];

    const descTemplates = [
      () => `${productName}产品介绍

【产品简介】
${productName}是一款专为${audience}打造的${category}。我们深知你对品质的追求，因此每一个细节都经过精心打磨，只为给你带来${tone}的使用体验。

【核心特点】
${features.map((f, i) => `${i + 1}. ${f}：从用户需求出发，${f}为你带来卓越的使用感受，无论是${scenarios[0]}还是${scenarios[1]}，都能游刃有余。`).join('\n\n')}

【使用场景】
${scenarios.map((s) => `• ${s}：${productName}在${s}中表现出色，为你的生活增添便利与品质。`).join('\n')}

【品牌承诺】
${brand || '我们'}坚持${tone}的品质标准，从选材到生产，每一个环节都严格把控。选择${productName}，选择品质生活。`,

      () => `${productName} - ${tone}之选

产品概述
${brand}${productName}，${category}中的品质之选。我们相信，好的产品自己会说话，而${productName}就是最好的证明。

产品亮点
${features[0]}：精心打磨每一个细节，只为呈现最好的状态
${features[1]}：强大性能加持，轻松应对各种使用场景
${features[2]}：从用户角度出发，每一处设计都饱含心意
${features[3] ? features[3] + '：更多惊喜，等你发现' : ''}

适用人群
如果你是${audience}，那么${productName}绝对值得你拥有。它不仅仅是一件产品，更是你品质生活的好伙伴。

品质保证
我们承诺，每一件${productName}都经过严格质检。如有任何问题，随时联系我们，我们将竭诚为你服务。`,

      () => `【产品详情】${productName}

品牌：${brand || '品牌直营'}
产品名称：${productName}
产品类别：${category}

---

产品特色
${features.map((f, i) => `【特色${i + 1}】${f}\n深入了解：${f}是${productName}的一大亮点，它能够有效提升使用体验，让你感受到不一样的品质。`).join('\n\n')}

---

使用场景推荐
${scenarios.map((s, i) => `场景${i + 1}：${s}\n推荐理由：在${s}时使用${productName}，能够让你的体验更加出色。`).join('\n\n')}

---

为什么选择我们？
1. ${tone}品质，值得信赖
2. ${features[0]}，放心使用
3. 完善售后，无忧购物
4. 口碑之选，好评如潮

${productName}，期待与你相遇，共同开启品质生活新篇章。`,

      () => `${brand}${productName}产品手册

欢迎了解${productName}！本手册将为你全面介绍这款产品的各项特性和使用方法。

第一章 产品概览
${productName}是我们团队历时多年研发的心血之作。它融合了${features[0]}、${features[1]}、${features[2]}等多项核心技术，致力于为用户带来${tone}的使用体验。

第二章 核心功能
功能一：${features[0]}
详细说明：${features[0]}是${productName}最具代表性的功能之一，它采用了先进的技术方案，确保在各种场景下都能稳定运行。

功能二：${features[1]}
详细说明：${features[1]}的加入，让${productName}的实用性大大提升。无论是${scenarios[0]}还是${scenarios[1]}，都能轻松应对。

功能三：${features[2]}
详细说明：${features[2]}体现了我们对用户体验的极致追求。每一个细节都经过反复打磨，只为给你最舒适的感受。

第三章 使用场景
场景A：${scenarios[0]}
场景B：${scenarios[1]}
场景C：${scenarios[2]}

第四章 总结
${productName}，你的${tone}之选。`,

      () => `关于${productName}，你需要知道的几件事

${brand ? brand + '出品，必属精品。' : ''}${productName}，重新定义${category}新标准。

第一件事：${features[0]}
很多人选择${productName}，都是因为${features[0]}。的确，在同类产品中，${productName}的${features[0]}表现相当出色，用过的人都说好。

第二件事：${features[1]}
除了${features[0]}之外，${features[1]}也是${productName}的一大亮点。它不仅仅是一个功能，更是一种态度的体现。${tone}风格，让人一见倾心。

第三件事：${features[2]}
细节决定成败。${productName}在${features[2]}方面做得相当到位，每一个小细节都能感受到设计师的用心。

第四件事：超高性价比
花更少的钱，享受更好的品质。${productName}就是这样一款高性价比的产品，值得每一个${audience}拥有。

如果你也在寻找合适的${category}，不妨试试${productName}，相信不会让你失望。`,

      () => `${productName}全方位解析

大家好，今天来给大家做一期${productName}的深度解析。

外观设计
${productName}采用了${tone}的设计语言，整体看起来非常${features[0] ? features[0].slice(0, 4) : '精致'}。拿在手里，质感满满。

性能表现
性能方面，${productName}搭载了${features[1]}，实测表现非常出色。${scenarios[0]}、${scenarios[1]}、${scenarios[2]}等场景下都能轻松应对。

使用体验
使用体验是我最满意的部分。${features[2]}带来的感受真的很棒，每天用着都很开心。${tone}风格的操作逻辑，上手零难度。

购买建议
如果你正在考虑入手${category}，我非常推荐${productName}。综合各方面表现来看，它绝对是同价位中的佼佼者。

以上就是本期${productName}全方位解析的全部内容，希望对大家有所帮助。`,
    ];

    const articleTemplates = [
      () => `为什么${productName}值得你拥有？

在快节奏的现代生活中，我们都在寻找那些能够真正提升生活品质的好物。今天，我要向大家推荐的${productName}，就是这样一款让人眼前一亮的产品。

初识${productName}，你会被它的${features[0]}所吸引。简约而不简单的设计，透露出${tone}的品质感。但真正打动人心的，是它${features[1]}和${features[2]}。

${scenarios[0]}中，${productName}能够为你带来极大的便利。它不仅仅是一件工具，更像是一位懂你的朋友，在你需要的时候给予最好的支持。

${scenarios[1]}里，${productName}可以帮助你提升效率。${tone}的表现，让你在忙碌中也能从容应对各种挑战。

当然，${features[3] || '超高的性价比'}也是${productName}备受好评的重要原因。花合适的钱，享受${tone}的品质，这样的好事，谁能拒绝呢？

总的来说，${productName}不仅仅是一款产品，更是一种生活态度的体现。如果你也在寻找${tone}的好物，那么${productName}绝对值得一试。`,

      () => `用过${productName}之后，我想说...

最近被朋友安利了${productName}，抱着试试看的心态入手了一个。没想到，用了之后彻底被圈粉了！今天就来和大家聊聊我的真实使用感受。

首先说${features[0]}。${productName}的${features[0]}真的很戳我，${tone}风格，看起来就很有质感。拿在手里，朋友看到都问我在哪买的。

再来说说${features[1]}。说实话，我用过不少同类产品，但${productName}的${features[1]}是真的好。用起来非常顺手，每天都离不开它了。

还有一点我特别喜欢的是${features[2]}。很多时候，决定一款产品好坏的就是细节。${productName}在这方面做得相当到位，每一个小细节都能感受到用心。

当然，人无完人，产品也是一样。如果非要挑一点不足的话，那就是价格稍微有点小贵。但考虑到品质，我觉得还是很值的。

总体来说，${productName}还是非常值得推荐的。如果你正在寻找${category}，不妨考虑一下它，相信不会让你失望。`,

      () => `${productName}深度评测：${tone}好物，名不虚传

最近收到了不少粉丝的私信，问我${productName}值不值得买。作为一个测评过无数产品的博主，今天我就来给大家做一个深度评测。

【外观设计】评分：五星
${features[0]}方面，${productName}采用了简约的设计风格，整体看起来非常有质感。手感方面也很不错，可以说是同价位中的佼佼者。

【性能表现】评分：四星半
${features[1]}上，${productName}的表现相当出色，实际测试下来完全超出预期。日常使用完全没问题，就算是高强度使用也能轻松应对。

【使用体验】评分：五星
${features[2]}是我最满意的部分。${tone}的操作逻辑，上手很快，用起来非常舒服。

【性价比】评分：四星
价格方面，${productName}的定位中高端，考虑到${features[0]}、${features[1]}和${features[2]}，我觉得性价比还是很高的。

【总结】
如果你需要一款${tone}的${category}，${productName}绝对是一个不错的选择。综合评分：4.8分，值得入手！`,

      () => `从怀疑到真香：${productName}使用半年记

说实话，第一次看到${productName}的时候，我是持怀疑态度的。不就是一个${category}吗？能有多特别？但是用了半年之后，我想说：真香！

让我改观的是${features[0]}。之前用的同类产品${features[0]}都很一般，但${productName}的${features[0]}让我大开眼界。原来生活可以如此${tone}！

然后是${features[1]}。我是一个对${features[1]}很挑剔的人，${productName}在这方面做得无可挑剔。甚至比我之前用的贵两倍的产品还要好。

${features[2]}是加分项，细节之处见真章。能感受到团队是真的在用心做产品，而不只是为了赚钱。

半年下来，${productName}已经成为我生活中不可或缺的一部分。在${scenarios[0]}和${scenarios[1]}中，它都发挥了不可替代的作用。

如果你还在犹豫要不要入手${productName}，我的建议是：别犹豫，早买早享受！`,

      () => `${brand || '一个'}做了10年${category}的老人，为什么推荐${productName}？

我在${category}行业摸爬滚打了10年，见过太多产品来来去去。但${productName}是少数让我真正眼前一亮的。

首先，${features[0]}做得确实到位。很多品牌都在说自己${features[0]}，但真正做到的没几个。${productName}是真的做到了。

其次，${features[1]}的把控让人放心。作为业内人，我知道要在这个价位做到${features[1]}有多难。但${productName}做到了，而且做得很好。

最重要的是${features[2]}。很多产品只顾堆参数，却忽略了用户真正的需求。${productName}不一样，它的${features[2]}真正站在了用户的角度。

${tone}的品质，合理的价格，${productName}绝对是近年来${category}领域的诚意之作。

所以，如果你问我推不推荐${productName}？我的答案是：强烈推荐！`,
    ];

    const reviewTemplates = [
      () => `【真实评测】${productName}使用一个月后，我想说...

作为一个对生活品质有要求的人，我一直在寻找${tone}的好物。最近入手了${productName}，使用了一个月，来和大家分享一下我的真实感受。

外观设计：五星
${features[0]}，手感很好，细节处理到位。拿在手里很有质感，朋友看到都夸有品味。

使用体验：五星
${features[1]}，效果超出预期，每天都在用。用了一个月，已经完全离不开了。

品质做工：四星半
${brand || '品牌'}的品质还是有保障的，做工精细，用料扎实。用了这么久，和新的一样。

性价比：四星
价格虽然不算便宜，但考虑到${features[2]}，绝对物有所值。毕竟一分钱一分货嘛。

【使用场景分享】
${scenarios[0]}的时候用，很方便；
${scenarios[1]}的时候用，很惬意；
${scenarios[2]}的时候带，很实用。

【总结】
如果你正在寻找${category}，强烈推荐${productName}。真的是用过就回不去的那种好！`,

      () => `买了${productName}之后，我后悔了...

后悔没有早点买！

哈哈，标题党了一下。不过说真的，${productName}确实给了我很大的惊喜，今天来给大家分享一下我的使用心得。

【购买背景】
之前一直在用同类产品，但总觉得差点意思。后来听朋友推荐${productName}，抱着试试的心态买了。

【开箱第一印象】
包装很${tone}，打开之后，${features[0]}比图片上还要好看。质感满满，一看就不是便宜货。

【一周使用感受】
${features[1]}：比我之前用的好太多了，完全不在一个档次
${features[2]}：用起来很顺手，${tone}的设计理念很对我的胃口
续航/容量：表现非常出色，完全够用
其他亮点：还有很多小惊喜，就不一一说了

【一个月后体验】
用了一个月，新鲜感过去了，但${productName}依然是我每天必用的东西。好的产品就是这样，经得起时间的考验。

【缺点吐槽】
也不是完美的，比如颜色选择可以再多一些。不过这都是小问题，不影响使用。

【最终评价】
总体来说，非常满意。五星好评，会推荐给朋友的那种！`,

      () => `【用户访谈】他们为什么选择${productName}？

为了给大家带来更真实的评测，我们采访了几位${productName}的用户，听听他们怎么说。

用户A：28岁，${scenarios[0]}达人
我是被同事种草的，用了之后发现真香！${features[0]}很好，${features[1]}也棒，最重要的是${features[2]}合适。

用户B：35岁，${scenarios[1]}爱好者
买给家里用的，全家人都喜欢。${tone}风格，很实用。已经推荐给好几个闺蜜了。

用户C：22岁，${scenarios[2]}族
性价比超高！对比了很多款，最终选了${productName}。事实证明我的选择是对的，各方面都很满意。

【我们的观点】
从用户反馈来看，${productName}的口碑确实不错。作为一款${tone}的${category}，它在${features[0]}、${features[1]}、${features[2]}等方面都表现出色，值得推荐。`,

      () => `连续用了${productName}90天，给大家一个真实反馈

说实话，一开始我对${productName}并没有抱太大期望。毕竟市面上的${category}太多了，真正好用的没几个。

但是用了90天之后，我必须说：${productName}是真的好用！

【第1-30天 适应期】
最大的感受是${features[0]}。和之前用的完全不一样，${tone}的体验让我很快就适应了。${features[1]}也让我眼前一亮。

【第31-60天 深度体验】
开始感受到${features[2]}的好处。很多之前没注意到的细节，现在用起来都觉得特别贴心。在${scenarios[0]}和${scenarios[1]}中都表现得非常好。

【第61-90天 离不开了】
现在${productName}已经成为我生活中的一部分了。每天${scenarios[0]}时用，${scenarios[1]}时用，甚至${scenarios[2]}的时候都会带着。

【一句话总结】
${productName}是我今年买到的最值的东西，没有之一。强烈推荐给每一个${audience}！`,
    ];

    const guideTemplates = [
      () => `${productName}完全使用指南

欢迎阅读${productName}使用指南！本文将带你全面了解这款产品，让你轻松上手，尽享${tone}体验。

【产品概览】
${productName}是一款${category}，适用于${scenarios.join('、')}等多种场景。凭借其${features[0]}和${features[1]}，深受用户喜爱。

【快速开始】
1. 开箱检查：收到产品后，请检查配件是否齐全
2. 初次使用：按照说明书进行简单设置即可开始使用
3. 日常维护：定期清洁保养，延长使用寿命

【核心功能详解】
${features.map((f, i) => `功能${i + 1}：${f}
   详细说明：${f}是${productName}的核心功能之一，它能够为你带来出色的使用体验
   使用技巧：要想充分发挥${f}的效果，建议你按照说明书正确操作`).join('\n\n')}

【使用场景指南】
${scenarios.map((s, i) => `场景${i + 1}：${s}
   推荐设置：根据场景选择合适的模式
   注意事项：使用时请注意安全，避免损坏产品`).join('\n\n')}

【常见问题解答】
Q: ${productName}如何保养？
A: 建议定期清洁，避免接触尖锐物品

Q: 出现故障怎么办？
A: 首先尝试重启，如果问题依然存在，请联系客服

Q: 保修期是多久？
A: 标准保修期为一年

希望这份指南能帮助你更好地使用${productName}。如有其他问题，欢迎随时联系我们！`,

      () => `${productName}入门到精通：超详细使用教程

大家好，今天给大家带来${productName}的详细使用教程。不管你是新手还是老用户，相信都能从中有所收获。

第一章：认识${productName}
1.1 产品简介
${productName}，${tone}品质的${category}。它拥有${features[0]}、${features[1]}、${features[2]}等多项亮点。

1.2 配件清单
${productName}主机
使用说明书
保修卡
充电线/配件等

第二章：基础使用
2.1 开机与设置
2.2 基本操作
2.3 模式选择

第三章：进阶技巧
3.1 ${features[0]}高阶用法
3.2 ${features[1]}使用秘籍
3.3 ${features[2]}隐藏功能

第四章：场景应用
4.1 ${scenarios[0]}使用指南
4.2 ${scenarios[1]}使用指南
4.3 ${scenarios[2]}使用技巧

第五章：维护与保养
5.1 日常清洁
5.2 定期维护
5.3 常见故障排除

结语
${productName}是一款非常出色的产品，希望这份教程能帮助你更好地使用它。祝大家使用愉快！`,

      () => `${productName}使用小贴士：让你的体验更${tone}

买了${productName}却不知道怎么用才能发挥最大价值？别担心，今天就来分享一些实用的使用技巧，让你的体验更上一层楼。

技巧一：充分利用${features[0]}
很多人买了${productName}，却只用了最基本的功能。其实${features[0]}还有很多高级玩法，比如...

技巧二：${features[1]}个性化设置
${productName}支持个性化设置，根据自己的使用习惯调整，体验会好很多。推荐设置：...

技巧三：${features[2]}搭配使用
${productName}和其他产品搭配使用效果更好哦！亲测有效，大家可以试试看。

技巧四：不同场景不同用法
${scenarios[0]}：推荐使用...模式
${scenarios[1]}：建议...设置
${scenarios[2]}：可以尝试...

技巧五：保养小妙招
好的保养能让${productName}用得更久。这里分享几个小妙招：
1. 定期清洁
2. 避免摔落
3. 正确存放

以上就是今天要分享的内容啦，希望对大家有帮助。如果你有更多使用技巧，欢迎分享哦！`,

      () => `${productName}新手避坑指南：这些90%的人都踩过

作为一款热门${category}，${productName}深受大家喜爱。但很多新手在使用过程中都踩过一些坑。今天就来盘点一下，帮大家避坑。

坑点一：不会正确使用${features[0]}
很多人刚拿到${productName}就直接用，完全不管${features[0]}的正确用法。其实只要掌握正确方法，体验会提升一大截。
正确做法：先看说明书，按照指引逐步操作。

坑点二：忽略${features[1]}的设置
${features[1]}是可以自定义的，但很多人都忽略了这一点。
正确做法：根据自己的使用习惯，调整${features[1]}到最合适的状态。

坑点三：在不适合的场景使用
${productName}虽然好用，但也不是万能的。比如在${scenarios[2]}中，有一些需要注意的地方。
正确做法：不同场景使用不同模式，保护产品同时获得最佳体验。

坑点四：不注重${features[2]}的维护
${features[2]}需要定期维护，否则会影响使用效果。
正确做法：每周做一次简单维护，每月做一次深度保养。

希望这份避坑指南能帮到大家！${productName}是一款${tone}好物，用对了真的能提升生活品质。`,
    ];

    if (format === 'description') templates.push(...descTemplates.map(f => () => f()));
    else if (format === 'article') templates.push(...articleTemplates.map(f => () => f()));
    else if (format === 'review') templates.push(...reviewTemplates.map(f => () => f()));
    else if (format === 'guide') templates.push(...guideTemplates.map(f => () => f()));
    else templates.push(...descTemplates.map(f => () => f()));

    if (templates.length < 8) {
      const base = descTemplates[0];
      for (let i = 0; i < 8; i++) {
        templates.push(() => `${i % 2 === 0 ? '【标准版】' : '【升级版】'}\n\n${base()}`);
      }
    }

    const shuffled = shuffleArray(templates);
    const targetCount = count * 3;
    const selected: any[] = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    while (selected.length < targetCount) {
      const seed = selected.length;
      const baseTemplate = templates[seed % templates.length];
      const variation = this.createLongFormVariation(baseTemplate(), productName, features, tone, seed);
      selected.push({ content: variation });
    }

    const candidates = selected.map((item, index) => ({
      content: typeof item === 'function' ? item() : (item.content || ''),
      score: 0.65 + (Math.random() * 0.35),
      tags: ['长文', format, tone, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

  private createLongFormVariation(base: string, productName: string, features: string[], tone: string, seed: number): string {
    const variationTypes: Array<(text: string) => string> = [
      (text) => `——${seed % 2 === 0 ? '深度测评' : '用户体验'}——\n\n` + text + `\n\n—— 以上为${seed % 3 === 0 ? '官方介绍' : '达人推荐'}内容 ——`,
      (text) => {
        const lines = text.split('\n');
        const longLines = shuffleArray(lines.filter(l => l.trim().length > 10));
        const extra = longLines.slice(0, 2).join('\n\n');
        return text + `\n\n【补充说明${seed}】\n${extra}`;
      },
      (text) => {
        const quotes = [
          `"${features[seed % features.length]}，这一点我特别喜欢。" —— 用户评价`,
          `"${productName}是我今年买到的最满意的产品之一。" —— 达人推荐`,
          `"性价比很高，推荐给大家。" —— 真实买家`,
          `"${tone}质感，值得入手！" —— 老客户复购`,
        ];
        return text + `\n\n用户怎么说：\n${quotes[seed % quotes.length]}`;
      },
      (text) => {
        const tips = [
          `小提示${seed + 1}：首次使用前请仔细阅读说明书，能够更好地发挥产品性能。`,
          `温馨提示：${productName}需定期保养，使用寿命更长哦~`,
          `使用技巧${seed + 1}：搭配配套产品使用，效果更佳。`,
          `保养贴士${seed + 1}：避免阳光直射，存放于干燥通风处。`,
          `${tone}提示：如有疑问，随时联系客服，我们将竭诚为您服务。`,
        ];
        return text + `\n\n${tips[seed % tips.length]}`;
      },
      (text) => {
        const faqs = [
          `\n\n常见问题 Q${seed + 1}：\nQ: ${productName}适合什么样的人群？\nA: 追求${features[0]}的人都可以使用，适用人群很广。`,
          `\n\n购买指南：\n推荐理由${seed + 1}：${features[seed % features.length]}出众，品质可靠，值得拥有。`,
          `\n\n售后服务：\n购买${productName}即享一年质保服务，如有问题请联系客服。`,
        ];
        return text + faqs[seed % faqs.length];
      },
      (text) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
          if (idx === 0) return `【版本${seed + 1}】${line}`;
          return line;
        }).join('\n');
      },
      (text) => {
        const stats = [
          `\n\n📊 销售数据：已累计售出${Math.floor(Math.random() * 50) + 10}万件，好评率${Math.floor(Math.random() * 5) + 95}%`,
          `\n\n🏆 荣誉榜单：连续${Math.floor(Math.random() * 10) + 1}周蝉联${productName}品类销量TOP3`,
          `\n\n💯 品质保证：通过${Math.floor(Math.random() * 10) + 10}项严格质检，品质有保障`,
        ];
        return stats[seed % stats.length] + '\n\n' + text;
      },
      (text) => {
        const tags = [
          '\n\n#好物推荐 #品质生活',
          '\n\n' + ['#种草', '#安利', '#必入好物', '#闭眼入', '#yyds'].slice(0, (seed % 3) + 2).join(' '),
          `\n\n标签：${tone}、${productName}、${features[0]}`,
        ];
        return text + tags[seed % tags.length];
      },
    ];

    let result = base;
    const startIdx = seed % variationTypes.length;
    const layers = 1 + (seed % 3);
    for (let i = 0; i < layers; i++) {
      result = variationTypes[(startIdx + i) % variationTypes.length](result);
    }

    return result;
  }

  // ===== 语气调整：支持大量候选 =====
  private generateToneAdjusts(id: string, params: ToneAdjustParams, count: number): GenerateResponse {
    const sourceCopy = params.sourceCopy || '';
    const targetTone = params.targetTone;
    const targetToneText = getToneStyleText(targetTone);

    const toneStrategies: Record<string, Array<(text: string, seed: number) => string>> = {
      formal: [
        (text) => `【${targetToneText}版】尊敬的用户，${text.replace(/！/g, '。').replace(/~/g, '')}感谢您的关注。`,
        (text) => `致尊敬的客户：\n\n${text.replace(/！/g, '。')}\n\n此致\n敬礼`,
        (text) => `${targetToneText}表述：经综合评估，${text.replace(/！/g, '。')}以上情况特此说明。`,
        (text) => `【官方说明】\n${text.replace(/！/g, '。')}\n\n本公司保留最终解释权。`,
        (text) => `关于「${text.substring(0, Math.min(10, text.length))}...」的${targetToneText}说明：\n${text.replace(/！/g, '。')}`,
        (text) => `${targetToneText}通知：${text.replace(/！/g, '。')}请知悉。`,
        (text) => `【${targetToneText}公告】兹通知如下：${text.replace(/！/g, '。')}特此公告。`,
        (text) => `${targetToneText}文书：${text.replace(/！/g, '。')}以上内容请知悉并遵照执行。`,
        (text) => `敬启者：${text.replace(/！/g, '。')}顺祝商祺。`,
      ],
      casual: [
        (text) => `【${targetToneText}版】嘿~${text.replace(/。/g, '~')}超棒的有没有！`,
        (text) => `哈喽~跟你说个事，${text.replace(/。/g, '~')}是不是超赞的！`,
        (text) => `${targetToneText}版来啦~${text.replace(/。/g, '，')}懂的都懂~`,
        (text) => `嘿嘿，${text.replace(/。/g, '~')}就问你香不香！`,
        (text) => `咱就是说，${text.replace(/。/g, '~')}一整个爱住了~`,
        (text) => `${targetToneText}风~${text.replace(/。/g, '呀~')}`,
        (text) => `害，${text.replace(/。/g, '嘛~')}你懂的呀~`,
        (text) => `嘿嘿嘿~${text.replace(/。/g, '哦~')}就酱紫啦~`,
        (text) => `哎呀呀~${text.replace(/。/g, '哒~')}超可耐的~`,
      ],
      humorous: [
        (text) => `【${targetToneText}版】笑死，${text}（狗头保命）`,
        (text) => `有内味儿了！${text}哈哈哈哈我先笑为敬~`,
        (text) => `${targetToneText}吐槽：${text}（不是我说的，是产品说的）`,
        (text) => `好家伙，${text} 我直呼内行！`,
        (text) => `笑不活了家人们，${text} 这波操作666~`,
        (text) => `${targetToneText}版 | ${text}（手动狗头乘N）`,
        (text) => `U1S1，${text}（手动滑稽）`,
        (text) => `YYDS！${text}（doge.jpg）`,
        (text) => `咱就是说，${text}，一整个蚌埠住了哈哈哈~`,
      ],
      professional: [
        (text) => `【${targetToneText}版】从专业角度来看，${text}该产品在同类竞品中表现优异。`,
        (text) => `${targetToneText}分析：${text}综合性能指标处于行业领先水平。`,
        (text) => `基于${targetToneText}评估，${text}具有较高的市场竞争力。`,
        (text) => `${targetToneText}解读：${text}其核心优势在于技术积累与品质把控。`,
        (text) => `【${targetToneText}评测】${text}\n\n结论：推荐购买。`,
        (text) => `${targetToneText}视角：${text}符合行业标准且具有创新性。`,
        (text) => `【技术白皮书】${text}关键指标达到行业先进水平。`,
        (text) => `经${targetToneText}团队验证：${text}性能稳定，建议采纳。`,
        (text) => `${targetToneText}数据报告：${text}综合评分优于竞品均值23%。`,
      ],
      warm: [
        (text) => `【${targetToneText}版】亲爱的朋友，${text}希望能给你带来温暖~`,
        (text) => `暖心推荐~${text}愿你每一天都被温柔以待。`,
        (text) => `${targetToneText}提示：${text}记得好好爱自己哦~`,
        (text) => `嘿，亲爱的~${text}有你真好。`,
        (text) => `${targetToneText}分享：${text}希望你会喜欢。`,
        (text) => `致特别的你：${text}`,
        (text) => `抱抱~${text}愿你被这个世界温柔以待。`,
        (text) => `小可爱~${text}要开心快乐每一天哦~`,
        (text) => `💕 ${text}记得按时吃饭，好好休息哦~`,
      ],
      urgent: [
        (text) => `【${targetToneText}版】紧急通知！${text}数量有限，速来抢购！`,
        (text) => `${targetToneText}提醒：${text}最后机会，错过再等一年！`,
        (text) => `【警告】${targetToneText}预警：${text}库存告急！`,
        (text) => `快！${text}${targetToneText}福利，手慢无！`,
        (text) => `【最后X小时】${text}${targetToneText}推荐，赶紧冲！`,
        (text) => `${targetToneText}！${text}再不行动就晚了！`,
        (text) => `⚡速看！${text}仅剩最后${Math.floor(Math.random()*50)+10}件！`,
        (text) => `【紧急】${text}活动即将结束，倒计时${Math.floor(Math.random()*24)+1}小时！`,
        (text) => `🚨别犹豫了！${text}马上就没了，快抢！`,
      ],
      luxury: [
        (text) => `【${targetToneText}版】尊享品质，${text}彰显不凡品味。`,
        (text) => `${targetToneText}臻选：${text}为品质生活而生。`,
        (text) => `尊享${targetToneText}体验：${text}定义高端生活方式。`,
        (text) => `${targetToneText}之选：${text}，品质与格调兼具。`,
        (text) => `【${targetToneText}定制】${text}，只为懂生活的你。`,
        (text) => `${targetToneText}品质 | ${text}，匠心之作。`,
        (text) => `💎 臻享体验：${text}，非凡人生的不二之选。`,
        (text) => `传承${targetToneText}工艺：${text}，与生俱来的优雅。`,
        (text) => `🏆 名流之选：${text}，彰显非凡气度。`,
      ],
      youthful: [
        (text) => `【${targetToneText}版】yyds！${text}这也太绝了吧~冲鸭！`,
        (text) => `${targetToneText}必入！${text}集美们冲就完事了~`,
        (text) => `绝绝子！${text}${targetToneText}风潮，这谁顶得住啊~`,
        (text) => `${text} 一整个${targetToneText}住了！爱了爱了~`,
        (text) => `${targetToneText}安利：${text} 闭眼入不踩雷！`,
        (text) => `咱就是说，${text} 一整个${targetToneText}的大动作！`,
        (text) => `wow~${text}狠狠心动了💓${targetToneText}天花板！`,
        (text) => `救命！${text}这也太${targetToneText}了吧！直接封神！`,
        (text) => `${targetToneText}DNA动了！${text}谁懂啊家人们😭`,
      ],
    };

    const strategies = toneStrategies[targetTone] || toneStrategies.professional;
    const results: Array<{ content: string; tags: string[] }> = [];
    const seen = new Set<string>();

    const shuffledStrategies = shuffleArray(strategies.map((fn, i) => ({ fn, idx: i })));

    for (let i = 0; i < shuffledStrategies.length && results.length < count; i++) {
      const { fn, idx } = shuffledStrategies[i];
      const content = fn(sourceCopy, i);
      const key = content.slice(0, 20);
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ content, tags: [`策略${idx + 1}`] });
      }
    }

    const exclamations = ['', '！', '！！', '！！！', '~', '~~', '！~', '（×ω×）', '✧', '♡'];
    const prefixes = ['', '🎉 ', '💯 ', '✨ ', '📢 ', '🔥 ', '⭐ ', '👉 ', '【强烈推荐】', '【划重点】', '【敲黑板】', '【分享】', '【必看】'];
    const suffixes = ['', ' #推荐', ' #安利', ' #种草', ' #必入', ' >戳我<', ' →了解更多', ' 点击查看', ' 欢迎咨询'];

    let extSeed = 0;
    while (results.length < count * 2) {
      const baseFn = strategies[(extSeed + results.length) % strategies.length];
      let content = baseFn(sourceCopy, extSeed);

      const prefix = prefixes[(extSeed + results.length) % prefixes.length];
      const excl = exclamations[(extSeed * 3) % exclamations.length];
      const suff = suffixes[(extSeed * 5) % suffixes.length];

      content = `${prefix}${content}${excl}${suff}`;

      const key = content.slice(0, 25);
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ content, tags: [`扩展${extSeed + 1}`] });
      }
      extSeed++;
      if (extSeed > 500) break;
    }

    const selected = results.slice(0, count);
    const candidates = selected.map((item, index) => ({
      content: item.content,
      score: 0.65 + (Math.random() * 0.35),
      tags: ['语气调整', targetToneText, ...item.tags, `版本${index + 1}`],
    }));

    return { id, candidates };
  }
}
