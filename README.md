# 🚀 Best of Me

<!-- Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-%2361DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-%233178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-10.12-%23FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-%2306B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-5.3-%23646CFF?logo=vite" alt="Vite" />
</p>

<p align="center">
  <strong>Gerencie seus estudos e alcance seus objetivos</strong>
</p>

---

## 📋 Sobre

**Best of Me** é um MVP (Minimum Viable Product) para gerenciamento de estudos pessoais. O módulo de **Estudos** permite criar temas de estudo, agendar sessões em um calendário, marcar conclusão diária e acompanhar o progresso com métricas visuais.

Recursos principais:
- 🔐 Autenticação com Google (Firebase Auth)
- 📚 CRUD de temas de estudo com seleção de datas em calendário
- 📅 Calendário mensal com dots coloridos e indicadores de conclusão
- 📊 Dashboard de progresso com filtros por tema e gráficos
- 🌗 **Dark Mode** com persistência híbrida (localStorage + Firestore)
- 🔄 Atualizações otimistas (toggle de conclusão)
- 📱 Responsivo (mobile-first com Tailwind)

---

## 🚀 Setup Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- Projeto no [Firebase Console](https://console.firebase.google.com/) (gratuito)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/best-of-me.git
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
│   ├── firebase/              # Implementações Firebase (Auth + Firestore)
│   │   ├── config.ts
│   │   ├── FirebaseAuthRepository.ts
│   │   └── FirebaseStudyRepository.ts
│   └── toast/                 # Serviço de toasts (react-hot-toast)
│       └── HotToastService.ts
│
├── core/
│   ├── entities/              # Entidades do domínio
│   │   ├── StudyTopic.ts
│   │   ├── StudySession.ts
│   │   ├── ProgressData.ts
│   │   └── User.ts
│   ├── ports/                 # Interfaces (contratos)
│   │   ├── IAuthRepository.ts
│   │   ├── IStudyRepository.ts
│   │   └── IToastService.ts
│   └── useCases/              # Casos de uso (Clean Architecture)
│       ├── CreateStudyTopicUseCase.ts
│       ├── UpdateStudyTopicUseCase.ts
│       ├── DeleteStudyTopicUseCase.ts
│       ├── GetStudyTopicsUseCase.ts
│       ├── ScheduleStudyDaysUseCase.ts
│       ├── ToggleSessionCompletionUseCase.ts
│       ├── GetCalendarSessionsUseCase.ts
│       └── GetStudyProgressUseCase.ts
│
├── di/
│   └── container.ts           # Dependency Injection container
│
├── presentation/
│   ├── components/
│   │   ├── layout/            # AppLayout, ProtectedRoute
│   │   ├── study/             # TopicFormModal, ConfirmDeleteModal
│   │   └── ui/                # Button, Input, Modal, Spinner, ColorPicker,
│   │                          # DatePicker, ProgressBar, ThemeToggle
│   ├── context/
│   │   ├── AuthContext.tsx     # Contexto de autenticação
│   │   └── ThemeContext.tsx    # Contexto de tema (Dark Mode)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   ├── useStudyTopics.ts
│   │   ├── useStudyProgress.ts
│   │   └── useCalendarSessions.ts
│   └── pages/
│       ├── LoginPage.tsx        # Página de login
│       ├── HomePage.tsx         # Home com cards de módulos
│       └── study/
│           ├── StudyOverviewPage.tsx   # Dashboard de progresso
│           ├── StudyTopicsPage.tsx     # CRUD de temas
│           └── StudyCalendarPage.tsx   # Calendário mensal
│
├── shared/                    # Utilitários compartilhados
│   ├── errorHandler.ts
│   ├── dateUtils.ts
│   └── types.ts
│
└── test/                      # Testes
    ├── setup.ts
    ├── useCases.test.ts       # Testes unitários dos Use Cases
    ├── components.test.tsx    # Testes de componentes UI
    └── integration.test.ts    # Testes de integração
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

**Suíte de testes:** 25 testes cobrindo:
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

- [MVP_PLAN.md](./MVP_PLAN.md) — Plano completo do MVP
- [SPRINTS.md](./.rulescline/SPRINTS.md) — Detalhamento de todas as sprints (com progresso)

---

## 📊 Status do Projeto

| Sprint | Status |
|---|---|
| Sprint 1 — Setup | ✅ Concluída |
| Sprint 2 — Auth | ✅ Concluída |
| Sprint 3 — Core | ✅ Concluída |
| Sprint 4 — Adapter Firebase | ✅ Concluída |
| Sprint 5 — UI Básica | ✅ Concluída |
| Sprint 6 — CRUD Temas | ✅ Concluída |
| Sprint 7 — Calendário | ✅ Concluída |
| Sprint 8 — Dark Mode | ✅ Concluída |
| Sprint 9 — Polimento e Testes | ✅ Concluída |
| Sprint 10 — Deploy | ⬜ Pendente |

---

## 📄 Licença

MIT