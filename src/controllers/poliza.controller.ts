import { Request, Response } from "express";
import { PolizaService } from "../services";
import { v4 as uuidv4 } from "uuid";
import OperationService from "../services/operation.service";

export class PolizaController {
  private operationService: typeof OperationService = OperationService;
  private polizaService: typeof PolizaService = PolizaService;

  constructor() { }

  public uploadFile = async (req: Request, res: Response): Promise<Response> => {
    const { parsedData, csvResults } = req.body;
    const startTime = Date.now();

    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    res.setHeader('x-correlation-id', correlationId);

    try {
      await this.operationService.createOperation({
        id: csvResults.metrics.operation_id,
        endpoint: "/upload",
        status: 'COMPLETED',
        correlation_id: correlationId,
        rows_total: csvResults.metrics.total_processed,
        rows_inserted: csvResults.metrics.inserted_count,
        rows_rejected: csvResults.metrics.rejected_count,
        rows_warned: csvResults.metrics.warning_count,
        duration_ms: Date.now() - startTime,
        error_summary: csvResults.errorSummary
      });

      await this.polizaService.postPoliza(parsedData);
      return res.status(200).json(csvResults);
    } catch (error) {
      await this.operationService.createOperation({
        id: csvResults.metrics.operation_id,
        endpoint: "/upload",
        status: 'FAILED',
        correlation_id: correlationId,
        error_summary: { message: "Error en base de datos", details: error }
      });

      return res.status(500).json({
        message: "Error procesando el guardado",
        error: error instanceof Error ? error.message : error
      });
    }
  };

  public getPolicies = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        limit = "25",
        offset = "0",
        status,
        policy_type,
        region,
        risk_rating,
        broker,
        q,
        min_premium,
        max_premium,
        start_date_from,
        start_date_to,
        sort_by = "created_at",
        order = "DESC"
      } = req.query;

      const result = await this.polizaService.getPolicies({
        limit: Math.min(Number(limit), 100),
        offset: Number(offset),
        filters: {
          status: status as string,
          policy_type: policy_type as string,
          region: region as string,
          risk_rating: risk_rating as string,
          broker: broker as string,
          q: q as string,
          min_premium: min_premium ? Number(min_premium) : undefined,
          max_premium: max_premium ? Number(max_premium) : undefined,
          start_date_from: start_date_from as string,
          start_date_to: start_date_to as string,
        },
        sort: {
          by: sort_by as string,
          order: order as string
        }
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error en getPolicies controller:", error);
      return res.status(500).json({ message: "Error al obtener las pólizas", error });
    }
  };

  public getSummary = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const summary = await this.polizaService.getMetricsSummary();
      return res.status(200).json(summary);
    } catch (error) {
      console.error("Error en getSummary controller:", error);
      return res.status(500).json({ message: "Error al generar el resumen de métricas", error });
    }
  };
}

export default new PolizaController();
