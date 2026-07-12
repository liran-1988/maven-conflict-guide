---
layout: post
title: "How to Fix Maven Dependency Convergence Errors"
description: "Resolve Maven Enforcer dependency convergence errors by comparing paths, choosing a version, and verifying the resulting dependency tree."
permalink: /fix-dependency-convergence/
---

## Quick Answer

A Maven Enforcer dependency convergence error means that the dependency graph contains different version requirements for the same artifact. Maven's normal mediation can still select one version, but the `dependencyConvergence` rule requires the graph to converge on a single version requirement.

Fix the error in four steps: identify every reported path, decide which version the application supports, express that decision with a direct dependency or `dependencyManagement`, and use an exclusion only when one specific parent should stop introducing the dependency. Then regenerate a focused dependency tree and run `mvn verify`.

Do not choose a version merely because it is highest, and do not assume a successful convergence check proves runtime compatibility. The rule checks dependency-graph consistency. Your compiler, tests, and application checks still have to validate behavior.

## Read the Convergence Error

An Enforcer message typically names one artifact and prints paths that request different versions. This invented example comes from an inventory service:

```text
Dependency convergence error for org.apache.commons:commons-lang3:jar:3.14.0 paths to dependency are:
+-com.example:inventory-service:jar:1.0.0
  +-com.example:csv-importer:jar:2.4.0
    +-org.apache.commons:commons-lang3:jar:3.14.0
and
+-com.example:inventory-service:jar:1.0.0
  +-com.example:warehouse-client:jar:5.1.0
    +-org.apache.commons:commons-lang3:jar:3.12.0
```

Read each block from the project down to the conflicting artifact. Here, `csv-importer` requests `3.14.0`, while `warehouse-client` requests `3.12.0`. Both paths have the same depth. Maven's ordinary nearest-definition mediation could select one according to declaration order, but the Enforcer rule fails because both requested versions remain present in the dependency graph.

Before editing the POM, produce a focused verbose tree in the module that fails:

```bash
mvn dependency:tree -Dverbose -Dincludes=org.apache.commons:commons-lang3
```

Compare this tree with the Enforcer paths. Check parent POMs and imported BOMs if the effective version is managed. Also confirm that the error is current: stale CI logs or a tree generated in a different module can describe a different graph.

## Choose a Version Deliberately

The application should own the decision when it needs the artifact directly. Declaring the reviewed version as a direct dependency makes it a near, visible choice:

```xml
<dependencies>
  <dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.14.0</version>
  </dependency>
</dependencies>
```

This can align transitive paths because the direct declaration is nearer than versions requested through other libraries. It also tells future maintainers that the application intentionally depends on Commons Lang. Before selecting `3.14.0`, review the libraries' compatibility constraints and exercise the code paths that use them.

For a multi-module build, or when the project wants a central version policy without adding the dependency to every module, use `dependencyManagement`:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
      <version>3.14.0</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

Dependency management controls the version used when a module has that dependency, directly or transitively. It does not by itself put a new JAR on every module's classpath. In larger builds, the rule may live in a parent POM or an imported BOM, so document why the chosen version is appropriate rather than hiding the decision in an unrelated cleanup.

Whichever form you choose, prefer the smallest policy boundary that matches ownership. A single application may use a direct dependency. A coordinated reactor may benefit from parent-level management. Changing a company-wide parent for one service's local conflict can create a much larger review surface than necessary.

## Use an Exclusion Only When It Is Narrow

An exclusion is appropriate when one dependency path should not contribute the transitive artifact. For example, after confirming that `warehouse-client` works with the application's selected Commons Lang version, the application could exclude its older transitive request:

```xml
<dependency>
  <groupId>com.example</groupId>
  <artifactId>warehouse-client</artifactId>
  <version>5.1.0</version>
  <exclusions>
    <exclusion>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

Maven exclusions are declared on a particular dependency. They remove that transitive path for the current project; they are not global bans on the artifact. This path-specific behavior is useful, but it means you must place the exclusion on the direct dependency that introduces the unwanted path, not on an arbitrary nearby declaration.

Do not add exclusions until the error disappears by trial and error. A parent library may genuinely require the excluded classes. If no other selected path supplies a compatible artifact, the build may compile differently or fail at runtime. Pair an exclusion with an explicit, reviewed version when the application still requires the dependency, and explain the reason in the change review.

Avoid broad wildcard thinking. Maven's model expects exclusions to identify a `groupId` and `artifactId`, and the official guidance treats them as a last-resort control on a dependency path. If many modules repeat the same exclusion, investigate whether dependency management, a library upgrade, or a corrected upstream POM better represents the intended graph.

## Verify the Result

Regenerate the exact focused tree after changing the POM:

```bash
mvn dependency:tree -Dverbose -Dincludes=org.apache.commons:commons-lang3
```

Confirm that every relevant path now resolves to the version you intended and that the old request is either managed consistently or removed through the documented exclusion. Do not stop after seeing only one attractive line; make sure the command ran in the failing module and the output is complete.

Then run the lifecycle that invokes Enforcer and the project's tests:

```bash
mvn verify
```

The expected result is both a passing convergence rule and passing application verification. If tests are weak around the affected libraries, add or run targeted integration checks. Version convergence prevents one category of ambiguous classpath, but it cannot detect removed methods, changed behavior, serialization differences, or every plugin/runtime classpath issue.

Commit the POM change together with evidence about the old paths, the chosen version, and the verification performed. That makes the decision reviewable and prevents a future maintainer from "simplifying" the declaration back into the original conflict.

## Related Guides

- [How to Read Maven Dependency Tree Output]({{ '/read-maven-dependency-tree/' | relative_url }})
- [What "Omitted for Conflict" Means in Maven]({{ '/maven-omitted-for-conflict/' | relative_url }})

## Sources

- [Apache Maven Enforcer: Dependency Convergence](https://maven.apache.org/enforcer/enforcer-rules/dependencyConvergence.html)
- [Apache Maven: Optional Dependencies and Dependency Exclusions](https://maven.apache.org/guides/introduction/introduction-to-optional-and-excludes-dependencies.html)
- [Apache Maven: Introduction to the Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
