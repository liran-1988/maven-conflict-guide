---
layout: post
title: "How to Read Maven Dependency Tree Output"
description: "Learn how to read Maven dependency paths, coordinates, scopes, versions, and conflict annotations in dependency:tree output."
permalink: /read-maven-dependency-tree/
---

## Quick Answer

Run `mvn dependency:tree`, then read from left to right and from shallow to deep. Each dependency line normally shows `groupId:artifactId:type:version:scope`. The branch characters show which dependency introduced the next one: a line farther to the right is a child of the nearest line above it at the previous indentation level.

Start with the artifact you are investigating. Find every occurrence, compare its paths back to your project, and note its selected version and scope. A line marked `omitted for conflict with 2.17.2` is a competing occurrence that Maven did not put in the resolved dependency tree; Maven selected the named version through another path. Use `-Dverbose` when you need omitted nodes and management annotations, and use `-Dincludes=groupId:artifactId` to reduce a large tree to one dependency family.

The tree explains Maven's resolution result. It does not prove that the selected version is compatible with your application.

## Example Dependency Tree

Suppose a checkout service declares a JSON starter before an older payments client:

```text
[INFO] com.example:checkout-service:jar:1.0.0
[INFO] +- org.springframework.boot:spring-boot-starter-json:jar:3.3.2:compile
[INFO] |  \- com.fasterxml.jackson.core:jackson-databind:jar:2.17.2:compile
[INFO] +- com.example:legacy-payments-client:jar:4.1.0:compile
[INFO] |  \- (com.fasterxml.jackson.core:jackson-databind:jar:2.15.4:compile - omitted for conflict with 2.17.2)
[INFO] \- org.junit.jupiter:junit-jupiter:jar:5.10.3:test
```

This is an invented example, but its shape matches normal verbose plugin output. The project is the root. It has three direct dependencies: the JSON starter, the payments client, and JUnit. Each Jackson line is one level below the dependency that introduced it, so both Jackson paths have the same depth. In this example, the path through the earlier direct dependency wins the same-depth tie.

The parentheses are important. They show information about a node that is useful for diagnosis but is not part of the final resolved tree at that position.

## How to Read Each Line

Consider this selected line:

```text
com.fasterxml.jackson.core:jackson-databind:jar:2.17.2:compile
```

The first field, `com.fasterxml.jackson.core`, is the `groupId`: the namespace used to organize related artifacts. The second, `jackson-databind`, is the `artifactId`. Together they identify the dependency people usually search for.

The third field, `jar`, is the artifact type. Most application dependencies are JARs, but Maven can also represent POMs, test JARs, and other types. Some output includes a classifier between type and version. Do not assume every coordinate has exactly five fields when you are reading unusual artifacts.

The fourth field is the resolved version, `2.17.2`. When several paths request versions of the same artifact, Maven's dependency mediation normally uses the nearest definition: the version on the shortest path from the project wins. If competing versions are at the same depth, the first declaration encountered wins. You can also declare a version directly or control it with `dependencyManagement`; those choices can change what the tree reports.

The final field is the scope. `compile` is the default and is available on the main compile and runtime classpaths. `runtime` is not required for main compilation but is used at runtime. `test` is limited to test compilation and execution. `provided` is available for compilation and tests but is expected to be supplied by the runtime environment. Scope affects both classpaths and how a dependency is propagated, so a correct version under an unexpected scope can still explain a build or runtime problem.

Now look at the indentation. `+-` means another sibling follows at that level, while `\-` marks the last child. The vertical `|` keeps an earlier branch visually connected. These characters are presentation, not part of an artifact coordinate. Follow indentation upward to reconstruct a path:

```text
checkout-service
  -> spring-boot-starter-json
    -> jackson-databind 2.17.2
```

That path tells you why Jackson is present. A direct dependency appears one level below the project. Anything below a direct dependency is transitive from the application's point of view.

## Common Conflict Markers

`omitted for conflict with 2.17.2` means Maven encountered this artifact at another version and selected `2.17.2` instead. It does not mean the omitted JAR was deleted, corrupt, or globally banned. It means that occurrence did not contribute its requested version to this resolved graph. The selected path may appear elsewhere in the tree, so search for the same `groupId:artifactId` without relying only on the nearby lines.

`version managed from 2.15.4` has a different cause. It indicates that dependency management supplied or changed the effective version from the version associated with that dependency path. Dependency management is a project-level policy mechanism; it is not simply another wording for nearest-path conflict mediation. Multi-module builds and imported bills of materials commonly produce management annotations.

You may also see nodes omitted because they are duplicates. That usually means the same effective dependency was already represented through another path. Verbose annotations are diagnostic clues, not commands. Before changing a POM, establish which dependency introduced each path and whether the current result is actually harmful.

## What to Do Next

Generate the normal resolved tree first:

```bash
mvn dependency:tree
```

Ask the dependency plugin to include omitted nodes and related annotations:

```bash
mvn dependency:tree -Dverbose
```

For a large build, focus on one coordinate:

```bash
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind
```

Run the command in the module that produces the failing classpath. In a multi-module reactor, each module can have a different effective dependency graph. If output is still ambiguous, inspect the module's effective POM and any imported dependency-management BOMs rather than guessing from a truncated log.

Once you know the winning and losing paths, choose a change deliberately. A direct dependency can make the application's chosen version explicit. `dependencyManagement` can align versions across modules. An exclusion can remove one transitive path, but it can also remove classes the parent library expects. After any change, regenerate the focused tree and run the project's tests or `mvn verify`. A cleaner tree is useful evidence, but application behavior remains the final check.

## Related Guides

- [What "Omitted for Conflict" Means in Maven]({{ '/maven-omitted-for-conflict/' | relative_url }})
- [How to Fix Maven Dependency Convergence Errors]({{ '/fix-dependency-convergence/' | relative_url }})

## Sources

- [Apache Maven Dependency Plugin: dependency:tree](https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html)
- [Apache Maven: Introduction to the Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
