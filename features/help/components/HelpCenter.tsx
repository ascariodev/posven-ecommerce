"use client";

import { useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  CreditCard,
  Pill,
  Search,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  HELP_QUESTIONS,
  HELP_TOPICS,
  type HelpQuestion,
  type HelpTopic,
  type HelpTopicIcon,
} from "../lib/content";
import { filterQuestions } from "../lib/filter";

const TOPIC_ICONS: Record<HelpTopicIcon, LucideIcon> = {
  how: Search,
  payments: CreditCard,
  pickup: Truck,
  account: UserRound,
  recipes: Pill,
};

type HelpCenterProps = {
  topics?: HelpTopic[];
  questions?: HelpQuestion[];
  canContact?: boolean;
};

export function HelpCenter({
  topics = HELP_TOPICS,
  questions = HELP_QUESTIONS,
  canContact = true,
}: HelpCenterProps) {
  const [query, setQuery] = useState("");
  const filtering = query.trim() !== "";
  const visible = filterQuestions(questions, query);

  return (
    <>
      <section data-full-bleed className="-mt-8 ml-[calc(50%-50vw)] w-screen bg-primary-soft">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center md:px-8 md:py-12">
          <h1 className="font-heading text-2xl font-semibold md:text-4xl">¿En qué te ayudamos?</h1>
          <label className="flex h-14 w-full max-w-2xl items-center gap-2 rounded-2xl border border-input-border bg-card px-4 shadow-card">
            <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar en la ayuda"
              placeholder="Ej.: cómo retiro mi pedido"
              className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:outline-none"
            />
          </label>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 md:gap-10 md:px-8 md:pt-10">
        <section aria-labelledby="ayuda-temas" className="flex flex-col gap-3">
          <h2 id="ayuda-temas" className="font-heading text-lg font-semibold">
            Temas
          </h2>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            {topics.map((topic) => {
              const Icon = TOPIC_ICONS[topic.icon];
              const first = questions.find((item) => item.topic === topic.id);
              return (
                <li key={topic.id}>
                  <Card size="sm" className="relative h-full flex-row items-start gap-3 px-4 hover:shadow-raised">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      {first ? (
                        <a href={`#pregunta-${first.id}`} className="font-semibold after:absolute after:inset-0">
                          {topic.title}
                        </a>
                      ) : (
                        <strong>{topic.title}</strong>
                      )}
                      <span className="text-xs text-muted-foreground md:text-sm">{topic.summary}</span>
                    </span>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="ayuda-preguntas" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          <h2 id="ayuda-preguntas" className="font-heading text-lg font-semibold">
            Preguntas frecuentes
          </h2>
          {visible.length === 0 ? (
            <EmptyState
              icon={CircleHelp}
              title="Sin coincidencias"
              description={
                canContact
                  ? "No encontramos preguntas con esas palabras. Prueba con otras o escríbenos."
                  : "No encontramos preguntas con esas palabras. Prueba con otras."
              }
            />
          ) : (
            <Card className="gap-0 py-0" key={filtering ? "filtrando" : "completo"}>
              {visible.map((item, index) => (
                <details
                  key={item.id}
                  id={`pregunta-${item.id}`}
                  open={filtering || index === 0}
                  className="group scroll-mt-20 border-b border-border last:border-0"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 font-semibold md:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">{item.question}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="px-4 pb-4 text-muted-foreground md:px-6">{item.answer}</p>
                </details>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
