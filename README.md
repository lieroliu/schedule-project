# 共同空檔日曆

多人協作找出共同有空日期的排程工具。每人標記「沒空」的日期，系統自動計算所有人都空閒的日子。

## 功能

- 建立排程房間，設定日期範圍
- 分享連結，多人加入並輸入名字
- 日曆上點選標記各自沒空的日期（以顏色區分）
- 自動顯示「共同有空日期」（沒被任何人標記的日期）
- Supabase Realtime 即時同步

## 技術棧

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Vercel 部署

## 本地開發

### 1. 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com) 建立新專案
2. 在 **SQL Editor** 執行 `supabase/schema.sql`
3. 在 **Project Settings > API** 取得 URL 與 anon key

### 2. 設定環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 3. 啟動開發伺服器

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

1. 將專案推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 匯入此 repository
3. 在 Vercel 專案設定中加入環境變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署完成

或使用 Vercel CLI：

```bash
npm i -g vercel
vercel
```

## 使用流程

1. **建立排程** — 輸入活動名稱與日期範圍
2. **分享連結** — 將房間連結傳給朋友
3. **標記沒空日期** — 各人在日曆上點選無法參與的日期
4. **查看共同空檔** — 頂部綠色區塊顯示所有人都空閒的日期
