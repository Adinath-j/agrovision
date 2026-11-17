"""
Crop Leaf Disease Knowledge Base & Diagnostic Profiles.
Smart India Hackathon 2025 - SIH25044.

Covers major foliar pathologies across 8 strategic Indian crops:
Soybean, Rice, Wheat, Cotton, Maize, Sugarcane, Groundnut, Ragi.
"""

DISEASE_PROFILES = {
    # Soybean
    "soybean_rust": {
        "crop": "Soybean",
        "disease_name": "Soybean Rust (सोयाबीन गेरुआ / तांबोरा)",
        "scientific_name": "Phakopsora pachyrhizi",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Small, water-soaked flecks that enlarge into polygon-shaped brown to reddish-brown lesions",
            "Raised pustules (uredinia) on the underside of leaves releasing powdery tan spores",
            "Rapid premature defoliation starting from the lower canopy upwards"
        ],
        "causes": [
            "Extended canopy wetness (> 6–8 hours) from frequent rain or dew",
            "Moderate temperatures between 18°C and 28°C",
            "Dense canopy planting with restricted airflow"
        ],
        "preventive_measures": [
            "Plant rust-tolerant or early-maturing soybean cultivars (e.g., JS 335, NRC 37)",
            "Adopt wider row spacing (45 cm) to facilitate sunlight penetration and canopy aeration",
            "Maintain balanced potassium nutrition to strengthen epidermal cell walls"
        ],
        "organic_remedies": [
            "Spray 5% Neem Seed Kernel Extract (NSKE) at early sign of flecking",
            "Foliar spray of Trichoderma harzianum @ 5 g/L of water during evening hours"
        ],
        "chemical_management": [
            "Hexaconazole 5% EC @ 2 ml/L of water at first observation of pustules",
            "Propiconazole 25% EC @ 1 ml/L of water or Tebuconazole 25.9% EC @ 1.25 ml/L",
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L for broad-spectrum protection"
        ],
        "safety_warning": "Observe a minimum 21-day pre-harvest interval (PHI). Always wear protective eye and skin gear when spraying fungicides."
    },
    "soybean_septoria": {
        "crop": "Soybean",
        "disease_name": "Septoria Brown Spot (सेप्टोरिया भूरा धब्बा)",
        "scientific_name": "Septoria glycines",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Irregular, dark-brown spots on upper and lower surfaces of unifoliate and lower trifoliate leaves",
            "Adjacent lesions coalesce to form large necrotic patches surrounded by chlorotic yellow halos",
            "Infected lower leaves turn yellow and drop prematurely"
        ],
        "causes": [
            "Warm, humid weather (25–30°C) with frequent rainfall splashing soil-borne spores onto leaves",
            "Continuous soybean monoculture leaving infected crop residues in the topsoil"
        ],
        "preventive_measures": [
            "Crop rotation with non-host crops like Maize or Sorghum for at least two seasons",
            "Deep summer ploughing to bury infected stubbles and fungal pycnidia",
            "Certified seed treatment with Thiram + Carbendazim (2:1) @ 3 g/kg seed"
        ],
        "organic_remedies": [
            "Foliar spray of Pseudomonas fluorescens (1% WP) @ 10 g/L of water",
            "Cow urine extract (10%) fermented with neem leaves"
        ],
        "chemical_management": [
            "Mancozeb 75% WP @ 2.5 g/L of water",
            "Carbendazim 12% + Mancozeb 63% WP @ 2 g/L of water"
        ],
        "safety_warning": "Do not spray during peak midday heat. Avoid spray drift into water bodies."
    },
    "soybean_healthy": {
        "crop": "Soybean",
        "disease_name": "Healthy Soybean Leaf (स्वस्थ सोयाबीन पत्ती)",
        "scientific_name": "Glycine max (L.) Merr.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Lush green, intact trifoliate leaves without chlorotic margins or necrotic spotting",
            "Uniform turgid leaf texture with healthy venation and vigorous photosynthetic vigour"
        ],
        "causes": [
            "Optimal soil moisture, balanced NPK fertility, and disease-free seed vigour"
        ],
        "preventive_measures": [
            "Continue scheduled irrigation and balanced nutrient management",
            "Perform weekly routine scouting for early pest emergence"
        ],
        "organic_remedies": [
            "Maintain soil organic carbon with farmyard manure or vermicompost",
            "Prophylactic foliar spray of liquid biofertilizers (Rhizobium / PSB)"
        ],
        "chemical_management": [
            "No chemical intervention required. Preserve beneficial natural predator populations."
        ],
        "safety_warning": "No action needed. Leaf shows excellent physiological health."
    },

    # Rice
    "rice_blast": {
        "crop": "Rice",
        "disease_name": "Rice Blast (धान का झोंका रोग)",
        "scientific_name": "Magnaporthe oryzae",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Spindle-shaped or elliptical lesions with grayish-white centers and dark brown or reddish borders",
            "Severe leaf blighting giving the canopy a burnt appearance (blast)",
            "Neck blast causing panicle breaking and completely chaffy grains"
        ],
        "causes": [
            "High relative humidity (> 90%) and prolonged night dew",
            "Excessive nitrogen application without proportional potassium",
            "Cloudy days with intermittent light showers (20–28°C)"
        ],
        "preventive_measures": [
            "Avoid excessive split doses of urea; apply nitrogen in 3–4 calibrated splits",
            "Seed treatment with Tricyclazole 75% WP @ 2 g/kg seed",
            "Maintain 2–5 cm standing water in paddy fields to reduce susceptibility"
        ],
        "organic_remedies": [
            "Foliar spray of Pseudomonas fluorescens @ 5 g/L at nursery and tillering stage",
            "Crushed garlic-clove extract (2%) as a natural antifungal spray"
        ],
        "chemical_management": [
            "Tricyclazole 75% WP @ 0.6 g/L of water (most effective for blast control)",
            "Isoprothiolane 40% EC @ 1.5 ml/L of water",
            "Kasugamycin 3% SL @ 2.5 ml/L of water"
        ],
        "safety_warning": "Apply early morning or late afternoon when wind speeds are below 8 km/h. Minimum 28-day PHI."
    },
    "rice_brown_spot": {
        "crop": "Rice",
        "disease_name": "Brown Spot of Rice (धान का भूरा धब्बा रोग)",
        "scientific_name": "Bipolaris oryzae",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Circular to oval dark brown spots on coleoptile, leaves, leaf sheaths, and glumes",
            "Spots possess yellow halo around dark margin; centers turn gray as spots enlarge",
            "Leads to grain discolouration and significant reduction in milling quality"
        ],
        "causes": [
            "Nutrient-deficient, poorly drained, or sandy soils lacking potassium and zinc",
            "Drought stress or intermittent water stress during vegetative stage"
        ],
        "preventive_measures": [
            "Correct soil potash and zinc deficiency based on soil test results",
            "Seed soaking in hot water at 52–54°C for 10 minutes or Carbendazim 2 g/kg",
            "Maintain continuous shallow irrigation to avoid soil cracking"
        ],
        "organic_remedies": [
            "Foliar spray of vermiwash (10%) fortified with cow urine",
            "Soil application of Trichoderma viride enriched FYM @ 2.5 kg/ha"
        ],
        "chemical_management": [
            "Mancozeb 75% WP @ 2 g/L of water",
            "Propiconazole 25% EC @ 1 ml/L of water at booting stage"
        ],
        "safety_warning": "Wear protective rubber gloves and mask. Do not wash spray equipment near domestic wells."
    },
    "rice_healthy": {
        "crop": "Rice",
        "disease_name": "Healthy Rice Leaf (स्वस्थ धान पत्ती)",
        "scientific_name": "Oryza sativa L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Vibrant green, clean erect leaf blades without lesions, spotting, or leaf tip necrosis",
            "Robust tillering vigour and healthy root-shoot vascular transport"
        ],
        "causes": [
            "Optimal water depth, balanced N-P-K-Zn fertilization, and favourable sunlight"
        ],
        "preventive_measures": [
            "Continue alternate wetting and drying (AWD) water management to aerate root zone",
            "Scout for stem borer dead hearts or leaf folder folds"
        ],
        "organic_remedies": [
            "Incorporate Azolla or blue-green algae to enrich biological nitrogen fixation"
        ],
        "chemical_management": [
            "No chemical intervention required."
        ],
        "safety_warning": "Leaf is completely healthy. Continue standard agronomic practices."
    },

    # Wheat
    "wheat_stripe_rust": {
        "crop": "Wheat",
        "disease_name": "Stripe / Yellow Rust of Wheat (गेहूं का पीला रतुआ)",
        "scientific_name": "Puccinia striiformis f. sp. tritici",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Bright yellow-orange powdery pustules (uredinia) arranged in distinct parallel stripes along leaf veins",
            "Leaves turn chlorotic and desiccate rapidly as pustules break through epidermis",
            "Severe shrivelling of developing wheat grains"
        ],
        "causes": [
            "Cool, moist weather (10–18°C) accompanied by dense morning fog and dew",
            "Cultivation of susceptible legacy varieties without gene resistance"
        ],
        "preventive_measures": [
            "Sow resistant and recommended wheat varieties (e.g., HD 2967, HD 3086, DBW 187)",
            "Timely sowing in November to avoid late-season temperature rust spikes",
            "Community monitoring in northern plains / foot-hill wheat tracts"
        ],
        "organic_remedies": [
            "Foliar application of bio-fungicide Bacillus subtilis @ 5 ml/L",
            "Dilute sour buttermilk spray (5%) as an eco-friendly preventive"
        ],
        "chemical_management": [
            "Propiconazole 25% EC (Tilt) @ 1 ml/L of water at the first sign of yellow stripes",
            "Tebuconazole 25.9% EC @ 1.25 ml/L of water",
            "Repeat spray after 15 days if cool humid conditions persist"
        ],
        "safety_warning": "Follow strictly the recommended dose. Do not spray within 30 days of expected harvest."
    },
    "wheat_healthy": {
        "crop": "Wheat",
        "disease_name": "Healthy Wheat Leaf (स्वस्थ गेहूं पत्ती)",
        "scientific_name": "Triticum aestivum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Firm, upright, dark green foliage free from pustules, chlorotic streaks, or blight spots",
            "Healthy flag leaf providing maximum photosynthate translocation to developing spikes"
        ],
        "causes": [
            "Balanced nitrogen-phosphorus fertilization and timely crown root initiation (CRI) irrigation"
        ],
        "preventive_measures": [
            "Ensure adequate soil moisture during flowering and milking stages",
            "Watch out for terminal heat stress in late February/March"
        ],
        "organic_remedies": [
            "Apply zinc sulphate (0.5%) + urea (2%) foliar spray to boost grain protein content"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Crop canopy is healthy and flourishing."
    },

    # Cotton
    "cotton_bacterial_blight": {
        "crop": "Cotton",
        "disease_name": "Cotton Bacterial Blight / Angular Leaf Spot (कपास का जीवाणु झुलसा)",
        "scientific_name": "Xanthomonas citri pv. malvacearum",
        "pathogen_type": "Bacterial",
        "is_healthy": False,
        "symptoms": [
            "Small, water-soaked polygonal spots bounded by leaf veinlets (angular leaf spot)",
            "Lesions darken to dark brown or purplish black with a greasy appearance",
            "Blackarm symptom causing stem girdling and boll rot"
        ],
        "causes": [
            "Warm and wet weather (30–35°C with high relative humidity)",
            "Wind-driven rain spreading bacterial ooze from infected seedlings or volunteer plants"
        ],
        "preventive_measures": [
            "Acid delinting of cotton seed with commercial sulfuric acid (100 ml/kg seed)",
            "Seed treatment with Streptocycline (100 ppm) + Copper Oxychloride (2 g/kg)",
            "Destruction of infected cotton stalks after final picking"
        ],
        "organic_remedies": [
            "Foliar spray of 10% cow dung slurry supernatant (filtrate) with 1% lime",
            "Neem oil spray (0.5%) to deter secondary insect vector feeding"
        ],
        "chemical_management": [
            "Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L of water",
            "Copper Hydroxide 53.8% DF @ 2 g/L of water"
        ],
        "safety_warning": "Strictly observe antibiotic dilution rates (0.1 g Streptocycline per liter). Do not exceed recommended concentrations."
    },
    "cotton_healthy": {
        "crop": "Cotton",
        "disease_name": "Healthy Cotton Leaf (स्वस्थ कपास पत्ती)",
        "scientific_name": "Gossypium hirsutum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Broad palmate leaves with deep green colour and intact laminar margins",
            "Absence of curling, mottling, vein thickening, or necrotic spots"
        ],
        "causes": [
            "Balanced fertilization with adequate magnesium and boron, optimal drip irrigation"
        ],
        "preventive_measures": [
            "Install yellow sticky traps for monitoring whiteflies and jassids",
            "Apply magnesium sulphate (1%) spray to prevent red leaf (leaf reddening) physiological disorder"
        ],
        "organic_remedies": [
            "Maintain biodiversity borders with marigold or cowpea as trap crops"
        ],
        "chemical_management": [
            "No chemical pesticide application warranted."
        ],
        "safety_warning": "Plant foliage is in optimal vegetative condition."
    },

    # Maize
    "maize_leaf_blight": {
        "crop": "Maize",
        "disease_name": "Northern Corn Leaf Blight (मक्का का उत्तरी पत्ता झुलसा)",
        "scientific_name": "Exserohilum turcicum",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Long, elliptical, grayish-green or tan lesions (cigar-shaped, 2.5 to 15 cm in length)",
            "Lesions develop dark olive-green fungal sporulation during wet humid weather",
            "Extensive blighting of leaves causing severe reduction in grain fill"
        ],
        "causes": [
            "Moderate temperatures (18–27°C) with persistent surface leaf moisture",
            "Infected crop residue on soil surface from previous maize season"
        ],
        "preventive_measures": [
            "Plant resistant single cross hybrids (e.g., DHM 117, HQPM 1)",
            "Crop rotation with legumes (Soybean, Pigeonpea) to break disease cycle",
            "Deep incorporation of maize stubbles post-harvest"
        ],
        "organic_remedies": [
            "Foliar spray of Trichoderma harzianum @ 5 g/L at knee-high stage",
            "Spray 5% aqueous leaf extract of Prosopis juliflora or Datura"
        ],
        "chemical_management": [
            "Mancozeb 75% WP @ 2.5 g/L of water at first symptom appearance",
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L of water"
        ],
        "safety_warning": "Do not harvest green cobs for sweet corn consumption within 21 days of fungicide application."
    },
    "maize_healthy": {
        "crop": "Maize",
        "disease_name": "Healthy Maize Leaf (स्वस्थ मक्का पत्ती)",
        "scientific_name": "Zea mays L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Long arching dark green leaves with prominent midrib and intact margins",
            "Clean leaf collar and sheath without stalk rot lesions or rust pustules"
        ],
        "causes": [
            "Sufficient soil zinc and nitrogen levels with uniform weed control"
        ],
        "preventive_measures": [
            "Top-dress remaining nitrogen dose at knee-high and tasseling stages",
            "Scout for Fall Armyworm (FAW) egg masses or central whorl damage"
        ],
        "organic_remedies": [
            "Place pheromone traps @ 5 per acre for armyworm monitoring"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Maize foliage is healthy and photosynthetically active."
    }
}
