# Paseo private network policy (w101723 fork)

This fork runs in **private mode only**. There is **no official-service fallback**:
no `relay.paseo.sh`, `app.paseo.sh`, `plugins.paseo.sh`,
upstream GitHub update feed, or Expo push token delivery.

## Daemon configuration

The daemon stores JSON at `$PASEO_HOME/config.json`. An example:

```json
{
  "version": 1,
  "network": { "mode": "private" },
  "daemon": {
    "listen": "0.0.0.0:6767",
    "cors": { "allowedOrigins": [] },
    "relay": {
      "enabled": true,
      "endpoint": "relay.internal.example:443",
      "publicEndpoint": "relay.example.net:443",
      "useTls": true,
      "publicUseTls": true,
      "requireProtectedSecurity": true
    }
  }
}
```

Configure the local daemon password (`paseo daemon set-password`) before
accepting remote clients. The public endpoint must be a reachable self-hosted
Relay that speaks Paseo's relay protocol; an ordinary HTTPS reverse proxy alone
is not a Relay server.

**No self-hosted Relay?** Leave `daemon.relay.enabled=false` and connect directly
to the daemon's LAN address or use its existing desktop SSH transport. Access
over Headscale/Tailscale can use the private overlay IP. Do not expose an
unauthenticated daemon port to the Internet.

**Pairing:** with a self-hosted Relay, the QR/link defaults to a `relay://...`
URI that the client can scan or paste, without loading an external website.
To use a web pairing page, set `app.baseUrl` (or `PASEO_APP_BASE_URL`) to a
**self-hosted** frontend. Official pages are blocked. Direct LAN/SSH connection
is already supported by the existing Add Host flow; a new direct-connection QR
format is not introduced here.

**Plugin registry:** unset `PASEO_PLUGIN_REGISTRY` to disable remote discovery,
or set it to your own registry URL. Local plugins remain available. Git/npm
plugin installation explicitly requested by an operator, model-provider calls,
agent shell traffic, and embedded browser navigation are **outside** this
first-party policy; enforce OS/network egress rules if you need a strict
process-level allowlist.

**Updates and push:** upstream Desktop and Daemon self-updates and Expo push
are disabled. Compile new releases from your fork and deploy them manually.
The mobile application removes the upstream EAS project association; if
distributing through an app store, supply your own signing/build credentials.

**Fail-closed cases:** enabling a Relay without a configured endpoint causes a
configuration error; official Relay endpoints are rejected by config resolution,
pairing, and the shared WebSocket URL builder (including persisted host profiles).
A legacy `app.baseUrl=https://app.paseo.sh` is ignored, not contacted.

## Verifying outbound traffic

Check daemon startup logs, capture DNS/TCP traffic from desktop and mobile builds,
and independently block `paseo.sh` and its subdomains at your egress firewall.
A static source change cannot prove absolute absence of traffic from arbitrary
plugins, model SDKs, Electron/Expo frameworks, or agent-initiated commands.

## Automatic desktop installers (branch `no-relay`)

Every push to `no-relay` triggers `.github/workflows/no-relay-desktop.yml`.
The workflow runs two independent jobs:

- **macOS ARM64:** builds an Apple Silicon `.dmg` using electron-builder's `dmg` target.
- **Windows AMD64/x64:** builds an NSIS `.exe` installer.

Find each run under **Actions → Private Desktop Installers (no-relay)** and
expand the **Artifacts** section to download `Paseo-no-relay-macos-arm64`
or `Paseo-no-relay-windows-amd64` (retained for 30 days).
You can also start a run manually using **Run workflow**.

These are **unsigned** builds: macOS Gatekeeper and Windows SmartScreen may
warn when opening them. A notarized/signed distribution requires signing
credentials and an explicit future workflow change. The workflow never
publishes to the Paseo organization's releases, npm registry, or Expo.
