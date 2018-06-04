"use strict";
(function (w, d) {
    'use strict';
    var VirtualList = document.registerElement('virtual-list', {
        prototype: Object.create(HTMLElement.prototype, {
            items: {
                get: function () {
                    return this._items;
                },
                set: function (value) {
                    value = [].concat(value);
                    this._items = value;
                    this.onPropsChange();
                    this.render();
                }
            },
            columns: {
                get: function () {
                    return this._columns || 1;
                },
                set: function (value) {
                    if (value == null)
                        return;
                    var c = parseInt(value.toString(), 10);
                    if (isNaN(c)) {
                        throw new TypeError('Value for columns has to be numeric');
                    }
                    this._columns = c;
                    this.setAttribute('columns', c.toString());
                    this.onPropsChange();
                    this.render();
                }
            },
            itemheight: {
                get: function () {
                    return this._itemheight || 20;
                },
                set: function (value) {
                    if (value == null)
                        return;
                    var ih = parseInt(value.toString(), 10);
                    if (isNaN(ih)) {
                        throw new TypeError('Value for item height has to be numeric');
                    }
                    this._itemheight = ih;
                    this.setAttribute('itemheight', ih.toString());
                    this.onPropsChange();
                    this.render();
                }
            },
            attachedCallback: {
                value: function () {
                    var toInit = this.observedAttribtutes, _this = this;
                    toInit.forEach(function (attribute) {
                        var fromDOM = _this.getAttribute(attribute);
                        if (fromDOM)
                            _this[attribute] = fromDOM;
                    });
                    this._items = [];
                    if (this._columns == null)
                        this._columns = 1;
                    this.ticking = false;
                    this.lastRepaintY = null;
                    this.visibleItems = 0;
                    var container = this.createContainer();
                    var scroller = this.createScroller((this._itemheight || 20) * Math.ceil((this._items || []).length / this._columns));
                    container.appendChild(scroller);
                    this.container = container;
                    this.getTemplate();
                    this.innerHTML = '';
                    this.style.display = 'inline-block';
                    this.appendChild(container);
                    this.visibleItems = Math.ceil(this.clientHeight / this._itemheight) * this._columns;
                    this._onScroll = this.scrollHandler.bind(this);
                    this.container.addEventListener('scroll', this._onScroll);
                    this.onPropsChange();
                    this.render();
                }
            },
            detachedCallback: {
                value: function () {
                    this.container.removeEventListener('scroll', this._onScroll);
                }
            },
            observedAttribtutes: {
                get: function () {
                    return ['itemheight', 'columns'];
                }
            },
            attributeChangedCallback: {
                value: function (attr, oldValue, newValue) {
                    if (['itemheight', 'columns'].indexOf(attr) === -1)
                        return;
                    if (oldValue === newValue)
                        return;
                    this[attr] = newValue;
                }
            },
            createContainer: {
                value: function () {
                    var container = document.createElement('div');
                    Object.assign(container.style, {
                        overflow: 'auto',
                        position: 'relative',
                        padding: 0,
                        width: '100%',
                        height: '100%'
                    });
                    return container;
                }
            },
            createScroller: {
                value: function (height) {
                    var scroller = document.createElement('div');
                    scroller.dataset.id = 'scroller';
                    Object.assign(scroller.style, {
                        opacity: 0,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '1px',
                        height: parseInt(height, 10) + 'px'
                    });
                    return scroller;
                }
            },
            onPropsChange: {
                value: function () {
                    var height = (this._itemheight || 20) * Math.ceil((this._items || []).length / (this._columns || 1));
                    console.log('onPropsChange', height);
                    if (!this.container) {
                        console.log('No container');
                        return;
                    }
                    var scroller = this.container.querySelector('[data-id="scroller"]');
                    if (scroller)
                        scroller.style.height = height + 'px';
                    this.visibleItems = Math.ceil(this.clientHeight / this._itemheight) * this._columns;
                }
            },
            render: {
                value: function () {
                    if (this.container) {
                        this.renderChunk(this.container.scrollTop || 0);
                    }
                }
            },
            renderChunk: {
                value: function (scrollTop) {
                    var _this = this;
                    var firstVisibleRow = Math.max((Math.ceil(scrollTop / this._itemheight) - 1), 0);
                    var firstRenderedRow = Math.max(firstVisibleRow - Math.ceil(this.visibleItems / this._columns), 0);
                    var firstRenderedItem = (Math.max(firstRenderedRow - 1, 0) * this._columns);
                    if (this.template && this.container) {
                        var chunkData = Object.assign({}, { items: this._items.slice(firstRenderedItem, firstRenderedItem + (this.visibleItems * 3)) });
                        var div = document.createElement('div');
                        var chunkMarkup = '';
                        chunkData.items.forEach(function (item) {
                            var markup = _this.template(item);
                            if (markup)
                                chunkMarkup = chunkMarkup + markup;
                        });
                        div.innerHTML = chunkMarkup;
                        if (div.children) {
                            var row = firstRenderedRow;
                            var column = 0;
                            for (var c in div.children) {
                                if (!(div.children[c] instanceof HTMLElement))
                                    continue;
                                Object.assign(div.children[c].style, {
                                    height: this._itemheight + 'px',
                                    position: 'absolute',
                                    top: (row * this._itemheight) + 'px',
                                    left: (column * (100 / [this._columns || 1])) + '%',
                                    width: (100 / [this._columns || 1]) + '%'
                                });
                                if (column < this._columns - 1) {
                                    column++;
                                }
                                else {
                                    column = 0;
                                    row++;
                                }
                            }
                        }
                        else {
                            console.log('fragment has no children');
                        }
                        var scroller = this.container.querySelector('[data-id="scroller"]');
                        div.appendChild(scroller);
                        this.container.innerHTML = div.innerHTML;
                    }
                }
            },
            scrollHandler: {
                value: function (e) {
                    if (!this.ticking) {
                        var _this = this;
                        window.requestAnimationFrame(function () {
                            var scrollTop = e.target.scrollTop;
                            if (!_this.lastRepaintY || Math.abs(scrollTop - _this.lastRepaintY) > (Math.ceil(_this.clientHeight * 0.8))) {
                                _this.renderChunk(scrollTop);
                                _this.lastRepaintY = scrollTop;
                            }
                            e.preventDefault && e.preventDefault();
                            _this.ticking = false;
                        });
                        this.ticking = true;
                    }
                }
            },
            getTemplate: {
                value: function () {
                    var tmpl = this.querySelector('template').innerHTML.trim();
                    if (tmpl) {
                        this.template = this.templateFactory(tmpl);
                    }
                    else {
                        throw new Error('No template defined');
                    }
                }
            },
            templateFactory: {
                value: function (str) {
                    var fn = new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" +
                        "var _=function(r){return (typeof r !== 'string')?r:" +
                        "r.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;')};" +
                        "var __=function(r){ var div = document.createElement('div');div.appendChild(document.createTextNode(r)); return div.innerHTML;};" +
                        "with(obj){p.push('" +
                        str
                            .replace(/[\r\t\n]/g, " ")
                            .split("{{").join("\t")
                            .replace(/((^|}})[^\t]*)'/g, "$1\r")
                            .replace(/\t(.*?)}}/g, "',$1,'")
                            .split("\t").join("');")
                            .split("}}").join("p.push('")
                            .split("\r").join("\\'")
                        + "');};return p.join('');");
                    return fn;
                }
            }
        })
    });
}(window, document));
