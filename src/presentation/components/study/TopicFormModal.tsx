import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';
import { DatePicker } from '../ui/DatePicker';
import type {
  StudyTopic,
  CreateStudyTopicInput,
  UpdateStudyTopicInput,
} from '../../../core/entities/StudyTopic';

interface TopicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStudyTopicInput) => Promise<StudyTopic | null>;
  onUpdate: (topicId: string, input: UpdateStudyTopicInput) => Promise<StudyTopic | null>;
  editingTopic?: StudyTopic | null;
  editingDates?: string[];
}

interface FormErrors {
  name?: string;
  color?: string;
  totalDays?: string;
  hoursPerDay?: string;
  scheduledDates?: string;
}

export function TopicFormModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingTopic = null,
  editingDates = [],
}: TopicFormModalProps) {
  const isEditing = !!editingTopic;

  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [totalDays, setTotalDays] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingTopic) {
        setName(editingTopic.name);
        setColor(editingTopic.color);
        setTotalDays(editingTopic.totalDays);
        setHoursPerDay(editingTopic.hoursPerDay);
        setScheduledDates(editingDates);
      } else {
        setName('');
        setColor('#3b82f6');
        setTotalDays(5);
        setHoursPerDay(1);
        setScheduledDates([]);
      }
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen, editingTopic, editingDates]);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};

    if (!name || name.trim().length < 2) {
      errs.name = 'O nome deve ter pelo menos 2 caracteres.';
    }

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errs.color = 'Selecione uma cor válida.';
    }

    if (!totalDays || totalDays < 1) {
      errs.totalDays = 'Deve ser pelo menos 1.';
    }

    if (!hoursPerDay || hoursPerDay < 0.5) {
      errs.hoursPerDay = 'Deve ser pelo menos 0.5.';
    }

    if (!isEditing && scheduledDates.length === 0) {
      errs.scheduledDates = 'Selecione ao menos uma data.';
    }

    return errs;
  }, [name, color, totalDays, hoursPerDay, scheduledDates, isEditing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    if (isEditing && editingTopic) {
      console.log('Updating topic:');
      await onUpdate(editingTopic.id, {
        name: name.trim(),
        color,
        totalDays,
        hoursPerDay,
      });
    } else {
      await onSubmit({
        name: name.trim(),
        color,
        totalDays,
        hoursPerDay,
        scheduledDates,
      });
    }

    setSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Tema' : 'Novo Tema'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting} onClick={handleSubmit}>
            {isEditing ? 'Salvar' : 'Criar Tema'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <Input
          label="Nome do Tema"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          placeholder="Ex: Matemática, React, Inglês..."
          autoFocus
        />

        {/* Color */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cor do Tema
          </label>
          <ColorPicker
            value={color}
            onChange={(c) => {
              setColor(c);
              if (errors.color) setErrors((prev) => ({ ...prev, color: undefined }));
            }}
          />
          {errors.color && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
              {errors.color}
            </p>
          )}
        </div>

        {/* Total days + hours per day side by side */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total de Dias"
            type="number"
            min={1}
            value={totalDays}
            onChange={(e) => {
              setTotalDays(Number(e.target.value));
              if (errors.totalDays) setErrors((prev) => ({ ...prev, totalDays: undefined }));
            }}
            error={errors.totalDays}
          />
          <Input
            label="Horas por Dia"
            type="number"
            min={0.5}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => {
              setHoursPerDay(Number(e.target.value));
              if (errors.hoursPerDay) setErrors((prev) => ({ ...prev, hoursPerDay: undefined }));
            }}
            error={errors.hoursPerDay}
          />
        </div>

        {/* Date picker (only in create mode) */}
        {!isEditing && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Datas de Estudo
            </label>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <DatePicker
                selectedDates={scheduledDates}
                onChange={(dates) => {
                  setScheduledDates(dates);
                  if (errors.scheduledDates)
                    setErrors((prev) => ({ ...prev, scheduledDates: undefined }));
                }}
                highlightColor={color}
              />
            </div>
            {errors.scheduledDates && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
                {errors.scheduledDates}
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
