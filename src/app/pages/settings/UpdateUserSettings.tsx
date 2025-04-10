import { FormSection } from "@app/components/ui/Form";
import { Radio, RadioGroup } from "@app/components/ui/Radio";
import Spinner from "@app/components/ui/Spinner";
import { Switch } from "@app/components/ui/Switch";
import { useSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { SettingsSchema } from "@app/schemas/v1/user/settings";
import {
  type GetSettingsResponse,
  type UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import { createLogger } from "@app/utils/logger";
import { camelCaseToSentenceCase } from "@app/utils/string";
import React, { useState } from "react";
import { z } from "zod";

const log = createLogger("UpdateUserSettings");

const UpdateUserSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState<string>("");

  const updateSetting = async <T extends keyof UpdateSettingsResponse>(
    field: T,
    value: UpdateSettingsResponse[T],
  ): Promise<void> => {
    if (!settings) {
      return;
    }
    setSubmitting(field);
    updateSettings(field, value)
      .then(() => {
        showToast("Successfully updated settings.", {
          disappearing: true,
          dismissable: true,
        });
        setSubmitting("");
      })
      .catch((error) => {
        log.error("Error updating settings: ", error);
        showToast("Error updating settings.", {
          disappearing: true,
          dismissable: true,
        });
        setSubmitting("");
      });
  };

  const renderField = (
    fieldKey: keyof GetSettingsResponse,
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
            updateSetting(
              fieldKey,
              val as UpdateSettingsResponse[keyof UpdateSettingsResponse],
            )
          }
        >
          {enumOptions.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
      );
    } else if (schema instanceof z.ZodBoolean) {
      return (
        <Switch
          isSelected={!!value}
          onValueChange={(val) =>
            updateSetting(
              fieldKey,
              val as UpdateSettingsResponse[keyof UpdateSettingsResponse],
            )
          }
        >
          {!!value ? "On" : "Off"}
        </Switch>
      );
    } else {
      return (
        <p className="text-sm text-secondary">{`(Unknown field type for ${fieldKey})`}</p>
      );
    }
  };

  const fields = SettingsSchema.shape as Record<
    keyof GetSettingsResponse,
    z.ZodTypeAny
  >;

  let contents;

  if (!settings) {
    contents = <Spinner className="mt-4" centered />;
  } else {
    contents = (Object.keys(fields) as Array<keyof typeof fields>).map(
      (fieldKey) => (
        <FormSection
          key={fieldKey}
          title={camelCaseToSentenceCase(fieldKey)}
          description={fields[fieldKey].description}
        >
          {renderField(fieldKey, fields[fieldKey])}
          {submitting === fieldKey && <Spinner color="secondary" size="sm" />}
        </FormSection>
      ),
    );
  }

  return <div className="space-y-4">{contents}</div>;
};

export default UpdateUserSettings;
