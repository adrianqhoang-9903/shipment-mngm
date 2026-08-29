import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  page,
  perPage,
  totalPages,
  totalItems,
  isLoading,
  onPageChange,
}: PaginationProps) => {
  const handlePrev = () => {
    onPageChange(page - 1);
  };

  const handleNext = () => {
    onPageChange(page + 1);
  };

  if (totalItems === 0) {
    return null;
  }

  const firstItemIdx = perPage * (page - 1) + 1;
  const lastItemIdx = Math.min(totalItems, perPage * page);

  return (
    <div className={styles.pagination}>
      <button onClick={handlePrev} disabled={isLoading || page <= 1}>
        Previous
      </button>
      <span className={styles.pageInfo}>
        {firstItemIdx}–{lastItemIdx} of {totalItems} shipments
      </span>
      <button onClick={handleNext} disabled={isLoading || page >= totalPages}>
        Next
      </button>
    </div>
  );
};

export default Pagination;
