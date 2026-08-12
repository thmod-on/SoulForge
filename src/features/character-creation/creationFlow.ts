export type CharacterCreationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function previousCharacterCreationStep(step: CharacterCreationStep): CharacterCreationStep {
  return Math.max(1, step - 1) as CharacterCreationStep;
}

export function nextCharacterCreationStep(step: CharacterCreationStep): CharacterCreationStep {
  return Math.min(8, step + 1) as CharacterCreationStep;
}

export function isFinalCharacterCreationStep(step: CharacterCreationStep): boolean {
  return step === 8;
}
