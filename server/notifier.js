import axios from 'axios';
import { exec } from 'child_process';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * KakaoTalk Notification Dispatcher
 * Priority 1: PlayMCP Gateway (mcporter KakaotalkChat-MemoChat)
 * Priority 2: Direct Kakao API (/v2/api/talk/memo/default/send)
 */
export async function sendKakaoNotification(kakaoTokenOrKey, cancellationEvent) {
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  // 1. Try sending via PlayMCP mcporter CLI first
  exec(`mcporter call mcp-gateway.KakaotalkChat-MemoChat message="${messageText.replace(/"/g, '\\"')}"`, (err, stdout) => {
    if (!err && stdout.includes('성공')) {
      console.log(`[Notifier] 💬 PlayMCP KakaoTalk MemoChat sent successfully to your personal chat!`);
      return;
    }

    // 2. Fallback to direct Kakao REST API if Bearer token is provided
    if (kakaoTokenOrKey && !kakaoTokenOrKey.startsWith('mcporter')) {
      sendDirectKakaoMemo(kakaoTokenOrKey, cancellationEvent);
    }
  });
}

/**
 * Direct Kakao REST API fallback
 */
async function sendDirectKakaoMemo(kakaoToken, cancellationEvent) {
  const templateObject = {
    object_type: 'feed',
    content: {
      title: '🎾 [송강실내테니스장] 취소표(빈자리) 발생!',
      description: `누군가 예약을 취소하여 [${cancellationEvent.courtName}] ${cancellationEvent.timeLabel} 슬롯이 새로 열렸습니다!`,
      image_url: 'https://www.djsiseol.or.kr/res/design/homepage/fmcs/images/logo.png',
      link: {
        web_url: SONGGANG_URL,
        mobile_web_url: SONGGANG_URL
      }
    },
    button_title: '지금 예약하러 가기'
  };

  try {
    const params = new URLSearchParams();
    params.append('template_object', JSON.stringify(templateObject));

    const response = await axios.post('https://kapi.kakao.com/v2/api/talk/memo/default/send', params, {
      headers: {
        'Authorization': `Bearer ${kakaoToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    if (response.data.result_code === 0) {
      console.log(`[Notifier] 💬 Direct KakaoTalk REST API message sent successfully!`);
    }
  } catch (err) {
    console.error(`[Notifier] KakaoTalk REST API error:`, err.response ? err.response.data : err.message);
  }
}

/**
 * Discord Webhook Notification
 */
export async function sendDiscordNotification(webhookUrl, cancellationEvent) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return;

  const embed = {
    title: '🎾 [송강실내테니스장] 방금 취소표(빈자리) 발생!',
    description: `누군가 예약을 취소하여 **${cancellationEvent.courtName}** 빈자리가 발생했습니다!`,
    color: 0xCCFF00, // Neon Green
    fields: [
      { name: '📅 날짜', value: cancellationEvent.date, inline: true },
      { name: '⏰ 시간대', value: cancellationEvent.timeLabel, inline: true },
      { name: '🏟️ 코트', value: cancellationEvent.courtName, inline: true }
    ],
    footer: {
      text: '대전시설관리공단 송강실내테니스장 알림 에이전트 • djsiseol.or.kr'
    },
    timestamp: new Date().toISOString()
  };

  try {
    await axios.post(webhookUrl, {
      content: '⚡ **@here [송강실내테니스장 취소표 발생!]**',
      embeds: [embed]
    });
    console.log(`[Notifier] Discord notification sent successfully for ${cancellationEvent.courtName}`);
  } catch (err) {
    console.error('[Notifier] Discord webhook send error:', err.message);
  }
}

/**
 * Telegram Bot Notification
 */
export async function sendTelegramNotification(botToken, chatId, cancellationEvent) {
  if (!botToken || !chatId) return;

  const text = `🎾 *[송강실내테니스장 취소표 발생!]*\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n\n` +
    `👉 [송강실내테니스장 예약 사이트 바로가기](${SONGGANG_URL})`;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
    console.log(`[Notifier] Telegram notification sent successfully.`);
  } catch (err) {
    console.error('[Notifier] Telegram send error:', err.message);
  }
}
