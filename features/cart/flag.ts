// Interruptor del carrito (plan 4a de cuentas, decisión 3): encendido con MARKETPLACE_CART_ENABLED=1
// o en modo simulado, con la misma regla que `usesMock()` de lib/marketplace/client.ts (sin
// MARKETPLACE_MODE es simulado). Apagado en producción hasta que posveapi despliegue su plan 3.
// Lo prerenderizado lo fija al construir: cambiarlo exige reconstruir.
export function cartEnabled(): boolean {
  if (process.env.MARKETPLACE_CART_ENABLED === "1") return true;
  return (process.env.MARKETPLACE_MODE ?? "mock") === "mock";
}
