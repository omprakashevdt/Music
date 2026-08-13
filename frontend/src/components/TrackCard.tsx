import { Pressable, View } from "react-native";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { Track } from "@/src/types";

interface Props {
  track: Track;
  size?: number;
  onPress: () => void;
}

export function TrackCard({ track, size = 150, onPress }: Props) {
  return (
    <Pressable
      testID={`track-card-${track.id}`}
      onPress={onPress}
      style={({ pressed }) => ({ width: size, opacity: pressed ? 0.75 : 1 })}
    >
      <Artwork uri={track.artworkUri} seed={track.album} size={size} radius={16} />
      <AppText variant="subtitle" numberOfLines={1} style={{ marginTop: 8 }}>
        {track.title}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
        {track.artist}
      </AppText>
    </Pressable>
  );
}
