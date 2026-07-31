import React, { useState } from 'react';
import { errorMessage } from '../../api/http';
import { promotionsService } from '../../services/promotions.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Promotion } from '../../types';
import { ErrorMessage } from '../ui/Feedback';
import { Input, Select, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';

const COLORS: Promotion['color'][] = ['terracota', 'rosa', 'verde', 'dorado'];

interface PromotionFormModalProps {
  promotion: Promotion | null;
  onClose: () => void;
}

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({ promotion, onClose }) => {
  const services = useCatalogStore(state => state.services);
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);

  const [form, setForm] = useState({
    title: promotion?.title ?? '',
    description: promotion?.description ?? '',
    badge: promotion?.badge ?? '-20%',
    color: promotion?.color ?? 'terracota',
    validText: promotion?.validText ?? 'Hasta fin de mes',
    serviceIds: promotion?.serviceIds ?? [],
    priceBefore: promotion?.priceBefore != null ? String(promotion.priceBefore) : '',
    priceNow: promotion?.priceNow != null ? String(promotion.priceNow) : '',
    image: promotion?.image ?? '/img/spa.jpg',
    active: promotion?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleService(id: string) {
    setForm(current => ({
      ...current,
      serviceIds: current.serviceIds.includes(id)
        ? current.serviceIds.filter(s => s !== id)
        : [...current.serviceIds, id],
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!form.title.trim()) throw new Error('El título es obligatorio.');
      if (form.serviceIds.length === 0) throw new Error('Selecciona al menos un servicio incluido.');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        badge: form.badge.trim(),
        color: form.color as Promotion['color'],
        validText: form.validText.trim(),
        serviceIds: form.serviceIds,
        priceBefore: form.priceBefore === '' ? null : Number(form.priceBefore),
        priceNow: form.priceNow === '' ? null : Number(form.priceNow),
        image: form.image,
        active: form.active,
      };

      if (promotion) await promotionsService.update(promotion.id, payload);
      else await promotionsService.create(payload);

      await reload(true);
      toast(promotion ? 'Promoción actualizada.' : 'Promoción creada.');
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
        <div className="modal-eyebrow">MARKETING</div>
        <div className="modal-title">{promotion ? 'Editar promoción' : 'Nueva promoción'}</div>
        <div className="modal-meta">Aparecerá en la vista de promociones y Luna podrá ofrecerla.</div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={submit}>
          <Input label="TÍTULO" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Combo Relax Total" />
          <Textarea label="DESCRIPCIÓN" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <div className="form-grid">
            <Input label="ETIQUETA" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="-30%" />
            <Select
              label="COLOR"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value as Promotion['color'] })}
              options={COLORS.map(c => ({ value: c, label: c }))}
            />
            <Input label="VIGENCIA" value={form.validText} onChange={e => setForm({ ...form, validText: e.target.value })} placeholder="Todos los martes" />
            <Select
              label="IMAGEN"
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              options={[...new Set(services.map(s => s.image))].map(image => ({ value: image, label: image.replace('/img/', '').replace('.jpg', '') }))}
            />
            <Input label="PRECIO ANTES" type="number" min={0} value={form.priceBefore} onChange={e => setForm({ ...form, priceBefore: e.target.value })} placeholder="Opcional" />
            <Input label="PRECIO AHORA" type="number" min={0} value={form.priceNow} onChange={e => setForm({ ...form, priceNow: e.target.value })} placeholder="Opcional" />
          </div>

          <div className="field-label">SERVICIOS INCLUIDOS</div>
          <div className="chip-picker">
            {services.map(service => (
              <button
                key={service.id}
                type="button"
                className={`chip-toggle ${form.serviceIds.includes(service.id) ? 'on' : ''}`.trim()}
                onClick={() => toggleService(service.id)}
              >
                {service.name}
              </button>
            ))}
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Promoción vigente
          </label>

          <button className="btn-continue" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : promotion ? 'Guardar cambios' : 'Crear promoción'}
          </button>
          <button className="btn-back" type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </Modal>
  );
};
