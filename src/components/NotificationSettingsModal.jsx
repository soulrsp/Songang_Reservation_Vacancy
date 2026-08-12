import React, { useState } from 'react';
import { X, Bell, Volume2, Send, MessageCircle, ShieldCheck, Check, Info, Clock, ExternalLink } from 'lucide-react';
import { testWebhook, testKakaoNotification } from '../services/api';

export default function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings 
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState(settings);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestKakao = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testKakaoNotification(form.kakaoAccessToken, form.kakaoRecipientType);
    setIsTesting(false);
    setTestResult(result);
  };

  const handleTestDiscord = async () => {
    if (!form.discordWebhookUrl) {
      setTestResult({ success: false, message: '디스코드 Webhook URL을 입력해주세요.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const result = await testWebhook(form.discordWebhookUrl, 'discord');
    setIsTesting(false);
    setTestResult(result);
  };

  const handleRequestPush = () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setForm(prev => ({ ...prev, webPushEnabled: true }));
        new Notification('🎾 송강실내테니스장 알림', {
          body: '브라우저 알림 수신 동의가 완료되었습니다!'
        });
      } else {
        alert('알림 권한이 거부되었습니다.');
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  return (
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
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(254, 229, 0, 0.15)',
            color: '#FEE500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC' }}>
              카카오톡(PlayMCP) & 다중 알림 설정
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              송강실내테니스장 취소표 발생 시 알림을 수신할 채널을 설정하세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: PlayMCP KakaoTalk Integration */}
          <div style={{
            background: 'rgba(254, 229, 0, 0.08)',
            border: '1px solid rgba(254, 229, 0, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#FEE500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={16} />
              1. PlayMCP 카카오톡 알림 (개인톡 & 단체톡)
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              카카오톡 나에게 보내기(개인톡) 또는 PlayMCP 카카오톡 채널(단체톡)을 통해 취소표 메시지를 실시간 수신합니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Recipient Mode */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, kakaoRecipientType: 'memo' }))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: form.kakaoRecipientType === 'memo' ? '700' : '500',
                    background: form.kakaoRecipientType === 'memo' ? '#FEE500' : 'rgba(30, 41, 59, 0.6)',
                    color: form.kakaoRecipientType === 'memo' ? '#000' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  💬 카카오톡 개인톡 (나에게 보내기)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, kakaoRecipientType: 'channel' }))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: form.kakaoRecipientType === 'channel' ? '700' : '500',
                    background: form.kakaoRecipientType === 'channel' ? '#FEE500' : 'rgba(30, 41, 59, 0.6)',
                    color: form.kakaoRecipientType === 'channel' ? '#000' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  📢 카카오톡 단체톡 (채널 봇)
                </button>
              </div>

              {/* Token or Key Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder="PlayMCP 키 또는 카카오 액세스 토큰 입력 (선택사항)"
                  value={form.kakaoAccessToken || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, kakaoAccessToken: e.target.value }))}
                  style={{
                    flex: 1,
                    background: 'rgba(11, 15, 23, 0.9)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestKakao}
                  disabled={isTesting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FEE500',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '800',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isTesting ? '발송 중...' : '카톡 테스트'}
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Discord Webhook Integration */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={16} style={{ color: '#5865F2' }} />
              2. 디스코드 단톡방 연동 (Discord Webhook)
            </h4>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={form.discordWebhookUrl || ''}
                onChange={(e) => setForm(prev => ({ ...prev, discordWebhookUrl: e.target.value }))}
                style={{
                  flex: 1,
                  background: 'rgba(11, 15, 23, 0.9)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#F8FAFC',
                  fontSize: '12px'
                }}
              />
              <button
                type="button"
                onClick={handleTestDiscord}
                disabled={isTesting}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#5865F2',
                  color: '#FFF',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}
              >
                디스코드 테스트
              </button>
            </div>
          </div>

          {/* Section 3: Browser Sound & Desktop Push */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} style={{ color: 'var(--primary-accent)' }} />
              3. 웹 브라우저 푸시 & 사운드 효과음
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                <span>데스크톱 브라우저 푸시 알림 (Web Push)</span>
                <input 
                  type="checkbox"
                  checked={form.webPushEnabled}
                  onChange={(e) => {
                    if (e.target.checked) handleRequestPush();
                    else setForm(prev => ({ ...prev, webPushEnabled: false }));
                  }}
                  style={{ accentColor: '#CCFF00', width: '18px', height: '18px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                <span>취소표 감지 시 테니스 핑 효과음 재생 (Sound Chime)</span>
                <input 
                  type="checkbox"
                  checked={form.soundEnabled}
                  onChange={(e) => setForm(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  style={{ accentColor: '#CCFF00', width: '18px', height: '18px' }}
                />
              </label>
            </div>
          </div>

          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: testResult.success ? '#10B981' : '#FF6B81',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}>
              {testResult.message}
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-accent)',
                color: '#0B0F17',
                fontSize: '13px',
                fontWeight: '800',
                boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)'
              }}
            >
              설정 저장하기
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
