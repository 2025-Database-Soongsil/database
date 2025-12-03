# Baby Prep (예비맘을 위한 임신 준비 가이드)

**Baby Prep**은 임신을 준비하는 예비 엄마들을 위한 올인원 관리 서비스입니다.  
생리 주기 및 배란일 계산, 맞춤형 영양제 추천 및 복용 알림, 그리고 AI 코디네이터와의 상담 기능을 통해 건강하고 체계적인 임신 준비를 돕습니다.

## ✨ 주요 기능

### 1. 📅 스마트 캘린더
- **주기 관리**: 생리일, 배란일, 가임기를 자동으로 계산하여 캘린더에 표시합니다.
- **일정 관리**: 병원 방문, 부부 관계 등 중요한 일정을 기록하고 관리할 수 있습니다 (To-Do).
- **임신 주차별 정보**: 임신 성공 시, 주차별 태아 발달 정보와 엄마의 신체 변화 정보를 제공합니다.

### 2. 💊 영양제 관리
- **맞춤 추천**: 준비기(기초/집중), 임박기, 임신 중 등 시기별 필수 영양제를 추천해줍니다.
- **복용 알림**: 매일 정해진 시간에 영양제 복용 알림을 받을 수 있습니다.
- **커스텀 등록**: 추천 목록에 없는 영양제도 직접 등록하여 관리할 수 있습니다.

### 3. 🤖 AI 코디네이터 (챗봇)
- **실시간 상담**: 임신 준비 과정에서 궁금한 점(식단, 운동, 주의사항 등)을 AI 챗봇에게 언제든 물어볼 수 있습니다.
- **RAG 기반 답변**: 검증된 가이드 문서를 바탕으로 신뢰할 수 있는 정보를 제공합니다.

### 4. 👤 마이페이지 & 설정
- **건강 기록**: 키, 체중(임신 전/후)을 기록하여 BMI 및 체중 변화를 모니터링합니다.
- **알림 설정**: 전체 알림 ON/OFF 및 방해 금지 시간 설정이 가능합니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React (Vite)
- **Language**: JavaScript (ES6+)
- **Styling**: CSS Modules / Vanilla CSS
- **State Management**: Custom Hooks (`useCalendar`, `useSupplements`, etc.)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (psycopg2)
- **AI/LLM**: LangChain, OpenAI GPT-4o
- **Authentication**: JWT (JSON Web Token)

---

## 🚀 설치 및 실행 가이드

### 사전 요구 사항 (Prerequisites)
- **Node.js**: v18 이상
- **Python**: 3.9 이상
- **PostgreSQL**: 로컬 또는 원격 DB 인스턴스

### 1. 백엔드 (Backend) 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (.env 파일 생성)
# 아래 [환경 변수] 섹션을 참고하여 .env 파일을 작성하세요.

# 서버 실행
python -m uvicorn main:app --reload
```
- 서버 주소: `http://127.0.0.1:8000`
- API 문서 (Swagger): `http://127.0.0.1:8000/docs`

### 2. 프론트엔드 (Frontend) 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```
- 접속 주소: `http://localhost:5173`

---

## 🔑 환경 변수 (Environment Variables)

`backend/.env` 파일을 생성하고 아래 정보를 입력해야 합니다.

```ini
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication (JWT)
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256

# OpenAI (챗봇용)
OPENAI_API_KEY=sk-...

# Social Login (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
KAKAO_CLIENT_ID=...
```

---

## 📂 프로젝트 구조

```
.
├── backend/             # FastAPI 서버
│   ├── routers/         # API 엔드포인트 (auth, calendar, supplements 등)
│   ├── services/        # 비즈니스 로직
│   ├── models.py        # Pydantic 데이터 모델
│   ├── db.py            # DB 연결 및 쿼리 함수
│   └── main.py          # 앱 진입점
│
└── frontend/            # React 클라이언트
    ├── src/
    │   ├── components/  # UI 컴포넌트 (Tabs, Forms 등)
    │   ├── hooks/       # 커스텀 훅 (데이터 로직 분리)
    │   └── utils/       # 유틸리티 함수
    └── ...
```
