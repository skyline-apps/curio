import React from "react";

import { cn } from "@/utils/cn";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
  className,
  children,
  ...props
}: FormProps) => {
  return (
    <form {...props} className={cn("flex flex-col gap-2", className)}>
      {children}
    </form>
  );
};

export default Form;

interface FormSectionProps extends React.PropsWithChildren {
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  successMessage?: string;
  errorMessage?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  className,
  title,
  description,
  actions,
  successMessage,
  errorMessage,
  children,
}: FormSectionProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && <h3>{title}</h3>}
      {description && <p className="text-secondary text-sm">{description}</p>}
      <div className={"flex flex-row gap-2"}>{children}</div>
      <div className="flex flex-row gap-2 justify-between">
        <div>
          {successMessage && (
            <p className="text-success text-xs">{successMessage}</p>
          )}
          {errorMessage && (
            <p className="text-danger text-xs">{errorMessage}</p>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
};
