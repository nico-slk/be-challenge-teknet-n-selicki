
export const POLICY_CONFIG = {
  validStatuses: ["active", "inactive", "cancelled"],
  validTypes: ['Property', 'Auto', 'Life', 'Health', 'Liability', 'Marine', 'Cyber', 'D&O'],
  blacklistedNulls: ["null", "NULL", "N/A", "NaN", "#N/A", "—", "undefined", "n/a", ""],
  maxPostgresInt: 2147483647,
  maxDecimal: 99999999.99,
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

  checkOverflow: (val: number, isInt = false) => {
    if (!isFinite(val)) return false;
    return isInt ? val <= POLICY_CONFIG.maxPostgresInt : val <= POLICY_CONFIG.maxDecimal;
  }
};
