import { describe, expect, it } from "vitest";
import { HELP_QUESTIONS } from "@/features/help/lib/content";
import { filterQuestions } from "@/features/help/lib/filter";

describe("filterQuestions", () => {
  it("sin texto devuelve todas", () => {
    expect(filterQuestions(HELP_QUESTIONS, "   ")).toEqual(HELP_QUESTIONS);
  });

  it("ignora mayúsculas y acentos (RN-HELP-03)", () => {
    const ids = filterQuestions(HELP_QUESTIONS, "RECIPE").map((item) => item.id);
    expect(ids).toContain("medicamentos-recipe");
  });

  it("exige todos los términos, en la pregunta o en la respuesta (RN-HELP-03)", () => {
    const ids = filterQuestions(HELP_QUESTIONS, "retiro codigo").map((item) => item.id);
    expect(ids).toContain("retirar-pedido");
    expect(filterQuestions(HELP_QUESTIONS, "retiro zzzz")).toEqual([]);
  });
});
