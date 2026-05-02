import express, { Application } from 'express';
import { createServer } from 'http';
import { ApiPaths } from '../routes';
import cors from "cors";
import db from '../db/db';
import configKeys from '../config/config';

export class Server {
  private app: Application;
  private port: number = 3001;
  ServerNode: ReturnType<typeof createServer>;

  constructor() {
    this.app = express();
    this.port = configKeys.PORT as number;
    this.routes();
    this.connectDB();
    this.ServerNode = createServer(this.app);
  }

  async connectDB() {
    try {
      await db.authenticate();
      await db
        // .sync()
        .sync({ alter: true })
        .then(() => console.log("✅ Database synchronized"));
    } catch (error) {
      console.error("Database connection error:", error);
    }
  }

  // Middleware can be added here
  middleware() {
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: "5mb" }));
    this.app.use(express.urlencoded({ limit: "10mb", extended: true }));
  }

  // Routes can be added here
  routes() {
    ApiPaths.forEach(({ url, router }) => {
      try {
        this.app.use(`${url}`, router);
        console.log(`✅ Routes load: ${url}`);
      } catch (error) {
        console.error(`❌ Routes load error ${url}:`, error);
      }
    });
  }

  readonly start = () => {
    this.ServerNode.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  };
}
