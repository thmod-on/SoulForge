# Política de artes e assets visuais

## Status

Este documento é um contrato obrigatório do projeto. Deve ser consultado antes de gerar, importar, incorporar ou alterar imagens distribuídas com o SoulForge.

Ele complementa:

- [Identidade visual](VISUAL_IDENTITY.md), que define aparência e uso na interface;
- [PWA e uso offline](PWA_OFFLINE.md), que define carregamento e cache;
- [Política de conteúdo](CONTENT_POLICY.md), que define origem, licença e distribuição;
- [Packs](PACKS.md), que define a fronteira entre conteúdo público e privado.

Em caso de conflito, a política de conteúdo e os contratos arquiteturais prevalecem.

## Objetivo

Permitir que o catálogo receba artes gradualmente sem tornar a instalação lenta, consumir armazenamento de forma desnecessária ou comprometer o uso offline no iPad.

Uma arte é um apoio visual. Nenhuma regra, escolha ou estado pode depender exclusivamente dela.

## Regras permanentes

1. O SoulForge deve continuar totalmente utilizável quando uma imagem estiver ausente ou falhar.
2. Não incluir arte oficial, logotipos, marcas ou elementos protegidos sem autorização explícita de distribuição.
3. Artes distribuídas pelo projeto devem ser originais ou possuir licença registrada e compatível.
4. Não buscar imagens de terceiros em tempo de execução nem fazer *hotlink* de URLs externas.
5. Definições e fichas devem se relacionar por IDs estáveis; nomes e descrições nunca identificam uma arte.
6. A resolução de imagens deve ser centralizada por tipo de Definition. Não criar associações dispersas em telas ou no `main.ts`.
7. Imagens próprias do usuário ou declaradas pelo Pack têm prioridade sobre um fallback visual do SoulForge.
8. Um fallback incorporado pelo SoulForge é somente apresentação e não deve alterar nem persistir uma Definition importada.
9. O catálogo textual, a criação de personagem e a ficha não podem depender do download prévio de um pacote de arte.
10. Todo lote de imagens deve ser validado no recorte real da miniatura, no detalhe e em uma tela equivalente ao iPad horizontal.

## Prioridade de resolução

Aplicar sempre esta ordem:

1. imagem fornecida pelo usuário;
2. imagem declarada pela Definition ou por seu Pack;
3. arte original incorporada pelo SoulForge e associada ao ID estável;
4. fallback abstrato ou símbolo da categoria;
5. conteúdo textual sem imagem.

Não fazer correspondência parcial por nome. Traduções, renomeações e nomes semelhantes podem associar uma imagem incorreta.

## Arquivos de origem e arquivos de entrega

### Originais

- O arquivo mestre gerado ou editável não precisa permanecer no Git.
- Quando for importante reproduzir a direção artística, registrar o prompt, a ferramenta, a data e as restrições em documentação ou manifesto.
- Nunca usar o arquivo mestre de vários megabytes diretamente no build apenas porque ele já está pronto.

### Entrega no aplicativo

- Preferir WebP para ilustrações e WebP com transparência para objetos isolados.
- JPEG é aceito para imagens opacas quando a conversão para WebP ainda não estiver disponível; deve ser tratado como formato de transição.
- PNG fica reservado a transparência ou elementos cuja nitidez realmente exija o formato.
- SVG é apropriado para ícones próprios, não para embutir ilustração oficial ou raster codificado.
- Não incorporar imagens públicas como Base64 em JavaScript, CSS ou JSON. Arquivos separados permitem cache, deduplicação e atualização eficientes.

### Dimensão e compressão

Para uma arte de catálogo:

| Representação | Dimensão recomendada | Meta de tamanho | Limite por arquivo |
| --- | --- | --- | --- |
| Miniatura | até 384 px no maior lado | até 45 KB | 70 KB |
| Detalhe quadrado | entre 768 e 960 px no maior lado | até 150 KB | 220 KB |
| Banner vertical | 768 px de largura e até 1.152 px de altura | até 150 KB | 220 KB |
| Ícone | dimensão mínima adequada ao uso | até 20 KB | 40 KB |

- Preservar a proporção definida em `VISUAL_IDENTITY.md` e manter o foco dentro da área segura para `cover`.
- Não aumentar artificialmente uma imagem menor.
- Uma exceção acima do limite precisa ser justificada no manifesto e compensada no orçamento do lote.
- Enquanto houver poucas artes, uma única versão de detalhe pode atender miniatura e modal. A versão de miniatura torna-se obrigatória no Estágio 2.

## Estrutura e nomes

Usar, quando aplicável:

```text
public/assets/<tipo>/<colecao>/<slug-estavel>.webp
public/assets/<tipo>/<colecao>/<slug-estavel>.thumb.webp
public/assets/classes/<colecao>/<slug-estavel>-emblem.webp
public/assets/classes/<colecao>/<slug-estavel>-banner.webp
```

- `<tipo>` representa `cards`, `items`, `ancestries`, `communities`, `classes` ou outro tipo real de Definition.
- `<colecao>` agrupa a origem visual sem depender do nome exibido ao usuário, por exemplo `generic` ou um identificador público autorizado.
- O nome do arquivo deve ser estável, minúsculo e sem caracteres localizados.
- Uma arte substituída deve manter o caminho quando representar a mesma Definition, permitindo atualização eficiente do cache.

## Orçamento do aplicativo

Os limites abaixo são gatilhos arquiteturais, não metas a serem preenchidas:

| Medida | Faixa saudável | Revisão obrigatória |
| --- | --- | --- |
| Precache total da PWA | até 10 MiB | acima de 15 MiB |
| Artes públicas incorporadas | até 10 MiB | acima de 15 MiB |
| Quantidade de artes de catálogo incorporadas | até 40 | acima de 40 |

- Nenhum novo lote deve ser incorporado se fizer o precache ultrapassar 15 MiB sem antes executar o Estágio 2.
- O relatório do build deve registrar o tamanho do precache antes e depois do lote.
- O tamanho comprimido de rede não substitui a análise de memória: uma imagem 960 × 960 pode ocupar cerca de 3,5 MiB quando decodificada.
- Grades devem evitar manter imagens de detalhe desnecessariamente decodificadas fora da área visível.

## Estratégia de evolução

### Estágio 1 — coleção pequena

Aplicável enquanto o projeto permanecer dentro da faixa saudável.

- Artes selecionadas ficam em `public/assets/` e podem integrar o precache.
- Uma única representação otimizada pode servir à miniatura e ao detalhe.
- O resolvedor central associa a arte pelo ID exato e preserva imagens próprias.
- É o estágio atual do SoulForge.
- Artes de detalhe de classe podem permanecer no precache enquanto forem apenas um piloto; sua expansão para o catálogo completo exige antecipar o cache sob demanda do Estágio 2.

### Estágio 2 — catálogo ilustrado

Torna-se obrigatório ao exceder qualquer gatilho: 40 artes, 10 MiB de artes públicas ou previsão de precache acima de 15 MiB.

- Criar miniatura e detalhe para cada arte.
- Carregar miniaturas de forma preguiçosa nas listas e carregar o detalhe somente quando o usuário abrir a entrada.
- Manter no precache a casca do aplicativo, fallbacks e, se o orçamento permitir, miniaturas essenciais.
- Retirar imagens de detalhe do precache global e usar cache de execução com limite de entradas e política de expiração.
- Manter um manifesto central com ID da Definition, caminhos, dimensões, tamanhos, origem e licença.
- Adicionar uma verificação automatizada de formato, dimensões, arquivos ausentes, duplicidade e orçamento ao `pnpm run check`.
- Informar claramente que uma arte ainda não visitada pode não estar disponível offline, sem afetar o conteúdo textual.

### Estágio 3 — biblioteca completa ou múltiplos Packs

Aplicável quando houver centenas de artes ou coleções independentes.

- Separar artes da casca pública do aplicativo.
- Distribuir pacotes visuais opcionais por Pack ou coleção, sem duplicar Definitions.
- Permitir baixar e remover um pacote visual explicitamente para uso offline.
- Guardar o estado de instalação e a versão do pacote visual separadamente do personagem.
- Atualizar apenas arquivos modificados e preservar o catálogo textual durante falhas ou falta de espaço.
- Mostrar tamanho antes do download e permitir uso sem arte.
- Definir política de quota e limpeza antes de implementar sincronização ou downloads automáticos.

## Manifesto futuro de artes

O Estágio 2 deve introduzir um manifesto legível por ferramentas, com pelo menos:

- ID estável da Definition;
- caminho da miniatura e do detalhe;
- largura, altura e tamanho de cada arquivo;
- tipo MIME;
- origem: original SoulForge, usuário ou Pack;
- licença ou autorização de distribuição;
- ferramenta e data de geração, quando aplicável;
- hash para detectar duplicatas e alterações.

O manifesto descreve apresentação. Ele não cria um novo conceito central no domínio e não deve ser persistido no Character.

## Fluxo obrigatório para novos lotes

1. Confirmar direitos de uso e registrar que a arte não é oficial quando for gerada pelo projeto.
2. Ler a Definition completa e elaborar uma composição coerente com seu efeito, sem copiar arte ou identidade visual oficial.
3. Gerar o mestre sem texto, logo, moldura ou marca d'água, salvo quando o próprio componente exigir texto original.
4. Criar os arquivos de entrega nas dimensões e limites desta política.
5. Associar pelo ID estável em um resolvedor central ou manifesto.
6. Preservar a prioridade da imagem fornecida pelo usuário ou Pack.
7. Conferir miniatura, detalhe, recorte responsivo, contraste e ausência de dependência visual.
8. Comparar o tamanho do build e do precache antes e depois.
9. Executar TypeScript, testes, arquitetura, build e `git diff --check`.
10. Atualizar a documentação do lote quando houver prompts, exceções ou uma nova direção artística.

## Baseline atual

Em 7 de setembro de 2026, o primeiro lote de cartas possui seis imagens JPEG de 960 × 960, entre aproximadamente 123 e 192 KB cada, totalizando cerca de 935 KB. O build completo reportou precache próximo de 2,7 MiB.

Esse lote está dentro do Estágio 1. As imagens JPEG podem ser convertidas para WebP junto da futura automação de assets; não é necessário criar uma migração isolada enquanto os limites permanecerem saudáveis.

Em 8 de setembro de 2026, o piloto de artes de Guerreiro, Mago e Serafim passou a conter quatro arquivos WebP, totalizando 311.128 bytes. O Serafim valida a separação entre preview quadrado e banner vertical finalizado. O precache passou de 32 entradas e 2.741,75 KiB para 36 entradas e 3.048,35 KiB: aumento medido de 306,60 KiB. O projeto continua no Estágio 1.

O processo específico, os prompts, critérios de aprovação e regras de manutenção das classes estão registrados em [Artes de classe](CLASS_ARTWORK.md).

## Pendências planejadas

1. Criar o manifesto e o verificador automatizado antes de ultrapassar 40 artes.
2. Padronizar a geração de WebP e miniaturas em um script reproduzível.
3. Medir carregamento, memória e rolagem no iPad ao completar cada lote relevante.
4. Implementar cache sob demanda antes de ampliar os banners de classe para todo o catálogo ou, no máximo, antes de o precache atingir 15 MiB.
5. Projetar pacotes visuais opcionais somente quando a quantidade real justificar o Estágio 3.
