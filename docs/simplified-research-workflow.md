# Simplified Research Workflow

This document is the product reference for the simplified version of the app.

## Goal

Keep the workflow simple:

1. Add the user research script
2. Collect transcripts
3. Generate per-question, per-user analysis
4. Generate the final research report

The product should optimize for speed, clarity, and usefulness over automation complexity.

## Step 1: Script

The user adds the research script used for the study.

Inputs:
- Project name
- Study name
- Optional description/tags
- Script text

This script becomes the source of truth for the question structure used in analysis.

## Step 2: Transcripts

Users can collect transcripts in one of two ways.

### Option A: Automatic with Playwright

The user pastes a UserTesting `/sessions` URL and runs the existing Playwright-assisted capture flow.

Requirements:
- Explain that Playwright is a local helper
- Show simple setup guidance if Playwright is not ready
- Let the user trigger transcript capture once the URL has been added

### Option B: Manual transcript entry

The user can manually add transcripts one by one.

For each transcript:
- enter participant / UserTesting username
- paste transcript text
- click add transcript

The user can repeat this for as many transcripts as they have.

## Step 3: Analysis

Use:
- the uploaded research script
- all collected transcripts

Generate a per-question, per-user analysis.

The output should be easy to review:
- Question
- User
- Summary

In the UI:
- the Analysis tab should be primarily a question-by-question view
- expanding a question should show:
  - summary
  - key insights
  - per-user summaries

## Step 4: Final Report

Use:
- the research script
- the original transcripts
- the generated per-question, per-user analysis

Generate a final user research report.

Requirements:
- the report should read like a UX research synthesis, not a raw analysis dump
- users should be able to review the prompt used to generate the report
- users should be able to adjust that prompt and regenerate
- include transcript references at the bottom of the report

## Storage

All of the following should be stored per project in Supabase:
- script
- transcripts
- analysis output
- final report
- prompt used for final report generation

## Product principle

Transcript collection is only one input step.

The real value of the product is:
- structuring the script
- grounding analysis in transcripts
- producing a useful per-question, per-user view
- turning that into a strong research report
