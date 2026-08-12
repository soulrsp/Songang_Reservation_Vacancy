import React from 'react';
import { Zap, Clock, ExternalLink, BellRing, ChevronRight } from 'lucide-react';

export default function CancellationStream({ logs, onSlotClick }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#FF6B81',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BellRing size={16} className="animate-pulse-glow" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC' }}>
              실시간 취소표 발생 로그
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              누군가 예약을 취소한 최근 빈자리 감지 내역
            </p>
          </div>
        </div>
        
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(244, 63, 94, 0.2)',
          color: '#FF6B81',
          fontWeight: '700',
          border: '1px solid rgba(244, 63, 94, 0.3)'
        }}>
          LIVE STREAM
        </span>
      </div>

      {/* Log List Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '30px 10px', 
            color: 'var(--text-muted)', 
            fontSize: '13px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)'
          }}>
            아직 감지된 취소표 내역이 없습니다.<br/>
            에이전트가 실시간 모니터링 중입니다. 🎾
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#FF6B81',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                    {log.courtName} - {log.timeLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{log.date}</span>
                    <span>•</span>
                    <span style={{ color: '#FF6B81', fontWeight: '600' }}>{log.timestamp} 감지됨</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSlotClick({
                  courtName: log.courtName,
                  timeLabel: log.timeLabel,
                  date: log.date,
                  status: 'cancelled'
                })}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-accent)',
                  color: '#0B0F17',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 10px rgba(204, 255, 0, 0.3)'
                }}
              >
                <span>예약하기</span>
                <ChevronRight size={12} />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
