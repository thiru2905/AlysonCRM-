import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV } from "@/lib/nav";
import { useShell } from "@/lib/shell";
import { useTheme } from "@/lib/theme";
import { Bot, Moon, PanelLeft, Sparkles, Sun } from "lucide-react";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, toggleSidebar, toggleAI } = useShell();
  const { toggle: toggleTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const go = (to: string) => {
    setCommandOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search entities, workers, or type a command…" />
      <CommandList className="scrollbar-thin">
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Ask Alyson">
          <CommandItem
            onSelect={() => {
              setCommandOpen(false);
              toggleAI();
            }}
          >
            <Sparkles className="h-4 w-4 text-ai" />
            <span>Ask a question about anything…</span>
            <CommandShortcut>⌘.</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.to} onSelect={() => go(item.to)}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[220px]">
                  {item.description}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspace">
          <CommandItem
            onSelect={() => {
              setCommandOpen(false);
              toggleSidebar();
            }}
          >
            <PanelLeft className="h-4 w-4" />
            <span>Toggle sidebar</span>
            <CommandShortcut>⌘\</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setCommandOpen(false);
              toggleTheme();
            }}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setCommandOpen(false);
              toggleAI();
            }}
          >
            <Bot className="h-4 w-4" />
            <span>Toggle AI panel</span>
            <CommandShortcut>⌘.</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
