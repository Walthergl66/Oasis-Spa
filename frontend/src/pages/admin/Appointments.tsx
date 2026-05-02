import React, { useState } from 'react';
import { api } from '../../services/api';
import { appointments as mockAppointments, employees, type Appointment } from '../../data/mockData';

export const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const next = appointments.map((appointment) => (appointment.id === id ? { ...appointment, ...data } : appointment));
    setAppointments(next);
    await api.updateAppointment(id, data, next);
  };

  const deleteAppointment = async (id: string) => {
    const next = appointments.filter((appointment) => appointment.id !== id);
    setAppointments(next);
    await api.deleteAppointment(id, next);
  };

  return (
    <div className="admin-appointments">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Agenda</span>
          <h1>Gestión de citas</h1>
          <p className="lead">Calendario operativo con edición y eliminación, usando API si existe y mock si no.</p>
        </div>
        <button className="btn btn-primary" type="button">
          Agregar
        </button>
      </div>

      <section className="calendar-strip">
        {['Lun 04', 'Mar 05', 'Mié 06', 'Jue 07', 'Vie 08'].map((day, index) => (
          <div className={`calendar-day ${index === 0 ? 'active' : ''}`} key={day}>
            <strong>{day}</strong>
            <span>{index === 0 ? appointments.length : index + 1} citas</span>
          </div>
        ))}
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Profesional</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>
                  {appointment.client} {appointment.vip && <span className="badge vip">VIP</span>}
                </td>
                <td>{appointment.service}</td>
                <td>
                  {appointment.date} {appointment.time}
                </td>
                <td>
                  {editingId === appointment.id ? (
                    <select
                      value={appointment.employee}
                      onChange={(event) => updateAppointment(appointment.id, { employee: event.target.value })}
                    >
                      {employees.map((employee) => (
                        <option key={employee}>{employee}</option>
                      ))}
                    </select>
                  ) : (
                    appointment.employee
                  )}
                </td>
                <td>
                  <span className={`badge ${appointment.status === 'Confirmada' ? 'success' : 'warning'}`}>
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <div className="row-actions compact">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setEditingId(editingId === appointment.id ? null : appointment.id)}
                    >
                      {editingId === appointment.id ? 'Listo' : 'Editar'}
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => deleteAppointment(appointment.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminAppointments;
