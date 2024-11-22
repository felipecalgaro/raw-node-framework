import { Endpoint, Method } from "./types/endpoint";

export class Router<T extends Endpoint> {
  constructor(private _endpoints: T[] = []) {}

  public requestEndpoint(method: Method, reqRoute: string) {
    const endpointsWithoutParams = this._endpoints.filter(
      (endpoint) => !endpoint.route.includes("$")
    );
    const endpointsWithParams = this._endpoints.filter((endpoint) =>
      endpoint.route.includes("$")
    );

    const endpointWithoutParamsRequested = endpointsWithoutParams.find(
      (endpoint) =>
        endpoint.route.toLowerCase() === reqRoute.toLowerCase() &&
        endpoint.method.toLowerCase() === method.toLowerCase()
    );

    if (endpointWithoutParamsRequested) {
      return endpointWithoutParamsRequested;
    } else {
      const endpointWithParamsRequested = endpointsWithParams.find(
        (endpoint) =>
          this._areParamsEquivalent(
            reqRoute.toLowerCase(),
            endpoint.route.toLowerCase()
          ) && endpoint.method.toLowerCase() === method.toLowerCase()
      );

      return endpointWithParamsRequested;
    }
  }

  private _areParamsEquivalent(reqRoute: string, endpointRoute: string) {
    const splitReqRoute = reqRoute.split("/");
    const splitEndpointRoute = endpointRoute.split("/");

    if (splitReqRoute.length !== splitEndpointRoute.length) return false;

    const areRoutesWithoutParamEqual = splitEndpointRoute.every((el, index) => {
      if (!el.startsWith("$")) {
        return el === splitReqRoute[index];
      } else {
        return true;
      }
    });

    return areRoutesWithoutParamEqual;
  }

  public getReqParams(reqUrl: string, endpointRoute: string) {
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

  public addEndpoint(endpoint: T) {
    this._endpoints.push(endpoint);
  }
}
