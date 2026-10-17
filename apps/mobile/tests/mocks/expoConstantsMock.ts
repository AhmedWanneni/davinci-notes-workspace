export const ExecutionEnvironment = {
  Bare: "bare",
  Standalone: "standalone",
  StoreClient: "storeClient",
} as const;

export default {
  executionEnvironment: ExecutionEnvironment.Bare,
};
