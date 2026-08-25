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

  // 25일 09시 이후: 다음달 전체도 오픈되므로 모니터링에 포함
  if ((today === 25 && hour >= 9) || today > 25) {
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

async function runConcurrently(tasks, limit = 8) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function fetchCourtDate(dateStr, court) {
  const base = dateStr.replace(/-/g, '');
  const query = `company_code=${CENTER_CODE}&group_cd=&part_code=${PART_CODE}&place_code=${court.placeCode}&base_date=${base}&rent_type=${RENT_TYPE}&mem_no=`;
  const targetUrl = `https://www.djsiseol.or.kr/res/rest/facilities/place_time_state_list?${query}`;

  const endpoints = [
    // 1. Vite 개발 환경 로컬 프록시
    {
      url: `/djsiseol-api/res/rest/facilities/place_time_state_list?${query}`,
      method: 'GET'
    },
    // 2. 검증된 초고속 CORS 프록시 (cors.eu.org)
    {
      url: `https://cors.eu.org/${targetUrl}`,
      method: 'GET'
    },
    // 3. Fallback: allorigins raw
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      method: 'GET'
    },
    // 4. Fallback: codetabs proxy
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      method: 'GET'
    }
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(ep.url, {
        method: ep.method,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        let text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (_) {
          continue;
        }

        // data가 contents 래핑되어 있는 경우 대응
        if (data && typeof data === 'object' && data.contents) {
          try { data = JSON.parse(data.contents); } catch (_) {}
        }

        if (Array.isArray(data)) return data;
      }
    } catch (_) {
      /* try next proxy */
    }
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

  const tasks = [];
  for (const dateStr of dates) {
    for (const court of COURTS) {
      tasks.push(async () => {
        const data = await fetchCourtDate(dateStr, court);
        if (!data || !Array.isArray(data)) return;

        for (const slot of data) {
          const startHour = (slot.start_time || '').replace(':', '');
          allSlots.push({
            id: `${dateStr}_songgang-${court.id}_${startHour}`,
            courtId: `songgang-${court.id}`,
            courtName: court.name,
            timeLabel: `${slot.start_time}~${slot.end_time}`,
            date: dateStr,
            status: slot.use_yn === 'N' ? 'available' : 'reserved',
          });
        }
      });
    }
  }

  // 동시 8개 병렬 처리로 브라우저 과부하 없이 수초 내에 전송 완료
  await runConcurrently(tasks, 8);

  allSlots.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.timeLabel.localeCompare(b.timeLabel)
  );

  return {
    courts,
    slots: allSlots,
    scope: `${dates[0]} ~ ${dates[dates.length - 1]}`
  };
}
