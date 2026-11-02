import { useEffect, useRef, useState } from "react";
import { formatCompact, formatPrice } from "../lib/format";

interface Day {
  date: string;
  total: number;
  orders: number;
}

const H = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 52 };

/** Sales for the last 7 days: one series, one hue, with a hover tooltip per bar. */
export function SalesChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  // Draw at the real width so axis text keeps its size on small screens.
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...days.map((d) => d.total), 1);
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / days.length;
  const barW = Math.min(36, slot * 0.5);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

  const label = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", W < 480 ? { weekday: "narrow" } : { weekday: "short", day: "numeric" });

  const current = active !== null ? days[active] : null;
  // Tall bars get the tooltip beside them so it stays inside the chart.
  const beside = current !== null && y(current.total) < PAD.top + innerH * 0.45;
  const toLeft = active !== null && active >= days.length / 2;

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Sales for the last 7 days" onMouseLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 8} y={y(t)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
              {t === 0 ? "0" : formatCompact(t).replace("Rs ", "")}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = Math.max(0, y(0) - y(d.total));
          const r = Math.min(4, h / 2);
          const x0 = cx - barW / 2;
          const yTop = y(0) - h;
          return (
            <g key={d.date} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0}>
              {/* Hit area larger than the bar */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {h > 0 && (
                <path
                  className={`chart-bar ${active === i ? "active" : ""}`}
                  d={`M${x0},${y(0)} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + barW - r} Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r} V${y(0)} Z`}
                />
              )}
              <text x={cx} y={H - 8} className="chart-axis" textAnchor="middle">
                {label(d.date)}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="chart-baseline" />
      </svg>
      {current && active !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%`,
            top: `${(y(current.total) / H) * 100}%`,
            transform: beside
              ? `translate(${toLeft ? `calc(-100% - ${barW / 2 + 8}px)` : `${barW / 2 + 8}px`}, 0)`
              : undefined,
          }}
        >
          <strong>
            {new Date(`${current.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
          </strong>
          <span>{formatPrice(current.total)}</span>
          <small>
            {current.orders} {current.orders === 1 ? "order" : "orders"}
          </small>
        </div>
      )}
    </div>
  );
}

function niceStep(raw: number) {
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}
