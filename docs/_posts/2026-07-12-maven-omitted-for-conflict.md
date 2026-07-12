---
layout: post
title: 'What "Omitted for Conflict" Means in Maven'
description: "Understand why Maven dependency:tree marks a version as omitted for conflict and how to identify the version Maven selected."
permalink: /maven-omitted-for-conflict/
---

## Quick Answer

`omitted for conflict with 2.16.1` means Maven found more than one requested version of the same dependency and selected `2.16.1` for the resolved dependency graph. The annotated occurrence was kept in verbose diagnostic output so you can see the competing path, but its requested version was not selected at that location.

The marker is not an error by itself. It does not mean Maven removed an artifact from your repository, and it does not prove that the selected version is compatible. It reports the result of dependency mediation. To understand the result, find the non-omitted occurrence of the same `groupId:artifactId`, trace both paths to your project, and compare their depths.

Use a verbose, filtered tree when the full output is difficult to scan:

```bash
mvn dependency:tree -Dverbose -Dincludes=commons-io:commons-io
```

## Why Maven Omits One Version

A Maven project can reach the same artifact through several transitive paths. One library might request `commons-io:commons-io:2.16.1`, while another requests `2.11.0`. A Java classpath normally cannot load both versions as independent Maven coordinates: the files contain many of the same class names. Maven therefore mediates the conflict and produces one effective version for that dependency identity.

For normal transitive dependency mediation, Maven uses the nearest definition. Count edges from your project to each occurrence. A dependency reached through one direct dependency is nearer than the same artifact reached through two or three intermediate libraries. The nearer request wins even when it asks for an older version. Maven does not simply choose the highest version number.

If two competing requests are at the same depth, the first declaration encountered wins. In practice, the order of direct dependencies in the POM can therefore affect a same-depth result. Relying on incidental order is hard to maintain, so applications often make an intentional choice with a direct dependency or dependency management when the version matters.

Dependency management can also determine a version. A verbose tree may describe a version as managed rather than merely omitted by nearest-path mediation. Treat that as a separate clue: inspect the current POM, parent POMs, and imported BOMs to find the management rule.

## Worked Example

Consider an invented reporting service with two direct libraries:

```text
[INFO] com.example:reporting-service:jar:1.0.0
[INFO] +- com.example:document-exporter:jar:3.2.0:compile
[INFO] |  \- commons-io:commons-io:jar:2.16.1:compile
[INFO] \- com.example:legacy-sftp-client:jar:1.8.0:compile
[INFO]    \- (commons-io:commons-io:jar:2.11.0:compile - omitted for conflict with 2.16.1)
```

Both `commons-io` occurrences are two edges from the project. The first direct dependency, `document-exporter`, appears before `legacy-sftp-client`, so its `2.16.1` request wins this same-depth tie. The final classpath contains the selected Commons IO JAR, not a special merged JAR and not both versions chosen by Maven.

Now imagine `document-exporter` introduced Commons IO through one more intermediate dependency. Its path would be deeper. In that graph, the nearer `2.11.0` path could win even though `2.16.1` is numerically higher. This is why the phrase following the marker is more reliable than guessing Maven's choice from version numbers.

The omitted path still matters. `legacy-sftp-client` was compiled and tested by its authors against some dependency assumptions. It may work with the selected version because the APIs it uses are compatible, or it may fail at compile time, test time, or runtime. The tree supplies evidence about the graph; your build and tests supply evidence about behavior.

## How to Find the Winning Path

First, preserve the complete verbose output when possible:

```bash
mvn dependency:tree -Dverbose
```

Search for the exact `groupId:artifactId`, not only the version shown in the marker. The selected occurrence usually appears without parentheses, while competing occurrences carry an omission annotation. Follow indentation upward from each occurrence until you reach the project. Write the paths side by side and count their edges.

For very large output, filter the plugin:

```bash
mvn dependency:tree -Dverbose -Dincludes=commons-io:commons-io
```

Run the command in the affected module. A multi-module reactor can print several roots, and the same artifact can resolve differently in different modules. Also check whether the log was truncated or produced without verbose information. If the selected occurrence is absent, do not infer its path from the marker alone; regenerate a complete tree.

If the effective result still seems surprising, inspect dependency management. A version can come from the current POM, a parent, or an imported BOM. The effective POM can help locate inherited configuration, but it is usually much larger than the source POM, so use it after the focused tree has identified the coordinate.

## When to Change the Result

Change the POM only when you have a reason: a convergence rule fails, compilation or tests expose an incompatibility, a security policy requires a reviewed version, or the application deliberately standardizes a dependency. The omission marker alone is not evidence that a change is necessary.

A direct dependency makes the application's version choice explicit and usually creates the nearest definition. `dependencyManagement` centralizes a version policy, which is useful across modules but does not add a dependency by itself. An exclusion prevents one parent dependency from contributing a particular transitive dependency. Exclusions are path-specific and should be narrow; excluding a library can break the parent that expected it.

Do not choose a fix by assuming "newest always wins." Review release compatibility and the constraints of every library on the competing paths. After editing the POM, regenerate the tree and run the project's normal verification lifecycle:

```bash
mvn verify
```

Confirm both facts: the dependency graph now expresses the intended version, and the application still compiles and passes relevant tests. Neither fact substitutes for the other.

## Related Guides

- [How to Read Maven Dependency Tree Output]({{ '/read-maven-dependency-tree/' | relative_url }})
- [How to Fix Maven Dependency Convergence Errors]({{ '/fix-dependency-convergence/' | relative_url }})

## Sources

- [Apache Maven: Introduction to the Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [Apache Maven Dependency Plugin: dependency:tree](https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html)
