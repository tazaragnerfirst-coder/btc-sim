const SIM={F:0.001,W:8760,VW:168,S:[.05,.08,.10,.12,.15],B:["https://api.binance.com","https://data-api.binance.vision"]};
SIM.get=async p=>{let e;for(const b of SIM.B){try{const r=await fetch(b+p);if(r.ok)return await r.json();e=r.status}catch(x){e=x}}throw e};
SIM.klines=async(iv,ms,from)=>{let o=[],t=from;for(;;){const d=await SIM.get(`/api/v3/klines?symbol=BTCUSDT&interval=${iv}&startTime=${t}&limit=1000`);if(!d.length)break;o=o.concat(d);t=d[d.length-1][0]+ms;if(d.length<1000)break}const n=Date.now();return o.filter(x=>x[6]<n).map(x=>({t:x[0]/1000,o:+x[1],h:+x[2],l:+x[3],c:+x[4]}))};
SIM.vol=p=>{const c=[0];for(let i=0;i<p.length;i++)c.push(c[i]+(i?Math.abs(Math.log(p[i]/p[i-1])):0));return p.map((_,i)=>{const a=Math.max(0,i-SIM.VW+1);return(c[i+1]-c[a])/(i-a+1)})};
// Rule: V = amount / BTC price (how much BTC the amount buys). dV% = (V_now - V_prev)/V_prev*100 = (P_prev/P_now - 1)*100.
// dV% >= X -> LONG, dV% <= -X -> SHORT. V_prev (P_prev) resets at every signal. Each step = A USDT converted to BTC at that moment's price.
// Same direction again adds a step (max 3), opposite signal closes everything and flips.
SIM.run=(p,X,A=1)=>{const n=200,N=p.length,F=SIM.F,out=new Array(N).fill(A),rec=new Array(N).fill(0),ev=[];
let bal=A,side=0,ent=[],pr=p[n-1],rl="start price",base=A;
const fl=x=>ent.reduce((a,e)=>a+A/e*(side>0?x-e:e-x),0),xf=x=>F*A*ent.reduce((a,e)=>a+x/e,0);
const ex=(i,x,dv)=>{const nn=ent.length,qt=ent.reduce((a,e)=>a+A/e,0);bal+=fl(x)-xf(x);ev.push({i,k:"out",side,x,n:nn,q:qt,pnl:bal-base,ref:pr,rl,dv});ent=[];side=0};
const en=(i,x,s,dv,k)=>{if(k=="in"){side=s;ent=[x];base=bal}else ent.push(x);bal-=A*F;ev.push({i,k,side,x,n:ent.length,q:A/x,ref:pr,rl,dv})};
for(let i=n;i<N;i++){const x=p[i],dv=(pr/x-1)*100,sg=dv>=X?1:dv<=-X?-1:0;
if(sg){if(side==0)en(i,x,sg,dv,"in");else if(side==sg){if(ent.length<3)en(i,x,sg,dv,"add")}else{ex(i,x,dv);en(i,x,sg,dv,"in")}pr=x;rl="previous signal"}
out[i]=bal+(side?fl(x)-xf(x):0);rec[i]=side*ent.length}
return{out,rec,ev,eq:bal,side,ent,pr,rl}};
SIM.series=(K,d)=>{const pf=K.map(x=>x.c);pf[SIM.VW+199]=d.p0;const p=pf.slice(SIM.VW);return{p,...SIM.run(p,d.X,d.amt)}};
