import { Table as LibraryTable, type TableProps } from "@heroui/react";

export const Table: React.FC<TableProps> = (props) => {
  return (
    <LibraryTable
      classNames={{
        th: "bg-background-700",
      }}
      {...props}
    />
  );
};

export {
  getKeyValue,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
