# Baby Prep Web & API

간단하게 로컬에서 프런트/백엔드 모두 띄울 수 있는 실행 가이드입니다.

## 요구 사항
- Node.js: v24.11.1
- npm (Node와 함께 설치됨)
- Python 3.9+

## 프런트엔드 (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- 기본 실행 주소: http://localhost:5173

## 백엔드 (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
- 기본 실행 주소: http://127.0.0.1:8000
- OpenAPI 문서: http://127.0.0.1:8000/docs

## 기타
- 토큰 포맷: `Bearer token-<user_id>`
- 백엔드는 현재 메모리 저장소를 사용하므로 서버 재시작 시 데이터가 초기화됩니다.
