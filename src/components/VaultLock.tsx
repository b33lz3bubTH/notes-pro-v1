import { useEffect, useState } from "react";
import { KeyRound, Lock, ShieldAlert } from "lucide-react";
import { createVault, unlockVault } from "@/lib/vault";

type Mode = "setup" | "unlock";

export const VaultLock = ({ mode }: { mode: Mode }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) { setError("Speak thy secret word."); return; }
    if (mode === "setup") {
      if (password.length < 6) { setError("At least six runes, good scribe."); return; }
      if (password !== confirm) { setError("Thy two inscriptions differ."); return; }
    }
    setBusy(true);
    try {
      if (mode === "setup") await createVault(password);
      else await unlockVault(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown grievance");
    } finally {
      setBusy(false);
    }
  };

  const isSetup = mode === "setup";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <form
        onSubmit={submit}
        className="parchment w-full max-w-md rounded-sm p-8 space-y-5 relative"
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-gold-deep text-[10px] uppercase tracking-[0.4em]">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-deep/60 to-transparent" />
            {isSetup ? "Rite of Sealing" : "Rite of Entry"}
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-deep/60 to-transparent" />
          </div>
          <h1 className="blackletter text-3xl text-ink leading-none">
            {isSetup ? "Seal thy Codex" : "Unseal thy Codex"}
          </h1>
          <p className="italic text-ink-faded body-text text-sm">
            {isSetup
              ? "Choose a secret word to bind thy scrolls. Without it, none shall read — not even thyself."
              : "Speak thy secret word to loose the wax seal."}
          </p>
        </div>

        <div className="fleuron-rule text-gold-deep/60">
          <span aria-hidden>&#10086;</span>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faded flex items-center gap-1.5 mb-1">
              <KeyRound className="w-3 h-3" />
              Secret Word
            </span>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full bg-parchment-light/80 border border-ink/40 rounded-sm px-3 py-2 text-ink focus:outline-none focus:border-crimson disabled:opacity-60"
              placeholder="· · · · · ·"
            />
          </label>

          {isSetup && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faded flex items-center gap-1.5 mb-1">
                <KeyRound className="w-3 h-3" />
                Again, to confirm
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                className="w-full bg-parchment-light/80 border border-ink/40 rounded-sm px-3 py-2 text-ink focus:outline-none focus:border-crimson disabled:opacity-60"
                placeholder="· · · · · ·"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-crimson body-text italic border-l-2 border-crimson/60 pl-3">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-ink w-full px-5 py-2.5 rounded-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          {busy
            ? (isSetup ? "Sealing…" : "Unsealing…")
            : (isSetup ? "Seal the Codex" : "Unseal the Codex")}
        </button>

        {isSetup && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-ink-faded text-center leading-relaxed">
            Forget thy word, and thy scrolls are lost forever.<br/>
            No maester, no oracle may recover them.
          </p>
        )}
      </form>
    </div>
  );
};
