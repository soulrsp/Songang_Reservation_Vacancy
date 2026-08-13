import { sendTelegramNotification } from './notifier.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'state', 'previousState.json');
const HISTORY_FILE = path.join(__dirname, 'state', 'cancellationHistory.json');

// ─── 상태 영속화 (GitHub Actions 캐시로 유지) ──────────────────────────────

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return new Map(Object.entries(JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))));
    }
  } catch (_) {}
  return new Map();
}

function saveState(map) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(Object.fromEntries(map)));
  } catch (_) {}
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      if (Array.isArray(raw)) return raw;
    }
  } catch (_) {}
  return [];
}

function saveHistory(arr) {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(arr));
  } catch (_) {}
}

// ─── 뮤트 기간 판단 (매달 25일 09:00~09:59 KST) ────────────────────────────

function isMutePeriod() {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  return kst.getDate() === 25 && kst.getHours() === 9;
}

// ─── 모듈 상태 ─────────────────────────────────────────────────────────────

let previousState = loadState();
let cancellationHistory = loadHistory();

// ─── 메인 diff 비교 함수 ───────────────────────────────────────────────────

/**
 * 현재 슬롯 목록과 이전 상태를 비교해 새로운 취소표를 감지하고 텔레그램 알림 발송
 */
export async function processDiff(currentSlots, options = {}) {
  const newEvents = [];
  const muted = isMutePeriod();

  if (muted) {
    console.log('[Diff Engine] 🔇 25일 09시 오픈 시간 — 알림 일시 정지');
  }

  console.log(`[Diff Engine] 📊 비교 시작 — 총 ${currentSlots.length}개 슬롯 / 이전 기록 ${previousState.size}개`);

  let detected = 0;
  let alreadyKnown = 0;

  for (const slot of currentSlots) {
    const prev = previousState.get(slot.id);
    const isAvailable = slot.status === 'available';

    if (isAvailable) {
      const isNew = prev === 'reserved' || prev === undefined;
      if (isNew) {
        detected++;
        const label = prev === undefined ? '최초감지' : '취소표발생';
        console.log(`[Diff Engine] 🎾 [${label}] ${slot.courtName} ${slot.date} ${slot.timeLabel}`);

        const event = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          courtName: slot.courtName,
          timeLabel: slot.timeLabel,
          date: slot.date,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: prev === undefined ? '빈자리 감지' : '취소표 발생'
        };

        newEvents.push(event);
        cancellationHistory.unshift(event);

        if (!muted && options.telegramBotToken && options.telegramChatId) {
          await sendTelegramNotification(options.telegramBotToken, options.telegramChatId, event);
        }
      } else {
        alreadyKnown++;
      }
    }

    previousState.set(slot.id, slot.status);
  }

  console.log(`[Diff Engine] ✅ 완료 — 신규감지: ${detected}개 / 이미알던 빈자리: ${alreadyKnown}개`);

  saveState(previousState);

  if (cancellationHistory.length > 50) cancellationHistory = cancellationHistory.slice(0, 50);
  saveHistory(cancellationHistory);

  return newEvents;
}

export function getCancellationHistory() {
  return cancellationHistory;
}
