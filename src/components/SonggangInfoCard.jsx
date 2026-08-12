import React from 'react';
import { Info, MapPin, Clock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

export default function SonggangInfoCard() {
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
          송강실내테니스장 예약 안내
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>조회 구조:</strong> 회원 로그인 필요 없이 <span style={{ color: 'var(--primary-accent)', fontWeight: '700' }}>실시간 대관 현황 즉시 공개 조회 가능</span>.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertCircle size={14} style={{ color: '#FF6B81', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>취소표 집중 시간대:</strong> 이용일 2~3일 전 및 당일 취소 건 발생 시 카카오톡/디스코드 알림이 수신됩니다.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <MapPin size={14} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>코트 구성:</strong> 1~4번 실내 하드 테니스 코트 (사계절 이용 가능).
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldCheck size={14} style={{ color: '#38BDF8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#F8FAFC' }}>운영 기관:</strong> 대전광역시 시설관리공단 (온라인 대관 예약).
          </div>
        </div>

      </div>

      <a
        href="https://www.djsiseol.or.kr/res/www/121"
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
        <span>대전시설관리공단 송강실내테니스장 예약 바로가기</span>
        <ExternalLink size={13} />
      </a>

    </div>
  );
}
