import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  page,
  totalPages,
  totalItems,
  hasNextPage,
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

  return (
    <div className={styles.pagination}>
      <button onClick={handlePrev} disabled={isLoading || page <= 1}>
        Previous
      </button>
      <span className={styles.pageInfo}>
        Page {page} of {totalPages} ({totalItems} shipments)
      </span>
      <button onClick={handleNext} disabled={isLoading || !hasNextPage}>
        Next
      </button>
    </div>
  );
};

export default Pagination;
