from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, calendar, supplements, users, chatbot

app = FastAPI(title="Baby Prep API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(calendar.router)
app.include_router(supplements.router)
app.include_router(users.router)
app.include_router(chatbot.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "baby-prep-api"}
