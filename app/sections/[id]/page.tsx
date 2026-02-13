import Link from "next/link";
import {
  getSectionById,
  parseFeatures,
  getStatusLabel,
  formatRentPrice,
  getFacility,
} from "@/lib/data/sections";
import { notFound } from "next/navigation";
import SectionCalendar from "./SectionCalendar";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const section = await getSectionById(id);
  const facility = await getFacility();

  if (!section) {
    notFound();
  }

  const features = parseFeatures(section);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-4">
          <Link
            href="/sections"
            className="text-sm text-blue-600 hover:underline"
          >
            ← 区画一覧に戻る
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {section.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[section.status] || ""}`}
                >
                  {getStatusLabel(section.status)}
                </span>
              </div>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {section.floor}F · {section.category}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {formatRentPrice(section.rentPrice)}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                面積
              </h3>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {section.area}㎡
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                日額利用料
              </h3>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {section.rentPrice.toLocaleString()}円
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                カテゴリ
              </h3>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {section.category}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                フロア
              </h3>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {section.floor}F
              </p>
            </div>
          </div>

          {section.description && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                区画について
              </h3>
              <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                {section.description}
              </p>
            </div>
          )}

          {features.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                特徴・設備
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <SectionCalendar sectionId={section.id} />
        </div>

        {facility && (
          <div className="mt-8 rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              この区画についてお問い合わせ
            </h3>
            <p className="mt-2 text-blue-800 dark:text-blue-200">
              空き日程の確認、料金のご相談など、お気軽にお電話ください。
            </p>
            <p className="mt-4 text-3xl font-bold text-blue-700 dark:text-blue-300">
              {facility.phone}
            </p>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              AIオペレーターが24時間対応いたします
            </p>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Powered by Next.js, Twilio, and Claude AI
        </footer>
      </main>
    </div>
  );
}
