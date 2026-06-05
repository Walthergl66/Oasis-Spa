import type { SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';

type Experience = {
  title: string;
  description: string;
  image: string;
  alt: string;
  cta: string;
  tone: 'clay' | 'sage' | 'honey';
  mirrored?: boolean;
};

const fallbackImage =
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=900&auto=format&fit=crop';

const experiences: Experience[] = [
  {
    title: 'Nail Care & Art',
    description:
      'Esmaltado semipermanente, aplicaciones de Softgel y pedicura spa profunda. Un toque de distincion y cuidado para tus manos y pies.',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d03?q=80&w=900&auto=format&fit=crop',
    alt: 'Manicura premium con diseno minimalista',
    cta: 'Agendar Manicura y Pedicura',
    tone: 'clay',
  },
  {
    title: 'Masaje Profesional',
    description:
      'Relajacion profunda para cuerpo y mente, liberando tension y estres con tecnicas personalizadas y aceites esenciales.',
    image: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=900&auto=format&fit=crop',
    alt: 'Masaje relajante con aceites esenciales',
    cta: 'Agendar Masaje',
    tone: 'sage',
    mirrored: true,
  },
  {
    title: 'Cuidado Capilar',
    description:
      'Rituales de nutricion y fortalecimiento para un cabello radiante y un cuero cabelludo saludable, utilizando ingredientes naturales.',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=900&auto=format&fit=crop',
    alt: 'Tratamiento capilar natural en spa',
    cta: 'Agendar Cuidado Capilar',
    tone: 'honey',
  },
];

const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackImage;
};

export const ExperiencesSection = () => {
  return (
    <section className="section boho-catalog-section">
      <div className="boho-catalog-decor" aria-hidden="true">
        <svg className="boho-bg-illustration boho-bg-illustration-one" viewBox="0 0 180 220">
          <path d="M92 204C88 142 92 72 132 18" />
          <path d="M91 139C56 118 34 88 26 48c37 10 62 42 65 91Z" />
          <path d="M100 113c31-19 49-45 54-79-34 9-54 36-54 79Z" />
          <path d="M88 174c-24-14-41-32-52-55 29 4 48 24 52 55Z" />
        </svg>

        <svg className="boho-bg-illustration boho-bg-illustration-two" viewBox="0 0 190 190">
          <path d="M26 156C70 106 111 66 158 24" />
          <path d="M56 122c-20-7-34-20-42-40 22 0 38 14 42 40Z" />
          <path d="M78 100c-10-21-10-42 0-63 18 18 18 40 0 63Z" />
          <path d="M103 76c24 1 43-7 57-25-25-8-45 1-57 25Z" />
          <path d="M42 141c20 5 38 2 54-9" />
        </svg>

        <svg className="boho-bg-illustration boho-bg-illustration-three" viewBox="0 0 210 150">
          <path d="M18 82c39-42 84-42 135 0 16 13 29 20 39 20" />
          <path d="M58 82c13-24 32-36 57-36s44 12 57 36" />
          <path d="M76 101c24 16 48 16 72 0" />
          <path d="M104 18v36" />
        </svg>
      </div>

      <div className="section-header flex-between boho-catalog-header">
        <div>
          <span className="eyebrow-gold">CATALOGO</span>
          <h2 className="serif-title">Nuestras Experiencias</h2>
        </div>
        <Link to="/services" className="btn-link-minimal">
          Ver todos los servicios
        </Link>
      </div>

      <div className="boho-services-list">
        {experiences.map((experience) => (
          <article
            className={`boho-card ${experience.mirrored ? 'mirrored' : ''}`}
            key={experience.title}
          >
            <div className="boho-card-image">
              <img
                src={experience.image}
                alt={experience.alt}
                loading="lazy"
                onError={handleImageError}
              />
            </div>
            <div className="boho-card-content">
              <h3>{experience.title}</h3>
              <p>{experience.description}</p>
              <Link to="/booking" className={`btn-boho btn-boho-${experience.tone}`}>
                {experience.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
