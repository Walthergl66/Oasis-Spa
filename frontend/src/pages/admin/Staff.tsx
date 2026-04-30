import React from 'react';

export const AdminStaff: React.FC = () => {
  const staff = [
    { name: 'Laura Perez', role: 'Terapeuta', schedule: 'Lun - Vie' },
    { name: 'Sofia Marin', role: 'Esteticista', schedule: 'Mar - Sab' },
    { name: 'Nicolas Rojas', role: 'Masajista', schedule: 'Mie - Dom' },
  ];

  return (
    <div className="admin-staff">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Equipo</span>
          <h1>Personal</h1>
        </div>
        <button className="btn btn-primary" type="button">Agregar persona</button>
      </div>
      <div className="grid">
        {staff.map((person) => (
          <article className="card" key={person.name}>
            <h3>{person.name}</h3>
            <p className="muted">{person.role}</p>
            <div className="meta">
              <span>{person.schedule}</span>
              <span className="badge success">Disponible</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminStaff;
