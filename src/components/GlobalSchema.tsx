import { Helmet } from "react-helmet-async";
import { globalSchemaGraph } from "../lib/seo/schema";

export default function GlobalSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(globalSchemaGraph())}</script>
    </Helmet>
  );
}
