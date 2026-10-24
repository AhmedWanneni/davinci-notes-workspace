import React, { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function NoteViewScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ path?: string; noteId?: string }>();

  useEffect(() => {
    router.replace({
      pathname: "/editor",
      params: { ...params, mode: "preview" },
    });
  }, [router, params]);

  return <View className="flex-1" />;
}
