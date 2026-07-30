import React, { useState } from 'react';
import { errorMessage } from '../../api/http';
import { specialistsService } from '../../services/specialists.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Specialist, SpecialistStatus } from '../../types';
import { ErrorMessage } from '../ui/Feedback';
import { Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';

const STATUSES: SpecialistStatus[] = ['Disponible', 'En cita', 'Descanso'];

interface SpecialistFormModalProps {
  specialist: Specialist | null;
  onClose: () => void;
}

export const SpecialistFormModal: React.FC<SpecialistFormModalProps> = ({ specialist, onClose }) => {
  const services = useCatalogStore(state => state.services);
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);
  const categories = [...new Set(services.map(s => s.category))];

  const [form, setForm] = useState({
    name: specialist?.name ?? '',
    role: specialist?.role ?? '',
    status: specialist?.status ?? 'Disponible',
    rating: String(specialist?.rating ?? 5),
    categories: specialist?.categories ?? [],
    active: specialist?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(category: string) {
    setForm(current => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter(c => c !== category)
        : [...current.categories, category],
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!form.name.trim()) throw new Error('El nombre es obligatorio.');
      if (form.categories.length === 0) throw new Error('Selecciona al menos una especialidad.');

      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || form.categories.join(' & '),
        status: form.status as SpecialistStatus,
        rating: Number(form.rating),
        categories: form.categories,
        active: form.active,
      };

      if (specialist) await specialistsService.update(specialist.id, payload);
      else await specialistsService.create(payload);

      await reload(true);
      toast(specialist ? 'Especialista actualizada.' : 'Especialista registrada.');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="modal-body">
        <div className="modal-eyebrow">EQUIPO</div>
        <div className="modal-title">{specialist ? 'Editar especialista' : 'Nueva especialista'}</div>
        <div className="modal-meta">Las especialidades definen qué servicios puede atender en la agenda.</div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={submit}>
          <div className="form-grid">
            <Input label="NOMBRE" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tatiana Aguirre" />
            <Input label="ROL" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Nail art & manicura" />
            <Select
              label="ESTADO"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as SpecialistStatus })}
              options={STATUSES.map(s => ({ value: s, label: s }))}
            />
            <Input label="VALORACIÓN" type="number" min={1} max={5} step={0.1} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
          </div>

          <div className="field-label">ESPECIALIDADES</div>
          <div className="chip-picker">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`chip-toggle ${form.categories.includes(category) ? 'on' : ''}`.trim()}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Activa en el equipo
          </label>

          <button className="btn-continue" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : specialist ? 'Guardar cambios' : 'Registrar especialista'}
          </button>
          <button className="btn-back" type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </Modal>
  );
};
