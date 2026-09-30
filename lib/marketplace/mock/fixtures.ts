import type { FavoriteTarget } from "../params";
import type {
  Address,
  Category,
  CategoryNode,
  CityRef,
  Customer,
  LocationState,
  Money,
  Offer,
  Product,
  Rate,
  ScheduleEntry,
  StoreSummary,
} from "../schemas";

// `offers_delivery` e `is_open` son del carrito (Cart), no de StoreSummary; `is_open` es fijo para que
// el simulado no dependa de la hora.
export type MockStore = {
  summary: StoreSummary;
  distance_km: number;
  offers_delivery: boolean;
  is_open: boolean;
};

export type MockOffer = {
  store_slug: string;
  price_usd: Money;
  price_ves: Money;
  availability: Offer["availability"];
  updated_at: string;
};

export type MockProduct = {
  product: Product;
  min_price_usd: Money;
  min_price_ves: Money;
  nearest_km: number;
  offers: MockOffer[];
};

export const MOCK_RATE: Rate = { usd_ves: "36.50", valid_on: "2026-09-26" };

const valencia: CityRef = { slug: "valencia", name: "Valencia" };
const naguanagua: CityRef = { slug: "naguanagua", name: "Naguanagua" };
const caracas: CityRef = { slug: "caracas", name: "Caracas" };

export const MOCK_LOCATIONS: LocationState[] = [
  {
    slug: "carabobo",
    name: "Carabobo",
    municipalities: [
      { slug: "valencia", name: "Valencia", cities: [valencia] },
      { slug: "naguanagua", name: "Naguanagua", cities: [naguanagua] },
    ],
  },
  {
    slug: "distrito-capital",
    name: "Distrito Capital",
    municipalities: [{ slug: "libertador", name: "Libertador", cities: [caracas] }],
  },
];

const salud: Category = { slug: "salud-y-medicamentos", name: "Salud y medicamentos", parent_slug: null };
const alimentos: Category = { slug: "alimentos", name: "Alimentos", parent_slug: null };
const bebidas: Category = { slug: "bebidas", name: "Bebidas", parent_slug: null };
const ferreteria: Category = { slug: "ferreteria", name: "Ferretería", parent_slug: null };
const dolorYFiebre: Category = { slug: "dolor-y-fiebre", name: "Dolor y fiebre", parent_slug: "salud-y-medicamentos" };
const gripe: Category = { slug: "gripe-y-respiratorio", name: "Gripe y respiratorio", parent_slug: "salud-y-medicamentos" };
const antibioticos: Category = {
  slug: "antibioticos-y-antiinfecciosos",
  name: "Antibióticos y antiinfecciosos",
  parent_slug: "salud-y-medicamentos",
};
const vitaminas: Category = {
  slug: "vitaminas-y-suplementos",
  name: "Vitaminas y suplementos",
  parent_slug: "salud-y-medicamentos",
};
const viveres: Category = { slug: "viveres", name: "Víveres", parent_slug: "alimentos" };
const lacteos: Category = { slug: "lacteos-y-huevos", name: "Lácteos y huevos", parent_slug: "alimentos" };
const aguaYRefrescos: Category = { slug: "agua-y-refrescos", name: "Agua y refrescos", parent_slug: "bebidas" };
const cafe: Category = { slug: "cafe-y-te", name: "Café y té", parent_slug: "bebidas" };
const herramientas: Category = { slug: "herramientas", name: "Herramientas", parent_slug: "ferreteria" };
const electricidad: Category = { slug: "electricidad", name: "Electricidad", parent_slug: "ferreteria" };
const pinturas: Category = { slug: "pinturas", name: "Pinturas", parent_slug: "ferreteria" };

function node(category: Category, children: Category[]): CategoryNode {
  return { ...category, children: children.map((child) => ({ ...child, children: [] })) };
}

export const MOCK_CATEGORIES: CategoryNode[] = [
  node(salud, [dolorYFiebre, gripe, antibioticos, vitaminas]),
  node(alimentos, [viveres, lacteos]),
  node(bebidas, [aguaYRefrescos, cafe]),
  node(ferreteria, [herramientas, electricidad, pinturas]),
];

export const MOCK_STORES: MockStore[] = [
  {
    summary: {
      slug: "farmacia-central-valencia",
      name: "Farmacia Central",
      logo_url: null,
      address: "Av. Bolívar Norte, local 12",
      city: valencia,
      latitude: 10.1805,
      longitude: -68.0045,
      phone: "+582418250011",
      whatsapp: "+584141250011",
      is_premium: true,
      accepts_orders: true,
    },
    distance_km: 1.2,
    offers_delivery: true,
    is_open: true,
  },
  {
    summary: {
      slug: "ferreteria-el-tornillo",
      name: "Ferretería El Tornillo",
      logo_url: null,
      address: "Calle Colombia, galpón 4",
      city: valencia,
      latitude: 10.1621,
      longitude: -68.0078,
      phone: "+582418570022",
      whatsapp: null,
      is_premium: false,
      accepts_orders: false,
    },
    distance_km: 4.8,
    offers_delivery: false,
    is_open: true,
  },
  {
    summary: {
      slug: "abasto-la-esquina",
      name: "Abasto La Esquina",
      logo_url: null,
      address: "Av. Universidad, esquina calle 137",
      city: naguanagua,
      latitude: 10.2447,
      longitude: -68.0107,
      phone: null,
      whatsapp: "+584244410033",
      is_premium: false,
      accepts_orders: true,
    },
    distance_km: 7.5,
    offers_delivery: false,
    is_open: true,
  },
  {
    summary: {
      slug: "farmacia-naguanagua",
      name: "Farmacia Naguanagua",
      logo_url: null,
      address: "C.C. La Granja, nivel 1",
      city: naguanagua,
      latitude: 10.2581,
      longitude: -68.0132,
      phone: "+582418660044",
      whatsapp: "+584124460044",
      is_premium: false,
      accepts_orders: false,
    },
    distance_km: 9.3,
    offers_delivery: false,
    is_open: true,
  },
  {
    summary: {
      slug: "farmacia-altamira",
      name: "Farmacia Altamira",
      logo_url: null,
      address: "Av. Luis Roche, edificio Altamira, PB",
      city: caracas,
      latitude: 10.4966,
      longitude: -66.8494,
      phone: "+582122630055",
      whatsapp: "+584142630055",
      is_premium: true,
      accepts_orders: true,
    },
    distance_km: 165.4,
    offers_delivery: true,
    is_open: false,
  },
  {
    summary: {
      slug: "bodegon-los-palos-grandes",
      name: "Bodegón Los Palos Grandes",
      logo_url: null,
      address: "3ra transversal de Los Palos Grandes, local 7",
      city: caracas,
      latitude: 10.5006,
      longitude: -66.8412,
      phone: "+582122850066",
      whatsapp: "+584242850066",
      is_premium: false,
      accepts_orders: false,
    },
    distance_km: 168.0,
    offers_delivery: false,
    is_open: true,
  },
];

type MockStoreDetails = { company_name: string; cover_url: null; schedule: ScheduleEntry[] };

const pharmacySchedule: ScheduleEntry[] = [
  { days: ["mo", "tu", "we", "th", "fr", "sa"], opens: "08:00", closes: "20:00" },
  { days: ["su"], opens: "09:00", closes: "13:00" },
];

const shopSchedule: ScheduleEntry[] = [
  { days: ["mo", "tu", "we", "th", "fr", "sa"], opens: "08:00", closes: "18:00" },
];

export const MOCK_STORE_DETAILS: Record<string, MockStoreDetails> = {
  "farmacia-central-valencia": {
    company_name: "Farmacia Central C.A.",
    cover_url: null,
    schedule: pharmacySchedule,
  },
  "ferreteria-el-tornillo": {
    company_name: "Ferretería El Tornillo C.A.",
    cover_url: null,
    schedule: shopSchedule,
  },
  "abasto-la-esquina": {
    company_name: "Abasto La Esquina C.A.",
    cover_url: null,
    schedule: shopSchedule,
  },
  "farmacia-naguanagua": {
    company_name: "Farmacia Naguanagua C.A.",
    cover_url: null,
    schedule: pharmacySchedule,
  },
  "farmacia-altamira": {
    company_name: "Farmacia Altamira C.A.",
    cover_url: null,
    schedule: pharmacySchedule,
  },
  "bodegon-los-palos-grandes": {
    company_name: "Bodegón Los Palos Grandes C.A.",
    cover_url: null,
    schedule: shopSchedule,
  },
};

function offer(
  store_slug: string,
  price_usd: Money,
  price_ves: Money,
  availability: Offer["availability"] = "available",
): MockOffer {
  return { store_slug, price_usd, price_ves, availability, updated_at: "2026-09-26T14:30:00Z" };
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    product: {
      slug: "acetaminofen-500-mg-20-tabletas",
      name: "Acetaminofén 500 mg x 20 tabletas",
      ean: "7590000000011",
      brand: "Genven",
      category: dolorYFiebre,
      image_url: null,
      attributes: [
        { name: "Concentración", value: "500 mg" },
        { name: "Presentación", value: "20 tabletas" },
      ],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "2.35",
    min_price_ves: "85.78",
    nearest_km: 1.2,
    offers: [
      offer("farmacia-central-valencia", "2.50", "91.25"),
      offer("farmacia-naguanagua", "2.35", "85.78", "low"),
      offer("farmacia-altamira", "2.80", "102.20"),
      offer("abasto-la-esquina", "2.40", "87.60"),
    ],
  },
  {
    product: {
      slug: "acetaminofen-650-mg-10-tabletas",
      name: "Acetaminofén 650 mg x 10 tabletas",
      ean: "7590000000028",
      brand: "Calox",
      category: dolorYFiebre,
      image_url: null,
      attributes: [{ name: "Concentración", value: "650 mg" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.90",
    min_price_ves: "69.35",
    nearest_km: 1.2,
    offers: [
      offer("farmacia-central-valencia", "1.90", "69.35"),
      offer("farmacia-altamira", "2.10", "76.65"),
    ],
  },
  {
    product: {
      slug: "acetaminofen-infantil-jarabe-120-ml",
      name: "Acetaminofén infantil jarabe 120 ml",
      ean: "7590000000035",
      brand: "Atamel",
      category: dolorYFiebre,
      image_url: null,
      attributes: [{ name: "Presentación", value: "Jarabe 120 ml" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "3.40",
    min_price_ves: "124.10",
    nearest_km: 9.3,
    offers: [offer("farmacia-naguanagua", "3.40", "124.10")],
  },
  {
    product: {
      slug: "ibuprofeno-400-mg-10-tabletas",
      name: "Ibuprofeno 400 mg x 10 tabletas",
      ean: "7590000000042",
      brand: "Brugesic",
      category: dolorYFiebre,
      image_url: null,
      attributes: [{ name: "Concentración", value: "400 mg" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "2.05",
    min_price_ves: "74.83",
    nearest_km: 1.2,
    offers: [
      offer("farmacia-central-valencia", "2.20", "80.30"),
      offer("farmacia-naguanagua", "2.05", "74.83"),
    ],
  },
  {
    product: {
      slug: "amoxicilina-500-mg-21-capsulas",
      name: "Amoxicilina 500 mg x 21 cápsulas",
      ean: "7590000000059",
      brand: "Genven",
      category: antibioticos,
      image_url: null,
      attributes: [{ name: "Concentración", value: "500 mg" }],
      restriction: "recipe",
      is_unified: true,
    },
    min_price_usd: "6.80",
    min_price_ves: "248.20",
    nearest_km: 1.2,
    offers: [
      offer("farmacia-central-valencia", "6.80", "248.20"),
      offer("farmacia-altamira", "7.10", "259.15", "low"),
    ],
  },
  {
    product: {
      slug: "loratadina-10-mg-10-tabletas",
      name: "Loratadina 10 mg x 10 tabletas",
      ean: "7590000000066",
      brand: "La Santé",
      category: gripe,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "4.10",
    min_price_ves: "149.65",
    nearest_km: 9.3,
    offers: [
      offer("farmacia-naguanagua", "4.30", "156.95"),
      offer("farmacia-altamira", "4.10", "149.65"),
    ],
  },
  {
    product: {
      slug: "vitamina-c-500-mg-30-tabletas",
      name: "Vitamina C 500 mg x 30 tabletas",
      ean: "7590000000073",
      brand: "Redoxon",
      category: vitaminas,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "5.50",
    min_price_ves: "200.75",
    nearest_km: 165.4,
    offers: [offer("farmacia-altamira", "5.50", "200.75")],
  },
  {
    product: {
      slug: "alcohol-isopropilico-250-ml",
      name: "Alcohol isopropílico 250 ml",
      ean: null,
      brand: "Kanol",
      category: null,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.60",
    min_price_ves: "58.40",
    nearest_km: 1.2,
    offers: [
      offer("farmacia-central-valencia", "1.60", "58.40"),
      offer("abasto-la-esquina", "1.75", "63.88"),
    ],
  },
  {
    product: {
      slug: "harina-de-maiz-precocida-1-kg",
      name: "Harina de maíz precocida 1 kg",
      ean: "7591002000011",
      brand: "P.A.N.",
      category: viveres,
      image_url: null,
      attributes: [{ name: "Peso", value: "1 kg" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.20",
    min_price_ves: "43.80",
    nearest_km: 7.5,
    offers: [
      offer("abasto-la-esquina", "1.20", "43.80"),
      offer("bodegon-los-palos-grandes", "1.35", "49.28"),
    ],
  },
  {
    product: {
      slug: "arroz-blanco-tipo-i-1-kg",
      name: "Arroz blanco tipo I 1 kg",
      ean: "7591002000028",
      brand: "Mary",
      category: viveres,
      image_url: null,
      attributes: [{ name: "Peso", value: "1 kg" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.45",
    min_price_ves: "52.93",
    nearest_km: 7.5,
    offers: [offer("abasto-la-esquina", "1.45", "52.93", "low")],
  },
  {
    product: {
      slug: "caraotas-negras-500-g",
      name: "Caraotas negras 500 g",
      ean: "7591002000035",
      brand: "Pantera",
      category: viveres,
      image_url: null,
      attributes: [{ name: "Peso", value: "500 g" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.80",
    min_price_ves: "65.70",
    nearest_km: 7.5,
    offers: [
      offer("abasto-la-esquina", "1.80", "65.70"),
      offer("bodegon-los-palos-grandes", "2.05", "74.83"),
    ],
  },
  {
    product: {
      slug: "leche-completa-en-polvo-400-g",
      name: "Leche completa en polvo 400 g",
      ean: "7591002000042",
      brand: "La Campiña",
      category: lacteos,
      image_url: null,
      attributes: [{ name: "Peso", value: "400 g" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "6.90",
    min_price_ves: "251.85",
    nearest_km: 7.5,
    offers: [
      offer("abasto-la-esquina", "6.90", "251.85"),
      offer("bodegon-los-palos-grandes", "7.40", "270.10"),
    ],
  },
  {
    product: {
      slug: "queso-blanco-duro-500-g-abasto-la-esquina",
      name: "Queso blanco duro 500 g",
      ean: null,
      brand: null,
      category: lacteos,
      image_url: null,
      attributes: [{ name: "Peso", value: "500 g" }],
      restriction: "none",
      is_unified: false,
    },
    min_price_usd: "3.60",
    min_price_ves: "131.40",
    nearest_km: 7.5,
    offers: [offer("abasto-la-esquina", "3.60", "131.40")],
  },
  {
    product: {
      slug: "cafe-molido-500-g",
      name: "Café molido 500 g",
      ean: "7591002000059",
      brand: "Fama de América",
      category: cafe,
      image_url: null,
      attributes: [{ name: "Peso", value: "500 g" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "5.20",
    min_price_ves: "189.80",
    nearest_km: 7.5,
    offers: [
      offer("abasto-la-esquina", "5.20", "189.80"),
      offer("bodegon-los-palos-grandes", "5.60", "204.40"),
    ],
  },
  {
    product: {
      slug: "malta-355-ml",
      name: "Malta 355 ml",
      ean: "7591002000066",
      brand: "Maltín Polar",
      category: aguaYRefrescos,
      image_url: null,
      attributes: [{ name: "Volumen", value: "355 ml" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "0.85",
    min_price_ves: "31.03",
    nearest_km: 7.5,
    offers: [
      offer("abasto-la-esquina", "0.85", "31.03"),
      offer("bodegon-los-palos-grandes", "0.95", "34.68"),
    ],
  },
  {
    product: {
      slug: "aceite-de-maiz-1-l",
      name: "Aceite de maíz 1 l",
      ean: "7591002000073",
      brand: "Mazeite",
      category: alimentos,
      image_url: null,
      attributes: [{ name: "Volumen", value: "1 l" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "3.95",
    min_price_ves: "144.18",
    nearest_km: 7.5,
    offers: [offer("abasto-la-esquina", "3.95", "144.18")],
  },
  {
    product: {
      slug: "martillo-de-una-16-oz",
      name: "Martillo de uña 16 oz",
      ean: "7506240600011",
      brand: "Truper",
      category: herramientas,
      image_url: null,
      attributes: [{ name: "Peso", value: "16 oz" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "8.50",
    min_price_ves: "310.25",
    nearest_km: 4.8,
    offers: [offer("ferreteria-el-tornillo", "8.50", "310.25")],
  },
  {
    product: {
      slug: "destornillador-phillips-1-4-x-4",
      name: "Destornillador Phillips 1/4 x 4 pulgadas",
      ean: "7506240600028",
      brand: "Stanley",
      category: herramientas,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "3.25",
    min_price_ves: "118.63",
    nearest_km: 4.8,
    offers: [offer("ferreteria-el-tornillo", "3.25", "118.63", "low")],
  },
  {
    product: {
      slug: "cinta-aislante-negra-18-m",
      name: "Cinta aislante negra 18 m",
      ean: "7506240600035",
      brand: "3M",
      category: electricidad,
      image_url: null,
      attributes: [{ name: "Largo", value: "18 m" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.10",
    min_price_ves: "40.15",
    nearest_km: 4.8,
    offers: [
      offer("ferreteria-el-tornillo", "1.10", "40.15"),
      offer("abasto-la-esquina", "1.30", "47.45"),
    ],
  },
  {
    product: {
      slug: "bombillo-led-9-w-luz-blanca",
      name: "Bombillo LED 9 W luz blanca",
      ean: "7506240600042",
      brand: "Philips",
      category: electricidad,
      image_url: null,
      attributes: [{ name: "Potencia", value: "9 W" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "2.40",
    min_price_ves: "87.60",
    nearest_km: 4.8,
    offers: [
      offer("ferreteria-el-tornillo", "2.40", "87.60"),
      offer("bodegon-los-palos-grandes", "2.90", "105.85"),
    ],
  },
  {
    product: {
      slug: "pintura-de-caucho-blanco-1-galon",
      name: "Pintura de caucho blanco 1 galón",
      ean: "7506240600059",
      brand: "Montana",
      category: pinturas,
      image_url: null,
      attributes: [{ name: "Color", value: "Blanco" }],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "18.00",
    min_price_ves: "657.00",
    nearest_km: 4.8,
    offers: [offer("ferreteria-el-tornillo", "18.00", "657.00")],
  },
  {
    product: {
      slug: "brocha-de-2-pulgadas",
      name: "Brocha de 2 pulgadas",
      ean: "7506240600066",
      brand: "Truper",
      category: pinturas,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
    },
    min_price_usd: "1.95",
    min_price_ves: "71.18",
    nearest_km: 4.8,
    offers: [offer("ferreteria-el-tornillo", "1.95", "71.18")],
  },
  {
    product: {
      slug: "clonazepam-0-5-mg-30-tabletas",
      name: "Clonazepam 0,5 mg x 30 tabletas",
      ean: "7590000000240",
      brand: "Genven",
      category: salud,
      image_url: null,
      attributes: [{ name: "Concentración", value: "0,5 mg" }],
      restriction: "controlled",
      is_unified: true,
    },
    min_price_usd: "4.20",
    min_price_ves: "153.30",
    nearest_km: 1.2,
    offers: [offer("farmacia-central-valencia", "4.20", "153.30")],
  },
];

export const MOCK_REDIRECTS: Record<string, string> = {
  "acetaminofen-500mg-x-20": "acetaminofen-500-mg-20-tabletas",
};

export const MOCK_UNAVAILABLE_PRODUCTS: Product[] = [
  {
    slug: "jarabe-para-la-tos-120-ml",
    name: "Jarabe para la tos 120 ml",
    ean: null,
    brand: null,
    category: salud,
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: false,
  },
];

export type MockAccount = {
  id: number;
  customer: Customer;
  password: string;
  addresses: Address[];
  favorites: FavoriteTarget[];
};

export const MOCK_ACCOUNT_SEED: MockAccount[] = [
  {
    id: 1,
    customer: {
      name: "Comprador de prueba",
      email: "comprador@posven.test",
      phone: "+584141234567",
      email_verified: true,
      pending_email: null,
      settings: { order_status_emails: true },
    },
    password: "clave-segura-1",
    addresses: [
      {
        id: 1,
        label: "Casa",
        recipient_name: "Comprador de prueba",
        phone: "+584141234567",
        city: valencia,
        line: "Av. Bolívar Norte, edificio Sol, piso 3",
        reference: null,
        lat: 10.162,
        lng: -68.007,
        is_default: true,
      },
    ],
    favorites: [],
  },
];

export const MOCK_VERIFY_TOKEN = "verificacion-simulada";
export const MOCK_RESET_TOKEN = "restablecer-simulado";
export const MOCK_EXPIRED_TOKEN = "enlace-vencido";
export const MOCK_RATE_LIMITED_EMAIL = "limite@posven.test";
