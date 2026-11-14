import React from "react";
import { Redirect } from "expo-router";

export default function IndexScreen(): React.ReactElement {
  return <Redirect href="/editor" />;
}
