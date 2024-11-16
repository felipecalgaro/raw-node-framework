import * as http from "http";

type Handler = (
  req: http.IncomingMessage,
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
  init: (port: number) => void;
}

export default class Raw implements IRaw {
  private _endpoints: Endpoint[] = [];

  public set(method: Method, route: string, handler: Handler) {
    const paramsNames = route.split("/").filter((el) => el.startsWith("$"));
    if (paramsNames.length !== new Set(paramsNames).size) {
      // check if there are duplicate paramsNames
      throw new Error("Parameters names must be unique.");
    }

    this._endpoints.push({ method, route, handler });
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

  public init(port: number) {
    http
      .createServer((req, res) => {
        if (!req.url) return;

        const endpointsWithoutParams = this._endpoints.filter(
          (endpoint) => !endpoint.route.includes("$")
        );
        const endpointsWithParams = this._endpoints.filter((endpoint) =>
          endpoint.route.includes("$")
        );

        let endpointRequested: Endpoint | undefined;

        const endpointWithoutParamsRequested = endpointsWithoutParams.find(
          (endpoint) => endpoint.route.toLowerCase() === req.url?.toLowerCase()
        );

        if (endpointWithoutParamsRequested) {
          endpointRequested = endpointWithoutParamsRequested;
        } else {
          const endpointWithParamsRequested = endpointsWithParams.find(
            (endpoint) =>
              this._areParamsEquivalent(
                req.url!.toLowerCase(),
                endpoint.route.toLowerCase()
              )
          );

          endpointRequested = endpointWithParamsRequested;
        }

        if (!endpointRequested) {
          return res.writeHead(404).end();
        }

        endpointRequested.handler(req, res);
      })
      .listen(port, () => console.log("Server running on " + port));
  }
}
