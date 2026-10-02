/**
 * Generates Google Meet style room code: e.g. "xkq-yztp-prv" or "xkq-92m-prv"
 * Formatted with random lowercase alphanumeric characters separated by hyphens.
 */
export const generateRoomCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getRandomPart = (len) => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return `${getRandomPart(3)}-${getRandomPart(4)}-${getRandomPart(3)}`;
};

/**
 * Normalizes input room codes by stripping spaces and converting to lowercase.
 */
export const normalizeRoomCode = (rawCode) => {
  if (!rawCode) return '';
  return rawCode.trim().toLowerCase().replace(/\s+/g, '');
};

/**
 * Validates room code format (e.g. xxx-yyyy-zzz or xxx-yyy-zzz or alphanumeric slug)
 */
export const isValidRoomCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const cleaned = code.trim().toLowerCase();
  // Match standard Meet formats like xxx-yyyy-zzz or slug without dashes
  return /^[a-z0-9]{3,4}-[a-z0-9]{3,4}-[a-z0-9]{3,4}$/.test(cleaned) || /^[a-z0-9-_]{3,20}$/.test(cleaned);
};
