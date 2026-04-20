import { useEffect, useState, type ReactNode } from "react";
import { getVaultState, initVault, subscribeVaultState, type VaultState } from "@/lib/vault";
import { VaultLock } from "./VaultLock";

export const VaultGate = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<VaultState>(getVaultState());

  useEffect(() => {
    const unsub = subscribeVaultState(setState);
    initVault().catch(() => setState("locked"));
    return unsub;
  }, []);

  if (state === "unknown") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ink-faded">
          Unfurling the codex…
        </p>
      </div>
    );
  }

  if (state === "none") return <VaultLock mode="setup" />;
  if (state === "locked") return <VaultLock mode="unlock" />;

  return <>{children}</>;
};
