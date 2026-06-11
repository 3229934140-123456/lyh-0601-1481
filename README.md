# AI 文案生成 SDK

统一的电商、活动运营和内容工具文案生成能力 SDK。

## 功能概览

- **商品卖点生成** - 根据商品信息生成多条卖点文案
- **标题改写** - 生成 SEO 优化的商品标题
- **短促销语** - 生成各类促销场景的短文案
- **长文扩写** - 生成产品描述、评测文章等长文案
- **语气调整** - 将已有文案调整为目标语气风格
- **敏感词提示** - 检测文案中的敏感词并给出替换建议
- **候选结果排序** - 多维度智能排序候选文案
- **批量生成** - 一次请求生成多种类型文案
- **模板变量填充** - 自定义模板，支持变量替换
- **生成记录回传** - 完整记录每次生成请求和结果
- **失败重试** - 自动重试机制，保障调用成功率

## 安装

```bash
npm install ai-copy-sdk
```

## 快速开始

### 1. 初始化 SDK

```typescript
import { CopySDK } from 'ai-copy-sdk';

const sdk = new CopySDK({
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.example.com',
  model: 'gpt-3.5-turbo',
  defaultToneStyle: 'professional',
  defaultCandidateCount: 3,
  enableSensitiveCheck: true,
  enableSorting: true,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
  onGenerate: (record) => {
    console.log(`生成完成: ${record.type} - ${record.status}`);
  },
  onError: (error, context) => {
    console.error('生成出错:', error.message);
  },
});
```

### 2. 单条生成

#### 2.1 商品卖点生成

```typescript
const sellingPoints = await sdk.generateSellingPoints({
  productInfo: {
    name: '智能降噪耳机 Pro',
    brand: 'SoundMax',
    price: 599,
    features: ['主动降噪', '40小时续航', '蓝牙5.3'],
  },
  toneStyle: 'professional',
  candidateCount: 3,
  type: 'bullet',
});

sellingPoints.forEach((candidate) => {
  console.log(candidate.content);
  console.log('评分:', candidate.score);
  console.log('含敏感词:', candidate.hasSensitive);
});
```

#### 2.2 标题生成

```typescript
const titles = await sdk.generateTitles({
  productInfo: product,
  toneStyle: 'casual',
  keywords: ['降噪', '无线', '长续航'],
  seoOptimized: true,
  includeBrand: true,
});
```

#### 2.3 短促销语生成

```typescript
const promos = await sdk.generatePromoShorts({
  productInfo: product,
  toneStyle: 'urgent',
  promotionType: 'discount',
  urgency: true,
  includePrice: true,
});
```

促销类型支持：
- `discount` - 折扣促销
- `limited` - 限量发售
- `gift` - 买赠活动
- `new` - 新品上市
- `hot` - 爆款热销

#### 2.4 长文扩写

```typescript
const longForms = await sdk.generateLongForms({
  productInfo: product,
  toneStyle: 'professional',
  format: 'description',
  structure: 'intro_body_conclusion',
  sections: ['产品简介', '核心特点', '使用场景', '品牌承诺'],
});
```

长文格式支持：
- `article` - 文章
- `description` - 产品描述
- `review` - 评测
- `guide` - 使用指南

#### 2.5 语气调整

```typescript
const adjusted = await sdk.adjustTone({
  sourceCopy: '这款耳机音质很好，降噪效果也不错。',
  targetTone: 'youthful',
  keepMeaning: true,
});
```

语气风格支持：
- `formal` - 正式
- `casual` - 轻松
- `humorous` - 幽默
- `professional` - 专业
- `warm` - 温暖
- `urgent` - 紧迫
- `luxury` - 奢华
- `youthful` - 年轻

### 3. 批量生成

```typescript
const results = await sdk.batchGenerate([
  {
    type: 'title',
    params: { productInfo: product, toneStyle: 'professional' },
  },
  {
    type: 'promo_short',
    params: { productInfo: product, toneStyle: 'urgent', promotionType: 'limited' },
  },
  {
    type: 'selling_point',
    params: { productInfo: product, toneStyle: 'casual' },
  },
]);

results.forEach((result) => {
  if (result.success) {
    console.log(`${result.type}: ${result.candidates?.length} 条候选`);
  } else {
    console.error(`${result.type} 失败: ${result.error}`);
  }
});
```

### 4. 模板管理

#### 4.1 创建模板

```typescript
const template = sdk.addTemplate({
  name: '促销模板A',
  type: 'promo_short',
  content: '【{{brand}}】{{product}}限时{{discount}}折，原价{{originalPrice}}元现价{{price}}元！',
  description: '通用促销模板',
});
```

#### 4.2 填充模板

```typescript
const filled = sdk.fillTemplate(template.id, {
  brand: 'SoundMax',
  product: '降噪耳机',
  discount: '7',
  originalPrice: '899',
  price: '599',
});
```

也可以直接填充模板内容：

```typescript
const result = sdk.fillTemplateContent(
  '欢迎光临 {{shopName}}，今日特惠：{{productName}} 仅售 {{price}} 元！',
  {
    shopName: '数码专营店',
    productName: '蓝牙耳机',
    price: '99',
  }
);
```

#### 4.3 模板列表管理

```typescript
// 获取所有模板
const allTemplates = sdk.listTemplates();

// 按类型获取模板
const promoTemplates = sdk.listTemplates('promo_short');

// 获取单个模板
const template = sdk.getTemplate('template-id');

// 更新模板
sdk.updateTemplate('template-id', {
  name: '新模板名称',
  content: '新模板内容 {{variable}}',
});

// 删除模板
sdk.deleteTemplate('template-id');
```

### 5. 结果检查

#### 5.1 敏感词检测

```typescript
const result = sdk.checkSensitive('这是最好的产品，绝对100%有效！');

console.log('是否含敏感词:', result.hasSensitive);
console.log('风险等级:', result.level); // low | medium | high

result.matches.forEach((match) => {
  console.log(`- ${match.word} (${match.category})`);
  if (match.suggestion) {
    console.log(`  建议: ${match.suggestion}`);
  }
});
```

#### 5.2 敏感词过滤

```typescript
const filtered = sdk.filterSensitiveText(
  '这是最好的产品，绝对100%有效！',
  '***'
);
// 输出: 这是***的产品，*** ***有效！
```

#### 5.3 候选结果排序

```typescript
const sorted = sdk.sortCandidates(candidates, {
  criteria: ['score', 'diversity', 'length'],
  weights: [0.6, 0.25, 0.15],
  ascending: false,
}, idealLength);
```

排序维度：
- `score` - AI 评分
- `diversity` - 多样性
- `length` - 长度适配度
- `freshness` - 新鲜度

### 6. 生成记录

```typescript
// 获取单条记录
const record = sdk.getGenerationRecord('record-id');

// 获取记录列表
const records = sdk.listGenerationRecords('selling_point', 10, 0);

// 获取统计信息
const stats = sdk.getStatistics();
console.log('总生成次数:', stats.total);
console.log('成功次数:', stats.success);
console.log('失败次数:', stats.failed);
console.log('平均耗时:', stats.averageDuration + 'ms');
```

## API 参考

### CopySDK 构造函数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | - | API 密钥 |
| apiEndpoint | string | - | API 端点地址 |
| model | string | gpt-3.5-turbo | 使用的模型 |
| defaultToneStyle | ToneStyle | professional | 默认语气风格 |
| defaultCandidateCount | number | 3 | 默认候选数量 |
| defaultLanguage | string | zh-CN | 默认语言 |
| enableSensitiveCheck | boolean | true | 是否启用敏感词检测 |
| enableSorting | boolean | true | 是否启用结果排序 |
| retry | RetryConfig | - | 重试配置 |
| sortConfig | SortConfig | - | 排序配置 |
| sensitiveWordList | SensitiveWordMatch[] | - | 自定义敏感词列表 |
| customTemplates | CopyTemplate[] | - | 自定义模板列表 |
| onGenerate | Function | - | 生成完成回调 |
| onError | Function | - | 错误回调 |

### 生成参数（BaseGenerateParams）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| productInfo | ProductInfo | - | 商品信息 |
| toneStyle | ToneStyle | 继承SDK默认 | 语气风格 |
| lengthLimit | LengthLimit | - | 长度限制 |
| targetAudience | TargetAudience | - | 目标人群 |
| candidateCount | number | 继承SDK默认 | 候选数量 |
| keywords | string[] | - | 关键词列表 |
| excludeKeywords | string[] | - | 排除关键词 |
| referenceCopy | string | - | 参考文案 |
| language | string | 继承SDK默认 | 语言 |

### 生成选项（GenerateOptions）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enableSensitiveCheck | boolean | 继承SDK默认 | 是否启用敏感词检测 |
| enableSorting | boolean | 继承SDK默认 | 是否启用结果排序 |
| sortConfig | SortConfig | 继承SDK默认 | 排序配置 |
| enableDeduplication | boolean | true | 是否启用去重 |
| timeout | number | - | 超时时间（毫秒） |
| retry | RetryConfig | 继承SDK默认 | 重试配置 |

### 重试配置（RetryConfig）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| maxRetries | number | 3 | 最大重试次数 |
| initialDelay | number | 1000 | 初始延迟（毫秒） |
| maxDelay | number | 10000 | 最大延迟（毫秒） |
| backoffFactor | number | 2 | 退避因子 |
| retryableErrors | string[] | 见下 | 可重试错误类型 |

默认可重试错误：`NETWORK_ERROR`, `TIMEOUT`, `RATE_LIMIT`, `SERVER_ERROR`, `TEMPORARY_ERROR`

### CopyCandidate 对象

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 候选文案ID |
| content | string | 文案内容 |
| type | CopyType | 文案类型 |
| score | number | 评分 (0-1) |
| tags | string[] | 标签列表 |
| sensitiveWords | SensitiveWordMatch[] | 敏感词匹配列表 |
| hasSensitive | boolean | 是否包含敏感词 |
| createdAt | number | 创建时间戳 |

## 使用示例

完整示例请参考 [examples/basic.ts](examples/basic.ts)

运行示例：

```bash
npm install
npx ts-node examples/basic.ts
```

## 项目结构

```
src/
├── index.ts          # SDK 主入口
├── types.ts          # 类型定义
├── generator.ts      # 核心生成器
├── aiClient.ts       # AI 客户端
├── sensitive.ts      # 敏感词检测
├── sorter.ts         # 结果排序
├── template.ts       # 模板管理
├── record.ts         # 生成记录
└── retry.ts          # 重试工具
```

## License

MIT
