import React, { useEffect, useRef, useState } from "react";

import ItemGrid from "@web/components/Items/ItemGrid";
import Spinner from "@web/components/ui/Spinner";

import { useProfile } from "./useProfile";

interface ProfileProps {
  username: string;
}

const Profile: React.FC<ProfileProps> = ({ username }: ProfileProps) => {
  const [initializing, setInitializing] = useState<boolean>(true);
  const {
    profile,
    favoriteItems,
    isLoading,
    error,
    hasNextPage,
    fetchItems,
    isFetchingNextPage,
  } = useProfile({
    username,
  });

  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchItems(true);
      setInitializing(false);
    }
  }, [fetchItems]);

  if (initializing || (isLoading && !profile)) {
    return <Spinner centered />;
  }

  if (!profile || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-secondary">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col items-center p-4 w-auto mx-auto border-b border-divider">
        <h1>{profile.username}</h1>
        <p className="text-xs text-secondary italic">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex-1 p-4">
        <ItemGrid
          items={favoriteItems}
          onLoadMore={() => fetchItems()}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
          emptyMessage="No favorites yet."
        />
      </div>
    </div>
  );
};

export default Profile;
