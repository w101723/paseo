import { describe, expect, it } from "vitest";
import {
  PRIVATE_NETWORK_POLICY,
  assertPrivateServiceEndpoint,
  isOfficialPaseoEndpoint,
} from "./network-policy.js";
import { buildDaemonWebSocketUrl, buildRelayWebSocketUrl, parseRelayConnectionUri } from "./daemon-endpoints.js";

describe("private network policy", () => {
  it("disables official services and implicit relay by default", () => {
    expect(PRIVATE_NETWORK_POLICY.mode).toBe("private");
    expect(PRIVATE_NETWORK_POLICY.officialServices).toBe(false);
    expect(PRIVATE_NETWORK_POLICY.automaticUpdates).toBe(false);
    expect(PRIVATE_NETWORK_POLICY.expoPush).toBe(false);
  });

  it("blocks official subdomains, upstream releases, and Expo endpoints", () => {
    for (const endpoint of [
      "relay.paseo.sh:443",
      "https://app.paseo.sh",
      "https://plugins.paseo.sh/index.json",
      "https://github.com/getpaseo/paseo/releases",
      "https://api.github.com/repos/getpaseo/paseo",
      "https://raw.githubusercontent.com/getpaseo/paseo/main/README.md",
      "https://exp.host/--/api/v2/push/send",
    ]) {
      expect(isOfficialPaseoEndpoint(endpoint)).toBe(true);
      expect(() => assertPrivateServiceEndpoint(endpoint, "test")).toThrow(/Private network policy/);
    }
  });

  it("allows explicit self-hosted endpoints and local addresses", () => {
    for (const endpoint of ["relay.example.net:443", "192.168.1.4:6767", "[::1]:6767", "https://plugins.example.net"]) {
      expect(isOfficialPaseoEndpoint(endpoint)).toBe(false);
      expect(() => assertPrivateServiceEndpoint(endpoint, "test")).not.toThrow();
    }
    expect(buildRelayWebSocketUrl({endpoint:"relay.example.net:443",useTls:true,serverId:"srv_test",role:"client"})).toContain("relay.example.net");
    expect(buildDaemonWebSocketUrl("192.168.1.4:6767",{useTls:false})).toContain("192.168.1.4");
  });

  it("blocks official relay from raw links and from WebSocket construction", () => {
    expect(() => buildRelayWebSocketUrl({endpoint:"relay.paseo.sh:443",useTls:true,serverId:"srv_test",role:"client"})).toThrow(/Private network policy/);
    expect(() => buildDaemonWebSocketUrl("relay.paseo.sh:443",{useTls:true})).toThrow(/Private network policy/);
    expect(() => parseRelayConnectionUri("relay://relay.paseo.sh:443/srv_test?key=abc&ssl=true")).toThrow(/Private network policy/);
  });
});
