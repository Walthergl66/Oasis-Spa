export enum UserRole {
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SYSTEM = 'system',
  WHATSAPP = 'whatsapp',
}

export enum NotificationType {
  APPOINTMENT = 'appointment',
  REMINDER = 'reminder',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}

export enum ChatSender {
  USER = 'user',
  BOT = 'bot',
}
