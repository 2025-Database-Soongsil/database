import os
from openai import OpenAI
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def analyze_weight(height: float, pre_weight: float, current_weight: float, weeks: int) -> dict:
    """
    Analyze pregnancy weight gain using OpenAI.
    """
    
    prompt = f"""
    You are an expert obstetrician. Analyze the weight gain for a pregnant woman with the following data:
    - Height: {height} cm
    - Pre-pregnancy Weight: {pre_weight} kg
    - Current Weight: {current_weight} kg
    - Pregnancy Week: {weeks} weeks

    Based on IOM guidelines (2009), calculate:
    1. Pre-pregnancy BMI (Weight / Height^2).
    2. STRICTLY determine the BMI category:
       - Underweight (< 18.5): 12.5-18.0 kg gain
       - Normal (18.5-24.9): 11.5-16.0 kg gain
       - Overweight (25.0-29.9): 7.0-11.5 kg gain
       - Obese (>= 30.0): 5.0-9.0 kg gain
    3. Recommended weight gain range for the *entire* pregnancy based on this category.
    4. Recommended weight gain range *up to the current week* (approximate).
    5. Current weight gain status.
    6. A brief, encouraging advice message (in Korean).
    7. The numerical minimum and maximum recommended total weight gain (float) based on the category.

    Return the response in strictly valid JSON format with the following keys:
    {{
        "bmi": float,
        "bmi_category": string (e.g., "Normal", "Overweight"),
        "total_gain_range": string (e.g., "11.5 ~ 16.0 kg"),
        "current_week_gain_range": string (e.g., "3.0 ~ 5.0 kg"),
        "gained": float (current - pre),
        "status": string (e.g., "Normal", "Warning"),
        "message": string (Korean advice),
        "min_recommended_gain": float,
        "max_recommended_gain": float
    }}
    Do not include markdown formatting like ```json. Just the raw JSON string.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful medical assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        # Fallback to basic calculation if AI fails
        bmi = pre_weight / ((height / 100) ** 2)
        gained = current_weight - pre_weight
        return {
            "bmi": round(bmi, 1),
            "bmi_category": "Unknown",
            "total_gain_range": "Unknown",
            "current_week_gain_range": "Unknown",
            "gained": round(gained, 1),
            "status": "Unknown",
            "message": "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.",
            "min_recommended_gain": 11.5,
            "max_recommended_gain": 16.0
        }
