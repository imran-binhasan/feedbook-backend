import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { uuidv7 } from 'uuidv7';
import { RequestWithId } from '../types/request.type';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incomingRequestId = req.headers[REQUEST_ID_HEADER];

    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.length > 0
        ? incomingRequestId
        : uuidv7();

    req.requestId = requestId;

    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
