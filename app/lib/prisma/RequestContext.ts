import { AsyncLocalStorage } from "async_hooks";

export type RequestContextType = {
  branch_id: string | null;
};

export const RequestContext = new AsyncLocalStorage<RequestContextType>();
