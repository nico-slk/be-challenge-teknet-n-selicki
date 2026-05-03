import { Router } from "express";
import { PolizaRoute } from "./router/poliza.route";


interface IApiPaths {
  url: string;
  router: Router;
}

// Debería crear otro path para las opreaciones /policies
export const ApiPaths: IApiPaths[] = [
  {
    url: "/",
    router: PolizaRoute,
  }
];
