import { INPUT_CLASSES } from "@app/components/ui/Input";
import {
  Autocomplete as HerouiAutocomplete,
  AutocompleteProps as HerouiAutocompleteProps,
} from "@heroui/react";
import React from "react";

export { AutocompleteItem, AutocompleteSection } from "@heroui/react";

export type CurioAutocompleteProps<T extends object> = Omit<
  HerouiAutocompleteProps<T>,
  "children"
> & {
  children: (item: T) => React.JSX.Element;
};

export const Autocomplete = <T extends object>({
  ...props
}: CurioAutocompleteProps<T>): React.ReactElement => {
  const componentProps: HerouiAutocompleteProps<T> = {
    ...props,
    inputProps: {
      ...props.inputProps,
      variant: props.variant,
      classNames: {
        inputWrapper: INPUT_CLASSES,
        input:
          "placeholder:text-secondary-400 dark:placeholder:text-secondary-900",
      },
    },
  };
  return <HerouiAutocomplete<T> {...componentProps} />;
};
