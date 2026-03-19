"use strict";var ChacanaChecker=(()=>{var M=Object.defineProperty;var Ae=Object.getOwnPropertyDescriptor;var ve=Object.getOwnPropertyNames;var Ne=Object.prototype.hasOwnProperty;var oe=e=>{throw TypeError(e)};var Se=(e,n,t)=>n in e?M(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Re=(e,n)=>{for(var t in n)M(e,t,{get:n[t],enumerable:!0})},$e=(e,n,t,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let a of ve(n))!Ne.call(e,a)&&a!==t&&M(e,a,{get:()=>n[a],enumerable:!(r=Ae(n,a))||r.enumerable});return e};var Ve=e=>$e(M({},"__esModule",{value:!0}),e);var F=(e,n,t)=>Se(e,typeof n!="symbol"?n+"":n,t),le=(e,n,t)=>n.has(e)||oe("Cannot "+t);var d=(e,n,t)=>(le(e,n,"read from private field"),t?t.call(e):n.get(e)),H=(e,n,t)=>n.has(e)?oe("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),x=(e,n,t,r)=>(le(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t);var tn={};Re(tn,{HEAD_ADD:()=>g,HEAD_MULTIPLY:()=>p,IndexType:()=>X,STRUCTURAL_HEADS:()=>ce,Variance:()=>D,buildAST:()=>y,checkAll:()=>ye,loadContext:()=>Ie});var D=(t=>(t.Contra="Contra",t.Covar="Covar",t))(D||{}),X=(r=>(r.Latin="Latin",r.Greek="Greek",r.Spinor="Spinor",r))(X||{}),g="Add",A="Negate",p="Multiply",E="Wedge",L="ExteriorDerivative",G="LieDerivative",U="Trace",k="Determinant",z="Inverse",R="HodgeStar",j="InteriorProduct",W="Perturbation",J="Commutator",C="Number",se={d:L,L:G,Tr:U,det:k,inv:z,star:R,hodge:R,i:j},ce=new Set([g,A,p,E,L,G,U,k,z,R,j,W,J,C]),Oe=/[\u03B1-\u03C9\u0391-\u03A9]/;function fe(e){return Oe.test(e)?"Greek":"Latin"}function b(e,n=[],t=[],r=null,a={},o=null){return{head:e,args:n,indices:t,value:r,metadata:a,range:o}}function _(e){return{startLine:e.startPosition.row,startColumn:e.startPosition.column,endLine:e.endPosition.row,endColumn:e.endPosition.column}}function Q(e,n,t=!1,r=null){return{label:n,variance:e==="^"?"Contra":"Covar",indexType:fe(n),isDerivative:t,derivativeType:r}}function y(e){if(e.type==="source_file"){let n=e.namedChildren[0];return n?y(n):null}if(e.hasError)return null;switch(e.type){case"sum_expression":return ee(e,g,"+","-");case"product_expression":return ee(e,p,"*");case"wedge_expression":return ee(e,E,"^");case"tensor_expr":return Me(e);case"functional_op":return Fe(e);case"scalar":return He(e);case"perturbation":return Le(e);case"commutator":return Ge(e);case"paren_expression":return y(e.namedChildren[0]);default:return null}}function ee(e,n,...t){let r=[],a=[];ue(e,n,r,a);let o=[];for(let i=0;i<r.length;i++)i>0&&a[i-1]==="-"?o.push(b(A,[r[i]],[],null,{},_(e))):o.push(r[i]);return o.length===1?o[0]:b(n,o,[],null,{},_(e))}function ue(e,n,t,r){if(e.type!==Pe(n)){let l=y(e);l&&t.push(l);return}let a=e.childForFieldName("left"),o=e.childForFieldName("right"),i=e.childForFieldName("operator");if(a&&ue(a,n,t,r),i&&r.push(i.type),o){let l=y(o);l&&t.push(l)}}function Pe(e){return e===g?"sum_expression":e===p?"product_expression":e===E?"wedge_expression":""}function Me(e){let t=e.childForFieldName("name")?.text??"",r=e.childForFieldName("indices"),{indices:a,metadata:o}=r?ne(r.namedChildren[0]):{indices:[],metadata:{}};return b(t,[],a,null,o,_(e))}function Fe(e){let t=e.childForFieldName("name")?.text??"",r=se[t]??t,a=e.childForFieldName("arguments"),o=[];if(a)for(let s of a.namedChildren){let u=y(s);u&&o.push(u)}let i=e.childForFieldName("indices"),{indices:l,metadata:c}=i?ne(i.namedChildren[0]):{indices:[],metadata:{}};return b(r,o,l,null,c,_(e))}function He(e){let n=e.text,t=n.includes(".")?parseFloat(n):parseInt(n,10);return b(C,[],[],t,{},_(e))}function Le(e){let n=e.childForFieldName("order"),t=e.childForFieldName("body"),r=n?parseInt(n.text,10):0,a=t?y(t):null;return b(W,a?[a]:[],[],null,{order:r},_(e))}function Ge(e){let n=e.childForFieldName("left"),t=e.childForFieldName("right"),r=[];if(n){let a=y(n);a&&r.push(a)}if(t){let a=y(t);a&&r.push(a)}return b(J,r,[],null,{},_(e))}function ne(e){if(!e||e.type!=="index_list")return{indices:[],metadata:{}};let n=[],t=[],r=[];for(let o of e.namedChildren)if(o.type==="index")n.push(Ue(o));else if(o.type==="symmetrization"||o.type==="anti_symmetrization"){let i=o.namedChildren.find(l=>l.type==="index_list");if(i){let l=n.length,c=ne(i),s=[];for(let u=0;u<c.indices.length;u++)s.push(l+u);n.push(...c.indices),o.type==="symmetrization"?t.push(s):r.push(s)}}let a={};return t.length>0&&(a.symmetrized_groups=t),r.length>0&&(a.antisymmetrized_groups=r),{indices:n,metadata:a}}function Ue(e){let n=e.childForFieldName("variance"),t=e.childForFieldName("name");if(!t)return Q(n?.text??null,"");if(t.type==="derivative"){let r=t.childForFieldName("type"),a=t.childForFieldName("name"),o=r?.text===";"?"semicolon":"comma";return Q(n?.text??null,a?.text??"",!0,o)}return Q(n?.text??null,t.text)}function I(e){if(e.head===g)return e.args.length>0?I(e.args[0]):[];if(e.head===A)return e.args.length>0?I(e.args[0]):[];if(e.head===p){let n=[];for(let t of e.args)n.push(...I(t));return ke(n)}if(e.head===E){let n=[];for(let t of e.args)n.push(...I(t));return n}return e.head===L?e.args.length>0?I(e.args[0]):[]:e.head===C?[]:[...e.indices]}function ke(e){let n=[],t=new Set;for(let r=0;r<e.length;r++){if(t.has(r))continue;let a=!1;for(let o=r+1;o<e.length;o++)if(!t.has(o)&&e[r].label===e[o].label&&e[r].indexType===e[o].indexType&&e[r].variance!==e[o].variance){t.add(r),t.add(o),a=!0;break}a||n.push(e[r])}return n}function te(e){if(e.head===g||e.head===A)return e.args.length>0?te(e.args[0]):[];if(e.head===p||e.head===E){let n=[];for(let t of e.args)n.push(...te(t));return n}return e.head===C?[]:[...e.indices]}function $(e,n){return e.indices.length>0?e.indices.length:n.tensors.get(e.head)?.rank??null}function ze(e,n){if(e.indices.length>0)return e.indices.map(r=>r.variance);let t=n.tensors.get(e.head);return t?.indexPattern.length?[...t.indexPattern]:null}function de(e,n){let t=$(e,n);if(t==null)return null;if(t!==1)return!1;let r=ze(e,n);return r==null?null:r[0]==="Contra"}function me(e){return e.length===0?"{}":`{${e.map(t=>`${t.variance==="Contra"?"^":"_"}${t.label}`).join(" ")}}`}function re(e,n,t){if(e.head===p||e.head===E){let r=[];for(let a of e.args)re(a,n,t),r.push(...te(a));if(e.head===p){let a=new Map;for(let o of r){let i=a.get(o.label)??[];i.push(o),a.set(o.label,i)}for(let[o,i]of a)if(i.length===2){if(i[0].indexType!==i[1].indexType)t.push({message:`Contraction index '${o}' has mismatched index type: ${i[0].indexType} vs ${i[1].indexType}`,range:e.range,code:"chacana/contraction"});else if(i[0].variance===i[1].variance){if(n?.activeMetric)continue;t.push({message:`Contraction index '${o}' appears twice with same variance (${i[0].variance})`,range:e.range,code:"chacana/contraction"})}}else i.length>2&&t.push({message:`Index '${o}' appears ${i.length} times (expected at most 2)`,range:e.range,code:"chacana/contraction"})}}else if(e.head===g||e.args.length>0)for(let r of e.args)re(r,n,t)}function ge(e,n){if(e.head===g&&e.args.length>=2){let t=I(e.args[0]),r=he(t);for(let a=1;a<e.args.length;a++){let o=I(e.args[a]),i=he(o);je(r,i)||n.push({message:`Free index mismatch in sum: term 0 has ${me(t)}, term ${a} has ${me(o)}`,range:e.range,code:"chacana/free-index"})}}for(let t of e.args)ge(t,n)}function he(e){let n=new Map;for(let t of e){let r=`${t.label}:${t.variance}`;n.set(r,(n.get(r)??0)+1)}return n}function je(e,n){if(e.size!==n.size)return!1;for(let[t,r]of e)if(n.get(t)!==r)return!1;return!0}function pe(e,n,t){for(let r of["symmetrized_groups","antisymmetrized_groups"]){let a=e.metadata[r]??[],o=r.includes("anti")?"anti-symmetrization":"symmetrization";for(let i of a){if(i.length<2)continue;let l=e.indices[i[0]];for(let c=1;c<i.length;c++){let s=e.indices[i[c]];l.variance!==s.variance&&t.push({message:`Variance mismatch in ${o}: index '${l.label}' (${l.variance}) vs '${s.label}' (${s.variance})`,range:e.range,code:"chacana/symmetry"}),l.indexType!==s.indexType&&t.push({message:`Index type mismatch in ${o}: index '${l.label}' (${l.indexType}) vs '${s.label}' (${s.indexType})`,range:e.range,code:"chacana/symmetry"})}}}if(n!=null){let r=n.tensors.get(e.head);if(r&&e.indices.length>0)for(let a of r.symmetries){let o=a.indices.map(i=>i-1);if(o.every(i=>i>=0&&i<e.indices.length)){let i=e.indices[o[0]];for(let l=1;l<o.length;l++){let c=e.indices[o[l]];i.variance!==c.variance&&t.push({message:`Variance mismatch in declared symmetry of '${e.head}': slot ${o[0]+1} (${i.variance}) vs slot ${o[l]+1} (${c.variance})`,range:e.range,code:"chacana/symmetry"})}}}}for(let r of e.args)pe(r,n,t)}function ie(e,n,t){if(e.head===g||e.head===p||e.head===E){for(let a of e.args)ie(a,n,t);return}if(e.head===C)return;if(e.args.length>0)for(let a of e.args)ie(a,n,t);let r=n.tensors.get(e.head);if(r&&(e.indices.length>0&&e.indices.length!==r.rank&&t.push({message:`Tensor '${e.head}' declared with rank ${r.rank}, but used with ${e.indices.length} indices`,range:e.range,code:"chacana/rank"}),e.indices.length>0&&r.indexPattern.length>0))for(let a=0;a<Math.min(e.indices.length,r.indexPattern.length);a++)e.indices[a].variance!==r.indexPattern[a]&&t.push({message:`Tensor '${e.head}' index ${a}: expected ${r.indexPattern[a]}, got ${e.indices[a].variance}`,range:e.range,code:"chacana/rank"})}function xe(e,n,t){if(e.head===R&&!n.activeMetric&&t.push({message:"Hodge star operator requires an active_metric in the context",range:e.range,code:"chacana/operator"}),e.head===j&&e.args.length>=2){de(e.args[0],n)===!1&&t.push({message:"Interior product first argument must be a vector field (rank 1 contravariant)",range:e.range,code:"chacana/operator"});let a=$(e.args[1],n);a!=null&&a===0&&t.push({message:"Interior product is undefined for 0-forms (rank 0)",range:e.range,code:"chacana/operator"})}if(e.head===G&&e.args.length>=1&&de(e.args[0],n)===!1&&t.push({message:"Lie derivative first argument must be a vector field (rank 1 contravariant)",range:e.range,code:"chacana/operator"}),e.head===U&&e.args.length>=1){let r=$(e.args[0],n);r!=null&&r<2&&t.push({message:`Trace requires a tensor of rank >= 2, but argument has rank ${r}`,range:e.range,code:"chacana/operator"})}if(e.head===k&&e.args.length>=1){let r=$(e.args[0],n);r!=null&&r!==2&&t.push({message:`Determinant requires a rank-2 tensor, but argument has rank ${r}`,range:e.range,code:"chacana/operator"})}if(e.head===z&&e.args.length>=1){let r=$(e.args[0],n);r!=null&&r!==2&&t.push({message:`Inverse requires a rank-2 tensor, but argument has rank ${r}`,range:e.range,code:"chacana/operator"})}for(let r of e.args)xe(r,n,t)}function ye(e,n=null){let t=[];return re(e,n,t),ge(e,t),pe(e,n,t),n&&(ie(e,n,t),xe(e,n,t)),t}function Be(e,n){let t=e.slice(0,n).split(/\r\n|\n|\r/g);return[t.length,t.pop().length+1]}function qe(e,n,t){let r=e.split(/\r\n|\n|\r/g),a="",o=(Math.log10(n+1)|0)+1;for(let i=n-1;i<=n+1;i++){let l=r[i-1];l&&(a+=i.toString().padEnd(o," "),a+=":  ",a+=l,a+=`
`,i===n&&(a+=" ".repeat(o+t+2),a+=`^
`))}return a}var f=class extends Error{constructor(t,r){let[a,o]=Be(r.toml,r.ptr),i=qe(r.toml,a,o);super(`Invalid TOML document: ${t}

${i}`,r);F(this,"line");F(this,"column");F(this,"codeblock");this.line=a,this.column=o,this.codeblock=i}};function Ze(e,n){let t=0;for(;e[n-++t]==="\\";);return--t&&t%2}function B(e,n=0,t=e.length){let r=e.indexOf(`
`,n);return e[r-1]==="\r"&&r--,r<=t?r:-1}function v(e,n){for(let t=n;t<e.length;t++){let r=e[t];if(r===`
`)return t;if(r==="\r"&&e[t+1]===`
`)return t+1;if(r<" "&&r!=="	"||r==="\x7F")throw new f("control characters are not allowed in comments",{toml:e,ptr:n})}return e.length}function h(e,n,t,r){let a;for(;(a=e[n])===" "||a==="	"||!t&&(a===`
`||a==="\r"&&e[n+1]===`
`);)n++;return r||a!=="#"?n:h(e,v(e,n),t)}function we(e,n,t,r,a=!1){if(!r)return n=B(e,n),n<0?e.length:n;for(let o=n;o<e.length;o++){let i=e[o];if(i==="#")o=B(e,o);else{if(i===t)return o+1;if(i===r||a&&(i===`
`||i==="\r"&&e[o+1]===`
`))return o}}throw new f("cannot find end of structure",{toml:e,ptr:n})}function q(e,n){let t=e[n],r=t===e[n+1]&&e[n+1]===e[n+2]?e.slice(n,n+3):t;n+=r.length-1;do n=e.indexOf(r,++n);while(n>-1&&t!=="'"&&Ze(e,n));return n>-1&&(n+=r.length,r.length>1&&(e[n]===t&&n++,e[n]===t&&n++)),n}var Ye=/^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i,w,T,m,N=class N extends Date{constructor(t){let r=!0,a=!0,o="Z";if(typeof t=="string"){let i=t.match(Ye);i?(i[1]||(r=!1,t=`0000-01-01T${t}`),a=!!i[2],a&&t[10]===" "&&(t=t.replace(" ","T")),i[2]&&+i[2]>23?t="":(o=i[3]||null,t=t.toUpperCase(),!o&&a&&(t+="Z"))):t=""}super(t);H(this,w,!1);H(this,T,!1);H(this,m,null);isNaN(this.getTime())||(x(this,w,r),x(this,T,a),x(this,m,o))}isDateTime(){return d(this,w)&&d(this,T)}isLocal(){return!d(this,w)||!d(this,T)||!d(this,m)}isDate(){return d(this,w)&&!d(this,T)}isTime(){return d(this,T)&&!d(this,w)}isValid(){return d(this,w)||d(this,T)}toISOString(){let t=super.toISOString();if(this.isDate())return t.slice(0,10);if(this.isTime())return t.slice(11,23);if(d(this,m)===null)return t.slice(0,-1);if(d(this,m)==="Z")return t;let r=+d(this,m).slice(1,3)*60+ +d(this,m).slice(4,6);return r=d(this,m)[0]==="-"?r:-r,new Date(this.getTime()-r*6e4).toISOString().slice(0,-1)+d(this,m)}static wrapAsOffsetDateTime(t,r="Z"){let a=new N(t);return x(a,m,r),a}static wrapAsLocalDateTime(t){let r=new N(t);return x(r,m,null),r}static wrapAsLocalDate(t){let r=new N(t);return x(r,T,!1),x(r,m,null),r}static wrapAsLocalTime(t){let r=new N(t);return x(r,w,!1),x(r,m,null),r}};w=new WeakMap,T=new WeakMap,m=new WeakMap;var V=N;var Ke=/^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/,Xe=/^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/,We=/^[+-]?0[0-9_]/,Je=/^[0-9a-f]{2,8}$/i,Te={b:"\b",t:"	",n:`
`,f:"\f",r:"\r",e:"\x1B",'"':'"',"\\":"\\"};function Z(e,n=0,t=e.length){let r=e[n]==="'",a=e[n++]===e[n]&&e[n]===e[n+1];a&&(t-=2,e[n+=2]==="\r"&&n++,e[n]===`
`&&n++);let o=0,i,l="",c=n;for(;n<t-1;){let s=e[n++];if(s===`
`||s==="\r"&&e[n]===`
`){if(!a)throw new f("newlines are not allowed in strings",{toml:e,ptr:n-1})}else if(s<" "&&s!=="	"||s==="\x7F")throw new f("control characters are not allowed in strings",{toml:e,ptr:n-1});if(i){if(i=!1,s==="x"||s==="u"||s==="U"){let u=e.slice(n,n+=s==="x"?2:s==="u"?4:8);if(!Je.test(u))throw new f("invalid unicode escape",{toml:e,ptr:o});try{l+=String.fromCodePoint(parseInt(u,16))}catch{throw new f("invalid unicode escape",{toml:e,ptr:o})}}else if(a&&(s===`
`||s===" "||s==="	"||s==="\r")){if(n=h(e,n-1,!0),e[n]!==`
`&&e[n]!=="\r")throw new f("invalid escape: only line-ending whitespace may be escaped",{toml:e,ptr:o});n=h(e,n)}else if(s in Te)l+=Te[s];else throw new f("unrecognized escape sequence",{toml:e,ptr:o});c=n}else!r&&s==="\\"&&(o=n-1,i=!0,l+=e.slice(c,o))}return l+e.slice(c,t-1)}function Ee(e,n,t,r){if(e==="true")return!0;if(e==="false")return!1;if(e==="-inf")return-1/0;if(e==="inf"||e==="+inf")return 1/0;if(e==="nan"||e==="+nan"||e==="-nan")return NaN;if(e==="-0")return r?0n:0;let a=Ke.test(e);if(a||Xe.test(e)){if(We.test(e))throw new f("leading zeroes are not allowed",{toml:n,ptr:t});e=e.replace(/_/g,"");let i=+e;if(isNaN(i))throw new f("invalid number",{toml:n,ptr:t});if(a){if((a=!Number.isSafeInteger(i))&&!r)throw new f("integer value cannot be represented losslessly",{toml:n,ptr:t});(a||r===!0)&&(i=BigInt(e))}return i}let o=new V(e);if(!o.isValid())throw new f("invalid value",{toml:n,ptr:t});return o}function Qe(e,n,t){let r=e.slice(n,t),a=r.indexOf("#");return a>-1&&(v(e,a),r=r.slice(0,a)),[r.trimEnd(),a]}function O(e,n,t,r,a){if(r===0)throw new f("document contains excessively nested structures. aborting.",{toml:e,ptr:n});let o=e[n];if(o==="["||o==="{"){let[c,s]=o==="["?Ce(e,n,r,a):be(e,n,r,a);if(t){if(s=h(e,s),e[s]===",")s++;else if(e[s]!==t)throw new f("expected comma or end of structure",{toml:e,ptr:s})}return[c,s]}let i;if(o==='"'||o==="'"){i=q(e,n);let c=Z(e,n,i);if(t){if(i=h(e,i),e[i]&&e[i]!==","&&e[i]!==t&&e[i]!==`
`&&e[i]!=="\r")throw new f("unexpected character encountered",{toml:e,ptr:i});i+=+(e[i]===",")}return[c,i]}i=we(e,n,",",t);let l=Qe(e,n,i-+(e[i-1]===","));if(!l[0])throw new f("incomplete key-value declaration: no value specified",{toml:e,ptr:n});return t&&l[1]>-1&&(i=h(e,n+l[1]),i+=+(e[i]===",")),[Ee(l[0],e,n,a),i]}var en=/^[a-zA-Z0-9-_]+[ \t]*$/;function Y(e,n,t="="){let r=n-1,a=[],o=e.indexOf(t,n);if(o<0)throw new f("incomplete key-value: cannot find end of key",{toml:e,ptr:n});do{let i=e[n=++r];if(i!==" "&&i!=="	")if(i==='"'||i==="'"){if(i===e[n+1]&&i===e[n+2])throw new f("multiline strings are not allowed in keys",{toml:e,ptr:n});let l=q(e,n);if(l<0)throw new f("unfinished string encountered",{toml:e,ptr:n});r=e.indexOf(".",l);let c=e.slice(l,r<0||r>o?o:r),s=B(c);if(s>-1)throw new f("newlines are not allowed in keys",{toml:e,ptr:n+r+s});if(c.trimStart())throw new f("found extra tokens after the string part",{toml:e,ptr:l});if(o<l&&(o=e.indexOf(t,l),o<0))throw new f("incomplete key-value: cannot find end of key",{toml:e,ptr:n});a.push(Z(e,n,l))}else{r=e.indexOf(".",n);let l=e.slice(n,r<0||r>o?o:r);if(!en.test(l))throw new f("only letter, numbers, dashes and underscores are allowed in keys",{toml:e,ptr:n});a.push(l.trimEnd())}}while(r+1&&r<o);return[a,h(e,o+1,!0,!0)]}function be(e,n,t,r){let a={},o=new Set,i;for(n++;(i=e[n++])!=="}"&&i;){if(i===",")throw new f("expected value, found comma",{toml:e,ptr:n-1});if(i==="#")n=v(e,n);else if(i!==" "&&i!=="	"&&i!==`
`&&i!=="\r"){let l,c=a,s=!1,[u,K]=Y(e,n-1);for(let P=0;P<u.length;P++){if(P&&(c=s?c[l]:c[l]={}),l=u[P],(s=Object.hasOwn(c,l))&&(typeof c[l]!="object"||o.has(c[l])))throw new f("trying to redefine an already defined value",{toml:e,ptr:n});!s&&l==="__proto__"&&Object.defineProperty(c,l,{enumerable:!0,configurable:!0,writable:!0})}if(s)throw new f("trying to redefine an already defined value",{toml:e,ptr:n});let[S,De]=O(e,K,"}",t-1,r);o.add(S),c[l]=S,n=De}}if(!i)throw new f("unfinished table encountered",{toml:e,ptr:n});return[a,n]}function Ce(e,n,t,r){let a=[],o;for(n++;(o=e[n++])!=="]"&&o;){if(o===",")throw new f("expected value, found comma",{toml:e,ptr:n-1});if(o==="#")n=v(e,n);else if(o!==" "&&o!=="	"&&o!==`
`&&o!=="\r"){let i=O(e,n-1,"]",t-1,r);a.push(i[0]),n=i[1]}}if(!o)throw new f("unfinished array encountered",{toml:e,ptr:n});return[a,n]}function _e(e,n,t,r){let a=n,o=t,i,l=!1,c;for(let s=0;s<e.length;s++){if(s){if(a=l?a[i]:a[i]={},o=(c=o[i]).c,r===0&&(c.t===1||c.t===2))return null;if(c.t===2){let u=a.length-1;a=a[u],o=o[u].c}}if(i=e[s],(l=Object.hasOwn(a,i))&&o[i]?.t===0&&o[i]?.d)return null;l||(i==="__proto__"&&(Object.defineProperty(a,i,{enumerable:!0,configurable:!0,writable:!0}),Object.defineProperty(o,i,{enumerable:!0,configurable:!0,writable:!0})),o[i]={t:s<e.length-1&&r===2?3:r,d:!1,i:0,c:{}})}if(c=o[i],c.t!==r&&!(r===1&&c.t===3)||(r===2&&(c.d||(c.d=!0,a[i]=[]),a[i].push(a={}),c.c[c.i++]=c={t:1,d:!1,i:0,c:{}}),c.d))return null;if(c.d=!0,r===1)a=l?a[i]:a[i]={};else if(r===0&&l)return null;return[i,a,c.c]}function ae(e,{maxDepth:n=1e3,integersAsBigInt:t}={}){let r={},a={},o=r,i=a;for(let l=h(e,0);l<e.length;){if(e[l]==="["){let c=e[++l]==="[",s=Y(e,l+=+c,"]");if(c){if(e[s[1]-1]!=="]")throw new f("expected end of table declaration",{toml:e,ptr:s[1]-1});s[1]++}let u=_e(s[0],r,a,c?2:1);if(!u)throw new f("trying to redefine an already defined table or value",{toml:e,ptr:l});i=u[2],o=u[1],l=s[1]}else{let c=Y(e,l),s=_e(c[0],o,i,0);if(!s)throw new f("trying to redefine an already defined table or value",{toml:e,ptr:l});let u=O(e,c[1],void 0,n,t);s[1][s[0]]=u[0],l=u[1]}if(l=h(e,l,!0),e[l]&&e[l]!==`
`&&e[l]!=="\r")throw new f("each key-value declaration must be followed by an end-of-line",{toml:e,ptr:l});l=h(e,l)}return r}function nn(e){if(e==="Contra"||e==="contra")return"Contra";if(e==="Covar"||e==="covar")return"Covar";throw new Error(`Unknown variance: '${e}'`)}function Ie(e){let n=ae(e),t={manifolds:new Map,tensors:new Map,activeMetric:null},r=n.strategy??{};t.activeMetric=r.active_metric??null;let a=n.manifold??{};for(let[i,l]of Object.entries(a)){if(l.dimension==null)throw new Error(`Manifold '${i}' missing required 'dimension'`);t.manifolds.set(i,{name:i,dimension:l.dimension,indexType:l.index_type??"Latin"})}let o=n.tensor??{};for(let[i,l]of Object.entries(o)){let s=(l.index_pattern??[]).map(nn),K=(l.symmetries??[]).map(S=>({indices:S.indices,type:S.type}));t.tensors.set(i,{name:i,manifold:l.manifold??"",rank:l.rank??0,indexPattern:s,symmetries:K})}for(let[i,l]of t.tensors){if(l.manifold&&!t.manifolds.has(l.manifold))throw new Error(`Tensor '${i}' references unknown manifold '${l.manifold}'`);if(l.indexPattern.length>0&&l.indexPattern.length!==l.rank)throw new Error(`Tensor '${i}' index_pattern length (${l.indexPattern.length}) != rank (${l.rank})`)}if(t.activeMetric!=null&&!t.tensors.has(t.activeMetric))throw new Error(`active_metric '${t.activeMetric}' references unknown tensor`);return t}return Ve(tn);})();
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
