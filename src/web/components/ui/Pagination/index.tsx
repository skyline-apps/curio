import { Pagination, type PaginationProps } from "@heroui/react";

export const DEFAULT_PAGE_SIZE = 10;

const CurioPagination: React.FC<PaginationProps> = (props) => {
  return (
    <Pagination
      disableAnimation
      disableCursorAnimation
      classNames={{
        wrapper: "bg-transparent",
        base: "bg-transparent",
        item: "bg-transparent data-[active=true]:bg-transparent data-[active=true]:border-b [&[data-hover=true]:not([data-active=true])]:bg-background-300",
        prev: "bg-transparent [&[data-hover=true]:not([data-active=true])]:bg-background-300",
        next: "bg-transparent [&[data-hover=true]:not([data-active=true])]:bg-background-300",
      }}
      {...props}
    />
  );
};

export default CurioPagination;
