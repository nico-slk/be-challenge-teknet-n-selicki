import { Request, Response } from "express";
import { PolizaService } from "../services";

const uploadFile = async (req: Request, res: Response) =>
  PolizaService.postPoliza(req, res);

export default {
  uploadFile
};
