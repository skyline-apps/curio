import { Card, CardProps } from "@heroui/react";
import { cn } from "@app/utils/cn";

const CurioCard: React.FC<CardProps> = ({ className, ...props }: CardProps) => {
  return <Card {...props} className={cn("rounded p-4", className)} />;
};

export default CurioCard;
