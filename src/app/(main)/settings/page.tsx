"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { deleteEverything, exportBackup, importBackup, saveProfile, type Profile } from "@/lib/db";
import { GenderPicker, PlanPicker } from "@/components/profile-fields";
import { useProfile } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const profile = useProfile();
  const [message, setMessage] = useState<{ text: string; tone: "good" | "warn" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  if (profile === undefined) return null;

  const update = (patch: Partial<Profile>) => profile && saveProfile({ ...profile, ...patch });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-scoreboard pt-4 text-6xl font-extrabold uppercase">Settings</h1>

      {profile && (
        <section className="flex flex-col gap-6" aria-labelledby="coach">
          <h2 id="coach" className="font-scoreboard text-3xl font-bold uppercase">Coaching</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Name</span>
            <input
              defaultValue={profile.name}
              maxLength={40}
              onBlur={(e) => e.target.value.trim() && update({ name: e.target.value.trim() })}
              className="h-11 max-w-sm rounded-xl border border-line bg-surface px-3 outline-none focus:border-primary"
            />
          </label>
          <GenderPicker value={profile.gender} onChange={(gender) => update({ gender })} />
          <div>
            <PlanPicker value={profile.plan} onChange={(plan) => update({ plan })} />
            <p className="mt-2 text-sm text-muted">
              Switching keeps your history. Each plan remembers which of its sessions you&apos;ve done.
            </p>
          </div>
          <Choice
            label="Voice coaching"
            value={profile.voice ? "on" : "off"}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
            onChange={(v) => update({ voice: v === "on" })}
          />
          <Choice
            label="Pose model"
            hint="Lite runs smoothly on most phones. Full is more accurate but needs a newer phone."
            value={profile.model}
            options={[
              { value: "lite", label: "Lite (5.8 MB)" },
              { value: "full", label: "Full (9.4 MB)" },
            ]}
            onChange={(v) => update({ model: v as Profile["model"] })}
          />
          <Choice
            label="Measurement units"
            value={profile.units}
            options={[
              { value: "cm", label: "Centimetres" },
              { value: "in", label: "Inches" },
            ]}
            onChange={(v) => update({ units: v as Profile["units"] })}
          />
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="data">
        <h2 id="data" className="font-scoreboard text-3xl font-bold uppercase">Your data</h2>
        <p className="max-w-[60ch] text-muted">
          Everything is stored only in this browser on this device. There&apos;s no account and no server. Camera video is
          analysed live and never saved. Export a backup before switching phones or clearing browser data.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              const blob = new Blob([await exportBackup()], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `spotter-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              setMessage({ text: "Backup downloaded.", tone: "good" });
            }}
            className="press inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-semibold text-background"
          >
            <Download className="size-4" /> Export backup
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 font-semibold hover:border-foreground/40"
          >
            <Upload className="size-4" /> Restore from backup
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                await importBackup(await f.text());
                setMessage({ text: "Backup restored.", tone: "good" });
              } catch (err) {
                setMessage({ text: err instanceof Error ? err.message : String(err), tone: "warn" });
              }
            }}
          />
        </div>
        <p className="text-sm text-muted">Restoring replaces everything currently on this device.</p>
        {message && (
          <p role="status" className={cn("text-sm font-semibold", message.tone === "good" ? "text-good" : "text-warn")}>
            {message.text}
          </p>
        )}

        <div className="mt-4 border-t border-line pt-6">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold">Delete all sessions, measurements and settings from this device?</p>
              <button
                type="button"
                onClick={async () => {
                  await deleteEverything();
                  setConfirmDelete(false);
                  setMessage({ text: "All data deleted.", tone: "good" });
                }}
                className="press h-11 rounded-full bg-warn px-5 font-semibold text-background"
              >
                Delete everything
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="press h-11 rounded-full px-4 font-semibold text-muted hover:text-foreground">
                Keep my data
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="press h-11 rounded-full border border-line px-5 font-semibold text-warn hover:border-warn"
            >
              Delete all data…
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Choice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      {hint && <p className="mt-1 max-w-[56ch] text-sm text-muted">{hint}</p>}
      <div className="mt-2 inline-flex rounded-full border border-line p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "press rounded-full px-4 py-1.5 text-sm font-semibold text-muted",
              value === o.value && "bg-foreground text-background",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
