import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigationType } from "react-router-dom";
import debounce from "lodash.debounce";
import { SEARCH_DEBOUNCE_MS } from "../../../constants";
import styles from "./ShipmentSearch.module.css";

interface ShipmentSearchProps {
  query: string;
  onSearch: (query: string) => void;
}

const ShipmentSearch = ({ query, onSearch }: ShipmentSearchProps) => {
  const [value, setValue] = useState(query);
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== "POP") return;
    setValue(query);
  }, [query, navigationType]);

  const debouncedSearch = useMemo(
    () => debounce((next: string) => onSearch(next.trim()), SEARCH_DEBOUNCE_MS),
    [onSearch],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setValue(next);
    debouncedSearch(next);
  };

  return (
    <input
      className={styles.searchInput}
      type="search"
      value={value}
      onChange={handleChange}
      placeholder="Search by client or label"
    />
  );
};

export default ShipmentSearch;
