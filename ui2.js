let PL=[];
const pn=(e,A)=>e.pnl/(e.n*A)*100;
const q4=x=>(x<1?x.toFixed(6):x.toFixed(4)),stp=(e,lp)=>{const A=d.amt,g=A/e*(R.side>0?lp-e:e-lp);return g-A*SIM.F-SIM.F*A*lp/e},mv=(e,lp)=>(R.side>0?lp/e-1:1-lp/e);
const res=(e,j,jo)=>{if(e.k=="out")return `<td class="${cl(e.pnl)}">${sg(e.pnl)} USDT (${sg(pn(e,d.amt))}%)</td>`;
if(j<=jo||!R.side)return "<td></td>";const lp=live||K[K.length-1].c,m=mv(e.x,lp),q=stp(e.x,lp);return `<td class="${cl(q)}">OPEN ${sg(q)} USDT (${sg(m*100)}% move)</td>`};
function table(){R.ev.forEach(e=>{e.pct=(e.x/e.ref-1)*100});
const mk=[{time:K[SIM.VW+199].t,position:"inBar",shape:"circle",color:"#f0b90b",text:"START "+f(d.p0,0)}];
R.ev.forEach(e=>{const t=K[SIM.VW+e.i].t;if(e.k=="out")mk.push({time:t,position:e.side>0?"aboveBar":"belowBar",shape:"circle",color:e.pnl>=0?"#2ebd85":"#f6465d",text:"EXIT "+sg(e.pnl)+" ("+sg(pn(e,d.amt))+"%)"});
else mk.push({time:t,position:e.side>0?"belowBar":"aboveBar",shape:e.side>0?"arrowUp":"arrowDown",color:e.side>0?"#2ebd85":"#f6465d",text:(e.side>0?"BUY ":"SELL ")+(e.n>1?"+"+e.n+" ":"")+f(e.x,0)})});
cs.setMarkers(mk);tbl()}
function tbl(){const jo=R.ev.map(x=>x.k).lastIndexOf("out"),rows=R.ev.map((e,j)=>{const t=new Date((K[SIM.VW+e.i].t+d.ms/1000)*1e3).toISOString().slice(5,16).replace("T"," ");
const ty=e.k=="out"?"Close "+(e.side>0?"long (sell ":"short (buy back ")+q4(e.q)+" BTC)":(e.side>0?"Buy":"Sell short")+(e.n>1?" step "+e.n:"")+" · "+q4(e.q)+" BTC";
return `<tr><td>${t}</td><td>${ty}</td><td>${f(e.x)}</td><td>V ${sg(e.dv)}% (price ${sg(e.pct)}% vs ${e.rl} ${f(e.ref)})</td>${res(e,j,jo)}</tr>`}).reverse().join("");
$("tr").innerHTML="<tr><th>Time (UTC)</th><th>Action</th><th>Price</th><th>Move that triggered it</th><th>Result</th></tr>"+(rows||"<tr><td colspan=5 class=m>No trades yet.</td></tr>")}
function panel(){if(!R)return;const A=d.amt,X=R.sa[R.sa.length-1]*100,fe=2*SIM.F*100,gp=2*(d.gap||0)*100,vl=X-fe-gp,lp=live||K[K.length-1].c,L=R.side>0,op=R.side?R.ent.reduce((a,e)=>a+A/e*(L?lp-e:e-lp),0)-SIM.F*A*R.ent.reduce((a,e)=>a+lp/e,0):0,qt=R.ent.reduce((a,e)=>a+A/e,0),W=R.ev.filter(e=>e.k=="out"&&e.pnl>=0).length,Ls=R.ev.filter(e=>e.k=="out"&&e.pnl<0).length,val=R.eq+op,pl=val-A,pc=x=>sg((x/lp-1)*100)+"%";
const pr=R.pr,Vp=A/pr,Vn=A/lp,dv=(pr/lp-1)*100,lg=pr/(1+X/100),st=pr/(1-X/100),n=R.ent.length;
PL.forEach(l=>cs.removePriceLine(l));PL=[];const ln=(p,t,c)=>PL.push(cs.createPriceLine({price:p,color:c,lineWidth:1,lineStyle:2,axisLabelVisible:true,title:t}));
ln(lg,"LONG","#2ebd85");ln(st,"SHORT","#f6465d");if(R.side)ln(R.ent.reduce((q,e)=>q+e,0)/n,"ENTRY, P/L "+sg(op)+" USDT",op>=0?"#2ebd85":"#f6465d");
const what=(dir)=>!R.side?"opens "+(dir>0?"long":"short"):R.side==dir?(n<3?"adds step "+(n+1):"max 3 steps, only resets the reference"):"closes all and flips to "+(dir>0?"long":"short");
$("pn").innerHTML=`<h3 class="${L?"g":R.side<0?"r":"m"}">${R.side?(L?"Long ":"Short ")+n+"/3":"Flat"}</h3>
<p class="m">${R.side?(L?"Bought":"Sold short")+" "+q4(qt)+" BTC in total. Each step = "+f(A)+" USDT at that moment's price.":"No position yet. Waiting for V to move "+f(X)+"%."}</p>
${R.ent.map((e,i)=>`<p><span class="m">Step ${i+1}: ${q4(A/e)} BTC at</span>${f(e)}<b class="${cl(A/e*(L?lp-e:e-lp))}">${sg(A/e*(L?lp-e:e-lp))} USDT (${sg((L?lp/e-1:1-lp/e)*100)}%)</b></p>`).join("")}
<hr style="border:0;border-top:1px solid var(--ln)">
<p><span class="m">BTC price</span><b>${f(lp)}</b></p>
<p><span class="m">V previous (${f(A)} ÷ ${f(pr)})</span>${q4(Vp)} BTC</p><p><span class="m">V now (${f(A)} ÷ price)</span>${q4(Vn)} BTC</p>
<p><span class="m">ΔV% live</span><b class="${cl(dv)}">${sg(dv)}%</b></p>
<p><b class="g">LONG when price ≤ ${f(lg)}</b><span>${pc(lg)}</span></p><p class="m">${what(1)}</p>
<p><b class="r">SHORT when price ≥ ${f(st)}</b><span>${pc(st)}</span></p><p class="m">${what(-1)}</p>
<hr style="border:0;border-top:1px solid var(--ln)">
<p><span class="m">Start</span>${f(A)} USDT = ${q4(A/d.p0)} BTC at ${f(d.p0)}</p>
<p><span class="m">Equity</span><b class="${cl(pl)}">${f(val)}</b></p><p><span class="m">Profit / loss</span><b class="${cl(pl)}">${sg(pl)} (${sg(pl/A*100)}%)</b></p>
<p><span class="m">Closed trades</span>${sg(R.eq-A)}</p><p><span class="m">Open position</span><b class="${cl(op)}">${sg(op)}</b></p>
<p><span class="m">Winning / losing trades</span><b><span class="g">${W}</span> / <span class="r">${Ls}</span></b></p>
<p><span class="m">Just holding BTC</span>${f(A*lp/d.p0)}</p>
<p class="m">Rule: V = amount ÷ BTC price. V up ${f(X)}% from the previous signal = LONG, V down ${f(X)}% = SHORT; the reference resets at every signal. x% is calculated, not typed: fee ${f(fe)}% + gap ${f(gp,4)}% + volatility ${f(vl)}% = ${f(X)}% (round trip fee and gap, plus the average move per bar). Decisions use closed ${d.iv} bars. Fee 0.1% included, slippage and funding not. Not backtested.</p>`;
tbl();say(`Running since ${new Date(d.sh).toISOString().slice(5,16).replace("T"," ")} UTC. Updates about every 2 seconds. ${R.ev.length} trade events so far.`)}
