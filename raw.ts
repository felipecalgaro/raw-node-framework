import * as http from "http";

type Handler = (
  req: http.IncomingMessage & {
    params: Record<string, string> | undefined;
    body: unknown;
  },
  res: http.ServerResponse
) => Promise<http.ServerResponse> | http.ServerResponse;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Endpoint = {
  method: Method;
  route: string;
  handler: Handler;
};

interface IRaw {
  set: (method: Method, route: string, handler: Handler) => void;
  listen: (port: number, callback: () => void) => void;
}

export default class Raw implements IRaw {
  private _endpoints: Endpoint[] = [];
  private _httpServer: http.Server;

  constructor() {
    this._httpServer = http.createServer((req, res) => {
      if (!req.url) return;

      const endpointRequested = this._requestEndpoint(
        req.url,
        req.method ?? "GET"
      );

      if (!endpointRequested) {
        return res.writeHead(404).end();
      }

      const reqParams = this._getReqParams(req.url, endpointRequested.route);
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

    this._endpoints.push({ method, route, handler });
  }

  private _getReqParams(reqUrl: string, endpointRoute: string) {
    if (!endpointRoute.includes("$")) return;

    const splitReqUrl = reqUrl.split("/");
    const splitEndpointRoute = endpointRoute.split("/");

    const paramsNames = splitEndpointRoute.filter((el) => el.startsWith("$"));
    const paramsIndexes = paramsNames.map((prop) =>
      splitEndpointRoute.indexOf(prop)
    );

    const params: Record<string, string> = {};

    paramsIndexes.forEach((index) => {
      params[splitEndpointRoute[index].slice(1)] = splitReqUrl[index];
    });

    return params;
  }

  private _areParamsEquivalent(reqUrl: string, endpointRoute: string) {
    const splitReqUrl = reqUrl.split("/");
    const splitEndpointRoute = endpointRoute.split("/");

    if (splitReqUrl.length !== splitEndpointRoute.length) return false;

    const areRoutesWithoutParamEqual = splitEndpointRoute.every((el, index) => {
      if (!el.startsWith("$")) {
        return el === splitReqUrl[index];
      } else {
        return true;
      }
    });

    return areRoutesWithoutParamEqual;
  }

  private _requestEndpoint(
    reqUrl: string,
    reqMethod: string
  ): Endpoint | undefined {
    const endpointsWithoutParams = this._endpoints.filter(
      (endpoint) => !endpoint.route.includes("$")
    );
    const endpointsWithParams = this._endpoints.filter((endpoint) =>
      endpoint.route.includes("$")
    );

    const endpointWithoutParamsRequested = endpointsWithoutParams.find(
      (endpoint) =>
        endpoint.route.toLowerCase() === reqUrl.toLowerCase() &&
        endpoint.method.toLowerCase() === reqMethod.toLowerCase()
    );

    if (endpointWithoutParamsRequested) {
      return endpointWithoutParamsRequested;
    } else {
      const endpointWithParamsRequested = endpointsWithParams.find(
        (endpoint) =>
          this._areParamsEquivalent(
            reqUrl.toLowerCase(),
            endpoint.route.toLowerCase()
          ) && endpoint.method.toLowerCase() === reqMethod.toLowerCase()
      );

      return endpointWithParamsRequested;
    }
  }

  public listen(port: number, callback: () => void) {
    this._httpServer.listen(port, callback);
  }
}
