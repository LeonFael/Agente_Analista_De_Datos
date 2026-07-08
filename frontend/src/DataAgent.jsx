import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#2a78d6","#1baf7a","#eda100","#4a3aa7","#e34948","#eb6834","#e87ba4","#008300"];
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const PROVIDER_META = {
  claude: { sub: "Anthropic · configurado en servidor", needsKey: false },
  gemini: { sub: "Google · requiere tu API key", needsKey: true },
};

export default function DataAgent() {
  const [step, setStep] = useState("config");
  const [providers, setProviders] = useState([]);
  const [formats, setFormats] = useState([]);
  const [provider, setProvider] = useState("claude");
  const [apiKey, setApiKey] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const [pRes, fRes] = await Promise.all([
          fetch(`${API_BASE}/api/providers`),
          fetch(`${API_BASE}/api/formats`),
        ]);
        if (!pRes.ok || !fRes.ok) throw new Error("No se pudo conectar con el backend");
        const [pData, fData] = await Promise.all([pRes.json(), fRes.json()]);
        setProviders(pData.providers || []);
        setFormats(fData.formats || []);
        if (pData.providers?.length) setProvider(pData.providers[0].id);
      } catch (e) {
        setMetaError(e.message);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const currentMeta = PROVIDER_META[provider] || { sub: "Proveedor IA", needsKey: true };
  const providerLabel = providers.find(p => p.id === provider)?.label ?? provider;

  const runAnalysis = async (file) => {
    setStep("analyzing");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("provider", provider);
      if (currentMeta.needsKey) fd.append("apiKey", apiKey);
      const res = await fetch(`${API_BASE}/api/analyze`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar");
      setAnalysis(data.analysis);
      setStep("dashboard");
    } catch (e) {
      setError(e.message);
      setStep("upload");
    }
  };

  const handleFile = (file) => { setFileName(file.name); runAnalysis(file); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const handleInput = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

  const exportHTML = () => {
    if (!analysis) return;
    const chartsJS = analysis.charts.map((c, i) => `
new Chart(document.getElementById('c${i}'),{type:'${c.tipo==="pie"?"doughnut":c.tipo}',
data:{labels:${JSON.stringify(c.datos.map(d=>d.label))},datasets:[{label:'${c.titulo}',
data:${JSON.stringify(c.datos.map(d=>d.valor))},
backgroundColor:${JSON.stringify(COLORS.slice(0,c.datos.length))},
borderColor:'${COLORS[i%COLORS.length]}',borderWidth:${c.tipo==="line"?2:0},borderRadius:4,
fill:false}]},options:{responsive:true,maintainAspectRatio:false,
plugins:{legend:{display:${c.tipo==="pie"}}}}});`).join("\n");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${analysis.summary.titulo}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#f5f5f3;padding:24px;max-width:1100px;margin:0 auto}
h1{font-size:22px;font-weight:600;margin-bottom:4px}.meta{font-size:12px;color:#888;margin-bottom:20px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px}
.kpi{background:#fff;border-radius:10px;padding:14px}.kpi-l{font-size:11px;color:#888;margin-bottom:4px}.kpi-v{font-size:18px;font-weight:600}
.layout{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:start}
.summary{background:#fff;border-radius:10px;padding:16px}
.summary h2{font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.summary p{font-size:12px;color:#555;line-height:1.6;margin-bottom:12px}
.ins{list-style:none}.ins li{font-size:11px;color:#555;margin-bottom:8px;display:flex;gap:8px;align-items:flex-start}
.ins-n{width:18px;height:18px;border-radius:50%;background:#e6f1fb;color:#185fa5;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.charts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:#fff;border-radius:10px;padding:16px}.card:first-child{grid-column:1/-1}
.ct{font-size:13px;font-weight:600;margin-bottom:3px}.cs{font-size:11px;color:#888;margin-bottom:12px}
footer{text-align:center;font-size:11px;color:#aaa;margin-top:28px}
@media(max-width:680px){.layout{grid-template-columns:1fr}.charts{grid-template-columns:1fr}.card:first-child{grid-column:auto}}
</style></head><body>
<h1>${analysis.summary.titulo}</h1>
<p class="meta">Generado con Agente IA · ${providerLabel} · ${new Date().toLocaleDateString("es-CO")} · ${fileName}</p>
<div class="kpis">
  <div class="kpi"><div class="kpi-l">Registros</div><div class="kpi-v">${(analysis.summary.totalFilas||0).toLocaleString()}</div></div>
  <div class="kpi"><div class="kpi-l">Columnas</div><div class="kpi-v">${analysis.summary.totalColumnas}</div></div>
  ${analysis.summary.periodo?`<div class="kpi"><div class="kpi-l">Período</div><div class="kpi-v" style="font-size:13px">${analysis.summary.periodo}</div></div>`:""}
  <div class="kpi"><div class="kpi-l">Modelo IA</div><div class="kpi-v" style="font-size:13px">${providerLabel}</div></div>
</div>
<div class="layout">
  <div class="summary">
    <h2>Resumen</h2><p>${analysis.summary.descripcion}</p>
    <h2>Hallazgos clave</h2>
    <ul class="ins">${(analysis.summary.insights||[]).map((ins,i)=>`<li><span class="ins-n">${i+1}</span><span>${ins}</span></li>`).join("")}</ul>
  </div>
  <div class="charts">
    ${analysis.charts.map((c,i)=>`<div class="card"><p class="ct">${c.titulo}</p><p class="cs">${c.descripcion}</p><div style="position:relative;height:220px"><canvas id="c${i}"></canvas></div></div>`).join("")}
  </div>
</div>
<footer>Dashboard generado automáticamente · Agente Analista de Datos IA</footer>
<script>${chartsJS}</script>
</body></html>`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `dashboard-${fileName.replace(/\.[^.]+$/,"")}.html`;
    a.click();
  };

  const renderChart = (chart) => {
    const d = chart.datos || [];
    if (chart.tipo === "line") return (
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={d} margin={{top:4,right:8,left:-10,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
          <XAxis dataKey="label" tick={{fontSize:10}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false}/>
          <Tooltip formatter={v=>v.toLocaleString()}/>
          <Line type="monotone" dataKey="valor" stroke="#2a78d6" strokeWidth={2} dot={false} activeDot={{r:4}}/>
        </LineChart>
      </ResponsiveContainer>
    );
    if (chart.tipo === "pie") return (
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={d} dataKey="valor" nameKey="label" cx="50%" cy="45%" outerRadius={70} innerRadius={38}>
            {d.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
          </Pie>
          <Tooltip formatter={v=>v.toLocaleString()}/>
          <Legend iconSize={9} wrapperStyle={{fontSize:11}}/>
        </PieChart>
      </ResponsiveContainer>
    );
    return (
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={d} layout="vertical" margin={{top:0,right:8,left:4,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
          <XAxis type="number" tick={{fontSize:10}} tickLine={false} axisLine={false}/>
          <YAxis type="category" dataKey="label" tick={{fontSize:10}} width={90} tickLine={false} axisLine={false}/>
          <Tooltip formatter={v=>v.toLocaleString()}/>
          <Bar dataKey="valor" radius={[0,4,4,0]}>{d.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const card = (children) => (
    <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:"1.5rem",maxWidth:480,margin:"0 auto"}}>
      {children}
    </div>
  );

  /* CONFIG */
  if (step === "config") return (
    <div style={{fontFamily:"var(--font-sans)",padding:"1rem 0"}}>
      {card(<>
        <p style={{fontSize:18,fontWeight:500,margin:"0 0 4px"}}>Agente Analista de Datos</p>
        <p style={{fontSize:13,color:"var(--text-secondary)",margin:"0 0 1.5rem"}}>Sube un CSV o Excel y obtén un dashboard exportable generado por IA</p>

        <p style={{fontSize:13,fontWeight:500,margin:"0 0 8px"}}>Proveedor de IA</p>

        {loadingMeta && <p style={{fontSize:12,color:"var(--text-muted)",marginBottom:"1rem"}}>Conectando con el backend…</p>}
        {metaError && <div style={{background:"var(--bg-danger)",color:"var(--text-danger)",borderRadius:8,padding:"10px 12px",marginBottom:"1rem",fontSize:12}}>
          ⚠️ No se pudo conectar con el backend en <code>{API_BASE}</code>. ¿Está corriendo?
        </div>}

        {!loadingMeta && !metaError && (
          <div style={{display:"grid",gridTemplateColumns:providers.length>1?"1fr 1fr":"1fr",gap:8,marginBottom:"1.25rem"}}>
            {providers.map(p => {
              const meta = PROVIDER_META[p.id] || { sub:"Proveedor IA" };
              const active = provider === p.id;
              return (
                <div key={p.id} onClick={()=>setProvider(p.id)} style={{
                  border:active?"2px solid var(--border-accent)":"0.5px solid var(--border-strong)",
                  borderRadius:8,padding:"10px 14px",cursor:"pointer",
                  background:active?"var(--bg-accent)":"var(--surface-1)"
                }}>
                  <p style={{fontSize:14,fontWeight:500,color:active?"var(--text-accent)":"var(--text-primary)",margin:"0 0 2px"}}>{p.label}</p>
                  <p style={{fontSize:11,color:active?"var(--text-accent)":"var(--text-muted)",margin:0}}>{meta.sub}</p>
                </div>
              );
            })}
          </div>
        )}

        {currentMeta.needsKey ? (
          <div style={{marginBottom:"1.25rem"}}>
            <p style={{fontSize:13,fontWeight:500,margin:"0 0 6px"}}>API Key</p>
            <input type="password" placeholder="Pega tu API key aquí..." value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
            <p style={{fontSize:11,color:"var(--text-muted)",margin:"4px 0 0"}}>Solo se usa en esta sesión, no se almacena</p>
          </div>
        ) : !loadingMeta && !metaError && (
          <div style={{background:"var(--bg-success)",borderRadius:8,padding:"8px 12px",marginBottom:"1.25rem",fontSize:12,color:"var(--text-success)"}}>
            ✓ Listo — no necesitas configurar nada más
          </div>
        )}

        <button style={{width:"100%",padding:"10px 0",fontSize:14,fontWeight:500}}
          onClick={()=>setStep("upload")}
          disabled={loadingMeta||!!metaError||(currentMeta.needsKey&&!apiKey)}>
          Continuar →
        </button>
      </>)}
    </div>
  );

  /* UPLOAD */
  if (step === "upload") return (
    <div style={{fontFamily:"var(--font-sans)",padding:"1rem 0"}}>
      {error && <div style={{background:"var(--bg-danger)",color:"var(--text-danger)",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12}}>⚠️ {error}</div>}
      <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}
        onClick={()=>fileRef.current?.click()}
        style={{border:`2px dashed ${dragOver?"var(--border-accent)":"var(--border-strong)"}`,borderRadius:12,padding:"3.5rem 2rem",
          textAlign:"center",cursor:"pointer",background:dragOver?"var(--bg-accent)":"var(--surface-2)",transition:"all .15s"}}>
        <div style={{fontSize:40,marginBottom:14}}>📂</div>
        <p style={{fontSize:15,fontWeight:500,margin:"0 0 6px"}}>Arrastra tu archivo aquí</p>
        <p style={{fontSize:13,color:"var(--text-secondary)",margin:"0 0 18px"}}>o haz clic para explorar</p>
        <span style={{background:"var(--surface-1)",border:"0.5px solid var(--border-strong)",borderRadius:6,padding:"4px 14px",fontSize:12,color:"var(--text-muted)"}}>
          {formats.length ? formats.map(f=>f.toUpperCase()).join(" · ") : "CSV · XLSX · XLS"}
        </span>
        <input ref={fileRef} type="file"
          accept={formats.length ? formats.map(f=>`.${f}`).join(",") : ".csv,.xlsx,.xls"}
          style={{display:"none"}} onChange={handleInput}/>
      </div>
      <p style={{textAlign:"center",marginTop:12,fontSize:12,color:"var(--text-muted)"}}>
        <span style={{cursor:"pointer",color:"var(--text-secondary)"}} onClick={()=>setStep("config")}>← Cambiar proveedor</span>
        <span style={{margin:"0 8px"}}>·</span>{providerLabel}
      </p>
    </div>
  );

  /* ANALYZING */
  if (step === "analyzing") return (
    <div style={{padding:"4rem 0",textAlign:"center"}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid var(--border-strong)",borderTopColor:"var(--fill-accent)",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{fontSize:15,fontWeight:500,margin:"0 0 6px"}}>Analizando {fileName}…</p>
      <p style={{fontSize:13,color:"var(--text-secondary)",margin:"0 0 4px"}}>La IA está procesando tu dataset</p>
      <p style={{fontSize:12,color:"var(--text-muted)"}}>Proveedor: {providerLabel}</p>
    </div>
  );

  /* DASHBOARD */
  if (step === "dashboard" && analysis) return (
    <div style={{fontFamily:"var(--font-sans)",padding:"1rem 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
        <div>
          <p style={{fontSize:16,fontWeight:500,margin:"0 0 2px"}}>{analysis.summary.titulo}</p>
          <p style={{fontSize:12,color:"var(--text-muted)",margin:0}}>{providerLabel} · {fileName}</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setStep("upload");setAnalysis(null);setFileName("");}} style={{fontSize:12,padding:"6px 12px"}}>📂 Nuevo archivo</button>
          <button onClick={()=>setStep("config")} style={{fontSize:12,padding:"6px 12px"}}>⚙️ Proveedor</button>
          <button onClick={exportHTML} style={{fontSize:12,padding:"6px 14px",background:"var(--fill-accent)",color:"#fff",border:"none"}}>⬇ Exportar HTML</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:"1rem"}}>
        {[["Registros",(analysis.summary.totalFilas||0).toLocaleString()],["Columnas",analysis.summary.totalColumnas],
          ...(analysis.summary.periodo?[["Período",analysis.summary.periodo]]:[]),["Modelo IA",providerLabel]]
          .map(([l,v])=>(
            <div key={l} style={{background:"var(--surface-2)",borderRadius:8,padding:"10px 12px"}}>
              <p style={{fontSize:11,color:"var(--text-muted)",margin:"0 0 2px"}}>{l}</p>
              <p style={{fontSize:14,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</p>
            </div>
          ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:12,alignItems:"start"}}>
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:"14px"}}>
          <p style={{fontSize:11,fontWeight:500,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 8px"}}>Resumen</p>
          <p style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,margin:"0 0 14px"}}>{analysis.summary.descripcion}</p>
          <p style={{fontSize:11,fontWeight:500,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 8px"}}>Hallazgos clave</p>
          {(analysis.summary.insights||[]).map((ins,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
              <span style={{width:18,height:18,borderRadius:"50%",background:"var(--bg-accent)",color:"var(--text-accent)",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
              <p style={{fontSize:11,color:"var(--text-secondary)",margin:0,lineHeight:1.5}}>{ins}</p>
            </div>
          ))}
          <div style={{borderTop:"0.5px solid var(--border)",marginTop:14,paddingTop:12}}>
            <button onClick={exportHTML} style={{width:"100%",fontSize:12,padding:"7px 0",background:"var(--fill-accent)",color:"#fff",border:"none"}}>⬇ Exportar HTML</button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
          {(analysis.charts||[]).map((chart,idx)=>(
            <div key={idx} style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:"12px 14px",
              ...(idx===0?{gridColumn:"1/-1"}:{})}}>
              <p style={{fontSize:13,fontWeight:500,margin:"0 0 2px"}}>{chart.titulo}</p>
              <p style={{fontSize:11,color:"var(--text-muted)",margin:"0 0 10px"}}>{chart.descripcion}</p>
              {renderChart(chart)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
