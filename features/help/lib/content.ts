export type HelpTopicIcon = "how" | "payments" | "pickup" | "account" | "recipes";

export type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  icon: HelpTopicIcon;
};

export type HelpQuestion = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  source: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  { id: "como", title: "Cómo funciona", summary: "Buscar, comparar y elegir tienda", icon: "how" },
  { id: "pagos", title: "Pagos", summary: "Bolívares, tasa y plazos", icon: "payments" },
  { id: "retiro", title: "Retiro y entrega", summary: "Códigos de retiro, costos y radio", icon: "pickup" },
  { id: "cuenta", title: "Mi cuenta", summary: "Sesión, carrito y facturación", icon: "account" },
  { id: "recipes", title: "Récipes y controlados", summary: "Medicamentos con requisitos de venta", icon: "recipes" },
];

export const HELP_QUESTIONS: HelpQuestion[] = [
  {
    id: "precios-tienda",
    topic: "como",
    question: "¿Los precios son los de la tienda?",
    answer:
      "Sí. Cada tienda publica los precios de su caja posven, con IVA incluido, y en cada oferta ves cuándo se actualizaron por última vez.",
    source: "spec hiperlocal §1 y §3.1 (puntos 2 y 4); features/product/components/OfferCard.tsx",
  },
  {
    id: "varias-tiendas",
    topic: "como",
    question: "¿Puedo comprar en varias tiendas a la vez?",
    answer:
      "Sí. Pagas una sola vez y cada tienda prepara su parte del pedido. En cada tienda eliges si retiras o recibes en casa, cuando ofrece entrega.",
    source: "spec cuentas y compras §1 (decisiones 2 y 3) y §5.3; RN-CHECKOUT-02",
  },
  {
    id: "sin-producto",
    topic: "como",
    question: "¿Qué pasa si la tienda no tiene el producto?",
    answer:
      "Si se agota antes de que pagues, el carrito lo marca no disponible y no pasa al pago. Si la tienda lo marca faltante después de tu compra, esa línea se reembolsa por el mismo medio de pago y el detalle la muestra como «Faltante · reembolsado»; si falta todo, el pedido se cancela.",
    source: "spec cuentas y compras §5.2 y §5.5; RN-PURCHASES-02",
  },
  {
    id: "precio-bolivares",
    topic: "pagos",
    question: "¿Por qué cambia el precio en bolívares?",
    answer:
      "El precio en bolívares sale del precio de la tienda y de la última tasa BCV, que ves con su fecha junto a los precios. Al pagar, los montos quedan fijados con la tasa de ese momento y no cambian después; si el total cambia antes del cobro, te lo mostramos y confirmas de nuevo.",
    source:
      "spec hiperlocal §3.1 (punto 2) y tabla de casos (tasa del día); spec cuentas y compras (montos al pagar); RN-CHECKOUT-02",
  },
  {
    id: "pago-pendiente",
    topic: "pagos",
    question: "¿Qué pasa si no termino de pagar?",
    answer:
      "La compra queda pendiente 30 minutos. Si no se confirma el pago en ese plazo vence, y si el pago falla queda como fallido. En ambos casos tu carrito no cambia. Si el pago llega cuando la compra ya venció, se te reembolsa completo.",
    source: "spec cuentas y compras §5.3 (puntos 3 y 5) y tabla de casos (late_payment); RN-CHECKOUT-04",
  },
  {
    id: "retirar-pedido",
    topic: "retiro",
    question: "¿Cómo retiro mi pedido?",
    answer:
      "Cuando la tienda deja tu pedido listo, pasa a «Listo para retirar» y en el detalle de la compra, dentro de tu cuenta, aparece el código de retiro. La tienda lo pide para entregarte el pedido.",
    source: "spec cuentas y compras §5.5; RN-PURCHASES-02 y RN-PURCHASES-04",
  },
  {
    id: "costo-entrega",
    topic: "retiro",
    question: "¿Cuánto cuesta la entrega?",
    answer:
      "Cada tienda decide si entrega, hasta qué distancia y cuánto cobra; la tarifa la ves en el carrito y en el pago antes de confirmar. Si tu dirección queda fuera del radio o no tiene coordenadas, esa tienda sólo ofrece retiro.",
    source:
      "spec cuentas y compras §1 (decisión 3), §5.2, §5.3 y tabla de casos; RN-CHECKOUT-02 y RN-ACCOUNT-06",
  },
  {
    id: "necesito-cuenta",
    topic: "cuenta",
    question: "¿Necesito una cuenta para comprar?",
    answer:
      "Para buscar y comparar precios, no. Para pagar sí: debes iniciar sesión con tu correo ya verificado. El carrito sólo existe cuando el sitio tiene la compra en línea activa y en las tiendas que venden en línea; ahí, lo que armaste sin sesión se suma al carrito de tu cuenta al entrar.",
    source: "RN-CART-01, RN-CART-02, RN-CART-03, RN-CART-04 y RN-CHECKOUT-01; spec cuentas y compras §5.2",
  },
  {
    id: "factura-nombre",
    topic: "cuenta",
    question: "¿Cómo pido la factura a mi nombre?",
    answer:
      "En el pago marca «Factura a mi nombre». Sale marcada si tu perfil tiene datos de facturación; si no, la casilla está deshabilitada con un enlace a tu perfil para completarlos, y la compra sale a consumidor final.",
    source: "RN-CHECKOUT-05; spec cuentas y compras §5.3 (punto 2)",
  },
  {
    id: "medicamentos-recipe",
    topic: "recipes",
    question: "¿Puedo comprar medicamentos con récipe?",
    answer:
      "Se muestran con el aviso «Requiere récipe», pero no se agregan al carrito ni tienen botón de WhatsApp: consúltalo en la tienda, que puedes llamar si publica su teléfono. Los medicamentos controlados no se publican en el sitio.",
    source:
      "RN-SEARCH-03, RN-CART-03 y RN-EVENTS-03; spec hiperlocal §3.1 (punto 5); spec cuentas y compras §5.2",
  },
];
