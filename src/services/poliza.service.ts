import db from "../db/db";
import { Poliza as IPoliza, PolizaCreationAttributes } from "../interfaces/poliza.interface";
import { PolizaModel } from "../models";

const postPoliza = async (data: IPoliza[]) => {
  if (data.length === 0) return { inserted: 0 };

  try {
    const result = await db.transaction(async (t) => {

      // El método bulkCreate de Sequelize permite insertar múltiples registros a la vez, lo que es más eficiente que insertar uno por uno.
      const created = await PolizaModel.bulkCreate(data as PolizaCreationAttributes[], {
        validate: true,
        transaction: t // Pasamos la transacción a la operación
      });

      return {
        inserted: created.length,
        timestamp: new Date()
      };
    });

    return result;

  } catch (error) {
    console.error("Error al insertar pólizas:", error);
    throw new Error("Error al insertar pólizas");
  }

};

export default {
  postPoliza
};
