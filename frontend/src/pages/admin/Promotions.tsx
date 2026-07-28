import React, { useEffect, useState } from 'react';
import { PromotionFormModal } from '../../components/admin/PromotionFormModal';
import { ConfirmDialog, EmptyState, Loader } from '../../components/ui/Feedback';
import { promotionsService } from '../../services/promotions.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Promotion } from '../../types';

export const AdminPromotions: React.FC = () => {
  const promotions = useCatalogStore(state => state.promotions);
  const loading = useCatalogStore(state => state.loading);
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);

  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Promotion | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void reload(true);
  }, [reload]);

  /** El interruptor publica o retira la promoción de la vista de la clienta. */
  async function toggleActive(promotion: Promotion, active: boolean) {
    await promotionsService.update(promotion.id, { active });
    toast(active ? 'Promoción publicada.' : 'Promoción retirada.');
    await reload(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setWorking(true);
    try {
      await promotionsService.remove(toDelete.id);
      toast('Promoción eliminada.');
      setToDelete(null);
      await reload(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-panel-head">
        <div className="admin-panel-title mb-0">Promociones ({promotions.length})</div>
        <button className="add-btn" onClick={() => setCreating(true)}>+ Nueva promoción</button>
      </div>

      {loading && promotions.length === 0 ? (
        <Loader />
      ) : promotions.length === 0 ? (
        <EmptyState icon="🎁" title="Sin promociones" text="Crea una promoción para atraer nuevas clientas." />
      ) : (
        <div className="promo-admin-grid">
          {promotions.map(promotion => (
            <div className="promo-admin-card" key={promotion.id}>
              <div className="promo-admin-head">
                <span className={`promo-badge-sm promo-${promotion.color}`}>{promotion.badge}</span>
                <label className="switch" title={promotion.active ? 'Vigente' : 'Retirada'}>
                  <input
                    type="checkbox"
                    checked={promotion.active}
                    onChange={event => void toggleActive(promotion, event.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="promo-admin-title">{promotion.title}</div>
              <div className="promo-admin-desc">{promotion.description}</div>
              <div className="promo-admin-foot">
                <span className="promo-admin-valid">🕐 {promotion.validText}</span>
                <div>
                  <button className="link-edit" onClick={() => setEditing(promotion)}>Editar</button>
                  <button className="link-del" onClick={() => setToDelete(promotion)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <PromotionFormModal
          promotion={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar promoción?"
          message={`"${toDelete.title}" dejará de mostrarse a las clientas.`}
          confirmLabel="Eliminar"
          loading={working}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminPromotions;
