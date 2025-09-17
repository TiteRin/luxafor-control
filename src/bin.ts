#!/usr/bin/env node
import minimist from "minimist";
import { setState, setColor, STATES, turnOff } from "./main";
import { getPresenceFromUbuntu, PresenceState } from "./ubuntuDnd";

function printUsage() {
  console.log(
    [
      "Luxafor Control",
      "",
      "Usage:",
      "  luxafor-control                 # watch Ubuntu DND (default)",
      "  luxafor-control --set <available|dnd>",
      "  luxafor-control --toggle",
      "  luxafor-control --color <#RRGGBB>",
      "  luxafor-control --help",
    ].join("\n")
  );
}

function normalizeHex(input: string): string | undefined {
  let s = input.trim();
  if (!s) return undefined;
  if (!s.startsWith("#")) s = "#" + s;
  const re = /^#([0-9a-fA-F]{6})$/;
  if (!re.test(s)) return undefined;
  return s.toUpperCase();
}

async function doToggle() {
  let current: PresenceState;
  try {
    current = await getPresenceFromUbuntu();
  } catch {
    current = "available"; // fallback
  }
  const next: PresenceState = current === "dnd" ? "available" : "dnd";
  console.log(`🔁 Toggle: ${current} → ${next}`);
  setState(next);
}

async function watch() {
  let last: string | undefined;
  const intervalMs = 2000;
  let timer: NodeJS.Timeout | undefined;
  let cleanedUp = false;

  const cleanup = (code = 0) => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (timer) clearInterval(timer);
    try { turnOff(); } catch {}
    process.exit(code);
  };

  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));
  process.on("uncaughtException", (err) => {
    console.error("Unhandled error:", err);
    cleanup(1);
  });
  process.on("exit", () => {
    if (!cleanedUp) {
      try { turnOff(); } catch {}
    }
  });

  if (process.stdin.isTTY) {
    console.log("👋 Press 'q' then Enter to quit (will turn off the flag)");
    process.stdin.setEncoding("utf8");
    process.stdin.resume();
    process.stdin.on("data", (data) => {
      const text = String(data).trim().toLowerCase();
      if (text === "q" || text === "quit" || text === "exit") {
        cleanup(0);
      }
    });
  }

  console.log("👀 Watching Ubuntu DND and updating Luxafor...");
  const tick = async () => {
    try {
      const presence = await getPresenceFromUbuntu();
      if (presence !== last) {
        setState(presence as keyof typeof STATES);
        last = presence;
      }
    } catch (e) {
      console.error("Watch error:", e);
    }
  };
  await tick();
  timer = setInterval(tick, intervalMs);
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ["toggle", "help"],
    string: ["set", "color"],
    alias: { h: "help" },
  });

  if (argv.help) {
    printUsage();
    process.exit(0);
  }

  if (typeof argv.set === "string") {
    const state = argv.set.toLowerCase() as keyof typeof STATES;
    if (!STATES[state]) {
      console.error(`❌ Unknown state: ${argv.set}`);
      printUsage();
      process.exit(1);
    }
    setState(state);
    return;
  }

  if (argv.toggle) {
    await doToggle();
    return;
  }

  if (typeof argv.color === "string") {
    const hex = normalizeHex(argv.color);
    if (!hex) {
      console.error(`❌ Invalid color: ${argv.color}. Expected #RRGGBB`);
      process.exit(1);
    }
    setColor(hex);
    return;
  }

  // Default action
  await watch();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
