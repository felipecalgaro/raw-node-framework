import * as http from "http";

type RawRequest = http.IncomingMessage & {
  params: Record<string, string> | undefined;
  body: unknown;
};

type RawResponse = http.ServerResponse;

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
