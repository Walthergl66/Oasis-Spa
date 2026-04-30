import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enums';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { Review } from '../entities/review.entity';

@Injectable()
export class ReviewOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;
    if (!profile) throw new ForbiddenException('Authorization context is missing');

    if (profile.role === UserRole.SUPER_ADMIN || profile.role === UserRole.ADMIN) {
      return true;
    }

    const reviewId = request.params?.id as string | undefined;
    if (!reviewId) throw new ForbiddenException('Review id is required');

    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
      select: { id: true, customerId: true },
    });
    if (!review) throw new ForbiddenException('Review not found');

    if (review.customerId !== profile.id) {
      throw new ForbiddenException('You can only access your own reviews');
    }

    return true;
  }
}

