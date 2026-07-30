import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ShareTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, permission: 'edit' | 'view') => Promise<void>;
  loading: boolean;
  topicName: string;
}

export function ShareTopicModal({
  isOpen,
  onClose,
  onShare,
  loading,
  topicName,
}: ShareTopicModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'view'>('edit');
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('E-mail é obrigatório.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError('E-mail inválido.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    await onShare(email.trim(), permission);
    setEmail('');
    setPermission('edit');
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setEmailError(null);
      setPermission('edit');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Compartilhar "${topicName}"`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Convide outro usuário pelo e-mail do Google para visualizar ou editar este tema.
        </p>

        <Input
          label="E-mail do usuário"
          type="email"
          placeholder="exemplo@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          error={emailError ?? undefined}
          disabled={loading}
          autoFocus
        />

        {/* Permission selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Permissão
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPermission('edit')}
              disabled={loading}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                permission === 'edit'
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:border-brand-400 dark:bg-brand-900/30 dark:ring-brand-600'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-brand-600 dark:text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Editar</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pode marcar dias como concluídos
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPermission('view')}
              disabled={loading}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                permission === 'view'
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:border-brand-400 dark:bg-brand-900/30 dark:ring-brand-600'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Visualizar</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Apenas visualiza o progresso
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Convidar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
