# Data Lineage Viewer

An interactive web-based tool for visualizing and exploring data lineage relationships between tables, with support for column-level dependency tracking and bidirectional navigation.

![Data Lineage Viewer](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![React Flow](https://img.shields.io/badge/React_Flow-11-green)

## 🚀 Features

### ✅ Implemented
- **Bidirectional Lineage Exploration** - Navigate both upstream (sources) and downstream (consumers) dependencies with dedicated expand buttons
- **Column-Level Tracking** - Visualize transformations and dependencies at the column level with column-to-column edge connections
- **Dynamic Layout Engine** - Automatic positioning with parent-child alignment, order-based sorting, and collision prevention
- **Flexible Layouts** - Switch between horizontal (left-right) and vertical (top-bottom) views
- **Interactive Expansion** - On-demand lazy loading of lineage branches - only load what you need
- **Smart Collapse** - Branch-specific collapsing preserves unrelated lineage paths
- **Rich Metadata Display** - Show table schemas, row counts, owners, stakeholders, and tags
- **Expand/Collapse All** - Quick navigation to see complete lineage or collapse to root
- **Animated Edges** - Visual distinction between table-level and column-level connections
- **Interactive Minimap** - Navigate large lineage graphs with color-coded nodes

### 🎯 Use Cases
- Data warehouse lineage documentation
- Impact analysis for table changes
- ETL pipeline visualization
- Data governance and compliance
- Understanding data transformations
- Dependency tracking for migrations

## 📦 Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite 5** - Build Tool
- **React Flow 11** - Graph Visualization Library (Free Version)
- Custom layout engine with order-based positioning

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/vinodhramu/data-lineage-viewer.git
cd data-lineage-viewer

# Install dependencies
npm install --legacy-peer-deps
```

## 🏃 Running the Project

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## 📁 Project Structure

```
ReactFlow_Clone/
├── src/
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application styles
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── FEATURES.md          # Detailed feature documentation
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🎨 Custom Pro Features Implementation

All pro features are implemented as:
- **Wrapper Components**: Around base React Flow nodes/edges
- **Custom Hooks**: For feature-specific logic
- **Utility Functions**: Reusable helpers
- **No Core Modifications**: We don't modify React Flow library itself

See `FEATURES.md` for detailed implementation plans and approaches.

## 📝 Development Guidelines

1. **Modularity**: Each feature is self-contained and optional
2. **Performance**: Consider large graph performance
3. **TypeScript**: Full type safety
4. **Accessibility**: Keyboard navigation support
5. **Documentation**: Document all custom code

## 🐛 Known Issues

- Node.js version warning (v21.1.0 works but v20.19+ or v22.12+ recommended)
- Some peer dependency warnings (resolved with --legacy-peer-deps)

## 📄 License

MIT

## 🤝 Contributing

This is a prototype/learning project. Feel free to use and extend!

---

**Note**: This project uses the free version of React Flow and implements pro features from scratch. It's designed as a learning resource and prototype, not a production replacement for React Flow Pro.


---

**Note**: This project uses the free version of React Flow and implements pro features from scratch. It's designed as a learning resource and prototype, not a production replacement for React Flow Pro.


```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
