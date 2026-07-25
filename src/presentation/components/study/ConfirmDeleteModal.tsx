import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  topicName: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  topicName,
  loading = false,
}: ConfirmDeleteModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Tema"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            Excluir
          </Button>
        </>
      }
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          Tem certeza que deseja excluir o tema{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">"{topicName}"</span>?
        </p>
        <p className="text-xs text-red-500 dark:text-red-400">
          Todas as sessões agendadas para este tema serão removidas permanentemente.
        </p>
      </div>
    </Modal>
  );
}
