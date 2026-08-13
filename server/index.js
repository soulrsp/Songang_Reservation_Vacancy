import dotenv from 'dotenv';
import { scrapeSonggangTennis } from './crawler.js';
import { processDiff } from './diffEngine.js';

dotenv.config();

// ─── 날짜 범위 계산 ────────────────────────────────────────────────────────

function getTargetDates() {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const today = kst.getDate();
  const hour = kst.getHours();

  const dates = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = today; d <= lastDay; d++) {
    const dd = new Date(year, month, d);
    dates.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`);
  }

  // 25일 10시 이후: 다음달도 포함
  if ((today === 25 && hour >= 10) || today > 25) {
    const ny = month === 11 ? year + 1 : year;
    const nm = (month + 1) % 12;
    const nLast = new Date(ny, nm + 1, 0).getDate();
    for (let d = 1; d <= nLast; d++) {
      const dd = new Date(ny, nm, d);
      dates.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`);
    }
  }

  return dates;
}

// ─── GitHub Actions 1회 실행 모드 ─────────────────────────────────────────

const dates = getTargetDates();
console.log(`[Agent] 스캔 범위: ${dates[0]} ~ ${dates[dates.length - 1]} (${dates.length}개 날짜)`);

// 전체 날짜 슬롯 수집 → 한 번에 diff 비교
const allSlots = [];
for (const dateStr of dates) {
  try {
    const result = await scrapeSonggangTennis(dateStr);
    if (result?.slots) allSlots.push(...result.slots);
  } catch (err) {
    console.error(`[Agent] ${dateStr} 크롤링 실패:`, err.message);
  }
}

console.log(`[Agent] 수집 완료: 총 ${allSlots.length}개 슬롯`);

const events = await processDiff(allSlots, {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
});

console.log(`[Agent] 처리 완료: ${events.length}개 신규 이벤트`);
