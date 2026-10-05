import { describe, expect, it } from "vitest";
import { HELP_QUESTIONS, HELP_TOPICS } from "@/features/help/lib/content";

describe("contenido de la ayuda", () => {
  it("cada pregunta cita una RN- o una spec (RN-HELP-01)", () => {
    for (const item of HELP_QUESTIONS) {
      expect(item.source, item.id).toMatch(/RN-[A-Z]+-[0-9]{2}|spec (hiperlocal|cuentas)/);
    }
  });

  it("cada pregunta pertenece a un tema que existe (RN-HELP-02)", () => {
    const topics = new Set(HELP_TOPICS.map((topic) => topic.id));
    for (const item of HELP_QUESTIONS) {
      expect(topics.has(item.topic), item.id).toBe(true);
    }
  });

  it("todo tema tiene al menos una pregunta", () => {
    for (const topic of HELP_TOPICS) {
      expect(HELP_QUESTIONS.some((item) => item.topic === topic.id), topic.id).toBe(true);
    }
  });

  it("los ids no se repiten", () => {
    const ids = HELP_QUESTIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
