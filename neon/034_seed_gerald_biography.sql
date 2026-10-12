-- ============================================================================
-- Seed Gerald Kithinji M'Ikunyua Biography & Update Member Profile
-- Family: M'Ikunyua Family ('a0000000-0000-0000-0000-000000000001')
-- Member: Gerald Kithinji M'Ikunyua ('b0000000-0000-0000-0001-000000000001')
-- ============================================================================

-- 1. Ensure Member Details are Enriched
UPDATE public.members
SET date_of_birth = '1937-08-14',
    birth_place = 'Kinoru Village, Meru, Kenya',
    occupation = 'Senior Chief, Animal Production Officer & Agricultural Pioneer',
    bio = 'Patriarch of the M''Ikunyua family, pioneering agriculturalist, Senior Chief of Ntima location, and lifelong public servant who transformed dairy farming, cooperatives, and community development across Meru and Kenya.',
    is_founder = true,
    professional_title = 'Senior Chief / Assistant Animal Production Officer',
    current_organization = 'Ministry of Agriculture & Livestock / Office of the President',
    location = 'Kinoru, Meru, Kenya'
WHERE id = 'b0000000-0000-0000-0001-000000000001';

-- 2. Insert or Update Gerald M'Ikunyua's Comprehensive Biography
INSERT INTO public.biographies (
    id,
    family_id,
    member_id,
    professional_summary,
    early_life_background,
    education,
    career_journey,
    public_service_chieftainship,
    agricultural_pioneering,
    international_travels,
    historical_context,
    cultural_heritage,
    adversity_and_resilience,
    professional_achievements,
    areas_of_expertise,
    community_contributions,
    personal_philosophy,
    legacy,
    personal_life,
    updated_at
) VALUES (
    'd0000000-0000-0000-0001-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0001-000000000001',
    'Gerald Kithinji M''Ikunyua is the founding patriarch of the M''Ikunyua family, an esteemed agricultural pioneer, and an influential public administrator in Meru and the wider Eastern and Rift Valley provinces of Kenya. Rising from humble beginnings as a herdsboy during the Second World War and Mau Mau emergency, he trained in animal husbandry, veterinary science, and dairy technology across Kenya, India, the United Kingdom, the United States, and Canada. He famously served as the 6th Senior Chief of Ntima Location since the colonial era, acted as District Officer for North Imenti, and served for decades as an Assistant Animal Production Officer in the Ministry of Livestock. He is widely celebrated for introducing exotic grade dairy cattle to Meru, establishing vital dairy and beekeeping cooperatives that thrive to this day, spearheading educational infrastructure (such as raising funds for the 8-4-4 system and rolling out Nyayo Milk in schools), and exemplifying unyielding integrity and resilience in the face of local political adversity.',

    'Born on August 14th, 1937, in Kinoru village, Meru, Gerald was the third son born to Salome Gateti CioMuga and Nkuruu M''Mbwiria. His father was a World War I veteran deployed to Dodoma, Tanzania, and had two wives, each blessed with three sons. Growing up in an environment primarily centered on grazing cows and goats with subsistence farming of bananas, yams, millet, and ncabi (black beans in Kithoka, 5 km away), Gerald’s childhood was shaped by pastoral duties and traditional communal life. At around age three, while left in his grandmother''s care, he suffered severe burns after falling into the open three-stone hearth (riiko); with no modern hospitals nearby, his life and head were saved by traditional treatments using rabbit fur provided by his aunt Ciomero. In early childhood, he herded sheep and goats wrapped only in a light blanket for warmth, foraging for bush fruits, sharing nyungu ya mwanki (warm embers pots) during cold July mornings, and trapping ndera birds using usembu concoctions.',

    'Gerald’s formal education began in January 1948 after persistently pleading with his father, who sold a goat for four shillings to pay his initial fees. He attended Mwirine Primary School, walking 5 km barefoot each morning with a slate and chalk, washing his single shirt and pair of shorts on Saturdays using riverside plants. In 1949, he transferred closer to home at DEB Mwithumwiru Primary School. In 1951, he sat for the Common Entrance Examination, scoring fourth in the region (behind future professor Mutuma Mugambi), qualifying for junior secondary boarding at Kaaga Boys Intermediate School (1952–1955), where he excelled in Rural Science, debate, and choir as choir master, paying his Ksh 35/year school fees by weeding coffee for Ksh 4 per month.

After passing his Kenya African Preliminary Examination (KAPE) in 1955, he was admitted to Embu Agricultural Technical College. In 1956, he completed nursing training at Meru Hospital (appointed trainee ward in-charge). Choosing veterinary sciences over human medicine, he earned a Certificate in Animal Health at Kabete Veterinary College (1958). In 1964, sponsored through the Ministry and Indian hosts, he studied Mahatma Gandhi cottage industries (beekeeping, honey processing, cotton) in Bombay. In 1965, he was awarded a prestigious Commonwealth Senior Scholarship (earning a high student allowance of 350 Rupees per month) to study Dairy Husbandry at Punjab Agricultural University and the National Dairy Research Institute (Southern Station, Bangalore). He later pursued advanced agricultural and town planning training at the University of Guelph (Canada), Washington D.C. (USDA), and irrigation systems at the Hebrew University in Israel.',

    'Gerald began his public service in January 1957 as a veterinary scout in Meru, managing government poultry and incubation units at Township. Following his studies at Kabete, in 1959 he was put in charge of the Githongo poultry and pig demonstration farm, and subsequently promoted to oversee veterinary services for North Imenti. In July 1975, after years of community organizing with the National Council of Churches of Kenya (NCCK) and serving as assistant settlement officer on ex-settler farms in Kitale, he was appointed Assistant Animal Production Officer in charge of Nithi Division (stationed at Chuka).

In July 1978, he transitioned to the Office of the President, succeeding Senior Chief Naaman as the Senior Chief of Ntima Location—the 6th Chief for Meru since European arrival. He underwent advanced executive administrative training at Maseno Government Training Institute and Embu DDC, often stepping in as Acting District Officer (DO) for North Imenti. Following political intrigues in 1982–1983, he briefly managed the British-sponsored National Goat Scheme at Marimanti, pioneered a large-scale commercial poultry and egg farm supplying military bases, and upon winning his landmark Public Service Commission appeal in January 1986, returned to the Ministry of Livestock as Assistant Animal Production Officer for Laikipia District (Nanyuki) until his retirement.',

    'As Senior Chief of Ntima Location from 1978 to 1982, Gerald established exemplary civil governance, community policing, and social development. He maintained rigorous local intelligence and security across Makutano and Meru town, virtually eliminating daylight vagrancy, petty crime, and illicit chang''aa brewing. During the inception of the 8-4-4 education system, he mobilized community fundraising, collecting over Ksh 600,000 for school classroom expansions deposited directly into the Ntima location development account. He oversaw the historic rollout of the Nyayo Milk distribution across primary schools. His leadership was recognized across the provincial administration, regularly earning him acting appointments as District Officer for North Imenti.',

    'Gerald was one of the central figures responsible for modernizing dairy and livestock farming in Mount Kenya East. Between 1959 and 1961, against widespread skepticism during the pre-independence transition, he tirelessly educated and convinced Meru smallholders to invest in high-yielding exotic and grade dairy cows (sold at Ksh 700 each), transforming rural household income. In Chuka and Tharaka Nithi, he revived the struggling Ciangoi Dairy Society and Muthambi Dairy Society back to full operational strength. Recognizing the economic potential of apiculture, he organized traditional honey hunters into the landmark Mutindwa jwa Mbogori Forest Beekeepers Group, securing formal government forestry permits for sustainable honey production—a cooperative that remains active decades later. In the 1980s, facing temporary retirement, he built commercial poultry houses for 300+ layers, supplying eggs across Nanyuki, Isiolo, Maua, Embu, and Kirinyaga, and winning major institutional tenders for the Kenya Army barracks in Isiolo.',

    'Across four decades, Gerald traveled extensively as an ambassador for Kenyan agriculture, the Methodist Church, and civic governance:
• India (1964–1966): Undertook a 9-day sea voyage from Mombasa to Bombay; studied rural cottage industries under Mahatma Gandhi''s self-reliance model; completed advanced Dairy Husbandry studies in Punjab and Bangalore under a Commonwealth Senior Scholarship.
• Tanzania (1969): Agricultural study and exchange tour.
• Europe & North America (1970s): Represented the Kenya Methodist Conference at the British Methodist Conference in Manchester; represented the Kenya Guernsey Society in Guernsey Islands (Channel Islands); represented the Friesian Cattle Society of Kenya in the Netherlands; raised 150,000 Dutch guilders for water irrigation at Kaaga and Tharaka Secondary Schools; studied urban planning in Boston and Washington D.C.; trained in agriculture at the University of Guelph (Canada); and evaluated irrigation technologies at the Hebrew University of Jerusalem under Kenya-Israel bilateral cooperation.
• Middle East (1985): Member of the Kenya Chamber of Commerce trade delegation to Dubai, Abu Dhabi, Oman, Qatar, and Saudi Arabia exploring export markets for Kenyan agricultural produce, coffee, and eggs.
• Britain & Channel Islands (1992): Official return visit for agricultural and pastoral conferences.',

    'Gerald lived through and directly participated in key turning points in Kenyan history:
• World War II (1939–1945): Remembers hearing the bombing of Isiolo in ~1944 and being told to take cover beneath banana groves.
• Mau Mau Emergency (1952–1956): On October 20, 1952, the state of emergency was declared. During subsequent armed attacks on Kaaga Boys Intermediate environs in 1953 and 1954, Gerald was stationed sleeping in the school hall as the designated alarm bell-ringer, tasked with waking the dormitory to take cover under beds whenever the AP guards sounded their whistles.
• Transition to Independence (1959–1963): Navigated intense political headwinds while urging farmers to adopt modern agricultural methods despite widespread rumors that independence would bring free cattle.
• Transition of Power (August 1978): Just one month after assuming the Senior Chieftainship of Ntima, President Jomo Kenyatta passed away on August 12, 1978. Gerald managed local peace and order in Meru during days of profound national uncertainty as businesses shuttered and President Daniel arap Moi took office.
• 1980s Politics: Navigated fierce district rivalries between veteran Cabinet Minister Jackson Angaine and Nteere Mbogori, upholding professional civil service neutrality despite partisan pressures.',

    'Gerald was deeply grounded in Meru heritage. He was circumcised in December 1951, entering into the Meru age-set following the Kaburu (Nkunja) / Ntalu Mbaya Ntiwiko generation. In 1961, he made a courageous cultural statement by purchasing his first heifer from Kitale stock while still a bachelor, defying the entrenched Kimeru customary belief that buying cattle prior to marriage would render a man childless. His bold decision dispelled the superstition among his peers and initiated a lifetime of prosperous herd ownership.',

    'Gerald''s life is a testament to perseverance against impossible odds. He overcame debilitating childhood burns without medical clinics, walked 10 kilometers daily through territorial rivalries in town, and endured painful jigger extractions and poverty to complete primary school. When expelled from Embu Technical School in 1956 alongside a third of his class, he did not despair; he immediately qualified for nursing, and later bravely confronted the matron with his folded uniform to pursue his true passion in veterinary medicine.

In February 1982, while taking his daughter Jane Kathure to Moi Girls High School in Nairobi and attending to personal affairs on authorized leave, he fell victim to local political malice during the visit of the retiring Eastern Provincial Commissioner, leading to an abrupt suspension based on five trumped-up charges. Rather than breaking, Gerald methodically appealed to the Permanent Secretary of Internal Security and the Public Service Commission. When political interference delayed his petition, he pivoted to commercial poultry farming, famously appearing on the front page of The Standard newspaper in November 1985 when egg marketing cartels blocked his harvest. In January 1986, the Public Service Commission fully vindicated him, restoring his rank, civil service standing, and 3 years of back-pay and pension rights.',

    '• 6th Senior Chief of Ntima Location and Acting DO of North Imenti.
• Pioneer of exotic grade dairy cattle in Central and North Imenti.
• Co-founder and mentor of Ciangoi Dairy Society, Muthambi Dairy Society, and Mutindwa Beekeepers Association.
• Recipient of the Commonwealth Senior Scholarship for Dairy Husbandry (India).
• Successfully fundraised 150,000 Dutch guilders for school water irrigation infrastructure in Kaaga and Tharaka.
• Spearheaded Ksh 600,000 in school infrastructure development for the introduction of the 8-4-4 education curriculum in Ntima.
• Established high-capacity commercial egg distribution networks supplying the Kenya Army barracks in Isiolo.',

    ARRAY['Public Administration', 'Animal Husbandry', 'Dairy Technology', 'Agricultural Cooperatives', 'Community Policing', 'Apiculture (Beekeeping)', 'Poultry Farming', 'Educational Infrastructure', 'International Diplomacy & Fundraising'],

    'Lifelong champion of education and rural livelihoods. Served as Chairman of Kinoru Church (1972–1974), Board Chairman for local secondary schools, lay preacher, and mentor to emerging farmers across Meru, Tharaka, and Laikipia. Mobilized school fees and community Harambees for underprivileged students, ensuring multiple generations attained secondary and technical schooling.',

    'Gerald believed passionately in self-reliance, technical skill, and unwavering moral fortitude: "Civil service belongs to the people and the government of the day, not to political factions." He modeled the dignity of agricultural labor, demonstrating that modern farming, discipline, and education are the truest pathways to African economic liberation.',

    'Remembered as a visionary builder who bridged traditional Meru life and modern Kenyan nation-building. His legacy endures in the dairy herds grazing across Mount Kenya, the beekeeping traditions of Mutindwa forest, the schools built under his chieftainship, and the generations of children and grandchildren of the M''Ikunyua family whom he inspired to seek education, travel the globe, and stand tall with courage.',

    'Married to Lily Ncurubi, whom he first met in 1956 while working at Meru Hospital while she was a student at Kaaga Girls Intermediate School. Together, they raised six children: Thomas Muriithi, Timothy Mwirigi, Jane Kathure, Martin Gitari, Betty Karwitha, and Edwin Kimathi, and are blessed with twelve grandchildren. Gerald was a keen sportsman with certificates in volleyball, lawn tennis, and hockey, and enjoyed golf and travel throughout his life.',

    now()
)
ON CONFLICT (member_id) DO UPDATE SET
    professional_summary = EXCLUDED.professional_summary,
    early_life_background = EXCLUDED.early_life_background,
    education = EXCLUDED.education,
    career_journey = EXCLUDED.career_journey,
    public_service_chieftainship = EXCLUDED.public_service_chieftainship,
    agricultural_pioneering = EXCLUDED.agricultural_pioneering,
    international_travels = EXCLUDED.international_travels,
    historical_context = EXCLUDED.historical_context,
    cultural_heritage = EXCLUDED.cultural_heritage,
    adversity_and_resilience = EXCLUDED.adversity_and_resilience,
    professional_achievements = EXCLUDED.professional_achievements,
    areas_of_expertise = EXCLUDED.areas_of_expertise,
    community_contributions = EXCLUDED.community_contributions,
    personal_philosophy = EXCLUDED.personal_philosophy,
    legacy = EXCLUDED.legacy,
    personal_life = EXCLUDED.personal_life,
    updated_at = now();
