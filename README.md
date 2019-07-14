```JSX
<ReactColorWheel
  radius={100}
  // this will be called whenever a color is being previewed
  onPreview={ ({hsl: 'hsl(...)'}) => {} }
  // this will be called once the user has indicated they want a color
  onSelect={ ({hsl: 'hsl(...)'}) => {} }
/>
```