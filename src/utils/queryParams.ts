import {
  DEFAULT_SHIPMENT_LIST_QUERY,
  STATUS_LABELS,
  URL_PARAMS,
} from "../constants";
import type {
  ShipmentListQuery,
  ShipmentListUrlQuery,
  ShipmentStatus,
} from "../types";

const readStatus = (value: string | null): ShipmentStatus =>
  value !== null && value in STATUS_LABELS
    ? (value as ShipmentStatus)
    : DEFAULT_SHIPMENT_LIST_QUERY.status;

const readPage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0
    ? page
    : DEFAULT_SHIPMENT_LIST_QUERY.page;
};

export const withParam = (
  current: URLSearchParams,
  key: string,
  value: string | null,
  defaultValue = "",
) => {
  const next = new URLSearchParams(current);

  if (value === null || value === defaultValue) {
    next.delete(key);
  } else {
    next.set(key, value);
  }

  return next;
};

export const readListParams = (
  searchParams: URLSearchParams,
): ShipmentListQuery => ({
  status: readStatus(searchParams.get(URL_PARAMS.status)),
  query: searchParams.get(URL_PARAMS.query) ?? "",
  page: readPage(searchParams.get(URL_PARAMS.page)),
  perPage: DEFAULT_SHIPMENT_LIST_QUERY.perPage,
});

export const mergeListParams = (
  current: URLSearchParams,
  partial: Partial<ShipmentListUrlQuery>,
) => {
  let next = current;

  if (partial.status !== undefined) {
    next = withParam(next, URL_PARAMS.status, partial.status);
  }
  if (partial.query !== undefined) {
    next = withParam(next, URL_PARAMS.query, partial.query.trim());
  }
  if (partial.page !== undefined) {
    next = withParam(
      next,
      URL_PARAMS.page,
      String(partial.page),
      String(DEFAULT_SHIPMENT_LIST_QUERY.page),
    );
  }

  return next;
};
