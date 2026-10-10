import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Neon 데이터베이스 연결 설정
const sql = neon(process.env.DATABASE_URL);

// 캐시를 사용하지 않고 매번 최신 DB 데이터를 불러오도록 설정
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. 전체 단축 URL 수, 전체 클릭 수, 클릭된 URL 수 집계
    const summaryRows = await sql`
      SELECT
        COUNT(*) AS total_urls,
        COALESCE(SUM(click_count), 0) AS total_clicks,
        COUNT(*) FILTER (WHERE click_count > 0) AS clicked_urls
      FROM urls
    `;
    const summary = summaryRows[0];

    // 2. 가장 많이 클릭된 상위 1개 URL 조회
    const topRows = await sql`
      SELECT
        short_code,
        original_url,
        click_count
      FROM urls
      WHERE click_count > 0
      ORDER BY click_count DESC, created_at DESC
      LIMIT 1
    `;
    const topUrl = topRows[0] || null;

    // 3. 전체 URL 목록 조회 (클릭 수 기준 내림차순, 최신순 정렬)
    const urlRows = await sql`
      SELECT
        short_code,
        original_url,
        click_count,
        created_at,
        last_clicked_at
      FROM urls
      ORDER BY click_count DESC, created_at DESC
      LIMIT 50
    `;

    // 4. 프론트엔드가 요구하는 JSON 구조에 맞추어 응답 반환
    return NextResponse.json(
      {
        summary: {
          totalUrls: Number(summary.total_urls),
          totalClicks: Number(summary.total_clicks),
          clickedUrls: Number(summary.clicked_urls),
          topUrl: topUrl
            ? {
                shortCode: topUrl.short_code,
                originalUrl: topUrl.original_url,
                clickCount: Number(topUrl.click_count),
              }
            : null,
        },
        urls: urlRows.map((row) => ({
          shortCode: row.short_code,
          originalUrl: row.original_url,
          clickCount: Number(row.click_count),
          createdAt: row.created_at,
          lastClickedAt: row.last_clicked_at,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load stats:", error);

    return NextResponse.json(
      {
        error: {
          code: "STATS_ERROR",
          message: "Failed to load stats.",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}