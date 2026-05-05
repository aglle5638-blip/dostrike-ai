/**
 * GET /api/videos/stats?ids=id1,id2,...
 *
 * 指定した動画IDのユーザーフィードバック集計を返す。
 * 全ユーザーの keep / strike 数を集計（個人情報は含まない）。
 *
 * Response:
 *   { stats: { [videoId]: { keepCount: number, strikeCount: number, total: number } } }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export interface VideoStat {
  keepCount: number;
  strikeCount: number;
  total: number;
}

export type StatsResponse = {
  stats: Record<string, VideoStat>;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); // 最大 50 件

  if (ids.length === 0) {
    return NextResponse.json({ stats: {} } satisfies StatsResponse);
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ stats: {} } satisfies StatsResponse);
  }

  // action ごとにカウント集計
  const { data, error } = await supabase
    .from("user_feedback")
    .select("video_id, action")
    .in("video_id", ids)
    .in("action", ["keep", "strike"]);

  if (error) {
    console.error("[/api/videos/stats] query error:", error);
    return NextResponse.json({ stats: {} } satisfies StatsResponse);
  }

  const stats: Record<string, VideoStat> = {};
  for (const row of data ?? []) {
    if (!stats[row.video_id]) {
      stats[row.video_id] = { keepCount: 0, strikeCount: 0, total: 0 };
    }
    if (row.action === "keep") stats[row.video_id].keepCount++;
    if (row.action === "strike") stats[row.video_id].strikeCount++;
    stats[row.video_id].total++;
  }

  return NextResponse.json({ stats } satisfies StatsResponse);
}
