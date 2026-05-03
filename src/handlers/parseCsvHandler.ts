import { parseString } from "@fast-csv/parse";
import { NextFunction, Request, Response } from "express";
import { validators, POLICY_CONFIG } from "./validators";
import { Poliza } from "../interfaces/poliza.interface";
import { v4 as uuidv4 } from "uuid";
import { RuleEngine } from "../rules/ruleEngine";

export class ParseCsvHandler {
  private ruleEngine = new RuleEngine();

  public parseCsv = (req: Request, res: Response, next: NextFunction): void => {
    const csvBuffer = req.file?.buffer.toString("utf-8");

    if (!csvBuffer) {
      res.status(400).json({ error: "No se proporcionó ningún archivo" });
      return;
    }

    let rowIndex = 1;
    const operation_id = uuidv4();
    const validRows: any[] = [];
    const errorLog: any[] = [];
    const policyNumbersSeen = new Set<string>();

    try {
      parseString(csvBuffer, { headers: true })
        .on("data", (row: Poliza) => {
          rowIndex++;

          const rowErrors = this.validateRow(row, rowIndex, policyNumbersSeen);

          if (rowErrors.length > 0) {
            const errors = rowErrors.filter(e => e.severity !== "warning");
            const warnings = rowErrors.filter(e => e.severity === "warning");

            errorLog.push({
              policy: row.policy_number || "N/A",
              errors,
              warnings
            });
          } else {
            validRows.push({ ...row, operation_id });
          }
        })
        .on("end", () => {
          this.handleProcessingEnd(req, res, next, {
            validRows,
            errorLog,
            operation_id
          });
        });

    } catch (error) {
      console.error("Error al procesar el CSV:", error);
      res.status(500).json({ error: "Error interno al procesar el archivo CSV" });
    }
  };

  private validateRow(row: Poliza, rowIndex: number, seen: Set<string>) {
    const rowErrors: any[] = [];

    if (!row.policy_number) {
      rowErrors.push({ row: rowIndex, message: "Falta el número de póliza", code: "MISSING_POLICY_NUMBER" });
    } else {
      if (validators.hasWhitespace(row.policy_number)) {
        rowErrors.push({ row: rowIndex, field: "policy_number", message: "El número de póliza tiene espacios", code: "WHITESPACE_IN_POLICY_NUMBER" });
      }
      if (seen.has(row.policy_number)) {
        rowErrors.push({ row: rowIndex, message: `Número duplicado en el archivo: ${row.policy_number}`, code: "DUPLICATE_POLICY_NUMBER" });
      }
      seen.add(row.policy_number);
    }

    if (!POLICY_CONFIG.validTypes.includes(row.policy_type)) {
      rowErrors.push({ row: rowIndex, field: "policy_type", message: `Tipo inválido: ${row.policy_type}`, code: "INVALID_POLICY_TYPE" });
    }

    this.validateDates(row, rowIndex, rowErrors);
    this.validateNumerics(row, rowIndex, rowErrors);

    const businessErrors = this.ruleEngine.validate(row);

    const businessErrorsWithRow = businessErrors.map(err => ({
      ...err,
      row: rowIndex
    }));

    return [...rowErrors, ...businessErrorsWithRow];
  }

  private validateDates(row: Poliza, rowIndex: number, errors: any[]) {
    if (!validators.isValidDateFormat(row.start_date)) errors.push({ row: rowIndex, field: "start_date", message: "Fecha inicio mal formateada", code: "INVALID_START_DATE" });
    if (!validators.isValidDateFormat(row.end_date)) errors.push({ row: rowIndex, field: "end_date", message: "Fecha fin mal formateada", code: "INVALID_END_DATE" });

    if (validators.isValidDate(row.start_date) && validators.isValidDate(row.end_date)) {
      if (new Date(row.start_date) >= new Date(row.end_date)) {
        errors.push({ row: rowIndex, field: "start_date", message: "La fecha de inicio debe ser anterior a la de fin", code: "INVALID_DATE_RANGE" });
      }
    }
  }

  private validateNumerics(row: Poliza, rowIndex: number, errors: any[]) {
    const numericFields = ["premium_usd", "insured_value_usd", "deductible_usd"];
    numericFields.forEach(field => {
      const val = Number(row[field as keyof Poliza]);
      if (val <= 0) errors.push({ row: rowIndex, message: `${field} debe ser mayor a cero`, code: "INVALID_NUMERIC_VALUE" });
      if (!validators.checkOverflow(val)) errors.push({ row: rowIndex, message: `${field} excede el límite`, code: "OVERFLOW_ERROR" });
    });
  }

  private handleProcessingEnd(req: Request, res: Response, next: NextFunction, data: any) {
    const { validRows, errorLog, operation_id } = data;

    const metrics = {
      operation_id,
      correlation_id: uuidv4(),
      inserted_count: validRows.length,
      rejected_count: errorLog.filter((e: any) => e.errors.length > 0).length,
      warning_count: errorLog.filter((e: any) => e.warnings.length > 0).length,
      total_processed: validRows.length + errorLog.length,
      errors: errorLog.flatMap((entry: any) => entry.errors),
      warning: errorLog.flatMap((entry: any) => entry.warnings)
    };

    if (validRows.length === 0) {
      return res.status(400).json({ status: "error", message: "Sin filas válidas", metrics, details: errorLog });
    }

    req.body.parsedData = validRows;
    req.body.csvResults = { metrics, errorLog };
    next();
  }
}

export default new ParseCsvHandler();
