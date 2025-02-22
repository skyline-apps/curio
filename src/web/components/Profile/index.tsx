import React, { useEffect, useRef } from "react";

import ItemGrid from "@/components/Items/ItemGrid";
import Spinner from "@/components/ui/Spinner";

import { useProfile } from "./useProfile";

interface ProfileProps {
  username: string;
}

const Profile: React.FC<ProfileProps> = ({ username }: ProfileProps) => {
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

  // Track initial load
  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchItems(true);
    }
  }, [fetchItems]);

  if (isLoading && !profile) {
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
      <div className="flex flex-col items-center border-b border-secondary-200 py-4">
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
        />
      </div>
    </div>
  );
};

export default Profile;
