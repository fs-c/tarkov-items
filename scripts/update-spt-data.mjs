/**
 * This sucks for a lot of reasons but I don't want to spend more time on getting
 * data from spt.
 */

import { Readable } from 'stream';
import { mkdir, writeFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import { finished } from 'stream/promises';

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
];

const sptDatabaseUrl =
    'https://dev.sp-tarkov.com/SPT/Server/media/branch/master/project/assets/database/';

const localDatabasePath = 'src/database/';

const downloadSptFile = async (relativeOriginPath, relativeDestinationPath) => {
    const stream = (await fetch(`${sptDatabaseUrl}${relativeOriginPath}`)).body;

    if (stream) {
        await finished(
            Readable.fromWeb(stream).pipe(
                createWriteStream(
                    `${localDatabasePath}${relativeDestinationPath}`,
                ),
            ),
        );

        console.log(
            `+ downloaded ${relativeOriginPath} to ${relativeDestinationPath}`,
        );
    } else {
        console.error(`! failed to download ${relativeOriginPath}`);
    }
};

for (const location of locations) {
    console.log(`> downloading data for ${location}`);

    mkdir(`${localDatabasePath}${location}`, { recursive: true });

    await downloadSptFile(
        `locations/${location}/looseLoot.json`,
        `${location}/looseLoot.json`,
    );
    await downloadSptFile(
        `locations/${location}/staticContainers.json`,
        `${location}/staticContainers.json`,
    );
    await downloadSptFile(
        `locations/${location}/staticLoot.json`,
        `${location}/staticLoot.json`,
    );
}

console.log(`> downloading en translation`);
await downloadSptFile(`locales/global/en.json`, `translations.json`);

console.log(`> writing metadata file`);
await writeFile(
    `${localDatabasePath}metadata.json`,
    JSON.stringify({ lastUpdated: new Date() }),
);
