# Artes de classe — processo de criação e manutenção

## Decisão adotada

As artes de classe formam um catálogo evolutivo e opcional. Elas devem ser criadas sob demanda, quando uma classe realmente precisar de ilustração ou quando houver capacidade para validar um novo pequeno lote. Completar visualmente todas as classes não é requisito para uma versão do SoulForge.

Cada classe ilustrada pode possuir duas representações finais:

1. **Preview quadrado:** brasão legível em tamanho pequeno, usado em listas e seleções.
2. **Banner vertical de detalhe:** composição 2:3 já finalizada, com brasão, estandarte e atmosfera em um único arquivo.

O navegador deve apenas enquadrar essas imagens. Máscaras, névoas, recortes e composição artística não devem ser reconstruídos em CSS. Uma classe sem uma ou ambas as representações continua plenamente utilizável por meio do fallback visual e do conteúdo textual.

Este documento registra a direção artística, o processo reproduzível e o catálogo das classes Core e Hope & Fear. As artes são originais e não oficiais, geradas com a ferramenta integrada `imagegen` em 8 de setembro de 2026.

| Definition | Classe | Preview 384 × 384 | Banner 768 × 1152 |
| --- | --- | --- | --- |
| `class.core.bardo` | Bardo | `bard.webp` — 28.880 bytes | `bard-banner.webp` — 132.454 bytes |
| `class.core.druida` | Druida | `druid.webp` — 33.640 bytes | `druid-banner.webp` — 145.884 bytes |
| `class.core.guardiao` | Guardião | `guardian.webp` — 28.810 bytes | `guardian-banner.webp` — 131.630 bytes |
| `class.core.ranger` | Ranger | `ranger.webp` — 30.248 bytes | `ranger-banner.webp` — 131.452 bytes |
| `class.core.ladino` | Ladino | `rogue.webp` — 25.162 bytes | `rogue-banner.webp` — 146.502 bytes |
| `class.core.feiticeiro` | Feiticeiro | `sorcerer.webp` — 34.828 bytes | `sorcerer-banner.webp` — 150.484 bytes |
| `class.core.guerreiro` | Guerreiro | `warrior.webp` — 23.008 bytes | `warrior-banner.webp` — 136.308 bytes |
| `class.core.mago` | Mago | `wizard.webp` — 25.712 bytes | `wizard-banner.webp` — 145.430 bytes |
| `class.core.serafim` | Serafim | `seraph-emblem.webp` — 33.618 bytes | `seraph-banner.webp` — 139.862 bytes |
| `class.hope-fear.assassin` | Assassino | `assassin.webp` — 24.248 bytes | `assassin-banner.webp` — 118.310 bytes |
| `class.hope-fear.brawler` | Brigão | `brawler.webp` — 27.846 bytes | `brawler-banner.webp` — 134.154 bytes |
| `class.hope-fear.warlock` | Bruxo | `warlock.webp` — 26.340 bytes | `warlock-banner.webp` — 124.670 bytes |
| `class.hope-fear.witch` | Bruxa | `witch.webp` — 27.532 bytes | `witch-banner.webp` — 140.486 bytes |

Todos os caminhos da tabela são relativos a `public/assets/classes/generic/`. O catálogo possui 26 arquivos e soma 2.147.498 bytes (2.097,17 KiB).

## Impacto medido no build

Os 26 arquivos publicados somam 2.147.498 bytes. Os 13 previews permanecem no precache por sustentarem listas e seleções; os 13 banners são excluídos do precache global e usam `CacheFirst` em tempo de execução, com limite de 16 entradas e expiração em 90 dias. Assim, cada banner é baixado somente ao abrir o detalhe e continua disponível offline depois da primeira visita. O build final contém 45 entradas e 3.106,75 KiB no precache.

O total permanece no Estágio 1 definido em `docs/ASSET_POLICY.md`, com margem confortável em relação aos limites de quantidade e tamanho. O build deve continuar registrando o peso do precache, mas o catálogo completo de banners já não aumenta a instalação inicial.

As artes usam WebP opaco, exceto o brasão compacto do Serafim, que preserva transparência alfa. A primeira geração do recorte pediu transparência, mas entregou o quadriculado incorporado à imagem; o fundo neutro foi removido tecnicamente na versão final. Os mestres permanecem na pasta de imagens geradas do Codex e não integram o build.

O Serafim validou a estratégia definitiva de dois derivados, depois aplicada às demais classes: um brasão legível para previews compactos e um banner que reúne tecido, atmosfera e brasão em uma única composição vertical. Isso elimina a composição de camadas em CSS e torna a apresentação previsível no Safari/iPad. O recorte do Serafim foi gerado com `imagegen`; como duas saídas PNG trouxeram o quadriculado incorporado, a remoção final do fundo neutro conectado às bordas foi feita de modo determinístico, sem apagar áreas internas do emblema.

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

O preview compacto integra o precache para permanecer disponível nas listas. O banner é excluído desse pacote inicial e solicitado somente quando o detalhe da classe é aberto. Depois da primeira visita, o service worker conserva o arquivo no cache de execução para uso offline.

Se um banner ainda não estiver disponível, o conteúdo e as ações do modal continuam funcionais. A interface mantém o fallback abstrato até a imagem carregar ou quando houver falha de rede. O cache `class-detail-artwork` usa a estratégia `CacheFirst`, comporta 16 entradas e expira itens não renovados após 90 dias.

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

### Demais brasões do catálogo principal

- **Bardo:** lira central, fitas de versos e ritmo visual elegante; vinho, ouro envelhecido e ametista.
- **Druida:** galhos como chifres, cristal-semente, raízes, folhas, água e pedra; verdes florestais, madeira e bronze.
- **Guardião:** escudo-fortaleza envolvendo um núcleo protegido e lâminas laterais; aço escuro, carmesim e ametista.
- **Ranger:** ponta de flecha como bússola, trilhas, montanhas e marca animal; verde, madeira e cobre.
- **Ladino:** fechadura de ametista, estiletes cruzados, capuz e correntes rompidas; índigo, prata escura e preto.
- **Feiticeiro:** cristal primordial cercado por arcos elementais de fogo, água e tempestade; vermelho-brasa, azul elétrico e ametista.

Todos seguiram a linguagem compartilhada: composição frontal simétrica, margem segura, leitura em 96 px, fundo atmosférico discreto e ausência de texto, personagens, logos, marcas d'água ou iconografia oficial.

### Brasões de Hope & Fear

- **Assassino:** adaga descendente atravessando uma única gema-alvo marcada, círculo de mira interrompido e lâminas contidas; prata escurecida, carmesim, marfim e ametista. O alvo marcado diferencia a classe do Ladino.
- **Brigão:** dois punhos protegidos por manoplas e faixas, núcleo de impacto e três marcas sequenciais de combo; aço gasto, couro, cobre e ametista. Nenhuma arma integra o símbolo.
- **Bruxo:** cristal de pacto suspenso por corrente cerimonial, crescentes opostos e mão aberta; bronze escurecido, ouro antigo, vinho e ametista. O contrato diferencia a classe da Bruxa.
- **Bruxa:** tigela ritual com chama violeta, espinhos, crescentes, fuso de pedra lunar e sementes; bronze, madeira, verde-sálvia, marfim e ametista.

Os prompts usaram as artes existentes apenas como referência de família visual. Cada pedido exigiu composição quadrada frontal, leitura em 96 px, fundo opaco preto-ameixa e proibiu texto, pessoas, marcas, iconografia oficial e estereótipos que confundissem as quatro classes.

### Tratamento de fundo

> Substituir somente o quadriculado por um fundo atmosférico preto-violeta contínuo, quase preto nos cantos e com queda radial discreta atrás do símbolo. Preservar integralmente brasão, proporções, materiais, luz e enquadramento. Não adicionar objetos, texto, logo, marca d'água ou cenário.

### Recorte transparente do Serafim

> Remover completamente o fundo preto-violeta e toda a névoa da arte do Serafim, preservando exatamente o brasão completo, suas asas, pontas, gemas, fitas, iluminação, cores, proporções e enquadramento. Entregar somente o emblema isolado sobre transparência alfa real, sem quadriculado desenhado, halo retangular, sombra de fundo, texto, logo ou elementos novos.

### Banner vertical do Serafim

> Criar um estandarte vertical 2:3 finalizado para o detalhe de classe, combinando o brasão do Serafim com tecido ameixa quase preto e uma aura contínua violeta-bordô. Preservar o brasão completo, centralizado e com margem segura; integrar atmosfera e tecido até todas as bordas, sem emendas ou camadas aparentes. Visual de fantasia sombria refinada, imersivo e discreto. Sem transparência, texto, letras, logos, personagens, marcas d'água ou símbolos adicionais.

### Modelo compartilhado dos demais banners

> Criar um estandarte vertical 2:3 finalizado para o detalhe de classe usando o brasão fornecido como referência exata e o banner do Serafim apenas como referência de composição. Aplicar tecido escuro refinado, textura sutil, ponta inferior, atmosfera contínua até as bordas e brasão no terço superior/médio com 60–66% da largura e margem segura. Preservar a silhueta e os símbolos essenciais do brasão. Entregar composição opaca pronta, sem limite quadrado, texto, logos, personagens, marcas d'água ou brilho excessivo.

A paleta e o clima foram adaptados à classe: vinho lírico para Bardo; floresta orgânica para Druida; aço e carmesim protetor para Guardião; verde vigilante para Ranger; índigo secreto para Ladino; contraste elemental para Feiticeiro; aço e couro gastos para Guerreiro; azul-noturno, pergaminho e prata para Mago; carmesim preciso para Assassino; couro e poeira disciplinada para Brigão; vinho e ouro contratual para Bruxo; verde-floresta e névoa lunar para Bruxa.

## Integração

`src/content/classArtwork.ts` resolve separadamente a arte compacta e o banner de detalhe pelo ID exato da Definition. Uma imagem fornecida pelo usuário ou pelo Pack mantém prioridade nos dois contextos. O fallback não modifica nem persiste conteúdo importado.
