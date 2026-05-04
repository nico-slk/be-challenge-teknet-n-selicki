import { Router } from "express";
import { upload } from "../handlers/mutler";
import { PolizaController } from "../controllers/poliza.controller";
import { FileHandler } from "../handlers/request.error";
import { ParseCsvHandler } from "../handlers/parseCsvHandler";

class PolizaRouter {
  public router: Router;

  constructor(
    private polizaController: PolizaController,
    private fileHandler: FileHandler,
    private parseCsvHandler: ParseCsvHandler
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/policies", (req, res) =>
      this.polizaController.getPolicies(req, res)
    );

    this.router.get("/policies/summary", (req, res) =>
      this.polizaController.getSummary(req, res)
    );

    // En JS, al pasar métodos de clase como callbacks (ej. this.fileHandler.validFile), se puede perder el contexto de this. 
    // Por eso usamos arrow functions en la definición de las rutas: (req, res, next) => this.fileHandler.validFile(req, res, next).
    this.router.post(
      "/upload",
      upload.single("file"),
      (req, res, next) => this.fileHandler.validFile(req, res, next),
      (req, res, next) => this.parseCsvHandler.parseCsv(req, res, next),
      (req, res) => this.polizaController.uploadFile(req, res)
    );
  }
}

const polizaRouter = new PolizaRouter(
  new PolizaController(),
  new FileHandler(),
  new ParseCsvHandler()
);

export const PolizaRoute = polizaRouter.router;
