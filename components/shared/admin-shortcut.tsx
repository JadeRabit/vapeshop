"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Global keyboard shortcut: Ctrl+Shift+L (Cmd+Shift+L on macOS) opens the admin console.
 * Server-side RBAC still protects the route, so this only saves admins a few clicks.
 */
export function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.altKey) return;

      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier || !event.shiftKey) return;
      if (event.key.toLowerCase() !== "l") return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      router.push("/admin");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
