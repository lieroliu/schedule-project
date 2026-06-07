import { JoinRoomForm } from "@/components/JoinRoomForm";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">共同空檔日曆</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          輸入名稱與房間 ID 進入行事曆
        </p>
      </div>

      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <JoinRoomForm />
      </section>
    </main>
  );
}
