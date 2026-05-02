import { NextFunction, Request, Response } from "express";

/**
 * Middleware para validar archivos subidos. 
 * Verifica que el archivo exista y tenga un tipo MIME permitido (CSV o Excel).
 * 
 */
const validFile = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file;
  const allowedMimeTypes = ["text/csv"];

  try {
    if (!file) {
      res.status(400).json({ error: "No se ha subido ningún archivo" });
      return;
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ error: "Archivo no permitido. Solo se aceptan CSVs y archivos de Excel" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }

};

export default { validFile };
