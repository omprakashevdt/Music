import { useLocalSearchParams } from "expo-router";

import { CollectionView } from "@/src/components/CollectionView";
import { getTracksByAlbum } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { Track } from "@/src/types";

export default function AlbumDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const name = String(id);
  const { data } = useRepo(() => getTracksByAlbum(name), [] as Track[], [name]);
  const first = data[0];
  return (
    <CollectionView
      title={name}
      subtitle={first ? `${first.artist}${first.year ? ` · ${first.year}` : ""}` : ""}
      artworkUri={first?.artworkUri ?? null}
      seed={name}
      tracks={data}
      showTrackArtwork={false}
    />
  );
}
