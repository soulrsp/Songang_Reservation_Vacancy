import React from 'react';
import { Bell, RefreshCw, ExternalLink } from 'lucide-react';

export default function Navbar({ 
  isMonitoring, 
  lastRefreshed, 
  onRefresh, 
  onOpenSettings, 
  isRefreshing 
}) {
  return (
    <header className="glass-panel glow-accent mobile-header-container" style={{ margin: '16px 20px 24px 20px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #CCFF00 0%, #10B981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 0 20px rgba(204, 255, 0, 0.4)',
            flexShrink: 0
          }}>
            🎾
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
              송강실내테니스장 예약알리미
            </h1>
            <span style={{
              fontSize: '12px',
              color: '#10B981',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <span className="live-indicator"></span>
              {lastRefreshed ? lastRefreshed.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '초기화'}
            </span>
          </div>
        </div>

        {/* Action Buttons — always one horizontal row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'nowrap'
        }}>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#F8FAFC',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>새로고침</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-accent)',
              color: '#0B0F17',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={14} />
            <span>알림 설정</span>
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
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>송강 예약 이동</span>
            <ExternalLink size={13} />
          </a>

        </div>

      </div>
    </header>
  );
}
