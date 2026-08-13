import { useLocalSearchParams } from "expo-router";

import { CollectionView } from "@/src/components/CollectionView";
import { getTracksByYear } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { Track } from "@/src/types";

export default function YearDetail() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const y = Number(year);
  const { data } = useRepo(() => getTracksByYear(y), [] as Track[], [y]);
  return (
    <CollectionView
      title={String(y)}
      subtitle="Released"
      artworkUri={data[0]?.artworkUri ?? null}
      seed={String(y)}
      tracks={data}
    />
  );
}
