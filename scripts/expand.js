import fetch from "node-fetch";
import * as github from "@actions/github";

function extractUrl(text) {
  const m = text.match(/https?:\/\/[^\s]+/);
  return m ? m[0] : null;
}

async function resolveUrl(url, maxRedirects = 10) {
  let cur = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(cur, { method: "HEAD", redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      cur = new URL(res.headers.get("location"), cur).toString();
    } else {
      return cur;
    }
  }
  return cur;
}

async function main() {
  const { COMMENT_BODY, ISSUE_NUMBER, GITHUB_TOKEN, REPOSITORY } = process.env;
  const [owner, repo] = REPOSITORY.split("/");
  const octokit = github.getOctokit(GITHUB_TOKEN);

  const url = extractUrl(COMMENT_BODY);
  if (!url) return console.log("Không tìm thấy URL");

  console.log("Đang xử lý:", url);
  const final = await resolveUrl(url);

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: Number(ISSUE_NUMBER),
    body: `✅ Link cuối cùng: ${final}`,
  });
}

main();
