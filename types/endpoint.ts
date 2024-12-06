import * as http from "http";

export type RawRequest = http.IncomingMessage & {
  params: Record<string, string> | undefined;
  body: unknown;
};

export type RawResponse = http.ServerResponse;

export type Handler = (
  req: RawRequest,
  res: RawResponse
) => Promise<http.ServerResponse> | http.ServerResponse;

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Endpoint = {
  method: Method;
  route: string;
  handler: Handler;
};
