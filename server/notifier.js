import axios from 'axios';
import { exec } from 'child_process';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * Universal KakaoTalk Notification Dispatcher
 * Priority 1: PlayMCP Gateway (mcporter KakaotalkChat-MemoChat)
 * Priority 2: Direct PlayMCP / Kakao API
 */
export async function sendKakaoNotification(rawToken, cancellationEvent) {
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  // 1. Try sending via PlayMCP mcporter CLI first (Works on local & GitHub Actions runner)
  return new Promise((resolve) => {
    const escapedMsg = messageText.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    exec(`mcporter call mcp-gateway.KakaotalkChat-MemoChat message="${escapedMsg}"`, async (err, stdout, stderr) => {
      if (!err && (stdout.includes('성공') || stdout.includes('success'))) {
        console.log(`[Notifier] 💬 PlayMCP KakaoTalk MemoChat sent successfully to your personal chat!`);
        return resolve(true);
      }

      // If mcporter CLI failed, attempt HTTP API call with rawToken if provided
      if (rawToken && typeof rawToken === 'string') {
        const token = rawToken.trim();
        try {
          // If token is 64-char OTT, exchange first
          if (token.length === 64 && !token.includes('.')) {
            console.log('[Notifier] 🔑 Exchanging PlayMCP One-Time Token (OTT)...');
            const exRes = await axios.post('https://playmcp.kakao.com/api/v1/auths/otts:exchange', { tokenValue: token });
            if (exRes.data && exRes.data.accessToken) {
              const playmcpToken = exRes.data.accessToken.tokenValue;
              await sendViaPlayMcpGateway(playmcpToken, messageText);
              console.log('[Notifier] 💬 PlayMCP Gateway message sent successfully!');
              return resolve(true);
            }
          } else if (token.startsWith('eyJ')) {
            await sendViaPlayMcpGateway(token, messageText);
            console.log('[Notifier] 💬 PlayMCP Gateway message sent successfully!');
            return resolve(true);
          }
        } catch (apiErr) {
          const errMsg = apiErr.response && apiErr.response.data 
            ? JSON.stringify(apiErr.response.data) 
            : apiErr.message;
          console.warn('[Notifier] KakaoTalk notification status:', errMsg);
        }
      }

      resolve(false);
    });
  });
}

/**
 * Send KakaoTalk message via PlayMCP Gateway JSON-RPC API
 */
async function sendViaPlayMcpGateway(accessToken, messageText) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'KakaotalkChat-MemoChat',
      arguments: {
        message: messageText
      }
    }
  };

  const res = await axios.post('https://playmcp.kakao.com/mcp', payload, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 8000
  });

  if (res.status === 200 && (!res.data.error || res.data.result)) {
    return true;
  } else {
    throw new Error(`PlayMCP Gateway error: ${JSON.stringify(res.data)}`);
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
