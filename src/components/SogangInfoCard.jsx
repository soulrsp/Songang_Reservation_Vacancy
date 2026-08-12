import React from 'react';
import { Info, MapPin, Clock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

export default function SogangInfoCard() {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(204, 255, 0, 0.15)',
          color: 'var(--primary-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Info size={18} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC' }}>
          서강대 테니스장 이용 & 예약 꿀팁
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>예약 오픈 시각:</strong> 매일 밤 <span style={{ color: 'var(--primary-accent)', fontWeight: '700' }}>00:00 (자정)</span>에 7일 후 날짜 오픈.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertCircle size={14} style={{ color: '#FF6B81', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>취소표 집중 발생 시각:</strong> 이용 당일 2~4시간 전 & 밤 22:00~24:00 사이에 가장 많은 취소표가 발생합니다.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <MapPin size={14} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>코트 구성:</strong> A/B코트 (아크릴 하드코트), C코트 (인조잔디).
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldCheck size={14} style={{ color: '#38BDF8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>이용수칙:</strong> 테니스화 필수 착용, 1회 최대 2시간 예약 제한.
          </div>
        </div>

      </div>

      <a
        href="https://sport.sogang.ac.kr"
        target="_blank"
        rel="noreferrer"
        style={{
          marginTop: '6px',
          padding: '10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid var(--border-color)',
          color: '#F8FAFC',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          textDecoration: 'none'
        }}
      >
        <span>서강대학교 체육시설 예약 바로가기</span>
        <ExternalLink size={13} />
      </a>

    </div>
  );
}
