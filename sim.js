const SIM={F:0.001,W:8760,VW:168,S:[.05,.08,.10,.12,.15],B:["https://api.binance.com","https://data-api.binance.vision"]};
SIM.get=async p=>{let e;for(const b of SIM.B){try{const r=await fetch(b+p);if(r.ok)return await r.json();e=r.status}catch(x){e=x}}throw e};
SIM.klines=async(iv,ms,from)=>{let o=[],t=from;for(;;){const d=await SIM.get(`/api/v3/klines?symbol=BTCUSDT&interval=${iv}&startTime=${t}&limit=1000`);if(!d.length)break;o=o.concat(d);t=d[d.length-1][0]+ms;if(d.length<1000)break}const n=Date.now();return o.filter(x=>x[6]<n).map(x=>({t:x[0]/1000,o:+x[1],h:+x[2],l:+x[3],c:+x[4]}))};
SIM.vol=p=>{const c=[0];for(let i=0;i<p.length;i++)c.push(c[i]+(i?Math.abs(Math.log(p[i]/p[i-1])):0));return p.map((_,i)=>{const a=Math.max(0,i-SIM.VW+1);return(c[i+1]-c[a])/(i-a+1)})};
SIM.run=(p,sa)=>{const n=200,N=p.length,F=SIM.F,out=new Array(N).fill(1),rec=new Array(N).fill(0),ev=[],q=[0];for(let i=0;i<N;i++)q.push(q[i]+p[i]);
let eq=1,side=0,ent=[],ext=0,lo=p[n-1],hi=p[n-1];
const fl=(x)=>ent.reduce((a,e)=>a+(side>0?x/e-1:e/x-1),0)/3;
const ex=(i,x)=>{const o=eq;eq*=1+fl(x)-ent.length/3*2*F;ev.push({i,k:"out",side,x,pnl:eq-o,ref:ext})};
const en=(i,x,s,r)=>{side=s;ent=[x];ext=x;ev.push({i,k:"in",side,x,n:1,ref:r})};
for(let i=n;i<N;i++){const x=p[i],m=(q[i+1]-q[i+1-n])/n,up=x>m,dn=x<m,s=sa[i];
if(side==0){lo=Math.min(lo,x);hi=Math.max(hi,x);if(x>=lo*(1+s)&&up)en(i,x,1,lo);else if(x<=hi*(1-s)&&dn)en(i,x,-1,hi)}
else if(side==1){ext=Math.max(ext,x);if(x<=ext*(1-s)){ex(i,x);if(dn)en(i,x,-1,ext);else{side=0;ent=[];lo=hi=x}}else if(ent.length<3&&x>=ent[ent.length-1]*(1+s)){const r=ent[ent.length-1];ent.push(x);ev.push({i,k:"add",side,x,n:ent.length,ref:r})}}
else{ext=Math.min(ext,x);if(x>=ext*(1+s)){ex(i,x);if(up)en(i,x,1,ext);else{side=0;ent=[];lo=hi=x}}else if(ent.length<3&&x<=ent[ent.length-1]*(1-s)){const r=ent[ent.length-1];ent.push(x);ev.push({i,k:"add",side,x,n:ent.length,ref:r})}}
out[i]=side?eq*(1+fl(x)):eq;rec[i]=side*ent.length}
return{out,rec,ev,eq,side,ent,lo,hi,ext}};
SIM.sa=(v,c,sc)=>v.map(x=>Math.min(.30*sc,Math.max(.02*sc,c*x/SIM.md)));
SIM.train=(p,sc,k)=>{const v=SIM.vol(p),a=v.slice(200,k+1).sort((x,y)=>x-y),md=(a[(a.length-1)>>1]+a[a.length>>1])/2;let b=null;SIM.md=md;
for(const c0 of SIM.S){const c=c0*sc,o=SIM.run(p,SIM.sa(v,c,sc)).out;let mx=0,pk=0;for(let i=200;i<=k;i++){pk=Math.max(pk,o[i]);mx=Math.max(mx,1-o[i]/pk)}
const s=Math.log(Math.max(o[k],1e-9))/(mx+.1);if(!b||s>b.s)b={s,c,md}}return b};
SIM.series=(K,d)=>{SIM.md=d.md;const pf=K.map(x=>x.c);pf[SIM.VW+199]=d.p0;const p=pf.slice(SIM.VW),sa=SIM.sa(SIM.vol(pf).slice(SIM.VW),d.c,d.sc);return{p,sa,...SIM.run(p,sa)}};
