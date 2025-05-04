---
layout: page
nav_order: 4
parent: Core.js
---

# Events

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L15">events.ts#L15</a></div>

## <span class="pill">Class</span> EventTarget

Base class for event management.

<div class="docs-item" markdown="1">

### constructor <span class="signature">(): EventTarget</span>

</div>

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L16">events.ts#L16</a></div>

### <span class="pill">Property</span> .events <span class="signature">: Map&lt;string, Array&lt;EventCallback&gt;&gt;</span>

Default value: `...`

</div>

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L36">events.ts#L36</a></div>

### <span class="pill">Method</span> .off <span class="signature">(events: string, fn: EventCallback): void</span>

Removes an event listener from one or more events.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `events` | string |  |  |
| `fn` | EventCallback |  |  |


</div>

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L19">events.ts#L19</a></div>

### <span class="pill">Method</span> .on <span class="signature">(events: string, fn: EventCallback): void</span>

Adds an event listener for one or more events.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `events` | string |  |  |
| `fn` | EventCallback |  |  |


</div>

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L27">events.ts#L27</a></div>

### <span class="pill">Method</span> .one <span class="signature">(events: string, fn: EventCallback): void</span>

Adds a one-time event listener to one or more events.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `events` | string |  |  |
| `fn` | EventCallback |  |  |


</div>

<div class="docs-item" markdown="1">

<div><a class="source" target="_blank" href="https://github.com/mathigon/core.js/tree/master/src/events.ts#L45">events.ts#L45</a></div>

### <span class="pill">Method</span> .trigger <span class="signature">(events: string, arg: unknown): void</span>

Triggers one or more events, and executes all bound event listeners.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `events` | string |  |  |
| `arg` | unknown |  |  |


</div>

</div>