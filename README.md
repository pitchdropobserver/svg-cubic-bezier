# svg-cubic-bezier

Draw a cubic bezier curve in svg given 4 control points.

## Examples

[helvetica](https://pitchdropobserver.github.io/svg-cubic-bezier/helvetica.html).

## Installation

```bash
npm i svg-cubic-bezier
```

## Required Props

Props you must specify:

* `parentDom` - SVG element onto on which the curve is drawn
* `ctrlPts` - array of 4 x-y objects mapping the conrol points of the curve

## Optional Props

Props can optionally specify:

* `onCtrlPtMouseDown(ctrlPtIndex)` - handler for 'mousedown' event on control points
* `shouldShowCtrlPts` - renders the 4 control points
* `styleCurve` - styling for the bezier curve
* `styleAnchorPts` - styling for curve's 2 anchor points
* `styleCtrlPts` - styling for curve's 2 control points
* `styleHandles` - styling for curve's 2 handle arms

## Methods

Methods you can call:

* `updateProps({...})` - update any existing props and re-render
