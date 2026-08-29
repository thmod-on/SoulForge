# Dados locais

> Packs locais importados são persistidos no armazenamento `installedPacks`, enquanto suas Definitions ficam no armazenamento local de Definitions. Instalação e remoção são operações locais do navegador.

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

## Backup e portabilidade

O SoulForge exporta uma ficha por vez em um arquivo `.soulforge-character.json`. O arquivo contém um envelope com a versão de formato, a data da exportação e todo o estado da ficha.

Ao importar, o SoulForge valida a estrutura antes de salvar. Se já existir uma ficha com o mesmo identificador neste dispositivo, cria uma cópia com novo identificador em vez de sobrescrever a ficha local. Exportações em JSON simples de versões anteriores também são aceitas quando a estrutura da ficha for válida.

O arquivo carrega referências a Definitions de Packs, mas não instala Packs automaticamente. Para que cartas, classes, itens ou ancestralidades apareçam corretamente, os Packs correspondentes também devem estar instalados no dispositivo de destino.

Ainda é recomendável guardar a exportação fora do dispositivo: limpar os dados do navegador ou perder o aparelho apaga o IndexedDB local.

## Privacidade

Nesta fase, os dados não são enviados a um servidor pelo SoulForge. O GitHub Pages hospeda somente os arquivos estáticos da aplicação.
