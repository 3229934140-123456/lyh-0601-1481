import type { GenerationRecord, CopyType } from './types';

export class RecordManager {
  private records: Map<string, GenerationRecord> = new Map();
  private maxRecords: number = 1000;
  private onRecordCallback?: (record: GenerationRecord) => void;

  constructor(maxRecords: number = 1000) {
    this.maxRecords = maxRecords;
  }

  public setOnRecordCallback(callback: (record: GenerationRecord) => void): void {
    this.onRecordCallback = callback;
  }

  public addRecord(record: GenerationRecord): void {
    this.records.set(record.id, record);

    if (this.records.size > this.maxRecords) {
      const sortedKeys = Array.from(this.records.keys()).sort((a, b) => {
        const recA = this.records.get(a)!;
        const recB = this.records.get(b)!;
        return recA.createdAt - recB.createdAt;
      });

      const toRemove = sortedKeys.slice(0, this.records.size - this.maxRecords);
      for (const key of toRemove) {
        this.records.delete(key);
      }
    }

    if (this.onRecordCallback) {
      this.onRecordCallback(record);
    }
  }

  public getRecord(id: string): GenerationRecord | null {
    return this.records.get(id) || null;
  }

  public listRecords(type?: CopyType, limit?: number, offset?: number): GenerationRecord[] {
    let records = Array.from(this.records.values());

    if (type) {
      records = records.filter((r) => r.type === type);
    }

    records.sort((a, b) => b.createdAt - a.createdAt);

    if (offset) {
      records = records.slice(offset);
    }

    if (limit) {
      records = records.slice(0, limit);
    }

    return records;
  }

  public updateRecordStatus(id: string, status: GenerationRecord['status'], error?: string): GenerationRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    const updated: GenerationRecord = {
      ...record,
      status,
      error,
      completedAt: Date.now(),
      duration: Date.now() - record.createdAt,
    };

    this.records.set(id, updated);
    return updated;
  }

  public getStatistics(): {
    total: number;
    success: number;
    failed: number;
    partial: number;
    averageDuration: number;
  } {
    const records = Array.from(this.records.values());

    let success = 0;
    let failed = 0;
    let partial = 0;
    let totalDuration = 0;
    let completedCount = 0;

    for (const record of records) {
      switch (record.status) {
        case 'success':
          success++;
          break;
        case 'failed':
          failed++;
          break;
        case 'partial':
          partial++;
          break;
      }

      if (record.duration !== undefined) {
        totalDuration += record.duration;
        completedCount++;
      }
    }

    return {
      total: records.length,
      success,
      failed,
      partial,
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0,
    };
  }

  public clear(): void {
    this.records.clear();
  }

  public get count(): number {
    return this.records.size;
  }
}
