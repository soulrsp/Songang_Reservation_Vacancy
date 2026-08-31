import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import CourtSchedule from './components/CourtSchedule';
import { fetchSonggangSchedule, checkNextMonthOpenFastClient, getNextMonthFirstDayStr, getCachedSchedule } from './services/api';
import { playEmergencySiren } from './services/sound';
import { ExternalLink, Zap, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 평소 5분마다 자동 새로고침

export default function App() {
  // SWR: 로컬 스토리지에 캐시된 데이터가 있으면 0초 만에 즉시 렌더링
  const [scheduleData, setScheduleData] = useState(() => {
    const cached = getCachedSchedule();
    return cached || { courts: [], slots: [], scope: '' };
  });
  const [lastRefreshed, setLastRefreshed] = useState(() => {
    const cached = getCachedSchedule();
    return cached?.cachedAt ? new Date(cached.cachedAt) : null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);

  // ─── 25일 아침 조기 오픈 1초 스나이퍼 모드 상태 ─────────────────────────────
  const is25thMorningTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    return kst.getDate() === 25 && (
      (kst.getHours() === 8 && kst.getMinutes() >= 55) ||
      (kst.getHours() === 9 && kst.getMinutes() <= 5)
    );
  };

  const [sniperActive, setSniperActive] = useState(is25thMorningTime());
  const [sniperCheckCount, setSniperCheckCount] = useState(0);
  const [sniperLastChecked, setSniperLastChecked] = useState(null);
  const [openAlert, setOpenAlert] = useState(null); // { time: '08:59:21', availableCount: 20 }
  const sirenTriggeredRef = useRef(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchSonggangSchedule();
      if (data && Array.isArray(data.slots) && data.slots.length > 0) {
        setScheduleData(data);
        setLastRefreshed(new Date());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => { loadData(); }, [loadData]);

  // 평소 5분 자동 새로고침
  useEffect(() => {
    const timer = setInterval(loadData, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  // ─── 1초 초고속 오픈 감지 스나이퍼 루프 ───────────────────────────────────
  useEffect(() => {
    if (!sniperActive || openAlert) return;

    const targetDate = getNextMonthFirstDayStr();
    const interval = setInterval(async () => {
      const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSniperLastChecked(nowStr);
      setSniperCheckCount(c => c + 1);

      try {
        const res = await checkNextMonthOpenFastClient(targetDate);
        if (res.isOpen) {
          const alertData = { time: nowStr, availableCount: res.availableCount, targetDate };
          setOpenAlert(alertData);
          if (!sirenTriggeredRef.current) {
            sirenTriggeredRef.current = true;
            playEmergencySiren();
          }
          // 전체 데이터도 즉시 새로고침
          loadData();
        }
      } catch (_) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [sniperActive, openAlert, loadData]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 🚨 서버 오픈 감지 시 화면 상단 긴급 플래시 배너 */}
      {openAlert && (
        <div style={{
          background: 'linear-gradient(90deg, #FF0055 0%, #FF5500 50%, #FF0055 100%)',
          color: '#FFFFFF',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: '900',
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 25px rgba(255, 0, 85, 0.6)',
          animation: 'pulse 1s infinite'
        }}>
          <Flame size={20} className="animate-bounce" />
          <span>🚨 [{openAlert.time} KST] 송강 테니스 다음달 예약 서버가 방금 열렸습니다! 지금 바로 예약하세요!</span>
          <a
            href="https://www.djsiseol.or.kr/res/www/121"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#FFFFFF',
              color: '#D90429',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '900',
              fontSize: '13px',
              textDecoration: 'none',
              marginLeft: '8px'
            }}
          >
            1초 이동 ➔
          </a>
        </div>
      )}

      <Navbar
        lastRefreshed={lastRefreshed}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 🎯 25일 조기 오픈 1초 스나이퍼 배너 */}
        <div className="glass-panel" style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          border: sniperActive ? '1px solid rgba(255, 107, 129, 0.6)' : '1px solid var(--border-color)',
          background: sniperActive ? 'rgba(255, 107, 129, 0.12)' : 'rgba(15, 23, 42, 0.5)',
          boxShadow: sniperActive ? '0 0 20px rgba(255, 107, 129, 0.2)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: sniperActive ? 'rgba(255, 107, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: sniperActive ? '#FF6B81' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px'
            }}>
              {sniperActive ? '🎯' : '⏱️'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>25일 아침 조기 오픈 1초 스나이퍼</span>
                {sniperActive && (
                  <span style={{
                    fontSize: '11px', background: '#FF4757', color: '#FFF',
                    padding: '1px 6px', borderRadius: '10px', fontWeight: '700'
                  }}>
                    실시간 1초 감지 중 ({sniperCheckCount}회)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {sniperActive 
                  ? `다음달(${getNextMonthFirstDayStr()}) 1코트 슬롯 오픈 여부를 1초마다 감시 중 (최근: ${sniperLastChecked || '스캔 중...'})`
                  : '매달 25일 08:55~09:05 조기 오픈(8:59:20 등)을 1초 내에 감지하여 사이렌 경보를 울립니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!sniperActive) {
                // 스나이퍼 시작 시 오디오 권한 획득용 가벼운 비프음 1회
                playEmergencySiren();
              }
              setSniperActive(!sniperActive);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: sniperActive ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: sniperActive ? '#FF6B81' : 'var(--text-muted)',
              border: sniperActive ? '1px solid #FF6B81' : '1px solid var(--border-color)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {sniperActive ? '스나이퍼 끄기' : '🎯 1초 감지 켜기'}
          </button>
        </div>

        <CourtSchedule
          scheduleData={scheduleData}
          onSlotClick={setBookingSlot}
        />
      </main>

      {/* 🚨 서버 조기 오픈 감지 시 초거대 긴급 팝업 모달 */}
      {openAlert && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 8, 15, 0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '440px',
            padding: '28px 24px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '16px',
            border: '2px solid #FF4757',
            boxShadow: '0 0 40px rgba(255, 71, 87, 0.6)'
          }}>
            <div style={{ fontSize: '48px', animation: 'bounce 0.8s infinite' }}>🚨</div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#FF4757' }}>
                송강 다음달 예약 서버 오픈 감지!
              </h2>
              <p style={{ fontSize: '14px', color: '#F8FAFC', marginTop: '6px', fontWeight: '700' }}>
                감지 시각: <span style={{ color: '#CCFF00' }}>{openAlert.time} KST</span>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                다음달 예약 슬롯이 지금 방금 열렸습니다. 1초가 급하니 즉시 접속하세요!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setOpenAlert(null)}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'var(--text-muted)',
                  fontSize: '13px', fontWeight: '600'
                }}
              >닫기</button>
              <a
                href="https://www.djsiseol.or.kr/res/www/121"
                target="_blank" rel="noreferrer"
                onClick={() => setOpenAlert(null)}
                style={{
                  flex: 2, padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #FF4757 0%, #FF0055 100%)',
                  color: '#FFFFFF',
                  fontSize: '15px', fontWeight: '900',
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 0 20px rgba(255, 71, 87, 0.6)'
                }}
              >
                <span>송강 예약 사이트 1초 이동</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 예약 확인 모달 (일반 슬롯 클릭 시) */}
      {bookingSlot && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 8, 15, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="glass-panel glow-accent" style={{
            width: '100%', maxWidth: '400px',
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px' }}>🎾</div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC' }}>
                송강실내테니스장 예약
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                대전시설관리공단 예약 페이지로 이동합니다.
              </p>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '6px',
              fontSize: '13px'
            }}>
              <div><strong>날짜:</strong> {bookingSlot.date}</div>
              <div><strong>코트:</strong> {bookingSlot.courtName}</div>
              <div><strong>시간:</strong> {bookingSlot.timeLabel}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBookingSlot(null)}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'var(--text-muted)',
                  fontSize: '13px', fontWeight: '600'
                }}
              >닫기</button>
              <a
                href="https://www.djsiseol.or.kr/res/www/121"
                target="_blank" rel="noreferrer"
                onClick={() => setBookingSlot(null)}
                style={{
                  flex: 2, padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-accent)',
                  color: '#0B0F17',
                  fontSize: '13px', fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)'
                }}
              >
                <span>예약 사이트 이동</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
