/**
 * Self-updates are intentionally unavailable in the private fork.
 * Installing an upstream npm release would overwrite private-network controls.
 */
export type DaemonSelfUpdatePhase = "starting" | "downloading" | "installing" | "complete";

export interface DaemonSelfUpdateResult {
  success: boolean;
  error: string | null;
  newVersion: string | null;
}

export interface DaemonSelfUpdateLogger {
  error(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
}

export interface DaemonSelfUpdateInput {
  daemonVersion: string | null;
  desktopManaged: boolean;
  onProgress: (phase: DaemonSelfUpdatePhase) => void;
  logger: DaemonSelfUpdateLogger;
}

export class DaemonSelfUpdateInProgressError extends Error {
  constructor() {
    super("An update is already in progress");
    this.name = "DaemonSelfUpdateInProgressError";
  }
}

export class DaemonSelfUpdater {
  async update(_input: DaemonSelfUpdateInput): Promise<DaemonSelfUpdateResult> {
    return {
      success: false,
      error: "Self-update disabled by private network policy",
      newVersion: null,
    };
  }
}

export const daemonSelfUpdater = new DaemonSelfUpdater();
