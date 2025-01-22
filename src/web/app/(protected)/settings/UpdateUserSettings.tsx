import React, { useContext, useState } from "react";
import { z } from "zod";

import { SettingsSchema } from "@/app/api/v1/user/settings/validation";
import { type Settings } from "@/app/api/v1/user/settings/validation";
import { FormSection } from "@/components/ui/Form";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { SettingsContext } from "@/providers/SettingsProvider";
import { createLogger } from "@/utils/logger";
import { camelCaseToSentenceCase } from "@/utils/string";

const log = createLogger("UpdateUserSettings");

const UpdateUserSettings: React.FC = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<string>("");

  const updateSetting = async <T extends keyof Settings>(
    field: T,
    value: Settings[T],
  ): Promise<void> => {
    if (!settings) {
      return;
    }
    setSubmitting(field);
    setErrorMessage("");
    setSuccessMessage("");
    updateSettings(field, value)
      .then(() => {
        setSuccessMessage("Successfully updated settings.");
        setSubmitting("");
      })
      .catch((error) => {
        log.error("Error updating settings: ", error);
        setErrorMessage("Error updating settings.");
        setSubmitting("");
      });
  };

  const renderField = (
    fieldKey: keyof Settings,
    fieldSchema: z.ZodTypeAny,
  ): JSX.Element => {
    if (!settings) {
      return <></>;
    }
    const value = settings[fieldKey];
    const schema = fieldSchema._def.innerType || fieldSchema;
    if (schema instanceof z.ZodNativeEnum) {
      const enumOptions = Object.values(schema._def.values) as string[];
      return (
        <RadioGroup
          key={fieldKey}
          orientation="horizontal"
          value={value?.toString()}
          onValueChange={(val) =>
            updateSetting(fieldKey, val as Settings[keyof Settings])
          }
        >
          {enumOptions.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
      );
      // TODO(Kim): Enable this when there are boolean settings.
      // } else if (schema instanceof z.ZodBoolean) {
      //   return (
      //     <Switch
      //       isSelected={!!value}
      //       onValueChange={(val) =>
      //         updateSetting(fieldKey, val as Settings[typeof fieldKey])
      //       }
      //     >
      //       {!!value ? "On" : "Off"}
      //     </Switch>
      //   );
    } else {
      return (
        <p className="text-sm text-secondary">{`(Unknown field type for ${fieldKey})`}</p>
      );
    }
  };

  const fields = SettingsSchema.shape as Record<keyof Settings, z.ZodTypeAny>;

  let contents;

  if (!settings) {
    contents = <Spinner className="mt-4" centered />;
  } else {
    contents = (Object.keys(fields) as Array<keyof typeof fields>).map(
      (fieldKey) => (
        <FormSection
          key={fieldKey}
          className="max-w-md"
          title={camelCaseToSentenceCase(fieldKey)}
          description={fields[fieldKey].description}
        >
          {renderField(fieldKey, fields[fieldKey])}
          {submitting === fieldKey && <Spinner color="secondary" size="sm" />}
        </FormSection>
      ),
    );
  }

  return (
    <>
      {successMessage && <Toast>{successMessage}</Toast>}
      {errorMessage && <Toast>{errorMessage}</Toast>}
      <div className="max-w-md">{contents}</div>
    </>
  );
};

export default UpdateUserSettings;
