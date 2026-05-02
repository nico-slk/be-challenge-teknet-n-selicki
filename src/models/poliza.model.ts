import { DataTypes } from "sequelize";
import db from "../db/db";

const Poliza = db.define(
  "Poliza",
  {
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
      type: DataTypes.ENUM(
        'Property',
        'Auto',
        'Life',
        'Health',
        'Liability',
        'Marine',
        'Cyber',
        'D&O'
      ),
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
    }
  },
  {
    tableName: "polizas",
    timestamps: true,
    paranoid: true,
  }
);

export default Poliza;
