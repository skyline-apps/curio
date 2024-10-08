import React, { useContext, useState } from "react";
import { z } from "zod";

import { type Settings } from "@/app/api/v1/user/settings/validation";
import { FormSection } from "@/components/Form";
import { Radio, RadioGroup } from "@/components/Radio";
import { Spinner } from "@/components/Spinner";
import Toast from "@/components/Toast";
import { SettingsContext } from "@/providers/SettingsProvider";
import { createLogger } from "@/utils/logger";
import { camelCaseToSentenceCase } from "@/utils/string";

import { SettingsSchema } from "../api/v1/user/settings/validation";

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

  const fields = SettingsSchema.shape;

  if (!settings) {
    return <Spinner />;
  }

  return (
    <>
      <div className="h-6">
        {successMessage && (
          <Toast className="text-success">{successMessage}</Toast>
        )}
        {errorMessage && <Toast className="text-danger">{errorMessage}</Toast>}
      </div>
      <div>
        {(Object.keys(fields) as Array<keyof typeof fields>).map((fieldKey) => (
          <FormSection
            key={fieldKey}
            className="max-w-md"
            title={camelCaseToSentenceCase(fieldKey)}
            description={fields[fieldKey].description}
          >
            {renderField(fieldKey, fields[fieldKey])}
            {submitting === fieldKey && <Spinner color="secondary" size="sm" />}
          </FormSection>
        ))}
      </div>
    </>
  );
};

export default UpdateUserSettings;
