#!/usr/bin/env ts-node
import { setState, STATES } from "./main";
import { getPresenceFromUbuntu, PresenceState } from "./ubuntuDnd";

const usage = () => {
  console.log(
    [
      "Usage:",
      "  ts-node src/cli.ts set <available|dnd>",
      "  ts-node src/cli.ts toggle",
      "  ts-node src/cli.ts watch",
      "",
      "npm scripts:",
      "  npm run available",
      "  npm run dnd",
      "  npm run toggle",
      "  npm run watch",
    ].join("\n")
  );
};

async function run() {
  const [, , cmd, arg] = process.argv;
  switch (cmd) {
    case "set": {
      const state = (arg || "").toLowerCase() as keyof typeof STATES;
      if (!STATES[state]) {
        console.error(`❌ Unknown state: ${arg}`);
        usage();
        process.exit(1);
      }
      setState(state);
      return;
    }
    case "toggle": {
      // Toggle between available and dnd based on current Ubuntu DND state.
      // If Ubuntu says dnd, switch to available; else switch to dnd.
      let current: PresenceState;
      try {
        current = await getPresenceFromUbuntu();
      } catch {
        current = "available"; // fallback
      }
      const next: PresenceState = current === "dnd" ? "available" : "dnd";
      console.log(`🔁 Toggle: ${current} → ${next}`);
      setState(next);
      return;
    }
    case "watch": {
      let last: string | undefined;
      const intervalMs = 2000;
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
      setInterval(tick, intervalMs);
      return; // keep process alive
    }
    default:
      usage();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
