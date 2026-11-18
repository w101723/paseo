/**
 * Fork-wide policy for Paseo-owned infrastructure. This deliberately lives in the
 * shared protocol package so both the daemon and the mobile/desktop clients enforce
 * the same rule, including for already persisted hosts and imported pairing links.
 *
 * This is NOT a firewall for user-initiated browser, agent or model-provider traffic.
 */
export const PRIVATE_NETWORK_POLICY = Object.freeze({
  mode: "private",
  officialServices: false,
  automaticUpdates: false,
  expoPush: false,
  explicitRelayOnly: true,
  explicitPluginRegistryOnly: true,
} as const);

export function isOfficialPaseoEndpoint(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `wss://${input}`);
  } catch {
    return false; // Syntax/port validation belongs to the individual transport.
  }
  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  const path = url.pathname.toLowerCase();
  if (host === "paseo.sh" || host.endsWith(".paseo.sh")) return true;
  if (host === "exp.host" || host === "expo.dev" || host.endsWith(".expo.dev")) return true;
  // Releases, hosted bundles and source code controlled by the original project.
  if (host === "github.com" && /^\/getpaseo(?:\/|$)/.test(path)) return true;
  if (host === "api.github.com" && /^\/repos\/getpaseo(?:\/|$)/.test(path)) return true;
  if (host === "raw.githubusercontent.com" && /^\/getpaseo(?:\/|$)/.test(path)) return true;
  return false;
}

/** Fail closed when a first-party service attempts to use official infrastructure. */
export function assertPrivateServiceEndpoint(endpoint: string, service: string): void {
  if (isOfficialPaseoEndpoint(endpoint)) {
    throw new Error(`Private network policy blocks official ${service} endpoint: ${endpoint}`);
  }
}
