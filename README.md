# CodeTwin

CodeTwin is a [LSP](https://microsoft.github.io/language-server-protocol/)-based call graph generator. It leverages the Language Server Protocol to generate interactive call graphs, helps you visually explore source code.

## Features

* Workable for various programming languages
* Highlight on click
* Two kinds of graphs

   You can generate a call graph for selected files to get an overview, or a selected function to track the call hierarchy.
* Export call graphs as SVG

## Preview

![preview](https://raw.githubusercontent.com/ramvinoth/assets/main/codetwin/preview.gif)

## Install

Since CodeTwin utilizes the capabilities of language servers, it is better suited as an IDE/editor extension than a standalone command line tool.

It is currently available on [VS Code](https://marketplace.visualstudio.com/items?itemName=ramvinoth.codetwin), and PRs for other editors are welcome.

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Graphviz (for graph visualization)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ramvinoth/codetwin.git
   cd codetwin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Building

To build the project:

```bash
npm run build
```

This will:
- Compile TypeScript files to JavaScript
- Generate type definitions
- Create the distribution package

### Development Mode

To run in development mode with auto-recompilation:

```bash
npm run watch
```

### Project Structure

```
src/
├── graph/          # Graph generation and visualization
│   ├── dot.ts      # DOT format generation
│   └── models.ts   # Graph data structures
├── lang/           # Language-specific implementations
│   ├── base.ts     # Base language support
│   ├── go.ts       # Go language support
│   └── rust.ts     # Rust language support
└── types/          # TypeScript type definitions
    ├── css-classes.ts
    ├── graph.ts
    ├── language.ts
    └── lsp-types.ts

```

### Testing

Run the test suite:

```bash
npm test
```

### VS Code Extension

The VS Code extension is located in the `editors/code` directory. To work on the extension:

1. Open the `editors/code` directory in VS Code
2. Run `npm install` in the extension directory
3. Press F5 to launch the extension in debug mode

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Credits

CodeTwin is inspired by [graphql-voyager](https://github.com/graphql-kit/graphql-voyager) and [go-callvis](https://github.com/ondrajz/go-callvis).

## License

[Same as original license]
