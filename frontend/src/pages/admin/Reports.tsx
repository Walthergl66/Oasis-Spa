import React, { useEffect, useState } from 'react';
import { StatsCard } from '../../components/admin/StatsCard';
import { EmptyState, Loader } from '../../components/ui/Feedback';
import { reportsService } from '../../services/reports.service';
import type { DashboardReport } from '../../types';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<DashboardReport | null>(null);

  useEffect(() => {
    void reportsService.getDashboard().then(setReport);
  }, []);

  if (!report) return <div className="admin-content"><Loader /></div>;

  const maxRevenue = Math.max(...report.revenueByDay.map(day => day.value), 1);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="admin-content">
      <div className="kpi-row">
        {report.kpis.map(kpi => (
          <StatsCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.positive ? 'green' : 'accent'} />
        ))}
      </div>

      <div className="dash-2col">
        <div className="admin-panel">
          <div className="admin-panel-title">Ingresos por día (últimos 7 días)</div>
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
          <div className="admin-panel-title">Servicios por categoría</div>
          {report.byCategory.length === 0 ? (
            <EmptyState icon="📊" title="Sin datos" text="Aún no hay citas registradas." />
          ) : (
            <div className="donut-wrap">
              <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Distribución por categoría">
                <g transform="rotate(-90 75 75)">
                  {report.byCategory.map(category => {
                    const length = (category.pct / 100) * circumference;
                    const segment = (
                      <circle
                        key={category.category}
                        cx="75" cy="75" r={radius}
                        fill="none"
                        stroke={category.color}
                        strokeWidth="22"
                        strokeDasharray={`${length} ${circumference - length}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += length;
                    return segment;
                  })}
                </g>
              </svg>
              <div className="donut-legend">
                {report.byCategory.map(category => (
                  <div className="donut-leg-item" key={category.category}>
                    <span className="donut-dot" style={{ background: category.color }} />
                    {category.category} <strong>{category.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title">Servicios más solicitados</div>
        {report.topServices.length === 0 ? (
          <EmptyState icon="✦" title="Sin datos" text="Aún no hay citas registradas." />
        ) : (
          <div className="rank-list">
            {report.topServices.map((service, index) => (
              <div className="rank-row" key={service.name}>
                <div className="rank-num">{index + 1}</div>
                <div className="rank-name">{service.name}</div>
                <div className="rank-track">
                  <div className="rank-fill" style={{ width: `${service.pct}%` }} />
                </div>
                <div className="rank-count">{service.count} citas</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
