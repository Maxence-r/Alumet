import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    connected?: boolean;
    user?: any;
    upload?: any;
  }
}

