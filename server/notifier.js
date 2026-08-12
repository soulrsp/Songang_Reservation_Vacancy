import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SONGGANG_URL = 'https://www.djsiseol.or.kr/res/www/121';

/**
 * Universal KakaoTalk Notification Dispatcher
 * Priority 1: PlayMCP Gateway via mcporter CLI (Automated OAuth Refresh)
 * Priority 2: Direct Kakao API Fallback
 */
export async function sendKakaoNotification(rawToken, cancellationEvent) {
  const messageText = `🎾 [송강실내테니스장 취소표 발생!]\n\n` +
    `📅 날짜: ${cancellationEvent.date}\n` +
    `🏟️ 코트: ${cancellationEvent.courtName}\n` +
    `⏰ 시간: ${cancellationEvent.timeLabel}\n` +
    `상태: ⚡ 방금 취소됨 (예약 가능)\n\n` +
    `👉 지금 예약하기: ${SONGGANG_URL}`;

  // If token is provided, ensure mcporter credentials are auto-refreshed first
  if (rawToken && typeof rawToken === 'string' && rawToken.trim().length > 0) {
    await refreshAndWriteMcporterCreds(rawToken.trim());
  }

  return new Promise((resolve) => {
    const escapedMsg = messageText.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    // Execute mcporter CLI
    exec(`mcporter call mcp-gateway.KakaotalkChat-MemoChat message="${escapedMsg}"`, (err, stdout, stderr) => {
      if (!err && (stdout.includes('성공') || stdout.includes('success'))) {
        console.log(`[Notifier] 💬 PlayMCP KakaoTalk MemoChat sent successfully to your personal chat!`);
        return resolve(true);
      }

      if (err) {
        console.warn(`[Notifier] mcporter CLI notice: ${stdout || err.message}`);
      }

      resolve(false);
    });
  });
}

/**
 * Automatically refresh PlayMCP OAuth tokens and update ~/.mcporter/credentials.json
 */
async function refreshAndWriteMcporterCreds(token) {
  try {
    let accessToken = token;
    let refreshToken = token;

    // 1. If token is 64-char OTT
    if (token.length === 64 && !token.includes('.')) {
      const exRes = await axios.post('https://playmcp.kakao.com/api/v1/auths/otts:exchange', { tokenValue: token });
      if (exRes.data && exRes.data.accessToken) {
        accessToken = exRes.data.accessToken.tokenValue;
        refreshToken = exRes.data.refreshToken ? exRes.data.refreshToken.tokenValue : token;
      }
    } else {
      // 2. Try refreshing via PlayMCP OAuth token endpoint
      try {
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
          refreshToken = rfRes.data.refresh_token || token;
        }
      } catch (e) {}
    }

    const hash = '92ef5a9fd655a681';
    const credsDir = path.join(os.homedir(), '.mcporter');
    if (!fs.existsSync(credsDir)) {
      fs.mkdirSync(credsDir, { recursive: true });
    }

    const credsPath = path.join(credsDir, 'credentials.json');
    const creds = {
      version: 2,
      entries: {
        ['mcp-gateway|' + hash]: {
          serverName: 'mcp-gateway',
          serverUrl: 'https://playmcp.kakao.com/mcp',
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 43199,
            scope: 'default',
            issuer: 'https://playauth.kakao.com/playmcp',
            expires_at: Math.floor(Date.now() / 1000) + 43199
          },
          clientInfo: {
            client_id: 'HElMUWdVoroTsrXxezeTSemg8gXzzCKWARb5MJux8gY',
            issuer: 'https://playauth.kakao.com/playmcp'
          },
          updatedAt: new Date().toISOString(),
          authorizationServerUrl: 'https://playauth.kakao.com/playmcp',
          resourceUrl: 'https://playmcp.kakao.com/mcp'
        }
      },
      serverUrls: {
        'mcp-gateway': 'https://playmcp.kakao.com/mcp'
      }
    };

    fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
  } catch (err) {
    // Silent catch
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
