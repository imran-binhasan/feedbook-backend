export interface CursorValue {
  createdAt: Date;
  id: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function encodeCursor(item: { createdAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ createdAt: item.createdAt.toISOString(), id: item.id }),
  ).toString('base64url');
}

export function decodeCursor(
  s: string | undefined,
): CursorValue | null {
  if (!s) return null;
  try {
    const raw = JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (typeof raw.createdAt === 'string' && typeof raw.id === 'string') {
      return { createdAt: new Date(raw.createdAt), id: raw.id };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseLimit(limitStr?: string): number {
  if (!limitStr) return DEFAULT_LIMIT;
  const n = parseInt(limitStr, 10);
  if (isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function paginate<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null; hasMore: boolean } {
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();
  return {
    items: rows,
    nextCursor: hasMore ? encodeCursor(rows[rows.length - 1]) : null,
    hasMore,
  };
}
