import { Router } from "express";
import { PolizaRoute } from "./router";


interface IApiPaths {
  url: string;
  router: Router;
}

export const ApiPaths: IApiPaths[] = [
  {
    url: "/poliza",
    router: PolizaRoute,
  }
];
