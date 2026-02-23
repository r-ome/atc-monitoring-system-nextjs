import { AsyncLocalStorage } from "async_hooks";

export type RequestContextType = {
  branch_id: string;
  username?: string;
  branch_name?: string;
};

export const RequestContext = new AsyncLocalStorage<RequestContextType>();
