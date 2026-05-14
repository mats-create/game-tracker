// app-ui.js — PlayerPanel sub-component, JSX render tree, root.render
// Nutmeg&Needle Game Tracker — edit this file,  not index.html

// ─── PLAYER PANEL SUB-COMPONENT ───────────────────────────────────────────
  function PlayerPanel(){
    const st=S.current,team=activeTeam;
    const teamColor=team==='A'?st.colorA:st.colorB;
    const edgeColorKey=team==='A'?'edgeColorA':'edgeColorB';
    const edgeColor=st[edgeColorKey]||'#ffffff';
    const teamName=team==='A'?st.teamNameA:st.teamNameB;
    const teamPlayers=st.players.filter(p=>p.team===team&&!p.ghost);
    return <>
      {/* Team tab row */}
      <div style={{display:'flex',gap:0,marginBottom:10,borderRadius:8,overflow:'hidden',border:`1px solid ${C.cardBorder}`}}>
        {['A','B'].map(t=>{
          const tc=t==='A'?st.colorA:st.colorB,tn=t==='A'?st.teamNameA:st.teamNameB,isAct=activeTeam===t;
          return <button key={t} onClick={()=>setActiveTeam(t)} style={{flex:1,padding:'7px 4px',cursor:'pointer',border:'none',background:isAct?tc:'#F7F7F4',color:isAct?'#fff':C.textMid,fontSize:11,fontWeight:isAct?600:400,borderRight:t==='A'?`1px solid ${C.cardBorder}`:'none'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:isAct?'rgba(255,255,255,0.5)':tc,marginRight:5,verticalAlign:'middle'}}/>
            {tn||`Team ${t}`}
          </button>;
        })}
      </div>
      {/* Team name + colour pickers — stacked to avoid sidebar overflow */}
      <div style={{marginBottom:10,padding:'8px 10px',background:'#F7F7F4',borderRadius:8}}>
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
          <div style={{width:26,height:26,borderRadius:'50%',background:teamColor,flexShrink:0,border:`3px solid ${edgeColor}`,boxSizing:'border-box'}}/>
          <input key={team} defaultValue={teamName}
            onChange={e=>{S.current[team==='A'?'teamNameA':'teamNameB']=e.target.value;}}
            onBlur={()=>redraw()}
            placeholder={`Team ${team} name`}
            style={{flex:1,fontSize:12,fontWeight:600,color:C.text,padding:'4px 8px',height:28,border:`1.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center',paddingLeft:32}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:10,color:C.textMuted}}>Jersey</span>
            <input type="color" defaultValue={teamColor} onChange={e=>{S.current[team==='A'?'colorA':'colorB']=e.target.value;redraw();}}
              style={{width:32,height:24,padding:1,border:`0.5px solid ${C.inputBorder}`,borderRadius:4,cursor:'pointer'}} title="Jersey colour"/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:10,color:C.textMuted}}>Ring</span>
            <input type="color" defaultValue={edgeColor} onChange={e=>{S.current[edgeColorKey]=e.target.value;redraw();}}
              style={{width:32,height:24,padding:1,border:`0.5px solid ${C.inputBorder}`,borderRadius:4,cursor:'pointer'}} title="Ring/trim colour"/>
          </div>
        </div>
      </div>
      {/* Column headers */}
      <div style={{display:'grid',gridTemplateColumns:'22px 30px 1fr 22px',gap:3,paddingBottom:4,marginBottom:2,borderBottom:`0.5px solid ${C.cardBorder}`}}>
        <span style={{fontSize:9,color:C.textMuted,textAlign:'center'}}>👁</span>
        <span style={{fontSize:9,color:C.textMuted,textAlign:'center'}}>#</span>
        <span style={{fontSize:9,color:C.textMuted}}>Name</span>
        <span style={{fontSize:9,color:C.textMuted,textAlign:'center'}}>👻</span>
      </div>
      {/* Player rows — uncontrolled inputs to preserve focus while typing */}
      <div style={{display:'flex',flexDirection:'column',gap:1}}>
        {teamPlayers.map(p=>{
          const ghosts=getGhosts(team,p.num),isExpanded=expandedId===(p.id||p.team+p.num);
          return <div key={p.id||p.team+p.num}>
            <div style={{display:'grid',gridTemplateColumns:'22px 30px 1fr 22px',gap:3,alignItems:'center',padding:'3px 0',background:p.hidden?'#FFF5F5':'transparent',opacity:p.hidden?0.65:1}}>
              <button title={p.hidden?'Show':'Hide'} onClick={()=>togglePlayerHidden(team,p.num)}
                style={{width:22,height:22,cursor:'pointer',borderRadius:4,border:'none',background:p.hidden?'#FEE2E2':'transparent',color:p.hidden?C.red:'#aaa',fontSize:11,padding:0,lineHeight:1}}>
                {p.hidden?'○':'●'}
              </button>
              <input type="text" inputMode="numeric" maxLength={2} defaultValue={p.num}
                onBlur={e=>updatePlayerNum(team,p.num,e.target.value)}
                style={{width:28,fontSize:11,padding:'2px 2px',height:22,border:`0.5px solid ${C.inputBorder}`,borderRadius:5,background:'#fff',color:C.text,outline:'none',textAlign:'center'}}/>
              <div style={{display:'flex',alignItems:'center',gap:3,minWidth:0}}>
                <input key={`name-${p.id||p.team+p.num}`} defaultValue={p.name||''}
                  placeholder={`#${p.num}`}
                  onChange={e=>{const pl=S.current.players.find(pl=>pl.id===p.id);if(pl)pl.name=e.target.value;}}
                  onBlur={()=>redraw()}
                  style={{flex:1,minWidth:0,fontSize:11,padding:'2px 5px',height:22,border:`0.5px solid ${C.inputBorder}`,borderRadius:5,background:'#fff',color:C.text,outline:'none'}}/>
                {ghosts.length>0&&(
                  <button onClick={()=>toggleExpanded(p.id||p.team+p.num)}
                    style={{fontSize:10,padding:'1px 4px',height:20,cursor:'pointer',borderRadius:4,border:`0.5px solid ${C.inputBorder}`,background:isExpanded?C.activeBg:'transparent',color:isExpanded?C.activeText:C.textMuted,flexShrink:0}}>
                    {ghosts.length}👻
                  </button>
                )}
              </div>
              <button onClick={()=>addGhost(team,p.num)} title="Add ghost"
                style={{width:22,height:22,cursor:'pointer',borderRadius:4,border:`0.5px solid ${C.inputBorder}`,background:'transparent',color:C.textMuted,fontSize:12,padding:0}}>+</button>
            </div>
            {isExpanded&&ghosts.map(g=>(
              <div key={g.id} style={{display:'flex',alignItems:'center',gap:6,padding:'2px 4px 2px 28px'}}>
                <span style={{fontSize:10,color:C.textMuted}}>👻 Ghost</span>
                <button onClick={()=>removeGhost(g.id)} style={{fontSize:10,padding:'1px 6px',cursor:'pointer',borderRadius:4,border:`0.5px solid ${C.inputBorder}`,background:'transparent',color:C.red,marginLeft:'auto'}}>Remove</button>
              </div>
            ))}
          </div>;
        })}
      </div>
    </>;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const st=S.current;
  const hasSel=st.selectedArrowIdx!==null&&st.arrows[st.selectedArrowIdx];
  const hasSelBall=st.selectedBallIdx!==null&&st.balls[st.selectedBallIdx];
  const hasSelBallGhost=hasSelBall&&st.balls[st.selectedBallIdx].ghost;
  const hasSelPM=st.selectedPhaseMarker&&st.phases[st.selectedPhaseMarker.phaseIdx]&&
    st.phases[st.selectedPhaseMarker.phaseIdx].markers[st.selectedPhaseMarker.markerIdx];

  // ─── SPLASH SCREEN (auth gate) ────────────────────────────────────────────
  if(!fbAuthReady){
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1A1A1A'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:32,letterSpacing:'-0.03em',color:'#F5F5F5',marginBottom:8}}>
            Nutmeg<span style={{color:'#CC3300'}}>&</span>Needle
          </div>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:400,fontSize:11,letterSpacing:'0.26em',textTransform:'uppercase',color:'#4A6741'}}>Handcrafted football moves</div>
          <div style={{marginTop:32,color:'#666',fontSize:12}}>Loading…</div>
        </div>
      </div>
    );
  }

  if(!fbUser){
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1A1A1A'}}>
        <div style={{textAlign:'center',maxWidth:320,padding:'0 24px'}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:32,letterSpacing:'-0.03em',color:'#F5F5F5',marginBottom:8}}>
            Nutmeg<span style={{color:'#CC3300'}}>&</span>Needle
          </div>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:400,fontSize:11,letterSpacing:'0.26em',textTransform:'uppercase',color:'#4A6741',marginBottom:40}}>Handcrafted football moves</div>
          <button onClick={signInWithGoogle} style={{width:'100%',fontSize:14,padding:'12px 24px',cursor:'pointer',borderRadius:10,border:'none',background:'#F5F5F5',color:'#1A1A1A',fontWeight:600,fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16}}>
            <span style={{fontSize:18,fontWeight:700,color:'#CC3300'}}>G</span> Sign in with Google
          </button>
          {saveMsg&&<div style={{fontSize:12,color:'#F87171',marginTop:8}}>{saveMsg}</div>}
          <div style={{fontSize:11,color:'#444',marginTop:24,lineHeight:1.6}}>Access is restricted to authorised users.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',gap:12,maxWidth:1180,margin:'0 auto',alignItems:'flex-start'}}>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <div className="tb-sidebar" style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',gap:0,maxHeight:'calc(100vh - 32px)',overflowY:'auto'}}>

        {/* Header */}
        <div style={{marginBottom:10,background:'#F0E6D3',borderRadius:12,padding:'10px 14px',border:'0.5px solid rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:18,letterSpacing:'-0.03em',color:'#1A1A1A',lineHeight:1.1}}>
                Nutmeg<span style={{color:'#CC3300'}}>&amp;</span>Needle
              </div>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:400,fontSize:9,letterSpacing:'0.26em',textTransform:'uppercase',color:'#4A6741',marginTop:3}}>Handcrafted football moves</div>
            </div>
            <button onClick={()=>requestDelete([{type:'reset'}],'the entire board')} style={{fontSize:11,padding:'5px 10px',cursor:'pointer',borderRadius:8,border:`0.5px solid ${C.activeBorder}`,background:'transparent',color:C.activeBorder,flexShrink:0}}>↺ Reset</button>
          </div>
          {fbUser&&(
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:8,paddingTop:8,borderTop:'0.5px solid rgba(0,0,0,0.1)'}}>
              {fbUser.photoURL&&<img src={fbUser.photoURL} alt="" style={{width:20,height:20,borderRadius:'50%',flexShrink:0}}/>}
              <span style={{fontSize:11,color:'#555',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fbUser.displayName||fbUser.email}</span>
              <button onClick={signOut} style={{fontSize:11,padding:'3px 10px',cursor:'pointer',borderRadius:6,border:'0.5px solid rgba(0,0,0,0.15)',background:'transparent',color:'#888',flexShrink:0,fontFamily:"'Inter',sans-serif"}}>Sign out</button>
            </div>
          )}
          {!fbUser&&saveMsg&&(
            <div style={{marginTop:8,paddingTop:8,borderTop:'0.5px solid rgba(0,0,0,0.1)',fontSize:11,color:'#4A6741'}}>{saveMsg}</div>
          )}
        </div>

        {/* 1. What would you like to do */}
        <Collapsible label="✦ Match moment (AI)" defaultOpen={false} accentColor={{bg:'#F7F0E8',border:C.blueBorder,text:C.activeText}}>
          <div style={{fontSize:12,fontWeight:600,color:C.activeText,marginBottom:8}}>✦ Auto-place from description or image</div>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/>
          {imageData?(
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8,padding:'8px 10px',background:'#fff',borderRadius:10,border:`1px solid ${C.blueBorder}`}}>
              <img src={imageData.previewUrl} alt="uploaded" style={{width:52,height:40,objectFit:'cover',borderRadius:6,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:500,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{imageData.name}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>Image ready</div>
              </div>
              <button onClick={clearImage} style={{fontSize:18,lineHeight:1,cursor:'pointer',border:'none',background:'transparent',color:C.textMuted,flexShrink:0}}>×</button>
            </div>
          ):(
            <button onClick={()=>imageInputRef.current.click()} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',marginBottom:8,padding:'9px',cursor:'pointer',borderRadius:10,border:`1.5px dashed ${C.blueBorder}`,background:'rgba(255,255,255,0.6)',color:C.activeText,fontSize:12,fontWeight:500}}>
              <span style={{fontSize:18}}>🖼</span> Upload match image or screenshot
            </button>
          )}
          <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:10,color:C.textMuted,whiteSpace:'nowrap',fontWeight:500}}>⏱ Timestamp</span>
            <input value={aiTimestamp} onChange={e=>setAiTimestamp(e.target.value)}
              placeholder="e.g. 23:14 or '2nd half, 68 min'"
              style={{flex:1,fontSize:11,padding:'4px 8px',height:26,border:`0.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',color:C.text,outline:'none'}}/>
          </div>
          <div style={{position:'relative',marginBottom:6}}>
            <textarea ref={textareaRef} value={aiText} onChange={e=>setAiText(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))parseAI();}}
              placeholder={imageData?'Optional: add commentary or context':'Paste match commentary, coaching transcript, or describe the moment.'}
              style={{width:'100%',fontSize:11,padding:'8px 10px',minHeight:90,maxHeight:240,resize:'vertical',border:`1px solid ${C.blueBorder}`,borderRadius:8,background:'#fff',color:C.text,outline:'none',lineHeight:1.55,boxSizing:'border-box',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}/>
            <div style={{position:'absolute',bottom:6,right:8,fontSize:9,color:'rgba(0,0,0,0.25)',pointerEvents:'none'}}>⌘↵ to generate</div>
          </div>
          {!aiPending&&<button onClick={parseAI} disabled={aiLoading||(!aiText.trim()&&!imageData)} style={{width:'100%',fontSize:12,padding:'8px',cursor:(aiLoading||(!aiText.trim()&&!imageData))?'default':'pointer',borderRadius:8,border:'none',background:aiLoading?'#F5A080':((!aiText.trim()&&!imageData)?'#CBD5E1':C.blue),color:'#fff',fontWeight:600}}>
            {aiLoading?'Thinking…':'Generate ✦'}
          </button>}
          {aiPending&&<div style={{marginTop:4,padding:'10px 12px',background:'#1A1A1A',borderRadius:10}}>
            {aiPending.analysis&&<div style={{fontSize:10,color:'rgba(255,255,255,0.55)',marginBottom:6,maxHeight:80,overflowY:'auto',lineHeight:1.4}}>{aiPending.analysis.slice(0,300)}{aiPending.analysis.length>300?'…':''}</div>}
            <div style={{fontSize:11,color:'#F5F5F5',marginBottom:8}}>Ready to apply: <span style={{color:'#FF9966'}}>{aiPending.summary}</span></div>
            <div style={{display:'flex',gap:8}}>
              <button autoFocus onClick={()=>{applyBoardJSON(JSON.stringify(aiPending.data));setAiPending(null);setAiStatus('✓ Board updated');redraw();}}
                style={{flex:1,fontSize:11,padding:'5px 0',cursor:'pointer',borderRadius:6,border:'none',background:'#CC3300',color:'#fff',fontWeight:600}}>
                Apply ✓
              </button>
              <button onClick={()=>{setAiPending(null);setAiStatus('Discarded.');}}
                style={{flex:1,fontSize:11,padding:'5px 0',cursor:'pointer',borderRadius:6,border:'0.5px solid rgba(255,255,255,0.2)',background:'transparent',color:'rgba(255,255,255,0.6)'}}>
                Discard
              </button>
            </div>
          </div>}
          {aiStatus&&<div style={{fontSize:11,color:aiStatus.startsWith('⚠')?C.red:C.green,marginTop:6}}>{aiStatus}</div>}
          <details style={{marginTop:6}}>
            <summary style={{fontSize:11,color:C.textMuted,cursor:'pointer',userSelect:'none',listStyle:'none',display:'flex',alignItems:'center',gap:4}}>
              <span>⚙</span>
              <span>{isInsideClaude()?'Running inside Claude.ai — no key needed':'API key'}</span>
              {!isInsideClaude()&&apiKey&&<span style={{fontSize:10,color:C.green,marginLeft:4}}>✓ saved</span>}
              {!isInsideClaude()&&!apiKey&&<span style={{fontSize:10,color:'#F59E0B',marginLeft:4}}>⚠ required</span>}
            </summary>
            <div style={{marginTop:6,padding:'9px 10px',background:'rgba(255,255,255,0.7)',borderRadius:8,border:`0.5px solid ${C.blueBorder}`}}>
              {isInsideClaude()?(
                <div style={{fontSize:11,color:C.textMuted,lineHeight:1.5}}>You're inside Claude.ai — API calls are proxied automatically. Download the file and add a key to use it standalone.</div>
              ):(
                <>
                  <div style={{fontSize:11,color:C.textMuted,marginBottom:6,lineHeight:1.5}}>Your key is saved to your account and syncs across devices.<br/><a href="https://console.anthropic.com" target="_blank" style={{color:C.blue}}>Get a key →</a></div>
                  <div style={{display:'flex',gap:5,alignItems:'center'}}>
                    <input type={showKey?'text':'password'} value={apiKey} onChange={e=>saveApiKey(e.target.value)} placeholder="sk-ant-..."
                      style={{flex:1,fontSize:12,padding:'4px 8px',height:28,border:`0.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',color:C.text,outline:'none',fontFamily:'monospace'}}/>
                    <button onClick={()=>setShowKey(s=>!s)} style={{fontSize:11,padding:'3px 7px',height:28,cursor:'pointer',borderRadius:5,border:`0.5px solid ${C.inputBorder}`,background:'transparent',color:C.textMuted}}>{showKey?'Hide':'Show'}</button>
                    {apiKey&&<button onClick={()=>saveApiKey('')} style={{fontSize:11,padding:'3px 7px',height:28,cursor:'pointer',borderRadius:5,border:`0.5px solid ${C.inputBorder}`,background:'transparent',color:C.red}}>Clear</button>}
                  </div>
                </>
              )}
            </div>
          </details>
        </Collapsible>

        {/* 5. Memorable moment */}
        <Collapsible label="What would you like to do" defaultOpen={true}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:st.mode==='arrow'?10:0}}>
            <ModeBtn active={st.mode==='move'}  onClick={()=>setMode('move')}  emoji="✥" label="Move"       title="Drag players, balls, arrows and markers"/>
            <ModeBtn active={st.mode==='arrow'} onClick={()=>setMode('arrow')} emoji="→" label="Draw arrow" title="Draw arrows for passes, runs, movement"/>
            <ModeBtn active={st.mode==='ball'}  onClick={()=>setMode('ball')}  emoji="⚽" label="Place ball" title="Click anywhere to add a ball"/>
            <ModeBtn active={st.mode==='phase'} onClick={()=>setMode('phase')} emoji="①" label="Add move"   title="Click the pitch to drop a move marker"/>
            <ModeBtn active={st.mode==='symbol'} onClick={()=>setMode('symbol')} emoji="◈" label="Symbol"    title="Click the pitch to place an event symbol"/>
          </div>

          {st.mode==='arrow'&&(
            <div style={{padding:'10px 12px',background:'#F7F7F4',borderRadius:10}}>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>LINE TYPE</div>
                <Row style={{gap:4}}>
                  <ToggleBtn active={st.arrowStyle==='solid'}  onClick={()=>setAS('solid')}  title="Solid — player runs">Solid</ToggleBtn>
                  <ToggleBtn active={st.arrowStyle==='dashed'} onClick={()=>setAS('dashed')} title="Dashed — passes">Dashed</ToggleBtn>
                  <ToggleBtn active={st.arrowStyle==='wave'}   onClick={()=>setAS('wave')}   title="Wavy — dribbles">Wavy</ToggleBtn>
                </Row>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>SHAPE</div>
                <Row style={{gap:4}}>
                  <ToggleBtn active={st.arrowShape==='straight'} onClick={()=>setSH('straight')}>Straight</ToggleBtn>
                  <ToggleBtn active={st.arrowShape==='curve'}    onClick={()=>setSH('curve')}   title="3 clicks: start → bend → end">Curved</ToggleBtn>
                  <ToggleBtn active={st.arrowShape==='elbow'}    onClick={()=>setSH('elbow')}   title="L-shaped">Elbow</ToggleBtn>
                  <ToggleBtn active={st.arrowShape==='free'}     onClick={()=>setSH('free')}>Freehand</ToggleBtn>
                </Row>
              </div>
              <div style={{display:'flex',gap:12,alignItems:'flex-end'}}>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>ARROWHEAD</div>
                  <Row style={{gap:4}}>
                    <ToggleBtn active={st.arrowHeadSize==='none'} onClick={()=>{S.current.arrowHeadSize='none';redraw();}}>None</ToggleBtn>
                    <ToggleBtn active={st.arrowHeadSize==='s'} onClick={()=>{S.current.arrowHeadSize='s';redraw();}}>S</ToggleBtn>
                    <ToggleBtn active={st.arrowHeadSize==='m'} onClick={()=>{S.current.arrowHeadSize='m';redraw();}}>M</ToggleBtn>
                    <ToggleBtn active={st.arrowHeadSize==='l'} onClick={()=>{S.current.arrowHeadSize='l';redraw();}}>L</ToggleBtn>
                  </Row>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>LINE COLOUR</div>
                  <Row style={{gap:4}}>
                    {[
                      {key:'A',color:st.colorA,label:st.teamNameA||'Team A'},
                      {key:'B',color:st.colorB,label:st.teamNameB||'Team B'},
                      {key:'ball',color:'#F5F5F5',label:'Ball'}
                    ].map(function(opt){
                      const isActive=st.arrowColor===opt.color||(opt.key==='ball'&&st.arrowColor==='#F5F5F5');
                      return React.createElement('button',{
                        key:opt.key,
                        title:opt.label,
                        onClick:function(){S.current.arrowColor=opt.color;redraw();},
                        style:{
                          width:28,height:28,borderRadius:6,cursor:'pointer',padding:0,
                          background:opt.color,
                          border:isActive?'2px solid '+C.activeText:'1.5px solid '+C.inputBorder,
                          boxShadow:isActive?'0 0 0 2px '+C.activeBg:undefined,
                          position:'relative',flexShrink:0
                        }
                      },
                      opt.key==='ball'&&React.createElement('span',{style:{
                        position:'absolute',top:'50%',left:'50%',
                        transform:'translate(-50%,-50%)',
                        fontSize:11,lineHeight:1,color:'#999',pointerEvents:'none'
                      }},'⚽')
                      );
                    })}
                  </Row>
                </div>
                <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                  <GhostBtn onClick={undoArrow}>↩ Undo</GhostBtn>
                  <GhostBtn onClick={clearArrows}>✕ Clear</GhostBtn>
                </div>
              </div>
              {st.arrowShape==='curve'&&<Hint style={{marginTop:6}}>Click <b>start</b>, then a <b>bend point</b>, then the <b>end</b>.</Hint>}
              {st.arrowShape==='elbow'&&<Hint style={{marginTop:6}}>Click <b>start</b>, then <b>end</b> — drag the orange ● handle in Move mode to reposition the bend.</Hint>}
              {st.arrowShape==='straight'&&<Hint style={{marginTop:6}}>Drag near a <b>player or ball</b> to snap and connect.</Hint>}
              <Hint style={{marginTop:4}}>Start or end near a player or ball to <b>snap and connect</b>.</Hint>
            </div>
          )}

          {st.mode==='move'&&(st.multiSelection||[]).length===0&&!pendingDelete.current&&<Hint>Click to select · <b>Shift+click</b> to multi-select · <b>Backspace</b> to delete selected</Hint>}
          {st.mode==='move'&&(st.multiSelection||[]).length>0&&!pendingDelete.current&&<Hint style={{background:'#FFF5F2',border:'1px solid '+C.blueBorder,color:C.activeText}}><b>{(st.multiSelection||[]).length} selected</b> — Backspace to delete · Shift+click to add/remove · click empty area to clear</Hint>}
          {pendingDelete.current&&(()=>{
            const pd=pendingDelete.current;
            return <div style={{marginTop:6,padding:'10px 12px',background:'#1A1A1A',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:11,color:'#F5F5F5',flex:1}}>Delete <b style={{color:'#FF6633'}}>{pd.label}</b>? This cannot be undone.</span>
              <button autoFocus onClick={()=>{pendingDelete.current=null;redraw();}} style={{fontSize:11,padding:'4px 10px',cursor:'pointer',borderRadius:6,border:'0.5px solid rgba(255,255,255,0.2)',background:'transparent',color:'rgba(255,255,255,0.6)'}}>Cancel</button>
              <button onClick={()=>executeDelete(pd.items)} style={{fontSize:11,padding:'4px 12px',cursor:'pointer',borderRadius:6,border:'none',background:'#CC3300',color:'#fff',fontWeight:600}}>Delete ↵</button>
            </div>;
          })()}
          {st.mode==='ball'  &&<Hint>Click the pitch to place a ball. Select in Move mode to drag or make it a ghost.</Hint>}
          {st.mode==='phase'&&(
            <div style={{marginTop:6,padding:'8px 10px',background:'#F0F9FF',border:'1px solid #BAE6FD',borderRadius:8,display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:20}}>👆</span>
              <div style={{fontSize:11,color:'#0369A1',fontWeight:500}}>
                Click anywhere on the pitch to place move <b style={{fontSize:14,fontFamily:'sans-serif'}}>{phaseLabel((S.current.phases[S.current.activePh]||{label:1}).label)}</b> marker
              </div>
            </div>
          )}

          {st.selectedGhostId&&(()=>{
            const gp=st.players.find(p=>p.id===st.selectedGhostId);
            if(!gp)return null;
            return <InfoBar icon="👻" text={'Ghost of '+(gp.team==='A'?st.teamNameA||'Team A':st.teamNameB||'Team B')+' #'+gp.num+' — drag to reposition.'}>
              <GhostBtn onClick={()=>requestDelete([{type:'ghost',ghostId:st.selectedGhostId}],'ghost player')}>Delete</GhostBtn>
            </InfoBar>;
          })()}
          {hasSel&&(()=>{
            const selA=st.arrows[st.selectedArrowIdx];
            const headOn=(selA.headSize||st.arrowHeadSize)!=='none';
            return <InfoBar icon="→" text="Arrow selected — drag body to move, drag handles to reshape.">
              <button onClick={()=>{selA.headSize=headOn?'none':(selA.headSize&&selA.headSize!=='none'?selA.headSize:st.arrowHeadSize);redraw();}}
                style={{fontSize:11,padding:'3px 8px',height:26,cursor:'pointer',borderRadius:6,
                  border:headOn?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                  background:headOn?C.activeBg:'transparent',color:headOn?C.activeText:C.textMid}}>
                {headOn?'Head: on':'Head: off'}
              </button>
              <GhostBtn onClick={deleteSelectedArrow}>Delete</GhostBtn>
            </InfoBar>;
          })()}
          {hasSelBall&&<InfoBar icon="⚽" text={`${hasSelBallGhost?'Ghost ball':'Ball'} selected.`}>
            <button onClick={toggleBallGhost} style={{fontSize:11,padding:'3px 8px',height:26,cursor:'pointer',borderRadius:6,border:hasSelBallGhost?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:hasSelBallGhost?C.activeBg:'transparent',color:hasSelBallGhost?C.activeText:C.textMid}}>
              {hasSelBallGhost?'Ghost: on':'Make ghost'}
            </button>
            <button onClick={()=>{const bl=st.balls[st.selectedBallIdx];if(bl){bl.score=!bl.score;redraw();}}} style={{fontSize:11,padding:'3px 8px',height:26,cursor:'pointer',borderRadius:6,border:st.balls[st.selectedBallIdx]&&st.balls[st.selectedBallIdx].score?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:st.balls[st.selectedBallIdx]&&st.balls[st.selectedBallIdx].score?C.activeBg:'transparent',color:st.balls[st.selectedBallIdx]&&st.balls[st.selectedBallIdx].score?C.activeText:C.textMid}}>
              {st.balls[st.selectedBallIdx]&&st.balls[st.selectedBallIdx].score?'Score: on':'Score'}
            </button>
            <GhostBtn onClick={deleteSelectedBall}>Delete</GhostBtn>
          </InfoBar>}
          {hasSelPM&&(()=>{
            const spm=st.selectedPhaseMarker;
            return <div style={{marginTop:8,padding:'8px 10px',background:C.blueLight,borderRadius:10,border:`1px solid ${C.blueBorder}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:14}}>①</span>
                <span style={{fontSize:11,color:C.activeText,flex:1}}>Step marker selected — drag to move</span>
                <GhostBtn onClick={deleteSelectedPhaseMarker}>Delete</GhostBtn>
              </div>

            </div>;
          })()}
          {st.selectedSymbolIdx!==null&&(()=>{
            const sym=(st.symbols||[])[st.selectedSymbolIdx];
            if(!sym)return null;
            return <div style={{marginTop:8,padding:'8px 10px',background:C.blueLight,borderRadius:10,border:'1px solid '+C.blueBorder}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:14}}>◈</span>
                <span style={{fontSize:11,color:C.activeText,flex:1}}>Symbol selected — drag to move</span>
                <GhostBtn onClick={deleteSelectedSymbol}>Delete</GhostBtn>
              </div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>TYPE</div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:8}}>
                {[
                  {id:'goal',label:'Goal',title:'Goal'},
                  {id:'shot',label:'Shot',title:'Shot'},
                  {id:'pass',label:'Pass',title:'Pass'},
                  {id:'corner',label:'Corner',title:'Corner'},
                  {id:'foul',label:'Foul',title:'Foul'},
                  {id:'ball',label:'Ball',title:'Ball'},
                  {id:'linesman',label:'Linesman',title:'Linesman'},
                  {id:'referee',label:'Referee',title:'Referee'}
                ].map(function(ev){
                  return React.createElement('button',{
                    key:ev.id,title:ev.title,
                    onClick:function(){setSymbolProp('type',ev.id);S.current.symbolType=ev.id;},
                    style:{fontSize:10,padding:'2px 5px',height:24,cursor:'pointer',borderRadius:5,
                      border:sym.type===ev.id?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                      background:sym.type===ev.id?C.activeBg:'#fff',
                      color:sym.type===ev.id?C.activeText:C.textMid,whiteSpace:'nowrap'}
                  },ev.title);
                })}
              </div>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>SIZE</div>
                  <Row style={{gap:3}}>
                    {['xs','s','m','l'].map(function(sz){
                      return React.createElement('button',{
                        key:sz,
                        onClick:function(){setSymbolProp('size',sz);S.current.symbolSize=sz;},
                        style:{fontSize:10,padding:'2px 7px',height:24,cursor:'pointer',borderRadius:5,
                          border:sym.size===sz?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                          background:sym.size===sz?C.activeBg:'#fff',
                          color:sym.size===sz?C.activeText:C.textMid}
                      },sz.toUpperCase());
                    })}
                  </Row>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>COLOUR</div>
                  <input type="color" value={sym.color||'#F5F5F5'}
                    onChange={function(e){setSymbolProp('color',e.target.value);S.current.symbolColor=e.target.value;}}
                    style={{width:32,height:24,padding:2,border:'0.5px solid '+C.inputBorder,borderRadius:6,cursor:'pointer'}}/>
                </div>
              </div>
            </div>;
          })()}
        </Collapsible>


        {/* 1b. Symbols */}
        <Collapsible label="Symbols" badge={(st.symbols||[]).length+' placed'}>
          <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>
            Select type and colour, then click pitch to place. Drag to reposition.
          </div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>TYPE</div>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {[{id:'goal',label:'Goal'},{id:'shot',label:'Shot'},{id:'pass',label:'Pass'},{id:'corner',label:'Corner'},{id:'foul',label:'Foul'},{id:'ball',label:'Ball'},{id:'linesman',label:'Linesman'},{id:'referee',label:'Referee'}].map(function(sym){
                const isAct=st.symbolType===sym.id;
                return React.createElement('button',{key:sym.id,title:sym.id,onClick:function(){S.current.symbolType=sym.id;redraw();},
                  style:{fontSize:10,padding:'2px 6px',cursor:'pointer',borderRadius:5,marginBottom:2,
                    border:isAct?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                    background:isAct?C.activeBg:'#fff',color:isAct?C.activeText:C.textMid}},sym.label);
              })}
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>SIZE</div>
              <div style={{display:'flex',gap:3}}>
                {['xs','s','m','l'].map(function(sz){const isAct=st.symbolSize===sz;
                  return React.createElement('button',{key:sz,onClick:function(){S.current.symbolSize=sz;redraw();},
                    style:{fontSize:10,padding:'2px 6px',cursor:'pointer',borderRadius:5,
                      border:isAct?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                      background:isAct?C.activeBg:'transparent',color:isAct?C.activeText:C.textMid}},sz.toUpperCase());
                })}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>COLOUR</div>
              <div style={{display:'flex',gap:4}}>
                {[{key:'A',color:st.colorA,label:st.teamNameA||'Team A'},{key:'B',color:st.colorB,label:st.teamNameB||'Team B'},{key:'w',color:'#F5F5F5',label:'White'}].map(function(opt){
                  const isAct=st.symbolColor===opt.color;
                  return React.createElement('button',{key:opt.key,title:opt.label,onClick:function(){S.current.symbolColor=opt.color;redraw();},
                    style:{width:24,height:24,borderRadius:5,cursor:'pointer',padding:0,flexShrink:0,
                      background:opt.color,border:isAct?'2px solid '+C.activeText:'1.5px solid '+C.inputBorder}});
                })}
              </div>
            </div>
          </div>
          {(st.selectedSymbolIdx!==null&&st.selectedSymbolIdx!==undefined&&(st.symbols||[])[st.selectedSymbolIdx])&&(function(){
            const sym=(st.symbols||[])[st.selectedSymbolIdx];
            return React.createElement('div',{style:{marginTop:4,padding:'6px 8px',background:C.blueLight,borderRadius:8,border:'1px solid '+C.blueBorder}},
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6,marginBottom:4}},
                React.createElement('span',{style:{fontSize:11,color:C.activeText,flex:1}},'Symbol selected — drag to move'),
                React.createElement('button',{onClick:deleteSelectedSymbol,
                  style:{fontSize:11,padding:'2px 7px',cursor:'pointer',borderRadius:5,border:'0.5px solid '+C.activeBorder,background:C.activeBg,color:C.activeText}},'Delete')
              ),
              React.createElement('div',{style:{fontSize:10,color:C.textMuted,marginBottom:4}},'Change type:'),
              React.createElement('div',{style:{display:'flex',gap:3,flexWrap:'wrap'}},
                ['goal','shot','pass','corner','foul','ball','linesman','referee'].map(function(t){
                  return React.createElement('button',{key:t,onClick:function(){(st.symbols||[])[st.selectedSymbolIdx].type=t;redraw();},
                    style:{fontSize:10,padding:'2px 5px',cursor:'pointer',borderRadius:4,marginBottom:2,
                      border:sym.type===t?'1.5px solid '+C.activeBorder:'0.5px solid '+C.inputBorder,
                      background:sym.type===t?C.activeBg:'#fff',color:sym.type===t?C.activeText:C.textMid}},t);
                })
              )
            );
          })()}
        </Collapsible>

        {/* 2. Players */}
        <Collapsible label="Players" badge={`${st.players.filter(p=>!p.ghost).length} players`}>
          <PlayerPanel/>
        </Collapsible>

        {/* 3. Pitch settings */}
        <Collapsible label="Pitch settings" defaultOpen={false}>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>VIEW</div>
            <Row style={{gap:4}}>
              <ToggleBtn active={st.view==='full'}  onClick={()=>setView('full')}>Full pitch</ToggleBtn>
              <ToggleBtn active={st.view==='left'}  onClick={()=>setView('left')}>Left half</ToggleBtn>
              <ToggleBtn active={st.view==='right'} onClick={()=>setView('right')}>Right half</ToggleBtn>
            </Row>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>PLAYER SIZE</div>
            <Row style={{gap:4}}>
              <ToggleBtn active={st.pR===PSIZES.xs} onClick={()=>setPR(PSIZES.xs)}>XS</ToggleBtn>
              <ToggleBtn active={st.pR===PSIZES.s}  onClick={()=>setPR(PSIZES.s)}>S</ToggleBtn>
              <ToggleBtn active={st.pR===PSIZES.m}  onClick={()=>setPR(PSIZES.m)}>M</ToggleBtn>
              <ToggleBtn active={st.pR===PSIZES.l}  onClick={()=>setPR(PSIZES.l)}>L</ToggleBtn>
            </Row>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>NUMBER CONTRAST</div>
            <Row style={{gap:4}}>
              <ToggleBtn active={st.labelContrast==='normal'}              onClick={()=>{S.current.labelContrast='normal';redraw();}}>Normal</ToggleBtn>
              <ToggleBtn active={(st.labelContrast||'outline')==='outline'} onClick={()=>{S.current.labelContrast='outline';redraw();}}>Outlined</ToggleBtn>
              <ToggleBtn active={st.labelContrast==='dark'}               onClick={()=>{S.current.labelContrast='dark';redraw();}}>Dark</ToggleBtn>
            </Row>
          </div>
          <div style={{marginTop:8}}>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:4,fontWeight:500}}>ALIGNMENT GRID</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={()=>{S.current.showGrid=!S.current.showGrid;redraw();}}
                style={{fontSize:11,padding:'3px 10px',height:26,cursor:'pointer',borderRadius:6,
                  border:st.showGrid?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,
                  background:st.showGrid?C.activeBg:'transparent',
                  color:st.showGrid?C.activeText:C.textMid}}>
                {st.showGrid?'Grid: on':'Grid: off'}
              </button>
              <span style={{fontSize:10,color:C.textMuted}}>Not exported · 1 sq = ~3 stitches (280×250mm hoop, 14-ct aida)</span>
            </div>
          </div>
        </Collapsible>

        {/* 4. Legend settings */}
        <Collapsible label="Legend settings" defaultOpen={false}>
          {getLegendRows(S)&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:6}}>Player legend</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:10,color:C.textMuted,width:60}}>Text colour</span>
                  <input type="color" defaultValue={st.legend.textColor||'#222'} onChange={e=>{S.current.legend.textColor=e.target.value;redraw();}}
                    style={{width:32,height:24,padding:1,border:`0.5px solid ${C.inputBorder}`,borderRadius:4,cursor:'pointer'}}/>
                  <span style={{fontSize:10,color:C.textMuted,marginLeft:4}}>Font size</span>
                  <ToggleBtn active={(st.legend.scale||1)<0.8} onClick={()=>{S.current.legend.scale=0.65;S.current.legend.w=null;S.current.legend.h=null;redraw();}}>S</ToggleBtn>
                  <ToggleBtn active={(st.legend.scale||1)>=0.8&&(st.legend.scale||1)<1.3} onClick={()=>{S.current.legend.scale=1;S.current.legend.w=null;S.current.legend.h=null;redraw();}}>M</ToggleBtn>
                  <ToggleBtn active={(st.legend.scale||1)>=1.3} onClick={()=>{S.current.legend.scale=1.6;S.current.legend.w=null;S.current.legend.h=null;redraw();}}>L</ToggleBtn>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:10,color:C.textMuted,width:60}}>Layout</span>
                  <ToggleBtn active={(st.legend.cols||2)===2} onClick={()=>{S.current.legend.cols=2;S.current.legend.w=null;S.current.legend.h=null;redraw();}}>2 columns</ToggleBtn>
                  <ToggleBtn active={(st.legend.cols||2)===1} onClick={()=>{S.current.legend.cols=1;S.current.legend.w=null;S.current.legend.h=null;redraw();}}>1 column</ToggleBtn>
                </div>
                <Hint>Drag the legend by its body to reposition. Drag a corner or edge to resize and reflow text.</Hint>
              </div>
            </div>
          )}
          {st.phases.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:6}}>Moves legend</div>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:10,color:C.textMuted,width:60}}>Text colour</span>
                <input type="color" defaultValue={st.stepLegend.textColor||'#333'} onChange={e=>{S.current.stepLegend.textColor=e.target.value;redraw();}}
                  style={{width:32,height:24,padding:1,border:`0.5px solid ${C.inputBorder}`,borderRadius:4,cursor:'pointer'}}/>
                <span style={{fontSize:10,color:C.textMuted,marginLeft:4}}>Font size</span>
                <ToggleBtn active={(st.stepLegend.scale||1)<0.8} onClick={()=>{S.current.stepLegend.scale=0.65;S.current.stepLegend.w=null;S.current.stepLegend.h=null;redraw();}}>S</ToggleBtn>
                <ToggleBtn active={(st.stepLegend.scale||1)>=0.8&&(st.stepLegend.scale||1)<1.3} onClick={()=>{S.current.stepLegend.scale=1;S.current.stepLegend.w=null;S.current.stepLegend.h=null;redraw();}}>M</ToggleBtn>
                <ToggleBtn active={(st.stepLegend.scale||1)>=1.3} onClick={()=>{S.current.stepLegend.scale=1.6;S.current.stepLegend.w=null;S.current.stepLegend.h=null;redraw();}}>L</ToggleBtn>
              </div>
              <Hint>Drag edges to widen (text reflows) or tall to show more steps.</Hint>
            </div>
          )}
          {!getLegendRows(S)&&!st.phases.length&&(
            <Hint>Add player names in the Players section to show the player legend. Add moves to show the moves legend.</Hint>
          )}
        </Collapsible>

        {/* 4. AI match moment */}
        <Collapsible key={currentBoardId} label="Memorable moment" defaultOpen={false}>
          {(()=>{
            const mo=st.moment||{};
            const field=(key,label,multi,placeholder)=>(
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:C.textMuted,fontWeight:500,marginBottom:3}}>{label}</div>
                {multi
                  ? <textarea defaultValue={mo[key]||''} placeholder={placeholder}
                      onChange={e=>{if(!S.current.moment)S.current.moment={};S.current.moment[key]=e.target.value;}}
                      rows={3}
                      style={{width:'100%',fontSize:11,padding:'5px 8px',border:`0.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',color:C.text,outline:'none',resize:'vertical',lineHeight:1.5,fontFamily:'inherit',boxSizing:'border-box'}}/>
                  : <input defaultValue={mo[key]||''} placeholder={placeholder}
                      onChange={e=>{if(!S.current.moment)S.current.moment={};S.current.moment[key]=e.target.value;}}
                      style={{width:'100%',fontSize:11,padding:'5px 8px',height:28,border:`0.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',color:C.text,outline:'none',boxSizing:'border-box'}}/>
                }
              </div>
            );
            return <>
              {field('heading','Heading','','e.g. The Hand of God')}
              {field('what','What',true,'Short description of what occurred…')}
              {field('event','Event','','e.g. 1986 FIFA World Cup Quarter-Final')}
              {field('at','At','','e.g. Estadio Azteca, Mexico City')}
              {field('when','When','','e.g. 22 June 1986 · 51st minute')}
              {field('who','Who',true,'Key players involved…')}
              <Hint>This section appears in the PDF export as a narrative header above the pitch diagram.</Hint>
            </>;
          })()}
        </Collapsible>

        {/* 6. Export */}
        <Collapsible label="Export" defaultOpen={false}>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:6}}>Export area</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:6}}>
                <button onClick={()=>setMode('crop')}
                  style={{fontSize:11,padding:'6px',cursor:'pointer',borderRadius:7,fontWeight:500,border:st.mode==='crop'?`1.5px solid ${C.blueBorder}`:`0.5px solid ${C.inputBorder}`,background:st.mode==='crop'?C.activeBg:C.inputBg,color:st.mode==='crop'?C.activeText:C.textMid}}>
                  ⬚ {st.cropRegion?'Redraw crop':'Set crop'}
                </button>
                <button onClick={clearCrop} disabled={!st.cropRegion}
                  style={{fontSize:11,padding:'6px',cursor:st.cropRegion?'pointer':'default',borderRadius:7,fontWeight:500,border:`0.5px solid ${st.cropRegion?C.inputBorder:'#e5e5e5'}`,background:st.cropRegion?'#FFF0F0':'#F5F5F0',color:st.cropRegion?'#C0392B':'#ccc'}}>
                  ✕ Clear crop
                </button>
              </div>
              <div style={{padding:'6px 9px',borderRadius:7,fontSize:10,lineHeight:1.5,background:st.cropRegion?'#EEF6EE':'#F5F5F0',border:`0.5px solid ${st.cropRegion?'#8BC88B':'#ddd'}`,color:st.cropRegion?'#2a6b2a':C.textMuted}}>
                {st.cropRegion?<>✓ Crop set ({(st.exportFormat||'a4').toUpperCase()} {st.exportOrientation||'landscape'}) — drag edge handles on pitch to adjust</>:'No crop — exports use full pitch. Click "Set crop" then drag on the pitch.'}
              </div>
            </div>
            <div style={{height:0.5,background:'rgba(0,0,0,0.07)',margin:'2px 0'}}/>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:5}}>Page format</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5}}>
                {[['a4','A4'],['letter','Letter'],['hoop','Nurge Hoop']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>{S.current.exportFormat=val;if(S.current.cropRegion){S.current.cropRegion.h=S.current.cropRegion.w/pageAspect();}redraw();}}
                    style={{fontSize:11,padding:'5px',cursor:'pointer',borderRadius:7,fontWeight:500,border:st.exportFormat===val?`1px solid ${C.blueBorder}`:`0.5px solid ${C.inputBorder}`,background:st.exportFormat===val?C.activeBg:C.inputBg,color:st.exportFormat===val?C.activeText:C.textMid}}>{lbl}</button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginTop:5}}>
                {[['landscape','Landscape'],['portrait','Portrait']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>{S.current.exportOrientation=val;if(S.current.cropRegion){S.current.cropRegion.h=S.current.cropRegion.w/pageAspect();}redraw();}}
                    style={{fontSize:11,padding:'5px',cursor:'pointer',borderRadius:7,fontWeight:500,border:st.exportOrientation===val?`1px solid ${C.blueBorder}`:`0.5px solid ${C.inputBorder}`,background:st.exportOrientation===val?C.activeBg:C.inputBg,color:st.exportOrientation===val?C.activeText:C.textMid}}>{lbl}</button>
                ))}
              </div>
              {st.exportFormat==='hoop'&&<div style={{fontSize:10,color:C.textMuted,marginTop:4,padding:'6px 8px',background:C.cardBg,borderRadius:6,border:`0.5px solid ${C.cardBorder}`}}>📐 Nurge 280×250mm · landscape · 14-count aida · ~143×102 stitches · 1 sq ≈ 3 stitches</div>}
              <Hint style={{marginTop:5}}>{st.exportFormat==='hoop'?'Hoop format: embroidery SVG outputs at 280×250mm. PDF uses A4.':'Format applies to embroidery SVG and PDF. Colour SVG uses crop dimensions directly.'}</Hint>
            </div>
            <div style={{height:0.5,background:'rgba(0,0,0,0.07)',margin:'2px 0'}}/>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <button onClick={()=>exportSVG(false)} style={{fontSize:12,padding:'7px 10px',cursor:'pointer',borderRadius:8,border:'none',background:C.blue,color:'#fff',fontWeight:500,textAlign:'left'}}>
                ↓ Download — colour SVG
              </button>
              <Hint style={{marginTop:0}}>Full colour vector, sized to page format. Uses crop if set.</Hint>
              <button onClick={exportPatternPDF} style={{fontSize:12,padding:'7px 10px',cursor:'pointer',borderRadius:8,border:'none',background:C.blue,color:'#fff',fontWeight:500,textAlign:'left'}}>
                ↓ Print — aida pattern
              </button>
              <Hint style={{marginTop:0}}>A4 landscape PDF at exact physical size. Print at 100% on aida cloth. Includes stitch-count grid.</Hint>
              <button onClick={exportPDF} style={{fontSize:12,padding:'7px 10px',cursor:'pointer',borderRadius:8,border:'none',background:C.blue,color:'#fff',fontWeight:500,textAlign:'left'}}>
                ↓ Print — instructions
              </button>
              <Hint style={{marginTop:0}}>Pitch diagram + DMC thread colours + steps + player roster.</Hint>
            </div>
          </div>
        </Collapsible>

        {/* 6. Board library (Firebase) */}
        <Collapsible label="Board library" defaultOpen={false}>
          <input ref={importInputRef} type="file" accept=".json" onChange={importBoard} style={{display:'none'}}/>

          {/* Auth state */}
          {!fbUser&&(
            <div>
              <div style={{fontSize:11,color:C.textMuted,marginBottom:8,lineHeight:1.5}}>Sign in to save your work. Your current board is still editable.</div>
              <button onClick={signInWithGoogle} style={{width:'100%',fontSize:12,padding:'8px',cursor:'pointer',borderRadius:8,border:'none',background:'#1A1A1A',color:'#fff',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <span style={{fontSize:16}}>G</span> Sign in with Google
              </button>
            </div>
          )}

          {fbUser&&(<>

            {/* Save current board */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:5}}>Save current board</div>
              <div style={{display:'flex',gap:5}}>
                <input value={newBoardName} onChange={function(e){setNewBoardName(e.target.value);}}
                  placeholder="Board name…"
                  onKeyDown={function(e){if(e.key==='Enter')saveNewBoard();}}
                  style={{flex:1,fontSize:11,padding:'5px 8px',height:28,border:'0.5px solid '+C.inputBorder,borderRadius:6,background:'#fff',color:C.text,outline:'none'}}/>
                <button onClick={saveNewBoard} disabled={libSaving} style={{fontSize:11,padding:'5px 12px',height:28,cursor:libSaving?'default':'pointer',borderRadius:6,border:'none',background:C.blue,color:'#fff',fontWeight:600,flexShrink:0}}>
                  {libSaving?'…':'Save'}
                </button>
              </div>
              {libMsg&&<div style={{fontSize:11,color:libMsg.startsWith('Save failed')||libMsg.startsWith('Load failed')||libMsg.startsWith('Update failed')?C.red:C.green,marginTop:5}}>{libMsg}</div>}
            </div>

            <div style={{height:0.5,background:'rgba(0,0,0,0.07)',margin:'4px 0 8px'}}/>

            {/* Board list */}
            <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:6}}>Saved boards</div>
            {boards.length===0&&<Hint>No boards saved yet. Save one above.</Hint>}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {boards.map(function(b){
                const dateStr=b.updatedAt&&b.updatedAt.toDate?b.updatedAt.toDate().toLocaleDateString('sv-SE'):'';
                return (
                  <div key={b.id} style={{borderRadius:8,border:'0.5px solid '+C.cardBorder,overflow:'hidden',background:'#fff'}}>
                    {b.thumbnail&&<img src={b.thumbnail} alt="" style={{width:'100%',height:60,objectFit:'cover',display:'block'}}/>}
                    <div style={{padding:'6px 8px'}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                      <div style={{fontSize:10,color:C.textMuted,marginBottom:5}}>{dateStr}</div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        <button onClick={function(){loadBoard(b.id);}} style={{fontSize:10,padding:'3px 8px',cursor:'pointer',borderRadius:5,border:'1px solid '+C.blueBorder,background:C.activeBg,color:C.activeText,fontWeight:600}}>Load</button>
                        <button onClick={function(){updateBoard(b.id);}} style={{fontSize:10,padding:'3px 8px',cursor:'pointer',borderRadius:5,border:'0.5px solid '+C.inputBorder,background:'transparent',color:C.textMid}}>Update</button>
                        <button onClick={function(){exportBoardFromLib(b.id);}} style={{fontSize:10,padding:'3px 8px',cursor:'pointer',borderRadius:5,border:'0.5px solid '+C.inputBorder,background:'transparent',color:C.textMid}}>↓ JSON</button>
                        <button onClick={function(){deleteBoard(b.id);}} style={{fontSize:10,padding:'3px 8px',cursor:'pointer',borderRadius:5,border:'0.5px solid '+C.inputBorder,background:'transparent',color:C.red}}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{height:0.5,background:'rgba(0,0,0,0.07)',margin:'10px 0 8px'}}/>
            <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:4}}>Import from file</div>
            <Hint>Load a previously exported .json board file.</Hint>
            <button onClick={function(){importInputRef.current.click();}} style={{fontSize:12,padding:'6px 14px',height:30,cursor:'pointer',borderRadius:8,border:'1px solid '+C.inputBorder,background:'transparent',color:C.textMid,fontWeight:500,marginTop:6}}>Import board ↑</button>
          </>)}
        </Collapsible>

      </div>{/* end sidebar */}

      {/* ═══ RIGHT COLUMN — CANVAS + STEPS ═══ */}
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:8}}>

        {/* Canvas */}
        <div style={{position:'relative',borderRadius:14,overflow:'hidden',boxShadow:'0 3px 16px rgba(0,0,0,0.13)'}}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{display:'block',width:'100%',touchAction:'none',cursor:st.mode==='crop'?'crosshair':st.mode==='move'?cursorStyle:'crosshair'}}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave}/>
          <div style={{position:'absolute',bottom:10,left:10,display:'flex',gap:5,alignItems:'center'}}>
            <button onClick={()=>zoomStep(1.25,W/2,H/2)} style={{width:28,height:28,cursor:'pointer',borderRadius:7,border:'none',background:'rgba(0,0,0,0.45)',color:'#fff',fontSize:16,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            <button onClick={()=>zoomStep(0.8,W/2,H/2)}  style={{width:28,height:28,cursor:'pointer',borderRadius:7,border:'none',background:'rgba(0,0,0,0.45)',color:'#fff',fontSize:16,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <button onClick={resetZoom} style={{height:28,padding:'0 8px',cursor:'pointer',borderRadius:7,border:'none',background:'rgba(0,0,0,0.45)',color:'#fff',fontSize:11}}>Reset</button>
          </div>
          <div style={{position:'absolute',bottom:13,right:10,fontSize:10,color:'rgba(255,255,255,0.5)',pointerEvents:'none'}}>Scroll to zoom · Middle-drag to pan</div>
        </div>

        {/* Moves panel */}
        <Card style={{marginBottom:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>Moves</div>
              <div style={{fontSize:11,color:C.textMuted}}>Build the sequence of the moment</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}>
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <span style={{fontSize:10,color:C.textMuted}}>Colour</span>
                <input type="color" defaultValue={st.phaseColor} onChange={e=>{S.current.phaseColor=e.target.value;redraw();}}
                  style={{width:28,height:24,padding:2,border:`0.5px solid ${C.inputBorder}`,borderRadius:4,cursor:'pointer'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <span style={{fontSize:10,color:C.textMuted}}>Size</span>
                {['xs','s','m','l'].map(sz=>(
                  <button key={sz} onClick={()=>{S.current.markerSize=sz;redraw();}}
                    style={{fontSize:10,width:22,height:22,cursor:'pointer',borderRadius:5,border:(st.markerSize||'m')===sz?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:(st.markerSize||'m')===sz?C.activeBg:'transparent',color:(st.markerSize||'m')===sz?C.activeText:C.textMuted,fontWeight:500,padding:0}}>
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
              <ActionBtn onClick={()=>{addPhase();setMode('phase');}}>+ Add move</ActionBtn>
            </div>
          </div>

          {!st.phases.length&&(
            <div style={{padding:'8px 10px',background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8}}>
              <div style={{fontSize:11,color:'#92400E',fontWeight:500,marginBottom:2}}>No moves yet</div>
              <div style={{fontSize:11,color:'#B45309'}}>Click <b>+ Add move</b> to create one, then click on the pitch to place markers.</div>
            </div>
          )}

          {st.phases.map((p,i)=>{
            const isAct=st.activePh===i&&st.mode==='phase';
            const isSelected=st.activePh===i;
            return <div key={i} style={{marginBottom:6,padding:'8px 10px',borderRadius:8,background:isAct?'#EFF6FF':isSelected?'#F7F7F4':'transparent',border:isAct?`1px solid ${C.blueBorder}`:isSelected?`1px solid ${C.cardBorder}`:'1px solid transparent'}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:isSelected?6:0}}>
                <div style={{width:30,height:30,borderRadius:6,background:isAct?C.blue:isSelected?st.phaseColor:'#E0E0DB',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontSize:14,fontWeight:700,color:'#fff',fontFamily:'sans-serif'}}>{phaseLabel(p.label)}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:isAct?C.activeText:isSelected?C.text:C.textMuted}}>
                    Move {phaseLabel(p.label)}
                    {isAct&&<span style={{fontWeight:400,color:C.activeText}}> — click pitch to place</span>}
                  </div>
                  <div style={{fontSize:10,color:C.textMuted}}>{(p.markers||[]).length} marker{(p.markers||[]).length!==1?'s':''} placed</div>
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  {!isAct&&<GhostBtn onClick={()=>{setActivePh(i);setMode('phase');}}>Place ①</GhostBtn>}
                  {isAct&&<GhostBtn active={true} onClick={()=>setMode('move')}>Done</GhostBtn>}
                  <GhostBtn onClick={()=>deletePhase(i)}>✕</GhostBtn>
                </div>
              </div>
              {isSelected&&(
                <div>
                  <input defaultValue={p.note||''} placeholder="Add a note for this step…"
                    onChange={e=>updatePhaseNote(i,e.target.value)}
                    style={{width:'100%',fontSize:11,padding:'4px 8px',border:`0.5px solid ${C.inputBorder}`,borderRadius:6,background:'#fff',color:C.text,outline:'none',boxSizing:'border-box'}}/>
                  {(p.markers||[]).length>0&&(
                    <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:5}}>
                      {(p.markers||[]).map((_,mi)=>{
                        const isSel=st.selectedPhaseMarker&&st.selectedPhaseMarker.phaseIdx===i&&st.selectedPhaseMarker.markerIdx===mi;
                        return <button key={mi} onClick={()=>{S.current.selectedPhaseMarker={phaseIdx:i,markerIdx:mi};redraw();}}
                          style={{fontSize:11,width:24,height:24,cursor:'pointer',borderRadius:5,border:isSel?`1.5px solid ${C.activeBorder}`:`0.5px solid ${C.inputBorder}`,background:isSel?C.activeBg:st.phaseColor,color:isSel?C.activeText:'#fff',fontWeight:600}}>
                          {phaseLabel(p.label)}
                        </button>;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>;
          })}
        </Card>

      </div>{/* end right column */}

    </div>
  );
}

const root=ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TacticsBoard));

