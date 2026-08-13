// Client-Side Scraper for Songgang Indoor Tennis Court
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
        // Suppress fetch errors
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
