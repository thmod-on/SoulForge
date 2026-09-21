# Campos de personagem das Features

Features podem declarar informações que precisam ser escolhidas para uma personagem por meio de `characterFields`. O mecanismo é genérico: a interface não interpreta nomes de classe, textos de regras ou IDs específicos para decidir o que mostrar.

## Contrato

Cada campo possui um `id` estável, um rótulo e um tipo:

- `text`: texto livre, com obrigatoriedade, limite, ajuda, placeholder e sugestões opcionais;
- `select`: uma escolha dentre opções com valores estáveis e rótulos de exibição.

Os valores pertencem à ficha e são persistidos em `Character.definitionSelections`, agrupados pelo `sourceDefinitionId` da Feature. Esse armazenamento também é usado por outros conteúdos declarativos; ao editar os campos de uma Feature, seleções de outras Definitions devem ser preservadas.

## Interface

- na criação, são exibidos os campos das Features de classe e de Fundação da subclasse selecionada;
- campos obrigatórios impedem o avanço enquanto estiverem vazios ou inválidos;
- a revisão da criação resume as escolhas preenchidas;
- em Aptidões, “Escolhas de classe” aparece separada das Experiências, identifica a origem e permite editar os valores.

## Conteúdo inicial

- Bruxo: nome do Patrono e esfera de influência em texto livre;
- Feiticeiro, Origem Elemental: elemento escolhido;
- Mago: número de Padrões Estranhos, com lembrete de que pode mudar durante um descanso longo.

Novos casos devem preferir este contrato quando a necessidade for registrar um valor duradouro ligado a uma Feature. Escolhas temporárias de cena ou descanso, recursos numéricos e automações mecânicas continuam usando os contratos específicos já existentes.
