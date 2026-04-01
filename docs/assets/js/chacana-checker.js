"use strict";var ChacanaChecker=(()=>{var P=Object.defineProperty;var Ae=Object.getOwnPropertyDescriptor;var ve=Object.getOwnPropertyNames;var ke=Object.prototype.hasOwnProperty;var le=e=>{throw TypeError(e)};var Se=(e,n,t)=>n in e?P(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Ne=(e,n)=>{for(var t in n)P(e,t,{get:n[t],enumerable:!0})},$e=(e,n,t,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let a of ve(n))!ke.call(e,a)&&a!==t&&P(e,a,{get:()=>n[a],enumerable:!(r=Ae(n,a))||r.enumerable});return e};var Re=e=>$e(P({},"__esModule",{value:!0}),e);var F=(e,n,t)=>Se(e,typeof n!="symbol"?n+"":n,t),se=(e,n,t)=>n.has(e)||le("Cannot "+t);var d=(e,n,t)=>(se(e,n,"read from private field"),t?t.call(e):n.get(e)),H=(e,n,t)=>n.has(e)?le("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),x=(e,n,t,r)=>(se(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t);var hn={};Ne(hn,{HEAD_ADD:()=>p,HEAD_MULTIPLY:()=>g,IndexType:()=>Q,STRUCTURAL_HEADS:()=>fe,Variance:()=>v,buildAST:()=>T,checkAll:()=>ye,loadContext:()=>Ie});var v=(t=>(t.Contra="Contra",t.Covar="Covar",t))(v||{}),Q=(r=>(r.Latin="Latin",r.Greek="Greek",r.Spinor="Spinor",r))(Q||{});function y(){return{symmetrized_groups:[],antisymmetrized_groups:[],order:null}}var p="Add",_="Negate",g="Multiply",b="Wedge",L="ExteriorDerivative",G="LieDerivative",U="Trace",z="Determinant",j="Inverse",R="HodgeStar",B="InteriorProduct",ee="Perturbation",ne="Commutator",I="Number",ce={d:L,L:G,Tr:U,det:z,inv:j,star:R,hodge:R,i:B},fe=new Set([p,_,g,b,L,G,U,z,j,R,B,ee,ne,I]),Ve=/[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]/;function ue(e){return Ve.test(e)?"Greek":"Latin"}function*k(e){yield e;for(let n of e.args)yield*k(n)}function C(e,n=[],t=[],r=null,a=y(),o=null){return{head:e,args:n,indices:t,value:r,metadata:a,range:o}}function D(e){return{startLine:e.startPosition.row,startColumn:e.startPosition.column,endLine:e.endPosition.row,endColumn:e.endPosition.column}}function te(e,n,t=!1,r=null){return{label:n,variance:e==="^"?"Contra":"Covar",indexType:ue(n),isDerivative:t,derivativeType:r}}function T(e){if(e.type==="source_file"){let n=e.namedChildren[0];return n?T(n):null}if(e.hasError)return null;switch(e.type){case"sum_expression":return re(e,p,"+","-");case"product_expression":return re(e,g,"*");case"wedge_expression":return re(e,b,"^");case"tensor_expr":return Me(e);case"functional_op":return Pe(e);case"scalar":return Fe(e);case"perturbation":return He(e);case"commutator":return Le(e);case"paren_expression":{let n=e.namedChildren[0];return n?T(n):null}default:return null}}function re(e,n,...t){let r=[],a=[];de(e,n,r,a);let o=[];for(let i=0;i<r.length;i++)i>0&&a[i-1]==="-"?o.push(C(_,[r[i]],[],null,y(),D(e))):o.push(r[i]);return o.length===1?o[0]:C(n,o,[],null,y(),D(e))}function de(e,n,t,r){if(e.type!==Oe(n)){let l=T(e);l&&t.push(l);return}let a=e.childForFieldName("left"),o=e.childForFieldName("right"),i=e.childForFieldName("operator");if(a&&de(a,n,t,r),i&&r.push(i.type),o){let l=T(o);l&&t.push(l)}}function Oe(e){return e===p?"sum_expression":e===g?"product_expression":e===b?"wedge_expression":""}function Me(e){let t=e.childForFieldName("name")?.text??"",r=e.childForFieldName("indices"),{indices:a,metadata:o}=r?ie(r.namedChildren[0]):{indices:[],metadata:y()};return C(t,[],a,null,o,D(e))}function Pe(e){let t=e.childForFieldName("name")?.text??"",r=ce[t]??t,a=e.childForFieldName("arguments"),o=[];if(a)for(let s of a.namedChildren){let u=T(s);u&&o.push(u)}let i=e.childForFieldName("indices"),{indices:l,metadata:c}=i?ie(i.namedChildren[0]):{indices:[],metadata:y()};return C(r,o,l,null,c,D(e))}function Fe(e){let n=e.text,t=n.includes(".")?parseFloat(n):parseInt(n,10);return C(I,[],[],t,y(),D(e))}function He(e){let n=e.childForFieldName("order"),t=e.childForFieldName("body"),r=n?parseInt(n.text,10):0,a=t?T(t):null;return C(ee,a?[a]:[],[],null,{...y(),order:r},D(e))}function Le(e){let n=e.childForFieldName("left"),t=e.childForFieldName("right"),r=[];if(n){let a=T(n);a&&r.push(a)}if(t){let a=T(t);a&&r.push(a)}return C(ne,r,[],null,y(),D(e))}function ie(e){if(!e||e.type!=="index_list"&&e.type!=="sym_index_list")return{indices:[],metadata:y()};let n=[],t=[],r=[];for(let o of e.namedChildren)if(o.type==="index")n.push(Ge(o));else if(o.type==="symmetrization"||o.type==="anti_symmetrization"){let i=o.namedChildren.find(l=>l.type==="index_list"||l.type==="sym_index_list");if(i){let l=n.length,c=ie(i),s=[];for(let u=0;u<c.indices.length;u++)s.push(l+u);n.push(...c.indices),o.type==="symmetrization"?t.push(s):r.push(s)}}return{indices:n,metadata:{symmetrized_groups:t,antisymmetrized_groups:r,order:null}}}function Ge(e){let n=e.childForFieldName("variance"),t=e.childForFieldName("name");if(!t)return te(n?.text??null,"");if(t.type==="derivative"){let r=t.childForFieldName("type"),a=t.childForFieldName("name"),o=r?.text===";"?"semicolon":"comma";return te(n?.text??null,a?.text??"",!0,o)}return te(n?.text??null,t.text)}function A(e,n=!1){if(e.head===p)return e.args.length>0?A(e.args[0],n):[];if(e.head===_)return e.args.length>0?A(e.args[0],n):[];if(e.head===g){let t=[];for(let r of e.args)t.push(...A(r,n));return Ue(t,n)}if(e.head===b){let t=[];for(let r of e.args)t.push(...A(r,n));return t}return e.head===L?e.args.length>0?A(e.args[0],n):[]:e.head===I?[]:[...e.indices]}function Ue(e,n=!1){let t=[],r=new Set;for(let a=0;a<e.length;a++){if(r.has(a))continue;let o=!1;for(let i=a+1;i<e.length;i++)if(!r.has(i)&&e[a].label===e[i].label&&e[a].indexType===e[i].indexType&&(e[a].variance!==e[i].variance||n)){r.add(a),r.add(i),o=!0;break}o||t.push(e[a])}return t}function Z(e){if(e.head===p){if(e.args.length===0)return[];let n=new Map;for(let r of e.args){let a=new Map;for(let o of Z(r)){let i=`${o.label}:${o.variance}:${o.indexType}`,l=a.get(i);l?l.count++:a.set(i,{idx:o,count:1})}for(let[o,{idx:i,count:l}]of a){let c=n.get(o);(!c||l>c.count)&&n.set(o,{idx:i,count:l})}}let t=[];for(let{idx:r,count:a}of n.values())for(let o=0;o<a;o++)t.push(r);return t}if(e.head===_)return e.args.length>0?Z(e.args[0]):[];if(e.head===g||e.head===b){let n=[];for(let t of e.args)n.push(...Z(t));return n}return e.head===I?[]:[...e.indices]}function q(e,n){return e.indices.length>0?e.indices.length:n.tensors.get(e.head)?.rank??null}function ze(e,n){if(e.indices.length>0)return e.indices.map(r=>r.variance);let t=n.tensors.get(e.head);return t?.indexPattern.length?[...t.indexPattern]:null}function je(e,n){let t=q(e,n);if(t==null)return null;if(t!==1)return!1;let r=ze(e,n);return r==null?null:r[0]==="Contra"}function me(e){return e.length===0?"{}":`{${e.map(t=>`${t.variance==="Contra"?"^":"_"}${t.label}`).join(" ")}}`}function ae(e,n,t){if(e.head===g||e.head===b){let r=[];for(let o of e.args)ae(o,n,t),r.push(...Z(o));let a=new Map;for(let o of r){let i=a.get(o.label)??[];i.push(o),a.set(o.label,i)}for(let[o,i]of a)if(i.length===2){if(i[0].indexType!==i[1].indexType)t.push({message:`Contraction index '${o}' has mismatched index type: ${i[0].indexType} vs ${i[1].indexType}`,range:e.range,code:"chacana/contraction"});else if(e.head===g&&i[0].variance===i[1].variance){if(n?.activeMetric)continue;t.push({message:`Contraction index '${o}' appears twice with same variance (${i[0].variance})`,range:e.range,code:"chacana/contraction"})}}else i.length>2&&t.push({message:`Index '${o}' appears ${i.length} times (expected at most 2)`,range:e.range,code:"chacana/contraction"})}else for(let r of e.args)ae(r,n,t)}function Be(e,n,t){let r=!!n?.activeMetric;for(let a of k(e)){if(a.head!==p||a.args.length<2)continue;let o=A(a.args[0],r),i=he(o);for(let l=1;l<a.args.length;l++){let c=A(a.args[l],r),s=he(c);Ze(i,s)||t.push({message:`Free index mismatch in sum: term 0 has ${me(o)}, term ${l} has ${me(c)}`,range:a.range,code:"chacana/free-index"})}}}function he(e){let n=new Map;for(let t of e){let r=`${t.label}:${t.variance}`;n.set(r,(n.get(r)??0)+1)}return n}function Ze(e,n){if(e.size!==n.size)return!1;for(let[t,r]of e)if(n.get(t)!==r)return!1;return!0}function qe(e,n,t){for(let r of k(e))Ye(r,n,t)}function ge(e,n,t,r,a){if(n.length<2)return;let o=e[n[0]];for(let i=1;i<n.length;i++){let l=e[n[i]];o.variance!==l.variance&&a.push({message:`Variance mismatch in ${t}: index '${o.label}' (${o.variance}) vs '${l.label}' (${l.variance})`,range:r,code:"chacana/symmetry"}),o.indexType!==l.indexType&&a.push({message:`Index type mismatch in ${t}: index '${o.label}' (${o.indexType}) vs '${l.label}' (${l.indexType})`,range:r,code:"chacana/symmetry"})}}function Ye(e,n,t){for(let[r,a]of[["symmetrization",e.metadata.symmetrized_groups],["anti-symmetrization",e.metadata.antisymmetrized_groups]])for(let o of a)ge(e.indices,o,r,e.range,t);if(n!=null){let r=n.tensors.get(e.head);if(r&&e.indices.length>0)for(let a of r.symmetries){let o=a.indices.map(i=>i-1);o.every(i=>i>=0&&i<e.indices.length)&&ge(e.indices,o,`declared symmetry of '${e.head}'`,e.range,t)}}}var Xe=new Set([p,g,b,_,I]);function Ke(e,n,t){for(let r of k(e)){if(Xe.has(r.head))continue;let a=n.tensors.get(r.head);if(!a)continue;let o=r.indices.filter(i=>!i.isDerivative);if(o.length>0&&o.length!==a.rank&&t.push({message:`Tensor '${r.head}' declared with rank ${a.rank}, but used with ${o.length} indices`,range:r.range,code:"chacana/rank"}),o.length>0&&a.indexPattern.length>0&&!n.activeMetric)for(let i=0;i<Math.min(o.length,a.indexPattern.length);i++)o[i].variance!==a.indexPattern[i]&&t.push({message:`Tensor '${r.head}' index ${i}: expected ${a.indexPattern[i]}, got ${o[i].variance}`,range:r.range,code:"chacana/rank"})}}function We(e,n,t){n.activeMetric||t.push({message:"Hodge star operator requires an active_metric in the context",range:e.range,code:"chacana/operator"})}function pe(e){return(n,t,r)=>{n.args.length<1||je(n.args[0],t)===!1&&r.push({message:`${e} first argument must be a vector field (rank 1 contravariant)`,range:n.range,code:"chacana/operator"})}}function Je(e,n,t){if(e.args.length<2)return;let r=q(e.args[1],n);r!=null&&r===0&&t.push({message:"Interior product is undefined for 0-forms (rank 0)",range:e.range,code:"chacana/operator"})}function Qe(e,n){return(t,r,a)=>{if(t.args.length<1)return;let o=q(t.args[0],r);o!=null&&o<e&&a.push({message:`${n} requires a tensor of rank >= ${e}, but argument has rank ${o}`,range:t.range,code:"chacana/operator"})}}function xe(e,n){return(t,r,a)=>{if(t.args.length<1)return;let o=q(t.args[0],r);o!=null&&o!==e&&a.push({message:`${n} requires a rank-${e} tensor, but argument has rank ${o}`,range:t.range,code:"chacana/operator"})}}var en={[R]:[We],[B]:[pe("Interior product"),Je],[G]:[pe("Lie derivative")],[U]:[Qe(2,"Trace")],[z]:[xe(2,"Determinant")],[j]:[xe(2,"Inverse")]};function nn(e,n,t){for(let r of k(e)){let a=en[r.head];if(a)for(let o of a)o(r,n,t)}}function ye(e,n=null){let t=[];return ae(e,n,t),Be(e,n,t),qe(e,n,t),n&&(Ke(e,n,t),nn(e,n,t)),t}function tn(e,n){let t=e.slice(0,n).split(/\r\n|\n|\r/g);return[t.length,t.pop().length+1]}function rn(e,n,t){let r=e.split(/\r\n|\n|\r/g),a="",o=(Math.log10(n+1)|0)+1;for(let i=n-1;i<=n+1;i++){let l=r[i-1];l&&(a+=i.toString().padEnd(o," "),a+=":  ",a+=l,a+=`
`,i===n&&(a+=" ".repeat(o+t+2),a+=`^
`))}return a}var f=class extends Error{constructor(t,r){let[a,o]=tn(r.toml,r.ptr),i=rn(r.toml,a,o);super(`Invalid TOML document: ${t}

${i}`,r);F(this,"line");F(this,"column");F(this,"codeblock");this.line=a,this.column=o,this.codeblock=i}};function an(e,n){let t=0;for(;e[n-++t]==="\\";);return--t&&t%2}function Y(e,n=0,t=e.length){let r=e.indexOf(`
`,n);return e[r-1]==="\r"&&r--,r<=t?r:-1}function S(e,n){for(let t=n;t<e.length;t++){let r=e[t];if(r===`
`)return t;if(r==="\r"&&e[t+1]===`
`)return t+1;if(r<" "&&r!=="	"||r==="\x7F")throw new f("control characters are not allowed in comments",{toml:e,ptr:n})}return e.length}function h(e,n,t,r){let a;for(;(a=e[n])===" "||a==="	"||!t&&(a===`
`||a==="\r"&&e[n+1]===`
`);)n++;return r||a!=="#"?n:h(e,S(e,n),t)}function Te(e,n,t,r,a=!1){if(!r)return n=Y(e,n),n<0?e.length:n;for(let o=n;o<e.length;o++){let i=e[o];if(i==="#")o=Y(e,o);else{if(i===t)return o+1;if(i===r||a&&(i===`
`||i==="\r"&&e[o+1]===`
`))return o}}throw new f("cannot find end of structure",{toml:e,ptr:n})}function X(e,n){let t=e[n],r=t===e[n+1]&&e[n+1]===e[n+2]?e.slice(n,n+3):t;n+=r.length-1;do n=e.indexOf(r,++n);while(n>-1&&t!=="'"&&an(e,n));return n>-1&&(n+=r.length,r.length>1&&(e[n]===t&&n++,e[n]===t&&n++)),n}var on=/^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i,w,E,m,N=class N extends Date{constructor(t){let r=!0,a=!0,o="Z";if(typeof t=="string"){let i=t.match(on);i?(i[1]||(r=!1,t=`0000-01-01T${t}`),a=!!i[2],a&&t[10]===" "&&(t=t.replace(" ","T")),i[2]&&+i[2]>23?t="":(o=i[3]||null,t=t.toUpperCase(),!o&&a&&(t+="Z"))):t=""}super(t);H(this,w,!1);H(this,E,!1);H(this,m,null);isNaN(this.getTime())||(x(this,w,r),x(this,E,a),x(this,m,o))}isDateTime(){return d(this,w)&&d(this,E)}isLocal(){return!d(this,w)||!d(this,E)||!d(this,m)}isDate(){return d(this,w)&&!d(this,E)}isTime(){return d(this,E)&&!d(this,w)}isValid(){return d(this,w)||d(this,E)}toISOString(){let t=super.toISOString();if(this.isDate())return t.slice(0,10);if(this.isTime())return t.slice(11,23);if(d(this,m)===null)return t.slice(0,-1);if(d(this,m)==="Z")return t;let r=+d(this,m).slice(1,3)*60+ +d(this,m).slice(4,6);return r=d(this,m)[0]==="-"?r:-r,new Date(this.getTime()-r*6e4).toISOString().slice(0,-1)+d(this,m)}static wrapAsOffsetDateTime(t,r="Z"){let a=new N(t);return x(a,m,r),a}static wrapAsLocalDateTime(t){let r=new N(t);return x(r,m,null),r}static wrapAsLocalDate(t){let r=new N(t);return x(r,E,!1),x(r,m,null),r}static wrapAsLocalTime(t){let r=new N(t);return x(r,w,!1),x(r,m,null),r}};w=new WeakMap,E=new WeakMap,m=new WeakMap;var V=N;var ln=/^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/,sn=/^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/,cn=/^[+-]?0[0-9_]/,fn=/^[0-9a-f]{2,8}$/i,we={b:"\b",t:"	",n:`
`,f:"\f",r:"\r",e:"\x1B",'"':'"',"\\":"\\"};function K(e,n=0,t=e.length){let r=e[n]==="'",a=e[n++]===e[n]&&e[n]===e[n+1];a&&(t-=2,e[n+=2]==="\r"&&n++,e[n]===`
`&&n++);let o=0,i,l="",c=n;for(;n<t-1;){let s=e[n++];if(s===`
`||s==="\r"&&e[n]===`
`){if(!a)throw new f("newlines are not allowed in strings",{toml:e,ptr:n-1})}else if(s<" "&&s!=="	"||s==="\x7F")throw new f("control characters are not allowed in strings",{toml:e,ptr:n-1});if(i){if(i=!1,s==="x"||s==="u"||s==="U"){let u=e.slice(n,n+=s==="x"?2:s==="u"?4:8);if(!fn.test(u))throw new f("invalid unicode escape",{toml:e,ptr:o});try{l+=String.fromCodePoint(parseInt(u,16))}catch{throw new f("invalid unicode escape",{toml:e,ptr:o})}}else if(a&&(s===`
`||s===" "||s==="	"||s==="\r")){if(n=h(e,n-1,!0),e[n]!==`
`&&e[n]!=="\r")throw new f("invalid escape: only line-ending whitespace may be escaped",{toml:e,ptr:o});n=h(e,n)}else if(s in we)l+=we[s];else throw new f("unrecognized escape sequence",{toml:e,ptr:o});c=n}else!r&&s==="\\"&&(o=n-1,i=!0,l+=e.slice(c,o))}return l+e.slice(c,t-1)}function Ee(e,n,t,r){if(e==="true")return!0;if(e==="false")return!1;if(e==="-inf")return-1/0;if(e==="inf"||e==="+inf")return 1/0;if(e==="nan"||e==="+nan"||e==="-nan")return NaN;if(e==="-0")return r?0n:0;let a=ln.test(e);if(a||sn.test(e)){if(cn.test(e))throw new f("leading zeroes are not allowed",{toml:n,ptr:t});e=e.replace(/_/g,"");let i=+e;if(isNaN(i))throw new f("invalid number",{toml:n,ptr:t});if(a){if((a=!Number.isSafeInteger(i))&&!r)throw new f("integer value cannot be represented losslessly",{toml:n,ptr:t});(a||r===!0)&&(i=BigInt(e))}return i}let o=new V(e);if(!o.isValid())throw new f("invalid value",{toml:n,ptr:t});return o}function un(e,n,t){let r=e.slice(n,t),a=r.indexOf("#");return a>-1&&(S(e,a),r=r.slice(0,a)),[r.trimEnd(),a]}function O(e,n,t,r,a){if(r===0)throw new f("document contains excessively nested structures. aborting.",{toml:e,ptr:n});let o=e[n];if(o==="["||o==="{"){let[c,s]=o==="["?Ce(e,n,r,a):be(e,n,r,a);if(t){if(s=h(e,s),e[s]===",")s++;else if(e[s]!==t)throw new f("expected comma or end of structure",{toml:e,ptr:s})}return[c,s]}let i;if(o==='"'||o==="'"){i=X(e,n);let c=K(e,n,i);if(t){if(i=h(e,i),e[i]&&e[i]!==","&&e[i]!==t&&e[i]!==`
`&&e[i]!=="\r")throw new f("unexpected character encountered",{toml:e,ptr:i});i+=+(e[i]===",")}return[c,i]}i=Te(e,n,",",t);let l=un(e,n,i-+(e[i-1]===","));if(!l[0])throw new f("incomplete key-value declaration: no value specified",{toml:e,ptr:n});return t&&l[1]>-1&&(i=h(e,n+l[1]),i+=+(e[i]===",")),[Ee(l[0],e,n,a),i]}var dn=/^[a-zA-Z0-9-_]+[ \t]*$/;function W(e,n,t="="){let r=n-1,a=[],o=e.indexOf(t,n);if(o<0)throw new f("incomplete key-value: cannot find end of key",{toml:e,ptr:n});do{let i=e[n=++r];if(i!==" "&&i!=="	")if(i==='"'||i==="'"){if(i===e[n+1]&&i===e[n+2])throw new f("multiline strings are not allowed in keys",{toml:e,ptr:n});let l=X(e,n);if(l<0)throw new f("unfinished string encountered",{toml:e,ptr:n});r=e.indexOf(".",l);let c=e.slice(l,r<0||r>o?o:r),s=Y(c);if(s>-1)throw new f("newlines are not allowed in keys",{toml:e,ptr:n+r+s});if(c.trimStart())throw new f("found extra tokens after the string part",{toml:e,ptr:l});if(o<l&&(o=e.indexOf(t,l),o<0))throw new f("incomplete key-value: cannot find end of key",{toml:e,ptr:n});a.push(K(e,n,l))}else{r=e.indexOf(".",n);let l=e.slice(n,r<0||r>o?o:r);if(!dn.test(l))throw new f("only letter, numbers, dashes and underscores are allowed in keys",{toml:e,ptr:n});a.push(l.trimEnd())}}while(r+1&&r<o);return[a,h(e,o+1,!0,!0)]}function be(e,n,t,r){let a={},o=new Set,i;for(n++;(i=e[n++])!=="}"&&i;){if(i===",")throw new f("expected value, found comma",{toml:e,ptr:n-1});if(i==="#")n=S(e,n);else if(i!==" "&&i!=="	"&&i!==`
`&&i!=="\r"){let l,c=a,s=!1,[u,J]=W(e,n-1);for(let M=0;M<u.length;M++){if(M&&(c=s?c[l]:c[l]={}),l=u[M],(s=Object.hasOwn(c,l))&&(typeof c[l]!="object"||o.has(c[l])))throw new f("trying to redefine an already defined value",{toml:e,ptr:n});!s&&l==="__proto__"&&Object.defineProperty(c,l,{enumerable:!0,configurable:!0,writable:!0})}if(s)throw new f("trying to redefine an already defined value",{toml:e,ptr:n});let[$,De]=O(e,J,"}",t-1,r);o.add($),c[l]=$,n=De}}if(!i)throw new f("unfinished table encountered",{toml:e,ptr:n});return[a,n]}function Ce(e,n,t,r){let a=[],o;for(n++;(o=e[n++])!=="]"&&o;){if(o===",")throw new f("expected value, found comma",{toml:e,ptr:n-1});if(o==="#")n=S(e,n);else if(o!==" "&&o!=="	"&&o!==`
`&&o!=="\r"){let i=O(e,n-1,"]",t-1,r);a.push(i[0]),n=i[1]}}if(!o)throw new f("unfinished array encountered",{toml:e,ptr:n});return[a,n]}function _e(e,n,t,r){let a=n,o=t,i,l=!1,c;for(let s=0;s<e.length;s++){if(s){if(a=l?a[i]:a[i]={},o=(c=o[i]).c,r===0&&(c.t===1||c.t===2))return null;if(c.t===2){let u=a.length-1;a=a[u],o=o[u].c}}if(i=e[s],(l=Object.hasOwn(a,i))&&o[i]?.t===0&&o[i]?.d)return null;l||(i==="__proto__"&&(Object.defineProperty(a,i,{enumerable:!0,configurable:!0,writable:!0}),Object.defineProperty(o,i,{enumerable:!0,configurable:!0,writable:!0})),o[i]={t:s<e.length-1&&r===2?3:r,d:!1,i:0,c:{}})}if(c=o[i],c.t!==r&&!(r===1&&c.t===3)||(r===2&&(c.d||(c.d=!0,a[i]=[]),a[i].push(a={}),c.c[c.i++]=c={t:1,d:!1,i:0,c:{}}),c.d))return null;if(c.d=!0,r===1)a=l?a[i]:a[i]={};else if(r===0&&l)return null;return[i,a,c.c]}function oe(e,{maxDepth:n=1e3,integersAsBigInt:t}={}){let r={},a={},o=r,i=a;for(let l=h(e,0);l<e.length;){if(e[l]==="["){let c=e[++l]==="[",s=W(e,l+=+c,"]");if(c){if(e[s[1]-1]!=="]")throw new f("expected end of table declaration",{toml:e,ptr:s[1]-1});s[1]++}let u=_e(s[0],r,a,c?2:1);if(!u)throw new f("trying to redefine an already defined table or value",{toml:e,ptr:l});i=u[2],o=u[1],l=s[1]}else{let c=W(e,l),s=_e(c[0],o,i,0);if(!s)throw new f("trying to redefine an already defined table or value",{toml:e,ptr:l});let u=O(e,c[1],void 0,n,t);s[1][s[0]]=u[0],l=u[1]}if(l=h(e,l,!0),e[l]&&e[l]!==`
`&&e[l]!=="\r")throw new f("each key-value declaration must be followed by an end-of-line",{toml:e,ptr:l});l=h(e,l)}return r}function mn(e){if(e==="Contra"||e==="contra")return"Contra";if(e==="Covar"||e==="covar")return"Covar";throw new Error(`Unknown variance: '${e}'`)}function Ie(e){let n=oe(e),t={manifolds:new Map,tensors:new Map,activeMetric:null},r=n.strategy??{};t.activeMetric=r.active_metric??null;let a=n.manifold??{};for(let[i,l]of Object.entries(a)){if(l.dimension==null)throw new Error(`Manifold '${i}' missing required 'dimension'`);t.manifolds.set(i,{name:i,dimension:l.dimension,indexType:l.index_type??"Latin"})}let o=n.tensor??{};for(let[i,l]of Object.entries(o)){let s=(l.index_pattern??[]).map(mn),J=(l.symmetries??[]).map($=>({indices:$.indices,type:$.type}));t.tensors.set(i,{name:i,manifold:l.manifold??"",rank:l.rank??0,indexPattern:s,symmetries:J})}for(let[i,l]of t.tensors){if(l.manifold&&!t.manifolds.has(l.manifold))throw new Error(`Tensor '${i}' references unknown manifold '${l.manifold}'`);if(l.indexPattern.length>0&&l.indexPattern.length!==l.rank)throw new Error(`Tensor '${i}' index_pattern length (${l.indexPattern.length}) != rank (${l.rank})`)}if(t.activeMetric!=null&&!t.tensors.has(t.activeMetric))throw new Error(`active_metric '${t.activeMetric}' references unknown tensor`);return t}return Re(hn);})();
/*! Bundled license information:

smol-toml/dist/error.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/util.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/date.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/primitive.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/extract.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/struct.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/parse.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/stringify.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=chacana-checker.js.map
