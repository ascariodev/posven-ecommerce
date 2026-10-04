import { SITE_NAME } from "@/lib/site";
import { LEGAL_MARKERS, type LegalDocumentContent } from "./legal";

const [razonSocial, rif, domicilio, correoLegal, vigencia] = LEGAL_MARKERS;

export const privacyDocument: LegalDocumentContent = {
  title: "Política de privacidad",
  sections: [
    {
      heading: "1. Responsable",
      paragraphs: [
        `El responsable del tratamiento de tus datos en ${SITE_NAME} es ${razonSocial}, RIF ${rif}, con domicilio en ${domicilio}.`,
      ],
    },
    {
      heading: "2. Datos que tratamos",
      paragraphs: [
        "Puedes buscar productos sin crear una cuenta. Estos son los datos que el sitio guarda o envía a su servicio, según lo que hagas:",
      ],
      items: [
        "Cuenta: nombre, correo, teléfono y contraseña, que das al registrarte y puedes cambiar desde tu cuenta.",
        "Direcciones: etiqueta, nombre del destinatario, teléfono, ciudad, dirección, referencia y coordenadas, que tú guardas para recibir pedidos.",
        "Ubicación para buscar: la ciudad que eliges o tus coordenadas, redondeadas a tres decimales. Se envían al servicio del sitio como filtro de las búsquedas y se guardan en una cookie del navegador.",
        "Carrito: los productos y cantidades que agregas. Sin sesión se guardan en una cookie del navegador; con sesión, en el servicio del sitio.",
        "Compras: código, estado, fechas y totales de cada compra, la tasa de cambio usada, y por cada comercio sus productos, la modalidad de entrega, la dirección de entrega y el código de retiro.",
        "Preferencias: si quieres recibir correos cuando cambie el estado de tus pedidos, y tus productos y tiendas favoritos.",
        "Vistas y contactos: cuando abres un producto o una tienda, o tocas WhatsApp, llamar o cómo llegar en un comercio, el sitio registra el tipo de evento, el producto o la tienda y un identificador de visita aleatorio. No se registran si el navegador parece un robot.",
        "Búsquedas y carrito: cuando buscas en el sitio, se registra el texto que escribes (recortado, en minúsculas y de hasta 100 caracteres) o la categoría que eliges, la cantidad de resultados y un identificador de visita aleatorio. Cuando agregas un producto al carrito, se registra el producto, la tienda y ese identificador. Tampoco se registran si el navegador parece un robot.",
        "Dirección IP: en las solicitudes de tu cuenta, de tu carrito y de tus compras, el sitio reenvía tu dirección IP a su servicio.",
      ],
    },
    {
      heading: "3. Cookies",
      paragraphs: [
        "El sitio usa cuatro cookies, todas propias, inaccesibles desde scripts del navegador y necesarias para su funcionamiento. No usa cookies de publicidad ni de analítica de terceros.",
      ],
      items: [
        "mp_session: mantiene tu sesión iniciada. Dura 30 días y se borra al cerrar sesión o al eliminar tu cuenta.",
        "mp_cart: guarda el carrito de quien no ha iniciado sesión. Dura 30 días; se borra al vaciar el carrito y al iniciar sesión o registrarte, cuando su contenido pasa a tu carrito.",
        "loc: recuerda la ciudad o las coordenadas que elegiste para buscar. Dura 30 días y puedes borrarla desde el selector de ubicación.",
        "sid: identifica tu visita con un código aleatorio para no contar dos veces el mismo evento. No tiene vencimiento propio: el navegador la descarta al cerrarse, según su configuración.",
      ],
    },
    {
      heading: "4. Para qué los usamos",
      paragraphs: [
        "Usamos tus datos para mantener tu sesión, mostrarte productos y comercios cercanos a la ubicación que elegiste, armar tu carrito, procesar y mostrarte tus compras, enviarte los correos de verificación y de recuperación de contraseña y, si los activaste, los avisos de tus pedidos, y contar vistas y contactos sin duplicarlos. No usamos tus datos para publicidad de terceros.",
      ],
    },
    {
      heading: "5. Con quién se comparten",
      paragraphs: [
        "Cada compra se divide en un pedido por comercio. El pedido lleva los productos, la modalidad de entrega y la dirección de entrega si la hay, y es el comercio quien lo atiende.",
        "Al pagar te llevamos a la página del proveedor de pago, o te mostramos sus instrucciones; allí rige su propia política de privacidad. Los enlaces de WhatsApp y de cómo llegar (Google Maps) abren esos servicios en otra pestaña y se rigen por sus políticas.",
      ],
    },
    {
      heading: "6. Conservación",
      paragraphs: [
        "Las cookies duran lo indicado en la sección 3. Los datos de tu cuenta, direcciones, compras y preferencias se conservan en el servicio del sitio mientras tu cuenta exista.",
        `Para saber qué se conserva tras eliminarla, escribe a ${correoLegal}.`,
      ],
    },
    {
      heading: "7. Tus derechos",
      paragraphs: [
        "Tienes derecho a acceder a tus datos, rectificarlos y pedir su supresión:",
      ],
      items: [
        "Acceso y rectificación: en tu cuenta puedes ver y cambiar tu nombre, teléfono, correo y contraseña, tus direcciones, tus avisos por correo y tus favoritos, y consultar tus compras.",
        "Supresión: desde la configuración de tu cuenta puedes eliminarla con tu contraseña. Para eliminar las cookies, borra los datos del sitio en tu navegador.",
        `Cualquier otra solicitud sobre tus datos, escríbela a ${correoLegal}.`,
      ],
    },
    {
      heading: "8. Contacto y vigencia",
      paragraphs: [
        `Para consultas sobre esta política escribe a ${correoLegal}.`,
        `Esta política rige desde ${vigencia}. Si la modificamos, publicaremos la versión nueva en esta página con su fecha de vigencia.`,
      ],
    },
  ],
};
