import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Filter, AlertTriangle, ExternalLink, Zap, X, ChevronRight, ChevronLeft } from 'lucide-react';

export default function CourtSchedule({ 
  selectedDate, 
  onDateChange, 
  scheduleData, 
  onSlotClick 
}) {
  const [selectedCourt, setSelectedCourt] = useState('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Detail List Modal State ('available' | 'cancelled' | null)
  const [listModalType, setListModalType] = useState(null);

  // Current viewed month state (Year, Month index: 0-11)
  const currentDateObj = new Date(selectedDate || Date.now());
  const [currentYear, setCurrentYear] = useState(currentDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDateObj.getMonth()); // 0-indexed

  // Generate all days for the entire month (1st to 31st)
  const daysInMonth = [];
  const totalDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= totalDaysCount; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[d.getDay()];

    const todayStr = new Date().toISOString().split('T')[0];
    let label = `${parseInt(mm)}/${dd} (${dayName})`;
    if (dateStr === todayStr) {
      label = `오늘 (${parseInt(mm)}/${dd})`;
    }

    daysInMonth.push({ dateStr, label, day, isToday: dateStr === todayStr });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

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
  const availableSlotsList = slots.filter(s => s.status === 'available');
  const cancelledSlotsList = slots.filter(s => s.status === 'cancelled');

  const modalSlotList = listModalType === 'available' ? availableSlotsList : cancelledSlotsList;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Date Switcher (Full Month 1st ~ 31st Pill Bar) */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Month Header Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(204, 255, 0, 0.15)',
                color: 'var(--primary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC' }}>
                  {currentYear}년 {currentMonth + 1}월 전체 날짜 (1일 ~ {totalDaysCount}일)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  월간 전체 날짜를 선택하여 실시간 대관 현황을 확인하세요.
                </p>
              </div>
            </div>

            {/* Month Nav Buttons & Direct Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={14} />
                <span>이전달</span>
              </button>

              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-accent)', padding: '0 4px' }}>
                {currentMonth + 1}월
              </span>

              <button
                onClick={handleNextMonth}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>다음달</span>
                <ChevronRight size={14} />
              </button>

              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => {
                  onDateChange(e.target.value);
                  const d = new Date(e.target.value);
                  setCurrentYear(d.getFullYear());
                  setCurrentMonth(d.getMonth());
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  marginLeft: '6px'
                }}
              />
            </div>

          </div>

          {/* Horizontally Scrollable Full Month Days (1 ~ 31) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            overflowX: 'auto', 
            padding: '4px 0 8px 0',
            scrollbarWidth: 'thin'
          }}>
            {daysInMonth.map(opt => {
              const isSelected = selectedDate === opt.dateStr;
              return (
                <button
                  key={opt.dateStr}
                  onClick={() => onDateChange(opt.dateStr)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: isSelected ? '800' : '500',
                    background: isSelected 
                      ? 'var(--primary-accent)' 
                      : opt.isToday 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(30, 41, 59, 0.6)',
                    color: isSelected 
                      ? '#0B0F17' 
                      : opt.isToday 
                        ? '#10B981' 
                        : 'var(--text-muted)',
                    border: isSelected 
                      ? 'none' 
                      : opt.isToday 
                        ? '1px solid rgba(16, 185, 129, 0.4)' 
                        : '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 0 15px rgba(204, 255, 0, 0.3)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Stats Banner Cards (Clickable Interactive Buttons) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px', 
          marginTop: '20px' 
        }}>
          
          {/* Available Slots Card Button */}
          <div 
            onClick={() => setListModalType('available')}
            title="클릭하면 예약 가능한 슬롯의 상세 목록 팝업이 뜹니다."
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 18px',
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
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>예약 가능 슬롯 (클릭시 목록)</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>
                  {availableSlotsList.length}개
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#10B981' }} />
          </div>

          {/* Cancelled Slots Card Button */}
          <div 
            onClick={() => setListModalType('cancelled')}
            title="클릭하면 방금 발생한 취소표의 상세 목록 팝업이 뜹니다."
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 18px',
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
                justifyContent: 'center'
              }}>
                <Zap size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>방금 생성된 취소표 (클릭시 목록)</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B81' }}>
                  {cancelledSlotsList.length}개
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#FF6B81' }} />
          </div>

          {/* Total Slots Card */}
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
              <option value="ALL">전체 코트 (1~4번 코트)</option>
              <option value="songgang-1">1번 코트 (실내)</option>
              <option value="songgang-2">2번 코트 (실내)</option>
              <option value="songgang-3">3번 코트 (실내)</option>
              <option value="songgang-4">4번 코트 (실내)</option>
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

      {/* Detail List Popup Modal */}
      {listModalType && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel glow-accent" style={{
            width: '100%',
            maxWidth: '540px',
            maxHeight: '80vh',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: listModalType === 'available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: listModalType === 'available' ? '#10B981' : '#FF6B81',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {listModalType === 'available' ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC' }}>
                    {listModalType === 'available' ? '예약 가능 슬롯 목록' : '방금 생성된 취소표 목록'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedDate} 기준 (총 {modalSlotList.length}개 발견)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setListModalType(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px' }}>
              {modalSlotList.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-color)'
                }}>
                  현재 {listModalType === 'available' ? '예약 가능한' : '방금 발생한 취소표'} 슬롯이 없습니다. 🎾
                </div>
              ) : (
                modalSlotList.map(slot => (
                  <div
                    key={slot.id}
                    style={{
                      background: listModalType === 'available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      border: `1px solid ${listModalType === 'available' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📅 {slot.date || selectedDate}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--primary-accent)' }}>{slot.courtName}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏰ 시간: <strong>{slot.timeLabel}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSlotClick(slot);
                        setListModalType(null);
                      }}
                      style={{
                        padding: '8px 14px',
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
