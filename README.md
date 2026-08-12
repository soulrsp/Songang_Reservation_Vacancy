# 🎾 대전 송강실내테니스장 실시간 예약 & 카카오톡(PlayMCP) 취소표 알리미

> 대전광역시 시설관리공단 **송강실내테니스장 (`https://www.djsiseol.or.kr/res/www/121`)**의 전체 코트 대관 가능 일정을 한눈에 리스트업하고, 예약을 취소한 빈자리(취소표)가 발생했을 때 **카카오톡(개인톡/단체톡), 디스코드, 데스크톱 브라우저 알림**으로 알려주는 100% 무료 호스팅 웹 에이전트입니다.

---

## 🌟 주요 기능 (Key Features)

1. **송강실내테니스장 전체 슬롯 실시간 리스트업**
   - 1번 코트, 2번 코트, 3번 코트, 4번 코트 (실내 하드코트) 06:00~22:00 타임슬롯 상태 시각화.
   - 날짜별/코트별/시간대별(오전/오후/야간) 검색 및 `예약 가능 슬롯만 보기` 필터링.
   - 회원 로그인 없이 누구나 공개 조회 가능한 데이터 연결.

2. **PlayMCP 카카오톡 알림 지원 (개인톡 & 단체톡)**
   - **개인톡 (나에게 보내기)**: 본인 카카오톡 계정으로 취소표 발생 시 1:1 메시지 즉시 수신.
   - **단체톡 / 채팅방 (클럽 공유)**: 카카오톡 채널 봇 / PlayMCP 웹후크를 통해 클럽 단톡방으로 메시지 자동 발송.

3. **100% 무료 호스팅 (GitHub Pages + GitHub Actions)**
   - **GitHub Pages**: 대시보드 웹 사이트 무료 호스팅 (`https://<username>.github.io/<repo>`).
   - **GitHub Actions Cron**: 브라우저 창을 닫아도 백그라운드에서 10분마다 자동 크롤링 및 카카오톡/디스코드 메시지 발송.

---

## 🚀 GitHub Pages 100% 무료 배포 순서

### 1단계: GitHub 레포지토리 생성 및 업로드
```bash
git init
git add .
git commit -m "Initial commit for Songgang Tennis Agent"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/SongangTennis_Reservation_Vacancy.git
git push -u origin main
```

### 2단계: GitHub Pages 활성화
1. GitHub 레포지토리 상단 **[Settings]** > **[Pages]** 메뉴 이동.
2. Build and deployment > Source를 **`GitHub Actions`** 또는 **`gh-pages branch`** 선택.
3. 배포 완료 후 제공되는 `https://<YOUR_USERNAME>.github.io/SongangTennis_Reservation_Vacancy` URL을 테니스 클럽 부원들과 공유하세요!

### 3단계: GitHub Actions 24시간 자동 알림 설정 (선택 사항)
1. 레포지토리 **[Settings]** > **[Secrets and variables]** > **[Actions]** 이동.
2. `DISCORD_WEBHOOK_URL` 및 `KAKAO_ACCESS_TOKEN` Secret 등록.
3. 24시간 365일 자동으로 10분마다 빈자리를 체크하고 카카오톡/디스코드로 알림이 발송됩니다.

---

## 💻 로컬 개발 서버 실행

```bash
# 종속성 설치
npm install

# 대시보드 실행
npm run dev

# 알림 서버 실행
npm run server
```
