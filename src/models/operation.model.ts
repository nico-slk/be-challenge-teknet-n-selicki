import { DataTypes, Model } from "sequelize";
import db from "../db/db";

export class OperationModel extends Model {
  public id!: string;
  public endpoint!: string;
  public status!: 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  public correlation_id!: string;
  public rows_total!: number;
  public rows_inserted!: number;
  public rows_rejected!: number;
  public rows_warned!: number;
  public duration_ms!: number;
  public error_summary!: object | null;
}

OperationModel.init({
  id: { type: DataTypes.UUID, primaryKey: true },
  endpoint: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED'),
    allowNull: false
  },
  correlation_id: { type: DataTypes.UUID, allowNull: false },
  rows_total: { type: DataTypes.INTEGER, defaultValue: 0 },
  rows_inserted: { type: DataTypes.INTEGER, defaultValue: 0 },
  rows_rejected: { type: DataTypes.INTEGER, defaultValue: 0 },
  rows_warned: { type: DataTypes.INTEGER, defaultValue: 0 },
  duration_ms: { type: DataTypes.INTEGER, defaultValue: 0 },
  error_summary: { type: DataTypes.JSONB, allowNull: true }
}, {
  sequelize: db,
  tableName: 'operations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});
