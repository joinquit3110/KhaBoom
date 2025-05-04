# Mathigon Integration Guide for KHA-BOOM!

This document provides a quick reference for working with Mathigon in the KHA-BOOM! learning platform.

## Core Concepts

Mathigon is an interactive mathematics education platform with rich features including:

- Interactive diagrams and visualizations
- Custom step-by-step content
- Mathematical typesetting
- Animations and transitions
- Games and puzzles
- Audio narration
- Video integration
- Drawing tools

## Course Structure

Each Mathigon course consists of:

1. **content.md** - The main Markdown content file with interactive elements
2. **content.json** - The compiled JSON version of the content (generated automatically)
3. **functions.ts** - TypeScript functions for interactivity
4. **styles.scss** - Custom styling for the course
5. Asset directories: images, svg, audio, components, etc.

## Markdown Syntax

Mathigon uses a custom flavor of Markdown:

```markdown
# Course Title

## First Section

> id: step-1
> section: introduction
> color: "#5A49C9"

This is a paragraph with an input field like [[10]] or a choice [[yes|no]].

Here is a math equation: `x^2 + y^2 = r^2`

Here is a variable slider: ${a}{a|5|1,10,1}

---

> id: step-2
> goals: animation

This is the second step that requires completing an animation.
```

## Interactive Elements

### Variables and Sliders

```markdown
The value of x is ${x}{x|5|0,10,1}
```

### Math Equations

```markdown
`x^2 + 2x + 1 = (x+1)^2`
```

### Input Fields

```markdown
Enter a number: [[10]]
Choose an option: [[correct|wrong1|wrong2]]
```

### Step Goals

```markdown
> id: step-3
> goals: click-circle move-slider complete-proof

This step requires completing multiple goals.
```

### Classes and Attributes

```markdown
{.theorem} This is a theorem.

{.note(attr="value")} This is a note with attributes.
```

### Special Blocks

```markdown
::: column.grow
Content in a growing column
::: column(width=300)
Content in a fixed-width column
:::
```

## Using These Features in KHA-BOOM!

1. Create your content in `src/courses/your-course-name/content.md`
2. Run `npm run build:content` to generate the JSON
3. The course will be available at `/course/your-course-name`

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Run the diagnostic script with `window.testMathigon()`
3. Verify content.json has been generated correctly
4. Ensure CORS headers are properly set

## Creating New Courses

To create a new course:

1. Create a directory under `src/courses/` with the course name
2. Add the required files (content.md, styles.scss, etc.)
3. Run the build script to generate the JSON
4. Check the course dashboard to ensure it appears

## Reference Documentation

For more detailed documentation:
- Check the `docs/mathigon's docs` directory
- Refer to Mathigon Studio documentation
- See the examples in the `ref/textbooks-master` directory 