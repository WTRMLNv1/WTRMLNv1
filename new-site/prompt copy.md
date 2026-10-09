I have attached screenshots of 2 parts of my 4-part portfolio site.
Apart from that I have also attached a list of variables that will be used.

I want you to turn this into a functioning website.

You don't have access to any assets. You will output an HTML file referencing assets on my computer whether or not you have them. They will be kept in the relative path `/assets/<file_name>`.

## Details:

### Assets
You have the following assets. The names are self explainatory.

```
arrow-up-right-light.svg
atom-light.svg
bar-chart-light.svg
bg-day.png
bg-night.png
calculator-minimalistic-light.svg
game-controller-light.svg
github-light.svg
wtrmln-logo.png
```

### Fonts

> Fonts will be kept in `assets/dm-display.ttf`, `assets/dm-serif.ttf`, `assets/dm-sans.ttf`

- Hero Title: `DM Serif Display`
- Headings: `DM Serif`
- Body: `DM Sans`

### Icons

All icons you will need are in the assets folder
> **Do NOT draw any icons by yourself**

### Layout

The site uses *exponential spacing* by grouping (2px, 4px, 16px, 32px, 64px) for the major groups, with a few different spaces inside components like buttons.

The background is a fixed image `bg-day.png`. On scrolling the site, do **NOT** move the image, instead, scroll the content frames OVER the image.

The hero text, logo, and buttons are also static. On scroll, fade them out as the frame comes upwards rather than scrolling the hero contents

The frames' background uses light-bg color with 8px background blur effect and 20px border-radius.

### Buttons

The site will use coherent buttons.
Specs:
- Icon (if present) will be 48px. Use icon color same as text color
- Text color will be text/light or text/dark with size 36px
- Border radius is 16px and horizontal padding is 16px, vertical padding is 8px. Gap between text and icon is 12px.

There are 2 types of buttons
1. Heavy: Background fill with light-bg, fg is text/dark. No border
2. Light: No background fill. Border and text color is text/dark (1px fill border)

Hover and click effects on buttons
1. Heavy: Draw a border with offset equal to length of border, then animate the offset being brought to 0
2. Light: Fill 10% opacity

For clicking, both will have horizontal padding brought down to 12 **WITHOUT** changing any layout