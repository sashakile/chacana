"use strict";var ChacanaChecker=(()=>{var X=Object.defineProperty;var $e=Object.getOwnPropertyDescriptor;var Ve=Object.getOwnPropertyNames;var Oe=Object.prototype.hasOwnProperty;var ue=e=>{throw TypeError(e)};var Me=(e,n,t)=>n in e?X(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Le=(e,n)=>{for(var t in n)X(e,t,{get:n[t],enumerable:!0})},Pe=(e,n,t,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let a of Ve(n))!Oe.call(e,a)&&a!==t&&X(e,a,{get:()=>n[a],enumerable:!(r=$e(n,a))||r.enumerable});return e};var He=e=>Pe(X({},"__esModule",{value:!0}),e);var Z=(e,n,t)=>Me(e,typeof n!="symbol"?n+"":n,t),fe=(e,n,t)=>n.has(e)||ue("Cannot "+t);var d=(e,n,t)=>(fe(e,n,"read from private field"),t?t.call(e):n.get(e)),q=(e,n,t)=>n.has(e)?ue("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),E=(e,n,t,r)=>(fe(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t);var Cn={};Le(Cn,{HEAD_ADD:()=>p,HEAD_MULTIPLY:()=>x,IndexType:()=>te,STRUCTURAL_HEADS:()=>K,Variance:()=>k,buildAST:()=>b,checkAll:()=>Ee,fromLatex:()=>Ne,loadContext:()=>Ie,toLatex:()=>m});var k=(t=>(t.Contra="Contra",t.Covar="Covar",t))(k||{}),te=(r=>(r.Latin="Latin",r.Greek="Greek",r.Spinor="Spinor",r))(te||{});function w(){return{symmetrized_groups:[],antisymmetrized_groups:[],order:null}}var p="Add",_="Negate",x="Multiply",T="Wedge",V="ExteriorDerivative",O="LieDerivative",M="Trace",L="Determinant",P="Inverse",R="HodgeStar",H="InteriorProduct",re="Perturbation",ie="Commutator",I="Number",de={d:V,L:O,Tr:M,det:L,inv:P,star:R,hodge:R,i:H},K=new Set([p,_,x,T,V,O,M,L,P,R,H,re,ie,I]),Ge=/[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]/;function me(e){return Ge.test(e)?"Greek":"Latin"}function*G(e){yield e;for(let n of e.args)yield*G(n)}function v(e,n=[],t=[],r=null,a=w(),o=null){return{head:e,args:n,indices:t,value:r,metadata:a,range:o}}function N(e){return{startLine:e.startPosition.row,startColumn:e.startPosition.column,endLine:e.endPosition.row,endColumn:e.endPosition.column}}function ae(e,n,t=!1,r=null){return{label:n,variance:e==="^"?"Contra":"Covar",indexType:me(n),isDerivative:t,derivativeType:r}}function b(e){if(e.type==="source_file"){let n=e.namedChildren[0];return n?b(n):null}if(e.hasError)return null;switch(e.type){case"sum_expression":return oe(e,p,"+","-");case"product_expression":return oe(e,x,"*");case"wedge_expression":return oe(e,T,"^");case"tensor_expr":return Ue(e);case"functional_op":return ze(e);case"scalar":return je(e);case"perturbation":return Be(e);case"commutator":return Xe(e);case"paren_expression":{let n=e.namedChildren[0];return n?b(n):null}default:return null}}function oe(e,n,...t){let r=[],a=[];ge(e,n,r,a);let o=[];for(let i=0;i<r.length;i++)i>0&&a[i-1]==="-"?o.push(v(_,[r[i]],[],null,w(),N(e))):o.push(r[i]);return o.length===1?o[0]:v(n,o,[],null,w(),N(e))}function ge(e,n,t,r){if(e.type!==Fe(n)){let l=b(e);l&&t.push(l);return}let a=e.childForFieldName("left"),o=e.childForFieldName("right"),i=e.childForFieldName("operator");if(a&&ge(a,n,t,r),i&&r.push(i.type),o){let l=b(o);l&&t.push(l)}}function Fe(e){return e===p?"sum_expression":e===x?"product_expression":e===T?"wedge_expression":""}function Ue(e){let t=e.childForFieldName("name")?.text??"",r=e.childForFieldName("indices"),{indices:a,metadata:o}=r?le(r.namedChildren[0]):{indices:[],metadata:w()};return v(t,[],a,null,o,N(e))}function ze(e){let t=e.childForFieldName("name")?.text??"",r=de[t]??t,a=e.childForFieldName("arguments"),o=[];if(a)for(let s of a.namedChildren){let f=b(s);f&&o.push(f)}let i=e.childForFieldName("indices"),{indices:l,metadata:c}=i?le(i.namedChildren[0]):{indices:[],metadata:w()};return v(r,o,l,null,c,N(e))}function je(e){let n=e.text,t=n.includes(".")?parseFloat(n):parseInt(n,10);return v(I,[],[],t,w(),N(e))}function Be(e){let n=e.childForFieldName("order"),t=e.childForFieldName("body"),r=n?parseInt(n.text,10):0,a=t?b(t):null;return v(re,a?[a]:[],[],null,{...w(),order:r},N(e))}function Xe(e){let n=e.childForFieldName("left"),t=e.childForFieldName("right"),r=[];if(n){let a=b(n);a&&r.push(a)}if(t){let a=b(t);a&&r.push(a)}return v(ie,r,[],null,w(),N(e))}function le(e){if(!e||e.type!=="index_list"&&e.type!=="sym_index_list")return{indices:[],metadata:w()};let n=[],t=[],r=[];for(let o of e.namedChildren)if(o.type==="index")n.push(Ze(o));else if(o.type==="symmetrization"||o.type==="anti_symmetrization"){let i=o.namedChildren.find(l=>l.type==="index_list"||l.type==="sym_index_list");if(i){let l=n.length,c=le(i),s=[];for(let f=0;f<c.indices.length;f++)s.push(l+f);n.push(...c.indices),o.type==="symmetrization"?t.push(s):r.push(s)}}return{indices:n,metadata:{symmetrized_groups:t,antisymmetrized_groups:r,order:null}}}function Ze(e){let n=e.childForFieldName("variance"),t=e.childForFieldName("name");if(!t)return ae(n?.text??null,"");if(t.type==="derivative"){let r=t.childForFieldName("type"),a=t.childForFieldName("name"),o=r?.text===";"?"semicolon":"comma";return ae(n?.text??null,a?.text??"",!0,o)}return ae(n?.text??null,t.text)}function $(e,n=!1){if(e.head===p)return e.args.length>0?$(e.args[0],n):[];if(e.head===_)return e.args.length>0?$(e.args[0],n):[];if(e.head===x){let t=[];for(let r of e.args)t.push(...$(r,n));return qe(t,n)}if(e.head===T){let t=[];for(let r of e.args)t.push(...$(r,n));return t}return e.head===V?e.args.length>0?$(e.args[0],n):[]:e.head===I?[]:[...e.indices]}function qe(e,n=!1){let t=[],r=new Set;for(let a=0;a<e.length;a++){if(r.has(a))continue;let o=!1;for(let i=a+1;i<e.length;i++)if(!r.has(i)&&e[a].label===e[i].label&&e[a].indexType===e[i].indexType&&(e[a].variance!==e[i].variance||n)){r.add(a),r.add(i),o=!0;break}o||t.push(e[a])}return t}function Y(e){if(e.head===p){if(e.args.length===0)return[];let n=new Map;for(let r of e.args){let a=new Map;for(let o of Y(r)){let i=`${o.label}:${o.variance}:${o.indexType}`,l=a.get(i);l?l.count++:a.set(i,{idx:o,count:1})}for(let[o,{idx:i,count:l}]of a){let c=n.get(o);(!c||l>c.count)&&n.set(o,{idx:i,count:l})}}let t=[];for(let{idx:r,count:a}of n.values())for(let o=0;o<a;o++)t.push(r);return t}if(e.head===_)return e.args.length>0?Y(e.args[0]):[];if(e.head===x||e.head===T){let n=[];for(let t of e.args)n.push(...Y(t));return n}return e.head===I?[]:[...e.indices]}function W(e,n){return e.indices.length>0?e.indices.length:n.tensors.get(e.head)?.rank??null}function Ke(e,n){if(e.indices.length>0)return e.indices.map(r=>r.variance);let t=n.tensors.get(e.head);return t?.indexPattern.length?[...t.indexPattern]:null}function Ye(e,n){let t=W(e,n);if(t==null)return null;if(t!==1)return!1;let r=Ke(e,n);return r==null?null:r[0]==="Contra"}function he(e){return e.length===0?"{}":`{${e.map(t=>`${t.variance==="Contra"?"^":"_"}${t.label}`).join(" ")}}`}function se(e,n,t){if(e.head===x||e.head===T){let r=[];for(let o of e.args)se(o,n,t),r.push(...Y(o));let a=new Map;for(let o of r){let i=a.get(o.label)??[];i.push(o),a.set(o.label,i)}for(let[o,i]of a)if(i.length===2){if(i[0].indexType!==i[1].indexType)t.push({message:`Contraction index '${o}' has mismatched index type: ${i[0].indexType} vs ${i[1].indexType}`,range:e.range,code:"chacana/contraction"});else if(e.head===x&&i[0].variance===i[1].variance){if(n?.activeMetric)continue;t.push({message:`Contraction index '${o}' appears twice with same variance (${i[0].variance})`,range:e.range,code:"chacana/contraction"})}}else i.length>2&&t.push({message:`Index '${o}' appears ${i.length} times (expected at most 2)`,range:e.range,code:"chacana/contraction"})}else for(let r of e.args)se(r,n,t)}function We(e,n,t){let r=!!n?.activeMetric;for(let a of G(e)){if(a.head!==p||a.args.length<2)continue;let o=$(a.args[0],r),i=pe(o);for(let l=1;l<a.args.length;l++){let c=$(a.args[l],r),s=pe(c);Je(i,s)||t.push({message:`Free index mismatch in sum: term 0 has ${he(o)}, term ${l} has ${he(c)}`,range:a.range,code:"chacana/free-index"})}}}function pe(e){let n=new Map;for(let t of e){let r=`${t.label}:${t.variance}`;n.set(r,(n.get(r)??0)+1)}return n}function Je(e,n){if(e.size!==n.size)return!1;for(let[t,r]of e)if(n.get(t)!==r)return!1;return!0}function Qe(e,n,t){for(let r of G(e))en(r,n,t)}function xe(e,n,t,r,a){if(n.length<2)return;let o=e[n[0]];for(let i=1;i<n.length;i++){let l=e[n[i]];o.variance!==l.variance&&a.push({message:`Variance mismatch in ${t}: index '${o.label}' (${o.variance}) vs '${l.label}' (${l.variance})`,range:r,code:"chacana/symmetry"}),o.indexType!==l.indexType&&a.push({message:`Index type mismatch in ${t}: index '${o.label}' (${o.indexType}) vs '${l.label}' (${l.indexType})`,range:r,code:"chacana/symmetry"})}}function en(e,n,t){for(let[r,a]of[["symmetrization",e.metadata.symmetrized_groups],["anti-symmetrization",e.metadata.antisymmetrized_groups]])for(let o of a)xe(e.indices,o,r,e.range,t);if(n!=null){let r=n.tensors.get(e.head);if(r&&e.indices.length>0)for(let a of r.symmetries){let o=a.indices.map(i=>i-1);o.every(i=>i>=0&&i<e.indices.length)&&xe(e.indices,o,`declared symmetry of '${e.head}'`,e.range,t)}}}var nn=new Set([p,x,T,_,I]);function tn(e,n,t){for(let r of G(e)){if(nn.has(r.head))continue;let a=n.tensors.get(r.head);if(!a)continue;let o=r.indices.filter(i=>!i.isDerivative);if(o.length>0&&o.length!==a.rank){let i=a.rank-o.length;n.activeMetric&&i>0&&i%2===0||t.push({message:`Tensor '${r.head}' declared with rank ${a.rank}, but used with ${o.length} indices`,range:r.range,code:"chacana/rank"})}if(o.length>0&&a.indexPattern.length>0&&!n.activeMetric)for(let i=0;i<Math.min(o.length,a.indexPattern.length);i++)o[i].variance!==a.indexPattern[i]&&t.push({message:`Tensor '${r.head}' index ${i}: expected ${a.indexPattern[i]}, got ${o[i].variance}`,range:r.range,code:"chacana/rank"})}}function rn(e,n,t){n.activeMetric||t.push({message:"Hodge star operator requires an active_metric in the context",range:e.range,code:"chacana/operator"})}function ye(e){return(n,t,r)=>{n.args.length<1||Ye(n.args[0],t)===!1&&r.push({message:`${e} first argument must be a vector field (rank 1 contravariant)`,range:n.range,code:"chacana/operator"})}}function an(e,n,t){if(e.args.length<2)return;let r=W(e.args[1],n);r!=null&&r===0&&t.push({message:"Interior product is undefined for 0-forms (rank 0)",range:e.range,code:"chacana/operator"})}function on(e,n){return(t,r,a)=>{if(t.args.length<1)return;let o=W(t.args[0],r);o!=null&&o<e&&a.push({message:`${n} requires a tensor of rank >= ${e}, but argument has rank ${o}`,range:t.range,code:"chacana/operator"})}}function Te(e,n){return(t,r,a)=>{if(t.args.length<1)return;let o=W(t.args[0],r);o!=null&&o!==e&&a.push({message:`${n} requires a rank-${e} tensor, but argument has rank ${o}`,range:t.range,code:"chacana/operator"})}}var ln={[R]:[rn],[H]:[ye("Interior product"),an],[O]:[ye("Lie derivative")],[M]:[on(2,"Trace")],[L]:[Te(2,"Determinant")],[P]:[Te(2,"Inverse")]};function sn(e,n,t){for(let r of G(e)){let a=ln[r.head];if(a)for(let o of a)o(r,n,t)}}function Ee(e,n=null){let t=[];return se(e,n,t),We(e,n,t),Qe(e,n,t),n&&(tn(e,n,t),sn(e,n,t)),t}function cn(e,n){let t=e.slice(0,n).split(/\r\n|\n|\r/g);return[t.length,t.pop().length+1]}function un(e,n,t){let r=e.split(/\r\n|\n|\r/g),a="",o=(Math.log10(n+1)|0)+1;for(let i=n-1;i<=n+1;i++){let l=r[i-1];l&&(a+=i.toString().padEnd(o," "),a+=":  ",a+=l,a+=`
`,i===n&&(a+=" ".repeat(o+t+2),a+=`^
`))}return a}var u=class extends Error{constructor(t,r){let[a,o]=cn(r.toml,r.ptr),i=un(r.toml,a,o);super(`Invalid TOML document: ${t}

${i}`,r);Z(this,"line");Z(this,"column");Z(this,"codeblock");this.line=a,this.column=o,this.codeblock=i}};function fn(e,n){let t=0;for(;e[n-++t]==="\\";);return--t&&t%2}function J(e,n=0,t=e.length){let r=e.indexOf(`
`,n);return e[r-1]==="\r"&&r--,r<=t?r:-1}function F(e,n){for(let t=n;t<e.length;t++){let r=e[t];if(r===`
`)return t;if(r==="\r"&&e[t+1]===`
`)return t+1;if(r<" "&&r!=="	"||r==="\x7F")throw new u("control characters are not allowed in comments",{toml:e,ptr:n})}return e.length}function y(e,n,t,r){let a;for(;(a=e[n])===" "||a==="	"||!t&&(a===`
`||a==="\r"&&e[n+1]===`
`);)n++;return r||a!=="#"?n:y(e,F(e,n),t)}function we(e,n,t,r,a=!1){if(!r)return n=J(e,n),n<0?e.length:n;for(let o=n;o<e.length;o++){let i=e[o];if(i==="#")o=J(e,o);else{if(i===t)return o+1;if(i===r||a&&(i===`
`||i==="\r"&&e[o+1]===`
`))return o}}throw new u("cannot find end of structure",{toml:e,ptr:n})}function Q(e,n){let t=e[n],r=t===e[n+1]&&e[n+1]===e[n+2]?e.slice(n,n+3):t;n+=r.length-1;do n=e.indexOf(r,++n);while(n>-1&&t!=="'"&&fn(e,n));return n>-1&&(n+=r.length,r.length>1&&(e[n]===t&&n++,e[n]===t&&n++)),n}var dn=/^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i,C,D,g,U=class U extends Date{constructor(t){let r=!0,a=!0,o="Z";if(typeof t=="string"){let i=t.match(dn);i?(i[1]||(r=!1,t=`0000-01-01T${t}`),a=!!i[2],a&&t[10]===" "&&(t=t.replace(" ","T")),i[2]&&+i[2]>23?t="":(o=i[3]||null,t=t.toUpperCase(),!o&&a&&(t+="Z"))):t=""}super(t);q(this,C,!1);q(this,D,!1);q(this,g,null);isNaN(this.getTime())||(E(this,C,r),E(this,D,a),E(this,g,o))}isDateTime(){return d(this,C)&&d(this,D)}isLocal(){return!d(this,C)||!d(this,D)||!d(this,g)}isDate(){return d(this,C)&&!d(this,D)}isTime(){return d(this,D)&&!d(this,C)}isValid(){return d(this,C)||d(this,D)}toISOString(){let t=super.toISOString();if(this.isDate())return t.slice(0,10);if(this.isTime())return t.slice(11,23);if(d(this,g)===null)return t.slice(0,-1);if(d(this,g)==="Z")return t;let r=+d(this,g).slice(1,3)*60+ +d(this,g).slice(4,6);return r=d(this,g)[0]==="-"?r:-r,new Date(this.getTime()-r*6e4).toISOString().slice(0,-1)+d(this,g)}static wrapAsOffsetDateTime(t,r="Z"){let a=new U(t);return E(a,g,r),a}static wrapAsLocalDateTime(t){let r=new U(t);return E(r,g,null),r}static wrapAsLocalDate(t){let r=new U(t);return E(r,D,!1),E(r,g,null),r}static wrapAsLocalTime(t){let r=new U(t);return E(r,C,!1),E(r,g,null),r}};C=new WeakMap,D=new WeakMap,g=new WeakMap;var z=U;var mn=/^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/,gn=/^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/,hn=/^[+-]?0[0-9_]/,pn=/^[0-9a-f]{2,8}$/i,_e={b:"\b",t:"	",n:`
`,f:"\f",r:"\r",e:"\x1B",'"':'"',"\\":"\\"};function ee(e,n=0,t=e.length){let r=e[n]==="'",a=e[n++]===e[n]&&e[n]===e[n+1];a&&(t-=2,e[n+=2]==="\r"&&n++,e[n]===`
`&&n++);let o=0,i,l="",c=n;for(;n<t-1;){let s=e[n++];if(s===`
`||s==="\r"&&e[n]===`
`){if(!a)throw new u("newlines are not allowed in strings",{toml:e,ptr:n-1})}else if(s<" "&&s!=="	"||s==="\x7F")throw new u("control characters are not allowed in strings",{toml:e,ptr:n-1});if(i){if(i=!1,s==="x"||s==="u"||s==="U"){let f=e.slice(n,n+=s==="x"?2:s==="u"?4:8);if(!pn.test(f))throw new u("invalid unicode escape",{toml:e,ptr:o});try{l+=String.fromCodePoint(parseInt(f,16))}catch{throw new u("invalid unicode escape",{toml:e,ptr:o})}}else if(a&&(s===`
`||s===" "||s==="	"||s==="\r")){if(n=y(e,n-1,!0),e[n]!==`
`&&e[n]!=="\r")throw new u("invalid escape: only line-ending whitespace may be escaped",{toml:e,ptr:o});n=y(e,n)}else if(s in _e)l+=_e[s];else throw new u("unrecognized escape sequence",{toml:e,ptr:o});c=n}else!r&&s==="\\"&&(o=n-1,i=!0,l+=e.slice(c,o))}return l+e.slice(c,t-1)}function be(e,n,t,r){if(e==="true")return!0;if(e==="false")return!1;if(e==="-inf")return-1/0;if(e==="inf"||e==="+inf")return 1/0;if(e==="nan"||e==="+nan"||e==="-nan")return NaN;if(e==="-0")return r?0n:0;let a=mn.test(e);if(a||gn.test(e)){if(hn.test(e))throw new u("leading zeroes are not allowed",{toml:n,ptr:t});e=e.replace(/_/g,"");let i=+e;if(isNaN(i))throw new u("invalid number",{toml:n,ptr:t});if(a){if((a=!Number.isSafeInteger(i))&&!r)throw new u("integer value cannot be represented losslessly",{toml:n,ptr:t});(a||r===!0)&&(i=BigInt(e))}return i}let o=new z(e);if(!o.isValid())throw new u("invalid value",{toml:n,ptr:t});return o}function xn(e,n,t){let r=e.slice(n,t),a=r.indexOf("#");return a>-1&&(F(e,a),r=r.slice(0,a)),[r.trimEnd(),a]}function j(e,n,t,r,a){if(r===0)throw new u("document contains excessively nested structures. aborting.",{toml:e,ptr:n});let o=e[n];if(o==="["||o==="{"){let[c,s]=o==="["?De(e,n,r,a):Ce(e,n,r,a);if(t){if(s=y(e,s),e[s]===",")s++;else if(e[s]!==t)throw new u("expected comma or end of structure",{toml:e,ptr:s})}return[c,s]}let i;if(o==='"'||o==="'"){i=Q(e,n);let c=ee(e,n,i);if(t){if(i=y(e,i),e[i]&&e[i]!==","&&e[i]!==t&&e[i]!==`
`&&e[i]!=="\r")throw new u("unexpected character encountered",{toml:e,ptr:i});i+=+(e[i]===",")}return[c,i]}i=we(e,n,",",t);let l=xn(e,n,i-+(e[i-1]===","));if(!l[0])throw new u("incomplete key-value declaration: no value specified",{toml:e,ptr:n});return t&&l[1]>-1&&(i=y(e,n+l[1]),i+=+(e[i]===",")),[be(l[0],e,n,a),i]}var yn=/^[a-zA-Z0-9-_]+[ \t]*$/;function ne(e,n,t="="){let r=n-1,a=[],o=e.indexOf(t,n);if(o<0)throw new u("incomplete key-value: cannot find end of key",{toml:e,ptr:n});do{let i=e[n=++r];if(i!==" "&&i!=="	")if(i==='"'||i==="'"){if(i===e[n+1]&&i===e[n+2])throw new u("multiline strings are not allowed in keys",{toml:e,ptr:n});let l=Q(e,n);if(l<0)throw new u("unfinished string encountered",{toml:e,ptr:n});r=e.indexOf(".",l);let c=e.slice(l,r<0||r>o?o:r),s=J(c);if(s>-1)throw new u("newlines are not allowed in keys",{toml:e,ptr:n+r+s});if(c.trimStart())throw new u("found extra tokens after the string part",{toml:e,ptr:l});if(o<l&&(o=e.indexOf(t,l),o<0))throw new u("incomplete key-value: cannot find end of key",{toml:e,ptr:n});a.push(ee(e,n,l))}else{r=e.indexOf(".",n);let l=e.slice(n,r<0||r>o?o:r);if(!yn.test(l))throw new u("only letter, numbers, dashes and underscores are allowed in keys",{toml:e,ptr:n});a.push(l.trimEnd())}}while(r+1&&r<o);return[a,y(e,o+1,!0,!0)]}function Ce(e,n,t,r){let a={},o=new Set,i;for(n++;(i=e[n++])!=="}"&&i;){if(i===",")throw new u("expected value, found comma",{toml:e,ptr:n-1});if(i==="#")n=F(e,n);else if(i!==" "&&i!=="	"&&i!==`
`&&i!=="\r"){let l,c=a,s=!1,[f,A]=ne(e,n-1);for(let B=0;B<f.length;B++){if(B&&(c=s?c[l]:c[l]={}),l=f[B],(s=Object.hasOwn(c,l))&&(typeof c[l]!="object"||o.has(c[l])))throw new u("trying to redefine an already defined value",{toml:e,ptr:n});!s&&l==="__proto__"&&Object.defineProperty(c,l,{enumerable:!0,configurable:!0,writable:!0})}if(s)throw new u("trying to redefine an already defined value",{toml:e,ptr:n});let[h,S]=j(e,A,"}",t-1,r);o.add(h),c[l]=h,n=S}}if(!i)throw new u("unfinished table encountered",{toml:e,ptr:n});return[a,n]}function De(e,n,t,r){let a=[],o;for(n++;(o=e[n++])!=="]"&&o;){if(o===",")throw new u("expected value, found comma",{toml:e,ptr:n-1});if(o==="#")n=F(e,n);else if(o!==" "&&o!=="	"&&o!==`
`&&o!=="\r"){let i=j(e,n-1,"]",t-1,r);a.push(i[0]),n=i[1]}}if(!o)throw new u("unfinished array encountered",{toml:e,ptr:n});return[a,n]}function Ae(e,n,t,r){let a=n,o=t,i,l=!1,c;for(let s=0;s<e.length;s++){if(s){if(a=l?a[i]:a[i]={},o=(c=o[i]).c,r===0&&(c.t===1||c.t===2))return null;if(c.t===2){let f=a.length-1;a=a[f],o=o[f].c}}if(i=e[s],(l=Object.hasOwn(a,i))&&o[i]?.t===0&&o[i]?.d)return null;l||(i==="__proto__"&&(Object.defineProperty(a,i,{enumerable:!0,configurable:!0,writable:!0}),Object.defineProperty(o,i,{enumerable:!0,configurable:!0,writable:!0})),o[i]={t:s<e.length-1&&r===2?3:r,d:!1,i:0,c:{}})}if(c=o[i],c.t!==r&&!(r===1&&c.t===3)||(r===2&&(c.d||(c.d=!0,a[i]=[]),a[i].push(a={}),c.c[c.i++]=c={t:1,d:!1,i:0,c:{}}),c.d))return null;if(c.d=!0,r===1)a=l?a[i]:a[i]={};else if(r===0&&l)return null;return[i,a,c.c]}function ce(e,{maxDepth:n=1e3,integersAsBigInt:t}={}){let r={},a={},o=r,i=a;for(let l=y(e,0);l<e.length;){if(e[l]==="["){let c=e[++l]==="[",s=ne(e,l+=+c,"]");if(c){if(e[s[1]-1]!=="]")throw new u("expected end of table declaration",{toml:e,ptr:s[1]-1});s[1]++}let f=Ae(s[0],r,a,c?2:1);if(!f)throw new u("trying to redefine an already defined table or value",{toml:e,ptr:l});i=f[2],o=f[1],l=s[1]}else{let c=ne(e,l),s=Ae(c[0],o,i,0);if(!s)throw new u("trying to redefine an already defined table or value",{toml:e,ptr:l});let f=j(e,c[1],void 0,n,t);s[1][s[0]]=f[0],l=f[1]}if(l=y(e,l,!0),e[l]&&e[l]!==`
`&&e[l]!=="\r")throw new u("each key-value declaration must be followed by an end-of-line",{toml:e,ptr:l});l=y(e,l)}return r}function Tn(e){if(e==="Contra"||e==="contra")return"Contra";if(e==="Covar"||e==="covar")return"Covar";throw new Error(`Unknown variance: '${e}'`)}function Ie(e){let n=ce(e),t={manifolds:new Map,tensors:new Map,activeMetric:null},r=n.strategy??{};t.activeMetric=r.active_metric??null;let a=n.manifold??{};for(let[i,l]of Object.entries(a)){if(l.dimension==null)throw new Error(`Manifold '${i}' missing required 'dimension'`);t.manifolds.set(i,{name:i,dimension:l.dimension,indexType:l.index_type??"Latin"})}let o=n.tensor??{};for(let[i,l]of Object.entries(o)){let s=(l.index_pattern??[]).map(Tn),A=(l.symmetries??[]).map(h=>({indices:h.indices,type:h.type}));t.tensors.set(i,{name:i,manifold:l.manifold??"",rank:l.rank??0,indexPattern:s,symmetries:A})}for(let[i,l]of t.tensors){if(l.manifold&&!t.manifolds.has(l.manifold))throw new Error(`Tensor '${i}' references unknown manifold '${l.manifold}'`);if(l.indexPattern.length>0&&l.indexPattern.length!==l.rank)throw new Error(`Tensor '${i}' index_pattern length (${l.indexPattern.length}) != rank (${l.rank})`)}if(t.activeMetric!=null&&!t.tensors.has(t.activeMetric))throw new Error(`active_metric '${t.activeMetric}' references unknown tensor`);return t}var Se={\u03B1:"\\alpha",\u03B2:"\\beta",\u03B3:"\\gamma",\u03B4:"\\delta",\u03B5:"\\epsilon",\u03B6:"\\zeta",\u03B7:"\\eta",\u03B8:"\\theta",\u03B9:"\\iota",\u03BA:"\\kappa",\u03BB:"\\lambda",\u03BC:"\\mu",\u03BD:"\\nu",\u03BE:"\\xi",\u03C0:"\\pi",\u03C1:"\\rho",\u03C3:"\\sigma",\u03C4:"\\tau",\u03C5:"\\upsilon",\u03C6:"\\phi",\u03C7:"\\chi",\u03C8:"\\psi",\u03C9:"\\omega",\u0393:"\\Gamma",\u0394:"\\Delta",\u0398:"\\Theta",\u039B:"\\Lambda",\u039E:"\\Xi",\u03A0:"\\Pi",\u03A3:"\\Sigma",\u03A5:"\\Upsilon",\u03A6:"\\Phi",\u03A8:"\\Psi",\u03A9:"\\Omega"},En=/[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]/g;function Re(e){return e.replace(En,n=>Se[n]??n)}function wn(e){let{indices:n,metadata:t}=e;if(n.length===0)return"";let r=new Set,a=new Set,o=new Set,i=new Set;for(let s of t.symmetrized_groups)s.length>=2&&(r.add(s[0]),a.add(s[s.length-1]));for(let s of t.antisymmetrized_groups)s.length>=2&&(o.add(s[0]),i.add(s[s.length-1]));let l="",c=0;for(;c<n.length;){let s=n[c].variance,f=c+1;for(;f<n.length&&n[f].variance===s;)f++;let A=s==="Contra"?"^":"_";c>0&&(l+="{}"),l+=A+"{";for(let h=c;h<f;h++){h>c&&(l+=" "),r.has(h)&&(l+="("),o.has(h)&&(l+="[");let S=n[h];S.isDerivative&&S.derivativeType==="semicolon"?l+=";\\! ":S.isDerivative&&S.derivativeType==="comma"&&(l+=",\\! "),l+=Re(S.label),a.has(h)&&(l+=")"),i.has(h)&&(l+="]")}l+="}",c=f}return l}var _n=new Set([p,T]),ke={};for(let[e,n]of Object.entries(Se))ke[n]=e;var bn=new Set(["\\frac","\\sqrt","\\sum","\\int","\\prod","\\lim"]);function ve(e){return e.replace(/\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b/g,n=>ke[n]??n)}function Ne(e){for(let t of bn)if(e.includes(t))return{ok:!1,error:`Unsupported LaTeX command: ${t.slice(1)}`};let n=e;return n=n.replace(/\\left\s*/g,""),n=n.replace(/\\right\s*/g,""),n=n.replace(/\\mathcal\{L\}_\{([^}]+)\}\s*/g,(t,r)=>`__LIE__${ve(r)}__LIESEP__`),n=n.replace(/\\det/g,"det"),n=n.replace(/\\operatorname\{Tr\}/g,"Tr"),n=n.replace(/\\star/g,"star"),n=n.replace(/\\iota/g,"i"),n=n.replace(/\\cdot/g,"*"),n=n.replace(/\\times/g,"*"),n=n.replace(/\\wedge/g,"^"),n=ve(n),n=n.replace(/([A-Za-z\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9])((?:\s*\{\})*(?:\s*[_^]\{[^}]*\}(?:\s*\{\})*)+)/g,(t,r,a)=>{let o=[],i=/([_^])\{([^}]*)\}/g,l;for(;(l=i.exec(a))!==null;){let c=l[1]==="^"?"^":"_",s=l[2].trim();if(s==="")continue;let f=s.includes(" ")?s.split(/\s+/).filter(Boolean):[...s].filter(A=>A.trim());for(let A of f)o.push(c+A)}return o.length>0?r+"{"+o.join(" ")+"}":r}),n=n.replace(/__LIE__(\S+?)__LIESEP__(\w+(?:\{[^}]*\})*)/g,(t,r,a)=>`L(${r.trim()}, ${a.trim()})`),n=n.replace(/\s+/g," ").trim(),n=n.replace(/\(\s+/g,"("),n=n.replace(/\s+\)/g,")"),{ok:!0,value:n}}function m(e){let{head:n,args:t,indices:r,value:a}=e;if(n===I)return a!=null?String(a):"0";if(n===_&&t.length===1){let i=t[0],l=m(i);return _n.has(i.head)?`-(${l})`:"-"+l}if(n===p){let i=[];for(let l=0;l<t.length;l++){let c=t[l];l>0&&c.head===_&&c.args.length===1?i.push(" - "+m(c.args[0])):l===0?i.push(m(c)):i.push(" + "+m(c))}return i.join("")}if(n===x)return t.map(m).join(" ");if(n===T)return t.map(m).join(" \\wedge ");if(n===O&&t.length===2)return`\\mathcal{L}_{${m(t[0])}} ${m(t[1])}`;if(n===H&&t.length===2)return`\\iota_{${m(t[0])}} ${m(t[1])}`;if(n===P&&t.length===1)return m(t[0])+"^{-1}";if(n===L&&t.length===1)return`\\det(${m(t[0])})`;if(n===M&&t.length===1)return`\\operatorname{Tr}(${m(t[0])})`;if(n===R&&t.length===1)return`\\star(${m(t[0])})`;if(n===V&&t.length===1)return`d(${m(t[0])})`;if(!K.has(n))return Re(n)+wn(e);let o=t.map(m).join(", ");return`\\operatorname{${n}}(${o})`}return He(Cn);})();
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
