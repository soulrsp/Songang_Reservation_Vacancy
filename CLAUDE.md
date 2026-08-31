# CLAUDE.md - 송강실내테니스장 예약알리미 개발 및 유지보수 가이드

이 문서는 AI 어시스턴트(Claude Code, Cursor, Antigravity 등) 및 개발자가 프로젝트 구조와 아키텍처, 작동 규칙을 즉시 이해하고 유지보수할 수 있도록 정리한 기술 명세서입니다.

---

## 📌 1. 프로젝트 개요 (Overview)
* **목적**: 대전시설관리공단 송강실내테니스장의 실시간 예약 가능 코트 현황을 제공하고, 취소표 발생 시 텔레그램으로 자동 알림을 발송하며, 매달 25일 아침 다음 달 대관 조기 오픈을 1초 내에 감지하는 초경량 풀스택 PWA 웹/배치 시스템.
* **배포 환경**:
  - **프론트엔드**: GitHub Pages (정적 호스팅 + PWA 모바일 앱)
  - **백엔드/크롤러**: GitHub Actions + 외부 Cron (`cron-job.org`) 트리거
  - **알림 채널**: Telegram Bot API (단일 개인톡 및 단체 그룹방 다중 발송 지원)

---

## 🏗️ 2. 핵심 아키텍처 (Architecture)

```
[사용자 스마트폰 / PC (PWA)]
  └─ src/App.jsx (React + Vite)
      ├─ src/services/api.js ➔ 대전시설공단 REST API 직접 호출 (다중 CORS 프록시 체인: cors.eu.org, allorigins 등)
      ├─ src/services/sound.js ➔ Web Audio API 내장 사이렌 경보음
      └─ 25일 08:55~09:05: 1초 초고속 조기 오픈 스나이퍼 모드 동작

[자동 감지 배치 (GitHub Actions)]
  └─ cron-job.org (1~5분 주기 POST workflow_dispatch)
      └─ .github/workflows/monitor.yml
          └─ server/index.js
              ├─ server/crawler.js ➔ 송강시설공단 API 호출 (Axios 경량화)
              ├─ server/diffEngine.js ➔ previousState.json 비교 및 reserved➔available 감지
              └─ server/notifier.js ➔ Telegram Bot API 메시지 전송
```

---

## 📂 3. 디렉토리 및 파일 역할 (File Structure)

```
├── .github/workflows/
│   ├── static.yml          # GitHub Pages 정적 빌드 및 배포 워크플로우
│   └── monitor.yml         # 취소표 감지 & 텔레그램 발송 배치 (GitHub Actions)
├── public/
│   ├── .nojekyll           # GitHub Pages 언더스코어 및 정적 자산 무시 방지
│   ├── manifest.json       # PWA 홈화면 앱 설치 메타데이터
│   ├── sw.js               # PWA 서비스 워커 (오프라인 캐싱)
│   ├── icon-192.png        # Android/모바일 앱 아이콘
│   └── icon-512.png        # 스플래시 스크린용 고해상도 아이콘
├── server/
│   ├── crawler.js          # 대전시설관리공단 REST API 크롤러 (Axios 기반)
│   ├── diffEngine.js       # 상태 비교 엔진 (이전 상태 캐시 및 신규 취소표 판별)
│   ├── notifier.js         # 텔레그램 봇 알림 발송 모듈 (다중 ID/그룹방 지원)
│   ├── index.js            # GitHub Actions 배치 실행 진입점 (25일 스나이퍼 루프 포함)
│   └── state/              # previousState.json (GitHub Actions Cache로 영속 유지)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # 상단 헤더, 시간 뱃지, 새로고침, 송강 예약 링크
│   │   └── CourtSchedule.jsx   # 예약 가능 코트 목록 및 모달 팝업
│   ├── services/
│   │   ├── api.js              # 프론트엔드용 API 클라이언트 (다중 CORS 프록시 + Concurrency 제어)
│   │   └── sound.js            # Web Audio API 내장 사이렌 경보음 유틸
│   ├── App.jsx             # 메인 앱 (5분 자동 새로고침, 25일 스나이퍼 배너/모달)
│   └── main.jsx            # React 엔트리포인트
├── package.json            # 경량 의존성 (axios, dotenv, lucide-react, react, vite)
└── vite.config.js          # Vite 빌드 & 로컬 개발용 API 프록시 설정
```

---

## ⚙️ 4. 주요 비즈니스 로직 및 규칙 (Business Logic)

### A. 날짜 계산 규칙 (`getTargetDates`)
1. **평소**: 오늘 ~ 이번 달 말일까지의 날짜를 모니터링.
2. **매달 25일 09:00 이후**: 다음 달 전체(1일 ~ 다음 달 말일)도 자동으로 모니터링 대상에 추가.

### B. 프론트엔드 실시간 CORS 프록시 체인 및 SWR 로컬 캐싱 (`src/services/api.js`)
* **SWR (Stale-While-Revalidate) 로컬 캐시**: 앱 실행 시 `localStorage`에 캐시된 코트 현황을 0.01초 만에 즉시 화면에 렌더링하고, 백그라운드에서 최신 데이터를 갱신하여 빈 화면/0개 깜빡임 완벽 방지.
* **지능형 재시도 및 다중 프록시 풀**:
  1. 로컬 Vite 프록시 (`/djsiseol-api/...`)
  2. `https://cors.eu.org/` (초고속 검증 프록시)
  3. `https://api.allorigins.win/raw?url=...` (백업)
  4. `https://api.codetabs.com/v1/proxy?quest=...` (백업)
* **동시성 제어 (`runConcurrently`)**: 동시 8개 병렬 큐를 적용하여 31~37일치(120+개 요청)를 약 5~6초 내에 브라우저 과부하 없이 완벽 수집.
* **오류 방어**: 네트워크 오류 발생 시에도 기존 캐시 데이터를 유지하여 화면이 비워지는 현상 차단.

### C. 상태 변화 감지 규칙 (`diffEngine.js`)
* 이전 상태(`prevStatus === 'reserved'` 또는 `undefined`) ➔ 현재 상태(`isAvailableNow === true`) 일 때만 **취소표/빈자리 발생**으로 판정.
* 이미 `available` 상태였던 슬롯은 중복 알림을 방지하기 위해 발송 제외.
* 슬롯 상태는 `server/state/previousState.json`에 저장되며 GitHub Actions 캐시(`actions/cache`)를 통해 실행 간 영속 유지.

### D. 25일 조기 오픈 1초 스나이퍼 (`08:55 ~ 09:05 KST`)
* **목적**: 25일 09:00 정각 전 조기 오픈(예: 08:59:20)을 1초 이내에 포착.
* **동작**:
  - `server/index.js`: 08:55~09:05 사이에 실행되면 최대 10분간 1초 단위로 다음 달 1일 슬롯을 폴링하다가 열리는 순간 텔레그램 초긴급 알림 발송.
  - `src/App.jsx`: 25일 08:55~09:05에 웹/PWA 접속 시 1초 감지기가 자동 활성화되어 오픈 감지 즉시 비프음 사이렌 🚨 + 거대 1초 이동 팝업 모달 노출.

### E. 텔레그램 다중 수신 (`notifier.js`)
* `TELEGRAM_CHAT_ID` 환경변수에 쉼표(`,`)로 여러 ID를 적으면 개인톡과 그룹방 모두에 동시 발송:
  - 개인: `1744290092`
  - 그룹방: `-5351894139`
  - 동시 수신: `1744290092,-5351894139`

---

## 🔐 5. GitHub Secrets 설정

| Secret 이름 | 설명 | 예시 |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather에게 발급받은 텔레그램 봇 토큰 | `7123456789:AAFx...` |
| `TELEGRAM_CHAT_ID` | 알림을 수신할 개인 Chat ID 또는 그룹방 ID | `1744290092` 또는 `-5351894139` |

---

## 🚀 6. GitHub Push 및 환경 설정 가이드

### A. 회사 PC / 보안 환경에서의 Git 설정
* **자격 증명 영속화**: Windows Credential Manager(GCM)를 통해 `github.com` 계정(`soulrsp`)이 전역 등록되어 있어, 브라우저 팝업 로그인 없이 백그라운드 푸시가 가능합니다.
* **전역 안전 디렉토리 설정**: 소유권/보안 경고 방지를 위해 `safe.directory="*"`가 전역 구성되어 있습니다.
  ```powershell
  git config --global --add safe.directory "*"
  ```
* **상위 폴더(`C:\Users\ADMIN\Desktop\Coding\Antigravity`) 내 모든 프로젝트**:
  - 하위의 어떤 프로젝트 폴더를 새로 생성하더라도 추가 로그인 없이 즉시 `git push`가 가능합니다.
  - Antigravity AI가 코드를 작성한 후 직접 커밋 및 푸시를 수행할 수 있습니다.

### B. 표준 Git Push 명령어
```powershell
cd "c:\Users\ADMIN\Desktop\Coding\Antigravity\SongangTennis_Reservation_Vacancy"
git add -A
git commit -m "feat: your commit message"
git push origin main
```

---

## 🛠️ 7. 개발 및 실행 명령어

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행 (Vite: http://localhost:5173)
npm run dev

# 프로덕션 빌드 (dist/ 생성)
npm run build

# 로컬에서 크롤러 1회 수동 테스트
node server/index.js
```
