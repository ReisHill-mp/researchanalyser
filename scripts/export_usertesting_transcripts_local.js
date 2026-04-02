#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PWCLI = path.join(
  process.env.HOME,
  '.codex',
  'skills',
  'playwright',
  'scripts',
  'playwright_cli.sh'
);
const BASE_OUTPUT_DIR = process.cwd();
const SLEEP_BUFFER = new SharedArrayBuffer(4);
const SLEEP_VIEW = new Int32Array(SLEEP_BUFFER);

function runPw(args) {
  return execFileSync(PWCLI, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      CODEX_HOME:
        process.env.CODEX_HOME || path.join(process.env.HOME, '.codex'),
    },
    maxBuffer: 20 * 1024 * 1024,
  });
}

function clickRef(ref) {
  return runPw(['click', ref]);
}

function sleepMs(ms) {
  Atomics.wait(SLEEP_VIEW, 0, 0, ms);
}

function parseInlineSnapshot(output) {
  const urlMatch = output.match(/- Page URL: (.+)\n/);
  const snapshotMatch = output.match(/### Snapshot\s+```yaml\n([\s\S]*?)\n```/);

  if (!urlMatch || !snapshotMatch) {
    return null;
  }

  return {
    snapshotPath: '',
    snapshotText: snapshotMatch[1],
    pageUrl: urlMatch[1].trim(),
  };
}

function snapshotPage() {
  const output = runPw(['snapshot']);
  const fileMatch = output.match(/\[Snapshot\]\((.+)\)/);
  const urlMatch = output.match(/- Page URL: (.+)\n/);

  if (fileMatch && urlMatch) {
    const snapshotPath = path.resolve(process.cwd(), fileMatch[1]);
    const snapshotText = fs.readFileSync(snapshotPath, 'utf8');
    return { snapshotPath, snapshotText, pageUrl: urlMatch[1].trim() };
  }

  const inline = parseInlineSnapshot(output);
  if (inline) return inline;

  throw new Error(`Unable to parse snapshot output:\n${output}`);
}

function waitForVideoPage(attempts = 12) {
  for (let i = 0; i < attempts; i += 1) {
    const snap = snapshotPage();
    if (snap.pageUrl.includes('/v/')) return snap.pageUrl;
    sleepMs(1000);
  }
  return '';
}

function waitForUrlChange(previousUrl, attempts = 12) {
  for (let i = 0; i < attempts; i += 1) {
    const snap = snapshotPage();
    if (snap.pageUrl && snap.pageUrl !== previousUrl) return snap.pageUrl;
    sleepMs(1000);
  }
  return '';
}

function normalizeTranscript(rawText) {
  return rawText
    .replace(
      /__TRANSCRIPT_HEADING_START__\s*\n([^\n]+)\n__TRANSCRIPT_HEADING_END__/g,
      '$1'
    )
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .concat('\n');
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseArgs(argv) {
  const parsed = {
    out: '',
    max: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      parsed.out = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--max') {
      parsed.max = Number(argv[i + 1] || '0');
      i += 1;
    }
  }

  return parsed;
}

function dismissCookieBannerIfPresent() {
  const snap = snapshotPage();
  const acceptAllRef =
    snap.snapshotText.match(/button "Accept all" \[ref=(e\d+)\]/)?.[1] || '';

  if (acceptAllRef) {
    clickRef(acceptAllRef);
    sleepMs(1000);
  }
}

function parseSessionsPage(snapshotText) {
  const titleMatch = snapshotText.match(/heading "([^"]+)" \[level=1]/);
  const playRefs = Array.from(
    snapshotText.matchAll(
      /button "Click to play video" \[ref=(e\d+)\]/g
    )
  ).map((match) => match[1]);

  return {
    studyTitle: titleMatch ? titleMatch[1].trim() : '',
    playRefs,
  };
}

function parseTranscriptPage(snapshotText) {
  const nameMatch = snapshotText.match(/button "([^"]+) - Show contributor info"/);
  const smartTagsRef =
    snapshotText.match(/button "Smart tags" \[ref=(e\d+)\]/)?.[1] || '';
  const deselectAllRef =
    snapshotText.match(/button "Deselect all" \[ref=(e\d+)\]/)?.[1] || '';
  const nextVideoRef =
    snapshotText.match(/link "Next video" \[ref=(e\d+)\]/)?.[1] || '';
  const studyUrl =
    snapshotText.match(
      /link "Back to dashboard"[\s\S]*?link "[^"]+"[\s\S]*?- \/url: (\/workspaces\/\d+\/study\/\d+)/
    )?.[1] || '';

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    smartTagsRef,
    deselectAllRef,
    nextVideoRef,
    studyUrl,
  };
}

function extractTranscriptFromSnapshot(snapshotText) {
  const lines = snapshotText.split('\n');
  const docStart = lines.findIndex((line) => line.includes('- document [ref='));
  if (docStart === -1) return '';

  const chunks = [];

  for (let i = docStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const indent = line.match(/^ */)?.[0].length ?? 0;

    if (indent <= 8 && line.trim().startsWith('- ')) {
      break;
    }

    const headingMatch = line.match(
      /heading "__TRANSCRIPT_HEADING_START__ ([^"]+) __TRANSCRIPT_HEADING_END__"/
    );
    if (headingMatch) {
      chunks.push(headingMatch[1].trim());
      continue;
    }

    const paragraphMatch = line.match(/- paragraph(?: \[ref=[^\]]+\])?: (.+)$/);
    if (paragraphMatch) {
      chunks.push(paragraphMatch[1].trim());
    }
  }

  return chunks.join('\n\n');
}

function waitForTranscriptText(attempts = 8) {
  for (let i = 0; i < attempts; i += 1) {
    const snap = snapshotPage();
    const fromSnapshot = extractTranscriptFromSnapshot(snap.snapshotText);
    if (fromSnapshot) return fromSnapshot;
    sleepMs(1000);
  }
  return '';
}

function waitForSessionsPage(attempts = 20) {
  for (let i = 0; i < attempts; i += 1) {
    dismissCookieBannerIfPresent();
    const snap = snapshotPage();
    const sessionsMeta = parseSessionsPage(snap.snapshotText);

    if (snap.pageUrl.includes('/sessions') && sessionsMeta.playRefs.length > 0) {
      return { snap, sessionsMeta };
    }

    sleepMs(1500);
  }

  return null;
}

function ensureTranscriptReady() {
  let snap = snapshotPage();
  let parsed = parseTranscriptPage(snap.snapshotText);

  if (!parsed.name && snap.pageUrl.includes('/sessions')) {
    throw new Error('Still on the sessions list, not inside a transcript page.');
  }

  if (parsed.smartTagsRef) {
    clickRef(parsed.smartTagsRef);
    sleepMs(750);
    snap = snapshotPage();
    parsed = parseTranscriptPage(snap.snapshotText);
  }

  if (parsed.deselectAllRef) {
    clickRef(parsed.deselectAllRef);
    sleepMs(750);
    snap = snapshotPage();
    parsed = parseTranscriptPage(snap.snapshotText);
  }

  return parsed;
}

function resolveOutputDir(outArg, studyTitle, sessionsUrl) {
  if (outArg) {
    return path.isAbsolute(outArg) ? outArg : path.join(BASE_OUTPUT_DIR, outArg);
  }

  const studyIdMatch = sessionsUrl.match(/study\/(\d+)/);
  const studyId = studyIdMatch ? studyIdMatch[1] : 'study';
  const slug = slugify(studyTitle || `usertesting-${studyId}`);
  return path.join(BASE_OUTPUT_DIR, 'Bulk import', slug);
}

function writeManifest(outputDir, sessionsUrl, studyTitle, exported) {
  const manifest = {
    sourceSessionsUrl: sessionsUrl,
    studyTitle,
    exportedAt: new Date().toISOString(),
    count: exported.length,
    files: exported,
  };

  fs.writeFileSync(
    path.join(outputDir, 'export-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
}

function emitProgress(payload) {
  process.stdout.write(`__PROGRESS__${JSON.stringify(payload)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  dismissCookieBannerIfPresent();
  const readySessions = waitForSessionsPage();
  const initialSnap = readySessions?.snap || snapshotPage();
  const url = initialSnap.pageUrl;

  if (!url.includes('/sessions') && !url.includes('/v/')) {
    throw new Error(
      'Open the authenticated UserTesting sessions or transcript page in the current Playwright tab before running this export.'
    );
  }

  const sessionsMeta = readySessions?.sessionsMeta || parseSessionsPage(initialSnap.snapshotText);
  const transcriptMeta = url.includes('/v/')
    ? parseTranscriptPage(initialSnap.snapshotText)
    : null;
  const sessionsUrl = url.includes('/sessions')
    ? url
    : transcriptMeta?.studyUrl
      ? `https://app.usertesting.com${transcriptMeta.studyUrl}/sessions`
      : '';

  if (!sessionsUrl) {
    throw new Error(
      'Could not recover the sessions URL from the current transcript page.'
    );
  }

  const outputDir = resolveOutputDir(args.out, sessionsMeta.studyTitle, sessionsUrl);
  fs.mkdirSync(outputDir, { recursive: true });

  if (url.includes('/sessions') && sessionsMeta.playRefs.length === 0) {
    throw new Error(
      'No playable sessions were found on the current sessions page. Dismiss any overlays and make sure the study session list is visible.'
    );
  }

  const exported = [];
  const defaultTotal = url.includes('/sessions') ? sessionsMeta.playRefs.length : 999;
  const total = args.max > 0 ? Math.min(args.max, defaultTotal) : defaultTotal;

  if (url.includes('/sessions')) {
    clickRef(sessionsMeta.playRefs[0]);
    sleepMs(1000);
    const videoUrl = waitForVideoPage();
    if (!videoUrl) {
      throw new Error('The first session did not open into a video page.');
    }
  }

  for (let i = 0; i < total; i += 1) {
    const parsed = ensureTranscriptReady();
    const transcript = waitForTranscriptText();

    if (!parsed.name || !transcript) {
      throw new Error(`Missing transcript data on iteration ${i + 1}.`);
    }

    const filename = `userTranscript-${sanitizeName(parsed.name)}.md`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      normalizeTranscript(transcript),
      'utf8'
    );
    exported.push(filename);
    emitProgress({
      currentUser: parsed.name,
      currentStep: `Captured ${i + 1} of ${total}`,
      completed: i + 1,
      total,
      message: `Capturing ${parsed.name}...`,
    });

    if (!parsed.nextVideoRef || i === total - 1) {
      break;
    }

    const beforeNextUrl = snapshotPage().pageUrl;
    clickRef(parsed.nextVideoRef);
    const nextUrl = waitForUrlChange(beforeNextUrl);

    if (!nextUrl) {
      throw new Error(`Next video did not load after iteration ${i + 1}.`);
    }
  }

  writeManifest(outputDir, sessionsUrl, sessionsMeta.studyTitle, exported);

  process.stdout.write(
    `__RESULT__${JSON.stringify({
      outputDir,
      sessionsUrl,
      studyTitle: sessionsMeta.studyTitle,
      count: exported.length,
      files: exported,
    })}\n`
  );
}

main();
