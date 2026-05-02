import { col, fn, Op, WhereOptions } from "sequelize";
import db from "../db/db";
import { Poliza as IPoliza, PolizaCreationAttributes } from "../interfaces/poliza.interface";
import { PolizaModel } from "../models";

const postPoliza = async (data: IPoliza[]) => {
  if (data.length === 0) return { inserted: 0 };

  try {
    const result = await db.transaction(async (t) => {

      // El método bulkCreate de Sequelize permite insertar múltiples registros a la vez, lo que es más eficiente que insertar uno por uno.
      const created = await PolizaModel.bulkCreate(data as PolizaCreationAttributes[], {
        validate: true,
        transaction: t // Pasamos la transacción a la operación
      });

      return {
        inserted: created.length,
        timestamp: new Date()
      };
    });

    return result;

  } catch (error) {
    console.error("Error al insertar pólizas:", error);
    throw new Error("Error al insertar pólizas");
  }

};

const getPolicies = async (params: any) => {
  const { limit, offset, filters, sort } = params;
  const where: WhereOptions = {};

  if (filters.status) where.status = filters.status;
  if (filters.policy_type) where.policy_type = filters.policy_type;
  if (filters.region) where.region = filters.region;
  if (filters.risk_rating) where.risk_rating = filters.risk_rating;
  if (filters.broker) where.broker = filters.broker;

  if (filters.q) {
    where[Op.or as any] = [
      { policy_number: { [Op.iLike]: `%${filters.q}%` } },
      { customer: { [Op.iLike]: `%${filters.q}%` } }
    ];
  }

  if (filters.min_premium !== undefined || filters.max_premium !== undefined) {
    where.premium_usd = {};
    if (filters.min_premium !== undefined) where.premium_usd[Op.gte] = filters.min_premium;
    if (filters.max_premium !== undefined) where.premium_usd[Op.lte] = filters.max_premium;
  }

  if (filters.start_date_from || filters.start_date_to) {
    where.start_date = {};
    if (filters.start_date_from) where.start_date[Op.gte] = filters.start_date_from;
    if (filters.start_date_to) where.start_date[Op.lte] = filters.start_date_to;
  }

  try {
    const { count, rows } = await PolizaModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort.by, sort.order]],
    });

    return {
      total: count,
      limit,
      offset,
      data: rows
    };
  } catch (error) {
    console.error("Error en getPolicies service:", error);
    throw error;
  }
};

const getMetricsSummary = async () => {
  try {
    // Ejecutamos todas las consultas en paralelo para mejorar la performance
    const [
      generalStats,
      byStatus,
      byType,
      byRegion,
      byRisk,
      topBrokers,
      avgClaimsByType
    ] = await Promise.all([
      // Totales generales
      PolizaModel.findOne({
        attributes: [
          [fn("COUNT", col("id")), "total_policies"],
          [fn("SUM", col("premium_usd")), "total_premium_usd"],
          [fn("AVG", col("premium_usd")), "avg_premium_usd"],
        ],
        raw: true
      }),
      // Conteo por status
      PolizaModel.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true
      }),
      // Conteo y Premium por tipo
      PolizaModel.findAll({
        attributes: [
          "policy_type",
          [fn("COUNT", col("id")), "count"],
          [fn("SUM", col("premium_usd")), "premium_sum"]
        ],
        group: ["policy_type"],
        raw: true
      }),
      // Conteo por región
      PolizaModel.findAll({
        attributes: ["region", [fn("COUNT", col("id")), "count"]],
        group: ["region"],
        raw: true
      }),
      // Conteo por riesgo
      PolizaModel.findAll({
        attributes: ["risk_rating", [fn("COUNT", col("id")), "count"]],
        group: ["risk_rating"],
        raw: true
      }),
      // Top 5 Brokers
      PolizaModel.findAll({
        attributes: ["broker", [fn("COUNT", col("id")), "count"]],
        group: ["broker"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 5,
        raw: true
      }),
      // Promedio de reclamos por tipo
      PolizaModel.findAll({
        attributes: ["policy_type", [fn("AVG", col("claims_count")), "avg_claims"]],
        group: ["policy_type"],
        raw: true
      })
    ]);

    return {
      ...generalStats,
      count_by_status: byStatus,
      metrics_by_type: byType,
      count_by_region: byRegion,
      count_by_risk_rating: byRisk,
      top_brokers: topBrokers,
      avg_claims_by_type: avgClaimsByType
    };
  } catch (error) {
    throw error;
  }
};

export default {
  postPoliza,
  getPolicies,
  getMetricsSummary
};
