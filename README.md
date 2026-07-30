# 🚀 Best of Me

<!-- Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-%2361DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-%233178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-10.12-%23FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-%2306B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-5.3-%23646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Sprints-183%2F187-%2346C93A" alt="Progress" />
</p>

<p align="center">
  <strong>Gerencie seus estudos e alcance seus objetivos</strong>
</p>

---

## 📋 Sobre

**Best of Me** é um MVP (Minimum Viable Product) para gerenciamento de estudos pessoais com Clean Architecture. O módulo de **Estudos** permite criar temas de estudo, agendar sessões em um calendário, marcar conclusão diária, revisar conteúdos com spaced repetition e acompanhar o progresso com métricas visuais.

Recursos principais:
- 🔐 Autenticação com Google (Firebase Auth)
- 📚 CRUD de temas de estudo com seleção de datas em calendário
- 📅 Calendário mensal unificado (estudos + revisões) com dots coloridos e indicadores
- 📊 Dashboard de progresso com filtros por tema e métricas
- 🔁 Módulo de Revisões com questionários de autoavaliação (good/easy/again) e spaced repetition
- 📈 Métricas de revisões: taxa de acerto, distribuição, calendário
- 👥 **Compartilhamento de Temas** — convide usuários por e-mail para visualizar/editar temas
- 🕐 Input de horas no formato HH:MM
- 🌗 **Dark Mode** com persistência híbrida (localStorage + Firestore)
- 🔄 Atualizações otimistas (toggle de conclusão)
- 📱 Responsivo (mobile-first com Tailwind)
- ♿ Acessibilidade com roles ARIA e navegação por teclado

---

## 🚀 Setup Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- Projeto no [Firebase Console](https://console.firebase.google.com/) (gratuito)

### 1. Clone o repositório

```bash
git clone https://github.com/lucasjunior24/best-of-me.git
cd best-of-me
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Firebase:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com os valores do Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

### 3. Instale as dependências e execute

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 📁 Estrutura de Diretórios

```
src/
├── adapters/
│   ├── firebase/                  # Implementações Firebase
│   │   ├── config.ts
│   │   ├── FirebaseAuthRepository.ts
│   │   ├── FirebaseStudyRepository.ts
│   │   ├── FirebaseReviewRepository.ts
│   │   └── FirebaseSharingRepository.ts   # 🆕 Sprint 22
│   └── toast/                     # Serviço de toasts (react-hot-toast)
│       └── HotToastService.ts
│
├── core/
│   ├── entities/                  # Entidades do domínio
│   │   ├── User.ts
│   │   ├── StudyTopic.ts
│   │   ├── StudySession.ts
│   │   ├── ProgressData.ts
│   │   ├── Review.ts
│   │   ├── ReviewQuestionnaire.ts
│   │   └── SharedTopic.ts         # Sprint 21
│   ├── ports/                     # Interfaces (contratos)
│   │   ├── IAuthRepository.ts
│   │   ├── IStudyRepository.ts
│   │   ├── IReviewRepository.ts
│   │   ├── ISharingRepository.ts  # Sprint 21
│   │   └── IToastService.ts
│   └── useCases/                  # Casos de uso (Clean Architecture)
│       ├── CreateStudyTopicUseCase.ts
│       ├── UpdateStudyTopicUseCase.ts
│       ├── DeleteStudyTopicUseCase.ts
│       ├── GetStudyTopicsUseCase.ts
│       ├── ScheduleStudyDaysUseCase.ts
│       ├── ToggleSessionCompletionUseCase.ts
│       ├── GetCalendarSessionsUseCase.ts
│       ├── GetStudyProgressUseCase.ts
│       ├── CreateReviewUseCase.ts
│       ├── UpdateReviewUseCase.ts
│       ├── DeleteReviewUseCase.ts
│       ├── CreateOrUpdateQuestionnaireUseCase.ts
│       ├── GetReviewCalendarUseCase.ts
│       ├── GetReviewStatsUseCase.ts
│       ├── ShareTopicUseCase.ts         # Sprint 21
│       ├── GetPendingInvitationsUseCase.ts  # Sprint 21
│       └── AcceptInvitationUseCase.ts       # Sprint 21
│
├── di/
│   └── container.ts               # Dependency Injection container
│
├── presentation/
│   ├── components/
│   │   ├── layout/                # AppLayout, ProtectedRoute
│   │   ├── review/                # Componentes de revisão
│   │   ├── study/                 # TopicFormModal, ConfirmDeleteModal,
│   │   │                          # ShareTopicModal 🆕 Sprint 22
│   │   └── ui/                    # Button, Input, Modal, Spinner, ColorPicker,
│   │                              # DatePicker, ProgressBar, ThemeToggle, TimeInput
│   ├── context/
│   │   ├── AuthContext.tsx         # Contexto de autenticação
│   │   └── ThemeContext.tsx        # Contexto de tema (Dark Mode)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   ├── useStudyTopics.ts
│   │   ├── useStudyProgress.ts
│   │   ├── useCalendarSessions.ts
│   │   ├── useReviews.ts
│   │   └── useSharing.ts          # 🆕 Sprint 22
│   └── pages/
│       ├── LoginPage.tsx
│       ├── HomePage.tsx
│       └── study/
│           ├── StudyOverviewPage.tsx
│           ├── StudyTopicsPage.tsx
│           └── StudyCalendarPage.tsx
│
├── shared/                        # Utilitários compartilhados
│   ├── errorHandler.ts
│   ├── dateUtils.ts
│   └── types.ts
│
└── test/                          # Testes
    ├── setup.ts
    ├── useCases.test.ts           # Testes unitários dos Use Cases (11)
    ├── components.test.tsx        # Testes de componentes UI (14)
    └── integration.test.ts        # Testes de integração (9)
```

---

## 🧪 Testes

```bash
# Executar todos os testes unitários e de integração
npm test

# Executar com watch mode (desenvolvimento)
npx vitest

# Executar com cobertura
npx vitest --coverage
```

**Suíte de testes:** 34 testes passando:
- ✅ 6 Use Cases (criação, edição, exclusão, toggle, progresso, calendário)
- ✅ 4 Componentes UI (Button, Spinner, ProgressBar, Modal)
- ✅ 4 Fluxos de integração (criar→calendário, marcar→progresso, filtrar, dark mode)

---

## 🔧 Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento (porta 3000) |
| `npm run build` | Compila TypeScript e gera build de produção |
| `npm run preview` | Preview local da build de produção |
| `npm test` | Executa testes com Vitest |
| `npm run lint` | Verifica código com ESLint |
| `npm run format` | Formata código com Prettier |

---

## 🏗️ Arquitetura

O projeto segue os princípios da **Clean Architecture**:

- **Core:** Entidades, portas (interfaces) e casos de uso — zero dependências externas
- **Adapters:** Implementações concretas (Firebase Auth, Firestore, react-hot-toast)
- **Presentation:** React components, contextos, hooks — conhece apenas o Core
- **DI:** Container de injeção de dependências que conecta tudo

**Stack tecnológica:**
- **React 18** com TypeScript strict
- **Vite** como bundler
- **Firebase** (Auth + Firestore) como backend serverless
- **Tailwind CSS** para estilização com Dark Mode via `class`
- **React Router v6** para navegação SPA
- **Vitest** + **React Testing Library** para testes
- **date-fns** para manipulação de datas
- **react-hot-toast** para notificações

---

## 📖 Documentação Complementar

- [.rulescline/SPRINTS.md](./.rulescline/SPRINTS.md) — Detalhamento de todas as 23 sprints com progresso
- [.rulescline/SPRINT_NEXT.md](./.rulescline/SPRINT_NEXT.md) — Detalhamento das Sprints 11-16 (calendário real + revisões)

---

## 📊 Status do Projeto

| Sprint | Status | Tasks |
|---|---|---|
| Sprint 1 — Setup | ✅ Concluída | 8/8 |
| Sprint 2 — Auth | ✅ Concluída | 7/7 |
| Sprint 3 — Core Regras de Negócio | ✅ Concluída | 14/14 |
| Sprint 4 — Adapter Firebase | ✅ Concluída | 8/8 |
| Sprint 5 — UI Básica + Componentes | ✅ Concluída | 12/12 |
| Sprint 6 — CRUD de Temas | ✅ Concluída | 11/11 |
| Sprint 7 — Calendário de Estudos | ✅ Concluída | 13/13 |
| Sprint 8 — Dark Mode | ✅ Concluída | 9/9 |
| Sprint 9 — Polimento e Testes | ✅ Concluída | 12/12 |
| Sprint 10 — Deploy | ✅ Concluída | 6/6 |
| Sprint 11 — Calendário Grid Completo | ✅ Concluída | 10/10 |
| Sprint 12 — Core Revisões | ✅ Concluída | 12/12 |
| Sprint 13 — Adapter Firebase Revisões | ✅ Concluída | 7/7 |
| Sprint 14 — UI Revisões + Calendário | ✅ Concluída | 14/14 |
| Sprint 15 — Métricas e Comparação | ✅ Concluída | 9/9 |
| Sprint 16 — Calendário Unificado | ✅ Concluída | 8/8 |
| Sprint 17 — Validação de Datas | ✅ Concluída | 3/3 |
| Sprint 18 — Horas/Progresso Cards | ✅ Concluída | 2/2 |
| Sprint 19 — Bug Modal Calendário | ✅ Concluída | 2/2 |
| Sprint 20 — Input HH:MM | ✅ Concluída | 4/4 |
| Sprint 21 — Core Compartilhamento | ✅ Concluída | 8/8 |
| **Sprint 22 — Firebase+UI Compartilhamento** | **✅ Concluída** | **10/10** |
| Sprint 23 — Comentários/Anotações | ⬜ Pendente | 0/5 |
| **TOTAL** | | **183/187** |

---

## 🆕 Sprint 22 — Firebase + UI: Compartilhamento de Temas

A implementação completa do compartilhamento de temas foi concluída:

### Firebase
- **`FirebaseSharingRepository`** — Collection top-level `sharedTopics` com todos os métodos do contrato `ISharingRepository`:
  - `shareTopic`, `getPendingInvitations`, `acceptInvitation`, `rejectInvitation`
  - `getSharedTopics` (busca tópicos aceitos na collection do owner)
  - `removeShare` (remove vínculo e atualiza `sharedWith[]` no tópico)
  - `findExistingShare`, `getSharesForTopic`, `getSharedTopicById`
- **`FirebaseStudyRepository` atualizado** — `topicFromDoc` agora lê campos `sharedWith`, `isShared`, `ownerUserId`
- **Container DI** — `sharingRepository` registrado como singleton; todos os use cases de sharing instantâneos

### UI
- **Hook `useSharing`** — Gerencia convites pendentes, compartilhamento, aceitação/recusa e remoção
- **`ShareTopicModal`** — Modal com input de e-mail + seletor de permissão (editar/visualizar)
- **Indicador visual** — Badge roxo "Compartilhado" 👥 nos cards de temas recebidos
- **Área de convites pendentes** — Seção destacada em azul com botões Aceitar/Recusar
- **Modal de gerenciamento** — Lista de compartilhamentos com opção de remover acesso

### Infraestrutura
- **`firestore.rules`** — Novas regras para collection `sharedTopics`: owner pode criar/atualizar/deletar, convidado pode ler e atualizar apenas `status`
- **`firestore.indexes.json`** — Índices compostos: `sharedWithUserId` + `status`, `topicId` + `sharedWithUserId`

---

## 📄 Licença

MIT