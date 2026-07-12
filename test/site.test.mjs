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
