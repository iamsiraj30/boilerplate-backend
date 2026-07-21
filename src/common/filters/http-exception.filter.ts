import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();

      if (typeof resContent === 'object' && resContent !== null) {
        const resObj = resContent as Record<string, unknown>;
        if (
          typeof resObj.message === 'string' ||
          Array.isArray(resObj.message)
        ) {
          message = resObj.message as string | string[];
        } else {
          message = exception.message;
        }
        error =
          typeof resObj.error === 'string' ? resObj.error : exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // Log full stack details for internal server errors using Pino logger
      this.logger.error(
        {
          err: exception,
          url: request.url,
          method: request.method,
        },
        `Unhandled Exception: ${exception.message}`,
      );
      message = 'An unexpected error occurred';
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
