"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Keyboard,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Result = "valid" | "already_used" | "invalid" | "expired" | "wrong_event";

interface ScanEntry {
  id: string;
  result: Result;
  message: string;
  reference?: string;
  holder?: string;
  type?: string;
  at: number;
}

interface EventOpt {
  id: string;
  title: string;
  starts_at: string;
}

const RESULT_META: Record<Result, { tone: string; icon: React.ReactNode; label: string }> = {
  valid: { tone: "bg-emerald-500", icon: <CheckCircle2 className="h-10 w-10" />, label: "Valid — admit" },
  already_used: { tone: "bg-amber-500", icon: <Clock className="h-10 w-10" />, label: "Already scanned" },
  expired: { tone: "bg-orange-500", icon: <AlertTriangle className="h-10 w-10" />, label: "Expired" },
  wrong_event: { tone: "bg-rose-500", icon: <AlertTriangle className="h-10 w-10" />, label: "Wrong event" },
  invalid: { tone: "bg-red-600", icon: <XCircle className="h-10 w-10" />, label: "Invalid ticket" },
};

const COOLDOWN_MS = 2500;

export function Scanner({ events }: { events: EventOpt[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [current, setCurrent] = useState<ScanEntry | null>(null);
  const [log, setLog] = useState<ScanEntry[]>([]);
  const [manualRef, setManualRef] = useState("");
  const [checking, setChecking] = useState(false);

  const scannerRef = useRef<any>(null);
  const busyRef = useRef(false);

  async function getToken(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function validate(payload: { token?: string; reference?: string }) {
    if (!eventId) return;
    const token = await getToken();
    try {
      const res = await api.validateTicket({ ...payload, eventId }, token);
      const entry: ScanEntry = {
        id: Math.random().toString(36).slice(2),
        result: res.result,
        message: res.message,
        reference: res.ticket?.reference_number,
        holder: res.ticket?.holder_name,
        type: res.ticket?.ticket_type_name,
        at: Date.now(),
      };
      setCurrent(entry);
      setLog((l) => [entry, ...l].slice(0, 25));
      navigator.vibrate?.(res.result === "valid" ? 120 : [80, 60, 80]);
    } catch (err) {
      setCurrent({
        id: Math.random().toString(36).slice(2),
        result: "invalid",
        message: err instanceof Error ? err.message : "Validation failed.",
        at: Date.now(),
      });
    }
  }

  function onDecode(text: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    void validate({ token: text }).finally(() => {
      setTimeout(() => {
        busyRef.current = false;
      }, COOLDOWN_MS);
    });
  }

  async function startCamera() {
    setCamError(null);
    if (!eventId) {
      setCamError("Select an event first.");
      return;
    }
    setStarting(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode("qr-reader");
      scannerRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded: string) => onDecode(decoded),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setCamError(
        err instanceof Error
          ? "Camera unavailable — grant camera permission, or use manual entry below."
          : "Could not start the camera."
      );
    } finally {
      setStarting(false);
    }
  }

  async function stopCamera() {
    const instance = scannerRef.current;
    if (instance) {
      try {
        await instance.stop();
        await instance.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      const instance = scannerRef.current;
      if (instance) {
        instance.stop().catch(() => {});
      }
    };
  }, []);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualRef.trim()) return;
    setChecking(true);
    await validate({ reference: manualRef.trim() });
    setManualRef("");
    setChecking(false);
  }

  if (events.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <ScanLine className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-slate-900">No events to scan</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Create and publish an event first, then come back here to validate tickets at the door.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {/* Event selector */}
        <div className="card p-4">
          <label className="label">Scanning for event</label>
          <select
            className="input"
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              if (scanning) void stopCamera();
            }}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        {/* Camera */}
        <div className="card overflow-hidden">
          <div className="relative aspect-square w-full bg-ink sm:aspect-video">
            <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/80">
                <ScanLine className="h-12 w-12" />
                <p className="max-w-xs px-6 text-sm">
                  Point the camera at an attendee&apos;s QR code to validate entry.
                </p>
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-56 w-56 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            {scanning ? (
              <Button variant="danger" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" /> Stop camera
              </Button>
            ) : (
              <Button onClick={startCamera} loading={starting}>
                <Camera className="h-4 w-4" /> Start scanning
              </Button>
            )}
            <span className={cn("text-sm font-semibold", scanning ? "text-emerald-600" : "text-slate-400")}>
              {scanning ? "● Live" : "Idle"}
            </span>
          </div>
          {camError && (
            <p className="border-t border-slate-100 px-4 py-3 text-sm font-medium text-amber-700">{camError}</p>
          )}
        </div>

        {/* Manual entry */}
        <form onSubmit={submitManual} className="card p-4">
          <label className="label flex items-center gap-1.5">
            <Keyboard className="h-4 w-4" /> Manual reference (phone battery dead?)
          </label>
          <div className="flex gap-2">
            <input
              className="input font-mono uppercase"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder="EVK-XXXX-XXXX"
            />
            <Button type="submit" variant="secondary" loading={checking} className="shrink-0">
              Check
            </Button>
          </div>
        </form>
      </div>

      {/* Result + log */}
      <div className="space-y-4">
        {current ? (
          <div className={cn("rounded-3xl p-6 text-white shadow-glow", RESULT_META[current.result].tone)}>
            <div className="flex items-center gap-3">
              {RESULT_META[current.result].icon}
              <div>
                <p className="font-display text-2xl font-extrabold">{RESULT_META[current.result].label}</p>
                <p className="text-sm text-white/90">{current.message}</p>
              </div>
            </div>
            {(current.holder || current.reference || current.type) && (
              <div className="mt-4 space-y-1 rounded-2xl bg-white/15 p-4 text-sm">
                {current.holder && <p><span className="opacity-75">Holder:</span> <strong>{current.holder}</strong></p>}
                {current.type && <p><span className="opacity-75">Type:</span> <strong>{current.type}</strong></p>}
                {current.reference && <p className="font-mono"><span className="opacity-75">Ref:</span> {current.reference}</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="card grid place-items-center p-10 text-center text-slate-400">
            <ScanLine className="h-10 w-10" />
            <p className="mt-2 text-sm">Scan results will appear here.</p>
          </div>
        )}

        <div className="card p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Recent scans</p>
          {log.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No scans yet.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {log.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white",
                      RESULT_META[s.result].tone
                    )}
                  >
                    {s.result === "valid" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {s.reference || s.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(s.at).toLocaleTimeString("en-GB")} · {RESULT_META[s.result].label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
