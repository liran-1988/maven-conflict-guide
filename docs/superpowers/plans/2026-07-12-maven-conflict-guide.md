# Maven Conflict Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three verified English Maven troubleshooting guides from `main:/docs` at `https://liran-1988.github.io/maven-conflict-guide/`.

**Architecture:** GitHub Pages builds a dependency-light Jekyll site using the supported `minima` theme and `jekyll-sitemap`. A Node built-in test suite treats site structure, front matter, word counts, required sections, permalinks, internal links, and primary-source links as a release contract; GitHub's remote Jekyll build and public desktop/mobile smoke checks provide final deployment evidence.

**Tech Stack:** Jekyll on GitHub Pages, Kramdown Markdown, Minima theme, Node.js 22 built-in test runner, Git over SSH, official portable GitHub CLI for Pages configuration.

---

## Non-Goals

- Do not build the interactive Maven conflict explainer in this release.
- Do not configure Google Search Console, analytics, advertising, monetization, a custom domain, or third-party promotion.
- Do not promise rankings, traffic, correctness, or that a dependency change is safe for every application.

## File Map

- Modify `README.md`: concise repository purpose and public URL.
- Create `docs/_config.yml`: title, description, theme, URL/base URL, sitemap plugin, and build exclusions.
- Create `docs/index.md`: Jekyll home layout and one-sentence introduction.
- Create `docs/_posts/2026-07-12-read-maven-dependency-tree.md`: dependency-tree anatomy guide.
- Create `docs/_posts/2026-07-12-maven-omitted-for-conflict.md`: conflict-marker guide.
- Create `docs/_posts/2026-07-12-fix-dependency-convergence.md`: Enforcer convergence guide.
- Create `test/site.test.mjs`: repository-local structural and content release checks.
- Modify `.microtool-factory/config.json`: authorize only the exact target repository while retaining one-off build control.
- Modify `.microtool-factory/ledger.json`: record the article release, verification evidence, URL, and review date.
- Modify `.microtool-factory/reports/2026-07-12.md`: record the content-first build and publication result.

### Task 1: Establish the Site Contract and Jekyll Shell

**Files:**
- Create: `test/site.test.mjs`
- Create: `docs/_config.yml`
- Create: `docs/index.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing structural tests**

Create `test/site.test.mjs` with Node built-ins. Define `repoRoot`, `docsRoot`, and these helpers:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repoRoot, "docs");

async function read(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function frontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, "Markdown must begin with YAML front matter");
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        assert.ok(separator > 0, `Invalid front-matter line: ${line}`);
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}

test("Jekyll config pins the owned Pages URL and excludes internal specs", async () => {
  const config = await read("docs/_config.yml");
  assert.match(config, /^title: Maven Conflict Guide$/m);
  assert.match(config, /^theme: minima$/m);
  assert.match(config, /^url: "https:\/\/liran-1988.github.io"$/m);
  assert.match(config, /^baseurl: "\/maven-conflict-guide"$/m);
  assert.match(config, /^  - jekyll-sitemap$/m);
  assert.match(config, /^  - superpowers$/m);
});

test("home page and README describe the same narrow site", async () => {
  const index = await read("docs/index.md");
  const metadata = frontMatter(index);
  assert.equal(metadata.layout, "home");
  assert.equal(metadata.title, "Maven Conflict Guide");
  assert.match(index, /understanding and fixing Maven dependency conflicts/i);

  const readme = await read("README.md");
  assert.match(readme, /https:\/\/liran-1988\.github\.io\/maven-conflict-guide\//);
  assert.match(readme, /three focused guides/i);
});
```

- [ ] **Step 2: Run the tests and observe the expected failure**

Run: `node --test test/site.test.mjs`

Expected: FAIL because `docs/_config.yml` and `docs/index.md` do not exist and the README lacks the public URL.

- [ ] **Step 3: Add the minimal Jekyll shell**

Create `docs/_config.yml`:

```yaml
title: Maven Conflict Guide
description: Practical explanations for understanding and fixing Maven dependency conflicts
theme: minima
markdown: kramdown
url: "https://liran-1988.github.io"
baseurl: "/maven-conflict-guide"
permalink: pretty
plugins:
  - jekyll-sitemap
exclude:
  - superpowers
```

Create `docs/index.md`:

```markdown
---
layout: home
title: Maven Conflict Guide
---

Practical guides for understanding and fixing Maven dependency conflicts.
```

Replace `README.md` with:

```markdown
# Maven Conflict Guide

Three focused guides for reading Maven dependency trees, understanding conflict markers, and resolving dependency convergence errors.

Site: https://liran-1988.github.io/maven-conflict-guide/
```

- [ ] **Step 4: Run the structural tests**

Run: `node --test test/site.test.mjs`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the shell and tests**

```powershell
git add README.md docs/_config.yml docs/index.md test/site.test.mjs
git commit -m "test: define Maven guide site contract"
```

### Task 2: Publish the Dependency Tree Anatomy Guide

**Files:**
- Modify: `test/site.test.mjs`
- Create: `docs/_posts/2026-07-12-read-maven-dependency-tree.md`

- [ ] **Step 1: Extend the test contract for article content**

Add these helpers and the first article test to `test/site.test.mjs`:

```js
function body(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
}

function proseWordCount(markdown) {
  return body(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, " ")
    .match(/[A-Za-z0-9][A-Za-z0-9'/-]*/g)?.length ?? 0;
}

function assertGuide(markdown, expected) {
  const metadata = frontMatter(markdown);
  assert.equal(metadata.layout, "post");
  assert.equal(metadata.title, expected.title);
  assert.equal(metadata.permalink, expected.permalink);
  assert.ok(metadata.description.length >= 70 && metadata.description.length <= 160);
  const count = proseWordCount(markdown);
  assert.ok(count >= 800 && count <= 1500, `Expected 800-1500 prose words, got ${count}`);
  for (const heading of expected.headings) {
    assert.match(markdown, new RegExp(`^## ${heading}$`, "m"));
  }
  for (const source of expected.sources) {
    assert.ok(markdown.includes(source), `Missing primary source: ${source}`);
  }
}

test("dependency tree guide meets its release contract", async () => {
  const markdown = await read("docs/_posts/2026-07-12-read-maven-dependency-tree.md");
  assertGuide(markdown, {
    title: "How to Read Maven Dependency Tree Output",
    permalink: "/read-maven-dependency-tree/",
    headings: [
      "Quick Answer",
      "Example Dependency Tree",
      "How to Read Each Line",
      "Common Conflict Markers",
      "What to Do Next",
      "Related Guides",
      "Sources",
    ],
    sources: [
      "https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html",
      "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html",
    ],
  });
});
```

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run: `node --test --test-name-pattern="dependency tree guide" test/site.test.mjs`

Expected: FAIL with `ENOENT` for `2026-07-12-read-maven-dependency-tree.md`.

- [ ] **Step 3: Write the first guide**

Create `docs/_posts/2026-07-12-read-maven-dependency-tree.md` with this front matter:

```yaml
---
layout: post
title: "How to Read Maven Dependency Tree Output"
description: "Learn how to read Maven dependency paths, coordinates, scopes, versions, and conflict annotations in dependency:tree output."
permalink: /read-maven-dependency-tree/
---
```

Write 800-1500 words using the required headings. Use an original `com.example:checkout-service` tree that includes direct and transitive dependencies. Explain `groupId:artifactId:type:version:scope`, indentation, direct versus transitive depth, common scopes, nearest-definition mediation, same-depth first declaration, `omitted for conflict with`, and `version managed from`. Explain these commands and their limits:

```bash
mvn dependency:tree
mvn dependency:tree -Dverbose
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind
```

End with Liquid-aware links to `/maven-omitted-for-conflict/` and `/fix-dependency-convergence/`, followed by the two official source URLs in the test.

- [ ] **Step 4: Run all tests**

Run: `node --test test/site.test.mjs`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Commit the first guide**

```powershell
git add test/site.test.mjs docs/_posts/2026-07-12-read-maven-dependency-tree.md
git commit -m "docs: explain Maven dependency tree output"
```

### Task 3: Publish the Omitted-for-Conflict Guide

**Files:**
- Modify: `test/site.test.mjs`
- Create: `docs/_posts/2026-07-12-maven-omitted-for-conflict.md`

- [ ] **Step 1: Add the second article contract**

Add this test using the existing `assertGuide` helper:

```js
test("omitted-for-conflict guide meets its release contract", async () => {
  const markdown = await read("docs/_posts/2026-07-12-maven-omitted-for-conflict.md");
  assertGuide(markdown, {
    title: 'What "Omitted for Conflict" Means in Maven',
    permalink: "/maven-omitted-for-conflict/",
    headings: [
      "Quick Answer",
      "Why Maven Omits One Version",
      "Worked Example",
      "How to Find the Winning Path",
      "When to Change the Result",
      "Related Guides",
      "Sources",
    ],
    sources: [
      "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html",
      "https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html",
    ],
  });
});
```

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run: `node --test --test-name-pattern="omitted-for-conflict guide" test/site.test.mjs`

Expected: FAIL with `ENOENT` for `2026-07-12-maven-omitted-for-conflict.md`.

- [ ] **Step 3: Write the second guide**

Create the post with this front matter:

```yaml
---
layout: post
title: 'What "Omitted for Conflict" Means in Maven'
description: "Understand why Maven dependency:tree marks a version as omitted for conflict and how to identify the version Maven selected."
permalink: /maven-omitted-for-conflict/
---
```

Write 800-1500 words. Use a new `com.example:reporting-service` example with two paths to different `commons-io` versions. Explain that omitted means absent from the resolved tree for that conflict, not deleted from a repository or necessarily broken. Cover nearest definition, equal-depth declaration order, why `-Dverbose` matters, incomplete-tree limitations, filters, explicit direct dependency/dependency management/exclusion options, and why exclusions require application-level testing. Link to the other two guides and cite the two required official sources.

- [ ] **Step 4: Run all tests and commit**

Run: `node --test test/site.test.mjs`

Expected: 4 tests pass, 0 fail.

```powershell
git add test/site.test.mjs docs/_posts/2026-07-12-maven-omitted-for-conflict.md
git commit -m "docs: explain omitted Maven conflict versions"
```

### Task 4: Publish the Dependency Convergence Guide

**Files:**
- Modify: `test/site.test.mjs`
- Create: `docs/_posts/2026-07-12-fix-dependency-convergence.md`

- [ ] **Step 1: Add the third article contract**

Add this test using the existing `assertGuide` helper:

```js
test("convergence guide meets its release contract", async () => {
  const markdown = await read("docs/_posts/2026-07-12-fix-dependency-convergence.md");
  assertGuide(markdown, {
    title: "How to Fix Maven Dependency Convergence Errors",
    permalink: "/fix-dependency-convergence/",
    headings: [
      "Quick Answer",
      "Read the Convergence Error",
      "Choose a Version Deliberately",
      "Use an Exclusion Only When It Is Narrow",
      "Verify the Result",
      "Related Guides",
      "Sources",
    ],
    sources: [
      "https://maven.apache.org/enforcer/enforcer-rules/dependencyConvergence.html",
      "https://maven.apache.org/guides/introduction/introduction-to-optional-and-excludes-dependencies.html",
      "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html",
    ],
  });
});
```

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run: `node --test --test-name-pattern="convergence guide" test/site.test.mjs`

Expected: FAIL with `ENOENT` for `2026-07-12-fix-dependency-convergence.md`.

- [ ] **Step 3: Write the third guide**

Create the post with this front matter:

```yaml
---
layout: post
title: "How to Fix Maven Dependency Convergence Errors"
description: "Resolve Maven Enforcer dependency convergence errors by comparing paths, choosing a version, and verifying the resulting dependency tree."
permalink: /fix-dependency-convergence/
---
```

Write 800-1500 words around an original `com.example:inventory-service` error with two dependency paths. Present three bounded fixes: a direct dependency when the application owns the choice, dependency management for multi-module consistency, and a narrow exclusion when one parent should not contribute the transitive dependency. Include valid XML snippets and these verification commands:

```bash
mvn dependency:tree -Dverbose -Dincludes=groupId:artifactId
mvn verify
```

State that convergence is a graph/version consistency check, not proof of runtime compatibility. Link to the other two guides and cite all three required official pages.

- [ ] **Step 4: Run all tests and commit**

Run: `node --test test/site.test.mjs`

Expected: 5 tests pass, 0 fail.

```powershell
git add test/site.test.mjs docs/_posts/2026-07-12-fix-dependency-convergence.md
git commit -m "docs: guide Maven convergence fixes"
```

### Task 5: Add Cross-Link, Source, and Secret Release Checks

**Files:**
- Modify: `test/site.test.mjs`

- [ ] **Step 1: Add complete-site release tests**

Add these complete-site tests:

```js
const posts = [
  {
    file: "docs/_posts/2026-07-12-read-maven-dependency-tree.md",
    permalink: "/read-maven-dependency-tree/",
  },
  {
    file: "docs/_posts/2026-07-12-maven-omitted-for-conflict.md",
    permalink: "/maven-omitted-for-conflict/",
  },
  {
    file: "docs/_posts/2026-07-12-fix-dependency-convergence.md",
    permalink: "/fix-dependency-convergence/",
  },
];

test("every guide links to the other two guides", async () => {
  for (const current of posts) {
    const markdown = await read(current.file);
    for (const related of posts.filter((post) => post.file !== current.file)) {
      assert.ok(markdown.includes(related.permalink), `${current.file} must link to ${related.permalink}`);
    }
  }
});

test("public copy contains no private paths, credentials, or promises", async () => {
  const markdown = (await Promise.all(posts.map((post) => read(post.file)))).join("\n");
  for (const forbidden of [
    /(?:[A-Za-z]:\\|\/(?:Users|home)\/)[^\s]+/,
    /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /guarantee(?:d|s)? (?:a )?(?:fix|ranking|result)/i,
  ]) {
    assert.doesNotMatch(markdown, forbidden);
  }
});

test("guide metadata is unique and bash examples contain Maven commands", async () => {
  const markdownFiles = await Promise.all(posts.map((post) => read(post.file)));
  const metadata = markdownFiles.map(frontMatter);
  assert.equal(new Set(metadata.map((item) => item.title)).size, posts.length);
  assert.equal(new Set(metadata.map((item) => item.description)).size, posts.length);
  for (const markdown of markdownFiles) {
    const bashBlocks = [...markdown.matchAll(/```bash\r?\n([\s\S]*?)```/g)];
    assert.ok(bashBlocks.length > 0, "Each guide needs at least one bash example");
    for (const block of bashBlocks) {
      for (const line of block[1].split(/\r?\n/).filter(Boolean)) {
        assert.match(line, /^mvn\b/);
      }
    }
  }
});
```

- [ ] **Step 2: Introduce one temporary broken link and prove the test fails**

Temporarily change one related link to `/missing-guide/`, run `node --test test/site.test.mjs`, and require the new cross-link test to fail. Restore the correct link immediately.

- [ ] **Step 3: Run the restored complete suite**

Run: `node --test test/site.test.mjs`

Expected: all tests pass, 0 fail.

- [ ] **Step 4: Verify primary sources live**

Run one `curl.exe -L -sS -o NUL -w "%{http_code}" <url>` command for each of the four official source URLs. Expected: `200` for every source. Do not cite the removed Maven plugin example URL that returned `404` during planning.

- [ ] **Step 5: Commit the release checks**

```powershell
git add test/site.test.mjs docs/_posts
git commit -m "test: validate guide links and release safety"
```

### Task 6: Authorize the Exact Repository and Prepare the Factory Report

**Files:**
- Modify: `../.microtool-factory/config.json`
- Modify: `../.microtool-factory/ledger.json`
- Modify: `../.microtool-factory/reports/2026-07-12.md`

- [ ] **Step 1: Narrowly authorize publication**

Set `mode` to `authorized`, set `authorizedRepositories` to only `["liran-1988/maven-conflict-guide"]`, and leave `autonomousBuild` as `false`. This records the one-off authority without enabling future unattended builds.

- [ ] **Step 2: Record pre-publication evidence**

Update the daily report with cash spent `$0`, selected candidate score `87`, files changed, exact verification commands/results, intended branch `main`, Pages path `/docs`, intended URL, release count `0` before this release, and the current blocker `remote build and public smoke checks pending`.

- [ ] **Step 3: Validate factory JSON and release set**

Run `Get-Content -Raw ../.microtool-factory/config.json | ConvertFrom-Json` and the equivalent command for the ledger. Run `git status --short`, `git diff --check`, and `git diff origin/main...HEAD --name-only`. Expected: valid JSON and only repository-owned design, plan, site, post, README, and test files in the Git release set.

### Task 7: Push and Enable GitHub Pages

**Files:**
- No new repository files.
- Local-only tool directory outside the repository: `.agent_cache/tools/official-gh/`.

- [ ] **Step 1: Run the final pre-push gate**

Run fresh commands: `node --test test/site.test.mjs`, `git diff --check`, `git status --short --branch`, `git remote -v`, and a PowerShell secret/path scan across `git diff origin/main...HEAD`. Require all tests passing, clean diff checks, exact SSH remote `git@github.com:liran-1988/maven-conflict-guide.git`, and no unrelated files.

- [ ] **Step 2: Push the verified commits**

Run: `git push origin main`

Expected: `main -> main` on the exact authorized repository.

- [ ] **Step 3: Install the official portable GitHub CLI only if Pages remains disabled**

Query `https://api.github.com/repos/cli/cli/releases/latest`, download the Windows amd64 ZIP and published checksums into `.agent_cache/tools/official-gh/`, verify the ZIP SHA-256 against the checksum file, extract it, and run the extracted `gh.exe --version`. Do not invoke the unofficial npm `gh.ps1`.

- [ ] **Step 4: Authenticate and enable Pages from the approved source**

Run the extracted official CLI with `auth login --hostname github.com --git-protocol ssh --web`, then verify `auth status` reports `liran-1988`. Create Pages with the REST endpoint `POST /repos/liran-1988/maven-conflict-guide/pages` and JSON source `{ "branch": "main", "path": "/docs" }`. If Pages was concurrently enabled, read the existing Pages configuration and require the same source instead of overwriting another configuration.

- [ ] **Step 5: Wait for the remote build**

Poll `GET /repos/liran-1988/maven-conflict-guide/pages/builds/latest` with the official CLI for no more than ten minutes. Require status `built`; status `errored` returns the release to draft status and records the build error.

### Task 8: Verify Public Output and Close the Release

**Files:**
- Modify: `../.microtool-factory/ledger.json`
- Modify: `../.microtool-factory/reports/2026-07-12.md`

- [ ] **Step 1: Smoke-test all public routes**

Require HTTP `200` for:

```text
https://liran-1988.github.io/maven-conflict-guide/
https://liran-1988.github.io/maven-conflict-guide/read-maven-dependency-tree/
https://liran-1988.github.io/maven-conflict-guide/maven-omitted-for-conflict/
https://liran-1988.github.io/maven-conflict-guide/fix-dependency-convergence/
https://liran-1988.github.io/maven-conflict-guide/sitemap.xml
```

Check each HTML response contains its expected title and that article pages link to both related guides.

- [ ] **Step 2: Inspect desktop and mobile rendering**

Use Playwright Chromium to capture the homepage and one article at `1440x900` and `390x844`. Confirm nonblank output, readable navigation/body text, no horizontal overflow, no overlapping text, and visible links to all three articles.

- [ ] **Step 3: Update factory evidence**

Set the product status to published in `ledger.json`, record the commit SHA, public URL, published date `2026-07-12`, verification commands, unavailable metrics as unavailable, and review dates `2026-08-11`, `2026-09-10`, and `2026-10-10`. Update the daily report with the remote build result and public smoke/visual evidence.

- [ ] **Step 4: Commit factory state outside the published repository only if its workspace is versioned**

The factory workspace is currently unversioned, so preserve the updated JSON and report locally without adding them to `maven-conflict-guide`. Do not push factory-internal state to the public repository.

- [ ] **Step 5: Run the completion gate**

Re-run `node --test test/site.test.mjs`, public HTTP checks, repository status, exact remote check, and factory JSON parsing. Only report publication complete when all current-run evidence passes.
