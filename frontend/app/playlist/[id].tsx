import { useLocalSearchParams, useRouter } from "expo-router";
import { PencilSimple } from "phosphor-react-native";
import { Pressable } from "react-native";

import { CollectionView } from "@/src/components/CollectionView";
import { getPlaylist, getPlaylistTracks } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Playlist, Track } from "@/src/types";

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = String(id);
  const router = useRouter();
  const { colors } = useTheme();
  const { data } = useRepo(
    async () => ({
      playlist: await getPlaylist(pid),
      tracks: await getPlaylistTracks(pid),
    }),
    { playlist: null as Playlist | null, tracks: [] as Track[] },
    [pid],
  );

  const cover = data.playlist?.coverImagePath ?? data.tracks[0]?.artworkUri ?? null;

  return (
    <CollectionView
      title={data.playlist?.name ?? "Playlist"}
      subtitle={data.playlist?.description ?? "Playlist"}
      artworkUri={cover}
      seed={pid}
      tracks={data.tracks}
      emptyMessage="Add songs from any list using the ••• menu → Add to playlist."
      headerRight={
        <Pressable
          testID="playlist-edit"
          onPress={() => router.push(`/playlist/edit/${pid}`)}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surfaceSecondary,
          }}
        >
          <PencilSimple size={20} color={colors.onSurface} />
        </Pressable>
      }
    />
  );
}
