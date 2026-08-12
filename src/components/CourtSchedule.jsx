import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Filter, AlertTriangle, ExternalLink, Zap } from 'lucide-react';

export default function CourtSchedule({ 
  selectedDate, 
  onDateChange, 
  scheduleData, 
  onSlotClick 
}) {
  const [selectedCourt, setSelectedCourt] = useState('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Generate date shortcuts (Today, Tomorrow, Day after)
  const today = new Date();
  const dateOptions = [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    let label = `${mm}/${dd}`;
    if (offset === 0) label = `오늘 (${mm}/${dd})`;
    else if (offset === 1) label = `내일 (${mm}/${dd})`;
    
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[d.getDay()];

    return { dateStr, label: `${label} (${dayName})` };
  });

  const { courts = [], timeSlots = [], slots = [] } = scheduleData || {};

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    if (selectedCourt !== 'ALL' && slot.courtId !== selectedCourt) return false;
    
    if (onlyAvailable && slot.status === 'reserved') return false;
    
    const slotHour = parseInt(slot.timeId.replace('t', ''));
    if (selectedTimeRange === 'MORNING' && (slotHour < 6 || slotHour >= 12)) return false;
    if (selectedTimeRange === 'AFTERNOON' && (slotHour < 12 || slotHour >= 18)) return false;
    if (selectedTimeRange === 'NIGHT' && (slotHour < 18 || slotHour > 22)) return false;
    
    return true;
  });

  // Calculate statistics
  const totalSlotsCount = slots.length;
  const availableSlotsCount = slots.filter(s => s.status === 'available').length;
  const cancelledSlotsCount = slots.filter(s => s.status === 'cancelled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Date Switcher & Summary Stats Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Date Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <Calendar size={18} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginRight: '4px' }} />
            {dateOptions.map(opt => {
              const isSelected = selectedDate === opt.dateStr;
              return (
                <button
                  key={opt.dateStr}
                  onClick={() => onDateChange(opt.dateStr)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: isSelected ? '700' : '500',
                    background: isSelected ? 'var(--primary-accent)' : 'rgba(30, 41, 59, 0.6)',
                    color: isSelected ? '#0B0F17' : 'var(--text-muted)',
                    border: isSelected ? 'none' : '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 0 15px rgba(204, 255, 0, 0.3)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Direct Date Picker */}
          <div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#F8FAFC',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px'
              }}
            />
          </div>

        </div>

        {/* Stats Banner Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px', 
          marginTop: '20px' 
        }}>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>예약 가능 슬롯</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>
                {availableSlotsCount}개
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#FF6B81',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>방금 생성된 취소표</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B81' }}>
                {cancelledSlotsCount}개
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>전체 타임 슬롯</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#F8FAFC' }}>
                {totalSlotsCount}개
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
              <Filter size={15} />
              <span>조건 필터:</span>
            </div>

            {/* Court Filter */}
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#F8FAFC',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px'
              }}
            >
              <option value="ALL">전체 코트 (A, B, C)</option>
              <option value="court-A">A 코트 (상단 하드)</option>
              <option value="court-B">B 코트 (중단 하드)</option>
              <option value="court-C">C 코트 (하단 잔디)</option>
            </select>

            {/* Time Filter */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#F8FAFC',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px'
              }}
            >
              <option value="ALL">전체 시간대 (06:00 ~ 22:00)</option>
              <option value="MORNING">오전 (06:00 ~ 12:00)</option>
              <option value="AFTERNOON">오후 (12:00 ~ 18:00)</option>
              <option value="NIGHT">야간 (18:00 ~ 22:00)</option>
            </select>
          </div>

          {/* Toggle Available Only */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            color: onlyAvailable ? '#10B981' : 'var(--text-muted)',
            fontWeight: '600',
            userSelect: 'none'
          }}>
            <input 
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{ accentColor: '#10B981', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>예약 가능한 슬롯만 보기</span>
          </label>

        </div>
      </div>

      {/* Court Schedule Matrix / Cards View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {courts.filter(c => selectedCourt === 'ALL' || c.id === selectedCourt).map(court => {
          const courtSlots = filteredSlots.filter(s => s.courtId === court.id);
          
          return (
            <div key={court.id} className="glass-panel" style={{ padding: '20px' }}>
              
              {/* Court Header */}
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🎾</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC' }}>
                    {court.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-muted)'
                  }}>
                    {court.surface}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  예약 가능: <strong style={{ color: '#10B981' }}>{courtSlots.filter(s => s.status !== 'reserved').length}</strong> / {courtSlots.length}개
                </div>
              </div>

              {/* Time Slot Cards Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
                gap: '12px' 
              }}>
                {courtSlots.map(slot => {
                  const isAvailable = slot.status === 'available';
                  const isCancelled = slot.status === 'cancelled';
                  const isReserved = slot.status === 'reserved';

                  let cardBg = 'rgba(30, 41, 59, 0.4)';
                  let borderColor = 'var(--border-color)';
                  let statusText = '예약 완료';
                  let statusColor = 'var(--text-muted)';

                  if (isAvailable) {
                    cardBg = 'rgba(16, 185, 129, 0.12)';
                    borderColor = 'rgba(16, 185, 129, 0.35)';
                    statusText = '예약 가능';
                    statusColor = '#10B981';
                  } else if (isCancelled) {
                    cardBg = 'rgba(244, 63, 94, 0.2)';
                    borderColor = 'rgba(244, 63, 94, 0.6)';
                    statusText = '방금 취소됨!';
                    statusColor = '#FF6B81';
                  }

                  return (
                    <div
                      key={slot.id}
                      onClick={() => !isReserved && onSlotClick(slot)}
                      className={isCancelled ? 'cancelled-flash' : ''}
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        minHeight: '84px',
                        cursor: isReserved ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isCancelled ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none'
                      }}
                      onMouseOver={(e) => {
                        if (!isReserved) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = isAvailable ? '0 4px 20px rgba(16, 185, 129, 0.25)' : '0 4px 20px rgba(244, 63, 94, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isCancelled ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                          {slot.timeLabel}
                        </div>
                        {isCancelled && <span style={{ fontSize: '12px' }}>✨</span>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: statusColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isAvailable && <CheckCircle2 size={12} />}
                          {isCancelled && <Zap size={12} />}
                          {statusText}
                        </span>

                        {!isReserved && (
                          <span style={{
                            fontSize: '11px',
                            color: statusColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: '600'
                          }}>
                            예약 <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
