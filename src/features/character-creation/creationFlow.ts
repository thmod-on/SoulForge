export type CharacterCreationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function previousCharacterCreationStep(step: CharacterCreationStep): CharacterCreationStep {
  return Math.max(1, step - 1) as CharacterCreationStep;
}

export function nextCharacterCreationStep(step: CharacterCreationStep): CharacterCreationStep {
  return Math.min(7, step + 1) as CharacterCreationStep;
}

export function isFinalCharacterCreationStep(step: CharacterCreationStep): boolean {
  return step === 7;
}
