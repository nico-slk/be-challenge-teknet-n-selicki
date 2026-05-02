import { Optional } from "sequelize";

export type PolicyType = 'Property' | 'Auto' | 'Life' | 'Health' | 'Liability' | 'Marine' | 'Cyber' | 'D&O';
export type PolicyStatus = 'active' | 'expired' | 'cancelled';
export type Region = 'LATAM' | 'NA' | 'EMEA' | 'APAC';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'ARS' | 'BRL' | 'JPY';
export type RiskRating = 'low' | 'medium' | 'high' | 'critical';
export type FieldType = "id"
  | "policy_number"
  | "customer"
  | "policy_type"
  | "start_date"
  | "end_date"
  | "premium_usd"
  | "status"
  | "insured_value_usd"
  | "region"
  | "currency"
  | "broker"
  | "risk_rating"
  | "claims_count"
  | "deductible_usd";

export interface Poliza {
  id: number;
  policy_number: string;
  customer: string;
  policy_type: PolicyType;
  start_date: string;
  end_date: string;
  premium_usd: number;
  status: PolicyStatus;
  insured_value_usd: number;
  region: Region;
  currency: Currency;
  broker: string;
  risk_rating: RiskRating;
  claims_count: number;
  deductible_usd: number;
  created_at?: Date;
  operation_id: string;
}

export interface PolizaCreationAttributes extends Optional<Poliza, "id" | "created_at" | "operation_id"> { }
