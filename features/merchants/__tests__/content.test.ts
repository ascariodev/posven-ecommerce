import { describe, expect, it } from "vitest";
import { MERCHANT_QUESTIONS } from "../lib/content";

describe("preguntas de comercios", () => {
  it("cada pregunta cita una spec como fuente (RN-MERCHANTS-01)", () => {
    for (const item of MERCHANT_QUESTIONS) expect(item.source).toMatch(/spec .*§/);
  });

  it("no responde costo de aparecer ni liquidación del dinero (RN-MERCHANTS-02)", () => {
    for (const item of MERCHANT_QUESTIONS) {
      expect(`${item.question} ${item.answer}`).not.toMatch(/cuesta|costo de aparecer|comisi|liquid|recibo el dinero/i);
    }
  });

  it("los ids son únicos", () => {
    const ids = MERCHANT_QUESTIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
