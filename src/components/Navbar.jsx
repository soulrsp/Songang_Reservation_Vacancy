import React from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

export default function Navbar({ lastRefreshed, onRefresh, isRefreshing }) {
  return (
    <header className="glass-panel glow-accent mobile-header-container" style={{ margin: '16px 20px 24px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>

        {/* 타이틀 및 갱신 시각 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', boxShadow: '0 0 20px rgba(204, 255, 0, 0.4)',
            flexShrink: 0
          }}>🎾</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
              송강실내테니스장 예약알리미
            </h1>
            {lastRefreshed && (
              <span style={{
                fontSize: '12px', color: '#10B981', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '3px 10px', borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <span className="live-indicator" />
                <span>{lastRefreshed.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 갱신</span>
              </span>
            )}
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="mobile-nav-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* 새로고침 버튼 */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', borderRadius: 'var(--radius-sm)',
              background: isRefreshing ? 'rgba(204, 255, 0, 0.15)' : 'rgba(30, 41, 59, 0.85)',
              color: isRefreshing ? '#CCFF00' : '#F8FAFC',
              fontSize: '13px', fontWeight: '700',
              border: isRefreshing ? '1px solid #CCFF00' : '1px solid var(--border-color)',
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isRefreshing ? '0 0 15px rgba(204, 255, 0, 0.3)' : 'none',
              userSelect: 'none'
            }}
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'animate-spin' : ''}
              style={{
                color: isRefreshing ? '#CCFF00' : '#94A3B8',
                transition: 'transform 0.2s ease'
              }}
            />
            <span>{isRefreshing ? '실시간 조회 중...' : '새로고침'}</span>
          </button>

          {/* 공단 예약 링크 */}
          <a
            href="https://www.djsiseol.or.kr/res/www/121"
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-accent)', color: '#0B0F17',
              fontSize: '13px', fontWeight: '800',
              textDecoration: 'none',
              boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)',
              userSelect: 'none'
            }}
          >
            <span>송강 예약 바로가기</span>
            <ExternalLink size={13} />
          </a>

        </div>

      </div>
    </header>
  );
}
