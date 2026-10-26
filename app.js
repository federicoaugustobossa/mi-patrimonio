/* ============ Utilidades ============ */
const TZ='America/Argentina/Cordoba';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fARS=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2});
const fUSD=new Intl.NumberFormat('es-AR',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});
const fNum=new Intl.NumberFormat('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
const money=(c,m='ARS')=>(m==='USD'?fUSD:fARS).format((c||0)/100);
function moneyH(c,m='ARS'){const s=money(c,m);const i=s.lastIndexOf(',');return i<0?esc(s):esc(s.slice(0,i))+'<small>'+esc(s.slice(i))+'</small>';}
function today(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return p;}
function nowTime(){return new Intl.DateTimeFormat('es-AR',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}
const ym=d=>d.slice(0,7);
function addMonths(m,n){let[y,mo]=m.split('-').map(Number);mo+=n;while(mo>12){mo-=12;y++}while(mo<1){mo+=12;y--}return y+'-'+String(mo).padStart(2,'0');}
function monthName(m){const[y,mo]=m.split('-').map(Number);const t=new Date(y,mo-1,15).toLocaleDateString('es-AR',{month:'long',year:'numeric'});return t.charAt(0).toUpperCase()+t.slice(1);}
function dmy(d){if(!d)return'';const[y,m,dd]=d.split('-');return dd+'/'+m+'/'+y;}
function dayLabel(d){const t=today();if(d===t)return'Hoy';const y=new Date(t+'T12:00');y.setDate(y.getDate()-1);if(d===y.toISOString().slice(0,10))return'Ayer';const dt=new Date(d+'T12:00');return dt.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});}
function lastDay(m){const[y,mo]=m.split('-').map(Number);return m+'-'+String(new Date(y,mo,0).getDate()).padStart(2,'0');}
function monthsBetween(a,b){const[y1,m1]=a.split('-').map(Number);const[y2,m2]=b.split('-').map(Number);return (y2-y1)*12+(m2-m1);}
/* Importe en formato argentino → centavos enteros. Nunca punto flotante para guardar. */
function parseMonto(str){
  if(str==null)return NaN;let s=String(str).trim().toLowerCase().replace(/\s|\$|ars|usd|u\$s/g,'');
  let mult=1;if(/k$/.test(s)){mult=1000;s=s.slice(0,-1)}else if(/mil$/.test(s)){mult=1000;s=s.slice(0,-3)}
  if(!s)return NaN;
  if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.');}
  else if(/^\d{1,3}(\.\d{3})+$/.test(s)){s=s.replace(/\./g,'');}
  if(!/^\d+(\.\d+)?$/.test(s))return NaN;
  const [ent,dec='']=s.split('.');const d=(dec+'00').slice(0,2);const extra=dec.length>2&&Number(dec[2])>=5?1:0;
  return (Number(ent)*100+Number(d)+extra)*mult;
}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

/* ============ Datos por defecto ============ */
const CATS_DEF=[
 {id:'alim',n:'Alimentación',k:'gasto',c:'#d9822b',s:['Supermercado','Carnicería','Verdulería','Panadería','Almacén','Delivery','Restaurantes','Bares','Cafeterías','Kiosco y snacks','Bebidas','Otros']},
 {id:'viv',n:'Vivienda',k:'gasto',c:'#3b7dd8',s:['Alquiler','Expensas','Electricidad','Gas','Agua','Internet','Telefonía','Mantenimiento y reparaciones','Muebles y electrodomésticos','Limpieza','Seguridad','Mejoras','Otros']},
 {id:'auto',n:'Auto y transporte',k:'gasto',c:'#7a5bd1',s:['Combustible','Seguro','Service y reparaciones','Repuestos y neumáticos','Lavado','Estacionamiento','Peajes','Transporte público','Taxi y apps','Alquiler de vehículos','Otros']},
 {id:'comp',n:'Compras',k:'gasto',c:'#c4487a',s:['Electrónica y computación','Herramientas','Accesorios','Hogar','Ropa y calzado','Hobbies','Otras']},
 {id:'serv',n:'Servicios',k:'gasto',c:'#0e8fb3',s:['Apple / iCloud','Google / Drive','Claude / IA','Software y apps','Profesionales','Otros']},
 {id:'salud',n:'Salud y cuidado',k:'gasto',c:'#2a9d8f',s:['Consultas','Farmacia','Estudios','Odontología','Peluquería','Higiene y cuidado','Otros']},
 {id:'dep',n:'Deportes',k:'gasto',c:'#ef6f3c',s:['Gimnasio','Club y cuotas','Clases y entrenador','Equipamiento','Torneos e inscripciones','Alquiler de canchas','Otros']},
 {id:'ocio',n:'Ocio y salidas',k:'gasto',c:'#e0b220',s:['Cine y espectáculos','Videojuegos','Streaming y suscripciones','Viajes y turismo','Actividades','Otros']},
 {id:'edu',n:'Educación',k:'gasto',c:'#5a8f29',s:['Cursos y certificaciones','Libros y material','Otros']},
 {id:'imp',n:'Impuestos',k:'gasto',c:'#8c6d4f',s:['ARCA','Rentas provincia','Municipalidad','Patente','Inmobiliario','Otros impuestos']},
 {id:'fin',n:'Gastos financieros',k:'gasto',c:'#b4372f',s:['Intereses','Comisiones bancarias','Mantenimiento de cuenta','Seguros','Otros']},
 {id:'fam',n:'Familia y otros',k:'gasto',c:'#6b7f8c',s:['Regalos','Donaciones','Ayuda familiar','Mascotas','Varios']},
 {id:'trab',n:'Trabajo',k:'ingreso',c:'#1d7a45',s:['Sueldo','Aguinaldo','Honorarios','Bonos']},
 {id:'neg',n:'Negocio',k:'ingreso',c:'#2a9d8f',s:['Ventas','Otros']},
 {id:'rend',n:'Rendimientos',k:'ingreso',c:'#3b7dd8',s:['Intereses','Dividendos','Otros']},
 {id:'alq',n:'Alquileres cobrados',k:'ingreso',c:'#7a5bd1',s:[]},
 {id:'oing',n:'Otros ingresos',k:'ingreso',c:'#6b7f8c',s:['Regalos recibidos','Ventas de cosas usadas','Otros']},
];
const REGLAS_DEF=[
 ['carrefour','alim','Supermercado'],['coto','alim','Supermercado'],['jumbo','alim','Supermercado'],['disco','alim','Supermercado'],['vea','alim','Supermercado'],['changomas','alim','Supermercado'],['supermercado','alim','Supermercado'],['super ','alim','Supermercado'],
 ['pedidosya','alim','Delivery'],['pedidos ya','alim','Delivery'],['rappi','alim','Delivery'],['delivery','alim','Delivery'],
 ['cafe','alim','Cafeterías'],['kiosco','alim','Kiosco y snacks'],['carniceria','alim','Carnicería'],['verduleria','alim','Verdulería'],['panaderia','alim','Panadería'],
 ['ypf','auto','Combustible'],['shell','auto','Combustible'],['axion','auto','Combustible'],['nafta','auto','Combustible'],['peaje','auto','Peajes'],['estacionamiento','auto','Estacionamiento'],
 ['uber','auto','Taxi y apps'],['cabify','auto','Taxi y apps'],['didi','auto','Taxi y apps'],['taxi','auto','Taxi y apps'],['sube','auto','Transporte público'],['colectivo','auto','Transporte público'],['seguro del auto','auto','Seguro'],['patente','imp','Patente'],
 ['epec','viv','Electricidad'],['ecogas','viv','Gas'],['aguas cordobesas','viv','Agua'],['expensas','viv','Expensas'],['alquiler','viv','Alquiler'],['internet','viv','Internet'],
 ['arca','imp','ARCA'],['afip','imp','ARCA'],['monotributo','imp','ARCA'],['ganancias','imp','ARCA'],['bienes personales','imp','ARCA'],['rentas','imp','Rentas provincia'],['ingresos brutos','imp','Rentas provincia'],['municipalidad','imp','Municipalidad'],['inmobiliario','imp','Inmobiliario'],
 ['apple','serv','Apple / iCloud'],['icloud','serv','Apple / iCloud'],['google one','serv','Google / Drive'],['drive','serv','Google / Drive'],['claude','serv','Claude / IA'],['anthropic','serv','Claude / IA'],['chatgpt','serv','Claude / IA'],['openai','serv','Claude / IA'],
 ['netflix','ocio','Streaming y suscripciones'],['spotify','ocio','Streaming y suscripciones'],['disney','ocio','Streaming y suscripciones'],['youtube','ocio','Streaming y suscripciones'],['cine','ocio','Cine y espectáculos'],
 ['farmacia','salud','Farmacia'],['gimnasio','dep','Gimnasio'],['gym','dep','Gimnasio'],['club','dep','Club y cuotas'],['padel','dep','Alquiler de canchas'],['cancha','dep','Alquiler de canchas'],['peluqueria','salud','Peluquería'],
 ['sueldo','trab','Sueldo'],['aguinaldo','trab','Aguinaldo'],
].map(([p,cat,sub])=>({p,cat,sub}));
const TIPOS_CUENTA={efectivo:'Efectivo',banco:'Cuenta bancaria',billetera:'Billetera digital',tarjeta:'Tarjeta de crédito',inversion:'Inversión / remunerada',deuda:'Préstamo / deuda',otro:'Otra'};
const PASIVO=t=>t==='tarjeta'||t==='deuda';
const CATS_VER=2;
/* Migración v1→v2: [cat vieja, sub vieja] → [cat nueva, sub nueva] */
const MIG2=[['auto','Patente','imp','Patente'],['viv','Impuesto inmobiliario','imp','Inmobiliario'],['viv','Tasas municipales','imp','Municipalidad'],
 ['salud','Gimnasio y deportes','dep','Gimnasio'],['edu','Software','serv','Software y apps'],['imp','Impuestos nacionales','imp','ARCA'],
 ['imp','Impuestos provinciales','imp','Rentas provincia'],['imp','Honorarios profesionales','serv','Profesionales'],['imp','Trámites','imp','Otros impuestos'],['imp','Otros','imp','Otros impuestos']];
const migSub=(cat,sub)=>{const r=MIG2.find(([c,s])=>c===cat&&s===sub);return r?{cat:r[2],sub:r[3]}:null;};
function migrarCats(){
  const c=S.cfg;const movsCambiados=[];
  if((c.catsVer||1)<CATS_VER){
    // categorías: las de fábrica toman la nueva definición; se conservan las subcategorías que agregó el usuario
    const viejasSubs=new Set(['Impuesto inmobiliario','Tasas municipales','Patente','Gimnasio y deportes','Software','Impuestos nacionales','Impuestos provinciales','Honorarios profesionales','Trámites']);
    const cats=CATS_DEF.map(d=>{const u=c.cats.find(x=>x.id===d.id);if(!u)return structuredClone(d);
      const extra=u.s.filter(s=>!d.s.includes(s)&&!viejasSubs.has(s)&&!(d.id==='imp'&&s==='Otros'));return{...d,n:d.id==='imp'?d.n:u.n,c:u.c,s:[...d.s,...extra]};});
    for(const u of c.cats)if(!CATS_DEF.some(d=>d.id===u.id))cats.push(u);
    const reglas=c.reglas.map(r=>{const m=migSub(r.cat,r.sub);return m?{...r,...m}:r;});
    for(const d of REGLAS_DEF)if(!reglas.some(r=>r.p===d.p))reglas.push(d);
    const memoria={};for(const[k,v]of Object.entries(c.memoria||{})){const m=migSub(v.cat,v.sub);memoria[k]=m||v;}
    saveCfg({cats,reglas,memoria,catsVer:CATS_VER});
  }
  const ahora=new Date().toISOString();
  for(const m of S.movs){const n=migSub(m.cat,m.sub);if(!n)continue;
    const doc={...m,...n,editado:ahora,historial:[...(m.historial||[]),{t:ahora,a:`Reclasificado por cambio de categorías: ${m.sub} → ${catById(n.cat)?.n} / ${n.sub}`}].slice(-30)};
    upsertLocal(doc);movsCambiados.push(doc);}
  for(const d of movsCambiados)persist('movimientos',d);
  if(movsCambiados.length)toast(movsCambiados.length+' movimientos reclasificados a las nuevas categorías');
}
const DEF_CFG={catsVer:CATS_VER,nombre:'Mi Patrimonio',cats:CATS_DEF,reglas:REGLAS_DEF,memoria:{},presu:{total:0,cat:{}},favCats:[]};

/* ============ Estado ============ */
const S={status:'loading',cfg:structuredClone(DEF_CFG),cfgExists:false,cuentas:[],movs:[],cotiz:[],cotizMan:[],cotizBna:[],lastMov:null,lastSync:null,syncErr:'',
  view:(()=>{try{return localStorage.getItem('mp_view')||'inicio'}catch(e){return'inicio'}})(),
  month:ym(today()),filt:{q:'',tipo:'',cat:'',cuenta:''},sess:{}};
let SB=null,USER=null,CONF=null;
const newId=()=>(crypto.randomUUID?crypto.randomUUID():uid()+uid());
const cfg=()=>S.cfg;
const catById=id=>cfg().cats.find(c=>c.id===id);
const cuentaById=id=>S.cuentas.find(c=>c.id===id);
const activos=()=>S.movs.filter(m=>m.estado!=='anulado');

/* ============ Cotizaciones (dólar oficial venta BNA) ============ */
function rateAt(fecha){
  const list=S.cotiz.filter(c=>c.fecha<=fecha).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(list.length)return {v:list[0].venta,fecha:list[0].fecha,exacta:true};
  const any=[...S.cotiz].sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
  return any?{v:any.venta,fecha:any.fecha,exacta:false}:null;
}
function toARS(c,m,fecha){if(m!=='USD')return c;const r=rateAt(fecha);return r?Math.round(c*r.v):null;}
const ultimaCotiz=()=>[...S.cotiz].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0]||null;

/* ============ Contabilidad ============ */
function saldo(cta,hasta){
  let s=cta.saldoIni||0;
  for(const m of activos()){ if(hasta&&m.fecha>hasta)continue; if(m.fecha<(cta.fechaIni||'0000'))continue;
    for(const l of m.lineas||[]) if(l.cuenta===cta.id) s+=l.monto; }
  return s;
}
function patrimonio(hasta){
  const f=hasta||today();let total=0,faltaCotiz=false,act=0,pas=0;
  for(const c of S.cuentas){ if(c.archivada)continue; if((c.fechaIni||'0000')>f)continue;
    const s=saldo(c,f);const v=toARS(s,c.moneda,f);if(v==null){faltaCotiz=true;continue}
    total+=v; if(v>=0)act+=v; else pas+=v; }
  return {total,act,pas,faltaCotiz};
}
/* Resultado del mes: gastos netos de devoluciones; transferencias y ajustes excluidos. */
function resumen(m){
  let ing=0,gas=0,sinCot=0,impul=0,impN=0;const porCat={},porSem={},impCom={};
  for(const x of activos()){ if(ym(x.fecha)!==m)continue;
    const v=toARS(x.monto,x.moneda,x.fecha); if(v==null){sinCot++;continue}
    if(x.tipo==='ingreso')ing+=v;
    else if(x.tipo==='gasto'||x.tipo==='reembolso'){
      const sg=x.tipo==='gasto'?v:-v; gas+=sg; const k=x.cat||'_sin'; porCat[k]=(porCat[k]||0)+sg;
      const d=new Date(x.fecha+'T12:00'); const w=weekIdx(x.fecha); porSem[w]=(porSem[w]||0)+sg;
      if(x.impulsiva&&x.tipo==='gasto'){impul+=v;impN++;const k2=x.comercio||'Sin comercio';impCom[k2]=(impCom[k2]||0)+v;}
    }
  }
  return {ing,gas,res:ing-gas,tasa:ing>0?(ing-gas)/ing:null,porCat,porSem,sinCot,impul,impN,impCom};
}
function weekIdx(f){const[y,m,d]=f.split('-').map(Number);const first=new Date(y,m-1,1);const off=(first.getDay()+6)%7;return Math.floor((d-1+off)/7);}
function cuotasPend(cta){
  const t=today();let tot=0;const items=[];
  for(const m of activos()){ if(m.tipo!=='gasto'||(m.cuotas||1)<2)continue; if(!(m.lineas||[]).some(l=>l.cuenta===cta.id))continue;
    const pagadas=Math.max(0,Math.min(m.cuotas,monthsBetween(ym(m.fecha),ym(t))));const rest=m.cuotas-pagadas;
    if(rest>0){const cu=Math.round(m.monto/m.cuotas);tot+=cu*rest;items.push({m,rest,cu});}}
  return {tot,items};
}

/* ============ Iconos ============ */
const IC={
 inicio:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 movs:'<path d="M4 6h16M4 12h16M4 18h10"/>',
 cuentas:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
 presu:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6 6"/>',
 ajustes:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.2 4V3.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
};
const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const VIEWS=[['inicio','Inicio'],['movs','Movimientos'],['presu','Presupuestos'],['cuentas','Cuentas'],['ajustes','Ajustes']];

/* ============ Render principal ============ */
function render(){
  document.title=cfg().nombre||'Mi Patrimonio';
  document.body.classList.toggle('auth',S.status!=='ok');
  const side=document.getElementById('side');
  side.innerHTML=`<div class="brand"><i>$</i>${esc(cfg().nombre)}</div>`+
   VIEWS.map(([k,n])=>`<button class="nav-btn" data-go="${k}" ${S.view===k?'aria-current="page"':''}>${svgI(k)}${n}</button>`).join('')+
   `<button class="btn pri add" data-act="nuevo">${svgI('plus')}Registrar movimiento</button>
    <div class="foot"><div class="syncbadge" style="margin-bottom:6px">${syncBadgeH()}</div>${cotizFoot()}</div>`;
  document.getElementById('tabbar').innerHTML=[['inicio','Inicio'],['movs','Movimientos']].map(([k,n])=>`<button data-go="${k}" ${S.view===k?'aria-current="page"':''}>${svgI(k)}${n}</button>`).join('')+
   `<button class="plus" data-act="nuevo" aria-label="Registrar movimiento">${svgI('plus')}</button>`+
   [['cuentas','Cuentas'],['ajustes','Más']].map(([k,n])=>`<button data-go="${k}" ${S.view===k||(k==='ajustes'&&S.view==='presu')?'aria-current="page"':''}>${svgI(k)}${n}</button>`).join('');
  const v=document.getElementById('view');
  if(S.status==='loading'){v.innerHTML=`<div class="empty"><h3>Abriendo tus datos…</h3></div>`;return;}
  if(S.status==='login'){v.innerHTML=vLogin();return;}
  if(S.status==='error'){v.innerHTML=`<div class="card empty"><h3>No se pudo conectar con el servidor</h3><p>${esc(S.errMsg||'Revisá tu conexión.')}</p><button class="btn pri" data-act="reintentar">Reintentar</button></div>`;return;}
  v.innerHTML=({inicio:vInicio,movs:vMovs,presu:vPresu,cuentas:vCuentas,ajustes:vAjustes}[S.view]||vInicio)();
}
function cotizFoot(){const c=ultimaCotiz();return c?`Dólar BNA venta: <b class="num">${fARS.format(c.venta)}</b><br>al ${dmy(c.fecha)}`:'Sin cotización del dólar cargada';}
function monthSw(){return `<div class="monthsw"><button data-act="mes" data-n="-1" aria-label="Mes anterior">‹</button><span>${monthName(S.month)}</span><button data-act="mes" data-n="1" aria-label="Mes siguiente">›</button></div>`;}
function deltaH(a,b,gasto){if(!b)return'';const d=(a-b)/Math.abs(b);if(!isFinite(d))return'';const up=d>0;const cls=gasto?(up?'up':'down'):(up?'upg':'downb');return `<span class="delta ${cls}">${up?'▲':'▼'} ${Math.abs(d*100).toFixed(0)}% vs mes anterior</span>`;}

/* ---------- Inicio ---------- */
function vInicio(){
  if(!S.cuentas.length) return `<div class="head"><h1>Hola</h1></div>${onboarding()}`;
  const r=resumen(S.month),rp=resumen(addMonths(S.month,-1));
  const fin=S.month===ym(today())?today():lastDay(S.month);
  const p=patrimonio(fin),pPrev=patrimonio(lastDay(addMonths(S.month,-1)));
  const pr=cfg().presu;const pct=pr.total?r.gas/pr.total:null;
  const pend=activos().filter(m=>m.tipo==='gasto'&&!m.cat).length;
  const cot=ultimaCotiz();const hayUSD=S.cuentas.some(c=>c.moneda==='USD'&&!c.archivada);
  let warn='';
  if(hayUSD&&!cot)warn=`<div class="note">Tenés cuentas en dólares pero no cargaste la cotización. El patrimonio en pesos las deja afuera hasta que la cargues en Ajustes.</div>`;
  else if(hayUSD&&cot&&monthsBetween(cot.fecha.slice(0,7),today().slice(0,7))*31+(Number(today().slice(8))-Number(cot.fecha.slice(8)))>4)warn=`<div class="note info">La última cotización del dólar es del ${dmy(cot.fecha)} (${fARS.format(cot.venta)}). Tocá “Actualizar ahora” en Ajustes o cargala a mano.</div>`;
  return `<div class="head"><div><div class="lbl">Resumen</div><h1>${esc(cfg().nombre)}</h1><div class="syncbadge">${syncBadgeH()}</div></div>${monthSw()}</div>
  ${warn}
  <div class="kpis">
    <div class="kpi hero"><span class="lbl">Patrimonio neto</span><span class="v">${moneyH(p.total)}</span>
      <span class="hint">Lo que tenés menos lo que debés, al ${dmy(fin)}. Variación del mes: <b class="num">${money(p.total-pPrev.total)}</b></span></div>
    <div class="kpi"><span class="lbl">Ingresos</span><span class="v">${moneyH(r.ing)}</span>${deltaH(r.ing,rp.ing,false)}</div>
    <div class="kpi"><span class="lbl">Gastos</span><span class="v">${moneyH(r.gas)}</span>${deltaH(r.gas,rp.gas,true)}</div>
    <div class="kpi"><span class="lbl">Resultado del mes</span><span class="v" style="color:${r.res<0?'var(--bad)':'var(--good)'}">${moneyH(r.res)}</span><span class="hint">Ingresos − gastos. Sin transferencias ni ajustes.</span></div>
    <div class="kpi"><span class="lbl">Tasa de ahorro</span><span class="v">${r.tasa==null?'—':(r.tasa*100).toFixed(1).replace('.',',')+' %'}</span><span class="hint">(Ingresos − gastos) ÷ ingresos</span></div>
    <div class="kpi"><span class="lbl">Presupuesto usado</span><span class="v">${pct==null?'—':Math.round(pct*100)+' %'}</span>${pct==null?'<span class="hint">Definilo en Presupuestos</span>':`<div class="bar-track"><div class="bar-fill ${pct>1?'bad':pct>.8?'warn':''}" style="width:${Math.min(100,pct*100)}%"></div></div>`}</div>
    <div class="kpi"><span class="lbl">Por revisar</span><span class="v">${pend}</span><span class="hint">${pend?'<button class="btn sm" data-act="verpend">Ver gastos sin categoría</button>':'Todo categorizado'}</span></div>
  </div>
  <div class="two">
    <div class="card"><div class="card-h"><h2>Gastos por categoría</h2><span class="small muted">Tocá una para ver el detalle</span></div>${donut(r)}</div>
    <div class="card"><div class="card-h"><h2>Gastos por semana</h2></div>${barras(r)}
      <div class="card-h" style="margin:18px 0 8px"><h2>Patrimonio, últimos 6 meses</h2></div>${lineaPat()}</div>
  </div>
  <div class="three">
    <div class="card"><div class="card-h"><h2>Presupuestos en alerta</h2></div>${alertasPresu(r)}</div>
    <div class="card"><div class="card-h"><h2>Bolucompras</h2><span class="chip">${r.impN} en el mes</span></div>${bolu(r)}</div>
    <div class="card"><div class="card-h"><h2>Cuentas</h2></div>${miniCuentas()}</div>
  </div>
  <div class="card"><div class="card-h"><h2>Últimos movimientos</h2><button class="btn sm ghost" data-go="movs">Ver todos</button></div>
    <div class="list">${activos().slice(0,6).map(rowMov).join('')||'<p class="muted">Todavía no hay movimientos.</p>'}</div></div>`;
}
function onboarding(){
  const b=[['Efectivo','efectivo','ARS'],['Mercado Pago','billetera','ARS'],['Brubank','banco','ARS'],['Ualá','billetera','ARS'],['Dólares en efectivo','efectivo','USD'],['Tarjeta de crédito','tarjeta','ARS']];
  return `<div class="card empty"><h3>Empezá creando tus cuentas</h3>
  <p style="max-width:52ch">Cada movimiento sale o entra de una cuenta. Cargá el saldo que tiene hoy cada una y la app calcula el resto. Después vas a ver acá tu patrimonio, gastos por categoría y presupuestos.</p>
  <div class="filters" style="justify-content:center">${b.map(([n,t,m])=>`<button class="btn" data-act="cuentaRapida" data-n="${esc(n)}" data-t="${t}" data-m="${m}">+ ${esc(n)}</button>`).join('')}</div>
  <button class="btn pri" data-act="cuentaNueva">Crear otra cuenta</button></div>`;
}
function donut(r){
  const ent=Object.entries(r.porCat).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const tot=ent.reduce((s,[,v])=>s+v,0);
  if(!tot)return `<div class="empty"><p>Cuando registres gastos este mes vas a ver cómo se reparten por categoría.</p><button class="btn pri" data-act="nuevo">Registrar un gasto</button></div>`;
  const R=56,C=2*Math.PI*R;let off=0;
  const segs=ent.map(([k,v])=>{const cat=catById(k);const len=v/tot*C;const s=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${cat?.c||'#999'}" stroke-width="20" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(cat?.n||'Sin categoría')}</title></circle>`;off+=len;return s;}).join('');
  return `<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Distribución de gastos">${segs}<text x="70" y="66" text-anchor="middle" font-size="10">Total</text><text x="70" y="82" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--fg)">${esc(fARS.format(Math.round(tot/100)).replace(',00',''))}</text></svg>
  <div class="legend">${ent.slice(0,8).map(([k,v])=>{const cat=catById(k);return `<button class="leg" data-act="filtCat" data-cat="${k}"><span class="dot" style="background:${cat?.c||'#999'}"></span><span>${esc(cat?.n||'Sin categoría')} <span class="muted small">${Math.round(v/tot*100)}%</span></span><span class="num small">${esc(money(v))}</span></button>`}).join('')}</div></div>`;
}
function barras(r){
  const n=weekIdx(lastDay(S.month))+1;const vals=[...Array(n)].map((_,i)=>Math.max(0,r.porSem[i]||0));const mx=Math.max(...vals,1);
  const W=300,H=120,bw=(W-20)/n;
  return `<svg viewBox="0 0 ${W} ${H+18}" width="100%" role="img" aria-label="Gastos por semana">
   <line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="var(--line)"/>
   ${vals.map((v,i)=>{const h=v/mx*(H-18);return `<rect x="${10+i*bw+bw*.18}" y="${H-h}" width="${bw*.64}" height="${h}" rx="4" fill="var(--accent)" opacity="${v?1:.25}"><title>Semana ${i+1}: ${esc(money(v))}</title></rect>
   ${v?`<text x="${10+i*bw+bw/2}" y="${H-h-4}" text-anchor="middle" font-size="9">${esc(abrev(v))}</text>`:''}
   <text x="${10+i*bw+bw/2}" y="${H+13}" text-anchor="middle" font-size="9">Sem ${i+1}</text>`}).join('')}</svg>`;
}
function abrev(c){const v=c/100;if(Math.abs(v)>=1e6)return'$'+(v/1e6).toFixed(1).replace('.',',')+'M';if(Math.abs(v)>=1e3)return'$'+Math.round(v/1e3)+'k';return'$'+Math.round(v);}
function lineaPat(){
  const ms=[...Array(6)].map((_,i)=>addMonths(S.month,i-5));
  const pts=ms.map(m=>{const f=m===ym(today())?today():lastDay(m);return f>today()?null:patrimonio(f).total});
  const vs=pts.filter(v=>v!=null);if(vs.length<2)return `<p class="muted small">Va a aparecer cuando tengas al menos dos meses de historia.</p>`;
  const mn=Math.min(...vs),mx=Math.max(...vs),W=300,H=90,span=(mx-mn)||1;
  const xy=pts.map((v,i)=>v==null?null:[10+i*(W-20)/5,8+(H-16)*(1-(v-mn)/span)]);
  const ok=xy.filter(Boolean);const path=ok.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const last=ok[ok.length-1];
  return `<svg viewBox="0 0 ${W} ${H+16}" width="100%" role="img" aria-label="Evolución del patrimonio">
   <path d="${path} L${last[0]} ${H} L${ok[0][0]} ${H} Z" fill="var(--accent-soft)" opacity=".7"/>
   <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>
   <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(--accent)"/>
   ${ms.map((m,i)=>`<text x="${10+i*(W-20)/5}" y="${H+13}" text-anchor="middle" font-size="9">${new Date(m+'-15T12:00').toLocaleDateString('es-AR',{month:'short'})}</text>`).join('')}
   <text x="${last[0]-6}" y="${Math.max(10,last[1]-8)}" text-anchor="end" font-size="9" style="fill:var(--fg)">${esc(abrev(pts[pts.length-1]??0))}</text></svg>`;
}
function alertasPresu(r){
  const pr=cfg().presu;const items=[];
  if(pr.total)items.push(['Total del mes',r.gas,pr.total]);
  for(const[k,v]of Object.entries(pr.cat||{}))if(v)items.push([catById(k)?.n||k,Math.max(0,r.porCat[k]||0),v]);
  const al=items.filter(([,g,p])=>g/p>=.8).sort((a,b)=>b[1]/b[2]-a[1]/a[2]);
  if(!items.length)return `<p class="muted small">No definiste presupuestos todavía.</p><button class="btn sm" data-go="presu">Definir presupuestos</button>`;
  if(!al.length)return `<p class="muted small">Todas las categorías están por debajo del 80% de su presupuesto.</p>`;
  return al.slice(0,4).map(([n,g,p])=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between" class="small"><b>${esc(n)}</b><span class="num">${Math.round(g/p*100)}%</span></div><div class="bar-track"><div class="bar-fill ${g>p?'bad':'warn'}" style="width:${Math.min(100,g/p*100)}%"></div></div><div class="small muted num">${esc(money(g))} de ${esc(money(p))}</div></div>`).join('');
}
function bolu(r){
  if(!r.impN)return `<p class="muted small">Ninguna compra marcada como impulsiva este mes. Marcalas con el interruptor “Bolucompra” al cargar un gasto.</p>`;
  const top=Object.entries(r.impCom).sort((a,b)=>b[1]-a[1]).slice(0,3);
  return `<div class="kpi" style="border:0;padding:0"><span class="v">${moneyH(r.impul)}</span><span class="hint">${r.gas>0?Math.round(r.impul/r.gas*100):0}% del gasto del mes · promedio ${esc(money(Math.round(r.impul/r.impN)))}</span></div>
  <div class="list" style="margin-top:8px">${top.map(([c,v])=>`<div style="display:flex;justify-content:space-between;padding:4px 0" class="small"><span>${esc(c)}</span><span class="num">${esc(money(v))}</span></div>`).join('')}</div>`;
}
function miniCuentas(){
  return S.cuentas.filter(c=>!c.archivada).slice(0,6).map(c=>{const s=saldo(c);return `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0" class="small"><span>${esc(c.nombre)}</span><span class="num" style="font-weight:600;color:${s<0?'var(--bad)':'inherit'}">${esc(money(s,c.moneda))}</span></div>`}).join('');
}
function rowMov(m){
  const cat=catById(m.cat);const c1=cuentaById(m.lineas?.[0]?.cuenta);const c2=cuentaById(m.lineas?.[1]?.cuenta);
  let ico,col,t,s,cls,sign;
  if(m.tipo==='transferencia'){ico='⇄';col='#6b7f8c';t=m.desc||'Transferencia';s=`${c1?.nombre||'?'} → ${c2?.nombre||'?'}`;cls='tr';sign='';}
  else if(m.tipo==='ajuste'){ico='±';col='#6b7f8c';t='Ajuste de saldo';s=c1?.nombre||'';cls='tr';sign=m.lineas[0].monto<0?'−':'+';}
  else{ico=(cat?.n||'?')[0];col=cat?.c||'#9aa';t=m.comercio||m.desc||cat?.n||'Sin categoría';s=[cat?.n||'Sin categoría',m.sub,c1?.nombre].filter(Boolean).join(' · ');
    cls=m.tipo==='gasto'?'neg':'pos';sign=m.tipo==='gasto'?'−':'+';if(m.tipo==='reembolso')s='Devolución · '+s;}
  const extra=[m.impulsiva?'<span class="chip warn">Bolucompra</span>':'',(m.cuotas||1)>1?`<span class="chip">${m.cuotas} cuotas</span>`:'',m.estado==='anulado'?'<span class="chip bad">Anulado</span>':'',!m.cat&&m.tipo==='gasto'?'<span class="chip acc">Sin categoría</span>':''].join(' ');
  return `<button class="row ${m.estado==='anulado'?'void':''}" data-act="editar" data-id="${m.id}"><span class="ico" style="background:${col}">${esc(ico)}</span><div><div class="t">${esc(t)} ${extra}</div><div class="s">${esc(s)}</div></div><span class="amt ${cls}">${sign}${esc(money(m.monto,m.moneda))}</span></button>`;
}

/* ---------- Movimientos ---------- */
function vMovs(){
  const f=S.filt;const qq=norm(f.q);
  let list=S.movs.filter(m=>ym(m.fecha)===S.month);
  if(f.tipo==='pend')list=list.filter(m=>m.tipo==='gasto'&&!m.cat&&m.estado!=='anulado');else if(f.tipo==='impulsiva')list=list.filter(m=>m.impulsiva);else if(f.tipo)list=list.filter(m=>m.tipo===f.tipo);
  if(f.cat)list=list.filter(m=>(m.cat||'_sin')===f.cat);
  if(f.cuenta)list=list.filter(m=>(m.lineas||[]).some(l=>l.cuenta===f.cuenta));
  if(qq)list=list.filter(m=>norm([m.comercio,m.desc,m.sub,(m.tags||[]).join(' '),catById(m.cat)?.n].join(' ')).includes(qq));
  const byDay={};for(const m of list)(byDay[m.fecha]=byDay[m.fecha]||[]).push(m);
  const days=Object.keys(byDay).sort().reverse();
  const tot=list.filter(m=>m.estado!=='anulado').reduce((a,m)=>{const v=toARS(m.monto,m.moneda,m.fecha)||0;if(m.tipo==='gasto')a.g+=v;if(m.tipo==='reembolso')a.g-=v;if(m.tipo==='ingreso')a.i+=v;return a},{g:0,i:0});
  return `<div class="head"><h1>Movimientos</h1>${monthSw()}</div>
  <div class="filters">
    <input id="fq" type="search" placeholder="Buscar comercio, descripción o etiqueta" value="${esc(f.q)}">
    <select id="ftipo"><option value="">Todos los tipos</option>${[['gasto','Gastos'],['ingreso','Ingresos'],['transferencia','Transferencias'],['reembolso','Devoluciones'],['ajuste','Ajustes'],['impulsiva','Bolucompras'],['pend','Sin categoría']].map(([v,n])=>`<option value="${v}" ${f.tipo===v?'selected':''}>${n}</option>`).join('')}</select>
    <select id="fcat"><option value="">Todas las categorías</option><option value="_sin" ${f.cat==='_sin'?'selected':''}>Sin categoría</option>${cfg().cats.map(c=>`<option value="${c.id}" ${f.cat===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
    <select id="fcta"><option value="">Todas las cuentas</option>${S.cuentas.map(c=>`<option value="${c.id}" ${f.cuenta===c.id?'selected':''}>${esc(c.nombre)}</option>`).join('')}</select>
  </div>
  <div class="small muted num">${list.length} movimientos · Gastos ${esc(money(tot.g))} · Ingresos ${esc(money(tot.i))}${(f.q||f.tipo||f.cat||f.cuenta)?' · <button class="btn sm ghost" data-act="limpiar">Quitar filtros</button>':''}</div>
  <div class="card" style="padding:4px 12px">${days.length?days.map(d=>`<div class="dayh"><span class="lbl">${esc(dayLabel(d))}</span></div><div class="list">${byDay[d].map(rowMov).join('')}</div>`).join(''):`<div class="empty"><h3>No hay movimientos ${f.q||f.tipo||f.cat||f.cuenta?'con estos filtros':'en '+monthName(S.month)}</h3><button class="btn pri" data-act="nuevo">Registrar movimiento</button></div>`}</div>`;
}

/* ---------- Cuentas ---------- */
function vCuentas(){
  const p=patrimonio();
  const grupos={};for(const c of S.cuentas)(grupos[c.archivada?'zz':c.tipo]=grupos[c.archivada?'zz':c.tipo]||[]).push(c);
  return `<div class="head"><div><div class="lbl">Patrimonio neto hoy</div><h1 class="num">${moneyH(p.total)}</h1><div class="small muted num">Activos ${esc(money(p.act))} · Deudas ${esc(money(-p.pas))}</div></div><button class="btn pri" data-act="cuentaNueva">Nueva cuenta</button></div>
  ${S.cuentas.length?'':onboarding()}
  ${Object.keys(grupos).sort().map(k=>`<div class="card"><div class="card-h"><h2>${k==='zz'?'Archivadas':TIPOS_CUENTA[k]}</h2></div><div class="list">${grupos[k].map(c=>{
    const s=saldo(c);const cu=c.tipo==='tarjeta'?cuotasPend(c):null;
    return `<button class="row" data-act="verCuenta" data-id="${c.id}"><span class="ico" style="background:${PASIVO(c.tipo)?'var(--bad)':'var(--accent)'}">${esc(c.nombre[0]||'?')}</span>
     <div><div class="t">${esc(c.nombre)} ${c.moneda==='USD'?'<span class="chip">USD</span>':''}</div><div class="s">${esc(c.institucion||TIPOS_CUENTA[c.tipo])}${c.ultConc?' · conciliada '+dmy(c.ultConc):''}${cu&&cu.tot?' · cuotas futuras '+money(cu.tot):''}</div></div>
     <span class="amt" style="color:${s<0?'var(--bad)':'var(--fg)'}">${PASIVO(c.tipo)&&s<0?'Debés '+esc(money(-s,c.moneda)):esc(money(s,c.moneda))}</span></button>`}).join('')}</div></div>`).join('')}`;
}

/* ---------- Presupuestos ---------- */
function vPresu(){
  const r=resumen(S.month);const pr=cfg().presu;
  const rows=cfg().cats.filter(c=>c.k==='gasto').map(c=>{const g=Math.max(0,r.porCat[c.id]||0),p=pr.cat?.[c.id]||0;const pc=p?g/p:0;
    return `<div style="display:grid;grid-template-columns:1fr 150px;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)">
     <div style="min-width:0"><div style="display:flex;justify-content:space-between;gap:8px"><b><span class="dot" style="display:inline-block;background:${c.c};margin-right:6px"></span>${esc(c.n)}</b><span class="small num muted">${esc(money(g))}${p?' · '+Math.round(pc*100)+'%':''}</span></div>
     ${p?`<div class="bar-track" style="margin-top:6px"><div class="bar-fill ${pc>1?'bad':pc>.8?'warn':''}" style="width:${Math.min(100,pc*100)}%"></div></div>`:''}</div>
     <input inputmode="decimal" placeholder="Sin límite" data-presu="${c.id}" value="${p?esc(fNum.format(p/100)):''}" aria-label="Presupuesto ${esc(c.n)}"></div>`}).join('');
  const pt=pr.total?r.gas/pr.total:0;
  return `<div class="head"><div><div class="lbl">Se repiten cada mes</div><h1>Presupuestos</h1></div>${monthSw()}</div>
  <div class="card"><div class="fgrid"><label class="f"><span>Presupuesto total mensual</span><input inputmode="decimal" data-presu="_total" placeholder="Sin límite" value="${pr.total?esc(fNum.format(pr.total/100)):''}"></label>
  <div style="align-self:end">${pr.total?`<div class="small num" style="display:flex;justify-content:space-between"><span>${esc(money(r.gas))} gastado</span><span>${Math.round(pt*100)}%</span></div><div class="bar-track"><div class="bar-fill ${pt>1?'bad':pt>.8?'warn':''}" style="width:${Math.min(100,pt*100)}%"></div></div>`:'<span class="small muted">Escribí un monto y salí del campo para guardarlo.</span>'}</div></div></div>
  <div class="card"><div class="card-h"><h2>Por categoría</h2><span class="small muted">Gastos netos de devoluciones</span></div>${rows}</div>`;
}

/* ---------- Ajustes ---------- */
function vAjustes(){
  const cs=[...S.cotiz].sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const pend=OUT.length;
  return `<div class="head"><h1>Ajustes</h1></div>
  <div class="card"><div class="card-h"><h2>Tu cuenta</h2><button class="btn sm" data-act="salir">Cerrar sesión</button></div>
   <div class="small">${esc(USER?.email||'')}</div>
   <div class="small muted" style="margin-top:4px">${pend?`<span class="chip warn">${pend} cambios sin subir</span> Se suben solos cuando haya conexión.${S.syncErr?' Último error: '+esc(S.syncErr):''} <button class="btn sm" data-act="syncAhora">Reintentar</button>`:`<span class="chip good">Todo sincronizado</span>${S.lastSync?' · '+new Date(S.lastSync).toLocaleString('es-AR',{timeZone:TZ}):''}`}</div></div>
  <div class="card" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-go="presu">${svgI('presu').replace('<svg','<svg width="18" height="18"')}Presupuestos</button><button class="btn" data-go="cuentas">Cuentas</button></div>
  <div class="card"><div class="card-h"><h2>Dólar oficial venta · Banco Nación</h2><a class="small" href="https://www.bna.com.ar/Personas" target="_blank" rel="noopener">Ver en bna.com.ar</a></div>
   <p class="small muted" style="margin-top:0">Se actualiza sola al abrir la app y todos los días hábiles a la tarde. Cada movimiento en dólares usa la cotización vigente en su fecha. Si cargás una a mano, pisa a la automática de ese día.</p>
   <div class="filters" style="margin-bottom:8px"><button class="btn" data-act="actDolar">Actualizar ahora</button></div>
   <div class="filters"><input id="cfecha" type="date" value="${today()}" aria-label="Fecha"><input id="cventa" inputmode="decimal" placeholder="Carga manual, ej. 1.475,00" aria-label="Cotización venta"><button class="btn pri" data-act="addCotiz">Guardar a mano</button></div>
   <div class="list" style="margin-top:10px">${cs.slice(0,8).map(c=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" class="small"><span>${dmy(c.fecha)} <span class="muted">· ${esc(c.manual?'manual':c.fuente)}</span></span><span class="num"><b>${esc(fARS.format(c.venta))}</b> ${c.manual?`<button class="btn sm ghost" data-act="delCotiz" data-id="${c.fecha}" aria-label="Borrar cotización">Borrar</button>`:''}</span></div>`).join('')||'<p class="muted small">Todavía no cargaste ninguna.</p>'}</div></div>
  <div class="card"><div class="card-h"><h2>Nombre de la app</h2></div><div class="filters"><input id="nombre" value="${esc(cfg().nombre)}"><button class="btn" data-act="saveNombre">Guardar</button></div></div>
  <div class="card"><div class="card-h"><h2>Categorías</h2><button class="btn sm" data-act="nuevaCat">Nueva categoría</button></div>
   <div class="list">${cfg().cats.map(c=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b><span class="dot" style="display:inline-block;background:${c.c};margin-right:6px"></span>${esc(c.n)} <span class="chip">${c.k==='gasto'?'Gasto':'Ingreso'}</span></b><button class="btn sm ghost" data-act="nuevaSub" data-id="${c.id}">+ Subcategoría</button></div><div class="small muted">${esc(c.s.join(' · '))||'Sin subcategorías'}</div></div>`).join('')}</div></div>
  <div class="card"><div class="card-h"><h2>Reglas de clasificación</h2><span class="small muted">${cfg().reglas.length} reglas · ${Object.keys(cfg().memoria||{}).length} comercios aprendidos</span></div>
   <p class="small muted" style="margin-top:0">Si el comercio o la descripción contiene la palabra, se sugiere la categoría. Lo que corregís al guardar se recuerda para ese comercio.</p>
   <div class="filters"><input id="rp" placeholder="Palabra, ej. carrefour"><select id="rc">${cfg().cats.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select><input id="rs" placeholder="Subcategoría (opcional)"><button class="btn" data-act="addRegla">Agregar regla</button></div>
   <details style="margin-top:10px"><summary class="small">Ver reglas</summary><div class="small" style="columns:2;column-gap:20px;margin-top:8px">${cfg().reglas.map((r,i)=>`<div style="break-inside:avoid;padding:3px 0">${esc(r.p)} → ${esc(catById(r.cat)?.n||r.cat)}${r.sub?' / '+esc(r.sub):''} <button class="btn sm ghost" data-act="delRegla" data-i="${i}" aria-label="Borrar regla">×</button></div>`).join('')}</div></details></div>
  <div class="card"><div class="card-h"><h2>Respaldo</h2></div><p class="small muted" style="margin-top:0">Descargá una copia completa (cuentas, movimientos con su historial, cotizaciones y configuración). La base de datos sigue siendo la fuente principal; el archivo es una copia adicional.</p>
   <div class="filters"><button class="btn" data-act="export" data-f="json">Descargar respaldo completo (JSON)</button><button class="btn" data-act="export" data-f="csv">Descargar movimientos (CSV)</button></div>
   <div class="card-h" style="margin:18px 0 6px"><h3>Importar un respaldo</h3></div>
   <p class="small muted" style="margin-top:0">Elegí un archivo JSON descargado desde esta app o desde la versión anterior en Claude. Los movimientos que ya tenés no se duplican.</p>
   <input type="file" id="importFile" accept="application/json,.json"></div>`;
}

/* ============ Formulario de movimiento ============ */
let F=null; // estado del formulario abierto
function abrirMov(m){
  const ult=S.sess;
  if(m){F={id:m.id,tipo:m.tipo,monto:fNum.format(m.monto/100),cuenta:m.lineas[0]?.cuenta,hacia:m.lineas[1]?.cuenta||'',montoDest:m.lineas[1]?fNum.format(Math.abs(m.lineas[1].monto)/100):'',cat:m.cat||'',sub:m.sub||'',fecha:m.fecha,hora:m.hora||'',comercio:m.comercio||'',desc:m.desc||'',tags:(m.tags||[]).join(', '),impulsiva:!!m.impulsiva,cuotas:m.cuotas||1,catManual:true,orig:m,sugerida:''};}
  else{const c=S.cuentas.filter(x=>!x.archivada);F={tipo:ult.tipo||'gasto',monto:'',cuenta:ult.cuenta&&cuentaById(ult.cuenta)?ult.cuenta:(c[0]?.id||''),hacia:'',montoDest:'',cat:ult.cat||'',sub:ult.sub||'',fecha:today(),hora:nowTime(),comercio:'',desc:'',tags:'',impulsiva:false,cuotas:1,catManual:false,sugerida:''};}
  F.confirm=false;F.texto='';renderSheet();
  setTimeout(()=>{const el=document.getElementById('mmonto');if(el&&!m)el.focus();},60);
}
function cuentaOpts(sel,excl){return S.cuentas.filter(c=>!c.archivada||c.id===sel).filter(c=>c.id!==excl).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nombre)}${c.moneda==='USD'?' (USD)':''}</option>`).join('');}
function renderSheet(){
  const md=document.getElementById('modal');if(!F){md.innerHTML='';document.body.style.overflow='';return;}
  document.body.style.overflow='hidden';
  const t=F.tipo;const cta=cuentaById(F.cuenta);const dest=cuentaById(F.hacia);const mon=cta?.moneda||'ARS';
  const kind=t==='ingreso'?'ingreso':'gasto';
  const favs=cfg().favCats||[];
  const cats=cfg().cats.filter(c=>c.k===kind).sort((a,b)=>(favs.includes(b.id)-favs.includes(a.id)));
  const catSel=catById(F.cat);
  const antes=cta&&F.fecha<(cta.fechaIni||'0000');
  md.innerHTML=`<div class="scrim" data-act="cerrarFondo"><div class="sheet" role="dialog" aria-modal="true" aria-label="Movimiento">
   <div style="display:flex;justify-content:space-between;align-items:center"><h2>${F.id?'Editar movimiento':'Nuevo movimiento'}</h2><button class="btn sm ghost" data-act="cerrar">Cerrar</button></div>
   ${F.id?'':`<div class="nlp"><input id="mtexto" placeholder="Escribilo como te salga: “café 3500 mp”" value="${esc(F.texto)}"><button class="btn" data-act="interpretar">Completar</button></div>`}
   ${F.orig?.tipo==='ajuste'?'<div class="note info">Los ajustes se crean desde la conciliación de la cuenta. Acá solo podés anularlo.</div>':`
   <div class="seg" role="group" aria-label="Tipo">${[['gasto','Gasto'],['ingreso','Ingreso'],['transferencia','Transferencia'],['reembolso','Devolución']].map(([k,n])=>`<button data-act="tipo" data-t="${k}" aria-pressed="${t===k}">${n}</button>`).join('')}</div>
   <label class="amount-in"><span>${mon==='USD'?'US$':'$'}</span><input id="mmonto" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(F.monto)}" aria-label="Importe"></label>
   <div class="fgrid">
    <label class="f"><span>${t==='transferencia'?'Desde':t==='ingreso'||t==='reembolso'?'Entra en':'Pagado con'}</span><select id="mcuenta">${cuentaOpts(F.cuenta)}</select></label>
    ${t==='transferencia'?`<label class="f"><span>Hacia</span><select id="mhacia"><option value="">Elegí cuenta</option>${cuentaOpts(F.hacia,F.cuenta)}</select></label>
      ${dest&&cta&&dest.moneda!==cta.moneda?`<label class="f full"><span>Monto recibido en ${dest.moneda}</span><input id="mdest" inputmode="decimal" value="${esc(F.montoDest)}" placeholder="Ej. compra de dólares: lo que te acreditaron"></label>`:''}`
     :`<label class="f"><span>Fecha</span><input id="mfecha" type="date" value="${F.fecha}"></label>`}
   </div>
   ${t==='transferencia'?`<div class="fgrid"><label class="f"><span>Fecha</span><input id="mfecha" type="date" value="${F.fecha}"></label><label class="f"><span>Descripción</span><input id="mdesc" value="${esc(F.desc)}" placeholder="Ej. pago resumen Visa"></label></div>
     <div class="note info">Las transferencias no cuentan como ingreso ni gasto. Para pagar una tarjeta, transferí desde tu banco hacia la tarjeta.</div>`:`
   <div><div class="lbl" style="margin-bottom:6px">Categoría ${F.sugerida?`<span class="chip acc">${esc(F.sugerida)}</span>`:''}</div>
    <div class="cats">${cats.map(c=>`<button class="cat" data-act="cat" data-id="${c.id}" aria-pressed="${F.cat===c.id}"><span class="dot" style="background:${c.c}"></span>${esc(c.n)}</button>`).join('')}</div></div>
   ${catSel&&catSel.s.length?`<label class="f"><span>Subcategoría</span><select id="msub"><option value="">—</option>${catSel.s.map(s=>`<option ${F.sub===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`:''}
   <div class="fgrid">
    <label class="f"><span>Comercio o contraparte</span><input id="mcomercio" value="${esc(F.comercio)}" placeholder="Ej. Mercado Libre, Carrefour" autocomplete="off" list="comercios"></label>
    <label class="f"><span>Descripción</span><input id="mdesc" value="${esc(F.desc)}" placeholder="Opcional"></label>
    <label class="f"><span>Etiquetas</span><input id="mtags" value="${esc(F.tags)}" placeholder="Separadas por coma: social, viaje"></label>
    ${t==='gasto'&&cta?.tipo==='tarjeta'?`<label class="f"><span>Cuotas</span><select id="mcuotas">${[1,2,3,6,9,12,18,24].map(n=>`<option value="${n}" ${F.cuotas==n?'selected':''}>${n===1?'1 pago':n+' cuotas'}</option>`).join('')}</select></label>`:''}
   </div>
   <datalist id="comercios">${[...new Set(S.movs.map(m=>m.comercio).filter(Boolean))].slice(0,200).map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
   ${t==='gasto'?`<label class="toggle"><input type="checkbox" id="mimp" ${F.impulsiva?'checked':''}><span><b>Bolucompra</b> <span class="small muted">compra impulsiva o prescindible, se suma a su categoría sin duplicarse</span></span></label>`:''}
   ${t==='gasto'&&(F.cuotas||1)>1?`<div class="note info">Se registra el gasto total hoy. Las cuotas quedan como deuda de la tarjeta y se cancelan al pagar el resumen; no se vuelven a contar como gasto.</div>`:''}
   ${t==='reembolso'?'<div class="note info">La devolución resta del gasto de su categoría en el mes en que la recibís.</div>':''}`}
   ${antes?`<div class="note">La fecha es anterior al saldo inicial de ${esc(cta.nombre)} (${dmy(cta.fechaIni)}), así que no va a cambiar su saldo. Sí cuenta en los reportes del mes.</div>`:''}
   `}
   ${F.err?`<div class="note" role="alert">${esc(F.err)}</div>`:''}
   ${F.confirm?`<div class="confirm"><b>¿Anular este movimiento?</b><span class="small">Deja de contar en saldos y reportes. Queda en el historial marcado como anulado y lo podés restaurar.</span><div class="actions"><button class="btn sm" data-act="noAnular">Cancelar</button><button class="btn sm danger" data-act="siAnular">Anular</button></div></div>`:''}
   <div class="actions">
    ${F.id?(F.orig.estado==='anulado'?`<button class="btn" data-act="restaurar">Restaurar</button>`:`<button class="btn danger" data-act="anular">Anular</button>`):''}
    ${F.orig?.tipo==='ajuste'?'':`${F.id?'':'<button class="btn" data-act="guardar" data-otro="1">Guardar y cargar otro</button>'}<button class="btn pri" data-act="guardar">${F.id?'Guardar cambios':'Guardar'}</button>`}
   </div>
   ${F.orig?.historial?.length?`<details><summary class="small muted">Historial (${F.orig.historial.length})</summary><div class="small muted">${F.orig.historial.slice().reverse().map(h=>`<div>${new Date(h.t).toLocaleString('es-AR',{timeZone:TZ})} · ${esc(h.a)}</div>`).join('')}</div></details>`:''}
  </div></div>`;
}
function leerForm(){
  const g=id=>document.getElementById(id);
  if(!F)return;
  for(const[k,id]of[['monto','mmonto'],['fecha','mfecha'],['comercio','mcomercio'],['desc','mdesc'],['tags','mtags'],['montoDest','mdest'],['texto','mtexto']]){const e=g(id);if(e)F[k]=e.value;}
  if(g('mcuenta'))F.cuenta=g('mcuenta').value; if(g('mhacia'))F.hacia=g('mhacia').value;
  if(g('msub'))F.sub=g('msub').value; if(g('mimp'))F.impulsiva=g('mimp').checked; if(g('mcuotas'))F.cuotas=Number(g('mcuotas').value);
}
function sugerir(){
  if(F.catManual)return;
  const s=clasificar(F.comercio+' '+F.desc,F.comercio);
  if(s){const k=catById(s.cat)?.k;if((F.tipo==='ingreso')===(k==='ingreso')){F.cat=s.cat;F.sub=s.sub||'';F.sugerida=s.origen;}}
}
function clasificar(texto,comercio){
  const mem=cfg().memoria||{};const ck=norm(comercio).trim();
  if(ck&&mem[ck])return{...mem[ck],origen:'Sugerida por lo que usaste antes'};
  const t=' '+norm(texto)+' ';
  for(const r of cfg().reglas)if(t.includes(norm(r.p)))return{cat:r.cat,sub:r.sub,origen:'Sugerida por regla “'+r.p+'”'};
  return null;
}
async function guardar(otro){
  leerForm();F.err='';
  const c=parseMonto(F.monto);
  if(!(c>0)){F.err='Escribí un importe mayor a cero. Ejemplos: 3500 · 1.234,50 · 12k';return renderSheet();}
  const cta=cuentaById(F.cuenta);if(!cta){F.err='Elegí una cuenta.';return renderSheet();}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(F.fecha||'')){F.err='Elegí una fecha válida.';return renderSheet();}
  let lineas;
  if(F.tipo==='transferencia'){
    const d=cuentaById(F.hacia);if(!d){F.err='Elegí la cuenta de destino.';return renderSheet();}
    let c2=c;if(d.moneda!==cta.moneda){c2=parseMonto(F.montoDest);if(!(c2>0)){F.err=`Escribí cuánto llegó en ${d.moneda}.`;return renderSheet();}}
    lineas=[{cuenta:cta.id,monto:-c,moneda:cta.moneda},{cuenta:d.id,monto:c2,moneda:d.moneda}];
  }else lineas=[{cuenta:cta.id,monto:F.tipo==='gasto'?-c:c,moneda:cta.moneda}];
  const ahora=new Date().toISOString();
  const tags=F.tags.split(',').map(s=>s.trim()).filter(Boolean);
  const base={tipo:F.tipo,monto:c,moneda:cta.moneda,fecha:F.fecha,hora:F.hora||'',lineas,
    cat:F.tipo==='transferencia'?null:(F.cat||null),sub:F.tipo==='transferencia'?'':(F.sub||''),comercio:F.comercio.trim(),desc:F.desc.trim(),tags,
    impulsiva:F.tipo==='gasto'&&F.impulsiva,cuotas:F.tipo==='gasto'&&cta.tipo==='tarjeta'?(F.cuotas||1):1};
  let doc;
  if(F.id){const o=F.orig;const cambios=[];
    if(o.monto!==base.monto||o.moneda!==base.moneda)cambios.push(`importe ${money(o.monto,o.moneda)} → ${money(base.monto,base.moneda)}`);
    if(o.cat!==base.cat)cambios.push(`categoría ${catById(o.cat)?.n||'—'} → ${catById(base.cat)?.n||'—'}`);
    if(o.fecha!==base.fecha)cambios.push(`fecha ${dmy(o.fecha)} → ${dmy(base.fecha)}`);
    if(o.lineas?.[0]?.cuenta!==lineas[0].cuenta)cambios.push('cuenta');
    if(o.tipo!==base.tipo)cambios.push(`tipo ${o.tipo} → ${base.tipo}`);
    doc={...o,...base,editado:ahora,historial:[...(o.historial||[]),{t:ahora,a:'Editado'+(cambios.length?': '+cambios.join(', '):'')}].slice(-30)};
  }else{
    doc={...base,id:newId(),estado:'activo',canal:F.canal||'app',creado:ahora,editado:ahora,historial:[{t:ahora,a:'Creado desde '+(F.canal==='texto'?'texto libre':'la app')}]};
  }
  // aprender comercio → categoría
  if(doc.comercio&&doc.cat&&doc.tipo!=='transferencia'){const k=norm(doc.comercio).trim();const mem={...(cfg().memoria||{})};
    if(!mem[k]||mem[k].cat!==doc.cat||mem[k].sub!==doc.sub){mem[k]={cat:doc.cat,sub:doc.sub};saveCfg({memoria:mem});}}
  upsertLocal(doc);
  S.sess={tipo:F.tipo,cuenta:F.cuenta,cat:F.tipo==='transferencia'?S.sess.cat:F.cat,sub:F.sub};
  const id=doc.id;persist('movimientos',doc);
  toast(F.id?'Cambios guardados':(F.tipo==='gasto'?'Gasto':F.tipo==='ingreso'?'Ingreso':F.tipo==='transferencia'?'Transferencia':'Devolución')+' de '+money(c,cta.moneda)+' guardado');
  if(otro){abrirMov(null);}else{F=null;renderSheet();}
  render();
}
function upsertLocal(doc){const i=S.movs.findIndex(m=>m.id===doc.id);if(i>=0)S.movs[i]=doc;else S.movs.unshift(doc);sortMovs();}
function sortMovs(){S.movs.sort((a,b)=>(b.fecha+(b.hora||'')+b.creado).localeCompare(a.fecha+(a.hora||'')+a.creado));}
function anular(rest){const o=F.orig;const ahora=new Date().toISOString();const doc={...o,estado:rest?'activo':'anulado',editado:ahora,historial:[...(o.historial||[]),{t:ahora,a:rest?'Restaurado':'Anulado'}].slice(-30)};
  upsertLocal(doc);persist('movimientos',doc);toast(rest?'Movimiento restaurado':'Movimiento anulado');F=null;renderSheet();render();}

/* Texto libre → formulario. Usa a Claude si está disponible; si no, un intérprete local. El resultado siempre se revisa antes de guardar. */
async function interpretar(){
  leerForm();const txt=(F.texto||'').trim();if(!txt)return;
  const btn=document.querySelector('[data-act="interpretar"]');if(btn){btn.disabled=true;btn.textContent='Leyendo…';}
  let r=null;
  try{if(CONF?.interpretar&&navigator.onLine){const prompt=`Interpretá un movimiento de finanzas personales escrito por un usuario argentino. Respondé SOLO un objeto JSON con estas claves:
{"tipo":"gasto|ingreso|transferencia|reembolso","monto":"importe tal como número con coma decimal, ej 3500 o 1234,50","cuenta":"id de cuenta o null","hacia":"id de cuenta destino o null","cat":"id de categoría o null","sub":"subcategoría exacta de la lista o null","comercio":"string o null","desc":"string corto o null","fecha":"YYYY-MM-DD o null","impulsiva":true|false,"cuotas":número}
Hoy es ${today()}. "mp"=Mercado Pago. "12k"=12000. "ayer" = día anterior.
Cuentas: ${JSON.stringify(S.cuentas.filter(c=>!c.archivada).map(c=>({id:c.id,nombre:c.nombre,tipo:c.tipo,moneda:c.moneda})))}
Categorías: ${JSON.stringify(cfg().cats.map(c=>({id:c.id,nombre:c.n,tipo:c.k,subs:c.s})))}
Texto: """${txt.slice(0,400)}"""`;
      const {data:{session}}=await SB.auth.getSession();
      const res=await fetch('/api/interpretar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(session?.access_token||'')},body:JSON.stringify({prompt})});
      if(res.ok)r=await res.json();}
  }catch(e){console.warn(e);r=null;}
  if(!r||typeof r!=='object')r=parseLocal(txt);
  // Validación determinística: nada de la IA entra sin chequear
  if(['gasto','ingreso','transferencia','reembolso'].includes(r.tipo))F.tipo=r.tipo;
  const c=parseMonto(r.monto);if(c>0)F.monto=fNum.format(c/100);
  if(r.cuenta&&cuentaById(r.cuenta))F.cuenta=r.cuenta;
  if(r.hacia&&cuentaById(r.hacia))F.hacia=r.hacia;
  if(typeof r.comercio==='string')F.comercio=r.comercio;
  if(typeof r.desc==='string')F.desc=r.desc;
  if(r.fecha&&/^\d{4}-\d{2}-\d{2}$/.test(r.fecha))F.fecha=r.fecha;
  F.impulsiva=!!r.impulsiva;if(Number(r.cuotas)>1)F.cuotas=Number(r.cuotas);
  const cat=catById(r.cat);
  if(cat){F.cat=cat.id;F.sub=cat.s.includes(r.sub)?r.sub:'';F.catManual=false;F.sugerida='Sugerida desde el texto, revisala';}
  else{F.catManual=false;F.cat='';F.sub='';F.sugerida='';sugerir();}
  F.canal='texto';renderSheet();
  setTimeout(()=>document.getElementById('mmonto')?.focus(),30);
}
function parseLocal(txt){
  const t=norm(txt);const out={};
  const mm=txt.match(/(\d[\d.,]*\s*(k|mil)?)/i);if(mm)out.monto=mm[1].replace(/\s/g,'');
  if(/\b(cobre|cobro|ingreso|me pagaron|sueldo|aguinaldo)\b/.test(t))out.tipo='ingreso';
  else if(/\b(devolucion|reembolso|me devolvieron)\b/.test(t))out.tipo='reembolso';else out.tipo='gasto';
  const alias={mp:'mercado pago',efvo:'efectivo',cash:'efectivo'};
  let best=null;for(const c of S.cuentas){const n=norm(c.nombre);if(t.includes(n))best=c;else for(const[a,v]of Object.entries(alias))if(new RegExp('\\b'+a+'\\b').test(t)&&n.includes(v))best=best||c;}
  if(best)out.cuenta=best.id;
  if(/\bayer\b/.test(t)){const d=new Date(today()+'T12:00');d.setDate(d.getDate()-1);out.fecha=d.toISOString().slice(0,10);}
  if(/\b(impulsiv|bolucompra)/.test(t))out.impulsiva=true;
  const cu=t.match(/(\d+)\s*cuotas/);if(cu)out.cuotas=Number(cu[1]);
  let rest=txt.replace(mm?mm[0]:'','').replace(/\b(mp|efvo|ayer|hoy|en|con|de|por|cuotas?|\d+)\b/gi,' ');
  if(best)rest=rest.replace(new RegExp(best.nombre.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),' ');
  rest=rest.replace(/\s+/g,' ').trim();if(rest)out.comercio=rest.charAt(0).toUpperCase()+rest.slice(1);
  return out;
}

/* ============ Cuentas: alta, edición, conciliación ============ */
let A=null;
function abrirCuenta(c,pre){
  A=c?{...c,saldoTxt:fNum.format((c.saldoIni||0)/100),modo:'ver'}:{nombre:pre?.n||'',tipo:pre?.t||'banco',moneda:pre?.m||'ARS',institucion:'',saldoTxt:'',fechaIni:today(),obs:'',modo:'nuevo'};
  renderCuenta();
}
function renderCuenta(){
  const md=document.getElementById('modal');if(!A){md.innerHTML='';document.body.style.overflow='';return;}
  document.body.style.overflow='hidden';
  const nuevo=A.modo==='nuevo';const s=A.id?saldo(A):0;const cu=A.id&&A.tipo==='tarjeta'?cuotasPend(A):null;
  md.innerHTML=`<div class="scrim" data-act="cerrarFondo"><div class="sheet" role="dialog" aria-modal="true" aria-label="Cuenta">
   <div style="display:flex;justify-content:space-between;align-items:center"><h2>${nuevo?'Nueva cuenta':esc(A.nombre)}</h2><button class="btn sm ghost" data-act="cerrar">Cerrar</button></div>
   ${A.id?`<div class="kpi"><span class="lbl">Saldo calculado hoy</span><span class="v">${moneyH(s,A.moneda)}</span><span class="hint">Saldo inicial ${esc(money(A.saldoIni,A.moneda))} al ${dmy(A.fechaIni)} más los movimientos desde esa fecha.</span></div>
    ${cu&&cu.items.length?`<div class="card"><h3 style="margin-bottom:8px">Cuotas pendientes · ${esc(money(cu.tot,A.moneda))}</h3>${cu.items.map(i=>`<div class="small" style="display:flex;justify-content:space-between;padding:3px 0"><span>${esc(i.m.comercio||i.m.desc||'Compra')} · quedan ${i.rest} de ${i.m.cuotas}</span><span class="num">${esc(money(i.cu,A.moneda))}/mes</span></div>`).join('')}<p class="small muted">Estimado: cuenta una cuota por mes desde el mes siguiente a la compra.</p></div>`:''}
    <div class="card"><h3>Conciliar con el saldo real</h3><p class="small muted" style="margin:4px 0 10px">Si la app de ${esc(A.institucion||A.nombre)} muestra otro saldo, escribilo. La diferencia se registra como un ajuste visible; el historial no se toca.</p>
     <div class="filters"><input id="creal" inputmode="decimal" placeholder="Saldo que ves hoy${PASIVO(A.tipo)?' (deuda en negativo)':''}"><button class="btn" data-act="conciliar">Conciliar</button></div></div>`:''}
   <div class="fgrid">
    <label class="f"><span>Nombre</span><input id="anombre" value="${esc(A.nombre)}" placeholder="Ej. Brubank, Visa Galicia"></label>
    <label class="f"><span>Institución</span><input id="ainst" value="${esc(A.institucion||'')}" placeholder="Opcional"></label>
    <label class="f"><span>Tipo</span><select id="atipo">${Object.entries(TIPOS_CUENTA).map(([k,n])=>`<option value="${k}" ${A.tipo===k?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f"><span>Moneda</span><select id="amon" ${A.id?'disabled':''}><option ${A.moneda==='ARS'?'selected':''}>ARS</option><option ${A.moneda==='USD'?'selected':''}>USD</option></select></label>
    <label class="f"><span>${PASIVO(A.tipo)?'Deuda inicial (lo que debés)':'Saldo inicial'}</span><input id="asaldo" inputmode="decimal" value="${esc(A.saldoTxt)}" placeholder="0"></label>
    <label class="f"><span>Fecha del saldo inicial</span><input id="afecha" type="date" value="${A.fechaIni}"></label>
    <label class="f full"><span>Observaciones</span><input id="aobs" value="${esc(A.obs||'')}"></label>
   </div>
   ${A.err?`<div class="note" role="alert">${esc(A.err)}</div>`:''}
   <div class="actions">${A.id?`<button class="btn" data-act="archivar">${A.archivada?'Desarchivar':'Archivar'}</button><button class="btn" data-act="verMovsCta">Ver movimientos</button>`:''}<button class="btn pri" data-act="guardarCuenta">${nuevo?'Crear cuenta':'Guardar'}</button></div>
  </div></div>`;
}
function leerCuenta(){const g=id=>document.getElementById(id)?.value;A.nombre=g('anombre')??A.nombre;A.institucion=g('ainst')??'';A.tipo=g('atipo')||A.tipo;if(!A.id)A.moneda=g('amon')||A.moneda;A.saldoTxt=g('asaldo')??'';A.fechaIni=g('afecha')||A.fechaIni;A.obs=g('aobs')??'';}
function guardarCuenta(){
  leerCuenta();A.err='';if(!A.nombre.trim()){A.err='Ponele un nombre a la cuenta.';return renderCuenta();}
  let s=A.saldoTxt.trim()?parseMonto(A.saldoTxt.replace('-','')):0;if(isNaN(s)){A.err='El saldo no se entiende. Ejemplo: 150.000,00';return renderCuenta();}
  if(PASIVO(A.tipo))s=-Math.abs(s);else if(/^\s*-/.test(A.saldoTxt))s=-s;
  const c={id:A.id||newId(),nombre:A.nombre.trim(),institucion:A.institucion.trim(),tipo:A.tipo,moneda:A.moneda,saldoIni:s,fechaIni:A.fechaIni,obs:A.obs,archivada:!!A.archivada,ultConc:A.ultConc||null,creado:A.creado||new Date().toISOString(),editado:new Date().toISOString()};
  const i=S.cuentas.findIndex(x=>x.id===c.id);if(i>=0)S.cuentas[i]=c;else S.cuentas.push(c);
  persist('cuentas',c);toast(A.id?'Cuenta guardada':'Cuenta creada');A=null;renderCuenta();render();
}
function cuentaRapida(n,t,m){
  const c={id:newId(),nombre:n,institucion:'',tipo:t,moneda:m,saldoIni:0,fechaIni:today(),obs:'',archivada:false,ultConc:null,creado:new Date().toISOString(),editado:new Date().toISOString()};
  S.cuentas.push(c);persist('cuentas',c);render();A={...c,saldoTxt:'',modo:'ver'};renderCuenta();toast(n+' creada. Cargá el saldo que tiene hoy.');
}
function conciliar(){
  const v=document.getElementById('creal')?.value||'';const neg=/^\s*-/.test(v);let r=parseMonto(v.replace('-',''));
  if(isNaN(r)){A.err='Escribí el saldo real. Ejemplo: 98.450,20';return renderCuenta();}
  if(neg)r=-r;const actual=saldo(A);const diff=r-actual;const ahora=new Date().toISOString();
  const cta=S.cuentas.find(x=>x.id===A.id);cta.ultConc=today();persist('cuentas',cta);
  if(diff===0){toast('El saldo coincide. Conciliada.');A=null;renderCuenta();render();return;}
  const doc={id:newId(),tipo:'ajuste',monto:Math.abs(diff),moneda:A.moneda,fecha:today(),hora:nowTime(),lineas:[{cuenta:A.id,monto:diff,moneda:A.moneda}],cat:null,sub:'',comercio:'',desc:'Conciliación: saldo informado '+money(r,A.moneda),tags:[],impulsiva:false,cuotas:1,estado:'activo',canal:'app',creado:ahora,editado:ahora,historial:[{t:ahora,a:`Ajuste por conciliación: calculado ${money(actual,A.moneda)}, real ${money(r,A.moneda)}`}]};
  upsertLocal(doc);persist('movimientos',doc);toast('Ajuste de '+money(diff,A.moneda)+' registrado');A=null;renderCuenta();render();
}

/* ============ Config ============ */
function saveCfg(patch){Object.assign(S.cfg,patch);const snap=JSON.parse(JSON.stringify(S.cfg));persist('config',snap);}
async function exportar(fmt){
  let data,filename;
  if(fmt==='json'){data=JSON.stringify({app:'Mi Patrimonio',version:1,exportado:new Date().toISOString(),config:S.cfg,cuentas:S.cuentas,movimientos:S.movs,cotizaciones:S.cotizMan},null,2);filename=`mi-patrimonio-respaldo-${today()}.json`;}
  else{const cs=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const num=c=>(c/100).toFixed(2).replace('.',',');
    data='﻿'+['Fecha;Tipo;Estado;Importe;Moneda;Cuenta;Cuenta destino;Categoría;Subcategoría;Comercio;Descripción;Etiquetas;Bolucompra;Cuotas'].concat(S.movs.map(m=>[dmy(m.fecha),m.tipo,m.estado,num(m.lineas[0]?.monto??m.monto),m.moneda,cuentaById(m.lineas[0]?.cuenta)?.nombre,cuentaById(m.lineas[1]?.cuenta)?.nombre,catById(m.cat)?.n,m.sub,m.comercio,m.desc,(m.tags||[]).join(', '),m.impulsiva?'Sí':'',m.cuotas].map(cs).join(';'))).join('\r\n');
    filename=`mi-patrimonio-movimientos-${today()}.csv`;}
  const type=fmt==='json'?'application/json':'text/csv';
  const file=new File([data],filename,{type});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:filename});return;} }
  catch(e){ if(e?.name==='AbortError')return; }
  const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Archivo descargado');
}

/* ============ Toast ============ */
let tt;function toast(t){const e=document.getElementById('toast');e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,2600);}

/* ============ Eventos ============ */
document.addEventListener('click',async e=>{
  const go=e.target.closest('[data-go]');if(go){S.view=go.dataset.go;try{localStorage.setItem('mp_view',S.view)}catch(_){}F=null;A=null;renderSheet();render();scrollTo(0,0);return;}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='cerrarFondo'&&e.target!==b)return;
  switch(a){
   case'nuevo':if(!S.cuentas.length){toast('Primero creá una cuenta.');S.view='cuentas';render();return;}abrirMov(null);break;
   case'cerrar':case'cerrarFondo':F=null;A=null;document.getElementById('modal').innerHTML='';document.body.style.overflow='';break;
   case'mes':S.month=addMonths(S.month,Number(b.dataset.n));render();break;
   case'filtCat':S.filt={q:'',tipo:'',cat:b.dataset.cat,cuenta:''};S.view='movs';render();scrollTo(0,0);break;
   case'verpend':S.filt={q:'',tipo:'pend',cat:'',cuenta:''};S.view='movs';render();break;
   case'limpiar':S.filt={q:'',tipo:'',cat:'',cuenta:''};render();break;
   case'editar':{const m=S.movs.find(x=>x.id===b.dataset.id);if(m)abrirMov(m);break;}
   case'tipo':leerForm();if(F.tipo!==b.dataset.t){const wasIng=F.tipo==='ingreso',isIng=b.dataset.t==='ingreso';F.tipo=b.dataset.t;if(wasIng!==isIng){F.cat='';F.sub='';F.catManual=false;F.sugerida='';sugerir();}}renderSheet();break;
   case'cat':leerForm();F.cat=F.cat===b.dataset.id?'':b.dataset.id;F.sub='';F.catManual=true;F.sugerida='';renderSheet();break;
   case'interpretar':interpretar();break;
   case'guardar':guardar(!!b.dataset.otro);break;
   case'anular':leerForm();F.confirm=true;renderSheet();break;
   case'noAnular':F.confirm=false;renderSheet();break;
   case'siAnular':anular(false);break;
   case'restaurar':anular(true);break;
   case'cuentaNueva':abrirCuenta(null);break;
   case'cuentaRapida':cuentaRapida(b.dataset.n,b.dataset.t,b.dataset.m);break;
   case'verCuenta':abrirCuenta(cuentaById(b.dataset.id));break;
   case'guardarCuenta':guardarCuenta();break;
   case'conciliar':leerCuenta();conciliar();break;
   case'archivar':{leerCuenta();A.archivada=!A.archivada;guardarCuenta();break;}
   case'verMovsCta':S.filt={q:'',tipo:'',cat:'',cuenta:A.id};S.view='movs';A=null;renderCuenta();render();break;
   case'addCotiz':{const f=document.getElementById('cfecha').value;const c=parseMonto(document.getElementById('cventa').value);if(!f||!(c>0)){toast('Completá la fecha y el valor de venta.');return;}
     const v=c/100;const doc={fecha:f,venta:v,fuente:'manual'};const i=S.cotizMan.findIndex(x=>x.fecha===f);if(i>=0)S.cotizMan[i]=doc;else S.cotizMan.push(doc);
     mergeCotiz();persist('cotizaciones',doc);toast('Cotización del '+dmy(f)+' guardada');render();break;}
   case'actDolar':actualizarDolar(true);break;
   case'salir':salir();break;
   case'reintentar':start();break;
   case'syncAhora':flush().then(pull).then(()=>{toast('Sincronizado');render()}).catch(()=>{});break;
   case'login':case'signup':login(a==='signup');break;
   case'verPass':{const i=document.getElementById('lpass');i.type=i.type==='password'?'text':'password';break;}
   case'delCotiz':{const f=b.dataset.id;S.cotizMan=S.cotizMan.filter(x=>x.fecha!==f);mergeCotiz();persist('cotizaciones',{fecha:f},'delete');toast('Cotización manual borrada');render();break;}
   case'saveNombre':{const n=document.getElementById('nombre').value.trim()||'Mi Patrimonio';saveCfg({nombre:n});toast('Nombre guardado');render();break;}
   case'nuevaSub':{
     const id=b.dataset.id;const wrap=b.parentElement.parentElement;if(wrap.querySelector('.subin'))return;
     wrap.insertAdjacentHTML('beforeend',`<div class="filters subin" style="margin-top:6px"><input placeholder="Nombre de la subcategoría" id="sub-${id}"><button class="btn sm" data-act="okSub" data-id="${id}">Agregar</button></div>`);document.getElementById('sub-'+id).focus();break;}
   case'okSub':{const id=b.dataset.id;const v=document.getElementById('sub-'+id).value.trim();if(!v)return;const cats=cfg().cats.map(c=>c.id===id?{...c,s:[...c.s,v]}:c);saveCfg({cats});toast('Subcategoría agregada');render();break;}
   case'nuevaCat':{const wrap=b.closest('.card');if(wrap.querySelector('.catin'))return;
     wrap.querySelector('.card-h').insertAdjacentHTML('afterend',`<div class="filters catin" style="margin-bottom:10px"><input id="ncn" placeholder="Nombre"><select id="nck"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select><input id="ncc" type="color" value="#4c8c7a" style="max-width:60px;padding:2px"><button class="btn sm pri" data-act="okCat">Crear</button></div>`);document.getElementById('ncn').focus();break;}
   case'okCat':{const n=document.getElementById('ncn').value.trim();if(!n)return;const id='c'+uid().slice(-6);saveCfg({cats:[...cfg().cats,{id,n,k:document.getElementById('nck').value,c:document.getElementById('ncc').value,s:[]}]});toast('Categoría creada');render();break;}
   case'addRegla':{const p=document.getElementById('rp').value.trim();if(!p)return;const cat=document.getElementById('rc').value;const c=catById(cat);const s=document.getElementById('rs').value.trim();
     if(s&&!c.s.includes(s)){toast('Esa subcategoría no existe en '+c.n+'.');return;}
     saveCfg({reglas:[{p:norm(p),cat,sub:s},...cfg().reglas]});toast('Regla agregada');render();break;}
   case'delRegla':{const r=[...cfg().reglas];r.splice(Number(b.dataset.i),1);saveCfg({reglas:r});render();break;}
   case'export':exportar(b.dataset.f);break;
  }
});
document.addEventListener('input',e=>{
  if(!F)return;const id=e.target.id;
  if(id==='mcomercio'||id==='mdesc'){F[id==='mcomercio'?'comercio':'desc']=e.target.value;if(!F.catManual){const prev=F.cat;sugerir();if(F.cat!==prev){const pos=e.target.selectionStart;leerForm();renderSheet();const el=document.getElementById(id);el.focus();el.setSelectionRange(pos,pos);}}}
});
document.addEventListener('change',e=>{
  const id=e.target.id;
  if(F&&(id==='mcuenta'||id==='mhacia'||id==='mfecha'||id==='mcuotas')){leerForm();renderSheet();}
  if(A&&id==='atipo'){leerCuenta();renderCuenta();}
  if(id==='ftipo'||id==='fcat'||id==='fcta'){S.filt={...S.filt,tipo:document.getElementById('ftipo').value,cat:document.getElementById('fcat').value,cuenta:document.getElementById('fcta').value};render();}
  if(e.target.dataset.presu){const k=e.target.dataset.presu;const v=e.target.value.trim();const c=v?parseMonto(v):0;if(isNaN(c)){toast('Importe no válido');return;}
    const presu=JSON.parse(JSON.stringify(cfg().presu||{total:0,cat:{}}));presu.cat=presu.cat||{};if(k==='_total')presu.total=c;else{if(c)presu.cat[k]=c;else delete presu.cat[k];}saveCfg({presu});toast('Presupuesto guardado');render();}
});
let fqT;document.addEventListener('input',e=>{if(e.target.id==='fq'){clearTimeout(fqT);const v=e.target.value;fqT=setTimeout(()=>{S.filt.q=v;render();const el=document.getElementById('fq');el.focus();el.setSelectionRange(v.length,v.length);},250);}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(F||A)){F=null;A=null;document.getElementById('modal').innerHTML='';document.body.style.overflow='';}
  if(e.key==='Enter'&&e.target.id==='mtexto'){e.preventDefault();interpretar();}
  if(e.key==='Enter'&&e.target.id==='mmonto'&&F){e.preventDefault();guardar(false);}
});

/* ============ Almacenamiento en el teléfono (IndexedDB) ============
   Todo se guarda primero en el teléfono y se sube a Supabase cuando hay conexión.
   La base de Supabase es la fuente de verdad; esto es una copia para usar sin señal. */
const IDB={db:null,
  open(){if(this.db)return Promise.resolve(this.db);return new Promise((ok,ko)=>{const r=indexedDB.open('mi-patrimonio',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{this.db=r.result;ok(this.db)};r.onerror=()=>ko(r.error);});},
  async get(k){try{const db=await this.open();return await new Promise((ok,ko)=>{const t=db.transaction('kv').objectStore('kv').get(k);t.onsuccess=()=>ok(t.result);t.onerror=()=>ko(t.error);});}catch(e){console.warn(e);return null}},
  async set(k,v){try{const db=await this.open();await new Promise((ok,ko)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=ok;t.onerror=()=>ko(t.error);});}catch(e){console.warn(e)}},
};
let OUT=[]; // cambios pendientes de subir, en orden
let saveT;
function saveCache(){clearTimeout(saveT);saveT=setTimeout(()=>{if(!USER)return;IDB.set('state',{uid:USER.id,cfg:S.cfg,cfgExists:S.cfgExists,cuentas:S.cuentas,movs:S.movs,cotizMan:S.cotizMan,cotizBna:S.cotizBna,lastMov:S.lastMov,lastSync:S.lastSync});},250);}
function saveOut(){if(USER)IDB.set('outbox',{uid:USER.id,items:OUT});}

function mergeCotiz(){
  const m=new Map();
  for(const c of S.cotizBna)m.set(c.fecha,{fecha:c.fecha,venta:Number(c.venta),fuente:c.fuente||'Banco Nación',manual:false});
  for(const c of S.cotizMan)m.set(c.fecha,{fecha:c.fecha,venta:Number(c.venta),fuente:'manual',manual:true});
  S.cotiz=[...m.values()];
}

/* Registrar un cambio: queda en el teléfono al instante y se sube en segundo plano. */
function persist(table,row,op='upsert',batch=false){
  const key=table==='config'?'config':table==='cotizaciones'?'cot:'+row.fecha:table+':'+row.id;
  OUT=OUT.filter(x=>x.key!==key);
  OUT.push({key,table,op,row:JSON.parse(JSON.stringify(row))});
  if(table==='config')S.cfgExists=true;
  if(!batch){saveOut();saveCache();flush();updSync();}
}

let flushing=false;
async function flush(){
  if(flushing||!SB||!USER||!OUT.length){updSync();return;}
  if(!navigator.onLine){updSync();return;}
  flushing=true;
  try{
    while(OUT.length){
      const first=OUT[0];
      // agrupa movimientos o cuentas consecutivos en una sola llamada
      let grupo=[first];
      if(first.op==='upsert'&&(first.table==='movimientos'||first.table==='cuentas')){
        grupo=[];for(const it of OUT){if(it.table!==first.table||it.op!=='upsert'||grupo.length>=200)break;grupo.push(it);}
      }
      const {error}=await send(grupo);
      if(error){S.syncErr=error.message||String(error);break;}
      for(const it of grupo){const i=OUT.indexOf(it);if(i>=0)OUT.splice(i,1);}
      S.syncErr='';saveOut();
    }
  }catch(e){S.syncErr=e.message||String(e);}
  flushing=false;updSync();
}
function send(grupo){
  const u=USER.id,it=grupo[0],r=it.row;
  switch(it.table){
    case'movimientos':return SB.from('movimientos').upsert(grupo.map(g=>({id:g.row.id,user_id:u,fecha:g.row.fecha,tipo:g.row.tipo,estado:g.row.estado==='anulado'?'anulado':'activo',data:g.row})),{onConflict:'id'});
    case'cuentas':return SB.from('cuentas').upsert(grupo.map(g=>({id:g.row.id,user_id:u,data:g.row})),{onConflict:'id'});
    case'config':return SB.from('config').upsert({user_id:u,data:r},{onConflict:'user_id'});
    case'cotizaciones':return it.op==='delete'
      ?SB.from('cotizaciones').delete().eq('user_id',u).eq('fecha',r.fecha)
      :SB.from('cotizaciones').upsert({user_id:u,fecha:r.fecha,venta:r.venta,fuente:'manual'},{onConflict:'user_id,fecha'});
  }
  return Promise.resolve({error:null});
}

/* Traer lo que hay en el servidor (los movimientos, solo lo nuevo desde la última vez). */
async function pull(){
  if(!SB||!USER||!navigator.onLine)return;
  const u=USER.id;
  const [c1,c2,c3,c4]=await Promise.all([
    SB.from('config').select('data').eq('user_id',u).maybeSingle(),
    SB.from('cuentas').select('data').eq('user_id',u),
    SB.from('cotizaciones').select('fecha,venta,fuente').eq('user_id',u),
    SB.from('cotizaciones_bna').select('fecha,venta,compra,fuente').order('fecha',{ascending:false}).limit(800)]);
  const err=c1.error||c2.error||c3.error||c4.error;if(err)throw err;
  if(c1.data){S.cfg={...structuredClone(DEF_CFG),...c1.data.data};S.cfgExists=true;}
  S.cuentas=c2.data.map(x=>x.data).sort((a,b)=>(a.creado||'').localeCompare(b.creado||''));
  S.cotizMan=c3.data;S.cotizBna=c4.data;
  const since=S.lastMov;const idx=new Map(S.movs.map((m,i)=>[m.id,i]));
  for(let page=0;;page++){
    let qq=SB.from('movimientos').select('data,updated_at').eq('user_id',u).order('updated_at',{ascending:true}).range(page*1000,page*1000+999);
    if(since)qq=qq.gt('updated_at',since);
    const {data,error}=await qq;if(error)throw error;
    for(const row of data){const m=row.data;if(idx.has(m.id))S.movs[idx.get(m.id)]=m;else{idx.set(m.id,S.movs.length);S.movs.push(m);}
      if(!S.lastMov||row.updated_at>S.lastMov)S.lastMov=row.updated_at;}
    if(data.length<1000)break;
  }
  applyOutbox();sortMovs();mergeCotiz();S.lastSync=Date.now();S.syncErr='';saveCache();
}
/* Lo pendiente en el teléfono pisa a lo que vino del servidor. */
function applyOutbox(){
  for(const it of OUT){const r=it.row;
    if(it.table==='movimientos'){const i=S.movs.findIndex(m=>m.id===r.id);if(i>=0)S.movs[i]=r;else S.movs.push(r);}
    else if(it.table==='cuentas'){const i=S.cuentas.findIndex(c=>c.id===r.id);if(i>=0)S.cuentas[i]=r;else S.cuentas.push(r);}
    else if(it.table==='config'){S.cfg={...structuredClone(DEF_CFG),...r};}
    else if(it.table==='cotizaciones'){S.cotizMan=S.cotizMan.filter(c=>c.fecha!==r.fecha);if(it.op!=='delete')S.cotizMan.push(r);}
  }
}
function syncBadgeH(){
  if(!USER)return'';
  if(!navigator.onLine)return `<span class="chip warn">Sin conexión${OUT.length?' · '+OUT.length+' sin subir':''}</span>`;
  if(OUT.length)return `<span class="chip warn">${OUT.length} cambios sin subir</span>`;
  return '';
}
function updSync(){
  document.querySelectorAll('.syncbadge').forEach(e=>e.innerHTML=syncBadgeH());
  const ae=document.activeElement;
  if(S.view==='ajustes'&&!F&&!A&&S.status==='ok'&&!(ae&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName)))render();
}

/* ============ Dólar BNA automático ============ */
async function actualizarDolar(manual){
  if(!navigator.onLine){if(manual)toast('Sin conexión. Probá cuando tengas señal.');return;}
  try{
    const r=await fetch('/api/dolar'+(manual?'?forzar=1':''),{cache:'no-store'});const j=await r.json();
    if(!r.ok)throw new Error(j.error||'No se pudo actualizar el dólar');
    const row={fecha:j.fecha,venta:Number(j.venta),compra:j.compra,fuente:j.fuente};
    const i=S.cotizBna.findIndex(c=>c.fecha===row.fecha);if(i>=0)S.cotizBna[i]=row;else S.cotizBna.push(row);
    mergeCotiz();saveCache();if(!F&&!A)render();
    if(manual)toast(`Dólar venta ${fARS.format(row.venta)} al ${dmy(row.fecha)} · ${row.fuente}`);
  }catch(e){if(manual)toast(e.message||'No se pudo actualizar el dólar');}
}

/* ============ Ingreso ============ */
function vLogin(){
  return `<div class="login">
   <div class="brand"><i>$</i>${esc(cfg().nombre||'Mi Patrimonio')}</div>
   <p class="muted" style="margin:0">Ingresá con tu email y contraseña. La primera vez, tocá “Crear cuenta”.</p>
   <label class="f"><span>Email</span><input id="lemail" type="email" autocomplete="username" inputmode="email" autocapitalize="off" value="${esc(S.loginEmail||'')}"></label>
   <label class="f"><span>Contraseña</span><input id="lpass" type="password" autocomplete="current-password" placeholder="Mínimo 8 caracteres"></label>
   <button class="btn ghost sm" style="align-self:flex-start" data-act="verPass">Mostrar u ocultar contraseña</button>
   ${S.loginErr?`<div class="note" role="alert">${esc(S.loginErr)}</div>`:''}
   ${S.loginInfo?`<div class="note info">${esc(S.loginInfo)}</div>`:''}
   <div class="actions"><button class="btn" data-act="signup">Crear cuenta</button><button class="btn pri" data-act="login">Ingresar</button></div>
  </div>`;
}
function traducir(m=''){
  if(/Invalid login/i.test(m))return'Email o contraseña incorrectos.';
  if(/already registered|already exists/i.test(m))return'Ese email ya tiene una cuenta. Tocá “Ingresar”.';
  if(/Signups not allowed|signup.*disabled/i.test(m))return'La creación de cuentas está desactivada.';
  if(/Email not confirmed/i.test(m))return'Todavía no confirmaste el email. Revisá tu correo.';
  if(/fetch|network/i.test(m))return'No hay conexión con el servidor. Revisá tu internet.';
  return m;
}
async function login(nueva){
  const email=document.getElementById('lemail').value.trim(),pass=document.getElementById('lpass').value;
  S.loginEmail=email;S.loginErr='';S.loginInfo='';
  if(!email||pass.length<8){S.loginErr='Escribí tu email y una contraseña de al menos 8 caracteres.';return render();}
  const btns=document.querySelectorAll('.login .btn');btns.forEach(b=>b.disabled=true);
  const {data,error}=nueva?await SB.auth.signUp({email,password:pass}):await SB.auth.signInWithPassword({email,password:pass});
  if(error){S.loginErr=traducir(error.message);return render();}
  if(nueva&&!data.session){S.loginInfo='Te mandamos un email para confirmar la cuenta. Abrí el link, volvé a esta app y tocá “Ingresar”.';return render();}
  await entrar(data.session.user);
}
async function salir(){
  if(OUT.length){toast('Hay '+OUT.length+' cambios sin subir. Conectate a internet antes de cerrar sesión.');return;}
  await IDB.set('state',null);await IDB.set('outbox',null);
  try{localStorage.removeItem('mp_user')}catch(_){}
  await SB.auth.signOut();USER=null;S.status='login';render();
}
async function entrar(user){
  USER={id:user.id,email:user.email};
  try{localStorage.setItem('mp_user',JSON.stringify(USER))}catch(_){}
  const cache=await IDB.get('state'),ob=await IDB.get('outbox');
  const tuvo=!!(cache&&cache.uid===user.id);
  if(tuvo)Object.assign(S,{cfg:{...structuredClone(DEF_CFG),...cache.cfg},cfgExists:cache.cfgExists,cuentas:cache.cuentas||[],movs:cache.movs||[],cotizMan:cache.cotizMan||[],cotizBna:cache.cotizBna||[],lastMov:cache.lastMov||null,lastSync:cache.lastSync||null});
  else Object.assign(S,{cfg:structuredClone(DEF_CFG),cfgExists:false,cuentas:[],movs:[],cotizMan:[],cotizBna:[],lastMov:null,lastSync:null});
  OUT=(ob&&ob.uid===user.id&&Array.isArray(ob.items))?ob.items:[];
  applyOutbox();sortMovs();mergeCotiz();
  S.status=tuvo?'ok':'loading';render();
  try{await flush();await pull();}
  catch(e){console.warn(e);S.syncErr=traducir(e.message||String(e));
    if(!tuvo&&navigator.onLine){S.status='error';S.errMsg='No se pudieron traer tus datos: '+S.syncErr;render();return;}}
  S.status='ok';try{migrarCats()}catch(e){console.error(e)}
  render();actualizarDolar(false);
}

/* ============ Importar respaldo ============ */
async function importar(file){
  let j;try{j=JSON.parse(await file.text());}catch(e){toast('El archivo no es un JSON válido.');return;}
  if(!j||!Array.isArray(j.movimientos)||!Array.isArray(j.cuentas)){toast('El archivo no es un respaldo de Mi Patrimonio.');return;}
  let nc=0,nm=0,nq=0;const ahora=new Date().toISOString();
  if(j.config&&typeof j.config==='object'){
    if(!S.cfgExists){S.cfg={...structuredClone(DEF_CFG),...j.config};persist('config',S.cfg,'upsert',true);}
    else{const mem={...(j.config.memoria||{}),...(cfg().memoria||{})};S.cfg.memoria=mem;persist('config',S.cfg,'upsert',true);}
  }
  for(const c of j.cuentas){if(!c||!c.id||cuentaById(c.id))continue;S.cuentas.push(c);persist('cuentas',c,'upsert',true);nc++;}
  const ids=new Set(S.movs.map(m=>m.id));
  for(const m0 of j.movimientos){
    if(!m0||!m0.id||ids.has(m0.id)||!Array.isArray(m0.lineas)||!/^\d{4}-\d{2}-\d{2}$/.test(m0.fecha||'')||!m0.tipo)continue;
    const m={...m0,estado:m0.estado==='anulado'?'anulado':'activo',historial:[...(m0.historial||[]),{t:ahora,a:'Importado desde respaldo'}].slice(-30)};
    S.movs.push(m);ids.add(m.id);persist('movimientos',m,'upsert',true);nm++;
  }
  for(const c of (j.cotizaciones||[])){if(!c?.fecha||!(Number(c.venta)>0)||S.cotizMan.some(x=>x.fecha===c.fecha))continue;const r={fecha:c.fecha,venta:Number(c.venta),fuente:'manual'};S.cotizMan.push(r);persist('cotizaciones',r,'upsert',true);nq++;}
  sortMovs();mergeCotiz();saveOut();saveCache();
  try{migrarCats()}catch(e){console.error(e)}
  toast(`Importado: ${nc} cuentas, ${nm} movimientos y ${nq} cotizaciones`);render();flush();
}
document.addEventListener('change',e=>{if(e.target.id==='importFile'&&e.target.files[0]){importar(e.target.files[0]);e.target.value='';}});

/* ============ Arranque ============ */
async function cargarConfig(){
  try{const r=await fetch('/api/config',{cache:'no-store'});const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'HTTP '+r.status);
    try{localStorage.setItem('mp_conf',JSON.stringify(j))}catch(_){} return j;}
  catch(e){let c=null;try{c=JSON.parse(localStorage.getItem('mp_conf'))}catch(_){} if(c)return c;throw e;}
}
let authSub=false;
async function start(){
  S.status='loading';render();
  try{
    if(!SB){CONF=await cargarConfig();
      SB=window.supabase.createClient(CONF.url,CONF.anonKey,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'mp-auth'}});}
  }catch(e){S.status='error';S.errMsg='No se encontró la configuración del servidor. '+(e.message||'');render();return;}
  if(!authSub){authSub=true;SB.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT'&&USER){USER=null;S.status='login';render();}});}
  let session=null;try{({data:{session}}=await SB.auth.getSession());}catch(e){}
  if(session?.user){await entrar(session.user);return;}
  // sin señal y con la sesión vencida: abrir igual con los datos del teléfono
  let lastU=null;try{lastU=JSON.parse(localStorage.getItem('mp_user'))}catch(_){}
  if(!navigator.onLine&&lastU){await entrar(lastU);return;}
  S.status='login';render();
}
addEventListener('online',()=>{flush().then(pull).then(()=>{if(!F&&!A)render()}).catch(()=>{});updSync();});
addEventListener('offline',updSync);
let lastVis=0;
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||!USER)return;
  if(Date.now()-lastVis<30000)return;lastVis=Date.now();
  flush().then(pull).then(()=>{if(!F&&!A)render()}).catch(()=>{});actualizarDolar(false);
});
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.warn));
start();
