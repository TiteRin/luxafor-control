import { exec } from "child_process";

/**
 * Detects Ubuntu/GNOME Do Not Disturb state using gsettings.
 * On GNOME, DND is typically represented by show-banners=false.
 */
export function isUbuntuDndEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      "gsettings get org.gnome.desktop.notifications show-banners",
      (error, stdout) => {
        if (error) {
          // If gsettings isn't available, assume not DND to avoid forcing red.
          return resolve(false);
        }
        const out = (stdout || "").trim().toLowerCase();
        // When banners are shown (true) => not DND; false => DND
        if (out === "false") return resolve(true);
        return resolve(false);
      }
    );
  });
}

export type PresenceState = "available" | "dnd";

export async function getPresenceFromUbuntu(): Promise<PresenceState> {
  const dnd = await isUbuntuDndEnabled();
  return dnd ? "dnd" : "available";
}
