"""
AI Farming Assistant Service.
Smart India Hackathon 2025 - SIH25044.

Provides context-grounded, multilingual agricultural decision support
in English (en), Hindi (hi), and Marathi (mr).
Supports external Gemini API with robust agronomic fallback knowledge engine.
"""

import os
import json
import urllib.request
from django.conf import settings
from apps.farms.models import Farm
from apps.predictions.models import YieldPrediction
from apps.weather.models import WeatherAlert
from apps.market.models import MarketPrice
from .models import ChatConversation, ChatMessage

SYSTEM_PROMPT_TEMPLATE = """
You are AGROVISION Agronomist, an expert Indian agricultural advisor built for Smart India Hackathon 2025 (SIH25044).
You provide practical, scientifically validated, ICAR-aligned farming advice to Indian farmers.

Farmer Context:
- Farmer Name: {farmer_name}
- State: {state} | District: {district}
- Farm Parcel: {farm_name} ({area} ha, Soil: {soil_type}, pH: {soil_ph}, N-P-K: {n}-{p}-{k})
- Irrigation: {irrigation}
- Latest Yield Prediction: {latest_yield}
- Active Weather Alerts: {weather_alerts}
- APMC Market Price Context: {market_prices}

Language Requirement:
Respond in {language_name} ({language_code}).
Keep explanations clear, respectful, practical, and culturally tailored for Indian agriculture.
Always recommend balanced fertilization, organic soil enrichment (FYM/vermicompost), and water conservation (Drip/micro-irrigation).
Never prescribe unapproved or toxic pesticide quantities. Always include a safety warning when mentioning chemicals.
"""

# Local comprehensive agronomist knowledge engine
KNOWLEDGE_RESPONSES = {
    "sowing": {
        "en": "For {district}, optimal sowing depends on monsoon arrival. For Kharif Soybean/Cotton, sow after receiving at least 75–100 mm of soaking rainfall when topsoil moisture reaches 15–20 cm depth. Seed treatment with Thiram + Carbendazim (2 g + 1 g/kg seed) followed by Rhizobium culture is strongly advised.",
        "hi": "{district} में खरीफ बुवाई के लिए कम से कम 75 से 100 मिमी अच्छी बारिश होने के बाद ही बुवाई करें, ताकि मिट्टी में 15 सेमी तक पर्याप्त नमी हो। बीज को थीरम और कार्बेन्डाजिम (2:1) से उपचारित करने के बाद राइजोबियम कल्चर अवश्य लगाएं।",
        "mr": "{district} मध्ये किमान 75 ते 100 मिमी दमदार पाऊस झाल्यानंतरच खरीप पिकांची पेरणी करावी. पेरणीपूर्वी बियाण्यास थायरम + कार्बेन्डाझिम (2 ग्रॅम + 1 ग्रॅम प्रति किलो) व त्यानंतर रायझोबियम जिवाणू संवर्धकाची बीजप्रक्रिया आवर्जून करावी."
    },
    "fertilizer": {
        "en": "Based on your soil profile (Soil Type: {soil_type}, pH: {soil_ph}, N: {n}, P: {p}, K: {k}): Apply balanced NPK in splits. For Soybean, recommended dose is 30:60:40 kg NPK/ha. Apply entire P and K as basal along with 20 kg Sulphur/ha to boost oil content. Top-dress nitrogen prior to flowering.",
        "hi": "आपकी मिट्टी की जांच (प्रकार: {soil_type}, पीएच: {soil_ph}, N: {n}, P: {p}, K: {k}) के अनुसार: सोयाबीन के लिए 30:60:40 किग्रा NPK प्रति हेक्टेयर अनुशंसित है। फास्फोरस और पोटाश की पूरी मात्रा बुवाई के समय बेसल रूप में दें, साथ में 20 किग्रा सल्फर प्रति हेक्टेयर अवश्य डालें।",
        "mr": "आपल्या जमिनीच्या परीक्षणानुसार (प्रकार: {soil_type}, सामू: {soil_ph}, नत्र: {n}, स्फुरद: {p}, पालाश: {k}): सोयाबीन पिकासाठी 30:60:40 किलो NPK प्रति हेक्टरी शिफारस आहे. पेरणीच्या वेळी संपूर्ण स्फुरद व पालाश द्यावे, तसेच दाणे भरण्यासाठी 20 किलो गंधक (सल्फर) प्रति हेक्टरी अवश्य वापरावे."
    },
    "disease": {
        "en": "For leaf spot, rust, or blights: Inspect lower canopy. Spray Neem Seed Kernel Extract (5% NSKE) or Trichoderma viride @ 5 g/L at early onset. For severe fungal spread, apply Hexaconazole 5% EC @ 2 ml/L or Propiconazole 25% EC @ 1 ml/L. Always observe a 21-day pre-harvest waiting period.",
        "hi": "पत्तियों पर धब्बे या गेरुआ दिखने पर: शुरुआती अवस्था में 5% नीम का काढ़ा (NSKE) या ट्राइकोडर्मा विरिडी 5 ग्राम/लीटर पानी का छिड़काव करें। यदि फफूंद का प्रकोप अधिक हो, तो हेक्साकोनाजोल 5% EC 2 मिली/लीटर अथवा प्रोपिकोनाजोल 1 मिली/लीटर का छिड़काव करें।",
        "mr": "पानावरील तांबोरा किंवा करपा रोगासाठी: सुरुवातीला 5% निंबोळी अर्क किंवा ट्रायकोडर्मा 5 ग्रॅम प्रति लिटर पाण्यातून फवारावे. प्रादुर्भाव जास्त असल्यास हेक्साकोनाझोल 5% EC 2 मिली किंवा प्रोपिकोनाझोल 1 मिली प्रति लिटर पाण्यात मिसळून फवारावे. फवारणी करताना संरक्षक मास्क वापरावा."
    },
    "market": {
        "en": "Recent APMC mandi prices for your region show steady modal rates. Consider drying produce to 10–12% moisture before selling to command higher modal rates. Check e-NAM and AGMARKNET quotes before transporting produce.",
        "hi": "आपकी निकटवर्ती एपीएमसी मंडियों में भाव स्थिर बने हुए हैं। अपनी उपज को 10-12% नमी तक सुखाकर और छानकर बेचने से 100-150 रुपये प्रति क्विंटल अधिक भाव मिलता है। मंडी ले जाने से पहले ई-नाम (e-NAM) पर ताजा भाव अवश्य जांचें।",
        "mr": "नजीकच्या बाजार समित्यांमध्ये शेतमालाचे दर समाधानकारक आहेत. शेतमाल चांगला वाळवून (10-12% आर्द्रता) व प्रतवारी करून विकल्यास अधिक दर मिळतो. बाजारात नेण्यापूर्वी ई-नाम व ॲगमार्कनेटवरील चालू दर तपासावेत."
    },
    "weather": {
        "en": "Current meteorological telemetry indicates: {weather_alerts}. If heavy rain is forecasted, clean drainage channels to prevent waterlogging. In dry heat stress, apply light evening drip irrigation to preserve flowers.",
        "hi": "वर्तमान मौसम पूर्वानुमान: {weather_alerts}। यदि भारी वर्षा की चेतावनी है, तो खेत से जल निकासी की नालियां साफ रखें ताकि जलभराव न हो। यदि सूखा या अत्यधिक तापमान है, तो शाम के समय हल्की सिंचाई करें।",
        "mr": "हवामान अंदाज सूचना: {weather_alerts}. अतिवृष्टीचा इशारा असल्यास शेतातील पाण्याचा निचरा होण्यासाठी चर मोकळे ठेवावेत. उष्णतेची लाट असल्यास सायंकाळच्या वेळी ठिबक सिंचनाने हलके पाणी द्यावे."
    },
    "default": {
        "en": "AGROVISION Agronomist is at your service. For your farm in {district}, we recommend adopting integrated nutrient and pest management (INM/IPM), routine soil testing every two years, and drip irrigation for water efficiency.",
        "hi": "एग्रोविज़न कृषि सलाहकार आपकी सेवा में तत्पर है। {district} में आपकी खेती के लिए संतुलित खाद, एकीकृत कीट नियंत्रण (IPM), नियमित मिट्टी जांच और ड्रिप सिंचाई अपनाने की सलाह दी जाती है।",
        "mr": "ॲग्रोव्हिजन कृषी सल्लागार आपल्या सेवेसाठी सज्ज आहे. {district} मधील आपल्या शेतासाठी एकात्मिक अन्नद्रव्य व कीड व्यवस्थापन (IPM), दर दोन वर्षांनी माती परीक्षण आणि तुषार/ठिबक सिंचनाचा वापर फायदेशीर ठरतो."
    }
}


def build_farmer_context(user, farm=None) -> dict:
    """Aggregates live farm, soil, yield, weather, and market context."""
    if not farm:
        farm = Farm.objects.filter(owner=user).first()

    context = {
        "farmer_name": f"{user.first_name} {user.last_name}".strip() or user.username,
        "state": user.state or (farm.state if farm else "Maharashtra"),
        "district": user.district or (farm.district if farm else "Nashik"),
        "farm_name": farm.farm_name if farm else "Primary Parcel",
        "area": float(farm.area_hectares) if farm else 2.5,
        "soil_type": farm.get_soil_type_display() if farm else "Black Cotton Soil",
        "soil_ph": float(farm.soil_ph) if farm and farm.soil_ph else 7.2,
        "n": float(farm.nitrogen_n) if farm and farm.nitrogen_n else 240.0,
        "p": float(farm.phosphorus_p) if farm and farm.phosphorus_p else 22.0,
        "k": float(farm.potassium_k) if farm and farm.potassium_k else 290.0,
        "irrigation": farm.get_irrigation_method_display() if farm else "Drip Irrigation",
        "latest_yield": "2,480 kg/ha (Soybean)",
        "weather_alerts": "No adverse weather warning active.",
        "market_prices": "Modal APMC Soybean price: ₹4,650 / quintal"
    }

    # Fetch latest yield prediction
    if farm:
        latest_pred = YieldPrediction.objects.filter(farm=farm, is_latest=True).first()
        if latest_pred:
            context["latest_yield"] = f"{latest_pred.predicted_yield_kg_per_ha} kg/ha ({latest_pred.crop.name})"

    # Fetch active weather alert for farm/district
    alert = None
    if farm:
        alert = WeatherAlert.objects.filter(is_active=True, farm=farm).first()
    if not alert:
        alert = WeatherAlert.objects.filter(is_active=True, farm__district__iexact=context["district"]).first()
    if alert:
        context["weather_alerts"] = f"【{alert.severity} ALERT】: {alert.title} - {alert.message}"

    # Fetch recent mandi price
    price_rec = MarketPrice.objects.filter(market__state__iexact=context["state"]).first()
    if price_rec:
        context["market_prices"] = f"{price_rec.crop.name} in {price_rec.market.mandi_name}: ₹{price_rec.modal_price_rs_per_quintal}/quintal"

    return context


def get_ai_response(user_query: str, language: str = 'en', context: dict = None) -> str:
    """
    Generates response using Gemini API if key is present,
    or our contextual agronomic knowledge engine fallback.
    """
    lang = language.lower()
    if lang not in ['en', 'hi', 'mr']:
        lang = 'en'

    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        try:
            # External Gemini API call
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            sys_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                language_name="Hindi" if lang == 'hi' else "Marathi" if lang == 'mr' else "English",
                language_code=lang,
                **context
            )
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{sys_prompt}\n\nFarmer Question: {user_query}"}]}
                ],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 600}
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                text = data['candidates'][0]['content']['parts'][0]['text']
                return text.strip()
        except Exception as e:
            # Fall through to knowledge engine
            pass

    # Intelligent Agronomic Fallback Knowledge Engine
    query_lower = user_query.lower()
    category = "default"

    if any(w in query_lower for w in ["sow", "sowing", "seed", "पेरणी", "बुवाई", "बीज", "variet"]):
        category = "sowing"
    elif any(w in query_lower for w in ["fertiliz", "npk", "urea", "खाद", "उर्वरक", "खत", "dap", "potash"]):
        category = "fertilizer"
    elif any(w in query_lower for w in ["disease", "pest", "fungus", "रोग", "कीट", "फफूंद", "तांबोरा", "पत्ता"]):
        category = "disease"
    elif any(w in query_lower for w in ["price", "mandi", "market", "भाव", "बाजार", "मंडी", "दर"]):
        category = "market"
    elif any(w in query_lower for w in ["weather", "rain", "monsoon", "मौसम", "बारिश", "हवामान", "पाऊस"]):
        category = "weather"

    template = KNOWLEDGE_RESPONSES.get(category, {}).get(lang, KNOWLEDGE_RESPONSES["default"][lang])
    formatted_reply = template.format(**context)

    # Attach official disclaimer
    disclaimer = {
        "en": "\n\n⚠️ Disclaimer: Advisory derived from ICAR guidelines. Validate with your local Krishi Vigyan Kendra before large-scale application.",
        "hi": "\n\n⚠️ अस्वीकरण: यह सलाह आईसीएआर (ICAR) दिशानिर्देशों पर आधारित है। बड़े पैमाने पर प्रयोग से पहले अपने स्थानीय कृषि विज्ञान केंद्र से पुष्टि करें।",
        "mr": "\n\n⚠️ सूचना: हा कृषी सल्ला ICAR मार्गदर्शक तत्त्वांवर आधारित आहे. प्रत्यक्ष वापरापूर्वी स्थानिक कृषी विज्ञान केंद्राशी संपर्क साधावा."
    }[lang]

    return formatted_reply + disclaimer
