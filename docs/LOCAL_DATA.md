# Dados locais

> Packs locais importados são persistidos no armazenamento `installedPacks`, enquanto suas Definitions ficam no armazenamento local de Definitions. Instalação e remoção são operações locais do navegador.

A ação **Remover todos os Packs** apaga, em uma única transação, somente os Packs importados e suas Definitions. Personagens, configurações, complementos locais e Definitions criadas manualmente são preservados. Referências usadas pelas fichas podem ficar indisponíveis até que os Packs correspondentes sejam reimportados.

## Princípio

O SoulForge é local em primeiro lugar. Cada navegador mantém seus próprios personagens e preferências, sem depender de um servidor durante a sessão.

## Armazenamento atual

Os personagens são persistidos no IndexedDB do navegador, no banco `soulforge` e no armazenamento `characters`.

O repositório local é responsável por abrir o banco, salvar e carregar personagens. A interface não deve gravar diretamente no IndexedDB.

## O que pertence aos dados locais

- identidade e atributos do personagem;
- recursos, experiências e habilidades;
- deck e cartas aprendidas;
- inventário, containers e quantidades;
- anotações;
- progresso e escolhas do personagem.

Definitions de Packs — como cartas, itens, classes e domínios — não são cópias do personagem. Elas são conteúdo reutilizável carregado pelo catálogo.

## Migrações

Dados persistidos podem sobreviver a novas versões do aplicativo. Sempre que a estrutura do personagem mudar, a atualização deve ser compatível com registros existentes ou incluir uma migração explícita.

Regras para migrações:

- nunca assumir que um campo novo existe em personagens antigos;
- fornecer valores padrão seguros;
- manter identificadores estáveis;
- testar a abertura de um personagem salvo antes da mudança;
- incrementar a versão do banco quando a estrutura do IndexedDB exigir uma alteração.

A categoria legada `item` das anotações é normalizada para `lore` ao listar ou
abrir fichas locais e ao importar uma ficha. A migração preserva identificador,
título, conteúdo e datas, e é persistida novamente sem exigir ação manual.

Cicatrizes pertencem à ficha e guardam identificador, lembrete narrativo e data.
Elas não sobrescrevem o máximo de Esperança: o limite efetivo é derivado durante
a sincronização, de modo que exportar, importar ou remover uma Cicatriz preserve
o limite-base e quaisquer bônus de recurso ativos.

Recursos criados manualmente guardam `source: "custom"` na ficha. Registros de
versões anteriores, identificados pelo ID `resource.<uuid>`, recebem essa origem
ao listar, abrir ou importar a ficha. Somente essa origem autoriza a remoção;
recursos principais e recursos sem origem customizada permanecem protegidos.

## Backup e portabilidade

O SoulForge exporta uma ficha por vez em um arquivo `.soulforge-character.json`. A exportação fica no menu `•••` da ficha correspondente, no seletor de personagens, para que não seja necessário abri-la. A importação de ficha também pertence exclusivamente ao seletor. O arquivo contém um envelope com a versão de formato, a data da exportação e todo o estado da ficha.

Ao importar, o SoulForge valida a estrutura antes de salvar. Se já existir uma ficha com o mesmo identificador neste dispositivo, cria uma cópia com novo identificador em vez de sobrescrever a ficha local. Exportações em JSON simples de versões anteriores também são aceitas quando a estrutura da ficha for válida.

O arquivo carrega referências a Definitions de Packs, mas não instala Packs automaticamente. Para que cartas, classes, itens ou ancestralidades apareçam corretamente, os Packs correspondentes também devem estar instalados no dispositivo de destino. Em contas autorizadas, a Biblioteca privada pode instalar o catálogo do grupo no primeiro dispositivo; essa origem permanece local, não é sincronizada pela conta e atualizações futuras exigem confirmação.

Além da ficha, a seção **Backup e compartilhamento** das Configurações oferece **Criar backup completo**, que gera um `.soulforge-backup.json` com todas as fichas, Packs instalados, Definitions locais e complementos de cartas. **Restaurar backup** valida o arquivo, baixa uma cópia de segurança automática do estado atual e substitui as quatro coleções locais em uma única transação.

Para compartilhar somente criações do Compendium, **Exportar conteúdo** gera um `.soulforge-content.json`. Ele inclui apenas Definitions com origem `local` e complementos locais; não redistribui fichas nem Packs externos. Na importação, conteúdo novo é acrescentado e conflitos por ID exigem que a pessoa escolha explicitamente quais versões recebidas substituirão as locais.

Ainda é recomendável guardar o backup completo fora do dispositivo: limpar os dados do navegador ou perder o aparelho apaga o IndexedDB local.

## Sincronização opcional

Entrar com Google habilita uma fila de sincronização, sem substituir o
IndexedDB. Fichas, Definitions com `packId: "local"`, complementos e suas
imagens são enviados; Packs importados e a ficha de demonstração permanecem
somente no dispositivo.

Cada registro remoto possui revisão própria. Alterações concorrentes ficam
guardadas como conflito até a pessoa escolher a versão local, a remota ou, no
caso de fichas, preservar ambas. Retratos e artes continuam como data URLs no
modelo local e são convertidos em referências privadas do R2 apenas na camada
de transporte.

## Privacidade

Sem login, nenhum dado pessoal é enviado. Com login, o Worker envia somente os
recursos sincronizáveis da conta para D1 e R2. Sair preserva os dados locais;
**Excluir dados da nuvem** remove registros, sessões e imagens remotas.
