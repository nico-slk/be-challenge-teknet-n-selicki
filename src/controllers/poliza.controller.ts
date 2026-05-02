import { Request, Response } from "express";
import { PolizaService } from "../services";

const uploadFile = async (req: Request, res: Response) => {
  const { parsedData, csvResults } = req.body;

  try {
    await PolizaService.postPoliza(parsedData);

    return res.status(200).json(csvResults);
  } catch (error) {
    return res.status(500).json({ message: "Error procesando el guardado", error });
  }
};

const getPolicies = async (req: Request, res: Response) => {
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
      sort_order = "DESC"
    } = req.query;

    const result = await PolizaService.getPolicies({
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
        order: sort_order as string
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error en getPolicies controller:", error);
    return res.status(500).json({ message: "Error al obtener las pólizas", error });
  }
};

const getSummary = async (_req: Request, res: Response) => {
  try {
    const summary = await PolizaService.getMetricsSummary();
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error en getSummary controller:", error);
    return res.status(500).json({ message: "Error al generar el resumen de métricas", error });
  }
};

export default {
  uploadFile,
  getPolicies,
  getSummary
};
