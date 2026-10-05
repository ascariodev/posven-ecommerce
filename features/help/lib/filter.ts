import type { HelpQuestion } from "./content";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filterQuestions(questions: HelpQuestion[], query: string): HelpQuestion[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return questions;
  return questions.filter((item) => {
    const haystack = normalize(`${item.question} ${item.answer}`);
    return terms.every((term) => haystack.includes(term));
  });
}
