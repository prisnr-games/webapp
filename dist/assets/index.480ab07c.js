import{S as Y,i as Z,s as ee,e as S,a as R,t as _e,b as g,c as $,d as w,f as Se,n as J,g as N,h as Ce,o as te,j as U,M as Te,C as xe,k as me,l as Ae,m as Le,p as he,W as Pe,q as Ee,P as qe,A as Oe,r as He,u as Re,T as se,V as ge,E as ae,v as be,w as De,x as G,y as oe,z,B as $e,D as Ne,F as K,G as Ge,H as Q,I as Ie,J as je,K as ye,L as F,N as ne,O as X,Q as we,R as Be,U as ie,X as Ue,Y as le,Z as re,_ as ce,$ as ue,a0 as pe,a1 as We}from"./vendor.c13b8936.js";const ze=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function i(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerpolicy&&(s.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?s.credentials="include":n.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=i(n);fetch(n.href,s)}};ze();const Ke={en:{}},ve={red:{color:"#a00000",labels:{en:"red"}},green:{color:"#006000",labels:{en:"green"}},blue:{color:"#0000a0",labels:{en:"blue"}},black:{color:"#000000",labels:{en:"black"}}},Fe={triangle:{labels:{en:"triangle"}},square:{labels:{en:"square"}},circle:{labels:{en:"circle"}},star:{labels:{en:"star"}}},Xe={attention:[{labels:{en:"hey there :)"}},{delay:2e3,pause:800,labels:{en:"glad you made it!"}},{pause:600,delay:1800,labels:{en:"just remember that you should nev"}},{labels:{en:"the Arbiter approaches..."}}],loading:[{delay:2e3,interval:200,labels:{en:"hmmm"}},{delay:250,interval:500,labels:{en:"hmmm...."}}]};function P(e){return new Promise(t=>{setTimeout(()=>{t()},e)})}const Je=(e,t)=>e.querySelector(t),de=(e,t)=>Array.prototype.slice.call(e.querySelectorAll(t),0);function V(e,t={},i=[]){const a=document.createElement(e);for(const n in t)a.setAttribute(n,t[n]+"");for(const n of i)a.append(n);return a}function Qe(e){let t,i,a,n,s,c,m,p,h;return{c(){t=S("div"),i=S("div"),a=R(),n=S("div"),s=S("span"),c=_e(">\xA0"),m=_e(e[2]),p=R(),h=S("span"),h.textContent=`${Ve}`,g(i,"class","msg-history svelte-9pr3o0"),g(s,"class","text svelte-9pr3o0"),g(h,"class","cursor blinking svelte-9pr3o0"),g(n,"class","msg-console svelte-9pr3o0"),g(t,"class","msg-panel svelte-9pr3o0")},m(f,v){$(f,t,v),w(t,i),e[5](i),w(t,a),w(t,n),w(n,s),w(s,c),w(s,m),w(n,p),w(n,h),e[6](h),e[7](t)},p(f,[v]){v&4&&Se(m,f[2])},i:J,o:J,d(f){f&&N(t),e[5](null),e[6](null),e[7](null)}}}let Ve="\u275A";function Ye(e,t,i){const{language:a}=Ce("game");a.subscribe(l=>l);let{k_panel:n={reveal_text:f,commit:b,receive:C}}=t,s,c,m="",p,h=0;async function f(l,o=60,_=0){let M=++h;o||(o=60);const H=m.length,O=l.length;let E=0;for(;E<Math.min(H,O)&&m[E]===l[E];E++);const y=3/5;for(let T=H;T>E;T--)if(i(2,m=m.slice(0,-1)),await P(o*y),h!==M)return;if(_&&await P(_),h===M){for(let T=E;T<O;T++)if(p.classList.remove("blinking"),await P(10),h!==M||(p.classList.add("blinking"),i(2,m+=l[T]),await P(o),h!==M))return}}async function v(){await f("")}async function C(l){const o=V("div",{class:["line-commit",...l.from==="Arbiter"?["from-arbiter"]:[]].join(" ")},[`> ${l.from}: `,...l.text.flatMap(y=>[y,V("br")])]),_=V("div",{class:"curtain"});s.append(o),s.append(_);const M=s.getBoundingClientRect(),H=o.getBoundingClientRect(),O=H.top-M.top,E=H.height+5;Object.assign(_.style,{top:`${O}px`,height:`${E}px`,left:"0px",width:"100%"}),await P(100);for(let y=0;y<E;y+=5)Object.assign(_.style,{top:`${O+y}px`,height:`${E-y}px`}),await P(120);_.remove()}async function b(){s.append(V("div",{class:"line-commit"},[`> Arbiter: ${m}`])),i(2,m="")}let d=0;async function k(){debugger;const l=Date.now();l-d>3e4&&(await f("sorry, you don't get to type :P"),await P(1600),await v(),d=l)}te(()=>{c.addEventListener("keydown",()=>{k()})});function x(l){U[l?"unshift":"push"](()=>{s=l,i(0,s)})}function r(l){U[l?"unshift":"push"](()=>{p=l,i(3,p)})}function u(l){U[l?"unshift":"push"](()=>{c=l,i(1,c)})}return e.$$set=l=>{"k_panel"in l&&i(4,n=l.k_panel)},[s,c,m,p,n,x,r,u]}class Ze extends Y{constructor(t){super();Z(this,t,Ye,Qe,ee,{k_panel:4})}}function et(e,t){const i=new xe(39,39,3.3,128,1),a=[new me({color:"red"}),new Ae({map:e,bumpMap:t,bumpScale:Math.random()*.2+.2}),new me({map:e})],n=new Le;for(var s=0;s<16;s++){var c=(s+1)/16,m=c*Math.PI*2,p=10*Math.cos(m),h=10*Math.sin(m);s==0?n.moveTo(p,h):n.lineTo(p,h)}return new Te(i,a)}function tt(e){let t;return{c(){t=S("div")},m(i,a){$(i,t,a),e[2](t)},p:J,i:J,o:J,d(i){i&&N(t),e[2](null)}}}function nt(e,t,i){const a=Math.PI,n=a*2,s=Math.sqrt(3);let{k_scene:c}=t,m;async function p(b){const d={},k=new De;for(const x in b){const r=b[x];d[x]=await new Promise(u=>{k.load(r,l=>{u(l)})})}return d}function h(b,d,k,x,r){const u=new Path2D;switch(r){case"triangle":{const l=Math.sqrt(k*s),o=s*.5*l,_=l*s/6;u.moveTo(d,d-(o-_)),u.lineTo(d+l/2,d+_),u.lineTo(d-l/2,d+_);break}case"square":{const l=Math.sqrt(k),o=d-l*.5;u.moveTo(o,o),u.lineTo(o+l,o),u.lineTo(o+l,o+l),u.lineTo(o,o+l);break}case"circle":{const l=Math.sqrt(k/a);u.ellipse(d,d,l,l,0,0,n);break}case"star":{const l=a/5,o=Math.sqrt(2*k/(5*Math.sin(l)));let _=-1.5*l;u.moveTo(d,d-o);for(let M=0;M<9;M++){const H=o*((M%2+1)/2);u.lineTo(d+H*Math.cos(_),d+H*Math.sin(_)),_+=l}break}}u.closePath(),b.fillStyle=ve[x].color,b.fill(u),b.strokeStyle="black",b.lineWidth=Math.round(Math.sqrt(k)/50),b.stroke(u)}function f(b){const d=b.image,k=V("canvas",{width:d.width,height:d.height}),x=k.getContext("2d");return[k,x,d]}let v;te(async()=>{i(1,c={animate_chip_entry:E}),v=await p({chip:"/asset/chip.png",chip_displace:"/asset/chip-displacement.png",scuffs:"/asset/scuffs.png"});let b=v.chip,d=v.scuffs;{const[y,T,j]=f(v.scuffs),D=y.width,q=y.height,L=Math.random()*n;T.save();const I=D/2,B=q/2;T.translate(I,B),T.rotate(L),T.scale(Math.SQRT2,Math.SQRT2),T.drawImage(j,-I,-B),T.restore(),d=new he(y)}const k=new Pe({antialias:!0}),x=Je(document.body,".msg-panel").getBoundingClientRect(),r=window.innerWidth,u=Math.max(400,Math.min(800,window.innerHeight-x.bottom));k.setSize(r,u),m.appendChild(k.domElement);const l=r/u,o=new Ee,_=new qe(45,l,1,5e3);_.position.set(0,0,140),_.lookAt(0,0,0);let M;{const y=new Oe(3158064);o.add(y)}{const y=new He;y.position.set(0,100,50),y.decay=2.5,y.angle=Math.PI/9,y.penumbra=.9,o.add(y)}function H(){k.render(o,_)}k.setAnimationLoop(()=>{H(),Re()});function O(y,T){const[j,D,q]=f(v.chip),L=q.width;q.height,D.drawImage(q,0,0);const I=L/2,B=Math.pow(I*(2/9),2)*a;h(D,I,B,y,T),b=new he(j),M=et(b,d),o.add(M)}async function E(y,T){O(y,T),M.position.y=8e5,M.visible=!0,new se(new ge(-780,-2450,-3e3)).to(new ge(0,0,0),4e3).easing(ae.Cubic.Out).onUpdate(L=>{M.position.setX(L.x),M.position.setZ(L.z)}).start(),new se({y:750}).to({y:0},4e3).easing(ae.Back.Out).onUpdate(({y:L})=>{M.position.setY(L)}).start(),new se(new be(0,0,0)).to(new be(0,a/2,a/2-a/6),4e3).easing(ae.Cubic.Out).onUpdate(L=>{M.rotation.set(L.x,L.y,L.z)}).start()}});function C(b){U[b?"unshift":"push"](()=>{m=b,i(0,m)})}return e.$$set=b=>{"k_scene"in b&&i(1,c=b.k_scene)},[m,c,C]}class st extends Y{constructor(t){super();Z(this,t,nt,tt,ee,{k_scene:1})}}function ke(e){let t,i,a,n,s,c,m,p,h,f,v,C,b,d,k,x,r,u,l,o,_,M,H,O,E,y,T,j,D,q,L,I,B;return{c(){t=S("div"),i=S("span"),a=S("span"),a.textContent="The bag CANNOT be",n=R(),s=S("span"),s.textContent="My chip is",m=R(),p=S("span"),h=S("span"),f=S("button"),f.innerHTML='<span class="svelte-1t128y1">Red</span>',v=R(),C=S("button"),C.innerHTML='<span class="svelte-1t128y1">Blue</span>',b=R(),d=S("span"),k=S("button"),k.innerHTML='<span class="svelte-1t128y1">Green</span>',x=R(),r=S("button"),r.innerHTML='<span class="svelte-1t128y1">Black</span>',l=R(),o=S("span"),_=S("span"),M=S("button"),M.innerHTML='<span class="svelte-1t128y1">\u25B2</span>',H=R(),O=S("button"),O.innerHTML='<span class="svelte-1t128y1">\u25CF</span>',E=R(),y=S("span"),T=S("button"),T.innerHTML='<span class="svelte-1t128y1">\u2586</span>',j=R(),D=S("button"),D.innerHTML='<span class="svelte-1t128y1">\u2605</span>',g(a,"class","active tab svelte-1t128y1"),g(a,"data-basis","bag"),g(s,"class","tab svelte-1t128y1"),g(s,"data-basis","chip"),g(i,"class","tab-wrap svelte-1t128y1"),g(t,"class","tx-basis svelte-1t128y1"),g(f,"class","diamond-top color-red svelte-1t128y1"),g(f,"data-color","red"),g(C,"class","diamond-rgt color-blue svelte-1t128y1"),g(C,"data-color","blue"),g(h,"class","svelte-1t128y1"),g(k,"class","diamond-lft color-green svelte-1t128y1"),g(k,"data-color","green"),g(r,"class","diamond-btm color-black svelte-1t128y1"),g(r,"data-color","black"),g(d,"class","svelte-1t128y1"),g(p,"class","diamond tx-colors svelte-1t128y1"),g(M,"class","diamond-top bg-rad-top svelte-1t128y1"),g(M,"data-shape","triangle"),g(O,"class","diamond-rgt bg-rad-rgt svelte-1t128y1"),g(O,"data-shape","circle"),g(_,"class","svelte-1t128y1"),g(T,"class","diamond-lft bg-rad-lft svelte-1t128y1"),g(T,"data-shape","square"),g(D,"class","diamond-btm bg-rad-btm svelte-1t128y1"),g(D,"data-shape","star"),g(y,"class","svelte-1t128y1"),g(o,"class","diamond tx-shapes svelte-1t128y1")},m(A,W){$(A,t,W),w(t,i),w(i,a),w(i,n),w(i,s),$(A,m,W),$(A,p,W),w(p,h),w(h,f),w(h,v),w(h,C),w(p,b),w(p,d),w(d,k),w(d,x),w(d,r),$(A,l,W),$(A,o,W),w(o,_),w(_,M),w(_,H),w(_,O),w(o,E),w(o,y),w(y,T),w(y,j),w(y,D),L=!0,I||(B=[G(a,"click",e[1]),G(s,"click",e[1]),G(f,"click",e[2]),G(C,"click",e[2]),G(k,"click",e[2]),G(r,"click",e[2]),G(M,"click",e[3]),G(O,"click",e[3]),G(T,"click",e[3]),G(D,"click",e[3])],I=!0)},p(A,W){e=A},i(A){L||(oe(()=>{c||(c=z(t,F,{duration:3600,easing:ye},!0)),c.run(1)}),oe(()=>{u||(u=z(p,F,{delay:2400,duration:3200,easing:ne},!0)),u.run(1)}),oe(()=>{q||(q=z(o,F,{delay:3200,duration:3200,easing:ne},!0)),q.run(1)}),L=!0)},o(A){c||(c=z(t,F,{duration:3600,easing:ye},!1)),c.run(0),u||(u=z(p,F,{delay:2400,duration:3200,easing:ne},!1)),u.run(0),q||(q=z(o,F,{delay:3200,duration:3200,easing:ne},!1)),q.run(0),L=!1},d(A){A&&N(t),A&&c&&c.end(),A&&N(m),A&&N(p),A&&u&&u.end(),A&&N(l),A&&N(o),A&&q&&q.end(),I=!1,$e(B)}}}function at(e){let t,i,a=e[0]&&ke(e);return{c(){a&&a.c(),t=Ne()},m(n,s){a&&a.m(n,s),$(n,t,s),i=!0},p(n,[s]){n[0]?a?(a.p(n,s),s&1&&K(a,1)):(a=ke(n),a.c(),K(a,1),a.m(t.parentNode,t)):a&&(Ge(),Q(a,1,1,()=>{a=null}),Ie())},i(n){i||(K(a),i=!0)},o(n){Q(a),i=!1},d(n){a&&a.d(n),n&&N(t)}}}function ot(e,t,i){let{k_tx:a={show:c}}=t;const n=je();let s=!1;async function c(){i(0,s=!0)}function m(f){de(document.body,".tx-basis .active").forEach(C=>C.classList.remove("active"));const v=f.target;v.classList.add("active"),n("basis",v.getAttribute("data-basis"))}function p(f){de(document.body,".diamond .active").forEach(C=>C.classList.remove("active"));const v=f.target.closest("button");v.classList.add("active"),n("color",v.getAttribute("data-color"))}function h(f){de(document.body,".diamond .active").forEach(C=>C.classList.remove("active"));const v=f.target.closest("button");v.classList.add("active"),n("shape",v.getAttribute("data-shape"))}return e.$$set=f=>{"k_tx"in f&&i(4,a=f.k_tx)},[s,m,p,h,a]}class it extends Y{constructor(t){super();Z(this,t,ot,at,ee,{k_tx:4})}}X.config.encrypt=!1;X.config.secret="font-size";X.config.encrypter=(e,t)=>we.encrypt(JSON.stringify(e),t).toString();X.config.decrypter=(e,t)=>{try{return JSON.parse(we.decrypt(e,t).toString(Be))}catch{return e}};const lt=ie(X.get("permits")||{});lt.subscribe(e=>{X.set("permits",e)});const rt="supernova-1",fe="http://localhost:1317";function ct(){let e={keplrEnabled:!1,scrtAuthorized:!1,scrtClient:null};const{subscribe:t,set:i,update:a}=ie(e);return{subscribe:t,connect:async()=>{console.log("connect to keplr");const n=await pt(rt,fe);i(n)}}}async function ut(e){let t=!1;return await new Promise((a,n)=>{const s=setInterval(async()=>{!!window.keplr&&!!window.getOfflineSigner&&!!window.getEnigmaUtils&&(t=!0,clearInterval(s),(e==="supernova-2"||e==="supernova-1")&&await dt(e),a())},1e3)}),t}async function pt(e,t){let i=await ut(e),a=!1,n=null;try{await window.keplr.enable(e);const c=window.getOfflineSigner(e),m=window.getEnigmaUtils(e),p=await c.getAccounts(),h=new Ue(t,p[0].address,c,m,{exec:{amount:[{amount:"62500",denom:"uscrt"}],gas:"250000"}});a=!0,n=h}catch{a=!1,n=null}return{keplrEnabled:i,scrtAuthorized:a,scrtClient:n}}async function dt(e){let t,i,a;if(e==="supernova-1")t="http://localhost:26657/",i=fe,a="Localhost SCRT Testnet";else if(e==="supernova-2")t="https://chainofsecrets.secrettestnet.io:26667/",i=fe,a="Supernova-2 Secret Testnet";else return!1;let n={chainId:e,bip44:{coinType:529},coinType:529,stakeCurrency:{coinDenom:"SCRT",coinMinimalDenom:"uscrt",coinDecimals:6},bech32Config:{bech32PrefixAccAddr:"secret",bech32PrefixAccPub:"secretpub",bech32PrefixValAddr:"secretvaloper",bech32PrefixValPub:"secretvaloperpub",bech32PrefixConsAddr:"secretvalcons",bech32PrefixConsPub:"secretvalconspub"},currencies:[{coinDenom:"SCRT",coinMinimalDenom:"uscrt",coinDecimals:6}],feeCurrencies:[{coinDenom:"SCRT",coinMinimalDenom:"uscrt",coinDecimals:6}],gasPriceStep:{low:.1,average:.25,high:.4},features:["secretwasm"],rpc:t,rest:i,chainName:a};return n.rpc&&n.rest&&window.keplr?(await window.keplr.experimentalSuggestChain(n),!0):!1}const Me=ct();function ft(e){let t,i,a,n,s,c,m,p,h,f;function v(r){e[7](r)}let C={};e[0]!==void 0&&(C.k_panel=e[0]),t=new Ze({props:C}),U.push(()=>le(t,"k_panel",v));function b(r){e[8](r)}let d={};e[2]!==void 0&&(d.k_tx=e[2]),s=new it({props:d}),U.push(()=>le(s,"k_tx",b)),s.$on("basis",e[3]),s.$on("color",e[4]),s.$on("shape",e[5]);function k(r){e[9](r)}let x={};return e[1]!==void 0&&(x.k_scene=e[1]),p=new st({props:x}),U.push(()=>le(p,"k_scene",k)),{c(){re(t.$$.fragment),a=R(),n=S("div"),re(s.$$.fragment),m=R(),re(p.$$.fragment),g(n,"class","container svelte-1fcofm4")},m(r,u){ce(t,r,u),$(r,a,u),$(r,n,u),ce(s,n,null),w(n,m),ce(p,n,null),f=!0},p(r,[u]){const l={};!i&&u&1&&(i=!0,l.k_panel=r[0],ue(()=>i=!1)),t.$set(l);const o={};!c&&u&4&&(c=!0,o.k_tx=r[2],ue(()=>c=!1)),s.$set(o);const _={};!h&&u&2&&(h=!0,_.k_scene=r[1],ue(()=>h=!1)),p.$set(_)},i(r){f||(K(t.$$.fragment,r),K(s.$$.fragment,r),K(p.$$.fragment,r),f=!0)},o(r){Q(t.$$.fragment,r),Q(s.$$.fragment,r),Q(p.$$.fragment,r),f=!1},d(r){pe(t,r),r&&N(a),r&&N(n),pe(s),pe(p)}}}function _t(e,t,i){let a;te(async()=>{await Me.connect(),console.log("Keplr connected"),Me.subscribe(o=>{i(6,a=o)})});let n;try{const o=new Intl.Locale(navigator.language).language;o in Ke&&(n=o)}catch{}{const o=ie("en");o.subscribe(_=>n=_),We("game",{language:o})}let s,c,m;async function p(o){for(const _ of Xe[o])_.delay&&await P(_.delay),await s.reveal_text(_.labels[n],_.interval,_.pause)}let h,f;te(async()=>{await P(2e3),await p("attention"),await P(1800),await s.reveal_text(""),await P(1200),await s.receive({from:"Arbiter",text:`
				Welcome, player, to my game of secrets.

				Four colors: Red, Green, Blue and Black. Four shapes: Triangle, Square, Circle and Star.

				Me, you and one other player. Each of us has a unique color and a unique shape.
			`.trim().split(/\n/).map(o=>o.trim())}),await P(4600),h=Object.keys(ve)[Math.floor(Math.random()*4)],f=Object.keys(Fe)[Math.floor(Math.random()*4)],await s.reveal_text(""),await s.receive({from:"Arbiter",text:["Here is your chip, player."]}),await c.animate_chip_entry(h,f),await P(4500),await s.receive({from:"Arbiter",text:[`I've given you the ${h} ${f} this round.`]}),await P(3600),await s.receive({from:"Arbiter",text:["Will you and the other player cooperate to deduce what is in my bag? Or will you attempt to deceive one another? Guess wrong and lose your wager. Guess right and be rewarded."]}),await P(6800),await s.receive({from:"Arbiter",text:["Now you must choose what to tell the other player."]}),await m.show(),await P(4e3),b()});let v="the bag cannot be",C="";function b(){s.reveal_text(`${v} ${C||"..."}`)}function d(o){o.detail==="bag"?v="the bag cannot be":v="my chip is",C="",b()}function k(o){C=o.detail,b()}function x(o){C=`a ${o.detail}`,b()}function r(o){s=o,i(0,s)}function u(o){m=o,i(2,m)}function l(o){c=o,i(1,c)}return e.$$.update=()=>{e.$$.dirty&64&&a&&a.scrtAuthorized},[s,c,m,d,k,x,a,r,u,l]}class mt extends Y{constructor(t){super();Z(this,t,_t,ft,ee,{})}}new mt({target:document.body,props:{}});
