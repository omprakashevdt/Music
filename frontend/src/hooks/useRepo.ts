import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { useLibraryStore } from "@/src/store/libraryStore";

export function useRepo<T>(
  fn: () => Promise<T>,
  initial: T,
  deps: unknown[] = [],
): { data: T; loading: boolean } {
  const version = useLibraryStore((s) => s.version);
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => {
      let alive = true;
      setLoading(true);
      fn()
        .then((r) => {
          if (alive) {
            setData(r);
            setLoading(false);
          }
        })
        .catch(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version, ...deps]),
  );

  return { data, loading };
}
