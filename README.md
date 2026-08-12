# 🎾 대전 송강실내테니스장 실시간 3분 취소표 알리미 (Public 100% 무료)

> 대전광역시 시설관리공단 **송강실내테니스장 (`https://www.djsiseol.or.kr/res/www/121`)**의 전체 코트 대관 가능 일정을 한눈에 리스트업하고, 예약을 취소한 빈자리(취소표)가 발생했을 때 **카카오톡(개인톡/단체톡), 디스코드, 데스크톱 브라우저 알림**으로 알려주는 100% 무료 호스팅 웹 에이전트입니다.

---

## 🌟 주요 특징

1. **Public 레포지토리 전용 100% 무제한 3분 간격 감지**
   - Public(공개) 레포지토리는 GitHub Actions 모니터링 시간이 **100% 무제한 0원**입니다.
   - 한국시간 기준 **06:00 ~ 24:00 매 3분 마다** 자동 감지 및 카카오톡/디스코드 즉시 발송.

2. **송강실내테니스장 전체 4개 실내 코트 리스트업**
   - 1번 코트, 2번 코트, 3번 코트, 4번 코트 (06:00 ~ 22:00) 실시간 상태 시각화.
   - 비회원 공개 조회 방식 파싱.

3. **PlayMCP 카카오톡 알림 지원 (개인톡 & 단체톡)**
   - **개인톡 (나에게 보내기)**: 1:1 메시지 즉시 수신.
   - **단체톡 / 채팅방 (클럽 공유)**: 카카오톡 채널 봇 / PlayMCP 웹후크를 통해 클럽 단톡방 메시지 자동 발송.

---

## 🚀 GitHub Pages 3분 배포 가이드

### 1단계: GitHub 레포지토리를 `Public(공개)`으로 업로드
```bash
git init
git add .
git commit -m "Public 3-min Songgang Tennis Vacancy Agent"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/SongangTennis_Reservation_Vacancy.git
git push -u origin main
```

### 2단계: GitHub Pages 웹사이트 생성
1. GitHub 레포지토리 **[Settings]** > **[Pages]** 메뉴 이동.
2. Source를 **`GitHub Actions`**로 설정.
3. 생성된 `https://<YOUR_USERNAME>.github.io/SongangTennis_Reservation_Vacancy` URL을 동아리원들에게 공유!

### 3단계: 카카오톡/디스코드 Secrets 등록
1. 레포지토리 **[Settings]** > **[Secrets and variables]** > **[Actions]** 이동.
2. `DISCORD_WEBHOOK_URL` 및 `KAKAO_ACCESS_TOKEN` Secret 등록.
