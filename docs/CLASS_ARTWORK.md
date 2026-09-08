# Artes de classe — processo de criação e manutenção

## Decisão adotada

As artes de classe formam um catálogo evolutivo e opcional. Elas devem ser criadas sob demanda, quando uma classe realmente precisar de ilustração ou quando houver capacidade para validar um novo pequeno lote. Completar visualmente todas as classes não é requisito para uma versão do SoulForge.

Cada classe ilustrada pode possuir duas representações finais:

1. **Preview quadrado:** brasão legível em tamanho pequeno, usado em listas e seleções.
2. **Banner vertical de detalhe:** composição 2:3 já finalizada, com brasão, estandarte e atmosfera em um único arquivo.

O navegador deve apenas enquadrar essas imagens. Máscaras, névoas, recortes e composição artística não devem ser reconstruídos em CSS. Uma classe sem uma ou ambas as representações continua plenamente utilizável por meio do fallback visual e do conteúdo textual.

Este documento registra a direção artística, o processo reproduzível e o lote que validou a abordagem. As artes são originais e não oficiais, geradas com a ferramenta integrada `imagegen` em 8 de setembro de 2026.

| Definition | Perfil avaliado | Arquivo final | Dimensão | Tamanho |
| --- | --- | --- | --- | --- |
| `class.core.guerreiro` | Marcial | `public/assets/classes/generic/warrior.webp` | 768 × 768 | 65.470 bytes |
| `class.core.mago` | Mágico | `public/assets/classes/generic/wizard.webp` | 768 × 768 | 72.178 bytes |
| `class.core.serafim` | Preview transparente do piloto | `public/assets/classes/generic/seraph-emblem.webp` | 384 × 384 | 33.618 bytes |
| `class.core.serafim` | Banner vertical finalizado | `public/assets/classes/generic/seraph-banner.webp` | 768 × 1152 | 139.862 bytes |

## Impacto medido no build

Os quatro arquivos publicados do lote piloto somam 311.128 bytes. No build de referência, o precache do PWA passou de 2.741,75 KiB para 3.048,35 KiB: aumento de 306,60 KiB, aproximadamente 11,2% sobre a base anterior.

O total permanece no Estágio 1 definido em `docs/ASSET_POLICY.md`, com margem confortável em relação ao limite saudável de 10 MiB. O resultado confirma a viabilidade do formato para um piloto, mas a expansão para todas as classes deve continuar acompanhada por medição do build e orçamento por arquivo.

Guerreiro, Mago e o banner do Serafim usam WebP opaco; o brasão compacto do Serafim preserva transparência alfa. A primeira geração do recorte pediu transparência, mas entregou o quadriculado incorporado à imagem; o fundo neutro foi removido tecnicamente na versão final. Os mestres permanecem na pasta de imagens geradas do Codex e não integram o build.

O Serafim valida a estratégia definitiva de dois derivados: `seraph-emblem.webp` é o brasão isolado para previews compactos e `seraph-banner.webp` reúne tecido, atmosfera e brasão em uma única composição vertical para o detalhe. Isso elimina a composição de camadas em CSS e torna a apresentação previsível no Safari/iPad. O recorte foi gerado com `imagegen`; como duas saídas PNG trouxeram o quadriculado incorporado, a remoção final do fundo neutro conectado às bordas foi feita de modo determinístico, sem apagar áreas internas do emblema.

## Quando criar uma nova arte

Uma nova arte de classe deve ser iniciada apenas quando pelo menos uma destas condições ocorrer:

- a classe estiver estável o suficiente para que seu símbolo não seja redesenhado logo depois;
- a ausência da imagem prejudicar de forma perceptível a leitura ou a apresentação;
- a classe fizer parte de um pequeno lote visual que possa ser validado integralmente;
- houver uma necessidade editorial ou de demonstração aprovada para aquela classe.

Não criar todas as artes preventivamente. Trabalhar preferencialmente com uma classe por vez; depois de duas ou três aprovações sob a mesma direção, um lote pequeno pode compartilhar a etapa de otimização e testes.

## Contrato dos dois arquivos

| Uso | Nome recomendado | Proporção | Dimensão de entrega | Meta de tamanho | Fundo |
| --- | --- | --- | --- | --- | --- |
| Preview | `<slug>-emblem.webp` | 1:1 | até 384 × 384 | até 45 KB | opaco e discreto por padrão; alfa somente quando trouxer benefício real |
| Detalhe | `<slug>-banner.webp` | 2:3 | 768 × 1152 | até 150 KB | opaco, com estandarte e atmosfera finalizados |

O preview e o banner devem representar o mesmo brasão. A geração do banner pode reinterpretar tecido, iluminação e atmosfera, mas não deve mudar a silhueta, os símbolos principais, as cores de identificação ou as proporções essenciais do emblema.

Para previews novos, preferir fundo escuro já incorporado. Transparência não é requisito e deve ser evitada quando acrescentar trabalho, peso ou risco de bordas artificiais. O Serafim transparente permanece uma exceção válida do piloto.

## Processo de criação

1. Ler a Definition completa e identificar fantasia, função mecânica e dois ou três símbolos próprios da classe.
2. Conferir se a classe já possui arte declarada pelo usuário ou Pack; essa arte sempre tem prioridade sobre o fallback do SoulForge.
3. Criar e aprovar primeiro o brasão quadrado. Validar sua leitura aproximadamente em 96 px antes de produzir o banner.
4. Usar o brasão aprovado como referência explícita para o banner vertical, preservando seus elementos invariantes.
5. Gerar o banner já com tecido, aura, iluminação e bordas integrados. Não planejar uma composição posterior em CSS.
6. Comparar lado a lado preview e banner. Rejeitar o banner quando o gerador mudar a identidade do símbolo, mesmo que a imagem isolada pareça bonita.
7. Converter os arquivos finais para WebP, nas dimensões e limites documentados, sem ampliar uma fonte de resolução inferior.
8. Salvar em `public/assets/classes/<colecao>/` e associar ambos ao ID exato da Definition no resolvedor central.
9. Validar listagem, detalhe, desktop, iPad horizontal e altura útil próxima de 650 px.
10. Executar testes e build; registrar tamanhos, impacto no precache, ferramenta, data, prompts e qualquer exceção.

## Critérios de aprovação

- o preview é reconhecível sem depender do nome da classe;
- nenhuma ponta ou elemento essencial é cortado no tamanho real da interface;
- o banner não apresenta emenda quadrada, área vazia artificial ou camada colada;
- o texto do modal mantém contraste e hierarquia; a arte não disputa atenção com a leitura;
- preview e banner parecem pertencer ao mesmo brasão;
- não há texto, logo, marca d'água, personagem ou iconografia oficial;
- a ausência ou falha da imagem não impede nenhuma ação;
- os arquivos respeitam o orçamento ou possuem exceção registrada.

## Manutenção e substituição

- Manter os caminhos estáveis quando uma nova versão continuar representando a mesma classe. Isso melhora atualização e cache.
- Alterar os dois derivados no mesmo lote quando o brasão mudar de identidade. Uma correção apenas de enquadramento ou compressão pode afetar somente o arquivo necessário.
- Repetir a validação visual completa após mudar proporção, silhueta, fundo ou ponto focal.
- Não editar a Definition para persistir um fallback incorporado pelo SoulForge.
- Não remover um fallback antigo até confirmar que nenhum resolvedor ou documento ainda o referencia.
- Atualizar a tabela deste documento e o baseline de assets após cada lote aceito.

## Entrega sob demanda

O objetivo arquitetural é que o preview compacto seja carregado de maneira preguiçosa quando entrar na área visível e que o banner seja solicitado somente ao abrir o detalhe da classe. O banner não é requisito para o uso offline: se ainda não estiver no cache, o modal deve conservar todo o conteúdo e apresentar o fallback visual.

No Estágio 1 atual, os arquivos em `public/assets/` ainda podem integrar o precache geral. Antes de ampliar este piloto para todas as classes, o carregamento e cache de execução dos banners deve ser implementado conforme `ASSET_POLICY.md`. A documentação desta decisão não deve ser confundida com uma afirmação de que o carregamento sob demanda já está ativo.

## Linguagem compartilhada

- brasão frontal, centralizado e simétrico;
- silhueta forte, legível em aproximadamente 96 px;
- metal envelhecido, esmalte escuro e ametista como elo visual com o SoulForge;
- margem segura quadrada, sem texto, pessoas, logos, marcas d'água ou iconografia oficial;
- fundo preto-violeta com queda radial discreta.

## Prompts finais

### Guerreiro

> Brasão original de classe marcial, em fantasia sombria refinada: escudo simétrico com duas espadas gastas cruzadas e chevron de osso. Metal escurecido, couro, marfim e detalhes ametista; composição frontal quadrada, margem segura e leitura em 96 px. Sem pessoas, texto, logos, marcas, moldura de carta ou iconografia oficial.

### Mago

> Brasão original de classe mágica na mesma família: escudo simétrico, códice antigo aberto, cristal arcano vertical e dois arcos rúnicos concêntricos. Prata escurecida, pergaminho, marfim dourado e ametista; composição frontal quadrada, margem segura e leitura em 96 px. Sem pessoas, texto, logos, marcas, moldura de carta ou iconografia oficial.

### Serafim

> Brasão original de classe híbrida divina e marcial na mesma família: escudo simétrico, arma cerimonial vertical, duas asas abstratas ascendentes e gema radiante central. Bronze escurecido, marfim, carmesim e ametista; composição frontal quadrada, margem segura e leitura em 96 px. Sem figuras angelicais, símbolos religiosos reais, texto, logos, marcas, moldura de carta ou iconografia oficial.

### Tratamento de fundo

> Substituir somente o quadriculado por um fundo atmosférico preto-violeta contínuo, quase preto nos cantos e com queda radial discreta atrás do símbolo. Preservar integralmente brasão, proporções, materiais, luz e enquadramento. Não adicionar objetos, texto, logo, marca d'água ou cenário.

### Recorte transparente do Serafim

> Remover completamente o fundo preto-violeta e toda a névoa da arte do Serafim, preservando exatamente o brasão completo, suas asas, pontas, gemas, fitas, iluminação, cores, proporções e enquadramento. Entregar somente o emblema isolado sobre transparência alfa real, sem quadriculado desenhado, halo retangular, sombra de fundo, texto, logo ou elementos novos.

### Banner vertical do Serafim

> Criar um estandarte vertical 2:3 finalizado para o detalhe de classe, combinando o brasão do Serafim com tecido ameixa quase preto e uma aura contínua violeta-bordô. Preservar o brasão completo, centralizado e com margem segura; integrar atmosfera e tecido até todas as bordas, sem emendas ou camadas aparentes. Visual de fantasia sombria refinada, imersivo e discreto. Sem transparência, texto, letras, logos, personagens, marcas d'água ou símbolos adicionais.

## Integração

`src/content/classArtwork.ts` resolve separadamente a arte compacta e o banner de detalhe pelo ID exato da Definition. Uma imagem fornecida pelo usuário ou pelo Pack mantém prioridade nos dois contextos. O fallback não modifica nem persiste conteúdo importado.
