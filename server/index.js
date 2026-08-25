import dotenv from 'dotenv';
import { scrapeSonggangTennis, checkNextMonthOpenFast } from './crawler.js';
import { processDiff } from './diffEngine.js';
import { sendTelegramOpenAlert } from './notifier.js';

dotenv.config();

// ─── KST 시간 계산 ────────────────────────────────────────────────────────

function getKstDate() {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
}

// ─── 날짜 범위 계산 ────────────────────────────────────────────────────────

function getTargetDates() {
  const kst = getKstDate();
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

  // 25일 09시 이후: 다음달 전체도 오픈되므로 모니터링에 포함
  if ((today === 25 && hour >= 9) || today > 25) {
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

function getNextMonthFirstDayStr() {
  const kst = getKstDate();
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const ny = month === 11 ? year + 1 : year;
  const nm = (month + 1) % 12;
  return `${ny}-${String(nm + 1).padStart(2, '0')}-01`;
}

// ─── 25일 08:50 ~ 09:05 아침 오픈 스나이퍼 루프 판정 ──────────────────────────

async function runOpeningSniper() {
  const nextMonthDate = getNextMonthFirstDayStr();
  console.log(`[🎯 Sniper Mode] 25일 아침 조기 오픈 감지기 가동! (대상: ${nextMonthDate})`);
  console.log(`[🎯 Sniper Mode] 08:55 ~ 09:05 구간 동안 1초 간격으로 서버 개방 상태를 실시간 스캔합니다...`);

  const startTime = Date.now();
  const maxDurationMs = 10 * 60 * 1000; // 최대 10분간(08:55 ~ 09:05) 1초 폴링 유지

  while (Date.now() - startTime < maxDurationMs) {
    const checkTimeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const result = await checkNextMonthOpenFast(nextMonthDate);

    if (result.isOpen) {
      console.log(`🚨🚨🚨 [SERVER OPEN DETECTED!] ${checkTimeStr} 에 다음달 예약 서버가 열렸습니다! (빈자리: ${result.availableCount}개)`);
      await sendTelegramOpenAlert(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, {
        time: checkTimeStr,
        availableCount: result.availableCount
      });
      return true;
    }

    console.log(`[🎯 Sniper] ${checkTimeStr} - 아직 닫힘 (use_yn !== 'N'). 1초 후 재시도...`);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('[🎯 Sniper Mode] 08:55 ~ 09:05 모니터링 종료.');
  return false;
}

// ─── 메인 실행 루틴 ────────────────────────────────────────────────────────

const kst = getKstDate();
// 매달 25일 08:55 ~ 09:05 KST 구간 판별
const is25thMorning = kst.getDate() === 25 && (
  (kst.getHours() === 8 && kst.getMinutes() >= 55) ||
  (kst.getHours() === 9 && kst.getMinutes() <= 5)
);

if (is25thMorning) {
  // 25일 08:55 ~ 09:05 사이: 초 단위 스나이퍼 모드 동작
  await runOpeningSniper();
} else {
  // 평소 일반 잔여 코트 & 취소표 모니터링
  const dates = getTargetDates();
  console.log(`[Agent] 스캔 범위: ${dates[0]} ~ ${dates[dates.length - 1]} (${dates.length}개 날짜)`);

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
}
