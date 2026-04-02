#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawn } = require('child_process');

const EXPORTER = path.join(__dirname, 'export_usertesting_transcripts_local.js');
const PLAYWRIGHT_CLI = path.join(
  os.homedir(),
  '.codex',
  'skills',
  'playwright',
  'scripts',
  'playwright_cli.sh'
);

function parseArgs(argv) {
  const parsed = {
    projectId: '',
    appUrl: 'http://localhost:3000',
    out: '',
    sessionsUrl: '',
    skipExport: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project-id') {
      parsed.projectId = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--app-url') {
      parsed.appUrl = argv[i + 1] || parsed.appUrl;
      i += 1;
    } else if (arg === '--out') {
      parsed.out = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--sessions-url') {
      parsed.sessionsUrl = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--skip-export') {
      parsed.skipExport = true;
    }
  }

  return parsed;
}

function usage() {
  console.error(
    [
      'Usage:',
      '  node scripts/import_usertesting_results.js --project-id <uuid> --out "Bulk import/my-study" [--sessions-url https://app.usertesting.com/.../sessions] [--app-url http://localhost:3000] [--skip-export]',
      '',
      'Notes:',
      '  - The script will re-open the saved UserTesting /sessions URL in the current Playwright browser before export.',
      '  - If --sessions-url is omitted, it will use the saved project UserTesting URL from the app API.',
      '  - Without --skip-export, this script will run the local transcript exporter first.',
      '  - Then it will POST the exported sessions/transcripts into /api/projects/:id/import-results.',
    ].join('\n')
  );
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

function resolveOutputDir(outArg) {
  if (!outArg) return '';
  return path.isAbsolute(outArg) ? outArg : path.join(process.cwd(), outArg);
}

function readManifest(outputDir) {
  const manifestPath = path.join(outputDir, 'export-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing export manifest at ${manifestPath}`);
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function usernameFromFilename(filename) {
  return filename.replace(/^userTranscript-/, '').replace(/\.md$/, '');
}

function buildPayload(manifest, outputDir) {
  const sessions = [];
  const transcripts = [];

  manifest.files.forEach((filename, index) => {
    const username = usernameFromFilename(filename);
    const sessionId = `${slugify(username || `session-${index + 1}`)}-${index + 1}`;
    const transcriptPath = path.join(outputDir, filename);
    const transcriptText = fs.readFileSync(transcriptPath, 'utf8');

    sessions.push({
      sessionId,
      username,
      sessionUrl: manifest.sourceSessionsUrl,
      videoLength: '',
    });

    transcripts.push({
      sessionId,
      participantId: sanitizeName(username) || `participant-${index + 1}`,
      transcript: transcriptText,
    });
  });

  return {
    status: 'complete',
    sessions,
    transcripts,
  };
}

async function postResults(appUrl, projectId, payload) {
  const endpoint = `${appUrl.replace(/\/$/, '')}/api/projects/${projectId}/import-results`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = body.details ? ` (${body.details})` : '';
    throw new Error(
      `Import results POST failed (${response.status}): ${body.error || response.statusText}${details}`
    );
  }

  return body;
}

async function fetchProject(appUrl, projectId) {
  const endpoint = `${appUrl.replace(/\/$/, '')}/api/projects/${projectId}`;
  const response = await fetch(endpoint);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Project fetch failed (${response.status}): ${body.error || response.statusText}`
    );
  }

  return body;
}

async function fetchImportStatus(appUrl, projectId) {
  const endpoint = `${appUrl.replace(/\/$/, '')}/api/projects/${projectId}/import-transcripts`;
  const response = await fetch(endpoint);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return body;
}

async function postProgress(appUrl, projectId, progressLog, progress) {
  return postResults(appUrl, projectId, {
    status: 'running',
    currentStep: progress.currentStep,
    currentUser: progress.currentUser,
    progressLog,
    discoveredCount: progress.completed || 0,
    importedCount: Math.max(0, (progress.completed || 0) - 1),
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeUserTestingSessionsUrl(rawUrl) {
  const value = (rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);

    if (url.hash.startsWith('#!/study/')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}${url.hash.replace('#!', '')}`;
      url.hash = '';
    }

    return url.toString();
  } catch {
    return value;
  }
}

async function resolveSessionsUrl(args) {
  if (args.sessionsUrl) return normalizeUserTestingSessionsUrl(args.sessionsUrl);

  const project = await fetchProject(args.appUrl, args.projectId);
  const sessionsUrl = project.usertestingUrl || project.usertesting_url || '';

  if (!sessionsUrl) {
    throw new Error(
      'No saved UserTesting sessions URL was found for this project. Add it in the app or pass --sessions-url.'
    );
  }

  return normalizeUserTestingSessionsUrl(sessionsUrl);
}

async function openSessionsPage(sessionsUrl) {
  if (!fs.existsSync(PLAYWRIGHT_CLI)) {
    throw new Error(`Missing Playwright CLI at ${PLAYWRIGHT_CLI}`);
  }

  console.log(`Opening UserTesting sessions page in Playwright: ${sessionsUrl}`);
  execFileSync(PLAYWRIGHT_CLI, ['open', sessionsUrl, '--headed'], {
    stdio: 'inherit',
    env: process.env,
  });

  // Give the browser a brief moment to settle on the redirected sessions page.
  await sleep(1500);
}

async function runExporterWithProgress(args) {
  const child = spawn('node', [EXPORTER, '--out', args.out], {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: process.env,
  });

  const progressLog = [];
  let stdoutBuffer = '';
  let finalResult = null;
  let cancelled = false;

  const handleProgress = async (progress) => {
    progressLog.push(progress.message || `Capturing ${progress.currentUser}...`);
    console.log(progress.message || `Capturing ${progress.currentUser}...`);

    const status = await fetchImportStatus(args.appUrl, args.projectId);
    if (status?.importRun?.status === 'failed' && status.importRun?.error_message === 'Cancelled by user') {
      cancelled = true;
      child.kill('SIGTERM');
      return;
    }

    await postProgress(args.appUrl, args.projectId, progressLog, progress);
  };

  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();

    let newlineIndex = stdoutBuffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex).trim();
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

      if (line.startsWith('__PROGRESS__')) {
        const payload = JSON.parse(line.replace('__PROGRESS__', ''));
        handleProgress(payload).catch((error) => {
          console.error(error instanceof Error ? error.message : String(error));
        });
      } else if (line.startsWith('__RESULT__')) {
        finalResult = JSON.parse(line.replace('__RESULT__', ''));
      } else if (line) {
        console.log(line);
      }

      newlineIndex = stdoutBuffer.indexOf('\n');
    }
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });

  if (cancelled) {
    throw new Error('Import cancelled by user');
  }

  if (exitCode !== 0) {
    throw new Error(`Exporter failed with exit code ${exitCode}`);
  }

  if (!finalResult) {
    throw new Error('Exporter finished without returning a result manifest');
  }

  return finalResult;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.projectId || !args.out) {
    usage();
    process.exit(1);
  }

  const outputDir = resolveOutputDir(args.out);
  if (!outputDir) {
    usage();
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  if (!args.skipExport) {
    const sessionsUrl = await resolveSessionsUrl(args);
    await openSessionsPage(sessionsUrl);
    console.log(`Running transcript exporter into ${outputDir}...`);
    await runExporterWithProgress({ ...args, out: outputDir });
  }

  const manifest = readManifest(outputDir);
  const payload = buildPayload(manifest, outputDir);

  console.log(
    `Posting ${payload.sessions.length} sessions and ${payload.transcripts.length} transcripts to project ${args.projectId}...`
  );

  const result = await postResults(args.appUrl, args.projectId, payload);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
