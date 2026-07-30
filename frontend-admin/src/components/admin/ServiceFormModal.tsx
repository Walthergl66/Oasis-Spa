import React, { useState } from 'react';
import { errorMessage } from '../../api/http';
import { servicesService } from '../../services/services.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Service } from '../../types';
import { ErrorMessage } from '../ui/Feedback';
import { Input, Select, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';

const IMAGES = [
  { value: '/img/manicura.jpg', label: 'Manicura' },
  { value: '/img/masaje.jpg', label: 'Masaje' },
  { value: '/img/pestanas.jpg', label: 'Pestañas' },
  { value: '/img/cabello.jpg', label: 'Cabello' },
  { value: '/img/facial.jpg', label: 'Facial' },
  { value: '/img/spa.jpg', label: 'Spa' },
];

const CATEGORIES = ['Uñas', 'Masaje', 'Pestañas', 'Cabello', 'Facial', 'Spa'];

interface ServiceFormModalProps {
  /** null = alta; un servicio = edición. */
  service: Service | null;
  onClose: () => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, onClose }) => {
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);

  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? CATEGORIES[0],
    description: service?.description ?? '',
    durationMin: String(service?.durationMin ?? 60),
    price: String(service?.price ?? 30),
    image: service?.image ?? IMAGES[0].value,
    popular: service?.popular ?? false,
    active: service?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        durationMin: Number(form.durationMin),
        price: Number(form.price),
        image: form.image,
        popular: form.popular,
        active: form.active,
      };
      if (!payload.name) throw new Error('El nombre es obligatorio.');
      if (payload.durationMin < 15) throw new Error('La duración mínima es de 15 minutos.');
      if (payload.price <= 0) throw new Error('El precio debe ser mayor que cero.');

      if (service) await servicesService.update(service.id, payload);
      else await servicesService.create(payload);

      await reload(true);
      toast(service ? 'Servicio actualizado.' : 'Servicio creado.');
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
        <div className="modal-eyebrow">CATÁLOGO</div>
        <div className="modal-title">{service ? 'Editar servicio' : 'Nuevo servicio'}</div>
        <div className="modal-meta">Los cambios se reflejan de inmediato en la vista de las clientas.</div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={submit}>
          <Input label="NOMBRE" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Manicura Glossy" />
          <div className="form-grid">
            <Select
              label="CATEGORÍA"
              value={form.category}
              onChange={e => set('category', e.target.value)}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
            <Select
              label="IMAGEN"
              value={form.image}
              onChange={e => set('image', e.target.value)}
              options={IMAGES}
            />
            <Input label="DURACIÓN (MIN)" type="number" min={15} step={5} value={form.durationMin} onChange={e => set('durationMin', e.target.value)} />
            <Input label="PRECIO (USD)" type="number" min={1} step={1} value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <Textarea label="DESCRIPCIÓN" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />

          <label className="checkbox-row">
            <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} />
            Destacar como servicio popular
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
            Visible para las clientas
          </label>

          <button className="btn-continue" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : service ? 'Guardar cambios' : 'Crear servicio'}
          </button>
          <button className="btn-back" type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </Modal>
  );
};
