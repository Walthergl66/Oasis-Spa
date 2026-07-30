import React, { useEffect, useState } from 'react';
import { ServiceFormModal } from '../../components/admin/ServiceFormModal';
import { Table } from '../../components/admin/Table';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog, EmptyState, Loader } from '../../components/ui/Feedback';
import { servicesService } from '../../services/services.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Service } from '../../types';

export const AdminServices: React.FC = () => {
  const services = useCatalogStore(state => state.services);
  const loading = useCatalogStore(state => state.loading);
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);

  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [working, setWorking] = useState(false);

  // El panel administrativo también ve los servicios desactivados.
  useEffect(() => {
    void reload(true);
  }, [reload]);

  async function confirmDelete() {
    if (!toDelete) return;
    setWorking(true);
    try {
      const result = await servicesService.remove(toDelete.id);
      toast(result.deactivated ? 'El servicio tiene citas registradas: se desactivó en lugar de eliminarse.' : 'Servicio eliminado.');
      setToDelete(null);
      await reload(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title mb-0">Catálogo de servicios ({services.length})</div>
          <button className="add-btn" onClick={() => setCreating(true)}>+ Nuevo servicio</button>
        </div>

        {loading && services.length === 0 ? (
          <Loader />
        ) : (
          <Table
            rows={services}
            rowKey={service => service.id}
            empty={<EmptyState icon="✦" title="Sin servicios" text="Crea el primer servicio del catálogo." />}
            columns={[
              { key: 'name', header: 'SERVICIO', render: s => <span className="bold">{s.name}</span> },
              { key: 'category', header: 'CATEGORÍA', render: s => <span className="muted">{s.category}</span> },
              { key: 'duration', header: 'DURACIÓN', render: s => <span className="muted">{s.durationMin} min</span> },
              { key: 'price', header: 'PRECIO', render: s => <span className="bold">${s.price}</span> },
              { key: 'rating', header: 'VALORACIÓN', render: s => <span className="muted">★ {s.rating} ({s.reviewsCount})</span> },
              {
                key: 'state',
                header: 'ESTADO',
                render: s => <Badge tone={s.active ? 'green' : 'gray'}>{s.active ? 'Visible' : 'Oculto'}</Badge>,
              },
              {
                key: 'actions',
                header: 'ACCIONES',
                render: s => (
                  <>
                    <button className="link-edit" onClick={() => setEditing(s)}>Editar</button>
                    <button className="link-del" onClick={() => setToDelete(s)}>Eliminar</button>
                  </>
                ),
              },
            ]}
          />
        )}
      </div>

      {(creating || editing) && (
        <ServiceFormModal
          service={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar servicio?"
          message={`"${toDelete.name}" dejará de estar disponible. Si tiene citas registradas se conservará como inactivo para no romper el historial.`}
          confirmLabel="Eliminar"
          loading={working}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminServices;
