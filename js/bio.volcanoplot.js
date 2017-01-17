function BioVolcano(svg,filename){
  //d3 svg element
  this.svg = svg;
  this.filename = filename;
  this.data = undefined;
  this.xScale = undefined;
  this.yScale = undefined;
  this.zoomScale = 1;
  this.pvalCut = .05;
  this.negFoldCut = -1;
  this.posFoldCut = 1;
  var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    _this = this;
  this.margin ={
      top:20,right:20,bottom:40,left:40
  }
  this.axisMargin = 10;
  this.width = (w.innerWidth || e.clientWidth || g.clientWidth) - 20 - this.margin.left - this.margin.right - this.axisMargin;
  this.height = (w.innerHeight|| e.clientHeight|| g.clientHeight) - 60 - this.margin.top - this.margin.bottom - this.axisMargin;
  
  d3.csv(filename,function(err,data){
//    _this.data = data;
    _this.data = _this.formatData(data);
    _this.init();
  })
}

BioVolcano.prototype = {
  formatData:function(data){
    var id =data.columns[0];
    var fcs = data.columns.filter(function(d){return d.indexOf('FC')>=0;}).sort();
    var pvals = data.columns.filter(function(d){return d.indexOf('pval')>=0;}).sort();
    var colors = ['#39f3e7','#3986eb','#3a18ef'];
    function getMainItems(d){
      var temp = {};
      for(var a in d){
        if(fcs.indexOf(a)<0 && pvals.indexOf(a)<0)
          temp[a] = d[a];
      }
//      return {
//        'Protein':d.Protein
//        'PepCount':d.PepCount,
//        'PName':d.PName,
//        'OGD_avg':d.OGD_avg,
//        'OGD_avg2':d.OGD_avg2,
//        'BL_Avg':d.BL_Avg,
//        'BL_avg2':d.BL_avg2,
//        'BL+US':d['BL+US'],
//        'OGD+US':d['OGD+US']
//      };
      return temp;
    };
    if(fcs.length == pvals.length){
      var volcanoPvalsFcsArray = [];
      for(var i = 0;i < fcs.length;i++){
        var temp = {};
        for(var j = 0;j<pvals.length;j++){
          if(pvals[j].startsWith(fcs[i].substring(0,fcs[i].indexOf('FC')-1))){
            temp['fc'] = fcs[i];
            temp['pval'] = pvals[j];
            break;
          }
        }
        volcanoPvalsFcsArray.push(temp);
      }
      var processed = [];
      for(var i = 0;i <volcanoPvalsFcsArray.length;i++){
        var filtered = data.filter(function(d){
          return d[volcanoPvalsFcsArray[i].fc].length > 0
            && d[volcanoPvalsFcsArray[i].pval].length > 0;
        }).map(function(d){
          var temp = getMainItems(d);
          temp['id']= d[id]+volcanoPvalsFcsArray[i].fc.substring(0,volcanoPvalsFcsArray[i].fc.indexOf('FC')-1);
          temp['FC'] = d[volcanoPvalsFcsArray[i].fc];
          temp['PVAL'] = d[volcanoPvalsFcsArray[i].pval];
          temp['color'] = colors[i];
          return temp;
        })
        processed = processed.concat(filtered);
      }
      return processed;
    }
    return [];
//    var ogdMap = data.filter(function(d){
//      return d.BL_OGD_FC.length > 0
//        //&& parseFloat(d.BL_OGD_FC) !== 0
//        && d.BL_OGD_pval.length > 0
//       // && parseFloat(d.BL_OGD_pval) !== 0;
//      }).map(function(d){
//      var temp = getMainItems(d);
//      temp['Protein']= d.Protein+'_OGD';
//      temp['FC'] = d.BL_OGD_FC;
//      temp['PVAL'] = d.BL_OGD_pval;
//      temp['color'] = '#39f3e7';
//      return temp;
//    });
//    var blusMap = data.filter(function(d){
//      return d.BL_BLUS_FC.length > 0
//        //&& parseFloat(d.BL_BLUS_FC) !== 0
//        && d.BL_BLUS_pval.length > 0
//       // && parseFloat(d.BL_BLUS_pval) !== 0;
//      }).map(function(d){
//      var temp = getMainItems(d);
//      temp['Protein']= d.Protein+'_BLUS';
//      temp['FC'] = d.BL_BLUS_FC;
//      temp['PVAL'] = d.BL_BLUS_pval;
//      temp['color'] = '#3986eb';
//      return temp;
//    });
//    var ogdusMap = data.filter(function(d){
//      return d.OGD_OGDUS_FC.length > 0
//       //&& parseFloat(d.OGD_OGDUS_FC) !== 0
//       && d.OGD_OGDUS_pval.length > 0
//       //&& parseFloat(d.OGD_OGDUS_pval) !== 0;
//      }).map(function(d){
//      var temp = getMainItems(d);
//      temp['Protein']= d.Protein+'_OGDUS';
//      temp['FC'] = d.OGD_OGDUS_FC;
//      temp['PVAL'] = d.OGD_OGDUS_pval;
//      temp['color'] = '#3a18ef';
//      return temp;
//    });
//    return ogdMap.concat(blusMap).concat(ogdusMap);
  },
  init:function(){
    var _this = this;
    _this.plot = _this.svg.attrs({
      'height':_this.height+_this.margin.top + _this.margin.bottom,
      'width':_this.width+_this.margin.left+_this.margin.right
    }).append('g').attr('transform','translate('+_this.margin.left+','+_this.margin.top+')');    
    //set scales
    _this.setScales(d3.extent(_this.data,_this.getX),[_this.axisMargin,_this.width],
        d3.extent(_this.data,_this.getY),[0,_this.height]);
    var xAxis = d3.axisBottom(_this.xScale),
      yAxis = d3.axisLeft(_this.yScale);
    //create axis
    //y axis
    _this.plot.append('g')
      .attrs({
        'id':'yAxis',
        'class':'y axis',
        'transform':'translate(0,'+ (-_this.axisMargin) +')'
      }).call(yAxis)
      .append('text')
      .attrs({
        'class':'axis-label',
        'transform':'rotate(-90)',
        'y':-35,
        'dy':'.71em',
        'fill':'black'
      }).style('text-anchor','end')
      .text('-Log10 P-Value');
    //x axis
    _this.plot.append('g')
      .attrs({
        'id':'xAxis',
        'class':'x axis',
        'transform':'translate('+_this.axisMargin+','+(_this.height-_this.axisMargin) +')'
      }).call(xAxis)
      .append('text')
      .attrs({
        'class':'axis-label',
        'x':_this.width,
        'y':20,
        'dy':'.71em',
        'fill':'black'
      }).style('text-anchor','end')
      .text('Log2 Fold Changes');
    //p value cut off line
    var pvalueLineG = _this.plot.append('g')
      .attrs({
        'id':'pval_cut',
        'class':'pval_cut cutoff',
        'transform':'translate(0,'+(-_this.axisMargin)+')'
      })
      pvalueLineG.append('line')
      .attrs({
        'stroke':'red',
        'x1':0,
        'x2':_this.width,
        'y1':_this.yScale(Math.log10(.05)),
        'y2':_this.yScale(Math.log10(.05))
      }).on('mouseover',mouseover)
      .on('mouseout',mouseout)
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", draggedY)
          .on("end", dragended))
      pvalueLineG.append('text')
      .attrs({
        'fill':'red',
        'y':_this.yScale(Math.log10(.05))
      })
      .text(_this.pvalCut.toFixed(4));
      //fold change cut offs
      var negFoldG = _this.plot.append('g')
      .attrs({
        'id':'negFold_cut',
        'class':'negFold_cut cutoff',
        'transform':'translate('+_this.axisMargin+',0)'
      })
      negFoldG.append('line')
      .attrs({
        'stroke':'green',
        'x1':_this.xScale(-1),
        'x2':_this.xScale(-1),
        'y1':0,
        'y2':_this.height
      }).on('mouseover',mouseover)
      .on('mouseout',mouseout)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", draggedX)
        .on("end", dragended));
      negFoldG.append('text')
        .attrs({
          'fill':'green',
          'y':_this.xScale(-1),
          'x':-_this.height+10,
          'transform':'rotate(-90)'
        }).text(_this.negFoldCut.toFixed(4))
      var posFoldG = _this.plot.append('g')
      .attrs({
        'id':'posFold_cut',
        'class':'posFold_cut cutoff',
        'transform':'translate('+_this.axisMargin+',0)'
      })
      posFoldG.append('line')
      .attrs({
        'stroke':'green',
        'x1':_this.xScale(1),
        'x2':_this.xScale(1),
        'y1':0,
        'y2':_this.height
      }).on('mouseover',mouseover)
      .on('mouseout',mouseout)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", draggedX)
        .on("end", dragended));
      posFoldG.append('text')
      .attrs({
        'fill':'green',
        'y':_this.xScale(1),
        'x':-_this.height+10,
        'transform':'rotate(-90)'
      }).text(_this.posFoldCut.toFixed(4))
  function mouseover(){
    d3.select(this).attr('stroke-width',4);
  }
  function mouseout(){
    d3.select(this).attr('stroke-width',2);
  }
  function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
  }

  function draggedY(d){
    d3.select(this).attrs({'y1':d3.event.y,'y2':d3.event.y});
    _this.pvalCut = Math.pow(10,_this.yScale.invert(d3.event.y));
    d3.select('#pval_cut').select('text').attr('y',d3.event.y).text(_this.pvalCut.toFixed(4));
    _this.render();
  }
  function draggedX(d) {
    d3.select(this).attrs({'x1':d3.event.x,'x2':d3.event.x});
    if(d3.select(this.parentNode).classed('negFold_cut')){
      _this.negFoldCut = _this.xScale.invert(d3.event.x);
      d3.select('#negFold_cut').select('text').attr('y',d3.event.x).text(_this.negFoldCut.toFixed(4));
    }else{
      _this.posFoldCut = _this.xScale.invert(d3.event.x);
      d3.select('#posFold_cut').select('text').attr('y',d3.event.x).text(_this.posFoldCut.toFixed(4));
    }
    _this.render();
  }

  function dragended(d) {
    d3.select(this).classed("active", false);
  }
    var scatter = _this.plot.append("g")
    .attr("class", "scatter")
    .attr("transform", "translate(" + _this.axisMargin + "," +  -_this.axisMargin + ")");
    var zoom = d3.zoom()
      //.x(_this.xScale)
      //.y(_this.yScale)
      .scaleExtent([1, 10])
      .on("zoom", zoomed);
    _this.svg.call(zoom);
    function zoomed() {
      _this.zoomScale = d3.event.transform.k;
      _this.svg.select('#xAxis').call(xAxis.scale(d3.event.transform.rescaleX(_this.xScale)));
      _this.svg.select('#yAxis').call(yAxis.scale(d3.event.transform.rescaleY(_this.yScale)));
      //_this.voronoiG.attr('transform','translate('+(d3.event.transform.x+_this.axisMargin)+','+(d3.event.transform.y-_this.axisMargin)+')scale('+d3.event.transform.k+')');
      scatter.attr('transform', 'translate('+(d3.event.transform.x+_this.axisMargin)+','+(d3.event.transform.y-_this.axisMargin)+')scale('+d3.event.transform.k+')');
      d3.selectAll('.cutoff').attr('transform', 'translate('+(d3.event.transform.x+_this.axisMargin)+','+(d3.event.transform.y-_this.axisMargin)+')scale('+d3.event.transform.k+')');
    }
    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
    var getScaled = function(scale, accessor) {
      return function (d) {
          return Math.round(scale(accessor(d)));
      }
    };
    
    _this.voronoi = d3.voronoi()
    .x(getScaled(_this.xScale, _this.getX))
    .y(getScaled(_this.yScale, _this.getY))
    .extent([[0,0], [_this.width, _this.height]]);
    
    _this.voronoiG = _this.plot.append("g")
    .attr("class", "voronoi")
    .attr("transform", "translate(" + _this.axisMargin + "," +  -_this.axisMargin + ")");
    
    _this.render();
//    $('#voroni_checkbox').checkbox({
//      onChecked:function(){
//        _this.voronoiG.selectAll('polygon').attr('stroke','none');
//      },
//      onUnchecked:function(){
//        _this.voronoiG.selectAll('polygon').attr('stroke','darkblue');
//      }
//    });
    d3.select('#refresh_btn').on('click',function(d){
      _this.svg.call(zoom.transform,d3.zoomIdentity);
    });
  },
  getId : function(d) {
    return d['id'];
  },
  getX : function(d) {
      return +d["FC"];// || +d["BL_OGD_FC"];
  },   
  getY : function(d) {
      return Math.log10(+d.PVAL||0.005);//Math.log10(+d["PVAL"]);// || +d["BL_OGD_pval"];
  },
  setScales:function(xDomain,xRange,yDomain,yRange){
    var _this = this;
    _this.xScale = _this.setScale(xDomain,xRange);
    _this.yScale = _this.setScale(yDomain,yRange);
  },
  setScale:function(domain,range){
    return d3.scaleLinear()
    .domain(domain)
    .range(range).nice();
  },
  isSignificant : function(d) {
    var _this = this;
    return (_this.getX(d)>0&&_this.getX(d)>_this.posFoldCut || _this.getX(d)<0&&_this.getX(d)<_this.negFoldCut)&& Math.pow(10,_this.getY(d)) < _this.pvalCut
//    return !!(Math.abs(_this.getX(d)) > 1 && Math.pow(10,_this.getY(d)) < 0.05);
  },
  mouseover:function(d){
    d3.select(this).attr('stroke','black').moveToFront();
  },
  mouseout:function(d){
    d3.select(this).attr('stroke',d.color);
  },
  render:function(){
    var _this = this;
    var getScaled = function(scale, accessor) {
      return function (d) {
          return Math.round(scale(accessor(d)));
      }
    };
    
    var circles = d3.select('.scatter').selectAll("circle").data(_this.data, _this.getId)
    .attr('fill',function(d){if(_this.isSignificant(d)) return d.color; return 'white';})
    .enter().append("circle")
    .attrs({
      "cx": getScaled(_this.xScale, _this.getX),
      "cy": getScaled(_this.yScale, _this.getY),
      "r": 3,
      'fill':function(d){if(_this.isSignificant(d)) return d.color; return 'white';},
      'stroke':function(d){return d.color;}
    }).classed("significant", function(d){return _this.isSignificant(d)})
    .on('click',function(d){console.log('click'); _this.generateModel(d);})
    .on('mouseover',_this.mouseover)
    .on('mouseout',_this.mouseout);
    
//    var paths = _this.voronoiG.selectAll("path")
//    .data(_this.voronoi(_this.data).polygons())
//    .enter().append("polygon")
//    .attr("points", function(d) {
//      if(d)
//        return d.map(function(x){
//            return [Math.round(x[0]),Math.round(x[1])];
//        }).join(",")
//    }).attrs({fill:'none',stroke:'darkblue'});
  },
  generateModel:function(d){
    var coords = [d3.event.clientX,d3.event.clientY],
      panelWidth = 500,
      panelHeight = 300,
      _this=this;
    function findPosition(){
      var clickedRect = d3.event.target.getBoundingClientRect();
      var offsetX = coords[0] - clickedRect.left,
        offsetY = coords[1] - clickedRect.top;
      coords[0]+=3*_this.zoomScale;
//      coords[1]-=offsetY;
      var w = window.innerWidth,
        h = window.innerHeight;
      if(coords[0]+panelWidth>w)
        coords[0]-=panelWidth+15;
      if(coords[1]+panelHeight>h)
        coords[1]-=panelHeight;
    }
    findPosition();
    var content = '<div class="ui list">';
    for(var a in d){
      content+='<div class="item">'+a+': '+d[a]+'</div>';
    }
    content+='</div>';
    var jsPan = $.jsPanel({
      id : 'modal_' + d.id,
      size : {
        'width' : panelWidth,
        'height' : panelHeight
      },
      position : {
        left : coords[0],
        top : coords[1]
      },
      headerTitle : d.Protein,
      content : content,
      callback : function(panel) {
        panel.resize(panelWidth, panelHeight);
        //create highchart
//        Highcharts.chart('chart_' + data.id, {
//          xAxis:{
//            categories:chart.categories
//          },
//          title : {
//            text : data.graphics.name.split(',')[0],
//            x : -20
//          // center
//          },
//          legend:{align:'left'},
//          series : series
//        });
      }
    });
  }
};