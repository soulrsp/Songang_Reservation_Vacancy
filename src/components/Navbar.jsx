import React from 'react';
import { Activity, Bell, RefreshCw, Sparkles, ExternalLink, MessageCircle } from 'lucide-react';

export default function Navbar({ 
  isMonitoring, 
  lastRefreshed, 
  onRefresh, 
  onOpenSettings, 
  onSimulateCancellation,
  isRefreshing 
}) {
  return (
    <header className="glass-panel glow-accent" style={{ margin: '16px 20px 24px 20px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 20px rgba(204, 255, 0, 0.4)'
          }}>
            🎾
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
                송강실내테니스장 예약알리미
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(204, 255, 0, 0.15)',
                color: '#CCFF00',
                border: '1px solid rgba(204, 255, 0, 0.3)'
              }}>
                PlayMCP Kakao Live
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              대전시설관리공단 송강실내테니스장 예약 현황 & 카카오톡/디스코드 취소표 감지
            </p>
          </div>
        </div>

        {/* Live Status Indicator & Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Live Agent Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '13px',
            color: '#10B981',
            fontWeight: '600'
          }}>
            <span className="live-indicator"></span>
            <span>송강 테니스 감지 중</span>
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>
              ({lastRefreshed ? lastRefreshed.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '초기화 중'})
            </span>
          </div>

          {/* Manual Refresh Button */}
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#F8FAFC',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid var(--border-color)'
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>새로고침</span>
          </button>

          {/* Simulation Trigger (Test Cancelled Slot) */}
          <button
            onClick={onSimulateCancellation}
            title="취소표가 발생했을 때 카카오톡/디스코드 알림이 제대로 날아가는지 테스트합니다."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.3) 100%)',
              color: '#FF6B81',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid rgba(244, 63, 94, 0.4)'
            }}
          >
            <Sparkles size={15} />
            <span>취소표 알림 테스트</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-accent)',
              color: '#0B0F17',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)'
            }}
          >
            <MessageCircle size={15} />
            <span>카톡/알림 설정</span>
          </button>

          {/* Direct Songgang Reservation Link Button */}
          <a
            href="https://www.djsiseol.or.kr/res/www/121"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              border: '1px solid var(--border-color)'
            }}
          >
            <span>송강 예약 사이트</span>
            <ExternalLink size={13} />
          </a>

        </div>

      </div>
    </header>
  );
}
