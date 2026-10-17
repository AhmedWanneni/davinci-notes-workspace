import { Redirect } from "expo-router";

export default function NewNoteActionScreen() {
  return <Redirect href="/editor?preset=new" />;
}
