import type { Logger } from "pino";
import { serializeRelayConnectionUri } from "@getpaseo/protocol/daemon-endpoints";
import { assertPrivateServiceEndpoint } from "@getpaseo/protocol/network-policy";

import { createConnectionOfferV2, encodeOfferToFragmentUrl } from "./connection-offer.js";
import { loadOrCreateDaemonKeyPair } from "./daemon-keypair.js";
import { renderPairingQr } from "./pairing-qr.js";
import { getOrCreateServerId } from "./server-id.js";

export interface LocalPairingOffer {
  relayEnabled: boolean;
  url: string | null;
  qr: string | null;
}

export async function generateLocalPairingOffer(args: {
  paseoHome: string;
  relayEnabled?: boolean;
  relayEndpoint?: string;
  relayPublicEndpoint?: string;
  relayUseTls?: boolean;
  relayPublicUseTls?: boolean;
  /** Stamp the offer so new clients require protected endpoint security from their first handshake. */
  relayRequireProtectedSecurity?: boolean;
  appBaseUrl?: string;
  includeQr?: boolean;
  logger?: Logger;
}): Promise<LocalPairingOffer> {
  const relayEnabled = args.relayEnabled ?? false;
  if (!relayEnabled) {
    return {
      relayEnabled: false,
      url: null,
      qr: null,
    };
  }

  const relayEndpoint = args.relayEndpoint?.trim();
  if (!relayEndpoint) throw new Error("Self-hosted relay endpoint is required for pairing");
  const relayPublicEndpoint = args.relayPublicEndpoint?.trim() || relayEndpoint;
  assertPrivateServiceEndpoint(relayEndpoint, "relay");
  assertPrivateServiceEndpoint(relayPublicEndpoint, "public relay");
  const relayUseTls = args.relayUseTls ?? true;
  const relayPublicUseTls = args.relayPublicUseTls ?? relayUseTls;
  const appBaseUrl = args.appBaseUrl?.trim() ?? "";
  if (appBaseUrl) assertPrivateServiceEndpoint(appBaseUrl, "pairing web app");
  const serverId = getOrCreateServerId(args.paseoHome, { logger: args.logger });
  const daemonKeyPair = await loadOrCreateDaemonKeyPair(args.paseoHome, args.logger);
  const offer = await createConnectionOfferV2({
    serverId,
    daemonPublicKeyB64: daemonKeyPair.publicKeyB64,
    relay: { endpoint: relayPublicEndpoint, useTls: relayPublicUseTls },
    ...(args.relayRequireProtectedSecurity === true
      ? { minimumSecurityMode: "protected" as const }
      : {}),
  });
  // relay:// links are supported directly by the client pairing parser; no hosted
  // Paseo webpage or third-party JavaScript is needed to scan or paste the QR.
  const url = appBaseUrl
    ? encodeOfferToFragmentUrl({ offer, appBaseUrl })
    : serializeRelayConnectionUri({ offer });

  if (args.includeQr === false) {
    return {
      relayEnabled: true,
      url,
      qr: null,
    };
  }

  let qr: string | null = null;
  try {
    qr = await renderPairingQr(url);
  } catch (error) {
    args.logger?.debug({ error }, "Failed to render pairing QR");
  }

  return {
    relayEnabled: true,
    url,
    qr,
  };
}
