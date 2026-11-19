"""
Crop Leaf Disease Knowledge Base & Diagnostic Profiles.
Smart India Hackathon 2025 - SIH25044.

Covers major foliar pathologies across 10 strategic Indian crops:
Soybean, Rice, Wheat, Cotton, Maize, Sugarcane, Groundnut, Tomato, Potato, Onion, Chickpea.
"""

DISEASE_PROFILES = {
    # ----------------------------------------------------
    # Soybean (सोयाबीन)
    # ----------------------------------------------------
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

    # ----------------------------------------------------
    # Rice (धान)
    # ----------------------------------------------------
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

    # ----------------------------------------------------
    # Wheat (गेहूं)
    # ----------------------------------------------------
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
    "wheat_leaf_rust": {
        "crop": "Wheat",
        "disease_name": "Brown / Leaf Rust of Wheat (गेहूं का भूरा रतुआ)",
        "scientific_name": "Puccinia triticina",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Small, round to oval, scattered reddish-brown pustules on upper surface of leaf blades",
            "Pustules rupture releasing dark orange-brown urediniospores without stripe arrangement",
            "Accelerated senescence of flag leaves reducing 1000-grain weight"
        ],
        "causes": [
            "Temperatures around 20–25°C accompanied by high humidity",
            "Airborne spore clouds blown from warmer central/southern tracts"
        ],
        "preventive_measures": [
            "Cultivate rust-resistant varieties (PBW 550, WH 1105, DBW 222)",
            "Avoid high nitrogen fertilizer late in the vegetative phase"
        ],
        "organic_remedies": [
            "Spray bio-formulation of Trichoderma viride @ 5 g/L",
            "Neem cake extract soil amendment at sowing"
        ],
        "chemical_management": [
            "Propiconazole 25% EC @ 1 ml/L or Hexaconazole 5% EC @ 2 ml/L",
            "Mancozeb 75% WP @ 2.5 g/L as prophylactic protector"
        ],
        "safety_warning": "Ensure complete canopy coverage, especially top flag leaves."
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

    # ----------------------------------------------------
    # Cotton (कपास)
    # ----------------------------------------------------
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
    "cotton_alternaria": {
        "crop": "Cotton",
        "disease_name": "Alternaria Leaf Spot of Cotton (कपास का अल्टरनेरिया पत्ती धब्बा)",
        "scientific_name": "Alternaria macrospora",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Small circular to irregular brown spots with concentric rings (target board appearance)",
            "Spots merge into large dead patches causing tearing of leaf lamina and shot holes",
            "Severe shedding of squares, flowers, and immature bolls"
        ],
        "causes": [
            "Intermittent rains, high humidity (> 80%), and temperatures between 25°C and 30°C",
            "Potassium deficiency in soil exacerbating foliar susceptibility"
        ],
        "preventive_measures": [
            "Adopt balanced N:P:K fertilization (100:50:50 kg/ha) with timely potassium top-dressing",
            "Remove and burn plant debris after harvest"
        ],
        "organic_remedies": [
            "Spray 5% NSKE or bio-agent Trichoderma viride @ 5 g/L",
            "Foliar spray of cow urine formulation (10%)"
        ],
        "chemical_management": [
            "Pyraclostrobin 20% WG @ 1 g/L of water or Kresoxim-methyl 44.3% SC @ 1 ml/L",
            "Mancozeb 75% WP @ 2.5 g/L of water"
        ],
        "safety_warning": "Avoid spraying when honeybees are actively foraging in cotton blooms."
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

    # ----------------------------------------------------
    # Maize (मक्का)
    # ----------------------------------------------------
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
    },

    # ----------------------------------------------------
    # Sugarcane (गन्ना)
    # ----------------------------------------------------
    "sugarcane_red_rot": {
        "crop": "Sugarcane",
        "disease_name": "Red Rot of Sugarcane (गन्ने का लाल सड़न रोग)",
        "scientific_name": "Colletotrichum falcatum",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Discolouration of third and fourth leaf from the top; leaves wither and droop down",
            "Blood-red discolouration of the internal pith with diagnostic cross-wise white patches",
            "Characteristic alcoholic acidic fermentation smell emitted from split open stalks"
        ],
        "causes": [
            "Waterlogged fields, poorly drained soils, and prolonged monsoon rains",
            "Use of infected setts taken from contaminated mother cane nurseries"
        ],
        "preventive_measures": [
            "Select seed setts strictly from certified disease-free nurseries",
            "Treat setts in moist hot air therapy (MHAT) at 54°C for 2.5 hours or carbendazim dip (0.1%)",
            "Adopt resistant cane varieties (Co 0238, Co 86032, CoM 0265)"
        ],
        "organic_remedies": [
            "Sett soaking in Trichoderma harzianum suspension @ 10 g/L for 30 minutes before planting",
            "Apply neem cake @ 250 kg/ha in planting furrows"
        ],
        "chemical_management": [
            "Drench root zone and sett furrows with Carbendazim 50% WP @ 2 g/L of water",
            "Thiophanate Methyl 70% WP @ 1.5 g/L sett dip"
        ],
        "safety_warning": "Rogue out and burn affected cane stools immediately to prevent soil contamination."
    },
    "sugarcane_healthy": {
        "crop": "Sugarcane",
        "disease_name": "Healthy Sugarcane Foliage (स्वस्थ गन्ना पत्ती)",
        "scientific_name": "Saccharum officinarum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Dense canopy of broad, emerald-green linear leaves with sharp serrated margins",
            "Robust stalk elongation with firm internodes and absence of internal rind reddening"
        ],
        "causes": [
            "Adequate nitrogen, potassium, and furrow irrigation scheduling"
        ],
        "preventive_measures": [
            "Maintain timely trash mulching to conserve root zone moisture",
            "Earthing up at 90–120 days to prevent crop lodging"
        ],
        "organic_remedies": [
            "Trash shredding and in-situ decomposition with Pleurotus fungus"
        ],
        "chemical_management": [
            "No chemical pesticide application required."
        ],
        "safety_warning": "Canopy is healthy and photosynthesizing actively."
    },

    # ----------------------------------------------------
    # Groundnut (मूंगफली)
    # ----------------------------------------------------
    "groundnut_tikka": {
        "crop": "Groundnut",
        "disease_name": "Tikka Leaf Spot of Groundnut (मूंगफली का टिक्का रोग)",
        "scientific_name": "Cercospora arachidicola / Phaeoisariopsis personata",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Early leaf spots: reddish-brown to dark brown circular spots surrounded by distinct bright yellow halos",
            "Late leaf spots: nearly circular, smaller, carbon-black spots on both leaf surfaces without prominent halo",
            "Extensive premature defoliation leading to light pods and immature kernel fill"
        ],
        "causes": [
            "Prolonged humid weather (RH > 85%) with leaf surface wetness and temperatures of 25–28°C",
            "Infected haulms and groundnut crop residues left in field from preceding season"
        ],
        "preventive_measures": [
            "Sow tolerant varieties like TAG 24, TG 37A, Kadiri 6",
            "Seed treatment with Trichoderma viride @ 4 g/kg or Mancozeb @ 2 g/kg seed",
            "Intercropping with pigeonpea or pearl millet (4:1 ratio)"
        ],
        "organic_remedies": [
            "Spray 5% aqueous leaf extract of Vitex negundo or Neem leaf extract",
            "Foliar spray of Pseudomonas fluorescens @ 10 g/L at 30 and 45 DAS"
        ],
        "chemical_management": [
            "Chlorothalonil 75% WP @ 2 g/L of water (protective contact fungicide)",
            "Tebuconazole 25.9% EC @ 1.25 ml/L or Difenoconazole 25% EC @ 1 ml/L",
            "Carbendazim 12% + Mancozeb 63% WP @ 2 g/L"
        ],
        "safety_warning": "Spray coverage must reach lower leaves where early infection takes hold. 21-day PHI."
    },
    "groundnut_healthy": {
        "crop": "Groundnut",
        "disease_name": "Healthy Groundnut Leaf (स्वस्थ मूंगफली पत्ती)",
        "scientific_name": "Arachis hypogaea L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Vibrant green pinnate leaves (4 leaflets) with smooth borders and zero spotting",
            "Healthy peg initiation and vigorous gynophore penetration into loose soil"
        ],
        "causes": [
            "Balanced soil gypsum (calcium + sulfur) application and optimal moisture during flowering"
        ],
        "preventive_measures": [
            "Apply gypsum @ 500 kg/ha at flowering (30–35 DAS) for pod development",
            "Maintain light earthing up to assist peg entry"
        ],
        "organic_remedies": [
            "Apply Rhizobium inoculant to enhance root nodulation"
        ],
        "chemical_management": [
            "No chemical intervention required."
        ],
        "safety_warning": "Crop is healthy with optimal leaf surface area."
    },

    # ----------------------------------------------------
    # Tomato (टमाटर)
    # ----------------------------------------------------
    "tomato_early_blight": {
        "crop": "Tomato",
        "disease_name": "Early Blight of Tomato (टमाटर का अगेती झुलसा)",
        "scientific_name": "Alternaria solani",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Dark brown to black necrotic spots with characteristic concentric rings (target board rings)",
            "Yellowing (chlorosis) of tissue surrounding spots on older lower leaves first",
            "Stem cankers and dark leathery sunken rot at the fruit stem end"
        ],
        "causes": [
            "Warm temperatures (24–29°C) accompanied by heavy dew, rainfall, or overhead sprinkler irrigation",
            "Soil splash carrying spores onto lower tomato leaves"
        ],
        "preventive_measures": [
            "Stake tomato plants and prune bottom 30 cm foliage to prevent soil splash",
            "Use drip irrigation instead of overhead sprinklers to keep canopy dry",
            "Practice 3-year crop rotation avoiding solanaceous crops (Potato, Brinjal, Chilli)"
        ],
        "organic_remedies": [
            "Foliar spray of Bacillus subtilis @ 5 ml/L of water",
            "Copper soap (copper octanoate) bio-fungicide @ 3 ml/L"
        ],
        "chemical_management": [
            "Mancozeb 75% WP @ 2.5 g/L or Chlorothalonil 75% WP @ 2 g/L",
            "Azoxystrobin 23% SC @ 1 ml/L or Difenoconazole 25% EC @ 1 ml/L"
        ],
        "safety_warning": "Observe a 5 to 7 day pre-harvest interval on ripe tomato fruit."
    },
    "tomato_healthy": {
        "crop": "Tomato",
        "disease_name": "Healthy Tomato Leaf (स्वस्थ टमाटर पत्ती)",
        "scientific_name": "Solanum lycopersicum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Lush compound leaflets with crisp serrated margins and deep chlorophyll pigmentation",
            "Healthy apical growing tips with active flower clusters and fruit set"
        ],
        "causes": [
            "Balanced calcium and potassium nutrition preventing blossom end rot, optimal drip watering"
        ],
        "preventive_measures": [
            "Regular trellis staking and sucker pruning",
            "Monitor for whitefly vectors and leaf miner trails"
        ],
        "organic_remedies": [
            "Foliar spray of 1% seaweed extract to stimulate vegetative vigor"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Foliage and vine growth are in prime health."
    },

    # ----------------------------------------------------
    # Potato (आलू)
    # ----------------------------------------------------
    "potato_late_blight": {
        "crop": "Potato",
        "disease_name": "Late Blight of Potato (आलू का पछेती झुलसा)",
        "scientific_name": "Phytophthora infestans",
        "pathogen_type": "Oomycete / Fungal-like",
        "is_healthy": False,
        "symptoms": [
            "Water-soaked, pale to dark green irregular lesions near leaf margins and tips",
            "Lesions enlarge rapidly into dark brown to purplish-black necrotic blights",
            "Delicate white cottony mildew growth visible on underside of leaves in morning dew",
            "Foul decaying odor and complete canopy collapse within 4 to 7 days"
        ],
        "causes": [
            "Cool, moist weather (15–20°C) with persistent relative humidity above 90%",
            "Infected seed tubers carrying dormant mycelium from cold storage"
        ],
        "preventive_measures": [
            "Plant certified disease-free seed tubers from trusted seed agencies",
            "Earthing up with high soil ridges to prevent wash-down of sporangia onto developing tubers",
            "De-haulming (cutting off haulms) 10–12 days prior to harvest to protect tubers"
        ],
        "organic_remedies": [
            "Prophylactic foliar spray of Trichoderma harzianum @ 10 g/L",
            "Bordeaux mixture (1%) spray at pre-bloom stage"
        ],
        "chemical_management": [
            "Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2.5 g/L of water (systemic curative)",
            "Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L of water",
            "Dimethomorph 50% WP @ 1 g/L of water"
        ],
        "safety_warning": "Late blight spreads explosively; initiate protective spray immediately upon cloudy-foggy weather forecast."
    },
    "potato_healthy": {
        "crop": "Potato",
        "disease_name": "Healthy Potato Leaf (स्वस्थ आलू पत्ती)",
        "scientific_name": "Solanum tuberosum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Sturdy, dark green pinnate leaves with clean laminar surfaces and absence of edge blighting",
            "Robust vegetative canopy supporting vigorous underground stolon and tuber bulking"
        ],
        "causes": [
            "Adequate potassium fertilization, clean seed tubers, and optimal sprinkler/drip scheduling"
        ],
        "preventive_measures": [
            "Timely top dressing of nitrogen and earthing-up at 30–35 days",
            "Scout for aphid vectors that transmit potato leafroll virus"
        ],
        "organic_remedies": [
            "Soil drenching with humic acid (12%) to enhance root stolon proliferation"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Canopy is healthy and thriving."
    },

    # ----------------------------------------------------
    # Onion (प्याज)
    # ----------------------------------------------------
    "onion_purple_blotch": {
        "crop": "Onion",
        "disease_name": "Purple Blotch of Onion (प्याज का बैंगनी धब्बा रोग)",
        "scientific_name": "Alternaria porri",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Small, sunken, whitish flecks on leaves and seed stalks that enlarge rapidly",
            "Lesions develop distinct purple to reddish-purple centers surrounded by yellow halo",
            "Infected leaves girdle, collapse from the lesion point, and dry out completely"
        ],
        "causes": [
            "Warm and humid weather (21–30°C with 80–90% relative humidity)",
            "Thrips (Thrips tabaci) feeding punctures creating entry wounds for fungal spores"
        ],
        "preventive_measures": [
            "Control onion thrips using blue sticky traps and neem oil spray (3 ml/L)",
            "Crop rotation with non-allium crops for at least 3 years",
            "Dip seedlings in Carbendazim solution (1 g/L) for 15 minutes before transplanting"
        ],
        "organic_remedies": [
            "Foliar spray of 5% cow urine fermented with vitex leaves",
            "Spray Trichoderma viride @ 5 g/L with sticker (Sandovit 0.5 ml/L)"
        ],
        "chemical_management": [
            "Mancozeb 75% WP @ 2.5 g/L + sticker @ 0.5 ml/L of water",
            "Tebuconazole 25.9% EC @ 1.25 ml/L or Difenoconazole 25% EC @ 1 ml/L",
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L"
        ],
        "safety_warning": "Always add a non-ionic wetting sticker (e.g., Sandovit or Teepol) due to waxy nature of onion foliage."
    },
    "onion_healthy": {
        "crop": "Onion",
        "disease_name": "Healthy Onion Foliage (स्वस्थ प्याज पत्ती)",
        "scientific_name": "Allium cepa L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Upright, tubular, waxy blue-green leaves with crisp tips and absence of purple or silver flecks",
            "Firm neck development and uniform bulb expansion"
        ],
        "causes": [
            "Balanced sulfur and potash application, well-drained raised beds, and thrips management"
        ],
        "preventive_measures": [
            "Apply elemental sulfur @ 25 kg/ha to enhance pungency and disease resistance",
            "Stop irrigation 10–15 days before harvest to ensure proper field curing"
        ],
        "organic_remedies": [
            "Spray vermiwash (5%) every 20 days during vegetative bulbing"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Foliage is completely disease-free."
    },

    # ----------------------------------------------------
    # Chickpea / Gram (चना)
    # ----------------------------------------------------
    "chickpea_ascochyta": {
        "crop": "Gram",
        "disease_name": "Ascochyta Blight of Chickpea (चने का अंगमारी / झुलसा रोग)",
        "scientific_name": "Ascochyta rabiei",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "symptoms": [
            "Circular to elongated lesions on leaves, stems, and pods with dark brown borders",
            "Minute dark brown to black fruiting bodies (pycnidia) arranged in concentric rings inside spots",
            "Stem girdling causing terminal branch breakage and complete patch-wise plant wilting"
        ],
        "causes": [
            "Cool and cloudy weather (15–22°C) with persistent winter rains and relative humidity > 80%",
            "Infected seed or fungal survival in chickpea straw left on soil"
        ],
        "preventive_measures": [
            "Grow blight-tolerant varieties (e.g., PBG 5, GNG 469, CSG 8962)",
            "Seed treatment with Captan or Thiram @ 3 g/kg seed",
            "Deep summer ploughing and wide spacing (30 x 10 cm)"
        ],
        "organic_remedies": [
            "Seed inoculation with Trichoderma harzianum @ 10 g/kg seed",
            "Spray 5% aqueous leaf extract of Prosopis juliflora"
        ],
        "chemical_management": [
            "Chlorothalonil 75% WP @ 2 g/L of water at first symptom onset",
            "Carbendazim 12% + Mancozeb 63% WP @ 2 g/L of water"
        ],
        "safety_warning": "Do not enter sprayed field for 24 hours. Ensure pod-level spray penetration."
    },
    "chickpea_healthy": {
        "crop": "Gram",
        "disease_name": "Healthy Chickpea Foliage (स्वस्थ चना पत्ती)",
        "scientific_name": "Cicer arietinum L.",
        "pathogen_type": "None",
        "is_healthy": True,
        "symptoms": [
            "Feathery pinnate compound leaves with glandular hairs secreting natural malic acid",
            "Vigorous branching with healthy floral buds and absence of stem cankers"
        ],
        "causes": [
            "Residual soil moisture, starter nitrogen and phosphorus, and well-aerated light loam soil"
        ],
        "preventive_measures": [
            "Nipping (pinching) shoot tips at 30–40 DAS to promote profuse lateral branching",
            "Install bird perches @ 20 per acre for natural Helicoverpa caterpillar predation"
        ],
        "organic_remedies": [
            "Spray 5% neem extract at flower initiation stage"
        ],
        "chemical_management": [
            "No chemical intervention needed."
        ],
        "safety_warning": "Plant canopy is healthy and flourishing."
    }
}
