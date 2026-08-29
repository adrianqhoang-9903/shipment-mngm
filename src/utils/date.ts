export const toISODate = (isoDateTime: string): string => isoDateTime.slice(0, 10);

export const toDisplayDate = (isoDateTime: string): string =>
  toISODate(isoDateTime).replaceAll("-", "/");

export const toStartOfDay = (date: string): string => `${date}T00:00:00.000Z`;
export const toEndOfDay = (date: string): string => `${date}T23:59:59.999Z`;
