module.exports = {
  extends: ["../../.eslintrc.js"],
  rules: {
    "boundaries/no-private": "off",
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "JSXOpeningElement[name.name=/^[a-z]/]",
        message:
          "Lowercase intrinsic HTML elements (div, span, button, input, etc.) are forbidden in native React Native views. Use React Native components or design-system primitives.",
      },
      {
        selector:
          "JSXExpressionContainer > LogicalExpression[operator='&&']",
        message:
          "Logical && in JSX is forbidden to avoid rendering '0' or '' text strings outside <Text>. Use explicit ternaries (cond ? <X/> : null) instead.",
      },
      {
        selector:
          "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
        message:
          "Raw hex color values are forbidden. Use design tokens from '@app/design-tokens' or NativeWind token classes.",
      },
      {
        selector:
          "Literal[value=/^rgba?\\s*\\(.*\\)$/]",
        message:
          "Raw rgb/rgba color values are forbidden. Use design tokens from '@app/design-tokens' or NativeWind token classes.",
      },
      {
        selector:
          "Property[key.name=/^(margin|padding)(Top|Bottom|Left|Right|Horizontal|Vertical)?$|^gap$|^rowGap$|^columnGap$/] > Literal[raw=/^[0-9]+$/][value!=0][value!=4][value!=8][value!=12][value!=16][value!=24][value!=32][value!=44][value!=48]",
        message:
          "Raw numeric spacing outside token scale (0, 4, 8, 12, 16, 24, 32, 44, 48) is forbidden. Use design tokens.",
      },
      {
        selector:
          "JSXOpeningElement[name.name=/^(ScrollView|FlatList|SectionList|KeyboardAwareScrollView)$/] > JSXAttribute[name.name='className'] > Literal[value=/(?:^|\\s)(?:items-|justify-|flex-row|flex-col|flex-wrap|gap-)/]",
        message:
          "ScrollView/FlatList child layout classes (items-*, justify-*, flex-row, flex-col, flex-wrap, gap-*) must be applied through contentContainerClassName (or contentContainerStyle), not className.",
      },
      {
        selector:
          "JSXOpeningElement[name.name=/^(ScrollView|FlatList|SectionList|KeyboardAwareScrollView)$/] > JSXAttribute[name.name='className'] TemplateElement[value.raw=/(?:^|\\s)(?:items-|justify-|flex-row|flex-col|flex-wrap|gap-)/]",
        message:
          "ScrollView/FlatList child layout classes (items-*, justify-*, flex-row, flex-col, flex-wrap, gap-*) must be applied through contentContainerClassName (or contentContainerStyle), not className.",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*Dom.tsx"],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
    {
      files: ["app/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "react-native",
                importNames: ["Text", "Button", "TextInput"],
                message:
                  "Do not import Text, Button, or TextInput directly from 'react-native' in feature code. Use design system primitives from '@/components/primitives' or relative './components/primitives'.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["tests/**", "**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "no-restricted-syntax": "off",
        "no-restricted-imports": "off",
      },
    },
  ],
};
