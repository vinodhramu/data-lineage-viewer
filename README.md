# React Flow Clone - Pro Features Prototype

A React Flow clone that uses the free version of React Flow and implements pro features using custom code.

## 🚀 Features

### ✅ Implemented (Base)
- **React Flow Integration**: Using the free version (v11.11.0)
- **Custom Dark Theme**: Modern dark UI with custom styling
- **Interactive Canvas**: Zoom, pan, drag nodes
- **Node Connections**: Connect nodes with animated edges
- **Controls**: Zoom controls, fit view, minimap
- **Background**: Customizable dot/grid patterns

### 🎯 Phase 1 (In Development)
- **Node Resizing**: Interactive resize handles on nodes
- **Custom Minimap**: Enhanced minimap with custom node styling
- **Node Grouping**: Visual grouping and container support

### 📋 Planned Features (Phase 2 & 3)
- Sub-flows / Nested Flows
- Advanced Edge Routing (pathfinding, collision avoidance)
- Node Alignment & Distribution Tools
- Advanced Selection Tools (lasso, box select)
- Export/Import Enhancements (PNG, SVG)
- Performance Optimizations for large graphs
- Enhanced Controls Panel

## 📦 Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite 5** - Build Tool (compatible with Node.js 21.1.0)
- **React Flow 11** - Graph Visualization Library (Free Version)

## 🛠️ Installation

```bash
# Install dependencies (use legacy-peer-deps for compatibility)
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
