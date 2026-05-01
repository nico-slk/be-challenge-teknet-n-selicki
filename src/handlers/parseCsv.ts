import { parseString } from "@fast-csv/parse";
import { NextFunction, Request, Response } from "express";
import { Poliza } from "../interfaces/poliza.interface";

const result: any[] = [];
const errors: any[] = [];
const allErrors: any[] = [];

// Funcion para saber si la columna esta duplicada 
const hasDuplicatePolicyNumber = (row: Poliza): boolean => {
  return result.some(r => r.policy_number === row.policy_number);
};

// Funcion para saber si la columa tiene espacios en blanco, lo cual no es permitido para el numero de poliza
const hasWhitespaceInPolicyNumber = (row: Poliza): boolean => {
  return /\s/.test(row.policy_number);
};

// Función para validar el formato de fecha (YYYY-MM-DD) y que sea una fecha válida
const isValidDate = (row: Poliza): boolean => {
  const date = new Date(row.start_date);
  const timestamp = date.getTime();

  return typeof timestamp === "number" && !Number.isNaN(timestamp);
};

// Funcion para saber si la fecha tiene un formato válido
const invalidDateFromat = (row: Poliza): boolean => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  return !!row.end_date.match(regex);
};

// funcion para validar que la fecha de inicio sea anterior a la fecha de fin
const invalidStartEndDate = (row: Poliza): boolean => {
  const startDate = new Date(row.start_date);
  const endDate = new Date(row.end_date);
  return startDate < endDate;
};

// Función para validar que el estado de la póliza sea uno de los valores permitidos
const statusValidation = (row: Poliza): boolean => {
  const validStatuses = ["active", "inactive", "cancelled"];
  return validStatuses.includes(row.status);
};

// Función para validar que los campos numéricos sean mayores a cero
const hasValidNumericValues = (row: Poliza): boolean => {
  return row.premium_usd > 0 && row.insured_value_usd > 0 && row.deductible_usd > 0;
};

// Funcion para determinar que "Campos con NULL, null, N/A, NaN, #N/A, — como texto"
const hasInvalidNullValues = (row: Poliza): boolean => {
  const blacklisted = ["null", "NULL", "N/A", "NaN", "#N/A", "—", "undefined", ""];
  const values = Object.values(row);
  return values.some(v => v === null || v === undefined || blacklisted.includes(String(v).trim()));
};

// Funcion para validar que no tengan anotacion cientifica
const hasScientificNotation = (row: Poliza): boolean => {
  const values = Object.values(row);
  return values.some(v => /e/i.test(String(v)) && !isNaN(Number(v)));
};

// Función para validar que los campos numéricos no excedan los límites de PostgreSQL
const checkOverflow = (row: Poliza): boolean => {
  const keys = Object.keys(row) as (keyof Poliza)[];
  const numericFields = keys.filter(key => typeof row[key] === "number");
  // El valor 2147483647 es el número máximo que puede almacenar una columna de tipo INTEGER (32 bits) en PostgreSQL. Si intentas meter un 2147483648, la DB rechazará la operación.
  const MAX_POSTGRES_INTEGER = 2147483647;
  const MAX_DECIMAL = 99999999.999;

  let hasError = false;
  numericFields.forEach(field => {
    const val = Number(row[field as keyof Poliza]);
    if (!isFinite(val) || val > MAX_DECIMAL || (field === "claims_count" && val > MAX_POSTGRES_INTEGER)) {
      hasError = true;
    }
  });

  return !hasError;
};

const hasInvalidCharacters = (text: string): boolean => {
  const latinRegex = /^[a-zA-ZÀ-ÿ\s'.]+$/;
  return !latinRegex.test(text);
};

const validatePolicyType = (type: string): boolean => {
  const validTypes = ['Property', 'Auto', 'Life', 'Health', 'Liability', 'Marine', 'Cyber', 'D&O'];
  return validTypes.includes(type);
};

const parseCsv = (req: Request, res: Response, next: NextFunction): void => {
  const csvBuffer = req.file?.buffer.toString("utf-8");

  try {
    parseString(csvBuffer as string, { headers: true })
      .on("data", (row) => {
        const rowErrors: string[] = [];

        Object.keys(row).forEach(field => {
          if (row[field as keyof Poliza] === undefined) rowErrors.push(`Columna faltante: ${field}`);
        });

        if (hasDuplicatePolicyNumber(row)) rowErrors.push(`Número de póliza duplicado: ${row.policy_number}`);
        if (!isValidDate(row)) rowErrors.push("Formato de fecha no válida");
        if (!invalidDateFromat(row)) rowErrors.push("Formato de fecha inválido (debe ser YYYY-MM-DD)");
        if (!invalidStartEndDate(row)) rowErrors.push("La fecha de inicio debe ser anterior a la fecha de fin");
        if (!statusValidation(row)) rowErrors.push(`Estado de póliza inválido: ${row.status}`);
        if (hasInvalidNullValues(row)) rowErrors.push("Fila contiene valores nulos o inválidos");
        if (hasScientificNotation(row)) rowErrors.push("Fila contiene valores en notación científica");
        if (!checkOverflow(row)) rowErrors.push("Valor numérico fuera de rango (Overflow/Infinity)");
        if (!hasValidNumericValues(row)) rowErrors.push("Valores numéricos negativos o cero");
        if (hasInvalidCharacters(row.customer)) rowErrors.push("El nombre del cliente contiene caracteres no permitidos o emojis");
        if (!validatePolicyType(row.policy_type)) rowErrors.push(`Tipo de póliza inválido: ${row.policy_type}`);
        if (hasWhitespaceInPolicyNumber(row)) rowErrors.push("El número de póliza tiene espacios en blanco");

        if (rowErrors.length > 0) {
          allErrors.push({
            policy_number: row.policy_number || "SIN_ID",
            errors: rowErrors,
            row_data: row
          });
        } else {
          result.push(row);
        }
      })
      .on("end", () => {
        if (result.length <= 0) {
          res.status(400).json({
            error: "Errores en el CSV",
            details: errors,
            errorCode: "CSV_ERRORS",
          });
        } else {
          req.body.parsedData = result;
          next();
        }
      })
      .on("error", (error) => {
        res.status(400).json({
          error: "Error al parsear el CSV",
          details: error.message,
          errorCode: "CSV_PARSE_ERROR",
        });
      });
  } catch (error) {
    res.status(500).json({
      error: "Error interno del servidor",
      details: error,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export default { parseCsv };
