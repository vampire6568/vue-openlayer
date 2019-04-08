// 引入openlayers的库
import 'ol/ol.css'
import { Map, View, Feature } from 'ol'
import * as layer from 'ol/layer.js'
import * as source from 'ol/source.js'
import * as geom from 'ol/geom.js'
import * as style from 'ol/style.js'
import Overlay from 'ol/Overlay.js'
import TileLayer from 'ol/layer/Tile'
import { defaults as defaultControls } from 'ol/control.js'
import MousePosition from 'ol/control/MousePosition.js'
import * as control from 'ol/control'
import * as ol from 'openlayers'
import arrow from '@/../static/images/arrow.png'
// import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js'
import global from '@/global/global.vue'
import Draw from 'ol/interaction/Draw.js'
// 创建一个source
export function createSource() {
  global.source = new source.Vector()
  return global.source
}
// 获取一个layer
export function createLayer() {
  global.source = new source.Vector()
  var paintlayer = new layer.Vector({
    source: global.source,
    style: styleFunction
  })
  return paintlayer
}
// 用已知source获取一个layer
export function createLayerWithSource(source) {
  var paintlayer = new layer.Vector({
    source: source,
    style: styleFunction// 自定义连线样式
  })
  return paintlayer
}
// 用已知lingstring获取一个layer
export function createLayerWithLinestring(lineString) {
  global.source2 = new source.Vector({
    features: [
      new Feature({
        geometry: lineString
      })
    ]
  })
  var paintlayer = new layer.Vector({// 两点之间的连线
    source: global.source2,
    style: [
      new style.Style({
        stroke: new style.Stroke({
          width: 3,
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [0.1, 5]
        }),
        zIndex: 2
      })
    ],
    updateWhileAnimating: true
  })
  return paintlayer
}
// 创建openstreetmap，并添加用于标绘的layer到其中
export function createOpenStreetMap(target, layer) {
  // 通过向新的layer中增加feature来控制贴图
// // 添加鼠标获取经纬度变量
  var mousePositionControl = new MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: 'custom-mouse-position',
    target: document.getElementById('mouse-position'),
    undefinedHTML: '&nbsp;'
  })
  global.map = new Map({
    controls: defaultControls().extend([mousePositionControl, new control.FullScreen()]),
    layers: [
      new TileLayer({
        source: new source.OSM()
      }),
      layer// 贴图图层
    ],
    loadTilesWhileAnimating: true,
    target: target,
    view: new View({
      projection: 'EPSG:4326',
      center: [110, 18],
      zoom: 7,
      minZoom: 3, // 限制最大显示
      maxZoom: 14
    })
  })
  // showDetails()
}
// 点击点事件显示具体信息
export function showDetails() {
  // 点击图片，显示信息框
  var container = document.getElementById('popup')
  var content = document.getElementById('popup-content')
  var popupCloser = document.getElementById('popup-closer')

  var overlay = new Overlay({
  // 设置弹出框的容器
    element: container,
    // 是否自动平移，即假如标记在屏幕边缘，弹出时自动平移地图使弹出框完全可见
    autoPan: true
  })
  global.map.on('singleclick', function(e) {
    if (e.dragging) {
      return
    }
    // coodinate存放了点击时的坐标信息
    var coodinate = e.coordinate
    // 在点击时获取像素区域
    var pixel = global.map.getEventPixel(e.originalEvent)
    var feature = global.map.forEachFeatureAtPixel(pixel, function(feature) {
      return feature
    })
    if (feature) {
      // console.log(feature.get('FeatureType'))
      if (feature.get('FeatureType') === 'plat') {
        // alert('这里是平台')
        // 设置弹出框内容，可以HTML自定义
        var center = feature.get('center')
        var radius = feature.get('radius')
        var id = feature.get('id')
        var name = feature.get('name')
        content.innerHTML = '<p>' + id + '</p>' + '<p>' + name + '</p>' + '<p>' + center + '</p>' + '<p>' + radius + '</p>'
        overlay.setPosition(coodinate)
      } else if (feature.get('FeatureType') === 'point') {
        // alert('这里是点事件')
        // 设置弹出框内容，可以HTML自定义
        var pointappId = feature.get('pointappId')
        var pointapper = feature.get('pointapper')
        var centerPosition = feature.get('centerPosition')
        var pointradius = feature.get('pointradius')
        content.innerHTML = '<p>' + pointappId + '</p>' + '<p>' + pointapper + '</p>' + '<p>' + centerPosition + '</p>' + '<p>' + pointradius + '</p>'
        overlay.setPosition(coodinate)
      } else if (feature.get('FeatureType') === 'polygon') {
        // alert('这里是区域事件')
        var appId = feature.get('polygonappId')
        var apper = feature.get('polygonapper')
        var Position = feature.get('polygonPosition')
        content.innerHTML = '<p>' + appId + '</p>' + '<p>' + apper + '</p>' + '<p>' + Position + '</p>'
        overlay.setPosition(coodinate)
      }
    }
    // overlay.setPosition(coodinate)
    // 显示overlay
    global.map.addOverlay(overlay)
  })

  popupCloser.addEventListener('click', function() {
    overlay.setPosition(undefined)
  })
}

// css闪烁动画
export function stepsRouteAnimate(coordinateArray) {
  for (let coordinateIndex = 0; coordinateIndex < coordinateArray.length; coordinateIndex++) {
    var point_div = document.createElement('div')
    point_div.className = 'css_animation'
    var point_overlay = new Overlay({
      element: point_div,
      positioning: 'center-center'
    })
    point_overlay.setPosition(coordinateArray[coordinateIndex])
    global.map.addOverlay(point_overlay)
  }
}
// 自定义连线
export function interactionPoint() {
  // 自定义点之间的连线
  global.draw = new Draw({
    source: global.source,
    type: 'LineString'
  })
  global.map.addInteraction(global.draw)
}
// 取消自定义连线
export function removeLine() {
  // 自定义点之间的连线
  global.map.removeInteraction(global.draw)
}
// 点击地图回到海南
export function backToBase() {
  global.map.on('singleclick', function(e) {
    // var london = ol.proj.fromLonLat([-0.12755, 51.507222])// 伦敦的坐标
    // 移动到海南，移动时是有动画的
    // console.log(e)
    global.map.getView().animate({
      center: [109, 18]
    })
  })
}
// 设置绘制点的样式
function setPointStyle(img, imgRotation) {
  // console.log('图片路径')
  // console.log(img)
  // alert(img)
  var pointStyle = new style.Style({
    image: new style.Icon({
      src: img,
      rotation: imgRotation * 0.01745329251 // in rad/360° = 6.28318531 rad = 2PI rad
    })
  })
  // 图片放大缩小
  global.map.getView().on('change:resolution', function() {
    // 重新设置图标的缩放率，zoom每增加或减小1，图片放大或者缩小1倍
    // alert(this.getZoom())global.map.getView().getZoom() / 0)
    // console.log(global.map.getView().getZoom())
    var zoom = global.map.getView().getZoom()
    if (zoom % 1 === 0) {
      if (zoom >= 7) { pointStyle.getImage().setScale(zoom - 6) } else { pointStyle.getImage().setScale(1 / (8 - zoom)) }
    }
  })
  return pointStyle
}

// 设置绘制区域的样式
function setPolygonStyle() {
  var polygonStyle = new style.Style({
    fill: new style.Fill({
      color: 'rgba(255,0,0,0.2)'
    }),
    stroke: new style.Stroke({
      color: 'rgba(	255,0,0,60)',
      width: 1
      // lineDash: [1, 2, 3, 4, 5, 6]
    })
  })
  return polygonStyle
}
// 设置圆的样式
function setCircleStyle() {
  var circleStyle = new style.Style({
    fill: new style.Fill({
      color: 'rgba(255,255,0,0.2)'
    }),
    stroke: new style.Stroke({
      color: 'rgba(	255,165,0,60)',
      width: 1
      // lineDash: [1, 2, 3, 4, 5, 6]
    })
  })
  return circleStyle
}
// 设置线的样式
function setLineStyle() {
  var lineStyle = new style.Style({

    fill: new style.Fill({
      color: 'rgba(1,69,101,0.1)'
    }),
    stroke: new style.Stroke({
      color: 'rgba(0,100,0,1)',
      width: 1,
      lineDash: [1, 2, 3, 4, 5, 6],
      rotateWithView: true
    })
  })
  return lineStyle
}

// 点型目标标绘
export function pointPolt(layer, poltArray) {
  for (var poltArrayindex = 0; poltArrayindex < poltArray.length; poltArrayindex++) {
    for (var pointArrayindex = 0; pointArrayindex < poltArray[poltArrayindex].pointList.length; pointArrayindex++) {
      var plotFeature = new Feature({
        geometry: new geom.Point(poltArray[poltArrayindex].pointList[pointArrayindex].point)
      })
      plotFeature.setStyle(setPointStyle(poltArray[poltArrayindex].poltimg, poltArray[poltArrayindex].pointList[pointArrayindex].heading))
      layer.getSource().addFeature(plotFeature)
    }
  }
}

// 多边形目标标绘
export function polygonPolt(layer, polygonAppArray) {
  // var polygonArray = polygonAppArray.polygon
  // console.log('多边形')
  // console.log(polygonAppArray)
  for (var polygonPoltindex = 0; polygonPoltindex < polygonAppArray.length; polygonPoltindex++) { // 遍历n个多边形
    var polygonFeature = new Feature({
      geometry: new geom.Polygon([polygonAppArray[polygonPoltindex].polygon]), // 一个多边形点集合
      FeatureType: 'polygon',
      polygonappId: polygonAppArray[polygonPoltindex].appId,
      polygonapper: polygonAppArray[polygonPoltindex].apper,
      polygonPosition: polygonAppArray[polygonPoltindex].polygon
    })
    polygonFeature.setStyle(setPolygonStyle())
    layer.getSource().addFeature(polygonFeature)
  }
}

// 圆形目标标绘，并在圆心画图
export function circlePolt(layer, circleArray) {
  // console.log('圆形')
  console.log(circleArray)
  var circleIn3857, circleIn4326
  for (var circleindex = 0; circleindex < circleArray.length; circleindex++) {
    circleIn3857 = new geom.Circle(ol.proj.transform(circleArray[circleindex].center,
      'EPSG:4326', 'EPSG:3857'), circleArray[circleindex].radius * 1000, 'XY')// 因为半径单位是km所以要乘1000
    circleIn4326 = circleIn3857.transform('EPSG:3857', 'EPSG:4326')
    // var circleFeature = new Feature({
    //   geometry: new geom.Circle(circleArray[circleindex].center, circleArray[circleindex].radius)
    // })
    // circleFeature.setStyle(setCircleStyle())
    // layer.getSource().addFeature(circleFeature)
    var circleFeature = new Feature({
      geometry: circleIn4326
    })
    circleFeature.setStyle(setCircleStyle())
    layer.getSource().addFeature(circleFeature)

    // 画圆心的图片，也就是画点

    var plotFeature
    if (circleArray[circleindex].id === undefined) {
      plotFeature = new Feature({
        geometry: new geom.Point(circleArray[circleindex].center),
        FeatureType: 'point', // 点事件
        pointappId: circleArray[circleindex].appId,
        pointapper: circleArray[circleindex].apper,
        centerPosition: circleArray[circleindex].center,
        pointradius: circleArray[circleindex].radius
      })
    } else {
      plotFeature = new Feature({
        geometry: new geom.Point(circleArray[circleindex].center),
        FeatureType: 'plat', // 平台
        id: circleArray[circleindex].id,
        name: circleArray[circleindex].name,
        center: circleArray[circleindex].center,
        radius: circleArray[circleindex].radius
      })
    }
    plotFeature.setStyle(setPointStyle(circleArray[circleindex].imageName, 0))

    layer.getSource().addFeature(plotFeature)
  }
}

// 连接线目标标绘
export function linePolt(layer, lineArray) {
  for (var lineindex = 0; lineindex < lineArray.length; lineindex++) {
    var lineFeature = new Feature({
      geometry: new geom.LineString([lineArray[lineindex][0], lineArray[lineindex][1]])
    })
    lineFeature.setStyle(setLineStyle())
    layer.getSource().addFeature(lineFeature)
  }
}
// 自定义点之间连线的样式
function styleFunction(feature) {
  var geometry = feature.getGeometry()
  var styles = [
    // linestring
    new style.Style({
      stroke: new style.Stroke({
        color: '#ffcc33',
        width: 2
      })
    })
  ]
  geometry.forEachSegment(function(start, end) {
    var dx = end[0] - start[0]
    var dy = end[1] - start[1]
    var rotation = Math.atan2(dy, dx)
    // arrows
    styles.push(new style.Style({
      geometry: new geom.Point(end),
      image: new style.Icon({
        src: arrow,
        anchor: [0.75, 0.5],
        rotateWithView: true,
        rotation: -rotation
      })
    }))
  })

  return styles
}

