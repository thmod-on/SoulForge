# JSON Conventions

Versão: 1.0 (Rascunho)

---

# Objetivo

Este documento define as convenções utilizadas para representar o domínio do SoulForge em JSON.

O objetivo não é especificar um formato rígido, mas estabelecer princípios consistentes para que todos os Packs utilizem a mesma linguagem.

As convenções aqui descritas aplicam-se a qualquer arquivo JSON utilizado pelo domínio.

Este documento complementa:

- `ARCHITECTURE.md`
- `DOMAIN_MODEL.md`
- `DOMAIN_BEHAVIORS.md`

---

# Filosofia

JSON é apenas um formato de serialização.

Ele não representa o domínio.

O domínio existe independentemente do formato utilizado para armazená-lo.

As convenções deste documento existem para garantir:

- legibilidade;
- consistência;
- estabilidade;
- facilidade de evolução.

Sempre que houver conflito entre o domínio e a representação em JSON, o domínio prevalece.

---

# Estrutura Geral

Todo arquivo JSON representa um único conceito do domínio.

Um arquivo nunca deve representar múltiplas Definitions independentes.

Exemplos:

✔ Uma Card por arquivo.

✔ Uma Weapon por arquivo.

✔ Uma Class por arquivo.

✘ Uma coleção completa de Cards.

---

# Identificadores

Toda Definition deve possuir um identificador único.

O identificador:

- é obrigatório;
- é imutável;
- é estável entre versões;
- nunca depende do nome apresentado ao jogador.

Exemplo:

```json
{
    "id": "card.fireball"
}
```

IDs nunca devem ser reutilizados para representar outro conceito.

---

# Naming

Os nomes das propriedades utilizam:

- camelCase;
- inglês;
- substantivos claros.

Exemplos:

```text
maxHope
startingStress
resourceCost
grantedFeature
```

Evitar:

```text
MaxHope
Max_Hope
hope_max
```

---

# Referências

Definitions nunca copiam outras Definitions.

Sempre utilizam referências por ID.

Exemplo:

```json
{
    "class": "class.guardian"
}
```

Nunca:

```json
{
    "class": {
        ...
    }
}
```

---

# Estruturas Aninhadas

Objetos devem ser utilizados apenas quando representam parte integrante da Definition.

Listas devem representar coleções homogêneas.

Exemplo:

```json
{
    "behaviors": [],
    "features": [],
    "keywords": []
}
```

---

# Valores Enumerados

Sempre que um conjunto de valores for conhecido e limitado, utilizar valores literais.

Exemplo:

```json
{
    "tier": "foundation"
}
```

Evitar códigos numéricos sem significado.

---

# Behaviors

Behaviors são declarados como coleções.

Cada Behavior possui:

- identificador;
- parâmetros.

Exemplo conceitual:

```json
{
    "behaviors": [
        {
            "id": "grantHope",
            "amount": 2
        }
    ]
}
```

A estrutura interna de cada Behavior depende exclusivamente do próprio Behavior.

---

# Progression

Progression segue as mesmas convenções dos demais Behaviors.

Ela apenas representa um momento diferente do domínio.

Exemplo:

```json
{
    "progression": [
        {
            "id": "choice",
            "count": 1
        }
    ]
}
```

---

# Valores Opcionais

Propriedades opcionais devem ser omitidas.

Evitar utilizar:

```json
{
    "description": null
}
```

Preferir:

```json
{
}
```

Ausência possui significado próprio.

---

# Valores Padrão

Valores padrão pertencem à Engine.

Não devem ser repetidos em todas as Definitions.

Exemplo:

Se toda Card possuir:

```text
enabled = true
```

não existe motivo para gravar esse valor em todos os arquivos.

---

# Ordem das Propriedades

Sempre utilizar a mesma organização.

Sugestão:

```text
id

type

metadata

references

attributes

behaviors
```

Essa ordem melhora a leitura e reduz conflitos em controle de versão.

---

# Formatação

Utilizar:

- UTF-8;
- indentação com quatro espaços;
- arrays em múltiplas linhas;
- objetos pequenos em uma única linha apenas quando melhorarem a legibilidade.

---

# Comentários

JSON não deve conter comentários.

Toda documentação pertence aos arquivos Markdown.

---

# Versionamento

Definitions não armazenam sua própria versão.

O versionamento pertence ao Pack.

A compatibilidade entre versões é responsabilidade da Engine.

---

# Extensibilidade

Novas propriedades podem ser adicionadas.

Propriedades existentes não devem mudar de significado.

Mudanças incompatíveis devem resultar em novos conceitos do domínio.

---

# Boas Práticas

✔ IDs estáveis.

✔ Referências por ID.

✔ Um conceito por arquivo.

✔ Behaviors declarativos.

✔ Nomes em inglês.

✔ Estrutura previsível.

✔ Sem duplicação de informações.

✔ JSON legível por humanos.

---

# Antipadrões

✘ Copiar Definitions completas.

✘ Duplicar regras em múltiplos arquivos.

✘ Criar IDs dependentes do idioma.

✘ Inserir lógica em JSON.

✘ Utilizar propriedades sem significado claro.

✘ Depender da ordem dos objetos para definir comportamento.

---

# Resumo

O JSON utilizado pelo SoulForge é apenas uma representação do domínio.

Ele deve permanecer:

- simples;
- previsível;
- estável;
- legível.

As regras pertencem ao domínio.

Os Behaviors pertencem ao domínio.

O JSON apenas descreve essas informações de forma consistente.