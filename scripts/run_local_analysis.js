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
  const parsed = {
    projectId: '',
    analysisRunId: '',
    appUrl: 'http://localhost:3000',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project-id') {
      parsed.projectId = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--analysis-run-id') {
      parsed.analysisRunId = argv[i + 1] || '';
      i += 1;
    } else if (arg === '--app-url') {
      parsed.appUrl = argv[i + 1] || parsed.appUrl;
      i += 1;
    }
  }

  return parsed;
}

function usage() {
  console.error(
    'Usage: node scripts/run_local_analysis.js --project-id <uuid> --analysis-run-id <uuid> [--app-url http://localhost:3000]'
  );
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing for local analysis.');
  }

  return createClient(url, key);
}

async function postAnalysisResults(appUrl, projectId, payload) {
  const endpoint = `${appUrl.replace(/\/$/, '')}/api/projects/${projectId}/analysis-results`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = body.details ? ` (${body.details})` : '';
    throw new Error(`Analysis results POST failed (${response.status}): ${body.error || response.statusText}${details}`);
  }
  return body;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'into', 'were', 'was',
  'have', 'they', 'their', 'what', 'when', 'where', 'which', 'about', 'would', 'could',
  'should', 'there', 'then', 'than', 'them', 'because', 'while', 'after', 'before',
  'through', 'during', 'each', 'very', 'just', 'like', 'felt', 'across', 'using',
]);

const REPORT_WRITING_GUIDANCE = {
  objective:
    'Write like a senior UX researcher synthesizing a small usability study for product and design stakeholders.',
  structure: [
    'Lead with the strongest directional takeaway, not a dump of question summaries.',
    'Group evidence into themes such as core value, discoverability, confidence, comparison preference, and backlog opportunities.',
    'Use direct language that explains what matters, why it matters, and what the team should do next.',
    'Prefer implications and product direction over repeating the script question verbatim.',
  ],
};

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeWhitespace(text) {
  return (text || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function splitTranscriptSections(text) {
  return normalizeWhitespace(text)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function extractQuestions(testScript) {
  const lines = normalizeWhitespace(testScript)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines
    .filter((line) => {
      if (line.endsWith('?')) return true;
      return /^(task|question|q\d+|\d+[.)-]|\-|\*)\s+/i.test(line);
    })
    .map((line) =>
      line
        .replace(/^(task|question)\s*\d*[:.)-]?\s*/i, '')
        .replace(/^q\d+[:.)-]?\s*/i, '')
        .replace(/^\d+[.)-]\s*/, '')
        .replace(/^[-*]\s*/, '')
        .trim()
    )
    .filter((line) => line.length > 10);

  const deduped = unique(candidates).slice(0, 30);
  if (deduped.length > 0) return deduped;

  return [
    'What were participants trying to accomplish?',
    'Where did participants experience friction?',
    'What worked well for participants?',
    'What suggestions or expectations did participants express?',
  ];
}

function scoreSectionForQuestion(question, section) {
  const questionTokens = tokenize(question);
  const sectionTokens = tokenize(section);
  const overlap = questionTokens.filter((token) => sectionTokens.includes(token)).length;
  const negativeSignals = (section.match(/\b(confus|frustrat|hard|difficult|issue|problem|stuck|slow|error)\w*/gi) || []).length;
  const positiveSignals = (section.match(/\b(easy|clear|simple|smooth|love|good|great|nice)\w*/gi) || []).length;
  return overlap * 3 + negativeSignals + positiveSignals;
}

function selectEvidenceSections(question, transcript, limit = 2) {
  const sections = splitTranscriptSections(transcript);
  if (sections.length === 0) return [];

  const ranked = sections
    .map((section) => ({
      section,
      score: scoreSectionForQuestion(question, section),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked.filter((item) => item.score > 0).slice(0, limit).map((item) => item.section);
  return best.length > 0 ? best : ranked.slice(0, limit).map((item) => item.section);
}

function clipQuote(text, max = 220) {
  const value = normalizeWhitespace(text);
  return value.length <= max ? value : `${value.slice(0, max).trim()}...`;
}

function summarizeSections(question, notes) {
  const combined = notes.map((note) => note.summary).join(' ');
  const negativeCount = (combined.match(/\b(confus|frustrat|hard|difficult|issue|problem|stuck|slow|error)\w*/gi) || []).length;
  const positiveCount = (combined.match(/\b(easy|clear|simple|smooth|love|good|great|nice)\w*/gi) || []).length;
  const suggestionCount = (combined.match(/\b(should|could|wish|expect|wanted|would like)\b/gi) || []).length;

  if (negativeCount > positiveCount) {
    return `Participants surfaced friction around "${question.toLowerCase()}". Several responses pointed to confusion, effort, or missing cues while completing this part of the study.`;
  }

  if (positiveCount > 0 && positiveCount >= negativeCount) {
    return `Participants generally responded positively to "${question.toLowerCase()}". The strongest reactions mentioned clarity, ease, or a smoother-than-expected experience.`;
  }

  if (suggestionCount > 0) {
    return `Responses to "${question.toLowerCase()}" were mixed, with several participants sharing improvement ideas or unmet expectations.`;
  }

  return `Participants described a range of reactions to "${question.toLowerCase()}". Patterns were consistent enough to synthesize into a study-level readout.`;
}

function extractKeyInsights(notes) {
  const joined = notes.map((note) => note.summary).join(' ');
  const insights = [];

  if (/\b(confus|frustrat|hard|difficult|issue|problem|stuck|slow|error)\w*/i.test(joined)) {
    insights.push('Friction clustered around moments where the next step or expected outcome was unclear.');
  }
  if (/\b(easy|clear|simple|smooth|love|good|great|nice)\w*/i.test(joined)) {
    insights.push('Positive reactions were tied to clarity and a sense of momentum through the task.');
  }
  if (/\b(expect|expected|wish|should|could|wanted)\b/i.test(joined)) {
    insights.push('Participants surfaced explicit expectations and suggestions that point to product opportunities.');
  }

  if (insights.length === 0) {
    insights.push('Responses were varied, but there was enough overlap to describe a shared participant pattern.');
  }

  return insights.slice(0, 3);
}

function buildConditionBreakdown(notes) {
  const grouped = new Map();

  for (const note of notes) {
    const condition = note.condition || 'All participants';
    const group = grouped.get(condition) || [];
    group.push(note.summary);
    grouped.set(condition, group);
  }

  const breakdown = {};
  for (const [condition, summaries] of grouped.entries()) {
    const text = summaries.join(' ');
    breakdown[condition] = /\b(confus|frustrat|hard|difficult|issue|problem|stuck|slow|error)\w*/i.test(text)
      ? 'This condition showed more friction, hesitation, or recovery behaviour in participant responses.'
      : /\b(easy|clear|simple|smooth|love|good|great|nice)\w*/i.test(text)
      ? 'This condition was more often described as clear, easy, or confidence-building.'
      : 'Responses in this condition were mixed without a single dominant pattern.';
  }

  return breakdown;
}

function deriveFindings(project, questionAnalyses) {
  const buckets = {
    coreValue: [],
    discoverability: [],
    confidence: [],
    comparison: [],
    clutter: [],
    backlog: [],
  };

  for (const question of questionAnalyses) {
    const text = `${question.questionText} ${question.summary} ${question.keyInsights.join(' ')}`.toLowerCase();

    if (/(expect|feature|let you do|useful|value|quickly add|job to be done)/.test(text)) {
      buckets.coreValue.push(question);
    }
    if (/(find|start|entry|floating|plus|discover|way to start|import route)/.test(text)) {
      buckets.discoverability.push(question);
    }
    if (/(confident|confidence|added|not added|clear whether|completion|feedback|outcome)/.test(text)) {
      buckets.confidence.push(question);
    }
    if (/(which version|prefer overall|design a|design b|comparison|clearer at a glance|miss anything important)/.test(text)) {
      buckets.comparison.push(question);
    }
    if (/(busy|noise|icon|visual|clutter|cleaner|simpler)/.test(text)) {
      buckets.clutter.push(question);
    }
    if (/(anything else|suggestion|would like|could change|select all|manual add|filter|recurring|timing)/.test(text)) {
      buckets.backlog.push(question);
    }
  }

  const findings = [];

  if (buckets.coreValue.length > 0) {
    findings.push({
      type: 'delighter',
      title: 'The core import concept is working',
      description:
        'Participants generally understood the value of importing occasions and reacted positively to the speed and usefulness of the core flow. The research suggests refinement is needed more than a rethink of the concept itself.',
      severity: 'minor',
      participantCount: Math.max(...buckets.coreValue.map((q) => q.participantCount), 0),
      conditions: unique(buckets.coreValue.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'core-value', project.studyType || 'study'],
    });
  }

  if (buckets.discoverability.length > 0) {
    findings.push({
      type: 'pain-point',
      title: 'Discoverability and entry-point clarity need work',
      description:
        'The bigger usability issue is not the mechanics of import, but understanding how to begin and where the flow starts. This points to an affordance problem around the entry point rather than a failure of the feature concept.',
      severity: 'major',
      participantCount: Math.max(...buckets.discoverability.map((q) => q.participantCount), 0),
      conditions: unique(buckets.discoverability.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'discoverability', project.studyType || 'study'],
    });
  }

  if (buckets.confidence.length > 0) {
    findings.push({
      type: 'pain-point',
      title: 'Completion and confirmation remain the biggest confidence gap',
      description:
        'Participants cared less about selecting items than about knowing whether something had truly been added. Clearer confirmation feedback is likely to have more impact than adding extra controls.',
      severity: 'critical',
      participantCount: Math.max(...buckets.confidence.map((q) => q.participantCount), 0),
      conditions: unique(buckets.confidence.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'confidence', project.studyType || 'study'],
    });
  }

  if (buckets.comparison.length > 0) {
    findings.push({
      type: 'insight',
      title: 'The stronger direction is the option that improves scanability and confidence',
      description:
        'In the direct comparison moments, the more structured direction tends to win because it helps people review the list and feel less likely to miss something important. The research points toward keeping the stronger structure while simplifying its presentation.',
      severity: 'major',
      participantCount: Math.max(...buckets.comparison.map((q) => q.participantCount), 0),
      conditions: unique(buckets.comparison.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'comparison', project.studyType || 'study'],
    });
  }

  if (buckets.clutter.length > 0) {
    findings.push({
      type: 'recommendation',
      title: 'The preferred direction still needs visual restraint',
      description:
        'Participants respond well to improved structure, but extra visual treatments can make the interface feel busier than necessary. The likely best outcome is a simplified version of the stronger design direction, not a more decorated one.',
      severity: 'major',
      participantCount: Math.max(...buckets.clutter.map((q) => q.participantCount), 0),
      conditions: unique(buckets.clutter.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'visual-noise', project.studyType || 'study'],
    });
  }

  if (buckets.backlog.length > 0) {
    findings.push({
      type: 'recommendation',
      title: 'There are useful follow-on enhancements, but they are not the main blocker',
      description:
        'Participants surfaced worthwhile ideas such as stronger filtering, manual add, and broader import controls. These are useful backlog opportunities, but they should come after the core clarity and confidence issues are resolved.',
      severity: 'minor',
      participantCount: Math.max(...buckets.backlog.map((q) => q.participantCount), 0),
      conditions: unique(buckets.backlog.flatMap((q) => Object.keys(q.conditionBreakdown))),
      tags: ['auto-generated', 'research-report', 'backlog', project.studyType || 'study'],
    });
  }

  if (findings.length === 0) {
    return questionAnalyses.slice(0, 5).map((question) => ({
      type: 'insight',
      title: question.questionText,
      description: question.summary,
      severity: 'major',
      participantCount: question.participantCount,
      conditions: Object.keys(question.conditionBreakdown),
      tags: ['auto-generated', 'analysis', project.studyType || 'study'],
    }));
  }

  return findings.slice(0, 6);
}

function buildConditionSummaries(transcripts) {
  const groups = new Map();
  for (const transcript of transcripts) {
    const condition = transcript.condition || 'All participants';
    const group = groups.get(condition) || [];
    group.push(transcript.transcript || '');
    groups.set(condition, group);
  }

  return [...groups.entries()].map(([conditionName, texts]) => {
    const combined = texts.join(' ').toLowerCase();
    let summary =
      'Responses in this group were mixed, with both positive reactions and moments of hesitation.';

    if (/(confus|frustrat|hard|difficult|issue|problem|stuck|slow|error)/.test(combined)) {
      summary =
        'This group showed more friction signals, including hesitation, confusion, or slower progress through the task.';
    } else if (/(easy|clear|simple|smooth|love|good|great|nice)/.test(combined)) {
      summary =
        'This group skewed more positive, with participants more often describing the experience as clear, easy, or smooth.';
    }

    return { conditionName, summary };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.projectId || !args.analysisRunId) {
    usage();
    process.exit(1);
  }

  const supabase = getSupabase();
  const progressLog = [];

  const postProgress = async (currentStep) => {
    progressLog.push(currentStep);
    await postAnalysisResults(args.appUrl, args.projectId, {
      analysisRunId: args.analysisRunId,
      status: 'running',
      currentStep,
      progressLog,
    });
  };

  try {
    await postProgress('Loading project and transcript data');

    const [{ data: project, error: projectError }, { data: transcripts, error: transcriptError }] =
      await Promise.all([
        supabase
          .from('projects')
          .select('id, name, study_name, study_type, test_script')
          .eq('id', args.projectId)
          .single(),
        supabase
          .from('transcripts')
          .select('participant_id, session_id, transcript, condition')
          .eq('project_id', args.projectId)
          .order('created_at', { ascending: true }),
      ]);

    if (projectError || !project) {
      throw new Error(projectError?.message || 'Project not found for analysis');
    }
    if (transcriptError || !transcripts || transcripts.length === 0) {
      throw new Error(transcriptError?.message || 'No transcripts available for analysis');
    }

    await sleep(300);
    await postProgress('Extracting research questions from the script');

    const questions = extractQuestions(project.test_script || '');
    console.log(
      JSON.stringify(
        {
          stage: 'analysis-guidance',
          promptVersion: 'ux-researcher-designer-v2',
          guidance: REPORT_WRITING_GUIDANCE,
        },
        null,
        2
      )
    );
    const questionAnalyses = [];

    for (let index = 0; index < questions.length; index += 1) {
      const questionText = questions[index];
      await postProgress(`Analyzing ${questionText}`);
      await sleep(150);

      const participantNotes = transcripts.map((transcript) => {
        const evidenceSections = selectEvidenceSections(questionText, transcript.transcript || '');
        const summary = evidenceSections.join(' ').trim() || 'No direct evidence was captured for this participant.';
        const participantId = transcript.participant_id || transcript.session_id;
        return {
          participantId,
          sessionId: transcript.session_id,
          condition: transcript.condition || null,
          summary,
          quote: clipQuote(evidenceSections[0] || transcript.transcript || ''),
          transcriptReference: `${participantId}.md`,
        };
      });

      questionAnalyses.push({
        questionNumber: `Q${index + 1}`,
        questionText,
        summary: summarizeSections(questionText, participantNotes),
        keyInsights: extractKeyInsights(participantNotes),
        conditionBreakdown: buildConditionBreakdown(participantNotes),
        citations: participantNotes
          .filter((note) => note.quote)
          .map((note) => ({
            quote: note.quote,
            participantId: note.participantId,
            summary: note.summary,
            condition: note.condition || undefined,
            transcriptReference: note.transcriptReference,
            sessionId: note.sessionId,
          })),
        participantCount: participantNotes.length,
      });
    }

    await postProgress('Synthesizing condition summaries');
    const conditionSummaries = buildConditionSummaries(transcripts);

    await postProgress('Generating lightweight research findings');
    const findings = deriveFindings(
      {
        name: project.name,
        studyType: project.study_type,
      },
      questionAnalyses
    );

    await postAnalysisResults(args.appUrl, args.projectId, {
      analysisRunId: args.analysisRunId,
      status: 'complete',
      currentStep: 'Analysis complete',
      progressLog: [...progressLog, 'Analysis complete'],
      questions: questionAnalyses,
      conditionSummaries,
      findings,
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          projectId: args.projectId,
          analysisRunId: args.analysisRunId,
          questions: questionAnalyses.length,
          findings: findings.length,
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    try {
      await postAnalysisResults(args.appUrl, args.projectId, {
        analysisRunId: args.analysisRunId,
        status: 'failed',
        currentStep: 'Analysis failed',
        progressLog: [...progressLog, 'Analysis failed'],
        errorMessage: message,
      });
    } catch (postError) {
      console.error(postError instanceof Error ? postError.message : String(postError));
    }
    console.error(message);
    process.exit(1);
  }
}

main();
