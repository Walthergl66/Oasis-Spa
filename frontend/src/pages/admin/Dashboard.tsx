import React, { useEffect, useState } from 'react';
import { StatsCard } from '../../components/admin/StatsCard';
import { Table } from '../../components/admin/Table';
import { AppointmentBadge, Badge, specialistTone } from '../../components/ui/Badge';
import { EmptyState, Loader } from '../../components/ui/Feedback';
import { appointmentsService } from '../../services/appointments.service';
import { reportsService } from '../../services/reports.service';
import { useCatalogStore } from '../../store/catalogStore';
import type { Appointment, DashboardReport, Specialist } from '../../types';
import { formatLongDate, toISODate, toTime } from '../../utils/date';

export const Dashboard: React.FC = () => {
  const specialists = useCatalogStore(state => state.specialists);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [agenda, setAgenda] = useState<Appointment[]>([]);
  const [load, setLoad] = useState<{ specialist: Specialist; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = toISODate(new Date());
    void Promise.all([
      reportsService.getDashboard(),
      appointmentsService.getAgenda(today),
      reportsService.getSpecialistLoad(today),
    ]).then(([dashboard, todayAgenda, specialistLoad]) => {
      setReport(dashboard);
      setAgenda(todayAgenda);
      setLoad(specialistLoad);
      setLoading(false);
    });
  }, [specialists.length]);

  if (loading || !report) return <div className="admin-content"><Loader /></div>;

  const maxRevenue = Math.max(...report.revenueByDay.map(day => day.value), 1);

  return (
    <div className="admin-content">
      <div className="kpi-row">
        <StatsCard
          label="Citas hoy"
          value={report.todayCount}
          delta={`${report.todayDelta >= 0 ? '+' : ''}${report.todayDelta} vs ayer`}
          tone={report.todayDelta >= 0 ? 'green' : 'yellow'}
        />
        <StatsCard label="Ingresos del día" value={`$${report.todayRevenue}`} delta="citas confirmadas y completadas" />
        <StatsCard label="Ocupación" value={`${report.occupancy}%`} delta="del equipo disponible" />
        <StatsCard label="Cancelaciones" value={report.cancellations} delta="últimos 7 días" tone="yellow" />
      </div>

      <div className="dash-2col">
        <div className="admin-panel">
          <div className="admin-panel-title">Ingresos de la semana</div>
          <div className="bar-chart">
            {report.revenueByDay.map((day, index) => (
              <div className="bar-col" key={`${day.day}-${index}`}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(day.value / maxRevenue) * 100}%` }}>
                    <span className="bar-val">${day.value}</span>
                  </div>
                </div>
                <div className="bar-label">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Especialistas hoy</div>
          <div className="mini-spec-list">
            {load.map(({ specialist, count }) => (
              <div className="mini-spec" key={specialist.id}>
                <div className="specialist-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>{specialist.initials}</div>
                <div className="grow">
                  <div className="mini-spec-name">{specialist.name}</div>
                  <div className="mini-spec-role">{count} cita(s) hoy</div>
                </div>
                <Badge tone={specialistTone(specialist.status)}>{specialist.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title">Agenda de hoy · {formatLongDate(new Date())}</div>
        <Table
          rows={agenda}
          rowKey={appointment => appointment.id}
          empty={<EmptyState icon="🗓" title="Sin citas para hoy" text="La agenda del día está libre." />}
          columns={[
            { key: 'hora', header: 'HORA', render: a => <span className="bold">{toTime(a.start)}</span> },
            { key: 'cliente', header: 'CLIENTE', render: a => a.clientName },
            { key: 'servicio', header: 'SERVICIO', render: a => <span className="muted">{a.serviceName}</span> },
            { key: 'especialista', header: 'ESPECIALISTA', render: a => <span className="muted">{a.specialistName}</span> },
            { key: 'estado', header: 'ESTADO', render: a => <AppointmentBadge status={a.status} /> },
          ]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
