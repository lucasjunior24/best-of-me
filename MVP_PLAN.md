# 🎯 Plano de MVP — Best of Me (Módulo Estudos)

---

## 📋 Índice

1. [Visão Geral do MVP](#1-visão-geral-do-mvp)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Camada Core — Entidades e Interfaces](#4-camada-core--entidades-e-interfaces)
5. [Casos de Uso — Fluxo de Dados](#5-casos-de-uso--fluxo-de-dados)
6. [Camada de Adaptadores — Firebase](#6-camada-de-adaptadores--firebase)
7. [Injeção de Dependência](#7-injeção-de-dependência)
8. [Camada de Apresentação — Páginas e Componentes](#8-camada-de-apresentação--páginas-e-componentes)
9. [Autenticação e Autorização](#9-autenticação-e-autorização)
10. [Rotas e Navegação](#10-rotas-e-navegação)
11. [Fluxo de Dados Completo](#11-fluxo-de-dados-completo)
12. [Estrutura do Firestore](#12-estrutura-do-firestore)
13. [Firebase Security Rules](#13-firebase-security-rules)
14. [Tratamento de Erros](#14-tratamento-de-erros)
15. [Testes](#15-testes)
16. [Cronograma de Implementação](#16-cronograma-de-implementação)
17. [Resumo Visual das Funcionalidades](#17-resumo-visual-das-funcionalidades)

---

## 1. Visão Geral do MVP

O MVP será focado exclusivamente no **módulo de Estudos**. A aplicação permitirá que o usuário autenticado:

- Faça login com Google (Firebase Auth)
- Cadastre temas de estudo com cores personalizadas
- Selecione dias específicos em um calendário para estudar cada tema
- Visualize seu cronograma de estudos em formato de agenda/calendário
- Marque dias de estudo como concluídos
- Acompanhe o progresso com métricas e porcentagens
- Filtre a visualização por temas específicos
- Alterne entre tema claro e escuro (Dark Mode)

### Princípios Arquiteturais

| Princípio | Descrição |
|---|---|
| **Separação de Responsabilidades** | Core (regras de negócio) ≠ Adapters (libs) ≠ Presentation (UI) |
| **Strong Typing** | TypeScript strict mode, proibido `any`, uso de `unknown` com type guards |
| **Dependency Inversion** | Core define interfaces (ports), adapters implementam |
| **Composição sobre Herança** | Componentes pequenos compostos, não hierarquias profundas |
| **DRY** | Máximo reaproveitamento de componentes e lógica |
| **Separação Lógica × Estilo** | Lógica no componente, classes Tailwind em arquivo separado |

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **React** | 18+ | Biblioteca de UI |
| **TypeScript** | 5+ | Tipagem estática (strict mode) |
| **Vite** | 5+ | Bundler e dev server |
| **Firebase** | 10+ | Auth (Google) + Firestore |
| **Tailwind CSS** | 3+ | Estilização utilitária |
| **React Router** | 6+ | Roteamento SPA |
| **uuid** | 9+ | Geração de IDs únicos |
| **React Hot Toast** | 3+ | Notificações (sucesso/erro) |
| **date-fns** | 3+ | Manipulação de datas |

---

## 3. Estrutura de Diretórios

```
src/
├── core/                          # Regras de negócio (framework-agnóstico)
│   ├── entities/                  # Entidades do domínio
│   │   ├── StudyTopic.ts          # Tema de estudo (id, name, color, totalDays, hoursPerDay)
│   │   ├── StudySession.ts        # Sessão de estudo em um dia (id, topicId, date, completed, duration)
│   │   └── User.ts                # Usuário autenticado (id, email, displayName, photoURL)
│   ├── ports/                     # Interfaces (contratos) para adapters
│   │   ├── IAuthRepository.ts     # Contrato de autenticação
│   │   ├── IStudyRepository.ts    # Contrato de persistência de estudos
│   │   └── IToastService.ts       # Contrato de notificações
│   └── usecases/                  # Casos de uso
│       ├── auth/
│       │   ├── SignInWithGoogleUseCase.ts
│       │   ├── SignOutUseCase.ts
│       │   └── GetCurrentUserUseCase.ts
│       └── study/
│           ├── CreateStudyTopicUseCase.ts
│           ├── UpdateStudyTopicUseCase.ts
│           ├── DeleteStudyTopicUseCase.ts
│           ├── GetStudyTopicsUseCase.ts
│           ├── ScheduleStudyDaysUseCase.ts
│           ├── GetCalendarSessionsUseCase.ts
│           ├── ToggleSessionCompletionUseCase.ts
│           └── GetStudyProgressUseCase.ts
│
├── adapters/                      # Implementações concretas dos ports
│   ├── firebase/
│   │   ├── config.ts              # Inicialização do Firebase
│   │   ├── FirebaseAuthRepository.ts   # Implementa IAuthRepository
│   │   └── FirebaseStudyRepository.ts  # Implementa IStudyRepository
│   └── toast/
│       └── HotToastService.ts     # Implementa IToastService
│
├── di/                            # Injeção de Dependência
│   ├── container.ts               # Container DI (padrão Service Locator)
│   └── modules/
│       ├── authModule.ts
│       └── studyModule.ts
│
├── presentation/                  # Camada de UI (React)
│   ├── components/                # Componentes reutilizáveis
│   │   ├── ui/                    # Componentes atômicos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx      # Layout principal com sidebar/header
│   │       └── ProtectedRoute.tsx # Guard de autenticação
│   ├── pages/                     # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   └── study/
│   │       ├── StudyOverviewPage.tsx     # Dashboard de progresso
│   │       ├── StudyTopicsPage.tsx       # CRUD de temas
│   │       ├── StudyCalendarPage.tsx     # Visão calendário/agenda
│   │       └── StudyDayDetailModal.tsx   # Modal de detalhes do dia
│   ├── hooks/                     # Hooks customizados
│   │   ├── useAuth.ts
│   │   ├── useStudyTopics.ts
│   │   ├── useCalendarSessions.ts
│   │   └── useStudyProgress.ts
│   ├── context/
│   │   └── AuthContext.tsx         # Contexto de autenticação
│   └── styles/
│       └── (arquivos .css com @apply Tailwind quando necessário)
│
├── shared/                        # Utilitários compartilhados
│   ├── types.ts                   # Tipos globais
│   ├── dateUtils.ts               # Helpers de data
│   └── errorHandler.ts            # Tratamento padronizado de erros
│
├── App.tsx                        # Root component + Router
├── main.tsx                       # Entry point
└── index.css                      # Tailwind directives
```

---

## 4. Camada Core — Entidades e Interfaces

### 4.1 Entidade: `StudyTopic`

```ts
interface StudyTopic {
  id: string;
  userId: string;
  name: string;           // "React", "TypeScript", etc.
  color: string;           // "#FF5733"
  totalDays: number;       // Total de dias planejados
  hoursPerDay: number;     // Horas por dia sugeridas
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Entidade: `StudySession`

```ts
interface StudySession {
  id: string;
  userId: string;
  topicId: string;
  date: string;            // "2026-07-24" (YYYY-MM-DD)
  completed: boolean;
  completedAt?: Date;
  duration?: number;       // Horas reais estudadas
  createdAt: Date;
}
```

### 4.3 Entidade: `User`

```ts
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
```

### 4.4 Tipos de Progresso

```ts
interface ProgressData {
  totalPlannedSessions: number;
  totalCompletedSessions: number;
  completionPercentage: number;
  byTopic: TopicProgress[];
}

interface TopicProgress {
  topicId: string;
  topicName: string;
  topicColor: string;
  totalSessions: number;
  completedSessions: number;
  percentage: number;
}
```

### 4.5 Port: `IAuthRepository`

```ts
interface IAuthRepository {
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
```

### 4.6 Port: `IStudyRepository`

```ts
interface IStudyRepository {
  // Topics CRUD
  createTopic(topic: Omit<StudyTopic, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyTopic>;
  updateTopic(id: string, data: Partial<StudyTopic>): Promise<StudyTopic>;
  deleteTopic(id: string): Promise<void>;
  getTopicsByUser(userId: string): Promise<StudyTopic[]>;

  // Sessions
  scheduleSessions(sessions: Omit<StudySession, 'id' | 'createdAt' | 'completed' | 'completedAt'>[]): Promise<StudySession[]>;
  getSessionsByDateRange(userId: string, startDate: string, endDate: string, topicIds?: string[]): Promise<StudySession[]>;
  toggleSessionCompletion(sessionId: string, userId: string): Promise<StudySession>;

  // Progress
  getProgress(userId: string, topicIds?: string[]): Promise<ProgressData>;
}
```

### 4.7 Port: `IToastService`

```ts
interface IToastService {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}
```

---

## 5. Casos de Uso — Fluxo de Dados

### 5.1 Autenticação

| Use Case | Entrada | Saída | Descrição |
|---|---|---|---|
| **SignInWithGoogleUseCase** | — | `User` | Aciona popup do Google, autentica, retorna usuário |
| **SignOutUseCase** | — | `void` | Desloga o usuário atual |
| **GetCurrentUserUseCase** | — | `User \| null` | Retorna usuário logado ou null |

### 5.2 Estudos

| Use Case | Entrada | Saída | Fluxo |
|---|---|---|---|
| **CreateStudyTopicUseCase** | `{ name, color, totalDays, hoursPerDay, scheduledDates[] }` | `StudyTopic + StudySession[]` | 1. Valida dados; 2. Cria StudyTopic via repository; 3. Para cada data em scheduledDates, cria uma StudySession; 4. Retorna resultados |
| **UpdateStudyTopicUseCase** | `{ topicId, data }` | `StudyTopic` | 1. Busca tópico; 2. Atualiza campos; 3. Salva |
| **DeleteStudyTopicUseCase** | `{ topicId }` | `void` | 1. Deleta o tópico; 2. Deleta todas as sessions associadas |
| **GetStudyTopicsUseCase** | `{ userId }` | `StudyTopic[]` | Retorna todos os temas do usuário |
| **ScheduleStudyDaysUseCase** | `{ topicId, dates[] }` | `StudySession[]` | 1. Busca o StudyTopic; 2. Cria StudySessions para as datas (evita duplicatas); 3. Retorna sessions criadas |
| **GetCalendarSessionsUseCase** | `{ userId, startDate, endDate, topicIds? }` | `CalendarDay[]` | 1. Busca sessions e topics; 2. Faz merge para enriquecer sessions com info do topic (nome, cor); 3. Agrupa por data |
| **ToggleSessionCompletionUseCase** | `{ sessionId, userId }` | `StudySession` | 1. Busca session; 2. Inverte `completed`; 3. Salva; 4. Retorna atualizada |
| **GetStudyProgressUseCase** | `{ userId, topicIds? }` | `ProgressData` | 1. Busca todas sessions (filtradas por topics); 2. Calcula totais e percentuais; 3. Agrupa por topic |

---

## 6. Camada de Adaptadores — Firebase

### 6.1 `FirebaseAuthRepository`

- Implementa `IAuthRepository`
- Usa `signInWithPopup(auth, googleProvider)` para login
- Usa `onAuthStateChanged` para observar mudanças de estado
- Converte `FirebaseUser` → `User` (entidade do domínio)

### 6.2 `FirebaseStudyRepository`

- Implementa `IStudyRepository`
- Firestore paths:
  - Temas: `users/{userId}/topics/{topicId}`
  - Sessões: `users/{userId}/sessions/{sessionId}`

**Índices compostos necessários:**
- `sessions`: `userId` ASC + `date` ASC (para queries de calendário)
- `sessions`: `userId` ASC + `topicId` ASC + `date` ASC (para filtros por tema)

---

## 7. Injeção de Dependência

Container central (`di/container.ts`) usando padrão Service Locator simples:

```ts
// di/container.ts
import { FirebaseAuthRepository } from '../adapters/firebase/FirebaseAuthRepository';
import { FirebaseStudyRepository } from '../adapters/firebase/FirebaseStudyRepository';
import { HotToastService } from '../adapters/toast/HotToastService';
import { SignInWithGoogleUseCase } from '../core/usecases/auth/SignInWithGoogleUseCase';
import { CreateStudyTopicUseCase } from '../core/usecases/study/CreateStudyTopicUseCase';
// ... demais imports

const container = {
  // Repositories (implementações concretas)
  authRepository: new FirebaseAuthRepository(),
  studyRepository: new FirebaseStudyRepository(),
  toastService: new HotToastService(),
};

// Factories de Use Cases
export const useCases = {
  auth: {
    signInWithGoogle: () => new SignInWithGoogleUseCase(container.authRepository),
    signOut: () => new SignOutUseCase(container.authRepository),
    getCurrentUser: () => new GetCurrentUserUseCase(container.authRepository),
  },
  study: {
    createTopic: () => new CreateStudyTopicUseCase(container.studyRepository),
    updateTopic: () => new UpdateStudyTopicUseCase(container.studyRepository),
    deleteTopic: () => new DeleteStudyTopicUseCase(container.studyRepository),
    getTopics: () => new GetStudyTopicsUseCase(container.studyRepository),
    scheduleDays: () => new ScheduleStudyDaysUseCase(container.studyRepository),
    getCalendarSessions: () => new GetCalendarSessionsUseCase(container.studyRepository),
    toggleCompletion: () => new ToggleSessionCompletionUseCase(container.studyRepository),
    getProgress: () => new GetStudyProgressUseCase(container.studyRepository),
  },
};

export { container };
```

Isso permite trocar Firebase por outra tecnologia sem alterar o core.

---

## 8. Camada de Apresentação — Páginas e Componentes

### 8.1 Tela de Login (`LoginPage`)

- Logo/app name centralizado: "Best of Me"
- Subtítulo: "Gerencie seus estudos e alcance seus objetivos"
- Botão "Entrar com Google" estilizado com ícone do Google
- Estados: idle, loading, error
- Redireciona para `/` após login bem-sucedido

### 8.2 Home (`HomePage`)

- Header com saudação: "Olá, {displayName}!" e avatar do Google
- Botão de logout
- Cards de navegação:
  - Card "📚 Estudos" → navega para `/study`
  - Card "🏋️ Academia" → desabilitado com badge "Em breve"

### 8.3 Dashboard de Estudos (`StudyOverviewPage`)

- **Indicadores gerais (cards numéricos):**
  - Total de sessões planejadas
  - Total concluídas
  - Barra de progresso circular (% geral de conclusão)
- **Filtro por temas** (chips multi-select coloridos)
- **Lista de progresso por tema:**
  - Card para cada tema com:
    - Nome do tema + indicador de cor
    - "X/Y dias concluídos"
    - Barra de progresso horizontal
    - % de conclusão
- **Navegação:**
  - Botão "Gerenciar Temas" → `/study/topics`
  - Botão "Ver Calendário" → `/study/calendar`
  - FAB (botão flutuante) "+" → criar novo tema rápido

### 8.4 CRUD de Temas (`StudyTopicsPage`)

- **Lista de temas** cadastrados:
  - Cards com: cor, nome do tema, total dias, horas/dia
  - Ações: Editar (ícone lápis), Excluir (ícone lixeira com confirmação)
- **Modal/Form de criação/edição:**
  - Campo: Nome do tema (text input)
  - ColorPicker: 12 cores predefinidas + opção de cor customizada
  - Campo: Total de dias (number input)
  - Campo: Horas por dia sugeridas (number input, step 0.5)
  - **Calendário inline para selecionar os dias de estudo:**
    - Calendário mensal com navegação
    - Suporte a seleção múltipla de dias (clique individual)
    - Dias selecionados destacados com a cor do tema
    - Preview: "X dias selecionados"
  - Botões: Salvar / Cancelar
- **Estados:**
  - Empty: Ilustração + "Nenhum tema cadastrado" + botão "Criar primeiro tema"
  - Loading: Skeleton cards
  - Error: Mensagem com botão "Tentar novamente"

### 8.5 Calendário de Estudos (`StudyCalendarPage`)

- **Calendário mensal** (navegação: setas mês anterior/próximo, label "Julho 2026")
- **Cada dia exibe indicadores (dots) coloridos:**
  - Pequenos círculos com as cores dos temas agendados para aquele dia
  - Se todas as sessions do dia estão completed → indicador verde ou badge "✓"
  - Se parcialmente completo → indicador amarelo/laranja
  - Se nenhuma concluída → mantém as cores dos temas
- **Filtro por temas** no topo (chips multi-select):
  - Chip "Todos" (default, selecionado)
  - Um chip por tema com a cor correspondente
  - Ao selecionar um ou mais temas, o calendário filtra para mostrar apenas sessions daqueles temas
- **Clique em um dia** → Abre `StudyDayDetailModal`:
  - Header: data formatada (ex: "Quinta-feira, 24 de Julho de 2026")
  - Lista de temas agendados para aquele dia
  - Cada item exibe:
    - Bolinha com cor do tema
    - Nome do tema
    - Horário/horas sugeridas
    - Toggle/checkbox "Concluído"
    - Se concluído: horário em que foi marcado
  - Ao marcar/desmarcar conclusão, atualiza Firestore e calendário reativamente
- **Estados:**
  - Loading: Skeleton do calendário
  - Empty (sem temas cadastrados): Link para criar temas
  - Empty (mês sem sessões): "Nenhum estudo agendado para este mês"

---

## 9. Autenticação e Autorização

- **Firebase Auth** com provider Google (popup)
- `AuthContext` provê:
  - `user: User | null`
  - `loading: boolean`
  - `signIn(): Promise<void>`
  - `signOut(): Promise<void>`
- `ProtectedRoute`:
  - Se `loading`: mostra Spinner fullscreen
  - Se `!user`: redireciona para `/login`
  - Se `user`: renderiza children (Outlet do React Router)
- Todo acesso ao Firestore é filtrado por `userId` do usuário autenticado
- No logout, limpa estado local e redireciona para `/login`

---

## 10. Rotas e Navegação

| Rota | Página | Protegida | Descrição |
|---|---|---|---|
| `/login` | LoginPage | ❌ | Login com Google |
| `/` | HomePage | ✅ | Home com cards de módulos |
| `/study` | StudyOverviewPage | ✅ | Dashboard de progresso |
| `/study/topics` | StudyTopicsPage | ✅ | CRUD de temas |
| `/study/calendar` | StudyCalendarPage | ✅ | Calendário/agenda de estudos |

**Estrutura de rotas no React Router:**

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/study" element={<StudyOverviewPage />} />
      <Route path="/study/topics" element={<StudyTopicsPage />} />
      <Route path="/study/calendar" element={<StudyCalendarPage />} />
    </Route>
  </Route>
</Routes>
```

**Navegação:**
- `AppLayout`: Header com breadcrumb + botão voltar + avatar/logout
- Mobile-first: navegação por tabs inferiores ou header com menu

---

## 11. Fluxo de Dados Completo

### Exemplo 1: Criar Tema + Agendar Dias

```
[StudyTopicsPage]
    │
    ├─ Usuário preenche form (nome, cor, totalDias, horasDia)
    ├─ Usuário seleciona dias no calendário inline
    ├─ Clica em "Salvar"
    │
    ▼
[useStudyTopics hook]
    │
    ├─ Chama createStudyTopicUseCase.execute({
    │     name, color, totalDays, hoursPerDay, scheduledDates
    │   })
    │
    ▼
[CreateStudyTopicUseCase]
    │
    ├─ 1. Valida dados (nome obrigatório, ao menos 1 data, etc.)
    ├─ 2. studyRepository.createTopic(...) 
    │     → Firestore: users/{uid}/topics/{id}
    ├─ 3. Para cada data em scheduledDates:
    │     studyRepository.scheduleSessions(...) 
    │     → Firestore: users/{uid}/sessions/{id}
    │
    ▼
[FirebaseStudyRepository]
    │
    ├─ addDoc(topic) + batch writes para sessions
    │
    ▼
[Retorna StudyTopic + StudySession[]]
    │
    ├─ Hook atualiza estado local (lista de temas)
    ├─ toastService.success("Tema criado com sucesso!")
    └─ Navega para /study (overview) ou fecha modal
```

### Exemplo 2: Marcar Dia como Concluído

```
[StudyCalendarPage]
    │
    ├─ Usuário clica em um dia no calendário
    ├─ Modal abre com lista de temas do dia
    ├─ Usuário marca checkbox "Concluído" em um tema
    │
    ▼
[useCalendarSessions hook]
    │
    ├─ Chama toggleSessionCompletionUseCase.execute({ sessionId, userId })
    │
    ▼
[ToggleSessionCompletionUseCase]
    │
    ├─ 1. Busca session por ID
    ├─ 2. Inverte completed: true ↔ false
    ├─ 3. Se marcando como concluído: completedAt = new Date()
    ├─ 4. Se desmarcando: completedAt = null
    ├─ 5. studyRepository.toggleSessionCompletion(...)
    │     → Firestore: updateDoc session
    │
    ▼
[FirebaseStudyRepository]
    │
    ├─ updateDoc(sessionRef, { completed, completedAt })
    │
    ▼
[Retorna StudySession atualizada]
    │
    ├─ Hook atualiza estado local do calendário
    ├─ Recalcula dots/indicadores do dia
    ├─ toastService.success("Dia marcado como concluído! 🎉")
    └─ Se todas sessions do dia concluídas → indicador especial no calendário
```

---

## 12. Estrutura do Firestore

### Collection: `users/{uid}/topics/{topicId}`

```json
{
  "id": "uuid-gerado-pelo-app",
  "userId": "uid-do-firebase-auth",
  "name": "React",
  "color": "#61DAFB",
  "totalDays": 10,
  "hoursPerDay": 2,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Collection: `users/{uid}/sessions/{sessionId}`

```json
{
  "id": "uuid-gerado-pelo-app",
  "userId": "uid-do-firebase-auth",
  "topicId": "topic-uuid-reference",
  "date": "2026-07-24",
  "completed": false,
  "completedAt": null,
  "duration": null,
  "createdAt": "timestamp"
}
```

### Regras de acesso:

- Cada usuário só acessa seus próprios documentos (`userId === auth.uid`)
- Subcoleções organizadas por `userId` para facilitar queries e security rules

---

## 13. Firebase Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuário só acessa seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /topics/{topicId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 14. Tratamento de Erros

### 14.1 Camada Core

Use cases lançam erros tipados:

```ts
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### 14.2 Camada Adapters

Capturam erros do Firebase e convertem para erros do domínio:

```ts
// Exemplo em FirebaseStudyRepository
async createTopic(data) {
  try {
    const docRef = await addDoc(...);
    return { id: docRef.id, ...data };
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new DomainError(mapFirebaseError(error));
    }
    throw error;
  }
}
```

### 14.3 Camada Presentation

Hooks capturam erros e exibem feedback:

```ts
function useStudyTopics() {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTopicsUseCase.execute(userId);
      setTopics(data);
    } catch (err) {
      const message = handleError(err); // shared/errorHandler.ts
      setError(message);
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  };

  return { topics, loading, error, loadTopics, ... };
}
```

### 14.4 `shared/errorHandler.ts`

```ts
export function handleError(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof Error) {
    // Em produção, não expor detalhes internos
    if (import.meta.env.DEV) {
      console.error(error);
      return error.message;
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
  return 'Ocorreu um erro desconhecido.';
}
```

---

## 15. Testes

### 15.1 Testes Unitários (Core)

| O que testar | Ferramenta |
|---|---|
| `CreateStudyTopicUseCase` | Vitest |
| `ToggleSessionCompletionUseCase` | Vitest |
| `GetStudyProgressUseCase` (cálculo de %) | Vitest |
| `GetCalendarSessionsUseCase` (agrupamento por data) | Vitest |

**Estratégia:** Mockar `IStudyRepository` e `IAuthRepository`. Testar apenas a lógica de negócio.

### 15.2 Testes de Componente (Presentation)

| O que testar | Ferramenta |
|---|---|
| `LoginPage`: renderiza botão Google, chama signIn no clique | Vitest + RTL |
| `StudyTopicsPage`: abre modal, preenche form, submete | Vitest + RTL |
| `StudyCalendarPage`: renderiza dias do mês, dots coloridos | Vitest + RTL |
| `ProgressBar`: renderiza % correto | Vitest + RTL |

### 15.3 Testes de Integração

| O que testar | Ferramenta |
|---|---|
| Fluxo completo: criar tema com datas → ver no calendário → marcar concluído → ver progresso atualizado | Vitest + Firebase Emulator |

---

## 16. Cronograma de Implementação

| Fase | Descrição | Entregáveis |
|---|---|---|
| **Fase 1 — Setup** | Inicializar projeto Vite + React + TS + Tailwind + Firebase + Router | Projeto rodando, estrutura de diretórios criada, Tailwind funcionando |
| **Fase 2 — Auth** | Firebase Auth, `IAuthRepository`, `FirebaseAuthRepository`, `AuthContext`, `ProtectedRoute`, `LoginPage` | Login com Google funcional, proteção de rotas |
| **Fase 3 — Core Estudos** | Entidades, ports, use cases de estudo, testes unitários | Todos os use cases implementados e testados |
| **Fase 4 — Adapter Firebase** | `FirebaseStudyRepository`, índices, security rules | CRUD de temas e sessions persistindo no Firestore |
| **Fase 5 — UI Básica** | `HomePage`, `StudyOverviewPage`, componentes `ui/` | Dashboard de progresso funcional |
| **Fase 6 — CRUD Temas** | `StudyTopicsPage`, formulário, calendário de seleção, `useStudyTopics` | Criar, editar e excluir temas com seleção de datas |
| **Fase 7 — Calendário** | `StudyCalendarPage`, dots coloridos, filtro, `StudyDayDetailModal` | Calendário interativo com toggle de conclusão |
| **Fase 8 — Polimento** | Estados loading/empty/error, toasts, responsividade, testes de componente | App completo e testado |
| **Fase 9 — Deploy** | Firebase Hosting, build de produção | App online e acessível |

---

## 17. Resumo Visual das Funcionalidades

```
[Login Google] 
     │
     ▼
  [Home]
     │
     ├── 📚 Estudos (MVP) ────────┐
     │                              │
     │   ┌──────────────────────────┤
     │   │                          │
     │   ▼                          ▼
     │ [Dashboard]             [Temas]
     │ - Progresso %           - Listar temas
     │ - Por tema              - Criar/Editar/Excluir
     │ - Filtros               - Selecionar dias
     │                          - ColorPicker
     │                              │
     │                              ▼
     │                         [Calendário]
     │                          - Visão mensal
     │                          - Dots coloridos
     │                          - Filtrar por tema
     │                          - Clicar dia → modal
     │                          - Marcar concluído
     │
     └── 🏋️ Academia (Em breve)
```

---

## 18. Dark Mode (Tema Claro/Escuro)

### 18.1 Estratégia de Implementação

O Dark Mode será implementado nativamente com **Tailwind CSS** usando a variante `dark:`, que é controlada pela classe `dark` no elemento `<html>`. A preferência do usuário será persistida no **Firestore** e aplicada instantaneamente via `classList.toggle`.

### 18.2 Fluxo de Funcionamento

```
[Toggle no Header/AppLayout]
    │
    ├─ Usuário clica no ícone ☀️/🌙
    │
    ▼
[useDarkMode hook]
    │
    ├─ 1. Inverte estado atual (light ↔ dark)
    ├─ 2. document.documentElement.classList.toggle('dark')
    ├─ 3. Salva preferência no Firestore: users/{uid}/preferences { theme: 'light' | 'dark' }
    ├─ 4. Atualiza estado global (Context ou hook local)
    │
    ▼
[Tailwind CSS]
    │
    ├─ Classes com prefixo dark: são aplicadas automaticamente
    ├─ Ex: className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    │
    ▼
[Todos os componentes herdam o tema automaticamente]
```

### 18.3 Configuração do Tailwind

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // Controlado via classe 'dark' no <html>
  // ...
}
```

### 18.4 Estrutura de Arquivos do Tema

```
src/
├── presentation/
│   ├── context/
│   │   └── ThemeContext.tsx        # Contexto de tema (light/dark)
│   └── hooks/
│       └── useTheme.ts            # Hook useTheme() → { theme, toggleTheme }
└── tailwind.config.js             # darkMode: 'class'
```

### 18.5 Paleta de Cores por Tema

| Elemento | Light Mode | Dark Mode |
|---|---|---|
| Background principal | `bg-gray-50` | `bg-gray-950` |
| Cards / Superfície | `bg-white` | `bg-gray-900` |
| Texto primário | `text-gray-900` | `text-gray-100` |
| Texto secundário | `text-gray-600` | `text-gray-400` |
| Borda | `border-gray-200` | `border-gray-800` |
| Input background | `bg-white` | `bg-gray-800` |
| Skeleton loading | `bg-gray-200` | `bg-gray-700` |

### 18.6 Componente ThemeToggle

```tsx
// presentation/components/ui/ThemeToggle.tsx
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

### 18.7 Carregamento Inicial da Preferência

1. Ao iniciar o app, verificar se há preferência salva no Firestore (`users/{uid}/preferences`)
2. Caso não exista, usar `prefers-color-scheme` do sistema como fallback:
   ```ts
   const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
   ```
3. Aplicar classe `dark` no `<html>` antes da primeira renderização para evitar flash (script inline no `index.html`)
4. Salvar no Firestore na primeira escolha do usuário

### 18.8 Script Anti-Flash (index.html)

```html
<!-- Evita flash de tema errado antes do React carregar -->
<script>
  (function() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### 18.9 Persistência Híbrida

- **localStorage**: Armazena cache local do tema para acesso síncrono (evita flash)
- **Firestore**: Armazena preferência no perfil do usuário (`users/{uid}/preferences`) para persistir entre dispositivos
- Ao carregar o app: localStorage é a fonte primária (imediata), Firestore é carregado em paralelo e sincroniza se houver divergência

---

## 📝 Notas Adicionais

### Funcionalidades pensadas para o futuro (pós-MVP):

- **Módulo Academia**: Similar ao de estudos, com exercícios, séries, repetições
- **Artigos em Markdown**: Usando React Markdown para renderizar conteúdos de estudo
- **Notificações**: Lembretes para dias de estudo agendados
- **Offline Mode**: Suporte a PWA com cache de dados
- **Gamificação**: Streaks de dias consecutivos, badges, XP
- **Exportação de dados**: CSV/PDF do progresso
- **Integração com Google Calendar**: Sincronizar sessões de estudo

---

**Status:** 🟡 Aguardando aprovação para iniciar implementação