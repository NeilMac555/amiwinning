export const PROTECTED_PROFILE_OWNER = "e54b2aaa-35be-41b9-9803-3c201e5ab8b3";
export function requiresProfileAccount(handle: string): boolean {
  return handle.toLowerCase() === "neilmac555";
}
