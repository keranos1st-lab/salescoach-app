"use client";

import { useState } from "react";

type ProfileFormProps = {
  name: string | null;
  email: string;
};

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [nameValue, setNameValue] = useState(name ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error ?? "Не удалось сохранить");
      }
    } catch {
      setError("Не удалось сохранить");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="mb-1 block text-sm text-zinc-400">
          Имя
        </label>
        <input
          id="profile-name"
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-600"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="mb-1 block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          disabled
          value={email}
          className="w-full max-w-md cursor-not-allowed rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
        >
          Сохранить изменения
        </button>
        {saved ? (
          <span className="text-sm text-teal-400">Сохранено ✓</span>
        ) : null}
        {error ? <span className="text-sm text-red-400">{error}</span> : null}
      </div>
    </div>
  );
}
