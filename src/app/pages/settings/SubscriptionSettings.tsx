import { FormSection } from "@app/components/ui/Form";
import { createLogger } from "@app/utils/logger";
import React from "react";

const log = createLogger("SubscriptionSettings");

const SubscriptionSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <FormSection title="Subscription" description="Become a Curio supporter">
        test
      </FormSection>
    </div>
  );
};

export default SubscriptionSettings;
