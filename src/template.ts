import type { CopyTemplate, CopyType } from './types';

export class TemplateManager {
  private templates: Map<string, CopyTemplate> = new Map();

  constructor(initialTemplates?: CopyTemplate[]) {
    if (initialTemplates) {
      for (const template of initialTemplates) {
        this.templates.set(template.id, template);
      }
    }
  }

  public addTemplate(template: Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'> & { id?: string }): CopyTemplate {
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

  public updateTemplate(id: string, updates: Partial<Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'>>): CopyTemplate | null {
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

    let result = template.content;

    for (const key of template.variables) {
      const value = variables[key] ?? `{{${key}}}`;
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  public fillTemplateContent(content: string, variables: Record<string, string>): string {
    let result = content;
    const extractedVars = this.extractVariables(content);

    for (const key of extractedVars) {
      const value = variables[key] ?? `{{${key}}}`;
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

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
