import { SeededRandom } from '../src/utils/random';
import { CopySDK } from '../src';

const product = {
  name: '智能降噪耳机 Pro',
  brand: 'SoundMax',
  price: 599,
  category: '数码配件',
  features: ['主动降噪', '40小时续航', '蓝牙5.3', 'Hi-Fi音质'],
};

async function testSeed() {
  const sdk = new CopySDK();

  console.log('=== 测试 SeededRandom 本身 ===');
  const rng1 = new SeededRandom(42);
  const rng2 = new SeededRandom(42);
  let same = true;
  for (let i = 0; i < 10; i++) {
    const a = rng1.next();
    const b = rng2.next();
    if (a !== b) { same = false; }
    console.log(`  ${i}: a=${a.toFixed(6)}, b=${b.toFixed(6)}, same=${a === b}`);
  }
  console.log(`  随机序列是否一致: ${same ? '✅是' : '❌否'}`);
  console.log('');

  console.log('=== 测试 generateTitles 相同 seed ===');
  const run1 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 3,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
  });
  const run2 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 3,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
  });

  console.log(`  run1.length=${run1.length}, run2.length=${run2.length}`);
  const allSame = run1.every((c, i) => c.content === run2[i].content);
  console.log(`  内容是否完全一致: ${allSame ? '✅是' : '❌否'}`);
  run1.forEach((c, i) => {
    const match = c.content === run2[i].content ? '✅' : '❌';
    console.log(`  ${match} #${i + 1}: ${c.content.substring(0, 40)}`);
    if (!match) console.log(`       run2: ${run2[i].content.substring(0, 40)}`);
  });

  console.log('');
  console.log('=== 测试 5 条标题相同 seed ===');
  const run3 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
  });
  const run4 = await sdk.generateTitles({
    productInfo: product,
    candidateCount: 5,
    seed: 42,
    keywords: ['降噪', '蓝牙', '耳机'],
  });
  const allSame5 = run3.every((c, i) => c.content === run4[i].content);
  console.log(`  5 条标题是否一致: ${allSame5 ? '✅是' : '❌否'}`);
  run3.forEach((c, i) => {
    const match = c.content === run4[i].content ? '✅' : '❌';
    console.log(`  ${match} #${i + 1}: ${c.content.substring(0, 45)}`);
    if (!match) console.log(`       run2: ${run4[i].content.substring(0, 45)}`);
  });

  console.log('');
  console.log('=== 测试关闭去重/排序时相同 seed ===');
  const run5 = await sdk.generateTitles(
    { productInfo: product, candidateCount: 5, seed: 42, keywords: ['降噪', '蓝牙', '耳机'] },
    { enableDeduplication: false, enableSorting: false, enableSensitiveCheck: false }
  );
  const run6 = await sdk.generateTitles(
    { productInfo: product, candidateCount: 5, seed: 42, keywords: ['降噪', '蓝牙', '耳机'] },
    { enableDeduplication: false, enableSorting: false, enableSensitiveCheck: false }
  );
  const allSameRaw = run5.every((c, i) => c.content === run6[i].content);
  console.log(`  关去重排序后 5 条是否一致: ${allSameRaw ? '✅是' : '❌否'}`);
}

testSeed().catch(console.error);
