import { BusinessRule, RuleSeverity } from "../businessRule";

export class PremiumRiskMismatchRule extends BusinessRule {
  code = "PREMIUM_RISK_MISMATCH";
  field = "premium_usd";
  severity: RuleSeverity = "warning";

  isSatisfied(policy: any): boolean {
    if (policy.risk_rating === "critical" && Number(policy.premium_usd) < 1000) {
      return false;
    }
    return true;
  }
}

export class HighClaimsActiveRule extends BusinessRule {
  code = "HIGH_CLAIMS_ACTIVE";
  field = "claims_count";
  severity: "warning" = "warning";

  isSatisfied(policy: any): boolean {
    if (Number(policy.claims_count) > 10 && policy.status === "active") {
      return false;
    }
    return true;
  }
}
