import { Skeleton } from "@app/components/ui/Skeleton";
import { User, UserProps } from "@heroui/react";

const CurioUser: React.FC<UserProps> = ({ name, ...props }: UserProps) => {
  const loadingName = name ? (
    <div className="h-5">{name}</div>
  ) : (
    <Skeleton className="rounded-lg">
      <div className="w-32 h-5" />
    </Skeleton>
  );

  return (
    <User
      {...props}
      name={loadingName}
      avatarProps={{ classNames: { base: "shrink-0" } }}
      classNames={{ description: "truncate" }}
    />
  );
};

export { CurioUser as User };
