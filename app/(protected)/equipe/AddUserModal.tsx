"use client";

import { useState } from "react";
import UserForm from "./UserForm";

/** Bouton "+ Ajouter un employé" ouvrant un modal contenant le formulaire de création. */
export default function AddUserModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Ajouter un employé
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
            <div className="mb-1 flex items-center justify-between">
              <h2 className="modal-title text-base sm:text-lg">Ajouter un employé</h2>
              <button
                className="text-ardoise-400 hover:text-ardoise-700"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs text-ardoise-500">
              Définis un mot de passe initial à transmettre à la personne — elle devra le
              personnaliser à sa première connexion.
            </p>
            <UserForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
