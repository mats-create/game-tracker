// app-export.js — SVG helpers, exportPDF, exportPatternPDF, exportSVG
// Nutmeg&Needle Game Tracker — edit this file, not index.html

// ─── SHARED SVG HELPERS (used by both colour + embroidery export) ─────────

  function pitchSVGLines(ink){
    const L=ink?'#1a1a2e':'rgba(255,255,255,0.88)';
    const pad=20,bxW=120,bxH=160,bxY=(H-bxH)/2,smH=80,smY=(H-smH)/2,gH=50,gY=(H-gH)/2;
    const out=[];
    for(let i=0;i<8;i++){
      const fill=ink?(i%2===0?'rgba(0,80,0,0.07)':'rgba(0,60,0,0.05)'):(i%2===0?'#3a7d44':'#2f6b38');
      out.push(`<rect x="${i*W/8}" y="0" width="${W/8}" height="${H}" fill="${fill}"/>`);
    }
    const sw=ink?'1.5':'1.5';
    out.push(`<rect x="${pad}" y="${pad}" width="${W-pad*2}" height="${H-pad*2}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<line x1="${W/2}" y1="${pad}" x2="${W/2}" y2="${H-pad}" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<circle cx="${W/2}" cy="${H/2}" r="50" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<circle cx="${W/2}" cy="${H/2}" r="3" fill="${L}"/>`);
    out.push(`<rect x="${pad}" y="${bxY}" width="${bxW}" height="${bxH}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<rect x="${W-pad-bxW}" y="${bxY}" width="${bxW}" height="${bxH}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<rect x="${pad}" y="${smY}" width="50" height="${smH}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<rect x="${W-pad-50}" y="${smY}" width="50" height="${smH}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<path d="M${pad+bxW},${H/2-35} A40,40 0 0,1 ${pad+bxW},${H/2+35}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<path d="M${W-pad-bxW},${H/2-35} A40,40 0 0,0 ${W-pad-bxW},${H/2+35}" fill="none" stroke="${L}" stroke-width="${sw}"/>`);
    out.push(`<rect x="${pad-12}" y="${gY}" width="12" height="${gH}" fill="none" stroke="${L}" stroke-width="2"/>`);
    out.push(`<rect x="${W-pad}" y="${gY}" width="12" height="${gH}" fill="none" stroke="${L}" stroke-width="2"/>`);
    return out;
  }

  function arrowSVGLines(arr,hs,emb){emb=emb||false;
    const out=[];
    function svgAHead(from,to,col,emb){
      if(!from||!to)return'';
      const ang=Math.atan2(to.y-from.y,to.x-from.x);
      const b1={x:to.x-Math.cos(ang-0.5)*hs*1.1,y:to.y-Math.sin(ang-0.5)*hs*1.1};
      const b2={x:to.x-Math.cos(ang+0.5)*hs*1.1,y:to.y-Math.sin(ang+0.5)*hs*1.1};
      return `<polyline points="${b1.x.toFixed(1)},${b1.y.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)} ${b2.x.toFixed(1)},${b2.y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${emb?6:2.2}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    function wavePathSVG(wpts,col,sw){
      if(wpts.length<2)return'';
      let d=`M${wpts[0].x.toFixed(1)},${wpts[0].y.toFixed(1)}`;
      for(let i=1;i<wpts.length;i++){
        const mx=((wpts[i].x+wpts[i-1].x)/2).toFixed(1),my=((wpts[i].y+wpts[i-1].y)/2).toFixed(1);
        d+=` Q${wpts[i-1].x.toFixed(1)},${wpts[i-1].y.toFixed(1)} ${mx},${my}`;
      }
      d+=` L${wpts[wpts.length-1].x.toFixed(1)},${wpts[wpts.length-1].y.toFixed(1)}`;
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    arr.forEach(a=>{
      const sa=resolveAnchor(a.startAnchor)||a.path[0];
      const ea=resolveAnchor(a.endAnchor)||a.path[a.path.length-1];
      if(!sa||!ea)return;
      const ahs2=AHEAD[a.headSize]!==undefined?AHEAD[a.headSize]:hs;const col=a.color,sw=2.2;
      const dash=a.style==='dashed'?'stroke-dasharray="7 4"':'';
      if(a.style==='wave'){
        let wpts=[];
        if(a.shape==='straight'){
          const dx=ea.x-sa.x,dy=ea.y-sa.y,len=Math.hypot(dx,dy)||1;
          const nx=-dy/len,ny=dx/len,steps=Math.ceil(len/10);
          wpts=[sa];
          for(let wi=1;wi<=steps;wi++){const t=wi/steps,amp=(wi%2===0?1:-1)*6;wpts.push({x:sa.x+dx*t+nx*amp,y:sa.y+dy*t+ny*amp});}
          wpts.push(ea);
        }else if(a.shape==='curve'&&a.cp){
          for(let wi=0;wi<=30;wi++){const t=wi/30;wpts.push({x:(1-t)*(1-t)*sa.x+2*(1-t)*t*a.cp.x+t*t*ea.x,y:(1-t)*(1-t)*sa.y+2*(1-t)*t*a.cp.y+t*t*ea.y});}
        }else{wpts=a.path;}
        out.push(wavePathSVG(wpts,col,sw));
        out.push(svgAHead(wpts[Math.max(0,wpts.length-3)],ea,col));
      }else if(a.shape==='straight'){
        out.push(`<line x1="${sa.x.toFixed(1)}" y1="${sa.y.toFixed(1)}" x2="${ea.x.toFixed(1)}" y2="${ea.y.toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" ${dash}/>`);
        out.push(svgAHead(sa,ea,col));
      }else if(a.shape==='curve'&&a.cp){
        out.push(`<path d="M${sa.x.toFixed(1)},${sa.y.toFixed(1)} Q${a.cp.x.toFixed(1)},${a.cp.y.toFixed(1)} ${ea.x.toFixed(1)},${ea.y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" ${dash}/>`);
        const t2=0.95,tx=2*(1-t2)*(a.cp.x-sa.x)+2*t2*(ea.x-a.cp.x),ty=2*(1-t2)*(a.cp.y-sa.y)+2*t2*(ea.y-a.cp.y);
        out.push(svgAHead({x:ea.x-tx*.15,y:ea.y-ty*.15},ea,col));
      }else if(a.shape==='elbow'){
        const corner=a.cp||{x:ea.x,y:sa.y};
        out.push(`<polyline points="${sa.x.toFixed(1)},${sa.y.toFixed(1)} ${corner.x.toFixed(1)},${corner.y.toFixed(1)} ${ea.x.toFixed(1)},${ea.y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>`);
        out.push(svgAHead(corner,ea,col));
      }else{
        const pts2=a.path.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        out.push(`<polyline points="${pts2}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>`);
        out.push(svgAHead(a.path[Math.max(0,a.path.length-3)],ea,col));
      }
    });
    return out;
  }

  function symbolSVGLines(symbols){
    const out=[];
    (symbols||[]).forEach(function(sym){
      const r=SSIZES[sym.size||'m']||SSIZES.m;
      const path=symbolSVGPath(sym.x,sym.y,r,sym.type||'goal',sym.color||'#F5F5F5');
      if(path)out.push(path);
    });
    return out;
  }

  function markerSVGLines(ph,phaseColor,markerSize,r){
    const out=[];
    ph.forEach(p=>(p.markers||[]).forEach(m=>{
      const half=MSIZES[markerSize||'m']||Math.round(r*1.4);
      out.push(`<rect x="${m.x-half}" y="${m.y-half}" width="${half*2}" height="${half*2}" rx="3" fill="${phaseColor}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5"/>`);
      out.push(`<text x="${m.x}" y="${m.y}" dy="0.36em" text-anchor="middle" font-family="Inter,sans-serif" fill="#fff" font-size="${markerLabelFS(half)}" font-weight="bold">${phaseLabel(p.label)}</text>`);
    }));
    return out;
  }




  function ghostPlayerSVG(p,r,col){
    // Diagonal stripe ghost player — off-white fill, team-colour stripes + dashed ring, no number
    const id='gp'+p.id.toString().replace(/[^a-z0-9]/gi,'');
    const lines=[];
    lines.push(`<defs>`);
    lines.push(`  <pattern id="str${id}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`);
    lines.push(`    <rect width="6" height="6" fill="#F5F5F5"/>`);
    lines.push(`    <line x1="0" y1="0" x2="0" y2="6" stroke="${col}" stroke-width="2.5" opacity="0.55"/>`);
    lines.push(`  </pattern>`);
    lines.push(`  <clipPath id="cp${id}">`);
    lines.push(`    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}"/>`);
    lines.push(`  </clipPath>`);
    lines.push(`</defs>`);
    lines.push(`<rect x="${(p.x-r).toFixed(1)}" y="${(p.y-r).toFixed(1)}" width="${(r*2).toFixed(1)}" height="${(r*2).toFixed(1)}" fill="url(#str${id})" clip-path="url(#cp${id})"/>`);
    lines.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="4 4"/>`);
    return lines;
  }

  function playerSVGLines(pl,cA,cB,st,ink,emb){
    const r=st.pR,out=[];
    pl.filter(p=>!p.hidden).forEach(p=>{
      const col=p.team==='A'?cA:cB;0
      if(p.ghost){
        ghostPlayerSVG(p,r,col).forEach(l=>out.push(l));
        return;
      }
      const ec=(p.team==='A'?st.edgeColorA:st.edgeColorB)||'#fff';
      const ew=emb?(r<=10?5:r<=14?6:7):(r<=10?2:r<=14?2.5:3);
      out.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${col}" stroke="${ec}" stroke-width="${ew}"/>`);
      out.push(`<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" dy="0.36em" text-anchor="middle" font-family="Inter,sans-serif" fill="#fff" font-size="${playerNumFS(r)}" font-weight="bold">${p.num}</text>`);
      if(p.name&&r>=14){
        const nc=ink?'#1a1a2e':'rgba(255,255,255,0.9)';
        out.push(`<text x="${p.x.toFixed(1)}" y="${(p.y+r+10).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${nc}" font-family="sans-serif" font-size="${Math.max(9,r-5)}">${p.name}</text>`);
      }
    });
    return out;
  }

  function ballSVGLines(balls,r,ink,ballSize){
    const br=ballRadius(r,ballSize);
    const sc=ink?'#1a1a2e':'#333',sw=ink?1.5:1.2;
    const out2=[];
    balls.forEach(bl=>{
      if(bl.ghost){
        const pts=[];
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;pts.push([bl.x+Math.cos(a)*(br*0.38),bl.y+Math.sin(a)*(br*0.38)]);}
        const poly=pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
        out2.push(`<circle cx="${bl.x.toFixed(1)}" cy="${bl.y.toFixed(1)}" r="${br}" fill="#CCCCCC" stroke="#AAAAAA" stroke-width="1.5" stroke-dasharray="4 4"/>`);
        out2.push(`<polygon points="${poly}" fill="none" stroke="#AAAAAA" stroke-width="0.9"/>`);
        for(let i=0;i<5;i++){
          const a=i*Math.PI*2/5-Math.PI/2;
          const ix=pts[i][0],iy=pts[i][1];
          const ox=(bl.x+Math.cos(a)*br).toFixed(1),oy=(bl.y+Math.sin(a)*br).toFixed(1);
          out2.push(`<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${ox}" y2="${oy}" stroke="#AAAAAA" stroke-width="0.9"/>`);
          const a2=a+Math.PI*2/10,mx=(bl.x+Math.cos(a2)*(br*0.75)).toFixed(1),my=(bl.y+Math.sin(a2)*(br*0.75)).toFixed(1);
          out2.push(`<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${mx}" y2="${my}" stroke="#AAAAAA" stroke-width="0.9"/>`);
        }
        return;
      }
      out2.push(`<circle cx="${bl.x.toFixed(1)}" cy="${bl.y.toFixed(1)}" r="${br}" fill="white" stroke="${sc}" stroke-width="${sw}"/>`);
      // Pentagon panel pattern — all non-ghost balls (score balls get spikes on top)
      const pts=[];
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;pts.push([bl.x+Math.cos(a)*(br*0.38),bl.y+Math.sin(a)*(br*0.38)]);}
      const poly=pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
      out2.push(`<polygon points="${poly}" fill="#1a1a1a" stroke="${sc}" stroke-width="0.9"/>`);
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5-Math.PI/2;
        const ix=pts[i][0],iy=pts[i][1];
        const ox=(bl.x+Math.cos(a)*br).toFixed(1),oy=(bl.y+Math.sin(a)*br).toFixed(1);
        out2.push(`<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${ox}" y2="${oy}" stroke="${sc}" stroke-width="0.9"/>`);
        const a2=a+Math.PI*2/10,mx=(bl.x+Math.cos(a2)*(br*0.75)).toFixed(1),my=(bl.y+Math.sin(a2)*(br*0.75)).toFixed(1);
        out2.push(`<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${mx}" y2="${my}" stroke="${sc}" stroke-width="0.9"/>`);
      }
      if(bl.score){
        const spikes=8,gap=2,spikeLen=br*0.55;
        const inner=br+2.5+gap;
        const outerLong=inner+spikeLen,outerShort=inner+spikeLen*0.55;
        for(let i=0;i<spikes;i++){
          const a=i*Math.PI*2/spikes-Math.PI/2;
          const outerR=i%2===0?outerShort:outerLong;
          const x1=(bl.x+Math.cos(a)*inner).toFixed(1),y1=(bl.y+Math.sin(a)*inner).toFixed(1);
          const x2=(bl.x+Math.cos(a)*outerR).toFixed(1),y2=(bl.y+Math.sin(a)*outerR).toFixed(1);
          out2.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.95)" stroke-width="2.5" stroke-linecap="round"/>`);
        }
      }
    });
    return out2;
  }

  // SVG text wrap — returns array of {text,dy} tspan objects
  // Uses conservative char width (0.48 * fontSize) to avoid underestimating line count
  function svgWrapText(str,maxW,fontSize){
    if(!str)return [{text:'',dy:0}];
    const charsPerLine=Math.max(8,Math.floor(maxW/(fontSize*0.48)));
    const words=str.split(' ');
    const lines=[];let cur='';
    words.forEach(function(w){
      const test=cur?cur+' '+w:w;
      if(test.length>charsPerLine&&cur){lines.push(cur);cur=w;}
      else{cur=test;}
    });
    if(cur)lines.push(cur);
    return lines.map(function(t,i){return{text:t,dy:i===0?0:1};});
  }

  function legendSVGLines(st,cA,cB,ph,phaseColor){
    const out=[];
    const rows=getLegendRows(S);
    if(rows){
      const leg=st.legend;
      const sc=Math.max(0.5,Math.min(2,leg.scale||1));
      const{pad,lineH,dotS,headerFs,nameFs}=legendFontSizes(sc);
      const cols=leg.cols!==undefined?leg.cols:2;
      const boxW=leg.w!==null&&leg.w!==undefined?leg.w:legendAutoW(rows,sc,cols);
      const boxH=leg.h!==null&&leg.h!==undefined?leg.h:legendAutoH(rows,sc,cols);
      const lx=leg.x,ly=leg.y,textCol=leg.textColor||'#222';
      out.push(`<g id="legend-players">`);
      out.push(`  <rect x="${lx}" y="${ly}" width="${boxW}" height="${boxH}" rx="7" fill="rgba(255,255,255,0.93)" stroke="rgba(0,0,0,0.14)" stroke-width="1"/>`);
      const colW2=cols>1?Math.floor(boxW/cols):boxW;
      const drawCol2=(list,jCol,name,ci)=>{
        const cx=lx+pad+ci*colW2;
        out.push(`  <text x="${cx}" y="${ly+pad+headerFs}" font-family="sans-serif" font-size="${headerFs}" font-weight="bold" fill="${jCol}">${name}</text>`);
        list.forEach((p,i)=>{
          const ry=ly+pad+Math.round(14*sc)+pad/2+i*lineH,dr=dotS/2;
          out.push(`  <circle cx="${cx+dr}" cy="${ry+dr}" r="${dr}" fill="${jCol}" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>`);
          out.push(`  <text x="${cx+dr}" y="${ry+dr}" dy="0.36em" text-anchor="middle" font-family="Inter,sans-serif" font-size="${legendDotNumFS(dr)}" font-weight="bold" fill="#fff">${p.num}</text>`);
          const wrappedName=svgWrapText(p.name||'',colW2-dotS-10,nameFs);
          const nameX=cx+dotS+5,nameY=ry+dr;
          out.push(`  <text x="${nameX}" y="${nameY}" dominant-baseline="middle" font-family="sans-serif" font-size="${nameFs}" fill="${textCol}">${wrappedName.map(function(l,li){return'<tspan x="'+nameX+'" dy="'+(li===0?0:nameFs*1.2)+'">'+(l.text||'')+'</tspan>';}).join('')}</text>`);
        });
      };
      if(cols===2){
        if(rows.teamA.length)drawCol2(rows.teamA,cA,st.teamNameA||'Team A',0);
        if(rows.teamB.length)drawCol2(rows.teamB,cB,st.teamNameB||'Team B',1);
      }else{
        const combined=[...rows.teamA.map(p=>({...p,jc:cA})),...rows.teamB.map(p=>({...p,jc:cB}))];
        out.push(`  <text x="${lx+pad}" y="${ly+pad+headerFs}" font-family="sans-serif" font-size="${headerFs}" font-weight="bold" fill="#555">${st.teamNameA||'A'} / ${st.teamNameB||'B'}</text>`);
        combined.forEach((p,i)=>{
          const ry=ly+pad+Math.round(14*sc)+pad/2+i*lineH,dr=dotS/2;
          out.push(`  <circle cx="${lx+pad+dr}" cy="${ry+dr}" r="${dr}" fill="${p.jc}" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>`);
          out.push(`  <text x="${lx+pad+dr}" y="${ry+dr}" dy="0.36em" text-anchor="middle" font-family="Inter,sans-serif" font-size="${legendDotNumFS(dr)}" font-weight="bold" fill="#fff">${p.num}</text>`);
          const wrappedName1=svgWrapText(p.name||'',boxW-dotS-10,nameFs);
          const nameX1=lx+pad+dotS+5,nameY1=ry+dr;
          out.push(`  <text x="${nameX1}" y="${nameY1}" dominant-baseline="middle" font-family="sans-serif" font-size="${nameFs}" fill="${textCol}">${wrappedName1.map(function(l,li){return'<tspan x="'+nameX1+'" dy="'+(li===0?0:nameFs*1.2)+'">'+(l.text||'')+'</tspan>';}).join('')}</text>`);
        });
      }
      out.push(`</g>`);
    }
    if(ph.length){
      const sl=st.stepLegend;
      const sc=Math.max(0.5,Math.min(2,sl.scale||1));
      const{pad,lineH,headerFs,nameFs}=legendFontSizes(sc);
      const stepLineH=Math.round(15*sc);
      const br=Math.round(6*sc);
      const boxW=sl.w!==null&&sl.w!==undefined?sl.w:Math.round(180*sc);
      const noteMaxW=boxW-pad-br*2-6;
      // Pre-calculate total rows accounting for text wrapping
      const stepWrapped=ph.map(function(p){const note=p.note&&p.note.trim()?p.note:'—';return svgWrapText(note,noteMaxW,nameFs);});
      const totalRows=stepWrapped.reduce(function(sum,w){return sum+w.length;},0);
      const boxH=sl.h!==null&&sl.h!==undefined?sl.h:pad*2+Math.round(13*sc)+pad/2+totalRows*lineH+pad;
      const lx=sl.x,ly=sl.y,textCol=sl.textColor||'#333';
      out.push(`<g id="legend-steps">`);
      out.push(`  <rect x="${lx}" y="${ly}" width="${boxW}" height="${boxH}" rx="7" fill="rgba(255,255,255,0.93)" stroke="rgba(0,0,0,0.14)" stroke-width="1"/>`);
      out.push(`  <text x="${lx+pad}" y="${ly+pad+headerFs}" font-family="sans-serif" font-size="${headerFs}" font-weight="bold" fill="${phaseColor}">Moves</text>`);
      let rowY=ly+pad+Math.round(13*sc)+pad/2;
      ph.forEach(function(p,i){
        const wrappedNote=stepWrapped[i];
        const bx2=lx+pad+br,by2=rowY+stepLineH/2;
        out.push(`  <rect x="${bx2-br}" y="${by2-br}" width="${br*2}" height="${br*2}" rx="3" fill="${phaseColor}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`);
        out.push(`  <text x="${bx2}" y="${by2}" dy="0.36em" text-anchor="middle" font-family="Inter,sans-serif" font-size="${Math.round(8*sc)}" font-weight="bold" fill="#fff">${phaseLabel(p.label)}</text>`);
        const noteX=lx+pad+br*2+6;
        out.push(`  <text x="${noteX}" y="${by2}" dominant-baseline="middle" font-family="sans-serif" font-size="${nameFs}" fill="${textCol}">${wrappedNote.map(function(l,li){return'<tspan x="'+noteX+'" dy="'+(li===0?0:nameFs*1.2)+'">'+(l.text||'')+'</tspan>';}).join('')}</text>`);
        rowY+=stepLineH*wrappedNote.length;
      });
      out.push(`</g>`);
    }
    return out;
  }

  // ─── PDF EXPORT ───────────────────────────────────────────────────────────
  function exportPDF(){
    const{jsPDF}=window.jspdf;
    if(!jsPDF){alert('PDF library not loaded.');return;}
    const st=S.current;
    const{players:pl,arrows:arr,phases:ph,phaseColor,balls,colorA:cA,colorB:cB,
      teamNameA,teamNameB,view:v,pR,cropRegion:cr,exportFormat:fmt,exportOrientation:ori}=st;

    const hs=AHEAD[st.arrowHeadSize]!==undefined?AHEAD[st.arrowHeadSize]:7;
    const bx=cr?cr.x:0,by=cr?cr.y:0,bw=cr?Math.max(cr.w,10):W,bh=cr?Math.max(cr.h,10):H;

    // Build pitch SVG using same pipeline as exportPatternPDF — Pitch Green lines, light stripes
    var svgLines=[];
    svgLines.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+bw+'" height="'+bh+'" viewBox="'+bx+' '+by+' '+bw+' '+bh+'">');
    svgLines.push('<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="#ffffff"/>');
    pitchSVGLines(false).forEach(function(l){
      svgLines.push(
        l.replace(/fill="#3a7d44"/g,'fill="#e8f0e8"')
         .replace(/fill="#2f6b38"/g,'fill="#dceadc"')
         .replace(/stroke="rgba\(255,255,255,0\.88\)"/g,'stroke="#4A6741"')
         .replace(/stroke="#ffffff"/g,'stroke="#4A6741"')
      );
    });
    arrowSVGLines(arr,hs,false).forEach(function(l){svgLines.push(l);});
    symbolSVGLines(st.symbols).forEach(function(l){svgLines.push(l);});
    markerSVGLines(ph,phaseColor,st.markerSize,pR).forEach(function(l){svgLines.push(l);});
    pl.filter(function(p){return !p.hidden&&p.ghost;}).forEach(function(p){
      var col=p.team==='A'?cA:cB;
      ghostPlayerSVG(p,pR,col).forEach(function(l){svgLines.push(l);});
    });
    playerSVGLines(pl.filter(function(p){return !p.ghost;}),cA,cB,st,false,false).forEach(function(l){svgLines.push(l);});
    balls.filter(function(bl){return bl.ghost;}).forEach(function(bl){
      var br2=ballRadius(pR,st.ballSize);
      var pts2=[];
      for(var i=0;i<5;i++){var a2=i*Math.PI*2/5-Math.PI/2;pts2.push([bl.x+Math.cos(a2)*(br2*0.38),bl.y+Math.sin(a2)*(br2*0.38)]);}
      var poly2=pts2.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
      svgLines.push('<circle cx="'+bl.x.toFixed(1)+'" cy="'+bl.y.toFixed(1)+'" r="'+br2+'" fill="#CCCCCC" stroke="#AAAAAA" stroke-width="1.5" stroke-dasharray="4 4"/>');
      svgLines.push('<polygon points="'+poly2+'" fill="none" stroke="#AAAAAA" stroke-width="0.9"/>');
      for(var j=0;j<5;j++){
        var aj=j*Math.PI*2/5-Math.PI/2;
        var ix2=pts2[j][0],iy2=pts2[j][1];
        var ox2=(bl.x+Math.cos(aj)*br2).toFixed(1),oy2=(bl.y+Math.sin(aj)*br2).toFixed(1);
        svgLines.push('<line x1="'+ix2.toFixed(1)+'" y1="'+iy2.toFixed(1)+'" x2="'+ox2+'" y2="'+oy2+'" stroke="#AAAAAA" stroke-width="0.9"/>');
        var aj2=aj+Math.PI*2/10,mx2=(bl.x+Math.cos(aj2)*(br2*0.75)).toFixed(1),my2=(bl.y+Math.sin(aj2)*(br2*0.75)).toFixed(1);
        svgLines.push('<line x1="'+ix2.toFixed(1)+'" y1="'+iy2.toFixed(1)+'" x2="'+mx2+'" y2="'+my2+'" stroke="#AAAAAA" stroke-width="0.9"/>');
      }
    });
    ballSVGLines(balls.filter(function(bl){return !bl.ghost;}),pR,false,st.ballSize).forEach(function(l){svgLines.push(l);});
    legendSVGLines(st,cA,cB,ph,phaseColor).forEach(function(l){svgLines.push(l);});

    svgLines.push('</svg>');

    var svgStr=svgLines.join('\n');
    var DPI_SCALE=4;
    var ocW=Math.round(bw*DPI_SCALE),ocH=Math.round(bh*DPI_SCALE);
    var oc=document.createElement('canvas');
    oc.width=ocW;oc.height=ocH;
    var oc2=oc.getContext('2d');
    var img=new Image();
    var svgBlob=new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'});
    var svgUrl=URL.createObjectURL(svgBlob);

    img.onerror=function(){alert('PDF render error: could not rasterise pitch SVG.');};
    img.onload=function(){
      oc2.drawImage(img,0,0,ocW,ocH);
      URL.revokeObjectURL(svgUrl);
      var pitchImg=oc.toDataURL('image/png');

      const pdfFmt=fmt==='letter'?'letter':'a4';
      const doc=new jsPDF({orientation:'portrait',unit:'pt',format:pdfFmt});
      const PW=pdfFmt==='letter'?612:595,PH=pdfFmt==='letter'?792:842;
      const MX=30,MY=0,usableW=PW-MX*2;
      let y=MY;

      const mo=st.moment||{};
      const hasMoment=mo.heading||mo.what||mo.event||mo.at||mo.when||mo.who;

      const tnA=teamNameA||'Team A',tnB=teamNameB||'Team B';
      const dateStr=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

      // ── N&N brand header bar ── real logo (NN_Logo_WithTagline_Reversed_4x.png)
      const HDR_H=38;
      doc.setFillColor(26,26,26);
      doc.rect(0,0,PW,HDR_H,'F');
      // Logo image: 2580x780px source, rendered at 86x26pt, vertically centred
      // NN_LOGO_REV defined in app-logos.js
      doc.addImage(NN_LOGO_REV,'PNG',MX,6,86,26,undefined,'FAST');
      // Domain right-aligned in header
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(102,102,102);
      doc.text('nutmegneedle.com',PW-MX,HDR_H/2+2.5,{align:'right'});

      y=HDR_H+10;

      // ── Metadata subline ──
      doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(130,130,130);
      doc.text(tnA+' vs '+tnB+'   \u00B7   '+dateStr+'   \u00B7   '+fmt.toUpperCase()+' '+ori,MX,y);
      y+=14;

      // ── Memorable moment section ──
      if(hasMoment){
        const moW=usableW;
        const FS_LABEL=7.5,FS_HEADING=15,FS_VALUE=9.5;
        const LINE_H=12.5;
        const GAP_AFTER=6;
        const PAD_V=10,PAD_H=10; // internal card padding
        const C_LABEL=[204,51,0],C_HEADING=[26,26,26],C_VALUE=[50,48,46];

        // Dry-run to measure total card height before drawing anything
        doc.setFontSize(FS_VALUE);
        // Header bar row: label only (same height as thread colours bar = 15pt)
        let dryH=15;
        // Internal content padding top
        dryH+=PAD_V;
        if(mo.heading&&mo.heading.trim()){
          doc.setFontSize(FS_HEADING);
          dryH+=doc.splitTextToSize(mo.heading.trim(),moW-PAD_H*2).length*19+6;
        }
        doc.setFontSize(FS_VALUE);
        const moFields=[mo.what,mo.event,mo.at,mo.when,mo.who];
        moFields.forEach(function(fv){
          if(fv&&fv.trim()){
            dryH+=FS_LABEL+2;
            dryH+=doc.splitTextToSize(fv.trim(),moW-PAD_H*2).length*LINE_H;
            dryH+=GAP_AFTER;
          }
        });
        // Bottom padding
        dryH+=PAD_V;

        // Record card top so we can snap y cleanly after drawing
        const cardTopY=y;

        // ── Draw linen card background ──
        const{r:moR,g:moG,b:moB}=hexToRgb('#F0E6D3');
        doc.setFillColor(moR,moG,moB);
        doc.rect(MX,y,usableW,dryH,'F');

        // ── Header bar row — same pattern as THREAD COLOURS bar ──
        doc.setFont('helvetica','bold');doc.setFontSize(FS_LABEL);
        doc.setTextColor(C_LABEL[0],C_LABEL[1],C_LABEL[2]);
        doc.text('MEMORABLE MOMENT',MX+PAD_H,y+10);
        // Coral left border accent — full card height, 3pt wide
        doc.setDrawColor(204,51,0);doc.setLineWidth(3);
        doc.line(MX,y,MX,y+dryH);
        doc.setLineWidth(0.5);

        // Move y past the header bar row into content area
        y+=15+PAD_V;
        const tx=MX+PAD_H;

        // Heading
        if(mo.heading&&mo.heading.trim()){
          doc.setFont('helvetica','bold');doc.setFontSize(FS_HEADING);
          doc.setTextColor(C_HEADING[0],C_HEADING[1],C_HEADING[2]);
          doc.splitTextToSize(mo.heading.trim(),moW-PAD_H*2).forEach(function(l){doc.text(l,tx,y);y+=19;});
          y+=6;
        }

        // Field renderer: coral caps label, then value
        function moField(label,value){
          if(!value||!value.trim())return;
          doc.setFont('helvetica','bold');doc.setFontSize(FS_LABEL);
          doc.setTextColor(C_LABEL[0],C_LABEL[1],C_LABEL[2]);
          doc.text(label,tx,y);
          y+=FS_LABEL+2;
          doc.setFont('helvetica','normal');doc.setFontSize(FS_VALUE);
          doc.setTextColor(C_VALUE[0],C_VALUE[1],C_VALUE[2]);
          doc.splitTextToSize(value.trim(),moW-PAD_H*2).forEach(function(l){doc.text(l,tx,y);y+=LINE_H;});
          y+=GAP_AFTER;
        }

        moField('WHAT',mo.what);
        moField('EVENT',mo.event);
        moField('AT',mo.at);
        moField('WHEN',mo.when);
        moField('WHO',mo.who);

        // Snap y to card bottom + gap to pitch
        y=cardTopY+dryH+10;
      }

      // ── Thread colours — full width, before pitch ──
      const{r:chR,g:chG,b:chB}=hexToRgb('#F0E6D3');
      doc.setFillColor(chR,chG,chB);doc.rect(MX,y,usableW,15,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(204,51,0);
      doc.text('THREAD COLOURS',MX+4,y+10);
      doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(102,102,102);
      doc.text('Brand name  \u00B7  DMC code',PW-MX-4,y+10,{align:'right'});
      y+=19;

      // Two-column grid for colour swatches
      const swatchColW=(usableW-10)/2,swatchCol2=MX+swatchColW+10;
      let swatchY1=y,swatchY2=y,swatchIdx=0;
      const seen=new Set();
      function addColour(hex,label){
        if(seen.has(hex))return;seen.add(hex);
        // Check overflow before reading rowY — fix draw-on-old-page bug
        if(swatchIdx%2===0&&swatchY1>PH-50){doc.addPage();swatchY1=MY+8;swatchY2=MY+8;}
        const swatchX=swatchIdx%2===0?MX:swatchCol2;
        const rowY=swatchIdx%2===0?swatchY1:swatchY2;
        const{r:rr,g:gg,b:bb}=hexToRgb(hex);
        doc.setFillColor(rr,gg,bb);doc.rect(swatchX,rowY,12,9,'F');
        doc.setDrawColor(150,150,150);doc.setLineWidth(0.3);doc.rect(swatchX,rowY,12,9,'S');
        doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(40,40,40);
        doc.text(label,swatchX+15,rowY+5.5);
        doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);
        doc.text(nnThreadLabel(hex),swatchX+15,rowY+12);
        if(swatchIdx%2===0){swatchY1+=18;}else{swatchY2+=18;}
        swatchIdx++;
      }
      // Pitch lines are always needed — first entry regardless of board state
      addColour('#4A6741','Pitch lines');
      addColour(cA,tnA);
      addColour(cB,tnB);
      addColour(phaseColor,'Step markers');
      // Edge colours: guard case-insensitively against plain white
      if(st.edgeColorA&&st.edgeColorA.toLowerCase()!=='#ffffff')addColour(st.edgeColorA,tnA+' ring');
      if(st.edgeColorB&&st.edgeColorB.toLowerCase()!=='#ffffff')addColour(st.edgeColorB,tnB+' ring');
      // Balls: white outline thread — label reflects stitch purpose
      balls.forEach(function(bl,bi){if(!bl.ghost)addColour('#FFFFFF','Ball outline'+(balls.length>1?' '+(bi+1):''));});
      // Arrows: one entry per unique colour
      arr.forEach(function(a){if(a.color)addColour(a.color,'Arrows');});
      (st.symbols||[]).forEach(function(sym,si){if(sym.color)addColour(sym.color,'Symbol '+(si+1));});
      y=Math.max(swatchY1,swatchY2)+8;

      // ── Footer strip — on current page (page 1 or 2 if threads overflowed) ──
      // jsPDF draws on the current page; after a doc.addPage() inside addColour,
      // the current page is already page 2, so footer and pitch land there correctly.
      const FTR_H=20;
      doc.setFillColor(240,230,211);
      doc.rect(0,PH-FTR_H,PW,FTR_H,'F');
      doc.addImage(NN_LOGO_LINEN,'PNG',MX,PH-FTR_H+3,46,14,undefined,'FAST');
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(102,102,102);
      doc.text(new Date().toISOString().slice(0,10),PW/2,PH-6,{align:'center'});
      doc.text('nutmegneedle.com',PW-MX,PH-6,{align:'right'});

      // ── Pitch image — fills remaining space above footer on current page ──
      const pitchAvailH=Math.max(80,(PH-FTR_H-8)-y);
      const naturalPitchH=Math.round(usableW*bh/bw);
      const pitchH=Math.min(naturalPitchH,pitchAvailH);
      const pitchW=Math.round(pitchH*bw/bh);
      const pitchX=MX+Math.round((usableW-pitchW)/2);
      doc.addImage(pitchImg,'PNG',pitchX,y,pitchW,pitchH,undefined,'FAST');

      doc.save('tactics-board-'+new Date().toISOString().slice(0,10)+'.pdf');
    };
    img.src=svgUrl;
  }

  // ─── EXPORT PATTERN PDF ───────────────────────────────────────────────────────
  // Aida-ready print PDF with physically locked dimensions.
  // Builds SVG from existing helpers, renders to offscreen canvas, embeds in jsPDF at exact pt size.
  function exportPatternPDF(){
    var jsPDF_=window.jspdf&&window.jspdf.jsPDF;
    if(!jsPDF_){alert('PDF library not loaded.');return;}
    var st=S.current;
    var pl=st.players,arr=st.arrows,ph=st.phases,phaseColor=st.phaseColor,
        balls=st.balls,cA=st.colorA,cB=st.colorB,v=st.view,r=st.pR,
        cr=st.cropRegion,fmt=st.exportFormat;
    var hs=AHEAD[st.arrowHeadSize]!==undefined?AHEAD[st.arrowHeadSize]:7;

    var b=cr?{x:cr.x,y:cr.y,w:cr.w,h:cr.h}:
           v==='left'?{x:0,y:0,w:W/2,h:H}:
           v==='right'?{x:W/2,y:0,w:W/2,h:H}:
           {x:0,y:0,w:W,h:H};

    var MM=2.8346;
    var TOP_MM=10,BOT_MM=20,SIDE_MM=10;
    var HOOP_ASPECT=260/225;
    var PAGE_SIZES={a4:{w:297,h:210},letter:{w:279.4,h:215.9},hoop:{w:297,h:210}};
    var ps=PAGE_SIZES[fmt]||PAGE_SIZES['a4'];
    var PW_PT=ps.w*MM;

    var maxW=ps.w-2*SIDE_MM;
    var maxH=ps.h-TOP_MM-BOT_MM;

    var dW,dH;
    if(fmt==='hoop'){
      dH=maxH;dW=dH*HOOP_ASPECT;
      if(dW>maxW){dW=maxW;dH=dW/HOOP_ASPECT;}
    }else{
      dW=maxW;dH=maxH;
    }

    var dW_PT=Math.round(dW*MM);
    var dH_PT=Math.round(dH*MM);
    var OX=Math.round((PW_PT-dW_PT)/2);
    var OY=Math.round(TOP_MM*MM);

    // Moment data for watermark
    var mo=st.moment||{};
    var wmHeading=(mo.heading&&mo.heading.trim())||'';
    var wmEvent=(mo.event&&mo.event.trim())||'';
    var wmText=wmHeading&&wmEvent?wmHeading+' \u2014 '+wmEvent:(wmHeading||wmEvent);

    // PDF footer strip height (pts) — drawn via jsPDF, not SVG, so it is always reliable
    var FOOTER_PT=20;

    // Pitch-only SVG — no footer strip inside SVG, preserves true aspect ratio so circles stay circular
    var svgPitchW=b.w;
    var svgPitchH=b.h;

    // Fit pitch to page preserving aspect ratio (footer does not affect sizing)
    var pitchAspect=svgPitchW/svgPitchH;
    var fitDW=maxW;
    var fitDH=fitDW/pitchAspect;
    if(fitDH>maxH){fitDH=maxH;fitDW=fitDH*pitchAspect;}
    var pitchDW_PT=Math.round(fitDW*MM);
    var pitchDH_PT=Math.round(fitDH*MM);
    var PH_PT=Math.round(ps.h*MM);
    var OX2=Math.round((PW_PT-pitchDW_PT)/2);
    // Pitch centred on full page — footer placed after, does not affect pitch position.
    var OY2=Math.round((PH_PT-pitchDH_PT)/2);

    // Build pitch-only SVG
    var svgLines=[];
    svgLines.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+svgPitchW+'" height="'+svgPitchH+'" viewBox="'+b.x+' '+b.y+' '+svgPitchW+' '+svgPitchH+'">');
    svgLines.push('<rect x="'+b.x+'" y="'+b.y+'" width="'+svgPitchW+'" height="'+svgPitchH+'" fill="#ffffff"/>');
    // Faint pitch stripes + Pitch Green (#4A6741) pitch lines
    pitchSVGLines(false).forEach(function(l){
      svgLines.push(
        l.replace(/fill="#3a7d44"/g,'fill="#e8f0e8"')
         .replace(/fill="#2f6b38"/g,'fill="#dceadc"')
         .replace(/stroke="rgba\(255,255,255,0\.88\)"/g,'stroke="#4A6741"')
         .replace(/stroke="#ffffff"/g,'stroke="#4A6741"')
      );
    });
    arrowSVGLines(arr,hs,false).forEach(function(l){svgLines.push(l);});
    symbolSVGLines(st.symbols).forEach(function(l){svgLines.push(l);});
    markerSVGLines(ph,phaseColor,st.markerSize,r).forEach(function(l){svgLines.push(l);});
    // Ghost players first — print-safe: transparent fill, solid dashed stroke in team colour
    // Must render BEFORE playerSVGLines so solid players draw on top
    pl.filter(function(p){return !p.hidden&&p.ghost;}).forEach(function(p){
      var col=p.team==='A'?cA:cB;
      ghostPlayerSVG(p,r,col).forEach(function(l){svgLines.push(l);});
    });
    // Solid players only (no ghosts — they were already rendered above)
    playerSVGLines(pl.filter(function(p){return !p.ghost;}),cA,cB,st,false,false).forEach(function(l){svgLines.push(l);});
    // Ghost balls first — print-safe: transparent fill, dark dashed stroke
    balls.filter(function(bl){return bl.ghost;}).forEach(function(bl){
      var br2=ballRadius(r,st.ballSize);
      var pts2=[];
      for(var i=0;i<5;i++){var a2=i*Math.PI*2/5-Math.PI/2;pts2.push([bl.x+Math.cos(a2)*(br2*0.38),bl.y+Math.sin(a2)*(br2*0.38)]);}
      var poly2=pts2.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
      svgLines.push('<circle cx="'+bl.x.toFixed(1)+'" cy="'+bl.y.toFixed(1)+'" r="'+br2+'" fill="#CCCCCC" stroke="#AAAAAA" stroke-width="1.5" stroke-dasharray="4 4"/>');
      svgLines.push('<polygon points="'+poly2+'" fill="none" stroke="#AAAAAA" stroke-width="0.9"/>');
      for(var j=0;j<5;j++){
        var aj=j*Math.PI*2/5-Math.PI/2;
        var ix2=pts2[j][0],iy2=pts2[j][1];
        var ox2=(bl.x+Math.cos(aj)*br2).toFixed(1),oy2=(bl.y+Math.sin(aj)*br2).toFixed(1);
        svgLines.push('<line x1="'+ix2.toFixed(1)+'" y1="'+iy2.toFixed(1)+'" x2="'+ox2+'" y2="'+oy2+'" stroke="#AAAAAA" stroke-width="0.9"/>');
        var aj2=aj+Math.PI*2/10,mx2=(bl.x+Math.cos(aj2)*(br2*0.75)).toFixed(1),my2=(bl.y+Math.sin(aj2)*(br2*0.75)).toFixed(1);
        svgLines.push('<line x1="'+ix2.toFixed(1)+'" y1="'+iy2.toFixed(1)+'" x2="'+mx2+'" y2="'+my2+'" stroke="#AAAAAA" stroke-width="0.9"/>');
      }
    });
    // Solid balls only
    ballSVGLines(balls.filter(function(bl){return !bl.ghost;}),r,false,st.ballSize).forEach(function(l){svgLines.push(l);});
    legendSVGLines(st,cA,cB,ph,phaseColor).forEach(function(l){svgLines.push(l);});
    // Watermark: bottom-right inside pitch area
    if(wmText){
      svgLines.push('<text x="'+(b.x+svgPitchW-10)+'" y="'+(b.y+svgPitchH-10)+'" text-anchor="end" font-family="Inter,Helvetica,sans-serif" font-weight="400" font-size="9" fill="#666666" opacity="0.65">'+wmText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</text>');
    }
    svgLines.push('</svg>');
    var svgStr=svgLines.join('\n');

    var DPI_SCALE=Math.ceil(pitchDW_PT/svgPitchW*2);
    var ocW=Math.round(svgPitchW*DPI_SCALE);
    var ocH=Math.round(svgPitchH*DPI_SCALE);
    var oc=document.createElement('canvas');
    oc.width=ocW;oc.height=ocH;
    var oc2=oc.getContext('2d');
    var img=new Image();
    var svgBlob=new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'});
    var svgUrl=URL.createObjectURL(svgBlob);

    function buildPDF(){
      oc2.drawImage(img,0,0,ocW,ocH);
      URL.revokeObjectURL(svgUrl);
      var pitchImg=oc.toDataURL('image/png');

      var doc=new jsPDF_({orientation:'landscape',unit:'pt',format:fmt==='letter'?'letter':'a4'});
      // Place pitch image at aspect-ratio-correct size — circles stay circular
      doc.addImage(pitchImg,'PNG',OX2,OY2,pitchDW_PT,pitchDH_PT,undefined,'FAST');

      // Footer: drawn via jsPDF directly, strictly below the pitch image
      var curYear=new Date().getFullYear();
      var footerY=OY2+pitchDH_PT; // top of footer zone (just below image)
      var lineY=footerY+2;
      var textY=footerY+FOOTER_PT-5;
      var footerL=OX2;
      var footerR=OX2+pitchDW_PT;
      // Separator line
      doc.setDrawColor(180,180,180);
      doc.setLineWidth(0.4);
      doc.line(footerL,lineY,footerR,lineY);
      // Logo: "Nutmeg" in black, "&" in coral, "Needle" in black
      doc.setFont('helvetica','bold');doc.setFontSize(9);
      doc.setTextColor(26,26,26);
      doc.text('Nutmeg',footerL,textY);
      var nW=doc.getTextWidth('Nutmeg');
      doc.setTextColor(204,51,0);
      doc.text('&',footerL+nW,textY);
      var aW=doc.getTextWidth('&');
      doc.setTextColor(26,26,26);
      doc.text('Needle',footerL+nW+aW,textY);
      // URL + year right-aligned
      doc.setFont('helvetica','normal');doc.setFontSize(9);
      doc.setTextColor(102,102,102);
      doc.text('nutmegneedle.com \u00b7 '+curYear,footerR,textY,{align:'right'});

      doc.save('tactics-aida-pattern-'+new Date().toISOString().slice(0,10)+'.pdf');
    }

    img.onerror=function(){alert('Pattern export error: could not render design.');};
    img.onload=buildPDF;
    img.src=svgUrl;
  }

  function exportSVG(emb=false){
    const st=S.current;
    const{players:pl,arrows:arr,phases:ph,phaseColor,balls,colorA:cA,colorB:cB,
      view:v,pR:r,arrowHeadSize,cropRegion:cr,exportFormat:fmt,exportOrientation:ori}=st;
    const hs=AHEAD[arrowHeadSize]!==undefined?AHEAD[arrowHeadSize]:7;
    const b=cr?{x:cr.x,y:cr.y,w:cr.w,h:cr.h}:
             v==='left'?{x:0,y:0,w:W/2,h:H}:
             v==='right'?{x:W/2,y:0,w:W/2,h:H}:
             {x:0,y:0,w:W,h:H};
    const PAGE_SIZES={a4:{w:297,h:210},letter:{w:279.4,h:215.9},hoop:{w:280,h:250}};
    const ps=PAGE_SIZES[fmt]||PAGE_SIZES['a4'];
    const pageW=ori==='portrait'?ps.h:ps.w,pageH=ori==='portrait'?ps.w:ps.h;

    // For hoop format, output at actual template size (fits inside hoop with margin)
    // rather than filling the full hoop dimensions. Scale content to 240mm wide max.
    const HOOP_MAX_W=240,HOOP_MAX_H=210;
    const svgW=fmt==='hoop'?Math.min(HOOP_MAX_W,Math.round(HOOP_MAX_H*(b.w/(b.h+28))))+'mm':pageW+'mm';
    const svgH=fmt==='hoop'?Math.min(HOOP_MAX_H,Math.round(HOOP_MAX_W*((b.h+28)/b.w)))+'mm':pageH+'mm';

    if(!emb){
      // ── Colour SVG — physical page dimensions, clip, legends ──
      const out=[];
      out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${b.x} ${b.y} ${b.w} ${b.h+28}">`);
      out.push(`<title>Tactics Board — ${fmt.toUpperCase()} ${ori}</title>`);
      out.push(`<defs><clipPath id="pc"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></clipPath></defs>`);
      out.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#fff"/>`);
      out.push(`<g clip-path="url(#pc)">`);
      pitchSVGLines(false).forEach(l=>out.push('  '+l));
      arrowSVGLines(arr,hs,emb).forEach(l=>out.push('  '+l));
      symbolSVGLines(st.symbols).forEach(l=>out.push('  '+l));
      markerSVGLines(ph,phaseColor,st.markerSize,r).forEach(l=>out.push('  '+l));
      playerSVGLines(pl,cA,cB,st,false,false).forEach(l=>out.push('  '+l));
      ballSVGLines(balls,r,false,st.ballSize).forEach(l=>out.push('  '+l));
      out.push(`</g>`);
      legendSVGLines(st,cA,cB,ph,phaseColor).forEach(l=>out.push(l));
      // ── N&N brand footer — thin rule + text, minimal ink ──
      const bfy=b.y+b.h,bfh=20,bfw=b.w,bfx=b.x;
      out.push(`<line x1="${bfx}" y1="${bfy+1}" x2="${bfx+bfw}" y2="${bfy+1}" stroke="#1A1A1A" stroke-width="0.75"/>`);
      out.push(`<text x="${bfx+8}" y="${bfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="700" font-size="9" letter-spacing="-0.3" fill="#1A1A1A">Nutmeg<tspan fill="#CC3300">&amp;</tspan>Needle</text>`);
      out.push(`<text x="${bfx+bfw/2}" y="${bfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="400" font-size="6.5" letter-spacing="2" fill="#4A6741" text-anchor="middle">HANDCRAFTED FOOTBALL MOVES</text>`);
      out.push(`<text x="${bfx+bfw-8}" y="${bfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="400" font-size="7.5" fill="#666666" text-anchor="end">nutmegneedle.com</text>`);
      out.push(`</svg>`);
      const blob=new Blob([out.join('\n')],{type:'image/svg+xml'});
      const url=URL.createObjectURL(blob);
      const a2=document.createElement('a');a2.href=url;a2.download='tactics-colour.svg';a2.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── Embroidery SVG — identical to colour SVG, white background, Inkscape layers ──
    const out2=[];
    out2.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    out2.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${svgW}" height="${svgH}" viewBox="${b.x} ${b.y} ${b.w} ${b.h+28}">`);
    out2.push(`<title>Tactics Board embroidery — ${fmt.toUpperCase()} ${ori}</title>`);
    out2.push(`<defs><clipPath id="pce"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></clipPath></defs>`);
    out2.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h+28}" fill="#ffffff"/>`);
    out2.push(`<g clip-path="url(#pce)">`);
    out2.push(`<g inkscape:label="Pitch" inkscape:groupmode="layer" id="layer-pitch">`);
    pitchSVGLines(false).forEach(function(l){out2.push('  '+l.replace(/fill="#3a7d44"/g,'fill="#e8f0e8"').replace(/fill="#2f6b38"/g,'fill="#dceadc"'));});
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Arrows" inkscape:groupmode="layer" id="layer-arrows">`);
    arrowSVGLines(arr,hs,false).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Symbols" inkscape:groupmode="layer" id="layer-symbols">`);
    symbolSVGLines(st.symbols).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Moves" inkscape:groupmode="layer" id="layer-steps">`);
    markerSVGLines(ph,phaseColor,st.markerSize,r).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Players" inkscape:groupmode="layer" id="layer-players">`);
    playerSVGLines(pl,cA,cB,st,false,false).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Balls" inkscape:groupmode="layer" id="layer-balls">`);
    ballSVGLines(balls,r,false,st.ballSize).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    out2.push(`</g>`);
    out2.push(`<g inkscape:label="Legends" inkscape:groupmode="layer" id="layer-legends">`);
    legendSVGLines(st,cA,cB,ph,phaseColor).forEach(l=>out2.push('  '+l));
    out2.push(`</g>`);
    const eBfy=b.y+b.h,eBfh=20,eBfw=b.w,eBfx=b.x;
    out2.push(`<g inkscape:label="Brand" inkscape:groupmode="layer" id="layer-brand">`);
    out2.push(`  <line x1="${eBfx}" y1="${eBfy+1}" x2="${eBfx+eBfw}" y2="${eBfy+1}" stroke="#1A1A1A" stroke-width="0.75"/>`);
    out2.push(`  <text x="${eBfx+8}" y="${eBfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="700" font-size="9" letter-spacing="-0.3" fill="#1A1A1A">Nutmeg<tspan fill="#CC3300">&amp;</tspan>Needle</text>`);
    out2.push(`  <text x="${eBfx+eBfw/2}" y="${eBfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="400" font-size="6.5" letter-spacing="2" fill="#4A6741" text-anchor="middle">HANDCRAFTED FOOTBALL MOVES</text>`);
    out2.push(`  <text x="${eBfx+eBfw-8}" y="${eBfy+14}" font-family="Inter,Helvetica,sans-serif" font-weight="400" font-size="7.5" fill="#666666" text-anchor="end">nutmegneedle.com</text>`);
    out2.push(`</g>`);
    out2.push(`</svg>`)
    const blob=new Blob([out2.join('\n')],{type:'image/svg+xml'});
    const url=URL.createObjectURL(blob);
    const a2=document.createElement('a');
    a2.href=url;a2.download=`tactics-embroidery-${fmt}-${ori}.svg`;a2.click();
    URL.revokeObjectURL(url);
  }

  // ─── PLAYER PANEL ─────────────────────────────────────────────────────────

