export const toISODate = (isoDateTime: string): string => isoDateTime.slice(0, 10);

export const toDisplayDate = (isoDateTime: string): string =>
  toISODate(isoDateTime).replaceAll("-", "/");
