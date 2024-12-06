import { RawRequest, RawResponse } from "./endpoint";

export type MiddlewareHandler = (
  req: RawRequest,
  res: RawResponse,
  next: () => void
) => void | RawResponse;

export type MiddlewareConfig = {
  endpoint?: string;
};

export type Middleware = {
  handler: MiddlewareHandler;
  config?: MiddlewareConfig;
};
