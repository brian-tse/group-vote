"use client";

import { useState, useCallback, useMemo } from "react";

// --- TYPES ---
interface Member {
  abbr: string;
  name: string;
  ret: "full" | "half" | "retired";
  note?: string;
  start?: string;
  partTime?: boolean;
}

// --- CONSTANTS ---
const TOTAL_WEEKENDS = 52;
const HOLIDAY_WEEKENDS = 8;
const REGULAR_WEEKENDS = TOTAL_WEEKENDS - HOLIDAY_WEEKENDS; // 44
const HOLIDAY_CREW = 6;
const MON_HOLIDAYS = 5;
const THU_HOLIDAYS = 3;
const REGULAR_WEEKS = 44;
const BASELINE_FTE = 31;

// Call type sub-categories (2 positions each)
const CALL_TYPES = [
  { key: "longDay", label: "Long Day", positions: "P1 AM, OB AM", slots: 2 },
  { key: "extended", label: "Extended", positions: "P2, P3", slots: 2 },
  { key: "evening", label: "Evening", positions: "P1 PM, OB PM", slots: 2 },
] as const;

// Mon-Thu working days per year: 44×4 + 5×3 + 3×3 = 200
const MON_THU_DAYS = (REGULAR_WEEKS * 4) + (MON_HOLIDAYS * 3) + (THU_HOLIDAYS * 3); // 200
// Friday working days: 44 (holiday Fridays covered by holiday team)
const FRIDAY_DAYS = REGULAR_WEEKS; // 44

// Baseline slots (at crew=5, 31 FTE)
const BASELINE = {
  monThu: { longDay: 400, extended: 400, evening: 400, total: 1200 },
  friday: { longDay: 88, extended: 88, evening: 88, total: 264 },
  fridayWeekdayPool: { longDay: 88, extended: 88, evening: 0, total: 176 },
  weekend: 268,
};

const INITIAL_CV: Member[] = [
  { abbr: "BB", name: "Bruce Bainton", ret: "full" },
  { abbr: "ER", name: "Emily Reinys", ret: "half", note: "shares w/ EB", partTime: true },
  { abbr: "JB", name: "Joe Borau", ret: "full" },
  { abbr: "KA", name: "Michael Kang", ret: "full" },
  { abbr: "KT", name: "Kristen Telischak", ret: "full" },
  { abbr: "SP", name: "Shaun Patel", ret: "full" },
  { abbr: "TH", name: "Tyken Hsieh", ret: "full" },
  { abbr: "VH", name: "Vernon Huang", ret: "full" },
];

const INITIAL_GEN: Member[] = [
  { abbr: "BG", name: "Bhanu Guruswami", ret: "full" },
  { abbr: "BR", name: "Jared Brown", ret: "full", note: "ICU, part-time call" },
  { abbr: "CC", name: "Celia Carpenter", ret: "full" },
  { abbr: "DET", name: "Taylor Deng", ret: "full" },
  { abbr: "DG", name: "Donald Graves", ret: "full" },
  { abbr: "EB", name: "Eric Brouch", ret: "half", note: "shares w/ ER", partTime: true },
  { abbr: "EC", name: "Edwin Cheng", ret: "full" },
  { abbr: "GRJ", name: "Justin Grubbs", ret: "full" },
  { abbr: "HUM", name: "Michael Huang", ret: "full" },
  { abbr: "JF", name: "Joseph Fenerty", ret: "full" },
  { abbr: "MOR", name: "Rebecca Morris", ret: "full" },
  { abbr: "NEB", name: "Brenna Nelsen", ret: "full" },
  { abbr: "PAC", name: "Chris Painter", ret: "full" },
  { abbr: "PAM", name: "Megha Parekh", ret: "full" },
  { abbr: "PHJ", name: "Justin Pham", ret: "full" },
  { abbr: "PN", name: "Preston Neumayr", ret: "full" },
  { abbr: "SOL", name: "Laura Soriano", ret: "full" },
  { abbr: "TOL", name: "Lisa To", ret: "full" },
  { abbr: "TRK", name: "Khiem Tran", ret: "full" },
  { abbr: "TSB", name: "Brian Tse", ret: "full" },
  { abbr: "VAR", name: "Margie Vartanian", ret: "full" },
  { abbr: "VUV", name: "Vivian Vu", ret: "full" },
  { abbr: "WUC", name: "Max Wu", ret: "full" },
  { abbr: "YEL", name: "Caroline Yeldezian", ret: "full" },
];

const INITIAL_NEW: Member[] = [
  { abbr: "DAN", name: "Daniels", ret: "full", start: "Fall 2026" },
  { abbr: "YIP", name: "Yip", ret: "full", start: "Fall 2026" },
  { abbr: "KOS", name: "Kosasih", ret: "full", start: "9/14/2026" },
  { abbr: "SON", name: "Sonderman", ret: "full", start: "10/5/2026" },
  { abbr: "MAR", name: "Evida Mars-Holt", ret: "full", start: "Sept 2026" },
  { abbr: "N6", name: "New Member 6", ret: "full", start: "TBD" },
  { abbr: "N7", name: "New Member 7", ret: "full", start: "TBD" },
  { abbr: "N8", name: "New Member 8", ret: "full", start: "TBD" },
];

// --- HELPERS ---
function retWeight(state: Member["ret"]): number {
  if (state === "full") return 1;
  if (state === "half") return 0.5;
  return 0;
}

function cycleRet(state: Member["ret"], partTime?: boolean): Member["ret"] {
  if (partTime) return state === "half" ? "retired" : "half";
  const order: Member["ret"][] = ["full", "half", "retired"];
  return order[(order.indexOf(state) + 1) % 3];
}

function fmtNum(n: number, decimals = 1): string {
  return n % 1 === 0 ? String(n) : n.toFixed(decimals);
}

// --- COMPONENTS ---
function Delta({ value, suffix = "", inverted = false }: { value: number; suffix?: string; inverted?: boolean }) {
  if (Math.abs(value) < 0.05) return <span className="text-slate-400">—</span>;
  const isBetter = inverted ? value < 0 : value > 0;
  const color = isBetter ? "text-emerald-400" : "text-red-400";
  const sign = value > 0 ? "+" : "";
  return <span className={`font-bold ${color}`}>{sign}{fmtNum(value)}{suffix}</span>;
}

function RetToggle({ state, onChange, partTime }: { state: Member["ret"]; onChange: () => void; partTime?: boolean }) {
  const colors = { full: "bg-emerald-500 text-slate-900", half: "bg-orange-400 text-slate-900", retired: "bg-red-400 text-slate-900" };
  const options = partTime ? (["half", "retired"] as const) : (["full", "half", "retired"] as const);
  return (
    <div className="inline-flex border border-slate-600 rounded-md overflow-hidden">
      {options.map((s) => (
        <button key={s} onClick={onChange}
          className={`px-2 py-0.5 text-[0.7rem] transition-all cursor-pointer ${state === s ? colors[s] + " font-bold" : "text-slate-400"}`}>
          {s === "full" ? "Full" : s === "half" ? "Half" : "No Call"}
        </button>
      ))}
    </div>
  );
}

function Badge({ type }: { type: "cv" | "gen" | "new" }) {
  const styles = { cv: "bg-sky-400", gen: "bg-indigo-400", new: "bg-emerald-400" };
  const labels = { cv: "CV", gen: "GEN", new: "NEW" };
  return <span className={`${styles[type]} text-slate-900 text-[0.6rem] px-1.5 py-px rounded font-bold`}>{labels[type]}</span>;
}

function RosterTable({ members, type, onToggle }: { members: Member[]; type: "cv" | "gen" | "new"; onToggle: (i: number) => void }) {
  return (
    <table className="w-full border-collapse text-[0.82rem]">
      <thead>
        <tr className="text-left text-slate-400 font-semibold">
          <th className="px-2 py-1 border-b border-slate-600">Abbr</th>
          <th className="px-2 py-1 border-b border-slate-600">Name</th>
          <th className="px-2 py-1 border-b border-slate-600">Status</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m, i) => (
          <tr key={m.abbr} className="hover:bg-slate-700/50 border-b border-slate-700/30">
            <td className="px-2 py-1"><Badge type={type} /> <span className="ml-1 font-mono text-xs">{m.abbr}</span></td>
            <td className="px-2 py-1">
              {m.name}
              {m.note && <span className="text-slate-400 text-[0.72rem] ml-1">({m.note})</span>}
              {m.start && <span className="text-slate-400 text-[0.72rem] ml-1">{m.start}</span>}
            </td>
            <td className="px-2 py-1"><RetToggle state={m.ret} onChange={() => onToggle(i)} partTime={m.partTime} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResultBox({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
      <div className="text-[0.75rem] text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-extrabold text-sky-400">{value}</div>
      <div className="text-sm text-slate-400">{sub}</div>
    </div>
  );
}

// --- MAIN ---
export default function CallBurdenPage() {
  const [cv, setCv] = useState<Member[]>(INITIAL_CV);
  const [gen, setGen] = useState<Member[]>(INITIAL_GEN);
  const [newMembers, setNewMembers] = useState<Member[]>(INITIAL_NEW);
  const [newCount, setNewCount] = useState(0);
  const [weekendCrew, setWeekendCrew] = useState<4 | 5>(5);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [callView, setCallView] = useState<"combined" | "split">("combined");

  const toggleMember = useCallback((list: Member[], setList: React.Dispatch<React.SetStateAction<Member[]>>, idx: number) => {
    setList((prev) => prev.map((m, i) => i === idx ? { ...m, ret: cycleRet(m.ret, m.partTime) } : m));
  }, []);

  const fte = useMemo(() => {
    const erW = retWeight(cv.find((p) => p.abbr === "ER")!.ret);
    const ebW = retWeight(gen.find((p) => p.abbr === "EB")!.ret);
    const sharedWeight = Math.min(erW + ebW, 1);
    let total = 0;
    cv.forEach((p) => { if (p.abbr !== "ER") total += retWeight(p.ret); });
    gen.forEach((p) => { if (p.abbr !== "EB") total += retWeight(p.ret); });
    total += sharedWeight;
    for (let i = 0; i < newCount; i++) total += retWeight(newMembers[i].ret);
    return total;
  }, [cv, gen, newMembers, newCount]);

  const slots = useMemo(() => {
    // How many Friday evening slots are covered by weekend team
    const friEveningByWeekend = weekendCrew === 5 ? 2 : 0;

    // Mon-Thu: all 6 slots every day, 200 days
    const monThu = {
      longDay: MON_THU_DAYS * 2,   // P1 AM, OB AM
      extended: MON_THU_DAYS * 2,   // P2, P3
      evening: MON_THU_DAYS * 2,    // P1 PM, OB PM
      total: MON_THU_DAYS * 6,
    };

    // Friday: always 6 people work, but evening may be weekend team
    const friday = {
      longDay: FRIDAY_DAYS * 2,
      extended: FRIDAY_DAYS * 2,
      evening: FRIDAY_DAYS * 2, // total positions (all 6 work)
      eveningByWeekend: FRIDAY_DAYS * friEveningByWeekend, // portion from weekend pool
      eveningByWeekday: FRIDAY_DAYS * (2 - friEveningByWeekend), // portion from weekday pool
      total: FRIDAY_DAYS * 6, // always 264
      weekdayPoolTotal: FRIDAY_DAYS * (6 - friEveningByWeekend), // slots from weekday call pool
    };

    // Weekend
    const weekend = (REGULAR_WEEKENDS * weekendCrew) + (HOLIDAY_WEEKENDS * HOLIDAY_CREW);

    return { monThu, friday, weekend };
  }, [weekendCrew]);

  const fteDiff = fte - BASELINE_FTE;

  // Per-FTE calculations
  const ppMonThu = fte > 0 ? slots.monThu.total / fte : 0;
  const ppFriday = fte > 0 ? slots.friday.total / fte : 0;
  const ppWeekend = fte > 0 ? slots.weekend / fte : 0;

  // Baselines (at 31 FTE, crew=5)
  const basePPMonThu = BASELINE.monThu.total / BASELINE_FTE;
  const basePPFriday = BASELINE.friday.total / BASELINE_FTE;
  const basePPWeekend = BASELINE.weekend / BASELINE_FTE;

  // Sub-category per-FTE
  const ppMonThuSub = {
    longDay: fte > 0 ? slots.monThu.longDay / fte : 0,
    extended: fte > 0 ? slots.monThu.extended / fte : 0,
    evening: fte > 0 ? slots.monThu.evening / fte : 0,
  };
  const ppFridaySub = {
    longDay: fte > 0 ? slots.friday.longDay / fte : 0,
    extended: fte > 0 ? slots.friday.extended / fte : 0,
    evening: fte > 0 ? slots.friday.evening / fte : 0,
  };
  const baseSub = {
    monThu: { longDay: BASELINE.monThu.longDay / BASELINE_FTE, extended: BASELINE.monThu.extended / BASELINE_FTE, evening: BASELINE.monThu.evening / BASELINE_FTE },
    friday: { longDay: BASELINE.friday.longDay / BASELINE_FTE, extended: BASELINE.friday.extended / BASELINE_FTE, evening: BASELINE.friday.evening / BASELINE_FTE },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 max-w-5xl mx-auto font-sans leading-relaxed">
      <h1 className="text-2xl font-bold">📊 Call Burden Calculator</h1>
      <p className="text-slate-400 text-sm mb-4">ACAMG Anesthesia Group — Mills Peninsula Medical Center</p>

      {/* CONTROLS */}
      <section className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-sky-400 mb-3">⚙️ Controls</h2>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <label className="text-sm min-w-[160px]">New Members (0–8):</label>
          <input type="range" min={0} max={8} value={newCount}
            onChange={(e) => setNewCount(Number(e.target.value))}
            className="flex-1 min-w-[120px] accent-sky-400" />
          <span className="font-bold text-lg text-sky-400 min-w-[30px] text-center">{newCount}</span>
        </div>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <label className="text-sm min-w-[160px]">Weekend Staff Size:</label>
          <div className="inline-flex border border-slate-600 rounded-md overflow-hidden">
            {([4, 5] as const).map((n) => (
              <button key={n} onClick={() => setWeekendCrew(n)}
                className={`px-4 py-1 text-sm transition cursor-pointer ${weekendCrew === n ? "bg-sky-400 text-slate-900 font-bold" : "text-slate-400"}`}>
                {n}{n === 5 ? " (default)" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm min-w-[160px]">Call Breakdown:</label>
          <div className="inline-flex border border-slate-600 rounded-md overflow-hidden">
            {([["combined", "Combined"], ["split", "By Call Type"]] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setCallView(val as "combined" | "split")}
                className={`px-4 py-1 text-sm transition cursor-pointer ${callView === val ? "bg-sky-400 text-slate-900 font-bold" : "text-slate-400"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-sky-400 mb-3">📈 Results</h2>

        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ResultBox label="Effective FTE" value={fmtNum(fte)}
            sub={<Delta value={fteDiff} suffix=" from 31" />} />
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-[0.75rem] text-slate-400 uppercase tracking-wider">Weekend / FTE</div>
            <div className="text-2xl font-extrabold text-sky-400">{fmtNum(ppWeekend)}<span className="text-base font-normal text-slate-400">/yr</span></div>
            <div className="text-xs text-slate-400">{fmtNum(ppWeekend / 12)}/mo · 1 every {ppWeekend > 0 ? Math.round(52 / ppWeekend) : "∞"} wks</div>
            <div className="text-sm mt-1"><Delta value={ppWeekend - basePPWeekend} inverted /></div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-[0.75rem] text-slate-400 uppercase tracking-wider">Mon–Thu Call / FTE</div>
            <div className="text-2xl font-extrabold text-sky-400">{fmtNum(ppMonThu)}<span className="text-base font-normal text-slate-400">/yr</span></div>
            <div className="text-xs text-slate-400">{fmtNum(ppMonThu / 12)}/mo · {fmtNum(ppMonThu / 52, 2)}/wk</div>
            <div className="text-sm mt-1"><Delta value={ppMonThu - basePPMonThu} inverted /></div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-[0.75rem] text-slate-400 uppercase tracking-wider">Friday Call / FTE</div>
            <div className="text-2xl font-extrabold text-sky-400">{fmtNum(ppFriday)}<span className="text-base font-normal text-slate-400">/yr</span></div>
            <div className="text-xs text-slate-400">{fmtNum(ppFriday / 12)}/mo · 1 every {ppFriday > 0 ? Math.round(52 / ppFriday) : "∞"} wks</div>
            <div className="text-sm mt-1"><Delta value={ppFriday - basePPFriday} inverted /></div>
          </div>
        </div>

        {/* Category Breakdown */}
        <h3 className="text-sm font-semibold text-indigo-400 mt-4 mb-2">Category Breakdown</h3>

        {callView === "combined" ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-slate-400 font-semibold">
                  <th className="px-2 py-1 border-b border-slate-600">Category</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Total Slots</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Per FTE</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Baseline</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Δ Per FTE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1">Mon–Thu Weekday</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.monThu.total.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppMonThu)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPMonThu)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppMonThu - basePPMonThu} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1">
                    Friday
                    {weekendCrew === 5 && <span className="text-slate-500 text-xs ml-1">(incl. 2 evening slots from weekend team)</span>}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.friday.total.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppFriday)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPFriday)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppFriday - basePPFriday} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1">Weekend</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.weekend.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppWeekend)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPWeekend)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppWeekend - basePPWeekend} inverted /></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-slate-400 font-semibold">
                  <th className="px-2 py-1 border-b border-slate-600">Category</th>
                  <th className="px-2 py-1 border-b border-slate-600">Call Type</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Slots</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Per FTE</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Baseline</th>
                  <th className="px-2 py-1 border-b border-slate-600 text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {/* Mon-Thu sub-rows */}
                <tr className="border-b border-slate-700/30 bg-slate-800/50">
                  <td className="px-2 py-1 font-semibold" rowSpan={4}>Mon–Thu</td>
                  <td className="px-2 py-1">P1 AM, OB AM</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.monThu.longDay}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppMonThuSub.longDay)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.monThu.longDay)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppMonThuSub.longDay - baseSub.monThu.longDay} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30 bg-slate-800/50">
                  <td className="px-2 py-1">P2, P3</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.monThu.extended}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppMonThuSub.extended)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.monThu.extended)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppMonThuSub.extended - baseSub.monThu.extended} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30 bg-slate-800/50">
                  <td className="px-2 py-1">P1 PM, OB PM</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.monThu.evening}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppMonThuSub.evening)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.monThu.evening)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppMonThuSub.evening - baseSub.monThu.evening} inverted /></td>
                </tr>
                <tr className="border-b border-slate-600 font-semibold">
                  <td className="px-2 py-1">All Mon–Thu</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.monThu.total}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppMonThu)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPMonThu)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppMonThu - basePPMonThu} inverted /></td>
                </tr>

                {/* Friday sub-rows */}
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1 font-semibold" rowSpan={4}>Friday</td>
                  <td className="px-2 py-1">P1 AM, OB AM</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.friday.longDay}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppFridaySub.longDay)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.friday.longDay)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppFridaySub.longDay - baseSub.friday.longDay} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1">P2, P3</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.friday.extended}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppFridaySub.extended)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.friday.extended)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppFridaySub.extended - baseSub.friday.extended} inverted /></td>
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1">
                    P1 PM, OB PM
                    {weekendCrew === 5 && <span className="text-amber-400/70 text-xs ml-1">← weekend team</span>}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.friday.evening}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppFridaySub.evening)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(baseSub.friday.evening)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppFridaySub.evening - baseSub.friday.evening} inverted /></td>
                </tr>
                <tr className="border-b border-slate-600 font-semibold">
                  <td className="px-2 py-1">All Friday</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.friday.total}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppFriday)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPFriday)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppFriday - basePPFriday} inverted /></td>
                </tr>

                {/* Weekend */}
                <tr className="border-b border-slate-700/30">
                  <td className="px-2 py-1 font-semibold">Weekend</td>
                  <td className="px-2 py-1 text-slate-400 text-xs">Full assignment</td>
                  <td className="px-2 py-1 text-right tabular-nums">{slots.weekend}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(ppWeekend)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{fmtNum(basePPWeekend)}</td>
                  <td className="px-2 py-1 text-right"><Delta value={ppWeekend - basePPWeekend} inverted /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ROSTER — collapsible */}
      <section className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
        <button onClick={() => setRosterOpen(!rosterOpen)} className="w-full flex items-center justify-between cursor-pointer">
          <h2 className="text-lg font-semibold text-sky-400">👥 Adjust Roster</h2>
          <span className="text-slate-400 text-xl transition-transform" style={{ transform: rosterOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </button>
        <p className="text-slate-400 text-xs mt-1">Toggle individual member status to model staffing changes. EB &amp; ER share one position (count as 1 FTE).</p>

        {rosterOpen && (
          <div className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-indigo-400 mb-1">CV (Cardiac-Certified)</h3>
                <RosterTable members={cv} type="cv" onToggle={(i) => toggleMember(cv, setCv, i)} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-400 mb-1">General</h3>
                <RosterTable members={gen} type="gen" onToggle={(i) => toggleMember(gen, setGen, i)} />
              </div>
            </div>
            {newCount > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-emerald-400 mb-1">New Members</h3>
                <RosterTable members={newMembers.slice(0, newCount)} type="new" onToggle={(i) => toggleMember(newMembers, setNewMembers, i)} />
              </div>
            )}
            <div className="mt-3 text-sm">
              Effective FTE: <span className="text-sky-400 font-bold">{fmtNum(fte)}</span>
              {" "}<Delta value={fteDiff} suffix={fteDiff === 0 ? "" : " from 31"} />
              {fteDiff === 0 && <span className="text-slate-400"> (baseline)</span>}
            </div>
          </div>
        )}
      </section>

      {/* MATH */}
      <section className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-sky-400 mb-2">🔢 The Math</h2>
        <pre className="bg-slate-700/50 rounded-lg p-3 text-[0.8rem] text-slate-300 font-mono leading-loose whitespace-pre-wrap">
{`Mon–Thu Weekday Call (6 positions/day):
  Long Day (P1 AM, OB AM):  ${MON_THU_DAYS} days × 2 = ${slots.monThu.longDay}
  Extended (P2, P3):         ${MON_THU_DAYS} days × 2 = ${slots.monThu.extended}
  Evening (P1 PM, OB PM):   ${MON_THU_DAYS} days × 2 = ${slots.monThu.evening}
  Total: ${slots.monThu.total}
  (${MON_THU_DAYS} days = ${REGULAR_WEEKS}×4 regular + ${MON_HOLIDAYS}×3 Mon holidays + ${THU_HOLIDAYS}×3 Thu holidays)

Friday Call (6 positions, ${FRIDAY_DAYS} Fridays):
  Long Day:  ${FRIDAY_DAYS} × 2 = ${slots.friday.longDay}
  Extended:  ${FRIDAY_DAYS} × 2 = ${slots.friday.extended}
  Evening:   ${FRIDAY_DAYS} × 2 = ${slots.friday.evening}${weekendCrew === 5 ? "  ← filled by weekend team" : ""}
  Total: ${slots.friday.total}

Weekend:
  Regular: ${REGULAR_WEEKENDS} × ${weekendCrew} = ${REGULAR_WEEKENDS * weekendCrew}
  Holiday: ${HOLIDAY_WEEKENDS} × ${HOLIDAY_CREW} = ${HOLIDAY_WEEKENDS * HOLIDAY_CREW}
  Total: ${slots.weekend}

Note: Weekend and weekday are different units —
a weekend assignment spans multiple shifts.
Friday evening slots (P1 PM, OB PM) are${weekendCrew === 5 ? " filled by the weekend team starting Fri PM." : " filled by the weekday call pool (crew of 4 starts Sat)."}`}
        </pre>
      </section>

      {/* EXPLANATION */}
      <section className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-sky-400 mb-2">📖 How It Works</h2>
        <div className="text-sm text-slate-400 leading-loose space-y-2">
          <p><strong className="text-slate-200">6 Call Positions per day:</strong> P1 AM, OB AM, P2, P3, P1 PM, OB PM — each filled by a separate person.</p>
          <p><strong className="text-slate-200">Friday Evening:</strong> With a 5-person weekend staff, 2 start Friday PM and cover the evening slots (OB PM + P1 PM). With a 4-person staff, nobody starts Friday PM — all 6 Friday positions are filled from the weekday call pool.</p>
          <p><strong className="text-slate-200">Weekends:</strong> Regular weekends have {weekendCrew} people. Holiday weekends always have 6 (8 holidays/year).</p>
          <p><strong className="text-slate-200">Holiday Adjustments:</strong> 5 Monday holidays (team covers Fri + Mon → Tue–Thu only). 3 Thursday holidays (team covers Thu + Fri → Mon–Wed only).</p>
          <p><strong className="text-slate-200">Half Call:</strong> 0.5× call weight. <strong className="text-slate-200">No Call:</strong> excluded entirely.</p>
        </div>
      </section>

      {/* ACKNOWLEDGEMENT */}
      <p className="text-center text-xs text-slate-500 mt-2 mb-4">
        Inspired by Ariel Angell. Built for ACAMG.
      </p>
    </div>
  );
}
