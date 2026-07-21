"use client";

import { useState } from "react";
import UserForm, { type EditableUser } from "./UserForm";

/** Bouton "Modifier" ouvrant un modal contenant le formulaire d'édition. */
export default function EditUserModal({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-secondary text-xs" onClick={() => setOpen(true)}>
        Modifier
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ardoise-900">
                Modifier {user.firstName} {user.lastName}
              </h2>
              <button
                className="text-ardoise-400 hover:text-ardoise-700"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <UserForm user={user} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
