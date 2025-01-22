import { Spinner, SpinnerProps } from "@nextui-org/react";

interface CurioSpinnerProps extends SpinnerProps {
  centered?: boolean;
}

const CurioSpinner: React.FC<CurioSpinnerProps> = ({
  centered = false,
  ...props
}: CurioSpinnerProps) => {
  const spinner = <Spinner color="secondary" {...props} />;
  if (centered) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        {spinner}
      </div>
    );
  }
  return spinner;
};

export default CurioSpinner;
