import { api, safe, formatSats, formatNumber, compactNumber } from "@/lib/api";
import { Panel } from "@/components/panel";
import { RankBar } from "@/components/chart";

export const revalidate = 3600;

type IspRow = [string, string, number, number, number];

export default async function Geography() {
  const [countries, ispsResp] = await Promise.all([
    safe(api.countries()),
    safe(api.isps()),
  ]);

  const sortedCountries = (countries ?? [])
    .slice()
    .sort((a, b) => b.capacity - a.capacity);
  const maxCountryCap = sortedCountries[0]?.capacity ?? 1;
  const totalCountryCap = sortedCountries.reduce((s, c) => s + c.capacity, 0);

  const ispRows: IspRow[] = (ispsResp?.ispRanking ?? []).slice(0, 30) as IspRow[];
  const maxIsp = ispRows[0]?.[2] ?? 1;
  const totalIspCap =
    (ispsResp?.clearnetCapacity ?? 0) +
    (ispsResp?.torCapacity ?? 0) +
    (ispsResp?.unknownCapacity ?? 0);
  const torShare =
    totalIspCap > 0 ? ((ispsResp?.torCapacity ?? 0) / totalIspCap) * 100 : 0;
  const clearShare =
    totalIspCap > 0 ? ((ispsResp?.clearnetCapacity ?? 0) / totalIspCap) * 100 : 0;
  const unknownShare =
    totalIspCap > 0 ? (((ispsResp?.unknownCapacity ?? 0)) / totalIspCap) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="rule-b px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="mono-xs text-amber mb-2">§ 03 · GEOGRAPHY</div>
          <h1 className="display text-[32px] md:text-[52px] leading-none text-paper">
            WHERE THE LIGHT LIVES
          </h1>
          <p className="ui text-[12px] md:text-[13px] text-paper-dim mt-2 max-w-xl">
            The Lightning Network has no jurisdiction. Its nodes sit in data
            centers and living rooms worldwide — this is where.
          </p>
        </div>
        <div className="mono-xs text-paper-faint tabular md:pb-1 md:text-right">
          <div>{sortedCountries.length} COUNTRIES</div>
          <div>Σ {formatSats(totalCountryCap)} BTC</div>
        </div>
      </div>

      {/* Network type split */}
      <div className="rule-b px-4 md:px-6 py-5 md:py-6">
        <div className="mono-xs text-paper-faint mb-3">
          § NETWORK TYPE · CAPACITY SHARE
        </div>
        <div className="relative h-[4px] overflow-hidden bg-[color:var(--rule-2)]">
          <div
            className="absolute top-0 left-0 h-full bg-amber"
            style={{ width: `${clearShare}%` }}
          />
          <div
            className="absolute top-0 h-full bg-paper"
            style={{ left: `${clearShare}%`, width: `${torShare}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-5">
          <LegendStat
            swatch="bg-amber"
            label="CLEARNET"
            value={formatSats(ispsResp?.clearnetCapacity ?? 0)}
            pct={clearShare}
          />
          <LegendStat
            swatch="bg-paper"
            label="TOR"
            value={formatSats(ispsResp?.torCapacity ?? 0)}
            pct={torShare}
          />
          <LegendStat
            swatch="bg-[color:var(--rule-strong)]"
            label="UNKNOWN"
            value={formatSats(ispsResp?.unknownCapacity ?? 0)}
            pct={unknownShare}
          />
        </div>
      </div>

      {/* Two-pane: countries + ISPs — stack on mobile */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:gap-[1px] lg:bg-[color:var(--rule)]">
        <div className="bg-ink rule-b lg:border-b-0">
          <Panel
            id="G01"
            title="BY COUNTRY"
            meta={`${sortedCountries.length} TOTAL`}
            className="h-full border-0"
          >
            <div className="lg:overflow-auto lg:h-full lg:max-h-[70vh]">
              <div>
                {sortedCountries.slice(0, 40).map((c, i) => (
                  <div
                    key={`${c.iso ?? "xx"}-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5 rule-b"
                  >
                    <div className="mono-xs tabular text-paper-faint w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mono-xs text-amber uppercase w-6 shrink-0">
                      {c.iso}
                    </div>
                    <div className="ui text-[12px] text-paper truncate flex-1 min-w-0">
                      {c.name.en}
                    </div>
                    <div className="hidden sm:block flex-1 min-w-0 max-w-[35%]">
                      <RankBar value={c.capacity} max={maxCountryCap} />
                    </div>
                    <div className="shrink-0 text-right mono tabular text-paper text-[12px] min-w-[64px]">
                      {formatSats(c.capacity)}
                      <span className="text-paper-faint ml-1 text-[9px]">BTC</span>
                    </div>
                    <div className="shrink-0 text-right mono-xs tabular text-paper-dim w-10">
                      {formatNumber(c.count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="bg-ink">
          <Panel
            id="G02"
            title="BY HOSTING NETWORK"
            meta="TOP 30 ISPs"
            className="h-full border-0"
          >
            <div className="lg:overflow-auto lg:h-full lg:max-h-[70vh]">
              <div>
                {ispRows.map((row, i) => {
                  const [asn, name, capacity, channels, nodes] = row;
                  return (
                    <div
                      key={`${asn}-${i}`}
                      className="flex items-center gap-3 px-4 py-2.5 rule-b"
                    >
                      <div className="mono-xs tabular text-paper-faint w-6 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="ui text-[12px] text-paper truncate">
                          {name}
                        </div>
                        <div className="mono-xs text-paper-faint tabular">
                          AS{asn} · {compactNumber(nodes)}n · {compactNumber(channels)}c
                        </div>
                      </div>
                      <div className="hidden sm:block w-[25%]">
                        <RankBar value={capacity} max={maxIsp} />
                      </div>
                      <div className="shrink-0 text-right mono tabular text-paper text-[12px] min-w-[64px]">
                        {formatSats(capacity)}
                        <span className="text-paper-faint ml-1 text-[9px]">BTC</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function LegendStat({
  swatch,
  label,
  value,
  pct,
}: {
  swatch: string;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 inline-block ${swatch}`} />
        <span className="mono-xs text-paper-faint">{label}</span>
      </div>
      <div className="display tabular text-[34px] text-paper leading-none">
        {value}
        <span className="mono text-[11px] text-paper-dim ml-1.5">BTC</span>
      </div>
      <div className="mono-xs text-paper-dim tabular mt-1">
        {pct.toFixed(1)}% of total
      </div>
    </div>
  );
}
