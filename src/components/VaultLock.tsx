import { useEffect, useState } from "react";
import { KeyRound, Lock, ShieldAlert, Feather } from "lucide-react";
import { createVault, unlockVault } from "@/lib/vault";
import { ThemeToggle } from "./ThemeToggle";

type Mode = "setup" | "unlock";

export const VaultLock = ({ mode }: { mode: Mode }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(null); }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) { setError("Enter a password."); return; }
    if (mode === "setup") {
      if (password.length < 6) { setError("At least 6 characters."); return; }
      if (password !== confirm) { setError("Passwords don't match."); return; }
    }
    setBusy(true);
    try {
      if (mode === "setup") await createVault(password);
      else await unlockVault(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const isSetup = mode === "setup";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={submit}
        className="glass-strong w-full max-w-md rounded-2xl p-8 space-y-5 animate-fade-up"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto wax-seal animate-seal">
            <Feather className="w-4 h-4" />
          </div>
          <div className="small-caps text-[10px] text-muted-foreground">
            {isSetup ? "First time here" : "Welcome back"}
          </div>
          <h1 className="display-serif text-2xl md:text-3xl text-foreground leading-tight">
            {isSetup ? "Seal your codex" : "Unlock your codex"}
          </h1>
          <p className="body-text text-muted-foreground text-sm text-pretty">
            {isSetup
              ? "Choose a password. Your notes are encrypted with it — no one can read them without it, not even us."
              : "Enter your password to open the codex."}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block">
            <span className="small-caps text-[10px] text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3 h-3" />
              Password
            </span>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="field"
              placeholder="••••••••"
            />
          </label>

          {isSetup && (
            <label className="block">
              <span className="small-caps text-[10px] text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <KeyRound className="w-3 h-3" />
                Confirm
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                className="field"
                placeholder="••••••••"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-crimson body-text border-l-2 border-crimson pl-3">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-wax w-full px-5 py-2.5 text-sm disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          {busy
            ? (isSetup ? "Sealing…" : "Unlocking…")
            : (isSetup ? "Seal the codex" : "Unlock")}
        </button>

        {isSetup && (
          <p className="mono text-[10px] text-muted-foreground text-center leading-relaxed">
            Forget your password and your notes are gone forever.<br/>
            There is no recovery.
          </p>
        )}
      </form>

      <div className="mt-6 mono text-[10px] text-muted-foreground">
        The Codex · stored only in this browser
      </div>
    </div>
  );
};
