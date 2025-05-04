---
layout: page
nav_order: 1
parent: Polypad API Docs
description: Polypad Tiles
---

# Polypad Tile Types

## Algebra

### Algebra Tile

* `name: 'algebra'`
* `expr: string`
* `splitH: number`
* `splitV: number`

### Coordinate Axes

* `name: 'axes'`
* `xMin: number`
* `xMax: number`
* `yMin: number`
* `yMax: number`
* `xStep: string` – Pattern: `/^[-–]?[0-9,./]*[kmbtq]?[π%]?$/`.
* `yStep: string` – Pattern: `/^[-–]?[0-9,./]*[kmbtq]?[π%]?$/`.
* `arrows: 'both' | 'none' | 'positive'`

### Balance

* `name: 'balance'`
* `level: number`
* `size: number`

### Function Machine Tile

* `name: 'function-machine'`
* `expr: string` – Max length: 50.
* `height: number`
* `hideExpression: boolean`
* `invert: boolean`

### Logarithm Bar

* `name: 'log-bar'`
* `value: number`

### Slider Tile

* `name: 'slider'`
* `variable: string` – Pattern: `/^\w+$/`.
* `min: number`
* `max: number`
* `stepN: number`
* `playback: 'bounce' | 'loop' | 'once'`
* `duration: number`
* `value: number`

### Algebra Token

* `name: 'token'`
* `shape: string` – Can be 'circle', 'square', 'cross', 'weight', 'star' or 'heart'

## Applications

### Chess Board Tile

* `name: 'chess-board'`
* `highlight: 'danger' | 'moves' | 'off'`

### Chess Piece Tile

* `name: 'chess-piece'`
* `piece: 'b' | 'k' | 'n' | 'p' | 'q' | 'r'`
* `dark: boolean`

### Clock

* `name: 'clock'`
* `clock: 'free' | 'geared' | 'live'`
* `showSeconds: boolean`
* `ms: number`
* `h: number`
* `m: number`
* `s: number`

### Currency Tile

* `name: 'currency'`
* `value: number`
* `currency: 'CAD' | 'EUR' | 'GBP' | 'USD'`

### Logic Gate

* `name: 'logic-gate'`
* `gate: 'and' | 'buffer' | 'd' | 'jk' | 'nand' | 'nor' | 'not' | 'or' | 'sr' | 't' | 'xnor' | 'xor'`

### Logic Speaker

* `name: 'logic-speaker'`

### Logic Metronome

* `name: 'logic-metronome'`
* `bpm: number`
* `running: boolean`

### Button Tile

* `name: 'logic-button'`

### Toggle Switch Tile

* `name: 'logic-switch'`
* `state: boolean`

### Bulb Tile

* `name: 'logic-bulb'`

### Logic Display

* `name: 'logic-display'`

### Piano

* `name: 'piano'`
* `width: number`
* `startNote: number`

### Song

* `name: 'song'`
* `width: number`
* `height: number`
* `loops: number`
* `startNote: number`
* `playbackType: 'sequence' | 'timeline'`
* `colSize: number`
* `rowSize: number`
* `barLength: number`
* `showGrid: boolean`

## Fractions

### Fraction Bar

* `name: 'fraction-bar'`
* `denominator: number`
* `count: number`
* `active: number`
* `combine: boolean`
* `size: number`

### Fraction Circle

* `name: 'fraction-circle'`
* `denominator: number`
* `count: number`
* `active: number`
* `combine: boolean`
* `size: number`

## Geometry

### Aperiodic Hat Tile

* `name: 'aperiodic-hat'`
* `a: number` – The two side lengths in the construction Tile(a,b)
* `b: number`

### Arrow Tile

* `name: 'arrow'`
* `width: number`
* `minLength: number`
* `maxLength: number`
* `round: number`

### Circle Tile

* `name: 'circle'`
* `radius: number`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Custom Polygon Tile

* `name: 'custom-polygon'`
* `shape: string` – Max length: 10000.
* `scale: number`
* `vertexCountLocked: boolean`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Egg Tangram

* `name: 'egg'`
* `index: number` – An integer from 0 to 8.

### Fractal Tile

* `name: 'fractal'`
* `index: number` – An integer from 0 to 4.

### Garden Tile

* `name: 'garden'`
* `index: number` – An integer from 0 to 7.

### Kolam Tile

* `name: 'kolam'`
* `index: number` – An integer from 0 to 5.

### Penrose

* `name: 'penrose'`
* `index: number` – An integer from 0 to 1.

### Polyomino

* `name: 'polyomino'`
* `index: number` – An integer from 0 to 11 for pentominoes, and from 12 to 16 for tetroninoes.
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Polygon Tile

* `name: 'polygon'`
* `shape: string` – Either a named polygon like 'square', 'reg-hexagon' or 'kite', or a string of vertex coordinates like `0 0,1 0,1 1,0 1`. Max length: 10000.
* `scale: number`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Polyhedron Tile

* `name: 'polyhedron'`
* `net: string` – Max length: 10000.
* `hinge: number`
* `rotation: string` – Pattern: `/^([0-9.-]+,?){3}$/`.

### Rectangle Tile

* `name: 'rectangle'`
* `width: number`
* `height: number`
* `cornerRadius: number`
* `scale: number`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Regular Polygon Tile

* `name: 'reg-polygon'`
* `sides: number`
* `scale: number`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Tangram

* `name: 'tangram'`
* `index: number` – An integer from 0 to 6.

### Tantrix Tile

* `name: 'tantrix'`
* `index: number` – An integer from 0 to 13.

### Ruler

* `name: 'ruler'`
* `width: number`
* `isFixed: boolean`

### Protractor

* `name: 'protractor'`
* `width: number`

### Set Triangle

* `name: 'set-triangle'`
* `width: number`

### Compass

* `name: 'compass'`
* `width: number`

## Numbers

### Abacus

* `name: 'abacus'`
* `positions: string` – Pattern: `/^[0-9.,-]+$/`. Max length: 50.

### Zero Bucket

* `name: 'bucket'`

### Decimal Grid

* `name: 'decimal-grid'`
* `width: number`
* `height: number`
* `base: number`

### Dot Machine

* `name: 'dot-machine'`
* `base: number`
* `boxes: number`

### Dot Tile

* `name: 'dot'`
* `value: number`

### Number Bar

* `name: 'number-bar'`
* `value: number`
* `denominator: number`

### Number Card

* `name: 'number-card'`
* `value: number`
* `valueStr: string` – Max length: 25.

### Number Cube

* `name: 'number-cube'`
* `vx: number`
* `vy: number`
* `vz: number`

### Number Dot

* `name: 'number-dot'`
* `factors: string` – Pattern: `/^[0-9-]+$/`.

### Number Frame Tile

* `name: 'number-frame'`
* `value: number`

### Number Grid Tile

* `name: 'number-grid'`
* `kind: 'addition' | 'multiplication' | 'number'`
* `cols: number`
* `rows: number`
* `colors: string` – Max length: 5000.
* `hStart: number`
* `vStart: number`

### Jump Tile

* `name: 'multi-jump'`
* `jumpSize: number`
* `jumps: number`
* `single: boolean`

### Number Line

* `name: 'number-line'`
* `start: string` – Pattern: `/^[-–]?[0-9,./]*[kmbtq]?[π%]?$/`.
* `step: string` – Pattern: `/^[-–]?[0-9,./]*[kmbtq]?[π%]?$/`.
* `width: number`
* `size: number`
* `minor: number`
* `arrows: 'both' | 'none' | 'positive'`
* `simplify: 'all' | 'integers' | 'none'`
* `prefix: string` – Max length: 10.
* `suffix: string` – Max length: 10.

### Number Tile

* `name: 'number-tile'`
* `width: number`
* `value: number`

### Prime Disk

* `name: 'prime-disk'`
* `value: number`

### Snap Cube Tile

* `name: 'snap-cube'`
* `value: number`
* `colors: string` – Max length: 1000.

### Ten Frame Tile

* `name: 'ten-frame'`
* `cols: number`
* `rows: number`
* `rowMajor: number`
* `colMajor: number`

### Ten Frame Counter

* `name: 'ten-frame-counter'`
* `value: number`

## Others

### Action Card

* `name: 'action-card'`
* `actionId: string` – Max length: 50.
* `duration: number`
* `userLabel: string` – Max length: 50.
* `width: number`
* `singleUse: boolean`
* `alternateZoom: boolean`
* `useIcon: boolean`
* `textLabel: string` – Max length: 25.
* `textLabelFontSize: number`
* `textLabelRotate: boolean`

### Categorizer Tile

* `name: 'categorizer'`
* `width: number`
* `height: number`
* `layout: 'center' | 'flow' | 'none'`
* `allowed: string` – Max length: 100.
* `max: number`
* `padding: number`
* `tolerance: number`
* `validation: 'compare' | 'cover' | 'match' | 'none'`
* `showMark: boolean`
* `storedSolution: string` – Max length: 10000.
* `correct: boolean`
* `compareType: string` – Max length: 100.
* `compareOperator: '<' | '<=' | '=' | '>' | '>='`
* `compareValue: number`
* `useTranslations: boolean`
* `autoCheck: boolean`

### Equation Tile

* `name: 'equation'`
* `expr: string` – An ASCII-Math expressions. Max length: 1000.
* `evaluate: boolean`
* `fontSize: number`

### Geo Tile

* `name: 'geo'`
* `key: string` – All dynamic geometry objects have a unique key prefixed with '_x'. Pattern: `/^_x[0-9]+$/`.
* `expr: string` – A geometric expression like `point(10,20)` or `segment(_x1,_x2).` Max length: 100.
* `label: string` – Max length: 100.
* `arrows: 'both' | 'end' | 'start'`
* `marks: 'arrow' | 'arrow2' | 'bar' | 'bar2'`

### Group

* `name: 'group'`
* `children: string` – Max length: 1000.

### Image Tile

* `name: 'image'`
* `href: string` – The URL of the image, which should be returned by the `imageUpload()` config function. Max length: 100.
* `width: number`
* `mask: string` – Max length: 5000.

### Blank Question Tile

* `name: 'question-blank'`
* `solution: string` – Max length: 50.
* `submitted: string` – Max length: 50.
* `attempts: number`
* `width: number`

### Text Tile

* `name: 'text'`
* `html: string` – The rich text HTML of the string. :warning: Remember to do XSS sanitisation before saving this in a DB. Max length: 10000.
* `fontSize: number`
* `width: number`

### Viewport Tile

* `name: 'initial-viewport'`
* `width: number`
* `height: number`

## Probability

### Playing Card

* `name: 'card'`
* `cards: string` – Pattern: `/^\w\wf?(:\w\wf?)*$/`. Max length: 1000.

### Coin

* `name: 'coin'`
* `value: 0 | 1`

### Dice

* `name: 'dice'`
* `value: number`
* `faces: string` – Pattern: `/^[0-9,]+$/`.
* `playback: 'beats' | 'duration' | 'pitch' | 'subdivisions'`

### Domino Tile

* `name: 'domino'`
* `a: number`
* `b: number`

### Polyhedral Dice

* `name: 'polyhedral-dice'`
* `value: number`
* `faceCount: number`
* `playback: 'beats' | 'duration' | 'pitch' | 'subdivisions'`

### Random Number

* `name: 'random'`
* `value: number`
* `dist: 'bernoulli' | 'binomial' | 'cauchy' | 'continuous' | 'discrete' | 'exponential' | 'geometric' | 'normal' | 'poisson'`
* `p1: number`
* `p2: number`

### Regular Spinner

* `name: 'spinner'`
* `sectorCount: number`
* `angle: number`
* `colors: string` – Max length: 200.
* `playback: 'beats' | 'duration' | 'pitch' | 'subdivisions'`

### Custom Spinner

* `name: 'custom-spinner'`
* `sectorSizes: string` – Pattern: `/^[0-9,]+$/`. Max length: 100.
* `angle: number`
* `colors: string` – Max length: 200.
* `playback: 'beats' | 'duration' | 'pitch' | 'subdivisions'`

## Statistics

### Box Whisker Tile

* `name: 'box-whisker'`
* `kind: 'area' | 'box-whisker' | 'column' | 'donut' | 'line' | 'pie' | 'row'`
* `layout: 'grouped' | 'outliers' | 'percentage' | 'stacked'`
* `width: number`
* `height: number`
* `colors: string` – Max length: 200.

### Chart Tile

* `name: 'chart'`
* `kind: 'area' | 'box-whisker' | 'column' | 'donut' | 'line' | 'pie' | 'row'`
* `layout: 'grouped' | 'outliers' | 'percentage' | 'stacked'`
* `width: number`
* `height: number`
* `colors: string` – Max length: 200.

### Pie Chart Tile

* `name: 'pie-chart'`
* `kind: 'area' | 'box-whisker' | 'column' | 'donut' | 'line' | 'pie' | 'row'`
* `width: number`
* `colors: string` – Max length: 200.

### Table Tile

* `name: 'table'`
* `data: string` – Max length: 10000.
* `aggregation: 'cumulative' | 'function' | 'replace' | 'timeseries'`
