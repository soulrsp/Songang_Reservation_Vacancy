import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { scrapeSonggangTennis, scrapeMultipleDates } from './crawler.js';
import { processDiff, getCancellationHistory } from './diffEngine.js';
import { sendDiscordNotification, sendTelegramNotification, sendKakaoNotification } from './notifier.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * Check if current KST time falls within the monthly booking open mute window:
 * Every 25th of the month from 09:00 AM to 09:59 AM KST.
 */
function isBookingOpeningMutePeriod() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  const day = kstTime.getDate();
  const hour = kstTime.getHours();
  return day === 25 && hour === 9;
}

/**
 * Calculate target crawl date strings:
 * - Always: Remaining days of the current month (today ~ end of current month)
 * - From 25th 10:00 AM KST onwards: ALSO include all days of the next month (1st ~ end of next month)
 */
function getTargetCrawlDates() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);

  const currentYear = kstTime.getFullYear();
  const currentMonth = kstTime.getMonth(); // 0-indexed
  const currentDay = kstTime.getDate();
  const currentHour = kstTime.getHours();

  const dates = [];

  // 1. Crawl remaining days of current month (today ~ last day of current month)
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let day = currentDay; day <= lastDayOfCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  // 2. From 25th 10:00 AM KST onwards, ALSO crawl all days of next month
  const isFrom25th10am = (currentDay === 25 && currentHour >= 10) || (currentDay > 25);

  if (isFrom25th10am) {
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = (currentMonth + 1) % 12;
    const lastDayOfNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfNextMonth; day++) {
      const d = new Date(nextMonthYear, nextMonth, day);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  return dates;
}

// Handle GitHub Actions One-shot Cron execution (--cron-once flag)
if (process.argv.includes('--cron-once')) {
  (async () => {
    const targetDates = getTargetCrawlDates();
    console.log(`[GitHub Actions Agent] Crawling ${targetDates.length} target dates (Scope: ${targetDates[0]} ~ ${targetDates[targetDates.length - 1]})...`);
    
    if (isBookingOpeningMutePeriod()) {
      console.log('[GitHub Actions Agent] 🔇 Mute Window Active (25th 09:00~10:00 KST). Notifications muted.');
    }

    // Collect ALL slots from ALL dates first, then run diff ONCE
    // (Running processDiff per-date would corrupt previousState mid-loop due to saveState calls)
    const allSlots = [];
    for (const dateStr of targetDates) {
      try {
        const data = await scrapeSonggangTennis(dateStr);
        if (data && data.slots) {
          allSlots.push(...data.slots);
        }
      } catch (err) {
        console.error(`[GitHub Actions Agent] Date ${dateStr} crawl error:`, err.message);
      }
    }

    console.log(`[GitHub Actions Agent] 수집 완료: ${targetDates.length}개 날짜 / 총 ${allSlots.length}개 슬롯`);

    // Single unified diff comparison against full snapshot
    const events = processDiff(allSlots, {
      kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID
    });
    const totalEvents = events.length;

    console.log(`[GitHub Actions Agent] Finished! ${totalEvents} cancellation events processed.`);
    process.exit(0);
  })();
} else {
  // Standalone Web Server Mode
  app.get('/api/schedule', async (req, res) => {
    try {
      const targetDates = getTargetCrawlDates();
      const data = await scrapeMultipleDates(targetDates);
      if (data && data.slots) {
        processDiff(data.slots, {
          kakaoAccessToken: process.env.KAKAO_ACCESS_TOKEN,
          discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
        });
      }
      res.json({ ...data, targetDatesScope: `${targetDates[0]} ~ ${targetDates[targetDates.length - 1]}` });
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
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
            telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
            telegramChatId: process.env.TELEGRAM_CHAT_ID
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
