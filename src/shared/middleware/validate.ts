import { ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validate middleware
 * Accepts a Zod schema that can validate the request shape of the form:
 * {
 *   body?: ...,
 *   params?: ...,
 *   query?: ...
 * }
 */
export const validate = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
  // Build an object that matches the schema expectation
  const toValidate = {
    body: req.body,
    params: req.params,
    query: req.query
  };

  // Lightweight sanitization to tolerate common Swagger UI placeholders or empty values
  try {
    if (toValidate.body) {
      // Normalize images: remove empty / non-string entries (Swagger may send empty strings)
      const imgs = (toValidate.body as any).images;
      if (imgs) {
        if (typeof imgs === 'string') {
          // single value sent as string -> convert to array if non-empty
          (toValidate.body as any).images = imgs.trim() ? [imgs.trim()] : undefined;
        } else if (Array.isArray(imgs)) {
          (toValidate.body as any).images = imgs.filter((i: any) => typeof i === 'string' && i.trim().length > 0);
          if ((toValidate.body as any).images.length === 0) delete (toValidate.body as any).images;
        }
      }

      // Normalize parentId common placeholders: Swagger sometimes sends "id" or "null" as strings
      const pid = (toValidate.body as any).parentId;
      if (typeof pid === 'string') {
        const v = pid.trim();
        if (v === '' || v.toLowerCase() === 'null') {
          (toValidate.body as any).parentId = null;
        }
        // if client left the placeholder 'id', treat as empty (remove field)
        if (v.toLowerCase() === 'id') {
          delete (toValidate.body as any).parentId;
        }
      }
    }
  } catch (e) {
    // ignore sanitization errors and proceed to validation which will report proper errors
  }

  const parsed = schema.safeParse(toValidate);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation error', errors: parsed.error.issues });
  }

  // Replace request parts with parsed (sanitized/parsed) values if present
  const data: any = parsed.data;
  if (data && data.body !== undefined) req.body = data.body;
  if (data && data.params !== undefined) req.params = data.params;
  if (data && data.query !== undefined) req.query = data.query;

  return next();
};