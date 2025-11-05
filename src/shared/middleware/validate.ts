import { ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
  const toValidate = {
    body: req.body,
    params: req.params,
    query: req.query
  };

  try {
    if (toValidate.body) {
      const imgs = (toValidate.body as any).images;
      if (imgs) {
        if (typeof imgs === 'string') {
          (toValidate.body as any).images = imgs.trim() ? [imgs.trim()] : undefined;
        } else if (Array.isArray(imgs)) {
          (toValidate.body as any).images = imgs.filter((i: any) => typeof i === 'string' && i.trim().length > 0);
          if ((toValidate.body as any).images.length === 0) delete (toValidate.body as any).images;
        }
      }

      const pid = (toValidate.body as any).parentId;
      if (typeof pid === 'string') {
        const v = pid.trim();
        if (v === '' || v.toLowerCase() === 'null') {
          (toValidate.body as any).parentId = null;
        }
        if (v.toLowerCase() === 'id') {
          delete (toValidate.body as any).parentId;
        }
      }
    }
  } catch (e) {
  }

  const parsed = schema.safeParse(toValidate);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation error', errors: parsed.error.issues });
  }

  const data: any = parsed.data;
  if (data && data.body !== undefined) req.body = data.body;
  if (data && data.params !== undefined) req.params = data.params;
  if (data && data.query !== undefined) {
    try {
      const existing = (req as any).query || {};
      Object.keys(existing).forEach((k) => { delete existing[k]; });
      Object.keys(data.query).forEach((k) => { existing[k] = (data.query as any)[k]; });
      (req as any).query = existing;
    } catch (err) {
      try { (req as any).query = data.query; } catch (e) { /* ignore */ }
    }
  }

  return next();
};