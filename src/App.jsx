import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CourtSchedule from './components/CourtSchedule';
import NotificationSettingsModal from './components/NotificationSettingsModal';

import { fetchCourtSchedule } from './services/api';
import { Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [scheduleData, setScheduleData] = useState({ courts: [], slots: [], targetDatesScope: '' });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Booking Modal State
  const [bookingModalSlot, setBookingModalSlot] = useState(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    discordWebhookUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    pollInterval: 60
  });

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchCourtSchedule('all');
    setScheduleData(data);
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling Interval Effect
  useEffect(() => {
    if (!settings.pollInterval || settings.pollInterval <= 0) return;
    const interval = setInterval(() => {
      loadData();
    }, settings.pollInterval * 1000);
    return () => clearInterval(interval);
  }, [settings.pollInterval, loadData]);



  const handleSlotClick = (slot) => {
    setBookingModalSlot(slot);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar (Centered action buttons, mobile responsive) */}
      <Navbar
        isMonitoring={true}
        lastRefreshed={lastRefreshed}
        onRefresh={loadData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Responsive Container */}
      <main className="mobile-main-container" style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 20px 40px 20px',
        width: '100%'
      }}>
        <CourtSchedule
          scheduleData={scheduleData}
          onSlotClick={handleSlotClick}
        />
      </main>

      {/* Booking Confirmation Modal */}
      {bookingModalSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 15, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel glow-accent mobile-modal-content" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
              color: '#0B0F17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto',
              boxShadow: '0 0 20px rgba(204, 255, 0, 0.4)'
            }}>
              🎾
            </div>

            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#F8FAFC' }}>
                송강실내테니스장 대관 안내
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                대전시설관리공단 대관 예약 페이지로 이동합니다.
              </p>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px'
            }}>
              <div><strong>날짜:</strong> {bookingModalSlot.date || selectedDate}</div>
              <div><strong>코트:</strong> {bookingModalSlot.courtName || '1번 코트'}</div>
              <div><strong>시간:</strong> {bookingModalSlot.timeLabel}</div>
              <div>
                <strong>상태:</strong> {' '}
                <span style={{ color: bookingModalSlot.status === 'cancelled' ? '#FF6B81' : '#10B981', fontWeight: '700' }}>
                  {bookingModalSlot.status === 'cancelled' ? '⚡ 방금 취소됨 (빈자리)' : '✅ 예약 가능'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBookingModalSlot(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                닫기
              </button>
              <a
                href="https://www.djsiseol.or.kr/res/www/121"
                target="_blank"
                rel="noreferrer"
                onClick={() => setBookingModalSlot(null)}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-accent)',
                  color: '#0B0F17',
                  fontSize: '12px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)'
                }}
              >
                <span>송강 예약 사이트 이동</span>
                <ExternalLink size={13} />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

    </div>
  );
}
