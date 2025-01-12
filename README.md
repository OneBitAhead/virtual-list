# virtual-list
Dependency-less Web Component for Virtualized List

&nbsp;
## About
The virtual list renders an array of items with a custom template and takes care of rendering chunks for performance.

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
## Templating
Templates can be defined in several ways:
You can either define and reference a `template` tag. The markup will be rolled out for every record in the items array. Insert properties of items using `{{name}}` syntax, e.g. `{{id}}` refers to the id property of an object in the items array. 
Or you can pass a method that takes an object as argument and returns a markup string to the `setTemplate` method.
Either way, ensure that the content of the resulting markup does not exceed the size of the `itemheight` property. To do so, you can utilize the CSS custom property `--itemheight` defined on the element or the `itemheight` attribute of the element. 

&nbsp;
## Examples
Examples can be found in the `examples` folder.

&nbsp;
### PAss a template function
[View working example](https://onebitahead.github.io/virtual-list/examples/template-function.html)
```html
...
<script src="virtual-list.js"></script>
<virtual-list itemheight="30" style="border: 1px solid red; width: 80%; height: 80vh"></virtual-list>
<script>
  const virtualList = document.body.querySelector('virtual-list');

  // Pass a template function first
  virtualList.setTemplate( function(item){ 
    return `<section class="row-template"><div>${item.id}</div><b>Records</b></section>` 
  } );

  // Set items
  virtualList.items = someSortOfItems;
</script>
...
```