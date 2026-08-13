import { scrapeMultipleDates } from '../server/crawler.js';

// Calculate target crawl dates identical to server/index.js
function getTargetCrawlDates() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);

  const currentYear = kstTime.getFullYear();
  const currentMonth = kstTime.getMonth();
  const currentDay = kstTime.getDate();
  const currentHour = kstTime.getHours();

  const dates = [];
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let day = currentDay; day <= lastDayOfCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

const targetDates = getTargetCrawlDates();
console.log('Target dates:', targetDates);

console.log('Fetching multiple dates...');
const data = await scrapeMultipleDates(targetDates);

console.log('Total slots retrieved:', data.slots.length);
const available = data.slots.filter(s => s.status === 'available');
console.log('Available slots count:', available.length);
console.log('Available slots detail:', JSON.stringify(available, null, 2));
