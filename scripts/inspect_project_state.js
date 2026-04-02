#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

function parseArgs(argv) {
  const parsed = { projectId: '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--project-id') {
      parsed.projectId = argv[i + 1] || '';
      i += 1;
    }
  }
  return parsed;
}

function usage() {
  console.error('Usage: node scripts/inspect_project_state.js --project-id <uuid>');
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(url, key);
}

async function main() {
  const { projectId } = parseArgs(process.argv.slice(2));
  if (!projectId) {
    usage();
    process.exit(1);
  }

  const supabase = getSupabase();

  const [
    projectRes,
    importRunRes,
    analysisRunRes,
    sessionsRes,
    transcriptsRes,
    findingsRes,
  ] = await Promise.all([
    supabase.from('projects').select('id, name, study_name, status, usertesting_url, updated_at').eq('id', projectId).single(),
    supabase.from('import_runs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('analysis_runs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('findings').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
  ]);

  const summary = {
    project: projectRes.data || null,
    latestImportRun: importRunRes.data || null,
    latestAnalysisRun: analysisRunRes.data || null,
    counts: {
      sessions: sessionsRes.count || 0,
      transcripts: transcriptsRes.count || 0,
      findings: findingsRes.count || 0,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
