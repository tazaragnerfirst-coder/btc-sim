const INT={F:0.001,MAX:3,ex:"mexc",IV:{"1m":["1",6e4],"5m":["5",3e5],"15m":["15",9e5],"1h":["60",36e5]}};
INT.j=async(bases,p)=>{let e;for(const b of bases){try{const r=await fetch(b+p);if(r.ok)return await r.json();e=r.status}catch(x){e=x}}throw e};
const N=(t,o,h,l,c)=>({t:+t,o:+o,h:+h,l:+l,c:+c});
INT.V={
mexc:{name:"MEXC",b:["https://api.mexc.com"],sym:s=>s,m:{"1m":"1m","5m":"5m","15m":"15m","1h":"60m"},
price:async function(s){const r=await INT.j(this.b,`/api/v3/ticker/price?symbol=${this.sym(s)}`);if(!(+r.price>0))throw r.msg||"no price";return +r.price},
klines:async function(s,iv,from){const ms=INT.IV[iv][1],o=new Map();let st=from;for(let g=0;g<40;g++){const r=await INT.j(this.b,`/api/v3/klines?symbol=${this.sym(s)}&interval=${this.m[iv]}&startTime=${st}&limit=1000`);if(!Array.isArray(r)||!r.length)break;r.forEach(x=>o.set(+x[0],N(x[0],x[1],x[2],x[3],x[4])));const last=+r[r.length-1][0];if(r.length<1000||last+ms>Date.now())break;st=last+ms}return[...o.values()].sort((a,b)=>a.t-b.t)}},
gate:{name:"Gate",b:["https://api.gateio.ws"],sym:s=>s.replace("USDT","_USDT"),m:{"1m":"1m","5m":"5m","15m":"15m","1h":"1h"},
price:async function(s){const r=await INT.j(this.b,`/api/v4/spot/tickers?currency_pair=${this.sym(s)}`);const p=+(r[0]&&r[0].last);if(!(p>0))throw r.message||"no price";return p},
klines:async function(s,iv,from){const ms=INT.IV[iv][1],o=new Map(),now=Date.now();for(let t=from;t<now;t+=999*ms){const to=Math.min(now,t+999*ms),r=await INT.j(this.b,`/api/v4/spot/candlesticks?currency_pair=${this.sym(s)}&interval=${this.m[iv]}&from=${Math.floor(t/1e3)}&to=${Math.floor(to/1e3)}`);if(!Array.isArray(r))throw r.message||"bad reply";r.forEach(x=>o.set(+x[0]*1e3,N(+x[0]*1e3,x[5],x[3],x[4],x[2])))}return[...o.values()].sort((a,b)=>a.t-b.t)}},
bybit:{name:"Bybit",b:["https://api.bybit.com","https://api.bytick.com"],sym:s=>s,m:{"1m":"1","5m":"5","15m":"15","1h":"60"},
get:async function(p){const j=await INT.j(this.b,p);if(j.retCode!==0)throw j.retMsg;return j.result},
price:async function(s){return +(await this.get(`/v5/market/tickers?category=spot&symbol=${this.sym(s)}`)).list[0].lastPrice},
klines:async function(s,iv,from){const o=new Map();let end=Date.now();for(let g=0;g<40;g++){const r=await this.get(`/v5/market/kline?category=spot&symbol=${this.sym(s)}&interval=${this.m[iv]}&start=${from}&end=${end}&limit=1000`),l=r.list||[];if(!l.length)break;l.forEach(x=>o.set(+x[0],N(x[0],x[1],x[2],x[3],x[4])));const old=+l[l.length-1][0];if(l.length<1000||old<=from)break;end=old-1}return[...o.values()].sort((a,b)=>a.t-b.t)}}};
INT.price=s=>INT.V[INT.ex].price(s);
INT.klines=(s,iv,from)=>INT.V[INT.ex].klines(s,iv,from);
// try exchanges in order until INTER and BTC prices both come back
INT.detect=async(list)=>{const errs=[];for(const k of list){INT.ex=k;try{const [a,b]=await Promise.all([INT.price("INTERUSDT"),INT.price("BTCUSDT")]);return{ex:k,pi:a,pb:b,errs}}catch(e){errs.push(INT.V[k].name+": "+(e&&e.message||e))}}return{ex:null,errs}};
// closed bars after start; a bar with no trades keeps the last known price
INT.grid=(KI,KB,pi0,pb0,first,ms,now)=>{const mi=new Map(KI.map(x=>[x.t,x])),mb=new Map(KB.map(x=>[x.t,x]));let ci=pi0,cb=pb0;const out=[];
for(let t=first;t+ms<=now;t+=ms){const a=mi.get(t),b=mb.get(t);const po=ci;if(a)ci=a.c;if(b)cb=b.c;out.push({t,pi:ci,pb:cb,o:a?a.o:po,h:a?a.h:ci,l:a?a.l:ci,c:ci})}return out};
// rule: R = INTER/BTC. dR% = (R - Rprev)/Rprev*100. dR>=X -> long INTER, dR<=-X -> short INTER. Rprev resets at every signal.
// each step = A USDT converted to INTER at that moment's price; same direction adds a step (max 3); opposite signal closes all and flips.
INT.run=(bars,R0,A,X)=>{const F=INT.F;let bal=A,side=0,ent=[],rp=R0,base=A;const ev=[];
const fl=x=>ent.reduce((a,e)=>a+A/e*(side>0?x-e:e-x),0),xf=x=>F*A*ent.reduce((a,e)=>a+x/e,0);
const ex=(t,x,R,d)=>{const n=ent.length,q=ent.reduce((a,e)=>a+A/e,0);bal+=fl(x)-xf(x);ev.push({t,k:"out",side,x,n,q,pnl:bal-base,R,d});ent=[];side=0};
const en=(t,x,s,R,d,k)=>{if(k=="in"){side=s;ent=[x];base=bal}else ent.push(x);bal-=A*F;ev.push({t,k,side,x,n:ent.length,q:A/x,R,d})};
for(const b of bars){const R=b.pi/b.pb,d=(R-rp)/rp*100,x=b.pi,sg=d>=X?1:d<=-X?-1:0;
if(sg){if(side==0)en(b.t,x,sg,R,d,"in");else if(side==sg){if(ent.length<INT.MAX)en(b.t,x,sg,R,d,"add")}else{ex(b.t,x,R,d);en(b.t,x,sg,R,d,"in")}rp=R}}
return{ev,bal,side,ent,rp}};
