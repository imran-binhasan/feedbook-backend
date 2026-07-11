import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  R2_ENDPOINT: Joi.string().uri().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_BASE_URL: Joi.string().uri().optional(),
});