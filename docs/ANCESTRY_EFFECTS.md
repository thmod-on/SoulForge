# Efeitos ativáveis de ancestralidade

As Definitions privadas declaram `activation`, interpretada pelos módulos de
`src/features/feature-effects/`. O modal de ancestralidade reutiliza os controles
de ativação, também disponíveis em Traços; a Visão Geral reúne os efeitos e sua ação de encerrar. Nenhuma regra
de ancestralidade depende de nomes ou descrições no código ou no `main.ts`.

`costs` contém somente o custo inicial. Pagamentos opcionais ou recorrentes ficam
em `reminders` e são feitos pelo jogador diretamente nos recursos. Voo não cobra
o custo de uma manobra defensiva. Bônus válidos para um único ataque não são
somados permanentemente à defesa.

`endsOn: []` representa duração controlada manualmente, como voo ou recolhimento
no casco. Fim de cena e dano Severo são encerrados pelo jogador; marcar PV
manualmente não identifica a severidade do dano. Descansos já reconhecidos pela
ficha continuam encerrando os efeitos que declaram esses eventos.

`target: "self-or-ally"` exige escolha de alvo. O estado registra `self` ou `ally`.
Um efeito em aliado é um lembrete local: não modifica a defesa do usuário nem
edita outra ficha. Reativar substitui o efeito anterior após validar e pagar o
novo custo. O dano Severo que encerra Olho da Tempestade é o sofrido por quem
ativou a habilidade, inclusive quando ela beneficia um aliado.

Lote: Retrair-se (Galapa), Asas (Faerie), Asas Celestiais (Aetheris), Ignição
(Emberkin) e Olho da Tempestade (Skykin). Fontes e imports privados devem permanecer
sincronizados. Packs de ancestralidades: 1.2.0-local.

Fonte: SRD oficial de 25/08/2026, páginas 31, 33 e 34:
https://www.daggerheart.com/wp-content/uploads/2026/08/DH_SRD_2_2026_08_25.pdf

Pendências: escolhas persistentes (como Experiência do Clank), efeitos de grupo
e regras dependentes de alvo, dano ou resolução de rolagens.
