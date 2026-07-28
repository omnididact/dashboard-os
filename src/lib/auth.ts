import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/dashboard-store";

const SESSION_COOKIE = "dashboard_os_session";
const SESSION_VALUE = "authenticated";

export async function verifyPin(pin: string): Promise<boolean> {
  const { pinHash } = getSettings();
  if (!pinHash) return true;
  return bcrypt.compare(pin, pinHash);
}

export async function setPin(pin: string | null) {
  if (!pin || pin.length === 0) {
    const { saveSettings } = await import("@/lib/dashboard-store");
    return saveSettings({ pinHash: null });
  }
  const hash = await bcrypt.hash(pin, 10);
  const { saveSettings } = await import("@/lib/dashboard-store");
  return saveSettings({ pinHash: hash });
}

export async function createSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const { pinHash } = getSettings();
  if (!pinHash) return true;
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}
