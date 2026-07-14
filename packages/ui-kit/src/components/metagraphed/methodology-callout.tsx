import { useState, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  classNames,
  formatFreshness,
  formatFreshnessAbsolute,
} from "@/lib/format";

/**
 * Compact, collapsible callout that explains what a page's figures are
 * measuring and how staleness / risk is handled.
 *
 * - `variant="subnet"` (default): subnet-profile sparklines / donuts / mosaics.
 * - `variant="staking"`: root vs alpha principal-risk framing + APY window
 *   disclosure (#5247). Written once here; drop the same component beside
 *   every staking surface that shows yield (validator directory APY, detail
 *   tiles/panel, and the future stake modal).
 */

export type MethodologyVariant = "subnet" | "staking";

/** Shared staking risk copy — keep adjacent one-liners in sync with the callout. */
export const STAKING_RISK_COPY = {
  root: {
    term: "Root stake",
    short: "No principal risk · TAO-denominated",
    long: "Root (netuid 0) stake is TAO-denominated 1:1 with no AMM. There is no alpha price leg, so principal is not exposed to subnet token price moves.",
  },
  alpha: {
    term: "Alpha stake",
    short: "Price-exposed · can net-lose TAO",
    long: "Alpha (non-root) stake is denominated in that subnet's alpha token. Positive nominal APY can still net-lose TAO when alpha price falls — yield figures never erase that risk.",
  },
  windows: {
    term: "Yield windows",
    short: "Trailing window · not a forecast",
    long: "Every yield / APY figure is labeled with its trailing window (for example 7d, 30d, 90d, or latest snapshot). Numbers annualize observed emission÷stake over that window — they are not a projection or a promised return.",
  },
  methodology: {
    term: "APY methodology",
    short: "Emission ÷ stake, net of take",
    long: "Directory and detail snapshot APY annualize the latest captured epoch rate across eligible subnet memberships (server-side apy_estimate). History tiles annualize the latest daily rewards-per-1k-τ rate from neuron_daily, net of validator take. Both can swing between refreshes.",
  },
} as const;

/** Compact risk note for placing directly beside an APY / yield figure. */
export function StakingRiskNote({
  netuid,
  className,
}: {
  /** Pass 0 for root, any other netuid for alpha, omit for blended/unknown. */
  netuid?: number | null;
  className?: string;
}) {
  const copy =
    netuid == null
      ? `${STAKING_RISK_COPY.root.short}. ${STAKING_RISK_COPY.alpha.short}.`
      : netuid === 0
        ? STAKING_RISK_COPY.root.short
        : STAKING_RISK_COPY.alpha.short;

  return (
    <p
      className={classNames(
        "text-[10px] leading-relaxed text-ink-muted",
        className,
      )}
    >
      {copy}
    </p>
  );
}

function SubnetSections() {
  return (
    <>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-strong">
          Sparklines
        </div>
        <p className="mt-1">
          Uptime &amp; latency sparklines plot the active health window (7d
          default, switchable to 30d). Each point is the mean across every
          tracked endpoint in that bucket — gaps mean no probe landed in the
          window, not zero.
        </p>
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-strong">
          Donuts &amp; mosaics
        </div>
        <p className="mt-1">
          Pool ratio comes from on-chain AMM reserves; endpoint topology counts
          tracked public surfaces by kind. The mosaic in Operational status
          colors one cell per endpoint by its last probe result.
        </p>
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-strong">
          Staleness
        </div>
        <p className="mt-1">
          Tiles show a <span className="text-health-warn-text">stale</span> chip
          when the snapshot is older than the refresh budget. Visuals still
          render with the last known values; retry buttons re-fetch just the
          affected panel. Each tile carries its own{" "}
          <span className="text-ink-strong">updated · window</span> stamp so you
          can tell stale from missing at a glance.
        </p>
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-strong">
          Verified vs. candidate
        </div>
        <p className="mt-1">
          Only curated surfaces feed donuts and the topology breakdown.
          Unverified leads live in the Candidates tab and never count toward
          health, completeness, or pool ratios.
        </p>
      </div>
    </>
  );
}

function StakingSections() {
  const sections = [
    STAKING_RISK_COPY.root,
    STAKING_RISK_COPY.alpha,
    STAKING_RISK_COPY.windows,
    STAKING_RISK_COPY.methodology,
  ];
  return (
    <>
      {sections.map((s) => (
        <div key={s.term}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-strong">
            {s.term}
          </div>
          <p className="mt-1">{s.long}</p>
        </div>
      ))}
    </>
  );
}

export function MethodologyCallout({
  generatedAt,
  windowLabel,
  variant = "subnet",
}: {
  generatedAt?: string;
  windowLabel?: string;
  variant?: MethodologyVariant;
}) {
  const [open, setOpen] = useState(false);
  const freshLine = formatFreshness(generatedAt, windowLabel);
  const freshAbs = formatFreshnessAbsolute(generatedAt);
  const isStaking = variant === "staking";
  const title = isStaking
    ? "Staking risk & yield methodology"
    : "Data freshness & methodology";
  const ariaLabel = isStaking
    ? "Staking risk and yield methodology"
    : "Data freshness and methodology";
  const body: ReactNode = isStaking ? <StakingSections /> : <SubnetSections />;

  return (
    <aside
      aria-label={ariaLabel}
      className="mb-6 rounded-lg border border-border bg-card/60"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            {title}
          </span>
          {freshLine ? (
            <span
              className="mt-0.5 block font-mono text-[10px] text-ink-muted/80"
              title={freshAbs ?? undefined}
            >
              {freshLine}
            </span>
          ) : isStaking ? (
            <span className="mt-0.5 block font-mono text-[10px] text-ink-muted/80">
              Root: no principal risk · Alpha: price-exposed · windows labeled,
              not projected
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={classNames(
            "mt-0.5 size-3.5 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-border px-3 py-3 text-[11.5px] leading-relaxed text-ink-muted md:grid-cols-2">
          {body}
        </div>
      ) : null}
    </aside>
  );
}
