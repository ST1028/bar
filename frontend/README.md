# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

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

export default tseslint.config([
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


## PWA Layout Consistency Testing

This project implements unified header and bottom navigation heights across browser and PWA (installed/standalone) modes.

### Design Tokens

Layout heights are managed through CSS variables in `src/styles/design-tokens.css`:

```css
:root {
  --header-height: 44px;    /* TopBar height - matches iOS App style */
  --bottom-height: 64px;    /* BottomNavigation height - unified across modes */
}
```

### Testing Procedure

#### 1. Browser Mode Testing
1. Open the app in mobile browser (iOS Safari / Android Chrome)
2. Open DevTools and inspect header/bottom elements
3. Verify computed heights:
   - Header: `44px`
   - Bottom Navigation: `64px`
4. Test on different screen sizes and orientations

#### 2. PWA Mode Testing
1. Install PWA to home screen:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen
2. Launch from home screen (standalone mode)
3. Verify same computed heights:
   - Header: `44px` (same as browser)
   - Bottom Navigation: `64px` (same as browser)
4. Test landscape/portrait orientations
5. Verify safe area handling on notched devices

#### 3. Viewport Testing
- **iOS Safari**: Address bar hide/show should not affect layout
- **Android Chrome**: Bottom toolbar behavior should be consistent
- **Notched devices**: Content should not be cut off (safe-area-inset handling)

#### 4. Cross-Platform Verification
- [ ] iOS Safari (browser)
- [ ] iOS PWA (standalone)
- [ ] Android Chrome (browser)
- [ ] Android PWA (standalone)
- [ ] Desktop PWA (optional)

### Height Adjustment

To modify layout heights, update CSS variables in `src/styles/design-tokens.css`:

```css
:root {
  --header-height: 48px;    /* New header height */
  --bottom-height: 72px;    /* New bottom height */
}
```

All components will automatically reflect the new heights. No JavaScript changes required.

### Development Debug

Open browser console to view viewport debug information:
```
🔍 Viewport Debug Info
PWA Mode: true/false
Screen: 390x844
Window: 390x844
Visual Viewport: 390x844
Safe Area: {top: "44px", right: "0px", bottom: "34px", left: "0px"}
Layout Heights: {header: 44, bottom: 64}
```

### Implementation Notes

- Uses `100dvh` for proper viewport handling (with iOS fallback)
- Safe Area Insets automatically applied in PWA mode
- CSS Grid layout ensures consistent content area calculation
- Framer Motion animations preserved across mode changes

