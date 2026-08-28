import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import debounce from "lodash/debounce";
import { SEARCH_DEBOUNCE_MS } from "../../../constants";
import styles from "./ShipmentSearch.module.css";

interface ShipmentSearchProps {
  onSearch: (query: string) => void;
}

const ShipmentSearch = ({ onSearch }: ShipmentSearchProps) => {
  const [value, setValue] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((next: string) => onSearch(next), SEARCH_DEBOUNCE_MS),
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
      aria-label="Search shipments"
    />
  );
};

export default ShipmentSearch;
