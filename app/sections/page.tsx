import Link from "next/link";
import {
  getAllSections,
  parseFeatures,
  getStatusLabel,
  getFacility,
} from "@/lib/data/sections";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export default async function SectionsPage() {
  const sections = await getAllSections();
  const facility = await getFacility();

  // 階ごとにグループ化
  const sectionsByFloor = sections.reduce(
    (acc, section) => {
      const floor = section.floor;
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(section);
      return acc;
    },
    {} as Record<number, typeof sections>
  );

  const sortedFloors = Object.keys(sectionsByFloor)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← トップに戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          区画一覧
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {facility?.name || "つくにんモール渋谷"} · 全{sections.length}区画
        </p>

        {facility && (
          <div className="mt-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ポップアップストア・催事の出店をお考えの方は{" "}
              <span className="font-bold">{facility.phone}</span>{" "}
              までお気軽にお電話ください。
            </p>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {sortedFloors.map((floor) => (
            <div key={floor}>
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
                {floor}F
              </h2>
              <div className="grid gap-4">
                {sectionsByFloor[floor].map((section) => (
                  <Link
                    key={section.id}
                    href={`/sections/${section.id}`}
                    className="block rounded-lg bg-white p-5 shadow transition hover:shadow-md dark:bg-zinc-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-white">
                            {section.name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[section.status] || ""}`}
                          >
                            {getStatusLabel(section.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {section.area}㎡ · {section.category}
                        </p>
                        {parseFeatures(section).length > 0 && (
                          <p className="mt-1 text-xs text-zinc-400">
                            {parseFeatures(section).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {section.rentPrice.toLocaleString()}円
                        </div>
                        <div className="text-xs text-zinc-500">/日</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Powered by Next.js, Twilio, and Claude AI
        </footer>
      </main>
    </div>
  );
}
