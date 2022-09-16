---
layout: "@layouts/BlogPostLayout.astro"
title: AWS CloudFormation Guard version 2 is here
author: Clark
tags:
  - AWS
  - CloudFormation
  - Governance
image: /images/cloudformation-guard-v2/cover.jpg
date: "2021-06-18T00:00:00.121Z"
draft: false
github: "https://github.com/clarkmains/cloudformation-guard-v2-example"
description: Governance shifts-left with guardrails for CloudFormation templates and more
---

With respect to deploying AWS resources - shifting compliance validation to the left of the deployment pipeline so that violations are caught early e.g. in the static analysis stage of CI/CD, rather than _after_ deployment with AWS Config or another tool, can be very valuable.

If we can detect mis-configuration and prevent the deployment of non-compliant resources early on, we save time, money and reduce potential risk.

CloudFormation in particular can take some time to provision resources, so anything that can be done to shorten the feedback loop is most welcome.

[CloudFormation Guard](https://github.com/aws-cloudformation/cloudformation-guard) is a policy-as-code evaluation tool that can help to realise this shift.

CloudFormation Guard - also known as just 'Guard' - is an open-source CLI tool that provides a DSL to write policy rules and validate JSON and YAML data against those rules.

## Not just for CloudFormation

With version 2.0, Guard becomes a more general purpose tool.

Developers can now write policy rules for any JSON and YAML formatted file such as Kubernetes configurations and Terraform JSON configurations, in addition to already supported CloudFormation templates.

For example, developers using Terraform can also leverage Guard to:

- Assess a Terraform plan (in JSON format) for deployment safety checks
- Inspect Terraform state files to detect live state deviations

## An example

This is a practical CloudFormation example, covering the following:

- **Guard policy** - a rule to assert that any S3 Buckets use KMS encryption
- **Guard tests** - unit tests to verify the policy against several test cases
- **Guard CLI** - use the CLI to run tests and validate CloudFormation

Code for this example is available on [GitHub](https://github.com/clarkmains/cloudformation-guard-v2-example).

### Defining a Guard policy

A Guard policy is defined in the file `s3-bucket.guard`.

In this example a single rule is defined, but there could be many rules in this file.

First, we declare a variable: `s3_buckets`

```rust
let s3_buckets = Resources.*[
    Type == 'AWS::S3::Bucket'
]
```

This variable will contain all `Resources` of `Type: 'AWS::S3::Bucket'` that are present in the CloudFormation template being validated.

Next, the Guard policy rule `s3_bucket_is_kms_encrypted` is defined.

The rule states that - every `AWS::S3::Bucket` resource in the variable `s3_buckets` must have a `BucketEncryption` property and that the encryption algorithm must be `aws:kms`.

```rust
rule s3_bucket_is_kms_encrypted when %s3_buckets !empty {
  let encryption = %s3_buckets.Properties.BucketEncryption
    %encryption exists
    %encryption.ServerSideEncryptionConfiguration[*] {
      ServerSideEncryptionByDefault.SSEAlgorithm IN ['aws:kms']
    }
}
```

### Defining Guard tests

Guard has a built-in unit testing framework to validate policy rules and instil confidence in developers that rules defined in a Guard file do indeed comply with expectations.

In this example, tests are defined in the file `s3-bucket-tests.yaml`.

Guard tests are defined in a YAML as a sequence. Within each element of the sequence there is an `input` mapping that specifies the data to be tested, and an `expectations` mapping that asserts the expected outcome of the test for any particular rule.

```yaml
# FAIL if Bucket not encrypted.
- input:
    Resources:
      Bucket:
        Type: "AWS::S3::Bucket"
        Properties:
          BucketName: "MyBucket"
  expectations:
    rules:
      s3_bucket_is_kms_encrypted: FAIL
```

In our case, as we are working with CloudFormation, the test input is a snippet of a `Resources` mapping written as it would be in a regular CloudFormation template.

The test has the expectation that the `s3_bucket_is_kms_encrypted` rule will FAIL as the Bucket resource declared in the test input has no encryption at all.

A test has 3 possible expectations:

- SKIP
- FAIL
- PASS

There are further tests in the tests file. The remaining tests in the file specify inputs that will test each of the possible outcomes at least once.

### Run tests using the Guard CLI

Guard tests are run using the `test` command of the [Guard CLI](https://github.com/aws-cloudformation/cloudformation-guard).

    ❯ cfn-guard test --rules-file s3-bucket.guard --test-data s3-bucket-tests.yaml

A summary of the results will be displayed:

```bash
Test Case #1
  PASS Rules:
    s3_bucket_is_kms_encrypted: Expected = SKIP

Test Case #2
  PASS Rules:
    s3_bucket_is_kms_encrypted: Expected = FAIL

Test Case #3
  PASS Rules:
    s3_bucket_is_kms_encrypted: Expected = FAIL

Test Case #4
  PASS Rules:
    s3_bucket_is_kms_encrypted: Expected = PASS
```

In this example, all test cases passed.

If a test does not pass, the output would be slightly different:

```bash
Test Case #3
  FAIL Rules:
    s3_bucket_is_kms_encrypted: Expected = PASS, Evaluated = [FAIL]
```

The CLI exit code would also change from 0 to 7 so you can take appropriate steps in an automated test scenario.

### Validate CloudFormation using the Guard CLI

Our CloudFormation template file defines two S3 Buckets:

```yaml
Bucket:
  Type: "AWS::S3::Bucket"
  Properties:
    VersioningConfiguration:
      Status: Enabled

EncryptedBucket:
  Type: "AWS::S3::Bucket"
  Properties:
    VersioningConfiguration:
      Status: Enabled
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: "aws:kms"
            KMSMasterKeyID: !Ref BucketEncryptionKey
```

Template validation is performed using the validate command of the Guard CLI.

The template filename is specified via the data option `-d` and the Guard policy filename via the rules option `-r`.

```bash
❯ cfn-guard validate -d cloudformation.yaml -r s3-bucket.guard
```

A summary of the results will be displayed:

    cloudformation.yaml Status = FAIL
    FAILED rules
    s3-bucket.guard/s3_bucket_is_kms_encrypted    FAIL
    ---
    Evaluating data cloudformation.yaml against rules s3-bucket.guard
    Number of non-compliant resources 1
    Resource = Bucket {
      Type      = AWS::S3::Bucket
      Rule = s3_bucket_is_kms_encrypted {

As there is an S3 Bucket resource in the template that is not KMS encrypted, the validation fails.

## Final thoughts

Guard certainly deserves a place alongside [cfn-nag](https://github.com/stelligent/cfn_nag), [cfn-lint](https://github.com/aws-cloudformation/cfn-lint) et al. in your CloudFormation deployment pipeline toolkit and I look forward to trying it out with Terraform too.

## Further resources

- [AWS Management & Governance Blog](https://aws.amazon.com/blogs/mt/introducing-aws-cloudformation-guard-2-0/)
- [CloudFormation Guard Docs](https://github.com/aws-cloudformation/cloudformation-guard/tree/main/docs)
