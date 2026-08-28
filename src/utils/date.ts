export const toISODate = (isoDateTime: string): string => isoDateTime.slice(0, 10);

export const toDisplayDate = (isoDateTime: string): string =>
  toISODate(isoDateTime).replaceAll("-", "/");

export const toApiDateTime = (dateTime: string): string => `${dateTime}T00:00:00.000Z`;