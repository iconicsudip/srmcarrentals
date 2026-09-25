import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BlogPostSeed {
  title: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  featuredImage: string;
  tags: string[];
  publishDate: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

const BLOGS: BlogPostSeed[] = [
  {
    title: "Why Self-Drive Cars Are Better Than Taxi Services",
    slug: "why-self-drive-cars-are-better-than-taxi-services",
    categorySlug: "travel-tips",
    categoryName: "Travel Tips & Guides",
    featuredImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
    tags: ["Self Drive", "Travel Tips", "Car Rental", "Rajasthan Tourism"],
    publishDate: "2026-05-22T09:00:00.000Z",
    excerpt: "Explore why modern travelers prefer self-drive car rentals over traditional taxis for freedom, privacy, cost savings, and uncompromised flexibility.",
    content: `
When planning a road trip or exploring a heritage destination like Udaipur, Jaipur, or Mount Abu, the way you commute shapes your entire travel experience. For decades, traditional tourist taxis and app-based cabs were the default choice. However, in recent years, **self-drive car rentals have revolutionized modern travel**, quickly becoming the preferred option for vacationers, families, and business travelers alike.

Here is an in-depth breakdown of why choosing a self-drive rental from SRM Car Rentals provides a far superior travel experience compared to hiring conventional taxi services.

---

### 1. Complete Freedom & Itinerary Flexibility

When you hire a taxi, your itinerary is inevitably tethered to someone else's schedule. Drivers often prefer fixed routes, hesitate to take offbeat diversions, and push for quick wrap-ups to meet their daily quotas.

With a **self-drive rental**:
- **You command the clock:** Want to wake up at 5:00 AM to catch the sunrise over Lake Pichola or stay past dusk atop Sajjangarh Monsoon Palace? You never have to negotiate waiting charges.
- **Spontaneous detours:** Notice a picturesque roadside dhaba, an ancient stepwell, or a scenic mountain pass? Pull over anytime without hesitation.
- **No rushed sightseeing:** Spend two hours admiring the stone carvings at Ranakpur or linger at Fateh Sagar Lake—your trip moves at your natural pace.

---

### 2. 100% Privacy for Family, Friends & Couples

Vacations are about spending quality time with the people who matter most. Having a stranger behind the wheel often limits how freely you talk, laugh, or share personal moments.

- **Private conversations stay private:** Whether discussing business matters or sharing laughs with family, enjoy absolute confidentiality.
- **Your music, your vibe:** Plug into Apple CarPlay or Android Auto and curate your road trip soundtrack without feeling self-conscious.
- **Comfort & relaxation:** Stop for impromptu breaks, let the kids nap quietly in the back seats, and adjust air conditioning zones to your personal preference.

---

### 3. Transparent & Cost-Effective Pricing

Many travelers assume hiring a taxi is cheaper, but unexpected hidden costs quickly add up:
- **Taxis incur cumulative fees:** Driver batta (daily allowances), night halts, waiting charges per hour, and outstation return surcharges often inflate the final bill by 40–60%.
- **Self-drive simplicity:** SRM Car Rentals operates on **transparent 24-hour rental packages** with generous daily kilometer allowances (300 km/day). For 3 to 7-day trips, renting an economical hatchback or spacious SUV costs significantly less per day than continuous taxi hiring.

---

### 4. Zero Driver Dependency & No Surge Pricing

Nothing spoils a holiday faster than waiting curbside for a cab that cancels last-minute, or having a driver who drives erratically or insists on visiting overpriced souvenir emporiums where they earn commissions.

With self-drive:
- **Zero cancellation anxiety:** Your reserved vehicle is sanitized, fueled, and parked at your doorstep or terminal awaiting your arrival.
- **Consistent driving comfort:** You drive with your own habits, ensuring your loved ones feel safe on winding ghat roads and high-speed expressways.
- **Zero surge rates:** Whether it rains, festivals peak, or midnight strikes, your pre-booked rental rate remains completely locked.

---

### 5. Dealership-Grade Fleet & Superior Hygiene

Every vehicle in the SRM Car Rentals self-drive fleet undergoes thorough multi-point mechanical inspections and deep interior sanitization prior to handover:
- Comprehensive all-India commercial permits.
- Comprehensive vehicle insurance coverage.
- Factory safety features including dual front airbags, ABS with EBD, and electronic stability programs.

---

### Summary Checklist: Self-Drive vs Taxi

| Feature | Self-Drive Rental (SRM) | Traditional Taxi Service |
| :--- | :--- | :--- |
| **Schedule Control** | 100% Autonomous | Restricted to driver |
| **Privacy** | Complete cabin privacy | Third-party driver present |
| **Detours & Stops** | Unlimited, spontaneous | Usually incurs extra charges |
| **Luggage Space** | Full boot & back seat usage | Often shared or limited |
| **Vehicle Choice** | Choose exact car, model & color | Dispatched at company discretion |
| **Multi-day Cost** | Economical fixed daily rate | Multiplies with hours, halts & driver batta |

### Start Your Journey With SRM Car Rentals
Experience the unmatched joy of commanding the open road. Browse our fleet of compact hatchbacks, luxury sedans, and rugged 4x4 SUVs with doorstep handover across Udaipur, Jaipur, and Navsari.
`,
    metaTitle: "Why Self-Drive Cars Are Better Than Taxi Services | SRM Car Rentals",
    metaDescription: "Discover why self-drive car rental is superior to taxi services in Rajasthan. Enjoy freedom, privacy, transparent daily rates, and zero driver dependency.",
    metaKeywords: "self drive vs taxi, why choose self drive, car rental advantages, self drive benefits rajasthan, rent a car udaipur",
  },
  {
    title: "Top 10 Places to Visit in Udaipur by Rental Car",
    slug: "top-10-places-to-visit-in-udaipur-by-rental-car",
    categorySlug: "destinations",
    categoryName: "Destinations & Sightseeing",
    featuredImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80&auto=format&fit=crop",
    tags: ["Udaipur", "Sightseeing", "Road Trip", "Rajasthan Destinations"],
    publishDate: "2026-05-21T10:30:00.000Z",
    excerpt: "Discover the top 10 iconic landmarks, palace viewpoints, and hidden lakes in Udaipur best explored with your own self-drive rental car.",
    content: `
Known as the **City of Lakes** and the Venice of the East, Udaipur is renowned for its grand Rajputana palaces, tranquil lakes, and rolling Aravali hilltops. While the historic inner city is best traversed on foot, Udaipur’s most breathtaking viewpoints, royal fortresses, and scenic lakeside drives are spread out across hills and valleys.

Renting a self-drive car gives you the freedom to cruise these scenic ghats without worrying about auto-rickshaw bargaining or cab availability. Here is our curated guide to the **Top 10 Places to Visit in Udaipur by Rental Car**.

---

### 1. City Palace & Lake Pichola
Rising majestically above Lake Pichola, the City Palace is Rajasthan's largest palace complex. 
- **Drive tip:** Park at the designated municipal parking lot near Dudh Talai or the palace entrance.
- **Highlight:** Witness the fusion of Rajasthani and Mughal architecture, followed by a serene boat ride to Jagmandir Island.

---

### 2. Sajjangarh Monsoon Palace
Perched 3,100 feet above sea level atop Bansdara Mountain, Sajjangarh offers a jaw-dropping 360-degree panorama of Udaipur city and surrounding lakes.
- **The Drive:** The steep, winding 5 km uphill ghat road is an absolute delight to drive in an SUV or automatic car.
- **Best time:** Arrive by 5:00 PM to catch one of India's most dramatic sunsets sinking behind the Aravali ranges.

---

### 3. Fateh Sagar Lake & Rani Road Drive
Fateh Sagar Lake is the beating heart of Udaipur's local culture. 
- **The Drive:** Rani Road wraps around the lake's western perimeter for 6 kilometers of uninterrupted waterfront driving.
- **Local experience:** Pull over near the Mumbai Market circle in the evening for steaming kulhad coffee and spicy local snacks.

---

### 4. Bahubali Hills & Badi Lake
Located 12 km northwest of central Udaipur, Badi Lake is a quiet, non-commercial alternative to Fateh Sagar.
- **The Trek:** A 15-minute gentle climb up Bahubali Hills rewards you with a panoramic view reminiscent of European alpine lakes.
- **Drive tip:** The country roads leading to Badi Lake pass through rustic villages and lush green agricultural fields.

---

### 5. Kumbhalgarh Fort (The Great Wall of India)
Located 84 km from Udaipur, Kumbhalgarh Fort boasts the second-longest continuous wall in the world (36 km), second only to the Great Wall of China.
- **The Road Trip:** The 2-hour drive via NH58 and SH32 features smooth tarmac flanked by Aravali mountain passes.
- **Must-see:** The evening light and sound show illuminating the colossal fortifications.

---

### 6. Ranakpur Jain Temple
Set amidst dense teak forests 90 km from Udaipur, the 15th-century Ranakpur Temple is celebrated for its 1,444 uniquely carved marble pillars.
- **The Route:** Pair this with your Kumbhalgarh visit. The winding descent down the mountain pass offers lush valley views.

---

### 7. Haldighati Historical Battlefield
The historic battleground where Maharana Pratap and his loyal steed Chetak fought in 1576 lies just 40 km from Udaipur.
- **Highlights:** Visit the Chetak Smarak memorial, the Haldighati Museum, and pick up genuine rose water and gulkand produced by local farms.

---

### 8. Rayta Hills Scenic Ghat Drive
A favorite weekend secret among Udaipur locals, Rayta Hills features terraced green valleys and rolling switchback roads.
- **The Vibe:** Often compared to the Scottish Highlands during the monsoon season (July–October), the drive itself is the destination.

---

### 9. Saheliyon Ki Bari (Garden of the Maids)
Located along the northern edge of the city, this serene 18th-century royal garden features marble elephants, lotus pools, and lush fountains powered purely by water pressure from Fateh Sagar Lake.
- **Parking:** Dedicated front parking makes it an effortless stop on your city itinerary.

---

### 10. Karni Mata Ropeway & Dudh Talai Lake
Situated just behind the City Palace, Dudh Talai offers tranquil musical fountain gardens and a cable car ropeway up to Machhla Magra hill for sweeping night vistas over illuminated heritage palaces.

---

### Recommended Vehicle for Udaipur Sightseeing
For navigating narrow city approaches while effortlessly conquering steep ghats like Sajjangarh and Kumbhalgarh, we recommend:
- **Compact SUVs:** Hyundai Venue, Maruti Fronx, or Kia Seltos
- **Rugged Adventurers:** Mahindra Thar 4x4 or Scorpio N
- **Family Cruisers:** Toyota Innova Crysta or Maruti Ertiga

Book your self-drive car with SRM Car Rentals today with doorstep handover at Udaipur Railway Station or Maharana Pratap Airport.
`,
    metaTitle: "Top 10 Places to Visit in Udaipur by Rental Car | SRM Car Rentals",
    metaDescription: "Plan your ultimate Udaipur sightseeing road trip. Explore City Palace, Sajjangarh, Fateh Sagar, Kumbhalgarh Fort, and Bahubali Hills by self-drive car.",
    metaKeywords: "places to visit in udaipur by car, udaipur road trip itinerary, sajjangarh drive, kumbhalgarh fort road trip, rent car in udaipur",
  },
  {
    title: "Exploring Rajasthan by Road: The Ultimate Self-Drive Itinerary",
    slug: "exploring-rajasthan-by-road-the-ultimate-self-drive-itinerary",
    categorySlug: "road-trips",
    categoryName: "Road Trips & Routes",
    featuredImage: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=80&auto=format&fit=crop",
    tags: ["Rajasthan", "Road Trip", "Itinerary", "Self Drive", "Heritage"],
    publishDate: "2026-05-18T11:00:00.000Z",
    excerpt: "A comprehensive 7-day royal road trip circuit covering Udaipur, Jodhpur, Jaisalmer, and Jaipur with route tips, toll guidelines, and must-see stops.",
    content: `
Rajasthan is India’s ultimate road-tripping paradise. With four-lane national expressways cutting through desert sands, ancient mountain passes through the Aravalis, and royal palaces on the horizon, driving yourself through the Land of Kings is an experience second to none.

Here is our proven **7-Day Royal Rajasthan Road Trip Itinerary**, designed specifically for self-drive travelers seeking freedom, comfort, and authenticity.

---

### Day 1–2: The Romantic City of Lakes — Udaipur
- **Base pickup:** Receive your SRM self-drive car directly at Udaipur Airport (UDR) or your city hotel.
- **Day 1:** Explore City Palace, enjoy a sunset boat cruise on Lake Pichola, and dinner at Ambrai Ghat.
- **Day 2:** Early morning drive up to Sajjangarh Monsoon Palace, afternoon at Bahubali Hills and Fateh Sagar Lake.
- **Stay:** Lakeside heritage haveli in Udaipur.

---

### Day 3: Udaipur to Jodhpur via Ranakpur & Kumbhalgarh (260 km / 5.5 hrs)
- **The Route:** NH58 to Kumbhalgarh Fort (The Great Wall of India), then wind through the Aravali ghats down to the marble temples of Ranakpur.
- **Arrival:** Enter the Blue City of Jodhpur by late afternoon.
- **Evening:** Stroll around the Clock Tower (Ghanta Ghar) and sample authentic Mirchi Bada.

---

### Day 4: The Sun City — Jodhpur
- **Morning:** Drive up to the mighty Mehrangarh Fort towering 400 feet above the blue-washed rooftops.
- **Afternoon:** Visit Jaswant Thada (the white marble memorial) and Umaid Bhawan Palace museum.
- **Sunset:** Savor a rooftop dinner overlooking the illuminated fortress.

---

### Day 5: Jodhpur to Jaisalmer — Heading into the Golden Sands (285 km / 5 hrs)
- **The Route:** Drive along NH11 across vast Thar desert stretches. The roads are flat, well-paved, and remarkably scenic.
- **Arrival:** Check into your desert luxury tent camp in the Sam Sand Dunes.
- **Evening:** Experience camel rides across dunes, traditional Kalbeliya folk dances, and stargazing under the desert sky.

---

### Day 6: The Golden Fortress — Jaisalmer
- **Morning:** Walk through the living medieval fortress of Sonar Qila (Jaisalmer Fort) and explore the ornate Patwon Ki Haveli.
- **Afternoon:** Visit Gadisar Lake and the abandoned ghost village of Kuldhara.

---

### Day 7: Return Journey & Handover
- Return your vehicle at any of SRM Car Rentals' authorized branches or airport handover hubs with seamless digital handover inspection.

---

### Road Trip Essentials Checklist
1. **Valid Original Driving License** (minimum 1 year old).
2. **Fastag Enabled:** All SRM vehicles come pre-equipped with Fastag for frictionless toll plaza transit.
3. **Emergency Support:** SRM offers 24/7 on-road mechanical assistance across all major Rajasthan highways.
`,
    metaTitle: "Exploring Rajasthan by Road: The Ultimate Self-Drive Itinerary | SRM",
    metaDescription: "Follow our 7-day self-drive Rajasthan road trip itinerary. Drive from Udaipur to Jodhpur and Jaisalmer with complete freedom and 24/7 road support.",
    metaKeywords: "rajasthan road trip itinerary, self drive rajasthan, udaipur to jaisalmer drive, best car rental rajasthan, royal road trip india",
  },
  {
    title: "Everything You Need to Know About Renting a Self-Drive Car in Udaipur",
    slug: "everything-you-need-to-know-about-renting-a-self-drive-car-in-udaipur",
    categorySlug: "rental-guidelines",
    categoryName: "Rental Guidelines",
    featuredImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=80&auto=format&fit=crop",
    tags: ["Rental Guide", "Documents", "Security Deposit", "Udaipur Car Hire"],
    publishDate: "2026-05-15T08:00:00.000Z",
    excerpt: "A complete step-by-step guide on documents, security deposits, 24-hour billing formula, insurance, and airport handovers in Udaipur.",
    content: `
Renting a self-drive car is one of the easiest ways to experience Rajasthan on your own terms. However, first-time renters often have questions about documentation, security deposits, fuel policies, and insurance coverage.

This comprehensive guide covers everything you need to know before booking your self-drive vehicle with SRM Car Rentals.

---

### 1. Document Requirements for Self-Drive Rental
To rent a vehicle in India, you must provide:
- **Driving License:** Valid Indian Driving License (minimum 1 year of active driving experience) or an International Driving Permit (IDP) accompanied by your foreign license.
- **Identity Proof:** Aadhaar Card, Passport, or Voter ID.
- **Minimum Age:** Renter must be at least 21 years of age.

---

### 2. How the 24-Hour Daily Rental Formula Works
Unlike traditional taxi rentals that bill by the calendar day (charging for two full days even if you pick up at 8:00 PM), SRM Car Rentals uses a **true 24-hour cycle**:
- Pick up your car on Friday at 10:00 AM and return it on Saturday by 10:00 AM = **1 Day Rental**.
- Included Kilometers: 300 km per 24-hour period.
- Extra Kilometer Charges: Clear, flat rates per kilometer (₹8–₹14 depending on car category) if you exceed the total trip allowance.

---

### 3. Refundable Security Deposit
- A nominal refundable security deposit (₹3,000 for hatchbacks, ₹5,000 for SUVs and luxury sedans) is pre-authorized or collected at vehicle delivery.
- Following digital vehicle inspection upon return, the deposit is processed back to your original payment method or bank account within 24 hours.

---

### 4. Airport & Doorstep Delivery in Udaipur
SRM Car Rentals provides direct handover at:
- **Maharana Pratap Airport (UDR):** Car delivered directly to the arrival terminal parking.
- **Udaipur City Railway Station & Rana Pratap Nagar Station.**
- **Doorstep Hotel Handover:** Any resort or hotel across Udaipur, Lake Pichola, and Mount Abu highway.

---

### 5. Fuel Policy: Same-to-Same
Our fleet operates on a transparent **Same-to-Same Fuel Policy**. You receive the vehicle with a noted fuel level and simply return it with the same level.
`,
    metaTitle: "Everything You Need to Know About Renting a Self-Drive Car in Udaipur",
    metaDescription: "Read the complete guide to self-drive car hire in Udaipur. Understand document requirements, refundable deposits, 24-hour billing, and airport delivery.",
    metaKeywords: "rent self drive car udaipur guidelines, car rental documents india, security deposit car hire, airport car handover udaipur",
  },
  {
    title: "Mahindra Thar 4x4 vs Scorpio N: Choosing the Best SUV for Rajasthan Roads",
    slug: "mahindra-thar-4x4-vs-scorpio-n-best-suv-rajasthan",
    categorySlug: "car-showcases",
    categoryName: "Fleet & Car Showcases",
    featuredImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80&auto=format&fit=crop",
    tags: ["Mahindra Thar", "Scorpio N", "SUV Comparison", "Desert Safari"],
    publishDate: "2026-05-10T12:00:00.000Z",
    excerpt: "Comparing Mahindra's iconic Thar 4x4 and the commanding Scorpio N. Which SUV is right for your Rajasthan expedition?",
    content: `
When it comes to exploring the rugged beauty of Rajasthan—from the dunes of Jaisalmer to the rocky trails of Kumbhalgarh—nothing matches the presence and capability of a Mahindra SUV.

Two of our most requested self-drive vehicles are the **Mahindra Thar 4x4** and the **Mahindra Scorpio N**. While both share robust ladder-frame DNA and commanding road presence, they cater to distinct road trip styles.

---

### Mahindra Thar 4x4: The Pure Adventure Machine
The iconic Thar is built for thrill-seekers, couples, and road trip purists:
- **Off-Road Prowess:** Shift-on-the-fly 4x4 transfer case with low range (4L), mechanical locking differential, and 226 mm ground clearance.
- **Visual Drama:** Rugged stance, high-set driving position, and open-air convertible or hard-top styling that turns heads everywhere.
- **Best for:** Couples, solo adventurers, and 3-person groups planning off-road desert drives and mountain getaways.

---

### Mahindra Scorpio N: The King of Highway Comfort
The Scorpio N redefines the traditional SUV experience with luxury refinement and 7-seater practicality:
- **Spacious 3-Row Seating:** Easily accommodates 6 to 7 passengers with generous legroom and rear air vents.
- **Long-Distance Stamina:** Modern mStallion turbo-petrol and mHawk diesel engines deliver effortless highway overtaking at 100+ km/h.
- **Premium Tech:** Sunroof, dual-zone climate control, Sony 12-speaker audio system, and 5-star Global NCAP safety rating.
- **Best for:** Families, larger travel groups, and long-distance cross-state road trips.

---

### Side-by-Side Comparison

| Feature | Mahindra Thar 4x4 | Mahindra Scorpio N |
| :--- | :--- | :--- |
| **Seating Capacity** | 4 Seater | 7 Seater |
| **Drivetrain** | 4x4 with Low Ratio | RWD / 4XPLOR |
| **Luggage Space** | Moderate (fold rear seats) | Large (3rd row fold) |
| **Highway Ride** | Firm, adventurous | Plush, planted |
| **Ideal Terrain** | Sand dunes, mountain trails | Expressways, city & hills |

Both the Mahindra Thar 4x4 and Mahindra Scorpio N are available for self-drive booking with SRM Car Rentals with full insurance and unlimited km packages.
`,
    metaTitle: "Mahindra Thar 4x4 vs Scorpio N: Best SUV for Rajasthan | SRM Car Rentals",
    metaDescription: "Compare the Mahindra Thar 4x4 and Scorpio N for your Rajasthan road trip. Evaluate seating capacity, off-road capabilities, and highway comfort.",
    metaKeywords: "thar rental udaipur, scorpio n self drive jaipur, best suv for rajasthan, thar vs scorpio n, rent 4x4 car rajasthan",
  },
  {
    title: "Top Scenic Road Trips From Udaipur: Kumbhalgarh, Mount Abu, and Ranakpur",
    slug: "top-scenic-road-trips-from-udaipur",
    categorySlug: "destinations",
    categoryName: "Destinations & Sightseeing",
    featuredImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&auto=format&fit=crop",
    tags: ["Day Trips", "Mount Abu", "Kumbhalgarh", "Ranakpur", "Scenic Drives"],
    publishDate: "2026-05-05T09:30:00.000Z",
    excerpt: "Three unforgettable day-trip drives originating from Udaipur through lush Aravali ghats, heritage forts, and mountain hill stations.",
    content: `
While Udaipur itself offers plenty to captivate travelers, the surrounding region holds some of Rajasthan's most thrilling mountain drives and historic wonders. With a self-drive car, these three world-class day excursions are within easy reach.

---

### Route 1: Udaipur to Kumbhalgarh Fort (85 km / 2 hrs)
- **The Drive:** Head north along NH58 toward Nathdwara before cutting west through the Kelwara mountain pass.
- **Highlights:** Drive right up to the fort gates, walk the colossal battlements, and visit the birthplace of Maharana Pratap at Badal Mahal.
- **Culinary Stop:** Savor fresh makki ki roti and sarson ka saag at highway dhabas along the Kelwara stretch.

---

### Route 2: Udaipur to Mount Abu (165 km / 3 hrs)
- **The Drive:** Smooth four-lane highway on NH27 leading to the 28 km winding hill climb of Mount Abu Ghat.
- **Highlights:** Dilwara Jain Temples, boating at Nakki Lake, and sunset at Honeymoon Point.
- **Vehicle Recommendation:** An automatic car with hill-hold assist makes navigating the ghat twists effortless.

---

### Route 3: Udaipur to Ranakpur via Gogunda Pass (90 km / 2.5 hrs)
- **The Drive:** Pass through the lush valleys of Gogunda, descending into the tranquil forests of the Ranakpur valley.
- **Highlights:** The architectural marvel of the 1,444-pillar Jain temple, shaded riverbanks, and wildlife spotting in the Kumbhalgarh Wildlife Sanctuary.
`,
    metaTitle: "Top Scenic Road Trips From Udaipur: Kumbhalgarh, Mount Abu, Ranakpur",
    metaDescription: "Plan scenic day trips from Udaipur by self-drive car. Explore Kumbhalgarh Fort, Mount Abu hill station, and Ranakpur temple through scenic Aravali passes.",
    metaKeywords: "road trips from udaipur, udaipur to mount abu drive, udaipur to kumbhalgarh distance, scenic drives rajasthan, self drive day trips",
  },
  {
    title: "Maruti Suzuki Fronx & Baleno: Ideal Hatchbacks for City & Highway Comfort",
    slug: "maruti-suzuki-fronx-baleno-ideal-hatchbacks-for-city-highway",
    categorySlug: "car-showcases",
    categoryName: "Fleet & Car Showcases",
    featuredImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80&auto=format&fit=crop",
    tags: ["Maruti Fronx", "Baleno", "Hatchback Rental", "Fuel Efficient"],
    publishDate: "2026-04-28T14:00:00.000Z",
    excerpt: "Why the Maruti Suzuki Fronx crossover and Baleno hatchback are the smartest and most economical choices for navigating city alleys and highways.",
    content: `
Not every road trip calls for a full-size SUV. For solo explorers, couples, and small families seeking unbeatable fuel economy and effortless parking in Udaipur's historic old city, the **Maruti Suzuki Fronx** and **Maruti Suzuki Baleno** are the undisputed champions.

---

### Why Choose a Premium Hatchback / Crossover?
1. **Effortless City Navigation:** Udaipur’s historic lanes around Jagdish Temple, Bhatiyani Chohatta, and Hathipole are narrow. A compact footprint allows you to navigate and park where larger vehicles simply cannot fit.
2. **Exceptional Mileage (20+ km/l):** With petrol prices, these modern DualJet engines ensure your fuel costs remain exceptionally low throughout your journey.
3. **Generous Boot Capacity:** Both the Fronx and Baleno feature 300+ liters of cargo space, comfortably swallowing two large check-in bags and cabin strollers.
4. **Modern Infotainment:** 7-inch to 9-inch SmartPlay Pro touchscreens with wireless Apple CarPlay and Android Auto keep navigation crisp and responsive.

Book your Maruti Baleno or Fronx self-drive rental with SRM Car Rentals today with instant digital verification.
`,
    metaTitle: "Maruti Suzuki Fronx & Baleno: Ideal Hatchbacks | SRM Car Rentals",
    metaDescription: "Rent Maruti Suzuki Fronx and Baleno self-drive in Udaipur. Outstanding 20+ km/l mileage, compact city agility, and comfortable highway ride.",
    metaKeywords: "maruti fronx rental udaipur, baleno self drive, rent hatchback rajasthan, economical car rental, maruti car hire",
  },
  {
    title: "Toyota Innova Crysta Self Drive: Why It Remains the King of Family Road Trips",
    slug: "toyota-innova-crysta-king-of-family-road-trips",
    categorySlug: "car-showcases",
    categoryName: "Fleet & Car Showcases",
    featuredImage: "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=1200&q=80&auto=format&fit=crop",
    tags: ["Innova Crysta", "7 Seater", "Family Road Trip", "Luxury MPV"],
    publishDate: "2026-04-20T10:00:00.000Z",
    excerpt: "Discover why the Toyota Innova Crysta remains the gold standard for long-distance family travel, group expeditions, and destination weddings.",
    content: `
For over two decades, the Toyota Innova badge has stood as the undisputed benchmark for multi-passenger comfort and bulletproof reliability across Indian highways. When traveling with family or carrying significant luggage, the **Toyota Innova Crysta** delivers an experience no other MPV can match.

---

### What Makes Innova Crysta the Family Favorite?
1. **Unrivaled Captain Seat Comfort:** Second-row captain chairs feature individual armrests, one-touch recline, and ample legroom that prevents fatigue even after 8 hours of continuous highway cruising.
2. **Dedicated Climate Controls for All 3 Rows:** Powerful roof-mounted AC vents guarantee every passenger stays chilled during warm Rajasthan afternoons.
3. **Dependable 2.4L Diesel Torque:** Effortless hill-climbing power on ghat passes like Mount Abu and Kumbhalgarh without needing frequent gear downshifts.
4. **Superior High-Speed Stability:** Solid ladder-frame chassis with robust suspension absorbs potholes, bridge joints, and uneven rural tarmac effortlessly.

Reserve your Toyota Innova Crysta self-drive rental with SRM Car Rentals with doorstep delivery at Udaipur, Jaipur, or Navsari.
`,
    metaTitle: "Toyota Innova Crysta Self Drive: King of Family Road Trips | SRM",
    metaDescription: "Rent Toyota Innova Crysta self-drive in Udaipur and Jaipur. Experience captain seat comfort, powerful diesel performance, and space for 7 passengers.",
    metaKeywords: "innova crysta self drive udaipur, rent 7 seater car rajasthan, family car rental, luxury mpv hire, innova rental jaipur",
  },
];

export async function seedAllBlogs() {
  console.log("🚀 Seeding all blogs from SRM Car Rentals blog-grid...");

  // 1. Get default author
  const author = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (!author) {
    console.error("❌ No active user found to assign as blog author.");
    return;
  }

  // 2. Ensure categories exist
  const categoriesMap = new Map<string, string>();
  for (const b of BLOGS) {
    if (!categoriesMap.has(b.categorySlug)) {
      const cat = await prisma.blogCategory.upsert({
        where: { slug: b.categorySlug },
        update: { name: b.categoryName, status: "ACTIVE" },
        create: { name: b.categoryName, slug: b.categorySlug, status: "ACTIVE" },
      });
      categoriesMap.set(b.categorySlug, cat.id);
      console.log(`  ✓ Blog Category ensured: ${b.categoryName} (${b.categorySlug})`);
    }
  }

  // 3. Upsert Blogs
  for (const b of BLOGS) {
    const categoryId = categoriesMap.get(b.categorySlug)!;

    const blog = await prisma.blog.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        content: b.content.trim(),
        featuredImage: b.featuredImage,
        tags: b.tags,
        publishDate: new Date(b.publishDate),
        status: "PUBLISHED",
        categoryId,
        authorId: author.id,
      },
      create: {
        title: b.title,
        slug: b.slug,
        content: b.content.trim(),
        featuredImage: b.featuredImage,
        tags: b.tags,
        publishDate: new Date(b.publishDate),
        status: "PUBLISHED",
        categoryId,
        authorId: author.id,
      },
    });

    console.log(`  ✓ Blog seeded: "${blog.title}" (/blog/${blog.slug})`);

    // 4. Upsert SEO Metadata & Setting for each blog
    const blogPath = `/blog/${blog.slug}`;
    const seoPayload = {
      path: blogPath,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      metaKeywords: b.metaKeywords,
      canonicalUrl: `https://srmcarrentals.in${blogPath}`,
      ogTitle: b.metaTitle,
      ogDescription: b.metaDescription,
      ogImage: b.featuredImage,
      ogType: "article",
      schemaType: "BlogPosting",
      aiDirectAnswer: b.excerpt,
      entityDefinition: `Travel guide and automotive publication by SRM Car Rentals: ${b.title}`,
      keyTakeaways: b.tags,
      faqPairs: [],
      sitemapPriority: 0.7,
      sitemapChangeFreq: "weekly",
      inSitemap: true,
      lastModified: new Date().toISOString(),
    };

    // Save to Setting (seo.page.*)
    await prisma.setting.upsert({
      where: { key: `seo.page.${encodeURIComponent(blogPath)}` },
      update: { value: seoPayload, group: "seo.page" },
      create: { key: `seo.page.${encodeURIComponent(blogPath)}`, value: seoPayload, group: "seo.page" },
    });

    // Save to SeoMetadata
    const existingSeo = await prisma.seoMetadata.findFirst({
      where: {
        OR: [{ blogId: blog.id }, { canonicalUrl: `https://srmcarrentals.in${blogPath}` }],
      },
    });

    const dataPayload = {
      entityType: "BLOG_POST" as const,
      entityId: blog.id,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      metaKeywords: b.metaKeywords,
      canonicalUrl: `https://srmcarrentals.in${blogPath}`,
      robotsMeta: "INDEX_FOLLOW" as const,
      ogTitle: b.metaTitle,
      ogDescription: b.metaDescription,
      ogImage: b.featuredImage,
      twitterCard: "summary_large_image",
      blogId: blog.id,
    };

    if (existingSeo) {
      await prisma.seoMetadata.update({
        where: { id: existingSeo.id },
        data: dataPayload,
      });
    } else {
      await prisma.seoMetadata.create({
        data: dataPayload,
      });
    }
  }

  // Also seed /blog hub SEO
  const blogHubPath = "/blog";
  const hubPayload = {
    path: blogHubPath,
    metaTitle: "Travel Blog & Car Rental Insights | SRM Car Rentals",
    metaDescription: "Read the latest self-drive travel guides, Udaipur road trip itineraries, SUV comparisons, and rental advice from Rajasthan's trusted fleet experts.",
    metaKeywords: "car rental blog, udaipur travel guide, rajasthan road trips, self drive tips, srm car rentals insights",
    canonicalUrl: `https://srmcarrentals.in${blogHubPath}`,
    ogTitle: "SRM Car Rentals Blog — Road Trip Stories & Travel Insights",
    ogDescription: "Guides, itineraries, and expert car rental advice for exploring Udaipur and Rajasthan by road.",
    ogImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
    ogType: "website",
    schemaType: "CollectionPage",
    aiDirectAnswer: "The SRM Car Rentals blog covers road trip itineraries, car comparisons, self-drive tips, and local guides for traveling across Rajasthan.",
    entityDefinition: "Official travel and automotive publication hub for SRM Car Rentals.",
    keyTakeaways: [
      "Expert tips for renting self-drive cars in Udaipur and Rajasthan.",
      "Scenic routes and road trip itineraries from Udaipur to Mount Abu, Jodhpur, and Kumbhalgarh.",
      "Fleet comparisons between popular hatchbacks, 4x4 SUVs, and family MPVs.",
    ],
    faqPairs: [],
    sitemapPriority: 0.8,
    sitemapChangeFreq: "weekly",
    inSitemap: true,
    lastModified: new Date().toISOString(),
  };

  await prisma.setting.upsert({
    where: { key: `seo.page.${encodeURIComponent(blogHubPath)}` },
    update: { value: hubPayload, group: "seo.page" },
    create: { key: `seo.page.${encodeURIComponent(blogHubPath)}`, value: hubPayload, group: "seo.page" },
  });

  console.log("✨ All 8 blogs and blog hub SEO successfully seeded!");
}

if (require.main === module) {
  seedAllBlogs()
    .catch((err) => {
      console.error("Error seeding blogs:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
