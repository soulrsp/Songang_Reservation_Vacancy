import { sendDiscordNotification, sendTelegramNotification } from './notifier.js';

let previousState = new Map();
let cancellationHistory = [];

/**
 * Compare current snapshot against previous snapshot to identify newly freed slots
 */
export function processDiff(currentSlots, options = {}) {
  const newCancellations = [];

  for (const slot of currentSlots) {
    const key = slot.id;
    const prevStatus = previousState.get(key);

    // If slot was previously 'reserved' and is now 'available' or 'cancelled', it's a cancellation!
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

      // Trigger Webhooks if configured
      if (options.discordWebhookUrl) {
        sendDiscordNotification(options.discordWebhookUrl, event);
      }
      if (options.telegramBotToken && options.telegramChatId) {
        sendTelegramNotification(options.telegramBotToken, options.telegramChatId, event);
      }
    }

    // Update state cache
    previousState.set(key, slot.status);
  }

  // Keep cancellation history limited to 50 items
  if (cancellationHistory.length > 50) {
    cancellationHistory = cancellationHistory.slice(0, 50);
  }

  return newCancellations;
}

export function getCancellationHistory() {
  return cancellationHistory;
}
