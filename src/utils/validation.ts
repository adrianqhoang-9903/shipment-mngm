export const LATITUDE_RANGE = { min: -90, max: 90 };
export const LONGITUDE_RANGE = { min: -180, max: 180 };

export const validateNumberInRange = (
  rawValue: string,
  range: { min: number; max: number },
): string => {
  const trimmed = rawValue.trim();

  if (trimmed === "") return "";

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return "Please enter a valid number.";
  }

  if (parsed < range.min || parsed > range.max) {
    return `Value must be between ${range.min} and ${range.max}.`;
  }

  return "";
};
