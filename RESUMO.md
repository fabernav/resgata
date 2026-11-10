# Sistema Inteligente de Achados e Perdidos para Campus

## 1. Visão Geral do Projeto
Plataforma web e mobile responsiva para gestão inteligente de achados e perdidos no campus universitário. O sistema realiza cruzamento automático (match pontuado) entre itens perdidos e achados e implementa uma camada de segurança por verificação de posse para evitar fraudes.

---

## 2. Regras de Negócio & Funcionalidades

### 2.1. Usuários e Autenticação
* Cadastro com Nome, E-mail Institucional e Telefone/Contato.
* Autenticação e controle de sessão.

### 2.2. Registro de Itens Perdidos
* Campos: Categoria, Cor, Local aproximado, Data da perda, Descrição livre e Foto opcional de referência.
* Status inicial: `PENDING_MATCH`.

### 2.3. Registro de Itens Achados
* Campos Públicos: Categoria, Cor, Local onde encontrou, Data, Descrição pública, Foto (opcional/blur).
* Campo Oculto (Segurança): Pergunta/detalhe de verificação que **NUNCA** é exposto na API pública (ex: conteúdo interno, marca exata, desgastes).
* Status inicial: `AVAILABLE`.

### 2.4. Motor de Match (Scoring Algorithm)
Executado a cada novo cadastro cruzando com a base oposta:
* **Categoria igual:** Peso Alto (ex: 35 pts)
* **Local igual/próximo:** Peso Alto (ex: 30 pts)
* **Cor igual/similar:** Peso Médio (ex: 15 pts)
* **Data compatível (Achado >= Perdido):** Peso Médio (ex: 10 pts)
* **Palavras-chave na descrição:** Peso Baixo (ex: 10 pts)
* **Gatilho:** Se `Score >= Limite Mínimo`, gera a entidade `Match` e notifica ambos os usuários.

### 2.5. Fluxo de Verificação de Posse & Segurança
* Usuário que perdeu tenta responder à pergunta de verificação do item achado.
* **Limite de tentativas (Rate Limiting/Brute Force Protection):** Máximo de 3 tentativas para evitar força bruta.
* **Sucesso:** Match passa para `VERIFIED` e os dados de contato de quem achou são liberados na tela.
* **Falha:** Bloqueia nova tentativa após esgotar o limite.

### 2.6. Ciclo de Vida e Resolução
* Ambas as partes confirmam a devolução na interface (`CONFIRM_DELIVERY`).
* Itens são arquivados como `RESOLVED` e saem dos feeds ativos.

---

## 3. Estrutura de Telas / Frontend
1. Auth: Login & Cadastro
2. Dashboard: Itens Perdidos, Itens Achados, Matches Sugeridos
3. Formulários: Cadastro de Item Perdido / Achado (com destaque visual de privacidade no campo oculto)
4. Feed Público: Listagem com filtros por categoria, local e data
5. Detalhes do Item: Apenas dados públicos
6. Tela de Match & Verificação: Interface para responder à pergunta de segurança
7. Tela de Contato Liberado: Exibição de dados após validação
8. Histórico: Casos resolvidos

---

## 4. Diretrizes Técnicas para a IA
* Priorizar código modular, limpo e tipado.
* Garantir sanitização de dados no backend para que campos ocultos de verificação nunca vazem em endpoints públicos.
* Manter regras de matching encapsuladas em serviços dedicados.

## 5. Diretrizes de Design Visual & UI/UX (Estilo Apple Minimalista)

* **Tipografia:** 
  * Família de fontes: Sistema Apple (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`) com fallback para `Inter`, `sans-serif`.
  * Hierarquia: Títulos nítidos e diretos com peso `font-semibold`/`font-bold`, corpo de texto limpo `font-normal` e espaçamento amplo.

* **Paleta de Cores:**
  * Background Principal: `#F5F5F7` (cinza bem claro/off-white padrão Apple)
  * Cards e Superfícies: `#FFFFFF` (com bordas sutis `border border-gray-200/60` e sombras muito suaves `shadow-sm`)
  * Tipografia Principal: `#1D1D1F`
  * Tipografia Secundária: `#86868B`
  * Ação Primária / Confirmação: `#0071E3` (Azul clássico iOS)
  * Destaque de Match / Atenção: `#FF9500` (Laranja quente)
  * Sucesso / Item Devolvido: `#34C759` (Verde Apple)

* **Estética e Componentes:**
  * Cantos arredondados generosos (`rounded-2xl` para cards, `rounded-full` para botões de ação e badges).
  * Efeito de vidro sutil (*Glassmorphism* leve com `backdrop-blur-md` na barra de navegação superior).
  * Badge discreto com ícone de cadeado para o campo oculto de verificação de posse.