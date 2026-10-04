import type { Metadata } from "next";
import { Bell, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ToastButton } from "./ToastButton";

export const metadata: Metadata = {
  title: "Vista previa de tokens",
  robots: { index: false, follow: false },
};

const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ["background", "bg-background text-foreground border border-border"],
  ["foreground", "bg-foreground text-background"],
  ["card", "bg-card text-card-foreground border border-border"],
  ["popover", "bg-popover text-popover-foreground border border-border"],
  ["primary", "bg-primary text-primary-foreground"],
  ["primary-soft", "bg-primary-soft text-primary-text"],
  ["primary-text", "bg-background text-primary-text border border-border"],
  ["ink", "bg-ink text-ink-foreground"],
  ["buy-deep", "bg-buy-deep text-buy-deep-foreground"],
  ["muted", "bg-muted text-muted-foreground"],
  ["tile", "bg-tile text-tile-foreground"],
  ["success", "bg-success-soft text-success"],
  ["warning", "bg-warning-soft text-warning"],
  ["destructive-text", "bg-background text-destructive-text border border-border"],
  ["destructive", "bg-destructive text-primary-foreground"],
  ["border", "bg-background text-foreground border-2 border-border"],
  ["input-border", "bg-background text-foreground border-2 border-input-border"],
];

const TYPE_SCALE: ReadonlyArray<readonly [string, string]> = [
  ["font-heading text-4xl font-bold", "Título de portada"],
  ["font-heading text-3xl font-semibold", "Título de página"],
  ["font-heading text-2xl font-semibold", "Título de sección"],
  ["font-heading text-xl font-medium", "Subtítulo"],
  ["text-lg", "Texto destacado"],
  ["text-base", "Texto de párrafo y controles"],
  ["text-sm", "Texto secundario"],
  ["text-xs", "Etiquetas y notas"],
];

const BADGES = ["default", "secondary", "destructive", "outline", "warning", "best"] as const;
const BUTTONS = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Panel({ id, label, dark }: { id: string; label: string; dark?: boolean }) {
  return (
    <div className={`${dark ? "dark " : ""}space-y-8 rounded-3xl border border-border bg-background p-6 text-foreground`}>
      <h2 className="font-heading text-2xl font-bold">{label}</h2>

      <Section title="Tokens">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SWATCHES.map(([name, classes]) => (
            <li key={name} className={`rounded-lg px-3 py-4 text-xs font-medium ${classes}`}>
              {name}
            </li>
          ))}
        </ul>
        <div className="flex gap-3" aria-hidden>
          <div className="size-16 rounded-lg bg-card shadow-card" />
          <div className="size-16 rounded-lg bg-card shadow-raised" />
          <div className="size-16 rounded-lg border border-glass-border bg-glass" />
          <div className="size-16 rounded-lg bg-overlay" />
        </div>
      </Section>

      <Section title="Escala tipográfica">
        <ul className="space-y-2">
          {TYPE_SCALE.map(([classes, sample]) => (
            <li key={classes} className={classes}>
              {sample}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-2">
          {BUTTONS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">sm</Button>
          <Button size="default">default</Button>
          <Button size="lg">lg</Button>
          <Button size="icon" aria-label="Notificaciones">
            <Bell aria-hidden />
          </Button>
          <Button disabled>disabled</Button>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tarjeta</CardTitle>
              <CardDescription>Tamaño default</CardDescription>
            </CardHeader>
            <CardContent>Contenido de ejemplo.</CardContent>
            <CardFooter className="pb-4">
              <Button size="sm">Acción</Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Tarjeta</CardTitle>
              <CardDescription>Tamaño sm</CardDescription>
            </CardHeader>
            <CardContent>Contenido de ejemplo.</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Input y Skeleton">
        <div className="space-y-2">
          <Input aria-label="Campo normal" placeholder="Campo normal" />
          <Input aria-label="Campo deshabilitado" placeholder="Deshabilitado" disabled />
          <Input aria-label="Campo inválido" placeholder="Inválido" aria-invalid defaultValue="valor" />
          <Skeleton className="h-11 w-full" />
        </div>
      </Section>

      <Section title="Toggle y ToggleGroup">
        <div className="flex flex-wrap items-center gap-2">
          <Toggle aria-label="Toggle default">default</Toggle>
          <Toggle variant="outline" aria-label="Toggle outline">
            outline
          </Toggle>
          <Toggle size="sm" defaultPressed aria-label="Toggle sm activo">
            sm activo
          </Toggle>
        </div>
        <ToggleGroup type="single" variant="outline" defaultValue="b" aria-label="Grupo de ejemplo">
          <ToggleGroupItem value="a">Uno</ToggleGroupItem>
          <ToggleGroupItem value="b">Dos</ToggleGroupItem>
          <ToggleGroupItem value="c">Tres</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section title="RadioGroup">
        <RadioGroup defaultValue="uno" aria-label="Opciónes de ejemplo">
          {["uno", "dos"].map((value) => (
            <label key={value} className="flex items-center gap-2 text-base">
              <RadioGroupItem value={value} id={`${id}-${value}`} />
              Opción {value}
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Select, DropdownMenu, Sheet y Sonner">
        <div className="flex flex-wrap items-center gap-2">
          <Select defaultValue="a">
            <SelectTrigger aria-label="Select de ejemplo" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Opción A</SelectItem>
              <SelectItem value="b">Opción B</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="a">
            <SelectTrigger size="sm" aria-label="Select pequeño de ejemplo" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Opción A</SelectItem>
              <SelectItem value="b">Opción B</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Menú <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Salir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Abrir hoja</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Hoja</SheetTitle>
                <SheetDescription>Contenido de ejemplo.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <ToastButton />
        </div>
      </Section>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Vista previa de tokens y primitivas</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel id="claro" label="Claro" />
        <Panel id="oscuro" label="Oscuro" dark />
      </div>
    </div>
  );
}
