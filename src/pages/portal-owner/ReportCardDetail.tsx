import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerRecord } from "@/hooks/useOwnerRecord";
import { useOwnerReportCard } from "@/hooks/useReportCards";
import {
  APPETITE_OPTIONS, ENERGY_OPTIONS, LOG_TYPE_EMOJI, LOG_TYPE_LABELS, LogType,
  SOCIABILITY_OPTIONS, formatTime, moodMeta, ratingMeta,
} from "@/lib/care";
import { formatDate, speciesIcon } from "@/lib/format";

function findLabel(opts: { value: string; label: string }[], v?: string | null) {
  if (!v) return null;
  return opts.find((o) => o.value === v)?.label ?? null;
}

export default function OwnerReportCardDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: owner, isLoading: ownerLoading } = useOwnerRecord();
  const { data: card, isLoading } = useOwnerReportCard(id, owner?.id);

  const { data: logs } = useQuery({
    queryKey: ["owner-card-logs", id, (card as any)?.reservation_id, (card as any)?.pet_id],
    enabled: !!card,
    queryFn: async () => {
      const c: any = card;
      const { data, error } = await supabase
        .from("pet_care_logs")
        .select("id, log_type, notes, logged_at")
        .eq("reservation_id", c.reservation_id)
        .eq("pet_id", c.pet_id)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!ownerLoading && !owner) return <Navigate to="/portal/report-cards" replace />;
  if (!isLoading && card === null) return <Navigate to="/portal/report-cards" replace />;

  if (isLoading || !card) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const c: any = card;
  const r = ratingMeta(c.overall_rating);
  const m = moodMeta(c.mood);
  const tz = c.reservations?.locations?.timezone || undefined;

  return (
    <div className="space-y-6">
      <Link
        to="/portal/report-cards"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to report cards
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {c.pets?.photo_url ? (
            <img src={c.pets.photo_url} alt={c.pets.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-3xl">
              {speciesIcon(c.pets?.species)}
            </span>
          )}
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{c.pets?.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {c.reservations?.services?.name ?? "Visit"} ·{" "}
              {formatDate(c.reservations?.start_at, { month: "long", day: "numeric", year: "numeric" })}
            </p>
            {r && (
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-semibold ${r.tone}`}>
                  {r.emoji} {r.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Photos */}
      {c.photo_urls?.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {c.photo_urls.map((url: string) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                <img src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Vibes */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold text-foreground">How {c.pets?.name} did</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {m && <Pill>{m.emoji} {m.label}</Pill>}
          {findLabel(ENERGY_OPTIONS, c.energy_level) && <Pill>Energy: {findLabel(ENERGY_OPTIONS, c.energy_level)}</Pill>}
          {findLabel(APPETITE_OPTIONS, c.appetite) && <Pill>Appetite: {findLabel(APPETITE_OPTIONS, c.appetite)}</Pill>}
          {findLabel(SOCIABILITY_OPTIONS, c.sociability) && <Pill>Social: {findLabel(SOCIABILITY_OPTIONS, c.sociability)}</Pill>}
        </div>
        {c.summary && (
          <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-foreground">{c.summary}</p>
        )}
      </section>

      {/* Timeline */}
      {logs && logs.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">The day's timeline</h2>
          <ol className="mt-5 space-y-4 border-l border-border-subtle pl-5">
            {logs.map((l: any) => (
              <li key={l.id} className="relative">
                <span className="absolute -left-[26px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs">
                  {LOG_TYPE_EMOJI[l.log_type as LogType] ?? "•"}
                </span>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{LOG_TYPE_LABELS[l.log_type as LogType] ?? l.log_type}</span>
                  <span className="ml-2 text-muted-foreground">{formatTime(l.logged_at, tz)}</span>
                </div>
                {l.notes && <p className="mt-1 text-sm text-muted-foreground">{l.notes}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-background px-3 py-1 text-sm text-foreground">
      {children}
    </span>
  );
}
