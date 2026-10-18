declare module "expo-modules-core" {
  export function requireNativeModule<T = unknown>(moduleName: string): T;
}
