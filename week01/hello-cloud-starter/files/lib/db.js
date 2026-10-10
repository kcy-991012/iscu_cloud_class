import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 4주차에 만든 URL 저장 함수
export async function saveUrl(shortCode, originalUrl) {
  await sql`
    INSERT INTO urls (short_code, original_url)
    VALUES (${shortCode}, ${originalUrl})
  `;
}

// 5주차에 추가할 URL 조회 함수
export async function findUrlByShortCode(shortCode) {
  const rows = await sql`
    SELECT original_url 
    FROM urls 
    WHERE short_code = ${shortCode} 
    LIMIT 1
  `;
  return rows[0]?.original_url ?? null;
}
