/* eslint-disable */

/*
 * uCharts (R)
 * 高性能跨平台图表库，支持H5、APP、小程序（微信/支付宝/百度/头条/QQ/360/快手）、Vue、Taro等支持canvas的框架平台
 * Copyright (C) 2018-2022 QIUN (R) 秋云 https://www.ucharts.cn All rights reserved.
 * Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
 * 复制使用请保留本段注释，感谢支持开源！
 *
 * uCharts (R) 官方网站
 * https://www.uCharts.cn
 *
 * 开源地址:
 * https://gitee.com/uCharts/uCharts
 *
 * uni-app插件市场地址：
 * http://ext.dcloud.net.cn/plugin?id=271
 *
 */

'use strict'

const config = {
  version: 'v2.5.0-20230101',
  yAxisWidth: 15,
  xAxisHeight: 22,
  padding: [10, 10, 10, 10],
  rotate: false,
  fontSize: 13,
  fontColor: '#666666',
  dataPointShape: ['circle', 'circle', 'circle', 'circle'],
  color: ['#1890FF', '#91CB74', '#FAC858', '#EE6666', '#73C0DE', '#3CA272', '#FC8452', '#9A60B4', '#ea7ccc'],
  linearColor: ['#0EE2F8', '#2BDCA8', '#FA7D8D', '#EB88E2', '#2AE3A0', '#0EE2F8', '#EB88E2', '#6773E3', '#F78A85'],
  pieChartLinePadding: 15,
  pieChartTextPadding: 5,
  titleFontSize: 20,
  subtitleFontSize: 15,
  radarLabelTextMargin: 13,
}

const assign = function (target, ...varArgs) {
  if (target == null)
    throw new TypeError('[uCharts] Cannot convert undefined or null to object')

  if (!varArgs || varArgs.length <= 0)
    return target

  // 深度合并对象
  function deepAssign(obj1, obj2) {
    for (const key in obj2) {
      obj1[key] = obj1[key] && obj1[key].toString() === '[object Object]'
        ? deepAssign(obj1[key], obj2[key])
        : obj1[key] = obj2[key]
    }
    return obj1
  }
  varArgs.forEach((val) => {
    target = deepAssign(target, val)
  })
  return target
}

const util = {
  toFixed: function toFixed(num, limit) {
    limit = limit || 2
    if (this.isFloat(num))
      num = num.toFixed(limit)

    return num
  },
  isFloat: function isFloat(num) {
    return num % 1 !== 0
  },
  approximatelyEqual: function approximatelyEqual(num1, num2) {
    return Math.abs(num1 - num2) < 1e-10
  },
  isSameSign: function isSameSign(num1, num2) {
    return Math.abs(num1) === num1 && Math.abs(num2) === num2 || Math.abs(num1) !== num1 && Math.abs(num2) !== num2
  },
  isSameXCoordinateArea: function isSameXCoordinateArea(p1, p2) {
    return this.isSameSign(p1.x, p2.x)
  },
  isCollision: function isCollision(obj1, obj2) {
    obj1.end = {}
    obj1.end.x = obj1.start.x + obj1.width
    obj1.end.y = obj1.start.y - obj1.height
    obj2.end = {}
    obj2.end.x = obj2.start.x + obj2.width
    obj2.end.y = obj2.start.y - obj2.height
    const flag = obj2.start.x > obj1.end.x || obj2.end.x < obj1.start.x || obj2.end.y > obj1.start.y || obj2.start.y < obj1.end.y
    return !flag
  },
}

// 兼容H5点击事件
function getH5Offset(e) {
  e.mp = {
    changedTouches: [],
  }
  e.mp.changedTouches.push({
    x: e.offsetX,
    y: e.offsetY,
  })
  return e
}

// hex 转 rgba
function hexToRgb(hexValue, opc) {
  const rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const hex = hexValue.replace(rgx, (m, r, g, b) => {
    return r + r + g + g + b + b
  })
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const r = Number.parseInt(rgb[1], 16)
  const g = Number.parseInt(rgb[2], 16)
  const b = Number.parseInt(rgb[3], 16)
  return `rgba(${r},${g},${b},${opc})`
}

function findRange(num, type, limit) {
  if (isNaN(num))
    throw new Error('[uCharts] series数据需为Number格式')

  limit = limit || 10
  type = type || 'upper'
  let multiple = 1
  while (limit < 1) {
    limit *= 10
    multiple *= 10
  }
  if (type === 'upper')
    num = Math.ceil(num * multiple)
  else
    num = Math.floor(num * multiple)

  while (num % limit !== 0) {
    if (type === 'upper') {
      if (num == num + 1) { // 修复数据值过大num++无效的bug by 向日葵 @xrk_jy
        break
      }
      num++
    }
    else {
      num--
    }
  }
  return num / multiple
}

function calCandleMA(dayArr, nameArr, colorArr, kdata) {
  const seriesTemp = []
  for (let k = 0; k < dayArr.length; k++) {
    const seriesItem = {
      data: [],
      name: nameArr[k],
      color: colorArr[k],
    }
    for (let i = 0, len = kdata.length; i < len; i++) {
      if (i < dayArr[k]) {
        seriesItem.data.push(null)
        continue
      }
      let sum = 0
      for (let j = 0; j < dayArr[k]; j++)
        sum += kdata[i - j][1]

      seriesItem.data.push(+(sum / dayArr[k]).toFixed(3))
    }
    seriesTemp.push(seriesItem)
  }
  return seriesTemp
}

function calValidDistance(self, distance, chartData, config, opts) {
  const dataChartAreaWidth = opts.width - opts.area[1] - opts.area[3]
  let dataChartWidth = chartData.eachSpacing * (opts.chartData.xAxisData.xAxisPoints.length - 1)
  if (opts.type == 'mount' && opts.extra && opts.extra.mount && opts.extra.mount.widthRatio && opts.extra.mount.widthRatio > 1) {
    if (opts.extra.mount.widthRatio > 2)
      opts.extra.mount.widthRatio = 2
    dataChartWidth += (opts.extra.mount.widthRatio - 1) * chartData.eachSpacing
  }
  let validDistance = distance
  if (distance >= 0) {
    validDistance = 0
    self.uevent.trigger('scrollLeft')
    self.scrollOption.position = 'left'
    opts.xAxis.scrollPosition = 'left'
  }
  else if (Math.abs(distance) >= dataChartWidth - dataChartAreaWidth) {
    validDistance = dataChartAreaWidth - dataChartWidth
    self.uevent.trigger('scrollRight')
    self.scrollOption.position = 'right'
    opts.xAxis.scrollPosition = 'right'
  }
  else {
    self.scrollOption.position = distance
    opts.xAxis.scrollPosition = distance
  }
  return validDistance
}

function isInAngleRange(angle, startAngle, endAngle) {
  function adjust(angle) {
    while (angle < 0)
      angle += 2 * Math.PI

    while (angle > 2 * Math.PI)
      angle -= 2 * Math.PI

    return angle
  }
  angle = adjust(angle)
  startAngle = adjust(startAngle)
  endAngle = adjust(endAngle)
  if (startAngle > endAngle) {
    endAngle += 2 * Math.PI
    if (angle < startAngle)
      angle += 2 * Math.PI
  }
  return angle >= startAngle && angle <= endAngle
}

function createCurveControlPoints(points, i) {
  function isNotMiddlePoint(points, i) {
    if (points[i - 1] && points[i + 1])
      return points[i].y >= Math.max(points[i - 1].y, points[i + 1].y) || points[i].y <= Math.min(points[i - 1].y, points[i + 1].y)
    else
      return false
  }
  function isNotMiddlePointX(points, i) {
    if (points[i - 1] && points[i + 1])
      return points[i].x >= Math.max(points[i - 1].x, points[i + 1].x) || points[i].x <= Math.min(points[i - 1].x, points[i + 1].x)
    else
      return false
  }
  const a = 0.2
  const b = 0.2
  let pAx = null
  let pAy = null
  let pBx = null
  let pBy = null
  if (i < 1) {
    pAx = points[0].x + (points[1].x - points[0].x) * a
    pAy = points[0].y + (points[1].y - points[0].y) * a
  }
  else {
    pAx = points[i].x + (points[i + 1].x - points[i - 1].x) * a
    pAy = points[i].y + (points[i + 1].y - points[i - 1].y) * a
  }

  if (i > points.length - 3) {
    const last = points.length - 1
    pBx = points[last].x - (points[last].x - points[last - 1].x) * b
    pBy = points[last].y - (points[last].y - points[last - 1].y) * b
  }
  else {
    pBx = points[i + 1].x - (points[i + 2].x - points[i].x) * b
    pBy = points[i + 1].y - (points[i + 2].y - points[i].y) * b
  }
  if (isNotMiddlePoint(points, i + 1))
    pBy = points[i + 1].y

  if (isNotMiddlePoint(points, i))
    pAy = points[i].y

  if (isNotMiddlePointX(points, i + 1))
    pBx = points[i + 1].x

  if (isNotMiddlePointX(points, i))
    pAx = points[i].x

  if (pAy >= Math.max(points[i].y, points[i + 1].y) || pAy <= Math.min(points[i].y, points[i + 1].y))
    pAy = points[i].y

  if (pBy >= Math.max(points[i].y, points[i + 1].y) || pBy <= Math.min(points[i].y, points[i + 1].y))
    pBy = points[i + 1].y

  if (pAx >= Math.max(points[i].x, points[i + 1].x) || pAx <= Math.min(points[i].x, points[i + 1].x))
    pAx = points[i].x

  if (pBx >= Math.max(points[i].x, points[i + 1].x) || pBx <= Math.min(points[i].x, points[i + 1].x))
    pBx = points[i + 1].x

  return {
    ctrA: {
      x: pAx,
      y: pAy,
    },
    ctrB: {
      x: pBx,
      y: pBy,
    },
  }
}

function convertCoordinateOrigin(x, y, center) {
  return {
    x: center.x + x,
    y: center.y - y,
  }
}

function avoidCollision(obj, target) {
  if (target) {
    // is collision test
    while (util.isCollision(obj, target)) {
      if (obj.start.x > 0) {
        obj.start.y--
      }
      else if (obj.start.x < 0) {
        obj.start.y++
      }
      else {
        if (obj.start.y > 0)
          obj.start.y++
        else
          obj.start.y--
      }
    }
  }
  return obj
}

function fixPieSeries(series, opts, config) {
  let pieSeriesArr = []
  if (series.length > 0 && series[0].data.constructor.toString().includes('Array')) {
    opts._pieSeries_ = series
    const oldseries = series[0].data
    for (let i = 0; i < oldseries.length; i++) {
      oldseries[i].formatter = series[0].formatter
      oldseries[i].data = oldseries[i].value
      pieSeriesArr.push(oldseries[i])
    }
    opts.series = pieSeriesArr
  }
  else {
    pieSeriesArr = series
  }
  return pieSeriesArr
}

function fillSeries(series, opts, config) {
  let index = 0
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    if (!item.color) {
      item.color = config.color[index]
      index = (index + 1) % config.color.length
    }
    if (!item.linearIndex)
      item.linearIndex = i

    if (!item.index)
      item.index = 0

    if (!item.type)
      item.type = opts.type

    if (typeof item.show == 'undefined')
      item.show = true

    if (!item.type)
      item.type = opts.type

    if (!item.pointShape)
      item.pointShape = 'circle'

    if (!item.legendShape) {
      switch (item.type) {
        case 'line':
          item.legendShape = 'line'
          break
        case 'column':
        case 'bar':
          item.legendShape = 'rect'
          break
        case 'area':
        case 'mount':
          item.legendShape = 'triangle'
          break
        default:
          item.legendShape = 'circle'
      }
    }
  }
  return series
}

function fillCustomColor(linearType, customColor, series, config) {
  let newcolor = customColor || []
  if (linearType == 'custom' && newcolor.length == 0)
    newcolor = config.linearColor

  if (linearType == 'custom' && newcolor.length < series.length) {
    const chazhi = series.length - newcolor.length
    for (let i = 0; i < chazhi; i++)
      newcolor.push(config.linearColor[(i + 1) % config.linearColor.length])
  }
  return newcolor
}

function getDataRange(minData, maxData) {
  let limit = 0
  const range = maxData - minData
  if (range >= 10000)
    limit = 1000
  else if (range >= 1000)
    limit = 100
  else if (range >= 100)
    limit = 10
  else if (range >= 10)
    limit = 5
  else if (range >= 1)
    limit = 1
  else if (range >= 0.1)
    limit = 0.1
  else if (range >= 0.01)
    limit = 0.01
  else if (range >= 0.001)
    limit = 0.001
  else if (range >= 0.0001)
    limit = 0.0001
  else if (range >= 0.00001)
    limit = 0.00001
  else
    limit = 0.000001

  return {
    minRange: findRange(minData, 'lower', limit),
    maxRange: findRange(maxData, 'upper', limit),
  }
}

function measureText(text, fontSize, context) {
  let width = 0
  text = String(text)
  // #ifdef MP-ALIPAY || MP-BAIDU || APP-NVUE
  context = false
  // #endif
  if (context !== false && context !== undefined && context.setFontSize && context.measureText) {
    context.setFontSize(fontSize)
    return context.measureText(text).width
  }
  else {
    var text = text.split('')
    for (let i = 0; i < text.length; i++) {
      const item = text[i]
      if (/[a-zA-Z]/.test(item))
        width += 7
      else if (/[0-9]/.test(item))
        width += 5.5
      else if (/\./.test(item))
        width += 2.7
      else if (/-/.test(item))
        width += 3.25
      else if (/:/.test(item))
        width += 2.5
      else if (/[\u4E00-\u9FA5]/.test(item))
        width += 10
      else if (/\(|\)/.test(item))
        width += 3.73
      else if (/\s/.test(item))
        width += 2.5
      else if (/%/.test(item))
        width += 8
      else
        width += 10
    }
    return width * fontSize / 10
  }
}

function dataCombine(series) {
  return series.reduce((a, b) => {
    return (a.data ? a.data : a).concat(b.data)
  }, [])
}

function dataCombineStack(series, len) {
  const sum = new Array(len)
  for (var j = 0; j < sum.length; j++)
    sum[j] = 0

  for (let i = 0; i < series.length; i++) {
    for (var j = 0; j < sum.length; j++)
      sum[j] += series[i].data[j]
  }
  return series.reduce((a, b) => {
    return (a.data ? a.data : a).concat(b.data).concat(sum)
  }, [])
}

function getTouches(touches, opts, e) {
  let x, y
  if (touches.clientX) {
    if (opts.rotate) {
      y = opts.height - touches.clientX * opts.pix
      x = (touches.pageY - e.currentTarget.offsetTop - (opts.height / opts.pix / 2) * (opts.pix - 1)) * opts.pix
    }
    else {
      x = touches.clientX * opts.pix
      y = (touches.pageY - e.currentTarget.offsetTop - (opts.height / opts.pix / 2) * (opts.pix - 1)) * opts.pix
    }
  }
  else {
    if (opts.rotate) {
      y = opts.height - touches.x * opts.pix
      x = touches.y * opts.pix
    }
    else {
      x = touches.x * opts.pix
      y = touches.y * opts.pix
    }
  }
  return {
    x,
    y,
  }
}

function getSeriesDataItem(series, index, group) {
  const data = []
  let newSeries = []
  const indexIsArr = index.constructor.toString().includes('Array')
  if (indexIsArr) {
    const tempSeries = filterSeries(series)
    for (let i = 0; i < group.length; i++)
      newSeries.push(tempSeries[group[i]])
  }
  else {
    newSeries = series
  };
  for (let i = 0; i < newSeries.length; i++) {
    const item = newSeries[i]
    let tmpindex = -1
    if (indexIsArr)
      tmpindex = index[i]
    else
      tmpindex = index

    if (item.data[tmpindex] !== null && typeof item.data[tmpindex] !== 'undefined' && item.show) {
      const seriesItem = {}
      seriesItem.color = item.color
      seriesItem.type = item.type
      seriesItem.style = item.style
      seriesItem.pointShape = item.pointShape
      seriesItem.disableLegend = item.disableLegend
      seriesItem.legendShape = item.legendShape
      seriesItem.name = item.name
      seriesItem.show = item.show
      seriesItem.data = item.formatter ? item.formatter(item.data[tmpindex]) : item.data[tmpindex]
      data.push(seriesItem)
    }
  }
  return data
}

function getMaxTextListLength(list, fontSize, context) {
  const lengthList = list.map((item) => {
    return measureText(item, fontSize, context)
  })
  return Math.max.apply(null, lengthList)
}

function getRadarCoordinateSeries(length) {
  const eachAngle = 2 * Math.PI / length
  const CoordinateSeries = []
  for (let i = 0; i < length; i++)
    CoordinateSeries.push(eachAngle * i)

  return CoordinateSeries.map((item) => {
    return -1 * item + Math.PI / 2
  })
}

function getToolTipData(seriesData, opts, index, group, categories) {
  const option = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {}
  const calPoints = opts.chartData.calPoints ? opts.chartData.calPoints : []
  let points = {}
  if (group.length > 0) {
    const filterPoints = []
    for (let i = 0; i < group.length; i++)
      filterPoints.push(calPoints[group[i]])

    points = filterPoints[0][index[0]]
  }
  else {
    for (let i = 0; i < calPoints.length; i++) {
      if (calPoints[i][index]) {
        points = calPoints[i][index]
        break
      }
    }
  };
  const textList = seriesData.map((item) => {
    let titleText = null
    if (opts.categories && opts.categories.length > 0)
      titleText = categories[index]

    return {
      text: option.formatter ? option.formatter(item, titleText, index, opts) : `${item.name}: ${item.data}`,
      color: item.color,
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
  })
  const offset = {
    x: Math.round(points.x),
    y: Math.round(points.y),
  }
  return {
    textList,
    offset,
  }
}

function getMixToolTipData(seriesData, opts, index, categories) {
  const option = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {}
  const points = opts.chartData.xAxisPoints[index] + opts.chartData.eachSpacing / 2
  let textList = seriesData.map((item) => {
    return {
      text: option.formatter ? option.formatter(item, categories[index], index, opts) : `${item.name}: ${item.data}`,
      color: item.color,
      disableLegend: !!item.disableLegend,
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
  })
  textList = textList.filter((item) => {
    if (item.disableLegend !== true)
      return item
  })
  const offset = {
    x: Math.round(points),
    y: 0,
  }
  return {
    textList,
    offset,
  }
}

function getCandleToolTipData(series, seriesData, opts, index, categories, extra) {
  const option = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {}
  const calPoints = opts.chartData.calPoints
  const upColor = extra.color.upFill
  const downColor = extra.color.downFill
  // 颜色顺序为开盘，收盘，最低，最高
  const color = [upColor, upColor, downColor, upColor]
  const textList = []
  seriesData.map((item) => {
    if (index == 0) {
      if (item.data[1] - item.data[0] < 0)
        color[1] = downColor
      else
        color[1] = upColor
    }
    else {
      if (item.data[0] < series[index - 1][1])
        color[0] = downColor

      if (item.data[1] < item.data[0])
        color[1] = downColor

      if (item.data[2] > series[index - 1][1])
        color[2] = upColor

      if (item.data[3] < series[index - 1][1])
        color[3] = downColor
    }
    const text1 = {
      text: `开盘：${item.data[0]}`,
      color: color[0],
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
    const text2 = {
      text: `收盘：${item.data[1]}`,
      color: color[1],
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
    const text3 = {
      text: `最低：${item.data[2]}`,
      color: color[2],
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
    const text4 = {
      text: `最高：${item.data[3]}`,
      color: color[3],
      legendShape: opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : opts.extra.tooltip.legendShape,
    }
    textList.push(text1, text2, text3, text4)
  })
  const validCalPoints = []
  const offset = {
    x: 0,
    y: 0,
  }
  for (let i = 0; i < calPoints.length; i++) {
    const points = calPoints[i]
    if (typeof points[index] !== 'undefined' && points[index] !== null)
      validCalPoints.push(points[index])
  }
  offset.x = Math.round(validCalPoints[0][0].x)
  return {
    textList,
    offset,
  }
}

function filterSeries(series) {
  const tempSeries = []
  for (let i = 0; i < series.length; i++) {
    if (series[i].show == true)
      tempSeries.push(series[i])
  }
  return tempSeries
}

function findCurrentIndex(currentPoints, calPoints, opts, config) {
  const offset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0
  const current = { index: -1, group: [] }
  let spacing = opts.chartData.eachSpacing / 2
  let xAxisPoints = []
  if (calPoints && calPoints.length > 0) {
    if (!opts.categories) {
      spacing = 0
    }
    else {
      for (let i = 1; i < opts.chartData.xAxisPoints.length; i++)
        xAxisPoints.push(opts.chartData.xAxisPoints[i] - spacing)

      if ((opts.type == 'line' || opts.type == 'area') && opts.xAxis.boundaryGap == 'justify')
        xAxisPoints = opts.chartData.xAxisPoints
    }
    if (isInExactChartArea(currentPoints, opts, config)) {
      if (!opts.categories) {
        const timePoints = Array(calPoints.length)
        for (let i = 0; i < calPoints.length; i++) {
          timePoints[i] = Array(calPoints[i].length)
          for (let j = 0; j < calPoints[i].length; j++)
            timePoints[i][j] = (Math.abs(calPoints[i][j].x - currentPoints.x))
        };
        const pointValue = Array(timePoints.length)
        const pointIndex = Array(timePoints.length)
        for (let i = 0; i < timePoints.length; i++) {
          pointValue[i] = Math.min.apply(null, timePoints[i])
          pointIndex[i] = timePoints[i].indexOf(pointValue[i])
        }
        const minValue = Math.min.apply(null, pointValue)
        current.index = []
        for (let i = 0; i < pointValue.length; i++) {
          if (pointValue[i] == minValue) {
            current.group.push(i)
            current.index.push(pointIndex[i])
          }
        };
      }
      else {
        xAxisPoints.forEach((item, index) => {
          if (currentPoints.x + offset + spacing > item)
            current.index = index
        })
      }
    }
  }
  return current
}

function findBarChartCurrentIndex(currentPoints, calPoints, opts, config) {
  const offset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0
  const current = { index: -1, group: [] }
  const spacing = opts.chartData.eachSpacing / 2
  const yAxisPoints = opts.chartData.yAxisPoints
  if (calPoints && calPoints.length > 0) {
    if (isInExactChartArea(currentPoints, opts, config)) {
      yAxisPoints.forEach((item, index) => {
        if (currentPoints.y + offset + spacing > item)
          current.index = index
      })
    }
  }
  return current
}

function findLegendIndex(currentPoints, legendData, opts) {
  let currentIndex = -1
  const gap = 0
  if (isInExactLegendArea(currentPoints, legendData.area)) {
    const points = legendData.points
    let index = -1
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i]
      for (let j = 0; j < item.length; j++) {
        index += 1
        const area = item[j].area
        if (area && currentPoints.x > area[0] - gap && currentPoints.x < area[2] + gap && currentPoints.y > area[1] - gap && currentPoints.y < area[3] + gap) {
          currentIndex = index
          break
        }
      }
    }
    return currentIndex
  }
  return currentIndex
}

function isInExactLegendArea(currentPoints, area) {
  return currentPoints.x > area.start.x && currentPoints.x < area.end.x && currentPoints.y > area.start.y && currentPoints.y < area.end.y
}

function isInExactChartArea(currentPoints, opts, config) {
  return currentPoints.x <= opts.width - opts.area[1] + 10 && currentPoints.x >= opts.area[3] - 10 && currentPoints.y >= opts.area[0] && currentPoints.y <= opts.height - opts.area[2]
}

function findRadarChartCurrentIndex(currentPoints, radarData, count) {
  const eachAngleArea = 2 * Math.PI / count
  let currentIndex = -1
  if (isInExactPieChartArea(currentPoints, radarData.center, radarData.radius)) {
    const fixAngle = function fixAngle(angle) {
      if (angle < 0)
        angle += 2 * Math.PI

      if (angle > 2 * Math.PI)
        angle -= 2 * Math.PI

      return angle
    }
    let angle = Math.atan2(radarData.center.y - currentPoints.y, currentPoints.x - radarData.center.x)
    angle = -1 * angle
    if (angle < 0)
      angle += 2 * Math.PI

    const angleList = radarData.angleList.map((item) => {
      item = fixAngle(-1 * item)
      return item
    })
    angleList.forEach((item, index) => {
      const rangeStart = fixAngle(item - eachAngleArea / 2)
      let rangeEnd = fixAngle(item + eachAngleArea / 2)
      if (rangeEnd < rangeStart)
        rangeEnd += 2 * Math.PI

      if (angle >= rangeStart && angle <= rangeEnd || angle + 2 * Math.PI >= rangeStart && angle + 2 * Math.PI <= rangeEnd)
        currentIndex = index
    })
  }
  return currentIndex
}

function findFunnelChartCurrentIndex(currentPoints, funnelData) {
  let currentIndex = -1
  for (let i = 0, len = funnelData.series.length; i < len; i++) {
    const item = funnelData.series[i]
    if (currentPoints.x > item.funnelArea[0] && currentPoints.x < item.funnelArea[2] && currentPoints.y > item.funnelArea[1] && currentPoints.y < item.funnelArea[3]) {
      currentIndex = i
      break
    }
  }
  return currentIndex
}

function findWordChartCurrentIndex(currentPoints, wordData) {
  let currentIndex = -1
  for (let i = 0, len = wordData.length; i < len; i++) {
    const item = wordData[i]
    if (currentPoints.x > item.area[0] && currentPoints.x < item.area[2] && currentPoints.y > item.area[1] && currentPoints.y < item.area[3]) {
      currentIndex = i
      break
    }
  }
  return currentIndex
}

function findMapChartCurrentIndex(currentPoints, opts) {
  let currentIndex = -1
  const cData = opts.chartData.mapData
  const data = opts.series
  const tmp = pointToCoordinate(currentPoints.y, currentPoints.x, cData.bounds, cData.scale, cData.xoffset, cData.yoffset)
  const poi = [tmp.x, tmp.y]
  for (let i = 0, len = data.length; i < len; i++) {
    const item = data[i].geometry.coordinates
    if (isPoiWithinPoly(poi, item, opts.chartData.mapData.mercator)) {
      currentIndex = i
      break
    }
  }
  return currentIndex
}

function findRoseChartCurrentIndex(currentPoints, pieData, opts) {
  let currentIndex = -1
  const series = getRoseDataPoints(opts._series_, opts.extra.rose.type, pieData.radius, pieData.radius)
  if (pieData && pieData.center && isInExactPieChartArea(currentPoints, pieData.center, pieData.radius)) {
    let angle = Math.atan2(pieData.center.y - currentPoints.y, currentPoints.x - pieData.center.x)
    angle = -angle
    if (opts.extra.rose && opts.extra.rose.offsetAngle)
      angle = angle - opts.extra.rose.offsetAngle * Math.PI / 180

    for (let i = 0, len = series.length; i < len; i++) {
      if (isInAngleRange(angle, series[i]._start_, series[i]._start_ + series[i]._rose_proportion_ * 2 * Math.PI)) {
        currentIndex = i
        break
      }
    }
  }
  return currentIndex
}

function findPieChartCurrentIndex(currentPoints, pieData, opts) {
  let currentIndex = -1
  const series = getPieDataPoints(pieData.series)
  if (pieData && pieData.center && isInExactPieChartArea(currentPoints, pieData.center, pieData.radius)) {
    let angle = Math.atan2(pieData.center.y - currentPoints.y, currentPoints.x - pieData.center.x)
    angle = -angle
    if (opts.extra.pie && opts.extra.pie.offsetAngle)
      angle = angle - opts.extra.pie.offsetAngle * Math.PI / 180

    if (opts.extra.ring && opts.extra.ring.offsetAngle)
      angle = angle - opts.extra.ring.offsetAngle * Math.PI / 180

    for (let i = 0, len = series.length; i < len; i++) {
      if (isInAngleRange(angle, series[i]._start_, series[i]._start_ + series[i]._proportion_ * 2 * Math.PI)) {
        currentIndex = i
        break
      }
    }
  }
  return currentIndex
}

function isInExactPieChartArea(currentPoints, center, radius) {
  return (currentPoints.x - center.x) ** 2 + (currentPoints.y - center.y) ** 2 <= radius ** 2
}

function splitPoints(points, eachSeries) {
  const newPoints = []
  let items = []
  points.forEach((item, index) => {
    if (eachSeries.connectNulls) {
      if (item !== null)
        items.push(item)
    }
    else {
      if (item !== null) {
        items.push(item)
      }
      else {
        if (items.length)
          newPoints.push(items)

        items = []
      }
    }
  })
  if (items.length)
    newPoints.push(items)

  return newPoints
}

function calLegendData(series, opts, config, chartData, context) {
  const legendData = {
    area: {
      start: {
        x: 0,
        y: 0,
      },
      end: {
        x: 0,
        y: 0,
      },
      width: 0,
      height: 0,
      wholeWidth: 0,
      wholeHeight: 0,
    },
    points: [],
    widthArr: [],
    heightArr: [],
  }
  if (opts.legend.show === false) {
    chartData.legendData = legendData
    return legendData
  }
  const padding = opts.legend.padding * opts.pix
  const margin = opts.legend.margin * opts.pix
  const fontSize = opts.legend.fontSize ? opts.legend.fontSize * opts.pix : config.fontSize
  const shapeWidth = 15 * opts.pix
  const shapeRight = 5 * opts.pix
  const lineHeight = Math.max(opts.legend.lineHeight * opts.pix, fontSize)
  if (opts.legend.position == 'top' || opts.legend.position == 'bottom') {
    const legendList = []
    let widthCount = 0
    const widthCountArr = []
    let currentRow = []
    for (let i = 0; i < series.length; i++) {
      const item = series[i]
      const legendText = item.legendText ? item.legendText : item.name
      const itemWidth = shapeWidth + shapeRight + measureText(legendText || 'undefined', fontSize, context) + opts.legend.itemGap * opts.pix
      if (widthCount + itemWidth > opts.width - opts.area[1] - opts.area[3]) {
        legendList.push(currentRow)
        widthCountArr.push(widthCount - opts.legend.itemGap * opts.pix)
        widthCount = itemWidth
        currentRow = [item]
      }
      else {
        widthCount += itemWidth
        currentRow.push(item)
      }
    }
    if (currentRow.length) {
      legendList.push(currentRow)
      widthCountArr.push(widthCount - opts.legend.itemGap * opts.pix)
      legendData.widthArr = widthCountArr
      const legendWidth = Math.max.apply(null, widthCountArr)
      switch (opts.legend.float) {
        case 'left':
          legendData.area.start.x = opts.area[3]
          legendData.area.end.x = opts.area[3] + legendWidth + 2 * padding
          break
        case 'right':
          legendData.area.start.x = opts.width - opts.area[1] - legendWidth - 2 * padding
          legendData.area.end.x = opts.width - opts.area[1]
          break
        default:
          legendData.area.start.x = (opts.width - legendWidth) / 2 - padding
          legendData.area.end.x = (opts.width + legendWidth) / 2 + padding
      }
      legendData.area.width = legendWidth + 2 * padding
      legendData.area.wholeWidth = legendWidth + 2 * padding
      legendData.area.height = legendList.length * lineHeight + 2 * padding
      legendData.area.wholeHeight = legendList.length * lineHeight + 2 * padding + 2 * margin
      legendData.points = legendList
    }
  }
  else {
    const len = series.length
    const maxHeight = opts.height - opts.area[0] - opts.area[2] - 2 * margin - 2 * padding
    const maxLength = Math.min(Math.floor(maxHeight / lineHeight), len)
    legendData.area.height = maxLength * lineHeight + padding * 2
    legendData.area.wholeHeight = maxLength * lineHeight + padding * 2
    switch (opts.legend.float) {
      case 'top':
        legendData.area.start.y = opts.area[0] + margin
        legendData.area.end.y = opts.area[0] + margin + legendData.area.height
        break
      case 'bottom':
        legendData.area.start.y = opts.height - opts.area[2] - margin - legendData.area.height
        legendData.area.end.y = opts.height - opts.area[2] - margin
        break
      default:
        legendData.area.start.y = (opts.height - legendData.area.height) / 2
        legendData.area.end.y = (opts.height + legendData.area.height) / 2
    }
    const lineNum = len % maxLength === 0 ? len / maxLength : Math.floor((len / maxLength) + 1)
    const currentRow = []
    for (let i = 0; i < lineNum; i++) {
      const temp = series.slice(i * maxLength, i * maxLength + maxLength)
      currentRow.push(temp)
    }
    legendData.points = currentRow
    if (currentRow.length) {
      for (let i = 0; i < currentRow.length; i++) {
        const item = currentRow[i]
        let maxWidth = 0
        for (let j = 0; j < item.length; j++) {
          const itemWidth = shapeWidth + shapeRight + measureText(item[j].name || 'undefined', fontSize, context) + opts.legend.itemGap * opts.pix
          if (itemWidth > maxWidth)
            maxWidth = itemWidth
        }
        legendData.widthArr.push(maxWidth)
        legendData.heightArr.push(item.length * lineHeight + padding * 2)
      }
      let legendWidth = 0
      for (let i = 0; i < legendData.widthArr.length; i++)
        legendWidth += legendData.widthArr[i]

      legendData.area.width = legendWidth - opts.legend.itemGap * opts.pix + 2 * padding
      legendData.area.wholeWidth = legendData.area.width + padding
    }
  }
  switch (opts.legend.position) {
    case 'top':
      legendData.area.start.y = opts.area[0] + margin
      legendData.area.end.y = opts.area[0] + margin + legendData.area.height
      break
    case 'bottom':
      legendData.area.start.y = opts.height - opts.area[2] - legendData.area.height - margin
      legendData.area.end.y = opts.height - opts.area[2] - margin
      break
    case 'left':
      legendData.area.start.x = opts.area[3]
      legendData.area.end.x = opts.area[3] + legendData.area.width
      break
    case 'right':
      legendData.area.start.x = opts.width - opts.area[1] - legendData.area.width
      legendData.area.end.x = opts.width - opts.area[1]
      break
  }
  chartData.legendData = legendData
  return legendData
}

function calCategoriesData(categories, opts, config, eachSpacing, context) {
  const result = {
    angle: 0,
    xAxisHeight: opts.xAxis.lineHeight * opts.pix + opts.xAxis.marginTop * opts.pix,
  }
  const fontSize = opts.xAxis.fontSize * opts.pix
  const categoriesTextLenth = categories.map((item, index) => {
    const xitem = opts.xAxis.formatter ? opts.xAxis.formatter(item, index, opts) : item
    return measureText(String(xitem), fontSize, context)
  })
  const maxTextLength = Math.max.apply(this, categoriesTextLenth)
  if (opts.xAxis.rotateLabel == true) {
    result.angle = opts.xAxis.rotateAngle * Math.PI / 180
    let tempHeight = opts.xAxis.marginTop * opts.pix * 2 + Math.abs(maxTextLength * Math.sin(result.angle))
    tempHeight = tempHeight < fontSize + opts.xAxis.marginTop * opts.pix * 2 ? tempHeight + opts.xAxis.marginTop * opts.pix * 2 : tempHeight
    result.xAxisHeight = tempHeight
  }
  if (opts.enableScroll && opts.xAxis.scrollShow)
    result.xAxisHeight += 6 * opts.pix

  if (opts.xAxis.disabled)
    result.xAxisHeight = 0

  return result
}

function getXAxisTextList(series, opts, config, stack) {
  const index = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : -1
  let data
  if (stack == 'stack')
    data = dataCombineStack(series, opts.categories.length)
  else
    data = dataCombine(series)

  const sorted = []
  // remove null from data
  data = data.filter((item) => {
    // return item !== null;
    if (typeof item === 'object' && item !== null) {
      if (item.constructor.toString().includes('Array'))
        return item !== null
      else
        return item.value !== null
    }
    else {
      return item !== null
    }
  })
  data.map((item) => {
    if (typeof item === 'object') {
      if (item.constructor.toString().includes('Array')) {
        if (opts.type == 'candle') {
          item.map((subitem) => {
            sorted.push(subitem)
          })
        }
        else {
          sorted.push(item[0])
        }
      }
      else {
        sorted.push(item.value)
      }
    }
    else {
      sorted.push(item)
    }
  })

  let minData = 0
  let maxData = 0
  if (sorted.length > 0) {
    minData = Math.min.apply(this, sorted)
    maxData = Math.max.apply(this, sorted)
  }
  // 为了兼容v1.9.0之前的项目
  if (index > -1) {
    if (typeof opts.xAxis.data[index].min === 'number')
      minData = Math.min(opts.xAxis.data[index].min, minData)

    if (typeof opts.xAxis.data[index].max === 'number')
      maxData = Math.max(opts.xAxis.data[index].max, maxData)
  }
  else {
    if (typeof opts.xAxis.min === 'number')
      minData = Math.min(opts.xAxis.min, minData)

    if (typeof opts.xAxis.max === 'number')
      maxData = Math.max(opts.xAxis.max, maxData)
  }
  if (minData === maxData) {
    const rangeSpan = maxData || 10
    maxData += rangeSpan
  }
  // var dataRange = getDataRange(minData, maxData);
  const minRange = minData
  const maxRange = maxData
  const range = []
  const eachRange = (maxRange - minRange) / opts.xAxis.splitNumber
  for (let i = 0; i <= opts.xAxis.splitNumber; i++)
    range.push(minRange + eachRange * i)

  return range
}

function calXAxisData(series, opts, config, context) {
  // 堆叠图重算Y轴
  const columnstyle = assign({}, {
    type: '',
  }, opts.extra.bar)
  let result = {
    angle: 0,
    xAxisHeight: opts.xAxis.lineHeight * opts.pix + opts.xAxis.marginTop * opts.pix,
  }
  result.ranges = getXAxisTextList(series, opts, config, columnstyle.type)
  result.rangesFormat = result.ranges.map((item) => {
    // item = opts.xAxis.formatter ? opts.xAxis.formatter(item) : util.toFixed(item, 2);
    item = util.toFixed(item, 2)
    return item
  })
  const xAxisScaleValues = result.ranges.map((item) => {
    // 如果刻度值是浮点数,则保留两位小数
    item = util.toFixed(item, 2)
    // 若有自定义格式则调用自定义的格式化函数
    // item = opts.xAxis.formatter ? opts.xAxis.formatter(Number(item)) : item;
    return item
  })
  result = Object.assign(result, getXAxisPoints(xAxisScaleValues, opts, config))
  // 计算X轴刻度的属性譬如每个刻度的间隔,刻度的起始点\结束点以及总长
  const eachSpacing = result.eachSpacing
  const textLength = xAxisScaleValues.map((item) => {
    return measureText(item, opts.xAxis.fontSize * opts.pix, context)
  })
  if (opts.xAxis.disabled === true)
    result.xAxisHeight = 0

  return result
}

function getRadarDataPoints(angleList, center, radius, series, opts) {
  const process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1
  const radarOption = opts.extra.radar || {}
  radarOption.max = radarOption.max || 0
  const maxData = Math.max(radarOption.max, Math.max.apply(null, dataCombine(series)))
  const data = []
  for (let i = 0; i < series.length; i++) {
    const each = series[i]
    const listItem = {}
    listItem.color = each.color
    listItem.legendShape = each.legendShape
    listItem.pointShape = each.pointShape
    listItem.data = []
    each.data.forEach((item, index) => {
      const tmp = {}
      tmp.angle = angleList[index]
      tmp.proportion = item / maxData
      tmp.value = item
      tmp.position = convertCoordinateOrigin(radius * tmp.proportion * process * Math.cos(tmp.angle), radius * tmp.proportion * process * Math.sin(tmp.angle), center)
      listItem.data.push(tmp)
    })
    data.push(listItem)
  }
  return data
}

function getPieDataPoints(series, radius) {
  const process = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1
  let count = 0
  let _start_ = 0
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    count += item.data
  }
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    if (count === 0)
      item._proportion_ = 1 / series.length * process
    else
      item._proportion_ = item.data / count * process

    item._radius_ = radius
  }
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item._start_ = _start_
    _start_ += 2 * item._proportion_ * Math.PI
  }
  return series
}

function getFunnelDataPoints(series, radius, option, eachSpacing) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  for (let i = 0; i < series.length; i++) {
    if (option.type == 'funnel')
      series[i].radius = series[i].data / series[0].data * radius * process
    else
      series[i].radius = (eachSpacing * (series.length - i)) / (eachSpacing * series.length) * radius * process

    series[i]._proportion_ = series[i].data / series[0].data
  }
  // if(option.type !== 'pyramid'){
  //   series.reverse();
  // }
  return series
}

function getRoseDataPoints(series, type, minRadius, radius) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  let count = 0
  let _start_ = 0
  const dataArr = []
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    count += item.data
    dataArr.push(item.data)
  }
  const minData = Math.min.apply(null, dataArr)
  const maxData = Math.max.apply(null, dataArr)
  const radiusLength = radius - minRadius
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    if (count === 0) {
      item._proportion_ = 1 / series.length * process
      item._rose_proportion_ = 1 / series.length * process
    }
    else {
      item._proportion_ = item.data / count * process
      if (type == 'area')
        item._rose_proportion_ = 1 / series.length * process
      else
        item._rose_proportion_ = item.data / count * process
    }
    item._radius_ = minRadius + radiusLength * ((item.data - minData) / (maxData - minData)) || radius
  }
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item._start_ = _start_
    _start_ += 2 * item._rose_proportion_ * Math.PI
  }
  return series
}

function getArcbarDataPoints(series, arcbarOption) {
  let process = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1
  if (process == 1)
    process = 0.999999

  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    let totalAngle
    if (arcbarOption.type == 'circle') {
      totalAngle = 2
    }
    else {
      if (arcbarOption.direction == 'ccw') {
        if (arcbarOption.startAngle < arcbarOption.endAngle)
          totalAngle = 2 + arcbarOption.startAngle - arcbarOption.endAngle
        else
          totalAngle = arcbarOption.startAngle - arcbarOption.endAngle
      }
      else {
        if (arcbarOption.endAngle < arcbarOption.startAngle)
          totalAngle = 2 + arcbarOption.endAngle - arcbarOption.startAngle
        else
          totalAngle = arcbarOption.startAngle - arcbarOption.endAngle
      }
    }
    item._proportion_ = totalAngle * item.data * process + arcbarOption.startAngle
    if (arcbarOption.direction == 'ccw')
      item._proportion_ = arcbarOption.startAngle - totalAngle * item.data * process

    if (item._proportion_ >= 2)
      item._proportion_ = item._proportion_ % 2
  }
  return series
}

function getGaugeArcbarDataPoints(series, arcbarOption) {
  let process = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1
  if (process == 1)
    process = 0.999999

  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    let totalAngle
    if (arcbarOption.type == 'circle') {
      totalAngle = 2
    }
    else {
      if (arcbarOption.endAngle < arcbarOption.startAngle)
        totalAngle = 2 + arcbarOption.endAngle - arcbarOption.startAngle
      else
        totalAngle = arcbarOption.startAngle - arcbarOption.endAngle
    }
    item._proportion_ = totalAngle * item.data * process + arcbarOption.startAngle
    if (item._proportion_ >= 2)
      item._proportion_ = item._proportion_ % 2
  }
  return series
}

function getGaugeAxisPoints(categories, startAngle, endAngle) {
  let totalAngle
  if (endAngle < startAngle)
    totalAngle = 2 + endAngle - startAngle
  else
    totalAngle = startAngle - endAngle

  let tempStartAngle = startAngle
  for (let i = 0; i < categories.length; i++) {
    categories[i].value = categories[i].value === null ? 0 : categories[i].value
    categories[i]._startAngle_ = tempStartAngle
    categories[i]._endAngle_ = totalAngle * categories[i].value + startAngle
    if (categories[i]._endAngle_ >= 2)
      categories[i]._endAngle_ = categories[i]._endAngle_ % 2

    tempStartAngle = categories[i]._endAngle_
  }
  return categories
}

function getGaugeDataPoints(series, categories, gaugeOption) {
  const process = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    item.data = item.data === null ? 0 : item.data
    if (gaugeOption.pointer.color == 'auto') {
      for (let i = 0; i < categories.length; i++) {
        if (item.data <= categories[i].value) {
          item.color = categories[i].color
          break
        }
      }
    }
    else {
      item.color = gaugeOption.pointer.color
    }
    let totalAngle
    if (gaugeOption.endAngle < gaugeOption.startAngle)
      totalAngle = 2 + gaugeOption.endAngle - gaugeOption.startAngle
    else
      totalAngle = gaugeOption.startAngle - gaugeOption.endAngle

    item._endAngle_ = totalAngle * item.data + gaugeOption.startAngle
    item._oldAngle_ = gaugeOption.oldAngle
    if (gaugeOption.oldAngle < gaugeOption.endAngle)
      item._oldAngle_ += 2

    if (item.data >= gaugeOption.oldData)
      item._proportion_ = (item._endAngle_ - item._oldAngle_) * process + gaugeOption.oldAngle
    else
      item._proportion_ = item._oldAngle_ - (item._oldAngle_ - item._endAngle_) * process

    if (item._proportion_ >= 2)
      item._proportion_ = item._proportion_ % 2
  }
  return series
}

function getPieTextMaxLength(series, config, context, opts) {
  series = getPieDataPoints(series)
  let maxLength = 0
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    const text = item.formatter ? item.formatter(+item._proportion_.toFixed(2)) : `${util.toFixed(item._proportion_ * 100)}%`
    maxLength = Math.max(maxLength, measureText(text, item.textSize * opts.pix || config.fontSize, context))
  }
  return maxLength
}

function fixColumeData(points, eachSpacing, columnLen, index, config, opts) {
  return points.map((item) => {
    if (item === null)
      return null

    let seriesGap = 0
    let categoryGap = 0
    if (opts.type == 'mix') {
      seriesGap = opts.extra.mix.column.seriesGap * opts.pix || 0
      categoryGap = opts.extra.mix.column.categoryGap * opts.pix || 0
    }
    else {
      seriesGap = opts.extra.column.seriesGap * opts.pix || 0
      categoryGap = opts.extra.column.categoryGap * opts.pix || 0
    }
    seriesGap = Math.min(seriesGap, eachSpacing / columnLen)
    categoryGap = Math.min(categoryGap, eachSpacing / columnLen)
    item.width = Math.ceil((eachSpacing - 2 * categoryGap - seriesGap * (columnLen - 1)) / columnLen)
    if (opts.extra.mix && opts.extra.mix.column.width && +opts.extra.mix.column.width > 0)
      item.width = Math.min(item.width, +opts.extra.mix.column.width * opts.pix)

    if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0)
      item.width = Math.min(item.width, +opts.extra.column.width * opts.pix)

    if (item.width <= 0)
      item.width = 1

    item.x += (index + 0.5 - columnLen / 2) * (item.width + seriesGap)
    return item
  })
}

function fixBarData(points, eachSpacing, columnLen, index, config, opts) {
  return points.map((item) => {
    if (item === null)
      return null

    let seriesGap = 0
    let categoryGap = 0
    seriesGap = opts.extra.bar.seriesGap * opts.pix || 0
    categoryGap = opts.extra.bar.categoryGap * opts.pix || 0
    seriesGap = Math.min(seriesGap, eachSpacing / columnLen)
    categoryGap = Math.min(categoryGap, eachSpacing / columnLen)
    item.width = Math.ceil((eachSpacing - 2 * categoryGap - seriesGap * (columnLen - 1)) / columnLen)
    if (opts.extra.bar && opts.extra.bar.width && +opts.extra.bar.width > 0)
      item.width = Math.min(item.width, +opts.extra.bar.width * opts.pix)

    if (item.width <= 0)
      item.width = 1

    item.y += (index + 0.5 - columnLen / 2) * (item.width + seriesGap)
    return item
  })
}

function fixColumeMeterData(points, eachSpacing, columnLen, index, config, opts, border) {
  const categoryGap = opts.extra.column.categoryGap * opts.pix || 0
  return points.map((item) => {
    if (item === null)
      return null

    item.width = eachSpacing - 2 * categoryGap
    if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0)
      item.width = Math.min(item.width, +opts.extra.column.width * opts.pix)

    if (index > 0)
      item.width -= border

    return item
  })
}

function fixColumeStackData(points, eachSpacing, columnLen, index, config, opts, series) {
  const categoryGap = opts.extra.column.categoryGap * opts.pix || 0
  return points.map((item, indexn) => {
    if (item === null)
      return null

    item.width = Math.ceil(eachSpacing - 2 * categoryGap)
    if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0)
      item.width = Math.min(item.width, +opts.extra.column.width * opts.pix)

    if (item.width <= 0)
      item.width = 1

    return item
  })
}

function fixBarStackData(points, eachSpacing, columnLen, index, config, opts, series) {
  const categoryGap = opts.extra.bar.categoryGap * opts.pix || 0
  return points.map((item, indexn) => {
    if (item === null)
      return null

    item.width = Math.ceil(eachSpacing - 2 * categoryGap)
    if (opts.extra.bar && opts.extra.bar.width && +opts.extra.bar.width > 0)
      item.width = Math.min(item.width, +opts.extra.bar.width * opts.pix)

    if (item.width <= 0)
      item.width = 1

    return item
  })
}

function getXAxisPoints(categories, opts, config) {
  const spacingValid = opts.width - opts.area[1] - opts.area[3]
  let dataCount = opts.enableScroll ? Math.min(opts.xAxis.itemCount, categories.length) : categories.length
  if ((opts.type == 'line' || opts.type == 'area' || opts.type == 'scatter' || opts.type == 'bubble' || opts.type == 'bar') && dataCount > 1 && opts.xAxis.boundaryGap == 'justify')
    dataCount -= 1

  let widthRatio = 0
  if (opts.type == 'mount' && opts.extra && opts.extra.mount && opts.extra.mount.widthRatio && opts.extra.mount.widthRatio > 1) {
    if (opts.extra.mount.widthRatio > 2)
      opts.extra.mount.widthRatio = 2
    widthRatio = opts.extra.mount.widthRatio - 1
    dataCount += widthRatio
  }
  const eachSpacing = spacingValid / dataCount
  const xAxisPoints = []
  const startX = opts.area[3]
  const endX = opts.width - opts.area[1]
  categories.forEach((item, index) => {
    xAxisPoints.push(startX + widthRatio / 2 * eachSpacing + index * eachSpacing)
  })
  if (opts.xAxis.boundaryGap !== 'justify') {
    if (opts.enableScroll === true)
      xAxisPoints.push(startX + widthRatio * eachSpacing + categories.length * eachSpacing)
    else
      xAxisPoints.push(endX)
  }
  return {
    xAxisPoints,
    startX,
    endX,
    eachSpacing,
  }
}

function getCandleDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config) {
  const process = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const cPoints = []
      item.forEach((items, indexs) => {
        const point = {}
        point.x = xAxisPoints[index] + Math.round(eachSpacing / 2)
        const value = items.value || items
        let height = validHeight * (value - minRange) / (maxRange - minRange)
        height *= process
        point.y = opts.height - Math.round(height) - opts.area[2]
        cPoints.push(point)
      })
      points.push(cPoints)
    }
  })
  return points
}

function getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config) {
  const process = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1
  let boundaryGap = 'center'
  if (opts.type == 'line' || opts.type == 'area' || opts.type == 'scatter' || opts.type == 'bubble')
    boundaryGap = opts.xAxis.boundaryGap

  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  const validWidth = opts.width - opts.area[1] - opts.area[3]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.x = xAxisPoints[index]
      let value = item
      if (typeof item === 'object' && item !== null) {
        if (item.constructor.toString().includes('Array')) {
          let xranges, xminRange, xmaxRange
          xranges = [].concat(opts.chartData.xAxisData.ranges)
          xminRange = xranges.shift()
          xmaxRange = xranges.pop()
          value = item[1]
          point.x = opts.area[3] + validWidth * (item[0] - xminRange) / (xmaxRange - xminRange)
          if (opts.type == 'bubble') {
            point.r = item[2]
            point.t = item[3]
          }
        }
        else {
          value = item.value
        }
      }
      if (boundaryGap == 'center')
        point.x += eachSpacing / 2

      let height = validHeight * (value - minRange) / (maxRange - minRange)
      height *= process
      point.y = opts.height - height - opts.area[2]
      points.push(point)
    }
  })
  return points
}

function getLineDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, lineOption, process) {
  var process = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 1
  const boundaryGap = opts.xAxis.boundaryGap
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  const validWidth = opts.width - opts.area[1] - opts.area[3]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      if (lineOption.animation == 'vertical') {
        point.x = xAxisPoints[index]
        var value = item
        if (typeof item === 'object' && item !== null) {
          if (item.constructor.toString().includes('Array')) {
            let xranges, xminRange, xmaxRange
            xranges = [].concat(opts.chartData.xAxisData.ranges)
            xminRange = xranges.shift()
            xmaxRange = xranges.pop()
            value = item[1]
            point.x = opts.area[3] + validWidth * (item[0] - xminRange) / (xmaxRange - xminRange)
          }
          else {
            value = item.value
          }
        }
        if (boundaryGap == 'center')
          point.x += eachSpacing / 2

        var height = validHeight * (value - minRange) / (maxRange - minRange)
        height *= process
        point.y = opts.height - height - opts.area[2]
        points.push(point)
      }
      else {
        point.x = xAxisPoints[0] + eachSpacing * index * process
        var value = item
        if (boundaryGap == 'center')
          point.x += eachSpacing / 2

        var height = validHeight * (value - minRange) / (maxRange - minRange)
        point.y = opts.height - height - opts.area[2]
        points.push(point)
      }
    }
  })
  return points
}

function getColumnDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, zeroPoints, process) {
  var process = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 1
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  const validWidth = opts.width - opts.area[1] - opts.area[3]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.x = xAxisPoints[index]
      let value = item
      if (typeof item === 'object' && item !== null) {
        if (item.constructor.toString().includes('Array')) {
          let xranges, xminRange, xmaxRange
          xranges = [].concat(opts.chartData.xAxisData.ranges)
          xminRange = xranges.shift()
          xmaxRange = xranges.pop()
          value = item[1]
          point.x = opts.area[3] + validWidth * (item[0] - xminRange) / (xmaxRange - xminRange)
        }
        else {
          value = item.value
        }
      }
      point.x += eachSpacing / 2
      const height = validHeight * (value * process - minRange) / (maxRange - minRange)
      point.y = opts.height - height - opts.area[2]
      points.push(point)
    }
  })
  return points
}

function getMountDataPoints(series, minRange, maxRange, xAxisPoints, eachSpacing, opts, mountOption, zeroPoints) {
  const process = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 1
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  const validWidth = opts.width - opts.area[1] - opts.area[3]
  const mountWidth = eachSpacing * mountOption.widthRatio
  series.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.x = xAxisPoints[index]
      point.x += eachSpacing / 2
      const value = item.data
      const height = validHeight * (value * process - minRange) / (maxRange - minRange)
      point.y = opts.height - height - opts.area[2]
      point.value = value
      point.width = mountWidth
      points.push(point)
    }
  })
  return points
}

function getBarDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config) {
  const process = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  const validWidth = opts.width - opts.area[1] - opts.area[3]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.y = yAxisPoints[index]
      let value = item
      if (typeof item === 'object' && item !== null)
        value = item.value

      let height = validWidth * (value - minRange) / (maxRange - minRange)
      height *= process
      point.height = height
      point.value = value
      point.x = height + opts.area[3]
      points.push(point)
    }
  })
  return points
}

function getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex, stackSeries) {
  const process = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 1
  const points = []
  const validHeight = opts.height - opts.area[0] - opts.area[2]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.x = xAxisPoints[index] + Math.round(eachSpacing / 2)

      if (seriesIndex > 0) {
        var value = 0
        for (let i = 0; i <= seriesIndex; i++)
          value += stackSeries[i].data[index]

        const value0 = value - item
        var height = validHeight * (value - minRange) / (maxRange - minRange)
        var height0 = validHeight * (value0 - minRange) / (maxRange - minRange)
      }
      else {
        var value = item
        if (typeof item === 'object' && item !== null)
          value = item.value

        var height = validHeight * (value - minRange) / (maxRange - minRange)
        var height0 = 0
      }
      let heightc = height0
      height *= process
      heightc *= process
      point.y = opts.height - Math.round(height) - opts.area[2]
      point.y0 = opts.height - Math.round(heightc) - opts.area[2]
      points.push(point)
    }
  })
  return points
}

function getBarStackDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, seriesIndex, stackSeries) {
  const process = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 1
  const points = []
  const validHeight = opts.width - opts.area[1] - opts.area[3]
  data.forEach((item, index) => {
    if (item === null) {
      points.push(null)
    }
    else {
      const point = {}
      point.color = item.color
      point.y = yAxisPoints[index]
      if (seriesIndex > 0) {
        var value = 0
        for (let i = 0; i <= seriesIndex; i++)
          value += stackSeries[i].data[index]

        const value0 = value - item
        var height = validHeight * (value - minRange) / (maxRange - minRange)
        var height0 = validHeight * (value0 - minRange) / (maxRange - minRange)
      }
      else {
        var value = item
        if (typeof item === 'object' && item !== null)
          value = item.value

        var height = validHeight * (value - minRange) / (maxRange - minRange)
        var height0 = 0
      }
      let heightc = height0
      height *= process
      heightc *= process
      point.height = height - heightc
      point.x = opts.area[3] + height
      point.x0 = opts.area[3] + heightc
      points.push(point)
    }
  })
  return points
}

function getYAxisTextList(series, opts, config, stack, yData) {
  const index = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : -1
  let data
  if (stack == 'stack')
    data = dataCombineStack(series, opts.categories.length)
  else
    data = dataCombine(series)

  const sorted = []
  // remove null from data
  data = data.filter((item) => {
    // return item !== null;
    if (typeof item === 'object' && item !== null) {
      if (item.constructor.toString().includes('Array'))
        return item !== null
      else
        return item.value !== null
    }
    else {
      return item !== null
    }
  })
  data.map((item) => {
    if (typeof item === 'object') {
      if (item.constructor.toString().includes('Array')) {
        if (opts.type == 'candle') {
          item.map((subitem) => {
            sorted.push(subitem)
          })
        }
        else {
          sorted.push(item[1])
        }
      }
      else {
        sorted.push(item.value)
      }
    }
    else {
      sorted.push(item)
    }
  })
  let minData = yData.min || 0
  let maxData = yData.max || 0
  if (sorted.length > 0) {
    minData = Math.min.apply(this, sorted)
    maxData = Math.max.apply(this, sorted)
  }
  if (minData === maxData) {
    if (maxData == 0)
      maxData = 10
    else
      minData = 0
  }
  const dataRange = getDataRange(minData, maxData)
  const minRange = (yData.min === undefined || yData.min === null) ? dataRange.minRange : yData.min
  const maxRange = (yData.max === undefined || yData.max === null) ? dataRange.maxRange : yData.max
  const eachRange = (maxRange - minRange) / opts.yAxis.splitNumber
  const range = []
  for (let i = 0; i <= opts.yAxis.splitNumber; i++)
    range.push(minRange + eachRange * i)

  return range.reverse()
}

function calYAxisData(series, opts, config, context) {
  // 堆叠图重算Y轴
  const columnstyle = assign({}, {
    type: '',
  }, opts.extra.column)
  // 如果是多Y轴，重新计算
  const YLength = opts.yAxis.data.length
  const newSeries = new Array(YLength)
  if (YLength > 0) {
    for (let i = 0; i < YLength; i++) {
      newSeries[i] = []
      for (let j = 0; j < series.length; j++) {
        if (series[j].index == i)
          newSeries[i].push(series[j])
      }
    }
    var rangesArr = new Array(YLength)
    var rangesFormatArr = new Array(YLength)
    var yAxisWidthArr = new Array(YLength)

    for (let i = 0; i < YLength; i++) {
      const yData = opts.yAxis.data[i]
      // 如果总开关不显示，强制每个Y轴为不显示
      if (opts.yAxis.disabled == true)
        yData.disabled = true

      if (yData.type === 'categories') {
        if (!yData.formatter)
          yData.formatter = (val, index, opts) => { return val + (yData.unit || '') }

        yData.categories = yData.categories || opts.categories
        rangesArr[i] = yData.categories
      }
      else {
        if (!yData.formatter)
          yData.formatter = (val, index, opts) => { return util.toFixed(val, yData.tofix || 0) + (yData.unit || '') }

        rangesArr[i] = getYAxisTextList(newSeries[i], opts, config, columnstyle.type, yData, i)
      }
      const yAxisFontSizes = yData.fontSize * opts.pix || config.fontSize
      yAxisWidthArr[i] = {
        position: yData.position ? yData.position : 'left',
        width: 0,
      }
      rangesFormatArr[i] = rangesArr[i].map((items, index) => {
        items = yData.formatter(items, index, opts)
        yAxisWidthArr[i].width = Math.max(yAxisWidthArr[i].width, measureText(items, yAxisFontSizes, context) + 5)
        return items
      })
      const calibration = yData.calibration ? 4 * opts.pix : 0
      yAxisWidthArr[i].width += calibration + 3 * opts.pix
      if (yData.disabled === true)
        yAxisWidthArr[i].width = 0
    }
  }
  else {
    var rangesArr = Array.from({ length: 1 })
    var rangesFormatArr = Array.from({ length: 1 })
    var yAxisWidthArr = Array.from({ length: 1 })
    if (opts.type === 'bar') {
      rangesArr[0] = opts.categories
      if (!opts.yAxis.formatter)
        opts.yAxis.formatter = (val, index, opts) => { return val + (opts.yAxis.unit || '') }
    }
    else {
      if (!opts.yAxis.formatter)
        opts.yAxis.formatter = (val, index, opts) => { return val.toFixed(opts.yAxis.tofix) + (opts.yAxis.unit || '') }

      rangesArr[0] = getYAxisTextList(series, opts, config, columnstyle.type, {})
    }
    yAxisWidthArr[0] = {
      position: 'left',
      width: 0,
    }
    const yAxisFontSize = opts.yAxis.fontSize * opts.pix || config.fontSize
    rangesFormatArr[0] = rangesArr[0].map((item, index) => {
      item = opts.yAxis.formatter(item, index, opts)
      yAxisWidthArr[0].width = Math.max(yAxisWidthArr[0].width, measureText(item, yAxisFontSize, context) + 5)
      return item
    })
    yAxisWidthArr[0].width += 3 * opts.pix
    if (opts.yAxis.disabled === true) {
      yAxisWidthArr[0] = {
        position: 'left',
        width: 0,
      }
      opts.yAxis.data[0] = {
        disabled: true,
      }
    }
    else {
      opts.yAxis.data[0] = {
        disabled: false,
        position: 'left',
        max: opts.yAxis.max,
        min: opts.yAxis.min,
        formatter: opts.yAxis.formatter,
      }
      if (opts.type === 'bar') {
        opts.yAxis.data[0].categories = opts.categories
        opts.yAxis.data[0].type = 'categories'
      }
    }
  }
  return {
    rangesFormat: rangesFormatArr,
    ranges: rangesArr,
    yAxisWidth: yAxisWidthArr,
  }
}

function calTooltipYAxisData(point, series, opts, config, eachSpacing) {
  const ranges = [].concat(opts.chartData.yAxisData.ranges)
  const spacingValid = opts.height - opts.area[0] - opts.area[2]
  const minAxis = opts.area[0]
  const items = []
  for (let i = 0; i < ranges.length; i++) {
    const maxVal = Math.max.apply(this, ranges[i])
    const minVal = Math.min.apply(this, ranges[i])
    let item = maxVal - (maxVal - minVal) * (point - minAxis) / spacingValid
    item = opts.yAxis.data && opts.yAxis.data[i].formatter ? opts.yAxis.data[i].formatter(item, i, opts) : item.toFixed(0)
    items.push(String(item))
  }
  return items
}

function calMarkLineData(points, opts) {
  let minRange, maxRange
  const spacingValid = opts.height - opts.area[0] - opts.area[2]
  for (let i = 0; i < points.length; i++) {
    points[i].yAxisIndex = points[i].yAxisIndex ? points[i].yAxisIndex : 0
    const range = [].concat(opts.chartData.yAxisData.ranges[points[i].yAxisIndex])
    minRange = range.pop()
    maxRange = range.shift()
    const height = spacingValid * (points[i].value - minRange) / (maxRange - minRange)
    points[i].y = opts.height - Math.round(height) - opts.area[2]
  }
  return points
}

function contextRotate(context, opts) {
  if (opts.rotateLock !== true) {
    context.translate(opts.height, 0)
    context.rotate(90 * Math.PI / 180)
  }
  else if (opts._rotate_ !== true) {
    context.translate(opts.height, 0)
    context.rotate(90 * Math.PI / 180)
    opts._rotate_ = true
  }
}

function drawPointShape(points, color, shape, context, opts) {
  context.beginPath()
  if (opts.dataPointShapeType == 'hollow') {
    context.setStrokeStyle(color)
    context.setFillStyle(opts.background)
    context.setLineWidth(2 * opts.pix)
  }
  else {
    context.setStrokeStyle('#ffffff')
    context.setFillStyle(color)
    context.setLineWidth(1 * opts.pix)
  }
  if (shape === 'diamond') {
    points.forEach((item, index) => {
      if (item !== null) {
        context.moveTo(item.x, item.y - 4.5)
        context.lineTo(item.x - 4.5, item.y)
        context.lineTo(item.x, item.y + 4.5)
        context.lineTo(item.x + 4.5, item.y)
        context.lineTo(item.x, item.y - 4.5)
      }
    })
  }
  else if (shape === 'circle') {
    points.forEach((item, index) => {
      if (item !== null) {
        context.moveTo(item.x + 2.5 * opts.pix, item.y)
        context.arc(item.x, item.y, 3 * opts.pix, 0, 2 * Math.PI, false)
      }
    })
  }
  else if (shape === 'square') {
    points.forEach((item, index) => {
      if (item !== null) {
        context.moveTo(item.x - 3.5, item.y - 3.5)
        context.rect(item.x - 3.5, item.y - 3.5, 7, 7)
      }
    })
  }
  else if (shape === 'triangle') {
    points.forEach((item, index) => {
      if (item !== null) {
        context.moveTo(item.x, item.y - 4.5)
        context.lineTo(item.x - 4.5, item.y + 4.5)
        context.lineTo(item.x + 4.5, item.y + 4.5)
        context.lineTo(item.x, item.y - 4.5)
      }
    })
  }
  else if (shape === 'none') {
    return
  }
  context.closePath()
  context.fill()
  context.stroke()
}

function drawActivePoint(points, color, shape, context, opts, option, seriesIndex) {
  if (!opts.tooltip)
    return

  if (opts.tooltip.group.length > 0 && opts.tooltip.group.includes(seriesIndex) == false)
    return

  const pointIndex = typeof opts.tooltip.index === 'number' ? opts.tooltip.index : opts.tooltip.index[opts.tooltip.group.indexOf(seriesIndex)]
  context.beginPath()
  if (option.activeType == 'hollow') {
    context.setStrokeStyle(color)
    context.setFillStyle(opts.background)
    context.setLineWidth(2 * opts.pix)
  }
  else {
    context.setStrokeStyle('#ffffff')
    context.setFillStyle(color)
    context.setLineWidth(1 * opts.pix)
  }
  if (shape === 'diamond') {
    points.forEach((item, index) => {
      if (item !== null && pointIndex == index) {
        context.moveTo(item.x, item.y - 4.5)
        context.lineTo(item.x - 4.5, item.y)
        context.lineTo(item.x, item.y + 4.5)
        context.lineTo(item.x + 4.5, item.y)
        context.lineTo(item.x, item.y - 4.5)
      }
    })
  }
  else if (shape === 'circle') {
    points.forEach((item, index) => {
      if (item !== null && pointIndex == index) {
        context.moveTo(item.x + 2.5 * opts.pix, item.y)
        context.arc(item.x, item.y, 3 * opts.pix, 0, 2 * Math.PI, false)
      }
    })
  }
  else if (shape === 'square') {
    points.forEach((item, index) => {
      if (item !== null && pointIndex == index) {
        context.moveTo(item.x - 3.5, item.y - 3.5)
        context.rect(item.x - 3.5, item.y - 3.5, 7, 7)
      }
    })
  }
  else if (shape === 'triangle') {
    points.forEach((item, index) => {
      if (item !== null && pointIndex == index) {
        context.moveTo(item.x, item.y - 4.5)
        context.lineTo(item.x - 4.5, item.y + 4.5)
        context.lineTo(item.x + 4.5, item.y + 4.5)
        context.lineTo(item.x, item.y - 4.5)
      }
    })
  }
  else if (shape === 'none') {
    return
  }
  context.closePath()
  context.fill()
  context.stroke()
}

function drawRingTitle(opts, config, context, center) {
  const titlefontSize = opts.title.fontSize || config.titleFontSize
  const subtitlefontSize = opts.subtitle.fontSize || config.subtitleFontSize
  const title = opts.title.name || ''
  const subtitle = opts.subtitle.name || ''
  const titleFontColor = opts.title.color || opts.fontColor
  const subtitleFontColor = opts.subtitle.color || opts.fontColor
  const titleHeight = title ? titlefontSize : 0
  const subtitleHeight = subtitle ? subtitlefontSize : 0
  const margin = 5
  if (subtitle) {
    const textWidth = measureText(subtitle, subtitlefontSize * opts.pix, context)
    const startX = center.x - textWidth / 2 + (opts.subtitle.offsetX || 0) * opts.pix
    let startY = center.y + subtitlefontSize * opts.pix / 2 + (opts.subtitle.offsetY || 0) * opts.pix
    if (title)
      startY += (titleHeight * opts.pix + margin) / 2

    context.beginPath()
    context.setFontSize(subtitlefontSize * opts.pix)
    context.setFillStyle(subtitleFontColor)
    context.fillText(subtitle, startX, startY)
    context.closePath()
    context.stroke()
  }
  if (title) {
    const _textWidth = measureText(title, titlefontSize * opts.pix, context)
    const _startX = center.x - _textWidth / 2 + (opts.title.offsetX || 0)
    let _startY = center.y + titlefontSize * opts.pix / 2 + (opts.title.offsetY || 0) * opts.pix
    if (subtitle)
      _startY -= (subtitleHeight * opts.pix + margin) / 2

    context.beginPath()
    context.setFontSize(titlefontSize * opts.pix)
    context.setFillStyle(titleFontColor)
    context.fillText(title, _startX, _startY)
    context.closePath()
    context.stroke()
  }
}

function drawPointText(points, series, config, context, opts) {
  // 绘制数据文案
  const data = series.data
  const textOffset = series.textOffset ? series.textOffset : 0
  points.forEach((item, index) => {
    if (item !== null) {
      context.beginPath()
      const fontSize = series.textSize ? series.textSize * opts.pix : config.fontSize
      context.setFontSize(fontSize)
      context.setFillStyle(series.textColor || opts.fontColor)
      let value = data[index]
      if (typeof data[index] === 'object' && data[index] !== null) {
        if (data[index].constructor.toString().includes('Array'))
          value = data[index][1]
        else
          value = data[index].value
      }
      const formatVal = series.formatter ? series.formatter(value, index, series, opts) : value
      context.setTextAlign('center')
      context.fillText(String(formatVal), item.x, item.y - 4 + textOffset * opts.pix)
      context.closePath()
      context.stroke()
      context.setTextAlign('left')
    }
  })
}

function drawColumePointText(points, series, config, context, opts) {
  // 绘制数据文案
  const data = series.data
  const textOffset = series.textOffset ? series.textOffset : 0
  const Position = opts.extra.column.labelPosition
  points.forEach((item, index) => {
    if (item !== null) {
      context.beginPath()
      const fontSize = series.textSize ? series.textSize * opts.pix : config.fontSize
      context.setFontSize(fontSize)
      context.setFillStyle(series.textColor || opts.fontColor)
      let value = data[index]
      if (typeof data[index] === 'object' && data[index] !== null) {
        if (data[index].constructor.toString().includes('Array'))
          value = data[index][1]
        else
          value = data[index].value
      }
      const formatVal = series.formatter ? series.formatter(value, index, series, opts) : value
      context.setTextAlign('center')
      let startY = item.y - 4 * opts.pix + textOffset * opts.pix
      if (item.y > series.zeroPoints)
        startY = item.y + textOffset * opts.pix + fontSize

      if (Position == 'insideTop') {
        startY = item.y + fontSize + textOffset * opts.pix
        if (item.y > series.zeroPoints)
          startY = item.y - textOffset * opts.pix - 4 * opts.pix
      }
      if (Position == 'center') {
        startY = item.y + textOffset * opts.pix + (opts.height - opts.area[2] - item.y + fontSize) / 2
        if (series.zeroPoints < opts.height - opts.area[2])
          startY = item.y + textOffset * opts.pix + (series.zeroPoints - item.y + fontSize) / 2

        if (item.y > series.zeroPoints)
          startY = item.y - textOffset * opts.pix - (item.y - series.zeroPoints - fontSize) / 2

        if (opts.extra.column.type == 'stack')
          startY = item.y + textOffset * opts.pix + (item.y0 - item.y + fontSize) / 2
      }
      if (Position == 'bottom') {
        startY = opts.height - opts.area[2] + textOffset * opts.pix - 4 * opts.pix
        if (series.zeroPoints < opts.height - opts.area[2])
          startY = series.zeroPoints + textOffset * opts.pix - 4 * opts.pix

        if (item.y > series.zeroPoints)
          startY = series.zeroPoints - textOffset * opts.pix + fontSize + 2 * opts.pix

        if (opts.extra.column.type == 'stack')
          startY = item.y0 + textOffset * opts.pix - 4 * opts.pix
      }
      context.fillText(String(formatVal), item.x, startY)
      context.closePath()
      context.stroke()
      context.setTextAlign('left')
    }
  })
}

function drawMountPointText(points, series, config, context, opts, zeroPoints) {
  // 绘制数据文案
  const data = series.data
  const textOffset = series.textOffset ? series.textOffset : 0
  const Position = opts.extra.mount.labelPosition
  points.forEach((item, index) => {
    if (item !== null) {
      context.beginPath()
      const fontSize = series[index].textSize ? series[index].textSize * opts.pix : config.fontSize
      context.setFontSize(fontSize)
      context.setFillStyle(series[index].textColor || opts.fontColor)
      const value = item.value
      const formatVal = series[index].formatter ? series[index].formatter(value, index, series, opts) : value
      context.setTextAlign('center')
      let startY = item.y - 4 * opts.pix + textOffset * opts.pix
      if (item.y > zeroPoints)
        startY = item.y + textOffset * opts.pix + fontSize

      context.fillText(String(formatVal), item.x, startY)
      context.closePath()
      context.stroke()
      context.setTextAlign('left')
    }
  })
}

function drawBarPointText(points, series, config, context, opts) {
  // 绘制数据文案
  const data = series.data
  const textOffset = series.textOffset ? series.textOffset : 0
  points.forEach((item, index) => {
    if (item !== null) {
      context.beginPath()
      const fontSize = series.textSize ? series.textSize * opts.pix : config.fontSize
      context.setFontSize(fontSize)
      context.setFillStyle(series.textColor || opts.fontColor)
      let value = data[index]
      if (typeof data[index] === 'object' && data[index] !== null)
        value = data[index].value

      const formatVal = series.formatter ? series.formatter(value, index, series, opts) : value
      context.setTextAlign('left')
      context.fillText(String(formatVal), item.x + 4 * opts.pix, item.y + fontSize / 2 - 3)
      context.closePath()
      context.stroke()
    }
  })
}

function drawGaugeLabel(gaugeOption, radius, centerPosition, opts, config, context) {
  radius -= gaugeOption.width / 2 + gaugeOption.labelOffset * opts.pix
  radius = radius < 10 ? 10 : radius
  let totalAngle
  if (gaugeOption.endAngle < gaugeOption.startAngle)
    totalAngle = 2 + gaugeOption.endAngle - gaugeOption.startAngle
  else
    totalAngle = gaugeOption.startAngle - gaugeOption.endAngle

  const splitAngle = totalAngle / gaugeOption.splitLine.splitNumber
  const totalNumber = gaugeOption.endNumber - gaugeOption.startNumber
  const splitNumber = totalNumber / gaugeOption.splitLine.splitNumber
  let nowAngle = gaugeOption.startAngle
  let nowNumber = gaugeOption.startNumber
  for (let i = 0; i < gaugeOption.splitLine.splitNumber + 1; i++) {
    const pos = {
      x: radius * Math.cos(nowAngle * Math.PI),
      y: radius * Math.sin(nowAngle * Math.PI),
    }
    const labelText = gaugeOption.formatter ? gaugeOption.formatter(nowNumber, i, opts) : nowNumber
    pos.x += centerPosition.x - measureText(labelText, config.fontSize, context) / 2
    pos.y += centerPosition.y
    const startX = pos.x
    const startY = pos.y
    context.beginPath()
    context.setFontSize(config.fontSize)
    context.setFillStyle(gaugeOption.labelColor || opts.fontColor)
    context.fillText(labelText, startX, startY + config.fontSize / 2)
    context.closePath()
    context.stroke()
    nowAngle += splitAngle
    if (nowAngle >= 2)
      nowAngle = nowAngle % 2

    nowNumber += splitNumber
  }
}

function drawRadarLabel(angleList, radius, centerPosition, opts, config, context) {
  const radarOption = opts.extra.radar || {}
  angleList.forEach((angle, index) => {
    if (radarOption.labelPointShow === true && opts.categories[index] !== '') {
      const posPoint = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      }
      const posPointAxis = convertCoordinateOrigin(posPoint.x, posPoint.y, centerPosition)
      context.setFillStyle(radarOption.labelPointColor)
      context.beginPath()
      context.arc(posPointAxis.x, posPointAxis.y, radarOption.labelPointRadius * opts.pix, 0, 2 * Math.PI, false)
      context.closePath()
      context.fill()
    }
    if (radarOption.labelShow === true) {
      const pos = {
        x: (radius + config.radarLabelTextMargin * opts.pix) * Math.cos(angle),
        y: (radius + config.radarLabelTextMargin * opts.pix) * Math.sin(angle),
      }
      const posRelativeCanvas = convertCoordinateOrigin(pos.x, pos.y, centerPosition)
      let startX = posRelativeCanvas.x
      const startY = posRelativeCanvas.y
      if (util.approximatelyEqual(pos.x, 0))
        startX -= measureText(opts.categories[index] || '', config.fontSize, context) / 2
      else if (pos.x < 0)
        startX -= measureText(opts.categories[index] || '', config.fontSize, context)

      context.beginPath()
      context.setFontSize(config.fontSize)
      context.setFillStyle(radarOption.labelColor || opts.fontColor)
      context.fillText(opts.categories[index] || '', startX, startY + config.fontSize / 2)
      context.closePath()
      context.stroke()
    }
  })
}

function drawPieText(series, opts, config, context, radius, center) {
  const lineRadius = config.pieChartLinePadding
  const textObjectCollection = []
  let lastTextObject = null
  const seriesConvert = series.map((item, index) => {
    let text = item.formatter ? item.formatter(item, index, series, opts) : `${util.toFixed(item._proportion_.toFixed(4) * 100)}%`
    text = item.labelText ? item.labelText : text
    let arc = 2 * Math.PI - (item._start_ + 2 * Math.PI * item._proportion_ / 2)
    if (item._rose_proportion_)
      arc = 2 * Math.PI - (item._start_ + 2 * Math.PI * item._rose_proportion_ / 2)

    const color = item.color
    const radius = item._radius_
    return {
      arc,
      text,
      color,
      radius,
      textColor: item.textColor,
      textSize: item.textSize,
      labelShow: item.labelShow,
    }
  })
  for (let i = 0; i < seriesConvert.length; i++) {
    const item = seriesConvert[i]
    // line end
    const orginX1 = Math.cos(item.arc) * (item.radius + lineRadius)
    const orginY1 = Math.sin(item.arc) * (item.radius + lineRadius)
    // line start
    const orginX2 = Math.cos(item.arc) * item.radius
    const orginY2 = Math.sin(item.arc) * item.radius
    // text start
    let orginX3 = orginX1 >= 0 ? orginX1 + config.pieChartTextPadding : orginX1 - config.pieChartTextPadding
    const orginY3 = orginY1
    const textWidth = measureText(item.text, item.textSize * opts.pix || config.fontSize, context)
    let startY = orginY3
    if (lastTextObject && util.isSameXCoordinateArea(lastTextObject.start, {
      x: orginX3,
    })) {
      if (orginX3 > 0) {
        startY = Math.min(orginY3, lastTextObject.start.y)
      }
      else if (orginX1 < 0) {
        startY = Math.max(orginY3, lastTextObject.start.y)
      }
      else {
        if (orginY3 > 0)
          startY = Math.max(orginY3, lastTextObject.start.y)
        else
          startY = Math.min(orginY3, lastTextObject.start.y)
      }
    }
    if (orginX3 < 0)
      orginX3 -= textWidth

    const textObject = {
      lineStart: {
        x: orginX2,
        y: orginY2,
      },
      lineEnd: {
        x: orginX1,
        y: orginY1,
      },
      start: {
        x: orginX3,
        y: startY,
      },
      width: textWidth,
      height: config.fontSize,
      text: item.text,
      color: item.color,
      textColor: item.textColor,
      textSize: item.textSize,
    }
    lastTextObject = avoidCollision(textObject, lastTextObject)
    textObjectCollection.push(lastTextObject)
  }
  for (let i = 0; i < textObjectCollection.length; i++) {
    if (seriesConvert[i].labelShow === false)
      continue

    const item = textObjectCollection[i]
    const lineStartPoistion = convertCoordinateOrigin(item.lineStart.x, item.lineStart.y, center)
    const lineEndPoistion = convertCoordinateOrigin(item.lineEnd.x, item.lineEnd.y, center)
    const textPosition = convertCoordinateOrigin(item.start.x, item.start.y, center)
    context.setLineWidth(1 * opts.pix)
    context.setFontSize(item.textSize * opts.pix || config.fontSize)
    context.beginPath()
    context.setStrokeStyle(item.color)
    context.setFillStyle(item.color)
    context.moveTo(lineStartPoistion.x, lineStartPoistion.y)
    const curveStartX = item.start.x < 0 ? textPosition.x + item.width : textPosition.x
    const textStartX = item.start.x < 0 ? textPosition.x - 5 : textPosition.x + 5
    context.quadraticCurveTo(lineEndPoistion.x, lineEndPoistion.y, curveStartX, textPosition.y)
    context.moveTo(lineStartPoistion.x, lineStartPoistion.y)
    context.stroke()
    context.closePath()
    context.beginPath()
    context.moveTo(textPosition.x + item.width, textPosition.y)
    context.arc(curveStartX, textPosition.y, 2 * opts.pix, 0, 2 * Math.PI)
    context.closePath()
    context.fill()
    context.beginPath()
    context.setFontSize(item.textSize * opts.pix || config.fontSize)
    context.setFillStyle(item.textColor || opts.fontColor)
    context.fillText(item.text, textStartX, textPosition.y + 3)
    context.closePath()
    context.stroke()
    context.closePath()
  }
}

function drawToolTipSplitLine(offsetX, opts, config, context) {
  const toolTipOption = opts.extra.tooltip || {}
  toolTipOption.gridType = toolTipOption.gridType == undefined ? 'solid' : toolTipOption.gridType
  toolTipOption.dashLength = toolTipOption.dashLength == undefined ? 4 : toolTipOption.dashLength
  const startY = opts.area[0]
  const endY = opts.height - opts.area[2]
  if (toolTipOption.gridType == 'dash')
    context.setLineDash([toolTipOption.dashLength, toolTipOption.dashLength])

  context.setStrokeStyle(toolTipOption.gridColor || '#cccccc')
  context.setLineWidth(1 * opts.pix)
  context.beginPath()
  context.moveTo(offsetX, startY)
  context.lineTo(offsetX, endY)
  context.stroke()
  context.setLineDash([])
  if (toolTipOption.xAxisLabel) {
    const labelText = opts.categories[opts.tooltip.index]
    context.setFontSize(config.fontSize)
    const textWidth = measureText(labelText, config.fontSize, context)
    const textX = offsetX - 0.5 * textWidth
    const textY = endY + 2 * opts.pix
    context.beginPath()
    context.setFillStyle(hexToRgb(toolTipOption.labelBgColor || config.toolTipBackground, toolTipOption.labelBgOpacity || config.toolTipOpacity))
    context.setStrokeStyle(toolTipOption.labelBgColor || config.toolTipBackground)
    context.setLineWidth(1 * opts.pix)
    context.rect(textX - toolTipOption.boxPadding * opts.pix, textY, textWidth + 2 * toolTipOption.boxPadding * opts.pix, config.fontSize + 2 * toolTipOption.boxPadding * opts.pix)
    context.closePath()
    context.stroke()
    context.fill()
    context.beginPath()
    context.setFontSize(config.fontSize)
    context.setFillStyle(toolTipOption.labelFontColor || opts.fontColor)
    context.fillText(String(labelText), textX, textY + toolTipOption.boxPadding * opts.pix + config.fontSize)
    context.closePath()
    context.stroke()
  }
}

function drawMarkLine(opts, config, context) {
  const markLineOption = assign({}, {
    type: 'solid',
    dashLength: 4,
    data: [],
  }, opts.extra.markLine)
  const startX = opts.area[3]
  const endX = opts.width - opts.area[1]
  const points = calMarkLineData(markLineOption.data, opts)
  for (let i = 0; i < points.length; i++) {
    const item = assign({}, {
      lineColor: '#DE4A42',
      showLabel: false,
      labelFontSize: 13,
      labelPadding: 6,
      labelFontColor: '#666666',
      labelBgColor: '#DFE8FF',
      labelBgOpacity: 0.8,
      labelAlign: 'left',
      labelOffsetX: 0,
      labelOffsetY: 0,
    }, points[i])
    if (markLineOption.type == 'dash')
      context.setLineDash([markLineOption.dashLength, markLineOption.dashLength])

    context.setStrokeStyle(item.lineColor)
    context.setLineWidth(1 * opts.pix)
    context.beginPath()
    context.moveTo(startX, item.y)
    context.lineTo(endX, item.y)
    context.stroke()
    context.setLineDash([])
    if (item.showLabel) {
      const fontSize = item.labelFontSize * opts.pix
      const labelText = item.labelText ? item.labelText : item.value
      context.setFontSize(fontSize)
      const textWidth = measureText(labelText, fontSize, context)
      const bgWidth = textWidth + item.labelPadding * opts.pix * 2
      let bgStartX = item.labelAlign == 'left' ? opts.area[3] - bgWidth : opts.width - opts.area[1]
      bgStartX += item.labelOffsetX
      let bgStartY = item.y - 0.5 * fontSize - item.labelPadding * opts.pix
      bgStartY += item.labelOffsetY
      const textX = bgStartX + item.labelPadding * opts.pix
      const textY = item.y
      context.setFillStyle(hexToRgb(item.labelBgColor, item.labelBgOpacity))
      context.setStrokeStyle(item.labelBgColor)
      context.setLineWidth(1 * opts.pix)
      context.beginPath()
      context.rect(bgStartX, bgStartY, bgWidth, fontSize + 2 * item.labelPadding * opts.pix)
      context.closePath()
      context.stroke()
      context.fill()
      context.setFontSize(fontSize)
      context.setTextAlign('left')
      context.setFillStyle(item.labelFontColor)
      context.fillText(String(labelText), textX, bgStartY + fontSize + item.labelPadding * opts.pix / 2)
      context.stroke()
      context.setTextAlign('left')
    }
  }
}

function drawToolTipHorizentalLine(opts, config, context, eachSpacing, xAxisPoints) {
  const toolTipOption = assign({}, {
    gridType: 'solid',
    dashLength: 4,
  }, opts.extra.tooltip)
  const startX = opts.area[3]
  const endX = opts.width - opts.area[1]
  if (toolTipOption.gridType == 'dash')
    context.setLineDash([toolTipOption.dashLength, toolTipOption.dashLength])

  context.setStrokeStyle(toolTipOption.gridColor || '#cccccc')
  context.setLineWidth(1 * opts.pix)
  context.beginPath()
  context.moveTo(startX, opts.tooltip.offset.y)
  context.lineTo(endX, opts.tooltip.offset.y)
  context.stroke()
  context.setLineDash([])
  if (toolTipOption.yAxisLabel) {
    const boxPadding = toolTipOption.boxPadding * opts.pix
    const labelText = calTooltipYAxisData(opts.tooltip.offset.y, opts.series, opts, config, eachSpacing)
    const widthArr = opts.chartData.yAxisData.yAxisWidth
    let tStartLeft = opts.area[3]
    let tStartRight = opts.width - opts.area[1]
    for (let i = 0; i < labelText.length; i++) {
      context.setFontSize(toolTipOption.fontSize * opts.pix)
      const textWidth = measureText(labelText[i], toolTipOption.fontSize * opts.pix, context)
      let bgStartX, bgEndX, bgWidth
      if (widthArr[i].position == 'left') {
        bgStartX = tStartLeft - (textWidth + boxPadding * 2) - 2 * opts.pix
        bgEndX = Math.max(bgStartX, bgStartX + textWidth + boxPadding * 2)
      }
      else {
        bgStartX = tStartRight + 2 * opts.pix
        bgEndX = Math.max(bgStartX + widthArr[i].width, bgStartX + textWidth + boxPadding * 2)
      }
      bgWidth = bgEndX - bgStartX
      const textX = bgStartX + (bgWidth - textWidth) / 2
      const textY = opts.tooltip.offset.y
      context.beginPath()
      context.setFillStyle(hexToRgb(toolTipOption.labelBgColor || config.toolTipBackground, toolTipOption.labelBgOpacity || config.toolTipOpacity))
      context.setStrokeStyle(toolTipOption.labelBgColor || config.toolTipBackground)
      context.setLineWidth(1 * opts.pix)
      context.rect(bgStartX, textY - 0.5 * config.fontSize - boxPadding, bgWidth, config.fontSize + 2 * boxPadding)
      context.closePath()
      context.stroke()
      context.fill()
      context.beginPath()
      context.setFontSize(config.fontSize)
      context.setFillStyle(toolTipOption.labelFontColor || opts.fontColor)
      context.fillText(labelText[i], textX, textY + 0.5 * config.fontSize)
      context.closePath()
      context.stroke()
      if (widthArr[i].position == 'left')
        tStartLeft -= (widthArr[i].width + opts.yAxis.padding * opts.pix)
      else
        tStartRight += widthArr[i].width + opts.yAxis.padding * opts.pix
    }
  }
}

function drawToolTipSplitArea(offsetX, opts, config, context, eachSpacing) {
  const toolTipOption = assign({}, {
    activeBgColor: '#000000',
    activeBgOpacity: 0.08,
    activeWidth: eachSpacing,
  }, opts.extra.column)
  toolTipOption.activeWidth = toolTipOption.activeWidth > eachSpacing ? eachSpacing : toolTipOption.activeWidth
  const startY = opts.area[0]
  const endY = opts.height - opts.area[2]
  context.beginPath()
  context.setFillStyle(hexToRgb(toolTipOption.activeBgColor, toolTipOption.activeBgOpacity))
  context.rect(offsetX - toolTipOption.activeWidth / 2, startY, toolTipOption.activeWidth, endY - startY)
  context.closePath()
  context.fill()
  context.setFillStyle('#FFFFFF')
}

function drawBarToolTipSplitArea(offsetX, opts, config, context, eachSpacing) {
  const toolTipOption = assign({}, {
    activeBgColor: '#000000',
    activeBgOpacity: 0.08,
  }, opts.extra.bar)
  const startX = opts.area[3]
  const endX = opts.width - opts.area[1]
  context.beginPath()
  context.setFillStyle(hexToRgb(toolTipOption.activeBgColor, toolTipOption.activeBgOpacity))
  context.rect(startX, offsetX - eachSpacing / 2, endX - startX, eachSpacing)
  context.closePath()
  context.fill()
  context.setFillStyle('#FFFFFF')
}

function drawToolTip(textList, offset, opts, config, context, eachSpacing, xAxisPoints) {
  const toolTipOption = assign({}, {
    showBox: true,
    showArrow: true,
    showCategory: false,
    bgColor: '#000000',
    bgOpacity: 0.7,
    borderColor: '#000000',
    borderWidth: 0,
    borderRadius: 0,
    borderOpacity: 0.7,
    boxPadding: 3,
    fontColor: '#FFFFFF',
    fontSize: 13,
    lineHeight: 20,
    legendShow: true,
    legendShape: 'auto',
    splitLine: true,
  }, opts.extra.tooltip)
  if (toolTipOption.showCategory == true && opts.categories)
    textList.unshift({ text: opts.categories[opts.tooltip.index], color: null })

  const fontSize = toolTipOption.fontSize * opts.pix
  const lineHeight = toolTipOption.lineHeight * opts.pix
  const boxPadding = toolTipOption.boxPadding * opts.pix
  let legendWidth = fontSize
  let legendMarginRight = 5 * opts.pix
  if (toolTipOption.legendShow == false) {
    legendWidth = 0
    legendMarginRight = 0
  }
  const arrowWidth = toolTipOption.showArrow ? 8 * opts.pix : 0
  let isOverRightBorder = false
  if (opts.type == 'line' || opts.type == 'mount' || opts.type == 'area' || opts.type == 'candle' || opts.type == 'mix') {
    if (toolTipOption.splitLine == true)
      drawToolTipSplitLine(opts.tooltip.offset.x, opts, config, context)
  }
  offset = assign({
    x: 0,
    y: 0,
  }, offset)
  offset.y -= 8 * opts.pix
  const textWidth = textList.map((item) => {
    return measureText(item.text, fontSize, context)
  })
  const toolTipWidth = legendWidth + legendMarginRight + 4 * boxPadding + Math.max.apply(null, textWidth)
  const toolTipHeight = 2 * boxPadding + textList.length * lineHeight
  if (toolTipOption.showBox == false)
    return

  // if beyond the right border
  if (offset.x - Math.abs(opts._scrollDistance_ || 0) + arrowWidth + toolTipWidth > opts.width)
    isOverRightBorder = true

  if (toolTipHeight + offset.y > opts.height)
    offset.y = opts.height - toolTipHeight

  // draw background rect
  context.beginPath()
  context.setFillStyle(hexToRgb(toolTipOption.bgColor, toolTipOption.bgOpacity))
  context.setLineWidth(toolTipOption.borderWidth * opts.pix)
  context.setStrokeStyle(hexToRgb(toolTipOption.borderColor, toolTipOption.borderOpacity))
  const radius = toolTipOption.borderRadius
  if (isOverRightBorder) {
    // 增加左侧仍然超出的判断
    if (toolTipWidth + arrowWidth > opts.width)
      offset.x = opts.width + Math.abs(opts._scrollDistance_ || 0) + arrowWidth + (toolTipWidth - opts.width)

    if (toolTipWidth > offset.x)
      offset.x = opts.width + Math.abs(opts._scrollDistance_ || 0) + arrowWidth + (toolTipWidth - opts.width)

    if (toolTipOption.showArrow) {
      context.moveTo(offset.x, offset.y + 10 * opts.pix)
      context.lineTo(offset.x - arrowWidth, offset.y + 10 * opts.pix + 5 * opts.pix)
    }
    context.arc(offset.x - arrowWidth - radius, offset.y + toolTipHeight - radius, radius, 0, Math.PI / 2, false)
    context.arc(offset.x - arrowWidth - Math.round(toolTipWidth) + radius, offset.y + toolTipHeight - radius, radius, Math.PI / 2, Math.PI, false)
    context.arc(offset.x - arrowWidth - Math.round(toolTipWidth) + radius, offset.y + radius, radius, -Math.PI, -Math.PI / 2, false)
    context.arc(offset.x - arrowWidth - radius, offset.y + radius, radius, -Math.PI / 2, 0, false)
    if (toolTipOption.showArrow) {
      context.lineTo(offset.x - arrowWidth, offset.y + 10 * opts.pix - 5 * opts.pix)
      context.lineTo(offset.x, offset.y + 10 * opts.pix)
    }
  }
  else {
    if (toolTipOption.showArrow) {
      context.moveTo(offset.x, offset.y + 10 * opts.pix)
      context.lineTo(offset.x + arrowWidth, offset.y + 10 * opts.pix - 5 * opts.pix)
    }
    context.arc(offset.x + arrowWidth + radius, offset.y + radius, radius, -Math.PI, -Math.PI / 2, false)
    context.arc(offset.x + arrowWidth + Math.round(toolTipWidth) - radius, offset.y + radius, radius, -Math.PI / 2, 0, false)
    context.arc(offset.x + arrowWidth + Math.round(toolTipWidth) - radius, offset.y + toolTipHeight - radius, radius, 0, Math.PI / 2, false)
    context.arc(offset.x + arrowWidth + radius, offset.y + toolTipHeight - radius, radius, Math.PI / 2, Math.PI, false)
    if (toolTipOption.showArrow) {
      context.lineTo(offset.x + arrowWidth, offset.y + 10 * opts.pix + 5 * opts.pix)
      context.lineTo(offset.x, offset.y + 10 * opts.pix)
    }
  }
  context.closePath()
  context.fill()
  if (toolTipOption.borderWidth > 0)
    context.stroke()

  // draw legend
  if (toolTipOption.legendShow) {
    textList.forEach((item, index) => {
      if (item.color !== null) {
        context.beginPath()
        context.setFillStyle(item.color)
        let startX = offset.x + arrowWidth + 2 * boxPadding
        const startY = offset.y + (lineHeight - fontSize) / 2 + lineHeight * index + boxPadding + 1
        if (isOverRightBorder)
          startX = offset.x - toolTipWidth - arrowWidth + 2 * boxPadding

        switch (item.legendShape) {
          case 'line':
            context.moveTo(startX, startY + 0.5 * legendWidth - 2 * opts.pix)
            context.fillRect(startX, startY + 0.5 * legendWidth - 2 * opts.pix, legendWidth, 4 * opts.pix)
            break
          case 'triangle':
            context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix)
            context.lineTo(startX + 2.5 * opts.pix, startY + 0.5 * legendWidth + 5 * opts.pix)
            context.lineTo(startX + 12.5 * opts.pix, startY + 0.5 * legendWidth + 5 * opts.pix)
            context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix)
            break
          case 'diamond':
            context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix)
            context.lineTo(startX + 2.5 * opts.pix, startY + 0.5 * legendWidth)
            context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth + 5 * opts.pix)
            context.lineTo(startX + 12.5 * opts.pix, startY + 0.5 * legendWidth)
            context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix)
            break
          case 'circle':
            context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth)
            context.arc(startX + 7.5 * opts.pix, startY + 0.5 * legendWidth, 5 * opts.pix, 0, 2 * Math.PI)
            break
          case 'rect':
            context.moveTo(startX, startY + 0.5 * legendWidth - 5 * opts.pix)
            context.fillRect(startX, startY + 0.5 * legendWidth - 5 * opts.pix, 15 * opts.pix, 10 * opts.pix)
            break
          case 'square':
            context.moveTo(startX + 2 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix)
            context.fillRect(startX + 2 * opts.pix, startY + 0.5 * legendWidth - 5 * opts.pix, 10 * opts.pix, 10 * opts.pix)
            break
          default:
            context.moveTo(startX, startY + 0.5 * legendWidth - 5 * opts.pix)
            context.fillRect(startX, startY + 0.5 * legendWidth - 5 * opts.pix, 15 * opts.pix, 10 * opts.pix)
        }
        context.closePath()
        context.fill()
      }
    })
  }

  // draw text list
  textList.forEach((item, index) => {
    let startX = offset.x + arrowWidth + 2 * boxPadding + legendWidth + legendMarginRight
    if (isOverRightBorder)
      startX = offset.x - toolTipWidth - arrowWidth + 2 * boxPadding + legendWidth + legendMarginRight

    const startY = offset.y + lineHeight * index + (lineHeight - fontSize) / 2 - 1 + boxPadding + fontSize
    context.beginPath()
    context.setFontSize(fontSize)
    context.setTextBaseline('normal')
    context.setFillStyle(toolTipOption.fontColor)
    context.fillText(item.text, startX, startY)
    context.closePath()
    context.stroke()
  })
}

function drawColumnDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const columnOption = assign({}, {
    type: 'group',
    width: eachSpacing / 2,
    meterBorder: 4,
    meterFillColor: '#FFFFFF',
    barBorderCircle: false,
    barBorderRadius: [],
    seriesGap: 2,
    linearType: 'none',
    linearOpacity: 1,
    customColor: [],
    colorStop: 0,
    labelPosition: 'outside',
  }, opts.extra.column)
  const calPoints = []
  context.save()
  let leftNum = -2
  let rightNum = xAxisPoints.length + 2
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftNum = Math.floor(-opts._scrollDistance_ / eachSpacing) - 2
    rightNum = leftNum + opts.xAxis.itemCount + 4
  }
  if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1)
    drawToolTipSplitArea(opts.tooltip.offset.x, opts, config, context, eachSpacing)

  columnOption.customColor = fillCustomColor(columnOption.linearType, columnOption.customColor, series, config)
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()

    // 计算0轴坐标
    const spacingValid = opts.height - opts.area[0] - opts.area[2]
    const zeroHeight = spacingValid * (0 - minRange) / (maxRange - minRange)
    const zeroPoints = opts.height - Math.round(zeroHeight) - opts.area[2]
    eachSeries.zeroPoints = zeroPoints
    const data = eachSeries.data
    switch (columnOption.type) {
      case 'group':
        var points = getColumnDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, zeroPoints, process)
        var tooltipPoints = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
        calPoints.push(tooltipPoints)
        points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config, opts)
        for (let i = 0; i < points.length; i++) {
          const item = points[i]
          // fix issues/I27B1N yyoinge & Joeshu
          if (item !== null && i > leftNum && i < rightNum) {
            var startX = item.x - item.width / 2
            var height = opts.height - item.y - opts.area[2]
            context.beginPath()
            var fillColor = item.color || eachSeries.color
            const strokeColor = item.color || eachSeries.color
            if (columnOption.linearType !== 'none') {
              const grd = context.createLinearGradient(startX, item.y, startX, zeroPoints)
              // 透明渐变
              if (columnOption.linearType == 'opacity') {
                grd.addColorStop(0, hexToRgb(fillColor, columnOption.linearOpacity))
                grd.addColorStop(1, hexToRgb(fillColor, 1))
              }
              else {
                grd.addColorStop(0, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
                grd.addColorStop(columnOption.colorStop, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
                grd.addColorStop(1, hexToRgb(fillColor, 1))
              }
              fillColor = grd
            }
            // 圆角边框
            if ((columnOption.barBorderRadius && columnOption.barBorderRadius.length === 4) || columnOption.barBorderCircle === true) {
              const left = startX
              const top = item.y > zeroPoints ? zeroPoints : item.y
              const width = item.width
              const height = Math.abs(zeroPoints - item.y)
              if (columnOption.barBorderCircle)
                columnOption.barBorderRadius = [width / 2, width / 2, 0, 0]

              if (item.y > zeroPoints)
                columnOption.barBorderRadius = [0, 0, width / 2, width / 2]

              let [r0, r1, r2, r3] = columnOption.barBorderRadius
              const minRadius = Math.min(width / 2, height / 2)
              r0 = r0 > minRadius ? minRadius : r0
              r1 = r1 > minRadius ? minRadius : r1
              r2 = r2 > minRadius ? minRadius : r2
              r3 = r3 > minRadius ? minRadius : r3
              r0 = r0 < 0 ? 0 : r0
              r1 = r1 < 0 ? 0 : r1
              r2 = r2 < 0 ? 0 : r2
              r3 = r3 < 0 ? 0 : r3
              context.arc(left + r0, top + r0, r0, -Math.PI, -Math.PI / 2)
              context.arc(left + width - r1, top + r1, r1, -Math.PI / 2, 0)
              context.arc(left + width - r2, top + height - r2, r2, 0, Math.PI / 2)
              context.arc(left + r3, top + height - r3, r3, Math.PI / 2, Math.PI)
            }
            else {
              context.moveTo(startX, item.y)
              context.lineTo(startX + item.width, item.y)
              context.lineTo(startX + item.width, zeroPoints)
              context.lineTo(startX, zeroPoints)
              context.lineTo(startX, item.y)
              context.setLineWidth(1)
              context.setStrokeStyle(strokeColor)
            }
            context.setFillStyle(fillColor)
            context.closePath()
            // context.stroke();
            context.fill()
          }
        };
        break
      case 'stack':
        // 绘制堆叠数据图
        var points = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
        calPoints.push(points)
        points = fixColumeStackData(points, eachSpacing, series.length, seriesIndex, config, opts, series)
        for (let i = 0; i < points.length; i++) {
          const item = points[i]
          if (item !== null && i > leftNum && i < rightNum) {
            context.beginPath()
            var fillColor = item.color || eachSeries.color
            var startX = item.x - item.width / 2 + 1
            var height = opts.height - item.y - opts.area[2]
            const height0 = opts.height - item.y0 - opts.area[2]
            if (seriesIndex > 0)
              height -= height0

            context.setFillStyle(fillColor)
            context.moveTo(startX, item.y)
            context.fillRect(startX, item.y, item.width, height)
            context.closePath()
            context.fill()
          }
        };
        break
      case 'meter':
        // 绘制温度计数据图
        var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
        calPoints.push(points)
        points = fixColumeMeterData(points, eachSpacing, series.length, seriesIndex, config, opts, columnOption.meterBorder)
        for (let i = 0; i < points.length; i++) {
          const item = points[i]
          if (item !== null && i > leftNum && i < rightNum) {
            // 画背景颜色
            context.beginPath()
            if (seriesIndex == 0 && columnOption.meterBorder > 0) {
              context.setStrokeStyle(eachSeries.color)
              context.setLineWidth(columnOption.meterBorder * opts.pix)
            }
            if (seriesIndex == 0)
              context.setFillStyle(columnOption.meterFillColor)
            else
              context.setFillStyle(item.color || eachSeries.color)

            var startX = item.x - item.width / 2
            var height = opts.height - item.y - opts.area[2]
            if ((columnOption.barBorderRadius && columnOption.barBorderRadius.length === 4) || columnOption.barBorderCircle === true) {
              const left = startX
              const top = item.y
              const width = item.width
              const height = zeroPoints - item.y
              if (columnOption.barBorderCircle)
                columnOption.barBorderRadius = [width / 2, width / 2, 0, 0]

              let [r0, r1, r2, r3] = columnOption.barBorderRadius
              const minRadius = Math.min(width / 2, height / 2)
              r0 = r0 > minRadius ? minRadius : r0
              r1 = r1 > minRadius ? minRadius : r1
              r2 = r2 > minRadius ? minRadius : r2
              r3 = r3 > minRadius ? minRadius : r3
              r0 = r0 < 0 ? 0 : r0
              r1 = r1 < 0 ? 0 : r1
              r2 = r2 < 0 ? 0 : r2
              r3 = r3 < 0 ? 0 : r3
              context.arc(left + r0, top + r0, r0, -Math.PI, -Math.PI / 2)
              context.arc(left + width - r1, top + r1, r1, -Math.PI / 2, 0)
              context.arc(left + width - r2, top + height - r2, r2, 0, Math.PI / 2)
              context.arc(left + r3, top + height - r3, r3, Math.PI / 2, Math.PI)
              context.fill()
            }
            else {
              context.moveTo(startX, item.y)
              context.lineTo(startX + item.width, item.y)
              context.lineTo(startX + item.width, zeroPoints)
              context.lineTo(startX, zeroPoints)
              context.lineTo(startX, item.y)
              context.fill()
            }
            if (seriesIndex == 0 && columnOption.meterBorder > 0) {
              context.closePath()
              context.stroke()
            }
          }
        }
        break
    }
  })

  if (opts.dataLabel !== false && process === 1) {
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      switch (columnOption.type) {
        case 'group':
          var points = getColumnDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
          points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config, opts)
          drawColumePointText(points, eachSeries, config, context, opts)
          break
        case 'stack':
          var points = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
          drawColumePointText(points, eachSeries, config, context, opts)
          break
        case 'meter':
          var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
          drawColumePointText(points, eachSeries, config, context, opts)
          break
      }
    })
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawMountDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const mountOption = assign({}, {
    type: 'mount',
    widthRatio: 1,
    borderWidth: 1,
    barBorderCircle: false,
    barBorderRadius: [],
    linearType: 'none',
    linearOpacity: 1,
    customColor: [],
    colorStop: 0,
  }, opts.extra.mount)
  mountOption.widthRatio = mountOption.widthRatio <= 0 ? 0 : mountOption.widthRatio
  mountOption.widthRatio = mountOption.widthRatio >= 2 ? 2 : mountOption.widthRatio
  const calPoints = []
  context.save()
  let leftNum = -2
  let rightNum = xAxisPoints.length + 2
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftNum = Math.floor(-opts._scrollDistance_ / eachSpacing) - 2
    rightNum = leftNum + opts.xAxis.itemCount + 4
  }
  mountOption.customColor = fillCustomColor(mountOption.linearType, mountOption.customColor, series, config)
  let ranges, minRange, maxRange
  ranges = [].concat(opts.chartData.yAxisData.ranges[0])
  minRange = ranges.pop()
  maxRange = ranges.shift()

  // 计算0轴坐标
  const spacingValid = opts.height - opts.area[0] - opts.area[2]
  const zeroHeight = spacingValid * (0 - minRange) / (maxRange - minRange)
  const zeroPoints = opts.height - Math.round(zeroHeight) - opts.area[2]

  var points = getMountDataPoints(series, minRange, maxRange, xAxisPoints, eachSpacing, opts, mountOption, zeroPoints, process)
  switch (mountOption.type) {
    case 'bar':
      for (let i = 0; i < points.length; i++) {
        const item = points[i]
        if (item !== null && i > leftNum && i < rightNum) {
          var startX = item.x - eachSpacing * mountOption.widthRatio / 2
          var height = opts.height - item.y - opts.area[2]
          context.beginPath()
          var fillColor = item.color || series[i].color
          var strokeColor = item.color || series[i].color
          if (mountOption.linearType !== 'none') {
            var grd = context.createLinearGradient(startX, item.y, startX, zeroPoints)
            // 透明渐变
            if (mountOption.linearType == 'opacity') {
              grd.addColorStop(0, hexToRgb(fillColor, mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            else {
              grd.addColorStop(0, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(mountOption.colorStop, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            fillColor = grd
          }
          // 圆角边框
          if ((mountOption.barBorderRadius && mountOption.barBorderRadius.length === 4) || mountOption.barBorderCircle === true) {
            const left = startX
            const top = item.y > zeroPoints ? zeroPoints : item.y
            const width = item.width
            const height = Math.abs(zeroPoints - item.y)
            if (mountOption.barBorderCircle)
              mountOption.barBorderRadius = [width / 2, width / 2, 0, 0]

            if (item.y > zeroPoints)
              mountOption.barBorderRadius = [0, 0, width / 2, width / 2]

            let [r0, r1, r2, r3] = mountOption.barBorderRadius
            const minRadius = Math.min(width / 2, height / 2)
            r0 = r0 > minRadius ? minRadius : r0
            r1 = r1 > minRadius ? minRadius : r1
            r2 = r2 > minRadius ? minRadius : r2
            r3 = r3 > minRadius ? minRadius : r3
            r0 = r0 < 0 ? 0 : r0
            r1 = r1 < 0 ? 0 : r1
            r2 = r2 < 0 ? 0 : r2
            r3 = r3 < 0 ? 0 : r3
            context.arc(left + r0, top + r0, r0, -Math.PI, -Math.PI / 2)
            context.arc(left + width - r1, top + r1, r1, -Math.PI / 2, 0)
            context.arc(left + width - r2, top + height - r2, r2, 0, Math.PI / 2)
            context.arc(left + r3, top + height - r3, r3, Math.PI / 2, Math.PI)
          }
          else {
            context.moveTo(startX, item.y)
            context.lineTo(startX + item.width, item.y)
            context.lineTo(startX + item.width, zeroPoints)
            context.lineTo(startX, zeroPoints)
            context.lineTo(startX, item.y)
          }
          context.setStrokeStyle(strokeColor)
          context.setFillStyle(fillColor)
          if (mountOption.borderWidth > 0) {
            context.setLineWidth(mountOption.borderWidth * opts.pix)
            context.closePath()
            context.stroke()
          }
          context.fill()
        }
      };
      break
    case 'triangle':
      for (let i = 0; i < points.length; i++) {
        const item = points[i]
        if (item !== null && i > leftNum && i < rightNum) {
          var startX = item.x - eachSpacing * mountOption.widthRatio / 2
          var height = opts.height - item.y - opts.area[2]
          context.beginPath()
          var fillColor = item.color || series[i].color
          var strokeColor = item.color || series[i].color
          if (mountOption.linearType !== 'none') {
            var grd = context.createLinearGradient(startX, item.y, startX, zeroPoints)
            // 透明渐变
            if (mountOption.linearType == 'opacity') {
              grd.addColorStop(0, hexToRgb(fillColor, mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            else {
              grd.addColorStop(0, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(mountOption.colorStop, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            fillColor = grd
          }
          context.moveTo(startX, zeroPoints)
          context.lineTo(item.x, item.y)
          context.lineTo(startX + item.width, zeroPoints)
          context.setStrokeStyle(strokeColor)
          context.setFillStyle(fillColor)
          if (mountOption.borderWidth > 0) {
            context.setLineWidth(mountOption.borderWidth * opts.pix)
            context.stroke()
          }
          context.fill()
        }
      };
      break
    case 'mount':
      for (let i = 0; i < points.length; i++) {
        const item = points[i]
        if (item !== null && i > leftNum && i < rightNum) {
          var startX = item.x - eachSpacing * mountOption.widthRatio / 2
          var height = opts.height - item.y - opts.area[2]
          context.beginPath()
          var fillColor = item.color || series[i].color
          var strokeColor = item.color || series[i].color
          if (mountOption.linearType !== 'none') {
            var grd = context.createLinearGradient(startX, item.y, startX, zeroPoints)
            // 透明渐变
            if (mountOption.linearType == 'opacity') {
              grd.addColorStop(0, hexToRgb(fillColor, mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            else {
              grd.addColorStop(0, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(mountOption.colorStop, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            fillColor = grd
          }
          context.moveTo(startX, zeroPoints)
          context.bezierCurveTo(item.x - item.width / 4, zeroPoints, item.x - item.width / 4, item.y, item.x, item.y)
          context.bezierCurveTo(item.x + item.width / 4, item.y, item.x + item.width / 4, zeroPoints, startX + item.width, zeroPoints)
          context.setStrokeStyle(strokeColor)
          context.setFillStyle(fillColor)
          if (mountOption.borderWidth > 0) {
            context.setLineWidth(mountOption.borderWidth * opts.pix)
            context.stroke()
          }
          context.fill()
        }
      };
      break
    case 'sharp':
      for (let i = 0; i < points.length; i++) {
        const item = points[i]
        if (item !== null && i > leftNum && i < rightNum) {
          var startX = item.x - eachSpacing * mountOption.widthRatio / 2
          var height = opts.height - item.y - opts.area[2]
          context.beginPath()
          var fillColor = item.color || series[i].color
          var strokeColor = item.color || series[i].color
          if (mountOption.linearType !== 'none') {
            var grd = context.createLinearGradient(startX, item.y, startX, zeroPoints)
            // 透明渐变
            if (mountOption.linearType == 'opacity') {
              grd.addColorStop(0, hexToRgb(fillColor, mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            else {
              grd.addColorStop(0, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(mountOption.colorStop, hexToRgb(mountOption.customColor[series[i].linearIndex], mountOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            fillColor = grd
          }
          context.moveTo(startX, zeroPoints)
          context.quadraticCurveTo(item.x - 0, zeroPoints - height / 4, item.x, item.y)
          context.quadraticCurveTo(item.x + 0, zeroPoints - height / 4, startX + item.width, zeroPoints)
          context.setStrokeStyle(strokeColor)
          context.setFillStyle(fillColor)
          if (mountOption.borderWidth > 0) {
            context.setLineWidth(mountOption.borderWidth * opts.pix)
            context.stroke()
          }
          context.fill()
        }
      };
      break
  }

  if (opts.dataLabel !== false && process === 1) {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[0])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    var points = getMountDataPoints(series, minRange, maxRange, xAxisPoints, eachSpacing, opts, mountOption, zeroPoints, process)
    drawMountPointText(points, series, config, context, opts, zeroPoints)
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints: points,
    eachSpacing,
  }
}

function drawBarDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const yAxisPoints = []
  const eachSpacing = (opts.height - opts.area[0] - opts.area[2]) / opts.categories.length
  for (let i = 0; i < opts.categories.length; i++)
    yAxisPoints.push(opts.area[0] + eachSpacing / 2 + eachSpacing * i)

  const columnOption = assign({}, {
    type: 'group',
    width: eachSpacing / 2,
    meterBorder: 4,
    meterFillColor: '#FFFFFF',
    barBorderCircle: false,
    barBorderRadius: [],
    seriesGap: 2,
    linearType: 'none',
    linearOpacity: 1,
    customColor: [],
    colorStop: 0,
  }, opts.extra.bar)
  const calPoints = []
  context.save()
  const leftNum = -2
  const rightNum = yAxisPoints.length + 2
  if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1)
    drawBarToolTipSplitArea(opts.tooltip.offset.y, opts, config, context, eachSpacing)

  columnOption.customColor = fillCustomColor(columnOption.linearType, columnOption.customColor, series, config)
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.xAxisData.ranges)
    maxRange = ranges.pop()
    minRange = ranges.shift()
    const data = eachSeries.data
    switch (columnOption.type) {
      case 'group':
        var points = getBarDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, process)
        var tooltipPoints = getBarStackDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
        calPoints.push(tooltipPoints)
        points = fixBarData(points, eachSpacing, series.length, seriesIndex, config, opts)
        for (let i = 0; i < points.length; i++) {
          const item = points[i]
          // fix issues/I27B1N yyoinge & Joeshu
          if (item !== null && i > leftNum && i < rightNum) {
            // var startX = item.x - item.width / 2;
            var startX = opts.area[3]
            const startY = item.y - item.width / 2
            const height = item.height
            context.beginPath()
            var fillColor = item.color || eachSeries.color
            const strokeColor = item.color || eachSeries.color
            if (columnOption.linearType !== 'none') {
              const grd = context.createLinearGradient(startX, item.y, item.x, item.y)
              // 透明渐变
              if (columnOption.linearType == 'opacity') {
                grd.addColorStop(0, hexToRgb(fillColor, columnOption.linearOpacity))
                grd.addColorStop(1, hexToRgb(fillColor, 1))
              }
              else {
                grd.addColorStop(0, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
                grd.addColorStop(columnOption.colorStop, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
                grd.addColorStop(1, hexToRgb(fillColor, 1))
              }
              fillColor = grd
            }
            // 圆角边框
            if ((columnOption.barBorderRadius && columnOption.barBorderRadius.length === 4) || columnOption.barBorderCircle === true) {
              const left = startX
              const width = item.width
              const top = item.y - item.width / 2
              const height = item.height
              if (columnOption.barBorderCircle)
                columnOption.barBorderRadius = [width / 2, width / 2, 0, 0]

              let [r0, r1, r2, r3] = columnOption.barBorderRadius
              const minRadius = Math.min(width / 2, height / 2)
              r0 = r0 > minRadius ? minRadius : r0
              r1 = r1 > minRadius ? minRadius : r1
              r2 = r2 > minRadius ? minRadius : r2
              r3 = r3 > minRadius ? minRadius : r3
              r0 = r0 < 0 ? 0 : r0
              r1 = r1 < 0 ? 0 : r1
              r2 = r2 < 0 ? 0 : r2
              r3 = r3 < 0 ? 0 : r3

              context.arc(left + r3, top + r3, r3, -Math.PI, -Math.PI / 2)
              context.arc(item.x - r0, top + r0, r0, -Math.PI / 2, 0)
              context.arc(item.x - r1, top + width - r1, r1, 0, Math.PI / 2)
              context.arc(left + r2, top + width - r2, r2, Math.PI / 2, Math.PI)
            }
            else {
              context.moveTo(startX, startY)
              context.lineTo(item.x, startY)
              context.lineTo(item.x, startY + item.width)
              context.lineTo(startX, startY + item.width)
              context.lineTo(startX, startY)
              context.setLineWidth(1)
              context.setStrokeStyle(strokeColor)
            }
            context.setFillStyle(fillColor)
            context.closePath()
            // context.stroke();
            context.fill()
          }
        };
        break
      case 'stack':
        // 绘制堆叠数据图
        var points = getBarStackDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
        calPoints.push(points)
        points = fixBarStackData(points, eachSpacing, series.length, seriesIndex, config, opts, series)
        for (let i = 0; i < points.length; i++) {
          const item = points[i]
          if (item !== null && i > leftNum && i < rightNum) {
            context.beginPath()
            var fillColor = item.color || eachSeries.color
            var startX = item.x0
            context.setFillStyle(fillColor)
            context.moveTo(startX, item.y - item.width / 2)
            context.fillRect(startX, item.y - item.width / 2, item.height, item.width)
            context.closePath()
            context.fill()
          }
        };
        break
    }
  })

  if (opts.dataLabel !== false && process === 1) {
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.xAxisData.ranges)
      maxRange = ranges.pop()
      minRange = ranges.shift()
      const data = eachSeries.data
      switch (columnOption.type) {
        case 'group':
          var points = getBarDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, process)
          points = fixBarData(points, eachSpacing, series.length, seriesIndex, config, opts)
          drawBarPointText(points, eachSeries, config, context, opts)
          break
        case 'stack':
          var points = getBarStackDataPoints(data, minRange, maxRange, yAxisPoints, eachSpacing, opts, config, seriesIndex, series, process)
          drawBarPointText(points, eachSeries, config, context, opts)
          break
      }
    })
  }
  return {
    yAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawCandleDataPoints(series, seriesMA, opts, config, context) {
  const process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1
  const candleOption = assign({}, {
    color: {},
    average: {},
  }, opts.extra.candle)
  candleOption.color = assign({}, {
    upLine: '#f04864',
    upFill: '#f04864',
    downLine: '#2fc25b',
    downFill: '#2fc25b',
  }, candleOption.color)
  candleOption.average = assign({}, {
    show: false,
    name: [],
    day: [],
    color: config.color,
  }, candleOption.average)
  opts.extra.candle = candleOption
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const calPoints = []
  context.save()
  let leftNum = -2
  let rightNum = xAxisPoints.length + 2
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftNum = Math.floor(-opts._scrollDistance_ / eachSpacing) - 2
    rightNum = leftNum + opts.xAxis.itemCount + 4
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  // 画均线
  if (candleOption.average.show || seriesMA) { // Merge pull request !12 from 邱贵翔
    seriesMA.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
      const splitPointList = splitPoints(points, eachSeries)
      for (let i = 0; i < splitPointList.length; i++) {
        const points = splitPointList[i]
        context.beginPath()
        context.setStrokeStyle(eachSeries.color)
        context.setLineWidth(1)
        if (points.length === 1) {
          context.moveTo(points[0].x, points[0].y)
          context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI)
        }
        else {
          context.moveTo(points[0].x, points[0].y)
          let startPoint = 0
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
              const ctrlPoint = createCurveControlPoints(points, j - 1)
              context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
            }
          }
          context.moveTo(points[0].x, points[0].y)
        }
        context.closePath()
        context.stroke()
      }
    })
  }
  // 画K线
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    const points = getCandleDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
    calPoints.push(points)
    const splitPointList = splitPoints(points, eachSeries)
    for (let i = 0; i < splitPointList[0].length; i++) {
      if (i > leftNum && i < rightNum) {
        const item = splitPointList[0][i]
        context.beginPath()
        // 如果上涨
        if (data[i][1] - data[i][0] > 0) {
          context.setStrokeStyle(candleOption.color.upLine)
          context.setFillStyle(candleOption.color.upFill)
          context.setLineWidth(1 * opts.pix)
          context.moveTo(item[3].x, item[3].y) // 顶点
          context.lineTo(item[1].x, item[1].y) // 收盘中间点
          context.lineTo(item[1].x - eachSpacing / 4, item[1].y) // 收盘左侧点
          context.lineTo(item[0].x - eachSpacing / 4, item[0].y) // 开盘左侧点
          context.lineTo(item[0].x, item[0].y) // 开盘中间点
          context.lineTo(item[2].x, item[2].y) // 底点
          context.lineTo(item[0].x, item[0].y) // 开盘中间点
          context.lineTo(item[0].x + eachSpacing / 4, item[0].y) // 开盘右侧点
          context.lineTo(item[1].x + eachSpacing / 4, item[1].y) // 收盘右侧点
          context.lineTo(item[1].x, item[1].y) // 收盘中间点
          context.moveTo(item[3].x, item[3].y) // 顶点
        }
        else {
          context.setStrokeStyle(candleOption.color.downLine)
          context.setFillStyle(candleOption.color.downFill)
          context.setLineWidth(1 * opts.pix)
          context.moveTo(item[3].x, item[3].y) // 顶点
          context.lineTo(item[0].x, item[0].y) // 开盘中间点
          context.lineTo(item[0].x - eachSpacing / 4, item[0].y) // 开盘左侧点
          context.lineTo(item[1].x - eachSpacing / 4, item[1].y) // 收盘左侧点
          context.lineTo(item[1].x, item[1].y) // 收盘中间点
          context.lineTo(item[2].x, item[2].y) // 底点
          context.lineTo(item[1].x, item[1].y) // 收盘中间点
          context.lineTo(item[1].x + eachSpacing / 4, item[1].y) // 收盘右侧点
          context.lineTo(item[0].x + eachSpacing / 4, item[0].y) // 开盘右侧点
          context.lineTo(item[0].x, item[0].y) // 开盘中间点
          context.moveTo(item[3].x, item[3].y) // 顶点
        }
        context.closePath()
        context.fill()
        context.stroke()
      }
    }
  })
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawAreaDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const areaOption = assign({}, {
    type: 'straight',
    opacity: 0.2,
    addLine: false,
    width: 2,
    gradient: false,
    activeType: 'none',
  }, opts.extra.area)
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const endY = opts.height - opts.area[2]
  const calPoints = []
  context.save()
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
    calPoints.push(points)
    const splitPointList = splitPoints(points, eachSeries)
    for (let i = 0; i < splitPointList.length; i++) {
      const points = splitPointList[i]
      // 绘制区域数
      context.beginPath()
      context.setStrokeStyle(hexToRgb(eachSeries.color, areaOption.opacity))
      if (areaOption.gradient) {
        const gradient = context.createLinearGradient(0, opts.area[0], 0, opts.height - opts.area[2])
        gradient.addColorStop('0', hexToRgb(eachSeries.color, areaOption.opacity))
        gradient.addColorStop('1.0', hexToRgb('#FFFFFF', 0.1))
        context.setFillStyle(gradient)
      }
      else {
        context.setFillStyle(hexToRgb(eachSeries.color, areaOption.opacity))
      }
      context.setLineWidth(areaOption.width * opts.pix)
      if (points.length > 1) {
        const firstPoint = points[0]
        const lastPoint = points[points.length - 1]
        context.moveTo(firstPoint.x, firstPoint.y)
        let startPoint = 0
        if (areaOption.type === 'curve') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
              const ctrlPoint = createCurveControlPoints(points, j - 1)
              context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
            }
          };
        }
        if (areaOption.type === 'straight') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace)
              context.lineTo(item.x, item.y)
          };
        }
        if (areaOption.type === 'step') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
              context.lineTo(item.x, points[j - 1].y)
              context.lineTo(item.x, item.y)
            }
          };
        }
        context.lineTo(lastPoint.x, endY)
        context.lineTo(firstPoint.x, endY)
        context.lineTo(firstPoint.x, firstPoint.y)
      }
      else {
        const item = points[0]
        context.moveTo(item.x - eachSpacing / 2, item.y)
        // context.lineTo(item.x + eachSpacing / 2, item.y);
        // context.lineTo(item.x + eachSpacing / 2, endY);
        // context.lineTo(item.x - eachSpacing / 2, endY);
        // context.moveTo(item.x - eachSpacing / 2, item.y);
      }
      context.closePath()
      context.fill()
      // 画连线
      if (areaOption.addLine) {
        if (eachSeries.lineType == 'dash') {
          let dashLength = eachSeries.dashLength ? eachSeries.dashLength : 8
          dashLength *= opts.pix
          context.setLineDash([dashLength, dashLength])
        }
        context.beginPath()
        context.setStrokeStyle(eachSeries.color)
        context.setLineWidth(areaOption.width * opts.pix)
        if (points.length === 1) {
          context.moveTo(points[0].x, points[0].y)
          // context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
        }
        else {
          context.moveTo(points[0].x, points[0].y)
          let startPoint = 0
          if (areaOption.type === 'curve') {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
                const ctrlPoint = createCurveControlPoints(points, j - 1)
                context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
              }
            };
          }
          if (areaOption.type === 'straight') {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace)
                context.lineTo(item.x, item.y)
            };
          }
          if (areaOption.type === 'step') {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
                context.lineTo(item.x, points[j - 1].y)
                context.lineTo(item.x, item.y)
              }
            };
          }
          context.moveTo(points[0].x, points[0].y)
        }
        context.stroke()
        context.setLineDash([])
      }
    }
    // 画点
    if (opts.dataPointShape !== false)
      drawPointShape(points, eachSeries.color, eachSeries.pointShape, context, opts)

    drawActivePoint(points, eachSeries.color, eachSeries.pointShape, context, opts, areaOption, seriesIndex)
  })

  if (opts.dataLabel !== false && process === 1) {
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
      drawPointText(points, eachSeries, config, context, opts)
    })
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawScatterDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const scatterOption = assign({}, {
    type: 'circle',
  }, opts.extra.scatter)
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const calPoints = []
  context.save()
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
    context.beginPath()
    context.setStrokeStyle(eachSeries.color)
    context.setFillStyle(eachSeries.color)
    context.setLineWidth(1 * opts.pix)
    const shape = eachSeries.pointShape
    if (shape === 'diamond') {
      points.forEach((item, index) => {
        if (item !== null) {
          context.moveTo(item.x, item.y - 4.5)
          context.lineTo(item.x - 4.5, item.y)
          context.lineTo(item.x, item.y + 4.5)
          context.lineTo(item.x + 4.5, item.y)
          context.lineTo(item.x, item.y - 4.5)
        }
      })
    }
    else if (shape === 'circle') {
      points.forEach((item, index) => {
        if (item !== null) {
          context.moveTo(item.x + 2.5 * opts.pix, item.y)
          context.arc(item.x, item.y, 3 * opts.pix, 0, 2 * Math.PI, false)
        }
      })
    }
    else if (shape === 'square') {
      points.forEach((item, index) => {
        if (item !== null) {
          context.moveTo(item.x - 3.5, item.y - 3.5)
          context.rect(item.x - 3.5, item.y - 3.5, 7, 7)
        }
      })
    }
    else if (shape === 'triangle') {
      points.forEach((item, index) => {
        if (item !== null) {
          context.moveTo(item.x, item.y - 4.5)
          context.lineTo(item.x - 4.5, item.y + 4.5)
          context.lineTo(item.x + 4.5, item.y + 4.5)
          context.lineTo(item.x, item.y - 4.5)
        }
      })
    }
    else if (shape === 'triangle') {
      return
    }
    context.closePath()
    context.fill()
    context.stroke()
  })
  if (opts.dataLabel !== false && process === 1) {
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
      drawPointText(points, eachSeries, config, context, opts)
    })
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawBubbleDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const bubbleOption = assign({}, {
    opacity: 1,
    border: 2,
  }, opts.extra.bubble)
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const calPoints = []
  context.save()
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
    context.beginPath()
    context.setStrokeStyle(eachSeries.color)
    context.setLineWidth(bubbleOption.border * opts.pix)
    context.setFillStyle(hexToRgb(eachSeries.color, bubbleOption.opacity))
    points.forEach((item, index) => {
      context.moveTo(item.x + item.r, item.y)
      context.arc(item.x, item.y, item.r * opts.pix, 0, 2 * Math.PI, false)
    })
    context.closePath()
    context.fill()
    context.stroke()

    if (opts.dataLabel !== false && process === 1) {
      points.forEach((item, index) => {
        context.beginPath()
        const fontSize = eachSeries.textSize * opts.pix || config.fontSize
        context.setFontSize(fontSize)
        context.setFillStyle(eachSeries.textColor || '#FFFFFF')
        context.setTextAlign('center')
        context.fillText(String(item.t), item.x, item.y + fontSize / 2)
        context.closePath()
        context.stroke()
        context.setTextAlign('left')
      })
    }
  })
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawLineDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const lineOption = assign({}, {
    type: 'straight',
    width: 2,
    activeType: 'none',
    linearType: 'none',
    onShadow: false,
    animation: 'vertical',
  }, opts.extra.line)
  lineOption.width *= opts.pix
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const calPoints = []
  context.save()
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  series.forEach((eachSeries, seriesIndex) => {
    // 这段很神奇的代码用于解决ios16的setStrokeStyle失效的bug
    context.beginPath()
    context.setStrokeStyle(eachSeries.color)
    context.moveTo(-10000, -10000)
    context.lineTo(-10001, -10001)
    context.stroke()
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    const points = getLineDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, lineOption, process)
    calPoints.push(points)
    const splitPointList = splitPoints(points, eachSeries)
    if (eachSeries.lineType == 'dash') {
      let dashLength = eachSeries.dashLength ? eachSeries.dashLength : 8
      dashLength *= opts.pix
      context.setLineDash([dashLength, dashLength])
    }
    context.beginPath()
    let strokeColor = eachSeries.color
    if (lineOption.linearType !== 'none' && eachSeries.linearColor && eachSeries.linearColor.length > 0) {
      const grd = context.createLinearGradient(opts.chartData.xAxisData.startX, opts.height / 2, opts.chartData.xAxisData.endX, opts.height / 2)
      for (let i = 0; i < eachSeries.linearColor.length; i++)
        grd.addColorStop(eachSeries.linearColor[i][0], hexToRgb(eachSeries.linearColor[i][1], 1))

      strokeColor = grd
    }
    context.setStrokeStyle(strokeColor)
    if (lineOption.onShadow == true && eachSeries.setShadow && eachSeries.setShadow.length > 0)
      context.setShadow(eachSeries.setShadow[0], eachSeries.setShadow[1], eachSeries.setShadow[2], eachSeries.setShadow[3])
    else
      context.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

    context.setLineWidth(lineOption.width)
    splitPointList.forEach((points, index) => {
      if (points.length === 1) {
        context.moveTo(points[0].x, points[0].y)
        // context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
      }
      else {
        context.moveTo(points[0].x, points[0].y)
        let startPoint = 0
        if (lineOption.type === 'curve') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
              const ctrlPoint = createCurveControlPoints(points, j - 1)
              context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
            }
          };
        }
        if (lineOption.type === 'straight') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace)
              context.lineTo(item.x, item.y)
          };
        }
        if (lineOption.type === 'step') {
          for (let j = 0; j < points.length; j++) {
            const item = points[j]
            if (startPoint == 0 && item.x > leftSpace) {
              context.moveTo(item.x, item.y)
              startPoint = 1
            }
            if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
              context.lineTo(item.x, points[j - 1].y)
              context.lineTo(item.x, item.y)
            }
          };
        }
        context.moveTo(points[0].x, points[0].y)
      }
    })
    context.stroke()
    context.setLineDash([])
    if (opts.dataPointShape !== false)
      drawPointShape(points, eachSeries.color, eachSeries.pointShape, context, opts)

    drawActivePoint(points, eachSeries.color, eachSeries.pointShape, context, opts, lineOption)
  })
  if (opts.dataLabel !== false && process === 1) {
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      const points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
      drawPointText(points, eachSeries, config, context, opts)
    })
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawMixDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const eachSpacing = xAxisData.eachSpacing
  const columnOption = assign({}, {
    width: eachSpacing / 2,
    barBorderCircle: false,
    barBorderRadius: [],
    seriesGap: 2,
    linearType: 'none',
    linearOpacity: 1,
    customColor: [],
    colorStop: 0,
  }, opts.extra.mix.column)
  const areaOption = assign({}, {
    opacity: 0.2,
    gradient: false,
  }, opts.extra.mix.area)
  const lineOption = assign({}, {
    width: 2,
  }, opts.extra.mix.line)
  const endY = opts.height - opts.area[2]
  const calPoints = []
  var columnIndex = 0
  let columnLength = 0
  series.forEach((eachSeries, seriesIndex) => {
    if (eachSeries.type == 'column')
      columnLength += 1
  })
  context.save()
  let leftNum = -2
  let rightNum = xAxisPoints.length + 2
  let leftSpace = 0
  let rightSpace = opts.width + eachSpacing
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
    context.translate(opts._scrollDistance_, 0)
    leftNum = Math.floor(-opts._scrollDistance_ / eachSpacing) - 2
    rightNum = leftNum + opts.xAxis.itemCount + 4
    leftSpace = -opts._scrollDistance_ - eachSpacing * 2 + opts.area[3]
    rightSpace = leftSpace + (opts.xAxis.itemCount + 4) * eachSpacing
  }
  columnOption.customColor = fillCustomColor(columnOption.linearType, columnOption.customColor, series, config)
  series.forEach((eachSeries, seriesIndex) => {
    let ranges, minRange, maxRange
    ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
    minRange = ranges.pop()
    maxRange = ranges.shift()
    const data = eachSeries.data
    let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
    calPoints.push(points)
    // 绘制柱状数据图
    if (eachSeries.type == 'column') {
      points = fixColumeData(points, eachSpacing, columnLength, columnIndex, config, opts)
      for (let i = 0; i < points.length; i++) {
        const item = points[i]
        if (item !== null && i > leftNum && i < rightNum) {
          const startX = item.x - item.width / 2
          const height = opts.height - item.y - opts.area[2]
          context.beginPath()
          let fillColor = item.color || eachSeries.color
          const strokeColor = item.color || eachSeries.color
          if (columnOption.linearType !== 'none') {
            const grd = context.createLinearGradient(startX, item.y, startX, opts.height - opts.area[2])
            // 透明渐变
            if (columnOption.linearType == 'opacity') {
              grd.addColorStop(0, hexToRgb(fillColor, columnOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            else {
              grd.addColorStop(0, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
              grd.addColorStop(columnOption.colorStop, hexToRgb(columnOption.customColor[eachSeries.linearIndex], columnOption.linearOpacity))
              grd.addColorStop(1, hexToRgb(fillColor, 1))
            }
            fillColor = grd
          }
          // 圆角边框
          if ((columnOption.barBorderRadius && columnOption.barBorderRadius.length === 4) || columnOption.barBorderCircle) {
            const left = startX
            const top = item.y
            const width = item.width
            const height = opts.height - opts.area[2] - item.y
            if (columnOption.barBorderCircle)
              columnOption.barBorderRadius = [width / 2, width / 2, 0, 0]

            let [r0, r1, r2, r3] = columnOption.barBorderRadius
            const minRadius = Math.min(width / 2, height / 2)
            r0 = r0 > minRadius ? minRadius : r0
            r1 = r1 > minRadius ? minRadius : r1
            r2 = r2 > minRadius ? minRadius : r2
            r3 = r3 > minRadius ? minRadius : r3
            r0 = r0 < 0 ? 0 : r0
            r1 = r1 < 0 ? 0 : r1
            r2 = r2 < 0 ? 0 : r2
            r3 = r3 < 0 ? 0 : r3
            context.arc(left + r0, top + r0, r0, -Math.PI, -Math.PI / 2)
            context.arc(left + width - r1, top + r1, r1, -Math.PI / 2, 0)
            context.arc(left + width - r2, top + height - r2, r2, 0, Math.PI / 2)
            context.arc(left + r3, top + height - r3, r3, Math.PI / 2, Math.PI)
          }
          else {
            context.moveTo(startX, item.y)
            context.lineTo(startX + item.width, item.y)
            context.lineTo(startX + item.width, opts.height - opts.area[2])
            context.lineTo(startX, opts.height - opts.area[2])
            context.lineTo(startX, item.y)
            context.setLineWidth(1)
            context.setStrokeStyle(strokeColor)
          }
          context.setFillStyle(fillColor)
          context.closePath()
          context.fill()
        }
      }
      columnIndex += 1
    }
    // 绘制区域图数据
    if (eachSeries.type == 'area') {
      const splitPointList = splitPoints(points, eachSeries)
      for (let i = 0; i < splitPointList.length; i++) {
        const points = splitPointList[i]
        // 绘制区域数据
        context.beginPath()
        context.setStrokeStyle(eachSeries.color)
        context.setStrokeStyle(hexToRgb(eachSeries.color, areaOption.opacity))
        if (areaOption.gradient) {
          const gradient = context.createLinearGradient(0, opts.area[0], 0, opts.height - opts.area[2])
          gradient.addColorStop('0', hexToRgb(eachSeries.color, areaOption.opacity))
          gradient.addColorStop('1.0', hexToRgb('#FFFFFF', 0.1))
          context.setFillStyle(gradient)
        }
        else {
          context.setFillStyle(hexToRgb(eachSeries.color, areaOption.opacity))
        }
        context.setLineWidth(2 * opts.pix)
        if (points.length > 1) {
          const firstPoint = points[0]
          const lastPoint = points[points.length - 1]
          context.moveTo(firstPoint.x, firstPoint.y)
          let startPoint = 0
          if (eachSeries.style === 'curve') {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
                const ctrlPoint = createCurveControlPoints(points, j - 1)
                context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
              }
            };
          }
          else {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace)
                context.lineTo(item.x, item.y)
            };
          }
          context.lineTo(lastPoint.x, endY)
          context.lineTo(firstPoint.x, endY)
          context.lineTo(firstPoint.x, firstPoint.y)
        }
        else {
          const item = points[0]
          context.moveTo(item.x - eachSpacing / 2, item.y)
          // context.lineTo(item.x + eachSpacing / 2, item.y);
          // context.lineTo(item.x + eachSpacing / 2, endY);
          // context.lineTo(item.x - eachSpacing / 2, endY);
          // context.moveTo(item.x - eachSpacing / 2, item.y);
        }
        context.closePath()
        context.fill()
      }
    }
    // 绘制折线数据图
    if (eachSeries.type == 'line') {
      const splitPointList = splitPoints(points, eachSeries)
      splitPointList.forEach((points, index) => {
        if (eachSeries.lineType == 'dash') {
          let dashLength = eachSeries.dashLength ? eachSeries.dashLength : 8
          dashLength *= opts.pix
          context.setLineDash([dashLength, dashLength])
        }
        context.beginPath()
        context.setStrokeStyle(eachSeries.color)
        context.setLineWidth(lineOption.width * opts.pix)
        if (points.length === 1) {
          context.moveTo(points[0].x, points[0].y)
          // context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
        }
        else {
          context.moveTo(points[0].x, points[0].y)
          let startPoint = 0
          if (eachSeries.style == 'curve') {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace) {
                const ctrlPoint = createCurveControlPoints(points, j - 1)
                context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item.y)
              }
            }
          }
          else {
            for (let j = 0; j < points.length; j++) {
              const item = points[j]
              if (startPoint == 0 && item.x > leftSpace) {
                context.moveTo(item.x, item.y)
                startPoint = 1
              }
              if (j > 0 && item.x > leftSpace && item.x < rightSpace)
                context.lineTo(item.x, item.y)
            }
          }
          context.moveTo(points[0].x, points[0].y)
        }
        context.stroke()
        context.setLineDash([])
      })
    }
    // 绘制点数据图
    if (eachSeries.type == 'point')
      eachSeries.addPoint = true

    if (eachSeries.addPoint == true && eachSeries.type !== 'column')
      drawPointShape(points, eachSeries.color, eachSeries.pointShape, context, opts)
  })
  if (opts.dataLabel !== false && process === 1) {
    var columnIndex = 0
    series.forEach((eachSeries, seriesIndex) => {
      let ranges, minRange, maxRange
      ranges = [].concat(opts.chartData.yAxisData.ranges[eachSeries.index])
      minRange = ranges.pop()
      maxRange = ranges.shift()
      const data = eachSeries.data
      let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process)
      if (eachSeries.type !== 'column') {
        drawPointText(points, eachSeries, config, context, opts)
      }
      else {
        points = fixColumeData(points, eachSpacing, columnLength, columnIndex, config, opts)
        drawPointText(points, eachSeries, config, context, opts)
        columnIndex += 1
      }
    })
  }
  context.restore()
  return {
    xAxisPoints,
    calPoints,
    eachSpacing,
  }
}

function drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints) {
  const toolTipOption = opts.extra.tooltip || {}
  if (toolTipOption.horizentalLine && opts.tooltip && process === 1 && (opts.type == 'line' || opts.type == 'area' || opts.type == 'column' || opts.type == 'mount' || opts.type == 'candle' || opts.type == 'mix'))
    drawToolTipHorizentalLine(opts, config, context, eachSpacing, xAxisPoints)

  context.save()
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true)
    context.translate(opts._scrollDistance_, 0)

  if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1)
    drawToolTip(opts.tooltip.textList, opts.tooltip.offset, opts, config, context, eachSpacing, xAxisPoints)

  context.restore()
}

function drawXAxis(categories, opts, config, context) {
  const xAxisData = opts.chartData.xAxisData
  const xAxisPoints = xAxisData.xAxisPoints
  const startX = xAxisData.startX
  const endX = xAxisData.endX
  const eachSpacing = xAxisData.eachSpacing
  let boundaryGap = 'center'
  if (opts.type == 'bar' || opts.type == 'line' || opts.type == 'area' || opts.type == 'scatter' || opts.type == 'bubble')
    boundaryGap = opts.xAxis.boundaryGap

  const startY = opts.height - opts.area[2]
  const endY = opts.area[0]

  // 绘制滚动条
  if (opts.enableScroll && opts.xAxis.scrollShow) {
    const scrollY = opts.height - opts.area[2] + config.xAxisHeight
    const scrollScreenWidth = endX - startX
    let scrollTotalWidth = eachSpacing * (xAxisPoints.length - 1)
    if (opts.type == 'mount' && opts.extra && opts.extra.mount && opts.extra.mount.widthRatio && opts.extra.mount.widthRatio > 1) {
      if (opts.extra.mount.widthRatio > 2)
        opts.extra.mount.widthRatio = 2
      scrollTotalWidth += (opts.extra.mount.widthRatio - 1) * eachSpacing
    }
    const scrollWidth = scrollScreenWidth * scrollScreenWidth / scrollTotalWidth
    let scrollLeft = 0
    if (opts._scrollDistance_)
      scrollLeft = -opts._scrollDistance_ * (scrollScreenWidth) / scrollTotalWidth

    context.beginPath()
    context.setLineCap('round')
    context.setLineWidth(6 * opts.pix)
    context.setStrokeStyle(opts.xAxis.scrollBackgroundColor || '#EFEBEF')
    context.moveTo(startX, scrollY)
    context.lineTo(endX, scrollY)
    context.stroke()
    context.closePath()
    context.beginPath()
    context.setLineCap('round')
    context.setLineWidth(6 * opts.pix)
    context.setStrokeStyle(opts.xAxis.scrollColor || '#A6A6A6')
    context.moveTo(startX + scrollLeft, scrollY)
    context.lineTo(startX + scrollLeft + scrollWidth, scrollY)
    context.stroke()
    context.closePath()
    context.setLineCap('butt')
  }
  context.save()
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0)
    context.translate(opts._scrollDistance_, 0)

  // 绘制X轴刻度线
  if (opts.xAxis.calibration === true) {
    context.setStrokeStyle(opts.xAxis.gridColor || '#cccccc')
    context.setLineCap('butt')
    context.setLineWidth(1 * opts.pix)
    xAxisPoints.forEach((item, index) => {
      if (index > 0) {
        context.beginPath()
        context.moveTo(item - eachSpacing / 2, startY)
        context.lineTo(item - eachSpacing / 2, startY + 3 * opts.pix)
        context.closePath()
        context.stroke()
      }
    })
  }
  // 绘制X轴网格
  if (opts.xAxis.disableGrid !== true) {
    context.setStrokeStyle(opts.xAxis.gridColor || '#cccccc')
    context.setLineCap('butt')
    context.setLineWidth(1 * opts.pix)
    if (opts.xAxis.gridType == 'dash')
      context.setLineDash([opts.xAxis.dashLength * opts.pix, opts.xAxis.dashLength * opts.pix])

    opts.xAxis.gridEval = opts.xAxis.gridEval || 1
    xAxisPoints.forEach((item, index) => {
      if (index % opts.xAxis.gridEval == 0) {
        context.beginPath()
        context.moveTo(item, startY)
        context.lineTo(item, endY)
        context.stroke()
      }
    })
    context.setLineDash([])
  }
  // 绘制X轴文案
  if (opts.xAxis.disabled !== true) {
    // 对X轴列表做抽稀处理
    // 默认全部显示X轴标签
    let maxXAxisListLength = categories.length
    // 如果设置了X轴单屏数量
    if (opts.xAxis.labelCount) {
      // 如果设置X轴密度
      if (opts.xAxis.itemCount)
        maxXAxisListLength = Math.ceil(categories.length / opts.xAxis.itemCount * opts.xAxis.labelCount)
      else
        maxXAxisListLength = opts.xAxis.labelCount

      maxXAxisListLength -= 1
    }

    const ratio = Math.ceil(categories.length / maxXAxisListLength)

    const newCategories = []
    const cgLength = categories.length
    for (let i = 0; i < cgLength; i++) {
      if (i % ratio !== 0)
        newCategories.push('')
      else
        newCategories.push(categories[i])
    }
    newCategories[cgLength - 1] = categories[cgLength - 1]
    const xAxisFontSize = opts.xAxis.fontSize * opts.pix || config.fontSize
    if (config._xAxisTextAngle_ === 0) {
      newCategories.forEach((item, index) => {
        const xitem = opts.xAxis.formatter ? opts.xAxis.formatter(item, index, opts) : item
        let offset = -measureText(String(xitem), xAxisFontSize, context) / 2
        if (boundaryGap == 'center')
          offset += eachSpacing / 2

        let scrollHeight = 0
        if (opts.xAxis.scrollShow)
          scrollHeight = 6 * opts.pix

        // 如果在主视图区域内
        const _scrollDistance_ = opts._scrollDistance_ || 0
        const truePoints = boundaryGap == 'center' ? xAxisPoints[index] + eachSpacing / 2 : xAxisPoints[index]
        if ((truePoints - Math.abs(_scrollDistance_)) >= (opts.area[3] - 1) && (truePoints - Math.abs(_scrollDistance_)) <= (opts.width - opts.area[1] + 1)) {
          context.beginPath()
          context.setFontSize(xAxisFontSize)
          context.setFillStyle(opts.xAxis.fontColor || opts.fontColor)
          context.fillText(String(xitem), xAxisPoints[index] + offset, startY + opts.xAxis.marginTop * opts.pix + (opts.xAxis.lineHeight - opts.xAxis.fontSize) * opts.pix / 2 + opts.xAxis.fontSize * opts.pix)
          context.closePath()
          context.stroke()
        }
      })
    }
    else {
      newCategories.forEach((item, index) => {
        const xitem = opts.xAxis.formatter ? opts.xAxis.formatter(item) : item
        // 如果在主视图区域内
        const _scrollDistance_ = opts._scrollDistance_ || 0
        const truePoints = boundaryGap == 'center' ? xAxisPoints[index] + eachSpacing / 2 : xAxisPoints[index]
        if ((truePoints - Math.abs(_scrollDistance_)) >= (opts.area[3] - 1) && (truePoints - Math.abs(_scrollDistance_)) <= (opts.width - opts.area[1] + 1)) {
          context.save()
          context.beginPath()
          context.setFontSize(xAxisFontSize)
          context.setFillStyle(opts.xAxis.fontColor || opts.fontColor)
          let textWidth = measureText(String(xitem), xAxisFontSize, context)
          let offsetX = xAxisPoints[index]
          if (boundaryGap == 'center')
            offsetX = xAxisPoints[index] + eachSpacing / 2

          let scrollHeight = 0
          if (opts.xAxis.scrollShow)
            scrollHeight = 6 * opts.pix

          const offsetY = startY + opts.xAxis.marginTop * opts.pix + xAxisFontSize - xAxisFontSize * Math.abs(Math.sin(config._xAxisTextAngle_))
          if (opts.xAxis.rotateAngle < 0) {
            offsetX -= xAxisFontSize / 2
            textWidth = 0
          }
          else {
            offsetX += xAxisFontSize / 2
            textWidth = -textWidth
          }
          context.translate(offsetX, offsetY)
          context.rotate(-1 * config._xAxisTextAngle_)
          context.fillText(String(xitem), textWidth, 0)
          context.closePath()
          context.stroke()
          context.restore()
        }
      })
    }
  }
  context.restore()

  // 画X轴标题
  if (opts.xAxis.title) {
    context.beginPath()
    context.setFontSize(opts.xAxis.titleFontSize * opts.pix)
    context.setFillStyle(opts.xAxis.titleFontColor)
    context.fillText(String(opts.xAxis.title), opts.width - opts.area[1] + opts.xAxis.titleOffsetX * opts.pix, opts.height - opts.area[2] + opts.xAxis.marginTop * opts.pix + (opts.xAxis.lineHeight - opts.xAxis.titleFontSize) * opts.pix / 2 + (opts.xAxis.titleFontSize + opts.xAxis.titleOffsetY) * opts.pix)
    context.closePath()
    context.stroke()
  }

  // 绘制X轴轴线
  if (opts.xAxis.axisLine) {
    context.beginPath()
    context.setStrokeStyle(opts.xAxis.axisLineColor)
    context.setLineWidth(1 * opts.pix)
    context.moveTo(startX, opts.height - opts.area[2])
    context.lineTo(endX, opts.height - opts.area[2])
    context.stroke()
  }
}

function drawYAxisGrid(categories, opts, config, context) {
  if (opts.yAxis.disableGrid === true)
    return

  const spacingValid = opts.height - opts.area[0] - opts.area[2]
  const eachSpacing = spacingValid / opts.yAxis.splitNumber
  const startX = opts.area[3]
  const xAxisPoints = opts.chartData.xAxisData.xAxisPoints
  const xAxiseachSpacing = opts.chartData.xAxisData.eachSpacing
  let TotalWidth = xAxiseachSpacing * (xAxisPoints.length - 1)
  if (opts.type == 'mount' && opts.extra && opts.extra.mount && opts.extra.mount.widthRatio && opts.extra.mount.widthRatio > 1) {
    if (opts.extra.mount.widthRatio > 2)
      opts.extra.mount.widthRatio = 2
    TotalWidth += (opts.extra.mount.widthRatio - 1) * xAxiseachSpacing
  }
  const endX = startX + TotalWidth
  const points = []
  let startY = 1
  if (opts.xAxis.axisLine === false)
    startY = 0

  for (let i = startY; i < opts.yAxis.splitNumber + 1; i++)
    points.push(opts.height - opts.area[2] - eachSpacing * i)

  context.save()
  if (opts._scrollDistance_ && opts._scrollDistance_ !== 0)
    context.translate(opts._scrollDistance_, 0)

  if (opts.yAxis.gridType == 'dash')
    context.setLineDash([opts.yAxis.dashLength * opts.pix, opts.yAxis.dashLength * opts.pix])

  context.setStrokeStyle(opts.yAxis.gridColor)
  context.setLineWidth(1 * opts.pix)
  points.forEach((item, index) => {
    context.beginPath()
    context.moveTo(startX, item)
    context.lineTo(endX, item)
    context.stroke()
  })
  context.setLineDash([])
  context.restore()
}

function drawYAxis(series, opts, config, context) {
  if (opts.yAxis.disabled === true)
    return

  const spacingValid = opts.height - opts.area[0] - opts.area[2]
  const eachSpacing = spacingValid / opts.yAxis.splitNumber
  const startX = opts.area[3]
  const endX = opts.width - opts.area[1]
  const endY = opts.height - opts.area[2]
  // set YAxis background
  context.beginPath()
  context.setFillStyle(opts.background)
  if (opts.enableScroll == true && opts.xAxis.scrollPosition && opts.xAxis.scrollPosition !== 'left')
    context.fillRect(0, 0, startX, endY + 2 * opts.pix)

  if (opts.enableScroll == true && opts.xAxis.scrollPosition && opts.xAxis.scrollPosition !== 'right')
    context.fillRect(endX, 0, opts.width, endY + 2 * opts.pix)

  context.closePath()
  context.stroke()

  let tStartLeft = opts.area[3]
  let tStartRight = opts.width - opts.area[1]
  const tStartCenter = opts.area[3] + (opts.width - opts.area[1] - opts.area[3]) / 2
  if (opts.yAxis.data) {
    for (let i = 0; i < opts.yAxis.data.length; i++) {
      const yData = opts.yAxis.data[i]
      var points = []
      if (yData.type === 'categories') {
        for (let i = 0; i <= yData.categories.length; i++)
          points.push(opts.area[0] + spacingValid / yData.categories.length / 2 + spacingValid / yData.categories.length * i)
      }
      else {
        for (let i = 0; i <= opts.yAxis.splitNumber; i++)
          points.push(opts.area[0] + eachSpacing * i)
      }
      if (yData.disabled !== true) {
        const rangesFormat = opts.chartData.yAxisData.rangesFormat[i]
        const yAxisFontSize = yData.fontSize ? yData.fontSize * opts.pix : config.fontSize
        const yAxisWidth = opts.chartData.yAxisData.yAxisWidth[i]
        const textAlign = yData.textAlign || 'right'
        // 画Y轴刻度及文案
        rangesFormat.forEach((item, index) => {
          const pos = points[index]
          context.beginPath()
          context.setFontSize(yAxisFontSize)
          context.setLineWidth(1 * opts.pix)
          context.setStrokeStyle(yData.axisLineColor || '#cccccc')
          context.setFillStyle(yData.fontColor || opts.fontColor)
          let tmpstrat = 0
          let gapwidth = 4 * opts.pix
          if (yAxisWidth.position == 'left') {
            // 画刻度线
            if (yData.calibration == true) {
              context.moveTo(tStartLeft, pos)
              context.lineTo(tStartLeft - 3 * opts.pix, pos)
              gapwidth += 3 * opts.pix
            }
            // 画文字
            switch (textAlign) {
              case 'left':
                context.setTextAlign('left')
                tmpstrat = tStartLeft - yAxisWidth.width
                break
              case 'right':
                context.setTextAlign('right')
                tmpstrat = tStartLeft - gapwidth
                break
              default:
                context.setTextAlign('center')
                tmpstrat = tStartLeft - yAxisWidth.width / 2
            }
            context.fillText(String(item), tmpstrat, pos + yAxisFontSize / 2 - 3 * opts.pix)
          }
          else if (yAxisWidth.position == 'right') {
            // 画刻度线
            if (yData.calibration == true) {
              context.moveTo(tStartRight, pos)
              context.lineTo(tStartRight + 3 * opts.pix, pos)
              gapwidth += 3 * opts.pix
            }
            switch (textAlign) {
              case 'left':
                context.setTextAlign('left')
                tmpstrat = tStartRight + gapwidth
                break
              case 'right':
                context.setTextAlign('right')
                tmpstrat = tStartRight + yAxisWidth.width
                break
              default:
                context.setTextAlign('center')
                tmpstrat = tStartRight + yAxisWidth.width / 2
            }
            context.fillText(String(item), tmpstrat, pos + yAxisFontSize / 2 - 3 * opts.pix)
          }
          else if (yAxisWidth.position == 'center') {
            // 画刻度线
            if (yData.calibration == true) {
              context.moveTo(tStartCenter, pos)
              context.lineTo(tStartCenter - 3 * opts.pix, pos)
              gapwidth += 3 * opts.pix
            }
            // 画文字
            switch (textAlign) {
              case 'left':
                context.setTextAlign('left')
                tmpstrat = tStartCenter - yAxisWidth.width
                break
              case 'right':
                context.setTextAlign('right')
                tmpstrat = tStartCenter - gapwidth
                break
              default:
                context.setTextAlign('center')
                tmpstrat = tStartCenter - yAxisWidth.width / 2
            }
            context.fillText(String(item), tmpstrat, pos + yAxisFontSize / 2 - 3 * opts.pix)
          }
          context.closePath()
          context.stroke()
          context.setTextAlign('left')
        })
        // 画Y轴轴线
        if (yData.axisLine !== false) {
          context.beginPath()
          context.setStrokeStyle(yData.axisLineColor || '#cccccc')
          context.setLineWidth(1 * opts.pix)
          if (yAxisWidth.position == 'left') {
            context.moveTo(tStartLeft, opts.height - opts.area[2])
            context.lineTo(tStartLeft, opts.area[0])
          }
          else if (yAxisWidth.position == 'right') {
            context.moveTo(tStartRight, opts.height - opts.area[2])
            context.lineTo(tStartRight, opts.area[0])
          }
          else if (yAxisWidth.position == 'center') {
            context.moveTo(tStartCenter, opts.height - opts.area[2])
            context.lineTo(tStartCenter, opts.area[0])
          }
          context.stroke()
        }
        // 画Y轴标题
        if (opts.yAxis.showTitle) {
          const titleFontSize = yData.titleFontSize * opts.pix || config.fontSize
          const title = yData.title
          context.beginPath()
          context.setFontSize(titleFontSize)
          context.setFillStyle(yData.titleFontColor || opts.fontColor)
          if (yAxisWidth.position == 'left')
            context.fillText(title, tStartLeft - measureText(title, titleFontSize, context) / 2 + (yData.titleOffsetX || 0), opts.area[0] - (10 - (yData.titleOffsetY || 0)) * opts.pix)
          else if (yAxisWidth.position == 'right')
            context.fillText(title, tStartRight - measureText(title, titleFontSize, context) / 2 + (yData.titleOffsetX || 0), opts.area[0] - (10 - (yData.titleOffsetY || 0)) * opts.pix)
          else if (yAxisWidth.position == 'center')
            context.fillText(title, tStartCenter - measureText(title, titleFontSize, context) / 2 + (yData.titleOffsetX || 0), opts.area[0] - (10 - (yData.titleOffsetY || 0)) * opts.pix)

          context.closePath()
          context.stroke()
        }
        if (yAxisWidth.position == 'left')
          tStartLeft -= (yAxisWidth.width + opts.yAxis.padding * opts.pix)
        else
          tStartRight += yAxisWidth.width + opts.yAxis.padding * opts.pix
      }
    }
  }
}

function drawLegend(series, opts, config, context, chartData) {
  if (opts.legend.show === false)
    return

  const legendData = chartData.legendData
  const legendList = legendData.points
  const legendArea = legendData.area
  const padding = opts.legend.padding * opts.pix
  const fontSize = opts.legend.fontSize * opts.pix
  const shapeWidth = 15 * opts.pix
  const shapeRight = 5 * opts.pix
  const itemGap = opts.legend.itemGap * opts.pix
  const lineHeight = Math.max(opts.legend.lineHeight * opts.pix, fontSize)
  // 画背景及边框
  context.beginPath()
  context.setLineWidth(opts.legend.borderWidth * opts.pix)
  context.setStrokeStyle(opts.legend.borderColor)
  context.setFillStyle(opts.legend.backgroundColor)
  context.moveTo(legendArea.start.x, legendArea.start.y)
  context.rect(legendArea.start.x, legendArea.start.y, legendArea.width, legendArea.height)
  context.closePath()
  context.fill()
  context.stroke()
  legendList.forEach((itemList, listIndex) => {
    let width = 0
    let height = 0
    width = legendData.widthArr[listIndex]
    height = legendData.heightArr[listIndex]
    let startX = 0
    let startY = 0
    if (opts.legend.position == 'top' || opts.legend.position == 'bottom') {
      switch (opts.legend.float) {
        case 'left':
          startX = legendArea.start.x + padding
          break
        case 'right':
          startX = legendArea.start.x + legendArea.width - width
          break
        default:
          startX = legendArea.start.x + (legendArea.width - width) / 2
      }
      startY = legendArea.start.y + padding + listIndex * lineHeight
    }
    else {
      if (listIndex == 0)
        width = 0
      else
        width = legendData.widthArr[listIndex - 1]

      startX = legendArea.start.x + padding + width
      startY = legendArea.start.y + padding + (legendArea.height - height) / 2
    }
    context.setFontSize(config.fontSize)
    for (let i = 0; i < itemList.length; i++) {
      const item = itemList[i]
      item.area = [0, 0, 0, 0]
      item.area[0] = startX
      item.area[1] = startY
      item.area[3] = startY + lineHeight
      context.beginPath()
      context.setLineWidth(1 * opts.pix)
      context.setStrokeStyle(item.show ? item.color : opts.legend.hiddenColor)
      context.setFillStyle(item.show ? item.color : opts.legend.hiddenColor)
      switch (item.legendShape) {
        case 'line':
          context.moveTo(startX, startY + 0.5 * lineHeight - 2 * opts.pix)
          context.fillRect(startX, startY + 0.5 * lineHeight - 2 * opts.pix, 15 * opts.pix, 4 * opts.pix)
          break
        case 'triangle':
          context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix)
          context.lineTo(startX + 2.5 * opts.pix, startY + 0.5 * lineHeight + 5 * opts.pix)
          context.lineTo(startX + 12.5 * opts.pix, startY + 0.5 * lineHeight + 5 * opts.pix)
          context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix)
          break
        case 'diamond':
          context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix)
          context.lineTo(startX + 2.5 * opts.pix, startY + 0.5 * lineHeight)
          context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight + 5 * opts.pix)
          context.lineTo(startX + 12.5 * opts.pix, startY + 0.5 * lineHeight)
          context.lineTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix)
          break
        case 'circle':
          context.moveTo(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight)
          context.arc(startX + 7.5 * opts.pix, startY + 0.5 * lineHeight, 5 * opts.pix, 0, 2 * Math.PI)
          break
        case 'rect':
          context.moveTo(startX, startY + 0.5 * lineHeight - 5 * opts.pix)
          context.fillRect(startX, startY + 0.5 * lineHeight - 5 * opts.pix, 15 * opts.pix, 10 * opts.pix)
          break
        case 'square':
          context.moveTo(startX + 5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix)
          context.fillRect(startX + 5 * opts.pix, startY + 0.5 * lineHeight - 5 * opts.pix, 10 * opts.pix, 10 * opts.pix)
          break
        case 'none':
          break
        default:
          context.moveTo(startX, startY + 0.5 * lineHeight - 5 * opts.pix)
          context.fillRect(startX, startY + 0.5 * lineHeight - 5 * opts.pix, 15 * opts.pix, 10 * opts.pix)
      }
      context.closePath()
      context.fill()
      context.stroke()
      startX += shapeWidth + shapeRight
      const fontTrans = 0.5 * lineHeight + 0.5 * fontSize - 2
      const legendText = item.legendText ? item.legendText : item.name
      context.beginPath()
      context.setFontSize(fontSize)
      context.setFillStyle(item.show ? opts.legend.fontColor : opts.legend.hiddenColor)
      context.fillText(legendText, startX, startY + fontTrans)
      context.closePath()
      context.stroke()
      if (opts.legend.position == 'top' || opts.legend.position == 'bottom') {
        startX += measureText(legendText, fontSize, context) + itemGap
        item.area[2] = startX
      }
      else {
        item.area[2] = startX + measureText(legendText, fontSize, context) + itemGap
        startX -= shapeWidth + shapeRight
        startY += lineHeight
      }
    }
  })
}

function drawPieDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const pieOption = assign({}, {
    activeOpacity: 0.5,
    activeRadius: 10,
    offsetAngle: 0,
    labelWidth: 15,
    ringWidth: 30,
    customRadius: 0,
    border: false,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    centerColor: '#FFFFFF',
    linearType: 'none',
    customColor: [],
  }, opts.type == 'pie' ? opts.extra.pie : opts.extra.ring)
  const centerPosition = {
    x: opts.area[3] + (opts.width - opts.area[1] - opts.area[3]) / 2,
    y: opts.area[0] + (opts.height - opts.area[0] - opts.area[2]) / 2,
  }
  if (config.pieChartLinePadding == 0)
    config.pieChartLinePadding = pieOption.activeRadius * opts.pix

  let radius = Math.min((opts.width - opts.area[1] - opts.area[3]) / 2 - config.pieChartLinePadding - config.pieChartTextPadding - config._pieTextMaxLength_, (opts.height - opts.area[0] - opts.area[2]) / 2 - config.pieChartLinePadding - config.pieChartTextPadding)
  radius = radius < 10 ? 10 : radius
  if (pieOption.customRadius > 0)
    radius = pieOption.customRadius * opts.pix

  series = getPieDataPoints(series, radius, process)
  const activeRadius = pieOption.activeRadius * opts.pix
  pieOption.customColor = fillCustomColor(pieOption.linearType, pieOption.customColor, series, config)
  series = series.map((eachSeries) => {
    eachSeries._start_ += (pieOption.offsetAngle) * Math.PI / 180
    return eachSeries
  })
  series.forEach((eachSeries, seriesIndex) => {
    if (opts.tooltip) {
      if (opts.tooltip.index == seriesIndex) {
        context.beginPath()
        context.setFillStyle(hexToRgb(eachSeries.color, pieOption.activeOpacity || 0.5))
        context.moveTo(centerPosition.x, centerPosition.y)
        context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_ + activeRadius, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ * Math.PI)
        context.closePath()
        context.fill()
      }
    }
    context.beginPath()
    context.setLineWidth(pieOption.borderWidth * opts.pix)
    context.lineJoin = 'round'
    context.setStrokeStyle(pieOption.borderColor)
    let fillcolor = eachSeries.color
    if (pieOption.linearType == 'custom') {
      let grd
      if (context.createCircularGradient)
        grd = context.createCircularGradient(centerPosition.x, centerPosition.y, eachSeries._radius_)

      else
        grd = context.createRadialGradient(centerPosition.x, centerPosition.y, 0, centerPosition.x, centerPosition.y, eachSeries._radius_)

      grd.addColorStop(0, hexToRgb(pieOption.customColor[eachSeries.linearIndex], 1))
      grd.addColorStop(1, hexToRgb(eachSeries.color, 1))
      fillcolor = grd
    }
    context.setFillStyle(fillcolor)
    context.moveTo(centerPosition.x, centerPosition.y)
    context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ * Math.PI)
    context.closePath()
    context.fill()
    if (pieOption.border == true)
      context.stroke()
  })
  if (opts.type === 'ring') {
    let innerPieWidth = radius * 0.6
    if (typeof pieOption.ringWidth === 'number' && pieOption.ringWidth > 0)
      innerPieWidth = Math.max(0, radius - pieOption.ringWidth * opts.pix)

    context.beginPath()
    context.setFillStyle(pieOption.centerColor)
    context.moveTo(centerPosition.x, centerPosition.y)
    context.arc(centerPosition.x, centerPosition.y, innerPieWidth, 0, 2 * Math.PI)
    context.closePath()
    context.fill()
  }
  if (opts.dataLabel !== false && process === 1)
    drawPieText(series, opts, config, context, radius, centerPosition)

  if (process === 1 && opts.type === 'ring')
    drawRingTitle(opts, config, context, centerPosition)

  return {
    center: centerPosition,
    radius,
    series,
  }
}

function drawRoseDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const roseOption = assign({}, {
    type: 'area',
    activeOpacity: 0.5,
    activeRadius: 10,
    offsetAngle: 0,
    labelWidth: 15,
    border: false,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    linearType: 'none',
    customColor: [],
  }, opts.extra.rose)
  if (config.pieChartLinePadding == 0)
    config.pieChartLinePadding = roseOption.activeRadius * opts.pix

  const centerPosition = {
    x: opts.area[3] + (opts.width - opts.area[1] - opts.area[3]) / 2,
    y: opts.area[0] + (opts.height - opts.area[0] - opts.area[2]) / 2,
  }
  let radius = Math.min((opts.width - opts.area[1] - opts.area[3]) / 2 - config.pieChartLinePadding - config.pieChartTextPadding - config._pieTextMaxLength_, (opts.height - opts.area[0] - opts.area[2]) / 2 - config.pieChartLinePadding - config.pieChartTextPadding)
  radius = radius < 10 ? 10 : radius
  const minRadius = roseOption.minRadius || radius * 0.5
  if (radius < minRadius)
    radius = minRadius + 10

  series = getRoseDataPoints(series, roseOption.type, minRadius, radius, process)
  const activeRadius = roseOption.activeRadius * opts.pix
  roseOption.customColor = fillCustomColor(roseOption.linearType, roseOption.customColor, series, config)
  series = series.map((eachSeries) => {
    eachSeries._start_ += (roseOption.offsetAngle || 0) * Math.PI / 180
    return eachSeries
  })
  series.forEach((eachSeries, seriesIndex) => {
    if (opts.tooltip) {
      if (opts.tooltip.index == seriesIndex) {
        context.beginPath()
        context.setFillStyle(hexToRgb(eachSeries.color, roseOption.activeOpacity || 0.5))
        context.moveTo(centerPosition.x, centerPosition.y)
        context.arc(centerPosition.x, centerPosition.y, activeRadius + eachSeries._radius_, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._rose_proportion_ * Math.PI)
        context.closePath()
        context.fill()
      }
    }
    context.beginPath()
    context.setLineWidth(roseOption.borderWidth * opts.pix)
    context.lineJoin = 'round'
    context.setStrokeStyle(roseOption.borderColor)
    let fillcolor = eachSeries.color
    if (roseOption.linearType == 'custom') {
      let grd
      if (context.createCircularGradient)
        grd = context.createCircularGradient(centerPosition.x, centerPosition.y, eachSeries._radius_)

      else
        grd = context.createRadialGradient(centerPosition.x, centerPosition.y, 0, centerPosition.x, centerPosition.y, eachSeries._radius_)

      grd.addColorStop(0, hexToRgb(roseOption.customColor[eachSeries.linearIndex], 1))
      grd.addColorStop(1, hexToRgb(eachSeries.color, 1))
      fillcolor = grd
    }
    context.setFillStyle(fillcolor)
    context.moveTo(centerPosition.x, centerPosition.y)
    context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._rose_proportion_ * Math.PI)
    context.closePath()
    context.fill()
    if (roseOption.border == true)
      context.stroke()
  })

  if (opts.dataLabel !== false && process === 1)
    drawPieText(series, opts, config, context, radius, centerPosition)

  return {
    center: centerPosition,
    radius,
    series,
  }
}

function drawArcbarDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const arcbarOption = assign({}, {
    startAngle: 0.75,
    endAngle: 0.25,
    type: 'default',
    direction: 'cw',
    lineCap: 'round',
    width: 12,
    gap: 2,
    linearType: 'none',
    customColor: [],
  }, opts.extra.arcbar)
  series = getArcbarDataPoints(series, arcbarOption, process)
  let centerPosition
  if (arcbarOption.centerX || arcbarOption.centerY) {
    centerPosition = {
      x: arcbarOption.centerX ? arcbarOption.centerX : opts.width / 2,
      y: arcbarOption.centerY ? arcbarOption.centerY : opts.height / 2,
    }
  }
  else {
    centerPosition = {
      x: opts.width / 2,
      y: opts.height / 2,
    }
  }
  let radius
  if (arcbarOption.radius) {
    radius = arcbarOption.radius
  }
  else {
    radius = Math.min(centerPosition.x, centerPosition.y)
    radius -= 5 * opts.pix
    radius -= arcbarOption.width / 2
  }
  radius = radius < 10 ? 10 : radius
  arcbarOption.customColor = fillCustomColor(arcbarOption.linearType, arcbarOption.customColor, series, config)

  for (let i = 0; i < series.length; i++) {
    const eachSeries = series[i]
    // 背景颜色
    context.setLineWidth(arcbarOption.width * opts.pix)
    context.setStrokeStyle(arcbarOption.backgroundColor || '#E9E9E9')
    context.setLineCap(arcbarOption.lineCap)
    context.beginPath()
    if (arcbarOption.type == 'default')
      context.arc(centerPosition.x, centerPosition.y, radius - (arcbarOption.width * opts.pix + arcbarOption.gap * opts.pix) * i, arcbarOption.startAngle * Math.PI, arcbarOption.endAngle * Math.PI, arcbarOption.direction == 'ccw')
    else
      context.arc(centerPosition.x, centerPosition.y, radius - (arcbarOption.width * opts.pix + arcbarOption.gap * opts.pix) * i, 0, 2 * Math.PI, arcbarOption.direction == 'ccw')

    context.stroke()
    // 进度条
    let fillColor = eachSeries.color
    if (arcbarOption.linearType == 'custom') {
      const grd = context.createLinearGradient(centerPosition.x - radius, centerPosition.y, centerPosition.x + radius, centerPosition.y)
      grd.addColorStop(1, hexToRgb(arcbarOption.customColor[eachSeries.linearIndex], 1))
      grd.addColorStop(0, hexToRgb(eachSeries.color, 1))
      fillColor = grd
    }
    context.setLineWidth(arcbarOption.width * opts.pix)
    context.setStrokeStyle(fillColor)
    context.setLineCap(arcbarOption.lineCap)
    context.beginPath()
    context.arc(centerPosition.x, centerPosition.y, radius - (arcbarOption.width * opts.pix + arcbarOption.gap * opts.pix) * i, arcbarOption.startAngle * Math.PI, eachSeries._proportion_ * Math.PI, arcbarOption.direction == 'ccw')
    context.stroke()
  }
  drawRingTitle(opts, config, context, centerPosition)
  return {
    center: centerPosition,
    radius,
    series,
  }
}

function drawGaugeDataPoints(categories, series, opts, config, context) {
  const process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1
  const gaugeOption = assign({}, {
    type: 'default',
    startAngle: 0.75,
    endAngle: 0.25,
    width: 15,
    labelOffset: 13,
    splitLine: {
      fixRadius: 0,
      splitNumber: 10,
      width: 15,
      color: '#FFFFFF',
      childNumber: 5,
      childWidth: 5,
    },
    pointer: {
      width: 15,
      color: 'auto',
    },
  }, opts.extra.gauge)
  if (gaugeOption.oldAngle == undefined)
    gaugeOption.oldAngle = gaugeOption.startAngle

  if (gaugeOption.oldData == undefined)
    gaugeOption.oldData = 0

  categories = getGaugeAxisPoints(categories, gaugeOption.startAngle, gaugeOption.endAngle)
  const centerPosition = {
    x: opts.width / 2,
    y: opts.height / 2,
  }
  let radius = Math.min(centerPosition.x, centerPosition.y)
  radius -= 5 * opts.pix
  radius -= gaugeOption.width / 2
  radius = radius < 10 ? 10 : radius
  const innerRadius = radius - gaugeOption.width
  let totalAngle = 0
  // 判断仪表盘的样式：default百度样式，progress新样式
  if (gaugeOption.type == 'progress') {
    // ## 第一步画中心圆形背景和进度条背景
    // 中心圆形背景
    const pieRadius = radius - gaugeOption.width * 3
    context.beginPath()
    const gradient = context.createLinearGradient(centerPosition.x, centerPosition.y - pieRadius, centerPosition.x, centerPosition.y + pieRadius)
    // 配置渐变填充（起点：中心点向上减半径；结束点中心点向下加半径）
    gradient.addColorStop('0', hexToRgb(series[0].color, 0.3))
    gradient.addColorStop('1.0', hexToRgb('#FFFFFF', 0.1))
    context.setFillStyle(gradient)
    context.arc(centerPosition.x, centerPosition.y, pieRadius, 0, 2 * Math.PI, false)
    context.fill()
    // 画进度条背景
    context.setLineWidth(gaugeOption.width)
    context.setStrokeStyle(hexToRgb(series[0].color, 0.3))
    context.setLineCap('round')
    context.beginPath()
    context.arc(centerPosition.x, centerPosition.y, innerRadius, gaugeOption.startAngle * Math.PI, gaugeOption.endAngle * Math.PI, false)
    context.stroke()
    // ## 第二步画刻度线
    if (gaugeOption.endAngle < gaugeOption.startAngle)
      totalAngle = 2 + gaugeOption.endAngle - gaugeOption.startAngle
    else
      totalAngle = gaugeOption.startAngle - gaugeOption.endAngle

    const splitAngle = totalAngle / gaugeOption.splitLine.splitNumber
    const childAngle = totalAngle / gaugeOption.splitLine.splitNumber / gaugeOption.splitLine.childNumber
    const startX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius
    const endX = -radius - gaugeOption.width - gaugeOption.splitLine.fixRadius + gaugeOption.splitLine.width
    context.save()
    context.translate(centerPosition.x, centerPosition.y)
    context.rotate((gaugeOption.startAngle - 1) * Math.PI)
    const len = gaugeOption.splitLine.splitNumber * gaugeOption.splitLine.childNumber + 1
    const proc = series[0].data * process
    for (let i = 0; i < len; i++) {
      context.beginPath()
      // 刻度线随进度变色
      if (proc > (i / len))
        context.setStrokeStyle(hexToRgb(series[0].color, 1))
      else
        context.setStrokeStyle(hexToRgb(series[0].color, 0.3))

      context.setLineWidth(3 * opts.pix)
      context.moveTo(startX, 0)
      context.lineTo(endX, 0)
      context.stroke()
      context.rotate(childAngle * Math.PI)
    }
    context.restore()
    // ## 第三步画进度条
    series = getGaugeArcbarDataPoints(series, gaugeOption, process)
    context.setLineWidth(gaugeOption.width)
    context.setStrokeStyle(series[0].color)
    context.setLineCap('round')
    context.beginPath()
    context.arc(centerPosition.x, centerPosition.y, innerRadius, gaugeOption.startAngle * Math.PI, series[0]._proportion_ * Math.PI, false)
    context.stroke()
    // ## 第四步画指针
    const pointerRadius = radius - gaugeOption.width * 2.5
    context.save()
    context.translate(centerPosition.x, centerPosition.y)
    context.rotate((series[0]._proportion_ - 1) * Math.PI)
    context.beginPath()
    context.setLineWidth(gaugeOption.width / 3)
    const gradient3 = context.createLinearGradient(0, -pointerRadius * 0.6, 0, pointerRadius * 0.6)
    gradient3.addColorStop('0', hexToRgb('#FFFFFF', 0))
    gradient3.addColorStop('0.5', hexToRgb(series[0].color, 1))
    gradient3.addColorStop('1.0', hexToRgb('#FFFFFF', 0))
    context.setStrokeStyle(gradient3)
    context.arc(0, 0, pointerRadius, 0.85 * Math.PI, 1.15 * Math.PI, false)
    context.stroke()
    context.beginPath()
    context.setLineWidth(1)
    context.setStrokeStyle(series[0].color)
    context.setFillStyle(series[0].color)
    context.moveTo(-pointerRadius - gaugeOption.width / 3 / 2, -4)
    context.lineTo(-pointerRadius - gaugeOption.width / 3 / 2 - 4, 0)
    context.lineTo(-pointerRadius - gaugeOption.width / 3 / 2, 4)
    context.lineTo(-pointerRadius - gaugeOption.width / 3 / 2, -4)
    context.stroke()
    context.fill()
    context.restore()
    // default百度样式
  }
  else {
    // 画背景
    context.setLineWidth(gaugeOption.width)
    context.setLineCap('butt')
    for (let i = 0; i < categories.length; i++) {
      const eachCategories = categories[i]
      context.beginPath()
      context.setStrokeStyle(eachCategories.color)
      context.arc(centerPosition.x, centerPosition.y, radius, eachCategories._startAngle_ * Math.PI, eachCategories._endAngle_ * Math.PI, false)
      context.stroke()
    }
    context.save()
    // 画刻度线
    if (gaugeOption.endAngle < gaugeOption.startAngle)
      totalAngle = 2 + gaugeOption.endAngle - gaugeOption.startAngle
    else
      totalAngle = gaugeOption.startAngle - gaugeOption.endAngle

    const splitAngle = totalAngle / gaugeOption.splitLine.splitNumber
    const childAngle = totalAngle / gaugeOption.splitLine.splitNumber / gaugeOption.splitLine.childNumber
    const startX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius
    const endX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius + gaugeOption.splitLine.width
    const childendX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius + gaugeOption.splitLine.childWidth
    context.translate(centerPosition.x, centerPosition.y)
    context.rotate((gaugeOption.startAngle - 1) * Math.PI)
    for (let i = 0; i < gaugeOption.splitLine.splitNumber + 1; i++) {
      context.beginPath()
      context.setStrokeStyle(gaugeOption.splitLine.color)
      context.setLineWidth(2 * opts.pix)
      context.moveTo(startX, 0)
      context.lineTo(endX, 0)
      context.stroke()
      context.rotate(splitAngle * Math.PI)
    }
    context.restore()
    context.save()
    context.translate(centerPosition.x, centerPosition.y)
    context.rotate((gaugeOption.startAngle - 1) * Math.PI)
    for (let i = 0; i < gaugeOption.splitLine.splitNumber * gaugeOption.splitLine.childNumber + 1; i++) {
      context.beginPath()
      context.setStrokeStyle(gaugeOption.splitLine.color)
      context.setLineWidth(1 * opts.pix)
      context.moveTo(startX, 0)
      context.lineTo(childendX, 0)
      context.stroke()
      context.rotate(childAngle * Math.PI)
    }
    context.restore()
    // 画指针
    series = getGaugeDataPoints(series, categories, gaugeOption, process)
    for (let i = 0; i < series.length; i++) {
      const eachSeries = series[i]
      context.save()
      context.translate(centerPosition.x, centerPosition.y)
      context.rotate((eachSeries._proportion_ - 1) * Math.PI)
      context.beginPath()
      context.setFillStyle(eachSeries.color)
      context.moveTo(gaugeOption.pointer.width, 0)
      context.lineTo(0, -gaugeOption.pointer.width / 2)
      context.lineTo(-innerRadius, 0)
      context.lineTo(0, gaugeOption.pointer.width / 2)
      context.lineTo(gaugeOption.pointer.width, 0)
      context.closePath()
      context.fill()
      context.beginPath()
      context.setFillStyle('#FFFFFF')
      context.arc(0, 0, gaugeOption.pointer.width / 6, 0, 2 * Math.PI, false)
      context.fill()
      context.restore()
    }
    if (opts.dataLabel !== false)
      drawGaugeLabel(gaugeOption, radius, centerPosition, opts, config, context)
  }
  // 画仪表盘标题，副标题
  drawRingTitle(opts, config, context, centerPosition)
  if (process === 1 && opts.type === 'gauge') {
    opts.extra.gauge.oldAngle = series[0]._proportion_
    opts.extra.gauge.oldData = series[0].data
  }
  return {
    center: centerPosition,
    radius,
    innerRadius,
    categories,
    totalAngle,
  }
}

function drawRadarDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const radarOption = assign({}, {
    gridColor: '#cccccc',
    gridType: 'radar',
    gridEval: 1,
    axisLabel: false,
    axisLabelTofix: 0,
    labelShow: true,
    labelColor: '#666666',
    labelPointShow: false,
    labelPointRadius: 3,
    labelPointColor: '#cccccc',
    opacity: 0.2,
    gridCount: 3,
    border: false,
    borderWidth: 2,
    linearType: 'none',
    customColor: [],
  }, opts.extra.radar)
  const coordinateAngle = getRadarCoordinateSeries(opts.categories.length)
  const centerPosition = {
    x: opts.area[3] + (opts.width - opts.area[1] - opts.area[3]) / 2,
    y: opts.area[0] + (opts.height - opts.area[0] - opts.area[2]) / 2,
  }
  const xr = (opts.width - opts.area[1] - opts.area[3]) / 2
  const yr = (opts.height - opts.area[0] - opts.area[2]) / 2
  let radius = Math.min(xr - (getMaxTextListLength(opts.categories, config.fontSize, context) + config.radarLabelTextMargin), yr - config.radarLabelTextMargin)
  radius -= config.radarLabelTextMargin * opts.pix
  radius = radius < 10 ? 10 : radius
  radius = radarOption.radius ? radarOption.radius : radius
  // 画分割线
  context.beginPath()
  context.setLineWidth(1 * opts.pix)
  context.setStrokeStyle(radarOption.gridColor)
  coordinateAngle.forEach((angle, index) => {
    const pos = convertCoordinateOrigin(radius * Math.cos(angle), radius * Math.sin(angle), centerPosition)
    context.moveTo(centerPosition.x, centerPosition.y)
    if (index % radarOption.gridEval == 0)
      context.lineTo(pos.x, pos.y)
  })
  context.stroke()
  context.closePath()

  // 画背景网格
  const _loop = function _loop(i) {
    let startPos = {}
    context.beginPath()
    context.setLineWidth(1 * opts.pix)
    context.setStrokeStyle(radarOption.gridColor)
    if (radarOption.gridType == 'radar') {
      coordinateAngle.forEach((angle, index) => {
        const pos = convertCoordinateOrigin(radius / radarOption.gridCount * i * Math.cos(angle), radius
          / radarOption.gridCount * i * Math.sin(angle), centerPosition)
        if (index === 0) {
          startPos = pos
          context.moveTo(pos.x, pos.y)
        }
        else {
          context.lineTo(pos.x, pos.y)
        }
      })
      context.lineTo(startPos.x, startPos.y)
    }
    else {
      const pos = convertCoordinateOrigin(radius / radarOption.gridCount * i * Math.cos(1.5), radius / radarOption.gridCount * i * Math.sin(1.5), centerPosition)
      context.arc(centerPosition.x, centerPosition.y, centerPosition.y - pos.y, 0, 2 * Math.PI, false)
    }
    context.stroke()
    context.closePath()
  }
  for (var i = 1; i <= radarOption.gridCount; i++)
    _loop(i)

  radarOption.customColor = fillCustomColor(radarOption.linearType, radarOption.customColor, series, config)
  const radarDataPoints = getRadarDataPoints(coordinateAngle, centerPosition, radius, series, opts, process)
  radarDataPoints.forEach((eachSeries, seriesIndex) => {
    // 绘制区域数据
    context.beginPath()
    context.setLineWidth(radarOption.borderWidth * opts.pix)
    context.setStrokeStyle(eachSeries.color)

    let fillcolor = hexToRgb(eachSeries.color, radarOption.opacity)
    if (radarOption.linearType == 'custom') {
      let grd
      if (context.createCircularGradient)
        grd = context.createCircularGradient(centerPosition.x, centerPosition.y, radius)

      else
        grd = context.createRadialGradient(centerPosition.x, centerPosition.y, 0, centerPosition.x, centerPosition.y, radius)

      grd.addColorStop(0, hexToRgb(radarOption.customColor[series[seriesIndex].linearIndex], radarOption.opacity))
      grd.addColorStop(1, hexToRgb(eachSeries.color, radarOption.opacity))
      fillcolor = grd
    }

    context.setFillStyle(fillcolor)
    eachSeries.data.forEach((item, index) => {
      if (index === 0)
        context.moveTo(item.position.x, item.position.y)
      else
        context.lineTo(item.position.x, item.position.y)
    })
    context.closePath()
    context.fill()
    if (radarOption.border === true)
      context.stroke()

    context.closePath()
    if (opts.dataPointShape !== false) {
      const points = eachSeries.data.map((item) => {
        return item.position
      })
      drawPointShape(points, eachSeries.color, eachSeries.pointShape, context, opts)
    }
  })
  // 画刻度值
  if (radarOption.axisLabel === true) {
    const maxData = Math.max(radarOption.max, Math.max.apply(null, dataCombine(series)))
    const stepLength = radius / radarOption.gridCount
    const fontSize = opts.fontSize * opts.pix
    context.setFontSize(fontSize)
    context.setFillStyle(opts.fontColor)
    context.setTextAlign('left')
    for (var i = 0; i < radarOption.gridCount + 1; i++) {
      let label = i * maxData / radarOption.gridCount
      label = label.toFixed(radarOption.axisLabelTofix)
      context.fillText(String(label), centerPosition.x + 3 * opts.pix, centerPosition.y - i * stepLength + fontSize / 2)
    }
  }

  // draw label text
  drawRadarLabel(coordinateAngle, radius, centerPosition, opts, config, context)

  // draw dataLabel
  if (opts.dataLabel !== false && process === 1) {
    radarDataPoints.forEach((eachSeries, seriesIndex) => {
      context.beginPath()
      const fontSize = eachSeries.textSize * opts.pix || config.fontSize
      context.setFontSize(fontSize)
      context.setFillStyle(eachSeries.textColor || opts.fontColor)
      eachSeries.data.forEach((item, index) => {
        // 如果是中心点垂直的上下点位
        if (Math.abs(item.position.x - centerPosition.x) < 2) {
          // 如果在上面
          if (item.position.y < centerPosition.y) {
            context.setTextAlign('center')
            context.fillText(item.value, item.position.x, item.position.y - 4)
          }
          else {
            context.setTextAlign('center')
            context.fillText(item.value, item.position.x, item.position.y + fontSize + 2)
          }
        }
        else {
          // 如果在左侧
          if (item.position.x < centerPosition.x) {
            context.setTextAlign('right')
            context.fillText(item.value, item.position.x - 4, item.position.y + fontSize / 2 - 2)
          }
          else {
            context.setTextAlign('left')
            context.fillText(item.value, item.position.x + 4, item.position.y + fontSize / 2 - 2)
          }
        }
      })
      context.closePath()
      context.stroke()
    })
    context.setTextAlign('left')
  }

  return {
    center: centerPosition,
    radius,
    angleList: coordinateAngle,
  }
}

// 经纬度转墨卡托
function lonlat2mercator(longitude, latitude) {
  const mercator = Array(2)
  const x = longitude * 20037508.34 / 180
  let y = Math.log(Math.tan((90 + latitude) * Math.PI / 360)) / (Math.PI / 180)
  y = y * 20037508.34 / 180
  mercator[0] = x
  mercator[1] = y
  return mercator
}

// 墨卡托转经纬度
function mercator2lonlat(longitude, latitude) {
  const lonlat = Array(2)
  const x = longitude / 20037508.34 * 180
  let y = latitude / 20037508.34 * 180
  y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2)
  lonlat[0] = x
  lonlat[1] = y
  return lonlat
}

function getBoundingBox(data) {
  const bounds = {}; let coords
  bounds.xMin = 180
  bounds.xMax = 0
  bounds.yMin = 90
  bounds.yMax = 0
  for (let i = 0; i < data.length; i++) {
    const coorda = data[i].geometry.coordinates
    for (let k = 0; k < coorda.length; k++) {
      coords = coorda[k]
      if (coords.length == 1)
        coords = coords[0]

      for (let j = 0; j < coords.length; j++) {
        const longitude = coords[j][0]
        const latitude = coords[j][1]
        const point = {
          x: longitude,
          y: latitude,
        }
        bounds.xMin = bounds.xMin < point.x ? bounds.xMin : point.x
        bounds.xMax = bounds.xMax > point.x ? bounds.xMax : point.x
        bounds.yMin = bounds.yMin < point.y ? bounds.yMin : point.y
        bounds.yMax = bounds.yMax > point.y ? bounds.yMax : point.y
      }
    }
  }
  return bounds
}

function coordinateToPoint(latitude, longitude, bounds, scale, xoffset, yoffset) {
  return {
    x: (longitude - bounds.xMin) * scale + xoffset,
    y: (bounds.yMax - latitude) * scale + yoffset,
  }
}

function pointToCoordinate(pointY, pointX, bounds, scale, xoffset, yoffset) {
  return {
    x: (pointX - xoffset) / scale + bounds.xMin,
    y: bounds.yMax - (pointY - yoffset) / scale,
  }
}

function isRayIntersectsSegment(poi, s_poi, e_poi) {
  if (s_poi[1] == e_poi[1])
    return false

  if (s_poi[1] > poi[1] && e_poi[1] > poi[1])
    return false

  if (s_poi[1] < poi[1] && e_poi[1] < poi[1])
    return false

  if (s_poi[1] == poi[1] && e_poi[1] > poi[1])
    return false

  if (e_poi[1] == poi[1] && s_poi[1] > poi[1])
    return false

  if (s_poi[0] < poi[0] && e_poi[1] < poi[1])
    return false

  const xseg = e_poi[0] - (e_poi[0] - s_poi[0]) * (e_poi[1] - poi[1]) / (e_poi[1] - s_poi[1])
  if (xseg < poi[0])
    return false
  else
    return true
}

function isPoiWithinPoly(poi, poly, mercator) {
  let sinsc = 0
  for (let i = 0; i < poly.length; i++) {
    let epoly = poly[i][0]
    if (poly.length == 1)
      epoly = poly[i][0]

    for (let j = 0; j < epoly.length - 1; j++) {
      let s_poi = epoly[j]
      let e_poi = epoly[j + 1]
      if (mercator) {
        s_poi = lonlat2mercator(epoly[j][0], epoly[j][1])
        e_poi = lonlat2mercator(epoly[j + 1][0], epoly[j + 1][1])
      }
      if (isRayIntersectsSegment(poi, s_poi, e_poi))
        sinsc += 1
    }
  }
  if (sinsc % 2 == 1)
    return true
  else
    return false
}

function drawMapDataPoints(series, opts, config, context) {
  const mapOption = assign({}, {
    border: true,
    mercator: false,
    borderWidth: 1,
    active: true,
    borderColor: '#666666',
    fillOpacity: 0.6,
    activeBorderColor: '#f04864',
    activeFillColor: '#facc14',
    activeFillOpacity: 1,
  }, opts.extra.map)
  let coords, point
  const data = series
  const bounds = getBoundingBox(data)
  if (mapOption.mercator) {
    const max = lonlat2mercator(bounds.xMax, bounds.yMax)
    const min = lonlat2mercator(bounds.xMin, bounds.yMin)
    bounds.xMax = max[0]
    bounds.yMax = max[1]
    bounds.xMin = min[0]
    bounds.yMin = min[1]
  }
  const xScale = opts.width / Math.abs(bounds.xMax - bounds.xMin)
  const yScale = opts.height / Math.abs(bounds.yMax - bounds.yMin)
  const scale = xScale < yScale ? xScale : yScale
  const xoffset = opts.width / 2 - Math.abs(bounds.xMax - bounds.xMin) / 2 * scale
  const yoffset = opts.height / 2 - Math.abs(bounds.yMax - bounds.yMin) / 2 * scale
  for (var i = 0; i < data.length; i++) {
    context.beginPath()
    context.setLineWidth(mapOption.borderWidth * opts.pix)
    context.setStrokeStyle(mapOption.borderColor)
    context.setFillStyle(hexToRgb(series[i].color, series[i].fillOpacity || mapOption.fillOpacity))
    if (mapOption.active == true && opts.tooltip) {
      if (opts.tooltip.index == i) {
        context.setStrokeStyle(mapOption.activeBorderColor)
        context.setFillStyle(hexToRgb(mapOption.activeFillColor, mapOption.activeFillOpacity))
      }
    }
    const coorda = data[i].geometry.coordinates
    for (let k = 0; k < coorda.length; k++) {
      coords = coorda[k]
      if (coords.length == 1)
        coords = coords[0]

      for (let j = 0; j < coords.length; j++) {
        let gaosi = Array(2)
        if (mapOption.mercator)
          gaosi = lonlat2mercator(coords[j][0], coords[j][1])
        else
          gaosi = coords[j]

        point = coordinateToPoint(gaosi[1], gaosi[0], bounds, scale, xoffset, yoffset)
        if (j === 0) {
          context.beginPath()
          context.moveTo(point.x, point.y)
        }
        else {
          context.lineTo(point.x, point.y)
        }
      }
      context.fill()
      if (mapOption.border == true)
        context.stroke()
    }
  }
  if (opts.dataLabel == true) {
    for (var i = 0; i < data.length; i++) {
      let centerPoint = data[i].properties.centroid
      if (centerPoint) {
        if (mapOption.mercator)
          centerPoint = lonlat2mercator(data[i].properties.centroid[0], data[i].properties.centroid[1])

        point = coordinateToPoint(centerPoint[1], centerPoint[0], bounds, scale, xoffset, yoffset)
        const fontSize = data[i].textSize * opts.pix || config.fontSize
        let fontColor = data[i].textColor || opts.fontColor
        if (mapOption.active && mapOption.activeTextColor && opts.tooltip && opts.tooltip.index == i)
          fontColor = mapOption.activeTextColor

        const text = data[i].properties.name
        context.beginPath()
        context.setFontSize(fontSize)
        context.setFillStyle(fontColor)
        context.fillText(text, point.x - measureText(text, fontSize, context) / 2, point.y + fontSize / 2)
        context.closePath()
        context.stroke()
      }
    }
  }
  opts.chartData.mapData = {
    bounds,
    scale,
    xoffset,
    yoffset,
    mercator: mapOption.mercator,
  }
  drawToolTipBridge(opts, config, context, 1)
  context.draw()
}

function normalInt(min, max, iter) {
  iter = iter == 0 ? 1 : iter
  const arr = []
  for (let i = 0; i < iter; i++)
    arr[i] = Math.random()

  return Math.floor(arr.reduce((i, j) => {
    return i + j
  }) / iter * (max - min)) + min
};

function collisionNew(area, points, width, height) {
  let isIn = false
  for (let i = 0; i < points.length; i++) {
    if (points[i].area) {
      if (area[3] < points[i].area[1] || area[0] > points[i].area[2] || area[1] > points[i].area[3] || area[2] < points[i].area[0]) {
        if (area[0] < 0 || area[1] < 0 || area[2] > width || area[3] > height) {
          isIn = true
          break
        }
        else {
          isIn = false
        }
      }
      else {
        isIn = true
        break
      }
    }
  }
  return isIn
};

function getWordCloudPoint(opts, type, context) {
  const points = opts.series
  switch (type) {
    case 'normal':
      for (let i = 0; i < points.length; i++) {
        const text = points[i].name
        const tHeight = points[i].textSize * opts.pix
        const tWidth = measureText(text, tHeight, context)
        let x, y
        let area
        let breaknum = 0
        while (true) {
          breaknum++
          x = normalInt(-opts.width / 2, opts.width / 2, 5) - tWidth / 2
          y = normalInt(-opts.height / 2, opts.height / 2, 5) + tHeight / 2
          area = [x - 5 + opts.width / 2, y - 5 - tHeight + opts.height / 2, x + tWidth + 5 + opts.width / 2, y + 5
          + opts.height / 2]
          const isCollision = collisionNew(area, points, opts.width, opts.height)
          if (!isCollision)
            break
          if (breaknum == 1000) {
            area = [-100, -100, -100, -100]
            break
          }
        };
        points[i].area = area
      }
      break
    case 'vertical':
      function Spin() {
        // 获取均匀随机值，是否旋转，旋转的概率为（1-0.5）
        if (Math.random() > 0.7)
          return true
        else
          return false
      };
      for (let i = 0; i < points.length; i++) {
        const text = points[i].name
        const tHeight = points[i].textSize * opts.pix
        const tWidth = measureText(text, tHeight, context)
        const isSpin = Spin()
        let x, y, area, areav
        let breaknum = 0
        while (true) {
          breaknum++
          let isCollision
          if (isSpin) {
            x = normalInt(-opts.width / 2, opts.width / 2, 5) - tWidth / 2
            y = normalInt(-opts.height / 2, opts.height / 2, 5) + tHeight / 2
            area = [y - 5 - tWidth + opts.width / 2, (-x - 5 + opts.height / 2), y + 5 + opts.width / 2, (-x + tHeight + 5 + opts.height / 2)]
            areav = [opts.width - (opts.width / 2 - opts.height / 2) - (-x + tHeight + 5 + opts.height / 2) - 5, (opts.height / 2 - opts.width / 2) + (y - 5 - tWidth + opts.width / 2) - 5, opts.width - (opts.width / 2 - opts.height / 2) - (-x + tHeight + 5 + opts.height / 2) + tHeight, (opts.height / 2 - opts.width / 2) + (y - 5 - tWidth + opts.width / 2) + tWidth + 5]
            isCollision = collisionNew(areav, points, opts.height, opts.width)
          }
          else {
            x = normalInt(-opts.width / 2, opts.width / 2, 5) - tWidth / 2
            y = normalInt(-opts.height / 2, opts.height / 2, 5) + tHeight / 2
            area = [x - 5 + opts.width / 2, y - 5 - tHeight + opts.height / 2, x + tWidth + 5 + opts.width / 2, y + 5 + opts.height / 2]
            isCollision = collisionNew(area, points, opts.width, opts.height)
          }
          if (!isCollision)
            break
          if (breaknum == 1000) {
            area = [-1000, -1000, -1000, -1000]
            break
          }
        };
        if (isSpin) {
          points[i].area = areav
          points[i].areav = area
        }
        else {
          points[i].area = area
        }
        points[i].rotate = isSpin
      };
      break
  }
  return points
}

function drawWordCloudDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const wordOption = assign({}, {
    type: 'normal',
    autoColors: true,
  }, opts.extra.word)
  if (!opts.chartData.wordCloudData)
    opts.chartData.wordCloudData = getWordCloudPoint(opts, wordOption.type, context)

  context.beginPath()
  context.setFillStyle(opts.background)
  context.rect(0, 0, opts.width, opts.height)
  context.fill()
  context.save()
  const points = opts.chartData.wordCloudData
  context.translate(opts.width / 2, opts.height / 2)
  for (let i = 0; i < points.length; i++) {
    context.save()
    if (points[i].rotate)
      context.rotate(90 * Math.PI / 180)

    const text = points[i].name
    const tHeight = points[i].textSize * opts.pix
    const tWidth = measureText(text, tHeight, context)
    context.beginPath()
    context.setStrokeStyle(points[i].color)
    context.setFillStyle(points[i].color)
    context.setFontSize(tHeight)
    if (points[i].rotate) {
      if (points[i].areav[0] > 0) {
        if (opts.tooltip) {
          if (opts.tooltip.index == i)
            context.strokeText(text, (points[i].areav[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].areav[1] + 5 + tHeight - opts.height / 2) * process)
          else
            context.fillText(text, (points[i].areav[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].areav[1] + 5 + tHeight - opts.height / 2) * process)
        }
        else {
          context.fillText(text, (points[i].areav[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].areav[1] + 5 + tHeight - opts.height / 2) * process)
        }
      }
    }
    else {
      if (points[i].area[0] > 0) {
        if (opts.tooltip) {
          if (opts.tooltip.index == i)
            context.strokeText(text, (points[i].area[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].area[1] + 5 + tHeight - opts.height / 2) * process)
          else
            context.fillText(text, (points[i].area[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].area[1] + 5 + tHeight - opts.height / 2) * process)
        }
        else {
          context.fillText(text, (points[i].area[0] + 5 - opts.width / 2) * process - tWidth * (1 - process) / 2, (points[i].area[1] + 5 + tHeight - opts.height / 2) * process)
        }
      }
    }
    context.stroke()
    context.restore()
  }
  context.restore()
}

function drawFunnelDataPoints(series, opts, config, context) {
  const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1
  const funnelOption = assign({}, {
    type: 'funnel',
    activeWidth: 10,
    activeOpacity: 0.3,
    border: false,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    fillOpacity: 1,
    minSize: 0,
    labelAlign: 'right',
    linearType: 'none',
    customColor: [],
  }, opts.extra.funnel)
  const eachSpacing = (opts.height - opts.area[0] - opts.area[2]) / series.length
  const centerPosition = {
    x: opts.area[3] + (opts.width - opts.area[1] - opts.area[3]) / 2,
    y: opts.height - opts.area[2],
  }
  const activeWidth = funnelOption.activeWidth * opts.pix
  const radius = Math.min((opts.width - opts.area[1] - opts.area[3]) / 2 - activeWidth, (opts.height - opts.area[0] - opts.area[2]) / 2 - activeWidth)
  const seriesNew = getFunnelDataPoints(series, radius, funnelOption, eachSpacing, process)
  context.save()
  context.translate(centerPosition.x, centerPosition.y)
  funnelOption.customColor = fillCustomColor(funnelOption.linearType, funnelOption.customColor, series, config)
  if (funnelOption.type == 'pyramid') {
    for (let i = 0; i < seriesNew.length; i++) {
      if (i == seriesNew.length - 1) {
        if (opts.tooltip) {
          if (opts.tooltip.index == i) {
            context.beginPath()
            context.setFillStyle(hexToRgb(seriesNew[i].color, funnelOption.activeOpacity))
            context.moveTo(-activeWidth, -eachSpacing)
            context.lineTo(-seriesNew[i].radius - activeWidth, 0)
            context.lineTo(seriesNew[i].radius + activeWidth, 0)
            context.lineTo(activeWidth, -eachSpacing)
            context.lineTo(-activeWidth, -eachSpacing)
            context.closePath()
            context.fill()
          }
        }
        seriesNew[i].funnelArea = [centerPosition.x - seriesNew[i].radius, centerPosition.y - eachSpacing * (i + 1), centerPosition.x + seriesNew[i].radius, centerPosition.y - eachSpacing * i]
        context.beginPath()
        context.setLineWidth(funnelOption.borderWidth * opts.pix)
        context.setStrokeStyle(funnelOption.borderColor)
        var fillColor = hexToRgb(seriesNew[i].color, funnelOption.fillOpacity)
        if (funnelOption.linearType == 'custom') {
          var grd = context.createLinearGradient(seriesNew[i].radius, -eachSpacing, -seriesNew[i].radius, -eachSpacing)
          grd.addColorStop(0, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          grd.addColorStop(0.5, hexToRgb(funnelOption.customColor[seriesNew[i].linearIndex], funnelOption.fillOpacity))
          grd.addColorStop(1, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          fillColor = grd
        }
        context.setFillStyle(fillColor)
        context.moveTo(0, -eachSpacing)
        context.lineTo(-seriesNew[i].radius, 0)
        context.lineTo(seriesNew[i].radius, 0)
        context.lineTo(0, -eachSpacing)
        context.closePath()
        context.fill()
        if (funnelOption.border == true)
          context.stroke()
      }
      else {
        if (opts.tooltip) {
          if (opts.tooltip.index == i) {
            context.beginPath()
            context.setFillStyle(hexToRgb(seriesNew[i].color, funnelOption.activeOpacity))
            context.moveTo(0, 0)
            context.lineTo(-seriesNew[i].radius - activeWidth, 0)
            context.lineTo(-seriesNew[i + 1].radius - activeWidth, -eachSpacing)
            context.lineTo(seriesNew[i + 1].radius + activeWidth, -eachSpacing)
            context.lineTo(seriesNew[i].radius + activeWidth, 0)
            context.lineTo(0, 0)
            context.closePath()
            context.fill()
          }
        }
        seriesNew[i].funnelArea = [centerPosition.x - seriesNew[i].radius, centerPosition.y - eachSpacing * (i + 1), centerPosition.x + seriesNew[i].radius, centerPosition.y - eachSpacing * i]
        context.beginPath()
        context.setLineWidth(funnelOption.borderWidth * opts.pix)
        context.setStrokeStyle(funnelOption.borderColor)
        var fillColor = hexToRgb(seriesNew[i].color, funnelOption.fillOpacity)
        if (funnelOption.linearType == 'custom') {
          var grd = context.createLinearGradient(seriesNew[i].radius, -eachSpacing, -seriesNew[i].radius, -eachSpacing)
          grd.addColorStop(0, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          grd.addColorStop(0.5, hexToRgb(funnelOption.customColor[seriesNew[i].linearIndex], funnelOption.fillOpacity))
          grd.addColorStop(1, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          fillColor = grd
        }
        context.setFillStyle(fillColor)
        context.moveTo(0, 0)
        context.lineTo(-seriesNew[i].radius, 0)
        context.lineTo(-seriesNew[i + 1].radius, -eachSpacing)
        context.lineTo(seriesNew[i + 1].radius, -eachSpacing)
        context.lineTo(seriesNew[i].radius, 0)
        context.lineTo(0, 0)
        context.closePath()
        context.fill()
        if (funnelOption.border == true)
          context.stroke()
      }
      context.translate(0, -eachSpacing)
    }
  }
  else {
    context.translate(0, -(seriesNew.length - 1) * eachSpacing)
    for (let i = 0; i < seriesNew.length; i++) {
      if (i == seriesNew.length - 1) {
        if (opts.tooltip) {
          if (opts.tooltip.index == i) {
            context.beginPath()
            context.setFillStyle(hexToRgb(seriesNew[i].color, funnelOption.activeOpacity))
            context.moveTo(-activeWidth - funnelOption.minSize / 2, 0)
            context.lineTo(-seriesNew[i].radius - activeWidth, -eachSpacing)
            context.lineTo(seriesNew[i].radius + activeWidth, -eachSpacing)
            context.lineTo(activeWidth + funnelOption.minSize / 2, 0)
            context.lineTo(-activeWidth - funnelOption.minSize / 2, 0)
            context.closePath()
            context.fill()
          }
        }
        seriesNew[i].funnelArea = [centerPosition.x - seriesNew[i].radius, centerPosition.y - eachSpacing, centerPosition.x + seriesNew[i].radius, centerPosition.y]
        context.beginPath()
        context.setLineWidth(funnelOption.borderWidth * opts.pix)
        context.setStrokeStyle(funnelOption.borderColor)
        var fillColor = hexToRgb(seriesNew[i].color, funnelOption.fillOpacity)
        if (funnelOption.linearType == 'custom') {
          var grd = context.createLinearGradient(seriesNew[i].radius, -eachSpacing, -seriesNew[i].radius, -eachSpacing)
          grd.addColorStop(0, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          grd.addColorStop(0.5, hexToRgb(funnelOption.customColor[seriesNew[i].linearIndex], funnelOption.fillOpacity))
          grd.addColorStop(1, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          fillColor = grd
        }
        context.setFillStyle(fillColor)
        context.moveTo(0, 0)
        context.lineTo(-funnelOption.minSize / 2, 0)
        context.lineTo(-seriesNew[i].radius, -eachSpacing)
        context.lineTo(seriesNew[i].radius, -eachSpacing)
        context.lineTo(funnelOption.minSize / 2, 0)
        context.lineTo(0, 0)
        context.closePath()
        context.fill()
        if (funnelOption.border == true)
          context.stroke()
      }
      else {
        if (opts.tooltip) {
          if (opts.tooltip.index == i) {
            context.beginPath()
            context.setFillStyle(hexToRgb(seriesNew[i].color, funnelOption.activeOpacity))
            context.moveTo(0, 0)
            context.lineTo(-seriesNew[i + 1].radius - activeWidth, 0)
            context.lineTo(-seriesNew[i].radius - activeWidth, -eachSpacing)
            context.lineTo(seriesNew[i].radius + activeWidth, -eachSpacing)
            context.lineTo(seriesNew[i + 1].radius + activeWidth, 0)
            context.lineTo(0, 0)
            context.closePath()
            context.fill()
          }
        }
        seriesNew[i].funnelArea = [centerPosition.x - seriesNew[i].radius, centerPosition.y - eachSpacing * (seriesNew.length - i), centerPosition.x + seriesNew[i].radius, centerPosition.y - eachSpacing * (seriesNew.length - i - 1)]
        context.beginPath()
        context.setLineWidth(funnelOption.borderWidth * opts.pix)
        context.setStrokeStyle(funnelOption.borderColor)
        var fillColor = hexToRgb(seriesNew[i].color, funnelOption.fillOpacity)
        if (funnelOption.linearType == 'custom') {
          var grd = context.createLinearGradient(seriesNew[i].radius, -eachSpacing, -seriesNew[i].radius, -eachSpacing)
          grd.addColorStop(0, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          grd.addColorStop(0.5, hexToRgb(funnelOption.customColor[seriesNew[i].linearIndex], funnelOption.fillOpacity))
          grd.addColorStop(1, hexToRgb(seriesNew[i].color, funnelOption.fillOpacity))
          fillColor = grd
        }
        context.setFillStyle(fillColor)
        context.moveTo(0, 0)
        context.lineTo(-seriesNew[i + 1].radius, 0)
        context.lineTo(-seriesNew[i].radius, -eachSpacing)
        context.lineTo(seriesNew[i].radius, -eachSpacing)
        context.lineTo(seriesNew[i + 1].radius, 0)
        context.lineTo(0, 0)
        context.closePath()
        context.fill()
        if (funnelOption.border == true)
          context.stroke()
      }
      context.translate(0, eachSpacing)
    }
  }

  context.restore()
  if (opts.dataLabel !== false && process === 1)
    drawFunnelText(seriesNew, opts, context, eachSpacing, funnelOption.labelAlign, activeWidth, centerPosition)

  if (process === 1)
    drawFunnelCenterText(seriesNew, opts, context, eachSpacing, funnelOption.labelAlign, activeWidth, centerPosition)

  return {
    center: centerPosition,
    radius,
    series: seriesNew,
  }
}

function drawFunnelText(series, opts, context, eachSpacing, labelAlign, activeWidth, centerPosition) {
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    if (item.labelShow === false)
      continue

    let startX, endX, startY, fontSize
    let text = item.formatter ? item.formatter(item, i, series, opts) : `${util.toFixed(item._proportion_ * 100)}%`
    text = item.labelText ? item.labelText : text
    if (labelAlign == 'right') {
      if (i == series.length - 1)
        startX = (item.funnelArea[2] + centerPosition.x) / 2
      else
        startX = (item.funnelArea[2] + series[i + 1].funnelArea[2]) / 2

      endX = startX + activeWidth * 2
      startY = item.funnelArea[1] + eachSpacing / 2
      fontSize = item.textSize * opts.pix || opts.fontSize * opts.pix
      context.setLineWidth(1 * opts.pix)
      context.setStrokeStyle(item.color)
      context.setFillStyle(item.color)
      context.beginPath()
      context.moveTo(startX, startY)
      context.lineTo(endX, startY)
      context.stroke()
      context.closePath()
      context.beginPath()
      context.moveTo(endX, startY)
      context.arc(endX, startY, 2 * opts.pix, 0, 2 * Math.PI)
      context.closePath()
      context.fill()
      context.beginPath()
      context.setFontSize(fontSize)
      context.setFillStyle(item.textColor || opts.fontColor)
      context.fillText(text, endX + 5, startY + fontSize / 2 - 2)
      context.closePath()
      context.stroke()
      context.closePath()
    }
    if (labelAlign == 'left') {
      if (i == series.length - 1)
        startX = (item.funnelArea[0] + centerPosition.x) / 2
      else
        startX = (item.funnelArea[0] + series[i + 1].funnelArea[0]) / 2

      endX = startX - activeWidth * 2
      startY = item.funnelArea[1] + eachSpacing / 2
      fontSize = item.textSize * opts.pix || opts.fontSize * opts.pix
      context.setLineWidth(1 * opts.pix)
      context.setStrokeStyle(item.color)
      context.setFillStyle(item.color)
      context.beginPath()
      context.moveTo(startX, startY)
      context.lineTo(endX, startY)
      context.stroke()
      context.closePath()
      context.beginPath()
      context.moveTo(endX, startY)
      context.arc(endX, startY, 2, 0, 2 * Math.PI)
      context.closePath()
      context.fill()
      context.beginPath()
      context.setFontSize(fontSize)
      context.setFillStyle(item.textColor || opts.fontColor)
      context.fillText(text, endX - 5 - measureText(text, fontSize, context), startY + fontSize / 2 - 2)
      context.closePath()
      context.stroke()
      context.closePath()
    }
  }
}

function drawFunnelCenterText(series, opts, context, eachSpacing, labelAlign, activeWidth, centerPosition) {
  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    let startY, fontSize
    if (item.centerText) {
      startY = item.funnelArea[1] + eachSpacing / 2
      fontSize = item.centerTextSize * opts.pix || opts.fontSize * opts.pix
      context.beginPath()
      context.setFontSize(fontSize)
      context.setFillStyle(item.centerTextColor || '#FFFFFF')
      context.fillText(item.centerText, centerPosition.x - measureText(item.centerText, fontSize, context) / 2, startY + fontSize / 2 - 2)
      context.closePath()
      context.stroke()
      context.closePath()
    }
  }
}

function drawCanvas(opts, context) {
  context.save()
  context.translate(0, 0.5)
  context.restore()
  context.draw()
}

const Timing = {
  easeIn: function easeIn(pos) {
    return pos ** 3
  },
  easeOut: function easeOut(pos) {
    return (pos - 1) ** 3 + 1
  },
  easeInOut: function easeInOut(pos) {
    if ((pos /= 0.5) < 1)
      return 0.5 * pos ** 3
    else
      return 0.5 * ((pos - 2) ** 3 + 2)
  },
  linear: function linear(pos) {
    return pos
  },
}

function Animation(opts) {
  this.isStop = false
  opts.duration = typeof opts.duration === 'undefined' ? 1000 : opts.duration
  opts.timing = opts.timing || 'easeInOut'
  const delay = 17
  function createAnimationFrame() {
    if (typeof setTimeout !== 'undefined') {
      return function (step, delay) {
        setTimeout(() => {
          const timeStamp = +new Date()
          step(timeStamp)
        }, delay)
      }
    }
    else if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame
    }
    else {
      return function (step) {
        step(null)
      }
    }
  };
  const animationFrame = createAnimationFrame()
  let startTimeStamp = null
  let _step = function step(timestamp) {
    if (timestamp === null || this.isStop === true) {
      opts.onProcess && opts.onProcess(1)
      opts.onAnimationFinish && opts.onAnimationFinish()
      return
    }
    if (startTimeStamp === null)
      startTimeStamp = timestamp

    if (timestamp - startTimeStamp < opts.duration) {
      let process = (timestamp - startTimeStamp) / opts.duration
      const timingFunction = Timing[opts.timing]
      process = timingFunction(process)
      opts.onProcess && opts.onProcess(process)
      animationFrame(_step, delay)
    }
    else {
      opts.onProcess && opts.onProcess(1)
      opts.onAnimationFinish && opts.onAnimationFinish()
    }
  }
  _step = _step.bind(this)
  animationFrame(_step, delay)
}

Animation.prototype.stop = function () {
  this.isStop = true
}

function drawCharts(type, opts, config, context) {
  const _this = this
  let series = opts.series
  // 兼容ECharts饼图类数据格式
  if (type === 'pie' || type === 'ring' || type === 'mount' || type === 'rose' || type === 'funnel')
    series = fixPieSeries(series, opts, config)

  let categories = opts.categories
  if (type === 'mount') {
    categories = []
    for (let j = 0; j < series.length; j++) {
      if (series[j].show !== false)
        categories.push(series[j].name)
    }

    opts.categories = categories
  }
  series = fillSeries(series, opts, config)
  const duration = opts.animation ? opts.duration : 0
  _this.animationInstance && _this.animationInstance.stop()
  let seriesMA = null
  if (type == 'candle') {
    const average = assign({}, opts.extra.candle.average)
    if (average.show) {
      seriesMA = calCandleMA(average.day, average.name, average.color, series[0].data)
      seriesMA = fillSeries(seriesMA, opts, config)
      opts.seriesMA = seriesMA
    }
    else if (opts.seriesMA) {
      seriesMA = opts.seriesMA = fillSeries(opts.seriesMA, opts, config)
    }
    else {
      seriesMA = series
    }
  }
  else {
    seriesMA = series
  }
  /* 过滤掉show=false的series */
  opts._series_ = series = filterSeries(series)
  // 重新计算图表区域
  opts.area = Array.from({ length: 4 })
  // 复位绘图区域
  for (let j = 0; j < 4; j++)
    opts.area[j] = opts.padding[j] * opts.pix

  // 通过计算三大区域：图例、X轴、Y轴的大小，确定绘图区域
  const _calLegendData = calLegendData(seriesMA, opts, config, opts.chartData, context)
  const legendHeight = _calLegendData.area.wholeHeight
  const legendWidth = _calLegendData.area.wholeWidth

  switch (opts.legend.position) {
    case 'top':
      opts.area[0] += legendHeight
      break
    case 'bottom':
      opts.area[2] += legendHeight
      break
    case 'left':
      opts.area[3] += legendWidth
      break
    case 'right':
      opts.area[1] += legendWidth
      break
  }

  let _calYAxisData = {}
  let yAxisWidth = 0
  if (opts.type === 'line' || opts.type === 'column' || opts.type === 'mount' || opts.type === 'area' || opts.type === 'mix' || opts.type === 'candle' || opts.type === 'scatter' || opts.type === 'bubble' || opts.type === 'bar') {
    _calYAxisData = calYAxisData(series, opts, config, context)
    yAxisWidth = _calYAxisData.yAxisWidth
    // 如果显示Y轴标题
    if (opts.yAxis.showTitle) {
      let maxTitleHeight = 0
      for (let i = 0; i < opts.yAxis.data.length; i++)
        maxTitleHeight = Math.max(maxTitleHeight, opts.yAxis.data[i].titleFontSize ? opts.yAxis.data[i].titleFontSize * opts.pix : config.fontSize)

      opts.area[0] += maxTitleHeight
    }
    let rightIndex = 0
    let leftIndex = 0
    // 计算主绘图区域左右位置
    for (let i = 0; i < yAxisWidth.length; i++) {
      if (yAxisWidth[i].position == 'left') {
        if (leftIndex > 0)
          opts.area[3] += yAxisWidth[i].width + opts.yAxis.padding * opts.pix
        else
          opts.area[3] += yAxisWidth[i].width

        leftIndex += 1
      }
      else if (yAxisWidth[i].position == 'right') {
        if (rightIndex > 0)
          opts.area[1] += yAxisWidth[i].width + opts.yAxis.padding * opts.pix
        else
          opts.area[1] += yAxisWidth[i].width

        rightIndex += 1
      }
    }
  }
  else {
    config.yAxisWidth = yAxisWidth
  }
  opts.chartData.yAxisData = _calYAxisData

  if (opts.categories && opts.categories.length && opts.type !== 'radar' && opts.type !== 'gauge' && opts.type !== 'bar') {
    opts.chartData.xAxisData = getXAxisPoints(opts.categories, opts, config)
    const _calCategoriesData = calCategoriesData(opts.categories, opts, config, opts.chartData.xAxisData.eachSpacing, context)
    const xAxisHeight = _calCategoriesData.xAxisHeight
    const angle = _calCategoriesData.angle
    config.xAxisHeight = xAxisHeight
    config._xAxisTextAngle_ = angle
    opts.area[2] += xAxisHeight
    opts.chartData.categoriesData = _calCategoriesData
  }
  else {
    if (opts.type === 'line' || opts.type === 'area' || opts.type === 'scatter' || opts.type === 'bubble' || opts.type === 'bar') {
      opts.chartData.xAxisData = calXAxisData(series, opts, config, context)
      categories = opts.chartData.xAxisData.rangesFormat
      const _calCategoriesData = calCategoriesData(categories, opts, config, opts.chartData.xAxisData.eachSpacing, context)
      const xAxisHeight = _calCategoriesData.xAxisHeight
      const angle = _calCategoriesData.angle
      config.xAxisHeight = xAxisHeight
      config._xAxisTextAngle_ = angle
      opts.area[2] += xAxisHeight
      opts.chartData.categoriesData = _calCategoriesData
    }
    else {
      opts.chartData.xAxisData = {
        xAxisPoints: [],
      }
    }
  }

  // 计算右对齐偏移距离
  if (opts.enableScroll && opts.xAxis.scrollAlign == 'right' && opts._scrollDistance_ === undefined) {
    let offsetLeft = 0
    const xAxisPoints = opts.chartData.xAxisData.xAxisPoints
    const startX = opts.chartData.xAxisData.startX
    const endX = opts.chartData.xAxisData.endX
    const eachSpacing = opts.chartData.xAxisData.eachSpacing
    const totalWidth = eachSpacing * (xAxisPoints.length - 1)
    const screenWidth = endX - startX
    offsetLeft = screenWidth - totalWidth
    _this.scrollOption.currentOffset = offsetLeft
    _this.scrollOption.startTouchX = offsetLeft
    _this.scrollOption.distance = 0
    _this.scrollOption.lastMoveTime = 0
    opts._scrollDistance_ = offsetLeft
  }

  if (type === 'pie' || type === 'ring' || type === 'rose')
    config._pieTextMaxLength_ = opts.dataLabel === false ? 0 : getPieTextMaxLength(seriesMA, config, context, opts)

  switch (type) {
    case 'word':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawWordCloudDataPoints(series, opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'map':
      context.clearRect(0, 0, opts.width, opts.height)
      drawMapDataPoints(series, opts, config, context)
      setTimeout(() => {
        this.uevent.trigger('renderComplete')
      }, 50)
      break
    case 'funnel':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.funnelData = drawFunnelDataPoints(series, opts, config, context, process)
          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'line':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawLineDataPoints = drawLineDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawLineDataPoints.xAxisPoints
          const calPoints = _drawLineDataPoints.calPoints
          const eachSpacing = _drawLineDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'scatter':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawScatterDataPoints = drawScatterDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawScatterDataPoints.xAxisPoints
          const calPoints = _drawScatterDataPoints.calPoints
          const eachSpacing = _drawScatterDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'bubble':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawBubbleDataPoints = drawBubbleDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawBubbleDataPoints.xAxisPoints
          const calPoints = _drawBubbleDataPoints.calPoints
          const eachSpacing = _drawBubbleDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'mix':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawMixDataPoints = drawMixDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawMixDataPoints.xAxisPoints
          const calPoints = _drawMixDataPoints.calPoints
          const eachSpacing = _drawMixDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'column':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawColumnDataPoints = drawColumnDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawColumnDataPoints.xAxisPoints
          const calPoints = _drawColumnDataPoints.calPoints
          const eachSpacing = _drawColumnDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'mount':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawMountDataPoints = drawMountDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawMountDataPoints.xAxisPoints
          const calPoints = _drawMountDataPoints.calPoints
          const eachSpacing = _drawMountDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'bar':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawXAxis(categories, opts, config, context)
          const _drawBarDataPoints = drawBarDataPoints(series, opts, config, context, process)
          const yAxisPoints = _drawBarDataPoints.yAxisPoints
          const calPoints = _drawBarDataPoints.calPoints
          const eachSpacing = _drawBarDataPoints.eachSpacing
          opts.chartData.yAxisPoints = yAxisPoints
          opts.chartData.xAxisPoints = opts.chartData.xAxisData.xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, yAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'area':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawAreaDataPoints = drawAreaDataPoints(series, opts, config, context, process)
          const xAxisPoints = _drawAreaDataPoints.xAxisPoints
          const calPoints = _drawAreaDataPoints.calPoints
          const eachSpacing = _drawAreaDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'ring':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.pieData = drawPieDataPoints(series, opts, config, context, process)
          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'pie':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.pieData = drawPieDataPoints(series, opts, config, context, process)
          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'rose':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.pieData = drawRoseDataPoints(series, opts, config, context, process)
          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'radar':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.radarData = drawRadarDataPoints(series, opts, config, context, process)
          drawLegend(opts.series, opts, config, context, opts.chartData)
          drawToolTipBridge(opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'arcbar':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.arcbarData = drawArcbarDataPoints(series, opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'gauge':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          opts.chartData.gaugeData = drawGaugeDataPoints(categories, series, opts, config, context, process)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
    case 'candle':
      this.animationInstance = new Animation({
        timing: opts.timing,
        duration,
        onProcess: function onProcess(process) {
          context.clearRect(0, 0, opts.width, opts.height)
          if (opts.rotate)
            contextRotate(context, opts)

          drawYAxisGrid(categories, opts, config, context)
          drawXAxis(categories, opts, config, context)
          const _drawCandleDataPoints = drawCandleDataPoints(series, seriesMA, opts, config, context, process)
          const xAxisPoints = _drawCandleDataPoints.xAxisPoints
          const calPoints = _drawCandleDataPoints.calPoints
          const eachSpacing = _drawCandleDataPoints.eachSpacing
          opts.chartData.xAxisPoints = xAxisPoints
          opts.chartData.calPoints = calPoints
          opts.chartData.eachSpacing = eachSpacing
          drawYAxis(series, opts, config, context)
          if (opts.enableMarkLine !== false && process === 1)
            drawMarkLine(opts, config, context)

          if (seriesMA)
            drawLegend(seriesMA, opts, config, context, opts.chartData)
          else
            drawLegend(opts.series, opts, config, context, opts.chartData)

          drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints)
          drawCanvas(opts, context)
        },
        onAnimationFinish: function onAnimationFinish() {
          _this.uevent.trigger('renderComplete')
        },
      })
      break
  }
}

function uChartsEvent() {
  this.events = {}
}

uChartsEvent.prototype.addEventListener = function (type, listener) {
  this.events[type] = this.events[type] || []
  this.events[type].push(listener)
}

uChartsEvent.prototype.delEventListener = function (type) {
  this.events[type] = []
}

uChartsEvent.prototype.trigger = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++)
    args[_key] = arguments[_key]

  const type = args[0]
  const params = args.slice(1)
  if (this.events[type]) {
    this.events[type].forEach((listener) => {
      try {
        listener.apply(null, params)
      }
      catch (e) {
        // console.log('[uCharts] '+e);
      }
    })
  }
}

const uCharts = function uCharts(opts) {
  opts.pix = opts.pixelRatio ? opts.pixelRatio : 1
  opts.fontSize = opts.fontSize ? opts.fontSize : 13
  opts.fontColor = opts.fontColor ? opts.fontColor : config.fontColor
  if (opts.background == '' || opts.background == 'none')
    opts.background = '#FFFFFF'

  opts.title = assign({}, opts.title)
  opts.subtitle = assign({}, opts.subtitle)
  opts.duration = opts.duration ? opts.duration : 1000
  opts.yAxis = assign({}, {
    data: [],
    showTitle: false,
    disabled: false,
    disableGrid: false,
    gridSet: 'number',
    splitNumber: 5,
    gridType: 'solid',
    dashLength: 4 * opts.pix,
    gridColor: '#cccccc',
    padding: 10,
    fontColor: '#666666',
  }, opts.yAxis)
  opts.xAxis = assign({}, {
    rotateLabel: false,
    rotateAngle: 45,
    disabled: false,
    disableGrid: false,
    splitNumber: 5,
    calibration: false,
    fontColor: '#666666',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 0,
    gridType: 'solid',
    dashLength: 4,
    scrollAlign: 'left',
    boundaryGap: 'center',
    axisLine: true,
    axisLineColor: '#cccccc',
    titleFontSize: 13,
    titleOffsetY: 0,
    titleOffsetX: 0,
    titleFontColor: '#666666',
  }, opts.xAxis)
  opts.xAxis.scrollPosition = opts.xAxis.scrollAlign
  opts.legend = assign({}, {
    show: true,
    position: 'bottom',
    float: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    borderColor: 'rgba(0,0,0,0)',
    borderWidth: 0,
    padding: 5,
    margin: 5,
    itemGap: 10,
    fontSize: opts.fontSize,
    lineHeight: opts.fontSize,
    fontColor: opts.fontColor,
    formatter: {},
    hiddenColor: '#CECECE',
  }, opts.legend)
  opts.extra = assign({
    tooltip: {
      legendShape: 'auto',
    },
  }, opts.extra)
  opts.rotate = !!opts.rotate
  opts.animation = !!opts.animation
  opts.rotate = !!opts.rotate
  opts.canvas2d = !!opts.canvas2d

  const config$$1 = assign({}, config)
  config$$1.color = opts.color ? opts.color : config$$1.color
  if (opts.type == 'pie')
    config$$1.pieChartLinePadding = opts.dataLabel === false ? 0 : opts.extra.pie.labelWidth * opts.pix || config$$1.pieChartLinePadding * opts.pix

  if (opts.type == 'ring')
    config$$1.pieChartLinePadding = opts.dataLabel === false ? 0 : opts.extra.ring.labelWidth * opts.pix || config$$1.pieChartLinePadding * opts.pix

  if (opts.type == 'rose')
    config$$1.pieChartLinePadding = opts.dataLabel === false ? 0 : opts.extra.rose.labelWidth * opts.pix || config$$1.pieChartLinePadding * opts.pix

  config$$1.pieChartTextPadding = opts.dataLabel === false ? 0 : config$$1.pieChartTextPadding * opts.pix

  // 屏幕旋转
  config$$1.rotate = opts.rotate
  if (opts.rotate) {
    const tempWidth = opts.width
    const tempHeight = opts.height
    opts.width = tempHeight
    opts.height = tempWidth
  }

  // 适配高分屏
  opts.padding = opts.padding ? opts.padding : config$$1.padding
  config$$1.yAxisWidth = config.yAxisWidth * opts.pix
  config$$1.fontSize = opts.fontSize * opts.pix
  config$$1.titleFontSize = config.titleFontSize * opts.pix
  config$$1.subtitleFontSize = config.subtitleFontSize * opts.pix
  if (!opts.context)
    throw new Error('[uCharts] 未获取到context！注意：v2.0版本后，需要自行获取canvas的绘图上下文并传入opts.context！')

  this.context = opts.context
  if (!this.context.setTextAlign) {
    this.context.setStrokeStyle = function (e) {
      return this.strokeStyle = e
    }
    this.context.setLineWidth = function (e) {
      return this.lineWidth = e
    }
    this.context.setLineCap = function (e) {
      return this.lineCap = e
    }
    this.context.setFontSize = function (e) {
      return this.font = `${e}px sans-serif`
    }
    this.context.setFillStyle = function (e) {
      return this.fillStyle = e
    }
    this.context.setTextAlign = function (e) {
      return this.textAlign = e
    }
    this.context.setTextBaseline = function (e) {
      return this.textBaseline = e
    }
    this.context.setShadow = function (offsetX, offsetY, blur, color) {
      this.shadowColor = color
      this.shadowOffsetX = offsetX
      this.shadowOffsetY = offsetY
      this.shadowBlur = blur
    }
    this.context.draw = function () {}
  }
  // 兼容NVUEsetLineDash
  if (!this.context.setLineDash)
    this.context.setLineDash = function (e) {}

  opts.chartData = {}
  this.uevent = new uChartsEvent()
  this.scrollOption = {
    currentOffset: 0,
    startTouchX: 0,
    distance: 0,
    lastMoveTime: 0,
  }
  this.opts = opts
  this.config = config$$1
  drawCharts.call(this, opts.type, opts, config$$1, this.context)
}

uCharts.prototype.updateData = function () {
  const data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
  this.opts = assign({}, this.opts, data)
  this.opts.updateData = true
  const scrollPosition = data.scrollPosition || 'current'
  switch (scrollPosition) {
    case 'current':
      this.opts._scrollDistance_ = this.scrollOption.currentOffset
      break
    case 'left':
      this.opts._scrollDistance_ = 0
      this.scrollOption = {
        currentOffset: 0,
        startTouchX: 0,
        distance: 0,
        lastMoveTime: 0,
      }
      break
    case 'right':
      const _calYAxisData = calYAxisData(this.opts.series, this.opts, this.config, this.context); const yAxisWidth = _calYAxisData.yAxisWidth
      this.config.yAxisWidth = yAxisWidth
      let offsetLeft = 0
      const _getXAxisPoints0 = getXAxisPoints(this.opts.categories, this.opts, this.config); const xAxisPoints = _getXAxisPoints0.xAxisPoints
      const startX = _getXAxisPoints0.startX
      const endX = _getXAxisPoints0.endX
      const eachSpacing = _getXAxisPoints0.eachSpacing
      const totalWidth = eachSpacing * (xAxisPoints.length - 1)
      const screenWidth = endX - startX
      offsetLeft = screenWidth - totalWidth
      this.scrollOption = {
        currentOffset: offsetLeft,
        startTouchX: offsetLeft,
        distance: 0,
        lastMoveTime: 0,
      }
      this.opts._scrollDistance_ = offsetLeft
      break
  }
  drawCharts.call(this, this.opts.type, this.opts, this.config, this.context)
}

uCharts.prototype.zoom = function () {
  const val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.opts.xAxis.itemCount
  if (this.opts.enableScroll !== true) {
    console.log('[uCharts] 请启用滚动条后使用')
    return
  }
  // 当前屏幕中间点
  const centerPoint = Math.round(Math.abs(this.scrollOption.currentOffset) / this.opts.chartData.eachSpacing) + Math.round(this.opts.xAxis.itemCount / 2)
  this.opts.animation = false
  this.opts.xAxis.itemCount = val.itemCount
  // 重新计算x轴偏移距离
  const _calYAxisData = calYAxisData(this.opts.series, this.opts, this.config, this.context)
  const yAxisWidth = _calYAxisData.yAxisWidth
  this.config.yAxisWidth = yAxisWidth
  let offsetLeft = 0
  const _getXAxisPoints0 = getXAxisPoints(this.opts.categories, this.opts, this.config)
  const xAxisPoints = _getXAxisPoints0.xAxisPoints
  const startX = _getXAxisPoints0.startX
  const endX = _getXAxisPoints0.endX
  const eachSpacing = _getXAxisPoints0.eachSpacing
  const centerLeft = eachSpacing * centerPoint
  const screenWidth = endX - startX
  const MaxLeft = screenWidth - eachSpacing * (xAxisPoints.length - 1)
  offsetLeft = screenWidth / 2 - centerLeft
  if (offsetLeft > 0)
    offsetLeft = 0

  if (offsetLeft < MaxLeft)
    offsetLeft = MaxLeft

  this.scrollOption = {
    currentOffset: offsetLeft,
    startTouchX: 0,
    distance: 0,
    lastMoveTime: 0,
  }
  calValidDistance(this, offsetLeft, this.opts.chartData, this.config, this.opts)
  this.opts._scrollDistance_ = offsetLeft
  drawCharts.call(this, this.opts.type, this.opts, this.config, this.context)
}

uCharts.prototype.dobuleZoom = function (e) {
  if (this.opts.enableScroll !== true) {
    console.log('[uCharts] 请启用滚动条后使用')
    return
  }
  const tcs = e.changedTouches
  if (tcs.length < 2)
    return

  for (let i = 0; i < tcs.length; i++) {
    tcs[i].x = tcs[i].x ? tcs[i].x : tcs[i].clientX
    tcs[i].y = tcs[i].y ? tcs[i].y : tcs[i].clientY
  }
  const ntcs = [getTouches(tcs[0], this.opts, e), getTouches(tcs[1], this.opts, e)]
  const xlength = Math.abs(ntcs[0].x - ntcs[1].x)
  // 记录初始的两指之间的数据
  if (!this.scrollOption.moveCount) {
    let cts0 = { changedTouches: [{ x: tcs[0].x, y: this.opts.area[0] / this.opts.pix + 2 }] }
    let cts1 = { changedTouches: [{ x: tcs[1].x, y: this.opts.area[0] / this.opts.pix + 2 }] }
    if (this.opts.rotate) {
      cts0 = { changedTouches: [{ x: this.opts.height / this.opts.pix - this.opts.area[0] / this.opts.pix - 2, y: tcs[0].y }] }
      cts1 = { changedTouches: [{ x: this.opts.height / this.opts.pix - this.opts.area[0] / this.opts.pix - 2, y: tcs[1].y }] }
    }
    const moveCurrent1 = this.getCurrentDataIndex(cts0).index
    const moveCurrent2 = this.getCurrentDataIndex(cts1).index
    const moveCount = Math.abs(moveCurrent1 - moveCurrent2)
    this.scrollOption.moveCount = moveCount
    this.scrollOption.moveCurrent1 = Math.min(moveCurrent1, moveCurrent2)
    this.scrollOption.moveCurrent2 = Math.max(moveCurrent1, moveCurrent2)
    return
  }

  const currentEachSpacing = xlength / this.scrollOption.moveCount
  let itemCount = (this.opts.width - this.opts.area[1] - this.opts.area[3]) / currentEachSpacing
  itemCount = itemCount <= 2 ? 2 : itemCount
  itemCount = itemCount >= this.opts.categories.length ? this.opts.categories.length : itemCount
  this.opts.animation = false
  this.opts.xAxis.itemCount = itemCount
  // 重新计算滚动条偏移距离
  let offsetLeft = 0
  const _getXAxisPoints0 = getXAxisPoints(this.opts.categories, this.opts, this.config)
  const xAxisPoints = _getXAxisPoints0.xAxisPoints
  const startX = _getXAxisPoints0.startX
  const endX = _getXAxisPoints0.endX
  const eachSpacing = _getXAxisPoints0.eachSpacing
  const currentLeft = eachSpacing * this.scrollOption.moveCurrent1
  const screenWidth = endX - startX
  const MaxLeft = screenWidth - eachSpacing * (xAxisPoints.length - 1)
  offsetLeft = -currentLeft + Math.min(ntcs[0].x, ntcs[1].x) - this.opts.area[3] - eachSpacing
  if (offsetLeft > 0)
    offsetLeft = 0

  if (offsetLeft < MaxLeft)
    offsetLeft = MaxLeft

  this.scrollOption.currentOffset = offsetLeft
  this.scrollOption.startTouchX = 0
  this.scrollOption.distance = 0
  calValidDistance(this, offsetLeft, this.opts.chartData, this.config, this.opts)
  this.opts._scrollDistance_ = offsetLeft
  drawCharts.call(this, this.opts.type, this.opts, this.config, this.context)
}

uCharts.prototype.stopAnimation = function () {
  this.animationInstance && this.animationInstance.stop()
}

uCharts.prototype.addEventListener = function (type, listener) {
  this.uevent.addEventListener(type, listener)
}

uCharts.prototype.delEventListener = function (type) {
  this.uevent.delEventListener(type)
}

uCharts.prototype.getCurrentDataIndex = function (e) {
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  if (touches) {
    const _touches$ = getTouches(touches, this.opts, e)
    if (this.opts.type === 'pie' || this.opts.type === 'ring') {
      return findPieChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.pieData, this.opts)
    }
    else if (this.opts.type === 'rose') {
      return findRoseChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.pieData, this.opts)
    }
    else if (this.opts.type === 'radar') {
      return findRadarChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.radarData, this.opts.categories.length)
    }
    else if (this.opts.type === 'funnel') {
      return findFunnelChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.funnelData)
    }
    else if (this.opts.type === 'map') {
      return findMapChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts)
    }
    else if (this.opts.type === 'word') {
      return findWordChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.wordCloudData)
    }
    else if (this.opts.type === 'bar') {
      return findBarChartCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.calPoints, this.opts, this.config, Math.abs(this.scrollOption.currentOffset))
    }
    else {
      return findCurrentIndex({
        x: _touches$.x,
        y: _touches$.y,
      }, this.opts.chartData.calPoints, this.opts, this.config, Math.abs(this.scrollOption.currentOffset))
    }
  }
  return -1
}

uCharts.prototype.getLegendDataIndex = function (e) {
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  if (touches) {
    const _touches$ = getTouches(touches, this.opts, e)
    return findLegendIndex({
      x: _touches$.x,
      y: _touches$.y,
    }, this.opts.chartData.legendData)
  }
  return -1
}

uCharts.prototype.touchLegend = function (e) {
  const option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  if (touches) {
    const _touches$ = getTouches(touches, this.opts, e)
    const index = this.getLegendDataIndex(e)
    if (index >= 0) {
      if (this.opts.type == 'candle')
        this.opts.seriesMA[index].show = !this.opts.seriesMA[index].show
      else
        this.opts.series[index].show = !this.opts.series[index].show

      this.opts.animation = !!option.animation
      this.opts._scrollDistance_ = this.scrollOption.currentOffset
      drawCharts.call(this, this.opts.type, this.opts, this.config, this.context)
    }
  }
}

uCharts.prototype.showToolTip = function (e) {
  const option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  if (!touches)
    console.log('[uCharts] 未获取到event坐标信息')

  const _touches$ = getTouches(touches, this.opts, e)
  var currentOffset = this.scrollOption.currentOffset
  var opts = assign({}, this.opts, {
    _scrollDistance_: currentOffset,
    animation: false,
  })
  if (this.opts.type === 'line' || this.opts.type === 'area' || this.opts.type === 'column' || this.opts.type === 'scatter' || this.opts.type === 'bubble') {
    var current = this.getCurrentDataIndex(e)
    var index = option.index == undefined ? current.index : option.index
    if (index > -1 || index.length > 0) {
      var seriesData = getSeriesDataItem(this.opts.series, index, current.group)
      if (seriesData.length !== 0) {
        var _getToolTipData = getToolTipData(seriesData, this.opts, index, current.group, this.opts.categories, option)
        var textList = _getToolTipData.textList
        var offset = _getToolTipData.offset
        offset.y = _touches$.y
        opts.tooltip = {
          textList: option.textList !== undefined ? option.textList : textList,
          offset: option.offset !== undefined ? option.offset : offset,
          option,
          index,
          group: current.group,
        }
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'mount') {
    var index = option.index == undefined ? this.getCurrentDataIndex(e).index : option.index
    if (index > -1) {
      var opts = assign({}, this.opts, { animation: false })
      var seriesData = assign({}, opts._series_[index])
      var textList = [{
        text: option.formatter ? option.formatter(seriesData, undefined, index, opts) : `${seriesData.name}: ${seriesData.data}`,
        color: seriesData.color,
        legendShape: this.opts.extra.tooltip.legendShape == 'auto' ? seriesData.legendShape : this.opts.extra.tooltip.legendShape,
      }]
      var offset = {
        x: opts.chartData.calPoints[index].x,
        y: _touches$.y,
      }
      opts.tooltip = {
        textList: option.textList ? option.textList : textList,
        offset: option.offset !== undefined ? option.offset : offset,
        option,
        index,
      }
    }

    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'bar') {
    var current = this.getCurrentDataIndex(e)
    var index = option.index == undefined ? current.index : option.index
    if (index > -1 || index.length > 0) {
      var seriesData = getSeriesDataItem(this.opts.series, index, current.group)
      if (seriesData.length !== 0) {
        var _getToolTipData = getToolTipData(seriesData, this.opts, index, current.group, this.opts.categories, option)
        var textList = _getToolTipData.textList
        var offset = _getToolTipData.offset
        offset.x = _touches$.x
        opts.tooltip = {
          textList: option.textList !== undefined ? option.textList : textList,
          offset: option.offset !== undefined ? option.offset : offset,
          option,
          index,
        }
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'mix') {
    var current = this.getCurrentDataIndex(e)
    var index = option.index == undefined ? current.index : option.index
    if (index > -1) {
      var currentOffset = this.scrollOption.currentOffset
      var opts = assign({}, this.opts, {
        _scrollDistance_: currentOffset,
        animation: false,
      })
      var seriesData = getSeriesDataItem(this.opts.series, index)
      if (seriesData.length !== 0) {
        const _getMixToolTipData = getMixToolTipData(seriesData, this.opts, index, this.opts.categories, option)
        var textList = _getMixToolTipData.textList
        var offset = _getMixToolTipData.offset
        offset.y = _touches$.y
        opts.tooltip = {
          textList: option.textList ? option.textList : textList,
          offset: option.offset !== undefined ? option.offset : offset,
          option,
          index,
        }
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'candle') {
    var current = this.getCurrentDataIndex(e)
    var index = option.index == undefined ? current.index : option.index
    if (index > -1) {
      var currentOffset = this.scrollOption.currentOffset
      var opts = assign({}, this.opts, {
        _scrollDistance_: currentOffset,
        animation: false,
      })
      var seriesData = getSeriesDataItem(this.opts.series, index)
      if (seriesData.length !== 0) {
        var _getToolTipData = getCandleToolTipData(this.opts.series[0].data, seriesData, this.opts, index, this.opts.categories, this.opts.extra.candle, option)
        var textList = _getToolTipData.textList
        var offset = _getToolTipData.offset
        offset.y = _touches$.y
        opts.tooltip = {
          textList: option.textList ? option.textList : textList,
          offset: option.offset !== undefined ? option.offset : offset,
          option,
          index,
        }
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'pie' || this.opts.type === 'ring' || this.opts.type === 'rose' || this.opts.type === 'funnel') {
    var index = option.index == undefined ? this.getCurrentDataIndex(e) : option.index
    if (index > -1) {
      var opts = assign({}, this.opts, { animation: false })
      var seriesData = assign({}, opts._series_[index])
      var textList = [{
        text: option.formatter ? option.formatter(seriesData, undefined, index, opts) : `${seriesData.name}: ${seriesData.data}`,
        color: seriesData.color,
        legendShape: this.opts.extra.tooltip.legendShape == 'auto' ? seriesData.legendShape : this.opts.extra.tooltip.legendShape,
      }]
      var offset = {
        x: _touches$.x,
        y: _touches$.y,
      }
      opts.tooltip = {
        textList: option.textList ? option.textList : textList,
        offset: option.offset !== undefined ? option.offset : offset,
        option,
        index,
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'map') {
    var index = option.index == undefined ? this.getCurrentDataIndex(e) : option.index
    if (index > -1) {
      var opts = assign({}, this.opts, { animation: false })
      var seriesData = assign({}, this.opts.series[index])
      seriesData.name = seriesData.properties.name
      var textList = [{
        text: option.formatter ? option.formatter(seriesData, undefined, index, this.opts) : seriesData.name,
        color: seriesData.color,
        legendShape: this.opts.extra.tooltip.legendShape == 'auto' ? seriesData.legendShape : this.opts.extra.tooltip.legendShape,
      }]
      var offset = {
        x: _touches$.x,
        y: _touches$.y,
      }
      opts.tooltip = {
        textList: option.textList ? option.textList : textList,
        offset: option.offset !== undefined ? option.offset : offset,
        option,
        index,
      }
    }
    opts.updateData = false
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'word') {
    var index = option.index == undefined ? this.getCurrentDataIndex(e) : option.index
    if (index > -1) {
      var opts = assign({}, this.opts, { animation: false })
      var seriesData = assign({}, this.opts.series[index])
      var textList = [{
        text: option.formatter ? option.formatter(seriesData, undefined, index, this.opts) : seriesData.name,
        color: seriesData.color,
        legendShape: this.opts.extra.tooltip.legendShape == 'auto' ? seriesData.legendShape : this.opts.extra.tooltip.legendShape,
      }]
      var offset = {
        x: _touches$.x,
        y: _touches$.y,
      }
      opts.tooltip = {
        textList: option.textList ? option.textList : textList,
        offset: option.offset !== undefined ? option.offset : offset,
        option,
        index,
      }
    }
    opts.updateData = false
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
  if (this.opts.type === 'radar') {
    var index = option.index == undefined ? this.getCurrentDataIndex(e) : option.index
    if (index > -1) {
      var opts = assign({}, this.opts, { animation: false })
      var seriesData = getSeriesDataItem(this.opts.series, index)
      if (seriesData.length !== 0) {
        var textList = seriesData.map((item) => {
          return {
            text: option.formatter ? option.formatter(item, this.opts.categories[index], index, this.opts) : `${item.name}: ${item.data}`,
            color: item.color,
            legendShape: this.opts.extra.tooltip.legendShape == 'auto' ? item.legendShape : this.opts.extra.tooltip.legendShape,
          }
        })
        var offset = {
          x: _touches$.x,
          y: _touches$.y,
        }
        opts.tooltip = {
          textList: option.textList ? option.textList : textList,
          offset: option.offset !== undefined ? option.offset : offset,
          option,
          index,
        }
      }
    }
    drawCharts.call(this, opts.type, opts, this.config, this.context)
  }
}

uCharts.prototype.translate = function (distance) {
  this.scrollOption = {
    currentOffset: distance,
    startTouchX: distance,
    distance: 0,
    lastMoveTime: 0,
  }
  const opts = assign({}, this.opts, {
    _scrollDistance_: distance,
    animation: false,
  })
  drawCharts.call(this, this.opts.type, opts, this.config, this.context)
}

uCharts.prototype.scrollStart = function (e) {
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  const _touches$ = getTouches(touches, this.opts, e)
  if (touches && this.opts.enableScroll === true)
    this.scrollOption.startTouchX = _touches$.x
}

uCharts.prototype.scroll = function (e) {
  if (this.scrollOption.lastMoveTime === 0)
    this.scrollOption.lastMoveTime = Date.now()

  const Limit = this.opts.touchMoveLimit || 60
  const currMoveTime = Date.now()
  const duration = currMoveTime - this.scrollOption.lastMoveTime
  if (duration < Math.floor(1000 / Limit))
    return
  if (this.scrollOption.startTouchX == 0)
    return
  this.scrollOption.lastMoveTime = currMoveTime
  let touches = null
  if (e.changedTouches)
    touches = e.changedTouches[0]
  else
    touches = e.mp.changedTouches[0]

  if (touches && this.opts.enableScroll === true) {
    const _touches$ = getTouches(touches, this.opts, e)
    let _distance
    _distance = _touches$.x - this.scrollOption.startTouchX
    const currentOffset = this.scrollOption.currentOffset
    const validDistance = calValidDistance(this, currentOffset + _distance, this.opts.chartData, this.config, this.opts)
    this.scrollOption.distance = _distance = validDistance - currentOffset
    const opts = assign({}, this.opts, {
      _scrollDistance_: currentOffset + _distance,
      animation: false,
    })
    this.opts = opts
    drawCharts.call(this, opts.type, opts, this.config, this.context)
    return currentOffset + _distance
  }
}

uCharts.prototype.scrollEnd = function (e) {
  if (this.opts.enableScroll === true) {
    const _scrollOption = this.scrollOption
    const currentOffset = _scrollOption.currentOffset
    const distance = _scrollOption.distance
    this.scrollOption.currentOffset = currentOffset + distance
    this.scrollOption.distance = 0
    this.scrollOption.moveCount = 0
  }
}

export default uCharts
