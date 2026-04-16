import { getAdherenceHistory } from "../../hooks/useDailyTasks";

export function ObservanceChart() {
  const history = getAdherenceHistory();
  const max = 100;

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-sm">Observance — 7 derniers jours</h3>
        <span className="text-xs font-bold text-[#10AC84] bg-[#1DD1A1]/10 px-2 py-1 rounded-lg">
          Moy. {Math.round(history.reduce((a, d) => a + d.pct, 0) / history.length)}%
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {history.map((day, i) => {
          const height = day.pct > 0 ? Math.max((day.pct / max) * 72, 6) : 4;
          const isToday = i === history.length - 1;
          const color =
            day.pct >= 75 ? (isToday ? "bg-[#10AC84]" : "bg-[#1DD1A1]/70") :
            day.pct >= 50 ? (isToday ? "bg-[#FF9F43]" : "bg-[#FF9F43]/60") :
            day.pct > 0   ? (isToday ? "bg-rose-400"  : "bg-rose-300/60") :
            "bg-gray-100";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: 76 }}>
                <div
                  className={`w-full rounded-t-lg transition-all ${color} relative group`}
                  style={{ height }}
                >
                  {day.pct > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.pct}%
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold capitalize ${isToday ? "text-[#10AC84]" : "text-gray-400"}`}>
                {day.date}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10AC84]" /><span className="text-[9px] font-bold text-gray-400">≥75%</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF9F43]" /><span className="text-[9px] font-bold text-gray-400">≥50%</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[9px] font-bold text-gray-400">&lt;50%</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200" /><span className="text-[9px] font-bold text-gray-400">Non renseigné</span></div>
      </div>
    </div>
  );
}
