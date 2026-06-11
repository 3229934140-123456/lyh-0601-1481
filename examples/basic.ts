import { CopySDK } from '../src/index';
import type { ProductInfo, ToneStyle } from '../src/types';

async function main() {
  console.log('=== AI 文案生成 SDK 使用示例 ===\n');

  const sdk = new CopySDK({
    defaultToneStyle: 'professional',
    defaultCandidateCount: 3,
    enableSensitiveCheck: true,
    enableSorting: true,
    onGenerate: (record) => {
      console.log(`[生成记录] ${record.type} - ${record.status} (${record.duration}ms)`);
    },
    onError: (error, context) => {
      console.error(`[错误] ${error.message}`, context);
    },
  });

  const product: ProductInfo = {
    name: '智能降噪耳机 Pro',
    brand: 'SoundMax',
    category: '数码配件',
    price: 599,
    originalPrice: 899,
    features: ['主动降噪', '40小时续航', '蓝牙5.3', 'Hi-Fi音质', 'IPX5防水'],
    usageScenarios: ['通勤路上', '办公学习', '运动健身', '旅行出差'],
    targetAudience: {
      ageRange: [18, 45],
      gender: 'all',
      occupation: '白领/学生',
      interests: ['音乐', '科技', '健身'],
      consumptionLevel: 'medium',
      description: '追求品质生活的科技爱好者',
    },
    description: '一款高品质主动降噪蓝牙耳机，适合日常通勤和办公使用。',
  };

  console.log('1. 商品卖点生成');
  const sellingPoints = await sdk.generateSellingPoints({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 3,
    type: 'bullet',
  });
  sellingPoints.forEach((candidate, index) => {
    console.log(`  候选 ${index + 1} (评分: ${candidate.score.toFixed(2)})`);
    console.log(`    ${candidate.content.replace(/\n/g, '\n    ')}`);
    if (candidate.hasSensitive) {
      console.log(`    ⚠️  敏感词: ${candidate.sensitiveWords.map(w => w.word).join(', ')}`);
    }
  });
  console.log('');

  console.log('2. 标题改写生成');
  const titles = await sdk.generateTitles({
    productInfo: product,
    toneStyle: 'casual',
    candidateCount: 3,
    keywords: ['降噪', '无线', '长续航'],
    seoOptimized: true,
  });
  titles.forEach((candidate, index) => {
    console.log(`  标题 ${index + 1} (评分: ${candidate.score.toFixed(2)}): ${candidate.content}`);
  });
  console.log('');

  console.log('3. 短促销语生成');
  const promos = await sdk.generatePromoShorts({
    productInfo: product,
    toneStyle: 'urgent',
    candidateCount: 3,
    promotionType: 'discount',
    urgency: true,
    includePrice: true,
  });
  promos.forEach((candidate, index) => {
    console.log(`  促销 ${index + 1} (评分: ${candidate.score.toFixed(2)}): ${candidate.content}`);
  });
  console.log('');

  console.log('4. 长文扩写生成');
  const longForms = await sdk.generateLongForms({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 1,
    format: 'description',
    structure: 'intro_body_conclusion',
  });
  longForms.forEach((candidate, index) => {
    console.log(`  长文 ${index + 1} (评分: ${candidate.score.toFixed(2)})`);
    console.log(`    ${candidate.content.substring(0, 100)}...`);
  });
  console.log('');

  console.log('5. 语气调整');
  const sourceCopy = '这款耳机音质很好，降噪效果也不错。';
  console.log(`  原文: ${sourceCopy}`);
  const toneAdjusts = await sdk.adjustTone({
    sourceCopy,
    targetTone: 'youthful',
    candidateCount: 2,
  });
  toneAdjusts.forEach((candidate, index) => {
    console.log(`  调整后 ${index + 1}: ${candidate.content}`);
  });
  console.log('');

  console.log('6. 敏感词检测');
  const testText = '这是最好的产品，绝对100%有效，国家级品质保证！';
  const checkResult = sdk.checkSensitive(testText);
  console.log(`  检测文本: ${testText}`);
  console.log(`  是否含敏感词: ${checkResult.hasSensitive}`);
  console.log(`  风险等级: ${checkResult.level}`);
  if (checkResult.matches.length > 0) {
    console.log('  敏感词列表:');
    checkResult.matches.forEach((match) => {
      console.log(`    - ${match.word} (${match.category}, ${match.level})`);
      if (match.suggestion) {
        console.log(`      建议: ${match.suggestion}`);
      }
    });
  }
  const filtered = sdk.filterSensitiveText(testText);
  console.log(`  过滤后: ${filtered}`);
  console.log('');

  console.log('7. 模板管理');
  const template = sdk.addTemplate({
    name: '促销模板A',
    type: 'promo_short',
    content: '【{{brand}}】{{product}}限时{{discount}}折，原价{{originalPrice}}元现价{{price}}元！',
    description: '通用促销模板',
  });
  console.log(`  创建模板: ${template.name} (ID: ${template.id})`);
  console.log(`  模板变量: ${template.variables.join(', ')}`);

  const filled = sdk.fillTemplate(template.id, {
    brand: 'SoundMax',
    product: '降噪耳机',
    discount: '7',
    originalPrice: '899',
    price: '599',
  });
  console.log(`  填充结果: ${filled}`);

  const templates = sdk.listTemplates('promo_short');
  console.log(`  促销模板数量: ${templates.length}`);
  console.log('');

  console.log('8. 批量生成');
  const batchResults = await sdk.batchGenerate([
    {
      type: 'title',
      params: { productInfo: product, toneStyle: 'professional' as ToneStyle },
    },
    {
      type: 'promo_short',
      params: { productInfo: product, toneStyle: 'urgent' as ToneStyle, promotionType: 'limited' } as any,
    },
    {
      type: 'selling_point',
      params: { productInfo: product, toneStyle: 'casual' as ToneStyle },
    },
  ]);
  batchResults.forEach((result) => {
    console.log(`  ${result.type}: ${result.success ? '成功' : '失败'} (${result.candidates?.length || 0}条)`);
    if (!result.success) {
      console.log(`    错误: ${result.error}`);
    }
  });
  console.log('');

  console.log('9. 生成记录');
  const records = sdk.listGenerationRecords(undefined, 5);
  console.log(`  总记录数: ${sdk.getStatistics().total}`);
  console.log(`  成功: ${sdk.getStatistics().success}`);
  console.log(`  失败: ${sdk.getStatistics().failed}`);
  console.log(`  平均耗时: ${sdk.getStatistics().averageDuration.toFixed(0)}ms`);
  console.log('');

  console.log('=== 示例运行完成 ===');
}

main().catch(console.error);
