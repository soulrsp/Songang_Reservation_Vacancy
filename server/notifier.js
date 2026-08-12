import axios from 'axios';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * Universal KakaoTalk Notification Dispatcher
 * Directly communicates with PlayMCP Gateway via Native HTTP MCP Protocol
 * (Handles session initialization & tool invocation without CLI or browser prompts)
 */
export async function sendKakaoNotification(rawToken, cancellationEvent) {
  if (!rawToken || typeof rawToken !== 'string') {
    console.warn('[Notifier] ⚠️ KAKAO_ACCESS_TOKEN is missing or empty.');
    return false;
  }

  const token = rawToken.trim();
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  let accessToken = token;

  try {
    // 1. If OTT (64-character hex token), exchange for Bearer Access Token
    if (token.length === 64 && !token.includes('.')) {
      console.log('[Notifier] 🔑 Exchanging One-Time Token (OTT)...');
      const exRes = await axios.post('https://playmcp.kakao.com/api/v1/auths/otts:exchange', { tokenValue: token });
      if (exRes.data && exRes.data.accessToken) {
        accessToken = exRes.data.accessToken.tokenValue;
      }
    } 
    // 2. If OAuth Refresh Token (doesn't start with 'eyJ')
    else if (!token.startsWith('eyJ')) {
      try {
        console.log('[Notifier] 🔑 Refreshing PlayMCP OAuth Token...');
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: 'HElMUWdVoroTsrXxezeTSemg8gXzzCKWARb5MJux8gY',
          refresh_token: token
        });
        const rfRes = await axios.post('https://playauth.kakao.com/playmcp/oauth2/token', params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (rfRes.data && rfRes.data.access_token) {
          accessToken = rfRes.data.access_token;
        }
      } catch (rfErr) {
        // Fallback to raw token
      }
    }

    // 3. Initialize MCP Protocol Session on PlayMCP Gateway
    console.log('[Notifier] 🔌 Establishing Native PlayMCP Protocol Session...');
    const initRes = await axios.post('https://playmcp.kakao.com/mcp', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'SonggangTennisAgent', version: '1.0' }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const sessionId = initRes.headers['mcp-session-id'];
    if (!sessionId) {
      throw new Error('PlayMCP Gateway did not return Mcp-Session-Id header');
    }

    // 4. Call PlayMCP KakaotalkChat-MemoChat tool
    const callRes = await axios.post('https://playmcp.kakao.com/mcp', {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'KakaotalkChat-MemoChat',
        arguments: {
          message: messageText
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Mcp-Session-Id': sessionId,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (callRes.data && callRes.data.result && callRes.data.result.content) {
      const responseText = callRes.data.result.content[0]?.text || '';
      console.log(`[Notifier] 💬 KakaoTalk MemoChat Sent Successfully! Result: ${responseText}`);
      return true;
    } else {
      console.warn('[Notifier] ⚠️ PlayMCP Gateway Response:', JSON.stringify(callRes.data));
      return false;
    }

  } catch (err) {
    const errMsg = err.response && err.response.data 
      ? JSON.stringify(err.response.data) 
      : err.message;
    console.error('[Notifier] ❌ KakaoTalk Notification Error:', errMsg);
    return false;
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
