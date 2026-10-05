import type { Money } from "@/lib/marketplace/schemas";

export type MerchantBenefitIcon = "nearby" | "inventory" | "online";

export type MerchantStep = { title: string; text: string };
export type MerchantBenefit = { icon: MerchantBenefitIcon; title: string; text: string };
export type MerchantQuestion = { id: string; question: string; answer: string; source: string };

export const EXAMPLE_PRICE_USD: Money = "1.35";
export const EXAMPLE_DISTANCE_KM = 0.8;

export const MERCHANT_STEPS: MerchantStep[] = [
  {
    title: "Activa tu tienda en el panel",
    text: "Desde la administración eliges activar tu tienda: tus productos vendibles con stock se publican solos y puedes excluir los que no quieras.",
  },
  {
    title: "Tus precios vienen de tu caja",
    text: "El inventario y los precios que tu caja ya sincroniza son los que ve el comprador, y cada oferta muestra cuándo se actualizó.",
  },
  {
    title: "Recibe visitas, contactos y pedidos",
    text: "Quien te encuentra te escribe por WhatsApp, te llama o abre la ruta, y las vistas y los contactos los ves en tu backoffice.",
  },
];

export const MERCHANT_BENEFITS: MerchantBenefit[] = [
  {
    icon: "nearby",
    title: "Te encuentran cerca",
    text: "Apareces a quien busca dentro de su radio, ordenado por precio o por cercanía.",
  },
  {
    icon: "inventory",
    title: "Un solo inventario",
    text: "La caja y la web comparten el mismo inventario, sin cargas dobles.",
  },
  {
    icon: "online",
    title: "Vende en línea si quieres",
    text: "Puedes recibir pedidos con retiro o entrega, o sólo mostrar tus precios y tu contacto.",
  },
];

export const MERCHANT_QUESTIONS: MerchantQuestion[] = [
  {
    id: "carga",
    question: "¿Necesito otro sistema o cargar productos aparte?",
    answer:
      "No. Los productos vendibles con stock salen del inventario que tu caja ya sincroniza y se publican solos; puedes excluir los que no quieras. Los medicamentos controlados no se publican.",
    source: "spec hiperlocal §1 (decisión 5) y §3.1",
  },
  {
    id: "venta-en-linea",
    question: "¿Tengo que vender en línea?",
    answer:
      "No. La venta en línea de cada tienda empieza apagada: mientras no la actives, los compradores ven tus precios y te contactan por WhatsApp o teléfono.",
    source: "spec cuentas y compras §1 (decisión 13); spec hiperlocal §1 (decisión 2)",
  },
  {
    id: "entrega",
    question: "¿Puedo entregar a domicilio?",
    answer:
      "Cada tienda decide si entrega, con un radio en km y un costo fijo. Fuera de ese radio, el comprador sólo puede elegir retiro.",
    source: "spec cuentas y compras §1 (decisión 3), §5.3 y §6",
  },
  {
    id: "recipe",
    question: "¿Qué pasa con los medicamentos con récipe?",
    answer:
      "Se publican con el aviso «requiere récipe» y sin botón de WhatsApp; llamar y ver la ruta siguen disponibles.",
    source: "spec hiperlocal §3.1 (regla 5)",
  },
];
