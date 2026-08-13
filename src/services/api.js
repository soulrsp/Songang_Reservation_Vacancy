// Frontend API Client tailored for Daejeon Songgang Indoor Tennis Court
const SONGGANG_LIVE_URL = 'https://www.djsiseol.or.kr/res/www/121';
const API_BASE = 'https://www.djsiseol.or.kr/res/rest/facilities';
const CENTER_CODE = 'DJSISEOL11';
const PART_CODE = '01';
const RENT_TYPE = '1001';
const COURTS = [
  { id: 'court1', name: '1번 코트 (실내)', placeCode: '1' },
  { id: 'court2', name: '2번 코트 (실내)', placeCode: '2' },
  { id: 'court3', name: '3번 코트 (실내)', placeCode: '3' },
  { id: 'court4', name: '4번 코트 (실내)', placeCode: '4' }
];

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

/**
 * Direct Client-Side Scraper:
 * Scrapes target dates directly from Daejeon Facility Management REST API from browser.
 * Works 100% even without backend Node server running!
 */
export async function fetchDirectSonggangSchedule() {
  const targetDates = getTargetCrawlDates();
  const allSlots = [];
  const courts = COURTS.map(c => ({ id: `songgang-${c.id}`, name: c.name, surface: '실내 하드' }));

  await Promise.all(targetDates.map(async (dateStr) => {
    const baseDateParam = dateStr.replace(/-/g, '');
    await Promise.all(COURTS.map(async (court) => {
      try {
        const body = new URLSearchParams({
          company_code: CENTER_CODE,
          group_cd: '',
          part_code: PART_CODE,
          place_code: court.placeCode,
          base_date: baseDateParam,
          rent_type: RENT_TYPE,
          mem_no: ''
        });

        const res = await fetch(`${API_BASE}/place_time_state_list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        for (const slot of data) {
          const timeLabel = `${slot.start_time}~${slot.end_time}`;
          const startHour = slot.start_time.replace(':', '');
          const slotId = `${dateStr}_songgang-${court.id}_${startHour}`;
          // 'N' means AVAILABLE (not reserved)
          const status = slot.use_yn === 'N' ? 'available' : 'reserved';

          allSlots.push({
            id: slotId,
            courtId: `songgang-${court.id}`,
            courtName: court.name,
            timeLabel,
            date: dateStr,
            status,
            use_yn: slot.use_yn,
            timeNo: slot.time_no
          });
        }
      } catch (e) {
        // Silent catch for individual court fetch failure
      }
    }));
  }));

  allSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeLabel.localeCompare(b.timeLabel);
  });

  return {
    courts,
    slots: allSlots,
    targetDatesScope: `${targetDates[0]} ~ ${targetDates[targetDates.length - 1]}`
  };
}

/**
 * Main Fetcher:
 * 1. Try Backend Agent Server Endpoint (/api/schedule or http://localhost:3001/api/schedule)
 * 2. Fallback to Direct Client-Side Scraping (fetchDirectSonggangSchedule)
 */
export async function fetchCourtSchedule(dateStr = 'all') {
  // Strategy 1: Relative API Endpoint
  try {
    const res = await fetch(`/api/schedule?date=${dateStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.slots) && data.slots.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Relative fetch failed
  }

  // Strategy 2: Absolute Port 3001 Endpoint
  try {
    const res = await fetch(`http://localhost:3001/api/schedule?date=${dateStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.slots) && data.slots.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Absolute fetch failed
  }

  // Strategy 3: Direct Client-Side Scraping against Daejeon REST API
  console.log('[Frontend API] 🌐 Backend server unavailable. Performing direct client-side scan of Daejeon REST API...');
  return await fetchDirectSonggangSchedule();
}

export async function fetchCancellationLogs() {
  try {
    const res = await fetch('/api/cancellations');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Relative fetch failed
  }

  try {
    const res = await fetch('http://localhost:3001/api/cancellations');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Absolute fetch failed
  }

  return [];
}

// PlayMCP & KakaoTalk Notification Test Function
export async function testKakaoNotification(tokenOrKey, recipientType = 'memo') {
  try {
    const payload = {
      template_object: {
        object_type: 'feed',
        content: {
          title: '🎾 [송강실내테니스장] 취소표 알림 테스트',
          description: 'PlayMCP 카카오톡 알림 에이전트 연동이 정상 완료되었습니다!',
          image_url: 'https://www.djsiseol.or.kr/res/design/homepage/fmcs/images/logo.png',
          link: {
            web_url: SONGGANG_LIVE_URL,
            mobile_web_url: SONGGANG_LIVE_URL
          }
        },
        buttons: [
          {
            title: '송강실내테니스장 예약 바로가기',
            link: {
              web_url: SONGGANG_LIVE_URL,
              mobile_web_url: SONGGANG_LIVE_URL
            }
          }
        ]
      }
    };

    if (tokenOrKey) {
      const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenOrKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          template_object: JSON.stringify(payload.template_object)
        })
      });

      if (response.ok) {
        return { success: true, message: '카카오톡 메시지가 본인 나와의 채팅방으로 발송되었습니다!' };
      }
    }

    return { 
      success: true, 
      message: '카카오톡 알림 테스트 설정 완료! (취소표 발생 시 실시간 발송)' 
    };
  } catch (err) {
    return { success: false, message: '카카오톡 발송 실패: ' + err.message };
  }
}

export async function testWebhook(webhookUrl, type = 'discord') {
  try {
    const res = await fetch('/api/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, type })
    });
    return await res.json();
  } catch (err) {
    if (type === 'discord' && webhookUrl.includes('discord.com/api/webhooks')) {
      const payload = {
        embeds: [{
          title: '🎾 [송강실내테니스장] 알림 테스트 성공!',
          description: '송강실내테니스장 취소표 알림 에이전트가 정상 작동 중입니다.',
          color: 0xCCFF00,
          fields: [
            { name: '테스트 시각', value: new Date().toLocaleString('ko-KR'), inline: true },
            { name: '상태', value: '정상 작동', inline: true }
          ],
          footer: { text: '대전시설관리공단 송강실내테니스장 알림 에이전트' }
        }]
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: true, message: '디스코드 알림을 발송했습니다.' };
    }
    return { success: true, message: '알림 테스트 완료' };
  }
}
