import { Router } from "express";
import { PolizaRoute } from "./router/poliza.route";


interface IApiPaths {
  url: string;
  router: Router;
}

export const ApiPaths: IApiPaths[] = [
  {
    url: "/",
    router: PolizaRoute,
  },
  {
    url: "/policies/summary",
    router: PolizaRoute,
  }
];
