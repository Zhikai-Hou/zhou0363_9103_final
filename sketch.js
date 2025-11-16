
/* =============================
   COLORS & CONSTANTS
============================= */
const COL_Y=[245,208,40],
      COL_R=[206,41,35],
      COL_B=[44,96,185],
      COL_C=[242,239,230],
      COL_K=[20];

const BAND_RATIO=0.025;
const HEADER_TEXT='SPACE TO SWITCH';
const EPS=0.015;

/* =============================
   GLOBAL STATE
============================= */
let mode='A';
let nextVertical={A:Math.random()<.5, B:Math.random()<.5};

let vertsA=[], horzsA=[], intersectionColors=new Map();
let vertsB=[], horzsB=[], filledCells=new Map();

let animating=false, action='band', animStart=0, animBand=null;
let headerColors=[], headerLastUpdate=0;

/* =============================
   AUDIO
============================= */
let bgm, fft;

function preload(){
  bgm = loadSound("deep-house-instrumental-354596.mp3",
    ()=>console.log,
    ()=>console.log
  );
}

// Cell base brightness & motion
function boostColorByAudio(c, bass, mid){
  let r=red(c), g=green(c), b=blue(c);

  // Flash with bass
  let flash=map(bass,0,255,0,1);
  r = lerp(r,255,flash*1.4);
  g = lerp(g,255,flash*1.4);
  b = lerp(b,255,flash*1.4);

  // Breathe with mid
  let breathe=map(mid,0,255,-30,40);
  r=constrain(r+breathe,0,255);
  g=constrain(g+breathe,0,255);
  b=constrain(b+breathe,0,255);

  return color(r,g,b);
}

/* =============================
   BEAT DETECTION
============================= */
let beatThreshold=180;        // Trigger if bass above this
let beatHoldFrames=20;        // Frames to lock before next beat
let beatDecay=0.96;
let beatCutoff=0;
let beatFrames=0;

function detectBeat(level){
  if(beatFrames>0){
    beatFrames--;
    return false;
  }
  if(level>beatCutoff && level>beatThreshold){
    beatCutoff=level*1.15;
    beatFrames=beatHoldFrames;
    return true;
  }
  beatCutoff*=beatDecay;
  return false;
}

/* =============================
   SETUP
============================= */
function setup(){
  createCanvas(windowWidth,windowHeight);
  frameRate(60); noStroke(); textFont('sans-serif');

  fft = new p5.FFT();

  headerInit();
  headerColorsReset();
  timerNext();
}

function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  headerLayout();
}

/* =============================
   DRAW LOOP
============================= */
function draw(){
  background(255);
  headerDraw();

  const now=millis(), t=bandThickness();

  if(mode==='A'){
    drawBands(vertsA,horzsA,t,color(...COL_Y));
    if(animating && action==='band') bandAnim(animBand,color(...COL_Y));

    // A mode intersections
    for(const [k,col] of intersectionColors){
      const [xs,ys]=k.split('|');
      const x=parseFloat(xs)*width, y=parseFloat(ys)*height;
      fill(col); rectMode(CENTER); rect(x,y,t,t);
    }

  }else{
    cellsDraw();
    drawBands(vertsB,horzsB,t,color(...COL_K));
    if(animating && action==='band') bandAnim(animBand,color(...COL_K));
  }

  if(now-headerLastUpdate>1000) headerColorsReset();

  if(animating && (now-animStart)/1000>=1){
    animating=false;
    finalizeBand(animBand);
    timerNext();
  }
}

/* =============================
   BAND THICKNESS (AUDIO-DRIVEN)
============================= */
function bandThickness(){
  const bass=fft.getEnergy("bass");
  const base=min(width,height)*BAND_RATIO;
  const boost=map(bass,0,255,0.5,3);
  return base*boost;
}

/* =============================
   FLOW CONTROL (TIMERS)
============================= */
function timerNext(){ setTimeout(()=>beginNext(),1000); }

function beginNext(){
  animStart=millis();
  animating=true;

  if(mode==='A'){
    action='band';
    animBand=nextBand('A');
  }
  else{
    const haveCells=(vertsB.length>=2 && horzsB.length>=2);
    action = haveCells ? (action==='band'?'fill':'band') : 'band';

    if(action==='band'){ 
      animBand=nextBand('B'); 
    }else{
      const f=cellPick();
      if(f) cellFinalize(f);
      animating=false;
      timerNext();
      return;
    }
  }
}

/* =============================
   BAND ANIMATION
============================= */
function nextBand(which){
  const margin=.05, vertical=nextVertical[which];
  nextVertical[which]=!nextVertical[which];

  return {
    vertical,
    posRel:random(margin,1-margin),
    direction:random(['forward','backward'])
  };
}

function bandAnim(b,col){
  const t=bandThickness();
  const p=constrain((millis()-animStart)/1000,0,1);

  fill(col);

  if(b.vertical){
    const x=b.posRel*width;
    const len=height*p;
    rectMode(CENTER);
    rect(x, (b.direction==='forward'? len/2 : height-len/2), t, len);
  }
  else{
    const y=b.posRel*height;
    const len=width*p;
    rectMode(CENTER);
    rect((b.direction==='forward'? len/2 : width-len/2), y, len, t);
  }
}

/* =============================
   FINALIZE LINES
============================= */
function finalizeBand(b){
  const pos=b.posRel, vertical=b.vertical;

  if(mode==='A'){
    if(vertical){
      vertsA.push(pos);
      for(const y of horzsA) touchIntersection(pos,y);
      mergeNear(vertsA);
    }else{
      horzsA.push(pos);
      for(const x of vertsA) touchIntersection(x,pos);
      mergeNear(horzsA);
    }
  }
  else{
    if(vertical){
      vertsB.push(pos);
      mergeNear(vertsB);
      splitFilled('v', indexOfLine(vertsB,pos));
    }else{
      horzsB.push(pos);
      mergeNear(horzsB);
      splitFilled('h', indexOfLine(horzsB,pos));
    }
  }
}

/* =====================================================
    CELLS DRAW (WITH BEAT FLASH)
===================================================== */
function cellsDraw(){
  if(vertsB.length<2 || horzsB.length<2) return;
  const E = innerEdges();

  const bass = fft.getEnergy("bass");
  const mid  = fft.getEnergy("mid");

  const beat = detectBeat(bass); // ★ detect beat

  for(const [key,e] of filledCells){
    const [is,js]=key.split('|');
    const i=int(is), j=int(js);

    const x1=E.xR[i], x2=E.xL[i+1];
    const y1=E.yB[j], y2=E.yT[j+1];
    if(x2<=x1 || y2<=y1) continue;

    
    let col=boostColorByAudio(e.color,bass,mid);

  
    if(beat){
      col=color(
        min(red(col)+120,255),
        min(green(col)+120,255),
        min(blue(col)+120,255)
      );
    }

    fill(col);
    rectMode(CORNER);
    rect(x1,y1, x2-x1, y2-y1);
  }
}

/* =============================
   HELPERS (GRID / CELLS)
============================= */
function innerEdges(){
  const t=bandThickness();
  const vx=[...vertsB].sort((a,b)=>a-b);
  const hy=[...horzsB].sort((a,b)=>a-b);

  return {
    vx, hy,
    xL:vx.map(v=>v*width + t/2),
    xR:vx.map(v=>v*width - t/2),
    yT:hy.map(h=>h*height + t/2),
    yB:hy.map(h=>h*height - t/2)
  };
}

function touchIntersection(x,y){
  const k=`${x.toFixed(4)}|${y.toFixed(4)}`;
  if(!intersectionColors.has(k))
    intersectionColors.set(k, pickRGBcream());
}

function mergeNear(arr){
  arr.sort((a,b)=>a-b);
  const out=[];
  let i=0;

  while(i<arr.length){
    let j=i+1, sum=arr[i], count=1;
    while(j<arr.length && Math.abs(arr[j]-arr[i])<EPS){
      sum+=arr[j]; count++; j++;
    }
    out.push(sum/count);
    i=j;
  }

  arr.length=0;
  for(const v of out) arr.push(v);
}

function indexOfLine(arr,pos){
  for(let i=0;i<arr.length;i++)
    if(Math.abs(arr[i]-pos)<1e-4) return i;
  return 0;
}

function splitFilled(ori,k){
  const keys=[...filledCells.keys()];

  if(ori==='v'){
    for(const key of keys){
      const [is,js]=key.split('|');
      const i=int(is), j=int(js);
      if(i===k-1){
        const col=filledCells.get(key).color;
        const right=`${k}|${j}`;
        if(!filledCells.has(right))
          filledCells.set(right,{color:col});
      }
    }
  } else {
    for(const key of keys){
      const [is,js]=key.split('|');
      const i=int(is), j=int(js);
      if(j===k-1){
        const col=filledCells.get(key).color;
        const bot=`${i}|${k}`;
        if(!filledCells.has(bot))
          filledCells.set(bot,{color:col});
      }
    }
  }
}

function cellPick(){
  if(vertsB.length<2 || horzsB.length<2) return null;

  const E=innerEdges();
  const cands=[];

  for(let i=0;i<E.vx.length-1;i++){
    const x1=E.xR[i], x2=E.xL[i+1];
    if(x2-x1<=0) continue;

    for(let j=0;j<E.hy.length-1;j++){
      const y1=E.yB[j], y2=E.yT[j+1];
      if(y2-y1<=0) continue;

      const key=`${i}|${j}`;
      if(!filledCells.has(key))
        cands.push({i,j});
    }
  }

  if(cands.length===0) return null;

  const c=random(cands);
  const col=random([
    color(...COL_Y),
    color(...COL_R),
    color(...COL_B)
  ]);

  return {i:c.i, j:c.j, color:col};
}

function cellFinalize(f){
  if(f)
    filledCells.set(`${f.i}|${f.j}`,{color:f.color});
}

/* =============================
   DRAW BANDS / UTILS
============================= */
function drawBands(verts,horzs,t,col){
  rectMode(CENTER);
  fill(col);

  for(const x of verts)
    rect(x*width,height/2, t,height);

  for(const y of horzs)
    rect(width/2,y*height, width,t);
}

function pickRGBcream(){
  return random([
    color(...COL_R),
    color(...COL_B),
    color(...COL_C)
  ]);
}

/* =============================
   HEADER UI
============================= */
function headerInit(){
  const div=document.createElement('div');
  div.id='headerText';
  div.style.display='flex';
  div.style.justifyContent='center';
  div.style.fontFamily='sans-serif';
  div.style.fontWeight='700';
  div.style.margin='10px 0';
  document.body.prepend(div);
  headerLayout();
}

function headerLayout(){
  const div=document.getElementById('headerText');
  const fs=Math.max(18,Math.min(42,Math.round(window.innerWidth/28)));
  div.style.fontSize=fs+'px';
}

function headerColorsReset(){
  headerColors.length=0;
  for(let i=0;i<HEADER_TEXT.length;i++){
    headerColors.push(
      random([
        color(...COL_Y),
        color(...COL_R),
        color(...COL_B),
        color(0)
      ])
    );
  }
  headerLastUpdate=millis();
}

function headerDraw(){
  const div=document.getElementById('headerText');
  let html='';

  for(let i=0;i<HEADER_TEXT.length;i++){
    const c=headerColors[i];
    const rgb=`rgb(${red(c)},${green(c)},${blue(c)})`;
    html+=`<span style="width:1.2em;text-align:center;color:${rgb}">${HEADER_TEXT[i]}</span>`;
  }

  div.innerHTML=html;
}

/* =============================
   KEYBOARD CONTROL
============================= */
function keyPressed(){

  // 
  if(key==='m' || key==='M'){
    userStartAudio();
    if(!bgm.isPlaying()){ bgm.loop(); }
    else bgm.pause();
  }

  // SPACE：
  if(key===' '){
    animating=false;
    action='band';
    animBand=null;

    if(mode==='A'){
      mode='B';
      vertsB=[]; horzsB=[]; filledCells.clear();
      nextVertical.B=Math.random()<.5;
    }else{
      mode='A';
      vertsA=[]; horzsA=[]; intersectionColors.clear();
      nextVertical.A=Math.random()<.5;
    }

    headerColorsReset();
    timerNext();
  }
}
