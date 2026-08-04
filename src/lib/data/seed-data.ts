/**
 * Shared seed / fallback catalog for Titan Safety Co.
 * Used by the app when Supabase is unavailable and by scripts/seed.ts.
 */

export type SeedCategory = {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
  sort_order: number
  active: boolean
}

export type SeedBrand = {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  website?: string
  active: boolean
}

export type SeedProduct = {
  id: string
  category_id: string
  brand_id: string
  name: string
  slug: string
  sku: string
  short_description: string
  description: string
  price: number
  compare_at_price: number | null
  cost: number
  inventory_quantity: number
  low_stock_threshold: number
  featured: boolean
  bestseller: boolean
  active: boolean
  weight: number
  shipping_class: string
  rating_avg: number
  rating_count: number
  ansi_class: string | null
  color: string | null
  size: string | null
  product_type: string
  image_url: string
  specifications: { name: string; value: string }[]
  certifications: string[]
  features: string[]
}

export type NavCategoryChild = {
  name: string
  slug: string
  href: string
  /** Optional note when the nav label maps to a related category */
  note?: string
}

export type NavCategory = {
  label: string
  href: string
  children: NavCategoryChild[]
}

export type IndustrySolution = {
  name: string
  slug: string
  description: string
  image_url: string
  href: string
}

export const FREE_SHIPPING_THRESHOLD = 199

export const SITE_CONFIG = {
  name: 'Titan Safety Co.',
  shortName: 'Titan Safety',
  tagline: 'Protecting People. Powering Progress.',
  eyebrow: 'BUILT FOR WORK. DESIGNED FOR SAFETY.',
  description:
    'Shop professional safety equipment, reflective workwear, work boots, traffic-control products, street signs, hard hats, and jobsite PPE.',
  defaultTitle:
    'Titan Safety Co. | Safety Equipment, Workwear and Traffic Control',
  titleTemplate: '%s | Titan Safety Co.',
  email: 'sales@titansafetyco.com',
  supportEmail: 'support@titansafetyco.com',
  phone: '1-800-848-2673',
  phoneDisplay: '1-800-TITAN-SAFE',
  address: {
    line1: '2400 Industrial Parkway',
    city: 'Houston',
    state: 'TX',
    postalCode: '77001',
    country: 'US',
  },
  social: {
    facebook: 'https://facebook.com/titansafetyco',
    instagram: 'https://instagram.com/titansafetyco',
    linkedin: 'https://linkedin.com/company/titansafetyco',
    twitter: 'https://x.com/titansafetyco',
  },
  brandNote:
    'Brands shown represent commonly stocked manufacturers.',
} as const

/** Category IDs (a0000000-...) */
export const CATEGORY_IDS = {
  hardHats: 'a0000000-0000-4000-8000-000000000001',
  safetyVests: 'a0000000-0000-4000-8000-000000000002',
  workBoots: 'a0000000-0000-4000-8000-000000000003',
  workGloves: 'a0000000-0000-4000-8000-000000000004',
  trafficCones: 'a0000000-0000-4000-8000-000000000005',
  barricades: 'a0000000-0000-4000-8000-000000000006',
  streetSigns: 'a0000000-0000-4000-8000-000000000007',
  constructionSigns: 'a0000000-0000-4000-8000-000000000008',
  safetyGlasses: 'a0000000-0000-4000-8000-000000000009',
  fallProtection: 'a0000000-0000-4000-8000-00000000000a',
} as const

/** Brand IDs (b0000000-...) */
export const BRAND_IDS = {
  titanSafety: 'b0000000-0000-4000-8000-000000000001',
  threeM: 'b0000000-0000-4000-8000-000000000002',
  dewalt: 'b0000000-0000-4000-8000-000000000003',
  carhartt: 'b0000000-0000-4000-8000-000000000004',
  honeywell: 'b0000000-0000-4000-8000-000000000005',
  milwaukee: 'b0000000-0000-4000-8000-000000000006',
  msaSafety: 'b0000000-0000-4000-8000-000000000007',
  pyramex: 'b0000000-0000-4000-8000-000000000008',
  radians: 'b0000000-0000-4000-8000-000000000009',
  ergodyne: 'b0000000-0000-4000-8000-00000000000a',
  kleinTools: 'b0000000-0000-4000-8000-00000000000b',
  cat: 'b0000000-0000-4000-8000-00000000000c',
  timberlandPro: 'b0000000-0000-4000-8000-00000000000d',
  redWing: 'b0000000-0000-4000-8000-00000000000e',
  bullard: 'b0000000-0000-4000-8000-00000000000f',
  ansell: 'b0000000-0000-4000-8000-000000000010',
  moldex: 'b0000000-0000-4000-8000-000000000011',
  pip: 'b0000000-0000-4000-8000-000000000012',
  mcrSafety: 'b0000000-0000-4000-8000-000000000013',
  gatewaySafety: 'b0000000-0000-4000-8000-000000000014',
  plasticade: 'b0000000-0000-4000-8000-000000000015',
  cortina: 'b0000000-0000-4000-8000-000000000016',
  mlKishigo: 'b0000000-0000-4000-8000-000000000017',
  ariat: 'b0000000-0000-4000-8000-000000000018',
  wolverine: 'b0000000-0000-4000-8000-000000000019',
  keen: 'b0000000-0000-4000-8000-00000000001a',
} as const

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: CATEGORY_IDS.hardHats,
    name: 'Hard Hats',
    slug: 'hard-hats',
    description:
      'ANSI-rated hard hats and suspensions for construction, utilities, and industrial jobsites.',
    image_url: '/images/categories/hard-hats.svg',
    sort_order: 1,
    active: true,
  },
  {
    id: CATEGORY_IDS.safetyVests,
    name: 'Safety Vests',
    slug: 'safety-vests',
    description:
      'Hi-vis Class 2 and Class 3 safety vests for roadway, survey, and warehouse visibility.',
    image_url: '/images/categories/safety-vests.svg',
    sort_order: 2,
    active: true,
  },
  {
    id: CATEGORY_IDS.workBoots,
    name: 'Work Boots',
    slug: 'work-boots',
    description:
      'Steel toe, composite toe, waterproof, and slip-resistant work boots built for long shifts.',
    image_url: '/images/categories/work-boots.svg',
    sort_order: 3,
    active: true,
  },
  {
    id: CATEGORY_IDS.workGloves,
    name: 'Work Gloves',
    slug: 'work-gloves',
    description:
      'Cut-resistant, grip, and leather palm gloves for handling, demolition, and general labor.',
    image_url: '/images/categories/work-gloves.svg',
    sort_order: 4,
    active: true,
  },
  {
    id: CATEGORY_IDS.trafficCones,
    name: 'Traffic Cones',
    slug: 'traffic-cones',
    description:
      'Reflective traffic cones in multiple heights for temporary traffic control and work zones.',
    image_url: '/images/categories/traffic-cones.svg',
    sort_order: 5,
    active: true,
  },
  {
    id: CATEGORY_IDS.barricades,
    name: 'Barricades',
    slug: 'barricades',
    description:
      'A-frame, plastic, and expandable barricades for crowd control and lane closures.',
    image_url: '/images/categories/barricades.svg',
    sort_order: 6,
    active: true,
  },
  {
    id: CATEGORY_IDS.streetSigns,
    name: 'Street Signs',
    slug: 'street-signs',
    description:
      'MUTCD-compliant street and regulatory signs for municipalities and private campuses.',
    image_url: '/images/categories/street-signs.svg',
    sort_order: 7,
    active: true,
  },
  {
    id: CATEGORY_IDS.constructionSigns,
    name: 'Construction Signs',
    slug: 'construction-signs',
    description:
      'Road work, detour, and temporary construction warning signs with reflective sheeting.',
    image_url: '/images/categories/construction-signs.svg',
    sort_order: 8,
    active: true,
  },
  {
    id: CATEGORY_IDS.safetyGlasses,
    name: 'Safety Glasses',
    slug: 'safety-glasses',
    description:
      'Impact-rated safety glasses and goggles with anti-fog and polarized options.',
    image_url: '/images/categories/safety-glasses.svg',
    sort_order: 9,
    active: true,
  },
  {
    id: CATEGORY_IDS.fallProtection,
    name: 'Fall Protection',
    slug: 'fall-protection',
    description:
      'Harnesses, lanyards, and fall-arrest gear for elevated work and confined spaces.',
    image_url: '/images/categories/fall-protection.svg',
    sort_order: 10,
    active: true,
  },
]

export const SEED_BRANDS: SeedBrand[] = [
  {
    id: BRAND_IDS.titanSafety,
    name: 'Titan Safety',
    slug: 'titan-safety',
    description:
      'Titan Safety Co. house brand — reliable PPE and traffic control at contractor-friendly prices.',
    logo_url: '/images/brands/titan-safety.png',
    website: 'https://titansafetyco.com',
    active: true,
  },
  {
    id: BRAND_IDS.threeM,
    name: '3M',
    slug: '3m',
    description:
      'Trusted manufacturer of personal protective equipment, adhesives, and safety solutions.',
    logo_url: '/images/brands/3m.svg',
    website: 'https://www.3m.com',
    active: true,
  },
  {
    id: BRAND_IDS.dewalt,
    name: 'DeWalt',
    slug: 'dewalt',
    description:
      'Jobsite-tough tools and protective gear engineered for professional tradespeople.',
    logo_url: '/images/brands/dewalt.png',
    website: 'https://www.dewalt.com',
    active: true,
  },
  {
    id: BRAND_IDS.carhartt,
    name: 'Carhartt',
    slug: 'carhartt',
    description:
      'Durable workwear and footwear built for hard work in demanding environments.',
    logo_url: '/images/brands/carhartt.png',
    website: 'https://www.carhartt.com',
    active: true,
  },
  {
    id: BRAND_IDS.honeywell,
    name: 'Honeywell',
    slug: 'honeywell',
    description:
      'Industrial safety products spanning head, eye, hand, and fall protection.',
    logo_url: '/images/brands/honeywell.svg',
    website: 'https://www.honeywell.com',
    active: true,
  },
  {
    id: BRAND_IDS.milwaukee,
    name: 'Milwaukee',
    slug: 'milwaukee',
    description:
      'Performance-driven tools and PPE for professional construction crews.',
    logo_url: '/images/brands/milwaukee.png',
    website: 'https://www.milwaukeetool.com',
    active: true,
  },
  {
    id: BRAND_IDS.msaSafety,
    name: 'MSA Safety',
    slug: 'msa-safety',
    description:
      'Gas detection, fall protection, and head protection for industrial and fire service teams.',
    logo_url: '/images/brands/msa-safety.svg',
    website: 'https://us.msasafety.com',
    active: true,
  },
  {
    id: BRAND_IDS.pyramex,
    name: 'Pyramex',
    slug: 'pyramex',
    description:
      'Affordable eye, head, and hearing protection for everyday jobsites.',
    logo_url: '/images/brands/pyramex.png',
    website: 'https://www.pyramexsafety.com',
    active: true,
  },
  {
    id: BRAND_IDS.radians,
    name: 'Radians',
    slug: 'radians',
    description:
      'PPE and high-visibility apparel designed for industrial and roadway crews.',
    logo_url: '/images/brands/radians.png',
    website: 'https://www.radians.com',
    active: true,
  },
  {
    id: BRAND_IDS.ergodyne,
    name: 'Ergodyne',
    slug: 'ergodyne',
    description:
      'Work gear for comfort and productivity — gloves, supports, cooling, and hi-vis.',
    logo_url: '/images/brands/ergodyne.png',
    website: 'https://www.ergodyne.com',
    active: true,
  },
  {
    id: BRAND_IDS.kleinTools,
    name: 'Klein Tools',
    slug: 'klein-tools',
    description:
      'Hand tools and PPE trusted by electricians and trades professionals.',
    logo_url: '/images/brands/klein-tools.png',
    website: 'https://www.kleintools.com',
    active: true,
  },
  {
    id: BRAND_IDS.cat,
    name: 'CAT',
    slug: 'cat',
    description:
      'Rugged work boots and footwear built for construction and industrial use.',
    logo_url: '/images/brands/cat.svg',
    website: 'https://www.catfootwear.com',
    active: true,
  },
  {
    id: BRAND_IDS.timberlandPro,
    name: 'Timberland PRO',
    slug: 'timberland-pro',
    description:
      'Professional work boots engineered for all-day comfort and durability.',
    logo_url: '/images/brands/timberland-pro.png',
    website: 'https://www.timberland.com',
    active: true,
  },
  {
    id: BRAND_IDS.redWing,
    name: 'Red Wing',
    slug: 'red-wing',
    description:
      'Heritage work boots known for fit, toughness, and long service life.',
    logo_url: '/images/brands/red-wing.svg',
    website: 'https://www.redwingshoes.com',
    active: true,
  },
  {
    id: BRAND_IDS.bullard,
    name: 'Bullard',
    slug: 'bullard',
    description:
      'Hard hats, firefighter helmets, and thermal imaging for safety-critical work.',
    logo_url: '/images/brands/bullard.png',
    website: 'https://www.bullard.com',
    active: true,
  },
  {
    id: BRAND_IDS.ansell,
    name: 'Ansell',
    slug: 'ansell',
    description:
      'Industrial gloves and chemical-resistant hand protection.',
    logo_url: '/images/brands/ansell.png',
    website: 'https://www.ansell.com',
    active: true,
  },
  {
    id: BRAND_IDS.moldex,
    name: 'Moldex',
    slug: 'moldex',
    description:
      'Respirators and hearing protection for industrial environments.',
    logo_url: '/images/brands/moldex.png',
    website: 'https://www.moldex.com',
    active: true,
  },
  {
    id: BRAND_IDS.pip,
    name: 'PIP',
    slug: 'pip',
    description:
      'Protective Industrial Products — gloves, apparel, and disposable PPE.',
    logo_url: '/images/brands/pip.png',
    website: 'https://www.pipusa.com',
    active: true,
  },
  {
    id: BRAND_IDS.mcrSafety,
    name: 'MCR Safety',
    slug: 'mcr-safety',
    description:
      'Gloves, eyewear, and clothing for manufacturing and construction.',
    logo_url: '/images/brands/mcr-safety.png',
    website: 'https://www.mcrsafety.com',
    active: true,
  },
  {
    id: BRAND_IDS.gatewaySafety,
    name: 'Gateway Safety',
    slug: 'gateway-safety',
    description:
      'Protective eyewear and face protection for industrial workplaces.',
    logo_url: '/images/brands/gateway-safety.png',
    website: 'https://www.gatewaysafety.com',
    active: true,
  },
  {
    id: BRAND_IDS.plasticade,
    name: 'Plasticade',
    slug: 'plasticade',
    description:
      'Traffic control products including cones, barricades, and channelizers.',
    logo_url: '/images/brands/plasticade.svg',
    website: 'https://www.plasticade.com',
    active: true,
  },
  {
    id: BRAND_IDS.cortina,
    name: 'Cortina',
    slug: 'cortina',
    description:
      'Work-zone safety products for traffic control and roadway crews.',
    logo_url: '/images/brands/cortina.svg',
    website: 'https://www.cortinasafety.com',
    active: true,
  },
  {
    id: BRAND_IDS.mlKishigo,
    name: 'ML Kishigo',
    slug: 'ml-kishigo',
    description:
      'High-visibility safety apparel for construction and public works.',
    logo_url: '/images/brands/ml-kishigo.png',
    website: 'https://www.mlkishigo.com',
    active: true,
  },
  {
    id: BRAND_IDS.ariat,
    name: 'Ariat',
    slug: 'ariat',
    description:
      'Work boots and western-inspired footwear for demanding outdoor jobs.',
    logo_url: '/images/brands/ariat.png',
    website: 'https://www.ariat.com',
    active: true,
  },
  {
    id: BRAND_IDS.wolverine,
    name: 'Wolverine',
    slug: 'wolverine',
    description:
      'Work boots and outdoor footwear built for tough conditions.',
    logo_url: '/images/brands/wolverine.svg',
    website: 'https://www.wolverine.com',
    active: true,
  },
  {
    id: BRAND_IDS.keen,
    name: 'KEEN Utility',
    slug: 'keen',
    description:
      'Comfort-focused safety toe boots and shoes for long shifts.',
    logo_url: '/images/brands/keen.png',
    website: 'https://www.keenfootwear.com',
    active: true,
  },
]

/**
 * Mega-menu / header dropdown mapping.
 * Hearing Protection maps to Fall Protection until a dedicated category exists.
 * Extra Traffic Control / Footwear / Signage labels map to closest stocked categories.
 */
export const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Safety Equipment',
    href: '/shop?department=Safety%20Equipment',
    children: [
      { name: 'Hard Hats', slug: 'hard-hats', href: '/shop/hard-hats' },
      { name: 'Safety Vests', slug: 'safety-vests', href: '/shop/safety-vests' },
      {
        name: 'Safety Glasses',
        slug: 'safety-glasses',
        href: '/shop/safety-glasses',
      },
      { name: 'Work Gloves', slug: 'work-gloves', href: '/shop/work-gloves' },
      {
        name: 'Hearing Protection',
        slug: 'hearing-protection',
        href: '/shop/fall-protection',
        note: 'Maps to Fall Protection until a dedicated hearing category is added.',
      },
      {
        name: 'Fall Protection',
        slug: 'fall-protection',
        href: '/shop/fall-protection',
      },
    ],
  },
  {
    label: 'Traffic Control',
    href: '/shop?department=Traffic%20Control',
    children: [
      {
        name: 'Traffic Cones',
        slug: 'traffic-cones',
        href: '/shop/traffic-cones',
      },
      { name: 'Barricades', slug: 'barricades', href: '/shop/barricades' },
      {
        name: 'Delineators',
        slug: 'delineators',
        href: '/shop/traffic-cones',
        note: 'Alias — browse traffic cones for temporary channelizers.',
      },
      {
        name: 'Traffic Paddles',
        slug: 'traffic-paddles',
        href: '/shop/traffic-cones',
        note: 'Alias — related traffic-control products.',
      },
      {
        name: 'Warning Lights',
        slug: 'warning-lights',
        href: '/shop/barricades',
        note: 'Alias — related barricade / work-zone products.',
      },
      {
        name: 'Traffic Tape',
        slug: 'traffic-tape',
        href: '/shop/barricades',
        note: 'Alias — related traffic-control products.',
      },
    ],
  },
  {
    label: 'Foot Wear',
    href: '/shop?department=Safety%20Shoes%20%26%20Boots',
    children: [
      {
        name: 'Steel Toe Boots',
        slug: 'steel-toe-boots',
        href: '/shop/work-boots',
      },
      {
        name: 'Composite Toe Boots',
        slug: 'composite-toe-boots',
        href: '/shop/work-boots',
      },
      {
        name: 'Waterproof Boots',
        slug: 'waterproof-boots',
        href: '/shop/work-boots',
      },
      {
        name: 'Slip Resistant Boots',
        slug: 'slip-resistant-boots',
        href: '/shop/work-boots',
      },
    ],
  },
  {
    label: 'Signage',
    href: '/shop?department=Signage',
    children: [
      {
        name: 'Road Work Signs',
        slug: 'road-work-signs',
        href: '/shop/construction-signs',
      },
      { name: 'Street Signs', slug: 'street-signs', href: '/shop/street-signs' },
      {
        name: 'Parking Signs',
        slug: 'parking-signs',
        href: '/shop/street-signs',
        note: 'Alias — browse street signs for parking and regulatory options.',
      },
      {
        name: 'OSHA Signs',
        slug: 'osha-signs',
        href: '/shop/construction-signs',
        note: 'Alias — related construction / safety signage.',
      },
      {
        name: 'Custom Signs',
        slug: 'custom-signs',
        href: '/quote',
        note: 'Request a custom signage quote.',
      },
    ],
  },
]

export const INDUSTRY_SOLUTIONS: IndustrySolution[] = [
  {
    name: 'Construction',
    slug: 'construction',
    description:
      'Hard hats, hi-vis, fall protection, and jobsite PPE for general contractors and trades.',
    image_url: '/images/industries/construction-solutions.jpg',
    href: '/shop?industry=construction',
  },
  {
    name: 'Roadway and Traffic',
    slug: 'roadway',
    description:
      'Cones, barricades, and construction signs for highway crews and traffic-control contractors.',
    image_url: '/images/industries/roadway-solutions.jpg',
    href: '/shop?industry=roadway',
  },
  {
    name: 'Municipalities',
    slug: 'municipalities',
    description:
      'Street signs, regulatory marking, and fleet PPE for cities, counties, and public works.',
    image_url: '/images/industries/municipalities-solutions.jpg',
    href: '/shop?industry=municipalities',
  },
  {
    name: 'Warehousing and Logistics',
    slug: 'warehousing',
    description:
      'Safety vests, gloves, boots, and eye protection for distribution centers and logistics teams.',
    image_url: '/images/industries/warehousing-solutions.jpg',
    href: '/shop?industry=warehousing',
  },
]

/** Homepage shop-by-category strip (six cards) */
export const HOMEPAGE_CATEGORY_SLUGS = [
  'hard-hats',
  'safety-vests',
  'work-boots',
  'traffic-cones',
  'street-signs',
  'barricades',
] as const

export const SEED_PRODUCTS: SeedProduct[] = [
  // —— Featured seed products (exact) ——
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    category_id: CATEGORY_IDS.hardHats,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Titan Premium Vented Hard Hat',
    slug: 'titan-premium-vented-hard-hat',
    sku: 'TSH-HH-001',
    short_description:
      'Vented Type I Class C hard hat with 4-point ratchet suspension.',
    description:
      'The Titan Premium Vented Hard Hat delivers all-day comfort and reliable impact protection on active jobsites. A 4-point ratchet suspension dials in a secure fit, while top vents improve airflow without sacrificing ANSI Type I performance. Ideal for construction, utilities, and industrial maintenance crews.',
    price: 24.99,
    compare_at_price: 29.99,
    cost: 11.5,
    inventory_quantity: 180,
    low_stock_threshold: 20,
    featured: true,
    bestseller: true,
    active: true,
    weight: 0.85,
    shipping_class: 'standard',
    rating_avg: 4.7,
    rating_count: 214,
    ansi_class: 'Type I Class C',
    color: 'Yellow',
    size: 'Adjustable',
    product_type: 'Hard Hat',
    image_url: '/images/products/titan-premium-vented-hard-hat.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Z89.1 Type I Class C' },
      { name: 'Suspension', value: '4-point ratchet' },
      { name: 'Material', value: 'HDPE shell' },
      { name: 'Vents', value: 'Yes' },
      { name: 'Weight', value: '0.85 lb' },
    ],
    certifications: ['ANSI Z89.1', 'CSA Z94.1'],
    features: [
      'Ratchet suspension for precise fit',
      'Top vents for airflow',
      'Accessory slots for hearing/face protection',
      'Replaceable sweatband',
    ],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    category_id: CATEGORY_IDS.safetyVests,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Hi-Vis Class 2 Safety Vest',
    slug: 'hi-vis-class-2-safety-vest',
    sku: 'TSH-SV-001',
    short_description:
      'Lightweight Class 2 mesh vest with 2-inch reflective striping.',
    description:
      'Stay visible on roadways and busy yards with this ANSI Class 2 mesh safety vest. Breathable fabric keeps crews cooler in warm weather while 2-inch silver reflective tape provides 360° conspicuity. Hook-and-loop front closure and multiple pockets for radios, pens, and badges.',
    price: 14.99,
    compare_at_price: 19.99,
    cost: 5.25,
    inventory_quantity: 250,
    low_stock_threshold: 30,
    featured: true,
    bestseller: true,
    active: true,
    weight: 0.35,
    shipping_class: 'standard',
    rating_avg: 4.6,
    rating_count: 389,
    ansi_class: 'Class 2',
    color: 'Lime',
    size: 'L/XL',
    product_type: 'Safety Vest',
    image_url: '/images/products/hi-vis-class-2-safety-vest.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Class 2' },
      { name: 'Reflective Tape', value: '2 in silver' },
      { name: 'Material', value: 'Polyester mesh' },
      { name: 'Closure', value: 'Hook and loop' },
      { name: 'Pockets', value: '4' },
    ],
    certifications: ['ANSI/ISEA 107 Class 2'],
    features: [
      'Breathable mesh body',
      '360° reflective visibility',
      'Radio and pen pockets',
      'Machine washable',
    ],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    category_id: CATEGORY_IDS.workBoots,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Titan Steel Toe Work Boot',
    slug: 'titan-steel-toe-work-boot',
    sku: 'TSH-WB-001',
    short_description:
      'EH-rated steel toe boot with oil-resistant rubber outsole.',
    description:
      'The Titan Steel Toe Work Boot combines ASTM-rated toe protection with a durable full-grain leather upper. Electrical hazard (EH) rated construction and an oil- and slip-resistant outsole keep crews sure-footed on slick floors. Removable cushion insole supports long shifts.',
    price: 89.99,
    compare_at_price: 109.99,
    cost: 42.0,
    inventory_quantity: 96,
    low_stock_threshold: 15,
    featured: true,
    bestseller: true,
    active: true,
    weight: 3.8,
    shipping_class: 'footwear',
    rating_avg: 4.5,
    rating_count: 167,
    ansi_class: null,
    color: 'Brown',
    size: '10',
    product_type: 'Work Boot',
    image_url: '/images/products/titan-steel-toe-work-boot.svg',
    specifications: [
      { name: 'Toe Protection', value: 'Steel toe ASTM F2413' },
      { name: 'EH Rated', value: 'Yes' },
      { name: 'Upper', value: 'Full-grain leather' },
      { name: 'Outsole', value: 'Oil/slip resistant rubber' },
      { name: 'Height', value: '6 in' },
    ],
    certifications: ['ASTM F2413', 'ASTM F2892 EH'],
    features: [
      'Steel toe impact/compression protection',
      'Electrical hazard rated',
      'Oil- and slip-resistant outsole',
      'Cushioned removable insole',
    ],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    category_id: CATEGORY_IDS.trafficCones,
    brand_id: BRAND_IDS.titanSafety,
    name: '28-Inch Reflective Traffic Cone',
    slug: '28-inch-reflective-traffic-cone',
    sku: 'TSH-TC-028',
    short_description:
      'MUTCD-compliant 28" cone with dual reflective collars and weighted base.',
    description:
      'Mark temporary work zones with this durable 28-inch PVC traffic cone. Dual reflective collars meet MUTCD visibility requirements for daytime and nighttime operations. Weighted base resists wind tip-overs on roadways and parking lots.',
    price: 17.99,
    compare_at_price: null,
    cost: 7.8,
    inventory_quantity: 320,
    low_stock_threshold: 40,
    featured: true,
    bestseller: false,
    active: true,
    weight: 7.2,
    shipping_class: 'oversized',
    rating_avg: 4.8,
    rating_count: 92,
    ansi_class: null,
    color: 'Orange',
    size: '28 in',
    product_type: 'Traffic Cone',
    image_url: '/images/products/28-inch-reflective-traffic-cone.svg',
    specifications: [
      { name: 'Height', value: '28 in' },
      { name: 'Material', value: 'PVC' },
      { name: 'Reflective Collars', value: '2 (4 in / 6 in)' },
      { name: 'Base', value: 'Weighted black base' },
      { name: 'Stackable', value: 'Yes' },
    ],
    certifications: ['MUTCD compliant'],
    features: [
      'Dual reflective collars',
      'Wind-resistant weighted base',
      'Stackable for storage',
      'Fade-resistant orange PVC',
    ],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    category_id: CATEGORY_IDS.constructionSigns,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Road Work Ahead Sign',
    slug: 'road-work-ahead-sign',
    sku: 'TSH-CS-001',
    short_description:
      '48" diamond roll-up sign with fluorescent orange reflective sheeting.',
    description:
      'Alert drivers early with this Road Work Ahead diamond sign. Fluorescent orange reflective sheeting delivers high daytime and nighttime visibility. Compatible with standard A-frame stands and includes reinforced corner pockets for quick deployment.',
    price: 49.99,
    compare_at_price: 59.99,
    cost: 22.5,
    inventory_quantity: 74,
    low_stock_threshold: 12,
    featured: true,
    bestseller: false,
    active: true,
    weight: 4.5,
    shipping_class: 'oversized',
    rating_avg: 4.6,
    rating_count: 58,
    ansi_class: null,
    color: 'Orange',
    size: '48 in',
    product_type: 'Construction Sign',
    image_url: '/images/products/road-work-ahead-sign.svg',
    specifications: [
      { name: 'Legend', value: 'ROAD WORK AHEAD' },
      { name: 'Size', value: '48 x 48 in diamond' },
      { name: 'Sheeting', value: 'Fluorescent orange reflective' },
      { name: 'Style', value: 'Roll-up mesh' },
      { name: 'Mount', value: 'A-frame / stand compatible' },
    ],
    certifications: ['MUTCD', 'ASTM D4956 Type IV'],
    features: [
      'High-visibility fluorescent orange',
      'Roll-up design for compact storage',
      'Reinforced corner pockets',
      'Nighttime reflective sheeting',
    ],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    category_id: CATEGORY_IDS.workGloves,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Titan Flex Grip Work Gloves',
    slug: 'titan-flex-grip-work-gloves',
    sku: 'TSH-WG-001',
    short_description:
      'Nitrile-coated knit gloves with flexible grip for general labor.',
    description:
      'Titan Flex Grip Work Gloves give crews dexterity and durable palm grip for material handling, assembly, and light demolition. Seamless knit shell flexes with the hand while the foam nitrile coating resists abrasion and light oils. Touchscreen compatible fingertips.',
    price: 9.99,
    compare_at_price: 12.99,
    cost: 3.4,
    inventory_quantity: 400,
    low_stock_threshold: 50,
    featured: true,
    bestseller: true,
    active: true,
    weight: 0.2,
    shipping_class: 'standard',
    rating_avg: 4.4,
    rating_count: 512,
    ansi_class: null,
    color: 'Black/Gray',
    size: 'L',
    product_type: 'Work Glove',
    image_url: '/images/products/titan-flex-grip-work-gloves.svg',
    specifications: [
      { name: 'Coating', value: 'Foam nitrile palm' },
      { name: 'Shell', value: '13-gauge polyester knit' },
      { name: 'Cut Level', value: 'A1' },
      { name: 'Cuff', value: 'Knit wrist' },
      { name: 'Touchscreen', value: 'Yes' },
    ],
    certifications: ['EN 388', 'ANSI/ISEA 105 A1'],
    features: [
      'Flexible foam nitrile grip',
      'Breathable knit back',
      'Touchscreen compatible',
      'Sold as pair',
    ],
  },

  // —— Additional catalog products ——
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    category_id: CATEGORY_IDS.hardHats,
    brand_id: BRAND_IDS.honeywell,
    name: 'Cap Style Hard Hat Yellow',
    slug: 'cap-style-hard-hat-yellow',
    sku: 'HNW-HH-110',
    short_description:
      'Classic cap-style Type I Class G hard hat with pin-lock suspension.',
    description:
      'A dependable cap-style hard hat for general construction and electrical hazard environments. Smooth shell accepts standard accessories, and the pin-lock suspension adjusts quickly for shared crew use.',
    price: 18.99,
    compare_at_price: null,
    cost: 8.2,
    inventory_quantity: 145,
    low_stock_threshold: 20,
    featured: false,
    bestseller: true,
    active: true,
    weight: 0.9,
    shipping_class: 'standard',
    rating_avg: 4.3,
    rating_count: 88,
    ansi_class: 'Type I Class G',
    color: 'Yellow',
    size: 'Adjustable',
    product_type: 'Hard Hat',
    image_url: '/images/products/cap-style-hard-hat-yellow.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Z89.1 Type I Class G' },
      { name: 'Suspension', value: 'Pin-lock' },
      { name: 'Style', value: 'Cap' },
      { name: 'Material', value: 'HDPE' },
    ],
    certifications: ['ANSI Z89.1'],
    features: ['Class G electrical protection', 'Accessory slots', 'Replaceable suspension'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000008',
    category_id: CATEGORY_IDS.hardHats,
    brand_id: BRAND_IDS.milwaukee,
    name: 'Full Brim Hard Hat with Ratchet',
    slug: 'full-brim-hard-hat-with-ratchet',
    sku: 'MKE-HH-220',
    short_description:
      'Full-brim Type I Class E hard hat with sun and rain coverage.',
    description:
      'Extended brim shade and rain runoff protection for outdoor crews. Class E dielectric rating for electrical environments, plus a comfortable ratchet suspension and moisture-wicking sweatband.',
    price: 34.99,
    compare_at_price: 39.99,
    cost: 15.0,
    inventory_quantity: 68,
    low_stock_threshold: 12,
    featured: false,
    bestseller: false,
    active: true,
    weight: 1.05,
    shipping_class: 'standard',
    rating_avg: 4.6,
    rating_count: 41,
    ansi_class: 'Type I Class E',
    color: 'White',
    size: 'Adjustable',
    product_type: 'Hard Hat',
    image_url: '/images/products/full-brim-hard-hat-with-ratchet.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Z89.1 Type I Class E' },
      { name: 'Style', value: 'Full brim' },
      { name: 'Suspension', value: '6-point ratchet' },
      { name: 'Dielectric', value: 'Class E' },
    ],
    certifications: ['ANSI Z89.1 Class E'],
    features: ['Full brim sun protection', 'Class E dielectric', 'Bolt accessory mounts'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000009',
    category_id: CATEGORY_IDS.safetyVests,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Class 3 Surveyor Safety Vest',
    slug: 'class-3-surveyor-safety-vest',
    sku: 'TSH-SV-003',
    short_description:
      'High-coverage Class 3 surveyor vest with zip front and tool pockets.',
    description:
      'Maximum conspicuity for roadway and survey teams. Class 3 coverage with contrasting trim, zip front, mic tabs, and deep utility pockets for notebooks, flags, and instruments.',
    price: 27.99,
    compare_at_price: 34.99,
    cost: 11.0,
    inventory_quantity: 112,
    low_stock_threshold: 15,
    featured: false,
    bestseller: true,
    active: true,
    weight: 0.55,
    shipping_class: 'standard',
    rating_avg: 4.5,
    rating_count: 73,
    ansi_class: 'Class 3',
    color: 'Orange',
    size: '2XL/3XL',
    product_type: 'Safety Vest',
    image_url: '/images/products/class-3-surveyor-safety-vest.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Class 3' },
      { name: 'Closure', value: 'Full zip' },
      { name: 'Material', value: 'Polyester solid/mesh combo' },
      { name: 'Pockets', value: '8' },
    ],
    certifications: ['ANSI/ISEA 107 Class 3'],
    features: ['Surveyor pocket layout', 'Mic tabs', 'Contrasting trim'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000a',
    category_id: CATEGORY_IDS.safetyVests,
    brand_id: BRAND_IDS.threeM,
    name: 'Mesh Breakaway Safety Vest',
    slug: 'mesh-breakaway-safety-vest',
    sku: '3M-SV-045',
    short_description:
      'Breakaway Class 2 mesh vest designed for snag-prone environments.',
    description:
      'Breakaway shoulders and sides release under pull force to help reduce entanglement risks near moving equipment. Lightweight mesh keeps wearers cool during summer shifts.',
    price: 16.49,
    compare_at_price: null,
    cost: 6.1,
    inventory_quantity: 190,
    low_stock_threshold: 25,
    featured: false,
    bestseller: false,
    active: true,
    weight: 0.3,
    shipping_class: 'standard',
    rating_avg: 4.2,
    rating_count: 55,
    ansi_class: 'Class 2',
    color: 'Lime',
    size: 'M/L',
    product_type: 'Safety Vest',
    image_url: '/images/products/mesh-breakaway-safety-vest.svg',
    specifications: [
      { name: 'ANSI Rating', value: 'Class 2' },
      { name: 'Breakaway', value: 'Shoulders and sides' },
      { name: 'Material', value: 'Polyester mesh' },
    ],
    certifications: ['ANSI/ISEA 107 Class 2'],
    features: ['Breakaway design', 'Breathable mesh', 'Hook-and-loop front'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000b',
    category_id: CATEGORY_IDS.workBoots,
    brand_id: BRAND_IDS.carhartt,
    name: 'Composite Toe Waterproof Boot',
    slug: 'composite-toe-waterproof-boot',
    sku: 'CRT-WB-310',
    short_description:
      'Lightweight composite toe boot with waterproof membrane.',
    description:
      'Composite toe protection that is lighter than steel and non-metallic for security-friendly sites. Waterproof membrane and seam-sealed construction keep feet dry in wet conditions.',
    price: 129.99,
    compare_at_price: 149.99,
    cost: 62.0,
    inventory_quantity: 54,
    low_stock_threshold: 10,
    featured: false,
    bestseller: true,
    active: true,
    weight: 3.2,
    shipping_class: 'footwear',
    rating_avg: 4.7,
    rating_count: 129,
    ansi_class: null,
    color: 'Black',
    size: '11',
    product_type: 'Work Boot',
    image_url: '/images/products/composite-toe-waterproof-boot.svg',
    specifications: [
      { name: 'Toe Protection', value: 'Composite ASTM F2413' },
      { name: 'Waterproof', value: 'Yes' },
      { name: 'Height', value: '8 in' },
      { name: 'Insulation', value: 'Uninsulated' },
    ],
    certifications: ['ASTM F2413'],
    features: ['Non-metallic composite toe', 'Waterproof membrane', 'Aggressive lug outsole'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000c',
    category_id: CATEGORY_IDS.workBoots,
    brand_id: BRAND_IDS.dewalt,
    name: 'Slip Resistant Work Shoe',
    slug: 'slip-resistant-work-shoe',
    sku: 'DWT-WS-180',
    short_description:
      'Low-profile slip-resistant work shoe for warehouses and shops.',
    description:
      'Athletic-inspired work shoe with SRC slip-resistant outsole for polished concrete and wet floors. Soft toe for light-duty warehouse use with breathable mesh panels.',
    price: 64.99,
    compare_at_price: null,
    cost: 28.0,
    inventory_quantity: 88,
    low_stock_threshold: 15,
    featured: false,
    bestseller: false,
    active: true,
    weight: 2.1,
    shipping_class: 'footwear',
    rating_avg: 4.1,
    rating_count: 64,
    ansi_class: null,
    color: 'Gray',
    size: '9.5',
    product_type: 'Work Shoe',
    image_url: '/images/products/slip-resistant-work-shoe.svg',
    specifications: [
      { name: 'Toe', value: 'Soft toe' },
      { name: 'Outsole', value: 'SRC slip resistant' },
      { name: 'Upper', value: 'Mesh/synthetic' },
    ],
    certifications: ['ASTM F3445 slip resistant'],
    features: ['SRC-rated outsole', 'Lightweight build', 'Breathable upper'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000d',
    category_id: CATEGORY_IDS.workGloves,
    brand_id: BRAND_IDS.honeywell,
    name: 'Cut Resistant Gloves Level A4',
    slug: 'cut-resistant-gloves-level-a4',
    sku: 'HNW-WG-A4',
    short_description:
      'ANSI A4 cut-resistant gloves with sandy nitrile coating.',
    description:
      'Engineered for sheet metal, glass, and sharp-edge handling. ANSI/ISEA A4 cut resistance with sandy nitrile palm coating for wet and dry grip. Knit wrist keeps debris out.',
    price: 18.99,
    compare_at_price: 22.99,
    cost: 7.5,
    inventory_quantity: 210,
    low_stock_threshold: 30,
    featured: false,
    bestseller: true,
    active: true,
    weight: 0.25,
    shipping_class: 'standard',
    rating_avg: 4.6,
    rating_count: 201,
    ansi_class: null,
    color: 'Gray/Black',
    size: 'XL',
    product_type: 'Work Glove',
    image_url: '/images/products/cut-resistant-gloves-level-a4.svg',
    specifications: [
      { name: 'Cut Level', value: 'ANSI A4' },
      { name: 'Coating', value: 'Sandy nitrile' },
      { name: 'Gauge', value: '13' },
    ],
    certifications: ['ANSI/ISEA 105 A4', 'EN 388'],
    features: ['A4 cut protection', 'Wet/dry grip', 'Dexterous knit shell'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000e',
    category_id: CATEGORY_IDS.workGloves,
    brand_id: BRAND_IDS.carhartt,
    name: 'Leather Palm Work Gloves',
    slug: 'leather-palm-work-gloves',
    sku: 'CRT-WG-LP1',
    short_description:
      'Cowhide leather palm gloves with cotton canvas back.',
    description:
      'Classic leather palm gloves for framing, material handling, and general construction. Reinforced palm and knuckle strap add durability where wear is highest.',
    price: 12.99,
    compare_at_price: null,
    cost: 4.8,
    inventory_quantity: 175,
    low_stock_threshold: 20,
    featured: false,
    bestseller: false,
    active: true,
    weight: 0.4,
    shipping_class: 'standard',
    rating_avg: 4.3,
    rating_count: 97,
    ansi_class: null,
    color: 'Tan',
    size: 'L',
    product_type: 'Work Glove',
    image_url: '/images/products/leather-palm-work-gloves.svg',
    specifications: [
      { name: 'Palm', value: 'Cowhide leather' },
      { name: 'Back', value: 'Cotton canvas' },
      { name: 'Cuff', value: 'Safety cuff' },
    ],
    certifications: [],
    features: ['Reinforced leather palm', 'Safety cuff', 'Knuckle strap'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000f',
    category_id: CATEGORY_IDS.trafficCones,
    brand_id: BRAND_IDS.titanSafety,
    name: '18-Inch Mini Traffic Cone',
    slug: '18-inch-mini-traffic-cone',
    sku: 'TSH-TC-018',
    short_description:
      'Compact 18" cone for indoor aisles, events, and parking control.',
    description:
      'Lightweight mini cones for warehouses, gyms, events, and low-speed traffic areas. Bright orange PVC with optional reflective collar for low-light visibility.',
    price: 8.99,
    compare_at_price: null,
    cost: 3.2,
    inventory_quantity: 260,
    low_stock_threshold: 35,
    featured: false,
    bestseller: false,
    active: true,
    weight: 2.4,
    shipping_class: 'standard',
    rating_avg: 4.4,
    rating_count: 33,
    ansi_class: null,
    color: 'Orange',
    size: '18 in',
    product_type: 'Traffic Cone',
    image_url: '/images/products/18-inch-mini-traffic-cone.svg',
    specifications: [
      { name: 'Height', value: '18 in' },
      { name: 'Material', value: 'PVC' },
      { name: 'Reflective Collar', value: 'Optional 4 in' },
    ],
    certifications: [],
    features: ['Compact storage', 'Indoor/outdoor use', 'Stackable'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000010',
    category_id: CATEGORY_IDS.trafficCones,
    brand_id: BRAND_IDS.titanSafety,
    name: '36-Inch Highway Cone with Base',
    slug: '36-inch-highway-cone-with-base',
    sku: 'TSH-TC-036',
    short_description:
      'Highway-grade 36" cone with dual collars and heavy recycled base.',
    description:
      'Tall highway cone for high-speed roadway work zones. Dual reflective collars and a heavy recycled rubber base improve stability in wind and wake turbulence.',
    price: 28.99,
    compare_at_price: 34.99,
    cost: 13.5,
    inventory_quantity: 140,
    low_stock_threshold: 20,
    featured: false,
    bestseller: true,
    active: true,
    weight: 10.5,
    shipping_class: 'oversized',
    rating_avg: 4.7,
    rating_count: 46,
    ansi_class: null,
    color: 'Orange',
    size: '36 in',
    product_type: 'Traffic Cone',
    image_url: '/images/products/36-inch-highway-cone-with-base.svg',
    specifications: [
      { name: 'Height', value: '36 in' },
      { name: 'Reflective Collars', value: '2 (6 in / 4 in)' },
      { name: 'Base Weight', value: '~10 lb recycled rubber' },
    ],
    certifications: ['MUTCD compliant'],
    features: ['Highway height', 'Heavy base', 'High-intensity collars'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000011',
    category_id: CATEGORY_IDS.barricades,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Plastic A-Frame Barricade',
    slug: 'plastic-a-frame-barricade',
    sku: 'TSH-BR-AF1',
    short_description:
      'Blow-molded A-frame barricade with reflective sheeting panels.',
    description:
      'Portable plastic A-frame for sidewalk closures, parking control, and temporary lane marking. Blow-molded construction resists weather and accepts standard reflective panels.',
    price: 79.99,
    compare_at_price: null,
    cost: 36.0,
    inventory_quantity: 42,
    low_stock_threshold: 8,
    featured: false,
    bestseller: false,
    active: true,
    weight: 18.0,
    shipping_class: 'freight',
    rating_avg: 4.5,
    rating_count: 27,
    ansi_class: null,
    color: 'Orange/White',
    size: 'Standard',
    product_type: 'Barricade',
    image_url: '/images/products/plastic-a-frame-barricade.svg',
    specifications: [
      { name: 'Type', value: 'Type I/II compatible panels' },
      { name: 'Material', value: 'Blow-molded polyethylene' },
      { name: 'Fillable', value: 'Sand/water ballast ports' },
    ],
    certifications: ['MUTCD'],
    features: ['Ballast ports', 'Reflective panels', 'Stackable legs'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000012',
    category_id: CATEGORY_IDS.barricades,
    brand_id: BRAND_IDS.milwaukee,
    name: 'Expandable Crowd Control Barricade',
    slug: 'expandable-crowd-control-barricade',
    sku: 'MKE-BR-XC1',
    short_description:
      'Expandable steel barricade for events and pedestrian control.',
    description:
      'Scissor-style expandable barricade expands up to 8 feet for quick crowd and pedestrian control. Powder-coated steel with locking casters for indoor venues and outdoor events.',
    price: 119.99,
    compare_at_price: 139.99,
    cost: 55.0,
    inventory_quantity: 28,
    low_stock_threshold: 6,
    featured: false,
    bestseller: false,
    active: true,
    weight: 22.0,
    shipping_class: 'freight',
    rating_avg: 4.4,
    rating_count: 19,
    ansi_class: null,
    color: 'Yellow',
    size: 'Up to 8 ft',
    product_type: 'Barricade',
    image_url: '/images/products/expandable-crowd-control-barricade.svg',
    specifications: [
      { name: 'Expanded Length', value: '8 ft' },
      { name: 'Material', value: 'Powder-coated steel' },
      { name: 'Casters', value: 'Locking' },
    ],
    certifications: [],
    features: ['Expands to 8 ft', 'Locking casters', 'Folds for storage'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000013',
    category_id: CATEGORY_IDS.streetSigns,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Stop Sign 30-Inch',
    slug: 'stop-sign-30-inch',
    sku: 'TSH-SS-STP30',
    short_description:
      '30" engineer-grade reflective STOP sign on aluminum blank.',
    description:
      'Standard octagonal STOP sign for private roads, campuses, and municipal applications. Engineer-grade reflective sheeting on corrosion-resistant aluminum with pre-drilled mounting holes.',
    price: 39.99,
    compare_at_price: null,
    cost: 16.0,
    inventory_quantity: 95,
    low_stock_threshold: 12,
    featured: false,
    bestseller: true,
    active: true,
    weight: 3.5,
    shipping_class: 'oversized',
    rating_avg: 4.8,
    rating_count: 61,
    ansi_class: null,
    color: 'Red/White',
    size: '30 in',
    product_type: 'Street Sign',
    image_url: '/images/products/stop-sign-30-inch.svg',
    specifications: [
      { name: 'Legend', value: 'STOP' },
      { name: 'Size', value: '30 in octagon' },
      { name: 'Sheeting', value: 'Engineer grade' },
      { name: 'Blank', value: '0.080 in aluminum' },
    ],
    certifications: ['MUTCD', 'ASTM D4956'],
    features: ['Pre-drilled holes', 'Rust-resistant aluminum', 'Reflective sheeting'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000014',
    category_id: CATEGORY_IDS.streetSigns,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Yield Sign Aluminum',
    slug: 'yield-sign-aluminum',
    sku: 'TSH-SS-YLD36',
    short_description:
      '36" triangular YIELD sign with high-intensity reflective sheeting.',
    description:
      'MUTCD YIELD triangle for intersections and campus roads. High-intensity prismatic sheeting improves nighttime recognition. Aluminum blank resists corrosion in coastal and winter-salt environments.',
    price: 44.99,
    compare_at_price: 52.99,
    cost: 18.5,
    inventory_quantity: 70,
    low_stock_threshold: 10,
    featured: false,
    bestseller: false,
    active: true,
    weight: 4.0,
    shipping_class: 'oversized',
    rating_avg: 4.5,
    rating_count: 22,
    ansi_class: null,
    color: 'Red/White',
    size: '36 in',
    product_type: 'Street Sign',
    image_url: '/images/products/yield-sign-aluminum.svg',
    specifications: [
      { name: 'Legend', value: 'YIELD' },
      { name: 'Size', value: '36 in triangle' },
      { name: 'Sheeting', value: 'High-intensity prismatic' },
    ],
    certifications: ['MUTCD'],
    features: ['High-intensity sheeting', 'Aluminum blank', 'Pre-drilled'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000015',
    category_id: CATEGORY_IDS.constructionSigns,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Men Working Sign',
    slug: 'men-working-sign',
    sku: 'TSH-CS-MW48',
    short_description:
      '48" MEN WORKING roll-up sign for temporary work zones.',
    description:
      'Temporary MEN WORKING diamond sign for utility and maintenance crews. Roll-up reflective mesh packs flat in a truck cab and mounts to standard portable stands.',
    price: 46.99,
    compare_at_price: null,
    cost: 20.0,
    inventory_quantity: 58,
    low_stock_threshold: 10,
    featured: false,
    bestseller: false,
    active: true,
    weight: 4.2,
    shipping_class: 'oversized',
    rating_avg: 4.4,
    rating_count: 31,
    ansi_class: null,
    color: 'Orange',
    size: '48 in',
    product_type: 'Construction Sign',
    image_url: '/images/products/men-working-sign.svg',
    specifications: [
      { name: 'Legend', value: 'MEN WORKING' },
      { name: 'Size', value: '48 x 48 in' },
      { name: 'Style', value: 'Roll-up' },
    ],
    certifications: ['MUTCD'],
    features: ['Roll-up storage', 'Stand compatible', 'Reflective mesh'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000016',
    category_id: CATEGORY_IDS.constructionSigns,
    brand_id: BRAND_IDS.titanSafety,
    name: 'Detour Arrow Sign',
    slug: 'detour-arrow-sign',
    sku: 'TSH-CS-DTAR',
    short_description:
      'Fluorescent orange DETOUR arrow panel for temporary routing.',
    description:
      'Direct traffic around closures with a high-visibility DETOUR arrow sign. Fluorescent orange sheeting and bold black legend remain readable in bright sunlight and dusk conditions.',
    price: 42.99,
    compare_at_price: 49.99,
    cost: 19.0,
    inventory_quantity: 63,
    low_stock_threshold: 10,
    featured: false,
    bestseller: false,
    active: true,
    weight: 4.0,
    shipping_class: 'oversized',
    rating_avg: 4.3,
    rating_count: 18,
    ansi_class: null,
    color: 'Orange',
    size: '48 in',
    product_type: 'Construction Sign',
    image_url: '/images/products/detour-arrow-sign.svg',
    specifications: [
      { name: 'Legend', value: 'DETOUR (arrow)' },
      { name: 'Size', value: '48 x 48 in' },
      { name: 'Sheeting', value: 'Fluorescent orange reflective' },
    ],
    certifications: ['MUTCD'],
    features: ['Left/right arrow options', 'Roll-up design', 'High visibility'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000017',
    category_id: CATEGORY_IDS.safetyGlasses,
    brand_id: BRAND_IDS.threeM,
    name: 'Clear Anti-Fog Safety Glasses',
    slug: 'clear-anti-fog-safety-glasses',
    sku: '3M-SG-CAF1',
    short_description:
      'Lightweight clear lens safety glasses with anti-fog coating.',
    description:
      'Everyday impact protection with anti-fog coating for humid jobsites and temperature swings. Wraparound polycarbonate lenses meet ANSI Z87+ and include soft nose pads for all-day wear.',
    price: 7.99,
    compare_at_price: 9.99,
    cost: 2.6,
    inventory_quantity: 300,
    low_stock_threshold: 40,
    featured: false,
    bestseller: true,
    active: true,
    weight: 0.08,
    shipping_class: 'standard',
    rating_avg: 4.5,
    rating_count: 276,
    ansi_class: null,
    color: 'Clear',
    size: 'One Size',
    product_type: 'Safety Glasses',
    image_url: '/images/products/clear-anti-fog-safety-glasses.svg',
    specifications: [
      { name: 'Lens', value: 'Clear polycarbonate' },
      { name: 'Coating', value: 'Anti-fog / anti-scratch' },
      { name: 'Rating', value: 'ANSI Z87+' },
    ],
    certifications: ['ANSI Z87+', 'CSA Z94.3'],
    features: ['Anti-fog coating', 'Wraparound coverage', 'Lightweight frame'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000018',
    category_id: CATEGORY_IDS.safetyGlasses,
    brand_id: BRAND_IDS.dewalt,
    name: 'Polarized Safety Sunglasses',
    slug: 'polarized-safety-sunglasses',
    sku: 'DWT-SG-POL',
    short_description:
      'Polarized smoke lens safety glasses for outdoor glare reduction.',
    description:
      'Cut glare on bright jobsites with polarized smoke lenses that still meet impact standards. Rubber temple tips and adjustable nose bridge keep glasses secure during active work.',
    price: 19.99,
    compare_at_price: null,
    cost: 7.0,
    inventory_quantity: 120,
    low_stock_threshold: 15,
    featured: false,
    bestseller: false,
    active: true,
    weight: 0.1,
    shipping_class: 'standard',
    rating_avg: 4.4,
    rating_count: 84,
    ansi_class: null,
    color: 'Smoke',
    size: 'One Size',
    product_type: 'Safety Glasses',
    image_url: '/images/products/polarized-safety-sunglasses.svg',
    specifications: [
      { name: 'Lens', value: 'Polarized smoke' },
      { name: 'Rating', value: 'ANSI Z87+' },
      { name: 'UV', value: 'UV400' },
    ],
    certifications: ['ANSI Z87+'],
    features: ['Polarized lenses', 'UV400 protection', 'Non-slip temples'],
  },
  {
    id: 'c0000000-0000-4000-8000-000000000019',
    category_id: CATEGORY_IDS.fallProtection,
    brand_id: BRAND_IDS.honeywell,
    name: 'Full Body Safety Harness',
    slug: 'full-body-safety-harness',
    sku: 'HNW-FP-FBH1',
    short_description:
      'Universal full-body harness with dorsal D-ring and tongue buckles.',
    description:
      'Fall-arrest ready full-body harness for elevated construction and maintenance. Dorsal D-ring, tongue-buckle leg straps, and high-visibility webbing simplify inspection and donning.',
    price: 89.99,
    compare_at_price: 109.99,
    cost: 41.0,
    inventory_quantity: 47,
    low_stock_threshold: 8,
    featured: false,
    bestseller: true,
    active: true,
    weight: 3.6,
    shipping_class: 'standard',
    rating_avg: 4.6,
    rating_count: 53,
    ansi_class: null,
    color: 'Yellow/Black',
    size: 'Universal',
    product_type: 'Fall Protection',
    image_url: '/images/products/full-body-safety-harness.svg',
    specifications: [
      { name: 'D-Ring', value: 'Dorsal' },
      { name: 'Capacity', value: '310 lb' },
      { name: 'Leg Straps', value: 'Tongue buckle' },
      { name: 'Standard', value: 'ANSI Z359.11' },
    ],
    certifications: ['ANSI Z359.11', 'OSHA 1926.502'],
    features: ['Hi-vis webbing', 'Quick donning', 'Inspection labeling'],
  },
  {
    id: 'c0000000-0000-4000-8000-00000000001a',
    category_id: CATEGORY_IDS.fallProtection,
    brand_id: BRAND_IDS.threeM,
    name: 'Shock Absorbing Lanyard',
    slug: 'shock-absorbing-lanyard',
    sku: '3M-FP-SAL6',
    short_description:
      '6 ft shock-absorbing single-leg lanyard with snap hooks.',
    description:
      'Limit fall forces with an internal shock pack designed for fall arrest systems. Six-foot single-leg lanyard with forged snap hooks for harness and anchorage connection.',
    price: 54.99,
    compare_at_price: null,
    cost: 24.0,
    inventory_quantity: 81,
    low_stock_threshold: 12,
    featured: false,
    bestseller: false,
    active: true,
    weight: 2.2,
    shipping_class: 'standard',
    rating_avg: 4.5,
    rating_count: 39,
    ansi_class: null,
    color: 'Yellow',
    size: '6 ft',
    product_type: 'Fall Protection',
    image_url: '/images/products/shock-absorbing-lanyard.svg',
    specifications: [
      { name: 'Length', value: '6 ft' },
      { name: 'Legs', value: 'Single' },
      { name: 'Hooks', value: 'Forged snap hooks' },
      { name: 'Capacity', value: '310 lb' },
    ],
    certifications: ['ANSI Z359.13', 'OSHA'],
    features: ['Internal shock pack', 'Abrasion-resistant webbing', 'Clear label pack'],
  },
]

/** Helpers for app fallback queries */
export function getSeedCategoryBySlug(slug: string): SeedCategory | undefined {
  return SEED_CATEGORIES.find((c) => c.slug === slug)
}

export function getSeedProductBySlug(slug: string): SeedProduct | undefined {
  return SEED_PRODUCTS.find((p) => p.slug === slug)
}

export function getSeedBrandBySlug(slug: string): SeedBrand | undefined {
  return SEED_BRANDS.find((b) => b.slug === slug)
}

export function getFeaturedSeedProducts(): SeedProduct[] {
  return SEED_PRODUCTS.filter((p) => p.featured)
}

export function getBestsellerSeedProducts(): SeedProduct[] {
  return SEED_PRODUCTS.filter((p) => p.bestseller)
}

export function getHomepageCategories(): SeedCategory[] {
  return HOMEPAGE_CATEGORY_SLUGS.map(
    (slug) => SEED_CATEGORIES.find((c) => c.slug === slug)!,
  )
}
