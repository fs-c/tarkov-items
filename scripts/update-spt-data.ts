import { Readable } from 'stream';
import { mkdir, writeFile } from 'fs/promises';
import { finished } from 'stream/promises';
import { createWriteStream } from 'fs';

const locations = [
    'bigmap',
    'factory4_day',
    'factory4_night',
    'interchange',
    'laboratory',
    'lighthouse',
    'rezervbase',
    'sandbox',
    'sandbox_high',
    'shoreline',
    'tarkovstreets',
    'woods',
] as const;

const sptDatabaseUrl =
    'https://raw.githubusercontent.com/sp-tarkov/server/refs/heads/master/project/assets/database';
const sptGitLfsUrl = 'https://lfs.sp-tarkov.com/sp-tarkov/server';

const localDestinationPath = 'public/database';

// see https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md
const getGitLfsDownloadUrl = async (oid: string, size: number): Promise<string | null> => {
    const response = await fetch(`${sptGitLfsUrl}/objects/batch`, {
        method: 'POST',
        headers: {
            Accept: 'application/vnd.git-lfs+json',
            'Content-Type': 'application/vnd.git-lfs+json',
        },
        body: JSON.stringify({
            operation: 'download',
            transfers: ['basic'],
            objects: [{ oid, size }],
        }),
    });

    try {
        const data = (await response.json()) as {
            objects: { actions: { download: { href: string } } }[];
        };

        return data.objects[0].actions.download.href;
    } catch {
        // just in case the response is not what we expect
        return null;
    }
};

const downloadSptFile = async (
    relativeOriginPath: string,
    relativeDestinationPath: string,
): Promise<void> => {
    const response = await fetch(`${sptDatabaseUrl}/${relativeOriginPath}`);
    const responseText = await response.text();

    // some of the files are on a custom git-lfs server, so we need to check whether or not this is the case
    if (responseText.startsWith('version https://git-lfs.github.com/spec/v1')) {
        const oidMatch = responseText.match(/oid sha256:(\w+)/);
        const sizeMatch = responseText.match(/size (\d+)/);
        if (!oidMatch || !sizeMatch) {
            console.error(`! failed to parse git-lfs file for ${relativeOriginPath}`);
            return;
        }

        const oid = oidMatch[1];
        const size = Number(sizeMatch[1]);

        const downloadUrl = await getGitLfsDownloadUrl(oid, size);
        if (!downloadUrl) {
            console.error(`! failed to get download url for ${relativeOriginPath}`);
            return;
        }

        const downloadResponse = await fetch(downloadUrl);
        if (downloadResponse.body) {
            await finished(
                Readable.fromWeb(downloadResponse.body).pipe(
                    createWriteStream(`${localDestinationPath}/${relativeDestinationPath}`),
                ),
            );
        }
    } else {
        await writeFile(`${localDestinationPath}/${relativeDestinationPath}`, responseText);
    }

    console.log(`+ downloaded ${relativeOriginPath} to ${relativeDestinationPath}`);
};

for (const location of locations) {
    console.log(`> downloading data for ${location}`);

    await mkdir(`${localDestinationPath}/${location}`, { recursive: true });

    await downloadSptFile(`locations/${location}/looseLoot.json`, `${location}/looseLoot.json`);
    await downloadSptFile(
        `locations/${location}/staticContainers.json`,
        `${location}/staticContainers.json`,
    );
    await downloadSptFile(`locations/${location}/staticLoot.json`, `${location}/staticLoot.json`);
}

console.log(`> downloading en translation`);
await downloadSptFile(`locales/global/en.json`, `translations.json`);

console.log(`> writing metadata file`);
await writeFile(
    `${localDestinationPath}/metadata.json`,
    JSON.stringify({ lastUpdated: new Date() }),
);
