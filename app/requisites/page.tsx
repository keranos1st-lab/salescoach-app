import { SiteFooter } from "@/components/site-footer";

const requisites = [
  ["Исполнитель", "Гришин Максим Александрович"],
  [
    "Статус",
    "Плательщик налога на профессиональный доход (самозанятый)",
  ],
  ["ИНН", "270414087648"],
  ["Email", "keranosai@mail.ru"],
  ["Телефон", "+7 995 396-89-20"],
  ["Юридический адрес", "г. Владивосток"],
  ["Сайт", "saleschek.ru"],
] as const;

export default function RequisitesPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Реквизиты
        </h1>

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="w-full border-collapse">
            <tbody>
              {requisites.map(([label, value]) => (
                <tr key={label} className="border-b border-zinc-800 last:border-b-0">
                  <th className="w-1/3 bg-zinc-900/80 px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-sm text-zinc-200">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
