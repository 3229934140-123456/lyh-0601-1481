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

  private generateSellingPoints(id: string, params: SellingPointParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const features = product?.features || ['品质卓越', '性价比高', '值得信赖'];
    const tone = getToneStyleText(params.toneStyle);
    const category = product?.category || '精选好物';

    const templates: Array<() => string> = [
      () => `【${productName}】${features[0]}，${features[1]}，${features[2]}！`,
      () => `为什么选择${productName}？${features[0]}，${features[1]}，${features[2]}，给你${tone}体验。`,
      () => `${productName}核心卖点：\n1. ${features[0]}\n2. ${features[1]}\n3. ${features[2]}\n4. ${features[3] || '更多惊喜'}`,
      () => `${tone}风格：${productName}，不仅仅是产品，更是一种生活态度。${features[0]}，只为遇见更好的你。`,
      () => `精选推荐 | ${productName}\n- ${features[0]}\n- ${features[1]}\n- ${features[2]}\n- ${features[3] || '品质保障'}`,
      () => `${productName}——${category}中的${tone}之选。\n• ${features[0]}\n• ${features[1]}\n• ${features[2]}`,
      () => `懂生活的人选${productName}。\n${features[0]}，${features[1]}，${features[2]}。`,
      () => `【${tone}推荐】${productName}\n亮点一：${features[0]}\n亮点二：${features[1]}\n亮点三：${features[2]}\n亮点四：${features[3] || '好评如潮'}`,
      () => `${productName}，${category}新标杆！\n主打${features[0]}，兼顾${features[1]}，更有${features[2]}。`,
      () => `别再犹豫了！${productName}就是你要找的。\n${features[0]}，${features[1]}，${features[2]}，三重保障让你买得放心。`,
      () => `【用户好评】${productName}\n- ${features[0]}体验佳\n- ${features[1]}性能好\n- ${features[2]}很满意\n- 朋友都在问`,
      () => `${productName}为什么这么火？\n因为它${features[0]}，${features[1]}，${features[2]}，想不火都难！`,
    ];

    const shuffled = shuffleArray(templates);
    const selected = shuffled.slice(0, count);

    const candidates = selected.map((template, index) => ({
      content: template(),
      score: 0.65 + Math.random() * 0.35,
      tags: ['卖点', tone, category, `风格${index + 1}`],
    }));

    return { id, candidates };
  }

  private generateTitles(id: string, params: TitleParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const brand = product?.brand || '';
    const keywords = params.keywords || [];
    const tone = getToneStyleText(params.toneStyle);
    const category = product?.category || '精选好物';

    const templates: Array<() => string> = [
      () => {
        const parts = [brand, productName, ...keywords.slice(0, 2)].filter(Boolean);
        return parts.join(' ') + ' - ' + category;
      },
      () => `${tone}推荐！${productName}${keywords[0] ? ' ' + keywords[0] : ''}`,
      () => `【${brand || '热销'}】${productName} ${keywords.join(' ')}`,
      () => `${productName} - ${tone}之选，品质生活必备`,
      () => `${brand ? brand + ' ' : ''}${productName} | ${keywords.slice(0, 3).join(' · ')}`,
      () => `「${tone}好物」${productName} ${keywords.slice(0, 2).join(' ')}`,
      () => `${productName}${keywords[0] ? ' ' + keywords[0] : ''} - ${brand || '品牌直营'}`,
      () => `【${category}】${brand || ''}${productName} ${keywords.slice(0, 2).join(' ')}`,
      () => `${tone}榜单 | ${productName} - ${keywords[0] || category}首选`,
      () => `${brand ? brand + ' ' : ''}${productName}【${tone}品质】${keywords.slice(0, 2).join(' ')}`,
      () => `必入好物！${productName} ${keywords.slice(0, 2).join(' ')} ${category}`,
      () => `【限时特惠】${brand || ''}${productName} - ${tone}之选`,
    ];

    const shuffled = shuffleArray(templates);
    const selected = shuffled.slice(0, count);

    const candidates = selected.map((template, index) => ({
      content: template().replace(/\s+/g, ' ').trim(),
      score: 0.65 + Math.random() * 0.35,
      tags: ['标题', tone, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

  private generatePromoShorts(id: string, params: PromoShortParams, count: number): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const price = product?.price;
    const originalPrice = product?.originalPrice;
    const promotionType = params.promotionType || 'discount';
    const tone = getToneStyleText(params.toneStyle);
    const brand = product?.brand || '';

    const discount = originalPrice && price
      ? Math.round((1 - price / originalPrice) * 100)
      : 30;
    const savings = originalPrice && price ? originalPrice - price : 0;

    const allTemplates: Array<() => string> = [];

    const discountTemplates = [
      () => `限时${discount}折！${productName}，原价${originalPrice || 'XXX'}元，现价仅${price || 'XX'}元！`,
      () => `${tone}特惠 | ${productName}直降${savings || 'XX'}元，手慢无！`,
      () => `【史低价】${productName}仅${price || 'XX'}元，错过再等一年！`,
      () => `${brand ? brand + ' ' : ''}${productName}特惠：${discount}折疯抢，仅剩最后几小时！`,
      () => `打${discount}折了！${productName}${originalPrice ? `原价${originalPrice}元` : ''}，现价只要${price || 'XX'}元！`,
      () => `【超值优惠】${productName}直降${savings || 'XX'}元，${tone}推荐不容错过！`,
      () => `${tone}提醒：${productName}限时${discount}折优惠，数量有限先到先得！`,
      () => `${brand || '品牌'}大促！${productName}现价${price || 'XX'}元，立省${savings || 'XX'}元！`,
    ];

    const limitedTemplates = [
      () => `限量发售！${productName}仅剩最后100件，欲购从速！`,
      () => `${tone}提醒：${productName}限时供应，售完即止！`,
      () => `【稀缺好物】${productName}，数量有限，先到先得！`,
      () => `手慢无！${productName}仅剩最后50件，抢完恢复原价！`,
      () => `${tone}预警：${productName}库存告急，仅剩最后一批！`,
      () => `【限量抢】${productName}，全国限量${Math.floor(Math.random() * 500) + 100}份！`,
      () => `${productName}限时开售，${tone}推荐，错过等半年！`,
      () => `独家限量！${brand || ''}${productName}，卖完不补！`,
    ];

    const giftTemplates = [
      () => `买${productName}送好礼，赠品有限先到先得！`,
      () => `${tone}福利：购买${productName}即享赠品礼包！`,
      () => `【买一送一】${productName}，超值组合等你来！`,
      () => `${brand || '品牌'}回馈：买${productName}赠精美礼品一份！`,
      () => `${tone}惊喜：${productName}买即送，赠品价值${Math.floor(Math.random() * 100) + 50}元！`,
      () => `【超值套装】${productName} + 赠品，${tone}之选！`,
      () => `买就送！${productName}配套好礼等你拿，${tone}推荐！`,
      () => `${tone}福利时刻：${productName}买一赠N，错过太可惜！`,
    ];

    const newTemplates = [
      () => `新品上市！${productName}全新升级，抢先体验！`,
      () => `${tone}首发 | ${productName}新品来袭，限时优惠！`,
      () => `【全新上市】${productName}，带给你不一样的体验！`,
      () => `${brand || '品牌'}新品：${productName}焕新登场，${tone}首发！`,
      () => `新品驾到！${productName}全新升级，${tone}之选！`,
      () => `【抢先体验】${productName}新品首发，前100名享优惠！`,
      () => `${tone}新品推荐：${productName}，焕新你的生活！`,
      () => `全新${productName}，${tone}品质，全新体验！`,
    ];

    const hotTemplates = [
      () => `爆款热销！${productName}已售10万+，好评如潮！`,
      () => `${tone}力荐 | ${productName}全网热卖，错过后悔！`,
      () => `【人气王】${productName}，千万用户的共同选择！`,
      () => `销量王！${productName}累计销售${Math.floor(Math.random() * 50) + 10}万件！`,
      () => `${tone}推荐爆款：${productName}，大家都在买！`,
      () => `【断货王】${productName}，开售即爆款，回购率超高！`,
      () => `全网热销${productName}，${tone}品质，万人好评！`,
      () => `${brand || '品牌'}爆款${productName}，销量说话，${tone}之选！`,
    ];

    switch (promotionType) {
      case 'discount': allTemplates.push(...discountTemplates); break;
      case 'limited': allTemplates.push(...limitedTemplates); break;
      case 'gift': allTemplates.push(...giftTemplates); break;
      case 'new': allTemplates.push(...newTemplates); break;
      case 'hot': allTemplates.push(...hotTemplates); break;
      default: allTemplates.push(...discountTemplates);
    }

    const shuffled = shuffleArray(allTemplates);
    const selected = shuffled.slice(0, count);

    const candidates = selected.map((template, index) => ({
      content: template(),
      score: 0.65 + Math.random() * 0.35,
      tags: ['促销', promotionType, tone, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

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

    if (format === 'description') {
      templates.push(
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
${brand ? brand + ' ' : ''}${productName}，${category}中的品质之选。我们相信，好的产品自己会说话，而${productName}就是最好的证明。

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

        () => `${brand || ''}${productName}产品手册

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

以上就是本期${productName}全方位解析的全部内容，希望对大家有所帮助。`
      );
    }

    if (format === 'article') {
      templates.push(
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
如果你需要一款${tone}的${category}，${productName}绝对是一个不错的选择。综合评分：4.8分，值得入手！`
      );
    }

    if (format === 'review') {
      templates.push(
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
从用户反馈来看，${productName}的口碑确实不错。作为一款${tone}的${category}，它在${features[0]}、${features[1]}、${features[2]}等方面都表现出色，值得推荐。`
      );
    }

    if (format === 'guide') {
      templates.push(
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

以上就是今天要分享的内容啦，希望对大家有帮助。如果你有更多使用技巧，欢迎分享哦！`
      );
    }

    if (templates.length === 0) {
      templates.push(
        () => `${productName}产品说明

${productName}是一款${tone}的${category}，适用于${scenarios.join('、')}等多种场景。

产品特点：
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

${brand ? '品牌：' + brand : ''}
`,
        () => `${productName}介绍

欢迎了解${productName}。这是一款专为${audience}设计的${category}产品。

核心优势：
${features.map((f) => `• ${f}`).join('\n')}

适用场景：
${scenarios.map((s) => `• ${s}`).join('\n')}

选择${productName}，选择${tone}生活。`,
        () => `${productName}详情

产品名称：${productName}
产品分类：${category}
${brand ? '品牌：' + brand : ''}

产品特性：
${features.map((f) => `- ${f}`).join('\n')}

推荐场景：
${scenarios.map((s) => `- ${s}`).join('\n')}

${tone}品质，值得信赖。`
      );
    }

    const shuffled = shuffleArray(templates);
    const targetCount = count * 2;
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    while (selected.length < targetCount) {
      const baseTemplate = templates[selected.length % templates.length];
      const variation = this.createLongFormVariation(baseTemplate(), productName, features, selected.length);
      selected.push({ content: variation } as any);
    }

    const candidates = selected.map((item, index) => ({
      content: typeof item === 'function' ? item() : (item as any).content,
      score: 0.65 + Math.random() * 0.35,
      tags: ['长文', format, tone, `版本${index + 1}`],
    }));

    return { id, candidates };
  }

  private createLongFormVariation(base: string, productName: string, features: string[], seed: number): string {
    const variationTypes = [
      (text: string) => {
        const intro = `——${seed % 2 === 0 ? '深度测评' : '用户体验'}——\n\n`;
        return intro + text + `\n\n—— 以上为${seed % 3 === 0 ? '官方介绍' : '达人推荐'}内容 ——`;
      },
      (text: string) => {
        const lines = text.split('\n');
        const shuffled = shuffleArray(lines.filter(l => l.trim().length > 10));
        const extra = shuffled.slice(0, 2).join('\n\n');
        return text + `\n\n【补充说明${seed}】\n${extra}`;
      },
      (text: string) => {
        const quotes = [
          `"${features[seed % features.length]}，这一点我特别喜欢。" —— 用户评价`,
          `"${productName}是我今年买到的最满意的产品之一。" —— 达人推荐`,
          `"性价比很高，推荐给大家。" —— 真实买家`,
        ];
        return text + `\n\n用户怎么说：\n${quotes[seed % quotes.length]}`;
      },
      (text: string) => {
        const tips = [
          `小提示${seed + 1}：首次使用前请仔细阅读说明书，能够更好地发挥产品性能。`,
          `温馨提示：${productName}需定期保养，使用寿命更长哦~`,
          `使用技巧${seed + 1}：搭配配套产品使用，效果更佳。`,
        ];
        return text + `\n\n${tips[seed % tips.length]}`;
      },
      (text: string) => {
        const faqs = [
          `\n\n常见问题 Q${seed + 1}：\nQ: ${productName}适合什么样的人群？\nA: ${audienceFallback()}都可以使用。`,
          `\n\n购买指南：\n推荐理由${seed + 1}：${features[seed % features.length]}出众，值得拥有。`,
        ];
        return text + faqs[seed % faqs.length];
      },
      (text: string) => {
        return text.split('\n').map((line, idx) => {
          if (idx === 0) return `【版本${seed + 1}】${line}`;
          return line;
        }).join('\n');
      },
    ];

    let result = base;
    const startIdx = seed % variationTypes.length;
    for (let i = 0; i <= seed % 3; i++) {
      result = variationTypes[(startIdx + i) % variationTypes.length](result);
    }

    return result;

    function audienceFallback() {
      return features.length > 0 ? '追求' + features[0] + '的人' : '广大用户';
    }
  }

  private generateToneAdjusts(id: string, params: ToneAdjustParams, count: number): GenerateResponse {
    const sourceCopy = params.sourceCopy || '';
    const targetTone = params.targetTone;
    const targetToneText = getToneStyleText(targetTone);

    const toneStrategies: Record<string, Array<(text: string) => string>> = {
      formal: [
        (text) => `【${targetToneText}版】尊敬的用户，${text.replace(/！/g, '。').replace(/~/g, '')}感谢您的关注。`,
        (text) => `致尊敬的客户：\n\n${text.replace(/！/g, '。')}\n\n此致\n敬礼`,
        (text) => `${targetToneText}表述：经综合评估，${text.replace(/！/g, '。')}以上情况特此说明。`,
        (text) => `【官方说明】\n${text.replace(/！/g, '。')}\n\n本公司保留最终解释权。`,
        (text) => `关于「${text.substring(0, 10)}...」的${targetToneText}说明：\n${text.replace(/！/g, '。')}`,
        (text) => `${targetToneText}通知：${text.replace(/！/g, '。')}请知悉。`,
      ],
      casual: [
        (text) => `【${targetToneText}版】嘿~${text.replace(/。/g, '~')}超棒的有没有！`,
        (text) => `哈喽~跟你说个事，${text.replace(/。/g, '~')}是不是超赞的！`,
        (text) => `${targetToneText}版来啦~${text.replace(/。/g, '，')}懂的都懂~`,
        (text) => `嘿嘿，${text.replace(/。/g, '~')}就问你香不香！`,
        (text) => `咱就是说，${text.replace(/。/g, '~')}一整个爱住了~`,
        (text) => `${targetToneText}风~${text.replace(/。/g, '呀~')}`,
      ],
      humorous: [
        (text) => `【${targetToneText}版】笑死，${text}（狗头保命）`,
        (text) => `有内味儿了！${text}哈哈哈哈我先笑为敬~`,
        (text) => `${targetToneText}吐槽：${text}（不是我说的，是产品说的）`,
        (text) => `好家伙，${text} 我直呼内行！`,
        (text) => `笑不活了家人们，${text} 这波操作666~`,
        (text) => `${targetToneText}版 | ${text}（手动狗头乘N）`,
      ],
      professional: [
        (text) => `【${targetToneText}版】从专业角度来看，${text}该产品在同类竞品中表现优异。`,
        (text) => `${targetToneText}分析：${text}综合性能指标处于行业领先水平。`,
        (text) => `基于${targetToneText}评估，${text}具有较高的市场竞争力。`,
        (text) => `${targetToneText}解读：${text}其核心优势在于技术积累与品质把控。`,
        (text) => `【${targetToneText}评测】${text}\n\n结论：推荐购买。`,
        (text) => `${targetToneText}视角：${text}符合行业标准且具有创新性。`,
      ],
      warm: [
        (text) => `【${targetToneText}版】亲爱的朋友，${text}希望能给你带来温暖~`,
        (text) => `暖心推荐~${text}愿你每一天都被温柔以待。`,
        (text) => `${targetToneText}提示：${text}记得好好爱自己哦~`,
        (text) => `嘿，亲爱的~${text}有你真好。`,
        (text) => `${targetToneText}分享：${text}希望你会喜欢。`,
        (text) => `致特别的你：${text}`,
      ],
      urgent: [
        (text) => `【${targetToneText}版】紧急通知！${text}数量有限，速来抢购！`,
        (text) => `${targetToneText}提醒：${text}最后机会，错过再等一年！`,
        (text) => `【警告】${targetToneText}预警：${text}库存告急！`,
        (text) => `快！${text}${targetToneText}福利，手慢无！`,
        (text) => `【最后X小时】${text}${targetToneText}推荐，赶紧冲！`,
        (text) => `${targetToneText}！${text}再不行动就晚了！`,
      ],
      luxury: [
        (text) => `【${targetToneText}版】尊享品质，${text}彰显不凡品味。`,
        (text) => `${targetToneText}臻选：${text}为品质生活而生。`,
        (text) => `尊享${targetToneText}体验：${text}定义高端生活方式。`,
        (text) => `${targetToneText}之选：${text}，品质与格调兼具。`,
        (text) => `【${targetToneText}定制】${text}，只为懂生活的你。`,
        (text) => `${targetToneText}品质 | ${text}，匠心之作。`,
      ],
      youthful: [
        (text) => `【${targetToneText}版】yyds！${text}这也太绝了吧~冲鸭！`,
        (text) => `${targetToneText}必入！${text}集美们冲就完事了~`,
        (text) => `绝绝子！${text}${targetToneText}风潮，这谁顶得住啊~`,
        (text) => `${text} 一整个${targetToneText}住了！爱了爱了~`,
        (text) => `${targetToneText}安利：${text} 闭眼入不踩雷！`,
        (text) => `咱就是说，${text} 一整个${targetToneText}的大动作！`,
      ],
    };

    const strategies = toneStrategies[targetTone] || toneStrategies.professional;
    const shuffled = shuffleArray(strategies);
    const selected = shuffled.slice(0, count);

    while (selected.length < count) {
      const baseStrategy = strategies[selected.length % strategies.length];
      const idx = selected.length + 1;
      selected.push((text) => `${targetToneText}风格（${idx}）：${baseStrategy(text)}`);
    }

    const candidates = selected.map((strategy, index) => ({
      content: strategy(sourceCopy),
      score: 0.65 + Math.random() * 0.35,
      tags: ['语气调整', targetToneText, `版本${index + 1}`],
    }));

    return { id, candidates };
  }
}
