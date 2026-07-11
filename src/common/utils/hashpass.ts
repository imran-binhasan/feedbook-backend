import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPass(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePass(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
