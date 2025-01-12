class VirtualList extends HTMLElement {

  private template: any;
  private visibleItems: number = 0;
  //@ts-ignore
  private container: HTMLElement;

  private lastRepaintY: number = 0;

  private _items: any[] = [];
  private _itemheight: number = 0;

  private _onScroll: any;

  get items() {
    return this._items
  }

  get itemheight() {
    return this._itemheight || 20
  }

  set items(value) {

    // console.log('setter for items');

    if (value == null) return
    if (!Array.isArray(value)) value = [].concat(value);

    this._items = value;
    this.onPropsChange();
    this.render();
  }

  set itemheight(value: number | string) {
    if (value == null) return

    let ih = (typeof value === 'number') ? Math.floor(value) : parseInt(value, 10);
    if (isNaN(ih)) {
      throw new TypeError('Value has to be numeric')
    }

    this._itemheight = ih;

    this.setAttribute('itemheight', ih.toString());

    this.onPropsChange();
    this.render();

  }

  // constructor() {
  //   super();

  //   this.getTemplate();
  // }

  connectedCallback() {

    // Init internal properties
    this._items = [];
    this.lastRepaintY = 0;
    this.visibleItems = 0;


    // Create DOM skeleton
    const container = this.createContainer();

    // console.log('createScroller', this._itemheight, this._items.length)

    const scroller = this.createScroller(this._itemheight * this._items.length);
    container.appendChild(scroller);
    this.container = container;


    // console.log('connectedCallback', this.container)

    this.template = this.getTemplate();

    // Clear innerHTML & render container
    this.innerHTML = '';
    this.style.display = 'inline-block';
    this.appendChild(container)

    // Calculate number of visible items
    // @TODO: ResizeObserver
    this.visibleItems = Math.ceil(this.clientHeight / this._itemheight);

    // Add scroll handler
    this._onScroll = this.#debounce(this.onScrollHandler.bind(this), 50);
    this.container.addEventListener('scroll', this._onScroll);

  }

  disconnectCallback() {
    this.container.removeEventListener('scroll', this._onScroll);
  }

  static get observedAttributes() {
    return ['itemheight'];
  }

  attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {

    // Workaround non-working observedAttributes
    if (['itemheight'].indexOf(attrName) === -1) return;

    if (oldValue === newValue) return;
    // @ts-ignore
    this[attrName] = newValue;

  }

  createContainer(): HTMLElement {
    const element = document.createElement('div');
    Object.assign(element.style, {
      overflow: 'auto',
      position: 'relative',
      padding: 0,
      height: '100%',
      width: '100%'
    })
    return element;
  }

  createScroller(height: number): HTMLElement {
    const element = document.createElement('div');
    element.dataset.id = 'scroller';
    Object.assign(element.style, {
      opacity: 0,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: '1px',
      height: Math.floor(height) + 'px'
    })
    return element;
  }


  onPropsChange() {

    const height = ((this._items || []).length || 0) * (this._itemheight || 0);

    if (!this.container) return;
    const scroller = this.container.querySelector('[data-id="scroller"]');
    // @ts-ignore
    if (scroller) scroller.style.height = height + 'px';
    this.visibleItems = Math.ceil(this.clientHeight / this._itemheight);

  }

  // https://davidwalsh.name/javascript-debounce-function
  #debounce(func:Function, wait:number, immediate=false) {
    var timeout: number|null;
    return function() {
      var context = globalThis, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      if(timeout)clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  onScrollHandler(event: Event) {

    window.requestAnimationFrame(() => {

      if (!event.target) return;

      var scrollTop = (<HTMLElement>(event.target)).scrollTop;

      if (!this.lastRepaintY || Math.abs(scrollTop - this.lastRepaintY) > (Math.ceil(this.clientHeight * 0.8))) {

        this.renderChunk(scrollTop);
        this.lastRepaintY = scrollTop;

      }

      event.preventDefault && event.preventDefault();

    });

  }


  getTemplate(returnNode:boolean = false) {

    var tmpl: HTMLElement|null;
    if(this.hasAttribute('template')){
      tmpl = document.querySelector(this.getAttribute('template')||'');
    } else {
      // Read markup from <template/> tag of innerHTML
      tmpl = this.querySelector('template');
    }

    if(returnNode === true) return tmpl;

    
    if (tmpl) {
      //@ts-ignore
      return this.templateFactory(tmpl.cloneNode(true).innerHTML.trim());
    } else {
      throw new Error('No template defined');
    }

  }

  private templateFactory(str: string) {
    var fn = new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +
      // "var _=function(r){ return (typeof r !== 'string')?r:" +
      // "r.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;')};" +
      //"var _=function(r){ var div = document.createElement('div');div.appendChild(document.createTextNode(r));return div.innerHTML;};" +

      // Introduce the data as local variables using with(){}
      "with(obj){p.push('" +

      // Convert the template into pure JavaScript
      str
        .replace(/[\r\t\n]/g, " ")

        .split("{{").join("\t")
        .replace(/((^|}})[^\t]*)'/g, "$1\r")
        .replace(/\t(.*?)}}/g, "',$1,'")

        .split("\t").join("');")
        .split("}}").join("p.push('")
        .split("\r").join("\\'")
      + "');}return p.join('');");

    return fn;
  }

  render() {

    // console.log('render')

    if (this.container) {
      this.renderChunk(this.container.scrollTop || 0);
    } else {
      // console.log('no container')
    }
  }

  renderChunk(scrollTop: number) {

    // Calculate first visible item from scrollTop
    let firstVisibleItem = Math.max(Math.ceil(scrollTop / this._itemheight), 0);
    let firstRenderedItem = Math.max(firstVisibleItem - this.visibleItems, 0);

    // console.log('renderChunk', {scrollTop, firstVisibleItem, firstRenderedItem});

    if (this.template && this.container) {

      const chunkData = { items: this._items.slice(firstRenderedItem, firstRenderedItem + (this.visibleItems * 3)) };

      // Create temporary DOM structure
      var div = document.createElement('div');
      var chunkMarkup = '';

      // console.log('chunkData', chunkData);

      if (!this.template) {
        this.template = this.getTemplate();
      }

      chunkData.items.forEach((item) => {

        let markup = this.template(item);

        // console.log('item markup', markup);
        if (markup) chunkMarkup = chunkMarkup + markup;

      });
      div.innerHTML = chunkMarkup;

      if (div.children) {

        let i = firstRenderedItem;
        for (let c in div.children) {

          if (!(div.children[c] instanceof HTMLElement)) continue;

          // @ts-ignore
          Object.assign(div.children[c].style, {
            height: this._itemheight + 'px',
            position: 'absolute',
            top: (i * this._itemheight) + 'px',
            left: '0px',
            right: '0px'
          });

          i++;
        }

      } else {

      }

      // Move scroller to new structure
      let scroller = this.container.querySelector('[data-id="scroller"]');
      div.appendChild(<Node>scroller);
      this.container.innerHTML = div.innerHTML;

    } else {
      // console.log('bah', this.template, this.container);
    }

  }

}

window.customElements.define('virtual-list', VirtualList);

