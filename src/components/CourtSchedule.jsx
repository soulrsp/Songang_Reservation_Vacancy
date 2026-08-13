import React, { useState } from 'react';
import { CheckCircle2, Zap, X, ChevronRight, ExternalLink, BellRing, CalendarDays } from 'lucide-react';

export default function CourtSchedule({ 
  scheduleData, 
  cancellationLogs = [],
  onSlotClick 
}) {
  // Detail List Modal State ('available' | 'cancelled' | null)
  const [listModalType, setListModalType] = useState(null);

  const { slots = [], targetDatesScope = '' } = scheduleData || {};

  // Calculate statistics & slot lists for ALL target dates
  const availableSlotsList = slots.filter(s => s.status === 'available' || s.status === 'cancelled');
  const cancelledSlotsList = slots.filter(s => s.status === 'cancelled')
    .concat(cancellationLogs.map(log => ({
      id: log.id || 'log-' + Math.random(),
      courtName: log.courtName,
      timeLabel: log.timeLabel,
      date: log.date,
      status: 'cancelled',
      timestamp: log.timestamp
    })));

  const modalSlotList = listModalType === 'available' ? availableSlotsList : cancelledSlotsList;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Scope Banner */}
      <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <CalendarDays size={16} style={{ color: 'var(--primary-accent)' }} />
          <span>모니터링 범위: <strong style={{ color: '#F8FAFC' }}>{targetDatesScope || '전체 예약 오픈 기간'}</strong></span>
        </div>
        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          실시간 자동 스캔 중 🎾
        </div>
      </div>

      {/* Top Banner Cards */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div className="mobile-grid-2col" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '12px' 
        }}>
          
          {/* 1. Available Slots Card Button */}
          <div 
            onClick={() => setListModalType('available')}
            title="클릭하면 8월/전체 기간 예약 가능한 코트 목록을 확인합니다."
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>전체 기간 예약 가능 코트</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>
                  {availableSlotsList.length}개
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#10B981' }} />
          </div>

          {/* 2. Cancelled Slots Card Button */}
          <div 
            onClick={() => setListModalType('cancelled')}
            title="클릭하면 실시간 발생한 취소표 감지 내역을 확인합니다."
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(244, 63, 94, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#FF6B81',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>실시간 발생 취소표</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#FF6B81' }}>
                  {cancelledSlotsList.length}개
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#FF6B81' }} />
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Section 1: Available Slots List Across Entire Period */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>
                  전체 기간 예약 가능 코트 목록 (한눈에 보기)
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  현재 예약 신청이 가능한 모든 날짜/코트 슬롯
                </p>
              </div>
            </div>

            <button
              onClick={() => setListModalType('available')}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              팝업 보기
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {availableSlotsList.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 10px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)'
              }}>
                현재 전체 모니터링 기간 중 남아있는 빈 코트가 없습니다.<br/>
                실시간으로 취소표가 발생하는 즉시 감지되어 알림이 발송됩니다. 🎾
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      🎾
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--primary-accent)' }}>📅 {slot.date}</span>
                        <span>•</span>
                        <span>{slot.courtName}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        시간: <strong style={{ color: '#F8FAFC' }}>{slot.timeLabel}</strong> | <strong style={{ color: '#10B981' }}>예약 가능</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSlotClick(slot)}
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
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Cancelled Logs Stream */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#FF6B81',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <BellRing size={16} className="animate-pulse-glow" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>
                  실시간 취소표 발생 로그
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  누군가 예약을 취소한 최근 빈자리 감지 내역
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setListModalType('cancelled')}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#FF6B81',
                fontWeight: '700',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              팝업 보기
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {cancellationLogs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '24px 10px', 
                color: 'var(--text-muted)', 
                fontSize: '12px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)'
              }}>
                아직 발생한 취소표 내역이 없습니다.<br/>
                에이전트가 실시간 모니터링 중입니다. 🎾
              </div>
            ) : (
              cancellationLogs.map(log => (
                <div
                  key={log.id}
                  className="mobile-list-item"
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#FF6B81',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC' }}>
                        {log.courtName} - {log.timeLabel}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📅 {log.date}</span>
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
                    className="mobile-list-btn"
                    style={{
                      padding: '6px 12px',
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
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Detail List Popup Modal */}
      {listModalType && (
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
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: listModalType === 'available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: listModalType === 'available' ? '#10B981' : '#FF6B81',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {listModalType === 'available' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>
                    {listModalType === 'available' ? '전체 기간 예약 가능 코트 목록' : '취소표 내역 목록'}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    총 {modalSlotList.length}개 발견
                  </p>
                </div>
              </div>

              <button
                onClick={() => setListModalType(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* List Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
              {modalSlotList.length === 0 ? (
                <div style={{
                  padding: '24px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-color)'
                }}>
                  현재 {listModalType === 'available' ? '예약 가능한' : '발생한 취소표'} 슬롯이 없습니다. 🎾
                </div>
              ) : (
                modalSlotList.map(slot => (
                  <div
                    key={slot.id}
                    className="mobile-list-item"
                    style={{
                      background: listModalType === 'available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      border: `1px solid ${listModalType === 'available' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
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
                      onClick={() => {
                        onSlotClick(slot);
                        setListModalType(null);
                      }}
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
                onClick={() => setListModalType(null)}
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
