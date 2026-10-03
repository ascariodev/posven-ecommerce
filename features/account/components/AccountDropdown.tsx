"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { accountLinks } from "../lib/accountLinks";
import { logout } from "../server/actions";

// `showPurchases` lo decide el servidor con el interruptor del carrito: aquí no se lee el entorno.
export function AccountDropdown({ showPurchases }: { showPurchases: boolean }) {
  const logoutForm = useRef<HTMLFormElement>(null);
  const links = accountLinks(showPurchases);
  return (
    <>
      {/* Fuera del menú: al elegir "Salir" el menú se cierra y desmonta su contenido (sin animación
          de salida con movimiento reducido), y un formulario desconectado no se envía. */}
      <form ref={logoutForm} action={logout} hidden />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <User aria-hidden="true" className="size-4" />
            Mi cuenta
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {links.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => logoutForm.current?.requestSubmit()}>Salir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
