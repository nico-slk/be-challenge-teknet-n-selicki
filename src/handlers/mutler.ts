import multer from "multer";

// Configuración en memoria para procesar el CSV sin 
// guardarlo en disco (eficiente para CSVs pequeños/medianos)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
