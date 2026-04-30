import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment } from '../appointments/entities/payment.entity';
import { Availability } from '../availability/entities/availability.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { ChatSession } from '../chat/entities/chat.entity';
import { SystemSetting } from '../common/entities/system-setting.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Review } from '../reviews/entities/review.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { Service } from '../services/entities/service.entity';
import { SpaImage } from '../spas/entities/spa-image.entity';
import { Spa } from '../spas/entities/spa.entity';
import { Favorite } from '../users/entities/favorite.entity';
import { User } from '../users/entities/user.entity';

export const typeOrmEntities = [
  Appointment,
  Payment,
  Availability,
  ChatMessage,
  ChatSession,
  SystemSetting,
  Employee,
  Notification,
  Review,
  ServiceCategory,
  Service,
  SpaImage,
  Spa,
  Favorite,
  User,
];
