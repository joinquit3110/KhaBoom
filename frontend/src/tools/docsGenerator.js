/**
 * KhaBoom Documentation Generator
 * 
 * This utility helps content creators understand the available 
 * interactive components and how to use them in their course content.
 * 
 * Run this script to generate markdown documentation in the docs folder.
 */

const fs = require('fs');
const path = require('path');

// Component documentation
const COMPONENT_DOCS = [
  {
    name: 'x-blank',
    description: 'Creates a blank space for students to fill in',
    examples: [
      '[[solution]]',
      '[[n*x^2]]'
    ],
    attributes: [
      { name: 'number', description: 'Force numerical input' },
      { name: 'placeholder', description: 'Text to show in empty blank' }
    ]
  },
  {
    name: 'x-slider',
    description: 'Interactive slider for selecting numeric values',
    examples: [
      'x-slider(steps=5 min=0 max=10)',
      'x-slider(steps=100 min=-5 max=5 default=0)'
    ],
    attributes: [
      { name: 'steps', description: 'Number of steps' },
      { name: 'min', description: 'Minimum value' },
      { name: 'max', description: 'Maximum value' },
      { name: 'default', description: 'Default value' }
    ]
  },
  {
    name: 'x-geopad',
    description: 'Interactive geometry pad for drawing and manipulating shapes',
    examples: [
      'x-geopad(width=500 height=400)',
      'x-geopad(grid=true axes=true)'
    ],
    attributes: [
      { name: 'width', description: 'Width in pixels' },
      { name: 'height', description: 'Height in pixels' },
      { name: 'grid', description: 'Show grid (true/false)' },
      { name: 'axes', description: 'Show axes (true/false)' }
    ]
  },
  {
    name: 'x-equation',
    description: 'Interactive equation editor',
    examples: [
      'x-equation()',
      'x-equation(vars="x,y")'
    ],
    attributes: [
      { name: 'vars', description: 'Comma-separated list of variables to highlight' },
      { name: 'placeholder', description: 'Text to show initially' }
    ]
  },
  {
    name: 'x-img',
    description: 'Image with enhanced features',
    examples: [
      'x-img(src="triangle.png" width=400 height=300)',
      'x-img(src="./images/circle.jpg" width=200 height=200 alt="A circle")'
    ],
    attributes: [
      { name: 'src', description: 'Image source path' },
      { name: 'width', description: 'Width in pixels' },
      { name: 'height', description: 'Height in pixels' },
      { name: 'alt', description: 'Alternative text for accessibility' }
    ]
  },
  {
    name: 'x-coordinate-system',
    description: 'Interactive coordinate system for plotting points and functions',
    examples: [
      'x-coordinate-system(width=600 height=400)',
      'x-coordinate-system(grid=1 x-axis=-10,10,1 y-axis=-5,5,1)'
    ],
    attributes: [
      { name: 'width', description: 'Width in pixels' },
      { name: 'height', description: 'Height in pixels' },
      { name: 'grid', description: 'Grid spacing' },
      { name: 'x-axis', description: 'X-axis range and spacing: min,max,step' },
      { name: 'y-axis', description: 'Y-axis range and spacing: min,max,step' }
    ]
  },
  {
    name: 'x-mathfield',
    description: 'Math input field for entering mathematical expressions',
    examples: [
      'x-mathfield()',
      'x-mathfield(placeholder="Enter your formula")'
    ],
    attributes: [
      { name: 'placeholder', description: 'Text to show in empty field' }
    ]
  },
  {
    name: 'x-picker',
    description: 'Multiple choice component',
    examples: [
      'x-picker(size=4)',
      'x-picker(choices="Red, Green, Blue" multiple)'
    ],
    attributes: [
      { name: 'size', description: 'Number of visible items' },
      { name: 'choices', description: 'Comma-separated list of choices' },
      { name: 'multiple', description: 'Allow multiple selection' }
    ]
  }
];

// Markdown template for component documentation
const generateComponentMarkdown = (component) => {
  let markdown = `## ${component.name}\n\n`;
  markdown += `${component.description}\n\n`;
  
  // Examples
  markdown += `### Examples\n\n`;
  component.examples.forEach(example => {
    markdown += `\`\`\`\n${example}\n\`\`\`\n\n`;
  });
  
  // Attributes
  markdown += `### Attributes\n\n`;
  markdown += `| Attribute | Description |\n`;
  markdown += `|-----------|-------------|\n`;
  component.attributes.forEach(attr => {
    markdown += `| \`${attr.name}\` | ${attr.description} |\n`;
  });
  
  markdown += `\n\n`;
  return markdown;
};

// Full documentation template
const generateFullDocumentation = () => {
  let markdown = `# KhaBoom Interactive Components\n\n`;
  markdown += `This document lists all the interactive components available in KhaBoom courses.\n\n`;
  markdown += `## Table of Contents\n\n`;
  
  // Generate ToC
  COMPONENT_DOCS.forEach(component => {
    markdown += `- [${component.name}](#${component.name.replace('x-', '')})\n`;
  });
  
  markdown += `\n\n`;
  
  // Generate component docs
  COMPONENT_DOCS.forEach(component => {
    markdown += generateComponentMarkdown(component);
  });
  
  markdown += `## Using Components in Steps\n\n`;
  markdown += `Each step in a course can contain multiple interactive components. To set up these components in your step code, follow this pattern:\n\n`;
  markdown += "```markdown\n";
  markdown += "> id: step-id\n";
  markdown += "> title: Step Title\n\n";
  markdown += "This step contains a slider:\n\n";
  markdown += "x-slider(steps=10 min=0 max=100)\n\n";
  markdown += "And a blank for answers:\n\n";
  markdown += "Fill in the blank: [[answer]]\n";
  markdown += "```\n\n";
  
  markdown += `## Step Functions\n\n`;
  markdown += `To add interactivity to steps, you can create JavaScript functions in a \`functions.ts\` file in your course directory. These functions should match your step IDs:\n\n`;
  markdown += "```typescript\n";
  markdown += "export function stepId(section) {\n";
  markdown += "  // section.$('selector') accesses elements in this step\n";
  markdown += "  const slider = section.$('x-slider');\n";
  markdown += "  \n";
  markdown += "  // React to user interaction\n";
  markdown += "  slider.on('change', (value) => {\n";
  markdown += "    // Do something with the value\n";
  markdown += "  });\n";
  markdown += "}\n";
  markdown += "```\n";
  
  return markdown;
};

// Main function
const generateDocs = () => {
  const docsDir = path.join(__dirname, '..', '..', '..', 'docs');
  
  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Generate component documentation
  const componentDocsPath = path.join(docsDir, 'interactive-components.md');
  fs.writeFileSync(componentDocsPath, generateFullDocumentation());
  
  console.log(`Component documentation generated at ${componentDocsPath}`);
};

// Run if called directly
if (require.main === module) {
  generateDocs();
} else {
  // Export for use in other scripts
  module.exports = {
    generateDocs,
    generateComponentMarkdown,
    COMPONENT_DOCS
  };
}
