
import { BusinessRule, RuleSeverity } from "../businessRule";

abstract class MinInsuredValueRule extends BusinessRule {
  field = "insured_value_usd";
  severity: RuleSeverity = "error";
  constructor(protected minValue: number, public code: string) { super(); }

  isSatisfied(policy: any): boolean {
    return Number(policy.insured_value_usd) >= this.minValue;
  }
}

export class PropertyMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(5000, "PROPERTY_VALUE_TOO_LOW"); }
}

export class AutoMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(10000, "AUTO_VALUE_TOO_LOW"); }
}

export class LifeMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(50000, "LIFE_VALUE_TOO_LOW"); }
}

export class HealthMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(10000, "HEALTH_VALUE_TOO_LOW"); }
}

export class LiabilityMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(100000, "LIABILITY_VALUE_TOO_LOW"); }
}

export class MarineMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(50000, "MARINE_VALUE_TOO_LOW"); }
}

export class CyberMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(50000, "CYBER_VALUE_TOO_LOW"); }
}

export class DnOMinInsuredValueRule extends MinInsuredValueRule {
  constructor() { super(100000, "DNO_VALUE_TOO_LOW"); }
}
