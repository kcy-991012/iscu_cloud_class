import {
  getSummaryStats,
  getTopUrl,
  getUrlStats,
} from "../../../lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getSummaryStats();
    const topUrl = await getTopUrl();
    const urls = await getUrlStats();

    return Response.json(
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
        urls: urls.map((item) => ({
          shortCode: item.short_code,
          originalUrl: item.original_url,
          clickCount: Number(item.click_count),
          createdAt: item.created_at,
          lastClickedAt: item.last_clicked_at,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch (error) {
    console.error("Failed to load stats", error);

    return Response.json(
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