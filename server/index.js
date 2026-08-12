import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { scrapeSonggangTennis } from './crawler.js';
import { processDiff, getCancellationHistory } from './diffEngine.js';
import { sendDiscordNotification, sendTelegramNotification, sendKakaoNotification } from './notifier.js';
import { getTargetCrawlDates, isBookingOpeningMutePeriod } from './schedulerRules.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Handle GitHub Actions One-shot Cron execution (--cron-once flag)
if (process.argv.includes('--cron-once')) {
  (async () => {
    const targetDates = getTargetCrawlDates();
    console.log(`[GitHub Actions Agent] Crawling ${targetDates.length} target dates (Scope: ${targetDates[0]} ~ ${targetDates[targetDates.length - 1]})...`);
    
    // Always trigger a GitHub Actions KakaoTalk verification test message if token is configured
    if (process.env.KAKAO_ACCESS_TOKEN) {
      console.log('[GitHub Actions Agent] 💬 Sending KakaoTalk Integration Test Message to verified user...');
      const testEvent = {
        id: 'test-gh-' + Date.now(),
        courtName: '1번 코트 (실내)',
        date: new Date().toLocaleDateString('ko-KR'),
        timeLabel: '18:00 - 20:00 (GitHub Actions 연동 검증)',
        timestamp: new Date().toLocaleTimeString('ko-KR')
      };
      await sendKakaoNotification(process.env.KAKAO_ACCESS_TOKEN, testEvent);
    } else {
      console.warn('[GitHub Actions Agent] ⚠️ KAKAO_ACCESS_TOKEN is not set in GitHub Secrets!');
    }

    if (isBookingOpeningMutePeriod()) {
      console.log('[GitHub Actions Agent] 🔇 Mute Window Active (25th 09:00~10:00 KST). Notifications muted.');
    }

    let totalEvents = 0;

    for (const dateStr of targetDates) {
      try {
        const data = await scrapeSonggangTennis(dateStr);
        if (data && data.slots) {
          const events = processDiff(data.slots, {
            kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
            telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
            telegramChatId: process.env.TELEGRAM_CHAT_ID
          });
          totalEvents += events.length;
        }
      } catch (err) {
        console.error(`[GitHub Actions Agent] Date ${dateStr} notice:`, err.message);
      }
    }

    console.log(`[GitHub Actions Agent] Finished crawling ${targetDates.length} dates! ${totalEvents} cancellation events processed.`);
    process.exit(0);
  })();
} else {
  // Standalone Web Server Mode
  app.get('/api/schedule', async (req, res) => {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    try {
      const data = await scrapeSonggangTennis(dateStr);
      if (data && data.slots) {
        processDiff(data.slots, {
          kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
          discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
        });
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cancellations', (req, res) => {
    res.json(getCancellationHistory());
  });

  app.post('/api/test-webhook', async (req, res) => {
    const { webhookUrl } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ success: false, message: 'Webhook URL is required.' });
    }
    const testEvent = {
      courtName: '1번 코트 (실내)',
      date: new Date().toLocaleDateString('ko-KR'),
      timeLabel: '18:00 - 20:00 (테스트 슬롯)'
    };
    await sendDiscordNotification(webhookUrl, testEvent);
    res.json({ success: true, message: '디스코드 테스트 알림 발송 완료!' });
  });

  // Background Cron Job (Scrapes target dates according to 25th 10am rule)
  cron.schedule('*/3 * * * *', async () => {
    const targetDates = getTargetCrawlDates();
    for (const dateStr of targetDates) {
      try {
        const data = await scrapeSonggangTennis(dateStr);
        if (data && data.slots) {
          processDiff(data.slots, {
            kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
          });
        }
      } catch (err) {
        console.error(`[Agent Cron Error] ${dateStr}:`, err.message);
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`🎾 [Songgang Tennis Agent Server] Running on http://localhost:${PORT}`);
  });
}
