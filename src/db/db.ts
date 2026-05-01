import { Sequelize } from "sequelize";
import configKeys from "../config/config";


const db = new Sequelize(
  configKeys.DB_NAME as string,
  configKeys.DB_USER as string,
  configKeys.DB_PASSWORD as string,
  {
    host: configKeys.DB_HOST,
    port: parseInt(configKeys.DB_PORT as string, 10),
    dialect: "postgres",
  }
);

export default db;
