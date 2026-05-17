// app-core.js -- UI primitives, TacticsBoard component body
// Nutmeg&Needle Game Tracker -- edit this file, not index.html
// Constants and pure utilities live in app-utils.js (loaded before this file).

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Card({children,style}){return <div style={{background:C.card,border:`0.5px solid ${C.cardBorder}`,borderRadius:14,padding:'12px 14px',marginBottom:8,...style}}>{children}</div>;}
function Hint({children,style}){return <div style={{fontSize:11,color:C.textMuted,lineHeight:1.55,marginTop:6,...style}}>{children}</div>;}
function Row({children,style}){return <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',...style}}>{children}</div>;}
function ModeBtn({active,onClick,emoji,label,title}){
  return <button onClick={onClick} title={title} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'10px 12px',minWidth:72,height:64,cursor:'pointer',borderRadius:12,border:active?`2px solid ${C.activeBorder}`:`1.5px solid ${C.cardBorder}`,background:active?C.activeBg:'#FAFAF8',color:active?C.activeText:C.textMid,boxShadow:active?`0 0 0 3px rgba(204,51,0,0.12)`:'none'}}>
    <span style={{fontSize:22,lineHeight:1}}>{emoji}</span>
    <span style={{fontSize:10,fontWeight:active?600:400,letterSpacing:0.2}}>{label}</span>
  </button>;
}
function ToggleBtn({active,onClick,children,title}){
  return <button onClick={onClick} title={title} style={{fontSize:12,padding:'4px 10px',height:28,cursor:'pointer',borderRadius:7,border:active?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:active?C.activeBg:'transparent',color:active?C.activeText:C.textMid,fontWeight:active?500:400}}>{children}</button>;
}
function ActionBtn({onClick,children,disabled,danger}){
  return <button onClick={onClick} disabled={disabled} style={{fontSize:12,padding:'6px 14px',height:30,cursor:disabled?'default':'pointer',borderRadius:8,border:'none',background:disabled?'#E5E5EA':danger?C.red:C.blue,color:disabled?C.textMuted:'#fff',fontWeight:500,opacity:disabled?0.6:1}}>{children}</button>;
}
function GhostBtn({onClick,children,disabled,active}){
  return <button onClick={onClick} disabled={disabled} style={{fontSize:11,padding:'3px 9px',height:26,cursor:disabled?'default':'pointer',borderRadius:6,border:active?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:active?C.activeBg:'transparent',color:active?C.activeText:C.textMuted}}>{children}</button>;
}
function InfoBar({icon,text,children}){
  return <div style={{marginTop:8,padding:'8px 12px',background:C.blueLight,borderRadius:10,border:`1px solid ${C.blueBorder}`,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
    {icon&&<span style={{fontSize:16}}>{icon}</span>}
    <span style={{fontSize:11,color:C.activeText,flex:1}}>{text}</span>
    {children}
  </div>;
}
function Collapsible({label,badge,children,defaultOpen,accentColor}){
  const [open,setOpen]=useState(defaultOpen||false);
  const bg=accentColor?accentColor.bg:C.card;
  const border=accentColor?`1px solid ${accentColor.border}`:`0.5px solid ${C.cardBorder}`;
  const labelColor=accentColor?accentColor.text:C.text;
  return <div style={{marginBottom:6}}>
    <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',width:'100%',padding:'9px 12px',cursor:'pointer',background:bg,border,borderRadius:open?'12px 12px 0 0':12,fontSize:12,fontWeight:500,color:labelColor,textAlign:'left',gap:8}}>
      <span style={{flex:1}}>{label}</span>
      {badge!=null&&<span style={{fontSize:10,background:'#F0F0EB',borderRadius:10,padding:'1px 7px',color:C.textMuted}}>{badge}</span>}
      <span style={{fontSize:11,color:accentColor?accentColor.text:C.textMuted}}>{open?'▲':'▼'}</span>
    </button>
    {open&&<div style={{background:bg,border,borderTop:'none',borderRadius:'0 0 12px 12px',padding:'12px 14px'}}>{children}</div>}
  </div>;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function TacticsBoard(){
  const canvasRef=useRef(null);

  // All mutable board state in one ref — avoids stale closure issues in canvas callbacks
  const S=useRef({
    players:mkPlayers(),
    arrows:[],
    phases:[],
    phaseColor:'#E24B4A',
    balls:[{x:W/2,y:H/2,ghost:false}],
    colorA:'#E24B4A',colorB:'#378ADD',
    edgeColorA:'#ffffff',edgeColorB:'#ffffff',
    teamNameA:'',teamNameB:'',
    arrowColor:'#F5F5F5',arrowStyle:'solid',arrowShape:'straight',arrowHeadSize:'m',
    view:'full',pR:14,markerSize:'m',activePh:0,labelContrast:'outline',
    legend:{x:10,y:10,scale:1,w:null,h:null,textColor:'#222',cols:2},
    stepLegend:{x:10,y:60,scale:1,w:null,h:null,textColor:'#333'},
    symbols:[],symbolColor:'#F5F5F5',symbolSize:'m',symbolType:'goal',
    selectedArrowIdx:null,selectedBallIdx:null,selectedPhaseMarker:null,selectedSymbolIdx:null,selectedGhostId:null,showGrid:false,
    multiSelection:[],
    mode:'move',
    cropRegion:null,cropSelected:false,
    moment:{heading:'',what:'',event:'',at:'',when:'',who:''},
    exportFormat:'a4',exportOrientation:'landscape',
  });

  // Viewport (pan/zoom) — separate from board state
  const vp=useRef({scale:1,ox:0,oy:0,panning:false,panStart:null});
  const spaceDown=useRef(false);
  const pendingDelete=useRef(null); // {items:[],label:''} or null

  // Transient drawing state
  const ar=useRef({drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null});
  const cropDrag=useRef({active:false,start:null,current:null,constrained:null});
  const drag=useRef({active:false,type:null});

  // Step legend rendered size — needed for hit testing
  const stepLegendDrawn=useRef({w:0,h:0});

  // React state — only what must trigger re-renders
  const [tick,setTick]=useState(0);
  const [cursorStyle,setCursorStyle]=useState('default');
  const [expandedId,setExpandedId]=useState(null);
  const [activeTeam,setActiveTeam]=useState('A');
  // ─── FIREBASE AUTH + LIBRARY STATE ───────────────────────────────────────
  const [fbUser,setFbUser]=useState(null);          // null = signed out, obj = signed in
  const [fbAuthReady,setFbAuthReady]=useState(false); // true once auth state resolved
  const [boards,setBoards]=useState([]);             // [{id,name,updatedAt,thumbnail}]
  const [libOpen,setLibOpen]=useState(false);        // library panel open/closed
  const [libSaving,setLibSaving]=useState(false);
  const [libMsg,setLibMsg]=useState('');
  const [newBoardName,setNewBoardName]=useState('');
  const [saveMsg,setSaveMsg]=useState('');
  const [currentBoardId,setCurrentBoardId]=useState(null);
  const savedBoardStateRef=useRef(null); // JSON snapshot of last saved/loaded state for dirty-check
  const [apiKey,setApiKeyState]=useState('');
  const [showKey,setShowKey]=useState(false);

  // ─── ALLOWED USERS (whitelist) ────────────────────────────────────────────
  const ALLOWED_EMAILS=['mats@hultgrensaksi.com','mats.p.hultgren@gmail.com'];
  const [aiText,setAiText]=useState('');
  const [aiLoading,setAiLoading]=useState(false);
  const [aiStatus,setAiStatus]=useState('');
  const [aiTimestamp,setAiTimestamp]=useState('');
  const [imageData,setImageData]=useState(null);
  const [aiPending,setAiPending]=useState(null); // {data,summary} awaiting confirm
  const [expandedPlayers,setExpandedPlayers]=useState({});

  const imageInputRef=useRef(null);
  const importInputRef=useRef(null);
  const textareaRef=useRef(null);

  function redraw(){setTick(t=>t+1);}

  // ─── VIEWPORT ─────────────────────────────────────────────────────────────
  function clampVP(scale,ox,oy){
    const minOx=W-W*scale,minOy=H-H*scale;
    return{ox:Math.min(0,Math.max(minOx,ox)),oy:Math.min(0,Math.max(minOy,oy))};
  }
  function resetZoom(){vp.current={scale:1,ox:0,oy:0,panning:false,panStart:null};redraw();}
  function zoomStep(delta,cx,cy){
    const v=vp.current,newScale=Math.max(1,Math.min(4,v.scale*delta)),ratio=newScale/v.scale;
    const c=clampVP(newScale,cx-(cx-v.ox)*ratio,cy-(cy-v.oy)*ratio);
    vp.current={...v,scale:newScale,ox:c.ox,oy:c.oy};redraw();
  }

  // Screen event → pitch coordinate
  function gp(e){
    const rect=canvasRef.current.getBoundingClientRect(),sx=W/rect.width,sy=H/rect.height;
    const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;
    const{scale,ox,oy}=vp.current;
    return{x:((cx-rect.left)*sx-ox)/scale,y:((cy-rect.top)*sy-oy)/scale};
  }

  // ─── ANCHOR RESOLUTION ────────────────────────────────────────────────────
  function resolveAnchor(anchor){
    if(!anchor)return null;
    const st=S.current;
    if(anchor.type==='player'){
      const p=st.players.find(p=>p.id===anchor.key)||st.players.find(p=>p.team+p.num===anchor.key&&!p.ghost);
      return p?{x:p.x,y:p.y}:null;
    }
    if(anchor.type==='ball'){const bl=st.balls[anchor.key];return bl?{x:bl.x,y:bl.y}:null;}
    return null;
  }
  function nearAnchor(pos,excludePlayerKey){
    const st=S.current,r=st.pR+8;
    const player=st.players.find(p=>!p.ghost&&!p.hidden&&p.team+p.num!==excludePlayerKey&&Math.hypot(p.x-pos.x,p.y-pos.y)<r);
    if(player)return{type:'player',key:player.id||player.team+player.num};
    const bi=st.balls.findIndex(b=>Math.hypot(b.x-pos.x,b.y-pos.y)<14);
    if(bi>=0)return{type:'ball',key:bi};
    return null;
  }
  function findSnapTarget(pos){
    const st=S.current,r=st.pR+12;
    const player=st.players.find(p=>!p.ghost&&!p.hidden&&Math.hypot(p.x-pos.x,p.y-pos.y)<r);
    if(player)return{x:player.x,y:player.y};
    const bl=st.balls.find(b=>Math.hypot(b.x-pos.x,b.y-pos.y)<16);
    if(bl)return{x:bl.x,y:bl.y};
    return null;
  }

  // ─── CROP HELPERS ─────────────────────────────────────────────────────────
  function pageAspect(){
    const fmt=S.current.exportFormat||'a4',ori=S.current.exportOrientation||'landscape';
    const sizes={a4:{w:297,h:210},letter:{w:279.4,h:215.9},hoop:{w:280,h:250}};
    const ps=sizes[fmt]||sizes['a4'];
    return ori==='landscape'?(ps.w/ps.h):(ps.h/ps.w);
  }
  function constrainCrop(s,c){
    const ar2=pageAspect(),rawW=c.x-s.x,rawH=c.y-s.y;
    let w=rawW,h=rawH;
    if(Math.abs(rawW)/ar2>Math.abs(rawH)){h=(rawW>0?1:-1)*Math.abs(rawW)/ar2;}
    else{w=(rawH>0?1:-1)*Math.abs(rawH)*ar2;}
    return{x:Math.min(s.x,s.x+w),y:Math.min(s.y,s.y+h),w:Math.abs(w),h:Math.abs(h)};
  }
  function formatLabel(){
    const fmt=S.current.exportFormat||'a4',ori=S.current.exportOrientation||'landscape';
    return fmt==='hoop'?'Hoop':fmt.toUpperCase()+' '+(ori==='landscape'?'⬛':'⬜');
  }

  // ─── HIT TESTING ──────────────────────────────────────────────────────────
  function hitPlayer(pos){const r=S.current.pR;return S.current.players.find(p=>!p.ghost&&!p.hidden&&Math.hypot(p.x-pos.x,p.y-pos.y)<r+4);}
  function hitGhost(pos){const r=S.current.pR;return S.current.players.find(p=>p.ghost&&Math.hypot(p.x-pos.x,p.y-pos.y)<r+6);}
  function hitBall(pos){return S.current.balls.findIndex(bl=>Math.hypot(bl.x-pos.x,bl.y-pos.y)<14);}
  function hitArrow(pos){const arr=S.current.arrows;for(let i=arr.length-1;i>=0;i--)if(distToArrow(pos,arr[i])<10)return i;return -1;}
  function hitSymbol(pos){const syms=S.current.symbols||[];for(let i=syms.length-1;i>=0;i--){const s=syms[i];if(Math.hypot(s.x-pos.x,s.y-pos.y)<symbolHitR(s.size))return i;}return -1;}

  function hitArrowHandle(pos){
    const st=S.current;if(st.selectedArrowIdx===null)return null;
    const a=st.arrows[st.selectedArrowIdx];if(!a)return null;
    const s=resolveAnchor(a.startAnchor)||a.path[0];
    const e=resolveAnchor(a.endAnchor)||a.path[a.path.length-1];
    if(Math.hypot(pos.x-s.x,pos.y-s.y)<10)return'start';
    if(Math.hypot(pos.x-e.x,pos.y-e.y)<10)return'end';
    if((a.shape==='curve'||a.shape==='elbow')&&a.cp&&Math.hypot(pos.x-a.cp.x,pos.y-a.cp.y)<10)return'cp';
    if(distToArrow(pos,a)<10)return'body';
    return null;
  }
  function hitPhaseMarker(pos){
    const st=S.current;
    for(let pi=st.phases.length-1;pi>=0;pi--){
      const markers=st.phases[pi].markers||[];
      for(let mi=markers.length-1;mi>=0;mi--){
        const m=markers[mi],half=markerHalf(st);
        if(Math.abs(pos.x-m.x)<=half&&Math.abs(pos.y-m.y)<=half)return{phaseIdx:pi,markerIdx:mi};
      }
    }
    return null;
  }
  // Returns handle type for legend boxes: 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w'|'body'|null
  function getLegendBox(which){
    const st=S.current;
    if(which==='legend'){
      const rows=getLegendRows(S);if(!rows)return null;
      const leg=st.legend;
      const sc=Math.max(0.5,Math.min(2,leg.scale||1));
      const cols=leg.cols!==undefined?leg.cols:2;
      const w=leg.w!==null&&leg.w!==undefined?leg.w:legendAutoW(rows,sc,cols);
      const h=leg.h!==null&&leg.h!==undefined?leg.h:legendAutoH(rows,sc,cols);
      return{x:leg.x,y:leg.y,w,h};
    }else{
      if(!st.phases.length)return null;
      const sl=st.stepLegend;
      const{w,h}=stepLegendDrawn.current;
      return{x:sl.x,y:sl.y,w:w||180,h:h||100};
    }
  }
  function hitLegendHandle(pos,which){
    const b=getLegendBox(which);if(!b)return null;
    const{x,y,w,h}=b,tol=8;
    if(Math.hypot(pos.x-x,    pos.y-y    )<tol)return'nw';
    if(Math.hypot(pos.x-(x+w),pos.y-y    )<tol)return'ne';
    if(Math.hypot(pos.x-x,    pos.y-(y+h))<tol)return'sw';
    if(Math.hypot(pos.x-(x+w),pos.y-(y+h))<tol)return'se';
    if(Math.hypot(pos.x-(x+w/2),pos.y-y    )<tol)return'n';
    if(Math.hypot(pos.x-(x+w/2),pos.y-(y+h))<tol)return's';
    if(Math.hypot(pos.x-x,      pos.y-(y+h/2))<tol)return'w';
    if(Math.hypot(pos.x-(x+w),  pos.y-(y+h/2))<tol)return'e';
    if(pos.x>=x&&pos.x<=x+w&&pos.y>=y&&pos.y<=y+h)return'body';
    return null;
  }
  function hitLegend(pos){return hitLegendHandle(pos,'legend')=== 'body';}
  function hitLegendResize(pos){const h=hitLegendHandle(pos,'legend');return h&&h!=='body'?h:null;}
  function hitStepLegend(pos){return hitLegendHandle(pos,'stepLegend')=== 'body';}
  function hitStepLegendResize(pos){const h=hitLegendHandle(pos,'stepLegend');return h&&h!=='body'?h:null;}
  // Returns: 'delete'|'move'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w'|null
  function hitCrop(pos){
    const cr=S.current.cropRegion;if(!cr)return null;
    const{x,y,w,h}=cr,sc=vp.current.scale;
    const tol=9/sc,strip=8/sc;
    if(Math.hypot(pos.x-(x+w+2/sc),pos.y-(y-2/sc))<9/sc)return'delete';
    if(Math.hypot(pos.x-x,    pos.y-y    )<tol)return'nw';
    if(Math.hypot(pos.x-(x+w),pos.y-y    )<tol)return'ne';
    if(Math.hypot(pos.x-x,    pos.y-(y+h))<tol)return'sw';
    if(Math.hypot(pos.x-(x+w),pos.y-(y+h))<tol)return'se';
    if(Math.hypot(pos.x-(x+w/2),pos.y-y    )<tol)return'n';
    if(Math.hypot(pos.x-(x+w/2),pos.y-(y+h))<tol)return's';
    if(Math.hypot(pos.x-x,      pos.y-(y+h/2))<tol)return'w';
    if(Math.hypot(pos.x-(x+w),  pos.y-(y+h/2))<tol)return'e';
    const inX=pos.x>=x&&pos.x<=x+w,inY=pos.y>=y&&pos.y<=y+h;
    if(inX&&(Math.abs(pos.y-y)<strip||Math.abs(pos.y-(y+h))<strip))return'move';
    if(inY&&(Math.abs(pos.x-x)<strip||Math.abs(pos.x-(x+w))<strip))return'move';
    return null;
  }

  // ─── DRAW: PITCH ──────────────────────────────────────────────────────────
  function drawPitch(ctx,v){
    const CCR=52,pad=20,L='rgba(255,255,255,0.88)';
    const b=v==='left'?{x:0,w:W/2+CCR}:v==='right'?{x:W/2-CCR,w:W/2+CCR}:{x:0,w:W};
    ctx.save();
    if(v!=='full'){ctx.beginPath();ctx.rect(b.x,0,b.w,H);ctx.clip();}
    for(let i=0;i<8;i++){ctx.fillStyle=i%2===0?'#3a7d44':'#2f6b38';ctx.fillRect(i*W/8,0,W/8,H);}
    ctx.strokeStyle=L;ctx.lineWidth=1.5;
    ctx.strokeRect(pad,pad,W-pad*2,H-pad*2);
    ctx.beginPath();ctx.moveTo(W/2,pad);ctx.lineTo(W/2,H-pad);ctx.stroke();
    ctx.beginPath();ctx.arc(W/2,H/2,50,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(W/2,H/2,3,0,Math.PI*2);ctx.fillStyle=L;ctx.fill();
    const bxW=120,bxH=160,bxY=(H-bxH)/2,smH=80,smY=(H-smH)/2,gH=50,gY=(H-gH)/2;
    ctx.strokeRect(pad,bxY,bxW,bxH);ctx.strokeRect(W-pad-bxW,bxY,bxW,bxH);
    ctx.strokeRect(pad,smY,50,smH);ctx.strokeRect(W-pad-50,smY,50,smH);
    ctx.beginPath();ctx.arc(pad+bxW,H/2,40,-Math.PI*.55,Math.PI*.55);ctx.stroke();
    ctx.beginPath();ctx.arc(W-pad-bxW,H/2,40,Math.PI*.45,Math.PI*1.55);ctx.stroke();
    ctx.lineWidth=2;ctx.strokeRect(pad-12,gY,12,gH);ctx.strokeRect(W-pad,gY,12,gH);
    ctx.restore();
  }

  // ─── DRAW: CROP LAYER (pitch-space dim below all objects) ─────────────────
  function drawGrid(ctx){
    const GRID=20;
    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,0.18)';
    ctx.lineWidth=0.5;
    ctx.setLineDash([2,3]);
    for(let x=GRID;x<W;x+=GRID){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=GRID;y<H;y+=GRID){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.setLineDash([]);
    ctx.font='bold 8px sans-serif';ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText('1 sq = ~3 stitches  (280×250mm hoop, 14-ct aida)',4,2);
    ctx.restore();
  }

  function drawCropLayer(ctx,cr,scale){
    if(!cr||S.current.mode==='crop')return;
    const LARGE=5000;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.fillRect(-LARGE,-LARGE,LARGE+cr.x,LARGE*2);
    ctx.fillRect(cr.x+cr.w,-LARGE,LARGE,LARGE*2);
    ctx.fillRect(cr.x,-LARGE,cr.w,LARGE+cr.y);
    ctx.fillRect(cr.x,cr.y+cr.h,cr.w,LARGE);
    ctx.strokeStyle='rgba(255,215,0,0.65)';ctx.lineWidth=2/scale;
    ctx.setLineDash([7/scale,4/scale]);ctx.strokeRect(cr.x,cr.y,cr.w,cr.h);ctx.setLineDash([]);
    ctx.restore();
  }

  // ─── DRAW: ARROWS ─────────────────────────────────────────────────────────
  function drawArrows(ctx,arr,selA,hs){

    // Smooth a polyline using Chaikin's algorithm (corner-cutting)
    // Produces a smooth curve through the control points
    function chaikin(pts,passes){
      let p=pts;
      for(let k=0;k<passes;k++){
        const q=[p[0]];
        for(let i=0;i<p.length-1;i++){
          q.push({x:0.75*p[i].x+0.25*p[i+1].x, y:0.75*p[i].y+0.25*p[i+1].y});
          q.push({x:0.25*p[i].x+0.75*p[i+1].x, y:0.25*p[i].y+0.75*p[i+1].y});
        }
        q.push(p[p.length-1]);
        p=q;
      }
      return p;
    }

    // Resample a polyline to evenly-spaced points
    function resample(pts,spacing){
      if(pts.length<2)return pts;
      const out=[{x:pts[0].x,y:pts[0].y}];
      let acc=0;
      for(let i=1;i<pts.length;i++){
        const dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;
        const seg=Math.hypot(dx,dy);
        if(seg<0.001)continue;
        let d=acc;
        while(d<seg){
          const t=d/seg;
          out.push({x:pts[i-1].x+dx*t,y:pts[i-1].y+dy*t});
          d+=spacing;
        }
        acc=d-seg;
      }
      out.push({x:pts[pts.length-1].x,y:pts[pts.length-1].y});
      return out;
    }

    // Get smoothed tangent at index i using a wider window
    function tangent(pts,i){
      const w=3; // look 3 points ahead and behind
      const a=pts[Math.max(0,i-w)],b=pts[Math.min(pts.length-1,i+w)];
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      return{dx:dx/len,dy:dy/len};
    }

    // Build wave points along a smooth base path
    // amp: peak displacement in px, wavelen: full cycle length in px
    function buildWave(basePts,amp,wavelen){
      // Resample to 6px intervals for smooth tangent estimation
      const pts=resample(basePts,6);
      if(pts.length<2)return pts;
      // Cumulative arc length
      const arc=[0];
      for(let i=1;i<pts.length;i++)
        arc.push(arc[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y));
      const wp=pts.map((p,i)=>{
        const{dx,dy}=tangent(pts,i);
        // Perpendicular (left of direction)
        const nx=-dy,ny=dx;
        // Sine offset — full cycle every wavelen px
        const offset=Math.sin((arc[i]/wavelen)*Math.PI*2)*amp;
        return{x:p.x+nx*offset,y:p.y+ny*offset};
      });
      // Clamp endpoints exactly to the line
      wp[0]={x:basePts[0].x,y:basePts[0].y};
      wp[wp.length-1]={x:basePts[basePts.length-1].x,y:basePts[basePts.length-1].y};
      return wp;
    }

    // Draw a smooth wave path using quadratic bezier smoothing
    function drawWave(ctx,wp){
      if(wp.length<2)return;
      ctx.beginPath();
      ctx.moveTo(wp[0].x,wp[0].y);
      for(let i=1;i<wp.length-1;i++){
        const mx=(wp[i].x+wp[i+1].x)/2,my=(wp[i].y+wp[i+1].y)/2;
        ctx.quadraticCurveTo(wp[i].x,wp[i].y,mx,my);
      }
      ctx.lineTo(wp[wp.length-1].x,wp[wp.length-1].y);
      ctx.stroke();
    }

    function drawOne(a,isSel){
      const s=resolveAnchor(a.startAnchor)||a.path[0];
      const e=resolveAnchor(a.endAnchor)||a.path[a.path.length-1];
      if(!s||!e)return;
      if(isSel){
        if(a.startAnchor){ctx.save();ctx.beginPath();ctx.arc(s.x,s.y,8,0,Math.PI*2);ctx.strokeStyle='rgba(16,185,129,0.7)';ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke();ctx.restore();}
        if(a.endAnchor){ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.strokeStyle='rgba(16,185,129,0.7)';ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke();ctx.restore();}
      }
      const ahs=AHEAD[a.headSize]!==undefined?AHEAD[a.headSize]:hs;const col=isSel?C.blue:a.color;
      ctx.save();ctx.strokeStyle=col;ctx.lineWidth=isSel?3:2.2;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.setLineDash(a.style==='dashed'?[7,4]:[]);
      if(a.style==='wave'){
        let basePts;
        if(a.shape==='straight'){
          // Two points — resample to get smooth wave
          basePts=[s,e];
        }else if(a.shape==='curve'&&a.cp){
          // Sample bezier curve into points
          basePts=[];
          for(let i=0;i<=32;i++){const t=i/32;basePts.push({x:(1-t)*(1-t)*s.x+2*(1-t)*t*a.cp.x+t*t*e.x,y:(1-t)*(1-t)*s.y+2*(1-t)*t*a.cp.y+t*t*e.y});}
        }else if(a.shape==='elbow'){
          // Round the corner to avoid direction-reversal spikes
          const corner=a.cp||{x:e.x,y:s.y};
          const d1x=s.x-corner.x,d1y=s.y-corner.y,l1=Math.hypot(d1x,d1y)||1;
          const d2x=e.x-corner.x,d2y=e.y-corner.y,l2=Math.hypot(d2x,d2y)||1;
          const cr=Math.min(24,l1*0.35,l2*0.35);
          const p1={x:corner.x+d1x/l1*cr,y:corner.y+d1y/l1*cr};
          const p2={x:corner.x+d2x/l2*cr,y:corner.y+d2y/l2*cr};
          basePts=[s,p1];
          for(let i=1;i<=10;i++){const t=i/10;basePts.push({x:(1-t)*(1-t)*p1.x+2*(1-t)*t*corner.x+t*t*p2.x,y:(1-t)*(1-t)*p1.y+2*(1-t)*t*corner.y+t*t*p2.y});}
          basePts.push(p2,e);
        }else{
          // Freehand: smooth the recorded path first with Chaikin
          const raw=a.path.length>1?a.path:[s,e];
          basePts=chaikin(raw,3);
        }
        // Wave parameters: amplitude 5px, one full cycle per 48px
        // Trim base path 15px short so wave ends before the endpoint,
        // then draw a straight tail for clean arrowhead direction
        const TAIL=15;
        // Find the trim point: walk base path backwards until we've covered TAIL px
        let tailStart=null,tailDir=null;
        {
          let rem=TAIL;
          for(let i=basePts.length-1;i>0&&rem>0;i--){
            const dx=basePts[i].x-basePts[i-1].x,dy=basePts[i].y-basePts[i-1].y;
            const seg=Math.hypot(dx,dy);
            if(seg>=rem){
              const t=rem/seg;
              tailStart={x:basePts[i].x-dx*t,y:basePts[i].y-dy*t};
              tailDir={dx:dx/seg,dy:dy/seg};
              rem=0;
            }else{rem-=seg;}
          }
          if(!tailStart){tailStart={x:basePts[0].x,y:basePts[0].y};tailDir={dx:e.x-basePts[0].x,dy:e.y-basePts[0].y};}
          const tl=Math.hypot(tailDir.dx,tailDir.dy)||1;
          tailDir={dx:tailDir.dx/tl,dy:tailDir.dy/tl};
        }
        // Build trimmed base (remove points beyond tailStart)
        const trimmed=[];
        for(let i=0;i<basePts.length;i++){
          const dx=basePts[i].x-tailStart.x,dy=basePts[i].y-tailStart.y;
          const dotProduct=dx*tailDir.dx+dy*tailDir.dy;
          if(dotProduct<0.5)trimmed.push(basePts[i]);
        }
        trimmed.push(tailStart);
        const wp=buildWave(trimmed.length>1?trimmed:[s,tailStart],5,48);
        ctx.setLineDash([]);
        drawWave(ctx,wp);
        // Straight tail: from wave end to actual endpoint
        ctx.beginPath();ctx.moveTo(tailStart.x,tailStart.y);ctx.lineTo(e.x,e.y);ctx.stroke();
        // Arrowhead direction from straight tail
        if(ahs>0)drawArrowHead(ctx,tailStart,e,col,ahs);
      }else if(a.shape==='straight'){
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
        if(ahs>0)drawArrowHead(ctx,s,e,col,ahs);
      }else if(a.shape==='curve'&&a.cp){
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.quadraticCurveTo(a.cp.x,a.cp.y,e.x,e.y);ctx.stroke();
        const ct=0.95,ctx2=2*(1-ct)*(a.cp.x-s.x)+2*ct*(e.x-a.cp.x),cty=2*(1-ct)*(a.cp.y-s.y)+2*ct*(e.y-a.cp.y);
        if(ahs>0)drawArrowHead(ctx,{x:e.x-ctx2*0.1,y:e.y-cty*0.1},e,col,ahs);
      }else if(a.shape==='elbow'){
        const corner=a.cp||{x:e.x,y:s.y};
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(corner.x,corner.y);ctx.lineTo(e.x,e.y);ctx.stroke();
        if(ahs>0)drawArrowHead(ctx,corner,e,col,ahs);
      }else{
        ctx.beginPath();ctx.moveTo(a.path[0].x,a.path[0].y);
        for(let i=1;i<a.path.length;i++)ctx.lineTo(a.path[i].x,a.path[i].y);
        ctx.stroke();if(ahs>0)drawArrowHead(ctx,a.path[Math.max(0,a.path.length-2)],e,col,ahs);
      }
      ctx.restore();
      if(isSel){
        [[s,'start'],[e,'end'],...((a.shape==='curve'||a.shape==='elbow')&&a.cp?[[a.cp,'cp']]:[])].forEach(([pt,id])=>{
          ctx.save();ctx.beginPath();ctx.arc(pt.x,pt.y,6,0,Math.PI*2);
          ctx.fillStyle=id==='cp'?'#F59E0B':C.blue;ctx.fill();
          ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
        });
        if((a.shape==='curve'||a.shape==='elbow')&&a.cp){
          ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(37,99,235,0.3)';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(a.cp.x,a.cp.y);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.restore();
        }
      }
    }
    arr.forEach((a,i)=>drawOne(a,i===selA));
    // Anchor dots
    arr.forEach(a=>{
      if(a.startAnchor){const ap=resolveAnchor(a.startAnchor);if(ap){ctx.save();ctx.beginPath();ctx.arc(ap.x,ap.y,4,0,Math.PI*2);ctx.fillStyle='rgba(37,99,235,0.75)';ctx.fill();ctx.restore();}}
      if(a.endAnchor){const ap=resolveAnchor(a.endAnchor);if(ap){ctx.save();ctx.beginPath();ctx.arc(ap.x,ap.y,4,0,Math.PI*2);ctx.fillStyle='rgba(37,99,235,0.75)';ctx.fill();ctx.restore();}}
    });
    // Arrow preview while drawing
    if(ar.current.drawing&&ar.current.cPath.length>1){
      ctx.save();ctx.strokeStyle='rgba(37,99,235,0.45)';ctx.lineWidth=1.8;ctx.setLineDash([5,3]);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(ar.current.cPath[0].x,ar.current.cPath[0].y);
      for(let i=1;i<ar.current.cPath.length;i++)ctx.lineTo(ar.current.cPath[i].x,ar.current.cPath[i].y);
      ctx.stroke();ctx.restore();
    }
    // Snap highlight
    if(ar.current.drawing){
      const sp=ar.current.cPath[ar.current.cPath.length-1];
      if(sp){const snap=findSnapTarget(sp);if(snap){ctx.save();ctx.beginPath();ctx.arc(snap.x,snap.y,S.current.pR+8,0,Math.PI*2);ctx.strokeStyle='rgba(37,99,235,0.65)';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);ctx.restore();}}
    }
    if(ar.current.drawing&&S.current.arrowShape==='elbow'&&ar.current.aStart){
      ctx.save();ctx.fillStyle='rgba(37,99,235,0.7)';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
      ctx.fillText('Click to complete elbow — drag the corner handle to adjust',ar.current.aStart.x+14,ar.current.aStart.y-16);
      ctx.restore();
    }
  }



  // ─── DRAW: PITCH SYMBOLS ──────────────────────────────────────────────────
  function drawSymbols(ctx,symbols,selIdx){
    (symbols||[]).forEach(function(sym,i){
      const r=SSIZES[sym.size||'m']||SSIZES.m;
      drawSymbolCanvas(ctx,sym.x,sym.y,r,sym.type||'goal',sym.color||'#F5F5F5');
      if(selIdx===i){
        var pad2=Math.round(r*0.28);
        var bSel=r*2+pad2*2;
        var bxS=sym.x-r-pad2,byS=sym.y-r-pad2,brS=Math.round(bSel*0.22);
        ctx.save();ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;ctx.setLineDash([4,3]);
        ctx.beginPath();
        ctx.moveTo(bxS+brS,byS-3);ctx.lineTo(bxS+bSel-brS,byS-3);
        ctx.quadraticCurveTo(bxS+bSel+3,byS-3,bxS+bSel+3,byS+brS);
        ctx.lineTo(bxS+bSel+3,byS+bSel-brS);
        ctx.quadraticCurveTo(bxS+bSel+3,byS+bSel+3,bxS+bSel-brS,byS+bSel+3);
        ctx.lineTo(bxS+brS,byS+bSel+3);
        ctx.quadraticCurveTo(bxS-3,byS+bSel+3,bxS-3,byS+bSel-brS);
        ctx.lineTo(bxS-3,byS+brS);
        ctx.quadraticCurveTo(bxS-3,byS-3,bxS+brS,byS-3);
        ctx.closePath();ctx.stroke();
        ctx.setLineDash([]);ctx.restore();
      }
    });
  }
  // ─── DRAW: PHASE MARKERS ──────────────────────────────────────────────────
  function drawPhaseMarkers(ctx,ph,phaseColor,selPM,st){
    ph.forEach((p,pi)=>(p.markers||[]).forEach((m,mi)=>{
      const isSel=selPM&&selPM.phaseIdx===pi&&selPM.markerIdx===mi;
      const half=markerHalf(st);
      drawSquareMarker(ctx,m.x,m.y,half,phaseColor,isSel?'#fff':'rgba(255,255,255,0.75)',isSel?2.5:1.5);
      if(isSel){ctx.setLineDash([4,3]);drawSquareMarker(ctx,m.x,m.y,half+4,null,'rgba(255,255,255,0.5)',1.5);ctx.setLineDash([]);}
      const mfs=Math.max(7,Math.round(half*1.3));
      ctx.fillStyle='#fff';ctx.font=`bold ${mfs}px Inter,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(phaseLabel(p.label),m.x,m.y+Math.round(mfs*0.06));
    }));
  }

  // ─── DRAW: PLAYERS ────────────────────────────────────────────────────────
  function drawPlayers(ctx,pl,v,r,cA,cB,st){
    function drawOne(p,isGhost){
      if(!isGhost&&p.hidden)return;
      if(v!=='full'){const CCR2=52,bx=v==='left'?{x:0,w:W/2+CCR2}:{x:W/2-CCR2,w:W/2+CCR2};if(p.x<bx.x||p.x>bx.x+bx.w)return;}
      const col=p.team==='A'?cA:cB;
      ctx.save();
      const gr=Math.round(r*0.75);
      if(isGhost){
        ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fill();
        ctx.setLineDash([4,4]);ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
        const ew=r<=10?2:r<=14?2.5:3;
        const ec=(p.team==='A'?st.edgeColorA:st.edgeColorB)||'rgba(255,255,255,0.85)';
        ctx.strokeStyle=ec;ctx.lineWidth=ew;ctx.stroke();
      }
      const contrast=st.labelContrast||'normal',fs=Math.max(9,Math.round(r*1.1));
      ctx.font=`bold ${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      if(isGhost){ctx.font=`bold ${Math.max(9,Math.round(r*1.1))}px Inter,sans-serif`;ctx.strokeStyle='rgba(0,0,0,0.82)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeText(p.num,p.x,p.y);ctx.fillStyle=col;ctx.fillText(p.num,p.x,p.y);}
      else if(contrast==='outline'){ctx.strokeStyle='rgba(0,0,0,0.88)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeText(p.num,p.x,p.y);ctx.fillStyle='#fff';ctx.fillText(p.num,p.x,p.y);}
      else if(contrast==='dark'){ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=2;ctx.lineJoin='round';ctx.strokeText(p.num,p.x,p.y);ctx.fillStyle='#111';ctx.fillText(p.num,p.x,p.y);}
      else{ctx.fillStyle='#fff';ctx.fillText(p.num,p.x,p.y);}
      if(!isGhost&&p.name&&r>=14){
        const nameFs=Math.max(9,r-5);ctx.font=`${nameFs}px sans-serif`;
        if(contrast==='outline'){ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=2;ctx.strokeText(p.name,p.x,p.y+r+10);ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fillText(p.name,p.x,p.y+r+10);}
        else if(contrast==='dark'){ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillText(p.name,p.x,p.y+r+10);}
        else{ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillText(p.name,p.x,p.y+r+10);}
      }
      ctx.restore();
    }
    pl.filter(p=>p.ghost).forEach(p=>drawOne(p,true));
    pl.filter(p=>!p.ghost).forEach(p=>drawOne(p,false));
  }

  // ─── DRAW: BALLS ──────────────────────────────────────────────────────────
  function drawBalls(ctx,balls,selB,v,pR){
    const br=Math.max(6,Math.round(pR*0.65));
    function drawOne(bx,by,br2,sel,ghost,score){
      ctx.save();
      if(ghost){
        ctx.beginPath();ctx.arc(bx,by,br2,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fill();
        ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(255,255,255,0.95)';ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);
      }else{
        ctx.beginPath();ctx.arc(bx,by,br2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        ctx.strokeStyle=sel?C.blue:'#333';ctx.lineWidth=sel?2:1.2;ctx.stroke();
        ctx.beginPath();
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2,px=bx+Math.cos(a)*(br2*0.38),py=by+Math.sin(a)*(br2*0.38);i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
        ctx.closePath();ctx.fillStyle='#1a1a1a';ctx.fill();
        ctx.strokeStyle='#333';ctx.lineWidth=0.9;
        for(let i=0;i<5;i++){
          const a=i*Math.PI*2/5-Math.PI/2;
          const ix=bx+Math.cos(a)*(br2*0.38),iy=by+Math.sin(a)*(br2*0.38);
          const ox=bx+Math.cos(a)*br2,oy=by+Math.sin(a)*br2;
          ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(ox,oy);ctx.stroke();
          const a2=a+Math.PI*2/10,mx=bx+Math.cos(a2)*(br2*0.75),my=by+Math.sin(a2)*(br2*0.75);
          ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(mx,my);ctx.stroke();
        }
        if(sel){ctx.globalAlpha=1;ctx.beginPath();ctx.arc(bx,by,br2+5,0,Math.PI*2);ctx.strokeStyle='rgba(37,99,235,0.5)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
      }
      if(score){
        const spikes=8,gap=2,spikeLen=br2*0.55;
        const inner=br2+2.5+gap;
        const outerLong=inner+spikeLen,outerShort=inner+spikeLen*0.55;
        ctx.save();ctx.strokeStyle='rgba(255,255,255,0.95)';ctx.lineWidth=2.5;ctx.lineCap='round';
        for(let i=0;i<spikes;i++){
          const a=i*Math.PI*2/spikes-Math.PI/2;
          const outerR=i%2===0?outerShort:outerLong;
          ctx.beginPath();ctx.moveTo(bx+Math.cos(a)*inner,by+Math.sin(a)*inner);
          ctx.lineTo(bx+Math.cos(a)*outerR,by+Math.sin(a)*outerR);ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    [true,false].forEach(isGhost=>{
      balls.forEach((bl,bi)=>{
        if(!!bl.ghost!==isGhost)return;
        if(v!=='full'&&((v==='left'&&bl.x>W/2)||(v==='right'&&bl.x<W/2)))return;
        drawOne(bl.x,bl.y,br,selB===bi,bl.ghost,bl.score);
      });
    });
  }

  // ─── DRAW: LEGENDS ────────────────────────────────────────────────────────
  // ─── DRAW: LEGENDS ────────────────────────────────────────────────────────
  function drawLegends(ctx,st,cA,cB,ph,phaseColor){
    const rows=getLegendRows(S);
    if(rows){
      const leg=st.legend;
      const sc=Math.max(0.5,Math.min(2,leg.scale||1));
      const{pad,lineH,dotS,headerFs,nameFs}=legendFontSizes(sc);
      const cols=leg.cols!==undefined?leg.cols:(rows.teamA.length>0&&rows.teamB.length>0?2:1);
      const boxW=leg.w!==null&&leg.w!==undefined?leg.w:legendAutoW(rows,sc,cols);
      const boxH=leg.h!==null&&leg.h!==undefined?leg.h:legendAutoH(rows,sc,cols);
      const lx=leg.x,ly=leg.y;
      ctx.save();
      // Background + border
      ctx.fillStyle='rgba(255,255,255,0.93)';ctx.strokeStyle='rgba(0,0,0,0.14)';ctx.lineWidth=1;
      roundRectPath(ctx,lx,ly,boxW,boxH,7);ctx.fill();ctx.stroke();
      // Clip content to box
      roundRectPath(ctx,lx,ly,boxW,boxH,7);ctx.clip();
      // Column width — splits box evenly
      const colW=cols>1?Math.floor(boxW/cols):boxW;
      const textCol=leg.textColor||'#222';
      let ci=0;
      const drawCol=(list,jerseyCol,name)=>{
        const cx=lx+pad+ci*colW;
        ctx.fillStyle=jerseyCol;ctx.font=`bold ${headerFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText(name,cx,ly+pad);
        list.forEach((p,i)=>{
          const ry=ly+pad+Math.round(14*sc)+pad/2+i*lineH,dr=dotS/2;
          // Jersey dot
          ctx.beginPath();ctx.arc(cx+dr,ry+dr,dr,0,Math.PI*2);ctx.fillStyle=jerseyCol;ctx.fill();
          ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1;ctx.stroke();
          // Jersey number inside dot
          ctx.font=`bold ${Math.max(8,Math.round(dr*1.2))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.strokeText(p.num,cx+dr,ry+dr);
          ctx.fillStyle='#fff';ctx.fillText(p.num,cx+dr,ry+dr);
          // Player name
          ctx.fillStyle=textCol;ctx.font=`${nameFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
          const nameX=cx+dotS+Math.round(5*sc);
          const maxNameW=colW-dotS-Math.round(5*sc)-pad;
          const nameLines=wrapText(ctx,p.name,maxNameW);
          const nameLineH=lineH/Math.max(1,nameLines.length);
          nameLines.forEach((line,li)=>ctx.fillText(line,nameX,ry+dr+(li-(nameLines.length-1)/2)*nameLineH));
        });
        ci++;
      };
      if(cols===2){
        if(rows.teamA.length)drawCol(rows.teamA,cA,st.teamNameA||'Team A');
        if(rows.teamB.length)drawCol(rows.teamB,cB,st.teamNameB||'Team B');
      }else{
        // Single column: A then B stacked
        const combined=[
          ...rows.teamA.map(p=>({...p,jerseyCol:cA,teamName:st.teamNameA||'Team A'})),
          ...rows.teamB.map(p=>({...p,jerseyCol:cB,teamName:st.teamNameB||'Team B'})),
        ];
        // Header with both names
        const header=(st.teamNameA||'A')+' / '+(st.teamNameB||'B');
        ctx.fillStyle='#555';ctx.font=`bold ${headerFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText(header,lx+pad,ly+pad);
        combined.forEach((p,i)=>{
          const ry=ly+pad+Math.round(14*sc)+pad/2+i*lineH,dr=dotS/2;
          ctx.beginPath();ctx.arc(lx+pad+dr,ry+dr,dr,0,Math.PI*2);ctx.fillStyle=p.jerseyCol;ctx.fill();
          ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1;ctx.stroke();
          ctx.font=`bold ${Math.max(8,Math.round(dr*1.2))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.strokeText(p.num,lx+pad+dr,ry+dr);
          ctx.fillStyle='#fff';ctx.fillText(p.num,lx+pad+dr,ry+dr);
          ctx.fillStyle=textCol;ctx.font=`${nameFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
          const nameX=lx+pad+dotS+Math.round(5*sc);
          const maxNameW=boxW-dotS-Math.round(5*sc)-pad*2;
          const nameLines=wrapText(ctx,p.name,maxNameW);
          const nameLineH=lineH/Math.max(1,nameLines.length);
          nameLines.forEach((line,li)=>ctx.fillText(line,nameX,ry+dr+(li-(nameLines.length-1)/2)*nameLineH));
        });
      }
      ctx.restore();
      // Resize handles (8-point) — drawn after restore so not clipped
      const legActive=drag.current&&(drag.current.type==='legend'||drag.current.type==='legendResize');
      drawLegendHandles(ctx,lx,ly,boxW,boxH,legActive);
    }
    if(ph.length){
      const sl=st.stepLegend;
      const sc=Math.max(0.5,Math.min(2,sl.scale||1));
      const{pad,lineH,headerFs,nameFs}=legendFontSizes(sc);
      const stepLineH=Math.round(15*sc);
      const br=Math.round(6*sc);
      const autoW=Math.round(180*sc);
      const boxW=sl.w!==null&&sl.w!==undefined?sl.w:autoW;
      // Compute content height given current width
      const contentH=stepLegendAutoH(ph,sc,ctx,boxW);
      const boxH=sl.h!==null&&sl.h!==undefined?sl.h:contentH;
      const lx=sl.x,ly=sl.y;
      const textCol=sl.textColor||'#333';
      ctx.save();
      ctx.fillStyle='rgba(255,255,255,0.93)';ctx.strokeStyle='rgba(0,0,0,0.14)';ctx.lineWidth=1;
      roundRectPath(ctx,lx,ly,boxW,boxH,7);ctx.fill();ctx.stroke();
      roundRectPath(ctx,lx,ly,boxW,boxH,7);ctx.clip();
      ctx.fillStyle=phaseColor;ctx.font=`bold ${headerFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='top';
      ctx.fillText('Moves',lx+pad,ly+pad);
      let rowY=ly+pad+Math.round(13*sc)+pad/2;
      ph.forEach((p,i)=>{
        const ry=rowY,bx=lx+pad+br,textX=lx+pad+br*2+Math.round(6*sc);
        const lineMid=ry+stepLineH/2;
        drawSquareMarker(ctx,bx,lineMid,br,phaseColor,'rgba(255,255,255,0.4)',1);
        ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(5,Math.round(br*0.9))}px Inter,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(phaseLabel(p.label),bx,lineMid+Math.round(Math.max(5,Math.round(br*0.9))*0.06));
        ctx.fillStyle=textCol;ctx.font=`${nameFs}px sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
        const note=p.note&&p.note.trim()?p.note:'—';
        const noteMaxW=boxW-pad*2-br*2-Math.round(5*sc);
        const noteLines=wrapText(ctx,note,noteMaxW);
        noteLines.forEach((line,li)=>ctx.fillText(line,textX,ry+li*stepLineH+stepLineH/2));
        rowY+=noteLines.length*stepLineH;
      });
      stepLegendDrawn.current={w:boxW,h:boxH};
      ctx.restore();
      const slActive=drag.current&&(drag.current.type==='stepLegend'||drag.current.type==='stepLegendResize');
      drawLegendHandles(ctx,lx,ly,boxW,boxH,slActive);
    }
  }

  // Draw 8-point resize handles on a box (drawn outside any clip region)



  function drawLegendHandles(ctx,lx,ly,w,h,show){
    if(!show)return; // no border unless actively being dragged/resized
    ctx.save();
    if(show){
      const hs=5;
      const pts=[[lx,ly],[lx+w/2,ly],[lx+w,ly],[lx+w,ly+h/2],[lx+w,ly+h],[lx+w/2,ly+h],[lx,ly+h],[lx,ly+h/2]];
      ctx.fillStyle='rgba(255,255,255,0.95)';ctx.strokeStyle='rgba(80,80,80,0.6)';ctx.lineWidth=0.8;
      pts.forEach(([hx,hy])=>{ctx.fillRect(hx-hs/2,hy-hs/2,hs,hs);ctx.strokeRect(hx-hs/2,hy-hs/2,hs,hs);});
    }
    ctx.restore();
  }

  function drawScreenOverlays(ctx,scale,ox,oy){
    // Zoom badge
    if(scale>1){
      ctx.save();ctx.fillStyle='rgba(0,0,0,0.4)';
      const bw=48,bh=22;
      roundRectPath(ctx,W-bw-8,H-bh-8,bw,bh,5);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(Math.round(scale*100)+'%',W-bw/2-8,H-bh/2-8);ctx.restore();
    }
    const pts=(px,py)=>({x:px*scale+ox,y:py*scale+oy});
    const cr=S.current.cropRegion,isSel=S.current.cropSelected;
    // Confirmed crop handles
    if(cr&&S.current.mode!=='crop'){
      const p=pts(cr.x,cr.y),crW=cr.w*scale,crH=cr.h*scale,crX=p.x,crY=p.y;
      ctx.save();
      if(isSel){ctx.strokeStyle='rgba(255,215,0,1)';ctx.lineWidth=2;ctx.setLineDash([]);}
      else{ctx.strokeStyle='rgba(255,215,0,0.55)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);}
      ctx.strokeRect(crX,crY,crW,crH);ctx.setLineDash([]);
      if(isSel){
        const cs=4;
        [[crX,crY],[crX+crW,crY],[crX,crY+crH],[crX+crW,crY+crH]].forEach(([hx,hy])=>{ctx.fillStyle='#FFD700';ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=1;ctx.fillRect(hx-cs,hy-cs,cs*2,cs*2);ctx.strokeRect(hx-cs,hy-cs,cs*2,cs*2);});
        [[crX+crW/2,crY],[crX+crW/2,crY+crH],[crX,crY+crH/2],[crX+crW,crY+crH/2]].forEach(([hx,hy])=>{ctx.fillStyle='#FFD700';ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,3.5,0,Math.PI*2);ctx.fill();ctx.stroke();});
        const xhx=crX+crW+1,xhy=crY-1;
        ctx.fillStyle='#E24B4A';ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(xhx,xhy,7,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',xhx,xhy);
      }
      const fmtLbl=formatLabel();
      ctx.fillStyle=isSel?'rgba(0,0,0,0.6)':'rgba(0,0,0,0.35)';ctx.font='bold 9px sans-serif';
      const fw=ctx.measureText(fmtLbl).width+8;ctx.fillRect(crX+3,crY+3,fw,14);
      ctx.fillStyle=isSel?'rgba(255,215,0,1)':'rgba(255,215,0,0.7)';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(fmtLbl,crX+7,crY+5);
      if(!isSel){ctx.fillStyle='rgba(255,215,0,0.6)';ctx.font='9px sans-serif';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText('click edge to select',crX+crW-4,crY+4);}
      ctx.restore();
    }
    // Crop drag overlay
    if(S.current.mode==='crop'){
      const cd=cropDrag.current;
      ctx.save();ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,0,W,H);
      const con=cd.constrained;
      if(cd.active&&cd.start&&con){
        const p1=pts(con.x,con.y),rws=con.w*scale,rhs=con.h*scale,rxs=p1.x,rys=p1.y;
        ctx.clearRect(rxs,rys,rws,rhs);
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(rxs,rys,rws,rhs);ctx.setLineDash([]);
        [[rxs,rys],[rxs+rws,rys],[rxs,rys+rhs],[rxs+rws,rys+rhs]].forEach(([hx,hy])=>{ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,6,0,Math.PI*2);ctx.fill();ctx.stroke();});
        ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(formatLabel(),rxs+rws/2,rys+rhs/2);
      }
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,H-28,W,28);
      ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('Drag to frame export area ('+formatLabel()+')   ·   Esc to cancel',W/2,H-14);
      ctx.restore();
    }
  }

  // ─── DRAW: ORCHESTRATOR ───────────────────────────────────────────────────
  function draw(){
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const st=S.current;
    const{players:pl,arrows:arr,phases:ph,phaseColor,balls,colorA:cA,colorB:cB,
      view:v,pR:r,selectedArrowIdx:selA,selectedBallIdx:selB,selectedPhaseMarker:selPM,arrowHeadSize}=st;
    const{scale,ox,oy}=vp.current;
    const hs=AHEAD[arrowHeadSize]!==undefined?AHEAD[arrowHeadSize]:7;

    ctx.clearRect(0,0,W,H);
    ctx.setTransform(scale,0,0,scale,ox,oy);
    drawPitch(ctx,v);
    if(st.showGrid)drawGrid(ctx);
    drawCropLayer(ctx,st.cropRegion,scale);
    drawArrows(ctx,arr,selA,hs);
    // Defensive transform reset — arrow helpers can shift the matrix
    ctx.setTransform(scale,0,0,scale,ox,oy);
    drawPhaseMarkers(ctx,ph,phaseColor,selPM,st);
    drawPlayers(ctx,pl,v,r,cA,cB,st);
    drawBalls(ctx,balls,selB,v,r);
    drawSymbols(ctx,st.symbols,st.selectedSymbolIdx);
    // Draw multi-select outlines
    (st.multiSelection||[]).forEach(function(item){
      ctx.save();ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=2;ctx.setLineDash([5,3]);
      if(item.type==='arrow'&&st.arrows[item.idx]){
        const a=st.arrows[item.idx];
        const mp=a.path[Math.floor(a.path.length/2)]||a.path[0];
        ctx.beginPath();ctx.arc(mp.x,mp.y,12,0,Math.PI*2);ctx.stroke();
      } else if(item.type==='ball'&&st.balls[item.idx]){
        const bl=st.balls[item.idx];ctx.beginPath();ctx.arc(bl.x,bl.y,st.pR+6,0,Math.PI*2);ctx.stroke();
      } else if(item.type==='symbol'){
        const sym=(st.symbols||[])[item.idx];
        if(sym){const r=SSIZES[sym.size||'m']||SSIZES.m;ctx.beginPath();ctx.arc(sym.x,sym.y,r+7,0,Math.PI*2);ctx.stroke();}
      } else if(item.type==='marker'){
        const ph=st.phases[item.phaseIdx];
        if(ph&&ph.markers&&ph.markers[item.markerIdx]){
          const m=ph.markers[item.markerIdx];const half=markerHalf(st,5);
          ctx.strokeRect(m.x-half,m.y-half,half*2,half*2);
        }
      }
      ctx.setLineDash([]);ctx.restore();
    });
    drawLegends(ctx,st,cA,cB,ph,phaseColor);
    ctx.setTransform(1,0,0,1,0,0);
    drawScreenOverlays(ctx,scale,ox,oy);
  }

  useEffect(()=>{draw();},[tick]);
  useEffect(()=>{if(fbAuthReady&&fbUser)draw();},[fbAuthReady]);

  // ─── WHEEL: pinch/ctrl+scroll zooms, two-finger scroll pans ──────────────
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const fn=function(e){
      e.preventDefault();
      e.stopPropagation();
      const rect=canvas.getBoundingClientRect();
      const mult=e.deltaMode===1?20:e.deltaMode===2?300:1;
      if(e.ctrlKey){
        // Pinch-to-zoom (macOS trackpad sends ctrlKey:true)
        zoomStep(e.deltaY<0?1.08:1/1.08,(e.clientX-rect.left)*W/rect.width,(e.clientY-rect.top)*H/rect.height);
      } else if(e.deltaY!==0&&e.deltaX===0){
        // Two-finger vertical scroll → zoom at cursor position
        zoomStep(e.deltaY<0?1.08:1/1.08,(e.clientX-rect.left)*W/rect.width,(e.clientY-rect.top)*H/rect.height);
      } else if(e.deltaX!==0){
        // Two-finger horizontal scroll → pan (only meaningful when zoomed in)
        const sc=vp.current.scale;
        const dx=(e.deltaX*mult)/sc;
        const c=clampVP(sc,vp.current.ox-dx,vp.current.oy);
        vp.current.ox=c.ox;draw();
      }
    };
    // Block all wheel events at document level when over canvas (fixes standalone PWA scroll interception)
    const docBlock=function(e){
      if(e.target===canvas||canvas.contains(e.target)){e.preventDefault();}
    };
    canvas.addEventListener('wheel',fn,{passive:false,capture:true});
    document.addEventListener('wheel',docBlock,{passive:false,capture:true});
    return function(){
      canvas.removeEventListener('wheel',fn,{capture:true});
      document.removeEventListener('wheel',docBlock,{capture:true});
    };
  },[fbAuthReady]);

  // ─── ESCAPE KEY ───────────────────────────────────────────────────────────
  useEffect(()=>{
    const fn=e=>{
      if(e.key==='Escape'&&S.current.mode==='crop'){
        cropDrag.current={active:false,start:null,current:null,constrained:null};
        S.current.mode='move';redraw();
      }
    };
    window.addEventListener('keydown',fn);
    return()=>window.removeEventListener('keydown',fn);
  },[fbAuthReady]);

  // ─── SPACEBAR PAN ─────────────────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const onKD=e=>{
      if(e.code==='Space'&&!e.repeat&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){
        e.preventDefault();spaceDown.current=true;canvas.style.cursor='grab';
      }
    };
    const onKU=e=>{
      if(e.code==='Space'){
        spaceDown.current=false;
        if(vp.current.panning&&vp.current.panStart&&vp.current.panStart.fromSpace){
          vp.current.panning=false;vp.current.panStart=null;
        }
        canvas.style.cursor='';
      }
    };
    window.addEventListener('keydown',onKD);
    window.addEventListener('keyup',onKU);
    return()=>{window.removeEventListener('keydown',onKD);window.removeEventListener('keyup',onKU);};
  },[fbAuthReady]);

  // Shared 8-direction resize handler for legend boxes
  // Mutates legend ref (st.legend or st.stepLegend) in-place
  function applyBoxResize(leg,d){
    const dx=drag.current.current_x!==undefined?drag.current.current_x-d.downPos.x:0;
    const dy=drag.current.current_y!==undefined?drag.current.current_y-d.downPos.y:0;
    const ob=d.origBox,h2=d.handle,MIN=60;
    let nx=ob.x,ny=ob.y,nw=ob.w,nh=ob.h;
    if(h2==='nw'||h2==='w'||h2==='sw'){nw=Math.max(MIN,ob.w-dx);nx=ob.x+ob.w-nw;}
    if(h2==='ne'||h2==='e'||h2==='se'){nw=Math.max(MIN,ob.w+dx);}
    if(h2==='nw'||h2==='n'||h2==='ne'){nh=Math.max(MIN,ob.h-dy);ny=ob.y+ob.h-nh;}
    if(h2==='sw'||h2==='s'||h2==='se'){nh=Math.max(MIN,ob.h+dy);}
    leg.x=nx;leg.y=ny;leg.w=nw;leg.h=nh;
  }

  // ─── MOUSE HANDLERS ───────────────────────────────────────────────────────
  function onDown(e){
    e.preventDefault();
    if(e.button===1||spaceDown.current){
      const rect=canvasRef.current.getBoundingClientRect();
      vp.current.panning=true;
      vp.current.panStart={cx:(e.clientX-rect.left)*W/rect.width,cy:(e.clientY-rect.top)*H/rect.height,ox:vp.current.ox,oy:vp.current.oy,fromSpace:spaceDown.current};
      if(spaceDown.current)canvasRef.current.style.cursor='grabbing';
      return;
    }
    const pos=gp(e),st=S.current;

    if(st.mode==='crop'){
      cropDrag.current={active:true,start:{...pos},current:{...pos},constrained:null};
      draw();return;
    }

    if(st.mode==='move'){
      const ch=hitCrop(pos);
      if(ch==='delete'){st.cropRegion=null;st.cropSelected=false;redraw();return;}
      if(ch){
        st.cropSelected=true;
        drag.current={active:true,type:'crop',cropHandle:ch,origCrop:{...st.cropRegion},downPos:{...pos}};
        draw();return;
      }
      if(st.cropSelected){st.cropSelected=false;draw();}
      // Shift+click: multi-select (move mode only)
      if(e.shiftKey){
        const toggleItem=function(item){
          const ms=st.multiSelection||[];
          const key=JSON.stringify(item);
          const exists=ms.some(function(m){return JSON.stringify(m)===key;});
          st.multiSelection=exists?ms.filter(function(m){return JSON.stringify(m)!==key;}):[...ms,item];
          st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;st.selectedSymbolIdx=null;
          redraw();
        };
        const shSym=hitSymbol(pos);if(shSym>=0){toggleItem({type:'symbol',idx:shSym});return;}
        const shPm=hitPhaseMarker(pos);if(shPm){toggleItem({type:'marker',phaseIdx:shPm.phaseIdx,markerIdx:shPm.markerIdx});return;}
        const shBi=hitBall(pos);if(shBi>=0){toggleItem({type:'ball',idx:shBi});return;}
        const shAi=hitArrow(pos);if(shAi>=0){toggleItem({type:'arrow',idx:shAi});return;}
        st.multiSelection=[];redraw();return;
      }
      // Normal click — clear multi-selection
      st.multiSelection=[];
      const symIdx=hitSymbol(pos);
      if(symIdx>=0&&st.mode==='move'){
        st.selectedSymbolIdx=symIdx;st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;
        drag.current={active:true,type:'symbol',symbolIdx:symIdx};redraw();return;
      }
      const handle=hitArrowHandle(pos);
      if(handle){
        const a=st.arrows[st.selectedArrowIdx];
        drag.current={active:true,type:'arrowHandle',arrowIdx:st.selectedArrowIdx,arrowHandle:handle,
          dOff:{x:0,y:0},origPath:JSON.parse(JSON.stringify(a.path)),origCp:a.cp?{...a.cp}:null,downPos:{...pos}};
        draw();return;
      }
      const legH=hitLegendResize(pos);
      if(legH){const b=getLegendBox('legend');drag.current={active:true,type:'legendResize',handle:legH,downPos:{...pos},origBox:{...b},origLeg:{x:st.legend.x,y:st.legend.y,w:b.w,h:b.h}};draw();return;}
      if(hitLegend(pos)){drag.current={active:true,type:'legend',dOff:{x:pos.x-st.legend.x,y:pos.y-st.legend.y}};draw();return;}
      const slH=hitStepLegendResize(pos);
      if(slH){const b=getLegendBox('stepLegend');drag.current={active:true,type:'stepLegendResize',handle:slH,downPos:{...pos},origBox:{...b},origLeg:{x:st.stepLegend.x,y:st.stepLegend.y,w:b.w,h:b.h}};draw();return;}
      if(hitStepLegend(pos)){drag.current={active:true,type:'stepLegend',dOff:{x:pos.x-st.stepLegend.x,y:pos.y-st.stepLegend.y}};draw();return;}
      const pm=hitPhaseMarker(pos);
      if(pm){st.selectedPhaseMarker=pm;drag.current={active:true,type:'phaseMarker',phaseIdx:pm.phaseIdx,markerIdx:pm.markerIdx};st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedSymbolIdx=null;redraw();return;}
      const si=hitSymbol(pos);
      if(si>=0){st.selectedSymbolIdx=si;st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;drag.current={active:true,type:'symbol',symbolIdx:si};redraw();return;}
      const ghost=hitGhost(pos);
      if(ghost){drag.current={active:true,type:'ghost',ghostId:ghost.id};st.selectedGhostId=ghost.id;st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;st.selectedSymbolIdx=null;redraw();return;}
      const bi=hitBall(pos);
      if(bi>=0){drag.current={active:true,type:'ball',ballIdx:bi};st.selectedBallIdx=bi;st.selectedArrowIdx=null;st.selectedPhaseMarker=null;redraw();return;}
      const player=hitPlayer(pos);
      if(player){drag.current={active:true,type:'player',playerId:player.id};st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;draw();return;}
      const ai=hitArrow(pos);
      if(ai>=0){
        st.selectedArrowIdx=ai;st.selectedBallIdx=null;st.selectedPhaseMarker=null;
        drag.current={active:true,type:'arrowBody',arrowIdx:ai,origPath:JSON.parse(JSON.stringify(st.arrows[ai].path)),origCp:st.arrows[ai].cp?{...st.arrows[ai].cp}:null,downPos:{...pos}};
        redraw();return;
      }
      st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;st.selectedSymbolIdx=null;redraw();
    }

    if(st.mode==='arrow'){
      if(!ar.current.drawing){
        ar.current.drawing=true;ar.current.aStart={...pos};ar.current.cPath=[{...pos}];
        ar.current.startAnchor=nearAnchor(pos,null);
      }else if(st.arrowShape==='curve'){
        if(ar.current.cpPhase===0){ar.current.cpCtrl={...pos};ar.current.cpPhase=1;}
        else{
          const s=ar.current.aStart,c=ar.current.cpCtrl,endAnchor=nearAnchor(pos,null);
          st.arrows=[...st.arrows,{path:[s,pos],shape:'curve',cp:{...c},style:st.arrowStyle,color:st.arrowColor,headSize:st.arrowHeadSize,startAnchor:ar.current.startAnchor||null,endAnchor}];
          ar.current={drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null};
        }
      }
      draw();return;
    }

    if(st.mode==='ball'){st.balls=[...st.balls,{x:pos.x,y:pos.y,ghost:false}];st.selectedBallIdx=st.balls.length-1;draw();return;}

    if(st.mode==='symbol'){
      const newSym={x:pos.x,y:pos.y,type:st.symbolType||'goal',size:st.symbolSize||'m',color:st.symbolColor||'#F5F5F5'};
      st.symbols=[...(st.symbols||[]),newSym];
      st.selectedSymbolIdx=(st.symbols.length-1);
      drag.current={active:true,type:'symbol',symbolIdx:st.selectedSymbolIdx};
      redraw();return;
    }

    if(st.mode==='symbol'){
      const sym={x:pos.x,y:pos.y,type:st.symbolType||'goal',size:st.symbolSize||'m',color:st.symbolColor||'#F5F5F5'};
      st.symbols=[...(st.symbols||[]),sym];
      st.selectedSymbolIdx=(st.symbols.length-1);
      redraw();return;
    }
    if(st.mode==='phase'){
      const ph2=st.phases[st.activePh];if(!ph2)return;
      ph2.markers=[...(ph2.markers||[]),{x:pos.x,y:pos.y}];
      redraw();return;
    }
  }

  function onMove(e){
    e.preventDefault();
    if(vp.current.panning&&vp.current.panStart){
      const rect=canvasRef.current.getBoundingClientRect();
      const cpx=(e.clientX-rect.left)*W/rect.width,cpy=(e.clientY-rect.top)*H/rect.height;
      const ps=vp.current.panStart,c=clampVP(vp.current.scale,ps.ox+(cpx-ps.cx),ps.oy+(cpy-ps.cy));
      vp.current.ox=c.ox;vp.current.oy=c.oy;draw();return;
    }
    const pos=gp(e),st=S.current,d=drag.current;

    if(st.mode==='crop'&&cropDrag.current.active){
      cropDrag.current.current={...pos};cropDrag.current.constrained=constrainCrop(cropDrag.current.start,pos);
      draw();return;
    }

    if(st.mode==='move'&&!d.active){
      const ch=hitCrop(pos);
      setCursorStyle(
        ch==='delete'?'pointer':ch==='move'?'move':
        ch==='nw'||ch==='se'?'nw-resize':ch==='ne'||ch==='sw'?'ne-resize':
        ch==='n'||ch==='s'?'ns-resize':ch==='e'||ch==='w'?'ew-resize':'default'
      );
    }

    if(st.mode==='arrow'&&ar.current.drawing){
      if(st.arrowShape==='free'){const last=ar.current.cPath[ar.current.cPath.length-1];if(Math.hypot(pos.x-last.x,pos.y-last.y)>4)ar.current.cPath.push({...pos});}
      else if(st.arrowShape==='elbow'){const corner={x:pos.x,y:ar.current.aStart?ar.current.aStart.y:pos.y};ar.current.cPath=[ar.current.aStart||pos,corner,{...pos}];}
      else{ar.current.cPath=[ar.current.aStart||pos,{...pos}];}
      draw();return;
    }

    if(st.mode==='move'&&d.active){
      d.current_x=pos.x;d.current_y=pos.y;
      if(d.type==='crop'){
        const oc=d.origCrop,dx=pos.x-d.downPos.x,dy=pos.y-d.downPos.y,h2=d.cropHandle,cr=st.cropRegion,ar2=pageAspect();
        if(h2==='move'){cr.x=oc.x+dx;cr.y=oc.y+dy;}
        else{
          let nx=oc.x,ny=oc.y,nw=oc.w,nh=oc.h;
          const isCorner=h2==='nw'||h2==='ne'||h2==='sw'||h2==='se';
          if(isCorner){
            const useW=Math.abs(dx)>=Math.abs(dy)*ar2;
            if(useW){if(h2==='nw'||h2==='sw'){nw=oc.w-dx;nx=oc.x+dx;}else{nw=oc.w+dx;}nh=nw/ar2;if(h2==='nw'||h2==='ne'){ny=oc.y+(oc.h-nh);}}
            else{if(h2==='nw'||h2==='ne'){nh=oc.h-dy;ny=oc.y+dy;}else{nh=oc.h+dy;}nw=nh*ar2;if(h2==='nw'||h2==='sw'){nx=oc.x+(oc.w-nw);}}
          }else if(h2==='n'||h2==='s'){
            if(h2==='n'){nh=oc.h-dy;ny=oc.y+dy;}else{nh=oc.h+dy;}nw=nh*ar2;nx=oc.x-(nw-oc.w)/2;
          }else{
            if(h2==='w'){nw=oc.w-dx;nx=oc.x+dx;}else{nw=oc.w+dx;}nh=nw/ar2;ny=oc.y-(nh-oc.h)/2;
          }
          if(nw>10&&nh>10){cr.x=nx;cr.y=ny;cr.w=nw;cr.h=nh;}
        }
      }else if(d.type==='arrowHandle'){
        const a2=st.arrows[d.arrowIdx];
        if(d.arrowHandle==='start')a2.path[0]={...pos};
        else if(d.arrowHandle==='end')a2.path[a2.path.length-1]={...pos};
        else if(d.arrowHandle==='cp'&&a2.cp)a2.cp={...pos};
      }else if(d.type==='arrowBody'){
        const a2=st.arrows[d.arrowIdx],dx=pos.x-d.downPos.x,dy=pos.y-d.downPos.y;
        a2.path=d.origPath.map(pt=>({x:pt.x+dx,y:pt.y+dy}));
        if(d.origCp)a2.cp={x:d.origCp.x+dx,y:d.origCp.y+dy};
      }else if(d.type==='legendResize'){
        applyBoxResize(st.legend,d);
      }else if(d.type==='legend'){st.legend.x=pos.x-d.dOff.x;st.legend.y=pos.y-d.dOff.y;}
      else if(d.type==='stepLegendResize'){
        applyBoxResize(st.stepLegend,d);
      }else if(d.type==='stepLegend'){st.stepLegend.x=pos.x-d.dOff.x;st.stepLegend.y=pos.y-d.dOff.y;}
      else if(d.type==='player'){const p=st.players.find(p=>p.id===d.playerId);if(p){p.x=pos.x;p.y=pos.y;}}
      else if(d.type==='ghost'){const p=st.players.find(p=>p.id===d.ghostId);if(p){p.x=pos.x;p.y=pos.y;}}
      else if(d.type==='ball'){const bl=st.balls[d.ballIdx];if(bl){bl.x=pos.x;bl.y=pos.y;}}
      else if(d.type==='symbol'){const sym=(st.symbols||[])[d.symbolIdx];if(sym){sym.x=pos.x;sym.y=pos.y;}}
      else if(d.type==='symbol'){const sym=(st.symbols||[])[d.symbolIdx];if(sym){sym.x=pos.x;sym.y=pos.y;}}
      else if(d.type==='phaseMarker'){
        const markers=st.phases[d.phaseIdx].markers;
        if(markers&&markers[d.markerIdx]){markers[d.markerIdx].x=pos.x;markers[d.markerIdx].y=pos.y;}
      }
      draw();
    }
  }

  function onUp(e){
    vp.current.panning=false;
    vp.current.panStart=null;
    if(spaceDown.current){canvasRef.current.style.cursor='grab';}
    const d=drag.current,a=ar.current,st=S.current;
    if(st.mode==='crop'&&cropDrag.current.active){
      const con=cropDrag.current.constrained;
      if(con&&con.w>10&&con.h>10){
        st.cropRegion={x:Math.round(con.x*10)/10,y:Math.round(con.y*10)/10,w:Math.round(con.w*10)/10,h:Math.round(con.h*10)/10};
        st.cropSelected=true;
      }
      cropDrag.current={active:false,start:null,current:null,constrained:null};
      st.mode='move';redraw();return;
    }
    if(st.mode==='arrow'&&a.drawing&&st.arrowShape!=='curve'){
      const pos=gp(e),endAnchor=nearAnchor(pos,null);
      if(st.arrowShape==='free'&&a.cPath.length>1){
        const out=[a.cPath[0]],step=Math.max(1,Math.floor(a.cPath.length/24));
        for(let i=step;i<a.cPath.length-1;i+=step)out.push(a.cPath[i]);
        out.push(a.cPath[a.cPath.length-1]);
        st.arrows=[...st.arrows,{path:out,shape:'free',style:st.arrowStyle,color:st.arrowColor,headSize:st.arrowHeadSize,startAnchor:a.startAnchor||null,endAnchor}];
      }else if(st.arrowShape==='straight'&&a.aStart){
        st.arrows=[...st.arrows,{path:[a.aStart,{...pos}],shape:'straight',style:st.arrowStyle,color:st.arrowColor,headSize:st.arrowHeadSize,startAnchor:a.startAnchor||null,endAnchor}];
      }else if(st.arrowShape==='elbow'&&a.aStart){
        const corner={x:pos.x,y:a.aStart.y};
        st.arrows=[...st.arrows,{path:[a.aStart,{...pos}],shape:'elbow',cp:{...corner},style:st.arrowStyle,color:st.arrowColor,headSize:st.arrowHeadSize,startAnchor:a.startAnchor||null,endAnchor}];
      }
      a.drawing=false;a.cPath=[];a.aStart=null;a.startAnchor=null;a.cpPhase=0;
    }
    d.active=false;redraw();
  }

  function onLeave(){vp.current.panning=false;vp.current.panStart=null;if(!spaceDown.current)setCursorStyle('default');}

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  function setMode(m){
    S.current.mode=m;S.current.cropSelected=false;
    ar.current={drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null};
    S.current.selectedArrowIdx=null;S.current.selectedBallIdx=null;S.current.selectedPhaseMarker=null;
    if(m!=='crop')cropDrag.current={active:false,start:null,current:null,constrained:null};
    redraw();
  }
  function clearCrop(){S.current.cropRegion=null;S.current.cropSelected=false;redraw();}
  function setView(v){S.current.view=v;redraw();}
  function setPR(r){S.current.pR=r;redraw();}
  function setAS(s){S.current.arrowStyle=s;redraw();}
  function setSH(s){S.current.arrowShape=s;ar.current={drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null};redraw();}
  function setSymbolProp(key,val){const st=S.current;if(st.selectedSymbolIdx===null)return;const sym=(st.symbols||[])[st.selectedSymbolIdx];if(sym){sym[key]=val;redraw();}}

  // ─── UNIFIED DELETE ────────────────────────────────────────────────────────
  // Build item list from current single selection
  function selectionItems(){
    const st=S.current;
    // Multi-select takes priority
    if(st.multiSelection&&st.multiSelection.length>0)return st.multiSelection.slice();
    const items=[];
    if(st.selectedArrowIdx!==null)items.push({type:'arrow',idx:st.selectedArrowIdx});
    if(st.selectedBallIdx!==null)items.push({type:'ball',idx:st.selectedBallIdx});
    if(st.selectedPhaseMarker)items.push({type:'marker',phaseIdx:st.selectedPhaseMarker.phaseIdx,markerIdx:st.selectedPhaseMarker.markerIdx});
    if(st.selectedSymbolIdx!==null)items.push({type:'symbol',idx:st.selectedSymbolIdx});
    if(st.selectedGhostId)items.push({type:'ghost',ghostId:st.selectedGhostId});
    return items;
  }

  function itemLabel(items){
    if(items.length===1){
      const t=items[0].type;
      return t==='arrow'?'arrow':t==='ball'?'ball':t==='marker'?'move marker':t==='symbol'?'symbol':t==='phase'?'move':'item';
    }
    return items.length+' objects';
  }

  // Execute the actual deletion — called after confirmation
  function executeDelete(items){
    const st=S.current;
    // Sort indices descending so splice/filter stays stable
    const arrows=items.filter(i=>i.type==='arrow').map(i=>i.idx).sort((a,b)=>b-a);
    const balls=items.filter(i=>i.type==='ball').map(i=>i.idx).sort((a,b)=>b-a);
    const symbols=items.filter(i=>i.type==='symbol').map(i=>i.idx).sort((a,b)=>b-a);
    const markers=items.filter(i=>i.type==='marker');
    const phases=items.filter(i=>i.type==='phase').map(i=>i.idx).sort((a,b)=>b-a);
    const arrowIdxSet=new Set(arrows);
    const ballIdxSet=new Set(balls);
    const symIdxSet=new Set(symbols);
    if(arrowIdxSet.size)st.arrows=st.arrows.filter((_,i)=>!arrowIdxSet.has(i));
    if(ballIdxSet.size)st.balls=st.balls.filter((_,i)=>!ballIdxSet.has(i));
    if(symIdxSet.size)st.symbols=(st.symbols||[]).filter((_,i)=>!symIdxSet.has(i));
    // Markers — group by phase, delete by index descending
    if(markers.length){
      const byPhase={};
      markers.forEach(m=>{if(!byPhase[m.phaseIdx])byPhase[m.phaseIdx]=[];byPhase[m.phaseIdx].push(m.markerIdx);});
      Object.entries(byPhase).forEach(([pi,idxs])=>{
        const sorted=idxs.slice().sort((a,b)=>b-a);
        sorted.forEach(mi=>{if(st.phases[pi]&&st.phases[pi].markers)st.phases[pi].markers.splice(mi,1);});
      });
    }
    if(phases.length){
      phases.forEach(i=>{st.phases=st.phases.filter((_,j)=>j!==i);});
      st.activePh=Math.min(st.activePh,st.phases.length-1);
    }
    // Handle ghost players
    items.forEach(item=>{
      if(item.type==='ghost')st.players=st.players.filter(p=>p.id!==item.ghostId);
    });
    // Handle bulk types
    items.forEach(item=>{
      if(item.type==='allArrows')st.arrows=[];
      if(item.type==='allSymbols')st.symbols=[];
      if(item.type==='allBalls')st.balls=st.balls.filter(bl=>!bl.ghost); // keep first ball
    });
    // Clear selection
    st.selectedArrowIdx=null;st.selectedBallIdx=null;st.selectedPhaseMarker=null;st.selectedSymbolIdx=null;st.selectedGhostId=null;
    st.multiSelection=[];
    // Handle reset
    items.forEach(item=>{
      if(item.type==='reset'){
        S.current={
          players:mkPlayers(),arrows:[],phases:[],phaseColor:'#E24B4A',
          balls:[{x:W/2,y:H/2,ghost:false}],
          colorA:'#E24B4A',colorB:'#378ADD',edgeColorA:'#ffffff',edgeColorB:'#ffffff',
          teamNameA:'',teamNameB:'',
          arrowColor:'#F5F5F5',arrowStyle:'solid',arrowShape:'straight',arrowHeadSize:'m',
          view:'full',pR:14,markerSize:'m',activePh:0,labelContrast:'outline',
          legend:{x:10,y:10,scale:1,w:null,h:null,textColor:'#222',cols:2},
          stepLegend:{x:10,y:60,scale:1,w:null,h:null,textColor:'#333'},
          symbols:[],symbolColor:'#F5F5F5',symbolSize:'m',symbolType:'goal',
          selectedArrowIdx:null,selectedBallIdx:null,selectedPhaseMarker:null,selectedSymbolIdx:null,
          multiSelection:[],
          mode:'move',cropRegion:null,cropSelected:false,exportFormat:'a4',exportOrientation:'landscape',
          moment:{heading:'',what:'',event:'',at:'',when:'',who:''},
        };
        ar.current={drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null};
        drag.current={active:false,type:null};
      }
    });
    pendingDelete.current=null;
    redraw();
  }

  // Request deletion — shows confirmation bar
  function requestDelete(items,label){
    if(!items||!items.length)return;
    pendingDelete.current={items,label:label||itemLabel(items)};
    redraw();
  }

  // Convenience wrappers — now go through confirmation
  // Single delete entry point -- replaces deleteSelectedArrow/Ball/Symbol/PhaseMarker/Items
  function deleteSelected(){const items=selectionItems();if(items.length)requestDelete(items,itemLabel(items));}
  function setMarkerEventType(type){const st=S.current;if(!st.selectedPhaseMarker)return;const{phaseIdx,markerIdx}=st.selectedPhaseMarker;if(st.phases[phaseIdx]&&st.phases[phaseIdx].markers[markerIdx])st.phases[phaseIdx].markers[markerIdx].eventType=type;redraw();}
  function toggleBallGhost(){const st=S.current;if(st.selectedBallIdx===null)return;const bl=st.balls[st.selectedBallIdx];if(bl)bl.ghost=!bl.ghost;redraw();}
  function undoArrow(){S.current.arrows=S.current.arrows.slice(0,-1);S.current.selectedArrowIdx=null;redraw();}
  function clearArrows(){requestDelete([{type:'allArrows'}],'all arrows');}
  function addPhase(){const i=S.current.phases.length;S.current.phases=[...S.current.phases,{label:i+1,note:'',markers:[]}];S.current.activePh=i;redraw();}
  function setActivePh(i){S.current.activePh=i;redraw();}
  function deletePhase(i){requestDelete([{type:'phase',idx:i}],'move '+(i+1));}
  function updatePhaseNote(i,note){S.current.phases[i].note=note;}
  function togglePlayerHidden(team,num){const p=S.current.players.find(p=>p.team===team&&p.num===num&&!p.ghost);if(p){p.hidden=!p.hidden;redraw();}}
  function updatePlayerName(team,num,name){const p=S.current.players.find(p=>p.team===team&&p.num===num&&!p.ghost);if(p){p.name=name;redraw();}}
  function updatePlayerNum(team,oldNum,newNum){
    const parsed=parseInt(newNum,10);if(isNaN(parsed)||parsed<1||parsed>99)return;
    const clash=S.current.players.find(p=>p.team===team&&p.num===parsed&&!p.ghost);if(clash)return;
    S.current.players.filter(p=>p.team===team&&p.num===oldNum).forEach(p=>p.num=parsed);redraw();
  }
  function addGhost(team,num){
    const src=S.current.players.find(p=>p.team===team&&p.num===num&&!p.ghost);if(!src)return;
    const id=`ghost_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    S.current.players=[...S.current.players,{...src,id,x:src.x+20,y:src.y+20,ghost:true}];redraw();
  }
  function removeGhost(ghostId){S.current.players=S.current.players.filter(p=>p.id!==ghostId);redraw();}
  function getGhosts(team,num){return S.current.players.filter(p=>p.ghost&&p.team===team&&p.num===num);}
  function toggleExpanded(id){setExpandedPlayers(prev=>({...prev,[id]:!prev[id]}));}

  function resetBoard(){
    S.current={
      players:mkPlayers(),arrows:[],phases:[],phaseColor:'#E24B4A',
      balls:[{x:W/2,y:H/2,ghost:false}],
      colorA:'#E24B4A',colorB:'#378ADD',edgeColorA:'#ffffff',edgeColorB:'#ffffff',
      teamNameA:'',teamNameB:'',
      arrowColor:'#F5F5F5',arrowStyle:'solid',arrowShape:'straight',arrowHeadSize:'m',
      view:'full',pR:14,markerSize:'m',activePh:0,labelContrast:'outline',
      legend:{x:10,y:10,scale:1,w:null,h:null,textColor:'#222',cols:2},stepLegend:{x:10,y:60,scale:1,w:null,h:null,textColor:'#333'},
      symbols:[],symbolColor:'#F5F5F5',symbolSize:'m',symbolType:'goal',
      selectedArrowIdx:null,selectedBallIdx:null,selectedPhaseMarker:null,selectedSymbolIdx:null,selectedGhostId:null,showGrid:false,showGrid:false,
      multiSelection:[],
      mode:'move',cropRegion:null,cropSelected:false,exportFormat:'a4',exportOrientation:'landscape',
      moment:{heading:'',what:'',event:'',at:'',when:'',who:''},
    };
    ar.current={drawing:false,aStart:null,cPath:[],cpCtrl:null,cpPhase:0,startAnchor:null};
    drag.current={active:false,type:null};
    cropDrag.current={active:false,start:null,current:null,constrained:null};
    redraw();
  }

  // ─── SAVE / LOAD ──────────────────────────────────────────────────────────
  function boardState(){
    const st=S.current;
    return{
      players:JSON.parse(JSON.stringify(st.players)),
      arrows:JSON.parse(JSON.stringify(st.arrows)),
      phases:JSON.parse(JSON.stringify(st.phases)),
      phaseColor:st.phaseColor,balls:JSON.parse(JSON.stringify(st.balls)),
      colorA:st.colorA,colorB:st.colorB,edgeColorA:st.edgeColorA,edgeColorB:st.edgeColorB,
      teamNameA:st.teamNameA,teamNameB:st.teamNameB,
      arrowColor:st.arrowColor,arrowHeadSize:st.arrowHeadSize,arrowShape:st.arrowShape,arrowStyle:st.arrowStyle,
      view:st.view,pR:st.pR,markerSize:st.markerSize,labelContrast:st.labelContrast,activePh:st.activePh,
      legend:st.legend,stepLegend:st.stepLegend,
      symbols:JSON.parse(JSON.stringify(st.symbols||[])),symbolColor:st.symbolColor,symbolSize:st.symbolSize,symbolType:st.symbolType,
      cropRegion:st.cropRegion,cropSelected:false,exportFormat:st.exportFormat,exportOrientation:st.exportOrientation,
      moment:st.moment||{heading:'',what:'',event:'',at:'',when:'',who:''},
    };
  }
  function applyBoardState(data){
    const fields=['players','arrows','phases','phaseColor','balls','colorA','colorB',
      'edgeColorA','edgeColorB','teamNameA','teamNameB','arrowColor','arrowHeadSize',
      'arrowShape','arrowStyle','view','pR','markerSize','labelContrast','activePh',
      'legend','stepLegend','cropRegion','cropSelected','exportFormat','exportOrientation','moment',
      'symbols','symbolColor','symbolSize','symbolType'];
    fields.forEach(function(f){if(data[f]!==undefined)S.current[f]=data[f];});
    S.current.selectedArrowIdx=null;S.current.selectedBallIdx=null;S.current.selectedPhaseMarker=null;S.current.selectedSymbolIdx=null;S.current.mode='move';
  }
  useEffect(()=>{
    try{const raw=localStorage.getItem('tb_slots');if(raw){/* legacy slots ignored */}}catch{}
  },[]);

  // ─── FIREBASE AUTH ────────────────────────────────────────────────────────
  useEffect(()=>{
    const unsub=_auth.onAuthStateChanged(function(user){
      if(user&&ALLOWED_EMAILS.indexOf(user.email)<0){
        _auth.signOut();
        setFbUser(null);
        setFbAuthReady(true);
        setSaveMsg('Access restricted to authorised users.');
        return;
      }
      setFbUser(user||null);
      setFbAuthReady(true);
      if(user){
        loadBoardList(user.uid);
        loadApiKeyFromFirestore(user.uid);
      }
      // Trigger canvas init after auth resolves (splash screen was shown before canvas existed)
      setTimeout(function(){redraw();},50);
    });
    return unsub;
  },[]);

  function signInWithGoogle(){
    _auth.signInWithPopup(_googleProvider).catch(function(err){
      setSaveMsg('Sign-in failed: '+err.message);
    });
  }
  function signOut(){
    _auth.signOut().then(function(){
      setBoards([]);
      setApiKeyState('');
      setSaveMsg('You have been signed out.');
      setTimeout(function(){setSaveMsg('');},3000);
    });
  }

  // ─── API KEY IN FIRESTORE ─────────────────────────────────────────────────
  function loadApiKeyFromFirestore(uid){
    _db.collection('users').doc(uid).get().then(function(doc){
      if(doc.exists&&doc.data().apiKey){
        setApiKeyState(doc.data().apiKey);
      }
    }).catch(function(){});
  }

  function saveApiKey(val){
    setApiKeyState(val);
    if(fbUser){
      _db.collection('users').doc(fbUser.uid).set({apiKey:val},{merge:true}).catch(function(){});
    }
  }

  // ─── FIRESTORE BOARD LIBRARY ──────────────────────────────────────────────
  function boardsRef(uid){
    return _db.collection('users').doc(uid).collection('boards');
  }

  function loadBoardList(uid){
    boardsRef(uid).orderBy('updatedAt','desc').get().then(function(snap){
      const list=[];
      snap.forEach(function(doc){
        const d=doc.data();
        list.push({id:doc.id,name:d.name||'Untitled',updatedAt:d.updatedAt,thumbnail:d.thumbnail||null});
      });
      setBoards(list);
    }).catch(function(err){setSaveMsg('Could not load boards: '+err.message);});
  }

  function makeThumbnail(){
    try{
      const oc=document.createElement('canvas');
      oc.width=240;oc.height=155;
      const ctx2=oc.getContext('2d');
      const st2=S.current;
      const scX=240/W,scY=155/H;
      ctx2.setTransform(scX,0,0,scY,0,0);
      drawPitch(ctx2,st2.view);
      drawArrows(ctx2,st2.arrows,null,AHEAD[st2.arrowHeadSize]!==undefined?AHEAD[st2.arrowHeadSize]:7);
      drawPlayers(ctx2,st2.players,st2.view,st2.pR,st2.colorA,st2.colorB,st2);
      drawBalls(ctx2,st2.balls,null,st2.view,st2.pR);
      return oc.toDataURL('image/jpeg',0.6);
    }catch(e){return null;}
  }

  function saveNewBoard(){
    if(!fbUser){setSaveMsg('Not signed in.');return;}
    const name=(newBoardName&&newBoardName.trim())||('Board '+new Date().toLocaleDateString('sv-SE'));
    setLibSaving(true);
    const thumb=makeThumbnail();
    const state=boardState();
    boardsRef(fbUser.uid).add({
      name:name,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
      thumbnail:thumb,
      state:state
    }).then(function(docRef){
      savedBoardStateRef.current=JSON.stringify(state);
      setCurrentBoardId(docRef.id);
      setNewBoardName('');
      setLibMsg('Saved: '+name);
      setTimeout(function(){setLibMsg('');},3000);
      loadBoardList(fbUser.uid);
    }).catch(function(err){setLibMsg('Save failed: '+err.message);})
    .finally(function(){setLibSaving(false);});
  }

  function updateBoard(boardId){
    if(!fbUser)return;
    setLibSaving(true);
    const thumb=makeThumbnail();
    const state=boardState();
    boardsRef(fbUser.uid).doc(boardId).update({
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
      thumbnail:thumb,
      state:state
    }).then(function(){
      savedBoardStateRef.current=JSON.stringify(state);
      setLibMsg('Updated.');
      setTimeout(function(){setLibMsg('');},2000);
      loadBoardList(fbUser.uid);
    }).catch(function(err){setLibMsg('Update failed: '+err.message);})
    .finally(function(){setLibSaving(false);});
  }

  function isBoardDirty(){
    if(!savedBoardStateRef.current)return false;
    try{return JSON.stringify(boardState())!==savedBoardStateRef.current;}catch{return false;}
  }

  function loadBoard(boardId){
    if(!fbUser)return;
    // Dirty-check: if active board has unsaved changes, ask user
    if(currentBoardId&&currentBoardId!==boardId&&isBoardDirty()){
      if(!window.confirm('You have unsaved changes. Discard and load the new board?'))return;
    }
    boardsRef(fbUser.uid).doc(boardId).get().then(function(doc){
      if(doc.exists&&doc.data().state){
        const state=doc.data().state;
        applyBoardState(state);
        savedBoardStateRef.current=JSON.stringify(state);
        setCurrentBoardId(boardId);
        redraw();
        setLibMsg('Loaded.');
        setTimeout(function(){setLibMsg('');},2000);
      }
    }).catch(function(err){setLibMsg('Load failed: '+err.message);});
  }

  function deleteBoard(boardId){
    if(!fbUser)return;
    if(!window.confirm('Delete this board? This cannot be undone.'))return;
    boardsRef(fbUser.uid).doc(boardId).delete().then(function(){
      loadBoardList(fbUser.uid);
    }).catch(function(err){setLibMsg('Delete failed: '+err.message);});
  }

  function exportBoardFromLib(boardId){
    if(!fbUser)return;
    boardsRef(fbUser.uid).doc(boardId).get().then(function(doc){
      if(doc.exists&&doc.data().state){
        const blob=new Blob([JSON.stringify(doc.data().state,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a2=document.createElement('a');
        a2.href=url;a2.download=(doc.data().name||'board').replace(/[^a-z0-9]/gi,'_')+'.json';
        a2.click();URL.revokeObjectURL(url);
      }
    });
  }

  // ─── AI / API ─────────────────────────────────────────────────────────────
  function isInsideClaude(){try{return window.location.hostname.includes('claude.ai')||(window.self!==window.top);}catch{return true;}}
  function getHeaders(){
    const h={'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    if(!isInsideClaude()&&apiKey)h['x-api-key']=apiKey;
    return h;
  }
  function canCall(){return isInsideClaude()||!!apiKey;}

  function buildDiffSummary(data,st){
    const parts=[];
    if(data.colorA&&data.colorA!==st.colorA)parts.push('Team A colour');
    if(data.colorB&&data.colorB!==st.colorB)parts.push('Team B colour');
    if(data.teamNameA&&data.teamNameA!==st.teamNameA)parts.push('Team A name');
    if(data.teamNameB&&data.teamNameB!==st.teamNameB)parts.push('Team B name');
    if(data.players&&data.players.length){
      const moved=data.players.filter(function(dp){
        if(dp.ghost)return false;
        const p=st.players.find(function(p){return p.team===dp.team&&p.num===dp.num&&!p.ghost;});
        return p&&(Math.abs((dp.x||0)-p.x)>5||Math.abs((dp.y||0)-p.y)>5);
      }).length;
      const ghosts=data.players.filter(function(dp){return dp.ghost;}).length;
      if(moved)parts.push(moved+' player'+(moved>1?'s':'')+' repositioned');
      if(ghosts)parts.push(ghosts+' ghost'+(ghosts>1?'s':'')+' added');
    }
    if(data.balls&&data.balls.length)parts.push(data.balls.length+' ball'+(data.balls.length>1?'s':''));
    if(data.arrows&&data.arrows.length)parts.push(data.arrows.length+' arrow'+(data.arrows.length>1?'s':''));
    if(data.phases&&data.phases.length)parts.push(data.phases.length+' step'+(data.phases.length>1?'s':''));
    return parts.length?parts.join(', '):'no changes detected';
  }

  function applyBoardJSON(raw){
    const data=JSON.parse(raw),st=S.current;
    if(data.teamNameA!==undefined)st.teamNameA=data.teamNameA;
    if(data.teamNameB!==undefined)st.teamNameB=data.teamNameB;
    if(data.colorA!==undefined)st.colorA=data.colorA;
    if(data.colorB!==undefined)st.colorB=data.colorB;
    if(data.players&&Array.isArray(data.players)){
      // Remove any AI-generated ghost players first
      st.players=st.players.filter(p=>!p.ghost||!p.aiGenerated);
      data.players.forEach(dp=>{
        if(dp.ghost){
          // Add a new ghost player
          const base=st.players.find(p=>p.team===dp.team&&p.num===dp.num&&!p.ghost);
          if(base){
            st.players.push({
              id:'ghost_ai_'+dp.team+dp.num+'_'+Date.now(),
              team:dp.team,num:dp.num,
              x:dp.x!==undefined?dp.x:base.x,
              y:dp.y!==undefined?dp.y:base.y,
              ghost:true,aiGenerated:true,
              name:dp.name||base.name||''
            });
          }
        } else {
          const p=st.players.find(p=>p.team===dp.team&&p.num===dp.num&&!p.ghost);
          if(p){
            if(dp.x!==undefined)p.x=dp.x;
            if(dp.y!==undefined)p.y=dp.y;
            if(dp.name!==undefined)p.name=dp.name;
            if(dp.hidden!==undefined)p.hidden=dp.hidden;
          }
        }
      });
    }
    if(data.balls&&Array.isArray(data.balls)){
      st.balls=data.balls.map(function(b){return {x:b.x,y:b.y,ghost:b.ghost||false,score:b.score||false};});
    }
    if(data.arrows&&Array.isArray(data.arrows)){
      st.arrows=data.arrows.map(function(a){
        return {
          path:a.path||[],shape:a.shape||'free',style:a.style||'solid',
          color:a.color||(st.colorA||'#E24B4A'),
          headSize:a.headSize!==undefined?a.headSize:st.arrowHeadSize||'m',
          startAnchor:null,endAnchor:null,cp:a.cp||null
        };
      });
    }
    if(data.phases&&Array.isArray(data.phases))st.phases=data.phases;
    if(data.phaseColor)st.phaseColor=data.phaseColor;
    if(data.activePh!==undefined)st.activePh=data.activePh;
  }

  async function parseAI(){
    if(!canCall()){setAiStatus('⚠ Add an API key below to use this feature.');return;}
    if(!aiText.trim()&&!imageData){setAiStatus('⚠ Add some text or an image first.');return;}
    setAiLoading(true);setAiStatus('');
    const cA=S.current.colorA||'#E24B4A',cB=S.current.colorB||'#378ADD';
    const systemPrompt=`You are a football tactics analyst. Output ONLY valid JSON (no markdown, no explanation, no backticks).

PITCH: ${W}x${H}px. Origin (0,0) = top-left. Team A attacks left→right. Team B attacks right→left.
KEY COORDINATES:
  Centre spot: (${Math.round(W/2)},${Math.round(H/2)})
  Left goal mouth: (0,${Math.round(H/2)})    Right goal mouth: (${W},${Math.round(H/2)})
  Left penalty spot: (${Math.round(W*0.122)},${Math.round(H/2)})    Right penalty spot: (${Math.round(W*0.878)},${Math.round(H/2)})
  Left penalty area: x=0–${Math.round(W*0.185)}, y=${Math.round(H*0.217)}–${Math.round(H*0.783)}
  Right penalty area: x=${Math.round(W*0.815)}–${W}, y=${Math.round(H*0.217)}–${Math.round(H*0.783)}
  Left 6-yard box: x=0–${Math.round(W*0.063)}, y=${Math.round(H*0.35)}–${Math.round(H*0.65)}
  Right 6-yard box: x=${Math.round(W*0.937)}–${W}, y=${Math.round(H*0.35)}–${Math.round(H*0.65)}
  Centre circle radius: ~${Math.round(H*0.152)}px

TEAM COLOURS (already set): colorA=${cA}, colorB=${cB}. Use these for arrows unless a different colour is clearly correct.

JSON SCHEMA — all fields optional, include only what you can determine:
{
  teamNameA: string,
  teamNameB: string,
  colorA: "#rrggbb",   // Team A kit colour — only set if you can identify it
  colorB: "#rrggbb",   // Team B kit colour — only set if you can identify it
  players: [
    {
      team: "A"|"B",
      num: 1–11,
      x: number,  // pitch x coordinate
      y: number,  // pitch y coordinate
      name: string,   // optional player name
      ghost: true,    // ONLY set ghost:true for a "previous position" shadow — shows where player WAS before movement
      hidden: true    // ONLY set hidden:true if player is off-pitch / not relevant
    }
  ],
  balls: [
    {
      x: number, y: number,
      ghost: true,    // previous ball position
      score: true     // ball involved in a goal/scoring moment — adds burst effect
    }
  ],
  arrows: [
    {
      path: [{x,y},{x,y},...],  // 2+ points. For straight: just start+end. For curves: intermediate points.
      shape: "straight"|"free"|"curve"|"elbow",
      style: "solid"|"dashed"|"wave",
      color: "#rrggbb",  // Use colorA for Team A movements, colorB for Team B movements, white (#F5F5F5) for ball movement
      headSize: "m"|"none"  // use "none" for positioning/zone arrows with no direction, "m" for movement arrows
    }
  ],
  phases: [
    {
      label: number,   // step number
      note: string,    // brief description of this movement phase
      markers: [{x,y}] // optional step marker positions on pitch
    }
  ],
  phaseColor: "#rrggbb",
  activePh: number   // index of the active phase (0-based)
}

GUIDELINES:
- Ghost players: if a player clearly moved during the moment, place the player at their NEW position and add a ghost entry at their OLD position.
- Score moments: set score:true on the ball if this is a goal or clear scoring chance.
- Arrows should follow actual movement direction. Use dashed style for potential/anticipated runs, solid for completed moves, wave for uncertain/speculative.
- For a 4-4-2: defenders y≈${Math.round(H*0.5)}, midfielders y≈${Math.round(H*0.5)}, spread across x. Adjust for actual formation.
- Typical GK position: x≈${Math.round(W*0.05)} (Team A) or x≈${Math.round(W*0.95)} (Team B).
${aiTimestamp?`Match time: ${aiTimestamp}.`:''}`;
    const userContent=[];
    if(imageData)userContent.push({type:'image',source:{type:'base64',media_type:imageData.mimeType,data:imageData.base64}});
    userContent.push({type:'text',text:aiText.trim()||'Analyse this tactical image and place all players accurately on the pitch.'});
    try{
      // ── Pass 1: tactical analysis ──────────────────────────────────────────
      setAiStatus('🔍 Analysing…');
      const analysisPrompt=`You are a football tactics analyst. Analyse the input and describe in plain English:
1. The teams involved and their kit colours (hex if possible)
2. The formation and player positions for each team — be specific about player numbers and x/y positions on the pitch
3. The key tactical moment — what is happening, who is moving where
4. Any goals, scoring chances, or notable events
5. Suggested arrow directions and colours for player/ball movement
This analysis will be used to place objects on a tactics board.`;
      const resp1=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:getHeaders(),
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:800,system:analysisPrompt,
          messages:[{role:'user',content:userContent}]})});
      if(!resp1.ok){const e1=await resp1.json().catch(()=>({}));throw new Error(e1.error&&e1.error.message?e1.error.message:`HTTP ${resp1.status}`);}
      const d1=await resp1.json();
      let analysis=d1.content.filter(function(b){return b.type==='text';}).map(function(b){return b.text||'';}).join('');
      // ── Pass 2: convert analysis to JSON — send only the analysis, not the original transcript ──
      setAiStatus('⚙ Building board…');
      const pass2Messages=[
        {role:'user',content:[{type:'text',text:'Convert this tactical analysis into the JSON object format specified in your system prompt. Output ONLY valid JSON, no explanation.\n\nANALYSIS:\n'+analysis}]}
      ];
      const resp2=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:getHeaders(),
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4000,system:systemPrompt,messages:pass2Messages})});
      if(!resp2.ok){const e2=await resp2.json().catch(()=>({}));throw new Error(e2.error&&e2.error.message?e2.error.message:`HTTP ${resp2.status}`);}
      const d2=await resp2.json();
      let text=d2.content.filter(function(b){return b.type==='text';}).map(function(b){return b.text||'';}).join('');
      text=text.replace(/```json|```/g,'').trim();
      const parsed=JSON.parse(text);
      const summary=buildDiffSummary(parsed,S.current);
      setAiPending({data:parsed,summary,analysis});
      setAiStatus('');
    }catch(err){setAiStatus('⚠ '+err.message);}
    setAiLoading(false);
  }

  function handleImageUpload(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{const base64=ev.target.result.split(',')[1];setImageData({base64,mimeType:file.type,previewUrl:ev.target.result,name:file.name});};
    reader.readAsDataURL(file);e.target.value='';
  }
  function clearImage(){setImageData(null);setAiStatus('');}

  // Delete / confirm / cancel keys
  useEffect(()=>{
    const fn=e=>{
      const tag=document.activeElement.tagName.toLowerCase();
      if(tag==='input'||tag==='textarea')return;
      if(e.key==='Delete'||e.key==='Backspace'){
        e.preventDefault();
        if(pendingDelete.current){executeDelete(pendingDelete.current.items);return;}
        const items=selectionItems();
        if(items.length)requestDelete(items,itemLabel(items));
      }
      if(e.key==='Enter'&&pendingDelete.current){
        e.preventDefault();
        executeDelete(pendingDelete.current.items);
      }
      if(e.key==='Escape'&&pendingDelete.current){
        pendingDelete.current=null;redraw();
      }
    };
    window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn);
  },[]);

  // ─── LEGACY JSON EXPORT/IMPORT (kept for file-based sharing) ─────────────
  function exportBoard(){
    const blob=new Blob([JSON.stringify(boardState(),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download='tactics-board.json';a.click();URL.revokeObjectURL(url);
  }
  function importBoard(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{applyBoardState(JSON.parse(ev.target.result));redraw();}catch{alert('Could not read board file.');}};
    reader.readAsText(file);e.target.value='';
  }


