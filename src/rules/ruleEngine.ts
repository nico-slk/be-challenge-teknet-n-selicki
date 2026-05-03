import { BusinessRule, RuleResult } from "./businessRule";
import { AutoMinInsuredValueRule, CyberMinInsuredValueRule, DnOMinInsuredValueRule, HealthMinInsuredValueRule, LiabilityMinInsuredValueRule, LifeMinInsuredValueRule, MarineMinInsuredValueRule, PropertyMinInsuredValueRule } from "./concrete/insuredValueRules";
import { HighClaimsActiveRule, PremiumRiskMismatchRule } from "./concrete/premiumRiskMismatchRule";



export class RuleEngine {
  private rules: Map<string, BusinessRule[]> = new Map();
  private globalRules: BusinessRule[] = [];

  constructor() {
    this.rules.set("Property", [new PropertyMinInsuredValueRule()]);
    this.rules.set("Auto", [new AutoMinInsuredValueRule()]);
    this.rules.set("Life", [new LifeMinInsuredValueRule()]);
    this.rules.set("Health", [new HealthMinInsuredValueRule()]);
    this.rules.set("Liability", [new LiabilityMinInsuredValueRule()]);
    this.rules.set("Marine", [new MarineMinInsuredValueRule()]);
    this.rules.set("Cyber", [new CyberMinInsuredValueRule()]);
    this.rules.set("DNO", [new DnOMinInsuredValueRule()]);

    this.globalRules.push(new PremiumRiskMismatchRule());
    this.globalRules.push(new HighClaimsActiveRule());
  }

  public validate(policy: any): RuleResult[] {
    const results: RuleResult[] = [];
    const specificRules = this.rules.get(policy.policy_type) || [];
    const allToRun = [...specificRules, ...this.globalRules];

    return allToRun
      .filter(rule => !rule.isSatisfied(policy))
      .map(rule => rule.getResult(`Falla condición de negocio: ${rule.code}`));
  }
}
