# Auditoria de classes e efeitos

## Escopo auditado

| Conteúdo | Quantidade |
| --- | ---: |
| Classes | 13 |
| Subclasses | 26 |
| Features | 154 |
| Classes Core | 9 |
| Classes Hope & Fear | 4 |

Esta auditoria classifica o conteúdo dos Packs privados antes de acrescentar
automação. O SoulForge não deve inferir uma regra a partir do texto de uma
Feature: todo comportamento de ficha precisa ser declarado em metadados.

## Estados e recursos identificados

| Classe | Estado ou recurso relevante | Tratamento inicial |
| --- | --- | --- |
| Bardo | Dados de Reunir | pool de dados com valor, descartado no fim da sessão |
| Druida | Forma Bestial, Canalização e auras | efeitos pessoais condicionais; Forma também altera a ficha conforme a forma escolhida |
| Guardião | Imparável e Dado Imparável | efeito pessoal com dado de valor crescente e término por cena |
| Ranger | Foco e companheiro | estado ligado a alvo e entidade externa; registrar, mas não automatizar alvos nesta primeira versão |
| Ladino | Oculto/Encoberto e bônus contra alvo marcado | condições narrativas e de alvo; lembrete estruturado |
| Serafim | Dados de Prece | pool de d4s com valores individuais, criado no início da sessão |
| Feiticeiro | Carregado e Transcendência | efeitos temporários pessoais; Carregado precisa de encerramento no descanso |
| Guerreiro | Dados do Matador | pool de dados com valores individuais, descartado ao fim da sessão |
| Mago | número de Padrões Estranhos e Conjurar Escudo | escolha persistida e bônus condicional dependente de Esperança |
| Assassino | Marcado para Morrer e fichas de veneno | estado ligado a alvo e contador de cartas |
| Brigão | Foco, posturas e Dado de Combo | recurso/estado de subclasse e rolagem guiada |
| Bruxo | Favor e efeitos do Patrono | contador de classe; Manto do Patrono já é a referência implementada |
| Bruxa | Maldição, fichas de Círculo/Talismã e Glamour | estados de alvo, contador e efeitos condicionais |

## Limite seguro de automação

Os primeiros comportamentos devem ser aqueles que a ficha pode calcular sem
interpretar uma rolagem, alvo ou decisão do GM:

- contadores e pools de dados administrados pelo jogador;
- custos explícitos de recursos e marcadores;
- bônus pessoais temporários de Limiar, Evasão, Proficiência ou atributo;
- duração por fim de cena, descanso, dano severo e encerramento manual;
- lembretes de vantagens, restrições e efeitos que ainda dependam da mesa.

Ficam fora da automação total desta versão: resolução de ataques, dano,
condições em criaturas, efeitos em aliados, rolagens de dados, escolhas do GM,
companhias e formas bestiais completas. Eles podem ter estado e lembrete na
ficha, mas a aplicação não os resolve sozinha.

## Lacunas do modelo atual

O modelo atual já cobre contadores, dados de d4 a d20, quantidade por
Proficiência ou nível, dados armazenados, modificadores temporários fixos de
defesa e por Tier, fichas efêmeras, estados pessoais, alvos tratados como
lembrete e términos por cena ou descanso.

Permanecem como lacunas declarativas:

1. modificadores temporários de Proficiência e atributos;
2. reinicialização genérica por qualquer descanso;
3. quantidades com mínimo ou derivadas de conjuntos, como cartas de um Domínio;
4. eventos explícitos de ataque e severidade de dano;
5. estado associado a alvos externos, contagens regressivas e cooldowns
   temporais.

Qualquer automação adicional de alvos, ataques ou dano deve nascer de um novo
contrato de dados e de uma interação visível para o jogador, nunca de análise
de texto livre.

## Cobertura atual

O **Favor** do Bruxo é um contador estruturado e o **Manto do Patrono** é a
referência inicial de Feature ativável: consome Favor, concede `+Tier` aos
limiares Menor e Maior e termina por dano Severo, fim da cena ou encerramento
manual.

Nesta versão, o SoulForge também estrutura os seguintes estados de uso seguro:

- **Ranger:** Foco do Ranger;
- **Ladino:** Esquiva do Ladino (`+2` de Evasão);
- **Guardião:** Nêmesis;
- **Guerreiro:** Sem Piedade;
- **Assassino:** Marcado para Morrer;
- **Bruxo:** Fúria do Patrono e Alcance Ameaçador.

Os bônus permanentes já declarados no Core incluem a trilha **Baluarte** do
Guardião, **Sombra Fugaz** do Ladino e **Mago de Batalha**. Os demais efeitos
das classes seguem visíveis como Features, mas permanecem sem automação até que
suas escolhas, alvos ou rolagens tenham um contrato explícito.

Ativações com fichas efêmeras também cobrem **Misturas Tóxicas**, **Talismã
Encantado**, **Caminhar Entre Mundos** e **Círculo de Poder**. Os **Dados do
Matador** usam o modelo de dados armazenados, com capacidade por Proficiência e
recuperação declarativa no fim da sessão.
