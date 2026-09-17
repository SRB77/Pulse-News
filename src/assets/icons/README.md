# Assets Folder

This folder contains SVG icons and other assets for the Pulse app.

## Icons

### Current Implementation

The SVG icons are now directly used in the SegmentedControl component without an intermediate AssetIcon component. The SVG paths are embedded directly in the component for better performance and simpler maintenance.

### Current Icons

- `male.svg` - Mars symbol (♂) - Used in gender selector
- `female.svg` - Venus symbol (♀) - Used in gender selector  
- `other.svg` - Neutral gender symbol - Used in gender selector
- `phone.svg` - Phone icon - Used in phone input field

### How It Works

The SegmentedControl component directly imports the SVG paths from these files and renders them using react-native-svg. The icons automatically change color based on selection state:

- **Selected**: White color (`theme.Colors.textWhite`)
- **Unselected**: Secondary text color (`theme.Colors.textSecondary`)

### Adding New Icons

To add new icons to the gender selector:

1. **Add SVG file**: Place your SVG file in `src/assets/icons/`
2. **Extract SVG path**: Copy the `<path>` element from your SVG file
3. **Update SegmentedControl**: Add the icon to the `iconPaths` object in `src/components/SegmentedControl.tsx`
4. **Update interface**: Add the icon name to the `Option` interface

### SVG Requirements

- Use `fill` attribute for solid icons (not stroke-based)
- Keep viewBox consistent with the original SVG
- Ensure the icon looks good at 24x24 size
- Test both selected and unselected states

## File Structure

```
src/assets/
├── icons/
│   ├── male.svg
│   ├── female.svg
│   ├── other.svg
│   ├── phone.svg
│   └── README.md (this file)
└── ...
```
