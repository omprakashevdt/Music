import { useLocalSearchParams } from "expo-router";

import { CollectionView } from "@/src/components/CollectionView";
import { getTracksByArtist } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { Track } from "@/src/types";
import { pluralize } from "@/src/utils/format";

export default function ArtistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const name = String(id);
  const { data } = useRepo(() => getTracksByArtist(name), [] as Track[], [name]);
  const albums = new Set(data.map((t) => t.album)).size;
  return (
    <CollectionView
      title={name}
      subtitle={pluralize(albums, "album")}
      artworkUri={data[0]?.artworkUri ?? null}
      seed={name}
      tracks={data}
      circle
    />
  );
}
