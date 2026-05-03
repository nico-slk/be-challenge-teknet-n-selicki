export type RuleSeverity = "error" | "warning";

export interface RuleResult {
  code: string;
  field: string;
  message: string;
  severity: RuleSeverity;
}

export abstract class BusinessRule {
  abstract code: string;
  abstract field: string;
  abstract severity: RuleSeverity;

  // El método que cada regla debe implementar - Ayuda de memoria
  abstract isSatisfied(policy: any): boolean;

  // Retorna el error si la regla NO se cumple - Ayuda de memoria
  public getResult(message: string): RuleResult {
    return {
      code: this.code,
      field: this.field,
      message,
      severity: this.severity,
    };
  }
}
