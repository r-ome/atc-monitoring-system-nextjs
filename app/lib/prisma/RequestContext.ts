import { AsyncLocalStorage } from "async_hooks";

export type RequestContextType = {
  branch_id: string;
};

export const RequestContext = new AsyncLocalStorage<RequestContextType>();
