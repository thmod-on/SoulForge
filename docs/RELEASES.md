# Versionamento e publicação

Este documento é a referência canônica para fechar uma entrega do SoulForge. Alterações comuns podem permanecer em desenvolvimento sem mudar a versão; a revisão da versão acontece somente quando o usuário solicitar explicitamente o comando **`versione`** ou pedir uma publicação equivalente.

## Convenção de versão

O SoulForge utiliza Versionamento Semântico: `MAJOR.MINOR.PATCH`.

- `MAJOR`: mudança incompatível com dados, Packs ou fluxos públicos existentes;
- `MINOR`: nova funcionalidade compatível, como uma tela, fluxo ou CRUD;
- `PATCH`: correção, ajuste visual, documentação de entrega ou melhoria compatível sem novo escopo funcional relevante.

Enquanto o projeto estiver antes da versão `1.0.0`, mudanças experimentais ainda podem acontecer em versões `0.MINOR.PATCH`. Para um lote com impactos diferentes, prevalece o maior impacto. O número é calculado a partir da última versão publicada, considerando o conjunto completo de alterações da entrega.

Cada execução bem-sucedida de `versione` fecha uma entrega e incrementa a versão pelo menos como `PATCH`. Em caso de dúvida relevante entre níveis, a execução deve parar e pedir uma decisão ao usuário.

## Fonte da versão

Em uma entrega, atualizar:

- `package.json`, fonte única da versão exibida pela aplicação;
- `CHANGELOG.md`, com uma seção correspondente à nova versão;
- referências documentais que exibam explicitamente a versão corrente.

Não deve existir uma segunda constante de versão no código.

## O comando `versione`

`versione` é uma instrução de fechamento e publicação. Quando solicitado, autoriza a execução ordenada do processo abaixo, incluindo commit e push, desde que todas as validações passem.

### 1. Revisar o escopo

- conferir a branch, o remoto, alterações locais e arquivos não rastreados;
- separar resíduos gerados de arquivos que pertencem à entrega;
- interromper em caso de mudanças sem relação clara com o lote ou pertencentes a outra pessoa;
- identificar o maior impacto semântico presente.

### 2. Executar o preflight

Antes de alterar a versão:

1. executar os testes completos;
2. validar o TypeScript;
3. executar a verificação arquitetural;
4. gerar o build de produção;
5. realizar validação manual nos fluxos visuais alterados, em desktop e iPad quando aplicável.

O preflight é uma validação de qualidade e não deve depender de uma versão nova já registrada. Enquanto não houver um script agregado exclusivo, seus comandos são:

```powershell
pnpm run test
pnpm exec tsc --noEmit
pnpm run check:architecture
pnpm run build
```

### 3. Determinar a versão

- aplicar `PATCH`, `MINOR` ou `MAJOR` conforme a convenção deste documento;
- considerar todas as mudanças desde a última entrega, não apenas a alteração mais recente;
- registrar a justificativa quando houver quebra de contrato ou migração de dados.

### 4. Reconciliar a documentação

- atualizar o changelog com mudanças relevantes para usuários e mantenedores;
- atualizar README, contratos de domínio, arquitetura, persistência, Packs e guias afetados;
- fechar no backlog somente itens efetivamente concluídos;
- registrar novas pendências encontradas sem tentar resolvê-las fora do escopo da entrega;
- não alterar documentos sem relação com o lote apenas para fazê-los parecer atuais.

Documentos que funcionam como contrato arquitetural ou de domínio devem preferencialmente acompanhar a implementação que os altera. O comando `versione` faz a reconciliação final, mas não substitui essa disciplina durante o desenvolvimento.

### 5. Atualizar a versão

- alterar a versão em `package.json`;
- criar a seção correspondente em `CHANGELOG.md`;
- atualizar as demais referências explícitas à versão corrente.

### 6. Executar a validação final

Após as alterações de release:

1. executar `pnpm run check`, incluindo a validação de versão e changelog;
2. executar novamente `pnpm run build`;
3. executar `git diff --check`;
4. revisar exatamente os arquivos que entrarão no commit.

Se uma alteração de documentação ou release tocar código executável, os testes completos devem ser repetidos antes do commit.

### 7. Criar o commit

- adicionar somente os arquivos pertencentes à entrega;
- usar uma mensagem que represente o lote completo;
- não criar commit quando qualquer validação estiver pendente ou tiver falhado;
- confirmar o identificador do commit e que não restaram mudanças acidentais.

### 8. Executar o push

O repositório canônico é `https://github.com/thmod-on/SoulForge.git`, informado pelo usuário como sendo de sua propriedade. Um pedido explícito de `versione` autoriza o push da entrega validada para esse remoto.

- na branch `main`, o comando `versione` constitui autorização expressa para executar `git push origin main`, mesmo sendo a branch principal e mesmo quando esse envio dispara o workflow de publicação do site; não solicitar uma confirmação adicional apenas por esses efeitos esperados;
- por padrão, enviar a branch atual para sua contraparte em `origin`;
- quando a branch ou o destino forem ambíguos, interromper e pedir confirmação;
- nunca executar push apenas porque existem commits locais: é necessário o comando `versione` ou outra solicitação explícita do usuário;
- após o envio, confirmar que a branch local está sincronizada com o remoto.

### 9. Verificar a publicação

Quando as ferramentas permitirem:

- conferir o GitHub Actions;
- conferir a publicação no GitHub Pages;
- reportar falhas de CI ou publicação sem ocultar o estado do push já realizado.

O GitHub Actions publica automaticamente a branch `main` no GitHub Pages. Não é necessário manter um servidor próprio em execução.

## Condições de interrupção

O fluxo deve parar antes do commit e do push se:

- testes, TypeScript, arquitetura, build ou validação de release falharem;
- houver dúvida material sobre o incremento semântico;
- existirem alterações locais de origem ou escopo incertos;
- a documentação necessária não puder ser reconciliada com segurança;
- credenciais, branch ou remoto impedirem a publicação.

Uma falha não autoriza descartar mudanças do usuário. As alterações preparatórias feitas pelo processo permanecem visíveis, e o bloqueio deve ser explicado objetivamente para correção ou decisão.

## Changelog

O changelog registra mudanças percebidas por usuários e mantenedores. Evite detalhes internos sem impacto no uso, como mera reorganização de arquivos. Entradas acumuladas durante o desenvolvimento devem ser consolidadas sob a versão definida por `versione`, sem criar versões intermediárias para cada pequena alteração.
