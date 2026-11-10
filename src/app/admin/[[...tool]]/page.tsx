import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";

/** The admin panel: Sanity Studio, signed in with the owner's Sanity account. */
export default function AdminPage() {
  return (
    <div className="selectable fixed inset-0 overflow-auto">
      <NextStudio config={config} />
    </div>
  );
}
