import { Router } from "../router";
import { Method } from "../types/endpoint";

type Handler = (req: {
  params: Record<string, string> | undefined;
  body: unknown;
  headers: Record<string, string | string[] | undefined> | undefined;
}) => any;

type Endpoint = {
  method: Method;
  route: string;
  handler: Handler;
};

type RequestConfig = {
  method?: Method;
  body?: any;
  headers?: Record<string, string>;
};

export class RawTestRepository {
  private _router = new Router<Endpoint>([]);

  public set(method: Method, route: string, handler: Handler) {
    const paramsNames = route.split("/").filter((el) => el.startsWith("$"));
    if (paramsNames.length !== new Set(paramsNames).size) {
      // check if there are duplicate paramsNames
      throw new Error("Parameters names must be unique.");
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

    return endpointRequested.handler({
      body: reqBody,
      params: reqParams,
      headers: reqDetails?.headers,
    });
  }
}
