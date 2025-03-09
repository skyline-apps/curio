import fs from "fs";

const API_HOSTNAME = process.env.API_HOSTNAME || "http://localhost:3000";
const BYPASS = process.env.BYPASS || "";
const API_KEY = process.env.API_KEY || "";
const CONTENT_ENDPOINT = `${API_HOSTNAME}/api/v1/items/content`;

async function sendItemContent(url: string, contentPath: string) {
    let htmlContent: string;
    if (fs.existsSync(contentPath)) {
        htmlContent = await fs.promises.readFile(contentPath, "utf-8");
    } else {
        console.error(`Invalid file: ${contentPath}`);
        return;
}
    const response = await fetch(CONTENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY, 'x-vercel-protection-bypass': BYPASS },
        body: JSON.stringify({ htmlContent, url, skipMetadataExtraction: false }),
    });

    if (!response.ok) {
        console.error(`Error sending content for ${url} at ${contentPath}: ${await response.text()}`);
    } else {
        console.log(`Successfully updated content for ${url} at ${contentPath}`);
    }
}

const url = process.argv[2];
const htmlFilePath = process.argv[3];

if (!url || !htmlFilePath) {
    console.error("Usage: npm run update -- <url> <html-file-path>");
    process.exit(1);
}

sendItemContent(url, htmlFilePath).catch((error) => console.error(error));
