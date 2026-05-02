// src/middlewares/csv.middleware.ts
import { parseString } from "@fast-csv/parse";
import e, { NextFunction, Request, Response } from "express";
import { validators, POLICY_CONFIG } from "./validators";
import { FieldType, Poliza } from "../interfaces/poliza.interface";
import { v4 as uuidv4 } from "uuid";


/**
 * Middleware para parsear y validar un archivo CSV de pólizas. Lee el archivo desde req.file, procesa cada fila aplicando validaciones de formato, negocio y calidad de datos, y acumula métricas y errores encontrados. Al finalizar, adjunta los datos válidos a req.body.parsedData y un resumen de resultados a req.body.csvResults antes de llamar a next() para continuar con el siguiente middleware o controlador.
 * @returns void
 * 
 */
const parseCsv = (req: Request, res: Response, next: NextFunction): void => {
  const csvBuffer = req.file?.buffer.toString("utf-8");
  if (!csvBuffer) {
    res.status(400).json({ error: "No se proporcionó ningún archivo" });
    return;
  }

  let rowIndex = 1; // Para llevar el conteo de filas (empezando en 1 por el encabezado)
  let operation_id = uuidv4();
  const validRows: any[] = [];
  const errorLog: any[] = [];
  const policyNumbersSeen = new Set<string>();

  try {
    parseString(csvBuffer, { headers: true })
      .on("data", (row: Poliza) => {
        const rowErrors: {
          message: string;
          code: string;
          field?: FieldType,
          row: number;
          severity?: "error" | "warning";
        }[] = [];
        rowIndex++;

        if (!row.policy_number) {
          rowErrors.push({ row: rowIndex, message: "Falta el número de póliza", code: "MISSING_POLICY_NUMBER" });
        } else {
          if (validators.hasWhitespace(row.policy_number)) rowErrors.push({ row: rowIndex, field: "policy_number", message: "El número de póliza tiene espacios", code: "WHITESPACE_IN_POLICY_NUMBER" });
          if (policyNumbersSeen.has(row.policy_number)) rowErrors.push({ row: rowIndex, message: `Número duplicado en el archivo: ${row.policy_number}`, code: "DUPLICATE_POLICY_NUMBER" });
          policyNumbersSeen.add(row.policy_number);
        }

        if (row.premium_usd < 1000 && row.risk_rating === "critical") rowErrors.push({ row: rowIndex, field: "premium_usd", message: "Póliza de riesgo crítico con prima menor a $1000", code: "PREMIUM_RISK_MISMATCH", severity: "warning" });
        if (row.claims_count > 10 && row.status === "active") rowErrors.push({ row: rowIndex, field: "claims_count", message: "Póliza activa con más de 10 reclamaciones", code: "HIGH_CLAIMS_ACTIVE", severity: "warning" });

        if (validators.hasInvalidChars(row.customer)) rowErrors.push({ row: rowIndex, field: "customer", message: "Nombre de cliente con caracteres inválidos o emojis", code: "INVALID_CUSTOMER_NAME" });
        if (!POLICY_CONFIG.validTypes.includes(row.policy_type)) rowErrors.push({ row: rowIndex, field: "policy_type", message: `Tipo inválido: ${row.policy_type}`, code: "INVALID_POLICY_TYPE" });
        if (!POLICY_CONFIG.validStatuses.includes(row.status)) rowErrors.push({ row: rowIndex, field: "status", message: `Estado inválido: ${row.status}`, code: "INVALID_POLICY_STATUS" });

        if (validators.getBusinessError(row.policy_type, row.insured_value_usd)) {
          const businessError = validators.getBusinessError(row.policy_type, row.insured_value_usd);
          rowErrors.push({ row: rowIndex, field: "insured_value_usd", message: businessError!.message, code: businessError!.code, severity: "warning" });
        }

        if (!validators.isValidDateFormat(row.start_date)) rowErrors.push({ row: rowIndex, field: "start_date", message: "Fecha inicio mal formateada (YYYY-MM-DD)", code: "INVALID_START_DATE" });
        if (!validators.isValidDateFormat(row.end_date)) rowErrors.push({ row: rowIndex, field: "end_date", message: "Fecha fin mal formateada (YYYY-MM-DD)", code: "INVALID_END_DATE" });

        if (validators.isValidDate(row.start_date) && validators.isValidDate(row.end_date)) {
          if (new Date(row.start_date) >= new Date(row.end_date)) rowErrors.push({ row: rowIndex, field: "start_date", message: "La fecha de inicio debe ser anterior a la de fin", code: "INVALID_DATE_RANGE" });
        }

        const values = Object.values(row);
        if (values.some(v => validators.isTrash(v))) rowErrors.push({ row: rowIndex, message: "Contiene valores nulos o basura (N/A, NULL, etc)", code: "TRASH_VALUES" });
        if (values.some(v => validators.isScientific(v))) rowErrors.push({ row: rowIndex, message: "Contiene notación científica", code: "SCIENTIFIC_NOTATION" });

        const numericFields = ["premium_usd", "insured_value_usd", "deductible_usd"];
        numericFields.forEach(field => {
          const val = Number(row[field as keyof Poliza]);
          if (val <= 0) rowErrors.push({ row: rowIndex, message: `${field} debe ser mayor a cero`, code: "INVALID_NUMERIC_VALUE" });
          if (!validators.checkOverflow(val)) rowErrors.push({ row: rowIndex, message: `${field} excede el límite permitido`, code: "OVERFLOW_ERROR" });
        });

        if (row.claims_count !== undefined && row.claims_count !== null) {
          const claims = Number(row.claims_count);
          if (claims < 0) rowErrors.push({ row: rowIndex, field: "claims_count", message: "El número de reclamaciones debe ser un valor no negativo", code: "INVALID_CLAIMS_COUNT" });
        }

        if (rowErrors.length > 0) {
          errorLog.push({ policy: row.policy_number || "N/A", errors: rowErrors.filter(e => e.severity !== "warning"), warnings: rowErrors.filter(e => e.severity === "warning") });
        } else {
          validRows.push({ ...row, operation_id });
        }
      })
      .on("end", () => {
        const metrics = {
          operation_id,
          correlation_id: uuidv4(),
          inserted_count: validRows.length,
          rejected_count: errorLog.filter(e => e.errors.length > 0).length,
          warning_count: errorLog.filter(e => e.warnings.length > 0).length,
          processing_time_ms: `${((validRows.length / (validRows.length + errorLog.length)) * 100).toFixed(2)}%`,
          total_processed: validRows.length + errorLog.length,
          errors: errorLog.flatMap(entry => entry.errors),
          warning: errorLog.flatMap(entry => entry.warnings)
        };

        if (validRows.length === 0) {
          return res.status(400).json({
            status: "error",
            message: "No se encontraron filas válidas para procesar",
            metrics,
            details: errorLog
          });
        }

        const errorSummary = errorLog.reduce((summary: any, entry) => {
          entry.errors.forEach((err: any) => {
            summary[err.code] = (summary[err.code] || 0) + 1;
          });
          return summary;
        }, {});

        req.body.parsedData = validRows;
        req.body.csvResults = {
          metrics,
          errorSummary,
          errorLog,
        };
        next();
      });

  } catch (error) {
    console.error("Error al procesar el CSV:", error);
    res.status(500).json({ error: "Error interno al procesar el archivo CSV" });
  }
};

export default { parseCsv };
