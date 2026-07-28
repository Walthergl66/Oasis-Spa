import React, { useEffect, useState } from 'react';
import { SpecialistFormModal } from '../../components/admin/SpecialistFormModal';
import { StaffCard } from '../../components/admin/StaffCard';
import { ConfirmDialog, EmptyState, Loader } from '../../components/ui/Feedback';
import { reportsService } from '../../services/reports.service';
import { specialistsService } from '../../services/specialists.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Specialist } from '../../types';

export const AdminStaff: React.FC = () => {
  const specialists = useCatalogStore(state => state.specialists);
  const loading = useCatalogStore(state => state.loading);
  const reload = useCatalogStore(state => state.load);
  const toast = useUIStore(state => state.toast);

  const [loadBySpecialist, setLoadBySpecialist] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Specialist | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Specialist | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void reload(true);
  }, [reload]);

  useEffect(() => {
    void reportsService.getSpecialistLoad().then(rows => {
      setLoadBySpecialist(Object.fromEntries(rows.map(row => [row.specialist.id, row.count])));
    });
  }, [specialists.length]);

  async function confirmDelete() {
    if (!toDelete) return;
    setWorking(true);
    try {
      const result = await specialistsService.remove(toDelete.id);
      toast(result.deactivated ? 'Tiene citas registradas: se marcó como inactiva.' : 'Especialista eliminada.');
      setToDelete(null);
      await reload(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-panel-head">
        <div className="admin-panel-title mb-0">Equipo ({specialists.length})</div>
        <button className="add-btn" onClick={() => setCreating(true)}>+ Nueva especialista</button>
      </div>

      {loading && specialists.length === 0 ? (
        <Loader />
      ) : specialists.length === 0 ? (
        <EmptyState icon="👤" title="Sin especialistas" text="Registra al equipo para poder agendar citas." />
      ) : (
        <div className="specialist-grid">
          {specialists.map(specialist => (
            <StaffCard
              key={specialist.id}
              specialist={specialist}
              appointmentsToday={loadBySpecialist[specialist.id] ?? 0}
              onEdit={setEditing}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SpecialistFormModal
          specialist={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar especialista?"
          message={`${toDelete.name} dejará de aparecer en la asignación de citas.`}
          confirmLabel="Eliminar"
          loading={working}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminStaff;
