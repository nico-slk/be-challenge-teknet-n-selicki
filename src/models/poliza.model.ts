import { DataTypes, Model } from "sequelize";
import db from "../db/db";
import {
  Poliza as IPoliza,
  PolizaCreationAttributes,
  PolicyType,
  PolicyStatus,
  Region,
  Currency,
  RiskRating
} from "../interfaces/poliza.interface";

export class PolizaModel extends Model<IPoliza, PolizaCreationAttributes> implements IPoliza {
  public id!: number;
  public policy_number!: string;
  public customer!: string;
  public policy_type!: PolicyType;
  public start_date!: string;
  public end_date!: string;
  public premium_usd!: number;
  public status!: PolicyStatus;
  public insured_value_usd!: number;
  public region!: Region;
  public currency!: Currency;
  public broker!: string;
  public risk_rating!: RiskRating;
  public claims_count!: number;
  public deductible_usd!: number;
  public operation_id!: string;

  public readonly created_at!: Date;
}

PolizaModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    policy_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    customer: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    policy_type: {
      type: DataTypes.ENUM('Property', 'Auto', 'Life', 'Health', 'Liability', 'Marine', 'Cyber', 'D&O'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    premium_usd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
    },
    insured_value_usd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    region: {
      type: DataTypes.ENUM("LATAM", "NA", "EMEA", "APAC"),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM("USD", "EUR", "GBP", "ARS", "BRL", "JPY"),
      allowNull: false,
    },
    broker: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    risk_rating: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      allowNull: false,
    },
    claims_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    deductible_usd: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    operation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    }
  },
  {
    sequelize: db,
    tableName: "polizas",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at"
  }
);

export default PolizaModel;
