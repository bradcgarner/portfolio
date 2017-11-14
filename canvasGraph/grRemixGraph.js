'use strict';

// http://jsfiddle.net/m1erickson/LumMX/
const grRemixChart = {
  canvas: document.getElementById('canvas'),
  ctx: document.getElementById("canvas").getContext("2d"),
  // set starting values
  fps: 40, // frames per second
  pct: 0, // initialize at 0%
  dir: 1, // initialize at 1 (forward)
  //enter all vector information in seg[]
  seg: [
    {
      x1: 0,
      y1: 0,
      cp1x: 5, // for now, enter all possible points, but enter null for unused points (we could change that later if needed, but this is easiest now)
      cp1y: 150,
      cp2x: null,
      cp2y: null,
      x2: 120,
      y2: 160,
      color: 'red',
    },
    {
      x1: 120,
      y1: 160,
      cp1x: null,
      cp1y: null,
      cp2x: null,
      cp2y: null,
      x2: 200,
      y2: 160,
      color: 'transparent',
      h: 50,
      //w: 100,
      fillColor: 'rgba(100,0,0,0.5)', // this is only for shapes;
      strokeColor: 'black',
      selectFillColor: 'rgba(0,0,0,0.5)',
      lineWidth: 3,
      shapeType: 'arc'
    },
    {
      x1: 200, //same as above, cannot reference unless we make this into a function
      y1: 160,
      cp1x: 250,
      cp1y: 160,
      cp2x: null,
      cp2y: null,
      x2: 250,
      y2: 120,
      color: 'green',
    },
    {
      x1: 250,
      y1: 120,
      cp1x: 290,
      cp1y: -40,
      cp2x: 300,
      cp2y: 200,
      x2: 400,
      y2: 150,
      color: 'blue',
    },
    {
      x1: 400,
      y1: 150,
      cp1x: null,
      cp1y: null,
      cp2x: null,
      cp2y: null,
      x2: 500,
      y2: 90,
      color: 'gold',
    },
    {
      x1: 500,
      y1: 90,
      cp1x: 650,
      cp1y: 0,
      cp2x: null,
      cp2y: null,
      x2: 700,
      y2: 150,
      color: 'black',
    },
    {
      x1: 700,
      y1: 150,
      cp1x: 850,
      cp1y: 300,
      cp2x: null,
      cp2y: null,
      x2: 1000,
      y2: 150,
      color: 'orange',
    },
    {
      x1: 1000,
      y1: 150,
      cp1x: 0,
      cp1y: 0,
      cp2x: 800,
      cp2y: 500,
      x2: 700,
      y2: 300,
      color: 'cyan',
    },
    {
      x1: 700,
      y1: 300,
      cp1x: 400,
      cp1y: 1500,
      cp2x: 1100,
      cp2y: 600,
      x2: 500,
      y2: 900,
      color: '#83f',
    }
  ], //end seg
  dot: {
    fillColor: "rgba(255,255,255,0.75)", // this passes from here, to drawDot(), to ctx, finally to the DOM canvas element. We need to pass through a string, which could be a color name, but if we pass through a color (not a string), it won't pass back to the DOM
    strokeColor: "rbga(100,0,0,0.5)",
    lineWidth: 3,
    type: "arc", //drawDot looks for "arc" or else it goes to rect.
    size: 6 // we have to enter this rather than lineWidth * 2, because lineWidth will not have evaluated by the time this evaluates
  },
  reverse: true // true if reverse; false if unidirectional
}

// read which points are entered, and determine the type of each segment. This is not very good data integrity at this point. We could strengthen it.
function populateType() {
  grRemixChart.seg.forEach(function (thisSeg) {
    if (thisSeg.x1 === null || thisSeg.y1 === null || thisSeg.x2 === null || thisSeg.y2 === null) {
      thisSeg.type = null;
    } else if (thisSeg.cp1x !== null && thisSeg.cp1y !== null && thisSeg.cp2x !== null && thisSeg.cp2y !== null) {
      thisSeg.type = 'cubic';
    } else if (thisSeg.cp1x !== null && thisSeg.cp1y !== null) {
      thisSeg.type = 'quadratic';
    } else {
      thisSeg.type = 'line';
    }
  });
}
populateType();

// read the points for each segment, and create an object with points to pass through to getLinePath(), getQuadraticPath() and getCubicPath()
function populateMove() {
  grRemixChart.seg.forEach(function (thisSeg) {
    if (thisSeg.type === 'cubic') {
      thisSeg.move = [{ x: thisSeg.x1, y: thisSeg.y1 }, { x: thisSeg.cp1x, y: thisSeg.cp1y }, { x: thisSeg.cp2x, y: thisSeg.cp2y }, { x: thisSeg.x2, y: thisSeg.y2 }];
    } else if (thisSeg.type === 'quadratic') {
      thisSeg.move = [{ x: thisSeg.x1, y: thisSeg.y1 }, { x: thisSeg.cp1x, y: thisSeg.cp1y }, { x: thisSeg.x2, y: thisSeg.y2 }];
    } else {
      thisSeg.move = [{ x: thisSeg.x1, y: thisSeg.y1 }, { x: thisSeg.x2, y: thisSeg.y2 }];
    }
  });
}
populateMove();

// distance calcs are approx for curves. Assign a distance to each segment, used to calculate percentages, which are used to calculate timing of animation
function calcLineDist(thisSeg) {
  let a = Math.abs(thisSeg.x1 - thisSeg.x2);
  let b = Math.abs(thisSeg.y1 - thisSeg.y2);
  let c = Math.sqrt((a * a) + (b * b));
  return c;
}
function calcQuadraticDist(thisSeg) {
  let a = Math.abs(thisSeg.x1 - thisSeg.cp1x);
  let b = Math.abs(thisSeg.y1 - thisSeg.cp1y);
  let c = Math.sqrt((a * a) + (b * b));
  let m = Math.abs(thisSeg.cp1x - thisSeg.x2);
  let n = Math.abs(thisSeg.cp1y - thisSeg.y2);
  let o = Math.sqrt((m * m) + (n * n));
  let approx = (c + o) / 2;
  return approx;
}
function calcCubicDist(thisSeg) {
  let a = Math.abs(thisSeg.x1 - thisSeg.cp1x);
  let b = Math.abs(thisSeg.y1 - thisSeg.cp1y);
  let c = Math.sqrt((a * a) + (b * b));
  let m = Math.abs(thisSeg.cp1x - thisSeg.cp2x);
  let n = Math.abs(thisSeg.cp1y - thisSeg.cp1y);
  let o = Math.sqrt((m * m) + (n * n));
  let q = Math.abs(thisSeg.cp2x - thisSeg.x2);
  let r = Math.abs(thisSeg.cp2y - thisSeg.y2);
  let s = Math.sqrt((m * m) + (n * n));
  let approx = (c + o + s) / 2;
  return approx;
}
function calcDist(thisSeg) {
  if (thisSeg.type === 'cubic') {
    thisSeg.dist = calcCubicDist(thisSeg);
  } else if (thisSeg.type === 'quadratic') {
    thisSeg.dist = calcQuadraticDist(thisSeg);
  } else {
    thisSeg.dist = calcLineDist(thisSeg);
  }
}
function calcDistAll() {
  grRemixChart.seg.forEach(calcDist);
}
calcDistAll();
/*
(function() {
    grRemixChart.seg.forEach(calcDist);
})(); // self-invoking function (only as example; I prefer to name and invoke most of the time)
*/
// read the distance of each segment, and assign a minimum and maximum percentage for each segment
function populateMaxPct() {
  let totalDist = function () {
    let theDist = 0;
    for (let i = 0; i < grRemixChart.seg.length; i++) {
      theDist += grRemixChart.seg[i].dist;
    }
    return theDist;
  };
  grRemixChart.totalDist = totalDist();
  let maxPct = 0;
  for (let i = 0; i < grRemixChart.seg.length; i++) {
    grRemixChart.seg[i].maxPct = 100 * (grRemixChart.seg[i].dist / grRemixChart.totalDist) + maxPct;
    maxPct = grRemixChart.seg[i].maxPct;
  }
  grRemixChart.seg[grRemixChart.seg.length - 1].maxPct = 100; // set the last to 100 (vs 99.9999...)
}
function populateMinPct() {
  let minPct = 0;
  for (let i = 0; i < grRemixChart.seg.length; i++) {
    grRemixChart.seg[i].minPct = minPct;
    minPct = grRemixChart.seg[i].maxPct;
  }
}
populateMaxPct();
populateMinPct();

function animate() {
  grRemixChart.pct += grRemixChart.dir; // dir initialized at 1, and 1++ while forward, but 1-- while in reverse
  if (grRemixChart.reverse === true) {
    if (grRemixChart.pct < 0) {  // keep percent within 0 and 100
      grRemixChart.pct = 0;
      grRemixChart.dir = 1; // reverse direction when < 0
    };
    if (grRemixChart.pct > 100) { // keep percent within 0 and 100
      grRemixChart.pct = 100;
      grRemixChart.dir = -1; // reverse direction when > 100
    }
  } else if (grRemixChart.pct < 0 || grRemixChart.pct > 100) {
    grRemixChart.pct = 0;
    grRemixChart.dir = 1; // reverse direction when < 0
  }

  draw(grRemixChart.pct); //argument pct = parameter sliderPct; this invocation calls all functions below.

  // set timeout in ms, but as part of the timeout, request another repetition
  setTimeout(function () {
    requestAnimationFrame(animate); // animation repeats over and over in perpetuity
  }, ((1000 / grRemixChart.fps) * (grRemixChart.totalDist / 1000))); // the last number is miliseconds, so the 1000 is a constant to convert fps to ms
}
animate();

// draw the current frame based on sliderPct
// sliderPct will be an integer between 1 and 100
function draw(sliderPct) {
  let ctx = grRemixChart.ctx;
  // redraw path
  ctx.clearRect(0, 0, grRemixChart.canvas.width, grRemixChart.canvas.height);
  ctx.lineWidth = 5;

  for (let i = 0; i < grRemixChart.seg.length; i++) {
    let seg = grRemixChart.seg[i];
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    if (seg.type === 'cubic') {
      ctx.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x2, seg.y2); //draw segment
    } else if (seg.type === 'quadratic') {
      ctx.quadraticCurveTo(seg.cp1x, seg.cp1y, seg.x2, seg.y2); //draw segment
    } else if (seg.type === 'line') {
      ctx.lineTo(seg.x2, seg.y2); //draw segment
    }
    ctx.strokeStyle = seg.color;
    ctx.stroke();
  }

  function pctIsBigEnough(item) { // used for Array.find() below
    return item.maxPct >= sliderPct;
  }

  let thisSeg = grRemixChart.seg.find(pctIsBigEnough); // figure out which line segment are we on based on pct
  let thisSegPctSpan = thisSeg.maxPct - thisSeg.minPct; // how much of the total percentage does this segment span
  let pct = (sliderPct - thisSeg.minPct) / thisSegPctSpan; // what percent of this segment are at now
  let xy;
  // draw the tracking dot
  if (thisSeg.type === 'line') {
    xy = getLinePath(thisSeg.move, pct);
  } else if (thisSeg.type === 'quadratic') {
    xy = getQuadraticPath(thisSeg.move, pct);
  } else if (thisSeg.type === 'cubic') {
    xy = getCubicPath(thisSeg.move, pct);
  }
  drawDot(xy, thisSeg);
  drawShapes();
}

// draw the path for the dot to follow. pct is 0-1
function getLinePath(move, pct) {
  let dx = move[1].x - move[0].x;
  let dy = move[1].y - move[0].y;
  let X = move[0].x + dx * pct;
  let Y = move[0].y + dy * pct;
  return ({
    x: X,
    y: Y
  });
}
function getQuadraticPath(move, pct) {
  let x = Math.pow(1 - pct, 2) * move[0].x + 2 * (1 - pct) * pct * move[1].x + Math.pow(pct, 2) * move[2].x;
  let y = Math.pow(1 - pct, 2) * move[0].y + 2 * (1 - pct) * pct * move[1].y + Math.pow(pct, 2) * move[2].y;
  return ({
    x: x,
    y: y
  });
}
// helper formula for getCubicPath
function CubicN(a, b, c, d, pct) {
  let t2 = pct * pct;
  let t3 = t2 * pct;
  return a + (-a * 3 + pct * (3 * a - a * pct)) * pct + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct + (c * 3 - c * 3 * pct) * t2 + d * t3;
}
function getCubicPath(move, pct) {
  let x = CubicN(move[0].x, move[1].x, move[2].x, move[3].x, pct);
  let y = CubicN(move[0].y, move[1].y, move[2].y, move[3].y, pct);
  return ({
    x: x,
    y: y
  });
}

// draw tracking dot at xy
function drawDot(point, thisSeg) {
  let ctx = grRemixChart.ctx;
  ctx.fillStyle = thisSeg.color; // as a constant, can use: grRemixChart.dot.fillColor;
  ctx.strokeStyle = thisSeg.color;
  ctx.lineWidth = grRemixChart.dot.lineWidth; // stroke line width
  ctx.beginPath();
  if (grRemixChart.dot.type === 'arc') {
    ctx.arc(point.x, point.y, grRemixChart.dot.size, 0, Math.PI * 2, false);
  } else {
    ctx.rect(point.x - grRemixChart.dot.size / 2, point.y - grRemixChart.dot.size / 2, grRemixChart.dot.size, grRemixChart.dot.size / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (thisSeg.color === 'transparent') {
    drawShape(thisSeg, thisSeg.selectFillColor);
  }
}

// draw shapes at transparent segments
function drawShape(thisSeg, color) {
  let ctx = grRemixChart.ctx;
  if (color !== 'normal') {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = thisSeg.lineWidth * 2;
  } else {
    ctx.fillStyle = thisSeg.fillColor; //grRemixChart.dot.fillColor;
    ctx.strokeStyle = thisSeg.strokeColor;
    ctx.lineWidth = thisSeg.lineWidth;
  }
  let x = (thisSeg.x1 + thisSeg.x2) / 2; // get the geometric center
  let y = (thisSeg.y1 + thisSeg.y2) / 2;
  let h = typeof thisSeg.h !== 'undefined' ? thisSeg.h : Math.abs(thisSeg.y1 - thisSeg.y2);
  let w = typeof thisSeg.w !== 'undefined' ? thisSeg.w : Math.abs(thisSeg.x1 - thisSeg.x2);
  ctx.beginPath();
  if (thisSeg.shapeType === 'arc') {
    ctx.arc(x, y, w / 2, 0, Math.PI * 2, false);
  } else {
    ctx.rect(thisSeg.x1, thisSeg.y1 - (h / 2), w, h); //upper left x&y, width & height
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
function drawShapes() {
  for (let i = 0; i < grRemixChart.seg.length; i++) {
    if (grRemixChart.seg[i].color === 'transparent') {
      drawShape(grRemixChart.seg[i], 'normal');
    }
  }
}

/*
// just for development
function outputArray() {
    let props = Object.keys(grRemixChart.seg[0]);
    let theOutput = '';
    for (var i = 0; i < grRemixChart.seg.length; i++) {
        for (var x = 0; x < props.length; x++) {
        theOutput += `<BR>${i} ${props[x]} ${grRemixChart.seg[i][props[x]]}`;
        }
    }
    document.write(theOutput);
}
outputArray();
*/