// -*- mode: javascript; coding: utf-8-unix -*-

//----------------------------------------
// 全局变量
//----------------------------------------
var canvas;
var context;

var centroids; //质心
var colors;
var points;
var numClusters;
var numPoints;

//----------------------------------------
// 聚类主体算法
//----------------------------------------
function clustering() {
  var i, j;
  for (i = 0; i < centroids.length; i++) { //初始化
    centroids[i].bestMatches = [];
  }
  for (j = 0; j < points.length; j++) {
    var p = points[j];
    var bestMatch = 0;
    var bestMatchDist = getSquareDistance(p, centroids[bestMatch]);
    for (i = 1; i < centroids.length; i++) { //执行循环，每个点计算与每个质心的距离
      var d = getSquareDistance(p, centroids[i]);
      if (d < bestMatchDist) { //每次发现距离变短，更新对应的质心和距离
			bestMatch = i;
			bestMatchDist = d;
      }
    }
    centroids[bestMatch].bestMatches.push(j); //数组重新装入，为更新质心用
    points[j].clusterId = bestMatch; //每个点对应的clusterid更新
  }
}

function updateCentroids() { //更新质心
  var newCentroids = [];
  for (var j = 0; j < centroids.length; j++) {
    if (centroids[j].bestMatches.length > 0) { //质心有best match点的情况下，开始计算
      var ax = 0;
      var ay = 0;
      var bestMatches = centroids[j].bestMatches;
      for (var i = 0; i < bestMatches.length; i++) { //遍历与它所有的bestmatch点，计算质心
			var p = points[bestMatches[i]];
			ax += p.x;
			ay += p.y;
      }
      ax /= bestMatches.length;
      ay /= bestMatches.length; 
      newCentroids.push(new Point(ax, ay, j)); //新建质心
    }
    else {
      newCentroids.push(centroids[j]);  //质心没有best match点，保持原样
    }
  }
  
  return newCentroids;
}


function init() {
  canvas = document.getElementById("main-canvas");
  context = canvas.getContext("2d");
  numPoints = parseInt(document.getElementById("numPoints").value, 10) || 100; //读取input标签的point值
  numClusters = parseInt(document.getElementById("numClusters").value, 10) || 5; //分类的数目
  centroids = [];
  colors = [];
  points = [];

  var width = canvas.width;
  var height = canvas.height;
  context.clearRect(0, 0, width, height);  //清掉画布
  initCanvas(); //初始化Canvas

  var x, y, i;
  for (i = 0; i < numClusters; i++) { //初始随机生成质心
    x = Math.floor(Math.random() * width);  //随机产生x
    y = Math.floor(Math.random() * height); //随机产生y
    centroids.push(new Point(x, y, i)); //存储质心
    colors.push(hsv2rgb(i * 360 / numClusters, 255, 255)); //分配一种颜色
  }

  for (i = 0; i < numPoints; i++) { //初始随机产生点
    x = Math.floor(Math.random() * width); //随机产生x
    y = Math.floor(Math.random() * height); //随机产生y
    points.push(new Point(x, y, null)); //存储点
  }
  clustering(); //首先进行一次聚类操作

  drawPoints(context, points, colors); //初始化画点
  drawCentroids(context, centroids, colors); //初始化描绘中心点
}


function update() {
  var newCentroids = updateCentroids();
  centroids = newCentroids; //更新的质心集合
  clustering(); //执行聚类步骤

  initCanvas(); //初始化画布
  drawLines(context, newCentroids, points); //更新连线
  drawPoints(context, points, colors);  //更新点
  drawCentroids(context, newCentroids, colors); //画中心点
}


//----------------------------------------
// 工具函数
//----------------------------------------
function Point(x, y, clusterId) {
  this.x = x;
  this.y = y;
  this.clusterId = clusterId;  //对应的簇编号
}


function styleRGB(r, g, b) {
  return "RGB(" + [r, g, b].join(",") + ")"; //RGB转换css
}


function hsv2rgb(h, s, v) {
  var r, g, b;

  if (s === 0) {
    var val = Math.round(v);
    return styleRGB(val, val, val);
  }

  if (h < 0) {
    h += 360;
  }
  h = h % 360;
  s = s / 255;

  var hi = Math.floor(h / 60) % 6;
  var f = (h / 60) - hi;
  var p = Math.round(v * (1 - s));
  var q = Math.round(v * (1 - f * s));
  var t = Math.round(v * (1 - (1 - f) * s));

  switch (hi) {
  case 0:
    r = v;
    g = t;
    b = p;
    break;
  case 1:
    r = q;
    g = v;
    b = p;
    break;
  case 2:
    r = p;
    g = v;
    b = t;
    break;
  case 3:
    r = p;
    g = q;
    b = v;
    break;
  case 4:
    r = t;
    g = p;
    b = v;
    break;
  case 5:
    r = v;
    g = p;
    b = q;
    break;
  default:
    break;
  }

  return styleRGB(r, g, b);
}


function getSquareDistance(p1, p2) { //计算欧式距离
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}


//----------------------------------------
// 绘制函数
//----------------------------------------
function initCanvas() { //初始化画布
  var width = canvas.width;
  var height = canvas.height;
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height); //
}

function drawCentroids(context, centroids, colors) {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = "#cccccc";

  var size = 8;
  var i, p;
  for (i = 0; i < centroids.length; i++) { //先画阴影5px
    p = centroids[i];
    context.moveTo(p.x - size, p.y - size);
    context.lineTo(p.x + size, p.y + size);
    context.moveTo(p.x + size, p.y - size);
    context.lineTo(p.x - size, p.y + size);
  }
  context.stroke();

  context.lineWidth = 2;
  for (i = 0; i < centroids.length; i++) { //再画实线2px
    p = centroids[i];
    context.beginPath();
    context.strokeStyle = colors[i];
    context.moveTo(p.x - size, p.y - size);
    context.lineTo(p.x + size, p.y + size);
    context.moveTo(p.x + size, p.y - size);
    context.lineTo(p.x - size, p.y + size);
    context.stroke();
  }
}


function drawPoints(context, points, colors) {
  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    var p = points[i];
    context.fillStyle = (p.clusterId >= 0) ? colors[p.clusterId] : "#cccccc";
    context.arc(p.x, p.y, 5, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();
  }
}


function drawLines(context, centroids, points) {
  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    var p = points[i];
    var c = centroids[p.clusterId];
    context.lineWidth = 1;
    context.strokeStyle = colors[p.clusterId];
    context.moveTo(p.x, p.y);
    context.lineTo(c.x, c.y);
    context.stroke();
  }
}


