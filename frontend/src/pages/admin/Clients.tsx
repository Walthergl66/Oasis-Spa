import React, { useEffect, useState } from 'react';
import { Table } from '../../components/admin/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, Loader } from '../../components/ui/Feedback';
import { userService } from '../../services/user.service';
import type { ClientSummary } from '../../types';
import { formatShortDate } from '../../utils/date';

export const AdminClients: React.FC = () => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // La búsqueda se resuelve en el servicio (mañana, un query param de la API).
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void userService.listClients(search).then(rows => {
        if (!active) return;
        setClients(rows);
        setLoading(false);
      });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="admin-content">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title mb-0">Base de clientas ({clients.length})</div>
          <input
            className="admin-search"
            placeholder="Buscar clienta…"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Table
            rows={clients}
            rowKey={row => row.client.id}
            empty={<EmptyState icon="☺" title="Sin resultados" text="No encontramos clientas con ese criterio." />}
            columns={[
              {
                key: 'client',
                header: 'CLIENTA',
                render: row => (
                  <div className="row">
                    <div className="specialist-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>{row.client.initials}</div>
                    <span className="bold">{row.client.name}</span>
                  </div>
                ),
              },
              {
                key: 'contact',
                header: 'CONTACTO',
                render: row => <span className="muted">{row.client.email}<br />{row.client.phone || '—'}</span>,
              },
              { key: 'visits', header: 'VISITAS', render: row => <span className="bold">{row.visits}</span> },
              { key: 'spent', header: 'TOTAL GASTADO', render: row => <span className="bold">${row.spent}</span> },
              {
                key: 'last',
                header: 'ÚLTIMA VISITA',
                render: row => <span className="muted">{row.lastVisit ? formatShortDate(row.lastVisit) : '—'}</span>,
              },
              {
                key: 'level',
                header: 'NIVEL',
                render: row => (
                  <Badge tone={row.client.level === 'Oro' ? 'yellow' : row.client.level === 'Ámbar' ? 'amber' : 'gray'}>
                    {row.client.level} · {row.client.points} pts
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: 'ESTADO',
                render: row => (
                  <Badge tone={row.status === 'Activa' ? 'green' : row.status === 'Nueva' ? 'blue' : 'gray'}>{row.status}</Badge>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default AdminClients;
