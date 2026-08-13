import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const API_BASE = 'https://www.djsiseol.or.kr/res/rest/facilities';
const CENTER_CODE = 'DJSISEOL11';
const PART_CODE = '01';
const RENT_TYPE = '1001';
const COURTS = [
  { id: 'court1', name: '1코트', placeCode: '1' },
  { id: 'court2', name: '2코트', placeCode: '2' },
  { id: 'court3', name: '3코트', placeCode: '3' },
  { id: 'court4', name: '4코트', placeCode: '4' },
];

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Referer': 'https://www.djsiseol.or.kr/res/www/121',
  'Origin': 'https://www.djsiseol.or.kr',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest'
};

function parseStatus(use_yn) {
  if (use_yn === 'N') return 'available';
  return 'reserved';
}

/**
 * Scrape Songgang Indoor Tennis Court schedule via direct REST API.
 * 
 * @param {string} dateStr - format: YYYY-MM-DD
 * @returns {{ courts, slots }}
 */
export async function scrapeSonggangTennis(dateStr) {
  const baseDateParam = dateStr.replace(/-/g, '');

  const courts = COURTS.map(c => ({
    id: `songgang-${c.id}`,
    name: c.name,
    surface: '실내 하드'
  }));

  const slots = [];

  await Promise.all(COURTS.map(async (court) => {
    try {
      const response = await axios.post(
        `${API_BASE}/place_time_state_list`,
        new URLSearchParams({
          company_code: CENTER_CODE,
          group_cd: '',
          part_code: PART_CODE,
          place_code: court.placeCode,
          base_date: baseDateParam,
          rent_type: RENT_TYPE,
          mem_no: ''
        }).toString(),
        { httpsAgent, headers: HEADERS, timeout: 8000 }
      );

      const data = response.data;
      if (!Array.isArray(data)) {
        return;
      }

      for (const slot of data) {
        const timeLabel = `${slot.start_time}~${slot.end_time}`;
        const startHour = slot.start_time.replace(':', '');
        const slotId = `${dateStr}_songgang-${court.id}_${startHour}`;

        slots.push({
          id: slotId,
          courtId: `songgang-${court.id}`,
          courtName: court.name,
          timeLabel,
          date: dateStr,
          status: parseStatus(slot.use_yn),
          use_yn: slot.use_yn,
          timeNo: slot.time_no
        });
      }
    } catch (err) {
      _pushReservedBaseline(dateStr, court, slots);
    }
  }));

  if (slots.length > 0) {
    return { courts, slots };
  }

  return generateReservedBaseline(dateStr);
}

/**
 * Scrape multiple target dates and aggregate all slots & available slots.
 */
export async function scrapeMultipleDates(dateStrList) {
  const allSlots = [];
  let courts = [];

  await Promise.all(dateStrList.map(async (d) => {
    const res = await scrapeSonggangTennis(d);
    if (res && res.slots) {
      allSlots.push(...res.slots);
    }
    if (res && res.courts && courts.length === 0) {
      courts = res.courts;
    }
  }));

  // Sort slots chronologically by date and time
  allSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeLabel.localeCompare(b.timeLabel);
  });

  return { courts, slots: allSlots };
}

function _pushReservedBaseline(dateStr, court, slotsArray) {
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];
  timeSlots.forEach((start, i) => {
    const end = timeSlots[i + 1] || '22:00';
    const startHour = start.replace(':', '');
    slotsArray.push({
      id: `${dateStr}_songgang-${court.id}_${startHour}`,
      courtId: `songgang-${court.id}`,
      courtName: court.name,
      timeLabel: `${start}~${end}`,
      date: dateStr,
      status: 'reserved',
      use_yn: 'Y'
    });
  });
}

function generateReservedBaseline(dateStr) {
  const courts = COURTS.map(c => ({ id: `songgang-${c.id}`, name: c.name, surface: '실내 하드' }));
  const slots = [];
  COURTS.forEach(court => _pushReservedBaseline(dateStr, court, slots));
  return { courts, slots };
}
