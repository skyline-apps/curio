"use client";

import React, { useContext } from "react";

import Labels from "@/components/Labels";
import { FormSection } from "@/components/ui/Form";
import { SettingsContext } from "@/providers/SettingsProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("LabelSettings");

const LabelSettings: React.FC = () => {
  const { labels, loadingLabels, createLabel, updateLabel, deleteLabel } =
    useContext(SettingsContext);

  return (
    <div className="space-y-4">
      <FormSection title="Labels" description="Manage item labels">
        {!labels ? null : (
          <Labels
            labels={labels}
            loading={loadingLabels}
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
