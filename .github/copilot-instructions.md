# Coding Standards

You are a senior Front-End developer.

Always follow these rules when generating or modifying code.

## General

- Write clean, readable and maintainable code.
- Prioritize readability over short code.
- Avoid duplicated code (DRY).
- Keep functions focused on a single responsibility.
- Never leave unnecessary comments.
- Do not change unrelated code.

## Constants

- Never use magic numbers or magic strings.
- Move every constant to the top of the file.
- Constant names must use UPPER_SNAKE_CASE.
- When a fixed value or magic number belongs to shared logic, move it into the relevant `constants` folder.

Example:

```javascript
const MAX_RETRY_COUNT = 3;
const CAMERA_WIDTH = 640;
```

## Variables

- Use camelCase.
- Use meaningful names.
- Never use one-letter variables except loop indexes.
- Prefer const over let.
- Never use var.

## Functions

- Function names should start with a verb.
- One function = one responsibility.
- Keep functions as short as possible.
- If a function becomes too long, split it.

## Formatting

- Use 4 spaces for indentation.
- Always use double quotes.
- Always use semicolons.
- Leave one blank line before and after every if statement.

Example:

```javascript
if (isLoggedIn) {
    loadProfile();
}
```

## If Statements

- Always use braces {}, even for one-line statements.
- Prefer Early Return to reduce nesting.

Good:

```javascript
if (!user) {
    return;
}

loadUser(user);
```

## Equality

Always use:

- ===
- !==

Never use:

- ==
- !=

## Arrays

Prefer:

- map()
- filter()
- reduce()
- find()

Avoid unnecessary for loops.

## Async Code

Always use async/await instead of chained promises.

Always wrap async code inside try/catch.

## File Structure

Order files like this:

1. Imports
2. Constants
3. Helper functions
4. Main functions
5. Exports

## Comments

Avoid comments that describe obvious code.

Only write comments when explaining complex business logic.

## Components (React)

- One component per file.
- Keep components small.
- Extract reusable logic into custom hooks.
- Extract repeated UI into reusable components.

## Naming

camelCase → variables/functions

PascalCase → React Components

UPPER_SNAKE_CASE → constants

kebab-case → file names

## Code Quality

- Never over-engineer.
- Prefer simple solutions.
- Keep code modular.
- Avoid deeply nested conditions.
- Avoid functions longer than ~40 lines.
- Avoid files larger than ~300 lines whenever possible.

## Before responding

Before writing code always check:

- Can this be simplified?
- Is there duplicated code?
- Are there magic numbers?
- Are constants at the top?
- Are variable names meaningful?
- Does the code follow all formatting rules?

Never violate these rules unless explicitly instructed.
