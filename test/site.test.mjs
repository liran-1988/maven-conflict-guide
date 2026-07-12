import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    /iwhalecloud/i,
    /C:\\Users\\/i,
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
