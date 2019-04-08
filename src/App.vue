<template>
  <div id="app">
    <div id="map" class="map"/>
    <div class="planSimulate-buttonStyle-hq">
      <!-- <p style="font-size:12px;">预案推演 </p> -->
      <!-- <el-button id="startButton" style="font-size:18px" type="success" @click="startSimulate">预案推演{{ isStartButton }}</el-button> -->
      <el-button type="primary" style="align:left;" class="simulate-button-hq" @click="startSimulate">
        <span >动画{{ isStartButton }}</span>
      </el-button>
      <el-button type="primary" style="align:left;" class="simulate-button-hq" @click="drawLine">
        <span >画线</span>
      </el-button>
       <el-button type="primary" style="align:left;" class="simulate-button-hq" @click="unLine">
        <span >取消画线</span>
      </el-button>
    </div>
    <div id="geo-marker">
      <img :src="myplanImg" >
    </div>
    <div id="mouse-position" />
    <div id="popup" class="ol-popup">
      <a id="popup-closer" href="#" class="ol-popup-closer"/>
      <div id="popup-content"/>
    </div>
  </div>
</template>
<script>
import * as myol from './openlayerstools.js'
import sosimg from '@/../static/images/sos1.png'
import 'ol/ol.css'
import { Feature } from 'ol'
import * as geom from 'ol/geom.js'
import * as style from 'ol/style.js'
import Overlay from 'ol/Overlay.js'
import { deepclone } from '@/utils/index.js'
import myplanImg from '@/../static/images/船载应急通信系统.png'
export default {
  name: 'App',
  data() {
    return {
      layerFeatures: null, // 第一个layer
      layerRoute: null, // 第二个layer,路径layer
      srcimg: 'static/images/',
      polygonAppArray: [], // 多边形事件，多边形
      pointAppArray: [], // 点事件，圆
      platArray: [], // 平台数组集合，圆
      pathIndex: 0, // 路径点索引
      marker: null, // 移动点
      splitNumber: 200, // 每两个经纬度之间的分割点
      setIntervalTime: 30, // 移动点间隔时间
      myplanImg: myplanImg, // 移动点的图片
      helpTooltipElement: null, // 平台信息div
      helpTooltip: null, // 平台信息overlay
      planSimulatePathArray: [[107, 19],
        [110.79, 16],
        [114.6636, 18.2977]], // 路径数组
      planSimulateDescriptionArray: ['开始航行', '到达指定位置', '保障完成'], // 描述数组
      isStartButton: '开始',
      timeInterval: null, // 定时器
      overlayArray: [], // 流程图每个点的overlay,设置位置用
      overlayElementArray: [], // 流程图每个点的信息框,显示信息用
      path: [[107, 19],
        [110.79, 16],
        [114.6636, 18.2977]], // 路径数组
      coordinateArray: [
        [107, 20], [112, 18], [108, 17]
      ],//css动画
      res: {
        appArray: [
          { appId: 1, apper: 'XXXa', appStatus: 0, areaType: 0,
            center: [112.2497, 20.652], radius: 50 }, // appStatus:是否处理，areaTyle:时间区域类型
          {
            appId: 2, apper: 'xxxb', appStatus: 1, areaType: 1,
            polygon: [[110.426573, 17.954432], [110.926573, 15.354432], [112, 15], [111.526573, 18.954432]]// 多边形
          }
        ],
        // 平台数组
        platArray: [
          { center: [109, 17], radius: 80, id: 1, name: '临近长航时无人机' }, // 平台1
          { center: [108, 17], radius: 90, id: 2, name: '船载应急通信系统' }, // 平台2
          { center: [114, 17], radius: 200, id: 3, name: '灯塔应急通信系统' }// 平台3
        ]
      },
      lineArray: [
        [[110.948735, 19.784631], [111.922638, 21.635671]],
        [[111.922638, 21.635671], [110.398525, 17.974742]],
        [[110.398525, 17.974742], [110.948735, 19.784631]],
      ]
    }
  },
  created() {
    this.analysisPath(this.splitNumber)//把路径点没两点之间分割成200个
  },
  mounted() {
    this.initSeamap()
    this.getDashboardInfo()
  },
  methods: {
    initSeamap: function() {
      this.pathIndex = 0
      var sourceFeatures = myol.createSource()
      this.layerFeatures = myol.createLayerWithSource(sourceFeatures)
      var lineString = new geom.LineString([])
      this.layerRoute = myol.createLayerWithLinestring(lineString)
      myol.createOpenStreetMap('map', this.layerRoute)
      this.global.map.addLayer(this.layerFeatures)
      var markerEl = document.getElementById('geo-marker')
      // markerEl.className = 'css_animation'
      this.marker = new Overlay({
        positioning: 'center-center',
        offset: [0, 0],
        element: markerEl,
        stopEvent: false
      })
      this.global.map.addOverlay(this.marker)
      var style1 = [// 开始结束点样式
        new style.Style({
          image: new style.Icon(({
            src: 'static/images/marker.png'
          }))
        })
      ]
      var feature_start = new Feature({
        geometry: new geom.Point(this.planSimulatePathArray[0])
      })
      var feature_end = new Feature({
        geometry: new geom.Point(this.planSimulatePathArray[this.planSimulatePathArray.length - 1])
      })
      feature_start.setStyle(style1)
      feature_end.setStyle(style1)
      sourceFeatures.addFeatures([feature_start, feature_end])
      lineString.setCoordinates(this.planSimulatePathArray)
      this.helpTooltipElement = document.createElement('div')
      this.helpTooltipElement.className = 'measuretip'
      //   this.helpTooltipElement.id = 'speed'
      this.helpTooltip = new Overlay({
        element: this.helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
      })
      this.global.map.addOverlay(this.helpTooltip)
      // this.timeInterval = setInterval(() => {
      //   this.animation()
      // }, this.setIntervalTime)
      // 设置第一个点
      this.marker.setPosition(this.planSimulatePathArray[this.pathIndex])
      this.helpTooltipElement.innerHTML = '<B>名称：</B>船载应急通信系统' + '\<br\>' +
                            '<B>子系统：</B>平台A,平台B' + '\<br\>' +
                            '<B>经纬度：</B>' + (this.planSimulatePathArray[this.pathIndex][0] + '').substring(0, 6) + ',' +
                            (this.planSimulatePathArray[this.pathIndex][1] + '').substring(0, 5)
      this.helpTooltip.setPosition(this.planSimulatePathArray[this.pathIndex])
    },
    startSimulate: function() {
      if (this.isStartButton === '开始' || this.isStartButton === '继续') {
        this.isStartButton = '暂停'
        this.timeInterval = setInterval(() => {
          this.animation()
        }, this.setIntervalTime)
      } else {
        this.isStartButton = '继续'
        clearInterval(this.timeInterval)
      }
    },
    animation: function() {
      if (this.pathIndex === this.planSimulatePathArray.length) {
        this.pathIndex = 0
      }
      this.marker.setPosition(this.planSimulatePathArray[this.pathIndex])
      this.helpTooltipElement.innerHTML = '<B>名称：</B>船载应急通信系统' + '\<br\>' +
                            '<B>子系统：</B>平台A,平台B' + '\<br\>' +
                            '<B>经纬度：</B>' + (this.planSimulatePathArray[this.pathIndex][0] + '').substring(0, 6) + ',' +
                            (this.planSimulatePathArray[this.pathIndex][1] + '').substring(0, 5)
      this.helpTooltip.setPosition(this.planSimulatePathArray[this.pathIndex])
      this.pathIndex++
    },
    analysisPath: function(splitNumber) {
      var tempPath = deepclone(this.planSimulatePathArray)
      var pathResults = []
      var tempPoint = [0, 0]
      if (tempPath.length > 1) {
        for (let i = 0; i < tempPath.length - 1; i++) { // 每两个点之间分割出splitNumber个点
          pathResults.push(tempPath[i])
          for (let j = 0; j < splitNumber; j++) {
            tempPoint[0] = (tempPath[i + 1][0] - tempPath[i ][0]) * (j + 1) / splitNumber + tempPath[i][0]
            tempPoint[1] = (tempPath[i + 1][1] - tempPath[i ][1]) * (j + 1) / splitNumber + tempPath[i][1]
            pathResults.push(deepclone(tempPoint))
          }
        }
        pathResults.push(tempPath[tempPath.length - 1])
        this.planSimulatePathArray = deepclone(pathResults)
        console.log(this.planSimulatePathArray)
      }
    },
    getDashboardInfo: function() {

          this.analysisSeamapInfo(this.res)
          // 海图加载一定要放在post里面，因为代码运行会跳过.then直接执行下面的代码
          // myol.pointPolt(this.layer, this.poltArray)
          myol.polygonPolt(this.layerFeatures, this.polygonAppArray)
          myol.circlePolt(this.layerFeatures, this.pointAppArray)
          myol.circlePolt(this.layerFeatures, this.platArray)
          myol.linePolt(this.layerFeatures, this.lineArray)//画链路状态，虚线
          // myol.interactionPoint()// 自定义连线
          // myol.backToBase()// 点击地图回到海南
          myol.stepsRouteAnimate(this.coordinateArray)// css闪烁动画
          myol.showDetails()// 点击平台显示弹框
          this.analysisPlanSimulateData()
    },
    analysisPlanSimulateData: function() {
    // 分析预案数据后添加路径点信息
      for (let index = 1; index < this.path.length; index++) {
        var helpTooltipElement = document.createElement('div')
        helpTooltipElement.className = 'measuretip'
        //   helpTooltipElement.id = 'speed'
        var helpTooltip = new Overlay({
          element: helpTooltipElement,
          offset: [15, 0],
          positioning: 'center-left'
        })
        this.global.map.addOverlay(helpTooltip)
        var stringShow = '<B>任务描述:</B>' + this.planSimulateDescriptionArray[index] + '<br>' 
        helpTooltipElement.innerHTML = stringShow
        helpTooltip.setPosition(this.path[index])
      }
    },
        analysisSeamapInfo: function(seamapData) {
      // console.log(seamapData)
      for (let index = 0; index < seamapData.appArray.length; index++) { // 取出事件
        if (seamapData.appArray[index].areaType === 0) { // 点事件
          // seamapData.appArray[index].radius = 0.5
          seamapData.appArray[index].imageName = sosimg
          this.pointAppArray.push(seamapData.appArray[index])
        }
        if (seamapData.appArray[index].areaType === 1) { // 多边形事件
          this.polygonAppArray.push(seamapData.appArray[index])
        }
      }
      for (let index = 0; index < seamapData.platArray.length; index++) { // 取出平台
        seamapData.platArray[index].imageName = this.srcimg + seamapData.platArray[index].name + '.png'// 这样取图片不需要将图片一个个导入
        this.platArray.push(seamapData.platArray[index])
      }
    },
    drawLine:function(){
      myol.interactionPoint()// 自定义连线
    },
    unLine:function(){
      myol.removeLine()// 自定义连线
    }
  }
}
</script>

<style scoped>
.map {
	width: 100%;
	background-color: white;
	height: 100%;
	text-align: right;
  z-index: 0;
}
        /* 鼠标位置控件层样式设置 */
        #mouse-position{
            float:left;
            position:absolute;
            top:200px;
            width:200px;
            height:20px;
            color:Red;
            font-size:20px;
            z-index:2000;   /*在地图容器中的层，要设置z-index的值让其显示在地图上层*/
        }
        .ol-popup {
        position: absolute;
        background-color: #eeeeee;
        -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
        filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #cccccc;
        bottom: 12px;
        left: -50px;
        min-width: 280px;
    }
    .ol-popup:after,
    .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }
    .ol-popup:after {
        border-top-color: #eeeeee;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
    }
    .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
    }
    .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
    }
    .ol-popup-closer:after {
        content: "✖";
    }
            .measuretip {
            position: relative;
            background-color: #0D9BF2;
            opacity: 0.7;
            border-radius: 3px;
            padding: 10px;
            font-size: 12px;
            cursor: default;
        }
        .planSimulate-buttonStyle-hq{
            width:90px;
            position: absolute;
            z-index: 11;
            left:-10px;
            top:55px;
            /* opacity: 0.7; */
            border-radius: 3px;
            padding: 10px;
            font-size: 12px
        }
              .css_animation{
        height:50px;
        width:50px;
        border-radius: 25px;
        background: rgba(255, 0, 0, 0.9);
        transform: scale(0);
        animation: myfirst 3s;
        animation-iteration-count: infinite;
    }
    @keyframes myfirst{
        to{
            transform: scale(2);
            background: rgba(0, 0, 0, 0);
        }
    }
    .simulate-button-hq{
  /* float:right;
	width: 140px;
	height: 42px; */
	background-image: linear-gradient(0deg,#0a1a2c 0%,#0c3d59 100%);
	border-radius: 10px;
	border: solid 1px #23e3cc;
  font-family: NotoSansHans-Regular;
	font-size: 18px;
  letter-spacing: 2px;
	color: #22f4ff;
  /* display:block;
  margin-top:30px;
  margin-bottom:50px; */
}
</style>
