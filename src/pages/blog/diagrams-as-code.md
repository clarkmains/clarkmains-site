---
layout: "@layouts/BlogPostLayout.astro"
title: Diagrams as Code
author: Clark
tags:
  - AWS
  - Python
  - System Design
image: /images/diagrams-as-code/cover.jpg
date: "2021-04-05T00:00:00.121Z"
draft: false
github: "https://github.com/clarkmains/diagrams-as-code-example"
description: Store your architecture diagrams in version control with the system they describe
---

Diagrams are often the best way to get an initial understanding of a system.

When taking my first look at a new code base, a diagram helps me quickly get an idea how things fit together. It is not uncommon though, for diagrams to drift out of date and this can arguably be worse than no diagram at all.

One possible way to improve things is to store the diagram as code in the same VCS as the system.

To quote the ThoughtWorks [Technology Radar](https://www.thoughtworks.com/radar/techniques/diagrams-as-code) -

> We're seeing more and more tools that enable you to create software architecture and other diagrams as code. There are benefits to using these tools over the heavier alternatives, including easy version control and the ability to generate the DSLs from many sources.

Defining diagrams with code can be of great benefit because architecture diagrams tend to be so decoupled from the related app and infrastructure code that they can be very prone to drift.

You may, like me, be unfortunate enough to recall times where architecture has changed but the diagram doesn't get updated in a timely manner, such as these classic scenarios..

- "John has the only Visio license and he's off today"
- "Wait, this draw.io diagram is just a bitmap"
- "What the heck is a graffle?"

While the diagrams-as-code concept is no panacea, it can at least remove a potential blocker/cause of drift by democratising the diagramming tooling.

The diagram code is elevated to a first-class citizen, peer reviewed in a pull request in the context of the related app or infrastructure code.

## Diagrams in Python

I have previously used [PlantUML](https://plantuml.com/) and [Mermaid](mermaid-js.github.io) for sequence diagrams and the like. Somehow though, I only recently became aware of the Python [diagrams](https://github.com/mingrammer/diagrams) package even though at time of writing it has 11k GitHub stars!

What appeals about this tool is that it is focused on visualising cloud system architecture so it offers something different to the others, and in Python too which is my go-to language.

There are 4 key concepts to understand:

1. **Diagram** - the primary object
2. **Node** - represents a system component within the Diagram
3. **Cluster** - allows you to create a grouping of Nodes
4. **Edge** - represents a connection between Nodes

## An example

Code for this example is available on [GitHub](https://github.com/clarkmains/diagrams-as-code-example).

I learn best by doing. To give Diagrams a try, I first followed the official [quick start document](https://diagrams.mingrammer.com/docs/getting-started/installation) and then picked a random diagram from one of my old bookmarks with the intent to recreate using the diagrams module.

The following diagram is taken from the [AWS Reference Architecture: Cross Account AWS CodePipeline](https://github.com/awslabs/aws-refarch-cross-account-pipeline) GitHub repository:

![AWS Reference Architecture](/images/diagrams-as-code/diagrams-as-code-1.png)

Let's try to represent this architecture in Python using the Diagrams module!

First create a new `Diagram`. The argument `show=False` prevents the resulting image from being opened automatically after it has been rendered:

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
```

Now add the initial `Node` objects, `Users` and `Codecommit`:

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
    developers = Users("Developers")
    source_code = Codecommit("CodeCommit")
```

![Example Diagram](/images/diagrams-as-code/diagrams-as-code-2.png)

Looking good so far and it definitely has that familiar feel of a higher level AWS architecture diagram. It doesn't mean much right now though as the Nodes are just floating in space! Time to add some Edges.

As we learned earlier, an `Edge` is an object representing a connection between Nodes with some additional properties.

Let's add an Edge object between the Nodes to show the interaction between the Developers and the Git Repository:

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
    developers = Users("Developers")
    source_code = Codecommit("CodeCommit")
    source_code << Edge(label="merge pr") << developers
```

![Example Diagram](/images/diagrams-as-code/diagrams-as-code-3.png)

To make things even more clear, we can group resources using `Cluster`.

In this case we are using the Cluster to represent the boundary of an AWS Account, and that the Git Repository resides within that AWS Account:

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
    developers = Users("Developers")

    with Cluster("Developer Account"):
        source_code = Codecommit("CodeCommit")

    source_code << Edge(label="merge pr") << developers
```

![Example Diagram](/images/diagrams-as-code/diagrams-as-code-4.png)

Clusters can be nested too.

Let's add another Cluster to the Diagram, representing a Shared Services AWS Account. Then add a further, nested Cluster within that account to represent our CI/CD Pipeline which itself consists of multiple AWS Services:

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
    developers = Users("Developers")

    with Cluster("Developer Account"):
        source_code = Codecommit("CodeCommit")

    source_code << Edge(label="merge pr") << developers

    with Cluster("Shared Services Account"):
        artifacts = S3("Build Artifacts")

        with Cluster("Pipeline"):
            pipeline = Codepipeline("CodePipeline")
            build = Codebuild("Codebuild")

    source_code >> Edge(label="trigger") >> pipeline
    developers >> Edge(label="manual approval") >> pipeline
    pipeline >> build >> Edge(label="yaml file") >> artifacts
```

![Example Diagram](/images/diagrams-as-code/diagrams-as-code-5.png)

Finally, let's add our Workload accounts and some simple arrows to indicate the flow of deployments from the Pipeline to these accounts.

```python
with Diagram(None, filename="cross-account-pipeline", show=False):
    developers = Users("Developers")

    with Cluster("Developer Account"):
        source_code = Codecommit("CodeCommit")

    source_code << Edge(label="merge pr") << developers

    with Cluster("Shared Services Account"):
        artifacts = S3("Build Artifacts")

        with Cluster("Pipeline"):
            pipeline = Codepipeline("CodePipeline")
            build = Codebuild("Codebuild")

    source_code >> Edge(label="trigger") >> pipeline
    developers >> Edge(label="manual approval") >> pipeline
    pipeline >> build >> Edge(label="yaml file") >> artifacts

    with Cluster("Test Workload Account"):
        test_stack = Cloudformation("CloudFormation")
        test_function = Lambda("Lambda")
        test_api = APIGateway("API Gateway")

    pipeline >> test_stack
    test_api >> test_function

    with Cluster("Prod Workload Account"):
        prod_stack = Cloudformation("CloudFormation")
        prod_function = Lambda("Lambda")
        prod_api = APIGateway("API Gateway")

    pipeline >> prod_stack
    prod_api >> prod_function
```

This is the final result:

![Example Diagram](/images/diagrams-as-code/diagrams-as-code-6.png)

## Final thoughts

My first impressions are that this module is really promising. My next steps are to work out -

- How to include a legend or annotation
- Is it possible to change alignment of resources in a Cluster that are not connected - the resources currently end up in a vertical stack which can make for some extremely tall images!

I like it though and will definitely be trying it out in my next project.

Thanks for reading!
