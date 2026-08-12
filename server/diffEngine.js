import { sendDiscordNotification, sendTelegramNotification, sendKakaoNotification } from './notifier.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'state', 'previousState.json');

// Load persisted state from file (survives GitHub Actions runs via cache)
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return new Map(Object.entries(raw));
    }
  } catch (e) { /* silent */ }
  return new Map();
}

// Persist state to file after every crawl cycle
function saveState(map) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(Object.fromEntries(map)));
  } catch (e) { /* silent */ }
}

let previousState = loadState();
let cancellationHistory = [];

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
 * Compare current snapshot against previous snapshot to identify newly freed slots.
 * previousState is persisted between GitHub Actions runs via STATE_FILE.
 */
export function processDiff(currentSlots, options = {}) {
  const newCancellations = [];
  const isMuted = isBookingOpeningMutePeriod();

  if (isMuted) {
    console.log('[Notification Engine] 🔇 매달 25일 09시~10시 다음달 오픈시간: 알림 발송 일시 정지 (Mute Window Active)');
  }

  for (const slot of currentSlots) {
    const key = slot.id;
    const prevStatus = previousState.get(key);

    // If slot was previously 'reserved' and is now 'available' or 'cancelled' → cancellation!
    if (prevStatus === 'reserved' && (slot.status === 'available' || slot.status === 'cancelled')) {
      const event = {
        id: 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        slotId: slot.id,
        courtId: slot.courtId,
        courtName: slot.courtName,
        timeLabel: slot.timeLabel,
        date: slot.date,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: '취소표 발생'
      };

      newCancellations.push(event);
      cancellationHistory.unshift(event);
      console.log(`[Diff Engine] 🎾 취소표 감지! ${event.courtName} ${event.date} ${event.timeLabel}`);

      // Dispatch multi-channel notifications (ONLY if not muted during 25th 09:00~10:00 KST)
      if (!isMuted) {
        if (options.kakaoAccessToken) {
          sendKakaoNotification(options.kakaoAccessToken, event);
        }
        if (options.discordWebhookUrl) {
          sendDiscordNotification(options.discordWebhookUrl, event);
        }
        if (options.telegramBotToken && options.telegramChatId) {
          sendTelegramNotification(options.telegramBotToken, options.telegramChatId, event);
        }
      }
    }

    // Update state cache
    previousState.set(key, slot.status);
  }

  // Persist updated state to file
  saveState(previousState);

  // Keep cancellation history limited to 50 items
  if (cancellationHistory.length > 50) {
    cancellationHistory = cancellationHistory.slice(0, 50);
  }

  return newCancellations;
}

export function getCancellationHistory() {
  return cancellationHistory;
}
