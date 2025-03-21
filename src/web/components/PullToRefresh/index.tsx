import SimplePullToRefresh from "react-simple-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactElement;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
}: PullToRefreshProps) => {
  return (
    <SimplePullToRefresh
      onRefresh={onRefresh}
      pullingContent={
        <div className="text-sm text-secondary-800 text-center py-2">
          Pull to refresh...
        </div>
      }
      refreshingContent={
        <div className="text-sm text-secondary-800 text-center py-2">
          Refreshing...
        </div>
      }
      pullDownThreshold={67}
      className="h-full"
    >
      {children}
    </SimplePullToRefresh>
  );
};

export default PullToRefresh;
