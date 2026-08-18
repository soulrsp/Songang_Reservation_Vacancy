import axios from 'axios';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

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
