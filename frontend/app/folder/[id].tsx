import { useLocalSearchParams } from "expo-router";

import { CollectionView } from "@/src/components/CollectionView";
import { getTracksByFolder } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { Track } from "@/src/types";

export default function FolderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const name = String(id);
  const { data } = useRepo(() => getTracksByFolder(name), [] as Track[], [name]);
  return (
    <CollectionView
      title={name}
      subtitle="Folder"
      artworkUri={data[0]?.artworkUri ?? null}
      seed={name}
      tracks={data}
      showTrackArtwork={false}
    />
  );
}
