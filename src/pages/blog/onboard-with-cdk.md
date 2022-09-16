---
layout: "@layouts/BlogPostLayout.astro"
title: Getting fully on-board with AWS CDK
author: Clark
tags:
  - AWS
  - CDK
image: /images/onboard-with-cdk/cover.jpg
date: "2022-03-31T00:00:00Z"
draft: false
description: Version 2 and a raft of updates has made AWS CDK a more compelling proposition
---

You can't have failed to notice the momentum building behind [AWS CDK](https://aws.amazon.com/cdk/).

> The AWS Cloud Development Kit (AWS CDK) is an open-source software development framework to define your cloud application resources using familiar programming languages.

I have dabbled with CDK several times since it launched but never seriously considered adopting it - until now.

## Why did I not use CDK before?

In a nutshell - my main language is Python and it doesn't always feel great to use Python with CDK, especially when you are just starting out.

Why is this?

#### 1. Patchy documentation

The CDK Python documentation was - is - just plain wrong in places.

Early versions of the CDK Python docs were _bad_. Things have improved but to this day, the CDK Python reference is still littered with translation errors:

```python
path.join(__dirname, "my-lambda-handler")
```

#### 2. TypeScript is the only true first-class citizen

If you want to give back to the community you need to use TypeScript.

Yes, you can package your own constructs in any supported language and share them within your team. If you wish to share your work and contribute to community resources such as [Construct Hub](https://constructs.dev/) though, your library must be compiled with JSII, a TypeScript-based tool for building multi-language libraries.

#### 3. Few Python project examples

Python is a really popular language so it is generally easy to find code examples to avoid reinventing the wheel or to just inspect, out of interest.

I assume as a result of point 2 above, TypeScript dominates the CDK community and therefore the Python CDK community is perhaps smaller than it could be.

This definitely appeared to be the case in the beginning as there were far fewer CDK Python examples. Combined with the previously mentioned patchy documentation, this made the learning process tough in the early days.

## Why am I getting on-board now?

#### 1. Improved testing

For unit testing, the CDK [assertions](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.assertions/README.html) package is invaluable when developing your own Constructs, to verify that the resultant CloudFormation is correct.

For functional testing, you can now use [AWS SAM CLI with CDK](https://aws.amazon.com/blogs/compute/better-together-aws-sam-and-aws-cdk/) to test any Lambda Functions and API Gateways defined in your CDK project.

Whenever I used AWS SAM in the past I found this testing feature really convenient so I am really pleased to have this integrated with CDK.

#### 2. Optimised development workflow

The introduction of [CDK Watch](https://aws.amazon.com/blogs/developer/increasing-development-speed-with-cdk-watch/) speeds up development by monitoring CDK Project code and automatically hot-swapping certain resources.

You may be familiar with using `npm watch` which continuously checks your code and hot-reloads your website in case something changes.

CDK Watch is similar - for any of the following CDK assets, the CDK CLI will use AWS service APIs to directly make changes rather than CloudFormation:

- Lambda Function code
- Step Functions state machine definitions
- ECS Container Images

This practice is only suitable for development environments due to potential for stack issues due to hot-swap-introduced [drift](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/detect-drift-resource.html) but it does offer a welcome speedup to the development feedback loop.

#### 3. CDK 'magic'

Sometimes CDK can perform some neat 'magic' and help you greatly.

Say you have code that defines an object `app_config`:

```python
app_config = {
    "apiUrl": api.url,
    "userPoolId": user_pool.user_pool_id,
    "userPoolClientId": user_pool_client.user_pool_client_id
}
```

This object should be written to a file `config.json` for a front end website to consume, so it can discover how to talk to the auth and api services.

CDK's deploy-time resolution will take care of this by resolving the properties, hydrating the config file and uploading it to S3, all during CDK deploy:

```python
s3_deployment.BucketDeployment(self, "AppConfigDeployment",
    destination_bucket=website_bucket,
    sources=[
        s3_deployment.Source.json_data("config.json", app_config)
    ]
)
```

In vanilla CloudFormation, you would have to orchestrate this manually - add Outputs to the template, run a task to parse the values and write the result to a file for upload. CDK simplifies this significantly to create a really nice DX.

#### 4. Iteration

Any time iteration or repetition is required, CDK - with use of functions and loop primitives, obviously has a huge advantage over vanilla CloudFormation.

I don't want to write more CloudFormation [Macros](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-macros.html). With CDK I don't have to!

#### 5. Support for AWS SSO credentials

While [AWS SSO](https://docs.aws.amazon.com/singlesignon) is ideal for managing access to multiple accounts and best practice over IAM Users - AWS SSO and CDK have not always been friends.

Historically, using SSO credentials with CDK required [scripts](https://www.matscloud.com/blog/2020/06/25/how-to-use-aws-cdk-with-aws-sso-profiles/) or workarounds to keep named profiles in sync, which introduced friction and poor DX.

Since CDK [v2.18.0](https://github.com/aws/aws-cdk/releases/tag/v2.18.0) though, AWS SSO credentials are officially supported!

## The way forward with CDK

Going forward, I do have concerns around a lack of prescriptive advice and standards e.g. every CDK Python project seems to have a different structure.

Last year AWS published a [blog](https://aws.amazon.com/blogs/developer/recommended-aws-cdk-project-structure-for-python-applications/) about the recommended AWS CDK project structure for Python applications, but even the other examples in the [project repository](https://github.com/aws-samples/aws-cdk-project-structure-python) do not appear to follow the proposed best practice.

I also believe that you still need a fundamental understanding of CloudFormation to use CDK confidently and safely.

CDK is a super powerful tool but on a few occasions I have witnessed devs get up to speed very quickly in CDK only to be caught out by things like unexpected [update behaviours](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-update-behaviors.html) as they did not have a background in CloudFormation.

## Final thoughts

I look forward to using CDK for all my AWS infrastructure code and by the end of the year I would also like to migrate to TypeScript rather than Python. Expect to see frequent CDK articles posted here as I continue my CDK journey!

Thanks for reading!
