# Maven Conflict Guide Publication Design

## Goal

Publish a small English-language Maven troubleshooting site at GitHub Pages using the existing public repository `liran-1988/maven-conflict-guide`. The first release contains three original, focused guides and no interactive tool, analytics, advertising, paid service, or external runtime dependency.

## Site Shape

GitHub Pages will build Jekyll from the `docs` directory on the `main` branch. The site uses the GitHub-supported `minima` theme and Kramdown. The homepage lists the three posts and gives one factual sentence about the site's purpose.

The first release contains:

- `How to Read Maven Dependency Tree Output`
- `What "Omitted for Conflict" Means in Maven`
- `How to Fix Maven Dependency Convergence Errors`

All posts use the date `2026-07-12`, so GitHub Pages does not defer future-dated content. Stable explicit permalinks prevent filename ordering from affecting related-guide links.

## Content Design

Each post answers one query directly, then uses an original Maven example to explain the relevant behavior. Each article is approximately 800-1500 English words, avoids filler and ranking claims, and links to the other two guides.

Technical claims and commands are checked against primary Maven documentation. Sources are listed at the end of each article. Public issue reports may support examples of user confusion, but they are not copied and do not override Maven documentation.

The guides distinguish between:

- dependency tree representation and Maven's nearest-definition mediation;
- verbose `omitted for conflict with` annotations and the limitations of incomplete output;
- Maven Enforcer's `dependencyConvergence` rule, exclusions, and explicit dependency management.

The site will not claim that a suggested exclusion or version choice is universally safe.

## Repository Files

```text
README.md
docs/
  _config.yml
  index.md
  _posts/
    2026-07-12-read-maven-dependency-tree.md
    2026-07-12-maven-omitted-for-conflict.md
    2026-07-12-fix-dependency-convergence.md
  superpowers/specs/2026-07-12-maven-conflict-guide-design.md
```

Jekyll configuration excludes `superpowers` from the generated site. The README links to the published site and describes the three-guide scope without SEO or income promises. `jekyll-sitemap` supplies `/sitemap.xml` through GitHub Pages' supported plugin set.

## Publication Flow

1. Validate front matter, internal links, article length, required sections, commands, and source URLs locally.
2. Scan the release set for credentials and local filesystem paths.
3. Commit only repository-owned files and push `main` over the already authenticated SSH connection.
4. Use the official GitHub CLI, authenticated to `liran-1988` with minimum required repository access, to configure Pages from `main:/docs` if GitHub does not enable it automatically.
5. Wait for the GitHub Pages build and require a successful remote build.
6. Smoke-test the homepage, three article URLs, and sitemap. Inspect desktop and mobile screenshots for readable, non-overlapping output.

If authentication, build, link, or rendering verification fails, publication stops at the last verified state. No unrelated repository or third-party surface is modified.

## Verification

Automated checks cover:

- valid YAML front matter and unique permalinks;
- required headings and 800-1500 word target;
- all internal related-guide links resolving to known routes;
- HTTPS source links and successful responses from primary references;
- no secrets, credentials, company identifiers, or personal filesystem paths;
- GitHub's remote Jekyll build succeeding;
- homepage, posts, and sitemap returning successful HTTP responses;
- desktop and mobile rendering after deployment.

## Non-Goals

- Building the Maven dependency conflict explainer tool.
- Google Search Console setup or index submission.
- Analytics, advertising, monetization, domains, newsletters, or social promotion.
- Automated third-party posting or backlink creation.
- Guarantees about search traffic, ranking, correctness, or successful dependency remediation.
