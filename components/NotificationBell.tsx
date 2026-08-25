"use client";

import { useState, useTransition } from "react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";

type Notif = { id: string; title: string; message: string; link: string | null; createdAt: Date };

export default function NotificationBell({ notifications }: { notifications: Notif[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ardoise-300 text-ardoise-600 transition-colors duration-300 ease-premium hover:border-faraday-700"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-faraday-700 text-[10px] text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded border border-ardoise-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ardoise-900">Notifications</p>
            {notifications.length > 0 && (
              <button
                className="text-xs text-faraday-700 hover:underline"
                disabled={isPending}
                onClick={() => startTransition(() => markAllNotificationsReadAction())}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-ardoise-400">Aucune nouvelle notification.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded border border-ardoise-200 p-2.5 text-sm">
                  <p className="font-medium text-ardoise-800">{n.title}</p>
                  <p className="text-ardoise-500">{n.message}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-ardoise-400">
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </span>
                    <button
                      className="text-xs text-faraday-700 hover:underline"
                      onClick={() => startTransition(() => markNotificationReadAction(n.id))}
                    >
                      Marquer comme lu
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
