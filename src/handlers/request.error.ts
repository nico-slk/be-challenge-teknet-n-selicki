import { NextFunction, Request, Response } from "express";

export class FileHandler {
  private readonly allowedMimeTypes: string[];

  constructor(allowedMimeTypes: string[] = ["text/csv"]) {
    this.allowedMimeTypes = allowedMimeTypes;
  }

  public validFile = (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    try {
      if (!file) {
        res.status(400).json({ error: "No se ha subido ningún archivo" });
        return;
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        res.status(400).json({
          error: `Archivo no permitido. Tipos aceptados: ${this.allowedMimeTypes.join(", ")}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error en FileHandler:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}

export default new FileHandler();
