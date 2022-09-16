---
layout: "@layouts/BlogPostLayout.astro"
title: DynamoDB bulk import from S3
author: Clark
tags:
  - AWS
  - CDK
  - Serverless
image: "/images/dynamodb-import-s3/cover.jpg"
date: "2022-08-28T00:00:00Z"
github: "https://github.com/clarkmains/dynamodb-import-s3-cdk-example"
draft: false
description: Create a new DynamoDB Table from data on S3 natively in CDK or CloudFormation
---

AWS [announced](https://aws.amazon.com/about-aws/whats-new/2022/08/amazon-dynamodb-supports-bulk-imports-amazon-s3-new-dynamodb-tables/?sc_channel=sm&sc_campaign=DB_Blog&sc_publisher=TWITTER&sc_country=global&sc_geo=GLOBAL&sc_outcome=awareness&sc_category=Amazon%20DynamoDB&trk=ddb-import-from-s3) earlier this month a new feature for DynamoDB: native support for bulk imports from Amazon S3 to new DynamoDB tables:

> Amazon DynamoDB now makes it easier for you to migrate and load data into new DynamoDB tables by supporting bulk data imports from Amazon S3.

The _huge_ thing about this feature is that it is a truly native, fully managed feature that requires no additional infrastructure or writing any code:

> The new DynamoDB import from S3 feature simplifies the import process so you do not have to develop custom solutions or manage instances to perform imports.

And one more thing:

> DynamoDB bulk import also does not consume your table’s write capacity

Wow! So no need to be concerned about capacity planning or additional costs in dev due to frequent tear-down and re-deployment of tables to ensure clean and predictable data for testing. Nice!

## CloudFormation support

AWS have published a [nice blog post](https://aws.amazon.com/blogs/database/amazon-dynamodb-can-now-import-amazon-s3-data-into-a-new-table/) with a step-by-step example and sample data so you can try this feature out for yourself, 'ClickOps' style. But one thing I always look out for with new launches is CloudFormation support, as we aspire to do everything in an automatable and predictable, "as-code" way.

To implement this feature using CloudFormation, we need to use the `ImportSourceSpecification` property type of `AWS::DynamoDB::Table`.

The CloudFormation docs mention the property, but with a caveat:

> Not currently supported by AWS CloudFormation

However, delving deeper - CloudFormation Release History begs to differ:

![CloudFormation Release History](/images/dynamodb-import-s3/cloudformation-release-history.png)

_And_ the CloudFormation Spec contains the property type.

How curious! There's only one way to know for sure - let's try it out.

### DynamoDB S3 Import using CDK

**NB:** Please keep in mind that this method is using an API that is not yet officially available via CloudFormation and thus likely unstable and subject to change.

Code for this example is available on my [GitHub](https://github.com/clarkmains/dynamodb-import-s3-cdk-example).

This example is based on the test data from the [AWS Blog Post](https://aws.amazon.com/blogs/database/amazon-dynamodb-can-now-import-amazon-s3-data-into-a-new-table/) to make it easier to follow along with both blog posts.

1. Create an S3 Bucket to store the data that will be imported to dynamodb:

```python
bucket = s3.Bucket(self, "Bucket")
```

To make this a self contained solution using CDK alone, we will use an S3 BucketDeployment construct to copy the import data to S3:

```python
deployment = s3_deployment.BucketDeployment(self, "BucketDeployment",
    destination_bucket=bucket,
    sources=[s3_deployment.Source.asset(DATA_PATH)]
)
```

Define the dynamodb table where the data will be imported:

```python
table = dynamodb.Table(self, "Table",
    table_name=TABLE_NAME,
    partition_key=dynamodb.Attribute(
        name="PK",
        type=dynamodb.AttributeType.STRING
    ),
    sort_key=dynamodb.Attribute(
        name="SK",
        type=dynamodb.AttributeType.STRING
    )
)
```

As we know, the `ImportSourceSpecification` properties that configure the data import from S3, are not supported by CDK yet.

So - to configure these properties on the dynamodb table, we need to access the L1 construct of the table and add the properties using [property overrides](https://docs.aws.amazon.com/cdk/api/v1/python/aws_cdk.aws_cloudformation/CfnCustomResource.html#aws_cdk.aws_cloudformation.CfnCustomResource.add_property_override).

Add property overrides to the L1 construct of the DynamoDB table:

```python
cfn_table: dynamodb.CfnTable = table.node.default_child

cfn_table.add_property_override(
    "ImportSourceSpecification.S3BucketSource.S3Bucket",
    bucket.bucket_name
)

cfn_table.add_property_override(
    "ImportSourceSpecification.InputFormat",
    "DYNAMODB_JSON"
)
```

This is all that is needed to implement the new DynamoDB import from S3 feature. The remainder of the code is standard CDK project boilerplate.

Deployment takes around 5 minutes for this example.

### Failure modes

Interestingly, with respect to CloudFormation, the DynamoDB import from S3 is not asynchronous.

As a result, your `cdk deploy` operation will wait for the import process to complete as the CloudFormation Stack will not stabilise until then.

Also worth noting is that the sample data from the [AWS Blog Post](https://aws.amazon.com/blogs/database/amazon-dynamodb-can-now-import-amazon-s3-data-into-a-new-table/) deliberately contains two erroneous records in order to demonstrate how errors are handled - see Figures 7 and 8 on that blog post for more details.

If your import from S3 encounters similar errors using CDK or CloudFormation - the CloudFormation Stack will also error and attempt to roll back!

For this reason I have removed the two erroneous records from the copy of the data in my example code repository, but you can of course use the original records from the AWS blog post if you wish.

### Final thoughts

This is potentially a great piece of automation especially for dev and test environments. Not sure how I feel about the failure modes though and I wonder if making improvements to these behaviours is the reason for CloudFormation support being delayed? I guess we shall find out..

Thanks for reading! 👍
