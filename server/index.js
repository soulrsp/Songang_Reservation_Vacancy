import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { scrapeSonggangTennis } from './crawler.js';
import { processDiff, getCancellationHistory } from './diffEngine.js';
import { sendDiscordNotification, sendTelegramNotification, sendKakaoNotification } from './notifier.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Handle GitHub Actions One-shot Cron execution (--cron-once flag)
if (process.argv.includes('--cron-once')) {
  (async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`[GitHub Actions Cron Agent] Running Songgang Tennis Vacancy Check for ${todayStr}...`);
    try {
      const data = await scrapeSonggangTennis(todayStr);
      if (data && data.slots) {
        const newEvents = processDiff(data.slots, {
          kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
          discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
          telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
          telegramChatId: process.env.TELEGRAM_CHAT_ID
        });
        console.log(`[GitHub Actions Cron Agent] Check complete! ${newEvents.length} cancellation events processed.`);
      }
      process.exit(0);
    } catch (err) {
      console.error('[GitHub Actions Cron Agent] Execution Notice:', err.message);
      process.exit(0);
    }
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

  cron.schedule('*/1 * * * *', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const data = await scrapeSonggangTennis(todayStr);
      if (data && data.slots) {
        processDiff(data.slots, {
          kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
          discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
        });
      }
    } catch (err) {
      console.error('[Agent Cron Error]:', err.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`🎾 [Songgang Tennis Agent Server] Running on http://localhost:${PORT}`);
  });
}
