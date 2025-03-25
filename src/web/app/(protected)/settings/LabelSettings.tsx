"use client";

import Labels from "@web/components/Labels";
import { FormSection } from "@web/components/ui/Form";
import { useSettings } from "@web/providers/SettingsProvider";
import { createLogger } from "@web/utils/logger";
import React from "react";

const log = createLogger("LabelSettings");

const LabelSettings: React.FC = () => {
  const { labels, loadingLabels, createLabel, updateLabel, deleteLabel } =
    useSettings();

  return (
    <div className="space-y-4">
      <FormSection title="Labels" description="Manage item labels">
        {!labels ? null : (
          <Labels
            labels={labels}
            loading={loadingLabels}
            mode="create"
            onAdd={async (label) => {
              try {
                await createLabel(label);
              } catch (error) {
                log.error("Unexpected error in label creation", error);
              }
            }}
            onDelete={async (labelId) => {
              try {
                await deleteLabel(labelId);
              } catch (error) {
                log.error("Unexpected error in label deletion", error);
              }
            }}
            onRename={async (labelId, updates) => {
              try {
                await updateLabel(labelId, updates);
              } catch (error) {
                log.error("Unexpected error in label update", error);
              }
            }}
          />
        )}
      </FormSection>
    </div>
  );
};

export default LabelSettings;
