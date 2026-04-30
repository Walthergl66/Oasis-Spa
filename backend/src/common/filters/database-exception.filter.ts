import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const handledException = this.mapDatabaseError(exception);
    const status = handledException.getStatus();
    const errorResponse = handledException.getResponse();

    this.logger.warn(
      `${request.method} ${request.url} failed with database error: ${exception.message}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error:
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as { error?: string }).error,
      message:
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as { message?: string }).message,
    });
  }

  private mapDatabaseError(exception: QueryFailedError) {
    const driverError = exception.driverError as {
      code?: string;
      detail?: string;
      constraint?: string;
    };

    switch (driverError.code) {
      case '23505':
        return new ConflictException('Resource already exists');
      case '23503':
        return new BadRequestException('Related resource does not exist');
      case '23514':
        return new BadRequestException('Database validation failed');
      default:
        return new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Database operation failed',
          error: 'Bad Request',
        });
    }
  }
}
