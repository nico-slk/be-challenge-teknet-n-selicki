import { Request, Response } from "express";
import { PolizaService } from "../services";

const uploadFile = async (req: Request, res: Response) => {
  const { parsedData, executionErrors } = req.body;

  console.log('SArasas');


  try {
    const metrics = await PolizaService.postPoliza(parsedData);

    return res.status(200).json({
      message: "Proceso completado",
      metrics,
      rejected_rows: executionErrors
    });
  } catch (error) {
    return res.status(500).json({ message: "Error procesando el guardado", error });
  }
};

export default {
  uploadFile
};
