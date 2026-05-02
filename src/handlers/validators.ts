
export const POLICY_CONFIG = {
  validStatuses: ["active", "inactive", "cancelled"],
  validTypes: ['Property', 'Auto', 'Life', 'Health', 'Liability', 'Marine', 'Cyber', 'D&O'],
  blacklistedNulls: ["null", "NULL", "N/A", "NaN", "#N/A", "—", "undefined", "n/a", ""],
  maxPostgresInt: 2147483647,
  maxDecimal: 99999999.99,
  minValues: {
    Property: 5000, Auto: 10000, Life: 50000, Health: 10000,
    Liability: 100000, Marine: 50000, Cyber: 25000, "D&O": 100000
  }
};

export const validators = {
  hasWhitespace: (val: string) => /\s/.test(val),

  isValidDateFormat: (dateStr: string) => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateStr),

  isValidDate: (dateStr: string) => {
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime());
  },

  hasInvalidChars: (text: string) => !/^[a-zA-ZÀ-ÿ\s'.]+$/.test(text),

  isTrash: (value: any) =>
    value === null || value === undefined || POLICY_CONFIG.blacklistedNulls.includes(String(value).trim()),

  isScientific: (value: any) => /e/i.test(String(value)) && !isNaN(Number(value)),

  /**
   * Valida que un número no exceda los límites definidos para enteros o decimales, y que no sea infinito. Retorna false si el valor es inválido o excede los límites, true si es válido.
   * @param val Número a validar
   * @param isInt Indica si el número debe ser tratado como entero (true) o decimal (false)
   * @returns boolean
   */
  checkOverflow: (val: number, isInt = false) => {
    if (!isFinite(val)) return false;
    return isInt ? val <= POLICY_CONFIG.maxPostgresInt : val <= POLICY_CONFIG.maxDecimal;
  },

  /**
   * Valida reglas de negocio específicas, como valores mínimos asegurados por tipo de póliza. Retorna un objeto con código y mensaje de error si la validación falla, o null si es válida.
   * @param type Tipo de póliza @param value Valor asegurado en USD
   * @returns { code: string; message: string } | null
   */
  getBusinessError: (type: string, value: number): {
    code: string;
    message: string;
  } | null => {
    const min = POLICY_CONFIG.minValues[type as keyof typeof POLICY_CONFIG.minValues];
    if (min && value < min) {
      return {
        code: `${type.toUpperCase().replace("&", "")}_VALUE_TOO_LOW`,
        message: `${type} valor asegurado ${value} por debajo del mínimo ${min}`
      };
    }
    return null;
  }
};
