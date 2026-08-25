// 송강실내테니스장 API 클라이언트
// GitHub Pages 환경용 — corsproxy.io를 통해 직접 호출

const CENTER_CODE = 'DJSISEOL11';
const PART_CODE = '01';
const RENT_TYPE = '1001';
const COURTS = [
  { id: 'court1', name: '1번 코트', placeCode: '1' },
  { id: 'court2', name: '2번 코트', placeCode: '2' },
  { id: 'court3', name: '3번 코트', placeCode: '3' },
  { id: 'court4', name: '4번 코트', placeCode: '4' },
];

function getKstDate() {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
}

export function getNextMonthFirstDayStr() {
  const kst = getKstDate();
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const ny = month === 11 ? year + 1 : year;
  const nm = (month + 1) % 12;
  return `${ny}-${String(nm + 1).padStart(2, '0')}-01`;
}

function getTargetDates() {
  const kst = getKstDate();
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const today = kst.getDate();
  const hour = kst.getHours();

  const dates = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = today; d <= lastDay; d++) {
    const dd = new Date(year, month, d);
    dates.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`);
  }

  // 25일 10시 이후: 다음달도 포함
  if ((today === 25 && hour >= 10) || today > 25) {
    const ny = month === 11 ? year + 1 : year;
    const nm = (month + 1) % 12;
    const nLast = new Date(ny, nm + 1, 0).getDate();
    for (let d = 1; d <= nLast; d++) {
      const dd = new Date(ny, nm, d);
      dates.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`);
    }
  }

  return dates;
}

async function fetchCourtDate(dateStr, court) {
  const base = dateStr.replace(/-/g, '');
  const body = new URLSearchParams({
    company_code: CENTER_CODE,
    group_cd: '',
    part_code: PART_CODE,
    place_code: court.placeCode,
    base_date: base,
    rent_type: RENT_TYPE,
    mem_no: ''
  }).toString();

  const target = 'https://www.djsiseol.or.kr/res/rest/facilities/place_time_state_list';
  const endpoints = [
    '/djsiseol-api/res/rest/facilities/place_time_state_list', // Vite dev proxy
    `https://corsproxy.io/?${encodeURIComponent(target)}`      // GitHub Pages fallback
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (_) { /* try next */ }
  }
  return null;
}

/**
 * 25일 아침 초고속 오픈 감지용 함수 (다음달 1일 1코트 슬롯 개방 여부 1초 이내 판별)
 */
export async function checkNextMonthOpenFastClient(targetDateStr) {
  const data = await fetchCourtDate(targetDateStr, COURTS[0]);
  if (Array.isArray(data) && data.length > 0) {
    const availableSlots = data.filter(s => s.use_yn === 'N');
    if (availableSlots.length > 0) {
      return { isOpen: true, availableCount: availableSlots.length, totalSlots: data.length };
    }
  }
  return { isOpen: false, availableCount: 0, totalSlots: Array.isArray(data) ? data.length : 0 };
}

export async function fetchSonggangSchedule() {
  const dates = getTargetDates();
  const courts = COURTS.map(c => ({ id: `songgang-${c.id}`, name: c.name }));
  const allSlots = [];

  await Promise.all(dates.map(async (dateStr) => {
    await Promise.all(COURTS.map(async (court) => {
      const data = await fetchCourtDate(dateStr, court);
      if (!data) return;
      for (const slot of data) {
        const startHour = slot.start_time.replace(':', '');
        allSlots.push({
          id: `${dateStr}_songgang-${court.id}_${startHour}`,
          courtId: `songgang-${court.id}`,
          courtName: court.name,
          timeLabel: `${slot.start_time}~${slot.end_time}`,
          date: dateStr,
          status: slot.use_yn === 'N' ? 'available' : 'reserved',
        });
      }
    }));
  }));

  allSlots.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.timeLabel.localeCompare(b.timeLabel)
  );

  return {
    courts,
    slots: allSlots,
    scope: `${dates[0]} ~ ${dates[dates.length - 1]}`
  };
}
