(function(e){"use strict";function t(e,t,n){if(e.addEventListener){return e.addEventListener(t,n,false)}if(e.attachEvent){return e.attachEvent("on"+t,n)}}function n(e,t){var n,r;for(n=0,r=e.length;n<r;n++){if(e[n]===t){return true}}return false}function r(e,t){var n;if(e.createTextRange){n=e.createTextRange();n.move("character",t);n.select()}else if(e.selectionStart){e.focus();e.setSelectionRange(t,t)}}function i(e,t){try{e.type=t;return true}catch(n){return false}}e.Placeholders={Utils:{addEventListener:t,inArray:n,moveCaret:r,changeType:i}}})(this);(function(e){"use strict";function M(){}function _(e){var t;if(e.value===e.getAttribute(a)&&e.getAttribute(f)==="true"){e.setAttribute(f,"false");e.value="";e.className=e.className.replace(s,"");t=e.getAttribute(l);if(t){e.type=t}return true}return false}function D(e){var t,n=e.getAttribute(a);if(e.value===""&&n){e.setAttribute(f,"true");e.value=n;e.className+=" "+i;t=e.getAttribute(l);if(t){e.type="text"}else if(e.type==="password"){if(b.changeType(e,"text")){e.setAttribute(l,"password")}}return true}return false}function P(e,t){var n,r,i,s,f;if(e&&e.getAttribute(a)){t(e)}else{n=e?e.getElementsByTagName("input"):o;r=e?e.getElementsByTagName("textarea"):u;for(f=0,s=n.length+r.length;f<s;f++){i=f<n.length?n[f]:r[f-n.length];t(i)}}}function H(e){P(e,_)}function B(e){P(e,D)}function j(e){return function(){if(w&&e.value===e.getAttribute(a)&&e.getAttribute(f)==="true"){b.moveCaret(e,0)}else{_(e)}}}function F(e){return function(){D(e)}}function I(e){return function(t){S=e.value;if(e.getAttribute(f)==="true"){if(S===e.getAttribute(a)&&b.inArray(n,t.keyCode)){if(t.preventDefault){t.preventDefault()}return false}}}}function q(e){return function(){var t;if(e.getAttribute(f)==="true"&&e.value!==S){e.className=e.className.replace(s,"");e.value=e.value.replace(e.getAttribute(a),"");e.setAttribute(f,false);t=e.getAttribute(l);if(t){e.type=t}}if(e.value===""){e.blur();b.moveCaret(e,0)}}}function R(e){return function(){if(e===document.activeElement&&e.value===e.getAttribute(a)&&e.getAttribute(f)==="true"){b.moveCaret(e,0)}}}function U(e){return function(){H(e)}}function z(e){if(e.form){k=e.form;if(!k.getAttribute(c)){b.addEventListener(k,"submit",U(k));k.setAttribute(c,"true")}}b.addEventListener(e,"focus",j(e));b.addEventListener(e,"blur",F(e));if(w){b.addEventListener(e,"keydown",I(e));b.addEventListener(e,"keyup",q(e));b.addEventListener(e,"click",R(e))}e.setAttribute(h,"true");e.setAttribute(a,N);D(e)}var t=["text","search","url","tel","email","password","number","textarea"],n=[27,33,34,35,36,37,38,39,40,8,46],r="#ccc",i="placeholdersjs",s=new RegExp("(?:^|\\s)"+i+"(?!\\S)"),o,u,a="data-placeholder-value",f="data-placeholder-active",l="data-placeholder-type",c="data-placeholder-submit",h="data-placeholder-bound",p="data-placeholder-focus",d="data-placeholder-live",v=document.createElement("input"),m=document.getElementsByTagName("head")[0],g=document.documentElement,y=e.Placeholders,b=y.Utils,w,E,S,x,T,N,C,k,L,A,O;y.nativeSupport=v.placeholder!==void 0;if(!y.nativeSupport){o=document.getElementsByTagName("input");u=document.getElementsByTagName("textarea");w=g.getAttribute(p)==="false";E=g.getAttribute(d)!=="false";x=document.createElement("style");x.type="text/css";T=document.createTextNode("."+i+" { color:"+r+"; }");if(x.styleSheet){x.styleSheet.cssText=T.nodeValue}else{x.appendChild(T)}m.insertBefore(x,m.firstChild);for(O=0,A=o.length+u.length;O<A;O++){L=O<o.length?o[O]:u[O-o.length];N=L.attributes.placeholder;if(N){N=N.nodeValue;if(N&&b.inArray(t,L.type)){z(L)}}}C=setInterval(function(){for(O=0,A=o.length+u.length;O<A;O++){L=O<o.length?o[O]:u[O-o.length];N=L.attributes.placeholder;if(N){N=N.nodeValue;if(N&&b.inArray(t,L.type)){if(!L.getAttribute(h)){z(L)}if(N!==L.getAttribute(a)||L.type==="password"&&!L.getAttribute(l)){if(L.type==="password"&&!L.getAttribute(l)&&b.changeType(L,"text")){L.setAttribute(l,"password")}if(L.value===L.getAttribute(a)){L.value=N}L.setAttribute(a,N)}}}}if(!E){clearInterval(C)}},100)}y.disable=y.nativeSupport?M:H;y.enable=y.nativeSupport?M:B})(this)