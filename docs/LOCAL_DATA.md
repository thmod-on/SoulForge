# Dados locais

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

Exportar e importar personagens ainda não está implementado, mas é um requisito planejado.

O fluxo futuro deve exportar um arquivo JSON legível contendo o estado de um personagem, sua versão de formato e as referências às Definitions usadas. A importação deve validar o arquivo antes de salvar e informar incompatibilidades de Pack ou versão.

Até a implementação desse fluxo, não há garantia de recuperação após limpeza dos dados do navegador ou perda do dispositivo.

## Privacidade

Nesta fase, os dados não são enviados a um servidor pelo SoulForge. O GitHub Pages hospeda somente os arquivos estáticos da aplicação.
