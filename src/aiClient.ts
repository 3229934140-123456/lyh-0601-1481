import type {
  CopyType,
  BaseGenerateParams,
  SellingPointParams,
  TitleParams,
  PromoShortParams,
  LongFormParams,
  ToneAdjustParams,
  ProductInfo,
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
        return this.generateSellingPoints(id, params as SellingPointParams);
      case 'title':
        return this.generateTitles(id, params as TitleParams);
      case 'promo_short':
        return this.generatePromoShorts(id, params as PromoShortParams);
      case 'long_form':
        return this.generateLongForms(id, params as LongFormParams);
      case 'tone_adjust':
        return this.generateToneAdjusts(id, params as ToneAdjustParams);
      default:
        return { id, candidates: [] };
    }
  }

  private generateSellingPoints(id: string, params: SellingPointParams): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const features = product?.features || [];
    const tone = getToneStyleText(params.toneStyle);
    const count = params.candidateCount || 3;

    const templates = [
      () => `【${productName}】${features[0] || '品质卓越'}，${features[1] || '性价比超高'}，${features[2] || '值得拥有'}！`,
      () => `为什么选择${productName}？${features[0] || '优质材料'}，${features[1] || '精湛工艺'}，${features[2] || '贴心服务'}，给你${tone}体验。`,
      () => `${productName}核心卖点：\n1. ${features[0] || '高品质'}\n2. ${features[1] || '优价格'}\n3. ${features[2] || '好服务'}`,
      () => `${tone}风格：${productName}，不仅仅是产品，更是一种生活态度。${features[0] || '用心打造'}，只为遇见更好的你。`,
      () => `精选推荐 | ${productName}\n✅ ${features[0] || '正品保证'}\n✅ ${features[1] || '极速发货'}\n✅ ${features[2] || '无忧售后'}`,
    ];

    const candidates = [];
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      candidates.push({
        content: template(),
        score: 0.7 + Math.random() * 0.3,
        tags: ['卖点', tone, product?.category || '通用'],
      });
    }

    return { id, candidates };
  }

  private generateTitles(id: string, params: TitleParams): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const brand = product?.brand || '';
    const keywords = params.keywords || [];
    const tone = getToneStyleText(params.toneStyle);
    const count = params.candidateCount || 3;

    const templates = [
      () => {
        const parts = [brand, productName, ...keywords.slice(0, 2)].filter(Boolean);
        return parts.join(' ') + ' - ' + (product?.category || '精选好物');
      },
      () => `${tone}推荐！${productName}${keywords[0] ? ' ' + keywords[0] : ''}`,
      () => `【${brand || '热销'}】${productName} ${keywords.join(' ')}`,
      () => `${productName} - ${tone}之选，品质生活必备`,
      () => `${brand ? brand + ' ' : ''}${productName} | ${keywords.slice(0, 3).join(' · ')}`,
    ];

    const candidates = [];
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      candidates.push({
        content: template(),
        score: 0.7 + Math.random() * 0.3,
        tags: ['标题', tone, 'SEO友好'],
      });
    }

    return { id, candidates };
  }

  private generatePromoShorts(id: string, params: PromoShortParams): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const price = product?.price;
    const originalPrice = product?.originalPrice;
    const promotionType = params.promotionType || 'discount';
    const tone = getToneStyleText(params.toneStyle);
    const count = params.candidateCount || 3;

    const discount = originalPrice && price
      ? Math.round((1 - price / originalPrice) * 100)
      : 30;

    const templatesByType: Record<string, (() => string)[]> = {
      discount: [
        () => `限时${discount}折！${productName}，原价${originalPrice || 'XXX'}元，现价仅${price || 'XX'}元！`,
        () => `${tone}特惠 | ${productName}直降${originalPrice && price ? originalPrice - price : 'XX'}元，手慢无！`,
        () => `【史低价】${productName}仅${price || 'XX'}元，错过再等一年！`,
      ],
      limited: [
        () => `限量发售！${productName}仅剩最后100件，欲购从速！`,
        () => `${tone}提醒：${productName}限时供应，售完即止！`,
        () => `【稀缺好物】${productName}，数量有限，先到先得！`,
      ],
      gift: [
        () => `买${productName}送好礼，赠品有限先到先得！`,
        () => `${tone}福利：购买${productName}即享赠品礼包！`,
        () => `【买一送一】${productName}，超值组合等你来！`,
      ],
      new: [
        () => `新品上市！${productName}全新升级，抢先体验！`,
        () => `${tone}首发 | ${productName}新品来袭，限时优惠！`,
        () => `【全新上市】${productName}，带给你不一样的体验！`,
      ],
      hot: [
        () => `爆款热销！${productName}已售10万+，好评如潮！`,
        () => `${tone}力荐 | ${productName}全网热卖，错过后悔！`,
        () => `【人气王】${productName}，千万用户的共同选择！`,
      ],
    };

    const templates = templatesByType[promotionType] || templatesByType.discount;

    const candidates = [];
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      candidates.push({
        content: template(),
        score: 0.7 + Math.random() * 0.3,
        tags: ['促销', promotionType, tone],
      });
    }

    return { id, candidates };
  }

  private generateLongForms(id: string, params: LongFormParams): GenerateResponse {
    const product = params.productInfo;
    const productName = product?.name || '商品';
    const features = product?.features || ['高品质', '优价格', '好服务'];
    const scenarios = product?.usageScenarios || ['日常使用', '送礼佳品', '办公必备'];
    const tone = getToneStyleText(params.toneStyle);
    const format = params.format || 'description';
    const count = params.candidateCount || 3;

    const formats: Record<string, (() => string)[]> = {
      description: [
        () =>
`${productName}产品介绍

【产品简介】
${productName}是一款专为${product?.targetAudience?.description || '追求品质生活的你'}打造的${product?.category || '精品好物'}。我们深知你对品质的追求，因此每一个细节都经过精心打磨。

【核心特点】
${features.map((f, i) => `${i + 1}. ${f}：为你带来卓越体验`).join('\n')}

【使用场景】
${scenarios.map((s) => `• ${s}`).join('\n')}

【品牌承诺】
我们坚持${tone}的品质标准，只为给你最好的使用体验。选择${productName}，选择品质生活。`,
      ],
      article: [
        () =>
`为什么${productName}值得你拥有？

在快节奏的现代生活中，我们都在寻找那些能够真正提升生活品质的好物。今天，我要向大家推荐的${productName}，就是这样一款让人眼前一亮的产品。

初识${productName}，你会被它的${features[0] || '精致外观'}所吸引。但真正打动人心的，是它${features[1] || '卓越的性能'}和${features[2] || '贴心的设计'}。

${scenarios[0] || '日常生活'}中，${productName}能够...
${scenarios[1] || '工作场合'}里，${productName}可以...

总的来说，${productName}不仅仅是一款产品，更是一种生活态度的体现。如果你也在寻找${tone}的好物，那么${productName}绝对值得一试。`,
      ],
      review: [
        () =>
`【真实评测】${productName}使用一个月后，我想说...

作为一个对生活品质有要求的人，我一直在寻找${tone}的好物。最近入手了${productName}，使用了一个月，来和大家分享一下我的真实感受。

🔹 外观设计：⭐⭐⭐⭐⭐
${features[0] || '简约大方'}，手感很好，细节处理到位。

🔹 使用体验：⭐⭐⭐⭐⭐
${features[1] || '操作简单'}，效果超出预期，每天都在用。

🔹 性价比：⭐⭐⭐⭐☆
价格虽然不算便宜，但考虑到${features[2] || '品质和体验'}，绝对物有所值。

【总结】
如果你正在寻找${product?.category || '这类产品'}，强烈推荐${productName}。真的是用过就回不去的那种好！`,
      ],
      guide: [
        () =>
`${productName}完全使用指南

欢迎阅读${productName}使用指南！本文将带你全面了解这款产品，让你轻松上手，尽享${tone}体验。

【产品概览】
${productName}是一款${product?.category || '多功能产品'}，适用于${scenarios.join('、')}等多种场景。

【快速开始】
1. 开箱检查
2. 初次使用
3. 日常维护

【核心功能详解】
${features.map((f, i) => `功能${i + 1}：${f}\n   详细说明：...\n   使用技巧：...`).join('\n\n')}

【常见问题】
Q: 如何保养？
A: ...

Q: 出现问题怎么办？
A: ...

希望这份指南能帮助你更好地使用${productName}。如有其他问题，欢迎随时联系我们！`,
      ],
    };

    const templates = formats[format] || formats.description;

    const candidates = [];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const template = templates[i % templates.length];
      candidates.push({
        content: template(),
        score: 0.7 + Math.random() * 0.3,
        tags: ['长文', format, tone],
      });
    }

    return { id, candidates };
  }

  private generateToneAdjusts(id: string, params: ToneAdjustParams): GenerateResponse {
    const sourceCopy = params.sourceCopy || '';
    const targetTone = params.targetTone;
    const targetToneText = getToneStyleText(targetTone);
    const count = params.candidateCount || 3;

    const toneTransforms: Record<string, (text: string) => string> = {
      formal: (text) => `【${targetToneText}版】尊敬的用户，${text.replace(/！/g, '。').replace(/~/g, '')}`,
      casual: (text) => `【${targetToneText}版】嘿～${text.replace(/。/g, '～')}超棒的有没有！`,
      humorous: (text) => `【${targetToneText}版】笑死，${text}（狗头保命）`,
      professional: (text) => `【${targetToneText}版】从专业角度来看，${text}该产品在同类竞品中表现优异。`,
      warm: (text) => `【${targetToneText}版】亲爱的朋友，${text}希望能给你带来温暖～`,
      urgent: (text) => `【${targetToneText}版】紧急通知！${text}数量有限，速来抢购！`,
      luxury: (text) => `【${targetToneText}版】尊享品质，${text}彰显不凡品味。`,
      youthful: (text) => `【${targetToneText}版】yyds！${text}这也太绝了吧～冲鸭！`,
    };

    const transform = toneTransforms[targetTone] || ((t) => t);

    const candidates = [];
    for (let i = 0; i < count; i++) {
      candidates.push({
        content: transform(sourceCopy),
        score: 0.7 + Math.random() * 0.3,
        tags: ['语气调整', targetToneText],
      });
    }

    return { id, candidates };
  }
}
