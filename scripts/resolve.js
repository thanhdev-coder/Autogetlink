import fetch from "node-fetch";
import * as github from "@actions/github";
import * as core from "@actions/core";

function extractFirstUrl(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  const m = text.match(urlRegex);
  return m ? m[0].replace(/[<>]/g, "") : null;
}

async function resolveUrl(url, maxRedirects = 10) {
  let cur = url;
  let redirects = 0;
  while (redirects < maxRedirects) {
    const res = await fetch(cur, { method: "HEAD", redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      cur = new URL(res.headers.get("location"), cur).toString();
      redirects++;
    } else {
      return cur;
    }
  }
  return cur;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.INPUT_ISSUE_NUMBER;
  const commentBody = process.env.INPUT_COMMENT_BODY;

  const url = extractFirstUrl(commentBody);
  if (!url) return console.log("No URL found");

  console.log("Resolving:", url);
  const final = await resolveUrl(url);
  const [owner, repoName] = repo.split("/");
  const octokit = github.getOctokit(token);

  await octokit.rest.issues.createComment({
    owner,
    repo: repoName,
    issue_number: Number(issueNumber),
    body: `🔗 Link cuối cùng: ${final}`,
  });
}

main();
