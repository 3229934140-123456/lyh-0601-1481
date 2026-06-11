import type { CopyTemplate, CopyType, TemplatePreviewResult, BatchFillResult } from './types';

const CHINESE_VAR_PATTERN = /\{\{([\u4e00-\u9fa5a-zA-Z0-9_]+)\}\}/g;

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
