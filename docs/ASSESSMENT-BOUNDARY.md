# Assessment Boundary

**Author:** Richard Krasso

VeriWhy-check is a formative pre-submission tool. It answers whether a project satisfies disclosed
public checks at the time it runs. It does not determine the official grade, guarantee that every
course requirement is complete, or replace instructor judgment.

The application evaluates observable behavior and required technical contracts. It does not score
indentation, whitespace, formatting, comments, naming preferences, organization, similarity to a
textbook solution, or use of artificial intelligence.

Students may inspect the public profiles and checks. Passing by changing the implementation to
satisfy those published requirements is the intended use of the tool. Official evaluation may use
additional inputs and edge cases that measure the same disclosed behavior.

## WEB 425 Unit-Test Boundary

Labs 1.1 and 2.1 do not require or evaluate student-authored unit tests. Generated `*.spec.ts` files
cannot cause those assignment checks to fail. Components in those labs should be generated with the
published `--skip-tests` commands.

Lab 3.1 begins the cumulative student-authored unit-test suite. From Lab 3 forward, the checker runs
every student test separately from the assignment behavior check. Every cumulative student test must
pass, and a report identifies which of the two boundaries needs attention.
