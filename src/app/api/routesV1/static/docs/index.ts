import { EnvBindings } from "@app/api/utils/env";
import docs from "@app/utils/content/docs";
import { getStaticPageHtml, renderMarkdown } from "api/routesV1/static/utils";
import { Hono } from "hono";

const staticDocsRouter = new Hono<EnvBindings>();

// eslint-disable-next-line @local/eslint-local-rules/api-validation,@local/eslint-local-rules/api-middleware,@local/eslint-local-rules/response-parse
staticDocsRouter.get("/", async (c) => {
  const docsHtml = renderMarkdown(docs);
  const bodyContent = `<h1>Curio user guide</h1>
    <div class="prose max-w-none">
        ${docsHtml}
    </div>`;

  return c.html(getStaticPageHtml("Curio user guide", bodyContent));
});

export { staticDocsRouter };
