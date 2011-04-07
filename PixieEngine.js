var App;
App = {};var App;
App = {};;
var Callback, Event, Guard, GuardsCollection, Machine, StateMachine, Transition;
StateMachine = function(name, object, options, block) {
  return Machine(name, object, options, block);
};
Callback = function(options, machine, block) {
  var self;
  self = {
    match: function(from_state, to_state, event) {
      if (options.to && options.from) {
        if (options.to === to_state && options.from === from_state) {
          return true;
        }
        return false;
      }
      if ((options.to === to_state) || (options.from === from_state) || (options.on === event.name)) {
        return true;
      }
    },
    run: function(params) {
      (typeof block === "undefined" || block === null) ? undefined : block.apply(machine.object, params);
      return options.run ? options.run.apply(machine.object, params) : null;
    }
  };
  return self;
};
Event = function(name, machine) {
  var guards, self, transition_for;
  guards = GuardsCollection();
  transition_for = function(params) {
    var from, to;
    if (can_fire(params)) {
      from = machine.state();
      to = guards.find_to_state(name, from, params);
      return Transition(machine, self, from, to, params);
    } else {
      return false;
    }
  };
  self = {
    transition: function(options) {
      guards.add(name, machine.object, options);
      machine.states.push(options.from);
      machine.states.push(options.to);
      return self;
    },
    can_fire: function(params) {
      if (guards.match(name, machine.state(), params)) {
        return true;
      }
      return false;
    },
    fire: function(params) {
      var transition;
      transition = transition_for(params);
      if (transition) {
        return transition.perform();
      }
      return false;
    }
  };
  return self;
};
Guard = function(name, object, options) {
  var I, self;
  I = {
    from: options.from,
    to: options.to,
    except: options.except,
    options: options,
    name: name,
    object: object
  };
  self = {
    match: function(name, from, params) {
      if (name === I.name && match_from_state(I.from)) {
        if (run_callbacks(params)) {
          return true;
        }
      }
      return false;
    },
    match_from_state: function(from) {
      if (typeof I.from === 'string') {
        if (I.from === 'any') {
          return check_exceptions(from);
        } else {
          return from === I.from;
        }
      } else {
        return I.from.each(function(from_item) {
          if (from === from_item) {
            return true;
          }
          return false;
        });
      }
    },
    check_exceptions: function(from) {
      return from !== I.except;
    },
    run_callbacks: function(params) {
      var success;
      success = true;
      if (I.options.when) {
        success = I.options.when.apply(I.object, params);
      }
      if (I.options.unless && success) {
        success = !I.options.unless.apply(I.object, params);
      }
      return success;
    }
  };
  return self;
};
GuardsCollection = function() {
  var guards, last_match, self;
  guards = [];
  last_match = null;
  self = {
    add: function(name, object, options) {
      var guard;
      guard = Guard(name, object, options);
      guards.push(guard);
      return guard;
    },
    all: function() {
      return guards;
    },
    match: function(name, from, params) {
      guards.each(function(guard) {
        var match;
        match = guard.match(name, from, params);
        if (match) {
          last_match = match;
          return guard;
        }
      });
      return false;
    },
    find_to_state: function(name, from, params) {
      var local_match;
      local_match = match(name, from, params);
      if (local_match) {
        return match.to;
      }
    }
  };
  return self;
};
Machine = function(name, object, options, block) {
  var add_event_methods, add_methods_to_object, callbacks, events, internal_state, machine_name, self, set_state, states;
  events = [];
  states = [];
  callbacks = {
    before: [],
    after: []
  };
  machine_name = name;
  internal_state = options && (options.initial ? options.initial : '');
  add_methods_to_object(name, object);
  if (block) {
    block(self);
  }
  return self;
  add_methods_to_object = function(name, object) {
    object[name] = self.state();
    object[name + '_events'] = events;
    return (object[name + '_states'] = states);
  };
  add_event_methods = function(name, object, event) {
    object[name] = function() {
      return event.fire(arguments);
    };
    return (object['can_' + name] = function() {
      return event.can_fire();
    });
  };
  set_state = function(state) {
    internal_state = state;
    return (object[machine_name] = state);
  };
  return (self = {
    event: function(name, block) {
      var event;
      event = Event(name, self);
      events.push(event);
      add_event_methods(name, object, event);
      if (block) {
        block(event);
      }
      return event;
    },
    before_transition: function(options, block) {
      var callback;
      callback = Callback(options, self, block);
      callbacks["before"].push(callback);
      return callback;
    },
    after_transition: function(options, block) {
      var callback;
      callback = Callback(options, self, block);
      callbacks["after"].push(callback);
      return callback;
    },
    state: function() {
      return internal_state;
    }
  });
};
Transition = function(machine, event, from, to, params) {
  var self;
  return (self = {
    perform: function() {
      self.before();
      machine.set_state(to);
      self.after();
      return true;
    },
    before: function() {
      return machine.callbacks['before'].each(function(callback) {
        return callback.match(from, to, event) ? callback.run(params) : null;
      });
    },
    after: function() {
      return machine.callbacks['after'].each(function(callback) {
        return callback.match(from, to, event) ? callback.run(params) : null;
      });
    },
    rollback: function() {
      return machine.set_state(from);
    }
  });
};;
/**
* Creates and returns a copy of the array. The copy contains
* the same objects.
*
* @type Array
* @returns A new array that is a copy of the array
*/
Array.prototype.copy = function() {
  return this.concat();  
};

/**
* Empties the array of it's contents. It is modified in place.
*
* @type Array
* @returns this, now emptied.
*/
Array.prototype.clear = function() {
  this.length = 0;
  return this;
};

/**
* Invoke the named method on each element in the array
* and return a new array containing the results of the invocation.
*
<code><pre>
  [1.1, 2.2, 3.3, 4.4].invoke("floor")
  => [1, 2, 3, 4]

  ['hello', 'world', 'cool!'].invoke('substring', 0, 3)
  => ['hel', 'wor', 'coo']
</pre></code>
*
* @param {String} method The name of the method to invoke.
* @param [arg...] Optional arguments to pass to the method being invoked.
*
* @type Array
* @returns A new array containing the results of invoking the 
* named method on each element.
*/
Array.prototype.invoke = function(method) {
  var args = Array.prototype.slice.call(arguments, 1);
  
  return this.map(function(element) {
    return element[method].apply(element, args);
  });
};

/**
* Randomly select an element from the array.
*
* @returns A random element from an array
*/
Array.prototype.rand = function() {
  return this[rand(this.length)];
};

/**
* Remove the first occurance of the given object from the array if it is
* present.
*
* @param {Object} object The object to remove from the array if present.
* @returns The removed object if present otherwise undefined.
*/
Array.prototype.remove = function(object) {
  var index = this.indexOf(object);
  if(index >= 0) {
    return this.splice(index, 1)[0];
  } else {
    return undefined;
  }
};

/**
* Returns true if the element is present in the array.
*
* @param {Object} element The element to check if present.
* @returns true if the element is in the array, false otherwise.
* @type Boolean
*/
Array.prototype.include = function(element) {
  return this.indexOf(element) != -1;
};

/**
 * Call the given iterator once for each element in the array,
 * passing in the element as the first argument, the index of 
 * the element as the second argument, and this array as the
 * third argument.
 *
 * @param {Function} iterator Function to be called once for 
 * each element in the array.
 * @param {Object} [context] Optional context parameter to be 
 * used as `this` when calling the iterator function.
 *
 * @returns `this` to enable method chaining.
 */
Array.prototype.each = function(iterator, context) {
  if(this.forEach) {
    this.forEach(iterator, context);
  } else {
    var len = this.length;
    for(var i = 0; i < len; i++) {
      iterator.call(context, this[i], i, this);
    }
  }

  return this;
};

Array.prototype.eachSlice = function(n, iterator, context) {
  var len = Math.floor(this.length / n);
  
  for(var i = 0; i < len; i++) {
    iterator.call(context, this.slice(i*n, (i+1)*n), i*n, this);
  }
  
  return this;
};

/**
 * Returns a new array with the elements all shuffled up.
 *
 * @returns A new array that is randomly shuffled.
 * @type Array
 */
Array.prototype.shuffle = function() {
  var shuffledArray = [];
  
  this.each(function(element) {
    shuffledArray.splice(rand(shuffledArray.length + 1), 0, element);
  });
  
  return shuffledArray;
};

/**
 * Returns the first element of the array, undefined if the array is empty.
 *
 * @returns The first element, or undefined if the array is empty.
 * @type Object
 */
Array.prototype.first = function() {
  return this[0];
};

/**
 * Returns the last element of the array, undefined if the array is empty.
 *
 * @returns The last element, or undefined if the array is empty.
 * @type Object
 */
Array.prototype.last = function() {
  return this[this.length - 1];
};

/**
 * Pretend the array is a circle and grab a new array containing length elements. 
 * If length is not given return the element at start, again assuming the array 
 * is a circle.
 *
 * @param {Number} start The index to start wrapping at, or the index of the 
 * sole element to return if no length is given.
 * @param {Number} [length] Optional length determines how long result 
 * array should be.
 * @returns The element at start mod array.length, or an array of length elements, 
 * starting from start and wrapping.
 * @type Object or Array
 */
Array.prototype.wrap = function(start, length) {
  if(length != null) {
    var end = start + length;
    var result = [];
  
    for(var i = start; i < end; i++) {
      result.push(this[i.mod(this.length)]);
    }
  
    return result;
  } else {
    return this[start.mod(this.length)];
  }
};

/**
 * Partitions the elements into two groups: those for which the iterator returns
 * true, and those for which it returns false.
 * @param {Function} iterator
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array in the form of [trueCollection, falseCollection]
 */
Array.prototype.partition = function(iterator, context) {
  var trueCollection = [];
  var falseCollection = [];

  this.each(function(element) {
    if(iterator.call(context, element)) {
      trueCollection.push(element);
    } else {
      falseCollection.push(element);
    }
  });

  return [trueCollection, falseCollection];
};

/**
 * Return the group of elements for which the iterator's return value is true.
 * 
 * @param {Function} iterator The iterator receives each element in turn as 
 * the first agument.
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array containing the elements for which the iterator returned true.
 */
Array.prototype.select = function(iterator, context) {
  return this.partition(iterator, context)[0];
};

/**
 * Return the group of elements that are not in the passed in set.
 * 
 * @param {Array} values List of elements to exclude.
 *
 * @type Array
 * @returns An array containing the elements that are not passed in.
 */
Array.prototype.without = function(values) {
  return this.reject(function(element) {
    return values.include(element);
  });
};

/**
 * Return the group of elements for which the iterator's return value is false.
 * 
 * @param {Function} iterator The iterator receives each element in turn as 
 * the first agument.
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array containing the elements for which the iterator returned false.
 */
Array.prototype.reject = function(iterator, context) {
  return this.partition(iterator, context)[1];
};

Array.prototype.inject = function(initial, iterator) {
  this.each(function(element) {
    initial = iterator(initial, element);
  });
  
  return initial;
};

Array.prototype.sum = function() {
  return this.inject(0, function(sum, n) {
    return sum + n;
  });
};

;
/**
 * CoffeeScript Compiler v1.0.1
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
this.CoffeeScript=function(){function require(a){return require[a]}require["./helpers"]=new function(){var a=this;(function(){var b,c;a.starts=function(a,b,c){return b===a.substr(c,b.length)},a.ends=function(a,b,c){var d;d=b.length;return b===a.substr(a.length-d-(c||0),d)},a.compact=function(a){var b,c,d,e;e=[];for(c=0,d=a.length;c<d;c++)b=a[c],b&&e.push(b);return e},a.count=function(a,b){var c,d;c=d=0;if(!b.length)return 1/0;while(d=1+a.indexOf(b,d))c++;return c},a.merge=function(a,c){return b(b({},a),c)},b=a.extend=function(a,b){var c,d;for(c in b)d=b[c],a[c]=d;return a},a.flatten=c=function(a){var b,d,e,f;d=[];for(e=0,f=a.length;e<f;e++)b=a[e],b instanceof Array?d=d.concat(c(b)):d.push(b);return d},a.del=function(a,b){var c;c=a[b],delete a[b];return c},a.last=function(a,b){return a[a.length-(b||0)-1]}}).call(this)},require["./rewriter"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1},u=Array.prototype.slice;a.Rewriter=function(){function a(){}a.prototype.rewrite=function(a){this.tokens=a,this.removeLeadingNewlines(),this.removeMidExpressionNewlines(),this.closeOpenCalls(),this.closeOpenIndexes(),this.addImplicitIndentation(),this.tagPostfixConditionals(),this.addImplicitBraces(),this.addImplicitParentheses(),this.ensureBalance(b),this.rewriteClosingParens();return this.tokens},a.prototype.scanTokens=function(a){var b,c,d;d=this.tokens,b=0;while(c=d[b])b+=a.call(this,c,b,d);return!0},a.prototype.detectEnd=function(a,b,c){var f,g,h,i,j;h=this.tokens,f=0;while(g=h[a]){if(f===0&&b.call(this,g,a))return c.call(this,g,a);if(!g||f<0)return c.call(this,g,a-1);if(i=g[0],t.call(e,i)>=0)f+=1;else if(j=g[0],t.call(d,j)>=0)f-=1;a+=1}return a-1},a.prototype.removeLeadingNewlines=function(){var a,b,c,d;d=this.tokens;for(a=0,c=d.length;a<c;a++){b=d[a][0];if(b!=="TERMINATOR")break}if(a)return this.tokens.splice(0,a)},a.prototype.removeMidExpressionNewlines=function(){return this.scanTokens(function(a,b,d){var e;if(a[0]!=="TERMINATOR"||!(e=this.tag(b+1),t.call(c,e)>=0))return 1;d.splice(b,1);return 0})},a.prototype.closeOpenCalls=function(){var a,b;b=function(a,b){var c;return(c=a[0])===")"||c==="CALL_END"||a[0]==="OUTDENT"&&this.tag(b-1)===")"},a=function(a,b){return this.tokens[a[0]==="OUTDENT"?b-1:b][0]="CALL_END"};return this.scanTokens(function(c,d){c[0]==="CALL_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.closeOpenIndexes=function(){var a,b;b=function(a,b){var c;return(c=a[0])==="]"||c==="INDEX_END"},a=function(a,b){return a[0]="INDEX_END"};return this.scanTokens(function(c,d){c[0]==="INDEX_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.addImplicitBraces=function(){var a,b,c,f,g;c=[],f=null,g=0,b=function(a,b){var c,d,e,f,g,h;g=this.tokens.slice(b+1,b+3+1||9e9),c=g[0],f=g[1],e=g[2];if("HERECOMMENT"===(c!=null?c[0]:void 0))return!1;d=a[0];return(d==="TERMINATOR"||d==="OUTDENT")&&((f!=null?f[0]:void 0)!==":"&&((c!=null?c[0]:void 0)!=="@"||(e!=null?e[0]:void 0)!==":"))||d===","&&c&&((h=c[0])!=="IDENTIFIER"&&h!=="NUMBER"&&h!=="STRING"&&h!=="@"&&h!=="TERMINATOR"&&h!=="OUTDENT")},a=function(a,b){return this.tokens.splice(b,0,["}","}",a[2]])};return this.scanTokens(function(g,h,i){var j,k,l,m,n,o,p;if(o=l=g[0],t.call(e,o)>=0){c.push([l==="INDENT"&&this.tag(h-1)==="{"?"{":l,h]);return 1}if(t.call(d,l)>=0){f=c.pop();return 1}if(l!==":"||(j=this.tag(h-2))!==":"&&((p=c[c.length-1])!=null?p[0]:void 0)==="{")return 1;c.push(["{"]),k=j==="@"?h-2:h-1;while(this.tag(k-2)==="HERECOMMENT")k-=2;n=new String("{"),n.generated=!0,m=["{",n,g[2]],m.generated=!0,i.splice(k,0,m),this.detectEnd(h+2,b,a);return 2})},a.prototype.addImplicitParentheses=function(){var a,b;b=!1,a=function(a,b){var c;c=a[0]==="OUTDENT"?b+1:b;return this.tokens.splice(c,0,["CALL_END",")",a[2]])};return this.scanTokens(function(c,d,e){var k,m,n,o,p,q,r,s,u;q=c[0];if(q==="CLASS"||q==="IF")b=!0;r=e.slice(d-1,d+1+1||9e9),o=r[0],m=r[1],n=r[2],k=!b&&q==="INDENT"&&n&&n.generated&&n[0]==="{"&&o&&(s=o[0],t.call(i,s)>=0),p=!1,t.call(l,q)>=0&&(b=!1),o&&!o.spaced&&q==="?"&&(c.call=!0);if(!k&&(!(o!=null?o.spaced:void 0)||!o.call&&!(u=o[0],t.call(i,u)>=0)||t.call(g,q)<0&&(c.spaced||c.newLine||t.call(j,q)<0)))return 1;e.splice(d,0,["CALL_START","(",c[2]]),this.detectEnd(d+1,function(a,b){var c,d;q=a[0];if(!p&&a.fromThen)return!0;if(q==="IF"||q==="ELSE"||q==="->"||q==="=>")p=!0;if((q==="."||q==="?."||q==="::")&&this.tag(b-1)==="OUTDENT")return!0;return!a.generated&&this.tag(b-1)!==","&&t.call(h,q)>=0&&(q!=="INDENT"||this.tag(b-2)!=="CLASS"&&(d=this.tag(b-1),t.call(f,d)<0)&&(!(c=this.tokens[b+1])||!c.generated||c[0]!=="{"))},a),o[0]==="?"&&(o[0]="FUNC_EXIST");return 2})},a.prototype.addImplicitIndentation=function(){return this.scanTokens(function(a,b,c){var d,e,f,g,h,i,j,k;i=a[0];if(i==="TERMINATOR"&&this.tag(b+1)==="THEN"){c.splice(b,1);return 0}if(i==="ELSE"&&this.tag(b-1)!=="OUTDENT"){c.splice.apply(c,[b,0].concat(u.call(this.indentation(a))));return 2}if(i==="CATCH"&&((j=this.tag(b+2))==="OUTDENT"||j==="TERMINATOR"||j==="FINALLY")){c.splice.apply(c,[b+2,0].concat(u.call(this.indentation(a))));return 4}if(t.call(n,i)>=0&&this.tag(b+1)!=="INDENT"&&(i!=="ELSE"||this.tag(b+1)!=="IF")){h=i,k=this.indentation(a),f=k[0],g=k[1],h==="THEN"&&(f.fromThen=!0),f.generated=g.generated=!0,c.splice(b+1,0,f),e=function(a,b){var c;return a[1]!==";"&&(c=a[0],t.call(m,c)>=0)&&(a[0]!=="ELSE"||(h==="IF"||h==="THEN"))},d=function(a,b){return this.tokens.splice(this.tag(b-1)===","?b-1:b,0,g)},this.detectEnd(b+2,e,d),i==="THEN"&&c.splice(b,1);return 1}return 1})},a.prototype.tagPostfixConditionals=function(){var a;a=function(a,b){var c;return(c=a[0])==="TERMINATOR"||c==="INDENT"};return this.scanTokens(function(b,c){var d;if(b[0]!=="IF")return 1;d=b,this.detectEnd(c+1,a,function(a,b){if(a[0]!=="INDENT")return d[0]="POST_"+d[0]});return 1})},a.prototype.ensureBalance=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d={},f={},m=this.tokens;for(i=0,k=m.length;i<k;i++){h=m[i],g=h[0];for(j=0,l=a.length;j<l;j++){n=a[j],e=n[0],b=n[1],d[e]|=0;if(g===e)d[e]++===0&&(f[e]=h[2]);else if(g===b&&--d[e]<0)throw Error("too many "+h[1]+" on line "+(h[2]+1))}}for(e in d){c=d[e];if(c>0)throw Error("unclosed "+e+" on line "+(f[e]+1))}return this},a.prototype.rewriteClosingParens=function(){var a,b,c;c=[],a={};for(b in k)a[b]=0;return this.scanTokens(function(b,f,g){var h,i,j,l,m,n,o;if(o=m=b[0],t.call(e,o)>=0){c.push(b);return 1}if(t.call(d,m)<0)return 1;if(a[h=k[m]]>0){a[h]-=1,g.splice(f,1);return 0}i=c.pop(),j=i[0],l=k[j];if(m===l)return 1;a[j]+=1,n=[l,j==="INDENT"?i[1]:l],this.tag(f+2)===j?(g.splice(f+3,0,n),c.push(i)):g.splice(f,0,n);return 1})},a.prototype.indentation=function(a){return[["INDENT",2,a[2]],["OUTDENT",2,a[2]]]},a.prototype.tag=function(a){var b;return(b=this.tokens[a])!=null?b[0]:void 0};return a}(),b=[["(",")"],["[","]"],["{","}"],["INDENT","OUTDENT"],["CALL_START","CALL_END"],["PARAM_START","PARAM_END"],["INDEX_START","INDEX_END"]],k={},e=[],d=[];for(q=0,r=b.length;q<r;q++)s=b[q],o=s[0],p=s[1],e.push(k[p]=o),d.push(k[o]=p);c=["CATCH","WHEN","ELSE","FINALLY"].concat(d),i=["IDENTIFIER","SUPER",")","CALL_END","]","INDEX_END","@","THIS"],g=["IDENTIFIER","NUMBER","STRING","JS","REGEX","NEW","PARAM_START","CLASS","IF","TRY","SWITCH","THIS","BOOL","UNARY","SUPER","@","->","=>","[","(","{","--","++"],j=["+","-"],f=["->","=>","{","[",","],h=["POST_IF","FOR","WHILE","UNTIL","WHEN","BY","LOOP","TERMINATOR","INDENT"],n=["ELSE","->","=>","TRY","FINALLY","THEN"],m=["TERMINATOR","CATCH","FINALLY","ELSE","OUTDENT","LEADING_WHEN"],l=["TERMINATOR","INDENT","OUTDENT"]}).call(this)},require["./lexer"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};I=require("./rewriter").Rewriter,T=require("./helpers"),P=T.count,S=T.starts,O=T.compact,Q=T.last,a.Lexer=w=function(){function a(){}a.prototype.tokenize=function(a,b){var c;b==null&&(b={}),N.test(a)&&(a="\n"+a),a=a.replace(/\r/g,"").replace(L,""),this.code=a,this.line=b.line||0,this.indent=0,this.indebt=0,this.outdebt=0,this.indents=[],this.tokens=[],c=0;while(this.chunk=a.slice(c))c+=this.identifierToken()||this.commentToken()||this.whitespaceToken()||this.lineToken()||this.heredocToken()||this.stringToken()||this.numberToken()||this.regexToken()||this.jsToken()||this.literalToken();this.closeIndentation();if(b.rewrite===!1)return this.tokens;return(new I).rewrite(this.tokens)},a.prototype.identifierToken=function(){var a,b,c,d,e,h,i,j,k;if(!(e=o.exec(this.chunk)))return 0;d=e[0],c=e[1],a=e[2];if(c==="own"&&this.tag()==="FOR"){this.token("OWN",c);return c.length}b=a||(h=Q(this.tokens))&&!h.spaced&&((j=h[0])==="."||j==="?."||j==="@"||j==="::"),i="IDENTIFIER";if(U.call(s,c)>=0||!b&&U.call(g,c)>=0)i=c.toUpperCase(),i==="WHEN"&&(k=this.tag(),U.call(t,k)>=0)?i="LEADING_WHEN":i==="FOR"?this.seenFor=!0:i==="UNLESS"?i="IF":U.call(M,i)<0?U.call(G,i)>=0&&(i!=="INSTANCEOF"&&this.seenFor?(i="FOR"+i,this.seenFor=!1):(i="RELATION",this.value()==="!"&&(this.tokens.pop(),c="!"+c))):i="UNARY";U.call(r,c)>=0&&(b?(i="IDENTIFIER",c=new String(c),c.reserved=!0):U.call(H,c)>=0&&this.identifierError(c)),b||(f.hasOwnProperty(c)&&(c=f[c]),i=function(){switch(c){case"!":return"UNARY";case"==":case"!=":return"COMPARE";case"&&":case"||":return"LOGIC";case"true":case"false":case"null":case"undefined":return"BOOL";case"break":case"continue":case"debugger":return"STATEMENT";default:return i}}()),this.token(i,c),a&&this.token(":",":");return d.length},a.prototype.numberToken=function(){var a,b;if(!(a=D.exec(this.chunk)))return 0;b=a[0],this.token("NUMBER",b);return b.length},a.prototype.stringToken=function(){var a,b;switch(this.chunk.charAt(0)){case"'":if(!(a=K.exec(this.chunk)))return 0;this.token("STRING",(b=a[0]).replace(y,"\\\n"));break;case'"':if(!(b=this.balancedString(this.chunk,'"')))return 0;0<b.indexOf("#{",1)?this.interpolateString(b.slice(1,-1)):this.token("STRING",this.escapeLines(b));break;default:return 0}this.line+=P(b,"\n");return b.length},a.prototype.heredocToken=function(){var a,b,c,d;if(!(c=k.exec(this.chunk)))return 0;b=c[0],d=b.charAt(0),a=this.sanitizeHeredoc(c[2],{quote:d,indent:null}),d!=='"'||0>a.indexOf("#{")?this.token("STRING",this.makeString(a,d,!0)):this.interpolateString(a,{heredoc:!0}),this.line+=P(b,"\n");return b.length},a.prototype.commentToken=function(){var a,b,c;if(!(c=this.chunk.match(h)))return 0;a=c[0],b=c[1],this.line+=P(a,"\n"),b&&(this.token("HERECOMMENT",this.sanitizeHeredoc(b,{herecomment:!0,indent:Array(this.indent+1).join(" ")})),this.token("TERMINATOR","\n"));return a.length},a.prototype.jsToken=function(){var a,b;if(this.chunk.charAt(0)!=="`"||!(a=q.exec(this.chunk)))return 0;this.token("JS",(b=a[0]).slice(1,-1));return b.length},a.prototype.regexToken=function(){var a,b,c,d;if(this.chunk.charAt(0)!=="/")return 0;if(a=m.exec(this.chunk))return this.heregexToken(a);b=Q(this.tokens);if(b&&(d=b[0],U.call(b.spaced?A:B,d)>=0))return 0;if(!(a=F.exec(this.chunk)))return 0;c=a[0],this.token("REGEX",c==="//"?"/(?:)/":c);return c.length},a.prototype.heregexToken=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,o;d=a[0],b=a[1],c=a[2];if(0>b.indexOf("#{")){e=b.replace(n,"").replace(/\//g,"\\/"),this.token("REGEX","/"+(e||"(?:)")+"/"+c);return d.length}this.token("IDENTIFIER","RegExp"),this.tokens.push(["CALL_START","("]),g=[],k=this.interpolateString(b,{regex:!0});for(i=0,j=k.length;i<j;i++){l=k[i],f=l[0],h=l[1];if(f==="TOKENS")g.push.apply(g,h);else{if(!(h=h.replace(n,"")))continue;h=h.replace(/\\/g,"\\\\"),g.push(["STRING",this.makeString(h,'"',!0)])}g.push(["+","+"])}g.pop(),((m=g[0])!=null?m[0]:void 0)!=="STRING"&&this.tokens.push(["STRING",'""'],["+","+"]),(o=this.tokens).push.apply(o,g),c&&this.tokens.push([",",","],["STRING",'"'+c+'"']),this.token(")",")");return d.length},a.prototype.lineToken=function(){var a,b,c,d,e,f;if(!(c=z.exec(this.chunk)))return 0;b=c[0],this.line+=P(b,"\n"),e=Q(this.tokens,1),f=b.length-1-b.lastIndexOf("\n"),d=this.unfinished();if(f-this.indebt===this.indent){d?this.suppressNewlines():this.newlineToken();return b.length}if(f>this.indent){if(d){this.indebt=f-this.indent,this.suppressNewlines();return b.length}a=f-this.indent+this.outdebt,this.token("INDENT",a),this.indents.push(a),this.outdebt=this.indebt=0}else this.indebt=0,this.outdentToken(this.indent-f,d);this.indent=f;return b.length},a.prototype.outdentToken=function(a,b,c){var d,e;while(a>0)e=this.indents.length-1,this.indents[e]===void 0?a=0:this.indents[e]===this.outdebt?(a-=this.outdebt,this.outdebt=0):this.indents[e]<this.outdebt?(this.outdebt-=this.indents[e],a-=this.indents[e]):(d=this.indents.pop()-this.outdebt,a-=d,this.outdebt=0,this.token("OUTDENT",d));d&&(this.outdebt-=a),this.tag()!=="TERMINATOR"&&!b&&this.token("TERMINATOR","\n");return this},a.prototype.whitespaceToken=function(){var a,b,c;if(!(a=N.exec(this.chunk))&&!(b=this.chunk.charAt(0)==="\n"))return 0;c=Q(this.tokens),c&&(c[a?"spaced":"newLine"]=!0);return a?a[0].length:0},a.prototype.newlineToken=function(){this.tag()!=="TERMINATOR"&&this.token("TERMINATOR","\n");return this},a.prototype.suppressNewlines=function(){this.value()==="\\"&&this.tokens.pop();return this},a.prototype.literalToken=function(){var a,b,c,f,g,h,k,l;(a=E.exec(this.chunk))?(f=a[0],e.test(f)&&this.tagParameters()):f=this.chunk.charAt(0),c=f,b=Q(this.tokens);if(f==="="&&b){!b[1].reserved&&(g=b[1],U.call(r,g)>=0)&&this.assignmentError();if((h=b[1])==="||"||h==="&&"){b[0]="COMPOUND_ASSIGN",b[1]+="=";return f.length}}if(f===";")c="TERMINATOR";else if(U.call(x,f)<0)if(U.call(i,f)<0)if(U.call(j,f)<0)if(U.call(M,f)<0)if(U.call(J,f)<0){if(U.call(v,f)>=0||f==="?"&&(b!=null?b.spaced:void 0))c="LOGIC";else if(b&&!b.spaced)if(f==="("&&(k=b[0],U.call(d,k)>=0))b[0]==="?"&&(b[0]="FUNC_EXIST"),c="CALL_START";else if(f==="["&&(l=b[0],U.call(p,l)>=0)){c="INDEX_START";switch(b[0]){case"?":b[0]="INDEX_SOAK";break;case"::":b[0]="INDEX_PROTO"}}}else c="SHIFT";else c="UNARY";else c="COMPOUND_ASSIGN";else c="COMPARE";else c="MATH";this.token(c,f);return f.length},a.prototype.sanitizeHeredoc=function(a,b){var c,d,e,f,g;e=b.indent,d=b.herecomment;if(d&&0>a.indexOf("\n"))return a;if(!d)while(f=l.exec(a)){c=f[1];if(e===null||0<(g=c.length)&&g<e.length)e=c}e&&(a=a.replace(RegExp("\\n"+e,"g"),"\n")),d||(a=a.replace(/^\n/,""));return a},a.prototype.tagParameters=function(){var a,b,c,d;if(this.tag()!==")")return this;b=[],d=this.tokens,a=d.length,d[--a][0]="PARAM_END";while(c=d[--a])switch(c[0]){case")":b.push(c);break;case"(":case"CALL_START":if(b.length)b.pop();else{c[0]="PARAM_START";return this}}return this},a.prototype.closeIndentation=function(){return this.outdentToken(this.indent)},a.prototype.identifierError=function(a){throw SyntaxError('Reserved word "'+a+'" on line '+(this.line+1))},a.prototype.assignmentError=function(){throw SyntaxError('Reserved word "'+this.value()+'" on line '+(this.line+1)+" can't be assigned")},a.prototype.balancedString=function(a,b){var c,d,e,f,g;f=[b];for(c=1,g=a.length;1<=g?c<g:c>g;1<=g?c+=1:c-=1){switch(d=a.charAt(c)){case"\\":c++;continue;case b:f.pop();if(!f.length)return a.slice(0,c+1);b=f[f.length-1];continue}b!=="}"||d!=='"'&&d!=="'"?b==="}"&&d==="{"?f.push(b="}"):b==='"'&&e==="#"&&d==="{"&&f.push(b="}"):f.push(b=d),e=d}throw new Error("missing "+f.pop()+", starting on line "+(this.line+1))},a.prototype.interpolateString=function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;c==null&&(c={}),e=c.heredoc,m=c.regex,o=[],l=0,f=-1;while(j=b.charAt(f+=1)){if(j==="\\"){f+=1;continue}if(j!=="#"||b.charAt(f+1)!=="{"||!(d=this.balancedString(b.slice(f+1),"}")))continue;l<f&&o.push(["NEOSTRING",b.slice(l,f)]),g=d.slice(1,-1);if(g.length){k=(new a).tokenize(g,{line:this.line,rewrite:!1}),k.pop(),((r=k[0])!=null?r[0]:void 0)==="TERMINATOR"&&k.shift();if(i=k.length)i>1&&(k.unshift(["(","("]),k.push([")",")"])),o.push(["TOKENS",k])}f+=d.length,l=f+1}f>l&&l<b.length&&o.push(["NEOSTRING",b.slice(l)]);if(m)return o;if(!o.length)return this.token("STRING",'""');o[0][0]!=="NEOSTRING"&&o.unshift(["",""]),(h=o.length>1)&&this.token("(","(");for(f=0,q=o.length;f<q;f++)s=o[f],n=s[0],p=s[1],f&&this.token("+","+"),n==="TOKENS"?(t=this.tokens).push.apply(t,p):this.token("STRING",this.makeString(p,'"',e));h&&this.token(")",")");return o},a.prototype.token=function(a,b){return this.tokens.push([a,b,this.line])},a.prototype.tag=function(a,b){var c;return(c=Q(this.tokens,a))&&(b?c[0]=b:c[0])},a.prototype.value=function(a,b){var c;return(c=Q(this.tokens,a))&&(b?c[1]=b:c[1])},a.prototype.unfinished=function(){var a,c;return u.test(this.chunk)||(a=Q(this.tokens,1))&&a[0]!=="."&&(c=this.value())&&!c.reserved&&C.test(c)&&!e.test(c)&&!b.test(this.chunk)},a.prototype.escapeLines=function(a,b){return a.replace(y,b?"\\n":"")},a.prototype.makeString=function(a,b,c){if(!a)return b+b;a=a.replace(/\\([\s\S])/g,function(a,c){return c==="\n"||c===b?c:a}),a=a.replace(RegExp(""+b,"g"),"\\$&");return b+this.escapeLines(a,c)+b};return a}(),s=["true","false","null","this","new","delete","typeof","in","instanceof","return","throw","break","continue","debugger","if","else","switch","for","while","do","try","catch","finally","class","extends","super"],g=["undefined","then","unless","until","loop","of","by","when"];for(R in f={and:"&&",or:"||",is:"==",isnt:"!=",not:"!",yes:"true",no:"false",on:"true",off:"false"})g.push(R);H=["case","default","function","var","void","with","const","let","enum","export","import","native","__hasProp","__extends","__slice","__bind","__indexOf"],r=s.concat(H),a.RESERVED=H.concat(s).concat(g),o=/^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/,D=/^0x[\da-f]+|^(?:\d+(\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i,k=/^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/,E=/^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/,N=/^[^\n\S]+/,h=/^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/,e=/^[-=]>/,z=/^(?:\n[^\n\S]*)+/,K=/^'[^\\']*(?:\\.[^\\']*)*'/,q=/^`[^\\`]*(?:\\.[^\\`]*)*`/,F=/^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/,m=/^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/,n=/\s+(?:#.*)?/g,y=/\n/g,l=/\n+([^\n\S]*)/g,b=/^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/,u=/^\s*(?:,|\??\.(?!\.)|::)/,L=/\s+$/,C=/^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/,j=["-=","+=","/=","*=","%=","||=","&&=","?=","<<=",">>=",">>>=","&=","^=","|="],M=["!","~","NEW","TYPEOF","DELETE","DO"],v=["&&","||","&","|","^"],J=["<<",">>",">>>"],i=["==","!=","<",">","<=",">="],x=["*","/","%"],G=["IN","OF","INSTANCEOF"],c=["TRUE","FALSE","NULL","UNDEFINED"],A=["NUMBER","REGEX","BOOL","++","--","]"],B=A.concat(")","}","THIS","IDENTIFIER","STRING"),d=["IDENTIFIER","STRING","REGEX",")","]","}","?","::","@","THIS","SUPER"],p=d.concat("NUMBER","BOOL"),t=["INDENT","OUTDENT","TERMINATOR"]}).call(this)},require["./parser"]=new function(){var a=this,b=function(){var a={trace:function b(){},yy:{},symbols_:{error:2,Root:3,Body:4,Block:5,TERMINATOR:6,Line:7,Expression:8,Statement:9,Return:10,Throw:11,Comment:12,STATEMENT:13,Value:14,Invocation:15,Code:16,Operation:17,Assign:18,If:19,Try:20,While:21,For:22,Switch:23,Class:24,INDENT:25,OUTDENT:26,Identifier:27,IDENTIFIER:28,AlphaNumeric:29,NUMBER:30,STRING:31,Literal:32,JS:33,REGEX:34,BOOL:35,Assignable:36,"=":37,AssignObj:38,ObjAssignable:39,":":40,ThisProperty:41,RETURN:42,HERECOMMENT:43,PARAM_START:44,ParamList:45,PARAM_END:46,FuncGlyph:47,"->":48,"=>":49,OptComma:50,",":51,Param:52,ParamVar:53,"...":54,Array:55,Object:56,Splat:57,SimpleAssignable:58,Accessor:59,Parenthetical:60,Range:61,This:62,".":63,"?.":64,"::":65,Index:66,Slice:67,INDEX_START:68,INDEX_END:69,INDEX_SOAK:70,INDEX_PROTO:71,"{":72,AssignList:73,"}":74,CLASS:75,EXTENDS:76,OptFuncExist:77,Arguments:78,SUPER:79,FUNC_EXIST:80,CALL_START:81,CALL_END:82,ArgList:83,THIS:84,"@":85,"[":86,"]":87,RangeDots:88,"..":89,Arg:90,SimpleArgs:91,TRY:92,Catch:93,FINALLY:94,CATCH:95,THROW:96,"(":97,")":98,WhileSource:99,WHILE:100,WHEN:101,UNTIL:102,Loop:103,LOOP:104,ForBody:105,FOR:106,ForStart:107,ForSource:108,ForVariables:109,OWN:110,ForValue:111,FORIN:112,FOROF:113,BY:114,SWITCH:115,Whens:116,ELSE:117,When:118,LEADING_WHEN:119,IfBlock:120,IF:121,POST_IF:122,UNARY:123,"-":124,"+":125,"--":126,"++":127,"?":128,MATH:129,SHIFT:130,COMPARE:131,LOGIC:132,RELATION:133,COMPOUND_ASSIGN:134,$accept:0,$end:1},terminals_:{2:"error",6:"TERMINATOR",13:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"BOOL",37:"=",40:":",42:"RETURN",43:"HERECOMMENT",44:"PARAM_START",46:"PARAM_END",48:"->",49:"=>",51:",",54:"...",63:".",64:"?.",65:"::",68:"INDEX_START",69:"INDEX_END",70:"INDEX_SOAK",71:"INDEX_PROTO",72:"{",74:"}",75:"CLASS",76:"EXTENDS",79:"SUPER",80:"FUNC_EXIST",81:"CALL_START",82:"CALL_END",84:"THIS",85:"@",86:"[",87:"]",89:"..",92:"TRY",94:"FINALLY",95:"CATCH",96:"THROW",97:"(",98:")",100:"WHILE",101:"WHEN",102:"UNTIL",104:"LOOP",106:"FOR",110:"OWN",112:"FORIN",113:"FOROF",114:"BY",115:"SWITCH",117:"ELSE",119:"LEADING_WHEN",121:"IF",122:"POST_IF",123:"UNARY",124:"-",125:"+",126:"--",127:"++",128:"?",129:"MATH",130:"SHIFT",131:"COMPARE",132:"LOGIC",133:"RELATION",134:"COMPOUND_ASSIGN"},productions_:[0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[18,3],[18,5],[38,1],[38,3],[38,5],[38,1],[39,1],[39,1],[39,1],[10,2],[10,1],[12,1],[16,5],[16,2],[47,1],[47,1],[50,0],[50,1],[45,0],[45,1],[45,3],[52,1],[52,2],[52,3],[53,1],[53,1],[53,1],[53,1],[57,2],[58,1],[58,2],[58,2],[58,1],[36,1],[36,1],[36,1],[14,1],[14,1],[14,1],[14,1],[14,1],[59,2],[59,2],[59,2],[59,1],[59,1],[59,1],[66,3],[66,2],[66,2],[56,4],[73,0],[73,1],[73,3],[73,4],[73,6],[24,1],[24,2],[24,3],[24,4],[24,2],[24,3],[24,4],[24,5],[15,3],[15,3],[15,1],[15,2],[77,0],[77,1],[78,2],[78,4],[62,1],[62,1],[41,2],[55,2],[55,4],[88,1],[88,1],[61,5],[67,5],[67,4],[67,4],[83,1],[83,3],[83,4],[83,4],[83,6],[90,1],[90,1],[91,1],[91,3],[20,2],[20,3],[20,4],[20,5],[93,3],[11,2],[60,3],[60,5],[99,2],[99,4],[99,2],[99,4],[21,2],[21,2],[21,2],[21,1],[103,2],[103,2],[22,2],[22,2],[22,2],[105,2],[105,2],[107,2],[107,3],[111,1],[111,1],[111,1],[109,1],[109,3],[108,2],[108,2],[108,4],[108,4],[108,4],[108,6],[108,6],[23,5],[23,7],[23,4],[23,6],[116,1],[116,2],[118,3],[118,4],[120,3],[120,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],performAction:function c(a,b,c,d,e,f){var g=f.length-1;switch(e){case 1:return this.$=new d.Block;case 2:return this.$=f[g];case 3:return this.$=f[g-1];case 4:this.$=d.Block.wrap([f[g]]);break;case 5:this.$=f[g-2].push(f[g]);break;case 6:this.$=f[g-1];break;case 7:this.$=f[g];break;case 8:this.$=f[g];break;case 9:this.$=f[g];break;case 10:this.$=f[g];break;case 11:this.$=f[g];break;case 12:this.$=new d.Literal(f[g]);break;case 13:this.$=f[g];break;case 14:this.$=f[g];break;case 15:this.$=f[g];break;case 16:this.$=f[g];break;case 17:this.$=f[g];break;case 18:this.$=f[g];break;case 19:this.$=f[g];break;case 20:this.$=f[g];break;case 21:this.$=f[g];break;case 22:this.$=f[g];break;case 23:this.$=f[g];break;case 24:this.$=new d.Block;break;case 25:this.$=f[g-1];break;case 26:this.$=new d.Literal(f[g]);break;case 27:this.$=new d.Literal(f[g]);break;case 28:this.$=new d.Literal(f[g]);break;case 29:this.$=f[g];break;case 30:this.$=new d.Literal(f[g]);break;case 31:this.$=new d.Literal(f[g]);break;case 32:this.$=function(){var a;a=new d.Literal(f[g]),f[g]==="undefined"&&(a.isUndefined=!0);return a}();break;case 33:this.$=new d.Assign(f[g-2],f[g]);break;case 34:this.$=new d.Assign(f[g-4],f[g-1]);break;case 35:this.$=new d.Value(f[g]);break;case 36:this.$=new d.Assign(new d.Value(f[g-2]),f[g],"object");break;case 37:this.$=new d.Assign(new d.Value(f[g-4]),f[g-1],"object");break;case 38:this.$=f[g];break;case 39:this.$=f[g];break;case 40:this.$=f[g];break;case 41:this.$=f[g];break;case 42:this.$=new d.Return(f[g]);break;case 43:this.$=new d.Return;break;case 44:this.$=new d.Comment(f[g]);break;case 45:this.$=new d.Code(f[g-3],f[g],f[g-1]);break;case 46:this.$=new d.Code([],f[g],f[g-1]);break;case 47:this.$="func";break;case 48:this.$="boundfunc";break;case 49:this.$=f[g];break;case 50:this.$=f[g];break;case 51:this.$=[];break;case 52:this.$=[f[g]];break;case 53:this.$=f[g-2].concat(f[g]);break;case 54:this.$=new d.Param(f[g]);break;case 55:this.$=new d.Param(f[g-1],null,!0);break;case 56:this.$=new d.Param(f[g-2],f[g]);break;case 57:this.$=f[g];break;case 58:this.$=f[g];break;case 59:this.$=f[g];break;case 60:this.$=f[g];break;case 61:this.$=new d.Splat(f[g-1]);break;case 62:this.$=new d.Value(f[g]);break;case 63:this.$=f[g-1].push(f[g]);break;case 64:this.$=new d.Value(f[g-1],[f[g]]);break;case 65:this.$=f[g];break;case 66:this.$=f[g];break;case 67:this.$=new d.Value(f[g]);break;case 68:this.$=new d.Value(f[g]);break;case 69:this.$=f[g];break;case 70:this.$=new d.Value(f[g]);break;case 71:this.$=new d.Value(f[g]);break;case 72:this.$=new d.Value(f[g]);break;case 73:this.$=f[g];break;case 74:this.$=new d.Access(f[g]);break;case 75:this.$=new d.Access(f[g],"soak");break;case 76:this.$=new d.Access(f[g],"proto");break;case 77:this.$=new d.Access(new d.Literal("prototype"));break;case 78:this.$=f[g];break;case 79:this.$=new d.Slice(f[g]);break;case 80:this.$=new d.Index(f[g-1]);break;case 81:this.$=d.extend(f[g],{soak:!0});break;case 82:this.$=d.extend(f[g],{proto:!0});break;case 83:this.$=new d.Obj(f[g-2],f[g-3].generated);break;case 84:this.$=[];break;case 85:this.$=[f[g]];break;case 86:this.$=f[g-2].concat(f[g]);break;case 87:this.$=f[g-3].concat(f[g]);break;case 88:this.$=f[g-5].concat(f[g-2]);break;case 89:this.$=new d.Class;break;case 90:this.$=new d.Class(null,null,f[g]);break;case 91:this.$=new d.Class(null,f[g]);break;case 92:this.$=new d.Class(null,f[g-1],f[g]);break;case 93:this.$=new d.Class(f[g]);break;case 94:this.$=new d.Class(f[g-1],null,f[g]);break;case 95:this.$=new d.Class(f[g-2],f[g]);break;case 96:this.$=new d.Class(f[g-3],f[g-1],f[g]);break;case 97:this.$=new d.Call(f[g-2],f[g],f[g-1]);break;case 98:this.$=new d.Call(f[g-2],f[g],f[g-1]);break;case 99:this.$=new d.Call("super",[new d.Splat(new d.Literal("arguments"))]);break;case 100:this.$=new d.Call("super",f[g]);break;case 101:this.$=!1;break;case 102:this.$=!0;break;case 103:this.$=[];break;case 104:this.$=f[g-2];break;case 105:this.$=new d.Value(new d.Literal("this"));break;case 106:this.$=new d.Value(new d.Literal("this"));break;case 107:this.$=new d.Value(new d.Literal("this"),[new d.Access(f[g])],"this");break;case 108:this.$=new d.Arr([]);break;case 109:this.$=new d.Arr(f[g-2]);break;case 110:this.$="inclusive";break;case 111:this.$="exclusive";break;case 112:this.$=new d.Range(f[g-3],f[g-1],f[g-2]);break;case 113:this.$=new d.Range(f[g-3],f[g-1],f[g-2]);break;case 114:this.$=new d.Range(f[g-2],null,f[g-1]);break;case 115:this.$=new d.Range(null,f[g-1],f[g-2]);break;case 116:this.$=[f[g]];break;case 117:this.$=f[g-2].concat(f[g]);break;case 118:this.$=f[g-3].concat(f[g]);break;case 119:this.$=f[g-2];break;case 120:this.$=f[g-5].concat(f[g-2]);break;case 121:this.$=f[g];break;case 122:this.$=f[g];break;case 123:this.$=f[g];break;case 124:this.$=[].concat(f[g-2],f[g]);break;case 125:this.$=new d.Try(f[g]);break;case 126:this.$=new d.Try(f[g-1],f[g][0],f[g][1]);break;case 127:this.$=new d.Try(f[g-2],null,null,f[g]);break;case 128:this.$=new d.Try(f[g-3],f[g-2][0],f[g-2][1],f[g]);break;case 129:this.$=[f[g-1],f[g]];break;case 130:this.$=new d.Throw(f[g]);break;case 131:this.$=new d.Parens(f[g-1]);break;case 132:this.$=new d.Parens(f[g-2]);break;case 133:this.$=new d.While(f[g]);break;case 134:this.$=new d.While(f[g-2],{guard:f[g]});break;case 135:this.$=new d.While(f[g],{invert:!0});break;case 136:this.$=new d.While(f[g-2],{invert:!0,guard:f[g]});break;case 137:this.$=f[g-1].addBody(f[g]);break;case 138:this.$=f[g].addBody(d.Block.wrap([f[g-1]]));break;case 139:this.$=f[g].addBody(d.Block.wrap([f[g-1]]));break;case 140:this.$=f[g];break;case 141:this.$=(new d.While(new d.Literal("true"))).addBody(f[g]);break;case 142:this.$=(new d.While(new d.Literal("true"))).addBody(d.Block.wrap([f[g]]));break;case 143:this.$=new d.For(f[g-1],f[g]);break;case 144:this.$=new d.For(f[g-1],f[g]);break;case 145:this.$=new d.For(f[g],f[g-1]);break;case 146:this.$={source:new d.Value(f[g])};break;case 147:this.$=function(){f[g].own=f[g-1].own,f[g].name=f[g-1][0],f[g].index=f[g-1][1];return f[g]}();break;case 148:this.$=f[g];break;case 149:this.$=function(){f[g].own=!0;return f[g]}();break;case 150:this.$=f[g];break;case 151:this.$=new d.Value(f[g]);break;case 152:this.$=new d.Value(f[g]);break;case 153:this.$=[f[g]];break;case 154:this.$=[f[g-2],f[g]];break;case 155:this.$={source:f[g]};break;case 156:this.$={source:f[g],object:!0};break;case 157:this.$={source:f[g-2],guard:f[g]};break;case 158:this.$={source:f[g-2],guard:f[g],object:!0};break;case 159:this.$={source:f[g-2],step:f[g]};break;case 160:this.$={source:f[g-4],guard:f[g-2],step:f[g]};break;case 161:this.$={source:f[g-4],step:f[g-2],guard:f[g]};break;case 162:this.$=new d.Switch(f[g-3],f[g-1]);break;case 163:this.$=new d.Switch(f[g-5],f[g-3],f[g-1]);break;case 164:this.$=new d.Switch(null,f[g-1]);break;case 165:this.$=new d.Switch(null,f[g-3],f[g-1]);break;case 166:this.$=f[g];break;case 167:this.$=f[g-1].concat(f[g]);break;case 168:this.$=[[f[g-1],f[g]]];break;case 169:this.$=[[f[g-2],f[g-1]]];break;case 170:this.$=new d.If(f[g-1],f[g],{type:f[g-2]});break;case 171:this.$=f[g-4].addElse(new d.If(f[g-1],f[g],{type:f[g-2]}));break;case 172:this.$=f[g];break;case 173:this.$=f[g-2].addElse(f[g]);break;case 174:this.$=new d.If(f[g],d.Block.wrap([f[g-2]]),{type:f[g-1],statement:!0});break;case 175:this.$=new d.If(f[g],d.Block.wrap([f[g-2]]),{type:f[g-1],statement:!0});break;case 176:this.$=new d.Op(f[g-1],f[g]);break;case 177:this.$=new d.Op("-",f[g]);break;case 178:this.$=new d.Op("+",f[g]);break;case 179:this.$=new d.Op("--",f[g]);break;case 180:this.$=new d.Op("++",f[g]);break;case 181:this.$=new d.Op("--",f[g-1],null,!0);break;case 182:this.$=new d.Op("++",f[g-1],null,!0);break;case 183:this.$=new d.Existence(f[g-1]);break;case 184:this.$=new d.Op("+",f[g-2],f[g]);break;case 185:this.$=new d.Op("-",f[g-2],f[g]);break;case 186:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 187:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 188:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 189:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 190:this.$=function(){return f[g-1].charAt(0)==="!"?(new d.Op(f[g-1].slice(1),f[g-2],f[g])).invert():new d.Op(f[g-1],f[g-2],f[g])}();break;case 191:this.$=new d.Assign(f[g-2],f[g],f[g-1]);break;case 192:this.$=new d.Assign(f[g-4],f[g-1],f[g-3]);break;case 193:this.$=new d.Extends(f[g-2],f[g])}},table:[{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[3]},{1:[2,2],6:[1,71]},{6:[1,72]},{1:[2,4],6:[2,4],26:[2,4],98:[2,4]},{4:74,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[1,73],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,7],6:[2,7],26:[2,7],98:[2,7],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,8],6:[2,8],26:[2,8],98:[2,8],99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],46:[2,13],51:[2,13],54:[2,13],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,13],70:[1,98],71:[1,99],74:[2,13],77:89,80:[1,91],81:[2,101],82:[2,13],87:[2,13],89:[2,13],98:[2,13],100:[2,13],101:[2,13],102:[2,13],106:[2,13],114:[2,13],122:[2,13],124:[2,13],125:[2,13],128:[2,13],129:[2,13],130:[2,13],131:[2,13],132:[2,13],133:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],46:[2,14],51:[2,14],54:[2,14],59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,14],70:[1,98],71:[1,99],74:[2,14],77:100,80:[1,91],81:[2,101],82:[2,14],87:[2,14],89:[2,14],98:[2,14],100:[2,14],101:[2,14],102:[2,14],106:[2,14],114:[2,14],122:[2,14],124:[2,14],125:[2,14],128:[2,14],129:[2,14],130:[2,14],131:[2,14],132:[2,14],133:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],46:[2,15],51:[2,15],54:[2,15],69:[2,15],74:[2,15],82:[2,15],87:[2,15],89:[2,15],98:[2,15],100:[2,15],101:[2,15],102:[2,15],106:[2,15],114:[2,15],122:[2,15],124:[2,15],125:[2,15],128:[2,15],129:[2,15],130:[2,15],131:[2,15],132:[2,15],133:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],46:[2,16],51:[2,16],54:[2,16],69:[2,16],74:[2,16],82:[2,16],87:[2,16],89:[2,16],98:[2,16],100:[2,16],101:[2,16],102:[2,16],106:[2,16],114:[2,16],122:[2,16],124:[2,16],125:[2,16],128:[2,16],129:[2,16],130:[2,16],131:[2,16],132:[2,16],133:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],46:[2,17],51:[2,17],54:[2,17],69:[2,17],74:[2,17],82:[2,17],87:[2,17],89:[2,17],98:[2,17],100:[2,17],101:[2,17],102:[2,17],106:[2,17],114:[2,17],122:[2,17],124:[2,17],125:[2,17],128:[2,17],129:[2,17],130:[2,17],131:[2,17],132:[2,17],133:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],46:[2,18],51:[2,18],54:[2,18],69:[2,18],74:[2,18],82:[2,18],87:[2,18],89:[2,18],98:[2,18],100:[2,18],101:[2,18],102:[2,18],106:[2,18],114:[2,18],122:[2,18],124:[2,18],125:[2,18],128:[2,18],129:[2,18],130:[2,18],131:[2,18],132:[2,18],133:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],46:[2,19],51:[2,19],54:[2,19],69:[2,19],74:[2,19],82:[2,19],87:[2,19],89:[2,19],98:[2,19],100:[2,19],101:[2,19],102:[2,19],106:[2,19],114:[2,19],122:[2,19],124:[2,19],125:[2,19],128:[2,19],129:[2,19],130:[2,19],131:[2,19],132:[2,19],133:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],46:[2,20],51:[2,20],54:[2,20],69:[2,20],74:[2,20],82:[2,20],87:[2,20],89:[2,20],98:[2,20],100:[2,20],101:[2,20],102:[2,20],106:[2,20],114:[2,20],122:[2,20],124:[2,20],125:[2,20],128:[2,20],129:[2,20],130:[2,20],131:[2,20],132:[2,20],133:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],46:[2,21],51:[2,21],54:[2,21],69:[2,21],74:[2,21],82:[2,21],87:[2,21],89:[2,21],98:[2,21],100:[2,21],101:[2,21],102:[2,21],106:[2,21],114:[2,21],122:[2,21],124:[2,21],125:[2,21],128:[2,21],129:[2,21],130:[2,21],131:[2,21],132:[2,21],133:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],46:[2,22],51:[2,22],54:[2,22],69:[2,22],74:[2,22],82:[2,22],87:[2,22],89:[2,22],98:[2,22],100:[2,22],101:[2,22],102:[2,22],106:[2,22],114:[2,22],122:[2,22],124:[2,22],125:[2,22],128:[2,22],129:[2,22],130:[2,22],131:[2,22],132:[2,22],133:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],46:[2,23],51:[2,23],54:[2,23],69:[2,23],74:[2,23],82:[2,23],87:[2,23],89:[2,23],98:[2,23],100:[2,23],101:[2,23],102:[2,23],106:[2,23],114:[2,23],122:[2,23],124:[2,23],125:[2,23],128:[2,23],129:[2,23],130:[2,23],131:[2,23],132:[2,23],133:[2,23]},{1:[2,9],6:[2,9],26:[2,9],98:[2,9],100:[2,9],102:[2,9],106:[2,9],122:[2,9]},{1:[2,10],6:[2,10],26:[2,10],98:[2,10],100:[2,10],102:[2,10],106:[2,10],122:[2,10]},{1:[2,11],6:[2,11],26:[2,11],98:[2,11],100:[2,11],102:[2,11],106:[2,11],122:[2,11]},{1:[2,12],6:[2,12],26:[2,12],98:[2,12],100:[2,12],102:[2,12],106:[2,12],122:[2,12]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],37:[1,102],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],46:[2,70],51:[2,70],54:[2,70],63:[2,70],64:[2,70],65:[2,70],68:[2,70],69:[2,70],70:[2,70],71:[2,70],74:[2,70],80:[2,70],81:[2,70],82:[2,70],87:[2,70],89:[2,70],98:[2,70],100:[2,70],101:[2,70],102:[2,70],106:[2,70],114:[2,70],122:[2,70],124:[2,70],125:[2,70],128:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],46:[2,71],51:[2,71],54:[2,71],63:[2,71],64:[2,71],65:[2,71],68:[2,71],69:[2,71],70:[2,71],71:[2,71],74:[2,71],80:[2,71],81:[2,71],82:[2,71],87:[2,71],89:[2,71],98:[2,71],100:[2,71],101:[2,71],102:[2,71],106:[2,71],114:[2,71],122:[2,71],124:[2,71],125:[2,71],128:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],46:[2,72],51:[2,72],54:[2,72],63:[2,72],64:[2,72],65:[2,72],68:[2,72],69:[2,72],70:[2,72],71:[2,72],74:[2,72],80:[2,72],81:[2,72],82:[2,72],87:[2,72],89:[2,72],98:[2,72],100:[2,72],101:[2,72],102:[2,72],106:[2,72],114:[2,72],122:[2,72],124:[2,72],125:[2,72],128:[2,72],129:[2,72],130:[2,72],131:[2,72],132:[2,72],133:[2,72]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],46:[2,73],51:[2,73],54:[2,73],63:[2,73],64:[2,73],65:[2,73],68:[2,73],69:[2,73],70:[2,73],71:[2,73],74:[2,73],80:[2,73],81:[2,73],82:[2,73],87:[2,73],89:[2,73],98:[2,73],100:[2,73],101:[2,73],102:[2,73],106:[2,73],114:[2,73],122:[2,73],124:[2,73],125:[2,73],128:[2,73],129:[2,73],130:[2,73],131:[2,73],132:[2,73],133:[2,73]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],46:[2,99],51:[2,99],54:[2,99],63:[2,99],64:[2,99],65:[2,99],68:[2,99],69:[2,99],70:[2,99],71:[2,99],74:[2,99],78:103,80:[2,99],81:[1,104],82:[2,99],87:[2,99],89:[2,99],98:[2,99],100:[2,99],101:[2,99],102:[2,99],106:[2,99],114:[2,99],122:[2,99],124:[2,99],125:[2,99],128:[2,99],129:[2,99],130:[2,99],131:[2,99],132:[2,99],133:[2,99]},{27:108,28:[1,70],41:109,45:105,46:[2,51],51:[2,51],52:106,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{5:114,25:[1,5]},{8:115,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:117,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:118,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:119,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:123,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],37:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],76:[1,127],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],126:[1,124],127:[1,125],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[1,126]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],46:[2,172],51:[2,172],54:[2,172],69:[2,172],74:[2,172],82:[2,172],87:[2,172],89:[2,172],98:[2,172],100:[2,172],101:[2,172],102:[2,172],106:[2,172],114:[2,172],117:[1,128],122:[2,172],124:[2,172],125:[2,172],128:[2,172],129:[2,172],130:[2,172],131:[2,172],132:[2,172],133:[2,172]},{5:129,25:[1,5]},{5:130,25:[1,5]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],46:[2,140],51:[2,140],54:[2,140],69:[2,140],74:[2,140],82:[2,140],87:[2,140],89:[2,140],98:[2,140],100:[2,140],101:[2,140],102:[2,140],106:[2,140],114:[2,140],122:[2,140],124:[2,140],125:[2,140],128:[2,140],129:[2,140],130:[2,140],131:[2,140],132:[2,140],133:[2,140]},{5:131,25:[1,5]},{8:132,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,133],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,89],5:134,6:[2,89],14:120,15:121,25:[1,5],26:[2,89],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,46:[2,89],51:[2,89],54:[2,89],55:47,56:48,58:136,60:25,61:26,62:27,69:[2,89],72:[1,67],74:[2,89],76:[1,135],79:[1,28],82:[2,89],84:[1,55],85:[1,56],86:[1,54],87:[2,89],89:[2,89],97:[1,53],98:[2,89],100:[2,89],101:[2,89],102:[2,89],106:[2,89],114:[2,89],122:[2,89],124:[2,89],125:[2,89],128:[2,89],129:[2,89],130:[2,89],131:[2,89],132:[2,89],133:[2,89]},{1:[2,43],6:[2,43],8:137,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,43],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,43],99:39,100:[2,43],102:[2,43],103:40,104:[1,64],105:41,106:[2,43],107:66,115:[1,42],120:37,121:[1,61],122:[2,43],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:138,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,44],6:[2,44],25:[2,44],26:[2,44],51:[2,44],74:[2,44],98:[2,44],100:[2,44],102:[2,44],106:[2,44],122:[2,44]},{1:[2,67],6:[2,67],25:[2,67],26:[2,67],37:[2,67],46:[2,67],51:[2,67],54:[2,67],63:[2,67],64:[2,67],65:[2,67],68:[2,67],69:[2,67],70:[2,67],71:[2,67],74:[2,67],80:[2,67],81:[2,67],82:[2,67],87:[2,67],89:[2,67],98:[2,67],100:[2,67],101:[2,67],102:[2,67],106:[2,67],114:[2,67],122:[2,67],124:[2,67],125:[2,67],128:[2,67],129:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],37:[2,68],46:[2,68],51:[2,68],54:[2,68],63:[2,68],64:[2,68],65:[2,68],68:[2,68],69:[2,68],70:[2,68],71:[2,68],74:[2,68],80:[2,68],81:[2,68],82:[2,68],87:[2,68],89:[2,68],98:[2,68],100:[2,68],101:[2,68],102:[2,68],106:[2,68],114:[2,68],122:[2,68],124:[2,68],125:[2,68],128:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],46:[2,29],51:[2,29],54:[2,29],63:[2,29],64:[2,29],65:[2,29],68:[2,29],69:[2,29],70:[2,29],71:[2,29],74:[2,29],80:[2,29],81:[2,29],82:[2,29],87:[2,29],89:[2,29],98:[2,29],100:[2,29],101:[2,29],102:[2,29],106:[2,29],114:[2,29],122:[2,29],124:[2,29],125:[2,29],128:[2,29],129:[2,29],130:[2,29],131:[2,29],132:[2,29],133:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],46:[2,30],51:[2,30],54:[2,30],63:[2,30],64:[2,30],65:[2,30],68:[2,30],69:[2,30],70:[2,30],71:[2,30],74:[2,30],80:[2,30],81:[2,30],82:[2,30],87:[2,30],89:[2,30],98:[2,30],100:[2,30],101:[2,30],102:[2,30],106:[2,30],114:[2,30],122:[2,30],124:[2,30],125:[2,30],128:[2,30],129:[2,30],130:[2,30],131:[2,30],132:[2,30],133:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],46:[2,31],51:[2,31],54:[2,31],63:[2,31],64:[2,31],65:[2,31],68:[2,31],69:[2,31],70:[2,31],71:[2,31],74:[2,31],80:[2,31],81:[2,31],82:[2,31],87:[2,31],89:[2,31],98:[2,31],100:[2,31],101:[2,31],102:[2,31],106:[2,31],114:[2,31],122:[2,31],124:[2,31],125:[2,31],128:[2,31],129:[2,31],130:[2,31],131:[2,31],132:[2,31],133:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],46:[2,32],51:[2,32],54:[2,32],63:[2,32],64:[2,32],65:[2,32],68:[2,32],69:[2,32],70:[2,32],71:[2,32],74:[2,32],80:[2,32],81:[2,32],82:[2,32],87:[2,32],89:[2,32],98:[2,32],100:[2,32],101:[2,32],102:[2,32],106:[2,32],114:[2,32],122:[2,32],124:[2,32],125:[2,32],128:[2,32],129:[2,32],130:[2,32],131:[2,32],132:[2,32],133:[2,32]},{4:139,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,140],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:141,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],46:[2,105],51:[2,105],54:[2,105],63:[2,105],64:[2,105],65:[2,105],68:[2,105],69:[2,105],70:[2,105],71:[2,105],74:[2,105],80:[2,105],81:[2,105],82:[2,105],87:[2,105],89:[2,105],98:[2,105],100:[2,105],101:[2,105],102:[2,105],106:[2,105],114:[2,105],122:[2,105],124:[2,105],125:[2,105],128:[2,105],129:[2,105],130:[2,105],131:[2,105],132:[2,105],133:[2,105]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],27:147,28:[1,70],46:[2,106],51:[2,106],54:[2,106],63:[2,106],64:[2,106],65:[2,106],68:[2,106],69:[2,106],70:[2,106],71:[2,106],74:[2,106],80:[2,106],81:[2,106],82:[2,106],87:[2,106],89:[2,106],98:[2,106],100:[2,106],101:[2,106],102:[2,106],106:[2,106],114:[2,106],122:[2,106],124:[2,106],125:[2,106],128:[2,106],129:[2,106],130:[2,106],131:[2,106],132:[2,106],133:[2,106]},{25:[2,47]},{25:[2,48]},{1:[2,62],6:[2,62],25:[2,62],26:[2,62],37:[2,62],46:[2,62],51:[2,62],54:[2,62],63:[2,62],64:[2,62],65:[2,62],68:[2,62],69:[2,62],70:[2,62],71:[2,62],74:[2,62],76:[2,62],80:[2,62],81:[2,62],82:[2,62],87:[2,62],89:[2,62],98:[2,62],100:[2,62],101:[2,62],102:[2,62],106:[2,62],114:[2,62],122:[2,62],124:[2,62],125:[2,62],126:[2,62],127:[2,62],128:[2,62],129:[2,62],130:[2,62],131:[2,62],132:[2,62],133:[2,62],134:[2,62]},{1:[2,65],6:[2,65],25:[2,65],26:[2,65],37:[2,65],46:[2,65],51:[2,65],54:[2,65],63:[2,65],64:[2,65],65:[2,65],68:[2,65],69:[2,65],70:[2,65],71:[2,65],74:[2,65],76:[2,65],80:[2,65],81:[2,65],82:[2,65],87:[2,65],89:[2,65],98:[2,65],100:[2,65],101:[2,65],102:[2,65],106:[2,65],114:[2,65],122:[2,65],124:[2,65],125:[2,65],126:[2,65],127:[2,65],128:[2,65],129:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65]},{8:148,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:149,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:150,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:151,8:152,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{27:157,28:[1,70],55:158,56:159,61:153,72:[1,67],86:[1,54],109:154,110:[1,155],111:156},{108:160,112:[1,161],113:[1,162]},{6:[2,84],12:166,25:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:163,74:[2,84],85:[1,112]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],40:[2,27],46:[2,27],51:[2,27],54:[2,27],63:[2,27],64:[2,27],65:[2,27],68:[2,27],69:[2,27],70:[2,27],71:[2,27],74:[2,27],80:[2,27],81:[2,27],82:[2,27],87:[2,27],89:[2,27],98:[2,27],100:[2,27],101:[2,27],102:[2,27],106:[2,27],114:[2,27],122:[2,27],124:[2,27],125:[2,27],128:[2,27],129:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],40:[2,28],46:[2,28],51:[2,28],54:[2,28],63:[2,28],64:[2,28],65:[2,28],68:[2,28],69:[2,28],70:[2,28],71:[2,28],74:[2,28],80:[2,28],81:[2,28],82:[2,28],87:[2,28],89:[2,28],98:[2,28],100:[2,28],101:[2,28],102:[2,28],106:[2,28],114:[2,28],122:[2,28],124:[2,28],125:[2,28],128:[2,28],129:[2,28],130:[2,28],131:[2,28],132:[2,28],133:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],37:[2,26],40:[2,26],46:[2,26],51:[2,26],54:[2,26],63:[2,26],64:[2,26],65:[2,26],68:[2,26],69:[2,26],70:[2,26],71:[2,26],74:[2,26],76:[2,26],80:[2,26],81:[2,26],82:[2,26],87:[2,26],89:[2,26],98:[2,26],100:[2,26],101:[2,26],102:[2,26],106:[2,26],112:[2,26],113:[2,26],114:[2,26],122:[2,26],124:[2,26],125:[2,26],126:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26]},{1:[2,6],6:[2,6],7:170,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,6],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,6],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],46:[2,24],51:[2,24],54:[2,24],69:[2,24],74:[2,24],82:[2,24],87:[2,24],89:[2,24],94:[2,24],95:[2,24],98:[2,24],100:[2,24],101:[2,24],102:[2,24],106:[2,24],114:[2,24],117:[2,24],119:[2,24],122:[2,24],124:[2,24],125:[2,24],128:[2,24],129:[2,24],130:[2,24],131:[2,24],132:[2,24],133:[2,24]},{6:[1,71],26:[1,171]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],46:[2,183],51:[2,183],54:[2,183],69:[2,183],74:[2,183],82:[2,183],87:[2,183],89:[2,183],98:[2,183],100:[2,183],101:[2,183],102:[2,183],106:[2,183],114:[2,183],122:[2,183],124:[2,183],125:[2,183],128:[2,183],129:[2,183],130:[2,183],131:[2,183],132:[2,183],133:[2,183]},{8:172,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:173,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:174,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:175,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:176,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:177,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:178,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:179,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],46:[2,139],51:[2,139],54:[2,139],69:[2,139],74:[2,139],82:[2,139],87:[2,139],89:[2,139],98:[2,139],100:[2,139],101:[2,139],102:[2,139],106:[2,139],114:[2,139],122:[2,139],124:[2,139],125:[2,139],128:[2,139],129:[2,139],130:[2,139],131:[2,139],132:[2,139],133:[2,139]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],46:[2,144],51:[2,144],54:[2,144],69:[2,144],74:[2,144],82:[2,144],87:[2,144],89:[2,144],98:[2,144],100:[2,144],101:[2,144],102:[2,144],106:[2,144],114:[2,144],122:[2,144],124:[2,144],125:[2,144],128:[2,144],129:[2,144],130:[2,144],131:[2,144],132:[2,144],133:[2,144]},{8:180,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],46:[2,138],51:[2,138],54:[2,138],69:[2,138],74:[2,138],82:[2,138],87:[2,138],89:[2,138],98:[2,138],100:[2,138],101:[2,138],102:[2,138],106:[2,138],114:[2,138],122:[2,138],124:[2,138],125:[2,138],128:[2,138],129:[2,138],130:[2,138],131:[2,138],132:[2,138],133:[2,138]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],46:[2,143],51:[2,143],54:[2,143],69:[2,143],74:[2,143],82:[2,143],87:[2,143],89:[2,143],98:[2,143],100:[2,143],101:[2,143],102:[2,143],106:[2,143],114:[2,143],122:[2,143],124:[2,143],125:[2,143],128:[2,143],129:[2,143],130:[2,143],131:[2,143],132:[2,143],133:[2,143]},{78:181,81:[1,104]},{1:[2,63],6:[2,63],25:[2,63],26:[2,63],37:[2,63],46:[2,63],51:[2,63],54:[2,63],63:[2,63],64:[2,63],65:[2,63],68:[2,63],69:[2,63],70:[2,63],71:[2,63],74:[2,63],76:[2,63],80:[2,63],81:[2,63],82:[2,63],87:[2,63],89:[2,63],98:[2,63],100:[2,63],101:[2,63],102:[2,63],106:[2,63],114:[2,63],122:[2,63],124:[2,63],125:[2,63],126:[2,63],127:[2,63],128:[2,63],129:[2,63],130:[2,63],131:[2,63],132:[2,63],133:[2,63],134:[2,63]},{81:[2,102]},{27:182,28:[1,70]},{27:183,28:[1,70]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],27:184,28:[1,70],37:[2,77],46:[2,77],51:[2,77],54:[2,77],63:[2,77],64:[2,77],65:[2,77],68:[2,77],69:[2,77],70:[2,77],71:[2,77],74:[2,77],76:[2,77],80:[2,77],81:[2,77],82:[2,77],87:[2,77],89:[2,77],98:[2,77],100:[2,77],101:[2,77],102:[2,77],106:[2,77],114:[2,77],122:[2,77],124:[2,77],125:[2,77],126:[2,77],127:[2,77],128:[2,77],129:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],37:[2,78],46:[2,78],51:[2,78],54:[2,78],63:[2,78],64:[2,78],65:[2,78],68:[2,78],69:[2,78],70:[2,78],71:[2,78],74:[2,78],76:[2,78],80:[2,78],81:[2,78],82:[2,78],87:[2,78],89:[2,78],98:[2,78],100:[2,78],101:[2,78],102:[2,78],106:[2,78],114:[2,78],122:[2,78],124:[2,78],125:[2,78],126:[2,78],127:[2,78],128:[2,78],129:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],37:[2,79],46:[2,79],51:[2,79],54:[2,79],63:[2,79],64:[2,79],65:[2,79],68:[2,79],69:[2,79],70:[2,79],71:[2,79],74:[2,79],76:[2,79],80:[2,79],81:[2,79],82:[2,79],87:[2,79],89:[2,79],98:[2,79],100:[2,79],101:[2,79],102:[2,79],106:[2,79],114:[2,79],122:[2,79],124:[2,79],125:[2,79],126:[2,79],127:[2,79],128:[2,79],129:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79]},{8:185,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],54:[1,188],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],88:186,89:[1,187],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{66:189,68:[1,190],70:[1,98],71:[1,99]},{66:191,68:[1,190],70:[1,98],71:[1,99]},{78:192,81:[1,104]},{1:[2,64],6:[2,64],25:[2,64],26:[2,64],37:[2,64],46:[2,64],51:[2,64],54:[2,64],63:[2,64],64:[2,64],65:[2,64],68:[2,64],69:[2,64],70:[2,64],71:[2,64],74:[2,64],76:[2,64],80:[2,64],81:[2,64],82:[2,64],87:[2,64],89:[2,64],98:[2,64],100:[2,64],101:[2,64],102:[2,64],106:[2,64],114:[2,64],122:[2,64],124:[2,64],125:[2,64],126:[2,64],127:[2,64],128:[2,64],129:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64]},{8:193,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,194],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],46:[2,100],51:[2,100],54:[2,100],63:[2,100],64:[2,100],65:[2,100],68:[2,100],69:[2,100],70:[2,100],71:[2,100],74:[2,100],80:[2,100],81:[2,100],82:[2,100],87:[2,100],89:[2,100],98:[2,100],100:[2,100],101:[2,100],102:[2,100],106:[2,100],114:[2,100],122:[2,100],124:[2,100],125:[2,100],128:[2,100],129:[2,100],130:[2,100],131:[2,100],132:[2,100],133:[2,100]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[1,195],83:196,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{46:[1,198],51:[1,199]},{46:[2,52],51:[2,52]},{37:[1,201],46:[2,54],51:[2,54],54:[1,200]},{37:[2,57],46:[2,57],51:[2,57],54:[2,57]},{37:[2,58],46:[2,58],51:[2,58],54:[2,58]},{37:[2,59],46:[2,59],51:[2,59],54:[2,59]},{37:[2,60],46:[2,60],51:[2,60],54:[2,60]},{27:147,28:[1,70]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,46],6:[2,46],25:[2,46],26:[2,46],46:[2,46],51:[2,46],54:[2,46],69:[2,46],74:[2,46],82:[2,46],87:[2,46],89:[2,46],98:[2,46],100:[2,46],101:[2,46],102:[2,46],106:[2,46],114:[2,46],122:[2,46],124:[2,46],125:[2,46],128:[2,46],129:[2,46],130:[2,46],131:[2,46],132:[2,46],133:[2,46]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],46:[2,176],51:[2,176],54:[2,176],69:[2,176],74:[2,176],82:[2,176],87:[2,176],89:[2,176],98:[2,176],99:84,100:[2,176],101:[2,176],102:[2,176],105:85,106:[2,176],107:66,114:[2,176],122:[2,176],124:[2,176],125:[2,176],128:[1,75],129:[2,176],130:[2,176],131:[2,176],132:[2,176],133:[2,176]},{99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],46:[2,177],51:[2,177],54:[2,177],69:[2,177],74:[2,177],82:[2,177],87:[2,177],89:[2,177],98:[2,177],99:84,100:[2,177],101:[2,177],102:[2,177],105:85,106:[2,177],107:66,114:[2,177],122:[2,177],124:[2,177],125:[2,177],128:[1,75],129:[2,177],130:[2,177],131:[2,177],132:[2,177],133:[2,177]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],46:[2,178],51:[2,178],54:[2,178],69:[2,178],74:[2,178],82:[2,178],87:[2,178],89:[2,178],98:[2,178],99:84,100:[2,178],101:[2,178],102:[2,178],105:85,106:[2,178],107:66,114:[2,178],122:[2,178],124:[2,178],125:[2,178],128:[1,75],129:[2,178],130:[2,178],131:[2,178],132:[2,178],133:[2,178]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],46:[2,179],51:[2,179],54:[2,179],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,179],70:[2,66],71:[2,66],74:[2,179],80:[2,66],81:[2,66],82:[2,179],87:[2,179],89:[2,179],98:[2,179],100:[2,179],101:[2,179],102:[2,179],106:[2,179],114:[2,179],122:[2,179],124:[2,179],125:[2,179],128:[2,179],129:[2,179],130:[2,179],131:[2,179],132:[2,179],133:[2,179]},{59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:89,80:[1,91],81:[2,101]},{59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:100,80:[1,91],81:[2,101]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],46:[2,180],51:[2,180],54:[2,180],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,180],70:[2,66],71:[2,66],74:[2,180],80:[2,66],81:[2,66],82:[2,180],87:[2,180],89:[2,180],98:[2,180],100:[2,180],101:[2,180],102:[2,180],106:[2,180],114:[2,180],122:[2,180],124:[2,180],125:[2,180],128:[2,180],129:[2,180],130:[2,180],131:[2,180],132:[2,180],133:[2,180]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],46:[2,181],51:[2,181],54:[2,181],69:[2,181],74:[2,181],82:[2,181],87:[2,181],89:[2,181],98:[2,181],100:[2,181],101:[2,181],102:[2,181],106:[2,181],114:[2,181],122:[2,181],124:[2,181],125:[2,181],128:[2,181],129:[2,181],130:[2,181],131:[2,181],132:[2,181],133:[2,181]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],46:[2,182],51:[2,182],54:[2,182],69:[2,182],74:[2,182],82:[2,182],87:[2,182],89:[2,182],98:[2,182],100:[2,182],101:[2,182],102:[2,182],106:[2,182],114:[2,182],122:[2,182],124:[2,182],125:[2,182],128:[2,182],129:[2,182],130:[2,182],131:[2,182],132:[2,182],133:[2,182]},{8:202,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,203],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:204,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:205,25:[1,5],121:[1,206]},{1:[2,125],6:[2,125],25:[2,125],26:[2,125],46:[2,125],51:[2,125],54:[2,125],69:[2,125],74:[2,125],82:[2,125],87:[2,125],89:[2,125],93:207,94:[1,208],95:[1,209],98:[2,125],100:[2,125],101:[2,125],102:[2,125],106:[2,125],114:[2,125],122:[2,125],124:[2,125],125:[2,125],128:[2,125],129:[2,125],130:[2,125],131:[2,125],132:[2,125],133:[2,125]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],46:[2,137],51:[2,137],54:[2,137],69:[2,137],74:[2,137],82:[2,137],87:[2,137],89:[2,137],98:[2,137],100:[2,137],101:[2,137],102:[2,137],106:[2,137],114:[2,137],122:[2,137],124:[2,137],125:[2,137],128:[2,137],129:[2,137],130:[2,137],131:[2,137],132:[2,137],133:[2,137]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],46:[2,145],51:[2,145],54:[2,145],69:[2,145],74:[2,145],82:[2,145],87:[2,145],89:[2,145],98:[2,145],100:[2,145],101:[2,145],102:[2,145],106:[2,145],114:[2,145],122:[2,145],124:[2,145],125:[2,145],128:[2,145],129:[2,145],130:[2,145],131:[2,145],132:[2,145],133:[2,145]},{25:[1,210],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{116:211,118:212,119:[1,213]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],46:[2,90],51:[2,90],54:[2,90],69:[2,90],74:[2,90],82:[2,90],87:[2,90],89:[2,90],98:[2,90],100:[2,90],101:[2,90],102:[2,90],106:[2,90],114:[2,90],122:[2,90],124:[2,90],125:[2,90],128:[2,90],129:[2,90],130:[2,90],131:[2,90],132:[2,90],133:[2,90]},{14:214,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,93],5:216,6:[2,93],25:[1,5],26:[2,93],46:[2,93],51:[2,93],54:[2,93],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,93],70:[2,66],71:[2,66],74:[2,93],76:[1,217],80:[2,66],81:[2,66],82:[2,93],87:[2,93],89:[2,93],98:[2,93],100:[2,93],101:[2,93],102:[2,93],106:[2,93],114:[2,93],122:[2,93],124:[2,93],125:[2,93],128:[2,93],129:[2,93],130:[2,93],131:[2,93],132:[2,93],133:[2,93]},{1:[2,42],6:[2,42],26:[2,42],98:[2,42],99:84,100:[2,42],102:[2,42],105:85,106:[2,42],107:66,122:[2,42],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,130],6:[2,130],26:[2,130],98:[2,130],99:84,100:[2,130],102:[2,130],105:85,106:[2,130],107:66,122:[2,130],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,71],98:[1,218]},{4:219,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,121],25:[2,121],51:[2,121],54:[1,221],87:[2,121],88:220,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,108],6:[2,108],25:[2,108],26:[2,108],37:[2,108],46:[2,108],51:[2,108],54:[2,108],63:[2,108],64:[2,108],65:[2,108],68:[2,108],69:[2,108],70:[2,108],71:[2,108],74:[2,108],80:[2,108],81:[2,108],82:[2,108],87:[2,108],89:[2,108],98:[2,108],100:[2,108],101:[2,108],102:[2,108],106:[2,108],112:[2,108],113:[2,108],114:[2,108],122:[2,108],124:[2,108],125:[2,108],128:[2,108],129:[2,108],130:[2,108],131:[2,108],132:[2,108],133:[2,108]},{6:[2,49],25:[2,49],50:222,51:[1,223],87:[2,49]},{6:[2,116],25:[2,116],26:[2,116],51:[2,116],82:[2,116],87:[2,116]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:224,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,122],25:[2,122],26:[2,122],51:[2,122],82:[2,122],87:[2,122]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],37:[2,107],40:[2,107],46:[2,107],51:[2,107],54:[2,107],63:[2,107],64:[2,107],65:[2,107],68:[2,107],69:[2,107],70:[2,107],71:[2,107],74:[2,107],76:[2,107],80:[2,107],81:[2,107],82:[2,107],87:[2,107],89:[2,107],98:[2,107],100:[2,107],101:[2,107],102:[2,107],106:[2,107],114:[2,107],122:[2,107],124:[2,107],125:[2,107],126:[2,107],127:[2,107],128:[2,107],129:[2,107],130:[2,107],131:[2,107],132:[2,107],133:[2,107],134:[2,107]},{5:225,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],46:[2,133],51:[2,133],54:[2,133],69:[2,133],74:[2,133],82:[2,133],87:[2,133],89:[2,133],98:[2,133],99:84,100:[1,62],101:[1,226],102:[1,63],105:85,106:[1,65],107:66,114:[2,133],122:[2,133],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],46:[2,135],51:[2,135],54:[2,135],69:[2,135],74:[2,135],82:[2,135],87:[2,135],89:[2,135],98:[2,135],99:84,100:[1,62],101:[1,227],102:[1,63],105:85,106:[1,65],107:66,114:[2,135],122:[2,135],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],46:[2,141],51:[2,141],54:[2,141],69:[2,141],74:[2,141],82:[2,141],87:[2,141],89:[2,141],98:[2,141],100:[2,141],101:[2,141],102:[2,141],106:[2,141],114:[2,141],122:[2,141],124:[2,141],125:[2,141],128:[2,141],129:[2,141],130:[2,141],131:[2,141],132:[2,141],133:[2,141]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],46:[2,142],51:[2,142],54:[2,142],69:[2,142],74:[2,142],82:[2,142],87:[2,142],89:[2,142],98:[2,142],99:84,100:[1,62],101:[2,142],102:[1,63],105:85,106:[1,65],107:66,114:[2,142],122:[2,142],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],46:[2,146],51:[2,146],54:[2,146],69:[2,146],74:[2,146],82:[2,146],87:[2,146],89:[2,146],98:[2,146],100:[2,146],101:[2,146],102:[2,146],106:[2,146],114:[2,146],122:[2,146],124:[2,146],125:[2,146],128:[2,146],129:[2,146],130:[2,146],131:[2,146],132:[2,146],133:[2,146]},{112:[2,148],113:[2,148]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],109:228,111:156},{51:[1,229],112:[2,153],113:[2,153]},{51:[2,150],112:[2,150],113:[2,150]},{51:[2,151],112:[2,151],113:[2,151]},{51:[2,152],112:[2,152],113:[2,152]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],46:[2,147],51:[2,147],54:[2,147],69:[2,147],74:[2,147],82:[2,147],87:[2,147],89:[2,147],98:[2,147],100:[2,147],101:[2,147],102:[2,147],106:[2,147],114:[2,147],122:[2,147],124:[2,147],125:[2,147],128:[2,147],129:[2,147],130:[2,147],131:[2,147],132:[2,147],133:[2,147]},{8:230,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:231,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],50:232,51:[1,233],74:[2,49]},{6:[2,85],25:[2,85],26:[2,85],51:[2,85],74:[2,85]},{6:[2,35],25:[2,35],26:[2,35],40:[1,234],51:[2,35],74:[2,35]},{6:[2,38],25:[2,38],26:[2,38],51:[2,38],74:[2,38]},{6:[2,39],25:[2,39],26:[2,39],40:[2,39],51:[2,39],74:[2,39]},{6:[2,40],25:[2,40],26:[2,40],40:[2,40],51:[2,40],74:[2,40]},{6:[2,41],25:[2,41],26:[2,41],40:[2,41],51:[2,41],74:[2,41]},{1:[2,5],6:[2,5],26:[2,5],98:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],46:[2,25],51:[2,25],54:[2,25],69:[2,25],74:[2,25],82:[2,25],87:[2,25],89:[2,25],94:[2,25],95:[2,25],98:[2,25],100:[2,25],101:[2,25],102:[2,25],106:[2,25],114:[2,25],117:[2,25],119:[2,25],122:[2,25],124:[2,25],125:[2,25],128:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],46:[2,184],51:[2,184],54:[2,184],69:[2,184],74:[2,184],82:[2,184],87:[2,184],89:[2,184],98:[2,184],99:84,100:[2,184],101:[2,184],102:[2,184],105:85,106:[2,184],107:66,114:[2,184],122:[2,184],124:[2,184],125:[2,184],128:[1,75],129:[1,78],130:[2,184],131:[2,184],132:[2,184],133:[2,184]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],46:[2,185],51:[2,185],54:[2,185],69:[2,185],74:[2,185],82:[2,185],87:[2,185],89:[2,185],98:[2,185],99:84,100:[2,185],101:[2,185],102:[2,185],105:85,106:[2,185],107:66,114:[2,185],122:[2,185],124:[2,185],125:[2,185],128:[1,75],129:[1,78],130:[2,185],131:[2,185],132:[2,185],133:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],46:[2,186],51:[2,186],54:[2,186],69:[2,186],74:[2,186],82:[2,186],87:[2,186],89:[2,186],98:[2,186],99:84,100:[2,186],101:[2,186],102:[2,186],105:85,106:[2,186],107:66,114:[2,186],122:[2,186],124:[2,186],125:[2,186],128:[1,75],129:[2,186],130:[2,186],131:[2,186],132:[2,186],133:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],46:[2,187],51:[2,187],54:[2,187],69:[2,187],74:[2,187],82:[2,187],87:[2,187],89:[2,187],98:[2,187],99:84,100:[2,187],101:[2,187],102:[2,187],105:85,106:[2,187],107:66,114:[2,187],122:[2,187],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[2,187],131:[2,187],132:[2,187],133:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],46:[2,188],51:[2,188],54:[2,188],69:[2,188],74:[2,188],82:[2,188],87:[2,188],89:[2,188],98:[2,188],99:84,100:[2,188],101:[2,188],102:[2,188],105:85,106:[2,188],107:66,114:[2,188],122:[2,188],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,188],132:[2,188],133:[1,82]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],46:[2,189],51:[2,189],54:[2,189],69:[2,189],74:[2,189],82:[2,189],87:[2,189],89:[2,189],98:[2,189],99:84,100:[2,189],101:[2,189],102:[2,189],105:85,106:[2,189],107:66,114:[2,189],122:[2,189],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[2,189],133:[1,82]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],46:[2,190],51:[2,190],54:[2,190],69:[2,190],74:[2,190],82:[2,190],87:[2,190],89:[2,190],98:[2,190],99:84,100:[2,190],101:[2,190],102:[2,190],105:85,106:[2,190],107:66,114:[2,190],122:[2,190],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,190],132:[2,190],133:[2,190]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],46:[2,175],51:[2,175],54:[2,175],69:[2,175],74:[2,175],82:[2,175],87:[2,175],89:[2,175],98:[2,175],99:84,100:[1,62],101:[2,175],102:[1,63],105:85,106:[1,65],107:66,114:[2,175],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],46:[2,174],51:[2,174],54:[2,174],69:[2,174],74:[2,174],82:[2,174],87:[2,174],89:[2,174],98:[2,174],99:84,100:[1,62],101:[2,174],102:[1,63],105:85,106:[1,65],107:66,114:[2,174],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],46:[2,97],51:[2,97],54:[2,97],63:[2,97],64:[2,97],65:[2,97],68:[2,97],69:[2,97],70:[2,97],71:[2,97],74:[2,97],80:[2,97],81:[2,97],82:[2,97],87:[2,97],89:[2,97],98:[2,97],100:[2,97],101:[2,97],102:[2,97],106:[2,97],114:[2,97],122:[2,97],124:[2,97],125:[2,97],128:[2,97],129:[2,97],130:[2,97],131:[2,97],132:[2,97],133:[2,97]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],37:[2,74],46:[2,74],51:[2,74],54:[2,74],63:[2,74],64:[2,74],65:[2,74],68:[2,74],69:[2,74],70:[2,74],71:[2,74],74:[2,74],76:[2,74],80:[2,74],81:[2,74],82:[2,74],87:[2,74],89:[2,74],98:[2,74],100:[2,74],101:[2,74],102:[2,74],106:[2,74],114:[2,74],122:[2,74],124:[2,74],125:[2,74],126:[2,74],127:[2,74],128:[2,74],129:[2,74],130:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],37:[2,75],46:[2,75],51:[2,75],54:[2,75],63:[2,75],64:[2,75],65:[2,75],68:[2,75],69:[2,75],70:[2,75],71:[2,75],74:[2,75],76:[2,75],80:[2,75],81:[2,75],82:[2,75],87:[2,75],89:[2,75],98:[2,75],100:[2,75],101:[2,75],102:[2,75],106:[2,75],114:[2,75],122:[2,75],124:[2,75],125:[2,75],126:[2,75],127:[2,75],128:[2,75],129:[2,75],130:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],37:[2,76],46:[2,76],51:[2,76],54:[2,76],63:[2,76],64:[2,76],65:[2,76],68:[2,76],69:[2,76],70:[2,76],71:[2,76],74:[2,76],76:[2,76],80:[2,76],81:[2,76],82:[2,76],87:[2,76],89:[2,76],98:[2,76],100:[2,76],101:[2,76],102:[2,76],106:[2,76],114:[2,76],122:[2,76],124:[2,76],125:[2,76],126:[2,76],127:[2,76],128:[2,76],129:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76]},{54:[1,188],69:[1,235],88:236,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:237,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{13:[2,110],28:[2,110],30:[2,110],31:[2,110],33:[2,110],34:[2,110],35:[2,110],42:[2,110],43:[2,110],44:[2,110],48:[2,110],49:[2,110],69:[2,110],72:[2,110],75:[2,110],79:[2,110],84:[2,110],85:[2,110],86:[2,110],92:[2,110],96:[2,110],97:[2,110],100:[2,110],102:[2,110],104:[2,110],106:[2,110],115:[2,110],121:[2,110],123:[2,110],124:[2,110],125:[2,110],126:[2,110],127:[2,110]},{13:[2,111],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],69:[2,111],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],37:[2,81],46:[2,81],51:[2,81],54:[2,81],63:[2,81],64:[2,81],65:[2,81],68:[2,81],69:[2,81],70:[2,81],71:[2,81],74:[2,81],76:[2,81],80:[2,81],81:[2,81],82:[2,81],87:[2,81],89:[2,81],98:[2,81],100:[2,81],101:[2,81],102:[2,81],106:[2,81],114:[2,81],122:[2,81],124:[2,81],125:[2,81],126:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81]},{8:238,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],37:[2,82],46:[2,82],51:[2,82],54:[2,82],63:[2,82],64:[2,82],65:[2,82],68:[2,82],69:[2,82],70:[2,82],71:[2,82],74:[2,82],76:[2,82],80:[2,82],81:[2,82],82:[2,82],87:[2,82],89:[2,82],98:[2,82],100:[2,82],101:[2,82],102:[2,82],106:[2,82],114:[2,82],122:[2,82],124:[2,82],125:[2,82],126:[2,82],127:[2,82],128:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],46:[2,98],51:[2,98],54:[2,98],63:[2,98],64:[2,98],65:[2,98],68:[2,98],69:[2,98],70:[2,98],71:[2,98],74:[2,98],80:[2,98],81:[2,98],82:[2,98],87:[2,98],89:[2,98],98:[2,98],100:[2,98],101:[2,98],102:[2,98],106:[2,98],114:[2,98],122:[2,98],124:[2,98],125:[2,98],128:[2,98],129:[2,98],130:[2,98],131:[2,98],132:[2,98],133:[2,98]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],46:[2,33],51:[2,33],54:[2,33],69:[2,33],74:[2,33],82:[2,33],87:[2,33],89:[2,33],98:[2,33],99:84,100:[2,33],101:[2,33],102:[2,33],105:85,106:[2,33],107:66,114:[2,33],122:[2,33],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:239,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],46:[2,103],51:[2,103],54:[2,103],63:[2,103],64:[2,103],65:[2,103],68:[2,103],69:[2,103],70:[2,103],71:[2,103],74:[2,103],80:[2,103],81:[2,103],82:[2,103],87:[2,103],89:[2,103],98:[2,103],100:[2,103],101:[2,103],102:[2,103],106:[2,103],114:[2,103],122:[2,103],124:[2,103],125:[2,103],128:[2,103],129:[2,103],130:[2,103],131:[2,103],132:[2,103],133:[2,103]},{6:[2,49],25:[2,49],50:240,51:[1,223],82:[2,49]},{6:[2,121],25:[2,121],26:[2,121],51:[2,121],54:[1,241],82:[2,121],87:[2,121],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{47:242,48:[1,57],49:[1,58]},{27:108,28:[1,70],41:109,52:243,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{46:[2,55],51:[2,55]},{8:244,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],46:[2,191],51:[2,191],54:[2,191],69:[2,191],74:[2,191],82:[2,191],87:[2,191],89:[2,191],98:[2,191],99:84,100:[2,191],101:[2,191],102:[2,191],105:85,106:[2,191],107:66,114:[2,191],122:[2,191],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:245,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],46:[2,193],51:[2,193],54:[2,193],69:[2,193],74:[2,193],82:[2,193],87:[2,193],89:[2,193],98:[2,193],99:84,100:[2,193],101:[2,193],102:[2,193],105:85,106:[2,193],107:66,114:[2,193],122:[2,193],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],46:[2,173],51:[2,173],54:[2,173],69:[2,173],74:[2,173],82:[2,173],87:[2,173],89:[2,173],98:[2,173],100:[2,173],101:[2,173],102:[2,173],106:[2,173],114:[2,173],122:[2,173],124:[2,173],125:[2,173],128:[2,173],129:[2,173],130:[2,173],131:[2,173],132:[2,173],133:[2,173]},{8:246,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,126],6:[2,126],25:[2,126],26:[2,126],46:[2,126],51:[2,126],54:[2,126],69:[2,126],74:[2,126],82:[2,126],87:[2,126],89:[2,126],94:[1,247],98:[2,126],100:[2,126],101:[2,126],102:[2,126],106:[2,126],114:[2,126],122:[2,126],124:[2,126],125:[2,126],128:[2,126],129:[2,126],130:[2,126],131:[2,126],132:[2,126],133:[2,126]},{5:248,25:[1,5]},{27:249,28:[1,70]},{116:250,118:212,119:[1,213]},{26:[1,251],117:[1,252],118:253,119:[1,213]},{26:[2,166],117:[2,166],119:[2,166]},{8:255,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],91:254,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,91],5:256,6:[2,91],25:[1,5],26:[2,91],46:[2,91],51:[2,91],54:[2,91],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,91],70:[1,98],71:[1,99],74:[2,91],77:89,80:[1,91],81:[2,101],82:[2,91],87:[2,91],89:[2,91],98:[2,91],100:[2,91],101:[2,91],102:[2,91],106:[2,91],114:[2,91],122:[2,91],124:[2,91],125:[2,91],128:[2,91],129:[2,91],130:[2,91],131:[2,91],132:[2,91],133:[2,91]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66]},{1:[2,94],6:[2,94],25:[2,94],26:[2,94],46:[2,94],51:[2,94],54:[2,94],69:[2,94],74:[2,94],82:[2,94],87:[2,94],89:[2,94],98:[2,94],100:[2,94],101:[2,94],102:[2,94],106:[2,94],114:[2,94],122:[2,94],124:[2,94],125:[2,94],128:[2,94],129:[2,94],130:[2,94],131:[2,94],132:[2,94],133:[2,94]},{14:257,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,131],6:[2,131],25:[2,131],26:[2,131],46:[2,131],51:[2,131],54:[2,131],63:[2,131],64:[2,131],65:[2,131],68:[2,131],69:[2,131],70:[2,131],71:[2,131],74:[2,131],80:[2,131],81:[2,131],82:[2,131],87:[2,131],89:[2,131],98:[2,131],100:[2,131],101:[2,131],102:[2,131],106:[2,131],114:[2,131],122:[2,131],124:[2,131],125:[2,131],128:[2,131],129:[2,131],130:[2,131],131:[2,131],132:[2,131],133:[2,131]},{6:[1,71],26:[1,258]},{8:259,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,61],13:[2,111],25:[2,61],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],51:[2,61],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],87:[2,61],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{6:[1,261],25:[1,262],87:[1,260]},{6:[2,50],8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[2,50],26:[2,50],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[2,50],84:[1,55],85:[1,56],86:[1,54],87:[2,50],90:263,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],26:[2,49],50:264,51:[1,223]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],46:[2,170],51:[2,170],54:[2,170],69:[2,170],74:[2,170],82:[2,170],87:[2,170],89:[2,170],98:[2,170],100:[2,170],101:[2,170],102:[2,170],106:[2,170],114:[2,170],117:[2,170],122:[2,170],124:[2,170],125:[2,170],128:[2,170],129:[2,170],130:[2,170],131:[2,170],132:[2,170],133:[2,170]},{8:265,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:266,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{112:[2,149],113:[2,149]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],111:267},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],46:[2,155],51:[2,155],54:[2,155],69:[2,155],74:[2,155],82:[2,155],87:[2,155],89:[2,155],98:[2,155],99:84,100:[2,155],101:[1,268],102:[2,155],105:85,106:[2,155],107:66,114:[1,269],122:[2,155],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],46:[2,156],51:[2,156],54:[2,156],69:[2,156],74:[2,156],82:[2,156],87:[2,156],89:[2,156],98:[2,156],99:84,100:[2,156],101:[1,270],102:[2,156],105:85,106:[2,156],107:66,114:[2,156],122:[2,156],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,272],25:[1,273],74:[1,271]},{6:[2,50],12:166,25:[2,50],26:[2,50],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:274,39:165,41:169,43:[1,46],74:[2,50],85:[1,112]},{8:275,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,276],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],37:[2,80],46:[2,80],51:[2,80],54:[2,80],63:[2,80],64:[2,80],65:[2,80],68:[2,80],69:[2,80],70:[2,80],71:[2,80],74:[2,80],76:[2,80],80:[2,80],81:[2,80],82:[2,80],87:[2,80],89:[2,80],98:[2,80],100:[2,80],101:[2,80],102:[2,80],106:[2,80],114:[2,80],122:[2,80],124:[2,80],125:[2,80],126:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80]},{8:277,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,69:[1,278],72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,279],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{69:[1,235],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,280],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],82:[1,281]},{6:[2,61],25:[2,61],26:[2,61],51:[2,61],82:[2,61],87:[2,61]},{5:282,25:[1,5]},{46:[2,53],51:[2,53]},{46:[2,56],51:[2,56],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,283],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:284,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:285,25:[1,5]},{1:[2,127],6:[2,127],25:[2,127],26:[2,127],46:[2,127],51:[2,127],54:[2,127],69:[2,127],74:[2,127],82:[2,127],87:[2,127],89:[2,127],98:[2,127],100:[2,127],101:[2,127],102:[2,127],106:[2,127],114:[2,127],122:[2,127],124:[2,127],125:[2,127],128:[2,127],129:[2,127],130:[2,127],131:[2,127],132:[2,127],133:[2,127]},{5:286,25:[1,5]},{26:[1,287],117:[1,288],118:253,119:[1,213]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],46:[2,164],51:[2,164],54:[2,164],69:[2,164],74:[2,164],82:[2,164],87:[2,164],89:[2,164],98:[2,164],100:[2,164],101:[2,164],102:[2,164],106:[2,164],114:[2,164],122:[2,164],124:[2,164],125:[2,164],128:[2,164],129:[2,164],130:[2,164],131:[2,164],132:[2,164],133:[2,164]},{5:289,25:[1,5]},{26:[2,167],117:[2,167],119:[2,167]},{5:290,25:[1,5],51:[1,291]},{25:[2,123],51:[2,123],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,92],6:[2,92],25:[2,92],26:[2,92],46:[2,92],51:[2,92],54:[2,92],69:[2,92],74:[2,92],82:[2,92],87:[2,92],89:[2,92],98:[2,92],100:[2,92],101:[2,92],102:[2,92],106:[2,92],114:[2,92],122:[2,92],124:[2,92],125:[2,92],128:[2,92],129:[2,92],130:[2,92],131:[2,92],132:[2,92],133:[2,92]},{1:[2,95],5:292,6:[2,95],25:[1,5],26:[2,95],46:[2,95],51:[2,95],54:[2,95],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,95],70:[1,98],71:[1,99],74:[2,95],77:89,80:[1,91],81:[2,101],82:[2,95],87:[2,95],89:[2,95],98:[2,95],100:[2,95],101:[2,95],102:[2,95],106:[2,95],114:[2,95],122:[2,95],124:[2,95],125:[2,95],128:[2,95],129:[2,95],130:[2,95],131:[2,95],132:[2,95],133:[2,95]},{98:[1,293]},{87:[1,294],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],37:[2,109],46:[2,109],51:[2,109],54:[2,109],63:[2,109],64:[2,109],65:[2,109],68:[2,109],69:[2,109],70:[2,109],71:[2,109],74:[2,109],80:[2,109],81:[2,109],82:[2,109],87:[2,109],89:[2,109],98:[2,109],100:[2,109],101:[2,109],102:[2,109],106:[2,109],112:[2,109],113:[2,109],114:[2,109],122:[2,109],124:[2,109],125:[2,109],128:[2,109],129:[2,109],130:[2,109],131:[2,109],132:[2,109],133:[2,109]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],90:295,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:296,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,117],25:[2,117],26:[2,117],51:[2,117],82:[2,117],87:[2,117]},{6:[1,261],25:[1,262],26:[1,297]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],46:[2,134],51:[2,134],54:[2,134],69:[2,134],74:[2,134],82:[2,134],87:[2,134],89:[2,134],98:[2,134],99:84,100:[1,62],101:[2,134],102:[1,63],105:85,106:[1,65],107:66,114:[2,134],122:[2,134],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],46:[2,136],51:[2,136],54:[2,136],69:[2,136],74:[2,136],82:[2,136],87:[2,136],89:[2,136],98:[2,136],99:84,100:[1,62],101:[2,136],102:[1,63],105:85,106:[1,65],107:66,114:[2,136],122:[2,136],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{112:[2,154],113:[2,154]},{8:298,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:299,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:300,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],37:[2,83],46:[2,83],51:[2,83],54:[2,83],63:[2,83],64:[2,83],65:[2,83],68:[2,83],69:[2,83],70:[2,83],71:[2,83],74:[2,83],80:[2,83],81:[2,83],82:[2,83],87:[2,83],89:[2,83],98:[2,83],100:[2,83],101:[2,83],102:[2,83],106:[2,83],112:[2,83],113:[2,83],114:[2,83],122:[2,83],124:[2,83],125:[2,83],128:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83]},{12:166,27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:301,39:165,41:169,43:[1,46],85:[1,112]},{6:[2,84],12:166,25:[2,84],26:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:302,85:[1,112]},{6:[2,86],25:[2,86],26:[2,86],51:[2,86],74:[2,86]},{6:[2,36],25:[2,36],26:[2,36],51:[2,36],74:[2,36],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:303,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,304],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],37:[2,114],46:[2,114],51:[2,114],54:[2,114],63:[2,114],64:[2,114],65:[2,114],68:[2,114],69:[2,114],70:[2,114],71:[2,114],74:[2,114],76:[2,114],80:[2,114],81:[2,114],82:[2,114],87:[2,114],89:[2,114],98:[2,114],100:[2,114],101:[2,114],102:[2,114],106:[2,114],114:[2,114],122:[2,114],124:[2,114],125:[2,114],126:[2,114],127:[2,114],128:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],37:[2,115],46:[2,115],51:[2,115],54:[2,115],63:[2,115],64:[2,115],65:[2,115],68:[2,115],69:[2,115],70:[2,115],71:[2,115],74:[2,115],76:[2,115],80:[2,115],81:[2,115],82:[2,115],87:[2,115],89:[2,115],98:[2,115],100:[2,115],101:[2,115],102:[2,115],106:[2,115],114:[2,115],122:[2,115],124:[2,115],125:[2,115],126:[2,115],127:[2,115],128:[2,115],129:[2,115],130:[2,115],131:[2,115],132:[2,115],133:[2,115],134:[2,115]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],46:[2,34],51:[2,34],54:[2,34],69:[2,34],74:[2,34],82:[2,34],87:[2,34],89:[2,34],98:[2,34],100:[2,34],101:[2,34],102:[2,34],106:[2,34],114:[2,34],122:[2,34],124:[2,34],125:[2,34],128:[2,34],129:[2,34],130:[2,34],131:[2,34],132:[2,34],133:[2,34]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],46:[2,104],51:[2,104],54:[2,104],63:[2,104],64:[2,104],65:[2,104],68:[2,104],69:[2,104],70:[2,104],71:[2,104],74:[2,104],80:[2,104],81:[2,104],82:[2,104],87:[2,104],89:[2,104],98:[2,104],100:[2,104],101:[2,104],102:[2,104],106:[2,104],114:[2,104],122:[2,104],124:[2,104],125:[2,104],128:[2,104],129:[2,104],130:[2,104],131:[2,104],132:[2,104],133:[2,104]},{1:[2,45],6:[2,45],25:[2,45],26:[2,45],46:[2,45],51:[2,45],54:[2,45],69:[2,45],74:[2,45],82:[2,45],87:[2,45],89:[2,45],98:[2,45],100:[2,45],101:[2,45],102:[2,45],106:[2,45],114:[2,45],122:[2,45],124:[2,45],125:[2,45],128:[2,45],129:[2,45],130:[2,45],131:[2,45],132:[2,45],133:[2,45]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],46:[2,192],51:[2,192],54:[2,192],69:[2,192],74:[2,192],82:[2,192],87:[2,192],89:[2,192],98:[2,192],100:[2,192],101:[2,192],102:[2,192],106:[2,192],114:[2,192],122:[2,192],124:[2,192],125:[2,192],128:[2,192],129:[2,192],130:[2,192],131:[2,192],132:[2,192],133:[2,192]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],46:[2,171],51:[2,171],54:[2,171],69:[2,171],74:[2,171],82:[2,171],87:[2,171],89:[2,171],98:[2,171],100:[2,171],101:[2,171],102:[2,171],106:[2,171],114:[2,171],117:[2,171],122:[2,171],124:[2,171],125:[2,171],128:[2,171],129:[2,171],130:[2,171],131:[2,171],132:[2,171],133:[2,171]},{1:[2,128],6:[2,128],25:[2,128],26:[2,128],46:[2,128],51:[2,128],54:[2,128],69:[2,128],74:[2,128],82:[2,128],87:[2,128],89:[2,128],98:[2,128],100:[2,128],101:[2,128],102:[2,128],106:[2,128],114:[2,128],122:[2,128],124:[2,128],125:[2,128],128:[2,128],129:[2,128],130:[2,128],131:[2,128],132:[2,128],133:[2,128]},{1:[2,129],6:[2,129],25:[2,129],26:[2,129],46:[2,129],51:[2,129],54:[2,129],69:[2,129],74:[2,129],82:[2,129],87:[2,129],89:[2,129],94:[2,129],98:[2,129],100:[2,129],101:[2,129],102:[2,129],106:[2,129],114:[2,129],122:[2,129],124:[2,129],125:[2,129],128:[2,129],129:[2,129],130:[2,129],131:[2,129],132:[2,129],133:[2,129]},{1:[2,162],6:[2,162],25:[2,162],26:[2,162],46:[2,162],51:[2,162],54:[2,162],69:[2,162],74:[2,162],82:[2,162],87:[2,162],89:[2,162],98:[2,162],100:[2,162],101:[2,162],102:[2,162],106:[2,162],114:[2,162],122:[2,162],124:[2,162],125:[2,162],128:[2,162],129:[2,162],130:[2,162],131:[2,162],132:[2,162],133:[2,162]},{5:305,25:[1,5]},{26:[1,306]},{6:[1,307],26:[2,168],117:[2,168],119:[2,168]},{8:308,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,96],6:[2,96],25:[2,96],26:[2,96],46:[2,96],51:[2,96],54:[2,96],69:[2,96],74:[2,96],82:[2,96],87:[2,96],89:[2,96],98:[2,96],100:[2,96],101:[2,96],102:[2,96],106:[2,96],114:[2,96],122:[2,96],124:[2,96],125:[2,96],128:[2,96],129:[2,96],130:[2,96],131:[2,96],132:[2,96],133:[2,96]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],46:[2,132],51:[2,132],54:[2,132],63:[2,132],64:[2,132],65:[2,132],68:[2,132],69:[2,132],70:[2,132],71:[2,132],74:[2,132],80:[2,132],81:[2,132],82:[2,132],87:[2,132],89:[2,132],98:[2,132],100:[2,132],101:[2,132],102:[2,132],106:[2,132],114:[2,132],122:[2,132],124:[2,132],125:[2,132],128:[2,132],129:[2,132],130:[2,132],131:[2,132],132:[2,132],133:[2,132]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],46:[2,112],51:[2,112],54:[2,112],63:[2,112],64:[2,112],65:[2,112],68:[2,112],69:[2,112],70:[2,112],71:[2,112],74:[2,112],80:[2,112],81:[2,112],82:[2,112],87:[2,112],89:[2,112],98:[2,112],100:[2,112],101:[2,112],102:[2,112],106:[2,112],114:[2,112],122:[2,112],124:[2,112],125:[2,112],128:[2,112],129:[2,112],130:[2,112],131:[2,112],132:[2,112],133:[2,112]},{6:[2,118],25:[2,118],26:[2,118],51:[2,118],82:[2,118],87:[2,118]},{6:[2,49],25:[2,49],26:[2,49],50:309,51:[1,223]},{6:[2,119],25:[2,119],26:[2,119],51:[2,119],82:[2,119],87:[2,119]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],46:[2,157],51:[2,157],54:[2,157],69:[2,157],74:[2,157],82:[2,157],87:[2,157],89:[2,157],98:[2,157],99:84,100:[2,157],101:[2,157],102:[2,157],105:85,106:[2,157],107:66,114:[1,310],122:[2,157],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,159],6:[2,159],25:[2,159],26:[2,159],46:[2,159],51:[2,159],54:[2,159],69:[2,159],74:[2,159],82:[2,159],87:[2,159],89:[2,159],98:[2,159],99:84,100:[2,159],101:[1,311],102:[2,159],105:85,106:[2,159],107:66,114:[2,159],122:[2,159],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],46:[2,158],51:[2,158],54:[2,158],69:[2,158],74:[2,158],82:[2,158],87:[2,158],89:[2,158],98:[2,158],99:84,100:[2,158],101:[2,158],102:[2,158],105:85,106:[2,158],107:66,114:[2,158],122:[2,158],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,87],25:[2,87],26:[2,87],51:[2,87],74:[2,87]},{6:[2,49],25:[2,49],26:[2,49],50:312,51:[1,233]},{26:[1,313],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],37:[2,113],46:[2,113],51:[2,113],54:[2,113],63:[2,113],64:[2,113],65:[2,113],68:[2,113],69:[2,113],70:[2,113],71:[2,113],74:[2,113],76:[2,113],80:[2,113],81:[2,113],82:[2,113],87:[2,113],89:[2,113],98:[2,113],100:[2,113],101:[2,113],102:[2,113],106:[2,113],114:[2,113],122:[2,113],124:[2,113],125:[2,113],126:[2,113],127:[2,113],128:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113]},{26:[1,314]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],46:[2,165],51:[2,165],54:[2,165],69:[2,165],74:[2,165],82:[2,165],87:[2,165],89:[2,165],98:[2,165],100:[2,165],101:[2,165],102:[2,165],106:[2,165],114:[2,165],122:[2,165],124:[2,165],125:[2,165],128:[2,165],129:[2,165],130:[2,165],131:[2,165],132:[2,165],133:[2,165]},{26:[2,169],117:[2,169],119:[2,169]},{25:[2,124],51:[2,124],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],26:[1,315]},{8:316,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:317,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[1,272],25:[1,273],26:[1,318]},{6:[2,37],25:[2,37],26:[2,37],51:[2,37],74:[2,37]},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],46:[2,163],51:[2,163],54:[2,163],69:[2,163],74:[2,163],82:[2,163],87:[2,163],89:[2,163],98:[2,163],100:[2,163],101:[2,163],102:[2,163],106:[2,163],114:[2,163],122:[2,163],124:[2,163],125:[2,163],128:[2,163],129:[2,163],130:[2,163],131:[2,163],132:[2,163],133:[2,163]},{6:[2,120],25:[2,120],26:[2,120],51:[2,120],82:[2,120],87:[2,120]},{1:[2,160],6:[2,160],25:[2,160],26:[2,160],46:[2,160],51:[2,160],54:[2,160],69:[2,160],74:[2,160],82:[2,160],87:[2,160],89:[2,160],98:[2,160],99:84,100:[2,160],101:[2,160],102:[2,160],105:85,106:[2,160],107:66,114:[2,160],122:[2,160],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,161],6:[2,161],25:[2,161],26:[2,161],46:[2,161],51:[2,161],54:[2,161],69:[2,161],74:[2,161],82:[2,161],87:[2,161],89:[2,161],98:[2,161],99:84,100:[2,161],101:[2,161],102:[2,161],105:85,106:[2,161],107:66,114:[2,161],122:[2,161],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,88],25:[2,88],26:[2,88],51:[2,88],74:[2,88]}],defaultActions:{57:[2,47],58:[2,48],72:[2,3],91:[2,102]},parseError:function d(a,b){throw new Error(a)},parse:function e(a){function m(){var a;a=b.lexer.lex()||1,typeof a!=="number"&&(a=b.symbols_[a]||a);return a}function l(a){c.length=c.length-2*a,d.length=d.length-a}var b=this,c=[0],d=[null],e=this.table,f="",g=0,h=0,i=0,j=2,k=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,typeof this.yy.parseError==="function"&&(this.parseError=this.yy.parseError);var n,o,p,q,r,s,t={},u,v,w,x;while(!0){p=c[c.length-1],this.defaultActions[p]?q=this.defaultActions[p]:(n==null&&(n=m()),q=e[p]&&e[p][n]);if(typeof q==="undefined"||!q.length||!q[0]){if(!i){x=[];for(u in e[p])this.terminals_[u]&&u>2&&x.push("'"+this.terminals_[u]+"'");var y="";this.lexer.showPosition?y="Parse error on line "+(g+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+x.join(", "):y="Parse error on line "+(g+1)+": Unexpected "+(n==1?"end of input":"'"+(this.terminals_[n]||n)+"'"),this.parseError(y,{text:this.lexer.match,token:this.terminals_[n]||n,line:this.lexer.yylineno,expected:x})}if(i==3){if(n==k)throw new Error(y||"Parsing halted.");h=this.lexer.yyleng,f=this.lexer.yytext,g=this.lexer.yylineno,n=m()}while(1){if(j.toString()in e[p])break;if(p==0)throw new Error(y||"Parsing halted.");l(1),p=c[c.length-1]}o=n,n=j,p=c[c.length-1],q=e[p]&&e[p][j],i=3}if(q[0]instanceof Array&&q.length>1)throw new Error("Parse Error: multiple actions possible at state: "+p+", token: "+n);switch(q[0]){case 1:c.push(n),d.push(this.lexer.yytext),c.push(q[1]),n=null,o?(n=o,o=null):(h=this.lexer.yyleng,f=this.lexer.yytext,g=this.lexer.yylineno,i>0&&i--);break;case 2:v=this.productions_[q[1]][1],t.$=d[d.length-v],s=this.performAction.call(t,f,h,g,this.yy,q[1],d);if(typeof s!=="undefined")return s;v&&(c=c.slice(0,-1*v*2),d=d.slice(0,-1*v)),c.push(this.productions_[q[1]][0]),d.push(t.$),w=e[c[c.length-2]][c[c.length-1]],c.push(w);break;case 3:return!0}}return!0}};return a}();typeof require!=="undefined"&&(a.parser=b,a.parse=function(){return b.parse.apply(b,arguments)},a.main=function c(b){if(!b[1])throw new Error("Usage: "+b[0]+" FILE");if(typeof process!=="undefined")var c=require("fs").readFileSync(require("path").join(process.cwd(),b[1]),"utf8");else var d=require("file").path(require("file").cwd()),c=d.join(b[1]).read({charset:"utf-8"});return a.parser.parse(c)},typeof module!=="undefined"&&require.main===module&&a.main(typeof process!=="undefined"?process.argv.slice(1):require("system").args))},require["./scope"]=new function(){var a=this;(function(){var b,c,d,e;e=require("./helpers"),c=e.extend,d=e.last,a.Scope=b=function(){function a(b,c,d){this.parent=b,this.expressions=c,this.method=d,this.variables=[{name:"arguments",type:"arguments"}],this.positions={},this.parent||(a.root=this)}a.root=null,a.prototype.add=function(a,b,c){var d;if(this.shared&&!c)return this.parent.add(a,b,c);return typeof (d=this.positions[a])==="number"?this.variables[d].type=b:this.positions[a]=this.variables.push({name:a,type:b})-1},a.prototype.find=function(a,b){if(this.check(a,b))return!0;this.add(a,"var");return!1},a.prototype.parameter=function(a){if(!this.shared||!this.parent.check(a,!0))return this.add(a,"param")},a.prototype.check=function(a,b){var c,d;c=!!this.type(a);if(c||b)return c;return!!((d=this.parent)!=null?d.check(a):void 0)},a.prototype.temporary=function(a,b){return a.length>1?"_"+a+(b>1?b:""):"_"+(b+parseInt(a,36)).toString(36).replace(/\d/g,"a")},a.prototype.type=function(a){var b,c,d,e;e=this.variables;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.name===a)return b.type}return null},a.prototype.freeVariable=function(a){var b,c;b=0;while(this.check(c=this.temporary(a,b),!0))b++;this.add(c,"var",!0);return c},a.prototype.assign=function(a,b){this.add(a,{value:b,assigned:!0});return this.hasAssignments=!0},a.prototype.hasDeclarations=function(){return!!this.declaredVariables().length},a.prototype.declaredVariables=function(){var a,b,c,d,e,f;a=[],b=[],f=this.variables;for(d=0,e=f.length;d<e;d++)c=f[d],c.type==="var"&&(c.name.charAt(0)==="_"?b:a).push(c.name);return a.sort().concat(b.sort())},a.prototype.assignedVariables=function(){var a,b,c,d,e;d=this.variables,e=[];for(b=0,c=d.length;b<c;b++)a=d[b],a.type.assigned&&e.push(""+a.name+" = "+a.type.value);return e};return a}()}).call(this)},require["./nodes"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,_,ba,bb,bc,bd,be,bf,bg,bh=Object.prototype.hasOwnProperty,bi=function(a,b){function d(){this.constructor=a}for(var c in b)bh.call(b,c)&&(a[c]=b[c]);d.prototype=b.prototype,a.prototype=new d,a.__super__=b.prototype;return a},bj=function(a,b){return function(){return a.apply(b,arguments)}};K=require("./scope").Scope,bg=require("./helpers"),X=bg.compact,_=bg.flatten,$=bg.extend,bb=bg.merge,Y=bg.del,bd=bg.starts,Z=bg.ends,ba=bg.last,a.extend=$,W=function(){return!0},B=function(){return!1},P=function(){return this},A=function(){this.negated=!this.negated;return this},a.Base=e=function(){function a(){}a.prototype.compile=function(a,b){var c;a=$({},a),b&&(a.level=b),c=this.unfoldSoak(a)||this,c.tab=a.indent;return a.level!==y&&c.isStatement(a)?c.compileClosure(a):c.compileNode(a)},a.prototype.compileClosure=function(a){if(this.jumps())throw SyntaxError("cannot use a pure statement in an expression.");a.sharedScope=!0;return i.wrap(this).compileNode(a)},a.prototype.cache=function(a,b,c){var e,f;if(this.isComplex()){e=new z(c||a.scope.freeVariable("ref")),f=new d(e,this);return b?[f.compile(a,b),e.value]:[f,e]}e=b?this.compile(a,b):this;return[e,e]},a.prototype.compileLoopReference=function(a,b){var c,d,e;c=d=this.compile(a,v),-Infinity<(e=+c)&&e<Infinity||o.test(c)&&a.scope.check(c,!0)||(c=""+(d=a.scope.freeVariable(b))+" = "+c);return[c,d]},a.prototype.makeReturn=function(){return new I(this)},a.prototype.contains=function(a){var b;b=!1,this.traverseChildren(!1,function(c){if(a(c)){b=!0;return!1}});return b},a.prototype.containsType=function(a){return this instanceof a||this.contains(function(b){return b instanceof a})},a.prototype.lastNonComment=function(a){var b;b=a.length;while(b--)if(!(a[b]instanceof k))return a[b];return null},a.prototype.toString=function(a,b){var c;a==null&&(a=""),b==null&&(b=this.constructor.name),c="\n"+a+b,this.soak&&(c+="?"),this.eachChild(function(b){return c+=b.toString(a+O)});return c},a.prototype.eachChild=function(a){var b,c,d,e,f,g,h,i;if(!this.children)return this;h=this.children;for(d=0,f=h.length;d<f;d++){b=h[d];if(this[b]){i=_([this[b]]);for(e=0,g=i.length;e<g;e++){c=i[e];if(a(c)===!1)return this}}}return this},a.prototype.traverseChildren=function(a,b){return this.eachChild(function(c){if(b(c)===!1)return!1;return c.traverseChildren(a,b)})},a.prototype.invert=function(){return new D("!",this)},a.prototype.unwrapAll=function(){var a;a=this;while(a!==(a=a.unwrap()))continue;return a},a.prototype.children=[],a.prototype.isStatement=B,a.prototype.jumps=B,a.prototype.isComplex=W,a.prototype.isChainable=B,a.prototype.isAssignable=B,a.prototype.unwrap=P,a.prototype.unfoldSoak=B,a.prototype.assigns=B;return a}(),a.Block=f=function(){function a(a){this.expressions=X(_(a||[]))}bi(a,e),a.prototype.children=["expressions"],a.prototype.push=function(a){this.expressions.push(a);return this},a.prototype.pop=function(){return this.expressions.pop()},a.prototype.unshift=function(a){this.expressions.unshift(a);return this},a.prototype.unwrap=function(){return this.expressions.length===1?this.expressions[0]:this},a.prototype.isEmpty=function(){return!this.expressions.length},a.prototype.isStatement=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.isStatement(a))return!0}return!1},a.prototype.jumps=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.jumps(a))return b}},a.prototype.makeReturn=function(){var a,b;b=this.expressions.length;while(b--){a=this.expressions[b];if(!(a instanceof k)){this.expressions[b]=a.makeReturn(),a instanceof I&&!a.expression&&this.expressions.splice(b,1);break}}return this},a.prototype.compile=function(b,c){b==null&&(b={});return b.scope?a.__super__.compile.call(this,b,c):this.compileRoot(b)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h;this.tab=a.indent,e=a.level===y,c=[],h=this.expressions;for(f=0,g=h.length;f<g;f++)d=h[f],d=d.unwrapAll(),d=d.unfoldSoak(a)||d,e?(d.front=!0,b=d.compile(a),c.push(d.isStatement(a)?b:this.tab+b+";")):c.push(d.compile(a,v));if(e)return c.join("\n");b=c.join(", ")||"void 0";return c.length>1&&a.level>=v?"("+b+")":b},a.prototype.compileRoot=function(a){var b;a.indent=this.tab=a.bare?"":O,a.scope=new K(null,this,null),a.level=y,b=this.compileWithDeclarations(a),b=b.replace(Q,"");return a.bare?b:"(function() {\n"+b+"\n}).call(this);\n"},a.prototype.compileWithDeclarations=function(a){var b,c,d,e,f,g,h,i;b=e="",i=this.expressions;for(d=0,h=i.length;d<h;d++){c=i[d],c=c.unwrap();if(!(c instanceof k||c instanceof z))break}a=bb(a,{level:y}),d&&(f=this.expressions.splice(d,this.expressions.length),b=this.compileNode(a),this.expressions=f),e=this.compileNode(a),g=a.scope,g.expressions===this&&(!a.globals&&a.scope.hasDeclarations()&&(b+=""+this.tab+"var "+g.declaredVariables().join(", ")+";\n"),g.hasAssignments&&(b+=""+this.tab+"var "+bc(g.assignedVariables().join(", "),this.tab)+";\n"));return b+e},a.wrap=function(b){if(b.length===1&&b[0]instanceof a)return b[0];return new a(b)};return a}(),a.Literal=z=function(){function a(a){this.value=a}bi(a,e),a.prototype.makeReturn=function(){return this.isStatement()?this:new I(this)},a.prototype.isAssignable=function(){return o.test(this.value)},a.prototype.isStatement=function(){var a;return(a=this.value)==="break"||a==="continue"||a==="debugger"},a.prototype.isComplex=B,a.prototype.assigns=function(a){return a===this.value},a.prototype.jumps=function(a){if(!this.isStatement())return!1;return a&&(a.loop||a.block&&this.value!=="continue")?!1:this},a.prototype.compileNode=function(a){var b;b=this.isUndefined?a.level>=t?"(void 0)":"void 0":this.value.reserved?'"'+this.value+'"':this.value;return this.isStatement()?""+this.tab+b+";":b},a.prototype.toString=function(){return' "'+this.value+'"'};return a}(),a.Return=I=function(){function a(a){a&&!a.unwrap().isUndefined&&(this.expression=a)}bi(a,e),a.prototype.children=["expression"],a.prototype.isStatement=W,a.prototype.makeReturn=P,a.prototype.jumps=P,a.prototype.compile=function(b,c){var d,e;d=(e=this.expression)!=null?e.makeReturn():void 0;return!d||d instanceof a?a.__super__.compile.call(this,b,c):d.compile(b,c)},a.prototype.compileNode=function(a){return this.tab+("return"+(this.expression?" "+this.expression.compile(a,x):"")+";")};return a}(),a.Value=U=function(){function a(b,c,d){if(!c&&b instanceof a)return b;this.base=b,this.properties=c||[],d&&(this[d]=!0);return this}bi(a,e),a.prototype.children=["base","properties"],a.prototype.push=function(a){this.properties.push(a);return this},a.prototype.hasProperties=function(){return!!this.properties.length},a.prototype.isArray=function(){return!this.properties.length&&this.base instanceof c},a.prototype.isComplex=function(){return this.hasProperties()||this.base.isComplex()},a.prototype.isAssignable=function(){return this.hasProperties()||this.base.isAssignable()},a.prototype.isSimpleNumber=function(){return this.base instanceof z&&J.test(this.base.value)},a.prototype.isAtomic=function(){var a,b,c,d;d=this.properties.concat(this.base);for(b=0,c=d.length;b<c;b++){a=d[b];if(a.soak||a instanceof g)return!1}return!0},a.prototype.isStatement=function(a){return!this.properties.length&&this.base.isStatement(a)},a.prototype.assigns=function(a){return!this.properties.length&&this.base.assigns(a)},a.prototype.jumps=function(a){return!this.properties.length&&this.base.jumps(a)},a.prototype.isObject=function(a){if(this.properties.length)return!1;return this.base instanceof C&&(!a||this.base.generated)},a.prototype.isSplice=function(){return ba(this.properties)instanceof L},a.prototype.makeReturn=function(){return this.properties.length?a.__super__.makeReturn.call(this):this.base.makeReturn()},a.prototype.unwrap=function(){return this.properties.length?this:this.base},a.prototype.cacheReference=function(b){var c,e,f,g;f=ba(this.properties);if(this.properties.length<2&&!this.base.isComplex()&&!(f!=null?f.isComplex():void 0))return[this,this];c=new a(this.base,this.properties.slice(0,-1)),c.isComplex()&&(e=new z(b.scope.freeVariable("base")),c=new a(new F(new d(e,c))));if(!f)return[c,e];f.isComplex()&&(g=new z(b.scope.freeVariable("name")),f=new s(new d(g,f.index)),g=new s(g));return[c.push(f),new a(e||c.base,[g||f])]},a.prototype.compileNode=function(a){var c,d,e,f,g;this.base.front=this.front,e=this.properties,c=this.base.compile(a,e.length?t:null),e[0]instanceof b&&this.isSimpleNumber()&&(c="("+c+")");for(f=0,g=e.length;f<g;f++)d=e[f],c+=d.compile(a);return c},a.prototype.unfoldSoak=function(b){var c,e,f,g,h,i,j,k;if(f=this.base.unfoldSoak(b)){Array.prototype.push.apply(f.body.properties,this.properties);return f}k=this.properties;for(e=0,j=k.length;e<j;e++){g=k[e];if(g.soak){g.soak=!1,c=new a(this.base,this.properties.slice(0,e)),i=new a(this.base,this.properties.slice(e)),c.isComplex()&&(h=new z(b.scope.freeVariable("ref")),c=new F(new d(h,c)),i.base=h);return new q(new l(c),i,{soak:!0})}}return null};return a}(),a.Comment=k=function(){function a(a){this.comment=a}bi(a,e),a.prototype.isStatement=W,a.prototype.makeReturn=P,a.prototype.compileNode=function(a,b){var c;c="/*"+bc(this.comment,this.tab)+"*/",(b||a.level)===y&&(c=a.indent+c);return c};return a}(),a.Call=g=function(){function a(a,b,c){this.args=b!=null?b:[],this.soak=c,this.isNew=!1,this.isSuper=a==="super",this.variable=this.isSuper?null:a}bi(a,e),a.prototype.children=["variable","args"],a.prototype.newInstance=function(){var b;b=this.variable.base||this.variable,b instanceof a?b.newInstance():this.isNew=!0;return this},a.prototype.superReference=function(a){var b,c;b=a.scope.method;if(!b)throw SyntaxError("cannot call super outside of a function.");c=b.name;if(!c)throw SyntaxError("cannot call super on an anonymous function.");return b.klass?""+b.klass+".__super__."+c:""+c+".__super__.constructor"},a.prototype.unfoldSoak=function(b){var c,d,e,f,g,h,i,j,k;if(this.soak){if(this.variable){if(d=be(b,this,"variable"))return d;j=(new U(this.variable)).cacheReference(b),e=j[0],g=j[1]}else e=new z(this.superReference(b)),g=new U(e);g=new a(g,this.args),g.isNew=this.isNew,e=new z("typeof "+e.compile(b)+' == "function"');return new q(e,new U(g),{soak:!0})}c=this,f=[];while(!0){if(c.variable instanceof a){f.push(c),c=c.variable;continue}if(!(c.variable instanceof U))break;f.push(c);if(!((c=c.variable.base)instanceof a))break}k=f.reverse();for(h=0,i=k.length;h<i;h++)c=k[h],d&&(c.variable instanceof a?c.variable=d:c.variable.base=d),d=be(b,c,"variable");return d},a.prototype.compileNode=function(a){var b,c,d,e;(e=this.variable)!=null&&(e.front=this.front);if(d=M.compileSplattedArray(a,this.args,!0))return this.compileSplat(a,d);c=function(){var c,d,e,f;e=this.args,f=[];for(c=0,d=e.length;c<d;c++)b=e[c],f.push(b.compile(a,v));return f}.call(this).join(", ");return this.isSuper?this.superReference(a)+(".call(this"+(c&&", "+c)+")"):(this.isNew?"new ":"")+this.variable.compile(a,t)+("("+c+")")},a.prototype.compileSuper=function(a,b){return""+this.superReference(b)+".call(this"+(a.length?", ":"")+a+")"},a.prototype.compileSplat=function(a,b){var c,d,e,f,g;if(this.isSuper)return""+this.superReference(a)+".apply(this, "+b+")";if(this.isNew){e=this.tab+O;return"(function(func, args, ctor) {\n"+e+"ctor.prototype = func.prototype;\n"+e+"var child = new ctor, result = func.apply(child, args);\n"+e+'return typeof result == "object" ? result : child;\n'+this.tab+"})("+this.variable.compile(a,v)+", "+b+", function() {})"}c=new U(this.variable),(f=c.properties.pop())&&c.isComplex()?(g=a.scope.freeVariable("ref"),d="("+g+" = "+c.compile(a,v)+")"+f.compile(a)):(d=c.compile(a,t),J.test(d)&&(d="("+d+")"),f?(g=d,d+=f.compile(a)):g="null");return""+d+".apply("+g+", "+b+")"};return a}(),a.Extends=m=function(){function a(a,b){this.child=a,this.parent=b}bi(a,e),a.prototype.children=["child","parent"],a.prototype.compile=function(a){bf("hasProp");return(new g(new U(new z(bf("extends"))),[this.child,this.parent])).compile(a)};return a}(),a.Access=b=function(){function a(a,b){this.name=a,this.name.asKey=!0,this.proto=b==="proto"?".prototype":"",this.soak=b==="soak"}bi(a,e),a.prototype.children=["name"],a.prototype.compile=function(a){var b;b=this.name.compile(a);return this.proto+(p.test(b)?"["+b+"]":"."+b)},a.prototype.isComplex=B;return a}(),a.Index=s=function(){function a(a){this.index=a}bi(a,e),a.prototype.children=["index"],a.prototype.compile=function(a){return(this.proto?".prototype":"")+("["+this.index.compile(a,x)+"]")},a.prototype.isComplex=function(){return this.index.isComplex()};return a}(),a.Range=H=function(){function a(a,b,c){this.from=a,this.to=b,this.exclusive=c==="exclusive",this.equals=this.exclusive?"":"="}bi(a,e),a.prototype.children=["from","to"],a.prototype.compileVariables=function(a){var b,c,d,e;a=bb(a,{top:!0}),c=this.from.cache(a,v),this.from=c[0],this.fromVar=c[1],d=this.to.cache(a,v),this.to=d[0],this.toVar=d[1],e=[this.fromVar.match(J),this.toVar.match(J)],this.fromNum=e[0],this.toNum=e[1],b=[],this.from!==this.fromVar&&b.push(this.from);if(this.to!==this.toVar)return b.push(this.to)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h;this.compileVariables(a);if(!a.index)return this.compileArray(a);if(this.fromNum&&this.toNum)return this.compileSimple(a);c=Y(a,"index"),f=Y(a,"step"),h=""+c+" = "+this.from+(this.to!==this.toVar?", "+this.to:""),e="("+this.fromVar+" <= "+this.toVar+" ? "+c,b=""+e+" <"+this.equals+" "+this.toVar+" : "+c+" >"+this.equals+" "+this.toVar+")",g=f?f.compile(a):"1",d=f?""+c+" += "+g:""+e+" += "+g+" : "+c+" -= "+g+")";return""+h+"; "+b+"; "+d},a.prototype.compileSimple=function(a){var b,c,d,e,f;f=[+this.fromNum,+this.toNum],b=f[0],e=f[1],c=Y(a,"index"),d=Y(a,"step"),d&&(d=""+c+" += "+d.compile(a));return b>e?""+c+" = "+b+"; "+c+" >"+this.equals+" "+e+"; "+(d||""+c+"--"):""+c+" = "+b+"; "+c+" <"+this.equals+" "+e+"; "+(d||""+c+"++")},a.prototype.compileArray=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;if(this.fromNum&&this.toNum&&Math.abs(this.fromNum-this.toNum)<=20){h=function(){n=[];for(var a=l=+this.fromNum,b=+this.toNum;l<=b?a<=b:a>=b;l<=b?a+=1:a-=1)n.push(a);return n}.apply(this,arguments),this.exclusive&&h.pop();return"["+h.join(", ")+"]"}e=this.tab+O,d=a.scope.freeVariable("i"),i=a.scope.freeVariable("results"),g="\n"+e+i+" = [];",this.fromNum&&this.toNum?(a.index=d,b=this.compileSimple(a)):(j=""+d+" = "+this.from+(this.to!==this.toVar?", "+this.to:""),c=""+this.fromVar+" <= "+this.toVar+" ?",b="var "+j+"; "+c+" "+d+" <"+this.equals+" "+this.toVar+" : "+d+" >"+this.equals+" "+this.toVar+"; "+c+" "+d+" += 1 : "+d+" -= 1"),f="{ "+i+".push("+d+"); }\n"+e+"return "+i+";\n"+a.indent;return"(function() {"+g+"\n"+e+"for ("+b+")"+f+"}).apply(this, arguments)"};return a}(),a.Slice=L=function(){function a(b){this.range=b,a.__super__.constructor.call(this)}bi(a,e),a.prototype.children=["range"],a.prototype.compileNode=function(a){var b,c,d,e,f,g;g=this.range,e=g.to,c=g.from,d=c&&c.compile(a,x)||"0",b=e&&e.compile(a,x),e&&(this.range.exclusive||+b!==-1)&&(f=", "+(this.range.exclusive?b:J.test(b)?(+b+1).toString():"("+b+" + 1) || 9e9"));return".slice("+d+(f||"")+")"};return a}(),a.Obj=C=function(){function a(a,b){this.generated=b!=null?b:!1,this.objects=this.properties=a||[]}bi(a,e),a.prototype.children=["properties"],a.prototype.compileNode=function(a){var b,c,e,f,g,h,i,j;j=this.properties;if(!j.length)return this.front?"({})":"{}";c=a.indent+=O,g=this.lastNonComment(this.properties),j=function(){var h,l;l=[];for(b=0,h=j.length;b<h;b++)i=j[b],f=b===j.length-1?"":i===g||i instanceof k?"\n":",\n",e=i instanceof k?"":c,i instanceof U&&i["this"]&&(i=new d(i.properties[0].name,i,"object")),i instanceof k||(i instanceof d||(i=new d(i,i,"object")),(i.variable.base||i.variable).asKey=!0),l.push(e+i.compile(a,y)+f);return l}(),j=j.join(""),h="{"+(j&&"\n"+j+"\n"+this.tab)+"}";return this.front?"("+h+")":h},a.prototype.assigns=function(a){var b,c,d,e;e=this.properties;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Arr=c=function(){function a(a){this.objects=a||[]}bi(a,e),a.prototype.children=["objects"],a.prototype.compileNode=function(a){var b,c;if(!this.objects.length)return"[]";a.indent+=O;if(b=M.compileSplattedArray(a,this.objects))return b;b=function(){var b,d,e,f;e=this.objects,f=[];for(b=0,d=e.length;b<d;b++)c=e[b],f.push(c.compile(a,v));return f}.call(this).join(", ");return b.indexOf("\n")<0?"["+b+"]":"[\n"+a.indent+b+"\n"+this.tab+"]"},a.prototype.assigns=function(a){var b,c,d,e;e=this.objects;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Class=h=function(){function a(a,b,c){this.variable=a,this.parent=b,this.body=c!=null?c:new f,this.boundFuncs=[],this.body.classBody=!0}bi(a,e),a.prototype.children=["variable","parent","body"],a.prototype.determineName=function(){var a,c;if(!this.variable)return null;a=(c=ba(this.variable.properties))?c instanceof b&&c.name.value:this.variable.base.value;return a&&(a=o.test(a)&&a)},a.prototype.setContext=function(a){return this.body.traverseChildren(!1,function(b){if(b.classBody)return!1;if(b instanceof z&&b.value==="this")return b.value=a;if(b instanceof j){b.klass=a;if(b.bound)return b.context=a}})},a.prototype.addBoundFunctions=function(a){var b,c,d,e,f,g;if(this.boundFuncs.length){f=this.boundFuncs,g=[];for(d=0,e=f.length;d<e;d++)c=f[d],b=c.compile(a),g.push(this.ctor.body.unshift(new z("this."+b+" = "+bf("bind")+"(this."+b+", this);")));return g}},a.prototype.addProperties=function(a,c){var e,f,g,h,i;h=a.base.properties.slice(0),i=[];while(e=h.shift()){if(e instanceof d){f=e.variable.base,delete e.context,g=e.value;if(f.value==="constructor"){if(this.ctor)throw new Error("cannot define more than one constructor in a class");if(g.bound)throw new Error("cannot define a constructor as a bound function");g instanceof j?e=this.ctor=g:e=this.ctor=new d(new U(new z(c)),g)}else e.variable["this"]||(e.variable=new U(new z(c),[new b(f,"proto")])),g instanceof j&&g.bound&&(this.boundFuncs.push(f),g.bound=!1)}i.push(e)}return i},a.prototype.walkBody=function(b){return this.traverseChildren(!1,bj(function(c){var d,e,g,h,i;if(c instanceof a)return!1;if(c instanceof f){i=d=c.expressions;for(e=0,h=i.length;e<h;e++)g=i[e],g instanceof U&&g.isObject(!0)&&(d[e]=this.addProperties(g,b));return c.expressions=d=_(d)}},this))},a.prototype.ensureConstructor=function(a){this.ctor||(this.ctor=new j,this.parent&&this.ctor.body.push(new g("super",[new M(new z("arguments"))])),this.body.expressions.unshift(this.ctor)),this.ctor.ctor=this.ctor.name=a,this.ctor.klass=null;return this.ctor.noReturn=!0},a.prototype.compileNode=function(a){var b,c,e,f;b=this.determineName(),f=b||this.name||"_Class",e=new z(f),this.setContext(f),this.walkBody(f),this.parent&&this.body.expressions.unshift(new m(e,this.parent)),this.ensureConstructor(f),this.body.expressions.push(e),this.addBoundFunctions(a),c=new F(i.wrap(this.body),!0),this.variable&&(c=new d(this.variable,c));return c.compile(a)};return a}(),a.Assign=d=function(){function a(a,b,c,d){this.variable=a,this.value=b,this.context=c,this.param=d&&d.param}bi(a,e),a.prototype.METHOD_DEF=/^(?:(\S+)\.prototype\.|\S+?)?\b([$A-Za-z_][$\w\x7f-\uffff]*)$/,a.prototype.children=["variable","value"],a.prototype.assigns=function(a){return this[this.context==="object"?"value":"variable"].assigns(a)},a.prototype.unfoldSoak=function(a){return be(a,this,"variable")},a.prototype.compileNode=function(a){var b,c,d,e,f;if(b=this.variable instanceof U){if(this.variable.isArray()||this.variable.isObject())return this.compilePatternMatch(a);if(this.variable.isSplice())return this.compileSplice(a);if((f=this.context)==="||="||f==="&&="||f==="?=")return this.compileConditional(a)}d=this.variable.compile(a,v),this.value instanceof j&&(c=this.METHOD_DEF.exec(d))&&(this.value.name=c[2],c[1]&&(this.value.klass=c[1])),e=this.value.compile(a,v);if(this.context==="object")return""+d+": "+e;if(!this.variable.isAssignable())throw SyntaxError('"'+this.variable.compile(a)+'" cannot be assigned.');this.context||b&&(this.variable.namespaced||this.variable.hasProperties())||(this.param?a.scope.add(d,"var"):a.scope.find(d)),e=d+(" "+(this.context||"=")+" ")+e;return a.level>v?"("+e+")":e},a.prototype.compilePatternMatch=function(c){var d,e,f,g,h,i,j,k,l,m,n,p,q,r,t,u,x,A,B,C,D,E;r=c.level===y,u=this.value,l=this.variable.base.objects;if(!(m=l.length)){if(r)return!1;f=u.compile(c);return c.level<w?f:"("+f+")"}i=this.variable.isObject();if(r&&m===1&&!((k=l[0])instanceof M)){k instanceof a?(B=k,h=B.variable.base,k=B.value):k.base instanceof F?(C=(new U(k.unwrapAll())).cacheReference(c),k=C[0],h=C[1]):h=i?k["this"]?k.properties[0].name:k:new z(0),d=o.test(h.unwrap().value||0),u=new U(u),u.properties.push(new(d?b:s)(h));return(new a(k,u)).compile(c)}x=u.compile(c,v),e=[],q=!1;if(!o.test(x)||this.variable.assigns(x))e.push(""+(n=c.scope.freeVariable("ref"))+" = "+x),x=n;for(g=0,A=l.length;g<A;g++){k=l[g],h=g,i&&(k instanceof a?(D=k,h=D.variable.base,k=D.value):k.base instanceof F?(E=(new U(k.unwrapAll())).cacheReference(c),k=E[0],h=E[1]):h=k["this"]?k.properties[0].name:k);if(!q&&k instanceof M)t=""+m+" <= "+x+".length ? "+bf("slice")+".call("+x+", "+g,(p=m-g-1)?(j=c.scope.freeVariable("i"),t+=", "+j+" = "+x+".length - "+p+") : ("+j+" = "+g+", [])"):t+=") : []",t=new z(t),q=""+j+"++";else{if(k instanceof M){k=k.name.compile(c);throw SyntaxError("multiple splats are disallowed in an assignment: "+k+" ...")}typeof h==="number"?(h=new z(q||h),d=!1):d=i&&o.test(h.unwrap().value||0),t=new U(new z(x),[new(d?b:s)(h)])}e.push((new a(k,t,null,{param:this.param})).compile(c,y))}r||e.push(x),f=X(e).join(", ");return c.level<v?f:"("+f+")"},a.prototype.compileConditional=function(b){var c,d,e;e=this.variable.cacheReference(b),c=e[0],d=e[1];return(new D(this.context.slice(0,-1),c,new a(d,this.value,"="))).compile(b)},a.prototype.compileSplice=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;k=this.variable.properties.pop().range,d=k.from,h=k.to,c=k.exclusive,g=this.variable.compile(a),l=(d!=null?d.cache(a,w):void 0)||["0","0"],e=l[0],f=l[1],h?(d!=null?d.isSimpleNumber():void 0)&&h.isSimpleNumber()?(h=+h.compile(a)- +f,c||(h+=1)):(h=h.compile(a)+" - "+f,c||(h+=" + 1")):h="9e9",m=this.value.cache(a,v),i=m[0],j=m[1],b="[].splice.apply("+g+", ["+e+", "+h+"].concat("+i+")), "+j;return a.level>y?"("+b+")":b};return a}(),a.Code=j=function(){function a(a,b,c){this.params=a||[],this.body=b||new f,this.bound=c==="boundfunc",this.bound&&(this.context="this")}bi(a,e),a.prototype.children=["params","body"],a.prototype.isStatement=function(){return!!this.ctor},a.prototype.jumps=B,a.prototype.compileNode=function(a){var b,e,f,g,h,i,j,k,l,m,n,o,p,r,s,u,v,w,x,y,A;a.scope=new K(a.scope,this.body,this),a.scope.shared=Y(a,"sharedScope"),a.indent+=O,delete a.bare,delete a.globals,o=[],e=[],x=this.params;for(r=0,u=x.length;r<u;r++){j=x[r];if(j.splat){l=new d(new U(new c(function(){var b,c,d,e;d=this.params,e=[];for(b=0,c=d.length;b<c;b++)i=d[b],e.push(i.asReference(a));return e}.call(this))),new U(new z("arguments")));break}}y=this.params;for(s=0,v=y.length;s<v;s++)j=y[s],j.isComplex()?(n=k=j.asReference(a),j.value&&(n=new D("?",k,j.value)),e.push(new d(new U(j.name),n,"=",{param:!0}))):(k=j,j.value&&(h=new z(k.name.value+" == null"),n=new d(new U(j.name),j.value,"="),e.push(new q(h,n)))),l||o.push(k);p=this.body.isEmpty(),l&&e.unshift(l),e.length&&(A=this.body.expressions).unshift.apply(A,e);if(!l)for(f=0,w=o.length;f<w;f++)m=o[f],a.scope.parameter(o[f]=m.compile(a));!p&&!this.noReturn&&this.body.makeReturn(),g=a.indent,b="function",this.ctor&&(b+=" "+this.name),b+="("+o.join(", ")+") {",this.body.isEmpty()||(b+="\n"+this.body.compileWithDeclarations(a)+"\n"+this.tab),b+="}";if(this.ctor)return this.tab+b;if(this.bound)return bf("bind")+("("+b+", "+this.context+")");return this.front||a.level>=t?"("+b+")":b},a.prototype.traverseChildren=function(b,c){if(b)return a.__super__.traverseChildren.call(this,b,c)};return a}(),a.Param=E=function(){function a(a,b,c){this.name=a,this.value=b,this.splat=c}bi(a,e),a.prototype.children=["name","value"],a.prototype.compile=function(a){return this.name.compile(a,v)},a.prototype.asReference=function(a){var b;if(this.reference)return this.reference;b=this.name,b["this"]?(b=b.properties[0].name,b.value.reserved&&(b=new z("_"+b.value))):b.isComplex()&&(b=new z(a.scope.freeVariable("arg"))),b=new U(b),this.splat&&(b=new M(b));return this.reference=b},a.prototype.isComplex=function(){return this.name.isComplex()};return a}(),a.Splat=M=function(){function a(a){this.name=a.compile?a:new z(a)}bi(a,e),a.prototype.children=["name"],a.prototype.isAssignable=W,a.prototype.assigns=function(a){return this.name.assigns(a)},a.prototype.compile=function(a){return this.index!=null?this.compileParam(a):this.name.compile(a)},a.compileSplattedArray=function(b,c,d){var e,f,g,h,i,j,k;i=-1;while((j=c[++i])&&!(j instanceof a))continue;if(i>=c.length)return"";if(c.length===1){g=c[0].compile(b,v);if(d)return g;return""+bf("slice")+".call("+g+")"}e=c.slice(i);for(h=0,k=e.length;h<k;h++)j=e[h],g=j.compile(b,v),e[h]=j instanceof a?""+bf("slice")+".call("+g+")":"["+g+"]";if(i===0)return e[0]+(".concat("+e.slice(1).join(", ")+")");f=function(){var a,d,e,f;e=c.slice(0,i),f=[];for(a=0,d=e.length;a<d;a++)j=e[a],f.push(j.compile(b,v));return f}();return"["+f.join(", ")+"].concat("+e.join(", ")+")"};return a}(),a.While=V=function(){function a(a,b){this.condition=(b!=null?b.invert:void 0)?a.invert():a,this.guard=b!=null?b.guard:void 0}bi(a,e),a.prototype.children=["condition","guard","body"],a.prototype.isStatement=W,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.addBody=function(a){this.body=a;return this},a.prototype.jumps=function(){var a,b,c,d;a=this.body.expressions;if(!a.length)return!1;for(c=0,d=a.length;c<d;c++){b=a[c];if(b.jumps({loop:!0}))return b}return!1},a.prototype.compileNode=function(a){var b,c,d,e;a.indent+=O,e="",b=this.body;if(b.isEmpty())b="";else{if(a.level>y||this.returns)d=a.scope.freeVariable("results"),e=""+this.tab+d+" = [];\n",b&&(b=G.wrap(d,b));this.guard&&(b=f.wrap([new q(this.guard,b)])),b="\n"+b.compile(a,y)+"\n"+this.tab}c=e+this.tab+("while ("+this.condition.compile(a,x)+") {"+b+"}"),this.returns&&(c+="\n"+this.tab+"return "+d+";");return c};return a}(),a.Op=D=function(){function c(b,c,d,e){if(b==="in")return new r(c,d);if(b==="do")return new g(c,c.params||[]);if(b==="new"){if(c instanceof g)return c.newInstance();c instanceof j&&c.bound&&(c=new F(c))}this.operator=a[b]||b,this.first=c,this.second=d,this.flip=!!e;return this}var a,b;bi(c,e),a={"==":"===","!=":"!==",of:"in"},b={"!==":"===","===":"!=="},c.prototype.children=["first","second"],c.prototype.isSimpleNumber=B,c.prototype.isUnary=function(){return!this.second},c.prototype.isChainable=function(){var a;return(a=this.operator)==="<"||a===">"||a===">="||a==="<="||a==="==="||a==="!=="},c.prototype.invert=function(){var a,d,e,f,g;if(this.isChainable()&&this.first.isChainable()){a=!0,d=this;while(d&&d.operator)a&&(a=d.operator in b),d=d.first;if(!a)return(new F(this)).invert();d=this;while(d&&d.operator)d.invert=!d.invert,d.operator=b[d.operator],d=d.first;return this}if(f=b[this.operator]){this.operator=f,this.first.unwrap()instanceof c&&this.first.invert();return this}return this.second?(new F(this)).invert():this.operator==="!"&&(e=this.first.unwrap())instanceof c&&((g=e.operator)==="!"||g==="in"||g==="instanceof")?e:new c("!",this)},c.prototype.unfoldSoak=function(a){var b;return((b=this.operator)==="++"||b==="--"||b==="delete")&&be(a,this,"first")},c.prototype.compileNode=function(a){var b;if(this.isUnary())return this.compileUnary(a);if(this.isChainable()&&this.first.isChainable())return this.compileChain(a);if(this.operator==="?")return this.compileExistence(a);this.first.front=this.front,b=this.first.compile(a,w)+" "+this.operator+" "+this.second.compile(a,w);return a.level>w?"("+b+")":b},c.prototype.compileChain=function(a){var b,c,d,e;e=this.first.second.cache(a),this.first.second=e[0],d=e[1],c=this.first.compile(a,w),b=""+c+" "+(this.invert?"&&":"||")+" "+d.compile(a)+" "+this.operator+" "+this.second.compile(a,w);return"("+b+")"},c.prototype.compileExistence=function(a){var b,c;this.first.isComplex()?(c=a.scope.freeVariable("ref"),b=new F(new d(new z(c),this.first))):(b=this.first,c=b.compile(a));return(new l(b)).compile(a)+(" ? "+c+" : "+this.second.compile(a,v))},c.prototype.compileUnary=function(a){var b,d;d=[b=this.operator],(b==="new"||b==="typeof"||b==="delete"||(b==="+"||b==="-")&&this.first instanceof c&&this.first.operator===b)&&d.push(" "),d.push(this.first.compile(a,w)),this.flip&&d.reverse();return d.join("")},c.prototype.toString=function(a){return c.__super__.toString.call(this,a,this.constructor.name+" "+this.operator)};return c}(),a.In=r=function(){function a(a,b){this.object=a,this.array=b}bi(a,e),a.prototype.children=["object","array"],a.prototype.invert=A,a.prototype.compileNode=function(a){return this.array instanceof U&&this.array.isArray()?this.compileOrTest(a):this.compileLoopTest(a)},a.prototype.compileOrTest=function(a){var b,c,d,e,f,g,h,i,j;i=this.object.cache(a,w),g=i[0],f=i[1],j=this.negated?[" !== "," && "]:[" === "," || "],b=j[0],c=j[1],h=function(){var c,h,i;h=this.array.base.objects,i=[];for(d=0,c=h.length;d<c;d++)e=h[d],i.push((d?f:g)+b+e.compile(a,w));return i}.call(this),h=h.join(c);return a.level<w?h:"("+h+")"},a.prototype.compileLoopTest=function(a){var b,c,d,e;e=this.object.cache(a,v),d=e[0],c=e[1],b=bf("indexOf")+(".call("+this.array.compile(a,v)+", "+c+") ")+(this.negated?"< 0":">= 0");if(d===c)return b;b=d+", "+b;return a.level<v?b:"("+b+")"},a.prototype.toString=function(b){return a.__super__.toString.call(this,b,this.constructor.name+(this.negated?"!":""))};return a}(),a.Try=S=function(){function a(a,b,c,d){this.attempt=a,this.error=b,this.recovery=c,this.ensure=d}bi(a,e),a.prototype.children=["attempt","recovery","ensure"],a.prototype.isStatement=W,a.prototype.jumps=function(a){var b;return this.attempt.jumps(a)||((b=this.recovery)!=null?b.jumps(a):void 0)},a.prototype.makeReturn=function(){this.attempt&&(this.attempt=this.attempt.makeReturn()),this.recovery&&(this.recovery=this.recovery.makeReturn());return this},a.prototype.compileNode=function(a){var b,c;a.indent+=O,c=this.error?" ("+this.error.compile(a)+") ":" ",b=this.recovery?" catch"+c+"{\n"+this.recovery.compile(a,y)+"\n"+this.tab+"}":!this.ensure&&!this.recovery?" catch (_e) {}":void 0;return""+this.tab+"try {\n"+this.attempt.compile(a,y)+"\n"+this.tab+"}"+(b||"")+(this.ensure?" finally {\n"+this.ensure.compile(a,y)+"\n"+this.tab+"}":"")};return a}(),a.Throw=R=function(){function a(a){this.expression=a}bi(a,e),a.prototype.children=["expression"],a.prototype.isStatement=W,a.prototype.jumps=B,a.prototype.makeReturn=P,a.prototype.compileNode=function(a){return this.tab+("throw "+this.expression.compile(a)+";")};return a}(),a.Existence=l=function(){function a(a){this.expression=a}bi(a,e),a.prototype.children=["expression"],a.prototype.invert=A,a.prototype.compileNode=function(a){var b,c;b=this.expression.compile(a,w),b=o.test(b)&&!a.scope.check(b)?this.negated?"typeof "+b+' == "undefined" || '+b+" === null":"typeof "+b+' != "undefined" && '+b+" !== null":(c=this.negated?"==":"!=",""+b+" "+c+" null");return a.level>u?"("+b+")":b};return a}(),a.Parens=F=function(){function a(a){this.body=a}bi(a,e),a.prototype.children=["body"],a.prototype.unwrap=function(){return this.body},a.prototype.isComplex=function(){return this.body.isComplex()},a.prototype.makeReturn=function(){return this.body.makeReturn()},a.prototype.compileNode=function(a){var b,c,d;d=this.body.unwrap();if(d instanceof U&&d.isAtomic()){d.front=this.front;return d.compile(a)}c=d.compile(a,x),b=a.level<w&&(d instanceof D||d instanceof g||d instanceof n&&d.returns);return b?c:"("+c+")"};return a}(),a.For=n=function(){function a(a,b){var c;this.source=b.source,this.guard=b.guard,this.step=b.step,this.name=b.name,this.index=b.index,this.body=f.wrap([a]),this.own=!!b.own,this.object=!!b.object,this.object&&(c=[this.index,this.name],this.name=c[0],this.index=c[1]);if(this.index instanceof U)throw SyntaxError("index cannot be a pattern matching expression");this.range=this.source instanceof U&&this.source.base instanceof H&&!this.source.properties.length,this.pattern=this.name instanceof U;if(this.range&&this.index)throw SyntaxError("indexes do not apply to range loops");if(this.range&&this.pattern)throw SyntaxError("cannot pattern match over range loops");this.returns=!1}bi(a,e),a.prototype.children=["body","source","guard","step"],a.prototype.isStatement=W,a.prototype.jumps=V.prototype.jumps,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.compileNode=function(a){var b,c,e,g,h,i,j,k,l,m,n,p,r,s,t,u,x,A,B,C,D;b=f.wrap([this.body]),k=(D=ba(b.expressions))!=null?D.jumps():void 0,k&&k instanceof I&&(this.returns=!1),x=this.range?this.source.base:this.source,u=a.scope,m=this.name&&this.name.compile(a,v),i=this.index&&this.index.compile(a,v),m&&!this.pattern&&u.find(m,{immediate:!0}),i&&u.find(i,{immediate:!0}),this.returns&&(t=u.freeVariable("results")),j=(this.range?m:i)||u.freeVariable("i"),this.pattern&&(m=j),C="",g="",c="",h=this.tab+O,this.range?e=x.compile(bb(a,{index:j,step:this.step})):(B=this.source.compile(a,v),(m||this.own)&&!o.test(B)&&(c=""+this.tab+(p=u.freeVariable("ref"))+" = "+B+";\n",B=p),m&&!this.pattern&&(n=""+m+" = "+B+"["+j+"]"),this.object||(l=u.freeVariable("len"),A=this.step?""+j+" += "+this.step.compile(a,w):""+j+"++",e=""+j+" = 0, "+l+" = "+B+".length; "+j+" < "+l+"; "+A)),this.returns&&(r=""+this.tab+t+" = [];\n",s="\n"+this.tab+"return "+t+";",b=G.wrap(t,b)),this.guard&&(b=f.wrap([new q(this.guard,b)])),this.pattern&&b.expressions.unshift(new d(this.name,new z(""+B+"["+j+"]"))),c+=this.pluckDirectCall(a,b),n&&(C="\n"+h+n+";"),this.object&&(e=""+j+" in "+B,this.own&&(g="\n"+h+"if (!"+bf("hasProp")+".call("+B+", "+j+")) continue;")),b=b.compile(bb(a,{indent:h}),y),b&&(b="\n"+b+"\n");return""+c+(r||"")+this.tab+"for ("+e+") {"+g+C+b+this.tab+"}"+(s||"")},a.prototype.pluckDirectCall=function(a,b){var c,e,f,h,i,k,l,m,n,o,p,q,r,s;e="",n=b.expressions;for(i=0,m=n.length;i<m;i++){f=n[i],f=f.unwrapAll();if(!(f instanceof g))continue;l=f.variable.unwrapAll();if(!(l instanceof j||l instanceof U&&((o=l.base)!=null?o.unwrapAll():void 0)instanceof j&&l.properties.length===1&&((p=(q=l.properties[0].name)!=null?q.value:void 0)==="call"||p==="apply")))continue;h=((r=l.base)!=null?r.unwrapAll():void 0)||l,k=new z(a.scope.freeVariable("fn")),c=new U(k),l.base&&(s=[c,l],l.base=s[0],c=s[1],args.unshift(new z("this"))),b.expressions[i]=new g(c,f.args),e+=this.tab+(new d(k,h)).compile(a,y)+";\n"}return e};return a}(),a.Switch=N=function(){function a(a,b,c){this.subject=a,this.cases=b,this.otherwise=c}bi(a,e),a.prototype.children=["subject","cases","otherwise"],a.prototype.isStatement=W,a.prototype.jumps=function(a){var b,c,d,e,f,g,h;a==null&&(a={block:!0}),f=this.cases;for(d=0,e=f.length;d<e;d++){g=f[d],c=g[0],b=g[1];if(b.jumps(a))return b}return(h=this.otherwise)!=null?h.jumps(a):void 0},a.prototype.makeReturn=function(){var a,b,c,d,e;d=this.cases;for(b=0,c=d.length;b<c;b++)a=d[b],a[1].makeReturn();(e=this.otherwise)!=null&&e.makeReturn();return this},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;i=a.indent+O,j=a.indent=i+O,d=this.tab+("switch ("+(((n=this.subject)!=null?n.compile(a,x):void 0)||!1)+") {\n"),o=this.cases;for(h=0,l=o.length;h<l;h++){p=o[h],f=p[0],b=p[1],q=_([f]);for(k=0,m=q.length;k<m;k++)e=q[k],this.subject||(e=e.invert()),d+=i+("case "+e.compile(a,x)+":\n");if(c=b.compile(a,y))d+=c+"\n";if(h===this.cases.length-1&&!this.otherwise)break;g=this.lastNonComment(b.expressions);if(g instanceof I||g instanceof z&&g.jumps()&&g.value!=="debugger")continue;d+=j+"break;\n"}this.otherwise&&this.otherwise.expressions.length&&(d+=i+("default:\n"+this.otherwise.compile(a,y)+"\n"));return d+this.tab+"}"};return a}(),a.If=q=function(){function a(a,b,c){this.body=b,c==null&&(c={}),this.condition=c.type==="unless"?a.invert():a,this.elseBody=null,this.isChain=!1,this.soak=c.soak}bi(a,e),a.prototype.children=["condition","body","elseBody"],a.prototype.bodyNode=function(){var a;return(a=this.body)!=null?a.unwrap():void 0},a.prototype.elseBodyNode=function(){var a;return(a=this.elseBody)!=null?a.unwrap():void 0},a.prototype.addElse=function(b){this.isChain?this.elseBodyNode().addElse(b):(this.isChain=b instanceof a,this.elseBody=this.ensureBlock(b));return this},a.prototype.isStatement=function(a){var b;return(a!=null?a.level:void 0)===y||this.bodyNode().isStatement(a)||((b=this.elseBodyNode())!=null?b.isStatement(a):void 0)},a.prototype.jumps=function(a){var b;return this.body.jumps(a)||((b=this.elseBody)!=null?b.jumps(a):void 0)},a.prototype.compileNode=function(a){return this.isStatement(a)?this.compileStatement(a):this.compileExpression(a)},a.prototype.makeReturn=function(){this.body&&(this.body=new f([this.body.makeReturn()])),this.elseBody&&(this.elseBody=new f([this.elseBody.makeReturn()]));return this},a.prototype.ensureBlock=function(a){return a instanceof f?a:new f([a])},a.prototype.compileStatement=function(a){var b,c,d,e;c=Y(a,"chainChild"),d=this.condition.compile(a,x),a.indent+=O,b=this.ensureBlock(this.body).compile(a),b&&(b="\n"+b+"\n"+this.tab),e="if ("+d+") {"+b+"}",c||(e=this.tab+e);if(!this.elseBody)return e;return e+" else "+(this.isChain?(a.indent=this.tab,a.chainChild=!0,this.elseBody.unwrap().compile(a,y)):"{\n"+this.elseBody.compile(a,y)+"\n"+this.tab+"}")},a.prototype.compileExpression=function(a){var b,c,d,e;e=this.condition.compile(a,u),c=this.bodyNode().compile(a,v),b=this.elseBodyNode()?this.elseBodyNode().compile(a,v):"void 0",d=""+e+" ? "+c+" : "+b;return a.level<u?d:"("+d+")"},a.prototype.unfoldSoak=function(){return this.soak&&this};return a}(),G={wrap:function(a,c){if(c.isEmpty()||ba(c.expressions).jumps())return c;return c.push(new g(new U(new z(a),[new b(new z("push"))]),[c.pop()]))}},i={wrap:function(a,c,d){var e,h,i,k,l;if(a.jumps())return a;i=new j([],f.wrap([a])),e=[];if((k=a.contains(this.literalArgs))||a.contains(this.literalThis))l=new z(k?"apply":"call"),e=[new z("this")],k&&e.push(new z("arguments")),i=new U(i,[new b(l)]);i.noReturn=d,h=new g(i,e);return c?f.wrap([h]):h},literalArgs:function(a){return a instanceof z&&a.value==="arguments"&&!a.asKey},literalThis:function(a){return a instanceof z&&a.value==="this"&&!a.asKey||a instanceof j&&a.bound}},be=function(a,b,c){var d;if(d=b[c].unfoldSoak(a)){b[c]=d.body,d.body=new U(b);return d}},T={"extends":"function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}",bind:"function(fn, me){ return function(){ return fn.apply(me, arguments); }; }",indexOf:"Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}",hasProp:"Object.prototype.hasOwnProperty",slice:"Array.prototype.slice"},y=1,x=2,v=3,u=4,w=5,t=6,O="  ",Q=/[ \t]+$/gm,o=/^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*$/,J=/^[+-]?\d+$/,p=/^['"]/,bf=function(a){var b;b="__"+a,K.root.assign(b,T[a]);return b},bc=function(a,b){return a.replace(/\n/g,"$&"+b)}}).call(this)},require["./coffee-script"]=new function(){var exports=this;(function(){var Lexer,RESERVED,compile,fs,lexer,parser,path,_ref;fs=require("fs"),path=require("path"),_ref=require("./lexer"),Lexer=_ref.Lexer,RESERVED=_ref.RESERVED,parser=require("./parser").parser,require.extensions?require.extensions[".coffee"]=function(a,b){var c;c=compile(fs.readFileSync(b,"utf8"));return a._compile(c,b)}:require.registerExtension&&require.registerExtension(".coffee",function(a){return compile(a)}),exports.VERSION="1.0.1",exports.RESERVED=RESERVED,exports.helpers=require("./helpers"),exports.compile=compile=function(a,b){b==null&&(b={});try{return parser.parse(lexer.tokenize(a)).compile(b)}catch(c){b.filename&&(c.message="In "+b.filename+", "+c.message);throw c}},exports.tokens=function(a,b){return lexer.tokenize(a,b)},exports.nodes=function(a,b){return typeof a==="string"?parser.parse(lexer.tokenize(a,b)):parser.parse(a)},exports.run=function(a,b){var c;c=module;while(c.parent)c=c.parent;c.filename=b.filename?fs.realpathSync(b.filename):".",c.moduleCache&&(c.moduleCache={});return path.extname(c.filename)!==".coffee"||require.extensions?c._compile(compile(a,b),c.filename):c._compile(a,c.filename)},exports.eval=function(code,options){var __dirname,__filename;__filename=module.filename=options.filename,__dirname=path.dirname(__filename);return eval(compile(code,options))},lexer=new Lexer,parser.lexer={lex:function(){var a,b;b=this.tokens[this.pos++]||[""],a=b[0],this.yytext=b[1],this.yylineno=b[2];return a},setInput:function(a){this.tokens=a;return this.pos=0},upcomingInput:function(){return""}},parser.yy=require("./nodes")}).call(this)},require["./browser"]=new function(){var exports=this;(function(){var CoffeeScript,runScripts;CoffeeScript=require("./coffee-script"),CoffeeScript.require=require,CoffeeScript.eval=function(code,options){return eval(CoffeeScript.compile(code,options))},CoffeeScript.run=function(a,b){b==null&&(b={}),b.bare=!0;return Function(CoffeeScript.compile(a,b))()};typeof window!="undefined"&&window!==null&&(CoffeeScript.load=function(a,b){var c;c=new(window.ActiveXObject||XMLHttpRequest)("Microsoft.XMLHTTP"),c.open("GET",a,!0),"overrideMimeType"in c&&c.overrideMimeType("text/plain"),c.onreadystatechange=function(){if(c.readyState===4)return CoffeeScript.run(c.responseText,b)};return c.send(null)},runScripts=function(){var a,b,c,d;d=document.getElementsByTagName("script");for(b=0,c=d.length;b<c;b++)a=d[b],a.type==="text/coffeescript"&&(a.src?CoffeeScript.load(a.src):CoffeeScript.run(a.innerHTML));return null},window.addEventListener?addEventListener("DOMContentLoaded",runScripts,!1):attachEvent("onload",runScripts))}).call(this)};return require["./coffee-script"]}()
;
(function() {
  var lookup, names, normalizeKey, parseHex, parseRGB, rgbParser;
  rgbParser = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),?\s*(\d?\.?\d*)?\)$/;
  parseHex = function(hexString) {
    hexString = hexString.replace(/#/, '');
    switch (hexString.length) {
      case 3:
      case 4:
        return [parseInt(hexString.substr(0, 1), 16) * 0x11, parseInt(hexString.substr(1, 1), 16) * 0x11, parseInt(hexString.substr(2, 1), 16) * 0x11, hexString.substr(3, 1).length ? (parseInt(hexString.substr(3, 1), 16) * 0x11) / 255.0 : null];
      case 6:
      case 8:
        return [parseInt(hexString.substr(0, 2), 16), parseInt(hexString.substr(2, 2), 16), parseInt(hexString.substr(4, 2), 16), hexString.substr(6, 2).length ? parseInt(hexString.substr(6, 2), 16) / 255.0 : 1.0];
      default:
        return undefined;
    }
  };
  parseRGB = function(colorString) {
    var _ref, bits;
    if (!(bits = rgbParser.exec(colorString))) {
      return null;
    }
    return [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3]), (typeof (_ref = bits[4]) !== "undefined" && _ref !== null) ? parseFloat(bits[4]) : 1.0];
  };
  normalizeKey = function(key) {
    return key.toString().toLowerCase().split(' ').join('');
  };
  window.Color = function(color) {
    var _ref, a, alpha, c, channels, parsedColor, self;
    if (arguments[0] == null ? undefined : arguments[0].channels) {
      return Color(arguments[0].channels());
    }
    parsedColor = null;
    if (arguments.length === 0) {
      parsedColor = [0, 0, 0, 0];
    } else if (arguments.length === 1 && Object.prototype.toString.call(arguments[0]) === '[object Array]') {
      alpha = (typeof (_ref = arguments[0][3]) !== "undefined" && _ref !== null) ? arguments[0][3] : 1;
      parsedColor = [parseInt(arguments[0][0]), parseInt(arguments[0][1]), parseInt(arguments[0][2]), parseFloat(alpha)];
    } else if (arguments.length === 2) {
      c = arguments[0];
      a = arguments[1];
      if (Object.prototype.toString.call(c) === '[object Array]') {
        parsedColor = [parseInt(c[0]), parseInt(c[1]), parseInt(c[2]), parseFloat(a)];
      } else if (Object.prototype.toString.call(c) !== '[object Array]') {
        parsedColor = lookup[normalizeKey(c)] || parseHex(c) || parseRGB(c);
        parsedColor[3] = a;
      }
    } else if (arguments.length > 2) {
      alpha = (typeof (_ref = arguments[3]) !== "undefined" && _ref !== null) ? arguments[3] : 1;
      parsedColor = [parseInt(arguments[0]), parseInt(arguments[1]), parseInt(arguments[2]), parseFloat(alpha)];
    } else {
      c = arguments[0];
      parsedColor = lookup[normalizeKey(c)] || parseHex(c) || parseRGB(c);
    }
    if (!(parsedColor)) {
      return null;
    }
    alpha = parsedColor[3];
    channels = [parsedColor[0], parsedColor[1], parsedColor[2], (typeof alpha !== "undefined" && alpha !== null) ? parseFloat(alpha) : 0.0];
    self = {
      channels: function() {
        return channels.copy();
      },
      r: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[0] = val;
          return self;
        } else {
          return channels[0];
        }
      },
      g: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[1] = val;
          return self;
        } else {
          return channels[1];
        }
      },
      b: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[2] = val;
          return self;
        } else {
          return channels[2];
        }
      },
      a: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[3] = val;
          return self;
        } else {
          return channels[3];
        }
      },
      equals: function(other) {
        return other.r() === self.r() && other.g() === self.g() && other.b() === self.b() && other.a() === self.a();
      },
      rgba: function() {
        return "rgba(" + (self.r()) + ", " + (self.g()) + ", " + (self.b()) + ", " + (self.a()) + ")";
      },
      toHex: function() {
        var hexFromNumber, hexString, padString;
        hexString = function(number) {
          return number.toString(16);
        };
        padString = function(hexString) {
          if (hexString.length === 1) {
            return (hexString = "0" + hexString);
          }
          return hexString;
        };
        hexFromNumber = function(number) {
          return padString(hexString(number));
        };
        return "#" + (hexFromNumber(channels[0])) + (hexFromNumber(channels[1])) + (hexFromNumber(channels[2]));
      },
      toString: function() {
        return self.rgba();
      }
    };
    return self;
  };
  lookup = {};
  names = [["000000", "Black"], ["000080", "Navy Blue"], ["0000C8", "Dark Blue"], ["0000FF", "Blue"], ["000741", "Stratos"], ["001B1C", "Swamp"], ["002387", "Resolution Blue"], ["002900", "Deep Fir"], ["002E20", "Burnham"], ["002FA7", "International Klein Blue"], ["003153", "Prussian Blue"], ["003366", "Midnight Blue"], ["003399", "Smalt"], ["003532", "Deep Teal"], ["003E40", "Cyprus"], ["004620", "Kaitoke Green"], ["0047AB", "Cobalt"], ["004816", "Crusoe"], ["004950", "Sherpa Blue"], ["0056A7", "Endeavour"], ["00581A", "Camarone"], ["0066CC", "Science Blue"], ["0066FF", "Blue Ribbon"], ["00755E", "Tropical Rain Forest"], ["0076A3", "Allports"], ["007BA7", "Deep Cerulean"], ["007EC7", "Lochmara"], ["007FFF", "Azure Radiance"], ["008080", "Teal"], ["0095B6", "Bondi Blue"], ["009DC4", "Pacific Blue"], ["00A693", "Persian Green"], ["00A86B", "Jade"], ["00CC99", "Caribbean Green"], ["00CCCC", "Robin's Egg Blue"], ["00FF00", "Green"], ["00FF7F", "Spring Green"], ["00FFFF", "Cyan / Aqua"], ["010D1A", "Blue Charcoal"], ["011635", "Midnight"], ["011D13", "Holly"], ["012731", "Daintree"], ["01361C", "Cardin Green"], ["01371A", "County Green"], ["013E62", "Astronaut Blue"], ["013F6A", "Regal Blue"], ["014B43", "Aqua Deep"], ["015E85", "Orient"], ["016162", "Blue Stone"], ["016D39", "Fun Green"], ["01796F", "Pine Green"], ["017987", "Blue Lagoon"], ["01826B", "Deep Sea"], ["01A368", "Green Haze"], ["022D15", "English Holly"], ["02402C", "Sherwood Green"], ["02478E", "Congress Blue"], ["024E46", "Evening Sea"], ["026395", "Bahama Blue"], ["02866F", "Observatory"], ["02A4D3", "Cerulean"], ["03163C", "Tangaroa"], ["032B52", "Green Vogue"], ["036A6E", "Mosque"], ["041004", "Midnight Moss"], ["041322", "Black Pearl"], ["042E4C", "Blue Whale"], ["044022", "Zuccini"], ["044259", "Teal Blue"], ["051040", "Deep Cove"], ["051657", "Gulf Blue"], ["055989", "Venice Blue"], ["056F57", "Watercourse"], ["062A78", "Catalina Blue"], ["063537", "Tiber"], ["069B81", "Gossamer"], ["06A189", "Niagara"], ["073A50", "Tarawera"], ["080110", "Jaguar"], ["081910", "Black Bean"], ["082567", "Deep Sapphire"], ["088370", "Elf Green"], ["08E8DE", "Bright Turquoise"], ["092256", "Downriver"], ["09230F", "Palm Green"], ["09255D", "Madison"], ["093624", "Bottle Green"], ["095859", "Deep Sea Green"], ["097F4B", "Salem"], ["0A001C", "Black Russian"], ["0A480D", "Dark Fern"], ["0A6906", "Japanese Laurel"], ["0A6F75", "Atoll"], ["0B0B0B", "Cod Gray"], ["0B0F08", "Marshland"], ["0B1107", "Gordons Green"], ["0B1304", "Black Forest"], ["0B6207", "San Felix"], ["0BDA51", "Malachite"], ["0C0B1D", "Ebony"], ["0C0D0F", "Woodsmoke"], ["0C1911", "Racing Green"], ["0C7A79", "Surfie Green"], ["0C8990", "Blue Chill"], ["0D0332", "Black Rock"], ["0D1117", "Bunker"], ["0D1C19", "Aztec"], ["0D2E1C", "Bush"], ["0E0E18", "Cinder"], ["0E2A30", "Firefly"], ["0F2D9E", "Torea Bay"], ["10121D", "Vulcan"], ["101405", "Green Waterloo"], ["105852", "Eden"], ["110C6C", "Arapawa"], ["120A8F", "Ultramarine"], ["123447", "Elephant"], ["126B40", "Jewel"], ["130000", "Diesel"], ["130A06", "Asphalt"], ["13264D", "Blue Zodiac"], ["134F19", "Parsley"], ["140600", "Nero"], ["1450AA", "Tory Blue"], ["151F4C", "Bunting"], ["1560BD", "Denim"], ["15736B", "Genoa"], ["161928", "Mirage"], ["161D10", "Hunter Green"], ["162A40", "Big Stone"], ["163222", "Celtic"], ["16322C", "Timber Green"], ["163531", "Gable Green"], ["171F04", "Pine Tree"], ["175579", "Chathams Blue"], ["182D09", "Deep Forest Green"], ["18587A", "Blumine"], ["19330E", "Palm Leaf"], ["193751", "Nile Blue"], ["1959A8", "Fun Blue"], ["1A1A68", "Lucky Point"], ["1AB385", "Mountain Meadow"], ["1B0245", "Tolopea"], ["1B1035", "Haiti"], ["1B127B", "Deep Koamaru"], ["1B1404", "Acadia"], ["1B2F11", "Seaweed"], ["1B3162", "Biscay"], ["1B659D", "Matisse"], ["1C1208", "Crowshead"], ["1C1E13", "Rangoon Green"], ["1C39BB", "Persian Blue"], ["1C402E", "Everglade"], ["1C7C7D", "Elm"], ["1D6142", "Green Pea"], ["1E0F04", "Creole"], ["1E1609", "Karaka"], ["1E1708", "El Paso"], ["1E385B", "Cello"], ["1E433C", "Te Papa Green"], ["1E90FF", "Dodger Blue"], ["1E9AB0", "Eastern Blue"], ["1F120F", "Night Rider"], ["1FC2C2", "Java"], ["20208D", "Jacksons Purple"], ["202E54", "Cloud Burst"], ["204852", "Blue Dianne"], ["211A0E", "Eternity"], ["220878", "Deep Blue"], ["228B22", "Forest Green"], ["233418", "Mallard"], ["240A40", "Violet"], ["240C02", "Kilamanjaro"], ["242A1D", "Log Cabin"], ["242E16", "Black Olive"], ["24500F", "Green House"], ["251607", "Graphite"], ["251706", "Cannon Black"], ["251F4F", "Port Gore"], ["25272C", "Shark"], ["25311C", "Green Kelp"], ["2596D1", "Curious Blue"], ["260368", "Paua"], ["26056A", "Paris M"], ["261105", "Wood Bark"], ["261414", "Gondola"], ["262335", "Steel Gray"], ["26283B", "Ebony Clay"], ["273A81", "Bay of Many"], ["27504B", "Plantation"], ["278A5B", "Eucalyptus"], ["281E15", "Oil"], ["283A77", "Astronaut"], ["286ACD", "Mariner"], ["290C5E", "Violent Violet"], ["292130", "Bastille"], ["292319", "Zeus"], ["292937", "Charade"], ["297B9A", "Jelly Bean"], ["29AB87", "Jungle Green"], ["2A0359", "Cherry Pie"], ["2A140E", "Coffee Bean"], ["2A2630", "Baltic Sea"], ["2A380B", "Turtle Green"], ["2A52BE", "Cerulean Blue"], ["2B0202", "Sepia Black"], ["2B194F", "Valhalla"], ["2B3228", "Heavy Metal"], ["2C0E8C", "Blue Gem"], ["2C1632", "Revolver"], ["2C2133", "Bleached Cedar"], ["2C8C84", "Lochinvar"], ["2D2510", "Mikado"], ["2D383A", "Outer Space"], ["2D569B", "St Tropaz"], ["2E0329", "Jacaranda"], ["2E1905", "Jacko Bean"], ["2E3222", "Rangitoto"], ["2E3F62", "Rhino"], ["2E8B57", "Sea Green"], ["2EBFD4", "Scooter"], ["2F270E", "Onion"], ["2F3CB3", "Governor Bay"], ["2F519E", "Sapphire"], ["2F5A57", "Spectra"], ["2F6168", "Casal"], ["300529", "Melanzane"], ["301F1E", "Cocoa Brown"], ["302A0F", "Woodrush"], ["304B6A", "San Juan"], ["30D5C8", "Turquoise"], ["311C17", "Eclipse"], ["314459", "Pickled Bluewood"], ["315BA1", "Azure"], ["31728D", "Calypso"], ["317D82", "Paradiso"], ["32127A", "Persian Indigo"], ["32293A", "Blackcurrant"], ["323232", "Mine Shaft"], ["325D52", "Stromboli"], ["327C14", "Bilbao"], ["327DA0", "Astral"], ["33036B", "Christalle"], ["33292F", "Thunder"], ["33CC99", "Shamrock"], ["341515", "Tamarind"], ["350036", "Mardi Gras"], ["350E42", "Valentino"], ["350E57", "Jagger"], ["353542", "Tuna"], ["354E8C", "Chambray"], ["363050", "Martinique"], ["363534", "Tuatara"], ["363C0D", "Waiouru"], ["36747D", "Ming"], ["368716", "La Palma"], ["370202", "Chocolate"], ["371D09", "Clinker"], ["37290E", "Brown Tumbleweed"], ["373021", "Birch"], ["377475", "Oracle"], ["380474", "Blue Diamond"], ["381A51", "Grape"], ["383533", "Dune"], ["384555", "Oxford Blue"], ["384910", "Clover"], ["394851", "Limed Spruce"], ["396413", "Dell"], ["3A0020", "Toledo"], ["3A2010", "Sambuca"], ["3A2A6A", "Jacarta"], ["3A686C", "William"], ["3A6A47", "Killarney"], ["3AB09E", "Keppel"], ["3B000B", "Temptress"], ["3B0910", "Aubergine"], ["3B1F1F", "Jon"], ["3B2820", "Treehouse"], ["3B7A57", "Amazon"], ["3B91B4", "Boston Blue"], ["3C0878", "Windsor"], ["3C1206", "Rebel"], ["3C1F76", "Meteorite"], ["3C2005", "Dark Ebony"], ["3C3910", "Camouflage"], ["3C4151", "Bright Gray"], ["3C4443", "Cape Cod"], ["3C493A", "Lunar Green"], ["3D0C02", "Bean  "], ["3D2B1F", "Bistre"], ["3D7D52", "Goblin"], ["3E0480", "Kingfisher Daisy"], ["3E1C14", "Cedar"], ["3E2B23", "English Walnut"], ["3E2C1C", "Black Marlin"], ["3E3A44", "Ship Gray"], ["3EABBF", "Pelorous"], ["3F2109", "Bronze"], ["3F2500", "Cola"], ["3F3002", "Madras"], ["3F307F", "Minsk"], ["3F4C3A", "Cabbage Pont"], ["3F583B", "Tom Thumb"], ["3F5D53", "Mineral Green"], ["3FC1AA", "Puerto Rico"], ["3FFF00", "Harlequin"], ["401801", "Brown Pod"], ["40291D", "Cork"], ["403B38", "Masala"], ["403D19", "Thatch Green"], ["405169", "Fiord"], ["40826D", "Viridian"], ["40A860", "Chateau Green"], ["410056", "Ripe Plum"], ["411F10", "Paco"], ["412010", "Deep Oak"], ["413C37", "Merlin"], ["414257", "Gun Powder"], ["414C7D", "East Bay"], ["4169E1", "Royal Blue"], ["41AA78", "Ocean Green"], ["420303", "Burnt Maroon"], ["423921", "Lisbon Brown"], ["427977", "Faded Jade"], ["431560", "Scarlet Gum"], ["433120", "Iroko"], ["433E37", "Armadillo"], ["434C59", "River Bed"], ["436A0D", "Green Leaf"], ["44012D", "Barossa"], ["441D00", "Morocco Brown"], ["444954", "Mako"], ["454936", "Kelp"], ["456CAC", "San Marino"], ["45B1E8", "Picton Blue"], ["460B41", "Loulou"], ["462425", "Crater Brown"], ["465945", "Gray Asparagus"], ["4682B4", "Steel Blue"], ["480404", "Rustic Red"], ["480607", "Bulgarian Rose"], ["480656", "Clairvoyant"], ["481C1C", "Cocoa Bean"], ["483131", "Woody Brown"], ["483C32", "Taupe"], ["49170C", "Van Cleef"], ["492615", "Brown Derby"], ["49371B", "Metallic Bronze"], ["495400", "Verdun Green"], ["496679", "Blue Bayoux"], ["497183", "Bismark"], ["4A2A04", "Bracken"], ["4A3004", "Deep Bronze"], ["4A3C30", "Mondo"], ["4A4244", "Tundora"], ["4A444B", "Gravel"], ["4A4E5A", "Trout"], ["4B0082", "Pigment Indigo"], ["4B5D52", "Nandor"], ["4C3024", "Saddle"], ["4C4F56", "Abbey"], ["4D0135", "Blackberry"], ["4D0A18", "Cab Sav"], ["4D1E01", "Indian Tan"], ["4D282D", "Cowboy"], ["4D282E", "Livid Brown"], ["4D3833", "Rock"], ["4D3D14", "Punga"], ["4D400F", "Bronzetone"], ["4D5328", "Woodland"], ["4E0606", "Mahogany"], ["4E2A5A", "Bossanova"], ["4E3B41", "Matterhorn"], ["4E420C", "Bronze Olive"], ["4E4562", "Mulled Wine"], ["4E6649", "Axolotl"], ["4E7F9E", "Wedgewood"], ["4EABD1", "Shakespeare"], ["4F1C70", "Honey Flower"], ["4F2398", "Daisy Bush"], ["4F69C6", "Indigo"], ["4F7942", "Fern Green"], ["4F9D5D", "Fruit Salad"], ["4FA83D", "Apple"], ["504351", "Mortar"], ["507096", "Kashmir Blue"], ["507672", "Cutty Sark"], ["50C878", "Emerald"], ["514649", "Emperor"], ["516E3D", "Chalet Green"], ["517C66", "Como"], ["51808F", "Smalt Blue"], ["52001F", "Castro"], ["520C17", "Maroon Oak"], ["523C94", "Gigas"], ["533455", "Voodoo"], ["534491", "Victoria"], ["53824B", "Hippie Green"], ["541012", "Heath"], ["544333", "Judge Gray"], ["54534D", "Fuscous Gray"], ["549019", "Vida Loca"], ["55280C", "Cioccolato"], ["555B10", "Saratoga"], ["556D56", "Finlandia"], ["5590D9", "Havelock Blue"], ["56B4BE", "Fountain Blue"], ["578363", "Spring Leaves"], ["583401", "Saddle Brown"], ["585562", "Scarpa Flow"], ["587156", "Cactus"], ["589AAF", "Hippie Blue"], ["591D35", "Wine Berry"], ["592804", "Brown Bramble"], ["593737", "Congo Brown"], ["594433", "Millbrook"], ["5A6E9C", "Waikawa Gray"], ["5A87A0", "Horizon"], ["5B3013", "Jambalaya"], ["5C0120", "Bordeaux"], ["5C0536", "Mulberry Wood"], ["5C2E01", "Carnaby Tan"], ["5C5D75", "Comet"], ["5D1E0F", "Redwood"], ["5D4C51", "Don Juan"], ["5D5C58", "Chicago"], ["5D5E37", "Verdigris"], ["5D7747", "Dingley"], ["5DA19F", "Breaker Bay"], ["5E483E", "Kabul"], ["5E5D3B", "Hemlock"], ["5F3D26", "Irish Coffee"], ["5F5F6E", "Mid Gray"], ["5F6672", "Shuttle Gray"], ["5FA777", "Aqua Forest"], ["5FB3AC", "Tradewind"], ["604913", "Horses Neck"], ["605B73", "Smoky"], ["606E68", "Corduroy"], ["6093D1", "Danube"], ["612718", "Espresso"], ["614051", "Eggplant"], ["615D30", "Costa Del Sol"], ["61845F", "Glade Green"], ["622F30", "Buccaneer"], ["623F2D", "Quincy"], ["624E9A", "Butterfly Bush"], ["625119", "West Coast"], ["626649", "Finch"], ["639A8F", "Patina"], ["63B76C", "Fern"], ["6456B7", "Blue Violet"], ["646077", "Dolphin"], ["646463", "Storm Dust"], ["646A54", "Siam"], ["646E75", "Nevada"], ["6495ED", "Cornflower Blue"], ["64CCDB", "Viking"], ["65000B", "Rosewood"], ["651A14", "Cherrywood"], ["652DC1", "Purple Heart"], ["657220", "Fern Frond"], ["65745D", "Willow Grove"], ["65869F", "Hoki"], ["660045", "Pompadour"], ["660099", "Purple"], ["66023C", "Tyrian Purple"], ["661010", "Dark Tan"], ["66B58F", "Silver Tree"], ["66FF00", "Bright Green"], ["66FF66", "Screamin' Green"], ["67032D", "Black Rose"], ["675FA6", "Scampi"], ["676662", "Ironside Gray"], ["678975", "Viridian Green"], ["67A712", "Christi"], ["683600", "Nutmeg Wood Finish"], ["685558", "Zambezi"], ["685E6E", "Salt Box"], ["692545", "Tawny Port"], ["692D54", "Finn"], ["695F62", "Scorpion"], ["697E9A", "Lynch"], ["6A442E", "Spice"], ["6A5D1B", "Himalaya"], ["6A6051", "Soya Bean"], ["6B2A14", "Hairy Heath"], ["6B3FA0", "Royal Purple"], ["6B4E31", "Shingle Fawn"], ["6B5755", "Dorado"], ["6B8BA2", "Bermuda Gray"], ["6B8E23", "Olive Drab"], ["6C3082", "Eminence"], ["6CDAE7", "Turquoise Blue"], ["6D0101", "Lonestar"], ["6D5E54", "Pine Cone"], ["6D6C6C", "Dove Gray"], ["6D9292", "Juniper"], ["6D92A1", "Gothic"], ["6E0902", "Red Oxide"], ["6E1D14", "Moccaccino"], ["6E4826", "Pickled Bean"], ["6E4B26", "Dallas"], ["6E6D57", "Kokoda"], ["6E7783", "Pale Sky"], ["6F440C", "Cafe Royale"], ["6F6A61", "Flint"], ["6F8E63", "Highland"], ["6F9D02", "Limeade"], ["6FD0C5", "Downy"], ["701C1C", "Persian Plum"], ["704214", "Sepia"], ["704A07", "Antique Bronze"], ["704F50", "Ferra"], ["706555", "Coffee"], ["708090", "Slate Gray"], ["711A00", "Cedar Wood Finish"], ["71291D", "Metallic Copper"], ["714693", "Affair"], ["714AB2", "Studio"], ["715D47", "Tobacco Brown"], ["716338", "Yellow Metal"], ["716B56", "Peat"], ["716E10", "Olivetone"], ["717486", "Storm Gray"], ["718080", "Sirocco"], ["71D9E2", "Aquamarine Blue"], ["72010F", "Venetian Red"], ["724A2F", "Old Copper"], ["726D4E", "Go Ben"], ["727B89", "Raven"], ["731E8F", "Seance"], ["734A12", "Raw Umber"], ["736C9F", "Kimberly"], ["736D58", "Crocodile"], ["737829", "Crete"], ["738678", "Xanadu"], ["74640D", "Spicy Mustard"], ["747D63", "Limed Ash"], ["747D83", "Rolling Stone"], ["748881", "Blue Smoke"], ["749378", "Laurel"], ["74C365", "Mantis"], ["755A57", "Russett"], ["7563A8", "Deluge"], ["76395D", "Cosmic"], ["7666C6", "Blue Marguerite"], ["76BD17", "Lima"], ["76D7EA", "Sky Blue"], ["770F05", "Dark Burgundy"], ["771F1F", "Crown of Thorns"], ["773F1A", "Walnut"], ["776F61", "Pablo"], ["778120", "Pacifika"], ["779E86", "Oxley"], ["77DD77", "Pastel Green"], ["780109", "Japanese Maple"], ["782D19", "Mocha"], ["782F16", "Peanut"], ["78866B", "Camouflage Green"], ["788A25", "Wasabi"], ["788BBA", "Ship Cove"], ["78A39C", "Sea Nymph"], ["795D4C", "Roman Coffee"], ["796878", "Old Lavender"], ["796989", "Rum"], ["796A78", "Fedora"], ["796D62", "Sandstone"], ["79DEEC", "Spray"], ["7A013A", "Siren"], ["7A58C1", "Fuchsia Blue"], ["7A7A7A", "Boulder"], ["7A89B8", "Wild Blue Yonder"], ["7AC488", "De York"], ["7B3801", "Red Beech"], ["7B3F00", "Cinnamon"], ["7B6608", "Yukon Gold"], ["7B7874", "Tapa"], ["7B7C94", "Waterloo "], ["7B8265", "Flax Smoke"], ["7B9F80", "Amulet"], ["7BA05B", "Asparagus"], ["7C1C05", "Kenyan Copper"], ["7C7631", "Pesto"], ["7C778A", "Topaz"], ["7C7B7A", "Concord"], ["7C7B82", "Jumbo"], ["7C881A", "Trendy Green"], ["7CA1A6", "Gumbo"], ["7CB0A1", "Acapulco"], ["7CB7BB", "Neptune"], ["7D2C14", "Pueblo"], ["7DA98D", "Bay Leaf"], ["7DC8F7", "Malibu"], ["7DD8C6", "Bermuda"], ["7E3A15", "Copper Canyon"], ["7F1734", "Claret"], ["7F3A02", "Peru Tan"], ["7F626D", "Falcon"], ["7F7589", "Mobster"], ["7F76D3", "Moody Blue"], ["7FFF00", "Chartreuse"], ["7FFFD4", "Aquamarine"], ["800000", "Maroon"], ["800B47", "Rose Bud Cherry"], ["801818", "Falu Red"], ["80341F", "Red Robin"], ["803790", "Vivid Violet"], ["80461B", "Russet"], ["807E79", "Friar Gray"], ["808000", "Olive"], ["808080", "Gray"], ["80B3AE", "Gulf Stream"], ["80B3C4", "Glacier"], ["80CCEA", "Seagull"], ["81422C", "Nutmeg"], ["816E71", "Spicy Pink"], ["817377", "Empress"], ["819885", "Spanish Green"], ["826F65", "Sand Dune"], ["828685", "Gunsmoke"], ["828F72", "Battleship Gray"], ["831923", "Merlot"], ["837050", "Shadow"], ["83AA5D", "Chelsea Cucumber"], ["83D0C6", "Monte Carlo"], ["843179", "Plum"], ["84A0A0", "Granny Smith"], ["8581D9", "Chetwode Blue"], ["858470", "Bandicoot"], ["859FAF", "Bali Hai"], ["85C4CC", "Half Baked"], ["860111", "Red Devil"], ["863C3C", "Lotus"], ["86483C", "Ironstone"], ["864D1E", "Bull Shot"], ["86560A", "Rusty Nail"], ["868974", "Bitter"], ["86949F", "Regent Gray"], ["871550", "Disco"], ["87756E", "Americano"], ["877C7B", "Hurricane"], ["878D91", "Oslo Gray"], ["87AB39", "Sushi"], ["885342", "Spicy Mix"], ["886221", "Kumera"], ["888387", "Suva Gray"], ["888D65", "Avocado"], ["893456", "Camelot"], ["893843", "Solid Pink"], ["894367", "Cannon Pink"], ["897D6D", "Makara"], ["8A3324", "Burnt Umber"], ["8A73D6", "True V"], ["8A8360", "Clay Creek"], ["8A8389", "Monsoon"], ["8A8F8A", "Stack"], ["8AB9F1", "Jordy Blue"], ["8B00FF", "Electric Violet"], ["8B0723", "Monarch"], ["8B6B0B", "Corn Harvest"], ["8B8470", "Olive Haze"], ["8B847E", "Schooner"], ["8B8680", "Natural Gray"], ["8B9C90", "Mantle"], ["8B9FEE", "Portage"], ["8BA690", "Envy"], ["8BA9A5", "Cascade"], ["8BE6D8", "Riptide"], ["8C055E", "Cardinal Pink"], ["8C472F", "Mule Fawn"], ["8C5738", "Potters Clay"], ["8C6495", "Trendy Pink"], ["8D0226", "Paprika"], ["8D3D38", "Sanguine Brown"], ["8D3F3F", "Tosca"], ["8D7662", "Cement"], ["8D8974", "Granite Green"], ["8D90A1", "Manatee"], ["8DA8CC", "Polo Blue"], ["8E0000", "Red Berry"], ["8E4D1E", "Rope"], ["8E6F70", "Opium"], ["8E775E", "Domino"], ["8E8190", "Mamba"], ["8EABC1", "Nepal"], ["8F021C", "Pohutukawa"], ["8F3E33", "El Salva"], ["8F4B0E", "Korma"], ["8F8176", "Squirrel"], ["8FD6B4", "Vista Blue"], ["900020", "Burgundy"], ["901E1E", "Old Brick"], ["907874", "Hemp"], ["907B71", "Almond Frost"], ["908D39", "Sycamore"], ["92000A", "Sangria"], ["924321", "Cumin"], ["926F5B", "Beaver"], ["928573", "Stonewall"], ["928590", "Venus"], ["9370DB", "Medium Purple"], ["93CCEA", "Cornflower"], ["93DFB8", "Algae Green"], ["944747", "Copper Rust"], ["948771", "Arrowtown"], ["950015", "Scarlett"], ["956387", "Strikemaster"], ["959396", "Mountain Mist"], ["960018", "Carmine"], ["964B00", "Brown"], ["967059", "Leather"], ["9678B6", "Purple Mountain's Majesty"], ["967BB6", "Lavender Purple"], ["96A8A1", "Pewter"], ["96BBAB", "Summer Green"], ["97605D", "Au Chico"], ["9771B5", "Wisteria"], ["97CD2D", "Atlantis"], ["983D61", "Vin Rouge"], ["9874D3", "Lilac Bush"], ["98777B", "Bazaar"], ["98811B", "Hacienda"], ["988D77", "Pale Oyster"], ["98FF98", "Mint Green"], ["990066", "Fresh Eggplant"], ["991199", "Violet Eggplant"], ["991613", "Tamarillo"], ["991B07", "Totem Pole"], ["996666", "Copper Rose"], ["9966CC", "Amethyst"], ["997A8D", "Mountbatten Pink"], ["9999CC", "Blue Bell"], ["9A3820", "Prairie Sand"], ["9A6E61", "Toast"], ["9A9577", "Gurkha"], ["9AB973", "Olivine"], ["9AC2B8", "Shadow Green"], ["9B4703", "Oregon"], ["9B9E8F", "Lemon Grass"], ["9C3336", "Stiletto"], ["9D5616", "Hawaiian Tan"], ["9DACB7", "Gull Gray"], ["9DC209", "Pistachio"], ["9DE093", "Granny Smith Apple"], ["9DE5FF", "Anakiwa"], ["9E5302", "Chelsea Gem"], ["9E5B40", "Sepia Skin"], ["9EA587", "Sage"], ["9EA91F", "Citron"], ["9EB1CD", "Rock Blue"], ["9EDEE0", "Morning Glory"], ["9F381D", "Cognac"], ["9F821C", "Reef Gold"], ["9F9F9C", "Star Dust"], ["9FA0B1", "Santas Gray"], ["9FD7D3", "Sinbad"], ["9FDD8C", "Feijoa"], ["A02712", "Tabasco"], ["A1750D", "Buttered Rum"], ["A1ADB5", "Hit Gray"], ["A1C50A", "Citrus"], ["A1DAD7", "Aqua Island"], ["A1E9DE", "Water Leaf"], ["A2006D", "Flirt"], ["A23B6C", "Rouge"], ["A26645", "Cape Palliser"], ["A2AAB3", "Gray Chateau"], ["A2AEAB", "Edward"], ["A3807B", "Pharlap"], ["A397B4", "Amethyst Smoke"], ["A3E3ED", "Blizzard Blue"], ["A4A49D", "Delta"], ["A4A6D3", "Wistful"], ["A4AF6E", "Green Smoke"], ["A50B5E", "Jazzberry Jam"], ["A59B91", "Zorba"], ["A5CB0C", "Bahia"], ["A62F20", "Roof Terracotta"], ["A65529", "Paarl"], ["A68B5B", "Barley Corn"], ["A69279", "Donkey Brown"], ["A6A29A", "Dawn"], ["A72525", "Mexican Red"], ["A7882C", "Luxor Gold"], ["A85307", "Rich Gold"], ["A86515", "Reno Sand"], ["A86B6B", "Coral Tree"], ["A8989B", "Dusty Gray"], ["A899E6", "Dull Lavender"], ["A8A589", "Tallow"], ["A8AE9C", "Bud"], ["A8AF8E", "Locust"], ["A8BD9F", "Norway"], ["A8E3BD", "Chinook"], ["A9A491", "Gray Olive"], ["A9ACB6", "Aluminium"], ["A9B2C3", "Cadet Blue"], ["A9B497", "Schist"], ["A9BDBF", "Tower Gray"], ["A9BEF2", "Perano"], ["A9C6C2", "Opal"], ["AA375A", "Night Shadz"], ["AA4203", "Fire"], ["AA8B5B", "Muesli"], ["AA8D6F", "Sandal"], ["AAA5A9", "Shady Lady"], ["AAA9CD", "Logan"], ["AAABB7", "Spun Pearl"], ["AAD6E6", "Regent St Blue"], ["AAF0D1", "Magic Mint"], ["AB0563", "Lipstick"], ["AB3472", "Royal Heath"], ["AB917A", "Sandrift"], ["ABA0D9", "Cold Purple"], ["ABA196", "Bronco"], ["AC8A56", "Limed Oak"], ["AC91CE", "East Side"], ["AC9E22", "Lemon Ginger"], ["ACA494", "Napa"], ["ACA586", "Hillary"], ["ACA59F", "Cloudy"], ["ACACAC", "Silver Chalice"], ["ACB78E", "Swamp Green"], ["ACCBB1", "Spring Rain"], ["ACDD4D", "Conifer"], ["ACE1AF", "Celadon"], ["AD781B", "Mandalay"], ["ADBED1", "Casper"], ["ADDFAD", "Moss Green"], ["ADE6C4", "Padua"], ["ADFF2F", "Green Yellow"], ["AE4560", "Hippie Pink"], ["AE6020", "Desert"], ["AE809E", "Bouquet"], ["AF4035", "Medium Carmine"], ["AF4D43", "Apple Blossom"], ["AF593E", "Brown Rust"], ["AF8751", "Driftwood"], ["AF8F2C", "Alpine"], ["AF9F1C", "Lucky"], ["AFA09E", "Martini"], ["AFB1B8", "Bombay"], ["AFBDD9", "Pigeon Post"], ["B04C6A", "Cadillac"], ["B05D54", "Matrix"], ["B05E81", "Tapestry"], ["B06608", "Mai Tai"], ["B09A95", "Del Rio"], ["B0E0E6", "Powder Blue"], ["B0E313", "Inch Worm"], ["B10000", "Bright Red"], ["B14A0B", "Vesuvius"], ["B1610B", "Pumpkin Skin"], ["B16D52", "Santa Fe"], ["B19461", "Teak"], ["B1E2C1", "Fringy Flower"], ["B1F4E7", "Ice Cold"], ["B20931", "Shiraz"], ["B2A1EA", "Biloba Flower"], ["B32D29", "Tall Poppy"], ["B35213", "Fiery Orange"], ["B38007", "Hot Toddy"], ["B3AF95", "Taupe Gray"], ["B3C110", "La Rioja"], ["B43332", "Well Read"], ["B44668", "Blush"], ["B4CFD3", "Jungle Mist"], ["B57281", "Turkish Rose"], ["B57EDC", "Lavender"], ["B5A27F", "Mongoose"], ["B5B35C", "Olive Green"], ["B5D2CE", "Jet Stream"], ["B5ECDF", "Cruise"], ["B6316C", "Hibiscus"], ["B69D98", "Thatch"], ["B6B095", "Heathered Gray"], ["B6BAA4", "Eagle"], ["B6D1EA", "Spindle"], ["B6D3BF", "Gum Leaf"], ["B7410E", "Rust"], ["B78E5C", "Muddy Waters"], ["B7A214", "Sahara"], ["B7A458", "Husk"], ["B7B1B1", "Nobel"], ["B7C3D0", "Heather"], ["B7F0BE", "Madang"], ["B81104", "Milano Red"], ["B87333", "Copper"], ["B8B56A", "Gimblet"], ["B8C1B1", "Green Spring"], ["B8C25D", "Celery"], ["B8E0F9", "Sail"], ["B94E48", "Chestnut"], ["B95140", "Crail"], ["B98D28", "Marigold"], ["B9C46A", "Wild Willow"], ["B9C8AC", "Rainee"], ["BA0101", "Guardsman Red"], ["BA450C", "Rock Spray"], ["BA6F1E", "Bourbon"], ["BA7F03", "Pirate Gold"], ["BAB1A2", "Nomad"], ["BAC7C9", "Submarine"], ["BAEEF9", "Charlotte"], ["BB3385", "Medium Red Violet"], ["BB8983", "Brandy Rose"], ["BBD009", "Rio Grande"], ["BBD7C1", "Surf"], ["BCC9C2", "Powder Ash"], ["BD5E2E", "Tuscany"], ["BD978E", "Quicksand"], ["BDB1A8", "Silk"], ["BDB2A1", "Malta"], ["BDB3C7", "Chatelle"], ["BDBBD7", "Lavender Gray"], ["BDBDC6", "French Gray"], ["BDC8B3", "Clay Ash"], ["BDC9CE", "Loblolly"], ["BDEDFD", "French Pass"], ["BEA6C3", "London Hue"], ["BEB5B7", "Pink Swan"], ["BEDE0D", "Fuego"], ["BF5500", "Rose of Sharon"], ["BFB8B0", "Tide"], ["BFBED8", "Blue Haze"], ["BFC1C2", "Silver Sand"], ["BFC921", "Key Lime Pie"], ["BFDBE2", "Ziggurat"], ["BFFF00", "Lime"], ["C02B18", "Thunderbird"], ["C04737", "Mojo"], ["C08081", "Old Rose"], ["C0C0C0", "Silver"], ["C0D3B9", "Pale Leaf"], ["C0D8B6", "Pixie Green"], ["C1440E", "Tia Maria"], ["C154C1", "Fuchsia Pink"], ["C1A004", "Buddha Gold"], ["C1B7A4", "Bison Hide"], ["C1BAB0", "Tea"], ["C1BECD", "Gray Suit"], ["C1D7B0", "Sprout"], ["C1F07C", "Sulu"], ["C26B03", "Indochine"], ["C2955D", "Twine"], ["C2BDB6", "Cotton Seed"], ["C2CAC4", "Pumice"], ["C2E8E5", "Jagged Ice"], ["C32148", "Maroon Flush"], ["C3B091", "Indian Khaki"], ["C3BFC1", "Pale Slate"], ["C3C3BD", "Gray Nickel"], ["C3CDE6", "Periwinkle Gray"], ["C3D1D1", "Tiara"], ["C3DDF9", "Tropical Blue"], ["C41E3A", "Cardinal"], ["C45655", "Fuzzy Wuzzy Brown"], ["C45719", "Orange Roughy"], ["C4C4BC", "Mist Gray"], ["C4D0B0", "Coriander"], ["C4F4EB", "Mint Tulip"], ["C54B8C", "Mulberry"], ["C59922", "Nugget"], ["C5994B", "Tussock"], ["C5DBCA", "Sea Mist"], ["C5E17A", "Yellow Green"], ["C62D42", "Brick Red"], ["C6726B", "Contessa"], ["C69191", "Oriental Pink"], ["C6A84B", "Roti"], ["C6C3B5", "Ash"], ["C6C8BD", "Kangaroo"], ["C6E610", "Las Palmas"], ["C7031E", "Monza"], ["C71585", "Red Violet"], ["C7BCA2", "Coral Reef"], ["C7C1FF", "Melrose"], ["C7C4BF", "Cloud"], ["C7C9D5", "Ghost"], ["C7CD90", "Pine Glade"], ["C7DDE5", "Botticelli"], ["C88A65", "Antique Brass"], ["C8A2C8", "Lilac"], ["C8A528", "Hokey Pokey"], ["C8AABF", "Lily"], ["C8B568", "Laser"], ["C8E3D7", "Edgewater"], ["C96323", "Piper"], ["C99415", "Pizza"], ["C9A0DC", "Light Wisteria"], ["C9B29B", "Rodeo Dust"], ["C9B35B", "Sundance"], ["C9B93B", "Earls Green"], ["C9C0BB", "Silver Rust"], ["C9D9D2", "Conch"], ["C9FFA2", "Reef"], ["C9FFE5", "Aero Blue"], ["CA3435", "Flush Mahogany"], ["CABB48", "Turmeric"], ["CADCD4", "Paris White"], ["CAE00D", "Bitter Lemon"], ["CAE6DA", "Skeptic"], ["CB8FA9", "Viola"], ["CBCAB6", "Foggy Gray"], ["CBD3B0", "Green Mist"], ["CBDBD6", "Nebula"], ["CC3333", "Persian Red"], ["CC5500", "Burnt Orange"], ["CC7722", "Ochre"], ["CC8899", "Puce"], ["CCCAA8", "Thistle Green"], ["CCCCFF", "Periwinkle"], ["CCFF00", "Electric Lime"], ["CD5700", "Tenn"], ["CD5C5C", "Chestnut Rose"], ["CD8429", "Brandy Punch"], ["CDF4FF", "Onahau"], ["CEB98F", "Sorrell Brown"], ["CEBABA", "Cold Turkey"], ["CEC291", "Yuma"], ["CEC7A7", "Chino"], ["CFA39D", "Eunry"], ["CFB53B", "Old Gold"], ["CFDCCF", "Tasman"], ["CFE5D2", "Surf Crest"], ["CFF9F3", "Humming Bird"], ["CFFAF4", "Scandal"], ["D05F04", "Red Stage"], ["D06DA1", "Hopbush"], ["D07D12", "Meteor"], ["D0BEF8", "Perfume"], ["D0C0E5", "Prelude"], ["D0F0C0", "Tea Green"], ["D18F1B", "Geebung"], ["D1BEA8", "Vanilla"], ["D1C6B4", "Soft Amber"], ["D1D2CA", "Celeste"], ["D1D2DD", "Mischka"], ["D1E231", "Pear"], ["D2691E", "Hot Cinnamon"], ["D27D46", "Raw Sienna"], ["D29EAA", "Careys Pink"], ["D2B48C", "Tan"], ["D2DA97", "Deco"], ["D2F6DE", "Blue Romance"], ["D2F8B0", "Gossip"], ["D3CBBA", "Sisal"], ["D3CDC5", "Swirl"], ["D47494", "Charm"], ["D4B6AF", "Clam Shell"], ["D4BF8D", "Straw"], ["D4C4A8", "Akaroa"], ["D4CD16", "Bird Flower"], ["D4D7D9", "Iron"], ["D4DFE2", "Geyser"], ["D4E2FC", "Hawkes Blue"], ["D54600", "Grenadier"], ["D591A4", "Can Can"], ["D59A6F", "Whiskey"], ["D5D195", "Winter Hazel"], ["D5F6E3", "Granny Apple"], ["D69188", "My Pink"], ["D6C562", "Tacha"], ["D6CEF6", "Moon Raker"], ["D6D6D1", "Quill Gray"], ["D6FFDB", "Snowy Mint"], ["D7837F", "New York Pink"], ["D7C498", "Pavlova"], ["D7D0FF", "Fog"], ["D84437", "Valencia"], ["D87C63", "Japonica"], ["D8BFD8", "Thistle"], ["D8C2D5", "Maverick"], ["D8FCFA", "Foam"], ["D94972", "Cabaret"], ["D99376", "Burning Sand"], ["D9B99B", "Cameo"], ["D9D6CF", "Timberwolf"], ["D9DCC1", "Tana"], ["D9E4F5", "Link Water"], ["D9F7FF", "Mabel"], ["DA3287", "Cerise"], ["DA5B38", "Flame Pea"], ["DA6304", "Bamboo"], ["DA6A41", "Red Damask"], ["DA70D6", "Orchid"], ["DA8A67", "Copperfield"], ["DAA520", "Golden Grass"], ["DAECD6", "Zanah"], ["DAF4F0", "Iceberg"], ["DAFAFF", "Oyster Bay"], ["DB5079", "Cranberry"], ["DB9690", "Petite Orchid"], ["DB995E", "Di Serria"], ["DBDBDB", "Alto"], ["DBFFF8", "Frosted Mint"], ["DC143C", "Crimson"], ["DC4333", "Punch"], ["DCB20C", "Galliano"], ["DCB4BC", "Blossom"], ["DCD747", "Wattle"], ["DCD9D2", "Westar"], ["DCDDCC", "Moon Mist"], ["DCEDB4", "Caper"], ["DCF0EA", "Swans Down"], ["DDD6D5", "Swiss Coffee"], ["DDF9F1", "White Ice"], ["DE3163", "Cerise Red"], ["DE6360", "Roman"], ["DEA681", "Tumbleweed"], ["DEBA13", "Gold Tips"], ["DEC196", "Brandy"], ["DECBC6", "Wafer"], ["DED4A4", "Sapling"], ["DED717", "Barberry"], ["DEE5C0", "Beryl Green"], ["DEF5FF", "Pattens Blue"], ["DF73FF", "Heliotrope"], ["DFBE6F", "Apache"], ["DFCD6F", "Chenin"], ["DFCFDB", "Lola"], ["DFECDA", "Willow Brook"], ["DFFF00", "Chartreuse Yellow"], ["E0B0FF", "Mauve"], ["E0B646", "Anzac"], ["E0B974", "Harvest Gold"], ["E0C095", "Calico"], ["E0FFFF", "Baby Blue"], ["E16865", "Sunglo"], ["E1BC64", "Equator"], ["E1C0C8", "Pink Flare"], ["E1E6D6", "Periglacial Blue"], ["E1EAD4", "Kidnapper"], ["E1F6E8", "Tara"], ["E25465", "Mandy"], ["E2725B", "Terracotta"], ["E28913", "Golden Bell"], ["E292C0", "Shocking"], ["E29418", "Dixie"], ["E29CD2", "Light Orchid"], ["E2D8ED", "Snuff"], ["E2EBED", "Mystic"], ["E2F3EC", "Apple Green"], ["E30B5C", "Razzmatazz"], ["E32636", "Alizarin Crimson"], ["E34234", "Cinnabar"], ["E3BEBE", "Cavern Pink"], ["E3F5E1", "Peppermint"], ["E3F988", "Mindaro"], ["E47698", "Deep Blush"], ["E49B0F", "Gamboge"], ["E4C2D5", "Melanie"], ["E4CFDE", "Twilight"], ["E4D1C0", "Bone"], ["E4D422", "Sunflower"], ["E4D5B7", "Grain Brown"], ["E4D69B", "Zombie"], ["E4F6E7", "Frostee"], ["E4FFD1", "Snow Flurry"], ["E52B50", "Amaranth"], ["E5841B", "Zest"], ["E5CCC9", "Dust Storm"], ["E5D7BD", "Stark White"], ["E5D8AF", "Hampton"], ["E5E0E1", "Bon Jour"], ["E5E5E5", "Mercury"], ["E5F9F6", "Polar"], ["E64E03", "Trinidad"], ["E6BE8A", "Gold Sand"], ["E6BEA5", "Cashmere"], ["E6D7B9", "Double Spanish White"], ["E6E4D4", "Satin Linen"], ["E6F2EA", "Harp"], ["E6F8F3", "Off Green"], ["E6FFE9", "Hint of Green"], ["E6FFFF", "Tranquil"], ["E77200", "Mango Tango"], ["E7730A", "Christine"], ["E79F8C", "Tonys Pink"], ["E79FC4", "Kobi"], ["E7BCB4", "Rose Fog"], ["E7BF05", "Corn"], ["E7CD8C", "Putty"], ["E7ECE6", "Gray Nurse"], ["E7F8FF", "Lily White"], ["E7FEFF", "Bubbles"], ["E89928", "Fire Bush"], ["E8B9B3", "Shilo"], ["E8E0D5", "Pearl Bush"], ["E8EBE0", "Green White"], ["E8F1D4", "Chrome White"], ["E8F2EB", "Gin"], ["E8F5F2", "Aqua Squeeze"], ["E96E00", "Clementine"], ["E97451", "Burnt Sienna"], ["E97C07", "Tahiti Gold"], ["E9CECD", "Oyster Pink"], ["E9D75A", "Confetti"], ["E9E3E3", "Ebb"], ["E9F8ED", "Ottoman"], ["E9FFFD", "Clear Day"], ["EA88A8", "Carissma"], ["EAAE69", "Porsche"], ["EAB33B", "Tulip Tree"], ["EAC674", "Rob Roy"], ["EADAB8", "Raffia"], ["EAE8D4", "White Rock"], ["EAF6EE", "Panache"], ["EAF6FF", "Solitude"], ["EAF9F5", "Aqua Spring"], ["EAFFFE", "Dew"], ["EB9373", "Apricot"], ["EBC2AF", "Zinnwaldite"], ["ECA927", "Fuel Yellow"], ["ECC54E", "Ronchi"], ["ECC7EE", "French Lilac"], ["ECCDB9", "Just Right"], ["ECE090", "Wild Rice"], ["ECEBBD", "Fall Green"], ["ECEBCE", "Aths Special"], ["ECF245", "Starship"], ["ED0A3F", "Red Ribbon"], ["ED7A1C", "Tango"], ["ED9121", "Carrot Orange"], ["ED989E", "Sea Pink"], ["EDB381", "Tacao"], ["EDC9AF", "Desert Sand"], ["EDCDAB", "Pancho"], ["EDDCB1", "Chamois"], ["EDEA99", "Primrose"], ["EDF5DD", "Frost"], ["EDF5F5", "Aqua Haze"], ["EDF6FF", "Zumthor"], ["EDF9F1", "Narvik"], ["EDFC84", "Honeysuckle"], ["EE82EE", "Lavender Magenta"], ["EEC1BE", "Beauty Bush"], ["EED794", "Chalky"], ["EED9C4", "Almond"], ["EEDC82", "Flax"], ["EEDEDA", "Bizarre"], ["EEE3AD", "Double Colonial White"], ["EEEEE8", "Cararra"], ["EEEF78", "Manz"], ["EEF0C8", "Tahuna Sands"], ["EEF0F3", "Athens Gray"], ["EEF3C3", "Tusk"], ["EEF4DE", "Loafer"], ["EEF6F7", "Catskill White"], ["EEFDFF", "Twilight Blue"], ["EEFF9A", "Jonquil"], ["EEFFE2", "Rice Flower"], ["EF863F", "Jaffa"], ["EFEFEF", "Gallery"], ["EFF2F3", "Porcelain"], ["F091A9", "Mauvelous"], ["F0D52D", "Golden Dream"], ["F0DB7D", "Golden Sand"], ["F0DC82", "Buff"], ["F0E2EC", "Prim"], ["F0E68C", "Khaki"], ["F0EEFD", "Selago"], ["F0EEFF", "Titan White"], ["F0F8FF", "Alice Blue"], ["F0FCEA", "Feta"], ["F18200", "Gold Drop"], ["F19BAB", "Wewak"], ["F1E788", "Sahara Sand"], ["F1E9D2", "Parchment"], ["F1E9FF", "Blue Chalk"], ["F1EEC1", "Mint Julep"], ["F1F1F1", "Seashell"], ["F1F7F2", "Saltpan"], ["F1FFAD", "Tidal"], ["F1FFC8", "Chiffon"], ["F2552A", "Flamingo"], ["F28500", "Tangerine"], ["F2C3B2", "Mandys Pink"], ["F2F2F2", "Concrete"], ["F2FAFA", "Black Squeeze"], ["F34723", "Pomegranate"], ["F3AD16", "Buttercup"], ["F3D69D", "New Orleans"], ["F3D9DF", "Vanilla Ice"], ["F3E7BB", "Sidecar"], ["F3E9E5", "Dawn Pink"], ["F3EDCF", "Wheatfield"], ["F3FB62", "Canary"], ["F3FBD4", "Orinoco"], ["F3FFD8", "Carla"], ["F400A1", "Hollywood Cerise"], ["F4A460", "Sandy brown"], ["F4C430", "Saffron"], ["F4D81C", "Ripe Lemon"], ["F4EBD3", "Janna"], ["F4F2EE", "Pampas"], ["F4F4F4", "Wild Sand"], ["F4F8FF", "Zircon"], ["F57584", "Froly"], ["F5C85C", "Cream Can"], ["F5C999", "Manhattan"], ["F5D5A0", "Maize"], ["F5DEB3", "Wheat"], ["F5E7A2", "Sandwisp"], ["F5E7E2", "Pot Pourri"], ["F5E9D3", "Albescent White"], ["F5EDEF", "Soft Peach"], ["F5F3E5", "Ecru White"], ["F5F5DC", "Beige"], ["F5FB3D", "Golden Fizz"], ["F5FFBE", "Australian Mint"], ["F64A8A", "French Rose"], ["F653A6", "Brilliant Rose"], ["F6A4C9", "Illusion"], ["F6F0E6", "Merino"], ["F6F7F7", "Black Haze"], ["F6FFDC", "Spring Sun"], ["F7468A", "Violet Red"], ["F77703", "Chilean Fire"], ["F77FBE", "Persian Pink"], ["F7B668", "Rajah"], ["F7C8DA", "Azalea"], ["F7DBE6", "We Peep"], ["F7F2E1", "Quarter Spanish White"], ["F7F5FA", "Whisper"], ["F7FAF7", "Snow Drift"], ["F8B853", "Casablanca"], ["F8C3DF", "Chantilly"], ["F8D9E9", "Cherub"], ["F8DB9D", "Marzipan"], ["F8DD5C", "Energy Yellow"], ["F8E4BF", "Givry"], ["F8F0E8", "White Linen"], ["F8F4FF", "Magnolia"], ["F8F6F1", "Spring Wood"], ["F8F7DC", "Coconut Cream"], ["F8F7FC", "White Lilac"], ["F8F8F7", "Desert Storm"], ["F8F99C", "Texas"], ["F8FACD", "Corn Field"], ["F8FDD3", "Mimosa"], ["F95A61", "Carnation"], ["F9BF58", "Saffron Mango"], ["F9E0ED", "Carousel Pink"], ["F9E4BC", "Dairy Cream"], ["F9E663", "Portica"], ["F9E6F4", "Underage Pink"], ["F9EAF3", "Amour"], ["F9F8E4", "Rum Swizzle"], ["F9FF8B", "Dolly"], ["F9FFF6", "Sugar Cane"], ["FA7814", "Ecstasy"], ["FA9D5A", "Tan Hide"], ["FAD3A2", "Corvette"], ["FADFAD", "Peach Yellow"], ["FAE600", "Turbo"], ["FAEAB9", "Astra"], ["FAECCC", "Champagne"], ["FAF0E6", "Linen"], ["FAF3F0", "Fantasy"], ["FAF7D6", "Citrine White"], ["FAFAFA", "Alabaster"], ["FAFDE4", "Hint of Yellow"], ["FAFFA4", "Milan"], ["FB607F", "Brink Pink"], ["FB8989", "Geraldine"], ["FBA0E3", "Lavender Rose"], ["FBA129", "Sea Buckthorn"], ["FBAC13", "Sun"], ["FBAED2", "Lavender Pink"], ["FBB2A3", "Rose Bud"], ["FBBEDA", "Cupid"], ["FBCCE7", "Classic Rose"], ["FBCEB1", "Apricot Peach"], ["FBE7B2", "Banana Mania"], ["FBE870", "Marigold Yellow"], ["FBE96C", "Festival"], ["FBEA8C", "Sweet Corn"], ["FBEC5D", "Candy Corn"], ["FBF9F9", "Hint of Red"], ["FBFFBA", "Shalimar"], ["FC0FC0", "Shocking Pink"], ["FC80A5", "Tickle Me Pink"], ["FC9C1D", "Tree Poppy"], ["FCC01E", "Lightning Yellow"], ["FCD667", "Goldenrod"], ["FCD917", "Candlelight"], ["FCDA98", "Cherokee"], ["FCF4D0", "Double Pearl Lusta"], ["FCF4DC", "Pearl Lusta"], ["FCF8F7", "Vista White"], ["FCFBF3", "Bianca"], ["FCFEDA", "Moon Glow"], ["FCFFE7", "China Ivory"], ["FCFFF9", "Ceramic"], ["FD0E35", "Torch Red"], ["FD5B78", "Wild Watermelon"], ["FD7B33", "Crusta"], ["FD7C07", "Sorbus"], ["FD9FA2", "Sweet Pink"], ["FDD5B1", "Light Apricot"], ["FDD7E4", "Pig Pink"], ["FDE1DC", "Cinderella"], ["FDE295", "Golden Glow"], ["FDE910", "Lemon"], ["FDF5E6", "Old Lace"], ["FDF6D3", "Half Colonial White"], ["FDF7AD", "Drover"], ["FDFEB8", "Pale Prim"], ["FDFFD5", "Cumulus"], ["FE28A2", "Persian Rose"], ["FE4C40", "Sunset Orange"], ["FE6F5E", "Bittersweet"], ["FE9D04", "California"], ["FEA904", "Yellow Sea"], ["FEBAAD", "Melon"], ["FED33C", "Bright Sun"], ["FED85D", "Dandelion"], ["FEDB8D", "Salomie"], ["FEE5AC", "Cape Honey"], ["FEEBF3", "Remy"], ["FEEFCE", "Oasis"], ["FEF0EC", "Bridesmaid"], ["FEF2C7", "Beeswax"], ["FEF3D8", "Bleach White"], ["FEF4CC", "Pipi"], ["FEF4DB", "Half Spanish White"], ["FEF4F8", "Wisp Pink"], ["FEF5F1", "Provincial Pink"], ["FEF7DE", "Half Dutch White"], ["FEF8E2", "Solitaire"], ["FEF8FF", "White Pointer"], ["FEF9E3", "Off Yellow"], ["FEFCED", "Orange White"], ["FF0000", "Red"], ["FF007F", "Rose"], ["FF00CC", "Purple Pizzazz"], ["FF00FF", "Magenta / Fuchsia"], ["FF2400", "Scarlet"], ["FF3399", "Wild Strawberry"], ["FF33CC", "Razzle Dazzle Rose"], ["FF355E", "Radical Red"], ["FF3F34", "Red Orange"], ["FF4040", "Coral Red"], ["FF4D00", "Vermilion"], ["FF4F00", "International Orange"], ["FF6037", "Outrageous Orange"], ["FF6600", "Blaze Orange"], ["FF66FF", "Pink Flamingo"], ["FF681F", "Orange"], ["FF69B4", "Hot Pink"], ["FF6B53", "Persimmon"], ["FF6FFF", "Blush Pink"], ["FF7034", "Burning Orange"], ["FF7518", "Pumpkin"], ["FF7D07", "Flamenco"], ["FF7F00", "Flush Orange"], ["FF7F50", "Coral"], ["FF8C69", "Salmon"], ["FF9000", "Pizazz"], ["FF910F", "West Side"], ["FF91A4", "Pink Salmon"], ["FF9933", "Neon Carrot"], ["FF9966", "Atomic Tangerine"], ["FF9980", "Vivid Tangerine"], ["FF9E2C", "Sunshade"], ["FFA000", "Orange Peel"], ["FFA194", "Mona Lisa"], ["FFA500", "Web Orange"], ["FFA6C9", "Carnation Pink"], ["FFAB81", "Hit Pink"], ["FFAE42", "Yellow Orange"], ["FFB0AC", "Cornflower Lilac"], ["FFB1B3", "Sundown"], ["FFB31F", "My Sin"], ["FFB555", "Texas Rose"], ["FFB7D5", "Cotton Candy"], ["FFB97B", "Macaroni and Cheese"], ["FFBA00", "Selective Yellow"], ["FFBD5F", "Koromiko"], ["FFBF00", "Amber"], ["FFC0A8", "Wax Flower"], ["FFC0CB", "Pink"], ["FFC3C0", "Your Pink"], ["FFC901", "Supernova"], ["FFCBA4", "Flesh"], ["FFCC33", "Sunglow"], ["FFCC5C", "Golden Tainoi"], ["FFCC99", "Peach Orange"], ["FFCD8C", "Chardonnay"], ["FFD1DC", "Pastel Pink"], ["FFD2B7", "Romantic"], ["FFD38C", "Grandis"], ["FFD700", "Gold"], ["FFD800", "School bus Yellow"], ["FFD8D9", "Cosmos"], ["FFDB58", "Mustard"], ["FFDCD6", "Peach Schnapps"], ["FFDDAF", "Caramel"], ["FFDDCD", "Tuft Bush"], ["FFDDCF", "Watusi"], ["FFDDF4", "Pink Lace"], ["FFDEAD", "Navajo White"], ["FFDEB3", "Frangipani"], ["FFE1DF", "Pippin"], ["FFE1F2", "Pale Rose"], ["FFE2C5", "Negroni"], ["FFE5A0", "Cream Brulee"], ["FFE5B4", "Peach"], ["FFE6C7", "Tequila"], ["FFE772", "Kournikova"], ["FFEAC8", "Sandy Beach"], ["FFEAD4", "Karry"], ["FFEC13", "Broom"], ["FFEDBC", "Colonial White"], ["FFEED8", "Derby"], ["FFEFA1", "Vis Vis"], ["FFEFC1", "Egg White"], ["FFEFD5", "Papaya Whip"], ["FFEFEC", "Fair Pink"], ["FFF0DB", "Peach Cream"], ["FFF0F5", "Lavender blush"], ["FFF14F", "Gorse"], ["FFF1B5", "Buttermilk"], ["FFF1D8", "Pink Lady"], ["FFF1EE", "Forget Me Not"], ["FFF1F9", "Tutu"], ["FFF39D", "Picasso"], ["FFF3F1", "Chardon"], ["FFF46E", "Paris Daisy"], ["FFF4CE", "Barley White"], ["FFF4DD", "Egg Sour"], ["FFF4E0", "Sazerac"], ["FFF4E8", "Serenade"], ["FFF4F3", "Chablis"], ["FFF5EE", "Seashell Peach"], ["FFF5F3", "Sauvignon"], ["FFF6D4", "Milk Punch"], ["FFF6DF", "Varden"], ["FFF6F5", "Rose White"], ["FFF8D1", "Baja White"], ["FFF9E2", "Gin Fizz"], ["FFF9E6", "Early Dawn"], ["FFFACD", "Lemon Chiffon"], ["FFFAF4", "Bridal Heath"], ["FFFBDC", "Scotch Mist"], ["FFFBF9", "Soapstone"], ["FFFC99", "Witch Haze"], ["FFFCEA", "Buttery White"], ["FFFCEE", "Island Spice"], ["FFFDD0", "Cream"], ["FFFDE6", "Chilean Heath"], ["FFFDE8", "Travertine"], ["FFFDF3", "Orchid White"], ["FFFDF4", "Quarter Pearl Lusta"], ["FFFEE1", "Half and Half"], ["FFFEEC", "Apricot White"], ["FFFEF0", "Rice Cake"], ["FFFEF6", "Black White"], ["FFFEFD", "Romance"], ["FFFF00", "Yellow"], ["FFFF66", "Laser Lemon"], ["FFFF99", "Pale Canary"], ["FFFFB4", "Portafino"], ["FFFFF0", "Ivory"], ["FFFFFF", "White"]];
  return names.each(function(element) {
    return (lookup[normalizeKey(element[1])] = parseHex(element[0]));
  });
})();;
var Core;
var __slice = Array.prototype.slice;
/**
The Core class is used to add extended functionality to objects without
extending the object class directly. Inherit from Core to gain its utility
methods.

@name Core
@constructor

@param {Object} I Instance variables
*/
Core = function(I) {
  var self;
  I || (I = {});
  return (self = {
    I: I,
    /**
    Generates a public jQuery style getter / setter method for each
    String argument.

    @name attrAccessor
    @methodOf Core#
    */
    attrAccessor: function() {
      var attrNames;
      attrNames = __slice.call(arguments, 0);
      return attrNames.each(function(attrName) {
        return (self[attrName] = function(newValue) {
          if (typeof newValue !== "undefined" && newValue !== null) {
            I[attrName] = newValue;
            return self;
          } else {
            return I[attrName];
          }
        });
      });
    },
    /**
    Generates a public jQuery style getter method for each String argument.

    @name attrReader
    @methodOf Core#
    */
    attrReader: function() {
      var attrNames;
      attrNames = __slice.call(arguments, 0);
      return attrNames.each(function(attrName) {
        return (self[attrName] = function() {
          return I[attrName];
        });
      });
    },
    /**
    Extends this object with methods from the passed in object. `before` and
    `after` are special option names that glue functionality before or after
    existing methods.

    @name extend
    @methodOf Core#
    */
    extend: function(options) {
      var afterMethods, beforeMethods;
      afterMethods = options.after;
      beforeMethods = options.before;
      delete options.after;
      delete options.before;
      $.extend(self, options);
      if (beforeMethods) {
        $.each(beforeMethods, function(name, fn) {
          return (self[name] = self[name].withBefore(fn));
        });
      }
      if (afterMethods) {
        $.each(afterMethods, function(name, fn) {
          return (self[name] = self[name].withAfter(fn));
        });
      }
      return self;
    },
    include: function(Module) {
      return self.extend(Module(I, self));
    }
  });
};;
var DebugConsole;
DebugConsole = function() {
  var REPL, container, input, output, repl, runButton;
  REPL = function(input, output) {
    var print;
    print = function(message) {
      return output.append($("<li />", {
        text: message
      }));
    };
    return {
      run: function() {
        var code, result, source;
        source = input.val();
        try {
          code = CoffeeScript.compile(source, {
            noWrap: true
          });
          result = eval(code);
          print(" => " + (result));
          return input.val('');
        } catch (error) {
          return error.stack ? print(error.stack) : print(error.toString());
        }
      }
    };
  };
  container = $("<div />", {
    "class": "console"
  });
  input = $("<textarea />");
  output = $("<ul />");
  runButton = $("<button />", {
    text: "Run"
  });
  repl = REPL(input, output);
  container.append(output).append(input).append(runButton);
  return $(function() {
    runButton.click(function() {
      return repl.run();
    });
    return $("body").append(container);
  });
};;
Function.prototype.withBefore = function(interception) {
  var method;
  method = this;
  return function() {
    interception.apply(this, arguments);
    return method.apply(this, arguments);
  };
};
Function.prototype.withAfter = function(interception) {
  var method;
  method = this;
  return function() {
    var result;
    result = method.apply(this, arguments);
    interception.apply(this, arguments);
    return result;
  };
};;
/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){
  
  jQuery.hotkeys = {
    version: "0.8",

    specialKeys: {
      8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
      20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
      37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
      96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
      104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
      112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
      120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
    },
  
    shiftNums: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
      "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
      ".": ">",  "/": "?",  "\\": "|"
    }
  };

  function keyHandler( handleObj ) {
    // Only care when a possible input has been specified
    if ( typeof handleObj.data !== "string" ) {
      return;
    }
    
    var origHandler = handleObj.handler,
      keys = handleObj.data.toLowerCase().split(" ");
  
    handleObj.handler = function( event ) {
      // Don't fire in text-accepting inputs that we didn't directly bind to
      if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
         event.target.type === "text" || event.target.type === "password") ) {
        return;
      }
      
      // Keypress represents characters, not special keys
      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
        character = String.fromCharCode( event.which ).toLowerCase(),
        key, modif = "", possible = {};

      // check combinations (alt|ctrl|shift+anything)
      if ( event.altKey && special !== "alt" ) {
        modif += "alt+";
      }

      if ( event.ctrlKey && special !== "ctrl" ) {
        modif += "ctrl+";
      }
      
      // TODO: Need to make sure this works consistently across platforms
      if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
        modif += "meta+";
      }

      if ( event.shiftKey && special !== "shift" ) {
        modif += "shift+";
      }

      if ( special ) {
        possible[ modif + special ] = true;

      } else {
        possible[ modif + character ] = true;
        possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if ( modif === "shift+" ) {
          possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
        }
      }

      for ( var i = 0, l = keys.length; i < l; i++ ) {
        if ( possible[ keys[i] ] ) {
          return origHandler.apply( this, arguments );
        }
      }
    };
  }

  jQuery.each([ "keydown", "keyup", "keypress" ], function() {
    jQuery.event.special[ this ] = { add: keyHandler };
  });

})( jQuery );;
/**
 * Merges properties from objects into target without overiding.
 * First come, first served.
 * @return target
 */
jQuery.extend({
  reverseMerge: function(target) {
    var i = 1, length = arguments.length;

    for( ; i < length; i++) {
      var object = arguments[i];

      for(var name in object) {
        if(!target.hasOwnProperty(name)) {
          target[name] = object[name];
        }
      }
    }

    return target;
  }
});

;
$(function() {
  var keyName;
  window.keydown = {};
  keyName = function(event) {
    return jQuery.hotkeys.specialKeys[event.which] || String.fromCharCode(event.which).toLowerCase();
  };
  $(document).bind("keydown", function(event) {
    return (keydown[keyName(event)] = true);
  });
  return $(document).bind("keyup", function(event) {
    return (keydown[keyName(event)] = false);
  });
});;
$(function() {
  return ["log", "info", "warn", "error"].each(function(name) {
    return typeof console !== "undefined" ? (window[name] = function(message) {
      return console[name] ? console[name](message) : null;
    }) : (window[name] = $.noop);
  });
});;
/**
* Matrix.js v1.3.0pre
* 
* Copyright (c) 2010 STRd6
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* Loosely based on flash:
* http://www.adobe.com/livedocs/flash/9.0/ActionScriptLangRefV3/flash/geom/Matrix.html
*/
(function() {
  /**
   * Create a new point with given x and y coordinates. If no arguments are given
   * defaults to (0, 0).
   * @name Point
   * @param {Number} [x]
   * @param {Number} [y]
   * @constructor
   */
  function Point(x, y) {
    return {
      /**
       * The x coordinate of this point.
       * @name x
       * @fieldOf Point#
       */
      x: x || 0,
      /**
       * The y coordinate of this point.
       * @name y
       * @fieldOf Point#
       */
      y: y || 0,
      /**
       * Adds a point to this one and returns the new point.
       * @name add
       * @methodOf Point#
       *
       * @param {Point} other The point to add this point to.
       * @returns A new point, the sum of both.
       * @type Point
       */
      add: function(other) {
        return Point(this.x + other.x, this.y + other.y);
      },
      /**
       * Subtracts a point to this one and returns the new point.
       * @name subtract
       * @methodOf Point#
       *
       * @param {Point} other The point to subtract from this point.
       * @returns A new point, this - other.
       * @type Point
       */
      subtract: function(other) {
        return Point(this.x - other.x, this.y - other.y);
      },
      /**
       * Scale this Point (Vector) by a constant amount.
       * @name scale
       * @methodOf Point#
       *
       * @param {Number} scalar The amount to scale this point by.
       * @returns A new point, this * scalar.
       * @type Point
       */
      scale: function(scalar) {
        return Point(this.x * scalar, this.y * scalar);
      },
      /**
       * Determine whether this point is equal to another point.
       * @name equal
       * @methodOf Point#
       *
       * @param {Point} other The point to check for equality.
       * @returns true if the other point has the same x, y coordinates, false otherwise.
       * @type Boolean
       */
      equal: function(other) {
        return this.x === other.x && this.y === other.y;
      },
      /**
       * Calculate the magnitude of this Point (Vector).
       * @name magnitude
       * @methodOf Point#
       *
       * @returns The magnitude of this point as if it were a vector from (0, 0) -> (x, y).
       * @type Number
       */
      magnitude: function() {
        return Point.distance(Point(0, 0), this);
      },
      /**
       * Calculate the dot product of this point and another point (Vector).
       * @name dot
       * @methodOf Point#
       *
       * @param {Point} other The point to dot with this point.
       * @returns The dot product of this point dot other as a scalar value.
       * @type Number
       */
      dot: function(other) {
        return this.x * other.x + this.y * other.y;
      },
      /**
       * Calculate the cross product of this point and another point (Vector). 
       * Usually cross products are thought of as only applying to three dimensional vectors,
       * but z can be treated as zero. The result of this method is interpreted as the magnitude 
       * of the vector result of the cross product between [x1, y1, 0] x [x2, y2, 0]
       * perpendicular to the xy plane.
       * @name cross
       * @methodOf Point#
       *
       * @param {Point} other The point to cross with this point.
       * @returns The cross product of this point with the other point as scalar value.
       * @type Number
       */
      cross: function(other) {
        return this.x * other.y - other.x * this.y;
      },
      /**
       * The norm of a vector is the unit vector pointing in the same direction. This method
       * treats the point as though it is a vector from the origin to (x, y).
       * @name norm
       * @methodOf Point#
       *
       * @returns The unit vector pointing in the same direction as this vector.
       * @type Point
       */
      norm: function() {
        return this.scale(1.0/this.length());
      },
      /**
       * Computed the length of this point as though it were a vector from (0,0) to (x,y)
       * @name length
       * @methodOf Point#
       *
       * @returns The length of the vector from the origin to this point.
       * @type Number
       */
      length: function() {
        return Math.sqrt(this.dot(this));
      },
      /**
       * Computed the Euclidean between this point and another point.
       * @name distance
       * @methodOf Point#
       *
       * @param {Point} other The point to compute the distance to.
       * @returns The distance between this point and another point.
       * @type Number
       */
      distance: function(other) {
        return Point.distance(this, other);
      }
    }
  }

  /**
   * @param {Point} p1
   * @param {Point} p2
   * @type Number
   * @returns The Euclidean distance between two points.
   */
  Point.distance = function(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  /**
   * Construct a point on the unit circle for the given angle.
   *
   * @param {Number} angle The angle in radians
   * @type Point
   * @returns The point on the unit circle.
   */
  Point.fromAngle = function(angle) {
    return Point(Math.cos(angle), Math.sin(angle));
  };

  /**
   * If you have two dudes, one standing at point p1, and the other
   * standing at point p2, then this method will return the direction
   * that the dude standing at p1 will need to face to look at p2.
   * @param {Point} p1 The starting point.
   * @param {Point} p2 The ending point.
   * @returns The direction from p1 to p2 in radians.
   */
  Point.direction = function(p1, p2) {
    return Math.atan2(
      p2.y - p1.y,
      p2.x - p1.x
    );
  };

  /**
   * <pre>
   *  _        _
   * | a  c tx  |
   * | b  d ty  |
   * |_0  0  1 _|
   * </pre>
   * Creates a matrix for 2d affine transformations.
   *
   * concat, inverse, rotate, scale and translate return new matrices with the
   * transformations applied. The matrix is not modified in place.
   *
   * Returns the identity matrix when called with no arguments.
   * @name Matrix
   * @param {Number} [a]
   * @param {Number} [b]
   * @param {Number} [c]
   * @param {Number} [d]
   * @param {Number} [tx]
   * @param {Number} [ty]
   * @constructor
   */
  function Matrix(a, b, c, d, tx, ty) {
    a = a !== undefined ? a : 1;
    d = d !== undefined ? d : 1;

    return {
      /**
       * @name a
       * @fieldOf Matrix#
       */
      a: a,
      /**
       * @name b
       * @fieldOf Matrix#
       */
      b: b || 0,
      /**
       * @name c
       * @fieldOf Matrix#
       */
      c: c || 0,
      /**
       * @name d
       * @fieldOf Matrix#
       */
      d: d,
      /**
       * @name tx
       * @fieldOf Matrix#
       */
      tx: tx || 0,
      /**
       * @name ty
       * @fieldOf Matrix#
       */
      ty: ty || 0,

      /**
       * Returns the result of this matrix multiplied by another matrix
       * combining the geometric effects of the two. In mathematical terms, 
       * concatenating two matrixes is the same as combining them using matrix multiplication.
       * If this matrix is A and the matrix passed in is B, the resulting matrix is A x B
       * http://mathworld.wolfram.com/MatrixMultiplication.html
       * @name concat
       * @methodOf Matrix#
       *
       * @param {Matrix} matrix The matrix to multiply this matrix by.
       * @returns The result of the matrix multiplication, a new matrix.
       * @type Matrix
       */
      concat: function(matrix) {
        return Matrix(
          this.a * matrix.a + this.c * matrix.b,
          this.b * matrix.a + this.d * matrix.b,
          this.a * matrix.c + this.c * matrix.d,
          this.b * matrix.c + this.d * matrix.d,
          this.a * matrix.tx + this.c * matrix.ty + this.tx,
          this.b * matrix.tx + this.d * matrix.ty + this.ty
        );
      },

      /**
       * Given a point in the pretransform coordinate space, returns the coordinates of 
       * that point after the transformation occurs. Unlike the standard transformation 
       * applied using the transformPoint() method, the deltaTransformPoint() method's 
       * transformation does not consider the translation parameters tx and ty.
       * @name deltaTransformPoint
       * @methodOf Matrix#
       * @see #transformPoint
       *
       * @return A new point transformed by this matrix ignoring tx and ty.
       * @type Point
       */
      deltaTransformPoint: function(point) {
        return Point(
          this.a * point.x + this.c * point.y,
          this.b * point.x + this.d * point.y
        );
      },

      /**
       * Returns the inverse of the matrix.
       * http://mathworld.wolfram.com/MatrixInverse.html
       * @name inverse
       * @methodOf Matrix#
       *
       * @returns A new matrix that is the inverse of this matrix.
       * @type Matrix
       */
      inverse: function() {
        var determinant = this.a * this.d - this.b * this.c;
        return Matrix(
          this.d / determinant,
          -this.b / determinant,
          -this.c / determinant,
          this.a / determinant,
          (this.c * this.ty - this.d * this.tx) / determinant,
          (this.b * this.tx - this.a * this.ty) / determinant
        );
      },

      /**
       * Returns a new matrix that corresponds this matrix multiplied by a
       * a rotation matrix.
       * @name rotate
       * @methodOf Matrix#
       * @see Matrix.rotation
       *
       * @param {Number} theta Amount to rotate in radians.
       * @param {Point} [aboutPoint] The point about which this rotation occurs. Defaults to (0,0).
       * @returns A new matrix, rotated by the specified amount.
       * @type Matrix
       */
      rotate: function(theta, aboutPoint) {
        return this.concat(Matrix.rotation(theta, aboutPoint));
      },

      /**
       * Returns a new matrix that corresponds this matrix multiplied by a
       * a scaling matrix.
       * @name scale
       * @methodOf Matrix#
       * @see Matrix.scale
       *
       * @param {Number} sx
       * @param {Number} [sy]
       * @param {Point} [aboutPoint] The point that remains fixed during the scaling
       * @type Matrix
       */
      scale: function(sx, sy, aboutPoint) {
        return this.concat(Matrix.scale(sx, sy, aboutPoint));
      },

      /**
       * Returns the result of applying the geometric transformation represented by the 
       * Matrix object to the specified point.
       * @name transformPoint
       * @methodOf Matrix#
       * @see #deltaTransformPoint
       *
       * @returns A new point with the transformation applied.
       * @type Point
       */
      transformPoint: function(point) {
        return Point(
          this.a * point.x + this.c * point.y + this.tx,
          this.b * point.x + this.d * point.y + this.ty
        );
      },

      /**
       * Translates the matrix along the x and y axes, as specified by the tx and ty parameters.
       * @name translate
       * @methodOf Matrix#
       * @see Matrix.translation
       *
       * @param {Number} tx The translation along the x axis.
       * @param {Number} ty The translation along the y axis.
       * @returns A new matrix with the translation applied.
       * @type Matrix
       */
      translate: function(tx, ty) {
        return this.concat(Matrix.translation(tx, ty));
      }
    }
  }

  /**
   * Creates a matrix transformation that corresponds to the given rotation,
   * around (0,0) or the specified point.
   * @see Matrix#rotate
   *
   * @param {Number} theta Rotation in radians.
   * @param {Point} [aboutPoint] The point about which this rotation occurs. Defaults to (0,0).
   * @returns 
   * @type Matrix
   */
  Matrix.rotation = function(theta, aboutPoint) {
    var rotationMatrix = Matrix(
      Math.cos(theta),
      Math.sin(theta),
      -Math.sin(theta),
      Math.cos(theta)
    );

    if(aboutPoint) {
      rotationMatrix =
        Matrix.translation(aboutPoint.x, aboutPoint.y).concat(
          rotationMatrix
        ).concat(
          Matrix.translation(-aboutPoint.x, -aboutPoint.y)
        );
    }

    return rotationMatrix;
  };

  /**
   * Returns a matrix that corresponds to scaling by factors of sx, sy along
   * the x and y axis respectively.
   * If only one parameter is given the matrix is scaled uniformly along both axis.
   * If the optional aboutPoint parameter is given the scaling takes place
   * about the given point.
   * @see Matrix#scale
   *
   * @param {Number} sx The amount to scale by along the x axis or uniformly if no sy is given.
   * @param {Number} [sy] The amount to scale by along the y axis.
   * @param {Point} [aboutPoint] The point about which the scaling occurs. Defaults to (0,0).
   * @returns A matrix transformation representing scaling by sx and sy.
   * @type Matrix
   */
  Matrix.scale = function(sx, sy, aboutPoint) {
    sy = sy || sx;

    var scaleMatrix = Matrix(sx, 0, 0, sy);

    if(aboutPoint) {
      scaleMatrix =
        Matrix.translation(aboutPoint.x, aboutPoint.y).concat(
          scaleMatrix
        ).concat(
          Matrix.translation(-aboutPoint.x, -aboutPoint.y)
        );
    }

    return scaleMatrix;
  };

  /**
   * Returns a matrix that corresponds to a translation of tx, ty.
   * @see Matrix#translate
   *
   * @param {Number} tx The amount to translate in the x direction.
   * @param {Number} ty The amount to translate in the y direction.
   * @return A matrix transformation representing a translation by tx and ty.
   * @type Matrix
   */
  Matrix.translation = function(tx, ty) {
    return Matrix(1, 0, 0, 1, tx, ty);
  };

  /**
   * A constant representing the identity matrix.
   * @name IDENTITY
   * @fieldOf Matrix
   */
  Matrix.IDENTITY = Matrix();
  /**
   * A constant representing the horizontal flip transformation matrix.
   * @name HORIZONTAL_FLIP
   * @fieldOf Matrix
   */
  Matrix.HORIZONTAL_FLIP = Matrix(-1, 0, 0, 1);
  /**
   * A constant representing the vertical flip transformation matrix.
   * @name VERTICAL_FLIP
   * @fieldOf Matrix
   */
  Matrix.VERTICAL_FLIP = Matrix(1, 0, 0, -1);
  
  // Export to window
  window["Point"] = Point;
  window["Matrix"] = Matrix;
}());
;
window.Mouse = (function() {
  var Mouse, buttons, set_button;
  Mouse = {
    left: false,
    right: false,
    middle: false,
    location: Point(0, 0)
  };
  buttons = [null, "left", "middle", "right"];
  set_button = function(index, state) {
    var button_name;
    button_name = buttons[index];
    return button_name ? (Mouse[button_name] = state) : null;
  };
  $(document).mousedown(function(event) {
    return set_button(event.which, true);
  });
  $(document).mouseup(function(event) {
    return set_button(event.which, false);
  });
  $(document).mousemove(function(event) {
    var x, y;
    x = event.pageX;
    y = event.pageY;
    Mouse.location = Point(x, y);
    Mouse.x = x;
    return (Mouse.y = y);
  });
  return Mouse;
})();;
/**
 * @returns The absolute value of the number.
 */
Number.prototype.abs = function() {
  return Math.abs(this);
};

/**
 * @returns The number truncated to the nearest integer of greater than or equal value.
 * 
 * (4.9).ceil(); // => 5
 * (4.2).ceil(); // => 5
 * (-1.2).ceil(); // => -1
 */
Number.prototype.ceil = function() {
  return Math.ceil(this);
};

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * <pre>
 * (x * 255).clamp(0, 255)
 * </pre>
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

/**
 * @returns The number truncated to the nearest integer of less than or equal value.
 * 
 * (4.9).floor(); // => 4
 * (4.2).floor(); // => 4
 * (-1.2).floor(); // => -2
 */
Number.prototype.floor = function() {
  return Math.floor(this);
};

/**
 * A mod method useful for array wrapping. The range of the function is
 * constrained to remain in bounds of array indices.
 *
 * <pre>
 * Example:
 * (-1).mod(5) === 4
 * </pre>
 *
 * @param {Number} base
 * @returns An integer between 0 and (base - 1) if base is positive.
 * @type Number
 */
Number.prototype.mod = function(base) {
  var result = this % base;

  if(result < 0 && base > 0) {
    result += base;
  }

  return result;
};

/**
 * @returns The number rounded to the nearest integer.
 * 
 * (4.5).round(); // => 5
 * (4.4).round(); // => 4
 */
Number.prototype.round = function() {
  return Math.round(this);
};

/**
 * @returns The sign of this number, 0 if the number is 0.
 */
Number.prototype.sign = function() {
  if(this > 0) {
    return 1;
  } else if (this < 0) {
    return -1;
  } else {
    return 0;
  }
};

/**
 * Calls iterator the specified number of times, passing in the number of the 
 * current iteration as a parameter: 0 on first call, 1 on the second call, etc. 
 * 
 * @param {Function} iterator The iterator takes a single parameter, the number 
 * of the current iteration.
 * @param {Object} [context] The optional context parameter specifies an object
 * to treat as <code>this</code> in the iterator block.
 * 
 * @returns The number of times the iterator was called.
 * @type Number
 */
Number.prototype.times = function(iterator, context) {
  for(var i = 0; i < this; i++) {
    iterator.call(context, i);
  }

  return i;
};

/**
 * Returns the the nearest grid resolution less than or equal to the number. 
 *
 *   EX: 
 *    (7).snap(8) => 0
 *    (4).snap(8) => 0
 *    (12).snap(8) => 8
 *
 * @param {Number} resolution The grid resolution to snap to.
 * @returns The nearest multiple of resolution lower than the number.
 * @type Number
 */
Number.prototype.snap = function(resolution) {
  return (this / resolution).floor() * resolution;
};

Number.prototype.toColorPart = function() {
  var s = parseInt(this.clamp(0, 255), 10).toString(16);
  if(s.length == 1) {
    s = '0' + s;
  }

  return s;
};

Number.prototype.approach = function(target, maxDelta) {
  return (target - this).clamp(-maxDelta, maxDelta) + this;
};

Number.prototype.approachByRatio = function(target, ratio) {
  return this.approach(target, this * ratio);
};

Number.prototype.approachRotation = function(target, maxDelta) {
  var twoPi = 2 * Math.PI;

  while(target > this + Math.PI) {
    target -= twoPi
  }

  while(target < this - Math.PI) {
    target += twoPi
  }

  return (target - this).clamp(-maxDelta, maxDelta) + this;
};

/**
 * @returns This number constrained between -PI and PI.
 */
Number.prototype.constrainRotation = function() {
  var twoPi = 2 * Math.PI;
  
  var target = this;

  while(target > Math.PI) {
    target -= twoPi
  }

  while(target < -Math.PI) {
    target += twoPi
  }
      
  return target;
};

Number.prototype.d = function(sides) {
  var sum = 0;

  this.times(function() {
    sum += rand(sides) + 1;
  });

  return sum;
};

/** The mathematical circle constant of 1 turn. */
Math.TAU = 2 * Math.PI;

;
(function($){
  $.fn.powerCanvas = function(options) {
    options = options || {};

    var canvas = this.get(0);

    if(!canvas) {
      return this;
    }

    var context;

    /**
     * @name PowerCanvas
     * @constructor
     */
    var $canvas = $(canvas).extend({
      /**
       * Passes this canvas to the block with the given matrix transformation
       * applied. All drawing methods called within the block will draw
       * into the canvas with the transformation applied. The transformation
       * is removed at the end of the block, even if the block throws an error.
       *
       * @name withTransform
       * @methodOf PowerCanvas#
       *
       * @param {Matrix} matrix
       * @param {Function} block
       * @returns this
       */
      withTransform: function(matrix, block) {
        context.save();

        context.transform(
          matrix.a,
          matrix.b,
          matrix.c,
          matrix.d,
          matrix.tx,
          matrix.ty
        );

        try {
          block(this);
        } finally {
          context.restore();
        }

        return this;
      },

      clear: function() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        return this;
      },
      
      context: function() {
        return context;
      },
      
      element: function() {
        return canvas;
      },
      
      createLinearGradient: function(x0, y0, x1, y1) {
        return context.createLinearGradient(x0, y0, x1, y1);
      },
      
      createRadialGradient: function(x0, y0, r0, x1, y1, r1) {
        return context.createRadialGradient(x0, y0, r0, x1, y1, r1);
      },
      
      createPattern: function(image, repitition) {
        return context.createPattern(image, repitition);
      },

      drawImage: function(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        return this;
      },
      
      drawLine: function(x1, y1, x2, y2, width) {
        width = width || 3;

        context.lineWidth = width;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.closePath();
        context.stroke();
      },

      fill: function(color) {
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);

        return this;
      },

      /**
       * Fills a circle at the specified position with the specified
       * radius and color.
       *
       * @name fillCircle
       * @methodOf PowerCanvas#
       *
       * @param {Number} x
       * @param {Number} y
       * @param {Number} radius
       * @param {Number} color
       * @see PowerCanvas#fillColor 
       * @returns this
       */
      fillCircle: function(x, y, radius, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI*2, true);
        context.closePath();
        context.fill();

        return this;
      },

      /**
       * Fills a rectangle with the current fillColor
       * at the specified position with the specified
       * width and height 
      
       * @name fillRect
       * @methodOf PowerCanvas#
       *
       * @param {Number} x
       * @param {Number} y
       * @param {Number} width
       * @param {Number} height
       * @see PowerCanvas#fillColor 
       * @returns this
       */      
      
      fillRect: function(x, y, width, height) {
        context.fillRect(x, y, width, height);

        return this;
      },

      /**
      * Adapted from http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
      */
      
      fillRoundRect: function(x, y, width, height, radius, strokeWidth) {
        if (!radius) {
          radius = 5;
        }
        
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);        
        context.closePath();
                  
        if (strokeWidth) {
          context.lineWidth = strokeWidth;  
          context.stroke();
        }
        
        context.fill();  
    
        return this;    
      },       

      fillText: function(text, x, y) {
        context.fillText(text, x, y);

        return this;
      },

      centerText: function(text, y) {
        var textWidth = $canvas.measureText(text);

        $canvas.fillText(text, (canvas.width - textWidth) / 2, y);
      },

      fillWrappedText: function(text, x, y, width) {
        var tokens = text.split(" ");
        var tokens2 = text.split(" ");
        var lineHeight = 16;

        if ($canvas.measureText(text) > width) {
          if (tokens.length % 2 == 0) {
            tokens2 = tokens.splice(tokens.length / 2, (tokens.length / 2), "");
          } else {
            tokens2 = tokens.splice(tokens.length / 2 + 1, (tokens.length / 2) + 1, "");
          }
          context.fillText(tokens.join(" "), x, y);
          context.fillText(tokens2.join(" "), x, y + lineHeight);
        } else {
          context.fillText(tokens.join(" "), x, y + lineHeight);
        }
      },

      fillColor: function(color) {
        if(color) {
          context.fillStyle = color;
          return this;
        } else {
          return context.fillStyle;
        }
      },

      font: function(font) {
        context.font = font;
      },

      measureText: function(text) {
        return context.measureText(text).width;
      },

      putImageData: function(imageData, x, y) {
        context.putImageData(imageData, x, y);

        return this;
      },

      strokeColor: function(color) {
        if(color) {
          context.strokeStyle = color;
          return this;
        } else {
          return context.strokeStyle;
        }
      },
      
      strokeRect: function(x, y, width, height) {
        context.strokeRect(x, y, width, height);

        return this;
      },

      textAlign: function(textAlign) {
        context.textAlign = textAlign;
        return this;
      },

      height: function() {
        return canvas.height;
      },

      width: function() {
        return canvas.width;
      }
    });

    if(canvas.getContext) {
      context = canvas.getContext('2d');

      if(options.init) {
        options.init($canvas);
      }

      return $canvas;
    } else {
      return false;
    }

  };
})(jQuery);
;
/**
 * Returns random integers from [0, n) if n is given.
 * Otherwise returns random float between 0 and 1.
 *
 * @param {Number} n
 */
function rand(n) {
  if(n) {
    return Math.floor(n * Math.random());
  } else {
    return Math.random();
  }
}
;
(function($) {
  return (window.Random = $.extend(window.Random, {
    angle: function() {
      return rand() * Math.TAU;
    },
    often: function() {
      return rand(3);
    },
    sometimes: function() {
      return !rand(3);
    }
  }));
})(jQuery);;
;
(function($) {
  var retrieve, store;
  /***
  @name Local
  @namespace
  */
  /***
  Store an object in local storage.

  @name set
  @methodOf Local

  @param {String} key
  @param {Object} value
  @type Object
  @returns value
  */
  store = function(key, value) {
    localStorage[key] = JSON.stringify(value);
    return value;
  };
  /***
  Retrieve an object from local storage.

  @name get
  @methodOf Local

  @param {String} key
  @type Object
  @returns The object that was stored or undefined if no object was stored.
  */
  retrieve = function(key) {
    var value;
    value = localStorage[key];
    return (typeof value !== "undefined" && value !== null) ? JSON.parse(value) : null;
  };
  return (window.Local = $.extend(window.Local, {
    get: retrieve,
    set: store,
    put: store
  }));
})(jQuery);;
String.prototype.constantize = function() {
  if (this.match(/[A-Z][A-Za-z0-9]*/)) {
    eval("var that = " + (this));
    return that;
  } else {
    return undefined;
  }
};
String.prototype.parse = function() {
  try {
    return JSON.parse(this);
  } catch (e) {
    return this;
  }
};;;
var App;
App = {};var App;
App = {};;
var Callback, Event, Guard, GuardsCollection, Machine, StateMachine, Transition;
StateMachine = function(name, object, options, block) {
  return Machine(name, object, options, block);
};
Callback = function(options, machine, block) {
  var self;
  self = {
    match: function(from_state, to_state, event) {
      if (options.to && options.from) {
        if (options.to === to_state && options.from === from_state) {
          return true;
        }
        return false;
      }
      if ((options.to === to_state) || (options.from === from_state) || (options.on === event.name)) {
        return true;
      }
    },
    run: function(params) {
      (typeof block === "undefined" || block === null) ? undefined : block.apply(machine.object, params);
      return options.run ? options.run.apply(machine.object, params) : null;
    }
  };
  return self;
};
Event = function(name, machine) {
  var guards, self, transition_for;
  guards = GuardsCollection();
  transition_for = function(params) {
    var from, to;
    if (can_fire(params)) {
      from = machine.state();
      to = guards.find_to_state(name, from, params);
      return Transition(machine, self, from, to, params);
    } else {
      return false;
    }
  };
  self = {
    transition: function(options) {
      guards.add(name, machine.object, options);
      machine.states.push(options.from);
      machine.states.push(options.to);
      return self;
    },
    can_fire: function(params) {
      if (guards.match(name, machine.state(), params)) {
        return true;
      }
      return false;
    },
    fire: function(params) {
      var transition;
      transition = transition_for(params);
      if (transition) {
        return transition.perform();
      }
      return false;
    }
  };
  return self;
};
Guard = function(name, object, options) {
  var I, self;
  I = {
    from: options.from,
    to: options.to,
    except: options.except,
    options: options,
    name: name,
    object: object
  };
  self = {
    match: function(name, from, params) {
      if (name === I.name && match_from_state(I.from)) {
        if (run_callbacks(params)) {
          return true;
        }
      }
      return false;
    },
    match_from_state: function(from) {
      if (typeof I.from === 'string') {
        if (I.from === 'any') {
          return check_exceptions(from);
        } else {
          return from === I.from;
        }
      } else {
        return I.from.each(function(from_item) {
          if (from === from_item) {
            return true;
          }
          return false;
        });
      }
    },
    check_exceptions: function(from) {
      return from !== I.except;
    },
    run_callbacks: function(params) {
      var success;
      success = true;
      if (I.options.when) {
        success = I.options.when.apply(I.object, params);
      }
      if (I.options.unless && success) {
        success = !I.options.unless.apply(I.object, params);
      }
      return success;
    }
  };
  return self;
};
GuardsCollection = function() {
  var guards, last_match, self;
  guards = [];
  last_match = null;
  self = {
    add: function(name, object, options) {
      var guard;
      guard = Guard(name, object, options);
      guards.push(guard);
      return guard;
    },
    all: function() {
      return guards;
    },
    match: function(name, from, params) {
      guards.each(function(guard) {
        var match;
        match = guard.match(name, from, params);
        if (match) {
          last_match = match;
          return guard;
        }
      });
      return false;
    },
    find_to_state: function(name, from, params) {
      var local_match;
      local_match = match(name, from, params);
      if (local_match) {
        return match.to;
      }
    }
  };
  return self;
};
Machine = function(name, object, options, block) {
  var add_event_methods, add_methods_to_object, callbacks, events, internal_state, machine_name, self, set_state, states;
  events = [];
  states = [];
  callbacks = {
    before: [],
    after: []
  };
  machine_name = name;
  internal_state = options && (options.initial ? options.initial : '');
  add_methods_to_object(name, object);
  if (block) {
    block(self);
  }
  return self;
  add_methods_to_object = function(name, object) {
    object[name] = self.state();
    object[name + '_events'] = events;
    return (object[name + '_states'] = states);
  };
  add_event_methods = function(name, object, event) {
    object[name] = function() {
      return event.fire(arguments);
    };
    return (object['can_' + name] = function() {
      return event.can_fire();
    });
  };
  set_state = function(state) {
    internal_state = state;
    return (object[machine_name] = state);
  };
  return (self = {
    event: function(name, block) {
      var event;
      event = Event(name, self);
      events.push(event);
      add_event_methods(name, object, event);
      if (block) {
        block(event);
      }
      return event;
    },
    before_transition: function(options, block) {
      var callback;
      callback = Callback(options, self, block);
      callbacks["before"].push(callback);
      return callback;
    },
    after_transition: function(options, block) {
      var callback;
      callback = Callback(options, self, block);
      callbacks["after"].push(callback);
      return callback;
    },
    state: function() {
      return internal_state;
    }
  });
};
Transition = function(machine, event, from, to, params) {
  var self;
  return (self = {
    perform: function() {
      self.before();
      machine.set_state(to);
      self.after();
      return true;
    },
    before: function() {
      return machine.callbacks['before'].each(function(callback) {
        return callback.match(from, to, event) ? callback.run(params) : null;
      });
    },
    after: function() {
      return machine.callbacks['after'].each(function(callback) {
        return callback.match(from, to, event) ? callback.run(params) : null;
      });
    },
    rollback: function() {
      return machine.set_state(from);
    }
  });
};;
/**
* Creates and returns a copy of the array. The copy contains
* the same objects.
*
* @type Array
* @returns A new array that is a copy of the array
*/
Array.prototype.copy = function() {
  return this.concat();  
};

/**
* Empties the array of its contents. It is modified in place.
*
* @type Array
* @returns this, now emptied.
*/
Array.prototype.clear = function() {
  this.length = 0;
  return this;
};

/**
* Invoke the named method on each element in the array
* and return a new array containing the results of the invocation.
*
<code><pre>
  [1.1, 2.2, 3.3, 4.4].invoke("floor")
  => [1, 2, 3, 4]

  ['hello', 'world', 'cool!'].invoke('substring', 0, 3)
  => ['hel', 'wor', 'coo']
</pre></code>
*
* @param {String} method The name of the method to invoke.
* @param [arg...] Optional arguments to pass to the method being invoked.
*
* @type Array
* @returns A new array containing the results of invoking the 
* named method on each element.
*/
Array.prototype.invoke = function(method) {
  var args = Array.prototype.slice.call(arguments, 1);
  
  return this.map(function(element) {
    return element[method].apply(element, args);
  });
};

/**
* Randomly select an element from the array.
*
* @returns A random element from an array
*/
Array.prototype.rand = function() {
  return this[rand(this.length)];
};

/**
* Remove the first occurance of the given object from the array if it is
* present.
*
* @param {Object} object The object to remove from the array if present.
* @returns The removed object if present otherwise undefined.
*/
Array.prototype.remove = function(object) {
  var index = this.indexOf(object);
  if(index >= 0) {
    return this.splice(index, 1)[0];
  } else {
    return undefined;
  }
};

/**
* Returns true if the element is present in the array.
*
* @param {Object} element The element to check if present.
* @returns true if the element is in the array, false otherwise.
* @type Boolean
*/
Array.prototype.include = function(element) {
  return this.indexOf(element) != -1;
};

/**
 * Call the given iterator once for each element in the array,
 * passing in the element as the first argument, the index of 
 * the element as the second argument, and this array as the
 * third argument.
 *
 * @param {Function} iterator Function to be called once for 
 * each element in the array.
 * @param {Object} [context] Optional context parameter to be 
 * used as `this` when calling the iterator function.
 *
 * @returns `this` to enable method chaining.
 */
Array.prototype.each = function(iterator, context) {
  if(this.forEach) {
    this.forEach(iterator, context);
  } else {
    var len = this.length;
    for(var i = 0; i < len; i++) {
      iterator.call(context, this[i], i, this);
    }
  }

  return this;
};

Array.prototype.eachSlice = function(n, iterator, context) {
  var len = Math.floor(this.length / n);
  
  for(var i = 0; i < len; i++) {
    iterator.call(context, this.slice(i*n, (i+1)*n), i*n, this);
  }
  
  return this;
};

/**
 * Returns a new array with the elements all shuffled up.
 *
 * @returns A new array that is randomly shuffled.
 * @type Array
 */
Array.prototype.shuffle = function() {
  var shuffledArray = [];
  
  this.each(function(element) {
    shuffledArray.splice(rand(shuffledArray.length + 1), 0, element);
  });
  
  return shuffledArray;
};

/**
 * Returns the first element of the array, undefined if the array is empty.
 *
 * @returns The first element, or undefined if the array is empty.
 * @type Object
 */
Array.prototype.first = function() {
  return this[0];
};

/**
 * Returns the last element of the array, undefined if the array is empty.
 *
 * @returns The last element, or undefined if the array is empty.
 * @type Object
 */
Array.prototype.last = function() {
  return this[this.length - 1];
};

/**
 * Pretend the array is a circle and grab a new array containing length elements. 
 * If length is not given return the element at start, again assuming the array 
 * is a circle.
 *
 * @param {Number} start The index to start wrapping at, or the index of the 
 * sole element to return if no length is given.
 * @param {Number} [length] Optional length determines how long result 
 * array should be.
 * @returns The element at start mod array.length, or an array of length elements, 
 * starting from start and wrapping.
 * @type Object or Array
 */
Array.prototype.wrap = function(start, length) {
  if(length != null) {
    var end = start + length;
    var result = [];
  
    for(var i = start; i < end; i++) {
      result.push(this[i.mod(this.length)]);
    }
  
    return result;
  } else {
    return this[start.mod(this.length)];
  }
};

/**
 * Partitions the elements into two groups: those for which the iterator returns
 * true, and those for which it returns false.
 * @param {Function} iterator
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array in the form of [trueCollection, falseCollection]
 */
Array.prototype.partition = function(iterator, context) {
  var trueCollection = [];
  var falseCollection = [];

  this.each(function(element) {
    if(iterator.call(context, element)) {
      trueCollection.push(element);
    } else {
      falseCollection.push(element);
    }
  });

  return [trueCollection, falseCollection];
};

/**
 * Return the group of elements for which the iterator's return value is true.
 * 
 * @param {Function} iterator The iterator receives each element in turn as 
 * the first agument.
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array containing the elements for which the iterator returned true.
 */
Array.prototype.select = function(iterator, context) {
  return this.partition(iterator, context)[0];
};

/**
 * Return the group of elements that are not in the passed in set.
 * 
 * @param {Array} values List of elements to exclude.
 *
 * @type Array
 * @returns An array containing the elements that are not passed in.
 */
Array.prototype.without = function(values) {
  return this.reject(function(element) {
    return values.include(element);
  });
};

/**
 * Return the group of elements for which the iterator's return value is false.
 * 
 * @param {Function} iterator The iterator receives each element in turn as 
 * the first agument.
 * @param {Object} [context] Optional context parameter to be
 * used as `this` when calling the iterator function.
 *
 * @type Array
 * @returns An array containing the elements for which the iterator returned false.
 */
Array.prototype.reject = function(iterator, context) {
  return this.partition(iterator, context)[1];
};

Array.prototype.inject = function(initial, iterator) {
  this.each(function(element) {
    initial = iterator(initial, element);
  });
  
  return initial;
};

Array.prototype.sum = function() {
  return this.inject(0, function(sum, n) {
    return sum + n;
  });
};

;
/**
 * CoffeeScript Compiler v1.0.1
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
this.CoffeeScript=function(){function require(a){return require[a]}require["./helpers"]=new function(){var a=this;(function(){var b,c;a.starts=function(a,b,c){return b===a.substr(c,b.length)},a.ends=function(a,b,c){var d;d=b.length;return b===a.substr(a.length-d-(c||0),d)},a.compact=function(a){var b,c,d,e;e=[];for(c=0,d=a.length;c<d;c++)b=a[c],b&&e.push(b);return e},a.count=function(a,b){var c,d;c=d=0;if(!b.length)return 1/0;while(d=1+a.indexOf(b,d))c++;return c},a.merge=function(a,c){return b(b({},a),c)},b=a.extend=function(a,b){var c,d;for(c in b)d=b[c],a[c]=d;return a},a.flatten=c=function(a){var b,d,e,f;d=[];for(e=0,f=a.length;e<f;e++)b=a[e],b instanceof Array?d=d.concat(c(b)):d.push(b);return d},a.del=function(a,b){var c;c=a[b],delete a[b];return c},a.last=function(a,b){return a[a.length-(b||0)-1]}}).call(this)},require["./rewriter"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1},u=Array.prototype.slice;a.Rewriter=function(){function a(){}a.prototype.rewrite=function(a){this.tokens=a,this.removeLeadingNewlines(),this.removeMidExpressionNewlines(),this.closeOpenCalls(),this.closeOpenIndexes(),this.addImplicitIndentation(),this.tagPostfixConditionals(),this.addImplicitBraces(),this.addImplicitParentheses(),this.ensureBalance(b),this.rewriteClosingParens();return this.tokens},a.prototype.scanTokens=function(a){var b,c,d;d=this.tokens,b=0;while(c=d[b])b+=a.call(this,c,b,d);return!0},a.prototype.detectEnd=function(a,b,c){var f,g,h,i,j;h=this.tokens,f=0;while(g=h[a]){if(f===0&&b.call(this,g,a))return c.call(this,g,a);if(!g||f<0)return c.call(this,g,a-1);if(i=g[0],t.call(e,i)>=0)f+=1;else if(j=g[0],t.call(d,j)>=0)f-=1;a+=1}return a-1},a.prototype.removeLeadingNewlines=function(){var a,b,c,d;d=this.tokens;for(a=0,c=d.length;a<c;a++){b=d[a][0];if(b!=="TERMINATOR")break}if(a)return this.tokens.splice(0,a)},a.prototype.removeMidExpressionNewlines=function(){return this.scanTokens(function(a,b,d){var e;if(a[0]!=="TERMINATOR"||!(e=this.tag(b+1),t.call(c,e)>=0))return 1;d.splice(b,1);return 0})},a.prototype.closeOpenCalls=function(){var a,b;b=function(a,b){var c;return(c=a[0])===")"||c==="CALL_END"||a[0]==="OUTDENT"&&this.tag(b-1)===")"},a=function(a,b){return this.tokens[a[0]==="OUTDENT"?b-1:b][0]="CALL_END"};return this.scanTokens(function(c,d){c[0]==="CALL_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.closeOpenIndexes=function(){var a,b;b=function(a,b){var c;return(c=a[0])==="]"||c==="INDEX_END"},a=function(a,b){return a[0]="INDEX_END"};return this.scanTokens(function(c,d){c[0]==="INDEX_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.addImplicitBraces=function(){var a,b,c,f,g;c=[],f=null,g=0,b=function(a,b){var c,d,e,f,g,h;g=this.tokens.slice(b+1,b+3+1||9e9),c=g[0],f=g[1],e=g[2];if("HERECOMMENT"===(c!=null?c[0]:void 0))return!1;d=a[0];return(d==="TERMINATOR"||d==="OUTDENT")&&((f!=null?f[0]:void 0)!==":"&&((c!=null?c[0]:void 0)!=="@"||(e!=null?e[0]:void 0)!==":"))||d===","&&c&&((h=c[0])!=="IDENTIFIER"&&h!=="NUMBER"&&h!=="STRING"&&h!=="@"&&h!=="TERMINATOR"&&h!=="OUTDENT")},a=function(a,b){return this.tokens.splice(b,0,["}","}",a[2]])};return this.scanTokens(function(g,h,i){var j,k,l,m,n,o,p;if(o=l=g[0],t.call(e,o)>=0){c.push([l==="INDENT"&&this.tag(h-1)==="{"?"{":l,h]);return 1}if(t.call(d,l)>=0){f=c.pop();return 1}if(l!==":"||(j=this.tag(h-2))!==":"&&((p=c[c.length-1])!=null?p[0]:void 0)==="{")return 1;c.push(["{"]),k=j==="@"?h-2:h-1;while(this.tag(k-2)==="HERECOMMENT")k-=2;n=new String("{"),n.generated=!0,m=["{",n,g[2]],m.generated=!0,i.splice(k,0,m),this.detectEnd(h+2,b,a);return 2})},a.prototype.addImplicitParentheses=function(){var a,b;b=!1,a=function(a,b){var c;c=a[0]==="OUTDENT"?b+1:b;return this.tokens.splice(c,0,["CALL_END",")",a[2]])};return this.scanTokens(function(c,d,e){var k,m,n,o,p,q,r,s,u;q=c[0];if(q==="CLASS"||q==="IF")b=!0;r=e.slice(d-1,d+1+1||9e9),o=r[0],m=r[1],n=r[2],k=!b&&q==="INDENT"&&n&&n.generated&&n[0]==="{"&&o&&(s=o[0],t.call(i,s)>=0),p=!1,t.call(l,q)>=0&&(b=!1),o&&!o.spaced&&q==="?"&&(c.call=!0);if(!k&&(!(o!=null?o.spaced:void 0)||!o.call&&!(u=o[0],t.call(i,u)>=0)||t.call(g,q)<0&&(c.spaced||c.newLine||t.call(j,q)<0)))return 1;e.splice(d,0,["CALL_START","(",c[2]]),this.detectEnd(d+1,function(a,b){var c,d;q=a[0];if(!p&&a.fromThen)return!0;if(q==="IF"||q==="ELSE"||q==="->"||q==="=>")p=!0;if((q==="."||q==="?."||q==="::")&&this.tag(b-1)==="OUTDENT")return!0;return!a.generated&&this.tag(b-1)!==","&&t.call(h,q)>=0&&(q!=="INDENT"||this.tag(b-2)!=="CLASS"&&(d=this.tag(b-1),t.call(f,d)<0)&&(!(c=this.tokens[b+1])||!c.generated||c[0]!=="{"))},a),o[0]==="?"&&(o[0]="FUNC_EXIST");return 2})},a.prototype.addImplicitIndentation=function(){return this.scanTokens(function(a,b,c){var d,e,f,g,h,i,j,k;i=a[0];if(i==="TERMINATOR"&&this.tag(b+1)==="THEN"){c.splice(b,1);return 0}if(i==="ELSE"&&this.tag(b-1)!=="OUTDENT"){c.splice.apply(c,[b,0].concat(u.call(this.indentation(a))));return 2}if(i==="CATCH"&&((j=this.tag(b+2))==="OUTDENT"||j==="TERMINATOR"||j==="FINALLY")){c.splice.apply(c,[b+2,0].concat(u.call(this.indentation(a))));return 4}if(t.call(n,i)>=0&&this.tag(b+1)!=="INDENT"&&(i!=="ELSE"||this.tag(b+1)!=="IF")){h=i,k=this.indentation(a),f=k[0],g=k[1],h==="THEN"&&(f.fromThen=!0),f.generated=g.generated=!0,c.splice(b+1,0,f),e=function(a,b){var c;return a[1]!==";"&&(c=a[0],t.call(m,c)>=0)&&(a[0]!=="ELSE"||(h==="IF"||h==="THEN"))},d=function(a,b){return this.tokens.splice(this.tag(b-1)===","?b-1:b,0,g)},this.detectEnd(b+2,e,d),i==="THEN"&&c.splice(b,1);return 1}return 1})},a.prototype.tagPostfixConditionals=function(){var a;a=function(a,b){var c;return(c=a[0])==="TERMINATOR"||c==="INDENT"};return this.scanTokens(function(b,c){var d;if(b[0]!=="IF")return 1;d=b,this.detectEnd(c+1,a,function(a,b){if(a[0]!=="INDENT")return d[0]="POST_"+d[0]});return 1})},a.prototype.ensureBalance=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d={},f={},m=this.tokens;for(i=0,k=m.length;i<k;i++){h=m[i],g=h[0];for(j=0,l=a.length;j<l;j++){n=a[j],e=n[0],b=n[1],d[e]|=0;if(g===e)d[e]++===0&&(f[e]=h[2]);else if(g===b&&--d[e]<0)throw Error("too many "+h[1]+" on line "+(h[2]+1))}}for(e in d){c=d[e];if(c>0)throw Error("unclosed "+e+" on line "+(f[e]+1))}return this},a.prototype.rewriteClosingParens=function(){var a,b,c;c=[],a={};for(b in k)a[b]=0;return this.scanTokens(function(b,f,g){var h,i,j,l,m,n,o;if(o=m=b[0],t.call(e,o)>=0){c.push(b);return 1}if(t.call(d,m)<0)return 1;if(a[h=k[m]]>0){a[h]-=1,g.splice(f,1);return 0}i=c.pop(),j=i[0],l=k[j];if(m===l)return 1;a[j]+=1,n=[l,j==="INDENT"?i[1]:l],this.tag(f+2)===j?(g.splice(f+3,0,n),c.push(i)):g.splice(f,0,n);return 1})},a.prototype.indentation=function(a){return[["INDENT",2,a[2]],["OUTDENT",2,a[2]]]},a.prototype.tag=function(a){var b;return(b=this.tokens[a])!=null?b[0]:void 0};return a}(),b=[["(",")"],["[","]"],["{","}"],["INDENT","OUTDENT"],["CALL_START","CALL_END"],["PARAM_START","PARAM_END"],["INDEX_START","INDEX_END"]],k={},e=[],d=[];for(q=0,r=b.length;q<r;q++)s=b[q],o=s[0],p=s[1],e.push(k[p]=o),d.push(k[o]=p);c=["CATCH","WHEN","ELSE","FINALLY"].concat(d),i=["IDENTIFIER","SUPER",")","CALL_END","]","INDEX_END","@","THIS"],g=["IDENTIFIER","NUMBER","STRING","JS","REGEX","NEW","PARAM_START","CLASS","IF","TRY","SWITCH","THIS","BOOL","UNARY","SUPER","@","->","=>","[","(","{","--","++"],j=["+","-"],f=["->","=>","{","[",","],h=["POST_IF","FOR","WHILE","UNTIL","WHEN","BY","LOOP","TERMINATOR","INDENT"],n=["ELSE","->","=>","TRY","FINALLY","THEN"],m=["TERMINATOR","CATCH","FINALLY","ELSE","OUTDENT","LEADING_WHEN"],l=["TERMINATOR","INDENT","OUTDENT"]}).call(this)},require["./lexer"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};I=require("./rewriter").Rewriter,T=require("./helpers"),P=T.count,S=T.starts,O=T.compact,Q=T.last,a.Lexer=w=function(){function a(){}a.prototype.tokenize=function(a,b){var c;b==null&&(b={}),N.test(a)&&(a="\n"+a),a=a.replace(/\r/g,"").replace(L,""),this.code=a,this.line=b.line||0,this.indent=0,this.indebt=0,this.outdebt=0,this.indents=[],this.tokens=[],c=0;while(this.chunk=a.slice(c))c+=this.identifierToken()||this.commentToken()||this.whitespaceToken()||this.lineToken()||this.heredocToken()||this.stringToken()||this.numberToken()||this.regexToken()||this.jsToken()||this.literalToken();this.closeIndentation();if(b.rewrite===!1)return this.tokens;return(new I).rewrite(this.tokens)},a.prototype.identifierToken=function(){var a,b,c,d,e,h,i,j,k;if(!(e=o.exec(this.chunk)))return 0;d=e[0],c=e[1],a=e[2];if(c==="own"&&this.tag()==="FOR"){this.token("OWN",c);return c.length}b=a||(h=Q(this.tokens))&&!h.spaced&&((j=h[0])==="."||j==="?."||j==="@"||j==="::"),i="IDENTIFIER";if(U.call(s,c)>=0||!b&&U.call(g,c)>=0)i=c.toUpperCase(),i==="WHEN"&&(k=this.tag(),U.call(t,k)>=0)?i="LEADING_WHEN":i==="FOR"?this.seenFor=!0:i==="UNLESS"?i="IF":U.call(M,i)<0?U.call(G,i)>=0&&(i!=="INSTANCEOF"&&this.seenFor?(i="FOR"+i,this.seenFor=!1):(i="RELATION",this.value()==="!"&&(this.tokens.pop(),c="!"+c))):i="UNARY";U.call(r,c)>=0&&(b?(i="IDENTIFIER",c=new String(c),c.reserved=!0):U.call(H,c)>=0&&this.identifierError(c)),b||(f.hasOwnProperty(c)&&(c=f[c]),i=function(){switch(c){case"!":return"UNARY";case"==":case"!=":return"COMPARE";case"&&":case"||":return"LOGIC";case"true":case"false":case"null":case"undefined":return"BOOL";case"break":case"continue":case"debugger":return"STATEMENT";default:return i}}()),this.token(i,c),a&&this.token(":",":");return d.length},a.prototype.numberToken=function(){var a,b;if(!(a=D.exec(this.chunk)))return 0;b=a[0],this.token("NUMBER",b);return b.length},a.prototype.stringToken=function(){var a,b;switch(this.chunk.charAt(0)){case"'":if(!(a=K.exec(this.chunk)))return 0;this.token("STRING",(b=a[0]).replace(y,"\\\n"));break;case'"':if(!(b=this.balancedString(this.chunk,'"')))return 0;0<b.indexOf("#{",1)?this.interpolateString(b.slice(1,-1)):this.token("STRING",this.escapeLines(b));break;default:return 0}this.line+=P(b,"\n");return b.length},a.prototype.heredocToken=function(){var a,b,c,d;if(!(c=k.exec(this.chunk)))return 0;b=c[0],d=b.charAt(0),a=this.sanitizeHeredoc(c[2],{quote:d,indent:null}),d!=='"'||0>a.indexOf("#{")?this.token("STRING",this.makeString(a,d,!0)):this.interpolateString(a,{heredoc:!0}),this.line+=P(b,"\n");return b.length},a.prototype.commentToken=function(){var a,b,c;if(!(c=this.chunk.match(h)))return 0;a=c[0],b=c[1],this.line+=P(a,"\n"),b&&(this.token("HERECOMMENT",this.sanitizeHeredoc(b,{herecomment:!0,indent:Array(this.indent+1).join(" ")})),this.token("TERMINATOR","\n"));return a.length},a.prototype.jsToken=function(){var a,b;if(this.chunk.charAt(0)!=="`"||!(a=q.exec(this.chunk)))return 0;this.token("JS",(b=a[0]).slice(1,-1));return b.length},a.prototype.regexToken=function(){var a,b,c,d;if(this.chunk.charAt(0)!=="/")return 0;if(a=m.exec(this.chunk))return this.heregexToken(a);b=Q(this.tokens);if(b&&(d=b[0],U.call(b.spaced?A:B,d)>=0))return 0;if(!(a=F.exec(this.chunk)))return 0;c=a[0],this.token("REGEX",c==="//"?"/(?:)/":c);return c.length},a.prototype.heregexToken=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,o;d=a[0],b=a[1],c=a[2];if(0>b.indexOf("#{")){e=b.replace(n,"").replace(/\//g,"\\/"),this.token("REGEX","/"+(e||"(?:)")+"/"+c);return d.length}this.token("IDENTIFIER","RegExp"),this.tokens.push(["CALL_START","("]),g=[],k=this.interpolateString(b,{regex:!0});for(i=0,j=k.length;i<j;i++){l=k[i],f=l[0],h=l[1];if(f==="TOKENS")g.push.apply(g,h);else{if(!(h=h.replace(n,"")))continue;h=h.replace(/\\/g,"\\\\"),g.push(["STRING",this.makeString(h,'"',!0)])}g.push(["+","+"])}g.pop(),((m=g[0])!=null?m[0]:void 0)!=="STRING"&&this.tokens.push(["STRING",'""'],["+","+"]),(o=this.tokens).push.apply(o,g),c&&this.tokens.push([",",","],["STRING",'"'+c+'"']),this.token(")",")");return d.length},a.prototype.lineToken=function(){var a,b,c,d,e,f;if(!(c=z.exec(this.chunk)))return 0;b=c[0],this.line+=P(b,"\n"),e=Q(this.tokens,1),f=b.length-1-b.lastIndexOf("\n"),d=this.unfinished();if(f-this.indebt===this.indent){d?this.suppressNewlines():this.newlineToken();return b.length}if(f>this.indent){if(d){this.indebt=f-this.indent,this.suppressNewlines();return b.length}a=f-this.indent+this.outdebt,this.token("INDENT",a),this.indents.push(a),this.outdebt=this.indebt=0}else this.indebt=0,this.outdentToken(this.indent-f,d);this.indent=f;return b.length},a.prototype.outdentToken=function(a,b,c){var d,e;while(a>0)e=this.indents.length-1,this.indents[e]===void 0?a=0:this.indents[e]===this.outdebt?(a-=this.outdebt,this.outdebt=0):this.indents[e]<this.outdebt?(this.outdebt-=this.indents[e],a-=this.indents[e]):(d=this.indents.pop()-this.outdebt,a-=d,this.outdebt=0,this.token("OUTDENT",d));d&&(this.outdebt-=a),this.tag()!=="TERMINATOR"&&!b&&this.token("TERMINATOR","\n");return this},a.prototype.whitespaceToken=function(){var a,b,c;if(!(a=N.exec(this.chunk))&&!(b=this.chunk.charAt(0)==="\n"))return 0;c=Q(this.tokens),c&&(c[a?"spaced":"newLine"]=!0);return a?a[0].length:0},a.prototype.newlineToken=function(){this.tag()!=="TERMINATOR"&&this.token("TERMINATOR","\n");return this},a.prototype.suppressNewlines=function(){this.value()==="\\"&&this.tokens.pop();return this},a.prototype.literalToken=function(){var a,b,c,f,g,h,k,l;(a=E.exec(this.chunk))?(f=a[0],e.test(f)&&this.tagParameters()):f=this.chunk.charAt(0),c=f,b=Q(this.tokens);if(f==="="&&b){!b[1].reserved&&(g=b[1],U.call(r,g)>=0)&&this.assignmentError();if((h=b[1])==="||"||h==="&&"){b[0]="COMPOUND_ASSIGN",b[1]+="=";return f.length}}if(f===";")c="TERMINATOR";else if(U.call(x,f)<0)if(U.call(i,f)<0)if(U.call(j,f)<0)if(U.call(M,f)<0)if(U.call(J,f)<0){if(U.call(v,f)>=0||f==="?"&&(b!=null?b.spaced:void 0))c="LOGIC";else if(b&&!b.spaced)if(f==="("&&(k=b[0],U.call(d,k)>=0))b[0]==="?"&&(b[0]="FUNC_EXIST"),c="CALL_START";else if(f==="["&&(l=b[0],U.call(p,l)>=0)){c="INDEX_START";switch(b[0]){case"?":b[0]="INDEX_SOAK";break;case"::":b[0]="INDEX_PROTO"}}}else c="SHIFT";else c="UNARY";else c="COMPOUND_ASSIGN";else c="COMPARE";else c="MATH";this.token(c,f);return f.length},a.prototype.sanitizeHeredoc=function(a,b){var c,d,e,f,g;e=b.indent,d=b.herecomment;if(d&&0>a.indexOf("\n"))return a;if(!d)while(f=l.exec(a)){c=f[1];if(e===null||0<(g=c.length)&&g<e.length)e=c}e&&(a=a.replace(RegExp("\\n"+e,"g"),"\n")),d||(a=a.replace(/^\n/,""));return a},a.prototype.tagParameters=function(){var a,b,c,d;if(this.tag()!==")")return this;b=[],d=this.tokens,a=d.length,d[--a][0]="PARAM_END";while(c=d[--a])switch(c[0]){case")":b.push(c);break;case"(":case"CALL_START":if(b.length)b.pop();else{c[0]="PARAM_START";return this}}return this},a.prototype.closeIndentation=function(){return this.outdentToken(this.indent)},a.prototype.identifierError=function(a){throw SyntaxError('Reserved word "'+a+'" on line '+(this.line+1))},a.prototype.assignmentError=function(){throw SyntaxError('Reserved word "'+this.value()+'" on line '+(this.line+1)+" can't be assigned")},a.prototype.balancedString=function(a,b){var c,d,e,f,g;f=[b];for(c=1,g=a.length;1<=g?c<g:c>g;1<=g?c+=1:c-=1){switch(d=a.charAt(c)){case"\\":c++;continue;case b:f.pop();if(!f.length)return a.slice(0,c+1);b=f[f.length-1];continue}b!=="}"||d!=='"'&&d!=="'"?b==="}"&&d==="{"?f.push(b="}"):b==='"'&&e==="#"&&d==="{"&&f.push(b="}"):f.push(b=d),e=d}throw new Error("missing "+f.pop()+", starting on line "+(this.line+1))},a.prototype.interpolateString=function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;c==null&&(c={}),e=c.heredoc,m=c.regex,o=[],l=0,f=-1;while(j=b.charAt(f+=1)){if(j==="\\"){f+=1;continue}if(j!=="#"||b.charAt(f+1)!=="{"||!(d=this.balancedString(b.slice(f+1),"}")))continue;l<f&&o.push(["NEOSTRING",b.slice(l,f)]),g=d.slice(1,-1);if(g.length){k=(new a).tokenize(g,{line:this.line,rewrite:!1}),k.pop(),((r=k[0])!=null?r[0]:void 0)==="TERMINATOR"&&k.shift();if(i=k.length)i>1&&(k.unshift(["(","("]),k.push([")",")"])),o.push(["TOKENS",k])}f+=d.length,l=f+1}f>l&&l<b.length&&o.push(["NEOSTRING",b.slice(l)]);if(m)return o;if(!o.length)return this.token("STRING",'""');o[0][0]!=="NEOSTRING"&&o.unshift(["",""]),(h=o.length>1)&&this.token("(","(");for(f=0,q=o.length;f<q;f++)s=o[f],n=s[0],p=s[1],f&&this.token("+","+"),n==="TOKENS"?(t=this.tokens).push.apply(t,p):this.token("STRING",this.makeString(p,'"',e));h&&this.token(")",")");return o},a.prototype.token=function(a,b){return this.tokens.push([a,b,this.line])},a.prototype.tag=function(a,b){var c;return(c=Q(this.tokens,a))&&(b?c[0]=b:c[0])},a.prototype.value=function(a,b){var c;return(c=Q(this.tokens,a))&&(b?c[1]=b:c[1])},a.prototype.unfinished=function(){var a,c;return u.test(this.chunk)||(a=Q(this.tokens,1))&&a[0]!=="."&&(c=this.value())&&!c.reserved&&C.test(c)&&!e.test(c)&&!b.test(this.chunk)},a.prototype.escapeLines=function(a,b){return a.replace(y,b?"\\n":"")},a.prototype.makeString=function(a,b,c){if(!a)return b+b;a=a.replace(/\\([\s\S])/g,function(a,c){return c==="\n"||c===b?c:a}),a=a.replace(RegExp(""+b,"g"),"\\$&");return b+this.escapeLines(a,c)+b};return a}(),s=["true","false","null","this","new","delete","typeof","in","instanceof","return","throw","break","continue","debugger","if","else","switch","for","while","do","try","catch","finally","class","extends","super"],g=["undefined","then","unless","until","loop","of","by","when"];for(R in f={and:"&&",or:"||",is:"==",isnt:"!=",not:"!",yes:"true",no:"false",on:"true",off:"false"})g.push(R);H=["case","default","function","var","void","with","const","let","enum","export","import","native","__hasProp","__extends","__slice","__bind","__indexOf"],r=s.concat(H),a.RESERVED=H.concat(s).concat(g),o=/^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/,D=/^0x[\da-f]+|^(?:\d+(\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i,k=/^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/,E=/^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/,N=/^[^\n\S]+/,h=/^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/,e=/^[-=]>/,z=/^(?:\n[^\n\S]*)+/,K=/^'[^\\']*(?:\\.[^\\']*)*'/,q=/^`[^\\`]*(?:\\.[^\\`]*)*`/,F=/^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/,m=/^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/,n=/\s+(?:#.*)?/g,y=/\n/g,l=/\n+([^\n\S]*)/g,b=/^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/,u=/^\s*(?:,|\??\.(?!\.)|::)/,L=/\s+$/,C=/^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/,j=["-=","+=","/=","*=","%=","||=","&&=","?=","<<=",">>=",">>>=","&=","^=","|="],M=["!","~","NEW","TYPEOF","DELETE","DO"],v=["&&","||","&","|","^"],J=["<<",">>",">>>"],i=["==","!=","<",">","<=",">="],x=["*","/","%"],G=["IN","OF","INSTANCEOF"],c=["TRUE","FALSE","NULL","UNDEFINED"],A=["NUMBER","REGEX","BOOL","++","--","]"],B=A.concat(")","}","THIS","IDENTIFIER","STRING"),d=["IDENTIFIER","STRING","REGEX",")","]","}","?","::","@","THIS","SUPER"],p=d.concat("NUMBER","BOOL"),t=["INDENT","OUTDENT","TERMINATOR"]}).call(this)},require["./parser"]=new function(){var a=this,b=function(){var a={trace:function b(){},yy:{},symbols_:{error:2,Root:3,Body:4,Block:5,TERMINATOR:6,Line:7,Expression:8,Statement:9,Return:10,Throw:11,Comment:12,STATEMENT:13,Value:14,Invocation:15,Code:16,Operation:17,Assign:18,If:19,Try:20,While:21,For:22,Switch:23,Class:24,INDENT:25,OUTDENT:26,Identifier:27,IDENTIFIER:28,AlphaNumeric:29,NUMBER:30,STRING:31,Literal:32,JS:33,REGEX:34,BOOL:35,Assignable:36,"=":37,AssignObj:38,ObjAssignable:39,":":40,ThisProperty:41,RETURN:42,HERECOMMENT:43,PARAM_START:44,ParamList:45,PARAM_END:46,FuncGlyph:47,"->":48,"=>":49,OptComma:50,",":51,Param:52,ParamVar:53,"...":54,Array:55,Object:56,Splat:57,SimpleAssignable:58,Accessor:59,Parenthetical:60,Range:61,This:62,".":63,"?.":64,"::":65,Index:66,Slice:67,INDEX_START:68,INDEX_END:69,INDEX_SOAK:70,INDEX_PROTO:71,"{":72,AssignList:73,"}":74,CLASS:75,EXTENDS:76,OptFuncExist:77,Arguments:78,SUPER:79,FUNC_EXIST:80,CALL_START:81,CALL_END:82,ArgList:83,THIS:84,"@":85,"[":86,"]":87,RangeDots:88,"..":89,Arg:90,SimpleArgs:91,TRY:92,Catch:93,FINALLY:94,CATCH:95,THROW:96,"(":97,")":98,WhileSource:99,WHILE:100,WHEN:101,UNTIL:102,Loop:103,LOOP:104,ForBody:105,FOR:106,ForStart:107,ForSource:108,ForVariables:109,OWN:110,ForValue:111,FORIN:112,FOROF:113,BY:114,SWITCH:115,Whens:116,ELSE:117,When:118,LEADING_WHEN:119,IfBlock:120,IF:121,POST_IF:122,UNARY:123,"-":124,"+":125,"--":126,"++":127,"?":128,MATH:129,SHIFT:130,COMPARE:131,LOGIC:132,RELATION:133,COMPOUND_ASSIGN:134,$accept:0,$end:1},terminals_:{2:"error",6:"TERMINATOR",13:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"BOOL",37:"=",40:":",42:"RETURN",43:"HERECOMMENT",44:"PARAM_START",46:"PARAM_END",48:"->",49:"=>",51:",",54:"...",63:".",64:"?.",65:"::",68:"INDEX_START",69:"INDEX_END",70:"INDEX_SOAK",71:"INDEX_PROTO",72:"{",74:"}",75:"CLASS",76:"EXTENDS",79:"SUPER",80:"FUNC_EXIST",81:"CALL_START",82:"CALL_END",84:"THIS",85:"@",86:"[",87:"]",89:"..",92:"TRY",94:"FINALLY",95:"CATCH",96:"THROW",97:"(",98:")",100:"WHILE",101:"WHEN",102:"UNTIL",104:"LOOP",106:"FOR",110:"OWN",112:"FORIN",113:"FOROF",114:"BY",115:"SWITCH",117:"ELSE",119:"LEADING_WHEN",121:"IF",122:"POST_IF",123:"UNARY",124:"-",125:"+",126:"--",127:"++",128:"?",129:"MATH",130:"SHIFT",131:"COMPARE",132:"LOGIC",133:"RELATION",134:"COMPOUND_ASSIGN"},productions_:[0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[18,3],[18,5],[38,1],[38,3],[38,5],[38,1],[39,1],[39,1],[39,1],[10,2],[10,1],[12,1],[16,5],[16,2],[47,1],[47,1],[50,0],[50,1],[45,0],[45,1],[45,3],[52,1],[52,2],[52,3],[53,1],[53,1],[53,1],[53,1],[57,2],[58,1],[58,2],[58,2],[58,1],[36,1],[36,1],[36,1],[14,1],[14,1],[14,1],[14,1],[14,1],[59,2],[59,2],[59,2],[59,1],[59,1],[59,1],[66,3],[66,2],[66,2],[56,4],[73,0],[73,1],[73,3],[73,4],[73,6],[24,1],[24,2],[24,3],[24,4],[24,2],[24,3],[24,4],[24,5],[15,3],[15,3],[15,1],[15,2],[77,0],[77,1],[78,2],[78,4],[62,1],[62,1],[41,2],[55,2],[55,4],[88,1],[88,1],[61,5],[67,5],[67,4],[67,4],[83,1],[83,3],[83,4],[83,4],[83,6],[90,1],[90,1],[91,1],[91,3],[20,2],[20,3],[20,4],[20,5],[93,3],[11,2],[60,3],[60,5],[99,2],[99,4],[99,2],[99,4],[21,2],[21,2],[21,2],[21,1],[103,2],[103,2],[22,2],[22,2],[22,2],[105,2],[105,2],[107,2],[107,3],[111,1],[111,1],[111,1],[109,1],[109,3],[108,2],[108,2],[108,4],[108,4],[108,4],[108,6],[108,6],[23,5],[23,7],[23,4],[23,6],[116,1],[116,2],[118,3],[118,4],[120,3],[120,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],performAction:function c(a,b,c,d,e,f){var g=f.length-1;switch(e){case 1:return this.$=new d.Block;case 2:return this.$=f[g];case 3:return this.$=f[g-1];case 4:this.$=d.Block.wrap([f[g]]);break;case 5:this.$=f[g-2].push(f[g]);break;case 6:this.$=f[g-1];break;case 7:this.$=f[g];break;case 8:this.$=f[g];break;case 9:this.$=f[g];break;case 10:this.$=f[g];break;case 11:this.$=f[g];break;case 12:this.$=new d.Literal(f[g]);break;case 13:this.$=f[g];break;case 14:this.$=f[g];break;case 15:this.$=f[g];break;case 16:this.$=f[g];break;case 17:this.$=f[g];break;case 18:this.$=f[g];break;case 19:this.$=f[g];break;case 20:this.$=f[g];break;case 21:this.$=f[g];break;case 22:this.$=f[g];break;case 23:this.$=f[g];break;case 24:this.$=new d.Block;break;case 25:this.$=f[g-1];break;case 26:this.$=new d.Literal(f[g]);break;case 27:this.$=new d.Literal(f[g]);break;case 28:this.$=new d.Literal(f[g]);break;case 29:this.$=f[g];break;case 30:this.$=new d.Literal(f[g]);break;case 31:this.$=new d.Literal(f[g]);break;case 32:this.$=function(){var a;a=new d.Literal(f[g]),f[g]==="undefined"&&(a.isUndefined=!0);return a}();break;case 33:this.$=new d.Assign(f[g-2],f[g]);break;case 34:this.$=new d.Assign(f[g-4],f[g-1]);break;case 35:this.$=new d.Value(f[g]);break;case 36:this.$=new d.Assign(new d.Value(f[g-2]),f[g],"object");break;case 37:this.$=new d.Assign(new d.Value(f[g-4]),f[g-1],"object");break;case 38:this.$=f[g];break;case 39:this.$=f[g];break;case 40:this.$=f[g];break;case 41:this.$=f[g];break;case 42:this.$=new d.Return(f[g]);break;case 43:this.$=new d.Return;break;case 44:this.$=new d.Comment(f[g]);break;case 45:this.$=new d.Code(f[g-3],f[g],f[g-1]);break;case 46:this.$=new d.Code([],f[g],f[g-1]);break;case 47:this.$="func";break;case 48:this.$="boundfunc";break;case 49:this.$=f[g];break;case 50:this.$=f[g];break;case 51:this.$=[];break;case 52:this.$=[f[g]];break;case 53:this.$=f[g-2].concat(f[g]);break;case 54:this.$=new d.Param(f[g]);break;case 55:this.$=new d.Param(f[g-1],null,!0);break;case 56:this.$=new d.Param(f[g-2],f[g]);break;case 57:this.$=f[g];break;case 58:this.$=f[g];break;case 59:this.$=f[g];break;case 60:this.$=f[g];break;case 61:this.$=new d.Splat(f[g-1]);break;case 62:this.$=new d.Value(f[g]);break;case 63:this.$=f[g-1].push(f[g]);break;case 64:this.$=new d.Value(f[g-1],[f[g]]);break;case 65:this.$=f[g];break;case 66:this.$=f[g];break;case 67:this.$=new d.Value(f[g]);break;case 68:this.$=new d.Value(f[g]);break;case 69:this.$=f[g];break;case 70:this.$=new d.Value(f[g]);break;case 71:this.$=new d.Value(f[g]);break;case 72:this.$=new d.Value(f[g]);break;case 73:this.$=f[g];break;case 74:this.$=new d.Access(f[g]);break;case 75:this.$=new d.Access(f[g],"soak");break;case 76:this.$=new d.Access(f[g],"proto");break;case 77:this.$=new d.Access(new d.Literal("prototype"));break;case 78:this.$=f[g];break;case 79:this.$=new d.Slice(f[g]);break;case 80:this.$=new d.Index(f[g-1]);break;case 81:this.$=d.extend(f[g],{soak:!0});break;case 82:this.$=d.extend(f[g],{proto:!0});break;case 83:this.$=new d.Obj(f[g-2],f[g-3].generated);break;case 84:this.$=[];break;case 85:this.$=[f[g]];break;case 86:this.$=f[g-2].concat(f[g]);break;case 87:this.$=f[g-3].concat(f[g]);break;case 88:this.$=f[g-5].concat(f[g-2]);break;case 89:this.$=new d.Class;break;case 90:this.$=new d.Class(null,null,f[g]);break;case 91:this.$=new d.Class(null,f[g]);break;case 92:this.$=new d.Class(null,f[g-1],f[g]);break;case 93:this.$=new d.Class(f[g]);break;case 94:this.$=new d.Class(f[g-1],null,f[g]);break;case 95:this.$=new d.Class(f[g-2],f[g]);break;case 96:this.$=new d.Class(f[g-3],f[g-1],f[g]);break;case 97:this.$=new d.Call(f[g-2],f[g],f[g-1]);break;case 98:this.$=new d.Call(f[g-2],f[g],f[g-1]);break;case 99:this.$=new d.Call("super",[new d.Splat(new d.Literal("arguments"))]);break;case 100:this.$=new d.Call("super",f[g]);break;case 101:this.$=!1;break;case 102:this.$=!0;break;case 103:this.$=[];break;case 104:this.$=f[g-2];break;case 105:this.$=new d.Value(new d.Literal("this"));break;case 106:this.$=new d.Value(new d.Literal("this"));break;case 107:this.$=new d.Value(new d.Literal("this"),[new d.Access(f[g])],"this");break;case 108:this.$=new d.Arr([]);break;case 109:this.$=new d.Arr(f[g-2]);break;case 110:this.$="inclusive";break;case 111:this.$="exclusive";break;case 112:this.$=new d.Range(f[g-3],f[g-1],f[g-2]);break;case 113:this.$=new d.Range(f[g-3],f[g-1],f[g-2]);break;case 114:this.$=new d.Range(f[g-2],null,f[g-1]);break;case 115:this.$=new d.Range(null,f[g-1],f[g-2]);break;case 116:this.$=[f[g]];break;case 117:this.$=f[g-2].concat(f[g]);break;case 118:this.$=f[g-3].concat(f[g]);break;case 119:this.$=f[g-2];break;case 120:this.$=f[g-5].concat(f[g-2]);break;case 121:this.$=f[g];break;case 122:this.$=f[g];break;case 123:this.$=f[g];break;case 124:this.$=[].concat(f[g-2],f[g]);break;case 125:this.$=new d.Try(f[g]);break;case 126:this.$=new d.Try(f[g-1],f[g][0],f[g][1]);break;case 127:this.$=new d.Try(f[g-2],null,null,f[g]);break;case 128:this.$=new d.Try(f[g-3],f[g-2][0],f[g-2][1],f[g]);break;case 129:this.$=[f[g-1],f[g]];break;case 130:this.$=new d.Throw(f[g]);break;case 131:this.$=new d.Parens(f[g-1]);break;case 132:this.$=new d.Parens(f[g-2]);break;case 133:this.$=new d.While(f[g]);break;case 134:this.$=new d.While(f[g-2],{guard:f[g]});break;case 135:this.$=new d.While(f[g],{invert:!0});break;case 136:this.$=new d.While(f[g-2],{invert:!0,guard:f[g]});break;case 137:this.$=f[g-1].addBody(f[g]);break;case 138:this.$=f[g].addBody(d.Block.wrap([f[g-1]]));break;case 139:this.$=f[g].addBody(d.Block.wrap([f[g-1]]));break;case 140:this.$=f[g];break;case 141:this.$=(new d.While(new d.Literal("true"))).addBody(f[g]);break;case 142:this.$=(new d.While(new d.Literal("true"))).addBody(d.Block.wrap([f[g]]));break;case 143:this.$=new d.For(f[g-1],f[g]);break;case 144:this.$=new d.For(f[g-1],f[g]);break;case 145:this.$=new d.For(f[g],f[g-1]);break;case 146:this.$={source:new d.Value(f[g])};break;case 147:this.$=function(){f[g].own=f[g-1].own,f[g].name=f[g-1][0],f[g].index=f[g-1][1];return f[g]}();break;case 148:this.$=f[g];break;case 149:this.$=function(){f[g].own=!0;return f[g]}();break;case 150:this.$=f[g];break;case 151:this.$=new d.Value(f[g]);break;case 152:this.$=new d.Value(f[g]);break;case 153:this.$=[f[g]];break;case 154:this.$=[f[g-2],f[g]];break;case 155:this.$={source:f[g]};break;case 156:this.$={source:f[g],object:!0};break;case 157:this.$={source:f[g-2],guard:f[g]};break;case 158:this.$={source:f[g-2],guard:f[g],object:!0};break;case 159:this.$={source:f[g-2],step:f[g]};break;case 160:this.$={source:f[g-4],guard:f[g-2],step:f[g]};break;case 161:this.$={source:f[g-4],step:f[g-2],guard:f[g]};break;case 162:this.$=new d.Switch(f[g-3],f[g-1]);break;case 163:this.$=new d.Switch(f[g-5],f[g-3],f[g-1]);break;case 164:this.$=new d.Switch(null,f[g-1]);break;case 165:this.$=new d.Switch(null,f[g-3],f[g-1]);break;case 166:this.$=f[g];break;case 167:this.$=f[g-1].concat(f[g]);break;case 168:this.$=[[f[g-1],f[g]]];break;case 169:this.$=[[f[g-2],f[g-1]]];break;case 170:this.$=new d.If(f[g-1],f[g],{type:f[g-2]});break;case 171:this.$=f[g-4].addElse(new d.If(f[g-1],f[g],{type:f[g-2]}));break;case 172:this.$=f[g];break;case 173:this.$=f[g-2].addElse(f[g]);break;case 174:this.$=new d.If(f[g],d.Block.wrap([f[g-2]]),{type:f[g-1],statement:!0});break;case 175:this.$=new d.If(f[g],d.Block.wrap([f[g-2]]),{type:f[g-1],statement:!0});break;case 176:this.$=new d.Op(f[g-1],f[g]);break;case 177:this.$=new d.Op("-",f[g]);break;case 178:this.$=new d.Op("+",f[g]);break;case 179:this.$=new d.Op("--",f[g]);break;case 180:this.$=new d.Op("++",f[g]);break;case 181:this.$=new d.Op("--",f[g-1],null,!0);break;case 182:this.$=new d.Op("++",f[g-1],null,!0);break;case 183:this.$=new d.Existence(f[g-1]);break;case 184:this.$=new d.Op("+",f[g-2],f[g]);break;case 185:this.$=new d.Op("-",f[g-2],f[g]);break;case 186:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 187:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 188:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 189:this.$=new d.Op(f[g-1],f[g-2],f[g]);break;case 190:this.$=function(){return f[g-1].charAt(0)==="!"?(new d.Op(f[g-1].slice(1),f[g-2],f[g])).invert():new d.Op(f[g-1],f[g-2],f[g])}();break;case 191:this.$=new d.Assign(f[g-2],f[g],f[g-1]);break;case 192:this.$=new d.Assign(f[g-4],f[g-1],f[g-3]);break;case 193:this.$=new d.Extends(f[g-2],f[g])}},table:[{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[3]},{1:[2,2],6:[1,71]},{6:[1,72]},{1:[2,4],6:[2,4],26:[2,4],98:[2,4]},{4:74,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[1,73],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,7],6:[2,7],26:[2,7],98:[2,7],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,8],6:[2,8],26:[2,8],98:[2,8],99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],46:[2,13],51:[2,13],54:[2,13],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,13],70:[1,98],71:[1,99],74:[2,13],77:89,80:[1,91],81:[2,101],82:[2,13],87:[2,13],89:[2,13],98:[2,13],100:[2,13],101:[2,13],102:[2,13],106:[2,13],114:[2,13],122:[2,13],124:[2,13],125:[2,13],128:[2,13],129:[2,13],130:[2,13],131:[2,13],132:[2,13],133:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],46:[2,14],51:[2,14],54:[2,14],59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,14],70:[1,98],71:[1,99],74:[2,14],77:100,80:[1,91],81:[2,101],82:[2,14],87:[2,14],89:[2,14],98:[2,14],100:[2,14],101:[2,14],102:[2,14],106:[2,14],114:[2,14],122:[2,14],124:[2,14],125:[2,14],128:[2,14],129:[2,14],130:[2,14],131:[2,14],132:[2,14],133:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],46:[2,15],51:[2,15],54:[2,15],69:[2,15],74:[2,15],82:[2,15],87:[2,15],89:[2,15],98:[2,15],100:[2,15],101:[2,15],102:[2,15],106:[2,15],114:[2,15],122:[2,15],124:[2,15],125:[2,15],128:[2,15],129:[2,15],130:[2,15],131:[2,15],132:[2,15],133:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],46:[2,16],51:[2,16],54:[2,16],69:[2,16],74:[2,16],82:[2,16],87:[2,16],89:[2,16],98:[2,16],100:[2,16],101:[2,16],102:[2,16],106:[2,16],114:[2,16],122:[2,16],124:[2,16],125:[2,16],128:[2,16],129:[2,16],130:[2,16],131:[2,16],132:[2,16],133:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],46:[2,17],51:[2,17],54:[2,17],69:[2,17],74:[2,17],82:[2,17],87:[2,17],89:[2,17],98:[2,17],100:[2,17],101:[2,17],102:[2,17],106:[2,17],114:[2,17],122:[2,17],124:[2,17],125:[2,17],128:[2,17],129:[2,17],130:[2,17],131:[2,17],132:[2,17],133:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],46:[2,18],51:[2,18],54:[2,18],69:[2,18],74:[2,18],82:[2,18],87:[2,18],89:[2,18],98:[2,18],100:[2,18],101:[2,18],102:[2,18],106:[2,18],114:[2,18],122:[2,18],124:[2,18],125:[2,18],128:[2,18],129:[2,18],130:[2,18],131:[2,18],132:[2,18],133:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],46:[2,19],51:[2,19],54:[2,19],69:[2,19],74:[2,19],82:[2,19],87:[2,19],89:[2,19],98:[2,19],100:[2,19],101:[2,19],102:[2,19],106:[2,19],114:[2,19],122:[2,19],124:[2,19],125:[2,19],128:[2,19],129:[2,19],130:[2,19],131:[2,19],132:[2,19],133:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],46:[2,20],51:[2,20],54:[2,20],69:[2,20],74:[2,20],82:[2,20],87:[2,20],89:[2,20],98:[2,20],100:[2,20],101:[2,20],102:[2,20],106:[2,20],114:[2,20],122:[2,20],124:[2,20],125:[2,20],128:[2,20],129:[2,20],130:[2,20],131:[2,20],132:[2,20],133:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],46:[2,21],51:[2,21],54:[2,21],69:[2,21],74:[2,21],82:[2,21],87:[2,21],89:[2,21],98:[2,21],100:[2,21],101:[2,21],102:[2,21],106:[2,21],114:[2,21],122:[2,21],124:[2,21],125:[2,21],128:[2,21],129:[2,21],130:[2,21],131:[2,21],132:[2,21],133:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],46:[2,22],51:[2,22],54:[2,22],69:[2,22],74:[2,22],82:[2,22],87:[2,22],89:[2,22],98:[2,22],100:[2,22],101:[2,22],102:[2,22],106:[2,22],114:[2,22],122:[2,22],124:[2,22],125:[2,22],128:[2,22],129:[2,22],130:[2,22],131:[2,22],132:[2,22],133:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],46:[2,23],51:[2,23],54:[2,23],69:[2,23],74:[2,23],82:[2,23],87:[2,23],89:[2,23],98:[2,23],100:[2,23],101:[2,23],102:[2,23],106:[2,23],114:[2,23],122:[2,23],124:[2,23],125:[2,23],128:[2,23],129:[2,23],130:[2,23],131:[2,23],132:[2,23],133:[2,23]},{1:[2,9],6:[2,9],26:[2,9],98:[2,9],100:[2,9],102:[2,9],106:[2,9],122:[2,9]},{1:[2,10],6:[2,10],26:[2,10],98:[2,10],100:[2,10],102:[2,10],106:[2,10],122:[2,10]},{1:[2,11],6:[2,11],26:[2,11],98:[2,11],100:[2,11],102:[2,11],106:[2,11],122:[2,11]},{1:[2,12],6:[2,12],26:[2,12],98:[2,12],100:[2,12],102:[2,12],106:[2,12],122:[2,12]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],37:[1,102],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],46:[2,70],51:[2,70],54:[2,70],63:[2,70],64:[2,70],65:[2,70],68:[2,70],69:[2,70],70:[2,70],71:[2,70],74:[2,70],80:[2,70],81:[2,70],82:[2,70],87:[2,70],89:[2,70],98:[2,70],100:[2,70],101:[2,70],102:[2,70],106:[2,70],114:[2,70],122:[2,70],124:[2,70],125:[2,70],128:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],46:[2,71],51:[2,71],54:[2,71],63:[2,71],64:[2,71],65:[2,71],68:[2,71],69:[2,71],70:[2,71],71:[2,71],74:[2,71],80:[2,71],81:[2,71],82:[2,71],87:[2,71],89:[2,71],98:[2,71],100:[2,71],101:[2,71],102:[2,71],106:[2,71],114:[2,71],122:[2,71],124:[2,71],125:[2,71],128:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],46:[2,72],51:[2,72],54:[2,72],63:[2,72],64:[2,72],65:[2,72],68:[2,72],69:[2,72],70:[2,72],71:[2,72],74:[2,72],80:[2,72],81:[2,72],82:[2,72],87:[2,72],89:[2,72],98:[2,72],100:[2,72],101:[2,72],102:[2,72],106:[2,72],114:[2,72],122:[2,72],124:[2,72],125:[2,72],128:[2,72],129:[2,72],130:[2,72],131:[2,72],132:[2,72],133:[2,72]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],46:[2,73],51:[2,73],54:[2,73],63:[2,73],64:[2,73],65:[2,73],68:[2,73],69:[2,73],70:[2,73],71:[2,73],74:[2,73],80:[2,73],81:[2,73],82:[2,73],87:[2,73],89:[2,73],98:[2,73],100:[2,73],101:[2,73],102:[2,73],106:[2,73],114:[2,73],122:[2,73],124:[2,73],125:[2,73],128:[2,73],129:[2,73],130:[2,73],131:[2,73],132:[2,73],133:[2,73]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],46:[2,99],51:[2,99],54:[2,99],63:[2,99],64:[2,99],65:[2,99],68:[2,99],69:[2,99],70:[2,99],71:[2,99],74:[2,99],78:103,80:[2,99],81:[1,104],82:[2,99],87:[2,99],89:[2,99],98:[2,99],100:[2,99],101:[2,99],102:[2,99],106:[2,99],114:[2,99],122:[2,99],124:[2,99],125:[2,99],128:[2,99],129:[2,99],130:[2,99],131:[2,99],132:[2,99],133:[2,99]},{27:108,28:[1,70],41:109,45:105,46:[2,51],51:[2,51],52:106,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{5:114,25:[1,5]},{8:115,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:117,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:118,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:119,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:123,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],37:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],76:[1,127],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],126:[1,124],127:[1,125],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[1,126]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],46:[2,172],51:[2,172],54:[2,172],69:[2,172],74:[2,172],82:[2,172],87:[2,172],89:[2,172],98:[2,172],100:[2,172],101:[2,172],102:[2,172],106:[2,172],114:[2,172],117:[1,128],122:[2,172],124:[2,172],125:[2,172],128:[2,172],129:[2,172],130:[2,172],131:[2,172],132:[2,172],133:[2,172]},{5:129,25:[1,5]},{5:130,25:[1,5]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],46:[2,140],51:[2,140],54:[2,140],69:[2,140],74:[2,140],82:[2,140],87:[2,140],89:[2,140],98:[2,140],100:[2,140],101:[2,140],102:[2,140],106:[2,140],114:[2,140],122:[2,140],124:[2,140],125:[2,140],128:[2,140],129:[2,140],130:[2,140],131:[2,140],132:[2,140],133:[2,140]},{5:131,25:[1,5]},{8:132,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,133],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,89],5:134,6:[2,89],14:120,15:121,25:[1,5],26:[2,89],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,46:[2,89],51:[2,89],54:[2,89],55:47,56:48,58:136,60:25,61:26,62:27,69:[2,89],72:[1,67],74:[2,89],76:[1,135],79:[1,28],82:[2,89],84:[1,55],85:[1,56],86:[1,54],87:[2,89],89:[2,89],97:[1,53],98:[2,89],100:[2,89],101:[2,89],102:[2,89],106:[2,89],114:[2,89],122:[2,89],124:[2,89],125:[2,89],128:[2,89],129:[2,89],130:[2,89],131:[2,89],132:[2,89],133:[2,89]},{1:[2,43],6:[2,43],8:137,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,43],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,43],99:39,100:[2,43],102:[2,43],103:40,104:[1,64],105:41,106:[2,43],107:66,115:[1,42],120:37,121:[1,61],122:[2,43],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:138,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,44],6:[2,44],25:[2,44],26:[2,44],51:[2,44],74:[2,44],98:[2,44],100:[2,44],102:[2,44],106:[2,44],122:[2,44]},{1:[2,67],6:[2,67],25:[2,67],26:[2,67],37:[2,67],46:[2,67],51:[2,67],54:[2,67],63:[2,67],64:[2,67],65:[2,67],68:[2,67],69:[2,67],70:[2,67],71:[2,67],74:[2,67],80:[2,67],81:[2,67],82:[2,67],87:[2,67],89:[2,67],98:[2,67],100:[2,67],101:[2,67],102:[2,67],106:[2,67],114:[2,67],122:[2,67],124:[2,67],125:[2,67],128:[2,67],129:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],37:[2,68],46:[2,68],51:[2,68],54:[2,68],63:[2,68],64:[2,68],65:[2,68],68:[2,68],69:[2,68],70:[2,68],71:[2,68],74:[2,68],80:[2,68],81:[2,68],82:[2,68],87:[2,68],89:[2,68],98:[2,68],100:[2,68],101:[2,68],102:[2,68],106:[2,68],114:[2,68],122:[2,68],124:[2,68],125:[2,68],128:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],46:[2,29],51:[2,29],54:[2,29],63:[2,29],64:[2,29],65:[2,29],68:[2,29],69:[2,29],70:[2,29],71:[2,29],74:[2,29],80:[2,29],81:[2,29],82:[2,29],87:[2,29],89:[2,29],98:[2,29],100:[2,29],101:[2,29],102:[2,29],106:[2,29],114:[2,29],122:[2,29],124:[2,29],125:[2,29],128:[2,29],129:[2,29],130:[2,29],131:[2,29],132:[2,29],133:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],46:[2,30],51:[2,30],54:[2,30],63:[2,30],64:[2,30],65:[2,30],68:[2,30],69:[2,30],70:[2,30],71:[2,30],74:[2,30],80:[2,30],81:[2,30],82:[2,30],87:[2,30],89:[2,30],98:[2,30],100:[2,30],101:[2,30],102:[2,30],106:[2,30],114:[2,30],122:[2,30],124:[2,30],125:[2,30],128:[2,30],129:[2,30],130:[2,30],131:[2,30],132:[2,30],133:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],46:[2,31],51:[2,31],54:[2,31],63:[2,31],64:[2,31],65:[2,31],68:[2,31],69:[2,31],70:[2,31],71:[2,31],74:[2,31],80:[2,31],81:[2,31],82:[2,31],87:[2,31],89:[2,31],98:[2,31],100:[2,31],101:[2,31],102:[2,31],106:[2,31],114:[2,31],122:[2,31],124:[2,31],125:[2,31],128:[2,31],129:[2,31],130:[2,31],131:[2,31],132:[2,31],133:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],46:[2,32],51:[2,32],54:[2,32],63:[2,32],64:[2,32],65:[2,32],68:[2,32],69:[2,32],70:[2,32],71:[2,32],74:[2,32],80:[2,32],81:[2,32],82:[2,32],87:[2,32],89:[2,32],98:[2,32],100:[2,32],101:[2,32],102:[2,32],106:[2,32],114:[2,32],122:[2,32],124:[2,32],125:[2,32],128:[2,32],129:[2,32],130:[2,32],131:[2,32],132:[2,32],133:[2,32]},{4:139,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,140],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:141,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],46:[2,105],51:[2,105],54:[2,105],63:[2,105],64:[2,105],65:[2,105],68:[2,105],69:[2,105],70:[2,105],71:[2,105],74:[2,105],80:[2,105],81:[2,105],82:[2,105],87:[2,105],89:[2,105],98:[2,105],100:[2,105],101:[2,105],102:[2,105],106:[2,105],114:[2,105],122:[2,105],124:[2,105],125:[2,105],128:[2,105],129:[2,105],130:[2,105],131:[2,105],132:[2,105],133:[2,105]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],27:147,28:[1,70],46:[2,106],51:[2,106],54:[2,106],63:[2,106],64:[2,106],65:[2,106],68:[2,106],69:[2,106],70:[2,106],71:[2,106],74:[2,106],80:[2,106],81:[2,106],82:[2,106],87:[2,106],89:[2,106],98:[2,106],100:[2,106],101:[2,106],102:[2,106],106:[2,106],114:[2,106],122:[2,106],124:[2,106],125:[2,106],128:[2,106],129:[2,106],130:[2,106],131:[2,106],132:[2,106],133:[2,106]},{25:[2,47]},{25:[2,48]},{1:[2,62],6:[2,62],25:[2,62],26:[2,62],37:[2,62],46:[2,62],51:[2,62],54:[2,62],63:[2,62],64:[2,62],65:[2,62],68:[2,62],69:[2,62],70:[2,62],71:[2,62],74:[2,62],76:[2,62],80:[2,62],81:[2,62],82:[2,62],87:[2,62],89:[2,62],98:[2,62],100:[2,62],101:[2,62],102:[2,62],106:[2,62],114:[2,62],122:[2,62],124:[2,62],125:[2,62],126:[2,62],127:[2,62],128:[2,62],129:[2,62],130:[2,62],131:[2,62],132:[2,62],133:[2,62],134:[2,62]},{1:[2,65],6:[2,65],25:[2,65],26:[2,65],37:[2,65],46:[2,65],51:[2,65],54:[2,65],63:[2,65],64:[2,65],65:[2,65],68:[2,65],69:[2,65],70:[2,65],71:[2,65],74:[2,65],76:[2,65],80:[2,65],81:[2,65],82:[2,65],87:[2,65],89:[2,65],98:[2,65],100:[2,65],101:[2,65],102:[2,65],106:[2,65],114:[2,65],122:[2,65],124:[2,65],125:[2,65],126:[2,65],127:[2,65],128:[2,65],129:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65]},{8:148,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:149,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:150,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:151,8:152,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{27:157,28:[1,70],55:158,56:159,61:153,72:[1,67],86:[1,54],109:154,110:[1,155],111:156},{108:160,112:[1,161],113:[1,162]},{6:[2,84],12:166,25:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:163,74:[2,84],85:[1,112]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],40:[2,27],46:[2,27],51:[2,27],54:[2,27],63:[2,27],64:[2,27],65:[2,27],68:[2,27],69:[2,27],70:[2,27],71:[2,27],74:[2,27],80:[2,27],81:[2,27],82:[2,27],87:[2,27],89:[2,27],98:[2,27],100:[2,27],101:[2,27],102:[2,27],106:[2,27],114:[2,27],122:[2,27],124:[2,27],125:[2,27],128:[2,27],129:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],40:[2,28],46:[2,28],51:[2,28],54:[2,28],63:[2,28],64:[2,28],65:[2,28],68:[2,28],69:[2,28],70:[2,28],71:[2,28],74:[2,28],80:[2,28],81:[2,28],82:[2,28],87:[2,28],89:[2,28],98:[2,28],100:[2,28],101:[2,28],102:[2,28],106:[2,28],114:[2,28],122:[2,28],124:[2,28],125:[2,28],128:[2,28],129:[2,28],130:[2,28],131:[2,28],132:[2,28],133:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],37:[2,26],40:[2,26],46:[2,26],51:[2,26],54:[2,26],63:[2,26],64:[2,26],65:[2,26],68:[2,26],69:[2,26],70:[2,26],71:[2,26],74:[2,26],76:[2,26],80:[2,26],81:[2,26],82:[2,26],87:[2,26],89:[2,26],98:[2,26],100:[2,26],101:[2,26],102:[2,26],106:[2,26],112:[2,26],113:[2,26],114:[2,26],122:[2,26],124:[2,26],125:[2,26],126:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26]},{1:[2,6],6:[2,6],7:170,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,6],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,6],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],46:[2,24],51:[2,24],54:[2,24],69:[2,24],74:[2,24],82:[2,24],87:[2,24],89:[2,24],94:[2,24],95:[2,24],98:[2,24],100:[2,24],101:[2,24],102:[2,24],106:[2,24],114:[2,24],117:[2,24],119:[2,24],122:[2,24],124:[2,24],125:[2,24],128:[2,24],129:[2,24],130:[2,24],131:[2,24],132:[2,24],133:[2,24]},{6:[1,71],26:[1,171]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],46:[2,183],51:[2,183],54:[2,183],69:[2,183],74:[2,183],82:[2,183],87:[2,183],89:[2,183],98:[2,183],100:[2,183],101:[2,183],102:[2,183],106:[2,183],114:[2,183],122:[2,183],124:[2,183],125:[2,183],128:[2,183],129:[2,183],130:[2,183],131:[2,183],132:[2,183],133:[2,183]},{8:172,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:173,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:174,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:175,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:176,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:177,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:178,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:179,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],46:[2,139],51:[2,139],54:[2,139],69:[2,139],74:[2,139],82:[2,139],87:[2,139],89:[2,139],98:[2,139],100:[2,139],101:[2,139],102:[2,139],106:[2,139],114:[2,139],122:[2,139],124:[2,139],125:[2,139],128:[2,139],129:[2,139],130:[2,139],131:[2,139],132:[2,139],133:[2,139]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],46:[2,144],51:[2,144],54:[2,144],69:[2,144],74:[2,144],82:[2,144],87:[2,144],89:[2,144],98:[2,144],100:[2,144],101:[2,144],102:[2,144],106:[2,144],114:[2,144],122:[2,144],124:[2,144],125:[2,144],128:[2,144],129:[2,144],130:[2,144],131:[2,144],132:[2,144],133:[2,144]},{8:180,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],46:[2,138],51:[2,138],54:[2,138],69:[2,138],74:[2,138],82:[2,138],87:[2,138],89:[2,138],98:[2,138],100:[2,138],101:[2,138],102:[2,138],106:[2,138],114:[2,138],122:[2,138],124:[2,138],125:[2,138],128:[2,138],129:[2,138],130:[2,138],131:[2,138],132:[2,138],133:[2,138]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],46:[2,143],51:[2,143],54:[2,143],69:[2,143],74:[2,143],82:[2,143],87:[2,143],89:[2,143],98:[2,143],100:[2,143],101:[2,143],102:[2,143],106:[2,143],114:[2,143],122:[2,143],124:[2,143],125:[2,143],128:[2,143],129:[2,143],130:[2,143],131:[2,143],132:[2,143],133:[2,143]},{78:181,81:[1,104]},{1:[2,63],6:[2,63],25:[2,63],26:[2,63],37:[2,63],46:[2,63],51:[2,63],54:[2,63],63:[2,63],64:[2,63],65:[2,63],68:[2,63],69:[2,63],70:[2,63],71:[2,63],74:[2,63],76:[2,63],80:[2,63],81:[2,63],82:[2,63],87:[2,63],89:[2,63],98:[2,63],100:[2,63],101:[2,63],102:[2,63],106:[2,63],114:[2,63],122:[2,63],124:[2,63],125:[2,63],126:[2,63],127:[2,63],128:[2,63],129:[2,63],130:[2,63],131:[2,63],132:[2,63],133:[2,63],134:[2,63]},{81:[2,102]},{27:182,28:[1,70]},{27:183,28:[1,70]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],27:184,28:[1,70],37:[2,77],46:[2,77],51:[2,77],54:[2,77],63:[2,77],64:[2,77],65:[2,77],68:[2,77],69:[2,77],70:[2,77],71:[2,77],74:[2,77],76:[2,77],80:[2,77],81:[2,77],82:[2,77],87:[2,77],89:[2,77],98:[2,77],100:[2,77],101:[2,77],102:[2,77],106:[2,77],114:[2,77],122:[2,77],124:[2,77],125:[2,77],126:[2,77],127:[2,77],128:[2,77],129:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],37:[2,78],46:[2,78],51:[2,78],54:[2,78],63:[2,78],64:[2,78],65:[2,78],68:[2,78],69:[2,78],70:[2,78],71:[2,78],74:[2,78],76:[2,78],80:[2,78],81:[2,78],82:[2,78],87:[2,78],89:[2,78],98:[2,78],100:[2,78],101:[2,78],102:[2,78],106:[2,78],114:[2,78],122:[2,78],124:[2,78],125:[2,78],126:[2,78],127:[2,78],128:[2,78],129:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],37:[2,79],46:[2,79],51:[2,79],54:[2,79],63:[2,79],64:[2,79],65:[2,79],68:[2,79],69:[2,79],70:[2,79],71:[2,79],74:[2,79],76:[2,79],80:[2,79],81:[2,79],82:[2,79],87:[2,79],89:[2,79],98:[2,79],100:[2,79],101:[2,79],102:[2,79],106:[2,79],114:[2,79],122:[2,79],124:[2,79],125:[2,79],126:[2,79],127:[2,79],128:[2,79],129:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79]},{8:185,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],54:[1,188],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],88:186,89:[1,187],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{66:189,68:[1,190],70:[1,98],71:[1,99]},{66:191,68:[1,190],70:[1,98],71:[1,99]},{78:192,81:[1,104]},{1:[2,64],6:[2,64],25:[2,64],26:[2,64],37:[2,64],46:[2,64],51:[2,64],54:[2,64],63:[2,64],64:[2,64],65:[2,64],68:[2,64],69:[2,64],70:[2,64],71:[2,64],74:[2,64],76:[2,64],80:[2,64],81:[2,64],82:[2,64],87:[2,64],89:[2,64],98:[2,64],100:[2,64],101:[2,64],102:[2,64],106:[2,64],114:[2,64],122:[2,64],124:[2,64],125:[2,64],126:[2,64],127:[2,64],128:[2,64],129:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64]},{8:193,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,194],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],46:[2,100],51:[2,100],54:[2,100],63:[2,100],64:[2,100],65:[2,100],68:[2,100],69:[2,100],70:[2,100],71:[2,100],74:[2,100],80:[2,100],81:[2,100],82:[2,100],87:[2,100],89:[2,100],98:[2,100],100:[2,100],101:[2,100],102:[2,100],106:[2,100],114:[2,100],122:[2,100],124:[2,100],125:[2,100],128:[2,100],129:[2,100],130:[2,100],131:[2,100],132:[2,100],133:[2,100]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[1,195],83:196,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{46:[1,198],51:[1,199]},{46:[2,52],51:[2,52]},{37:[1,201],46:[2,54],51:[2,54],54:[1,200]},{37:[2,57],46:[2,57],51:[2,57],54:[2,57]},{37:[2,58],46:[2,58],51:[2,58],54:[2,58]},{37:[2,59],46:[2,59],51:[2,59],54:[2,59]},{37:[2,60],46:[2,60],51:[2,60],54:[2,60]},{27:147,28:[1,70]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,46],6:[2,46],25:[2,46],26:[2,46],46:[2,46],51:[2,46],54:[2,46],69:[2,46],74:[2,46],82:[2,46],87:[2,46],89:[2,46],98:[2,46],100:[2,46],101:[2,46],102:[2,46],106:[2,46],114:[2,46],122:[2,46],124:[2,46],125:[2,46],128:[2,46],129:[2,46],130:[2,46],131:[2,46],132:[2,46],133:[2,46]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],46:[2,176],51:[2,176],54:[2,176],69:[2,176],74:[2,176],82:[2,176],87:[2,176],89:[2,176],98:[2,176],99:84,100:[2,176],101:[2,176],102:[2,176],105:85,106:[2,176],107:66,114:[2,176],122:[2,176],124:[2,176],125:[2,176],128:[1,75],129:[2,176],130:[2,176],131:[2,176],132:[2,176],133:[2,176]},{99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],46:[2,177],51:[2,177],54:[2,177],69:[2,177],74:[2,177],82:[2,177],87:[2,177],89:[2,177],98:[2,177],99:84,100:[2,177],101:[2,177],102:[2,177],105:85,106:[2,177],107:66,114:[2,177],122:[2,177],124:[2,177],125:[2,177],128:[1,75],129:[2,177],130:[2,177],131:[2,177],132:[2,177],133:[2,177]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],46:[2,178],51:[2,178],54:[2,178],69:[2,178],74:[2,178],82:[2,178],87:[2,178],89:[2,178],98:[2,178],99:84,100:[2,178],101:[2,178],102:[2,178],105:85,106:[2,178],107:66,114:[2,178],122:[2,178],124:[2,178],125:[2,178],128:[1,75],129:[2,178],130:[2,178],131:[2,178],132:[2,178],133:[2,178]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],46:[2,179],51:[2,179],54:[2,179],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,179],70:[2,66],71:[2,66],74:[2,179],80:[2,66],81:[2,66],82:[2,179],87:[2,179],89:[2,179],98:[2,179],100:[2,179],101:[2,179],102:[2,179],106:[2,179],114:[2,179],122:[2,179],124:[2,179],125:[2,179],128:[2,179],129:[2,179],130:[2,179],131:[2,179],132:[2,179],133:[2,179]},{59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:89,80:[1,91],81:[2,101]},{59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:100,80:[1,91],81:[2,101]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],46:[2,180],51:[2,180],54:[2,180],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,180],70:[2,66],71:[2,66],74:[2,180],80:[2,66],81:[2,66],82:[2,180],87:[2,180],89:[2,180],98:[2,180],100:[2,180],101:[2,180],102:[2,180],106:[2,180],114:[2,180],122:[2,180],124:[2,180],125:[2,180],128:[2,180],129:[2,180],130:[2,180],131:[2,180],132:[2,180],133:[2,180]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],46:[2,181],51:[2,181],54:[2,181],69:[2,181],74:[2,181],82:[2,181],87:[2,181],89:[2,181],98:[2,181],100:[2,181],101:[2,181],102:[2,181],106:[2,181],114:[2,181],122:[2,181],124:[2,181],125:[2,181],128:[2,181],129:[2,181],130:[2,181],131:[2,181],132:[2,181],133:[2,181]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],46:[2,182],51:[2,182],54:[2,182],69:[2,182],74:[2,182],82:[2,182],87:[2,182],89:[2,182],98:[2,182],100:[2,182],101:[2,182],102:[2,182],106:[2,182],114:[2,182],122:[2,182],124:[2,182],125:[2,182],128:[2,182],129:[2,182],130:[2,182],131:[2,182],132:[2,182],133:[2,182]},{8:202,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,203],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:204,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:205,25:[1,5],121:[1,206]},{1:[2,125],6:[2,125],25:[2,125],26:[2,125],46:[2,125],51:[2,125],54:[2,125],69:[2,125],74:[2,125],82:[2,125],87:[2,125],89:[2,125],93:207,94:[1,208],95:[1,209],98:[2,125],100:[2,125],101:[2,125],102:[2,125],106:[2,125],114:[2,125],122:[2,125],124:[2,125],125:[2,125],128:[2,125],129:[2,125],130:[2,125],131:[2,125],132:[2,125],133:[2,125]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],46:[2,137],51:[2,137],54:[2,137],69:[2,137],74:[2,137],82:[2,137],87:[2,137],89:[2,137],98:[2,137],100:[2,137],101:[2,137],102:[2,137],106:[2,137],114:[2,137],122:[2,137],124:[2,137],125:[2,137],128:[2,137],129:[2,137],130:[2,137],131:[2,137],132:[2,137],133:[2,137]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],46:[2,145],51:[2,145],54:[2,145],69:[2,145],74:[2,145],82:[2,145],87:[2,145],89:[2,145],98:[2,145],100:[2,145],101:[2,145],102:[2,145],106:[2,145],114:[2,145],122:[2,145],124:[2,145],125:[2,145],128:[2,145],129:[2,145],130:[2,145],131:[2,145],132:[2,145],133:[2,145]},{25:[1,210],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{116:211,118:212,119:[1,213]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],46:[2,90],51:[2,90],54:[2,90],69:[2,90],74:[2,90],82:[2,90],87:[2,90],89:[2,90],98:[2,90],100:[2,90],101:[2,90],102:[2,90],106:[2,90],114:[2,90],122:[2,90],124:[2,90],125:[2,90],128:[2,90],129:[2,90],130:[2,90],131:[2,90],132:[2,90],133:[2,90]},{14:214,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,93],5:216,6:[2,93],25:[1,5],26:[2,93],46:[2,93],51:[2,93],54:[2,93],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,93],70:[2,66],71:[2,66],74:[2,93],76:[1,217],80:[2,66],81:[2,66],82:[2,93],87:[2,93],89:[2,93],98:[2,93],100:[2,93],101:[2,93],102:[2,93],106:[2,93],114:[2,93],122:[2,93],124:[2,93],125:[2,93],128:[2,93],129:[2,93],130:[2,93],131:[2,93],132:[2,93],133:[2,93]},{1:[2,42],6:[2,42],26:[2,42],98:[2,42],99:84,100:[2,42],102:[2,42],105:85,106:[2,42],107:66,122:[2,42],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,130],6:[2,130],26:[2,130],98:[2,130],99:84,100:[2,130],102:[2,130],105:85,106:[2,130],107:66,122:[2,130],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,71],98:[1,218]},{4:219,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,121],25:[2,121],51:[2,121],54:[1,221],87:[2,121],88:220,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,108],6:[2,108],25:[2,108],26:[2,108],37:[2,108],46:[2,108],51:[2,108],54:[2,108],63:[2,108],64:[2,108],65:[2,108],68:[2,108],69:[2,108],70:[2,108],71:[2,108],74:[2,108],80:[2,108],81:[2,108],82:[2,108],87:[2,108],89:[2,108],98:[2,108],100:[2,108],101:[2,108],102:[2,108],106:[2,108],112:[2,108],113:[2,108],114:[2,108],122:[2,108],124:[2,108],125:[2,108],128:[2,108],129:[2,108],130:[2,108],131:[2,108],132:[2,108],133:[2,108]},{6:[2,49],25:[2,49],50:222,51:[1,223],87:[2,49]},{6:[2,116],25:[2,116],26:[2,116],51:[2,116],82:[2,116],87:[2,116]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:224,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,122],25:[2,122],26:[2,122],51:[2,122],82:[2,122],87:[2,122]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],37:[2,107],40:[2,107],46:[2,107],51:[2,107],54:[2,107],63:[2,107],64:[2,107],65:[2,107],68:[2,107],69:[2,107],70:[2,107],71:[2,107],74:[2,107],76:[2,107],80:[2,107],81:[2,107],82:[2,107],87:[2,107],89:[2,107],98:[2,107],100:[2,107],101:[2,107],102:[2,107],106:[2,107],114:[2,107],122:[2,107],124:[2,107],125:[2,107],126:[2,107],127:[2,107],128:[2,107],129:[2,107],130:[2,107],131:[2,107],132:[2,107],133:[2,107],134:[2,107]},{5:225,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],46:[2,133],51:[2,133],54:[2,133],69:[2,133],74:[2,133],82:[2,133],87:[2,133],89:[2,133],98:[2,133],99:84,100:[1,62],101:[1,226],102:[1,63],105:85,106:[1,65],107:66,114:[2,133],122:[2,133],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],46:[2,135],51:[2,135],54:[2,135],69:[2,135],74:[2,135],82:[2,135],87:[2,135],89:[2,135],98:[2,135],99:84,100:[1,62],101:[1,227],102:[1,63],105:85,106:[1,65],107:66,114:[2,135],122:[2,135],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],46:[2,141],51:[2,141],54:[2,141],69:[2,141],74:[2,141],82:[2,141],87:[2,141],89:[2,141],98:[2,141],100:[2,141],101:[2,141],102:[2,141],106:[2,141],114:[2,141],122:[2,141],124:[2,141],125:[2,141],128:[2,141],129:[2,141],130:[2,141],131:[2,141],132:[2,141],133:[2,141]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],46:[2,142],51:[2,142],54:[2,142],69:[2,142],74:[2,142],82:[2,142],87:[2,142],89:[2,142],98:[2,142],99:84,100:[1,62],101:[2,142],102:[1,63],105:85,106:[1,65],107:66,114:[2,142],122:[2,142],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],46:[2,146],51:[2,146],54:[2,146],69:[2,146],74:[2,146],82:[2,146],87:[2,146],89:[2,146],98:[2,146],100:[2,146],101:[2,146],102:[2,146],106:[2,146],114:[2,146],122:[2,146],124:[2,146],125:[2,146],128:[2,146],129:[2,146],130:[2,146],131:[2,146],132:[2,146],133:[2,146]},{112:[2,148],113:[2,148]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],109:228,111:156},{51:[1,229],112:[2,153],113:[2,153]},{51:[2,150],112:[2,150],113:[2,150]},{51:[2,151],112:[2,151],113:[2,151]},{51:[2,152],112:[2,152],113:[2,152]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],46:[2,147],51:[2,147],54:[2,147],69:[2,147],74:[2,147],82:[2,147],87:[2,147],89:[2,147],98:[2,147],100:[2,147],101:[2,147],102:[2,147],106:[2,147],114:[2,147],122:[2,147],124:[2,147],125:[2,147],128:[2,147],129:[2,147],130:[2,147],131:[2,147],132:[2,147],133:[2,147]},{8:230,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:231,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],50:232,51:[1,233],74:[2,49]},{6:[2,85],25:[2,85],26:[2,85],51:[2,85],74:[2,85]},{6:[2,35],25:[2,35],26:[2,35],40:[1,234],51:[2,35],74:[2,35]},{6:[2,38],25:[2,38],26:[2,38],51:[2,38],74:[2,38]},{6:[2,39],25:[2,39],26:[2,39],40:[2,39],51:[2,39],74:[2,39]},{6:[2,40],25:[2,40],26:[2,40],40:[2,40],51:[2,40],74:[2,40]},{6:[2,41],25:[2,41],26:[2,41],40:[2,41],51:[2,41],74:[2,41]},{1:[2,5],6:[2,5],26:[2,5],98:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],46:[2,25],51:[2,25],54:[2,25],69:[2,25],74:[2,25],82:[2,25],87:[2,25],89:[2,25],94:[2,25],95:[2,25],98:[2,25],100:[2,25],101:[2,25],102:[2,25],106:[2,25],114:[2,25],117:[2,25],119:[2,25],122:[2,25],124:[2,25],125:[2,25],128:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],46:[2,184],51:[2,184],54:[2,184],69:[2,184],74:[2,184],82:[2,184],87:[2,184],89:[2,184],98:[2,184],99:84,100:[2,184],101:[2,184],102:[2,184],105:85,106:[2,184],107:66,114:[2,184],122:[2,184],124:[2,184],125:[2,184],128:[1,75],129:[1,78],130:[2,184],131:[2,184],132:[2,184],133:[2,184]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],46:[2,185],51:[2,185],54:[2,185],69:[2,185],74:[2,185],82:[2,185],87:[2,185],89:[2,185],98:[2,185],99:84,100:[2,185],101:[2,185],102:[2,185],105:85,106:[2,185],107:66,114:[2,185],122:[2,185],124:[2,185],125:[2,185],128:[1,75],129:[1,78],130:[2,185],131:[2,185],132:[2,185],133:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],46:[2,186],51:[2,186],54:[2,186],69:[2,186],74:[2,186],82:[2,186],87:[2,186],89:[2,186],98:[2,186],99:84,100:[2,186],101:[2,186],102:[2,186],105:85,106:[2,186],107:66,114:[2,186],122:[2,186],124:[2,186],125:[2,186],128:[1,75],129:[2,186],130:[2,186],131:[2,186],132:[2,186],133:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],46:[2,187],51:[2,187],54:[2,187],69:[2,187],74:[2,187],82:[2,187],87:[2,187],89:[2,187],98:[2,187],99:84,100:[2,187],101:[2,187],102:[2,187],105:85,106:[2,187],107:66,114:[2,187],122:[2,187],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[2,187],131:[2,187],132:[2,187],133:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],46:[2,188],51:[2,188],54:[2,188],69:[2,188],74:[2,188],82:[2,188],87:[2,188],89:[2,188],98:[2,188],99:84,100:[2,188],101:[2,188],102:[2,188],105:85,106:[2,188],107:66,114:[2,188],122:[2,188],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,188],132:[2,188],133:[1,82]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],46:[2,189],51:[2,189],54:[2,189],69:[2,189],74:[2,189],82:[2,189],87:[2,189],89:[2,189],98:[2,189],99:84,100:[2,189],101:[2,189],102:[2,189],105:85,106:[2,189],107:66,114:[2,189],122:[2,189],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[2,189],133:[1,82]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],46:[2,190],51:[2,190],54:[2,190],69:[2,190],74:[2,190],82:[2,190],87:[2,190],89:[2,190],98:[2,190],99:84,100:[2,190],101:[2,190],102:[2,190],105:85,106:[2,190],107:66,114:[2,190],122:[2,190],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,190],132:[2,190],133:[2,190]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],46:[2,175],51:[2,175],54:[2,175],69:[2,175],74:[2,175],82:[2,175],87:[2,175],89:[2,175],98:[2,175],99:84,100:[1,62],101:[2,175],102:[1,63],105:85,106:[1,65],107:66,114:[2,175],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],46:[2,174],51:[2,174],54:[2,174],69:[2,174],74:[2,174],82:[2,174],87:[2,174],89:[2,174],98:[2,174],99:84,100:[1,62],101:[2,174],102:[1,63],105:85,106:[1,65],107:66,114:[2,174],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],46:[2,97],51:[2,97],54:[2,97],63:[2,97],64:[2,97],65:[2,97],68:[2,97],69:[2,97],70:[2,97],71:[2,97],74:[2,97],80:[2,97],81:[2,97],82:[2,97],87:[2,97],89:[2,97],98:[2,97],100:[2,97],101:[2,97],102:[2,97],106:[2,97],114:[2,97],122:[2,97],124:[2,97],125:[2,97],128:[2,97],129:[2,97],130:[2,97],131:[2,97],132:[2,97],133:[2,97]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],37:[2,74],46:[2,74],51:[2,74],54:[2,74],63:[2,74],64:[2,74],65:[2,74],68:[2,74],69:[2,74],70:[2,74],71:[2,74],74:[2,74],76:[2,74],80:[2,74],81:[2,74],82:[2,74],87:[2,74],89:[2,74],98:[2,74],100:[2,74],101:[2,74],102:[2,74],106:[2,74],114:[2,74],122:[2,74],124:[2,74],125:[2,74],126:[2,74],127:[2,74],128:[2,74],129:[2,74],130:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],37:[2,75],46:[2,75],51:[2,75],54:[2,75],63:[2,75],64:[2,75],65:[2,75],68:[2,75],69:[2,75],70:[2,75],71:[2,75],74:[2,75],76:[2,75],80:[2,75],81:[2,75],82:[2,75],87:[2,75],89:[2,75],98:[2,75],100:[2,75],101:[2,75],102:[2,75],106:[2,75],114:[2,75],122:[2,75],124:[2,75],125:[2,75],126:[2,75],127:[2,75],128:[2,75],129:[2,75],130:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],37:[2,76],46:[2,76],51:[2,76],54:[2,76],63:[2,76],64:[2,76],65:[2,76],68:[2,76],69:[2,76],70:[2,76],71:[2,76],74:[2,76],76:[2,76],80:[2,76],81:[2,76],82:[2,76],87:[2,76],89:[2,76],98:[2,76],100:[2,76],101:[2,76],102:[2,76],106:[2,76],114:[2,76],122:[2,76],124:[2,76],125:[2,76],126:[2,76],127:[2,76],128:[2,76],129:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76]},{54:[1,188],69:[1,235],88:236,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:237,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{13:[2,110],28:[2,110],30:[2,110],31:[2,110],33:[2,110],34:[2,110],35:[2,110],42:[2,110],43:[2,110],44:[2,110],48:[2,110],49:[2,110],69:[2,110],72:[2,110],75:[2,110],79:[2,110],84:[2,110],85:[2,110],86:[2,110],92:[2,110],96:[2,110],97:[2,110],100:[2,110],102:[2,110],104:[2,110],106:[2,110],115:[2,110],121:[2,110],123:[2,110],124:[2,110],125:[2,110],126:[2,110],127:[2,110]},{13:[2,111],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],69:[2,111],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],37:[2,81],46:[2,81],51:[2,81],54:[2,81],63:[2,81],64:[2,81],65:[2,81],68:[2,81],69:[2,81],70:[2,81],71:[2,81],74:[2,81],76:[2,81],80:[2,81],81:[2,81],82:[2,81],87:[2,81],89:[2,81],98:[2,81],100:[2,81],101:[2,81],102:[2,81],106:[2,81],114:[2,81],122:[2,81],124:[2,81],125:[2,81],126:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81]},{8:238,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],37:[2,82],46:[2,82],51:[2,82],54:[2,82],63:[2,82],64:[2,82],65:[2,82],68:[2,82],69:[2,82],70:[2,82],71:[2,82],74:[2,82],76:[2,82],80:[2,82],81:[2,82],82:[2,82],87:[2,82],89:[2,82],98:[2,82],100:[2,82],101:[2,82],102:[2,82],106:[2,82],114:[2,82],122:[2,82],124:[2,82],125:[2,82],126:[2,82],127:[2,82],128:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],46:[2,98],51:[2,98],54:[2,98],63:[2,98],64:[2,98],65:[2,98],68:[2,98],69:[2,98],70:[2,98],71:[2,98],74:[2,98],80:[2,98],81:[2,98],82:[2,98],87:[2,98],89:[2,98],98:[2,98],100:[2,98],101:[2,98],102:[2,98],106:[2,98],114:[2,98],122:[2,98],124:[2,98],125:[2,98],128:[2,98],129:[2,98],130:[2,98],131:[2,98],132:[2,98],133:[2,98]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],46:[2,33],51:[2,33],54:[2,33],69:[2,33],74:[2,33],82:[2,33],87:[2,33],89:[2,33],98:[2,33],99:84,100:[2,33],101:[2,33],102:[2,33],105:85,106:[2,33],107:66,114:[2,33],122:[2,33],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:239,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],46:[2,103],51:[2,103],54:[2,103],63:[2,103],64:[2,103],65:[2,103],68:[2,103],69:[2,103],70:[2,103],71:[2,103],74:[2,103],80:[2,103],81:[2,103],82:[2,103],87:[2,103],89:[2,103],98:[2,103],100:[2,103],101:[2,103],102:[2,103],106:[2,103],114:[2,103],122:[2,103],124:[2,103],125:[2,103],128:[2,103],129:[2,103],130:[2,103],131:[2,103],132:[2,103],133:[2,103]},{6:[2,49],25:[2,49],50:240,51:[1,223],82:[2,49]},{6:[2,121],25:[2,121],26:[2,121],51:[2,121],54:[1,241],82:[2,121],87:[2,121],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{47:242,48:[1,57],49:[1,58]},{27:108,28:[1,70],41:109,52:243,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{46:[2,55],51:[2,55]},{8:244,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],46:[2,191],51:[2,191],54:[2,191],69:[2,191],74:[2,191],82:[2,191],87:[2,191],89:[2,191],98:[2,191],99:84,100:[2,191],101:[2,191],102:[2,191],105:85,106:[2,191],107:66,114:[2,191],122:[2,191],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:245,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],46:[2,193],51:[2,193],54:[2,193],69:[2,193],74:[2,193],82:[2,193],87:[2,193],89:[2,193],98:[2,193],99:84,100:[2,193],101:[2,193],102:[2,193],105:85,106:[2,193],107:66,114:[2,193],122:[2,193],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],46:[2,173],51:[2,173],54:[2,173],69:[2,173],74:[2,173],82:[2,173],87:[2,173],89:[2,173],98:[2,173],100:[2,173],101:[2,173],102:[2,173],106:[2,173],114:[2,173],122:[2,173],124:[2,173],125:[2,173],128:[2,173],129:[2,173],130:[2,173],131:[2,173],132:[2,173],133:[2,173]},{8:246,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,126],6:[2,126],25:[2,126],26:[2,126],46:[2,126],51:[2,126],54:[2,126],69:[2,126],74:[2,126],82:[2,126],87:[2,126],89:[2,126],94:[1,247],98:[2,126],100:[2,126],101:[2,126],102:[2,126],106:[2,126],114:[2,126],122:[2,126],124:[2,126],125:[2,126],128:[2,126],129:[2,126],130:[2,126],131:[2,126],132:[2,126],133:[2,126]},{5:248,25:[1,5]},{27:249,28:[1,70]},{116:250,118:212,119:[1,213]},{26:[1,251],117:[1,252],118:253,119:[1,213]},{26:[2,166],117:[2,166],119:[2,166]},{8:255,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],91:254,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,91],5:256,6:[2,91],25:[1,5],26:[2,91],46:[2,91],51:[2,91],54:[2,91],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,91],70:[1,98],71:[1,99],74:[2,91],77:89,80:[1,91],81:[2,101],82:[2,91],87:[2,91],89:[2,91],98:[2,91],100:[2,91],101:[2,91],102:[2,91],106:[2,91],114:[2,91],122:[2,91],124:[2,91],125:[2,91],128:[2,91],129:[2,91],130:[2,91],131:[2,91],132:[2,91],133:[2,91]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66]},{1:[2,94],6:[2,94],25:[2,94],26:[2,94],46:[2,94],51:[2,94],54:[2,94],69:[2,94],74:[2,94],82:[2,94],87:[2,94],89:[2,94],98:[2,94],100:[2,94],101:[2,94],102:[2,94],106:[2,94],114:[2,94],122:[2,94],124:[2,94],125:[2,94],128:[2,94],129:[2,94],130:[2,94],131:[2,94],132:[2,94],133:[2,94]},{14:257,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,131],6:[2,131],25:[2,131],26:[2,131],46:[2,131],51:[2,131],54:[2,131],63:[2,131],64:[2,131],65:[2,131],68:[2,131],69:[2,131],70:[2,131],71:[2,131],74:[2,131],80:[2,131],81:[2,131],82:[2,131],87:[2,131],89:[2,131],98:[2,131],100:[2,131],101:[2,131],102:[2,131],106:[2,131],114:[2,131],122:[2,131],124:[2,131],125:[2,131],128:[2,131],129:[2,131],130:[2,131],131:[2,131],132:[2,131],133:[2,131]},{6:[1,71],26:[1,258]},{8:259,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,61],13:[2,111],25:[2,61],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],51:[2,61],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],87:[2,61],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{6:[1,261],25:[1,262],87:[1,260]},{6:[2,50],8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[2,50],26:[2,50],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[2,50],84:[1,55],85:[1,56],86:[1,54],87:[2,50],90:263,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],26:[2,49],50:264,51:[1,223]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],46:[2,170],51:[2,170],54:[2,170],69:[2,170],74:[2,170],82:[2,170],87:[2,170],89:[2,170],98:[2,170],100:[2,170],101:[2,170],102:[2,170],106:[2,170],114:[2,170],117:[2,170],122:[2,170],124:[2,170],125:[2,170],128:[2,170],129:[2,170],130:[2,170],131:[2,170],132:[2,170],133:[2,170]},{8:265,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:266,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{112:[2,149],113:[2,149]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],111:267},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],46:[2,155],51:[2,155],54:[2,155],69:[2,155],74:[2,155],82:[2,155],87:[2,155],89:[2,155],98:[2,155],99:84,100:[2,155],101:[1,268],102:[2,155],105:85,106:[2,155],107:66,114:[1,269],122:[2,155],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],46:[2,156],51:[2,156],54:[2,156],69:[2,156],74:[2,156],82:[2,156],87:[2,156],89:[2,156],98:[2,156],99:84,100:[2,156],101:[1,270],102:[2,156],105:85,106:[2,156],107:66,114:[2,156],122:[2,156],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,272],25:[1,273],74:[1,271]},{6:[2,50],12:166,25:[2,50],26:[2,50],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:274,39:165,41:169,43:[1,46],74:[2,50],85:[1,112]},{8:275,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,276],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],37:[2,80],46:[2,80],51:[2,80],54:[2,80],63:[2,80],64:[2,80],65:[2,80],68:[2,80],69:[2,80],70:[2,80],71:[2,80],74:[2,80],76:[2,80],80:[2,80],81:[2,80],82:[2,80],87:[2,80],89:[2,80],98:[2,80],100:[2,80],101:[2,80],102:[2,80],106:[2,80],114:[2,80],122:[2,80],124:[2,80],125:[2,80],126:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80]},{8:277,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,69:[1,278],72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,279],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{69:[1,235],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,280],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],82:[1,281]},{6:[2,61],25:[2,61],26:[2,61],51:[2,61],82:[2,61],87:[2,61]},{5:282,25:[1,5]},{46:[2,53],51:[2,53]},{46:[2,56],51:[2,56],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,283],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:284,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:285,25:[1,5]},{1:[2,127],6:[2,127],25:[2,127],26:[2,127],46:[2,127],51:[2,127],54:[2,127],69:[2,127],74:[2,127],82:[2,127],87:[2,127],89:[2,127],98:[2,127],100:[2,127],101:[2,127],102:[2,127],106:[2,127],114:[2,127],122:[2,127],124:[2,127],125:[2,127],128:[2,127],129:[2,127],130:[2,127],131:[2,127],132:[2,127],133:[2,127]},{5:286,25:[1,5]},{26:[1,287],117:[1,288],118:253,119:[1,213]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],46:[2,164],51:[2,164],54:[2,164],69:[2,164],74:[2,164],82:[2,164],87:[2,164],89:[2,164],98:[2,164],100:[2,164],101:[2,164],102:[2,164],106:[2,164],114:[2,164],122:[2,164],124:[2,164],125:[2,164],128:[2,164],129:[2,164],130:[2,164],131:[2,164],132:[2,164],133:[2,164]},{5:289,25:[1,5]},{26:[2,167],117:[2,167],119:[2,167]},{5:290,25:[1,5],51:[1,291]},{25:[2,123],51:[2,123],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,92],6:[2,92],25:[2,92],26:[2,92],46:[2,92],51:[2,92],54:[2,92],69:[2,92],74:[2,92],82:[2,92],87:[2,92],89:[2,92],98:[2,92],100:[2,92],101:[2,92],102:[2,92],106:[2,92],114:[2,92],122:[2,92],124:[2,92],125:[2,92],128:[2,92],129:[2,92],130:[2,92],131:[2,92],132:[2,92],133:[2,92]},{1:[2,95],5:292,6:[2,95],25:[1,5],26:[2,95],46:[2,95],51:[2,95],54:[2,95],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,95],70:[1,98],71:[1,99],74:[2,95],77:89,80:[1,91],81:[2,101],82:[2,95],87:[2,95],89:[2,95],98:[2,95],100:[2,95],101:[2,95],102:[2,95],106:[2,95],114:[2,95],122:[2,95],124:[2,95],125:[2,95],128:[2,95],129:[2,95],130:[2,95],131:[2,95],132:[2,95],133:[2,95]},{98:[1,293]},{87:[1,294],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],37:[2,109],46:[2,109],51:[2,109],54:[2,109],63:[2,109],64:[2,109],65:[2,109],68:[2,109],69:[2,109],70:[2,109],71:[2,109],74:[2,109],80:[2,109],81:[2,109],82:[2,109],87:[2,109],89:[2,109],98:[2,109],100:[2,109],101:[2,109],102:[2,109],106:[2,109],112:[2,109],113:[2,109],114:[2,109],122:[2,109],124:[2,109],125:[2,109],128:[2,109],129:[2,109],130:[2,109],131:[2,109],132:[2,109],133:[2,109]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],90:295,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:296,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,117],25:[2,117],26:[2,117],51:[2,117],82:[2,117],87:[2,117]},{6:[1,261],25:[1,262],26:[1,297]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],46:[2,134],51:[2,134],54:[2,134],69:[2,134],74:[2,134],82:[2,134],87:[2,134],89:[2,134],98:[2,134],99:84,100:[1,62],101:[2,134],102:[1,63],105:85,106:[1,65],107:66,114:[2,134],122:[2,134],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],46:[2,136],51:[2,136],54:[2,136],69:[2,136],74:[2,136],82:[2,136],87:[2,136],89:[2,136],98:[2,136],99:84,100:[1,62],101:[2,136],102:[1,63],105:85,106:[1,65],107:66,114:[2,136],122:[2,136],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{112:[2,154],113:[2,154]},{8:298,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:299,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:300,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],37:[2,83],46:[2,83],51:[2,83],54:[2,83],63:[2,83],64:[2,83],65:[2,83],68:[2,83],69:[2,83],70:[2,83],71:[2,83],74:[2,83],80:[2,83],81:[2,83],82:[2,83],87:[2,83],89:[2,83],98:[2,83],100:[2,83],101:[2,83],102:[2,83],106:[2,83],112:[2,83],113:[2,83],114:[2,83],122:[2,83],124:[2,83],125:[2,83],128:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83]},{12:166,27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:301,39:165,41:169,43:[1,46],85:[1,112]},{6:[2,84],12:166,25:[2,84],26:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:302,85:[1,112]},{6:[2,86],25:[2,86],26:[2,86],51:[2,86],74:[2,86]},{6:[2,36],25:[2,36],26:[2,36],51:[2,36],74:[2,36],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:303,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,304],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],37:[2,114],46:[2,114],51:[2,114],54:[2,114],63:[2,114],64:[2,114],65:[2,114],68:[2,114],69:[2,114],70:[2,114],71:[2,114],74:[2,114],76:[2,114],80:[2,114],81:[2,114],82:[2,114],87:[2,114],89:[2,114],98:[2,114],100:[2,114],101:[2,114],102:[2,114],106:[2,114],114:[2,114],122:[2,114],124:[2,114],125:[2,114],126:[2,114],127:[2,114],128:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],37:[2,115],46:[2,115],51:[2,115],54:[2,115],63:[2,115],64:[2,115],65:[2,115],68:[2,115],69:[2,115],70:[2,115],71:[2,115],74:[2,115],76:[2,115],80:[2,115],81:[2,115],82:[2,115],87:[2,115],89:[2,115],98:[2,115],100:[2,115],101:[2,115],102:[2,115],106:[2,115],114:[2,115],122:[2,115],124:[2,115],125:[2,115],126:[2,115],127:[2,115],128:[2,115],129:[2,115],130:[2,115],131:[2,115],132:[2,115],133:[2,115],134:[2,115]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],46:[2,34],51:[2,34],54:[2,34],69:[2,34],74:[2,34],82:[2,34],87:[2,34],89:[2,34],98:[2,34],100:[2,34],101:[2,34],102:[2,34],106:[2,34],114:[2,34],122:[2,34],124:[2,34],125:[2,34],128:[2,34],129:[2,34],130:[2,34],131:[2,34],132:[2,34],133:[2,34]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],46:[2,104],51:[2,104],54:[2,104],63:[2,104],64:[2,104],65:[2,104],68:[2,104],69:[2,104],70:[2,104],71:[2,104],74:[2,104],80:[2,104],81:[2,104],82:[2,104],87:[2,104],89:[2,104],98:[2,104],100:[2,104],101:[2,104],102:[2,104],106:[2,104],114:[2,104],122:[2,104],124:[2,104],125:[2,104],128:[2,104],129:[2,104],130:[2,104],131:[2,104],132:[2,104],133:[2,104]},{1:[2,45],6:[2,45],25:[2,45],26:[2,45],46:[2,45],51:[2,45],54:[2,45],69:[2,45],74:[2,45],82:[2,45],87:[2,45],89:[2,45],98:[2,45],100:[2,45],101:[2,45],102:[2,45],106:[2,45],114:[2,45],122:[2,45],124:[2,45],125:[2,45],128:[2,45],129:[2,45],130:[2,45],131:[2,45],132:[2,45],133:[2,45]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],46:[2,192],51:[2,192],54:[2,192],69:[2,192],74:[2,192],82:[2,192],87:[2,192],89:[2,192],98:[2,192],100:[2,192],101:[2,192],102:[2,192],106:[2,192],114:[2,192],122:[2,192],124:[2,192],125:[2,192],128:[2,192],129:[2,192],130:[2,192],131:[2,192],132:[2,192],133:[2,192]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],46:[2,171],51:[2,171],54:[2,171],69:[2,171],74:[2,171],82:[2,171],87:[2,171],89:[2,171],98:[2,171],100:[2,171],101:[2,171],102:[2,171],106:[2,171],114:[2,171],117:[2,171],122:[2,171],124:[2,171],125:[2,171],128:[2,171],129:[2,171],130:[2,171],131:[2,171],132:[2,171],133:[2,171]},{1:[2,128],6:[2,128],25:[2,128],26:[2,128],46:[2,128],51:[2,128],54:[2,128],69:[2,128],74:[2,128],82:[2,128],87:[2,128],89:[2,128],98:[2,128],100:[2,128],101:[2,128],102:[2,128],106:[2,128],114:[2,128],122:[2,128],124:[2,128],125:[2,128],128:[2,128],129:[2,128],130:[2,128],131:[2,128],132:[2,128],133:[2,128]},{1:[2,129],6:[2,129],25:[2,129],26:[2,129],46:[2,129],51:[2,129],54:[2,129],69:[2,129],74:[2,129],82:[2,129],87:[2,129],89:[2,129],94:[2,129],98:[2,129],100:[2,129],101:[2,129],102:[2,129],106:[2,129],114:[2,129],122:[2,129],124:[2,129],125:[2,129],128:[2,129],129:[2,129],130:[2,129],131:[2,129],132:[2,129],133:[2,129]},{1:[2,162],6:[2,162],25:[2,162],26:[2,162],46:[2,162],51:[2,162],54:[2,162],69:[2,162],74:[2,162],82:[2,162],87:[2,162],89:[2,162],98:[2,162],100:[2,162],101:[2,162],102:[2,162],106:[2,162],114:[2,162],122:[2,162],124:[2,162],125:[2,162],128:[2,162],129:[2,162],130:[2,162],131:[2,162],132:[2,162],133:[2,162]},{5:305,25:[1,5]},{26:[1,306]},{6:[1,307],26:[2,168],117:[2,168],119:[2,168]},{8:308,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,96],6:[2,96],25:[2,96],26:[2,96],46:[2,96],51:[2,96],54:[2,96],69:[2,96],74:[2,96],82:[2,96],87:[2,96],89:[2,96],98:[2,96],100:[2,96],101:[2,96],102:[2,96],106:[2,96],114:[2,96],122:[2,96],124:[2,96],125:[2,96],128:[2,96],129:[2,96],130:[2,96],131:[2,96],132:[2,96],133:[2,96]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],46:[2,132],51:[2,132],54:[2,132],63:[2,132],64:[2,132],65:[2,132],68:[2,132],69:[2,132],70:[2,132],71:[2,132],74:[2,132],80:[2,132],81:[2,132],82:[2,132],87:[2,132],89:[2,132],98:[2,132],100:[2,132],101:[2,132],102:[2,132],106:[2,132],114:[2,132],122:[2,132],124:[2,132],125:[2,132],128:[2,132],129:[2,132],130:[2,132],131:[2,132],132:[2,132],133:[2,132]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],46:[2,112],51:[2,112],54:[2,112],63:[2,112],64:[2,112],65:[2,112],68:[2,112],69:[2,112],70:[2,112],71:[2,112],74:[2,112],80:[2,112],81:[2,112],82:[2,112],87:[2,112],89:[2,112],98:[2,112],100:[2,112],101:[2,112],102:[2,112],106:[2,112],114:[2,112],122:[2,112],124:[2,112],125:[2,112],128:[2,112],129:[2,112],130:[2,112],131:[2,112],132:[2,112],133:[2,112]},{6:[2,118],25:[2,118],26:[2,118],51:[2,118],82:[2,118],87:[2,118]},{6:[2,49],25:[2,49],26:[2,49],50:309,51:[1,223]},{6:[2,119],25:[2,119],26:[2,119],51:[2,119],82:[2,119],87:[2,119]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],46:[2,157],51:[2,157],54:[2,157],69:[2,157],74:[2,157],82:[2,157],87:[2,157],89:[2,157],98:[2,157],99:84,100:[2,157],101:[2,157],102:[2,157],105:85,106:[2,157],107:66,114:[1,310],122:[2,157],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,159],6:[2,159],25:[2,159],26:[2,159],46:[2,159],51:[2,159],54:[2,159],69:[2,159],74:[2,159],82:[2,159],87:[2,159],89:[2,159],98:[2,159],99:84,100:[2,159],101:[1,311],102:[2,159],105:85,106:[2,159],107:66,114:[2,159],122:[2,159],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],46:[2,158],51:[2,158],54:[2,158],69:[2,158],74:[2,158],82:[2,158],87:[2,158],89:[2,158],98:[2,158],99:84,100:[2,158],101:[2,158],102:[2,158],105:85,106:[2,158],107:66,114:[2,158],122:[2,158],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,87],25:[2,87],26:[2,87],51:[2,87],74:[2,87]},{6:[2,49],25:[2,49],26:[2,49],50:312,51:[1,233]},{26:[1,313],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],37:[2,113],46:[2,113],51:[2,113],54:[2,113],63:[2,113],64:[2,113],65:[2,113],68:[2,113],69:[2,113],70:[2,113],71:[2,113],74:[2,113],76:[2,113],80:[2,113],81:[2,113],82:[2,113],87:[2,113],89:[2,113],98:[2,113],100:[2,113],101:[2,113],102:[2,113],106:[2,113],114:[2,113],122:[2,113],124:[2,113],125:[2,113],126:[2,113],127:[2,113],128:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113]},{26:[1,314]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],46:[2,165],51:[2,165],54:[2,165],69:[2,165],74:[2,165],82:[2,165],87:[2,165],89:[2,165],98:[2,165],100:[2,165],101:[2,165],102:[2,165],106:[2,165],114:[2,165],122:[2,165],124:[2,165],125:[2,165],128:[2,165],129:[2,165],130:[2,165],131:[2,165],132:[2,165],133:[2,165]},{26:[2,169],117:[2,169],119:[2,169]},{25:[2,124],51:[2,124],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],26:[1,315]},{8:316,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:317,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[1,272],25:[1,273],26:[1,318]},{6:[2,37],25:[2,37],26:[2,37],51:[2,37],74:[2,37]},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],46:[2,163],51:[2,163],54:[2,163],69:[2,163],74:[2,163],82:[2,163],87:[2,163],89:[2,163],98:[2,163],100:[2,163],101:[2,163],102:[2,163],106:[2,163],114:[2,163],122:[2,163],124:[2,163],125:[2,163],128:[2,163],129:[2,163],130:[2,163],131:[2,163],132:[2,163],133:[2,163]},{6:[2,120],25:[2,120],26:[2,120],51:[2,120],82:[2,120],87:[2,120]},{1:[2,160],6:[2,160],25:[2,160],26:[2,160],46:[2,160],51:[2,160],54:[2,160],69:[2,160],74:[2,160],82:[2,160],87:[2,160],89:[2,160],98:[2,160],99:84,100:[2,160],101:[2,160],102:[2,160],105:85,106:[2,160],107:66,114:[2,160],122:[2,160],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,161],6:[2,161],25:[2,161],26:[2,161],46:[2,161],51:[2,161],54:[2,161],69:[2,161],74:[2,161],82:[2,161],87:[2,161],89:[2,161],98:[2,161],99:84,100:[2,161],101:[2,161],102:[2,161],105:85,106:[2,161],107:66,114:[2,161],122:[2,161],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,88],25:[2,88],26:[2,88],51:[2,88],74:[2,88]}],defaultActions:{57:[2,47],58:[2,48],72:[2,3],91:[2,102]},parseError:function d(a,b){throw new Error(a)},parse:function e(a){function m(){var a;a=b.lexer.lex()||1,typeof a!=="number"&&(a=b.symbols_[a]||a);return a}function l(a){c.length=c.length-2*a,d.length=d.length-a}var b=this,c=[0],d=[null],e=this.table,f="",g=0,h=0,i=0,j=2,k=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,typeof this.yy.parseError==="function"&&(this.parseError=this.yy.parseError);var n,o,p,q,r,s,t={},u,v,w,x;while(!0){p=c[c.length-1],this.defaultActions[p]?q=this.defaultActions[p]:(n==null&&(n=m()),q=e[p]&&e[p][n]);if(typeof q==="undefined"||!q.length||!q[0]){if(!i){x=[];for(u in e[p])this.terminals_[u]&&u>2&&x.push("'"+this.terminals_[u]+"'");var y="";this.lexer.showPosition?y="Parse error on line "+(g+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+x.join(", "):y="Parse error on line "+(g+1)+": Unexpected "+(n==1?"end of input":"'"+(this.terminals_[n]||n)+"'"),this.parseError(y,{text:this.lexer.match,token:this.terminals_[n]||n,line:this.lexer.yylineno,expected:x})}if(i==3){if(n==k)throw new Error(y||"Parsing halted.");h=this.lexer.yyleng,f=this.lexer.yytext,g=this.lexer.yylineno,n=m()}while(1){if(j.toString()in e[p])break;if(p==0)throw new Error(y||"Parsing halted.");l(1),p=c[c.length-1]}o=n,n=j,p=c[c.length-1],q=e[p]&&e[p][j],i=3}if(q[0]instanceof Array&&q.length>1)throw new Error("Parse Error: multiple actions possible at state: "+p+", token: "+n);switch(q[0]){case 1:c.push(n),d.push(this.lexer.yytext),c.push(q[1]),n=null,o?(n=o,o=null):(h=this.lexer.yyleng,f=this.lexer.yytext,g=this.lexer.yylineno,i>0&&i--);break;case 2:v=this.productions_[q[1]][1],t.$=d[d.length-v],s=this.performAction.call(t,f,h,g,this.yy,q[1],d);if(typeof s!=="undefined")return s;v&&(c=c.slice(0,-1*v*2),d=d.slice(0,-1*v)),c.push(this.productions_[q[1]][0]),d.push(t.$),w=e[c[c.length-2]][c[c.length-1]],c.push(w);break;case 3:return!0}}return!0}};return a}();typeof require!=="undefined"&&(a.parser=b,a.parse=function(){return b.parse.apply(b,arguments)},a.main=function c(b){if(!b[1])throw new Error("Usage: "+b[0]+" FILE");if(typeof process!=="undefined")var c=require("fs").readFileSync(require("path").join(process.cwd(),b[1]),"utf8");else var d=require("file").path(require("file").cwd()),c=d.join(b[1]).read({charset:"utf-8"});return a.parser.parse(c)},typeof module!=="undefined"&&require.main===module&&a.main(typeof process!=="undefined"?process.argv.slice(1):require("system").args))},require["./scope"]=new function(){var a=this;(function(){var b,c,d,e;e=require("./helpers"),c=e.extend,d=e.last,a.Scope=b=function(){function a(b,c,d){this.parent=b,this.expressions=c,this.method=d,this.variables=[{name:"arguments",type:"arguments"}],this.positions={},this.parent||(a.root=this)}a.root=null,a.prototype.add=function(a,b,c){var d;if(this.shared&&!c)return this.parent.add(a,b,c);return typeof (d=this.positions[a])==="number"?this.variables[d].type=b:this.positions[a]=this.variables.push({name:a,type:b})-1},a.prototype.find=function(a,b){if(this.check(a,b))return!0;this.add(a,"var");return!1},a.prototype.parameter=function(a){if(!this.shared||!this.parent.check(a,!0))return this.add(a,"param")},a.prototype.check=function(a,b){var c,d;c=!!this.type(a);if(c||b)return c;return!!((d=this.parent)!=null?d.check(a):void 0)},a.prototype.temporary=function(a,b){return a.length>1?"_"+a+(b>1?b:""):"_"+(b+parseInt(a,36)).toString(36).replace(/\d/g,"a")},a.prototype.type=function(a){var b,c,d,e;e=this.variables;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.name===a)return b.type}return null},a.prototype.freeVariable=function(a){var b,c;b=0;while(this.check(c=this.temporary(a,b),!0))b++;this.add(c,"var",!0);return c},a.prototype.assign=function(a,b){this.add(a,{value:b,assigned:!0});return this.hasAssignments=!0},a.prototype.hasDeclarations=function(){return!!this.declaredVariables().length},a.prototype.declaredVariables=function(){var a,b,c,d,e,f;a=[],b=[],f=this.variables;for(d=0,e=f.length;d<e;d++)c=f[d],c.type==="var"&&(c.name.charAt(0)==="_"?b:a).push(c.name);return a.sort().concat(b.sort())},a.prototype.assignedVariables=function(){var a,b,c,d,e;d=this.variables,e=[];for(b=0,c=d.length;b<c;b++)a=d[b],a.type.assigned&&e.push(""+a.name+" = "+a.type.value);return e};return a}()}).call(this)},require["./nodes"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,_,ba,bb,bc,bd,be,bf,bg,bh=Object.prototype.hasOwnProperty,bi=function(a,b){function d(){this.constructor=a}for(var c in b)bh.call(b,c)&&(a[c]=b[c]);d.prototype=b.prototype,a.prototype=new d,a.__super__=b.prototype;return a},bj=function(a,b){return function(){return a.apply(b,arguments)}};K=require("./scope").Scope,bg=require("./helpers"),X=bg.compact,_=bg.flatten,$=bg.extend,bb=bg.merge,Y=bg.del,bd=bg.starts,Z=bg.ends,ba=bg.last,a.extend=$,W=function(){return!0},B=function(){return!1},P=function(){return this},A=function(){this.negated=!this.negated;return this},a.Base=e=function(){function a(){}a.prototype.compile=function(a,b){var c;a=$({},a),b&&(a.level=b),c=this.unfoldSoak(a)||this,c.tab=a.indent;return a.level!==y&&c.isStatement(a)?c.compileClosure(a):c.compileNode(a)},a.prototype.compileClosure=function(a){if(this.jumps())throw SyntaxError("cannot use a pure statement in an expression.");a.sharedScope=!0;return i.wrap(this).compileNode(a)},a.prototype.cache=function(a,b,c){var e,f;if(this.isComplex()){e=new z(c||a.scope.freeVariable("ref")),f=new d(e,this);return b?[f.compile(a,b),e.value]:[f,e]}e=b?this.compile(a,b):this;return[e,e]},a.prototype.compileLoopReference=function(a,b){var c,d,e;c=d=this.compile(a,v),-Infinity<(e=+c)&&e<Infinity||o.test(c)&&a.scope.check(c,!0)||(c=""+(d=a.scope.freeVariable(b))+" = "+c);return[c,d]},a.prototype.makeReturn=function(){return new I(this)},a.prototype.contains=function(a){var b;b=!1,this.traverseChildren(!1,function(c){if(a(c)){b=!0;return!1}});return b},a.prototype.containsType=function(a){return this instanceof a||this.contains(function(b){return b instanceof a})},a.prototype.lastNonComment=function(a){var b;b=a.length;while(b--)if(!(a[b]instanceof k))return a[b];return null},a.prototype.toString=function(a,b){var c;a==null&&(a=""),b==null&&(b=this.constructor.name),c="\n"+a+b,this.soak&&(c+="?"),this.eachChild(function(b){return c+=b.toString(a+O)});return c},a.prototype.eachChild=function(a){var b,c,d,e,f,g,h,i;if(!this.children)return this;h=this.children;for(d=0,f=h.length;d<f;d++){b=h[d];if(this[b]){i=_([this[b]]);for(e=0,g=i.length;e<g;e++){c=i[e];if(a(c)===!1)return this}}}return this},a.prototype.traverseChildren=function(a,b){return this.eachChild(function(c){if(b(c)===!1)return!1;return c.traverseChildren(a,b)})},a.prototype.invert=function(){return new D("!",this)},a.prototype.unwrapAll=function(){var a;a=this;while(a!==(a=a.unwrap()))continue;return a},a.prototype.children=[],a.prototype.isStatement=B,a.prototype.jumps=B,a.prototype.isComplex=W,a.prototype.isChainable=B,a.prototype.isAssignable=B,a.prototype.unwrap=P,a.prototype.unfoldSoak=B,a.prototype.assigns=B;return a}(),a.Block=f=function(){function a(a){this.expressions=X(_(a||[]))}bi(a,e),a.prototype.children=["expressions"],a.prototype.push=function(a){this.expressions.push(a);return this},a.prototype.pop=function(){return this.expressions.pop()},a.prototype.unshift=function(a){this.expressions.unshift(a);return this},a.prototype.unwrap=function(){return this.expressions.length===1?this.expressions[0]:this},a.prototype.isEmpty=function(){return!this.expressions.length},a.prototype.isStatement=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.isStatement(a))return!0}return!1},a.prototype.jumps=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.jumps(a))return b}},a.prototype.makeReturn=function(){var a,b;b=this.expressions.length;while(b--){a=this.expressions[b];if(!(a instanceof k)){this.expressions[b]=a.makeReturn(),a instanceof I&&!a.expression&&this.expressions.splice(b,1);break}}return this},a.prototype.compile=function(b,c){b==null&&(b={});return b.scope?a.__super__.compile.call(this,b,c):this.compileRoot(b)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h;this.tab=a.indent,e=a.level===y,c=[],h=this.expressions;for(f=0,g=h.length;f<g;f++)d=h[f],d=d.unwrapAll(),d=d.unfoldSoak(a)||d,e?(d.front=!0,b=d.compile(a),c.push(d.isStatement(a)?b:this.tab+b+";")):c.push(d.compile(a,v));if(e)return c.join("\n");b=c.join(", ")||"void 0";return c.length>1&&a.level>=v?"("+b+")":b},a.prototype.compileRoot=function(a){var b;a.indent=this.tab=a.bare?"":O,a.scope=new K(null,this,null),a.level=y,b=this.compileWithDeclarations(a),b=b.replace(Q,"");return a.bare?b:"(function() {\n"+b+"\n}).call(this);\n"},a.prototype.compileWithDeclarations=function(a){var b,c,d,e,f,g,h,i;b=e="",i=this.expressions;for(d=0,h=i.length;d<h;d++){c=i[d],c=c.unwrap();if(!(c instanceof k||c instanceof z))break}a=bb(a,{level:y}),d&&(f=this.expressions.splice(d,this.expressions.length),b=this.compileNode(a),this.expressions=f),e=this.compileNode(a),g=a.scope,g.expressions===this&&(!a.globals&&a.scope.hasDeclarations()&&(b+=""+this.tab+"var "+g.declaredVariables().join(", ")+";\n"),g.hasAssignments&&(b+=""+this.tab+"var "+bc(g.assignedVariables().join(", "),this.tab)+";\n"));return b+e},a.wrap=function(b){if(b.length===1&&b[0]instanceof a)return b[0];return new a(b)};return a}(),a.Literal=z=function(){function a(a){this.value=a}bi(a,e),a.prototype.makeReturn=function(){return this.isStatement()?this:new I(this)},a.prototype.isAssignable=function(){return o.test(this.value)},a.prototype.isStatement=function(){var a;return(a=this.value)==="break"||a==="continue"||a==="debugger"},a.prototype.isComplex=B,a.prototype.assigns=function(a){return a===this.value},a.prototype.jumps=function(a){if(!this.isStatement())return!1;return a&&(a.loop||a.block&&this.value!=="continue")?!1:this},a.prototype.compileNode=function(a){var b;b=this.isUndefined?a.level>=t?"(void 0)":"void 0":this.value.reserved?'"'+this.value+'"':this.value;return this.isStatement()?""+this.tab+b+";":b},a.prototype.toString=function(){return' "'+this.value+'"'};return a}(),a.Return=I=function(){function a(a){a&&!a.unwrap().isUndefined&&(this.expression=a)}bi(a,e),a.prototype.children=["expression"],a.prototype.isStatement=W,a.prototype.makeReturn=P,a.prototype.jumps=P,a.prototype.compile=function(b,c){var d,e;d=(e=this.expression)!=null?e.makeReturn():void 0;return!d||d instanceof a?a.__super__.compile.call(this,b,c):d.compile(b,c)},a.prototype.compileNode=function(a){return this.tab+("return"+(this.expression?" "+this.expression.compile(a,x):"")+";")};return a}(),a.Value=U=function(){function a(b,c,d){if(!c&&b instanceof a)return b;this.base=b,this.properties=c||[],d&&(this[d]=!0);return this}bi(a,e),a.prototype.children=["base","properties"],a.prototype.push=function(a){this.properties.push(a);return this},a.prototype.hasProperties=function(){return!!this.properties.length},a.prototype.isArray=function(){return!this.properties.length&&this.base instanceof c},a.prototype.isComplex=function(){return this.hasProperties()||this.base.isComplex()},a.prototype.isAssignable=function(){return this.hasProperties()||this.base.isAssignable()},a.prototype.isSimpleNumber=function(){return this.base instanceof z&&J.test(this.base.value)},a.prototype.isAtomic=function(){var a,b,c,d;d=this.properties.concat(this.base);for(b=0,c=d.length;b<c;b++){a=d[b];if(a.soak||a instanceof g)return!1}return!0},a.prototype.isStatement=function(a){return!this.properties.length&&this.base.isStatement(a)},a.prototype.assigns=function(a){return!this.properties.length&&this.base.assigns(a)},a.prototype.jumps=function(a){return!this.properties.length&&this.base.jumps(a)},a.prototype.isObject=function(a){if(this.properties.length)return!1;return this.base instanceof C&&(!a||this.base.generated)},a.prototype.isSplice=function(){return ba(this.properties)instanceof L},a.prototype.makeReturn=function(){return this.properties.length?a.__super__.makeReturn.call(this):this.base.makeReturn()},a.prototype.unwrap=function(){return this.properties.length?this:this.base},a.prototype.cacheReference=function(b){var c,e,f,g;f=ba(this.properties);if(this.properties.length<2&&!this.base.isComplex()&&!(f!=null?f.isComplex():void 0))return[this,this];c=new a(this.base,this.properties.slice(0,-1)),c.isComplex()&&(e=new z(b.scope.freeVariable("base")),c=new a(new F(new d(e,c))));if(!f)return[c,e];f.isComplex()&&(g=new z(b.scope.freeVariable("name")),f=new s(new d(g,f.index)),g=new s(g));return[c.push(f),new a(e||c.base,[g||f])]},a.prototype.compileNode=function(a){var c,d,e,f,g;this.base.front=this.front,e=this.properties,c=this.base.compile(a,e.length?t:null),e[0]instanceof b&&this.isSimpleNumber()&&(c="("+c+")");for(f=0,g=e.length;f<g;f++)d=e[f],c+=d.compile(a);return c},a.prototype.unfoldSoak=function(b){var c,e,f,g,h,i,j,k;if(f=this.base.unfoldSoak(b)){Array.prototype.push.apply(f.body.properties,this.properties);return f}k=this.properties;for(e=0,j=k.length;e<j;e++){g=k[e];if(g.soak){g.soak=!1,c=new a(this.base,this.properties.slice(0,e)),i=new a(this.base,this.properties.slice(e)),c.isComplex()&&(h=new z(b.scope.freeVariable("ref")),c=new F(new d(h,c)),i.base=h);return new q(new l(c),i,{soak:!0})}}return null};return a}(),a.Comment=k=function(){function a(a){this.comment=a}bi(a,e),a.prototype.isStatement=W,a.prototype.makeReturn=P,a.prototype.compileNode=function(a,b){var c;c="/*"+bc(this.comment,this.tab)+"*/",(b||a.level)===y&&(c=a.indent+c);return c};return a}(),a.Call=g=function(){function a(a,b,c){this.args=b!=null?b:[],this.soak=c,this.isNew=!1,this.isSuper=a==="super",this.variable=this.isSuper?null:a}bi(a,e),a.prototype.children=["variable","args"],a.prototype.newInstance=function(){var b;b=this.variable.base||this.variable,b instanceof a?b.newInstance():this.isNew=!0;return this},a.prototype.superReference=function(a){var b,c;b=a.scope.method;if(!b)throw SyntaxError("cannot call super outside of a function.");c=b.name;if(!c)throw SyntaxError("cannot call super on an anonymous function.");return b.klass?""+b.klass+".__super__."+c:""+c+".__super__.constructor"},a.prototype.unfoldSoak=function(b){var c,d,e,f,g,h,i,j,k;if(this.soak){if(this.variable){if(d=be(b,this,"variable"))return d;j=(new U(this.variable)).cacheReference(b),e=j[0],g=j[1]}else e=new z(this.superReference(b)),g=new U(e);g=new a(g,this.args),g.isNew=this.isNew,e=new z("typeof "+e.compile(b)+' == "function"');return new q(e,new U(g),{soak:!0})}c=this,f=[];while(!0){if(c.variable instanceof a){f.push(c),c=c.variable;continue}if(!(c.variable instanceof U))break;f.push(c);if(!((c=c.variable.base)instanceof a))break}k=f.reverse();for(h=0,i=k.length;h<i;h++)c=k[h],d&&(c.variable instanceof a?c.variable=d:c.variable.base=d),d=be(b,c,"variable");return d},a.prototype.compileNode=function(a){var b,c,d,e;(e=this.variable)!=null&&(e.front=this.front);if(d=M.compileSplattedArray(a,this.args,!0))return this.compileSplat(a,d);c=function(){var c,d,e,f;e=this.args,f=[];for(c=0,d=e.length;c<d;c++)b=e[c],f.push(b.compile(a,v));return f}.call(this).join(", ");return this.isSuper?this.superReference(a)+(".call(this"+(c&&", "+c)+")"):(this.isNew?"new ":"")+this.variable.compile(a,t)+("("+c+")")},a.prototype.compileSuper=function(a,b){return""+this.superReference(b)+".call(this"+(a.length?", ":"")+a+")"},a.prototype.compileSplat=function(a,b){var c,d,e,f,g;if(this.isSuper)return""+this.superReference(a)+".apply(this, "+b+")";if(this.isNew){e=this.tab+O;return"(function(func, args, ctor) {\n"+e+"ctor.prototype = func.prototype;\n"+e+"var child = new ctor, result = func.apply(child, args);\n"+e+'return typeof result == "object" ? result : child;\n'+this.tab+"})("+this.variable.compile(a,v)+", "+b+", function() {})"}c=new U(this.variable),(f=c.properties.pop())&&c.isComplex()?(g=a.scope.freeVariable("ref"),d="("+g+" = "+c.compile(a,v)+")"+f.compile(a)):(d=c.compile(a,t),J.test(d)&&(d="("+d+")"),f?(g=d,d+=f.compile(a)):g="null");return""+d+".apply("+g+", "+b+")"};return a}(),a.Extends=m=function(){function a(a,b){this.child=a,this.parent=b}bi(a,e),a.prototype.children=["child","parent"],a.prototype.compile=function(a){bf("hasProp");return(new g(new U(new z(bf("extends"))),[this.child,this.parent])).compile(a)};return a}(),a.Access=b=function(){function a(a,b){this.name=a,this.name.asKey=!0,this.proto=b==="proto"?".prototype":"",this.soak=b==="soak"}bi(a,e),a.prototype.children=["name"],a.prototype.compile=function(a){var b;b=this.name.compile(a);return this.proto+(p.test(b)?"["+b+"]":"."+b)},a.prototype.isComplex=B;return a}(),a.Index=s=function(){function a(a){this.index=a}bi(a,e),a.prototype.children=["index"],a.prototype.compile=function(a){return(this.proto?".prototype":"")+("["+this.index.compile(a,x)+"]")},a.prototype.isComplex=function(){return this.index.isComplex()};return a}(),a.Range=H=function(){function a(a,b,c){this.from=a,this.to=b,this.exclusive=c==="exclusive",this.equals=this.exclusive?"":"="}bi(a,e),a.prototype.children=["from","to"],a.prototype.compileVariables=function(a){var b,c,d,e;a=bb(a,{top:!0}),c=this.from.cache(a,v),this.from=c[0],this.fromVar=c[1],d=this.to.cache(a,v),this.to=d[0],this.toVar=d[1],e=[this.fromVar.match(J),this.toVar.match(J)],this.fromNum=e[0],this.toNum=e[1],b=[],this.from!==this.fromVar&&b.push(this.from);if(this.to!==this.toVar)return b.push(this.to)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h;this.compileVariables(a);if(!a.index)return this.compileArray(a);if(this.fromNum&&this.toNum)return this.compileSimple(a);c=Y(a,"index"),f=Y(a,"step"),h=""+c+" = "+this.from+(this.to!==this.toVar?", "+this.to:""),e="("+this.fromVar+" <= "+this.toVar+" ? "+c,b=""+e+" <"+this.equals+" "+this.toVar+" : "+c+" >"+this.equals+" "+this.toVar+")",g=f?f.compile(a):"1",d=f?""+c+" += "+g:""+e+" += "+g+" : "+c+" -= "+g+")";return""+h+"; "+b+"; "+d},a.prototype.compileSimple=function(a){var b,c,d,e,f;f=[+this.fromNum,+this.toNum],b=f[0],e=f[1],c=Y(a,"index"),d=Y(a,"step"),d&&(d=""+c+" += "+d.compile(a));return b>e?""+c+" = "+b+"; "+c+" >"+this.equals+" "+e+"; "+(d||""+c+"--"):""+c+" = "+b+"; "+c+" <"+this.equals+" "+e+"; "+(d||""+c+"++")},a.prototype.compileArray=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;if(this.fromNum&&this.toNum&&Math.abs(this.fromNum-this.toNum)<=20){h=function(){n=[];for(var a=l=+this.fromNum,b=+this.toNum;l<=b?a<=b:a>=b;l<=b?a+=1:a-=1)n.push(a);return n}.apply(this,arguments),this.exclusive&&h.pop();return"["+h.join(", ")+"]"}e=this.tab+O,d=a.scope.freeVariable("i"),i=a.scope.freeVariable("results"),g="\n"+e+i+" = [];",this.fromNum&&this.toNum?(a.index=d,b=this.compileSimple(a)):(j=""+d+" = "+this.from+(this.to!==this.toVar?", "+this.to:""),c=""+this.fromVar+" <= "+this.toVar+" ?",b="var "+j+"; "+c+" "+d+" <"+this.equals+" "+this.toVar+" : "+d+" >"+this.equals+" "+this.toVar+"; "+c+" "+d+" += 1 : "+d+" -= 1"),f="{ "+i+".push("+d+"); }\n"+e+"return "+i+";\n"+a.indent;return"(function() {"+g+"\n"+e+"for ("+b+")"+f+"}).apply(this, arguments)"};return a}(),a.Slice=L=function(){function a(b){this.range=b,a.__super__.constructor.call(this)}bi(a,e),a.prototype.children=["range"],a.prototype.compileNode=function(a){var b,c,d,e,f,g;g=this.range,e=g.to,c=g.from,d=c&&c.compile(a,x)||"0",b=e&&e.compile(a,x),e&&(this.range.exclusive||+b!==-1)&&(f=", "+(this.range.exclusive?b:J.test(b)?(+b+1).toString():"("+b+" + 1) || 9e9"));return".slice("+d+(f||"")+")"};return a}(),a.Obj=C=function(){function a(a,b){this.generated=b!=null?b:!1,this.objects=this.properties=a||[]}bi(a,e),a.prototype.children=["properties"],a.prototype.compileNode=function(a){var b,c,e,f,g,h,i,j;j=this.properties;if(!j.length)return this.front?"({})":"{}";c=a.indent+=O,g=this.lastNonComment(this.properties),j=function(){var h,l;l=[];for(b=0,h=j.length;b<h;b++)i=j[b],f=b===j.length-1?"":i===g||i instanceof k?"\n":",\n",e=i instanceof k?"":c,i instanceof U&&i["this"]&&(i=new d(i.properties[0].name,i,"object")),i instanceof k||(i instanceof d||(i=new d(i,i,"object")),(i.variable.base||i.variable).asKey=!0),l.push(e+i.compile(a,y)+f);return l}(),j=j.join(""),h="{"+(j&&"\n"+j+"\n"+this.tab)+"}";return this.front?"("+h+")":h},a.prototype.assigns=function(a){var b,c,d,e;e=this.properties;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Arr=c=function(){function a(a){this.objects=a||[]}bi(a,e),a.prototype.children=["objects"],a.prototype.compileNode=function(a){var b,c;if(!this.objects.length)return"[]";a.indent+=O;if(b=M.compileSplattedArray(a,this.objects))return b;b=function(){var b,d,e,f;e=this.objects,f=[];for(b=0,d=e.length;b<d;b++)c=e[b],f.push(c.compile(a,v));return f}.call(this).join(", ");return b.indexOf("\n")<0?"["+b+"]":"[\n"+a.indent+b+"\n"+this.tab+"]"},a.prototype.assigns=function(a){var b,c,d,e;e=this.objects;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Class=h=function(){function a(a,b,c){this.variable=a,this.parent=b,this.body=c!=null?c:new f,this.boundFuncs=[],this.body.classBody=!0}bi(a,e),a.prototype.children=["variable","parent","body"],a.prototype.determineName=function(){var a,c;if(!this.variable)return null;a=(c=ba(this.variable.properties))?c instanceof b&&c.name.value:this.variable.base.value;return a&&(a=o.test(a)&&a)},a.prototype.setContext=function(a){return this.body.traverseChildren(!1,function(b){if(b.classBody)return!1;if(b instanceof z&&b.value==="this")return b.value=a;if(b instanceof j){b.klass=a;if(b.bound)return b.context=a}})},a.prototype.addBoundFunctions=function(a){var b,c,d,e,f,g;if(this.boundFuncs.length){f=this.boundFuncs,g=[];for(d=0,e=f.length;d<e;d++)c=f[d],b=c.compile(a),g.push(this.ctor.body.unshift(new z("this."+b+" = "+bf("bind")+"(this."+b+", this);")));return g}},a.prototype.addProperties=function(a,c){var e,f,g,h,i;h=a.base.properties.slice(0),i=[];while(e=h.shift()){if(e instanceof d){f=e.variable.base,delete e.context,g=e.value;if(f.value==="constructor"){if(this.ctor)throw new Error("cannot define more than one constructor in a class");if(g.bound)throw new Error("cannot define a constructor as a bound function");g instanceof j?e=this.ctor=g:e=this.ctor=new d(new U(new z(c)),g)}else e.variable["this"]||(e.variable=new U(new z(c),[new b(f,"proto")])),g instanceof j&&g.bound&&(this.boundFuncs.push(f),g.bound=!1)}i.push(e)}return i},a.prototype.walkBody=function(b){return this.traverseChildren(!1,bj(function(c){var d,e,g,h,i;if(c instanceof a)return!1;if(c instanceof f){i=d=c.expressions;for(e=0,h=i.length;e<h;e++)g=i[e],g instanceof U&&g.isObject(!0)&&(d[e]=this.addProperties(g,b));return c.expressions=d=_(d)}},this))},a.prototype.ensureConstructor=function(a){this.ctor||(this.ctor=new j,this.parent&&this.ctor.body.push(new g("super",[new M(new z("arguments"))])),this.body.expressions.unshift(this.ctor)),this.ctor.ctor=this.ctor.name=a,this.ctor.klass=null;return this.ctor.noReturn=!0},a.prototype.compileNode=function(a){var b,c,e,f;b=this.determineName(),f=b||this.name||"_Class",e=new z(f),this.setContext(f),this.walkBody(f),this.parent&&this.body.expressions.unshift(new m(e,this.parent)),this.ensureConstructor(f),this.body.expressions.push(e),this.addBoundFunctions(a),c=new F(i.wrap(this.body),!0),this.variable&&(c=new d(this.variable,c));return c.compile(a)};return a}(),a.Assign=d=function(){function a(a,b,c,d){this.variable=a,this.value=b,this.context=c,this.param=d&&d.param}bi(a,e),a.prototype.METHOD_DEF=/^(?:(\S+)\.prototype\.|\S+?)?\b([$A-Za-z_][$\w\x7f-\uffff]*)$/,a.prototype.children=["variable","value"],a.prototype.assigns=function(a){return this[this.context==="object"?"value":"variable"].assigns(a)},a.prototype.unfoldSoak=function(a){return be(a,this,"variable")},a.prototype.compileNode=function(a){var b,c,d,e,f;if(b=this.variable instanceof U){if(this.variable.isArray()||this.variable.isObject())return this.compilePatternMatch(a);if(this.variable.isSplice())return this.compileSplice(a);if((f=this.context)==="||="||f==="&&="||f==="?=")return this.compileConditional(a)}d=this.variable.compile(a,v),this.value instanceof j&&(c=this.METHOD_DEF.exec(d))&&(this.value.name=c[2],c[1]&&(this.value.klass=c[1])),e=this.value.compile(a,v);if(this.context==="object")return""+d+": "+e;if(!this.variable.isAssignable())throw SyntaxError('"'+this.variable.compile(a)+'" cannot be assigned.');this.context||b&&(this.variable.namespaced||this.variable.hasProperties())||(this.param?a.scope.add(d,"var"):a.scope.find(d)),e=d+(" "+(this.context||"=")+" ")+e;return a.level>v?"("+e+")":e},a.prototype.compilePatternMatch=function(c){var d,e,f,g,h,i,j,k,l,m,n,p,q,r,t,u,x,A,B,C,D,E;r=c.level===y,u=this.value,l=this.variable.base.objects;if(!(m=l.length)){if(r)return!1;f=u.compile(c);return c.level<w?f:"("+f+")"}i=this.variable.isObject();if(r&&m===1&&!((k=l[0])instanceof M)){k instanceof a?(B=k,h=B.variable.base,k=B.value):k.base instanceof F?(C=(new U(k.unwrapAll())).cacheReference(c),k=C[0],h=C[1]):h=i?k["this"]?k.properties[0].name:k:new z(0),d=o.test(h.unwrap().value||0),u=new U(u),u.properties.push(new(d?b:s)(h));return(new a(k,u)).compile(c)}x=u.compile(c,v),e=[],q=!1;if(!o.test(x)||this.variable.assigns(x))e.push(""+(n=c.scope.freeVariable("ref"))+" = "+x),x=n;for(g=0,A=l.length;g<A;g++){k=l[g],h=g,i&&(k instanceof a?(D=k,h=D.variable.base,k=D.value):k.base instanceof F?(E=(new U(k.unwrapAll())).cacheReference(c),k=E[0],h=E[1]):h=k["this"]?k.properties[0].name:k);if(!q&&k instanceof M)t=""+m+" <= "+x+".length ? "+bf("slice")+".call("+x+", "+g,(p=m-g-1)?(j=c.scope.freeVariable("i"),t+=", "+j+" = "+x+".length - "+p+") : ("+j+" = "+g+", [])"):t+=") : []",t=new z(t),q=""+j+"++";else{if(k instanceof M){k=k.name.compile(c);throw SyntaxError("multiple splats are disallowed in an assignment: "+k+" ...")}typeof h==="number"?(h=new z(q||h),d=!1):d=i&&o.test(h.unwrap().value||0),t=new U(new z(x),[new(d?b:s)(h)])}e.push((new a(k,t,null,{param:this.param})).compile(c,y))}r||e.push(x),f=X(e).join(", ");return c.level<v?f:"("+f+")"},a.prototype.compileConditional=function(b){var c,d,e;e=this.variable.cacheReference(b),c=e[0],d=e[1];return(new D(this.context.slice(0,-1),c,new a(d,this.value,"="))).compile(b)},a.prototype.compileSplice=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;k=this.variable.properties.pop().range,d=k.from,h=k.to,c=k.exclusive,g=this.variable.compile(a),l=(d!=null?d.cache(a,w):void 0)||["0","0"],e=l[0],f=l[1],h?(d!=null?d.isSimpleNumber():void 0)&&h.isSimpleNumber()?(h=+h.compile(a)- +f,c||(h+=1)):(h=h.compile(a)+" - "+f,c||(h+=" + 1")):h="9e9",m=this.value.cache(a,v),i=m[0],j=m[1],b="[].splice.apply("+g+", ["+e+", "+h+"].concat("+i+")), "+j;return a.level>y?"("+b+")":b};return a}(),a.Code=j=function(){function a(a,b,c){this.params=a||[],this.body=b||new f,this.bound=c==="boundfunc",this.bound&&(this.context="this")}bi(a,e),a.prototype.children=["params","body"],a.prototype.isStatement=function(){return!!this.ctor},a.prototype.jumps=B,a.prototype.compileNode=function(a){var b,e,f,g,h,i,j,k,l,m,n,o,p,r,s,u,v,w,x,y,A;a.scope=new K(a.scope,this.body,this),a.scope.shared=Y(a,"sharedScope"),a.indent+=O,delete a.bare,delete a.globals,o=[],e=[],x=this.params;for(r=0,u=x.length;r<u;r++){j=x[r];if(j.splat){l=new d(new U(new c(function(){var b,c,d,e;d=this.params,e=[];for(b=0,c=d.length;b<c;b++)i=d[b],e.push(i.asReference(a));return e}.call(this))),new U(new z("arguments")));break}}y=this.params;for(s=0,v=y.length;s<v;s++)j=y[s],j.isComplex()?(n=k=j.asReference(a),j.value&&(n=new D("?",k,j.value)),e.push(new d(new U(j.name),n,"=",{param:!0}))):(k=j,j.value&&(h=new z(k.name.value+" == null"),n=new d(new U(j.name),j.value,"="),e.push(new q(h,n)))),l||o.push(k);p=this.body.isEmpty(),l&&e.unshift(l),e.length&&(A=this.body.expressions).unshift.apply(A,e);if(!l)for(f=0,w=o.length;f<w;f++)m=o[f],a.scope.parameter(o[f]=m.compile(a));!p&&!this.noReturn&&this.body.makeReturn(),g=a.indent,b="function",this.ctor&&(b+=" "+this.name),b+="("+o.join(", ")+") {",this.body.isEmpty()||(b+="\n"+this.body.compileWithDeclarations(a)+"\n"+this.tab),b+="}";if(this.ctor)return this.tab+b;if(this.bound)return bf("bind")+("("+b+", "+this.context+")");return this.front||a.level>=t?"("+b+")":b},a.prototype.traverseChildren=function(b,c){if(b)return a.__super__.traverseChildren.call(this,b,c)};return a}(),a.Param=E=function(){function a(a,b,c){this.name=a,this.value=b,this.splat=c}bi(a,e),a.prototype.children=["name","value"],a.prototype.compile=function(a){return this.name.compile(a,v)},a.prototype.asReference=function(a){var b;if(this.reference)return this.reference;b=this.name,b["this"]?(b=b.properties[0].name,b.value.reserved&&(b=new z("_"+b.value))):b.isComplex()&&(b=new z(a.scope.freeVariable("arg"))),b=new U(b),this.splat&&(b=new M(b));return this.reference=b},a.prototype.isComplex=function(){return this.name.isComplex()};return a}(),a.Splat=M=function(){function a(a){this.name=a.compile?a:new z(a)}bi(a,e),a.prototype.children=["name"],a.prototype.isAssignable=W,a.prototype.assigns=function(a){return this.name.assigns(a)},a.prototype.compile=function(a){return this.index!=null?this.compileParam(a):this.name.compile(a)},a.compileSplattedArray=function(b,c,d){var e,f,g,h,i,j,k;i=-1;while((j=c[++i])&&!(j instanceof a))continue;if(i>=c.length)return"";if(c.length===1){g=c[0].compile(b,v);if(d)return g;return""+bf("slice")+".call("+g+")"}e=c.slice(i);for(h=0,k=e.length;h<k;h++)j=e[h],g=j.compile(b,v),e[h]=j instanceof a?""+bf("slice")+".call("+g+")":"["+g+"]";if(i===0)return e[0]+(".concat("+e.slice(1).join(", ")+")");f=function(){var a,d,e,f;e=c.slice(0,i),f=[];for(a=0,d=e.length;a<d;a++)j=e[a],f.push(j.compile(b,v));return f}();return"["+f.join(", ")+"].concat("+e.join(", ")+")"};return a}(),a.While=V=function(){function a(a,b){this.condition=(b!=null?b.invert:void 0)?a.invert():a,this.guard=b!=null?b.guard:void 0}bi(a,e),a.prototype.children=["condition","guard","body"],a.prototype.isStatement=W,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.addBody=function(a){this.body=a;return this},a.prototype.jumps=function(){var a,b,c,d;a=this.body.expressions;if(!a.length)return!1;for(c=0,d=a.length;c<d;c++){b=a[c];if(b.jumps({loop:!0}))return b}return!1},a.prototype.compileNode=function(a){var b,c,d,e;a.indent+=O,e="",b=this.body;if(b.isEmpty())b="";else{if(a.level>y||this.returns)d=a.scope.freeVariable("results"),e=""+this.tab+d+" = [];\n",b&&(b=G.wrap(d,b));this.guard&&(b=f.wrap([new q(this.guard,b)])),b="\n"+b.compile(a,y)+"\n"+this.tab}c=e+this.tab+("while ("+this.condition.compile(a,x)+") {"+b+"}"),this.returns&&(c+="\n"+this.tab+"return "+d+";");return c};return a}(),a.Op=D=function(){function c(b,c,d,e){if(b==="in")return new r(c,d);if(b==="do")return new g(c,c.params||[]);if(b==="new"){if(c instanceof g)return c.newInstance();c instanceof j&&c.bound&&(c=new F(c))}this.operator=a[b]||b,this.first=c,this.second=d,this.flip=!!e;return this}var a,b;bi(c,e),a={"==":"===","!=":"!==",of:"in"},b={"!==":"===","===":"!=="},c.prototype.children=["first","second"],c.prototype.isSimpleNumber=B,c.prototype.isUnary=function(){return!this.second},c.prototype.isChainable=function(){var a;return(a=this.operator)==="<"||a===">"||a===">="||a==="<="||a==="==="||a==="!=="},c.prototype.invert=function(){var a,d,e,f,g;if(this.isChainable()&&this.first.isChainable()){a=!0,d=this;while(d&&d.operator)a&&(a=d.operator in b),d=d.first;if(!a)return(new F(this)).invert();d=this;while(d&&d.operator)d.invert=!d.invert,d.operator=b[d.operator],d=d.first;return this}if(f=b[this.operator]){this.operator=f,this.first.unwrap()instanceof c&&this.first.invert();return this}return this.second?(new F(this)).invert():this.operator==="!"&&(e=this.first.unwrap())instanceof c&&((g=e.operator)==="!"||g==="in"||g==="instanceof")?e:new c("!",this)},c.prototype.unfoldSoak=function(a){var b;return((b=this.operator)==="++"||b==="--"||b==="delete")&&be(a,this,"first")},c.prototype.compileNode=function(a){var b;if(this.isUnary())return this.compileUnary(a);if(this.isChainable()&&this.first.isChainable())return this.compileChain(a);if(this.operator==="?")return this.compileExistence(a);this.first.front=this.front,b=this.first.compile(a,w)+" "+this.operator+" "+this.second.compile(a,w);return a.level>w?"("+b+")":b},c.prototype.compileChain=function(a){var b,c,d,e;e=this.first.second.cache(a),this.first.second=e[0],d=e[1],c=this.first.compile(a,w),b=""+c+" "+(this.invert?"&&":"||")+" "+d.compile(a)+" "+this.operator+" "+this.second.compile(a,w);return"("+b+")"},c.prototype.compileExistence=function(a){var b,c;this.first.isComplex()?(c=a.scope.freeVariable("ref"),b=new F(new d(new z(c),this.first))):(b=this.first,c=b.compile(a));return(new l(b)).compile(a)+(" ? "+c+" : "+this.second.compile(a,v))},c.prototype.compileUnary=function(a){var b,d;d=[b=this.operator],(b==="new"||b==="typeof"||b==="delete"||(b==="+"||b==="-")&&this.first instanceof c&&this.first.operator===b)&&d.push(" "),d.push(this.first.compile(a,w)),this.flip&&d.reverse();return d.join("")},c.prototype.toString=function(a){return c.__super__.toString.call(this,a,this.constructor.name+" "+this.operator)};return c}(),a.In=r=function(){function a(a,b){this.object=a,this.array=b}bi(a,e),a.prototype.children=["object","array"],a.prototype.invert=A,a.prototype.compileNode=function(a){return this.array instanceof U&&this.array.isArray()?this.compileOrTest(a):this.compileLoopTest(a)},a.prototype.compileOrTest=function(a){var b,c,d,e,f,g,h,i,j;i=this.object.cache(a,w),g=i[0],f=i[1],j=this.negated?[" !== "," && "]:[" === "," || "],b=j[0],c=j[1],h=function(){var c,h,i;h=this.array.base.objects,i=[];for(d=0,c=h.length;d<c;d++)e=h[d],i.push((d?f:g)+b+e.compile(a,w));return i}.call(this),h=h.join(c);return a.level<w?h:"("+h+")"},a.prototype.compileLoopTest=function(a){var b,c,d,e;e=this.object.cache(a,v),d=e[0],c=e[1],b=bf("indexOf")+(".call("+this.array.compile(a,v)+", "+c+") ")+(this.negated?"< 0":">= 0");if(d===c)return b;b=d+", "+b;return a.level<v?b:"("+b+")"},a.prototype.toString=function(b){return a.__super__.toString.call(this,b,this.constructor.name+(this.negated?"!":""))};return a}(),a.Try=S=function(){function a(a,b,c,d){this.attempt=a,this.error=b,this.recovery=c,this.ensure=d}bi(a,e),a.prototype.children=["attempt","recovery","ensure"],a.prototype.isStatement=W,a.prototype.jumps=function(a){var b;return this.attempt.jumps(a)||((b=this.recovery)!=null?b.jumps(a):void 0)},a.prototype.makeReturn=function(){this.attempt&&(this.attempt=this.attempt.makeReturn()),this.recovery&&(this.recovery=this.recovery.makeReturn());return this},a.prototype.compileNode=function(a){var b,c;a.indent+=O,c=this.error?" ("+this.error.compile(a)+") ":" ",b=this.recovery?" catch"+c+"{\n"+this.recovery.compile(a,y)+"\n"+this.tab+"}":!this.ensure&&!this.recovery?" catch (_e) {}":void 0;return""+this.tab+"try {\n"+this.attempt.compile(a,y)+"\n"+this.tab+"}"+(b||"")+(this.ensure?" finally {\n"+this.ensure.compile(a,y)+"\n"+this.tab+"}":"")};return a}(),a.Throw=R=function(){function a(a){this.expression=a}bi(a,e),a.prototype.children=["expression"],a.prototype.isStatement=W,a.prototype.jumps=B,a.prototype.makeReturn=P,a.prototype.compileNode=function(a){return this.tab+("throw "+this.expression.compile(a)+";")};return a}(),a.Existence=l=function(){function a(a){this.expression=a}bi(a,e),a.prototype.children=["expression"],a.prototype.invert=A,a.prototype.compileNode=function(a){var b,c;b=this.expression.compile(a,w),b=o.test(b)&&!a.scope.check(b)?this.negated?"typeof "+b+' == "undefined" || '+b+" === null":"typeof "+b+' != "undefined" && '+b+" !== null":(c=this.negated?"==":"!=",""+b+" "+c+" null");return a.level>u?"("+b+")":b};return a}(),a.Parens=F=function(){function a(a){this.body=a}bi(a,e),a.prototype.children=["body"],a.prototype.unwrap=function(){return this.body},a.prototype.isComplex=function(){return this.body.isComplex()},a.prototype.makeReturn=function(){return this.body.makeReturn()},a.prototype.compileNode=function(a){var b,c,d;d=this.body.unwrap();if(d instanceof U&&d.isAtomic()){d.front=this.front;return d.compile(a)}c=d.compile(a,x),b=a.level<w&&(d instanceof D||d instanceof g||d instanceof n&&d.returns);return b?c:"("+c+")"};return a}(),a.For=n=function(){function a(a,b){var c;this.source=b.source,this.guard=b.guard,this.step=b.step,this.name=b.name,this.index=b.index,this.body=f.wrap([a]),this.own=!!b.own,this.object=!!b.object,this.object&&(c=[this.index,this.name],this.name=c[0],this.index=c[1]);if(this.index instanceof U)throw SyntaxError("index cannot be a pattern matching expression");this.range=this.source instanceof U&&this.source.base instanceof H&&!this.source.properties.length,this.pattern=this.name instanceof U;if(this.range&&this.index)throw SyntaxError("indexes do not apply to range loops");if(this.range&&this.pattern)throw SyntaxError("cannot pattern match over range loops");this.returns=!1}bi(a,e),a.prototype.children=["body","source","guard","step"],a.prototype.isStatement=W,a.prototype.jumps=V.prototype.jumps,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.compileNode=function(a){var b,c,e,g,h,i,j,k,l,m,n,p,r,s,t,u,x,A,B,C,D;b=f.wrap([this.body]),k=(D=ba(b.expressions))!=null?D.jumps():void 0,k&&k instanceof I&&(this.returns=!1),x=this.range?this.source.base:this.source,u=a.scope,m=this.name&&this.name.compile(a,v),i=this.index&&this.index.compile(a,v),m&&!this.pattern&&u.find(m,{immediate:!0}),i&&u.find(i,{immediate:!0}),this.returns&&(t=u.freeVariable("results")),j=(this.range?m:i)||u.freeVariable("i"),this.pattern&&(m=j),C="",g="",c="",h=this.tab+O,this.range?e=x.compile(bb(a,{index:j,step:this.step})):(B=this.source.compile(a,v),(m||this.own)&&!o.test(B)&&(c=""+this.tab+(p=u.freeVariable("ref"))+" = "+B+";\n",B=p),m&&!this.pattern&&(n=""+m+" = "+B+"["+j+"]"),this.object||(l=u.freeVariable("len"),A=this.step?""+j+" += "+this.step.compile(a,w):""+j+"++",e=""+j+" = 0, "+l+" = "+B+".length; "+j+" < "+l+"; "+A)),this.returns&&(r=""+this.tab+t+" = [];\n",s="\n"+this.tab+"return "+t+";",b=G.wrap(t,b)),this.guard&&(b=f.wrap([new q(this.guard,b)])),this.pattern&&b.expressions.unshift(new d(this.name,new z(""+B+"["+j+"]"))),c+=this.pluckDirectCall(a,b),n&&(C="\n"+h+n+";"),this.object&&(e=""+j+" in "+B,this.own&&(g="\n"+h+"if (!"+bf("hasProp")+".call("+B+", "+j+")) continue;")),b=b.compile(bb(a,{indent:h}),y),b&&(b="\n"+b+"\n");return""+c+(r||"")+this.tab+"for ("+e+") {"+g+C+b+this.tab+"}"+(s||"")},a.prototype.pluckDirectCall=function(a,b){var c,e,f,h,i,k,l,m,n,o,p,q,r,s;e="",n=b.expressions;for(i=0,m=n.length;i<m;i++){f=n[i],f=f.unwrapAll();if(!(f instanceof g))continue;l=f.variable.unwrapAll();if(!(l instanceof j||l instanceof U&&((o=l.base)!=null?o.unwrapAll():void 0)instanceof j&&l.properties.length===1&&((p=(q=l.properties[0].name)!=null?q.value:void 0)==="call"||p==="apply")))continue;h=((r=l.base)!=null?r.unwrapAll():void 0)||l,k=new z(a.scope.freeVariable("fn")),c=new U(k),l.base&&(s=[c,l],l.base=s[0],c=s[1],args.unshift(new z("this"))),b.expressions[i]=new g(c,f.args),e+=this.tab+(new d(k,h)).compile(a,y)+";\n"}return e};return a}(),a.Switch=N=function(){function a(a,b,c){this.subject=a,this.cases=b,this.otherwise=c}bi(a,e),a.prototype.children=["subject","cases","otherwise"],a.prototype.isStatement=W,a.prototype.jumps=function(a){var b,c,d,e,f,g,h;a==null&&(a={block:!0}),f=this.cases;for(d=0,e=f.length;d<e;d++){g=f[d],c=g[0],b=g[1];if(b.jumps(a))return b}return(h=this.otherwise)!=null?h.jumps(a):void 0},a.prototype.makeReturn=function(){var a,b,c,d,e;d=this.cases;for(b=0,c=d.length;b<c;b++)a=d[b],a[1].makeReturn();(e=this.otherwise)!=null&&e.makeReturn();return this},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;i=a.indent+O,j=a.indent=i+O,d=this.tab+("switch ("+(((n=this.subject)!=null?n.compile(a,x):void 0)||!1)+") {\n"),o=this.cases;for(h=0,l=o.length;h<l;h++){p=o[h],f=p[0],b=p[1],q=_([f]);for(k=0,m=q.length;k<m;k++)e=q[k],this.subject||(e=e.invert()),d+=i+("case "+e.compile(a,x)+":\n");if(c=b.compile(a,y))d+=c+"\n";if(h===this.cases.length-1&&!this.otherwise)break;g=this.lastNonComment(b.expressions);if(g instanceof I||g instanceof z&&g.jumps()&&g.value!=="debugger")continue;d+=j+"break;\n"}this.otherwise&&this.otherwise.expressions.length&&(d+=i+("default:\n"+this.otherwise.compile(a,y)+"\n"));return d+this.tab+"}"};return a}(),a.If=q=function(){function a(a,b,c){this.body=b,c==null&&(c={}),this.condition=c.type==="unless"?a.invert():a,this.elseBody=null,this.isChain=!1,this.soak=c.soak}bi(a,e),a.prototype.children=["condition","body","elseBody"],a.prototype.bodyNode=function(){var a;return(a=this.body)!=null?a.unwrap():void 0},a.prototype.elseBodyNode=function(){var a;return(a=this.elseBody)!=null?a.unwrap():void 0},a.prototype.addElse=function(b){this.isChain?this.elseBodyNode().addElse(b):(this.isChain=b instanceof a,this.elseBody=this.ensureBlock(b));return this},a.prototype.isStatement=function(a){var b;return(a!=null?a.level:void 0)===y||this.bodyNode().isStatement(a)||((b=this.elseBodyNode())!=null?b.isStatement(a):void 0)},a.prototype.jumps=function(a){var b;return this.body.jumps(a)||((b=this.elseBody)!=null?b.jumps(a):void 0)},a.prototype.compileNode=function(a){return this.isStatement(a)?this.compileStatement(a):this.compileExpression(a)},a.prototype.makeReturn=function(){this.body&&(this.body=new f([this.body.makeReturn()])),this.elseBody&&(this.elseBody=new f([this.elseBody.makeReturn()]));return this},a.prototype.ensureBlock=function(a){return a instanceof f?a:new f([a])},a.prototype.compileStatement=function(a){var b,c,d,e;c=Y(a,"chainChild"),d=this.condition.compile(a,x),a.indent+=O,b=this.ensureBlock(this.body).compile(a),b&&(b="\n"+b+"\n"+this.tab),e="if ("+d+") {"+b+"}",c||(e=this.tab+e);if(!this.elseBody)return e;return e+" else "+(this.isChain?(a.indent=this.tab,a.chainChild=!0,this.elseBody.unwrap().compile(a,y)):"{\n"+this.elseBody.compile(a,y)+"\n"+this.tab+"}")},a.prototype.compileExpression=function(a){var b,c,d,e;e=this.condition.compile(a,u),c=this.bodyNode().compile(a,v),b=this.elseBodyNode()?this.elseBodyNode().compile(a,v):"void 0",d=""+e+" ? "+c+" : "+b;return a.level<u?d:"("+d+")"},a.prototype.unfoldSoak=function(){return this.soak&&this};return a}(),G={wrap:function(a,c){if(c.isEmpty()||ba(c.expressions).jumps())return c;return c.push(new g(new U(new z(a),[new b(new z("push"))]),[c.pop()]))}},i={wrap:function(a,c,d){var e,h,i,k,l;if(a.jumps())return a;i=new j([],f.wrap([a])),e=[];if((k=a.contains(this.literalArgs))||a.contains(this.literalThis))l=new z(k?"apply":"call"),e=[new z("this")],k&&e.push(new z("arguments")),i=new U(i,[new b(l)]);i.noReturn=d,h=new g(i,e);return c?f.wrap([h]):h},literalArgs:function(a){return a instanceof z&&a.value==="arguments"&&!a.asKey},literalThis:function(a){return a instanceof z&&a.value==="this"&&!a.asKey||a instanceof j&&a.bound}},be=function(a,b,c){var d;if(d=b[c].unfoldSoak(a)){b[c]=d.body,d.body=new U(b);return d}},T={"extends":"function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}",bind:"function(fn, me){ return function(){ return fn.apply(me, arguments); }; }",indexOf:"Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}",hasProp:"Object.prototype.hasOwnProperty",slice:"Array.prototype.slice"},y=1,x=2,v=3,u=4,w=5,t=6,O="  ",Q=/[ \t]+$/gm,o=/^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*$/,J=/^[+-]?\d+$/,p=/^['"]/,bf=function(a){var b;b="__"+a,K.root.assign(b,T[a]);return b},bc=function(a,b){return a.replace(/\n/g,"$&"+b)}}).call(this)},require["./coffee-script"]=new function(){var exports=this;(function(){var Lexer,RESERVED,compile,fs,lexer,parser,path,_ref;fs=require("fs"),path=require("path"),_ref=require("./lexer"),Lexer=_ref.Lexer,RESERVED=_ref.RESERVED,parser=require("./parser").parser,require.extensions?require.extensions[".coffee"]=function(a,b){var c;c=compile(fs.readFileSync(b,"utf8"));return a._compile(c,b)}:require.registerExtension&&require.registerExtension(".coffee",function(a){return compile(a)}),exports.VERSION="1.0.1",exports.RESERVED=RESERVED,exports.helpers=require("./helpers"),exports.compile=compile=function(a,b){b==null&&(b={});try{return parser.parse(lexer.tokenize(a)).compile(b)}catch(c){b.filename&&(c.message="In "+b.filename+", "+c.message);throw c}},exports.tokens=function(a,b){return lexer.tokenize(a,b)},exports.nodes=function(a,b){return typeof a==="string"?parser.parse(lexer.tokenize(a,b)):parser.parse(a)},exports.run=function(a,b){var c;c=module;while(c.parent)c=c.parent;c.filename=b.filename?fs.realpathSync(b.filename):".",c.moduleCache&&(c.moduleCache={});return path.extname(c.filename)!==".coffee"||require.extensions?c._compile(compile(a,b),c.filename):c._compile(a,c.filename)},exports.eval=function(code,options){var __dirname,__filename;__filename=module.filename=options.filename,__dirname=path.dirname(__filename);return eval(compile(code,options))},lexer=new Lexer,parser.lexer={lex:function(){var a,b;b=this.tokens[this.pos++]||[""],a=b[0],this.yytext=b[1],this.yylineno=b[2];return a},setInput:function(a){this.tokens=a;return this.pos=0},upcomingInput:function(){return""}},parser.yy=require("./nodes")}).call(this)},require["./browser"]=new function(){var exports=this;(function(){var CoffeeScript,runScripts;CoffeeScript=require("./coffee-script"),CoffeeScript.require=require,CoffeeScript.eval=function(code,options){return eval(CoffeeScript.compile(code,options))},CoffeeScript.run=function(a,b){b==null&&(b={}),b.bare=!0;return Function(CoffeeScript.compile(a,b))()};typeof window!="undefined"&&window!==null&&(CoffeeScript.load=function(a,b){var c;c=new(window.ActiveXObject||XMLHttpRequest)("Microsoft.XMLHTTP"),c.open("GET",a,!0),"overrideMimeType"in c&&c.overrideMimeType("text/plain"),c.onreadystatechange=function(){if(c.readyState===4)return CoffeeScript.run(c.responseText,b)};return c.send(null)},runScripts=function(){var a,b,c,d;d=document.getElementsByTagName("script");for(b=0,c=d.length;b<c;b++)a=d[b],a.type==="text/coffeescript"&&(a.src?CoffeeScript.load(a.src):CoffeeScript.run(a.innerHTML));return null},window.addEventListener?addEventListener("DOMContentLoaded",runScripts,!1):attachEvent("onload",runScripts))}).call(this)};return require["./coffee-script"]}()
;
(function() {
  var lookup, names, normalizeKey, parseHex, parseRGB, rgbParser;
  rgbParser = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),?\s*(\d?\.?\d*)?\)$/;
  parseHex = function(hexString) {
    hexString = hexString.replace(/#/, '');
    switch (hexString.length) {
      case 3:
      case 4:
        return [parseInt(hexString.substr(0, 1), 16) * 0x11, parseInt(hexString.substr(1, 1), 16) * 0x11, parseInt(hexString.substr(2, 1), 16) * 0x11, hexString.substr(3, 1).length ? (parseInt(hexString.substr(3, 1), 16) * 0x11) / 255.0 : null];
      case 6:
      case 8:
        return [parseInt(hexString.substr(0, 2), 16), parseInt(hexString.substr(2, 2), 16), parseInt(hexString.substr(4, 2), 16), hexString.substr(6, 2).length ? parseInt(hexString.substr(6, 2), 16) / 255.0 : 1.0];
      default:
        return undefined;
    }
  };
  parseRGB = function(colorString) {
    var _ref, bits;
    if (!(bits = rgbParser.exec(colorString))) {
      return null;
    }
    return [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3]), (typeof (_ref = bits[4]) !== "undefined" && _ref !== null) ? parseFloat(bits[4]) : 1.0];
  };
  normalizeKey = function(key) {
    return key.toString().toLowerCase().split(' ').join('');
  };
  window.Color = function(color) {
    var _ref, a, alpha, c, channels, parsedColor, self;
    if (arguments[0] == null ? undefined : arguments[0].channels) {
      return Color(arguments[0].channels());
    }
    parsedColor = null;
    if (arguments.length === 0) {
      parsedColor = [0, 0, 0, 0];
    } else if (arguments.length === 1 && Object.prototype.toString.call(arguments[0]) === '[object Array]') {
      alpha = (typeof (_ref = arguments[0][3]) !== "undefined" && _ref !== null) ? arguments[0][3] : 1;
      parsedColor = [parseInt(arguments[0][0]), parseInt(arguments[0][1]), parseInt(arguments[0][2]), parseFloat(alpha)];
    } else if (arguments.length === 2) {
      c = arguments[0];
      a = arguments[1];
      if (Object.prototype.toString.call(c) === '[object Array]') {
        parsedColor = [parseInt(c[0]), parseInt(c[1]), parseInt(c[2]), parseFloat(a)];
      } else if (Object.prototype.toString.call(c) !== '[object Array]') {
        parsedColor = lookup[normalizeKey(c)] || parseHex(c) || parseRGB(c);
        parsedColor[3] = a;
      }
    } else if (arguments.length > 2) {
      alpha = (typeof (_ref = arguments[3]) !== "undefined" && _ref !== null) ? arguments[3] : 1;
      parsedColor = [parseInt(arguments[0]), parseInt(arguments[1]), parseInt(arguments[2]), parseFloat(alpha)];
    } else {
      c = arguments[0];
      parsedColor = lookup[normalizeKey(c)] || parseHex(c) || parseRGB(c);
    }
    if (!(parsedColor)) {
      return null;
    }
    alpha = parsedColor[3];
    channels = [parsedColor[0], parsedColor[1], parsedColor[2], (typeof alpha !== "undefined" && alpha !== null) ? parseFloat(alpha) : 0.0];
    self = {
      channels: function() {
        return channels.copy();
      },
      r: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[0] = val;
          return self;
        } else {
          return channels[0];
        }
      },
      g: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[1] = val;
          return self;
        } else {
          return channels[1];
        }
      },
      b: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[2] = val;
          return self;
        } else {
          return channels[2];
        }
      },
      a: function(val) {
        if (typeof val !== "undefined" && val !== null) {
          channels[3] = val;
          return self;
        } else {
          return channels[3];
        }
      },
      equals: function(other) {
        return other.r() === self.r() && other.g() === self.g() && other.b() === self.b() && other.a() === self.a();
      },
      rgba: function() {
        return "rgba(" + (self.r()) + ", " + (self.g()) + ", " + (self.b()) + ", " + (self.a()) + ")";
      },
      toHex: function() {
        var hexFromNumber, hexString, padString;
        hexString = function(number) {
          return number.toString(16);
        };
        padString = function(hexString) {
          if (hexString.length === 1) {
            return (hexString = "0" + hexString);
          }
          return hexString;
        };
        hexFromNumber = function(number) {
          return padString(hexString(number));
        };
        return "#" + (hexFromNumber(channels[0])) + (hexFromNumber(channels[1])) + (hexFromNumber(channels[2]));
      },
      toString: function() {
        return self.rgba();
      }
    };
    return self;
  };
  lookup = {};
  names = [["000000", "Black"], ["000080", "Navy Blue"], ["0000C8", "Dark Blue"], ["0000FF", "Blue"], ["000741", "Stratos"], ["001B1C", "Swamp"], ["002387", "Resolution Blue"], ["002900", "Deep Fir"], ["002E20", "Burnham"], ["002FA7", "International Klein Blue"], ["003153", "Prussian Blue"], ["003366", "Midnight Blue"], ["003399", "Smalt"], ["003532", "Deep Teal"], ["003E40", "Cyprus"], ["004620", "Kaitoke Green"], ["0047AB", "Cobalt"], ["004816", "Crusoe"], ["004950", "Sherpa Blue"], ["0056A7", "Endeavour"], ["00581A", "Camarone"], ["0066CC", "Science Blue"], ["0066FF", "Blue Ribbon"], ["00755E", "Tropical Rain Forest"], ["0076A3", "Allports"], ["007BA7", "Deep Cerulean"], ["007EC7", "Lochmara"], ["007FFF", "Azure Radiance"], ["008080", "Teal"], ["0095B6", "Bondi Blue"], ["009DC4", "Pacific Blue"], ["00A693", "Persian Green"], ["00A86B", "Jade"], ["00CC99", "Caribbean Green"], ["00CCCC", "Robin's Egg Blue"], ["00FF00", "Green"], ["00FF7F", "Spring Green"], ["00FFFF", "Cyan / Aqua"], ["010D1A", "Blue Charcoal"], ["011635", "Midnight"], ["011D13", "Holly"], ["012731", "Daintree"], ["01361C", "Cardin Green"], ["01371A", "County Green"], ["013E62", "Astronaut Blue"], ["013F6A", "Regal Blue"], ["014B43", "Aqua Deep"], ["015E85", "Orient"], ["016162", "Blue Stone"], ["016D39", "Fun Green"], ["01796F", "Pine Green"], ["017987", "Blue Lagoon"], ["01826B", "Deep Sea"], ["01A368", "Green Haze"], ["022D15", "English Holly"], ["02402C", "Sherwood Green"], ["02478E", "Congress Blue"], ["024E46", "Evening Sea"], ["026395", "Bahama Blue"], ["02866F", "Observatory"], ["02A4D3", "Cerulean"], ["03163C", "Tangaroa"], ["032B52", "Green Vogue"], ["036A6E", "Mosque"], ["041004", "Midnight Moss"], ["041322", "Black Pearl"], ["042E4C", "Blue Whale"], ["044022", "Zuccini"], ["044259", "Teal Blue"], ["051040", "Deep Cove"], ["051657", "Gulf Blue"], ["055989", "Venice Blue"], ["056F57", "Watercourse"], ["062A78", "Catalina Blue"], ["063537", "Tiber"], ["069B81", "Gossamer"], ["06A189", "Niagara"], ["073A50", "Tarawera"], ["080110", "Jaguar"], ["081910", "Black Bean"], ["082567", "Deep Sapphire"], ["088370", "Elf Green"], ["08E8DE", "Bright Turquoise"], ["092256", "Downriver"], ["09230F", "Palm Green"], ["09255D", "Madison"], ["093624", "Bottle Green"], ["095859", "Deep Sea Green"], ["097F4B", "Salem"], ["0A001C", "Black Russian"], ["0A480D", "Dark Fern"], ["0A6906", "Japanese Laurel"], ["0A6F75", "Atoll"], ["0B0B0B", "Cod Gray"], ["0B0F08", "Marshland"], ["0B1107", "Gordons Green"], ["0B1304", "Black Forest"], ["0B6207", "San Felix"], ["0BDA51", "Malachite"], ["0C0B1D", "Ebony"], ["0C0D0F", "Woodsmoke"], ["0C1911", "Racing Green"], ["0C7A79", "Surfie Green"], ["0C8990", "Blue Chill"], ["0D0332", "Black Rock"], ["0D1117", "Bunker"], ["0D1C19", "Aztec"], ["0D2E1C", "Bush"], ["0E0E18", "Cinder"], ["0E2A30", "Firefly"], ["0F2D9E", "Torea Bay"], ["10121D", "Vulcan"], ["101405", "Green Waterloo"], ["105852", "Eden"], ["110C6C", "Arapawa"], ["120A8F", "Ultramarine"], ["123447", "Elephant"], ["126B40", "Jewel"], ["130000", "Diesel"], ["130A06", "Asphalt"], ["13264D", "Blue Zodiac"], ["134F19", "Parsley"], ["140600", "Nero"], ["1450AA", "Tory Blue"], ["151F4C", "Bunting"], ["1560BD", "Denim"], ["15736B", "Genoa"], ["161928", "Mirage"], ["161D10", "Hunter Green"], ["162A40", "Big Stone"], ["163222", "Celtic"], ["16322C", "Timber Green"], ["163531", "Gable Green"], ["171F04", "Pine Tree"], ["175579", "Chathams Blue"], ["182D09", "Deep Forest Green"], ["18587A", "Blumine"], ["19330E", "Palm Leaf"], ["193751", "Nile Blue"], ["1959A8", "Fun Blue"], ["1A1A68", "Lucky Point"], ["1AB385", "Mountain Meadow"], ["1B0245", "Tolopea"], ["1B1035", "Haiti"], ["1B127B", "Deep Koamaru"], ["1B1404", "Acadia"], ["1B2F11", "Seaweed"], ["1B3162", "Biscay"], ["1B659D", "Matisse"], ["1C1208", "Crowshead"], ["1C1E13", "Rangoon Green"], ["1C39BB", "Persian Blue"], ["1C402E", "Everglade"], ["1C7C7D", "Elm"], ["1D6142", "Green Pea"], ["1E0F04", "Creole"], ["1E1609", "Karaka"], ["1E1708", "El Paso"], ["1E385B", "Cello"], ["1E433C", "Te Papa Green"], ["1E90FF", "Dodger Blue"], ["1E9AB0", "Eastern Blue"], ["1F120F", "Night Rider"], ["1FC2C2", "Java"], ["20208D", "Jacksons Purple"], ["202E54", "Cloud Burst"], ["204852", "Blue Dianne"], ["211A0E", "Eternity"], ["220878", "Deep Blue"], ["228B22", "Forest Green"], ["233418", "Mallard"], ["240A40", "Violet"], ["240C02", "Kilamanjaro"], ["242A1D", "Log Cabin"], ["242E16", "Black Olive"], ["24500F", "Green House"], ["251607", "Graphite"], ["251706", "Cannon Black"], ["251F4F", "Port Gore"], ["25272C", "Shark"], ["25311C", "Green Kelp"], ["2596D1", "Curious Blue"], ["260368", "Paua"], ["26056A", "Paris M"], ["261105", "Wood Bark"], ["261414", "Gondola"], ["262335", "Steel Gray"], ["26283B", "Ebony Clay"], ["273A81", "Bay of Many"], ["27504B", "Plantation"], ["278A5B", "Eucalyptus"], ["281E15", "Oil"], ["283A77", "Astronaut"], ["286ACD", "Mariner"], ["290C5E", "Violent Violet"], ["292130", "Bastille"], ["292319", "Zeus"], ["292937", "Charade"], ["297B9A", "Jelly Bean"], ["29AB87", "Jungle Green"], ["2A0359", "Cherry Pie"], ["2A140E", "Coffee Bean"], ["2A2630", "Baltic Sea"], ["2A380B", "Turtle Green"], ["2A52BE", "Cerulean Blue"], ["2B0202", "Sepia Black"], ["2B194F", "Valhalla"], ["2B3228", "Heavy Metal"], ["2C0E8C", "Blue Gem"], ["2C1632", "Revolver"], ["2C2133", "Bleached Cedar"], ["2C8C84", "Lochinvar"], ["2D2510", "Mikado"], ["2D383A", "Outer Space"], ["2D569B", "St Tropaz"], ["2E0329", "Jacaranda"], ["2E1905", "Jacko Bean"], ["2E3222", "Rangitoto"], ["2E3F62", "Rhino"], ["2E8B57", "Sea Green"], ["2EBFD4", "Scooter"], ["2F270E", "Onion"], ["2F3CB3", "Governor Bay"], ["2F519E", "Sapphire"], ["2F5A57", "Spectra"], ["2F6168", "Casal"], ["300529", "Melanzane"], ["301F1E", "Cocoa Brown"], ["302A0F", "Woodrush"], ["304B6A", "San Juan"], ["30D5C8", "Turquoise"], ["311C17", "Eclipse"], ["314459", "Pickled Bluewood"], ["315BA1", "Azure"], ["31728D", "Calypso"], ["317D82", "Paradiso"], ["32127A", "Persian Indigo"], ["32293A", "Blackcurrant"], ["323232", "Mine Shaft"], ["325D52", "Stromboli"], ["327C14", "Bilbao"], ["327DA0", "Astral"], ["33036B", "Christalle"], ["33292F", "Thunder"], ["33CC99", "Shamrock"], ["341515", "Tamarind"], ["350036", "Mardi Gras"], ["350E42", "Valentino"], ["350E57", "Jagger"], ["353542", "Tuna"], ["354E8C", "Chambray"], ["363050", "Martinique"], ["363534", "Tuatara"], ["363C0D", "Waiouru"], ["36747D", "Ming"], ["368716", "La Palma"], ["370202", "Chocolate"], ["371D09", "Clinker"], ["37290E", "Brown Tumbleweed"], ["373021", "Birch"], ["377475", "Oracle"], ["380474", "Blue Diamond"], ["381A51", "Grape"], ["383533", "Dune"], ["384555", "Oxford Blue"], ["384910", "Clover"], ["394851", "Limed Spruce"], ["396413", "Dell"], ["3A0020", "Toledo"], ["3A2010", "Sambuca"], ["3A2A6A", "Jacarta"], ["3A686C", "William"], ["3A6A47", "Killarney"], ["3AB09E", "Keppel"], ["3B000B", "Temptress"], ["3B0910", "Aubergine"], ["3B1F1F", "Jon"], ["3B2820", "Treehouse"], ["3B7A57", "Amazon"], ["3B91B4", "Boston Blue"], ["3C0878", "Windsor"], ["3C1206", "Rebel"], ["3C1F76", "Meteorite"], ["3C2005", "Dark Ebony"], ["3C3910", "Camouflage"], ["3C4151", "Bright Gray"], ["3C4443", "Cape Cod"], ["3C493A", "Lunar Green"], ["3D0C02", "Bean  "], ["3D2B1F", "Bistre"], ["3D7D52", "Goblin"], ["3E0480", "Kingfisher Daisy"], ["3E1C14", "Cedar"], ["3E2B23", "English Walnut"], ["3E2C1C", "Black Marlin"], ["3E3A44", "Ship Gray"], ["3EABBF", "Pelorous"], ["3F2109", "Bronze"], ["3F2500", "Cola"], ["3F3002", "Madras"], ["3F307F", "Minsk"], ["3F4C3A", "Cabbage Pont"], ["3F583B", "Tom Thumb"], ["3F5D53", "Mineral Green"], ["3FC1AA", "Puerto Rico"], ["3FFF00", "Harlequin"], ["401801", "Brown Pod"], ["40291D", "Cork"], ["403B38", "Masala"], ["403D19", "Thatch Green"], ["405169", "Fiord"], ["40826D", "Viridian"], ["40A860", "Chateau Green"], ["410056", "Ripe Plum"], ["411F10", "Paco"], ["412010", "Deep Oak"], ["413C37", "Merlin"], ["414257", "Gun Powder"], ["414C7D", "East Bay"], ["4169E1", "Royal Blue"], ["41AA78", "Ocean Green"], ["420303", "Burnt Maroon"], ["423921", "Lisbon Brown"], ["427977", "Faded Jade"], ["431560", "Scarlet Gum"], ["433120", "Iroko"], ["433E37", "Armadillo"], ["434C59", "River Bed"], ["436A0D", "Green Leaf"], ["44012D", "Barossa"], ["441D00", "Morocco Brown"], ["444954", "Mako"], ["454936", "Kelp"], ["456CAC", "San Marino"], ["45B1E8", "Picton Blue"], ["460B41", "Loulou"], ["462425", "Crater Brown"], ["465945", "Gray Asparagus"], ["4682B4", "Steel Blue"], ["480404", "Rustic Red"], ["480607", "Bulgarian Rose"], ["480656", "Clairvoyant"], ["481C1C", "Cocoa Bean"], ["483131", "Woody Brown"], ["483C32", "Taupe"], ["49170C", "Van Cleef"], ["492615", "Brown Derby"], ["49371B", "Metallic Bronze"], ["495400", "Verdun Green"], ["496679", "Blue Bayoux"], ["497183", "Bismark"], ["4A2A04", "Bracken"], ["4A3004", "Deep Bronze"], ["4A3C30", "Mondo"], ["4A4244", "Tundora"], ["4A444B", "Gravel"], ["4A4E5A", "Trout"], ["4B0082", "Pigment Indigo"], ["4B5D52", "Nandor"], ["4C3024", "Saddle"], ["4C4F56", "Abbey"], ["4D0135", "Blackberry"], ["4D0A18", "Cab Sav"], ["4D1E01", "Indian Tan"], ["4D282D", "Cowboy"], ["4D282E", "Livid Brown"], ["4D3833", "Rock"], ["4D3D14", "Punga"], ["4D400F", "Bronzetone"], ["4D5328", "Woodland"], ["4E0606", "Mahogany"], ["4E2A5A", "Bossanova"], ["4E3B41", "Matterhorn"], ["4E420C", "Bronze Olive"], ["4E4562", "Mulled Wine"], ["4E6649", "Axolotl"], ["4E7F9E", "Wedgewood"], ["4EABD1", "Shakespeare"], ["4F1C70", "Honey Flower"], ["4F2398", "Daisy Bush"], ["4F69C6", "Indigo"], ["4F7942", "Fern Green"], ["4F9D5D", "Fruit Salad"], ["4FA83D", "Apple"], ["504351", "Mortar"], ["507096", "Kashmir Blue"], ["507672", "Cutty Sark"], ["50C878", "Emerald"], ["514649", "Emperor"], ["516E3D", "Chalet Green"], ["517C66", "Como"], ["51808F", "Smalt Blue"], ["52001F", "Castro"], ["520C17", "Maroon Oak"], ["523C94", "Gigas"], ["533455", "Voodoo"], ["534491", "Victoria"], ["53824B", "Hippie Green"], ["541012", "Heath"], ["544333", "Judge Gray"], ["54534D", "Fuscous Gray"], ["549019", "Vida Loca"], ["55280C", "Cioccolato"], ["555B10", "Saratoga"], ["556D56", "Finlandia"], ["5590D9", "Havelock Blue"], ["56B4BE", "Fountain Blue"], ["578363", "Spring Leaves"], ["583401", "Saddle Brown"], ["585562", "Scarpa Flow"], ["587156", "Cactus"], ["589AAF", "Hippie Blue"], ["591D35", "Wine Berry"], ["592804", "Brown Bramble"], ["593737", "Congo Brown"], ["594433", "Millbrook"], ["5A6E9C", "Waikawa Gray"], ["5A87A0", "Horizon"], ["5B3013", "Jambalaya"], ["5C0120", "Bordeaux"], ["5C0536", "Mulberry Wood"], ["5C2E01", "Carnaby Tan"], ["5C5D75", "Comet"], ["5D1E0F", "Redwood"], ["5D4C51", "Don Juan"], ["5D5C58", "Chicago"], ["5D5E37", "Verdigris"], ["5D7747", "Dingley"], ["5DA19F", "Breaker Bay"], ["5E483E", "Kabul"], ["5E5D3B", "Hemlock"], ["5F3D26", "Irish Coffee"], ["5F5F6E", "Mid Gray"], ["5F6672", "Shuttle Gray"], ["5FA777", "Aqua Forest"], ["5FB3AC", "Tradewind"], ["604913", "Horses Neck"], ["605B73", "Smoky"], ["606E68", "Corduroy"], ["6093D1", "Danube"], ["612718", "Espresso"], ["614051", "Eggplant"], ["615D30", "Costa Del Sol"], ["61845F", "Glade Green"], ["622F30", "Buccaneer"], ["623F2D", "Quincy"], ["624E9A", "Butterfly Bush"], ["625119", "West Coast"], ["626649", "Finch"], ["639A8F", "Patina"], ["63B76C", "Fern"], ["6456B7", "Blue Violet"], ["646077", "Dolphin"], ["646463", "Storm Dust"], ["646A54", "Siam"], ["646E75", "Nevada"], ["6495ED", "Cornflower Blue"], ["64CCDB", "Viking"], ["65000B", "Rosewood"], ["651A14", "Cherrywood"], ["652DC1", "Purple Heart"], ["657220", "Fern Frond"], ["65745D", "Willow Grove"], ["65869F", "Hoki"], ["660045", "Pompadour"], ["660099", "Purple"], ["66023C", "Tyrian Purple"], ["661010", "Dark Tan"], ["66B58F", "Silver Tree"], ["66FF00", "Bright Green"], ["66FF66", "Screamin' Green"], ["67032D", "Black Rose"], ["675FA6", "Scampi"], ["676662", "Ironside Gray"], ["678975", "Viridian Green"], ["67A712", "Christi"], ["683600", "Nutmeg Wood Finish"], ["685558", "Zambezi"], ["685E6E", "Salt Box"], ["692545", "Tawny Port"], ["692D54", "Finn"], ["695F62", "Scorpion"], ["697E9A", "Lynch"], ["6A442E", "Spice"], ["6A5D1B", "Himalaya"], ["6A6051", "Soya Bean"], ["6B2A14", "Hairy Heath"], ["6B3FA0", "Royal Purple"], ["6B4E31", "Shingle Fawn"], ["6B5755", "Dorado"], ["6B8BA2", "Bermuda Gray"], ["6B8E23", "Olive Drab"], ["6C3082", "Eminence"], ["6CDAE7", "Turquoise Blue"], ["6D0101", "Lonestar"], ["6D5E54", "Pine Cone"], ["6D6C6C", "Dove Gray"], ["6D9292", "Juniper"], ["6D92A1", "Gothic"], ["6E0902", "Red Oxide"], ["6E1D14", "Moccaccino"], ["6E4826", "Pickled Bean"], ["6E4B26", "Dallas"], ["6E6D57", "Kokoda"], ["6E7783", "Pale Sky"], ["6F440C", "Cafe Royale"], ["6F6A61", "Flint"], ["6F8E63", "Highland"], ["6F9D02", "Limeade"], ["6FD0C5", "Downy"], ["701C1C", "Persian Plum"], ["704214", "Sepia"], ["704A07", "Antique Bronze"], ["704F50", "Ferra"], ["706555", "Coffee"], ["708090", "Slate Gray"], ["711A00", "Cedar Wood Finish"], ["71291D", "Metallic Copper"], ["714693", "Affair"], ["714AB2", "Studio"], ["715D47", "Tobacco Brown"], ["716338", "Yellow Metal"], ["716B56", "Peat"], ["716E10", "Olivetone"], ["717486", "Storm Gray"], ["718080", "Sirocco"], ["71D9E2", "Aquamarine Blue"], ["72010F", "Venetian Red"], ["724A2F", "Old Copper"], ["726D4E", "Go Ben"], ["727B89", "Raven"], ["731E8F", "Seance"], ["734A12", "Raw Umber"], ["736C9F", "Kimberly"], ["736D58", "Crocodile"], ["737829", "Crete"], ["738678", "Xanadu"], ["74640D", "Spicy Mustard"], ["747D63", "Limed Ash"], ["747D83", "Rolling Stone"], ["748881", "Blue Smoke"], ["749378", "Laurel"], ["74C365", "Mantis"], ["755A57", "Russett"], ["7563A8", "Deluge"], ["76395D", "Cosmic"], ["7666C6", "Blue Marguerite"], ["76BD17", "Lima"], ["76D7EA", "Sky Blue"], ["770F05", "Dark Burgundy"], ["771F1F", "Crown of Thorns"], ["773F1A", "Walnut"], ["776F61", "Pablo"], ["778120", "Pacifika"], ["779E86", "Oxley"], ["77DD77", "Pastel Green"], ["780109", "Japanese Maple"], ["782D19", "Mocha"], ["782F16", "Peanut"], ["78866B", "Camouflage Green"], ["788A25", "Wasabi"], ["788BBA", "Ship Cove"], ["78A39C", "Sea Nymph"], ["795D4C", "Roman Coffee"], ["796878", "Old Lavender"], ["796989", "Rum"], ["796A78", "Fedora"], ["796D62", "Sandstone"], ["79DEEC", "Spray"], ["7A013A", "Siren"], ["7A58C1", "Fuchsia Blue"], ["7A7A7A", "Boulder"], ["7A89B8", "Wild Blue Yonder"], ["7AC488", "De York"], ["7B3801", "Red Beech"], ["7B3F00", "Cinnamon"], ["7B6608", "Yukon Gold"], ["7B7874", "Tapa"], ["7B7C94", "Waterloo "], ["7B8265", "Flax Smoke"], ["7B9F80", "Amulet"], ["7BA05B", "Asparagus"], ["7C1C05", "Kenyan Copper"], ["7C7631", "Pesto"], ["7C778A", "Topaz"], ["7C7B7A", "Concord"], ["7C7B82", "Jumbo"], ["7C881A", "Trendy Green"], ["7CA1A6", "Gumbo"], ["7CB0A1", "Acapulco"], ["7CB7BB", "Neptune"], ["7D2C14", "Pueblo"], ["7DA98D", "Bay Leaf"], ["7DC8F7", "Malibu"], ["7DD8C6", "Bermuda"], ["7E3A15", "Copper Canyon"], ["7F1734", "Claret"], ["7F3A02", "Peru Tan"], ["7F626D", "Falcon"], ["7F7589", "Mobster"], ["7F76D3", "Moody Blue"], ["7FFF00", "Chartreuse"], ["7FFFD4", "Aquamarine"], ["800000", "Maroon"], ["800B47", "Rose Bud Cherry"], ["801818", "Falu Red"], ["80341F", "Red Robin"], ["803790", "Vivid Violet"], ["80461B", "Russet"], ["807E79", "Friar Gray"], ["808000", "Olive"], ["808080", "Gray"], ["80B3AE", "Gulf Stream"], ["80B3C4", "Glacier"], ["80CCEA", "Seagull"], ["81422C", "Nutmeg"], ["816E71", "Spicy Pink"], ["817377", "Empress"], ["819885", "Spanish Green"], ["826F65", "Sand Dune"], ["828685", "Gunsmoke"], ["828F72", "Battleship Gray"], ["831923", "Merlot"], ["837050", "Shadow"], ["83AA5D", "Chelsea Cucumber"], ["83D0C6", "Monte Carlo"], ["843179", "Plum"], ["84A0A0", "Granny Smith"], ["8581D9", "Chetwode Blue"], ["858470", "Bandicoot"], ["859FAF", "Bali Hai"], ["85C4CC", "Half Baked"], ["860111", "Red Devil"], ["863C3C", "Lotus"], ["86483C", "Ironstone"], ["864D1E", "Bull Shot"], ["86560A", "Rusty Nail"], ["868974", "Bitter"], ["86949F", "Regent Gray"], ["871550", "Disco"], ["87756E", "Americano"], ["877C7B", "Hurricane"], ["878D91", "Oslo Gray"], ["87AB39", "Sushi"], ["885342", "Spicy Mix"], ["886221", "Kumera"], ["888387", "Suva Gray"], ["888D65", "Avocado"], ["893456", "Camelot"], ["893843", "Solid Pink"], ["894367", "Cannon Pink"], ["897D6D", "Makara"], ["8A3324", "Burnt Umber"], ["8A73D6", "True V"], ["8A8360", "Clay Creek"], ["8A8389", "Monsoon"], ["8A8F8A", "Stack"], ["8AB9F1", "Jordy Blue"], ["8B00FF", "Electric Violet"], ["8B0723", "Monarch"], ["8B6B0B", "Corn Harvest"], ["8B8470", "Olive Haze"], ["8B847E", "Schooner"], ["8B8680", "Natural Gray"], ["8B9C90", "Mantle"], ["8B9FEE", "Portage"], ["8BA690", "Envy"], ["8BA9A5", "Cascade"], ["8BE6D8", "Riptide"], ["8C055E", "Cardinal Pink"], ["8C472F", "Mule Fawn"], ["8C5738", "Potters Clay"], ["8C6495", "Trendy Pink"], ["8D0226", "Paprika"], ["8D3D38", "Sanguine Brown"], ["8D3F3F", "Tosca"], ["8D7662", "Cement"], ["8D8974", "Granite Green"], ["8D90A1", "Manatee"], ["8DA8CC", "Polo Blue"], ["8E0000", "Red Berry"], ["8E4D1E", "Rope"], ["8E6F70", "Opium"], ["8E775E", "Domino"], ["8E8190", "Mamba"], ["8EABC1", "Nepal"], ["8F021C", "Pohutukawa"], ["8F3E33", "El Salva"], ["8F4B0E", "Korma"], ["8F8176", "Squirrel"], ["8FD6B4", "Vista Blue"], ["900020", "Burgundy"], ["901E1E", "Old Brick"], ["907874", "Hemp"], ["907B71", "Almond Frost"], ["908D39", "Sycamore"], ["92000A", "Sangria"], ["924321", "Cumin"], ["926F5B", "Beaver"], ["928573", "Stonewall"], ["928590", "Venus"], ["9370DB", "Medium Purple"], ["93CCEA", "Cornflower"], ["93DFB8", "Algae Green"], ["944747", "Copper Rust"], ["948771", "Arrowtown"], ["950015", "Scarlett"], ["956387", "Strikemaster"], ["959396", "Mountain Mist"], ["960018", "Carmine"], ["964B00", "Brown"], ["967059", "Leather"], ["9678B6", "Purple Mountain's Majesty"], ["967BB6", "Lavender Purple"], ["96A8A1", "Pewter"], ["96BBAB", "Summer Green"], ["97605D", "Au Chico"], ["9771B5", "Wisteria"], ["97CD2D", "Atlantis"], ["983D61", "Vin Rouge"], ["9874D3", "Lilac Bush"], ["98777B", "Bazaar"], ["98811B", "Hacienda"], ["988D77", "Pale Oyster"], ["98FF98", "Mint Green"], ["990066", "Fresh Eggplant"], ["991199", "Violet Eggplant"], ["991613", "Tamarillo"], ["991B07", "Totem Pole"], ["996666", "Copper Rose"], ["9966CC", "Amethyst"], ["997A8D", "Mountbatten Pink"], ["9999CC", "Blue Bell"], ["9A3820", "Prairie Sand"], ["9A6E61", "Toast"], ["9A9577", "Gurkha"], ["9AB973", "Olivine"], ["9AC2B8", "Shadow Green"], ["9B4703", "Oregon"], ["9B9E8F", "Lemon Grass"], ["9C3336", "Stiletto"], ["9D5616", "Hawaiian Tan"], ["9DACB7", "Gull Gray"], ["9DC209", "Pistachio"], ["9DE093", "Granny Smith Apple"], ["9DE5FF", "Anakiwa"], ["9E5302", "Chelsea Gem"], ["9E5B40", "Sepia Skin"], ["9EA587", "Sage"], ["9EA91F", "Citron"], ["9EB1CD", "Rock Blue"], ["9EDEE0", "Morning Glory"], ["9F381D", "Cognac"], ["9F821C", "Reef Gold"], ["9F9F9C", "Star Dust"], ["9FA0B1", "Santas Gray"], ["9FD7D3", "Sinbad"], ["9FDD8C", "Feijoa"], ["A02712", "Tabasco"], ["A1750D", "Buttered Rum"], ["A1ADB5", "Hit Gray"], ["A1C50A", "Citrus"], ["A1DAD7", "Aqua Island"], ["A1E9DE", "Water Leaf"], ["A2006D", "Flirt"], ["A23B6C", "Rouge"], ["A26645", "Cape Palliser"], ["A2AAB3", "Gray Chateau"], ["A2AEAB", "Edward"], ["A3807B", "Pharlap"], ["A397B4", "Amethyst Smoke"], ["A3E3ED", "Blizzard Blue"], ["A4A49D", "Delta"], ["A4A6D3", "Wistful"], ["A4AF6E", "Green Smoke"], ["A50B5E", "Jazzberry Jam"], ["A59B91", "Zorba"], ["A5CB0C", "Bahia"], ["A62F20", "Roof Terracotta"], ["A65529", "Paarl"], ["A68B5B", "Barley Corn"], ["A69279", "Donkey Brown"], ["A6A29A", "Dawn"], ["A72525", "Mexican Red"], ["A7882C", "Luxor Gold"], ["A85307", "Rich Gold"], ["A86515", "Reno Sand"], ["A86B6B", "Coral Tree"], ["A8989B", "Dusty Gray"], ["A899E6", "Dull Lavender"], ["A8A589", "Tallow"], ["A8AE9C", "Bud"], ["A8AF8E", "Locust"], ["A8BD9F", "Norway"], ["A8E3BD", "Chinook"], ["A9A491", "Gray Olive"], ["A9ACB6", "Aluminium"], ["A9B2C3", "Cadet Blue"], ["A9B497", "Schist"], ["A9BDBF", "Tower Gray"], ["A9BEF2", "Perano"], ["A9C6C2", "Opal"], ["AA375A", "Night Shadz"], ["AA4203", "Fire"], ["AA8B5B", "Muesli"], ["AA8D6F", "Sandal"], ["AAA5A9", "Shady Lady"], ["AAA9CD", "Logan"], ["AAABB7", "Spun Pearl"], ["AAD6E6", "Regent St Blue"], ["AAF0D1", "Magic Mint"], ["AB0563", "Lipstick"], ["AB3472", "Royal Heath"], ["AB917A", "Sandrift"], ["ABA0D9", "Cold Purple"], ["ABA196", "Bronco"], ["AC8A56", "Limed Oak"], ["AC91CE", "East Side"], ["AC9E22", "Lemon Ginger"], ["ACA494", "Napa"], ["ACA586", "Hillary"], ["ACA59F", "Cloudy"], ["ACACAC", "Silver Chalice"], ["ACB78E", "Swamp Green"], ["ACCBB1", "Spring Rain"], ["ACDD4D", "Conifer"], ["ACE1AF", "Celadon"], ["AD781B", "Mandalay"], ["ADBED1", "Casper"], ["ADDFAD", "Moss Green"], ["ADE6C4", "Padua"], ["ADFF2F", "Green Yellow"], ["AE4560", "Hippie Pink"], ["AE6020", "Desert"], ["AE809E", "Bouquet"], ["AF4035", "Medium Carmine"], ["AF4D43", "Apple Blossom"], ["AF593E", "Brown Rust"], ["AF8751", "Driftwood"], ["AF8F2C", "Alpine"], ["AF9F1C", "Lucky"], ["AFA09E", "Martini"], ["AFB1B8", "Bombay"], ["AFBDD9", "Pigeon Post"], ["B04C6A", "Cadillac"], ["B05D54", "Matrix"], ["B05E81", "Tapestry"], ["B06608", "Mai Tai"], ["B09A95", "Del Rio"], ["B0E0E6", "Powder Blue"], ["B0E313", "Inch Worm"], ["B10000", "Bright Red"], ["B14A0B", "Vesuvius"], ["B1610B", "Pumpkin Skin"], ["B16D52", "Santa Fe"], ["B19461", "Teak"], ["B1E2C1", "Fringy Flower"], ["B1F4E7", "Ice Cold"], ["B20931", "Shiraz"], ["B2A1EA", "Biloba Flower"], ["B32D29", "Tall Poppy"], ["B35213", "Fiery Orange"], ["B38007", "Hot Toddy"], ["B3AF95", "Taupe Gray"], ["B3C110", "La Rioja"], ["B43332", "Well Read"], ["B44668", "Blush"], ["B4CFD3", "Jungle Mist"], ["B57281", "Turkish Rose"], ["B57EDC", "Lavender"], ["B5A27F", "Mongoose"], ["B5B35C", "Olive Green"], ["B5D2CE", "Jet Stream"], ["B5ECDF", "Cruise"], ["B6316C", "Hibiscus"], ["B69D98", "Thatch"], ["B6B095", "Heathered Gray"], ["B6BAA4", "Eagle"], ["B6D1EA", "Spindle"], ["B6D3BF", "Gum Leaf"], ["B7410E", "Rust"], ["B78E5C", "Muddy Waters"], ["B7A214", "Sahara"], ["B7A458", "Husk"], ["B7B1B1", "Nobel"], ["B7C3D0", "Heather"], ["B7F0BE", "Madang"], ["B81104", "Milano Red"], ["B87333", "Copper"], ["B8B56A", "Gimblet"], ["B8C1B1", "Green Spring"], ["B8C25D", "Celery"], ["B8E0F9", "Sail"], ["B94E48", "Chestnut"], ["B95140", "Crail"], ["B98D28", "Marigold"], ["B9C46A", "Wild Willow"], ["B9C8AC", "Rainee"], ["BA0101", "Guardsman Red"], ["BA450C", "Rock Spray"], ["BA6F1E", "Bourbon"], ["BA7F03", "Pirate Gold"], ["BAB1A2", "Nomad"], ["BAC7C9", "Submarine"], ["BAEEF9", "Charlotte"], ["BB3385", "Medium Red Violet"], ["BB8983", "Brandy Rose"], ["BBD009", "Rio Grande"], ["BBD7C1", "Surf"], ["BCC9C2", "Powder Ash"], ["BD5E2E", "Tuscany"], ["BD978E", "Quicksand"], ["BDB1A8", "Silk"], ["BDB2A1", "Malta"], ["BDB3C7", "Chatelle"], ["BDBBD7", "Lavender Gray"], ["BDBDC6", "French Gray"], ["BDC8B3", "Clay Ash"], ["BDC9CE", "Loblolly"], ["BDEDFD", "French Pass"], ["BEA6C3", "London Hue"], ["BEB5B7", "Pink Swan"], ["BEDE0D", "Fuego"], ["BF5500", "Rose of Sharon"], ["BFB8B0", "Tide"], ["BFBED8", "Blue Haze"], ["BFC1C2", "Silver Sand"], ["BFC921", "Key Lime Pie"], ["BFDBE2", "Ziggurat"], ["BFFF00", "Lime"], ["C02B18", "Thunderbird"], ["C04737", "Mojo"], ["C08081", "Old Rose"], ["C0C0C0", "Silver"], ["C0D3B9", "Pale Leaf"], ["C0D8B6", "Pixie Green"], ["C1440E", "Tia Maria"], ["C154C1", "Fuchsia Pink"], ["C1A004", "Buddha Gold"], ["C1B7A4", "Bison Hide"], ["C1BAB0", "Tea"], ["C1BECD", "Gray Suit"], ["C1D7B0", "Sprout"], ["C1F07C", "Sulu"], ["C26B03", "Indochine"], ["C2955D", "Twine"], ["C2BDB6", "Cotton Seed"], ["C2CAC4", "Pumice"], ["C2E8E5", "Jagged Ice"], ["C32148", "Maroon Flush"], ["C3B091", "Indian Khaki"], ["C3BFC1", "Pale Slate"], ["C3C3BD", "Gray Nickel"], ["C3CDE6", "Periwinkle Gray"], ["C3D1D1", "Tiara"], ["C3DDF9", "Tropical Blue"], ["C41E3A", "Cardinal"], ["C45655", "Fuzzy Wuzzy Brown"], ["C45719", "Orange Roughy"], ["C4C4BC", "Mist Gray"], ["C4D0B0", "Coriander"], ["C4F4EB", "Mint Tulip"], ["C54B8C", "Mulberry"], ["C59922", "Nugget"], ["C5994B", "Tussock"], ["C5DBCA", "Sea Mist"], ["C5E17A", "Yellow Green"], ["C62D42", "Brick Red"], ["C6726B", "Contessa"], ["C69191", "Oriental Pink"], ["C6A84B", "Roti"], ["C6C3B5", "Ash"], ["C6C8BD", "Kangaroo"], ["C6E610", "Las Palmas"], ["C7031E", "Monza"], ["C71585", "Red Violet"], ["C7BCA2", "Coral Reef"], ["C7C1FF", "Melrose"], ["C7C4BF", "Cloud"], ["C7C9D5", "Ghost"], ["C7CD90", "Pine Glade"], ["C7DDE5", "Botticelli"], ["C88A65", "Antique Brass"], ["C8A2C8", "Lilac"], ["C8A528", "Hokey Pokey"], ["C8AABF", "Lily"], ["C8B568", "Laser"], ["C8E3D7", "Edgewater"], ["C96323", "Piper"], ["C99415", "Pizza"], ["C9A0DC", "Light Wisteria"], ["C9B29B", "Rodeo Dust"], ["C9B35B", "Sundance"], ["C9B93B", "Earls Green"], ["C9C0BB", "Silver Rust"], ["C9D9D2", "Conch"], ["C9FFA2", "Reef"], ["C9FFE5", "Aero Blue"], ["CA3435", "Flush Mahogany"], ["CABB48", "Turmeric"], ["CADCD4", "Paris White"], ["CAE00D", "Bitter Lemon"], ["CAE6DA", "Skeptic"], ["CB8FA9", "Viola"], ["CBCAB6", "Foggy Gray"], ["CBD3B0", "Green Mist"], ["CBDBD6", "Nebula"], ["CC3333", "Persian Red"], ["CC5500", "Burnt Orange"], ["CC7722", "Ochre"], ["CC8899", "Puce"], ["CCCAA8", "Thistle Green"], ["CCCCFF", "Periwinkle"], ["CCFF00", "Electric Lime"], ["CD5700", "Tenn"], ["CD5C5C", "Chestnut Rose"], ["CD8429", "Brandy Punch"], ["CDF4FF", "Onahau"], ["CEB98F", "Sorrell Brown"], ["CEBABA", "Cold Turkey"], ["CEC291", "Yuma"], ["CEC7A7", "Chino"], ["CFA39D", "Eunry"], ["CFB53B", "Old Gold"], ["CFDCCF", "Tasman"], ["CFE5D2", "Surf Crest"], ["CFF9F3", "Humming Bird"], ["CFFAF4", "Scandal"], ["D05F04", "Red Stage"], ["D06DA1", "Hopbush"], ["D07D12", "Meteor"], ["D0BEF8", "Perfume"], ["D0C0E5", "Prelude"], ["D0F0C0", "Tea Green"], ["D18F1B", "Geebung"], ["D1BEA8", "Vanilla"], ["D1C6B4", "Soft Amber"], ["D1D2CA", "Celeste"], ["D1D2DD", "Mischka"], ["D1E231", "Pear"], ["D2691E", "Hot Cinnamon"], ["D27D46", "Raw Sienna"], ["D29EAA", "Careys Pink"], ["D2B48C", "Tan"], ["D2DA97", "Deco"], ["D2F6DE", "Blue Romance"], ["D2F8B0", "Gossip"], ["D3CBBA", "Sisal"], ["D3CDC5", "Swirl"], ["D47494", "Charm"], ["D4B6AF", "Clam Shell"], ["D4BF8D", "Straw"], ["D4C4A8", "Akaroa"], ["D4CD16", "Bird Flower"], ["D4D7D9", "Iron"], ["D4DFE2", "Geyser"], ["D4E2FC", "Hawkes Blue"], ["D54600", "Grenadier"], ["D591A4", "Can Can"], ["D59A6F", "Whiskey"], ["D5D195", "Winter Hazel"], ["D5F6E3", "Granny Apple"], ["D69188", "My Pink"], ["D6C562", "Tacha"], ["D6CEF6", "Moon Raker"], ["D6D6D1", "Quill Gray"], ["D6FFDB", "Snowy Mint"], ["D7837F", "New York Pink"], ["D7C498", "Pavlova"], ["D7D0FF", "Fog"], ["D84437", "Valencia"], ["D87C63", "Japonica"], ["D8BFD8", "Thistle"], ["D8C2D5", "Maverick"], ["D8FCFA", "Foam"], ["D94972", "Cabaret"], ["D99376", "Burning Sand"], ["D9B99B", "Cameo"], ["D9D6CF", "Timberwolf"], ["D9DCC1", "Tana"], ["D9E4F5", "Link Water"], ["D9F7FF", "Mabel"], ["DA3287", "Cerise"], ["DA5B38", "Flame Pea"], ["DA6304", "Bamboo"], ["DA6A41", "Red Damask"], ["DA70D6", "Orchid"], ["DA8A67", "Copperfield"], ["DAA520", "Golden Grass"], ["DAECD6", "Zanah"], ["DAF4F0", "Iceberg"], ["DAFAFF", "Oyster Bay"], ["DB5079", "Cranberry"], ["DB9690", "Petite Orchid"], ["DB995E", "Di Serria"], ["DBDBDB", "Alto"], ["DBFFF8", "Frosted Mint"], ["DC143C", "Crimson"], ["DC4333", "Punch"], ["DCB20C", "Galliano"], ["DCB4BC", "Blossom"], ["DCD747", "Wattle"], ["DCD9D2", "Westar"], ["DCDDCC", "Moon Mist"], ["DCEDB4", "Caper"], ["DCF0EA", "Swans Down"], ["DDD6D5", "Swiss Coffee"], ["DDF9F1", "White Ice"], ["DE3163", "Cerise Red"], ["DE6360", "Roman"], ["DEA681", "Tumbleweed"], ["DEBA13", "Gold Tips"], ["DEC196", "Brandy"], ["DECBC6", "Wafer"], ["DED4A4", "Sapling"], ["DED717", "Barberry"], ["DEE5C0", "Beryl Green"], ["DEF5FF", "Pattens Blue"], ["DF73FF", "Heliotrope"], ["DFBE6F", "Apache"], ["DFCD6F", "Chenin"], ["DFCFDB", "Lola"], ["DFECDA", "Willow Brook"], ["DFFF00", "Chartreuse Yellow"], ["E0B0FF", "Mauve"], ["E0B646", "Anzac"], ["E0B974", "Harvest Gold"], ["E0C095", "Calico"], ["E0FFFF", "Baby Blue"], ["E16865", "Sunglo"], ["E1BC64", "Equator"], ["E1C0C8", "Pink Flare"], ["E1E6D6", "Periglacial Blue"], ["E1EAD4", "Kidnapper"], ["E1F6E8", "Tara"], ["E25465", "Mandy"], ["E2725B", "Terracotta"], ["E28913", "Golden Bell"], ["E292C0", "Shocking"], ["E29418", "Dixie"], ["E29CD2", "Light Orchid"], ["E2D8ED", "Snuff"], ["E2EBED", "Mystic"], ["E2F3EC", "Apple Green"], ["E30B5C", "Razzmatazz"], ["E32636", "Alizarin Crimson"], ["E34234", "Cinnabar"], ["E3BEBE", "Cavern Pink"], ["E3F5E1", "Peppermint"], ["E3F988", "Mindaro"], ["E47698", "Deep Blush"], ["E49B0F", "Gamboge"], ["E4C2D5", "Melanie"], ["E4CFDE", "Twilight"], ["E4D1C0", "Bone"], ["E4D422", "Sunflower"], ["E4D5B7", "Grain Brown"], ["E4D69B", "Zombie"], ["E4F6E7", "Frostee"], ["E4FFD1", "Snow Flurry"], ["E52B50", "Amaranth"], ["E5841B", "Zest"], ["E5CCC9", "Dust Storm"], ["E5D7BD", "Stark White"], ["E5D8AF", "Hampton"], ["E5E0E1", "Bon Jour"], ["E5E5E5", "Mercury"], ["E5F9F6", "Polar"], ["E64E03", "Trinidad"], ["E6BE8A", "Gold Sand"], ["E6BEA5", "Cashmere"], ["E6D7B9", "Double Spanish White"], ["E6E4D4", "Satin Linen"], ["E6F2EA", "Harp"], ["E6F8F3", "Off Green"], ["E6FFE9", "Hint of Green"], ["E6FFFF", "Tranquil"], ["E77200", "Mango Tango"], ["E7730A", "Christine"], ["E79F8C", "Tonys Pink"], ["E79FC4", "Kobi"], ["E7BCB4", "Rose Fog"], ["E7BF05", "Corn"], ["E7CD8C", "Putty"], ["E7ECE6", "Gray Nurse"], ["E7F8FF", "Lily White"], ["E7FEFF", "Bubbles"], ["E89928", "Fire Bush"], ["E8B9B3", "Shilo"], ["E8E0D5", "Pearl Bush"], ["E8EBE0", "Green White"], ["E8F1D4", "Chrome White"], ["E8F2EB", "Gin"], ["E8F5F2", "Aqua Squeeze"], ["E96E00", "Clementine"], ["E97451", "Burnt Sienna"], ["E97C07", "Tahiti Gold"], ["E9CECD", "Oyster Pink"], ["E9D75A", "Confetti"], ["E9E3E3", "Ebb"], ["E9F8ED", "Ottoman"], ["E9FFFD", "Clear Day"], ["EA88A8", "Carissma"], ["EAAE69", "Porsche"], ["EAB33B", "Tulip Tree"], ["EAC674", "Rob Roy"], ["EADAB8", "Raffia"], ["EAE8D4", "White Rock"], ["EAF6EE", "Panache"], ["EAF6FF", "Solitude"], ["EAF9F5", "Aqua Spring"], ["EAFFFE", "Dew"], ["EB9373", "Apricot"], ["EBC2AF", "Zinnwaldite"], ["ECA927", "Fuel Yellow"], ["ECC54E", "Ronchi"], ["ECC7EE", "French Lilac"], ["ECCDB9", "Just Right"], ["ECE090", "Wild Rice"], ["ECEBBD", "Fall Green"], ["ECEBCE", "Aths Special"], ["ECF245", "Starship"], ["ED0A3F", "Red Ribbon"], ["ED7A1C", "Tango"], ["ED9121", "Carrot Orange"], ["ED989E", "Sea Pink"], ["EDB381", "Tacao"], ["EDC9AF", "Desert Sand"], ["EDCDAB", "Pancho"], ["EDDCB1", "Chamois"], ["EDEA99", "Primrose"], ["EDF5DD", "Frost"], ["EDF5F5", "Aqua Haze"], ["EDF6FF", "Zumthor"], ["EDF9F1", "Narvik"], ["EDFC84", "Honeysuckle"], ["EE82EE", "Lavender Magenta"], ["EEC1BE", "Beauty Bush"], ["EED794", "Chalky"], ["EED9C4", "Almond"], ["EEDC82", "Flax"], ["EEDEDA", "Bizarre"], ["EEE3AD", "Double Colonial White"], ["EEEEE8", "Cararra"], ["EEEF78", "Manz"], ["EEF0C8", "Tahuna Sands"], ["EEF0F3", "Athens Gray"], ["EEF3C3", "Tusk"], ["EEF4DE", "Loafer"], ["EEF6F7", "Catskill White"], ["EEFDFF", "Twilight Blue"], ["EEFF9A", "Jonquil"], ["EEFFE2", "Rice Flower"], ["EF863F", "Jaffa"], ["EFEFEF", "Gallery"], ["EFF2F3", "Porcelain"], ["F091A9", "Mauvelous"], ["F0D52D", "Golden Dream"], ["F0DB7D", "Golden Sand"], ["F0DC82", "Buff"], ["F0E2EC", "Prim"], ["F0E68C", "Khaki"], ["F0EEFD", "Selago"], ["F0EEFF", "Titan White"], ["F0F8FF", "Alice Blue"], ["F0FCEA", "Feta"], ["F18200", "Gold Drop"], ["F19BAB", "Wewak"], ["F1E788", "Sahara Sand"], ["F1E9D2", "Parchment"], ["F1E9FF", "Blue Chalk"], ["F1EEC1", "Mint Julep"], ["F1F1F1", "Seashell"], ["F1F7F2", "Saltpan"], ["F1FFAD", "Tidal"], ["F1FFC8", "Chiffon"], ["F2552A", "Flamingo"], ["F28500", "Tangerine"], ["F2C3B2", "Mandys Pink"], ["F2F2F2", "Concrete"], ["F2FAFA", "Black Squeeze"], ["F34723", "Pomegranate"], ["F3AD16", "Buttercup"], ["F3D69D", "New Orleans"], ["F3D9DF", "Vanilla Ice"], ["F3E7BB", "Sidecar"], ["F3E9E5", "Dawn Pink"], ["F3EDCF", "Wheatfield"], ["F3FB62", "Canary"], ["F3FBD4", "Orinoco"], ["F3FFD8", "Carla"], ["F400A1", "Hollywood Cerise"], ["F4A460", "Sandy brown"], ["F4C430", "Saffron"], ["F4D81C", "Ripe Lemon"], ["F4EBD3", "Janna"], ["F4F2EE", "Pampas"], ["F4F4F4", "Wild Sand"], ["F4F8FF", "Zircon"], ["F57584", "Froly"], ["F5C85C", "Cream Can"], ["F5C999", "Manhattan"], ["F5D5A0", "Maize"], ["F5DEB3", "Wheat"], ["F5E7A2", "Sandwisp"], ["F5E7E2", "Pot Pourri"], ["F5E9D3", "Albescent White"], ["F5EDEF", "Soft Peach"], ["F5F3E5", "Ecru White"], ["F5F5DC", "Beige"], ["F5FB3D", "Golden Fizz"], ["F5FFBE", "Australian Mint"], ["F64A8A", "French Rose"], ["F653A6", "Brilliant Rose"], ["F6A4C9", "Illusion"], ["F6F0E6", "Merino"], ["F6F7F7", "Black Haze"], ["F6FFDC", "Spring Sun"], ["F7468A", "Violet Red"], ["F77703", "Chilean Fire"], ["F77FBE", "Persian Pink"], ["F7B668", "Rajah"], ["F7C8DA", "Azalea"], ["F7DBE6", "We Peep"], ["F7F2E1", "Quarter Spanish White"], ["F7F5FA", "Whisper"], ["F7FAF7", "Snow Drift"], ["F8B853", "Casablanca"], ["F8C3DF", "Chantilly"], ["F8D9E9", "Cherub"], ["F8DB9D", "Marzipan"], ["F8DD5C", "Energy Yellow"], ["F8E4BF", "Givry"], ["F8F0E8", "White Linen"], ["F8F4FF", "Magnolia"], ["F8F6F1", "Spring Wood"], ["F8F7DC", "Coconut Cream"], ["F8F7FC", "White Lilac"], ["F8F8F7", "Desert Storm"], ["F8F99C", "Texas"], ["F8FACD", "Corn Field"], ["F8FDD3", "Mimosa"], ["F95A61", "Carnation"], ["F9BF58", "Saffron Mango"], ["F9E0ED", "Carousel Pink"], ["F9E4BC", "Dairy Cream"], ["F9E663", "Portica"], ["F9E6F4", "Underage Pink"], ["F9EAF3", "Amour"], ["F9F8E4", "Rum Swizzle"], ["F9FF8B", "Dolly"], ["F9FFF6", "Sugar Cane"], ["FA7814", "Ecstasy"], ["FA9D5A", "Tan Hide"], ["FAD3A2", "Corvette"], ["FADFAD", "Peach Yellow"], ["FAE600", "Turbo"], ["FAEAB9", "Astra"], ["FAECCC", "Champagne"], ["FAF0E6", "Linen"], ["FAF3F0", "Fantasy"], ["FAF7D6", "Citrine White"], ["FAFAFA", "Alabaster"], ["FAFDE4", "Hint of Yellow"], ["FAFFA4", "Milan"], ["FB607F", "Brink Pink"], ["FB8989", "Geraldine"], ["FBA0E3", "Lavender Rose"], ["FBA129", "Sea Buckthorn"], ["FBAC13", "Sun"], ["FBAED2", "Lavender Pink"], ["FBB2A3", "Rose Bud"], ["FBBEDA", "Cupid"], ["FBCCE7", "Classic Rose"], ["FBCEB1", "Apricot Peach"], ["FBE7B2", "Banana Mania"], ["FBE870", "Marigold Yellow"], ["FBE96C", "Festival"], ["FBEA8C", "Sweet Corn"], ["FBEC5D", "Candy Corn"], ["FBF9F9", "Hint of Red"], ["FBFFBA", "Shalimar"], ["FC0FC0", "Shocking Pink"], ["FC80A5", "Tickle Me Pink"], ["FC9C1D", "Tree Poppy"], ["FCC01E", "Lightning Yellow"], ["FCD667", "Goldenrod"], ["FCD917", "Candlelight"], ["FCDA98", "Cherokee"], ["FCF4D0", "Double Pearl Lusta"], ["FCF4DC", "Pearl Lusta"], ["FCF8F7", "Vista White"], ["FCFBF3", "Bianca"], ["FCFEDA", "Moon Glow"], ["FCFFE7", "China Ivory"], ["FCFFF9", "Ceramic"], ["FD0E35", "Torch Red"], ["FD5B78", "Wild Watermelon"], ["FD7B33", "Crusta"], ["FD7C07", "Sorbus"], ["FD9FA2", "Sweet Pink"], ["FDD5B1", "Light Apricot"], ["FDD7E4", "Pig Pink"], ["FDE1DC", "Cinderella"], ["FDE295", "Golden Glow"], ["FDE910", "Lemon"], ["FDF5E6", "Old Lace"], ["FDF6D3", "Half Colonial White"], ["FDF7AD", "Drover"], ["FDFEB8", "Pale Prim"], ["FDFFD5", "Cumulus"], ["FE28A2", "Persian Rose"], ["FE4C40", "Sunset Orange"], ["FE6F5E", "Bittersweet"], ["FE9D04", "California"], ["FEA904", "Yellow Sea"], ["FEBAAD", "Melon"], ["FED33C", "Bright Sun"], ["FED85D", "Dandelion"], ["FEDB8D", "Salomie"], ["FEE5AC", "Cape Honey"], ["FEEBF3", "Remy"], ["FEEFCE", "Oasis"], ["FEF0EC", "Bridesmaid"], ["FEF2C7", "Beeswax"], ["FEF3D8", "Bleach White"], ["FEF4CC", "Pipi"], ["FEF4DB", "Half Spanish White"], ["FEF4F8", "Wisp Pink"], ["FEF5F1", "Provincial Pink"], ["FEF7DE", "Half Dutch White"], ["FEF8E2", "Solitaire"], ["FEF8FF", "White Pointer"], ["FEF9E3", "Off Yellow"], ["FEFCED", "Orange White"], ["FF0000", "Red"], ["FF007F", "Rose"], ["FF00CC", "Purple Pizzazz"], ["FF00FF", "Magenta / Fuchsia"], ["FF2400", "Scarlet"], ["FF3399", "Wild Strawberry"], ["FF33CC", "Razzle Dazzle Rose"], ["FF355E", "Radical Red"], ["FF3F34", "Red Orange"], ["FF4040", "Coral Red"], ["FF4D00", "Vermilion"], ["FF4F00", "International Orange"], ["FF6037", "Outrageous Orange"], ["FF6600", "Blaze Orange"], ["FF66FF", "Pink Flamingo"], ["FF681F", "Orange"], ["FF69B4", "Hot Pink"], ["FF6B53", "Persimmon"], ["FF6FFF", "Blush Pink"], ["FF7034", "Burning Orange"], ["FF7518", "Pumpkin"], ["FF7D07", "Flamenco"], ["FF7F00", "Flush Orange"], ["FF7F50", "Coral"], ["FF8C69", "Salmon"], ["FF9000", "Pizazz"], ["FF910F", "West Side"], ["FF91A4", "Pink Salmon"], ["FF9933", "Neon Carrot"], ["FF9966", "Atomic Tangerine"], ["FF9980", "Vivid Tangerine"], ["FF9E2C", "Sunshade"], ["FFA000", "Orange Peel"], ["FFA194", "Mona Lisa"], ["FFA500", "Web Orange"], ["FFA6C9", "Carnation Pink"], ["FFAB81", "Hit Pink"], ["FFAE42", "Yellow Orange"], ["FFB0AC", "Cornflower Lilac"], ["FFB1B3", "Sundown"], ["FFB31F", "My Sin"], ["FFB555", "Texas Rose"], ["FFB7D5", "Cotton Candy"], ["FFB97B", "Macaroni and Cheese"], ["FFBA00", "Selective Yellow"], ["FFBD5F", "Koromiko"], ["FFBF00", "Amber"], ["FFC0A8", "Wax Flower"], ["FFC0CB", "Pink"], ["FFC3C0", "Your Pink"], ["FFC901", "Supernova"], ["FFCBA4", "Flesh"], ["FFCC33", "Sunglow"], ["FFCC5C", "Golden Tainoi"], ["FFCC99", "Peach Orange"], ["FFCD8C", "Chardonnay"], ["FFD1DC", "Pastel Pink"], ["FFD2B7", "Romantic"], ["FFD38C", "Grandis"], ["FFD700", "Gold"], ["FFD800", "School bus Yellow"], ["FFD8D9", "Cosmos"], ["FFDB58", "Mustard"], ["FFDCD6", "Peach Schnapps"], ["FFDDAF", "Caramel"], ["FFDDCD", "Tuft Bush"], ["FFDDCF", "Watusi"], ["FFDDF4", "Pink Lace"], ["FFDEAD", "Navajo White"], ["FFDEB3", "Frangipani"], ["FFE1DF", "Pippin"], ["FFE1F2", "Pale Rose"], ["FFE2C5", "Negroni"], ["FFE5A0", "Cream Brulee"], ["FFE5B4", "Peach"], ["FFE6C7", "Tequila"], ["FFE772", "Kournikova"], ["FFEAC8", "Sandy Beach"], ["FFEAD4", "Karry"], ["FFEC13", "Broom"], ["FFEDBC", "Colonial White"], ["FFEED8", "Derby"], ["FFEFA1", "Vis Vis"], ["FFEFC1", "Egg White"], ["FFEFD5", "Papaya Whip"], ["FFEFEC", "Fair Pink"], ["FFF0DB", "Peach Cream"], ["FFF0F5", "Lavender blush"], ["FFF14F", "Gorse"], ["FFF1B5", "Buttermilk"], ["FFF1D8", "Pink Lady"], ["FFF1EE", "Forget Me Not"], ["FFF1F9", "Tutu"], ["FFF39D", "Picasso"], ["FFF3F1", "Chardon"], ["FFF46E", "Paris Daisy"], ["FFF4CE", "Barley White"], ["FFF4DD", "Egg Sour"], ["FFF4E0", "Sazerac"], ["FFF4E8", "Serenade"], ["FFF4F3", "Chablis"], ["FFF5EE", "Seashell Peach"], ["FFF5F3", "Sauvignon"], ["FFF6D4", "Milk Punch"], ["FFF6DF", "Varden"], ["FFF6F5", "Rose White"], ["FFF8D1", "Baja White"], ["FFF9E2", "Gin Fizz"], ["FFF9E6", "Early Dawn"], ["FFFACD", "Lemon Chiffon"], ["FFFAF4", "Bridal Heath"], ["FFFBDC", "Scotch Mist"], ["FFFBF9", "Soapstone"], ["FFFC99", "Witch Haze"], ["FFFCEA", "Buttery White"], ["FFFCEE", "Island Spice"], ["FFFDD0", "Cream"], ["FFFDE6", "Chilean Heath"], ["FFFDE8", "Travertine"], ["FFFDF3", "Orchid White"], ["FFFDF4", "Quarter Pearl Lusta"], ["FFFEE1", "Half and Half"], ["FFFEEC", "Apricot White"], ["FFFEF0", "Rice Cake"], ["FFFEF6", "Black White"], ["FFFEFD", "Romance"], ["FFFF00", "Yellow"], ["FFFF66", "Laser Lemon"], ["FFFF99", "Pale Canary"], ["FFFFB4", "Portafino"], ["FFFFF0", "Ivory"], ["FFFFFF", "White"]];
  return names.each(function(element) {
    return (lookup[normalizeKey(element[1])] = parseHex(element[0]));
  });
})();;
var Core;
var __slice = Array.prototype.slice;
/**
The Core class is used to add extended functionality to objects without
extending the object class directly. Inherit from Core to gain its utility
methods.

@name Core
@constructor

@param {Object} I Instance variables
*/
Core = function(I) {
  var self;
  I || (I = {});
  return (self = {
    I: I,
    /**
    Generates a public jQuery style getter / setter method for each
    String argument.

    @name attrAccessor
    @methodOf Core#
    */
    attrAccessor: function() {
      var attrNames;
      attrNames = __slice.call(arguments, 0);
      return attrNames.each(function(attrName) {
        return (self[attrName] = function(newValue) {
          if (typeof newValue !== "undefined" && newValue !== null) {
            I[attrName] = newValue;
            return self;
          } else {
            return I[attrName];
          }
        });
      });
    },
    /**
    Generates a public jQuery style getter method for each String argument.

    @name attrReader
    @methodOf Core#
    */
    attrReader: function() {
      var attrNames;
      attrNames = __slice.call(arguments, 0);
      return attrNames.each(function(attrName) {
        return (self[attrName] = function() {
          return I[attrName];
        });
      });
    },
    /**
    Extends this object with methods from the passed in object. `before` and
    `after` are special option names that glue functionality before or after
    existing methods.

    @name extend
    @methodOf Core#
    */
    extend: function(options) {
      var afterMethods, beforeMethods;
      afterMethods = options.after;
      beforeMethods = options.before;
      delete options.after;
      delete options.before;
      $.extend(self, options);
      if (beforeMethods) {
        $.each(beforeMethods, function(name, fn) {
          return (self[name] = self[name].withBefore(fn));
        });
      }
      if (afterMethods) {
        $.each(afterMethods, function(name, fn) {
          return (self[name] = self[name].withAfter(fn));
        });
      }
      return self;
    },
    include: function(Module) {
      return self.extend(Module(I, self));
    }
  });
};;
var DebugConsole;
DebugConsole = function() {
  var REPL, container, input, output, repl, runButton;
  REPL = function(input, output) {
    var print;
    print = function(message) {
      return output.append($("<li />", {
        text: message
      }));
    };
    return {
      run: function() {
        var code, result, source;
        source = input.val();
        try {
          code = CoffeeScript.compile(source, {
            noWrap: true
          });
          result = eval(code);
          print(" => " + (result));
          return input.val('');
        } catch (error) {
          return error.stack ? print(error.stack) : print(error.toString());
        }
      }
    };
  };
  container = $("<div />", {
    "class": "console"
  });
  input = $("<textarea />");
  output = $("<ul />");
  runButton = $("<button />", {
    text: "Run"
  });
  repl = REPL(input, output);
  container.append(output).append(input).append(runButton);
  return $(function() {
    runButton.click(function() {
      return repl.run();
    });
    return $("body").append(container);
  });
};;
Function.prototype.withBefore = function(interception) {
  var method;
  method = this;
  return function() {
    interception.apply(this, arguments);
    return method.apply(this, arguments);
  };
};
Function.prototype.withAfter = function(interception) {
  var method;
  method = this;
  return function() {
    var result;
    result = method.apply(this, arguments);
    interception.apply(this, arguments);
    return result;
  };
};;
/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){
  
  jQuery.hotkeys = {
    version: "0.8",

    specialKeys: {
      8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
      20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
      37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
      96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
      104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
      112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
      120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
    },
  
    shiftNums: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
      "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
      ".": ">",  "/": "?",  "\\": "|"
    }
  };

  function keyHandler( handleObj ) {
    // Only care when a possible input has been specified
    if ( typeof handleObj.data !== "string" ) {
      return;
    }
    
    var origHandler = handleObj.handler,
      keys = handleObj.data.toLowerCase().split(" ");
  
    handleObj.handler = function( event ) {
      // Don't fire in text-accepting inputs that we didn't directly bind to
      if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
         event.target.type === "text" || event.target.type === "password") ) {
        return;
      }
      
      // Keypress represents characters, not special keys
      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
        character = String.fromCharCode( event.which ).toLowerCase(),
        key, modif = "", possible = {};

      // check combinations (alt|ctrl|shift+anything)
      if ( event.altKey && special !== "alt" ) {
        modif += "alt+";
      }

      if ( event.ctrlKey && special !== "ctrl" ) {
        modif += "ctrl+";
      }
      
      // TODO: Need to make sure this works consistently across platforms
      if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
        modif += "meta+";
      }

      if ( event.shiftKey && special !== "shift" ) {
        modif += "shift+";
      }

      if ( special ) {
        possible[ modif + special ] = true;

      } else {
        possible[ modif + character ] = true;
        possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if ( modif === "shift+" ) {
          possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
        }
      }

      for ( var i = 0, l = keys.length; i < l; i++ ) {
        if ( possible[ keys[i] ] ) {
          return origHandler.apply( this, arguments );
        }
      }
    };
  }

  jQuery.each([ "keydown", "keyup", "keypress" ], function() {
    jQuery.event.special[ this ] = { add: keyHandler };
  });

})( jQuery );;
/**
 * Merges properties from objects into target without overiding.
 * First come, first served.
 * @return target
 */
jQuery.extend({
  reverseMerge: function(target) {
    var i = 1, length = arguments.length;

    for( ; i < length; i++) {
      var object = arguments[i];

      for(var name in object) {
        if(!target.hasOwnProperty(name)) {
          target[name] = object[name];
        }
      }
    }

    return target;
  }
});

;
$(function() {
  var keyName;
  /***
  The global keydown property lets your query the status of keys.

  <pre>
  if keydown.left
    moveLeft()
  </pre>

  @name keydown
  @namespace
  */
  window.keydown = {};
  keyName = function(event) {
    return jQuery.hotkeys.specialKeys[event.which] || String.fromCharCode(event.which).toLowerCase();
  };
  $(document).bind("keydown", function(event) {
    return (keydown[keyName(event)] = true);
  });
  return $(document).bind("keyup", function(event) {
    return (keydown[keyName(event)] = false);
  });
});;
$(function() {
  return ["log", "info", "warn", "error"].each(function(name) {
    return typeof console !== "undefined" ? (window[name] = function(message) {
      return console[name] ? console[name](message) : null;
    }) : (window[name] = $.noop);
  });
});;
/**
* Matrix.js v1.3.0pre
* 
* Copyright (c) 2010 STRd6
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* Loosely based on flash:
* http://www.adobe.com/livedocs/flash/9.0/ActionScriptLangRefV3/flash/geom/Matrix.html
*/
(function() {
  /**
   * Create a new point with given x and y coordinates. If no arguments are given
   * defaults to (0, 0).
   * @name Point
   * @param {Number} [x]
   * @param {Number} [y]
   * @constructor
   */
  function Point(x, y) {
    return {
      /**
       * The x coordinate of this point.
       * @name x
       * @fieldOf Point#
       */
      x: x || 0,
      /**
       * The y coordinate of this point.
       * @name y
       * @fieldOf Point#
       */
      y: y || 0,
      /**
       * Adds a point to this one and returns the new point.
       * @name add
       * @methodOf Point#
       *
       * @param {Point} other The point to add this point to.
       * @returns A new point, the sum of both.
       * @type Point
       */
      add: function(other) {
        return Point(this.x + other.x, this.y + other.y);
      },
      /**
       * Subtracts a point to this one and returns the new point.
       * @name subtract
       * @methodOf Point#
       *
       * @param {Point} other The point to subtract from this point.
       * @returns A new point, this - other.
       * @type Point
       */
      subtract: function(other) {
        return Point(this.x - other.x, this.y - other.y);
      },
      /**
       * Scale this Point (Vector) by a constant amount.
       * @name scale
       * @methodOf Point#
       *
       * @param {Number} scalar The amount to scale this point by.
       * @returns A new point, this * scalar.
       * @type Point
       */
      scale: function(scalar) {
        return Point(this.x * scalar, this.y * scalar);
      },
      /**
       * Determine whether this point is equal to another point.
       * @name equal
       * @methodOf Point#
       *
       * @param {Point} other The point to check for equality.
       * @returns true if the other point has the same x, y coordinates, false otherwise.
       * @type Boolean
       */
      equal: function(other) {
        return this.x === other.x && this.y === other.y;
      },
      /**
       * Calculate the magnitude of this Point (Vector).
       * @name magnitude
       * @methodOf Point#
       *
       * @returns The magnitude of this point as if it were a vector from (0, 0) -> (x, y).
       * @type Number
       */
      magnitude: function() {
        return Point.distance(Point(0, 0), this);
      },
      /**
       * Calculate the dot product of this point and another point (Vector).
       * @name dot
       * @methodOf Point#
       *
       * @param {Point} other The point to dot with this point.
       * @returns The dot product of this point dot other as a scalar value.
       * @type Number
       */
      dot: function(other) {
        return this.x * other.x + this.y * other.y;
      },
      /**
       * Calculate the cross product of this point and another point (Vector). 
       * Usually cross products are thought of as only applying to three dimensional vectors,
       * but z can be treated as zero. The result of this method is interpreted as the magnitude 
       * of the vector result of the cross product between [x1, y1, 0] x [x2, y2, 0]
       * perpendicular to the xy plane.
       * @name cross
       * @methodOf Point#
       *
       * @param {Point} other The point to cross with this point.
       * @returns The cross product of this point with the other point as scalar value.
       * @type Number
       */
      cross: function(other) {
        return this.x * other.y - other.x * this.y;
      },
      /**
       * The norm of a vector is the unit vector pointing in the same direction. This method
       * treats the point as though it is a vector from the origin to (x, y).
       * @name norm
       * @methodOf Point#
       *
       * @returns The unit vector pointing in the same direction as this vector.
       * @type Point
       */
      norm: function() {
        return this.scale(1.0/this.length());
      },
      /**
       * Computed the length of this point as though it were a vector from (0,0) to (x,y)
       * @name length
       * @methodOf Point#
       *
       * @returns The length of the vector from the origin to this point.
       * @type Number
       */
      length: function() {
        return Math.sqrt(this.dot(this));
      },
      /**
       * Computed the Euclidean between this point and another point.
       * @name distance
       * @methodOf Point#
       *
       * @param {Point} other The point to compute the distance to.
       * @returns The distance between this point and another point.
       * @type Number
       */
      distance: function(other) {
        return Point.distance(this, other);
      }
    }
  }

  /**
   * @param {Point} p1
   * @param {Point} p2
   * @type Number
   * @returns The Euclidean distance between two points.
   */
  Point.distance = function(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  /**
   * Construct a point on the unit circle for the given angle.
   *
   * @param {Number} angle The angle in radians
   * @type Point
   * @returns The point on the unit circle.
   */
  Point.fromAngle = function(angle) {
    return Point(Math.cos(angle), Math.sin(angle));
  };

  /**
   * If you have two dudes, one standing at point p1, and the other
   * standing at point p2, then this method will return the direction
   * that the dude standing at p1 will need to face to look at p2.
   * @param {Point} p1 The starting point.
   * @param {Point} p2 The ending point.
   * @returns The direction from p1 to p2 in radians.
   */
  Point.direction = function(p1, p2) {
    return Math.atan2(
      p2.y - p1.y,
      p2.x - p1.x
    );
  };

  /**
   * <pre>
   *  _        _
   * | a  c tx  |
   * | b  d ty  |
   * |_0  0  1 _|
   * </pre>
   * Creates a matrix for 2d affine transformations.
   *
   * concat, inverse, rotate, scale and translate return new matrices with the
   * transformations applied. The matrix is not modified in place.
   *
   * Returns the identity matrix when called with no arguments.
   * @name Matrix
   * @param {Number} [a]
   * @param {Number} [b]
   * @param {Number} [c]
   * @param {Number} [d]
   * @param {Number} [tx]
   * @param {Number} [ty]
   * @constructor
   */
  function Matrix(a, b, c, d, tx, ty) {
    a = a !== undefined ? a : 1;
    d = d !== undefined ? d : 1;

    return {
      /**
       * @name a
       * @fieldOf Matrix#
       */
      a: a,
      /**
       * @name b
       * @fieldOf Matrix#
       */
      b: b || 0,
      /**
       * @name c
       * @fieldOf Matrix#
       */
      c: c || 0,
      /**
       * @name d
       * @fieldOf Matrix#
       */
      d: d,
      /**
       * @name tx
       * @fieldOf Matrix#
       */
      tx: tx || 0,
      /**
       * @name ty
       * @fieldOf Matrix#
       */
      ty: ty || 0,

      /**
       * Returns the result of this matrix multiplied by another matrix
       * combining the geometric effects of the two. In mathematical terms, 
       * concatenating two matrixes is the same as combining them using matrix multiplication.
       * If this matrix is A and the matrix passed in is B, the resulting matrix is A x B
       * http://mathworld.wolfram.com/MatrixMultiplication.html
       * @name concat
       * @methodOf Matrix#
       *
       * @param {Matrix} matrix The matrix to multiply this matrix by.
       * @returns The result of the matrix multiplication, a new matrix.
       * @type Matrix
       */
      concat: function(matrix) {
        return Matrix(
          this.a * matrix.a + this.c * matrix.b,
          this.b * matrix.a + this.d * matrix.b,
          this.a * matrix.c + this.c * matrix.d,
          this.b * matrix.c + this.d * matrix.d,
          this.a * matrix.tx + this.c * matrix.ty + this.tx,
          this.b * matrix.tx + this.d * matrix.ty + this.ty
        );
      },

      /**
       * Given a point in the pretransform coordinate space, returns the coordinates of 
       * that point after the transformation occurs. Unlike the standard transformation 
       * applied using the transformPoint() method, the deltaTransformPoint() method's 
       * transformation does not consider the translation parameters tx and ty.
       * @name deltaTransformPoint
       * @methodOf Matrix#
       * @see #transformPoint
       *
       * @return A new point transformed by this matrix ignoring tx and ty.
       * @type Point
       */
      deltaTransformPoint: function(point) {
        return Point(
          this.a * point.x + this.c * point.y,
          this.b * point.x + this.d * point.y
        );
      },

      /**
       * Returns the inverse of the matrix.
       * http://mathworld.wolfram.com/MatrixInverse.html
       * @name inverse
       * @methodOf Matrix#
       *
       * @returns A new matrix that is the inverse of this matrix.
       * @type Matrix
       */
      inverse: function() {
        var determinant = this.a * this.d - this.b * this.c;
        return Matrix(
          this.d / determinant,
          -this.b / determinant,
          -this.c / determinant,
          this.a / determinant,
          (this.c * this.ty - this.d * this.tx) / determinant,
          (this.b * this.tx - this.a * this.ty) / determinant
        );
      },

      /**
       * Returns a new matrix that corresponds this matrix multiplied by a
       * a rotation matrix.
       * @name rotate
       * @methodOf Matrix#
       * @see Matrix.rotation
       *
       * @param {Number} theta Amount to rotate in radians.
       * @param {Point} [aboutPoint] The point about which this rotation occurs. Defaults to (0,0).
       * @returns A new matrix, rotated by the specified amount.
       * @type Matrix
       */
      rotate: function(theta, aboutPoint) {
        return this.concat(Matrix.rotation(theta, aboutPoint));
      },

      /**
       * Returns a new matrix that corresponds this matrix multiplied by a
       * a scaling matrix.
       * @name scale
       * @methodOf Matrix#
       * @see Matrix.scale
       *
       * @param {Number} sx
       * @param {Number} [sy]
       * @param {Point} [aboutPoint] The point that remains fixed during the scaling
       * @type Matrix
       */
      scale: function(sx, sy, aboutPoint) {
        return this.concat(Matrix.scale(sx, sy, aboutPoint));
      },

      /**
       * Returns the result of applying the geometric transformation represented by the 
       * Matrix object to the specified point.
       * @name transformPoint
       * @methodOf Matrix#
       * @see #deltaTransformPoint
       *
       * @returns A new point with the transformation applied.
       * @type Point
       */
      transformPoint: function(point) {
        return Point(
          this.a * point.x + this.c * point.y + this.tx,
          this.b * point.x + this.d * point.y + this.ty
        );
      },

      /**
       * Translates the matrix along the x and y axes, as specified by the tx and ty parameters.
       * @name translate
       * @methodOf Matrix#
       * @see Matrix.translation
       *
       * @param {Number} tx The translation along the x axis.
       * @param {Number} ty The translation along the y axis.
       * @returns A new matrix with the translation applied.
       * @type Matrix
       */
      translate: function(tx, ty) {
        return this.concat(Matrix.translation(tx, ty));
      }
    }
  }

  /**
   * Creates a matrix transformation that corresponds to the given rotation,
   * around (0,0) or the specified point.
   * @see Matrix#rotate
   *
   * @param {Number} theta Rotation in radians.
   * @param {Point} [aboutPoint] The point about which this rotation occurs. Defaults to (0,0).
   * @returns 
   * @type Matrix
   */
  Matrix.rotation = function(theta, aboutPoint) {
    var rotationMatrix = Matrix(
      Math.cos(theta),
      Math.sin(theta),
      -Math.sin(theta),
      Math.cos(theta)
    );

    if(aboutPoint) {
      rotationMatrix =
        Matrix.translation(aboutPoint.x, aboutPoint.y).concat(
          rotationMatrix
        ).concat(
          Matrix.translation(-aboutPoint.x, -aboutPoint.y)
        );
    }

    return rotationMatrix;
  };

  /**
   * Returns a matrix that corresponds to scaling by factors of sx, sy along
   * the x and y axis respectively.
   * If only one parameter is given the matrix is scaled uniformly along both axis.
   * If the optional aboutPoint parameter is given the scaling takes place
   * about the given point.
   * @see Matrix#scale
   *
   * @param {Number} sx The amount to scale by along the x axis or uniformly if no sy is given.
   * @param {Number} [sy] The amount to scale by along the y axis.
   * @param {Point} [aboutPoint] The point about which the scaling occurs. Defaults to (0,0).
   * @returns A matrix transformation representing scaling by sx and sy.
   * @type Matrix
   */
  Matrix.scale = function(sx, sy, aboutPoint) {
    sy = sy || sx;

    var scaleMatrix = Matrix(sx, 0, 0, sy);

    if(aboutPoint) {
      scaleMatrix =
        Matrix.translation(aboutPoint.x, aboutPoint.y).concat(
          scaleMatrix
        ).concat(
          Matrix.translation(-aboutPoint.x, -aboutPoint.y)
        );
    }

    return scaleMatrix;
  };

  /**
   * Returns a matrix that corresponds to a translation of tx, ty.
   * @see Matrix#translate
   *
   * @param {Number} tx The amount to translate in the x direction.
   * @param {Number} ty The amount to translate in the y direction.
   * @return A matrix transformation representing a translation by tx and ty.
   * @type Matrix
   */
  Matrix.translation = function(tx, ty) {
    return Matrix(1, 0, 0, 1, tx, ty);
  };

  /**
   * A constant representing the identity matrix.
   * @name IDENTITY
   * @fieldOf Matrix
   */
  Matrix.IDENTITY = Matrix();
  /**
   * A constant representing the horizontal flip transformation matrix.
   * @name HORIZONTAL_FLIP
   * @fieldOf Matrix
   */
  Matrix.HORIZONTAL_FLIP = Matrix(-1, 0, 0, 1);
  /**
   * A constant representing the vertical flip transformation matrix.
   * @name VERTICAL_FLIP
   * @fieldOf Matrix
   */
  Matrix.VERTICAL_FLIP = Matrix(1, 0, 0, -1);
  
  // Export to window
  window["Point"] = Point;
  window["Matrix"] = Matrix;
}());
;
window.Mouse = (function() {
  var Mouse, buttons, set_button;
  Mouse = {
    left: false,
    right: false,
    middle: false,
    location: Point(0, 0)
  };
  buttons = [null, "left", "middle", "right"];
  set_button = function(index, state) {
    var button_name;
    button_name = buttons[index];
    return button_name ? (Mouse[button_name] = state) : null;
  };
  $(document).mousedown(function(event) {
    return set_button(event.which, true);
  });
  $(document).mouseup(function(event) {
    return set_button(event.which, false);
  });
  $(document).mousemove(function(event) {
    var x, y;
    x = event.pageX;
    y = event.pageY;
    Mouse.location = Point(x, y);
    Mouse.x = x;
    return (Mouse.y = y);
  });
  return Mouse;
})();;
/**
 * @returns The absolute value of the number.
 */
Number.prototype.abs = function() {
  return Math.abs(this);
};

/**
 * @returns The number truncated to the nearest integer of greater than or equal value.
 * 
 * (4.9).ceil(); // => 5
 * (4.2).ceil(); // => 5
 * (-1.2).ceil(); // => -1
 */
Number.prototype.ceil = function() {
  return Math.ceil(this);
};

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * <pre>
 * (x * 255).clamp(0, 255)
 * </pre>
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

/**
 * @returns The number truncated to the nearest integer of less than or equal value.
 * 
 * (4.9).floor(); // => 4
 * (4.2).floor(); // => 4
 * (-1.2).floor(); // => -2
 */
Number.prototype.floor = function() {
  return Math.floor(this);
};

/**
 * A mod method useful for array wrapping. The range of the function is
 * constrained to remain in bounds of array indices.
 *
 * <pre>
 * Example:
 * (-1).mod(5) === 4
 * </pre>
 *
 * @param {Number} base
 * @returns An integer between 0 and (base - 1) if base is positive.
 * @type Number
 */
Number.prototype.mod = function(base) {
  var result = this % base;

  if(result < 0 && base > 0) {
    result += base;
  }

  return result;
};

/**
 * @returns The number rounded to the nearest integer.
 * 
 * (4.5).round(); // => 5
 * (4.4).round(); // => 4
 */
Number.prototype.round = function() {
  return Math.round(this);
};

/**
 * @returns The sign of this number, 0 if the number is 0.
 */
Number.prototype.sign = function() {
  if(this > 0) {
    return 1;
  } else if (this < 0) {
    return -1;
  } else {
    return 0;
  }
};

/**
 * Calls iterator the specified number of times, passing in the number of the 
 * current iteration as a parameter: 0 on first call, 1 on the second call, etc. 
 * 
 * @param {Function} iterator The iterator takes a single parameter, the number 
 * of the current iteration.
 * @param {Object} [context] The optional context parameter specifies an object
 * to treat as <code>this</code> in the iterator block.
 * 
 * @returns The number of times the iterator was called.
 * @type Number
 */
Number.prototype.times = function(iterator, context) {
  for(var i = 0; i < this; i++) {
    iterator.call(context, i);
  }

  return i;
};

/**
 * Returns the the nearest grid resolution less than or equal to the number. 
 *
 *   EX: 
 *    (7).snap(8) => 0
 *    (4).snap(8) => 0
 *    (12).snap(8) => 8
 *
 * @param {Number} resolution The grid resolution to snap to.
 * @returns The nearest multiple of resolution lower than the number.
 * @type Number
 */
Number.prototype.snap = function(resolution) {
  return (this / resolution).floor() * resolution;
};

Number.prototype.toColorPart = function() {
  var s = parseInt(this.clamp(0, 255), 10).toString(16);
  if(s.length == 1) {
    s = '0' + s;
  }

  return s;
};

Number.prototype.approach = function(target, maxDelta) {
  return (target - this).clamp(-maxDelta, maxDelta) + this;
};

Number.prototype.approachByRatio = function(target, ratio) {
  return this.approach(target, this * ratio);
};

Number.prototype.approachRotation = function(target, maxDelta) {
  var twoPi = 2 * Math.PI;

  while(target > this + Math.PI) {
    target -= twoPi
  }

  while(target < this - Math.PI) {
    target += twoPi
  }

  return (target - this).clamp(-maxDelta, maxDelta) + this;
};

/**
 * @returns This number constrained between -PI and PI.
 */
Number.prototype.constrainRotation = function() {
  var twoPi = 2 * Math.PI;
  
  var target = this;

  while(target > Math.PI) {
    target -= twoPi
  }

  while(target < -Math.PI) {
    target += twoPi
  }
      
  return target;
};

Number.prototype.d = function(sides) {
  var sum = 0;

  this.times(function() {
    sum += rand(sides) + 1;
  });

  return sum;
};

/** The mathematical circle constant of 1 turn. */
Math.TAU = 2 * Math.PI;

;
(function($){
  $.fn.powerCanvas = function(options) {
    options = options || {};

    var canvas = this.get(0);

    if(!canvas) {
      return this;
    }

    var context;

    /**
     * @name PowerCanvas
     * @constructor
     */
    var $canvas = $(canvas).extend({
      /**
       * Passes this canvas to the block with the given matrix transformation
       * applied. All drawing methods called within the block will draw
       * into the canvas with the transformation applied. The transformation
       * is removed at the end of the block, even if the block throws an error.
       *
       * @name withTransform
       * @methodOf PowerCanvas#
       *
       * @param {Matrix} matrix
       * @param {Function} block
       * @returns this
       */
      withTransform: function(matrix, block) {
        context.save();

        context.transform(
          matrix.a,
          matrix.b,
          matrix.c,
          matrix.d,
          matrix.tx,
          matrix.ty
        );

        try {
          block(this);
        } finally {
          context.restore();
        }

        return this;
      },

      clear: function() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        return this;
      },
      
      context: function() {
        return context;
      },
      
      element: function() {
        return canvas;
      },
      
      createLinearGradient: function(x0, y0, x1, y1) {
        return context.createLinearGradient(x0, y0, x1, y1);
      },
      
      createRadialGradient: function(x0, y0, r0, x1, y1, r1) {
        return context.createRadialGradient(x0, y0, r0, x1, y1, r1);
      },
      
      createPattern: function(image, repitition) {
        return context.createPattern(image, repitition);
      },

      drawImage: function(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        return this;
      },
      
      drawLine: function(x1, y1, x2, y2, width) {
        width = width || 3;

        context.lineWidth = width;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.closePath();
        context.stroke();
      },

      fill: function(color) {
        $canvas.fillColor(color);
        context.fillRect(0, 0, canvas.width, canvas.height);

        return this;
      },

      /**
       * Fills a circle at the specified position with the specified
       * radius and color.
       *
       * @name fillCircle
       * @methodOf PowerCanvas#
       *
       * @param {Number} x
       * @param {Number} y
       * @param {Number} radius
       * @param {Number} color
       * @see PowerCanvas#fillColor 
       * @returns this
       */
      fillCircle: function(x, y, radius, color) {
        $canvas.fillColor(color);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI*2, true);
        context.closePath();
        context.fill();

        return this;
      },

      /**
       * Fills a rectangle with the current fillColor
       * at the specified position with the specified
       * width and height 
      
       * @name fillRect
       * @methodOf PowerCanvas#
       *
       * @param {Number} x
       * @param {Number} y
       * @param {Number} width
       * @param {Number} height
       * @see PowerCanvas#fillColor 
       * @returns this
       */      
      
      fillRect: function(x, y, width, height) {
        context.fillRect(x, y, width, height);

        return this;
      },

      /**
      * Adapted from http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
      */
      
      fillRoundRect: function(x, y, width, height, radius, strokeWidth) {
        if (!radius) {
          radius = 5;
        }
        
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);        
        context.closePath();
                  
        if (strokeWidth) {
          context.lineWidth = strokeWidth;  
          context.stroke();
        }
        
        context.fill();  
    
        return this;    
      },       

      fillText: function(text, x, y) {
        context.fillText(text, x, y);

        return this;
      },

      centerText: function(text, y) {
        var textWidth = $canvas.measureText(text);

        $canvas.fillText(text, (canvas.width - textWidth) / 2, y);
      },

      fillWrappedText: function(text, x, y, width) {
        var tokens = text.split(" ");
        var tokens2 = text.split(" ");
        var lineHeight = 16;

        if ($canvas.measureText(text) > width) {
          if (tokens.length % 2 == 0) {
            tokens2 = tokens.splice(tokens.length / 2, (tokens.length / 2), "");
          } else {
            tokens2 = tokens.splice(tokens.length / 2 + 1, (tokens.length / 2) + 1, "");
          }
          context.fillText(tokens.join(" "), x, y);
          context.fillText(tokens2.join(" "), x, y + lineHeight);
        } else {
          context.fillText(tokens.join(" "), x, y + lineHeight);
        }
      },

      fillColor: function(color) {
        if(color) {
          context.fillStyle = color.toString();
          return this;
        } else {
          return context.fillStyle;
        }
      },

      font: function(font) {
        context.font = font;
      },

      measureText: function(text) {
        return context.measureText(text).width;
      },

      putImageData: function(imageData, x, y) {
        context.putImageData(imageData, x, y);

        return this;
      },

      strokeColor: function(color) {
        if(color) {
          context.strokeStyle = color.toString();
          return this;
        } else {
          return context.strokeStyle;
        }
      },
      
      strokeRect: function(x, y, width, height) {
        context.strokeRect(x, y, width, height);

        return this;
      },

      textAlign: function(textAlign) {
        context.textAlign = textAlign;
        return this;
      },

      height: function() {
        return canvas.height;
      },

      width: function() {
        return canvas.width;
      }
    });

    if(canvas.getContext) {
      context = canvas.getContext('2d');

      if(options.init) {
        options.init($canvas);
      }

      return $canvas;
    } else {
      return false;
    }

  };
})(jQuery);
;
(function($) {
  window.Random = $.extend(window.Random, {
    angle: function() {
      return rand() * Math.TAU;
    },
    often: function() {
      return rand(3);
    },
    sometimes: function() {
      return !rand(3);
    }
  });
  /***
  Returns random integers from [0, n) if n is given.
  Otherwise returns random float between 0 and 1.

  @param {Number} n
  */
  return (window.rand = function(n) {
    return n ? Math.floor(n * Math.random()) : Math.random();
  });
})(jQuery);;
(function($) {
  var retrieve, store;
  /***
  @name Local
  @namespace
  */
  /***
  Store an object in local storage.

  @name set
  @methodOf Local

  @param {String} key
  @param {Object} value
  @type Object
  @returns value
  */
  store = function(key, value) {
    localStorage[key] = JSON.stringify(value);
    return value;
  };
  /***
  Retrieve an object from local storage.

  @name get
  @methodOf Local

  @param {String} key
  @type Object
  @returns The object that was stored or undefined if no object was stored.
  */
  retrieve = function(key) {
    var value;
    value = localStorage[key];
    return (typeof value !== "undefined" && value !== null) ? JSON.parse(value) : null;
  };
  return (window.Local = $.extend(window.Local, {
    get: retrieve,
    set: store,
    put: store
  }));
})(jQuery);;
String.prototype.constantize = function() {
  if (this.match(/[A-Z][A-Za-z0-9]*/)) {
    eval("var that = " + (this));
    return that;
  } else {
    return undefined;
  }
};
String.prototype.parse = function() {
  try {
    return JSON.parse(this);
  } catch (e) {
    return this;
  }
};;
;
(function() {
  var Animation, fromPixieId;
  Animation = function(data) {
    var activeAnimation, advanceFrame, currentSprite, spriteLookup;
    spriteLookup = {};
    activeAnimation = data.animations[0];
    currentSprite = data.animations[0].frames[0];
    advanceFrame = function(animation) {
      var frames;
      frames = animation.frames;
      return (currentSprite = frames[(frames.indexOf(currentSprite) + 1) % frames.length]);
    };
    data.tileset.each(function(spriteData, i) {
      return (spriteLookup[i] = Sprite.fromURL(spriteData.src));
    });
    return $.extend(data, {
      currentSprite: function() {
        return currentSprite;
      },
      draw: function(canvas, x, y) {
        return canvas.withTransform(Matrix.translation(x, y), function() {
          return spriteLookup[currentSprite].draw(canvas, 0, 0);
        });
      },
      frames: function() {
        return activeAnimation.frames;
      },
      update: function() {
        return advanceFrame(activeAnimation);
      },
      active: function(name) {
        if (name !== undefined) {
          return data.animations[name] ? (currentSprite = data.animations[name].frames[0]) : null;
        } else {
          return activeAnimation;
        }
      }
    });
  };
  window.Animation = function(name, callback) {
    return fromPixieId(App.Animations[name], callback);
  };
  fromPixieId = function(id, callback) {
    var proxy, url;
    url = ("http://pixie.strd6.com/s3/animations/" + (id) + "/data.json");
    proxy = {
      active: $.noop,
      draw: $.noop
    };
    $.getJSON(url, function(data) {
      $.extend(proxy, Animation(data));
      return callback(proxy);
    });
    return proxy;
  };
  return (window.Animation.fromPixieId = fromPixieId);
})();;
(function($) {
  /**
  * Bindable module
  * @name Bindable
  * @constructor
  */
  function Bindable() {
    
    var eventCallbacks = {};
    
    return {
      /**
      * The bind method adds a function as an event listener.
      *
      * @name bind
      * @methodOf Bindable#
      *
      * @param {String} event The event to listen to.
      * @param {Function} callback The function to be called when the specified event
      * is triggered.
      */
      bind: function(event, callback) {
        eventCallbacks[event] = eventCallbacks[event] || [];
        
        eventCallbacks[event].push(callback);
      },
      
      unbind: function(event, callback) {
        eventCallbacks[event] = eventCallbacks[event] || [];
        
        if(callback) {
          eventCallbacks.remove(callback);
        } else {
          eventCallbacks[event] = [];
        }
      },
      /**
      * The trigger method calls all listeners attached to the specified event.
      *
      * @name trigger
      * @methodOf Bindable#
      *
      * @param {String} event The event to trigger.
      * @param {Array} [extraParameters] Additional parameters to pass to the event listener.
      */
      trigger: function(event, extraParameters) {
        var callbacks = eventCallbacks[event];
        
        if(callbacks && callbacks.length) {
          var self = this;
          $.each(callbacks, function(i, callback) {
            callback.apply(self, [self].concat(extraParameters));
          });
        }
      },
    };
  }
  
  window.Bindable = Bindable;
}(jQuery));
;
var Bounded;
/***
The Bounded module is used to provide basic data about the
location and dimensions of the including object

Bounded module
@name Bounded
@constructor
*/
Bounded = function(I) {
  I || (I = {});
  return {
    /***
    The bounds method returns infomation about the location
    of the object and its dimensions with optional offsets

    @name bounds
    @methodOf Bounded#

    @param {number} xOffset the amount to shift the x position
    @param {number} yOffset the amount to shift the y position
    */
    bounds: function(xOffset, yOffset) {
      return {
        x: I.x + (xOffset || 0),
        y: I.y + (yOffset || 0),
        width: I.width,
        height: I.height
      };
    },
    /***
    The centeredBounds method returns infomation about the center
    of the object along with the midpoint of the width and height

    @name centeredBounds
    @methodOf Bounded#
    */
    centeredBounds: function() {
      return {
        x: I.x + I.width / 2,
        y: I.y + I.height / 2,
        xw: I.width / 2,
        yw: I.height / 2
      };
    },
    /***
    The center method returns the {@link Point} that is
    the center of the object

    @name center
    @methodOf Bounded#
    */
    center: function() {
      return Point(I.x + I.width / 2, I.y + I.height / 2);
    }
  };
};;
var CellularAutomata;
CellularAutomata = function(I) {
  var currentState, get, neighbors, nextState, self;
  I || (I = {});
  $.reverseMerge(I, {
    cellUpdate: function(row, col, value, neighbors) {
      var neighborCounts;
      neighborCounts = neighbors.sum();
      return +((value + neighborCounts) >= 5);
    },
    initializeCell: function(row, col) {
      return rand() < 0.45;
    },
    outsideValue: function(row, col) {
      return 1;
    },
    width: 32,
    height: 32
  });
  currentState = [];
  nextState = [];
  get = function(row, col) {
    if (((0 <= row) && (row < I.height)) && ((0 <= col) && (col < I.width))) {
      return currentState[row][col];
    } else {
      return I.outsideValue(row, col);
    }
  };
  neighbors = function(row, col) {
    return [get(row - 1, col - 1), get(row - 1, col), get(row - 1, col + 1), get(row, col - 1), get(row, col + 1), get(row + 1, col - 1), get(row + 1, col), get(row + 1, col + 1)];
  };
  I.height.times(function(row) {
    currentState[row] = [];
    return I.width.times(function(col) {
      return (currentState[row][col] = I.initializeCell(row, col));
    });
  });
  self = {
    data: function() {
      return currentState;
    },
    get: function(row, col) {
      return currentState[row][col];
    },
    update: function(updateFn) {
      I.height.times(function(row) {
        return (nextState[row] = currentState[row].map(function(value, col) {
          return updateFn ? updateFn(row, col, value, neighbors(row, col)) : I.cellUpdate(row, col, value, neighbors(row, col));
        }));
      });
      currentState = nextState;
      return (nextState = []);
    }
  };
  return self;
};;
var Collidable;
Collidable = function(I) {
  I || (I = {});
  return {
    solid_collision: function(other) {
      if (other.solid && other.bounds) {
        if (Collision.rectangular(self, other)) {
          self.trigger('collision');
          return other.trigger('collision');
        }
      }
    }
  };
};;
var Collision;
Collision = {
  rectangular: function(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  },
  rayRectangle: function(source, direction, target) {
    var areaPQ0, areaPQ1, hit, p0, p1, t, tX, tY, xval, xw, yval, yw;
    xw = target.xw;
    yw = target.yw;
    if (source.x < target.x) {
      xval = target.x - xw;
    } else {
      xval = target.x + xw;
    }
    if (source.y < target.y) {
      yval = target.y - yw;
    } else {
      yval = target.y + yw;
    }
    if (direction.x === 0) {
      p0 = Point(target.x - xw, yval);
      p1 = Point(target.x + xw, yval);
      t = (yval - source.y) / direction.y;
    } else if (direction.y === 0) {
      p0 = Point(xval, target.y - yw);
      p1 = Point(xval, target.y + yw);
      t = (xval - source.x) / direction.x;
    } else {
      tX = (xval - source.x) / direction.x;
      tY = (yval - source.y) / direction.y;
      if ((tX < tY || ((-xw < source.x - target.x) && (source.x - target.x < xw))) && !((-yw < source.y - target.y) && (source.y - target.y < yw))) {
        p0 = Point(target.x - xw, yval);
        p1 = Point(target.x + xw, yval);
        t = tY;
      } else {
        p0 = Point(xval, target.y - yw);
        p1 = Point(xval, target.y + yw);
        t = tX;
      }
    }
    if (t > 0) {
      areaPQ0 = direction.cross(p0.subtract(source));
      areaPQ1 = direction.cross(p1.subtract(source));
      return areaPQ0 * areaPQ1 < 0 ? (hit = direction.scale(t).add(source)) : null;
    }
  }
};;
var DebugConsole;
DebugConsole = function() {
  var REPL, container, input, output, repl, runButton;
  REPL = function(input, output) {
    var print;
    print = function(message) {
      return output.append($("<li />", {
        text: message
      }));
    };
    return {
      run: function() {
        var code, result, source;
        source = input.val();
        try {
          code = CoffeeScript.compile(source, {
            bare: true
          });
          if (code.indexOf("var") === 0) {
            code = code.substring(code.indexOf("\n"));
          }
          result = eval(code);
          print(" => " + (result));
          return input.val('');
        } catch (error) {
          return error.stack ? print(error.stack) : print(error.toString());
        }
      }
    };
  };
  container = $("<div />", {
    "class": "console"
  });
  input = $("<textarea />");
  output = $("<ul />");
  runButton = $("<button />", {
    text: "Run"
  });
  repl = REPL(input, output);
  container.append(output).append(input).append(runButton);
  return $(function() {
    runButton.click(function() {
      return repl.run();
    });
    return $("body").append(container);
  });
};;
function DialogBox(I) {
  I = I || {};
  
  $.reverseMerge(I, {
    backgroundColor: "#000",
    blinkRate: 8,
    cursor: true,
    cursorWidth: 10,
    height: 480,
    lineHeight: 16,
    paddingX: 24,
    paddingY: 24,
    text: "",
    textColor: "#080",
    width: 640,
    x: 0,
    y: 0
  });
  
  I.textWidth = I.width - 2*(I.paddingX);
  I.textHeight = I.height - 2*(I.paddingY);
  
  var blinkCount = 0;
  var cursorOn = true;
  
  var pageOffset = 0;
  var displayChars = 0;
  
  return {
    complete: function() {
      return displayChars >= I.text.length - 1;
    },
    
    draw: function(canvas) {
      //TODO: A lot of the logic in here should be moved into the
      // update method and pre-computed.
      var textStart = Point(I.paddingX, I.paddingY + I.lineHeight);
      
      canvas.withTransform(Matrix.translation(I.x, I.y), function() {
        canvas.fillColor(I.backgroundColor);
        canvas.fillRect(0, 0, I.width, I.height);
        
        canvas.fillColor(I.textColor);
        
        var pageCharCount = 0;
        var displayText = I.text.substr(pageOffset, displayChars);
        
        var piecesRemaining = displayText.split(' ');
        var lineWidth = 0;
        var line = 0;
        
        while(piecesRemaining.length > 0) {
          var currentLine = piecesRemaining.shift();
          
          while((canvas.measureText(currentLine) <= I.textWidth) && (piecesRemaining.length > 0)) {
            var proposedLine = currentLine + " " + piecesRemaining[0];
            
            if(canvas.measureText(proposedLine) <= I.textWidth) {
              piecesRemaining.shift();
              currentLine = proposedLine;
            } else {
              break;
                ;//NOOP
            }
          }
          
          pageCharCount += currentLine.length;
          
          canvas.fillText(currentLine, textStart.x, textStart.y + line * I.lineHeight);
          lineWidth = canvas.measureText(currentLine);
          
          if(line * I.lineHeight < I.textHeight) {
            line += 1;
          } else {
            pageOffset += pageCharCount + line;
            line = 0;
            pageCharCount = 0;
            displayChars = 0;
            break;
              ;
          }
        }
        
        if(cursorOn && I.cursor) {
          canvas.fillRect(textStart.x + lineWidth, textStart.y + (line - 2) *I.lineHeight, I.cursorWidth, I.lineHeight);
        }
      });
      
    },
    
    flush: function() {
      displayChars = I.text.length;
    },
    
    setText: function(text) {
      pageOffset = 0;
      displayChars = 0;
      I.text = text;
    },
    
    update: function() {
      displayChars += 1;
      blinkCount += 1;
      
      if(blinkCount >= I.blinkRate) {
        blinkCount = 0;
        cursorOn = !cursorOn;
      }
    }
  };
};
var Drawable;
/**
The Drawable module is used to provide a simple draw method to the including
object.

@name Drawable
@constructor
@param {Object} I Instance variables
*/
Drawable = function(I) {
  I || (I = {});
  $.reverseMerge(I, {
    color: "#196",
    spriteName: null
  });
  if (I.spriteName) {
    I.sprite = Sprite(I.spriteName, function(sprite) {
      I.width = sprite.width;
      return (I.height = sprite.height);
    });
  }
  return {
    /**
    Draw this object on the canvas. It uses the x and y instance attributes to position
    and the sprite instance attribute to determine what to draw.

    @name draw
    @methodOf Drawable#

    @param canvas
    */
    draw: function(canvas) {
      if (I.transform) {
        return canvas.withTransform(Matrix.translation(I.x + I.width / 2, I.y + I.height / 2).concat(I.transform).concat(Matrix.translation(-I.width / 2, -I.height / 2)), function(canvas) {
          if (I.sprite) {
            return I.sprite.draw(canvas, 0, 0);
          } else if (I.color) {
            canvas.fillColor(I.color);
            return canvas.fillRect(0, 0, I.width, I.height);
          }
        });
      } else {
        if (I.sprite) {
          return I.sprite.draw(canvas, I.x, I.y);
        } else if (I.color) {
          canvas.fillColor(I.color);
          return canvas.fillRect(I.x, I.y, I.width, I.height);
        }
      }
    }
  };
};;
var Durable;
Durable = function(I) {
  $.reverseMerge(I, {
    duration: -1
  });
  return {
    before: {
      update: function() {
        return I.duration !== -1 && (I.age >= I.duration) ? (I.active = false) : null;
      }
    }
  };
};;
var Emitter;
Emitter = function(I) {
  var self;
  self = GameObject(I);
  return self.include(Emitterable);
};;
var Emitterable;
Emitterable = function(I, self) {
  var n, particles;
  I || (I = {});
  $.reverseMerge(I, {
    batchSize: 1,
    emissionRate: 1,
    color: "blue",
    width: 0,
    height: 0,
    generator: {},
    particleCount: Infinity,
    particleData: {
      acceleration: Point(0, 0.1),
      age: 0,
      color: "blue",
      duration: 30,
      height: 2,
      maxSpeed: 2,
      offset: Point(0, 0),
      sprite: false,
      spriteName: false,
      velocity: Point(-0.25, 1),
      width: 2
    }
  });
  particles = [];
  n = 0;
  return {
    before: {
      draw: function(canvas) {
        return particles.invoke("draw", canvas);
      },
      update: function() {
        I.batchSize.times(function() {
          var center, particleProperties;
          if (n < I.particleCount && rand() < I.emissionRate) {
            center = self.center();
            particleProperties = $.reverseMerge({
              x: center.x,
              y: center.y
            }, I.particleData);
            $.each(I.generator, function(key, value) {
              return I.generator[key].call ? (particleProperties[key] = I.generator[key](n, I)) : (particleProperties[key] = I.generator[key]);
            });
            particleProperties.x += particleProperties.offset.x;
            particleProperties.y += particleProperties.offset.y;
            particles.push(GameObject(particleProperties));
            return n += 1;
          }
        });
        particles = particles.select(function(particle) {
          return particle.update();
        });
        return n === I.particleCount && !particles.length ? (I.active = false) : null;
      }
    }
  };
};;
(function($) {
  var specialKeys = {
    8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 
    19: "pause", 20: "capslock", 27: "esc", 32: "space", 
    33: "pageup", 34: "pagedown", 35: "end", 36: "home", 
    37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
    96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
    104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
    112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 
    118: "f7", 119: "f8", 120: "f9", 121: "f10", 122: "f11", 123: "f12", 
    144: "numlock", 145: "scroll", 188: ",", 191: "/", 224: "meta"
  };
  
  $(function() {
    /**
    * @name Game
    */
    window.Game = (function () {
      var keydownListeners = {};
      var keyheldListeners = {};
      var keyupListeners = {};
      
      var prevKeysDown = {};
      var keysDown = {};
      var keysUp = {};
      
      var step = 0;
      var score = 0;
      
      var drawCallback = $.noop;
      
      var self = {
        draw: function(fn) {
          drawCallback = fn;
        },
        
        exec: function(command) {
          var result = '';

          try {
            result = eval(command);
          } catch(e) {
            result = e.message;
          }
          
          return result;
        },
        
        keydown: function(key, fn) {
          if(fn) {
            keydownListeners[key] = keydownListeners[key] || [];
            
            keydownListeners[key].push(fn);
          } else {
            return prevKeysDown[key];
          }
        },
        
        keyheld: function(key, fn) {
          keyheldListeners[key] = keyheldListeners[key] || [];
          
          keyheldListeners[key].push(fn);
        },
        
        keyup: function(key, fn) {
          keyupListeners[key] = keyupListeners[key] || [];
          
          keyupListeners[key].push(fn);
        },
        
        score: function(val) {
          if (val !== undefined) {
            score += val;      
            return self;
          } else {
            return score;
          }    
        },
        
        setFramerate: function(newValue) {
          self.stop();
          
          setInterval(function() {
            checkInputs();
            self.trigger('update');
          
            drawCallback(canvas);
          
            step += 1;
          }, 1000 / newValue);
        },        
        
        step: function() {
          return step;
        },
        
        stop: function() {
          clearInterval(loopInterval);
        },
        
        update: function(fn) {
          self.unbind('update');
          self.bind('update', fn);
        },
        
        width: App.width,
        height: App.height
      };
      
      $.extend(self, Bindable());
      
      function triggerListener(listener) {
        listener();
      }
      
      function checkInputs() {
        var listeners;
        
        $.each(keysDown, function(key, down) {
          listeners = null;
          if(prevKeysDown[key] && !keysUp[key]) {
            listeners = keyheldListeners[key];
          } else if(down || (keysUp[key] && !prevKeysDown[key])) {
            listeners = keydownListeners[key];
          }
          
          if(listeners) {
            listeners.each(triggerListener);
          }
        });
        
        $.each(keysUp, function(key, up) {
          listeners = null;
          listeners = keyupListeners[key];
          
          if(listeners) {
            listeners.each(triggerListener);
          }
        });
        
        prevKeysDown = {};
        $.each(keysDown, function(key, down) {
          if(down) {
            prevKeysDown[key] = true;
          }
        });
        keysUp = {};
      }
      
      var loopInterval = setInterval(function() {
        checkInputs();
        self.trigger('update');
        
        drawCallback(canvas);
        
        step += 1;
      }, 33.3333);
      
      function keyName(event) {
        return specialKeys[event.which] ||
          String.fromCharCode(event.which).toLowerCase();
      }
      
      $(document).bind("keydown", function(event) {
        keysDown[keyName(event)] = true;
        if(/textarea|select/i.test( event.target.nodeName ) || event.target.type === "text" || event.target.type === "password") {
          // Don't prevent default
        } else {
          event.preventDefault();
        }
      });
      
      $(document).bind("keyup", function(event) {
        keysDown[keyName(event)] = false;
        keysUp[keyName(event)] = true;
        if(/textarea|select/i.test( event.target.nodeName ) || event.target.type === "text" || event.target.type === "password") {
          // Don't prevent default
        } else {
          event.preventDefault();
        }
      });
      
      return self;
    }());
    
    var canvas = $("canvas").powerCanvas();
    
    Game.canvas = canvas;
  });
}(jQuery));


;
var GameObject;
GameObject = function(I) {
  var autobindEvents, defaultModules, modules, self;
  I || (I = {});
  $.reverseMerge(I, {
    age: 0,
    active: true,
    created: false,
    destroyed: false,
    x: 0,
    y: 0,
    width: 8,
    height: 8,
    solid: false,
    includedModules: [],
    excludedModules: []
  });
  self = Core(I).extend({
    update: function() {
      if (I.active) {
        self.trigger('step');
        I.age += 1;
      }
      return I.active;
    },
    draw: $.noop,
    position: function() {
      return Point(I.x, I.y);
    },
    collides: function(bounds) {
      return Collision.rectangular(I, bounds);
    },
    destroy: function() {
      if (!(I.destroyed)) {
        self.trigger('destroy');
      }
      I.destroyed = true;
      return (I.active = false);
    }
  });
  defaultModules = [Bindable, Bounded, Drawable, Durable, Movable];
  modules = defaultModules.concat(I.includedModules.invoke('constantize'));
  modules = modules.without(I.excludedModules.invoke('constantize'));
  modules.each(function(Module) {
    return self.include(Module);
  });
  self.attrAccessor("solid");
  autobindEvents = ['create', 'destroy', 'step'];
  autobindEvents.each(function(eventName) {
    var event;
    return (event = I[eventName]) ? (typeof event === "function" ? self.bind(eventName, event) : self.bind(eventName, eval("(function(self) {" + (event) + "})"))) : null;
  });
  if (!(I.created)) {
    self.trigger('create');
  }
  I.created = true;
  $(document).bind('mousedown', function(event) {
    return ((I.x <= event.offsetX) && (event.offsetX <= I.x + I.width)) && ((I.y <= event.offsetY) && (event.offsetY <= I.y + I.height)) ? self.trigger('click') : null;
  });
  return self;
};
GameObject.construct = function(entityData) {
  return entityData["class"] ? entityData["class"].constantize()(entityData) : GameObject(entityData);
};;
var GameUtil;
GameUtil = {
  readImageData: function(data, callback) {
    var ctx, getPixelColor, img;
    getPixelColor = function(imageData, x, y) {
      var index;
      index = (x + y * imageData.width) * 4;
      return [imageData.data[index + 0], imageData.data[index + 1], imageData.data[index + 2]].invoke("toColorPart").join('');
    };
    ctx = document.createElement('canvas').getContext('2d');
    img = new Image();
    img.onload = function() {
      var colors, imageData;
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      colors = [];
      img.height.times(function(y) {
        return img.width.times(function(x) {
          return colors.push(getPixelColor(imageData, x, y));
        });
      });
      return callback({
        colors: colors,
        width: img.width,
        height: img.height
      });
    };
    return (img.src = data);
  }
};;
var Heavy;
Heavy = function(I) {
  I || (I = {});
  $.reverseMerge(I, {
    gravity: 0.2,
    maxSpeed: 5
  });
  return {
    before: {
      update: function() {
        return (I.velocity = I.velocity.add(Point(0, I.gravity)));
      }
    }
  };
};;
var Hittable;
Hittable = function(I, self) {
  I || (I = {});
  $.reverseMerge(I, {
    health: 25
  });
  return {
    hit: function() {
      I.health--;
      if (I.health < 0) {
        return self.destroy();
      }
    }
  };
};;
function KeyHandler(I) {
  I = I || {};
  
  $.reverseMerge(I, {
    keydown: {},
    keyheld: {},
    keyup: {},
  });
  
  return {
    /**
    * @returns true if event should be passed on to other handlers.
    */
    keydown: function(key) {
      if(I.keydown[key]) {
        return I.keydown[key]();
      } else {
        return true;
      }
    },
    
    keyheld: function(key) {
      if(I.keyheld[key]) {
        return I.keyheld[key]();
      } else {
        return true;
      }
    },
    
    keyup: function(key) {
      if(I.keyup[key]) {
        return I.keyup[key]();
      } else {
        return true;
      }
    }
  };
};
var Movable;
Movable = function(I) {
  $.reverseMerge(I, {
    acceleration: Point(0, 0),
    velocity: Point(0, 0)
  });
  I.acceleration = Point(I.acceleration.x, I.acceleration.y);
  I.velocity = Point(I.velocity.x, I.velocity.y);
  return {
    before: {
      update: function() {
        var _ref, currentSpeed;
        I.velocity = I.velocity.add(I.acceleration);
        if (typeof (_ref = I.maxSpeed) !== "undefined" && _ref !== null) {
          currentSpeed = I.velocity.magnitude();
          if (currentSpeed > I.maxSpeed) {
            I.velocity = I.velocity.scale(I.maxSpeed / currentSpeed);
          }
        }
        I.x += I.velocity.x;
        return I.y += I.velocity.y;
      }
    }
  };
};;
var Rotatable;
Rotatable = function(I) {
  I || (I = {});
  $.reverseMerge(I, {
    rotation: 0,
    rotationalVelocity: 0
  });
  return {
    before: {
      update: function() {
        return I.rotation += I.rotationalVelocity;
      }
    }
  };
};;
var SpeechBox;
SpeechBox = function(I) {
  var addLine, chars, counter, grad, line, self, stringLine, text;
  I || (I = {});
  $.reverseMerge(I, {
    backgroundColor: 'rgb(175, 175, 175)',
    strokeColor: '#000',
    strokeWidth: 5,
    textColor: 'rgb(0, 0, 0)',
    textDelay: 1,
    gradient: true,
    height: 50,
    padding: 15,
    width: 400,
    text: "This is a test blah blah blh blah This is a test blah blah blah blah This is a test blah blah blah blah This is a test blah blah blah blah",
    x: 50,
    y: 40
  });
  chars = I.text.split("");
  text = [[]];
  line = 1;
  addLine = function() {
    line++;
    return (text[line - 1] = []);
  };
  stringLine = function(line) {
    return text[line - 1].join("");
  };
  counter = 0;
  if (I.gradient) {
    grad = Game.canvas.createLinearGradient(0, 0, 0, 3 * I.height);
    grad.addColorStop(0, I.backgroundColor);
    grad.addColorStop(1, 'rgb(0, 0, 0)');
  }
  return (self = {
    draw: function(canvas) {
      if (I.gradient) {
        canvas.context().fillStyle = grad;
      } else {
        canvas.fillColor(I.backgroundColor);
      }
      canvas.strokeColor(I.strokeColor);
      canvas.fillRoundRect(I.x + I.strokeWidth / 2, I.y + I.strokeWidth / 2, I.width - I.strokeWidth, I.height, 20, I.strokeWidth);
      canvas.fillColor(I.textColor);
      return (line).times(function(i) {
        return canvas.fillText(stringLine(i + 1), I.x + I.padding, I.y + (15 * (i + 1)));
      });
    },
    update: function() {
      var currentChar;
      counter = (counter + 1) % I.textDelay;
      if (counter <= 0) {
        currentChar = chars.shift();
        text[line - 1].push(currentChar);
        return Game.canvas.measureText(stringLine(line)) > I.width - I.padding * 2 ? addLine() : null;
      }
    }
  });
};;
(function() {
  function LoaderProxy() {
    return {
      draw: $.noop,
      fill: $.noop,
      frame: $.noop,
      update: $.noop,
      width: null,
      height: null
    };
  }
  
  function Sprite(image, sourceX, sourceY, width, height) {
    sourceX = sourceX || 0;
    sourceY = sourceY || 0;
    width = width || image.width;
    height = height || image.height;
    
    return {
      draw: function(canvas, x, y) {
        canvas.drawImage(
          image,
          sourceX,
          sourceY,
          width,
          height,
          x,
          y,
          width,
          height
        );
      },
      
      fill: function(canvas, x, y, width, height, repeat) {
        repeat = repeat || "repeat";
        var pattern = canvas.createPattern(image, repeat);
        canvas.fillColor(pattern);
        canvas.fillRect(x, y, width, height);
      },
      
      width: width,
      height: height
    };
  };
  
  Sprite.load = function(url, loadedCallback) {
    var img = new Image();
    var proxy = LoaderProxy();
    
    img.onload = function() {
      var tile = Sprite(this);
      
      $.extend(proxy, tile);
      
      if(loadedCallback) {
        loadedCallback(proxy);
      }
    };
    
    img.src = url;
    
    return proxy;
  };
 
  var pixieSpriteImagePath = "http://s3.amazonaws.com/images.pixie.strd6.com/sprites/";
  
  function fromPixieId(id, callback) {
    return Sprite.load(pixieSpriteImagePath + id + "/original.png", callback);
  };
  
  window.Sprite = function(name, callback) {
    if(App.Sprites) {
      var id = App.Sprites[name];
      if(id) {
        return fromPixieId(id, callback);
      } else {
        warn("Could not find sprite named: '" + name + "' in App.");
      }
    } else {
      // Treat name as URL
      return window.Sprite.fromURL(name, callback);
    }
  };
  window.Sprite.EMPTY = window.Sprite.NONE = LoaderProxy();
  window.Sprite.fromPixieId = fromPixieId;
  window.Sprite.fromURL = Sprite.load;
}());;
/**
StateMachine = () ->
  currentState = null
  initialState = null

  self = GameObject().extend
    defaultState: () ->
      return initialState

    transition: (toState) ->
      currentState.trigger(toState)

  self.attrAccessor('currentState')

  return self
*/;
(function() {
  var Map, fromPixieId;
  Map = function(data, entityCallback) {
    var loadEntities, spriteLookup, tileHeight, tileWidth;
    tileHeight = data.tileHeight;
    tileWidth = data.tileWidth;
    spriteLookup = {};
    data.tileset.each(function(tileData, i) {
      return (spriteLookup[i] = Sprite.fromURL(tileData.src));
    });
    loadEntities = function() {
      if (!(entityCallback)) {
        return null;
      }
      return data.layers.each(function(layer, layerIndex) {
        if (!(layer.name.match(/entities/i))) {
          return null;
        }
        return layer.tiles.each(function(row, y) {
          return row.each(function(tileIndex, x) {
            var entityData;
            if (spriteLookup[tileIndex]) {
              entityData = $.extend({
                layer: layerIndex,
                sprite: spriteLookup[tileIndex],
                tileIndex: tileIndex,
                x: x * tileWidth,
                y: y * tileHeight
              }, data.tileset[tileIndex] == null ? undefined : data.tileset[tileIndex].properties);
              return entityCallback(entityData);
            }
          });
        });
      });
    };
    loadEntities();
    return $.extend(data, {
      draw: function(canvas, x, y) {
        return canvas.withTransform(Matrix.translation(x, y), function() {
          return data.layers.each(function(layer) {
            if (layer.name.match(/entities/i)) {
              return null;
            }
            return layer.tiles.each(function(row, y) {
              return row.each(function(tileIndex, x) {
                var sprite;
                return (sprite = spriteLookup[tileIndex]) ? sprite.draw(canvas, x * tileWidth, y * tileHeight) : null;
              });
            });
          });
        });
      }
    });
  };
  window.Tilemap = function(name, callback, entityCallback) {
    return fromPixieId(App.Tilemaps[name], callback, entityCallback);
  };
  fromPixieId = function(id, callback, entityCallback) {
    var proxy, url;
    url = ("http://pixie.strd6.com/s3/tilemaps/" + (id) + "/data.json");
    proxy = {
      draw: $.noop
    };
    $.getJSON(url, function(data) {
      $.extend(proxy, Map(data, entityCallback));
      return (typeof callback === "function" ? callback(proxy) : undefined);
    });
    return proxy;
  };
  window.Tilemap.fromPixieId = fromPixieId;
  return (window.Tilemap.load = function(options) {
    return options.pixieId ? fromPixieId(options.pixieId, options.complete, options.entity) : null;
  });
})();;
;$(function(){ undefined });;
var a2j={};
(function(L,I){if(I.flash)if(I.flash.utils){if(!I.flash.utils.Dictionary)I.flash.utils.Dictionary=Object}else I.flash.utils={Dictionary:Object};else I.flash={utils:{Dictionary:Object}};I.Vector=I.Array;Function.prototype.inherit=function(H){var F=Function.prototype.inherit.empty;F.prototype=H.prototype;this.prototype=new F;this.prototype.constructor=this};Function.prototype.inherit.empty=function(){};I.trace=function(){I.console&&I.console.log instanceof Function&&I.console.log.apply(I.console,arguments)};
I.assert=function(){I.console&&I.console.assert instanceof Function&&I.console.assert.apply(I.console,arguments)};L.warn=function(){I.console&&console.warn.apply(console,arguments)};L.generateCallback=function(H,F){return function(){F.apply(H,arguments)}};L.NVector=function(H){if(H===undefined)H=0;for(var F=Array(H||0),G=0;G<H;++G)F[G]=0;return F};L.is=function(H,F){if(H===null)return false;if(F instanceof Function&&H instanceof F)return true;if(H.constructor.__implements!=undefined&&H.constructor.__implements[F])return true;
return false};L.parseUInt=function(H){return Math.abs(parseInt(H))}})(a2j,window,undefined);var Vector_a2j_Number=a2j.NVector;window.Box2D||(Box2D={});if(!window.Box2D.Collision)Box2D.Collision={};if(!window.Box2D.Collision.Shapes)Box2D.Collision.Shapes={};if(!window.Box2D.Common)Box2D.Common={};if(!window.Box2D.Common.Math)Box2D.Common.Math={};if(!window.Box2D.Dynamics)Box2D.Dynamics={};if(!window.Box2D.Dynamics.Contacts)Box2D.Dynamics.Contacts={};
if(!window.Box2D.Dynamics.Controllers)Box2D.Dynamics.Controllers={};if(!window.Box2D.Dynamics.Joints)Box2D.Dynamics.Joints={};
(function(){function L(){L.b2AABB.apply(this,arguments)}function I(){I.b2Bound.apply(this,arguments)}function H(){H.b2BoundValues.apply(this,arguments);this.constructor===H&&this.b2BoundValues.apply(this,arguments)}function F(){F.b2BroadPhase.apply(this,arguments);this.constructor===F&&this.b2BroadPhase.apply(this,arguments)}function G(){G.b2Collision.apply(this,arguments)}function A(){A.b2ContactID.apply(this,arguments);this.constructor===A&&this.b2ContactID.apply(this,arguments)}function N(){N.b2ContactPoint.apply(this,
arguments)}function s(){s.b2Distance.apply(this,arguments)}function C(){C.b2DistanceInput.apply(this,arguments)}function R(){R.b2DistanceOutput.apply(this,arguments)}function aa(){aa.b2DistanceProxy.apply(this,arguments)}function $(){$.b2DynamicTree.apply(this,arguments);this.constructor===$&&this.b2DynamicTree.apply(this,arguments)}function T(){T.b2DynamicTreeBroadPhase.apply(this,arguments)}function Q(){Q.b2DynamicTreeNode.apply(this,arguments)}function X(){X.b2DynamicTreePair.apply(this,arguments)}
function da(){da.b2Manifold.apply(this,arguments);this.constructor===da&&this.b2Manifold.apply(this,arguments)}function j(){j.b2ManifoldPoint.apply(this,arguments);this.constructor===j&&this.b2ManifoldPoint.apply(this,arguments)}function y(){y.b2OBB.apply(this,arguments)}function x(){x.b2Pair.apply(this,arguments)}function J(){J.b2PairManager.apply(this,arguments);this.constructor===J&&this.b2PairManager.apply(this,arguments)}function M(){M.b2Point.apply(this,arguments)}function U(){U.b2Proxy.apply(this,
arguments)}function K(){K.b2RayCastInput.apply(this,arguments);this.constructor===K&&this.b2RayCastInput.apply(this,arguments)}function ba(){ba.b2RayCastOutput.apply(this,arguments)}function V(){V.b2Segment.apply(this,arguments)}function Z(){Z.b2SeparationFunction.apply(this,arguments)}function ga(){ga.b2Simplex.apply(this,arguments);this.constructor===ga&&this.b2Simplex.apply(this,arguments)}function fa(){fa.b2SimplexCache.apply(this,arguments)}function c(){c.b2SimplexVertex.apply(this,arguments)}
function g(){g.b2TimeOfImpact.apply(this,arguments)}function k(){k.b2TOIInput.apply(this,arguments)}function h(){h.b2WorldManifold.apply(this,arguments);this.constructor===h&&this.b2WorldManifold.apply(this,arguments)}function o(){o.ClipVertex.apply(this,arguments)}function r(){r.Features.apply(this,arguments)}function l(){l.b2CircleShape.apply(this,arguments);this.constructor===l&&this.b2CircleShape.apply(this,arguments)}function a(){a.b2EdgeChainDef.apply(this,arguments);this.constructor===a&&this.b2EdgeChainDef.apply(this,
arguments)}function b(){b.b2EdgeShape.apply(this,arguments);this.constructor===b&&this.b2EdgeShape.apply(this,arguments)}function f(){f.b2MassData.apply(this,arguments)}function m(){m.b2PolygonShape.apply(this,arguments);this.constructor===m&&this.b2PolygonShape.apply(this,arguments)}function p(){p.b2Shape.apply(this,arguments);this.constructor===p&&this.b2Shape.apply(this,arguments)}function D(){D.b2Color.apply(this,arguments);this.constructor===D&&this.b2Color.apply(this,arguments)}function B(){B.b2Settings.apply(this,
arguments)}function O(){O.b2Mat22.apply(this,arguments);this.constructor===O&&this.b2Mat22.apply(this,arguments)}function W(){W.b2Mat33.apply(this,arguments);this.constructor===W&&this.b2Mat33.apply(this,arguments)}function ca(){ca.b2Math.apply(this,arguments)}function d(){d.b2Sweep.apply(this,arguments)}function n(){n.b2Transform.apply(this,arguments);this.constructor===n&&this.b2Transform.apply(this,arguments)}function e(){e.b2Vec2.apply(this,arguments);this.constructor===e&&this.b2Vec2.apply(this,
arguments)}function q(){q.b2Vec3.apply(this,arguments);this.constructor===q&&this.b2Vec3.apply(this,arguments)}function t(){t.b2Body.apply(this,arguments);this.constructor===t&&this.b2Body.apply(this,arguments)}function v(){v.b2BodyDef.apply(this,arguments);this.constructor===v&&this.b2BodyDef.apply(this,arguments)}function z(){z.b2ContactFilter.apply(this,arguments)}function u(){u.b2ContactImpulse.apply(this,arguments)}function w(){w.b2ContactListener.apply(this,arguments)}function E(){E.b2ContactManager.apply(this,
arguments);this.constructor===E&&this.b2ContactManager.apply(this,arguments)}function P(){P.b2DebugDraw.apply(this,arguments);this.constructor===P&&this.b2DebugDraw.apply(this,arguments)}function Y(){Y.b2DestructionListener.apply(this,arguments)}function S(){S.b2FilterData.apply(this,arguments)}function ea(){ea.b2Fixture.apply(this,arguments);this.constructor===ea&&this.b2Fixture.apply(this,arguments)}function ha(){ha.b2FixtureDef.apply(this,arguments);this.constructor===ha&&this.b2FixtureDef.apply(this,
arguments)}function ia(){ia.b2Island.apply(this,arguments);this.constructor===ia&&this.b2Island.apply(this,arguments)}function ja(){ja.b2TimeStep.apply(this,arguments)}function ka(){ka.b2World.apply(this,arguments);this.constructor===ka&&this.b2World.apply(this,arguments)}function la(){la.b2CircleContact.apply(this,arguments)}function ma(){ma.b2Contact.apply(this,arguments);this.constructor===ma&&this.b2Contact.apply(this,arguments)}function na(){na.b2ContactConstraint.apply(this,arguments);this.constructor===
na&&this.b2ContactConstraint.apply(this,arguments)}function Ma(){Ma.b2ContactConstraintPoint.apply(this,arguments)}function Na(){Na.b2ContactEdge.apply(this,arguments)}function oa(){oa.b2ContactFactory.apply(this,arguments);this.constructor===oa&&this.b2ContactFactory.apply(this,arguments)}function Oa(){Oa.b2ContactRegister.apply(this,arguments)}function Pa(){Pa.b2ContactResult.apply(this,arguments)}function pa(){pa.b2ContactSolver.apply(this,arguments);this.constructor===pa&&this.b2ContactSolver.apply(this,
arguments)}function Qa(){Qa.b2EdgeAndCircleContact.apply(this,arguments)}function qa(){qa.b2NullContact.apply(this,arguments);this.constructor===qa&&this.b2NullContact.apply(this,arguments)}function Ra(){Ra.b2PolyAndCircleContact.apply(this,arguments)}function Sa(){Sa.b2PolyAndEdgeContact.apply(this,arguments)}function Ta(){Ta.b2PolygonContact.apply(this,arguments)}function ra(){ra.b2PositionSolverManifold.apply(this,arguments);this.constructor===ra&&this.b2PositionSolverManifold.apply(this,arguments)}
function Ua(){Ua.b2BuoyancyController.apply(this,arguments)}function Va(){Va.b2ConstantAccelController.apply(this,arguments)}function Wa(){Wa.b2ConstantForceController.apply(this,arguments)}function Xa(){Xa.b2Controller.apply(this,arguments)}function Ya(){Ya.b2ControllerEdge.apply(this,arguments)}function Za(){Za.b2GravityController.apply(this,arguments)}function $a(){$a.b2TensorDampingController.apply(this,arguments)}function sa(){sa.b2DistanceJoint.apply(this,arguments);this.constructor===sa&&this.b2DistanceJoint.apply(this,
arguments)}function ta(){ta.b2DistanceJointDef.apply(this,arguments);this.constructor===ta&&this.b2DistanceJointDef.apply(this,arguments)}function ua(){ua.b2FrictionJoint.apply(this,arguments);this.constructor===ua&&this.b2FrictionJoint.apply(this,arguments)}function va(){va.b2FrictionJointDef.apply(this,arguments);this.constructor===va&&this.b2FrictionJointDef.apply(this,arguments)}function wa(){wa.b2GearJoint.apply(this,arguments);this.constructor===wa&&this.b2GearJoint.apply(this,arguments)}function xa(){xa.b2GearJointDef.apply(this,
arguments);this.constructor===xa&&this.b2GearJointDef.apply(this,arguments)}function ab(){ab.b2Jacobian.apply(this,arguments)}function ya(){ya.b2Joint.apply(this,arguments);this.constructor===ya&&this.b2Joint.apply(this,arguments)}function za(){za.b2JointDef.apply(this,arguments);this.constructor===za&&this.b2JointDef.apply(this,arguments)}function bb(){bb.b2JointEdge.apply(this,arguments)}function Aa(){Aa.b2LineJoint.apply(this,arguments);this.constructor===Aa&&this.b2LineJoint.apply(this,arguments)}
function Ba(){Ba.b2LineJointDef.apply(this,arguments);this.constructor===Ba&&this.b2LineJointDef.apply(this,arguments)}function Ca(){Ca.b2MouseJoint.apply(this,arguments);this.constructor===Ca&&this.b2MouseJoint.apply(this,arguments)}function Da(){Da.b2MouseJointDef.apply(this,arguments);this.constructor===Da&&this.b2MouseJointDef.apply(this,arguments)}function Ea(){Ea.b2PrismaticJoint.apply(this,arguments);this.constructor===Ea&&this.b2PrismaticJoint.apply(this,arguments)}function Fa(){Fa.b2PrismaticJointDef.apply(this,
arguments);this.constructor===Fa&&this.b2PrismaticJointDef.apply(this,arguments)}function Ga(){Ga.b2PulleyJoint.apply(this,arguments);this.constructor===Ga&&this.b2PulleyJoint.apply(this,arguments)}function Ha(){Ha.b2PulleyJointDef.apply(this,arguments);this.constructor===Ha&&this.b2PulleyJointDef.apply(this,arguments)}function Ia(){Ia.b2RevoluteJoint.apply(this,arguments);this.constructor===Ia&&this.b2RevoluteJoint.apply(this,arguments)}function Ja(){Ja.b2RevoluteJointDef.apply(this,arguments);this.constructor===
Ja&&this.b2RevoluteJointDef.apply(this,arguments)}function Ka(){Ka.b2WeldJoint.apply(this,arguments);this.constructor===Ka&&this.b2WeldJoint.apply(this,arguments)}function La(){La.b2WeldJointDef.apply(this,arguments);this.constructor===La&&this.b2WeldJointDef.apply(this,arguments)}Box2D.Collision.IBroadPhase="Box2D.Collision.IBroadPhase";Box2D.Collision.b2AABB=L;Box2D.Collision.b2Bound=I;Box2D.Collision.b2BoundValues=H;Box2D.Collision.b2BroadPhase=F;Box2D.Collision.b2Collision=G;Box2D.Collision.b2ContactID=
A;Box2D.Collision.b2ContactPoint=N;Box2D.Collision.b2Distance=s;Box2D.Collision.b2DistanceInput=C;Box2D.Collision.b2DistanceOutput=R;Box2D.Collision.b2DistanceProxy=aa;Box2D.Collision.b2DynamicTree=$;Box2D.Collision.b2DynamicTreeBroadPhase=T;Box2D.Collision.b2DynamicTreeNode=Q;Box2D.Collision.b2DynamicTreePair=X;Box2D.Collision.b2Manifold=da;Box2D.Collision.b2ManifoldPoint=j;Box2D.Collision.b2OBB=y;Box2D.Collision.b2Pair=x;Box2D.Collision.b2PairManager=J;Box2D.Collision.b2Point=M;Box2D.Collision.b2Proxy=
U;Box2D.Collision.b2RayCastInput=K;Box2D.Collision.b2RayCastOutput=ba;Box2D.Collision.b2Segment=V;Box2D.Collision.b2SeparationFunction=Z;Box2D.Collision.b2Simplex=ga;Box2D.Collision.b2SimplexCache=fa;Box2D.Collision.b2SimplexVertex=c;Box2D.Collision.b2TimeOfImpact=g;Box2D.Collision.b2TOIInput=k;Box2D.Collision.b2WorldManifold=h;Box2D.Collision.ClipVertex=o;Box2D.Collision.Features=r;Box2D.Collision.Shapes.b2CircleShape=l;Box2D.Collision.Shapes.b2EdgeChainDef=a;Box2D.Collision.Shapes.b2EdgeShape=b;
Box2D.Collision.Shapes.b2MassData=f;Box2D.Collision.Shapes.b2PolygonShape=m;Box2D.Collision.Shapes.b2Shape=p;Box2D.Common.b2internal="Box2D.Common.b2internal";Box2D.Common.b2Color=D;Box2D.Common.b2Settings=B;Box2D.Common.Math.b2Mat22=O;Box2D.Common.Math.b2Mat33=W;Box2D.Common.Math.b2Math=ca;Box2D.Common.Math.b2Sweep=d;Box2D.Common.Math.b2Transform=n;Box2D.Common.Math.b2Vec2=e;Box2D.Common.Math.b2Vec3=q;Box2D.Dynamics.b2Body=t;Box2D.Dynamics.b2BodyDef=v;Box2D.Dynamics.b2ContactFilter=z;Box2D.Dynamics.b2ContactImpulse=
u;Box2D.Dynamics.b2ContactListener=w;Box2D.Dynamics.b2ContactManager=E;Box2D.Dynamics.b2DebugDraw=P;Box2D.Dynamics.b2DestructionListener=Y;Box2D.Dynamics.b2FilterData=S;Box2D.Dynamics.b2Fixture=ea;Box2D.Dynamics.b2FixtureDef=ha;Box2D.Dynamics.b2Island=ia;Box2D.Dynamics.b2TimeStep=ja;Box2D.Dynamics.b2World=ka;Box2D.Dynamics.Contacts.b2CircleContact=la;Box2D.Dynamics.Contacts.b2Contact=ma;Box2D.Dynamics.Contacts.b2ContactConstraint=na;Box2D.Dynamics.Contacts.b2ContactConstraintPoint=Ma;Box2D.Dynamics.Contacts.b2ContactEdge=
Na;Box2D.Dynamics.Contacts.b2ContactFactory=oa;Box2D.Dynamics.Contacts.b2ContactRegister=Oa;Box2D.Dynamics.Contacts.b2ContactResult=Pa;Box2D.Dynamics.Contacts.b2ContactSolver=pa;Box2D.Dynamics.Contacts.b2EdgeAndCircleContact=Qa;Box2D.Dynamics.Contacts.b2NullContact=qa;Box2D.Dynamics.Contacts.b2PolyAndCircleContact=Ra;Box2D.Dynamics.Contacts.b2PolyAndEdgeContact=Sa;Box2D.Dynamics.Contacts.b2PolygonContact=Ta;Box2D.Dynamics.Contacts.b2PositionSolverManifold=ra;Box2D.Dynamics.Controllers.b2BuoyancyController=
Ua;Box2D.Dynamics.Controllers.b2ConstantAccelController=Va;Box2D.Dynamics.Controllers.b2ConstantForceController=Wa;Box2D.Dynamics.Controllers.b2Controller=Xa;Box2D.Dynamics.Controllers.b2ControllerEdge=Ya;Box2D.Dynamics.Controllers.b2GravityController=Za;Box2D.Dynamics.Controllers.b2TensorDampingController=$a;Box2D.Dynamics.Joints.b2DistanceJoint=sa;Box2D.Dynamics.Joints.b2DistanceJointDef=ta;Box2D.Dynamics.Joints.b2FrictionJoint=ua;Box2D.Dynamics.Joints.b2FrictionJointDef=va;Box2D.Dynamics.Joints.b2GearJoint=
wa;Box2D.Dynamics.Joints.b2GearJointDef=xa;Box2D.Dynamics.Joints.b2Jacobian=ab;Box2D.Dynamics.Joints.b2Joint=ya;Box2D.Dynamics.Joints.b2JointDef=za;Box2D.Dynamics.Joints.b2JointEdge=bb;Box2D.Dynamics.Joints.b2LineJoint=Aa;Box2D.Dynamics.Joints.b2LineJointDef=Ba;Box2D.Dynamics.Joints.b2MouseJoint=Ca;Box2D.Dynamics.Joints.b2MouseJointDef=Da;Box2D.Dynamics.Joints.b2PrismaticJoint=Ea;Box2D.Dynamics.Joints.b2PrismaticJointDef=Fa;Box2D.Dynamics.Joints.b2PulleyJoint=Ga;Box2D.Dynamics.Joints.b2PulleyJointDef=
Ha;Box2D.Dynamics.Joints.b2RevoluteJoint=Ia;Box2D.Dynamics.Joints.b2RevoluteJointDef=Ja;Box2D.Dynamics.Joints.b2WeldJoint=Ka;Box2D.Dynamics.Joints.b2WeldJointDef=La})();_A2J_postDefs=[];
(function(){var L=flash.utils.Dictionary,I=Box2D.Collision.Shapes.b2CircleShape,H=Box2D.Collision.Shapes.b2PolygonShape,F=Box2D.Collision.Shapes.b2Shape,G=Box2D.Common.b2Settings,A=Box2D.Common.Math.b2Mat22,N=Box2D.Common.Math.b2Math,s=Box2D.Common.Math.b2Sweep,C=Box2D.Common.Math.b2Transform,R=Box2D.Common.Math.b2Vec2,aa=Box2D.Collision.b2AABB,$=Box2D.Collision.b2Bound,T=Box2D.Collision.b2BoundValues,Q=Box2D.Collision.b2BroadPhase,X=Box2D.Collision.b2Collision,da=Box2D.Collision.b2ContactID,j=Box2D.Collision.b2ContactPoint,
y=Box2D.Collision.b2Distance,x=Box2D.Collision.b2DistanceInput,J=Box2D.Collision.b2DistanceOutput,M=Box2D.Collision.b2DistanceProxy,U=Box2D.Collision.b2DynamicTree,K=Box2D.Collision.b2DynamicTreeBroadPhase,ba=Box2D.Collision.b2DynamicTreeNode,V=Box2D.Collision.b2DynamicTreePair,Z=Box2D.Collision.b2Manifold,ga=Box2D.Collision.b2ManifoldPoint,fa=Box2D.Collision.b2OBB,c=Box2D.Collision.b2Pair,g=Box2D.Collision.b2PairManager,k=Box2D.Collision.b2Point,h=Box2D.Collision.b2Proxy,o=Box2D.Collision.b2RayCastInput,
r=Box2D.Collision.b2RayCastOutput,l=Box2D.Collision.b2Segment,a=Box2D.Collision.b2SeparationFunction,b=Box2D.Collision.b2Simplex,f=Box2D.Collision.b2SimplexCache,m=Box2D.Collision.b2SimplexVertex,p=Box2D.Collision.b2TimeOfImpact,D=Box2D.Collision.b2TOIInput,B=Box2D.Collision.b2WorldManifold,O=Box2D.Collision.ClipVertex,W=Box2D.Collision.Features,ca=Box2D.Collision.IBroadPhase;R=Box2D.Common.Math.b2Vec2;aa=Box2D.Collision.b2AABB;$=Box2D.Collision.b2Bound;T=Box2D.Collision.b2BoundValues;Q=Box2D.Collision.b2BroadPhase;
X=Box2D.Collision.b2Collision;da=Box2D.Collision.b2ContactID;j=Box2D.Collision.b2ContactPoint;y=Box2D.Collision.b2Distance;x=Box2D.Collision.b2DistanceInput;J=Box2D.Collision.b2DistanceOutput;M=Box2D.Collision.b2DistanceProxy;U=Box2D.Collision.b2DynamicTree;K=Box2D.Collision.b2DynamicTreeBroadPhase;ba=Box2D.Collision.b2DynamicTreeNode;V=Box2D.Collision.b2DynamicTreePair;Z=Box2D.Collision.b2Manifold;ga=Box2D.Collision.b2ManifoldPoint;fa=Box2D.Collision.b2OBB;c=Box2D.Collision.b2Pair;g=Box2D.Collision.b2PairManager;
k=Box2D.Collision.b2Point;h=Box2D.Collision.b2Proxy;o=Box2D.Collision.b2RayCastInput;r=Box2D.Collision.b2RayCastOutput;l=Box2D.Collision.b2Segment;a=Box2D.Collision.b2SeparationFunction;b=Box2D.Collision.b2Simplex;f=Box2D.Collision.b2SimplexCache;m=Box2D.Collision.b2SimplexVertex;p=Box2D.Collision.b2TimeOfImpact;D=Box2D.Collision.b2TOIInput;B=Box2D.Collision.b2WorldManifold;O=Box2D.Collision.ClipVertex;W=Box2D.Collision.Features;ca=ca=Box2D.Collision.IBroadPhase;aa.b2AABB=function(){this.lowerBound=
new R;this.upperBound=new R};aa.prototype.IsValid=function(){var d=this.upperBound.y-this.lowerBound.y;return d=(d=this.upperBound.x-this.lowerBound.x>=0&&d>=0)&&this.lowerBound.IsValid()&&this.upperBound.IsValid()};aa.prototype.GetCenter=function(){return new R((this.lowerBound.x+this.upperBound.x)/2,(this.lowerBound.y+this.upperBound.y)/2)};aa.prototype.GetExtents=function(){return new R((this.upperBound.x-this.lowerBound.x)/2,(this.upperBound.y-this.lowerBound.y)/2)};aa.prototype.Contains=function(d){var n=
true;return n=(n=(n=(n=n&&this.lowerBound.x<=d.lowerBound.x)&&this.lowerBound.y<=d.lowerBound.y)&&d.upperBound.x<=this.upperBound.x)&&d.upperBound.y<=this.upperBound.y};aa.prototype.RayCast=function(d,n){var e=-Number.MAX_VALUE,q=Number.MAX_VALUE,t=n.p1.x,v=n.p1.y,z=n.p2.x-n.p1.x,u=n.p2.y-n.p1.y,w=Math.abs(u),E=d.normal,P=0,Y=0,S=P=0;S=0;if(Math.abs(z)<Number.MIN_VALUE){if(t<this.lowerBound.x||this.upperBound.x<t)return false}else{P=1/z;Y=(this.lowerBound.x-t)*P;P=(this.upperBound.x-t)*P;S=-1;if(Y>
P){S=Y;Y=P;P=S;S=1}if(Y>e){E.x=S;E.y=0;e=Y}q=Math.min(q,P);if(e>q)return false}if(w<Number.MIN_VALUE){if(v<this.lowerBound.y||this.upperBound.y<v)return false}else{P=1/u;Y=(this.lowerBound.y-v)*P;P=(this.upperBound.y-v)*P;S=-1;if(Y>P){S=Y;Y=P;P=S;S=1}if(Y>e){E.y=S;E.x=0;e=Y}q=Math.min(q,P);if(e>q)return false}d.fraction=e;return true};aa.prototype.TestOverlap=function(d){var n=d.lowerBound.y-this.upperBound.y,e=this.lowerBound.y-d.upperBound.y;if(d.lowerBound.x-this.upperBound.x>0||n>0)return false;
if(this.lowerBound.x-d.upperBound.x>0||e>0)return false;return true};aa.prototype.Combine=function(d,n){var e=new aa;this.constructor===Box2D.Collision.b2AABB?this._a2j__Combine(d,n):e._a2j__Combine(d,n);return e};aa.Combine=aa.prototype.Combine;aa.prototype._a2j__Combine=function(d,n){this.lowerBound.x=Math.min(d.lowerBound.x,n.lowerBound.x);this.lowerBound.y=Math.min(d.lowerBound.y,n.lowerBound.y);this.upperBound.x=Math.max(d.upperBound.x,n.upperBound.x);this.upperBound.y=Math.max(d.upperBound.y,
n.upperBound.y)};$.b2Bound=function(){};$.prototype.IsLower=function(){return(this.value&1)==0};$.prototype.IsUpper=function(){return(this.value&1)==1};$.prototype.Swap=function(d){var n=this.value,e=this.proxy,q=this.stabbingCount;this.value=d.value;this.proxy=d.proxy;this.stabbingCount=d.stabbingCount;d.value=n;d.proxy=e;d.stabbingCount=q};T.b2BoundValues=function(){};T.prototype.b2BoundValues=function(){this.lowerValues=new Vector_a2j_Number;this.lowerValues[0]=0;this.lowerValues[1]=0;this.upperValues=
new Vector_a2j_Number;this.upperValues[0]=0;this.upperValues[1]=0};Q.b2BroadPhase=function(){this.m_pairManager=new g;this.m_proxyPool=[];this.m_querySortKeys=[];this.m_queryResults=[];this.m_quantizationFactor=new R};Q.prototype.b2BroadPhase=function(d){var n=0;this.m_pairManager.Initialize(this);this.m_worldAABB=d;this.m_proxyCount=0;this.m_bounds=new Vector;for(n=0;n<2;n++)this.m_bounds[n]=new Vector;n=d.upperBound.y-d.lowerBound.y;this.m_quantizationFactor.x=G.USHRT_MAX/(d.upperBound.x-d.lowerBound.x);
this.m_quantizationFactor.y=G.USHRT_MAX/n;this.m_timeStamp=1;this.m_queryResultCount=0};Q.prototype.InRange=function(d){var n=0,e=0,q=0,t=0;n=d.lowerBound.x;e=d.lowerBound.y;n-=this.m_worldAABB.upperBound.x;e-=this.m_worldAABB.upperBound.y;q=this.m_worldAABB.lowerBound.x;t=this.m_worldAABB.lowerBound.y;q-=d.upperBound.x;t-=d.upperBound.y;n=N.Max(n,q);e=N.Max(e,t);return N.Max(n,e)<0};Q.prototype.CreateProxy=function(d,n){var e=0,q,t=0;q=0;if(!this.m_freeProxy){this.m_freeProxy=this.m_proxyPool[this.m_proxyCount]=
new h;this.m_freeProxy.next=null;this.m_freeProxy.timeStamp=0;this.m_freeProxy.overlapCount=Q.b2_invalid;this.m_freeProxy.userData=null;for(t=0;t<2;t++){q=this.m_proxyCount*2;this.m_bounds[t][q++]=new $;this.m_bounds[t][q]=new $}}q=this.m_freeProxy;this.m_freeProxy=q.next;q.overlapCount=0;q.userData=n;t=2*this.m_proxyCount;var v=new Vector_a2j_Number,z=new Vector_a2j_Number;this.ComputeBounds(v,z,d);for(var u=0;u<2;++u){var w=this.m_bounds[u],E=0,P=0,Y=new Vector_a2j_Number;Y.push(E);e=new Vector_a2j_Number;
e.push(P);this.QueryAxis(Y,e,v[u],z[u],w,t,u);E=Y[0];P=e[0];w.splice(P,0,w[w.length-1]);w.length--;w.splice(E,0,w[w.length-1]);w.length--;++P;Y=w[E];e=w[P];Y.value=v[u];Y.proxy=q;e.value=z[u];e.proxy=q;var S=w[parseInt(E-1)];Y.stabbingCount=E==0?0:S.stabbingCount;S=w[parseInt(P-1)];e.stabbingCount=S.stabbingCount;for(e=E;e<P;++e){S=w[e];S.stabbingCount++}for(e=E;e<t+2;++e){Y=w[e];E=Y.proxy;if(Y.IsLower())E.lowerBounds[u]=e;else E.upperBounds[u]=e}}++this.m_proxyCount;for(t=0;t<this.m_queryResultCount;++t)this.m_pairManager.AddBufferedPair(q,
this.m_queryResults[t]);this.m_queryResultCount=0;this.IncrementTimeStamp();return q};Q.prototype.DestroyProxy=function(d){d=d instanceof h?d:null;for(var n,e,q=parseInt(2*this.m_proxyCount),t=0;t<2;++t){var v=this.m_bounds[t],z=d.lowerBounds[t],u=d.upperBounds[t];n=v[z];var w=n.value;e=v[u];var E=e.value;v.splice(u,1);v.splice(z,1);v.push(n);v.push(e);e=parseInt(q-2);for(var P=z;P<e;++P){n=v[P];var Y=n.proxy;if(n.IsLower())Y.lowerBounds[t]=P;else Y.upperBounds[t]=P}e=u-1;for(z=parseInt(z);z<e;++z){n=
v[z];n.stabbingCount--}n=new Vector_a2j_Number;this.QueryAxis(n,n,w,E,v,q-2,t)}for(q=0;q<this.m_queryResultCount;++q)this.m_pairManager.RemoveBufferedPair(d,this.m_queryResults[q]);this.m_queryResultCount=0;this.IncrementTimeStamp();d.userData=null;d.overlapCount=Q.b2_invalid;d.lowerBounds[0]=Q.b2_invalid;d.lowerBounds[1]=Q.b2_invalid;d.upperBounds[0]=Q.b2_invalid;d.upperBounds[1]=Q.b2_invalid;d.next=this.m_freeProxy;this.m_freeProxy=d;--this.m_proxyCount};Q.prototype.MoveProxy=function(d,n){var e=
d instanceof h?d:null,q,t=0,v=0,z=0,u,w;if(e!=null)if(n.IsValid()!=false){var E=2*this.m_proxyCount,P=new T;this.ComputeBounds(P.lowerValues,P.upperValues,n);var Y=new T;for(v=0;v<2;++v){u=this.m_bounds[v][e.lowerBounds[v]];Y.lowerValues[v]=u.value;u=this.m_bounds[v][e.upperBounds[v]];Y.upperValues[v]=u.value}for(v=0;v<2;++v){var S=this.m_bounds[v],ea=e.lowerBounds[v],ha=e.upperBounds[v],ia=P.lowerValues[v],ja=P.upperValues[v];u=S[ea];var ka=parseInt(ia-u.value);u.value=ia;u=S[ha];var la=parseInt(ja-
u.value);u.value=ja;if(ka<0)for(z=ea;z>0&&ia<(S[parseInt(z-1)]instanceof $?S[parseInt(z-1)]:null).value;){u=S[z];w=S[parseInt(z-1)];q=w.proxy;w.stabbingCount++;if(w.IsUpper()==true){this.TestOverlapBound(P,q)&&this.m_pairManager.AddBufferedPair(e,q);q=q.upperBounds;t=q[v];t++;q[v]=t;u.stabbingCount++}else{q=q.lowerBounds;t=q[v];t++;q[v]=t;u.stabbingCount--}q=e.lowerBounds;t=q[v];t--;q[v]=t;u.Swap(w);--z}if(la>0)for(z=ha;z<E-1&&(S[parseInt(z+1)]instanceof $?S[parseInt(z+1)]:null).value<=ja;){u=S[z];
w=S[parseInt(z+1)];q=w.proxy;w.stabbingCount++;if(w.IsLower()==true){this.TestOverlapBound(P,q)&&this.m_pairManager.AddBufferedPair(e,q);q=q.lowerBounds;t=q[v];t--;q[v]=t;u.stabbingCount++}else{q=q.upperBounds;t=q[v];t--;q[v]=t;u.stabbingCount--}q=e.upperBounds;t=q[v];t++;q[v]=t;u.Swap(w);z++}if(ka>0)for(z=ea;z<E-1&&(S[parseInt(z+1)]instanceof $?S[parseInt(z+1)]:null).value<=ia;){u=S[z];w=S[parseInt(z+1)];q=w.proxy;w.stabbingCount--;if(w.IsUpper()){this.TestOverlapBound(Y,q)&&this.m_pairManager.RemoveBufferedPair(e,
q);q=q.upperBounds;t=q[v];t--;q[v]=t;u.stabbingCount--}else{q=q.lowerBounds;t=q[v];t--;q[v]=t;u.stabbingCount++}q=e.lowerBounds;t=q[v];t++;q[v]=t;u.Swap(w);z++}if(la<0)for(z=ha;z>0&&ja<(S[parseInt(z-1)]instanceof $?S[parseInt(z-1)]:null).value;){u=S[z];w=S[parseInt(z-1)];q=w.proxy;w.stabbingCount--;if(w.IsLower()==true){this.TestOverlapBound(Y,q)&&this.m_pairManager.RemoveBufferedPair(e,q);q=q.lowerBounds;t=q[v];t++;q[v]=t;u.stabbingCount--}else{q=q.upperBounds;t=q[v];t++;q[v]=t;u.stabbingCount++}q=
e.upperBounds;t=q[v];t--;q[v]=t;u.Swap(w);z--}}}};Q.prototype.UpdatePairs=function(d){this.m_pairManager.Commit(d)};Q.prototype.TestOverlap=function(d,n){var e=d instanceof h?d:null,q=n instanceof h?n:null;if(e.lowerBounds[0]>q.upperBounds[0])return false;if(q.lowerBounds[0]>e.upperBounds[0])return false;if(e.lowerBounds[1]>q.upperBounds[1])return false;if(q.lowerBounds[1]>e.upperBounds[1])return false;return true};Q.prototype.GetUserData=function(d){return(d instanceof h?d:null).userData};Q.prototype.GetFatAABB=
function(d){var n=new aa;d=d instanceof h?d:null;n.lowerBound.x=this.m_worldAABB.lowerBound.x+this.m_bounds[0][d.lowerBounds[0]].value/this.m_quantizationFactor.x;n.lowerBound.y=this.m_worldAABB.lowerBound.y+this.m_bounds[1][d.lowerBounds[1]].value/this.m_quantizationFactor.y;n.upperBound.x=this.m_worldAABB.lowerBound.x+this.m_bounds[0][d.upperBounds[0]].value/this.m_quantizationFactor.x;n.upperBound.y=this.m_worldAABB.lowerBound.y+this.m_bounds[1][d.upperBounds[1]].value/this.m_quantizationFactor.y;
return n};Q.prototype.GetProxyCount=function(){return this.m_proxyCount};Q.prototype.Query=function(d,n){var e=new Vector_a2j_Number,q=new Vector_a2j_Number;this.ComputeBounds(e,q,n);var t=new Vector_a2j_Number;t.push(0);var v=new Vector_a2j_Number;v.push(0);this.QueryAxis(t,v,e[0],q[0],this.m_bounds[0],2*this.m_proxyCount,0);this.QueryAxis(t,v,e[1],q[1],this.m_bounds[1],2*this.m_proxyCount,1);for(e=0;e<this.m_queryResultCount;++e)if(!d(this.m_queryResults[e]))break;this.m_queryResultCount=0;this.IncrementTimeStamp()};
Q.prototype.Validate=function(){for(var d=0;d<2;++d)for(var n=this.m_bounds[d],e=2*this.m_proxyCount,q=0,t=0;t<e;++t)if(n[t].IsLower()==true)q++;else q--};Q.prototype.Rebalance=function(){};Q.prototype.RayCast=function(d,n){var e=new o;e.p1.SetV(n.p1);e.p2.SetV(n.p2);e.maxFraction=n.maxFraction;var q=(n.p2.x-n.p1.x)*this.m_quantizationFactor.x,t=(n.p2.y-n.p1.y)*this.m_quantizationFactor.y,v=parseInt(q<(-Number.MIN_VALUE?-1:q>Number.MIN_VALUE?1:0)),z=parseInt(t<(-Number.MIN_VALUE?-1:t>Number.MIN_VALUE?
1:0)),u=this.m_quantizationFactor.x*(n.p1.x-this.m_worldAABB.lowerBound.x),w=this.m_quantizationFactor.y*(n.p1.y-this.m_worldAABB.lowerBound.y),E=[],P=[];E[0]=a2j.parseUInt(u)&G.USHRT_MAX-1;E[1]=a2j.parseUInt(w)&G.USHRT_MAX-1;P[0]=E[0]+1;P[1]=E[1]+1;var Y=0,S=0;S=new Vector_a2j_Number;S.push(0);var ea=new Vector_a2j_Number;ea.push(0);this.QueryAxis(S,ea,E[0],P[0],this.m_bounds[0],2*this.m_proxyCount,0);Y=v>=0?ea[0]-1:S[0];this.QueryAxis(S,ea,E[1],P[1],this.m_bounds[1],2*this.m_proxyCount,1);S=z>=
0?ea[0]-1:S[0];for(E=0;E<this.m_queryResultCount;E++)e.maxFraction=d(e,this.m_queryResults[E]);for(;;){ea=P=0;Y+=v>=0?1:-1;if(Y<0||Y>=this.m_proxyCount*2)break;if(v!=0)P=(this.m_bounds[0][Y].value-u)/q;S+=z>=0?1:-1;if(S<0||S>=this.m_proxyCount*2)break;if(z!=0)ea=(this.m_bounds[1][S].value-w)/t;for(;;)if(z==0||v!=0&&P<ea){if(P>e.maxFraction)break;if(v>0?this.m_bounds[0][Y].IsLower():this.m_bounds[0][Y].IsUpper()){E=this.m_bounds[0][Y].proxy;if(z>=0){if(E.lowerBounds[1]<=S-1&&E.upperBounds[1]>=S)e.maxFraction=
d(e,E)}else if(E.lowerBounds[1]<=S&&E.upperBounds[1]>=S+1)e.maxFraction=d(e,E)}if(e.maxFraction==0)break;if(v>0){Y++;if(Y==this.m_proxyCount*2)break}else{Y--;if(Y<0)break}P=(this.m_bounds[0][Y].value-u)/q}else{if(ea>e.maxFraction)break;if(z>0?this.m_bounds[1][S].IsLower():this.m_bounds[1][S].IsUpper()){E=this.m_bounds[1][S].proxy;if(v>=0){if(E.lowerBounds[0]<=Y-1&&E.upperBounds[0]>=Y)e.maxFraction=d(e,E)}else if(E.lowerBounds[0]<=Y&&E.upperBounds[0]>=Y+1)e.maxFraction=d(e,E)}if(e.maxFraction==0)break;
if(z>0){S++;if(S==this.m_proxyCount*2)break}else{S--;if(S<0)break}ea=(this.m_bounds[1][S].value-w)/t}break}this.m_queryResultCount=0;this.IncrementTimeStamp()};Q.prototype.ComputeBounds=function(d,n,e){var q=e.lowerBound.x,t=e.lowerBound.y;q=N.Min(q,this.m_worldAABB.upperBound.x);t=N.Min(t,this.m_worldAABB.upperBound.y);q=N.Max(q,this.m_worldAABB.lowerBound.x);t=N.Max(t,this.m_worldAABB.lowerBound.y);var v=e.upperBound.x;e=e.upperBound.y;v=N.Min(v,this.m_worldAABB.upperBound.x);e=N.Min(e,this.m_worldAABB.upperBound.y);
v=N.Max(v,this.m_worldAABB.lowerBound.x);e=N.Max(e,this.m_worldAABB.lowerBound.y);d[0]=a2j.parseUInt(this.m_quantizationFactor.x*(q-this.m_worldAABB.lowerBound.x))&G.USHRT_MAX-1;n[0]=a2j.parseUInt(this.m_quantizationFactor.x*(v-this.m_worldAABB.lowerBound.x))&65535|1;d[1]=a2j.parseUInt(this.m_quantizationFactor.y*(t-this.m_worldAABB.lowerBound.y))&G.USHRT_MAX-1;n[1]=a2j.parseUInt(this.m_quantizationFactor.y*(e-this.m_worldAABB.lowerBound.y))&65535|1};Q.prototype.TestOverlapValidate=function(d,n){for(var e=
0;e<2;++e){var q=this.m_bounds[e],t=q[d.lowerBounds[e]],v=q[n.upperBounds[e]];if(t.value>v.value)return false;t=q[d.upperBounds[e]];v=q[n.lowerBounds[e]];if(t.value<v.value)return false}return true};Q.prototype.TestOverlapBound=function(d,n){for(var e=0;e<2;++e){var q=this.m_bounds[e],t=q[n.upperBounds[e]];if(d.lowerValues[e]>t.value)return false;t=q[n.lowerBounds[e]];if(d.upperValues[e]<t.value)return false}return true};Q.prototype.QueryAxis=function(d,n,e,q,t,v,z){if(e===undefined)e=0;if(q===undefined)q=
0;if(v===undefined)v=0;if(z===undefined)z=0;e=this.BinarySearch(t,v,e);q=this.BinarySearch(t,v,q);for(var u=e;u<q;++u){v=t[u];v.IsLower()&&this.IncrementOverlapCount(v.proxy)}if(e>0){u=parseInt(e-1);v=t[u];for(var w=parseInt(v.stabbingCount);w;){v=t[u];if(v.IsLower())if(e<=v.proxy.upperBounds[z]){this.IncrementOverlapCount(v.proxy);--w}--u}}d[0]=e;n[0]=q};Q.prototype.IncrementOverlapCount=function(d){if(d.timeStamp<this.m_timeStamp){d.timeStamp=this.m_timeStamp;d.overlapCount=1}else{d.overlapCount=
2;this.m_queryResults[this.m_queryResultCount]=d;++this.m_queryResultCount}};Q.prototype.IncrementTimeStamp=function(){if(this.m_timeStamp==G.USHRT_MAX){for(var d=0;d<this.m_proxyPool.length;++d)(this.m_proxyPool[d]instanceof h?this.m_proxyPool[d]:null).timeStamp=0;this.m_timeStamp=1}else++this.m_timeStamp};Q.prototype.BinarySearch=function(d,n,e){if(n===undefined)n=0;if(e===undefined)e=0;var q=0;for(n=parseInt(n-1);q<=n;){var t=parseInt((q+n)/2),v=d[t];if(v.value>e)n=t-1;else if(v.value<e)q=t+1;
else return a2j.parseUInt(t)}return a2j.parseUInt(q)};Q.BinarySearch=Q.prototype.BinarySearch;_A2J_postDefs.push(function(){Box2D.Collision.b2BroadPhase.s_validate=false;Box2D.Collision.b2BroadPhase.prototype.s_validate=Box2D.Collision.b2BroadPhase.s_validate;Box2D.Collision.b2BroadPhase.b2_invalid=parseInt(G.USHRT_MAX);Box2D.Collision.b2BroadPhase.prototype.b2_invalid=Box2D.Collision.b2BroadPhase.b2_invalid;Box2D.Collision.b2BroadPhase.b2_nullEdge=parseInt(G.USHRT_MAX);Box2D.Collision.b2BroadPhase.prototype.b2_nullEdge=
Box2D.Collision.b2BroadPhase.b2_nullEdge});Q.__implements={};Q.__implements[ca]=true;X.b2Collision=function(){};X.prototype.ClipSegmentToLine=function(d,n,e,q){if(q===undefined)q=0;var t,v=0;t=n[0];var z=t.v;t=n[1];var u=t.v,w=e.x*z.x+e.y*z.y-q;t=e.x*u.x+e.y*u.y-q;w<=0&&d[v++].Set(n[0]);t<=0&&d[v++].Set(n[1]);if(w*t<0){e=w/(w-t);t=d[v];t=t.v;t.x=z.x+e*(u.x-z.x);t.y=z.y+e*(u.y-z.y);t=d[v];t.id=(w>0?n[0]:n[1]).id;++v}return v};X.ClipSegmentToLine=X.prototype.ClipSegmentToLine;X.prototype.EdgeSeparation=
function(d,n,e,q,t){if(e===undefined)e=0;parseInt(d.m_vertexCount);var v=d.m_vertices;d=d.m_normals;var z=parseInt(q.m_vertexCount),u=q.m_vertices,w,E;w=n.R;E=d[e];d=w.col1.x*E.x+w.col2.x*E.y;q=w.col1.y*E.x+w.col2.y*E.y;w=t.R;var P=w.col1.x*d+w.col1.y*q;w=w.col2.x*d+w.col2.y*q;for(var Y=0,S=Number.MAX_VALUE,ea=0;ea<z;++ea){E=u[ea];E=E.x*P+E.y*w;if(E<S){S=E;Y=ea}}E=v[e];w=n.R;e=n.position.x+(w.col1.x*E.x+w.col2.x*E.y);n=n.position.y+(w.col1.y*E.x+w.col2.y*E.y);E=u[Y];w=t.R;v=t.position.x+(w.col1.x*
E.x+w.col2.x*E.y);t=t.position.y+(w.col1.y*E.x+w.col2.y*E.y);v-=e;t-=n;return v*d+t*q};X.EdgeSeparation=X.prototype.EdgeSeparation;X.prototype.FindMaxSeparation=function(d,n,e,q,t){var v=parseInt(n.m_vertexCount),z=n.m_normals,u,w;w=t.R;u=q.m_centroid;var E=t.position.x+(w.col1.x*u.x+w.col2.x*u.y),P=t.position.y+(w.col1.y*u.x+w.col2.y*u.y);w=e.R;u=n.m_centroid;E-=e.position.x+(w.col1.x*u.x+w.col2.x*u.y);P-=e.position.y+(w.col1.y*u.x+w.col2.y*u.y);w=E*e.R.col1.x+P*e.R.col1.y;P=E*e.R.col2.x+P*e.R.col2.y;
E=0;for(var Y=-Number.MAX_VALUE,S=0;S<v;++S){u=z[S];u=u.x*w+u.y*P;if(u>Y){Y=u;E=S}}z=this.EdgeSeparation(n,e,E,q,t);u=parseInt(E-1>=0?E-1:v-1);w=this.EdgeSeparation(n,e,u,q,t);P=parseInt(E+1<v?E+1:0);Y=this.EdgeSeparation(n,e,P,q,t);var ea=S=0,ha=0;if(w>z&&w>Y){ha=-1;S=u;ea=w}else if(Y>z){ha=1;S=P;ea=Y}else{d[0]=E;return z}for(;;){E=ha==-1?S-1>=0?S-1:v-1:S+1<v?S+1:0;z=this.EdgeSeparation(n,e,E,q,t);if(z>ea){S=E;ea=z}else break}d[0]=S;return ea};X.FindMaxSeparation=X.prototype.FindMaxSeparation;X.prototype.FindIncidentEdge=
function(d,n,e,q,t,v){if(q===undefined)q=0;parseInt(n.m_vertexCount);var z=n.m_normals,u=parseInt(t.m_vertexCount);n=t.m_vertices;t=t.m_normals;var w;w=e.R;e=z[q];z=w.col1.x*e.x+w.col2.x*e.y;var E=w.col1.y*e.x+w.col2.y*e.y;w=v.R;e=w.col1.x*z+w.col1.y*E;E=w.col2.x*z+w.col2.y*E;z=e;w=0;for(var P=Number.MAX_VALUE,Y=0;Y<u;++Y){e=t[Y];e=z*e.x+E*e.y;if(e<P){P=e;w=Y}}t=parseInt(w);z=parseInt(t+1<u?t+1:0);u=d[0];e=n[t];w=v.R;u.v.x=v.position.x+(w.col1.x*e.x+w.col2.x*e.y);u.v.y=v.position.y+(w.col1.y*e.x+
w.col2.y*e.y);u.id.features.referenceEdge=q;u.id.features.incidentEdge=t;u.id.features.incidentVertex=0;u=d[1];e=n[z];w=v.R;u.v.x=v.position.x+(w.col1.x*e.x+w.col2.x*e.y);u.v.y=v.position.y+(w.col1.y*e.x+w.col2.y*e.y);u.id.features.referenceEdge=q;u.id.features.incidentEdge=z;u.id.features.incidentVertex=1};X.FindIncidentEdge=X.prototype.FindIncidentEdge;X.prototype.MakeClipPointVector=function(){var d=new Vector(2);d[0]=new O;d[1]=new O;return d};X.MakeClipPointVector=X.prototype.MakeClipPointVector;
X.prototype.CollidePolygons=function(d,n,e,q,t){var v;d.m_pointCount=0;var z=n.m_radius+q.m_radius;v=0;X.s_edgeAO[0]=v;var u=this.FindMaxSeparation(X.s_edgeAO,n,e,q,t);v=X.s_edgeAO[0];if(!(u>z)){var w=0;X.s_edgeBO[0]=w;var E=this.FindMaxSeparation(X.s_edgeBO,q,t,n,e);w=X.s_edgeBO[0];if(!(E>z)){var P=0,Y=0;if(E>0.98*u+0.0010){u=q;q=n;n=t;e=e;P=w;d.m_type=Z.e_faceB;Y=1}else{u=n;q=q;n=e;e=t;P=v;d.m_type=Z.e_faceA;Y=0}v=X.s_incidentEdge;this.FindIncidentEdge(v,u,n,P,q,e);w=parseInt(u.m_vertexCount);t=
u.m_vertices;u=t[P];var S;S=P+1<w?t[parseInt(P+1)]:t[0];P=X.s_localTangent;P.Set(S.x-u.x,S.y-u.y);P.Normalize();t=X.s_localNormal;t.x=P.y;t.y=-P.x;q=X.s_planePoint;q.Set(0.5*(u.x+S.x),0.5*(u.y+S.y));E=X.s_tangent;w=n.R;E.x=w.col1.x*P.x+w.col2.x*P.y;E.y=w.col1.y*P.x+w.col2.y*P.y;var ea=X.s_tangent2;ea.x=-E.x;ea.y=-E.y;P=X.s_normal;P.x=E.y;P.y=-E.x;var ha=X.s_v11,ia=X.s_v12;ha.x=n.position.x+(w.col1.x*u.x+w.col2.x*u.y);ha.y=n.position.y+(w.col1.y*u.x+w.col2.y*u.y);ia.x=n.position.x+(w.col1.x*S.x+w.col2.x*
S.y);ia.y=n.position.y+(w.col1.y*S.x+w.col2.y*S.y);n=P.x*ha.x+P.y*ha.y;w=E.x*ia.x+E.y*ia.y+z;S=X.s_clipPoints1;u=X.s_clipPoints2;ia=0;ia=this.ClipSegmentToLine(S,v,ea,-E.x*ha.x-E.y*ha.y+z);if(!(ia<2)){ia=this.ClipSegmentToLine(u,S,E,w);if(!(ia<2)){d.m_localPlaneNormal.SetV(t);d.m_localPoint.SetV(q);for(q=t=0;q<G.b2_maxManifoldPoints;++q){v=u[q];if(P.x*v.v.x+P.y*v.v.y-n<=z){E=d.m_points[t];w=e.R;ea=v.v.x-e.position.x;ha=v.v.y-e.position.y;E.m_localPoint.x=ea*w.col1.x+ha*w.col1.y;E.m_localPoint.y=ea*
w.col2.x+ha*w.col2.y;E.m_id.Set(v.id);E.m_id.features.flip=Y;++t}}d.m_pointCount=t}}}}};X.CollidePolygons=X.prototype.CollidePolygons;X.prototype.CollideCircles=function(d,n,e,q,t){d.m_pointCount=0;var v,z;v=e.R;z=n.m_p;var u=e.position.x+(v.col1.x*z.x+v.col2.x*z.y);e=e.position.y+(v.col1.y*z.x+v.col2.y*z.y);v=t.R;z=q.m_p;u=t.position.x+(v.col1.x*z.x+v.col2.x*z.y)-u;t=t.position.y+(v.col1.y*z.x+v.col2.y*z.y)-e;v=n.m_radius+q.m_radius;if(!(u*u+t*t>v*v)){d.m_type=Z.e_circles;d.m_localPoint.SetV(n.m_p);
d.m_localPlaneNormal.SetZero();d.m_pointCount=1;d.m_points[0].m_localPoint.SetV(q.m_p);d.m_points[0].m_id.key=0}};X.CollideCircles=X.prototype.CollideCircles;X.prototype.CollidePolygonAndCircle=function(d,n,e,q,t){var v=d.m_pointCount=0,z=0,u,w;w=t.R;u=q.m_p;var E=t.position.y+(w.col1.y*u.x+w.col2.y*u.y);v=t.position.x+(w.col1.x*u.x+w.col2.x*u.y)-e.position.x;z=E-e.position.y;w=e.R;e=v*w.col1.x+z*w.col1.y;w=v*w.col2.x+z*w.col2.y;var P=0;E=-Number.MAX_VALUE;t=n.m_radius+q.m_radius;var Y=parseInt(n.m_vertexCount),
S=n.m_vertices;n=n.m_normals;for(var ea=0;ea<Y;++ea){u=S[ea];v=e-u.x;z=w-u.y;u=n[ea];v=u.x*v+u.y*z;if(v>t)return;if(v>E){E=v;P=ea}}v=parseInt(P);z=parseInt(v+1<Y?v+1:0);u=S[v];S=S[z];if(E<Number.MIN_VALUE){d.m_pointCount=1;d.m_type=Z.e_faceA;d.m_localPlaneNormal.SetV(n[P]);d.m_localPoint.x=0.5*(u.x+S.x);d.m_localPoint.y=0.5*(u.y+S.y)}else{E=(e-S.x)*(u.x-S.x)+(w-S.y)*(u.y-S.y);if((e-u.x)*(S.x-u.x)+(w-u.y)*(S.y-u.y)<=0){if((e-u.x)*(e-u.x)+(w-u.y)*(w-u.y)>t*t)return;d.m_pointCount=1;d.m_type=Z.e_faceA;
d.m_localPlaneNormal.x=e-u.x;d.m_localPlaneNormal.y=w-u.y;d.m_localPlaneNormal.Normalize();d.m_localPoint.SetV(u)}else if(E<=0){if((e-S.x)*(e-S.x)+(w-S.y)*(w-S.y)>t*t)return;d.m_pointCount=1;d.m_type=Z.e_faceA;d.m_localPlaneNormal.x=e-S.x;d.m_localPlaneNormal.y=w-S.y;d.m_localPlaneNormal.Normalize();d.m_localPoint.SetV(S)}else{P=0.5*(u.x+S.x);u=0.5*(u.y+S.y);E=(e-P)*n[v].x+(w-u)*n[v].y;if(E>t)return;d.m_pointCount=1;d.m_type=Z.e_faceA;d.m_localPlaneNormal.x=n[v].x;d.m_localPlaneNormal.y=n[v].y;d.m_localPlaneNormal.Normalize();
d.m_localPoint.Set(P,u)}}d.m_points[0].m_localPoint.SetV(q.m_p);d.m_points[0].m_id.key=0};X.CollidePolygonAndCircle=X.prototype.CollidePolygonAndCircle;X.prototype.TestOverlap=function(d,n){var e=n.lowerBound,q=d.upperBound,t=e.x-q.x,v=e.y-q.y;e=d.lowerBound;q=n.upperBound;var z=e.y-q.y;if(t>0||v>0)return false;if(e.x-q.x>0||z>0)return false;return true};X.TestOverlap=X.prototype.TestOverlap;_A2J_postDefs.push(function(){Box2D.Collision.b2Collision.s_incidentEdge=X.MakeClipPointVector();Box2D.Collision.b2Collision.prototype.s_incidentEdge=
Box2D.Collision.b2Collision.s_incidentEdge;Box2D.Collision.b2Collision.s_clipPoints1=X.MakeClipPointVector();Box2D.Collision.b2Collision.prototype.s_clipPoints1=Box2D.Collision.b2Collision.s_clipPoints1;Box2D.Collision.b2Collision.s_clipPoints2=X.MakeClipPointVector();Box2D.Collision.b2Collision.prototype.s_clipPoints2=Box2D.Collision.b2Collision.s_clipPoints2;Box2D.Collision.b2Collision.s_edgeAO=new Vector_a2j_Number(1);Box2D.Collision.b2Collision.prototype.s_edgeAO=Box2D.Collision.b2Collision.s_edgeAO;
Box2D.Collision.b2Collision.s_edgeBO=new Vector_a2j_Number(1);Box2D.Collision.b2Collision.prototype.s_edgeBO=Box2D.Collision.b2Collision.s_edgeBO;Box2D.Collision.b2Collision.s_localTangent=new R;Box2D.Collision.b2Collision.prototype.s_localTangent=Box2D.Collision.b2Collision.s_localTangent;Box2D.Collision.b2Collision.s_localNormal=new R;Box2D.Collision.b2Collision.prototype.s_localNormal=Box2D.Collision.b2Collision.s_localNormal;Box2D.Collision.b2Collision.s_planePoint=new R;Box2D.Collision.b2Collision.prototype.s_planePoint=
Box2D.Collision.b2Collision.s_planePoint;Box2D.Collision.b2Collision.s_normal=new R;Box2D.Collision.b2Collision.prototype.s_normal=Box2D.Collision.b2Collision.s_normal;Box2D.Collision.b2Collision.s_tangent=new R;Box2D.Collision.b2Collision.prototype.s_tangent=Box2D.Collision.b2Collision.s_tangent;Box2D.Collision.b2Collision.s_tangent2=new R;Box2D.Collision.b2Collision.prototype.s_tangent2=Box2D.Collision.b2Collision.s_tangent2;Box2D.Collision.b2Collision.s_v11=new R;Box2D.Collision.b2Collision.prototype.s_v11=
Box2D.Collision.b2Collision.s_v11;Box2D.Collision.b2Collision.s_v12=new R;Box2D.Collision.b2Collision.prototype.s_v12=Box2D.Collision.b2Collision.s_v12;Box2D.Collision.b2Collision.b2CollidePolyTempVec=new R;Box2D.Collision.b2Collision.prototype.b2CollidePolyTempVec=Box2D.Collision.b2Collision.b2CollidePolyTempVec;Box2D.Collision.b2Collision.b2_nullFeature=255;Box2D.Collision.b2Collision.prototype.b2_nullFeature=Box2D.Collision.b2Collision.b2_nullFeature});da.b2ContactID=function(){this.features=new W};
da.prototype.b2ContactID=function(){this.features._m_id=this};da.prototype.Set=function(d){this.key=d._key};da.prototype.Copy=function(){var d=new da;d.key=this.key;return d};da.prototype.__defineGetter__("key",function(){return this._key});da.prototype.__defineSetter__("key",function(d){if(d===undefined)d=0;this._key=d;this.features._referenceEdge=this._key&255;this.features._incidentEdge=(this._key&65280)>>8&255;this.features._incidentVertex=(this._key&16711680)>>16&255;this.features._flip=(this._key&
4278190080)>>24&255});j.b2ContactPoint=function(){this.position=new R;this.velocity=new R;this.normal=new R;this.id=new da};y.b2Distance=function(){};y.prototype.Distance=function(d,n,e){++y.b2_gjkCalls;var q=e.proxyA,t=e.proxyB,v=e.transformA,z=e.transformB,u=y.s_simplex;u.ReadCache(n,q,v,t,z);var w=u.m_vertices,E=y.s_saveA,P=y.s_saveB,Y=0;u.GetClosestPoint().LengthSquared();for(var S=0,ea,ha=0;ha<20;){Y=u.m_count;for(S=0;S<Y;S++){E[S]=w[S].indexA;P[S]=w[S].indexB}switch(u.m_count){case 1:break;
case 2:u.Solve2();break;case 3:u.Solve3();break;default:G.b2Assert(false)}if(u.m_count==3)break;ea=u.GetClosestPoint();ea.LengthSquared();S=u.GetSearchDirection();if(S.LengthSquared()<Number.MIN_VALUE*Number.MIN_VALUE)break;ea=w[u.m_count];ea.indexA=q.GetSupport(N.MulTMV(v.R,S.GetNegative()));ea.wA=N.MulX(v,q.GetVertex(ea.indexA));ea.indexB=t.GetSupport(N.MulTMV(z.R,S));ea.wB=N.MulX(z,t.GetVertex(ea.indexB));ea.w=N.SubtractVV(ea.wB,ea.wA);++ha;++y.b2_gjkIters;var ia=false;for(S=0;S<Y;S++)if(ea.indexA==
E[S]&&ea.indexB==P[S]){ia=true;break}if(ia)break;++u.m_count}y.b2_gjkMaxIters=N.Max(y.b2_gjkMaxIters,ha);u.GetWitnessPoints(d.pointA,d.pointB);d.distance=N.SubtractVV(d.pointA,d.pointB).Length();d.iterations=ha;u.WriteCache(n);if(e.useRadii){n=q.m_radius;t=t.m_radius;if(d.distance>n+t&&d.distance>Number.MIN_VALUE){d.distance-=n+t;e=N.SubtractVV(d.pointB,d.pointA);e.Normalize();d.pointA.x+=n*e.x;d.pointA.y+=n*e.y;d.pointB.x-=t*e.x;d.pointB.y-=t*e.y}else{ea=new R;ea.x=0.5*(d.pointA.x+d.pointB.x);ea.y=
0.5*(d.pointA.y+d.pointB.y);d.pointA.x=d.pointB.x=ea.x;d.pointA.y=d.pointB.y=ea.y;d.distance=0}}};y.Distance=y.prototype.Distance;_A2J_postDefs.push(function(){Box2D.Collision.b2Distance.s_simplex=new b;Box2D.Collision.b2Distance.prototype.s_simplex=Box2D.Collision.b2Distance.s_simplex;Box2D.Collision.b2Distance.s_saveA=new Vector_a2j_Number(3);Box2D.Collision.b2Distance.prototype.s_saveA=Box2D.Collision.b2Distance.s_saveA;Box2D.Collision.b2Distance.s_saveB=new Vector_a2j_Number(3);Box2D.Collision.b2Distance.prototype.s_saveB=
Box2D.Collision.b2Distance.s_saveB});x.b2DistanceInput=function(){};J.b2DistanceOutput=function(){this.pointA=new R;this.pointB=new R};M.b2DistanceProxy=function(){};M.prototype.Set=function(d){switch(d.GetType()){case F.e_circleShape:d=d instanceof I?d:null;this.m_vertices=new Vector(1,true);this.m_vertices[0]=d.m_p;this.m_count=1;this.m_radius=d.m_radius;break;case F.e_polygonShape:d=d instanceof H?d:null;this.m_vertices=d.m_vertices;this.m_count=d.m_vertexCount;this.m_radius=d.m_radius;break;default:G.b2Assert(false)}};
M.prototype.GetSupport=function(d){for(var n=0,e=this.m_vertices[0].x*d.x+this.m_vertices[0].y*d.y,q=1;q<this.m_count;++q){var t=this.m_vertices[q].x*d.x+this.m_vertices[q].y*d.y;if(t>e){n=q;e=t}}return n};M.prototype.GetSupportVertex=function(d){for(var n=0,e=this.m_vertices[0].x*d.x+this.m_vertices[0].y*d.y,q=1;q<this.m_count;++q){var t=this.m_vertices[q].x*d.x+this.m_vertices[q].y*d.y;if(t>e){n=q;e=t}}return this.m_vertices[n]};M.prototype.GetVertexCount=function(){return this.m_count};M.prototype.GetVertex=
function(d){if(d===undefined)d=0;G.b2Assert(0<=d&&d<this.m_count);return this.m_vertices[d]};U.b2DynamicTree=function(){};U.prototype.b2DynamicTree=function(){this.m_freeList=this.m_root=null;this.m_insertionCount=this.m_path=0};U.prototype.CreateProxy=function(d,n){var e=this.AllocateNode(),q=G.b2_aabbExtension,t=G.b2_aabbExtension;e.aabb.lowerBound.x=d.lowerBound.x-q;e.aabb.lowerBound.y=d.lowerBound.y-t;e.aabb.upperBound.x=d.upperBound.x+q;e.aabb.upperBound.y=d.upperBound.y+t;e.userData=n;this.InsertLeaf(e);
return e};U.prototype.DestroyProxy=function(d){this.RemoveLeaf(d);this.FreeNode(d)};U.prototype.MoveProxy=function(d,n,e){G.b2Assert(d.IsLeaf());if(d.aabb.Contains(n))return false;this.RemoveLeaf(d);var q=G.b2_aabbExtension+G.b2_aabbMultiplier*(e.x>0?e.x:-e.x);e=G.b2_aabbExtension+G.b2_aabbMultiplier*(e.y>0?e.y:-e.y);d.aabb.lowerBound.x=n.lowerBound.x-q;d.aabb.lowerBound.y=n.lowerBound.y-e;d.aabb.upperBound.x=n.upperBound.x+q;d.aabb.upperBound.y=n.upperBound.y+e;this.InsertLeaf(d);return true};U.prototype.Rebalance=
function(d){if(d===undefined)d=0;if(this.m_root!=null)for(var n=0;n<d;n++){for(var e=this.m_root,q=0;e.IsLeaf()==false;){e=this.m_path>>q&1?e.child2:e.child1;q=q+1&31}++this.m_path;this.RemoveLeaf(e);this.InsertLeaf(e)}};U.prototype.GetFatAABB=function(d){return d.aabb};U.prototype.GetUserData=function(d){return d.userData};U.prototype.Query=function(d,n){if(this.m_root!=null){var e=new Vector,q=0;for(e[q++]=this.m_root;q>0;){var t=e[--q];if(t.aabb.TestOverlap(n))if(t.IsLeaf()){if(!d(t))break}else{e[q++]=
t.child1;e[q++]=t.child2}}}};U.prototype.RayCast=function(d,n){if(this.m_root!=null){var e=n.p1,q=n.p2,t=N.SubtractVV(e,q);t.Normalize();t=N.CrossFV(1,t);var v=N.AbsV(t),z=n.maxFraction,u=new aa,w=0,E=0;w=e.x+z*(q.x-e.x);E=e.y+z*(q.y-e.y);u.lowerBound.x=Math.min(e.x,w);u.lowerBound.y=Math.min(e.y,E);u.upperBound.x=Math.max(e.x,w);u.upperBound.y=Math.max(e.y,E);var P=new Vector,Y=0;for(P[Y++]=this.m_root;Y>0;){z=P[--Y];if(z.aabb.TestOverlap(u)!=false){w=z.aabb.GetCenter();E=z.aabb.GetExtents();if(!(Math.abs(t.x*
(e.x-w.x)+t.y*(e.y-w.y))-v.x*E.x-v.y*E.y>0))if(z.IsLeaf()){w=new o;w.p1=n.p1;w.p2=n.p2;w.maxFraction=n.maxFraction;z=d(w,z);if(z==0)break;if(z>0){w=e.x+z*(q.x-e.x);E=e.y+z*(q.y-e.y);u.lowerBound.x=Math.min(e.x,w);u.lowerBound.y=Math.min(e.y,E);u.upperBound.x=Math.max(e.x,w);u.upperBound.y=Math.max(e.y,E)}}else{P[Y++]=z.child1;P[Y++]=z.child2}}}}};U.prototype.AllocateNode=function(){if(this.m_freeList){var d=this.m_freeList;this.m_freeList=d.parent;d.parent=null;d.child1=null;d.child2=null;return d}return new ba};
U.prototype.FreeNode=function(d){d.parent=this.m_freeList;this.m_freeList=d};U.prototype.InsertLeaf=function(d){++this.m_insertionCount;if(this.m_root==null){this.m_root=d;this.m_root.parent=null}else{var n=d.aabb.GetCenter(),e=this.m_root;if(e.IsLeaf()==false){do{var q=e.child1;e=e.child2;e=Math.abs((q.aabb.lowerBound.x+q.aabb.upperBound.x)/2-n.x)+Math.abs((q.aabb.lowerBound.y+q.aabb.upperBound.y)/2-n.y)<Math.abs((e.aabb.lowerBound.x+e.aabb.upperBound.x)/2-n.x)+Math.abs((e.aabb.lowerBound.y+e.aabb.upperBound.y)/
2-n.y)?q:e}while(e.IsLeaf()==false)}n=e.parent;q=this.AllocateNode();q.parent=n;q.userData=null;q.aabb.Combine(d.aabb,e.aabb);if(n){if(e.parent.child1==e)n.child1=q;else n.child2=q;q.child1=e;q.child2=d;e.parent=q;d.parent=q;do{if(n.aabb.Contains(q.aabb))break;n.aabb.Combine(n.child1.aabb,n.child2.aabb);q=n;n=n.parent}while(n)}else{q.child1=e;q.child2=d;e.parent=q;this.m_root=d.parent=q}}};U.prototype.RemoveLeaf=function(d){if(d==this.m_root)this.m_root=null;else{var n=d.parent,e=n.parent;d=n.child1==
d?n.child2:n.child1;if(e){if(e.child1==n)e.child1=d;else e.child2=d;d.parent=e;for(this.FreeNode(n);e;){n=e.aabb;e.aabb=aa.Combine(e.child1.aabb,e.child2.aabb);if(n.Contains(e.aabb))break;e=e.parent}}else{this.m_root=d;d.parent=null;this.FreeNode(n)}}};K.b2DynamicTreeBroadPhase=function(){this.m_tree=new U;this.m_moveBuffer=new Vector;this.m_pairBuffer=new Vector;this.m_pairCount=0};K.prototype.CreateProxy=function(d,n){var e=this.m_tree.CreateProxy(d,n);++this.m_proxyCount;this.BufferMove(e);return e};
K.prototype.DestroyProxy=function(d){this.UnBufferMove(d);--this.m_proxyCount;this.m_tree.DestroyProxy(d)};K.prototype.MoveProxy=function(d,n,e){this.m_tree.MoveProxy(d,n,e)&&this.BufferMove(d)};K.prototype.TestOverlap=function(d,n){var e=this.m_tree.GetFatAABB(d),q=this.m_tree.GetFatAABB(n);return e.TestOverlap(q)};K.prototype.GetUserData=function(d){return this.m_tree.GetUserData(d)};K.prototype.GetFatAABB=function(d){return this.m_tree.GetFatAABB(d)};K.prototype.GetProxyCount=function(){return this.m_proxyCount};
K.prototype.UpdatePairs=function(d){var n=this;n.m_pairCount=0;var e,q;for(q in n.m_moveBuffer){e=n.m_moveBuffer[q];var t=n.m_tree.GetFatAABB(e);n.m_tree.Query(function(u){if(u==e)return true;if(n.m_pairCount==n.m_pairBuffer.length)n.m_pairBuffer[n.m_pairCount]=new V;var w=n.m_pairBuffer[n.m_pairCount];w.proxyA=u<e?u:e;w.proxyB=u>=e?u:e;++n.m_pairCount;return true},t)}for(q=n.m_moveBuffer.length=0;q<n.m_pairCount;){t=n.m_pairBuffer[q];var v=n.m_tree.GetUserData(t.proxyA),z=n.m_tree.GetUserData(t.proxyB);
d(v,z);for(++q;q<n.m_pairCount;){v=n.m_pairBuffer[q];if(v.proxyA!=t.proxyA||v.proxyB!=t.proxyB)break;++q}}};K.prototype.Query=function(d,n){this.m_tree.Query(d,n)};K.prototype.RayCast=function(d,n){this.m_tree.RayCast(d,n)};K.prototype.Validate=function(){};K.prototype.Rebalance=function(d){if(d===undefined)d=0;this.m_tree.Rebalance(d)};K.prototype.BufferMove=function(d){this.m_moveBuffer[this.m_moveBuffer.length]=d};K.prototype.UnBufferMove=function(d){this.m_moveBuffer.splice(parseInt(this.m_moveBuffer.indexOf(d)),
1)};K.prototype.ComparePairs=function(){return 0};K.__implements={};K.__implements[ca]=true;ba.b2DynamicTreeNode=function(){this.aabb=new aa};ba.prototype.IsLeaf=function(){return this.child1==null};V.b2DynamicTreePair=function(){};Z.b2Manifold=function(){this.m_pointCount=0};Z.prototype.b2Manifold=function(){this.m_points=new Vector(G.b2_maxManifoldPoints);for(var d=0;d<G.b2_maxManifoldPoints;d++)this.m_points[d]=new ga;this.m_localPlaneNormal=new R;this.m_localPoint=new R};Z.prototype.Reset=function(){for(var d=
0;d<G.b2_maxManifoldPoints;d++)(this.m_points[d]instanceof ga?this.m_points[d]:null).Reset();this.m_localPlaneNormal.SetZero();this.m_localPoint.SetZero();this.m_pointCount=this.m_type=0};Z.prototype.Set=function(d){this.m_pointCount=d.m_pointCount;for(var n=0;n<G.b2_maxManifoldPoints;n++)(this.m_points[n]instanceof ga?this.m_points[n]:null).Set(d.m_points[n]);this.m_localPlaneNormal.SetV(d.m_localPlaneNormal);this.m_localPoint.SetV(d.m_localPoint);this.m_type=d.m_type};Z.prototype.Copy=function(){var d=
new Z;d.Set(this);return d};_A2J_postDefs.push(function(){Box2D.Collision.b2Manifold.e_circles=1;Box2D.Collision.b2Manifold.prototype.e_circles=Box2D.Collision.b2Manifold.e_circles;Box2D.Collision.b2Manifold.e_faceA=2;Box2D.Collision.b2Manifold.prototype.e_faceA=Box2D.Collision.b2Manifold.e_faceA;Box2D.Collision.b2Manifold.e_faceB=4;Box2D.Collision.b2Manifold.prototype.e_faceB=Box2D.Collision.b2Manifold.e_faceB});ga.b2ManifoldPoint=function(){this.m_localPoint=new R;this.m_id=new da};ga.prototype.b2ManifoldPoint=
function(){this.Reset()};ga.prototype.Reset=function(){this.m_localPoint.SetZero();this.m_tangentImpulse=this.m_normalImpulse=0;this.m_id.key=0};ga.prototype.Set=function(d){this.m_localPoint.SetV(d.m_localPoint);this.m_normalImpulse=d.m_normalImpulse;this.m_tangentImpulse=d.m_tangentImpulse;this.m_id.Set(d.m_id)};fa.b2OBB=function(){this.R=new A;this.center=new R;this.extents=new R};c.b2Pair=function(){this.userData=null};c.prototype.SetBuffered=function(){this.status|=c.e_pairBuffered};c.prototype.ClearBuffered=
function(){this.status&=~c.e_pairBuffered};c.prototype.IsBuffered=function(){return(this.status&c.e_pairBuffered)==c.e_pairBuffered};c.prototype.SetRemoved=function(){this.status|=c.e_pairRemoved};c.prototype.ClearRemoved=function(){this.status&=~c.e_pairRemoved};c.prototype.IsRemoved=function(){return(this.status&c.e_pairRemoved)==c.e_pairRemoved};c.prototype.SetFinal=function(){this.status|=c.e_pairFinal};c.prototype.IsFinal=function(){return(this.status&c.e_pairFinal)==c.e_pairFinal};_A2J_postDefs.push(function(){Box2D.Collision.b2Pair.b2_nullProxy=
parseInt(G.USHRT_MAX);Box2D.Collision.b2Pair.prototype.b2_nullProxy=Box2D.Collision.b2Pair.b2_nullProxy;Box2D.Collision.b2Pair.e_pairBuffered=1;Box2D.Collision.b2Pair.prototype.e_pairBuffered=Box2D.Collision.b2Pair.e_pairBuffered;Box2D.Collision.b2Pair.e_pairRemoved=2;Box2D.Collision.b2Pair.prototype.e_pairRemoved=Box2D.Collision.b2Pair.e_pairRemoved;Box2D.Collision.b2Pair.e_pairFinal=4;Box2D.Collision.b2Pair.prototype.e_pairFinal=Box2D.Collision.b2Pair.e_pairFinal});g.b2PairManager=function(){};
g.prototype.b2PairManager=function(){this.m_pairs=[];this.m_pairBuffer=[];this.m_pairBufferCount=this.m_pairCount=0;this.m_freePair=null};g.prototype.Initialize=function(d){this.m_broadPhase=d};g.prototype.AddBufferedPair=function(d,n){var e=this.AddPair(d,n);if(e.IsBuffered()==false){e.SetBuffered();this.m_pairBuffer[this.m_pairBufferCount]=e;++this.m_pairBufferCount}e.ClearRemoved();Q.s_validate&&this.ValidateBuffer()};g.prototype.RemoveBufferedPair=function(d,n){var e=this.Find(d,n);if(e!=null){if(e.IsBuffered()==
false){e.SetBuffered();this.m_pairBuffer[this.m_pairBufferCount]=e;++this.m_pairBufferCount}e.SetRemoved();Q.s_validate&&this.ValidateBuffer()}};g.prototype.Commit=function(d){var n=0;for(n=0;n<this.m_pairBufferCount;++n){var e=this.m_pairBuffer[n];e.ClearBuffered();var q=e.proxy1,t=e.proxy2;e.IsRemoved()||e.IsFinal()==false&&d(q.userData,t.userData)}this.m_pairBufferCount=0;Q.s_validate&&this.ValidateTable()};g.prototype.AddPair=function(d,n){var e=d.pairs[n];if(e!=null)return e;if(this.m_freePair==
null){this.m_freePair=new c;this.m_pairs.push(this.m_freePair)}e=this.m_freePair;this.m_freePair=e.next;e.proxy1=d;e.proxy2=n;e.status=0;e.userData=null;e.next=null;d.pairs[n]=e;n.pairs[d]=e;++this.m_pairCount;return e};g.prototype.RemovePair=function(d,n){var e=d.pairs[n];if(e==null)return null;var q=e.userData;delete d.pairs[n];delete n.pairs[d];e.next=this.m_freePair;e.proxy1=null;e.proxy2=null;e.userData=null;e.status=0;this.m_freePair=e;--this.m_pairCount;return q};g.prototype.Find=function(d,
n){return d.pairs[n]};g.prototype.ValidateBuffer=function(){};g.prototype.ValidateTable=function(){};k.b2Point=function(){this.p=new R};k.prototype.Support=function(){return this.p};k.prototype.GetFirstVertex=function(){return this.p};h.b2Proxy=function(){this.lowerBounds=new Vector_a2j_Number(2);this.upperBounds=new Vector_a2j_Number(2);this.pairs=new L;this.userData=null};h.prototype.IsValid=function(){return this.overlapCount!=Q.b2_invalid};o.b2RayCastInput=function(){this.p1=new R;this.p2=new R};
o.prototype.b2RayCastInput=function(d,n,e){if(d===undefined)d=null;if(n===undefined)n=null;if(e===undefined)e=1;d&&this.p1.SetV(d);n&&this.p2.SetV(n);this.maxFraction=e};r.b2RayCastOutput=function(){this.normal=new R};l.b2Segment=function(){this.p1=new R;this.p2=new R};l.prototype.TestSegment=function(d,n,e,q){if(q===undefined)q=0;var t=e.p1,v=e.p2.x-t.x,z=e.p2.y-t.y;e=this.p2.y-this.p1.y;var u=-(this.p2.x-this.p1.x),w=100*Number.MIN_VALUE,E=-(v*e+z*u);if(E>w){var P=t.x-this.p1.x,Y=t.y-this.p1.y;
t=P*e+Y*u;if(0<=t&&t<=q*E){q=-v*Y+z*P;if(-w*E<=q&&q<=E*(1+w)){t/=E;q=Math.sqrt(e*e+u*u);e/=q;u/=q;d[0]=t;n.Set(e,u);return true}}}return false};l.prototype.Extend=function(d){this.ExtendForward(d);this.ExtendBackward(d)};l.prototype.ExtendForward=function(d){var n=this.p2.x-this.p1.x,e=this.p2.y-this.p1.y;d=Math.min(n>0?(d.upperBound.x-this.p1.x)/n:n<0?(d.lowerBound.x-this.p1.x)/n:Number.POSITIVE_INFINITY,e>0?(d.upperBound.y-this.p1.y)/e:e<0?(d.lowerBound.y-this.p1.y)/e:Number.POSITIVE_INFINITY);
this.p2.x=this.p1.x+n*d;this.p2.y=this.p1.y+e*d};l.prototype.ExtendBackward=function(d){var n=-this.p2.x+this.p1.x,e=-this.p2.y+this.p1.y;d=Math.min(n>0?(d.upperBound.x-this.p2.x)/n:n<0?(d.lowerBound.x-this.p2.x)/n:Number.POSITIVE_INFINITY,e>0?(d.upperBound.y-this.p2.y)/e:e<0?(d.lowerBound.y-this.p2.y)/e:Number.POSITIVE_INFINITY);this.p1.x=this.p2.x+n*d;this.p1.y=this.p2.y+e*d};a.b2SeparationFunction=function(){this.m_localPoint=new R;this.m_axis=new R};a.prototype.Initialize=function(d,n,e,q,t){this.m_proxyA=
n;this.m_proxyB=q;var v=parseInt(d.count);G.b2Assert(0<v&&v<3);var z,u,w,E,P=E=w=q=n=0,Y=0;P=0;if(v==1){this.m_type=a.e_points;z=this.m_proxyA.GetVertex(d.indexA[0]);u=this.m_proxyB.GetVertex(d.indexB[0]);v=z;d=e.R;n=e.position.x+(d.col1.x*v.x+d.col2.x*v.y);q=e.position.y+(d.col1.y*v.x+d.col2.y*v.y);v=u;d=t.R;w=t.position.x+(d.col1.x*v.x+d.col2.x*v.y);E=t.position.y+(d.col1.y*v.x+d.col2.y*v.y);this.m_axis.x=w-n;this.m_axis.y=E-q;this.m_axis.Normalize()}else{if(d.indexB[0]==d.indexB[1]){this.m_type=
a.e_faceA;n=this.m_proxyA.GetVertex(d.indexA[0]);q=this.m_proxyA.GetVertex(d.indexA[1]);u=this.m_proxyB.GetVertex(d.indexB[0]);this.m_localPoint.x=0.5*(n.x+q.x);this.m_localPoint.y=0.5*(n.y+q.y);this.m_axis=N.CrossVF(N.SubtractVV(q,n),1);this.m_axis.Normalize();v=this.m_axis;d=e.R;P=d.col1.x*v.x+d.col2.x*v.y;Y=d.col1.y*v.x+d.col2.y*v.y;v=this.m_localPoint;d=e.R;n=e.position.x+(d.col1.x*v.x+d.col2.x*v.y);q=e.position.y+(d.col1.y*v.x+d.col2.y*v.y);v=u;d=t.R;w=t.position.x+(d.col1.x*v.x+d.col2.x*v.y);
E=t.position.y+(d.col1.y*v.x+d.col2.y*v.y);P=(w-n)*P+(E-q)*Y}else if(d.indexA[0]==d.indexA[0]){this.m_type=a.e_faceB;w=this.m_proxyB.GetVertex(d.indexB[0]);E=this.m_proxyB.GetVertex(d.indexB[1]);z=this.m_proxyA.GetVertex(d.indexA[0]);this.m_localPoint.x=0.5*(w.x+E.x);this.m_localPoint.y=0.5*(w.y+E.y);this.m_axis=N.CrossVF(N.SubtractVV(E,w),1);this.m_axis.Normalize();v=this.m_axis;d=t.R;P=d.col1.x*v.x+d.col2.x*v.y;Y=d.col1.y*v.x+d.col2.y*v.y;v=this.m_localPoint;d=t.R;w=t.position.x+(d.col1.x*v.x+d.col2.x*
v.y);E=t.position.y+(d.col1.y*v.x+d.col2.y*v.y);v=z;d=e.R;n=e.position.x+(d.col1.x*v.x+d.col2.x*v.y);q=e.position.y+(d.col1.y*v.x+d.col2.y*v.y);P=(n-w)*P+(q-E)*Y}else{n=this.m_proxyA.GetVertex(d.indexA[0]);q=this.m_proxyA.GetVertex(d.indexA[1]);w=this.m_proxyB.GetVertex(d.indexB[0]);E=this.m_proxyB.GetVertex(d.indexB[1]);N.MulX(e,z);z=N.MulMV(e.R,N.SubtractVV(q,n));N.MulX(t,u);P=N.MulMV(t.R,N.SubtractVV(E,w));t=z.x*z.x+z.y*z.y;u=P.x*P.x+P.y*P.y;d=N.SubtractVV(P,z);e=z.x*d.x+z.y*d.y;d=P.x*d.x+P.y*
d.y;z=z.x*P.x+z.y*P.y;Y=t*u-z*z;P=0;if(Y!=0)P=N.Clamp((z*d-e*u)/Y,0,1);if((z*P+d)/u<0)P=N.Clamp((z-e)/t,0,1);z=new R;z.x=n.x+P*(q.x-n.x);z.y=n.y+P*(q.y-n.y);u=new R;u.x=w.x+P*(E.x-w.x);u.y=w.y+P*(E.y-w.y);if(P==0||P==1){this.m_type=a.e_faceB;this.m_axis=N.CrossVF(N.SubtractVV(E,w),1);this.m_axis.Normalize();this.m_localPoint=u}else{this.m_type=a.e_faceA;this.m_axis=N.CrossVF(N.SubtractVV(q,n),1);this.m_localPoint=z}}P<0&&this.m_axis.NegativeSelf()}};a.prototype.Evaluate=function(d,n){var e,q,t=0;
switch(this.m_type){case a.e_points:e=N.MulTMV(d.R,this.m_axis);q=N.MulTMV(n.R,this.m_axis.GetNegative());e=this.m_proxyA.GetSupportVertex(e);q=this.m_proxyB.GetSupportVertex(q);e=N.MulX(d,e);q=N.MulX(n,q);return t=(q.x-e.x)*this.m_axis.x+(q.y-e.y)*this.m_axis.y;case a.e_faceA:t=N.MulMV(d.R,this.m_axis);e=N.MulX(d,this.m_localPoint);q=N.MulTMV(n.R,t.GetNegative());q=this.m_proxyB.GetSupportVertex(q);q=N.MulX(n,q);return t=(q.x-e.x)*t.x+(q.y-e.y)*t.y;case a.e_faceB:t=N.MulMV(n.R,this.m_axis);q=N.MulX(n,
this.m_localPoint);e=N.MulTMV(d.R,t.GetNegative());e=this.m_proxyA.GetSupportVertex(e);e=N.MulX(d,e);return t=(e.x-q.x)*t.x+(e.y-q.y)*t.y;default:G.b2Assert(false);return 0}};_A2J_postDefs.push(function(){Box2D.Collision.b2SeparationFunction.e_points=1;Box2D.Collision.b2SeparationFunction.prototype.e_points=Box2D.Collision.b2SeparationFunction.e_points;Box2D.Collision.b2SeparationFunction.e_faceA=2;Box2D.Collision.b2SeparationFunction.prototype.e_faceA=Box2D.Collision.b2SeparationFunction.e_faceA;
Box2D.Collision.b2SeparationFunction.e_faceB=4;Box2D.Collision.b2SeparationFunction.prototype.e_faceB=Box2D.Collision.b2SeparationFunction.e_faceB});b.b2Simplex=function(){this.m_v1=new m;this.m_v2=new m;this.m_v3=new m;this.m_vertices=new Vector(3)};b.prototype.b2Simplex=function(){this.m_vertices[0]=this.m_v1;this.m_vertices[1]=this.m_v2;this.m_vertices[2]=this.m_v3};b.prototype.ReadCache=function(d,n,e,q,t){G.b2Assert(0<=d.count&&d.count<=3);var v,z;this.m_count=d.count;for(var u=this.m_vertices,
w=0;w<this.m_count;w++){var E=u[w];E.indexA=d.indexA[w];E.indexB=d.indexB[w];v=n.GetVertex(E.indexA);z=q.GetVertex(E.indexB);E.wA=N.MulX(e,v);E.wB=N.MulX(t,z);E.w=N.SubtractVV(E.wB,E.wA);E.a=0}if(this.m_count>1){d=d.metric;v=this.GetMetric();if(v<0.5*d||2*d<v||v<Number.MIN_VALUE)this.m_count=0}if(this.m_count==0){E=u[0];E.indexA=0;E.indexB=0;v=n.GetVertex(0);z=q.GetVertex(0);E.wA=N.MulX(e,v);E.wB=N.MulX(t,z);E.w=N.SubtractVV(E.wB,E.wA);this.m_count=1}};b.prototype.WriteCache=function(d){d.metric=
this.GetMetric();d.count=a2j.parseUInt(this.m_count);for(var n=this.m_vertices,e=0;e<this.m_count;e++){d.indexA[e]=a2j.parseUInt(n[e].indexA);d.indexB[e]=a2j.parseUInt(n[e].indexB)}};b.prototype.GetSearchDirection=function(){switch(this.m_count){case 1:return this.m_v1.w.GetNegative();case 2:var d=N.SubtractVV(this.m_v2.w,this.m_v1.w);return N.CrossVV(d,this.m_v1.w.GetNegative())>0?N.CrossFV(1,d):N.CrossVF(d,1);default:G.b2Assert(false);return new R}};b.prototype.GetClosestPoint=function(){switch(this.m_count){case 0:G.b2Assert(false);
return new R;case 1:return this.m_v1.w;case 2:return new R(this.m_v1.a*this.m_v1.w.x+this.m_v2.a*this.m_v2.w.x,this.m_v1.a*this.m_v1.w.y+this.m_v2.a*this.m_v2.w.y);default:G.b2Assert(false);return new R}};b.prototype.GetWitnessPoints=function(d,n){switch(this.m_count){case 0:G.b2Assert(false);break;case 1:d.SetV(this.m_v1.wA);n.SetV(this.m_v1.wB);break;case 2:d.x=this.m_v1.a*this.m_v1.wA.x+this.m_v2.a*this.m_v2.wA.x;d.y=this.m_v1.a*this.m_v1.wA.y+this.m_v2.a*this.m_v2.wA.y;n.x=this.m_v1.a*this.m_v1.wB.x+
this.m_v2.a*this.m_v2.wB.x;n.y=this.m_v1.a*this.m_v1.wB.y+this.m_v2.a*this.m_v2.wB.y;break;case 3:n.x=d.x=this.m_v1.a*this.m_v1.wA.x+this.m_v2.a*this.m_v2.wA.x+this.m_v3.a*this.m_v3.wA.x;n.y=d.y=this.m_v1.a*this.m_v1.wA.y+this.m_v2.a*this.m_v2.wA.y+this.m_v3.a*this.m_v3.wA.y;break;default:G.b2Assert(false)}};b.prototype.GetMetric=function(){switch(this.m_count){case 0:G.b2Assert(false);return 0;case 1:return 0;case 2:return N.SubtractVV(this.m_v1.w,this.m_v2.w).Length();case 3:return N.CrossVV(N.SubtractVV(this.m_v2.w,
this.m_v1.w),N.SubtractVV(this.m_v3.w,this.m_v1.w));default:G.b2Assert(false);return 0}};b.prototype.Solve2=function(){var d=this.m_v1.w,n=this.m_v2.w,e=N.SubtractVV(n,d);d=-(d.x*e.x+d.y*e.y);if(d<=0)this.m_count=this.m_v1.a=1;else{n=n.x*e.x+n.y*e.y;if(n<=0){this.m_count=this.m_v2.a=1;this.m_v1.Set(this.m_v2)}else{e=1/(n+d);this.m_v1.a=n*e;this.m_v2.a=d*e;this.m_count=2}}};b.prototype.Solve3=function(){var d=this.m_v1.w,n=this.m_v2.w,e=this.m_v3.w,q=N.SubtractVV(n,d),t=N.Dot(d,q),v=N.Dot(n,q);t=-t;
var z=N.SubtractVV(e,d),u=N.Dot(d,z),w=N.Dot(e,z);u=-u;var E=N.SubtractVV(e,n),P=N.Dot(n,E);E=N.Dot(e,E);P=-P;z=N.CrossVV(q,z);q=z*N.CrossVV(n,e);e=z*N.CrossVV(e,d);d=z*N.CrossVV(d,n);if(t<=0&&u<=0)this.m_count=this.m_v1.a=1;else if(v>0&&t>0&&d<=0){w=1/(v+t);this.m_v1.a=v*w;this.m_v2.a=t*w;this.m_count=2}else if(w>0&&u>0&&e<=0){v=1/(w+u);this.m_v1.a=w*v;this.m_v3.a=u*v;this.m_count=2;this.m_v2.Set(this.m_v3)}else if(v<=0&&P<=0){this.m_count=this.m_v2.a=1;this.m_v1.Set(this.m_v2)}else if(w<=0&&E<=
0){this.m_count=this.m_v3.a=1;this.m_v1.Set(this.m_v3)}else if(E>0&&P>0&&q<=0){v=1/(E+P);this.m_v2.a=E*v;this.m_v3.a=P*v;this.m_count=2;this.m_v1.Set(this.m_v3)}else{v=1/(q+e+d);this.m_v1.a=q*v;this.m_v2.a=e*v;this.m_v3.a=d*v;this.m_count=3}};f.b2SimplexCache=function(){this.indexA=new Vector_a2j_Number(3);this.indexB=new Vector_a2j_Number(3)};m.b2SimplexVertex=function(){};m.prototype.Set=function(d){this.wA.SetV(d.wA);this.wB.SetV(d.wB);this.w.SetV(d.w);this.a=d.a;this.indexA=d.indexA;this.indexB=
d.indexB};p.b2TimeOfImpact=function(){};p.prototype.TimeOfImpact=function(d){++p.b2_toiCalls;var n=d.proxyA,e=d.proxyB,q=d.sweepA,t=d.sweepB;G.b2Assert(q.t0==t.t0);G.b2Assert(1-q.t0>Number.MIN_VALUE);var v=n.m_radius+e.m_radius;d=d.tolerance;var z=0,u=0,w=0;p.s_cache.count=0;for(p.s_distanceInput.useRadii=false;;){q.GetTransform(p.s_xfA,z);t.GetTransform(p.s_xfB,z);p.s_distanceInput.proxyA=n;p.s_distanceInput.proxyB=e;p.s_distanceInput.transformA=p.s_xfA;p.s_distanceInput.transformB=p.s_xfB;y.Distance(p.s_distanceOutput,
p.s_cache,p.s_distanceInput);if(p.s_distanceOutput.distance<=0){z=1;break}p.s_fcn.Initialize(p.s_cache,n,p.s_xfA,e,p.s_xfB);var E=p.s_fcn.Evaluate(p.s_xfA,p.s_xfB);if(E<=0){z=1;break}if(u==0)w=E>v?N.Max(v-d,0.75*v):N.Max(E-d,0.02*v);if(E-w<0.5*d){if(u==0){z=1;break}break}var P=z,Y=z,S=1;E=E;q.GetTransform(p.s_xfA,S);t.GetTransform(p.s_xfB,S);var ea=p.s_fcn.Evaluate(p.s_xfA,p.s_xfB);if(ea>=w){z=1;break}for(var ha=0;;){var ia=0;ia=ha&1?Y+(w-E)*(S-Y)/(ea-E):0.5*(Y+S);q.GetTransform(p.s_xfA,ia);t.GetTransform(p.s_xfB,
ia);var ja=p.s_fcn.Evaluate(p.s_xfA,p.s_xfB);if(N.Abs(ja-w)<0.025*d){P=ia;break}if(ja>w){Y=ia;E=ja}else{S=ia;ea=ja}++ha;++p.b2_toiRootIters;if(ha==50)break}p.b2_toiMaxRootIters=N.Max(p.b2_toiMaxRootIters,ha);if(P<(1+100*Number.MIN_VALUE)*z)break;z=P;u++;++p.b2_toiIters;if(u==1E3)break}p.b2_toiMaxIters=N.Max(p.b2_toiMaxIters,u);return z};p.TimeOfImpact=p.prototype.TimeOfImpact;_A2J_postDefs.push(function(){Box2D.Collision.b2TimeOfImpact.b2_toiCalls=0;Box2D.Collision.b2TimeOfImpact.prototype.b2_toiCalls=
Box2D.Collision.b2TimeOfImpact.b2_toiCalls;Box2D.Collision.b2TimeOfImpact.b2_toiIters=0;Box2D.Collision.b2TimeOfImpact.prototype.b2_toiIters=Box2D.Collision.b2TimeOfImpact.b2_toiIters;Box2D.Collision.b2TimeOfImpact.b2_toiMaxIters=0;Box2D.Collision.b2TimeOfImpact.prototype.b2_toiMaxIters=Box2D.Collision.b2TimeOfImpact.b2_toiMaxIters;Box2D.Collision.b2TimeOfImpact.b2_toiRootIters=0;Box2D.Collision.b2TimeOfImpact.prototype.b2_toiRootIters=Box2D.Collision.b2TimeOfImpact.b2_toiRootIters;Box2D.Collision.b2TimeOfImpact.b2_toiMaxRootIters=
0;Box2D.Collision.b2TimeOfImpact.prototype.b2_toiMaxRootIters=Box2D.Collision.b2TimeOfImpact.b2_toiMaxRootIters;Box2D.Collision.b2TimeOfImpact.s_cache=new f;Box2D.Collision.b2TimeOfImpact.prototype.s_cache=Box2D.Collision.b2TimeOfImpact.s_cache;Box2D.Collision.b2TimeOfImpact.s_distanceInput=new x;Box2D.Collision.b2TimeOfImpact.prototype.s_distanceInput=Box2D.Collision.b2TimeOfImpact.s_distanceInput;Box2D.Collision.b2TimeOfImpact.s_xfA=new C;Box2D.Collision.b2TimeOfImpact.prototype.s_xfA=Box2D.Collision.b2TimeOfImpact.s_xfA;
Box2D.Collision.b2TimeOfImpact.s_xfB=new C;Box2D.Collision.b2TimeOfImpact.prototype.s_xfB=Box2D.Collision.b2TimeOfImpact.s_xfB;Box2D.Collision.b2TimeOfImpact.s_fcn=new a;Box2D.Collision.b2TimeOfImpact.prototype.s_fcn=Box2D.Collision.b2TimeOfImpact.s_fcn;Box2D.Collision.b2TimeOfImpact.s_distanceOutput=new J;Box2D.Collision.b2TimeOfImpact.prototype.s_distanceOutput=Box2D.Collision.b2TimeOfImpact.s_distanceOutput});D.b2TOIInput=function(){this.proxyA=new M;this.proxyB=new M;this.sweepA=new s;this.sweepB=
new s};B.b2WorldManifold=function(){this.m_normal=new R};B.prototype.b2WorldManifold=function(){this.m_points=new Vector(G.b2_maxManifoldPoints);for(var d=0;d<G.b2_maxManifoldPoints;d++)this.m_points[d]=new R};B.prototype.Initialize=function(d,n,e,q,t){if(e===undefined)e=0;if(t===undefined)t=0;if(d.m_pointCount!=0){var v=0,z,u,w=0,E=0,P=0,Y=0,S=0;z=0;switch(d.m_type){case Z.e_circles:u=n.R;z=d.m_localPoint;v=n.position.x+u.col1.x*z.x+u.col2.x*z.y;n=n.position.y+u.col1.y*z.x+u.col2.y*z.y;u=q.R;z=d.m_points[0].m_localPoint;
d=q.position.x+u.col1.x*z.x+u.col2.x*z.y;q=q.position.y+u.col1.y*z.x+u.col2.y*z.y;z=d-v;u=q-n;w=z*z+u*u;if(w>Number.MIN_VALUE*Number.MIN_VALUE){w=Math.sqrt(w);this.m_normal.x=z/w;this.m_normal.y=u/w}else{this.m_normal.x=1;this.m_normal.y=0}z=n+e*this.m_normal.y;q=q-t*this.m_normal.y;this.m_points[0].x=0.5*(v+e*this.m_normal.x+(d-t*this.m_normal.x));this.m_points[0].y=0.5*(z+q);break;case Z.e_faceA:u=n.R;z=d.m_localPlaneNormal;w=u.col1.x*z.x+u.col2.x*z.y;E=u.col1.y*z.x+u.col2.y*z.y;u=n.R;z=d.m_localPoint;
P=n.position.x+u.col1.x*z.x+u.col2.x*z.y;Y=n.position.y+u.col1.y*z.x+u.col2.y*z.y;this.m_normal.x=w;this.m_normal.y=E;for(v=0;v<d.m_pointCount;v++){u=q.R;z=d.m_points[v].m_localPoint;S=q.position.x+u.col1.x*z.x+u.col2.x*z.y;z=q.position.y+u.col1.y*z.x+u.col2.y*z.y;this.m_points[v].x=S+0.5*(e-(S-P)*w-(z-Y)*E-t)*w;this.m_points[v].y=z+0.5*(e-(S-P)*w-(z-Y)*E-t)*E}break;case Z.e_faceB:u=q.R;z=d.m_localPlaneNormal;w=u.col1.x*z.x+u.col2.x*z.y;E=u.col1.y*z.x+u.col2.y*z.y;u=q.R;z=d.m_localPoint;P=q.position.x+
u.col1.x*z.x+u.col2.x*z.y;Y=q.position.y+u.col1.y*z.x+u.col2.y*z.y;this.m_normal.x=-w;this.m_normal.y=-E;for(v=0;v<d.m_pointCount;v++){u=n.R;z=d.m_points[v].m_localPoint;S=n.position.x+u.col1.x*z.x+u.col2.x*z.y;z=n.position.y+u.col1.y*z.x+u.col2.y*z.y;this.m_points[v].x=S+0.5*(t-(S-P)*w-(z-Y)*E-e)*w;this.m_points[v].y=z+0.5*(t-(S-P)*w-(z-Y)*E-e)*E}}}};O.ClipVertex=function(){this.v=new R;this.id=new da};O.prototype.Set=function(d){this.v.SetV(d.v);this.id.Set(d.id)};W.Features=function(){};W.prototype.__defineGetter__("referenceEdge",
function(){return this._referenceEdge});W.prototype.__defineSetter__("referenceEdge",function(d){if(d===undefined)d=0;this._referenceEdge=d;this._m_id._key=this._m_id._key&4294967040|this._referenceEdge&255});W.prototype.__defineGetter__("incidentEdge",function(){return this._incidentEdge});W.prototype.__defineSetter__("incidentEdge",function(d){if(d===undefined)d=0;this._incidentEdge=d;this._m_id._key=this._m_id._key&4294902015|this._incidentEdge<<8&65280});W.prototype.__defineGetter__("incidentVertex",
function(){return this._incidentVertex});W.prototype.__defineSetter__("incidentVertex",function(d){if(d===undefined)d=0;this._incidentVertex=d;this._m_id._key=this._m_id._key&4278255615|this._incidentVertex<<16&16711680});W.prototype.__defineGetter__("flip",function(){return this._flip});W.prototype.__defineSetter__("flip",function(d){if(d===undefined)d=0;this._flip=d;this._m_id._key=this._m_id._key&16777215|this._flip<<24&4278190080})})();
(function(){var L=Box2D.Common.b2Settings,I=Box2D.Collision.Shapes.b2CircleShape,H=Box2D.Collision.Shapes.b2EdgeChainDef,F=Box2D.Collision.Shapes.b2EdgeShape,G=Box2D.Collision.Shapes.b2MassData,A=Box2D.Collision.Shapes.b2PolygonShape,N=Box2D.Collision.Shapes.b2Shape,s=Box2D.Common.Math.b2Mat22,C=Box2D.Common.Math.b2Math,R=Box2D.Common.Math.b2Transform,aa=Box2D.Common.Math.b2Vec2;L=Box2D.Common.b2Settings;var $=Box2D.Collision.b2Distance,T=Box2D.Collision.b2DistanceInput,Q=Box2D.Collision.b2DistanceOutput,
X=Box2D.Collision.b2DistanceProxy,da=Box2D.Collision.b2SimplexCache;I=Box2D.Collision.Shapes.b2CircleShape;H=Box2D.Collision.Shapes.b2EdgeChainDef;F=Box2D.Collision.Shapes.b2EdgeShape;G=Box2D.Collision.Shapes.b2MassData;A=Box2D.Collision.Shapes.b2PolygonShape;N=Box2D.Collision.Shapes.b2Shape;I.inherit(Box2D.Collision.Shapes.b2Shape);I.prototype.__super=Box2D.Collision.Shapes.b2Shape.prototype;I.b2CircleShape=function(){Box2D.Collision.Shapes.b2Shape.b2Shape.apply(this,arguments);this.m_p=new aa};
I.prototype.Copy=function(){var j=new I;j.Set(this);return j};I.prototype.Set=function(j){this.__super.Set.call(this,j);if(a2j.is(j,I))this.m_p.SetV((j instanceof I?j:null).m_p)};I.prototype.TestPoint=function(j,y){var x=j.R,J=j.position.x+(x.col1.x*this.m_p.x+x.col2.x*this.m_p.y);x=j.position.y+(x.col1.y*this.m_p.x+x.col2.y*this.m_p.y);J=y.x-J;x=y.y-x;return J*J+x*x<=this.m_radius*this.m_radius};I.prototype.RayCast=function(j,y,x){var J=x.R,M=y.p1.x-(x.position.x+(J.col1.x*this.m_p.x+J.col2.x*this.m_p.y));
x=y.p1.y-(x.position.y+(J.col1.y*this.m_p.x+J.col2.y*this.m_p.y));J=y.p2.x-y.p1.x;var U=y.p2.y-y.p1.y,K=M*J+x*U,ba=J*J+U*U,V=K*K-ba*(M*M+x*x-this.m_radius*this.m_radius);if(V<0||ba<Number.MIN_VALUE)return false;K=-(K+Math.sqrt(V));if(0<=K&&K<=y.maxFraction*ba){K/=ba;j.fraction=K;j.normal.x=M+K*J;j.normal.y=x+K*U;j.normal.Normalize();return true}return false};I.prototype.ComputeAABB=function(j,y){var x=y.R,J=y.position.x+(x.col1.x*this.m_p.x+x.col2.x*this.m_p.y);x=y.position.y+(x.col1.y*this.m_p.x+
x.col2.y*this.m_p.y);j.lowerBound.Set(J-this.m_radius,x-this.m_radius);j.upperBound.Set(J+this.m_radius,x+this.m_radius)};I.prototype.ComputeMass=function(j,y){if(y===undefined)y=0;j.mass=y*L.b2_pi*this.m_radius*this.m_radius;j.center.SetV(this.m_p);j.I=j.mass*(0.5*this.m_radius*this.m_radius+(this.m_p.x*this.m_p.x+this.m_p.y*this.m_p.y))};I.prototype.ComputeSubmergedArea=function(j,y,x,J){if(y===undefined)y=0;x=C.MulX(x,this.m_p);var M=-(C.Dot(j,x)-y);if(M<-this.m_radius+Number.MIN_VALUE)return 0;
if(M>this.m_radius){J.SetV(x);return Math.PI*this.m_radius*this.m_radius}y=this.m_radius*this.m_radius;var U=M*M;M=y*(Math.asin(M/this.m_radius)+Math.PI/2)+M*Math.sqrt(y-U);y=-2/3*Math.pow(y-U,1.5)/M;J.x=x.x+j.x*y;J.y=x.y+j.y*y;return M};I.prototype.GetLocalPosition=function(){return this.m_p};I.prototype.SetLocalPosition=function(j){this.m_p.SetV(j)};I.prototype.GetRadius=function(){return this.m_radius};I.prototype.SetRadius=function(j){if(j===undefined)j=0;this.m_radius=j};I.prototype.b2CircleShape=
function(j){if(j===undefined)j=0;this.__super.b2Shape.call(this);this.m_type=this.e_circleShape;this.m_radius=j};H.b2EdgeChainDef=function(){};H.prototype.b2EdgeChainDef=function(){this.vertexCount=0;this.isALoop=true;this.vertices=[]};F.inherit(Box2D.Collision.Shapes.b2Shape);F.prototype.__super=Box2D.Collision.Shapes.b2Shape.prototype;F.b2EdgeShape=function(){Box2D.Collision.Shapes.b2Shape.b2Shape.apply(this,arguments);this.s_supportVec=new aa;this.m_v1=new aa;this.m_v2=new aa;this.m_coreV1=new aa;
this.m_coreV2=new aa;this.m_normal=new aa;this.m_direction=new aa;this.m_cornerDir1=new aa;this.m_cornerDir2=new aa};F.prototype.TestPoint=function(){return false};F.prototype.RayCast=function(j,y,x){var J,M=y.p2.x-y.p1.x,U=y.p2.y-y.p1.y;J=x.R;var K=x.position.x+(J.col1.x*this.m_v1.x+J.col2.x*this.m_v1.y),ba=x.position.y+(J.col1.y*this.m_v1.x+J.col2.y*this.m_v1.y),V=x.position.y+(J.col1.y*this.m_v2.x+J.col2.y*this.m_v2.y)-ba;x=-(x.position.x+(J.col1.x*this.m_v2.x+J.col2.x*this.m_v2.y)-K);J=100*Number.MIN_VALUE;
var Z=-(M*V+U*x);if(Z>J){K=y.p1.x-K;var ga=y.p1.y-ba;ba=K*V+ga*x;if(0<=ba&&ba<=y.maxFraction*Z){y=-M*ga+U*K;if(-J*Z<=y&&y<=Z*(1+J)){ba/=Z;j.fraction=ba;y=Math.sqrt(V*V+x*x);j.normal.x=V/y;j.normal.y=x/y;return true}}}return false};F.prototype.ComputeAABB=function(j,y){var x=y.R,J=y.position.x+(x.col1.x*this.m_v1.x+x.col2.x*this.m_v1.y),M=y.position.y+(x.col1.y*this.m_v1.x+x.col2.y*this.m_v1.y),U=y.position.x+(x.col1.x*this.m_v2.x+x.col2.x*this.m_v2.y);x=y.position.y+(x.col1.y*this.m_v2.x+x.col2.y*
this.m_v2.y);if(J<U){j.lowerBound.x=J;j.upperBound.x=U}else{j.lowerBound.x=U;j.upperBound.x=J}if(M<x){j.lowerBound.y=M;j.upperBound.y=x}else{j.lowerBound.y=x;j.upperBound.y=M}};F.prototype.ComputeMass=function(j){j.mass=0;j.center.SetV(this.m_v1);j.I=0};F.prototype.ComputeSubmergedArea=function(j,y,x,J){if(y===undefined)y=0;var M=new aa(j.x*y,j.y*y),U=C.MulX(x,this.m_v1);x=C.MulX(x,this.m_v2);var K=C.Dot(j,U)-y;j=C.Dot(j,x)-y;if(K>0)if(j>0)return 0;else{U.x=-j/(K-j)*U.x+K/(K-j)*x.x;U.y=-j/(K-j)*U.y+
K/(K-j)*x.y}else if(j>0){x.x=-j/(K-j)*U.x+K/(K-j)*x.x;x.y=-j/(K-j)*U.y+K/(K-j)*x.y}J.x=(M.x+U.x+x.x)/3;J.y=(M.y+U.y+x.y)/3;return 0.5*((U.x-M.x)*(x.y-M.y)-(U.y-M.y)*(x.x-M.x))};F.prototype.GetLength=function(){return this.m_length};F.prototype.GetVertex1=function(){return this.m_v1};F.prototype.GetVertex2=function(){return this.m_v2};F.prototype.GetCoreVertex1=function(){return this.m_coreV1};F.prototype.GetCoreVertex2=function(){return this.m_coreV2};F.prototype.GetNormalVector=function(){return this.m_normal};
F.prototype.GetDirectionVector=function(){return this.m_direction};F.prototype.GetCorner1Vector=function(){return this.m_cornerDir1};F.prototype.GetCorner2Vector=function(){return this.m_cornerDir2};F.prototype.Corner1IsConvex=function(){return this.m_cornerConvex1};F.prototype.Corner2IsConvex=function(){return this.m_cornerConvex2};F.prototype.GetFirstVertex=function(j){var y=j.R;return new aa(j.position.x+(y.col1.x*this.m_coreV1.x+y.col2.x*this.m_coreV1.y),j.position.y+(y.col1.y*this.m_coreV1.x+
y.col2.y*this.m_coreV1.y))};F.prototype.GetNextEdge=function(){return this.m_nextEdge};F.prototype.GetPrevEdge=function(){return this.m_prevEdge};F.prototype.Support=function(j,y,x){if(y===undefined)y=0;if(x===undefined)x=0;var J=j.R,M=j.position.x+(J.col1.x*this.m_coreV1.x+J.col2.x*this.m_coreV1.y),U=j.position.y+(J.col1.y*this.m_coreV1.x+J.col2.y*this.m_coreV1.y),K=j.position.x+(J.col1.x*this.m_coreV2.x+J.col2.x*this.m_coreV2.y);j=j.position.y+(J.col1.y*this.m_coreV2.x+J.col2.y*this.m_coreV2.y);
if(M*y+U*x>K*y+j*x){this.s_supportVec.x=M;this.s_supportVec.y=U}else{this.s_supportVec.x=K;this.s_supportVec.y=j}return this.s_supportVec};F.prototype.b2EdgeShape=function(j,y){this.__super.b2Shape.call(this);this.m_type=this.e_edgeShape;this.m_nextEdge=this.m_prevEdge=null;this.m_v1=j;this.m_v2=y;this.m_direction.Set(this.m_v2.x-this.m_v1.x,this.m_v2.y-this.m_v1.y);this.m_length=this.m_direction.Normalize();this.m_normal.Set(this.m_direction.y,-this.m_direction.x);this.m_coreV1.Set(-L.b2_toiSlop*
(this.m_normal.x-this.m_direction.x)+this.m_v1.x,-L.b2_toiSlop*(this.m_normal.y-this.m_direction.y)+this.m_v1.y);this.m_coreV2.Set(-L.b2_toiSlop*(this.m_normal.x+this.m_direction.x)+this.m_v2.x,-L.b2_toiSlop*(this.m_normal.y+this.m_direction.y)+this.m_v2.y);this.m_cornerDir1=this.m_normal;this.m_cornerDir2.Set(-this.m_normal.x,-this.m_normal.y)};F.prototype.SetPrevEdge=function(j,y,x,J){this.m_prevEdge=j;this.m_coreV1=y;this.m_cornerDir1=x;this.m_cornerConvex1=J};F.prototype.SetNextEdge=function(j,
y,x,J){this.m_nextEdge=j;this.m_coreV2=y;this.m_cornerDir2=x;this.m_cornerConvex2=J};G.b2MassData=function(){this.mass=0;this.center=new aa(0,0);this.I=0};A.inherit(Box2D.Collision.Shapes.b2Shape);A.prototype.__super=Box2D.Collision.Shapes.b2Shape.prototype;A.b2PolygonShape=function(){Box2D.Collision.Shapes.b2Shape.b2Shape.apply(this,arguments)};A.prototype.Copy=function(){var j=new A;j.Set(this);return j};A.prototype.Set=function(j){this.__super.Set.call(this,j);if(a2j.is(j,A)){j=j instanceof A?
j:null;this.m_centroid.SetV(j.m_centroid);this.m_vertexCount=j.m_vertexCount;this.Reserve(this.m_vertexCount);for(var y=0;y<this.m_vertexCount;y++){this.m_vertices[y].SetV(j.m_vertices[y]);this.m_normals[y].SetV(j.m_normals[y])}}};A.prototype.SetAsArray=function(j,y){if(y===undefined)y=0;var x=new Vector,J,M;for(M in j){J=j[M];x.push(J)}this.SetAsVector(x,y)};A.prototype.AsArray=function(j,y){if(y===undefined)y=0;var x=new A;x.SetAsArray(j,y);return x};A.AsArray=A.prototype.AsArray;A.prototype.SetAsVector=
function(j,y){if(y===undefined)y=0;if(y==0)y=j.length;L.b2Assert(2<=y);this.m_vertexCount=y;this.Reserve(y);var x=0;for(x=0;x<this.m_vertexCount;x++)this.m_vertices[x].SetV(j[x]);for(x=0;x<this.m_vertexCount;++x){var J=parseInt(x),M=parseInt(x+1<this.m_vertexCount?x+1:0);J=C.SubtractVV(this.m_vertices[M],this.m_vertices[J]);L.b2Assert(J.LengthSquared()>Number.MIN_VALUE);this.m_normals[x].SetV(C.CrossVF(J,1));this.m_normals[x].Normalize()}this.m_centroid=this.ComputeCentroid(this.m_vertices,this.m_vertexCount)};
A.prototype.AsVector=function(j,y){if(y===undefined)y=0;var x=new A;x.SetAsVector(j,y);return x};A.AsVector=A.prototype.AsVector;A.prototype.SetAsBox=function(j,y){if(j===undefined)j=0;if(y===undefined)y=0;this.m_vertexCount=4;this.Reserve(4);this.m_vertices[0].Set(-j,-y);this.m_vertices[1].Set(j,-y);this.m_vertices[2].Set(j,y);this.m_vertices[3].Set(-j,y);this.m_normals[0].Set(0,-1);this.m_normals[1].Set(1,0);this.m_normals[2].Set(0,1);this.m_normals[3].Set(-1,0);this.m_centroid.SetZero()};A.prototype.AsBox=
function(j,y){if(j===undefined)j=0;if(y===undefined)y=0;var x=new A;x.SetAsBox(j,y);return x};A.AsBox=A.prototype.AsBox;A.prototype.SetAsOrientedBox=function(j,y,x,J){if(j===undefined)j=0;if(y===undefined)y=0;if(x===undefined)x=null;if(J===undefined)J=0;this.m_vertexCount=4;this.Reserve(4);this.m_vertices[0].Set(-j,-y);this.m_vertices[1].Set(j,-y);this.m_vertices[2].Set(j,y);this.m_vertices[3].Set(-j,y);this.m_normals[0].Set(0,-1);this.m_normals[1].Set(1,0);this.m_normals[2].Set(0,1);this.m_normals[3].Set(-1,
0);this.m_centroid=x;j=new R;j.position=x;j.R.Set(J);for(x=0;x<this.m_vertexCount;++x){this.m_vertices[x]=C.MulX(j,this.m_vertices[x]);this.m_normals[x]=C.MulMV(j.R,this.m_normals[x])}};A.prototype.AsOrientedBox=function(j,y,x,J){if(j===undefined)j=0;if(y===undefined)y=0;if(x===undefined)x=null;if(J===undefined)J=0;var M=new A;M.SetAsOrientedBox(j,y,x,J);return M};A.AsOrientedBox=A.prototype.AsOrientedBox;A.prototype.SetAsEdge=function(j,y){this.m_vertexCount=2;this.Reserve(2);this.m_vertices[0].SetV(j);
this.m_vertices[1].SetV(y);this.m_centroid.x=0.5*(j.x+y.x);this.m_centroid.y=0.5*(j.y+y.y);this.m_normals[0]=C.CrossVF(C.SubtractVV(y,j),1);this.m_normals[0].Normalize();this.m_normals[1].x=-this.m_normals[0].x;this.m_normals[1].y=-this.m_normals[0].y};A.prototype.AsEdge=function(j,y){var x=new A;x.SetAsEdge(j,y);return x};A.AsEdge=A.prototype.AsEdge;A.prototype.TestPoint=function(j,y){var x;x=j.R;for(var J=y.x-j.position.x,M=y.y-j.position.y,U=J*x.col1.x+M*x.col1.y,K=J*x.col2.x+M*x.col2.y,ba=0;ba<
this.m_vertexCount;++ba){x=this.m_vertices[ba];J=U-x.x;M=K-x.y;x=this.m_normals[ba];if(x.x*J+x.y*M>0)return false}return true};A.prototype.RayCast=function(j,y,x){var J=0,M=y.maxFraction,U=0,K=0,ba,V;U=y.p1.x-x.position.x;K=y.p1.y-x.position.y;ba=x.R;var Z=U*ba.col1.x+K*ba.col1.y,ga=U*ba.col2.x+K*ba.col2.y;U=y.p2.x-x.position.x;K=y.p2.y-x.position.y;ba=x.R;y=U*ba.col1.x+K*ba.col1.y-Z;ba=U*ba.col2.x+K*ba.col2.y-ga;for(var fa=parseInt(-1),c=0;c<this.m_vertexCount;++c){V=this.m_vertices[c];U=V.x-Z;K=
V.y-ga;V=this.m_normals[c];U=V.x*U+V.y*K;K=V.x*y+V.y*ba;if(K==0){if(U<0)return false}else if(K<0&&U<J*K){J=U/K;fa=c}else if(K>0&&U<M*K)M=U/K;if(M<J-Number.MIN_VALUE)return false}if(fa>=0){j.fraction=J;ba=x.R;V=this.m_normals[fa];j.normal.x=ba.col1.x*V.x+ba.col2.x*V.y;j.normal.y=ba.col1.y*V.x+ba.col2.y*V.y;return true}return false};A.prototype.ComputeAABB=function(j,y){for(var x=y.R,J=this.m_vertices[0],M=y.position.x+(x.col1.x*J.x+x.col2.x*J.y),U=y.position.y+(x.col1.y*J.x+x.col2.y*J.y),K=M,ba=U,
V=1;V<this.m_vertexCount;++V){J=this.m_vertices[V];var Z=y.position.x+(x.col1.x*J.x+x.col2.x*J.y);J=y.position.y+(x.col1.y*J.x+x.col2.y*J.y);M=M<Z?M:Z;U=U<J?U:J;K=K>Z?K:Z;ba=ba>J?ba:J}j.lowerBound.x=M-this.m_radius;j.lowerBound.y=U-this.m_radius;j.upperBound.x=K+this.m_radius;j.upperBound.y=ba+this.m_radius};A.prototype.ComputeMass=function(j,y){if(y===undefined)y=0;if(this.m_vertexCount==2){j.center.x=0.5*(this.m_vertices[0].x+this.m_vertices[1].x);j.center.y=0.5*(this.m_vertices[0].y+this.m_vertices[1].y);
j.mass=0;j.I=0}else{for(var x=0,J=0,M=0,U=0,K=1/3,ba=0;ba<this.m_vertexCount;++ba){var V=this.m_vertices[ba],Z=ba+1<this.m_vertexCount?this.m_vertices[parseInt(ba+1)]:this.m_vertices[0],ga=V.x-0,fa=V.y-0,c=Z.x-0,g=Z.y-0,k=ga*g-fa*c,h=0.5*k;M+=h;x+=h*K*(0+V.x+Z.x);J+=h*K*(0+V.y+Z.y);V=ga;fa=fa;c=c;g=g;U+=k*(K*(0.25*(V*V+c*V+c*c)+(0*V+0*c))+0+(K*(0.25*(fa*fa+g*fa+g*g)+(0*fa+0*g))+0))}j.mass=y*M;x*=1/M;J*=1/M;j.center.Set(x,J);j.I=y*U}};A.prototype.ComputeSubmergedArea=function(j,y,x,J){if(y===undefined)y=
0;var M=C.MulTMV(x.R,j),U=y-C.Dot(j,x.position),K=new Vector_a2j_Number,ba=0,V=parseInt(-1);y=parseInt(-1);var Z=false;for(j=j=0;j<this.m_vertexCount;++j){K[j]=C.Dot(M,this.m_vertices[j])-U;var ga=K[j]<-Number.MIN_VALUE;if(j>0)if(ga){if(!Z){V=j-1;ba++}}else if(Z){y=j-1;ba++}Z=ga}switch(ba){case 0:if(Z){j=new G;this.ComputeMass(j,1);J.SetV(C.MulX(x,j.center));return j.mass}else return 0;case 1:if(V==-1)V=this.m_vertexCount-1;else y=this.m_vertexCount-1}j=parseInt((V+1)%this.m_vertexCount);M=parseInt((y+
1)%this.m_vertexCount);U=(0-K[V])/(K[j]-K[V]);K=(0-K[y])/(K[M]-K[y]);V=new aa(this.m_vertices[V].x*(1-U)+this.m_vertices[j].x*U,this.m_vertices[V].y*(1-U)+this.m_vertices[j].y*U);y=new aa(this.m_vertices[y].x*(1-K)+this.m_vertices[M].x*K,this.m_vertices[y].y*(1-K)+this.m_vertices[M].y*K);K=0;U=new aa;ba=this.m_vertices[j];for(j=j;j!=M;){j=(j+1)%this.m_vertexCount;Z=j==M?y:this.m_vertices[j];ga=0.5*((ba.x-V.x)*(Z.y-V.y)-(ba.y-V.y)*(Z.x-V.x));K+=ga;U.x+=ga*(V.x+ba.x+Z.x)/3;U.y+=ga*(V.y+ba.y+Z.y)/3;
ba=Z}U.Multiply(1/K);J.SetV(C.MulX(x,U));return K};A.prototype.GetVertexCount=function(){return this.m_vertexCount};A.prototype.GetVertices=function(){return this.m_vertices};A.prototype.GetNormals=function(){return this.m_normals};A.prototype.GetSupport=function(j){for(var y=0,x=this.m_vertices[0].x*j.x+this.m_vertices[0].y*j.y,J=1;J<this.m_vertexCount;++J){var M=this.m_vertices[J].x*j.x+this.m_vertices[J].y*j.y;if(M>x){y=J;x=M}}return y};A.prototype.GetSupportVertex=function(j){for(var y=0,x=this.m_vertices[0].x*
j.x+this.m_vertices[0].y*j.y,J=1;J<this.m_vertexCount;++J){var M=this.m_vertices[J].x*j.x+this.m_vertices[J].y*j.y;if(M>x){y=J;x=M}}return this.m_vertices[y]};A.prototype.Validate=function(){return false};A.prototype.b2PolygonShape=function(){this.__super.b2Shape.call(this);this.m_type=this.e_polygonShape;this.m_centroid=new aa;this.m_vertices=new Vector;this.m_normals=new Vector};A.prototype.Reserve=function(j){if(j===undefined)j=0;for(var y=parseInt(this.m_vertices.length);y<j;y++){this.m_vertices[y]=
new aa;this.m_normals[y]=new aa}};A.prototype.ComputeCentroid=function(j,y){if(y===undefined)y=0;for(var x=new aa,J=0,M=1/3,U=0;U<y;++U){var K=j[U],ba=U+1<y?j[parseInt(U+1)]:j[0],V=0.5*((K.x-0)*(ba.y-0)-(K.y-0)*(ba.x-0));J+=V;x.x+=V*M*(0+K.x+ba.x);x.y+=V*M*(0+K.y+ba.y)}x.x*=1/J;x.y*=1/J;return x};A.ComputeCentroid=A.prototype.ComputeCentroid;A.prototype.ComputeOBB=function(j,y,x){if(x===undefined)x=0;var J=0,M=new Vector(x+1);for(J=0;J<x;++J)M[J]=y[J];M[x]=M[0];y=Number.MAX_VALUE;for(J=1;J<=x;++J){var U=
M[parseInt(J-1)],K=M[J].x-U.x,ba=M[J].y-U.y,V=Math.sqrt(K*K+ba*ba);K/=V;ba/=V;for(var Z=-ba,ga=K,fa=V=Number.MAX_VALUE,c=-Number.MAX_VALUE,g=-Number.MAX_VALUE,k=0;k<x;++k){var h=M[k].x-U.x,o=M[k].y-U.y,r=K*h+ba*o;h=Z*h+ga*o;if(r<V)V=r;if(h<fa)fa=h;if(r>c)c=r;if(h>g)g=h}k=(c-V)*(g-fa);if(k<0.95*y){y=k;j.R.col1.x=K;j.R.col1.y=ba;j.R.col2.x=Z;j.R.col2.y=ga;K=0.5*(V+c);ba=0.5*(fa+g);Z=j.R;j.center.x=U.x+(Z.col1.x*K+Z.col2.x*ba);j.center.y=U.y+(Z.col1.y*K+Z.col2.y*ba);j.extents.x=0.5*(c-V);j.extents.y=
0.5*(g-fa)}}};A.ComputeOBB=A.prototype.ComputeOBB;_A2J_postDefs.push(function(){Box2D.Collision.Shapes.b2PolygonShape.s_mat=new s;Box2D.Collision.Shapes.b2PolygonShape.prototype.s_mat=Box2D.Collision.Shapes.b2PolygonShape.s_mat});N.b2Shape=function(){};N.prototype.Copy=function(){return null};N.prototype.Set=function(j){this.m_radius=j.m_radius};N.prototype.GetType=function(){return this.m_type};N.prototype.TestPoint=function(){return false};N.prototype.RayCast=function(){return false};N.prototype.ComputeAABB=
function(){};N.prototype.ComputeMass=function(){};N.prototype.ComputeSubmergedArea=function(){return 0};N.prototype.TestOverlap=function(j,y,x,J){var M=new T;M.proxyA=new X;M.proxyA.Set(j);M.proxyB=new X;M.proxyB.Set(x);M.transformA=y;M.transformB=J;M.useRadii=true;j=new da;j.count=0;y=new Q;$.Distance(y,j,M);return y.distance<10*Number.MIN_VALUE};N.TestOverlap=N.prototype.TestOverlap;N.prototype.b2Shape=function(){this.m_type=N.e_unknownShape;this.m_radius=L.b2_linearSlop};_A2J_postDefs.push(function(){Box2D.Collision.Shapes.b2Shape.e_unknownShape=
parseInt(-1);Box2D.Collision.Shapes.b2Shape.prototype.e_unknownShape=Box2D.Collision.Shapes.b2Shape.e_unknownShape;Box2D.Collision.Shapes.b2Shape.e_circleShape=0;Box2D.Collision.Shapes.b2Shape.prototype.e_circleShape=Box2D.Collision.Shapes.b2Shape.e_circleShape;Box2D.Collision.Shapes.b2Shape.e_polygonShape=1;Box2D.Collision.Shapes.b2Shape.prototype.e_polygonShape=Box2D.Collision.Shapes.b2Shape.e_polygonShape;Box2D.Collision.Shapes.b2Shape.e_edgeShape=2;Box2D.Collision.Shapes.b2Shape.prototype.e_edgeShape=
Box2D.Collision.Shapes.b2Shape.e_edgeShape;Box2D.Collision.Shapes.b2Shape.e_shapeTypeCount=3;Box2D.Collision.Shapes.b2Shape.prototype.e_shapeTypeCount=Box2D.Collision.Shapes.b2Shape.e_shapeTypeCount;Box2D.Collision.Shapes.b2Shape.e_hitCollide=1;Box2D.Collision.Shapes.b2Shape.prototype.e_hitCollide=Box2D.Collision.Shapes.b2Shape.e_hitCollide;Box2D.Collision.Shapes.b2Shape.e_missCollide=0;Box2D.Collision.Shapes.b2Shape.prototype.e_missCollide=Box2D.Collision.Shapes.b2Shape.e_missCollide;Box2D.Collision.Shapes.b2Shape.e_startsInsideCollide=
parseInt(-1);Box2D.Collision.Shapes.b2Shape.prototype.e_startsInsideCollide=Box2D.Collision.Shapes.b2Shape.e_startsInsideCollide})})();
(function(){var L=Box2D.Common.b2Color,I=Box2D.Common.b2Settings,H=Box2D.Common.Math.b2Math;L=Box2D.Common.b2Color;I=Box2D.Common.b2Settings;L.b2Color=function(){this._b=this._g=this._r=0};L.prototype.b2Color=function(F,G,A){if(F===undefined)F=0;if(G===undefined)G=0;if(A===undefined)A=0;this._r=a2j.parseUInt(255*H.Clamp(F,0,1));this._g=a2j.parseUInt(255*H.Clamp(G,0,1));this._b=a2j.parseUInt(255*H.Clamp(A,0,1))};L.prototype.Set=function(F,G,A){if(F===undefined)F=0;if(G===undefined)G=0;if(A===undefined)A=
0;this._r=a2j.parseUInt(255*H.Clamp(F,0,1));this._g=a2j.parseUInt(255*H.Clamp(G,0,1));this._b=a2j.parseUInt(255*H.Clamp(A,0,1))};L.prototype.__defineSetter__("r",function(F){if(F===undefined)F=0;this._r=a2j.parseUInt(255*H.Clamp(F,0,1))});L.prototype.__defineSetter__("g",function(F){if(F===undefined)F=0;this._g=a2j.parseUInt(255*H.Clamp(F,0,1))});L.prototype.__defineSetter__("b",function(F){if(F===undefined)F=0;this._b=a2j.parseUInt(255*H.Clamp(F,0,1))});L.prototype.__defineGetter__("color",function(){return this._r<<
16|this._g<<8|this._b});I.b2Settings=function(){};I.prototype.b2MixFriction=function(F,G){if(F===undefined)F=0;if(G===undefined)G=0;return Math.sqrt(F*G)};I.b2MixFriction=I.prototype.b2MixFriction;I.prototype.b2MixRestitution=function(F,G){if(F===undefined)F=0;if(G===undefined)G=0;return F>G?F:G};I.b2MixRestitution=I.prototype.b2MixRestitution;I.prototype.b2Assert=function(F){if(!F)throw"Assertion Failed";};I.b2Assert=I.prototype.b2Assert;_A2J_postDefs.push(function(){Box2D.Common.b2Settings.VERSION=
"2.1alpha";Box2D.Common.b2Settings.prototype.VERSION=Box2D.Common.b2Settings.VERSION;Box2D.Common.b2Settings.USHRT_MAX=65535;Box2D.Common.b2Settings.prototype.USHRT_MAX=Box2D.Common.b2Settings.USHRT_MAX;Box2D.Common.b2Settings.b2_pi=Math.PI;Box2D.Common.b2Settings.prototype.b2_pi=Box2D.Common.b2Settings.b2_pi;Box2D.Common.b2Settings.b2_maxManifoldPoints=2;Box2D.Common.b2Settings.prototype.b2_maxManifoldPoints=Box2D.Common.b2Settings.b2_maxManifoldPoints;Box2D.Common.b2Settings.b2_aabbExtension=0.1;
Box2D.Common.b2Settings.prototype.b2_aabbExtension=Box2D.Common.b2Settings.b2_aabbExtension;Box2D.Common.b2Settings.b2_aabbMultiplier=2;Box2D.Common.b2Settings.prototype.b2_aabbMultiplier=Box2D.Common.b2Settings.b2_aabbMultiplier;Box2D.Common.b2Settings.b2_polygonRadius=2*I.b2_linearSlop;Box2D.Common.b2Settings.prototype.b2_polygonRadius=Box2D.Common.b2Settings.b2_polygonRadius;Box2D.Common.b2Settings.b2_linearSlop=0.0050;Box2D.Common.b2Settings.prototype.b2_linearSlop=Box2D.Common.b2Settings.b2_linearSlop;
Box2D.Common.b2Settings.b2_angularSlop=2/180*I.b2_pi;Box2D.Common.b2Settings.prototype.b2_angularSlop=Box2D.Common.b2Settings.b2_angularSlop;Box2D.Common.b2Settings.b2_toiSlop=8*I.b2_linearSlop;Box2D.Common.b2Settings.prototype.b2_toiSlop=Box2D.Common.b2Settings.b2_toiSlop;Box2D.Common.b2Settings.b2_maxTOIContactsPerIsland=32;Box2D.Common.b2Settings.prototype.b2_maxTOIContactsPerIsland=Box2D.Common.b2Settings.b2_maxTOIContactsPerIsland;Box2D.Common.b2Settings.b2_maxTOIJointsPerIsland=32;Box2D.Common.b2Settings.prototype.b2_maxTOIJointsPerIsland=
Box2D.Common.b2Settings.b2_maxTOIJointsPerIsland;Box2D.Common.b2Settings.b2_velocityThreshold=1;Box2D.Common.b2Settings.prototype.b2_velocityThreshold=Box2D.Common.b2Settings.b2_velocityThreshold;Box2D.Common.b2Settings.b2_maxLinearCorrection=0.2;Box2D.Common.b2Settings.prototype.b2_maxLinearCorrection=Box2D.Common.b2Settings.b2_maxLinearCorrection;Box2D.Common.b2Settings.b2_maxAngularCorrection=8/180*I.b2_pi;Box2D.Common.b2Settings.prototype.b2_maxAngularCorrection=Box2D.Common.b2Settings.b2_maxAngularCorrection;
Box2D.Common.b2Settings.b2_maxTranslation=2;Box2D.Common.b2Settings.prototype.b2_maxTranslation=Box2D.Common.b2Settings.b2_maxTranslation;Box2D.Common.b2Settings.b2_maxTranslationSquared=I.b2_maxTranslation*I.b2_maxTranslation;Box2D.Common.b2Settings.prototype.b2_maxTranslationSquared=Box2D.Common.b2Settings.b2_maxTranslationSquared;Box2D.Common.b2Settings.b2_maxRotation=0.5*I.b2_pi;Box2D.Common.b2Settings.prototype.b2_maxRotation=Box2D.Common.b2Settings.b2_maxRotation;Box2D.Common.b2Settings.b2_maxRotationSquared=
I.b2_maxRotation*I.b2_maxRotation;Box2D.Common.b2Settings.prototype.b2_maxRotationSquared=Box2D.Common.b2Settings.b2_maxRotationSquared;Box2D.Common.b2Settings.b2_contactBaumgarte=0.2;Box2D.Common.b2Settings.prototype.b2_contactBaumgarte=Box2D.Common.b2Settings.b2_contactBaumgarte;Box2D.Common.b2Settings.b2_timeToSleep=0.5;Box2D.Common.b2Settings.prototype.b2_timeToSleep=Box2D.Common.b2Settings.b2_timeToSleep;Box2D.Common.b2Settings.b2_linearSleepTolerance=0.01;Box2D.Common.b2Settings.prototype.b2_linearSleepTolerance=
Box2D.Common.b2Settings.b2_linearSleepTolerance;Box2D.Common.b2Settings.b2_angularSleepTolerance=2/180*I.b2_pi;Box2D.Common.b2Settings.prototype.b2_angularSleepTolerance=Box2D.Common.b2Settings.b2_angularSleepTolerance})})();
(function(){var L=Box2D.Common.Math.b2Mat22,I=Box2D.Common.Math.b2Mat33,H=Box2D.Common.Math.b2Math,F=Box2D.Common.Math.b2Sweep,G=Box2D.Common.Math.b2Transform,A=Box2D.Common.Math.b2Vec2,N=Box2D.Common.Math.b2Vec3;L.b2Mat22=function(){this.col1=new A;this.col2=new A};L.prototype.b2Mat22=function(){this.SetIdentity()};L.prototype.FromAngle=function(s){if(s===undefined)s=0;var C=new L;C.Set(s);return C};L.FromAngle=L.prototype.FromAngle;L.prototype.FromVV=function(s,C){var R=new L;R.SetVV(s,C);return R};
L.FromVV=L.prototype.FromVV;L.prototype.Set=function(s){if(s===undefined)s=0;var C=Math.cos(s);s=Math.sin(s);this.col1.x=C;this.col2.x=-s;this.col1.y=s;this.col2.y=C};L.prototype.SetVV=function(s,C){this.col1.SetV(s);this.col2.SetV(C)};L.prototype.Copy=function(){var s=new L;s.SetM(this);return s};L.prototype.SetM=function(s){this.col1.SetV(s.col1);this.col2.SetV(s.col2)};L.prototype.AddM=function(s){this.col1.x+=s.col1.x;this.col1.y+=s.col1.y;this.col2.x+=s.col2.x;this.col2.y+=s.col2.y};L.prototype.SetIdentity=
function(){this.col1.x=1;this.col2.x=0;this.col1.y=0;this.col2.y=1};L.prototype.SetZero=function(){this.col1.x=0;this.col2.x=0;this.col1.y=0;this.col2.y=0};L.prototype.GetAngle=function(){return Math.atan2(this.col1.y,this.col1.x)};L.prototype.GetInverse=function(s){var C=this.col1.x,R=this.col2.x,aa=this.col1.y,$=this.col2.y,T=C*$-R*aa;if(T!=0)T=1/T;s.col1.x=T*$;s.col2.x=-T*R;s.col1.y=-T*aa;s.col2.y=T*C;return s};L.prototype.Solve=function(s,C,R){if(C===undefined)C=0;if(R===undefined)R=0;var aa=
this.col1.x,$=this.col2.x,T=this.col1.y,Q=this.col2.y,X=aa*Q-$*T;if(X!=0)X=1/X;s.x=X*(Q*C-$*R);s.y=X*(aa*R-T*C);return s};L.prototype.Abs=function(){this.col1.Abs();this.col2.Abs()};I.b2Mat33=function(){this.col1=new N;this.col2=new N;this.col3=new N};I.prototype.b2Mat33=function(s,C,R){if(s===undefined)s=null;if(C===undefined)C=null;if(R===undefined)R=null;if(!s&&!C&&!R){this.col1.SetZero();this.col2.SetZero();this.col3.SetZero()}else{this.col1.SetV(s);this.col2.SetV(C);this.col3.SetV(R)}};I.prototype.SetVVV=
function(s,C,R){this.col1.SetV(s);this.col2.SetV(C);this.col3.SetV(R)};I.prototype.Copy=function(){return new I(this.col1,this.col2,this.col3)};I.prototype.SetM=function(s){this.col1.SetV(s.col1);this.col2.SetV(s.col2);this.col3.SetV(s.col3)};I.prototype.AddM=function(s){this.col1.x+=s.col1.x;this.col1.y+=s.col1.y;this.col1.z+=s.col1.z;this.col2.x+=s.col2.x;this.col2.y+=s.col2.y;this.col2.z+=s.col2.z;this.col3.x+=s.col3.x;this.col3.y+=s.col3.y;this.col3.z+=s.col3.z};I.prototype.SetIdentity=function(){this.col1.x=
1;this.col2.x=0;this.col3.x=0;this.col1.y=0;this.col2.y=1;this.col3.y=0;this.col1.z=0;this.col2.z=0;this.col3.z=1};I.prototype.SetZero=function(){this.col1.x=0;this.col2.x=0;this.col3.x=0;this.col1.y=0;this.col2.y=0;this.col3.y=0;this.col1.z=0;this.col2.z=0;this.col3.z=0};I.prototype.Solve22=function(s,C,R){if(C===undefined)C=0;if(R===undefined)R=0;var aa=this.col1.x,$=this.col2.x,T=this.col1.y,Q=this.col2.y,X=aa*Q-$*T;if(X!=0)X=1/X;s.x=X*(Q*C-$*R);s.y=X*(aa*R-T*C);return s};I.prototype.Solve33=function(s,
C,R,aa){if(C===undefined)C=0;if(R===undefined)R=0;if(aa===undefined)aa=0;var $=this.col1.x,T=this.col1.y,Q=this.col1.z,X=this.col2.x,da=this.col2.y,j=this.col2.z,y=this.col3.x,x=this.col3.y,J=this.col3.z,M=$*(da*J-j*x)+T*(j*y-X*J)+Q*(X*x-da*y);if(M!=0)M=1/M;s.x=M*(C*(da*J-j*x)+R*(j*y-X*J)+aa*(X*x-da*y));s.y=M*($*(R*J-aa*x)+T*(aa*y-C*J)+Q*(C*x-R*y));s.z=M*($*(da*aa-j*R)+T*(j*C-X*aa)+Q*(X*R-da*C));return s};H.b2Math=function(){};H.prototype.IsValid=function(s){if(s===undefined)s=0;return isFinite(s)};
H.IsValid=H.prototype.IsValid;H.prototype.Dot=function(s,C){return s.x*C.x+s.y*C.y};H.Dot=H.prototype.Dot;H.prototype.CrossVV=function(s,C){return s.x*C.y-s.y*C.x};H.CrossVV=H.prototype.CrossVV;H.prototype.CrossVF=function(s,C){if(C===undefined)C=0;return new A(C*s.y,-C*s.x)};H.CrossVF=H.prototype.CrossVF;H.prototype.CrossFV=function(s,C){if(s===undefined)s=0;return new A(-s*C.y,s*C.x)};H.CrossFV=H.prototype.CrossFV;H.prototype.MulMV=function(s,C){return new A(s.col1.x*C.x+s.col2.x*C.y,s.col1.y*C.x+
s.col2.y*C.y)};H.MulMV=H.prototype.MulMV;H.prototype.MulTMV=function(s,C){return new A(this.Dot(C,s.col1),this.Dot(C,s.col2))};H.MulTMV=H.prototype.MulTMV;H.prototype.MulX=function(s,C){var R=this.MulMV(s.R,C);R.x+=s.position.x;R.y+=s.position.y;return R};H.MulX=H.prototype.MulX;H.prototype.MulXT=function(s,C){var R=this.SubtractVV(C,s.position),aa=R.x*s.R.col1.x+R.y*s.R.col1.y;R.y=R.x*s.R.col2.x+R.y*s.R.col2.y;R.x=aa;return R};H.MulXT=H.prototype.MulXT;H.prototype.AddVV=function(s,C){return new A(s.x+
C.x,s.y+C.y)};H.AddVV=H.prototype.AddVV;H.prototype.SubtractVV=function(s,C){return new A(s.x-C.x,s.y-C.y)};H.SubtractVV=H.prototype.SubtractVV;H.prototype.Distance=function(s,C){var R=s.x-C.x,aa=s.y-C.y;return Math.sqrt(R*R+aa*aa)};H.Distance=H.prototype.Distance;H.prototype.DistanceSquared=function(s,C){var R=s.x-C.x,aa=s.y-C.y;return R*R+aa*aa};H.DistanceSquared=H.prototype.DistanceSquared;H.prototype.MulFV=function(s,C){if(s===undefined)s=0;return new A(s*C.x,s*C.y)};H.MulFV=H.prototype.MulFV;
H.prototype.AddMM=function(s,C){return L.FromVV(this.AddVV(s.col1,C.col1),this.AddVV(s.col2,C.col2))};H.AddMM=H.prototype.AddMM;H.prototype.MulMM=function(s,C){return L.FromVV(this.MulMV(s,C.col1),this.MulMV(s,C.col2))};H.MulMM=H.prototype.MulMM;H.prototype.MulTMM=function(s,C){var R=new A(this.Dot(s.col1,C.col1),this.Dot(s.col2,C.col1)),aa=new A(this.Dot(s.col1,C.col2),this.Dot(s.col2,C.col2));return L.FromVV(R,aa)};H.MulTMM=H.prototype.MulTMM;H.prototype.Abs=function(s){if(s===undefined)s=0;return s>
0?s:-s};H.Abs=H.prototype.Abs;H.prototype.AbsV=function(s){return new A(this.Abs(s.x),this.Abs(s.y))};H.AbsV=H.prototype.AbsV;H.prototype.AbsM=function(s){return L.FromVV(this.AbsV(s.col1),this.AbsV(s.col2))};H.AbsM=H.prototype.AbsM;H.prototype.Min=function(s,C){if(s===undefined)s=0;if(C===undefined)C=0;return s<C?s:C};H.Min=H.prototype.Min;H.prototype.MinV=function(s,C){return new A(this.Min(s.x,C.x),this.Min(s.y,C.y))};H.MinV=H.prototype.MinV;H.prototype.Max=function(s,C){if(s===undefined)s=0;if(C===
undefined)C=0;return s>C?s:C};H.Max=H.prototype.Max;H.prototype.MaxV=function(s,C){return new A(this.Max(s.x,C.x),this.Max(s.y,C.y))};H.MaxV=H.prototype.MaxV;H.prototype.Clamp=function(s,C,R){if(s===undefined)s=0;if(C===undefined)C=0;if(R===undefined)R=0;return s<C?C:s>R?R:s};H.Clamp=H.prototype.Clamp;H.prototype.ClampV=function(s,C,R){return this.MaxV(C,this.MinV(s,R))};H.ClampV=H.prototype.ClampV;H.prototype.Swap=function(s,C){var R=s[0];s[0]=C[0];C[0]=R};H.Swap=H.prototype.Swap;H.prototype.Random=
function(){return Math.random()*2-1};H.Random=H.prototype.Random;H.prototype.RandomRange=function(s,C){if(s===undefined)s=0;if(C===undefined)C=0;var R=Math.random();return R=(C-s)*R+s};H.RandomRange=H.prototype.RandomRange;H.prototype.NextPowerOfTwo=function(s){if(s===undefined)s=0;s|=s>>1&2147483647;s|=s>>2&1073741823;s|=s>>4&268435455;s|=s>>8&16777215;s|=s>>16&65535;return s+1};H.NextPowerOfTwo=H.prototype.NextPowerOfTwo;H.prototype.IsPowerOfTwo=function(s){if(s===undefined)s=0;return s>0&&(s&s-
1)==0};H.IsPowerOfTwo=H.prototype.IsPowerOfTwo;_A2J_postDefs.push(function(){Box2D.Common.Math.b2Math.b2Vec2_zero=new A(0,0);Box2D.Common.Math.b2Math.prototype.b2Vec2_zero=Box2D.Common.Math.b2Math.b2Vec2_zero;Box2D.Common.Math.b2Math.b2Mat22_identity=L.FromVV(new A(1,0),new A(0,1));Box2D.Common.Math.b2Math.prototype.b2Mat22_identity=Box2D.Common.Math.b2Math.b2Mat22_identity;Box2D.Common.Math.b2Math.b2Transform_identity=new G(H.b2Vec2_zero,H.b2Mat22_identity);Box2D.Common.Math.b2Math.prototype.b2Transform_identity=
Box2D.Common.Math.b2Math.b2Transform_identity});F.b2Sweep=function(){this.localCenter=new A;this.c0=new A;this.c=new A};F.prototype.Set=function(s){this.localCenter.SetV(s.localCenter);this.c0.SetV(s.c0);this.c.SetV(s.c);this.a0=s.a0;this.a=s.a;this.t0=s.t0};F.prototype.Copy=function(){var s=new F;s.localCenter.SetV(this.localCenter);s.c0.SetV(this.c0);s.c.SetV(this.c);s.a0=this.a0;s.a=this.a;s.t0=this.t0;return s};F.prototype.GetTransform=function(s,C){if(C===undefined)C=0;s.position.x=(1-C)*this.c0.x+
C*this.c.x;s.position.y=(1-C)*this.c0.y+C*this.c.y;s.R.Set((1-C)*this.a0+C*this.a);var R=s.R;s.position.x-=R.col1.x*this.localCenter.x+R.col2.x*this.localCenter.y;s.position.y-=R.col1.y*this.localCenter.x+R.col2.y*this.localCenter.y};F.prototype.Advance=function(s){if(s===undefined)s=0;if(this.t0<s&&1-this.t0>Number.MIN_VALUE){var C=(s-this.t0)/(1-this.t0);this.c0.x=(1-C)*this.c0.x+C*this.c.x;this.c0.y=(1-C)*this.c0.y+C*this.c.y;this.a0=(1-C)*this.a0+C*this.a;this.t0=s}};G.b2Transform=function(){this.position=
new A;this.R=new L};G.prototype.b2Transform=function(s,C){if(s===undefined)s=null;if(C===undefined)C=null;if(s){this.position.SetV(s);this.R.SetM(C)}};G.prototype.Initialize=function(s,C){this.position.SetV(s);this.R.SetM(C)};G.prototype.SetIdentity=function(){this.position.SetZero();this.R.SetIdentity()};G.prototype.Set=function(s){this.position.SetV(s.position);this.R.SetM(s.R)};G.prototype.GetAngle=function(){return Math.atan2(this.R.col1.y,this.R.col1.x)};A.b2Vec2=function(){};A.prototype.b2Vec2=
function(s,C){if(s===undefined)s=0;if(C===undefined)C=0;this.x=s;this.y=C};A.prototype.SetZero=function(){this.y=this.x=0};A.prototype.Set=function(s,C){if(s===undefined)s=0;if(C===undefined)C=0;this.x=s;this.y=C};A.prototype.SetV=function(s){this.x=s.x;this.y=s.y};A.prototype.GetNegative=function(){return new A(-this.x,-this.y)};A.prototype.NegativeSelf=function(){this.x=-this.x;this.y=-this.y};A.prototype.Make=function(s,C){if(s===undefined)s=0;if(C===undefined)C=0;return new A(s,C)};A.Make=A.prototype.Make;
A.prototype.Copy=function(){return new A(this.x,this.y)};A.prototype.Add=function(s){this.x+=s.x;this.y+=s.y};A.prototype.Subtract=function(s){this.x-=s.x;this.y-=s.y};A.prototype.Multiply=function(s){if(s===undefined)s=0;this.x*=s;this.y*=s};A.prototype.MulM=function(s){var C=this.x;this.x=s.col1.x*C+s.col2.x*this.y;this.y=s.col1.y*C+s.col2.y*this.y};A.prototype.MulTM=function(s){var C=H.Dot(this,s.col1);this.y=H.Dot(this,s.col2);this.x=C};A.prototype.CrossVF=function(s){if(s===undefined)s=0;var C=
this.x;this.x=s*this.y;this.y=-s*C};A.prototype.CrossFV=function(s){if(s===undefined)s=0;var C=this.x;this.x=-s*this.y;this.y=s*C};A.prototype.MinV=function(s){this.x=this.x<s.x?this.x:s.x;this.y=this.y<s.y?this.y:s.y};A.prototype.MaxV=function(s){this.x=this.x>s.x?this.x:s.x;this.y=this.y>s.y?this.y:s.y};A.prototype.Abs=function(){if(this.x<0)this.x=-this.x;if(this.y<0)this.y=-this.y};A.prototype.Length=function(){return Math.sqrt(this.x*this.x+this.y*this.y)};A.prototype.LengthSquared=function(){return this.x*
this.x+this.y*this.y};A.prototype.Normalize=function(){var s=Math.sqrt(this.x*this.x+this.y*this.y);if(s<Number.MIN_VALUE)return 0;var C=1/s;this.x*=C;this.y*=C;return s};A.prototype.IsValid=function(){return H.IsValid(this.x)&&H.IsValid(this.y)};N.b2Vec3=function(){};N.prototype.b2Vec3=function(s,C,R){if(s===undefined)s=0;if(C===undefined)C=0;if(R===undefined)R=0;this.x=s;this.y=C;this.z=R};N.prototype.SetZero=function(){this.x=this.y=this.z=0};N.prototype.Set=function(s,C,R){if(s===undefined)s=
0;if(C===undefined)C=0;if(R===undefined)R=0;this.x=s;this.y=C;this.z=R};N.prototype.SetV=function(s){this.x=s.x;this.y=s.y;this.z=s.z};N.prototype.GetNegative=function(){return new N(-this.x,-this.y,-this.z)};N.prototype.NegativeSelf=function(){this.x=-this.x;this.y=-this.y;this.z=-this.z};N.prototype.Copy=function(){return new N(this.x,this.y,this.z)};N.prototype.Add=function(s){this.x+=s.x;this.y+=s.y;this.z+=s.z};N.prototype.Subtract=function(s){this.x-=s.x;this.y-=s.y;this.z-=s.z};N.prototype.Multiply=
function(s){if(s===undefined)s=0;this.x*=s;this.y*=s;this.z*=s}})();
(function(){var L=Box2D.Common.Math.b2Math,I=Box2D.Common.Math.b2Sweep,H=Box2D.Common.Math.b2Transform,F=Box2D.Common.Math.b2Vec2,G=Box2D.Common.b2Color,A=Box2D.Common.b2Settings,N=Box2D.Collision.b2AABB,s=Box2D.Collision.b2ContactPoint,C=Box2D.Collision.b2DynamicTreeBroadPhase,R=Box2D.Collision.b2RayCastInput,aa=Box2D.Collision.b2RayCastOutput,$=Box2D.Collision.Shapes.b2CircleShape,T=Box2D.Collision.Shapes.b2EdgeShape,Q=Box2D.Collision.Shapes.b2MassData,X=Box2D.Collision.Shapes.b2PolygonShape,da=
Box2D.Collision.Shapes.b2Shape,j=Box2D.Dynamics.b2Body,y=Box2D.Dynamics.b2BodyDef,x=Box2D.Dynamics.b2ContactFilter,J=Box2D.Dynamics.b2ContactImpulse,M=Box2D.Dynamics.b2ContactListener,U=Box2D.Dynamics.b2ContactManager,K=Box2D.Dynamics.b2DebugDraw,ba=Box2D.Dynamics.b2DestructionListener,V=Box2D.Dynamics.b2FilterData,Z=Box2D.Dynamics.b2Fixture,ga=Box2D.Dynamics.b2FixtureDef,fa=Box2D.Dynamics.b2Island,c=Box2D.Dynamics.b2TimeStep,g=Box2D.Dynamics.b2World,k=Box2D.Dynamics.Contacts.b2Contact,h=Box2D.Dynamics.Contacts.b2ContactFactory,
o=Box2D.Dynamics.Contacts.b2ContactSolver,r=Box2D.Dynamics.Joints.b2Joint,l=Box2D.Dynamics.Joints.b2PulleyJoint;j=Box2D.Dynamics.b2Body;y=Box2D.Dynamics.b2BodyDef;x=Box2D.Dynamics.b2ContactFilter;J=Box2D.Dynamics.b2ContactImpulse;M=Box2D.Dynamics.b2ContactListener;U=Box2D.Dynamics.b2ContactManager;K=Box2D.Dynamics.b2DebugDraw;ba=Box2D.Dynamics.b2DestructionListener;V=Box2D.Dynamics.b2FilterData;Z=Box2D.Dynamics.b2Fixture;ga=Box2D.Dynamics.b2FixtureDef;fa=Box2D.Dynamics.b2Island;c=Box2D.Dynamics.b2TimeStep;
g=Box2D.Dynamics.b2World;j.b2Body=function(){this.m_xf=new H;this.m_sweep=new I;this.m_linearVelocity=new F;this.m_force=new F};j.prototype.connectEdges=function(a,b,f){if(f===undefined)f=0;var m=Math.atan2(b.GetDirectionVector().y,b.GetDirectionVector().x);f=L.MulFV(Math.tan((m-f)*0.5),b.GetDirectionVector());f=L.SubtractVV(f,b.GetNormalVector());f=L.MulFV(A.b2_toiSlop,f);f=L.AddVV(f,b.GetVertex1());var p=L.AddVV(a.GetDirectionVector(),b.GetDirectionVector());p.Normalize();var D=L.Dot(a.GetDirectionVector(),
b.GetNormalVector())>0;a.SetNextEdge(b,f,p,D);b.SetPrevEdge(a,f,p,D);return m};j.prototype.CreateFixture=function(a){if(this.m_world.IsLocked()==true)return null;var b=new Z;b.Create(this,this.m_xf,a);this.m_flags&j.e_activeFlag&&b.CreateProxy(this.m_world.m_contactManager.m_broadPhase,this.m_xf);b.m_next=this.m_fixtureList;this.m_fixtureList=b;++this.m_fixtureCount;b.m_body=this;b.m_density>0&&this.ResetMassData();this.m_world.m_flags|=g.e_newFixture;return b};j.prototype.CreateFixture2=function(a,
b){if(b===undefined)b=0;var f=new ga;f.shape=a;f.density=b;return this.CreateFixture(f)};j.prototype.DestroyFixture=function(a){if(this.m_world.IsLocked()!=true){for(var b=this.m_fixtureList,f=null;b!=null;){if(b==a){if(f)f.m_next=a.m_next;else this.m_fixtureList=a.m_next;break}f=b;b=b.m_next}for(b=this.m_contactList;b;){f=b.contact;b=b.next;var m=f.GetFixtureA(),p=f.GetFixtureB();if(a==m||a==p)this.m_world.m_contactManager.Destroy(f)}this.m_flags&j.e_activeFlag&&a.DestroyProxy(this.m_world.m_contactManager.m_broadPhase);
a.Destroy();a.m_body=null;a.m_next=null;--this.m_fixtureCount;this.ResetMassData()}};j.prototype.SetPositionAndAngle=function(a,b){if(b===undefined)b=0;var f;if(this.m_world.IsLocked()!=true){this.m_xf.R.Set(b);this.m_xf.position.SetV(a);f=this.m_xf.R;var m=this.m_sweep.localCenter;this.m_sweep.c.x=f.col1.x*m.x+f.col2.x*m.y;this.m_sweep.c.y=f.col1.y*m.x+f.col2.y*m.y;this.m_sweep.c.x+=this.m_xf.position.x;this.m_sweep.c.y+=this.m_xf.position.y;this.m_sweep.c0.SetV(this.m_sweep.c);this.m_sweep.a0=this.m_sweep.a=
b;m=this.m_world.m_contactManager.m_broadPhase;for(f=this.m_fixtureList;f;f=f.m_next)f.Synchronize(m,this.m_xf,this.m_xf);this.m_world.m_contactManager.FindNewContacts()}};j.prototype.SetTransform=function(a){this.SetPositionAndAngle(a.position,a.GetAngle())};j.prototype.GetTransform=function(){return this.m_xf};j.prototype.GetPosition=function(){return this.m_xf.position};j.prototype.SetPosition=function(a){this.SetPositionAndAngle(a,this.GetAngle())};j.prototype.GetAngle=function(){return this.m_sweep.a};
j.prototype.SetAngle=function(a){if(a===undefined)a=0;this.SetPositionAndAngle(this.GetPosition(),a)};j.prototype.GetWorldCenter=function(){return this.m_sweep.c};j.prototype.GetLocalCenter=function(){return this.m_sweep.localCenter};j.prototype.SetLinearVelocity=function(a){this.m_type!=j.b2_staticBody&&this.m_linearVelocity.SetV(a)};j.prototype.GetLinearVelocity=function(){return this.m_linearVelocity};j.prototype.SetAngularVelocity=function(a){if(a===undefined)a=0;if(this.m_type!=j.b2_staticBody)this.m_angularVelocity=
a};j.prototype.GetAngularVelocity=function(){return this.m_angularVelocity};j.prototype.GetDefinition=function(){var a=new y;a.type=this.GetType();a.allowSleep=(this.m_flags&j.e_allowSleepFlag)==j.e_allowSleepFlag;a.angle=this.GetAngle();a.angularDamping=this.m_angularDamping;a.angularVelocity=this.m_angularVelocity;a.fixedRotation=(this.m_flags&j.e_fixedRotationFlag)==j.e_fixedRotationFlag;a.bullet=(this.m_flags&j.e_bulletFlag)==j.e_bulletFlag;a.awake=(this.m_flags&j.e_awakeFlag)==j.e_awakeFlag;
a.linearDamping=this.m_linearDamping;a.linearVelocity.SetV(this.GetLinearVelocity());a.position=this.GetPosition();a.userData=this.GetUserData();return a};j.prototype.ApplyForce=function(a,b){if(this.m_type==j.b2_dynamicBody){this.IsAwake()==false&&this.SetAwake(true);this.m_force.x+=a.x;this.m_force.y+=a.y;this.m_torque+=(b.x-this.m_sweep.c.x)*a.y-(b.y-this.m_sweep.c.y)*a.x}};j.prototype.ApplyTorque=function(a){if(a===undefined)a=0;if(this.m_type==j.b2_dynamicBody){this.IsAwake()==false&&this.SetAwake(true);
this.m_torque+=a}};j.prototype.ApplyImpulse=function(a,b){if(this.m_type==j.b2_dynamicBody){this.IsAwake()==false&&this.SetAwake(true);this.m_linearVelocity.x+=this.m_invMass*a.x;this.m_linearVelocity.y+=this.m_invMass*a.y;this.m_angularVelocity+=this.m_invI*((b.x-this.m_sweep.c.x)*a.y-(b.y-this.m_sweep.c.y)*a.x)}};j.prototype.Split=function(a){for(var b=this.GetLinearVelocity().Copy(),f=this.GetAngularVelocity(),m=this.GetWorldCenter(),p=this.m_world.CreateBody(this.GetDefinition()),D,B=this.m_fixtureList;B;)if(a(B)){var O=
B.m_next;if(D)D.m_next=O;else this.m_fixtureList=O;this.m_fixtureCount--;B.m_next=p.m_fixtureList;p.m_fixtureList=B;p.m_fixtureCount++;B.m_body=p;B=O}else{D=B;B=B.m_next}this.ResetMassData();p.ResetMassData();D=this.GetWorldCenter();a=p.GetWorldCenter();D=L.AddVV(b,L.CrossFV(f,L.SubtractVV(D,m)));b=L.AddVV(b,L.CrossFV(f,L.SubtractVV(a,m)));this.SetLinearVelocity(D);p.SetLinearVelocity(b);this.SetAngularVelocity(f);p.SetAngularVelocity(f);this.SynchronizeFixtures();p.SynchronizeFixtures();return p};
j.prototype.Merge=function(a){var b;for(b=a.m_fixtureList;b;){var f=b.m_next;a.m_fixtureCount--;b.m_next=this.m_fixtureList;this.m_fixtureList=b;this.m_fixtureCount++;b.m_body=p;b=f}m.m_fixtureCount=0;var m=this,p=a;m.GetWorldCenter();p.GetWorldCenter();m.GetLinearVelocity().Copy();p.GetLinearVelocity().Copy();m.GetAngularVelocity();p.GetAngularVelocity();m.ResetMassData();this.SynchronizeFixtures()};j.prototype.GetMass=function(){return this.m_mass};j.prototype.GetInertia=function(){return this.m_I};
j.prototype.GetMassData=function(a){a.mass=this.m_mass;a.I=this.m_I;a.center.SetV(this.m_sweep.localCenter)};j.prototype.SetMassData=function(a){A.b2Assert(this.m_world.IsLocked()==false);if(this.m_world.IsLocked()!=true)if(this.m_type==j.b2_dynamicBody){this.m_invI=this.m_I=this.m_invMass=0;this.m_mass=a.mass;if(this.m_mass<=0)this.m_mass=1;this.m_invMass=1/this.m_mass;if(a.I>0&&(this.m_flags&j.e_fixedRotationFlag)==0){this.m_I=a.I-this.m_mass*(a.center.x*a.center.x+a.center.y*a.center.y);this.m_invI=
1/this.m_I}var b=this.m_sweep.c.Copy();this.m_sweep.localCenter.SetV(a.center);this.m_sweep.c0.SetV(L.MulX(this.m_xf,this.m_sweep.localCenter));this.m_sweep.c.SetV(this.m_sweep.c0);this.m_linearVelocity.x+=this.m_angularVelocity*-(this.m_sweep.c.y-b.y);this.m_linearVelocity.y+=this.m_angularVelocity*+(this.m_sweep.c.x-b.x)}};j.prototype.ResetMassData=function(){this.m_invI=this.m_I=this.m_invMass=this.m_mass=0;this.m_sweep.localCenter.SetZero();if(!(this.m_type==j.b2_staticBody||this.m_type==j.b2_kinematicBody)){for(var a=
F.Make(0,0),b=this.m_fixtureList;b;b=b.m_next)if(b.m_density!=0){var f=b.GetMassData();this.m_mass+=f.mass;a.x+=f.center.x*f.mass;a.y+=f.center.y*f.mass;this.m_I+=f.I}if(this.m_mass>0){this.m_invMass=1/this.m_mass;a.x*=this.m_invMass;a.y*=this.m_invMass}else this.m_invMass=this.m_mass=1;if(this.m_I>0&&(this.m_flags&j.e_fixedRotationFlag)==0){this.m_I-=this.m_mass*(a.x*a.x+a.y*a.y);this.m_I*=this.m_inertiaScale;A.b2Assert(this.m_I>0);this.m_invI=1/this.m_I}else this.m_invI=this.m_I=0;b=this.m_sweep.c.Copy();
this.m_sweep.localCenter.SetV(a);this.m_sweep.c0.SetV(L.MulX(this.m_xf,this.m_sweep.localCenter));this.m_sweep.c.SetV(this.m_sweep.c0);this.m_linearVelocity.x+=this.m_angularVelocity*-(this.m_sweep.c.y-b.y);this.m_linearVelocity.y+=this.m_angularVelocity*+(this.m_sweep.c.x-b.x)}};j.prototype.GetWorldPoint=function(a){var b=this.m_xf.R;a=new F(b.col1.x*a.x+b.col2.x*a.y,b.col1.y*a.x+b.col2.y*a.y);a.x+=this.m_xf.position.x;a.y+=this.m_xf.position.y;return a};j.prototype.GetWorldVector=function(a){return L.MulMV(this.m_xf.R,
a)};j.prototype.GetLocalPoint=function(a){return L.MulXT(this.m_xf,a)};j.prototype.GetLocalVector=function(a){return L.MulTMV(this.m_xf.R,a)};j.prototype.GetLinearVelocityFromWorldPoint=function(a){return new F(this.m_linearVelocity.x-this.m_angularVelocity*(a.y-this.m_sweep.c.y),this.m_linearVelocity.y+this.m_angularVelocity*(a.x-this.m_sweep.c.x))};j.prototype.GetLinearVelocityFromLocalPoint=function(a){var b=this.m_xf.R;a=new F(b.col1.x*a.x+b.col2.x*a.y,b.col1.y*a.x+b.col2.y*a.y);a.x+=this.m_xf.position.x;
a.y+=this.m_xf.position.y;return new F(this.m_linearVelocity.x-this.m_angularVelocity*(a.y-this.m_sweep.c.y),this.m_linearVelocity.y+this.m_angularVelocity*(a.x-this.m_sweep.c.x))};j.prototype.GetLinearDamping=function(){return this.m_linearDamping};j.prototype.SetLinearDamping=function(a){if(a===undefined)a=0;this.m_linearDamping=a};j.prototype.GetAngularDamping=function(){return this.m_angularDamping};j.prototype.SetAngularDamping=function(a){if(a===undefined)a=0;this.m_angularDamping=a};j.prototype.SetType=
function(a){if(a===undefined)a=0;if(this.m_type!=a){this.m_type=a;this.ResetMassData();if(this.m_type==j.b2_staticBody){this.m_linearVelocity.SetZero();this.m_angularVelocity=0}this.SetAwake(true);this.m_force.SetZero();this.m_torque=0;for(a=this.m_contactList;a;a=a.next)a.contact.FlagForFiltering()}};j.prototype.GetType=function(){return this.m_type};j.prototype.SetBullet=function(a){if(a)this.m_flags|=j.e_bulletFlag;else this.m_flags&=~j.e_bulletFlag};j.prototype.IsBullet=function(){return(this.m_flags&
j.e_bulletFlag)==j.e_bulletFlag};j.prototype.SetSleepingAllowed=function(a){if(a)this.m_flags|=j.e_allowSleepFlag;else{this.m_flags&=~j.e_allowSleepFlag;this.SetAwake(true)}};j.prototype.SetAwake=function(a){if(a){this.m_flags|=j.e_awakeFlag;this.m_sleepTime=0}else{this.m_flags&=~j.e_awakeFlag;this.m_sleepTime=0;this.m_linearVelocity.SetZero();this.m_angularVelocity=0;this.m_force.SetZero();this.m_torque=0}};j.prototype.IsAwake=function(){return(this.m_flags&j.e_awakeFlag)==j.e_awakeFlag};j.prototype.SetFixedRotation=
function(a){if(a)this.m_flags|=j.e_fixedRotationFlag;else this.m_flags&=~j.e_fixedRotationFlag;this.ResetMassData()};j.prototype.IsFixedRotation=function(){return(this.m_flags&j.e_fixedRotationFlag)==j.e_fixedRotationFlag};j.prototype.SetActive=function(a){if(a!=this.IsActive()){var b;if(a){this.m_flags|=j.e_activeFlag;a=this.m_world.m_contactManager.m_broadPhase;for(b=this.m_fixtureList;b;b=b.m_next)b.CreateProxy(a,this.m_xf)}else{this.m_flags&=~j.e_activeFlag;a=this.m_world.m_contactManager.m_broadPhase;
for(b=this.m_fixtureList;b;b=b.m_next)b.DestroyProxy(a);for(a=this.m_contactList;a;){b=a;a=a.next;this.m_world.m_contactManager.Destroy(b.contact)}this.m_contactList=null}}};j.prototype.IsActive=function(){return(this.m_flags&j.e_activeFlag)==j.e_activeFlag};j.prototype.IsSleepingAllowed=function(){return(this.m_flags&j.e_allowSleepFlag)==j.e_allowSleepFlag};j.prototype.GetFixtureList=function(){return this.m_fixtureList};j.prototype.GetJointList=function(){return this.m_jointList};j.prototype.GetControllerList=
function(){return this.m_controllerList};j.prototype.GetContactList=function(){return this.m_contactList};j.prototype.GetNext=function(){return this.m_next};j.prototype.GetUserData=function(){return this.m_userData};j.prototype.SetUserData=function(a){this.m_userData=a};j.prototype.GetWorld=function(){return this.m_world};j.prototype.b2Body=function(a,b){this.m_flags=0;if(a.bullet)this.m_flags|=j.e_bulletFlag;if(a.fixedRotation)this.m_flags|=j.e_fixedRotationFlag;if(a.allowSleep)this.m_flags|=j.e_allowSleepFlag;
if(a.awake)this.m_flags|=j.e_awakeFlag;if(a.active)this.m_flags|=j.e_activeFlag;this.m_world=b;this.m_xf.position.SetV(a.position);this.m_xf.R.Set(a.angle);this.m_sweep.localCenter.SetZero();this.m_sweep.t0=1;this.m_sweep.a0=this.m_sweep.a=a.angle;var f=this.m_xf.R,m=this.m_sweep.localCenter;this.m_sweep.c.x=f.col1.x*m.x+f.col2.x*m.y;this.m_sweep.c.y=f.col1.y*m.x+f.col2.y*m.y;this.m_sweep.c.x+=this.m_xf.position.x;this.m_sweep.c.y+=this.m_xf.position.y;this.m_sweep.c0.SetV(this.m_sweep.c);this.m_contactList=
this.m_controllerList=this.m_jointList=null;this.m_controllerCount=0;this.m_next=this.m_prev=null;this.m_linearVelocity.SetV(a.linearVelocity);this.m_angularVelocity=a.angularVelocity;this.m_linearDamping=a.linearDamping;this.m_angularDamping=a.angularDamping;this.m_force.Set(0,0);this.m_sleepTime=this.m_torque=0;this.m_type=a.type;if(this.m_type==j.b2_dynamicBody)this.m_invMass=this.m_mass=1;else this.m_invMass=this.m_mass=0;this.m_invI=this.m_I=0;this.m_inertiaScale=a.inertiaScale;this.m_userData=
a.userData;this.m_fixtureList=null;this.m_fixtureCount=0};j.prototype.SynchronizeFixtures=function(){var a=j.s_xf1;a.R.Set(this.m_sweep.a0);var b=a.R,f=this.m_sweep.localCenter;a.position.x=this.m_sweep.c0.x-(b.col1.x*f.x+b.col2.x*f.y);a.position.y=this.m_sweep.c0.y-(b.col1.y*f.x+b.col2.y*f.y);f=this.m_world.m_contactManager.m_broadPhase;for(b=this.m_fixtureList;b;b=b.m_next)b.Synchronize(f,a,this.m_xf)};j.prototype.SynchronizeTransform=function(){this.m_xf.R.Set(this.m_sweep.a);var a=this.m_xf.R,
b=this.m_sweep.localCenter;this.m_xf.position.x=this.m_sweep.c.x-(a.col1.x*b.x+a.col2.x*b.y);this.m_xf.position.y=this.m_sweep.c.y-(a.col1.y*b.x+a.col2.y*b.y)};j.prototype.ShouldCollide=function(a){if(this.m_type!=j.b2_dynamicBody&&a.m_type!=j.b2_dynamicBody)return false;for(var b=this.m_jointList;b;b=b.next)if(b.other==a)if(b.joint.m_collideConnected==false)return false;return true};j.prototype.Advance=function(a){if(a===undefined)a=0;this.m_sweep.Advance(a);this.m_sweep.c.SetV(this.m_sweep.c0);
this.m_sweep.a=this.m_sweep.a0;this.SynchronizeTransform()};_A2J_postDefs.push(function(){Box2D.Dynamics.b2Body.s_xf1=new H;Box2D.Dynamics.b2Body.prototype.s_xf1=Box2D.Dynamics.b2Body.s_xf1;Box2D.Dynamics.b2Body.e_islandFlag=1;Box2D.Dynamics.b2Body.prototype.e_islandFlag=Box2D.Dynamics.b2Body.e_islandFlag;Box2D.Dynamics.b2Body.e_awakeFlag=2;Box2D.Dynamics.b2Body.prototype.e_awakeFlag=Box2D.Dynamics.b2Body.e_awakeFlag;Box2D.Dynamics.b2Body.e_allowSleepFlag=4;Box2D.Dynamics.b2Body.prototype.e_allowSleepFlag=
Box2D.Dynamics.b2Body.e_allowSleepFlag;Box2D.Dynamics.b2Body.e_bulletFlag=8;Box2D.Dynamics.b2Body.prototype.e_bulletFlag=Box2D.Dynamics.b2Body.e_bulletFlag;Box2D.Dynamics.b2Body.e_fixedRotationFlag=16;Box2D.Dynamics.b2Body.prototype.e_fixedRotationFlag=Box2D.Dynamics.b2Body.e_fixedRotationFlag;Box2D.Dynamics.b2Body.e_activeFlag=32;Box2D.Dynamics.b2Body.prototype.e_activeFlag=Box2D.Dynamics.b2Body.e_activeFlag;Box2D.Dynamics.b2Body.b2_staticBody=0;Box2D.Dynamics.b2Body.prototype.b2_staticBody=Box2D.Dynamics.b2Body.b2_staticBody;
Box2D.Dynamics.b2Body.b2_kinematicBody=1;Box2D.Dynamics.b2Body.prototype.b2_kinematicBody=Box2D.Dynamics.b2Body.b2_kinematicBody;Box2D.Dynamics.b2Body.b2_dynamicBody=2;Box2D.Dynamics.b2Body.prototype.b2_dynamicBody=Box2D.Dynamics.b2Body.b2_dynamicBody});y.b2BodyDef=function(){this.position=new F;this.linearVelocity=new F};y.prototype.b2BodyDef=function(){this.userData=null;this.position.Set(0,0);this.angle=0;this.linearVelocity.Set(0,0);this.angularDamping=this.linearDamping=this.angularVelocity=
0;this.awake=this.allowSleep=true;this.bullet=this.fixedRotation=false;this.type=j.b2_staticBody;this.active=true;this.inertiaScale=1};x.b2ContactFilter=function(){};x.prototype.ShouldCollide=function(a,b){var f=a.GetFilterData(),m=b.GetFilterData();if(f.groupIndex==m.groupIndex&&f.groupIndex!=0)return f.groupIndex>0;return(f.maskBits&m.categoryBits)!=0&&(f.categoryBits&m.maskBits)!=0};x.prototype.RayCollide=function(a,b){if(!a)return true;return this.ShouldCollide(a instanceof Z?a:null,b)};_A2J_postDefs.push(function(){Box2D.Dynamics.b2ContactFilter.b2_defaultFilter=
new x;Box2D.Dynamics.b2ContactFilter.prototype.b2_defaultFilter=Box2D.Dynamics.b2ContactFilter.b2_defaultFilter});J.b2ContactImpulse=function(){this.normalImpulses=new Vector_a2j_Number(A.b2_maxManifoldPoints);this.tangentImpulses=new Vector_a2j_Number(A.b2_maxManifoldPoints)};M.b2ContactListener=function(){};M.prototype.BeginContact=function(){};M.prototype.EndContact=function(){};M.prototype.PreSolve=function(){};M.prototype.PostSolve=function(){};_A2J_postDefs.push(function(){Box2D.Dynamics.b2ContactListener.b2_defaultListener=
new M;Box2D.Dynamics.b2ContactListener.prototype.b2_defaultListener=Box2D.Dynamics.b2ContactListener.b2_defaultListener});U.b2ContactManager=function(){};U.prototype.b2ContactManager=function(){this.m_world=null;this.m_contactCount=0;this.m_contactFilter=x.b2_defaultFilter;this.m_contactListener=M.b2_defaultListener;this.m_contactFactory=new h(this.m_allocator);this.m_broadPhase=new C};U.prototype.AddPair=function(a,b){var f=a instanceof Z?a:null,m=b instanceof Z?b:null,p=f.GetBody(),D=m.GetBody();
if(p!=D){for(var B=D.GetContactList();B;){if(B.other==p){var O=B.contact.GetFixtureA(),W=B.contact.GetFixtureB();if(O==f&&W==m)return;if(O==m&&W==f)return}B=B.next}if(D.ShouldCollide(p)!=false)if(this.m_contactFilter.ShouldCollide(f,m)!=false){B=this.m_contactFactory.Create(f,m);f=B.GetFixtureA();m=B.GetFixtureB();p=f.m_body;D=m.m_body;B.m_prev=null;B.m_next=this.m_world.m_contactList;if(this.m_world.m_contactList!=null)this.m_world.m_contactList.m_prev=B;this.m_world.m_contactList=B;B.m_nodeA.contact=
B;B.m_nodeA.other=D;B.m_nodeA.prev=null;B.m_nodeA.next=p.m_contactList;if(p.m_contactList!=null)p.m_contactList.prev=B.m_nodeA;p.m_contactList=B.m_nodeA;B.m_nodeB.contact=B;B.m_nodeB.other=p;B.m_nodeB.prev=null;B.m_nodeB.next=D.m_contactList;if(D.m_contactList!=null)D.m_contactList.prev=B.m_nodeB;D.m_contactList=B.m_nodeB;++this.m_world.m_contactCount}}};U.prototype.FindNewContacts=function(){this.m_broadPhase.UpdatePairs(a2j.generateCallback(this,this.AddPair))};U.prototype.Destroy=function(a){var b=
a.GetFixtureA(),f=a.GetFixtureB();b=b.GetBody();f=f.GetBody();a.IsTouching()&&this.m_contactListener.EndContact(a);if(a.m_prev)a.m_prev.m_next=a.m_next;if(a.m_next)a.m_next.m_prev=a.m_prev;if(a==this.m_world.m_contactList)this.m_world.m_contactList=a.m_next;if(a.m_nodeA.prev)a.m_nodeA.prev.next=a.m_nodeA.next;if(a.m_nodeA.next)a.m_nodeA.next.prev=a.m_nodeA.prev;if(a.m_nodeA==b.m_contactList)b.m_contactList=a.m_nodeA.next;if(a.m_nodeB.prev)a.m_nodeB.prev.next=a.m_nodeB.next;if(a.m_nodeB.next)a.m_nodeB.next.prev=
a.m_nodeB.prev;if(a.m_nodeB==f.m_contactList)f.m_contactList=a.m_nodeB.next;this.m_contactFactory.Destroy(a);--this.m_contactCount};U.prototype.Collide=function(){for(var a=this.m_world.m_contactList;a;){var b=a.GetFixtureA(),f=a.GetFixtureB(),m=b.GetBody(),p=f.GetBody();if(m.IsAwake()==false&&p.IsAwake()==false)a=a.GetNext();else{if(a.m_flags&k.e_filterFlag){if(p.ShouldCollide(m)==false){b=a;a=b.GetNext();this.Destroy(b);continue}if(this.m_contactFilter.ShouldCollide(b,f)==false){b=a;a=b.GetNext();
this.Destroy(b);continue}a.m_flags&=~k.e_filterFlag}if(this.m_broadPhase.TestOverlap(b.m_proxy,f.m_proxy)==false){b=a;a=b.GetNext();this.Destroy(b)}else{a.Update(this.m_contactListener);a=a.GetNext()}}}};_A2J_postDefs.push(function(){Box2D.Dynamics.b2ContactManager.s_evalCP=new s;Box2D.Dynamics.b2ContactManager.prototype.s_evalCP=Box2D.Dynamics.b2ContactManager.s_evalCP});K.b2DebugDraw=function(){};K.prototype.b2DebugDraw=function(){m_drawFlags=0};K.prototype.SetFlags=function(){};K.prototype.GetFlags=
function(){};K.prototype.AppendFlags=function(){};K.prototype.ClearFlags=function(){};K.prototype.SetSprite=function(){};K.prototype.GetSprite=function(){};K.prototype.SetDrawScale=function(){};K.prototype.GetDrawScale=function(){};K.prototype.SetLineThickness=function(){};K.prototype.GetLineThickness=function(){};K.prototype.SetAlpha=function(){};K.prototype.GetAlpha=function(){};K.prototype.SetFillAlpha=function(){};K.prototype.GetFillAlpha=function(){};K.prototype.SetXFormScale=function(){};K.prototype.GetXFormScale=
function(){};K.prototype.DrawPolygon=function(){};K.prototype.DrawSolidPolygon=function(){};K.prototype.DrawCircle=function(){};K.prototype.DrawSolidCircle=function(){};K.prototype.DrawSegment=function(){};K.prototype.DrawTransform=function(){};_A2J_postDefs.push(function(){Box2D.Dynamics.b2DebugDraw.e_shapeBit=1;Box2D.Dynamics.b2DebugDraw.prototype.e_shapeBit=Box2D.Dynamics.b2DebugDraw.e_shapeBit;Box2D.Dynamics.b2DebugDraw.e_jointBit=2;Box2D.Dynamics.b2DebugDraw.prototype.e_jointBit=Box2D.Dynamics.b2DebugDraw.e_jointBit;
Box2D.Dynamics.b2DebugDraw.e_aabbBit=4;Box2D.Dynamics.b2DebugDraw.prototype.e_aabbBit=Box2D.Dynamics.b2DebugDraw.e_aabbBit;Box2D.Dynamics.b2DebugDraw.e_pairBit=8;Box2D.Dynamics.b2DebugDraw.prototype.e_pairBit=Box2D.Dynamics.b2DebugDraw.e_pairBit;Box2D.Dynamics.b2DebugDraw.e_centerOfMassBit=16;Box2D.Dynamics.b2DebugDraw.prototype.e_centerOfMassBit=Box2D.Dynamics.b2DebugDraw.e_centerOfMassBit;Box2D.Dynamics.b2DebugDraw.e_controllerBit=32;Box2D.Dynamics.b2DebugDraw.prototype.e_controllerBit=Box2D.Dynamics.b2DebugDraw.e_controllerBit});
ba.b2DestructionListener=function(){};ba.prototype.SayGoodbyeJoint=function(){};ba.prototype.SayGoodbyeFixture=function(){};V.b2FilterData=function(){this.categoryBits=1;this.maskBits=65535;this.groupIndex=0};V.prototype.Copy=function(){var a=new V;a.categoryBits=this.categoryBits;a.maskBits=this.maskBits;a.groupIndex=this.groupIndex;return a};Z.b2Fixture=function(){this.m_filter=new V};Z.prototype.GetType=function(){return this.m_shape.GetType()};Z.prototype.GetShape=function(){return this.m_shape};
Z.prototype.SetSensor=function(a){if(this.m_isSensor!=a){this.m_isSensor=a;if(this.m_body!=null)for(a=this.m_body.GetContactList();a;){var b=a.contact,f=b.GetFixtureA(),m=b.GetFixtureB();if(f==this||m==this)b.SetSensor(f.IsSensor()||m.IsSensor());a=a.next}}};Z.prototype.IsSensor=function(){return this.m_isSensor};Z.prototype.SetFilterData=function(a){this.m_filter=a.Copy();if(!this.m_body)for(a=this.m_body.GetContactList();a;){var b=a.contact,f=b.GetFixtureA(),m=b.GetFixtureB();if(f==this||m==this)b.FlagForFiltering();
a=a.next}};Z.prototype.GetFilterData=function(){return this.m_filter.Copy()};Z.prototype.GetBody=function(){return this.m_body};Z.prototype.GetNext=function(){return this.m_next};Z.prototype.GetUserData=function(){return this.m_userData};Z.prototype.SetUserData=function(a){this.m_userData=a};Z.prototype.TestPoint=function(a){return this.m_shape.TestPoint(this.m_body.GetTransform(),a)};Z.prototype.RayCast=function(a,b){return this.m_shape.RayCast(a,b,this.m_body.GetTransform())};Z.prototype.GetMassData=
function(a){if(a===undefined)a=null;if(a==null)a=new Q;this.m_shape.ComputeMass(a,this.m_density);return a};Z.prototype.SetDensity=function(a){if(a===undefined)a=0;this.m_density=a};Z.prototype.GetDensity=function(){return this.m_density};Z.prototype.GetFriction=function(){return this.m_friction};Z.prototype.SetFriction=function(a){if(a===undefined)a=0;this.m_friction=a};Z.prototype.GetRestitution=function(){return this.m_restitution};Z.prototype.SetRestitution=function(a){if(a===undefined)a=0;this.m_restitution=
a};Z.prototype.GetAABB=function(){return this.m_aabb};Z.prototype.b2Fixture=function(){this.m_aabb=new N;this.m_shape=this.m_next=this.m_body=this.m_userData=null;this.m_restitution=this.m_friction=this.m_density=0};Z.prototype.Create=function(a,b,f){this.m_userData=f.userData;this.m_friction=f.friction;this.m_restitution=f.restitution;this.m_body=a;this.m_next=null;this.m_filter=f.filter.Copy();this.m_isSensor=f.isSensor;this.m_shape=f.shape.Copy();this.m_density=f.density};Z.prototype.Destroy=function(){this.m_shape=
null};Z.prototype.CreateProxy=function(a,b){this.m_shape.ComputeAABB(this.m_aabb,b);this.m_proxy=a.CreateProxy(this.m_aabb,this)};Z.prototype.DestroyProxy=function(a){if(this.m_proxy!=null){a.DestroyProxy(this.m_proxy);this.m_proxy=null}};Z.prototype.Synchronize=function(a,b,f){if(this.m_proxy){var m=new N,p=new N;this.m_shape.ComputeAABB(m,b);this.m_shape.ComputeAABB(p,f);this.m_aabb.Combine(m,p);b=L.SubtractVV(f.position,b.position);a.MoveProxy(this.m_proxy,this.m_aabb,b)}};ga.b2FixtureDef=function(){this.filter=
new V};ga.prototype.b2FixtureDef=function(){this.userData=this.shape=null;this.friction=0.2;this.density=this.restitution=0;this.filter.categoryBits=1;this.filter.maskBits=65535;this.filter.groupIndex=0;this.isSensor=false};fa.b2Island=function(){};fa.prototype.b2Island=function(){this.m_bodies=new Vector;this.m_contacts=new Vector;this.m_joints=new Vector};fa.prototype.Initialize=function(a,b,f,m,p,D){if(a===undefined)a=0;if(b===undefined)b=0;if(f===undefined)f=0;var B=0;this.m_bodyCapacity=a;this.m_contactCapacity=
b;this.m_jointCapacity=f;this.m_jointCount=this.m_contactCount=this.m_bodyCount=0;this.m_allocator=m;this.m_listener=p;this.m_contactSolver=D;for(B=this.m_bodies.length;B<a;B++)this.m_bodies[B]=null;for(B=this.m_contacts.length;B<b;B++)this.m_contacts[B]=null;for(B=this.m_joints.length;B<f;B++)this.m_joints[B]=null};fa.prototype.Clear=function(){this.m_jointCount=this.m_contactCount=this.m_bodyCount=0};fa.prototype.Solve=function(a,b,f){var m=0,p=0,D;for(m=0;m<this.m_bodyCount;++m){p=this.m_bodies[m];
if(p.GetType()==j.b2_dynamicBody){p.m_linearVelocity.x+=a.dt*(b.x+p.m_invMass*p.m_force.x);p.m_linearVelocity.y+=a.dt*(b.y+p.m_invMass*p.m_force.y);p.m_angularVelocity+=a.dt*p.m_invI*p.m_torque;p.m_linearVelocity.Multiply(L.Clamp(1-a.dt*p.m_linearDamping,0,1));p.m_angularVelocity*=L.Clamp(1-a.dt*p.m_angularDamping,0,1)}}this.m_contactSolver.Initialize(a,this.m_contacts,this.m_contactCount,this.m_allocator);b=this.m_contactSolver;b.InitVelocityConstraints(a);for(m=0;m<this.m_jointCount;++m){D=this.m_joints[m];
D.InitVelocityConstraints(a)}for(m=0;m<a.velocityIterations;++m){for(p=0;p<this.m_jointCount;++p){D=this.m_joints[p];D.SolveVelocityConstraints(a)}b.SolveVelocityConstraints()}for(m=0;m<this.m_jointCount;++m){D=this.m_joints[m];D.FinalizeVelocityConstraints()}b.FinalizeVelocityConstraints();for(m=0;m<this.m_bodyCount;++m){p=this.m_bodies[m];if(p.GetType()!=j.b2_staticBody){var B=a.dt*p.m_linearVelocity.x,O=a.dt*p.m_linearVelocity.y;if(B*B+O*O>A.b2_maxTranslationSquared){p.m_linearVelocity.Normalize();
p.m_linearVelocity.x*=A.b2_maxTranslation*a.inv_dt;p.m_linearVelocity.y*=A.b2_maxTranslation*a.inv_dt}B=a.dt*p.m_angularVelocity;if(B*B>A.b2_maxRotationSquared)p.m_angularVelocity=p.m_angularVelocity<0?-A.b2_maxRotation*a.inv_dt:A.b2_maxRotation*a.inv_dt;p.m_sweep.c0.SetV(p.m_sweep.c);p.m_sweep.a0=p.m_sweep.a;p.m_sweep.c.x+=a.dt*p.m_linearVelocity.x;p.m_sweep.c.y+=a.dt*p.m_linearVelocity.y;p.m_sweep.a+=a.dt*p.m_angularVelocity;p.SynchronizeTransform()}}for(m=0;m<a.positionIterations;++m){B=b.SolvePositionConstraints(A.b2_contactBaumgarte);
O=true;for(p=0;p<this.m_jointCount;++p){D=this.m_joints[p];D=D.SolvePositionConstraints(A.b2_contactBaumgarte);O=O&&D}if(B&&O)break}this.Report(b.m_constraints);if(f){f=Number.MAX_VALUE;b=A.b2_linearSleepTolerance*A.b2_linearSleepTolerance;B=A.b2_angularSleepTolerance*A.b2_angularSleepTolerance;for(m=0;m<this.m_bodyCount;++m){p=this.m_bodies[m];if(p.GetType()!=j.b2_staticBody){if((p.m_flags&j.e_allowSleepFlag)==0)f=p.m_sleepTime=0;if((p.m_flags&j.e_allowSleepFlag)==0||p.m_angularVelocity*p.m_angularVelocity>
B||L.Dot(p.m_linearVelocity,p.m_linearVelocity)>b)f=p.m_sleepTime=0;else{p.m_sleepTime+=a.dt;f=L.Min(f,p.m_sleepTime)}}}if(f>=A.b2_timeToSleep)for(m=0;m<this.m_bodyCount;++m){p=this.m_bodies[m];p.SetAwake(false)}}};fa.prototype.SolveTOI=function(a){var b=0,f=0;this.m_contactSolver.Initialize(a,this.m_contacts,this.m_contactCount,this.m_allocator);var m=this.m_contactSolver;for(b=0;b<this.m_jointCount;++b)this.m_joints[b].InitVelocityConstraints(a);for(b=0;b<a.velocityIterations;++b){m.SolveVelocityConstraints();
for(f=0;f<this.m_jointCount;++f)this.m_joints[f].SolveVelocityConstraints(a)}for(b=0;b<this.m_bodyCount;++b){f=this.m_bodies[b];if(f.GetType()!=j.b2_staticBody){var p=a.dt*f.m_linearVelocity.x,D=a.dt*f.m_linearVelocity.y;if(p*p+D*D>A.b2_maxTranslationSquared){f.m_linearVelocity.Normalize();f.m_linearVelocity.x*=A.b2_maxTranslation*a.inv_dt;f.m_linearVelocity.y*=A.b2_maxTranslation*a.inv_dt}p=a.dt*f.m_angularVelocity;if(p*p>A.b2_maxRotationSquared)f.m_angularVelocity=f.m_angularVelocity<0?-A.b2_maxRotation*
a.inv_dt:A.b2_maxRotation*a.inv_dt;f.m_sweep.c0.SetV(f.m_sweep.c);f.m_sweep.a0=f.m_sweep.a;f.m_sweep.c.x+=a.dt*f.m_linearVelocity.x;f.m_sweep.c.y+=a.dt*f.m_linearVelocity.y;f.m_sweep.a+=a.dt*f.m_angularVelocity;f.SynchronizeTransform()}}for(b=0;b<a.positionIterations;++b){p=m.SolvePositionConstraints(0.75);D=true;for(f=0;f<this.m_jointCount;++f){var B=this.m_joints[f].SolvePositionConstraints(A.b2_contactBaumgarte);D=D&&B}if(p&&D)break}this.Report(m.m_constraints)};fa.prototype.Report=function(a){if(this.m_listener!=
null)for(var b=0;b<this.m_contactCount;++b){for(var f=this.m_contacts[b],m=a[b],p=0;p<m.pointCount;++p){fa.s_impulse.normalImpulses[p]=m.points[p].normalImpulse;fa.s_impulse.tangentImpulses[p]=m.points[p].tangentImpulse}this.m_listener.PostSolve(f,fa.s_impulse)}};fa.prototype.AddBody=function(a){a.m_islandIndex=this.m_bodyCount;this.m_bodies[this.m_bodyCount++]=a};fa.prototype.AddContact=function(a){this.m_contacts[this.m_contactCount++]=a};fa.prototype.AddJoint=function(a){this.m_joints[this.m_jointCount++]=
a};_A2J_postDefs.push(function(){Box2D.Dynamics.b2Island.s_impulse=new J;Box2D.Dynamics.b2Island.prototype.s_impulse=Box2D.Dynamics.b2Island.s_impulse});c.b2TimeStep=function(){};c.prototype.Set=function(a){this.dt=a.dt;this.inv_dt=a.inv_dt;this.positionIterations=a.positionIterations;this.velocityIterations=a.velocityIterations;this.warmStarting=a.warmStarting};g.b2World=function(){this.s_stack=new Vector;this.m_contactManager=new U;this.m_contactSolver=new o;this.m_island=new fa};g.prototype.b2World=
function(a,b){this.m_controllerList=this.m_jointList=this.m_contactList=this.m_bodyList=this.m_debugDraw=this.m_destructionListener=null;this.m_controllerCount=this.m_jointCount=this.m_contactCount=this.m_bodyCount=0;g.m_warmStarting=true;g.m_continuousPhysics=true;this.m_allowSleep=b;this.m_gravity=a;this.m_inv_dt0=0;this.m_contactManager.m_world=this;this.m_groundBody=this.CreateBody(new y)};g.prototype.SetDestructionListener=function(a){this.m_destructionListener=a};g.prototype.SetContactFilter=
function(a){this.m_contactManager.m_contactFilter=a};g.prototype.SetContactListener=function(a){this.m_contactManager.m_contactListener=a};g.prototype.SetDebugDraw=function(a){this.m_debugDraw=a};g.prototype.SetBroadPhase=function(a){var b=this.m_contactManager.m_broadPhase;this.m_contactManager.m_broadPhase=a;for(var f=this.m_bodyList;f;f=f.m_next)for(var m=f.m_fixtureList;m;m=m.m_next)m.m_proxy=a.CreateProxy(b.GetFatAABB(m.m_proxy),m)};g.prototype.Validate=function(){this.m_contactManager.m_broadPhase.Validate()};
g.prototype.GetProxyCount=function(){return this.m_contactManager.m_broadPhase.GetProxyCount()};g.prototype.CreateBody=function(a){if(this.IsLocked()==true)return null;a=new j(a,this);a.m_prev=null;if(a.m_next=this.m_bodyList)this.m_bodyList.m_prev=a;this.m_bodyList=a;++this.m_bodyCount;return a};g.prototype.DestroyBody=function(a){if(this.IsLocked()!=true){for(var b=a.m_jointList;b;){var f=b;b=b.next;this.m_destructionListener&&this.m_destructionListener.SayGoodbyeJoint(f.joint);this.DestroyJoint(f.joint)}for(b=
a.m_controllerList;b;){f=b;b=b.nextController;f.controller.RemoveBody(a)}for(b=a.m_contactList;b;){f=b;b=b.next;this.m_contactManager.Destroy(f.contact)}a.m_contactList=null;for(b=a.m_fixtureList;b;){f=b;b=b.m_next;this.m_destructionListener&&this.m_destructionListener.SayGoodbyeFixture(f);f.DestroyProxy(this.m_contactManager.m_broadPhase);f.Destroy()}a.m_fixtureList=null;a.m_fixtureCount=0;if(a.m_prev)a.m_prev.m_next=a.m_next;if(a.m_next)a.m_next.m_prev=a.m_prev;if(a==this.m_bodyList)this.m_bodyList=
a.m_next;--this.m_bodyCount}};g.prototype.CreateJoint=function(a){var b=r.Create(a,null);b.m_prev=null;if(b.m_next=this.m_jointList)this.m_jointList.m_prev=b;this.m_jointList=b;++this.m_jointCount;b.m_edgeA.joint=b;b.m_edgeA.other=b.m_bodyB;b.m_edgeA.prev=null;if(b.m_edgeA.next=b.m_bodyA.m_jointList)b.m_bodyA.m_jointList.prev=b.m_edgeA;b.m_bodyA.m_jointList=b.m_edgeA;b.m_edgeB.joint=b;b.m_edgeB.other=b.m_bodyA;b.m_edgeB.prev=null;if(b.m_edgeB.next=b.m_bodyB.m_jointList)b.m_bodyB.m_jointList.prev=
b.m_edgeB;b.m_bodyB.m_jointList=b.m_edgeB;var f=a.bodyA,m=a.bodyB;if(a.collideConnected==false)for(a=m.GetContactList();a;){a.other==f&&a.contact.FlagForFiltering();a=a.next}return b};g.prototype.DestroyJoint=function(a){var b=a.m_collideConnected;if(a.m_prev)a.m_prev.m_next=a.m_next;if(a.m_next)a.m_next.m_prev=a.m_prev;if(a==this.m_jointList)this.m_jointList=a.m_next;var f=a.m_bodyA,m=a.m_bodyB;f.SetAwake(true);m.SetAwake(true);if(a.m_edgeA.prev)a.m_edgeA.prev.next=a.m_edgeA.next;if(a.m_edgeA.next)a.m_edgeA.next.prev=
a.m_edgeA.prev;if(a.m_edgeA==f.m_jointList)f.m_jointList=a.m_edgeA.next;a.m_edgeA.prev=null;a.m_edgeA.next=null;if(a.m_edgeB.prev)a.m_edgeB.prev.next=a.m_edgeB.next;if(a.m_edgeB.next)a.m_edgeB.next.prev=a.m_edgeB.prev;if(a.m_edgeB==m.m_jointList)m.m_jointList=a.m_edgeB.next;a.m_edgeB.prev=null;a.m_edgeB.next=null;r.Destroy(a,null);--this.m_jointCount;if(b==false)for(a=m.GetContactList();a;){a.other==f&&a.contact.FlagForFiltering();a=a.next}};g.prototype.AddController=function(a){a.m_next=this.m_controllerList;
a.m_prev=null;this.m_controllerList=a;a.m_world=this;this.m_controllerCount++;return a};g.prototype.RemoveController=function(a){if(a.m_prev)a.m_prev.m_next=a.m_next;if(a.m_next)a.m_next.m_prev=a.m_prev;if(this.m_controllerList==a)this.m_controllerList=a.m_next;this.m_controllerCount--};g.prototype.CreateController=function(a){if(a.m_world!=this)throw Error("Controller can only be a member of one world");a.m_next=this.m_controllerList;a.m_prev=null;if(this.m_controllerList)this.m_controllerList.m_prev=
a;this.m_controllerList=a;++this.m_controllerCount;a.m_world=this;return a};g.prototype.DestroyController=function(a){a.Clear();if(a.m_next)a.m_next.m_prev=a.m_prev;if(a.m_prev)a.m_prev.m_next=a.m_next;if(a==this.m_controllerList)this.m_controllerList=a.m_next;--this.m_controllerCount};g.prototype.SetWarmStarting=function(a){g.m_warmStarting=a};g.prototype.SetContinuousPhysics=function(a){g.m_continuousPhysics=a};g.prototype.GetBodyCount=function(){return this.m_bodyCount};g.prototype.GetJointCount=
function(){return this.m_jointCount};g.prototype.GetContactCount=function(){return this.m_contactCount};g.prototype.SetGravity=function(a){this.m_gravity=a};g.prototype.GetGravity=function(){return this.m_gravity};g.prototype.GetGroundBody=function(){return this.m_groundBody};g.prototype.Step=function(a,b,f){if(a===undefined)a=0;if(b===undefined)b=0;if(f===undefined)f=0;if(this.m_flags&g.e_newFixture){this.m_contactManager.FindNewContacts();this.m_flags&=~g.e_newFixture}this.m_flags|=g.e_locked;var m=
g.s_timestep2;m.dt=a;m.velocityIterations=b;m.positionIterations=f;m.inv_dt=a>0?1/a:0;m.dtRatio=this.m_inv_dt0*a;m.warmStarting=g.m_warmStarting;this.m_contactManager.Collide();m.dt>0&&this.Solve(m);g.m_continuousPhysics&&m.dt>0&&this.SolveTOI(m);if(m.dt>0)this.m_inv_dt0=m.inv_dt;this.m_flags&=~g.e_locked};g.prototype.ClearForces=function(){for(var a=this.m_bodyList;a;a=a.m_next){a.m_force.SetZero();a.m_torque=0}};g.prototype.DrawDebugData=function(){if(this.m_debugDraw!=null){this.m_debugDraw.m_sprite.graphics.clear();
var a=this.m_debugDraw.GetFlags(),b,f,m;new F;new F;new F;var p;new N;new N;p=[new F,new F,new F,new F];var D=new G(0,0,0);if(a&K.e_shapeBit)for(b=this.m_bodyList;b;b=b.m_next){p=b.m_xf;for(f=b.GetFixtureList();f;f=f.m_next){m=f.GetShape();if(b.IsActive()==false)D.Set(0.5,0.5,0.3);else if(b.GetType()==j.b2_staticBody)D.Set(0.5,0.9,0.5);else if(b.GetType()==j.b2_kinematicBody)D.Set(0.5,0.5,0.9);else b.IsAwake()==false?D.Set(0.6,0.6,0.6):D.Set(0.9,0.7,0.7);this.DrawShape(m,p,D)}}if(a&K.e_jointBit)for(b=
this.m_jointList;b;b=b.m_next)this.DrawJoint(b);if(a&K.e_controllerBit)for(b=this.m_controllerList;b;b=b.m_next)b.Draw(this.m_debugDraw);if(a&K.e_pairBit){D.Set(0.3,0.9,0.9);for(b=this.m_contactManager.m_contactList;b;b=b.GetNext()){m=b.GetFixtureA();f=b.GetFixtureB();m=m.GetAABB().GetCenter();f=f.GetAABB().GetCenter();this.m_debugDraw.DrawSegment(m,f,D)}}if(a&K.e_aabbBit){m=this.m_contactManager.m_broadPhase;p=[new F,new F,new F,new F];for(b=this.m_bodyList;b;b=b.GetNext())if(b.IsActive()!=false)for(f=
b.GetFixtureList();f;f=f.GetNext()){var B=m.GetFatAABB(f.m_proxy);p[0].Set(B.lowerBound.x,B.lowerBound.y);p[1].Set(B.upperBound.x,B.lowerBound.y);p[2].Set(B.upperBound.x,B.upperBound.y);p[3].Set(B.lowerBound.x,B.upperBound.y);this.m_debugDraw.DrawPolygon(p,4,D)}}if(a&K.e_centerOfMassBit)for(b=this.m_bodyList;b;b=b.m_next){p=g.s_xf;p.R=b.m_xf.R;p.position=b.GetWorldCenter();this.m_debugDraw.DrawTransform(p)}}};g.prototype.QueryAABB=function(a,b){var f=this.m_contactManager.m_broadPhase;f.Query(function(m){return a(f.GetUserData(m))},
b)};g.prototype.QueryShape=function(a,b,f){if(f===undefined)f=null;if(f==null){f=new H;f.SetIdentity()}var m=this.m_contactManager.m_broadPhase,p=new N;b.ComputeAABB(p,f);m.Query(function(D){D=m.GetUserData(D)instanceof Z?m.GetUserData(D):null;if(da.TestOverlap(b,f,D.GetShape(),D.GetBody().GetTransform()))return a(D);return true},p)};g.prototype.QueryPoint=function(a,b){var f=this.m_contactManager.m_broadPhase,m=new N;m.lowerBound.Set(b.x-A.b2_linearSlop,b.y-A.b2_linearSlop);m.upperBound.Set(b.x+
A.b2_linearSlop,b.y+A.b2_linearSlop);f.Query(function(p){p=f.GetUserData(p)instanceof Z?f.GetUserData(p):null;if(p.TestPoint(b))return a(p);return true},m)};g.prototype.RayCast=function(a,b,f){var m=this.m_contactManager.m_broadPhase,p=new aa,D=new R(b,f);m.RayCast(function(B,O){var W=m.GetUserData(O);W=W instanceof Z?W:null;if(W.RayCast(p,B)){var ca=p.fraction,d=new F((1-ca)*b.x+ca*f.x,(1-ca)*b.y+ca*f.y);return a(W,d,p.normal,ca)}return B.maxFraction},D)};g.prototype.RayCastOne=function(a,b){var f;
this.RayCast(function(m,p,D,B){if(B===undefined)B=0;f=m;return B},a,b);return f};g.prototype.RayCastAll=function(a,b){var f=new Vector;this.RayCast(function(m){f[f.length]=m;return 1},a,b);return f};g.prototype.GetBodyList=function(){return this.m_bodyList};g.prototype.GetJointList=function(){return this.m_jointList};g.prototype.GetContactList=function(){return this.m_contactList};g.prototype.IsLocked=function(){return(this.m_flags&g.e_locked)>0};g.prototype.Solve=function(a){for(var b,f=this.m_controllerList;f;f=
f.m_next)f.Step(a);f=this.m_island;f.Initialize(this.m_bodyCount,this.m_contactCount,this.m_jointCount,null,this.m_contactManager.m_contactListener,this.m_contactSolver);for(b=this.m_bodyList;b;b=b.m_next)b.m_flags&=~j.e_islandFlag;for(var m=this.m_contactList;m;m=m.m_next)m.m_flags&=~k.e_islandFlag;for(m=this.m_jointList;m;m=m.m_next)m.m_islandFlag=false;parseInt(this.m_bodyCount);m=this.s_stack;for(var p=this.m_bodyList;p;p=p.m_next)if(!(p.m_flags&j.e_islandFlag))if(!(p.IsAwake()==false||p.IsActive()==
false))if(p.GetType()!=j.b2_staticBody){f.Clear();var D=0;m[D++]=p;for(p.m_flags|=j.e_islandFlag;D>0;){b=m[--D];f.AddBody(b);b.IsAwake()==false&&b.SetAwake(true);if(b.GetType()!=j.b2_staticBody){for(var B,O=b.m_contactList;O;O=O.next)if(!(O.contact.m_flags&k.e_islandFlag))if(!(O.contact.IsSensor()==true||O.contact.IsEnabled()==false||O.contact.IsTouching()==false)){f.AddContact(O.contact);O.contact.m_flags|=k.e_islandFlag;B=O.other;if(!(B.m_flags&j.e_islandFlag)){m[D++]=B;B.m_flags|=j.e_islandFlag}}for(b=
b.m_jointList;b;b=b.next)if(b.joint.m_islandFlag!=true){B=b.other;if(B.IsActive()!=false){f.AddJoint(b.joint);b.joint.m_islandFlag=true;if(!(B.m_flags&j.e_islandFlag)){m[D++]=B;B.m_flags|=j.e_islandFlag}}}}}f.Solve(a,this.m_gravity,this.m_allowSleep);for(D=0;D<f.m_bodyCount;++D){b=f.m_bodies[D];if(b.GetType()==j.b2_staticBody)b.m_flags&=~j.e_islandFlag}}for(D=0;D<m.length;++D){if(!m[D])break;m[D]=null}for(b=this.m_bodyList;b;b=b.m_next)b.IsAwake()==false||b.IsActive()==false||b.GetType()!=j.b2_staticBody&&
b.SynchronizeFixtures();this.m_contactManager.FindNewContacts()};g.prototype.SolveTOI=function(a){var b,f,m,p=this.m_island;p.Initialize(this.m_bodyCount,A.b2_maxTOIContactsPerIsland,A.b2_maxTOIJointsPerIsland,null,this.m_contactManager.m_contactListener,this.m_contactSolver);var D=g.s_queue;for(b=this.m_bodyList;b;b=b.m_next){b.m_flags&=~j.e_islandFlag;b.m_sweep.t0=0}for(m=this.m_contactList;m;m=m.m_next)m.m_flags&=~(k.e_toiFlag|k.e_islandFlag);for(m=this.m_jointList;m;m=m.m_next)m.m_islandFlag=
false;for(;;){var B=null,O=1;for(m=this.m_contactList;m;m=m.m_next)if(!(m.IsSensor()==true||m.IsEnabled()==false||m.IsContinuous()==false)){b=1;if(m.m_flags&k.e_toiFlag)b=m.m_toi;else{b=m.m_fixtureA;f=m.m_fixtureB;b=b.m_body;f=f.m_body;if((b.GetType()!=j.b2_dynamicBody||b.IsAwake()==false)&&(f.GetType()!=j.b2_dynamicBody||f.IsAwake()==false))continue;var W=b.m_sweep.t0;if(b.m_sweep.t0<f.m_sweep.t0){W=f.m_sweep.t0;b.m_sweep.Advance(W)}else if(f.m_sweep.t0<b.m_sweep.t0){W=b.m_sweep.t0;f.m_sweep.Advance(W)}b=
m.ComputeTOI(b.m_sweep,f.m_sweep);A.b2Assert(0<=b&&b<=1);if(b>0&&b<1){b=(1-b)*W+b;if(b>1)b=1}m.m_toi=b;m.m_flags|=k.e_toiFlag}if(Number.MIN_VALUE<b&&b<O){B=m;O=b}}if(B==null||1-100*Number.MIN_VALUE<O)break;b=B.m_fixtureA;f=B.m_fixtureB;b=b.m_body;f=f.m_body;g.s_backupA.Set(b.m_sweep);g.s_backupB.Set(f.m_sweep);b.Advance(O);f.Advance(O);B.Update(this.m_contactManager.m_contactListener);B.m_flags&=~k.e_toiFlag;if(B.IsSensor()==true||B.IsEnabled()==false){b.m_sweep.Set(g.s_backupA);f.m_sweep.Set(g.s_backupB);
b.SynchronizeTransform();f.SynchronizeTransform()}else if(B.IsTouching()!=false){b=b;if(b.GetType()!=j.b2_dynamicBody)b=f;p.Clear();B=m=0;D[m+B++]=b;for(b.m_flags|=j.e_islandFlag;B>0;){b=D[m++];--B;p.AddBody(b);b.IsAwake()==false&&b.SetAwake(true);if(b.GetType()==j.b2_dynamicBody){for(f=b.m_contactList;f;f=f.next){if(p.m_contactCount==p.m_contactCapacity)break;if(!(f.contact.m_flags&k.e_islandFlag))if(!(f.contact.IsSensor()==true||f.contact.IsEnabled()==false||f.contact.IsTouching()==false)){p.AddContact(f.contact);
f.contact.m_flags|=k.e_islandFlag;W=f.other;if(!(W.m_flags&j.e_islandFlag)){if(W.GetType()!=j.b2_staticBody){W.Advance(O);W.SetAwake(true)}D[m+B]=W;++B;W.m_flags|=j.e_islandFlag}}}for(b=b.m_jointList;b;b=b.next)if(p.m_jointCount!=p.m_jointCapacity)if(b.joint.m_islandFlag!=true){W=b.other;if(W.IsActive()!=false){p.AddJoint(b.joint);b.joint.m_islandFlag=true;if(!(W.m_flags&j.e_islandFlag)){if(W.GetType()!=j.b2_staticBody){W.Advance(O);W.SetAwake(true)}D[m+B]=W;++B;W.m_flags|=j.e_islandFlag}}}}}m=g.s_timestep;
m.warmStarting=false;m.dt=(1-O)*a.dt;m.inv_dt=1/m.dt;m.dtRatio=0;m.velocityIterations=a.velocityIterations;m.positionIterations=a.positionIterations;p.SolveTOI(m);for(O=O=0;O<p.m_bodyCount;++O){b=p.m_bodies[O];b.m_flags&=~j.e_islandFlag;if(b.IsAwake()!=false)if(b.GetType()==j.b2_dynamicBody){b.SynchronizeFixtures();for(f=b.m_contactList;f;f=f.next)f.contact.m_flags&=~k.e_toiFlag}}for(O=0;O<p.m_contactCount;++O){m=p.m_contacts[O];m.m_flags&=~(k.e_toiFlag|k.e_islandFlag)}for(O=0;O<p.m_jointCount;++O){m=
p.m_joints[O];m.m_islandFlag=false}this.m_contactManager.FindNewContacts()}}};g.prototype.DrawJoint=function(a){var b=a.GetBodyA(),f=a.GetBodyB(),m=b.m_xf.position,p=f.m_xf.position,D=a.GetAnchorA(),B=a.GetAnchorB(),O=g.s_jointColor;switch(a.m_type){case r.e_distanceJoint:this.m_debugDraw.DrawSegment(D,B,O);break;case r.e_pulleyJoint:b=a instanceof l?a:null;a=b.GetGroundAnchorA();b=b.GetGroundAnchorB();this.m_debugDraw.DrawSegment(a,D,O);this.m_debugDraw.DrawSegment(b,B,O);this.m_debugDraw.DrawSegment(a,
b,O);break;case r.e_mouseJoint:this.m_debugDraw.DrawSegment(D,B,O);break;default:b!=this.m_groundBody&&this.m_debugDraw.DrawSegment(m,D,O);this.m_debugDraw.DrawSegment(D,B,O);f!=this.m_groundBody&&this.m_debugDraw.DrawSegment(p,B,O)}};g.prototype.DrawShape=function(a,b,f){switch(a.m_type){case da.e_circleShape:var m=a instanceof $?a:null;this.m_debugDraw.DrawSolidCircle(L.MulX(b,m.m_p),m.m_radius,b.R.col1,f);break;case da.e_polygonShape:m=0;m=a instanceof X?a:null;a=parseInt(m.GetVertexCount());var p=
m.GetVertices(),D=new Vector(a);for(m=0;m<a;++m)D[m]=L.MulX(b,p[m]);this.m_debugDraw.DrawSolidPolygon(D,a,f);break;case da.e_edgeShape:m=a instanceof T?a:null;this.m_debugDraw.DrawSegment(L.MulX(b,m.GetVertex1()),L.MulX(b,m.GetVertex2()),f)}};_A2J_postDefs.push(function(){Box2D.Dynamics.b2World.s_timestep2=new c;Box2D.Dynamics.b2World.prototype.s_timestep2=Box2D.Dynamics.b2World.s_timestep2;Box2D.Dynamics.b2World.s_xf=new H;Box2D.Dynamics.b2World.prototype.s_xf=Box2D.Dynamics.b2World.s_xf;Box2D.Dynamics.b2World.s_backupA=
new I;Box2D.Dynamics.b2World.prototype.s_backupA=Box2D.Dynamics.b2World.s_backupA;Box2D.Dynamics.b2World.s_backupB=new I;Box2D.Dynamics.b2World.prototype.s_backupB=Box2D.Dynamics.b2World.s_backupB;Box2D.Dynamics.b2World.s_timestep=new c;Box2D.Dynamics.b2World.prototype.s_timestep=Box2D.Dynamics.b2World.s_timestep;Box2D.Dynamics.b2World.s_queue=new Vector;Box2D.Dynamics.b2World.prototype.s_queue=Box2D.Dynamics.b2World.s_queue;Box2D.Dynamics.b2World.s_jointColor=new G(0.5,0.8,0.8);Box2D.Dynamics.b2World.prototype.s_jointColor=
Box2D.Dynamics.b2World.s_jointColor;Box2D.Dynamics.b2World.e_newFixture=1;Box2D.Dynamics.b2World.prototype.e_newFixture=Box2D.Dynamics.b2World.e_newFixture;Box2D.Dynamics.b2World.e_locked=2;Box2D.Dynamics.b2World.prototype.e_locked=Box2D.Dynamics.b2World.e_locked})})();
(function(){var L=Box2D.Collision.Shapes.b2CircleShape,I=Box2D.Collision.Shapes.b2EdgeShape,H=Box2D.Collision.Shapes.b2PolygonShape,F=Box2D.Collision.Shapes.b2Shape,G=Box2D.Dynamics.Contacts.b2CircleContact,A=Box2D.Dynamics.Contacts.b2Contact,N=Box2D.Dynamics.Contacts.b2ContactConstraint,s=Box2D.Dynamics.Contacts.b2ContactConstraintPoint,C=Box2D.Dynamics.Contacts.b2ContactEdge,R=Box2D.Dynamics.Contacts.b2ContactFactory,aa=Box2D.Dynamics.Contacts.b2ContactRegister,$=Box2D.Dynamics.Contacts.b2ContactResult,
T=Box2D.Dynamics.Contacts.b2ContactSolver,Q=Box2D.Dynamics.Contacts.b2EdgeAndCircleContact,X=Box2D.Dynamics.Contacts.b2NullContact,da=Box2D.Dynamics.Contacts.b2PolyAndCircleContact,j=Box2D.Dynamics.Contacts.b2PolyAndEdgeContact,y=Box2D.Dynamics.Contacts.b2PolygonContact,x=Box2D.Dynamics.Contacts.b2PositionSolverManifold,J=Box2D.Dynamics.b2Body,M=Box2D.Dynamics.b2TimeStep,U=Box2D.Common.b2Settings,K=Box2D.Common.Math.b2Mat22,ba=Box2D.Common.Math.b2Math,V=Box2D.Common.Math.b2Vec2,Z=Box2D.Collision.b2Collision,
ga=Box2D.Collision.b2ContactID,fa=Box2D.Collision.b2Manifold,c=Box2D.Collision.b2TimeOfImpact,g=Box2D.Collision.b2TOIInput,k=Box2D.Collision.b2WorldManifold;G=Box2D.Dynamics.Contacts.b2CircleContact;A=Box2D.Dynamics.Contacts.b2Contact;N=Box2D.Dynamics.Contacts.b2ContactConstraint;s=Box2D.Dynamics.Contacts.b2ContactConstraintPoint;C=Box2D.Dynamics.Contacts.b2ContactEdge;R=Box2D.Dynamics.Contacts.b2ContactFactory;aa=Box2D.Dynamics.Contacts.b2ContactRegister;$=Box2D.Dynamics.Contacts.b2ContactResult;
T=Box2D.Dynamics.Contacts.b2ContactSolver;Q=Box2D.Dynamics.Contacts.b2EdgeAndCircleContact;X=Box2D.Dynamics.Contacts.b2NullContact;da=Box2D.Dynamics.Contacts.b2PolyAndCircleContact;j=Box2D.Dynamics.Contacts.b2PolyAndEdgeContact;y=Box2D.Dynamics.Contacts.b2PolygonContact;x=Box2D.Dynamics.Contacts.b2PositionSolverManifold;G.inherit(Box2D.Dynamics.Contacts.b2Contact);G.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;G.b2CircleContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,
arguments)};G.prototype.Create=function(){return new G};G.Create=G.prototype.Create;G.prototype.Destroy=function(){};G.Destroy=G.prototype.Destroy;G.prototype.Reset=function(h,o){this.__super.Reset.call(this,h,o)};G.prototype.Evaluate=function(){var h=this.m_fixtureA.GetBody(),o=this.m_fixtureB.GetBody();Z.CollideCircles(this.m_manifold,this.m_fixtureA.GetShape()instanceof L?this.m_fixtureA.GetShape():null,h.m_xf,this.m_fixtureB.GetShape()instanceof L?this.m_fixtureB.GetShape():null,o.m_xf)};A.b2Contact=
function(){this.m_nodeA=new C;this.m_nodeB=new C;this.m_manifold=new fa;this.m_oldManifold=new fa};A.prototype.GetManifold=function(){return this.m_manifold};A.prototype.GetWorldManifold=function(h){var o=this.m_fixtureA.GetBody(),r=this.m_fixtureB.GetBody(),l=this.m_fixtureA.GetShape(),a=this.m_fixtureB.GetShape();h.Initialize(this.m_manifold,o.GetTransform(),l.m_radius,r.GetTransform(),a.m_radius)};A.prototype.IsTouching=function(){return(this.m_flags&A.e_touchingFlag)==A.e_touchingFlag};A.prototype.IsContinuous=
function(){return(this.m_flags&A.e_continuousFlag)==A.e_continuousFlag};A.prototype.SetSensor=function(h){if(h)this.m_flags|=A.e_sensorFlag;else this.m_flags&=~A.e_sensorFlag};A.prototype.IsSensor=function(){return(this.m_flags&A.e_sensorFlag)==A.e_sensorFlag};A.prototype.SetEnabled=function(h){if(h)this.m_flags|=A.e_enabledFlag;else this.m_flags&=~A.e_enabledFlag};A.prototype.IsEnabled=function(){return(this.m_flags&A.e_enabledFlag)==A.e_enabledFlag};A.prototype.GetNext=function(){return this.m_next};
A.prototype.GetFixtureA=function(){return this.m_fixtureA};A.prototype.GetFixtureB=function(){return this.m_fixtureB};A.prototype.FlagForFiltering=function(){this.m_flags|=A.e_filterFlag};A.prototype.b2Contact=function(){};A.prototype.Reset=function(h,o){if(h===undefined)h=null;if(o===undefined)o=null;this.m_flags=A.e_enabledFlag;if(!h||!o)this.m_fixtureB=this.m_fixtureA=null;else{if(h.IsSensor()||o.IsSensor())this.m_flags|=A.e_sensorFlag;var r=h.GetBody(),l=o.GetBody();if(r.GetType()!=J.b2_dynamicBody||
r.IsBullet()||l.GetType()!=J.b2_dynamicBody||l.IsBullet())this.m_flags|=A.e_continuousFlag;this.m_fixtureA=h;this.m_fixtureB=o;this.m_manifold.m_pointCount=0;this.m_next=this.m_prev=null;this.m_nodeA.contact=null;this.m_nodeA.prev=null;this.m_nodeA.next=null;this.m_nodeA.other=null;this.m_nodeB.contact=null;this.m_nodeB.prev=null;this.m_nodeB.next=null;this.m_nodeB.other=null}};A.prototype.Update=function(h){var o=this.m_oldManifold;this.m_oldManifold=this.m_manifold;this.m_manifold=o;this.m_flags|=
A.e_enabledFlag;var r=false;o=(this.m_flags&A.e_touchingFlag)==A.e_touchingFlag;var l=this.m_fixtureA.m_body,a=this.m_fixtureB.m_body,b=this.m_fixtureA.m_aabb.TestOverlap(this.m_fixtureB.m_aabb);if(this.m_flags&A.e_sensorFlag){if(b){r=this.m_fixtureA.GetShape();b=this.m_fixtureB.GetShape();l=l.GetTransform();a=a.GetTransform();r=F.TestOverlap(r,l,b,a)}this.m_manifold.m_pointCount=0}else{if(l.GetType()!=J.b2_dynamicBody||l.IsBullet()||a.GetType()!=J.b2_dynamicBody||a.IsBullet())this.m_flags|=A.e_continuousFlag;
else this.m_flags&=~A.e_continuousFlag;if(b){this.Evaluate();r=this.m_manifold.m_pointCount>0;for(b=0;b<this.m_manifold.m_pointCount;++b){var f=this.m_manifold.m_points[b];f.m_normalImpulse=0;f.m_tangentImpulse=0;for(var m=f.m_id,p=0;p<this.m_oldManifold.m_pointCount;++p){var D=this.m_oldManifold.m_points[p];if(D.m_id.key==m.key){f.m_normalImpulse=D.m_normalImpulse;f.m_tangentImpulse=D.m_tangentImpulse;break}}}}else this.m_manifold.m_pointCount=0;if(r!=o){l.SetAwake(true);a.SetAwake(true)}}if(r)this.m_flags|=
A.e_touchingFlag;else this.m_flags&=~A.e_touchingFlag;o==false&&r==true&&h.BeginContact(this);o==true&&r==false&&h.EndContact(this);(this.m_flags&A.e_sensorFlag)==0&&h.PreSolve(this,this.m_oldManifold)};A.prototype.Evaluate=function(){};A.prototype.ComputeTOI=function(h,o){A.s_input.proxyA.Set(this.m_fixtureA.GetShape());A.s_input.proxyB.Set(this.m_fixtureB.GetShape());A.s_input.sweepA=h;A.s_input.sweepB=o;A.s_input.tolerance=U.b2_linearSlop;return c.TimeOfImpact(A.s_input)};_A2J_postDefs.push(function(){Box2D.Dynamics.Contacts.b2Contact.e_sensorFlag=
1;Box2D.Dynamics.Contacts.b2Contact.prototype.e_sensorFlag=Box2D.Dynamics.Contacts.b2Contact.e_sensorFlag;Box2D.Dynamics.Contacts.b2Contact.e_continuousFlag=2;Box2D.Dynamics.Contacts.b2Contact.prototype.e_continuousFlag=Box2D.Dynamics.Contacts.b2Contact.e_continuousFlag;Box2D.Dynamics.Contacts.b2Contact.e_islandFlag=4;Box2D.Dynamics.Contacts.b2Contact.prototype.e_islandFlag=Box2D.Dynamics.Contacts.b2Contact.e_islandFlag;Box2D.Dynamics.Contacts.b2Contact.e_toiFlag=8;Box2D.Dynamics.Contacts.b2Contact.prototype.e_toiFlag=
Box2D.Dynamics.Contacts.b2Contact.e_toiFlag;Box2D.Dynamics.Contacts.b2Contact.e_touchingFlag=16;Box2D.Dynamics.Contacts.b2Contact.prototype.e_touchingFlag=Box2D.Dynamics.Contacts.b2Contact.e_touchingFlag;Box2D.Dynamics.Contacts.b2Contact.e_enabledFlag=32;Box2D.Dynamics.Contacts.b2Contact.prototype.e_enabledFlag=Box2D.Dynamics.Contacts.b2Contact.e_enabledFlag;Box2D.Dynamics.Contacts.b2Contact.e_filterFlag=64;Box2D.Dynamics.Contacts.b2Contact.prototype.e_filterFlag=Box2D.Dynamics.Contacts.b2Contact.e_filterFlag;
Box2D.Dynamics.Contacts.b2Contact.s_input=new g;Box2D.Dynamics.Contacts.b2Contact.prototype.s_input=Box2D.Dynamics.Contacts.b2Contact.s_input});N.b2ContactConstraint=function(){this.localPlaneNormal=new V;this.localPoint=new V;this.normal=new V;this.normalMass=new K;this.K=new K};N.prototype.b2ContactConstraint=function(){this.points=new Vector(U.b2_maxManifoldPoints);for(var h=0;h<U.b2_maxManifoldPoints;h++)this.points[h]=new s};s.b2ContactConstraintPoint=function(){this.localPoint=new V;this.rA=
new V;this.rB=new V};C.b2ContactEdge=function(){};R.b2ContactFactory=function(){};R.prototype.b2ContactFactory=function(h){this.m_allocator=h;this.InitializeRegisters()};R.prototype.AddType=function(h,o,r,l){if(r===undefined)r=0;if(l===undefined)l=0;this.m_registers[r][l].createFcn=h;this.m_registers[r][l].destroyFcn=o;this.m_registers[r][l].primary=true;if(r!=l){this.m_registers[l][r].createFcn=h;this.m_registers[l][r].destroyFcn=o;this.m_registers[l][r].primary=false}};R.prototype.InitializeRegisters=
function(){this.m_registers=new Vector(F.e_shapeTypeCount);for(var h=0;h<F.e_shapeTypeCount;h++){this.m_registers[h]=new Vector(F.e_shapeTypeCount);for(var o=0;o<F.e_shapeTypeCount;o++)this.m_registers[h][o]=new aa}this.AddType(G.Create,G.Destroy,F.e_circleShape,F.e_circleShape);this.AddType(da.Create,da.Destroy,F.e_polygonShape,F.e_circleShape);this.AddType(y.Create,y.Destroy,F.e_polygonShape,F.e_polygonShape);this.AddType(Q.Create,Q.Destroy,F.e_edgeShape,F.e_circleShape);this.AddType(j.Create,j.Destroy,
F.e_polygonShape,F.e_edgeShape)};R.prototype.Create=function(h,o){var r=parseInt(h.GetType()),l=parseInt(o.GetType());r=this.m_registers[r][l];if(r.pool){l=r.pool;r.pool=l.m_next;r.poolCount--;l.Reset(h,o);return l}l=r.createFcn;if(l!=null){if(r.primary){l=l(this.m_allocator);l.Reset(h,o)}else{l=l(this.m_allocator);l.Reset(o,h)}return l}else return null};R.prototype.Destroy=function(h){if(h.m_manifold.m_pointCount>0){h.m_fixtureA.m_body.SetAwake(true);h.m_fixtureB.m_body.SetAwake(true)}var o=parseInt(h.m_fixtureA.GetType()),
r=parseInt(h.m_fixtureB.GetType());o=this.m_registers[o][r];o.poolCount++;h.m_next=o.pool;o.pool=h;o=o.destroyFcn;o(h,this.m_allocator)};aa.b2ContactRegister=function(){};$.b2ContactResult=function(){this.position=new V;this.normal=new V;this.id=new ga};T.b2ContactSolver=function(){this.m_step=new M;this.m_constraints=new Vector};T.prototype.b2ContactSolver=function(){};T.prototype.Initialize=function(h,o,r,l){if(r===undefined)r=0;var a;this.m_step.Set(h);this.m_allocator=l;h=0;for(this.m_constraintCount=
r;this.m_constraints.length<this.m_constraintCount;)this.m_constraints[this.m_constraints.length]=new N;for(h=0;h<r;++h){a=o[h];l=a.m_fixtureA;var b=a.m_fixtureB,f=l.m_shape.m_radius,m=b.m_shape.m_radius,p=l.m_body,D=b.m_body,B=a.GetManifold(),O=U.b2MixFriction(l.GetFriction(),b.GetFriction()),W=U.b2MixRestitution(l.GetRestitution(),b.GetRestitution()),ca=p.m_linearVelocity.x,d=p.m_linearVelocity.y,n=D.m_linearVelocity.x,e=D.m_linearVelocity.y,q=p.m_angularVelocity,t=D.m_angularVelocity;U.b2Assert(B.m_pointCount>
0);T.s_worldManifold.Initialize(B,p.m_xf,f,D.m_xf,m);b=T.s_worldManifold.m_normal.x;a=T.s_worldManifold.m_normal.y;l=this.m_constraints[h];l.bodyA=p;l.bodyB=D;l.manifold=B;l.normal.x=b;l.normal.y=a;l.pointCount=B.m_pointCount;l.friction=O;l.restitution=W;l.localPlaneNormal.x=B.m_localPlaneNormal.x;l.localPlaneNormal.y=B.m_localPlaneNormal.y;l.localPoint.x=B.m_localPoint.x;l.localPoint.y=B.m_localPoint.y;l.radius=f+m;l.type=B.m_type;for(f=0;f<l.pointCount;++f){O=B.m_points[f];m=l.points[f];m.normalImpulse=
O.m_normalImpulse;m.tangentImpulse=O.m_tangentImpulse;m.localPoint.SetV(O.m_localPoint);O=m.rA.x=T.s_worldManifold.m_points[f].x-p.m_sweep.c.x;W=m.rA.y=T.s_worldManifold.m_points[f].y-p.m_sweep.c.y;var v=m.rB.x=T.s_worldManifold.m_points[f].x-D.m_sweep.c.x,z=m.rB.y=T.s_worldManifold.m_points[f].y-D.m_sweep.c.y,u=O*a-W*b,w=v*a-z*b;u*=u;w*=w;m.normalMass=1/(p.m_invMass+D.m_invMass+p.m_invI*u+D.m_invI*w);var E=p.m_mass*p.m_invMass+D.m_mass*D.m_invMass;E+=p.m_mass*p.m_invI*u+D.m_mass*D.m_invI*w;m.equalizedMass=
1/E;w=a;E=-b;u=O*E-W*w;w=v*E-z*w;u*=u;w*=w;m.tangentMass=1/(p.m_invMass+D.m_invMass+p.m_invI*u+D.m_invI*w);m.velocityBias=0;O=l.normal.x*(n+-t*z-ca- -q*W)+l.normal.y*(e+t*v-d-q*O);if(O<-U.b2_velocityThreshold)m.velocityBias+=-l.restitution*O}if(l.pointCount==2){e=l.points[0];n=l.points[1];B=p.m_invMass;p=p.m_invI;ca=D.m_invMass;D=D.m_invI;d=e.rA.x*a-e.rA.y*b;e=e.rB.x*a-e.rB.y*b;q=n.rA.x*a-n.rA.y*b;n=n.rB.x*a-n.rB.y*b;b=B+ca+p*d*d+D*e*e;a=B+ca+p*q*q+D*n*n;D=B+ca+p*d*q+D*e*n;if(b*b<100*(b*a-D*D)){l.K.col1.Set(b,
D);l.K.col2.Set(D,a);l.K.GetInverse(l.normalMass)}else l.pointCount=1}}};T.prototype.InitVelocityConstraints=function(h){for(var o=0;o<this.m_constraintCount;++o){var r=this.m_constraints[o],l=r.bodyA,a=r.bodyB,b=l.m_invMass,f=l.m_invI,m=a.m_invMass,p=a.m_invI,D=r.normal.x,B=r.normal.y,O=B,W=-D,ca=0,d=0;if(h.warmStarting){d=r.pointCount;for(ca=0;ca<d;++ca){var n=r.points[ca];n.normalImpulse*=h.dtRatio;n.tangentImpulse*=h.dtRatio;var e=n.normalImpulse*D+n.tangentImpulse*O,q=n.normalImpulse*B+n.tangentImpulse*
W;l.m_angularVelocity-=f*(n.rA.x*q-n.rA.y*e);l.m_linearVelocity.x-=b*e;l.m_linearVelocity.y-=b*q;a.m_angularVelocity+=p*(n.rB.x*q-n.rB.y*e);a.m_linearVelocity.x+=m*e;a.m_linearVelocity.y+=m*q}}else{d=r.pointCount;for(ca=0;ca<d;++ca){l=r.points[ca];l.normalImpulse=0;l.tangentImpulse=0}}}};T.prototype.SolveVelocityConstraints=function(){for(var h=0,o,r=0,l=0,a=0,b=l=l=r=r=0,f=r=r=0,m=r=a=0,p=0,D,B=0;B<this.m_constraintCount;++B){a=this.m_constraints[B];var O=a.bodyA,W=a.bodyB,ca=O.m_angularVelocity,
d=W.m_angularVelocity,n=O.m_linearVelocity,e=W.m_linearVelocity,q=O.m_invMass,t=O.m_invI,v=W.m_invMass,z=W.m_invI;m=a.normal.x;var u=p=a.normal.y;D=-m;f=a.friction;for(h=0;h<a.pointCount;h++){o=a.points[h];r=e.x-d*o.rB.y-n.x+ca*o.rA.y;l=e.y+d*o.rB.x-n.y-ca*o.rA.x;r=r*u+l*D;r=o.tangentMass*-r;l=f*o.normalImpulse;l=ba.Clamp(o.tangentImpulse+r,-l,l);r=l-o.tangentImpulse;b=r*u;r=r*D;n.x-=q*b;n.y-=q*r;ca-=t*(o.rA.x*r-o.rA.y*b);e.x+=v*b;e.y+=v*r;d+=z*(o.rB.x*r-o.rB.y*b);o.tangentImpulse=l}parseInt(a.pointCount);
if(a.pointCount==1){o=a.points[0];r=e.x+-d*o.rB.y-n.x- -ca*o.rA.y;l=e.y+d*o.rB.x-n.y-ca*o.rA.x;a=r*m+l*p;r=-o.normalMass*(a-o.velocityBias);l=o.normalImpulse+r;l=l>0?l:0;r=l-o.normalImpulse;b=r*m;r=r*p;n.x-=q*b;n.y-=q*r;ca-=t*(o.rA.x*r-o.rA.y*b);e.x+=v*b;e.y+=v*r;d+=z*(o.rB.x*r-o.rB.y*b);o.normalImpulse=l}else{o=a.points[0];h=a.points[1];r=o.normalImpulse;f=h.normalImpulse;var w=(e.x-d*o.rB.y-n.x+ca*o.rA.y)*m+(e.y+d*o.rB.x-n.y-ca*o.rA.x)*p,E=(e.x-d*h.rB.y-n.x+ca*h.rA.y)*m+(e.y+d*h.rB.x-n.y-ca*h.rA.x)*
p;l=w-o.velocityBias;b=E-h.velocityBias;D=a.K;l-=D.col1.x*r+D.col2.x*f;for(b-=D.col1.y*r+D.col2.y*f;;){D=a.normalMass;u=-(D.col1.x*l+D.col2.x*b);D=-(D.col1.y*l+D.col2.y*b);if(u>=0&&D>=0){r=u-r;f=D-f;a=r*m;r=r*p;m=f*m;p=f*p;n.x-=q*(a+m);n.y-=q*(r+p);ca-=t*(o.rA.x*r-o.rA.y*a+h.rA.x*p-h.rA.y*m);e.x+=v*(a+m);e.y+=v*(r+p);d+=z*(o.rB.x*r-o.rB.y*a+h.rB.x*p-h.rB.y*m);o.normalImpulse=u;h.normalImpulse=D;break}u=-o.normalMass*l;D=0;E=a.K.col1.y*u+b;if(u>=0&&E>=0){r=u-r;f=D-f;a=r*m;r=r*p;m=f*m;p=f*p;n.x-=q*
(a+m);n.y-=q*(r+p);ca-=t*(o.rA.x*r-o.rA.y*a+h.rA.x*p-h.rA.y*m);e.x+=v*(a+m);e.y+=v*(r+p);d+=z*(o.rB.x*r-o.rB.y*a+h.rB.x*p-h.rB.y*m);o.normalImpulse=u;h.normalImpulse=D;break}u=0;D=-h.normalMass*b;w=a.K.col2.x*D+l;if(D>=0&&w>=0){r=u-r;f=D-f;a=r*m;r=r*p;m=f*m;p=f*p;n.x-=q*(a+m);n.y-=q*(r+p);ca-=t*(o.rA.x*r-o.rA.y*a+h.rA.x*p-h.rA.y*m);e.x+=v*(a+m);e.y+=v*(r+p);d+=z*(o.rB.x*r-o.rB.y*a+h.rB.x*p-h.rB.y*m);o.normalImpulse=u;h.normalImpulse=D;break}D=u=0;w=l;E=b;if(w>=0&&E>=0){r=u-r;f=D-f;a=r*m;r=r*p;m=f*
m;p=f*p;n.x-=q*(a+m);n.y-=q*(r+p);ca-=t*(o.rA.x*r-o.rA.y*a+h.rA.x*p-h.rA.y*m);e.x+=v*(a+m);e.y+=v*(r+p);d+=z*(o.rB.x*r-o.rB.y*a+h.rB.x*p-h.rB.y*m);o.normalImpulse=u;h.normalImpulse=D;break}break}}O.m_angularVelocity=ca;W.m_angularVelocity=d}};T.prototype.FinalizeVelocityConstraints=function(){for(var h=0;h<this.m_constraintCount;++h)for(var o=this.m_constraints[h],r=o.manifold,l=0;l<o.pointCount;++l){var a=r.m_points[l],b=o.points[l];a.m_normalImpulse=b.normalImpulse;a.m_tangentImpulse=b.tangentImpulse}};
T.prototype.SolvePositionConstraints=function(h){if(h===undefined)h=0;for(var o=0,r=0;r<this.m_constraintCount;r++){var l=this.m_constraints[r],a=l.bodyA,b=l.bodyB,f=a.m_mass*a.m_invMass,m=a.m_mass*a.m_invI,p=b.m_mass*b.m_invMass,D=b.m_mass*b.m_invI;T.s_psm.Initialize(l);for(var B=T.s_psm.m_normal,O=0;O<l.pointCount;O++){var W=l.points[O],ca=T.s_psm.m_points[O],d=T.s_psm.m_separations[O],n=ca.x-a.m_sweep.c.x,e=ca.y-a.m_sweep.c.y,q=ca.x-b.m_sweep.c.x;ca=ca.y-b.m_sweep.c.y;o=o<d?o:d;d=ba.Clamp(h*(d+
U.b2_linearSlop),-U.b2_maxLinearCorrection,0);d=-W.equalizedMass*d;W=d*B.x;d=d*B.y;a.m_sweep.c.x-=f*W;a.m_sweep.c.y-=f*d;a.m_sweep.a-=m*(n*d-e*W);a.SynchronizeTransform();b.m_sweep.c.x+=p*W;b.m_sweep.c.y+=p*d;b.m_sweep.a+=D*(q*d-ca*W);b.SynchronizeTransform()}}return o>-1.5*U.b2_linearSlop};_A2J_postDefs.push(function(){Box2D.Dynamics.Contacts.b2ContactSolver.s_worldManifold=new k;Box2D.Dynamics.Contacts.b2ContactSolver.prototype.s_worldManifold=Box2D.Dynamics.Contacts.b2ContactSolver.s_worldManifold;
Box2D.Dynamics.Contacts.b2ContactSolver.s_psm=new x;Box2D.Dynamics.Contacts.b2ContactSolver.prototype.s_psm=Box2D.Dynamics.Contacts.b2ContactSolver.s_psm});Q.inherit(Box2D.Dynamics.Contacts.b2Contact);Q.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;Q.b2EdgeAndCircleContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,arguments)};Q.prototype.Create=function(){return new Q};Q.Create=Q.prototype.Create;Q.prototype.Destroy=function(){};Q.Destroy=Q.prototype.Destroy;
Q.prototype.Reset=function(h,o){this.__super.Reset.call(this,h,o)};Q.prototype.Evaluate=function(){var h=this.m_fixtureA.GetBody(),o=this.m_fixtureB.GetBody();this.b2CollideEdgeAndCircle(this.m_manifold,this.m_fixtureA.GetShape()instanceof I?this.m_fixtureA.GetShape():null,h.m_xf,this.m_fixtureB.GetShape()instanceof L?this.m_fixtureB.GetShape():null,o.m_xf)};Q.prototype.b2CollideEdgeAndCircle=function(){};X.inherit(Box2D.Dynamics.Contacts.b2Contact);X.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;
X.b2NullContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,arguments)};X.prototype.b2NullContact=function(){this.__super.b2Contact.call(this)};X.prototype.Evaluate=function(){};da.inherit(Box2D.Dynamics.Contacts.b2Contact);da.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;da.b2PolyAndCircleContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,arguments)};da.prototype.Create=function(){return new da};da.Create=da.prototype.Create;da.prototype.Destroy=
function(){};da.Destroy=da.prototype.Destroy;da.prototype.Reset=function(h,o){this.__super.Reset.call(this,h,o);U.b2Assert(h.GetType()==F.e_polygonShape);U.b2Assert(o.GetType()==F.e_circleShape)};da.prototype.Evaluate=function(){var h=this.m_fixtureA.m_body,o=this.m_fixtureB.m_body;Z.CollidePolygonAndCircle(this.m_manifold,this.m_fixtureA.GetShape()instanceof H?this.m_fixtureA.GetShape():null,h.m_xf,this.m_fixtureB.GetShape()instanceof L?this.m_fixtureB.GetShape():null,o.m_xf)};j.inherit(Box2D.Dynamics.Contacts.b2Contact);
j.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;j.b2PolyAndEdgeContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,arguments)};j.prototype.Create=function(){return new j};j.Create=j.prototype.Create;j.prototype.Destroy=function(){};j.Destroy=j.prototype.Destroy;j.prototype.Reset=function(h,o){this.__super.Reset.call(this,h,o);U.b2Assert(h.GetType()==F.e_polygonShape);U.b2Assert(o.GetType()==F.e_edgeShape)};j.prototype.Evaluate=function(){var h=this.m_fixtureA.GetBody(),
o=this.m_fixtureB.GetBody();this.b2CollidePolyAndEdge(this.m_manifold,this.m_fixtureA.GetShape()instanceof H?this.m_fixtureA.GetShape():null,h.m_xf,this.m_fixtureB.GetShape()instanceof I?this.m_fixtureB.GetShape():null,o.m_xf)};j.prototype.b2CollidePolyAndEdge=function(){};y.inherit(Box2D.Dynamics.Contacts.b2Contact);y.prototype.__super=Box2D.Dynamics.Contacts.b2Contact.prototype;y.b2PolygonContact=function(){Box2D.Dynamics.Contacts.b2Contact.b2Contact.apply(this,arguments)};y.prototype.Create=function(){return new y};
y.Create=y.prototype.Create;y.prototype.Destroy=function(){};y.Destroy=y.prototype.Destroy;y.prototype.Reset=function(h,o){this.__super.Reset.call(this,h,o)};y.prototype.Evaluate=function(){var h=this.m_fixtureA.GetBody(),o=this.m_fixtureB.GetBody();Z.CollidePolygons(this.m_manifold,this.m_fixtureA.GetShape()instanceof H?this.m_fixtureA.GetShape():null,h.m_xf,this.m_fixtureB.GetShape()instanceof H?this.m_fixtureB.GetShape():null,o.m_xf)};x.b2PositionSolverManifold=function(){};x.prototype.b2PositionSolverManifold=
function(){this.m_normal=new V;this.m_separations=new Vector_a2j_Number(U.b2_maxManifoldPoints);this.m_points=new Vector(U.b2_maxManifoldPoints);for(var h=0;h<U.b2_maxManifoldPoints;h++)this.m_points[h]=new V};x.prototype.Initialize=function(h){U.b2Assert(h.pointCount>0);var o=0,r=0,l=0,a,b=0,f=0;switch(h.type){case fa.e_circles:a=h.bodyA.m_xf.R;l=h.localPoint;o=h.bodyA.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);r=h.bodyA.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);a=h.bodyB.m_xf.R;l=h.points[0].localPoint;
b=h.bodyB.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);a=h.bodyB.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);l=b-o;f=a-r;var m=l*l+f*f;if(m>Number.MIN_VALUE*Number.MIN_VALUE){m=Math.sqrt(m);this.m_normal.x=l/m;this.m_normal.y=f/m}else{this.m_normal.x=1;this.m_normal.y=0}this.m_points[0].x=0.5*(o+b);this.m_points[0].y=0.5*(r+a);this.m_separations[0]=l*this.m_normal.x+f*this.m_normal.y-h.radius;break;case fa.e_faceA:a=h.bodyA.m_xf.R;l=h.localPlaneNormal;this.m_normal.x=a.col1.x*l.x+a.col2.x*l.y;this.m_normal.y=
a.col1.y*l.x+a.col2.y*l.y;a=h.bodyA.m_xf.R;l=h.localPoint;b=h.bodyA.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);f=h.bodyA.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);a=h.bodyB.m_xf.R;for(o=0;o<h.pointCount;++o){l=h.points[o].localPoint;r=h.bodyB.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);l=h.bodyB.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);this.m_separations[o]=(r-b)*this.m_normal.x+(l-f)*this.m_normal.y-h.radius;this.m_points[o].x=r;this.m_points[o].y=l}break;case fa.e_faceB:a=h.bodyB.m_xf.R;l=
h.localPlaneNormal;this.m_normal.x=a.col1.x*l.x+a.col2.x*l.y;this.m_normal.y=a.col1.y*l.x+a.col2.y*l.y;a=h.bodyB.m_xf.R;l=h.localPoint;b=h.bodyB.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);f=h.bodyB.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);a=h.bodyA.m_xf.R;for(o=0;o<h.pointCount;++o){l=h.points[o].localPoint;r=h.bodyA.m_xf.position.x+(a.col1.x*l.x+a.col2.x*l.y);l=h.bodyA.m_xf.position.y+(a.col1.y*l.x+a.col2.y*l.y);this.m_separations[o]=(r-b)*this.m_normal.x+(l-f)*this.m_normal.y-h.radius;this.m_points[o].Set(r,
l)}this.m_normal.x*=-1;this.m_normal.y*=-1}};_A2J_postDefs.push(function(){Box2D.Dynamics.Contacts.b2PositionSolverManifold.circlePointA=new V;Box2D.Dynamics.Contacts.b2PositionSolverManifold.prototype.circlePointA=Box2D.Dynamics.Contacts.b2PositionSolverManifold.circlePointA;Box2D.Dynamics.Contacts.b2PositionSolverManifold.circlePointB=new V;Box2D.Dynamics.Contacts.b2PositionSolverManifold.prototype.circlePointB=Box2D.Dynamics.Contacts.b2PositionSolverManifold.circlePointB})})();
(function(){var L=Box2D.Common.Math.b2Mat22,I=Box2D.Common.Math.b2Math,H=Box2D.Common.Math.b2Vec2,F=Box2D.Common.b2Color,G=Box2D.Dynamics.Controllers.b2BuoyancyController,A=Box2D.Dynamics.Controllers.b2ConstantAccelController,N=Box2D.Dynamics.Controllers.b2ConstantForceController,s=Box2D.Dynamics.Controllers.b2Controller,C=Box2D.Dynamics.Controllers.b2ControllerEdge,R=Box2D.Dynamics.Controllers.b2GravityController,aa=Box2D.Dynamics.Controllers.b2TensorDampingController;G.inherit(Box2D.Dynamics.Controllers.b2Controller);
G.prototype.__super=Box2D.Dynamics.Controllers.b2Controller.prototype;G.b2BuoyancyController=function(){Box2D.Dynamics.Controllers.b2Controller.b2Controller.apply(this,arguments);this.normal=new H(0,-1);this.density=this.offset=0;this.velocity=new H(0,0);this.linearDrag=2;this.angularDrag=1;this.useDensity=false;this.useWorldGravity=true;this.gravity=null};G.prototype.Step=function(){if(this.m_bodyList){if(this.useWorldGravity)this.gravity=this.GetWorld().GetGravity().Copy();for(var $=this.m_bodyList;$;$=
$.nextBody){var T=$.body;if(T.IsAwake()!=false){for(var Q=new H,X=new H,da=0,j=0,y=T.GetFixtureList();y;y=y.GetNext()){var x=new H,J=y.GetShape().ComputeSubmergedArea(this.normal,this.offset,T.GetTransform(),x);da+=J;Q.x+=J*x.x;Q.y+=J*x.y;var M=0;M=1;j+=J*M;X.x+=J*x.x*M;X.y+=J*x.y*M}Q.x/=da;Q.y/=da;X.x/=j;X.y/=j;if(!(da<Number.MIN_VALUE)){j=this.gravity.GetNegative();j.Multiply(this.density*da);T.ApplyForce(j,X);X=T.GetLinearVelocityFromWorldPoint(Q);X.Subtract(this.velocity);X.Multiply(-this.linearDrag*
da);T.ApplyForce(X,Q);T.ApplyTorque(-T.GetInertia()/T.GetMass()*da*T.GetAngularVelocity()*this.angularDrag)}}}}};G.prototype.Draw=function($){var T=new H,Q=new H;T.x=this.normal.x*this.offset+this.normal.y*1E3;T.y=this.normal.y*this.offset-this.normal.x*1E3;Q.x=this.normal.x*this.offset-this.normal.y*1E3;Q.y=this.normal.y*this.offset+this.normal.x*1E3;var X=new F(0,0,1);$.DrawSegment(T,Q,X)};A.inherit(Box2D.Dynamics.Controllers.b2Controller);A.prototype.__super=Box2D.Dynamics.Controllers.b2Controller.prototype;
A.b2ConstantAccelController=function(){Box2D.Dynamics.Controllers.b2Controller.b2Controller.apply(this,arguments);this.A=new H(0,0)};A.prototype.Step=function($){$=new H(this.A.x*$.dt,this.A.y*$.dt);for(var T=this.m_bodyList;T;T=T.nextBody){var Q=T.body;Q.IsAwake()&&Q.SetLinearVelocity(new H(Q.GetLinearVelocity().x+$.x,Q.GetLinearVelocity().y+$.y))}};N.inherit(Box2D.Dynamics.Controllers.b2Controller);N.prototype.__super=Box2D.Dynamics.Controllers.b2Controller.prototype;N.b2ConstantForceController=
function(){Box2D.Dynamics.Controllers.b2Controller.b2Controller.apply(this,arguments);this.F=new H(0,0)};N.prototype.Step=function(){for(var $=this.m_bodyList;$;$=$.nextBody){var T=$.body;T.IsAwake()&&T.ApplyForce(this.F,T.GetWorldCenter())}};s.b2Controller=function(){};s.prototype.Step=function(){};s.prototype.Draw=function(){};s.prototype.AddBody=function($){var T=new C;T.controller=this;T.body=$;T.nextBody=this.m_bodyList;T.prevBody=null;this.m_bodyList=T;if(T.nextBody)T.nextBody.prevBody=T;this.m_bodyCount++;
T.nextController=$.m_controllerList;T.prevController=null;$.m_controllerList=T;if(T.nextController)T.nextController.prevController=T;$.m_controllerCount++};s.prototype.RemoveBody=function($){for(var T=$.m_controllerList;T&&T.controller!=this;)T=T.nextController;if(T.prevBody)T.prevBody.nextBody=T.nextBody;if(T.nextBody)T.nextBody.prevBody=T.prevBody;if(T.nextController)T.nextController.prevController=T.prevController;if(T.prevController)T.prevController.nextController=T.nextController;if(this.m_bodyList==
T)this.m_bodyList=T.nextBody;if($.m_controllerList==T)$.m_controllerList=T.nextController;$.m_controllerCount--;this.m_bodyCount--};s.prototype.Clear=function(){for(;this.m_bodyList;)this.RemoveBody(this.m_bodyList.body)};s.prototype.GetNext=function(){return this.m_next};s.prototype.GetWorld=function(){return this.m_world};s.prototype.GetBodyList=function(){return this.m_bodyList};C.b2ControllerEdge=function(){};R.inherit(Box2D.Dynamics.Controllers.b2Controller);R.prototype.__super=Box2D.Dynamics.Controllers.b2Controller.prototype;
R.b2GravityController=function(){Box2D.Dynamics.Controllers.b2Controller.b2Controller.apply(this,arguments);this.G=1;this.invSqr=true};R.prototype.Step=function(){var $=null,T=null,Q=null,X=0,da=null,j=null,y=null,x=0,J=0,M=0;x=null;if(this.invSqr)for($=this.m_bodyList;$;$=$.nextBody){T=$.body;Q=T.GetWorldCenter();X=T.GetMass();for(da=this.m_bodyList;da!=$;da=da.nextBody){j=da.body;y=j.GetWorldCenter();x=y.x-Q.x;J=y.y-Q.y;M=x*x+J*J;if(!(M<Number.MIN_VALUE)){x=new H(x,J);x.Multiply(this.G/M/Math.sqrt(M)*
X*j.GetMass());T.IsAwake()&&T.ApplyForce(x,Q);x.Multiply(-1);j.IsAwake()&&j.ApplyForce(x,y)}}}else for($=this.m_bodyList;$;$=$.nextBody){T=$.body;Q=T.GetWorldCenter();X=T.GetMass();for(da=this.m_bodyList;da!=$;da=da.nextBody){j=da.body;y=j.GetWorldCenter();x=y.x-Q.x;J=y.y-Q.y;M=x*x+J*J;if(!(M<Number.MIN_VALUE)){x=new H(x,J);x.Multiply(this.G/M*X*j.GetMass());T.IsAwake()&&T.ApplyForce(x,Q);x.Multiply(-1);j.IsAwake()&&j.ApplyForce(x,y)}}}};aa.inherit(Box2D.Dynamics.Controllers.b2Controller);aa.prototype.__super=
Box2D.Dynamics.Controllers.b2Controller.prototype;aa.b2TensorDampingController=function(){Box2D.Dynamics.Controllers.b2Controller.b2Controller.apply(this,arguments);this.T=new L;this.maxTimestep=0};aa.prototype.SetAxisAligned=function($,T){if($===undefined)$=0;if(T===undefined)T=0;this.T.col1.x=-$;this.T.col1.y=0;this.T.col2.x=0;this.T.col2.y=-T;this.maxTimestep=$>0||T>0?1/Math.max($,T):0};aa.prototype.Step=function($){$=$.dt;if(!($<=Number.MIN_VALUE)){if($>this.maxTimestep&&this.maxTimestep>0)$=
this.maxTimestep;for(var T=this.m_bodyList;T;T=T.nextBody){var Q=T.body;if(Q.IsAwake()){var X=Q.GetWorldVector(I.MulMV(this.T,Q.GetLocalVector(Q.GetLinearVelocity())));Q.SetLinearVelocity(new H(Q.GetLinearVelocity().x+X.x*$,Q.GetLinearVelocity().y+X.y*$))}}}}})();
(function(){var L=Box2D.Common.b2Settings;L=Box2D.Common.b2Settings;var I=Box2D.Common.Math.b2Mat22,H=Box2D.Common.Math.b2Mat33,F=Box2D.Common.Math.b2Math,G=Box2D.Common.Math.b2Vec2,A=Box2D.Common.Math.b2Vec3,N=Box2D.Dynamics.Joints.b2DistanceJoint,s=Box2D.Dynamics.Joints.b2DistanceJointDef,C=Box2D.Dynamics.Joints.b2FrictionJoint,R=Box2D.Dynamics.Joints.b2FrictionJointDef,aa=Box2D.Dynamics.Joints.b2GearJoint,$=Box2D.Dynamics.Joints.b2GearJointDef,T=Box2D.Dynamics.Joints.b2Jacobian,Q=Box2D.Dynamics.Joints.b2Joint,
X=Box2D.Dynamics.Joints.b2JointDef,da=Box2D.Dynamics.Joints.b2JointEdge,j=Box2D.Dynamics.Joints.b2LineJoint,y=Box2D.Dynamics.Joints.b2LineJointDef,x=Box2D.Dynamics.Joints.b2MouseJoint,J=Box2D.Dynamics.Joints.b2MouseJointDef,M=Box2D.Dynamics.Joints.b2PrismaticJoint,U=Box2D.Dynamics.Joints.b2PrismaticJointDef,K=Box2D.Dynamics.Joints.b2PulleyJoint,ba=Box2D.Dynamics.Joints.b2PulleyJointDef,V=Box2D.Dynamics.Joints.b2RevoluteJoint,Z=Box2D.Dynamics.Joints.b2RevoluteJointDef,ga=Box2D.Dynamics.Joints.b2WeldJoint,
fa=Box2D.Dynamics.Joints.b2WeldJointDef;N=Box2D.Dynamics.Joints.b2DistanceJoint;s=Box2D.Dynamics.Joints.b2DistanceJointDef;C=Box2D.Dynamics.Joints.b2FrictionJoint;R=Box2D.Dynamics.Joints.b2FrictionJointDef;aa=Box2D.Dynamics.Joints.b2GearJoint;$=Box2D.Dynamics.Joints.b2GearJointDef;T=Box2D.Dynamics.Joints.b2Jacobian;Q=Box2D.Dynamics.Joints.b2Joint;X=Box2D.Dynamics.Joints.b2JointDef;da=Box2D.Dynamics.Joints.b2JointEdge;j=Box2D.Dynamics.Joints.b2LineJoint;y=Box2D.Dynamics.Joints.b2LineJointDef;x=Box2D.Dynamics.Joints.b2MouseJoint;
J=Box2D.Dynamics.Joints.b2MouseJointDef;M=Box2D.Dynamics.Joints.b2PrismaticJoint;U=Box2D.Dynamics.Joints.b2PrismaticJointDef;K=Box2D.Dynamics.Joints.b2PulleyJoint;ba=Box2D.Dynamics.Joints.b2PulleyJointDef;V=Box2D.Dynamics.Joints.b2RevoluteJoint;Z=Box2D.Dynamics.Joints.b2RevoluteJointDef;ga=Box2D.Dynamics.Joints.b2WeldJoint;fa=Box2D.Dynamics.Joints.b2WeldJointDef;N.inherit(Box2D.Dynamics.Joints.b2Joint);N.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;N.b2DistanceJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,
arguments);this.m_localAnchor1=new G;this.m_localAnchor2=new G;this.m_u=new G};N.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};N.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};N.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse*this.m_u.x,c*this.m_impulse*this.m_u.y)};N.prototype.GetReactionTorque=function(){return 0};N.prototype.GetLength=function(){return this.m_length};N.prototype.SetLength=
function(c){if(c===undefined)c=0;this.m_length=c};N.prototype.GetFrequency=function(){return this.m_frequencyHz};N.prototype.SetFrequency=function(c){if(c===undefined)c=0;this.m_frequencyHz=c};N.prototype.GetDampingRatio=function(){return this.m_dampingRatio};N.prototype.SetDampingRatio=function(c){if(c===undefined)c=0;this.m_dampingRatio=c};N.prototype.b2DistanceJoint=function(c){this.__super.b2Joint.call(this,c);this.m_localAnchor1.SetV(c.localAnchorA);this.m_localAnchor2.SetV(c.localAnchorB);this.m_length=
c.length;this.m_frequencyHz=c.frequencyHz;this.m_dampingRatio=c.dampingRatio;this.m_bias=this.m_gamma=this.m_impulse=0};N.prototype.InitVelocityConstraints=function(c){var g,k=0,h=this.m_bodyA,o=this.m_bodyB;g=h.m_xf.R;var r=this.m_localAnchor1.x-h.m_sweep.localCenter.x,l=this.m_localAnchor1.y-h.m_sweep.localCenter.y;k=g.col1.x*r+g.col2.x*l;l=g.col1.y*r+g.col2.y*l;r=k;g=o.m_xf.R;var a=this.m_localAnchor2.x-o.m_sweep.localCenter.x,b=this.m_localAnchor2.y-o.m_sweep.localCenter.y;k=g.col1.x*a+g.col2.x*
b;b=g.col1.y*a+g.col2.y*b;a=k;this.m_u.x=o.m_sweep.c.x+a-h.m_sweep.c.x-r;this.m_u.y=o.m_sweep.c.y+b-h.m_sweep.c.y-l;k=Math.sqrt(this.m_u.x*this.m_u.x+this.m_u.y*this.m_u.y);k>L.b2_linearSlop?this.m_u.Multiply(1/k):this.m_u.SetZero();g=r*this.m_u.y-l*this.m_u.x;var f=a*this.m_u.y-b*this.m_u.x;g=h.m_invMass+h.m_invI*g*g+o.m_invMass+o.m_invI*f*f;this.m_mass=g!=0?1/g:0;if(this.m_frequencyHz>0){k=k-this.m_length;f=2*Math.PI*this.m_frequencyHz;var m=this.m_mass*f*f;this.m_gamma=c.dt*(2*this.m_mass*this.m_dampingRatio*
f+c.dt*m);this.m_gamma=this.m_gamma!=0?1/this.m_gamma:0;this.m_bias=k*c.dt*m*this.m_gamma;this.m_mass=g+this.m_gamma;this.m_mass=this.m_mass!=0?1/this.m_mass:0}if(c.warmStarting){this.m_impulse*=c.dtRatio;c=this.m_impulse*this.m_u.x;g=this.m_impulse*this.m_u.y;h.m_linearVelocity.x-=h.m_invMass*c;h.m_linearVelocity.y-=h.m_invMass*g;h.m_angularVelocity-=h.m_invI*(r*g-l*c);o.m_linearVelocity.x+=o.m_invMass*c;o.m_linearVelocity.y+=o.m_invMass*g;o.m_angularVelocity+=o.m_invI*(a*g-b*c)}else this.m_impulse=
0};N.prototype.SolveVelocityConstraints=function(){var c,g=this.m_bodyA,k=this.m_bodyB;c=g.m_xf.R;var h=this.m_localAnchor1.x-g.m_sweep.localCenter.x,o=this.m_localAnchor1.y-g.m_sweep.localCenter.y,r=c.col1.x*h+c.col2.x*o;o=c.col1.y*h+c.col2.y*o;h=r;c=k.m_xf.R;var l=this.m_localAnchor2.x-k.m_sweep.localCenter.x,a=this.m_localAnchor2.y-k.m_sweep.localCenter.y;r=c.col1.x*l+c.col2.x*a;a=c.col1.y*l+c.col2.y*a;l=r;r=-this.m_mass*(this.m_u.x*(k.m_linearVelocity.x+-k.m_angularVelocity*a-(g.m_linearVelocity.x+
-g.m_angularVelocity*o))+this.m_u.y*(k.m_linearVelocity.y+k.m_angularVelocity*l-(g.m_linearVelocity.y+g.m_angularVelocity*h))+this.m_bias+this.m_gamma*this.m_impulse);this.m_impulse+=r;c=r*this.m_u.x;r=r*this.m_u.y;g.m_linearVelocity.x-=g.m_invMass*c;g.m_linearVelocity.y-=g.m_invMass*r;g.m_angularVelocity-=g.m_invI*(h*r-o*c);k.m_linearVelocity.x+=k.m_invMass*c;k.m_linearVelocity.y+=k.m_invMass*r;k.m_angularVelocity+=k.m_invI*(l*r-a*c)};N.prototype.SolvePositionConstraints=function(){var c;if(this.m_frequencyHz>
0)return true;var g=this.m_bodyA,k=this.m_bodyB;c=g.m_xf.R;var h=this.m_localAnchor1.x-g.m_sweep.localCenter.x,o=this.m_localAnchor1.y-g.m_sweep.localCenter.y,r=c.col1.x*h+c.col2.x*o;o=c.col1.y*h+c.col2.y*o;h=r;c=k.m_xf.R;var l=this.m_localAnchor2.x-k.m_sweep.localCenter.x,a=this.m_localAnchor2.y-k.m_sweep.localCenter.y;r=c.col1.x*l+c.col2.x*a;a=c.col1.y*l+c.col2.y*a;l=r;r=k.m_sweep.c.x+l-g.m_sweep.c.x-h;var b=k.m_sweep.c.y+a-g.m_sweep.c.y-o;c=Math.sqrt(r*r+b*b);r/=c;b/=c;c=c-this.m_length;c=F.Clamp(c,
-L.b2_maxLinearCorrection,L.b2_maxLinearCorrection);var f=-this.m_mass*c;this.m_u.Set(r,b);r=f*this.m_u.x;b=f*this.m_u.y;g.m_sweep.c.x-=g.m_invMass*r;g.m_sweep.c.y-=g.m_invMass*b;g.m_sweep.a-=g.m_invI*(h*b-o*r);k.m_sweep.c.x+=k.m_invMass*r;k.m_sweep.c.y+=k.m_invMass*b;k.m_sweep.a+=k.m_invI*(l*b-a*r);g.SynchronizeTransform();k.SynchronizeTransform();return F.Abs(c)<L.b2_linearSlop};s.inherit(Box2D.Dynamics.Joints.b2JointDef);s.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;s.b2DistanceJointDef=
function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.localAnchorA=new G;this.localAnchorB=new G};s.prototype.b2DistanceJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_distanceJoint;this.length=1;this.dampingRatio=this.frequencyHz=0};s.prototype.Initialize=function(c,g,k,h){this.bodyA=c;this.bodyB=g;this.localAnchorA.SetV(this.bodyA.GetLocalPoint(k));this.localAnchorB.SetV(this.bodyB.GetLocalPoint(h));c=h.x-k.x;k=h.y-k.y;this.length=Math.sqrt(c*c+k*
k);this.dampingRatio=this.frequencyHz=0};C.inherit(Box2D.Dynamics.Joints.b2Joint);C.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;C.b2FrictionJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_localAnchorA=new G;this.m_localAnchorB=new G;this.m_linearMass=new I;this.m_linearImpulse=new G};C.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA)};C.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB)};
C.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_linearImpulse.x,c*this.m_linearImpulse.y)};C.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;return c*this.m_angularImpulse};C.prototype.SetMaxForce=function(c){if(c===undefined)c=0;this.m_maxForce=c};C.prototype.GetMaxForce=function(){return this.m_maxForce};C.prototype.SetMaxTorque=function(c){if(c===undefined)c=0;this.m_maxTorque=c};C.prototype.GetMaxTorque=function(){return this.m_maxTorque};C.prototype.b2FrictionJoint=
function(c){this.__super.b2Joint.call(this,c);this.m_localAnchorA.SetV(c.localAnchorA);this.m_localAnchorB.SetV(c.localAnchorB);this.m_linearMass.SetZero();this.m_angularMass=0;this.m_linearImpulse.SetZero();this.m_angularImpulse=0;this.m_maxForce=c.maxForce;this.m_maxTorque=c.maxTorque};C.prototype.InitVelocityConstraints=function(c){var g,k=0,h=this.m_bodyA,o=this.m_bodyB;g=h.m_xf.R;var r=this.m_localAnchorA.x-h.m_sweep.localCenter.x,l=this.m_localAnchorA.y-h.m_sweep.localCenter.y;k=g.col1.x*r+
g.col2.x*l;l=g.col1.y*r+g.col2.y*l;r=k;g=o.m_xf.R;var a=this.m_localAnchorB.x-o.m_sweep.localCenter.x,b=this.m_localAnchorB.y-o.m_sweep.localCenter.y;k=g.col1.x*a+g.col2.x*b;b=g.col1.y*a+g.col2.y*b;a=k;g=h.m_invMass;k=o.m_invMass;var f=h.m_invI,m=o.m_invI,p=new I;p.col1.x=g+k;p.col2.x=0;p.col1.y=0;p.col2.y=g+k;p.col1.x+=f*l*l;p.col2.x+=-f*r*l;p.col1.y+=-f*r*l;p.col2.y+=f*r*r;p.col1.x+=m*b*b;p.col2.x+=-m*a*b;p.col1.y+=-m*a*b;p.col2.y+=m*a*a;p.GetInverse(this.m_linearMass);this.m_angularMass=f+m;if(this.m_angularMass>
0)this.m_angularMass=1/this.m_angularMass;if(c.warmStarting){this.m_linearImpulse.x*=c.dtRatio;this.m_linearImpulse.y*=c.dtRatio;this.m_angularImpulse*=c.dtRatio;c=this.m_linearImpulse;h.m_linearVelocity.x-=g*c.x;h.m_linearVelocity.y-=g*c.y;h.m_angularVelocity-=f*(r*c.y-l*c.x+this.m_angularImpulse);o.m_linearVelocity.x+=k*c.x;o.m_linearVelocity.y+=k*c.y;o.m_angularVelocity+=m*(a*c.y-b*c.x+this.m_angularImpulse)}else{this.m_linearImpulse.SetZero();this.m_angularImpulse=0}};C.prototype.SolveVelocityConstraints=
function(c){var g,k=0,h=this.m_bodyA,o=this.m_bodyB,r=h.m_linearVelocity,l=h.m_angularVelocity,a=o.m_linearVelocity,b=o.m_angularVelocity,f=h.m_invMass,m=o.m_invMass,p=h.m_invI,D=o.m_invI;g=h.m_xf.R;var B=this.m_localAnchorA.x-h.m_sweep.localCenter.x,O=this.m_localAnchorA.y-h.m_sweep.localCenter.y;k=g.col1.x*B+g.col2.x*O;O=g.col1.y*B+g.col2.y*O;B=k;g=o.m_xf.R;var W=this.m_localAnchorB.x-o.m_sweep.localCenter.x,ca=this.m_localAnchorB.y-o.m_sweep.localCenter.y;k=g.col1.x*W+g.col2.x*ca;ca=g.col1.y*W+
g.col2.y*ca;W=k;g=0;k=-this.m_angularMass*(b-l);var d=this.m_angularImpulse;g=c.dt*this.m_maxTorque;this.m_angularImpulse=F.Clamp(this.m_angularImpulse+k,-g,g);k=this.m_angularImpulse-d;l-=p*k;b+=D*k;g=F.MulMV(this.m_linearMass,new G(-(a.x-b*ca-r.x+l*O),-(a.y+b*W-r.y-l*B)));k=this.m_linearImpulse.Copy();this.m_linearImpulse.Add(g);g=c.dt*this.m_maxForce;if(this.m_linearImpulse.LengthSquared()>g*g){this.m_linearImpulse.Normalize();this.m_linearImpulse.Multiply(g)}g=F.SubtractVV(this.m_linearImpulse,
k);r.x-=f*g.x;r.y-=f*g.y;l-=p*(B*g.y-O*g.x);a.x+=m*g.x;a.y+=m*g.y;b+=D*(W*g.y-ca*g.x);h.m_angularVelocity=l;o.m_angularVelocity=b};C.prototype.SolvePositionConstraints=function(){return true};R.inherit(Box2D.Dynamics.Joints.b2JointDef);R.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;R.b2FrictionJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.localAnchorA=new G;this.localAnchorB=new G};R.prototype.b2FrictionJointDef=function(){this.__super.b2JointDef.call(this);
this.type=Q.e_frictionJoint;this.maxTorque=this.maxForce=0};R.prototype.Initialize=function(c,g,k){this.bodyA=c;this.bodyB=g;this.localAnchorA.SetV(this.bodyA.GetLocalPoint(k));this.localAnchorB.SetV(this.bodyB.GetLocalPoint(k))};aa.inherit(Box2D.Dynamics.Joints.b2Joint);aa.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;aa.b2GearJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_groundAnchor1=new G;this.m_groundAnchor2=new G;this.m_localAnchor1=new G;this.m_localAnchor2=
new G;this.m_J=new T};aa.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};aa.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};aa.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse*this.m_J.linearB.x,c*this.m_impulse*this.m_J.linearB.y)};aa.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;var g=this.m_bodyB.m_xf.R,k=this.m_localAnchor1.x-this.m_bodyB.m_sweep.localCenter.x,
h=this.m_localAnchor1.y-this.m_bodyB.m_sweep.localCenter.y,o=g.col1.x*k+g.col2.x*h;h=g.col1.y*k+g.col2.y*h;k=o;return c*(this.m_impulse*this.m_J.angularB-k*this.m_impulse*this.m_J.linearB.y+h*this.m_impulse*this.m_J.linearB.x)};aa.prototype.GetRatio=function(){return this.m_ratio};aa.prototype.SetRatio=function(c){if(c===undefined)c=0;this.m_ratio=c};aa.prototype.b2GearJoint=function(c){this.__super.b2Joint.call(this,c);var g=parseInt(c.joint1.m_type),k=parseInt(c.joint2.m_type);this.m_prismatic2=
this.m_revolute2=this.m_prismatic1=this.m_revolute1=null;var h=0,o=0;this.m_ground1=c.joint1.GetBodyA();this.m_bodyA=c.joint1.GetBodyB();if(g==Q.e_revoluteJoint){this.m_revolute1=c.joint1 instanceof V?c.joint1:null;this.m_groundAnchor1.SetV(this.m_revolute1.m_localAnchor1);this.m_localAnchor1.SetV(this.m_revolute1.m_localAnchor2);h=this.m_revolute1.GetJointAngle()}else{this.m_prismatic1=c.joint1 instanceof M?c.joint1:null;this.m_groundAnchor1.SetV(this.m_prismatic1.m_localAnchor1);this.m_localAnchor1.SetV(this.m_prismatic1.m_localAnchor2);
h=this.m_prismatic1.GetJointTranslation()}this.m_ground2=c.joint2.GetBodyA();this.m_bodyB=c.joint2.GetBodyB();if(k==Q.e_revoluteJoint){this.m_revolute2=c.joint2 instanceof V?c.joint2:null;this.m_groundAnchor2.SetV(this.m_revolute2.m_localAnchor1);this.m_localAnchor2.SetV(this.m_revolute2.m_localAnchor2);o=this.m_revolute2.GetJointAngle()}else{this.m_prismatic2=c.joint2 instanceof M?c.joint2:null;this.m_groundAnchor2.SetV(this.m_prismatic2.m_localAnchor1);this.m_localAnchor2.SetV(this.m_prismatic2.m_localAnchor2);
o=this.m_prismatic2.GetJointTranslation()}this.m_ratio=c.ratio;this.m_constant=h+this.m_ratio*o;this.m_impulse=0};aa.prototype.InitVelocityConstraints=function(c){var g=this.m_ground1,k=this.m_ground2,h=this.m_bodyA,o=this.m_bodyB,r=0,l=0,a=0,b=0,f=a=0,m=0;this.m_J.SetZero();if(this.m_revolute1){this.m_J.angularA=-1;m+=h.m_invI}else{g=g.m_xf.R;l=this.m_prismatic1.m_localXAxis1;r=g.col1.x*l.x+g.col2.x*l.y;l=g.col1.y*l.x+g.col2.y*l.y;g=h.m_xf.R;a=this.m_localAnchor1.x-h.m_sweep.localCenter.x;b=this.m_localAnchor1.y-
h.m_sweep.localCenter.y;f=g.col1.x*a+g.col2.x*b;b=g.col1.y*a+g.col2.y*b;a=f;a=a*l-b*r;this.m_J.linearA.Set(-r,-l);this.m_J.angularA=-a;m+=h.m_invMass+h.m_invI*a*a}if(this.m_revolute2){this.m_J.angularB=-this.m_ratio;m+=this.m_ratio*this.m_ratio*o.m_invI}else{g=k.m_xf.R;l=this.m_prismatic2.m_localXAxis1;r=g.col1.x*l.x+g.col2.x*l.y;l=g.col1.y*l.x+g.col2.y*l.y;g=o.m_xf.R;a=this.m_localAnchor2.x-o.m_sweep.localCenter.x;b=this.m_localAnchor2.y-o.m_sweep.localCenter.y;f=g.col1.x*a+g.col2.x*b;b=g.col1.y*
a+g.col2.y*b;a=f;a=a*l-b*r;this.m_J.linearB.Set(-this.m_ratio*r,-this.m_ratio*l);this.m_J.angularB=-this.m_ratio*a;m+=this.m_ratio*this.m_ratio*(o.m_invMass+o.m_invI*a*a)}this.m_mass=m>0?1/m:0;if(c.warmStarting){h.m_linearVelocity.x+=h.m_invMass*this.m_impulse*this.m_J.linearA.x;h.m_linearVelocity.y+=h.m_invMass*this.m_impulse*this.m_J.linearA.y;h.m_angularVelocity+=h.m_invI*this.m_impulse*this.m_J.angularA;o.m_linearVelocity.x+=o.m_invMass*this.m_impulse*this.m_J.linearB.x;o.m_linearVelocity.y+=
o.m_invMass*this.m_impulse*this.m_J.linearB.y;o.m_angularVelocity+=o.m_invI*this.m_impulse*this.m_J.angularB}else this.m_impulse=0};aa.prototype.SolveVelocityConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k=-this.m_mass*this.m_J.Compute(c.m_linearVelocity,c.m_angularVelocity,g.m_linearVelocity,g.m_angularVelocity);this.m_impulse+=k;c.m_linearVelocity.x+=c.m_invMass*k*this.m_J.linearA.x;c.m_linearVelocity.y+=c.m_invMass*k*this.m_J.linearA.y;c.m_angularVelocity+=c.m_invI*k*this.m_J.angularA;
g.m_linearVelocity.x+=g.m_invMass*k*this.m_J.linearB.x;g.m_linearVelocity.y+=g.m_invMass*k*this.m_J.linearB.y;g.m_angularVelocity+=g.m_invI*k*this.m_J.angularB};aa.prototype.SolvePositionConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k=0,h=0;k=this.m_revolute1?this.m_revolute1.GetJointAngle():this.m_prismatic1.GetJointTranslation();h=this.m_revolute2?this.m_revolute2.GetJointAngle():this.m_prismatic2.GetJointTranslation();k=-this.m_mass*(this.m_constant-(k+this.m_ratio*h));c.m_sweep.c.x+=
c.m_invMass*k*this.m_J.linearA.x;c.m_sweep.c.y+=c.m_invMass*k*this.m_J.linearA.y;c.m_sweep.a+=c.m_invI*k*this.m_J.angularA;g.m_sweep.c.x+=g.m_invMass*k*this.m_J.linearB.x;g.m_sweep.c.y+=g.m_invMass*k*this.m_J.linearB.y;g.m_sweep.a+=g.m_invI*k*this.m_J.angularB;c.SynchronizeTransform();g.SynchronizeTransform();return 0<L.b2_linearSlop};$.inherit(Box2D.Dynamics.Joints.b2JointDef);$.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;$.b2GearJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,
arguments)};$.prototype.b2GearJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_gearJoint;this.joint2=this.joint1=null;this.ratio=1};T.b2Jacobian=function(){this.linearA=new G;this.linearB=new G};T.prototype.SetZero=function(){this.linearA.SetZero();this.angularA=0;this.linearB.SetZero();this.angularB=0};T.prototype.Set=function(c,g,k,h){if(g===undefined)g=0;if(h===undefined)h=0;this.linearA.SetV(c);this.angularA=g;this.linearB.SetV(k);this.angularB=h};T.prototype.Compute=function(c,
g,k,h){if(g===undefined)g=0;if(h===undefined)h=0;return this.linearA.x*c.x+this.linearA.y*c.y+this.angularA*g+(this.linearB.x*k.x+this.linearB.y*k.y)+this.angularB*h};Q.b2Joint=function(){this.m_edgeA=new da;this.m_edgeB=new da;this.m_localCenterA=new G;this.m_localCenterB=new G};Q.prototype.GetType=function(){return this.m_type};Q.prototype.GetAnchorA=function(){return null};Q.prototype.GetAnchorB=function(){return null};Q.prototype.GetReactionForce=function(){return null};Q.prototype.GetReactionTorque=
function(){return 0};Q.prototype.GetBodyA=function(){return this.m_bodyA};Q.prototype.GetBodyB=function(){return this.m_bodyB};Q.prototype.GetNext=function(){return this.m_next};Q.prototype.GetUserData=function(){return this.m_userData};Q.prototype.SetUserData=function(c){this.m_userData=c};Q.prototype.IsActive=function(){return this.m_bodyA.IsActive()&&this.m_bodyB.IsActive()};Q.prototype.Create=function(c){var g=null;switch(c.type){case Q.e_distanceJoint:g=new N(c instanceof s?c:null);break;case Q.e_mouseJoint:g=
new x(c instanceof J?c:null);break;case Q.e_prismaticJoint:g=new M(c instanceof U?c:null);break;case Q.e_revoluteJoint:g=new V(c instanceof Z?c:null);break;case Q.e_pulleyJoint:g=new K(c instanceof ba?c:null);break;case Q.e_gearJoint:g=new aa(c instanceof $?c:null);break;case Q.e_lineJoint:g=new j(c instanceof y?c:null);break;case Q.e_weldJoint:g=new ga(c instanceof fa?c:null);break;case Q.e_frictionJoint:g=new C(c instanceof R?c:null)}return g};Q.Create=Q.prototype.Create;Q.prototype.Destroy=function(){};
Q.Destroy=Q.prototype.Destroy;Q.prototype.b2Joint=function(c){L.b2Assert(c.bodyA!=c.bodyB);this.m_type=c.type;this.m_next=this.m_prev=null;this.m_bodyA=c.bodyA;this.m_bodyB=c.bodyB;this.m_collideConnected=c.collideConnected;this.m_islandFlag=false;this.m_userData=c.userData};Q.prototype.InitVelocityConstraints=function(){};Q.prototype.SolveVelocityConstraints=function(){};Q.prototype.FinalizeVelocityConstraints=function(){};Q.prototype.SolvePositionConstraints=function(){return false};_A2J_postDefs.push(function(){Box2D.Dynamics.Joints.b2Joint.e_unknownJoint=
0;Box2D.Dynamics.Joints.b2Joint.prototype.e_unknownJoint=Box2D.Dynamics.Joints.b2Joint.e_unknownJoint;Box2D.Dynamics.Joints.b2Joint.e_revoluteJoint=1;Box2D.Dynamics.Joints.b2Joint.prototype.e_revoluteJoint=Box2D.Dynamics.Joints.b2Joint.e_revoluteJoint;Box2D.Dynamics.Joints.b2Joint.e_prismaticJoint=2;Box2D.Dynamics.Joints.b2Joint.prototype.e_prismaticJoint=Box2D.Dynamics.Joints.b2Joint.e_prismaticJoint;Box2D.Dynamics.Joints.b2Joint.e_distanceJoint=3;Box2D.Dynamics.Joints.b2Joint.prototype.e_distanceJoint=
Box2D.Dynamics.Joints.b2Joint.e_distanceJoint;Box2D.Dynamics.Joints.b2Joint.e_pulleyJoint=4;Box2D.Dynamics.Joints.b2Joint.prototype.e_pulleyJoint=Box2D.Dynamics.Joints.b2Joint.e_pulleyJoint;Box2D.Dynamics.Joints.b2Joint.e_mouseJoint=5;Box2D.Dynamics.Joints.b2Joint.prototype.e_mouseJoint=Box2D.Dynamics.Joints.b2Joint.e_mouseJoint;Box2D.Dynamics.Joints.b2Joint.e_gearJoint=6;Box2D.Dynamics.Joints.b2Joint.prototype.e_gearJoint=Box2D.Dynamics.Joints.b2Joint.e_gearJoint;Box2D.Dynamics.Joints.b2Joint.e_lineJoint=
7;Box2D.Dynamics.Joints.b2Joint.prototype.e_lineJoint=Box2D.Dynamics.Joints.b2Joint.e_lineJoint;Box2D.Dynamics.Joints.b2Joint.e_weldJoint=8;Box2D.Dynamics.Joints.b2Joint.prototype.e_weldJoint=Box2D.Dynamics.Joints.b2Joint.e_weldJoint;Box2D.Dynamics.Joints.b2Joint.e_frictionJoint=9;Box2D.Dynamics.Joints.b2Joint.prototype.e_frictionJoint=Box2D.Dynamics.Joints.b2Joint.e_frictionJoint;Box2D.Dynamics.Joints.b2Joint.e_inactiveLimit=0;Box2D.Dynamics.Joints.b2Joint.prototype.e_inactiveLimit=Box2D.Dynamics.Joints.b2Joint.e_inactiveLimit;
Box2D.Dynamics.Joints.b2Joint.e_atLowerLimit=1;Box2D.Dynamics.Joints.b2Joint.prototype.e_atLowerLimit=Box2D.Dynamics.Joints.b2Joint.e_atLowerLimit;Box2D.Dynamics.Joints.b2Joint.e_atUpperLimit=2;Box2D.Dynamics.Joints.b2Joint.prototype.e_atUpperLimit=Box2D.Dynamics.Joints.b2Joint.e_atUpperLimit;Box2D.Dynamics.Joints.b2Joint.e_equalLimits=3;Box2D.Dynamics.Joints.b2Joint.prototype.e_equalLimits=Box2D.Dynamics.Joints.b2Joint.e_equalLimits});X.b2JointDef=function(){};X.prototype.b2JointDef=function(){this.type=
Q.e_unknownJoint;this.bodyB=this.bodyA=this.userData=null;this.collideConnected=false};da.b2JointEdge=function(){};j.inherit(Box2D.Dynamics.Joints.b2Joint);j.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;j.b2LineJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_localAnchor1=new G;this.m_localAnchor2=new G;this.m_localXAxis1=new G;this.m_localYAxis1=new G;this.m_axis=new G;this.m_perp=new G;this.m_K=new I;this.m_impulse=new G};j.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};
j.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};j.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*(this.m_impulse.x*this.m_perp.x+(this.m_motorImpulse+this.m_impulse.y)*this.m_axis.x),c*(this.m_impulse.x*this.m_perp.y+(this.m_motorImpulse+this.m_impulse.y)*this.m_axis.y))};j.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;return c*this.m_impulse.y};j.prototype.GetJointTranslation=function(){var c=this.m_bodyA,g=this.m_bodyB,
k=c.GetWorldPoint(this.m_localAnchor1),h=g.GetWorldPoint(this.m_localAnchor2);g=h.x-k.x;k=h.y-k.y;c=c.GetWorldVector(this.m_localXAxis1);return c.x*g+c.y*k};j.prototype.GetJointSpeed=function(){var c=this.m_bodyA,g=this.m_bodyB,k;k=c.m_xf.R;var h=this.m_localAnchor1.x-c.m_sweep.localCenter.x,o=this.m_localAnchor1.y-c.m_sweep.localCenter.y,r=k.col1.x*h+k.col2.x*o;o=k.col1.y*h+k.col2.y*o;h=r;k=g.m_xf.R;var l=this.m_localAnchor2.x-g.m_sweep.localCenter.x,a=this.m_localAnchor2.y-g.m_sweep.localCenter.y;
r=k.col1.x*l+k.col2.x*a;a=k.col1.y*l+k.col2.y*a;l=r;k=g.m_sweep.c.x+l-(c.m_sweep.c.x+h);r=g.m_sweep.c.y+a-(c.m_sweep.c.y+o);var b=c.GetWorldVector(this.m_localXAxis1),f=c.m_linearVelocity,m=g.m_linearVelocity;c=c.m_angularVelocity;g=g.m_angularVelocity;return k*-c*b.y+r*c*b.x+(b.x*(m.x+-g*a-f.x- -c*o)+b.y*(m.y+g*l-f.y-c*h))};j.prototype.IsLimitEnabled=function(){return this.m_enableLimit};j.prototype.EnableLimit=function(c){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableLimit=
c};j.prototype.GetLowerLimit=function(){return this.m_lowerTranslation};j.prototype.GetUpperLimit=function(){return this.m_upperTranslation};j.prototype.SetLimits=function(c,g){if(c===undefined)c=0;if(g===undefined)g=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_lowerTranslation=c;this.m_upperTranslation=g};j.prototype.IsMotorEnabled=function(){return this.m_enableMotor};j.prototype.EnableMotor=function(c){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableMotor=
c};j.prototype.SetMotorSpeed=function(c){if(c===undefined)c=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=c};j.prototype.GetMotorSpeed=function(){return this.m_motorSpeed};j.prototype.SetMaxMotorForce=function(c){if(c===undefined)c=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_maxMotorForce=c};j.prototype.GetMaxMotorForce=function(){return this.m_maxMotorForce};j.prototype.GetMotorForce=function(){return this.m_motorImpulse};j.prototype.b2LineJoint=
function(c){this.__super.b2Joint.call(this,c);this.m_localAnchor1.SetV(c.localAnchorA);this.m_localAnchor2.SetV(c.localAnchorB);this.m_localXAxis1.SetV(c.localAxisA);this.m_localYAxis1.x=-this.m_localXAxis1.y;this.m_localYAxis1.y=this.m_localXAxis1.x;this.m_impulse.SetZero();this.m_motorImpulse=this.m_motorMass=0;this.m_lowerTranslation=c.lowerTranslation;this.m_upperTranslation=c.upperTranslation;this.m_maxMotorForce=c.maxMotorForce;this.m_motorSpeed=c.motorSpeed;this.m_enableLimit=c.enableLimit;
this.m_enableMotor=c.enableMotor;this.m_limitState=this.e_inactiveLimit;this.m_axis.SetZero();this.m_perp.SetZero()};j.prototype.InitVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,h,o=0;this.m_localCenterA.SetV(g.GetLocalCenter());this.m_localCenterB.SetV(k.GetLocalCenter());var r=g.GetTransform();k.GetTransform();h=g.m_xf.R;var l=this.m_localAnchor1.x-this.m_localCenterA.x,a=this.m_localAnchor1.y-this.m_localCenterA.y;o=h.col1.x*l+h.col2.x*a;a=h.col1.y*l+h.col2.y*a;l=o;h=k.m_xf.R;
var b=this.m_localAnchor2.x-this.m_localCenterB.x,f=this.m_localAnchor2.y-this.m_localCenterB.y;o=h.col1.x*b+h.col2.x*f;f=h.col1.y*b+h.col2.y*f;b=o;h=k.m_sweep.c.x+b-g.m_sweep.c.x-l;o=k.m_sweep.c.y+f-g.m_sweep.c.y-a;this.m_invMassA=g.m_invMass;this.m_invMassB=k.m_invMass;this.m_invIA=g.m_invI;this.m_invIB=k.m_invI;this.m_axis.SetV(F.MulMV(r.R,this.m_localXAxis1));this.m_a1=(h+l)*this.m_axis.y-(o+a)*this.m_axis.x;this.m_a2=b*this.m_axis.y-f*this.m_axis.x;this.m_motorMass=this.m_invMassA+this.m_invMassB+
this.m_invIA*this.m_a1*this.m_a1+this.m_invIB*this.m_a2*this.m_a2;this.m_motorMass=this.m_motorMass>Number.MIN_VALUE?1/this.m_motorMass:0;this.m_perp.SetV(F.MulMV(r.R,this.m_localYAxis1));this.m_s1=(h+l)*this.m_perp.y-(o+a)*this.m_perp.x;this.m_s2=b*this.m_perp.y-f*this.m_perp.x;r=this.m_invMassA;l=this.m_invMassB;a=this.m_invIA;b=this.m_invIB;this.m_K.col1.x=r+l+a*this.m_s1*this.m_s1+b*this.m_s2*this.m_s2;this.m_K.col1.y=a*this.m_s1*this.m_a1+b*this.m_s2*this.m_a2;this.m_K.col2.x=this.m_K.col1.y;
this.m_K.col2.y=r+l+a*this.m_a1*this.m_a1+b*this.m_a2*this.m_a2;if(this.m_enableLimit){h=this.m_axis.x*h+this.m_axis.y*o;if(F.Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*L.b2_linearSlop)this.m_limitState=this.e_equalLimits;else if(h<=this.m_lowerTranslation){if(this.m_limitState!=this.e_atLowerLimit){this.m_limitState=this.e_atLowerLimit;this.m_impulse.y=0}}else if(h>=this.m_upperTranslation){if(this.m_limitState!=this.e_atUpperLimit){this.m_limitState=this.e_atUpperLimit;this.m_impulse.y=
0}}else{this.m_limitState=this.e_inactiveLimit;this.m_impulse.y=0}}else this.m_limitState=this.e_inactiveLimit;if(this.m_enableMotor==false)this.m_motorImpulse=0;if(c.warmStarting){this.m_impulse.x*=c.dtRatio;this.m_impulse.y*=c.dtRatio;this.m_motorImpulse*=c.dtRatio;c=this.m_impulse.x*this.m_perp.x+(this.m_motorImpulse+this.m_impulse.y)*this.m_axis.x;h=this.m_impulse.x*this.m_perp.y+(this.m_motorImpulse+this.m_impulse.y)*this.m_axis.y;o=this.m_impulse.x*this.m_s1+(this.m_motorImpulse+this.m_impulse.y)*
this.m_a1;r=this.m_impulse.x*this.m_s2+(this.m_motorImpulse+this.m_impulse.y)*this.m_a2;g.m_linearVelocity.x-=this.m_invMassA*c;g.m_linearVelocity.y-=this.m_invMassA*h;g.m_angularVelocity-=this.m_invIA*o;k.m_linearVelocity.x+=this.m_invMassB*c;k.m_linearVelocity.y+=this.m_invMassB*h;k.m_angularVelocity+=this.m_invIB*r}else{this.m_impulse.SetZero();this.m_motorImpulse=0}};j.prototype.SolveVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,h=g.m_linearVelocity,o=g.m_angularVelocity,r=
k.m_linearVelocity,l=k.m_angularVelocity,a=0,b=0,f=0,m=0;if(this.m_enableMotor&&this.m_limitState!=this.e_equalLimits){m=this.m_motorMass*(this.m_motorSpeed-(this.m_axis.x*(r.x-h.x)+this.m_axis.y*(r.y-h.y)+this.m_a2*l-this.m_a1*o));a=this.m_motorImpulse;b=c.dt*this.m_maxMotorForce;this.m_motorImpulse=F.Clamp(this.m_motorImpulse+m,-b,b);m=this.m_motorImpulse-a;a=m*this.m_axis.x;b=m*this.m_axis.y;f=m*this.m_a1;m=m*this.m_a2;h.x-=this.m_invMassA*a;h.y-=this.m_invMassA*b;o-=this.m_invIA*f;r.x+=this.m_invMassB*
a;r.y+=this.m_invMassB*b;l+=this.m_invIB*m}b=this.m_perp.x*(r.x-h.x)+this.m_perp.y*(r.y-h.y)+this.m_s2*l-this.m_s1*o;if(this.m_enableLimit&&this.m_limitState!=this.e_inactiveLimit){f=this.m_axis.x*(r.x-h.x)+this.m_axis.y*(r.y-h.y)+this.m_a2*l-this.m_a1*o;a=this.m_impulse.Copy();c=this.m_K.Solve(new G,-b,-f);this.m_impulse.Add(c);if(this.m_limitState==this.e_atLowerLimit)this.m_impulse.y=F.Max(this.m_impulse.y,0);else if(this.m_limitState==this.e_atUpperLimit)this.m_impulse.y=F.Min(this.m_impulse.y,
0);b=-b-(this.m_impulse.y-a.y)*this.m_K.col2.x;f=0;f=this.m_K.col1.x!=0?b/this.m_K.col1.x+a.x:a.x;this.m_impulse.x=f;c.x=this.m_impulse.x-a.x;c.y=this.m_impulse.y-a.y;a=c.x*this.m_perp.x+c.y*this.m_axis.x;b=c.x*this.m_perp.y+c.y*this.m_axis.y;f=c.x*this.m_s1+c.y*this.m_a1;m=c.x*this.m_s2+c.y*this.m_a2}else{c=0;c=this.m_K.col1.x!=0?-b/this.m_K.col1.x:0;this.m_impulse.x+=c;a=c*this.m_perp.x;b=c*this.m_perp.y;f=c*this.m_s1;m=c*this.m_s2}h.x-=this.m_invMassA*a;h.y-=this.m_invMassA*b;o-=this.m_invIA*f;
r.x+=this.m_invMassB*a;r.y+=this.m_invMassB*b;l+=this.m_invIB*m;g.m_linearVelocity.SetV(h);g.m_angularVelocity=o;k.m_linearVelocity.SetV(r);k.m_angularVelocity=l};j.prototype.SolvePositionConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k=c.m_sweep.c,h=c.m_sweep.a,o=g.m_sweep.c,r=g.m_sweep.a,l,a=0,b=0,f=0,m=0,p=l=0,D=0;b=false;var B=0,O=I.FromAngle(h);f=I.FromAngle(r);l=O;D=this.m_localAnchor1.x-this.m_localCenterA.x;var W=this.m_localAnchor1.y-this.m_localCenterA.y;a=l.col1.x*D+l.col2.x*
W;W=l.col1.y*D+l.col2.y*W;D=a;l=f;f=this.m_localAnchor2.x-this.m_localCenterB.x;m=this.m_localAnchor2.y-this.m_localCenterB.y;a=l.col1.x*f+l.col2.x*m;m=l.col1.y*f+l.col2.y*m;f=a;l=o.x+f-k.x-D;a=o.y+m-k.y-W;if(this.m_enableLimit){this.m_axis=F.MulMV(O,this.m_localXAxis1);this.m_a1=(l+D)*this.m_axis.y-(a+W)*this.m_axis.x;this.m_a2=f*this.m_axis.y-m*this.m_axis.x;var ca=this.m_axis.x*l+this.m_axis.y*a;if(F.Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*L.b2_linearSlop){B=F.Clamp(ca,-L.b2_maxLinearCorrection,
L.b2_maxLinearCorrection);p=F.Abs(ca);b=true}else if(ca<=this.m_lowerTranslation){B=F.Clamp(ca-this.m_lowerTranslation+L.b2_linearSlop,-L.b2_maxLinearCorrection,0);p=this.m_lowerTranslation-ca;b=true}else if(ca>=this.m_upperTranslation){B=F.Clamp(ca-this.m_upperTranslation+L.b2_linearSlop,0,L.b2_maxLinearCorrection);p=ca-this.m_upperTranslation;b=true}}this.m_perp=F.MulMV(O,this.m_localYAxis1);this.m_s1=(l+D)*this.m_perp.y-(a+W)*this.m_perp.x;this.m_s2=f*this.m_perp.y-m*this.m_perp.x;O=new G;W=this.m_perp.x*
l+this.m_perp.y*a;p=F.Max(p,F.Abs(W));D=0;if(b){b=this.m_invMassA;f=this.m_invMassB;m=this.m_invIA;l=this.m_invIB;this.m_K.col1.x=b+f+m*this.m_s1*this.m_s1+l*this.m_s2*this.m_s2;this.m_K.col1.y=m*this.m_s1*this.m_a1+l*this.m_s2*this.m_a2;this.m_K.col2.x=this.m_K.col1.y;this.m_K.col2.y=b+f+m*this.m_a1*this.m_a1+l*this.m_a2*this.m_a2;this.m_K.Solve(O,-W,-B)}else{b=this.m_invMassA;f=this.m_invMassB;m=this.m_invIA;l=this.m_invIB;B=b+f+m*this.m_s1*this.m_s1+l*this.m_s2*this.m_s2;b=0;b=B!=0?-W/B:0;O.x=
b;O.y=0}B=O.x*this.m_perp.x+O.y*this.m_axis.x;b=O.x*this.m_perp.y+O.y*this.m_axis.y;W=O.x*this.m_s1+O.y*this.m_a1;O=O.x*this.m_s2+O.y*this.m_a2;k.x-=this.m_invMassA*B;k.y-=this.m_invMassA*b;h-=this.m_invIA*W;o.x+=this.m_invMassB*B;o.y+=this.m_invMassB*b;r+=this.m_invIB*O;c.m_sweep.a=h;g.m_sweep.a=r;c.SynchronizeTransform();g.SynchronizeTransform();return p<=L.b2_linearSlop&&D<=L.b2_angularSlop};y.inherit(Box2D.Dynamics.Joints.b2JointDef);y.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;
y.b2LineJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.localAnchorA=new G;this.localAnchorB=new G;this.localAxisA=new G};y.prototype.b2LineJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_lineJoint;this.localAxisA.Set(1,0);this.enableLimit=false;this.upperTranslation=this.lowerTranslation=0;this.enableMotor=false;this.motorSpeed=this.maxMotorForce=0};y.prototype.Initialize=function(c,g,k,h){this.bodyA=c;this.bodyB=g;this.localAnchorA=
this.bodyA.GetLocalPoint(k);this.localAnchorB=this.bodyB.GetLocalPoint(k);this.localAxisA=this.bodyA.GetLocalVector(h)};x.inherit(Box2D.Dynamics.Joints.b2Joint);x.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;x.b2MouseJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.K=new I;this.K1=new I;this.K2=new I;this.m_localAnchor=new G;this.m_target=new G;this.m_impulse=new G;this.m_mass=new I;this.m_C=new G};x.prototype.GetAnchorA=function(){return this.m_target};
x.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor)};x.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse.x,c*this.m_impulse.y)};x.prototype.GetReactionTorque=function(){return 0};x.prototype.GetTarget=function(){return this.m_target};x.prototype.SetTarget=function(c){this.m_bodyB.IsAwake()==false&&this.m_bodyB.SetAwake(true);this.m_target=c};x.prototype.GetMaxForce=function(){return this.m_maxForce};x.prototype.SetMaxForce=
function(c){if(c===undefined)c=0;this.m_maxForce=c};x.prototype.GetFrequency=function(){return this.m_frequencyHz};x.prototype.SetFrequency=function(c){if(c===undefined)c=0;this.m_frequencyHz=c};x.prototype.GetDampingRatio=function(){return this.m_dampingRatio};x.prototype.SetDampingRatio=function(c){if(c===undefined)c=0;this.m_dampingRatio=c};x.prototype.b2MouseJoint=function(c){this.__super.b2Joint.call(this,c);this.m_target.SetV(c.target);var g=this.m_target.x-this.m_bodyB.m_xf.position.x,k=this.m_target.y-
this.m_bodyB.m_xf.position.y,h=this.m_bodyB.m_xf.R;this.m_localAnchor.x=g*h.col1.x+k*h.col1.y;this.m_localAnchor.y=g*h.col2.x+k*h.col2.y;this.m_maxForce=c.maxForce;this.m_impulse.SetZero();this.m_frequencyHz=c.frequencyHz;this.m_dampingRatio=c.dampingRatio;this.m_gamma=this.m_beta=0};x.prototype.InitVelocityConstraints=function(c){var g=this.m_bodyB,k=g.GetMass(),h=2*Math.PI*this.m_frequencyHz,o=k*h*h;this.m_gamma=c.dt*(2*k*this.m_dampingRatio*h+c.dt*o);this.m_gamma=this.m_gamma!=0?1/this.m_gamma:
0;this.m_beta=c.dt*o*this.m_gamma;o=g.m_xf.R;k=this.m_localAnchor.x-g.m_sweep.localCenter.x;h=this.m_localAnchor.y-g.m_sweep.localCenter.y;var r=o.col1.x*k+o.col2.x*h;h=o.col1.y*k+o.col2.y*h;k=r;o=g.m_invMass;r=g.m_invI;this.K1.col1.x=o;this.K1.col2.x=0;this.K1.col1.y=0;this.K1.col2.y=o;this.K2.col1.x=r*h*h;this.K2.col2.x=-r*k*h;this.K2.col1.y=-r*k*h;this.K2.col2.y=r*k*k;this.K.SetM(this.K1);this.K.AddM(this.K2);this.K.col1.x+=this.m_gamma;this.K.col2.y+=this.m_gamma;this.K.GetInverse(this.m_mass);
this.m_C.x=g.m_sweep.c.x+k-this.m_target.x;this.m_C.y=g.m_sweep.c.y+h-this.m_target.y;g.m_angularVelocity*=0.98;this.m_impulse.x*=c.dtRatio;this.m_impulse.y*=c.dtRatio;g.m_linearVelocity.x+=o*this.m_impulse.x;g.m_linearVelocity.y+=o*this.m_impulse.y;g.m_angularVelocity+=r*(k*this.m_impulse.y-h*this.m_impulse.x)};x.prototype.SolveVelocityConstraints=function(c){var g=this.m_bodyB,k,h=0,o=0;k=g.m_xf.R;var r=this.m_localAnchor.x-g.m_sweep.localCenter.x,l=this.m_localAnchor.y-g.m_sweep.localCenter.y;
h=k.col1.x*r+k.col2.x*l;l=k.col1.y*r+k.col2.y*l;r=h;h=g.m_linearVelocity.x+-g.m_angularVelocity*l;var a=g.m_linearVelocity.y+g.m_angularVelocity*r;k=this.m_mass;h=h+this.m_beta*this.m_C.x+this.m_gamma*this.m_impulse.x;o=a+this.m_beta*this.m_C.y+this.m_gamma*this.m_impulse.y;a=-(k.col1.x*h+k.col2.x*o);o=-(k.col1.y*h+k.col2.y*o);k=this.m_impulse.x;h=this.m_impulse.y;this.m_impulse.x+=a;this.m_impulse.y+=o;c=c.dt*this.m_maxForce;this.m_impulse.LengthSquared()>c*c&&this.m_impulse.Multiply(c/this.m_impulse.Length());
a=this.m_impulse.x-k;o=this.m_impulse.y-h;g.m_linearVelocity.x+=g.m_invMass*a;g.m_linearVelocity.y+=g.m_invMass*o;g.m_angularVelocity+=g.m_invI*(r*o-l*a)};x.prototype.SolvePositionConstraints=function(){return true};J.inherit(Box2D.Dynamics.Joints.b2JointDef);J.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;J.b2MouseJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.target=new G};J.prototype.b2MouseJointDef=function(){this.__super.b2JointDef.call(this);
this.type=Q.e_mouseJoint;this.maxForce=0;this.frequencyHz=5;this.dampingRatio=0.7};M.inherit(Box2D.Dynamics.Joints.b2Joint);M.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;M.b2PrismaticJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_localAnchor1=new G;this.m_localAnchor2=new G;this.m_localXAxis1=new G;this.m_localYAxis1=new G;this.m_axis=new G;this.m_perp=new G;this.m_K=new H;this.m_impulse=new A};M.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};
M.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};M.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*(this.m_impulse.x*this.m_perp.x+(this.m_motorImpulse+this.m_impulse.z)*this.m_axis.x),c*(this.m_impulse.x*this.m_perp.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_axis.y))};M.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;return c*this.m_impulse.y};M.prototype.GetJointTranslation=function(){var c=this.m_bodyA,g=this.m_bodyB,
k=c.GetWorldPoint(this.m_localAnchor1),h=g.GetWorldPoint(this.m_localAnchor2);g=h.x-k.x;k=h.y-k.y;c=c.GetWorldVector(this.m_localXAxis1);return c.x*g+c.y*k};M.prototype.GetJointSpeed=function(){var c=this.m_bodyA,g=this.m_bodyB,k;k=c.m_xf.R;var h=this.m_localAnchor1.x-c.m_sweep.localCenter.x,o=this.m_localAnchor1.y-c.m_sweep.localCenter.y,r=k.col1.x*h+k.col2.x*o;o=k.col1.y*h+k.col2.y*o;h=r;k=g.m_xf.R;var l=this.m_localAnchor2.x-g.m_sweep.localCenter.x,a=this.m_localAnchor2.y-g.m_sweep.localCenter.y;
r=k.col1.x*l+k.col2.x*a;a=k.col1.y*l+k.col2.y*a;l=r;k=g.m_sweep.c.x+l-(c.m_sweep.c.x+h);r=g.m_sweep.c.y+a-(c.m_sweep.c.y+o);var b=c.GetWorldVector(this.m_localXAxis1),f=c.m_linearVelocity,m=g.m_linearVelocity;c=c.m_angularVelocity;g=g.m_angularVelocity;return k*-c*b.y+r*c*b.x+(b.x*(m.x+-g*a-f.x- -c*o)+b.y*(m.y+g*l-f.y-c*h))};M.prototype.IsLimitEnabled=function(){return this.m_enableLimit};M.prototype.EnableLimit=function(c){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableLimit=
c};M.prototype.GetLowerLimit=function(){return this.m_lowerTranslation};M.prototype.GetUpperLimit=function(){return this.m_upperTranslation};M.prototype.SetLimits=function(c,g){if(c===undefined)c=0;if(g===undefined)g=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_lowerTranslation=c;this.m_upperTranslation=g};M.prototype.IsMotorEnabled=function(){return this.m_enableMotor};M.prototype.EnableMotor=function(c){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableMotor=
c};M.prototype.SetMotorSpeed=function(c){if(c===undefined)c=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=c};M.prototype.GetMotorSpeed=function(){return this.m_motorSpeed};M.prototype.SetMaxMotorForce=function(c){if(c===undefined)c=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_maxMotorForce=c};M.prototype.GetMotorForce=function(){return this.m_motorImpulse};M.prototype.b2PrismaticJoint=function(c){this.__super.b2Joint.call(this,c);this.m_localAnchor1.SetV(c.localAnchorA);
this.m_localAnchor2.SetV(c.localAnchorB);this.m_localXAxis1.SetV(c.localAxisA);this.m_localYAxis1.x=-this.m_localXAxis1.y;this.m_localYAxis1.y=this.m_localXAxis1.x;this.m_refAngle=c.referenceAngle;this.m_impulse.SetZero();this.m_motorImpulse=this.m_motorMass=0;this.m_lowerTranslation=c.lowerTranslation;this.m_upperTranslation=c.upperTranslation;this.m_maxMotorForce=c.maxMotorForce;this.m_motorSpeed=c.motorSpeed;this.m_enableLimit=c.enableLimit;this.m_enableMotor=c.enableMotor;this.m_limitState=this.e_inactiveLimit;
this.m_axis.SetZero();this.m_perp.SetZero()};M.prototype.InitVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,h,o=0;this.m_localCenterA.SetV(g.GetLocalCenter());this.m_localCenterB.SetV(k.GetLocalCenter());var r=g.GetTransform();k.GetTransform();h=g.m_xf.R;var l=this.m_localAnchor1.x-this.m_localCenterA.x,a=this.m_localAnchor1.y-this.m_localCenterA.y;o=h.col1.x*l+h.col2.x*a;a=h.col1.y*l+h.col2.y*a;l=o;h=k.m_xf.R;var b=this.m_localAnchor2.x-this.m_localCenterB.x,f=this.m_localAnchor2.y-
this.m_localCenterB.y;o=h.col1.x*b+h.col2.x*f;f=h.col1.y*b+h.col2.y*f;b=o;h=k.m_sweep.c.x+b-g.m_sweep.c.x-l;o=k.m_sweep.c.y+f-g.m_sweep.c.y-a;this.m_invMassA=g.m_invMass;this.m_invMassB=k.m_invMass;this.m_invIA=g.m_invI;this.m_invIB=k.m_invI;this.m_axis.SetV(F.MulMV(r.R,this.m_localXAxis1));this.m_a1=(h+l)*this.m_axis.y-(o+a)*this.m_axis.x;this.m_a2=b*this.m_axis.y-f*this.m_axis.x;this.m_motorMass=this.m_invMassA+this.m_invMassB+this.m_invIA*this.m_a1*this.m_a1+this.m_invIB*this.m_a2*this.m_a2;if(this.m_motorMass>
Number.MIN_VALUE)this.m_motorMass=1/this.m_motorMass;this.m_perp.SetV(F.MulMV(r.R,this.m_localYAxis1));this.m_s1=(h+l)*this.m_perp.y-(o+a)*this.m_perp.x;this.m_s2=b*this.m_perp.y-f*this.m_perp.x;r=this.m_invMassA;l=this.m_invMassB;a=this.m_invIA;b=this.m_invIB;this.m_K.col1.x=r+l+a*this.m_s1*this.m_s1+b*this.m_s2*this.m_s2;this.m_K.col1.y=a*this.m_s1+b*this.m_s2;this.m_K.col1.z=a*this.m_s1*this.m_a1+b*this.m_s2*this.m_a2;this.m_K.col2.x=this.m_K.col1.y;this.m_K.col2.y=a+b;this.m_K.col2.z=a*this.m_a1+
b*this.m_a2;this.m_K.col3.x=this.m_K.col1.z;this.m_K.col3.y=this.m_K.col2.z;this.m_K.col3.z=r+l+a*this.m_a1*this.m_a1+b*this.m_a2*this.m_a2;if(this.m_enableLimit){h=this.m_axis.x*h+this.m_axis.y*o;if(F.Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*L.b2_linearSlop)this.m_limitState=this.e_equalLimits;else if(h<=this.m_lowerTranslation){if(this.m_limitState!=this.e_atLowerLimit){this.m_limitState=this.e_atLowerLimit;this.m_impulse.z=0}}else if(h>=this.m_upperTranslation){if(this.m_limitState!=
this.e_atUpperLimit){this.m_limitState=this.e_atUpperLimit;this.m_impulse.z=0}}else{this.m_limitState=this.e_inactiveLimit;this.m_impulse.z=0}}else this.m_limitState=this.e_inactiveLimit;if(this.m_enableMotor==false)this.m_motorImpulse=0;if(c.warmStarting){this.m_impulse.x*=c.dtRatio;this.m_impulse.y*=c.dtRatio;this.m_motorImpulse*=c.dtRatio;c=this.m_impulse.x*this.m_perp.x+(this.m_motorImpulse+this.m_impulse.z)*this.m_axis.x;h=this.m_impulse.x*this.m_perp.y+(this.m_motorImpulse+this.m_impulse.z)*
this.m_axis.y;o=this.m_impulse.x*this.m_s1+this.m_impulse.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_a1;r=this.m_impulse.x*this.m_s2+this.m_impulse.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_a2;g.m_linearVelocity.x-=this.m_invMassA*c;g.m_linearVelocity.y-=this.m_invMassA*h;g.m_angularVelocity-=this.m_invIA*o;k.m_linearVelocity.x+=this.m_invMassB*c;k.m_linearVelocity.y+=this.m_invMassB*h;k.m_angularVelocity+=this.m_invIB*r}else{this.m_impulse.SetZero();this.m_motorImpulse=0}};M.prototype.SolveVelocityConstraints=
function(c){var g=this.m_bodyA,k=this.m_bodyB,h=g.m_linearVelocity,o=g.m_angularVelocity,r=k.m_linearVelocity,l=k.m_angularVelocity,a=0,b=0,f=0,m=0;if(this.m_enableMotor&&this.m_limitState!=this.e_equalLimits){m=this.m_motorMass*(this.m_motorSpeed-(this.m_axis.x*(r.x-h.x)+this.m_axis.y*(r.y-h.y)+this.m_a2*l-this.m_a1*o));a=this.m_motorImpulse;c=c.dt*this.m_maxMotorForce;this.m_motorImpulse=F.Clamp(this.m_motorImpulse+m,-c,c);m=this.m_motorImpulse-a;a=m*this.m_axis.x;b=m*this.m_axis.y;f=m*this.m_a1;
m=m*this.m_a2;h.x-=this.m_invMassA*a;h.y-=this.m_invMassA*b;o-=this.m_invIA*f;r.x+=this.m_invMassB*a;r.y+=this.m_invMassB*b;l+=this.m_invIB*m}f=this.m_perp.x*(r.x-h.x)+this.m_perp.y*(r.y-h.y)+this.m_s2*l-this.m_s1*o;b=l-o;if(this.m_enableLimit&&this.m_limitState!=this.e_inactiveLimit){c=this.m_axis.x*(r.x-h.x)+this.m_axis.y*(r.y-h.y)+this.m_a2*l-this.m_a1*o;a=this.m_impulse.Copy();c=this.m_K.Solve33(new A,-f,-b,-c);this.m_impulse.Add(c);if(this.m_limitState==this.e_atLowerLimit)this.m_impulse.z=F.Max(this.m_impulse.z,
0);else if(this.m_limitState==this.e_atUpperLimit)this.m_impulse.z=F.Min(this.m_impulse.z,0);f=-f-(this.m_impulse.z-a.z)*this.m_K.col3.x;b=-b-(this.m_impulse.z-a.z)*this.m_K.col3.y;b=this.m_K.Solve22(new G,f,b);b.x+=a.x;b.y+=a.y;this.m_impulse.x=b.x;this.m_impulse.y=b.y;c.x=this.m_impulse.x-a.x;c.y=this.m_impulse.y-a.y;c.z=this.m_impulse.z-a.z;a=c.x*this.m_perp.x+c.z*this.m_axis.x;b=c.x*this.m_perp.y+c.z*this.m_axis.y;f=c.x*this.m_s1+c.y+c.z*this.m_a1;m=c.x*this.m_s2+c.y+c.z*this.m_a2}else{c=this.m_K.Solve22(new G,
-f,-b);this.m_impulse.x+=c.x;this.m_impulse.y+=c.y;a=c.x*this.m_perp.x;b=c.x*this.m_perp.y;f=c.x*this.m_s1+c.y;m=c.x*this.m_s2+c.y}h.x-=this.m_invMassA*a;h.y-=this.m_invMassA*b;o-=this.m_invIA*f;r.x+=this.m_invMassB*a;r.y+=this.m_invMassB*b;l+=this.m_invIB*m;g.m_linearVelocity.SetV(h);g.m_angularVelocity=o;k.m_linearVelocity.SetV(r);k.m_angularVelocity=l};M.prototype.SolvePositionConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k=c.m_sweep.c,h=c.m_sweep.a,o=g.m_sweep.c,r=g.m_sweep.a,l,a=0,
b=0,f=0,m=a=l=0,p=0;b=false;var D=0,B=I.FromAngle(h),O=I.FromAngle(r);l=B;p=this.m_localAnchor1.x-this.m_localCenterA.x;var W=this.m_localAnchor1.y-this.m_localCenterA.y;a=l.col1.x*p+l.col2.x*W;W=l.col1.y*p+l.col2.y*W;p=a;l=O;O=this.m_localAnchor2.x-this.m_localCenterB.x;f=this.m_localAnchor2.y-this.m_localCenterB.y;a=l.col1.x*O+l.col2.x*f;f=l.col1.y*O+l.col2.y*f;O=a;l=o.x+O-k.x-p;a=o.y+f-k.y-W;if(this.m_enableLimit){this.m_axis=F.MulMV(B,this.m_localXAxis1);this.m_a1=(l+p)*this.m_axis.y-(a+W)*this.m_axis.x;
this.m_a2=O*this.m_axis.y-f*this.m_axis.x;var ca=this.m_axis.x*l+this.m_axis.y*a;if(F.Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*L.b2_linearSlop){D=F.Clamp(ca,-L.b2_maxLinearCorrection,L.b2_maxLinearCorrection);m=F.Abs(ca);b=true}else if(ca<=this.m_lowerTranslation){D=F.Clamp(ca-this.m_lowerTranslation+L.b2_linearSlop,-L.b2_maxLinearCorrection,0);m=this.m_lowerTranslation-ca;b=true}else if(ca>=this.m_upperTranslation){D=F.Clamp(ca-this.m_upperTranslation+L.b2_linearSlop,0,L.b2_maxLinearCorrection);
m=ca-this.m_upperTranslation;b=true}}this.m_perp=F.MulMV(B,this.m_localYAxis1);this.m_s1=(l+p)*this.m_perp.y-(a+W)*this.m_perp.x;this.m_s2=O*this.m_perp.y-f*this.m_perp.x;B=new A;W=this.m_perp.x*l+this.m_perp.y*a;O=r-h-this.m_refAngle;m=F.Max(m,F.Abs(W));p=F.Abs(O);if(b){b=this.m_invMassA;f=this.m_invMassB;l=this.m_invIA;a=this.m_invIB;this.m_K.col1.x=b+f+l*this.m_s1*this.m_s1+a*this.m_s2*this.m_s2;this.m_K.col1.y=l*this.m_s1+a*this.m_s2;this.m_K.col1.z=l*this.m_s1*this.m_a1+a*this.m_s2*this.m_a2;
this.m_K.col2.x=this.m_K.col1.y;this.m_K.col2.y=l+a;this.m_K.col2.z=l*this.m_a1+a*this.m_a2;this.m_K.col3.x=this.m_K.col1.z;this.m_K.col3.y=this.m_K.col2.z;this.m_K.col3.z=b+f+l*this.m_a1*this.m_a1+a*this.m_a2*this.m_a2;this.m_K.Solve33(B,-W,-O,-D)}else{b=this.m_invMassA;f=this.m_invMassB;l=this.m_invIA;a=this.m_invIB;D=l*this.m_s1+a*this.m_s2;ca=l+a;this.m_K.col1.Set(b+f+l*this.m_s1*this.m_s1+a*this.m_s2*this.m_s2,D,0);this.m_K.col2.Set(D,ca,0);D=this.m_K.Solve22(new G,-W,-O);B.x=D.x;B.y=D.y;B.z=
0}D=B.x*this.m_perp.x+B.z*this.m_axis.x;b=B.x*this.m_perp.y+B.z*this.m_axis.y;W=B.x*this.m_s1+B.y+B.z*this.m_a1;B=B.x*this.m_s2+B.y+B.z*this.m_a2;k.x-=this.m_invMassA*D;k.y-=this.m_invMassA*b;h-=this.m_invIA*W;o.x+=this.m_invMassB*D;o.y+=this.m_invMassB*b;r+=this.m_invIB*B;c.m_sweep.a=h;g.m_sweep.a=r;c.SynchronizeTransform();g.SynchronizeTransform();return m<=L.b2_linearSlop&&p<=L.b2_angularSlop};U.inherit(Box2D.Dynamics.Joints.b2JointDef);U.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;
U.b2PrismaticJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.localAnchorA=new G;this.localAnchorB=new G;this.localAxisA=new G};U.prototype.b2PrismaticJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_prismaticJoint;this.localAxisA.Set(1,0);this.referenceAngle=0;this.enableLimit=false;this.upperTranslation=this.lowerTranslation=0;this.enableMotor=false;this.motorSpeed=this.maxMotorForce=0};U.prototype.Initialize=function(c,g,k,h){this.bodyA=
c;this.bodyB=g;this.localAnchorA=this.bodyA.GetLocalPoint(k);this.localAnchorB=this.bodyB.GetLocalPoint(k);this.localAxisA=this.bodyA.GetLocalVector(h);this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle()};K.inherit(Box2D.Dynamics.Joints.b2Joint);K.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;K.b2PulleyJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_groundAnchor1=new G;this.m_groundAnchor2=new G;this.m_localAnchor1=new G;this.m_localAnchor2=
new G;this.m_u1=new G;this.m_u2=new G};K.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};K.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};K.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse*this.m_u2.x,c*this.m_impulse*this.m_u2.y)};K.prototype.GetReactionTorque=function(){return 0};K.prototype.GetGroundAnchorA=function(){var c=this.m_ground.m_xf.position.Copy();c.Add(this.m_groundAnchor1);
return c};K.prototype.GetGroundAnchorB=function(){var c=this.m_ground.m_xf.position.Copy();c.Add(this.m_groundAnchor2);return c};K.prototype.GetLength1=function(){var c=this.m_bodyA.GetWorldPoint(this.m_localAnchor1),g=c.x-(this.m_ground.m_xf.position.x+this.m_groundAnchor1.x);c=c.y-(this.m_ground.m_xf.position.y+this.m_groundAnchor1.y);return Math.sqrt(g*g+c*c)};K.prototype.GetLength2=function(){var c=this.m_bodyB.GetWorldPoint(this.m_localAnchor2),g=c.x-(this.m_ground.m_xf.position.x+this.m_groundAnchor2.x);
c=c.y-(this.m_ground.m_xf.position.y+this.m_groundAnchor2.y);return Math.sqrt(g*g+c*c)};K.prototype.GetRatio=function(){return this.m_ratio};K.prototype.b2PulleyJoint=function(c){this.__super.b2Joint.call(this,c);this.m_ground=this.m_bodyA.m_world.m_groundBody;this.m_groundAnchor1.x=c.groundAnchorA.x-this.m_ground.m_xf.position.x;this.m_groundAnchor1.y=c.groundAnchorA.y-this.m_ground.m_xf.position.y;this.m_groundAnchor2.x=c.groundAnchorB.x-this.m_ground.m_xf.position.x;this.m_groundAnchor2.y=c.groundAnchorB.y-
this.m_ground.m_xf.position.y;this.m_localAnchor1.SetV(c.localAnchorA);this.m_localAnchor2.SetV(c.localAnchorB);this.m_ratio=c.ratio;this.m_constant=c.lengthA+this.m_ratio*c.lengthB;this.m_maxLength1=F.Min(c.maxLengthA,this.m_constant-this.m_ratio*K.b2_minPulleyLength);this.m_maxLength2=F.Min(c.maxLengthB,(this.m_constant-K.b2_minPulleyLength)/this.m_ratio);this.m_limitImpulse2=this.m_limitImpulse1=this.m_impulse=0};K.prototype.InitVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,
h;h=g.m_xf.R;var o=this.m_localAnchor1.x-g.m_sweep.localCenter.x,r=this.m_localAnchor1.y-g.m_sweep.localCenter.y,l=h.col1.x*o+h.col2.x*r;r=h.col1.y*o+h.col2.y*r;o=l;h=k.m_xf.R;var a=this.m_localAnchor2.x-k.m_sweep.localCenter.x,b=this.m_localAnchor2.y-k.m_sweep.localCenter.y;l=h.col1.x*a+h.col2.x*b;b=h.col1.y*a+h.col2.y*b;a=l;h=k.m_sweep.c.x+a;l=k.m_sweep.c.y+b;var f=this.m_ground.m_xf.position.x+this.m_groundAnchor2.x,m=this.m_ground.m_xf.position.y+this.m_groundAnchor2.y;this.m_u1.Set(g.m_sweep.c.x+
o-(this.m_ground.m_xf.position.x+this.m_groundAnchor1.x),g.m_sweep.c.y+r-(this.m_ground.m_xf.position.y+this.m_groundAnchor1.y));this.m_u2.Set(h-f,l-m);h=this.m_u1.Length();l=this.m_u2.Length();h>L.b2_linearSlop?this.m_u1.Multiply(1/h):this.m_u1.SetZero();l>L.b2_linearSlop?this.m_u2.Multiply(1/l):this.m_u2.SetZero();if(this.m_constant-h-this.m_ratio*l>0){this.m_state=this.e_inactiveLimit;this.m_impulse=0}else this.m_state=this.e_atUpperLimit;if(h<this.m_maxLength1){this.m_limitState1=this.e_inactiveLimit;
this.m_limitImpulse1=0}else this.m_limitState1=this.e_atUpperLimit;if(l<this.m_maxLength2){this.m_limitState2=this.e_inactiveLimit;this.m_limitImpulse2=0}else this.m_limitState2=this.e_atUpperLimit;h=o*this.m_u1.y-r*this.m_u1.x;l=a*this.m_u2.y-b*this.m_u2.x;this.m_limitMass1=g.m_invMass+g.m_invI*h*h;this.m_limitMass2=k.m_invMass+k.m_invI*l*l;this.m_pulleyMass=this.m_limitMass1+this.m_ratio*this.m_ratio*this.m_limitMass2;this.m_limitMass1=1/this.m_limitMass1;this.m_limitMass2=1/this.m_limitMass2;this.m_pulleyMass=
1/this.m_pulleyMass;if(c.warmStarting){this.m_impulse*=c.dtRatio;this.m_limitImpulse1*=c.dtRatio;this.m_limitImpulse2*=c.dtRatio;c=(-this.m_impulse-this.m_limitImpulse1)*this.m_u1.x;h=(-this.m_impulse-this.m_limitImpulse1)*this.m_u1.y;l=(-this.m_ratio*this.m_impulse-this.m_limitImpulse2)*this.m_u2.x;f=(-this.m_ratio*this.m_impulse-this.m_limitImpulse2)*this.m_u2.y;g.m_linearVelocity.x+=g.m_invMass*c;g.m_linearVelocity.y+=g.m_invMass*h;g.m_angularVelocity+=g.m_invI*(o*h-r*c);k.m_linearVelocity.x+=
k.m_invMass*l;k.m_linearVelocity.y+=k.m_invMass*f;k.m_angularVelocity+=k.m_invI*(a*f-b*l)}else this.m_limitImpulse2=this.m_limitImpulse1=this.m_impulse=0};K.prototype.SolveVelocityConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k;k=c.m_xf.R;var h=this.m_localAnchor1.x-c.m_sweep.localCenter.x,o=this.m_localAnchor1.y-c.m_sweep.localCenter.y,r=k.col1.x*h+k.col2.x*o;o=k.col1.y*h+k.col2.y*o;h=r;k=g.m_xf.R;var l=this.m_localAnchor2.x-g.m_sweep.localCenter.x,a=this.m_localAnchor2.y-g.m_sweep.localCenter.y;
r=k.col1.x*l+k.col2.x*a;a=k.col1.y*l+k.col2.y*a;l=r;var b=r=k=0,f=0;k=f=k=f=b=r=k=0;if(this.m_state==this.e_atUpperLimit){k=c.m_linearVelocity.x+-c.m_angularVelocity*o;r=c.m_linearVelocity.y+c.m_angularVelocity*h;b=g.m_linearVelocity.x+-g.m_angularVelocity*a;f=g.m_linearVelocity.y+g.m_angularVelocity*l;k=-(this.m_u1.x*k+this.m_u1.y*r)-this.m_ratio*(this.m_u2.x*b+this.m_u2.y*f);f=this.m_pulleyMass*-k;k=this.m_impulse;this.m_impulse=F.Max(0,this.m_impulse+f);f=this.m_impulse-k;k=-f*this.m_u1.x;r=-f*
this.m_u1.y;b=-this.m_ratio*f*this.m_u2.x;f=-this.m_ratio*f*this.m_u2.y;c.m_linearVelocity.x+=c.m_invMass*k;c.m_linearVelocity.y+=c.m_invMass*r;c.m_angularVelocity+=c.m_invI*(h*r-o*k);g.m_linearVelocity.x+=g.m_invMass*b;g.m_linearVelocity.y+=g.m_invMass*f;g.m_angularVelocity+=g.m_invI*(l*f-a*b)}if(this.m_limitState1==this.e_atUpperLimit){k=c.m_linearVelocity.x+-c.m_angularVelocity*o;r=c.m_linearVelocity.y+c.m_angularVelocity*h;k=-(this.m_u1.x*k+this.m_u1.y*r);f=-this.m_limitMass1*k;k=this.m_limitImpulse1;
this.m_limitImpulse1=F.Max(0,this.m_limitImpulse1+f);f=this.m_limitImpulse1-k;k=-f*this.m_u1.x;r=-f*this.m_u1.y;c.m_linearVelocity.x+=c.m_invMass*k;c.m_linearVelocity.y+=c.m_invMass*r;c.m_angularVelocity+=c.m_invI*(h*r-o*k)}if(this.m_limitState2==this.e_atUpperLimit){b=g.m_linearVelocity.x+-g.m_angularVelocity*a;f=g.m_linearVelocity.y+g.m_angularVelocity*l;k=-(this.m_u2.x*b+this.m_u2.y*f);f=-this.m_limitMass2*k;k=this.m_limitImpulse2;this.m_limitImpulse2=F.Max(0,this.m_limitImpulse2+f);f=this.m_limitImpulse2-
k;b=-f*this.m_u2.x;f=-f*this.m_u2.y;g.m_linearVelocity.x+=g.m_invMass*b;g.m_linearVelocity.y+=g.m_invMass*f;g.m_angularVelocity+=g.m_invI*(l*f-a*b)}};K.prototype.SolvePositionConstraints=function(){var c=this.m_bodyA,g=this.m_bodyB,k,h=this.m_ground.m_xf.position.x+this.m_groundAnchor1.x,o=this.m_ground.m_xf.position.y+this.m_groundAnchor1.y,r=this.m_ground.m_xf.position.x+this.m_groundAnchor2.x,l=this.m_ground.m_xf.position.y+this.m_groundAnchor2.y,a=0,b=0,f=0,m=0,p=k=0,D=0,B=0,O=p=B=k=p=k=0;if(this.m_state==
this.e_atUpperLimit){k=c.m_xf.R;a=this.m_localAnchor1.x-c.m_sweep.localCenter.x;b=this.m_localAnchor1.y-c.m_sweep.localCenter.y;p=k.col1.x*a+k.col2.x*b;b=k.col1.y*a+k.col2.y*b;a=p;k=g.m_xf.R;f=this.m_localAnchor2.x-g.m_sweep.localCenter.x;m=this.m_localAnchor2.y-g.m_sweep.localCenter.y;p=k.col1.x*f+k.col2.x*m;m=k.col1.y*f+k.col2.y*m;f=p;k=c.m_sweep.c.x+a;p=c.m_sweep.c.y+b;D=g.m_sweep.c.x+f;B=g.m_sweep.c.y+m;this.m_u1.Set(k-h,p-o);this.m_u2.Set(D-r,B-l);k=this.m_u1.Length();p=this.m_u2.Length();k>
L.b2_linearSlop?this.m_u1.Multiply(1/k):this.m_u1.SetZero();p>L.b2_linearSlop?this.m_u2.Multiply(1/p):this.m_u2.SetZero();k=this.m_constant-k-this.m_ratio*p;O=F.Max(O,-k);k=F.Clamp(k+L.b2_linearSlop,-L.b2_maxLinearCorrection,0);B=-this.m_pulleyMass*k;k=-B*this.m_u1.x;p=-B*this.m_u1.y;D=-this.m_ratio*B*this.m_u2.x;B=-this.m_ratio*B*this.m_u2.y;c.m_sweep.c.x+=c.m_invMass*k;c.m_sweep.c.y+=c.m_invMass*p;c.m_sweep.a+=c.m_invI*(a*p-b*k);g.m_sweep.c.x+=g.m_invMass*D;g.m_sweep.c.y+=g.m_invMass*B;g.m_sweep.a+=
g.m_invI*(f*B-m*D);c.SynchronizeTransform();g.SynchronizeTransform()}if(this.m_limitState1==this.e_atUpperLimit){k=c.m_xf.R;a=this.m_localAnchor1.x-c.m_sweep.localCenter.x;b=this.m_localAnchor1.y-c.m_sweep.localCenter.y;p=k.col1.x*a+k.col2.x*b;b=k.col1.y*a+k.col2.y*b;a=p;k=c.m_sweep.c.x+a;p=c.m_sweep.c.y+b;this.m_u1.Set(k-h,p-o);k=this.m_u1.Length();if(k>L.b2_linearSlop){this.m_u1.x*=1/k;this.m_u1.y*=1/k}else this.m_u1.SetZero();k=this.m_maxLength1-k;O=F.Max(O,-k);k=F.Clamp(k+L.b2_linearSlop,-L.b2_maxLinearCorrection,
0);B=-this.m_limitMass1*k;k=-B*this.m_u1.x;p=-B*this.m_u1.y;c.m_sweep.c.x+=c.m_invMass*k;c.m_sweep.c.y+=c.m_invMass*p;c.m_sweep.a+=c.m_invI*(a*p-b*k);c.SynchronizeTransform()}if(this.m_limitState2==this.e_atUpperLimit){k=g.m_xf.R;f=this.m_localAnchor2.x-g.m_sweep.localCenter.x;m=this.m_localAnchor2.y-g.m_sweep.localCenter.y;p=k.col1.x*f+k.col2.x*m;m=k.col1.y*f+k.col2.y*m;f=p;D=g.m_sweep.c.x+f;B=g.m_sweep.c.y+m;this.m_u2.Set(D-r,B-l);p=this.m_u2.Length();if(p>L.b2_linearSlop){this.m_u2.x*=1/p;this.m_u2.y*=
1/p}else this.m_u2.SetZero();k=this.m_maxLength2-p;O=F.Max(O,-k);k=F.Clamp(k+L.b2_linearSlop,-L.b2_maxLinearCorrection,0);B=-this.m_limitMass2*k;D=-B*this.m_u2.x;B=-B*this.m_u2.y;g.m_sweep.c.x+=g.m_invMass*D;g.m_sweep.c.y+=g.m_invMass*B;g.m_sweep.a+=g.m_invI*(f*B-m*D);g.SynchronizeTransform()}return O<L.b2_linearSlop};_A2J_postDefs.push(function(){Box2D.Dynamics.Joints.b2PulleyJoint.b2_minPulleyLength=2;Box2D.Dynamics.Joints.b2PulleyJoint.prototype.b2_minPulleyLength=Box2D.Dynamics.Joints.b2PulleyJoint.b2_minPulleyLength});
ba.inherit(Box2D.Dynamics.Joints.b2JointDef);ba.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;ba.b2PulleyJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.groundAnchorA=new G;this.groundAnchorB=new G;this.localAnchorA=new G;this.localAnchorB=new G};ba.prototype.b2PulleyJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_pulleyJoint;this.groundAnchorA.Set(-1,1);this.groundAnchorB.Set(1,1);this.localAnchorA.Set(-1,0);this.localAnchorB.Set(1,
0);this.maxLengthB=this.lengthB=this.maxLengthA=this.lengthA=0;this.ratio=1;this.collideConnected=true};ba.prototype.Initialize=function(c,g,k,h,o,r,l){if(l===undefined)l=0;this.bodyA=c;this.bodyB=g;this.groundAnchorA.SetV(k);this.groundAnchorB.SetV(h);this.localAnchorA=this.bodyA.GetLocalPoint(o);this.localAnchorB=this.bodyB.GetLocalPoint(r);c=o.x-k.x;k=o.y-k.y;this.lengthA=Math.sqrt(c*c+k*k);k=r.x-h.x;h=r.y-h.y;this.lengthB=Math.sqrt(k*k+h*h);this.ratio=l;l=this.lengthA+this.ratio*this.lengthB;
this.maxLengthA=l-this.ratio*K.b2_minPulleyLength;this.maxLengthB=(l-K.b2_minPulleyLength)/this.ratio};V.inherit(Box2D.Dynamics.Joints.b2Joint);V.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;V.b2RevoluteJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.K=new I;this.K1=new I;this.K2=new I;this.K3=new I;this.impulse3=new A;this.impulse2=new G;this.reduced=new G;this.m_localAnchor1=new G;this.m_localAnchor2=new G;this.m_impulse=new A;this.m_mass=new H};V.prototype.GetAnchorA=
function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchor1)};V.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchor2)};V.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse.x,c*this.m_impulse.y)};V.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;return c*this.m_impulse.z};V.prototype.GetJointAngle=function(){return this.m_bodyB.m_sweep.a-this.m_bodyA.m_sweep.a-this.m_referenceAngle};V.prototype.GetJointSpeed=
function(){return this.m_bodyB.m_angularVelocity-this.m_bodyA.m_angularVelocity};V.prototype.IsLimitEnabled=function(){return this.m_enableLimit};V.prototype.EnableLimit=function(c){this.m_enableLimit=c};V.prototype.GetLowerLimit=function(){return this.m_lowerAngle};V.prototype.GetUpperLimit=function(){return this.m_upperAngle};V.prototype.SetLimits=function(c,g){if(c===undefined)c=0;if(g===undefined)g=0;this.m_lowerAngle=c;this.m_upperAngle=g};V.prototype.IsMotorEnabled=function(){this.m_bodyA.SetAwake(true);
this.m_bodyB.SetAwake(true);return this.m_enableMotor};V.prototype.EnableMotor=function(c){this.m_enableMotor=c};V.prototype.SetMotorSpeed=function(c){if(c===undefined)c=0;this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=c};V.prototype.GetMotorSpeed=function(){return this.m_motorSpeed};V.prototype.SetMaxMotorTorque=function(c){if(c===undefined)c=0;this.m_maxMotorTorque=c};V.prototype.GetMotorTorque=function(){return this.m_maxMotorTorque};V.prototype.b2RevoluteJoint=function(c){this.__super.b2Joint.call(this,
c);this.m_localAnchor1.SetV(c.localAnchorA);this.m_localAnchor2.SetV(c.localAnchorB);this.m_referenceAngle=c.referenceAngle;this.m_impulse.SetZero();this.m_motorImpulse=0;this.m_lowerAngle=c.lowerAngle;this.m_upperAngle=c.upperAngle;this.m_maxMotorTorque=c.maxMotorTorque;this.m_motorSpeed=c.motorSpeed;this.m_enableLimit=c.enableLimit;this.m_enableMotor=c.enableMotor;this.m_limitState=this.e_inactiveLimit};V.prototype.InitVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,h,o=0;h=g.m_xf.R;
var r=this.m_localAnchor1.x-g.m_sweep.localCenter.x,l=this.m_localAnchor1.y-g.m_sweep.localCenter.y;o=h.col1.x*r+h.col2.x*l;l=h.col1.y*r+h.col2.y*l;r=o;h=k.m_xf.R;var a=this.m_localAnchor2.x-k.m_sweep.localCenter.x,b=this.m_localAnchor2.y-k.m_sweep.localCenter.y;o=h.col1.x*a+h.col2.x*b;b=h.col1.y*a+h.col2.y*b;a=o;h=g.m_invMass;o=k.m_invMass;var f=g.m_invI,m=k.m_invI;this.m_mass.col1.x=h+o+l*l*f+b*b*m;this.m_mass.col2.x=-l*r*f-b*a*m;this.m_mass.col3.x=-l*f-b*m;this.m_mass.col1.y=this.m_mass.col2.x;
this.m_mass.col2.y=h+o+r*r*f+a*a*m;this.m_mass.col3.y=r*f+a*m;this.m_mass.col1.z=this.m_mass.col3.x;this.m_mass.col2.z=this.m_mass.col3.y;this.m_mass.col3.z=f+m;this.m_motorMass=1/(f+m);if(this.m_enableMotor==false)this.m_motorImpulse=0;if(this.m_enableLimit){var p=k.m_sweep.a-g.m_sweep.a-this.m_referenceAngle;if(F.Abs(this.m_upperAngle-this.m_lowerAngle)<2*L.b2_angularSlop)this.m_limitState=this.e_equalLimits;else if(p<=this.m_lowerAngle){if(this.m_limitState!=this.e_atLowerLimit)this.m_impulse.z=
0;this.m_limitState=this.e_atLowerLimit}else if(p>=this.m_upperAngle){if(this.m_limitState!=this.e_atUpperLimit)this.m_impulse.z=0;this.m_limitState=this.e_atUpperLimit}else{this.m_limitState=this.e_inactiveLimit;this.m_impulse.z=0}}else this.m_limitState=this.e_inactiveLimit;if(c.warmStarting){this.m_impulse.x*=c.dtRatio;this.m_impulse.y*=c.dtRatio;this.m_motorImpulse*=c.dtRatio;c=this.m_impulse.x;p=this.m_impulse.y;g.m_linearVelocity.x-=h*c;g.m_linearVelocity.y-=h*p;g.m_angularVelocity-=f*(r*p-
l*c+this.m_motorImpulse+this.m_impulse.z);k.m_linearVelocity.x+=o*c;k.m_linearVelocity.y+=o*p;k.m_angularVelocity+=m*(a*p-b*c+this.m_motorImpulse+this.m_impulse.z)}else{this.m_impulse.SetZero();this.m_motorImpulse=0}};V.prototype.SolveVelocityConstraints=function(c){var g=this.m_bodyA,k=this.m_bodyB,h=0,o=h=0,r=0,l=0,a=0,b=g.m_linearVelocity,f=g.m_angularVelocity,m=k.m_linearVelocity,p=k.m_angularVelocity,D=g.m_invMass,B=k.m_invMass,O=g.m_invI,W=k.m_invI;if(this.m_enableMotor&&this.m_limitState!=
this.e_equalLimits){o=this.m_motorMass*-(p-f-this.m_motorSpeed);r=this.m_motorImpulse;l=c.dt*this.m_maxMotorTorque;this.m_motorImpulse=F.Clamp(this.m_motorImpulse+o,-l,l);o=this.m_motorImpulse-r;f-=O*o;p+=W*o}if(this.m_enableLimit&&this.m_limitState!=this.e_inactiveLimit){c=g.m_xf.R;o=this.m_localAnchor1.x-g.m_sweep.localCenter.x;r=this.m_localAnchor1.y-g.m_sweep.localCenter.y;h=c.col1.x*o+c.col2.x*r;r=c.col1.y*o+c.col2.y*r;o=h;c=k.m_xf.R;l=this.m_localAnchor2.x-k.m_sweep.localCenter.x;a=this.m_localAnchor2.y-
k.m_sweep.localCenter.y;h=c.col1.x*l+c.col2.x*a;a=c.col1.y*l+c.col2.y*a;l=h;c=m.x+-p*a-b.x- -f*r;var ca=m.y+p*l-b.y-f*o;this.m_mass.Solve33(this.impulse3,-c,-ca,-(p-f));if(this.m_limitState==this.e_equalLimits)this.m_impulse.Add(this.impulse3);else if(this.m_limitState==this.e_atLowerLimit){h=this.m_impulse.z+this.impulse3.z;if(h<0){this.m_mass.Solve22(this.reduced,-c,-ca);this.impulse3.x=this.reduced.x;this.impulse3.y=this.reduced.y;this.impulse3.z=-this.m_impulse.z;this.m_impulse.x+=this.reduced.x;
this.m_impulse.y+=this.reduced.y;this.m_impulse.z=0}}else if(this.m_limitState==this.e_atUpperLimit){h=this.m_impulse.z+this.impulse3.z;if(h>0){this.m_mass.Solve22(this.reduced,-c,-ca);this.impulse3.x=this.reduced.x;this.impulse3.y=this.reduced.y;this.impulse3.z=-this.m_impulse.z;this.m_impulse.x+=this.reduced.x;this.m_impulse.y+=this.reduced.y;this.m_impulse.z=0}}b.x-=D*this.impulse3.x;b.y-=D*this.impulse3.y;f-=O*(o*this.impulse3.y-r*this.impulse3.x+this.impulse3.z);m.x+=B*this.impulse3.x;m.y+=B*
this.impulse3.y;p+=W*(l*this.impulse3.y-a*this.impulse3.x+this.impulse3.z)}else{c=g.m_xf.R;o=this.m_localAnchor1.x-g.m_sweep.localCenter.x;r=this.m_localAnchor1.y-g.m_sweep.localCenter.y;h=c.col1.x*o+c.col2.x*r;r=c.col1.y*o+c.col2.y*r;o=h;c=k.m_xf.R;l=this.m_localAnchor2.x-k.m_sweep.localCenter.x;a=this.m_localAnchor2.y-k.m_sweep.localCenter.y;h=c.col1.x*l+c.col2.x*a;a=c.col1.y*l+c.col2.y*a;l=h;this.m_mass.Solve22(this.impulse2,-(m.x+-p*a-b.x- -f*r),-(m.y+p*l-b.y-f*o));this.m_impulse.x+=this.impulse2.x;
this.m_impulse.y+=this.impulse2.y;b.x-=D*this.impulse2.x;b.y-=D*this.impulse2.y;f-=O*(o*this.impulse2.y-r*this.impulse2.x);m.x+=B*this.impulse2.x;m.y+=B*this.impulse2.y;p+=W*(l*this.impulse2.y-a*this.impulse2.x)}g.m_linearVelocity.SetV(b);g.m_angularVelocity=f;k.m_linearVelocity.SetV(m);k.m_angularVelocity=p};V.prototype.SolvePositionConstraints=function(){var c=0,g,k=this.m_bodyA,h=this.m_bodyB,o=0,r=g=0,l=0,a=0;if(this.m_enableLimit&&this.m_limitState!=this.e_inactiveLimit){c=h.m_sweep.a-k.m_sweep.a-
this.m_referenceAngle;var b=0;if(this.m_limitState==this.e_equalLimits){c=F.Clamp(c-this.m_lowerAngle,-L.b2_maxAngularCorrection,L.b2_maxAngularCorrection);b=-this.m_motorMass*c;o=F.Abs(c)}else if(this.m_limitState==this.e_atLowerLimit){c=c-this.m_lowerAngle;o=-c;c=F.Clamp(c+L.b2_angularSlop,-L.b2_maxAngularCorrection,0);b=-this.m_motorMass*c}else if(this.m_limitState==this.e_atUpperLimit){o=c=c-this.m_upperAngle;c=F.Clamp(c-L.b2_angularSlop,0,L.b2_maxAngularCorrection);b=-this.m_motorMass*c}k.m_sweep.a-=
k.m_invI*b;h.m_sweep.a+=h.m_invI*b;k.SynchronizeTransform();h.SynchronizeTransform()}g=k.m_xf.R;b=this.m_localAnchor1.x-k.m_sweep.localCenter.x;c=this.m_localAnchor1.y-k.m_sweep.localCenter.y;r=g.col1.x*b+g.col2.x*c;c=g.col1.y*b+g.col2.y*c;b=r;g=h.m_xf.R;var f=this.m_localAnchor2.x-h.m_sweep.localCenter.x,m=this.m_localAnchor2.y-h.m_sweep.localCenter.y;r=g.col1.x*f+g.col2.x*m;m=g.col1.y*f+g.col2.y*m;f=r;l=h.m_sweep.c.x+f-k.m_sweep.c.x-b;a=h.m_sweep.c.y+m-k.m_sweep.c.y-c;var p=l*l+a*a;g=Math.sqrt(p);
r=k.m_invMass;var D=h.m_invMass,B=k.m_invI,O=h.m_invI,W=10*L.b2_linearSlop;if(p>W*W){p=1/(r+D);l=p*-l;a=p*-a;k.m_sweep.c.x-=0.5*r*l;k.m_sweep.c.y-=0.5*r*a;h.m_sweep.c.x+=0.5*D*l;h.m_sweep.c.y+=0.5*D*a;l=h.m_sweep.c.x+f-k.m_sweep.c.x-b;a=h.m_sweep.c.y+m-k.m_sweep.c.y-c}this.K1.col1.x=r+D;this.K1.col2.x=0;this.K1.col1.y=0;this.K1.col2.y=r+D;this.K2.col1.x=B*c*c;this.K2.col2.x=-B*b*c;this.K2.col1.y=-B*b*c;this.K2.col2.y=B*b*b;this.K3.col1.x=O*m*m;this.K3.col2.x=-O*f*m;this.K3.col1.y=-O*f*m;this.K3.col2.y=
O*f*f;this.K.SetM(this.K1);this.K.AddM(this.K2);this.K.AddM(this.K3);this.K.Solve(V.tImpulse,-l,-a);l=V.tImpulse.x;a=V.tImpulse.y;k.m_sweep.c.x-=k.m_invMass*l;k.m_sweep.c.y-=k.m_invMass*a;k.m_sweep.a-=k.m_invI*(b*a-c*l);h.m_sweep.c.x+=h.m_invMass*l;h.m_sweep.c.y+=h.m_invMass*a;h.m_sweep.a+=h.m_invI*(f*a-m*l);k.SynchronizeTransform();h.SynchronizeTransform();return g<=L.b2_linearSlop&&o<=L.b2_angularSlop};_A2J_postDefs.push(function(){Box2D.Dynamics.Joints.b2RevoluteJoint.tImpulse=new G;Box2D.Dynamics.Joints.b2RevoluteJoint.prototype.tImpulse=
Box2D.Dynamics.Joints.b2RevoluteJoint.tImpulse});Z.inherit(Box2D.Dynamics.Joints.b2JointDef);Z.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;Z.b2RevoluteJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,arguments);this.localAnchorA=new G;this.localAnchorB=new G};Z.prototype.b2RevoluteJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_revoluteJoint;this.localAnchorA.Set(0,0);this.localAnchorB.Set(0,0);this.motorSpeed=this.maxMotorTorque=this.upperAngle=
this.lowerAngle=this.referenceAngle=0;this.enableMotor=this.enableLimit=false};Z.prototype.Initialize=function(c,g,k){this.bodyA=c;this.bodyB=g;this.localAnchorA=this.bodyA.GetLocalPoint(k);this.localAnchorB=this.bodyB.GetLocalPoint(k);this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle()};ga.inherit(Box2D.Dynamics.Joints.b2Joint);ga.prototype.__super=Box2D.Dynamics.Joints.b2Joint.prototype;ga.b2WeldJoint=function(){Box2D.Dynamics.Joints.b2Joint.b2Joint.apply(this,arguments);this.m_localAnchorA=
new G;this.m_localAnchorB=new G;this.m_impulse=new A;this.m_mass=new H};ga.prototype.GetAnchorA=function(){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA)};ga.prototype.GetAnchorB=function(){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB)};ga.prototype.GetReactionForce=function(c){if(c===undefined)c=0;return new G(c*this.m_impulse.x,c*this.m_impulse.y)};ga.prototype.GetReactionTorque=function(c){if(c===undefined)c=0;return c*this.m_impulse.z};ga.prototype.b2WeldJoint=function(c){this.__super.b2Joint.call(this,
c);this.m_localAnchorA.SetV(c.localAnchorA);this.m_localAnchorB.SetV(c.localAnchorB);this.m_referenceAngle=c.referenceAngle;this.m_impulse.SetZero();this.m_mass=new H};ga.prototype.InitVelocityConstraints=function(c){var g,k=0,h=this.m_bodyA,o=this.m_bodyB;g=h.m_xf.R;var r=this.m_localAnchorA.x-h.m_sweep.localCenter.x,l=this.m_localAnchorA.y-h.m_sweep.localCenter.y;k=g.col1.x*r+g.col2.x*l;l=g.col1.y*r+g.col2.y*l;r=k;g=o.m_xf.R;var a=this.m_localAnchorB.x-o.m_sweep.localCenter.x,b=this.m_localAnchorB.y-
o.m_sweep.localCenter.y;k=g.col1.x*a+g.col2.x*b;b=g.col1.y*a+g.col2.y*b;a=k;g=h.m_invMass;k=o.m_invMass;var f=h.m_invI,m=o.m_invI;this.m_mass.col1.x=g+k+l*l*f+b*b*m;this.m_mass.col2.x=-l*r*f-b*a*m;this.m_mass.col3.x=-l*f-b*m;this.m_mass.col1.y=this.m_mass.col2.x;this.m_mass.col2.y=g+k+r*r*f+a*a*m;this.m_mass.col3.y=r*f+a*m;this.m_mass.col1.z=this.m_mass.col3.x;this.m_mass.col2.z=this.m_mass.col3.y;this.m_mass.col3.z=f+m;if(c.warmStarting){this.m_impulse.x*=c.dtRatio;this.m_impulse.y*=c.dtRatio;this.m_impulse.z*=
c.dtRatio;h.m_linearVelocity.x-=g*this.m_impulse.x;h.m_linearVelocity.y-=g*this.m_impulse.y;h.m_angularVelocity-=f*(r*this.m_impulse.y-l*this.m_impulse.x+this.m_impulse.z);o.m_linearVelocity.x+=k*this.m_impulse.x;o.m_linearVelocity.y+=k*this.m_impulse.y;o.m_angularVelocity+=m*(a*this.m_impulse.y-b*this.m_impulse.x+this.m_impulse.z)}else this.m_impulse.SetZero()};ga.prototype.SolveVelocityConstraints=function(){var c,g=0,k=this.m_bodyA,h=this.m_bodyB,o=k.m_linearVelocity,r=k.m_angularVelocity,l=h.m_linearVelocity,
a=h.m_angularVelocity,b=k.m_invMass,f=h.m_invMass,m=k.m_invI,p=h.m_invI;c=k.m_xf.R;var D=this.m_localAnchorA.x-k.m_sweep.localCenter.x,B=this.m_localAnchorA.y-k.m_sweep.localCenter.y;g=c.col1.x*D+c.col2.x*B;B=c.col1.y*D+c.col2.y*B;D=g;c=h.m_xf.R;var O=this.m_localAnchorB.x-h.m_sweep.localCenter.x,W=this.m_localAnchorB.y-h.m_sweep.localCenter.y;g=c.col1.x*O+c.col2.x*W;W=c.col1.y*O+c.col2.y*W;O=g;c=l.x-a*W-o.x+r*B;g=l.y+a*O-o.y-r*D;var ca=a-r,d=new A;this.m_mass.Solve33(d,-c,-g,-ca);this.m_impulse.Add(d);
o.x-=b*d.x;o.y-=b*d.y;r-=m*(D*d.y-B*d.x+d.z);l.x+=f*d.x;l.y+=f*d.y;a+=p*(O*d.y-W*d.x+d.z);k.m_angularVelocity=r;h.m_angularVelocity=a};ga.prototype.SolvePositionConstraints=function(){var c,g=0,k=this.m_bodyA,h=this.m_bodyB;c=k.m_xf.R;var o=this.m_localAnchorA.x-k.m_sweep.localCenter.x,r=this.m_localAnchorA.y-k.m_sweep.localCenter.y;g=c.col1.x*o+c.col2.x*r;r=c.col1.y*o+c.col2.y*r;o=g;c=h.m_xf.R;var l=this.m_localAnchorB.x-h.m_sweep.localCenter.x,a=this.m_localAnchorB.y-h.m_sweep.localCenter.y;g=c.col1.x*
l+c.col2.x*a;a=c.col1.y*l+c.col2.y*a;l=g;c=k.m_invMass;g=h.m_invMass;var b=k.m_invI,f=h.m_invI,m=h.m_sweep.c.x+l-k.m_sweep.c.x-o,p=h.m_sweep.c.y+a-k.m_sweep.c.y-r,D=h.m_sweep.a-k.m_sweep.a-this.m_referenceAngle,B=10*L.b2_linearSlop,O=Math.sqrt(m*m+p*p),W=F.Abs(D);if(O>B){b*=1;f*=1}this.m_mass.col1.x=c+g+r*r*b+a*a*f;this.m_mass.col2.x=-r*o*b-a*l*f;this.m_mass.col3.x=-r*b-a*f;this.m_mass.col1.y=this.m_mass.col2.x;this.m_mass.col2.y=c+g+o*o*b+l*l*f;this.m_mass.col3.y=o*b+l*f;this.m_mass.col1.z=this.m_mass.col3.x;
this.m_mass.col2.z=this.m_mass.col3.y;this.m_mass.col3.z=b+f;B=new A;this.m_mass.Solve33(B,-m,-p,-D);k.m_sweep.c.x-=c*B.x;k.m_sweep.c.y-=c*B.y;k.m_sweep.a-=b*(o*B.y-r*B.x+B.z);h.m_sweep.c.x+=g*B.x;h.m_sweep.c.y+=g*B.y;h.m_sweep.a+=f*(l*B.y-a*B.x+B.z);k.SynchronizeTransform();h.SynchronizeTransform();return O<=L.b2_linearSlop&&W<=L.b2_angularSlop};fa.inherit(Box2D.Dynamics.Joints.b2JointDef);fa.prototype.__super=Box2D.Dynamics.Joints.b2JointDef.prototype;fa.b2WeldJointDef=function(){Box2D.Dynamics.Joints.b2JointDef.b2JointDef.apply(this,
arguments);this.localAnchorA=new G;this.localAnchorB=new G};fa.prototype.b2WeldJointDef=function(){this.__super.b2JointDef.call(this);this.type=Q.e_weldJoint;this.referenceAngle=0};fa.prototype.Initialize=function(c,g,k){this.bodyA=c;this.bodyB=g;this.localAnchorA.SetV(this.bodyA.GetLocalPoint(k));this.localAnchorB.SetV(this.bodyB.GetLocalPoint(k));this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle()}})();Vector_a2j_Number=a2j.NVector;for(var i=0;i<_A2J_postDefs.length;++i)_A2J_postDefs[i]();
(function(){function L(){L.b2DebugDraw.apply(this,arguments);this.constructor===L&&this.b2DebugDraw.apply(this,arguments)}Box2D.Dynamics.b2DebugDraw=L})();_A2J_postDefs=[];
(function(){var L=Box2D.Dynamics.b2DebugDraw;L.b2DebugDraw=function(){this.m_xformScale=this.m_fillAlpha=this.m_alpha=this.m_lineThickness=this.m_drawScale=1;var I=this;this.m_sprite={graphics:{clear:function(){I.m_ctx.clearRect(0,0,I.m_ctx.canvas.width,I.m_ctx.canvas.height)}}}};L.prototype._color=function(I,H){return"rgba("+((I&16711680)>>16)+","+((I&65280)>>8)+","+(I&255)+","+H+")"};L.prototype.b2DebugDraw=function(){this.m_drawFlags=0};L.prototype.SetFlags=function(I){if(I===undefined)I=0;this.m_drawFlags=
I};L.prototype.GetFlags=function(){return this.m_drawFlags};L.prototype.AppendFlags=function(I){if(I===undefined)I=0;this.m_drawFlags|=I};L.prototype.ClearFlags=function(I){if(I===undefined)I=0;this.m_drawFlags&=~I};L.prototype.SetSprite=function(I){this.m_ctx=I};L.prototype.GetSprite=function(){return this.m_ctx};L.prototype.SetDrawScale=function(I){if(I===undefined)I=0;this.m_drawScale=I};L.prototype.GetDrawScale=function(){return this.m_drawScale};L.prototype.SetLineThickness=function(I){if(I===
undefined)I=0;this.m_lineThickness=I;this.m_ctx.strokeWidth=I};L.prototype.GetLineThickness=function(){return this.m_lineThickness};L.prototype.SetAlpha=function(I){if(I===undefined)I=0;this.m_alpha=I};L.prototype.GetAlpha=function(){return this.m_alpha};L.prototype.SetFillAlpha=function(I){if(I===undefined)I=0;this.m_fillAlpha=I};L.prototype.GetFillAlpha=function(){return this.m_fillAlpha};L.prototype.SetXFormScale=function(I){if(I===undefined)I=0;this.m_xformScale=I};L.prototype.GetXFormScale=function(){return this.m_xformScale};
L.prototype.DrawPolygon=function(I,H,F){if(H){var G=this.m_ctx,A=this.m_drawScale;G.beginPath();G.strokeStyle=this._color(F.color,this.m_alpha);G.moveTo(I[0].x*A,I[0].y*A);for(F=1;F<H;F++)G.lineTo(I[F].x*A,I[F].y*A);G.lineTo(I[0].x*A,I[0].y*A);G.closePath();G.stroke()}};L.prototype.DrawSolidPolygon=function(I,H,F){if(H){var G=this.m_ctx,A=this.m_drawScale;G.beginPath();G.strokeStyle=this._color(F.color,this.m_alpha);G.fillStyle=this._color(F.color,this.m_fillAlpha);G.moveTo(I[0].x*A,I[0].y*A);for(F=
1;F<H;F++)G.lineTo(I[F].x*A,I[F].y*A);G.lineTo(I[0].x*A,I[0].y*A);G.closePath();G.fill();G.stroke()}};L.prototype.DrawCircle=function(I,H,F){if(H){var G=this.m_ctx,A=this.m_drawScale;G.beginPath();G.strokeStyle=this._color(F.color,this.m_alpha);G.arc(I.x*A,I.y*A,H*A,0,Math.PI*2,true);G.closePath();G.stroke()}};L.prototype.DrawSolidCircle=function(I,H,F,G){if(H){var A=this.m_ctx,N=this.m_drawScale,s=I.x*N,C=I.y*N;A.moveTo(0,0);A.beginPath();A.strokeStyle=this._color(G.color,this.m_alpha);A.fillStyle=
this._color(G.color,this.m_fillAlpha);A.arc(s,C,H*N,0,Math.PI*2,true);A.moveTo(s,C);A.lineTo((I.x+F.x*H)*N,(I.y+F.y*H)*N);A.closePath();A.fill();A.stroke()}};L.prototype.DrawSegment=function(I,H,F){var G=this.m_ctx,A=this.m_drawScale;G.strokeStyle=this._color(F.color,this.m_alpha);G.beginPath();G.moveTo(I.x*A,I.y*A);G.lineTo(H.x*A,H.y*A);G.closePath();G.stroke()};L.prototype.DrawTransform=function(I){var H=this.m_ctx,F=this.m_drawScale;H.beginPath();H.strokeStyle=this._color(16711680,this.m_alpha);
H.moveTo(I.position.x*F,I.position.y*F);H.lineTo((I.position.x+this.m_xformScale*I.R.col1.x)*F,(I.position.y+this.m_xformScale*I.R.col1.y)*F);H.strokeStyle=this._color(65280,this.m_alpha);H.moveTo(I.position.x*F,I.position.y*F);H.lineTo((I.position.x+this.m_xformScale*I.R.col2.x)*F,(I.position.y+this.m_xformScale*I.R.col2.y)*F);H.closePath();H.stroke()};_A2J_postDefs.push(function(){Box2D.Dynamics.b2DebugDraw.e_shapeBit=1;Box2D.Dynamics.b2DebugDraw.prototype.e_shapeBit=Box2D.Dynamics.b2DebugDraw.e_shapeBit;
Box2D.Dynamics.b2DebugDraw.e_jointBit=2;Box2D.Dynamics.b2DebugDraw.prototype.e_jointBit=Box2D.Dynamics.b2DebugDraw.e_jointBit;Box2D.Dynamics.b2DebugDraw.e_aabbBit=4;Box2D.Dynamics.b2DebugDraw.prototype.e_aabbBit=Box2D.Dynamics.b2DebugDraw.e_aabbBit;Box2D.Dynamics.b2DebugDraw.e_pairBit=8;Box2D.Dynamics.b2DebugDraw.prototype.e_pairBit=Box2D.Dynamics.b2DebugDraw.e_pairBit;Box2D.Dynamics.b2DebugDraw.e_centerOfMassBit=16;Box2D.Dynamics.b2DebugDraw.prototype.e_centerOfMassBit=Box2D.Dynamics.b2DebugDraw.e_centerOfMassBit;
Box2D.Dynamics.b2DebugDraw.e_controllerBit=32;Box2D.Dynamics.b2DebugDraw.prototype.e_controllerBit=Box2D.Dynamics.b2DebugDraw.e_controllerBit})})();for(i=0;i<_A2J_postDefs.length;++i)_A2J_postDefs[i]();
;
var Contrasaur;
Contrasaur = function(I) {
  var animationData, self;
  I || (I = {});
  animationData = {
   "version":"1.3",
   "tileset":[
      {
         "id":12354,
         "src":"http://images.pixie.strd6.com/sprites/12354/original.png?1300575176",
         "title":"Sprite 12354",
         "circles":[
            {
               "x":0,
               "y":2,
               "radius":40
            },
            {
               "x":90,
               "y":-40,
               "radius":30
            },
            {
               "x":-80,
               "y":10,
               "radius":15
            },
            {
               "x":0,
               "y":51,
               "radius":50
            },
            {
               "x":-120,
               "y":22,
               "radius":12
            }
         ]
      },
      {
         "id":12355,
         "src":"http://images.pixie.strd6.com/sprites/12355/original.png?1300575193",
         "title":"Sprite 12355",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":90,
               "y":-20,
               "radius":35
            },
            {
               "x":-80,
               "y":20,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12356,
         "src":"http://images.pixie.strd6.com/sprites/12356/original.png?1300575271",
         "title":"Sprite 12356",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":71,
               "y":-55,
               "radius":35
            },
            {
               "x":-79,
               "y":20,
               "radius":20
            },
            {
               "x":0,
               "y":51,
               "radius":50
            }
         ]
      },
      {
         "id":12358,
         "src":"http://images.pixie.strd6.com/sprites/12358/original.png?1300575302",
         "title":"Sprite 12358",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":70,
               "y":-56,
               "radius":40
            },
            {
               "x":-67,
               "y":14,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12359,
         "src":"http://images.pixie.strd6.com/sprites/12359/original.png?1300575324",
         "title":"Sprite 12359",
         "circles":[
            {
               "x":0,
               "y":10,
               "radius":40
            },
            {
               "x":-70,
               "y":-30,
               "radius":15
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12360,
         "src":"http://images.pixie.strd6.com/sprites/12360/original.png?1300575342",
         "title":"Sprite 12360",
         "circles":[
            {
               "x":0,
               "y":10,
               "radius":40
            },
            {
               "x":-80,
               "y":-30,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":45
            }
         ]
      },
      {
         "id":12361,
         "src":"http://images.pixie.strd6.com/sprites/12361/original.png?1300575359",
         "title":"Sprite 12361",
         "circles":[
            {
               "x":0,
               "y":8,
               "radius":40
            },
            {
               "x":104,
               "y":0,
               "radius":35
            },
            {
               "x":-84,
               "y":6,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12362,
         "src":"http://images.pixie.strd6.com/sprites/12362/original.png?1300575379",
         "title":"Sprite 12362",
         "circles":[
            {
               "x":0,
               "y":1,
               "radius":40
            },
            {
               "x":90,
               "y":-38,
               "radius":30
            },
            {
               "x":-80,
               "y":10,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12448,
         "src":"http://images.pixie.strd6.com/sprites/12448/original.png?1300944508",
         "title":"Idle1-1",
         "circles":[

         ]
      },
      {
         "id":12449,
         "src":"http://images.pixie.strd6.com/sprites/12449/original.png?1300944544",
         "title":"Idle1-2",
         "circles":[

         ]
      },
      {
         "id":12450,
         "src":"http://images.pixie.strd6.com/sprites/12450/original.png?1300944589",
         "title":"Idle1-3",
         "circles":[

         ]
      },
      {
         "id":12451,
         "src":"http://images.pixie.strd6.com/sprites/12451/original.png?1300944615",
         "title":"Idle1-4",
         "circles":[

         ]
      },
      {
         "id":12456,
         "src":"http://images.pixie.strd6.com/sprites/12456/original.png?1300945175",
         "title":"walk1",
         "circles":[

         ]
      },
      {
         "id":12457,
         "src":"http://images.pixie.strd6.com/sprites/12457/original.png?1300945201",
         "title":"walk2",
         "circles":[

         ]
      },
      {
         "id":12458,
         "src":"http://images.pixie.strd6.com/sprites/12458/original.png?1300945225",
         "title":"walk3",
         "circles":[

         ]
      },
      {
         "id":12459,
         "src":"http://images.pixie.strd6.com/sprites/12459/original.png?1300945249",
         "title":"walk4",
         "circles":[

         ]
      },
      {
         "id":12460,
         "src":"http://images.pixie.strd6.com/sprites/12460/original.png?1300945279",
         "title":"walk5",
         "circles":[

         ]
      },
      {
         "id":12461,
         "src":"http://images.pixie.strd6.com/sprites/12461/original.png?1300945300",
         "title":"walk6",
         "circles":[

         ]
      },
      {
         "id":12462,
         "src":"http://images.pixie.strd6.com/sprites/12462/original.png?1300945319",
         "title":"walk7",
         "circles":[

         ]
      },
      {
         "id":12463,
         "src":"http://images.pixie.strd6.com/sprites/12463/original.png?1300945343",
         "title":"walk8",
         "circles":[

         ]
      },
      {
         "id":12452,
         "src":"http://images.pixie.strd6.com/sprites/12452/original.png?1300944656",
         "title":"Idle2-1",
         "circles":[

         ]
      },
      {
         "id":12453,
         "src":"http://images.pixie.strd6.com/sprites/12453/original.png?1300944682",
         "title":"Idle2-2",
         "circles":[

         ]
      },
      {
         "id":12454,
         "src":"http://images.pixie.strd6.com/sprites/12454/original.png?1300944707",
         "title":"Idle2-3",
         "circles":[

         ]
      },
      {
         "id":12455,
         "src":"http://images.pixie.strd6.com/sprites/12455/original.png?1300944729",
         "title":"Idle2-4",
         "circles":[

         ]
      },
      {
         "id":12411,
         "src":"http://images.pixie.strd6.com/sprites/12411/original.png?1300844954",
         "title":"Sprite 12411",
         "circles":[

         ]
      }
   ],
   "animations":[
      {
         "name":"Bite",
         "complete":"Idle1",
         "continuous":true,
         "speed":"110",
         "triggers": {
           "0":["whiteParticles"],
           "4":["blueParticles","greenParticles"],
           "5":["chompSound"]
         },
         "frames":[0,1,2,3,4,5,6,7]
      },
      {
         "complete":"Idle1",
         "name":"Idle1",
         "speed":"110",
         "frames":[8,9,10,11]
      },
      {
         "complete":"Walk",
         "name":"Walk",
         "speed":"110",
         "frames":[12,13,14,15,16,17,18,19]
      },
      {
         "complete":"Idle1",
         "name":"Idle2",
         "speed":"110",
         "frames":[20,21,22,23]
      },
      {
         "complete":"Fly",
         "name":"Fly",
         "speed":"110",
         "frames":[24]
      }
   ]
};
  $.reverseMerge(I, {
    data: animationData
  });
  self = GameObject(I).extend({
    before: {
      update: function() {
        if (keydown.b) {
          self.transition("bite");
        }
        if (keydown.z || keydown.x) {
          self.transition("Walk");
        }
        return !(keydown.z || keydown.x || keydown.b) ? self.transition("Idle1") : null;
      }
    },
    transform: function() {
      var m;
      m = Matrix.IDENTITY;
      if (keydown.z) {
        m = Matrix.HORIZONTAL_FLIP;
      }
      return m;
    }
  });
  self.include(Animated);
  self.bind('chompSound', function() {
    return log("chomp like a champ");
  });
  return self;
};;
Array.prototype.wrap = function(start, length) {
  if(length != null) {
    var end = start + length;
    var result = [];

    for(var i = start; i < end; i++) {
      result.push(this[i.mod(this.length)]);
    }

    return result;
  } else {
    return this[start.mod(this.length)];
  }
};
;;
(function($) {
  var defaults;
  defaults = {
    FPS: 33.3333,
    backgroundColor: "#FFFFFF"
  };
  return (window.Engine = function(options) {
    var FPS, age, backgroundColor, cameraTransform, canvas, construct, draw, init, intervalId, objects, paused, queuedObjects, savedState, self, step, update, updatePhysics, world;
    options = $.extend({}, defaults, options);
    intervalId = null;
    savedState = null;
    age = 0;
    paused = false;
    backgroundColor = options.backgroundColor;
    FPS = options.FPS;
    queuedObjects = [];
    objects = [];
    cameraTransform = Matrix.IDENTITY;
    world = null;
    init = function() {
      var b2Body, b2BodyDef, b2CircleShape, b2DebugDraw, b2Fixture, b2FixtureDef, b2MassData, b2PolygonShape, b2Vec2, b2World, bodyDef, debugDraw, fixDef;
      b2Vec2 = Box2D.Common.Math.b2Vec2;
      b2BodyDef = Box2D.Dynamics.b2BodyDef;
      b2Body = Box2D.Dynamics.b2Body;
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
      b2Fixture = Box2D.Dynamics.b2Fixture;
      b2World = Box2D.Dynamics.b2World;
      b2MassData = Box2D.Collision.Shapes.b2MassData;
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
      world = new b2World(new b2Vec2(0, 10), true);
      fixDef = new b2FixtureDef();
      fixDef.density = 1.0;
      fixDef.friction = 0.5;
      fixDef.restitution = 0.2;
      bodyDef = new b2BodyDef();
      bodyDef.type = b2Body.b2_staticBody;
      bodyDef.position.x = 9;
      bodyDef.position.y = 13;
      fixDef.shape = new b2PolygonShape();
      fixDef.shape.SetAsBox(10, 0.5);
      world.CreateBody(bodyDef).CreateFixture(fixDef);
      bodyDef.type = b2Body.b2_dynamicBody;
      (10).times(function(i) {
        if (rand() > 0.5) {
          fixDef.shape = new b2PolygonShape();
          fixDef.shape.SetAsBox(rand() + 0.1, rand() + 0.1);
        } else {
          fixDef.shape = new b2CircleShape(rand() + 0.1);
        }
        bodyDef.position.x = rand() * 10;
        bodyDef.position.y = rand() * 10;
        return world.CreateBody(bodyDef).CreateFixture(fixDef);
      });
      debugDraw = new b2DebugDraw();
      debugDraw.SetSprite(options.canvas.get(0).getContext("2d"));
      debugDraw.SetDrawScale(30.0);
      debugDraw.SetFillAlpha(0.3);
      debugDraw.SetLineThickness(1.0);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      return world.SetDebugDraw(debugDraw);
    };
    updatePhysics = function() {
      debugger;
      world.Step(1 / 30, 10, 10);
      world.DrawDebugData();
      return world.ClearForces();
    };
    init();
    update = function() {
      objects = objects.select(function(object) {
        return (typeof object === "undefined" || object === null) ? undefined : object.update(true);
      });
      objects = objects.concat(queuedObjects);
      queuedObjects = [];
      return updatePhysics();
    };
    draw = function() {
      return canvas.withTransform(cameraTransform, function(canvas) {
        if (backgroundColor) {
          canvas.fill(backgroundColor);
        }
        return objects.invoke("draw", canvas);
      });
    };
    step = function() {
      if (!(paused)) {
        update();
        age += 1;
      }
      return draw();
    };
    canvas = options.canvas || $("<canvas />").powerCanvas();
    construct = function(entityData) {
      return entityData["class"] ? entityData["class"].constantize()(entityData) : GameObject(entityData);
    };
    return (self = {
      add: function(entityData) {
        var obj;
        obj = construct(entityData);
        return intervalId && !paused ? queuedObjects.push(obj) : objects.push(obj);
      },
      construct: construct,
      age: function() {
        return age;
      },
      objects: function() {
        return objects;
      },
      objectAt: function(x, y) {
        var bounds, targetObject;
        targetObject = null;
        bounds = {
          x: x,
          y: y,
          width: 1,
          height: 1
        };
        self.eachObject(function(object) {
          if (object.collides(bounds)) {
            return (targetObject = object);
          }
        });
        return targetObject;
      },
      eachObject: function(iterator) {
        return objects.each(iterator);
      },
      collides: function(bounds, selector) {
        return objects.inject([], function(collidingObjects, object) {
          if (object.solid() && object.collides(bounds)) {
            collidingObjects.push(object);
          }
          return collidingObjects;
        }).length;
      },
      rayCollides: function(source, direction) {
        var hits, nearestDistance, nearestHit;
        hits = objects.map(function(object) {
          var hit;
          hit = object.solid() && Collision.rayRectangle(source, direction, object.centeredBounds());
          if (hit) {
            hit.object = object;
          }
          return hit;
        });
        nearestDistance = Infinity;
        nearestHit = null;
        hits.each(function(hit) {
          var d;
          if (hit && (d = hit.distance(source)) < nearestDistance) {
            nearestDistance = d;
            return (nearestHit = hit);
          }
        });
        return nearestHit;
      },
      saveState: function() {
        return (savedState = objects.map(function(object) {
          return $.extend({}, object.I);
        }));
      },
      loadState: function(newState) {
        return newState || (newState = savedState) ? (objects = newState.map(function(objectData) {
          return construct($.extend({}, objectData));
        })) : null;
      },
      reload: function() {
        return (objects = objects.map(function(object) {
          return construct(object.I);
        }));
      },
      start: function() {
        return !(intervalId) ? (intervalId = setInterval(function() {
          return step();
        }, 1000 / FPS)) : null;
      },
      stop: function() {
        clearInterval(intervalId);
        return (intervalId = null);
      },
      play: function() {
        return (paused = false);
      },
      pause: function() {
        return (paused = true);
      },
      paused: function() {
        return paused;
      }
    });
  });
})(jQuery);;
var Moogle;
Moogle = function(I) {
  var GRAVITY, PHYSICS, falling, jumping, laserColors, laserEndpoint, lastDirection, particleSizes, physics, self, shooting;
  I || (I = {});
  GRAVITY = Point(0, 2);
  $.reverseMerge(I, {
    color: "blue",
    speed: 6,
    acceleration: Point(0, 0),
    solid: false,
    width: 16,
    height: 16,
    velocity: Point(0, 0),
    excludedModules: ["Movable"]
  });
  I.acceleration = Point(I.acceleration.x, I.acceleration.y);
  I.velocity = Point(I.velocity.x, I.velocity.y);
  jumping = false;
  falling = true;
  lastDirection = 1;
  shooting = false;
  laserEndpoint = null;
  PHYSICS = {
    platform: function() {
      if (jumping) {
        I.velocity.y += GRAVITY.scale(0.5).y;
      } else if (falling) {
        I.velocity.y += GRAVITY.y;
      } else {
        if (keydown.up) {
          jumping = true;
          I.velocity.y = -7 * GRAVITY.y - 2;
        }
      }
      if (keydown.right) {
        I.velocity.x += 2;
      }
      if (keydown.left) {
        I.velocity.x -= 2;
      }
      if (!(keydown.left || keydown.right)) {
        I.velocity.x = 0;
      }
      if (!(keydown.up)) {
        jumping = false;
      }
      shooting = keydown.space;
      if (I.velocity.x.sign()) {
        lastDirection = I.velocity.x.sign();
      }
      return (I.velocity.x = I.velocity.x.clamp(-8, 8));
    },
    arena: function() {
      I.velocity.y = I.velocity.y.approach(0, 1);
      I.velocity.x = I.velocity.x.approach(0, 1);
      if (Game.keydown("right")) {
        I.velocity.x += 2;
      }
      if (Game.keydown("left")) {
        I.velocity.x -= 2;
      }
      if (Game.keydown("up")) {
        I.velocity.y -= 2;
      }
      if (Game.keydown("down")) {
        I.velocity.y += 2;
      }
      I.velocity.y = I.velocity.y.clamp(-I.speed, I.speed);
      return (I.velocity.x = I.velocity.x.clamp(-I.speed, I.speed));
    }
  };
  physics = PHYSICS.platform;
  laserColors = ["rgba(255, 0, 128, 0.75)", "rgba(255, 0, 128, 0.75)", "rgba(255, 0, 128, 0.75)", "rgba(255, 255, 255, 0.25)", "rgba(32, 190, 230, 0.25)"];
  particleSizes = [2, 8, 4, 6];
  self = GameObject(I).extend({
    before: {
      draw: function(canvas) {
        var laserStart;
        laserStart = self.centeredBounds();
        return laserEndpoint ? (5).times(function() {
          canvas.strokeColor(laserColors.rand());
          return canvas.drawLine(laserStart.x, laserStart.y, laserEndpoint.x, laserEndpoint.y, 2);
        }) : null;
      },
      update: function() {
        var center, nearestHit, object, shootDirection;
        if (engine.collides(self.bounds(0, 1))) {
          falling = false;
        } else {
          falling = true;
        }
        physics();
        I.velocity.x.abs().times(function() {
          return !engine.collides(self.bounds(I.velocity.x.sign(), 0)) ? I.x += I.velocity.x.sign() : (I.velocity.x = 0);
        });
        I.velocity.y.abs().times(function() {
          if (!engine.collides(self.bounds(0, I.velocity.y.sign()))) {
            return I.y += I.velocity.y.sign();
          } else {
            I.velocity.y = 0;
            return (jumping = false);
          }
        });
        if (Mouse.left) {
          shootDirection = Mouse.location.subtract(I);
        } else if (shooting) {
          shootDirection = Point(lastDirection, 0);
        }
        laserEndpoint = null;
        if (shootDirection) {
          center = self.centeredBounds();
          if (nearestHit = engine.rayCollides(center, shootDirection)) {
            laserEndpoint = nearestHit;
            object = nearestHit.object;
          }
          if (laserEndpoint) {
            engine.add({
              "class": "Emitter",
              duration: 10,
              sprite: Sprite.EMPTY,
              velocity: Point(0, 0),
              particleCount: 2,
              batchSize: 5,
              x: laserEndpoint.x,
              y: laserEndpoint.y,
              generator: {
                color: Color(255, 0, 0, 0.5),
                duration: 3,
                height: function(n) {
                  return particleSizes.wrap(n);
                },
                maxSpeed: 5,
                velocity: function(n) {
                  return Point.fromAngle(Random.angle()).scale(rand(5) + 1);
                },
                width: function(n) {
                  return particleSizes.wrap(n);
                }
              }
            });
          } else {
            laserEndpoint = shootDirection.norm().scale(1000).add(I);
          }
        }
        if ((typeof object === "undefined" || object === null) ? undefined : object.I.destructable) {
          object.I.active = false;
          engine.add({
            "class": "Emitter",
            duration: 10,
            sprite: Sprite.EMPTY,
            velocity: Point(0, 0),
            particleCount: 15,
            batchSize: 5,
            x: object.I.width / 2 + object.I.x,
            y: object.I.height / 2 + object.I.y,
            generator: {
              color: "rgba(200, 140, 235, 0.7)",
              duration: 15,
              height: function(n) {
                return particleSizes.wrap(n) * 3;
              },
              maxSpeed: 35,
              velocity: function(n) {
                return Point.fromAngle(Random.angle()).scale(rand(5) + 5);
              },
              width: function(n) {
                return particleSizes.wrap(n) * 3;
              }
            }
          });
        }
        return engine.eachObject(function(object) {
          if (object.I.open && Collision.rectangular(I, object.bounds())) {
            if (I.active) {
              I.active = false;
              return engine.queue(nextLevel);
            }
          }
        });
      }
    }
  });
  return self;
};;
;
var Animated;
Animated = function(I, self) {
  var advanceFrame, find;
  I || (I = {});
  $.reverseMerge(I, {
    data: {},
    spriteLookup: {},
    activeAnimation: [],
    currentFrameIndex: 0,
    lastUpdate: new Date().getTime()
  });
  I.activeAnimation = I.data.animations[0];
  I.currentFrameIndex = I.activeAnimation.frames[0];
  advanceFrame = function() {
    var frames, nextState;
    frames = I.activeAnimation.frames;
    if (I.currentFrameIndex === frames.last()) {
      self.trigger("Complete");
      nextState = I.activeAnimation.complete;
      if (nextState) {
        I.activeAnimation = find(nextState) || I.activeAnimation;
        I.width = I.spriteLookup[I.activeAnimation.frames[0]].width;
        I.height = I.spriteLookup[I.activeAnimation.frames[0]].height;
      }
    }
    return (I.currentFrameIndex = I.activeAnimation.frames[(frames.indexOf(I.currentFrameIndex) + 1) % frames.length]);
  };
  find = function(name) {
    var result;
    result = null;
    I.data.animations.each(function(animation) {
      if (animation.name.toLowerCase() === name.toLowerCase()) {
        return (result = animation);
      }
    });
    return result;
  };
  I.data.tileset.each(function(spriteData, i) {
    return (I.spriteLookup[i] = Sprite.fromURL(spriteData.src));
  });
  return {
    draw: function(canvas) {
      return self.transform ? canvas.withTransform(self.transform(), function() {
        return I.spriteLookup[I.currentFrameIndex].draw(canvas, I.x, I.y);
      }) : I.spriteLookup[I.currentFrameIndex].draw(canvas, I.x, I.y);
    },
    transition: function(newState) {
      var firstFrame, firstSprite, nextState;
      if (newState === I.activeAnimation.name || I.activeAnimation.continuous) {
        return null;
      }
      nextState = find(newState);
      if (nextState) {
        I.activeAnimation = nextState;
        firstFrame = I.activeAnimation.frames.first();
        firstSprite = I.spriteLookup[firstFrame];
        I.currentFrameIndex = firstFrame;
        I.width = firstSprite.width;
        return (I.height = firstSprite.height);
      }
    },
    before: {
      update: function(useTimer) {
        var time, updateFrame;
        if (useTimer) {
          time = new Date().getTime();
          updateFrame = (time - I.lastUpdate) >= I.activeAnimation.speed;
          if (updateFrame) {
            I.lastUpdate = time;
            if (I.activeAnimation.triggers && I.activeAnimation.triggers[I.currentFrameIndex]) {
              I.activeAnimation.triggers[I.currentFrameIndex].each(function(event) {
                return self.trigger(event);
              });
            }
            return advanceFrame();
          }
        } else {
          if (I.activeAnimation.triggers && I.activeAnimation.triggers[I.currentFrameIndex]) {
            I.activeAnimation.triggers[I.currentFrameIndex].each(function(event) {
              return self.trigger(event);
            });
          }
          return advanceFrame();
        }
      }
    }
  };
};;
;$(function(){ var block, developer, objectToUpdate, savedState;
window.engine = Engine({
  canvas: $("canvas").powerCanvas(),
  FPS: 60
});
block = {
  color: "#CB8",
  width: 32,
  height: 32,
  solid: true
};
engine.loadState(Local.get("level"));
engine.start();
developer = false;
savedState = null;
objectToUpdate = null;
window.updateObjectProperties = function(newProperties) {
  return objectToUpdate ? $.extend(objectToUpdate, engine.construct(newProperties)) : null;
};
$(document).bind("contextmenu", function(event) {
  return event.preventDefault();
});
$(document).mousedown(function(event) {
  var object;
  if (developer) {
    if (event.which === 3) {
      if (object = engine.objectAt(event.pageX, event.pageY)) {
        parent.editProperties(object.I);
        return (objectToUpdate = object);
      }
    } else if (event.which === 2 || keydown.shift) {
      return engine.add($.extend({
        x: event.pageX.snap(32),
        y: event.pageY.snap(32)
      }, block));
    }
  }
});
$(document).bind("keydown", "esc", function() {
  developer = !developer;
  return developer ? engine.pause() : engine.play();
});
$(document).bind("keydown", "f3 meta+s", function() {
  return Local.set("level", engine.saveState());
});
$(document).bind("keydown", "f4 meta+l", function() {
  return engine.loadState(Local.get("level"));
});
$(document).bind("keydown", "f5", function() {
  return engine.reload();
}); });