import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { scrapeSogangTennis } from './crawler.js';
import { processDiff, getCancellationHistory } from './diffEngine.js';
import { sendDiscordNotification } from './notifier.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache for schedule data
const scheduleCache = new Map();

// API Endpoint: Get court schedule for a date
app.get('/api/schedule', async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  
  try {
    const data = await scrapeSogangTennis(dateStr);
    
    // Process diff engine for cancellation detection
    if (data && data.slots) {
      processDiff(data.slots, {
        discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
      });
    }

    scheduleCache.set(dateStr, data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Get recent cancellation logs
app.get('/api/cancellations', (req, res) => {
  const history = getCancellationHistory();
  res.json(history);
});

// API Endpoint: Test Webhook
app.post('/api/test-webhook', async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ success: false, message: 'Webhook URL is required.' });
  }

  const testEvent = {
    courtName: 'A 코트 (상단)',
    date: new Date().toLocaleDateString('ko-KR'),
    timeLabel: '18:00 - 20:00 (테스트 슬롯)'
  };

  await sendDiscordNotification(webhookUrl, testEvent);
  res.json({ success: true, message: '디스코드 테스트 알림이 발송되었습니다!' });
});

// Background Cron Polling Task (Runs every 1 minute)
cron.schedule('*/1 * * * *', async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`[Agent Cron] Running reservation status check for ${todayStr}...`);
  try {
    const data = await scrapeSogangTennis(todayStr);
    if (data && data.slots) {
      const newEvents = processDiff(data.slots, {
        discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
      });
      if (newEvents.length > 0) {
        console.log(`[Agent Cron] ⚡ ${newEvents.length} cancellation events detected & notifications dispatched!`);
      }
    }
  } catch (err) {
    console.error('[Agent Cron] Error during background check:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🎾 [Sogang Tennis Agent Server] Running on http://localhost:${PORT}`);
});
