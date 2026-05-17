// app-utils.js -- pure utility functions and constants
// Nutmeg&Needle Game Tracker -- edit this file, not index.html
// These have no React dependency and are used by app-core.js, app-export.js, and app-ui.js.

// app-core.js — constants, canvas draw functions, TacticsBoard component body
// Nutmeg & Needle Game Tracker — edit this file, not index.html

const {useState,useRef,useEffect}=React;

// ─── CANVAS DIMENSIONS ────────────────────────────────────────────────────────
const W=680,H=440;

// ─── SIZE LOOKUP TABLES ───────────────────────────────────────────────────────
const PSIZES={xs:7,s:10,m:14,l:19};
const MSIZES={xs:5,s:7,m:10,l:14};
const AHEAD={s:5,m:7,l:9,none:0};

// ─── CSS DESIGN TOKENS ────────────────────────────────────────────────────────
const C={
  bg:'#F0E6D3',card:'#FFFFFF',cardBorder:'rgba(0,0,0,0.09)',
  text:'#1A1A1A',textMid:'#666666',textMuted:'#999',
  blue:'#CC3300',blueLight:'#FFF5F2',blueBorder:'#F5C0B0',
  red:'#CC3300',redLight:'#FFF5F2',redBorder:'#F5C0B0',
  green:'#4A6741',
  separatorBg:'rgba(0,0,0,0.07)',
  inputBg:'#FAFAF8',inputBorder:'rgba(0,0,0,0.12)',
  activeBg:'#FFF5F2',activeBorder:'#CC3300',activeText:'#CC3300',
};

// ─── STEP LABEL (1→A, 2→B, 27→AA …) ─────────────────────────────────────────
function phaseLabel(n){
  let s='',i=n;
  while(i>0){s=String.fromCharCode(64+(i-1)%26+1)+s;i=Math.floor((i-1)/26);}
  return s;
}

// ─── INITIAL PLAYER POSITIONS ─────────────────────────────────────────────────
function mkPlayers(){
  const ps=[];
  const fA=[[0.14,[0.5]],[0.25,[0.2,0.42,0.65,0.82]],[0.38,[0.3,0.7]],[0.52,[0.25,0.5,0.75]],[0.64,[0.5]]];
  let n=1;
  fA.forEach(([xf,ya])=>ya.forEach(yf=>{
    const num=n++;
    ps.push({id:`A${num}`,x:xf*W,y:yf*H,team:'A',num,name:'',ghost:false,hidden:false});
  }));
  n=1;
  const fB=[[0.86,[0.5]],[0.75,[0.2,0.42,0.65,0.82]],[0.62,[0.3,0.7]],[0.48,[0.25,0.5,0.75]],[0.36,[0.5]]];
  fB.forEach(([xf,ya])=>ya.forEach(yf=>{
    const num=n++;
    ps.push({id:`B${num}`,x:xf*W,y:yf*H,team:'B',num,name:'',ghost:false,hidden:false});
  }));
  return ps;
}

// ─── GEOMETRY HELPERS ─────────────────────────────────────────────────────────
function distToSeg(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
  if(!l)return Math.hypot(p.x-a.x,p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function distToArrow(pos,a){
  let d=Infinity;
  for(let i=0;i<a.path.length-1;i++)d=Math.min(d,distToSeg(pos,a.path[i],a.path[i+1]));
  if(a.shape==='curve'&&a.cp){
    const s=a.path[0],e=a.path[a.path.length-1];let prev=s;
    for(let i=1;i<=20;i++){const t=i/20,cur={x:(1-t)*(1-t)*s.x+2*(1-t)*t*a.cp.x+t*t*e.x,y:(1-t)*(1-t)*s.y+2*(1-t)*t*a.cp.y+t*t*e.y};d=Math.min(d,distToSeg(pos,prev,cur));prev=cur;}
  }
  return d;
}

// ─── CANVAS DRAWING PRIMITIVES ────────────────────────────────────────────────
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function drawSquareMarker(ctx,x,y,half,fill,stroke,lw){
  const r=3,x0=x-half,y0=y-half,w=half*2;
  ctx.beginPath();
  ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.quadraticCurveTo(x0+w,y0,x0+w,y0+r);
  ctx.lineTo(x0+w,y0+w-r);ctx.quadraticCurveTo(x0+w,y0+w,x0+w-r,y0+w);
  ctx.lineTo(x0+r,y0+w);ctx.quadraticCurveTo(x0,y0+w,x0,y0+w-r);
  ctx.lineTo(x0,y0+r);ctx.quadraticCurveTo(x0,y0,x0+r,y0);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1.5;ctx.stroke();}
}
function drawArrowHead(ctx,from,to,col,hs){
  if(!from||!to)return;
  const ang=Math.atan2(to.y-from.y,to.x-from.x);
  const b1={x:to.x-Math.cos(ang-0.5)*hs*1.1,y:to.y-Math.sin(ang-0.5)*hs*1.1};
  const b2={x:to.x-Math.cos(ang+0.5)*hs*1.1,y:to.y-Math.sin(ang+0.5)*hs*1.1};
  ctx.save();ctx.setLineDash([]);ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(b1.x,b1.y);ctx.lineTo(to.x,to.y);ctx.lineTo(b2.x,b2.y);
  ctx.stroke();ctx.restore();
}
function drawWavyLine(ctx,pts,col){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.setLineDash([]);
  if(pts.length<2){ctx.restore();return;}
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++){const mx=(pts[i].x+pts[i-1].x)/2,my=(pts[i].y+pts[i-1].y)/2;ctx.quadraticCurveTo(pts[i-1].x,pts[i-1].y,mx,my);}
  ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
  ctx.stroke();ctx.restore();
}

// ─── PITCH SYMBOL SIZES ───────────────────────────────────────────────────────
const SSIZES={xs:8,s:11,m:15,l:20};

// ─── DRAW PITCH SYMBOL — CANVAS ───────────────────────────────────────────────
// Thematic, stroke-only icons sized by xs/s/m/l. All work on the green pitch.
var SYM_PATHS={
  ball:{vb:512,d:"M437.02,74.981C388.667,26.629,324.38,0,256,0S123.333,26.629,74.98,74.981C26.628,123.333,0,187.62,0,256 c0,68.381,26.628,132.668,74.98,181.02C123.332,485.371,187.62,512,256,512s132.667-26.629,181.02-74.98 C485.371,388.668,512,324.381,512,256C512,187.62,485.372,123.333,437.02,74.981z M271,86.909l60.47-43.935 c45.225,16.071,83.861,46.153,110.667,85.005l-21.889,67.366l-77.143,25.066L271,168.027V86.909z M180.529,42.975L241,86.909 v81.12l-72.095,52.377L91.757,195.34l-21.891-67.365C96.671,89.125,135.306,59.045,180.529,42.975z M81.39,399.324 c-30.921-37.602-49.959-85.326-51.311-137.377l52.408-38.076l77.143,25.065l27.541,84.765l-47.678,65.623H81.39z M331.302,469.084 C307.736,477.438,282.393,482,256,482c-26.392,0-51.735-4.562-75.3-12.915l-16.938-52.128l47.677-65.621l89.123-0.004 l47.679,65.623L331.302,469.084z M430.612,399.322H372.51l-47.678-65.623l27.541-84.756l77.145-25.066l52.402,38.074 C480.569,313.999,461.531,361.721,430.612,399.322z"},
  shot:{vb:"-18 132 389 232",d:"M138.508 330.41h-41.9c-8.284 0-15 6.716-15 15s6.716 15 15 15h56.245c-4.383-7.551-8.307-15.388-11.739-23.502-.911-2.154-1.77-4.323-2.606-6.498z M15 270.41c-8.284 0-15 6.716-15 15s6.716 15 15 15h114.517c-2.153-9.849-3.59-19.86-4.294-30z M39.323 210.41c-8.284 0-15 6.716-15 15s6.716 15 15 15h85.934c.73-10.141 2.196-20.152 4.378-30z M153.175 150.41h-56.568c-8.284 0-15 6.716-15 15s6.716 15 15 15h42.108c.771-1.991 1.563-3.977 2.398-5.95 3.516-8.311 7.549-16.33 12.062-24.05z M255.0,150.0 C309.1,150.0 353.0,193.9 353.0,248.0 C353.0,302.1 309.1,346.0 255.0,346.0 C200.9,346.0 157.0,302.1 157.0,248.0 C157.0,193.9 200.9,150.0 255.0,150.0 Z M255.0,178.0 C216.3,178.0 185.0,209.3 185.0,248.0 C185.0,286.7 216.3,318.0 255.0,318.0 C293.7,318.0 325.0,286.7 325.0,248.0 C325.0,209.3 293.7,178.0 255.0,178.0 Z"},
  pass:{vb:512,d:"m503.986 426.518c-.015-.426-.06-.849-.128-1.269-1.46-14.929-5.699-30.891-12.746-45.629-.072-.151-.148-.301-.229-.448l-38.725-71.503c-.01-.019-.017-.039-.027-.058-.021-.04-.046-.075-.067-.115l-86.669-160.03c-.149-.276-.312-.544-.485-.805-13.597-20.289-40.943-19.434-65.068-18.681-4.82.151-9.392.297-13.716.273-13.529-.068-26.043-1.174-37.511-3.276-.306-.071-.614-.127-.926-.169-56.001-10.579-86.694-45.233-87.418-100.135-.193-14.196-9.445-23.636-24.134-24.637-4.784-.332-11.463 1.4-27.907 16.167-10.533 9.457-22.894 22.391-34.81 36.419-14.212 16.732-48.618 59.872-61.137 99.004-12.258 38.313 1.643 56.461 15.464 64.94l15.654 9.6-19.122 31.188c-2.887 4.708-1.41 10.865 3.298 13.752l48.075 29.481c1.586.973 3.397 1.475 5.227 1.475.779 0 1.562-.091 2.332-.276 2.579-.618 4.807-2.236 6.193-4.497l19.12-31.184 22.608 13.865-19.122 31.187c-2.887 4.708-1.41 10.865 3.298 13.752l48.075 29.481c1.586.973 3.397 1.475 5.227 1.475.779 0 1.561-.091 2.332-.276 2.579-.618 4.807-2.236 6.193-4.497l19.12-31.184 101.78 62.419-19.124 31.191c-2.886 4.707-1.411 10.863 3.296 13.75l48.046 29.481c1.586.974 3.398 1.477 5.229 1.477.778 0 1.561-.091 2.331-.275 2.579-.618 4.808-2.236 6.194-4.497l19.13-31.201 22.628 13.877-19.124 31.191c-1.386 2.261-1.817 4.98-1.199 7.559.619 2.579 2.237 4.807 4.498 6.193l48.047 29.452c1.631.999 3.435 1.476 5.217 1.476 3.362 0 6.646-1.696 8.533-4.772l19.13-31.18 5.187 3.181c6.908 4.236 12.945 5.725 18.019 5.725 8.333 0 14.07-4.016 16.797-6.474 10.702-9.643 15.078-29.552 13.116-51.963zm-217.955-278.265c4.718.017 9.652-.134 14.434-.283 9.141-.285 18.423-.573 26.507.278l-161.953 70.184c-.047.021-.095.04-.142.062l-56.094 24.309-35.917-22.026 174.672-75.677c11.947 2.028 24.783 3.085 38.488 3.154.001-.001.003-.001.005-.001zm-207.251-70.653c26.453-33.307 50.497-54.466 57.146-57.504 4.091.499 4.307 2 4.346 4.845.391 29.61 8.669 55.118 24.14 74.997l-133.012 57.633c7.072-21.945 23.673-50.12 47.38-79.971zm-51.134 103.394 151.518-65.652c.452.385.899.774 1.358 1.152 10.272 8.46 22.222 15.247 35.782 20.34l-164.266 71.169-13.834-8.484c-4.407-2.703-9.842-7.471-10.558-18.525zm49.935 97.315-31.025-19.025 13.894-22.661 31.024 19.026zm87.732 53.803-31.025-19.026 13.894-22.661 31.024 19.026zm166.874 102.358-31-19.021 13.898-22.667 31.004 19.014zm87.732 53.779-30.999-19.002 13.895-22.664 31.003 19.01zm57.565-24.627c-.956.86-3.492 3.145-10.974-1.443l-56.493-34.639-211.753-129.861c-.027-.017-.051-.037-.078-.053s-.055-.029-.082-.045l-47.942-29.401c-.018-.011-.033-.024-.051-.035s-.036-.019-.053-.029l-20.45-12.541 38.662-16.755 68.129 41.81c1.632 1.001 3.437 1.478 5.221 1.478 3.362 0 6.645-1.695 8.533-4.771 2.889-4.707 1.414-10.865-3.293-13.753l-56.179-34.476 158.892-68.858 25.72 47.491-43.74 22.723c-4.9 2.546-6.809 8.583-4.264 13.484 1.781 3.428 5.268 5.392 8.883 5.392 1.552 0 3.128-.363 4.602-1.128l44.045-22.882 18.891 34.882-31.623 16.429c-4.9 2.546-6.809 8.583-4.264 13.484 1.781 3.428 5.269 5.392 8.883 5.392 1.553 0 3.128-.363 4.602-1.128l31.928-16.588 16.373 30.231-16.416 8.519c-4.901 2.544-6.813 8.58-4.27 13.482 1.78 3.43 5.27 5.395 8.885 5.395 1.551 0 3.125-.362 4.598-1.126l16.729-8.682 34.039 62.85c2.843 5.979 5.082 12.059 6.79 18.047l-156.544-95.993c-4.709-2.888-10.866-1.411-13.752 3.297-2.888 4.708-1.411 10.865 3.297 13.752l171.337 105.064c.673 14.94-2.118 26.75-6.818 30.985z"},
  corner:{vb:512,d:"m496 170c8.284 0 15-6.716 15-15v-140c0-8.284-6.716-15-15-15h-240c-8.284 0-15 6.716-15 15v313.973l-89.328 59.552c-.001.001-.002.002-.004.003l-143.988 95.992c-5.5 3.666-7.951 10.501-6.036 16.827 1.916 6.326 7.746 10.653 14.356 10.653h480c6.61 0 12.44-4.327 14.356-10.653 1.915-6.326-.536-13.161-6.036-16.827l-143.988-95.992c-.001-.001-.002-.002-.004-.003l-89.328-59.552v-158.973zm-225-140h210v110h-210zm-30 335.027v11.973c0 8.284 6.716 15 15 15s15-6.716 15-15v-11.973l55.575 37.05c-19.661 12.805-44.47 19.923-70.575 19.923s-50.914-7.118-70.575-19.923zm-175.458 116.973 93.262-62.175c25.969 20.561 60.701 32.175 97.196 32.175s71.227-11.614 97.196-32.175l93.262 62.175z"},
  foul:{vb:512,d:"m475.313 110.159h-164.76l-13.846-58.75c-2.837-11.923-13.461-19.904-25.192-19.904-1.971 0-3.99.192-5.962.673l-234.807 55.432c-13.894 3.269-22.5 17.212-19.231 31.106l73.173 310.048c2.789 11.923 13.462 19.952 25.192 19.952 1.971 0 3.942-.24 5.962-.673l92.356-21.827v28.414c0 14.231 11.587 25.865 25.865 25.865h241.25c14.279 0 25.865-11.635 25.865-25.865v-318.606c0-14.231-11.586-25.865-25.865-25.865zm16.25 344.471c0 8.942-7.26 16.25-16.25 16.25h-241.25c-8.99 0-16.25-7.308-16.25-16.25v-318.606c0-8.942 7.26-16.25 16.25-16.25h241.25c8.99 0 16.25 7.308 16.25 16.25z"},
  linesman:{vb:512,d:"m504.000 95.976h-322.224c-2.776-4.760-7.880-8.000-13.776-8.000h-152.000c-8.824 0.000-16.000 7.176-16.000 16.000v24.008c0.000 8.8247.176 16.000 16.000 16.000h152.000c5.888 0.000 11.000-3.240 13.776-8.000h26.208v280.040c0.000 4.4243.576 8.000 8.000 8.000h288.016c4.424 0.000 8.000-3.576 8.000-8.000v-288.040-24.008c0.000-4.424-3.576-8.000-8.000-8.000zm-8.000 60.752-20.744-20.744h20.744zm-88.016 199.976-36.688-36.688 36.688-36.688 36.680 36.688zm-96.000 0.000-36.680-36.688 36.680-36.688 36.688 36.688zm0.000-169.376 36.688 36.688-36.688 36.688-36.680-36.688zm96.000 0.000 36.680 36.688-36.680 36.688-36.688-36.688zm47.992 25.376-36.688-36.688 36.688-36.688 36.688 36.688zm-95.992 96.000-36.688-36.688 36.688-36.688 36.688 36.688zm0.000-96.000-36.688-36.688 36.688-36.688 36.688 36.688zm-95.992 22.624 36.688 36.688-36.688 36.688-36.688-36.688zm95.992 96.000 36.688 36.688-36.688 36.688-36.688-36.688zm95.992-22.624-36.688-36.688 36.688-36.688 36.688 36.688zm11.312-84.688 28.712-28.712v57.424zm-59.304-59.312-28.720-28.720h57.432zm-96.000 0.000-28.712-28.720h57.432zm-11.304 11.312-36.688 36.688-36.688-36.688 36.688-36.688zm-48.000 48.000-28.696 28.696v-57.392zm-28.696 67.304 28.696 28.696-28.696 28.696zm40.008 40.008 36.688 36.688-36.688 36.688-36.688-36.688zm47.992 48.000 28.696 28.696h-57.384zm96.000 0.000 28.688 28.696h-57.384zm11.304-11.312 36.688-36.688 36.688 36.688-36.688 36.688zm48.000-48.000 28.712-28.712v57.424zm-299.312-192.032h-151.976v-24.008h152.000zm16.024-16.008h312.000v8.008h-280.016-31.984zm60.712 24.008-20.728 20.728v-20.728zm-20.728 251.336 20.704 20.704h-20.704zm251.296 20.704 20.720-20.720v20.720z"},
  referee:{vb:512.001,d:"m497.001 117.939h-291.801c-62.269 0-115.241 40.782-133.025 96.792-7.124-4.206-15.419-6.631-24.274-6.631-26.413 0-47.901 21.488-47.901 47.901s21.488 47.901 47.901 47.901c8.812 0 17.07-2.402 24.17-6.571 6.539 20.94 18.065 40.137 33.998 56.124 26.096 26.186 60.827 40.608 97.795 40.608 74.148 0 134.831-58.759 137.937-132.157l27.417-30.384h127.784c8.284 0 15-6.716 15-15v-83.584c-.001-8.283-6.716-14.999-15.001-14.999zm-449.1 155.963c-9.871 0-17.901-8.03-17.901-17.901s8.03-17.901 17.901-17.901 17.901 8.03 17.901 17.901-8.031 17.901-17.901 17.901zm434.1-72.38h-119.453c-4.245 0-8.292 1.799-11.137 4.951l-35.623 39.478c-2.486 2.756-3.863 6.336-3.863 10.049 0 59.586-48.477 108.062-108.062 108.062-28.936 0-56.119-11.288-76.545-31.784-20.424-20.495-31.617-47.721-31.517-76.661.205-59.374 49.281-107.679 109.397-107.679h276.802v53.584z M137.25 256.001c0 36.731 29.883 66.614 66.614 66.614s66.614-29.883 66.614-66.614-29.883-66.614-66.614-66.614-66.614 29.883-66.614 66.614zm103.228 0c0 20.189-16.425 36.614-36.614 36.614s-36.614-16.425-36.614-36.614 16.425-36.614 36.614-36.614 36.614 16.425 36.614 36.614z"},
  goal:{vb:512,d:"m480.240 110.000h-448.480c-4.400 0.000-8.000 3.600-8.000 8.000v276.000c0.000 4.4003.600 8.000 8.000 8.000h32.640c4.400 0.000 8.000-3.600 8.000-8.000v-18.000h367.200v18.000c0.000 4.4003.600 8.000 8.000 8.000h32.640c4.400 0.000 8.000-3.600 8.000-8.000v-276.000c0.000-4.400-3.600-8.000-8.000-8.000zm-367.520 250.000h-40.320v-24.000h40.320zm0.000-40.000h-40.320v-32.000h40.320zm0.000-48.000h-40.320v-24.000h40.320zm0.000-40.000h-40.320v-24.000h40.320zm-40.320-40.000v-27.280l30.960 27.280zm53.680-1.360-40.560-35.680h74.080c0.000 0.3200.0800.7200.2401.040l14.400 36.000h-46.960c-0.400-0.480-0.720-0.960-1.200-1.360zm50.640 17.360v24.000h-48.000v-24.000zm-0.080-53.040h71.360l0.640 37.040h-57.120zm0.080 205.040h-48.000v-24.000h48.000zm0.000-40.000h-48.000v-32.000h48.000zm-48.000-48.000v-24.000h48.000v24.000zm120.000 88.000h-56.000v-24.000h56.000zm0.000-40.000h-56.000v-32.000h56.000zm0.000-48.000h-56.000v-24.000h56.000zm0.000-40.000h-56.000v-24.000h56.000zm70.560 128.000h-54.560v-24.000h54.560zm0.000-40.000h-54.560v-32.000h54.560zm0.000-48.000h-54.560v-24.000h54.560zm0.000-40.000h-54.560v-24.000h54.560zm-54.640-40.000-0.640-37.040h71.360l-14.880 37.040zm118.640 168.000h-48.000v-24.000h48.000zm0.000-40.000h-48.000v-32.000h48.000zm0.000-48.000h-48.000v-24.000h48.000zm0.000-40.000h-48.000v-24.000h48.000zm1.440-40.000h-46.960l14.400-36.000c0.160-0.3200.240-0.7200.240-1.040h74.080l-40.560 35.680c-0.4800.400-0.8000.880-1.2001.360zm54.880 168.000h-40.320v-24.000h40.320zm0.000-40.000h-40.320v-32.000h40.320zm0.000-48.000h-40.320v-24.000h40.320zm0.000-40.000h-40.320v-24.000h40.320zm0.000-40.000h-30.960l30.960-27.280zm32.640 194.000h-16.640v-239.040c0.000-4.400-3.600-8.000-8.000-8.000h-383.200c-4.400 0.000-8.000 3.600-8.000 8.000v239.040h-16.640v-260.000h432.480z"},
};
// Returns white or black depending on badge fill luminance
function symContrastCol(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  var lum=(0.299*r+0.587*g+0.114*b)/255;
  return lum>0.55?'#1A1A1A':'#FFFFFF';
}

function drawSymbolCanvas(ctx,x,y,r,type,col){
  var sym=SYM_PATHS[type];
  if(!sym){return;}
  // Badge: rounded square background
  var pad=Math.round(r*0.28);
  var bSize=r*2+pad*2;
  var bx=x-r-pad,by=y-r-pad,br=Math.round(bSize*0.22);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx+br,by);
  ctx.lineTo(bx+bSize-br,by);
  ctx.quadraticCurveTo(bx+bSize,by,bx+bSize,by+br);
  ctx.lineTo(bx+bSize,by+bSize-br);
  ctx.quadraticCurveTo(bx+bSize,by+bSize,bx+bSize-br,by+bSize);
  ctx.lineTo(bx+br,by+bSize);
  ctx.quadraticCurveTo(bx,by+bSize,bx,by+bSize-br);
  ctx.lineTo(bx,by+br);
  ctx.quadraticCurveTo(bx,by,bx+br,by);
  ctx.closePath();
  ctx.fillStyle=col;
  ctx.fill();
  ctx.restore();
  // Icon: draw in contrasting colour, clipped to badge area
  ctx.save();
  var iconCol=symContrastCol(col||'#1A1A1A');
  var vbArr=typeof sym.vb==='string'?sym.vb.split(' ').map(Number):[0,0,sym.vb,sym.vb];
  var vbX=vbArr[0],vbY=vbArr[1],vbW=vbArr[2],vbH=vbArr[3];
  var scale=Math.min((r*2)/vbW,(r*2)/vbH);
  var drawW=vbW*scale,drawH=vbH*scale;
  ctx.translate(x-drawW/2-vbX*scale,y-drawH/2-vbY*scale);
  ctx.scale(scale,scale);
  ctx.fillStyle=iconCol;
  var p=new Path2D(sym.d);
  ctx.fill(p);
  ctx.restore();
}

// ─── DRAW PITCH SYMBOL — SVG string ───────────────────────────────────────────
function symbolSVGPath(x,y,r,type,col){
  var sym=SYM_PATHS[type];
  if(!sym){return '';}
  var pad=Math.round(r*0.28);
  var bSize=r*2+pad*2;
  var bx=(x-r-pad).toFixed(2),by=(y-r-pad).toFixed(2);
  var bs=bSize.toFixed(2),br=(bSize*0.22).toFixed(2);
  var iconCol=(function(hex){
    var rv=parseInt(hex.slice(1,3),16),gv=parseInt(hex.slice(3,5),16),bv=parseInt(hex.slice(5,7),16);
    return (0.299*rv+0.587*gv+0.114*bv)/255>0.55?'#1A1A1A':'#FFFFFF';
  })(col||'#1A1A1A');
  var badge='<rect x="'+bx+'" y="'+by+'" width="'+bs+'" height="'+bs+'" rx="'+br+'" fill="'+col+'"/>';
  var vbArr=typeof sym.vb==='string'?sym.vb.split(' ').map(Number):[0,0,sym.vb,sym.vb];
  var vbX=vbArr[0],vbY=vbArr[1],vbW=vbArr[2],vbH=vbArr[3];
  var scale=Math.min((r*2)/vbW,(r*2)/vbH);
  var tx=(x-r).toFixed(3),ty=(y-r).toFixed(3),sc=scale.toFixed(6);
  var xf=sym.flip?'translate('+tx+','+ty+') scale(-'+sc+','+sc+') translate(-'+sym.vb+',0)':'translate('+tx+','+ty+') scale('+sc+')';
  return badge+'<g transform="'+xf+'"><path d="'+sym.d+'" fill="'+iconCol+'"/></g>';
}




// ─── LEGEND SIZING HELPERS ────────────────────────────────────────────────────
function getLegendRows(S){
  const st=S.current;
  const hasNames=st.players.some(p=>!p.ghost&&p.name&&p.name.trim());
  if(!hasNames)return null;
  return{
    teamA:st.players.filter(p=>!p.ghost&&p.team==='A'&&p.name&&p.name.trim()),
    teamB:st.players.filter(p=>!p.ghost&&p.team==='B'&&p.name&&p.name.trim()),
  };
}
// Font size from scale; box dims are explicit (w/h) or auto-computed
function legendFontSizes(scale){
  const sc=Math.max(0.5,Math.min(2,scale));
  return{sc,pad:Math.round(8*sc),lineH:Math.round(18*sc),dotS:Math.round(14*sc),headerFs:Math.round(10*sc),nameFs:Math.round(11*sc)};
}
// Auto width: based on scale and column count. Used as default when leg.w is null.
function legendAutoW(rows,scale,cols){
  const{sc}=legendFontSizes(scale);
  const numCols=cols!==undefined?cols:(rows.teamA.length>0&&rows.teamB.length>0?2:1);
  return Math.round(numCols*120*sc+Math.round(8*sc)*2);
}
// Auto height: fits all rows. Used as default when leg.h is null.
function legendAutoH(rows,scale,cols){
  const{sc,pad,lineH}=legendFontSizes(scale);
  const numCols=cols!==undefined?cols:(rows.teamA.length>0&&rows.teamB.length>0?2:1);
  const maxRows=numCols===2?Math.max(rows.teamA.length,rows.teamB.length):rows.teamA.length+rows.teamB.length;
  return pad*2+Math.round(14*sc)+pad/2+maxRows*lineH;
}
function wrapText(ctx,text,maxW){
  const words=text.split(' ');const lines=[];let cur='';
  words.forEach(w=>{const t=cur?cur+' '+w:w;if(ctx.measureText(t).width<=maxW){cur=t;}else{if(cur)lines.push(cur);cur=w;}});
  if(cur)lines.push(cur);return lines.length?lines:[''];
}
// Auto height for step legend given a specific width
function stepLegendAutoH(ph,scale,ctx,boxW){
  const{sc,pad,lineH}=legendFontSizes(scale);
  const br=Math.round(6*sc);
  const noteMaxW=boxW-pad*2-br*2-Math.round(5*sc);
  ctx.font=`${Math.round(11*sc)}px sans-serif`;
  let totalLines=0;
  ph.forEach(p=>{const note=p.note&&p.note.trim()?p.note:'—';totalLines+=wrapText(ctx,note,noteMaxW).length;});
  return pad*2+Math.round(13*sc)+pad/2+totalLines*lineH;
}

// ─── EXPORT UTILITIES (pure — no React dependency) ───────────────────────────
function hexToRgb(hex){
  if(!hex||typeof hex!=='string')return{r:0,g:0,b:0};
  const h=hex.replace('#','');
  if(h.length<6)return{r:0,g:0,b:0};
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return{r:isNaN(r)?0:r,g:isNaN(g)?0:g,b:isNaN(b)?0:b};
}
function textOnBg(hex){const{r,g,b}=hexToRgb(hex);return(r*299+g*587+b*114)/1000>128?'#111':'#fff';}
// ─── N&N BRAND THREAD NAMES ──────────────────────────────────────────────────
// Maps exact palette hex to brand name + DMC. Falls back to nearestDMC for custom colours.
const NN_THREADS=[
  {hex:'#1A1A1A',brand:'Noir',dmc:'310'},
  {hex:'#F0E6D3',brand:'Linen',dmc:'3866'},
  {hex:'#4A6741',brand:'Pitch',dmc:'3362'},
  {hex:'#CC3300',brand:'Coral',dmc:'350'},
  {hex:'#666666',brand:'Ash',dmc:'646'},
  {hex:'#F5F5F5',brand:'White',dmc:'blanc'},
  {hex:'#FFFFFF',brand:'White',dmc:'blanc'},
  {hex:'#000000',brand:'Noir',dmc:'310'},
];
function nnThreadLabel(hex){
  const h=(hex||'').toUpperCase();
  const match=NN_THREADS.find(t=>t.hex.toUpperCase()===h);
  if(match)return match.brand+' — DMC '+match.dmc;
  const dmc=nearestDMC(hex);
  return dmc.name+' — DMC '+dmc.n;
}
function nearestDMC(hex){
  const{r,g,b}=hexToRgb(hex);
  const palette=[
    {n:'blanc',name:'White',hex:'#FFFFFF'},{n:'310',name:'Black',hex:'#000000'},
    {n:'321',name:'Red',hex:'#C0242C'},{n:'666',name:'Bright Red',hex:'#CC3333'},
    {n:'817',name:'Coral Red Vy Lt',hex:'#F08080'},{n:'351',name:'Coral',hex:'#E8604C'},
    {n:'947',name:'Burnt Orange',hex:'#FF6600'},{n:'741',name:'Tangerine Med',hex:'#FF9900'},
    {n:'972',name:'Canary Deep',hex:'#FFB300'},{n:'444',name:'Lemon Dark',hex:'#FFD700'},
    {n:'307',name:'Lemon',hex:'#FFEC6E'},{n:'164',name:'Forest Green Lt',hex:'#8DC78E'},
    {n:'703',name:'Chartreuse',hex:'#7EC47B'},{n:'702',name:'Kelly Green',hex:'#4CAF50'},
    {n:'699',name:'Christmas Green',hex:'#008B00'},{n:'895',name:'Hunter Green Dk',hex:'#1A4020'},
    {n:'890',name:'Pistachio Grn Ul Dk',hex:'#1E5030'},{n:'824',name:'Blue Vy Lt',hex:'#84B4D4'},
    {n:'825',name:'Blue Dk',hex:'#2060A0'},{n:'797',name:'Royal Blue',hex:'#1A4CC0'},
    {n:'820',name:'Royal Blue Vy Dk',hex:'#0D2D80'},{n:'336',name:'Navy Blue',hex:'#0A1F6E'},
    {n:'340',name:'Blue Violet Med',hex:'#8080CC'},{n:'553',name:'Violet',hex:'#805090'},
    {n:'718',name:'Plum',hex:'#8B1A50'},{n:'915',name:'Plum Dark',hex:'#5C0030'},
    {n:'3608',name:'Plum Vy Lt',hex:'#E8A0C0'},{n:'225',name:'Shell Pink Vy Lt',hex:'#FFD8CC'},
    {n:'761',name:'Salmon Lt',hex:'#FFA090'},{n:'760',name:'Salmon',hex:'#EE8070'},
    {n:'3328',name:'Salmon Dark',hex:'#D05050'},{n:'221',name:'Shell Pink Vy Dk',hex:'#A03040'},
    {n:'738',name:'Tan Vy Lt',hex:'#F0D898'},{n:'437',name:'Tan Lt',hex:'#DEB887'},
    {n:'436',name:'Tan',hex:'#C8A064'},{n:'435',name:'Brown Vy Lt',hex:'#A0703C'},
    {n:'434',name:'Brown Lt',hex:'#885030'},{n:'801',name:'Coffee Brown Dk',hex:'#5C3018'},
    {n:'938',name:'Coffee Brown Ul Dk',hex:'#38180A'},{n:'3865',name:'Winter White',hex:'#F8F0E0'},
    {n:'762',name:'Pearl Gray Vy Lt',hex:'#E8E8E8'},{n:'415',name:'Pearl Gray',hex:'#C8C8C8'},
    {n:'318',name:'Steel Gray Lt',hex:'#A0A0A8'},{n:'317',name:'Pewter Gray',hex:'#707078'},
    {n:'413',name:'Pewter Gray Dk',hex:'#484850'},{n:'3799',name:'Pewter Gray Vy Dk',hex:'#282830'},
  ];
  let best=palette[0],bestD=Infinity;
  palette.forEach(c=>{const{r:cr,g:cg,b:cb}=hexToRgb(c.hex);const d=(r-cr)**2+(g-cg)**2+(b-cb)**2;if(d<bestD){bestD=d;best=c;}});
  return best;
}
function svgWrap(text,maxChars){
  const words=text.split(' ');const lines=[];let cur='';
  words.forEach(w=>{if((cur+' '+w).trim().length<=maxChars){cur=(cur+' '+w).trim();}else{if(cur)lines.push(cur);cur=w;}});
  if(cur)lines.push(cur);return lines;
}

// ─── MARKER SIZE HELPER ──────────────────────────────────────────────────────
// Returns the half-size of a phase marker in pixels.
// extra: additional pixels to add (e.g. 5 for selection outline padding)
function markerHalf(st,extra){
  return(MSIZES[st.markerSize||'m']||Math.round(st.pR*1.4))+(extra||0);
}

// ─── RENDERING SIZE HELPERS ───────────────────────────────────────────────────
// Single source of truth for all shared sizing formulas.
// Used by both canvas draw code (app-core.js) and SVG/PDF export (app-export.js).
// Change a formula here and it applies consistently to canvas + SVG + PDF.
function ballRadius(r)       { return Math.max(6,Math.round(r*0.65)); }
function playerNumFS(r)      { return Math.max(9,Math.round(r*1.1)); }
function markerLabelFS(half) { return Math.max(7,Math.round(half*1.3)); }
function legendDotNumFS(dr)  { return Math.max(8,Math.round(dr*1.2)); }
function stepMarkerFS(br)    { return Math.max(5,Math.round(br*0.9)); }

