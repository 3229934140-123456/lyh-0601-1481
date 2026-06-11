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

  // ========== 13. 大量候选验证（20条标题 + 15条促销语） ==========
  console.log('13. 大量候选验证（20条标题、15条促销语）');
  const titles20 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 20,
    keywords: ['降噪', '蓝牙', '耳机'],
    lengthLimit: { max: 30, unit: 'char' },
  });
  console.log(`  标题: 请求20条，实际返回 ${titles20.length} 条`);
  const titleContents = titles20.map(t => t.content);
  const uniqueTitles = new Set(titleContents.map(c => c.substring(0, 15))).size;
  console.log(`  标题前缀不重复率: ${uniqueTitles}/${titles20.length} (${Math.round(uniqueTitles / titles20.length * 100)}%)`);
  titles20.slice(0, 5).forEach((t, i) => console.log(`    ${i + 1}. ${t.content}`));
  if (titles20.length > 5) console.log(`    ... (省略${titles20.length - 5}条)`);

  const promos15 = await sdk.generatePromoShorts({
    productInfo: product,
    candidateCount: 15,
    promotionType: 'discount',
    includePrice: true,
  });
  console.log(`  促销语: 请求15条，实际返回 ${promos15.length} 条`);
  const uniquePromos = new Set(promos15.map(p => p.content.substring(0, 10))).size;
  console.log(`  促销语前缀不重复率: ${uniquePromos}/${promos15.length} (${Math.round(uniquePromos / promos15.length * 100)}%)`);
  promos15.slice(0, 5).forEach((p, i) => console.log(`    ${i + 1}. ${p.content}`));
  if (promos15.length > 5) console.log(`    ... (省略${promos15.length - 5}条)`);
  console.log('');

  // ========== 14. 极短长度限制 + 截断标记 ==========
  console.log('14. 极短长度限制 + 截断标记判断');
  const testText = '这是一段用于验证极短长度限制的测试文本内容。';
  console.log(`  测试原文: ${testText}`);

  const edgeCases: Array<{ label: string; limit: LengthLimit }> = [
    { label: '0字上限', limit: { max: 0, unit: 'char' } },
    { label: '1字上限', limit: { max: 1, unit: 'char' } },
    { label: '2字上限', limit: { max: 2, unit: 'char' } },
    { label: '3字上限', limit: { max: 3, unit: 'char' } },
    { label: '0词上限', limit: { max: 0, unit: 'word' } },
    { label: '1词上限', limit: { max: 1, unit: 'word' } },
  ];

  for (const ec of edgeCases) {
    const detailed = sdk.truncateTextDetailed(testText, ec.limit);
    console.log(`  ${ec.label}: "${detailed.text}" (被截: ${detailed.wasTruncated ? '是' : '否'}, 原长:${detailed.originalLength}, 现长:${detailed.finalLength}${detailed.truncatePoint !== undefined ? ', 截点:' + detailed.truncatePoint : ''})`);
  }
  console.log('');

  // ========== 15. 生成长文并查看截断标记 ==========
  console.log('15. 生成5条短标题，检查截断标记');
  const ultraShortTitles = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    lengthLimit: { max: 10, unit: 'char' },
  });
  ultraShortTitles.forEach((t, i) => {
    const status = t.wasTruncated ? `[已截断 @${t.truncateInfo?.truncatePoint}字]` : '[完整]';
    console.log(`  ${i + 1}. ${t.content} ${status}`);
  });
  console.log('');

  // ========== 16. 批量质量对比报告 ==========
  console.log('16. 批量质量对比报告（相似组/关键词排名/排序理由）');
  const titlesForBatch = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 8,
    keywords: ['SoundMax', '降噪', '599', '蓝牙'],
  });
  const titlesWithQuality = sdk.generateQualityReports(titlesForBatch, {
    lengthLimit: { min: 8, max: 30, unit: 'char' },
    keywords: ['SoundMax', '降噪', '599', '蓝牙'],
    productInfo: product,
  });
  const batchReport = sdk.generateBatchQualityReport(titlesWithQuality, {
    lengthLimit: { min: 8, max: 30, unit: 'char' },
    keywords: ['SoundMax', '降噪', '599', '蓝牙'],
    productInfo: product,
    sortConfig: { criteria: ['keywords', 'quality', 'length'], weights: [0.4, 0.35, 0.25] },
  });

  console.log(`  总候选数: ${batchReport.totalCandidates}`);
  console.log(`  长度合规: ${batchReport.summary.totalValidLength}条  |  关键词全中: ${batchReport.summary.totalWithAllKeywords}条  |  重复: ${batchReport.summary.totalWithDuplicates}条  |  核心完整: ${batchReport.summary.totalCompleteCoreInfo}条`);
  console.log('');

  console.log('  [相似组]');
  if (batchReport.similarGroups.length === 0) console.log('    没有发现高度相似的文案');
  batchReport.similarGroups.forEach(g => {
    console.log(`    组${g.groupId}: ${g.candidateIds.length}条 (平均相似度${g.averageSimilarity}) 代表=${g.representativeId.substring(0, 10)}...`);
    console.log(`      成员: ${g.candidateIds.map(id => id.substring(0, 10) + '...').join(', ')}`);
  });
  console.log('');

  console.log('  [关键词覆盖 TOP3]');
  batchReport.keywordRanking.slice(0, 3).forEach((kr, idx) => {
    const cand = titlesWithQuality.find(c => c.id === kr.id);
    console.log(`    ${idx + 1}. 覆盖${Math.round(kr.inclusionRate * 100)}% (${kr.includedCount}个) -> ${cand?.content.substring(0, 25)}`);
  });
  console.log('');

  console.log('  [综合排序 TOP3 + 排序理由]');
  batchReport.rankedCandidates.slice(0, 3).forEach(rc => {
    const cand = titlesWithQuality.find(c => c.id === rc.id);
    console.log(`    第${rc.rank}名 -> ${cand?.content.substring(0, 28)}`);
    console.log(`      理由: ${rc.reasons.join('；')}`);
    console.log(`      关键词排#${rc.keywordRank} | 长度排#${rc.lengthRank} | 质量排#${rc.qualityRank}`);
  });
  console.log('');

  // ========== 17. 模板语法校验 ==========
  console.log('17. 模板语法校验（保存模板前检查）');
  const badTemplates = [
    { name: '正常模板', content: '【{{品牌名}}】{{商品名}}限时{{折扣数}}折，仅{{活动价}}元！' },
    { name: '未闭合占位符', content: '标题：{{商品名  限时特惠' },
    { name: '多余的闭合括号', content: '{{商品名}} 价格{{价格}}元}}' },
    { name: '空变量', content: '快来购买{{}}吧！' },
    { name: '非法变量名', content: '{{商品 名}} 仅{{原 价}}元' },
    { name: '重复变量', content: '{{品牌名}}荣誉出品{{品牌名}}{{商品名}}，来自{{品牌名}}' },
  ];

  badTemplates.forEach(bt => {
    const v = sdk.validateTemplateContent(bt.content);
    console.log(`  ${bt.name}: ${v.valid ? '✅通过' : '❌错误' + v.errorCount + '/' + '警告' + v.warningCount}`);
    v.issues.forEach(iss => {
      const pos = iss.position !== undefined ? `(位置${iss.position})` : '';
      console.log(`    [${iss.severity === 'error' ? '错' : '警'}]${pos} ${iss.message}`);
    });
    if (v.suggestion) console.log(`    建议: ${v.suggestion}`);
  });
  console.log('');

  // ========== 18. 批量模板健康度 ==========
  console.log('18. 批量模板健康度（预览哪些能正常填充）');

  const okTpl1 = sdk.addTemplate({
    name: '详情页顶部横幅',
    type: 'promo_short',
    content: '{{品牌名}}{{产品名}}专场｜原价{{原价}}元，现价{{活动价}}元，限量{{库存}}件',
  });
  const okTpl2 = sdk.addTemplate({
    name: '社交平台短文案',
    type: 'title',
    content: '种草{{产品名}}｜{{卖点1}}+{{卖点2}}，真的绝绝子！',
  });
  const badTpl = sdk.addTemplate({
    name: '有语法问题的模板',
    type: 'title',
    content: '{{商品名 未闭合括号测试',
  });

  const health = sdk.getBatchTemplateHealth([
    {
      templateId: okTpl1.id,
      variables: { '品牌名': 'SoundMax', '产品名': '耳机', '原价': '899', '活动价': '599', '库存': '100' },
    },
    {
      templateId: okTpl1.id,
      variables: { '品牌名': 'SoundMax', '产品名': '耳机' },
    },
    {
      templateId: okTpl2.id,
      variables: { '产品名': '降噪耳机', '卖点1': '音质好', '卖点2': '续航长' },
    },
    {
      templateId: okTpl2.id,
      variables: { '产品名': '降噪耳机' },
    },
    {
      templateId: badTpl.id,
      variables: {},
    },
  ]);

  console.log(`  共${health.totalTemplates}个模板组合：可填充${health.fillableTemplates}｜部分填充${health.partiallyFillable}｜不可用${health.unfillableTemplates}｜语法有效${health.validTemplates}个`);
  health.details.forEach(d => {
    const mark = d.canFill ? '🟢可完全填充' : d.fillPercentage > 0 ? '🟡部分填充' : '🔴不可填充';
    console.log(`  ${mark} ${d.templateName} (${d.fillPercentage}%)`);
    d.variables.forEach(v => console.log(`    ${v.filled ? '✅' : '❌'} {{${v.name}}}`));
    if (d.validation.issues.length > 0) {
      d.validation.issues.slice(0, 2).forEach(iss => console.log(`    [${iss.severity}]${iss.message}`));
    }
  });
  console.log('');

  // ========== 19. 可复现生成（相同 seed 稳定一致） ==========
  console.log('19. 可复现生成验证（相同 seed 返回相同结果）');
  const seed = 42;

  const run1 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed,
    keywords: ['降噪', '蓝牙', '耳机'],
  });

  const run2 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed,
    keywords: ['降噪', '蓝牙', '耳机'],
  });

  const sameOrder = run1.every((c, i) => c.content === run2[i].content);
  console.log(`  两次调用（相同 seed=42）：${sameOrder ? '✅结果完全一致' : '❌结果不一样'}`);
  console.log(`  第 1 条: "${run1[0].content}"`);
  console.log(`  第 3 条: "${run1[2].content}"`);
  console.log(`  第 5 条: "${run1[4].content}"`);

  const run3 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed: 100,
    keywords: ['降噪', '蓝牙', '耳机'],
  });
  const diffSeed = run1[0].content !== run3[0].content;
  console.log(`  不同 seed(42 vs 100)：${diffSeed ? '✅结果不同，seed 生效' : '❌结果一样，seed 无效'}`);
  console.log('');

  // ========== 20. 候选池配置 + 每条来源展示 ==========
  console.log('20. 候选池配置（风格偏好/禁用套路 + 每条命中来源）');

  console.log('  【默认池混合】5 条标题的风格分布：');
  const defaultTitles = await sdk.generateTitles({ productInfo: product, candidateCount: 8 });
  const poolStats: Record<string, number> = {};
  defaultTitles.forEach(t => {
    const style = t.poolInfo?.style || 'unknown';
    poolStats[style] = (poolStats[style] || 0) + 1;
  });
  console.log(`    风格分布: ${JSON.stringify(poolStats)}`);
  console.log('    前 3 条详情:');
  defaultTitles.slice(0, 3).forEach((t, i) => {
    console.log(`      ${i + 1}. [${t.poolInfo?.poolName || '未知'}] ${t.content.substring(0, 28)}...`);
    console.log(`         理由: ${t.poolInfo?.selectedReason}`);
  });

  console.log('');
  console.log('  【偏好种草风 + 禁用促销风】：');
  const grassRootsTitles = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    poolConfig: {
      preferredStyles: ['grassroots', 'youthful'],
      disabledStyles: ['promotion'],
    },
  });
  const grassPoolStats: Record<string, number> = {};
  grassRootsTitles.forEach(t => {
    const style = t.poolInfo?.style || 'unknown';
    grassPoolStats[style] = (grassPoolStats[style] || 0) + 1;
  });
  console.log(`    风格分布: ${JSON.stringify(grassPoolStats)}`);
  grassRootsTitles.slice(0, 3).forEach((t, i) => {
    console.log(`      ${i + 1}. [${t.poolInfo?.poolName || '未知'}] ${t.content.substring(0, 30)}...`);
  });

  console.log('');
  console.log('  【禁用套路："闭眼入"、"必入"】：');
  const noPatternTitles = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    poolConfig: {
      disabledPatterns: ['闭眼入', '必入', '赶紧'],
    },
  });
  const hitBanned = noPatternTitles.some(t =>
    ['闭眼入', '必入', '赶紧'].some(p => t.content.includes(p))
  );
  console.log(`    是否命中禁用套路: ${hitBanned ? '❌有命中' : '✅全部干净'}`);
  noPatternTitles.forEach((t, i) => {
    console.log(`      ${i + 1}. ${t.content.substring(0, 30)}...`);
  });
  console.log('');

  // ========== 21. 运营视角 V2 质量报告（场景推荐 + 排序依据） ==========
  console.log('21. 运营视角 V2 质量报告（场景推荐 + 排序依据）');

  const v2Candidates = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    keywords: ['SoundMax', '降噪', '599', '蓝牙'],
    lengthLimit: { min: 10, max: 30, unit: 'char' },
  });

  const withV2 = sdk.generateQualityReportsV2(v2Candidates, {
    lengthLimit: { min: 10, max: 30, unit: 'char' },
    keywords: ['SoundMax', '降噪', '599', '蓝牙'],
    productInfo: product,
    copyType: 'title',
  });

  withV2.slice(0, 3).forEach((c, idx) => {
    const v2 = c.qualityReportV2;
    console.log(`  第 ${idx + 1} 条: ${c.content.substring(0, 32)}...`);
    console.log(`    综合分: ${v2?.overallScore.toFixed(2)}  |  长度: ${v2?.length.currentLength}字`);
    console.log(`    排序依据: ${v2?.rankingBasis.slice(0, 4).join(' / ')}`);
    console.log(`    推荐场景: ${v2?.recommendScenarios.slice(0, 3).map(s =>
      `${s.scenario}(${Math.round(s.fitScore * 100)}%)`
    ).join('、')}`);
    if (v2?.recommendScenarios[0]) {
      console.log(`    最佳场景理由: ${v2.recommendScenarios[0].reason}`);
    }
    console.log(`    来源池: ${c.poolInfo?.poolName} (匹配度${Math.round((c.poolInfo?.matchScore || 0) * 100)}%)`);
  });
  console.log('');

  // ========== 22. 严格数量控制（开关任何功能都返回指定条数） ==========
  console.log('22. 严格数量控制验证');

  const testCases = [
    { name: '默认配置（全功能开）', opts: { enableDeduplication: true, enableSorting: true, enableQualityCheck: false }, count: 5 },
    { name: '关闭去重', opts: { enableDeduplication: false, enableSorting: true, enableQualityCheck: false }, count: 5 },
    { name: '关闭排序', opts: { enableDeduplication: true, enableSorting: false, enableQualityCheck: false }, count: 5 },
    { name: '关闭去重+排序', opts: { enableDeduplication: false, enableSorting: false, enableQualityCheck: false }, count: 5 },
    { name: '全开 + 质量检查', opts: { enableDeduplication: true, enableSorting: true, enableQualityCheck: true }, count: 7 },
    { name: '长文关闭去重（要 5 条回 5 条）', opts: { enableDeduplication: false, enableSorting: true, enableQualityCheck: false }, count: 5, type: 'long_form' as const },
  ];

  for (const tc of testCases) {
    const params: any = { productInfo: product, candidateCount: tc.count };
    let result;
    if (tc.type === 'long_form') {
      result = await sdk.generateLongForms(params, tc.opts as any);
    } else {
      result = await sdk.generateTitles(params, tc.opts as any);
    }
    const status = result.length === tc.count ? '✅' : '❌';
    console.log(`  ${status} ${tc.name}: 请求${tc.count}条，实际返回 ${result.length} 条`);
  }
  console.log('');

  // ========== 23. 候选池严格可控生成 ==========
  console.log('23. 候选池严格可控生成（偏好风格+禁用+严格模式）');

  console.log('  【偏好官方风 + 禁用促销/爆款风】');
  const strictTitles = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed: 42,
    poolConfig: {
      preferredStyles: ['official', 'grassroots'],
      disabledStyles: ['promotion', 'bestseller'],
    },
  });
  const styleDist1: Record<string, number> = {};
  strictTitles.forEach(c => {
    const s = c.poolInfo?.style || 'unknown';
    styleDist1[s] = (styleDist1[s] || 0) + 1;
  });
  console.log(`    风格分布: ${JSON.stringify(styleDist1)}`);
  console.log(`    是否混入禁用风格(promotion/bestseller): ${
    strictTitles.some(c => c.poolInfo?.style === 'promotion' || c.poolInfo?.style === 'bestseller') ? '❌是' : '✅否'
  }`);
  console.log(`    偏好风格(official/grassroots)占比: ${
    Math.round(strictTitles.filter(c => c.poolInfo?.isPreferred).length / strictTitles.length * 100)
  }%`);
  strictTitles.slice(0, 3).forEach((c, i) => {
    console.log(`      ${i + 1}. [${c.poolInfo?.poolName}${c.poolInfo?.isPreferred ? '★偏好' : ''}] ${c.content.substring(0, 35)}...`);
  });

  console.log('  【禁用套路："闭眼入"、"必入" + 自动补足足量】');
  const noPatternTitles2 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 6,
    seed: 42,
    poolConfig: {
      disabledPatterns: ['闭眼入', '必入'],
    },
  });
  const hitBad = noPatternTitles2.some(c => c.content.includes('闭眼入') || c.content.includes('必入'));
  console.log(`    6条中是否仍有禁用套路: ${hitBad ? '❌是' : '✅否'}`);
  console.log(`    实际返回数量: ${noPatternTitles2.length} (要求6条) ${noPatternTitles2.length === 6 ? '✅足量' : '❌不足'}`);

  console.log('  【strictMode：只保留官方+种草风，其他全部过滤并补足】');
  const strictOnlyTitles = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 4,
    seed: 42,
    poolConfig: {
      preferredStyles: ['official', 'grassroots'],
      strictMode: true,
    },
  });
  const allPref = strictOnlyTitles.every(c => c.poolInfo?.style === 'official' || c.poolInfo?.style === 'grassroots');
  console.log(`    严格模式后全部命中偏好风格: ${allPref ? '✅是' : '❌否'}`);
  console.log(`    返回数量: ${strictOnlyTitles.length} (要求4条) ${strictOnlyTitles.length === 4 ? '✅足量' : '❌不足'}`);
  console.log('');

  // ========== 24. 整组文案投放决策（主推/备选/淘汰 + 适配渠道） ==========
  console.log('24. 整组文案投放决策（自动分档+渠道推荐）');

  const tenderResult = await sdk.generateAdvanced('title', {
    productInfo: product,
    candidateCount: 8,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
  }, {
    enableQualityCheck: true,
    enableSorting: true,
    returnTenderDecisions: true,
  });

  const byTier: Record<string, typeof tenderResult.candidates> = { main_push: [], backup: [], eliminated: [] };
  tenderResult.candidates.forEach(c => {
    const t = c.tenderDecision?.tier || 'backup';
    if (byTier[t]) byTier[t].push(c);
  });

  console.log(`  分档结果: 主推${byTier.main_push.length}条 / 备选${byTier.backup.length}条 / 淘汰${byTier.eliminated.length}条`);
  console.log('');

  byTier.main_push.slice(0, 2).forEach((c, i) => {
    const td = c.tenderDecision!;
    console.log(`  🎯 主推 #${i + 1}: ${c.content.substring(0, 40)}...`);
    console.log(`     综合分: ${((c.qualityReportV2?.overallScore ?? c.score ?? 0) * 100).toFixed(0)}分  |  首选渠道: ${td.primaryChannelName}(${Math.round(td.primaryChannelFit * 100)}%)`);
    console.log(`     适配渠道: ${td.suitableChannels.map(sc => `${sc.scenarioName}(${Math.round(sc.fitScore * 100)}%)`).join('、')}`);
    console.log(`     决策依据: ${td.decisionReason.slice(0, 3).join('；')}`);
  });
  console.log('');

  byTier.backup.slice(0, 2).forEach((c, i) => {
    const td = c.tenderDecision!;
    console.log(`  📋 备选 #${i + 1}: ${c.content.substring(0, 40)}...`);
    console.log(`     首选渠道: ${td.primaryChannelName}(${Math.round(td.primaryChannelFit * 100)}%)  |  适配: ${td.suitableChannels.slice(0, 2).map(sc => sc.scenarioName).join('、')}`);
  });
  console.log('');

  if (byTier.eliminated.length > 0) {
    byTier.eliminated.slice(0, 2).forEach((c, i) => {
      const td = c.tenderDecision!;
      console.log(`  ❌ 淘汰 #${i + 1}: ${c.content.substring(0, 40)}...`);
      console.log(`     原因: ${td.decisionReason.join('；')}`);
    });
  }
  console.log('');

  // ========== 25. 可复现追踪信息（seed+过滤详情+排序依据） ==========
  console.log('25. 可复现追踪信息（A/B 测试回放）');

  const traceResult = await sdk.generateAdvanced('title', {
    productInfo: product,
    candidateCount: 5,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
    poolConfig: {
      preferredStyles: ['official', 'grassroots'],
      disabledPatterns: ['闭眼入'],
    },
  }, {
    returnTrace: true,
    enableDeduplication: true,
    enableSorting: true,
    enableQualityCheck: true,
    autoRefillOnFilter: true,
  });

  const trace = traceResult.trace!;
  console.log(`  📌 seed: ${trace.seed}`);
  console.log(`  📌 目标数量: ${trace.targetCount}  实际返回: ${traceResult.candidates.length}`);
  console.log(`  📌 原始生成: ${trace.rawGeneratedCount}条  |  补位数量: ${trace.refillCount}条`);
  console.log(`  📌 过滤统计: 池过滤${trace.poolFilteredCount}条 / 去重${trace.deduplicationRemovedCount}条 / 质量${trace.qualityFilteredCount}条 / 敏感词${trace.sensitiveFilteredCount}条 / 长度${trace.lengthFilteredCount}条 / 关键词${trace.keywordFilteredCount}条`);
  console.log(`  📌 排序依据: ${trace.rankingBasis.join(' / ')}`);
  console.log(`  📌 偏好风格分布: ${JSON.stringify(trace.styleDistribution)}`);
  console.log(`  📌 耗时: ${trace.generationTimeMs}ms`);
  console.log('');
  if (trace.filteredCandidates.length > 0) {
    console.log(`  🔍 被过滤的候选示例（前3条）:`);
    trace.filteredCandidates.slice(0, 3).forEach((f, i) => {
      console.log(`     ${i + 1}. [${f.filterType}] ${f.filterReason}`);
      console.log(`        内容: ${f.content.substring(0, 35)}...`);
    });
  }
  console.log('');

  // ========== 26. 过滤后稳定输出（敏感词+质量+长度+关键词多层过滤自动补位） ==========
  console.log('26. 过滤后稳定输出（多层过滤自动补位保证数量和长度）');

  console.log('  【全开严格过滤：质量阈值0.8 + 关键词全覆盖 + 长度10~25字 + 敏感词】');
  const robustTitles = await sdk.generateAdvanced('title', {
    productInfo: product,
    candidateCount: 6,
    seed: 42,
    keywords: ['降噪', '蓝牙'],
    lengthLimit: { min: 10, max: 25 },
  }, {
    autoRefillOnFilter: true,
    strictPoolFilter: true,
    enableQualityCheck: true,
    enableSensitiveCheck: true,
    enableDeduplication: true,
    enableSorting: true,
    qualityThreshold: 0.7,
    returnTrace: true,
  });
  const rt = robustTitles.trace!;
  const allCountOk = robustTitles.candidates.length === 6;
  const allLenOk = robustTitles.candidates.every(c => {
    const l = Array.from(c.content).length;
    return l >= 10 && l <= 25;
  });
  const allKwOk = robustTitles.candidates.every(c =>
    c.content.includes('降噪') || c.content.includes('蓝牙')
  );

  console.log(`    ✅ 数量: ${robustTitles.candidates.length} / 6 ${allCountOk ? '达标' : '不足'}`);
  console.log(`    ✅ 长度合规(10~25字): ${allLenOk ? '全部达标' : '有违规'}`);
  robustTitles.candidates.forEach((c, i) => {
    const l = Array.from(c.content).length;
    console.log(`       #${i + 1} ${l}字: ${c.content.substring(0, 30)}...`);
  });
  console.log(`    ✅ 关键词覆盖(降噪/蓝牙): ${allKwOk ? '全部覆盖' : '有缺失'}`);
  console.log(`    ✅ 过滤补位记录: 质量${rt.qualityFilteredCount} / 长度${rt.lengthFilteredCount} / 关键词${rt.keywordFilteredCount} / 去重${rt.deduplicationRemovedCount} / 补位${rt.refillCount}`);
  console.log('');

  console.log('  【长文扩写：多层过滤后严格返回 5 条】');
  const robustLong = await sdk.generateAdvanced('long_form', {
    productInfo: product,
    candidateCount: 5,
    seed: 42,
    keywords: ['降噪', '蓝牙'],
  }, {
    autoRefillOnFilter: true,
    enableDeduplication: true,
    enableQualityCheck: true,
    enableSorting: true,
    qualityThreshold: 0.6,
    returnTrace: true,
  });
  const rlt = robustLong.trace!;
  console.log(`    ✅ 长文数量: ${robustLong.candidates.length} / 5 ${robustLong.candidates.length === 5 ? '达标' : '不足'}`);
  console.log(`    ✅ 过滤补位记录: 池${rlt.poolFilteredCount} / 去重${rlt.deduplicationRemovedCount} / 质量${rlt.qualityFilteredCount} / 补位${rlt.refillCount}`);

  console.log('');
  console.log('=== 全部增强功能演示完成 ===');
}

main().catch(console.error);
