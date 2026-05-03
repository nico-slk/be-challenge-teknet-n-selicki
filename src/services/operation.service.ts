import { OperationModel } from "../models/operation.model";

export class OperationService {
  public async createOperation(data: any) {
    return await OperationModel.create(data);
  }
}

export default new OperationService();;
