"use client";

import { SettingsSchema } from "@web/app/api/v1/user/settings/validation";
import { type SettingsResponse } from "@web/app/api/v1/user/settings/validation";
import { FormSection } from "@web/components/ui/Form";
import { Radio, RadioGroup } from "@web/components/ui/Radio";
import Spinner from "@web/components/ui/Spinner";
import { Switch } from "@web/components/ui/Switch";
import { useSettings } from "@web/providers/SettingsProvider";
import { useToast } from "@web/providers/ToastProvider";
import { createLogger } from "@web/utils/logger";
import { camelCaseToSentenceCase } from "@web/utils/string";
import React, { useState } from "react";
import { z } from "zod";

const log = createLogger("UpdateUserSettings");

const UpdateUserSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState<string>("");

  const updateSetting = async <T extends keyof SettingsResponse>(
    field: T,
    value: SettingsResponse[T],
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
    fieldKey: keyof SettingsResponse,
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
              val as SettingsResponse[keyof SettingsResponse],
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
              val as SettingsResponse[keyof SettingsResponse],
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
    keyof SettingsResponse,
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
