import React from 'react';

export const Footer: React.FC = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-col">
        <div className="footer-brand">Oasis Spa</div>
        <div>Manta, Manabí — Ecuador</div>
        <div>© {new Date().getFullYear()} Todos los derechos reservados.</div>
      </div>
      <div className="footer-col">
        <strong>HORARIO</strong>
        <div>Lun a Sáb · 09:00 – 18:00</div>
        <div>Dom · 10:00 – 14:00</div>
      </div>
      <div className="footer-col">
        <strong>CONTACTO</strong>
        <div>📞 099 812 4471</div>
        <div>✉ citas@oasisspa.ec</div>
      </div>
    </div>
  </footer>
);
