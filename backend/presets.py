nutrient_catalog = [
    {
        "id": "folic",
        "stage": "기초 준비기",
        "nutrient": "엽산",
        "description": "배아 신경관 발달을 돕고 초기 유산 위험을 낮추는 필수 영양소입니다.",
        "benefits": ["신경관 결손 예방", "배란 주기 안정화", "피로감 완화"],
        "supplements": [
            {
                "id": "folic800",
                "name": "엽산 800mcg",
                "schedule": "매일 아침 08:00",
                "caution": "과다 복용 시 소화불량이 생길 수 있어요."
            },
            {
                "id": "folic400",
                "name": "프리미엄 엽산 400mcg",
                "schedule": "매일 아침 식사 후",
                "caution": "철분과 동시에 섭취 시 흡수가 저하될 수 있어요."
            }
        ]
    },
    {
        "id": "omega",
        "stage": "집중 준비기",
        "nutrient": "오메가3 / DHA",
        "description": "난황 발달과 염증 감소에 도움을 주어 착상 환경을 최적화합니다.",
        "benefits": ["염증 및 산화 스트레스 감소", "호르몬 균형 보조", "혈액순환 개선"],
        "supplements": [
            {
                "id": "omegaMorning",
                "name": "저녁 생선 오메가3",
                "schedule": "매일 저녁 20:00",
                "caution": "위장 장애가 있다면 식후 섭취하세요."
            },
            {
                "id": "veganOmega",
                "name": "비건 DHA 캡슐",
                "schedule": "격일 아침 09:00",
                "caution": "비타민 E와 함께 섭취하면 산화 방지에 좋아요."
            }
        ]
    },
    {
        "id": "iron",
        "stage": "임박기",
        "nutrient": "철분 & 비타민C",
        "description": "배란 주간에는 체내 산소 공급과 에너지 생산을 위해 철분 보충이 중요합니다.",
        "benefits": ["빈혈 예방", "피로 개선", "호르몬 운반 보조"],
        "supplements": [
            {
                "id": "ironDaily",
                "name": "저자극 철분제",
                "schedule": "매일 점심 12:30",
                "caution": "카페인과 간격을 두고 드세요."
            },
            {
                "id": "ironSpray",
                "name": "철분 스프레이",
                "schedule": "주 3회 저녁 21:00",
                "caution": "섭취 후 30분간 음식 섭취를 피하세요."
            }
        ]
    }
]

chatbot_hints = [
    {"keyword": "영양제", "reply": "현재 단계에서는 엽산과 오메가3 조합이 많이 선택되고 있어요."},
    {"keyword": "체중", "reply": "주당 0.3~0.5kg 증가가 안정적이라는 점만 기억하세요."},
    {"keyword": "운동", "reply": "30분 걷기나 스트레칭이 배란 준비에 도움이 됩니다."}
]

stages = [
    {"id": "basic", "label": "기초 준비기", "range": "D-180 ~ D-90", "color": "#B3D4FF"},
    {"id": "focus", "label": "집중 준비기", "range": "D-90 ~ D-30", "color": "#F6C2FF"},
    {"id": "final", "label": "임박기", "range": "D-30 ~ D-day", "color": "#FFD59D"}
]

sample_partner_events = [
    {
        "id": "partner-01",
        "title": "배란일 동행 초음파",
        "detail": "수요일 09:30, 함께 내원 예정",
        "tag": "공유 완료"
    },
    {
        "id": "partner-02",
        "title": "영양제 재고 체크",
        "detail": "토요일 14:00, 남편 담당",
        "tag": "리마인드"
    },
    {
        "id": "partner-03",
        "title": "부부 운동",
        "detail": "일요일 19:30, 30분 스트레칭",
        "tag": "루틴"
    }
]
