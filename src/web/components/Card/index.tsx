import { Card, CardProps } from "@nextui-org/react";

import { cn } from "@/utils/cn";

const CurioCard: React.FC<CardProps> = ({ className, ...props }: CardProps) => {
  return <Card {...props} className={cn("rounded-sm p-2", className)} />;
};

export default CurioCard;
