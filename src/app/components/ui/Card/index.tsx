import { cn } from "@app/utils/cn";
import { Card, CardProps } from "@heroui/react";

const CurioCard: React.FC<CardProps> = ({ className, ...props }: CardProps) => {
  return <Card {...props} className={cn("rounded p-4", className)} />;
};

export default CurioCard;
