import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from '../services/services.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion, PromotionColor } from './entities/promotion.entity';

/**
 * Forma en la que una promoción sale hacia el frontend.
 *
 * Los servicios se aplana a sus ids (`serviceIds`) porque es el contrato que
 * las vistas ya consumen; `imageUrl` se expone como `image`.
 */
export interface PromotionResponse {
  id: string;
  title: string;
  description: string;
  badge: string;
  color: PromotionColor;
  validText: string;
  serviceIds: string[];
  priceBefore: number | null;
  priceNow: number | null;
  image: string;
  active: boolean;
}

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly repository: Repository<Promotion>,
    private readonly services: ServicesService,
  ) {}

  static toResponse(promotion: Promotion): PromotionResponse {
    return {
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      badge: promotion.badge,
      color: promotion.color,
      validText: promotion.validText,
      serviceIds: (promotion.services ?? []).map((service) => service.id),
      priceBefore: promotion.priceBefore,
      priceNow: promotion.priceNow,
      image: promotion.imageUrl,
      active: promotion.active,
    };
  }

  /**
   * Promociones vigentes.
   *
   * Por defecto se filtra por `active` y por la ventana `startsAt`/`endsAt`:
   * una promoción agendada con fechas deja de ofrecerse sola, sin intervención
   * manual. `includeInactive` sirve al panel para editar cualquiera.
   */
  async findAll(includeInactive = false): Promise<PromotionResponse[]> {
    const query = this.repository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.services', 'service')
      .orderBy('promotion.title', 'ASC');

    if (!includeInactive) {
      const ahora = new Date().toISOString();
      query
        .andWhere('promotion.active = true')
        .andWhere('(promotion.startsAt IS NULL OR promotion.startsAt <= :ahora)', {
          ahora,
        })
        .andWhere('(promotion.endsAt IS NULL OR promotion.endsAt >= :ahora)', {
          ahora,
        });
    }

    const promotions = await query.getMany();
    return promotions.map((promotion) =>
      PromotionsService.toResponse(promotion),
    );
  }

  async findOne(id: string): Promise<PromotionResponse> {
    return PromotionsService.toResponse(await this.getEntity(id));
  }

  async create(dto: CreatePromotionDto): Promise<PromotionResponse> {
    const promotion = this.repository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      badge: dto.badge?.trim() ?? '',
      color: dto.color ?? PromotionColor.TERRACOTA,
      validText: dto.validText?.trim() ?? '',
      priceBefore: dto.priceBefore ?? null,
      priceNow: dto.priceNow ?? null,
      imageUrl: dto.image?.trim() ?? '',
      active: dto.active ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      services: await Promise.all(
        dto.serviceIds.map((id) => this.services.getEntity(id)),
      ),
    });

    return PromotionsService.toResponse(await this.repository.save(promotion));
  }

  async update(
    id: string,
    dto: UpdatePromotionDto,
  ): Promise<PromotionResponse> {
    const promotion = await this.getEntity(id);

    if (dto.title !== undefined) promotion.title = dto.title.trim();
    if (dto.description !== undefined)
      promotion.description = dto.description.trim();
    if (dto.badge !== undefined) promotion.badge = dto.badge.trim();
    if (dto.color !== undefined) promotion.color = dto.color;
    if (dto.validText !== undefined)
      promotion.validText = dto.validText.trim();
    if (dto.priceBefore !== undefined) promotion.priceBefore = dto.priceBefore;
    if (dto.priceNow !== undefined) promotion.priceNow = dto.priceNow;
    if (dto.image !== undefined) promotion.imageUrl = dto.image.trim();
    if (dto.active !== undefined) promotion.active = dto.active;
    if (dto.startsAt !== undefined)
      promotion.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined)
      promotion.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.serviceIds) {
      promotion.services = await Promise.all(
        dto.serviceIds.map((serviceId) => this.services.getEntity(serviceId)),
      );
    }

    return PromotionsService.toResponse(await this.repository.save(promotion));
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const promotion = await this.getEntity(id);
    await this.repository.remove(promotion);
    return { deleted: true };
  }

  private async getEntity(id: string): Promise<Promotion> {
    const promotion = await this.repository.findOne({
      where: { id },
      relations: { services: true },
    });
    if (!promotion) throw new NotFoundException('La promoción no existe.');
    return promotion;
  }
}
