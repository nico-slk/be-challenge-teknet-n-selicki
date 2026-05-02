// src/middlewares/csv.middleware.ts
import { parseString } from "@fast-csv/parse";
import { NextFunction, Request, Response } from "express";
import { validators, POLICY_CONFIG } from "./validators";

const parseCsv = (req: Request, res: Response, next: NextFunction): void => {
  const csvBuffer = req.file?.buffer.toString("utf-8");
  if (!csvBuffer) {
    res.status(400).json({ error: "No se proporcionó ningún archivo" });
    return;
  }

  const validRows: any[] = [];
  const errorLog: any[] = [];
  const policyNumbersSeen = new Set<string>();

  try {


    parseString(csvBuffer, { headers: true })
      .on("data", (row) => {
        const rowErrors: { message: string; codeError: string; }[] = [];

        if (!row.policy_number) {
          rowErrors.push({ message: "Falta el número de póliza", codeError: "MISSING_POLICY_NUMBER" });
        } else {
          if (validators.hasWhitespace(row.policy_number)) rowErrors.push({ message: "El número de póliza tiene espacios", codeError: "WHITESPACE_IN_POLICY_NUMBER" });
          if (policyNumbersSeen.has(row.policy_number)) rowErrors.push({ message: `Número duplicado en el archivo: ${row.policy_number}`, codeError: "DUPLICATE_POLICY_NUMBER" });
          policyNumbersSeen.add(row.policy_number);
        }

        if (validators.hasInvalidChars(row.customer)) rowErrors.push({ message: "Nombre de cliente con caracteres inválidos o emojis", codeError: "INVALID_CUSTOMER_NAME" });
        if (!POLICY_CONFIG.validTypes.includes(row.policy_type)) rowErrors.push({ message: `Tipo inválido: ${row.policy_type}`, codeError: "INVALID_POLICY_TYPE" });
        if (!POLICY_CONFIG.validStatuses.includes(row.status)) rowErrors.push({ message: `Estado inválido: ${row.status}`, codeError: "INVALID_POLICY_STATUS" });

        if (!validators.isValidDateFormat(row.start_date)) rowErrors.push({ message: "Fecha inicio mal formateada (YYYY-MM-DD)", codeError: "INVALID_START_DATE" });
        if (!validators.isValidDateFormat(row.end_date)) rowErrors.push({ message: "Fecha fin mal formateada (YYYY-MM-DD)", codeError: "INVALID_END_DATE" });

        if (validators.isValidDate(row.start_date) && validators.isValidDate(row.end_date)) {
          if (new Date(row.start_date) >= new Date(row.end_date)) rowErrors.push({ message: "La fecha de inicio debe ser anterior a la de fin", codeError: "INVALID_DATE_RANGE" });
        }

        const values = Object.values(row);
        if (values.some(v => validators.isTrash(v))) rowErrors.push({ message: "Contiene valores nulos o basura (N/A, NULL, etc)", codeError: "TRASH_VALUES" });
        if (values.some(v => validators.isScientific(v))) rowErrors.push({ message: "Contiene notación científica", codeError: "SCIENTIFIC_NOTATION" });

        const numericFields = ["premium_usd", "insured_value_usd", "deductible_usd"];
        numericFields.forEach(field => {
          const val = Number(row[field]);
          if (val <= 0) rowErrors.push({ message: `${field} debe ser mayor a cero`, codeError: "INVALID_NUMERIC_VALUE" });
          if (!validators.checkOverflow(val)) rowErrors.push({ message: `${field} excede el límite permitido`, codeError: "OVERFLOW_ERROR" });
        });

        if (rowErrors.length > 0) {
          errorLog.push({ policy: row.policy_number || "N/A", errors: rowErrors });
        } else {
          validRows.push(row);
        }
      })
      .on("end", () => {
        const metrics = {
          total_processed: validRows.length + errorLog.length,
          total_valid: validRows.length,
          total_errors: errorLog.length,
          success_rate: `${((validRows.length / (validRows.length + errorLog.length)) * 100).toFixed(2)}%`
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
            summary[err.codeError] = (summary[err.codeError] || 0) + 1;
          });
          return summary;
        }, {});

        req.body.parsedData = validRows;
        req.body.csvMetrics = {
          metrics,
          errorLog,
          errorSummary
        };
        next();
      });

  } catch (error) {
    console.error("Error al procesar el CSV:", error);
    res.status(500).json({ error: "Error interno al procesar el archivo CSV" });
  }
};

export default { parseCsv };
