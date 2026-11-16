"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAmountPrivacy } from "@/src/context/AmountPrivacyContext";
import { Button, Field, inputClass } from "./ui";

export default function AmountVisibilityButton() {
  const { hidden } = useAmountPrivacy();
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" onClick={() => setOpen(true)}><span className="inline-flex items-center gap-2">{hidden ? <Eye size={17} /> : <EyeOff size={17} />}{hidden ? "Show amounts" : "Hide amounts"}</span></Button>
    {open && <VisibilityPasswordDialog onClose={() => setOpen(false)} />}
  </>;
}

function VisibilityPasswordDialog({ onClose }: { onClose: () => void }) {
  const { hidden, changeVisibility } = useAmountPrivacy();
  const dialog = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await changeVisibility(password); onClose(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to verify your password. Try again."); }
    finally { setPassword(""); setBusy(false); locked.current = false; }
  };
  return <dialog ref={dialog} aria-labelledby="visibility-title" onCancel={event => { event.preventDefault(); if (!locked.current) onClose(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-[#ded8ff]/55 backdrop:backdrop-blur-sm">
    <form onSubmit={submit} className="grid gap-4">
      <h2 id="visibility-title" className="text-lg font-semibold">{hidden ? "Show amounts" : "Hide amounts"}</h2>
      <p className="text-sm text-slate-600">Enter your login password to change amount visibility across the app.</p>
      <Field label="Account login password"><input autoFocus className={inputClass} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} /></Field>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" confirm={false} loading={busy} disabled={busy || !password}>Confirm</Button></div>
    </form>
  </dialog>;
}
