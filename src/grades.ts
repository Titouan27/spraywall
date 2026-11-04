export const GRADES = ['3', '4', '4+', '5', '5+', '6A', '6A+', '6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+', '8C', '8C+']
export const gradeIndex = (g: string) => GRADES.indexOf(g)

/** Cotation consensuelle = médiane des votes (cotation d'ouverture incluse). */
export function consensusGrade(setter: string, votes: string[]): string {
  const idx = [setter, ...votes].map(gradeIndex).filter(i => i >= 0).sort((a, b) => a - b)
  if (!idx.length) return setter
  return GRADES[idx[Math.floor((idx.length - 1) / 2)]]
}
