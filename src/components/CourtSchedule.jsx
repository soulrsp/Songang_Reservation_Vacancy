import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, CalendarDays } from 'lucide-react';

export default function CourtSchedule({ 
  scheduleData,
  onSlotClick 
}) {
  const [showAvailableModal, setShowAvailableModal] = useState(false);

  const { slots = [], targetDatesScope = '' } = scheduleData || {};

  const availableSlotsList = slots.filter(s => s.status === 'available' || s.status === 'cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Scope Banner */}
      <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarDays size={14} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          모니터링 범위: <strong style={{ color: '#F8FAFC' }}>{targetDatesScope || '전체 예약 오픈 기간'}</strong>
        </span>
      </div>

      {/* Available Slots Summary Card */}
      <div
        className="glass-panel"
        onClick={() => setShowAvailableModal(true)}
        title="클릭하면 예약 가능한 코트 목록을 확인합니다."
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: 'rgba(16, 185, 129, 0.08)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '9px',
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>예약 가능 코트</span>
            <strong style={{ fontSize: '18px', fontWeight: '800', color: '#10B981' }}>
              {availableSlotsList.length}개
            </strong>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: '#10B981' }} />
      </div>

      {/* Available Slots List */}
      <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px', height: '24px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={14} />
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC' }}>
            예약 가능 코트 목록
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
          {availableSlotsList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '16px 8px',
              color: 'var(--text-muted)',
              fontSize: '11px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-color)'
            }}>
              현재 남아있는 빈 코트가 없습니다.<br />
              <span style={{ marginTop: '4px', display: 'block', color: 'var(--primary-accent)' }}>취소표 발생 시 텔레그램으로 즉시 알림 🎾</span>
            </div>
          ) : (
            availableSlotsList.map(slot => (
              <div
                key={slot.id}
                className="mobile-list-item"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>🎾</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--primary-accent)' }}>📅 {slot.date}</span>
                      <span>•</span>
                      <span>{slot.courtName}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      시간: <strong style={{ color: '#F8FAFC' }}>{slot.timeLabel}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSlotClick(slot)}
                  className="mobile-list-btn"
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-accent)',
                    color: '#0B0F17',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>예약</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Slots Modal */}
      {showAvailableModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 15, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '12px'
        }}>
          <div className="glass-panel glow-accent mobile-modal-content" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>예약 가능 코트 목록</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>총 {availableSlotsList.length}개 발견</p>
                </div>
              </div>
              <button
                onClick={() => setShowAvailableModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)',
                  width: '30px', height: '30px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>

            {/* List Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
              {availableSlotsList.length === 0 ? (
                <div style={{
                  padding: '24px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-color)'
                }}>
                  현재 예약 가능한 슬롯이 없습니다. 🎾
                </div>
              ) : (
                availableSlotsList.map(slot => (
                  <div
                    key={slot.id}
                    className="mobile-list-item"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📅 {slot.date}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--primary-accent)' }}>{slot.courtName}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ⏰ 시간: <strong>{slot.timeLabel}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => { onSlotClick(slot); setShowAvailableModal(false); }}
                      className="mobile-list-btn"
                      style={{
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-accent)',
                        color: '#0B0F17',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 0 10px rgba(204, 255, 0, 0.3)'
                      }}
                    >
                      <span>예약하기</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setShowAvailableModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
