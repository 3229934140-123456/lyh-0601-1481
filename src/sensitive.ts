import type { SensitiveWordMatch, SensitiveWordLevel, SensitiveCheckResult } from './types';

const DEFAULT_SENSITIVE_WORDS: SensitiveWordMatch[] = [
  { word: '最', position: 0, level: 'low', category: '极限词', suggestion: '建议替换为"很"或"非常"' },
  { word: '第一', position: 0, level: 'medium', category: '极限词', suggestion: '建议替换为"领先"或"优质"' },
  { word: '国家级', position: 0, level: 'high', category: '极限词', suggestion: '禁止使用，请替换' },
  { word: '最高级', position: 0, level: 'high', category: '极限词', suggestion: '禁止使用，请替换' },
  { word: '最佳', position: 0, level: 'medium', category: '极限词', suggestion: '建议替换为"优质"或"出色"' },
  { word: '绝对', position: 0, level: 'medium', category: '极限词', suggestion: '建议使用"非常"或"十分"' },
  { word: '100%', position: 0, level: 'medium', category: '虚假宣传', suggestion: '需提供数据支撑或修改' },
  { word: '无效退款', position: 0, level: 'high', category: '虚假宣传', suggestion: '禁止使用绝对化承诺' },
  { word: '特效药', position: 0, level: 'high', category: '医疗违规', suggestion: '禁止使用医疗相关绝对化表述' },
  { word: '根治', position: 0, level: 'high', category: '医疗违规', suggestion: '禁止使用医疗相关绝对化表述' },
  { word: '秒杀', position: 0, level: 'low', category: '营销用语', suggestion: '注意使用频率' },
  { word: '跳楼价', position: 0, level: 'medium', category: '营销用语', suggestion: '建议使用更规范的表述' },
];

export class SensitiveWordChecker {
  private wordList: SensitiveWordMatch[];

  constructor(customWords?: SensitiveWordMatch[]) {
    this.wordList = [...DEFAULT_SENSITIVE_WORDS];
    if (customWords && customWords.length > 0) {
      this.wordList = [...customWords, ...this.wordList];
    }
  }

  public addWords(words: SensitiveWordMatch[]): void {
    this.wordList = [...words, ...this.wordList];
  }

  public removeWords(wordList: string[]): void {
    this.wordList = this.wordList.filter((w) => !wordList.includes(w.word));
  }

  public check(text: string): SensitiveCheckResult {
    const matches: SensitiveWordMatch[] = [];

    for (const wordItem of this.wordList) {
      let position = 0;
      while (position !== -1) {
        const index = text.indexOf(wordItem.word, position);
        if (index !== -1) {
          matches.push({
            ...wordItem,
            position: index,
          });
          position = index + wordItem.word.length;
        } else {
          position = -1;
        }
      }
    }

    matches.sort((a, b) => a.position - b.position);

    let level: SensitiveWordLevel = 'low';
    if (matches.some((m) => m.level === 'high')) {
      level = 'high';
    } else if (matches.some((m) => m.level === 'medium')) {
      level = 'medium';
    }

    return {
      hasSensitive: matches.length > 0,
      matches,
      level,
    };
  }

  public getWordList(): SensitiveWordMatch[] {
    return [...this.wordList];
  }

  public filterText(text: string, replacement: string = '***'): string {
    let result = text;
    const sortedWords = [...this.wordList].sort((a, b) => b.word.length - a.word.length);
    for (const wordItem of sortedWords) {
      const regex = new RegExp(wordItem.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, replacement);
    }
    return result;
  }
}
