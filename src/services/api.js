// 송강실내테니스장 API 클라이언트
// GitHub Pages & 로컬 환경 지원 및 SWR 로컬 스토리지 캐시 적용

const CENTER_CODE = 'DJSISEOL11';
const PART_CODE = '01';
const RENT_TYPE = '1001';
const COURTS = [
  { id: 'court1', name: '1번 코트', placeCode: '1' },
  { id: 'court2', name: '2번 코트', placeCode: '2' },
  { id: 'court3', name: '3번 코트', placeCode: '3' },
  { id: 'court4', name: '4번 코트', placeCode: '4' },
];

const CACHE_KEY = 'songgang_tennis_schedule_cache_v1';

/**
 * 로컬 스토리지에 저장된 직전 성공 코트 현황 반환 (SWR 0초 로딩용)
 */
export function getCachedSchedule() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
      return parsed;
    }
  } catch (_) {}
  return null;
}

/**
 * 성공한 코트 현황 데이터를 로컬 스토리지에 영속 저장
 */
export function saveCachedSchedule(data) {
  try {
    if (data && Array.isArray(data.slots) && data.slots.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        cachedAt: Date.now()
      }));
    }
  } catch (_) {}
}

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

/**
 * 단일 날짜/코트 데이터 요청 (재시도 및 다중 프록시 fallback 포함)
 */
async function fetchCourtDate(dateStr, court, retryCount = 1) {
  const base = dateStr.replace(/-/g, '');
  const query = `company_code=${CENTER_CODE}&group_cd=&part_code=${PART_CODE}&place_code=${court.placeCode}&base_date=${base}&rent_type=${RENT_TYPE}&mem_no=`;
  const targetUrl = `https://www.djsiseol.or.kr/res/rest/facilities/place_time_state_list?${query}`;

  const endpoints = [
    // 1. Vite 개발 환경 로컬 프록시
    {
      url: `/djsiseol-api/res/rest/facilities/place_time_state_list?${query}`,
      method: 'GET',
      timeout: 3000
    },
    // 2. 검증된 초고속 CORS 프록시 (cors.eu.org)
    {
      url: `https://cors.eu.org/${targetUrl}`,
      method: 'GET',
      timeout: 5000
    },
    // 3. Fallback: allorigins raw
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      method: 'GET',
      timeout: 5000
    },
    // 4. Fallback: codetabs proxy
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      method: 'GET',
      timeout: 5000
    }
  ];

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ep.timeout || 5000);

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

          if (data && typeof data === 'object' && data.contents) {
            try { data = JSON.parse(data.contents); } catch (_) {}
          }

          if (Array.isArray(data)) return data;
        }
      } catch (_) {
        /* try next proxy */
      }
    }
    // 재시도 전 300ms 대기
    if (attempt < retryCount) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return null;
}

/**
 * 25일 아침 초고속 오픈 감지용 함수 (다음달 1일 1코트 슬롯 개방 여부 1초 이내 판별)
 */
export async function checkNextMonthOpenFastClient(targetDateStr) {
  const data = await fetchCourtDate(targetDateStr, COURTS[0], 0);
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
        const data = await fetchCourtDate(dateStr, court, 1);
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

  // 정상적으로 슬롯을 1개 이상 수집한 경우
  if (allSlots.length > 0) {
    const result = {
      courts,
      slots: allSlots,
      scope: `${dates[0]} ~ ${dates[dates.length - 1]}`
    };
    // 로컬 스토리지에 캐시 영속화
    saveCachedSchedule(result);
    return result;
  }

  // 네트워크 장애 등으로 수집 실패 시 로컬 캐시 fallback 반환
  const fallback = getCachedSchedule();
  if (fallback) {
    return fallback;
  }

  return {
    courts,
    slots: [],
    scope: `${dates[0]} ~ ${dates[dates.length - 1]}`
  };
}
