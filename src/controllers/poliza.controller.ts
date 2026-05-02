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

export default {
  uploadFile
};
