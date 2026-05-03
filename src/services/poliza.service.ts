import { col, fn, Op, WhereOptions } from "sequelize";
import db from "../db/db";
import { Poliza as IPoliza, PolizaCreationAttributes } from "../interfaces/poliza.interface";
import PolizaModel from "../models/poliza.model";

export class PolizaService {
  public async postPoliza(data: IPoliza[]) {
    if (data.length === 0) return { inserted: 0 };

    try {
      return await db.transaction(async (t) => {
        const created = await PolizaModel.bulkCreate(data as PolizaCreationAttributes[], {
          validate: true,
          transaction: t,
        });

        return {
          inserted: created.length,
          timestamp: new Date(),
        };
      });
    } catch (error) {
      console.error("Error al insertar pólizas:", error);
      throw new Error("Error al insertar pólizas");
    }
  }

  public async getPolicies(params: any) {
    const { limit, offset, filters, sort } = params;
    const where = this.buildWhereClause(filters);

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
        data: rows,
      };
    } catch (error) {
      console.error("Error en getPolicies service:", error);
      throw error;
    }
  }

  public async getMetricsSummary() {
    try {
      const [
        generalStats,
        byStatus,
        byType,
        byRegion,
        byRisk,
        topBrokers,
        avgClaimsByType
      ] = await Promise.all([
        this.getGeneralStats(),
        this.getStatsByAttribute("status"),
        this.getTypeMetrics(),
        this.getStatsByAttribute("region"),
        this.getStatsByAttribute("risk_rating"),
        this.getTopBrokers(5),
        this.getAverageClaimsByType()
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
      console.error("Error en getMetricsSummary service:", error);
      throw error;
    }
  }

  // --- Métodos Privados de Apoyo (Encapsulamiento) ---  - Ayuda de memoria

  private buildWhereClause(filters: any): WhereOptions {
    const where: WhereOptions = {};

    // Filtros directos  - Ayuda de memoria
    const fields = ['status', 'policy_type', 'region', 'risk_rating', 'broker'];
    fields.forEach(field => {
      if (filters[field]) where[field] = filters[field];
    });

    // Búsqueda global (q)  - Ayuda de memoria
    if (filters.q) {
      where[Op.or as any] = [
        { policy_number: { [Op.iLike]: `%${filters.q}%` } },
        { customer: { [Op.iLike]: `%${filters.q}%` } }
      ];
    }

    // Rangos numéricos y fechas  - Ayuda de memoria
    if (filters.min_premium !== undefined || filters.max_premium !== undefined) {
      where.premium_usd = {
        ...(filters.min_premium !== undefined && { [Op.gte]: filters.min_premium }),
        ...(filters.max_premium !== undefined && { [Op.lte]: filters.max_premium }),
      };
    }

    if (filters.start_date_from || filters.start_date_to) {
      where.start_date = {
        ...(filters.start_date_from && { [Op.gte]: filters.start_date_from }),
        ...(filters.start_date_to && { [Op.lte]: filters.start_date_to }),
      };
    }

    return where;
  }

  private async getGeneralStats() {
    return PolizaModel.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total_policies"],
        [fn("SUM", col("premium_usd")), "total_premium_usd"],
        [fn("AVG", col("premium_usd")), "avg_premium_usd"],
      ],
      raw: true
    });
  }

  private async getStatsByAttribute(attribute: string) {
    return PolizaModel.findAll({
      attributes: [attribute, [fn("COUNT", col("id")), "count"]],
      group: [attribute],
      raw: true
    });
  }

  private async getTypeMetrics() {
    return PolizaModel.findAll({
      attributes: [
        "policy_type",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("premium_usd")), "premium_sum"]
      ],
      group: ["policy_type"],
      raw: true
    });
  }

  private async getTopBrokers(limit: number) {
    return PolizaModel.findAll({
      attributes: ["broker", [fn("COUNT", col("id")), "count"]],
      group: ["broker"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit,
      raw: true
    });
  }

  private async getAverageClaimsByType() {
    return PolizaModel.findAll({
      attributes: ["policy_type", [fn("AVG", col("claims_count")), "avg_claims"]],
      group: ["policy_type"],
      raw: true
    });
  }
}

export default new PolizaService();
