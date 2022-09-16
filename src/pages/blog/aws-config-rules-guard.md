---
layout: "@layouts/BlogPostLayout.astro"
title: Build better AWS Config Rules with Guard and CDK
author: Clark
tags:
  - AWS
  - CDK
  - Governance
image: /images/aws-config-rules-guard/cover.jpg
date: "2022-07-20T00:00:00Z"
draft: false
github: "https://github.com/clarkmains/aws-config-guard-cdk-example"
description: Reduce AWS Config cost and resource usage using Guard Custom Policy and CDK
---

As of [v2.33.0](https://github.com/aws/aws-cdk/releases/tag/v2.33.0) AWS CDK includes a CloudFormation update that supports building AWS Config [Custom Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html) using [Guard](https://github.com/aws-cloudformation/cloudformation-guard). This offers a potentially significant saving of time and resources if you develop your own Custom Rules.

Traditionally, to satisfy a use case that is not covered by the AWS Managed Config Rules, you would use a regular programming language like Python, to build a Lambda-backed Custom Rule.

AWS are kind enough to supply the [AWS Config Rules Development Kit](https://github.com/awslabs/aws-config-rdk) which simplifies development but fundamentally there is no changing the fact that every Custom Rule built in this way deploys a Lambda Function, increasing operational complexity and associated costs for invocations, storage etc. This can really add up if you have a lot of Custom Rules across multiple accounts.

## Why use Guard Custom Policy

Guard Custom policy lets you define your policy-as-code to evaluate your resource against the policy that’s defined using the Guard domain-specific language (DSL).

Guard Custom policy can help simplify the process of creating custom rules since you won’t need to create your own Lambda functions.

You can create an AWS Config custom rule using Guard DSL without needing to develop Lambda functions to manage your custom rules.

## Guard Custom Policy example in CDK

Code for this example is available on my [GitHub](https://github.com/clarkmains/aws-config-guard-cdk-example).

In this example, we will do the following:

- Create an L2 Construct from `CfnConfigRule` to reduce boilerplate
- Write a rule using the L2 Construct we have created, to mark AutoScaling Groups as NON_COMPLIANT unless they use a Launch Template

CDK docs reveal that the [CustomRule](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_config/CustomRule.html) L2 Construct does not yet support Guard Custom Policy, so we must build our own using [CfnConfigRule](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_config/CfnConfigRule.html), shown below:

```python
CfnConfigRule(self, "MyCfnConfigRule",
    source=config.CfnConfigRule.SourceProperty(
        owner="owner",

        custom_policy_details=config.CfnConfigRule.CustomPolicyDetailsProperty(
            enable_debug_log_delivery=False,
            policy_runtime="policyRuntime",
            policy_text="policyText"
        ),
        source_details=[config.CfnConfigRule.SourceDetailProperty(
            event_source="eventSource",
            message_type="messageType",

            maximum_execution_frequency="maximumExecutionFrequency"
        )],
        source_identifier="sourceIdentifier"
    ),

    config_rule_name="configRuleName",
    description="description",
    input_parameters=input_parameters,
    maximum_execution_frequency="maximumExecutionFrequency",
    scope=config.CfnConfigRule.ScopeProperty(
        compliance_resource_id="complianceResourceId",
        compliance_resource_types=["complianceResourceTypes"],
        tag_key="tagKey",
        tag_value="tagValue"
    )
)
```

Thankfully, the CloudFormation docs confirm that most of the CfnConfigRule properties are optional and a portion of those that _are_ required when using a Guard Custom Policy [source](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-config-configrule-source.html) are effectively constants. Yay!

This is the result: an L2 Construct `GuardPolicyRule` that you can find in the `guard` package of the example project.

```python
class GuardPolicyRule(Construct):
    """Creates an AWS Custom Config Rule that uses Guard Custom Policy.

    :param name: A name for the AWS Config rule.
    :param description: A description that you provide for the AWS Config rule.
    :param resource_types: AWS resource types that trigger rule evaluation.
    :param guard_policy_text: The policy definition for the AWS Config rule.
    :param enable_debug: Enable debug logging for the AWS Config rule.
    """

    def __init__(self, scope: Construct, id: str, name: str, description: str,
        resource_types: list[str], guard_policy_text: str,
        enable_debug: bool = False) -> None:

        super().__init__(scope, id)

        rule = aws_config.CfnConfigRule(self, id,
            config_rule_name = name,
            description = description,

            scope = aws_config.CfnConfigRule.ScopeProperty(
                compliance_resource_types = resource_types,
            ),

            source = aws_config.CfnConfigRule.SourceProperty(
                custom_policy_details = aws_config.CfnConfigRule.CustomPolicyDetailsProperty(
                    enable_debug_log_delivery=enable_debug,
                    policy_runtime="guard-2.x.x",
                    policy_text=guard_policy_text
                ),

                # all these props are constant for Guard Custom Policy rules
                owner="CUSTOM_POLICY",
                source_details=[
                    aws_config.CfnConfigRule.SourceDetailProperty(
                        event_source="aws.config",
                        message_type="ConfigurationItemChangeNotification",
                    ),
                    aws_config.CfnConfigRule.SourceDetailProperty(
                        event_source="aws.config",
                        message_type="OversizedConfigurationItemChangeNotification",
                    )
                ],
            )
        )

```

Now we need to pass just a few args when creating an instance of `GuardPolicyRule` to define a new rule with Guard Custom Policy:

```python
guard.GuardPolicyRule(self, "ASGLaunchTemplateRule",
    name = "autoscaling-group-use-launch-template",
    description = "AutoScaling Groups must use Launch Template",
    resource_types = ["AWS::AutoScaling::AutoScalingGroup"],
    guard_policy_text = (
        "rule autoscaling_group_must_use_launch_template { "
            "configuration.launchTemplate exists "
        "}"
    )
)
```

## Deployment

AWS Config must already be enabled in the account you are deploying to.

When you `cdk deploy` the app, a single CloudFormation Stack will be created:

    config-custom-rules-guard

Open the AWS Config service in the AWS Console. You should see a new Config Rule there:

    autoscaling-group-use-launch-template

Remember - you won't see any evaluation results unless you have some EC2 AutoScaling Groups though!

## Final thoughts

One thing that is missing from this new feature is the capability to unit test the Policy Text of a Guard Policy Custom Rule in the same way that a Guard Policy can be tested using the Guard CLI and a test file. I have a few ideas with regards to this however so watch this space!

I hope this was useful, thanks for reading!
