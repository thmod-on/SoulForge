# Auditoria de cartas

## CRD-003

A auditoria das cartas de domínio usa o **Daggerheart System Reference Document
2.0**, publicado em 25 de agosto de 2026, como fonte de verdade. A fonte é
baixada somente para o ciclo privado de revisão; o relatório final preserva sua
URL, data e checksum SHA-256, mas não replica o texto oficial.

O processo é privado porque as Definitions completas e os checkpoints contêm
conteúdo de jogo de terceiros. Ele é executado por
`local-packs/scripts/audit-domain-cards.mjs` e cobre dez domínios de 21 cartas:
Arcano, Lâmina, Osso, Códice, Graça, Meia-noite, Sábio, Esplendor, Valor e
Pavor.

Cada checkpoint identifica a carta pelo ID estável do SoulForge, a página e o
título da fonte, seu resultado e somente os campos que mudaram. Cada carta só
é aprovada após duas conferências independentes: o **resumo**, usado no Vault,
Loadout e nas listagens do Compendium, e o **efeito integral**, exibido no
detalhe. O resumo deve permanecer breve sem omitir custo, gatilho, resultado ou
limite que mudaria a decisão do jogador; o efeito deve preservar o texto de
regra completo. O auditor rejeita IDs trocados, domínios incorretos, 21 cartas
incompletas, custos inválidos, texto ausente, fontes com checksum diferente,
revisões incompletas e qualquer alteração que não seja de nome, resumo, efeito,
tipo, nível ou custo de Recall.

Os checkpoints nunca atualizam um Pack importável. Depois dos dez domínios
aprovados, a consolidação gera os dois Packs de uma vez, valida 189 cartas Core
e 21 de Pavor, preserva uma cópia de recuperação privada e remove os arquivos
temporários. O relatório privado resultante não guarda o texto integral das
cartas.

## Ciclo concluído em 27/09/2026

- Fonte: Daggerheart System Reference Document 2.0, 25/08/2026.
- URL: `https://www.daggerheart.com/wp-content/uploads/2026/08/DH_SRD_2_2026_08_25.pdf`
- SHA-256: `55d8b92b7e58aa1da99a4a59aa77352483ef4fbda71baddb9af9bfc1f333bd2a`
- Resultado: 210 cartas, 10 domínios, IDs estáveis e bundles Core (189) e
  Pavor (21) regenerados na versão local `2.0.0-local`.

O relatório e a cópia de recuperação permanecem privados em `local-packs`.
