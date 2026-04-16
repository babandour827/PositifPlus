import { cn } from "../../lib/utils";

export function Logo({ className, variant = "full" }: { className?: string, variant?: "full" | "icon" | "splash" }) {
  if (variant === "splash") {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-[#FF6B6B] rounded-[2rem] rotate-45 opacity-20 animate-pulse"></div>
          <div className="absolute inset-0 bg-[#FF9F43] rounded-[2rem] rotate-12 opacity-40"></div>
          <div className="absolute inset-2 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-3xl flex items-center justify-center shadow-lg shadow-[#FF6B6B]/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-[#FF6B6B] tracking-tight mb-2 font-sans">
          Positif<span className="text-[#10AC84]">+</span>
        </h1>
        <p className="text-[#FF9F43] font-medium text-lg tracking-wide">Ensemble, on est plus forts</p>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-10 h-10 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-xl flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v16M4 12h16" />
          </svg>
        </div>
      </div>
      {variant === "full" && (
        <span className="text-xl font-bold text-[#FF6B6B] tracking-tight">
          Positif<span className="text-[#10AC84]">+</span>
        </span>
      )}
    </div>
  );
}
