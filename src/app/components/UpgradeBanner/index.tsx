import Button from "@app/components/ui/Button";
import { useSettings } from "@app/providers/Settings";
import { HiMiniXMark } from "react-icons/hi2";

const UPGRADE_PROMPTS = [
  "Support independent software. Upgrade to Curio Premium today.",
  "Enjoying Curio? Support us by becoming a paid Curio supporter.",
];

function getUpgradePromptOfTheDay(): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % UPGRADE_PROMPTS.length;
  return UPGRADE_PROMPTS[idx];
}

type UpgradeBannerProps = Record<never, never>;

const UpgradeBanner: React.FC<UpgradeBannerProps> = () => {
  const { shouldShowUpgradeBanner, dismissUpgradeBanner } = useSettings();
  if (!shouldShowUpgradeBanner) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning-400 bg-opacity-70 backdrop-blur-md border-b border-warning/40 p-2 flex items-center shadow-xl">
      <div className="flex flex-grow items-center justify-center">
        <p className="text-sm font-medium text-warning-900 drop-shadow-sm">
          {getUpgradePromptOfTheDay()}
        </p>
      </div>
      <Button
        isIconOnly
        variant="light"
        color="warning"
        onPress={dismissUpgradeBanner}
        size="xs"
        className="justify-self-end"
      >
        <HiMiniXMark className="text-warning-900" />
      </Button>
    </div>
  );
};

export default UpgradeBanner;
