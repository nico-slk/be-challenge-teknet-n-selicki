import { Router } from "express";

import { FileHandler } from "../handlers";
import { upload } from "../handlers/mutler";

const router = Router();
const { validFile } = FileHandler;

router.post("/upload", upload.single("file"), validFile, (req, res) => {

  res.send("Archivo subido exitosamente");
});

export default router;
