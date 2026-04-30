import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { DevLoginDto } from './dto/dev-login.dto';
import { DevRegisterDto } from './dto/dev-register.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import type { SupabaseAuthenticatedUser } from './interfaces/supabase-user.interface';
import { SupabaseAuthService } from './supabase-auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('dev/login')
  @ApiOperation({
    summary: 'Development-only login against Supabase using email and password',
  })
  async devLogin(@Body() devLoginDto: DevLoginDto) {
    this.ensureDevelopmentOnly();
    return this.supabaseAuthService.signInWithPassword(devLoginDto);
  }

  @Post('dev/register')
  @ApiOperation({
    summary:
      'Development-only registration in Supabase Auth with local users sync',
  })
  async devRegister(@Body() devRegisterDto: DevRegisterDto) {
    this.ensureDevelopmentOnly();
    return this.supabaseAuthService.registerDevelopmentUser(devRegisterDto);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current access token and return its user' })
  getAuthenticatedUser(
    @CurrentUser() user: SupabaseAuthenticatedUser,
  ): SupabaseAuthenticatedUser {
    return user;
  }

  private ensureDevelopmentOnly(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv === 'production') {
      throw new ForbiddenException(
        'This endpoint is only available outside production',
      );
    }
  }
}
