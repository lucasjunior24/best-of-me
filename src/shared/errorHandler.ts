export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleError(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof AuthError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (import.meta.env.DEV) {
      console.error(error);
      return error.message;
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
  return 'Ocorreu um erro desconhecido.';
}
