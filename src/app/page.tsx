import { OS } from "@/os/OS";
import { getContent } from "@/os/content/getContent";

export default async function Home() {
  const content = await getContent();
  return <OS content={content} />;
}
