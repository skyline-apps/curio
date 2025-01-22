import { User, UserProps } from "@nextui-org/react";

const CurioUser: React.FC<UserProps> = (props) => {
  return (
    <User
      {...props}
      avatarProps={{ classNames: { base: "shrink-0" } }}
      classNames={{ description: "truncate" }}
    />
  );
};

export { CurioUser as User };
