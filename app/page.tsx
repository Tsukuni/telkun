import Link from "next/link";
import { getFacility } from "@/lib/data/sections";

export const dynamic = "force-dynamic";

export default async function Home() {
  const facility = await getFacility();

  const activeSections =
    facility?.sections.filter((s) => s.status === "active") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            {facility?.name || "つくにんモール渋谷"}
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            ポップアップストア・催事スペース案内
          </p>
          {facility && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              {facility.address} · 営業時間 {facility.hours}
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/sections"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            区画を探す
          </Link>
          <Link
            href="/admin"
            className="rounded-lg bg-zinc-200 px-6 py-2 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            管理画面
          </Link>
        </div>

        <div className="mt-12 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            ポップアップストア出店をご検討の方へ
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            渋谷の好立地で、日単位からスペースをレンタルいただけます。
            アパレル、コスメ、フード、展示会など多彩な用途に対応。
            AIによる電話案内で空き状況や料金をいつでも確認できます。
          </p>

          {facility && (
            <div className="mt-6 rounded-xl bg-blue-50 p-6 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                お電話でのお問い合わせ
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">
                {facility.phone}
              </p>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                AIオペレーターが24時間対応いたします
              </p>
            </div>
          )}

          <h3 className="mt-8 text-lg font-medium text-zinc-900 dark:text-white">
            施設概要
          </h3>
          <ul className="mt-4 space-y-2 text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              渋谷駅徒歩5分の好立地
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              3階建て、全{facility?.sections.length || 11}区画
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              物販・飲食・サービス・オフィスの多様なスペース
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              現在{activeSections.length}区画が利用可能
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              日単位でレンタル可能・カレンダーで空き確認
            </li>
          </ul>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            利用可能な区画
          </h3>
          {activeSections.length === 0 ? (
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              現在利用可能な区画はありません。
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {activeSections.map((section) => (
                <Link
                  key={section.id}
                  href={`/sections/${section.id}`}
                  className="block rounded-lg bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-700/50 dark:hover:bg-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {section.name}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {section.floor}F · {section.area}㎡ · {section.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">
                        {section.rentPrice.toLocaleString()}円/日
                      </div>
                      <div className="text-xs text-green-600">利用可能</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link
              href="/sections"
              className="text-sm text-blue-600 hover:underline"
            >
              全区画を見る →
            </Link>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Powered by Next.js, Twilio, and Claude AI
        </footer>
      </main>
    </div>
  );
}
