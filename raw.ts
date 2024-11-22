import * as http from "http";
import { Handler, Method } from "./types/endpoint";
import { Router } from "./router";

export default class Raw {
  private _httpServer: http.Server;
  private _router = new Router();

  constructor() {
    this._httpServer = http.createServer((req, res) => {
      if (!req.url) return;

      const endpointRequested = this._router.requestEndpoint(
        (req.method as Method) ?? "GET",
        req.url
      );

      if (!endpointRequested) {
        return res.writeHead(404).end();
      }

      const reqParams = this._router.getReqParams(
        req.url,
        endpointRequested.route
      );
      let reqBody: unknown;

      req
        .on("data", (data) => {
          reqBody = JSON.parse(data);
        })
        .on("end", () => {
          endpointRequested.handler(
            Object.assign(req, { body: reqBody, params: reqParams }),
            res
          );
        });
    });
  }

  public set(method: Method, route: string, handler: Handler) {
    const paramsNames = route.split("/").filter((el) => el.startsWith("$"));
    if (paramsNames.length !== new Set(paramsNames).size) {
      // check if there are duplicate paramsNames
      throw new Error("Parameters names must be unique.");
    }

    this._router.addEndpoint({ method, route, handler });
  }

  public listen(port: number, callback: () => void) {
    this._httpServer.listen(port, callback);
  }
}
