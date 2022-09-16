---
layout: "@layouts/BlogPostLayout.astro"
title: How to write testable Python documentation
author: Clark
tags:
  - Python
  - Testing
image: /images/python-testable-documentation/cover.jpg
date: "2021-08-09T00:00:00.121Z"
draft: false
description: Prevent drift and test your docstrings with doctest from the Python Standard Library
---

The Python Standard Library has a built-in test framework that is often overlooked, a module called [doctest](https://docs.python.org/3/library/doctest.html).

The doctest module has a niche - to check that code examples in docstrings are up to date. The doctest module searches code for text that looks like interactive REPL sessions, then executes those sessions to verify that they work as written.

Why might you be interested in such a thing? Well -

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">“Code never lies. Comments sometimes do.”<br>— some old guy, some time in the past <a href="https://t.co/Pgzd8plIpG">https://t.co/Pgzd8plIpG</a></p>&mdash; Ron Jeffries (@RonJeffries) <a href="https://twitter.com/RonJeffries/status/949400218092687361?ref_src=twsrc%5Etfw">January 5, 2018</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<br />

If the behavior of a function or method is changed and you forget to update the corresponding docstring, then that docstring truly typifies the old adage "comments are lies".

On the other hand, if you include one or two doctests within each docstring, any out of date docstrings should be identified when you run the doctest module as part of your test strategy, prompting you to take steps to resolve the issue.

This is a really convenient way to add testability to documentation, in addition to other tests implemented via a fully-fledged framework like unittest or pytest.

## Example

The following function returns all the vowel characters present in a word:

```python
def vowels(word: str) -> list[str]:
    return list(filter(lambda s: s.lower() in "aeiou", word))
```

Interactively, we can call the function and inspect the return value like so:

```python
>>> vowels("Scotland")
['o', 'a']
```

You can add any number of these input-output examples to a docstring.

The doctest module will perform automated testing of them all to verify your documentation as part of your test strategy.

Lets update the function and add a docstring that includes a few examples for doctest to pick up:

```python
def vowels(word: str) -> list[str]:
    """Given a string, return a list of all vowel letters.

    :param word: str
    :return: list[str]

    >>> vowels("Scotland")
    ['o', 'a']

    >>> vowels("England")
    ['E', 'a']

    >>> vowels("Kyrgyz")
    []
    """
    return list(filter(lambda s: s.lower() in "aeiou", word))
```

Now invoke doctest against the module containing the function:

```bash
❯ python -m doctest vowels.py
```

The command will simply exit with status code 0 if successful.

To have doctest output a report, run the command in verbose (-v) mode:

```bash
❯ python -m doctest -v vowels.py

Trying:
    vowels("Scotland")
Expecting:
    ['o', 'a']
ok
Trying:
    vowels("England")
Expecting:
    ['E', 'a']
ok
Trying:
    vowels("Kyrgyz")
Expecting:
    []
ok

1 items passed all tests:
   3 tests in vowels.vowels
3 tests in 2 items.
3 passed and 0 failed.
Test passed.
```

So far we have run the doctest module directly. You can also execute doctests as part of your test run, which may suit your workflow more.

With pytest you can supply an argument to the pytest executable:

    $ pytest --doctest-modules

Or add doctest to your `pytest.ini` to persist the configuration:

```ini
[pytest]
addopts = --doctest-modules
```

Any doctests that do not pass will result in `DocTestFailure` in the test session.

Thanks for reading! I think doctest provides a really neat piece of functionality that can add value to your test strategy.
