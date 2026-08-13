import { useLocalSearchParams } from "expo-router";

import { CollectionView } from "@/src/components/CollectionView";
import { getTracksByGenre } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { Track } from "@/src/types";

export default function GenreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const name = String(id);
  const { data } = useRepo(() => getTracksByGenre(name), [] as Track[], [name]);
  return (
    <CollectionView
      title={name}
      subtitle="Genre"
      artworkUri={data[0]?.artworkUri ?? null}
      seed={name}
      tracks={data}
    />
  );
}
