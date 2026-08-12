import React, { useState } from 'react';
import { X, Bell, Volume2, Send, MessageCircle, Check } from 'lucide-react';

export default function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings 
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState(settings);
  const [testResult, setTestResult] = useState(null);
  const [testingChannel, setTestingChannel] = useState(null);

  /* ── Discord Test ── */
  const handleTestDiscord = async () => {
    if (!form.discordWebhookUrl) {
      setTestResult({ success: false, message: '디스코드 Webhook URL을 입력해주세요.' });
      return;
    }
    setTestingChannel('discord');
    setTestResult(null);
    try {
      const payload = {
        embeds: [{
          title: '🎾 [송강실내테니스장] 알림 테스트 성공!',
          description: '취소표 알림 에이전트가 디스코드 채널에 정상 연동되었습니다.',
          color: 0xCCFF00,
          fields: [
            { name: '테스트 시각', value: new Date().toLocaleString('ko-KR'), inline: true },
            { name: '상태', value: '✅ 정상 작동', inline: true }
          ],
          footer: { text: '대전시설관리공단 송강실내테니스장 알림 에이전트' }
        }]
      };
      const res = await fetch(form.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok || res.status === 204) {
        setTestResult({ success: true, message: '✅ 디스코드 채널로 테스트 메시지를 발송했습니다!' });
      } else {
        setTestResult({ success: false, message: `Webhook 오류 (status: ${res.status}). URL을 확인해주세요.` });
      }
    } catch (err) {
      setTestResult({ success: false, message: '디스코드 발송 실패: ' + err.message });
    }
    setTestingChannel(null);
  };

  /* ── Telegram Test ── */
  const handleTestTelegram = async () => {
    if (!form.telegramBotToken || !form.telegramChatId) {
      setTestResult({ success: false, message: '텔레그램 봇 토큰과 Chat ID를 모두 입력해주세요.' });
      return;
    }
    setTestingChannel('telegram');
    setTestResult(null);
    try {
      const text = `🎾 *[송강실내테니스장] 알림 테스트 성공!*\n\n텔레그램 알림 에이전트가 정상 연동되었습니다.\n테스트 시각: ${new Date().toLocaleString('ko-KR')}`;
      const res = await fetch(
        `https://api.telegram.org/bot${form.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: form.telegramChatId, text, parse_mode: 'Markdown' })
        }
      );
      const data = await res.json();
      if (data.ok) {
        setTestResult({ success: true, message: '✅ 텔레그램으로 테스트 메시지를 발송했습니다!' });
      } else {
        setTestResult({ success: false, message: `텔레그램 오류: ${data.description}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: '텔레그램 발송 실패: ' + err.message });
    }
    setTestingChannel(null);
  };

  /* ── Web Push ── */
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

  /* ──────────────── Shared Styles ──────────────── */
  const sectionCard = (accentColor) => ({
    background: `rgba(${accentColor}, 0.07)`,
    border: `1px solid rgba(${accentColor}, 0.28)`,
    borderRadius: 'var(--radius-sm)',
    padding: '18px'
  });

  const inputStyle = {
    flex: 1,
    background: 'rgba(11, 15, 23, 0.9)',
    border: '1px solid var(--border-color)',
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    color: '#F8FAFC',
    fontSize: '12px',
    outline: 'none',
    width: '100%'
  };

  const btnTest = (bg, color = '#FFF') => ({
    padding: '9px 16px',
    borderRadius: 'var(--radius-sm)',
    background: bg,
    color,
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0
  });

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
        maxWidth: '600px',
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
            top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.1)',
            color: 'var(--text-muted)',
            width: '32px', height: '32px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'rgba(204, 255, 0, 0.15)',
            color: '#CCFF00',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bell size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC' }}>
              알림 채널 설정
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              취소표 발생 시 알림을 수신할 채널을 설정하고 테스트하세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* ── Section 1: Discord ── */}
          <div style={sectionCard('88, 101, 242')}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#7289DA', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} />
              1. 디스코드 알림 (Discord Webhook)
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Discord 채널 설정 → 연동 → 웹후크 생성 후 URL을 붙여넣으세요. 만료 없이 영구 사용 가능합니다.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={form.discordWebhookUrl || ''}
                onChange={(e) => setForm(prev => ({ ...prev, discordWebhookUrl: e.target.value }))}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={handleTestDiscord}
                disabled={testingChannel === 'discord'}
                style={btnTest('#5865F2')}
              >
                {testingChannel === 'discord' ? '발송 중…' : '테스트'}
              </button>
            </div>
          </div>

          {/* ── Section 2: Telegram ── */}
          <div style={sectionCard('0, 136, 204')}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#29B6F6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={15} />
              2. 텔레그램 알림 (Telegram Bot)
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              텔레그램에서 <b>@BotFather</b>로 봇을 생성하고 토큰을 받으세요.
              Chat ID는 <b>@userinfobot</b>에서 확인하거나 본인 텔레그램 ID를 입력하세요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="봇 토큰 (예: 7123456789:AAF...)"
                value={form.telegramBotToken || ''}
                onChange={(e) => setForm(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Chat ID (예: 123456789 또는 -100123456789)"
                  value={form.telegramChatId || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={testingChannel === 'telegram'}
                  style={btnTest('#29B6F6', '#000')}
                >
                  {testingChannel === 'telegram' ? '발송 중…' : '테스트'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Section 3: Browser Push & Sound ── */}
          <div style={sectionCard('204, 255, 0')}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#CCFF00', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={15} />
              3. 브라우저 푸시 &amp; 효과음
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          {/* Test Result Banner */}
          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: testResult.success ? '#10B981' : '#FF6B81',
              border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
            }}>
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
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
                boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              설정 저장
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
