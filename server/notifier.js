import axios from 'axios';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * 25일 다음달 예약 조기 오픈 긴급 알림 발송
 */
export async function sendTelegramOpenAlert(botToken, chatIds, details = {}) {
  if (!botToken || !chatIds) return;

  const openTime = details.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const text =
    `🚨 *[초긴급] 송강실내테니스장 다음달 예약 서버 오픈!* 🚨\n\n` +
    `⚡ *서버 오픈 감지 시각: ${openTime} KST*\n` +
    `🏟️ 다음달 1일 예약 슬롯이 지금 방금 대관 가능 상태로 열렸습니다!\n\n` +
    `👉 지금 바로 클릭해서 예약하세요:\n` +
    `🔗 [송강실내테니스장 예약 사이트 바로가기](${SONGGANG_URL})`;

  const targetIds = String(chatIds)
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  for (const chatId of targetIds) {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      });
      console.log(`[Notifier] 🚨 긴급 오픈 알림 발송 완료 (${chatId}) - ${openTime}`);
    } catch (err) {
      console.error(`[Notifier] ❌ 오픈 알림 발송 실패 (${chatId}):`, err.message);
    }
  }
}

/**
 * 텔레그램 봇 알림 발송 (단일 ID 및 쉼표 구분 다중 ID/그룹 지원)
 */
export async function sendTelegramNotification(botToken, chatIds, event) {
  if (!botToken || !chatIds) return;

  const text =
    `🎾 *[송강실내테니스장 취소표 발생!]*\n\n` +
    `📅 날짜: ${event.date}\n` +
    `⏰ 시간: ${event.timeLabel}\n` +
    `🏟️ 코트: ${event.courtName}\n\n` +
    `👉 [예약 사이트 바로가기](${SONGGANG_URL})`;

  // 쉼표(,)로 구분된 여러 ID 지원 (예: "1744290092,-5351894139" 또는 단일 ID)
  const targetIds = String(chatIds)
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  for (const chatId of targetIds) {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      });
      console.log(`[Notifier] ✅ 텔레그램 알림 발송 완료 (${chatId}): ${event.courtName} ${event.date} ${event.timeLabel}`);
    } catch (err) {
      console.error(`[Notifier] ❌ 텔레그램 발송 실패 (${chatId}):`, err.message);
    }
  }
}
