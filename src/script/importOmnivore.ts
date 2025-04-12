import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import fetch from "node-fetch";

const API_HOSTNAME = process.env.API_HOSTNAME || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "";
const ITEMS_ENDPOINT = `${API_HOSTNAME}/api/v1/items`;
const CONTENT_ENDPOINT = `${API_HOSTNAME}/api/v1/items/content`;
const BATCH_SIZE = 100;

function convertUrl(url: string) {
    return url.replace(/^https:\/\/omnivore.app\/no_url\?q=/, "https://omnivore.app/no_url/");
}

async function unzipFile(zipFilePath: string, outputDir: string) {
    return new Promise<void>((resolve, reject) => {
        fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: outputDir }))
            .on("close", resolve) // Ensure the extraction completes
            .on("error", reject);
    });
}

async function readJsonFile<T>(filePath: string): Promise<T> {
    const data = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(data);
}

async function sendItems(items: any[]) {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE).map((item) => ({
            ...item,
            url: convertUrl(item.url),
            metadata: {
                ...item.metadata,
                description: item.metadata.description?.substring(0, 2048),
                stateUpdatedAt: item.metadata.savedAt,
            }
        }));
        const response = await fetch(ITEMS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
            body: JSON.stringify({ items: batch }),
        });

        if (!response.ok) {
            console.error(batch);
            throw new Error(`Error sending items: ${await response.text()}`);
        }
    }
}

async function sendItemContent(url: string, htmlContent: string, contentPath: string) {
    const response = await fetch(CONTENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({ htmlContent, url: convertUrl(url), skipMetadataExtraction: true }),
    });

    if (!response.ok) {
        console.error(`Error sending content for ${url} at ${contentPath}: ${await response.text()}`);
    }
}

async function processZip(zipFilePath: string) {
    const outputDir = path.join(__dirname, "generated");
    await unzipFile(zipFilePath, outputDir);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const metadataFiles = fs
        .readdirSync(outputDir)
        .filter((file) => file.startsWith("metadata_") && file.endsWith(".json"));

    for (const metadataFile of metadataFiles) {
        const items = await readJsonFile<any[]>(path.join(outputDir, metadataFile));

        const formattedItems = items.map((item) => ({
            url: item.url,
            metadata: {
                title: item.title,
                description: item.description || null,
                author: item.author || null,
                thumbnail: item.thumbnail || null,
                publishedAt: item.publishedAt,
                savedAt: item.savedAt,
                stateUpdatedAt: item.updatedAt,
                state: item.state.toLowerCase(),
                isFavorite: false,
                readingProgress: item.readingProgress || 0,
                lastReadAt: null,
                versionName: null,
            },
        }));

        await sendItems(formattedItems);

        for (const item of items) {
            const contentPath = path.join(outputDir, "content", `${item.slug}.html`);
            if (fs.existsSync(contentPath)) {
                const htmlContent = await fs.promises.readFile(contentPath, "utf-8");
                await sendItemContent(item.url, htmlContent, contentPath);
            }
        }
    }

    console.log("Processing complete.");
}

const zipFilePath = process.argv[2];
if (!zipFilePath) {
    console.error("Usage: npm run import:omnivore -- <zip-file-path>");
    process.exit(1);
}

processZip(zipFilePath).catch((error) => console.error(error));
