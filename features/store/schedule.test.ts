import { describe, expect, it } from "vitest";
import { formatSchedule, openingHoursJsonLd } from "./schedule";

describe("formatSchedule", () => {
  it("una racha de lunes a sábado sale como Lun a Sáb", () => {
    expect(
      formatSchedule([{ days: ["mo", "tu", "we", "th", "fr", "sa"], opens: "08:00", closes: "20:00" }]),
    ).toEqual(["Lun a Sáb: 08:00 a 20:00"]);
  });

  it("dos días consecutivos van separados por coma", () => {
    expect(formatSchedule([{ days: ["sa", "su"], opens: "09:00", closes: "13:00" }])).toEqual([
      "Sáb, Dom: 09:00 a 13:00",
    ]);
  });

  it("sin tramos dice Horario no informado", () => {
    expect(formatSchedule([])).toEqual(["Horario no informado"]);
  });
});

describe("openingHoursJsonLd", () => {
  it("traduce los días al inglés de schema.org", () => {
    expect(openingHoursJsonLd([{ days: ["sa", "su"], opens: "09:00", closes: "13:00" }])).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:00",
        closes: "13:00",
      },
    ]);
  });
});
