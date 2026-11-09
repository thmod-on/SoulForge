# Mecânicas de itens

Itens podem declarar valores fixos em `combatModifiers` e parcelas derivadas em
`derivedDefenseModifiers`. A Engine soma as duas parcelas somente enquanto o
item está em **Equipados**; descrições livres nunca são interpretadas.

## Defesas derivadas

Cada entrada escolhe um campo (`armor`, `evasion`, `minor` ou `major`) e uma
origem estruturada:

- `attribute`, acompanhado de um ID de atributo;
- `spellcast-attribute`, resolvido pela Subclasse da personagem;
- `character-level`;
- `character-tier`.

`multiplier`, `divisor` e `rounding` são opcionais. Seus padrões são `1`, `1` e
`ceil`. Divisor zero, campos desconhecidos e origens incompletas invalidam um
Pack antes de qualquer escrita. Quando Conjuração não está disponível, a
parcela vale zero e a interface explica o fallback.

## Ajustes pessoais

Uma Definition de Pack continua imutável. **Ajustar para mim** grava um patch
esparso `item-personal` em `definitionOverrides`, limitado a descrição, imagem,
valores de defesa e perfil de armadura. ID, nome, categoria e origem continuam
pertencendo ao Pack.

O ajuste:

- sincroniza somente dentro da conta da pessoa;
- integra o backup completo, mas não a exportação de personagem ou de conteúdo
  compartilhável;
- permanece dormente se o Pack for removido e volta a ser aplicado quando o ID
  reaparece;
- conserva os valores-base usados na edição. Se uma atualização mudar o mesmo
  campo, a interface pede revisão e permite manter o ajuste ou usar o Pack;
- pode ser removido integralmente por **Restaurar padrão do Pack**.

Para alterar livremente identidade, categoria ou demais campos, deve-se usar
**Duplicar**, que cria uma nova Definition `local` com ID próprio.

## Conteúdo privado revisado

O Pack privado *Hope & Fear - Itens* `1.2.0-local` declara mecanicamente as
quatro Vestes de Mago, o Traje de Granminster e o Exotraje Forjado em Runas. O
ledger privado registra fonte e decisão sem transformar busca textual em regra.
Fórmulas de armas, ataques e dano permanecem fora deste contrato.
