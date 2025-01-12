# virtual-list
Dependency-less Web Component for Virtualized List

&nbsp;
## About
The virtual list renderes an array of items with a custom template and takes care of rendering chunks for performance.

&nbsp;
## How To use
Include the Javascript file for the custom element into your website and add a `virtual-list` tag. Configure it appropriately (see options below). No dependencies, the minified version is &lt; 4kb;

```html
...
<script src="virtual-list.js"></script>

<template id="rowTemplate">
    <div class="row-template">{{id}}</div>
</template>

<virtual-list template="#rowTemplate" itemheight="30" ></virtual-list>

<script>
  // Get a reference to the component
  const virtualList = document.body.querySelector('virtual-list');
  
  // Create 100 items and push them to the items property of the component
  var setItems = function(){
  let items = [];
  for(let i = 1; i<100; i++){
    items.push({id: i});
  }
  virtualList.items = items;
  }

  setItems();
</script>
...
```

&nbsp;
## Configuration

&nbsp;
### Properties

Property               | Type | Default Value | Is Observed Attribtue | Description
----------------------- | ----| ---------------- | --------------------- | -----------------------------------
template | string | '' | No | CSS selector to the template
items | any[] | [] | Yes | Array with raw data to render
itemheight | number | 20 | Yes | Number of pixels of row height

&nbsp;
## Template Syntax
Place the markup for rendering a row into a `template` tag. Insert properties of items using `{{name}}` syntax, e.g. `{{id}}` refers to the id property of an object in the items array. 