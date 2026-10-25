const INT={F:0.001,MAX:3,B:["https://api.bybit.com","https://api.bytick.com"],IV:{"1m":["1",6e4],"5m":["5",3e5],"15m":["15",9e5],"1h":["60",36e5]}};
INT.get=async p=>{let e;for(const b of INT.B){try{const r=await fetch(b+p);if(r.ok){const j=await r.json();if(j.retCode===0)return j.result;e=j.retMsg}else e=r.status}catch(x){e=x}}throw e};
INT.price=async s=>+(await INT.get(`/v5/market/tickers?category=spot&symbol=${s}`)).list[0].lastPrice;
INT.klines=async(s,iv,from)=>{const [ic]=INT.IV[iv],o=new Map();let end=Date.now();
for(let g=0;g<40;g++){const r=await INT.get(`/v5/market/kline?category=spot&symbol=${s}&interval=${ic}&start=${from}&end=${end}&limit=1000`),l=r.list||[];if(!l.length)break;
l.forEach(x=>o.set(+x[0],{t:+x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]}));const old=+l[l.length-1][0];if(l.length<1000||old<=from)break;end=old-1}
return[...o.values()].sort((a,b)=>a.t-b.t)};
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
