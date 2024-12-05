import { Router } from "../router";
import { Method } from "../types/endpoint";

type ReqTest = {
  params: Record<string, string> | undefined;
  body: unknown;
  headers: Record<string, string | string[] | undefined> | undefined;
};

type Handler = (req: ReqTest) => any;

type MiddlewareHandler = (req: ReqTest, next: () => void) => any;

type MiddlewareConfig = {
  endpoint?: string;
};

type Middleware = {
  handler: MiddlewareHandler;
  config?: MiddlewareConfig;
};

export type TestEndpoint = {
  method: Method;
  route: string;
  handler: Handler;
};

type RequestConfig = {
  method?: Method;
  body?: any;
  headers?: Record<string, string>;
};

export class RawTest {
  private _middlewares: Middleware[] = [];
  private _stackOrder: number = 0;
  constructor(private _router = new Router<TestEndpoint>()) {}

  public set(method: Method, route: string, handler: Handler) {
    const paramsNames = route.split("/").filter((el) => el.startsWith("$"));
    if (paramsNames.length !== new Set(paramsNames).size) {
      throw new Error("Endpoint parameters must be uniquely named.");
    }

    this._router.addEndpoint({ method, route, handler });
  }

  public fetch(reqRoute: string, reqDetails?: RequestConfig) {
    const endpointRequested = this._router.requestEndpoint(
      reqDetails?.method ?? "GET",
      reqRoute
    );

    if (!endpointRequested) {
      throw new Error("404");
    }

    const reqParams = this._router.getReqParams(
      reqRoute,
      endpointRequested.route
    );
    let reqBody: unknown;

    if (reqDetails?.body) {
      reqBody = JSON.parse(reqDetails.body);
    }

    return this._runEndpointAndMiddlewares(endpointRequested, {
      body: reqBody,
      headers: reqDetails?.headers,
      params: reqParams,
    });
  }

  private _runEndpointAndMiddlewares(endpoint: TestEndpoint, req: ReqTest) {
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
      return endpoint.handler(req);
    }

    const next = () => {
      this._stackOrder++;
      const finishedRunningMiddlewares =
        this._stackOrder === requiredMiddlewares.length;
      if (finishedRunningMiddlewares) {
        return;
      }
      const response = requiredMiddlewares[this._stackOrder].handler(req, next);
      if (response) return response;
    };

    const response = requiredMiddlewares[this._stackOrder].handler(req, next);
    if (response) return response;

    return endpoint.handler(req);
  }

  public applyMiddleware(
    middlewareHandler: MiddlewareHandler,
    config?: MiddlewareConfig
  ) {
    this._middlewares.push({ handler: middlewareHandler, config });
  }
}
