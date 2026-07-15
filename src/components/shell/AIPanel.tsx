import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { notifyDone } from "@/lib/actions";
import { springGentle, transitionMedium } from "@/lib/motion";
import { ArrowUp, Bot, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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
      <AnimatePresence>
        {aiOpen ? (
          <motion.div
            key="ai-backdrop"
            onClick={() => setAIOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionMedium}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        data-open={aiOpen}
        initial={false}
        animate={{
          width: aiOpen ? 360 : 0,
          opacity: aiOpen ? 1 : 0.98,
        }}
        transition={springGentle}
        className={cn(
          "fixed md:relative right-0 top-0 z-50 h-full md:h-auto md:self-stretch",
          "flex shrink-0 flex-col overflow-hidden border-l border-border bg-surface",
        )}
      >
        <div className="w-[360px] flex flex-col h-full">
          <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border/70">
            <div className="h-6 w-6 rounded-md ai-gradient-bg" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium">Alyson</span>
              <span className="text-mono text-[10px] text-muted-foreground">AI · ready</span>
            </div>
            <button
              onClick={() => setAIOpen(false)}
              className="ml-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
              aria-label="Close AI panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-ai" />
                What should Alyson do next?
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Ask about pipelines, approvals, outreach, or workers. Alyson proposes — you approve.
              </p>
            </div>

            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setValue(s);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left text-xs rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:border-border transition duration-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-border/70 p-3">
            <div className="relative">
              <textarea
                ref={inputRef}
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Alyson…"
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
              />
              <button
                onClick={send}
                className="absolute right-2 bottom-2 h-7 w-7 inline-flex items-center justify-center rounded-md bg-ai text-ai-foreground hover:brightness-110 transition"
                aria-label="Send"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Bot className="h-3 w-3" />
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
