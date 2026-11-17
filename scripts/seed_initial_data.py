"""
Initial Seed Data for AGROVISION System.
Smart India Hackathon 2025 – SIH25044.

Populates:
1. Supported Crops (Rice, Wheat, Maize, Soybean, Cotton, Sugarcane, Groundnut, Ragi)
2. Cultivation Seasons (Kharif, Rabi, Zaid, Whole Year)
3. State & District Master Data (Maharashtra, Karnataka, Gujarat, MP, Punjab, UP)
4. Default Administrator and Demo Farmer user accounts with initial farm and soil records.
"""

import os
import sys
import django

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import FarmerProfile
from apps.crops.models import Crop, CropSeason, StateDistrict
from apps.farms.models import Farm, SoilRecord
from apps.notifications.models import Notification

User = get_user_model()

def seed_crops():
    crops_data = [
        {
            "name": "Soybean",
            "hindi_name": "सोयाबीन",
            "marathi_name": "सोयाबीन",
            "scientific_name": "Glycine max",
            "category": Crop.Category.OILSEED,
            "growing_duration_days": 105,
            "water_requirement_min_mm": 450.0,
            "water_requirement_max_mm": 700.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 32.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 1250.0,
            "description": "Crucial oilseed and protein crop heavily cultivated across Vidarbha and Marathwada."
        },
        {
            "name": "Cotton",
            "hindi_name": "कपास",
            "marathi_name": "कापूस",
            "scientific_name": "Gossypium hirsutum",
            "category": Crop.Category.FIBRE,
            "growing_duration_days": 165,
            "water_requirement_min_mm": 600.0,
            "water_requirement_max_mm": 1000.0,
            "ideal_temp_min_c": 21.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 520.0,
            "description": "Leading cash crop and fibre source cultivated extensively in Maharashtra's black cotton soils (regur)."
        },
        {
            "name": "Sugarcane",
            "hindi_name": "गन्ना",
            "marathi_name": "ऊस",
            "scientific_name": "Saccharum officinarum",
            "category": Crop.Category.SUGAR,
            "growing_duration_days": 365,
            "water_requirement_min_mm": 1500.0,
            "water_requirement_max_mm": 2500.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 38.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 75000.0,
            "description": "High-value perennial industrial cash crop driving the cooperative sugar and ethanol economy of Western Maharashtra."
        },
        {
            "name": "Onion",
            "hindi_name": "प्याज",
            "marathi_name": "कांदा",
            "scientific_name": "Allium cepa",
            "category": Crop.Category.HORTICULTURE,
            "growing_duration_days": 120,
            "water_requirement_min_mm": 450.0,
            "water_requirement_max_mm": 650.0,
            "ideal_temp_min_c": 15.0,
            "ideal_temp_max_c": 30.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 16500.0,
            "description": "Maharashtra leads India in onion production, centered in Nashik, Ahmednagar, and Pune (Lasalgaon APMC)."
        },
        {
            "name": "Wheat",
            "hindi_name": "गेहूं",
            "marathi_name": "गहू",
            "scientific_name": "Triticum aestivum",
            "category": Crop.Category.CEREAL,
            "growing_duration_days": 130,
            "water_requirement_min_mm": 400.0,
            "water_requirement_max_mm": 650.0,
            "ideal_temp_min_c": 14.0,
            "ideal_temp_max_c": 25.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.8,
            "standard_national_yield_kg_per_ha": 3500.0,
            "description": "Premier rabi staple cereal, widely grown across Maharashtra following Kharif Soybean or Maize."
        },
        {
            "name": "Rice",
            "hindi_name": "चावल / धान",
            "marathi_name": "भात",
            "scientific_name": "Oryza sativa",
            "category": Crop.Category.CEREAL,
            "growing_duration_days": 135,
            "water_requirement_min_mm": 1100.0,
            "water_requirement_max_mm": 1800.0,
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 5.5,
            "ideal_soil_ph_max": 7.2,
            "standard_national_yield_kg_per_ha": 2800.0,
            "description": "Primary staple cereal cultivated extensively in Konkan coastal belt, Kolhapur, and Eastern Vidarbha."
        },
        {
            "name": "Jowar",
            "hindi_name": "ज्वार",
            "marathi_name": "ज्वारी",
            "scientific_name": "Sorghum bicolor",
            "category": Crop.Category.MILLET,
            "growing_duration_days": 115,
            "water_requirement_min_mm": 400.0,
            "water_requirement_max_mm": 600.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 1150.0,
            "description": "State staple grain of Maharashtra (Solapur, Marathwada, Ahmednagar), grown in both Kharif and Rabi (Maldandi)."
        },
        {
            "name": "Bajra",
            "hindi_name": "बाजरा",
            "marathi_name": "बाजरी",
            "scientific_name": "Pennisetum glaucum",
            "category": Crop.Category.MILLET,
            "growing_duration_days": 90,
            "water_requirement_min_mm": 300.0,
            "water_requirement_max_mm": 500.0,
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 38.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 8.2,
            "standard_national_yield_kg_per_ha": 1350.0,
            "description": "Drought-resilient nutri-cereal widely grown in drought-prone rainfed tracts of Ahmednagar, Nashik, and Dhule."
        },
        {
            "name": "Gram",
            "hindi_name": "चना",
            "marathi_name": "हरभरा / चना",
            "scientific_name": "Cicer arietinum",
            "category": Crop.Category.PULSE,
            "growing_duration_days": 110,
            "water_requirement_min_mm": 300.0,
            "water_requirement_max_mm": 450.0,
            "ideal_temp_min_c": 12.0,
            "ideal_temp_max_c": 28.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.8,
            "standard_national_yield_kg_per_ha": 1100.0,
            "description": "Major rabi pulse crop (Desi and Kabuli chickpea) enriching soil nitrogen across central Maharashtra."
        },
        {
            "name": "Pigeon Pea",
            "hindi_name": "अरहर / तुअर",
            "marathi_name": "तूर",
            "scientific_name": "Cajanus cajan",
            "category": Crop.Category.PULSE,
            "growing_duration_days": 180,
            "water_requirement_min_mm": 550.0,
            "water_requirement_max_mm": 800.0,
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 950.0,
            "description": "Key protein source and deep-rooted pulse extensively intercropped with Soybean and Cotton in Vidarbha."
        },
        {
            "name": "Moong",
            "hindi_name": "मूंग",
            "marathi_name": "मूग",
            "scientific_name": "Vigna radiata",
            "category": Crop.Category.PULSE,
            "growing_duration_days": 70,
            "water_requirement_min_mm": 350.0,
            "water_requirement_max_mm": 500.0,
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.2,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 650.0,
            "description": "Short-duration Kharif and Summer catch pulse crop fitting neatly into crop rotation cycles."
        },
        {
            "name": "Urad",
            "hindi_name": "उड़द",
            "marathi_name": "उडीद",
            "scientific_name": "Vigna mungo",
            "category": Crop.Category.PULSE,
            "growing_duration_days": 75,
            "water_requirement_min_mm": 350.0,
            "water_requirement_max_mm": 550.0,
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 7.8,
            "standard_national_yield_kg_per_ha": 620.0,
            "description": "Black gram pulse essential for traditional cuisines and soil restoration across Maharashtra."
        },
        {
            "name": "Maize",
            "hindi_name": "मक्का",
            "marathi_name": "मका",
            "scientific_name": "Zea mays",
            "category": Crop.Category.CEREAL,
            "growing_duration_days": 100,
            "water_requirement_min_mm": 500.0,
            "water_requirement_max_mm": 800.0,
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 32.0,
            "ideal_soil_ph_min": 5.8,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 3100.0,
            "description": "High-yielding versatile cereal cultivated extensively in Nashik, Jalgaon, and Aurangabad for food, feed, and starch."
        },
        {
            "name": "Groundnut",
            "hindi_name": "मूंगफली",
            "marathi_name": "भुईमूग",
            "scientific_name": "Arachis hypogaea",
            "category": Crop.Category.OILSEED,
            "growing_duration_days": 120,
            "water_requirement_min_mm": 500.0,
            "water_requirement_max_mm": 700.0,
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 30.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.0,
            "standard_national_yield_kg_per_ha": 1750.0,
            "description": "Major oilseed and legume crop thriving in sandy loam and well-drained soils of Kolhapur and Dhule."
        },
        {
            "name": "Pomegranate",
            "hindi_name": "अनार",
            "marathi_name": "डाळिंब",
            "scientific_name": "Punica granatum",
            "category": Crop.Category.HORTICULTURE,
            "growing_duration_days": 300,
            "water_requirement_min_mm": 600.0,
            "water_requirement_max_mm": 900.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 38.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 12000.0,
            "description": "High-value fruit export crop (Bhagwa variety) revolutionizing arid agriculture in Solapur, Sangli, and Nashik."
        },
        {
            "name": "Grapes",
            "hindi_name": "अंगूर",
            "marathi_name": "द्राक्षे",
            "scientific_name": "Vitis vinifera",
            "category": Crop.Category.HORTICULTURE,
            "growing_duration_days": 150,
            "water_requirement_min_mm": 500.0,
            "water_requirement_max_mm": 800.0,
            "ideal_temp_min_c": 15.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 22000.0,
            "description": "Maharashtra accounts for over 70% of Indian grape exports, with Nashik recognized as the Wine & Grape Capital."
        },
        {
            "name": "Tomato",
            "hindi_name": "टमाटर",
            "marathi_name": "टोमॅटो",
            "scientific_name": "Solanum lycopersicum",
            "category": Crop.Category.HORTICULTURE,
            "growing_duration_days": 110,
            "water_requirement_min_mm": 400.0,
            "water_requirement_max_mm": 600.0,
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 30.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.0,
            "standard_national_yield_kg_per_ha": 24000.0,
            "description": "Crucial commercial vegetable with year-round cycles in Junnar, Sangamner, and Nashik supplying major Indian metros."
        },
        {
            "name": "Banana",
            "hindi_name": "केला",
            "marathi_name": "केळी",
            "scientific_name": "Musa acuminata",
            "category": Crop.Category.HORTICULTURE,
            "growing_duration_days": 330,
            "water_requirement_min_mm": 1200.0,
            "water_requirement_max_mm": 2000.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 36.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 58000.0,
            "description": "Jalgaon district is the Banana City of India, cultivating Grand Naine with micro-drip fertigation."
        },
        {
            "name": "Turmeric",
            "hindi_name": "हल्दी",
            "marathi_name": "हळद",
            "scientific_name": "Curcuma longa",
            "category": Crop.Category.SPICE,
            "growing_duration_days": 260,
            "water_requirement_min_mm": 1000.0,
            "water_requirement_max_mm": 1500.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 35.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 22000.0,
            "description": "Sangli and Hingoli are famous turmeric trading hubs (Waigaon and Salem varieties) known for high curcumin content."
        },
        {
            "name": "Ginger",
            "hindi_name": "अदरक",
            "marathi_name": "आले",
            "scientific_name": "Zingiber officinale",
            "category": Crop.Category.SPICE,
            "growing_duration_days": 240,
            "water_requirement_min_mm": 1200.0,
            "water_requirement_max_mm": 1800.0,
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 32.0,
            "ideal_soil_ph_min": 5.8,
            "ideal_soil_ph_max": 6.8,
            "standard_national_yield_kg_per_ha": 18000.0,
            "description": "High-value commercial cash rhizome grown in Satara, Aurangabad, and Kolhapur with drip irrigation."
        },
        {
            "name": "Garlic",
            "hindi_name": "लहसुन",
            "marathi_name": "लसूण",
            "scientific_name": "Allium sativum",
            "category": Crop.Category.SPICE,
            "growing_duration_days": 130,
            "water_requirement_min_mm": 400.0,
            "water_requirement_max_mm": 600.0,
            "ideal_temp_min_c": 12.0,
            "ideal_temp_max_c": 26.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 6500.0,
            "description": "Important spice and cash crop cultivated during Rabi in Ahmednagar, Pune, and Nashik."
        },
        {
            "name": "Sunflower",
            "hindi_name": "सूरजमुखी",
            "marathi_name": "सूर्यफूल",
            "scientific_name": "Helianthus annuus",
            "category": Crop.Category.OILSEED,
            "growing_duration_days": 95,
            "water_requirement_min_mm": 400.0,
            "water_requirement_max_mm": 600.0,
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 32.0,
            "ideal_soil_ph_min": 6.5,
            "ideal_soil_ph_max": 8.0,
            "standard_national_yield_kg_per_ha": 950.0,
            "description": "Photo-insensitive oilseed crop cultivated across Marathwada for high-quality edible oil."
        },
        {
            "name": "Safflower",
            "hindi_name": "कुसुम",
            "marathi_name": "करडई",
            "scientific_name": "Carthamus tinctorius",
            "category": Crop.Category.OILSEED,
            "growing_duration_days": 130,
            "water_requirement_min_mm": 250.0,
            "water_requirement_max_mm": 400.0,
            "ideal_temp_min_c": 15.0,
            "ideal_temp_max_c": 30.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 8.2,
            "standard_national_yield_kg_per_ha": 850.0,
            "description": "Traditional drought-hardy winter oilseed grown in deep black soils of Marathwada (Solapur, Beed)."
        },
        {
            "name": "Ragi",
            "hindi_name": "रागी / मडुआ",
            "marathi_name": "नाचणी",
            "scientific_name": "Eleusine coracana",
            "category": Crop.Category.MILLET,
            "growing_duration_days": 110,
            "water_requirement_min_mm": 350.0,
            "water_requirement_max_mm": 500.0,
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 30.0,
            "ideal_soil_ph_min": 5.0,
            "ideal_soil_ph_max": 7.5,
            "standard_national_yield_kg_per_ha": 1800.0,
            "description": "Nutrient-dense finger millet resilient to acidic hill soils in Konkan and tribal talukas of Nashik."
        }
    ]

    for c in crops_data:
        crop_obj, created = Crop.objects.update_or_create(name=c["name"], defaults=c)
        status = "Created" if created else "Updated"
        print(f"[{status}] Crop: {crop_obj.name}")


def seed_seasons():
    seasons = [
        {
            "season_code": CropSeason.SeasonCode.KHARIF,
            "name": "Kharif Season (Monsoon)",
            "sowing_start_month": 6,
            "sowing_end_month": 7,
            "harvesting_start_month": 9,
            "harvesting_end_month": 11,
            "description": "Southwest Monsoon cropping season starting in June/July with harvesting in Autumn."
        },
        {
            "season_code": CropSeason.SeasonCode.RABI,
            "name": "Rabi Season (Winter)",
            "sowing_start_month": 10,
            "sowing_end_month": 12,
            "harvesting_start_month": 3,
            "harvesting_end_month": 5,
            "description": "Winter cropping season sown in October–December and harvested in Spring."
        },
        {
            "season_code": CropSeason.SeasonCode.ZAID,
            "name": "Zaid Season (Summer)",
            "sowing_start_month": 3,
            "sowing_end_month": 4,
            "harvesting_start_month": 5,
            "harvesting_end_month": 6,
            "description": "Short summer season between Rabi and Kharif, primarily with irrigation."
        },
        {
            "season_code": CropSeason.SeasonCode.WHOLE_YEAR,
            "name": "Whole Year (Perennial)",
            "sowing_start_month": 1,
            "sowing_end_month": 12,
            "harvesting_start_month": 1,
            "harvesting_end_month": 12,
            "description": "Crops cultivated throughout the calendar year (such as Sugarcane, Banana)."
        }
    ]

    for s in seasons:
        season_obj, created = CropSeason.objects.update_or_create(season_code=s["season_code"], defaults=s)
        status = "Created" if created else "Updated"
        print(f"[{status}] Season: {season_obj.name}")


def seed_districts():
    state_districts = {
        "Maharashtra": [
            ("Nashik", "Western Plateau & Hills", 1050.0, "Black Soil"),
            ("Pune", "Western Plateau & Hills", 950.0, "Medium Black Soil"),
            ("Nagpur", "Eastern Plateau & Hills", 1120.0, "Black Cotton Soil"),
            ("Aurangabad (Chhatrapati Sambhajinagar)", "Central Plateau", 730.0, "Medium Black"),
            ("Kolhapur", "Western Ghats", 1800.0, "Laterite & Alluvial"),
            ("Ahmednagar (Ahilyanagar)", "Scarcity Zone", 580.0, "Shallow Black"),
            ("Amravati", "Vidarbha Agro Zone", 920.0, "Deep Black Soil")
        ],
        "Karnataka": [
            ("Bengaluru Rural", "Southern Transition Zone", 850.0, "Red Sandy Loam"),
            ("Belagavi", "Northern Transition Zone", 950.0, "Medium Black"),
            ("Dharwad", "Northern Dry Zone", 780.0, "Deep Black"),
            ("Mandya", "Southern Dry Zone", 700.0, "Red Loam"),
            ("Shivamogga", "Hilly Zone", 1600.0, "Laterite")
        ],
        "Gujarat": [
            ("Ahmedabad", "North Gujarat Agro Zone", 750.0, "Alluvial & Sandy"),
            ("Rajkot", "North Saurashtra", 620.0, "Medium Black"),
            ("Surat", "South Gujarat Heavy Rainfall", 1400.0, "Deep Black"),
            ("Vadodara", "Middle Gujarat", 930.0, "Alluvial & Black"),
            ("Junagadh", "South Saurashtra", 800.0, "Medium Black")
        ],
        "Madhya Pradesh": [
            ("Indore", "Malwa Plateau", 950.0, "Medium Black"),
            ("Bhopal", "Vindhya Plateau", 1100.0, "Deep Black"),
            ("Ujjain", "Malwa Plateau", 890.0, "Black Cotton Soil"),
            ("Jabalpur", "Kymore Plateau & Satpura Hills", 1250.0, "Clayey Loam"),
            ("Hoshangabad (Narmadapuram)", "Central Narmada Valley", 1300.0, "Deep Alluvial & Black")
        ],
        "Punjab": [
            ("Ludhiana", "Central Plain Zone", 680.0, "Alluvial Loam"),
            ("Amritsar", "Undulating Plain", 720.0, "Alluvial"),
            ("Patiala", "Central Plain Zone", 690.0, "Alluvial"),
            ("Bathinda", "South Western Plain", 410.0, "Sandy Loam"),
            ("Jalandhar", "Central Plain", 700.0, "Alluvial")
        ],
        "Uttar Pradesh": [
            ("Varanasi", "Eastern Plain Zone", 1020.0, "Alluvial Loam"),
            ("Lucknow", "Central Plain Zone", 980.0, "Alluvial"),
            ("Agra", "South-Western Semi-Arid", 650.0, "Sandy Alluvial"),
            ("Kanpur", "Central Plain Zone", 850.0, "Alluvial"),
            ("Meerut", "Western Plain Zone", 840.0, "Coarse Loam")
        ]
    }

    for state, dist_list in state_districts.items():
        for dist, agro_zone, rain, soil in dist_list:
            obj, created = StateDistrict.objects.update_or_create(
                state=state,
                district=dist,
                defaults={
                    "agro_climatic_zone": agro_zone,
                    "avg_annual_rainfall_mm": rain,
                    "major_soil_type": soil
                }
            )
            print(f"[{'Created' if created else 'Updated'}] {dist}, {state}")


def seed_users_and_farms():
    # Admin User
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@agrovision.in',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True,
            'state': 'Maharashtra',
            'district': 'Nashik'
        }
    )
    if created:
        admin_user.set_password('AdminPassword123!')
        admin_user.save()
        print("[Created] Administrator account: admin / AdminPassword123!")
    else:
        print("[Exists] Administrator account: admin")

    # Demo Farmer User
    farmer_user, created = User.objects.get_or_create(
        username='farmer_ramesh',
        defaults={
            'email': 'ramesh.patil@agrovision.in',
            'first_name': 'Ramesh',
            'last_name': 'Patil',
            'phone_number': '9876543210',
            'role': User.Role.FARMER,
            'preferred_language': 'mr',
            'state': 'Maharashtra',
            'district': 'Nashik',
            'village': 'Dindori'
        }
    )
    if created:
        farmer_user.set_password('FarmerPassword123!')
        farmer_user.save()
        print("[Created] Demo Farmer account: farmer_ramesh / FarmerPassword123!")
    else:
        print("[Exists] Demo Farmer account: farmer_ramesh")

    # Farmer Profile
    profile, _ = FarmerProfile.objects.get_or_create(
        user=farmer_user,
        defaults={
            'experience_years': 12,
            'primary_crops': ['Soybean', 'Wheat', 'Sugarcane'],
            'land_holding_category': FarmerProfile.LandCategory.SEMI_MEDIUM,
            'total_land_area_hectares': 3.5,
            'has_soil_health_card': True,
            'soil_health_card_number': 'MH-NSK-2024-8841',
            'pm_kisan_registered': True,
            'preferred_mandi': 'Nashik APMC Mandi'
        }
    )

    # Initial Demo Farm
    farm, created = Farm.objects.get_or_create(
        owner=farmer_user,
        farm_name='Sahyadri Valley Farms - Plot 1',
        defaults={
            'state': 'Maharashtra',
            'district': 'Nashik',
            'sub_district': 'Dindori',
            'village': 'Janori',
            'survey_khasra_number': '112/4B',
            'area_hectares': 3.50,
            'latitude': 20.1983,
            'longitude': 73.8821,
            'soil_type': Farm.SoilType.BLACK,
            'soil_ph': 6.85,
            'nitrogen_n': 240.0,
            'phosphorus_p': 22.5,
            'potassium_k': 295.0,
            'organic_carbon_pct': 0.65,
            'irrigation_source': Farm.IrrigationSource.BOREWELL,
            'irrigation_method': Farm.IrrigationMethod.DRIP,
            'has_water_storage': True,
            'previous_crop': 'Soybean',
            'current_status': 'Active'
        }
    )
    print(f"[{'Created' if created else 'Exists'}] Farm: {farm.farm_name}")

    # Initial Soil Record
    from datetime import date
    SoilRecord.objects.get_or_create(
        farm=farm,
        test_date=date(2025, 4, 15),
        defaults={
            'lab_name': 'District Soil Testing Laboratory, Krishi Vigyan Kendra Nashik',
            'sample_id': 'KVK-NSK-2025-04-129',
            'ph': 6.85,
            'ec_salinity': 0.35,
            'organic_carbon_pct': 0.65,
            'nitrogen_kg_ha': 240.0,
            'phosphorus_kg_ha': 22.5,
            'potassium_kg_ha': 295.0,
            'zinc_ppm': 0.75,
            'iron_ppm': 5.2,
            'remarks': 'Soil profile is fertile black clay loam with balanced macronutrients. Suitable for Kharif Soybean and Rabi Wheat.'
        }
    )

    # Welcome Notification
    Notification.objects.get_or_create(
        recipient=farmer_user,
        title='Welcome to AGROVISION',
        defaults={
            'message': 'Welcome to AGROVISION! Your farm "Sahyadri Valley Farms" is registered. Pre-sowing yield prediction and weather alerts are now active.',
            'notification_type': Notification.NotificationType.SYSTEM,
            'action_url': '/dashboard/farms'
        }
    )

def main():
    print("--- Seeding AGROVISION Master Data ---")
    seed_crops()
    seed_seasons()
    seed_districts()
    seed_users_and_farms()
    print("--- Seeding Completed Successfully ---")

if __name__ == '__main__':
    main()
