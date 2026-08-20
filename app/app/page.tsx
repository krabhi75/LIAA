import { redirect } from "next/navigation";

/** Console routes redirect to the public live desk — no sign-in. */
export default function AppHomePage() {
  redirect("/demo");
}
