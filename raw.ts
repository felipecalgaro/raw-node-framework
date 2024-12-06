import * as http from "http";
import {
  Endpoint,
  Handler,
  Method,
  RawRequest,
  RawResponse,
} from "./types/endpoint";
import { Router } from "./router";
import {
  Middleware,
  MiddlewareConfig,
  MiddlewareHandler,
} from "./types/middleware";

export default class Raw {
  private _httpServer: http.Server;
  private _router = new Router();
  private _stackOrder = 0;
  private _middlewares: Middleware[] = [];

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
          this._runEndpointAndMiddlewares(
            endpointRequested,
            Object.assign(req, { body: reqBody, params: reqParams }),
            res
          );
        });
    });
  }

  public set(method: Method, route: string, handler: Handler) {
    const paramsNames = route.split("/").filter((el) => el.startsWith("$"));
    if (paramsNames.length !== new Set(paramsNames).size) {
      throw new Error("Endpoint parameters must be uniquely named.");
    }

    this._router.addEndpoint({ method, route, handler });
  }

  private _runEndpointAndMiddlewares(
    endpoint: Endpoint,
    req: RawRequest,
    res: RawResponse
  ) {
    const routeSpecificMiddlewares = this._middlewares.filter(
      (middleware) => middleware.config?.endpoint === endpoint.route
    );
    const genericMiddlewares = this._middlewares.filter(
      (middleware) => !middleware.config?.endpoint
    );

    const requiredMiddlewares = [
      ...routeSpecificMiddlewares,
      ...genericMiddlewares,
    ];

    if (requiredMiddlewares.length === 0) {
      return endpoint.handler(req, res);
    }

    let middlewareResponse: RawResponse | undefined | void = undefined;
    let finishedRunningMiddlewares: boolean | undefined;

    const next = () => {
      this._stackOrder++;
      finishedRunningMiddlewares =
        this._stackOrder === requiredMiddlewares.length;
      if (finishedRunningMiddlewares) {
        return;
      }

      middlewareResponse = requiredMiddlewares[this._stackOrder].handler(
        req,
        res,
        next
      );
    };

    const response = requiredMiddlewares[this._stackOrder].handler(
      req,
      res,
      next
    );

    if (response) {
      middlewareResponse = response;
    }

    if (middlewareResponse) {
      return middlewareResponse;
    }

    if (!finishedRunningMiddlewares) return;

    return endpoint.handler(req, res);
  }

  public applyMiddleware(
    middlewareHandler: MiddlewareHandler,
    config?: MiddlewareConfig
  ) {
    this._middlewares.push({ handler: middlewareHandler, config });
  }

  public listen(port: number, callback: () => void) {
    this._httpServer.listen(port, callback);
  }
}
