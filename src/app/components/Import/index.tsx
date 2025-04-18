import Button from "@app/components/ui/Button";
import { SettingsContext } from "@app/providers/Settings";
import { JobStatus, JobType } from "@app/schemas/db";
import { useContext, useEffect, useState } from "react";
import { HiMiniArrowPath } from "react-icons/hi2";

import { InstapaperImportModal } from "./InstapaperImportModal";

const statusStyles: Record<JobStatus, string> = {
  [JobStatus.PENDING]: "bg-secondary-300 dark:bg-secondary-600",
  [JobStatus.RUNNING]: "bg-primary-300 dark:bg-primary-600",
  [JobStatus.COMPLETED]: "bg-success-300 dark:bg-success-600",
  [JobStatus.FAILED]: "bg-danger-300 dark:bg-danger-600",
};

const jobTypeDisplay: Record<JobType, string> = {
  [JobType.IMPORT_INSTAPAPER]: "Instapaper import",
  [JobType.IMPORT_OMNIVORE]: "Omnivore import",
};

type ImportJobsProps = Record<never, never>;

export const Import: React.FC<ImportJobsProps> = () => {
  const { importJobs, loadImportJobs, isLoadingImportJobs } =
    useContext(SettingsContext);

  const [showInstapaperModal, setShowInstapaperModal] = useState(false);

  useEffect(() => {
    loadImportJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = (): void => {
    loadImportJobs(true);
  };

  return (
    <div className="space-y-4">
      <Button
        size="sm"
        color="primary"
        onPress={() => setShowInstapaperModal(true)}
      >
        Import from Instapaper
      </Button>
      {importJobs.length > 0 && (
        <>
          <div className="flex justify-between">
            <h3>Past jobs</h3>
            <Button
              isIconOnly
              size="xs"
              isLoading={isLoadingImportJobs}
              onPress={handleRefresh}
            >
              <HiMiniArrowPath />
            </Button>
          </div>
          <ul className="divide-y divide-divider !mt-0 max-h-[250px] overflow-y-auto">
            {importJobs.map((job) => {
              const { processedItems, totalItems } = job.metadata || {};
              return (
                <li
                  key={job.id}
                  className="py-2 flex justify-between items-center gap-4"
                >
                  <div>
                    <p className="text-sm">
                      {jobTypeDisplay[job.type] || "Unknown"}
                    </p>
                    <p className="text-xs text-secondary-600">
                      Created: {new Date(job.createdAt).toLocaleString()}
                    </p>
                    {job.errorMessage && (
                      <p className="text-xs text-danger">
                        Error: {job.errorMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full ${statusStyles[job.status]}`}
                    >
                      {job.status}
                    </span>
                    <p className="text-secondary">
                      {totalItems && ` (${processedItems || 0}/${totalItems})`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <InstapaperImportModal
        isOpen={showInstapaperModal}
        onClose={() => setShowInstapaperModal(false)}
      />
    </div>
  );
};
