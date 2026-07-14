import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { notifyDone } from "@/lib/actions";
import { ArrowUp, Bot, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";

const SUGGESTIONS = [
  "Summarize what changed since I was last here",
  "Show approvals waiting on me",
  "Draft a follow-up for the top 3 stalled projects",
  "Which workers are underperforming this week?",
];

export function AIPanel() {
  const { aiOpen, setAIOpen } = useShell();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const v = value.trim();
    if (!v) return;
    notifyDone("Sent to Alyson", v);
    setValue("");
  };

  return (
    <>
      {/* backdrop on mobile */}
      <div
        onClick={() => setAIOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition",
          aiOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        data-open={aiOpen}
        className={cn(
          "fixed md:relative right-0 top-0 h-full md:h-auto z-50",
          "flex flex-col shrink-0 border-l border-border bg-surface",
          "transition-[width,transform] duration-200 ease-out overflow-hidden",
          aiOpen
            ? "w-[360px] translate-x-0"
            : "w-0 translate-x-full md:translate-x-0",
        )}
      >
        <div className="w-[360px] flex flex-col h-full">
          <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border/70">
            <div className="h-6 w-6 rounded-md ai-gradient-bg" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium">Alyson</span>
              <span className="text-[10px] text-muted-foreground text-mono uppercase tracking-wider">
                Ambient
              </span>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setAIOpen(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Close AI panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground text-mono">
                <Sparkles className="h-3 w-3 text-ai" />
                Context
              </div>
              <p className="text-sm leading-relaxed">
                You're on <span className="font-medium">Overview</span>. I can see 3 workers,
                12 tasks in flight, and 2 approvals waiting.
              </p>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-mono px-1 pb-2">
                Try
              </div>
              <ul className="space-y-1">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        setValue(s);
                        inputRef.current?.focus();
                      }}
                      className="w-full text-left text-sm px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition flex items-start gap-2"
                    >
                      <Bot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ai" />
                      <span>{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 border-t border-border/70">
            <div className="relative rounded-lg border border-border bg-card focus-within:ai-ring transition">
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Ask, plan, or delegate…"
                className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground text-mono">
                  <kbd>↵</kbd> send
                </div>
                <button
                  type="button"
                  onClick={send}
                  disabled={!value.trim()}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md ai-gradient-bg text-ai-foreground shadow-pop hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
