(function ($, undefined) {
  var alreadyInitialized = function () {
    var events = $._data(document, 'events');
    return events && events.click && $.grep(events.click, function (e) {
      return e.namespace === 'rails';
    }).length;
  };
  if (alreadyInitialized()) {
    $.error('jquery-ujs has already been loaded!');
  }
  var rails;
  $.rails = rails = {
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with]',
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',
    formSubmitSelector: 'form',
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type])',
    disableSelector: 'input[data-disable-with], button[data-disable-with], textarea[data-disable-with]',
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled',
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',
    fileInputSelector: 'input[type=file]',
    linkDisableSelector: 'a[data-disable-with]',
    CSRFProtection: function (xhr) {
      var token = $('meta[name="csrf-token"]').attr('content');
      if (token)
        xhr.setRequestHeader('X-CSRF-Token', token);
    },
    fire: function (obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },
    confirm: function (message) {
      return confirm(message);
    },
    ajax: function (options) {
      return $.ajax(options);
    },
    href: function (element) {
      return element.attr('href');
    },
    handleRemote: function (element) {
      var method, url, data, elCrossDomain, crossDomain, withCredentials, dataType, options;
      if (rails.fire(element, 'ajax:before')) {
        elCrossDomain = element.data('cross-domain');
        crossDomain = elCrossDomain === undefined ? null : elCrossDomain;
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || $.ajaxSettings && $.ajaxSettings.dataType;
        if (element.is('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = element.serializeArray();
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params'))
            data = data + '&' + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }
        options = {
          type: method || 'GET',
          data: data,
          dataType: dataType,
          beforeSend: function (xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            return rails.fire(element, 'ajax:beforeSend', [
              xhr,
              settings
            ]);
          },
          success: function (data, status, xhr) {
            element.trigger('ajax:success', [
              data,
              status,
              xhr
            ]);
          },
          complete: function (xhr, status) {
            element.trigger('ajax:complete', [
              xhr,
              status
            ]);
          },
          error: function (xhr, status, error) {
            element.trigger('ajax:error', [
              xhr,
              status,
              error
            ]);
          },
          crossDomain: crossDomain
        };
        if (withCredentials) {
          options.xhrFields = { withCredentials: withCredentials };
        }
        if (url) {
          options.url = url;
        }
        var jqxhr = rails.ajax(options);
        element.trigger('ajax:send', jqxhr);
        return jqxhr;
      } else {
        return false;
      }
    },
    handleMethod: function (link) {
      var href = rails.href(link), method = link.data('method'), target = link.attr('target'), csrf_token = $('meta[name=csrf-token]').attr('content'), csrf_param = $('meta[name=csrf-param]').attr('content'), form = $('<form method="post" action="' + href + '"></form>'), metadata_input = '<input name="_method" value="' + method + '" type="hidden" />';
      if (csrf_param !== undefined && csrf_token !== undefined) {
        metadata_input += '<input name="' + csrf_param + '" value="' + csrf_token + '" type="hidden" />';
      }
      if (target) {
        form.attr('target', target);
      }
      form.hide().append(metadata_input).appendTo('body');
      form.submit();
    },
    disableFormElements: function (form) {
      form.find(rails.disableSelector).each(function () {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        element.data('ujs:enable-with', element[method]());
        element[method](element.data('disable-with'));
        element.prop('disabled', true);
      });
    },
    enableFormElements: function (form) {
      form.find(rails.enableSelector).each(function () {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        if (element.data('ujs:enable-with'))
          element[method](element.data('ujs:enable-with'));
        element.prop('disabled', false);
      });
    },
    allowAction: function (element) {
      var message = element.data('confirm'), answer = false, callback;
      if (!message) {
        return true;
      }
      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },
    blankInputs: function (form, specifiedSelector, nonBlank) {
      var inputs = $(), input, valueToCheck, selector = specifiedSelector || 'input,textarea', allInputs = form.find(selector);
      allInputs.each(function () {
        input = $(this);
        valueToCheck = input.is('input[type=checkbox],input[type=radio]') ? input.is(':checked') : input.val();
        if (!valueToCheck === !nonBlank) {
          if (input.is('input[type=radio]') && allInputs.filter('input[type=radio]:checked[name="' + input.attr('name') + '"]').length) {
            return true;
          }
          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },
    nonBlankInputs: function (form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true);
    },
    stopEverything: function (e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },
    callFormSubmitBindings: function (form, event) {
      var events = form.data('events'), continuePropagation = true;
      if (events !== undefined && events['submit'] !== undefined) {
        $.each(events['submit'], function (i, obj) {
          if (typeof obj.handler === 'function')
            return continuePropagation = obj.handler(event);
        });
      }
      return continuePropagation;
    },
    disableElement: function (element) {
      element.data('ujs:enable-with', element.html());
      element.html(element.data('disable-with'));
      element.bind('click.railsDisable', function (e) {
        return rails.stopEverything(e);
      });
    },
    enableElement: function (element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with'));
        element.data('ujs:enable-with', false);
      }
      element.unbind('click.railsDisable');
    }
  };
  if (rails.fire($(document), 'rails:attachBindings')) {
    $.ajaxPrefilter(function (options, originalOptions, xhr) {
      if (!options.crossDomain) {
        rails.CSRFProtection(xhr);
      }
    });
    $(document).delegate(rails.linkDisableSelector, 'ajax:complete', function () {
      rails.enableElement($(this));
    });
    $(document).delegate(rails.linkClickSelector, 'click.rails', function (e) {
      var link = $(this), method = link.data('method'), data = link.data('params');
      if (!rails.allowAction(link))
        return rails.stopEverything(e);
      if (link.is(rails.linkDisableSelector))
        rails.disableElement(link);
      if (link.data('remote') !== undefined) {
        if ((e.metaKey || e.ctrlKey) && (!method || method === 'GET') && !data) {
          return true;
        }
        var handleRemote = rails.handleRemote(link);
        if (handleRemote === false) {
          rails.enableElement(link);
        } else {
          handleRemote.error(function () {
            rails.enableElement(link);
          });
        }
        return false;
      } else if (link.data('method')) {
        rails.handleMethod(link);
        return false;
      }
    });
    $(document).delegate(rails.inputChangeSelector, 'change.rails', function (e) {
      var link = $(this);
      if (!rails.allowAction(link))
        return rails.stopEverything(e);
      rails.handleRemote(link);
      return false;
    });
    $(document).delegate(rails.formSubmitSelector, 'submit.rails', function (e) {
      var form = $(this), remote = form.data('remote') !== undefined, blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector), nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);
      if (!rails.allowAction(form))
        return rails.stopEverything(e);
      if (blankRequiredInputs && form.attr('novalidate') == undefined && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
        return rails.stopEverything(e);
      }
      if (remote) {
        if (nonBlankFileInputs) {
          setTimeout(function () {
            rails.disableFormElements(form);
          }, 13);
          var aborted = rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);
          if (!aborted) {
            setTimeout(function () {
              rails.enableFormElements(form);
            }, 13);
          }
          return aborted;
        }
        if (!$.support.submitBubbles && $().jquery < '1.7' && rails.callFormSubmitBindings(form, e) === false)
          return rails.stopEverything(e);
        rails.handleRemote(form);
        return false;
      } else {
        setTimeout(function () {
          rails.disableFormElements(form);
        }, 13);
      }
    });
    $(document).delegate(rails.formInputClickSelector, 'click.rails', function (event) {
      var button = $(this);
      if (!rails.allowAction(button))
        return rails.stopEverything(event);
      var name = button.attr('name'), data = name ? {
          name: name,
          value: button.val()
        } : null;
      button.closest('form').data('ujs:submit-button', data);
    });
    $(document).delegate(rails.formSubmitSelector, 'ajax:beforeSend.rails', function (event) {
      if (this == event.target)
        rails.disableFormElements($(this));
    });
    $(document).delegate(rails.formSubmitSelector, 'ajax:complete.rails', function (event) {
      if (this == event.target)
        rails.enableFormElements($(this));
    });
    $(function () {
      var csrf_token = $('meta[name=csrf-token]').attr('content');
      var csrf_param = $('meta[name=csrf-param]').attr('content');
      $('form input[name="' + csrf_param + '"]').val(csrf_token);
    });
  }
}(jQuery));(function ($, undefined) {
  var uuid = 0, runiqueId = /^ui-id-\d+$/;
  $.ui = $.ui || {};
  if ($.ui.version) {
    return;
  }
  $.extend($.ui, {
    version: '1.9.2',
    keyCode: {
      BACKSPACE: 8,
      COMMA: 188,
      DELETE: 46,
      DOWN: 40,
      END: 35,
      ENTER: 13,
      ESCAPE: 27,
      HOME: 36,
      LEFT: 37,
      NUMPAD_ADD: 107,
      NUMPAD_DECIMAL: 110,
      NUMPAD_DIVIDE: 111,
      NUMPAD_ENTER: 108,
      NUMPAD_MULTIPLY: 106,
      NUMPAD_SUBTRACT: 109,
      PAGE_DOWN: 34,
      PAGE_UP: 33,
      PERIOD: 190,
      RIGHT: 39,
      SPACE: 32,
      TAB: 9,
      UP: 38
    }
  });
  $.fn.extend({
    _focus: $.fn.focus,
    focus: function (delay, fn) {
      return typeof delay === 'number' ? this.each(function () {
        var elem = this;
        setTimeout(function () {
          $(elem).focus();
          if (fn) {
            fn.call(elem);
          }
        }, delay);
      }) : this._focus.apply(this, arguments);
    },
    scrollParent: function () {
      var scrollParent;
      if ($.ui.ie && /(static|relative)/.test(this.css('position')) || /absolute/.test(this.css('position'))) {
        scrollParent = this.parents().filter(function () {
          return /(relative|absolute|fixed)/.test($.css(this, 'position')) && /(auto|scroll)/.test($.css(this, 'overflow') + $.css(this, 'overflow-y') + $.css(this, 'overflow-x'));
        }).eq(0);
      } else {
        scrollParent = this.parents().filter(function () {
          return /(auto|scroll)/.test($.css(this, 'overflow') + $.css(this, 'overflow-y') + $.css(this, 'overflow-x'));
        }).eq(0);
      }
      return /fixed/.test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
    },
    zIndex: function (zIndex) {
      if (zIndex !== undefined) {
        return this.css('zIndex', zIndex);
      }
      if (this.length) {
        var elem = $(this[0]), position, value;
        while (elem.length && elem[0] !== document) {
          position = elem.css('position');
          if (position === 'absolute' || position === 'relative' || position === 'fixed') {
            value = parseInt(elem.css('zIndex'), 10);
            if (!isNaN(value) && value !== 0) {
              return value;
            }
          }
          elem = elem.parent();
        }
      }
      return 0;
    },
    uniqueId: function () {
      return this.each(function () {
        if (!this.id) {
          this.id = 'ui-id-' + ++uuid;
        }
      });
    },
    removeUniqueId: function () {
      return this.each(function () {
        if (runiqueId.test(this.id)) {
          $(this).removeAttr('id');
        }
      });
    }
  });
  function focusable(element, isTabIndexNotNaN) {
    var map, mapName, img, nodeName = element.nodeName.toLowerCase();
    if ('area' === nodeName) {
      map = element.parentNode;
      mapName = map.name;
      if (!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
        return false;
      }
      img = $('img[usemap=#' + mapName + ']')[0];
      return !!img && visible(img);
    }
    return (/input|select|textarea|button|object/.test(nodeName) ? !element.disabled : 'a' === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN) && visible(element);
  }
  function visible(element) {
    return $.expr.filters.visible(element) && !$(element).parents().andSelf().filter(function () {
      return $.css(this, 'visibility') === 'hidden';
    }).length;
  }
  $.extend($.expr[':'], {
    data: $.expr.createPseudo ? $.expr.createPseudo(function (dataName) {
      return function (elem) {
        return !!$.data(elem, dataName);
      };
    }) : function (elem, i, match) {
      return !!$.data(elem, match[3]);
    },
    focusable: function (element) {
      return focusable(element, !isNaN($.attr(element, 'tabindex')));
    },
    tabbable: function (element) {
      var tabIndex = $.attr(element, 'tabindex'), isTabIndexNaN = isNaN(tabIndex);
      return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
    }
  });
  $(function () {
    var body = document.body, div = body.appendChild(div = document.createElement('div'));
    div.offsetHeight;
    $.extend(div.style, {
      minHeight: '100px',
      height: 'auto',
      padding: 0,
      borderWidth: 0
    });
    $.support.minHeight = div.offsetHeight === 100;
    $.support.selectstart = 'onselectstart' in div;
    body.removeChild(div).style.display = 'none';
  });
  if (!$('<a>').outerWidth(1).jquery) {
    $.each([
      'Width',
      'Height'
    ], function (i, name) {
      var side = name === 'Width' ? [
          'Left',
          'Right'
        ] : [
          'Top',
          'Bottom'
        ], type = name.toLowerCase(), orig = {
          innerWidth: $.fn.innerWidth,
          innerHeight: $.fn.innerHeight,
          outerWidth: $.fn.outerWidth,
          outerHeight: $.fn.outerHeight
        };
      function reduce(elem, size, border, margin) {
        $.each(side, function () {
          size -= parseFloat($.css(elem, 'padding' + this)) || 0;
          if (border) {
            size -= parseFloat($.css(elem, 'border' + this + 'Width')) || 0;
          }
          if (margin) {
            size -= parseFloat($.css(elem, 'margin' + this)) || 0;
          }
        });
        return size;
      }
      $.fn['inner' + name] = function (size) {
        if (size === undefined) {
          return orig['inner' + name].call(this);
        }
        return this.each(function () {
          $(this).css(type, reduce(this, size) + 'px');
        });
      };
      $.fn['outer' + name] = function (size, margin) {
        if (typeof size !== 'number') {
          return orig['outer' + name].call(this, size);
        }
        return this.each(function () {
          $(this).css(type, reduce(this, size, true, margin) + 'px');
        });
      };
    });
  }
  if ($('<a>').data('a-b', 'a').removeData('a-b').data('a-b')) {
    $.fn.removeData = function (removeData) {
      return function (key) {
        if (arguments.length) {
          return removeData.call(this, $.camelCase(key));
        } else {
          return removeData.call(this);
        }
      };
    }($.fn.removeData);
  }
  (function () {
    var uaMatch = /msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase()) || [];
    $.ui.ie = uaMatch.length ? true : false;
    $.ui.ie6 = parseFloat(uaMatch[1], 10) === 6;
  }());
  $.fn.extend({
    disableSelection: function () {
      return this.bind(($.support.selectstart ? 'selectstart' : 'mousedown') + '.ui-disableSelection', function (event) {
        event.preventDefault();
      });
    },
    enableSelection: function () {
      return this.unbind('.ui-disableSelection');
    }
  });
  $.extend($.ui, {
    plugin: {
      add: function (module, option, set) {
        var i, proto = $.ui[module].prototype;
        for (i in set) {
          proto.plugins[i] = proto.plugins[i] || [];
          proto.plugins[i].push([
            option,
            set[i]
          ]);
        }
      },
      call: function (instance, name, args) {
        var i, set = instance.plugins[name];
        if (!set || !instance.element[0].parentNode || instance.element[0].parentNode.nodeType === 11) {
          return;
        }
        for (i = 0; i < set.length; i++) {
          if (instance.options[set[i][0]]) {
            set[i][1].apply(instance.element, args);
          }
        }
      }
    },
    contains: $.contains,
    hasScroll: function (el, a) {
      if ($(el).css('overflow') === 'hidden') {
        return false;
      }
      var scroll = a && a === 'left' ? 'scrollLeft' : 'scrollTop', has = false;
      if (el[scroll] > 0) {
        return true;
      }
      el[scroll] = 1;
      has = el[scroll] > 0;
      el[scroll] = 0;
      return has;
    },
    isOverAxis: function (x, reference, size) {
      return x > reference && x < reference + size;
    },
    isOver: function (y, x, top, left, height, width) {
      return $.ui.isOverAxis(y, top, height) && $.ui.isOverAxis(x, left, width);
    }
  });
}(jQuery));
(function ($, undefined) {
  var uuid = 0, slice = Array.prototype.slice, _cleanData = $.cleanData;
  $.cleanData = function (elems) {
    for (var i = 0, elem; (elem = elems[i]) != null; i++) {
      try {
        $(elem).triggerHandler('remove');
      } catch (e) {
      }
    }
    _cleanData(elems);
  };
  $.widget = function (name, base, prototype) {
    var fullName, existingConstructor, constructor, basePrototype, namespace = name.split('.')[0];
    name = name.split('.')[1];
    fullName = namespace + '-' + name;
    if (!prototype) {
      prototype = base;
      base = $.Widget;
    }
    $.expr[':'][fullName.toLowerCase()] = function (elem) {
      return !!$.data(elem, fullName);
    };
    $[namespace] = $[namespace] || {};
    existingConstructor = $[namespace][name];
    constructor = $[namespace][name] = function (options, element) {
      if (!this._createWidget) {
        return new constructor(options, element);
      }
      if (arguments.length) {
        this._createWidget(options, element);
      }
    };
    $.extend(constructor, existingConstructor, {
      version: prototype.version,
      _proto: $.extend({}, prototype),
      _childConstructors: []
    });
    basePrototype = new base();
    basePrototype.options = $.widget.extend({}, basePrototype.options);
    $.each(prototype, function (prop, value) {
      if ($.isFunction(value)) {
        prototype[prop] = function () {
          var _super = function () {
              return base.prototype[prop].apply(this, arguments);
            }, _superApply = function (args) {
              return base.prototype[prop].apply(this, args);
            };
          return function () {
            var __super = this._super, __superApply = this._superApply, returnValue;
            this._super = _super;
            this._superApply = _superApply;
            returnValue = value.apply(this, arguments);
            this._super = __super;
            this._superApply = __superApply;
            return returnValue;
          };
        }();
      }
    });
    constructor.prototype = $.widget.extend(basePrototype, { widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix : name }, prototype, {
      constructor: constructor,
      namespace: namespace,
      widgetName: name,
      widgetBaseClass: fullName,
      widgetFullName: fullName
    });
    if (existingConstructor) {
      $.each(existingConstructor._childConstructors, function (i, child) {
        var childPrototype = child.prototype;
        $.widget(childPrototype.namespace + '.' + childPrototype.widgetName, constructor, child._proto);
      });
      delete existingConstructor._childConstructors;
    } else {
      base._childConstructors.push(constructor);
    }
    $.widget.bridge(name, constructor);
  };
  $.widget.extend = function (target) {
    var input = slice.call(arguments, 1), inputIndex = 0, inputLength = input.length, key, value;
    for (; inputIndex < inputLength; inputIndex++) {
      for (key in input[inputIndex]) {
        value = input[inputIndex][key];
        if (input[inputIndex].hasOwnProperty(key) && value !== undefined) {
          if ($.isPlainObject(value)) {
            target[key] = $.isPlainObject(target[key]) ? $.widget.extend({}, target[key], value) : $.widget.extend({}, value);
          } else {
            target[key] = value;
          }
        }
      }
    }
    return target;
  };
  $.widget.bridge = function (name, object) {
    var fullName = object.prototype.widgetFullName || name;
    $.fn[name] = function (options) {
      var isMethodCall = typeof options === 'string', args = slice.call(arguments, 1), returnValue = this;
      options = !isMethodCall && args.length ? $.widget.extend.apply(null, [options].concat(args)) : options;
      if (isMethodCall) {
        this.each(function () {
          var methodValue, instance = $.data(this, fullName);
          if (!instance) {
            return $.error('cannot call methods on ' + name + ' prior to initialization; ' + 'attempted to call method \'' + options + '\'');
          }
          if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
            return $.error('no such method \'' + options + '\' for ' + name + ' widget instance');
          }
          methodValue = instance[options].apply(instance, args);
          if (methodValue !== instance && methodValue !== undefined) {
            returnValue = methodValue && methodValue.jquery ? returnValue.pushStack(methodValue.get()) : methodValue;
            return false;
          }
        });
      } else {
        this.each(function () {
          var instance = $.data(this, fullName);
          if (instance) {
            instance.option(options || {})._init();
          } else {
            $.data(this, fullName, new object(options, this));
          }
        });
      }
      return returnValue;
    };
  };
  $.Widget = function () {
  };
  $.Widget._childConstructors = [];
  $.Widget.prototype = {
    widgetName: 'widget',
    widgetEventPrefix: '',
    defaultElement: '<div>',
    options: {
      disabled: false,
      create: null
    },
    _createWidget: function (options, element) {
      element = $(element || this.defaultElement || this)[0];
      this.element = $(element);
      this.uuid = uuid++;
      this.eventNamespace = '.' + this.widgetName + this.uuid;
      this.options = $.widget.extend({}, this.options, this._getCreateOptions(), options);
      this.bindings = $();
      this.hoverable = $();
      this.focusable = $();
      if (element !== this) {
        $.data(element, this.widgetName, this);
        $.data(element, this.widgetFullName, this);
        this._on(true, this.element, {
          remove: function (event) {
            if (event.target === element) {
              this.destroy();
            }
          }
        });
        this.document = $(element.style ? element.ownerDocument : element.document || element);
        this.window = $(this.document[0].defaultView || this.document[0].parentWindow);
      }
      this._create();
      this._trigger('create', null, this._getCreateEventData());
      this._init();
    },
    _getCreateOptions: $.noop,
    _getCreateEventData: $.noop,
    _create: $.noop,
    _init: $.noop,
    destroy: function () {
      this._destroy();
      this.element.unbind(this.eventNamespace).removeData(this.widgetName).removeData(this.widgetFullName).removeData($.camelCase(this.widgetFullName));
      this.widget().unbind(this.eventNamespace).removeAttr('aria-disabled').removeClass(this.widgetFullName + '-disabled ' + 'ui-state-disabled');
      this.bindings.unbind(this.eventNamespace);
      this.hoverable.removeClass('ui-state-hover');
      this.focusable.removeClass('ui-state-focus');
    },
    _destroy: $.noop,
    widget: function () {
      return this.element;
    },
    option: function (key, value) {
      var options = key, parts, curOption, i;
      if (arguments.length === 0) {
        return $.widget.extend({}, this.options);
      }
      if (typeof key === 'string') {
        options = {};
        parts = key.split('.');
        key = parts.shift();
        if (parts.length) {
          curOption = options[key] = $.widget.extend({}, this.options[key]);
          for (i = 0; i < parts.length - 1; i++) {
            curOption[parts[i]] = curOption[parts[i]] || {};
            curOption = curOption[parts[i]];
          }
          key = parts.pop();
          if (value === undefined) {
            return curOption[key] === undefined ? null : curOption[key];
          }
          curOption[key] = value;
        } else {
          if (value === undefined) {
            return this.options[key] === undefined ? null : this.options[key];
          }
          options[key] = value;
        }
      }
      this._setOptions(options);
      return this;
    },
    _setOptions: function (options) {
      var key;
      for (key in options) {
        this._setOption(key, options[key]);
      }
      return this;
    },
    _setOption: function (key, value) {
      this.options[key] = value;
      if (key === 'disabled') {
        this.widget().toggleClass(this.widgetFullName + '-disabled ui-state-disabled', !!value).attr('aria-disabled', value);
        this.hoverable.removeClass('ui-state-hover');
        this.focusable.removeClass('ui-state-focus');
      }
      return this;
    },
    enable: function () {
      return this._setOption('disabled', false);
    },
    disable: function () {
      return this._setOption('disabled', true);
    },
    _on: function (suppressDisabledCheck, element, handlers) {
      var delegateElement, instance = this;
      if (typeof suppressDisabledCheck !== 'boolean') {
        handlers = element;
        element = suppressDisabledCheck;
        suppressDisabledCheck = false;
      }
      if (!handlers) {
        handlers = element;
        element = this.element;
        delegateElement = this.widget();
      } else {
        element = delegateElement = $(element);
        this.bindings = this.bindings.add(element);
      }
      $.each(handlers, function (event, handler) {
        function handlerProxy() {
          if (!suppressDisabledCheck && (instance.options.disabled === true || $(this).hasClass('ui-state-disabled'))) {
            return;
          }
          return (typeof handler === 'string' ? instance[handler] : handler).apply(instance, arguments);
        }
        if (typeof handler !== 'string') {
          handlerProxy.guid = handler.guid = handler.guid || handlerProxy.guid || $.guid++;
        }
        var match = event.match(/^(\w+)\s*(.*)$/), eventName = match[1] + instance.eventNamespace, selector = match[2];
        if (selector) {
          delegateElement.delegate(selector, eventName, handlerProxy);
        } else {
          element.bind(eventName, handlerProxy);
        }
      });
    },
    _off: function (element, eventName) {
      eventName = (eventName || '').split(' ').join(this.eventNamespace + ' ') + this.eventNamespace;
      element.unbind(eventName).undelegate(eventName);
    },
    _delay: function (handler, delay) {
      function handlerProxy() {
        return (typeof handler === 'string' ? instance[handler] : handler).apply(instance, arguments);
      }
      var instance = this;
      return setTimeout(handlerProxy, delay || 0);
    },
    _hoverable: function (element) {
      this.hoverable = this.hoverable.add(element);
      this._on(element, {
        mouseenter: function (event) {
          $(event.currentTarget).addClass('ui-state-hover');
        },
        mouseleave: function (event) {
          $(event.currentTarget).removeClass('ui-state-hover');
        }
      });
    },
    _focusable: function (element) {
      this.focusable = this.focusable.add(element);
      this._on(element, {
        focusin: function (event) {
          $(event.currentTarget).addClass('ui-state-focus');
        },
        focusout: function (event) {
          $(event.currentTarget).removeClass('ui-state-focus');
        }
      });
    },
    _trigger: function (type, event, data) {
      var prop, orig, callback = this.options[type];
      data = data || {};
      event = $.Event(event);
      event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase();
      event.target = this.element[0];
      orig = event.originalEvent;
      if (orig) {
        for (prop in orig) {
          if (!(prop in event)) {
            event[prop] = orig[prop];
          }
        }
      }
      this.element.trigger(event, data);
      return !($.isFunction(callback) && callback.apply(this.element[0], [event].concat(data)) === false || event.isDefaultPrevented());
    }
  };
  $.each({
    show: 'fadeIn',
    hide: 'fadeOut'
  }, function (method, defaultEffect) {
    $.Widget.prototype['_' + method] = function (element, options, callback) {
      if (typeof options === 'string') {
        options = { effect: options };
      }
      var hasOptions, effectName = !options ? method : options === true || typeof options === 'number' ? defaultEffect : options.effect || defaultEffect;
      options = options || {};
      if (typeof options === 'number') {
        options = { duration: options };
      }
      hasOptions = !$.isEmptyObject(options);
      options.complete = callback;
      if (options.delay) {
        element.delay(options.delay);
      }
      if (hasOptions && $.effects && ($.effects.effect[effectName] || $.uiBackCompat !== false && $.effects[effectName])) {
        element[method](options);
      } else if (effectName !== method && element[effectName]) {
        element[effectName](options.duration, options.easing, callback);
      } else {
        element.queue(function (next) {
          $(this)[method]();
          if (callback) {
            callback.call(element[0]);
          }
          next();
        });
      }
    };
  });
  if ($.uiBackCompat !== false) {
    $.Widget.prototype._getCreateOptions = function () {
      return $.metadata && $.metadata.get(this.element[0])[this.widgetName];
    };
  }
}(jQuery));
(function ($, undefined) {
  var mouseHandled = false;
  $(document).mouseup(function (e) {
    mouseHandled = false;
  });
  $.widget('ui.mouse', {
    version: '1.9.2',
    options: {
      cancel: 'input,textarea,button,select,option',
      distance: 1,
      delay: 0
    },
    _mouseInit: function () {
      var that = this;
      this.element.bind('mousedown.' + this.widgetName, function (event) {
        return that._mouseDown(event);
      }).bind('click.' + this.widgetName, function (event) {
        if (true === $.data(event.target, that.widgetName + '.preventClickEvent')) {
          $.removeData(event.target, that.widgetName + '.preventClickEvent');
          event.stopImmediatePropagation();
          return false;
        }
      });
      this.started = false;
    },
    _mouseDestroy: function () {
      this.element.unbind('.' + this.widgetName);
      if (this._mouseMoveDelegate) {
        $(document).unbind('mousemove.' + this.widgetName, this._mouseMoveDelegate).unbind('mouseup.' + this.widgetName, this._mouseUpDelegate);
      }
    },
    _mouseDown: function (event) {
      if (mouseHandled) {
        return;
      }
      this._mouseStarted && this._mouseUp(event);
      this._mouseDownEvent = event;
      var that = this, btnIsLeft = event.which === 1, elIsCancel = typeof this.options.cancel === 'string' && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false;
      if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
        return true;
      }
      this.mouseDelayMet = !this.options.delay;
      if (!this.mouseDelayMet) {
        this._mouseDelayTimer = setTimeout(function () {
          that.mouseDelayMet = true;
        }, this.options.delay);
      }
      if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
        this._mouseStarted = this._mouseStart(event) !== false;
        if (!this._mouseStarted) {
          event.preventDefault();
          return true;
        }
      }
      if (true === $.data(event.target, this.widgetName + '.preventClickEvent')) {
        $.removeData(event.target, this.widgetName + '.preventClickEvent');
      }
      this._mouseMoveDelegate = function (event) {
        return that._mouseMove(event);
      };
      this._mouseUpDelegate = function (event) {
        return that._mouseUp(event);
      };
      $(document).bind('mousemove.' + this.widgetName, this._mouseMoveDelegate).bind('mouseup.' + this.widgetName, this._mouseUpDelegate);
      event.preventDefault();
      mouseHandled = true;
      return true;
    },
    _mouseMove: function (event) {
      if ($.ui.ie && !(document.documentMode >= 9) && !event.button) {
        return this._mouseUp(event);
      }
      if (this._mouseStarted) {
        this._mouseDrag(event);
        return event.preventDefault();
      }
      if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
        this._mouseStarted = this._mouseStart(this._mouseDownEvent, event) !== false;
        this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event);
      }
      return !this._mouseStarted;
    },
    _mouseUp: function (event) {
      $(document).unbind('mousemove.' + this.widgetName, this._mouseMoveDelegate).unbind('mouseup.' + this.widgetName, this._mouseUpDelegate);
      if (this._mouseStarted) {
        this._mouseStarted = false;
        if (event.target === this._mouseDownEvent.target) {
          $.data(event.target, this.widgetName + '.preventClickEvent', true);
        }
        this._mouseStop(event);
      }
      return false;
    },
    _mouseDistanceMet: function (event) {
      return Math.max(Math.abs(this._mouseDownEvent.pageX - event.pageX), Math.abs(this._mouseDownEvent.pageY - event.pageY)) >= this.options.distance;
    },
    _mouseDelayMet: function (event) {
      return this.mouseDelayMet;
    },
    _mouseStart: function (event) {
    },
    _mouseDrag: function (event) {
    },
    _mouseStop: function (event) {
    },
    _mouseCapture: function (event) {
      return true;
    }
  });
}(jQuery));
(function ($, undefined) {
  $.widget('ui.draggable', $.ui.mouse, {
    version: '1.9.2',
    widgetEventPrefix: 'drag',
    options: {
      addClasses: true,
      appendTo: 'parent',
      axis: false,
      connectToSortable: false,
      containment: false,
      cursor: 'auto',
      cursorAt: false,
      grid: false,
      handle: false,
      helper: 'original',
      iframeFix: false,
      opacity: false,
      refreshPositions: false,
      revert: false,
      revertDuration: 500,
      scope: 'default',
      scroll: true,
      scrollSensitivity: 20,
      scrollSpeed: 20,
      snap: false,
      snapMode: 'both',
      snapTolerance: 20,
      stack: false,
      zIndex: false
    },
    _create: function () {
      if (this.options.helper == 'original' && !/^(?:r|a|f)/.test(this.element.css('position')))
        this.element[0].style.position = 'relative';
      this.options.addClasses && this.element.addClass('ui-draggable');
      this.options.disabled && this.element.addClass('ui-draggable-disabled');
      this._mouseInit();
    },
    _destroy: function () {
      this.element.removeClass('ui-draggable ui-draggable-dragging ui-draggable-disabled');
      this._mouseDestroy();
    },
    _mouseCapture: function (event) {
      var o = this.options;
      if (this.helper || o.disabled || $(event.target).is('.ui-resizable-handle'))
        return false;
      this.handle = this._getHandle(event);
      if (!this.handle)
        return false;
      $(o.iframeFix === true ? 'iframe' : o.iframeFix).each(function () {
        $('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({
          width: this.offsetWidth + 'px',
          height: this.offsetHeight + 'px',
          position: 'absolute',
          opacity: '0.001',
          zIndex: 1000
        }).css($(this).offset()).appendTo('body');
      });
      return true;
    },
    _mouseStart: function (event) {
      var o = this.options;
      this.helper = this._createHelper(event);
      this.helper.addClass('ui-draggable-dragging');
      this._cacheHelperProportions();
      if ($.ui.ddmanager)
        $.ui.ddmanager.current = this;
      this._cacheMargins();
      this.cssPosition = this.helper.css('position');
      this.scrollParent = this.helper.scrollParent();
      this.offset = this.positionAbs = this.element.offset();
      this.offset = {
        top: this.offset.top - this.margins.top,
        left: this.offset.left - this.margins.left
      };
      $.extend(this.offset, {
        click: {
          left: event.pageX - this.offset.left,
          top: event.pageY - this.offset.top
        },
        parent: this._getParentOffset(),
        relative: this._getRelativeOffset()
      });
      this.originalPosition = this.position = this._generatePosition(event);
      this.originalPageX = event.pageX;
      this.originalPageY = event.pageY;
      o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt);
      if (o.containment)
        this._setContainment();
      if (this._trigger('start', event) === false) {
        this._clear();
        return false;
      }
      this._cacheHelperProportions();
      if ($.ui.ddmanager && !o.dropBehaviour)
        $.ui.ddmanager.prepareOffsets(this, event);
      this._mouseDrag(event, true);
      if ($.ui.ddmanager)
        $.ui.ddmanager.dragStart(this, event);
      return true;
    },
    _mouseDrag: function (event, noPropagation) {
      this.position = this._generatePosition(event);
      this.positionAbs = this._convertPositionTo('absolute');
      if (!noPropagation) {
        var ui = this._uiHash();
        if (this._trigger('drag', event, ui) === false) {
          this._mouseUp({});
          return false;
        }
        this.position = ui.position;
      }
      if (!this.options.axis || this.options.axis != 'y')
        this.helper[0].style.left = this.position.left + 'px';
      if (!this.options.axis || this.options.axis != 'x')
        this.helper[0].style.top = this.position.top + 'px';
      if ($.ui.ddmanager)
        $.ui.ddmanager.drag(this, event);
      return false;
    },
    _mouseStop: function (event) {
      var dropped = false;
      if ($.ui.ddmanager && !this.options.dropBehaviour)
        dropped = $.ui.ddmanager.drop(this, event);
      if (this.dropped) {
        dropped = this.dropped;
        this.dropped = false;
      }
      var element = this.element[0], elementInDom = false;
      while (element && (element = element.parentNode)) {
        if (element == document) {
          elementInDom = true;
        }
      }
      if (!elementInDom && this.options.helper === 'original')
        return false;
      if (this.options.revert == 'invalid' && !dropped || this.options.revert == 'valid' && dropped || this.options.revert === true || $.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped)) {
        var that = this;
        $(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function () {
          if (that._trigger('stop', event) !== false) {
            that._clear();
          }
        });
      } else {
        if (this._trigger('stop', event) !== false) {
          this._clear();
        }
      }
      return false;
    },
    _mouseUp: function (event) {
      $('div.ui-draggable-iframeFix').each(function () {
        this.parentNode.removeChild(this);
      });
      if ($.ui.ddmanager)
        $.ui.ddmanager.dragStop(this, event);
      return $.ui.mouse.prototype._mouseUp.call(this, event);
    },
    cancel: function () {
      if (this.helper.is('.ui-draggable-dragging')) {
        this._mouseUp({});
      } else {
        this._clear();
      }
      return this;
    },
    _getHandle: function (event) {
      var handle = !this.options.handle || !$(this.options.handle, this.element).length ? true : false;
      $(this.options.handle, this.element).find('*').andSelf().each(function () {
        if (this == event.target)
          handle = true;
      });
      return handle;
    },
    _createHelper: function (event) {
      var o = this.options;
      var helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event])) : o.helper == 'clone' ? this.element.clone().removeAttr('id') : this.element;
      if (!helper.parents('body').length)
        helper.appendTo(o.appendTo == 'parent' ? this.element[0].parentNode : o.appendTo);
      if (helper[0] != this.element[0] && !/(fixed|absolute)/.test(helper.css('position')))
        helper.css('position', 'absolute');
      return helper;
    },
    _adjustOffsetFromHelper: function (obj) {
      if (typeof obj == 'string') {
        obj = obj.split(' ');
      }
      if ($.isArray(obj)) {
        obj = {
          left: +obj[0],
          top: +obj[1] || 0
        };
      }
      if ('left' in obj) {
        this.offset.click.left = obj.left + this.margins.left;
      }
      if ('right' in obj) {
        this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
      }
      if ('top' in obj) {
        this.offset.click.top = obj.top + this.margins.top;
      }
      if ('bottom' in obj) {
        this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
      }
    },
    _getParentOffset: function () {
      this.offsetParent = this.helper.offsetParent();
      var po = this.offsetParent.offset();
      if (this.cssPosition == 'absolute' && this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
        po.left += this.scrollParent.scrollLeft();
        po.top += this.scrollParent.scrollTop();
      }
      if (this.offsetParent[0] == document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == 'html' && $.ui.ie)
        po = {
          top: 0,
          left: 0
        };
      return {
        top: po.top + (parseInt(this.offsetParent.css('borderTopWidth'), 10) || 0),
        left: po.left + (parseInt(this.offsetParent.css('borderLeftWidth'), 10) || 0)
      };
    },
    _getRelativeOffset: function () {
      if (this.cssPosition == 'relative') {
        var p = this.element.position();
        return {
          top: p.top - (parseInt(this.helper.css('top'), 10) || 0) + this.scrollParent.scrollTop(),
          left: p.left - (parseInt(this.helper.css('left'), 10) || 0) + this.scrollParent.scrollLeft()
        };
      } else {
        return {
          top: 0,
          left: 0
        };
      }
    },
    _cacheMargins: function () {
      this.margins = {
        left: parseInt(this.element.css('marginLeft'), 10) || 0,
        top: parseInt(this.element.css('marginTop'), 10) || 0,
        right: parseInt(this.element.css('marginRight'), 10) || 0,
        bottom: parseInt(this.element.css('marginBottom'), 10) || 0
      };
    },
    _cacheHelperProportions: function () {
      this.helperProportions = {
        width: this.helper.outerWidth(),
        height: this.helper.outerHeight()
      };
    },
    _setContainment: function () {
      var o = this.options;
      if (o.containment == 'parent')
        o.containment = this.helper[0].parentNode;
      if (o.containment == 'document' || o.containment == 'window')
        this.containment = [
          o.containment == 'document' ? 0 : $(window).scrollLeft() - this.offset.relative.left - this.offset.parent.left,
          o.containment == 'document' ? 0 : $(window).scrollTop() - this.offset.relative.top - this.offset.parent.top,
          (o.containment == 'document' ? 0 : $(window).scrollLeft()) + $(o.containment == 'document' ? document : window).width() - this.helperProportions.width - this.margins.left,
          (o.containment == 'document' ? 0 : $(window).scrollTop()) + ($(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
        ];
      if (!/^(document|window|parent)$/.test(o.containment) && o.containment.constructor != Array) {
        var c = $(o.containment);
        var ce = c[0];
        if (!ce)
          return;
        var co = c.offset();
        var over = $(ce).css('overflow') != 'hidden';
        this.containment = [
          (parseInt($(ce).css('borderLeftWidth'), 10) || 0) + (parseInt($(ce).css('paddingLeft'), 10) || 0),
          (parseInt($(ce).css('borderTopWidth'), 10) || 0) + (parseInt($(ce).css('paddingTop'), 10) || 0),
          (over ? Math.max(ce.scrollWidth, ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css('borderLeftWidth'), 10) || 0) - (parseInt($(ce).css('paddingRight'), 10) || 0) - this.helperProportions.width - this.margins.left - this.margins.right,
          (over ? Math.max(ce.scrollHeight, ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css('borderTopWidth'), 10) || 0) - (parseInt($(ce).css('paddingBottom'), 10) || 0) - this.helperProportions.height - this.margins.top - this.margins.bottom
        ];
        this.relative_container = c;
      } else if (o.containment.constructor == Array) {
        this.containment = o.containment;
      }
    },
    _convertPositionTo: function (d, pos) {
      if (!pos)
        pos = this.position;
      var mod = d == 'absolute' ? 1 : -1;
      var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
      return {
        top: pos.top + this.offset.relative.top * mod + this.offset.parent.top * mod - (this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()) * mod,
        left: pos.left + this.offset.relative.left * mod + this.offset.parent.left * mod - (this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod
      };
    },
    _generatePosition: function (event) {
      var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
      var pageX = event.pageX;
      var pageY = event.pageY;
      if (this.originalPosition) {
        var containment;
        if (this.containment) {
          if (this.relative_container) {
            var co = this.relative_container.offset();
            containment = [
              this.containment[0] + co.left,
              this.containment[1] + co.top,
              this.containment[2] + co.left,
              this.containment[3] + co.top
            ];
          } else {
            containment = this.containment;
          }
          if (event.pageX - this.offset.click.left < containment[0])
            pageX = containment[0] + this.offset.click.left;
          if (event.pageY - this.offset.click.top < containment[1])
            pageY = containment[1] + this.offset.click.top;
          if (event.pageX - this.offset.click.left > containment[2])
            pageX = containment[2] + this.offset.click.left;
          if (event.pageY - this.offset.click.top > containment[3])
            pageY = containment[3] + this.offset.click.top;
        }
        if (o.grid) {
          var top = o.grid[1] ? this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1] : this.originalPageY;
          pageY = containment ? !(top - this.offset.click.top < containment[1] || top - this.offset.click.top > containment[3]) ? top : !(top - this.offset.click.top < containment[1]) ? top - o.grid[1] : top + o.grid[1] : top;
          var left = o.grid[0] ? this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0] : this.originalPageX;
          pageX = containment ? !(left - this.offset.click.left < containment[0] || left - this.offset.click.left > containment[2]) ? left : !(left - this.offset.click.left < containment[0]) ? left - o.grid[0] : left + o.grid[0] : left;
        }
      }
      return {
        top: pageY - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + (this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()),
        left: pageX - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + (this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft())
      };
    },
    _clear: function () {
      this.helper.removeClass('ui-draggable-dragging');
      if (this.helper[0] != this.element[0] && !this.cancelHelperRemoval)
        this.helper.remove();
      this.helper = null;
      this.cancelHelperRemoval = false;
    },
    _trigger: function (type, event, ui) {
      ui = ui || this._uiHash();
      $.ui.plugin.call(this, type, [
        event,
        ui
      ]);
      if (type == 'drag')
        this.positionAbs = this._convertPositionTo('absolute');
      return $.Widget.prototype._trigger.call(this, type, event, ui);
    },
    plugins: {},
    _uiHash: function (event) {
      return {
        helper: this.helper,
        position: this.position,
        originalPosition: this.originalPosition,
        offset: this.positionAbs
      };
    }
  });
  $.ui.plugin.add('draggable', 'connectToSortable', {
    start: function (event, ui) {
      var inst = $(this).data('draggable'), o = inst.options, uiSortable = $.extend({}, ui, { item: inst.element });
      inst.sortables = [];
      $(o.connectToSortable).each(function () {
        var sortable = $.data(this, 'sortable');
        if (sortable && !sortable.options.disabled) {
          inst.sortables.push({
            instance: sortable,
            shouldRevert: sortable.options.revert
          });
          sortable.refreshPositions();
          sortable._trigger('activate', event, uiSortable);
        }
      });
    },
    stop: function (event, ui) {
      var inst = $(this).data('draggable'), uiSortable = $.extend({}, ui, { item: inst.element });
      $.each(inst.sortables, function () {
        if (this.instance.isOver) {
          this.instance.isOver = 0;
          inst.cancelHelperRemoval = true;
          this.instance.cancelHelperRemoval = false;
          if (this.shouldRevert)
            this.instance.options.revert = true;
          this.instance._mouseStop(event);
          this.instance.options.helper = this.instance.options._helper;
          if (inst.options.helper == 'original')
            this.instance.currentItem.css({
              top: 'auto',
              left: 'auto'
            });
        } else {
          this.instance.cancelHelperRemoval = false;
          this.instance._trigger('deactivate', event, uiSortable);
        }
      });
    },
    drag: function (event, ui) {
      var inst = $(this).data('draggable'), that = this;
      var checkPos = function (o) {
        var dyClick = this.offset.click.top, dxClick = this.offset.click.left;
        var helperTop = this.positionAbs.top, helperLeft = this.positionAbs.left;
        var itemHeight = o.height, itemWidth = o.width;
        var itemTop = o.top, itemLeft = o.left;
        return $.ui.isOver(helperTop + dyClick, helperLeft + dxClick, itemTop, itemLeft, itemHeight, itemWidth);
      };
      $.each(inst.sortables, function (i) {
        var innermostIntersecting = false;
        var thisSortable = this;
        this.instance.positionAbs = inst.positionAbs;
        this.instance.helperProportions = inst.helperProportions;
        this.instance.offset.click = inst.offset.click;
        if (this.instance._intersectsWith(this.instance.containerCache)) {
          innermostIntersecting = true;
          $.each(inst.sortables, function () {
            this.instance.positionAbs = inst.positionAbs;
            this.instance.helperProportions = inst.helperProportions;
            this.instance.offset.click = inst.offset.click;
            if (this != thisSortable && this.instance._intersectsWith(this.instance.containerCache) && $.ui.contains(thisSortable.instance.element[0], this.instance.element[0]))
              innermostIntersecting = false;
            return innermostIntersecting;
          });
        }
        if (innermostIntersecting) {
          if (!this.instance.isOver) {
            this.instance.isOver = 1;
            this.instance.currentItem = $(that).clone().removeAttr('id').appendTo(this.instance.element).data('sortable-item', true);
            this.instance.options._helper = this.instance.options.helper;
            this.instance.options.helper = function () {
              return ui.helper[0];
            };
            event.target = this.instance.currentItem[0];
            this.instance._mouseCapture(event, true);
            this.instance._mouseStart(event, true, true);
            this.instance.offset.click.top = inst.offset.click.top;
            this.instance.offset.click.left = inst.offset.click.left;
            this.instance.offset.parent.left -= inst.offset.parent.left - this.instance.offset.parent.left;
            this.instance.offset.parent.top -= inst.offset.parent.top - this.instance.offset.parent.top;
            inst._trigger('toSortable', event);
            inst.dropped = this.instance.element;
            inst.currentItem = inst.element;
            this.instance.fromOutside = inst;
          }
          if (this.instance.currentItem)
            this.instance._mouseDrag(event);
        } else {
          if (this.instance.isOver) {
            this.instance.isOver = 0;
            this.instance.cancelHelperRemoval = true;
            this.instance.options.revert = false;
            this.instance._trigger('out', event, this.instance._uiHash(this.instance));
            this.instance._mouseStop(event, true);
            this.instance.options.helper = this.instance.options._helper;
            this.instance.currentItem.remove();
            if (this.instance.placeholder)
              this.instance.placeholder.remove();
            inst._trigger('fromSortable', event);
            inst.dropped = false;
          }
        }
        ;
      });
    }
  });
  $.ui.plugin.add('draggable', 'cursor', {
    start: function (event, ui) {
      var t = $('body'), o = $(this).data('draggable').options;
      if (t.css('cursor'))
        o._cursor = t.css('cursor');
      t.css('cursor', o.cursor);
    },
    stop: function (event, ui) {
      var o = $(this).data('draggable').options;
      if (o._cursor)
        $('body').css('cursor', o._cursor);
    }
  });
  $.ui.plugin.add('draggable', 'opacity', {
    start: function (event, ui) {
      var t = $(ui.helper), o = $(this).data('draggable').options;
      if (t.css('opacity'))
        o._opacity = t.css('opacity');
      t.css('opacity', o.opacity);
    },
    stop: function (event, ui) {
      var o = $(this).data('draggable').options;
      if (o._opacity)
        $(ui.helper).css('opacity', o._opacity);
    }
  });
  $.ui.plugin.add('draggable', 'scroll', {
    start: function (event, ui) {
      var i = $(this).data('draggable');
      if (i.scrollParent[0] != document && i.scrollParent[0].tagName != 'HTML')
        i.overflowOffset = i.scrollParent.offset();
    },
    drag: function (event, ui) {
      var i = $(this).data('draggable'), o = i.options, scrolled = false;
      if (i.scrollParent[0] != document && i.scrollParent[0].tagName != 'HTML') {
        if (!o.axis || o.axis != 'x') {
          if (i.overflowOffset.top + i.scrollParent[0].offsetHeight - event.pageY < o.scrollSensitivity)
            i.scrollParent[0].scrollTop = scrolled = i.scrollParent[0].scrollTop + o.scrollSpeed;
          else if (event.pageY - i.overflowOffset.top < o.scrollSensitivity)
            i.scrollParent[0].scrollTop = scrolled = i.scrollParent[0].scrollTop - o.scrollSpeed;
        }
        if (!o.axis || o.axis != 'y') {
          if (i.overflowOffset.left + i.scrollParent[0].offsetWidth - event.pageX < o.scrollSensitivity)
            i.scrollParent[0].scrollLeft = scrolled = i.scrollParent[0].scrollLeft + o.scrollSpeed;
          else if (event.pageX - i.overflowOffset.left < o.scrollSensitivity)
            i.scrollParent[0].scrollLeft = scrolled = i.scrollParent[0].scrollLeft - o.scrollSpeed;
        }
      } else {
        if (!o.axis || o.axis != 'x') {
          if (event.pageY - $(document).scrollTop() < o.scrollSensitivity)
            scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
          else if ($(window).height() - (event.pageY - $(document).scrollTop()) < o.scrollSensitivity)
            scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
        }
        if (!o.axis || o.axis != 'y') {
          if (event.pageX - $(document).scrollLeft() < o.scrollSensitivity)
            scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed);
          else if ($(window).width() - (event.pageX - $(document).scrollLeft()) < o.scrollSensitivity)
            scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed);
        }
      }
      if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour)
        $.ui.ddmanager.prepareOffsets(i, event);
    }
  });
  $.ui.plugin.add('draggable', 'snap', {
    start: function (event, ui) {
      var i = $(this).data('draggable'), o = i.options;
      i.snapElements = [];
      $(o.snap.constructor != String ? o.snap.items || ':data(draggable)' : o.snap).each(function () {
        var $t = $(this);
        var $o = $t.offset();
        if (this != i.element[0])
          i.snapElements.push({
            item: this,
            width: $t.outerWidth(),
            height: $t.outerHeight(),
            top: $o.top,
            left: $o.left
          });
      });
    },
    drag: function (event, ui) {
      var inst = $(this).data('draggable'), o = inst.options;
      var d = o.snapTolerance;
      var x1 = ui.offset.left, x2 = x1 + inst.helperProportions.width, y1 = ui.offset.top, y2 = y1 + inst.helperProportions.height;
      for (var i = inst.snapElements.length - 1; i >= 0; i--) {
        var l = inst.snapElements[i].left, r = l + inst.snapElements[i].width, t = inst.snapElements[i].top, b = t + inst.snapElements[i].height;
        if (!(l - d < x1 && x1 < r + d && t - d < y1 && y1 < b + d || l - d < x1 && x1 < r + d && t - d < y2 && y2 < b + d || l - d < x2 && x2 < r + d && t - d < y1 && y1 < b + d || l - d < x2 && x2 < r + d && t - d < y2 && y2 < b + d)) {
          if (inst.snapElements[i].snapping)
            inst.options.snap.release && inst.options.snap.release.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item }));
          inst.snapElements[i].snapping = false;
          continue;
        }
        if (o.snapMode != 'inner') {
          var ts = Math.abs(t - y2) <= d;
          var bs = Math.abs(b - y1) <= d;
          var ls = Math.abs(l - x2) <= d;
          var rs = Math.abs(r - x1) <= d;
          if (ts)
            ui.position.top = inst._convertPositionTo('relative', {
              top: t - inst.helperProportions.height,
              left: 0
            }).top - inst.margins.top;
          if (bs)
            ui.position.top = inst._convertPositionTo('relative', {
              top: b,
              left: 0
            }).top - inst.margins.top;
          if (ls)
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: l - inst.helperProportions.width
            }).left - inst.margins.left;
          if (rs)
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: r
            }).left - inst.margins.left;
        }
        var first = ts || bs || ls || rs;
        if (o.snapMode != 'outer') {
          var ts = Math.abs(t - y1) <= d;
          var bs = Math.abs(b - y2) <= d;
          var ls = Math.abs(l - x1) <= d;
          var rs = Math.abs(r - x2) <= d;
          if (ts)
            ui.position.top = inst._convertPositionTo('relative', {
              top: t,
              left: 0
            }).top - inst.margins.top;
          if (bs)
            ui.position.top = inst._convertPositionTo('relative', {
              top: b - inst.helperProportions.height,
              left: 0
            }).top - inst.margins.top;
          if (ls)
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: l
            }).left - inst.margins.left;
          if (rs)
            ui.position.left = inst._convertPositionTo('relative', {
              top: 0,
              left: r - inst.helperProportions.width
            }).left - inst.margins.left;
        }
        if (!inst.snapElements[i].snapping && (ts || bs || ls || rs || first))
          inst.options.snap.snap && inst.options.snap.snap.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item }));
        inst.snapElements[i].snapping = ts || bs || ls || rs || first;
      }
      ;
    }
  });
  $.ui.plugin.add('draggable', 'stack', {
    start: function (event, ui) {
      var o = $(this).data('draggable').options;
      var group = $.makeArray($(o.stack)).sort(function (a, b) {
          return (parseInt($(a).css('zIndex'), 10) || 0) - (parseInt($(b).css('zIndex'), 10) || 0);
        });
      if (!group.length) {
        return;
      }
      var min = parseInt(group[0].style.zIndex) || 0;
      $(group).each(function (i) {
        this.style.zIndex = min + i;
      });
      this[0].style.zIndex = min + group.length;
    }
  });
  $.ui.plugin.add('draggable', 'zIndex', {
    start: function (event, ui) {
      var t = $(ui.helper), o = $(this).data('draggable').options;
      if (t.css('zIndex'))
        o._zIndex = t.css('zIndex');
      t.css('zIndex', o.zIndex);
    },
    stop: function (event, ui) {
      var o = $(this).data('draggable').options;
      if (o._zIndex)
        $(ui.helper).css('zIndex', o._zIndex);
    }
  });
}(jQuery));
(function ($, undefined) {
  $.widget('ui.droppable', {
    version: '1.9.2',
    widgetEventPrefix: 'drop',
    options: {
      accept: '*',
      activeClass: false,
      addClasses: true,
      greedy: false,
      hoverClass: false,
      scope: 'default',
      tolerance: 'intersect'
    },
    _create: function () {
      var o = this.options, accept = o.accept;
      this.isover = 0;
      this.isout = 1;
      this.accept = $.isFunction(accept) ? accept : function (d) {
        return d.is(accept);
      };
      this.proportions = {
        width: this.element[0].offsetWidth,
        height: this.element[0].offsetHeight
      };
      $.ui.ddmanager.droppables[o.scope] = $.ui.ddmanager.droppables[o.scope] || [];
      $.ui.ddmanager.droppables[o.scope].push(this);
      o.addClasses && this.element.addClass('ui-droppable');
    },
    _destroy: function () {
      var drop = $.ui.ddmanager.droppables[this.options.scope];
      for (var i = 0; i < drop.length; i++)
        if (drop[i] == this)
          drop.splice(i, 1);
      this.element.removeClass('ui-droppable ui-droppable-disabled');
    },
    _setOption: function (key, value) {
      if (key == 'accept') {
        this.accept = $.isFunction(value) ? value : function (d) {
          return d.is(value);
        };
      }
      $.Widget.prototype._setOption.apply(this, arguments);
    },
    _activate: function (event) {
      var draggable = $.ui.ddmanager.current;
      if (this.options.activeClass)
        this.element.addClass(this.options.activeClass);
      draggable && this._trigger('activate', event, this.ui(draggable));
    },
    _deactivate: function (event) {
      var draggable = $.ui.ddmanager.current;
      if (this.options.activeClass)
        this.element.removeClass(this.options.activeClass);
      draggable && this._trigger('deactivate', event, this.ui(draggable));
    },
    _over: function (event) {
      var draggable = $.ui.ddmanager.current;
      if (!draggable || (draggable.currentItem || draggable.element)[0] == this.element[0])
        return;
      if (this.accept.call(this.element[0], draggable.currentItem || draggable.element)) {
        if (this.options.hoverClass)
          this.element.addClass(this.options.hoverClass);
        this._trigger('over', event, this.ui(draggable));
      }
    },
    _out: function (event) {
      var draggable = $.ui.ddmanager.current;
      if (!draggable || (draggable.currentItem || draggable.element)[0] == this.element[0])
        return;
      if (this.accept.call(this.element[0], draggable.currentItem || draggable.element)) {
        if (this.options.hoverClass)
          this.element.removeClass(this.options.hoverClass);
        this._trigger('out', event, this.ui(draggable));
      }
    },
    _drop: function (event, custom) {
      var draggable = custom || $.ui.ddmanager.current;
      if (!draggable || (draggable.currentItem || draggable.element)[0] == this.element[0])
        return false;
      var childrenIntersection = false;
      this.element.find(':data(droppable)').not('.ui-draggable-dragging').each(function () {
        var inst = $.data(this, 'droppable');
        if (inst.options.greedy && !inst.options.disabled && inst.options.scope == draggable.options.scope && inst.accept.call(inst.element[0], draggable.currentItem || draggable.element) && $.ui.intersect(draggable, $.extend(inst, { offset: inst.element.offset() }), inst.options.tolerance)) {
          childrenIntersection = true;
          return false;
        }
      });
      if (childrenIntersection)
        return false;
      if (this.accept.call(this.element[0], draggable.currentItem || draggable.element)) {
        if (this.options.activeClass)
          this.element.removeClass(this.options.activeClass);
        if (this.options.hoverClass)
          this.element.removeClass(this.options.hoverClass);
        this._trigger('drop', event, this.ui(draggable));
        return this.element;
      }
      return false;
    },
    ui: function (c) {
      return {
        draggable: c.currentItem || c.element,
        helper: c.helper,
        position: c.position,
        offset: c.positionAbs
      };
    }
  });
  $.ui.intersect = function (draggable, droppable, toleranceMode) {
    if (!droppable.offset)
      return false;
    var x1 = (draggable.positionAbs || draggable.position.absolute).left, x2 = x1 + draggable.helperProportions.width, y1 = (draggable.positionAbs || draggable.position.absolute).top, y2 = y1 + draggable.helperProportions.height;
    var l = droppable.offset.left, r = l + droppable.proportions.width, t = droppable.offset.top, b = t + droppable.proportions.height;
    switch (toleranceMode) {
    case 'fit':
      return l <= x1 && x2 <= r && t <= y1 && y2 <= b;
      break;
    case 'intersect':
      return l < x1 + draggable.helperProportions.width / 2 && x2 - draggable.helperProportions.width / 2 < r && t < y1 + draggable.helperProportions.height / 2 && y2 - draggable.helperProportions.height / 2 < b;
      break;
    case 'pointer':
      var draggableLeft = (draggable.positionAbs || draggable.position.absolute).left + (draggable.clickOffset || draggable.offset.click).left, draggableTop = (draggable.positionAbs || draggable.position.absolute).top + (draggable.clickOffset || draggable.offset.click).top, isOver = $.ui.isOver(draggableTop, draggableLeft, t, l, droppable.proportions.height, droppable.proportions.width);
      return isOver;
      break;
    case 'touch':
      return (y1 >= t && y1 <= b || y2 >= t && y2 <= b || y1 < t && y2 > b) && (x1 >= l && x1 <= r || x2 >= l && x2 <= r || x1 < l && x2 > r);
      break;
    default:
      return false;
      break;
    }
  };
  $.ui.ddmanager = {
    current: null,
    droppables: { 'default': [] },
    prepareOffsets: function (t, event) {
      var m = $.ui.ddmanager.droppables[t.options.scope] || [];
      var type = event ? event.type : null;
      var list = (t.currentItem || t.element).find(':data(droppable)').andSelf();
      droppablesLoop:
        for (var i = 0; i < m.length; i++) {
          if (m[i].options.disabled || t && !m[i].accept.call(m[i].element[0], t.currentItem || t.element))
            continue;
          for (var j = 0; j < list.length; j++) {
            if (list[j] == m[i].element[0]) {
              m[i].proportions.height = 0;
              continue droppablesLoop;
            }
          }
          ;
          m[i].visible = m[i].element.css('display') != 'none';
          if (!m[i].visible)
            continue;
          if (type == 'mousedown')
            m[i]._activate.call(m[i], event);
          m[i].offset = m[i].element.offset();
          m[i].proportions = {
            width: m[i].element[0].offsetWidth,
            height: m[i].element[0].offsetHeight
          };
        }
    },
    drop: function (draggable, event) {
      var dropped = false;
      $.each($.ui.ddmanager.droppables[draggable.options.scope] || [], function () {
        if (!this.options)
          return;
        if (!this.options.disabled && this.visible && $.ui.intersect(draggable, this, this.options.tolerance))
          dropped = this._drop.call(this, event) || dropped;
        if (!this.options.disabled && this.visible && this.accept.call(this.element[0], draggable.currentItem || draggable.element)) {
          this.isout = 1;
          this.isover = 0;
          this._deactivate.call(this, event);
        }
      });
      return dropped;
    },
    dragStart: function (draggable, event) {
      draggable.element.parentsUntil('body').bind('scroll.droppable', function () {
        if (!draggable.options.refreshPositions)
          $.ui.ddmanager.prepareOffsets(draggable, event);
      });
    },
    drag: function (draggable, event) {
      if (draggable.options.refreshPositions)
        $.ui.ddmanager.prepareOffsets(draggable, event);
      $.each($.ui.ddmanager.droppables[draggable.options.scope] || [], function () {
        if (this.options.disabled || this.greedyChild || !this.visible)
          return;
        var intersects = $.ui.intersect(draggable, this, this.options.tolerance);
        var c = !intersects && this.isover == 1 ? 'isout' : intersects && this.isover == 0 ? 'isover' : null;
        if (!c)
          return;
        var parentInstance;
        if (this.options.greedy) {
          var scope = this.options.scope;
          var parent = this.element.parents(':data(droppable)').filter(function () {
              return $.data(this, 'droppable').options.scope === scope;
            });
          if (parent.length) {
            parentInstance = $.data(parent[0], 'droppable');
            parentInstance.greedyChild = c == 'isover' ? 1 : 0;
          }
        }
        if (parentInstance && c == 'isover') {
          parentInstance['isover'] = 0;
          parentInstance['isout'] = 1;
          parentInstance._out.call(parentInstance, event);
        }
        this[c] = 1;
        this[c == 'isout' ? 'isover' : 'isout'] = 0;
        this[c == 'isover' ? '_over' : '_out'].call(this, event);
        if (parentInstance && c == 'isout') {
          parentInstance['isout'] = 0;
          parentInstance['isover'] = 1;
          parentInstance._over.call(parentInstance, event);
        }
      });
    },
    dragStop: function (draggable, event) {
      draggable.element.parentsUntil('body').unbind('scroll.droppable');
      if (!draggable.options.refreshPositions)
        $.ui.ddmanager.prepareOffsets(draggable, event);
    }
  };
}(jQuery));
(function ($, undefined) {
  $.widget('ui.resizable', $.ui.mouse, {
    version: '1.9.2',
    widgetEventPrefix: 'resize',
    options: {
      alsoResize: false,
      animate: false,
      animateDuration: 'slow',
      animateEasing: 'swing',
      aspectRatio: false,
      autoHide: false,
      containment: false,
      ghost: false,
      grid: false,
      handles: 'e,s,se',
      helper: false,
      maxHeight: null,
      maxWidth: null,
      minHeight: 10,
      minWidth: 10,
      zIndex: 1000
    },
    _create: function () {
      var that = this, o = this.options;
      this.element.addClass('ui-resizable');
      $.extend(this, {
        _aspectRatio: !!o.aspectRatio,
        aspectRatio: o.aspectRatio,
        originalElement: this.element,
        _proportionallyResizeElements: [],
        _helper: o.helper || o.ghost || o.animate ? o.helper || 'ui-resizable-helper' : null
      });
      if (this.element[0].nodeName.match(/canvas|textarea|input|select|button|img/i)) {
        this.element.wrap($('<div class="ui-wrapper" style="overflow: hidden;"></div>').css({
          position: this.element.css('position'),
          width: this.element.outerWidth(),
          height: this.element.outerHeight(),
          top: this.element.css('top'),
          left: this.element.css('left')
        }));
        this.element = this.element.parent().data('resizable', this.element.data('resizable'));
        this.elementIsWrapper = true;
        this.element.css({
          marginLeft: this.originalElement.css('marginLeft'),
          marginTop: this.originalElement.css('marginTop'),
          marginRight: this.originalElement.css('marginRight'),
          marginBottom: this.originalElement.css('marginBottom')
        });
        this.originalElement.css({
          marginLeft: 0,
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0
        });
        this.originalResizeStyle = this.originalElement.css('resize');
        this.originalElement.css('resize', 'none');
        this._proportionallyResizeElements.push(this.originalElement.css({
          position: 'static',
          zoom: 1,
          display: 'block'
        }));
        this.originalElement.css({ margin: this.originalElement.css('margin') });
        this._proportionallyResize();
      }
      this.handles = o.handles || (!$('.ui-resizable-handle', this.element).length ? 'e,s,se' : {
        n: '.ui-resizable-n',
        e: '.ui-resizable-e',
        s: '.ui-resizable-s',
        w: '.ui-resizable-w',
        se: '.ui-resizable-se',
        sw: '.ui-resizable-sw',
        ne: '.ui-resizable-ne',
        nw: '.ui-resizable-nw'
      });
      if (this.handles.constructor == String) {
        if (this.handles == 'all')
          this.handles = 'n,e,s,w,se,sw,ne,nw';
        var n = this.handles.split(',');
        this.handles = {};
        for (var i = 0; i < n.length; i++) {
          var handle = $.trim(n[i]), hname = 'ui-resizable-' + handle;
          var axis = $('<div class="ui-resizable-handle ' + hname + '"></div>');
          axis.css({ zIndex: o.zIndex });
          if ('se' == handle) {
            axis.addClass('ui-icon ui-icon-gripsmall-diagonal-se');
          }
          ;
          this.handles[handle] = '.ui-resizable-' + handle;
          this.element.append(axis);
        }
      }
      this._renderAxis = function (target) {
        target = target || this.element;
        for (var i in this.handles) {
          if (this.handles[i].constructor == String)
            this.handles[i] = $(this.handles[i], this.element).show();
          if (this.elementIsWrapper && this.originalElement[0].nodeName.match(/textarea|input|select|button/i)) {
            var axis = $(this.handles[i], this.element), padWrapper = 0;
            padWrapper = /sw|ne|nw|se|n|s/.test(i) ? axis.outerHeight() : axis.outerWidth();
            var padPos = [
                'padding',
                /ne|nw|n/.test(i) ? 'Top' : /se|sw|s/.test(i) ? 'Bottom' : /^e$/.test(i) ? 'Right' : 'Left'
              ].join('');
            target.css(padPos, padWrapper);
            this._proportionallyResize();
          }
          if (!$(this.handles[i]).length)
            continue;
        }
      };
      this._renderAxis(this.element);
      this._handles = $('.ui-resizable-handle', this.element).disableSelection();
      this._handles.mouseover(function () {
        if (!that.resizing) {
          if (this.className)
            var axis = this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i);
          that.axis = axis && axis[1] ? axis[1] : 'se';
        }
      });
      if (o.autoHide) {
        this._handles.hide();
        $(this.element).addClass('ui-resizable-autohide').mouseenter(function () {
          if (o.disabled)
            return;
          $(this).removeClass('ui-resizable-autohide');
          that._handles.show();
        }).mouseleave(function () {
          if (o.disabled)
            return;
          if (!that.resizing) {
            $(this).addClass('ui-resizable-autohide');
            that._handles.hide();
          }
        });
      }
      this._mouseInit();
    },
    _destroy: function () {
      this._mouseDestroy();
      var _destroy = function (exp) {
        $(exp).removeClass('ui-resizable ui-resizable-disabled ui-resizable-resizing').removeData('resizable').removeData('ui-resizable').unbind('.resizable').find('.ui-resizable-handle').remove();
      };
      if (this.elementIsWrapper) {
        _destroy(this.element);
        var wrapper = this.element;
        this.originalElement.css({
          position: wrapper.css('position'),
          width: wrapper.outerWidth(),
          height: wrapper.outerHeight(),
          top: wrapper.css('top'),
          left: wrapper.css('left')
        }).insertAfter(wrapper);
        wrapper.remove();
      }
      this.originalElement.css('resize', this.originalResizeStyle);
      _destroy(this.originalElement);
      return this;
    },
    _mouseCapture: function (event) {
      var handle = false;
      for (var i in this.handles) {
        if ($(this.handles[i])[0] == event.target) {
          handle = true;
        }
      }
      return !this.options.disabled && handle;
    },
    _mouseStart: function (event) {
      var o = this.options, iniPos = this.element.position(), el = this.element;
      this.resizing = true;
      this.documentScroll = {
        top: $(document).scrollTop(),
        left: $(document).scrollLeft()
      };
      if (el.is('.ui-draggable') || /absolute/.test(el.css('position'))) {
        el.css({
          position: 'absolute',
          top: iniPos.top,
          left: iniPos.left
        });
      }
      this._renderProxy();
      var curleft = num(this.helper.css('left')), curtop = num(this.helper.css('top'));
      if (o.containment) {
        curleft += $(o.containment).scrollLeft() || 0;
        curtop += $(o.containment).scrollTop() || 0;
      }
      this.offset = this.helper.offset();
      this.position = {
        left: curleft,
        top: curtop
      };
      this.size = this._helper ? {
        width: el.outerWidth(),
        height: el.outerHeight()
      } : {
        width: el.width(),
        height: el.height()
      };
      this.originalSize = this._helper ? {
        width: el.outerWidth(),
        height: el.outerHeight()
      } : {
        width: el.width(),
        height: el.height()
      };
      this.originalPosition = {
        left: curleft,
        top: curtop
      };
      this.sizeDiff = {
        width: el.outerWidth() - el.width(),
        height: el.outerHeight() - el.height()
      };
      this.originalMousePosition = {
        left: event.pageX,
        top: event.pageY
      };
      this.aspectRatio = typeof o.aspectRatio == 'number' ? o.aspectRatio : this.originalSize.width / this.originalSize.height || 1;
      var cursor = $('.ui-resizable-' + this.axis).css('cursor');
      $('body').css('cursor', cursor == 'auto' ? this.axis + '-resize' : cursor);
      el.addClass('ui-resizable-resizing');
      this._propagate('start', event);
      return true;
    },
    _mouseDrag: function (event) {
      var el = this.helper, o = this.options, props = {}, that = this, smp = this.originalMousePosition, a = this.axis;
      var dx = event.pageX - smp.left || 0, dy = event.pageY - smp.top || 0;
      var trigger = this._change[a];
      if (!trigger)
        return false;
      var data = trigger.apply(this, [
          event,
          dx,
          dy
        ]);
      this._updateVirtualBoundaries(event.shiftKey);
      if (this._aspectRatio || event.shiftKey)
        data = this._updateRatio(data, event);
      data = this._respectSize(data, event);
      this._propagate('resize', event);
      el.css({
        top: this.position.top + 'px',
        left: this.position.left + 'px',
        width: this.size.width + 'px',
        height: this.size.height + 'px'
      });
      if (!this._helper && this._proportionallyResizeElements.length)
        this._proportionallyResize();
      this._updateCache(data);
      this._trigger('resize', event, this.ui());
      return false;
    },
    _mouseStop: function (event) {
      this.resizing = false;
      var o = this.options, that = this;
      if (this._helper) {
        var pr = this._proportionallyResizeElements, ista = pr.length && /textarea/i.test(pr[0].nodeName), soffseth = ista && $.ui.hasScroll(pr[0], 'left') ? 0 : that.sizeDiff.height, soffsetw = ista ? 0 : that.sizeDiff.width;
        var s = {
            width: that.helper.width() - soffsetw,
            height: that.helper.height() - soffseth
          }, left = parseInt(that.element.css('left'), 10) + (that.position.left - that.originalPosition.left) || null, top = parseInt(that.element.css('top'), 10) + (that.position.top - that.originalPosition.top) || null;
        if (!o.animate)
          this.element.css($.extend(s, {
            top: top,
            left: left
          }));
        that.helper.height(that.size.height);
        that.helper.width(that.size.width);
        if (this._helper && !o.animate)
          this._proportionallyResize();
      }
      $('body').css('cursor', 'auto');
      this.element.removeClass('ui-resizable-resizing');
      this._propagate('stop', event);
      if (this._helper)
        this.helper.remove();
      return false;
    },
    _updateVirtualBoundaries: function (forceAspectRatio) {
      var o = this.options, pMinWidth, pMaxWidth, pMinHeight, pMaxHeight, b;
      b = {
        minWidth: isNumber(o.minWidth) ? o.minWidth : 0,
        maxWidth: isNumber(o.maxWidth) ? o.maxWidth : Infinity,
        minHeight: isNumber(o.minHeight) ? o.minHeight : 0,
        maxHeight: isNumber(o.maxHeight) ? o.maxHeight : Infinity
      };
      if (this._aspectRatio || forceAspectRatio) {
        pMinWidth = b.minHeight * this.aspectRatio;
        pMinHeight = b.minWidth / this.aspectRatio;
        pMaxWidth = b.maxHeight * this.aspectRatio;
        pMaxHeight = b.maxWidth / this.aspectRatio;
        if (pMinWidth > b.minWidth)
          b.minWidth = pMinWidth;
        if (pMinHeight > b.minHeight)
          b.minHeight = pMinHeight;
        if (pMaxWidth < b.maxWidth)
          b.maxWidth = pMaxWidth;
        if (pMaxHeight < b.maxHeight)
          b.maxHeight = pMaxHeight;
      }
      this._vBoundaries = b;
    },
    _updateCache: function (data) {
      var o = this.options;
      this.offset = this.helper.offset();
      if (isNumber(data.left))
        this.position.left = data.left;
      if (isNumber(data.top))
        this.position.top = data.top;
      if (isNumber(data.height))
        this.size.height = data.height;
      if (isNumber(data.width))
        this.size.width = data.width;
    },
    _updateRatio: function (data, event) {
      var o = this.options, cpos = this.position, csize = this.size, a = this.axis;
      if (isNumber(data.height))
        data.width = data.height * this.aspectRatio;
      else if (isNumber(data.width))
        data.height = data.width / this.aspectRatio;
      if (a == 'sw') {
        data.left = cpos.left + (csize.width - data.width);
        data.top = null;
      }
      if (a == 'nw') {
        data.top = cpos.top + (csize.height - data.height);
        data.left = cpos.left + (csize.width - data.width);
      }
      return data;
    },
    _respectSize: function (data, event) {
      var el = this.helper, o = this._vBoundaries, pRatio = this._aspectRatio || event.shiftKey, a = this.axis, ismaxw = isNumber(data.width) && o.maxWidth && o.maxWidth < data.width, ismaxh = isNumber(data.height) && o.maxHeight && o.maxHeight < data.height, isminw = isNumber(data.width) && o.minWidth && o.minWidth > data.width, isminh = isNumber(data.height) && o.minHeight && o.minHeight > data.height;
      if (isminw)
        data.width = o.minWidth;
      if (isminh)
        data.height = o.minHeight;
      if (ismaxw)
        data.width = o.maxWidth;
      if (ismaxh)
        data.height = o.maxHeight;
      var dw = this.originalPosition.left + this.originalSize.width, dh = this.position.top + this.size.height;
      var cw = /sw|nw|w/.test(a), ch = /nw|ne|n/.test(a);
      if (isminw && cw)
        data.left = dw - o.minWidth;
      if (ismaxw && cw)
        data.left = dw - o.maxWidth;
      if (isminh && ch)
        data.top = dh - o.minHeight;
      if (ismaxh && ch)
        data.top = dh - o.maxHeight;
      var isNotwh = !data.width && !data.height;
      if (isNotwh && !data.left && data.top)
        data.top = null;
      else if (isNotwh && !data.top && data.left)
        data.left = null;
      return data;
    },
    _proportionallyResize: function () {
      var o = this.options;
      if (!this._proportionallyResizeElements.length)
        return;
      var element = this.helper || this.element;
      for (var i = 0; i < this._proportionallyResizeElements.length; i++) {
        var prel = this._proportionallyResizeElements[i];
        if (!this.borderDif) {
          var b = [
              prel.css('borderTopWidth'),
              prel.css('borderRightWidth'),
              prel.css('borderBottomWidth'),
              prel.css('borderLeftWidth')
            ], p = [
              prel.css('paddingTop'),
              prel.css('paddingRight'),
              prel.css('paddingBottom'),
              prel.css('paddingLeft')
            ];
          this.borderDif = $.map(b, function (v, i) {
            var border = parseInt(v, 10) || 0, padding = parseInt(p[i], 10) || 0;
            return border + padding;
          });
        }
        prel.css({
          height: element.height() - this.borderDif[0] - this.borderDif[2] || 0,
          width: element.width() - this.borderDif[1] - this.borderDif[3] || 0
        });
      }
      ;
    },
    _renderProxy: function () {
      var el = this.element, o = this.options;
      this.elementOffset = el.offset();
      if (this._helper) {
        this.helper = this.helper || $('<div style="overflow:hidden;"></div>');
        var ie6offset = $.ui.ie6 ? 1 : 0, pxyoffset = $.ui.ie6 ? 2 : -1;
        this.helper.addClass(this._helper).css({
          width: this.element.outerWidth() + pxyoffset,
          height: this.element.outerHeight() + pxyoffset,
          position: 'absolute',
          left: this.elementOffset.left - ie6offset + 'px',
          top: this.elementOffset.top - ie6offset + 'px',
          zIndex: ++o.zIndex
        });
        this.helper.appendTo('body').disableSelection();
      } else {
        this.helper = this.element;
      }
    },
    _change: {
      e: function (event, dx, dy) {
        return { width: this.originalSize.width + dx };
      },
      w: function (event, dx, dy) {
        var o = this.options, cs = this.originalSize, sp = this.originalPosition;
        return {
          left: sp.left + dx,
          width: cs.width - dx
        };
      },
      n: function (event, dx, dy) {
        var o = this.options, cs = this.originalSize, sp = this.originalPosition;
        return {
          top: sp.top + dy,
          height: cs.height - dy
        };
      },
      s: function (event, dx, dy) {
        return { height: this.originalSize.height + dy };
      },
      se: function (event, dx, dy) {
        return $.extend(this._change.s.apply(this, arguments), this._change.e.apply(this, [
          event,
          dx,
          dy
        ]));
      },
      sw: function (event, dx, dy) {
        return $.extend(this._change.s.apply(this, arguments), this._change.w.apply(this, [
          event,
          dx,
          dy
        ]));
      },
      ne: function (event, dx, dy) {
        return $.extend(this._change.n.apply(this, arguments), this._change.e.apply(this, [
          event,
          dx,
          dy
        ]));
      },
      nw: function (event, dx, dy) {
        return $.extend(this._change.n.apply(this, arguments), this._change.w.apply(this, [
          event,
          dx,
          dy
        ]));
      }
    },
    _propagate: function (n, event) {
      $.ui.plugin.call(this, n, [
        event,
        this.ui()
      ]);
      n != 'resize' && this._trigger(n, event, this.ui());
    },
    plugins: {},
    ui: function () {
      return {
        originalElement: this.originalElement,
        element: this.element,
        helper: this.helper,
        position: this.position,
        size: this.size,
        originalSize: this.originalSize,
        originalPosition: this.originalPosition
      };
    }
  });
  $.ui.plugin.add('resizable', 'alsoResize', {
    start: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options;
      var _store = function (exp) {
        $(exp).each(function () {
          var el = $(this);
          el.data('resizable-alsoresize', {
            width: parseInt(el.width(), 10),
            height: parseInt(el.height(), 10),
            left: parseInt(el.css('left'), 10),
            top: parseInt(el.css('top'), 10)
          });
        });
      };
      if (typeof o.alsoResize == 'object' && !o.alsoResize.parentNode) {
        if (o.alsoResize.length) {
          o.alsoResize = o.alsoResize[0];
          _store(o.alsoResize);
        } else {
          $.each(o.alsoResize, function (exp) {
            _store(exp);
          });
        }
      } else {
        _store(o.alsoResize);
      }
    },
    resize: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, os = that.originalSize, op = that.originalPosition;
      var delta = {
          height: that.size.height - os.height || 0,
          width: that.size.width - os.width || 0,
          top: that.position.top - op.top || 0,
          left: that.position.left - op.left || 0
        }, _alsoResize = function (exp, c) {
          $(exp).each(function () {
            var el = $(this), start = $(this).data('resizable-alsoresize'), style = {}, css = c && c.length ? c : el.parents(ui.originalElement[0]).length ? [
                'width',
                'height'
              ] : [
                'width',
                'height',
                'top',
                'left'
              ];
            $.each(css, function (i, prop) {
              var sum = (start[prop] || 0) + (delta[prop] || 0);
              if (sum && sum >= 0)
                style[prop] = sum || null;
            });
            el.css(style);
          });
        };
      if (typeof o.alsoResize == 'object' && !o.alsoResize.nodeType) {
        $.each(o.alsoResize, function (exp, c) {
          _alsoResize(exp, c);
        });
      } else {
        _alsoResize(o.alsoResize);
      }
    },
    stop: function (event, ui) {
      $(this).removeData('resizable-alsoresize');
    }
  });
  $.ui.plugin.add('resizable', 'animate', {
    stop: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options;
      var pr = that._proportionallyResizeElements, ista = pr.length && /textarea/i.test(pr[0].nodeName), soffseth = ista && $.ui.hasScroll(pr[0], 'left') ? 0 : that.sizeDiff.height, soffsetw = ista ? 0 : that.sizeDiff.width;
      var style = {
          width: that.size.width - soffsetw,
          height: that.size.height - soffseth
        }, left = parseInt(that.element.css('left'), 10) + (that.position.left - that.originalPosition.left) || null, top = parseInt(that.element.css('top'), 10) + (that.position.top - that.originalPosition.top) || null;
      that.element.animate($.extend(style, top && left ? {
        top: top,
        left: left
      } : {}), {
        duration: o.animateDuration,
        easing: o.animateEasing,
        step: function () {
          var data = {
              width: parseInt(that.element.css('width'), 10),
              height: parseInt(that.element.css('height'), 10),
              top: parseInt(that.element.css('top'), 10),
              left: parseInt(that.element.css('left'), 10)
            };
          if (pr && pr.length)
            $(pr[0]).css({
              width: data.width,
              height: data.height
            });
          that._updateCache(data);
          that._propagate('resize', event);
        }
      });
    }
  });
  $.ui.plugin.add('resizable', 'containment', {
    start: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, el = that.element;
      var oc = o.containment, ce = oc instanceof $ ? oc.get(0) : /parent/.test(oc) ? el.parent().get(0) : oc;
      if (!ce)
        return;
      that.containerElement = $(ce);
      if (/document/.test(oc) || oc == document) {
        that.containerOffset = {
          left: 0,
          top: 0
        };
        that.containerPosition = {
          left: 0,
          top: 0
        };
        that.parentData = {
          element: $(document),
          left: 0,
          top: 0,
          width: $(document).width(),
          height: $(document).height() || document.body.parentNode.scrollHeight
        };
      } else {
        var element = $(ce), p = [];
        $([
          'Top',
          'Right',
          'Left',
          'Bottom'
        ]).each(function (i, name) {
          p[i] = num(element.css('padding' + name));
        });
        that.containerOffset = element.offset();
        that.containerPosition = element.position();
        that.containerSize = {
          height: element.innerHeight() - p[3],
          width: element.innerWidth() - p[1]
        };
        var co = that.containerOffset, ch = that.containerSize.height, cw = that.containerSize.width, width = $.ui.hasScroll(ce, 'left') ? ce.scrollWidth : cw, height = $.ui.hasScroll(ce) ? ce.scrollHeight : ch;
        that.parentData = {
          element: ce,
          left: co.left,
          top: co.top,
          width: width,
          height: height
        };
      }
    },
    resize: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, ps = that.containerSize, co = that.containerOffset, cs = that.size, cp = that.position, pRatio = that._aspectRatio || event.shiftKey, cop = {
          top: 0,
          left: 0
        }, ce = that.containerElement;
      if (ce[0] != document && /static/.test(ce.css('position')))
        cop = co;
      if (cp.left < (that._helper ? co.left : 0)) {
        that.size.width = that.size.width + (that._helper ? that.position.left - co.left : that.position.left - cop.left);
        if (pRatio)
          that.size.height = that.size.width / that.aspectRatio;
        that.position.left = o.helper ? co.left : 0;
      }
      if (cp.top < (that._helper ? co.top : 0)) {
        that.size.height = that.size.height + (that._helper ? that.position.top - co.top : that.position.top);
        if (pRatio)
          that.size.width = that.size.height * that.aspectRatio;
        that.position.top = that._helper ? co.top : 0;
      }
      that.offset.left = that.parentData.left + that.position.left;
      that.offset.top = that.parentData.top + that.position.top;
      var woset = Math.abs((that._helper ? that.offset.left - cop.left : that.offset.left - cop.left) + that.sizeDiff.width), hoset = Math.abs((that._helper ? that.offset.top - cop.top : that.offset.top - co.top) + that.sizeDiff.height);
      var isParent = that.containerElement.get(0) == that.element.parent().get(0), isOffsetRelative = /relative|absolute/.test(that.containerElement.css('position'));
      if (isParent && isOffsetRelative)
        woset -= that.parentData.left;
      if (woset + that.size.width >= that.parentData.width) {
        that.size.width = that.parentData.width - woset;
        if (pRatio)
          that.size.height = that.size.width / that.aspectRatio;
      }
      if (hoset + that.size.height >= that.parentData.height) {
        that.size.height = that.parentData.height - hoset;
        if (pRatio)
          that.size.width = that.size.height * that.aspectRatio;
      }
    },
    stop: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, cp = that.position, co = that.containerOffset, cop = that.containerPosition, ce = that.containerElement;
      var helper = $(that.helper), ho = helper.offset(), w = helper.outerWidth() - that.sizeDiff.width, h = helper.outerHeight() - that.sizeDiff.height;
      if (that._helper && !o.animate && /relative/.test(ce.css('position')))
        $(this).css({
          left: ho.left - cop.left - co.left,
          width: w,
          height: h
        });
      if (that._helper && !o.animate && /static/.test(ce.css('position')))
        $(this).css({
          left: ho.left - cop.left - co.left,
          width: w,
          height: h
        });
    }
  });
  $.ui.plugin.add('resizable', 'ghost', {
    start: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, cs = that.size;
      that.ghost = that.originalElement.clone();
      that.ghost.css({
        opacity: 0.25,
        display: 'block',
        position: 'relative',
        height: cs.height,
        width: cs.width,
        margin: 0,
        left: 0,
        top: 0
      }).addClass('ui-resizable-ghost').addClass(typeof o.ghost == 'string' ? o.ghost : '');
      that.ghost.appendTo(that.helper);
    },
    resize: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options;
      if (that.ghost)
        that.ghost.css({
          position: 'relative',
          height: that.size.height,
          width: that.size.width
        });
    },
    stop: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options;
      if (that.ghost && that.helper)
        that.helper.get(0).removeChild(that.ghost.get(0));
    }
  });
  $.ui.plugin.add('resizable', 'grid', {
    resize: function (event, ui) {
      var that = $(this).data('resizable'), o = that.options, cs = that.size, os = that.originalSize, op = that.originalPosition, a = that.axis, ratio = o._aspectRatio || event.shiftKey;
      o.grid = typeof o.grid == 'number' ? [
        o.grid,
        o.grid
      ] : o.grid;
      var ox = Math.round((cs.width - os.width) / (o.grid[0] || 1)) * (o.grid[0] || 1), oy = Math.round((cs.height - os.height) / (o.grid[1] || 1)) * (o.grid[1] || 1);
      if (/^(se|s|e)$/.test(a)) {
        that.size.width = os.width + ox;
        that.size.height = os.height + oy;
      } else if (/^(ne)$/.test(a)) {
        that.size.width = os.width + ox;
        that.size.height = os.height + oy;
        that.position.top = op.top - oy;
      } else if (/^(sw)$/.test(a)) {
        that.size.width = os.width + ox;
        that.size.height = os.height + oy;
        that.position.left = op.left - ox;
      } else {
        that.size.width = os.width + ox;
        that.size.height = os.height + oy;
        that.position.top = op.top - oy;
        that.position.left = op.left - ox;
      }
    }
  });
  var num = function (v) {
    return parseInt(v, 10) || 0;
  };
  var isNumber = function (value) {
    return !isNaN(parseInt(value, 10));
  };
}(jQuery));
(function ($, undefined) {
  $.widget('ui.selectable', $.ui.mouse, {
    version: '1.9.2',
    options: {
      appendTo: 'body',
      autoRefresh: true,
      distance: 0,
      filter: '*',
      tolerance: 'touch'
    },
    _create: function () {
      var that = this;
      this.element.addClass('ui-selectable');
      this.dragged = false;
      var selectees;
      this.refresh = function () {
        selectees = $(that.options.filter, that.element[0]);
        selectees.addClass('ui-selectee');
        selectees.each(function () {
          var $this = $(this);
          var pos = $this.offset();
          $.data(this, 'selectable-item', {
            element: this,
            $element: $this,
            left: pos.left,
            top: pos.top,
            right: pos.left + $this.outerWidth(),
            bottom: pos.top + $this.outerHeight(),
            startselected: false,
            selected: $this.hasClass('ui-selected'),
            selecting: $this.hasClass('ui-selecting'),
            unselecting: $this.hasClass('ui-unselecting')
          });
        });
      };
      this.refresh();
      this.selectees = selectees.addClass('ui-selectee');
      this._mouseInit();
      this.helper = $('<div class=\'ui-selectable-helper\'></div>');
    },
    _destroy: function () {
      this.selectees.removeClass('ui-selectee').removeData('selectable-item');
      this.element.removeClass('ui-selectable ui-selectable-disabled');
      this._mouseDestroy();
    },
    _mouseStart: function (event) {
      var that = this;
      this.opos = [
        event.pageX,
        event.pageY
      ];
      if (this.options.disabled)
        return;
      var options = this.options;
      this.selectees = $(options.filter, this.element[0]);
      this._trigger('start', event);
      $(options.appendTo).append(this.helper);
      this.helper.css({
        'left': event.clientX,
        'top': event.clientY,
        'width': 0,
        'height': 0
      });
      if (options.autoRefresh) {
        this.refresh();
      }
      this.selectees.filter('.ui-selected').each(function () {
        var selectee = $.data(this, 'selectable-item');
        selectee.startselected = true;
        if (!event.metaKey && !event.ctrlKey) {
          selectee.$element.removeClass('ui-selected');
          selectee.selected = false;
          selectee.$element.addClass('ui-unselecting');
          selectee.unselecting = true;
          that._trigger('unselecting', event, { unselecting: selectee.element });
        }
      });
      $(event.target).parents().andSelf().each(function () {
        var selectee = $.data(this, 'selectable-item');
        if (selectee) {
          var doSelect = !event.metaKey && !event.ctrlKey || !selectee.$element.hasClass('ui-selected');
          selectee.$element.removeClass(doSelect ? 'ui-unselecting' : 'ui-selected').addClass(doSelect ? 'ui-selecting' : 'ui-unselecting');
          selectee.unselecting = !doSelect;
          selectee.selecting = doSelect;
          selectee.selected = doSelect;
          if (doSelect) {
            that._trigger('selecting', event, { selecting: selectee.element });
          } else {
            that._trigger('unselecting', event, { unselecting: selectee.element });
          }
          return false;
        }
      });
    },
    _mouseDrag: function (event) {
      var that = this;
      this.dragged = true;
      if (this.options.disabled)
        return;
      var options = this.options;
      var x1 = this.opos[0], y1 = this.opos[1], x2 = event.pageX, y2 = event.pageY;
      if (x1 > x2) {
        var tmp = x2;
        x2 = x1;
        x1 = tmp;
      }
      if (y1 > y2) {
        var tmp = y2;
        y2 = y1;
        y1 = tmp;
      }
      this.helper.css({
        left: x1,
        top: y1,
        width: x2 - x1,
        height: y2 - y1
      });
      this.selectees.each(function () {
        var selectee = $.data(this, 'selectable-item');
        if (!selectee || selectee.element == that.element[0])
          return;
        var hit = false;
        if (options.tolerance == 'touch') {
          hit = !(selectee.left > x2 || selectee.right < x1 || selectee.top > y2 || selectee.bottom < y1);
        } else if (options.tolerance == 'fit') {
          hit = selectee.left > x1 && selectee.right < x2 && selectee.top > y1 && selectee.bottom < y2;
        }
        if (hit) {
          if (selectee.selected) {
            selectee.$element.removeClass('ui-selected');
            selectee.selected = false;
          }
          if (selectee.unselecting) {
            selectee.$element.removeClass('ui-unselecting');
            selectee.unselecting = false;
          }
          if (!selectee.selecting) {
            selectee.$element.addClass('ui-selecting');
            selectee.selecting = true;
            that._trigger('selecting', event, { selecting: selectee.element });
          }
        } else {
          if (selectee.selecting) {
            if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
              selectee.$element.removeClass('ui-selecting');
              selectee.selecting = false;
              selectee.$element.addClass('ui-selected');
              selectee.selected = true;
            } else {
              selectee.$element.removeClass('ui-selecting');
              selectee.selecting = false;
              if (selectee.startselected) {
                selectee.$element.addClass('ui-unselecting');
                selectee.unselecting = true;
              }
              that._trigger('unselecting', event, { unselecting: selectee.element });
            }
          }
          if (selectee.selected) {
            if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
              selectee.$element.removeClass('ui-selected');
              selectee.selected = false;
              selectee.$element.addClass('ui-unselecting');
              selectee.unselecting = true;
              that._trigger('unselecting', event, { unselecting: selectee.element });
            }
          }
        }
      });
      return false;
    },
    _mouseStop: function (event) {
      var that = this;
      this.dragged = false;
      var options = this.options;
      $('.ui-unselecting', this.element[0]).each(function () {
        var selectee = $.data(this, 'selectable-item');
        selectee.$element.removeClass('ui-unselecting');
        selectee.unselecting = false;
        selectee.startselected = false;
        that._trigger('unselected', event, { unselected: selectee.element });
      });
      $('.ui-selecting', this.element[0]).each(function () {
        var selectee = $.data(this, 'selectable-item');
        selectee.$element.removeClass('ui-selecting').addClass('ui-selected');
        selectee.selecting = false;
        selectee.selected = true;
        selectee.startselected = true;
        that._trigger('selected', event, { selected: selectee.element });
      });
      this._trigger('stop', event);
      this.helper.remove();
      return false;
    }
  });
}(jQuery));
(function ($, undefined) {
  $.widget('ui.sortable', $.ui.mouse, {
    version: '1.9.2',
    widgetEventPrefix: 'sort',
    ready: false,
    options: {
      appendTo: 'parent',
      axis: false,
      connectWith: false,
      containment: false,
      cursor: 'auto',
      cursorAt: false,
      dropOnEmpty: true,
      forcePlaceholderSize: false,
      forceHelperSize: false,
      grid: false,
      handle: false,
      helper: 'original',
      items: '> *',
      opacity: false,
      placeholder: false,
      revert: false,
      scroll: true,
      scrollSensitivity: 20,
      scrollSpeed: 20,
      scope: 'default',
      tolerance: 'intersect',
      zIndex: 1000
    },
    _create: function () {
      var o = this.options;
      this.containerCache = {};
      this.element.addClass('ui-sortable');
      this.refresh();
      this.floating = this.items.length ? o.axis === 'x' || /left|right/.test(this.items[0].item.css('float')) || /inline|table-cell/.test(this.items[0].item.css('display')) : false;
      this.offset = this.element.offset();
      this._mouseInit();
      this.ready = true;
    },
    _destroy: function () {
      this.element.removeClass('ui-sortable ui-sortable-disabled');
      this._mouseDestroy();
      for (var i = this.items.length - 1; i >= 0; i--)
        this.items[i].item.removeData(this.widgetName + '-item');
      return this;
    },
    _setOption: function (key, value) {
      if (key === 'disabled') {
        this.options[key] = value;
        this.widget().toggleClass('ui-sortable-disabled', !!value);
      } else {
        $.Widget.prototype._setOption.apply(this, arguments);
      }
    },
    _mouseCapture: function (event, overrideHandle) {
      var that = this;
      if (this.reverting) {
        return false;
      }
      if (this.options.disabled || this.options.type == 'static')
        return false;
      this._refreshItems(event);
      var currentItem = null, nodes = $(event.target).parents().each(function () {
          if ($.data(this, that.widgetName + '-item') == that) {
            currentItem = $(this);
            return false;
          }
        });
      if ($.data(event.target, that.widgetName + '-item') == that)
        currentItem = $(event.target);
      if (!currentItem)
        return false;
      if (this.options.handle && !overrideHandle) {
        var validHandle = false;
        $(this.options.handle, currentItem).find('*').andSelf().each(function () {
          if (this == event.target)
            validHandle = true;
        });
        if (!validHandle)
          return false;
      }
      this.currentItem = currentItem;
      this._removeCurrentsFromItems();
      return true;
    },
    _mouseStart: function (event, overrideHandle, noActivation) {
      var o = this.options;
      this.currentContainer = this;
      this.refreshPositions();
      this.helper = this._createHelper(event);
      this._cacheHelperProportions();
      this._cacheMargins();
      this.scrollParent = this.helper.scrollParent();
      this.offset = this.currentItem.offset();
      this.offset = {
        top: this.offset.top - this.margins.top,
        left: this.offset.left - this.margins.left
      };
      $.extend(this.offset, {
        click: {
          left: event.pageX - this.offset.left,
          top: event.pageY - this.offset.top
        },
        parent: this._getParentOffset(),
        relative: this._getRelativeOffset()
      });
      this.helper.css('position', 'absolute');
      this.cssPosition = this.helper.css('position');
      this.originalPosition = this._generatePosition(event);
      this.originalPageX = event.pageX;
      this.originalPageY = event.pageY;
      o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt);
      this.domPosition = {
        prev: this.currentItem.prev()[0],
        parent: this.currentItem.parent()[0]
      };
      if (this.helper[0] != this.currentItem[0]) {
        this.currentItem.hide();
      }
      this._createPlaceholder();
      if (o.containment)
        this._setContainment();
      if (o.cursor) {
        if ($('body').css('cursor'))
          this._storedCursor = $('body').css('cursor');
        $('body').css('cursor', o.cursor);
      }
      if (o.opacity) {
        if (this.helper.css('opacity'))
          this._storedOpacity = this.helper.css('opacity');
        this.helper.css('opacity', o.opacity);
      }
      if (o.zIndex) {
        if (this.helper.css('zIndex'))
          this._storedZIndex = this.helper.css('zIndex');
        this.helper.css('zIndex', o.zIndex);
      }
      if (this.scrollParent[0] != document && this.scrollParent[0].tagName != 'HTML')
        this.overflowOffset = this.scrollParent.offset();
      this._trigger('start', event, this._uiHash());
      if (!this._preserveHelperProportions)
        this._cacheHelperProportions();
      if (!noActivation) {
        for (var i = this.containers.length - 1; i >= 0; i--) {
          this.containers[i]._trigger('activate', event, this._uiHash(this));
        }
      }
      if ($.ui.ddmanager)
        $.ui.ddmanager.current = this;
      if ($.ui.ddmanager && !o.dropBehaviour)
        $.ui.ddmanager.prepareOffsets(this, event);
      this.dragging = true;
      this.helper.addClass('ui-sortable-helper');
      this._mouseDrag(event);
      return true;
    },
    _mouseDrag: function (event) {
      this.position = this._generatePosition(event);
      this.positionAbs = this._convertPositionTo('absolute');
      if (!this.lastPositionAbs) {
        this.lastPositionAbs = this.positionAbs;
      }
      if (this.options.scroll) {
        var o = this.options, scrolled = false;
        if (this.scrollParent[0] != document && this.scrollParent[0].tagName != 'HTML') {
          if (this.overflowOffset.top + this.scrollParent[0].offsetHeight - event.pageY < o.scrollSensitivity)
            this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop + o.scrollSpeed;
          else if (event.pageY - this.overflowOffset.top < o.scrollSensitivity)
            this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop - o.scrollSpeed;
          if (this.overflowOffset.left + this.scrollParent[0].offsetWidth - event.pageX < o.scrollSensitivity)
            this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft + o.scrollSpeed;
          else if (event.pageX - this.overflowOffset.left < o.scrollSensitivity)
            this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft - o.scrollSpeed;
        } else {
          if (event.pageY - $(document).scrollTop() < o.scrollSensitivity)
            scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
          else if ($(window).height() - (event.pageY - $(document).scrollTop()) < o.scrollSensitivity)
            scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
          if (event.pageX - $(document).scrollLeft() < o.scrollSensitivity)
            scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed);
          else if ($(window).width() - (event.pageX - $(document).scrollLeft()) < o.scrollSensitivity)
            scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed);
        }
        if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour)
          $.ui.ddmanager.prepareOffsets(this, event);
      }
      this.positionAbs = this._convertPositionTo('absolute');
      if (!this.options.axis || this.options.axis != 'y')
        this.helper[0].style.left = this.position.left + 'px';
      if (!this.options.axis || this.options.axis != 'x')
        this.helper[0].style.top = this.position.top + 'px';
      for (var i = this.items.length - 1; i >= 0; i--) {
        var item = this.items[i], itemElement = item.item[0], intersection = this._intersectsWithPointer(item);
        if (!intersection)
          continue;
        if (item.instance !== this.currentContainer)
          continue;
        if (itemElement != this.currentItem[0] && this.placeholder[intersection == 1 ? 'next' : 'prev']()[0] != itemElement && !$.contains(this.placeholder[0], itemElement) && (this.options.type == 'semi-dynamic' ? !$.contains(this.element[0], itemElement) : true)) {
          this.direction = intersection == 1 ? 'down' : 'up';
          if (this.options.tolerance == 'pointer' || this._intersectsWithSides(item)) {
            this._rearrange(event, item);
          } else {
            break;
          }
          this._trigger('change', event, this._uiHash());
          break;
        }
      }
      this._contactContainers(event);
      if ($.ui.ddmanager)
        $.ui.ddmanager.drag(this, event);
      this._trigger('sort', event, this._uiHash());
      this.lastPositionAbs = this.positionAbs;
      return false;
    },
    _mouseStop: function (event, noPropagation) {
      if (!event)
        return;
      if ($.ui.ddmanager && !this.options.dropBehaviour)
        $.ui.ddmanager.drop(this, event);
      if (this.options.revert) {
        var that = this;
        var cur = this.placeholder.offset();
        this.reverting = true;
        $(this.helper).animate({
          left: cur.left - this.offset.parent.left - this.margins.left + (this.offsetParent[0] == document.body ? 0 : this.offsetParent[0].scrollLeft),
          top: cur.top - this.offset.parent.top - this.margins.top + (this.offsetParent[0] == document.body ? 0 : this.offsetParent[0].scrollTop)
        }, parseInt(this.options.revert, 10) || 500, function () {
          that._clear(event);
        });
      } else {
        this._clear(event, noPropagation);
      }
      return false;
    },
    cancel: function () {
      if (this.dragging) {
        this._mouseUp({ target: null });
        if (this.options.helper == 'original')
          this.currentItem.css(this._storedCSS).removeClass('ui-sortable-helper');
        else
          this.currentItem.show();
        for (var i = this.containers.length - 1; i >= 0; i--) {
          this.containers[i]._trigger('deactivate', null, this._uiHash(this));
          if (this.containers[i].containerCache.over) {
            this.containers[i]._trigger('out', null, this._uiHash(this));
            this.containers[i].containerCache.over = 0;
          }
        }
      }
      if (this.placeholder) {
        if (this.placeholder[0].parentNode)
          this.placeholder[0].parentNode.removeChild(this.placeholder[0]);
        if (this.options.helper != 'original' && this.helper && this.helper[0].parentNode)
          this.helper.remove();
        $.extend(this, {
          helper: null,
          dragging: false,
          reverting: false,
          _noFinalSort: null
        });
        if (this.domPosition.prev) {
          $(this.domPosition.prev).after(this.currentItem);
        } else {
          $(this.domPosition.parent).prepend(this.currentItem);
        }
      }
      return this;
    },
    serialize: function (o) {
      var items = this._getItemsAsjQuery(o && o.connected);
      var str = [];
      o = o || {};
      $(items).each(function () {
        var res = ($(o.item || this).attr(o.attribute || 'id') || '').match(o.expression || /(.+)[-=_](.+)/);
        if (res)
          str.push((o.key || res[1] + '[]') + '=' + (o.key && o.expression ? res[1] : res[2]));
      });
      if (!str.length && o.key) {
        str.push(o.key + '=');
      }
      return str.join('&');
    },
    toArray: function (o) {
      var items = this._getItemsAsjQuery(o && o.connected);
      var ret = [];
      o = o || {};
      items.each(function () {
        ret.push($(o.item || this).attr(o.attribute || 'id') || '');
      });
      return ret;
    },
    _intersectsWith: function (item) {
      var x1 = this.positionAbs.left, x2 = x1 + this.helperProportions.width, y1 = this.positionAbs.top, y2 = y1 + this.helperProportions.height;
      var l = item.left, r = l + item.width, t = item.top, b = t + item.height;
      var dyClick = this.offset.click.top, dxClick = this.offset.click.left;
      var isOverElement = y1 + dyClick > t && y1 + dyClick < b && x1 + dxClick > l && x1 + dxClick < r;
      if (this.options.tolerance == 'pointer' || this.options.forcePointerForContainers || this.options.tolerance != 'pointer' && this.helperProportions[this.floating ? 'width' : 'height'] > item[this.floating ? 'width' : 'height']) {
        return isOverElement;
      } else {
        return l < x1 + this.helperProportions.width / 2 && x2 - this.helperProportions.width / 2 < r && t < y1 + this.helperProportions.height / 2 && y2 - this.helperProportions.height / 2 < b;
      }
    },
    _intersectsWithPointer: function (item) {
      var isOverElementHeight = this.options.axis === 'x' || $.ui.isOverAxis(this.positionAbs.top + this.offset.click.top, item.top, item.height), isOverElementWidth = this.options.axis === 'y' || $.ui.isOverAxis(this.positionAbs.left + this.offset.click.left, item.left, item.width), isOverElement = isOverElementHeight && isOverElementWidth, verticalDirection = this._getDragVerticalDirection(), horizontalDirection = this._getDragHorizontalDirection();
      if (!isOverElement)
        return false;
      return this.floating ? horizontalDirection && horizontalDirection == 'right' || verticalDirection == 'down' ? 2 : 1 : verticalDirection && (verticalDirection == 'down' ? 2 : 1);
    },
    _intersectsWithSides: function (item) {
      var isOverBottomHalf = $.ui.isOverAxis(this.positionAbs.top + this.offset.click.top, item.top + item.height / 2, item.height), isOverRightHalf = $.ui.isOverAxis(this.positionAbs.left + this.offset.click.left, item.left + item.width / 2, item.width), verticalDirection = this._getDragVerticalDirection(), horizontalDirection = this._getDragHorizontalDirection();
      if (this.floating && horizontalDirection) {
        return horizontalDirection == 'right' && isOverRightHalf || horizontalDirection == 'left' && !isOverRightHalf;
      } else {
        return verticalDirection && (verticalDirection == 'down' && isOverBottomHalf || verticalDirection == 'up' && !isOverBottomHalf);
      }
    },
    _getDragVerticalDirection: function () {
      var delta = this.positionAbs.top - this.lastPositionAbs.top;
      return delta != 0 && (delta > 0 ? 'down' : 'up');
    },
    _getDragHorizontalDirection: function () {
      var delta = this.positionAbs.left - this.lastPositionAbs.left;
      return delta != 0 && (delta > 0 ? 'right' : 'left');
    },
    refresh: function (event) {
      this._refreshItems(event);
      this.refreshPositions();
      return this;
    },
    _connectWith: function () {
      var options = this.options;
      return options.connectWith.constructor == String ? [options.connectWith] : options.connectWith;
    },
    _getItemsAsjQuery: function (connected) {
      var items = [];
      var queries = [];
      var connectWith = this._connectWith();
      if (connectWith && connected) {
        for (var i = connectWith.length - 1; i >= 0; i--) {
          var cur = $(connectWith[i]);
          for (var j = cur.length - 1; j >= 0; j--) {
            var inst = $.data(cur[j], this.widgetName);
            if (inst && inst != this && !inst.options.disabled) {
              queries.push([
                $.isFunction(inst.options.items) ? inst.options.items.call(inst.element) : $(inst.options.items, inst.element).not('.ui-sortable-helper').not('.ui-sortable-placeholder'),
                inst
              ]);
            }
          }
          ;
        }
        ;
      }
      queries.push([
        $.isFunction(this.options.items) ? this.options.items.call(this.element, null, {
          options: this.options,
          item: this.currentItem
        }) : $(this.options.items, this.element).not('.ui-sortable-helper').not('.ui-sortable-placeholder'),
        this
      ]);
      for (var i = queries.length - 1; i >= 0; i--) {
        queries[i][0].each(function () {
          items.push(this);
        });
      }
      ;
      return $(items);
    },
    _removeCurrentsFromItems: function () {
      var list = this.currentItem.find(':data(' + this.widgetName + '-item)');
      this.items = $.grep(this.items, function (item) {
        for (var j = 0; j < list.length; j++) {
          if (list[j] == item.item[0])
            return false;
        }
        ;
        return true;
      });
    },
    _refreshItems: function (event) {
      this.items = [];
      this.containers = [this];
      var items = this.items;
      var queries = [[
            $.isFunction(this.options.items) ? this.options.items.call(this.element[0], event, { item: this.currentItem }) : $(this.options.items, this.element),
            this
          ]];
      var connectWith = this._connectWith();
      if (connectWith && this.ready) {
        for (var i = connectWith.length - 1; i >= 0; i--) {
          var cur = $(connectWith[i]);
          for (var j = cur.length - 1; j >= 0; j--) {
            var inst = $.data(cur[j], this.widgetName);
            if (inst && inst != this && !inst.options.disabled) {
              queries.push([
                $.isFunction(inst.options.items) ? inst.options.items.call(inst.element[0], event, { item: this.currentItem }) : $(inst.options.items, inst.element),
                inst
              ]);
              this.containers.push(inst);
            }
          }
          ;
        }
        ;
      }
      for (var i = queries.length - 1; i >= 0; i--) {
        var targetData = queries[i][1];
        var _queries = queries[i][0];
        for (var j = 0, queriesLength = _queries.length; j < queriesLength; j++) {
          var item = $(_queries[j]);
          item.data(this.widgetName + '-item', targetData);
          items.push({
            item: item,
            instance: targetData,
            width: 0,
            height: 0,
            left: 0,
            top: 0
          });
        }
        ;
      }
      ;
    },
    refreshPositions: function (fast) {
      if (this.offsetParent && this.helper) {
        this.offset.parent = this._getParentOffset();
      }
      for (var i = this.items.length - 1; i >= 0; i--) {
        var item = this.items[i];
        if (item.instance != this.currentContainer && this.currentContainer && item.item[0] != this.currentItem[0])
          continue;
        var t = this.options.toleranceElement ? $(this.options.toleranceElement, item.item) : item.item;
        if (!fast) {
          item.width = t.outerWidth();
          item.height = t.outerHeight();
        }
        var p = t.offset();
        item.left = p.left;
        item.top = p.top;
      }
      ;
      if (this.options.custom && this.options.custom.refreshContainers) {
        this.options.custom.refreshContainers.call(this);
      } else {
        for (var i = this.containers.length - 1; i >= 0; i--) {
          var p = this.containers[i].element.offset();
          this.containers[i].containerCache.left = p.left;
          this.containers[i].containerCache.top = p.top;
          this.containers[i].containerCache.width = this.containers[i].element.outerWidth();
          this.containers[i].containerCache.height = this.containers[i].element.outerHeight();
        }
        ;
      }
      return this;
    },
    _createPlaceholder: function (that) {
      that = that || this;
      var o = that.options;
      if (!o.placeholder || o.placeholder.constructor == String) {
        var className = o.placeholder;
        o.placeholder = {
          element: function () {
            var el = $(document.createElement(that.currentItem[0].nodeName)).addClass(className || that.currentItem[0].className + ' ui-sortable-placeholder').removeClass('ui-sortable-helper')[0];
            if (!className)
              el.style.visibility = 'hidden';
            return el;
          },
          update: function (container, p) {
            if (className && !o.forcePlaceholderSize)
              return;
            if (!p.height()) {
              p.height(that.currentItem.innerHeight() - parseInt(that.currentItem.css('paddingTop') || 0, 10) - parseInt(that.currentItem.css('paddingBottom') || 0, 10));
            }
            ;
            if (!p.width()) {
              p.width(that.currentItem.innerWidth() - parseInt(that.currentItem.css('paddingLeft') || 0, 10) - parseInt(that.currentItem.css('paddingRight') || 0, 10));
            }
            ;
          }
        };
      }
      that.placeholder = $(o.placeholder.element.call(that.element, that.currentItem));
      that.currentItem.after(that.placeholder);
      o.placeholder.update(that, that.placeholder);
    },
    _contactContainers: function (event) {
      var innermostContainer = null, innermostIndex = null;
      for (var i = this.containers.length - 1; i >= 0; i--) {
        if ($.contains(this.currentItem[0], this.containers[i].element[0]))
          continue;
        if (this._intersectsWith(this.containers[i].containerCache)) {
          if (innermostContainer && $.contains(this.containers[i].element[0], innermostContainer.element[0]))
            continue;
          innermostContainer = this.containers[i];
          innermostIndex = i;
        } else {
          if (this.containers[i].containerCache.over) {
            this.containers[i]._trigger('out', event, this._uiHash(this));
            this.containers[i].containerCache.over = 0;
          }
        }
      }
      if (!innermostContainer)
        return;
      if (this.containers.length === 1) {
        this.containers[innermostIndex]._trigger('over', event, this._uiHash(this));
        this.containers[innermostIndex].containerCache.over = 1;
      } else {
        var dist = 10000;
        var itemWithLeastDistance = null;
        var posProperty = this.containers[innermostIndex].floating ? 'left' : 'top';
        var sizeProperty = this.containers[innermostIndex].floating ? 'width' : 'height';
        var base = this.positionAbs[posProperty] + this.offset.click[posProperty];
        for (var j = this.items.length - 1; j >= 0; j--) {
          if (!$.contains(this.containers[innermostIndex].element[0], this.items[j].item[0]))
            continue;
          if (this.items[j].item[0] == this.currentItem[0])
            continue;
          var cur = this.items[j].item.offset()[posProperty];
          var nearBottom = false;
          if (Math.abs(cur - base) > Math.abs(cur + this.items[j][sizeProperty] - base)) {
            nearBottom = true;
            cur += this.items[j][sizeProperty];
          }
          if (Math.abs(cur - base) < dist) {
            dist = Math.abs(cur - base);
            itemWithLeastDistance = this.items[j];
            this.direction = nearBottom ? 'up' : 'down';
          }
        }
        if (!itemWithLeastDistance && !this.options.dropOnEmpty)
          return;
        this.currentContainer = this.containers[innermostIndex];
        itemWithLeastDistance ? this._rearrange(event, itemWithLeastDistance, null, true) : this._rearrange(event, null, this.containers[innermostIndex].element, true);
        this._trigger('change', event, this._uiHash());
        this.containers[innermostIndex]._trigger('change', event, this._uiHash(this));
        this.options.placeholder.update(this.currentContainer, this.placeholder);
        this.containers[innermostIndex]._trigger('over', event, this._uiHash(this));
        this.containers[innermostIndex].containerCache.over = 1;
      }
    },
    _createHelper: function (event) {
      var o = this.options;
      var helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [
          event,
          this.currentItem
        ])) : o.helper == 'clone' ? this.currentItem.clone() : this.currentItem;
      if (!helper.parents('body').length)
        $(o.appendTo != 'parent' ? o.appendTo : this.currentItem[0].parentNode)[0].appendChild(helper[0]);
      if (helper[0] == this.currentItem[0])
        this._storedCSS = {
          width: this.currentItem[0].style.width,
          height: this.currentItem[0].style.height,
          position: this.currentItem.css('position'),
          top: this.currentItem.css('top'),
          left: this.currentItem.css('left')
        };
      if (helper[0].style.width == '' || o.forceHelperSize)
        helper.width(this.currentItem.width());
      if (helper[0].style.height == '' || o.forceHelperSize)
        helper.height(this.currentItem.height());
      return helper;
    },
    _adjustOffsetFromHelper: function (obj) {
      if (typeof obj == 'string') {
        obj = obj.split(' ');
      }
      if ($.isArray(obj)) {
        obj = {
          left: +obj[0],
          top: +obj[1] || 0
        };
      }
      if ('left' in obj) {
        this.offset.click.left = obj.left + this.margins.left;
      }
      if ('right' in obj) {
        this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
      }
      if ('top' in obj) {
        this.offset.click.top = obj.top + this.margins.top;
      }
      if ('bottom' in obj) {
        this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
      }
    },
    _getParentOffset: function () {
      this.offsetParent = this.helper.offsetParent();
      var po = this.offsetParent.offset();
      if (this.cssPosition == 'absolute' && this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
        po.left += this.scrollParent.scrollLeft();
        po.top += this.scrollParent.scrollTop();
      }
      if (this.offsetParent[0] == document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == 'html' && $.ui.ie)
        po = {
          top: 0,
          left: 0
        };
      return {
        top: po.top + (parseInt(this.offsetParent.css('borderTopWidth'), 10) || 0),
        left: po.left + (parseInt(this.offsetParent.css('borderLeftWidth'), 10) || 0)
      };
    },
    _getRelativeOffset: function () {
      if (this.cssPosition == 'relative') {
        var p = this.currentItem.position();
        return {
          top: p.top - (parseInt(this.helper.css('top'), 10) || 0) + this.scrollParent.scrollTop(),
          left: p.left - (parseInt(this.helper.css('left'), 10) || 0) + this.scrollParent.scrollLeft()
        };
      } else {
        return {
          top: 0,
          left: 0
        };
      }
    },
    _cacheMargins: function () {
      this.margins = {
        left: parseInt(this.currentItem.css('marginLeft'), 10) || 0,
        top: parseInt(this.currentItem.css('marginTop'), 10) || 0
      };
    },
    _cacheHelperProportions: function () {
      this.helperProportions = {
        width: this.helper.outerWidth(),
        height: this.helper.outerHeight()
      };
    },
    _setContainment: function () {
      var o = this.options;
      if (o.containment == 'parent')
        o.containment = this.helper[0].parentNode;
      if (o.containment == 'document' || o.containment == 'window')
        this.containment = [
          0 - this.offset.relative.left - this.offset.parent.left,
          0 - this.offset.relative.top - this.offset.parent.top,
          $(o.containment == 'document' ? document : window).width() - this.helperProportions.width - this.margins.left,
          ($(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
        ];
      if (!/^(document|window|parent)$/.test(o.containment)) {
        var ce = $(o.containment)[0];
        var co = $(o.containment).offset();
        var over = $(ce).css('overflow') != 'hidden';
        this.containment = [
          co.left + (parseInt($(ce).css('borderLeftWidth'), 10) || 0) + (parseInt($(ce).css('paddingLeft'), 10) || 0) - this.margins.left,
          co.top + (parseInt($(ce).css('borderTopWidth'), 10) || 0) + (parseInt($(ce).css('paddingTop'), 10) || 0) - this.margins.top,
          co.left + (over ? Math.max(ce.scrollWidth, ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css('borderLeftWidth'), 10) || 0) - (parseInt($(ce).css('paddingRight'), 10) || 0) - this.helperProportions.width - this.margins.left,
          co.top + (over ? Math.max(ce.scrollHeight, ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css('borderTopWidth'), 10) || 0) - (parseInt($(ce).css('paddingBottom'), 10) || 0) - this.helperProportions.height - this.margins.top
        ];
      }
    },
    _convertPositionTo: function (d, pos) {
      if (!pos)
        pos = this.position;
      var mod = d == 'absolute' ? 1 : -1;
      var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
      return {
        top: pos.top + this.offset.relative.top * mod + this.offset.parent.top * mod - (this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()) * mod,
        left: pos.left + this.offset.relative.left * mod + this.offset.parent.left * mod - (this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod
      };
    },
    _generatePosition: function (event) {
      var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
      if (this.cssPosition == 'relative' && !(this.scrollParent[0] != document && this.scrollParent[0] != this.offsetParent[0])) {
        this.offset.relative = this._getRelativeOffset();
      }
      var pageX = event.pageX;
      var pageY = event.pageY;
      if (this.originalPosition) {
        if (this.containment) {
          if (event.pageX - this.offset.click.left < this.containment[0])
            pageX = this.containment[0] + this.offset.click.left;
          if (event.pageY - this.offset.click.top < this.containment[1])
            pageY = this.containment[1] + this.offset.click.top;
          if (event.pageX - this.offset.click.left > this.containment[2])
            pageX = this.containment[2] + this.offset.click.left;
          if (event.pageY - this.offset.click.top > this.containment[3])
            pageY = this.containment[3] + this.offset.click.top;
        }
        if (o.grid) {
          var top = this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1];
          pageY = this.containment ? !(top - this.offset.click.top < this.containment[1] || top - this.offset.click.top > this.containment[3]) ? top : !(top - this.offset.click.top < this.containment[1]) ? top - o.grid[1] : top + o.grid[1] : top;
          var left = this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0];
          pageX = this.containment ? !(left - this.offset.click.left < this.containment[0] || left - this.offset.click.left > this.containment[2]) ? left : !(left - this.offset.click.left < this.containment[0]) ? left - o.grid[0] : left + o.grid[0] : left;
        }
      }
      return {
        top: pageY - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + (this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()),
        left: pageX - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + (this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft())
      };
    },
    _rearrange: function (event, i, a, hardRefresh) {
      a ? a[0].appendChild(this.placeholder[0]) : i.item[0].parentNode.insertBefore(this.placeholder[0], this.direction == 'down' ? i.item[0] : i.item[0].nextSibling);
      this.counter = this.counter ? ++this.counter : 1;
      var counter = this.counter;
      this._delay(function () {
        if (counter == this.counter)
          this.refreshPositions(!hardRefresh);
      });
    },
    _clear: function (event, noPropagation) {
      this.reverting = false;
      var delayedTriggers = [];
      if (!this._noFinalSort && this.currentItem.parent().length)
        this.placeholder.before(this.currentItem);
      this._noFinalSort = null;
      if (this.helper[0] == this.currentItem[0]) {
        for (var i in this._storedCSS) {
          if (this._storedCSS[i] == 'auto' || this._storedCSS[i] == 'static')
            this._storedCSS[i] = '';
        }
        this.currentItem.css(this._storedCSS).removeClass('ui-sortable-helper');
      } else {
        this.currentItem.show();
      }
      if (this.fromOutside && !noPropagation)
        delayedTriggers.push(function (event) {
          this._trigger('receive', event, this._uiHash(this.fromOutside));
        });
      if ((this.fromOutside || this.domPosition.prev != this.currentItem.prev().not('.ui-sortable-helper')[0] || this.domPosition.parent != this.currentItem.parent()[0]) && !noPropagation)
        delayedTriggers.push(function (event) {
          this._trigger('update', event, this._uiHash());
        });
      if (this !== this.currentContainer) {
        if (!noPropagation) {
          delayedTriggers.push(function (event) {
            this._trigger('remove', event, this._uiHash());
          });
          delayedTriggers.push(function (c) {
            return function (event) {
              c._trigger('receive', event, this._uiHash(this));
            };
          }.call(this, this.currentContainer));
          delayedTriggers.push(function (c) {
            return function (event) {
              c._trigger('update', event, this._uiHash(this));
            };
          }.call(this, this.currentContainer));
        }
      }
      for (var i = this.containers.length - 1; i >= 0; i--) {
        if (!noPropagation)
          delayedTriggers.push(function (c) {
            return function (event) {
              c._trigger('deactivate', event, this._uiHash(this));
            };
          }.call(this, this.containers[i]));
        if (this.containers[i].containerCache.over) {
          delayedTriggers.push(function (c) {
            return function (event) {
              c._trigger('out', event, this._uiHash(this));
            };
          }.call(this, this.containers[i]));
          this.containers[i].containerCache.over = 0;
        }
      }
      if (this._storedCursor)
        $('body').css('cursor', this._storedCursor);
      if (this._storedOpacity)
        this.helper.css('opacity', this._storedOpacity);
      if (this._storedZIndex)
        this.helper.css('zIndex', this._storedZIndex == 'auto' ? '' : this._storedZIndex);
      this.dragging = false;
      if (this.cancelHelperRemoval) {
        if (!noPropagation) {
          this._trigger('beforeStop', event, this._uiHash());
          for (var i = 0; i < delayedTriggers.length; i++) {
            delayedTriggers[i].call(this, event);
          }
          ;
          this._trigger('stop', event, this._uiHash());
        }
        this.fromOutside = false;
        return false;
      }
      if (!noPropagation)
        this._trigger('beforeStop', event, this._uiHash());
      this.placeholder[0].parentNode.removeChild(this.placeholder[0]);
      if (this.helper[0] != this.currentItem[0])
        this.helper.remove();
      this.helper = null;
      if (!noPropagation) {
        for (var i = 0; i < delayedTriggers.length; i++) {
          delayedTriggers[i].call(this, event);
        }
        ;
        this._trigger('stop', event, this._uiHash());
      }
      this.fromOutside = false;
      return true;
    },
    _trigger: function () {
      if ($.Widget.prototype._trigger.apply(this, arguments) === false) {
        this.cancel();
      }
    },
    _uiHash: function (_inst) {
      var inst = _inst || this;
      return {
        helper: inst.helper,
        placeholder: inst.placeholder || $([]),
        position: inst.position,
        originalPosition: inst.originalPosition,
        offset: inst.positionAbs,
        item: inst.currentItem,
        sender: _inst ? _inst.element : null
      };
    }
  });
}(jQuery));
;
jQuery.effects || function ($, undefined) {
  var backCompat = $.uiBackCompat !== false, dataSpace = 'ui-effects-';
  $.effects = { effect: {} };
  (function (jQuery, undefined) {
    var stepHooks = 'backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor'.split(' '), rplusequals = /^([\-+])=\s*(\d+\.?\d*)/, stringParsers = [
        {
          re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
          parse: function (execResult) {
            return [
              execResult[1],
              execResult[2],
              execResult[3],
              execResult[4]
            ];
          }
        },
        {
          re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
          parse: function (execResult) {
            return [
              execResult[1] * 2.55,
              execResult[2] * 2.55,
              execResult[3] * 2.55,
              execResult[4]
            ];
          }
        },
        {
          re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
          parse: function (execResult) {
            return [
              parseInt(execResult[1], 16),
              parseInt(execResult[2], 16),
              parseInt(execResult[3], 16)
            ];
          }
        },
        {
          re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
          parse: function (execResult) {
            return [
              parseInt(execResult[1] + execResult[1], 16),
              parseInt(execResult[2] + execResult[2], 16),
              parseInt(execResult[3] + execResult[3], 16)
            ];
          }
        },
        {
          re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
          space: 'hsla',
          parse: function (execResult) {
            return [
              execResult[1],
              execResult[2] / 100,
              execResult[3] / 100,
              execResult[4]
            ];
          }
        }
      ], color = jQuery.Color = function (color, green, blue, alpha) {
        return new jQuery.Color.fn.parse(color, green, blue, alpha);
      }, spaces = {
        rgba: {
          props: {
            red: {
              idx: 0,
              type: 'byte'
            },
            green: {
              idx: 1,
              type: 'byte'
            },
            blue: {
              idx: 2,
              type: 'byte'
            }
          }
        },
        hsla: {
          props: {
            hue: {
              idx: 0,
              type: 'degrees'
            },
            saturation: {
              idx: 1,
              type: 'percent'
            },
            lightness: {
              idx: 2,
              type: 'percent'
            }
          }
        }
      }, propTypes = {
        'byte': {
          floor: true,
          max: 255
        },
        'percent': { max: 1 },
        'degrees': {
          mod: 360,
          floor: true
        }
      }, support = color.support = {}, supportElem = jQuery('<p>')[0], colors, each = jQuery.each;
    supportElem.style.cssText = 'background-color:rgba(1,1,1,.5)';
    support.rgba = supportElem.style.backgroundColor.indexOf('rgba') > -1;
    each(spaces, function (spaceName, space) {
      space.cache = '_' + spaceName;
      space.props.alpha = {
        idx: 3,
        type: 'percent',
        def: 1
      };
    });
    function clamp(value, prop, allowEmpty) {
      var type = propTypes[prop.type] || {};
      if (value == null) {
        return allowEmpty || !prop.def ? null : prop.def;
      }
      value = type.floor ? ~~value : parseFloat(value);
      if (isNaN(value)) {
        return prop.def;
      }
      if (type.mod) {
        return (value + type.mod) % type.mod;
      }
      return 0 > value ? 0 : type.max < value ? type.max : value;
    }
    function stringParse(string) {
      var inst = color(), rgba = inst._rgba = [];
      string = string.toLowerCase();
      each(stringParsers, function (i, parser) {
        var parsed, match = parser.re.exec(string), values = match && parser.parse(match), spaceName = parser.space || 'rgba';
        if (values) {
          parsed = inst[spaceName](values);
          inst[spaces[spaceName].cache] = parsed[spaces[spaceName].cache];
          rgba = inst._rgba = parsed._rgba;
          return false;
        }
      });
      if (rgba.length) {
        if (rgba.join() === '0,0,0,0') {
          jQuery.extend(rgba, colors.transparent);
        }
        return inst;
      }
      return colors[string];
    }
    color.fn = jQuery.extend(color.prototype, {
      parse: function (red, green, blue, alpha) {
        if (red === undefined) {
          this._rgba = [
            null,
            null,
            null,
            null
          ];
          return this;
        }
        if (red.jquery || red.nodeType) {
          red = jQuery(red).css(green);
          green = undefined;
        }
        var inst = this, type = jQuery.type(red), rgba = this._rgba = [];
        if (green !== undefined) {
          red = [
            red,
            green,
            blue,
            alpha
          ];
          type = 'array';
        }
        if (type === 'string') {
          return this.parse(stringParse(red) || colors._default);
        }
        if (type === 'array') {
          each(spaces.rgba.props, function (key, prop) {
            rgba[prop.idx] = clamp(red[prop.idx], prop);
          });
          return this;
        }
        if (type === 'object') {
          if (red instanceof color) {
            each(spaces, function (spaceName, space) {
              if (red[space.cache]) {
                inst[space.cache] = red[space.cache].slice();
              }
            });
          } else {
            each(spaces, function (spaceName, space) {
              var cache = space.cache;
              each(space.props, function (key, prop) {
                if (!inst[cache] && space.to) {
                  if (key === 'alpha' || red[key] == null) {
                    return;
                  }
                  inst[cache] = space.to(inst._rgba);
                }
                inst[cache][prop.idx] = clamp(red[key], prop, true);
              });
              if (inst[cache] && $.inArray(null, inst[cache].slice(0, 3)) < 0) {
                inst[cache][3] = 1;
                if (space.from) {
                  inst._rgba = space.from(inst[cache]);
                }
              }
            });
          }
          return this;
        }
      },
      is: function (compare) {
        var is = color(compare), same = true, inst = this;
        each(spaces, function (_, space) {
          var localCache, isCache = is[space.cache];
          if (isCache) {
            localCache = inst[space.cache] || space.to && space.to(inst._rgba) || [];
            each(space.props, function (_, prop) {
              if (isCache[prop.idx] != null) {
                same = isCache[prop.idx] === localCache[prop.idx];
                return same;
              }
            });
          }
          return same;
        });
        return same;
      },
      _space: function () {
        var used = [], inst = this;
        each(spaces, function (spaceName, space) {
          if (inst[space.cache]) {
            used.push(spaceName);
          }
        });
        return used.pop();
      },
      transition: function (other, distance) {
        var end = color(other), spaceName = end._space(), space = spaces[spaceName], startColor = this.alpha() === 0 ? color('transparent') : this, start = startColor[space.cache] || space.to(startColor._rgba), result = start.slice();
        end = end[space.cache];
        each(space.props, function (key, prop) {
          var index = prop.idx, startValue = start[index], endValue = end[index], type = propTypes[prop.type] || {};
          if (endValue === null) {
            return;
          }
          if (startValue === null) {
            result[index] = endValue;
          } else {
            if (type.mod) {
              if (endValue - startValue > type.mod / 2) {
                startValue += type.mod;
              } else if (startValue - endValue > type.mod / 2) {
                startValue -= type.mod;
              }
            }
            result[index] = clamp((endValue - startValue) * distance + startValue, prop);
          }
        });
        return this[spaceName](result);
      },
      blend: function (opaque) {
        if (this._rgba[3] === 1) {
          return this;
        }
        var rgb = this._rgba.slice(), a = rgb.pop(), blend = color(opaque)._rgba;
        return color(jQuery.map(rgb, function (v, i) {
          return (1 - a) * blend[i] + a * v;
        }));
      },
      toRgbaString: function () {
        var prefix = 'rgba(', rgba = jQuery.map(this._rgba, function (v, i) {
            return v == null ? i > 2 ? 1 : 0 : v;
          });
        if (rgba[3] === 1) {
          rgba.pop();
          prefix = 'rgb(';
        }
        return prefix + rgba.join() + ')';
      },
      toHslaString: function () {
        var prefix = 'hsla(', hsla = jQuery.map(this.hsla(), function (v, i) {
            if (v == null) {
              v = i > 2 ? 1 : 0;
            }
            if (i && i < 3) {
              v = Math.round(v * 100) + '%';
            }
            return v;
          });
        if (hsla[3] === 1) {
          hsla.pop();
          prefix = 'hsl(';
        }
        return prefix + hsla.join() + ')';
      },
      toHexString: function (includeAlpha) {
        var rgba = this._rgba.slice(), alpha = rgba.pop();
        if (includeAlpha) {
          rgba.push(~~(alpha * 255));
        }
        return '#' + jQuery.map(rgba, function (v) {
          v = (v || 0).toString(16);
          return v.length === 1 ? '0' + v : v;
        }).join('');
      },
      toString: function () {
        return this._rgba[3] === 0 ? 'transparent' : this.toRgbaString();
      }
    });
    color.fn.parse.prototype = color.fn;
    function hue2rgb(p, q, h) {
      h = (h + 1) % 1;
      if (h * 6 < 1) {
        return p + (q - p) * h * 6;
      }
      if (h * 2 < 1) {
        return q;
      }
      if (h * 3 < 2) {
        return p + (q - p) * (2 / 3 - h) * 6;
      }
      return p;
    }
    spaces.hsla.to = function (rgba) {
      if (rgba[0] == null || rgba[1] == null || rgba[2] == null) {
        return [
          null,
          null,
          null,
          rgba[3]
        ];
      }
      var r = rgba[0] / 255, g = rgba[1] / 255, b = rgba[2] / 255, a = rgba[3], max = Math.max(r, g, b), min = Math.min(r, g, b), diff = max - min, add = max + min, l = add * 0.5, h, s;
      if (min === max) {
        h = 0;
      } else if (r === max) {
        h = 60 * (g - b) / diff + 360;
      } else if (g === max) {
        h = 60 * (b - r) / diff + 120;
      } else {
        h = 60 * (r - g) / diff + 240;
      }
      if (l === 0 || l === 1) {
        s = l;
      } else if (l <= 0.5) {
        s = diff / add;
      } else {
        s = diff / (2 - add);
      }
      return [
        Math.round(h) % 360,
        s,
        l,
        a == null ? 1 : a
      ];
    };
    spaces.hsla.from = function (hsla) {
      if (hsla[0] == null || hsla[1] == null || hsla[2] == null) {
        return [
          null,
          null,
          null,
          hsla[3]
        ];
      }
      var h = hsla[0] / 360, s = hsla[1], l = hsla[2], a = hsla[3], q = l <= 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      return [
        Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
        a
      ];
    };
    each(spaces, function (spaceName, space) {
      var props = space.props, cache = space.cache, to = space.to, from = space.from;
      color.fn[spaceName] = function (value) {
        if (to && !this[cache]) {
          this[cache] = to(this._rgba);
        }
        if (value === undefined) {
          return this[cache].slice();
        }
        var ret, type = jQuery.type(value), arr = type === 'array' || type === 'object' ? value : arguments, local = this[cache].slice();
        each(props, function (key, prop) {
          var val = arr[type === 'object' ? key : prop.idx];
          if (val == null) {
            val = local[prop.idx];
          }
          local[prop.idx] = clamp(val, prop);
        });
        if (from) {
          ret = color(from(local));
          ret[cache] = local;
          return ret;
        } else {
          return color(local);
        }
      };
      each(props, function (key, prop) {
        if (color.fn[key]) {
          return;
        }
        color.fn[key] = function (value) {
          var vtype = jQuery.type(value), fn = key === 'alpha' ? this._hsla ? 'hsla' : 'rgba' : spaceName, local = this[fn](), cur = local[prop.idx], match;
          if (vtype === 'undefined') {
            return cur;
          }
          if (vtype === 'function') {
            value = value.call(this, cur);
            vtype = jQuery.type(value);
          }
          if (value == null && prop.empty) {
            return this;
          }
          if (vtype === 'string') {
            match = rplusequals.exec(value);
            if (match) {
              value = cur + parseFloat(match[2]) * (match[1] === '+' ? 1 : -1);
            }
          }
          local[prop.idx] = value;
          return this[fn](local);
        };
      });
    });
    each(stepHooks, function (i, hook) {
      jQuery.cssHooks[hook] = {
        set: function (elem, value) {
          var parsed, curElem, backgroundColor = '';
          if (jQuery.type(value) !== 'string' || (parsed = stringParse(value))) {
            value = color(parsed || value);
            if (!support.rgba && value._rgba[3] !== 1) {
              curElem = hook === 'backgroundColor' ? elem.parentNode : elem;
              while ((backgroundColor === '' || backgroundColor === 'transparent') && curElem && curElem.style) {
                try {
                  backgroundColor = jQuery.css(curElem, 'backgroundColor');
                  curElem = curElem.parentNode;
                } catch (e) {
                }
              }
              value = value.blend(backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : '_default');
            }
            value = value.toRgbaString();
          }
          try {
            elem.style[hook] = value;
          } catch (error) {
          }
        }
      };
      jQuery.fx.step[hook] = function (fx) {
        if (!fx.colorInit) {
          fx.start = color(fx.elem, hook);
          fx.end = color(fx.end);
          fx.colorInit = true;
        }
        jQuery.cssHooks[hook].set(fx.elem, fx.start.transition(fx.end, fx.pos));
      };
    });
    jQuery.cssHooks.borderColor = {
      expand: function (value) {
        var expanded = {};
        each([
          'Top',
          'Right',
          'Bottom',
          'Left'
        ], function (i, part) {
          expanded['border' + part + 'Color'] = value;
        });
        return expanded;
      }
    };
    colors = jQuery.Color.names = {
      aqua: '#00ffff',
      black: '#000000',
      blue: '#0000ff',
      fuchsia: '#ff00ff',
      gray: '#808080',
      green: '#008000',
      lime: '#00ff00',
      maroon: '#800000',
      navy: '#000080',
      olive: '#808000',
      purple: '#800080',
      red: '#ff0000',
      silver: '#c0c0c0',
      teal: '#008080',
      white: '#ffffff',
      yellow: '#ffff00',
      transparent: [
        null,
        null,
        null,
        0
      ],
      _default: '#ffffff'
    };
  }(jQuery));
  (function () {
    var classAnimationActions = [
        'add',
        'remove',
        'toggle'
      ], shorthandStyles = {
        border: 1,
        borderBottom: 1,
        borderColor: 1,
        borderLeft: 1,
        borderRight: 1,
        borderTop: 1,
        borderWidth: 1,
        margin: 1,
        padding: 1
      };
    $.each([
      'borderLeftStyle',
      'borderRightStyle',
      'borderBottomStyle',
      'borderTopStyle'
    ], function (_, prop) {
      $.fx.step[prop] = function (fx) {
        if (fx.end !== 'none' && !fx.setAttr || fx.pos === 1 && !fx.setAttr) {
          jQuery.style(fx.elem, prop, fx.end);
          fx.setAttr = true;
        }
      };
    });
    function getElementStyles() {
      var style = this.ownerDocument.defaultView ? this.ownerDocument.defaultView.getComputedStyle(this, null) : this.currentStyle, newStyle = {}, key, len;
      if (style && style.length && style[0] && style[style[0]]) {
        len = style.length;
        while (len--) {
          key = style[len];
          if (typeof style[key] === 'string') {
            newStyle[$.camelCase(key)] = style[key];
          }
        }
      } else {
        for (key in style) {
          if (typeof style[key] === 'string') {
            newStyle[key] = style[key];
          }
        }
      }
      return newStyle;
    }
    function styleDifference(oldStyle, newStyle) {
      var diff = {}, name, value;
      for (name in newStyle) {
        value = newStyle[name];
        if (oldStyle[name] !== value) {
          if (!shorthandStyles[name]) {
            if ($.fx.step[name] || !isNaN(parseFloat(value))) {
              diff[name] = value;
            }
          }
        }
      }
      return diff;
    }
    $.effects.animateClass = function (value, duration, easing, callback) {
      var o = $.speed(duration, easing, callback);
      return this.queue(function () {
        var animated = $(this), baseClass = animated.attr('class') || '', applyClassChange, allAnimations = o.children ? animated.find('*').andSelf() : animated;
        allAnimations = allAnimations.map(function () {
          var el = $(this);
          return {
            el: el,
            start: getElementStyles.call(this)
          };
        });
        applyClassChange = function () {
          $.each(classAnimationActions, function (i, action) {
            if (value[action]) {
              animated[action + 'Class'](value[action]);
            }
          });
        };
        applyClassChange();
        allAnimations = allAnimations.map(function () {
          this.end = getElementStyles.call(this.el[0]);
          this.diff = styleDifference(this.start, this.end);
          return this;
        });
        animated.attr('class', baseClass);
        allAnimations = allAnimations.map(function () {
          var styleInfo = this, dfd = $.Deferred(), opts = jQuery.extend({}, o, {
              queue: false,
              complete: function () {
                dfd.resolve(styleInfo);
              }
            });
          this.el.animate(this.diff, opts);
          return dfd.promise();
        });
        $.when.apply($, allAnimations.get()).done(function () {
          applyClassChange();
          $.each(arguments, function () {
            var el = this.el;
            $.each(this.diff, function (key) {
              el.css(key, '');
            });
          });
          o.complete.call(animated[0]);
        });
      });
    };
    $.fn.extend({
      _addClass: $.fn.addClass,
      addClass: function (classNames, speed, easing, callback) {
        return speed ? $.effects.animateClass.call(this, { add: classNames }, speed, easing, callback) : this._addClass(classNames);
      },
      _removeClass: $.fn.removeClass,
      removeClass: function (classNames, speed, easing, callback) {
        return speed ? $.effects.animateClass.call(this, { remove: classNames }, speed, easing, callback) : this._removeClass(classNames);
      },
      _toggleClass: $.fn.toggleClass,
      toggleClass: function (classNames, force, speed, easing, callback) {
        if (typeof force === 'boolean' || force === undefined) {
          if (!speed) {
            return this._toggleClass(classNames, force);
          } else {
            return $.effects.animateClass.call(this, force ? { add: classNames } : { remove: classNames }, speed, easing, callback);
          }
        } else {
          return $.effects.animateClass.call(this, { toggle: classNames }, force, speed, easing);
        }
      },
      switchClass: function (remove, add, speed, easing, callback) {
        return $.effects.animateClass.call(this, {
          add: add,
          remove: remove
        }, speed, easing, callback);
      }
    });
  }());
  (function () {
    $.extend($.effects, {
      version: '1.9.2',
      save: function (element, set) {
        for (var i = 0; i < set.length; i++) {
          if (set[i] !== null) {
            element.data(dataSpace + set[i], element[0].style[set[i]]);
          }
        }
      },
      restore: function (element, set) {
        var val, i;
        for (i = 0; i < set.length; i++) {
          if (set[i] !== null) {
            val = element.data(dataSpace + set[i]);
            if (val === undefined) {
              val = '';
            }
            element.css(set[i], val);
          }
        }
      },
      setMode: function (el, mode) {
        if (mode === 'toggle') {
          mode = el.is(':hidden') ? 'show' : 'hide';
        }
        return mode;
      },
      getBaseline: function (origin, original) {
        var y, x;
        switch (origin[0]) {
        case 'top':
          y = 0;
          break;
        case 'middle':
          y = 0.5;
          break;
        case 'bottom':
          y = 1;
          break;
        default:
          y = origin[0] / original.height;
        }
        switch (origin[1]) {
        case 'left':
          x = 0;
          break;
        case 'center':
          x = 0.5;
          break;
        case 'right':
          x = 1;
          break;
        default:
          x = origin[1] / original.width;
        }
        return {
          x: x,
          y: y
        };
      },
      createWrapper: function (element) {
        if (element.parent().is('.ui-effects-wrapper')) {
          return element.parent();
        }
        var props = {
            width: element.outerWidth(true),
            height: element.outerHeight(true),
            'float': element.css('float')
          }, wrapper = $('<div></div>').addClass('ui-effects-wrapper').css({
            fontSize: '100%',
            background: 'transparent',
            border: 'none',
            margin: 0,
            padding: 0
          }), size = {
            width: element.width(),
            height: element.height()
          }, active = document.activeElement;
        try {
          active.id;
        } catch (e) {
          active = document.body;
        }
        element.wrap(wrapper);
        if (element[0] === active || $.contains(element[0], active)) {
          $(active).focus();
        }
        wrapper = element.parent();
        if (element.css('position') === 'static') {
          wrapper.css({ position: 'relative' });
          element.css({ position: 'relative' });
        } else {
          $.extend(props, {
            position: element.css('position'),
            zIndex: element.css('z-index')
          });
          $.each([
            'top',
            'left',
            'bottom',
            'right'
          ], function (i, pos) {
            props[pos] = element.css(pos);
            if (isNaN(parseInt(props[pos], 10))) {
              props[pos] = 'auto';
            }
          });
          element.css({
            position: 'relative',
            top: 0,
            left: 0,
            right: 'auto',
            bottom: 'auto'
          });
        }
        element.css(size);
        return wrapper.css(props).show();
      },
      removeWrapper: function (element) {
        var active = document.activeElement;
        if (element.parent().is('.ui-effects-wrapper')) {
          element.parent().replaceWith(element);
          if (element[0] === active || $.contains(element[0], active)) {
            $(active).focus();
          }
        }
        return element;
      },
      setTransition: function (element, list, factor, value) {
        value = value || {};
        $.each(list, function (i, x) {
          var unit = element.cssUnit(x);
          if (unit[0] > 0) {
            value[x] = unit[0] * factor + unit[1];
          }
        });
        return value;
      }
    });
    function _normalizeArguments(effect, options, speed, callback) {
      if ($.isPlainObject(effect)) {
        options = effect;
        effect = effect.effect;
      }
      effect = { effect: effect };
      if (options == null) {
        options = {};
      }
      if ($.isFunction(options)) {
        callback = options;
        speed = null;
        options = {};
      }
      if (typeof options === 'number' || $.fx.speeds[options]) {
        callback = speed;
        speed = options;
        options = {};
      }
      if ($.isFunction(speed)) {
        callback = speed;
        speed = null;
      }
      if (options) {
        $.extend(effect, options);
      }
      speed = speed || options.duration;
      effect.duration = $.fx.off ? 0 : typeof speed === 'number' ? speed : speed in $.fx.speeds ? $.fx.speeds[speed] : $.fx.speeds._default;
      effect.complete = callback || options.complete;
      return effect;
    }
    function standardSpeed(speed) {
      if (!speed || typeof speed === 'number' || $.fx.speeds[speed]) {
        return true;
      }
      if (typeof speed === 'string' && !$.effects.effect[speed]) {
        if (backCompat && $.effects[speed]) {
          return false;
        }
        return true;
      }
      return false;
    }
    $.fn.extend({
      effect: function () {
        var args = _normalizeArguments.apply(this, arguments), mode = args.mode, queue = args.queue, effectMethod = $.effects.effect[args.effect], oldEffectMethod = !effectMethod && backCompat && $.effects[args.effect];
        if ($.fx.off || !(effectMethod || oldEffectMethod)) {
          if (mode) {
            return this[mode](args.duration, args.complete);
          } else {
            return this.each(function () {
              if (args.complete) {
                args.complete.call(this);
              }
            });
          }
        }
        function run(next) {
          var elem = $(this), complete = args.complete, mode = args.mode;
          function done() {
            if ($.isFunction(complete)) {
              complete.call(elem[0]);
            }
            if ($.isFunction(next)) {
              next();
            }
          }
          if (elem.is(':hidden') ? mode === 'hide' : mode === 'show') {
            done();
          } else {
            effectMethod.call(elem[0], args, done);
          }
        }
        if (effectMethod) {
          return queue === false ? this.each(run) : this.queue(queue || 'fx', run);
        } else {
          return oldEffectMethod.call(this, {
            options: args,
            duration: args.duration,
            callback: args.complete,
            mode: args.mode
          });
        }
      },
      _show: $.fn.show,
      show: function (speed) {
        if (standardSpeed(speed)) {
          return this._show.apply(this, arguments);
        } else {
          var args = _normalizeArguments.apply(this, arguments);
          args.mode = 'show';
          return this.effect.call(this, args);
        }
      },
      _hide: $.fn.hide,
      hide: function (speed) {
        if (standardSpeed(speed)) {
          return this._hide.apply(this, arguments);
        } else {
          var args = _normalizeArguments.apply(this, arguments);
          args.mode = 'hide';
          return this.effect.call(this, args);
        }
      },
      __toggle: $.fn.toggle,
      toggle: function (speed) {
        if (standardSpeed(speed) || typeof speed === 'boolean' || $.isFunction(speed)) {
          return this.__toggle.apply(this, arguments);
        } else {
          var args = _normalizeArguments.apply(this, arguments);
          args.mode = 'toggle';
          return this.effect.call(this, args);
        }
      },
      cssUnit: function (key) {
        var style = this.css(key), val = [];
        $.each([
          'em',
          'px',
          '%',
          'pt'
        ], function (i, unit) {
          if (style.indexOf(unit) > 0) {
            val = [
              parseFloat(style),
              unit
            ];
          }
        });
        return val;
      }
    });
  }());
  (function () {
    var baseEasings = {};
    $.each([
      'Quad',
      'Cubic',
      'Quart',
      'Quint',
      'Expo'
    ], function (i, name) {
      baseEasings[name] = function (p) {
        return Math.pow(p, i + 2);
      };
    });
    $.extend(baseEasings, {
      Sine: function (p) {
        return 1 - Math.cos(p * Math.PI / 2);
      },
      Circ: function (p) {
        return 1 - Math.sqrt(1 - p * p);
      },
      Elastic: function (p) {
        return p === 0 || p === 1 ? p : -Math.pow(2, 8 * (p - 1)) * Math.sin(((p - 1) * 80 - 7.5) * Math.PI / 15);
      },
      Back: function (p) {
        return p * p * (3 * p - 2);
      },
      Bounce: function (p) {
        var pow2, bounce = 4;
        while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {
        }
        return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2);
      }
    });
    $.each(baseEasings, function (name, easeIn) {
      $.easing['easeIn' + name] = easeIn;
      $.easing['easeOut' + name] = function (p) {
        return 1 - easeIn(1 - p);
      };
      $.easing['easeInOut' + name] = function (p) {
        return p < 0.5 ? easeIn(p * 2) / 2 : 1 - easeIn(p * -2 + 2) / 2;
      };
    });
  }());
}(jQuery);
(function ($, undefined) {
  var uid = 0, hideProps = {}, showProps = {};
  hideProps.height = hideProps.paddingTop = hideProps.paddingBottom = hideProps.borderTopWidth = hideProps.borderBottomWidth = 'hide';
  showProps.height = showProps.paddingTop = showProps.paddingBottom = showProps.borderTopWidth = showProps.borderBottomWidth = 'show';
  $.widget('ui.accordion', {
    version: '1.9.2',
    options: {
      active: 0,
      animate: {},
      collapsible: false,
      event: 'click',
      header: '> li > :first-child,> :not(li):even',
      heightStyle: 'auto',
      icons: {
        activeHeader: 'ui-icon-triangle-1-s',
        header: 'ui-icon-triangle-1-e'
      },
      activate: null,
      beforeActivate: null
    },
    _create: function () {
      var accordionId = this.accordionId = 'ui-accordion-' + (this.element.attr('id') || ++uid), options = this.options;
      this.prevShow = this.prevHide = $();
      this.element.addClass('ui-accordion ui-widget ui-helper-reset');
      this.headers = this.element.find(options.header).addClass('ui-accordion-header ui-helper-reset ui-state-default ui-corner-all');
      this._hoverable(this.headers);
      this._focusable(this.headers);
      this.headers.next().addClass('ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom').hide();
      if (!options.collapsible && (options.active === false || options.active == null)) {
        options.active = 0;
      }
      if (options.active < 0) {
        options.active += this.headers.length;
      }
      this.active = this._findActive(options.active).addClass('ui-accordion-header-active ui-state-active').toggleClass('ui-corner-all ui-corner-top');
      this.active.next().addClass('ui-accordion-content-active').show();
      this._createIcons();
      this.refresh();
      this.element.attr('role', 'tablist');
      this.headers.attr('role', 'tab').each(function (i) {
        var header = $(this), headerId = header.attr('id'), panel = header.next(), panelId = panel.attr('id');
        if (!headerId) {
          headerId = accordionId + '-header-' + i;
          header.attr('id', headerId);
        }
        if (!panelId) {
          panelId = accordionId + '-panel-' + i;
          panel.attr('id', panelId);
        }
        header.attr('aria-controls', panelId);
        panel.attr('aria-labelledby', headerId);
      }).next().attr('role', 'tabpanel');
      this.headers.not(this.active).attr({
        'aria-selected': 'false',
        tabIndex: -1
      }).next().attr({
        'aria-expanded': 'false',
        'aria-hidden': 'true'
      }).hide();
      if (!this.active.length) {
        this.headers.eq(0).attr('tabIndex', 0);
      } else {
        this.active.attr({
          'aria-selected': 'true',
          tabIndex: 0
        }).next().attr({
          'aria-expanded': 'true',
          'aria-hidden': 'false'
        });
      }
      this._on(this.headers, { keydown: '_keydown' });
      this._on(this.headers.next(), { keydown: '_panelKeyDown' });
      this._setupEvents(options.event);
    },
    _getCreateEventData: function () {
      return {
        header: this.active,
        content: !this.active.length ? $() : this.active.next()
      };
    },
    _createIcons: function () {
      var icons = this.options.icons;
      if (icons) {
        $('<span>').addClass('ui-accordion-header-icon ui-icon ' + icons.header).prependTo(this.headers);
        this.active.children('.ui-accordion-header-icon').removeClass(icons.header).addClass(icons.activeHeader);
        this.headers.addClass('ui-accordion-icons');
      }
    },
    _destroyIcons: function () {
      this.headers.removeClass('ui-accordion-icons').children('.ui-accordion-header-icon').remove();
    },
    _destroy: function () {
      var contents;
      this.element.removeClass('ui-accordion ui-widget ui-helper-reset').removeAttr('role');
      this.headers.removeClass('ui-accordion-header ui-accordion-header-active ui-helper-reset ui-state-default ui-corner-all ui-state-active ui-state-disabled ui-corner-top').removeAttr('role').removeAttr('aria-selected').removeAttr('aria-controls').removeAttr('tabIndex').each(function () {
        if (/^ui-accordion/.test(this.id)) {
          this.removeAttribute('id');
        }
      });
      this._destroyIcons();
      contents = this.headers.next().css('display', '').removeAttr('role').removeAttr('aria-expanded').removeAttr('aria-hidden').removeAttr('aria-labelledby').removeClass('ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active ui-state-disabled').each(function () {
        if (/^ui-accordion/.test(this.id)) {
          this.removeAttribute('id');
        }
      });
      if (this.options.heightStyle !== 'content') {
        contents.css('height', '');
      }
    },
    _setOption: function (key, value) {
      if (key === 'active') {
        this._activate(value);
        return;
      }
      if (key === 'event') {
        if (this.options.event) {
          this._off(this.headers, this.options.event);
        }
        this._setupEvents(value);
      }
      this._super(key, value);
      if (key === 'collapsible' && !value && this.options.active === false) {
        this._activate(0);
      }
      if (key === 'icons') {
        this._destroyIcons();
        if (value) {
          this._createIcons();
        }
      }
      if (key === 'disabled') {
        this.headers.add(this.headers.next()).toggleClass('ui-state-disabled', !!value);
      }
    },
    _keydown: function (event) {
      if (event.altKey || event.ctrlKey) {
        return;
      }
      var keyCode = $.ui.keyCode, length = this.headers.length, currentIndex = this.headers.index(event.target), toFocus = false;
      switch (event.keyCode) {
      case keyCode.RIGHT:
      case keyCode.DOWN:
        toFocus = this.headers[(currentIndex + 1) % length];
        break;
      case keyCode.LEFT:
      case keyCode.UP:
        toFocus = this.headers[(currentIndex - 1 + length) % length];
        break;
      case keyCode.SPACE:
      case keyCode.ENTER:
        this._eventHandler(event);
        break;
      case keyCode.HOME:
        toFocus = this.headers[0];
        break;
      case keyCode.END:
        toFocus = this.headers[length - 1];
        break;
      }
      if (toFocus) {
        $(event.target).attr('tabIndex', -1);
        $(toFocus).attr('tabIndex', 0);
        toFocus.focus();
        event.preventDefault();
      }
    },
    _panelKeyDown: function (event) {
      if (event.keyCode === $.ui.keyCode.UP && event.ctrlKey) {
        $(event.currentTarget).prev().focus();
      }
    },
    refresh: function () {
      var maxHeight, overflow, heightStyle = this.options.heightStyle, parent = this.element.parent();
      if (heightStyle === 'fill') {
        if (!$.support.minHeight) {
          overflow = parent.css('overflow');
          parent.css('overflow', 'hidden');
        }
        maxHeight = parent.height();
        this.element.siblings(':visible').each(function () {
          var elem = $(this), position = elem.css('position');
          if (position === 'absolute' || position === 'fixed') {
            return;
          }
          maxHeight -= elem.outerHeight(true);
        });
        if (overflow) {
          parent.css('overflow', overflow);
        }
        this.headers.each(function () {
          maxHeight -= $(this).outerHeight(true);
        });
        this.headers.next().each(function () {
          $(this).height(Math.max(0, maxHeight - $(this).innerHeight() + $(this).height()));
        }).css('overflow', 'auto');
      } else if (heightStyle === 'auto') {
        maxHeight = 0;
        this.headers.next().each(function () {
          maxHeight = Math.max(maxHeight, $(this).css('height', '').height());
        }).height(maxHeight);
      }
    },
    _activate: function (index) {
      var active = this._findActive(index)[0];
      if (active === this.active[0]) {
        return;
      }
      active = active || this.active[0];
      this._eventHandler({
        target: active,
        currentTarget: active,
        preventDefault: $.noop
      });
    },
    _findActive: function (selector) {
      return typeof selector === 'number' ? this.headers.eq(selector) : $();
    },
    _setupEvents: function (event) {
      var events = {};
      if (!event) {
        return;
      }
      $.each(event.split(' '), function (index, eventName) {
        events[eventName] = '_eventHandler';
      });
      this._on(this.headers, events);
    },
    _eventHandler: function (event) {
      var options = this.options, active = this.active, clicked = $(event.currentTarget), clickedIsActive = clicked[0] === active[0], collapsing = clickedIsActive && options.collapsible, toShow = collapsing ? $() : clicked.next(), toHide = active.next(), eventData = {
          oldHeader: active,
          oldPanel: toHide,
          newHeader: collapsing ? $() : clicked,
          newPanel: toShow
        };
      event.preventDefault();
      if (clickedIsActive && !options.collapsible || this._trigger('beforeActivate', event, eventData) === false) {
        return;
      }
      options.active = collapsing ? false : this.headers.index(clicked);
      this.active = clickedIsActive ? $() : clicked;
      this._toggle(eventData);
      active.removeClass('ui-accordion-header-active ui-state-active');
      if (options.icons) {
        active.children('.ui-accordion-header-icon').removeClass(options.icons.activeHeader).addClass(options.icons.header);
      }
      if (!clickedIsActive) {
        clicked.removeClass('ui-corner-all').addClass('ui-accordion-header-active ui-state-active ui-corner-top');
        if (options.icons) {
          clicked.children('.ui-accordion-header-icon').removeClass(options.icons.header).addClass(options.icons.activeHeader);
        }
        clicked.next().addClass('ui-accordion-content-active');
      }
    },
    _toggle: function (data) {
      var toShow = data.newPanel, toHide = this.prevShow.length ? this.prevShow : data.oldPanel;
      this.prevShow.add(this.prevHide).stop(true, true);
      this.prevShow = toShow;
      this.prevHide = toHide;
      if (this.options.animate) {
        this._animate(toShow, toHide, data);
      } else {
        toHide.hide();
        toShow.show();
        this._toggleComplete(data);
      }
      toHide.attr({
        'aria-expanded': 'false',
        'aria-hidden': 'true'
      });
      toHide.prev().attr('aria-selected', 'false');
      if (toShow.length && toHide.length) {
        toHide.prev().attr('tabIndex', -1);
      } else if (toShow.length) {
        this.headers.filter(function () {
          return $(this).attr('tabIndex') === 0;
        }).attr('tabIndex', -1);
      }
      toShow.attr({
        'aria-expanded': 'true',
        'aria-hidden': 'false'
      }).prev().attr({
        'aria-selected': 'true',
        tabIndex: 0
      });
    },
    _animate: function (toShow, toHide, data) {
      var total, easing, duration, that = this, adjust = 0, down = toShow.length && (!toHide.length || toShow.index() < toHide.index()), animate = this.options.animate || {}, options = down && animate.down || animate, complete = function () {
          that._toggleComplete(data);
        };
      if (typeof options === 'number') {
        duration = options;
      }
      if (typeof options === 'string') {
        easing = options;
      }
      easing = easing || options.easing || animate.easing;
      duration = duration || options.duration || animate.duration;
      if (!toHide.length) {
        return toShow.animate(showProps, duration, easing, complete);
      }
      if (!toShow.length) {
        return toHide.animate(hideProps, duration, easing, complete);
      }
      total = toShow.show().outerHeight();
      toHide.animate(hideProps, {
        duration: duration,
        easing: easing,
        step: function (now, fx) {
          fx.now = Math.round(now);
        }
      });
      toShow.hide().animate(showProps, {
        duration: duration,
        easing: easing,
        complete: complete,
        step: function (now, fx) {
          fx.now = Math.round(now);
          if (fx.prop !== 'height') {
            adjust += fx.now;
          } else if (that.options.heightStyle !== 'content') {
            fx.now = Math.round(total - toHide.outerHeight() - adjust);
            adjust = 0;
          }
        }
      });
    },
    _toggleComplete: function (data) {
      var toHide = data.oldPanel;
      toHide.removeClass('ui-accordion-content-active').prev().removeClass('ui-corner-top').addClass('ui-corner-all');
      if (toHide.length) {
        toHide.parent()[0].className = toHide.parent()[0].className;
      }
      this._trigger('activate', null, data);
    }
  });
  if ($.uiBackCompat !== false) {
    (function ($, prototype) {
      $.extend(prototype.options, {
        navigation: false,
        navigationFilter: function () {
          return this.href.toLowerCase() === location.href.toLowerCase();
        }
      });
      var _create = prototype._create;
      prototype._create = function () {
        if (this.options.navigation) {
          var that = this, headers = this.element.find(this.options.header), content = headers.next(), current = headers.add(content).find('a').filter(this.options.navigationFilter)[0];
          if (current) {
            headers.add(content).each(function (index) {
              if ($.contains(this, current)) {
                that.options.active = Math.floor(index / 2);
                return false;
              }
            });
          }
        }
        _create.call(this);
      };
    }(jQuery, jQuery.ui.accordion.prototype));
    (function ($, prototype) {
      $.extend(prototype.options, {
        heightStyle: null,
        autoHeight: true,
        clearStyle: false,
        fillSpace: false
      });
      var _create = prototype._create, _setOption = prototype._setOption;
      $.extend(prototype, {
        _create: function () {
          this.options.heightStyle = this.options.heightStyle || this._mergeHeightStyle();
          _create.call(this);
        },
        _setOption: function (key) {
          if (key === 'autoHeight' || key === 'clearStyle' || key === 'fillSpace') {
            this.options.heightStyle = this._mergeHeightStyle();
          }
          _setOption.apply(this, arguments);
        },
        _mergeHeightStyle: function () {
          var options = this.options;
          if (options.fillSpace) {
            return 'fill';
          }
          if (options.clearStyle) {
            return 'content';
          }
          if (options.autoHeight) {
            return 'auto';
          }
        }
      });
    }(jQuery, jQuery.ui.accordion.prototype));
    (function ($, prototype) {
      $.extend(prototype.options.icons, {
        activeHeader: null,
        headerSelected: 'ui-icon-triangle-1-s'
      });
      var _createIcons = prototype._createIcons;
      prototype._createIcons = function () {
        if (this.options.icons) {
          this.options.icons.activeHeader = this.options.icons.activeHeader || this.options.icons.headerSelected;
        }
        _createIcons.call(this);
      };
    }(jQuery, jQuery.ui.accordion.prototype));
    (function ($, prototype) {
      prototype.activate = prototype._activate;
      var _findActive = prototype._findActive;
      prototype._findActive = function (index) {
        if (index === -1) {
          index = false;
        }
        if (index && typeof index !== 'number') {
          index = this.headers.index(this.headers.filter(index));
          if (index === -1) {
            index = false;
          }
        }
        return _findActive.call(this, index);
      };
    }(jQuery, jQuery.ui.accordion.prototype));
    jQuery.ui.accordion.prototype.resize = jQuery.ui.accordion.prototype.refresh;
    (function ($, prototype) {
      $.extend(prototype.options, {
        change: null,
        changestart: null
      });
      var _trigger = prototype._trigger;
      prototype._trigger = function (type, event, data) {
        var ret = _trigger.apply(this, arguments);
        if (!ret) {
          return false;
        }
        if (type === 'beforeActivate') {
          ret = _trigger.call(this, 'changestart', event, {
            oldHeader: data.oldHeader,
            oldContent: data.oldPanel,
            newHeader: data.newHeader,
            newContent: data.newPanel
          });
        } else if (type === 'activate') {
          ret = _trigger.call(this, 'change', event, {
            oldHeader: data.oldHeader,
            oldContent: data.oldPanel,
            newHeader: data.newHeader,
            newContent: data.newPanel
          });
        }
        return ret;
      };
    }(jQuery, jQuery.ui.accordion.prototype));
    (function ($, prototype) {
      $.extend(prototype.options, {
        animate: null,
        animated: 'slide'
      });
      var _create = prototype._create;
      prototype._create = function () {
        var options = this.options;
        if (options.animate === null) {
          if (!options.animated) {
            options.animate = false;
          } else if (options.animated === 'slide') {
            options.animate = 300;
          } else if (options.animated === 'bounceslide') {
            options.animate = {
              duration: 200,
              down: {
                easing: 'easeOutBounce',
                duration: 1000
              }
            };
          } else {
            options.animate = options.animated;
          }
        }
        _create.call(this);
      };
    }(jQuery, jQuery.ui.accordion.prototype));
  }
}(jQuery));
(function ($, undefined) {
  var requestIndex = 0;
  $.widget('ui.autocomplete', {
    version: '1.9.2',
    defaultElement: '<input>',
    options: {
      appendTo: 'body',
      autoFocus: false,
      delay: 300,
      minLength: 1,
      position: {
        my: 'left top',
        at: 'left bottom',
        collision: 'none'
      },
      source: null,
      change: null,
      close: null,
      focus: null,
      open: null,
      response: null,
      search: null,
      select: null
    },
    pending: 0,
    _create: function () {
      var suppressKeyPress, suppressKeyPressRepeat, suppressInput;
      this.isMultiLine = this._isMultiLine();
      this.valueMethod = this.element[this.element.is('input,textarea') ? 'val' : 'text'];
      this.isNewMenu = true;
      this.element.addClass('ui-autocomplete-input').attr('autocomplete', 'off');
      this._on(this.element, {
        keydown: function (event) {
          if (this.element.prop('readOnly')) {
            suppressKeyPress = true;
            suppressInput = true;
            suppressKeyPressRepeat = true;
            return;
          }
          suppressKeyPress = false;
          suppressInput = false;
          suppressKeyPressRepeat = false;
          var keyCode = $.ui.keyCode;
          switch (event.keyCode) {
          case keyCode.PAGE_UP:
            suppressKeyPress = true;
            this._move('previousPage', event);
            break;
          case keyCode.PAGE_DOWN:
            suppressKeyPress = true;
            this._move('nextPage', event);
            break;
          case keyCode.UP:
            suppressKeyPress = true;
            this._keyEvent('previous', event);
            break;
          case keyCode.DOWN:
            suppressKeyPress = true;
            this._keyEvent('next', event);
            break;
          case keyCode.ENTER:
          case keyCode.NUMPAD_ENTER:
            if (this.menu.active) {
              suppressKeyPress = true;
              event.preventDefault();
              this.menu.select(event);
            }
            break;
          case keyCode.TAB:
            if (this.menu.active) {
              this.menu.select(event);
            }
            break;
          case keyCode.ESCAPE:
            if (this.menu.element.is(':visible')) {
              this._value(this.term);
              this.close(event);
              event.preventDefault();
            }
            break;
          default:
            suppressKeyPressRepeat = true;
            this._searchTimeout(event);
            break;
          }
        },
        keypress: function (event) {
          if (suppressKeyPress) {
            suppressKeyPress = false;
            event.preventDefault();
            return;
          }
          if (suppressKeyPressRepeat) {
            return;
          }
          var keyCode = $.ui.keyCode;
          switch (event.keyCode) {
          case keyCode.PAGE_UP:
            this._move('previousPage', event);
            break;
          case keyCode.PAGE_DOWN:
            this._move('nextPage', event);
            break;
          case keyCode.UP:
            this._keyEvent('previous', event);
            break;
          case keyCode.DOWN:
            this._keyEvent('next', event);
            break;
          }
        },
        input: function (event) {
          if (suppressInput) {
            suppressInput = false;
            event.preventDefault();
            return;
          }
          this._searchTimeout(event);
        },
        focus: function () {
          this.selectedItem = null;
          this.previous = this._value();
        },
        blur: function (event) {
          if (this.cancelBlur) {
            delete this.cancelBlur;
            return;
          }
          clearTimeout(this.searching);
          this.close(event);
          this._change(event);
        }
      });
      this._initSource();
      this.menu = $('<ul>').addClass('ui-autocomplete').appendTo(this.document.find(this.options.appendTo || 'body')[0]).menu({
        input: $(),
        role: null
      }).zIndex(this.element.zIndex() + 1).hide().data('menu');
      this._on(this.menu.element, {
        mousedown: function (event) {
          event.preventDefault();
          this.cancelBlur = true;
          this._delay(function () {
            delete this.cancelBlur;
          });
          var menuElement = this.menu.element[0];
          if (!$(event.target).closest('.ui-menu-item').length) {
            this._delay(function () {
              var that = this;
              this.document.one('mousedown', function (event) {
                if (event.target !== that.element[0] && event.target !== menuElement && !$.contains(menuElement, event.target)) {
                  that.close();
                }
              });
            });
          }
        },
        menufocus: function (event, ui) {
          if (this.isNewMenu) {
            this.isNewMenu = false;
            if (event.originalEvent && /^mouse/.test(event.originalEvent.type)) {
              this.menu.blur();
              this.document.one('mousemove', function () {
                $(event.target).trigger(event.originalEvent);
              });
              return;
            }
          }
          var item = ui.item.data('ui-autocomplete-item') || ui.item.data('item.autocomplete');
          if (false !== this._trigger('focus', event, { item: item })) {
            if (event.originalEvent && /^key/.test(event.originalEvent.type)) {
              this._value(item.value);
            }
          } else {
            this.liveRegion.text(item.value);
          }
        },
        menuselect: function (event, ui) {
          var item = ui.item.data('ui-autocomplete-item') || ui.item.data('item.autocomplete'), previous = this.previous;
          if (this.element[0] !== this.document[0].activeElement) {
            this.element.focus();
            this.previous = previous;
            this._delay(function () {
              this.previous = previous;
              this.selectedItem = item;
            });
          }
          if (false !== this._trigger('select', event, { item: item })) {
            this._value(item.value);
          }
          this.term = this._value();
          this.close(event);
          this.selectedItem = item;
        }
      });
      this.liveRegion = $('<span>', {
        role: 'status',
        'aria-live': 'polite'
      }).addClass('ui-helper-hidden-accessible').insertAfter(this.element);
      if ($.fn.bgiframe) {
        this.menu.element.bgiframe();
      }
      this._on(this.window, {
        beforeunload: function () {
          this.element.removeAttr('autocomplete');
        }
      });
    },
    _destroy: function () {
      clearTimeout(this.searching);
      this.element.removeClass('ui-autocomplete-input').removeAttr('autocomplete');
      this.menu.element.remove();
      this.liveRegion.remove();
    },
    _setOption: function (key, value) {
      this._super(key, value);
      if (key === 'source') {
        this._initSource();
      }
      if (key === 'appendTo') {
        this.menu.element.appendTo(this.document.find(value || 'body')[0]);
      }
      if (key === 'disabled' && value && this.xhr) {
        this.xhr.abort();
      }
    },
    _isMultiLine: function () {
      if (this.element.is('textarea')) {
        return true;
      }
      if (this.element.is('input')) {
        return false;
      }
      return this.element.prop('isContentEditable');
    },
    _initSource: function () {
      var array, url, that = this;
      if ($.isArray(this.options.source)) {
        array = this.options.source;
        this.source = function (request, response) {
          response($.ui.autocomplete.filter(array, request.term));
        };
      } else if (typeof this.options.source === 'string') {
        url = this.options.source;
        this.source = function (request, response) {
          if (that.xhr) {
            that.xhr.abort();
          }
          that.xhr = $.ajax({
            url: url,
            data: request,
            dataType: 'json',
            success: function (data) {
              response(data);
            },
            error: function () {
              response([]);
            }
          });
        };
      } else {
        this.source = this.options.source;
      }
    },
    _searchTimeout: function (event) {
      clearTimeout(this.searching);
      this.searching = this._delay(function () {
        if (this.term !== this._value()) {
          this.selectedItem = null;
          this.search(null, event);
        }
      }, this.options.delay);
    },
    search: function (value, event) {
      value = value != null ? value : this._value();
      this.term = this._value();
      if (value.length < this.options.minLength) {
        return this.close(event);
      }
      if (this._trigger('search', event) === false) {
        return;
      }
      return this._search(value);
    },
    _search: function (value) {
      this.pending++;
      this.element.addClass('ui-autocomplete-loading');
      this.cancelSearch = false;
      this.source({ term: value }, this._response());
    },
    _response: function () {
      var that = this, index = ++requestIndex;
      return function (content) {
        if (index === requestIndex) {
          that.__response(content);
        }
        that.pending--;
        if (!that.pending) {
          that.element.removeClass('ui-autocomplete-loading');
        }
      };
    },
    __response: function (content) {
      if (content) {
        content = this._normalize(content);
      }
      this._trigger('response', null, { content: content });
      if (!this.options.disabled && content && content.length && !this.cancelSearch) {
        this._suggest(content);
        this._trigger('open');
      } else {
        this._close();
      }
    },
    close: function (event) {
      this.cancelSearch = true;
      this._close(event);
    },
    _close: function (event) {
      if (this.menu.element.is(':visible')) {
        this.menu.element.hide();
        this.menu.blur();
        this.isNewMenu = true;
        this._trigger('close', event);
      }
    },
    _change: function (event) {
      if (this.previous !== this._value()) {
        this._trigger('change', event, { item: this.selectedItem });
      }
    },
    _normalize: function (items) {
      if (items.length && items[0].label && items[0].value) {
        return items;
      }
      return $.map(items, function (item) {
        if (typeof item === 'string') {
          return {
            label: item,
            value: item
          };
        }
        return $.extend({
          label: item.label || item.value,
          value: item.value || item.label
        }, item);
      });
    },
    _suggest: function (items) {
      var ul = this.menu.element.empty().zIndex(this.element.zIndex() + 1);
      this._renderMenu(ul, items);
      this.menu.refresh();
      ul.show();
      this._resizeMenu();
      ul.position($.extend({ of: this.element }, this.options.position));
      if (this.options.autoFocus) {
        this.menu.next();
      }
    },
    _resizeMenu: function () {
      var ul = this.menu.element;
      ul.outerWidth(Math.max(ul.width('').outerWidth() + 1, this.element.outerWidth()));
    },
    _renderMenu: function (ul, items) {
      var that = this;
      $.each(items, function (index, item) {
        that._renderItemData(ul, item);
      });
    },
    _renderItemData: function (ul, item) {
      return this._renderItem(ul, item).data('ui-autocomplete-item', item);
    },
    _renderItem: function (ul, item) {
      return $('<li>').append($('<a>').text(item.label)).appendTo(ul);
    },
    _move: function (direction, event) {
      if (!this.menu.element.is(':visible')) {
        this.search(null, event);
        return;
      }
      if (this.menu.isFirstItem() && /^previous/.test(direction) || this.menu.isLastItem() && /^next/.test(direction)) {
        this._value(this.term);
        this.menu.blur();
        return;
      }
      this.menu[direction](event);
    },
    widget: function () {
      return this.menu.element;
    },
    _value: function () {
      return this.valueMethod.apply(this.element, arguments);
    },
    _keyEvent: function (keyEvent, event) {
      if (!this.isMultiLine || this.menu.element.is(':visible')) {
        this._move(keyEvent, event);
        event.preventDefault();
      }
    }
  });
  $.extend($.ui.autocomplete, {
    escapeRegex: function (value) {
      return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    },
    filter: function (array, term) {
      var matcher = new RegExp($.ui.autocomplete.escapeRegex(term), 'i');
      return $.grep(array, function (value) {
        return matcher.test(value.label || value.value || value);
      });
    }
  });
  $.widget('ui.autocomplete', $.ui.autocomplete, {
    options: {
      messages: {
        noResults: 'No search results.',
        results: function (amount) {
          return amount + (amount > 1 ? ' results are' : ' result is') + ' available, use up and down arrow keys to navigate.';
        }
      }
    },
    __response: function (content) {
      var message;
      this._superApply(arguments);
      if (this.options.disabled || this.cancelSearch) {
        return;
      }
      if (content && content.length) {
        message = this.options.messages.results(content.length);
      } else {
        message = this.options.messages.noResults;
      }
      this.liveRegion.text(message);
    }
  });
}(jQuery));
(function ($, undefined) {
  var lastActive, startXPos, startYPos, clickDragged, baseClasses = 'ui-button ui-widget ui-state-default ui-corner-all', stateClasses = 'ui-state-hover ui-state-active ', typeClasses = 'ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only', formResetHandler = function () {
      var buttons = $(this).find(':ui-button');
      setTimeout(function () {
        buttons.button('refresh');
      }, 1);
    }, radioGroup = function (radio) {
      var name = radio.name, form = radio.form, radios = $([]);
      if (name) {
        if (form) {
          radios = $(form).find('[name=\'' + name + '\']');
        } else {
          radios = $('[name=\'' + name + '\']', radio.ownerDocument).filter(function () {
            return !this.form;
          });
        }
      }
      return radios;
    };
  $.widget('ui.button', {
    version: '1.9.2',
    defaultElement: '<button>',
    options: {
      disabled: null,
      text: true,
      label: null,
      icons: {
        primary: null,
        secondary: null
      }
    },
    _create: function () {
      this.element.closest('form').unbind('reset' + this.eventNamespace).bind('reset' + this.eventNamespace, formResetHandler);
      if (typeof this.options.disabled !== 'boolean') {
        this.options.disabled = !!this.element.prop('disabled');
      } else {
        this.element.prop('disabled', this.options.disabled);
      }
      this._determineButtonType();
      this.hasTitle = !!this.buttonElement.attr('title');
      var that = this, options = this.options, toggleButton = this.type === 'checkbox' || this.type === 'radio', activeClass = !toggleButton ? 'ui-state-active' : '', focusClass = 'ui-state-focus';
      if (options.label === null) {
        options.label = this.type === 'input' ? this.buttonElement.val() : this.buttonElement.html();
      }
      this._hoverable(this.buttonElement);
      this.buttonElement.addClass(baseClasses).attr('role', 'button').bind('mouseenter' + this.eventNamespace, function () {
        if (options.disabled) {
          return;
        }
        if (this === lastActive) {
          $(this).addClass('ui-state-active');
        }
      }).bind('mouseleave' + this.eventNamespace, function () {
        if (options.disabled) {
          return;
        }
        $(this).removeClass(activeClass);
      }).bind('click' + this.eventNamespace, function (event) {
        if (options.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      });
      this.element.bind('focus' + this.eventNamespace, function () {
        that.buttonElement.addClass(focusClass);
      }).bind('blur' + this.eventNamespace, function () {
        that.buttonElement.removeClass(focusClass);
      });
      if (toggleButton) {
        this.element.bind('change' + this.eventNamespace, function () {
          if (clickDragged) {
            return;
          }
          that.refresh();
        });
        this.buttonElement.bind('mousedown' + this.eventNamespace, function (event) {
          if (options.disabled) {
            return;
          }
          clickDragged = false;
          startXPos = event.pageX;
          startYPos = event.pageY;
        }).bind('mouseup' + this.eventNamespace, function (event) {
          if (options.disabled) {
            return;
          }
          if (startXPos !== event.pageX || startYPos !== event.pageY) {
            clickDragged = true;
          }
        });
      }
      if (this.type === 'checkbox') {
        this.buttonElement.bind('click' + this.eventNamespace, function () {
          if (options.disabled || clickDragged) {
            return false;
          }
          $(this).toggleClass('ui-state-active');
          that.buttonElement.attr('aria-pressed', that.element[0].checked);
        });
      } else if (this.type === 'radio') {
        this.buttonElement.bind('click' + this.eventNamespace, function () {
          if (options.disabled || clickDragged) {
            return false;
          }
          $(this).addClass('ui-state-active');
          that.buttonElement.attr('aria-pressed', 'true');
          var radio = that.element[0];
          radioGroup(radio).not(radio).map(function () {
            return $(this).button('widget')[0];
          }).removeClass('ui-state-active').attr('aria-pressed', 'false');
        });
      } else {
        this.buttonElement.bind('mousedown' + this.eventNamespace, function () {
          if (options.disabled) {
            return false;
          }
          $(this).addClass('ui-state-active');
          lastActive = this;
          that.document.one('mouseup', function () {
            lastActive = null;
          });
        }).bind('mouseup' + this.eventNamespace, function () {
          if (options.disabled) {
            return false;
          }
          $(this).removeClass('ui-state-active');
        }).bind('keydown' + this.eventNamespace, function (event) {
          if (options.disabled) {
            return false;
          }
          if (event.keyCode === $.ui.keyCode.SPACE || event.keyCode === $.ui.keyCode.ENTER) {
            $(this).addClass('ui-state-active');
          }
        }).bind('keyup' + this.eventNamespace, function () {
          $(this).removeClass('ui-state-active');
        });
        if (this.buttonElement.is('a')) {
          this.buttonElement.keyup(function (event) {
            if (event.keyCode === $.ui.keyCode.SPACE) {
              $(this).click();
            }
          });
        }
      }
      this._setOption('disabled', options.disabled);
      this._resetButton();
    },
    _determineButtonType: function () {
      var ancestor, labelSelector, checked;
      if (this.element.is('[type=checkbox]')) {
        this.type = 'checkbox';
      } else if (this.element.is('[type=radio]')) {
        this.type = 'radio';
      } else if (this.element.is('input')) {
        this.type = 'input';
      } else {
        this.type = 'button';
      }
      if (this.type === 'checkbox' || this.type === 'radio') {
        ancestor = this.element.parents().last();
        labelSelector = 'label[for=\'' + this.element.attr('id') + '\']';
        this.buttonElement = ancestor.find(labelSelector);
        if (!this.buttonElement.length) {
          ancestor = ancestor.length ? ancestor.siblings() : this.element.siblings();
          this.buttonElement = ancestor.filter(labelSelector);
          if (!this.buttonElement.length) {
            this.buttonElement = ancestor.find(labelSelector);
          }
        }
        this.element.addClass('ui-helper-hidden-accessible');
        checked = this.element.is(':checked');
        if (checked) {
          this.buttonElement.addClass('ui-state-active');
        }
        this.buttonElement.prop('aria-pressed', checked);
      } else {
        this.buttonElement = this.element;
      }
    },
    widget: function () {
      return this.buttonElement;
    },
    _destroy: function () {
      this.element.removeClass('ui-helper-hidden-accessible');
      this.buttonElement.removeClass(baseClasses + ' ' + stateClasses + ' ' + typeClasses).removeAttr('role').removeAttr('aria-pressed').html(this.buttonElement.find('.ui-button-text').html());
      if (!this.hasTitle) {
        this.buttonElement.removeAttr('title');
      }
    },
    _setOption: function (key, value) {
      this._super(key, value);
      if (key === 'disabled') {
        if (value) {
          this.element.prop('disabled', true);
        } else {
          this.element.prop('disabled', false);
        }
        return;
      }
      this._resetButton();
    },
    refresh: function () {
      var isDisabled = this.element.is('input, button') ? this.element.is(':disabled') : this.element.hasClass('ui-button-disabled');
      if (isDisabled !== this.options.disabled) {
        this._setOption('disabled', isDisabled);
      }
      if (this.type === 'radio') {
        radioGroup(this.element[0]).each(function () {
          if ($(this).is(':checked')) {
            $(this).button('widget').addClass('ui-state-active').attr('aria-pressed', 'true');
          } else {
            $(this).button('widget').removeClass('ui-state-active').attr('aria-pressed', 'false');
          }
        });
      } else if (this.type === 'checkbox') {
        if (this.element.is(':checked')) {
          this.buttonElement.addClass('ui-state-active').attr('aria-pressed', 'true');
        } else {
          this.buttonElement.removeClass('ui-state-active').attr('aria-pressed', 'false');
        }
      }
    },
    _resetButton: function () {
      if (this.type === 'input') {
        if (this.options.label) {
          this.element.val(this.options.label);
        }
        return;
      }
      var buttonElement = this.buttonElement.removeClass(typeClasses), buttonText = $('<span></span>', this.document[0]).addClass('ui-button-text').html(this.options.label).appendTo(buttonElement.empty()).text(), icons = this.options.icons, multipleIcons = icons.primary && icons.secondary, buttonClasses = [];
      if (icons.primary || icons.secondary) {
        if (this.options.text) {
          buttonClasses.push('ui-button-text-icon' + (multipleIcons ? 's' : icons.primary ? '-primary' : '-secondary'));
        }
        if (icons.primary) {
          buttonElement.prepend('<span class=\'ui-button-icon-primary ui-icon ' + icons.primary + '\'></span>');
        }
        if (icons.secondary) {
          buttonElement.append('<span class=\'ui-button-icon-secondary ui-icon ' + icons.secondary + '\'></span>');
        }
        if (!this.options.text) {
          buttonClasses.push(multipleIcons ? 'ui-button-icons-only' : 'ui-button-icon-only');
          if (!this.hasTitle) {
            buttonElement.attr('title', $.trim(buttonText));
          }
        }
      } else {
        buttonClasses.push('ui-button-text-only');
      }
      buttonElement.addClass(buttonClasses.join(' '));
    }
  });
  $.widget('ui.buttonset', {
    version: '1.9.2',
    options: { items: 'button, input[type=button], input[type=submit], input[type=reset], input[type=checkbox], input[type=radio], a, :data(button)' },
    _create: function () {
      this.element.addClass('ui-buttonset');
    },
    _init: function () {
      this.refresh();
    },
    _setOption: function (key, value) {
      if (key === 'disabled') {
        this.buttons.button('option', key, value);
      }
      this._super(key, value);
    },
    refresh: function () {
      var rtl = this.element.css('direction') === 'rtl';
      this.buttons = this.element.find(this.options.items).filter(':ui-button').button('refresh').end().not(':ui-button').button().end().map(function () {
        return $(this).button('widget')[0];
      }).removeClass('ui-corner-all ui-corner-left ui-corner-right').filter(':first').addClass(rtl ? 'ui-corner-right' : 'ui-corner-left').end().filter(':last').addClass(rtl ? 'ui-corner-left' : 'ui-corner-right').end().end();
    },
    _destroy: function () {
      this.element.removeClass('ui-buttonset');
      this.buttons.map(function () {
        return $(this).button('widget')[0];
      }).removeClass('ui-corner-left ui-corner-right').end().button('destroy');
    }
  });
}(jQuery));
(function ($, undefined) {
  $.extend($.ui, { datepicker: { version: '1.9.2' } });
  var PROP_NAME = 'datepicker';
  var dpuuid = new Date().getTime();
  var instActive;
  function Datepicker() {
    this.debug = false;
    this._curInst = null;
    this._keyEvent = false;
    this._disabledInputs = [];
    this._datepickerShowing = false;
    this._inDialog = false;
    this._mainDivId = 'ui-datepicker-div';
    this._inlineClass = 'ui-datepicker-inline';
    this._appendClass = 'ui-datepicker-append';
    this._triggerClass = 'ui-datepicker-trigger';
    this._dialogClass = 'ui-datepicker-dialog';
    this._disableClass = 'ui-datepicker-disabled';
    this._unselectableClass = 'ui-datepicker-unselectable';
    this._currentClass = 'ui-datepicker-current-day';
    this._dayOverClass = 'ui-datepicker-days-cell-over';
    this.regional = [];
    this.regional[''] = {
      closeText: 'Done',
      prevText: 'Prev',
      nextText: 'Next',
      currentText: 'Today',
      monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      monthNamesShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      dayNames: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      dayNamesShort: [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ],
      dayNamesMin: [
        'Su',
        'Mo',
        'Tu',
        'We',
        'Th',
        'Fr',
        'Sa'
      ],
      weekHeader: 'Wk',
      dateFormat: 'mm/dd/yy',
      firstDay: 0,
      isRTL: false,
      showMonthAfterYear: false,
      yearSuffix: ''
    };
    this._defaults = {
      showOn: 'focus',
      showAnim: 'fadeIn',
      showOptions: {},
      defaultDate: null,
      appendText: '',
      buttonText: '...',
      buttonImage: '',
      buttonImageOnly: false,
      hideIfNoPrevNext: false,
      navigationAsDateFormat: false,
      gotoCurrent: false,
      changeMonth: false,
      changeYear: false,
      yearRange: 'c-10:c+10',
      showOtherMonths: false,
      selectOtherMonths: false,
      showWeek: false,
      calculateWeek: this.iso8601Week,
      shortYearCutoff: '+10',
      minDate: null,
      maxDate: null,
      duration: 'fast',
      beforeShowDay: null,
      beforeShow: null,
      onSelect: null,
      onChangeMonthYear: null,
      onClose: null,
      numberOfMonths: 1,
      showCurrentAtPos: 0,
      stepMonths: 1,
      stepBigMonths: 12,
      altField: '',
      altFormat: '',
      constrainInput: true,
      showButtonPanel: false,
      autoSize: false,
      disabled: false
    };
    $.extend(this._defaults, this.regional['']);
    this.dpDiv = bindHover($('<div id="' + this._mainDivId + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'));
  }
  $.extend(Datepicker.prototype, {
    markerClassName: 'hasDatepicker',
    maxRows: 4,
    log: function () {
      if (this.debug)
        console.log.apply('', arguments);
    },
    _widgetDatepicker: function () {
      return this.dpDiv;
    },
    setDefaults: function (settings) {
      extendRemove(this._defaults, settings || {});
      return this;
    },
    _attachDatepicker: function (target, settings) {
      var inlineSettings = null;
      for (var attrName in this._defaults) {
        var attrValue = target.getAttribute('date:' + attrName);
        if (attrValue) {
          inlineSettings = inlineSettings || {};
          try {
            inlineSettings[attrName] = eval(attrValue);
          } catch (err) {
            inlineSettings[attrName] = attrValue;
          }
        }
      }
      var nodeName = target.nodeName.toLowerCase();
      var inline = nodeName == 'div' || nodeName == 'span';
      if (!target.id) {
        this.uuid += 1;
        target.id = 'dp' + this.uuid;
      }
      var inst = this._newInst($(target), inline);
      inst.settings = $.extend({}, settings || {}, inlineSettings || {});
      if (nodeName == 'input') {
        this._connectDatepicker(target, inst);
      } else if (inline) {
        this._inlineDatepicker(target, inst);
      }
    },
    _newInst: function (target, inline) {
      var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
      return {
        id: id,
        input: target,
        selectedDay: 0,
        selectedMonth: 0,
        selectedYear: 0,
        drawMonth: 0,
        drawYear: 0,
        inline: inline,
        dpDiv: !inline ? this.dpDiv : bindHover($('<div class="' + this._inlineClass + ' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'))
      };
    },
    _connectDatepicker: function (target, inst) {
      var input = $(target);
      inst.append = $([]);
      inst.trigger = $([]);
      if (input.hasClass(this.markerClassName))
        return;
      this._attachments(input, inst);
      input.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(this._doKeyPress).keyup(this._doKeyUp).bind('setData.datepicker', function (event, key, value) {
        inst.settings[key] = value;
      }).bind('getData.datepicker', function (event, key) {
        return this._get(inst, key);
      });
      this._autoSize(inst);
      $.data(target, PROP_NAME, inst);
      if (inst.settings.disabled) {
        this._disableDatepicker(target);
      }
    },
    _attachments: function (input, inst) {
      var appendText = this._get(inst, 'appendText');
      var isRTL = this._get(inst, 'isRTL');
      if (inst.append)
        inst.append.remove();
      if (appendText) {
        inst.append = $('<span class="' + this._appendClass + '">' + appendText + '</span>');
        input[isRTL ? 'before' : 'after'](inst.append);
      }
      input.unbind('focus', this._showDatepicker);
      if (inst.trigger)
        inst.trigger.remove();
      var showOn = this._get(inst, 'showOn');
      if (showOn == 'focus' || showOn == 'both')
        input.focus(this._showDatepicker);
      if (showOn == 'button' || showOn == 'both') {
        var buttonText = this._get(inst, 'buttonText');
        var buttonImage = this._get(inst, 'buttonImage');
        inst.trigger = $(this._get(inst, 'buttonImageOnly') ? $('<img/>').addClass(this._triggerClass).attr({
          src: buttonImage,
          alt: buttonText,
          title: buttonText
        }) : $('<button type="button"></button>').addClass(this._triggerClass).html(buttonImage == '' ? buttonText : $('<img/>').attr({
          src: buttonImage,
          alt: buttonText,
          title: buttonText
        })));
        input[isRTL ? 'before' : 'after'](inst.trigger);
        inst.trigger.click(function () {
          if ($.datepicker._datepickerShowing && $.datepicker._lastInput == input[0])
            $.datepicker._hideDatepicker();
          else if ($.datepicker._datepickerShowing && $.datepicker._lastInput != input[0]) {
            $.datepicker._hideDatepicker();
            $.datepicker._showDatepicker(input[0]);
          } else
            $.datepicker._showDatepicker(input[0]);
          return false;
        });
      }
    },
    _autoSize: function (inst) {
      if (this._get(inst, 'autoSize') && !inst.inline) {
        var date = new Date(2009, 12 - 1, 20);
        var dateFormat = this._get(inst, 'dateFormat');
        if (dateFormat.match(/[DM]/)) {
          var findMax = function (names) {
            var max = 0;
            var maxI = 0;
            for (var i = 0; i < names.length; i++) {
              if (names[i].length > max) {
                max = names[i].length;
                maxI = i;
              }
            }
            return maxI;
          };
          date.setMonth(findMax(this._get(inst, dateFormat.match(/MM/) ? 'monthNames' : 'monthNamesShort')));
          date.setDate(findMax(this._get(inst, dateFormat.match(/DD/) ? 'dayNames' : 'dayNamesShort')) + 20 - date.getDay());
        }
        inst.input.attr('size', this._formatDate(inst, date).length);
      }
    },
    _inlineDatepicker: function (target, inst) {
      var divSpan = $(target);
      if (divSpan.hasClass(this.markerClassName))
        return;
      divSpan.addClass(this.markerClassName).append(inst.dpDiv).bind('setData.datepicker', function (event, key, value) {
        inst.settings[key] = value;
      }).bind('getData.datepicker', function (event, key) {
        return this._get(inst, key);
      });
      $.data(target, PROP_NAME, inst);
      this._setDate(inst, this._getDefaultDate(inst), true);
      this._updateDatepicker(inst);
      this._updateAlternate(inst);
      if (inst.settings.disabled) {
        this._disableDatepicker(target);
      }
      inst.dpDiv.css('display', 'block');
    },
    _dialogDatepicker: function (input, date, onSelect, settings, pos) {
      var inst = this._dialogInst;
      if (!inst) {
        this.uuid += 1;
        var id = 'dp' + this.uuid;
        this._dialogInput = $('<input type="text" id="' + id + '" style="position: absolute; top: -100px; width: 0px;"/>');
        this._dialogInput.keydown(this._doKeyDown);
        $('body').append(this._dialogInput);
        inst = this._dialogInst = this._newInst(this._dialogInput, false);
        inst.settings = {};
        $.data(this._dialogInput[0], PROP_NAME, inst);
      }
      extendRemove(inst.settings, settings || {});
      date = date && date.constructor == Date ? this._formatDate(inst, date) : date;
      this._dialogInput.val(date);
      this._pos = pos ? pos.length ? pos : [
        pos.pageX,
        pos.pageY
      ] : null;
      if (!this._pos) {
        var browserWidth = document.documentElement.clientWidth;
        var browserHeight = document.documentElement.clientHeight;
        var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        this._pos = [
          browserWidth / 2 - 100 + scrollX,
          browserHeight / 2 - 150 + scrollY
        ];
      }
      this._dialogInput.css('left', this._pos[0] + 20 + 'px').css('top', this._pos[1] + 'px');
      inst.settings.onSelect = onSelect;
      this._inDialog = true;
      this.dpDiv.addClass(this._dialogClass);
      this._showDatepicker(this._dialogInput[0]);
      if ($.blockUI)
        $.blockUI(this.dpDiv);
      $.data(this._dialogInput[0], PROP_NAME, inst);
      return this;
    },
    _destroyDatepicker: function (target) {
      var $target = $(target);
      var inst = $.data(target, PROP_NAME);
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      var nodeName = target.nodeName.toLowerCase();
      $.removeData(target, PROP_NAME);
      if (nodeName == 'input') {
        inst.append.remove();
        inst.trigger.remove();
        $target.removeClass(this.markerClassName).unbind('focus', this._showDatepicker).unbind('keydown', this._doKeyDown).unbind('keypress', this._doKeyPress).unbind('keyup', this._doKeyUp);
      } else if (nodeName == 'div' || nodeName == 'span')
        $target.removeClass(this.markerClassName).empty();
    },
    _enableDatepicker: function (target) {
      var $target = $(target);
      var inst = $.data(target, PROP_NAME);
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      var nodeName = target.nodeName.toLowerCase();
      if (nodeName == 'input') {
        target.disabled = false;
        inst.trigger.filter('button').each(function () {
          this.disabled = false;
        }).end().filter('img').css({
          opacity: '1.0',
          cursor: ''
        });
      } else if (nodeName == 'div' || nodeName == 'span') {
        var inline = $target.children('.' + this._inlineClass);
        inline.children().removeClass('ui-state-disabled');
        inline.find('select.ui-datepicker-month, select.ui-datepicker-year').prop('disabled', false);
      }
      this._disabledInputs = $.map(this._disabledInputs, function (value) {
        return value == target ? null : value;
      });
    },
    _disableDatepicker: function (target) {
      var $target = $(target);
      var inst = $.data(target, PROP_NAME);
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      var nodeName = target.nodeName.toLowerCase();
      if (nodeName == 'input') {
        target.disabled = true;
        inst.trigger.filter('button').each(function () {
          this.disabled = true;
        }).end().filter('img').css({
          opacity: '0.5',
          cursor: 'default'
        });
      } else if (nodeName == 'div' || nodeName == 'span') {
        var inline = $target.children('.' + this._inlineClass);
        inline.children().addClass('ui-state-disabled');
        inline.find('select.ui-datepicker-month, select.ui-datepicker-year').prop('disabled', true);
      }
      this._disabledInputs = $.map(this._disabledInputs, function (value) {
        return value == target ? null : value;
      });
      this._disabledInputs[this._disabledInputs.length] = target;
    },
    _isDisabledDatepicker: function (target) {
      if (!target) {
        return false;
      }
      for (var i = 0; i < this._disabledInputs.length; i++) {
        if (this._disabledInputs[i] == target)
          return true;
      }
      return false;
    },
    _getInst: function (target) {
      try {
        return $.data(target, PROP_NAME);
      } catch (err) {
        throw 'Missing instance data for this datepicker';
      }
    },
    _optionDatepicker: function (target, name, value) {
      var inst = this._getInst(target);
      if (arguments.length == 2 && typeof name == 'string') {
        return name == 'defaults' ? $.extend({}, $.datepicker._defaults) : inst ? name == 'all' ? $.extend({}, inst.settings) : this._get(inst, name) : null;
      }
      var settings = name || {};
      if (typeof name == 'string') {
        settings = {};
        settings[name] = value;
      }
      if (inst) {
        if (this._curInst == inst) {
          this._hideDatepicker();
        }
        var date = this._getDateDatepicker(target, true);
        var minDate = this._getMinMaxDate(inst, 'min');
        var maxDate = this._getMinMaxDate(inst, 'max');
        extendRemove(inst.settings, settings);
        if (minDate !== null && settings['dateFormat'] !== undefined && settings['minDate'] === undefined)
          inst.settings.minDate = this._formatDate(inst, minDate);
        if (maxDate !== null && settings['dateFormat'] !== undefined && settings['maxDate'] === undefined)
          inst.settings.maxDate = this._formatDate(inst, maxDate);
        this._attachments($(target), inst);
        this._autoSize(inst);
        this._setDate(inst, date);
        this._updateAlternate(inst);
        this._updateDatepicker(inst);
      }
    },
    _changeDatepicker: function (target, name, value) {
      this._optionDatepicker(target, name, value);
    },
    _refreshDatepicker: function (target) {
      var inst = this._getInst(target);
      if (inst) {
        this._updateDatepicker(inst);
      }
    },
    _setDateDatepicker: function (target, date) {
      var inst = this._getInst(target);
      if (inst) {
        this._setDate(inst, date);
        this._updateDatepicker(inst);
        this._updateAlternate(inst);
      }
    },
    _getDateDatepicker: function (target, noDefault) {
      var inst = this._getInst(target);
      if (inst && !inst.inline)
        this._setDateFromField(inst, noDefault);
      return inst ? this._getDate(inst) : null;
    },
    _doKeyDown: function (event) {
      var inst = $.datepicker._getInst(event.target);
      var handled = true;
      var isRTL = inst.dpDiv.is('.ui-datepicker-rtl');
      inst._keyEvent = true;
      if ($.datepicker._datepickerShowing)
        switch (event.keyCode) {
        case 9:
          $.datepicker._hideDatepicker();
          handled = false;
          break;
        case 13:
          var sel = $('td.' + $.datepicker._dayOverClass + ':not(.' + $.datepicker._currentClass + ')', inst.dpDiv);
          if (sel[0])
            $.datepicker._selectDay(event.target, inst.selectedMonth, inst.selectedYear, sel[0]);
          var onSelect = $.datepicker._get(inst, 'onSelect');
          if (onSelect) {
            var dateStr = $.datepicker._formatDate(inst);
            onSelect.apply(inst.input ? inst.input[0] : null, [
              dateStr,
              inst
            ]);
          } else
            $.datepicker._hideDatepicker();
          return false;
          break;
        case 27:
          $.datepicker._hideDatepicker();
          break;
        case 33:
          $.datepicker._adjustDate(event.target, event.ctrlKey ? -$.datepicker._get(inst, 'stepBigMonths') : -$.datepicker._get(inst, 'stepMonths'), 'M');
          break;
        case 34:
          $.datepicker._adjustDate(event.target, event.ctrlKey ? +$.datepicker._get(inst, 'stepBigMonths') : +$.datepicker._get(inst, 'stepMonths'), 'M');
          break;
        case 35:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._clearDate(event.target);
          handled = event.ctrlKey || event.metaKey;
          break;
        case 36:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._gotoToday(event.target);
          handled = event.ctrlKey || event.metaKey;
          break;
        case 37:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._adjustDate(event.target, isRTL ? +1 : -1, 'D');
          handled = event.ctrlKey || event.metaKey;
          if (event.originalEvent.altKey)
            $.datepicker._adjustDate(event.target, event.ctrlKey ? -$.datepicker._get(inst, 'stepBigMonths') : -$.datepicker._get(inst, 'stepMonths'), 'M');
          break;
        case 38:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._adjustDate(event.target, -7, 'D');
          handled = event.ctrlKey || event.metaKey;
          break;
        case 39:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._adjustDate(event.target, isRTL ? -1 : +1, 'D');
          handled = event.ctrlKey || event.metaKey;
          if (event.originalEvent.altKey)
            $.datepicker._adjustDate(event.target, event.ctrlKey ? +$.datepicker._get(inst, 'stepBigMonths') : +$.datepicker._get(inst, 'stepMonths'), 'M');
          break;
        case 40:
          if (event.ctrlKey || event.metaKey)
            $.datepicker._adjustDate(event.target, +7, 'D');
          handled = event.ctrlKey || event.metaKey;
          break;
        default:
          handled = false;
        }
      else if (event.keyCode == 36 && event.ctrlKey)
        $.datepicker._showDatepicker(this);
      else {
        handled = false;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _doKeyPress: function (event) {
      var inst = $.datepicker._getInst(event.target);
      if ($.datepicker._get(inst, 'constrainInput')) {
        var chars = $.datepicker._possibleChars($.datepicker._get(inst, 'dateFormat'));
        var chr = String.fromCharCode(event.charCode == undefined ? event.keyCode : event.charCode);
        return event.ctrlKey || event.metaKey || (chr < ' ' || !chars || chars.indexOf(chr) > -1);
      }
    },
    _doKeyUp: function (event) {
      var inst = $.datepicker._getInst(event.target);
      if (inst.input.val() != inst.lastVal) {
        try {
          var date = $.datepicker.parseDate($.datepicker._get(inst, 'dateFormat'), inst.input ? inst.input.val() : null, $.datepicker._getFormatConfig(inst));
          if (date) {
            $.datepicker._setDateFromField(inst);
            $.datepicker._updateAlternate(inst);
            $.datepicker._updateDatepicker(inst);
          }
        } catch (err) {
          $.datepicker.log(err);
        }
      }
      return true;
    },
    _showDatepicker: function (input) {
      input = input.target || input;
      if (input.nodeName.toLowerCase() != 'input')
        input = $('input', input.parentNode)[0];
      if ($.datepicker._isDisabledDatepicker(input) || $.datepicker._lastInput == input)
        return;
      var inst = $.datepicker._getInst(input);
      if ($.datepicker._curInst && $.datepicker._curInst != inst) {
        $.datepicker._curInst.dpDiv.stop(true, true);
        if (inst && $.datepicker._datepickerShowing) {
          $.datepicker._hideDatepicker($.datepicker._curInst.input[0]);
        }
      }
      var beforeShow = $.datepicker._get(inst, 'beforeShow');
      var beforeShowSettings = beforeShow ? beforeShow.apply(input, [
          input,
          inst
        ]) : {};
      if (beforeShowSettings === false) {
        return;
      }
      extendRemove(inst.settings, beforeShowSettings);
      inst.lastVal = null;
      $.datepicker._lastInput = input;
      $.datepicker._setDateFromField(inst);
      if ($.datepicker._inDialog)
        input.value = '';
      if (!$.datepicker._pos) {
        $.datepicker._pos = $.datepicker._findPos(input);
        $.datepicker._pos[1] += input.offsetHeight;
      }
      var isFixed = false;
      $(input).parents().each(function () {
        isFixed |= $(this).css('position') == 'fixed';
        return !isFixed;
      });
      var offset = {
          left: $.datepicker._pos[0],
          top: $.datepicker._pos[1]
        };
      $.datepicker._pos = null;
      inst.dpDiv.empty();
      inst.dpDiv.css({
        position: 'absolute',
        display: 'block',
        top: '-1000px'
      });
      $.datepicker._updateDatepicker(inst);
      offset = $.datepicker._checkOffset(inst, offset, isFixed);
      inst.dpDiv.css({
        position: $.datepicker._inDialog && $.blockUI ? 'static' : isFixed ? 'fixed' : 'absolute',
        display: 'none',
        left: offset.left + 'px',
        top: offset.top + 'px'
      });
      if (!inst.inline) {
        var showAnim = $.datepicker._get(inst, 'showAnim');
        var duration = $.datepicker._get(inst, 'duration');
        var postProcess = function () {
          var cover = inst.dpDiv.find('iframe.ui-datepicker-cover');
          if (!!cover.length) {
            var borders = $.datepicker._getBorders(inst.dpDiv);
            cover.css({
              left: -borders[0],
              top: -borders[1],
              width: inst.dpDiv.outerWidth(),
              height: inst.dpDiv.outerHeight()
            });
          }
        };
        inst.dpDiv.zIndex($(input).zIndex() + 1);
        $.datepicker._datepickerShowing = true;
        if ($.effects && ($.effects.effect[showAnim] || $.effects[showAnim]))
          inst.dpDiv.show(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
        else
          inst.dpDiv[showAnim || 'show'](showAnim ? duration : null, postProcess);
        if (!showAnim || !duration)
          postProcess();
        if (inst.input.is(':visible') && !inst.input.is(':disabled'))
          inst.input.focus();
        $.datepicker._curInst = inst;
      }
    },
    _updateDatepicker: function (inst) {
      this.maxRows = 4;
      var borders = $.datepicker._getBorders(inst.dpDiv);
      instActive = inst;
      inst.dpDiv.empty().append(this._generateHTML(inst));
      this._attachHandlers(inst);
      var cover = inst.dpDiv.find('iframe.ui-datepicker-cover');
      if (!!cover.length) {
        cover.css({
          left: -borders[0],
          top: -borders[1],
          width: inst.dpDiv.outerWidth(),
          height: inst.dpDiv.outerHeight()
        });
      }
      inst.dpDiv.find('.' + this._dayOverClass + ' a').mouseover();
      var numMonths = this._getNumberOfMonths(inst);
      var cols = numMonths[1];
      var width = 17;
      inst.dpDiv.removeClass('ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4').width('');
      if (cols > 1)
        inst.dpDiv.addClass('ui-datepicker-multi-' + cols).css('width', width * cols + 'em');
      inst.dpDiv[(numMonths[0] != 1 || numMonths[1] != 1 ? 'add' : 'remove') + 'Class']('ui-datepicker-multi');
      inst.dpDiv[(this._get(inst, 'isRTL') ? 'add' : 'remove') + 'Class']('ui-datepicker-rtl');
      if (inst == $.datepicker._curInst && $.datepicker._datepickerShowing && inst.input && inst.input.is(':visible') && !inst.input.is(':disabled') && inst.input[0] != document.activeElement)
        inst.input.focus();
      if (inst.yearshtml) {
        var origyearshtml = inst.yearshtml;
        setTimeout(function () {
          if (origyearshtml === inst.yearshtml && inst.yearshtml) {
            inst.dpDiv.find('select.ui-datepicker-year:first').replaceWith(inst.yearshtml);
          }
          origyearshtml = inst.yearshtml = null;
        }, 0);
      }
    },
    _getBorders: function (elem) {
      var convert = function (value) {
        return {
          thin: 1,
          medium: 2,
          thick: 3
        }[value] || value;
      };
      return [
        parseFloat(convert(elem.css('border-left-width'))),
        parseFloat(convert(elem.css('border-top-width')))
      ];
    },
    _checkOffset: function (inst, offset, isFixed) {
      var dpWidth = inst.dpDiv.outerWidth();
      var dpHeight = inst.dpDiv.outerHeight();
      var inputWidth = inst.input ? inst.input.outerWidth() : 0;
      var inputHeight = inst.input ? inst.input.outerHeight() : 0;
      var viewWidth = document.documentElement.clientWidth + (isFixed ? 0 : $(document).scrollLeft());
      var viewHeight = document.documentElement.clientHeight + (isFixed ? 0 : $(document).scrollTop());
      offset.left -= this._get(inst, 'isRTL') ? dpWidth - inputWidth : 0;
      offset.left -= isFixed && offset.left == inst.input.offset().left ? $(document).scrollLeft() : 0;
      offset.top -= isFixed && offset.top == inst.input.offset().top + inputHeight ? $(document).scrollTop() : 0;
      offset.left -= Math.min(offset.left, offset.left + dpWidth > viewWidth && viewWidth > dpWidth ? Math.abs(offset.left + dpWidth - viewWidth) : 0);
      offset.top -= Math.min(offset.top, offset.top + dpHeight > viewHeight && viewHeight > dpHeight ? Math.abs(dpHeight + inputHeight) : 0);
      return offset;
    },
    _findPos: function (obj) {
      var inst = this._getInst(obj);
      var isRTL = this._get(inst, 'isRTL');
      while (obj && (obj.type == 'hidden' || obj.nodeType != 1 || $.expr.filters.hidden(obj))) {
        obj = obj[isRTL ? 'previousSibling' : 'nextSibling'];
      }
      var position = $(obj).offset();
      return [
        position.left,
        position.top
      ];
    },
    _hideDatepicker: function (input) {
      var inst = this._curInst;
      if (!inst || input && inst != $.data(input, PROP_NAME))
        return;
      if (this._datepickerShowing) {
        var showAnim = this._get(inst, 'showAnim');
        var duration = this._get(inst, 'duration');
        var postProcess = function () {
          $.datepicker._tidyDialog(inst);
        };
        if ($.effects && ($.effects.effect[showAnim] || $.effects[showAnim]))
          inst.dpDiv.hide(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
        else
          inst.dpDiv[showAnim == 'slideDown' ? 'slideUp' : showAnim == 'fadeIn' ? 'fadeOut' : 'hide'](showAnim ? duration : null, postProcess);
        if (!showAnim)
          postProcess();
        this._datepickerShowing = false;
        var onClose = this._get(inst, 'onClose');
        if (onClose)
          onClose.apply(inst.input ? inst.input[0] : null, [
            inst.input ? inst.input.val() : '',
            inst
          ]);
        this._lastInput = null;
        if (this._inDialog) {
          this._dialogInput.css({
            position: 'absolute',
            left: '0',
            top: '-100px'
          });
          if ($.blockUI) {
            $.unblockUI();
            $('body').append(this.dpDiv);
          }
        }
        this._inDialog = false;
      }
    },
    _tidyDialog: function (inst) {
      inst.dpDiv.removeClass(this._dialogClass).unbind('.ui-datepicker-calendar');
    },
    _checkExternalClick: function (event) {
      if (!$.datepicker._curInst)
        return;
      var $target = $(event.target), inst = $.datepicker._getInst($target[0]);
      if ($target[0].id != $.datepicker._mainDivId && $target.parents('#' + $.datepicker._mainDivId).length == 0 && !$target.hasClass($.datepicker.markerClassName) && !$target.closest('.' + $.datepicker._triggerClass).length && $.datepicker._datepickerShowing && !($.datepicker._inDialog && $.blockUI) || $target.hasClass($.datepicker.markerClassName) && $.datepicker._curInst != inst)
        $.datepicker._hideDatepicker();
    },
    _adjustDate: function (id, offset, period) {
      var target = $(id);
      var inst = this._getInst(target[0]);
      if (this._isDisabledDatepicker(target[0])) {
        return;
      }
      this._adjustInstDate(inst, offset + (period == 'M' ? this._get(inst, 'showCurrentAtPos') : 0), period);
      this._updateDatepicker(inst);
    },
    _gotoToday: function (id) {
      var target = $(id);
      var inst = this._getInst(target[0]);
      if (this._get(inst, 'gotoCurrent') && inst.currentDay) {
        inst.selectedDay = inst.currentDay;
        inst.drawMonth = inst.selectedMonth = inst.currentMonth;
        inst.drawYear = inst.selectedYear = inst.currentYear;
      } else {
        var date = new Date();
        inst.selectedDay = date.getDate();
        inst.drawMonth = inst.selectedMonth = date.getMonth();
        inst.drawYear = inst.selectedYear = date.getFullYear();
      }
      this._notifyChange(inst);
      this._adjustDate(target);
    },
    _selectMonthYear: function (id, select, period) {
      var target = $(id);
      var inst = this._getInst(target[0]);
      inst['selected' + (period == 'M' ? 'Month' : 'Year')] = inst['draw' + (period == 'M' ? 'Month' : 'Year')] = parseInt(select.options[select.selectedIndex].value, 10);
      this._notifyChange(inst);
      this._adjustDate(target);
    },
    _selectDay: function (id, month, year, td) {
      var target = $(id);
      if ($(td).hasClass(this._unselectableClass) || this._isDisabledDatepicker(target[0])) {
        return;
      }
      var inst = this._getInst(target[0]);
      inst.selectedDay = inst.currentDay = $('a', td).html();
      inst.selectedMonth = inst.currentMonth = month;
      inst.selectedYear = inst.currentYear = year;
      this._selectDate(id, this._formatDate(inst, inst.currentDay, inst.currentMonth, inst.currentYear));
    },
    _clearDate: function (id) {
      var target = $(id);
      var inst = this._getInst(target[0]);
      this._selectDate(target, '');
    },
    _selectDate: function (id, dateStr) {
      var target = $(id);
      var inst = this._getInst(target[0]);
      dateStr = dateStr != null ? dateStr : this._formatDate(inst);
      if (inst.input)
        inst.input.val(dateStr);
      this._updateAlternate(inst);
      var onSelect = this._get(inst, 'onSelect');
      if (onSelect)
        onSelect.apply(inst.input ? inst.input[0] : null, [
          dateStr,
          inst
        ]);
      else if (inst.input)
        inst.input.trigger('change');
      if (inst.inline)
        this._updateDatepicker(inst);
      else {
        this._hideDatepicker();
        this._lastInput = inst.input[0];
        if (typeof inst.input[0] != 'object')
          inst.input.focus();
        this._lastInput = null;
      }
    },
    _updateAlternate: function (inst) {
      var altField = this._get(inst, 'altField');
      if (altField) {
        var altFormat = this._get(inst, 'altFormat') || this._get(inst, 'dateFormat');
        var date = this._getDate(inst);
        var dateStr = this.formatDate(altFormat, date, this._getFormatConfig(inst));
        $(altField).each(function () {
          $(this).val(dateStr);
        });
      }
    },
    noWeekends: function (date) {
      var day = date.getDay();
      return [
        day > 0 && day < 6,
        ''
      ];
    },
    iso8601Week: function (date) {
      var checkDate = new Date(date.getTime());
      checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
      var time = checkDate.getTime();
      checkDate.setMonth(0);
      checkDate.setDate(1);
      return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
    },
    parseDate: function (format, value, settings) {
      if (format == null || value == null)
        throw 'Invalid arguments';
      value = typeof value == 'object' ? value.toString() : value + '';
      if (value == '')
        return null;
      var shortYearCutoff = (settings ? settings.shortYearCutoff : null) || this._defaults.shortYearCutoff;
      shortYearCutoff = typeof shortYearCutoff != 'string' ? shortYearCutoff : new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10);
      var dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort;
      var dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames;
      var monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort;
      var monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames;
      var year = -1;
      var month = -1;
      var day = -1;
      var doy = -1;
      var literal = false;
      var lookAhead = function (match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) == match;
        if (matches)
          iFormat++;
        return matches;
      };
      var getNumber = function (match) {
        var isDoubled = lookAhead(match);
        var size = match == '@' ? 14 : match == '!' ? 20 : match == 'y' && isDoubled ? 4 : match == 'o' ? 3 : 2;
        var digits = new RegExp('^\\d{1,' + size + '}');
        var num = value.substring(iValue).match(digits);
        if (!num)
          throw 'Missing number at position ' + iValue;
        iValue += num[0].length;
        return parseInt(num[0], 10);
      };
      var getName = function (match, shortNames, longNames) {
        var names = $.map(lookAhead(match) ? longNames : shortNames, function (v, k) {
            return [[
                k,
                v
              ]];
          }).sort(function (a, b) {
            return -(a[1].length - b[1].length);
          });
        var index = -1;
        $.each(names, function (i, pair) {
          var name = pair[1];
          if (value.substr(iValue, name.length).toLowerCase() == name.toLowerCase()) {
            index = pair[0];
            iValue += name.length;
            return false;
          }
        });
        if (index != -1)
          return index + 1;
        else
          throw 'Unknown name at position ' + iValue;
      };
      var checkLiteral = function () {
        if (value.charAt(iValue) != format.charAt(iFormat))
          throw 'Unexpected literal at position ' + iValue;
        iValue++;
      };
      var iValue = 0;
      for (var iFormat = 0; iFormat < format.length; iFormat++) {
        if (literal)
          if (format.charAt(iFormat) == '\'' && !lookAhead('\''))
            literal = false;
          else
            checkLiteral();
        else
          switch (format.charAt(iFormat)) {
          case 'd':
            day = getNumber('d');
            break;
          case 'D':
            getName('D', dayNamesShort, dayNames);
            break;
          case 'o':
            doy = getNumber('o');
            break;
          case 'm':
            month = getNumber('m');
            break;
          case 'M':
            month = getName('M', monthNamesShort, monthNames);
            break;
          case 'y':
            year = getNumber('y');
            break;
          case '@':
            var date = new Date(getNumber('@'));
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
            break;
          case '!':
            var date = new Date((getNumber('!') - this._ticksTo1970) / 10000);
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
            break;
          case '\'':
            if (lookAhead('\''))
              checkLiteral();
            else
              literal = true;
            break;
          default:
            checkLiteral();
          }
      }
      if (iValue < value.length) {
        var extra = value.substr(iValue);
        if (!/^\s+/.test(extra)) {
          throw 'Extra/unparsed characters found in date: ' + extra;
        }
      }
      if (year == -1)
        year = new Date().getFullYear();
      else if (year < 100)
        year += new Date().getFullYear() - new Date().getFullYear() % 100 + (year <= shortYearCutoff ? 0 : -100);
      if (doy > -1) {
        month = 1;
        day = doy;
        do {
          var dim = this._getDaysInMonth(year, month - 1);
          if (day <= dim)
            break;
          month++;
          day -= dim;
        } while (true);
      }
      var date = this._daylightSavingAdjust(new Date(year, month - 1, day));
      if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day)
        throw 'Invalid date';
      return date;
    },
    ATOM: 'yy-mm-dd',
    COOKIE: 'D, dd M yy',
    ISO_8601: 'yy-mm-dd',
    RFC_822: 'D, d M y',
    RFC_850: 'DD, dd-M-y',
    RFC_1036: 'D, d M y',
    RFC_1123: 'D, d M yy',
    RFC_2822: 'D, d M yy',
    RSS: 'D, d M y',
    TICKS: '!',
    TIMESTAMP: '@',
    W3C: 'yy-mm-dd',
    _ticksTo1970: ((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000,
    formatDate: function (format, date, settings) {
      if (!date)
        return '';
      var dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort;
      var dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames;
      var monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort;
      var monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames;
      var lookAhead = function (match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) == match;
        if (matches)
          iFormat++;
        return matches;
      };
      var formatNumber = function (match, value, len) {
        var num = '' + value;
        if (lookAhead(match))
          while (num.length < len)
            num = '0' + num;
        return num;
      };
      var formatName = function (match, value, shortNames, longNames) {
        return lookAhead(match) ? longNames[value] : shortNames[value];
      };
      var output = '';
      var literal = false;
      if (date)
        for (var iFormat = 0; iFormat < format.length; iFormat++) {
          if (literal)
            if (format.charAt(iFormat) == '\'' && !lookAhead('\''))
              literal = false;
            else
              output += format.charAt(iFormat);
          else
            switch (format.charAt(iFormat)) {
            case 'd':
              output += formatNumber('d', date.getDate(), 2);
              break;
            case 'D':
              output += formatName('D', date.getDay(), dayNamesShort, dayNames);
              break;
            case 'o':
              output += formatNumber('o', Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
              break;
            case 'm':
              output += formatNumber('m', date.getMonth() + 1, 2);
              break;
            case 'M':
              output += formatName('M', date.getMonth(), monthNamesShort, monthNames);
              break;
            case 'y':
              output += lookAhead('y') ? date.getFullYear() : (date.getYear() % 100 < 10 ? '0' : '') + date.getYear() % 100;
              break;
            case '@':
              output += date.getTime();
              break;
            case '!':
              output += date.getTime() * 10000 + this._ticksTo1970;
              break;
            case '\'':
              if (lookAhead('\''))
                output += '\'';
              else
                literal = true;
              break;
            default:
              output += format.charAt(iFormat);
            }
        }
      return output;
    },
    _possibleChars: function (format) {
      var chars = '';
      var literal = false;
      var lookAhead = function (match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) == match;
        if (matches)
          iFormat++;
        return matches;
      };
      for (var iFormat = 0; iFormat < format.length; iFormat++)
        if (literal)
          if (format.charAt(iFormat) == '\'' && !lookAhead('\''))
            literal = false;
          else
            chars += format.charAt(iFormat);
        else
          switch (format.charAt(iFormat)) {
          case 'd':
          case 'm':
          case 'y':
          case '@':
            chars += '0123456789';
            break;
          case 'D':
          case 'M':
            return null;
          case '\'':
            if (lookAhead('\''))
              chars += '\'';
            else
              literal = true;
            break;
          default:
            chars += format.charAt(iFormat);
          }
      return chars;
    },
    _get: function (inst, name) {
      return inst.settings[name] !== undefined ? inst.settings[name] : this._defaults[name];
    },
    _setDateFromField: function (inst, noDefault) {
      if (inst.input.val() == inst.lastVal) {
        return;
      }
      var dateFormat = this._get(inst, 'dateFormat');
      var dates = inst.lastVal = inst.input ? inst.input.val() : null;
      var date, defaultDate;
      date = defaultDate = this._getDefaultDate(inst);
      var settings = this._getFormatConfig(inst);
      try {
        date = this.parseDate(dateFormat, dates, settings) || defaultDate;
      } catch (event) {
        this.log(event);
        dates = noDefault ? '' : dates;
      }
      inst.selectedDay = date.getDate();
      inst.drawMonth = inst.selectedMonth = date.getMonth();
      inst.drawYear = inst.selectedYear = date.getFullYear();
      inst.currentDay = dates ? date.getDate() : 0;
      inst.currentMonth = dates ? date.getMonth() : 0;
      inst.currentYear = dates ? date.getFullYear() : 0;
      this._adjustInstDate(inst);
    },
    _getDefaultDate: function (inst) {
      return this._restrictMinMax(inst, this._determineDate(inst, this._get(inst, 'defaultDate'), new Date()));
    },
    _determineDate: function (inst, date, defaultDate) {
      var offsetNumeric = function (offset) {
        var date = new Date();
        date.setDate(date.getDate() + offset);
        return date;
      };
      var offsetString = function (offset) {
        try {
          return $.datepicker.parseDate($.datepicker._get(inst, 'dateFormat'), offset, $.datepicker._getFormatConfig(inst));
        } catch (e) {
        }
        var date = (offset.toLowerCase().match(/^c/) ? $.datepicker._getDate(inst) : null) || new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var pattern = /([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
        var matches = pattern.exec(offset);
        while (matches) {
          switch (matches[2] || 'd') {
          case 'd':
          case 'D':
            day += parseInt(matches[1], 10);
            break;
          case 'w':
          case 'W':
            day += parseInt(matches[1], 10) * 7;
            break;
          case 'm':
          case 'M':
            month += parseInt(matches[1], 10);
            day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
            break;
          case 'y':
          case 'Y':
            year += parseInt(matches[1], 10);
            day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
            break;
          }
          matches = pattern.exec(offset);
        }
        return new Date(year, month, day);
      };
      var newDate = date == null || date === '' ? defaultDate : typeof date == 'string' ? offsetString(date) : typeof date == 'number' ? isNaN(date) ? defaultDate : offsetNumeric(date) : new Date(date.getTime());
      newDate = newDate && newDate.toString() == 'Invalid Date' ? defaultDate : newDate;
      if (newDate) {
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
      }
      return this._daylightSavingAdjust(newDate);
    },
    _daylightSavingAdjust: function (date) {
      if (!date)
        return null;
      date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
      return date;
    },
    _setDate: function (inst, date, noChange) {
      var clear = !date;
      var origMonth = inst.selectedMonth;
      var origYear = inst.selectedYear;
      var newDate = this._restrictMinMax(inst, this._determineDate(inst, date, new Date()));
      inst.selectedDay = inst.currentDay = newDate.getDate();
      inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
      inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
      if ((origMonth != inst.selectedMonth || origYear != inst.selectedYear) && !noChange)
        this._notifyChange(inst);
      this._adjustInstDate(inst);
      if (inst.input) {
        inst.input.val(clear ? '' : this._formatDate(inst));
      }
    },
    _getDate: function (inst) {
      var startDate = !inst.currentYear || inst.input && inst.input.val() == '' ? null : this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay));
      return startDate;
    },
    _attachHandlers: function (inst) {
      var stepMonths = this._get(inst, 'stepMonths');
      var id = '#' + inst.id.replace(/\\\\/g, '\\');
      inst.dpDiv.find('[data-handler]').map(function () {
        var handler = {
            prev: function () {
              window['DP_jQuery_' + dpuuid].datepicker._adjustDate(id, -stepMonths, 'M');
            },
            next: function () {
              window['DP_jQuery_' + dpuuid].datepicker._adjustDate(id, +stepMonths, 'M');
            },
            hide: function () {
              window['DP_jQuery_' + dpuuid].datepicker._hideDatepicker();
            },
            today: function () {
              window['DP_jQuery_' + dpuuid].datepicker._gotoToday(id);
            },
            selectDay: function () {
              window['DP_jQuery_' + dpuuid].datepicker._selectDay(id, +this.getAttribute('data-month'), +this.getAttribute('data-year'), this);
              return false;
            },
            selectMonth: function () {
              window['DP_jQuery_' + dpuuid].datepicker._selectMonthYear(id, this, 'M');
              return false;
            },
            selectYear: function () {
              window['DP_jQuery_' + dpuuid].datepicker._selectMonthYear(id, this, 'Y');
              return false;
            }
          };
        $(this).bind(this.getAttribute('data-event'), handler[this.getAttribute('data-handler')]);
      });
    },
    _generateHTML: function (inst) {
      var today = new Date();
      today = this._daylightSavingAdjust(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      var isRTL = this._get(inst, 'isRTL');
      var showButtonPanel = this._get(inst, 'showButtonPanel');
      var hideIfNoPrevNext = this._get(inst, 'hideIfNoPrevNext');
      var navigationAsDateFormat = this._get(inst, 'navigationAsDateFormat');
      var numMonths = this._getNumberOfMonths(inst);
      var showCurrentAtPos = this._get(inst, 'showCurrentAtPos');
      var stepMonths = this._get(inst, 'stepMonths');
      var isMultiMonth = numMonths[0] != 1 || numMonths[1] != 1;
      var currentDate = this._daylightSavingAdjust(!inst.currentDay ? new Date(9999, 9, 9) : new Date(inst.currentYear, inst.currentMonth, inst.currentDay));
      var minDate = this._getMinMaxDate(inst, 'min');
      var maxDate = this._getMinMaxDate(inst, 'max');
      var drawMonth = inst.drawMonth - showCurrentAtPos;
      var drawYear = inst.drawYear;
      if (drawMonth < 0) {
        drawMonth += 12;
        drawYear--;
      }
      if (maxDate) {
        var maxDraw = this._daylightSavingAdjust(new Date(maxDate.getFullYear(), maxDate.getMonth() - numMonths[0] * numMonths[1] + 1, maxDate.getDate()));
        maxDraw = minDate && maxDraw < minDate ? minDate : maxDraw;
        while (this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
          drawMonth--;
          if (drawMonth < 0) {
            drawMonth = 11;
            drawYear--;
          }
        }
      }
      inst.drawMonth = drawMonth;
      inst.drawYear = drawYear;
      var prevText = this._get(inst, 'prevText');
      prevText = !navigationAsDateFormat ? prevText : this.formatDate(prevText, this._daylightSavingAdjust(new Date(drawYear, drawMonth - stepMonths, 1)), this._getFormatConfig(inst));
      var prev = this._canAdjustMonth(inst, -1, drawYear, drawMonth) ? '<a class="ui-datepicker-prev ui-corner-all" data-handler="prev" data-event="click"' + ' title="' + prevText + '"><span class="ui-icon ui-icon-circle-triangle-' + (isRTL ? 'e' : 'w') + '">' + prevText + '</span></a>' : hideIfNoPrevNext ? '' : '<a class="ui-datepicker-prev ui-corner-all ui-state-disabled" title="' + prevText + '"><span class="ui-icon ui-icon-circle-triangle-' + (isRTL ? 'e' : 'w') + '">' + prevText + '</span></a>';
      var nextText = this._get(inst, 'nextText');
      nextText = !navigationAsDateFormat ? nextText : this.formatDate(nextText, this._daylightSavingAdjust(new Date(drawYear, drawMonth + stepMonths, 1)), this._getFormatConfig(inst));
      var next = this._canAdjustMonth(inst, +1, drawYear, drawMonth) ? '<a class="ui-datepicker-next ui-corner-all" data-handler="next" data-event="click"' + ' title="' + nextText + '"><span class="ui-icon ui-icon-circle-triangle-' + (isRTL ? 'w' : 'e') + '">' + nextText + '</span></a>' : hideIfNoPrevNext ? '' : '<a class="ui-datepicker-next ui-corner-all ui-state-disabled" title="' + nextText + '"><span class="ui-icon ui-icon-circle-triangle-' + (isRTL ? 'w' : 'e') + '">' + nextText + '</span></a>';
      var currentText = this._get(inst, 'currentText');
      var gotoDate = this._get(inst, 'gotoCurrent') && inst.currentDay ? currentDate : today;
      currentText = !navigationAsDateFormat ? currentText : this.formatDate(currentText, gotoDate, this._getFormatConfig(inst));
      var controls = !inst.inline ? '<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" data-handler="hide" data-event="click">' + this._get(inst, 'closeText') + '</button>' : '';
      var buttonPanel = showButtonPanel ? '<div class="ui-datepicker-buttonpane ui-widget-content">' + (isRTL ? controls : '') + (this._isInRange(inst, gotoDate) ? '<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="today" data-event="click"' + '>' + currentText + '</button>' : '') + (isRTL ? '' : controls) + '</div>' : '';
      var firstDay = parseInt(this._get(inst, 'firstDay'), 10);
      firstDay = isNaN(firstDay) ? 0 : firstDay;
      var showWeek = this._get(inst, 'showWeek');
      var dayNames = this._get(inst, 'dayNames');
      var dayNamesShort = this._get(inst, 'dayNamesShort');
      var dayNamesMin = this._get(inst, 'dayNamesMin');
      var monthNames = this._get(inst, 'monthNames');
      var monthNamesShort = this._get(inst, 'monthNamesShort');
      var beforeShowDay = this._get(inst, 'beforeShowDay');
      var showOtherMonths = this._get(inst, 'showOtherMonths');
      var selectOtherMonths = this._get(inst, 'selectOtherMonths');
      var calculateWeek = this._get(inst, 'calculateWeek') || this.iso8601Week;
      var defaultDate = this._getDefaultDate(inst);
      var html = '';
      for (var row = 0; row < numMonths[0]; row++) {
        var group = '';
        this.maxRows = 4;
        for (var col = 0; col < numMonths[1]; col++) {
          var selectedDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));
          var cornerClass = ' ui-corner-all';
          var calender = '';
          if (isMultiMonth) {
            calender += '<div class="ui-datepicker-group';
            if (numMonths[1] > 1)
              switch (col) {
              case 0:
                calender += ' ui-datepicker-group-first';
                cornerClass = ' ui-corner-' + (isRTL ? 'right' : 'left');
                break;
              case numMonths[1] - 1:
                calender += ' ui-datepicker-group-last';
                cornerClass = ' ui-corner-' + (isRTL ? 'left' : 'right');
                break;
              default:
                calender += ' ui-datepicker-group-middle';
                cornerClass = '';
                break;
              }
            calender += '">';
          }
          calender += '<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix' + cornerClass + '">' + (/all|left/.test(cornerClass) && row == 0 ? isRTL ? next : prev : '') + (/all|right/.test(cornerClass) && row == 0 ? isRTL ? prev : next : '') + this._generateMonthYearHeader(inst, drawMonth, drawYear, minDate, maxDate, row > 0 || col > 0, monthNames, monthNamesShort) + '</div><table class="ui-datepicker-calendar"><thead>' + '<tr>';
          var thead = showWeek ? '<th class="ui-datepicker-week-col">' + this._get(inst, 'weekHeader') + '</th>' : '';
          for (var dow = 0; dow < 7; dow++) {
            var day = (dow + firstDay) % 7;
            thead += '<th' + ((dow + firstDay + 6) % 7 >= 5 ? ' class="ui-datepicker-week-end"' : '') + '>' + '<span title="' + dayNames[day] + '">' + dayNamesMin[day] + '</span></th>';
          }
          calender += thead + '</tr></thead><tbody>';
          var daysInMonth = this._getDaysInMonth(drawYear, drawMonth);
          if (drawYear == inst.selectedYear && drawMonth == inst.selectedMonth)
            inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
          var leadDays = (this._getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
          var curRows = Math.ceil((leadDays + daysInMonth) / 7);
          var numRows = isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows;
          this.maxRows = numRows;
          var printDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));
          for (var dRow = 0; dRow < numRows; dRow++) {
            calender += '<tr>';
            var tbody = !showWeek ? '' : '<td class="ui-datepicker-week-col">' + this._get(inst, 'calculateWeek')(printDate) + '</td>';
            for (var dow = 0; dow < 7; dow++) {
              var daySettings = beforeShowDay ? beforeShowDay.apply(inst.input ? inst.input[0] : null, [printDate]) : [
                  true,
                  ''
                ];
              var otherMonth = printDate.getMonth() != drawMonth;
              var unselectable = otherMonth && !selectOtherMonths || !daySettings[0] || minDate && printDate < minDate || maxDate && printDate > maxDate;
              tbody += '<td class="' + ((dow + firstDay + 6) % 7 >= 5 ? ' ui-datepicker-week-end' : '') + (otherMonth ? ' ui-datepicker-other-month' : '') + (printDate.getTime() == selectedDate.getTime() && drawMonth == inst.selectedMonth && inst._keyEvent || defaultDate.getTime() == printDate.getTime() && defaultDate.getTime() == selectedDate.getTime() ? ' ' + this._dayOverClass : '') + (unselectable ? ' ' + this._unselectableClass + ' ui-state-disabled' : '') + (otherMonth && !showOtherMonths ? '' : ' ' + daySettings[1] + (printDate.getTime() == currentDate.getTime() ? ' ' + this._currentClass : '') + (printDate.getTime() == today.getTime() ? ' ui-datepicker-today' : '')) + '"' + ((!otherMonth || showOtherMonths) && daySettings[2] ? ' title="' + daySettings[2] + '"' : '') + (unselectable ? '' : ' data-handler="selectDay" data-event="click" data-month="' + printDate.getMonth() + '" data-year="' + printDate.getFullYear() + '"') + '>' + (otherMonth && !showOtherMonths ? '&#xa0;' : unselectable ? '<span class="ui-state-default">' + printDate.getDate() + '</span>' : '<a class="ui-state-default' + (printDate.getTime() == today.getTime() ? ' ui-state-highlight' : '') + (printDate.getTime() == currentDate.getTime() ? ' ui-state-active' : '') + (otherMonth ? ' ui-priority-secondary' : '') + '" href="#">' + printDate.getDate() + '</a>') + '</td>';
              printDate.setDate(printDate.getDate() + 1);
              printDate = this._daylightSavingAdjust(printDate);
            }
            calender += tbody + '</tr>';
          }
          drawMonth++;
          if (drawMonth > 11) {
            drawMonth = 0;
            drawYear++;
          }
          calender += '</tbody></table>' + (isMultiMonth ? '</div>' + (numMonths[0] > 0 && col == numMonths[1] - 1 ? '<div class="ui-datepicker-row-break"></div>' : '') : '');
          group += calender;
        }
        html += group;
      }
      html += buttonPanel + ($.ui.ie6 && !inst.inline ? '<iframe src="javascript:false;" class="ui-datepicker-cover" frameborder="0"></iframe>' : '');
      inst._keyEvent = false;
      return html;
    },
    _generateMonthYearHeader: function (inst, drawMonth, drawYear, minDate, maxDate, secondary, monthNames, monthNamesShort) {
      var changeMonth = this._get(inst, 'changeMonth');
      var changeYear = this._get(inst, 'changeYear');
      var showMonthAfterYear = this._get(inst, 'showMonthAfterYear');
      var html = '<div class="ui-datepicker-title">';
      var monthHtml = '';
      if (secondary || !changeMonth)
        monthHtml += '<span class="ui-datepicker-month">' + monthNames[drawMonth] + '</span>';
      else {
        var inMinYear = minDate && minDate.getFullYear() == drawYear;
        var inMaxYear = maxDate && maxDate.getFullYear() == drawYear;
        monthHtml += '<select class="ui-datepicker-month" data-handler="selectMonth" data-event="change">';
        for (var month = 0; month < 12; month++) {
          if ((!inMinYear || month >= minDate.getMonth()) && (!inMaxYear || month <= maxDate.getMonth()))
            monthHtml += '<option value="' + month + '"' + (month == drawMonth ? ' selected="selected"' : '') + '>' + monthNamesShort[month] + '</option>';
        }
        monthHtml += '</select>';
      }
      if (!showMonthAfterYear)
        html += monthHtml + (secondary || !(changeMonth && changeYear) ? '&#xa0;' : '');
      if (!inst.yearshtml) {
        inst.yearshtml = '';
        if (secondary || !changeYear)
          html += '<span class="ui-datepicker-year">' + drawYear + '</span>';
        else {
          var years = this._get(inst, 'yearRange').split(':');
          var thisYear = new Date().getFullYear();
          var determineYear = function (value) {
            var year = value.match(/c[+-].*/) ? drawYear + parseInt(value.substring(1), 10) : value.match(/[+-].*/) ? thisYear + parseInt(value, 10) : parseInt(value, 10);
            return isNaN(year) ? thisYear : year;
          };
          var year = determineYear(years[0]);
          var endYear = Math.max(year, determineYear(years[1] || ''));
          year = minDate ? Math.max(year, minDate.getFullYear()) : year;
          endYear = maxDate ? Math.min(endYear, maxDate.getFullYear()) : endYear;
          inst.yearshtml += '<select class="ui-datepicker-year" data-handler="selectYear" data-event="change">';
          for (; year <= endYear; year++) {
            inst.yearshtml += '<option value="' + year + '"' + (year == drawYear ? ' selected="selected"' : '') + '>' + year + '</option>';
          }
          inst.yearshtml += '</select>';
          html += inst.yearshtml;
          inst.yearshtml = null;
        }
      }
      html += this._get(inst, 'yearSuffix');
      if (showMonthAfterYear)
        html += (secondary || !(changeMonth && changeYear) ? '&#xa0;' : '') + monthHtml;
      html += '</div>';
      return html;
    },
    _adjustInstDate: function (inst, offset, period) {
      var year = inst.drawYear + (period == 'Y' ? offset : 0);
      var month = inst.drawMonth + (period == 'M' ? offset : 0);
      var day = Math.min(inst.selectedDay, this._getDaysInMonth(year, month)) + (period == 'D' ? offset : 0);
      var date = this._restrictMinMax(inst, this._daylightSavingAdjust(new Date(year, month, day)));
      inst.selectedDay = date.getDate();
      inst.drawMonth = inst.selectedMonth = date.getMonth();
      inst.drawYear = inst.selectedYear = date.getFullYear();
      if (period == 'M' || period == 'Y')
        this._notifyChange(inst);
    },
    _restrictMinMax: function (inst, date) {
      var minDate = this._getMinMaxDate(inst, 'min');
      var maxDate = this._getMinMaxDate(inst, 'max');
      var newDate = minDate && date < minDate ? minDate : date;
      newDate = maxDate && newDate > maxDate ? maxDate : newDate;
      return newDate;
    },
    _notifyChange: function (inst) {
      var onChange = this._get(inst, 'onChangeMonthYear');
      if (onChange)
        onChange.apply(inst.input ? inst.input[0] : null, [
          inst.selectedYear,
          inst.selectedMonth + 1,
          inst
        ]);
    },
    _getNumberOfMonths: function (inst) {
      var numMonths = this._get(inst, 'numberOfMonths');
      return numMonths == null ? [
        1,
        1
      ] : typeof numMonths == 'number' ? [
        1,
        numMonths
      ] : numMonths;
    },
    _getMinMaxDate: function (inst, minMax) {
      return this._determineDate(inst, this._get(inst, minMax + 'Date'), null);
    },
    _getDaysInMonth: function (year, month) {
      return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
    },
    _getFirstDayOfMonth: function (year, month) {
      return new Date(year, month, 1).getDay();
    },
    _canAdjustMonth: function (inst, offset, curYear, curMonth) {
      var numMonths = this._getNumberOfMonths(inst);
      var date = this._daylightSavingAdjust(new Date(curYear, curMonth + (offset < 0 ? offset : numMonths[0] * numMonths[1]), 1));
      if (offset < 0)
        date.setDate(this._getDaysInMonth(date.getFullYear(), date.getMonth()));
      return this._isInRange(inst, date);
    },
    _isInRange: function (inst, date) {
      var minDate = this._getMinMaxDate(inst, 'min');
      var maxDate = this._getMinMaxDate(inst, 'max');
      return (!minDate || date.getTime() >= minDate.getTime()) && (!maxDate || date.getTime() <= maxDate.getTime());
    },
    _getFormatConfig: function (inst) {
      var shortYearCutoff = this._get(inst, 'shortYearCutoff');
      shortYearCutoff = typeof shortYearCutoff != 'string' ? shortYearCutoff : new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10);
      return {
        shortYearCutoff: shortYearCutoff,
        dayNamesShort: this._get(inst, 'dayNamesShort'),
        dayNames: this._get(inst, 'dayNames'),
        monthNamesShort: this._get(inst, 'monthNamesShort'),
        monthNames: this._get(inst, 'monthNames')
      };
    },
    _formatDate: function (inst, day, month, year) {
      if (!day) {
        inst.currentDay = inst.selectedDay;
        inst.currentMonth = inst.selectedMonth;
        inst.currentYear = inst.selectedYear;
      }
      var date = day ? typeof day == 'object' ? day : this._daylightSavingAdjust(new Date(year, month, day)) : this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay));
      return this.formatDate(this._get(inst, 'dateFormat'), date, this._getFormatConfig(inst));
    }
  });
  function bindHover(dpDiv) {
    var selector = 'button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a';
    return dpDiv.delegate(selector, 'mouseout', function () {
      $(this).removeClass('ui-state-hover');
      if (this.className.indexOf('ui-datepicker-prev') != -1)
        $(this).removeClass('ui-datepicker-prev-hover');
      if (this.className.indexOf('ui-datepicker-next') != -1)
        $(this).removeClass('ui-datepicker-next-hover');
    }).delegate(selector, 'mouseover', function () {
      if (!$.datepicker._isDisabledDatepicker(instActive.inline ? dpDiv.parent()[0] : instActive.input[0])) {
        $(this).parents('.ui-datepicker-calendar').find('a').removeClass('ui-state-hover');
        $(this).addClass('ui-state-hover');
        if (this.className.indexOf('ui-datepicker-prev') != -1)
          $(this).addClass('ui-datepicker-prev-hover');
        if (this.className.indexOf('ui-datepicker-next') != -1)
          $(this).addClass('ui-datepicker-next-hover');
      }
    });
  }
  function extendRemove(target, props) {
    $.extend(target, props);
    for (var name in props)
      if (props[name] == null || props[name] == undefined)
        target[name] = props[name];
    return target;
  }
  ;
  $.fn.datepicker = function (options) {
    if (!this.length) {
      return this;
    }
    if (!$.datepicker.initialized) {
      $(document).mousedown($.datepicker._checkExternalClick).find(document.body).append($.datepicker.dpDiv);
      $.datepicker.initialized = true;
    }
    var otherArgs = Array.prototype.slice.call(arguments, 1);
    if (typeof options == 'string' && (options == 'isDisabled' || options == 'getDate' || options == 'widget'))
      return $.datepicker['_' + options + 'Datepicker'].apply($.datepicker, [this[0]].concat(otherArgs));
    if (options == 'option' && arguments.length == 2 && typeof arguments[1] == 'string')
      return $.datepicker['_' + options + 'Datepicker'].apply($.datepicker, [this[0]].concat(otherArgs));
    return this.each(function () {
      typeof options == 'string' ? $.datepicker['_' + options + 'Datepicker'].apply($.datepicker, [this].concat(otherArgs)) : $.datepicker._attachDatepicker(this, options);
    });
  };
  $.datepicker = new Datepicker();
  $.datepicker.initialized = false;
  $.datepicker.uuid = new Date().getTime();
  $.datepicker.version = '1.9.2';
  window['DP_jQuery_' + dpuuid] = $;
}(jQuery));
(function ($, undefined) {
  var uiDialogClasses = 'ui-dialog ui-widget ui-widget-content ui-corner-all ', sizeRelatedOptions = {
      buttons: true,
      height: true,
      maxHeight: true,
      maxWidth: true,
      minHeight: true,
      minWidth: true,
      width: true
    }, resizableRelatedOptions = {
      maxHeight: true,
      maxWidth: true,
      minHeight: true,
      minWidth: true
    };
  $.widget('ui.dialog', {
    version: '1.9.2',
    options: {
      autoOpen: true,
      buttons: {},
      closeOnEscape: true,
      closeText: 'close',
      dialogClass: '',
      draggable: true,
      hide: null,
      height: 'auto',
      maxHeight: false,
      maxWidth: false,
      minHeight: 150,
      minWidth: 150,
      modal: false,
      position: {
        my: 'center',
        at: 'center',
        of: window,
        collision: 'fit',
        using: function (pos) {
          var topOffset = $(this).css(pos).offset().top;
          if (topOffset < 0) {
            $(this).css('top', pos.top - topOffset);
          }
        }
      },
      resizable: true,
      show: null,
      stack: true,
      title: '',
      width: 300,
      zIndex: 1000
    },
    _create: function () {
      this.originalTitle = this.element.attr('title');
      if (typeof this.originalTitle !== 'string') {
        this.originalTitle = '';
      }
      this.oldPosition = {
        parent: this.element.parent(),
        index: this.element.parent().children().index(this.element)
      };
      this.options.title = this.options.title || this.originalTitle;
      var that = this, options = this.options, title = options.title || '&#160;', uiDialog, uiDialogTitlebar, uiDialogTitlebarClose, uiDialogTitle, uiDialogButtonPane;
      uiDialog = (this.uiDialog = $('<div>')).addClass(uiDialogClasses + options.dialogClass).css({
        display: 'none',
        outline: 0,
        zIndex: options.zIndex
      }).attr('tabIndex', -1).keydown(function (event) {
        if (options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode && event.keyCode === $.ui.keyCode.ESCAPE) {
          that.close(event);
          event.preventDefault();
        }
      }).mousedown(function (event) {
        that.moveToTop(false, event);
      }).appendTo('body');
      this.element.show().removeAttr('title').addClass('ui-dialog-content ui-widget-content').appendTo(uiDialog);
      uiDialogTitlebar = (this.uiDialogTitlebar = $('<div>')).addClass('ui-dialog-titlebar  ui-widget-header  ' + 'ui-corner-all  ui-helper-clearfix').bind('mousedown', function () {
        uiDialog.focus();
      }).prependTo(uiDialog);
      uiDialogTitlebarClose = $('<a href=\'#\'></a>').addClass('ui-dialog-titlebar-close  ui-corner-all').attr('role', 'button').click(function (event) {
        event.preventDefault();
        that.close(event);
      }).appendTo(uiDialogTitlebar);
      (this.uiDialogTitlebarCloseText = $('<span>')).addClass('ui-icon ui-icon-closethick').text(options.closeText).appendTo(uiDialogTitlebarClose);
      uiDialogTitle = $('<span>').uniqueId().addClass('ui-dialog-title').html(title).prependTo(uiDialogTitlebar);
      uiDialogButtonPane = (this.uiDialogButtonPane = $('<div>')).addClass('ui-dialog-buttonpane ui-widget-content ui-helper-clearfix');
      (this.uiButtonSet = $('<div>')).addClass('ui-dialog-buttonset').appendTo(uiDialogButtonPane);
      uiDialog.attr({
        role: 'dialog',
        'aria-labelledby': uiDialogTitle.attr('id')
      });
      uiDialogTitlebar.find('*').add(uiDialogTitlebar).disableSelection();
      this._hoverable(uiDialogTitlebarClose);
      this._focusable(uiDialogTitlebarClose);
      if (options.draggable && $.fn.draggable) {
        this._makeDraggable();
      }
      if (options.resizable && $.fn.resizable) {
        this._makeResizable();
      }
      this._createButtons(options.buttons);
      this._isOpen = false;
      if ($.fn.bgiframe) {
        uiDialog.bgiframe();
      }
      this._on(uiDialog, {
        keydown: function (event) {
          if (!options.modal || event.keyCode !== $.ui.keyCode.TAB) {
            return;
          }
          var tabbables = $(':tabbable', uiDialog), first = tabbables.filter(':first'), last = tabbables.filter(':last');
          if (event.target === last[0] && !event.shiftKey) {
            first.focus(1);
            return false;
          } else if (event.target === first[0] && event.shiftKey) {
            last.focus(1);
            return false;
          }
        }
      });
    },
    _init: function () {
      if (this.options.autoOpen) {
        this.open();
      }
    },
    _destroy: function () {
      var next, oldPosition = this.oldPosition;
      if (this.overlay) {
        this.overlay.destroy();
      }
      this.uiDialog.hide();
      this.element.removeClass('ui-dialog-content ui-widget-content').hide().appendTo('body');
      this.uiDialog.remove();
      if (this.originalTitle) {
        this.element.attr('title', this.originalTitle);
      }
      next = oldPosition.parent.children().eq(oldPosition.index);
      if (next.length && next[0] !== this.element[0]) {
        next.before(this.element);
      } else {
        oldPosition.parent.append(this.element);
      }
    },
    widget: function () {
      return this.uiDialog;
    },
    close: function (event) {
      var that = this, maxZ, thisZ;
      if (!this._isOpen) {
        return;
      }
      if (false === this._trigger('beforeClose', event)) {
        return;
      }
      this._isOpen = false;
      if (this.overlay) {
        this.overlay.destroy();
      }
      if (this.options.hide) {
        this._hide(this.uiDialog, this.options.hide, function () {
          that._trigger('close', event);
        });
      } else {
        this.uiDialog.hide();
        this._trigger('close', event);
      }
      $.ui.dialog.overlay.resize();
      if (this.options.modal) {
        maxZ = 0;
        $('.ui-dialog').each(function () {
          if (this !== that.uiDialog[0]) {
            thisZ = $(this).css('z-index');
            if (!isNaN(thisZ)) {
              maxZ = Math.max(maxZ, thisZ);
            }
          }
        });
        $.ui.dialog.maxZ = maxZ;
      }
      return this;
    },
    isOpen: function () {
      return this._isOpen;
    },
    moveToTop: function (force, event) {
      var options = this.options, saveScroll;
      if (options.modal && !force || !options.stack && !options.modal) {
        return this._trigger('focus', event);
      }
      if (options.zIndex > $.ui.dialog.maxZ) {
        $.ui.dialog.maxZ = options.zIndex;
      }
      if (this.overlay) {
        $.ui.dialog.maxZ += 1;
        $.ui.dialog.overlay.maxZ = $.ui.dialog.maxZ;
        this.overlay.$el.css('z-index', $.ui.dialog.overlay.maxZ);
      }
      saveScroll = {
        scrollTop: this.element.scrollTop(),
        scrollLeft: this.element.scrollLeft()
      };
      $.ui.dialog.maxZ += 1;
      this.uiDialog.css('z-index', $.ui.dialog.maxZ);
      this.element.attr(saveScroll);
      this._trigger('focus', event);
      return this;
    },
    open: function () {
      if (this._isOpen) {
        return;
      }
      var hasFocus, options = this.options, uiDialog = this.uiDialog;
      this._size();
      this._position(options.position);
      uiDialog.show(options.show);
      this.overlay = options.modal ? new $.ui.dialog.overlay(this) : null;
      this.moveToTop(true);
      hasFocus = this.element.find(':tabbable');
      if (!hasFocus.length) {
        hasFocus = this.uiDialogButtonPane.find(':tabbable');
        if (!hasFocus.length) {
          hasFocus = uiDialog;
        }
      }
      hasFocus.eq(0).focus();
      this._isOpen = true;
      this._trigger('open');
      return this;
    },
    _createButtons: function (buttons) {
      var that = this, hasButtons = false;
      this.uiDialogButtonPane.remove();
      this.uiButtonSet.empty();
      if (typeof buttons === 'object' && buttons !== null) {
        $.each(buttons, function () {
          return !(hasButtons = true);
        });
      }
      if (hasButtons) {
        $.each(buttons, function (name, props) {
          var button, click;
          props = $.isFunction(props) ? {
            click: props,
            text: name
          } : props;
          props = $.extend({ type: 'button' }, props);
          click = props.click;
          props.click = function () {
            click.apply(that.element[0], arguments);
          };
          button = $('<button></button>', props).appendTo(that.uiButtonSet);
          if ($.fn.button) {
            button.button();
          }
        });
        this.uiDialog.addClass('ui-dialog-buttons');
        this.uiDialogButtonPane.appendTo(this.uiDialog);
      } else {
        this.uiDialog.removeClass('ui-dialog-buttons');
      }
    },
    _makeDraggable: function () {
      var that = this, options = this.options;
      function filteredUi(ui) {
        return {
          position: ui.position,
          offset: ui.offset
        };
      }
      this.uiDialog.draggable({
        cancel: '.ui-dialog-content, .ui-dialog-titlebar-close',
        handle: '.ui-dialog-titlebar',
        containment: 'document',
        start: function (event, ui) {
          $(this).addClass('ui-dialog-dragging');
          that._trigger('dragStart', event, filteredUi(ui));
        },
        drag: function (event, ui) {
          that._trigger('drag', event, filteredUi(ui));
        },
        stop: function (event, ui) {
          options.position = [
            ui.position.left - that.document.scrollLeft(),
            ui.position.top - that.document.scrollTop()
          ];
          $(this).removeClass('ui-dialog-dragging');
          that._trigger('dragStop', event, filteredUi(ui));
          $.ui.dialog.overlay.resize();
        }
      });
    },
    _makeResizable: function (handles) {
      handles = handles === undefined ? this.options.resizable : handles;
      var that = this, options = this.options, position = this.uiDialog.css('position'), resizeHandles = typeof handles === 'string' ? handles : 'n,e,s,w,se,sw,ne,nw';
      function filteredUi(ui) {
        return {
          originalPosition: ui.originalPosition,
          originalSize: ui.originalSize,
          position: ui.position,
          size: ui.size
        };
      }
      this.uiDialog.resizable({
        cancel: '.ui-dialog-content',
        containment: 'document',
        alsoResize: this.element,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        minWidth: options.minWidth,
        minHeight: this._minHeight(),
        handles: resizeHandles,
        start: function (event, ui) {
          $(this).addClass('ui-dialog-resizing');
          that._trigger('resizeStart', event, filteredUi(ui));
        },
        resize: function (event, ui) {
          that._trigger('resize', event, filteredUi(ui));
        },
        stop: function (event, ui) {
          $(this).removeClass('ui-dialog-resizing');
          options.height = $(this).height();
          options.width = $(this).width();
          that._trigger('resizeStop', event, filteredUi(ui));
          $.ui.dialog.overlay.resize();
        }
      }).css('position', position).find('.ui-resizable-se').addClass('ui-icon ui-icon-grip-diagonal-se');
    },
    _minHeight: function () {
      var options = this.options;
      if (options.height === 'auto') {
        return options.minHeight;
      } else {
        return Math.min(options.minHeight, options.height);
      }
    },
    _position: function (position) {
      var myAt = [], offset = [
          0,
          0
        ], isVisible;
      if (position) {
        if (typeof position === 'string' || typeof position === 'object' && '0' in position) {
          myAt = position.split ? position.split(' ') : [
            position[0],
            position[1]
          ];
          if (myAt.length === 1) {
            myAt[1] = myAt[0];
          }
          $.each([
            'left',
            'top'
          ], function (i, offsetPosition) {
            if (+myAt[i] === myAt[i]) {
              offset[i] = myAt[i];
              myAt[i] = offsetPosition;
            }
          });
          position = {
            my: myAt[0] + (offset[0] < 0 ? offset[0] : '+' + offset[0]) + ' ' + myAt[1] + (offset[1] < 0 ? offset[1] : '+' + offset[1]),
            at: myAt.join(' ')
          };
        }
        position = $.extend({}, $.ui.dialog.prototype.options.position, position);
      } else {
        position = $.ui.dialog.prototype.options.position;
      }
      isVisible = this.uiDialog.is(':visible');
      if (!isVisible) {
        this.uiDialog.show();
      }
      this.uiDialog.position(position);
      if (!isVisible) {
        this.uiDialog.hide();
      }
    },
    _setOptions: function (options) {
      var that = this, resizableOptions = {}, resize = false;
      $.each(options, function (key, value) {
        that._setOption(key, value);
        if (key in sizeRelatedOptions) {
          resize = true;
        }
        if (key in resizableRelatedOptions) {
          resizableOptions[key] = value;
        }
      });
      if (resize) {
        this._size();
      }
      if (this.uiDialog.is(':data(resizable)')) {
        this.uiDialog.resizable('option', resizableOptions);
      }
    },
    _setOption: function (key, value) {
      var isDraggable, isResizable, uiDialog = this.uiDialog;
      switch (key) {
      case 'buttons':
        this._createButtons(value);
        break;
      case 'closeText':
        this.uiDialogTitlebarCloseText.text('' + value);
        break;
      case 'dialogClass':
        uiDialog.removeClass(this.options.dialogClass).addClass(uiDialogClasses + value);
        break;
      case 'disabled':
        if (value) {
          uiDialog.addClass('ui-dialog-disabled');
        } else {
          uiDialog.removeClass('ui-dialog-disabled');
        }
        break;
      case 'draggable':
        isDraggable = uiDialog.is(':data(draggable)');
        if (isDraggable && !value) {
          uiDialog.draggable('destroy');
        }
        if (!isDraggable && value) {
          this._makeDraggable();
        }
        break;
      case 'position':
        this._position(value);
        break;
      case 'resizable':
        isResizable = uiDialog.is(':data(resizable)');
        if (isResizable && !value) {
          uiDialog.resizable('destroy');
        }
        if (isResizable && typeof value === 'string') {
          uiDialog.resizable('option', 'handles', value);
        }
        if (!isResizable && value !== false) {
          this._makeResizable(value);
        }
        break;
      case 'title':
        $('.ui-dialog-title', this.uiDialogTitlebar).html('' + (value || '&#160;'));
        break;
      }
      this._super(key, value);
    },
    _size: function () {
      var nonContentHeight, minContentHeight, autoHeight, options = this.options, isVisible = this.uiDialog.is(':visible');
      this.element.show().css({
        width: 'auto',
        minHeight: 0,
        height: 0
      });
      if (options.minWidth > options.width) {
        options.width = options.minWidth;
      }
      nonContentHeight = this.uiDialog.css({
        height: 'auto',
        width: options.width
      }).outerHeight();
      minContentHeight = Math.max(0, options.minHeight - nonContentHeight);
      if (options.height === 'auto') {
        if ($.support.minHeight) {
          this.element.css({
            minHeight: minContentHeight,
            height: 'auto'
          });
        } else {
          this.uiDialog.show();
          autoHeight = this.element.css('height', 'auto').height();
          if (!isVisible) {
            this.uiDialog.hide();
          }
          this.element.height(Math.max(autoHeight, minContentHeight));
        }
      } else {
        this.element.height(Math.max(options.height - nonContentHeight, 0));
      }
      if (this.uiDialog.is(':data(resizable)')) {
        this.uiDialog.resizable('option', 'minHeight', this._minHeight());
      }
    }
  });
  $.extend($.ui.dialog, {
    uuid: 0,
    maxZ: 0,
    getTitleId: function ($el) {
      var id = $el.attr('id');
      if (!id) {
        this.uuid += 1;
        id = this.uuid;
      }
      return 'ui-dialog-title-' + id;
    },
    overlay: function (dialog) {
      this.$el = $.ui.dialog.overlay.create(dialog);
    }
  });
  $.extend($.ui.dialog.overlay, {
    instances: [],
    oldInstances: [],
    maxZ: 0,
    events: $.map('focus,mousedown,mouseup,keydown,keypress,click'.split(','), function (event) {
      return event + '.dialog-overlay';
    }).join(' '),
    create: function (dialog) {
      if (this.instances.length === 0) {
        setTimeout(function () {
          if ($.ui.dialog.overlay.instances.length) {
            $(document).bind($.ui.dialog.overlay.events, function (event) {
              if ($(event.target).zIndex() < $.ui.dialog.overlay.maxZ) {
                return false;
              }
            });
          }
        }, 1);
        $(window).bind('resize.dialog-overlay', $.ui.dialog.overlay.resize);
      }
      var $el = this.oldInstances.pop() || $('<div>').addClass('ui-widget-overlay');
      $(document).bind('keydown.dialog-overlay', function (event) {
        var instances = $.ui.dialog.overlay.instances;
        if (instances.length !== 0 && instances[instances.length - 1] === $el && dialog.options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode && event.keyCode === $.ui.keyCode.ESCAPE) {
          dialog.close(event);
          event.preventDefault();
        }
      });
      $el.appendTo(document.body).css({
        width: this.width(),
        height: this.height()
      });
      if ($.fn.bgiframe) {
        $el.bgiframe();
      }
      this.instances.push($el);
      return $el;
    },
    destroy: function ($el) {
      var indexOf = $.inArray($el, this.instances), maxZ = 0;
      if (indexOf !== -1) {
        this.oldInstances.push(this.instances.splice(indexOf, 1)[0]);
      }
      if (this.instances.length === 0) {
        $([
          document,
          window
        ]).unbind('.dialog-overlay');
      }
      $el.height(0).width(0).remove();
      $.each(this.instances, function () {
        maxZ = Math.max(maxZ, this.css('z-index'));
      });
      this.maxZ = maxZ;
    },
    height: function () {
      var scrollHeight, offsetHeight;
      if ($.ui.ie) {
        scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        offsetHeight = Math.max(document.documentElement.offsetHeight, document.body.offsetHeight);
        if (scrollHeight < offsetHeight) {
          return $(window).height() + 'px';
        } else {
          return scrollHeight + 'px';
        }
      } else {
        return $(document).height() + 'px';
      }
    },
    width: function () {
      var scrollWidth, offsetWidth;
      if ($.ui.ie) {
        scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);
        if (scrollWidth < offsetWidth) {
          return $(window).width() + 'px';
        } else {
          return scrollWidth + 'px';
        }
      } else {
        return $(document).width() + 'px';
      }
    },
    resize: function () {
      var $overlays = $([]);
      $.each($.ui.dialog.overlay.instances, function () {
        $overlays = $overlays.add(this);
      });
      $overlays.css({
        width: 0,
        height: 0
      }).css({
        width: $.ui.dialog.overlay.width(),
        height: $.ui.dialog.overlay.height()
      });
    }
  });
  $.extend($.ui.dialog.overlay.prototype, {
    destroy: function () {
      $.ui.dialog.overlay.destroy(this.$el);
    }
  });
}(jQuery));
(function ($, undefined) {
  var rvertical = /up|down|vertical/, rpositivemotion = /up|left|vertical|horizontal/;
  $.effects.effect.blind = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'hide'), direction = o.direction || 'up', vertical = rvertical.test(direction), ref = vertical ? 'height' : 'width', ref2 = vertical ? 'top' : 'left', motion = rpositivemotion.test(direction), animation = {}, show = mode === 'show', wrapper, distance, margin;
    if (el.parent().is('.ui-effects-wrapper')) {
      $.effects.save(el.parent(), props);
    } else {
      $.effects.save(el, props);
    }
    el.show();
    wrapper = $.effects.createWrapper(el).css({ overflow: 'hidden' });
    distance = wrapper[ref]();
    margin = parseFloat(wrapper.css(ref2)) || 0;
    animation[ref] = show ? distance : 0;
    if (!motion) {
      el.css(vertical ? 'bottom' : 'right', 0).css(vertical ? 'top' : 'left', 'auto').css({ position: 'absolute' });
      animation[ref2] = show ? margin : distance + margin;
    }
    if (show) {
      wrapper.css(ref, 0);
      if (!motion) {
        wrapper.css(ref2, margin + distance);
      }
    }
    wrapper.animate(animation, {
      duration: o.duration,
      easing: o.easing,
      queue: false,
      complete: function () {
        if (mode === 'hide') {
          el.hide();
        }
        $.effects.restore(el, props);
        $.effects.removeWrapper(el);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.bounce = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'effect'), hide = mode === 'hide', show = mode === 'show', direction = o.direction || 'up', distance = o.distance, times = o.times || 5, anims = times * 2 + (show || hide ? 1 : 0), speed = o.duration / anims, easing = o.easing, ref = direction === 'up' || direction === 'down' ? 'top' : 'left', motion = direction === 'up' || direction === 'left', i, upAnim, downAnim, queue = el.queue(), queuelen = queue.length;
    if (show || hide) {
      props.push('opacity');
    }
    $.effects.save(el, props);
    el.show();
    $.effects.createWrapper(el);
    if (!distance) {
      distance = el[ref === 'top' ? 'outerHeight' : 'outerWidth']() / 3;
    }
    if (show) {
      downAnim = { opacity: 1 };
      downAnim[ref] = 0;
      el.css('opacity', 0).css(ref, motion ? -distance * 2 : distance * 2).animate(downAnim, speed, easing);
    }
    if (hide) {
      distance = distance / Math.pow(2, times - 1);
    }
    downAnim = {};
    downAnim[ref] = 0;
    for (i = 0; i < times; i++) {
      upAnim = {};
      upAnim[ref] = (motion ? '-=' : '+=') + distance;
      el.animate(upAnim, speed, easing).animate(downAnim, speed, easing);
      distance = hide ? distance * 2 : distance / 2;
    }
    if (hide) {
      upAnim = { opacity: 0 };
      upAnim[ref] = (motion ? '-=' : '+=') + distance;
      el.animate(upAnim, speed, easing);
    }
    el.queue(function () {
      if (hide) {
        el.hide();
      }
      $.effects.restore(el, props);
      $.effects.removeWrapper(el);
      done();
    });
    if (queuelen > 1) {
      queue.splice.apply(queue, [
        1,
        0
      ].concat(queue.splice(queuelen, anims + 1)));
    }
    el.dequeue();
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.clip = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'hide'), show = mode === 'show', direction = o.direction || 'vertical', vert = direction === 'vertical', size = vert ? 'height' : 'width', position = vert ? 'top' : 'left', animation = {}, wrapper, animate, distance;
    $.effects.save(el, props);
    el.show();
    wrapper = $.effects.createWrapper(el).css({ overflow: 'hidden' });
    animate = el[0].tagName === 'IMG' ? wrapper : el;
    distance = animate[size]();
    if (show) {
      animate.css(size, 0);
      animate.css(position, distance / 2);
    }
    animation[size] = show ? distance : 0;
    animation[position] = show ? 0 : distance / 2;
    animate.animate(animation, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: function () {
        if (!show) {
          el.hide();
        }
        $.effects.restore(el, props);
        $.effects.removeWrapper(el);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.drop = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'opacity',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'hide'), show = mode === 'show', direction = o.direction || 'left', ref = direction === 'up' || direction === 'down' ? 'top' : 'left', motion = direction === 'up' || direction === 'left' ? 'pos' : 'neg', animation = { opacity: show ? 1 : 0 }, distance;
    $.effects.save(el, props);
    el.show();
    $.effects.createWrapper(el);
    distance = o.distance || el[ref === 'top' ? 'outerHeight' : 'outerWidth'](true) / 2;
    if (show) {
      el.css('opacity', 0).css(ref, motion === 'pos' ? -distance : distance);
    }
    animation[ref] = (show ? motion === 'pos' ? '+=' : '-=' : motion === 'pos' ? '-=' : '+=') + distance;
    el.animate(animation, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: function () {
        if (mode === 'hide') {
          el.hide();
        }
        $.effects.restore(el, props);
        $.effects.removeWrapper(el);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.explode = function (o, done) {
    var rows = o.pieces ? Math.round(Math.sqrt(o.pieces)) : 3, cells = rows, el = $(this), mode = $.effects.setMode(el, o.mode || 'hide'), show = mode === 'show', offset = el.show().css('visibility', 'hidden').offset(), width = Math.ceil(el.outerWidth() / cells), height = Math.ceil(el.outerHeight() / rows), pieces = [], i, j, left, top, mx, my;
    function childComplete() {
      pieces.push(this);
      if (pieces.length === rows * cells) {
        animComplete();
      }
    }
    for (i = 0; i < rows; i++) {
      top = offset.top + i * height;
      my = i - (rows - 1) / 2;
      for (j = 0; j < cells; j++) {
        left = offset.left + j * width;
        mx = j - (cells - 1) / 2;
        el.clone().appendTo('body').wrap('<div></div>').css({
          position: 'absolute',
          visibility: 'visible',
          left: -j * width,
          top: -i * height
        }).parent().addClass('ui-effects-explode').css({
          position: 'absolute',
          overflow: 'hidden',
          width: width,
          height: height,
          left: left + (show ? mx * width : 0),
          top: top + (show ? my * height : 0),
          opacity: show ? 0 : 1
        }).animate({
          left: left + (show ? 0 : mx * width),
          top: top + (show ? 0 : my * height),
          opacity: show ? 1 : 0
        }, o.duration || 500, o.easing, childComplete);
      }
    }
    function animComplete() {
      el.css({ visibility: 'visible' });
      $(pieces).remove();
      if (!show) {
        el.hide();
      }
      done();
    }
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.fade = function (o, done) {
    var el = $(this), mode = $.effects.setMode(el, o.mode || 'toggle');
    el.animate({ opacity: mode }, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: done
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.fold = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'hide'), show = mode === 'show', hide = mode === 'hide', size = o.size || 15, percent = /([0-9]+)%/.exec(size), horizFirst = !!o.horizFirst, widthFirst = show !== horizFirst, ref = widthFirst ? [
        'width',
        'height'
      ] : [
        'height',
        'width'
      ], duration = o.duration / 2, wrapper, distance, animation1 = {}, animation2 = {};
    $.effects.save(el, props);
    el.show();
    wrapper = $.effects.createWrapper(el).css({ overflow: 'hidden' });
    distance = widthFirst ? [
      wrapper.width(),
      wrapper.height()
    ] : [
      wrapper.height(),
      wrapper.width()
    ];
    if (percent) {
      size = parseInt(percent[1], 10) / 100 * distance[hide ? 0 : 1];
    }
    if (show) {
      wrapper.css(horizFirst ? {
        height: 0,
        width: size
      } : {
        height: size,
        width: 0
      });
    }
    animation1[ref[0]] = show ? distance[0] : size;
    animation2[ref[1]] = show ? distance[1] : 0;
    wrapper.animate(animation1, duration, o.easing).animate(animation2, duration, o.easing, function () {
      if (hide) {
        el.hide();
      }
      $.effects.restore(el, props);
      $.effects.removeWrapper(el);
      done();
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.highlight = function (o, done) {
    var elem = $(this), props = [
        'backgroundImage',
        'backgroundColor',
        'opacity'
      ], mode = $.effects.setMode(elem, o.mode || 'show'), animation = { backgroundColor: elem.css('backgroundColor') };
    if (mode === 'hide') {
      animation.opacity = 0;
    }
    $.effects.save(elem, props);
    elem.show().css({
      backgroundImage: 'none',
      backgroundColor: o.color || '#ffff99'
    }).animate(animation, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: function () {
        if (mode === 'hide') {
          elem.hide();
        }
        $.effects.restore(elem, props);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.pulsate = function (o, done) {
    var elem = $(this), mode = $.effects.setMode(elem, o.mode || 'show'), show = mode === 'show', hide = mode === 'hide', showhide = show || mode === 'hide', anims = (o.times || 5) * 2 + (showhide ? 1 : 0), duration = o.duration / anims, animateTo = 0, queue = elem.queue(), queuelen = queue.length, i;
    if (show || !elem.is(':visible')) {
      elem.css('opacity', 0).show();
      animateTo = 1;
    }
    for (i = 1; i < anims; i++) {
      elem.animate({ opacity: animateTo }, duration, o.easing);
      animateTo = 1 - animateTo;
    }
    elem.animate({ opacity: animateTo }, duration, o.easing);
    elem.queue(function () {
      if (hide) {
        elem.hide();
      }
      done();
    });
    if (queuelen > 1) {
      queue.splice.apply(queue, [
        1,
        0
      ].concat(queue.splice(queuelen, anims + 1)));
    }
    elem.dequeue();
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.puff = function (o, done) {
    var elem = $(this), mode = $.effects.setMode(elem, o.mode || 'hide'), hide = mode === 'hide', percent = parseInt(o.percent, 10) || 150, factor = percent / 100, original = {
        height: elem.height(),
        width: elem.width(),
        outerHeight: elem.outerHeight(),
        outerWidth: elem.outerWidth()
      };
    $.extend(o, {
      effect: 'scale',
      queue: false,
      fade: true,
      mode: mode,
      complete: done,
      percent: hide ? percent : 100,
      from: hide ? original : {
        height: original.height * factor,
        width: original.width * factor,
        outerHeight: original.outerHeight * factor,
        outerWidth: original.outerWidth * factor
      }
    });
    elem.effect(o);
  };
  $.effects.effect.scale = function (o, done) {
    var el = $(this), options = $.extend(true, {}, o), mode = $.effects.setMode(el, o.mode || 'effect'), percent = parseInt(o.percent, 10) || (parseInt(o.percent, 10) === 0 ? 0 : mode === 'hide' ? 0 : 100), direction = o.direction || 'both', origin = o.origin, original = {
        height: el.height(),
        width: el.width(),
        outerHeight: el.outerHeight(),
        outerWidth: el.outerWidth()
      }, factor = {
        y: direction !== 'horizontal' ? percent / 100 : 1,
        x: direction !== 'vertical' ? percent / 100 : 1
      };
    options.effect = 'size';
    options.queue = false;
    options.complete = done;
    if (mode !== 'effect') {
      options.origin = origin || [
        'middle',
        'center'
      ];
      options.restore = true;
    }
    options.from = o.from || (mode === 'show' ? {
      height: 0,
      width: 0,
      outerHeight: 0,
      outerWidth: 0
    } : original);
    options.to = {
      height: original.height * factor.y,
      width: original.width * factor.x,
      outerHeight: original.outerHeight * factor.y,
      outerWidth: original.outerWidth * factor.x
    };
    if (options.fade) {
      if (mode === 'show') {
        options.from.opacity = 0;
        options.to.opacity = 1;
      }
      if (mode === 'hide') {
        options.from.opacity = 1;
        options.to.opacity = 0;
      }
    }
    el.effect(options);
  };
  $.effects.effect.size = function (o, done) {
    var original, baseline, factor, el = $(this), props0 = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'width',
        'height',
        'overflow',
        'opacity'
      ], props1 = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'overflow',
        'opacity'
      ], props2 = [
        'width',
        'height',
        'overflow'
      ], cProps = ['fontSize'], vProps = [
        'borderTopWidth',
        'borderBottomWidth',
        'paddingTop',
        'paddingBottom'
      ], hProps = [
        'borderLeftWidth',
        'borderRightWidth',
        'paddingLeft',
        'paddingRight'
      ], mode = $.effects.setMode(el, o.mode || 'effect'), restore = o.restore || mode !== 'effect', scale = o.scale || 'both', origin = o.origin || [
        'middle',
        'center'
      ], position = el.css('position'), props = restore ? props0 : props1, zero = {
        height: 0,
        width: 0,
        outerHeight: 0,
        outerWidth: 0
      };
    if (mode === 'show') {
      el.show();
    }
    original = {
      height: el.height(),
      width: el.width(),
      outerHeight: el.outerHeight(),
      outerWidth: el.outerWidth()
    };
    if (o.mode === 'toggle' && mode === 'show') {
      el.from = o.to || zero;
      el.to = o.from || original;
    } else {
      el.from = o.from || (mode === 'show' ? zero : original);
      el.to = o.to || (mode === 'hide' ? zero : original);
    }
    factor = {
      from: {
        y: el.from.height / original.height,
        x: el.from.width / original.width
      },
      to: {
        y: el.to.height / original.height,
        x: el.to.width / original.width
      }
    };
    if (scale === 'box' || scale === 'both') {
      if (factor.from.y !== factor.to.y) {
        props = props.concat(vProps);
        el.from = $.effects.setTransition(el, vProps, factor.from.y, el.from);
        el.to = $.effects.setTransition(el, vProps, factor.to.y, el.to);
      }
      if (factor.from.x !== factor.to.x) {
        props = props.concat(hProps);
        el.from = $.effects.setTransition(el, hProps, factor.from.x, el.from);
        el.to = $.effects.setTransition(el, hProps, factor.to.x, el.to);
      }
    }
    if (scale === 'content' || scale === 'both') {
      if (factor.from.y !== factor.to.y) {
        props = props.concat(cProps).concat(props2);
        el.from = $.effects.setTransition(el, cProps, factor.from.y, el.from);
        el.to = $.effects.setTransition(el, cProps, factor.to.y, el.to);
      }
    }
    $.effects.save(el, props);
    el.show();
    $.effects.createWrapper(el);
    el.css('overflow', 'hidden').css(el.from);
    if (origin) {
      baseline = $.effects.getBaseline(origin, original);
      el.from.top = (original.outerHeight - el.outerHeight()) * baseline.y;
      el.from.left = (original.outerWidth - el.outerWidth()) * baseline.x;
      el.to.top = (original.outerHeight - el.to.outerHeight) * baseline.y;
      el.to.left = (original.outerWidth - el.to.outerWidth) * baseline.x;
    }
    el.css(el.from);
    if (scale === 'content' || scale === 'both') {
      vProps = vProps.concat([
        'marginTop',
        'marginBottom'
      ]).concat(cProps);
      hProps = hProps.concat([
        'marginLeft',
        'marginRight'
      ]);
      props2 = props0.concat(vProps).concat(hProps);
      el.find('*[width]').each(function () {
        var child = $(this), c_original = {
            height: child.height(),
            width: child.width(),
            outerHeight: child.outerHeight(),
            outerWidth: child.outerWidth()
          };
        if (restore) {
          $.effects.save(child, props2);
        }
        child.from = {
          height: c_original.height * factor.from.y,
          width: c_original.width * factor.from.x,
          outerHeight: c_original.outerHeight * factor.from.y,
          outerWidth: c_original.outerWidth * factor.from.x
        };
        child.to = {
          height: c_original.height * factor.to.y,
          width: c_original.width * factor.to.x,
          outerHeight: c_original.height * factor.to.y,
          outerWidth: c_original.width * factor.to.x
        };
        if (factor.from.y !== factor.to.y) {
          child.from = $.effects.setTransition(child, vProps, factor.from.y, child.from);
          child.to = $.effects.setTransition(child, vProps, factor.to.y, child.to);
        }
        if (factor.from.x !== factor.to.x) {
          child.from = $.effects.setTransition(child, hProps, factor.from.x, child.from);
          child.to = $.effects.setTransition(child, hProps, factor.to.x, child.to);
        }
        child.css(child.from);
        child.animate(child.to, o.duration, o.easing, function () {
          if (restore) {
            $.effects.restore(child, props2);
          }
        });
      });
    }
    el.animate(el.to, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: function () {
        if (el.to.opacity === 0) {
          el.css('opacity', el.from.opacity);
        }
        if (mode === 'hide') {
          el.hide();
        }
        $.effects.restore(el, props);
        if (!restore) {
          if (position === 'static') {
            el.css({
              position: 'relative',
              top: el.to.top,
              left: el.to.left
            });
          } else {
            $.each([
              'top',
              'left'
            ], function (idx, pos) {
              el.css(pos, function (_, str) {
                var val = parseInt(str, 10), toRef = idx ? el.to.left : el.to.top;
                if (str === 'auto') {
                  return toRef + 'px';
                }
                return val + toRef + 'px';
              });
            });
          }
        }
        $.effects.removeWrapper(el);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.shake = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'height',
        'width'
      ], mode = $.effects.setMode(el, o.mode || 'effect'), direction = o.direction || 'left', distance = o.distance || 20, times = o.times || 3, anims = times * 2 + 1, speed = Math.round(o.duration / anims), ref = direction === 'up' || direction === 'down' ? 'top' : 'left', positiveMotion = direction === 'up' || direction === 'left', animation = {}, animation1 = {}, animation2 = {}, i, queue = el.queue(), queuelen = queue.length;
    $.effects.save(el, props);
    el.show();
    $.effects.createWrapper(el);
    animation[ref] = (positiveMotion ? '-=' : '+=') + distance;
    animation1[ref] = (positiveMotion ? '+=' : '-=') + distance * 2;
    animation2[ref] = (positiveMotion ? '-=' : '+=') + distance * 2;
    el.animate(animation, speed, o.easing);
    for (i = 1; i < times; i++) {
      el.animate(animation1, speed, o.easing).animate(animation2, speed, o.easing);
    }
    el.animate(animation1, speed, o.easing).animate(animation, speed / 2, o.easing).queue(function () {
      if (mode === 'hide') {
        el.hide();
      }
      $.effects.restore(el, props);
      $.effects.removeWrapper(el);
      done();
    });
    if (queuelen > 1) {
      queue.splice.apply(queue, [
        1,
        0
      ].concat(queue.splice(queuelen, anims + 1)));
    }
    el.dequeue();
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.slide = function (o, done) {
    var el = $(this), props = [
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'width',
        'height'
      ], mode = $.effects.setMode(el, o.mode || 'show'), show = mode === 'show', direction = o.direction || 'left', ref = direction === 'up' || direction === 'down' ? 'top' : 'left', positiveMotion = direction === 'up' || direction === 'left', distance, animation = {};
    $.effects.save(el, props);
    el.show();
    distance = o.distance || el[ref === 'top' ? 'outerHeight' : 'outerWidth'](true);
    $.effects.createWrapper(el).css({ overflow: 'hidden' });
    if (show) {
      el.css(ref, positiveMotion ? isNaN(distance) ? '-' + distance : -distance : distance);
    }
    animation[ref] = (show ? positiveMotion ? '+=' : '-=' : positiveMotion ? '-=' : '+=') + distance;
    el.animate(animation, {
      queue: false,
      duration: o.duration,
      easing: o.easing,
      complete: function () {
        if (mode === 'hide') {
          el.hide();
        }
        $.effects.restore(el, props);
        $.effects.removeWrapper(el);
        done();
      }
    });
  };
}(jQuery));
(function ($, undefined) {
  $.effects.effect.transfer = function (o, done) {
    var elem = $(this), target = $(o.to), targetFixed = target.css('position') === 'fixed', body = $('body'), fixTop = targetFixed ? body.scrollTop() : 0, fixLeft = targetFixed ? body.scrollLeft() : 0, endPosition = target.offset(), animation = {
        top: endPosition.top - fixTop,
        left: endPosition.left - fixLeft,
        height: target.innerHeight(),
        width: target.innerWidth()
      }, startPosition = elem.offset(), transfer = $('<div class="ui-effects-transfer"></div>').appendTo(document.body).addClass(o.className).css({
        top: startPosition.top - fixTop,
        left: startPosition.left - fixLeft,
        height: elem.innerHeight(),
        width: elem.innerWidth(),
        position: targetFixed ? 'fixed' : 'absolute'
      }).animate(animation, o.duration, o.easing, function () {
        transfer.remove();
        done();
      });
  };
}(jQuery));
(function ($, undefined) {
  var mouseHandled = false;
  $.widget('ui.menu', {
    version: '1.9.2',
    defaultElement: '<ul>',
    delay: 300,
    options: {
      icons: { submenu: 'ui-icon-carat-1-e' },
      menus: 'ul',
      position: {
        my: 'left top',
        at: 'right top'
      },
      role: 'menu',
      blur: null,
      focus: null,
      select: null
    },
    _create: function () {
      this.activeMenu = this.element;
      this.element.uniqueId().addClass('ui-menu ui-widget ui-widget-content ui-corner-all').toggleClass('ui-menu-icons', !!this.element.find('.ui-icon').length).attr({
        role: this.options.role,
        tabIndex: 0
      }).bind('click' + this.eventNamespace, $.proxy(function (event) {
        if (this.options.disabled) {
          event.preventDefault();
        }
      }, this));
      if (this.options.disabled) {
        this.element.addClass('ui-state-disabled').attr('aria-disabled', 'true');
      }
      this._on({
        'mousedown .ui-menu-item > a': function (event) {
          event.preventDefault();
        },
        'click .ui-state-disabled > a': function (event) {
          event.preventDefault();
        },
        'click .ui-menu-item:has(a)': function (event) {
          var target = $(event.target).closest('.ui-menu-item');
          if (!mouseHandled && target.not('.ui-state-disabled').length) {
            mouseHandled = true;
            this.select(event);
            if (target.has('.ui-menu').length) {
              this.expand(event);
            } else if (!this.element.is(':focus')) {
              this.element.trigger('focus', [true]);
              if (this.active && this.active.parents('.ui-menu').length === 1) {
                clearTimeout(this.timer);
              }
            }
          }
        },
        'mouseenter .ui-menu-item': function (event) {
          var target = $(event.currentTarget);
          target.siblings().children('.ui-state-active').removeClass('ui-state-active');
          this.focus(event, target);
        },
        mouseleave: 'collapseAll',
        'mouseleave .ui-menu': 'collapseAll',
        focus: function (event, keepActiveItem) {
          var item = this.active || this.element.children('.ui-menu-item').eq(0);
          if (!keepActiveItem) {
            this.focus(event, item);
          }
        },
        blur: function (event) {
          this._delay(function () {
            if (!$.contains(this.element[0], this.document[0].activeElement)) {
              this.collapseAll(event);
            }
          });
        },
        keydown: '_keydown'
      });
      this.refresh();
      this._on(this.document, {
        click: function (event) {
          if (!$(event.target).closest('.ui-menu').length) {
            this.collapseAll(event);
          }
          mouseHandled = false;
        }
      });
    },
    _destroy: function () {
      this.element.removeAttr('aria-activedescendant').find('.ui-menu').andSelf().removeClass('ui-menu ui-widget ui-widget-content ui-corner-all ui-menu-icons').removeAttr('role').removeAttr('tabIndex').removeAttr('aria-labelledby').removeAttr('aria-expanded').removeAttr('aria-hidden').removeAttr('aria-disabled').removeUniqueId().show();
      this.element.find('.ui-menu-item').removeClass('ui-menu-item').removeAttr('role').removeAttr('aria-disabled').children('a').removeUniqueId().removeClass('ui-corner-all ui-state-hover').removeAttr('tabIndex').removeAttr('role').removeAttr('aria-haspopup').children().each(function () {
        var elem = $(this);
        if (elem.data('ui-menu-submenu-carat')) {
          elem.remove();
        }
      });
      this.element.find('.ui-menu-divider').removeClass('ui-menu-divider ui-widget-content');
    },
    _keydown: function (event) {
      var match, prev, character, skip, regex, preventDefault = true;
      function escape(value) {
        return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
      }
      switch (event.keyCode) {
      case $.ui.keyCode.PAGE_UP:
        this.previousPage(event);
        break;
      case $.ui.keyCode.PAGE_DOWN:
        this.nextPage(event);
        break;
      case $.ui.keyCode.HOME:
        this._move('first', 'first', event);
        break;
      case $.ui.keyCode.END:
        this._move('last', 'last', event);
        break;
      case $.ui.keyCode.UP:
        this.previous(event);
        break;
      case $.ui.keyCode.DOWN:
        this.next(event);
        break;
      case $.ui.keyCode.LEFT:
        this.collapse(event);
        break;
      case $.ui.keyCode.RIGHT:
        if (this.active && !this.active.is('.ui-state-disabled')) {
          this.expand(event);
        }
        break;
      case $.ui.keyCode.ENTER:
      case $.ui.keyCode.SPACE:
        this._activate(event);
        break;
      case $.ui.keyCode.ESCAPE:
        this.collapse(event);
        break;
      default:
        preventDefault = false;
        prev = this.previousFilter || '';
        character = String.fromCharCode(event.keyCode);
        skip = false;
        clearTimeout(this.filterTimer);
        if (character === prev) {
          skip = true;
        } else {
          character = prev + character;
        }
        regex = new RegExp('^' + escape(character), 'i');
        match = this.activeMenu.children('.ui-menu-item').filter(function () {
          return regex.test($(this).children('a').text());
        });
        match = skip && match.index(this.active.next()) !== -1 ? this.active.nextAll('.ui-menu-item') : match;
        if (!match.length) {
          character = String.fromCharCode(event.keyCode);
          regex = new RegExp('^' + escape(character), 'i');
          match = this.activeMenu.children('.ui-menu-item').filter(function () {
            return regex.test($(this).children('a').text());
          });
        }
        if (match.length) {
          this.focus(event, match);
          if (match.length > 1) {
            this.previousFilter = character;
            this.filterTimer = this._delay(function () {
              delete this.previousFilter;
            }, 1000);
          } else {
            delete this.previousFilter;
          }
        } else {
          delete this.previousFilter;
        }
      }
      if (preventDefault) {
        event.preventDefault();
      }
    },
    _activate: function (event) {
      if (!this.active.is('.ui-state-disabled')) {
        if (this.active.children('a[aria-haspopup=\'true\']').length) {
          this.expand(event);
        } else {
          this.select(event);
        }
      }
    },
    refresh: function () {
      var menus, icon = this.options.icons.submenu, submenus = this.element.find(this.options.menus);
      submenus.filter(':not(.ui-menu)').addClass('ui-menu ui-widget ui-widget-content ui-corner-all').hide().attr({
        role: this.options.role,
        'aria-hidden': 'true',
        'aria-expanded': 'false'
      }).each(function () {
        var menu = $(this), item = menu.prev('a'), submenuCarat = $('<span>').addClass('ui-menu-icon ui-icon ' + icon).data('ui-menu-submenu-carat', true);
        item.attr('aria-haspopup', 'true').prepend(submenuCarat);
        menu.attr('aria-labelledby', item.attr('id'));
      });
      menus = submenus.add(this.element);
      menus.children(':not(.ui-menu-item):has(a)').addClass('ui-menu-item').attr('role', 'presentation').children('a').uniqueId().addClass('ui-corner-all').attr({
        tabIndex: -1,
        role: this._itemRole()
      });
      menus.children(':not(.ui-menu-item)').each(function () {
        var item = $(this);
        if (!/[^\-—–\s]/.test(item.text())) {
          item.addClass('ui-widget-content ui-menu-divider');
        }
      });
      menus.children('.ui-state-disabled').attr('aria-disabled', 'true');
      if (this.active && !$.contains(this.element[0], this.active[0])) {
        this.blur();
      }
    },
    _itemRole: function () {
      return {
        menu: 'menuitem',
        listbox: 'option'
      }[this.options.role];
    },
    focus: function (event, item) {
      var nested, focused;
      this.blur(event, event && event.type === 'focus');
      this._scrollIntoView(item);
      this.active = item.first();
      focused = this.active.children('a').addClass('ui-state-focus');
      if (this.options.role) {
        this.element.attr('aria-activedescendant', focused.attr('id'));
      }
      this.active.parent().closest('.ui-menu-item').children('a:first').addClass('ui-state-active');
      if (event && event.type === 'keydown') {
        this._close();
      } else {
        this.timer = this._delay(function () {
          this._close();
        }, this.delay);
      }
      nested = item.children('.ui-menu');
      if (nested.length && /^mouse/.test(event.type)) {
        this._startOpening(nested);
      }
      this.activeMenu = item.parent();
      this._trigger('focus', event, { item: item });
    },
    _scrollIntoView: function (item) {
      var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
      if (this._hasScroll()) {
        borderTop = parseFloat($.css(this.activeMenu[0], 'borderTopWidth')) || 0;
        paddingTop = parseFloat($.css(this.activeMenu[0], 'paddingTop')) || 0;
        offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
        scroll = this.activeMenu.scrollTop();
        elementHeight = this.activeMenu.height();
        itemHeight = item.height();
        if (offset < 0) {
          this.activeMenu.scrollTop(scroll + offset);
        } else if (offset + itemHeight > elementHeight) {
          this.activeMenu.scrollTop(scroll + offset - elementHeight + itemHeight);
        }
      }
    },
    blur: function (event, fromFocus) {
      if (!fromFocus) {
        clearTimeout(this.timer);
      }
      if (!this.active) {
        return;
      }
      this.active.children('a').removeClass('ui-state-focus');
      this.active = null;
      this._trigger('blur', event, { item: this.active });
    },
    _startOpening: function (submenu) {
      clearTimeout(this.timer);
      if (submenu.attr('aria-hidden') !== 'true') {
        return;
      }
      this.timer = this._delay(function () {
        this._close();
        this._open(submenu);
      }, this.delay);
    },
    _open: function (submenu) {
      var position = $.extend({ of: this.active }, this.options.position);
      clearTimeout(this.timer);
      this.element.find('.ui-menu').not(submenu.parents('.ui-menu')).hide().attr('aria-hidden', 'true');
      submenu.show().removeAttr('aria-hidden').attr('aria-expanded', 'true').position(position);
    },
    collapseAll: function (event, all) {
      clearTimeout(this.timer);
      this.timer = this._delay(function () {
        var currentMenu = all ? this.element : $(event && event.target).closest(this.element.find('.ui-menu'));
        if (!currentMenu.length) {
          currentMenu = this.element;
        }
        this._close(currentMenu);
        this.blur(event);
        this.activeMenu = currentMenu;
      }, this.delay);
    },
    _close: function (startMenu) {
      if (!startMenu) {
        startMenu = this.active ? this.active.parent() : this.element;
      }
      startMenu.find('.ui-menu').hide().attr('aria-hidden', 'true').attr('aria-expanded', 'false').end().find('a.ui-state-active').removeClass('ui-state-active');
    },
    collapse: function (event) {
      var newItem = this.active && this.active.parent().closest('.ui-menu-item', this.element);
      if (newItem && newItem.length) {
        this._close();
        this.focus(event, newItem);
      }
    },
    expand: function (event) {
      var newItem = this.active && this.active.children('.ui-menu ').children('.ui-menu-item').first();
      if (newItem && newItem.length) {
        this._open(newItem.parent());
        this._delay(function () {
          this.focus(event, newItem);
        });
      }
    },
    next: function (event) {
      this._move('next', 'first', event);
    },
    previous: function (event) {
      this._move('prev', 'last', event);
    },
    isFirstItem: function () {
      return this.active && !this.active.prevAll('.ui-menu-item').length;
    },
    isLastItem: function () {
      return this.active && !this.active.nextAll('.ui-menu-item').length;
    },
    _move: function (direction, filter, event) {
      var next;
      if (this.active) {
        if (direction === 'first' || direction === 'last') {
          next = this.active[direction === 'first' ? 'prevAll' : 'nextAll']('.ui-menu-item').eq(-1);
        } else {
          next = this.active[direction + 'All']('.ui-menu-item').eq(0);
        }
      }
      if (!next || !next.length || !this.active) {
        next = this.activeMenu.children('.ui-menu-item')[filter]();
      }
      this.focus(event, next);
    },
    nextPage: function (event) {
      var item, base, height;
      if (!this.active) {
        this.next(event);
        return;
      }
      if (this.isLastItem()) {
        return;
      }
      if (this._hasScroll()) {
        base = this.active.offset().top;
        height = this.element.height();
        this.active.nextAll('.ui-menu-item').each(function () {
          item = $(this);
          return item.offset().top - base - height < 0;
        });
        this.focus(event, item);
      } else {
        this.focus(event, this.activeMenu.children('.ui-menu-item')[!this.active ? 'first' : 'last']());
      }
    },
    previousPage: function (event) {
      var item, base, height;
      if (!this.active) {
        this.next(event);
        return;
      }
      if (this.isFirstItem()) {
        return;
      }
      if (this._hasScroll()) {
        base = this.active.offset().top;
        height = this.element.height();
        this.active.prevAll('.ui-menu-item').each(function () {
          item = $(this);
          return item.offset().top - base + height > 0;
        });
        this.focus(event, item);
      } else {
        this.focus(event, this.activeMenu.children('.ui-menu-item').first());
      }
    },
    _hasScroll: function () {
      return this.element.outerHeight() < this.element.prop('scrollHeight');
    },
    select: function (event) {
      this.active = this.active || $(event.target).closest('.ui-menu-item');
      var ui = { item: this.active };
      if (!this.active.has('.ui-menu').length) {
        this.collapseAll(event, true);
      }
      this._trigger('select', event, ui);
    }
  });
}(jQuery));
(function ($, undefined) {
  $.ui = $.ui || {};
  var cachedScrollbarWidth, max = Math.max, abs = Math.abs, round = Math.round, rhorizontal = /left|center|right/, rvertical = /top|center|bottom/, roffset = /[\+\-]\d+%?/, rposition = /^\w+/, rpercent = /%$/, _position = $.fn.position;
  function getOffsets(offsets, width, height) {
    return [
      parseInt(offsets[0], 10) * (rpercent.test(offsets[0]) ? width / 100 : 1),
      parseInt(offsets[1], 10) * (rpercent.test(offsets[1]) ? height / 100 : 1)
    ];
  }
  function parseCss(element, property) {
    return parseInt($.css(element, property), 10) || 0;
  }
  $.position = {
    scrollbarWidth: function () {
      if (cachedScrollbarWidth !== undefined) {
        return cachedScrollbarWidth;
      }
      var w1, w2, div = $('<div style=\'display:block;width:50px;height:50px;overflow:hidden;\'><div style=\'height:100px;width:auto;\'></div></div>'), innerDiv = div.children()[0];
      $('body').append(div);
      w1 = innerDiv.offsetWidth;
      div.css('overflow', 'scroll');
      w2 = innerDiv.offsetWidth;
      if (w1 === w2) {
        w2 = div[0].clientWidth;
      }
      div.remove();
      return cachedScrollbarWidth = w1 - w2;
    },
    getScrollInfo: function (within) {
      var overflowX = within.isWindow ? '' : within.element.css('overflow-x'), overflowY = within.isWindow ? '' : within.element.css('overflow-y'), hasOverflowX = overflowX === 'scroll' || overflowX === 'auto' && within.width < within.element[0].scrollWidth, hasOverflowY = overflowY === 'scroll' || overflowY === 'auto' && within.height < within.element[0].scrollHeight;
      return {
        width: hasOverflowX ? $.position.scrollbarWidth() : 0,
        height: hasOverflowY ? $.position.scrollbarWidth() : 0
      };
    },
    getWithinInfo: function (element) {
      var withinElement = $(element || window), isWindow = $.isWindow(withinElement[0]);
      return {
        element: withinElement,
        isWindow: isWindow,
        offset: withinElement.offset() || {
          left: 0,
          top: 0
        },
        scrollLeft: withinElement.scrollLeft(),
        scrollTop: withinElement.scrollTop(),
        width: isWindow ? withinElement.width() : withinElement.outerWidth(),
        height: isWindow ? withinElement.height() : withinElement.outerHeight()
      };
    }
  };
  $.fn.position = function (options) {
    if (!options || !options.of) {
      return _position.apply(this, arguments);
    }
    options = $.extend({}, options);
    var atOffset, targetWidth, targetHeight, targetOffset, basePosition, target = $(options.of), within = $.position.getWithinInfo(options.within), scrollInfo = $.position.getScrollInfo(within), targetElem = target[0], collision = (options.collision || 'flip').split(' '), offsets = {};
    if (targetElem.nodeType === 9) {
      targetWidth = target.width();
      targetHeight = target.height();
      targetOffset = {
        top: 0,
        left: 0
      };
    } else if ($.isWindow(targetElem)) {
      targetWidth = target.width();
      targetHeight = target.height();
      targetOffset = {
        top: target.scrollTop(),
        left: target.scrollLeft()
      };
    } else if (targetElem.preventDefault) {
      options.at = 'left top';
      targetWidth = targetHeight = 0;
      targetOffset = {
        top: targetElem.pageY,
        left: targetElem.pageX
      };
    } else {
      targetWidth = target.outerWidth();
      targetHeight = target.outerHeight();
      targetOffset = target.offset();
    }
    basePosition = $.extend({}, targetOffset);
    $.each([
      'my',
      'at'
    ], function () {
      var pos = (options[this] || '').split(' '), horizontalOffset, verticalOffset;
      if (pos.length === 1) {
        pos = rhorizontal.test(pos[0]) ? pos.concat(['center']) : rvertical.test(pos[0]) ? ['center'].concat(pos) : [
          'center',
          'center'
        ];
      }
      pos[0] = rhorizontal.test(pos[0]) ? pos[0] : 'center';
      pos[1] = rvertical.test(pos[1]) ? pos[1] : 'center';
      horizontalOffset = roffset.exec(pos[0]);
      verticalOffset = roffset.exec(pos[1]);
      offsets[this] = [
        horizontalOffset ? horizontalOffset[0] : 0,
        verticalOffset ? verticalOffset[0] : 0
      ];
      options[this] = [
        rposition.exec(pos[0])[0],
        rposition.exec(pos[1])[0]
      ];
    });
    if (collision.length === 1) {
      collision[1] = collision[0];
    }
    if (options.at[0] === 'right') {
      basePosition.left += targetWidth;
    } else if (options.at[0] === 'center') {
      basePosition.left += targetWidth / 2;
    }
    if (options.at[1] === 'bottom') {
      basePosition.top += targetHeight;
    } else if (options.at[1] === 'center') {
      basePosition.top += targetHeight / 2;
    }
    atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
    basePosition.left += atOffset[0];
    basePosition.top += atOffset[1];
    return this.each(function () {
      var collisionPosition, using, elem = $(this), elemWidth = elem.outerWidth(), elemHeight = elem.outerHeight(), marginLeft = parseCss(this, 'marginLeft'), marginTop = parseCss(this, 'marginTop'), collisionWidth = elemWidth + marginLeft + parseCss(this, 'marginRight') + scrollInfo.width, collisionHeight = elemHeight + marginTop + parseCss(this, 'marginBottom') + scrollInfo.height, position = $.extend({}, basePosition), myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());
      if (options.my[0] === 'right') {
        position.left -= elemWidth;
      } else if (options.my[0] === 'center') {
        position.left -= elemWidth / 2;
      }
      if (options.my[1] === 'bottom') {
        position.top -= elemHeight;
      } else if (options.my[1] === 'center') {
        position.top -= elemHeight / 2;
      }
      position.left += myOffset[0];
      position.top += myOffset[1];
      if (!$.support.offsetFractions) {
        position.left = round(position.left);
        position.top = round(position.top);
      }
      collisionPosition = {
        marginLeft: marginLeft,
        marginTop: marginTop
      };
      $.each([
        'left',
        'top'
      ], function (i, dir) {
        if ($.ui.position[collision[i]]) {
          $.ui.position[collision[i]][dir](position, {
            targetWidth: targetWidth,
            targetHeight: targetHeight,
            elemWidth: elemWidth,
            elemHeight: elemHeight,
            collisionPosition: collisionPosition,
            collisionWidth: collisionWidth,
            collisionHeight: collisionHeight,
            offset: [
              atOffset[0] + myOffset[0],
              atOffset[1] + myOffset[1]
            ],
            my: options.my,
            at: options.at,
            within: within,
            elem: elem
          });
        }
      });
      if ($.fn.bgiframe) {
        elem.bgiframe();
      }
      if (options.using) {
        using = function (props) {
          var left = targetOffset.left - position.left, right = left + targetWidth - elemWidth, top = targetOffset.top - position.top, bottom = top + targetHeight - elemHeight, feedback = {
              target: {
                element: target,
                left: targetOffset.left,
                top: targetOffset.top,
                width: targetWidth,
                height: targetHeight
              },
              element: {
                element: elem,
                left: position.left,
                top: position.top,
                width: elemWidth,
                height: elemHeight
              },
              horizontal: right < 0 ? 'left' : left > 0 ? 'right' : 'center',
              vertical: bottom < 0 ? 'top' : top > 0 ? 'bottom' : 'middle'
            };
          if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
            feedback.horizontal = 'center';
          }
          if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
            feedback.vertical = 'middle';
          }
          if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
            feedback.important = 'horizontal';
          } else {
            feedback.important = 'vertical';
          }
          options.using.call(this, props, feedback);
        };
      }
      elem.offset($.extend(position, { using: using }));
    });
  };
  $.ui.position = {
    fit: {
      left: function (position, data) {
        var within = data.within, withinOffset = within.isWindow ? within.scrollLeft : within.offset.left, outerWidth = within.width, collisionPosLeft = position.left - data.collisionPosition.marginLeft, overLeft = withinOffset - collisionPosLeft, overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset, newOverRight;
        if (data.collisionWidth > outerWidth) {
          if (overLeft > 0 && overRight <= 0) {
            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
            position.left += overLeft - newOverRight;
          } else if (overRight > 0 && overLeft <= 0) {
            position.left = withinOffset;
          } else {
            if (overLeft > overRight) {
              position.left = withinOffset + outerWidth - data.collisionWidth;
            } else {
              position.left = withinOffset;
            }
          }
        } else if (overLeft > 0) {
          position.left += overLeft;
        } else if (overRight > 0) {
          position.left -= overRight;
        } else {
          position.left = max(position.left - collisionPosLeft, position.left);
        }
      },
      top: function (position, data) {
        var within = data.within, withinOffset = within.isWindow ? within.scrollTop : within.offset.top, outerHeight = data.within.height, collisionPosTop = position.top - data.collisionPosition.marginTop, overTop = withinOffset - collisionPosTop, overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset, newOverBottom;
        if (data.collisionHeight > outerHeight) {
          if (overTop > 0 && overBottom <= 0) {
            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
            position.top += overTop - newOverBottom;
          } else if (overBottom > 0 && overTop <= 0) {
            position.top = withinOffset;
          } else {
            if (overTop > overBottom) {
              position.top = withinOffset + outerHeight - data.collisionHeight;
            } else {
              position.top = withinOffset;
            }
          }
        } else if (overTop > 0) {
          position.top += overTop;
        } else if (overBottom > 0) {
          position.top -= overBottom;
        } else {
          position.top = max(position.top - collisionPosTop, position.top);
        }
      }
    },
    flip: {
      left: function (position, data) {
        var within = data.within, withinOffset = within.offset.left + within.scrollLeft, outerWidth = within.width, offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left, collisionPosLeft = position.left - data.collisionPosition.marginLeft, overLeft = collisionPosLeft - offsetLeft, overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft, myOffset = data.my[0] === 'left' ? -data.elemWidth : data.my[0] === 'right' ? data.elemWidth : 0, atOffset = data.at[0] === 'left' ? data.targetWidth : data.at[0] === 'right' ? -data.targetWidth : 0, offset = -2 * data.offset[0], newOverRight, newOverLeft;
        if (overLeft < 0) {
          newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
          if (newOverRight < 0 || newOverRight < abs(overLeft)) {
            position.left += myOffset + atOffset + offset;
          }
        } else if (overRight > 0) {
          newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
          if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
            position.left += myOffset + atOffset + offset;
          }
        }
      },
      top: function (position, data) {
        var within = data.within, withinOffset = within.offset.top + within.scrollTop, outerHeight = within.height, offsetTop = within.isWindow ? within.scrollTop : within.offset.top, collisionPosTop = position.top - data.collisionPosition.marginTop, overTop = collisionPosTop - offsetTop, overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop, top = data.my[1] === 'top', myOffset = top ? -data.elemHeight : data.my[1] === 'bottom' ? data.elemHeight : 0, atOffset = data.at[1] === 'top' ? data.targetHeight : data.at[1] === 'bottom' ? -data.targetHeight : 0, offset = -2 * data.offset[1], newOverTop, newOverBottom;
        if (overTop < 0) {
          newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
          if (position.top + myOffset + atOffset + offset > overTop && (newOverBottom < 0 || newOverBottom < abs(overTop))) {
            position.top += myOffset + atOffset + offset;
          }
        } else if (overBottom > 0) {
          newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
          if (position.top + myOffset + atOffset + offset > overBottom && (newOverTop > 0 || abs(newOverTop) < overBottom)) {
            position.top += myOffset + atOffset + offset;
          }
        }
      }
    },
    flipfit: {
      left: function () {
        $.ui.position.flip.left.apply(this, arguments);
        $.ui.position.fit.left.apply(this, arguments);
      },
      top: function () {
        $.ui.position.flip.top.apply(this, arguments);
        $.ui.position.fit.top.apply(this, arguments);
      }
    }
  };
  (function () {
    var testElement, testElementParent, testElementStyle, offsetLeft, i, body = document.getElementsByTagName('body')[0], div = document.createElement('div');
    testElement = document.createElement(body ? 'div' : 'body');
    testElementStyle = {
      visibility: 'hidden',
      width: 0,
      height: 0,
      border: 0,
      margin: 0,
      background: 'none'
    };
    if (body) {
      $.extend(testElementStyle, {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px'
      });
    }
    for (i in testElementStyle) {
      testElement.style[i] = testElementStyle[i];
    }
    testElement.appendChild(div);
    testElementParent = body || document.documentElement;
    testElementParent.insertBefore(testElement, testElementParent.firstChild);
    div.style.cssText = 'position: absolute; left: 10.7432222px;';
    offsetLeft = $(div).offset().left;
    $.support.offsetFractions = offsetLeft > 10 && offsetLeft < 11;
    testElement.innerHTML = '';
    testElementParent.removeChild(testElement);
  }());
  if ($.uiBackCompat !== false) {
    (function ($) {
      var _position = $.fn.position;
      $.fn.position = function (options) {
        if (!options || !options.offset) {
          return _position.call(this, options);
        }
        var offset = options.offset.split(' '), at = options.at.split(' ');
        if (offset.length === 1) {
          offset[1] = offset[0];
        }
        if (/^\d/.test(offset[0])) {
          offset[0] = '+' + offset[0];
        }
        if (/^\d/.test(offset[1])) {
          offset[1] = '+' + offset[1];
        }
        if (at.length === 1) {
          if (/left|center|right/.test(at[0])) {
            at[1] = 'center';
          } else {
            at[1] = at[0];
            at[0] = 'center';
          }
        }
        return _position.call(this, $.extend(options, {
          at: at[0] + offset[0] + ' ' + at[1] + offset[1],
          offset: undefined
        }));
      };
    }(jQuery));
  }
}(jQuery));
(function ($, undefined) {
  $.widget('ui.progressbar', {
    version: '1.9.2',
    options: {
      value: 0,
      max: 100
    },
    min: 0,
    _create: function () {
      this.element.addClass('ui-progressbar ui-widget ui-widget-content ui-corner-all').attr({
        role: 'progressbar',
        'aria-valuemin': this.min,
        'aria-valuemax': this.options.max,
        'aria-valuenow': this._value()
      });
      this.valueDiv = $('<div class=\'ui-progressbar-value ui-widget-header ui-corner-left\'></div>').appendTo(this.element);
      this.oldValue = this._value();
      this._refreshValue();
    },
    _destroy: function () {
      this.element.removeClass('ui-progressbar ui-widget ui-widget-content ui-corner-all').removeAttr('role').removeAttr('aria-valuemin').removeAttr('aria-valuemax').removeAttr('aria-valuenow');
      this.valueDiv.remove();
    },
    value: function (newValue) {
      if (newValue === undefined) {
        return this._value();
      }
      this._setOption('value', newValue);
      return this;
    },
    _setOption: function (key, value) {
      if (key === 'value') {
        this.options.value = value;
        this._refreshValue();
        if (this._value() === this.options.max) {
          this._trigger('complete');
        }
      }
      this._super(key, value);
    },
    _value: function () {
      var val = this.options.value;
      if (typeof val !== 'number') {
        val = 0;
      }
      return Math.min(this.options.max, Math.max(this.min, val));
    },
    _percentage: function () {
      return 100 * this._value() / this.options.max;
    },
    _refreshValue: function () {
      var value = this.value(), percentage = this._percentage();
      if (this.oldValue !== value) {
        this.oldValue = value;
        this._trigger('change');
      }
      this.valueDiv.toggle(value > this.min).toggleClass('ui-corner-right', value === this.options.max).width(percentage.toFixed(0) + '%');
      this.element.attr('aria-valuenow', value);
    }
  });
}(jQuery));
(function ($, undefined) {
  var numPages = 5;
  $.widget('ui.slider', $.ui.mouse, {
    version: '1.9.2',
    widgetEventPrefix: 'slide',
    options: {
      animate: false,
      distance: 0,
      max: 100,
      min: 0,
      orientation: 'horizontal',
      range: false,
      step: 1,
      value: 0,
      values: null
    },
    _create: function () {
      var i, handleCount, o = this.options, existingHandles = this.element.find('.ui-slider-handle').addClass('ui-state-default ui-corner-all'), handle = '<a class=\'ui-slider-handle ui-state-default ui-corner-all\' href=\'#\'></a>', handles = [];
      this._keySliding = false;
      this._mouseSliding = false;
      this._animateOff = true;
      this._handleIndex = null;
      this._detectOrientation();
      this._mouseInit();
      this.element.addClass('ui-slider' + ' ui-slider-' + this.orientation + ' ui-widget' + ' ui-widget-content' + ' ui-corner-all' + (o.disabled ? ' ui-slider-disabled ui-disabled' : ''));
      this.range = $([]);
      if (o.range) {
        if (o.range === true) {
          if (!o.values) {
            o.values = [
              this._valueMin(),
              this._valueMin()
            ];
          }
          if (o.values.length && o.values.length !== 2) {
            o.values = [
              o.values[0],
              o.values[0]
            ];
          }
        }
        this.range = $('<div></div>').appendTo(this.element).addClass('ui-slider-range' + ' ui-widget-header' + (o.range === 'min' || o.range === 'max' ? ' ui-slider-range-' + o.range : ''));
      }
      handleCount = o.values && o.values.length || 1;
      for (i = existingHandles.length; i < handleCount; i++) {
        handles.push(handle);
      }
      this.handles = existingHandles.add($(handles.join('')).appendTo(this.element));
      this.handle = this.handles.eq(0);
      this.handles.add(this.range).filter('a').click(function (event) {
        event.preventDefault();
      }).mouseenter(function () {
        if (!o.disabled) {
          $(this).addClass('ui-state-hover');
        }
      }).mouseleave(function () {
        $(this).removeClass('ui-state-hover');
      }).focus(function () {
        if (!o.disabled) {
          $('.ui-slider .ui-state-focus').removeClass('ui-state-focus');
          $(this).addClass('ui-state-focus');
        } else {
          $(this).blur();
        }
      }).blur(function () {
        $(this).removeClass('ui-state-focus');
      });
      this.handles.each(function (i) {
        $(this).data('ui-slider-handle-index', i);
      });
      this._on(this.handles, {
        keydown: function (event) {
          var allowed, curVal, newVal, step, index = $(event.target).data('ui-slider-handle-index');
          switch (event.keyCode) {
          case $.ui.keyCode.HOME:
          case $.ui.keyCode.END:
          case $.ui.keyCode.PAGE_UP:
          case $.ui.keyCode.PAGE_DOWN:
          case $.ui.keyCode.UP:
          case $.ui.keyCode.RIGHT:
          case $.ui.keyCode.DOWN:
          case $.ui.keyCode.LEFT:
            event.preventDefault();
            if (!this._keySliding) {
              this._keySliding = true;
              $(event.target).addClass('ui-state-active');
              allowed = this._start(event, index);
              if (allowed === false) {
                return;
              }
            }
            break;
          }
          step = this.options.step;
          if (this.options.values && this.options.values.length) {
            curVal = newVal = this.values(index);
          } else {
            curVal = newVal = this.value();
          }
          switch (event.keyCode) {
          case $.ui.keyCode.HOME:
            newVal = this._valueMin();
            break;
          case $.ui.keyCode.END:
            newVal = this._valueMax();
            break;
          case $.ui.keyCode.PAGE_UP:
            newVal = this._trimAlignValue(curVal + (this._valueMax() - this._valueMin()) / numPages);
            break;
          case $.ui.keyCode.PAGE_DOWN:
            newVal = this._trimAlignValue(curVal - (this._valueMax() - this._valueMin()) / numPages);
            break;
          case $.ui.keyCode.UP:
          case $.ui.keyCode.RIGHT:
            if (curVal === this._valueMax()) {
              return;
            }
            newVal = this._trimAlignValue(curVal + step);
            break;
          case $.ui.keyCode.DOWN:
          case $.ui.keyCode.LEFT:
            if (curVal === this._valueMin()) {
              return;
            }
            newVal = this._trimAlignValue(curVal - step);
            break;
          }
          this._slide(event, index, newVal);
        },
        keyup: function (event) {
          var index = $(event.target).data('ui-slider-handle-index');
          if (this._keySliding) {
            this._keySliding = false;
            this._stop(event, index);
            this._change(event, index);
            $(event.target).removeClass('ui-state-active');
          }
        }
      });
      this._refreshValue();
      this._animateOff = false;
    },
    _destroy: function () {
      this.handles.remove();
      this.range.remove();
      this.element.removeClass('ui-slider' + ' ui-slider-horizontal' + ' ui-slider-vertical' + ' ui-slider-disabled' + ' ui-widget' + ' ui-widget-content' + ' ui-corner-all');
      this._mouseDestroy();
    },
    _mouseCapture: function (event) {
      var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle, that = this, o = this.options;
      if (o.disabled) {
        return false;
      }
      this.elementSize = {
        width: this.element.outerWidth(),
        height: this.element.outerHeight()
      };
      this.elementOffset = this.element.offset();
      position = {
        x: event.pageX,
        y: event.pageY
      };
      normValue = this._normValueFromMouse(position);
      distance = this._valueMax() - this._valueMin() + 1;
      this.handles.each(function (i) {
        var thisDistance = Math.abs(normValue - that.values(i));
        if (distance > thisDistance) {
          distance = thisDistance;
          closestHandle = $(this);
          index = i;
        }
      });
      if (o.range === true && this.values(1) === o.min) {
        index += 1;
        closestHandle = $(this.handles[index]);
      }
      allowed = this._start(event, index);
      if (allowed === false) {
        return false;
      }
      this._mouseSliding = true;
      this._handleIndex = index;
      closestHandle.addClass('ui-state-active').focus();
      offset = closestHandle.offset();
      mouseOverHandle = !$(event.target).parents().andSelf().is('.ui-slider-handle');
      this._clickOffset = mouseOverHandle ? {
        left: 0,
        top: 0
      } : {
        left: event.pageX - offset.left - closestHandle.width() / 2,
        top: event.pageY - offset.top - closestHandle.height() / 2 - (parseInt(closestHandle.css('borderTopWidth'), 10) || 0) - (parseInt(closestHandle.css('borderBottomWidth'), 10) || 0) + (parseInt(closestHandle.css('marginTop'), 10) || 0)
      };
      if (!this.handles.hasClass('ui-state-hover')) {
        this._slide(event, index, normValue);
      }
      this._animateOff = true;
      return true;
    },
    _mouseStart: function () {
      return true;
    },
    _mouseDrag: function (event) {
      var position = {
          x: event.pageX,
          y: event.pageY
        }, normValue = this._normValueFromMouse(position);
      this._slide(event, this._handleIndex, normValue);
      return false;
    },
    _mouseStop: function (event) {
      this.handles.removeClass('ui-state-active');
      this._mouseSliding = false;
      this._stop(event, this._handleIndex);
      this._change(event, this._handleIndex);
      this._handleIndex = null;
      this._clickOffset = null;
      this._animateOff = false;
      return false;
    },
    _detectOrientation: function () {
      this.orientation = this.options.orientation === 'vertical' ? 'vertical' : 'horizontal';
    },
    _normValueFromMouse: function (position) {
      var pixelTotal, pixelMouse, percentMouse, valueTotal, valueMouse;
      if (this.orientation === 'horizontal') {
        pixelTotal = this.elementSize.width;
        pixelMouse = position.x - this.elementOffset.left - (this._clickOffset ? this._clickOffset.left : 0);
      } else {
        pixelTotal = this.elementSize.height;
        pixelMouse = position.y - this.elementOffset.top - (this._clickOffset ? this._clickOffset.top : 0);
      }
      percentMouse = pixelMouse / pixelTotal;
      if (percentMouse > 1) {
        percentMouse = 1;
      }
      if (percentMouse < 0) {
        percentMouse = 0;
      }
      if (this.orientation === 'vertical') {
        percentMouse = 1 - percentMouse;
      }
      valueTotal = this._valueMax() - this._valueMin();
      valueMouse = this._valueMin() + percentMouse * valueTotal;
      return this._trimAlignValue(valueMouse);
    },
    _start: function (event, index) {
      var uiHash = {
          handle: this.handles[index],
          value: this.value()
        };
      if (this.options.values && this.options.values.length) {
        uiHash.value = this.values(index);
        uiHash.values = this.values();
      }
      return this._trigger('start', event, uiHash);
    },
    _slide: function (event, index, newVal) {
      var otherVal, newValues, allowed;
      if (this.options.values && this.options.values.length) {
        otherVal = this.values(index ? 0 : 1);
        if (this.options.values.length === 2 && this.options.range === true && (index === 0 && newVal > otherVal || index === 1 && newVal < otherVal)) {
          newVal = otherVal;
        }
        if (newVal !== this.values(index)) {
          newValues = this.values();
          newValues[index] = newVal;
          allowed = this._trigger('slide', event, {
            handle: this.handles[index],
            value: newVal,
            values: newValues
          });
          otherVal = this.values(index ? 0 : 1);
          if (allowed !== false) {
            this.values(index, newVal, true);
          }
        }
      } else {
        if (newVal !== this.value()) {
          allowed = this._trigger('slide', event, {
            handle: this.handles[index],
            value: newVal
          });
          if (allowed !== false) {
            this.value(newVal);
          }
        }
      }
    },
    _stop: function (event, index) {
      var uiHash = {
          handle: this.handles[index],
          value: this.value()
        };
      if (this.options.values && this.options.values.length) {
        uiHash.value = this.values(index);
        uiHash.values = this.values();
      }
      this._trigger('stop', event, uiHash);
    },
    _change: function (event, index) {
      if (!this._keySliding && !this._mouseSliding) {
        var uiHash = {
            handle: this.handles[index],
            value: this.value()
          };
        if (this.options.values && this.options.values.length) {
          uiHash.value = this.values(index);
          uiHash.values = this.values();
        }
        this._trigger('change', event, uiHash);
      }
    },
    value: function (newValue) {
      if (arguments.length) {
        this.options.value = this._trimAlignValue(newValue);
        this._refreshValue();
        this._change(null, 0);
        return;
      }
      return this._value();
    },
    values: function (index, newValue) {
      var vals, newValues, i;
      if (arguments.length > 1) {
        this.options.values[index] = this._trimAlignValue(newValue);
        this._refreshValue();
        this._change(null, index);
        return;
      }
      if (arguments.length) {
        if ($.isArray(arguments[0])) {
          vals = this.options.values;
          newValues = arguments[0];
          for (i = 0; i < vals.length; i += 1) {
            vals[i] = this._trimAlignValue(newValues[i]);
            this._change(null, i);
          }
          this._refreshValue();
        } else {
          if (this.options.values && this.options.values.length) {
            return this._values(index);
          } else {
            return this.value();
          }
        }
      } else {
        return this._values();
      }
    },
    _setOption: function (key, value) {
      var i, valsLength = 0;
      if ($.isArray(this.options.values)) {
        valsLength = this.options.values.length;
      }
      $.Widget.prototype._setOption.apply(this, arguments);
      switch (key) {
      case 'disabled':
        if (value) {
          this.handles.filter('.ui-state-focus').blur();
          this.handles.removeClass('ui-state-hover');
          this.handles.prop('disabled', true);
          this.element.addClass('ui-disabled');
        } else {
          this.handles.prop('disabled', false);
          this.element.removeClass('ui-disabled');
        }
        break;
      case 'orientation':
        this._detectOrientation();
        this.element.removeClass('ui-slider-horizontal ui-slider-vertical').addClass('ui-slider-' + this.orientation);
        this._refreshValue();
        break;
      case 'value':
        this._animateOff = true;
        this._refreshValue();
        this._change(null, 0);
        this._animateOff = false;
        break;
      case 'values':
        this._animateOff = true;
        this._refreshValue();
        for (i = 0; i < valsLength; i += 1) {
          this._change(null, i);
        }
        this._animateOff = false;
        break;
      case 'min':
      case 'max':
        this._animateOff = true;
        this._refreshValue();
        this._animateOff = false;
        break;
      }
    },
    _value: function () {
      var val = this.options.value;
      val = this._trimAlignValue(val);
      return val;
    },
    _values: function (index) {
      var val, vals, i;
      if (arguments.length) {
        val = this.options.values[index];
        val = this._trimAlignValue(val);
        return val;
      } else {
        vals = this.options.values.slice();
        for (i = 0; i < vals.length; i += 1) {
          vals[i] = this._trimAlignValue(vals[i]);
        }
        return vals;
      }
    },
    _trimAlignValue: function (val) {
      if (val <= this._valueMin()) {
        return this._valueMin();
      }
      if (val >= this._valueMax()) {
        return this._valueMax();
      }
      var step = this.options.step > 0 ? this.options.step : 1, valModStep = (val - this._valueMin()) % step, alignValue = val - valModStep;
      if (Math.abs(valModStep) * 2 >= step) {
        alignValue += valModStep > 0 ? step : -step;
      }
      return parseFloat(alignValue.toFixed(5));
    },
    _valueMin: function () {
      return this.options.min;
    },
    _valueMax: function () {
      return this.options.max;
    },
    _refreshValue: function () {
      var lastValPercent, valPercent, value, valueMin, valueMax, oRange = this.options.range, o = this.options, that = this, animate = !this._animateOff ? o.animate : false, _set = {};
      if (this.options.values && this.options.values.length) {
        this.handles.each(function (i) {
          valPercent = (that.values(i) - that._valueMin()) / (that._valueMax() - that._valueMin()) * 100;
          _set[that.orientation === 'horizontal' ? 'left' : 'bottom'] = valPercent + '%';
          $(this).stop(1, 1)[animate ? 'animate' : 'css'](_set, o.animate);
          if (that.options.range === true) {
            if (that.orientation === 'horizontal') {
              if (i === 0) {
                that.range.stop(1, 1)[animate ? 'animate' : 'css']({ left: valPercent + '%' }, o.animate);
              }
              if (i === 1) {
                that.range[animate ? 'animate' : 'css']({ width: valPercent - lastValPercent + '%' }, {
                  queue: false,
                  duration: o.animate
                });
              }
            } else {
              if (i === 0) {
                that.range.stop(1, 1)[animate ? 'animate' : 'css']({ bottom: valPercent + '%' }, o.animate);
              }
              if (i === 1) {
                that.range[animate ? 'animate' : 'css']({ height: valPercent - lastValPercent + '%' }, {
                  queue: false,
                  duration: o.animate
                });
              }
            }
          }
          lastValPercent = valPercent;
        });
      } else {
        value = this.value();
        valueMin = this._valueMin();
        valueMax = this._valueMax();
        valPercent = valueMax !== valueMin ? (value - valueMin) / (valueMax - valueMin) * 100 : 0;
        _set[this.orientation === 'horizontal' ? 'left' : 'bottom'] = valPercent + '%';
        this.handle.stop(1, 1)[animate ? 'animate' : 'css'](_set, o.animate);
        if (oRange === 'min' && this.orientation === 'horizontal') {
          this.range.stop(1, 1)[animate ? 'animate' : 'css']({ width: valPercent + '%' }, o.animate);
        }
        if (oRange === 'max' && this.orientation === 'horizontal') {
          this.range[animate ? 'animate' : 'css']({ width: 100 - valPercent + '%' }, {
            queue: false,
            duration: o.animate
          });
        }
        if (oRange === 'min' && this.orientation === 'vertical') {
          this.range.stop(1, 1)[animate ? 'animate' : 'css']({ height: valPercent + '%' }, o.animate);
        }
        if (oRange === 'max' && this.orientation === 'vertical') {
          this.range[animate ? 'animate' : 'css']({ height: 100 - valPercent + '%' }, {
            queue: false,
            duration: o.animate
          });
        }
      }
    }
  });
}(jQuery));
(function ($) {
  function modifier(fn) {
    return function () {
      var previous = this.element.val();
      fn.apply(this, arguments);
      this._refresh();
      if (previous !== this.element.val()) {
        this._trigger('change');
      }
    };
  }
  $.widget('ui.spinner', {
    version: '1.9.2',
    defaultElement: '<input>',
    widgetEventPrefix: 'spin',
    options: {
      culture: null,
      icons: {
        down: 'ui-icon-triangle-1-s',
        up: 'ui-icon-triangle-1-n'
      },
      incremental: true,
      max: null,
      min: null,
      numberFormat: null,
      page: 10,
      step: 1,
      change: null,
      spin: null,
      start: null,
      stop: null
    },
    _create: function () {
      this._setOption('max', this.options.max);
      this._setOption('min', this.options.min);
      this._setOption('step', this.options.step);
      this._value(this.element.val(), true);
      this._draw();
      this._on(this._events);
      this._refresh();
      this._on(this.window, {
        beforeunload: function () {
          this.element.removeAttr('autocomplete');
        }
      });
    },
    _getCreateOptions: function () {
      var options = {}, element = this.element;
      $.each([
        'min',
        'max',
        'step'
      ], function (i, option) {
        var value = element.attr(option);
        if (value !== undefined && value.length) {
          options[option] = value;
        }
      });
      return options;
    },
    _events: {
      keydown: function (event) {
        if (this._start(event) && this._keydown(event)) {
          event.preventDefault();
        }
      },
      keyup: '_stop',
      focus: function () {
        this.previous = this.element.val();
      },
      blur: function (event) {
        if (this.cancelBlur) {
          delete this.cancelBlur;
          return;
        }
        this._refresh();
        if (this.previous !== this.element.val()) {
          this._trigger('change', event);
        }
      },
      mousewheel: function (event, delta) {
        if (!delta) {
          return;
        }
        if (!this.spinning && !this._start(event)) {
          return false;
        }
        this._spin((delta > 0 ? 1 : -1) * this.options.step, event);
        clearTimeout(this.mousewheelTimer);
        this.mousewheelTimer = this._delay(function () {
          if (this.spinning) {
            this._stop(event);
          }
        }, 100);
        event.preventDefault();
      },
      'mousedown .ui-spinner-button': function (event) {
        var previous;
        previous = this.element[0] === this.document[0].activeElement ? this.previous : this.element.val();
        function checkFocus() {
          var isActive = this.element[0] === this.document[0].activeElement;
          if (!isActive) {
            this.element.focus();
            this.previous = previous;
            this._delay(function () {
              this.previous = previous;
            });
          }
        }
        event.preventDefault();
        checkFocus.call(this);
        this.cancelBlur = true;
        this._delay(function () {
          delete this.cancelBlur;
          checkFocus.call(this);
        });
        if (this._start(event) === false) {
          return;
        }
        this._repeat(null, $(event.currentTarget).hasClass('ui-spinner-up') ? 1 : -1, event);
      },
      'mouseup .ui-spinner-button': '_stop',
      'mouseenter .ui-spinner-button': function (event) {
        if (!$(event.currentTarget).hasClass('ui-state-active')) {
          return;
        }
        if (this._start(event) === false) {
          return false;
        }
        this._repeat(null, $(event.currentTarget).hasClass('ui-spinner-up') ? 1 : -1, event);
      },
      'mouseleave .ui-spinner-button': '_stop'
    },
    _draw: function () {
      var uiSpinner = this.uiSpinner = this.element.addClass('ui-spinner-input').attr('autocomplete', 'off').wrap(this._uiSpinnerHtml()).parent().append(this._buttonHtml());
      this.element.attr('role', 'spinbutton');
      this.buttons = uiSpinner.find('.ui-spinner-button').attr('tabIndex', -1).button().removeClass('ui-corner-all');
      if (this.buttons.height() > Math.ceil(uiSpinner.height() * 0.5) && uiSpinner.height() > 0) {
        uiSpinner.height(uiSpinner.height());
      }
      if (this.options.disabled) {
        this.disable();
      }
    },
    _keydown: function (event) {
      var options = this.options, keyCode = $.ui.keyCode;
      switch (event.keyCode) {
      case keyCode.UP:
        this._repeat(null, 1, event);
        return true;
      case keyCode.DOWN:
        this._repeat(null, -1, event);
        return true;
      case keyCode.PAGE_UP:
        this._repeat(null, options.page, event);
        return true;
      case keyCode.PAGE_DOWN:
        this._repeat(null, -options.page, event);
        return true;
      }
      return false;
    },
    _uiSpinnerHtml: function () {
      return '<span class=\'ui-spinner ui-widget ui-widget-content ui-corner-all\'></span>';
    },
    _buttonHtml: function () {
      return '' + '<a class=\'ui-spinner-button ui-spinner-up ui-corner-tr\'>' + '<span class=\'ui-icon ' + this.options.icons.up + '\'>&#9650;</span>' + '</a>' + '<a class=\'ui-spinner-button ui-spinner-down ui-corner-br\'>' + '<span class=\'ui-icon ' + this.options.icons.down + '\'>&#9660;</span>' + '</a>';
    },
    _start: function (event) {
      if (!this.spinning && this._trigger('start', event) === false) {
        return false;
      }
      if (!this.counter) {
        this.counter = 1;
      }
      this.spinning = true;
      return true;
    },
    _repeat: function (i, steps, event) {
      i = i || 500;
      clearTimeout(this.timer);
      this.timer = this._delay(function () {
        this._repeat(40, steps, event);
      }, i);
      this._spin(steps * this.options.step, event);
    },
    _spin: function (step, event) {
      var value = this.value() || 0;
      if (!this.counter) {
        this.counter = 1;
      }
      value = this._adjustValue(value + step * this._increment(this.counter));
      if (!this.spinning || this._trigger('spin', event, { value: value }) !== false) {
        this._value(value);
        this.counter++;
      }
    },
    _increment: function (i) {
      var incremental = this.options.incremental;
      if (incremental) {
        return $.isFunction(incremental) ? incremental(i) : Math.floor(i * i * i / 50000 - i * i / 500 + 17 * i / 200 + 1);
      }
      return 1;
    },
    _precision: function () {
      var precision = this._precisionOf(this.options.step);
      if (this.options.min !== null) {
        precision = Math.max(precision, this._precisionOf(this.options.min));
      }
      return precision;
    },
    _precisionOf: function (num) {
      var str = num.toString(), decimal = str.indexOf('.');
      return decimal === -1 ? 0 : str.length - decimal - 1;
    },
    _adjustValue: function (value) {
      var base, aboveMin, options = this.options;
      base = options.min !== null ? options.min : 0;
      aboveMin = value - base;
      aboveMin = Math.round(aboveMin / options.step) * options.step;
      value = base + aboveMin;
      value = parseFloat(value.toFixed(this._precision()));
      if (options.max !== null && value > options.max) {
        return options.max;
      }
      if (options.min !== null && value < options.min) {
        return options.min;
      }
      return value;
    },
    _stop: function (event) {
      if (!this.spinning) {
        return;
      }
      clearTimeout(this.timer);
      clearTimeout(this.mousewheelTimer);
      this.counter = 0;
      this.spinning = false;
      this._trigger('stop', event);
    },
    _setOption: function (key, value) {
      if (key === 'culture' || key === 'numberFormat') {
        var prevValue = this._parse(this.element.val());
        this.options[key] = value;
        this.element.val(this._format(prevValue));
        return;
      }
      if (key === 'max' || key === 'min' || key === 'step') {
        if (typeof value === 'string') {
          value = this._parse(value);
        }
      }
      this._super(key, value);
      if (key === 'disabled') {
        if (value) {
          this.element.prop('disabled', true);
          this.buttons.button('disable');
        } else {
          this.element.prop('disabled', false);
          this.buttons.button('enable');
        }
      }
    },
    _setOptions: modifier(function (options) {
      this._super(options);
      this._value(this.element.val());
    }),
    _parse: function (val) {
      if (typeof val === 'string' && val !== '') {
        val = window.Globalize && this.options.numberFormat ? Globalize.parseFloat(val, 10, this.options.culture) : +val;
      }
      return val === '' || isNaN(val) ? null : val;
    },
    _format: function (value) {
      if (value === '') {
        return '';
      }
      return window.Globalize && this.options.numberFormat ? Globalize.format(value, this.options.numberFormat, this.options.culture) : value;
    },
    _refresh: function () {
      this.element.attr({
        'aria-valuemin': this.options.min,
        'aria-valuemax': this.options.max,
        'aria-valuenow': this._parse(this.element.val())
      });
    },
    _value: function (value, allowAny) {
      var parsed;
      if (value !== '') {
        parsed = this._parse(value);
        if (parsed !== null) {
          if (!allowAny) {
            parsed = this._adjustValue(parsed);
          }
          value = this._format(parsed);
        }
      }
      this.element.val(value);
      this._refresh();
    },
    _destroy: function () {
      this.element.removeClass('ui-spinner-input').prop('disabled', false).removeAttr('autocomplete').removeAttr('role').removeAttr('aria-valuemin').removeAttr('aria-valuemax').removeAttr('aria-valuenow');
      this.uiSpinner.replaceWith(this.element);
    },
    stepUp: modifier(function (steps) {
      this._stepUp(steps);
    }),
    _stepUp: function (steps) {
      this._spin((steps || 1) * this.options.step);
    },
    stepDown: modifier(function (steps) {
      this._stepDown(steps);
    }),
    _stepDown: function (steps) {
      this._spin((steps || 1) * -this.options.step);
    },
    pageUp: modifier(function (pages) {
      this._stepUp((pages || 1) * this.options.page);
    }),
    pageDown: modifier(function (pages) {
      this._stepDown((pages || 1) * this.options.page);
    }),
    value: function (newVal) {
      if (!arguments.length) {
        return this._parse(this.element.val());
      }
      modifier(this._value).call(this, newVal);
    },
    widget: function () {
      return this.uiSpinner;
    }
  });
}(jQuery));
(function ($, undefined) {
  var tabId = 0, rhash = /#.*$/;
  function getNextTabId() {
    return ++tabId;
  }
  function isLocal(anchor) {
    return anchor.hash.length > 1 && anchor.href.replace(rhash, '') === location.href.replace(rhash, '').replace(/\s/g, '%20');
  }
  $.widget('ui.tabs', {
    version: '1.9.2',
    delay: 300,
    options: {
      active: null,
      collapsible: false,
      event: 'click',
      heightStyle: 'content',
      hide: null,
      show: null,
      activate: null,
      beforeActivate: null,
      beforeLoad: null,
      load: null
    },
    _create: function () {
      var that = this, options = this.options, active = options.active, locationHash = location.hash.substring(1);
      this.running = false;
      this.element.addClass('ui-tabs ui-widget ui-widget-content ui-corner-all').toggleClass('ui-tabs-collapsible', options.collapsible).delegate('.ui-tabs-nav > li', 'mousedown' + this.eventNamespace, function (event) {
        if ($(this).is('.ui-state-disabled')) {
          event.preventDefault();
        }
      }).delegate('.ui-tabs-anchor', 'focus' + this.eventNamespace, function () {
        if ($(this).closest('li').is('.ui-state-disabled')) {
          this.blur();
        }
      });
      this._processTabs();
      if (active === null) {
        if (locationHash) {
          this.tabs.each(function (i, tab) {
            if ($(tab).attr('aria-controls') === locationHash) {
              active = i;
              return false;
            }
          });
        }
        if (active === null) {
          active = this.tabs.index(this.tabs.filter('.ui-tabs-active'));
        }
        if (active === null || active === -1) {
          active = this.tabs.length ? 0 : false;
        }
      }
      if (active !== false) {
        active = this.tabs.index(this.tabs.eq(active));
        if (active === -1) {
          active = options.collapsible ? false : 0;
        }
      }
      options.active = active;
      if (!options.collapsible && options.active === false && this.anchors.length) {
        options.active = 0;
      }
      if ($.isArray(options.disabled)) {
        options.disabled = $.unique(options.disabled.concat($.map(this.tabs.filter('.ui-state-disabled'), function (li) {
          return that.tabs.index(li);
        }))).sort();
      }
      if (this.options.active !== false && this.anchors.length) {
        this.active = this._findActive(this.options.active);
      } else {
        this.active = $();
      }
      this._refresh();
      if (this.active.length) {
        this.load(options.active);
      }
    },
    _getCreateEventData: function () {
      return {
        tab: this.active,
        panel: !this.active.length ? $() : this._getPanelForTab(this.active)
      };
    },
    _tabKeydown: function (event) {
      var focusedTab = $(this.document[0].activeElement).closest('li'), selectedIndex = this.tabs.index(focusedTab), goingForward = true;
      if (this._handlePageNav(event)) {
        return;
      }
      switch (event.keyCode) {
      case $.ui.keyCode.RIGHT:
      case $.ui.keyCode.DOWN:
        selectedIndex++;
        break;
      case $.ui.keyCode.UP:
      case $.ui.keyCode.LEFT:
        goingForward = false;
        selectedIndex--;
        break;
      case $.ui.keyCode.END:
        selectedIndex = this.anchors.length - 1;
        break;
      case $.ui.keyCode.HOME:
        selectedIndex = 0;
        break;
      case $.ui.keyCode.SPACE:
        event.preventDefault();
        clearTimeout(this.activating);
        this._activate(selectedIndex);
        return;
      case $.ui.keyCode.ENTER:
        event.preventDefault();
        clearTimeout(this.activating);
        this._activate(selectedIndex === this.options.active ? false : selectedIndex);
        return;
      default:
        return;
      }
      event.preventDefault();
      clearTimeout(this.activating);
      selectedIndex = this._focusNextTab(selectedIndex, goingForward);
      if (!event.ctrlKey) {
        focusedTab.attr('aria-selected', 'false');
        this.tabs.eq(selectedIndex).attr('aria-selected', 'true');
        this.activating = this._delay(function () {
          this.option('active', selectedIndex);
        }, this.delay);
      }
    },
    _panelKeydown: function (event) {
      if (this._handlePageNav(event)) {
        return;
      }
      if (event.ctrlKey && event.keyCode === $.ui.keyCode.UP) {
        event.preventDefault();
        this.active.focus();
      }
    },
    _handlePageNav: function (event) {
      if (event.altKey && event.keyCode === $.ui.keyCode.PAGE_UP) {
        this._activate(this._focusNextTab(this.options.active - 1, false));
        return true;
      }
      if (event.altKey && event.keyCode === $.ui.keyCode.PAGE_DOWN) {
        this._activate(this._focusNextTab(this.options.active + 1, true));
        return true;
      }
    },
    _findNextTab: function (index, goingForward) {
      var lastTabIndex = this.tabs.length - 1;
      function constrain() {
        if (index > lastTabIndex) {
          index = 0;
        }
        if (index < 0) {
          index = lastTabIndex;
        }
        return index;
      }
      while ($.inArray(constrain(), this.options.disabled) !== -1) {
        index = goingForward ? index + 1 : index - 1;
      }
      return index;
    },
    _focusNextTab: function (index, goingForward) {
      index = this._findNextTab(index, goingForward);
      this.tabs.eq(index).focus();
      return index;
    },
    _setOption: function (key, value) {
      if (key === 'active') {
        this._activate(value);
        return;
      }
      if (key === 'disabled') {
        this._setupDisabled(value);
        return;
      }
      this._super(key, value);
      if (key === 'collapsible') {
        this.element.toggleClass('ui-tabs-collapsible', value);
        if (!value && this.options.active === false) {
          this._activate(0);
        }
      }
      if (key === 'event') {
        this._setupEvents(value);
      }
      if (key === 'heightStyle') {
        this._setupHeightStyle(value);
      }
    },
    _tabId: function (tab) {
      return tab.attr('aria-controls') || 'ui-tabs-' + getNextTabId();
    },
    _sanitizeSelector: function (hash) {
      return hash ? hash.replace(/[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g, '\\$&') : '';
    },
    refresh: function () {
      var options = this.options, lis = this.tablist.children(':has(a[href])');
      options.disabled = $.map(lis.filter('.ui-state-disabled'), function (tab) {
        return lis.index(tab);
      });
      this._processTabs();
      if (options.active === false || !this.anchors.length) {
        options.active = false;
        this.active = $();
      } else if (this.active.length && !$.contains(this.tablist[0], this.active[0])) {
        if (this.tabs.length === options.disabled.length) {
          options.active = false;
          this.active = $();
        } else {
          this._activate(this._findNextTab(Math.max(0, options.active - 1), false));
        }
      } else {
        options.active = this.tabs.index(this.active);
      }
      this._refresh();
    },
    _refresh: function () {
      this._setupDisabled(this.options.disabled);
      this._setupEvents(this.options.event);
      this._setupHeightStyle(this.options.heightStyle);
      this.tabs.not(this.active).attr({
        'aria-selected': 'false',
        tabIndex: -1
      });
      this.panels.not(this._getPanelForTab(this.active)).hide().attr({
        'aria-expanded': 'false',
        'aria-hidden': 'true'
      });
      if (!this.active.length) {
        this.tabs.eq(0).attr('tabIndex', 0);
      } else {
        this.active.addClass('ui-tabs-active ui-state-active').attr({
          'aria-selected': 'true',
          tabIndex: 0
        });
        this._getPanelForTab(this.active).show().attr({
          'aria-expanded': 'true',
          'aria-hidden': 'false'
        });
      }
    },
    _processTabs: function () {
      var that = this;
      this.tablist = this._getList().addClass('ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all').attr('role', 'tablist');
      this.tabs = this.tablist.find('> li:has(a[href])').addClass('ui-state-default ui-corner-top').attr({
        role: 'tab',
        tabIndex: -1
      });
      this.anchors = this.tabs.map(function () {
        return $('a', this)[0];
      }).addClass('ui-tabs-anchor').attr({
        role: 'presentation',
        tabIndex: -1
      });
      this.panels = $();
      this.anchors.each(function (i, anchor) {
        var selector, panel, panelId, anchorId = $(anchor).uniqueId().attr('id'), tab = $(anchor).closest('li'), originalAriaControls = tab.attr('aria-controls');
        if (isLocal(anchor)) {
          selector = anchor.hash;
          panel = that.element.find(that._sanitizeSelector(selector));
        } else {
          panelId = that._tabId(tab);
          selector = '#' + panelId;
          panel = that.element.find(selector);
          if (!panel.length) {
            panel = that._createPanel(panelId);
            panel.insertAfter(that.panels[i - 1] || that.tablist);
          }
          panel.attr('aria-live', 'polite');
        }
        if (panel.length) {
          that.panels = that.panels.add(panel);
        }
        if (originalAriaControls) {
          tab.data('ui-tabs-aria-controls', originalAriaControls);
        }
        tab.attr({
          'aria-controls': selector.substring(1),
          'aria-labelledby': anchorId
        });
        panel.attr('aria-labelledby', anchorId);
      });
      this.panels.addClass('ui-tabs-panel ui-widget-content ui-corner-bottom').attr('role', 'tabpanel');
    },
    _getList: function () {
      return this.element.find('ol,ul').eq(0);
    },
    _createPanel: function (id) {
      return $('<div>').attr('id', id).addClass('ui-tabs-panel ui-widget-content ui-corner-bottom').data('ui-tabs-destroy', true);
    },
    _setupDisabled: function (disabled) {
      if ($.isArray(disabled)) {
        if (!disabled.length) {
          disabled = false;
        } else if (disabled.length === this.anchors.length) {
          disabled = true;
        }
      }
      for (var i = 0, li; li = this.tabs[i]; i++) {
        if (disabled === true || $.inArray(i, disabled) !== -1) {
          $(li).addClass('ui-state-disabled').attr('aria-disabled', 'true');
        } else {
          $(li).removeClass('ui-state-disabled').removeAttr('aria-disabled');
        }
      }
      this.options.disabled = disabled;
    },
    _setupEvents: function (event) {
      var events = {
          click: function (event) {
            event.preventDefault();
          }
        };
      if (event) {
        $.each(event.split(' '), function (index, eventName) {
          events[eventName] = '_eventHandler';
        });
      }
      this._off(this.anchors.add(this.tabs).add(this.panels));
      this._on(this.anchors, events);
      this._on(this.tabs, { keydown: '_tabKeydown' });
      this._on(this.panels, { keydown: '_panelKeydown' });
      this._focusable(this.tabs);
      this._hoverable(this.tabs);
    },
    _setupHeightStyle: function (heightStyle) {
      var maxHeight, overflow, parent = this.element.parent();
      if (heightStyle === 'fill') {
        if (!$.support.minHeight) {
          overflow = parent.css('overflow');
          parent.css('overflow', 'hidden');
        }
        maxHeight = parent.height();
        this.element.siblings(':visible').each(function () {
          var elem = $(this), position = elem.css('position');
          if (position === 'absolute' || position === 'fixed') {
            return;
          }
          maxHeight -= elem.outerHeight(true);
        });
        if (overflow) {
          parent.css('overflow', overflow);
        }
        this.element.children().not(this.panels).each(function () {
          maxHeight -= $(this).outerHeight(true);
        });
        this.panels.each(function () {
          $(this).height(Math.max(0, maxHeight - $(this).innerHeight() + $(this).height()));
        }).css('overflow', 'auto');
      } else if (heightStyle === 'auto') {
        maxHeight = 0;
        this.panels.each(function () {
          maxHeight = Math.max(maxHeight, $(this).height('').height());
        }).height(maxHeight);
      }
    },
    _eventHandler: function (event) {
      var options = this.options, active = this.active, anchor = $(event.currentTarget), tab = anchor.closest('li'), clickedIsActive = tab[0] === active[0], collapsing = clickedIsActive && options.collapsible, toShow = collapsing ? $() : this._getPanelForTab(tab), toHide = !active.length ? $() : this._getPanelForTab(active), eventData = {
          oldTab: active,
          oldPanel: toHide,
          newTab: collapsing ? $() : tab,
          newPanel: toShow
        };
      event.preventDefault();
      if (tab.hasClass('ui-state-disabled') || tab.hasClass('ui-tabs-loading') || this.running || clickedIsActive && !options.collapsible || this._trigger('beforeActivate', event, eventData) === false) {
        return;
      }
      options.active = collapsing ? false : this.tabs.index(tab);
      this.active = clickedIsActive ? $() : tab;
      if (this.xhr) {
        this.xhr.abort();
      }
      if (!toHide.length && !toShow.length) {
        $.error('jQuery UI Tabs: Mismatching fragment identifier.');
      }
      if (toShow.length) {
        this.load(this.tabs.index(tab), event);
      }
      this._toggle(event, eventData);
    },
    _toggle: function (event, eventData) {
      var that = this, toShow = eventData.newPanel, toHide = eventData.oldPanel;
      this.running = true;
      function complete() {
        that.running = false;
        that._trigger('activate', event, eventData);
      }
      function show() {
        eventData.newTab.closest('li').addClass('ui-tabs-active ui-state-active');
        if (toShow.length && that.options.show) {
          that._show(toShow, that.options.show, complete);
        } else {
          toShow.show();
          complete();
        }
      }
      if (toHide.length && this.options.hide) {
        this._hide(toHide, this.options.hide, function () {
          eventData.oldTab.closest('li').removeClass('ui-tabs-active ui-state-active');
          show();
        });
      } else {
        eventData.oldTab.closest('li').removeClass('ui-tabs-active ui-state-active');
        toHide.hide();
        show();
      }
      toHide.attr({
        'aria-expanded': 'false',
        'aria-hidden': 'true'
      });
      eventData.oldTab.attr('aria-selected', 'false');
      if (toShow.length && toHide.length) {
        eventData.oldTab.attr('tabIndex', -1);
      } else if (toShow.length) {
        this.tabs.filter(function () {
          return $(this).attr('tabIndex') === 0;
        }).attr('tabIndex', -1);
      }
      toShow.attr({
        'aria-expanded': 'true',
        'aria-hidden': 'false'
      });
      eventData.newTab.attr({
        'aria-selected': 'true',
        tabIndex: 0
      });
    },
    _activate: function (index) {
      var anchor, active = this._findActive(index);
      if (active[0] === this.active[0]) {
        return;
      }
      if (!active.length) {
        active = this.active;
      }
      anchor = active.find('.ui-tabs-anchor')[0];
      this._eventHandler({
        target: anchor,
        currentTarget: anchor,
        preventDefault: $.noop
      });
    },
    _findActive: function (index) {
      return index === false ? $() : this.tabs.eq(index);
    },
    _getIndex: function (index) {
      if (typeof index === 'string') {
        index = this.anchors.index(this.anchors.filter('[href$=\'' + index + '\']'));
      }
      return index;
    },
    _destroy: function () {
      if (this.xhr) {
        this.xhr.abort();
      }
      this.element.removeClass('ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible');
      this.tablist.removeClass('ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all').removeAttr('role');
      this.anchors.removeClass('ui-tabs-anchor').removeAttr('role').removeAttr('tabIndex').removeData('href.tabs').removeData('load.tabs').removeUniqueId();
      this.tabs.add(this.panels).each(function () {
        if ($.data(this, 'ui-tabs-destroy')) {
          $(this).remove();
        } else {
          $(this).removeClass('ui-state-default ui-state-active ui-state-disabled ' + 'ui-corner-top ui-corner-bottom ui-widget-content ui-tabs-active ui-tabs-panel').removeAttr('tabIndex').removeAttr('aria-live').removeAttr('aria-busy').removeAttr('aria-selected').removeAttr('aria-labelledby').removeAttr('aria-hidden').removeAttr('aria-expanded').removeAttr('role');
        }
      });
      this.tabs.each(function () {
        var li = $(this), prev = li.data('ui-tabs-aria-controls');
        if (prev) {
          li.attr('aria-controls', prev);
        } else {
          li.removeAttr('aria-controls');
        }
      });
      this.panels.show();
      if (this.options.heightStyle !== 'content') {
        this.panels.css('height', '');
      }
    },
    enable: function (index) {
      var disabled = this.options.disabled;
      if (disabled === false) {
        return;
      }
      if (index === undefined) {
        disabled = false;
      } else {
        index = this._getIndex(index);
        if ($.isArray(disabled)) {
          disabled = $.map(disabled, function (num) {
            return num !== index ? num : null;
          });
        } else {
          disabled = $.map(this.tabs, function (li, num) {
            return num !== index ? num : null;
          });
        }
      }
      this._setupDisabled(disabled);
    },
    disable: function (index) {
      var disabled = this.options.disabled;
      if (disabled === true) {
        return;
      }
      if (index === undefined) {
        disabled = true;
      } else {
        index = this._getIndex(index);
        if ($.inArray(index, disabled) !== -1) {
          return;
        }
        if ($.isArray(disabled)) {
          disabled = $.merge([index], disabled).sort();
        } else {
          disabled = [index];
        }
      }
      this._setupDisabled(disabled);
    },
    load: function (index, event) {
      index = this._getIndex(index);
      var that = this, tab = this.tabs.eq(index), anchor = tab.find('.ui-tabs-anchor'), panel = this._getPanelForTab(tab), eventData = {
          tab: tab,
          panel: panel
        };
      if (isLocal(anchor[0])) {
        return;
      }
      this.xhr = $.ajax(this._ajaxSettings(anchor, event, eventData));
      if (this.xhr && this.xhr.statusText !== 'canceled') {
        tab.addClass('ui-tabs-loading');
        panel.attr('aria-busy', 'true');
        this.xhr.success(function (response) {
          setTimeout(function () {
            panel.html(response);
            that._trigger('load', event, eventData);
          }, 1);
        }).complete(function (jqXHR, status) {
          setTimeout(function () {
            if (status === 'abort') {
              that.panels.stop(false, true);
            }
            tab.removeClass('ui-tabs-loading');
            panel.removeAttr('aria-busy');
            if (jqXHR === that.xhr) {
              delete that.xhr;
            }
          }, 1);
        });
      }
    },
    _ajaxSettings: function (anchor, event, eventData) {
      var that = this;
      return {
        url: anchor.attr('href'),
        beforeSend: function (jqXHR, settings) {
          return that._trigger('beforeLoad', event, $.extend({
            jqXHR: jqXHR,
            ajaxSettings: settings
          }, eventData));
        }
      };
    },
    _getPanelForTab: function (tab) {
      var id = $(tab).attr('aria-controls');
      return this.element.find(this._sanitizeSelector('#' + id));
    }
  });
  if ($.uiBackCompat !== false) {
    $.ui.tabs.prototype._ui = function (tab, panel) {
      return {
        tab: tab,
        panel: panel,
        index: this.anchors.index(tab)
      };
    };
    $.widget('ui.tabs', $.ui.tabs, {
      url: function (index, url) {
        this.anchors.eq(index).attr('href', url);
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: {
        ajaxOptions: null,
        cache: false
      },
      _create: function () {
        this._super();
        var that = this;
        this._on({
          tabsbeforeload: function (event, ui) {
            if ($.data(ui.tab[0], 'cache.tabs')) {
              event.preventDefault();
              return;
            }
            ui.jqXHR.success(function () {
              if (that.options.cache) {
                $.data(ui.tab[0], 'cache.tabs', true);
              }
            });
          }
        });
      },
      _ajaxSettings: function (anchor, event, ui) {
        var ajaxOptions = this.options.ajaxOptions;
        return $.extend({}, ajaxOptions, {
          error: function (xhr, status) {
            try {
              ajaxOptions.error(xhr, status, ui.tab.closest('li').index(), ui.tab[0]);
            } catch (error) {
            }
          }
        }, this._superApply(arguments));
      },
      _setOption: function (key, value) {
        if (key === 'cache' && value === false) {
          this.anchors.removeData('cache.tabs');
        }
        this._super(key, value);
      },
      _destroy: function () {
        this.anchors.removeData('cache.tabs');
        this._super();
      },
      url: function (index) {
        this.anchors.eq(index).removeData('cache.tabs');
        this._superApply(arguments);
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      abort: function () {
        if (this.xhr) {
          this.xhr.abort();
        }
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: { spinner: '<em>Loading&#8230;</em>' },
      _create: function () {
        this._super();
        this._on({
          tabsbeforeload: function (event, ui) {
            if (event.target !== this.element[0] || !this.options.spinner) {
              return;
            }
            var span = ui.tab.find('span'), html = span.html();
            span.html(this.options.spinner);
            ui.jqXHR.complete(function () {
              span.html(html);
            });
          }
        });
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: {
        enable: null,
        disable: null
      },
      enable: function (index) {
        var options = this.options, trigger;
        if (index && options.disabled === true || $.isArray(options.disabled) && $.inArray(index, options.disabled) !== -1) {
          trigger = true;
        }
        this._superApply(arguments);
        if (trigger) {
          this._trigger('enable', null, this._ui(this.anchors[index], this.panels[index]));
        }
      },
      disable: function (index) {
        var options = this.options, trigger;
        if (index && options.disabled === false || $.isArray(options.disabled) && $.inArray(index, options.disabled) === -1) {
          trigger = true;
        }
        this._superApply(arguments);
        if (trigger) {
          this._trigger('disable', null, this._ui(this.anchors[index], this.panels[index]));
        }
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: {
        add: null,
        remove: null,
        tabTemplate: '<li><a href=\'#{href}\'><span>#{label}</span></a></li>'
      },
      add: function (url, label, index) {
        if (index === undefined) {
          index = this.anchors.length;
        }
        var doInsertAfter, panel, options = this.options, li = $(options.tabTemplate.replace(/#\{href\}/g, url).replace(/#\{label\}/g, label)), id = !url.indexOf('#') ? url.replace('#', '') : this._tabId(li);
        li.addClass('ui-state-default ui-corner-top').data('ui-tabs-destroy', true);
        li.attr('aria-controls', id);
        doInsertAfter = index >= this.tabs.length;
        panel = this.element.find('#' + id);
        if (!panel.length) {
          panel = this._createPanel(id);
          if (doInsertAfter) {
            if (index > 0) {
              panel.insertAfter(this.panels.eq(-1));
            } else {
              panel.appendTo(this.element);
            }
          } else {
            panel.insertBefore(this.panels[index]);
          }
        }
        panel.addClass('ui-tabs-panel ui-widget-content ui-corner-bottom').hide();
        if (doInsertAfter) {
          li.appendTo(this.tablist);
        } else {
          li.insertBefore(this.tabs[index]);
        }
        options.disabled = $.map(options.disabled, function (n) {
          return n >= index ? ++n : n;
        });
        this.refresh();
        if (this.tabs.length === 1 && options.active === false) {
          this.option('active', 0);
        }
        this._trigger('add', null, this._ui(this.anchors[index], this.panels[index]));
        return this;
      },
      remove: function (index) {
        index = this._getIndex(index);
        var options = this.options, tab = this.tabs.eq(index).remove(), panel = this._getPanelForTab(tab).remove();
        if (tab.hasClass('ui-tabs-active') && this.anchors.length > 2) {
          this._activate(index + (index + 1 < this.anchors.length ? 1 : -1));
        }
        options.disabled = $.map($.grep(options.disabled, function (n) {
          return n !== index;
        }), function (n) {
          return n >= index ? --n : n;
        });
        this.refresh();
        this._trigger('remove', null, this._ui(tab.find('a')[0], panel[0]));
        return this;
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      length: function () {
        return this.anchors.length;
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: { idPrefix: 'ui-tabs-' },
      _tabId: function (tab) {
        var a = tab.is('li') ? tab.find('a[href]') : tab;
        a = a[0];
        return $(a).closest('li').attr('aria-controls') || a.title && a.title.replace(/\s/g, '_').replace(/[^\w\u00c0-\uFFFF\-]/g, '') || this.options.idPrefix + getNextTabId();
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: { panelTemplate: '<div></div>' },
      _createPanel: function (id) {
        return $(this.options.panelTemplate).attr('id', id).addClass('ui-tabs-panel ui-widget-content ui-corner-bottom').data('ui-tabs-destroy', true);
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      _create: function () {
        var options = this.options;
        if (options.active === null && options.selected !== undefined) {
          options.active = options.selected === -1 ? false : options.selected;
        }
        this._super();
        options.selected = options.active;
        if (options.selected === false) {
          options.selected = -1;
        }
      },
      _setOption: function (key, value) {
        if (key !== 'selected') {
          return this._super(key, value);
        }
        var options = this.options;
        this._super('active', value === -1 ? false : value);
        options.selected = options.active;
        if (options.selected === false) {
          options.selected = -1;
        }
      },
      _eventHandler: function () {
        this._superApply(arguments);
        this.options.selected = this.options.active;
        if (this.options.selected === false) {
          this.options.selected = -1;
        }
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: {
        show: null,
        select: null
      },
      _create: function () {
        this._super();
        if (this.options.active !== false) {
          this._trigger('show', null, this._ui(this.active.find('.ui-tabs-anchor')[0], this._getPanelForTab(this.active)[0]));
        }
      },
      _trigger: function (type, event, data) {
        var tab, panel, ret = this._superApply(arguments);
        if (!ret) {
          return false;
        }
        if (type === 'beforeActivate') {
          tab = data.newTab.length ? data.newTab : data.oldTab;
          panel = data.newPanel.length ? data.newPanel : data.oldPanel;
          ret = this._super('select', event, {
            tab: tab.find('.ui-tabs-anchor')[0],
            panel: panel[0],
            index: tab.closest('li').index()
          });
        } else if (type === 'activate' && data.newTab.length) {
          ret = this._super('show', event, {
            tab: data.newTab.find('.ui-tabs-anchor')[0],
            panel: data.newPanel[0],
            index: data.newTab.closest('li').index()
          });
        }
        return ret;
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      select: function (index) {
        index = this._getIndex(index);
        if (index === -1) {
          if (this.options.collapsible && this.options.selected !== -1) {
            index = this.options.selected;
          } else {
            return;
          }
        }
        this.anchors.eq(index).trigger(this.options.event + this.eventNamespace);
      }
    });
    (function () {
      var listId = 0;
      $.widget('ui.tabs', $.ui.tabs, {
        options: { cookie: null },
        _create: function () {
          var options = this.options, active;
          if (options.active == null && options.cookie) {
            active = parseInt(this._cookie(), 10);
            if (active === -1) {
              active = false;
            }
            options.active = active;
          }
          this._super();
        },
        _cookie: function (active) {
          var cookie = [this.cookie || (this.cookie = this.options.cookie.name || 'ui-tabs-' + ++listId)];
          if (arguments.length) {
            cookie.push(active === false ? -1 : active);
            cookie.push(this.options.cookie);
          }
          return $.cookie.apply(null, cookie);
        },
        _refresh: function () {
          this._super();
          if (this.options.cookie) {
            this._cookie(this.options.active, this.options.cookie);
          }
        },
        _eventHandler: function () {
          this._superApply(arguments);
          if (this.options.cookie) {
            this._cookie(this.options.active, this.options.cookie);
          }
        },
        _destroy: function () {
          this._super();
          if (this.options.cookie) {
            this._cookie(null, this.options.cookie);
          }
        }
      });
    }());
    $.widget('ui.tabs', $.ui.tabs, {
      _trigger: function (type, event, data) {
        var _data = $.extend({}, data);
        if (type === 'load') {
          _data.panel = _data.panel[0];
          _data.tab = _data.tab.find('.ui-tabs-anchor')[0];
        }
        return this._super(type, event, _data);
      }
    });
    $.widget('ui.tabs', $.ui.tabs, {
      options: { fx: null },
      _getFx: function () {
        var hide, show, fx = this.options.fx;
        if (fx) {
          if ($.isArray(fx)) {
            hide = fx[0];
            show = fx[1];
          } else {
            hide = show = fx;
          }
        }
        return fx ? {
          show: show,
          hide: hide
        } : null;
      },
      _toggle: function (event, eventData) {
        var that = this, toShow = eventData.newPanel, toHide = eventData.oldPanel, fx = this._getFx();
        if (!fx) {
          return this._super(event, eventData);
        }
        that.running = true;
        function complete() {
          that.running = false;
          that._trigger('activate', event, eventData);
        }
        function show() {
          eventData.newTab.closest('li').addClass('ui-tabs-active ui-state-active');
          if (toShow.length && fx.show) {
            toShow.animate(fx.show, fx.show.duration, function () {
              complete();
            });
          } else {
            toShow.show();
            complete();
          }
        }
        if (toHide.length && fx.hide) {
          toHide.animate(fx.hide, fx.hide.duration, function () {
            eventData.oldTab.closest('li').removeClass('ui-tabs-active ui-state-active');
            show();
          });
        } else {
          eventData.oldTab.closest('li').removeClass('ui-tabs-active ui-state-active');
          toHide.hide();
          show();
        }
      }
    });
  }
}(jQuery));
(function ($) {
  var increments = 0;
  function addDescribedBy(elem, id) {
    var describedby = (elem.attr('aria-describedby') || '').split(/\s+/);
    describedby.push(id);
    elem.data('ui-tooltip-id', id).attr('aria-describedby', $.trim(describedby.join(' ')));
  }
  function removeDescribedBy(elem) {
    var id = elem.data('ui-tooltip-id'), describedby = (elem.attr('aria-describedby') || '').split(/\s+/), index = $.inArray(id, describedby);
    if (index !== -1) {
      describedby.splice(index, 1);
    }
    elem.removeData('ui-tooltip-id');
    describedby = $.trim(describedby.join(' '));
    if (describedby) {
      elem.attr('aria-describedby', describedby);
    } else {
      elem.removeAttr('aria-describedby');
    }
  }
  $.widget('ui.tooltip', {
    version: '1.9.2',
    options: {
      content: function () {
        return $(this).attr('title');
      },
      hide: true,
      items: '[title]:not([disabled])',
      position: {
        my: 'left top+15',
        at: 'left bottom',
        collision: 'flipfit flip'
      },
      show: true,
      tooltipClass: null,
      track: false,
      close: null,
      open: null
    },
    _create: function () {
      this._on({
        mouseover: 'open',
        focusin: 'open'
      });
      this.tooltips = {};
      this.parents = {};
      if (this.options.disabled) {
        this._disable();
      }
    },
    _setOption: function (key, value) {
      var that = this;
      if (key === 'disabled') {
        this[value ? '_disable' : '_enable']();
        this.options[key] = value;
        return;
      }
      this._super(key, value);
      if (key === 'content') {
        $.each(this.tooltips, function (id, element) {
          that._updateContent(element);
        });
      }
    },
    _disable: function () {
      var that = this;
      $.each(this.tooltips, function (id, element) {
        var event = $.Event('blur');
        event.target = event.currentTarget = element[0];
        that.close(event, true);
      });
      this.element.find(this.options.items).andSelf().each(function () {
        var element = $(this);
        if (element.is('[title]')) {
          element.data('ui-tooltip-title', element.attr('title')).attr('title', '');
        }
      });
    },
    _enable: function () {
      this.element.find(this.options.items).andSelf().each(function () {
        var element = $(this);
        if (element.data('ui-tooltip-title')) {
          element.attr('title', element.data('ui-tooltip-title'));
        }
      });
    },
    open: function (event) {
      var that = this, target = $(event ? event.target : this.element).closest(this.options.items);
      if (!target.length || target.data('ui-tooltip-id')) {
        return;
      }
      if (target.attr('title')) {
        target.data('ui-tooltip-title', target.attr('title'));
      }
      target.data('ui-tooltip-open', true);
      if (event && event.type === 'mouseover') {
        target.parents().each(function () {
          var parent = $(this), blurEvent;
          if (parent.data('ui-tooltip-open')) {
            blurEvent = $.Event('blur');
            blurEvent.target = blurEvent.currentTarget = this;
            that.close(blurEvent, true);
          }
          if (parent.attr('title')) {
            parent.uniqueId();
            that.parents[this.id] = {
              element: this,
              title: parent.attr('title')
            };
            parent.attr('title', '');
          }
        });
      }
      this._updateContent(target, event);
    },
    _updateContent: function (target, event) {
      var content, contentOption = this.options.content, that = this, eventType = event ? event.type : null;
      if (typeof contentOption === 'string') {
        return this._open(event, target, contentOption);
      }
      content = contentOption.call(target[0], function (response) {
        if (!target.data('ui-tooltip-open')) {
          return;
        }
        that._delay(function () {
          if (event) {
            event.type = eventType;
          }
          this._open(event, target, response);
        });
      });
      if (content) {
        this._open(event, target, content);
      }
    },
    _open: function (event, target, content) {
      var tooltip, events, delayedShow, positionOption = $.extend({}, this.options.position);
      if (!content) {
        return;
      }
      tooltip = this._find(target);
      if (tooltip.length) {
        tooltip.find('.ui-tooltip-content').html(content);
        return;
      }
      if (target.is('[title]')) {
        if (event && event.type === 'mouseover') {
          target.attr('title', '');
        } else {
          target.removeAttr('title');
        }
      }
      tooltip = this._tooltip(target);
      addDescribedBy(target, tooltip.attr('id'));
      tooltip.find('.ui-tooltip-content').html(content);
      function position(event) {
        positionOption.of = event;
        if (tooltip.is(':hidden')) {
          return;
        }
        tooltip.position(positionOption);
      }
      if (this.options.track && event && /^mouse/.test(event.type)) {
        this._on(this.document, { mousemove: position });
        position(event);
      } else {
        tooltip.position($.extend({ of: target }, this.options.position));
      }
      tooltip.hide();
      this._show(tooltip, this.options.show);
      if (this.options.show && this.options.show.delay) {
        delayedShow = setInterval(function () {
          if (tooltip.is(':visible')) {
            position(positionOption.of);
            clearInterval(delayedShow);
          }
        }, $.fx.interval);
      }
      this._trigger('open', event, { tooltip: tooltip });
      events = {
        keyup: function (event) {
          if (event.keyCode === $.ui.keyCode.ESCAPE) {
            var fakeEvent = $.Event(event);
            fakeEvent.currentTarget = target[0];
            this.close(fakeEvent, true);
          }
        },
        remove: function () {
          this._removeTooltip(tooltip);
        }
      };
      if (!event || event.type === 'mouseover') {
        events.mouseleave = 'close';
      }
      if (!event || event.type === 'focusin') {
        events.focusout = 'close';
      }
      this._on(true, target, events);
    },
    close: function (event) {
      var that = this, target = $(event ? event.currentTarget : this.element), tooltip = this._find(target);
      if (this.closing) {
        return;
      }
      if (target.data('ui-tooltip-title')) {
        target.attr('title', target.data('ui-tooltip-title'));
      }
      removeDescribedBy(target);
      tooltip.stop(true);
      this._hide(tooltip, this.options.hide, function () {
        that._removeTooltip($(this));
      });
      target.removeData('ui-tooltip-open');
      this._off(target, 'mouseleave focusout keyup');
      if (target[0] !== this.element[0]) {
        this._off(target, 'remove');
      }
      this._off(this.document, 'mousemove');
      if (event && event.type === 'mouseleave') {
        $.each(this.parents, function (id, parent) {
          $(parent.element).attr('title', parent.title);
          delete that.parents[id];
        });
      }
      this.closing = true;
      this._trigger('close', event, { tooltip: tooltip });
      this.closing = false;
    },
    _tooltip: function (element) {
      var id = 'ui-tooltip-' + increments++, tooltip = $('<div>').attr({
          id: id,
          role: 'tooltip'
        }).addClass('ui-tooltip ui-widget ui-corner-all ui-widget-content ' + (this.options.tooltipClass || ''));
      $('<div>').addClass('ui-tooltip-content').appendTo(tooltip);
      tooltip.appendTo(this.document[0].body);
      if ($.fn.bgiframe) {
        tooltip.bgiframe();
      }
      this.tooltips[id] = element;
      return tooltip;
    },
    _find: function (target) {
      var id = target.data('ui-tooltip-id');
      return id ? $('#' + id) : $();
    },
    _removeTooltip: function (tooltip) {
      tooltip.remove();
      delete this.tooltips[tooltip.attr('id')];
    },
    _destroy: function () {
      var that = this;
      $.each(this.tooltips, function (id, element) {
        var event = $.Event('blur');
        event.target = event.currentTarget = element[0];
        that.close(event, true);
        $('#' + id).remove();
        if (element.data('ui-tooltip-title')) {
          element.attr('title', element.data('ui-tooltip-title'));
          element.removeData('ui-tooltip-title');
        }
      });
    }
  });
}(jQuery));(function (window, angular, undefined) {
  'use strict';
  var ngRouteModule = angular.module('ngRoute', ['ng']).provider('$route', $RouteProvider);
  function $RouteProvider() {
    function inherit(parent, extra) {
      return angular.extend(new (angular.extend(function () {
      }, { prototype: parent }))(), extra);
    }
    var routes = {};
    this.when = function (path, route) {
      routes[path] = angular.extend({ reloadOnSearch: true }, route, path && pathRegExp(path, route));
      if (path) {
        var redirectPath = path[path.length - 1] == '/' ? path.substr(0, path.length - 1) : path + '/';
        routes[redirectPath] = angular.extend({ redirectTo: path }, pathRegExp(redirectPath, route));
      }
      return this;
    };
    function pathRegExp(path, opts) {
      var insensitive = opts.caseInsensitiveMatch, ret = {
          originalPath: path,
          regexp: path
        }, keys = ret.keys = [];
      path = path.replace(/([().])/g, '\\$1').replace(/(\/)?:(\w+)([\?\*])?/g, function (_, slash, key, option) {
        var optional = option === '?' ? option : null;
        var star = option === '*' ? option : null;
        keys.push({
          name: key,
          optional: !!optional
        });
        slash = slash || '';
        return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (star && '(.+?)' || '([^/]+)') + (optional || '') + ')' + (optional || '');
      }).replace(/([\/$\*])/g, '\\$1');
      ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
      return ret;
    }
    this.otherwise = function (params) {
      this.when(null, params);
      return this;
    };
    this.$get = [
      '$rootScope',
      '$location',
      '$routeParams',
      '$q',
      '$injector',
      '$http',
      '$templateCache',
      '$sce',
      function ($rootScope, $location, $routeParams, $q, $injector, $http, $templateCache, $sce) {
        var forceReload = false, $route = {
            routes: routes,
            reload: function () {
              forceReload = true;
              $rootScope.$evalAsync(updateRoute);
            }
          };
        $rootScope.$on('$locationChangeSuccess', updateRoute);
        return $route;
        function switchRouteMatcher(on, route) {
          var keys = route.keys, params = {};
          if (!route.regexp)
            return null;
          var m = route.regexp.exec(on);
          if (!m)
            return null;
          for (var i = 1, len = m.length; i < len; ++i) {
            var key = keys[i - 1];
            var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i];
            if (key && val) {
              params[key.name] = val;
            }
          }
          return params;
        }
        function updateRoute() {
          var next = parseRoute(), last = $route.current;
          if (next && last && next.$$route === last.$$route && angular.equals(next.pathParams, last.pathParams) && !next.reloadOnSearch && !forceReload) {
            last.params = next.params;
            angular.copy(last.params, $routeParams);
            $rootScope.$broadcast('$routeUpdate', last);
          } else if (next || last) {
            forceReload = false;
            $rootScope.$broadcast('$routeChangeStart', next, last);
            $route.current = next;
            if (next) {
              if (next.redirectTo) {
                if (angular.isString(next.redirectTo)) {
                  $location.path(interpolate(next.redirectTo, next.params)).search(next.params).replace();
                } else {
                  $location.url(next.redirectTo(next.pathParams, $location.path(), $location.search())).replace();
                }
              }
            }
            $q.when(next).then(function () {
              if (next) {
                var locals = angular.extend({}, next.resolve), template, templateUrl;
                angular.forEach(locals, function (value, key) {
                  locals[key] = angular.isString(value) ? $injector.get(value) : $injector.invoke(value);
                });
                if (angular.isDefined(template = next.template)) {
                  if (angular.isFunction(template)) {
                    template = template(next.params);
                  }
                } else if (angular.isDefined(templateUrl = next.templateUrl)) {
                  if (angular.isFunction(templateUrl)) {
                    templateUrl = templateUrl(next.params);
                  }
                  templateUrl = $sce.getTrustedResourceUrl(templateUrl);
                  if (angular.isDefined(templateUrl)) {
                    next.loadedTemplateUrl = templateUrl;
                    template = $http.get(templateUrl, { cache: $templateCache }).then(function (response) {
                      return response.data;
                    });
                  }
                }
                if (angular.isDefined(template)) {
                  locals['$template'] = template;
                }
                return $q.all(locals);
              }
            }).then(function (locals) {
              if (next == $route.current) {
                if (next) {
                  next.locals = locals;
                  angular.copy(next.params, $routeParams);
                }
                $rootScope.$broadcast('$routeChangeSuccess', next, last);
              }
            }, function (error) {
              if (next == $route.current) {
                $rootScope.$broadcast('$routeChangeError', next, last, error);
              }
            });
          }
        }
        function parseRoute() {
          var params, match;
          angular.forEach(routes, function (route, path) {
            if (!match && (params = switchRouteMatcher($location.path(), route))) {
              match = inherit(route, {
                params: angular.extend({}, $location.search(), params),
                pathParams: params
              });
              match.$$route = route;
            }
          });
          return match || routes[null] && inherit(routes[null], {
            params: {},
            pathParams: {}
          });
        }
        function interpolate(string, params) {
          var result = [];
          angular.forEach((string || '').split(':'), function (segment, i) {
            if (i === 0) {
              result.push(segment);
            } else {
              var segmentMatch = segment.match(/(\w+)(.*)/);
              var key = segmentMatch[1];
              result.push(params[key]);
              result.push(segmentMatch[2] || '');
              delete params[key];
            }
          });
          return result.join('');
        }
      }
    ];
  }
  ngRouteModule.provider('$routeParams', $RouteParamsProvider);
  function $RouteParamsProvider() {
    this.$get = function () {
      return {};
    };
  }
  ngRouteModule.directive('ngView', ngViewFactory);
  ngRouteModule.directive('ngView', ngViewFillContentFactory);
  ngViewFactory.$inject = [
    '$route',
    '$anchorScroll',
    '$animate'
  ];
  function ngViewFactory($route, $anchorScroll, $animate) {
    return {
      restrict: 'ECA',
      terminal: true,
      priority: 400,
      transclude: 'element',
      link: function (scope, $element, attr, ctrl, $transclude) {
        var currentScope, currentElement, previousElement, autoScrollExp = attr.autoscroll, onloadExp = attr.onload || '';
        scope.$on('$routeChangeSuccess', update);
        update();
        function cleanupLastView() {
          if (previousElement) {
            previousElement.remove();
            previousElement = null;
          }
          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if (currentElement) {
            $animate.leave(currentElement, function () {
              previousElement = null;
            });
            previousElement = currentElement;
            currentElement = null;
          }
        }
        function update() {
          var locals = $route.current && $route.current.locals, template = locals && locals.$template;
          if (angular.isDefined(template)) {
            var newScope = scope.$new();
            var current = $route.current;
            var clone = $transclude(newScope, function (clone) {
                $animate.enter(clone, null, currentElement || $element, function onNgViewEnter() {
                  if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                    $anchorScroll();
                  }
                });
                cleanupLastView();
              });
            currentElement = clone;
            currentScope = current.scope = newScope;
            currentScope.$emit('$viewContentLoaded');
            currentScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
      }
    };
  }
  ngViewFillContentFactory.$inject = [
    '$compile',
    '$controller',
    '$route'
  ];
  function ngViewFillContentFactory($compile, $controller, $route) {
    return {
      restrict: 'ECA',
      priority: -400,
      link: function (scope, $element) {
        var current = $route.current, locals = current.locals;
        $element.html(locals.$template);
        var link = $compile($element.contents());
        if (current.controller) {
          locals.$scope = scope;
          var controller = $controller(current.controller, locals);
          if (current.controllerAs) {
            scope[current.controllerAs] = controller;
          }
          $element.data('$ngControllerController', controller);
          $element.children().data('$ngControllerController', controller);
        }
        link(scope);
      }
    };
  }
}(window, window.angular));(function (window, angular, undefined) {
  'use strict';
  angular.module('ngCookies', ['ng']).factory('$cookies', [
    '$rootScope',
    '$browser',
    function ($rootScope, $browser) {
      var cookies = {}, lastCookies = {}, lastBrowserCookies, runEval = false, copy = angular.copy, isUndefined = angular.isUndefined;
      $browser.addPollFn(function () {
        var currentCookies = $browser.cookies();
        if (lastBrowserCookies != currentCookies) {
          lastBrowserCookies = currentCookies;
          copy(currentCookies, lastCookies);
          copy(currentCookies, cookies);
          if (runEval)
            $rootScope.$apply();
        }
      })();
      runEval = true;
      $rootScope.$watch(push);
      return cookies;
      function push() {
        var name, value, browserCookies, updated;
        for (name in lastCookies) {
          if (isUndefined(cookies[name])) {
            $browser.cookies(name, undefined);
          }
        }
        for (name in cookies) {
          value = cookies[name];
          if (!angular.isString(value)) {
            if (angular.isDefined(lastCookies[name])) {
              cookies[name] = lastCookies[name];
            } else {
              delete cookies[name];
            }
          } else if (value !== lastCookies[name]) {
            $browser.cookies(name, value);
            updated = true;
          }
        }
        if (updated) {
          updated = false;
          browserCookies = $browser.cookies();
          for (name in cookies) {
            if (cookies[name] !== browserCookies[name]) {
              if (isUndefined(browserCookies[name])) {
                delete cookies[name];
              } else {
                cookies[name] = browserCookies[name];
              }
              updated = true;
            }
          }
        }
      }
    }
  ]).factory('$cookieStore', [
    '$cookies',
    function ($cookies) {
      return {
        get: function (key) {
          var value = $cookies[key];
          return value ? angular.fromJson(value) : value;
        },
        put: function (key, value) {
          $cookies[key] = angular.toJson(value);
        },
        remove: function (key) {
          delete $cookies[key];
        }
      };
    }
  ]);
}(window, window.angular));(function (window, angular, undefined) {
  'use strict';
  var $resourceMinErr = angular.$$minErr('$resource');
  var MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$][0-9a-zA-Z_$]*)+$/;
  function isValidDottedPath(path) {
    return path != null && path !== '' && path !== 'hasOwnProperty' && MEMBER_NAME_REGEX.test('.' + path);
  }
  function lookupDottedPath(obj, path) {
    if (!isValidDottedPath(path)) {
      throw $resourceMinErr('badmember', 'Dotted member path "@{0}" is invalid.', path);
    }
    var keys = path.split('.');
    for (var i = 0, ii = keys.length; i < ii && obj !== undefined; i++) {
      var key = keys[i];
      obj = obj !== null ? obj[key] : undefined;
    }
    return obj;
  }
  function shallowClearAndCopy(src, dst) {
    dst = dst || {};
    angular.forEach(dst, function (value, key) {
      delete dst[key];
    });
    for (var key in src) {
      if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
        dst[key] = src[key];
      }
    }
    return dst;
  }
  angular.module('ngResource', ['ng']).factory('$resource', [
    '$http',
    '$q',
    function ($http, $q) {
      var DEFAULT_ACTIONS = {
          'get': { method: 'GET' },
          'save': { method: 'POST' },
          'query': {
            method: 'GET',
            isArray: true
          },
          'remove': { method: 'DELETE' },
          'delete': { method: 'DELETE' }
        };
      var noop = angular.noop, forEach = angular.forEach, extend = angular.extend, copy = angular.copy, isFunction = angular.isFunction;
      function encodeUriSegment(val) {
        return encodeUriQuery(val, true).replace(/%26/gi, '&').replace(/%3D/gi, '=').replace(/%2B/gi, '+');
      }
      function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
      }
      function Route(template, defaults) {
        this.template = template;
        this.defaults = defaults || {};
        this.urlParams = {};
      }
      Route.prototype = {
        setUrlParams: function (config, params, actionUrl) {
          var self = this, url = actionUrl || self.template, val, encodedVal;
          var urlParams = self.urlParams = {};
          forEach(url.split(/\W/), function (param) {
            if (param === 'hasOwnProperty') {
              throw $resourceMinErr('badname', 'hasOwnProperty is not a valid parameter name.');
            }
            if (!new RegExp('^\\d+$').test(param) && param && new RegExp('(^|[^\\\\]):' + param + '(\\W|$)').test(url)) {
              urlParams[param] = true;
            }
          });
          url = url.replace(/\\:/g, ':');
          params = params || {};
          forEach(self.urlParams, function (_, urlParam) {
            val = params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
            if (angular.isDefined(val) && val !== null) {
              encodedVal = encodeUriSegment(val);
              url = url.replace(new RegExp(':' + urlParam + '(\\W|$)', 'g'), function (match, p1) {
                return encodedVal + p1;
              });
            } else {
              url = url.replace(new RegExp('(/?):' + urlParam + '(\\W|$)', 'g'), function (match, leadingSlashes, tail) {
                if (tail.charAt(0) == '/') {
                  return tail;
                } else {
                  return leadingSlashes + tail;
                }
              });
            }
          });
          url = url.replace(/\/+$/, '') || '/';
          url = url.replace(/\/\.(?=\w+($|\?))/, '.');
          config.url = url.replace(/\/\\\./, '/.');
          forEach(params, function (value, key) {
            if (!self.urlParams[key]) {
              config.params = config.params || {};
              config.params[key] = value;
            }
          });
        }
      };
      function resourceFactory(url, paramDefaults, actions) {
        var route = new Route(url);
        actions = extend({}, DEFAULT_ACTIONS, actions);
        function extractParams(data, actionParams) {
          var ids = {};
          actionParams = extend({}, paramDefaults, actionParams);
          forEach(actionParams, function (value, key) {
            if (isFunction(value)) {
              value = value();
            }
            ids[key] = value && value.charAt && value.charAt(0) == '@' ? lookupDottedPath(data, value.substr(1)) : value;
          });
          return ids;
        }
        function defaultResponseInterceptor(response) {
          return response.resource;
        }
        function Resource(value) {
          shallowClearAndCopy(value || {}, this);
        }
        forEach(actions, function (action, name) {
          var hasBody = /^(POST|PUT|PATCH)$/i.test(action.method);
          Resource[name] = function (a1, a2, a3, a4) {
            var params = {}, data, success, error;
            switch (arguments.length) {
            case 4:
              error = a4;
              success = a3;
            case 3:
            case 2:
              if (isFunction(a2)) {
                if (isFunction(a1)) {
                  success = a1;
                  error = a2;
                  break;
                }
                success = a2;
                error = a3;
              } else {
                params = a1;
                data = a2;
                success = a3;
                break;
              }
            case 1:
              if (isFunction(a1))
                success = a1;
              else if (hasBody)
                data = a1;
              else
                params = a1;
              break;
            case 0:
              break;
            default:
              throw $resourceMinErr('badargs', 'Expected up to 4 arguments [params, data, success, error], got {0} arguments', arguments.length);
            }
            var isInstanceCall = this instanceof Resource;
            var value = isInstanceCall ? data : action.isArray ? [] : new Resource(data);
            var httpConfig = {};
            var responseInterceptor = action.interceptor && action.interceptor.response || defaultResponseInterceptor;
            var responseErrorInterceptor = action.interceptor && action.interceptor.responseError || undefined;
            forEach(action, function (value, key) {
              if (key != 'params' && key != 'isArray' && key != 'interceptor') {
                httpConfig[key] = copy(value);
              }
            });
            if (hasBody)
              httpConfig.data = data;
            route.setUrlParams(httpConfig, extend({}, extractParams(data, action.params || {}), params), action.url);
            var promise = $http(httpConfig).then(function (response) {
                var data = response.data, promise = value.$promise;
                if (data) {
                  if (angular.isArray(data) !== !!action.isArray) {
                    throw $resourceMinErr('badcfg', 'Error in resource configuration. Expected ' + 'response to contain an {0} but got an {1}', action.isArray ? 'array' : 'object', angular.isArray(data) ? 'array' : 'object');
                  }
                  if (action.isArray) {
                    value.length = 0;
                    forEach(data, function (item) {
                      value.push(new Resource(item));
                    });
                  } else {
                    shallowClearAndCopy(data, value);
                    value.$promise = promise;
                  }
                }
                value.$resolved = true;
                response.resource = value;
                return response;
              }, function (response) {
                value.$resolved = true;
                (error || noop)(response);
                return $q.reject(response);
              });
            promise = promise.then(function (response) {
              var value = responseInterceptor(response);
              (success || noop)(value, response.headers);
              return value;
            }, responseErrorInterceptor);
            if (!isInstanceCall) {
              value.$promise = promise;
              value.$resolved = false;
              return value;
            }
            return promise;
          };
          Resource.prototype['$' + name] = function (params, success, error) {
            if (isFunction(params)) {
              error = success;
              success = params;
              params = {};
            }
            var result = Resource[name].call(this, params, this, success, error);
            return result.$promise || result;
          };
        });
        Resource.bind = function (additionalParamDefaults) {
          return resourceFactory(url, extend({}, paramDefaults, additionalParamDefaults), actions);
        };
        return Resource;
      }
      return resourceFactory;
    }
  ]);
}(window, window.angular));(function (window, angular, undefined) {
  'use strict';
  var $sanitizeMinErr = angular.$$minErr('$sanitize');
  function $SanitizeProvider() {
    this.$get = [
      '$$sanitizeUri',
      function ($$sanitizeUri) {
        return function (html) {
          var buf = [];
          htmlParser(html, htmlSanitizeWriter(buf, function (uri, isImage) {
            return !/^unsafe/.test($$sanitizeUri(uri, isImage));
          }));
          return buf.join('');
        };
      }
    ];
  }
  function sanitizeText(chars) {
    var buf = [];
    var writer = htmlSanitizeWriter(buf, angular.noop);
    writer.chars(chars);
    return buf.join('');
  }
  var START_TAG_REGEXP = /^<\s*([\w:-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/, END_TAG_REGEXP = /^<\s*\/\s*([\w:-]+)[^>]*>/, ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g, BEGIN_TAG_REGEXP = /^</, BEGING_END_TAGE_REGEXP = /^<\s*\//, COMMENT_REGEXP = /<!--(.*?)-->/g, DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i, CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g, NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;
  var voidElements = makeMap('area,br,col,hr,img,wbr');
  var optionalEndTagBlockElements = makeMap('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr'), optionalEndTagInlineElements = makeMap('rp,rt'), optionalEndTagElements = angular.extend({}, optionalEndTagInlineElements, optionalEndTagBlockElements);
  var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap('address,article,' + 'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' + 'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul'));
  var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap('a,abbr,acronym,b,' + 'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' + 'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));
  var specialElements = makeMap('script,style');
  var validElements = angular.extend({}, voidElements, blockElements, inlineElements, optionalEndTagElements);
  var uriAttrs = makeMap('background,cite,href,longdesc,src,usemap');
  var validAttrs = angular.extend({}, uriAttrs, makeMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' + 'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' + 'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' + 'scope,scrolling,shape,size,span,start,summary,target,title,type,' + 'valign,value,vspace,width'));
  function makeMap(str) {
    var obj = {}, items = str.split(','), i;
    for (i = 0; i < items.length; i++)
      obj[items[i]] = true;
    return obj;
  }
  function htmlParser(html, handler) {
    var index, chars, match, stack = [], last = html;
    stack.last = function () {
      return stack[stack.length - 1];
    };
    while (html) {
      chars = true;
      if (!stack.last() || !specialElements[stack.last()]) {
        if (html.indexOf('<!--') === 0) {
          index = html.indexOf('--', 4);
          if (index >= 0 && html.lastIndexOf('-->', index) === index) {
            if (handler.comment)
              handler.comment(html.substring(4, index));
            html = html.substring(index + 3);
            chars = false;
          }
        } else if (DOCTYPE_REGEXP.test(html)) {
          match = html.match(DOCTYPE_REGEXP);
          if (match) {
            html = html.replace(match[0], '');
            chars = false;
          }
        } else if (BEGING_END_TAGE_REGEXP.test(html)) {
          match = html.match(END_TAG_REGEXP);
          if (match) {
            html = html.substring(match[0].length);
            match[0].replace(END_TAG_REGEXP, parseEndTag);
            chars = false;
          }
        } else if (BEGIN_TAG_REGEXP.test(html)) {
          match = html.match(START_TAG_REGEXP);
          if (match) {
            html = html.substring(match[0].length);
            match[0].replace(START_TAG_REGEXP, parseStartTag);
            chars = false;
          }
        }
        if (chars) {
          index = html.indexOf('<');
          var text = index < 0 ? html : html.substring(0, index);
          html = index < 0 ? '' : html.substring(index);
          if (handler.chars)
            handler.chars(decodeEntities(text));
        }
      } else {
        html = html.replace(new RegExp('(.*)<\\s*\\/\\s*' + stack.last() + '[^>]*>', 'i'), function (all, text) {
          text = text.replace(COMMENT_REGEXP, '$1').replace(CDATA_REGEXP, '$1');
          if (handler.chars)
            handler.chars(decodeEntities(text));
          return '';
        });
        parseEndTag('', stack.last());
      }
      if (html == last) {
        throw $sanitizeMinErr('badparse', 'The sanitizer was unable to parse the following block ' + 'of html: {0}', html);
      }
      last = html;
    }
    parseEndTag();
    function parseStartTag(tag, tagName, rest, unary) {
      tagName = angular.lowercase(tagName);
      if (blockElements[tagName]) {
        while (stack.last() && inlineElements[stack.last()]) {
          parseEndTag('', stack.last());
        }
      }
      if (optionalEndTagElements[tagName] && stack.last() == tagName) {
        parseEndTag('', tagName);
      }
      unary = voidElements[tagName] || !!unary;
      if (!unary)
        stack.push(tagName);
      var attrs = {};
      rest.replace(ATTR_REGEXP, function (match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
        var value = doubleQuotedValue || singleQuotedValue || unquotedValue || '';
        attrs[name] = decodeEntities(value);
      });
      if (handler.start)
        handler.start(tagName, attrs, unary);
    }
    function parseEndTag(tag, tagName) {
      var pos = 0, i;
      tagName = angular.lowercase(tagName);
      if (tagName)
        for (pos = stack.length - 1; pos >= 0; pos--)
          if (stack[pos] == tagName)
            break;
      if (pos >= 0) {
        for (i = stack.length - 1; i >= pos; i--)
          if (handler.end)
            handler.end(stack[i]);
        stack.length = pos;
      }
    }
  }
  var hiddenPre = document.createElement('pre');
  var spaceRe = /^(\s*)([\s\S]*?)(\s*)$/;
  function decodeEntities(value) {
    if (!value) {
      return '';
    }
    var parts = spaceRe.exec(value);
    var spaceBefore = parts[1];
    var spaceAfter = parts[3];
    var content = parts[2];
    if (content) {
      hiddenPre.innerHTML = content.replace(/</g, '&lt;');
      content = 'textContent' in hiddenPre ? hiddenPre.textContent : hiddenPre.innerText;
    }
    return spaceBefore + content + spaceAfter;
  }
  function encodeEntities(value) {
    return value.replace(/&/g, '&amp;').replace(NON_ALPHANUMERIC_REGEXP, function (value) {
      return '&#' + value.charCodeAt(0) + ';';
    }).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function htmlSanitizeWriter(buf, uriValidator) {
    var ignore = false;
    var out = angular.bind(buf, buf.push);
    return {
      start: function (tag, attrs, unary) {
        tag = angular.lowercase(tag);
        if (!ignore && specialElements[tag]) {
          ignore = tag;
        }
        if (!ignore && validElements[tag] === true) {
          out('<');
          out(tag);
          angular.forEach(attrs, function (value, key) {
            var lkey = angular.lowercase(key);
            var isImage = tag === 'img' && lkey === 'src' || lkey === 'background';
            if (validAttrs[lkey] === true && (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
              out(' ');
              out(key);
              out('="');
              out(encodeEntities(value));
              out('"');
            }
          });
          out(unary ? '/>' : '>');
        }
      },
      end: function (tag) {
        tag = angular.lowercase(tag);
        if (!ignore && validElements[tag] === true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
      chars: function (chars) {
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
    };
  }
  angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);
  angular.module('ngSanitize').filter('linky', [
    '$sanitize',
    function ($sanitize) {
      var LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/, MAILTO_REGEXP = /^mailto:/;
      return function (text, target) {
        if (!text)
          return text;
        var match;
        var raw = text;
        var html = [];
        var url;
        var i;
        while (match = raw.match(LINKY_URL_REGEXP)) {
          url = match[0];
          if (match[2] == match[3])
            url = 'mailto:' + url;
          i = match.index;
          addText(raw.substr(0, i));
          addLink(url, match[0].replace(MAILTO_REGEXP, ''));
          raw = raw.substring(i + match[0].length);
        }
        addText(raw);
        return $sanitize(html.join(''));
        function addText(text) {
          if (!text) {
            return;
          }
          html.push(sanitizeText(text));
        }
        function addLink(url, text) {
          html.push('<a ');
          if (angular.isDefined(target)) {
            html.push('target="');
            html.push(target);
            html.push('" ');
          }
          html.push('href="');
          html.push(url);
          html.push('">');
          addText(text);
          html.push('</a>');
        }
      };
    }
  ]);
}(window, window.angular));angular.module('ng-rails-csrf', []).config([
  '$httpProvider',
  function ($httpProvider) {
    var getToken = function () {
      var el = document.querySelector('meta[name="csrf-token"]');
      if (el) {
        el = el.getAttribute('content');
      } else {
        el = document.querySelector('input[name="authenticity_token"]');
        if (el) {
          el = el.value;
        }
      }
      return el;
    };
    var updateToken = function () {
      var headers = $httpProvider.defaults.headers.common, token = getToken();
      if (token) {
        headers['X-CSRF-TOKEN'] = getToken();
        headers['X-Requested-With'] = 'XMLHttpRequest';
      }
    };
    updateToken();
    if (window['Turbolinks']) {
      $(document).bind('page:change', updateToken);
    }
  }
]);angular.module('ngProgress.provider', ['ngProgress.directive']).provider('ngProgress', function () {
  'use strict';
  this.autoStyle = true;
  this.count = 0;
  this.height = '2px';
  this.color = 'firebrick';
  this.$get = [
    '$document',
    '$window',
    '$compile',
    '$rootScope',
    '$timeout',
    function ($document, $window, $compile, $rootScope, $timeout) {
      var count = this.count, height = this.height, color = this.color, $scope = $rootScope, $body = $document.find('body');
      var progressbarEl = $compile('<ng-progress></ng-progress>')($scope);
      $body.append(progressbarEl);
      $scope.count = count;
      if (height !== undefined) {
        progressbarEl.eq(0).children().css('height', height);
      }
      if (color !== undefined) {
        progressbarEl.eq(0).children().css('background-color', color);
        progressbarEl.eq(0).children().css('color', color);
      }
      var intervalCounterId = 0;
      return {
        start: function () {
          this.show();
          var self = this;
          intervalCounterId = setInterval(function () {
            if (isNaN(count)) {
              clearInterval(intervalCounterId);
              count = 0;
              self.hide();
            } else {
              var remaining = 100 - count;
              count = count + 0.15 * Math.pow(1 - Math.sqrt(remaining), 2);
              self.updateCount(count);
            }
          }, 200);
        },
        updateCount: function (new_count) {
          $scope.count = new_count;
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        },
        height: function (new_height) {
          if (new_height !== undefined) {
            height = new_height;
            $scope.height = height;
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
          return height;
        },
        color: function (new_color) {
          if (new_color !== undefined) {
            color = new_color;
            $scope.color = color;
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
          return color;
        },
        hide: function () {
          progressbarEl.children().css('opacity', '0');
          var self = this;
          $timeout(function () {
            progressbarEl.children().css('width', '0%');
            $timeout(function () {
              self.show();
            }, 500);
          }, 500);
        },
        show: function () {
          $timeout(function () {
            progressbarEl.children().css('opacity', '1');
          }, 100);
        },
        status: function () {
          return count;
        },
        stop: function () {
          clearInterval(intervalCounterId);
        },
        set: function (new_count) {
          this.show();
          this.updateCount(new_count);
          count = new_count;
          clearInterval(intervalCounterId);
          return count;
        },
        css: function (args) {
          return progressbarEl.children().css(args);
        },
        reset: function () {
          clearInterval(intervalCounterId);
          count = 0;
          this.updateCount(count);
          return 0;
        },
        complete: function () {
          count = 100;
          this.updateCount(count);
          var self = this;
          $timeout(function () {
            self.hide();
            $timeout(function () {
              count = 0;
              self.updateCount(count);
            }, 500);
          }, 1000);
          return count;
        }
      };
    }
  ];
  this.setColor = function (color) {
    if (color !== undefined) {
      this.color = color;
    }
    return this.color;
  };
  this.setHeight = function (height) {
    if (height !== undefined) {
      this.height = height;
    }
    return this.height;
  };
});
angular.module('ngProgress.directive', []).directive('ngProgress', [
  '$window',
  '$rootScope',
  function ($window, $rootScope) {
    var directiveObj = {
        replace: true,
        restrict: 'E',
        link: function ($scope, $element, $attrs, $controller) {
          $rootScope.$watch('count', function (newVal) {
            if (newVal !== undefined || newVal !== null) {
              $scope.counter = newVal;
              $element.eq(0).children().css('width', newVal + '%');
            }
          });
          $rootScope.$watch('color', function (newVal) {
            if (newVal !== undefined || newVal !== null) {
              $scope.color = newVal;
              $element.eq(0).children().css('background-color', newVal);
              $element.eq(0).children().css('color', newVal);
            }
          });
          $rootScope.$watch('height', function (newVal) {
            if (newVal !== undefined || newVal !== null) {
              $scope.height = newVal;
              $element.eq(0).children().css('height', newVal);
            }
          });
        },
        template: '<div id="ngProgress-container"><div id="ngProgress"></div></div>'
      };
    return directiveObj;
  }
]);
angular.module('ngProgress', [
  'ngProgress.directive',
  'ngProgress.provider'
]);(function () {
  var e = angular.module('angularFileUpload', []);
  e.service('$upload', [
    '$http',
    function (e) {
      this.upload = function (t) {
        t.method = t.method || 'POST';
        t.headers = t.headers || {};
        t.headers['Content-Type'] = undefined;
        var n = new FormData();
        if (t.data) {
          for (var r in t.data) {
            var i = t.data[r];
            if (t.transformRequest) {
              if (typeof t.transformRequest == 'function') {
                i = t.transformRequest(i);
              } else {
                for (fn in t.transformRequest) {
                  if (typeof fn == 'function') {
                    i = fn(i);
                  }
                }
              }
            } else {
              i = e.defaults.transformRequest[0](i);
            }
            n.append(r, i);
          }
        }
        t.transformRequest = angular.identity;
        n.append(t.fileFormDataName || 'file', t.file, t.file.name);
        n['__uploadProgress_'] = function (e) {
          if (e)
            t.progress(e);
        };
        t.data = n;
        var s = e(t);
        s.abort = function () {
          throw 'upload is not started yet';
        };
        n['__setAbortFunction_'] = function (e) {
          s.abort = e;
        };
        return s;
      };
    }
  ]);
  e.directive('ngFileSelect', [
    '$parse',
    '$http',
    function (e, t) {
      return function (t, n, r) {
        var i = e(r['ngFileSelect']);
        n.bind('change', function (e) {
          var n = [], r, s;
          r = e.target.files;
          if (r != null) {
            for (s = 0; s < r.length; s++) {
              n.push(r.item(s));
            }
          }
          t.$apply(function () {
            i(t, {
              $files: n,
              $event: e
            });
          });
        });
        n.bind('click', function () {
          this.value = null;
        });
      };
    }
  ]);
  e.directive('ngFileClick', [
    '$parse',
    '$http',
    function (e, t) {
      return function (t, n, r) {
        var i = e(r['ngFileClick']);
        n.bind('click', function (e) {
          var n = [], r, s;
          r = e.target.files;
          if (r != null) {
            for (s = 0; s < r.length; s++) {
              n.push(r.item(s));
            }
          }
          t.$apply(function () {
            i(t, {
              $files: n,
              $event: e
            });
          });
        });
        n.bind('click', function () {
          this.value = null;
        });
      };
    }
  ]);
  e.directive('ngFileDropAvailable', [
    '$parse',
    '$http',
    function (e, t) {
      return function (t, n, r) {
        if ('draggable' in document.createElement('span')) {
          var i = e(r['ngFileDropAvailable']);
          if (!t.$$phase) {
            t.$apply(function () {
              i(t);
            });
          } else {
            i(t);
          }
        }
      };
    }
  ]);
  e.directive('ngFileDrop', [
    '$parse',
    '$http',
    function (e, t) {
      return function (t, n, r) {
        if ('draggable' in document.createElement('span')) {
          var i = e(r['ngFileDrop']);
          n[0].addEventListener('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            n.addClass(r['ngFileDragOverClass'] || 'dragover');
          }, false);
          n[0].addEventListener('dragleave', function (e) {
            n.removeClass(r['ngFileDragOverClass'] || 'dragover');
          }, false);
          n[0].addEventListener('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();
            n.removeClass(r['ngFileDragOverClass'] || 'dragover');
            var s = [], o = e.dataTransfer.files, u;
            if (o != null) {
              for (u = 0; u < o.length; u++) {
                s.push(o.item(u));
              }
            }
            t.$apply(function () {
              i(t, {
                $files: s,
                $event: e
              });
            });
          }, false);
        }
      };
    }
  ]);
}());
;(function () {
  window.XMLHttpRequest && (XMLHttpRequest = window.FormData ? function (b) {
    return function () {
      var a = new b();
      a.send = function (b) {
        return function () {
          if (arguments[0] instanceof FormData && arguments[0].__uploadProgress_) {
            var c = arguments[0];
            c.__uploadProgress_ && a.upload.addEventListener('progress', function (a) {
              c.__uploadProgress_(a);
            }, !1);
            c.__setAbortFunction_ && c.__setAbortFunction_(function () {
              a.abort();
            });
          }
          b.apply(a, arguments);
        };
      }(a.send);
      return a;
    };
  }(XMLHttpRequest) : function (b) {
    return function () {
      var a = new b(), g = a.send;
      a.__requestHeaders = [];
      a.open = function (c) {
        a.upload = {
          addEventListener: function (c, d, b) {
            'progress' == c && (a.__progress = d);
          }
        };
        return function (f, d, b) {
          c.apply(a, [
            f,
            d,
            b
          ]);
          a.__url = d;
        };
      }(a.open);
      a.getResponseHeader = function (c) {
        return function (b) {
          return a.__fileApiXHR ? a.__fileApiXHR.getResponseHeader(b) : c.apply(a, [b]);
        };
      }(a.getResponseHeader);
      a.getAllResponseHeaders = function (c) {
        return function () {
          return a.__fileApiXHR ? a.__fileApiXHR.getAllResponseHeaders() : c.apply(a);
        };
      }(a.getAllResponseHeaders);
      a.abort = function (c) {
        return function () {
          return a.__fileApiXHR ? a.__fileApiXHR.abort() : null == c ? null : c.apply(a);
        };
      }(a.abort);
      a.send = function () {
        if (arguments[0].__isShim && arguments[0].__uploadProgress_) {
          var c = arguments[0];
          c.__uploadProgress_ && a.upload.addEventListener('progress', function (a) {
            c.__uploadProgress_(a);
          }, !1);
          c.__setAbortFunction_ && c.__setAbortFunction_(function () {
            a.__fileApiXHR.abort();
          });
          for (var b = {
                url: a.__url,
                complete: function (c, b) {
                  Object.defineProperty(a, 'status', {
                    get: function () {
                      return b.status;
                    }
                  });
                  Object.defineProperty(a, 'statusText', {
                    get: function () {
                      return b.statusText;
                    }
                  });
                  Object.defineProperty(a, 'readyState', {
                    get: function () {
                      return 4;
                    }
                  });
                  Object.defineProperty(a, 'response', {
                    get: function () {
                      return b.response;
                    }
                  });
                  Object.defineProperty(a, 'responseText', {
                    get: function () {
                      return b.responseText;
                    }
                  });
                  a.__fileApiXHR = b;
                  a.onreadystatechange();
                },
                progress: function (b) {
                  a.__progress(b);
                },
                headers: a.__requestHeaders,
                data: {},
                files: {}
              }, d = 0; d < c.data.length; d++) {
            var e = c.data[d];
            null != e.val && null != e.val.name && null != e.val.size && null != e.val.type ? b.files[e.key] = e.val : b.data[e.key] = e.val;
          }
          a.__fileApiXHR = FileAPI.upload(b);
        } else
          g.apply(a, arguments);
      };
      return a;
    };
  }(XMLHttpRequest));
  window.FormData || (HTMLInputElement.prototype.addEventListener = HTMLInputElement.prototype.attachEvent = function (b) {
    return function (a, g, c, f) {
      if ('change' !== a.toLowerCase() && 'onchange' !== a.toLowerCase() || 'file' != this.getAttribute('type'))
        b.apply(this, [
          a,
          g,
          c,
          f
        ]);
      else {
        if (!this.__isWrapped && (null != this.getAttribute('ng-file-select') || null != this.getAttribute('data-ng-file-select'))) {
          var d = document.createElement('div');
          d.innerHTML = '<div class="js-fileapi-wrapper" style="position:relative; overflow:hidden"></div>';
          var d = d.firstChild, e = this.parentNode;
          e.insertBefore(d, this);
          e.removeChild(this);
          d.appendChild(this);
          this.__isWrapped = !0;
        }
        b.apply(this, [
          a,
          function (a) {
            var b = FileAPI.getFiles(a);
            a.target || (a.target = {});
            a.target.files = b;
            a.target.files.item = function (b) {
              return a.target.files[b] || null;
            };
            g(a);
          },
          c,
          f
        ]);
      }
    };
  }(HTMLInputElement.prototype.addEventListener || HTMLInputElement.prototype.attachEvent), window.FormData = FormData = function () {
    return {
      append: function (b, a, g) {
        this.data.push({
          key: b,
          val: a,
          name: g
        });
      },
      data: [],
      __isShim: !0
    };
  }, function () {
    if (!window.FileAPI || !FileAPI.upload) {
      var b = '', a = document.createElement('script'), g = document.getElementsByTagName('script'), c, f, d;
      if (window.FileAPI && window.FileAPI.jsPath)
        b = window.FileAPI.jsPath;
      else
        for (c = 0; c < g.length; c++)
          if (d = g[c].src, f = d.indexOf('angular-file-upload-shim.js'), -1 == f && (f = d.indexOf('angular-file-upload-shim.min.js')), -1 < f) {
            b = d.substring(0, f);
            break;
          }
      window.FileAPI && null != FileAPI.staticPath || (FileAPI = { staticPath: b });
      a.setAttribute('src', b + 'FileAPI.min.js');
      document.getElementsByTagName('head')[0].appendChild(a);
    }
  }());
}());var mod;
mod = angular.module('infinite-scroll', []);
mod.directive('infiniteScroll', [
  '$rootScope',
  '$window',
  '$timeout',
  '$document',
  function (e, t, n, r) {
    return {
      link: function (i, s, o) {
        var u, a, f, l;
        t = angular.element(t);
        f = 0;
        if (o.infiniteScrollDistance != null) {
          i.$watch(o.infiniteScrollDistance, function (e) {
            return f = parseInt(e, 30);
          });
        }
        l = true;
        u = false;
        if (o.infiniteScrollDisabled != null) {
          i.$watch(o.infiniteScrollDisabled, function (e) {
            l = !e;
            if (l && u) {
              u = false;
              return a();
            }
          });
        }
        a = function () {
          var n, a, f, c;
          var h = angular.element(r);
          var p = o.custom;
          var d = o.customelement;
          var v = angular.element('#' + d);
          c = t.height() + h.height() + t.scrollTop();
          n = s.offset().top + s.height();
          a = n - c;
          f = t.scrollTop() > h.height() - t.height() - 15;
          if (f && l) {
            if (e.$$phase) {
              return i.$eval(o.infiniteScroll);
            } else {
              return i.$apply(o.infiniteScroll);
            }
          } else if (f) {
            return u = true;
          }
        };
        t.on('scroll', a);
        i.$on('$destroy', function () {
          return t.off('scroll', a);
        });
        return n(function () {
          if (o.infiniteScrollImmediateCheck) {
            if (i.$eval(o.infiniteScrollImmediateCheck)) {
              return a();
            }
          } else {
            return a();
          }
        }, 0);
      }
    };
  }
]);
;!function (a, b, c) {
  a.fn.jScrollPane = function (d) {
    function e(d, e) {
      function f(b) {
        var e, h, j, l, m, n, q = !1, r = !1;
        if (P = b, Q === c)
          m = d.scrollTop(), n = d.scrollLeft(), d.css({
            overflow: 'hidden',
            padding: 0
          }), R = d.innerWidth() + tb, S = d.innerHeight(), d.width(R), Q = a('<div class="jspPane" />').css('padding', sb).append(d.children()), T = a('<div class="jspContainer" />').css({
            width: R + 'px',
            height: S + 'px'
          }).append(Q).appendTo(d);
        else {
          if (d.css('width', ''), q = P.stickToBottom && C(), r = P.stickToRight && D(), l = d.innerWidth() + tb != R || d.outerHeight() != S, l && (R = d.innerWidth() + tb, S = d.innerHeight(), T.css({
              width: R + 'px',
              height: S + 'px'
            })), !l && ub == U && Q.outerHeight() == V)
            return d.width(R), void 0;
          ub = U, Q.css('width', ''), d.width(R), T.find('>.jspVerticalBar,>.jspHorizontalBar').remove().end();
        }
        Q.css('overflow', 'auto'), U = b.contentWidth ? b.contentWidth : Q[0].scrollWidth, V = Q[0].scrollHeight, Q.css('overflow', ''), W = U / R, X = V / S, Y = X > 1, Z = W > 1, Z || Y ? (d.addClass('jspScrollable'), e = P.maintainPosition && (ab || db), e && (h = A(), j = B()), g(), i(), k(), e && (y(r ? U - R : h, !1), x(q ? V - S : j, !1)), H(), E(), N(), P.enableKeyboardNavigation && J(), P.clickOnTrack && o(), L(), P.hijackInternalLinks && M()) : (d.removeClass('jspScrollable'), Q.css({
          top: 0,
          left: 0,
          width: T.width() - tb
        }), F(), I(), K(), p()), P.autoReinitialise && !rb ? rb = setInterval(function () {
          f(P);
        }, P.autoReinitialiseDelay) : !P.autoReinitialise && rb && clearInterval(rb), m && d.scrollTop(0) && x(m, !1), n && d.scrollLeft(0) && y(n, !1), d.trigger('jsp-initialised', [Z || Y]);
      }
      function g() {
        Y && (T.append(a('<div class="jspVerticalBar" />').append(a('<div class="jspCap jspCapTop" />'), a('<div class="jspTrack" />').append(a('<div class="jspDrag" />').append(a('<div class="jspDragTop" />'), a('<div class="jspDragBottom" />'))), a('<div class="jspCap jspCapBottom" />'))), eb = T.find('>.jspVerticalBar'), fb = eb.find('>.jspTrack'), $ = fb.find('>.jspDrag'), P.showArrows && (jb = a('<a class="jspArrow jspArrowUp" />').bind('mousedown.jsp', m(0, -1)).bind('click.jsp', G), kb = a('<a class="jspArrow jspArrowDown" />').bind('mousedown.jsp', m(0, 1)).bind('click.jsp', G), P.arrowScrollOnHover && (jb.bind('mouseover.jsp', m(0, -1, jb)), kb.bind('mouseover.jsp', m(0, 1, kb))), l(fb, P.verticalArrowPositions, jb, kb)), hb = S, T.find('>.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow').each(function () {
          hb -= a(this).outerHeight();
        }), $.hover(function () {
          $.addClass('jspHover');
        }, function () {
          $.removeClass('jspHover');
        }).bind('mousedown.jsp', function (b) {
          a('html').bind('dragstart.jsp selectstart.jsp', G), $.addClass('jspActive');
          var c = b.pageY - $.position().top;
          return a('html').bind('mousemove.jsp', function (a) {
            r(a.pageY - c, !1);
          }).bind('mouseup.jsp mouseleave.jsp', q), !1;
        }), h());
      }
      function h() {
        fb.height(hb + 'px'), ab = 0, gb = P.verticalGutter + fb.outerWidth(), Q.width(R - gb - tb);
        try {
          0 === eb.position().left && Q.css('margin-left', gb + 'px');
        } catch (a) {
        }
      }
      function i() {
        Z && (T.append(a('<div class="jspHorizontalBar" />').append(a('<div class="jspCap jspCapLeft" />'), a('<div class="jspTrack" />').append(a('<div class="jspDrag" />').append(a('<div class="jspDragLeft" />'), a('<div class="jspDragRight" />'))), a('<div class="jspCap jspCapRight" />'))), lb = T.find('>.jspHorizontalBar'), mb = lb.find('>.jspTrack'), bb = mb.find('>.jspDrag'), P.showArrows && (pb = a('<a class="jspArrow jspArrowLeft" />').bind('mousedown.jsp', m(-1, 0)).bind('click.jsp', G), qb = a('<a class="jspArrow jspArrowRight" />').bind('mousedown.jsp', m(1, 0)).bind('click.jsp', G), P.arrowScrollOnHover && (pb.bind('mouseover.jsp', m(-1, 0, pb)), qb.bind('mouseover.jsp', m(1, 0, qb))), l(mb, P.horizontalArrowPositions, pb, qb)), bb.hover(function () {
          bb.addClass('jspHover');
        }, function () {
          bb.removeClass('jspHover');
        }).bind('mousedown.jsp', function (b) {
          a('html').bind('dragstart.jsp selectstart.jsp', G), bb.addClass('jspActive');
          var c = b.pageX - bb.position().left;
          return a('html').bind('mousemove.jsp', function (a) {
            t(a.pageX - c, !1);
          }).bind('mouseup.jsp mouseleave.jsp', q), !1;
        }), nb = T.innerWidth(), j());
      }
      function j() {
        T.find('>.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow').each(function () {
          nb -= a(this).outerWidth();
        }), mb.width(nb + 'px'), db = 0;
      }
      function k() {
        if (Z && Y) {
          var b = mb.outerHeight(), c = fb.outerWidth();
          hb -= b, a(lb).find('>.jspCap:visible,>.jspArrow').each(function () {
            nb += a(this).outerWidth();
          }), nb -= c, S -= c, R -= b, mb.parent().append(a('<div class="jspCorner" />').css('width', b + 'px')), h(), j();
        }
        Z && Q.width(T.outerWidth() - tb + 'px'), V = Q.outerHeight(), X = V / S, Z && (ob = Math.ceil(1 / W * nb), ob > P.horizontalDragMaxWidth ? ob = P.horizontalDragMaxWidth : ob < P.horizontalDragMinWidth && (ob = P.horizontalDragMinWidth), bb.width(ob + 'px'), cb = nb - ob, u(db)), Y && (ib = Math.ceil(1 / X * hb), ib > P.verticalDragMaxHeight ? ib = P.verticalDragMaxHeight : ib < P.verticalDragMinHeight && (ib = P.verticalDragMinHeight), $.height(ib + 'px'), _ = hb - ib, s(ab));
      }
      function l(a, b, c, d) {
        var e, f = 'before', g = 'after';
        'os' == b && (b = /Mac/.test(navigator.platform) ? 'after' : 'split'), b == f ? g = b : b == g && (f = b, e = c, c = d, d = e), a[f](c)[g](d);
      }
      function m(a, b, c) {
        return function () {
          return n(a, b, this, c), this.blur(), !1;
        };
      }
      function n(b, c, d, e) {
        d = a(d).addClass('jspActive');
        var f, g, h = !0, i = function () {
            0 !== b && vb.scrollByX(b * P.arrowButtonSpeed), 0 !== c && vb.scrollByY(c * P.arrowButtonSpeed), g = setTimeout(i, h ? P.initialDelay : P.arrowRepeatFreq), h = !1;
          };
        i(), f = e ? 'mouseout.jsp' : 'mouseup.jsp', e = e || a('html'), e.bind(f, function () {
          d.removeClass('jspActive'), g && clearTimeout(g), g = null, e.unbind(f);
        });
      }
      function o() {
        p(), Y && fb.bind('mousedown.jsp', function (b) {
          if (b.originalTarget === c || b.originalTarget == b.currentTarget) {
            var d, e = a(this), f = e.offset(), g = b.pageY - f.top - ab, h = !0, i = function () {
                var a = e.offset(), c = b.pageY - a.top - ib / 2, f = S * P.scrollPagePercent, k = _ * f / (V - S);
                if (0 > g)
                  ab - k > c ? vb.scrollByY(-f) : r(c);
                else {
                  if (!(g > 0))
                    return j(), void 0;
                  c > ab + k ? vb.scrollByY(f) : r(c);
                }
                d = setTimeout(i, h ? P.initialDelay : P.trackClickRepeatFreq), h = !1;
              }, j = function () {
                d && clearTimeout(d), d = null, a(document).unbind('mouseup.jsp', j);
              };
            return i(), a(document).bind('mouseup.jsp', j), !1;
          }
        }), Z && mb.bind('mousedown.jsp', function (b) {
          if (b.originalTarget === c || b.originalTarget == b.currentTarget) {
            var d, e = a(this), f = e.offset(), g = b.pageX - f.left - db, h = !0, i = function () {
                var a = e.offset(), c = b.pageX - a.left - ob / 2, f = R * P.scrollPagePercent, k = cb * f / (U - R);
                if (0 > g)
                  db - k > c ? vb.scrollByX(-f) : t(c);
                else {
                  if (!(g > 0))
                    return j(), void 0;
                  c > db + k ? vb.scrollByX(f) : t(c);
                }
                d = setTimeout(i, h ? P.initialDelay : P.trackClickRepeatFreq), h = !1;
              }, j = function () {
                d && clearTimeout(d), d = null, a(document).unbind('mouseup.jsp', j);
              };
            return i(), a(document).bind('mouseup.jsp', j), !1;
          }
        });
      }
      function p() {
        mb && mb.unbind('mousedown.jsp'), fb && fb.unbind('mousedown.jsp');
      }
      function q() {
        a('html').unbind('dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp'), $ && $.removeClass('jspActive'), bb && bb.removeClass('jspActive');
      }
      function r(a, b) {
        Y && (0 > a ? a = 0 : a > _ && (a = _), b === c && (b = P.animateScroll), b ? vb.animate($, 'top', a, s) : ($.css('top', a), s(a)));
      }
      function s(a) {
        a === c && (a = $.position().top), T.scrollTop(0), ab = a;
        var b = 0 === ab, e = ab == _, f = a / _, g = -f * (V - S);
        (wb != b || yb != e) && (wb = b, yb = e, d.trigger('jsp-arrow-change', [
          wb,
          yb,
          xb,
          zb
        ])), v(b, e), Q.css('top', g), d.trigger('jsp-scroll-y', [
          -g,
          b,
          e
        ]).trigger('scroll');
      }
      function t(a, b) {
        Z && (0 > a ? a = 0 : a > cb && (a = cb), b === c && (b = P.animateScroll), b ? vb.animate(bb, 'left', a, u) : (bb.css('left', a), u(a)));
      }
      function u(a) {
        a === c && (a = bb.position().left), T.scrollTop(0), db = a;
        var b = 0 === db, e = db == cb, f = a / cb, g = -f * (U - R);
        (xb != b || zb != e) && (xb = b, zb = e, d.trigger('jsp-arrow-change', [
          wb,
          yb,
          xb,
          zb
        ])), w(b, e), Q.css('left', g), d.trigger('jsp-scroll-x', [
          -g,
          b,
          e
        ]).trigger('scroll');
      }
      function v(a, b) {
        P.showArrows && (jb[a ? 'addClass' : 'removeClass']('jspDisabled'), kb[b ? 'addClass' : 'removeClass']('jspDisabled'));
      }
      function w(a, b) {
        P.showArrows && (pb[a ? 'addClass' : 'removeClass']('jspDisabled'), qb[b ? 'addClass' : 'removeClass']('jspDisabled'));
      }
      function x(a, b) {
        var c = a / (V - S);
        r(c * _, b);
      }
      function y(a, b) {
        var c = a / (U - R);
        t(c * cb, b);
      }
      function z(b, c, d) {
        var e, f, g, h, i, j, k, l, m, n = 0, o = 0;
        try {
          e = a(b);
        } catch (p) {
          return;
        }
        for (f = e.outerHeight(), g = e.outerWidth(), T.scrollTop(0), T.scrollLeft(0); !e.is('.jspPane');)
          if (n += e.position().top, o += e.position().left, e = e.offsetParent(), /^body|html$/i.test(e[0].nodeName))
            return;
        h = B(), j = h + S, h > n || c ? l = n - P.horizontalGutter : n + f > j && (l = n - S + f + P.horizontalGutter), isNaN(l) || x(l, d), i = A(), k = i + R, i > o || c ? m = o - P.horizontalGutter : o + g > k && (m = o - R + g + P.horizontalGutter), isNaN(m) || y(m, d);
      }
      function A() {
        return -Q.position().left;
      }
      function B() {
        return -Q.position().top;
      }
      function C() {
        var a = V - S;
        return a > 20 && a - B() < 10;
      }
      function D() {
        var a = U - R;
        return a > 20 && a - A() < 10;
      }
      function E() {
        T.unbind(Bb).bind(Bb, function (a, b, c, d) {
          var e = db, f = ab, g = a.deltaFactor || P.mouseWheelSpeed;
          return vb.scrollBy(c * g, -d * g, !1), e == db && f == ab;
        });
      }
      function F() {
        T.unbind(Bb);
      }
      function G() {
        return !1;
      }
      function H() {
        Q.find(':input,a').unbind('focus.jsp').bind('focus.jsp', function (a) {
          z(a.target, !1);
        });
      }
      function I() {
        Q.find(':input,a').unbind('focus.jsp');
      }
      function J() {
        function b() {
          var a = db, b = ab;
          switch (c) {
          case 40:
            vb.scrollByY(P.keyboardSpeed, !1);
            break;
          case 38:
            vb.scrollByY(-P.keyboardSpeed, !1);
            break;
          case 34:
          case 32:
            vb.scrollByY(S * P.scrollPagePercent, !1);
            break;
          case 33:
            vb.scrollByY(-S * P.scrollPagePercent, !1);
            break;
          case 39:
            vb.scrollByX(P.keyboardSpeed, !1);
            break;
          case 37:
            vb.scrollByX(-P.keyboardSpeed, !1);
          }
          return e = a != db || b != ab;
        }
        var c, e, f = [];
        Z && f.push(lb[0]), Y && f.push(eb[0]), Q.focus(function () {
          d.focus();
        }), d.attr('tabindex', 0).unbind('keydown.jsp keypress.jsp').bind('keydown.jsp', function (d) {
          if (d.target === this || f.length && a(d.target).closest(f).length) {
            var g = db, h = ab;
            switch (d.keyCode) {
            case 40:
            case 38:
            case 34:
            case 32:
            case 33:
            case 39:
            case 37:
              c = d.keyCode, b();
              break;
            case 35:
              x(V - S), c = null;
              break;
            case 36:
              x(0), c = null;
            }
            return e = d.keyCode == c && g != db || h != ab, !e;
          }
        }).bind('keypress.jsp', function (a) {
          return a.keyCode == c && b(), !e;
        }), P.hideFocus ? (d.css('outline', 'none'), 'hideFocus' in T[0] && d.attr('hideFocus', !0)) : (d.css('outline', ''), 'hideFocus' in T[0] && d.attr('hideFocus', !1));
      }
      function K() {
        d.attr('tabindex', '-1').removeAttr('tabindex').unbind('keydown.jsp keypress.jsp');
      }
      function L() {
        if (location.hash && location.hash.length > 1) {
          var b, c, d = escape(location.hash.substr(1));
          try {
            b = a('#' + d + ', a[name="' + d + '"]');
          } catch (e) {
            return;
          }
          b.length && Q.find(d) && (0 === T.scrollTop() ? c = setInterval(function () {
            T.scrollTop() > 0 && (z(b, !0), a(document).scrollTop(T.position().top), clearInterval(c));
          }, 50) : (z(b, !0), a(document).scrollTop(T.position().top)));
        }
      }
      function M() {
        a(document.body).data('jspHijack') || (a(document.body).data('jspHijack', !0), a(document.body).delegate('a[href*=#]', 'click', function (c) {
          var d, e, f, g, h, i, j = this.href.substr(0, this.href.indexOf('#')), k = location.href;
          if (-1 !== location.href.indexOf('#') && (k = location.href.substr(0, location.href.indexOf('#'))), j === k) {
            d = escape(this.href.substr(this.href.indexOf('#') + 1));
            try {
              e = a('#' + d + ', a[name="' + d + '"]');
            } catch (l) {
              return;
            }
            e.length && (f = e.closest('.jspScrollable'), g = f.data('jsp'), g.scrollToElement(e, !0), f[0].scrollIntoView && (h = a(b).scrollTop(), i = e.offset().top, (h > i || i > h + a(b).height()) && f[0].scrollIntoView()), c.preventDefault());
          }
        }));
      }
      function N() {
        var a, b, c, d, e, f = !1;
        T.unbind('touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick').bind('touchstart.jsp', function (g) {
          var h = g.originalEvent.touches[0];
          a = A(), b = B(), c = h.pageX, d = h.pageY, e = !1, f = !0;
        }).bind('touchmove.jsp', function (g) {
          if (f) {
            var h = g.originalEvent.touches[0], i = db, j = ab;
            return vb.scrollTo(a + c - h.pageX, b + d - h.pageY), e = e || Math.abs(c - h.pageX) > 5 || Math.abs(d - h.pageY) > 5, i == db && j == ab;
          }
        }).bind('touchend.jsp', function () {
          f = !1;
        }).bind('click.jsp-touchclick', function () {
          return e ? (e = !1, !1) : void 0;
        });
      }
      function O() {
        var a = B(), b = A();
        d.removeClass('jspScrollable').unbind('.jsp'), d.replaceWith(Ab.append(Q.children())), Ab.scrollTop(a), Ab.scrollLeft(b), rb && clearInterval(rb);
      }
      var P, Q, R, S, T, U, V, W, X, Y, Z, $, _, ab, bb, cb, db, eb, fb, gb, hb, ib, jb, kb, lb, mb, nb, ob, pb, qb, rb, sb, tb, ub, vb = this, wb = !0, xb = !0, yb = !1, zb = !1, Ab = d.clone(!1, !1).empty(), Bb = a.fn.mwheelIntent ? 'mwheelIntent.jsp' : 'mousewheel.jsp';
      'border-box' === d.css('box-sizing') ? (sb = 0, tb = 0) : (sb = d.css('paddingTop') + ' ' + d.css('paddingRight') + ' ' + d.css('paddingBottom') + ' ' + d.css('paddingLeft'), tb = (parseInt(d.css('paddingLeft'), 10) || 0) + (parseInt(d.css('paddingRight'), 10) || 0)), a.extend(vb, {
        reinitialise: function (b) {
          b = a.extend({}, P, b), f(b);
        },
        scrollToElement: function (a, b, c) {
          z(a, b, c);
        },
        scrollTo: function (a, b, c) {
          y(a, c), x(b, c);
        },
        scrollToX: function (a, b) {
          y(a, b);
        },
        scrollToY: function (a, b) {
          x(a, b);
        },
        scrollToPercentX: function (a, b) {
          y(a * (U - R), b);
        },
        scrollToPercentY: function (a, b) {
          x(a * (V - S), b);
        },
        scrollBy: function (a, b, c) {
          vb.scrollByX(a, c), vb.scrollByY(b, c);
        },
        scrollByX: function (a, b) {
          var c = A() + Math[0 > a ? 'floor' : 'ceil'](a), d = c / (U - R);
          t(d * cb, b);
        },
        scrollByY: function (a, b) {
          var c = B() + Math[0 > a ? 'floor' : 'ceil'](a), d = c / (V - S);
          r(d * _, b);
        },
        positionDragX: function (a, b) {
          t(a, b);
        },
        positionDragY: function (a, b) {
          r(a, b);
        },
        animate: function (a, b, c, d) {
          var e = {};
          e[b] = c, a.animate(e, {
            duration: P.animateDuration,
            easing: P.animateEase,
            queue: !1,
            step: d
          });
        },
        getContentPositionX: function () {
          return A();
        },
        getContentPositionY: function () {
          return B();
        },
        getContentWidth: function () {
          return U;
        },
        getContentHeight: function () {
          return V;
        },
        getPercentScrolledX: function () {
          return A() / (U - R);
        },
        getPercentScrolledY: function () {
          return B() / (V - S);
        },
        getIsScrollableH: function () {
          return Z;
        },
        getIsScrollableV: function () {
          return Y;
        },
        getContentPane: function () {
          return Q;
        },
        scrollToBottom: function (a) {
          r(_, a);
        },
        hijackInternalLinks: a.noop,
        destroy: function () {
          O();
        }
      }), f(e);
    }
    return d = a.extend({}, a.fn.jScrollPane.defaults, d), a.each([
      'arrowButtonSpeed',
      'trackClickSpeed',
      'keyboardSpeed'
    ], function () {
      d[this] = d[this] || d.speed;
    }), this.each(function () {
      var b = a(this), c = b.data('jsp');
      c ? c.reinitialise(d) : (a('script', b).filter('[type="text/javascript"],:not([type])').remove(), c = new e(b, d), b.data('jsp', c));
    });
  }, a.fn.jScrollPane.defaults = {
    showArrows: !1,
    maintainPosition: !0,
    stickToBottom: !1,
    stickToRight: !1,
    clickOnTrack: !0,
    autoReinitialise: !1,
    autoReinitialiseDelay: 500,
    verticalDragMinHeight: 0,
    verticalDragMaxHeight: 99999,
    horizontalDragMinWidth: 0,
    horizontalDragMaxWidth: 99999,
    contentWidth: c,
    animateScroll: !1,
    animateDuration: 300,
    animateEase: 'linear',
    hijackInternalLinks: !1,
    verticalGutter: 4,
    horizontalGutter: 4,
    mouseWheelSpeed: 3,
    arrowButtonSpeed: 0,
    arrowRepeatFreq: 50,
    arrowScrollOnHover: !1,
    trackClickSpeed: 0,
    trackClickRepeatFreq: 70,
    verticalArrowPositions: 'split',
    horizontalArrowPositions: 'split',
    enableKeyboardNavigation: !0,
    hideFocus: !1,
    keyboardSpeed: 0,
    initialDelay: 300,
    speed: 30,
    scrollPagePercent: 0.8
  };
}(jQuery, this);(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    factory(jQuery);
  }
}(function ($) {
  var toFix = [
      'wheel',
      'mousewheel',
      'DOMMouseScroll',
      'MozMousePixelScroll'
    ], toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : [
      'mousewheel',
      'DomMouseScroll',
      'MozMousePixelScroll'
    ], slice = Array.prototype.slice, nullLowestDeltaTimeout, lowestDelta;
  if ($.event.fixHooks) {
    for (var i = toFix.length; i;) {
      $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
    }
  }
  var special = $.event.special.mousewheel = {
      version: '3.1.9',
      setup: function () {
        if (this.addEventListener) {
          for (var i = toBind.length; i;) {
            this.addEventListener(toBind[--i], handler, false);
          }
        } else {
          this.onmousewheel = handler;
        }
        $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
        $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
      },
      teardown: function () {
        if (this.removeEventListener) {
          for (var i = toBind.length; i;) {
            this.removeEventListener(toBind[--i], handler, false);
          }
        } else {
          this.onmousewheel = null;
        }
      },
      getLineHeight: function (elem) {
        return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
      },
      getPageHeight: function (elem) {
        return $(elem).height();
      },
      settings: { adjustOldDeltas: true }
    };
  $.fn.extend({
    mousewheel: function (fn) {
      return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
    },
    unmousewheel: function (fn) {
      return this.unbind('mousewheel', fn);
    }
  });
  function handler(event) {
    var orgEvent = event || window.event, args = slice.call(arguments, 1), delta = 0, deltaX = 0, deltaY = 0, absDelta = 0;
    event = $.event.fix(orgEvent);
    event.type = 'mousewheel';
    if ('detail' in orgEvent) {
      deltaY = orgEvent.detail * -1;
    }
    if ('wheelDelta' in orgEvent) {
      deltaY = orgEvent.wheelDelta;
    }
    if ('wheelDeltaY' in orgEvent) {
      deltaY = orgEvent.wheelDeltaY;
    }
    if ('wheelDeltaX' in orgEvent) {
      deltaX = orgEvent.wheelDeltaX * -1;
    }
    if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
      deltaX = deltaY * -1;
      deltaY = 0;
    }
    delta = deltaY === 0 ? deltaX : deltaY;
    if ('deltaY' in orgEvent) {
      deltaY = orgEvent.deltaY * -1;
      delta = deltaY;
    }
    if ('deltaX' in orgEvent) {
      deltaX = orgEvent.deltaX;
      if (deltaY === 0) {
        delta = deltaX * -1;
      }
    }
    if (deltaY === 0 && deltaX === 0) {
      return;
    }
    if (orgEvent.deltaMode === 1) {
      var lineHeight = $.data(this, 'mousewheel-line-height');
      delta *= lineHeight;
      deltaY *= lineHeight;
      deltaX *= lineHeight;
    } else if (orgEvent.deltaMode === 2) {
      var pageHeight = $.data(this, 'mousewheel-page-height');
      delta *= pageHeight;
      deltaY *= pageHeight;
      deltaX *= pageHeight;
    }
    absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));
    if (!lowestDelta || absDelta < lowestDelta) {
      lowestDelta = absDelta;
      if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
        lowestDelta /= 40;
      }
    }
    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
      delta /= 40;
      deltaX /= 40;
      deltaY /= 40;
    }
    delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
    deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
    deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);
    event.deltaX = deltaX;
    event.deltaY = deltaY;
    event.deltaFactor = lowestDelta;
    event.deltaMode = 0;
    args.unshift(event, delta, deltaX, deltaY);
    if (nullLowestDeltaTimeout) {
      clearTimeout(nullLowestDeltaTimeout);
    }
    nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
    return ($.event.dispatch || $.event.handle).apply(this, args);
  }
  function nullLowestDelta() {
    lowestDelta = null;
  }
  function shouldAdjustOldDeltas(orgEvent, absDelta) {
    return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
  }
}));(function (e) {
  var t = {
      method: 'GET',
      contentType: 'json',
      queryParam: 'q',
      searchDelay: 300,
      minChars: 1,
      propertyToSearch: 'name',
      jsonContainer: null,
      hintText: 'Type in a search term',
      noResultsText: 'No results',
      searchingText: 'Searching...',
      deleteText: '&times;',
      animateDropdown: true,
      tokenLimit: null,
      tokenDelimiter: ',',
      preventDuplicates: false,
      tokenValue: 'id',
      prePopulate: null,
      processPrePopulate: false,
      idPrefix: 'token-input-',
      resultsFormatter: function (e) {
        return '<li>' + e[this.propertyToSearch] + '</li>';
      },
      tokenFormatter: function (e) {
        return '<li><p>' + e[this.propertyToSearch] + '</p></li>';
      },
      onResult: null,
      onAdd: null,
      onDelete: null,
      onReady: null
    };
  var n = {
      tokenList: 'token-input-list',
      token: 'token-input-token',
      tokenDelete: 'token-input-delete-token',
      selectedToken: 'token-input-selected-token',
      highlightedToken: 'token-input-highlighted-token',
      dropdown: 'token-input-dropdown',
      dropdownItem: 'token-input-dropdown-item',
      dropdownItem2: 'token-input-dropdown-item2',
      selectedDropdownItem: 'token-input-selected-dropdown-item',
      inputToken: 'token-input-input-token'
    };
  var r = {
      BEFORE: 0,
      AFTER: 1,
      END: 2
    };
  var i = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      END: 35,
      HOME: 36,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      NUMPAD_ENTER: 108,
      COMMA: 188
    };
  var s = {
      init: function (n, r) {
        var i = e.extend({}, t, r || {});
        return this.each(function () {
          e(this).data('tokenInputObject', new e.TokenList(this, n, i));
        });
      },
      clear: function () {
        this.data('tokenInputObject').clear();
        return this;
      },
      add: function (e) {
        this.data('tokenInputObject').add(e);
        return this;
      },
      remove: function (e) {
        this.data('tokenInputObject').remove(e);
        return this;
      },
      get: function () {
        return this.data('tokenInputObject').getTokens();
      }
    };
  e.fn.tokenInput = function (e) {
    if (s[e]) {
      return s[e].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
      return s.init.apply(this, arguments);
    }
  };
  e.TokenList = function (t, s, o) {
    function x() {
      if (o.tokenLimit !== null && f >= o.tokenLimit) {
        p.hide();
        D();
        return;
      }
    }
    function T() {
      if (h === (h = p.val())) {
        return;
      }
      var e = h.replace(/&/g, '&').replace(/\s/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      E.html(e);
      p.width(E.width() + 30);
    }
    function N(e) {
      return e >= 48 && e <= 90 || e >= 96 && e <= 111 || e >= 186 && e <= 192 || e >= 219 && e <= 222;
    }
    function C(t) {
      var n = o.tokenFormatter(t);
      n = e(n).addClass(o.classes.token).insertBefore(b);
      e('<span>' + o.deleteText + '</span>').addClass(o.classes.tokenDelete).appendTo(n).click(function () {
        M(e(this).parent());
        d.change();
        return false;
      });
      var r = { id: t.id };
      r[o.propertyToSearch] = t[o.propertyToSearch];
      e.data(n.get(0), 'tokeninput', t);
      a = a.slice(0, m).concat([r]).concat(a.slice(m));
      m++;
      _(a, d);
      f += 1;
      if (o.tokenLimit !== null && f >= o.tokenLimit) {
        p.hide();
        D();
      }
      return n;
    }
    function k(t) {
      var n = o.onAdd;
      if (f > 0 && o.preventDuplicates) {
        var r = null;
        y.children().each(function () {
          var n = e(this);
          var i = e.data(n.get(0), 'tokeninput');
          if (i && i.id === t.id) {
            r = n;
            return false;
          }
        });
        if (r) {
          L(r);
          b.insertAfter(r);
          p.focus();
          return;
        }
      }
      if (o.tokenLimit == null || f < o.tokenLimit) {
        C(t);
        x();
      }
      p.val('');
      D();
      if (e.isFunction(n)) {
        n.call(d, t);
      }
    }
    function L(e) {
      e.addClass(o.classes.selectedToken);
      v = e.get(0);
      p.val('');
      D();
    }
    function A(e, t) {
      e.removeClass(o.classes.selectedToken);
      v = null;
      if (t === r.BEFORE) {
        b.insertBefore(e);
        m--;
      } else if (t === r.AFTER) {
        b.insertAfter(e);
        m++;
      } else {
        b.appendTo(y);
        m = f;
      }
      p.focus();
    }
    function O(t) {
      var n = v;
      if (v) {
        A(e(v), r.END);
      }
      if (n === t.get(0)) {
        A(t, r.END);
      } else {
        L(t);
      }
    }
    function M(t) {
      var n = e.data(t.get(0), 'tokeninput');
      var r = o.onDelete;
      var i = t.prevAll().length;
      if (i > m)
        i--;
      t.remove();
      v = null;
      p.focus();
      a = a.slice(0, i).concat(a.slice(i + 1));
      if (i < m)
        m--;
      _(a, d);
      f -= 1;
      if (o.tokenLimit !== null) {
        p.show().val('').focus();
      }
      if (e.isFunction(r)) {
        r.call(d, n);
      }
    }
    function _(t, n) {
      var r = e.map(t, function (e) {
          return e[o.tokenValue];
        });
      n.val(r.join(o.tokenDelimiter));
    }
    function D() {
      w.hide().empty();
      g = null;
    }
    function P() {
      w.css({
        position: 'absolute',
        top: e(y).offset().top + e(y).outerHeight(),
        left: e(y).offset().left,
        zindex: 999
      }).show();
    }
    function H() {
      if (o.searchingText) {
        w.html('<p>' + o.searchingText + '</p>');
        P();
      }
    }
    function B() {
      if (o.hintText) {
        w.html('<p>' + o.hintText + '</p>');
        P();
      }
    }
    function j(e, t) {
      return e.replace(new RegExp('(?![^&;]+;)(?!<[^<>]*)(' + t + ')(?![^<>]*>)(?![^&;]+;)', 'gi'), '<b>$1</b>');
    }
    function F(e, t, n) {
      return e.replace(new RegExp('(?![^&;]+;)(?!<[^<>]*)(' + t + ')(?![^<>]*>)(?![^&;]+;)', 'g'), j(t, n));
    }
    function I(t, n) {
      if (n && n.length) {
        w.empty();
        var r = e('<ul>').appendTo(w).mouseover(function (t) {
            q(e(t.target).closest('li'));
          }).mousedown(function (t) {
            k(e(t.target).closest('li').data('tokeninput'));
            d.change();
            return false;
          }).hide();
        e.each(n, function (n, i) {
          var s = o.resultsFormatter(i);
          s = F(s, i[o.propertyToSearch], t);
          s = e(s).appendTo(r);
          if (n % 2) {
            s.addClass(o.classes.dropdownItem);
          } else {
            s.addClass(o.classes.dropdownItem2);
          }
          if (n === 0) {
            q(s);
          }
          e.data(s.get(0), 'tokeninput', i);
        });
        P();
        if (o.animateDropdown) {
          r.slideDown('fast');
        } else {
          r.show();
        }
      } else {
        if (o.noResultsText) {
          w.html('<p>' + o.noResultsText + '</p>');
          P();
        }
      }
    }
    function q(t) {
      if (t) {
        if (g) {
          R(e(g));
        }
        t.addClass(o.classes.selectedDropdownItem);
        g = t.get(0);
      }
    }
    function R(e) {
      e.removeClass(o.classes.selectedDropdownItem);
      g = null;
    }
    function U() {
      var t = p.val().toLowerCase();
      if (t && t.length) {
        if (v) {
          A(e(v), r.AFTER);
        }
        if (t.length >= o.minChars) {
          H();
          clearTimeout(c);
          c = setTimeout(function () {
            z(t);
          }, o.searchDelay);
        } else {
          D();
        }
      }
    }
    function z(t) {
      var n = t + W();
      var r = l.get(n);
      if (r) {
        I(t, r);
      } else {
        if (o.url) {
          var i = W();
          var s = {};
          s.data = {};
          if (i.indexOf('?') > -1) {
            var u = i.split('?');
            s.url = u[0];
            var a = u[1].split('&');
            e.each(a, function (e, t) {
              var n = t.split('=');
              s.data[n[0]] = n[1];
            });
          } else {
            s.url = i;
          }
          s.data[o.queryParam] = t;
          s.type = o.method;
          s.dataType = o.contentType;
          if (o.crossDomain) {
            s.dataType = 'jsonp';
          }
          s.success = function (r) {
            if (e.isFunction(o.onResult)) {
              r = o.onResult.call(d, r);
            }
            l.add(n, o.jsonContainer ? r[o.jsonContainer] : r);
            if (p.val().toLowerCase() === t) {
              I(t, o.jsonContainer ? r[o.jsonContainer] : r);
            }
          };
          e.ajax(s);
        } else if (o.local_data) {
          var f = e.grep(o.local_data, function (e) {
              return e[o.propertyToSearch].toLowerCase().indexOf(t.toLowerCase()) > -1;
            });
          if (e.isFunction(o.onResult)) {
            f = o.onResult.call(d, f);
          }
          l.add(n, f);
          I(t, f);
        }
      }
    }
    function W() {
      var e = o.url;
      if (typeof o.url == 'function') {
        e = o.url.call();
      }
      return e;
    }
    if (e.type(s) === 'string' || e.type(s) === 'function') {
      o.url = s;
      var u = W();
      if (o.crossDomain === undefined) {
        if (u.indexOf('://') === -1) {
          o.crossDomain = false;
        } else {
          o.crossDomain = location.href.split(/\/+/g)[1] !== u.split(/\/+/g)[1];
        }
      }
    } else if (typeof s === 'object') {
      o.local_data = s;
    }
    if (o.classes) {
      o.classes = e.extend({}, n, o.classes);
    } else if (o.theme) {
      o.classes = {};
      e.each(n, function (e, t) {
        o.classes[e] = t + '-' + o.theme;
      });
    } else {
      o.classes = n;
    }
    var a = [];
    var f = 0;
    var l = new e.TokenList.Cache();
    var c;
    var h;
    var p = e('<input type="text"  autocomplete="off">').css({ outline: 'none' }).attr('id', o.idPrefix + t.id).focus(function () {
        if (o.tokenLimit === null || o.tokenLimit !== f) {
          B();
        }
      }).blur(function () {
        D();
        e(this).val('');
      }).bind('keyup keydown blur update', T).keydown(function (t) {
        var n;
        var s;
        switch (t.keyCode) {
        case i.LEFT:
        case i.RIGHT:
        case i.UP:
        case i.DOWN:
          if (!e(this).val()) {
            n = b.prev();
            s = b.next();
            if (n.length && n.get(0) === v || s.length && s.get(0) === v) {
              if (t.keyCode === i.LEFT || t.keyCode === i.UP) {
                A(e(v), r.BEFORE);
              } else {
                A(e(v), r.AFTER);
              }
            } else if ((t.keyCode === i.LEFT || t.keyCode === i.UP) && n.length) {
              L(e(n.get(0)));
            } else if ((t.keyCode === i.RIGHT || t.keyCode === i.DOWN) && s.length) {
              L(e(s.get(0)));
            }
          } else {
            var o = null;
            if (t.keyCode === i.DOWN || t.keyCode === i.RIGHT) {
              o = e(g).next();
            } else {
              o = e(g).prev();
            }
            if (o.length) {
              q(o);
            }
            return false;
          }
          break;
        case i.BACKSPACE:
          n = b.prev();
          if (!e(this).val().length) {
            if (v) {
              M(e(v));
              d.change();
            } else if (n.length) {
              L(e(n.get(0)));
            }
            return false;
          } else if (e(this).val().length === 1) {
            D();
          } else {
            setTimeout(function () {
              U();
            }, 5);
          }
          break;
        case i.TAB:
        case i.ENTER:
        case i.NUMPAD_ENTER:
        case i.COMMA:
          if (g) {
            k(e(g).data('tokeninput'));
            d.change();
            return false;
          }
          break;
        case i.ESCAPE:
          D();
          return true;
        default:
          if (String.fromCharCode(t.which)) {
            setTimeout(function () {
              U();
            }, 5);
          }
          break;
        }
      });
    var d = e(t).hide().val('').focus(function () {
        p.focus();
      }).blur(function () {
        p.blur();
      });
    var v = null;
    var m = 0;
    var g = null;
    var y = e('<ul />').addClass(o.classes.tokenList).click(function (t) {
        var n = e(t.target).closest('li');
        if (n && n.get(0) && e.data(n.get(0), 'tokeninput')) {
          O(n);
        } else {
          if (v) {
            A(e(v), r.END);
          }
          p.focus();
        }
      }).mouseover(function (t) {
        var n = e(t.target).closest('li');
        if (n && v !== this) {
          n.addClass(o.classes.highlightedToken);
        }
      }).mouseout(function (t) {
        var n = e(t.target).closest('li');
        if (n && v !== this) {
          n.removeClass(o.classes.highlightedToken);
        }
      }).insertBefore(d);
    var b = e('<li />').addClass(o.classes.inputToken).appendTo(y).append(p);
    var w = e('<div>').addClass(o.classes.dropdown).appendTo('body').hide();
    var E = e('<tester/>').insertAfter(p).css({
        position: 'absolute',
        top: -9999,
        left: -9999,
        width: 'auto',
        fontSize: p.css('fontSize'),
        fontFamily: p.css('fontFamily'),
        fontWeight: p.css('fontWeight'),
        letterSpacing: p.css('letterSpacing'),
        whiteSpace: 'nowrap'
      });
    d.val('');
    var S = o.prePopulate || d.data('pre');
    if (o.processPrePopulate && e.isFunction(o.onResult)) {
      S = o.onResult.call(d, S);
    }
    if (S && S.length) {
      e.each(S, function (e, t) {
        C(t);
        x();
      });
    }
    if (e.isFunction(o.onReady)) {
      o.onReady.call();
    }
    this.clear = function () {
      y.children('li').each(function () {
        if (e(this).children('input').length === 0) {
          M(e(this));
        }
      });
    };
    this.add = function (e) {
      k(e);
    };
    this.remove = function (t) {
      y.children('li').each(function () {
        if (e(this).children('input').length === 0) {
          var n = e(this).data('tokeninput');
          var r = true;
          for (var i in t) {
            if (t[i] !== n[i]) {
              r = false;
              break;
            }
          }
          if (r) {
            M(e(this));
          }
        }
      });
    };
    this.getTokens = function () {
      return a;
    };
  };
  e.TokenList.Cache = function (t) {
    var n = e.extend({ max_size: 500 }, t);
    var r = {};
    var i = 0;
    var s = function () {
      r = {};
      i = 0;
    };
    this.add = function (e, t) {
      if (i > n.max_size) {
        s();
      }
      if (!r[e]) {
        i += 1;
      }
      r[e] = t;
    };
    this.get = function (e) {
      return r[e];
    };
  };
}(jQuery));
;(function (e, t, n, r) {
  'use strict';
  function i(e) {
    var t, n = this;
    this.trackingClick = !1, this.trackingClickStart = 0, this.targetElement = null, this.touchStartX = 0, this.touchStartY = 0, this.lastTouchIdentifier = 0, this.touchBoundary = 10, this.layer = e;
    if (!e || !e.nodeType)
      throw new TypeError('Layer must be a document node');
    this.onClick = function () {
      return i.prototype.onClick.apply(n, arguments);
    }, this.onMouse = function () {
      return i.prototype.onMouse.apply(n, arguments);
    }, this.onTouchStart = function () {
      return i.prototype.onTouchStart.apply(n, arguments);
    }, this.onTouchMove = function () {
      return i.prototype.onTouchMove.apply(n, arguments);
    }, this.onTouchEnd = function () {
      return i.prototype.onTouchEnd.apply(n, arguments);
    }, this.onTouchCancel = function () {
      return i.prototype.onTouchCancel.apply(n, arguments);
    };
    if (i.notNeeded(e))
      return;
    this.deviceIsAndroid && (e.addEventListener('mouseover', this.onMouse, !0), e.addEventListener('mousedown', this.onMouse, !0), e.addEventListener('mouseup', this.onMouse, !0)), e.addEventListener('click', this.onClick, !0), e.addEventListener('touchstart', this.onTouchStart, !1), e.addEventListener('touchmove', this.onTouchMove, !1), e.addEventListener('touchend', this.onTouchEnd, !1), e.addEventListener('touchcancel', this.onTouchCancel, !1), Event.prototype.stopImmediatePropagation || (e.removeEventListener = function (t, n, r) {
      var i = Node.prototype.removeEventListener;
      t === 'click' ? i.call(e, t, n.hijacked || n, r) : i.call(e, t, n, r);
    }, e.addEventListener = function (t, n, r) {
      var i = Node.prototype.addEventListener;
      t === 'click' ? i.call(e, t, n.hijacked || (n.hijacked = function (e) {
        e.propagationStopped || n(e);
      }), r) : i.call(e, t, n, r);
    }), typeof e.onclick == 'function' && (t = e.onclick, e.addEventListener('click', function (e) {
      t(e);
    }, !1), e.onclick = null);
  }
  function o(e) {
    if (typeof e == 'string' || e instanceof String)
      e = e.replace(/^[\\/'"]+|(;\s?})+|[\\/'"]+$/g, '');
    return e;
  }
  e('head').has('.foundation-mq-small').length === 0 && e('head').append('<meta class="foundation-mq-small">'), e('head').has('.foundation-mq-medium').length === 0 && e('head').append('<meta class="foundation-mq-medium">'), e('head').has('.foundation-mq-large').length === 0 && e('head').append('<meta class="foundation-mq-large">'), e('head').has('.foundation-mq-xlarge').length === 0 && e('head').append('<meta class="foundation-mq-xlarge">'), e('head').has('.foundation-mq-xxlarge').length === 0 && e('head').append('<meta class="foundation-mq-xxlarge">'), i.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0, i.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent), i.prototype.deviceIsIOS4 = i.prototype.deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent), i.prototype.deviceIsIOSWithBadTarget = i.prototype.deviceIsIOS && /OS ([6-9]|\d{2})_\d/.test(navigator.userAgent), i.prototype.needsClick = function (e) {
    switch (e.nodeName.toLowerCase()) {
    case 'button':
    case 'select':
    case 'textarea':
      if (e.disabled)
        return !0;
      break;
    case 'input':
      if (this.deviceIsIOS && e.type === 'file' || e.disabled)
        return !0;
      break;
    case 'label':
    case 'video':
      return !0;
    }
    return /\bneedsclick\b/.test(e.className);
  }, i.prototype.needsFocus = function (e) {
    switch (e.nodeName.toLowerCase()) {
    case 'textarea':
    case 'select':
      return !0;
    case 'input':
      switch (e.type) {
      case 'button':
      case 'checkbox':
      case 'file':
      case 'image':
      case 'radio':
      case 'submit':
        return !1;
      }
      return !e.disabled && !e.readOnly;
    default:
      return /\bneedsfocus\b/.test(e.className);
    }
  }, i.prototype.sendClick = function (e, r) {
    var i, s;
    n.activeElement && n.activeElement !== e && n.activeElement.blur(), s = r.changedTouches[0], i = n.createEvent('MouseEvents'), i.initMouseEvent('click', !0, !0, t, 1, s.screenX, s.screenY, s.clientX, s.clientY, !1, !1, !1, !1, 0, null), i.forwardedTouchEvent = !0, e.dispatchEvent(i);
  }, i.prototype.focus = function (e) {
    var t;
    this.deviceIsIOS && e.setSelectionRange ? (t = e.value.length, e.setSelectionRange(t, t)) : e.focus();
  }, i.prototype.updateScrollParent = function (e) {
    var t, n;
    t = e.fastClickScrollParent;
    if (!t || !t.contains(e)) {
      n = e;
      do {
        if (n.scrollHeight > n.offsetHeight) {
          t = n, e.fastClickScrollParent = n;
          break;
        }
        n = n.parentElement;
      } while (n);
    }
    t && (t.fastClickLastScrollTop = t.scrollTop);
  }, i.prototype.getTargetElementFromEventTarget = function (e) {
    return e.nodeType === Node.TEXT_NODE ? e.parentNode : e;
  }, i.prototype.onTouchStart = function (e) {
    var n, r, i;
    if (e.targetTouches.length > 1)
      return !0;
    n = this.getTargetElementFromEventTarget(e.target), r = e.targetTouches[0];
    if (this.deviceIsIOS) {
      i = t.getSelection();
      if (i.rangeCount && !i.isCollapsed)
        return !0;
      if (!this.deviceIsIOS4) {
        if (r.identifier === this.lastTouchIdentifier)
          return e.preventDefault(), !1;
        this.lastTouchIdentifier = r.identifier, this.updateScrollParent(n);
      }
    }
    return this.trackingClick = !0, this.trackingClickStart = e.timeStamp, this.targetElement = n, this.touchStartX = r.pageX, this.touchStartY = r.pageY, e.timeStamp - this.lastClickTime < 200 && e.preventDefault(), !0;
  }, i.prototype.touchHasMoved = function (e) {
    var t = e.changedTouches[0], n = this.touchBoundary;
    return Math.abs(t.pageX - this.touchStartX) > n || Math.abs(t.pageY - this.touchStartY) > n ? !0 : !1;
  }, i.prototype.onTouchMove = function (e) {
    if (!this.trackingClick)
      return !0;
    if (this.targetElement !== this.getTargetElementFromEventTarget(e.target) || this.touchHasMoved(e))
      this.trackingClick = !1, this.targetElement = null;
    return !0;
  }, i.prototype.findControl = function (e) {
    return e.control !== r ? e.control : e.htmlFor ? n.getElementById(e.htmlFor) : e.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
  }, i.prototype.onTouchEnd = function (e) {
    var r, i, s, o, u, a = this.targetElement;
    if (!this.trackingClick)
      return !0;
    if (e.timeStamp - this.lastClickTime < 200)
      return this.cancelNextClick = !0, !0;
    this.lastClickTime = e.timeStamp, i = this.trackingClickStart, this.trackingClick = !1, this.trackingClickStart = 0, this.deviceIsIOSWithBadTarget && (u = e.changedTouches[0], a = n.elementFromPoint(u.pageX - t.pageXOffset, u.pageY - t.pageYOffset) || a, a.fastClickScrollParent = this.targetElement.fastClickScrollParent), s = a.tagName.toLowerCase();
    if (s === 'label') {
      r = this.findControl(a);
      if (r) {
        this.focus(a);
        if (this.deviceIsAndroid)
          return !1;
        a = r;
      }
    } else if (this.needsFocus(a)) {
      if (e.timeStamp - i > 100 || this.deviceIsIOS && t.top !== t && s === 'input')
        return this.targetElement = null, !1;
      this.focus(a);
      if (!this.deviceIsIOS4 || s !== 'select')
        this.targetElement = null, e.preventDefault();
      return !1;
    }
    if (this.deviceIsIOS && !this.deviceIsIOS4) {
      o = a.fastClickScrollParent;
      if (o && o.fastClickLastScrollTop !== o.scrollTop)
        return !0;
    }
    return this.needsClick(a) || (e.preventDefault(), this.sendClick(a, e)), !1;
  }, i.prototype.onTouchCancel = function () {
    this.trackingClick = !1, this.targetElement = null;
  }, i.prototype.onMouse = function (e) {
    return this.targetElement ? e.forwardedTouchEvent ? !0 : e.cancelable ? !this.needsClick(this.targetElement) || this.cancelNextClick ? (e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.propagationStopped = !0, e.stopPropagation(), e.preventDefault(), !1) : !0 : !0 : !0;
  }, i.prototype.onClick = function (e) {
    var t;
    return this.trackingClick ? (this.targetElement = null, this.trackingClick = !1, !0) : e.target.type === 'submit' && e.detail === 0 ? !0 : (t = this.onMouse(e), t || (this.targetElement = null), t);
  }, i.prototype.destroy = function () {
    var e = this.layer;
    this.deviceIsAndroid && (e.removeEventListener('mouseover', this.onMouse, !0), e.removeEventListener('mousedown', this.onMouse, !0), e.removeEventListener('mouseup', this.onMouse, !0)), e.removeEventListener('click', this.onClick, !0), e.removeEventListener('touchstart', this.onTouchStart, !1), e.removeEventListener('touchmove', this.onTouchMove, !1), e.removeEventListener('touchend', this.onTouchEnd, !1), e.removeEventListener('touchcancel', this.onTouchCancel, !1);
  }, i.notNeeded = function (e) {
    var r;
    if (typeof t.ontouchstart == 'undefined')
      return !0;
    if (/Chrome\/[0-9]+/.test(navigator.userAgent)) {
      if (!i.prototype.deviceIsAndroid)
        return !0;
      r = n.querySelector('meta[name=viewport]');
      if (r && r.content.indexOf('user-scalable=no') !== -1)
        return !0;
    }
    return e.style.msTouchAction === 'none' ? !0 : !1;
  }, i.attach = function (e) {
    return new i(e);
  }, typeof define != 'undefined' && define.amd ? define(function () {
    return i;
  }) : typeof module != 'undefined' && module.exports ? (module.exports = i.attach, module.exports.FastClick = i) : t.FastClick = i, typeof i != 'undefined' && i.attach(n.body);
  var s = function (t, r) {
    return typeof t == 'string' ? r ? e(r.querySelectorAll(t)) : e(n.querySelectorAll(t)) : e(t, r);
  };
  t.matchMedia = t.matchMedia || function (e, t) {
    var n, r = e.documentElement, i = r.firstElementChild || r.firstChild, s = e.createElement('body'), o = e.createElement('div');
    return o.id = 'mq-test-1', o.style.cssText = 'position:absolute;top:-100em', s.style.background = 'none', s.appendChild(o), function (e) {
      return o.innerHTML = '&shy;<style media="' + e + '"> #mq-test-1 { width: 42px; }</style>', r.insertBefore(s, i), n = o.offsetWidth === 42, r.removeChild(s), {
        matches: n,
        media: e
      };
    };
  }(n), function (e) {
    function u() {
      n && (s(u), jQuery.fx.tick());
    }
    var n, r = 0, i = [
        'webkit',
        'moz'
      ], s = t.requestAnimationFrame, o = t.cancelAnimationFrame;
    for (; r < i.length && !s; r++)
      s = t[i[r] + 'RequestAnimationFrame'], o = o || t[i[r] + 'CancelAnimationFrame'] || t[i[r] + 'CancelRequestAnimationFrame'];
    s ? (t.requestAnimationFrame = s, t.cancelAnimationFrame = o, jQuery.fx.timer = function (e) {
      e() && jQuery.timers.push(e) && !n && (n = !0, u());
    }, jQuery.fx.stop = function () {
      n = !1;
    }) : (t.requestAnimationFrame = function (e, n) {
      var i = new Date().getTime(), s = Math.max(0, 16 - (i - r)), o = t.setTimeout(function () {
          e(i + s);
        }, s);
      return r = i + s, o;
    }, t.cancelAnimationFrame = function (e) {
      clearTimeout(e);
    });
  }(jQuery), t.Foundation = {
    name: 'Foundation',
    version: '5.0.0',
    media_queries: {
      small: s('.foundation-mq-small').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      medium: s('.foundation-mq-medium').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      large: s('.foundation-mq-large').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      xlarge: s('.foundation-mq-xlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      xxlarge: s('.foundation-mq-xxlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, '')
    },
    stylesheet: e('<style></style>').appendTo('head')[0].sheet,
    init: function (e, t, n, r, i) {
      var o, u = [
          e,
          n,
          r,
          i
        ], a = [];
      this.rtl = /rtl/i.test(s('html').attr('dir')), this.scope = e || this.scope;
      if (t && typeof t == 'string' && !/reflow/i.test(t))
        this.libs.hasOwnProperty(t) && a.push(this.init_lib(t, u));
      else
        for (var f in this.libs)
          a.push(this.init_lib(f, t));
      return e;
    },
    init_lib: function (e, t) {
      return this.libs.hasOwnProperty(e) ? (this.patch(this.libs[e]), t && t.hasOwnProperty(e) ? this.libs[e].init.apply(this.libs[e], [
        this.scope,
        t[e]
      ]) : this.libs[e].init.apply(this.libs[e], t)) : function () {
      };
    },
    patch: function (e) {
      e.scope = this.scope, e.data_options = this.lib_methods.data_options, e.bindings = this.lib_methods.bindings, e.S = s, e.rtl = this.rtl;
    },
    inherit: function (e, t) {
      var n = t.split(' ');
      for (var r = n.length - 1; r >= 0; r--)
        this.lib_methods.hasOwnProperty(n[r]) && (this.libs[e.name][n[r]] = this.lib_methods[n[r]]);
    },
    random_str: function (e) {
      var t = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
      e || (e = Math.floor(Math.random() * t.length));
      var n = '';
      for (var r = 0; r < e; r++)
        n += t[Math.floor(Math.random() * t.length)];
      return n;
    },
    libs: {},
    lib_methods: {
      throttle: function (e, t) {
        var n = null;
        return function () {
          var r = this, i = arguments;
          clearTimeout(n), n = setTimeout(function () {
            e.apply(r, i);
          }, t);
        };
      },
      data_options: function (t) {
        function a(e) {
          return !isNaN(e - 0) && e !== null && e !== '' && e !== !1 && e !== !0;
        }
        function f(t) {
          return typeof t == 'string' ? e.trim(t) : t;
        }
        var n = {}, r, i, s, o, u = t.data('options');
        if (typeof u == 'object')
          return u;
        s = (u || ':').split(';'), o = s.length;
        for (r = o - 1; r >= 0; r--)
          i = s[r].split(':'), /true/i.test(i[1]) && (i[1] = !0), /false/i.test(i[1]) && (i[1] = !1), a(i[1]) && (i[1] = parseInt(i[1], 10)), i.length === 2 && i[0].length > 0 && (n[f(i[0])] = f(i[1]));
        return n;
      },
      delay: function (e, t) {
        return setTimeout(e, t);
      },
      empty: function (e) {
        if (e.length && e.length > 0)
          return !1;
        if (e.length && e.length === 0)
          return !0;
        for (var t in e)
          if (hasOwnProperty.call(e, t))
            return !1;
        return !0;
      },
      register_media: function (t, n) {
        Foundation.media_queries[t] === r && (e('head').append('<meta class="' + n + '">'), Foundation.media_queries[t] = o(e('.' + n).css('font-family')));
      },
      addCustomRule: function (e, t) {
        if (t === r)
          Foundation.stylesheet.insertRule(e, Foundation.stylesheet.cssRules.length);
        else {
          var n = Foundation.media_queries[t];
          n !== r && Foundation.stylesheet.insertRule('@media ' + Foundation.media_queries[t] + '{ ' + e + ' }');
        }
      },
      loaded: function (e, t) {
        function n() {
          t(e[0]);
        }
        function r() {
          this.one('load', n);
          if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
            var e = this.attr('src'), t = e.match(/\?/) ? '&' : '?';
            t += 'random=' + new Date().getTime(), this.attr('src', e + t);
          }
        }
        if (!e.attr('src')) {
          n();
          return;
        }
        e[0].complete || e[0].readyState === 4 ? n() : r.call(e);
      },
      bindings: function (t, n) {
        var r = this, i = !s(this).data(this.name + '-init');
        if (typeof t == 'string')
          return this[t].call(this);
        s(this.scope).is('[data-' + this.name + ']') ? (s(this.scope).data(this.name + '-init', e.extend({}, this.settings, n || t, this.data_options(s(this.scope)))), i && this.events(this.scope)) : s('[data-' + this.name + ']', this.scope).each(function () {
          var i = !s(this).data(r.name + '-init');
          s(this).data(r.name + '-init', e.extend({}, r.settings, n || t, r.data_options(s(this)))), i && r.events(this);
        });
      }
    }
  }, e.fn.foundation = function () {
    var e = Array.prototype.slice.call(arguments, 0);
    return this.each(function () {
      return Foundation.init.apply(Foundation, [this].concat(e)), this;
    });
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.interchange = {
    name: 'interchange',
    version: '5.0.0',
    cache: {},
    images_loaded: !1,
    nodes_loaded: !1,
    settings: {
      load_attr: 'interchange',
      named_queries: {
        'default': Foundation.media_queries.small,
        small: Foundation.media_queries.small,
        medium: Foundation.media_queries.medium,
        large: Foundation.media_queries.large,
        xlarge: Foundation.media_queries.xlarge,
        xxlarge: Foundation.media_queries.xxlarge,
        landscape: 'only screen and (orientation: landscape)',
        portrait: 'only screen and (orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),only screen and (min--moz-device-pixel-ratio: 2),only screen and (-o-min-device-pixel-ratio: 2/1),only screen and (min-device-pixel-ratio: 2),only screen and (min-resolution: 192dpi),only screen and (min-resolution: 2dppx)'
      },
      directives: {
        replace: function (t, n, r) {
          if (/IMG/.test(t[0].nodeName)) {
            var i = t[0].src;
            if (new RegExp(n, 'i').test(i))
              return;
            return t[0].src = n, r(t[0].src);
          }
          var s = t.data('interchange-last-path');
          if (s == n)
            return;
          return e.get(n, function (e) {
            t.html(e), t.data('interchange-last-path', n), r();
          });
        }
      }
    },
    init: function (e, t, n) {
      Foundation.inherit(this, 'throttle'), this.data_attr = 'data-' + this.settings.load_attr, this.bindings(t, n), this.load('images'), this.load('nodes');
    },
    events: function () {
      var n = this;
      return e(t).off('.interchange').on('resize.fndtn.interchange', n.throttle(function () {
        n.resize.call(n);
      }, 50)), this;
    },
    resize: function () {
      var t = this.cache;
      if (!this.images_loaded || !this.nodes_loaded) {
        setTimeout(e.proxy(this.resize, this), 50);
        return;
      }
      for (var n in t)
        if (t.hasOwnProperty(n)) {
          var r = this.results(n, t[n]);
          r && this.settings.directives[r.scenario[1]](r.el, r.scenario[0], function () {
            if (arguments[0] instanceof Array)
              var e = arguments[0];
            else
              var e = Array.prototype.slice.call(arguments, 0);
            r.el.trigger(r.scenario[1], e);
          });
        }
    },
    results: function (e, t) {
      var n = t.length;
      if (n > 0) {
        var r = this.S('[data-uuid="' + e + '"]');
        for (var i = n - 1; i >= 0; i--) {
          var s, o = t[i][2];
          this.settings.named_queries.hasOwnProperty(o) ? s = matchMedia(this.settings.named_queries[o]) : s = matchMedia(o);
          if (s.matches)
            return {
              el: r,
              scenario: t[i]
            };
        }
      }
      return !1;
    },
    load: function (e, t) {
      return (typeof this['cached_' + e] == 'undefined' || t) && this['update_' + e](), this['cached_' + e];
    },
    update_images: function () {
      var e = this.S('img[' + this.data_attr + ']'), t = e.length, n = 0, r = this.data_attr;
      this.cache = {}, this.cached_images = [], this.images_loaded = t === 0;
      for (var i = t - 1; i >= 0; i--) {
        n++;
        if (e[i]) {
          var s = e[i].getAttribute(r) || '';
          s.length > 0 && this.cached_images.push(e[i]);
        }
        n === t && (this.images_loaded = !0, this.enhance('images'));
      }
      return this;
    },
    update_nodes: function () {
      var e = this.S('[' + this.data_attr + ']:not(img)'), t = e.length, n = 0, r = this.data_attr;
      this.cached_nodes = [], this.nodes_loaded = t === 0;
      for (var i = t - 1; i >= 0; i--) {
        n++;
        var s = e[i].getAttribute(r) || '';
        s.length > 0 && this.cached_nodes.push(e[i]), n === t && (this.nodes_loaded = !0, this.enhance('nodes'));
      }
      return this;
    },
    enhance: function (n) {
      var r = this['cached_' + n].length;
      for (var i = r - 1; i >= 0; i--)
        this.object(e(this['cached_' + n][i]));
      return e(t).trigger('resize');
    },
    parse_params: function (e, t, n) {
      return [
        this.trim(e),
        this.convert_directive(t),
        this.trim(n)
      ];
    },
    convert_directive: function (e) {
      var t = this.trim(e);
      return t.length > 0 ? t : 'replace';
    },
    object: function (e) {
      var t = this.parse_data_attr(e), n = [], r = t.length;
      if (r > 0)
        for (var i = r - 1; i >= 0; i--) {
          var s = t[i].split(/\((.*?)(\))$/);
          if (s.length > 1) {
            var o = s[0].split(','), u = this.parse_params(o[0], o[1], s[1]);
            n.push(u);
          }
        }
      return this.store(e, n);
    },
    uuid: function (e) {
      function n() {
        return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
      }
      var t = e || '-';
      return n() + n() + t + n() + t + n() + t + n() + t + n() + n() + n();
    },
    store: function (e, t) {
      var n = this.uuid(), r = e.data('uuid');
      return r ? this.cache[r] : (e.attr('data-uuid', n), this.cache[n] = t);
    },
    trim: function (t) {
      return typeof t == 'string' ? e.trim(t) : t;
    },
    parse_data_attr: function (e) {
      var t = e.data(this.settings.load_attr).split(/\[(.*?)\]/), n = t.length, r = [];
      for (var i = n - 1; i >= 0; i--)
        t[i].replace(/[\W\d]+/, '').length > 4 && r.push(t[i]);
      return r;
    },
    reflow: function () {
      this.load('images', !0), this.load('nodes', !0);
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.abide = {
    name: 'abide',
    version: '5.0.0',
    settings: {
      focus_on_invalid: !0,
      timeout: 1000,
      patterns: {
        alpha: /[a-zA-Z]+/,
        alpha_numeric: /[a-zA-Z0-9]+/,
        integer: /-?\d+/,
        number: /-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?/,
        password: /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
        cvv: /^([0-9]){3,4}$/,
        email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        url: /(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/,
        domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,
        datetime: /([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))/,
        date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))/,
        time: /(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}/,
        dateISO: /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/,
        month_day_year: /(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/,
        color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
      }
    },
    timer: null,
    init: function (e, t, n) {
      this.bindings(t, n);
    },
    events: function (t) {
      var n = this, r = e(t).attr('novalidate', 'novalidate'), i = r.data('abide-init');
      r.off('.abide').on('submit.fndtn.abide validate.fndtn.abide', function (t) {
        var r = /ajax/i.test(e(this).attr('data-abide'));
        return n.validate(e(this).find('input, textarea, select').get(), t, r);
      }).find('input, textarea, select').off('.abide').on('blur.fndtn.abide change.fndtn.abide', function (e) {
        n.validate([this], e);
      }).on('keydown.fndtn.abide', function (t) {
        var r = e(this).closest('form').data('abide-init');
        clearTimeout(n.timer), n.timer = setTimeout(function () {
          n.validate([this], t);
        }.bind(this), r.timeout);
      });
    },
    validate: function (t, n, r) {
      var i = this.parse_patterns(t), s = i.length, o = e(t[0]).closest('form'), u = /submit/.test(n.type);
      for (var a = 0; a < s; a++)
        if (!i[a] && (u || r))
          return this.settings.focus_on_invalid && t[a].focus(), o.trigger('invalid'), e(t[a]).closest('form').attr('data-invalid', ''), !1;
      return (u || r) && o.trigger('valid'), o.removeAttr('data-invalid'), r ? !1 : !0;
    },
    parse_patterns: function (e) {
      var t = e.length, n = [];
      for (var r = t - 1; r >= 0; r--)
        n.push(this.pattern(e[r]));
      return this.check_validation_and_apply_styles(n);
    },
    pattern: function (e) {
      var t = e.getAttribute('type'), n = typeof e.getAttribute('required') == 'string';
      if (this.settings.patterns.hasOwnProperty(t))
        return [
          e,
          this.settings.patterns[t],
          n
        ];
      var r = e.getAttribute('pattern') || '';
      return this.settings.patterns.hasOwnProperty(r) && r.length > 0 ? [
        e,
        this.settings.patterns[r],
        n
      ] : r.length > 0 ? [
        e,
        new RegExp(r),
        n
      ] : (r = /.*/, [
        e,
        r,
        n
      ]);
    },
    check_validation_and_apply_styles: function (t) {
      var n = t.length, r = [];
      for (var i = n - 1; i >= 0; i--) {
        var s = t[i][0], o = t[i][2], u = s.value, a = s.getAttribute('data-equalto'), f = s.type === 'radio', l = o ? s.value.length > 0 : !0;
        f && o ? r.push(this.valid_radio(s, o)) : a && o ? r.push(this.valid_equal(s, o)) : t[i][1].test(u) && l || !o && s.value.length < 1 ? (e(s).removeAttr('data-invalid').parent().removeClass('error'), r.push(!0)) : (e(s).attr('data-invalid', '').parent().addClass('error'), r.push(!1));
      }
      return r;
    },
    valid_radio: function (t, r) {
      var i = t.getAttribute('name'), s = n.getElementsByName(i), o = s.length, u = !1;
      for (var a = 0; a < o; a++)
        s[a].checked && (u = !0);
      for (var a = 0; a < o; a++)
        u ? e(s[a]).removeAttr('data-invalid').parent().removeClass('error') : e(s[a]).attr('data-invalid', '').parent().addClass('error');
      return u;
    },
    valid_equal: function (t, r) {
      var i = n.getElementById(t.getAttribute('data-equalto')).value, s = t.value, o = i === s;
      return o ? e(t).removeAttr('data-invalid').parent().removeClass('error') : e(t).attr('data-invalid', '').parent().addClass('error'), o;
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.dropdown = {
    name: 'dropdown',
    version: '5.0.0',
    settings: {
      active_class: 'open',
      is_hover: !1,
      opened: function () {
      },
      closed: function () {
      }
    },
    init: function (e, t, n) {
      Foundation.inherit(this, 'throttle'), this.bindings(t, n);
    },
    events: function (n) {
      var r = this;
      e(this.scope).off('.dropdown').on('click.fndtn.dropdown', '[data-dropdown]', function (t) {
        var n = e(this).data('dropdown-init');
        t.preventDefault(), (!n.is_hover || Modernizr.touch) && r.toggle(e(this));
      }).on('mouseenter.fndtn.dropdown', '[data-dropdown], [data-dropdown-content]', function (t) {
        var n = e(this);
        clearTimeout(r.timeout);
        if (n.data('dropdown'))
          var i = e('#' + n.data('dropdown')), s = n;
        else {
          var i = n;
          s = e('[data-dropdown=\'' + i.attr('id') + '\']');
        }
        var o = s.data('dropdown-init');
        o.is_hover && r.open.apply(r, [
          i,
          s
        ]);
      }).on('mouseleave.fndtn.dropdown', '[data-dropdown], [data-dropdown-content]', function (t) {
        var n = e(this);
        r.timeout = setTimeout(function () {
          if (n.data('dropdown')) {
            var t = n.data('dropdown-init');
            t.is_hover && r.close.call(r, e('#' + n.data('dropdown')));
          } else {
            var i = e('[data-dropdown="' + e(this).attr('id') + '"]'), t = i.data('dropdown-init');
            t.is_hover && r.close.call(r, n);
          }
        }.bind(this), 150);
      }).on('click.fndtn.dropdown', function (t) {
        var n = e(t.target).closest('[data-dropdown-content]');
        if (e(t.target).data('dropdown') || e(t.target).parent().data('dropdown'))
          return;
        if (!e(t.target).data('revealId') && n.length > 0 && (e(t.target).is('[data-dropdown-content]') || e.contains(n.first()[0], t.target))) {
          t.stopPropagation();
          return;
        }
        r.close.call(r, e('[data-dropdown-content]'));
      }).on('opened.fndtn.dropdown', '[data-dropdown-content]', this.settings.opened).on('closed.fndtn.dropdown', '[data-dropdown-content]', this.settings.closed), e(t).off('.dropdown').on('resize.fndtn.dropdown', r.throttle(function () {
        r.resize.call(r);
      }, 50)).trigger('resize');
    },
    close: function (t) {
      var n = this;
      t.each(function () {
        e(this).hasClass(n.settings.active_class) && (e(this).css(Foundation.rtl ? 'right' : 'left', '-99999px').removeClass(n.settings.active_class), e(this).trigger('closed'));
      });
    },
    open: function (e, t) {
      this.css(e.addClass(this.settings.active_class), t), e.trigger('opened');
    },
    toggle: function (t) {
      var n = e('#' + t.data('dropdown'));
      if (n.length === 0)
        return;
      this.close.call(this, e('[data-dropdown-content]').not(n)), n.hasClass(this.settings.active_class) ? this.close.call(this, n) : (this.close.call(this, e('[data-dropdown-content]')), this.open.call(this, n, t));
    },
    resize: function () {
      var t = e('[data-dropdown-content].open'), n = e('[data-dropdown=\'' + t.attr('id') + '\']');
      t.length && n.length && this.css(t, n);
    },
    css: function (n, r) {
      var i = n.offsetParent(), s = r.offset();
      s.top -= i.offset().top, s.left -= i.offset().left;
      if (this.small())
        n.css({
          position: 'absolute',
          width: '95%',
          'max-width': 'none',
          top: s.top + r.outerHeight()
        }), n.css(Foundation.rtl ? 'right' : 'left', '2.5%');
      else {
        if (!Foundation.rtl && e(t).width() > n.outerWidth() + r.offset().left) {
          var o = s.left;
          n.hasClass('right') && n.removeClass('right');
        } else {
          n.hasClass('right') || n.addClass('right');
          var o = s.left - (n.outerWidth() - r.outerWidth());
        }
        n.attr('style', '').css({
          position: 'absolute',
          top: s.top + r.outerHeight(),
          left: o
        });
      }
      return n;
    },
    small: function () {
      return matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches;
    },
    off: function () {
      e(this.scope).off('.fndtn.dropdown'), e('html, body').off('.fndtn.dropdown'), e(t).off('.fndtn.dropdown'), e('[data-dropdown-content]').off('.fndtn.dropdown'), this.settings.init = !1;
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.alert = {
    name: 'alert',
    version: '5.0.0',
    settings: {
      animation: 'fadeOut',
      speed: 300,
      callback: function () {
      }
    },
    init: function (e, t, n) {
      this.bindings(t, n);
    },
    events: function () {
      e(this.scope).off('.alert').on('click.fndtn.alert', '[data-alert] a.close', function (t) {
        var n = e(this).closest('[data-alert]'), r = n.data('alert-init');
        t.preventDefault(), n[r.animation](r.speed, function () {
          e(this).trigger('closed').remove(), r.callback();
        });
      });
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.magellan = {
    name: 'magellan',
    version: '5.0.0',
    settings: {
      active_class: 'active',
      threshold: 0
    },
    init: function (t, n, r) {
      this.fixed_magellan = e('[data-magellan-expedition]'), this.set_threshold(), this.last_destination = e('[data-magellan-destination]').last(), this.events();
    },
    events: function () {
      var n = this;
      e(this.scope).off('.magellan').on('arrival.fndtn.magellan', '[data-magellan-arrival]', function (t) {
        var r = e(this), i = r.closest('[data-magellan-expedition]'), s = i.attr('data-magellan-active-class') || n.settings.active_class;
        r.closest('[data-magellan-expedition]').find('[data-magellan-arrival]').not(r).removeClass(s), r.addClass(s);
      }), this.fixed_magellan.off('.magellan').on('update-position.fndtn.magellan', function () {
        var t = e(this);
      }).trigger('update-position'), e(t).off('.magellan').on('resize.fndtn.magellan', function () {
        this.fixed_magellan.trigger('update-position');
      }.bind(this)).on('scroll.fndtn.magellan', function () {
        var r = e(t).scrollTop();
        n.fixed_magellan.each(function () {
          var t = e(this);
          typeof t.data('magellan-top-offset') == 'undefined' && t.data('magellan-top-offset', t.offset().top), typeof t.data('magellan-fixed-position') == 'undefined' && t.data('magellan-fixed-position', !1);
          var i = r + n.settings.threshold > t.data('magellan-top-offset'), s = t.attr('data-magellan-top-offset');
          t.data('magellan-fixed-position') != i && (t.data('magellan-fixed-position', i), i ? (t.addClass('fixed'), t.css({
            position: 'fixed',
            top: 0
          })) : (t.removeClass('fixed'), t.css({
            position: '',
            top: ''
          })), i && typeof s != 'undefined' && s != 0 && t.css({
            position: 'fixed',
            top: s + 'px'
          }));
        });
      }), this.last_destination.length > 0 && e(t).on('scroll.fndtn.magellan', function (r) {
        var i = e(t).scrollTop(), s = i + e(t).height(), o = Math.ceil(n.last_destination.offset().top);
        e('[data-magellan-destination]').each(function () {
          var t = e(this), r = t.attr('data-magellan-destination'), u = t.offset().top - t.outerHeight(!0) - i;
          u <= n.settings.threshold && e('[data-magellan-arrival=\'' + r + '\']').trigger('arrival'), s >= e(n.scope).height() && o > i && o < s && e('[data-magellan-arrival]').last().trigger('arrival');
        });
      });
    },
    set_threshold: function () {
      typeof this.settings.threshold != 'number' && (this.settings.threshold = this.fixed_magellan.length > 0 ? this.fixed_magellan.outerHeight(!0) : 0);
    },
    off: function () {
      e(this.scope).off('.fndtn.magellan'), e(t).off('.fndtn.magellan');
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.reveal = {
    name: 'reveal',
    version: '5.0.0',
    locked: !1,
    settings: {
      animation: 'fadeAndPop',
      animation_speed: 250,
      close_on_background_click: !0,
      close_on_esc: !0,
      dismiss_modal_class: 'close-reveal-modal',
      bg_class: 'reveal-modal-bg',
      open: function () {
      },
      opened: function () {
      },
      close: function () {
      },
      closed: function () {
      },
      bg: e('.reveal-modal-bg'),
      css: {
        open: {
          opacity: 0,
          visibility: 'visible',
          display: 'block'
        },
        close: {
          opacity: 1,
          visibility: 'hidden',
          display: 'none'
        }
      }
    },
    init: function (e, t, n) {
      Foundation.inherit(this, 'delay'), this.bindings(t, n);
    },
    events: function (t) {
      var n = this;
      return e('[data-reveal-id]', this.scope).off('.reveal').on('click.fndtn.reveal', function (t) {
        t.preventDefault();
        if (!n.locked) {
          var r = e(this), i = r.data('reveal-ajax');
          n.locked = !0;
          if (typeof i == 'undefined')
            n.open.call(n, r);
          else {
            var s = i === !0 ? r.attr('href') : i;
            n.open.call(n, r, { url: s });
          }
        }
      }), e(this.scope).off('.reveal').on('click.fndtn.reveal', this.close_targets(), function (t) {
        t.preventDefault();
        if (!n.locked) {
          var r = e('[data-reveal].open').data('reveal-init'), i = e(t.target)[0] === e('.' + r.bg_class)[0];
          if (i && !r.close_on_background_click)
            return;
          n.locked = !0, n.close.call(n, i ? e('[data-reveal].open') : e(this).closest('[data-reveal]'));
        }
      }), e('[data-reveal]', this.scope).length > 0 ? e(this.scope).on('open.fndtn.reveal', this.settings.open).on('opened.fndtn.reveal', this.settings.opened).on('opened.fndtn.reveal', this.open_video).on('close.fndtn.reveal', this.settings.close).on('closed.fndtn.reveal', this.settings.closed).on('closed.fndtn.reveal', this.close_video) : e(this.scope).on('open.fndtn.reveal', '[data-reveal]', this.settings.open).on('opened.fndtn.reveal', '[data-reveal]', this.settings.opened).on('opened.fndtn.reveal', '[data-reveal]', this.open_video).on('close.fndtn.reveal', '[data-reveal]', this.settings.close).on('closed.fndtn.reveal', '[data-reveal]', this.settings.closed).on('closed.fndtn.reveal', '[data-reveal]', this.close_video), e('body').on('keyup.fndtn.reveal', function (t) {
        var n = e('[data-reveal].open'), r = n.data('reveal-init');
        t.which === 27 && r.close_on_esc && n.foundation('reveal', 'close');
      }), !0;
    },
    open: function (t, n) {
      if (t)
        if (typeof t.selector != 'undefined')
          var r = e('#' + t.data('reveal-id'));
        else {
          var r = e(this.scope);
          n = t;
        }
      else
        var r = e(this.scope);
      if (!r.hasClass('open')) {
        var i = e('[data-reveal].open');
        typeof r.data('css-top') == 'undefined' && r.data('css-top', parseInt(r.css('top'), 10)).data('offset', this.cache_offset(r)), r.trigger('open'), i.length < 1 && this.toggle_bg();
        if (typeof n == 'undefined' || !n.url)
          this.hide(i, this.settings.css.close), this.show(r, this.settings.css.open);
        else {
          var s = this, o = typeof n.success != 'undefined' ? n.success : null;
          e.extend(n, {
            success: function (t, n, u) {
              e.isFunction(o) && o(t, n, u), r.html(t), e(r).foundation('section', 'reflow'), s.hide(i, s.settings.css.close), s.show(r, s.settings.css.open);
            }
          }), e.ajax(n);
        }
      }
    },
    close: function (t) {
      var t = t && t.length ? t : e(this.scope), n = e('[data-reveal].open');
      n.length > 0 && (this.locked = !0, t.trigger('close'), this.toggle_bg(), this.hide(n, this.settings.css.close));
    },
    close_targets: function () {
      var e = '.' + this.settings.dismiss_modal_class;
      return this.settings.close_on_background_click ? e + ', .' + this.settings.bg_class : e;
    },
    toggle_bg: function () {
      e('.' + this.settings.bg_class).length === 0 && (this.settings.bg = e('<div />', { 'class': this.settings.bg_class }).appendTo('body')), this.settings.bg.filter(':visible').length > 0 ? this.hide(this.settings.bg) : this.show(this.settings.bg);
    },
    show: function (n, r) {
      if (r) {
        if (n.parent('body').length === 0) {
          var i = n.wrap('<div style="display: none;" />').parent();
          n.on('closed.fndtn.reveal.wrapped', function () {
            n.detach().appendTo(i), n.unwrap().unbind('closed.fndtn.reveal.wrapped');
          }), n.detach().appendTo('body');
        }
        if (/pop/i.test(this.settings.animation)) {
          r.top = e(t).scrollTop() - n.data('offset') + 'px';
          var s = {
              top: e(t).scrollTop() + n.data('css-top') + 'px',
              opacity: 1
            };
          return this.delay(function () {
            return n.css(r).animate(s, this.settings.animation_speed, 'linear', function () {
              this.locked = !1, n.trigger('opened');
            }.bind(this)).addClass('open');
          }.bind(this), this.settings.animation_speed / 2);
        }
        if (/fade/i.test(this.settings.animation)) {
          var s = { opacity: 1 };
          return this.delay(function () {
            return n.css(r).animate(s, this.settings.animation_speed, 'linear', function () {
              this.locked = !1, n.trigger('opened');
            }.bind(this)).addClass('open');
          }.bind(this), this.settings.animation_speed / 2);
        }
        return n.css(r).show().css({ opacity: 1 }).addClass('open').trigger('opened');
      }
      return /fade/i.test(this.settings.animation) ? n.fadeIn(this.settings.animation_speed / 2) : n.show();
    },
    hide: function (n, r) {
      if (r) {
        if (/pop/i.test(this.settings.animation)) {
          var i = {
              top: -e(t).scrollTop() - n.data('offset') + 'px',
              opacity: 0
            };
          return this.delay(function () {
            return n.animate(i, this.settings.animation_speed, 'linear', function () {
              this.locked = !1, n.css(r).trigger('closed');
            }.bind(this)).removeClass('open');
          }.bind(this), this.settings.animation_speed / 2);
        }
        if (/fade/i.test(this.settings.animation)) {
          var i = { opacity: 0 };
          return this.delay(function () {
            return n.animate(i, this.settings.animation_speed, 'linear', function () {
              this.locked = !1, n.css(r).trigger('closed');
            }.bind(this)).removeClass('open');
          }.bind(this), this.settings.animation_speed / 2);
        }
        return n.hide().css(r).removeClass('open').trigger('closed');
      }
      return /fade/i.test(this.settings.animation) ? n.fadeOut(this.settings.animation_speed / 2) : n.hide();
    },
    close_video: function (t) {
      var n = e(this).find('.flex-video'), r = n.find('iframe');
      r.length > 0 && (r.attr('data-src', r[0].src), r.attr('src', 'about:blank'), n.hide());
    },
    open_video: function (t) {
      var n = e(this).find('.flex-video'), i = n.find('iframe');
      if (i.length > 0) {
        var s = i.attr('data-src');
        if (typeof s == 'string')
          i[0].src = i.attr('data-src');
        else {
          var o = i[0].src;
          i[0].src = r, i[0].src = o;
        }
        n.show();
      }
    },
    cache_offset: function (e) {
      var t = e.show().height() + parseInt(e.css('top'), 10);
      return e.hide(), t;
    },
    off: function () {
      e(this.scope).off('.fndtn.reveal');
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.tooltip = {
    name: 'tooltip',
    version: '5.0.0',
    settings: {
      additional_inheritable_classes: [],
      tooltip_class: '.tooltip',
      append_to: 'body',
      touch_close_text: 'Tap To Close',
      disable_for_touch: !1,
      tip_template: function (e, t) {
        return '<span data-selector="' + e + '" class="' + Foundation.libs.tooltip.settings.tooltip_class.substring(1) + '">' + t + '<span class="nub"></span></span>';
      }
    },
    cache: {},
    init: function (e, t, n) {
      this.bindings(t, n);
    },
    events: function () {
      var t = this;
      Modernizr.touch ? e(this.scope).off('.tooltip').on('click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip', '[data-tooltip]', function (n) {
        var r = e.extend({}, t.settings, t.data_options(e(this)));
        r.disable_for_touch || (n.preventDefault(), e(r.tooltip_class).hide(), t.showOrCreateTip(e(this)));
      }).on('click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip', this.settings.tooltip_class, function (t) {
        t.preventDefault(), e(this).fadeOut(150);
      }) : e(this.scope).off('.tooltip').on('mouseenter.fndtn.tooltip mouseleave.fndtn.tooltip', '[data-tooltip]', function (n) {
        var r = e(this);
        /enter|over/i.test(n.type) ? t.showOrCreateTip(r) : (n.type === 'mouseout' || n.type === 'mouseleave') && t.hide(r);
      });
    },
    showOrCreateTip: function (e) {
      var t = this.getTip(e);
      return t && t.length > 0 ? this.show(e) : this.create(e);
    },
    getTip: function (t) {
      var n = this.selector(t), r = null;
      return n && (r = e('span[data-selector="' + n + '"]' + this.settings.tooltip_class)), typeof r == 'object' ? r : !1;
    },
    selector: function (e) {
      var t = e.attr('id'), n = e.attr('data-tooltip') || e.attr('data-selector');
      return (t && t.length < 1 || !t) && typeof n != 'string' && (n = 'tooltip' + Math.random().toString(36).substring(7), e.attr('data-selector', n)), t && t.length > 0 ? t : n;
    },
    create: function (t) {
      var n = e(this.settings.tip_template(this.selector(t), e('<div></div>').html(t.attr('title')).html())), r = this.inheritable_classes(t);
      n.addClass(r).appendTo(this.settings.append_to), Modernizr.touch && n.append('<span class="tap-to-close">' + this.settings.touch_close_text + '</span>'), t.removeAttr('title').attr('title', ''), this.show(t);
    },
    reposition: function (t, n, r) {
      var i, s, o, u, a, f;
      n.css('visibility', 'hidden').show(), i = t.data('width'), s = n.children('.nub'), o = s.outerHeight(), u = s.outerHeight(), f = function (e, t, n, r, i, s) {
        return e.css({
          top: t ? t : 'auto',
          bottom: r ? r : 'auto',
          left: i ? i : 'auto',
          right: n ? n : 'auto',
          width: s ? s : 'auto'
        }).end();
      }, f(n, t.offset().top + t.outerHeight() + 10, 'auto', 'auto', t.offset().left, i);
      if (this.small())
        f(n, t.offset().top + t.outerHeight() + 10, 'auto', 'auto', 12.5, e(this.scope).width()), n.addClass('tip-override'), f(s, -o, 'auto', 'auto', t.offset().left);
      else {
        var l = t.offset().left;
        Foundation.rtl && (l = t.offset().left + t.offset().width - n.outerWidth()), f(n, t.offset().top + t.outerHeight() + 10, 'auto', 'auto', l, i), n.removeClass('tip-override'), r && r.indexOf('tip-top') > -1 ? f(n, t.offset().top - n.outerHeight(), 'auto', 'auto', l, i).removeClass('tip-override') : r && r.indexOf('tip-left') > -1 ? f(n, t.offset().top + t.outerHeight() / 2 - o * 2.5, 'auto', 'auto', t.offset().left - n.outerWidth() - o, i).removeClass('tip-override') : r && r.indexOf('tip-right') > -1 && f(n, t.offset().top + t.outerHeight() / 2 - o * 2.5, 'auto', 'auto', t.offset().left + t.outerWidth() + o, i).removeClass('tip-override');
      }
      n.css('visibility', 'visible').hide();
    },
    small: function () {
      return matchMedia(Foundation.media_queries.small).matches;
    },
    inheritable_classes: function (t) {
      var n = [
          'tip-top',
          'tip-left',
          'tip-bottom',
          'tip-right',
          'noradius'
        ].concat(this.settings.additional_inheritable_classes), r = t.attr('class'), i = r ? e.map(r.split(' '), function (t, r) {
          if (e.inArray(t, n) !== -1)
            return t;
        }).join(' ') : '';
      return e.trim(i);
    },
    show: function (e) {
      var t = this.getTip(e);
      this.reposition(e, t, e.attr('class')), t.fadeIn(150);
    },
    hide: function (e) {
      var t = this.getTip(e);
      t.fadeOut(150);
    },
    reload: function () {
      var t = e(this);
      return t.data('fndtn-tooltips') ? t.foundationTooltips('destroy').foundationTooltips('init') : t.foundationTooltips('init');
    },
    off: function () {
      e(this.scope).off('.fndtn.tooltip'), e(this.settings.tooltip_class).each(function (t) {
        e('[data-tooltip]').get(t).attr('title', e(this).text());
      }).remove();
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.tab = {
    name: 'tab',
    version: '5.0.1',
    settings: { active_class: 'active' },
    init: function (e, t, n) {
      this.bindings(t, n);
    },
    events: function () {
      e(this.scope).off('.tab').on('click.fndtn.tab', '[data-tab] > dd > a', function (t) {
        t.preventDefault();
        var n = e(this).parent(), r = e('#' + this.href.split('#')[1]), i = n.siblings(), s = n.closest('[data-tab]').data('tab-init');
        n.addClass(s.active_class), i.removeClass(s.active_class), r.siblings().removeClass(s.active_class).end().addClass(s.active_class);
      });
    },
    off: function () {
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.clearing = {
    name: 'clearing',
    version: '5.0.0',
    settings: {
      templates: { viewing: '<a href="#" class="clearing-close">&times;</a><div class="visible-img" style="display: none"><img src="//:0"><p class="clearing-caption"></p><a href="#" class="clearing-main-prev"><span></span></a><a href="#" class="clearing-main-next"><span></span></a></div>' },
      close_selectors: '.clearing-close',
      init: !1,
      locked: !1
    },
    init: function (t, n, r) {
      var i = this;
      Foundation.inherit(this, 'throttle loaded'), this.bindings(n, r), e(this.scope).is('[data-clearing]') ? this.assemble(e('li', this.scope)) : e('[data-clearing]', this.scope).each(function () {
        i.assemble(e('li', this));
      });
    },
    events: function (n) {
      var r = this;
      e(this.scope).off('.clearing').on('click.fndtn.clearing', 'ul[data-clearing] li', function (t, n, i) {
        var n = n || e(this), i = i || n, s = n.next('li'), o = n.closest('[data-clearing]').data('clearing-init'), u = e(t.target);
        t.preventDefault(), o || (r.init(), o = n.closest('[data-clearing]').data('clearing-init')), i.hasClass('visible') && n[0] === i[0] && s.length > 0 && r.is_open(n) && (i = s, u = e('img', i)), r.open(u, n, i), r.update_paddles(i);
      }).on('click.fndtn.clearing', '.clearing-main-next', function (e) {
        r.nav(e, 'next');
      }).on('click.fndtn.clearing', '.clearing-main-prev', function (e) {
        r.nav(e, 'prev');
      }).on('click.fndtn.clearing', this.settings.close_selectors, function (e) {
        Foundation.libs.clearing.close(e, this);
      }).on('keydown.fndtn.clearing', function (e) {
        r.keydown(e);
      }), e(t).off('.clearing').on('resize.fndtn.clearing', function () {
        r.resize();
      }), this.swipe_events(n);
    },
    swipe_events: function (t) {
      var n = this;
      e(this.scope).on('touchstart.fndtn.clearing', '.visible-img', function (t) {
        t.touches || (t = t.originalEvent);
        var n = {
            start_page_x: t.touches[0].pageX,
            start_page_y: t.touches[0].pageY,
            start_time: new Date().getTime(),
            delta_x: 0,
            is_scrolling: r
          };
        e(this).data('swipe-transition', n), t.stopPropagation();
      }).on('touchmove.fndtn.clearing', '.visible-img', function (t) {
        t.touches || (t = t.originalEvent);
        if (t.touches.length > 1 || t.scale && t.scale !== 1)
          return;
        var r = e(this).data('swipe-transition');
        typeof r == 'undefined' && (r = {}), r.delta_x = t.touches[0].pageX - r.start_page_x, typeof r.is_scrolling == 'undefined' && (r.is_scrolling = !!(r.is_scrolling || Math.abs(r.delta_x) < Math.abs(t.touches[0].pageY - r.start_page_y)));
        if (!r.is_scrolling && !r.active) {
          t.preventDefault();
          var i = r.delta_x < 0 ? 'next' : 'prev';
          r.active = !0, n.nav(t, i);
        }
      }).on('touchend.fndtn.clearing', '.visible-img', function (t) {
        e(this).data('swipe-transition', {}), t.stopPropagation();
      });
    },
    assemble: function (t) {
      var n = t.parent();
      if (n.parent().hasClass('carousel'))
        return;
      n.after('<div id="foundationClearingHolder"></div>');
      var r = e('#foundationClearingHolder'), i = n.data('clearing-init'), s = n.detach(), o = {
          grid: '<div class="carousel">' + s[0].outerHTML + '</div>',
          viewing: i.templates.viewing
        }, u = '<div class="clearing-assembled"><div>' + o.viewing + o.grid + '</div></div>';
      return r.after(u).remove();
    },
    open: function (t, n, r) {
      var i = r.closest('.clearing-assembled'), s = e('div', i).first(), o = e('.visible-img', s), u = e('img', o).not(t);
      this.locked() || (u.attr('src', this.load(t)).css('visibility', 'hidden'), this.loaded(u, function () {
        u.css('visibility', 'visible'), i.addClass('clearing-blackout'), s.addClass('clearing-container'), o.show(), this.fix_height(r).caption(e('.clearing-caption', o), t).center(u).shift(n, r, function () {
          r.siblings().removeClass('visible'), r.addClass('visible');
        });
      }.bind(this)));
    },
    close: function (t, n) {
      t.preventDefault();
      var r = function (e) {
          return /blackout/.test(e.selector) ? e : e.closest('.clearing-blackout');
        }(e(n)), i, s;
      return n === t.target && r && (i = e('div', r).first(), s = e('.visible-img', i), this.settings.prev_index = 0, e('ul[data-clearing]', r).attr('style', '').closest('.clearing-blackout').removeClass('clearing-blackout'), i.removeClass('clearing-container'), s.hide()), !1;
    },
    is_open: function (e) {
      return e.parent().prop('style').length > 0;
    },
    keydown: function (t) {
      var n = e('ul[data-clearing]', '.clearing-blackout');
      t.which === 39 && this.go(n, 'next'), t.which === 37 && this.go(n, 'prev'), t.which === 27 && e('a.clearing-close').trigger('click');
    },
    nav: function (t, n) {
      var r = e('ul[data-clearing]', '.clearing-blackout');
      t.preventDefault(), this.go(r, n);
    },
    resize: function () {
      var t = e('img', '.clearing-blackout .visible-img');
      t.length && this.center(t);
    },
    fix_height: function (t) {
      var n = t.parent().children(), r = this;
      return n.each(function () {
        var t = e(this), n = t.find('img');
        t.height() > n.outerHeight() && t.addClass('fix-height');
      }).closest('ul').width(n.length * 100 + '%'), this;
    },
    update_paddles: function (t) {
      var n = t.closest('.carousel').siblings('.visible-img');
      t.next().length > 0 ? e('.clearing-main-next', n).removeClass('disabled') : e('.clearing-main-next', n).addClass('disabled'), t.prev().length > 0 ? e('.clearing-main-prev', n).removeClass('disabled') : e('.clearing-main-prev', n).addClass('disabled');
    },
    center: function (e) {
      return this.rtl ? e.css({
        marginRight: -(e.outerWidth() / 2),
        marginTop: -(e.outerHeight() / 2)
      }) : e.css({
        marginLeft: -(e.outerWidth() / 2),
        marginTop: -(e.outerHeight() / 2)
      }), this;
    },
    load: function (e) {
      if (e[0].nodeName === 'A')
        var t = e.attr('href');
      else
        var t = e.parent().attr('href');
      return this.preload(e), t ? t : e.attr('src');
    },
    preload: function (e) {
      this.img(e.closest('li').next()).img(e.closest('li').prev());
    },
    img: function (t) {
      if (t.length) {
        var n = new Image(), r = e('a', t);
        r.length ? n.src = r.attr('href') : n.src = e('img', t).attr('src');
      }
      return this;
    },
    caption: function (e, t) {
      var n = t.data('caption');
      return n ? e.html(n).show() : e.text('').hide(), this;
    },
    go: function (t, n) {
      var r = e('.visible', t), i = r[n]();
      i.length && e('img', i).trigger('click', [
        r,
        i
      ]);
    },
    shift: function (e, t, n) {
      var r = t.parent(), i = this.settings.prev_index || t.index(), s = this.direction(r, e, t), o = parseInt(r.css('left'), 10), u = t.outerWidth(), a;
      t.index() !== i && !/skip/.test(s) ? /left/.test(s) ? (this.lock(), r.animate({ left: o + u }, 300, this.unlock())) : /right/.test(s) && (this.lock(), r.animate({ left: o - u }, 300, this.unlock())) : /skip/.test(s) && (a = t.index() - this.settings.up_count, this.lock(), a > 0 ? r.animate({ left: -(a * u) }, 300, this.unlock()) : r.animate({ left: 0 }, 300, this.unlock())), n();
    },
    direction: function (t, n, r) {
      var i = e('li', t), s = i.outerWidth() + i.outerWidth() / 4, o = Math.floor(e('.clearing-container').outerWidth() / s) - 1, u = i.index(r), a;
      return this.settings.up_count = o, this.adjacent(this.settings.prev_index, u) ? u > o && u > this.settings.prev_index ? a = 'right' : u > o - 1 && u <= this.settings.prev_index ? a = 'left' : a = !1 : a = 'skip', this.settings.prev_index = u, a;
    },
    adjacent: function (e, t) {
      for (var n = t + 1; n >= t - 1; n--)
        if (n === e)
          return !0;
      return !1;
    },
    lock: function () {
      this.settings.locked = !0;
    },
    unlock: function () {
      this.settings.locked = !1;
    },
    locked: function () {
      return this.settings.locked;
    },
    off: function () {
      e(this.scope).off('.fndtn.clearing'), e(t).off('.fndtn.clearing');
    },
    reflow: function () {
      this.init();
    }
  };
}(jQuery, this, this.document), function (e) {
  typeof define == 'function' && define.amd ? define(['jquery'], e) : e(jQuery);
}(function (e) {
  function n(e) {
    if (i.raw)
      return e;
    try {
      return decodeURIComponent(e.replace(t, ' '));
    } catch (n) {
    }
  }
  function r(e) {
    e.indexOf('"') === 0 && (e = e.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')), e = n(e);
    try {
      return i.json ? JSON.parse(e) : e;
    } catch (t) {
    }
  }
  var t = /\+/g, i = e.cookie = function (t, s, o) {
      if (s !== undefined) {
        o = e.extend({}, i.defaults, o);
        if (typeof o.expires == 'number') {
          var u = o.expires, a = o.expires = new Date();
          a.setDate(a.getDate() + u);
        }
        return s = i.json ? JSON.stringify(s) : String(s), document.cookie = [
          i.raw ? t : encodeURIComponent(t),
          '=',
          i.raw ? s : encodeURIComponent(s),
          o.expires ? '; expires=' + o.expires.toUTCString() : '',
          o.path ? '; path=' + o.path : '',
          o.domain ? '; domain=' + o.domain : '',
          o.secure ? '; secure' : ''
        ].join('');
      }
      var f = t ? undefined : {}, l = document.cookie ? document.cookie.split('; ') : [];
      for (var c = 0, h = l.length; c < h; c++) {
        var p = l[c].split('='), d = n(p.shift()), v = p.join('=');
        if (t && t === d) {
          f = r(v);
          break;
        }
        !t && (v = r(v)) !== undefined && (f[d] = v);
      }
      return f;
    };
  i.defaults = {}, e.removeCookie = function (t, n) {
    return e.cookie(t) !== undefined ? (e.cookie(t, '', e.extend({}, n, { expires: -1 })), !0) : !1;
  };
}), function (e, t, n, r) {
  'use strict';
  var i = i || !1;
  Foundation.libs.joyride = {
    name: 'joyride',
    version: '5.0.0',
    defaults: {
      expose: !1,
      modal: !0,
      tip_location: 'bottom',
      nub_position: 'auto',
      scroll_speed: 1500,
      scroll_animation: 'linear',
      timer: 0,
      start_timer_on_click: !0,
      start_offset: 0,
      next_button: !0,
      tip_animation: 'fade',
      pause_after: [],
      exposed: [],
      tip_animation_fade_speed: 300,
      cookie_monster: !1,
      cookie_name: 'joyride',
      cookie_domain: !1,
      cookie_expires: 365,
      tip_container: 'body',
      tip_location_patterns: {
        top: ['bottom'],
        bottom: [],
        left: [
          'right',
          'top',
          'bottom'
        ],
        right: [
          'left',
          'top',
          'bottom'
        ]
      },
      post_ride_callback: function () {
      },
      post_step_callback: function () {
      },
      pre_step_callback: function () {
      },
      pre_ride_callback: function () {
      },
      post_expose_callback: function () {
      },
      template: {
        link: '<a href="#close" class="joyride-close-tip">&times;</a>',
        timer: '<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',
        tip: '<div class="joyride-tip-guide"><span class="joyride-nub"></span></div>',
        wrapper: '<div class="joyride-content-wrapper"></div>',
        button: '<a href="#" class="small button joyride-next-tip"></a>',
        modal: '<div class="joyride-modal-bg"></div>',
        expose: '<div class="joyride-expose-wrapper"></div>',
        expose_cover: '<div class="joyride-expose-cover"></div>'
      },
      expose_add_class: ''
    },
    init: function (e, t, n) {
      Foundation.inherit(this, 'throttle delay'), this.settings = this.defaults, this.bindings(t, n);
    },
    events: function () {
      var n = this;
      e(this.scope).off('.joyride').on('click.fndtn.joyride', '.joyride-next-tip, .joyride-modal-bg', function (e) {
        e.preventDefault(), this.settings.$li.next().length < 1 ? this.end() : this.settings.timer > 0 ? (clearTimeout(this.settings.automate), this.hide(), this.show(), this.startTimer()) : (this.hide(), this.show());
      }.bind(this)).on('click.fndtn.joyride', '.joyride-close-tip', function (e) {
        e.preventDefault(), this.end();
      }.bind(this)), e(t).off('.joyride').on('resize.fndtn.joyride', n.throttle(function () {
        if (e('[data-joyride]').length > 0 && n.settings.$next_tip) {
          if (n.settings.exposed.length > 0) {
            var t = e(n.settings.exposed);
            t.each(function () {
              var t = e(this);
              n.un_expose(t), n.expose(t);
            });
          }
          n.is_phone() ? n.pos_phone() : n.pos_default(!1, !0);
        }
      }, 100));
    },
    start: function () {
      var t = this, n = e('[data-joyride]', this.scope), r = [
          'timer',
          'scrollSpeed',
          'startOffset',
          'tipAnimationFadeSpeed',
          'cookieExpires'
        ], i = r.length;
      if (!n.length > 0)
        return;
      this.settings.init || this.events(), this.settings = n.data('joyride-init'), this.settings.$content_el = n, this.settings.$body = e(this.settings.tip_container), this.settings.body_offset = e(this.settings.tip_container).position(), this.settings.$tip_content = this.settings.$content_el.find('> li'), this.settings.paused = !1, this.settings.attempts = 0, typeof e.cookie != 'function' && (this.settings.cookie_monster = !1);
      if (!this.settings.cookie_monster || this.settings.cookie_monster && e.cookie(this.settings.cookie_name) === null)
        this.settings.$tip_content.each(function (n) {
          var s = e(this);
          this.settings = e.extend({}, t.defaults, t.data_options(s));
          for (var o = i - 1; o >= 0; o--)
            t.settings[r[o]] = parseInt(t.settings[r[o]], 10);
          t.create({
            $li: s,
            index: n
          });
        }), !this.settings.start_timer_on_click && this.settings.timer > 0 ? (this.show('init'), this.startTimer()) : this.show('init');
    },
    resume: function () {
      this.set_li(), this.show();
    },
    tip_template: function (t) {
      var n, r;
      return t.tip_class = t.tip_class || '', n = e(this.settings.template.tip).addClass(t.tip_class), r = e.trim(e(t.li).html()) + this.button_text(t.button_text) + this.settings.template.link + this.timer_instance(t.index), n.append(e(this.settings.template.wrapper)), n.first().attr('data-index', t.index), e('.joyride-content-wrapper', n).append(r), n[0];
    },
    timer_instance: function (t) {
      var n;
      return t === 0 && this.settings.start_timer_on_click && this.settings.timer > 0 || this.settings.timer === 0 ? n = '' : n = e(this.settings.template.timer)[0].outerHTML, n;
    },
    button_text: function (t) {
      return this.settings.next_button ? (t = e.trim(t) || 'Next', t = e(this.settings.template.button).append(t)[0].outerHTML) : t = '', t;
    },
    create: function (t) {
      var n = t.$li.attr('data-button') || t.$li.attr('data-text'), r = t.$li.attr('class'), i = e(this.tip_template({
          tip_class: r,
          index: t.index,
          button_text: n,
          li: t.$li
        }));
      e(this.settings.tip_container).append(i);
    },
    show: function (t) {
      var n = null;
      this.settings.$li === r || e.inArray(this.settings.$li.index(), this.settings.pause_after) === -1 ? (this.settings.paused ? this.settings.paused = !1 : this.set_li(t), this.settings.attempts = 0, this.settings.$li.length && this.settings.$target.length > 0 ? (t && (this.settings.pre_ride_callback(this.settings.$li.index(), this.settings.$next_tip), this.settings.modal && this.show_modal()), this.settings.pre_step_callback(this.settings.$li.index(), this.settings.$next_tip), this.settings.modal && this.settings.expose && this.expose(), this.settings.tip_settings = e.extend({}, this.settings, this.data_options(this.settings.$li)), this.settings.timer = parseInt(this.settings.timer, 10), this.settings.tip_settings.tip_location_pattern = this.settings.tip_location_patterns[this.settings.tip_settings.tip_location], /body/i.test(this.settings.$target.selector) || this.scroll_to(), this.is_phone() ? this.pos_phone(!0) : this.pos_default(!0), n = this.settings.$next_tip.find('.joyride-timer-indicator'), /pop/i.test(this.settings.tip_animation) ? (n.width(0), this.settings.timer > 0 ? (this.settings.$next_tip.show(), this.delay(function () {
        n.animate({ width: n.parent().width() }, this.settings.timer, 'linear');
      }.bind(this), this.settings.tip_animation_fade_speed)) : this.settings.$next_tip.show()) : /fade/i.test(this.settings.tip_animation) && (n.width(0), this.settings.timer > 0 ? (this.settings.$next_tip.fadeIn(this.settings.tip_animation_fade_speed).show(), this.delay(function () {
        n.animate({ width: n.parent().width() }, this.settings.timer, 'linear');
      }.bind(this), this.settings.tip_animation_fadeSpeed)) : this.settings.$next_tip.fadeIn(this.settings.tip_animation_fade_speed)), this.settings.$current_tip = this.settings.$next_tip) : this.settings.$li && this.settings.$target.length < 1 ? this.show() : this.end()) : this.settings.paused = !0;
    },
    is_phone: function () {
      return matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches;
    },
    hide: function () {
      this.settings.modal && this.settings.expose && this.un_expose(), this.settings.modal || e('.joyride-modal-bg').hide(), this.settings.$current_tip.css('visibility', 'hidden'), setTimeout(e.proxy(function () {
        this.hide(), this.css('visibility', 'visible');
      }, this.settings.$current_tip), 0), this.settings.post_step_callback(this.settings.$li.index(), this.settings.$current_tip);
    },
    set_li: function (e) {
      e ? (this.settings.$li = this.settings.$tip_content.eq(this.settings.start_offset), this.set_next_tip(), this.settings.$current_tip = this.settings.$next_tip) : (this.settings.$li = this.settings.$li.next(), this.set_next_tip()), this.set_target();
    },
    set_next_tip: function () {
      this.settings.$next_tip = e('.joyride-tip-guide').eq(this.settings.$li.index()), this.settings.$next_tip.data('closed', '');
    },
    set_target: function () {
      var t = this.settings.$li.attr('data-class'), r = this.settings.$li.attr('data-id'), i = function () {
          return r ? e(n.getElementById(r)) : t ? e('.' + t).first() : e('body');
        };
      this.settings.$target = i();
    },
    scroll_to: function () {
      var n, r;
      n = e(t).height() / 2, r = Math.ceil(this.settings.$target.offset().top - n + this.settings.$next_tip.outerHeight()), r > 0 && e('html, body').animate({ scrollTop: r }, this.settings.scroll_speed, 'swing');
    },
    paused: function () {
      return e.inArray(this.settings.$li.index() + 1, this.settings.pause_after) === -1;
    },
    restart: function () {
      this.hide(), this.settings.$li = r, this.show('init');
    },
    pos_default: function (n, r) {
      var i = Math.ceil(e(t).height() / 2), s = this.settings.$next_tip.offset(), o = this.settings.$next_tip.find('.joyride-nub'), u = Math.ceil(o.outerWidth() / 2), a = Math.ceil(o.outerHeight() / 2), f = n || !1;
      f && (this.settings.$next_tip.css('visibility', 'hidden'), this.settings.$next_tip.show()), typeof r == 'undefined' && (r = !1);
      if (!/body/i.test(this.settings.$target.selector)) {
        if (this.bottom()) {
          var l = this.settings.$target.offset().left;
          Foundation.rtl && (l = this.settings.$target.offset().width - this.settings.$next_tip.width() + l), this.settings.$next_tip.css({
            top: this.settings.$target.offset().top + a + this.settings.$target.outerHeight(),
            left: l
          }), this.nub_position(o, this.settings.tip_settings.nub_position, 'top');
        } else if (this.top()) {
          var l = this.settings.$target.offset().left;
          Foundation.rtl && (l = this.settings.$target.offset().width - this.settings.$next_tip.width() + l), this.settings.$next_tip.css({
            top: this.settings.$target.offset().top - this.settings.$next_tip.outerHeight() - a,
            left: l
          }), this.nub_position(o, this.settings.tip_settings.nub_position, 'bottom');
        } else
          this.right() ? (this.settings.$next_tip.css({
            top: this.settings.$target.offset().top,
            left: this.outerWidth(this.settings.$target) + this.settings.$target.offset().left + u
          }), this.nub_position(o, this.settings.tip_settings.nub_position, 'left')) : this.left() && (this.settings.$next_tip.css({
            top: this.settings.$target.offset().top,
            left: this.settings.$target.offset().left - this.outerWidth(this.settings.$next_tip) - u
          }), this.nub_position(o, this.settings.tip_settings.nub_position, 'right'));
        !this.visible(this.corners(this.settings.$next_tip)) && this.settings.attempts < this.settings.tip_settings.tip_location_pattern.length && (o.removeClass('bottom').removeClass('top').removeClass('right').removeClass('left'), this.settings.tip_settings.tip_location = this.settings.tip_settings.tip_location_pattern[this.settings.attempts], this.settings.attempts++, this.pos_default());
      } else
        this.settings.$li.length && this.pos_modal(o);
      f && (this.settings.$next_tip.hide(), this.settings.$next_tip.css('visibility', 'visible'));
    },
    pos_phone: function (t) {
      var n = this.settings.$next_tip.outerHeight(), r = this.settings.$next_tip.offset(), i = this.settings.$target.outerHeight(), s = e('.joyride-nub', this.settings.$next_tip), o = Math.ceil(s.outerHeight() / 2), u = t || !1;
      s.removeClass('bottom').removeClass('top').removeClass('right').removeClass('left'), u && (this.settings.$next_tip.css('visibility', 'hidden'), this.settings.$next_tip.show()), /body/i.test(this.settings.$target.selector) ? this.settings.$li.length && this.pos_modal(s) : this.top() ? (this.settings.$next_tip.offset({ top: this.settings.$target.offset().top - n - o }), s.addClass('bottom')) : (this.settings.$next_tip.offset({ top: this.settings.$target.offset().top + i + o }), s.addClass('top')), u && (this.settings.$next_tip.hide(), this.settings.$next_tip.css('visibility', 'visible'));
    },
    pos_modal: function (e) {
      this.center(), e.hide(), this.show_modal();
    },
    show_modal: function () {
      if (!this.settings.$next_tip.data('closed')) {
        var t = e('.joyride-modal-bg');
        t.length < 1 && e('body').append(this.settings.template.modal).show(), /pop/i.test(this.settings.tip_animation) ? t.show() : t.fadeIn(this.settings.tip_animation_fade_speed);
      }
    },
    expose: function () {
      var n, r, i, s, o, u = 'expose-' + Math.floor(Math.random() * 10000);
      if (arguments.length > 0 && arguments[0] instanceof e)
        i = arguments[0];
      else {
        if (!this.settings.$target || !!/body/i.test(this.settings.$target.selector))
          return !1;
        i = this.settings.$target;
      }
      if (i.length < 1)
        return t.console && console.error('element not valid', i), !1;
      n = e(this.settings.template.expose), this.settings.$body.append(n), n.css({
        top: i.offset().top,
        left: i.offset().left,
        width: i.outerWidth(!0),
        height: i.outerHeight(!0)
      }), r = e(this.settings.template.expose_cover), s = {
        zIndex: i.css('z-index'),
        position: i.css('position')
      }, o = i.attr('class') == null ? '' : i.attr('class'), i.css('z-index', parseInt(n.css('z-index')) + 1), s.position == 'static' && i.css('position', 'relative'), i.data('expose-css', s), i.data('orig-class', o), i.attr('class', o + ' ' + this.settings.expose_add_class), r.css({
        top: i.offset().top,
        left: i.offset().left,
        width: i.outerWidth(!0),
        height: i.outerHeight(!0)
      }), this.settings.modal && this.show_modal(), this.settings.$body.append(r), n.addClass(u), r.addClass(u), i.data('expose', u), this.settings.post_expose_callback(this.settings.$li.index(), this.settings.$next_tip, i), this.add_exposed(i);
    },
    un_expose: function () {
      var n, r, i, s, o, u = !1;
      if (arguments.length > 0 && arguments[0] instanceof e)
        r = arguments[0];
      else {
        if (!this.settings.$target || !!/body/i.test(this.settings.$target.selector))
          return !1;
        r = this.settings.$target;
      }
      if (r.length < 1)
        return t.console && console.error('element not valid', r), !1;
      n = r.data('expose'), i = e('.' + n), arguments.length > 1 && (u = arguments[1]), u === !0 ? e('.joyride-expose-wrapper,.joyride-expose-cover').remove() : i.remove(), s = r.data('expose-css'), s.zIndex == 'auto' ? r.css('z-index', '') : r.css('z-index', s.zIndex), s.position != r.css('position') && (s.position == 'static' ? r.css('position', '') : r.css('position', s.position)), o = r.data('orig-class'), r.attr('class', o), r.removeData('orig-classes'), r.removeData('expose'), r.removeData('expose-z-index'), this.remove_exposed(r);
    },
    add_exposed: function (t) {
      this.settings.exposed = this.settings.exposed || [], t instanceof e || typeof t == 'object' ? this.settings.exposed.push(t[0]) : typeof t == 'string' && this.settings.exposed.push(t);
    },
    remove_exposed: function (t) {
      var n, r;
      t instanceof e ? n = t[0] : typeof t == 'string' && (n = t), this.settings.exposed = this.settings.exposed || [], r = this.settings.exposed.length;
      for (var i = 0; i < r; i++)
        if (this.settings.exposed[i] == n) {
          this.settings.exposed.splice(i, 1);
          return;
        }
    },
    center: function () {
      var n = e(t);
      return this.settings.$next_tip.css({
        top: (n.height() - this.settings.$next_tip.outerHeight()) / 2 + n.scrollTop(),
        left: (n.width() - this.settings.$next_tip.outerWidth()) / 2 + n.scrollLeft()
      }), !0;
    },
    bottom: function () {
      return /bottom/i.test(this.settings.tip_settings.tip_location);
    },
    top: function () {
      return /top/i.test(this.settings.tip_settings.tip_location);
    },
    right: function () {
      return /right/i.test(this.settings.tip_settings.tip_location);
    },
    left: function () {
      return /left/i.test(this.settings.tip_settings.tip_location);
    },
    corners: function (n) {
      var r = e(t), i = r.height() / 2, s = Math.ceil(this.settings.$target.offset().top - i + this.settings.$next_tip.outerHeight()), o = r.width() + r.scrollLeft(), u = r.height() + s, a = r.height() + r.scrollTop(), f = r.scrollTop();
      return s < f && (s < 0 ? f = 0 : f = s), u > a && (a = u), [
        n.offset().top < f,
        o < n.offset().left + n.outerWidth(),
        a < n.offset().top + n.outerHeight(),
        r.scrollLeft() > n.offset().left
      ];
    },
    visible: function (e) {
      var t = e.length;
      while (t--)
        if (e[t])
          return !1;
      return !0;
    },
    nub_position: function (e, t, n) {
      t === 'auto' ? e.addClass(n) : e.addClass(t);
    },
    startTimer: function () {
      this.settings.$li.length ? this.settings.automate = setTimeout(function () {
        this.hide(), this.show(), this.startTimer();
      }.bind(this), this.settings.timer) : clearTimeout(this.settings.automate);
    },
    end: function () {
      this.settings.cookie_monster && e.cookie(this.settings.cookie_name, 'ridden', {
        expires: this.settings.cookie_expires,
        domain: this.settings.cookie_domain
      }), this.settings.timer > 0 && clearTimeout(this.settings.automate), this.settings.modal && this.settings.expose && this.un_expose(), this.settings.$next_tip.data('closed', !0), e('.joyride-modal-bg').hide(), this.settings.$current_tip.hide(), this.settings.post_step_callback(this.settings.$li.index(), this.settings.$current_tip), this.settings.post_ride_callback(this.settings.$li.index(), this.settings.$current_tip), e('.joyride-tip-guide').remove();
    },
    off: function () {
      e(this.scope).off('.joyride'), e(t).off('.joyride'), e('.joyride-close-tip, .joyride-next-tip, .joyride-modal-bg').off('.joyride'), e('.joyride-tip-guide, .joyride-modal-bg').remove(), clearTimeout(this.settings.automate), this.settings = {};
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  var i = function () {
    }, s = function (i, s) {
      if (i.hasClass(s.slides_container_class))
        return this;
      var f = this, l, c = i, h, p, d, v = 0, m, g, y = !1, b = !1;
      c.children().first().addClass(s.active_slide_class), f.update_slide_number = function (t) {
        s.slide_number && (h.find('span:first').text(parseInt(t) + 1), h.find('span:last').text(c.children().length)), s.bullets && (p.children().removeClass(s.bullets_active_class), e(p.children().get(t)).addClass(s.bullets_active_class));
      }, f.update_active_link = function (t) {
        var n = e('a[data-orbit-link="' + c.children().eq(t).attr('data-orbit-slide') + '"]');
        n.parents('ul').find('[data-orbit-link]').removeClass(s.bullets_active_class), n.addClass(s.bullets_active_class);
      }, f.build_markup = function () {
        c.wrap('<div class="' + s.container_class + '"></div>'), l = c.parent(), c.addClass(s.slides_container_class), s.navigation_arrows && (l.append(e('<a href="#"><span></span></a>').addClass(s.prev_class)), l.append(e('<a href="#"><span></span></a>').addClass(s.next_class))), s.timer && (d = e('<div>').addClass(s.timer_container_class), d.append('<span>'), d.append(e('<div>').addClass(s.timer_progress_class)), d.addClass(s.timer_paused_class), l.append(d)), s.slide_number && (h = e('<div>').addClass(s.slide_number_class), h.append('<span></span> ' + s.slide_number_text + ' <span></span>'), l.append(h)), s.bullets && (p = e('<ol>').addClass(s.bullets_container_class), l.append(p), p.wrap('<div class="orbit-bullets-container"></div>'), c.children().each(function (t, n) {
          var r = e('<li>').attr('data-orbit-slide', t);
          p.append(r);
        })), s.stack_on_small && l.addClass(s.stack_on_small_class), f.update_slide_number(0), f.update_active_link(0);
      }, f._goto = function (t, n) {
        if (t === v)
          return !1;
        typeof g == 'object' && g.restart();
        var r = c.children(), i = 'next';
        y = !0, t < v && (i = 'prev'), t >= r.length ? t = 0 : t < 0 && (t = r.length - 1);
        var o = e(r.get(v)), u = e(r.get(t));
        o.css('zIndex', 2), o.removeClass(s.active_slide_class), u.css('zIndex', 4).addClass(s.active_slide_class), c.trigger('before-slide-change.fndtn.orbit'), s.before_slide_change(), f.update_active_link(t);
        var a = function () {
          var e = function () {
            v = t, y = !1, n === !0 && (g = f.create_timer(), g.start()), f.update_slide_number(v), c.trigger('after-slide-change.fndtn.orbit', [{
                slide_number: v,
                total_slides: r.length
              }]), s.after_slide_change(v, r.length);
          };
          c.height() != u.height() && s.variable_height ? c.animate({ height: u.height() }, 250, 'linear', e) : e();
        };
        if (r.length === 1)
          return a(), !1;
        var l = function () {
          i === 'next' && m.next(o, u, a), i === 'prev' && m.prev(o, u, a);
        };
        u.height() > c.height() && s.variable_height ? c.animate({ height: u.height() }, 250, 'linear', l) : l();
      }, f.next = function (e) {
        e.stopImmediatePropagation(), e.preventDefault(), f._goto(v + 1);
      }, f.prev = function (e) {
        e.stopImmediatePropagation(), e.preventDefault(), f._goto(v - 1);
      }, f.link_custom = function (t) {
        t.preventDefault();
        var n = e(this).attr('data-orbit-link');
        if (typeof n == 'string' && (n = e.trim(n)) != '') {
          var r = l.find('[data-orbit-slide=' + n + ']');
          r.index() != -1 && f._goto(r.index());
        }
      }, f.link_bullet = function (t) {
        var n = e(this).attr('data-orbit-slide');
        typeof n == 'string' && (n = e.trim(n)) != '' && f._goto(parseInt(n));
      }, f.timer_callback = function () {
        f._goto(v + 1, !0);
      }, f.compute_dimensions = function () {
        var t = e(c.children().get(v)), n = t.height();
        s.variable_height || c.children().each(function () {
          e(this).height() > n && (n = e(this).height());
        }), c.height(n);
      }, f.create_timer = function () {
        var e = new o(l.find('.' + s.timer_container_class), s, f.timer_callback);
        return e;
      }, f.stop_timer = function () {
        typeof g == 'object' && g.stop();
      }, f.toggle_timer = function () {
        var e = l.find('.' + s.timer_container_class);
        e.hasClass(s.timer_paused_class) ? (typeof g == 'undefined' && (g = f.create_timer()), g.start()) : typeof g == 'object' && g.stop();
      }, f.init = function () {
        f.build_markup(), s.timer && (g = f.create_timer(), g.start()), m = new a(s, c), s.animation === 'slide' && (m = new u(s, c)), l.on('click', '.' + s.next_class, f.next), l.on('click', '.' + s.prev_class, f.prev), l.on('click', '[data-orbit-slide]', f.link_bullet), l.on('click', f.toggle_timer), s.swipe && l.on('touchstart.fndtn.orbit', function (e) {
          e.touches || (e = e.originalEvent);
          var t = {
              start_page_x: e.touches[0].pageX,
              start_page_y: e.touches[0].pageY,
              start_time: new Date().getTime(),
              delta_x: 0,
              is_scrolling: r
            };
          l.data('swipe-transition', t), e.stopPropagation();
        }).on('touchmove.fndtn.orbit', function (e) {
          e.touches || (e = e.originalEvent);
          if (e.touches.length > 1 || e.scale && e.scale !== 1)
            return;
          var t = l.data('swipe-transition');
          typeof t == 'undefined' && (t = {}), t.delta_x = e.touches[0].pageX - t.start_page_x, typeof t.is_scrolling == 'undefined' && (t.is_scrolling = !!(t.is_scrolling || Math.abs(t.delta_x) < Math.abs(e.touches[0].pageY - t.start_page_y)));
          if (!t.is_scrolling && !t.active) {
            e.preventDefault();
            var n = t.delta_x < 0 ? v + 1 : v - 1;
            t.active = !0, f._goto(n);
          }
        }).on('touchend.fndtn.orbit', function (e) {
          l.data('swipe-transition', {}), e.stopPropagation();
        }), l.on('mouseenter.fndtn.orbit', function (e) {
          s.timer && s.pause_on_hover && f.stop_timer();
        }).on('mouseleave.fndtn.orbit', function (e) {
          s.timer && s.resume_on_mouseout && g.start();
        }), e(n).on('click', '[data-orbit-link]', f.link_custom), e(t).on('resize', f.compute_dimensions), e(t).on('load', f.compute_dimensions), e(t).on('load', function () {
          l.prev('.preloader').css('display', 'none');
        }), c.trigger('ready.fndtn.orbit');
      }, f.init();
    }, o = function (e, t, n) {
      var r = this, i = t.timer_speed, s = e.find('.' + t.timer_progress_class), o, u, a = -1;
      this.update_progress = function (e) {
        var t = s.clone();
        t.attr('style', ''), t.css('width', e + '%'), s.replaceWith(t), s = t;
      }, this.restart = function () {
        clearTimeout(u), e.addClass(t.timer_paused_class), a = -1, r.update_progress(0);
      }, this.start = function () {
        if (!e.hasClass(t.timer_paused_class))
          return !0;
        a = a === -1 ? i : a, e.removeClass(t.timer_paused_class), o = new Date().getTime(), s.animate({ width: '100%' }, a, 'linear'), u = setTimeout(function () {
          r.restart(), n();
        }, a), e.trigger('timer-started.fndtn.orbit');
      }, this.stop = function () {
        if (e.hasClass(t.timer_paused_class))
          return !0;
        clearTimeout(u), e.addClass(t.timer_paused_class);
        var n = new Date().getTime();
        a -= n - o;
        var s = 100 - a / i * 100;
        r.update_progress(s), e.trigger('timer-stopped.fndtn.orbit');
      };
    }, u = function (t, n) {
      var r = t.animation_speed, i = e('html[dir=rtl]').length === 1, s = i ? 'marginRight' : 'marginLeft', o = {};
      o[s] = '0%', this.next = function (e, t, n) {
        e.animate({ marginLeft: '-100%' }, r), t.animate(o, r, function () {
          e.css(s, '100%'), n();
        });
      }, this.prev = function (e, t, n) {
        e.animate({ marginLeft: '100%' }, r), t.css(s, '-100%'), t.animate(o, r, function () {
          e.css(s, '100%'), n();
        });
      };
    }, a = function (t, n) {
      var r = t.animation_speed, i = e('html[dir=rtl]').length === 1, s = i ? 'marginRight' : 'marginLeft';
      this.next = function (e, t, n) {
        t.css({
          margin: '0%',
          opacity: '0.01'
        }), t.animate({ opacity: '1' }, r, 'linear', function () {
          e.css('margin', '100%'), n();
        });
      }, this.prev = function (e, t, n) {
        t.css({
          margin: '0%',
          opacity: '0.01'
        }), t.animate({ opacity: '1' }, r, 'linear', function () {
          e.css('margin', '100%'), n();
        });
      };
    };
  Foundation.libs = Foundation.libs || {}, Foundation.libs.orbit = {
    name: 'orbit',
    version: '5.0.0',
    settings: {
      animation: 'slide',
      timer_speed: 10000,
      pause_on_hover: !0,
      resume_on_mouseout: !1,
      animation_speed: 500,
      stack_on_small: !1,
      navigation_arrows: !0,
      slide_number: !0,
      slide_number_text: 'of',
      container_class: 'orbit-container',
      stack_on_small_class: 'orbit-stack-on-small',
      next_class: 'orbit-next',
      prev_class: 'orbit-prev',
      timer_container_class: 'orbit-timer',
      timer_paused_class: 'paused',
      timer_progress_class: 'orbit-progress',
      slides_container_class: 'orbit-slides-container',
      bullets_container_class: 'orbit-bullets',
      bullets_active_class: 'active',
      slide_number_class: 'orbit-slide-number',
      caption_class: 'orbit-caption',
      active_slide_class: 'active',
      orbit_transition_class: 'orbit-transitioning',
      bullets: !0,
      timer: !0,
      variable_height: !1,
      swipe: !0,
      before_slide_change: i,
      after_slide_change: i
    },
    init: function (t, n, r) {
      var i = this;
      typeof n == 'object' && e.extend(!0, i.settings, n);
      if (e(t).is('[data-orbit]')) {
        var o = e(t), u = i.data_options(o);
        new s(o, e.extend({}, i.settings, u));
      }
      e('[data-orbit]', t).each(function (t, n) {
        var r = e(n), o = i.data_options(r);
        new s(r, e.extend({}, i.settings, o));
      });
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.topbar = {
    name: 'topbar',
    version: '5.0.1',
    settings: {
      index: 0,
      sticky_class: 'sticky',
      custom_back_text: !0,
      back_text: 'Back',
      is_hover: !0,
      mobile_show_parent_link: !1,
      scrolltop: !0
    },
    init: function (t, n, r) {
      Foundation.inherit(this, 'addCustomRule register_media throttle');
      var i = this;
      i.register_media('topbar', 'foundation-mq-topbar'), this.bindings(n, r), e('[data-topbar]', this.scope).each(function () {
        var t = e(this), n = t.data('topbar-init'), r = e('section', this), s = e('> ul', this).first();
        t.data('index', 0);
        var o = t.parent();
        o.hasClass('fixed') || o.hasClass(n.sticky_class) ? (i.settings.sticky_class = n.sticky_class, i.settings.stick_topbar = t, t.data('height', o.outerHeight()), t.data('stickyoffset', o.offset().top)) : t.data('height', t.outerHeight()), n.assembled || i.assemble(t), n.is_hover ? e('.has-dropdown', t).addClass('not-click') : e('.has-dropdown', t).removeClass('not-click'), i.addCustomRule('.f-topbar-fixed { padding-top: ' + t.data('height') + 'px }'), o.hasClass('fixed') && e('body').addClass('f-topbar-fixed');
      });
    },
    toggle: function (n) {
      var r = this;
      if (n)
        var i = e(n).closest('[data-topbar]');
      else
        var i = e('[data-topbar]');
      var s = i.data('topbar-init'), o = e('section, .section', i);
      r.breakpoint() && (r.rtl ? (o.css({ right: '0%' }), e('>.name', o).css({ right: '100%' })) : (o.css({ left: '0%' }), e('>.name', o).css({ left: '100%' })), e('li.moved', o).removeClass('moved'), i.data('index', 0), i.toggleClass('expanded').css('height', '')), s.scrolltop ? i.hasClass('expanded') ? i.parent().hasClass('fixed') && (s.scrolltop ? (i.parent().removeClass('fixed'), i.addClass('fixed'), e('body').removeClass('f-topbar-fixed'), t.scrollTo(0, 0)) : i.parent().removeClass('expanded')) : i.hasClass('fixed') && (i.parent().addClass('fixed'), i.removeClass('fixed'), e('body').addClass('f-topbar-fixed')) : (i.parent().hasClass(r.settings.sticky_class) && i.parent().addClass('fixed'), i.parent().hasClass('fixed') && (i.hasClass('expanded') ? (i.addClass('fixed'), i.parent().addClass('expanded')) : (i.removeClass('fixed'), i.parent().removeClass('expanded'), r.update_sticky_positioning())));
    },
    timer: null,
    events: function (n) {
      var r = this;
      e(this.scope).off('.topbar').on('click.fndtn.topbar', '[data-topbar] .toggle-topbar', function (e) {
        e.preventDefault(), r.toggle(this);
      }).on('click.fndtn.topbar', '[data-topbar] li.has-dropdown', function (t) {
        var n = e(this), i = e(t.target), s = n.closest('[data-topbar]'), o = s.data('topbar-init');
        if (i.data('revealId')) {
          r.toggle();
          return;
        }
        if (r.breakpoint())
          return;
        if (o.is_hover && !Modernizr.touch)
          return;
        t.stopImmediatePropagation(), n.hasClass('hover') ? (n.removeClass('hover').find('li').removeClass('hover'), n.parents('li.hover').removeClass('hover')) : (n.addClass('hover'), i[0].nodeName === 'A' && i.parent().hasClass('has-dropdown') && t.preventDefault());
      }).on('click.fndtn.topbar', '[data-topbar] .has-dropdown>a', function (t) {
        if (r.breakpoint()) {
          t.preventDefault();
          var n = e(this), i = n.closest('[data-topbar]'), s = i.find('section, .section'), o = n.next('.dropdown').outerHeight(), u = n.closest('li');
          i.data('index', i.data('index') + 1), u.addClass('moved'), r.rtl ? (s.css({ right: -(100 * i.data('index')) + '%' }), s.find('>.name').css({ right: 100 * i.data('index') + '%' })) : (s.css({ left: -(100 * i.data('index')) + '%' }), s.find('>.name').css({ left: 100 * i.data('index') + '%' })), i.css('height', n.siblings('ul').outerHeight(!0) + i.data('height'));
        }
      }), e(t).off('.topbar').on('resize.fndtn.topbar', r.throttle(function () {
        r.resize.call(r);
      }, 50)).trigger('resize'), e('body').off('.topbar').on('click.fndtn.topbar touchstart.fndtn.topbar', function (t) {
        var n = e(t.target).closest('li').closest('li.hover');
        if (n.length > 0)
          return;
        e('[data-topbar] li').removeClass('hover');
      }), e(this.scope).on('click.fndtn.topbar', '[data-topbar] .has-dropdown .back', function (t) {
        t.preventDefault();
        var n = e(this), i = n.closest('[data-topbar]'), s = i.find('section, .section'), o = i.data('topbar-init'), u = n.closest('li.moved'), a = u.parent();
        i.data('index', i.data('index') - 1), r.rtl ? (s.css({ right: -(100 * i.data('index')) + '%' }), s.find('>.name').css({ right: 100 * i.data('index') + '%' })) : (s.css({ left: -(100 * i.data('index')) + '%' }), s.find('>.name').css({ left: 100 * i.data('index') + '%' })), i.data('index') === 0 ? i.css('height', '') : i.css('height', a.outerHeight(!0) + i.data('height')), setTimeout(function () {
          u.removeClass('moved');
        }, 300);
      });
    },
    resize: function () {
      var t = this;
      e('[data-topbar]').each(function () {
        var r = e(this), i = r.data('topbar-init'), s = r.parent('.' + t.settings.sticky_class), o;
        if (!t.breakpoint()) {
          var u = r.hasClass('expanded');
          r.css('height', '').removeClass('expanded').find('li').removeClass('hover'), u && t.toggle(r);
        }
        s.length > 0 && (s.hasClass('fixed') ? (s.removeClass('fixed'), o = s.offset().top, e(n.body).hasClass('f-topbar-fixed') && (o -= r.data('height')), r.data('stickyoffset', o), s.addClass('fixed')) : (o = s.offset().top, r.data('stickyoffset', o)));
      });
    },
    breakpoint: function () {
      return !matchMedia(Foundation.media_queries.topbar).matches;
    },
    assemble: function (t) {
      var n = this, r = t.data('topbar-init'), i = e('section', t), s = e('> ul', t).first();
      i.detach(), e('.has-dropdown>a', i).each(function () {
        var t = e(this), n = t.siblings('.dropdown'), i = t.attr('href');
        if (r.mobile_show_parent_link && i && i.length > 1)
          var s = e('<li class="title back js-generated"><h5><a href="#"></a></h5></li><li><a class="parent-link js-generated" href="' + i + '">' + t.text() + '</a></li>');
        else
          var s = e('<li class="title back js-generated"><h5><a href="#"></a></h5></li>');
        r.custom_back_text == 1 ? e('h5>a', s).html(r.back_text) : e('h5>a', s).html('&laquo; ' + t.html()), n.prepend(s);
      }), i.appendTo(t), this.sticky(), this.assembled(t);
    },
    assembled: function (t) {
      t.data('topbar-init', e.extend({}, t.data('topbar-init'), { assembled: !0 }));
    },
    height: function (t) {
      var n = 0, r = this;
      return e('> li', t).each(function () {
        n += e(this).outerHeight(!0);
      }), n;
    },
    sticky: function () {
      var n = e(t), r = this;
      e(t).on('scroll', function () {
        r.update_sticky_positioning();
      });
    },
    update_sticky_positioning: function () {
      var n = '.' + this.settings.sticky_class, r = e(t);
      if (e(n).length > 0) {
        var i = this.settings.sticky_topbar.data('stickyoffset');
        e(n).hasClass('expanded') || (r.scrollTop() > i ? e(n).hasClass('fixed') || (e(n).addClass('fixed'), e('body').addClass('f-topbar-fixed')) : r.scrollTop() <= i && e(n).hasClass('fixed') && (e(n).removeClass('fixed'), e('body').removeClass('f-topbar-fixed')));
      }
    },
    off: function () {
      e(this.scope).off('.fndtn.topbar'), e(t).off('.fndtn.topbar');
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.accordion = {
    name: 'accordion',
    version: '5.0.1',
    settings: {
      active_class: 'active',
      toggleable: !0
    },
    init: function (e, t, n) {
      this.bindings(t, n);
    },
    events: function () {
      e(this.scope).off('.accordion').on('click.fndtn.accordion', '[data-accordion] > dd > a', function (t) {
        var n = e(this).parent(), r = e('#' + this.href.split('#')[1]), i = e('> dd > .content', r.closest('[data-accordion]')), s = n.parent().data('accordion-init'), o = e('> dd > .content.' + s.active_class, n.parent());
        t.preventDefault();
        if (o[0] == r[0] && s.toggleable)
          return r.toggleClass(s.active_class);
        i.removeClass(s.active_class), r.addClass(s.active_class);
      });
    },
    off: function () {
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document), function (e, t, n, r) {
  'use strict';
  Foundation.libs.offcanvas = {
    name: 'offcanvas',
    version: '5.0.0',
    settings: {},
    init: function (e, t, n) {
      this.events();
    },
    events: function () {
      e(this.scope).off('.offcanvas').on('click.fndtn.offcanvas', '.left-off-canvas-toggle', function (t) {
        t.preventDefault(), e(this).closest('.off-canvas-wrap').toggleClass('move-right');
      }).on('click.fndtn.offcanvas', '.exit-off-canvas', function (t) {
        t.preventDefault(), e('.off-canvas-wrap').removeClass('move-right');
      }).on('click.fndtn.offcanvas', '.right-off-canvas-toggle', function (t) {
        t.preventDefault(), e(this).closest('.off-canvas-wrap').toggleClass('move-left');
      }).on('click.fndtn.offcanvas', '.exit-off-canvas', function (t) {
        t.preventDefault(), e('.off-canvas-wrap').removeClass('move-left');
      });
    },
    reflow: function () {
    }
  };
}(jQuery, this, this.document));(function (e) {
  'use strict';
  function t(e, t, n) {
    if (e.addEventListener) {
      return e.addEventListener(t, n, false);
    }
    if (e.attachEvent) {
      return e.attachEvent('on' + t, n);
    }
  }
  function n(e, t) {
    var n, r;
    for (n = 0, r = e.length; n < r; n++) {
      if (e[n] === t) {
        return true;
      }
    }
    return false;
  }
  function r(e, t) {
    var n;
    if (e.createTextRange) {
      n = e.createTextRange();
      n.move('character', t);
      n.select();
    } else if (e.selectionStart) {
      e.focus();
      e.setSelectionRange(t, t);
    }
  }
  function i(e, t) {
    try {
      e.type = t;
      return true;
    } catch (n) {
      return false;
    }
  }
  e.Placeholders = {
    Utils: {
      addEventListener: t,
      inArray: n,
      moveCaret: r,
      changeType: i
    }
  };
}(this));
(function (e) {
  'use strict';
  function M() {
  }
  function _(e) {
    var t;
    if (e.value === e.getAttribute(a) && e.getAttribute(f) === 'true') {
      e.setAttribute(f, 'false');
      e.value = '';
      e.className = e.className.replace(s, '');
      t = e.getAttribute(l);
      if (t) {
        e.type = t;
      }
      return true;
    }
    return false;
  }
  function D(e) {
    var t, n = e.getAttribute(a);
    if (e.value === '' && n) {
      e.setAttribute(f, 'true');
      e.value = n;
      e.className += ' ' + i;
      t = e.getAttribute(l);
      if (t) {
        e.type = 'text';
      } else if (e.type === 'password') {
        if (b.changeType(e, 'text')) {
          e.setAttribute(l, 'password');
        }
      }
      return true;
    }
    return false;
  }
  function P(e, t) {
    var n, r, i, s, f;
    if (e && e.getAttribute(a)) {
      t(e);
    } else {
      n = e ? e.getElementsByTagName('input') : o;
      r = e ? e.getElementsByTagName('textarea') : u;
      for (f = 0, s = n.length + r.length; f < s; f++) {
        i = f < n.length ? n[f] : r[f - n.length];
        t(i);
      }
    }
  }
  function H(e) {
    P(e, _);
  }
  function B(e) {
    P(e, D);
  }
  function j(e) {
    return function () {
      if (w && e.value === e.getAttribute(a) && e.getAttribute(f) === 'true') {
        b.moveCaret(e, 0);
      } else {
        _(e);
      }
    };
  }
  function F(e) {
    return function () {
      D(e);
    };
  }
  function I(e) {
    return function (t) {
      S = e.value;
      if (e.getAttribute(f) === 'true') {
        if (S === e.getAttribute(a) && b.inArray(n, t.keyCode)) {
          if (t.preventDefault) {
            t.preventDefault();
          }
          return false;
        }
      }
    };
  }
  function q(e) {
    return function () {
      var t;
      if (e.getAttribute(f) === 'true' && e.value !== S) {
        e.className = e.className.replace(s, '');
        e.value = e.value.replace(e.getAttribute(a), '');
        e.setAttribute(f, false);
        t = e.getAttribute(l);
        if (t) {
          e.type = t;
        }
      }
      if (e.value === '') {
        e.blur();
        b.moveCaret(e, 0);
      }
    };
  }
  function R(e) {
    return function () {
      if (e === document.activeElement && e.value === e.getAttribute(a) && e.getAttribute(f) === 'true') {
        b.moveCaret(e, 0);
      }
    };
  }
  function U(e) {
    return function () {
      H(e);
    };
  }
  function z(e) {
    if (e.form) {
      k = e.form;
      if (!k.getAttribute(c)) {
        b.addEventListener(k, 'submit', U(k));
        k.setAttribute(c, 'true');
      }
    }
    b.addEventListener(e, 'focus', j(e));
    b.addEventListener(e, 'blur', F(e));
    if (w) {
      b.addEventListener(e, 'keydown', I(e));
      b.addEventListener(e, 'keyup', q(e));
      b.addEventListener(e, 'click', R(e));
    }
    e.setAttribute(h, 'true');
    e.setAttribute(a, N);
    D(e);
  }
  var t = [
      'text',
      'search',
      'url',
      'tel',
      'email',
      'password',
      'number',
      'textarea'
    ], n = [
      27,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      8,
      46
    ], r = '#ccc', i = 'placeholdersjs', s = new RegExp('(?:^|\\s)' + i + '(?!\\S)'), o, u, a = 'data-placeholder-value', f = 'data-placeholder-active', l = 'data-placeholder-type', c = 'data-placeholder-submit', h = 'data-placeholder-bound', p = 'data-placeholder-focus', d = 'data-placeholder-live', v = document.createElement('input'), m = document.getElementsByTagName('head')[0], g = document.documentElement, y = e.Placeholders, b = y.Utils, w, E, S, x, T, N, C, k, L, A, O;
  y.nativeSupport = v.placeholder !== void 0;
  if (!y.nativeSupport) {
    o = document.getElementsByTagName('input');
    u = document.getElementsByTagName('textarea');
    w = g.getAttribute(p) === 'false';
    E = g.getAttribute(d) !== 'false';
    x = document.createElement('style');
    x.type = 'text/css';
    T = document.createTextNode('.' + i + ' { color:' + r + '; }');
    if (x.styleSheet) {
      x.styleSheet.cssText = T.nodeValue;
    } else {
      x.appendChild(T);
    }
    m.insertBefore(x, m.firstChild);
    for (O = 0, A = o.length + u.length; O < A; O++) {
      L = O < o.length ? o[O] : u[O - o.length];
      N = L.attributes.placeholder;
      if (N) {
        N = N.nodeValue;
        if (N && b.inArray(t, L.type)) {
          z(L);
        }
      }
    }
    C = setInterval(function () {
      for (O = 0, A = o.length + u.length; O < A; O++) {
        L = O < o.length ? o[O] : u[O - o.length];
        N = L.attributes.placeholder;
        if (N) {
          N = N.nodeValue;
          if (N && b.inArray(t, L.type)) {
            if (!L.getAttribute(h)) {
              z(L);
            }
            if (N !== L.getAttribute(a) || L.type === 'password' && !L.getAttribute(l)) {
              if (L.type === 'password' && !L.getAttribute(l) && b.changeType(L, 'text')) {
                L.setAttribute(l, 'password');
              }
              if (L.value === L.getAttribute(a)) {
                L.value = N;
              }
              L.setAttribute(a, N);
            }
          }
        }
      }
      if (!E) {
        clearInterval(C);
      }
    }, 100);
  }
  y.disable = y.nativeSupport ? M : H;
  y.enable = y.nativeSupport ? M : B;
}(this));
;var app;
app = angular.module('ratings', []);
app.directive('angularRatings', function () {
  return {
    restrict: 'A',
    scope: {
      model: '=ngModel',
      trackableId: '=trackableId',
      trackableType: '=trackableType',
      userId: '=userId',
      ratingUserId: '=ratingUserId'
    },
    replace: true,
    transclude: true,
    template: '<div><ol class="angular-ratings">' + '<li ng-class="{active:model>0,over:over>0}">1</li>' + '<li ng-class="{active:model>1,over:over>1}">2</li>' + '<li ng-class="{active:model>2,over:over>2}">3</li>' + '<li ng-class="{active:model>3,over:over>3}">4</li>' + '<li ng-class="{active:model>4,over:over>4}">5</li>' + '</ol></div>',
    controller: [
      '$scope',
      '$attrs',
      '$http',
      function ($scope, $attrs, $http) {
        $scope.over = 0;
        $scope.setRating = function (rating) {
          if ($scope.userId != $scope.ratingUserId) {
            $scope.model = rating;
            $scope.$apply();
            if ($attrs.notifyUrl !== void 0 && ($scope.trackableId && $scope.trackableType)) {
              return $http.post($attrs.notifyUrl, {
                trackable_id: $scope.trackableId,
                trackable_type: $scope.trackableType,
                rating: rating
              }).error(function (data) {
                if (typeof data === 'string') {
                  alert(data);
                }
                return $scope.model = 0;
              });
            }
          } else {
            alert('You have already rated');
            return;
          }
        };
        return $scope.setOver = function (n) {
          $scope.over = n;
          return $scope.$apply();
        };
      }
    ],
    link: function (scope, iElem, iAttrs) {
      if (iAttrs.notifyUrl !== void 0) {
        return angular.forEach(iElem.children(), function (ol) {
          return angular.forEach(ol.children, function (li) {
            li.addEventListener('mouseover', function () {
              return scope.setOver(parseInt(li.innerHTML));
            });
            li.addEventListener('mouseout', function () {
              return scope.setOver(0);
            });
            return li.addEventListener('click', function () {
              return scope.setRating(parseInt(li.innerHTML));
            });
          });
        });
      }
    }
  };
});(function (window, $, undefined) {
  'use strict';
  var $event = $.event, resizeTimeout;
  $event.special.smartresize = {
    setup: function () {
      $(this).bind('resize', $event.special.smartresize.handler);
    },
    teardown: function () {
      $(this).unbind('resize', $event.special.smartresize.handler);
    },
    handler: function (event, execAsap) {
      var context = this, args = arguments;
      event.type = 'smartresize';
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(function () {
        $event.dispatch.apply(context, args);
      }, execAsap === 'execAsap' ? 0 : 100);
    }
  };
  $.fn.smartresize = function (fn) {
    return fn ? this.bind('smartresize', fn) : this.trigger('smartresize', ['execAsap']);
  };
  $.Mason = function (options, element) {
    this.element = $(element);
    this._create(options);
    this._init();
  };
  $.Mason.settings = {
    isResizable: true,
    isAnimated: false,
    animationOptions: {
      queue: false,
      duration: 500
    },
    gutterWidth: 0,
    isRTL: false,
    isFitWidth: false,
    containerStyle: { position: 'relative' }
  };
  $.Mason.prototype = {
    _filterFindBricks: function ($elems) {
      var selector = this.options.itemSelector;
      return !selector ? $elems : $elems.filter(selector).add($elems.find(selector));
    },
    _getBricks: function ($elems) {
      var $bricks = this._filterFindBricks($elems).css({ position: 'absolute' }).addClass('masonry-brick');
      return $bricks;
    },
    _create: function (options) {
      this.options = $.extend(true, {}, $.Mason.settings, options);
      this.styleQueue = [];
      var elemStyle = this.element[0].style;
      this.originalStyle = { height: elemStyle.height || '' };
      var containerStyle = this.options.containerStyle;
      for (var prop in containerStyle) {
        this.originalStyle[prop] = elemStyle[prop] || '';
      }
      this.element.css(containerStyle);
      this.horizontalDirection = this.options.isRTL ? 'right' : 'left';
      var x = this.element.css('padding-' + this.horizontalDirection);
      var y = this.element.css('padding-top');
      this.offset = {
        x: x ? parseInt(x, 10) : 0,
        y: y ? parseInt(y, 10) : 0
      };
      this.isFluid = this.options.columnWidth && typeof this.options.columnWidth === 'function';
      var instance = this;
      setTimeout(function () {
        instance.element.addClass('masonry');
      }, 0);
      if (this.options.isResizable) {
        $(window).bind('smartresize.masonry', function () {
          instance.resize();
        });
      }
      this.reloadItems();
    },
    _init: function (callback) {
      this._getColumns();
      this._reLayout(callback);
    },
    option: function (key, value) {
      if ($.isPlainObject(key)) {
        this.options = $.extend(true, this.options, key);
      }
    },
    layout: function ($bricks, callback) {
      for (var i = 0, len = $bricks.length; i < len; i++) {
        this._placeBrick($bricks[i]);
      }
      var containerSize = {};
      containerSize.height = Math.max.apply(Math, this.colYs);
      if (this.options.isFitWidth) {
        var unusedCols = 0;
        i = this.cols;
        while (--i) {
          if (this.colYs[i] !== 0) {
            break;
          }
          unusedCols++;
        }
        containerSize.width = (this.cols - unusedCols) * this.columnWidth - this.options.gutterWidth;
      }
      this.styleQueue.push({
        $el: this.element,
        style: containerSize
      });
      var styleFn = !this.isLaidOut ? 'css' : this.options.isAnimated ? 'animate' : 'css', animOpts = this.options.animationOptions;
      var obj;
      for (i = 0, len = this.styleQueue.length; i < len; i++) {
        obj = this.styleQueue[i];
        obj.$el[styleFn](obj.style, animOpts);
      }
      this.styleQueue = [];
      if (callback) {
        callback.call($bricks);
      }
      this.isLaidOut = true;
    },
    _getColumns: function () {
      var container = this.options.isFitWidth ? this.element.parent() : this.element, containerWidth = container.width();
      this.columnWidth = this.isFluid ? this.options.columnWidth(containerWidth) : this.options.columnWidth || this.$bricks.outerWidth(true) || containerWidth;
      this.columnWidth += this.options.gutterWidth;
      this.cols = Math.floor((containerWidth + this.options.gutterWidth) / this.columnWidth);
      this.cols = Math.max(this.cols, 1);
    },
    _placeBrick: function (brick) {
      var $brick = $(brick), colSpan, groupCount, groupY, groupColY, j;
      colSpan = Math.ceil($brick.outerWidth(true) / this.columnWidth);
      colSpan = Math.min(colSpan, this.cols);
      if (colSpan === 1) {
        groupY = this.colYs;
      } else {
        groupCount = this.cols + 1 - colSpan;
        groupY = [];
        for (j = 0; j < groupCount; j++) {
          groupColY = this.colYs.slice(j, j + colSpan);
          groupY[j] = Math.max.apply(Math, groupColY);
        }
      }
      var minimumY = Math.min.apply(Math, groupY), shortCol = 0;
      for (var i = 0, len = groupY.length; i < len; i++) {
        if (groupY[i] === minimumY) {
          shortCol = i;
          break;
        }
      }
      var position = { top: minimumY + this.offset.y };
      position[this.horizontalDirection] = this.columnWidth * shortCol + this.offset.x;
      this.styleQueue.push({
        $el: $brick,
        style: position
      });
      var setHeight = minimumY + $brick.outerHeight(true), setSpan = this.cols + 1 - len;
      for (i = 0; i < setSpan; i++) {
        this.colYs[shortCol + i] = setHeight;
      }
    },
    resize: function () {
      var prevColCount = this.cols;
      this._getColumns();
      if (this.isFluid || this.cols !== prevColCount) {
        this._reLayout();
      }
    },
    _reLayout: function (callback) {
      var i = this.cols;
      this.colYs = [];
      while (i--) {
        this.colYs.push(0);
      }
      this.layout(this.$bricks, callback);
    },
    reloadItems: function () {
      this.$bricks = this._getBricks(this.element.children());
    },
    reload: function (callback) {
      this.reloadItems();
      this._init(callback);
    },
    appended: function ($content, isAnimatedFromBottom, callback) {
      if (isAnimatedFromBottom) {
        this._filterFindBricks($content).css({ top: this.element.height() });
        var instance = this;
        setTimeout(function () {
          instance._appended($content, callback);
        }, 1);
      } else {
        this._appended($content, callback);
      }
    },
    _appended: function ($content, callback) {
      var $newBricks = this._getBricks($content);
      this.$bricks = this.$bricks.add($newBricks);
      this.layout($newBricks, callback);
    },
    remove: function ($content) {
      this.$bricks = this.$bricks.not($content);
      $content.remove();
    },
    destroy: function () {
      this.$bricks.removeClass('masonry-brick').each(function () {
        this.style.position = '';
        this.style.top = '';
        this.style.left = '';
      });
      var elemStyle = this.element[0].style;
      for (var prop in this.originalStyle) {
        elemStyle[prop] = this.originalStyle[prop];
      }
      this.element.unbind('.masonry').removeClass('masonry').removeData('masonry');
      $(window).unbind('.masonry');
    }
  };
  $.fn.imagesLoaded = function (callback) {
    var $this = this, $images = $this.find('img').add($this.filter('img')), len = $images.length, blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', loaded = [];
    function triggerCallback() {
      callback.call($this, $images);
    }
    function imgLoaded(event) {
      var img = event.target;
      if (img.src !== blank && $.inArray(img, loaded) === -1) {
        loaded.push(img);
        if (--len <= 0) {
          setTimeout(triggerCallback);
          $images.unbind('.imagesLoaded', imgLoaded);
        }
      }
    }
    if (!len) {
      triggerCallback();
    }
    $images.bind('load.imagesLoaded error.imagesLoaded', imgLoaded).each(function () {
      var src = this.src;
      this.src = blank;
      this.src = src;
    });
    return $this;
  };
  var logError = function (message) {
    if (window.console) {
      window.console.error(message);
    }
  };
  $.fn.masonry = function (options) {
    if (typeof options === 'string') {
      var args = Array.prototype.slice.call(arguments, 1);
      this.each(function () {
        var instance = $.data(this, 'masonry');
        if (!instance) {
          logError('cannot call methods on masonry prior to initialization; ' + 'attempted to call method \'' + options + '\'');
          return;
        }
        if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
          logError('no such method \'' + options + '\' for masonry instance');
          return;
        }
        instance[options].apply(instance, args);
      });
    } else {
      this.each(function () {
        var instance = $.data(this, 'masonry');
        if (instance) {
          instance.option(options || {});
          instance._init();
        } else {
          $.data(this, 'masonry', new $.Mason(options, this));
        }
      });
    }
    return this;
  };
}(window, jQuery));var app = angular.module('myApp',
        ['ngRoute',
          'ngResource','ng-rails-csrf','ngCookies','angularFileUpload','infinite-scroll','ratings','ngProgress']);
app.config(['$routeProvider',function($routeProvider){
    $routeProvider.when("/",{
        //templateUrl:'/angularTemplates/dashboard.html',
        controller:'HomeController'
        /*resolve: {
            //SessionService has been declared
            session: function(SessService){
                return SessService.getCurrentUser();
            },
            microposts:function(MicropostIndexService){
                return MicropostIndexService.getMicroposts();
            }


        }*/

    })
        .otherwise({redirectTo: '/'}) ;
}]);
app.config(['$locationProvider',function($locationProvider){
        // this is used to remove '#' from the URL
        $locationProvider.html5Mode(true);
    }]);

app.config( ['$compileProvider',function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel):/);
}]);
app.run(['$rootScope',function($rootScope) {

    $rootScope.$on('$viewContentLoaded', function () {
    $(function(){ $(document).foundation(); });
});
}]);
//This one is for showing the activities/notifications, I have moved the code from the activity page to this page

app.controller("ActivityCtrl",ActivityCtrl);
ActivityCtrl.$inject =['$scope','ActivityIndexService','ActivityOtherUserService','VoteUrlService','CommentUrlService','ActivityRemoveService','CommonVoteService'];
function ActivityCtrl($scope,ActivityIndexService,ActivityOtherUserService,VoteUrlService,CommentUrlService,ActivityRemoveService,CommonVoteService){
    var counter = 0;
    var obj = [];
    var activities;
    var flag = true;




    $scope.activities = [];
    $scope.usersDetails = [];
    $scope.myPagingFunction = function(){
        counter += 1;
        if(flag){
            // call made once to the server
            ActivityIndexService.getActivities(counter).success(function(data){
                obj = data;
                activities = obj.activities;
                //console.log(activities);
                //alert(data.success);
                flag = data.success;

                angular.forEach(activities,function(value,key){

                    $scope.activities.push(value);
                    /* angular.forEach(value,function(value1,key){
                     console.log(value1);
                     })*/

                    //var user = ActivityUserService.getUser(value.user_id);

                    //here activities contains track_type "comment", so we dont want that . so is the reason we have used if condition

                    //In the below code value.user_id is used for getting the details of the user who has made the activity


                    if(value.trackable_type!="Comment"){
                        ActivityOtherUserService
                            .getFeed(value.user_id,value.trackable_id,value.trackable_type)
                            .success(function(data){
                                $scope.usersDetails.push(data);
                            });
                    }
                });

            });
        }

    };

    //Here we are passing userDetail only for model,id purpose....the commenting person is different
    // the commenting person is of course current_user....  ;-)

    $scope.comment = function(userDetail){
        var comment = {
            content:userDetail.commentIt
        };
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;
        var Comment = CommentUrlService.getUrl(model,id);


        var commentable = Comment.save(comment);
        //in user controller i hav defined comments .....so its imp to initialize with comments variable name
        if(!userDetail.comments){

            userDetail.comments = [];
        }
        userDetail.comments.push(commentable);

        //comment.otherUserPhotoEnable = true;
        // userDetail.currentUserPhotoEnable = true;
        userDetail.commentIt = " ";
    };




    $scope.onVote = function(userDetail,type){
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;
        //var Vote = '';
        console.log(model);

        if(model == 'video_attachments'){
            var vote = {
                type:type,
                model:model,
                id:id
            };

        }
        else if(model == "microposts"){
            var vote = {
                type:type,
                model:model,
                id:id

            };

        }
        else if(model == "attachments"){
            var vote = {
                type:type,
                model:model,
                id:id

            };
        }
        else if(model == "posts"){
                var vote = {
                    type:type,
                    model:model,
                    id:id
                };
        }

            var Vote = CommonVoteService.commonVote();
            //var Vote = VoteUrlService.vote(model,id);
            var voted = Vote.save(vote);
            userDetail.vote = voted;




    }



        //this is used for deleting the posted posts and videos by the user
    $scope.removeUserDetail = function(userDetail,index){
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;

        //alert("index "+index);

        $scope.usersDetails.splice(index, 1);

        var Activity = ActivityRemoveService.removeFeed();


        var activity = {
            trackable_id:id,
            trackable_type:model

        };


        var removed = Activity.save(activity);


    }






}
;
app.controller("AttachmentCtrl",AttachmentCtrl);

AttachmentCtrl.$inject = [];
function AttachmentCtrl(){

}
;
app.
    controller('CentreHomeController',CentreHomeController);

CentreHomeController.$inject = ['$scope','Micropost','PhotoService','VideoUploadService','VoteUrlService','$window',
            'CommentUrlService','$upload','GetInterestsService','PhotoUploadService','FileUploadService','$rootScope'];

function CentreHomeController($scope,Micropost,PhotoService,VideoUploadService,VoteUrlService,
                              $window,CommentUrlService,$upload,GetInterestsService,
                              PhotoUploadService,FileUploadService,$rootScope){
    //got this from the global declaration
    $rootScope.currentUserName = $window.user;

    $window.onload = function(){
        PhotoService.getPhoto().success(function(data){
            $scope.myPhoto =  data;
        });
    };

    $scope.currentUserId = $window.current_user_id


    //**********************************************************************************************************//
    //method for writing new microposts
    $scope.microposts = [];
    //$scope.myPhoto = photo;
    $scope.post = function(){

        //note:: the success has to be used in this controller itself in order to work
      /*  if($scope.myPhoto == null){
            PhotoService.getPhoto().success(function(data){
                $scope.myPhoto =  data;
            });
        }*/
        if($scope.data!=null){

            var micropost = $scope.data.micropost;
            var post = new Micropost({
                content:micropost
            });
            post.$save();
            $scope.microposts.push(post);
            $scope.data.micropost = " ";
        }
        else{
            alert("Hi, there, we didn't think you are having nothing");
        }
    };
   //***********************************************************************************************************//
    //method for comment section

    $scope.micropostComment = function(micropost){

      var comment = {
          content:micropost.commentIt
      };
       var model = "microposts";
        var id = micropost.micropost.id;
       var Comment = CommentUrlService.getUrl(model,id);


        var commentable = Comment.save(comment);
        if(!micropost.comments){
            micropost.comments = [];
        }
        micropost.comments.push(commentable);
        micropost.commentIt = " ";
    };


     $scope.onVoteUp = function(micropost){
            console.log(micropost);
           var vote = {
               type:"up"
           };
         var model = "microposts";
         var id = micropost.micropost.id;
         var Vote = VoteUrlService.vote(model,id);

         var voted = Vote.save(vote);

         $scope.vote = voted;

     };


    //***********************************************************************************************************//

    //this method is for photo upload using angular-file-upload
    $scope.onFileSelect = function($files){
        PhotoUploadService.uploadPhoto($files,$scope.myModelObj,$scope.upload);
        $scope.datas = PhotoUploadService.getUploadedDatas();
    };
    //**********************************************************************************************************//

    //this is used for angular file upload


    $scope.toggleUpload = function(){
        $scope.flag2 = true;
    };
    //this is where the file attachment takes place
    $scope.onFileAttach = function($files){
        FileUploadService.attachFile($files,$scope.description,$scope.upload,$scope.interestIds);
        $scope.attachments = FileUploadService.getUploadedAttachment();
        $scope.description = " ";
        $scope.fileAttach = " ";
    };
    //comment part for the file attachment section
    $scope.attachmentComment = function(attachment){
        var comment = {
            content:attachment.commentIt
        };
        var model = "attachments";
        var id = attachment.getFiles.id;

        var Comment = CommentUrlService.getUrl(model,id);
        var commentable = Comment.save(comment);
        if(!attachment.comments){
            attachment.comments = [];
        }
        attachment.comments.push(commentable);
        attachment.commentIt = " ";
    };

    //********************************************************************************************************//

        //this is used for angular file upload


        $scope.toggleVideoUpload = function(){
            $scope.flag4 = true;
        };
        //this is where the file attachment takes place
        $scope.onVideoAttach = function($files){


            //sending the modal id for closing
            var closeVideoModal = angular.element("#videoAttachment");
            VideoUploadService.attachFile($files,$scope.videoDesc,$scope.upload,$scope.interestIds,closeVideoModal);

            for(var i = 0;i<$scope.interestIds.length ; i++){
                $scope.isDisabled[$scope.interestIds[i]]= false;
            }

            $scope.videoAttachs = VideoUploadService.getUploadedAttachment();
            $scope.videoDesc = " ";
            //$scope.fileAttach = " ";
        };

        //comment part for the VIDEO attachment section


        $scope.videoComment = function(vadeo){
            var comment = {
                content:vadeo.commentIt
            };
            var model = "video_attachments";
            var id = vadeo.getFiles.id;

            var Comment = CommentUrlService.getUrl(model,id);
            var commentable = Comment.save(comment);
            if(!vadeo.comments){
                vadeo.comments = [];
            }
            vadeo.comments.push(commentable);
            vadeo.commentIt = " ";
        };



        // this is for voting the videos
    $scope.onVideoVoteUp = function(video){

        console.log(video);
        var model = "video_attachments";
        var id = video.getFiles.id;
        var vote = {
            type:"up",
            id:id,
            model:model
        };

        var Vote = VoteUrlService.voteVideo();

        var voted = Vote.save(vote);

        $scope.videoVote = voted;

    };





    //******************************************************************************************************//


        //this is used for getting interests and to map interests for uploads
        $scope.interestIds = [];
        $scope.interestMapper = [];
        $scope.interests = [];
        $scope.loadInterests = function(){
            if($scope.interests.length == 0){
                GetInterestsService.getInterest().success(function(data){
                    $scope.interests = data;
                  angular.forEach(data,function(value,key){
                        //console.log(value);
                      angular.forEach(value,function(v,k){
                          //console.log(v.id);
                          //console.log(v.name);
                          $scope.interestMapper.push(v);

                      })
                  });


            })
            }
        };
        $scope.isDisabled = {};
        $scope.toggleInterest = function(id){
            $scope.interestIds.push(id);
            $scope.isDisabled[id] = true;
        }


}








;
app.controller("ChatCtrl", ChatCtrl)

ChatCtrl.$inject = ['$scope','MessageService'];

function ChatCtrl($scope,MessageService){

    $scope.messages = [];
    $scope.sendMessage = function(){
        //alert($scope.data.message);
        $scope.messages.push($scope.data.message);

        var message =
            {content:$scope.data.message};

        message = MessageService.save(message);

        $scope.messages.push(message);

        $scope.data.message = " ";
        //alert(message);

    }
}
;
app.controller("LeftHomeController",LeftHomeController);
LeftHomeController.$inject = ['$scope','ProfilePhotoUploadService'];


function LeftHomeController($scope,ProfilePhotoUploadService){
    /* $scope.changePic = function(){

     }*/

    $scope.togglePhoto1 = true;
    $scope.togglePhoto2 = false;


    //sending the modal id for closing
    var closePicModal = angular.element("#changePicAttachment");


    $scope.onPhotoAttach = function($files){

        ProfilePhotoUploadService.uploadPhoto($files,closePicModal);

        var ass = ProfilePhotoUploadService.getUploadedDatas();
        $scope.profile_photo = ass;
        $scope.togglePhoto1 = false;
        $scope.togglePhoto2 = true;
    }
}
;
//used in signed_index.html.erb in places
app.controller("PlaceCtrl",PlaceCtrl);

PlaceCtrl.$inject=['$scope','$window','PlaceFavouriteService','PlaceServices','$timeout'];
        function PlaceCtrl($scope,$window,PlaceFavouriteService,PlaceServices,$timeout){
    //this is used for pagination
    var counterPlace = 0;

    //this variable is used stopping the calls made to the server end while scrolling
    var flag = true;

    $scope.interestedPlaces =[];

 /*********************************************************************************************************************/

   //This is used for favourite rates(Heart shaped button)
   $scope.favourite = function(place){

       PlaceFavouriteService.getPlaceUrl(place.id).success(function(data){
           if(data.success) {
               //alert("asda");
               place.favourite =place.favourite+1;
           }
       });
   };

 /*********************************************************************************************************************/
  // This is used to fetch the places for the pressed interest
    $scope.fetchPlaces = function(id){
        // alert("Interest Id is "+id);
        PlaceServices.getNextInterest(id).success(function(data){
            $scope.interestedPlaces = [];
            flag = true;
            counterPlace = 1;
            $scope.interestedPlaces.push(data);
        });
    };

   // used to load the next set of values using ng-infinite scroll pagination
   //this function calls to the server automatically when the page is loaded
   $scope.myPagingFunction = function(){

       if(flag){
           counterPlace += 1;
           $timeout(function(){
               PlaceServices.getNextPage(counterPlace).success(function(data){
                   $scope.interestedPlaces.push(data);
                   flag = data.success;
                   return data;
               });
           },1);

       }
   };


/**********************************************************************************************************************/

}

//used for place/show.html.erb in places
app.controller("PlaceShowCtrl",PlaceShowCtrl);
PlaceShowCtrl.$inject = ['$scope','StoryServices','PlaceDetailServices'];
function PlaceShowCtrl($scope,StoryServices,PlaceDetailServices){
        var flag = false;
        var userCounter =0;
        $scope.toggle = false;
        //alert("ads");
        //$scope.user_rating = 2;
        //passed from the controller
        $scope.current_user_id = gon.user_id;

        //pased from the controller
        if(gon.rating){
            $scope.user_rating = gon.rating.rate;
            $scope.rating_user_id = gon.rating.user_id
        }
        if($scope.user_rating==null){
            $scope.user_rating=0;
        }
       //passed from the controller(gon variables are declared in the controller)
       var trackable_type = gon.type;
       var trackable_id  = gon.id;



        //console.log(type+" rating "+$scope.user_rating+" trackable_id="+id);

        //this is a universal rating routing url
        $scope.rating_url = "/rating";
        $scope.trackable_id = trackable_id;
        $scope.trackable_type = trackable_type;
        //$scope.trip_date="";


      $scope.createStory = function(placeId){
            var story = {
                story_name:$scope.story_name,
                story_description:$scope.story_description,
                place_id:placeId
            };

          story = StoryServices.setStoryUrl().save(story);

      };

        // for getting more details
        $scope.detailDescription = null;
        $scope.detailShow = false;
        $scope.getPlaceDetails = function(){
            //console.log("asdasdasdasdasdadsdasdas"+gon.id);
            PlaceDetailServices.getDetailDescription(trackable_id).success(function(data){
                $scope.detailDescription = data;
                //console.log($scope.detailDescription);
                $scope.detailShow = true;
            });


        }




    }

    //Used in places/index.html.erb
    app.controller("PlaceNewController",PlaceNewController);
PlaceNewController.$inject = ['$scope','PlaceVideoUploadService'];

function PlaceNewController($scope,PlaceVideoUploadService){
        $scope.onVideoAttach = function($files,placeId){
            console.log(placeId);
            PlaceVideoUploadService.attachFile($files,$scope.description,$scope.upload,placeId);
            $scope.attachments = PlaceVideoUploadService.getUploadedAttachment();
            $scope.description = " ";
            $scope.videoAttach = " ";
        }


    }

app.controller("PlaceUnsignedCtrl",PlaceUnsignedCtrl);
PlaceUnsignedCtrl.$inject=['$scope','UnsignedPlaceServices'];

function PlaceUnsignedCtrl($scope,UnsignedPlaceServices){

    $scope.places =[];

    $scope.getPlaces = function(){
        UnsignedPlaceServices.getRecentPlaces().success(function(data){
            $scope.places.push(data);
        });
    };




    $scope.currentIndex = 0;

    $scope.setCurrentSlideIndex = function (index) {
        $scope.currentIndex = index;
    };

    $scope.isCurrentSlideIndex = function (index) {
        return $scope.currentIndex === index;
    };


}
;
app.controller('RightHomeController', RightHomeController);
RightHomeController.$inject = [
  '$scope',
  'SuggestionServices',
  'UserServices'
];
function RightHomeController($scope, SuggestionServices, UserServices) {
  $scope.test = 'Hello world';
  $scope.affinities = [];
  var local = [];
  SuggestionServices.getFriendSuggestions().success(function (data) {
    angular.forEach(data, function (v, k) {
      local.push(v);
    });
    var lo = local[0];
    for (var i = 0; i < lo.length; i++) {
      $scope.affinities.push(lo[i]);
    }
  });
  $scope.relate = function (user_id, affinity_id, index) {
    var other_id = {
        other_id: user_id,
        affinity_id: affinity_id
      };
    var result = UserServices.setRelation().save(other_id);
    $scope.affinities.splice(index, 1);
  };
}
;app.controller('SearchCtrl', SearchCtrl);
SearchCtrl.$inject = [
  '$scope',
  '$window'
];
function SearchCtrl($scope, $window) {
}
;app.controller("InterestsCtrl",InterestsCtrl);
InterestsCtrl.$inject = ['$window','$scope','AddInterestService','UserServices'];
function InterestsCtrl($window,$scope,AddInterestService,UserServices){

    $scope.interstIds = [];
    $scope.currentUser = $window.user
;
    var user_id = gon.user_id;
    $scope.isDisabled = {};
    $scope.addInterest = function(interestId){
            //var interestId = interest.id;
            var AddInterest = AddInterestService.interestUrl();
            var id = {
                id:interestId,
                user_id:user_id
            };

        $scope.isDisabled[interestId] = true;

            //alert("lllllll");
            var added = AddInterest.save(id);
            //var ss = "data"+id;
            $scope.added = added;
            //$scope."data"+id = true;
            $scope.interstIds.push(interestId);
                 var ids =0;
            $scope.flag = function(id){

            }


    };


    var workPlaceElement = angular.element("#user_workplace_tokens");

    workPlaceElement.change(function(){
        $scope.$apply(function(){
            $scope.user_college = workPlaceElement.val();
        });
    });


    //getting the locations from the locations ...we are using the jquery token input technique here
    var locationElement = angular.element("#user_location_tokens");

    locationElement.change(function(){
        $scope.$apply(function(){
            $scope.user_location = locationElement.val();
            //console.log($scope.user_location);
        });
    });


    //triggered when the Done button is pressed
    $scope.addWorkPlace = function(){
          //alert($scope.user_college);
            //console.log($scope.user_college);

            var workplace = {
                workplace_ids:$scope.user_college,
                user_id: user_id,
                location_ids:$scope.user_location
            };

            workplace = UserServices.setWorkPlace().save(workplace);

    }




}
;
//trips/new.html
app.controller("TripCtrl",TripCtrl);
TripCtrl.$inject = ['$scope','UserServices'];

function TripCtrl($scope,UserServices){
    var userCounter =0;
    $scope.users = null;
    $scope.inviteFollowers= function(){
        userCounter += 1;

        if($scope.users == null){
        UserServices.getFollowers(userCounter).then(function(data){
            console.log(data) ;

            $scope.users = data;

        });
        }

    };

    //This is used for the checkbox
    $scope.userIds=[];
    $scope.toggleSelection = function toggleSelection(id) {
        var idx = $scope.userIds.indexOf(id);

        // is currently selected
        if (idx > -1) {
            $scope.userIds.splice(idx, 1);
        }
        // is newly selected
        else {
            $scope.userIds.push(id);
        }
        console.log($scope.userIds);
    };

}
    //trips/index.html.erb
    app.controller("TripIndexCtrl",TripIndexCtrl);
TripIndexCtrl.$inject = ['$scope'];

function TripIndexCtrl($scope){

        $scope.unjoinToggleOut = false;
        $scope.joinToggleOut = false;
        $scope.acceptance = true;


        $scope.join = function(id){
            $scope.acceptance = !$scope.acceptance;
            $scope.unjoinToggleOut = !$scope.unjoinToggleOut
        };

        $scope.unjoin = function(id){
            $scope.joinToggleOut = !$scope.joinToggleOut;
            $scope.acceptance = !$scope.acceptance;
        };

        //$scope.trip = [];
        $scope.trips = gon.trips;
          // $scope.ss = "asdsa";


       /* angular.forEach($scope.trips,function(v,k){
           //console.log(v.id);
           var button = angular.element("#button_"+v.id);

        });*/

        //var button = angular.element("#button")


    }
;
app.controller("VideoCtrl",VideoCtrl);
VideoCtrl.$inject = ['$scope','$window','GetVideosService'];

function VideoCtrl($scope,$window,GetVideosService){
   $window.onload = function(){
        //alert("hello world");
          $scope.videos=[];
          $scope.videosDetail = [];
       GetVideosService.getVideoUrl().success(function(data){

            // I got the object like this [[[]]] so using three loops
           angular.forEach(data,function(value,key){
               //console.log(value);
               angular.forEach(value,function(val,k){
                   //console.log(val);
                   angular.forEach(val,function(v,k){
                       //console.log(v);
                       //trying to remove the duplicates
                        if($scope.videos.indexOf(v.file.url) == -1){
                            $scope.videos.push(v.file.url);
                            $scope.videosDetail.push(v);
                        }

                   })
               })
           });


           angular.forEach($scope.videosDetail,function(v,k){
               //console.log(v);
           })


       })
   }
}
;
app.directive("datepickers",datepickers);
datepickers.$inject =[];

function datepickers(){
    return {
        restrict:"A",
        transclude:true,
        template:"<input type='text' placeholder='Date'  required ng-model='trip_date'> ",

        link:function(scope,element,attr){
            var nowTemp = new Date();
            var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate());

            var d = new Date();
            var curr_date = d.getDate();
            var curr_month = d.getMonth() + 1; //Months are zero based
            var curr_year = d.getFullYear();
            var dd = curr_date + "/" + curr_month + "/" + curr_year;

            element.bind("click",function(){
                element.fdatepicker({
                    onRender: function (date) {
                        return date.valueOf() < now.valueOf() ? 'disabled' : '';
                    }
                }).data('datepicker');
            });


        }
    }
}
;

app.directive("flow",flow);
flow.$inject = [];
function flow(){
    return {


        link:function(scope, element, attrs) {
            return scope.$watch('showcast', function(url) {
                if (url) {
                    return element.flowplayer({
                        playlist: [
                            [
                                {
                                    mp4: url
                                }
                            ]
                        ],
                        ratio: 9 / 14,
                        autoPlay: true,
                        autoBuffering: true
                    });
                }
            });
        },

        controller:['$scope',function($scope){
            $scope.showcast = null;
            $scope.showVideo=function(url){
                $scope.showcast = url
            }
        }]

    }
}

;
app.directive('micro', micro);
function micro() {
  return {
    restrict: 'E',
    template: '<div>This is a miracle</div>',
    link: function (scope, element, attr) {
    }
  };
}
;app.directive("orbitdirective",orbitdirective);

function orbitdirective(){
    var linker = function(scope,element,attrs){
        element.foundation();
        //element.foundation.orbit(scope.$eval(attrs.orbitdirective));
    };

   return {
        restrict:'A',
        link:linker
   }
}
;
var mod;
mod = angular.module('custom-scroll', []);
mod.directive('customScroll', customScroll);
customScroll.$inject = [
  '$rootScope',
  '$window',
  '$timeout',
  '$document'
];
function customScroll($rootScope, $window, $timeout, $document) {
  return {
    link: function (scope, elem, attrs) {
      var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
      $window = angular.element($window);
      scrollDistance = 0;
      if (attrs.infiniteScrollDistance != null) {
        scope.$watch(attrs.infiniteScrollDistance, function (value) {
          return scrollDistance = parseInt(value, 30);
        });
      }
      scrollEnabled = true;
      checkWhenEnabled = false;
      if (attrs.infiniteScrollDisabled != null) {
        scope.$watch(attrs.infiniteScrollDisabled, function (value) {
          scrollEnabled = !value;
          if (scrollEnabled && checkWhenEnabled) {
            checkWhenEnabled = false;
            return handler();
          }
        });
      }
      handler = function () {
        var elementBottom, remaining, shouldScroll, windowBottom;
        var document = angular.element($document);
        windowBottom = $window.height() + document.height() + $window.scrollTop();
        elementBottom = elem.offset().top + elem.height();
        remaining = elementBottom - windowBottom;
        shouldScroll = $window.scrollTop() > document.height() - $window.height() - 15;
        if (shouldScroll && scrollEnabled) {
          if ($rootScope.$$phase) {
            return scope.$eval(attrs.infiniteScroll);
          } else {
            return scope.$apply(attrs.infiniteScroll);
          }
        } else if (shouldScroll) {
          return checkWhenEnabled = true;
        }
      };
      $window.on('scroll', handler);
      scope.$on('$destroy', function () {
        return $window.off('scroll', handler);
      });
      return $timeout(function () {
        if (attrs.infiniteScrollImmediateCheck) {
          if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
            return handler();
          }
        } else {
          return handler();
        }
      }, 0);
    }
  };
}
;app.directive("tripJoin", tripJoin);
tripJoin.$inject = ['TripServices'];
function tripJoin(TripServices) {
    return {
        restrict: 'A',
        scope: {
            trip_id: '=tripId',
            trip_acceptance:"=tripAcceptance",
            trip_invitee:"=tripInvitee"

        },
        template:"<input type='button' value='' class='button round'> ",
        replace: true,
        transclude: true,

        controller: function($scope, $attrs, $http) {
           // console.log($scope.trip_acceptance)


            $scope.setAcceptance = function(element){
                var acceptanceUrl = TripServices.setTripAcceptanceUrl();
                $scope.acceptance= !$scope.acceptance;
                var acceptance = {
                    trip_id:$scope.trip_id,
                    trip_acceptance:$scope.acceptance,
                    trip_invitee:$scope.trip_invitee
                };

                var acceptance = acceptanceUrl.save(acceptance);

                if($scope.acceptance==true){
                    element.val('Unjoin');


                }
                else{
                    element.val('Join');
                }

                $scope.$apply();
            }

        },
        link: function(scope, iElem, iAttrs) {

            // console.log(scope.trip_acceptance);
             scope.acceptance = scope.trip_acceptance;
            if(scope.trip_acceptance==true){
                iElem.val('Unjoin');
            }
            else if(scope.trip_acceptance==false){
                iElem.val('Join');
            }


              iElem.bind('click',function(){
                     //alert(scope.trip_id);

                  scope.setAcceptance(iElem);

              });


        }
    };
}
;
app.factory("ActivityIndexService",ActivityIndexService);

ActivityIndexService.$inject = ['$http'];

function ActivityIndexService($http){

       return  {getActivities: function(offsets){
           var url = "/index_pagination?page="+offsets;
           return $http.get(url);
       }
       }


}
    app.factory("ActivityOtherUserService",ActivityOtherUserService);

ActivityOtherUserService.$inject = ['$http'];

function ActivityOtherUserService($http){
        return {
            getFeed:function(user_id,trackable_id,trackable_type){
                var tr_type = angular.lowercase(trackable_type);
                var url = "/show_others_details?trackable_id="+trackable_id+"&user_id="+user_id+"&trackable_type="+trackable_type;
                return $http.get(url);
            }
        }
}
app.factory("ActivityRemoveService",ActivityRemoveService);


ActivityRemoveService.$inject = ['$resource'];


function ActivityRemoveService($resource){
    return {
        removeFeed:function(){
            return $resource("/activities/remove_activity");
        }
    }
}
;
app.factory("FileUploadService",FileUploadService);
FileUploadService.$inject = ['$upload'] ;
function FileUploadService($upload){
    var datas = [];
    return {
        attachFile : function($files,myModelObj,upload,interestIds) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/attach_file',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj,interestIds:interestIds},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    }
                }).success(function(data, status, headers, config) {
                        // file is uploaded successfully
                        console.log(data);
                        datas.push(data);
                        alert("uploded successfully");

                    }).error(function(data, status, headers, config) {
                        // file is uploaded successfully
                        console.log(data);


                    })
            }
        },

        getUploadedAttachment:function(){
            return datas;
        }


    }

}
    app.factory("VideoUploadService",VideoUploadService);
VideoUploadService.$inject = ['$upload','ngProgress','$timeout'];

function VideoUploadService($upload,ngProgress,$timeout){
        var datas = [];
        return {
            attachFile : function($files,myModelObj,upload,interestIds,closeVideoModal) {
                $('.close-reveal-modal',closeVideoModal).click();
                ngProgress.color('white');
                ngProgress.height('2em');
                ngProgress.start();
                //$files: an array of files selected, each file has name, size, and type.
                for (var i = 0; i < $files.length; i++) {
                    var $file = $files[i];
                    upload = $upload.upload({
                        url: '/attach_video',
                        // method: POST or PUT,
                        // headers: {'headerKey': 'headerValue'}, withCredential: true,
                        data: {myObj: myModelObj,interestIds:interestIds},
                        file: $file,
                        //(optional) set 'Content-Desposition' formData name for file
                        //fileFormDataName: myFile,
                        progress: function(evt) {


                           // $timeout(ngProgress.complete(), 1000);

                           // console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                            ngProgress.set(parseInt(100.0 * evt.loaded / evt.total));


                        }
                    }).success(function(data, status, headers, config) {
                            // file is uploaded successfully

                         ngProgress.complete();
                          //  console.log(data);
                            datas.push(data);
                            ngProgress.stop();
                            //alert("uploded successfully");

                        //using foundations reveal modal

                        }).error(function(data, status, headers, config) {
                            // file is uploaded successfully
                        alert("Sorry couldn't upload");
                            ngProgress.complete();
                            console.log(data);
                            ngProgress.stop();
                        //using foundations reveal modal
                        $('.close-reveal-modal',closeVideoModal).click();
                        })
                }
            },

            getUploadedAttachment:function(){
                return datas;
            }


        }

    }
    app.factory("GetVideosService",GetVideosService);
GetVideosService.$inject = ['$http'];

function GetVideosService($http){
        var service = {
            getVideoUrl:function(){
                return $http.get("/get_videos");
            }
        };
        return service;
    }

    //used in places/new.html.erb
    app.factory("PlaceVideoUploadService",PlaceVideoUploadService);
PlaceVideoUploadService.$inject = ['$upload'];
function PlaceVideoUploadService($upload){
        var datas = [];
        return {
            attachFile : function($files,myModelObj,upload,placeId) {
                //$files: an array of files selected, each file has name, size, and type.
                for (var i = 0; i < $files.length; i++) {
                    var $file = $files[i];
                    upload = $upload.upload({
                        url: '/attach_place_video',
                        // method: POST or PUT,
                        // headers: {'headerKey': 'headerValue'}, withCredential: true,
                        data: {myObj: myModelObj,placeId:placeId},
                        file: $file,
                        //(optional) set 'Content-Desposition' formData name for file
                        //fileFormDataName: myFile,
                        progress: function(evt) {
                            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                        }
                    }).success(function(data, status, headers, config) {
                            // file is uploaded successfully
                            console.log(data);
                            datas.push(data);
                            alert("uploded successfully");

                        }).error(function(data, status, headers, config) {
                            // file is uploaded successfully
                            console.log(data);


                        })
                }
            },

            getUploadedAttachment:function(){
                return datas;
            }


        }

    }
;
app.factory('MessageService', MessageService);
MessageService.$inject = ['$resource'];
function MessageService($resource) {
  var service = $resource('/messages/:id.json', { id: '@id' }, {});
  return service;
}
;app.factory('CommentUrlService', CommentUrlService);
CommentUrlService.$inject = ['$resource'];
function CommentUrlService($resource) {
  return {
    getUrl: function (model, id) {
      var url = '/' + model + '/' + id + '/comments/:id.json';
      return $resource(url, { id: '@id' });
    }
  };
}
;app.factory("AddInterestService",AddInterestService);


AddInterestService.$inject = ['$resource'];
function AddInterestService($resource){
  /*  var AddInterest = $resource('interestship/:id.json',
        {id:'@id'},
        {}
    );
    return AddInterest;
*/

    var service = {
        interestUrl:function(){
            var url = "/interestship";
            return $resource(url);
        }
    };

    return service;

}
app.factory("GetInterestsService",GetInterestsService);
GetInterestsService.$inject = ['$http'];

function GetInterestsService($http){
        var service = {
            getInterest:function(){
                return $http.get("/show_interests/get_index");
            }
        };
        return service;
    }
;
app.factory('Micropost', Micropost);
Micropost.$inject = ['$resource'];
function Micropost($resource) {
  var Micropost = $resource('microposts/:id.json', { id: '@id' }, {});
  return Micropost;
}
;app.factory("PlaceServices",PlaceServices);
PlaceServices.$inject = ['$http'];

function PlaceServices($http){

        var service = {

//        var url = "/places/get_other_places"
//        return $http.get(url);
          getPlacesUrl :function(interest_id){
              return $http.get("/places/signed_index?interest_id="+interest_id);
          },

          getPaginationUrl:function(offset){
              return $http.get("/places/signed_index?page="+offset);
          },
          getNextPage:function(counter){
                return $http.get("/places/getPlaces?page="+counter);
          },
            getNextInterest:function(id){
                return $http.get("/places/getPlaces?interest_id="+id);
            }


        };

        return service;

}
app.factory("PlaceFavouriteService",PlaceFavouriteService);
PlaceFavouriteService.$inject = ['$http'];

function PlaceFavouriteService($http){

        var service = {
        getPlaceUrl:function(id){
            return $http.get("/places/favourite?place="+id);
            }
        };

        return service;

}/*.factory("PlaceAndTripServices",function($resource){
       var service ={
           getPlaceAndTripUrl:function(){
               return $resource("/trips/create_trip/:id.json",{id:"@id"});
           }
       }

        return service;

    });*/

//Newly added after getting al services into one file
app.factory("PlaceDetailServices",PlaceDetailServices);
PlaceDetailServices.$inject = ['$http'];
function PlaceDetailServices($http){
    var service ={
        getDetailDescription:function(trackable_id){
            return $http.get("/places/getDetailDescription?place_id="+trackable_id);
        }
    };
    return service;
}


//Used in unsigned html page /static_pages/home part
app.factory("UnsignedPlaceServices",UnsignedPlaceServices);
UnsignedPlaceServices.$inject=["$http"];

function UnsignedPlaceServices($http){
    return {
        getRecentPlaces:function(){
            return $http.get("/static_pages/get_place_photos");
        }
    }
}

;
app.factory("StoryServices",StoryServices);
StoryServices.$inject = ['$resource'];
function StoryServices($resource){
    var service = {
        setStoryUrl:function(){
            return $resource("/stories/create_story/:id.json",{id:'@id'})
        }
    };

    return service;
}
;
app.factory('TripServices', TripServices);
TripServices.$inject = ['$resource'];
function TripServices($resource) {
  var service = {
      setTripAcceptanceUrl: function () {
        return $resource('/trips/acceptance:id.json', { id: '@id' });
      }
    };
  return service;
}
;app.factory("UserServices",UserServices);
UserServices.$inject = ['$resource','$http'];
function UserServices($resource,$http){
          var service = {
              setWorkPlace:function(){
                  return $resource("/users/create_user_and_work/:id.json",{id:"@id"})
              },

             getFollowers: function(counter){
                 return $http.get("/getFollowers?page="+counter);
             },

             setRelation: function(){
                 return $resource("/users/relate/:id.json", {id:"@id"})
             }

          };

    return service;
}
;
//var op = angular.module("app.UtilityServices",[]);

    app.factory("PhotoService",PhotoService);

PhotoService.$inject = ['$http'];
function PhotoService($http){
       return {
            getPhoto:function(){
                return $http.get("/user/getphoto");
            }
        }
    }

    app.factory("CurrentUserService",CurrentUserService);

CurrentUserService.$inject = ['$http'];
function CurrentUserService($http){
            return {
                getCurrentUser:function(){
                    return $http.get("/user/currentuser");
                }
            }
    }


// note there is sum difference between above and below factories
    app.factory("PhotoUploadService",PhotoUploadService);


PhotoUploadService.$inject = ['$upload'];

function PhotoUploadService($upload){
        var datas = [];
       return {


           uploadPhoto : function($files,myModelObj,upload) {
               //$files: an array of files selected, each file has name, size, and type.
               for (var i = 0; i < $files.length; i++) {
                   var $file = $files[i];
                   upload = $upload.upload({
                       url: '/upload',
                       // method: POST or PUT,
                       // headers: {'headerKey': 'headerValue'}, withCredential: true,
                       data: {myObj: myModelObj},
                       file: $file,
                       //(optional) set 'Content-Desposition' formData name for file
                       //fileFormDataName: myFile,
                       progress: function(evt) {
                           console.log('percent: ');
                       }
                   }).success(function(data, status, headers, config) {
                           // file is uploaded successfully
                           //console.log(data);
                           datas.push(data);
                           //alert("uploded successfully" +data);

                       }).error(function(data, status, headers, config) {
                           // file is uploaded successfully
                           console.log(data);


                       })
               }
           },

           getUploadedDatas:function(){
                   return datas;
           }


       }

    }
         //used for voting the microposts
        app.factory("VoteUrlService",VoteUrlService);
VoteUrlService.$inject = ['$resource'];
function VoteUrlService($resource){
            var service = {
                vote:function(model,id){
                    var url = "/"+model+"/"+id+"/vote/:id.json";
                    return $resource(url,{id:"@id"});
                },

                voteVideo:function(){
                    return $resource("/attachments/vote_video_attachment");
                }

            };

            return service;
        }
app.factory("flowPlayerService",flowPlayerService);
flowPlayerService.$inject = [];
function flowPlayerService(){
            var service = {
                flowPlayer:function(){
                    $f("player", "/flowplayer.swf" ,{
                        clip:  {
                            autoPlay: false,
                            autoBuffering: true
                        },
                        plugins: { // load one or more plugins
                            controls: { // load the controls plugin

                                // always: where to find the Flash object
                                url: '/flowplayer.controls-tube-3.2.15.swf'
                                // display properties
                                ,
                                tooltips: { // this plugin object exposes a 'tooltips' object
                                    buttons: true,
                                    fullscreen: 'Enter Fullscreen mode'
                                }
                            }
                        }
                    });
                }
            };

            return service;
        }
        app.factory("ProfilePhotoUploadService",ProfilePhotoUploadService);

ProfilePhotoUploadService.$inject = ['$upload','ngProgress'];
function ProfilePhotoUploadService($upload,ngProgress){
            var datas = [];

            return {


                uploadPhoto : function($files,upload,closePicModal) {
                    ngProgress.color('white');
                    ngProgress.height('2em');
                    ngProgress.start();
                    //$files: an array of files selected, each file has name, size, and type.
                    for (var i = 0; i < $files.length; i++) {
                        var $file = $files[i];
                        upload = $upload.upload({
                            url: '/user/profile_upload',
                            // method: POST or PUT,
                            // headers: {'headerKey': 'headerValue'}, withCredential: true,
                           // data: {myObj: myModelObj},
                            file: $file,
                            //(optional) set 'Content-Desposition' formData name for file
                            //fileFormDataName: myFile,
                            progress: function(evt) {

                                ngProgress.set(parseInt(100.0 * evt.loaded / evt.total));
                            }
                        }).success(function(data, status, headers, config) {
                                // file is uploaded successfully
                               // console.log(data);
                                  if(datas.length !=0){
                                      datas.pop();

                                  }
                                datas.push(data);
                               // alert("uploded successfully" );
                            ngProgress.complete();
                            //console.log(data);
                            //datas.push(data);
                            ngProgress.stop();
                            $('.close-reveal-modal',closePicModal).click();

                            }).error(function(data, status, headers, config) {
                                // file is uploaded successfully
                                console.log(data);


                            })
                    }
                },

                getUploadedDatas:function(){
                    return datas;
                }


            }

        }

app.factory("SuggestionServices",SuggestionServices);
SuggestionServices.$inject = ['$http'];

function SuggestionServices($http){
            var service ={
                getFriendSuggestions:function(){
                    return $http.get("/utility/getSuggestions");
                }
            };
            return service;
        }




app.factory("CommonVoteService",CommonVoteService);
CommonVoteService.$inject=['$resource'];

function CommonVoteService($resource){
            var service = {
                commonVote:function(){
                    return $resource("/utility/commonVote");
                }
            };
        return service;
}


;
$('#masonry-container').masonry({
  columnWidth: function (containerWidth) {
    return containerWidth / 6;
  }
});$('#place_interest_tokens').tokenInput('/interests.json', { preventDuplicates: true }, { prePopulate: $('#place_interest_tokens').data('load') });
$('#trip_place_tokens').tokenInput('/places.json', { preventDuplicates: true }, { prePopulate: $('#trip_place_tokens').data('load') });
$('#trip_from_tokens').tokenInput('/places.json', {
  preventDuplicates: true,
  prePopulate: $('#trip_from_tokens').data('load'),
  onAdd: function (item) {
    if ($('#trip_from_tokens').tokenInput('get').length > 1) {
      $('#trip_from_tokens').tokenInput('clear');
    }
    $('#trip_from_tokens').tokenInput('add', item);
  }
});
$('#user_location_tokens').tokenInput('/locations.json', {
  token_limit: 1,
  hintText: 'Locations',
  preventDuplicates: true,
  onAdd: function (item) {
    if ($('#user_location_tokens').tokenInput('get').length > 1) {
      $('#user_location_tokens').tokenInput('clear');
    }
    $('#user_location_tokens').tokenInput('add', item);
  }
});$('#post_interest_tokens').tokenInput('/interests.json', { preventDuplicates: true }, { prePopulate: $('#post_interest_tokens').data('load') });$('#user_workplace_tokens').tokenInput('/workplaces.json', {
  token_limit: 1,
  hintText: 'College/company name',
  preventDuplicates: true,
  onAdd: function (item) {
    if ($('#user_workplace_tokens').tokenInput('get').length > 1) {
      $('#user_workplace_tokens').tokenInput('clear');
    }
    $('#user_workplace_tokens').tokenInput('add', item);
  }
});
$(function () {
  $('.ui-autocomplete').addClass('f-dropdown');
  $('#query').autocomplete({ source: '/search_suggestions' });
});// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//

















































$(function(){ $(document).foundation({
    orbit: {
        animation: 'fade',
        timer_speed: 5000,
        pause_on_hover: false,
        animation_speed: 1000,
        navigation_arrows: false,
        bullets: false,
        resume_on_mouseout:false
    }
});


       // $('.scrollable').jScrollPane();




});


