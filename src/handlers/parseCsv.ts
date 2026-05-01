import { NextFunction, Request, Response } from "express";
import { parseString } from "@fast-csv/parse";
import { Poliza } from "../interfaces/poliza.interface";

const result: any[] = [];
const errors: any[] = [];

const policyNumber = (row: Poliza) => {
  const duplicate = result.find((r) => r.policy_number === row.policy_number);
  const policyNumberWithSpaces = row.policy_number.split(" ");

  if (!row.policy_number) {
    errors.push({ row, error: "Falta el número de póliza", errorCode: "MISSING_POLICY_NUMBER" });
    return false;
  }

  if (duplicate) {
    errors.push({ row, error: "Número de póliza duplicado", errorCode: "DUPLICATE_POLICY_NUMBER" });
    return false;
  }

  if (policyNumberWithSpaces.length > 1) {
    errors.push({ row, error: "El número de póliza contiene espacios en blanco", errorCode: "POLICY_NUMBER_WITH_SPACES" });
    return false;
  }

  return true;

};

const invalidDateFromat = (row: Poliza) => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  if (!row.start_date.match(regex)) {
    errors.push({ row, error: "Formato de fecha inválido. Se esperaba YYYY-MM-DD", errorCode: "INVALID_DATE_FORMAT" });
    return false;
  }

  const date = new Date(row.start_date);
  const timestamp = date.getTime();

  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    errors.push({ row, error: "Fecha inválida", errorCode: "INVALID_DATE" });
    return false;
  }

  return true;
};

const parseCsv = (req: Request, res: Response, next: NextFunction): void => {
  const csvBuffer = req.file?.buffer.toString("utf-8");

  try {
    parseString(csvBuffer as string, { headers: true })
      .on("data", (row) => {
        policyNumber(row);
        invalidDateFromat(row);
      })
      .on("end", () => {
        if (result.length <= 0) {
          res.status(400).json({ error: "Errores en el CSV", details: errors, errorCode: "CSV_ERRORS" });
        } else {
          req.body.parsedData = result;
          next();
        }
      })
      .on("error", (error) => {
        res.status(400).json({ error: "Error al parsear el CSV", details: error.message, errorCode: "CSV_PARSE_ERROR" });
      });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor", details: error, errorCode: "INTERNAL_SERVER_ERROR" });
  }
};

export default { parseCsv };
