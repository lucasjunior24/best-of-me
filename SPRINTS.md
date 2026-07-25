# 🏃 Sprints — Best of Me (MVP Módulo Estudos)

---

## Visão Geral das Sprints

| Sprint | Foco | Duração Estimada | Tasks |
|---|---|---|---|
| **Sprint 1** | Setup do Projeto | 2-3 dias | 8 |
| **Sprint 2** | Autenticação | 2-3 dias | 7 |
| **Sprint 3** | Core — Regras de Negócio | 3-4 dias | 14 |
| **Sprint 4** | Adapter Firebase | 2-3 dias | 8 |
| **Sprint 5** | UI Básica + Componentes | 3-4 dias | 12 |
| **Sprint 6** | CRUD de Temas | 3-4 dias | 11 |
| **Sprint 7** | Calendário de Estudos | 3-4 dias | 13 |
| **Sprint 8** | Dark Mode | 2-3 dias | 9 |
| **Sprint 9** | Polimento e Testes | 3-4 dias | 12 |
| **Sprint 10** | Deploy | 1-2 dias | 6 |

**Total estimado:** 24-34 dias

---

## Sprint 1 — Setup do Projeto

**Objetivo:** Inicializar o projeto com todas as dependências, configurar ferramentas e criar a estrutura de diretórios base.

### Tasks

- [ ] **T1.1** — Criar projeto com Vite (template React + TypeScript)
  - Comando: `npm create vite@latest best-of-me -- --template react-ts`
  - Verificar se o projeto roda com `npm run dev`

- [ ] **T1.2** — Instalar dependências principais
  - `npm install firebase react-router-dom react-hot-toast date-fns uuid`
  - `npm install -D tailwindcss postcss autoprefixer @types/uuid`

- [ ] **T1.3** — Configurar Tailwind CSS
  - `npx tailwindcss init -p`
  - Configurar `tailwind.config.js` com `darkMode: 'class'`
  - Configurar `content` paths
  - Adicionar diretivas `@tailwind base/components/utilities` no `index.css`

- [ ] **T1.4** — Configurar TypeScript strict mode
  - Verificar `tsconfig.json`: `"strict": true`
  - Adicionar `"noUnusedLocals": true`, `"noUnusedParameters": true`
  - Configurar path aliases: `@core/*`, `@adapters/*`, `@presentation/*`, `@shared/*`

- [ ] **T1.5** — Configurar ESLint + Prettier
  - Instalar e configurar ESLint com regras recomendadas
  - Configurar Prettier com `.prettierrc`

- [ ] **T1.6** — Criar estrutura de diretórios conforme `MVP_PLAN.md` seção 3
  - Criar todos os diretórios vazios: `core/`, `adapters/`, `di/`, `presentation/`, `shared/`
  - Criar arquivos `index.ts` (barrel exports) em cada diretório

- [ ] **T1.7** — Configurar Firebase
  - Criar projeto no Firebase Console
  - Habilitar Authentication (Google) e Firestore
  - Criar arquivo `src/adapters/firebase/config.ts` com as credenciais via `.env`
  - Adicionar `.env` e `.env.example` ao `.gitignore`

- [ ] **T1.8** — Configurar React Router básico
  - Criar `App.tsx` com `BrowserRouter` e rotas vazias placeholder
  - Criar placeholders para `LoginPage`, `HomePage`
  - Verificar navegação entre rotas

---

## Sprint 2 — Autenticação

**Objetivo:** Implementar login com Google via Firebase Auth, contexto de autenticação e proteção de rotas.

### Tasks

- [ ] **T2.1** — Criar entidade `User` (`src/core/entities/User.ts`)
  - Tipagem: `id`, `email`, `displayName`, `photoURL?`

- [ ] **T2.2** — Criar port `IAuthRepository` (`src/core/ports/IAuthRepository.ts`)
  - Métodos: `signInWithGoogle()`, `signOut()`, `getCurrentUser()`, `onAuthStateChanged()`

- [ ] **T2.3** — Implementar `FirebaseAuthRepository` (`src/adapters/firebase/FirebaseAuthRepository.ts`)
  - Implementar `signInWithPopup(auth, googleProvider)`
  - Implementar conversão `FirebaseUser` → `User`
  - Implementar `onAuthStateChanged` com unsubscribe

- [ ] **T2.4** — Criar `AuthContext` (`src/presentation/context/AuthContext.tsx`)
  - Prover: `user`, `loading`, `signIn`, `signOut`
  - Usar `useEffect` com `onAuthStateChanged` para observar estado

- [ ] **T2.5** — Criar `ProtectedRoute` (`src/presentation/components/layout/ProtectedRoute.tsx`)
  - Se `loading`: mostrar `Spinner` fullscreen
  - Se `!user`: `<Navigate to="/login" />`
  - Se `user`: `<Outlet />`

- [ ] **T2.6** — Criar `LoginPage` (`src/presentation/pages/LoginPage.tsx`)
  - Layout centralizado com logo, subtítulo
  - Botão "Entrar com Google" com ícone
  - Estados: idle, loading (botão desabilitado + spinner), error (toast)

- [ ] **T2.7** — Integrar rotas com proteção
  - Rota `/login` pública
  - Rotas protegidas aninhadas sob `ProtectedRoute`
  - Redirecionamento após login: `/login` → `/`

---

## Sprint 3 — Core — Regras de Negócio

**Objetivo:** Implementar todas as entidades, ports e use cases do domínio de estudos com testes unitários.

### Tasks

- [ ] **T3.1** — Criar entidade `StudyTopic` (`src/core/entities/StudyTopic.ts`)
  - Campos: `id`, `userId`, `name`, `color`, `totalDays`, `hoursPerDay`, `createdAt`, `updatedAt`

- [ ] **T3.2** — Criar entidade `StudySession` (`src/core/entities/StudySession.ts`)
  - Campos: `id`, `userId`, `topicId`, `date`, `completed`, `completedAt?`, `duration?`, `createdAt`

- [ ] **T3.3** — Criar tipos de progresso (`src/core/entities/ProgressData.ts`)
  - `ProgressData`: `totalPlannedSessions`, `totalCompletedSessions`, `completionPercentage`, `byTopic`
  - `TopicProgress`: `topicId`, `topicName`, `topicColor`, `totalSessions`, `completedSessions`, `percentage`

- [ ] **T3.4** — Criar port `IStudyRepository` (`src/core/ports/IStudyRepository.ts`)
  - CRUD topics: `createTopic`, `updateTopic`, `deleteTopic`, `getTopicsByUser`
  - Sessions: `scheduleSessions`, `getSessionsByDateRange`, `toggleSessionCompletion`
  - Progress: `getProgress`

- [ ] **T3.5** — Criar port `IToastService` (`src/core/ports/IToastService.ts`)
  - Métodos: `success(message)`, `error(message)`, `info(message)`

- [ ] **T3.6** — Criar erros do domínio (`src/shared/errorHandler.ts`)
  - `ValidationError`, `NotFoundError`, `AuthError`
  - Função `handleError(error: unknown): string`

- [ ] **T3.7** — Implementar `CreateStudyTopicUseCase`
  - Validar: nome obrigatório, ao menos 1 data, cor válida (hex), totalDays > 0
  - Criar topic + sessions em sequência
  - Teste unitário: cenários feliz, validação, erro de repositório

- [ ] **T3.8** — Implementar `UpdateStudyTopicUseCase`
  - Buscar topic existente, aplicar partial update
  - Teste unitário

- [ ] **T3.9** — Implementar `DeleteStudyTopicUseCase`
  - Deletar topic + todas sessions associadas (batch delete)
  - Teste unitário

- [ ] **T3.10** — Implementar `GetStudyTopicsUseCase`
  - Listar todos os topics do usuário
  - Teste unitário

- [ ] **T3.11** — Implementar `ScheduleStudyDaysUseCase`
  - Para cada data, criar session evitando duplicatas (mesmo topicId + date)
  - Teste unitário

- [ ] **T3.12** — Implementar `ToggleSessionCompletionUseCase`
  - Buscar session, inverter completed, definir completedAt
  - Teste unitário

- [ ] **T3.13** — Implementar `GetCalendarSessionsUseCase`
  - Buscar sessions em range de datas + topics
  - Fazer merge: enriquecer sessions com nome e cor do topic
  - Agrupar por data → `CalendarDay[]`
  - Teste unitário

- [ ] **T3.14** — Implementar `GetStudyProgressUseCase`
  - Calcular totais, percentuais, agrupar por topic
  - Filtrar por topicIds opcional
  - Teste unitário: verificar cálculos de %

---

## Sprint 4 — Adapter Firebase (Firestore)

**Objetivo:** Implementar o `FirebaseStudyRepository` conectando os use cases ao Firestore, configurar índices e security rules.

### Tasks

- [ ] **T4.1** — Criar `FirebaseStudyRepository` — estrutura base
  - Inicializar Firestore (`getFirestore`)
  - Referenciar collections: `users/{uid}/topics`, `users/{uid}/sessions`

- [ ] **T4.2** — Implementar `createTopic` + `updateTopic` + `deleteTopic`
  - `createTopic`: `addDoc` + gerar ID com uuid
  - `updateTopic`: `updateDoc` com `serverTimestamp` para `updatedAt`
  - `deleteTopic`: `deleteDoc` + batch delete das sessions associadas

- [ ] **T4.3** — Implementar `getTopicsByUser`
  - Query: `collection('users', userId, 'topics')`, `orderBy('createdAt', 'desc')`

- [ ] **T4.4** — Implementar `scheduleSessions`
  - Verificar duplicatas (topicId + date já existe)
  - Usar `writeBatch` para criar múltiplas sessions

- [ ] **T4.5** — Implementar `getSessionsByDateRange`
  - Query com filtro: `userId`, `date >= startDate`, `date <= endDate`
  - Suporte a filtro opcional por `topicIds` (usando `where('topicId', 'in', topicIds)`)
  - **Atenção:** `in` aceita no máximo 10 valores; se necessário, quebrar em múltiplas queries

- [ ] **T4.6** — Implementar `toggleSessionCompletion`
  - `updateDoc` com `completed` e `completedAt` (ou `null`)

- [ ] **T4.7** — Implementar `getProgress`
  - Buscar todas as sessions do usuário (possivelmente paginado se > 500)
  - Filtrar por `topicIds` se fornecido
  - Calcular agregações no lado do client (Firestore não suporta COUNT nativo sem extensão)

- [ ] **T4.8** — Criar índices compostos no Firebase Console
  - `sessions`: `userId` ASC, `date` ASC
  - `sessions`: `userId` ASC, `topicId` ASC, `date` ASC
  - Implementar security rules (`firestore.rules`)

---

## Sprint 5 — UI Básica + Componentes

**Objetivo:** Criar os componentes atômicos reutilizáveis (design system), layout principal e a HomePage.

### Tasks

- [ ] **T5.1** — Criar `Button` component
  - Variantes: `primary`, `secondary`, `outline`, `danger`, `ghost`
  - Tamanhos: `sm`, `md`, `lg`
  - Estados: `loading` (spinner interno), `disabled`
  - Suporte a `onClick`, `type`, `className`

- [ ] **T5.2** — Criar `Input` component
  - Com label flutuante
  - Estados: normal, focus, error (borda vermelha + mensagem), disabled
  - Tipos: `text`, `number`, `email`, `password`

- [ ] **T5.3** — Criar `Modal` component
  - Overlay com clique fora para fechar
  - Header com título + botão X
  - Body com scroll
  - Footer com ações
  - Animações de entrada/saída (fade + scale)
  - Portal via `createPortal`

- [ ] **T5.4** — Criar `Spinner` component
  - Tamanhos: `sm`, `md`, `lg`
  - Cores: `primary`, `white`
  - Animação CSS de rotação

- [ ] **T5.5** — Criar `ColorPicker` component
  - Grid de 12 cores predefinidas
  - Input para cor customizada (hex)
  - Indicador de cor selecionada
  - Acessibilidade: aria-label em cada cor

- [ ] **T5.6** — Criar `ProgressBar` component
  - Variantes: horizontal (barra), circular (SVG ring)
  - Cor customizável (usa cor do tema)
  - Label com porcentagem
  - Animação de preenchimento

- [ ] **T5.7** — Criar `AppLayout` component
  - Header fixo: breadcrumb + ThemeToggle + avatar + logout
  - Área de conteúdo com `<Outlet />`
  - Responsivo: mobile-first com header compacto

- [ ] **T5.8** — Criar `HomePage`
  - Saudação: "Olá, {displayName}!"
  - Avatar do Google
  - Botão de logout
  - Grid de cards: "📚 Estudos" (ativo) + "🏋️ Academia" (desabilitado, badge "Em breve")

- [ ] **T5.9** — Implementar `HotToastService` (`src/adapters/toast/HotToastService.ts`)
  - Wrapper sobre `react-hot-toast`
  - Implementa `IToastService`

- [ ] **T5.10** — Criar `useAuth` hook (`src/presentation/hooks/useAuth.ts`)
  - Wrapper que consome `AuthContext` e lança erro se usado fora do provider

- [ ] **T5.11** — Criar `StudyOverviewPage` — estrutura base
  - Cards de indicadores (total planejado, total concluído)
  - ProgressBar circular (% geral)
  - Placeholder para lista de progresso por tema (será preenchido na Sprint 6)
  - Botões de navegação: "Gerenciar Temas" + "Ver Calendário"

- [ ] **T5.12** — Configurar container DI básico (`src/di/container.ts`)
  - Instanciar repositórios e serviços
  - Exportar factories de use cases

---

## Sprint 6 — CRUD de Temas

**Objetivo:** Implementar a página de gerenciamento de temas com formulário completo e seleção de datas no calendário.

### Tasks

- [ ] **T6.1** — Criar `useStudyTopics` hook
  - Estado: `topics`, `loading`, `error`
  - Métodos: `loadTopics`, `createTopic`, `updateTopic`, `deleteTopic`
  - Integrar com `useCases.study.*` via container DI
  - Tratar erros com `handleError` e `toastService`

- [ ] **T6.2** — Criar `StudyTopicsPage` — lista de temas
  - Grid de cards (1 col mobile, 2-3 cols desktop)
  - Cada card: barra de cor, nome, total dias, horas/dia
  - Ações: ícone lápis (editar), ícone lixeira (excluir)
  - Exclusão: modal de confirmação

- [ ] **T6.3** — Criar estado Empty para `StudyTopicsPage`
  - Ilustração SVG simples
  - Texto: "Nenhum tema cadastrado"
  - Botão: "Criar primeiro tema"

- [ ] **T6.4** — Criar estado Loading para `StudyTopicsPage`
  - Skeleton cards (3-4 placeholders com animação pulse)

- [ ] **T6.5** — Criar estado Error para `StudyTopicsPage`
  - Mensagem de erro amigável
  - Botão "Tentar novamente"

- [ ] **T6.6** — Criar formulário de criação/edição de tema (dentro de Modal)
  - Campo: Nome do tema (Input text, obrigatório, min 2 chars)
  - ColorPicker integrado
  - Campo: Total de dias (Input number, min 1)
  - Campo: Horas por dia (Input number, step 0.5, min 0.5)
  - Validação em tempo real com mensagens de erro inline

- [ ] **T6.7** — Criar calendário de seleção de datas inline (dentro do Modal)
  - Componente: `DatePicker`
  - Navegação entre meses (setas)
  - Dias clicáveis com seleção múltipla (toggle on/off)
  - Dias selecionados: background com a cor do tema selecionado
  - Dias de fim de semana: estilo diferenciado (opacidade reduzida)
  - Preview: "X dias selecionados"

- [ ] **T6.8** — Implementar submissão do formulário
  - Coletar `scheduledDates` do `DatePicker`
  - Chamar `createTopic` ou `updateTopic` via hook
  - Loading state no botão Salvar
  - Toast de sucesso/erro
  - Fechar modal e recarregar lista

- [ ] **T6.9** — Implementar edição de tema
  - Abrir modal preenchido com dados existentes
  - Reutilizar mesmo formulário (modo edição)
  - Carregar datas já agendadas no DatePicker

- [ ] **T6.10** — Implementar exclusão de tema
  - Modal de confirmação: "Tem certeza? Todas as sessões agendadas serão removidas."
  - Ao confirmar: chamar `deleteTopic`, toast, recarregar lista

- [ ] **T6.11** — Integrar `StudyOverviewPage` com dados reais de progresso
  - Criar `useStudyProgress` hook
  - Cards de indicadores com dados reais do Firestore
  - Filtro por temas (chips multi-select)
  - Lista de progresso por tema com ProgressBar

---

## Sprint 7 — Calendário de Estudos

**Objetivo:** Implementar a visão de calendário mensal com dots coloridos, filtro por temas e modal de detalhes do dia.

### Tasks

- [ ] **T7.1** — Criar `useCalendarSessions` hook
  - Estado: `sessions`, `topics`, `loading`, `error`, `selectedTopicIds`
  - Métodos: `loadMonth(year, month)`, `filterByTopics(topicIds)`, `toggleSession(sessionId)`
  - Agrupar sessions por data → `Map<string, CalendarDay>`

- [ ] **T7.2** — Criar tipo `CalendarDay`
  - `date: string`, `sessions: StudySessionWithTopic[]`, `allCompleted: boolean`, `anyCompleted: boolean`
  - `StudySessionWithTopic`: `StudySession` + `topicName`, `topicColor`

- [ ] **T7.3** — Criar `StudyCalendarPage` — estrutura do calendário
  - Header com mês/ano + setas de navegação
  - Grid 7 colunas (dom-seg)
  - Cabeçalho com nomes dos dias da semana
  - Células dos dias preenchidas dinamicamente

- [ ] **T7.4** — Implementar navegação entre meses
  - Setas esquerda/direita
  - Ao mudar mês: `loadMonth(newYear, newMonth)`
  - Label: "Julho de 2026"

- [ ] **T7.5** — Renderizar dots coloridos nos dias
  - Para cada `CalendarDay`, renderizar até 4 dots coloridos
  - Se houver mais de 4 temas: mostrar "+N" badge
  - Cor do dot = cor do StudyTopic
  - Estilo do dot: círculo pequeno (w-2 h-2) com a cor de fundo

- [ ] **T7.6** — Implementar indicadores de conclusão nos dias
  - Todas concluídas: fundo verde claro + badge "✓"
  - Parcialmente concluído: fundo amarelo/laranja claro
  - Nenhuma concluída: fundo normal com dots coloridos

- [ ] **T7.7** — Criar filtro por temas (chips multi-select)
  - Buscar lista de topics do usuário
  - Renderizar chips: "Todos" (default selecionado) + um chip por tema
  - Chip selecionado: background com cor do tema + texto branco
  - Chip não selecionado: outline/borda
  - Ao selecionar/deselecionar: chamar `filterByTopics`

- [ ] **T7.8** — Criar `StudyDayDetailModal`
  - Abrir ao clicar em um dia no calendário
  - Header: data formatada por extenso ("Quinta-feira, 24 de Julho de 2026")
  - Lista de temas do dia (nome, cor, horas sugeridas)
  - Cada item: toggle switch/checkbox "Concluído"
  - Se concluído: mostrar data/hora de conclusão
  - Ao togglear: chamar `toggleSession`, atualizar estado local imediatamente (otimista)

- [ ] **T7.9** — Implementar update otimista no toggle de conclusão
  - Atualizar UI imediatamente (antes da resposta do Firestore)
  - Em caso de erro: reverter estado + toast de erro
  - Em caso de sucesso: toast de confirmação

- [ ] **T7.10** — Criar estado Loading para o calendário
  - Skeleton: grid de 7x5 com placeholders nos dias
  - Spinner enquanto carrega

- [ ] **T7.11** — Criar estado Empty para o calendário
  - Sem temas cadastrados: link para `/study/topics`
  - Mês sem sessões: "Nenhum estudo agendado para este mês"

- [ ] **T7.12** — Implementar destaque do dia atual
  - Borda ou background destacado para `today`
  - Label "Hoje"

- [ ] **T7.13** — Testar responsividade do calendário
  - Mobile: células compactas, dots menores
  - Desktop: calendário maior com mais informações

---

## Sprint 8 — Dark Mode

**Objetivo:** Implementar a alternância entre tema claro e escuro com persistência híbrida (localStorage + Firestore).

### Tasks

- [ ] **T8.1** — Configurar Tailwind para dark mode
  - Verificar `darkMode: 'class'` no `tailwind.config.js`
  - Adicionar variantes `dark:` em todos os componentes existentes (Sprint 5-7)
  - Backgrounds, textos, bordas, sombras

- [ ] **T8.2** — Criar `ThemeContext` (`src/presentation/context/ThemeContext.tsx`)
  - Estado: `theme: 'light' | 'dark'`
  - Método: `toggleTheme()`
  - Ao iniciar: ler localStorage, aplicar classe `dark` no `<html>`

- [ ] **T8.3** — Criar `useTheme` hook (`src/presentation/hooks/useTheme.ts`)
  - Consumir `ThemeContext`
  - Retornar `{ theme, toggleTheme, isDark }`

- [ ] **T8.4** — Criar `ThemeToggle` component (`src/presentation/components/ui/ThemeToggle.tsx`)
  - Ícones: ☀️ (claro) / 🌙 (escuro)
  - Botão com animação de rotação
  - Acessibilidade: aria-label dinâmico

- [ ] **T8.5** — Adicionar `ThemeToggle` ao `AppLayout`
  - Posicionar no header ao lado do avatar/logout

- [ ] **T8.6** — Adicionar script anti-flash no `index.html`
  - Script inline que lê localStorage e aplica classe `dark` antes do React carregar
  - Também verifica `prefers-color-scheme` como fallback

- [ ] **T8.7** — Implementar persistência no Firestore
  - Collection: `users/{uid}/preferences` com campo `theme`
  - Ao alternar tema: salvar no Firestore + localStorage
  - Ao carregar: localStorage (imediato) + sincronizar com Firestore (assíncrono)

- [ ] **T8.8** — Revisar TODOS os componentes aplicando `dark:` variants
  - `LoginPage`: background, texto, botão
  - `HomePage`: cards, textos
  - `StudyOverviewPage`: cards de indicadores, progress bars
  - `StudyTopicsPage`: cards de temas, modal, form
  - `StudyCalendarPage`: células do calendário, dots, modal
  - Componentes UI: Button, Input, Modal, Spinner, ColorPicker, ProgressBar

- [ ] **T8.9** — Testar visualmente ambos os temas
  - Verificar contraste de texto (acessibilidade WCAG AA)
  - Verificar cores dos dots no calendário em dark mode
  - Ajustar paleta se necessário

---

## Sprint 9 — Polimento e Testes

**Objetivo:** Garantir qualidade com testes, tratar todos os estados de UI e polir a experiência do usuário.

### Tasks

- [ ] **T9.1** — Testes unitários dos Use Cases (Core)
  - `CreateStudyTopicUseCase`: sucesso, validação, erro
  - `UpdateStudyTopicUseCase`: sucesso, not found
  - `DeleteStudyTopicUseCase`: sucesso, batch delete sessions
  - `ToggleSessionCompletionUseCase`: marcar/desmarcar
  - `GetStudyProgressUseCase`: cálculos de % corretos
  - `GetCalendarSessionsUseCase`: agrupamento por data, merge com topics
  - Usar Vitest + mocks dos repositories

- [ ] **T9.2** — Testes de componente (Presentation)
  - `LoginPage`: renderiza, botão chama signIn
  - `Button`: variantes, loading state
  - `Modal`: abre/fecha, clique fora
  - `ProgressBar`: renderiza % correto
  - `StudyTopicsPage`: renderiza lista, abre modal
  - `StudyCalendarPage`: renderiza dias corretos, dots
  - Usar Vitest + React Testing Library

- [ ] **T9.3** — Revisar estados Loading em todas as páginas
  - `LoginPage`: botão desabilitado + spinner
  - `HomePage`: skeleton do header
  - `StudyOverviewPage`: skeleton dos cards de indicadores
  - `StudyTopicsPage`: skeleton dos cards
  - `StudyCalendarPage`: skeleton do grid

- [ ] **T9.4** — Revisar estados Empty em todas as páginas
  - `StudyOverviewPage`: sem temas cadastrados → link para criar
  - `StudyTopicsPage`: ilustração + CTA
  - `StudyCalendarPage`: sem temas → link, mês vazio → mensagem

- [ ] **T9.5** — Revisar estados Error em todas as páginas
  - Mensagem amigável + botão "Tentar novamente"
  - Erro de rede: "Verifique sua conexão"
  - Erro de permissão: "Você não tem acesso"

- [ ] **T9.6** — Implementar toasts em todas as ações
  - Criar tema: "Tema criado com sucesso! 🎉"
  - Editar tema: "Tema atualizado!"
  - Excluir tema: "Tema removido"
  - Marcar concluído: "Dia concluído! 🎉"
  - Desmarcar: "Dia reaberto"
  - Erros: mensagem específica do erro

- [ ] **T9.7** — Responsividade
  - Testar em breakpoints: 320px, 375px (mobile), 768px (tablet), 1024px+ (desktop)
  - Ajustar grids, tamanhos de fonte, espaçamentos
  - Garantir touch targets mínimos de 44px (WCAG)

- [ ] **T9.8** — Acessibilidade
  - Navegação por teclado (Tab, Enter, Escape)
  - Foco visível em todos os elementos interativos
  - Labels em inputs e botões (aria-label quando só ícone)
  - Contraste de cores (mínimo 4.5:1 para texto normal)

- [ ] **T9.9** — Revisão de performance
  - Lazy loading de páginas com `React.lazy` + `Suspense`
  - Paginação/virtualização se necessário (> 100 temas)
  - Otimizar re-renders: `useMemo`, `useCallback` onde apropriado
  - Verificar bundle size com `vite build`

- [ ] **T9.10** — Testes de integração ponta a ponta
  - Criar tema com datas → aparecer no calendário
  - Marcar dia concluído → progresso atualizar
  - Filtrar por tema → calendário refletir filtro
  - Dark mode → alternar e persistir

- [ ] **T9.11** — Criar README.md do projeto
  - Badges: React, TypeScript, Firebase, Tailwind
  - Screenshots de todas as páginas (light e dark)
  - Instruções de setup: clone, `.env`, `npm install`, `npm run dev`
  - Estrutura de diretórios simplificada
  - Link para MVP_PLAN.md e SPRINTS.md

- [ ] **T9.12** — Configurar `.env.example`
  - Firebase API key, authDomain, projectId, etc. (com placeholders)
  - Sem valores reais

---

## Sprint 10 — Deploy

**Objetivo:** Publicar o MVP no Firebase Hosting com CI/CD básico.

### Tasks

- [ ] **T10.1** — Instalar Firebase CLI e fazer login
  - `npm install -g firebase-tools`
  - `firebase login`
  - `firebase init hosting` (selecionar projeto existente)

- [ ] **T10.2** — Configurar `firebase.json` para Hosting
  - Pasta de deploy: `dist`
  - Rewrites para SPA: `"rewrites": [{"source": "**", "destination": "/index.html"}]`
  - Headers de cache para assets estáticos

- [ ] **T10.3** — Criar script de build + deploy
  - `package.json`: `"deploy": "vite build && firebase deploy --only hosting"`
  - Testar build localmente: `npm run build` + `npm run preview`

- [ ] **T10.4** — Verificar variáveis de ambiente no deploy
  - Firebase config via `.env.production`
  - Garantir que `.env` não seja commitado (já no `.gitignore`)

- [ ] **T10.5** — Deploy para produção
  - `npm run deploy`
  - Verificar URL gerada (ex: `best-of-me.web.app`)
  - Testar fluxo completo no ambiente de produção

- [ ] **T10.6** — Configurar domínio customizado (opcional)
  - Firebase Hosting → Add custom domain
  - Configurar DNS (registro A ou CNAME)
  - Provisionar certificado SSL automático

---

## 📊 Resumo de Progresso

| Sprint | Status | Tasks Concluídas |
|---|---|---|
| Sprint 1 — Setup | ⬜ Pendente | 0/8 |
| Sprint 2 — Auth | ⬜ Pendente | 0/7 |
| Sprint 3 — Core | ⬜ Pendente | 0/14 |
| Sprint 4 — Adapter Firebase | ⬜ Pendente | 0/8 |
| Sprint 5 — UI Básica | ⬜ Pendente | 0/12 |
| Sprint 6 — CRUD Temas | ⬜ Pendente | 0/11 |
| Sprint 7 — Calendário | ⬜ Pendente | 0/13 |
| Sprint 8 — Dark Mode | ⬜ Pendente | 0/9 |
| Sprint 9 — Polimento | ⬜ Pendente | 0/12 |
| Sprint 10 — Deploy | ⬜ Pendente | 0/6 |
| **TOTAL** | | **0/100** |

---

**Status:** 🟡 Aguardando início da Sprint 1