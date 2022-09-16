---
layout: "@layouts/BlogPostLayout.astro"
title: Simulate JUCE Framework Unlock API using AWS SAM
author: Clark
tags:
  - Audio
  - AWS
  - Serverless
image: /images/juce-unlock-api-serverless/cover.jpg
date: "2021-02-26T00:00:00Z"
draft: false
github: "https://github.com/clarkmains/juce-unlock-api"
description: AWS Serverless application to simulate Unlock API for JUCE Framework apps
---

I have been developing audio devices for a while in [Max](https://cycling74.com/products/max) and [Max for Live](https://www.ableton.com/en/live/max-for-live/).

Recently I have explored options to migrate my devices to work across more platforms, using the VST plugin standard. JUCE is the established leader for development in this area.

[JUCE](https://juce.com/) is a framework for building cross-platform applications and mobile apps that rely on advanced audio functionality. It comes with an abundance of features including a form of copy protection that involves online authorisation against a 'Marketplace' authorisation API.

Apps and plugins that employ this copy protection are locked until authorisation. When invoked, the authorisation API uses asymmetric cryptography to verify that a product key is correct and if so, unlocks the software allowing all the features to be used.

![JUCE Unlocked](/images/juce-unlock-api-serverless/juce-unlock-status.png)

The [official JUCE online registration tutorial](https://docs.juce.com/master/tutorial_online_unlock_status.html) describes how to set up a local server to simulate the online unlock API for development purposes.

Unfortunately the local server setup is a bit painful, involving self-signed SSL certificates and the usual dance that comes with this type of approach. As the server also runs locally, it can be frustrating to use when switching between e.g. MacOS and Windows build environments.

To improve the development experience, I wrote a little [AWS SAM](https://aws.amazon.com/serverless/sam/) application to deploy a simulation of the JUCE Framework Online Unlock service as a serverless application on AWS.

Code for this application is available on my [GitHub](https://github.com/clarkmains/juce-unlock-api).

This approach offers the following advantages -

- Uses an Amazon CA-signed Certificate, so no messing around with self-signed certificates
- Deploys in a reproducible manner in under 1 minute via infrastructure code
- Can be used by multiple developers and environments simultaneously
- Can be deployed multiple times to facilitate multiple apps

The application is just a simple simulator at the moment, offering the same functionality as the solution described in the JUCE tutorial, but it should help ease some points of friction.

Thanks for reading!
