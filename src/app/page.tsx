import { OS } from "@/os/OS";
import { getOSContent } from "@/os/content/getContent";

export default async function Home() {
  const content = await getOSContent();
  return <OS content={content} />;
}
