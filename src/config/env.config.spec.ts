import { validateEnv } from './env.config';

describe('validateEnv', () => {
  it('should validate valid environment configuration', () => {
    const validConfig = {
      PORT: '3000',
      NODE_ENV: 'development',
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5432/tprice_db?schema=public',
      ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173',
    };

    const result = validateEnv(validConfig);
    expect(result).toEqual({
      PORT: 3000,
      NODE_ENV: 'development',
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5432/tprice_db?schema=public',
      ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173',
      ENABLE_SWAGGER: true,
    });
  });

  it('should throw an error for invalid environment configuration', () => {
    const invalidConfig = {
      PORT: 'invalid-port',
      NODE_ENV: 'invalid-env',
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      'Invalid environment configuration',
    );
  });
});
