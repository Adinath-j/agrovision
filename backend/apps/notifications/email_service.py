"""
Email Notification Service for AGROVISION.
Smart India Hackathon 2025 - SIH25044.

Handles automated and on-demand dispatches to farmers' registered emails:
1. Welcome Email on registration
2. Plant Watering & Irrigation need alerts (daily / need-basis)
3. Plant Nutrition, Fertilizer & Micronutrient schedules
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

# Standard Agronomic Plant Nutrition & Water Baselines
CROP_AGRONOMIC_GUIDES = {
    'Soybean': {
        'npk_ratio': '30:60:40 kg/ha',
        'commercial_fertilizers': 'DAP: 130 kg/ha, MOP: 67 kg/ha, Urea (starter): 25 kg/ha',
        'micronutrients': 'Zinc Sulphate (ZnSO4) @ 25 kg/ha basal, Boron 0.2% spray at flowering',
        'chemicals_protection': 'Rhizobium + PSB seed coating; Carbendazim (2g/kg) seed treatment',
        'daily_water_liters_per_ha': '45,000 – 55,000 Liters/day (4.5–5.5 mm/day)',
        'water_schedule': 'Every 3–4 days via Drip or 7–10 days via Furrow',
        'optimal_time': 'Early Morning (06:00 AM – 09:00 AM)',
        'drip_run_hours': '2.5 to 3.0 Hours per irrigation cycle',
        'critical_stages': 'Flowering (R1–R2) and Pod Development (R3–R4)'
    },
    'Cotton': {
        'npk_ratio': '120:60:60 kg/ha',
        'commercial_fertilizers': 'Urea: 260 kg/ha (split in 3 doses), DAP: 130 kg/ha, MOP: 100 kg/ha',
        'micronutrients': 'Magnesium Sulphate (MgSO4) 1% + Zinc Sulphate 0.5% at square formation',
        'chemicals_protection': 'Imidacloprid for sucking pests; Trichoderma viride bio-fungicide',
        'daily_water_liters_per_ha': '50,000 – 65,000 Liters/day (5.0–6.5 mm/day)',
        'water_schedule': 'Every 3 days via Drip or 10–12 days via Furrow',
        'optimal_time': 'Morning (06:30 AM – 09:30 AM)',
        'drip_run_hours': '3.0 to 4.0 Hours per cycle',
        'critical_stages': 'Square formation, Flowering, and Boll development'
    },
    'Sugarcane': {
        'npk_ratio': '250:115:115 kg/ha',
        'commercial_fertilizers': 'Urea: 540 kg/ha (4 splits), SSP: 720 kg/ha, MOP: 190 kg/ha',
        'micronutrients': 'Ferrous Sulphate 25 kg/ha + Zinc Sulphate 25 kg/ha in calcareous soils',
        'chemicals_protection': 'Chlorpyrifos soil drench for termites/borers; Acetobacter bio-inoculant',
        'daily_water_liters_per_ha': '70,000 – 90,000 Liters/day (7.0–9.0 mm/day)',
        'water_schedule': 'Every 2–3 days via Drip or 6–8 days via Furrow',
        'optimal_time': 'Early Morning (05:30 AM – 08:30 AM)',
        'drip_run_hours': '4.0 to 5.0 Hours per cycle',
        'critical_stages': 'Tillering, Formative elongation phase, and Grand growth stage'
    },
    'Onion': {
        'npk_ratio': '100:50:50 kg/ha',
        'commercial_fertilizers': 'Urea: 150 kg/ha (2 splits), DAP: 110 kg/ha, MOP: 85 kg/ha',
        'micronutrients': 'Sulphur (Elemental/Bentonite) 30 kg/ha (enhances pungency & storage)',
        'chemicals_protection': 'Mancozeb (2.5g/L) for purple blotch; sticky traps for thrips',
        'daily_water_liters_per_ha': '35,000 – 45,000 Liters/day (3.5–4.5 mm/day)',
        'water_schedule': 'Every 2 days via Micro-Sprinkler / Drip or 5–7 days furrow',
        'optimal_time': 'Early Morning (06:00 AM – 08:30 AM)',
        'drip_run_hours': '2.0 to 2.5 Hours per cycle',
        'critical_stages': 'Bulb initiation (45–60 DAT) and Bulb enlargement'
    },
    'Wheat': {
        'npk_ratio': '120:60:40 kg/ha',
        'commercial_fertilizers': 'Urea: 260 kg/ha, DAP: 130 kg/ha, MOP: 67 kg/ha',
        'micronutrients': 'Zinc Sulphate @ 25 kg/ha basal or 0.5% foliar spray at tillering',
        'chemicals_protection': 'Azotobacter seed treatment; Propiconazole for yellow rust prevention',
        'daily_water_liters_per_ha': '40,000 – 50,000 Liters/day (4.0–5.0 mm/day)',
        'water_schedule': 'Critical 6-stage irrigation schedule (CRI, Tillering, Jointing, Flowering, Milking, Dough)',
        'optimal_time': 'Morning (07:00 AM – 10:00 AM)',
        'drip_run_hours': '3.0 Hours per cycle',
        'critical_stages': 'Crown Root Initiation (21 DAS) and Flowering/Heading (75 DAS)'
    },
    'Tomato': {
        'npk_ratio': '150:100:120 kg/ha',
        'commercial_fertilizers': 'Water-soluble 19:19:19 fertigation, Calcium Nitrate 50 kg/ha',
        'micronutrients': 'Boron (Solubor 0.2%) + Calcium to prevent Blossom End Rot',
        'chemicals_protection': 'Copper oxychloride for early blight; Yellow sticky traps for whiteflies',
        'daily_water_liters_per_ha': '55,000 – 70,000 Liters/day (4–6 Liters/plant/day via Drip)',
        'water_schedule': 'Daily or alternate day pulse fertigation',
        'optimal_time': 'Early Morning (06:00 AM – 08:30 AM)',
        'drip_run_hours': '1.5 to 2.5 Hours daily pulse',
        'critical_stages': 'Flowering, Fruit set, and Fruit sizing'
    },
    'Pomegranate': {
        'npk_ratio': '625:250:250 g/tree/year',
        'commercial_fertilizers': '0:52:34 (MKP) and 13:0:45 (Potassium Nitrate) during fruit development',
        'micronutrients': 'Zinc, Boron & Magnesium combo foliar spray @ 2g/L at flowering',
        'chemicals_protection': 'Streptocycline + Copper hydroxide for bacterial blight (Telya)',
        'daily_water_liters_per_ha': '25 – 45 Liters/tree/day (dependent on bahar season)',
        'water_schedule': 'Daily drip regulated deficit irrigation based on stress induction',
        'optimal_time': 'Early Morning (06:00 AM – 08:00 AM)',
        'drip_run_hours': '2.0 to 3.0 Hours daily drip run',
        'critical_stages': 'Flower emergence and Fruit enlargement'
    },
    'DEFAULT': {
        'npk_ratio': '100:50:50 kg/ha',
        'commercial_fertilizers': 'DAP: 110 kg/ha, Urea: 180 kg/ha (split), MOP: 85 kg/ha',
        'micronutrients': 'Zinc Sulphate @ 25 kg/ha, Soil-test organic compost 5 tonnes/ha',
        'chemicals_protection': 'Bio-fungicide seed treatment (Trichoderma) + Neem oil repellent',
        'daily_water_liters_per_ha': '40,000 – 50,000 Liters/day (4.0–5.0 mm/day)',
        'water_schedule': 'Every 3 days via Drip or 7–8 days via Furrow',
        'optimal_time': 'Early Morning (06:00 AM – 09:00 AM)',
        'drip_run_hours': '2.5 Hours per cycle',
        'critical_stages': 'Early seedling establishment and Flowering'
    }
}


def get_crop_agronomic_guide(crop_name: str) -> dict:
    """Returns tailored nutrition and water guidelines for a given crop name."""
    for key, data in CROP_AGRONOMIC_GUIDES.items():
        if key.lower() in (crop_name or '').lower():
            return data
    return CROP_AGRONOMIC_GUIDES['DEFAULT']


def send_welcome_email(user) -> bool:
    """
    Sends an onboarding welcome email to the newly registered farmer.
    """
    if not user.email:
        logger.warning(f"No email address found for user {user.username}. Skipping welcome email.")
        return False

    farmer_name = f"{user.first_name} {user.last_name}".strip() or user.username
    subject = "🌾 Welcome to AGROVISION – Your Intelligent Farming Partner"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F8F5; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ background: linear-gradient(135deg, #174C32 0%, #2E8B57 100%); color: #ffffff; padding: 32px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #EAF5EC; }}
        .content {{ padding: 28px 24px; color: #2D3748; line-height: 1.6; font-size: 14px; }}
        .pill {{ display: inline-block; background: #EAF5EC; color: #174C32; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px; }}
        .feature-box {{ background: #F8FAF7; border-left: 4px solid #2E8B57; padding: 14px 16px; margin: 16px 0; border-radius: 0 12px 12px 0; }}
        .feature-title {{ font-weight: 700; color: #174C32; margin-bottom: 4px; font-size: 13px; }}
        .cta {{ display: block; text-align: center; background: #174C32; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 24px 0 12px 0; }}
        .footer {{ background: #EDF2F7; padding: 16px 24px; text-align: center; font-size: 11px; color: #718096; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span style="font-size: 32px;">🌱</span>
          <h1>Welcome to AGROVISION</h1>
          <p>Smart India Hackathon 2025 (SIH25044) • Decision Support System</p>
        </div>
        <div class="content">
          <div class="pill">Farmer Registration Confirmed</div>
          <p>Namaste <strong>{farmer_name}</strong>,</p>
          <p>
            Congratulations! Your AGROVISION account has been successfully created with username <code>{user.username}</code>.
            You now have access to India's most advanced AI-powered crop decision-support platform.
          </p>
          
          <div class="feature-box">
            <div class="feature-title">🌾 Dual-Stage Yield Prediction</div>
            <div>Forecast expected harvest pre-sowing with Random Forest & XGBoost, and revise predictions live during the season using multi-stage assimilation.</div>
          </div>

          <div class="feature-box">
            <div class="feature-title">🛰️ Copernicus Sentinel-2 Satellite Monitoring</div>
            <div>Track your farm canopy greenness (NDVI), vegetation vigor (EVI), and moisture index (NDWI) from space every 5 days with 10m resolution.</div>
          </div>

          <div class="feature-box">
            <div class="feature-title">💧 Precision Irrigation & STCR Plant Nutrition</div>
            <div>Receive tailored daily water measures and soil-test based fertilizer dosages directly on your registered email.</div>
          </div>

          <div class="feature-box">
            <div class="feature-title">🌿 Leaf Disease Scanner & Multilingual AI Assistant</div>
            <div>Identify crop foliar diseases instantly with your smartphone camera and chat with our multilingual AI assistant in Marathi, Hindi, and English.</div>
          </div>

          <a href="http://localhost:5173/dashboard" class="cta">Open AGROVISION Dashboard &rarr;</a>

          <p style="font-size: 12px; color: #718096; margin-top: 20px;">
            Registered Email: <strong>{user.email}</strong><br>
            State: <strong>{getattr(user, 'state', 'Maharashtra')}</strong> | District: <strong>{getattr(user, 'district', 'Nashik')}</strong>
          </p>
        </div>
        <div class="footer">
          AGROVISION AI Decision Support • Government of India SIH25044 Initiative<br>
          Delivering real-time agronomic precision to Indian farmers.
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = strip_tags(html_content)

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'notifications@agrovision.ai'),
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Welcome email successfully sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch welcome email to {user.email}: {e}")
        return False


def send_crop_advisory_email(user, crop_name: str, farm=None, alert_type: str = 'all') -> dict:
    """
    Sends personalized watering and plant nutrition advisory to the farmer's registered email.
    """
    if not user.email:
        return {"success": False, "error": "No registered email address found for this user account."}

    farmer_name = f"{user.first_name} {user.last_name}".strip() or user.username
    guide = get_crop_agronomic_guide(crop_name)
    farm_label = farm.farm_name if farm else "Primary Registered Farm Parcel"
    district = farm.district if farm else getattr(user, 'district', 'Maharashtra')

    subject = f"🌱 Daily Plant Care & Nutrition Advisory: {crop_name} ({farm_label})"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F8F5; margin: 0; padding: 20px; }}
        .card {{ max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ background: linear-gradient(135deg, #174C32 0%, #2E8B57 100%); color: #ffffff; padding: 28px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
        .header p {{ margin: 4px 0 0 0; font-size: 13px; color: #EAF5EC; }}
        .content {{ padding: 24px; color: #2D3748; line-height: 1.6; font-size: 14px; }}
        .badge {{ display: inline-block; background: #EAF5EC; color: #174C32; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }}
        .section-title {{ font-size: 14px; font-weight: 800; color: #174C32; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 8px; border-bottom: 2px solid #EAF5EC; padding-bottom: 4px; }}
        .grid {{ width: 100%; border-collapse: collapse; margin-bottom: 14px; }}
        .grid td {{ padding: 8px 10px; border-bottom: 1px solid #EDF2F7; font-size: 13px; }}
        .grid td.label {{ color: #718096; font-weight: 600; width: 38%; }}
        .grid td.val {{ color: #1A202C; font-weight: 700; }}
        .highlight-box {{ background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 14px; margin: 14px 0; }}
        .footer {{ background: #EDF2F7; padding: 16px 24px; text-align: center; font-size: 11px; color: #718096; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🌱 AGROVISION Plant Care Advisory</h1>
          <p>{crop_name} • {farm_label} ({district})</p>
        </div>
        <div class="content">
          <div class="badge">Live Agronomic Delivery to {user.email}</div>
          <p>Namaste <strong>{farmer_name}</strong>,</p>
          <p>
            Here is your daily plant care, precision watering measure, and scientific nutrition schedule for <strong>{crop_name}</strong> calibrated to your local agro-climatic conditions:
          </p>

          <div class="section-title">💧 1. Water Measures & Irrigation Requirement</div>
          <table class="grid">
            <tr>
              <td class="label">Daily Water Measure:</td>
              <td class="val">{guide['daily_water_liters_per_ha']}</td>
            </tr>
            <tr>
              <td class="label">Recommended Frequency:</td>
              <td class="val">{guide['water_schedule']}</td>
            </tr>
            <tr>
              <td class="label">Optimal Irrigation Window:</td>
              <td class="val">{guide['optimal_time']}</td>
            </tr>
            <tr>
              <td class="label">Drip Run Duration:</td>
              <td class="val">{guide['drip_run_hours']}</td>
            </tr>
            <tr>
              <td class="label">Critical Hydration Stages:</td>
              <td class="val">{guide['critical_stages']}</td>
            </tr>
          </table>

          <div class="section-title">🧪 2. Plant Nutrition & Fertilizer Dosage</div>
          <table class="grid">
            <tr>
              <td class="label">Recommended N-P-K Ratio:</td>
              <td class="val" style="color: #174C32;">{guide['npk_ratio']}</td>
            </tr>
            <tr>
              <td class="label">Commercial Fertilizers:</td>
              <td class="val">{guide['commercial_fertilizers']}</td>
            </tr>
            <tr>
              <td class="label">Secondary & Micronutrients:</td>
              <td class="val">{guide['micronutrients']}</td>
            </tr>
            <tr>
              <td class="label">Chemicals & Plant Health:</td>
              <td class="val">{guide['chemicals_protection']}</td>
            </tr>
          </table>

          <div class="highlight-box">
            <strong style="color: #166534;">💡 Expert Farmer Tip:</strong><br>
            Always irrigate during early morning hours to minimize evaporative losses by up to 28%. When applying foliar micronutrients like Zinc and Boron, spray in the evening (after 4:30 PM) for optimal stomatal absorption.
          </div>

          <p style="font-size: 12px; color: #718096; margin-top: 18px;">
            Sent to: <strong>{user.email}</strong> on request from your AGROVISION dashboard.<br>
            Farm Parcel: <strong>{farm_label}</strong>
          </p>
        </div>
        <div class="footer">
          AGROVISION AI Decision Support • Smart India Hackathon 2025 (SIH25044)<br>
          Automated agronomic recommendations powered by ICAR & Soil Health Card standards.
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = strip_tags(html_content)

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'notifications@agrovision.ai'),
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Crop advisory email sent successfully to {user.email}")
        return {
            "success": True,
            "message": f"Watering & Nutrition advisory sent to {user.email}",
            "crop": crop_name,
            "recipient": user.email
        }
    except Exception as e:
        logger.error(f"Failed to send advisory email to {user.email}: {e}")
        return {
            "success": False,
            "error": f"Email dispatch failed: {str(e)}",
            "crop": crop_name,
            "recipient": user.email
        }
