import { CopySDK } from '../src/index';
import type { ProductInfo, ToneStyle, LengthLimit } from '../src/types';

async function main() {
  console.log('=== AI 文案生成 SDK - 增强功能演示 ===\n');

  const sdk = new CopySDK({
    defaultToneStyle: 'professional',
    defaultCandidateCount: 5,
    enableSensitiveCheck: true,
    enableSorting: true,
    onGenerate: (record) => {
      console.log(`[生成记录] ${record.type} - ${record.status} - ${record.candidates.length}条候选 (${record.duration}ms)`);
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

  // ========== 1. 候选数量稳定性验证 ==========
  console.log('1. 候选数量稳定性验证（生成5条不同的长文）');
  const longForms = await sdk.generateLongForms({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 5,
    format: 'description',
  });
  console.log(`  实际返回: ${longForms.length} 条候选`);
  longForms.forEach((candidate, index) => {
    const firstLine = candidate.content.split('\n')[0].substring(0, 50);
    console.log(`  候选 ${index + 1}: ${firstLine}... (${candidate.content.length}字)`);
  });
  console.log('');

  // ========== 2. 语气调整多样性验证 ==========
  console.log('2. 语气调整多样性验证（生成5种不同风格）');
  const toneAdjusts = await sdk.adjustTone({
    sourceCopy: '这款耳机音质很好，降噪效果也不错。',
    targetTone: 'youthful',
    candidateCount: 5,
  });
  console.log(`  实际返回: ${toneAdjusts.length} 条候选`);
  toneAdjusts.forEach((candidate, index) => {
    console.log(`  版本 ${index + 1}: ${candidate.content.substring(0, 60)}...`);
  });
  console.log('');

  // ========== 3. 长度限制 - 很短限制 ==========
  console.log('3. 长度限制 - 很短限制（20字）');
  const shortLimit: LengthLimit = { max: 20, unit: 'char' };
  const shortTitles = await sdk.generateTitles({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 3,
    lengthLimit: shortLimit,
  });
  shortTitles.forEach((candidate, index) => {
    console.log(`  标题 ${index + 1} (${candidate.content.length}字): ${candidate.content}`);
    console.log(`    是否超限: ${candidate.content.length > 20 ? '是 ⚠️' : '否 ✓'}`);
  });
  console.log('');

  // ========== 4. 长度限制 - 中等限制 ==========
  console.log('4. 长度限制 - 中等限制（50字促销语）');
  const mediumLimit: LengthLimit = { max: 50, unit: 'char' };
  const mediumPromos = await sdk.generatePromoShorts({
    productInfo: product,
    toneStyle: 'urgent',
    candidateCount: 3,
    promotionType: 'discount',
    lengthLimit: mediumLimit,
  });
  mediumPromos.forEach((candidate, index) => {
    console.log(`  促销 ${index + 1} (${candidate.content.length}字): ${candidate.content}`);
    console.log(`    是否超限: ${candidate.content.length > 50 ? '是 ⚠️' : '否 ✓'}`);
  });
  console.log('');

  // ========== 5. 长度限制 - 长文截断 ==========
  console.log('5. 长度限制 - 长文截断（200字限制）');
  const longLimit: LengthLimit = { max: 200, unit: 'char' };
  const truncatedLong = await sdk.generateLongForms({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 2,
    format: 'description',
    lengthLimit: longLimit,
  });
  truncatedLong.forEach((candidate, index) => {
    console.log(`  长文 ${index + 1} (${candidate.content.length}字):`);
    console.log(`    ${candidate.content.replace(/\n/g, ' ').substring(0, 100)}...`);
    console.log(`    是否超限: ${candidate.content.length > 200 ? '是 ⚠️' : '否 ✓'}`);
    console.log(`    是否以...结尾: ${candidate.content.endsWith('...') ? '是 ✓' : '否'}`);
  });
  console.log('');

  // ========== 6. 质量报告 ==========
  console.log('6. 质量报告功能演示');
  const qualityCandidates = await sdk.generateSellingPoints({
    productInfo: product,
    toneStyle: 'professional',
    candidateCount: 3,
    keywords: ['降噪', '续航', '蓝牙'],
    lengthLimit: { max: 60, unit: 'char' },
  });

  const withQuality = sdk.generateQualityReports(qualityCandidates, {
    lengthLimit: { max: 60, unit: 'char' },
    keywords: ['降噪', '续航', '蓝牙'],
    productInfo: product,
  });

  withQuality.forEach((candidate, index) => {
    const qr = candidate.qualityReport!;
    console.log(`  候选 ${index + 1}: ${candidate.content.substring(0, 40)}...`);
    console.log(`    整体质量分: ${qr.overallScore.toFixed(2)}`);
    console.log(`    长度合规: ${qr.length.valid ? '✓' : '✗'} (${qr.length.currentLength}/${qr.length.maxLength}字)`);
    console.log(`    关键词覆盖: ${qr.keywords.includedKeywords.length}/${qr.keywords.missingKeywords.length + qr.keywords.includedKeywords.length}`);
    if (qr.keywords.missingKeywords.length > 0) {
      console.log(`      缺少: ${qr.keywords.missingKeywords.join(', ')}`);
    }
    console.log(`    核心信息完整度: ${(qr.coreInfo.completeness * 100).toFixed(0)}%`);
    if (qr.coreInfo.missingInfo.length > 0) {
      console.log(`      缺少: ${qr.coreInfo.missingInfo.join(', ')}`);
    }
    console.log(`    是否重复: ${qr.isDuplicate ? '是 ⚠️' : '否 ✓'}`);
    if (qr.suggestions.length > 0) {
      console.log(`    优化建议:`);
      qr.suggestions.forEach((s) => console.log(`      - ${s}`));
    }
    console.log('');
  });

  // ========== 7. 中文变量名模板 ==========
  console.log('7. 中文变量名模板支持');
  const cnTemplate = sdk.addTemplate({
    name: '中文促销模板',
    type: 'promo_short',
    content: '【{{品牌名}}】{{商品名}}限时{{折扣数}}折，活动价仅{{活动价}}元，原价{{原价}}元！',
    description: '使用中文变量名的促销模板',
  });
  console.log(`  模板名称: ${cnTemplate.name}`);
  console.log(`  识别到的变量: ${cnTemplate.variables.join(', ')}`);

  const cnFilled = sdk.fillTemplate(cnTemplate.id, {
    '品牌名': 'SoundMax',
    '商品名': '降噪耳机 Pro',
    '折扣数': '7',
    '活动价': '599',
    '原价': '899',
  });
  console.log(`  填充结果: ${cnFilled}`);
  console.log('');

  // ========== 8. 模板预览 ==========
  console.log('8. 模板预览功能');
  const partialVars = {
    '品牌名': 'SoundMax',
    '商品名': '降噪耳机 Pro',
    // 故意缺少折扣数、活动价等变量
  };
  const preview = sdk.previewTemplate(cnTemplate.id, partialVars);
  console.log(`  模板名称: ${preview.name}`);
  console.log(`  变量总数: ${preview.variables.length}`);
  console.log(`  已填充: ${preview.filledVariables.join(', ') || '无'}`);
  console.log(`  未填充: ${preview.missingVariables.join(', ') || '无'}`);
  console.log(`  是否完整: ${preview.isComplete ? '是' : '否'}`);
  console.log(`  预览内容: ${preview.previewContent}`);
  console.log('');

  // ========== 9. 批量模板填充 ==========
  console.log('9. 批量模板填充');

  const template2 = sdk.addTemplate({
    name: '短标题模板',
    type: 'title',
    content: '{{品牌}}{{产品}} - {{卖点}}',
  });

  const template3 = sdk.addTemplate({
    name: '卖点模板',
    type: 'selling_point',
    content: '【{{产品名}}】{{卖点1}}、{{卖点2}}、{{卖点3}}，值得拥有！',
  });

  const batchFillResults = sdk.batchFillTemplates([
    {
      templateId: cnTemplate.id,
      variables: {
        '品牌名': 'SoundMax',
        '商品名': '降噪耳机',
        '折扣数': '5',
        '活动价': '499',
        '原价': '999',
      },
    },
    {
      templateId: template2.id,
      variables: {
        '品牌': 'SoundMax ',
        '产品': '耳机',
        '卖点': '品质之选',
      },
    },
    {
      templateId: template3.id,
      variables: {
        '产品名': '智能耳机',
        '卖点1': '音质好',
        '卖点2': '续航长',
        // 缺少卖点3
      },
    },
  ]);

  batchFillResults.forEach((result, index) => {
    console.log(`  模板 ${index + 1}: ${result.templateName}`);
    console.log(`    成功: ${result.success ? '是' : '否'}`);
    if (result.success) {
      console.log(`    内容: ${result.content}`);
      console.log(`    已填充变量: ${result.filledVariables.join(', ')}`);
      if (result.missingVariables.length > 0) {
        console.log(`    缺少变量: ${result.missingVariables.join(', ')}`);
      }
    } else {
      console.log(`    错误: ${result.error}`);
    }
  });
  console.log('');

  // ========== 10. 内联模板填充 ==========
  console.log('10. 内联模板填充（不保存模板直接填充）');
  const inlineTemplate = '亲爱的{{用户名}}，您购买的{{商品名}}已发货，预计{{天数}}天内送达。';
  const inlineResult = sdk.fillTemplateContent(inlineTemplate, {
    '用户名': '张先生',
    '商品名': '智能耳机',
    '天数': '3',
  });
  console.log(`  模板: ${inlineTemplate}`);
  console.log(`  结果: ${inlineResult}`);
  console.log('');

  // ========== 11. truncateText 工具 ==========
  console.log('11. 文本截断工具');
  const longText = '这是一段很长的测试文本，用来验证截断功能是否正常工作。它包含了很多内容，我们希望在特定长度处进行优雅的截断，而不是简单地切断。';
  console.log(`  原文: ${longText} (${longText.length}字)`);

  const truncated30 = sdk.truncateText(longText, { max: 30, unit: 'char' });
  console.log(`  截到30字: ${truncated30} (${truncated30.length}字)`);

  const truncated50 = sdk.truncateText(longText, { max: 50, unit: 'char' });
  console.log(`  截到50字: ${truncated50} (${truncated50.length}字)`);
  console.log('');

  // ========== 12. 批量预览模板 ==========
  console.log('12. 批量预览模板');
  const batchPreviewResults = sdk.batchPreviewTemplates([
    {
      templateId: cnTemplate.id,
      variables: { '品牌名': 'TestBrand', '商品名': 'TestProduct' },
    },
    {
      templateId: template2.id,
      variables: { '品牌': 'B', '产品': 'P' },
    },
  ]);

  batchPreviewResults.forEach((result, index) => {
    console.log(`  预览 ${index + 1}: ${result.name}`);
    console.log(`    完整: ${result.isComplete ? '是' : '否'}`);
    console.log(`    预览: ${result.previewContent.substring(0, 50)}...`);
  });
  console.log('');

  console.log('=== 增强功能演示完成 ===');
}

main().catch(console.error);
