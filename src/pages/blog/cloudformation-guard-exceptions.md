---
layout: "@layouts/BlogPostLayout.astro"
title: Implement policy exceptions in CloudFormation Guard
author: Clark
tags:
  - AWS
  - CDK
  - CloudFormation
  - Governance
image: /images/cloudformation-guard-exceptions/cover.jpg
date: "2021-09-16T00:00:00.121Z"
draft: false
description: How to suppress evaluation of policy rules when a genuine exception exists
---

[Guard](https://github.com/aws-cloudformation/cloudformation-guard) aka CloudFormation Guard, is an open-source general-purpose policy-as-code evaluation tool, commonly used to define Guardrails and Governance policies for resources that will be deployed via CloudFormation.

These mechanisms are intended to keep us safe when developing in AWS. But it is rare that every policy can be applied every time, without exception.

For example - say there is a policy implemented via Guard stating that all S3 Buckets must be KMS encrypted. Seems a sensible default. But then one day you are required to host a static site in S3 and serve it via CloudFront..

You cannot satisfy this use case and also comply with the policy that all S3 Buckets must be KMS encrypted without the additional cost and complexity of an intermediary Lambda@Edge function to sign requests for objects from S3.

Also, a KMS encrypted bucket arguably offers no benefit in this case as the content is ultimately being served to the public. So how can we accomodate a specific exception to the policy while maintaining the sensible defaults?

## Rule suppression

In the event that a genuine exception to a policy is allowed, accepted best practice is to allow the rule to be suppressed. This involves refactoring the rule so it can be skipped when specific Metadata is added to a resource.

The practice is somewhat under-documented but you can find it discussed in an issue on the [official CloudFormation Guard GitHub](https://github.com/aws-cloudformation/cloudformation-guard/issues/105#issuecomment-858048996).

## An example

Let's implement rule suppression by refactoring some [example code](https://github.com/clarkmains/cloudformation-guard-v2-example) from one of my [previous posts](https://clarkmains.com/posts/cloudformation-guard-v2.html).

The repository contains the following example code:

    .
    ├── cloudformation.yaml     # CloudFormation example template to validate
    ├── s3-bucket-tests.yaml    # Tests for Guard Policies
    └── s3-bucket.guard         # Guard Policies for S3

Two S3 Buckets are defined in the CloudFormation template - one of them has KMS encryption configured and the other does not.

Validate the template against the policy file using the Guard CLI:

    ❯ cfn-guard validate -d cloudformation.yaml -r s3-bucket.guard -S all

Validation fails as expected, as one of the S3 Buckets is not KMS encrypted:

    cloudformation.yaml Status = FAIL
    FAILED rules
    s3-bucket.guard/s3_bucket_is_kms_encrypted    FAIL
    ---
    Evaluating data cloudformation.yaml against rules s3-bucket.guard
    Number of non-compliant resources 1
    Resource = Bucket {
      Type      = AWS::S3::Bucket
      Rule = s3_bucket_is_kms_encrypted {
    ..

## Refactoring

First, update the tests file:

    s3-bucket-tests.yaml

Add a new test that expects Guard to SKIP validation of the rule if the Metadata of the S3 Bucket resource states the rule is to be suppressed:

```yaml
# SKIP if S3 Bucket not KMS encrypted but this rule is being supressed.
- input:
    Resources:
      Bucket:
        Type: "AWS::S3::Bucket"
        Metadata:
          cfn-guard:
            SuppressedRules:
              - s3_bucket_is_kms_encrypted
  expectations:
    rules:
      s3_bucket_is_kms_encrypted: SKIP
```

Run the tests:

    ❯ cfn-guard test --rules-file s3-bucket.guard --test-data s3-bucket-tests.yaml

The test run fails as expected, as the rule does not yet recognise suppression:

    ..
    Test Case #2
    FAIL Rules:
      s3_bucket_is_kms_encrypted: Expected = SKIP, Evaluated = [FAIL]
    ..

Next, refactor the rule to allow suppression:

    s3-bucket.guard

We will add a section to rule so it can recognise when it has been suppressed:

```
# Ignore this rule if in list of SuppressedRules
let metadata = Metadata."cfn-guard".SuppressedRules[
    some this == "s3_bucket_is_kms_encrypted"
]
```

The entire rule will now look like this:

```
# All S3 Buckets must be encrypted using KMS
# ---
let s3_buckets = Resources.*[Type == 'AWS::S3::Bucket']

# Only apply rule when there are S3 Buckets defined in the template
rule s3_bucket_is_kms_encrypted when %s3_buckets !empty {
    %s3_buckets {

        # Ignore this rule if in list of SuppressedRules
        let metadata = Metadata."cfn-guard".SuppressedRules[
            some this == "s3_bucket_is_kms_encrypted"
        ]

        when %metadata empty {
            Properties {
                # Bucket must be encrypted using KMS
                BucketEncryption.ServerSideEncryptionConfiguration[*] {
                    ServerSideEncryptionByDefault.SSEAlgorithm IN ['aws:kms']
                }
            }
        }
    }
}
```

Run the tests again:

    ❯ cfn-guard test --rules-file s3-bucket.guard --test-data s3-bucket-tests.yaml

All tests now pass!

    Test Case #1
      PASS Rules:
        s3_bucket_is_kms_encrypted: Expected = SKIP

    Test Case #2
      PASS Rules:
        s3_bucket_is_kms_encrypted: Expected = SKIP

    Test Case #3
      PASS Rules:
        s3_bucket_is_kms_encrypted: Expected = FAIL

    Test Case #4
      PASS Rules:
        s3_bucket_is_kms_encrypted: Expected = FAIL

    Test Case #5
      PASS Rules:
        s3_bucket_is_kms_encrypted: Expected = PASS

Finally, refactor the CloudFormation template:

    cloudformation.yaml

Add Metadata to the unencrypted S3 Bucket resource:

      Bucket:
      Type: 'AWS::S3::Bucket'
      Properties:
        VersioningConfiguration:
          Status: Enabled
      Metadata:
        cfn-guard:
          SuppressedRules:
          - s3_bucket_is_kms_encrypted

Validate the template against the policy file using the Guard CLI:

    ❯ cfn-guard validate -d cloudformation.yaml -r s3-bucket.guard -S all

The template now validates:

    cloudformation.yaml Status = PASS
    PASS rules
    s3-bucket.guard/s3_bucket_is_kms_encrypted    PASS
    ---

And our work here is done!

## AWS CDK

If you use CDK - unfortunately you can only currently add Metadata to a resource when using [L1 Constructs](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html) aka "Escape Hatches".

For example, in Python:

```python
  bucket = s3.CfnBucket(self, "UnencryptedBucket")
  bucket.cfn_options.metadata = {
      "cfn-guard": {"SuppressedRules": "s3_bucket_is_kms_encrypted"}
  }
```

This makes implementing rule suppression is a little more complex versus vanilla CloudFormation, but at it is still possible. Check out [cdk-nag](https://github.com/cdklabs/cdk-nag) also - this performs a similar function but may be a better option for CDK-specific use.

Thanks for reading!
