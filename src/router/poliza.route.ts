import { Router } from "express";
import { FileHandler, ParseCsv } from "../handlers";
import { PolizaController } from "../controllers";
import { upload } from "../handlers/mutler";

const router = Router();

const { validFile } = FileHandler;
const { parseCsv } = ParseCsv;
const { uploadFile, getPolicies, getSummary } = PolizaController;

router.get("/", getPolicies);
router.get("/summary", getSummary);
router.post("/upload", upload.single("file"), validFile, parseCsv, uploadFile);

export default router;
