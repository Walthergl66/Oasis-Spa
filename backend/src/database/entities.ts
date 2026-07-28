/**
 * Registro único de entidades.
 *
 * Lo consumen tanto el módulo de la aplicación como el DataSource de la CLI de
 * migraciones, para que ambos vean exactamente el mismo modelo.
 */
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Promotion } from '../modules/promotions/entities/promotion.entity';
import { Review } from '../modules/reviews/entities/review.entity';
import { Service } from '../modules/services/entities/service.entity';
import { Specialist } from '../modules/specialists/entities/specialist.entity';
import { User } from '../modules/users/entities/user.entity';

export const ENTITIES = [
  Category,
  User,
  Service,
  Specialist,
  Appointment,
  Promotion,
  Review,
  Notification,
];

export {
  Appointment,
  Category,
  Notification,
  Promotion,
  Review,
  Service,
  Specialist,
  User,
};
