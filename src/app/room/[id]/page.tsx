import Link from "next/link";
import { RoomView } from "@/components/RoomView";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← 返回首頁
        </Link>
      </div>
      <RoomView roomId={id} />
    </main>
  );
}
