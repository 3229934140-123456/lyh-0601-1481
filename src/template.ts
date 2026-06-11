import type {
  CopyTemplate,
  CopyType,
  TemplatePreviewResult,
  BatchFillResult,
  TemplateValidationResult,
  TemplateValidationIssue,
  BatchTemplateHealth,
} from './types';

const CHINESE_VAR_PATTERN = /\{\{([\u4e00-\u9fa5a-zA-Z0-9_]+)\}\}/g;
const INVALID_VAR_CHAR_PATTERN = /[^\u4e00-\u9fa5a-zA-Z0-9_]/;

export class TemplateManager {
  private templates: Map<string, CopyTemplate> = new Map();

  constructor(initialTemplates?: CopyTemplate[]) {
    if (initialTemplates) {
      for (const template of initialTemplates) {
        this.templates.set(template.id, template);
      }
    }
  }

  public addTemplate(
    template: Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'> & { id?: string }
  ): CopyTemplate {
    const now = Date.now();
    const variables = this.extractVariables(template.content);

    const newTemplate: CopyTemplate = {
      id: template.id || `tpl_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      type: template.type,
      content: template.content,
      variables,
      description: template.description,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  public updateTemplate(
    id: string,
    updates: Partial<Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'>>
  ): CopyTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated: CopyTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now(),
    };

    if (updates.content) {
      updated.variables = this.extractVariables(updates.content);
    }

    this.templates.set(id, updated);
    return updated;
  }

  public deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  public getTemplate(id: string): CopyTemplate | null {
    return this.templates.get(id) || null;
  }

  public listTemplates(type?: CopyType): CopyTemplate[] {
    const templates = Array.from(this.templates.values());
    if (type) {
      return templates.filter((t) => t.type === type);
    }
    return templates;
  }

  public fillTemplate(id: string, variables: Record<string, string>): string {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    return this.fillTemplateContent(template.content, variables);
  }

  public fillTemplateContent(content: string, variables: Record<string, string>): string {
    let result = content;
    const extractedVars = this.extractVariables(content);

    for (const key of extractedVars) {
      const value = variables[key] ?? `{{${key}}}`;
      const regex = new RegExp(
        `\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`,
        'g'
      );
      result = result.replace(regex, value);
    }

    return result;
  }

  public previewTemplate(
    id: string,
    variables: Record<string, string>
  ): TemplatePreviewResult {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    return this.previewTemplateContent(template.content, {
      templateId: template.id,
      templateName: template.name,
      variables,
    });
  }

  public previewTemplateContent(
    content: string,
    options: {
      templateId?: string;
      templateName?: string;
      variables: Record<string, string>;
    }
  ): TemplatePreviewResult {
    const { templateId = 'inline', templateName = '内联模板', variables } = options;
    const allVariables = this.extractVariables(content);
    const filledVariables: string[] = [];
    const missingVariables: string[] = [];

    for (const v of allVariables) {
      if (variables[v] !== undefined && variables[v] !== null && variables[v] !== '') {
        filledVariables.push(v);
      } else {
        missingVariables.push(v);
      }
    }

    const previewContent = this.fillTemplateContent(content, variables);

    return {
      id: templateId,
      name: templateName,
      originalContent: content,
      previewContent,
      variables: allVariables,
      filledVariables,
      missingVariables,
      isComplete: missingVariables.length === 0,
    };
  }

  public batchFill(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): BatchFillResult[] {
    return items.map((item) => {
      try {
        const template = this.templates.get(item.templateId);
        if (!template) {
          return {
            templateId: item.templateId,
            templateName: '未知模板',
            content: '',
            success: false,
            error: `Template not found: ${item.templateId}`,
            variables: [],
            filledVariables: [],
            missingVariables: [],
          };
        }

        const allVariables = template.variables;
        const filledVariables: string[] = [];
        const missingVariables: string[] = [];

        for (const v of allVariables) {
          if (
            item.variables[v] !== undefined &&
            item.variables[v] !== null &&
            item.variables[v] !== ''
          ) {
            filledVariables.push(v);
          } else {
            missingVariables.push(v);
          }
        }

        const content = this.fillTemplate(item.templateId, item.variables);

        return {
          templateId: item.templateId,
          templateName: template.name,
          content,
          success: true,
          variables: allVariables,
          filledVariables,
          missingVariables,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          templateId: item.templateId,
          templateName: '未知模板',
          content: '',
          success: false,
          error: err.message,
          variables: [],
          filledVariables: [],
          missingVariables: [],
        };
      }
    });
  }

  public batchPreview(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): Array<TemplatePreviewResult & { success: boolean; error?: string }> {
    return items.map((item) => {
      try {
        const preview = this.previewTemplate(item.templateId, item.variables);
        return { ...preview, success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          id: item.templateId,
          name: '未知模板',
          originalContent: '',
          previewContent: '',
          variables: [],
          filledVariables: [],
          missingVariables: [],
          isComplete: false,
          success: false,
          error: err.message,
        };
      }
    });
  }

  public validateTemplateContent(content: string): TemplateValidationResult {
    const issues: TemplateValidationIssue[] = [];
    const allVariableOccurrences: string[] = [];
    const variables: string[] = [];

    let i = 0;
    const len = content.length;
    const stack: number[] = [];

    while (i < len) {
      if (i + 1 < len && content[i] === '{' && content[i + 1] === '{') {
        stack.push(i);
        i += 2;
        continue;
      }

      if (i + 1 < len && content[i] === '}' && content[i + 1] === '}') {
        if (stack.length === 0) {
          issues.push({
            type: 'unopened_placeholder',
            severity: 'error',
            message: '存在未匹配的 "}}"，缺少对应的 "{{"',
            position: i,
          });
          i += 2;
          continue;
        }

        const openPos = stack.pop()!;
        const varContent = content.substring(openPos + 2, i).trim();

        if (varContent === '') {
          issues.push({
            type: 'empty_variable',
            severity: 'error',
            message: '存在空变量占位符 {{}}',
            position: openPos,
          });
        } else if (INVALID_VAR_CHAR_PATTERN.test(varContent)) {
          issues.push({
            type: 'invalid_variable_name',
            severity: 'error',
            message: `变量名 "{{${varContent}}}" 包含非法字符，仅允许中文、英文、数字和下划线`,
            position: openPos,
            variableName: varContent,
          });
        } else {
          allVariableOccurrences.push(varContent);
          if (!variables.includes(varContent)) {
            variables.push(varContent);
          }
        }

        i += 2;
        continue;
      }

      i++;
    }

    while (stack.length > 0) {
      const pos = stack.pop()!;
      issues.push({
        type: 'unclosed_placeholder',
        severity: 'error',
        message: '存在未闭合的 "{{"，缺少对应的 "}}"',
        position: pos,
      });
    }

    const duplicateVariables: string[] = [];
    const varCount: Record<string, number> = {};
    for (const v of allVariableOccurrences) {
      varCount[v] = (varCount[v] || 0) + 1;
    }
    for (const v of Object.keys(varCount)) {
      if (varCount[v] > 1) {
        duplicateVariables.push(v);
        issues.push({
          type: 'duplicate_variable',
          severity: 'warning',
          message: `变量 "{{${v}}}" 出现了 ${varCount[v]} 次，请注意是否必要重复`,
          variableName: v,
        });
      }
    }

    const errorCount = issues.filter((it) => it.severity === 'error').length;
    const warningCount = issues.filter((it) => it.severity === 'warning').length;
    const valid = errorCount === 0;

    let suggestion: string | undefined;
    if (!valid) {
      const fixItems: string[] = [];
      if (issues.some((it) => it.type === 'unclosed_placeholder' || it.type === 'unopened_placeholder')) {
        fixItems.push('检查 "{{" 和 "}}" 是否成对闭合');
      }
      if (issues.some((it) => it.type === 'empty_variable')) {
        fixItems.push('移除空占位符或填入变量名');
      }
      if (issues.some((it) => it.type === 'invalid_variable_name')) {
        fixItems.push('修正非法变量名（仅允许中文/英文/数字/下划线）');
      }
      suggestion = `建议：${fixItems.join('；')}`;
    } else if (duplicateVariables.length > 0) {
      suggestion = `提示：以下变量出现多次，确认是否为有意设计：${duplicateVariables.join('、')}`;
    }

    return {
      valid,
      variables,
      duplicateVariables,
      issues,
      errorCount,
      warningCount,
      suggestion,
    };
  }

  public validateTemplate(id: string): TemplateValidationResult {
    const template = this.templates.get(id);
    if (!template) {
      return {
        valid: false,
        variables: [],
        duplicateVariables: [],
        issues: [
          {
            type: 'unclosed_placeholder',
            severity: 'error',
            message: `模板不存在：${id}`,
          },
        ],
        errorCount: 1,
        warningCount: 0,
        suggestion: '请先检查模板 ID 是否正确',
      };
    }
    return this.validateTemplateContent(template.content);
  }

  public getBatchHealth(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): BatchTemplateHealth {
    const details: BatchTemplateHealth['details'] = items.map((item) => {
      const template = this.templates.get(item.templateId);
      const templateName = template?.name || `未知模板(${item.templateId})`;

      if (!template) {
        return {
          templateId: item.templateId,
          templateName,
          canFill: false,
          fillPercentage: 0,
          validation: {
            valid: false,
            variables: [],
            duplicateVariables: [],
            issues: [
              {
                type: 'unclosed_placeholder' as const,
                severity: 'error' as const,
                message: `模板不存在：${item.templateId}`,
              },
            ],
            errorCount: 1,
            warningCount: 0,
          },
          variables: [],
        };
      }

      const validation = this.validateTemplateContent(template.content);
      const requiredVars = validation.variables;
      const varStatus = requiredVars.map((name) => ({
        name,
        filled:
          item.variables[name] !== undefined &&
          item.variables[name] !== null &&
          item.variables[name] !== '',
      }));
      const filledCount = varStatus.filter((v) => v.filled).length;
      const fillPercentage = requiredVars.length > 0
        ? Math.round((filledCount / requiredVars.length) * 100)
        : 100;
      const canFill = validation.valid && requiredVars.length === filledCount;

      return {
        templateId: item.templateId,
        templateName,
        canFill,
        fillPercentage,
        validation,
        variables: varStatus,
      };
    });

    const validTemplates = details.filter((d) => d.validation.valid).length;
    const fillableTemplates = details.filter((d) => d.canFill).length;
    const partiallyFillable = details.filter(
      (d) => d.validation.valid && d.fillPercentage > 0 && d.fillPercentage < 100
    ).length;
    const unfillableTemplates = details.filter(
      (d) => !d.validation.valid || d.fillPercentage === 0
    ).length;

    return {
      totalTemplates: details.length,
      validTemplates,
      invalidTemplates: details.length - validTemplates,
      fillableTemplates,
      partiallyFillable,
      unfillableTemplates,
      details,
    };
  }

  private extractVariables(content: string): string[] {
    const variables: string[] = [];
    let match;

    const regex = new RegExp(CHINESE_VAR_PATTERN.source, 'g');

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  public clear(): void {
    this.templates.clear();
  }

  public get count(): number {
    return this.templates.size;
  }
}
