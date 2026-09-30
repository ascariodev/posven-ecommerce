// Estado del botón "Agregar al carrito" (useActionState). Vive fuera de actions.ts porque un archivo
// "use server" sólo exporta funciones async.
export type AddToCartState = { status: "idle" | "added" | "error"; message: string | null };

export const INITIAL_ADD_TO_CART_STATE: AddToCartState = { status: "idle", message: null };
