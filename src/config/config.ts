import { config } from "dotenv";

config();

const configKeys = {
  PORT: process.env.PORT || 3001,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "password",
  DB_NAME: process.env.DB_NAME || "teknet_db",
  secret: process.env.SECRET || "default_secret",
};

export default configKeys;
