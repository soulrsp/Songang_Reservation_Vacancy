import axios from 'axios';
import { exec } from 'child_process';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * Universal KakaoTalk Notification Dispatcher
 * Automatically detects and handles all token types:
 * 1. PlayMCP OTT (64-character hex) -> Auto-exchanges to Bearer Access Token
 * 2. PlayMCP Bearer Access Token (JWT starting with 'eyJ...') -> Calls PlayMCP Gateway (https://playmcp.kakao.com/mcp)
 * 3. Native Kakao REST API Token -> Calls https://kapi.kakao.com/v2/api/talk/memo/default/send
 * 4. Local mcporter CLI fallback
 */
export async function sendKakaoNotification(rawToken, cancellationEvent) {
  if (!rawToken || typeof rawToken !== 'string') {
    // Attempt local mcporter CLI fallback if available
    return sendViaMcporterCli(cancellationEvent);
  }

  const token = rawToken.trim();
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  try {
    // Case 1: Token is PlayMCP OTT (e.g. 64-char hex token)
    if (token.length === 64 && !token.includes('.')) {
      console.log('[Notifier] 🔑 Exchanging PlayMCP One-Time Token (OTT) for Bearer Access Token...');
      const exchangeRes = await axios.post('https://playmcp.kakao.com/api/v1/auths/otts:exchange', {
        tokenValue: token
      });

      if (exchangeRes.data && exchangeRes.data.accessToken) {
        const playmcpAccessToken = exchangeRes.data.accessToken.tokenValue;
        console.log('[Notifier] 🔑 OTT exchange successful! Sending to PlayMCP Gateway...');
        return await sendViaPlayMcpGateway(playmcpAccessToken, messageText);
      }
    }

    // Case 2: Token is PlayMCP JWT Bearer Access Token (starts with 'eyJ')
    if (token.startsWith('eyJ')) {
      console.log('[Notifier] 🚀 Sending via PlayMCP Gateway JSON-RPC...');
      return await sendViaPlayMcpGateway(token, messageText);
    }

    // Case 3: Try PlayMCP Gateway first, fallback to native Kakao REST API
    try {
      await sendViaPlayMcpGateway(token, messageText);
      return;
    } catch (err) {
      console.log('[Notifier] PlayMCP Gateway call failed, trying Native Kakao REST API...');
    }

    // Case 4: Native Kakao REST API (/v2/api/talk/memo/default/send)
    await sendViaNativeKakaoApi(token, cancellationEvent);

  } catch (err) {
    console.error('[Notifier] KakaoTalk notification error:', err.response ? err.response.data : err.message);
    // Fallback to mcporter CLI
    sendViaMcporterCli(cancellationEvent);
  }
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
    console.log(`[Notifier] 💬 PlayMCP Gateway KakaoTalk MemoChat sent successfully!`);
    return true;
  } else {
    throw new Error(`PlayMCP Gateway response: ${JSON.stringify(res.data)}`);
  }
}

/**
 * Direct Native Kakao REST API (/v2/api/talk/memo/default/send)
 */
async function sendViaNativeKakaoApi(kakaoToken, cancellationEvent) {
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

  const params = new URLSearchParams();
  params.append('template_object', JSON.stringify(templateObject));

  const response = await axios.post('https://kapi.kakao.com/v2/api/talk/memo/default/send', params, {
    headers: {
      'Authorization': `Bearer ${kakaoToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    timeout: 8000
  });

  if (response.data && response.data.result_code === 0) {
    console.log(`[Notifier] 💬 Native KakaoTalk REST API message sent successfully!`);
    return true;
  } else {
    throw new Error(`Native Kakao API code: ${response.data.result_code}`);
  }
}

/**
 * Local mcporter CLI fallback
 */
function sendViaMcporterCli(cancellationEvent) {
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  exec(`mcporter call mcp-gateway.KakaotalkChat-MemoChat message="${messageText.replace(/"/g, '\\"')}"`, (err, stdout) => {
    if (!err && stdout.includes('성공')) {
      console.log(`[Notifier] 💬 Local mcporter CLI KakaoTalk MemoChat sent successfully!`);
    }
  });
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
