---
layout: "@layouts/BlogPostLayout.astro"
title: Lambda Function URLs
author: Clark
tags:
  - AWS
  - CDK
  - Serverless
image: /images/lambda-function-urls/cover.jpg
date: "2022-04-22T00:00:00Z"
draft: false
github: "https://github.com/clarkmains/lambda-function-urls-cdk-example"
description: How to turn any Lambda Function into an API - for free!
---

AWS just launched [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html) - and you can now add an HTTPS endpoint to any Lambda Function **for free!**

This means you can turn any Lambda Function into an API without the cost and complexity of additional resources like API Gateway or a Load Balancer.

Features include:

- Unique URL that maps to a specific function alias or $LATEST
- Single endpoint with no additional routes
- Secured by IAM or unauthenticated for public access
- Cross-Origin Resource Sharing (CORS) headers

The URL of the function is uniquely generated using the following syntax:

    https://<id>.lambda-url.<region>.on.aws

There is no direct support for custom domain names at the moment.

Lambda Function URLs are best for use cases that don’t require the advanced functionality of API Gateway, such as request validation and custom authorizers.

Keeping this in mind, let's consider some appropriate use cases.

## Use cases

#### Monolithic API

A Lambda Monolith pattern, "Mono-Lambda" or maybe even "Lambdalith"? In such a pattern, request routing is defined within function code e.g. with a framework like Flask. While considered a serverless anti-pattern by some, this approach does overcome the lack of native routing.

#### Web hooks

A public endpoint to receive a webhook from e.g. GitHub.

#### Long running requests

For processes that take an unusually long time to run, Lambda Function URLs let you take advantage of the maximum function invocation timeout of 15 minutes, compared to the maximum limit of 29 seconds when a function is integrated with Amazon API Gateway.

#### Rapid prototyping

As Lambda Function URLs are free and easy to implement they are ideal for prototyping APIs and backend services for full-stack apps. The example that follows will demonstrate prototyping a full stack app using AWS CDK.

## Example Lambda Function URL app in CDK

In this example, we will do the following:

- Define a simple Lambda Function
- Add a URL to the Lambda Function to create an API
- Configure CORS and Auth options
- Dynamically generate configuration to connect the frontend app to the API
- Browse to the frontend website on S3 and invoke the API

NB: The example uses the [S3 Deployment](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_s3_deployment.html) package. This package gets some criticism in the CDK community but it is convenient when developing apps as it keeps things self-contained within CDK e.g. can help avoid having to use separate credentials for syncing files to S3 via CLI.

Code for this example is available on my [GitHub](https://github.com/clarkmains/lambda-function-urls-cdk-example).

Inspect the `DemoAppStack` class of `demo_app_stack.py` to follow along.

1. Create S3 Bucket with public read access to serve the frontend site:

```python
frontend_bucket = s3.Bucket(self, "FrontendBucket",
    website_index_document = "index.html",
    website_error_document = "error.html",
    public_read_access = True
)
```

2. Create a Lambda Function to handle the business logic for our API:

```python
lambda_function = lambda_.Function(self, "ApiFunction",
    runtime=lambda_.Runtime.PYTHON_3_9,
    handler="index.lambda_handler",
    code=lambda_.Code.from_asset(
        os.path.join(os.path.dirname(__file__), "function")
    )
)
```

NB: the 'logic' of the handler simply returns a 200 with a static message:

```python
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Response from Lambda Function URL!')
    }
```

3. Add a URL to the Lambda Function:

```python
lambda_function_url = lambda_function.add_function_url(

    # No auth required as URL will be called from public S3 Bucket site
    auth_type=lambda_.FunctionUrlAuthType.NONE,

    # Configure the S3 Bucket Website URL as an allowed origin
    cors=lambda_.FunctionUrlCorsOptions(
        allowed_methods=[lambda_.HttpMethod.GET],
        allowed_origins=[frontend_bucket.bucket_website_url]
    )
)
```

In the above code we are doing the following:

- Explicitly configure the URL to have auth_type of NONE so that our API can be invoked by anyone (the default is AWS_IAM)

- Configure CORS to allow our origin - the frontend S3 Bucket - to GET the Lambda Function URL

As the auth_type of the Lambda Function URL is NONE, a least-privilege resource policy is automatically added to the Lambda Function, allowing any Principal permission to perform lambda:InvokeFunctionUrl on the Lambda Function.

4. Create a config object to pass the Lambda Function URL to the frontend:

```python
frontend_config = {
    "lambdaFunctionUrl": lambda_function_url.url
}
```

5. Deploy the frontend app to the frontend S3 Bucket:

```python
s3_deployment.BucketDeployment(self, "FrontendDeployment",
    destination_bucket=frontend_bucket,
    sources=[
        s3_deployment.Source.asset(
            os.path.join(os.path.dirname(__file__), "frontend")
        ),
        s3_deployment.Source.json_data("config.json", frontend_config)
    ]
)
```

In the above code we are doing the following:

- Copy the contents of the frontend folder to S3
- Use the deploy-time resolution feature of CDK to hydrate the frontend_config object and write the object to the config.json file

The config.json file is imported by the frontend app. This is how the frontend discovers the API address i.e. our Lambda Function URL.

If you require more granular control over config generation - an alternative method could be to define CDK outputs, parse them using [jq](https://stedolan.github.io/jq/) and write the config file in another task.

#### Try out the app

If you deploy the app a single CloudFormation Stack will be created:

    lambda-function-urls-demo

After deployment, the CDK CLI will output the frontend S3 website URL:

    FrontendUrl = http://<id>.s3-website-<region>.amazonaws.com

Open the URL in a browser to try it out.

![Front end](/images/lambda-function-urls/frontend-button.png)

Clicking on the button will replace the placeholder text with the response from the Lambda Function URL.

## Final thoughts

I think Lambda Function URLs are a great solution for prototyping in particular.

I would love to be able to use custom domains with them but regardless - it is really cool to get this additional functionality for free.

Thanks for reading!
