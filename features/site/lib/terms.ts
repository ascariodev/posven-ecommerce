import { SITE_NAME } from "@/lib/site";
import { LEGAL_MARKERS, type LegalDocumentContent } from "./legal";

const [razonSocial, rif, domicilio, correoLegal, vigencia] = LEGAL_MARKERS;

export const termsDocument: LegalDocumentContent = {
  title: "Términos de uso",
  sections: [
    {
      heading: "1. Qué es el sitio",
      paragraphs: [
        `${SITE_NAME} es un buscador que muestra ofertas de productos de comercios independientes cercanos al lugar que elijas, y que permite comprarles. El sitio lo opera ${razonSocial}, RIF ${rif}, con domicilio en ${domicilio}.`,
        `${SITE_NAME} no es el vendedor de los productos: los ofrece cada comercio.`,
      ],
    },
    {
      heading: "2. Cuentas",
      paragraphs: [
        "Puedes buscar productos sin crear una cuenta. Para comprar necesitas registrarte con tus datos de contacto y mantenerlos al día.",
        "Eres responsable de la confidencialidad de tu contraseña y de lo que se haga con tu cuenta. Si crees que alguien accedió sin tu permiso, avísanos por el correo de contacto de la sección 9.",
      ],
    },
    {
      heading: "3. Precios y tasa de cambio",
      paragraphs: [
        "Cada comercio fija sus precios y los publica en dólares. El sitio los muestra también en bolívares con la tasa de cambio que informa en pantalla.",
        "El monto en bolívares puede variar con la tasa vigente; el total que se te cobra es el que aparece al confirmar la compra.",
      ],
    },
    {
      heading: "4. Compras, entrega y reembolsos",
      paragraphs: [
        "Al comprar celebras un contrato con el comercio vendedor, no con el sitio. El comercio responde por la disponibilidad, la calidad y la entrega del producto.",
        "Puedes elegir retiro en tienda o entrega, según lo que ofrezca el comercio. Cuando el comercio tiene tu pedido listo recibes un código para presentar al retirarlo.",
        "Los cambios, devoluciones y reembolsos se rigen por la política del comercio y por la ley aplicable. Para pedirlos, contacta primero al comercio; si no obtienes respuesta, escríbenos al correo de la sección 9.",
      ],
    },
    {
      heading: "5. Conducta prohibida",
      paragraphs: ["Al usar el sitio te comprometes a no:"],
      items: [
        "dar datos falsos o suplantar a otra persona;",
        "usar el sitio para fines ilícitos o contrarios a estos términos;",
        "intentar acceder a sistemas o datos que no te corresponden, ni interferir con el funcionamiento del sitio;",
        "extraer su contenido de forma automatizada sin autorización.",
      ],
    },
    {
      heading: "6. Responsabilidad",
      paragraphs: [
        "Procuramos que la información del sitio sea correcta y esté actualizada, pero los precios, la existencia y las distancias provienen de los comercios y pueden cambiar sin aviso.",
        "En la medida que la ley lo permita, el sitio no responde por los daños derivados de la relación entre comprador y comercio, ni por interrupciones del servicio ajenas a su control.",
      ],
    },
    {
      heading: "7. Propiedad intelectual",
      paragraphs: [
        `El diseño, los textos y la marca ${SITE_NAME} pertenecen a ${razonSocial} o a quien los licencia. Las imágenes y descripciones de los productos pertenecen a cada comercio.`,
        "No puedes reproducirlos ni usarlos con fines comerciales sin autorización.",
      ],
    },
    {
      heading: "8. Ley aplicable",
      paragraphs: [
        "Estos términos se rigen por las leyes de la República Bolivariana de Venezuela. Cualquier controversia se somete a los tribunales competentes de ese país.",
      ],
    },
    {
      heading: "9. Contacto y vigencia",
      paragraphs: [
        `Para consultas sobre estos términos escribe a ${correoLegal}.`,
        `Estos términos rigen desde ${vigencia}. Si los modificamos, publicaremos la versión nueva en esta página con su fecha de vigencia.`,
      ],
    },
  ],
};
