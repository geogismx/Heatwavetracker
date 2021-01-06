var table = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017"),
    silo = ee.ImageCollection("projects/eo-datascience-public/assets/silo_daily");
//GEEHWs
var initialZoom = 5;
//info panel
var Australia = ee.FeatureCollection(table).filterMetadata('country_na','equals','Australia')
var geometry = Australia.geometry();

var colPals = require('users/tl2581/packages:colorPalette.js');
var pkg_join    = require('users/geogismx/mountain_solar:join.js');
//var baseRegions = require('users/tl2581/packages:baseRegions.js');

var citiesList = {
                  'Sydney, Australia': {'lon': 151.2093, 'lat': -33.8688},
                  'Melbourne, Australia': {'lon': 144.946457, 'lat': -37.840935},
                  'Brisbane, Australia': {'lon': 153.021072, 'lat': -27.470125},
                  'Perth, Australia': {'lon': 115.857048, 'lat': -31.953512},
                  'Adelaide, Australia': {'lon': 138.599503, 'lat': -34.921230},
                  'Canberra, Australia': {'lon': 149.128998, 'lat': -35.282001},
                  'Hobart, Australia': {'lon': 147.324997, 'lat': -42.880554},
                  'Darwin, Australia': {'lon': 130.841782, 'lat': -12.462827}
};

var citiesNames = ['Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia','Perth, Australia','Adelaide, Australia','Canberra, Australia','Hobart, Australia','Darwin, Australia']



var infoPanel = function() {  
        var ToolLabel = ui.Label('Heat-Wave-Tracker', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});  
        var infoLabel = ui.Label('Heat Wave Tracker is a multi-method, multi-source heat wave measurement tool based on GEE.',   
        {margin: '8px 20px 2px 8px', fontSize: '12px', color: '#777'});  
        var headDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
        {margin: '12px 0px 5px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});  
        var inputSectionLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});  
        return ui.Panel([ToolLabel, infoLabel, headDivider, inputSectionLabel]);
};



// Receptor/point source panel 
var pointSelectPanel = function(map) {  
      var pointLabel = ui.Label('1) Select Point Source/Receptor:', {padding: '0px 0px 0px 5px', fontSize: '14.5px', color: '#0070BF'});  
      var coordsLabel = ui.Label('Enter lon/lat below, select a city, or click on map to update coordinates',{margin: '3px 8px 6px 23px', fontSize: '11.5px'});  
      var lonLabel = ui.Label('Lon (x):', {padding: '3px 0px 0px 15px', fontSize: '14.5px'});  
      var latLabel = ui.Label('Lat (y):', {padding: '3px 0px 0px 0px', fontSize: '14.5px'});  
      var lonBox = ui.Textbox({value: 151.00, style: {stretch: 'horizontal'}});  
      var latBox = ui.Textbox({value: -33.82, style: {stretch: 'horizontal'}});  
      var coordsPanel = ui.Panel([coordsLabel, ui.Panel([lonLabel, lonBox, latLabel, latBox], ui.Panel.Layout.Flow('horizontal'),{stretch: 'horizontal',margin: '-5px 0px 0px 0px'})]);  
      map.onClick(function(coords) {   
              lonBox.setValue(coords.lon);
              latBox.setValue(coords.lat);  
          });  
      var cityLabel  = ui.Label('(Optional) Select a city to', {padding: '0px 0px 0px 15px', backgroundColor: '#FFFFFF00', fontSize: '11.5px'});  
      var cityLabel2 = ui.Label('populate lon/lat above:', {padding: '0', margin: '-22px 8px 8px 25px', fontSize: '11.5px'});  
      var citySelect = ui.Select({items: citiesNames, placeholder: 'Select a city',value: 'Sydney, Australia', style: {stretch: 'horizontal'},    
                        onChange: function(city) {      
                            lonBox.setValue(citiesList[city].lon);      
                            latBox.setValue(citiesList[city].lat);   
                            }  
                        });  
      var cityPanel = ui.Panel([ui.Panel([cityLabel, citySelect], ui.Panel.Layout.Flow('horizontal'),{stretch: 'horizontal', margin: '-8px 0px 0px 0px', backgroundColor: '#FFFFFF00'}),cityLabel2]);
      return ui.Panel([pointLabel, coordsPanel, cityPanel]);
};




var getCoords = function(pointSelectPanel) {  
                          var lon = parseFloat(pointSelectPanel.widgets().get(1).widgets().get(1).widgets().get(1).getValue());  
                          var lat = parseFloat(pointSelectPanel.widgets().get(1).widgets().get(1).widgets().get(3).getValue()); 
                          return ee.Feature(ee.Geometry.Point(lon,lat),{step:0});
                };

var metNames = ['Silo','BoM','ERA5','CPC','CMIP5'];

var tempNames = ['EHF','Tmax','Tmin'];

var rcpNames = ['RCP45','RCP85'];

var inModeIDs = {  
    'EHF': 'EHF', 
    'Tmax': 'Tmax',
    'Tmin': 'Tmin'
};


var inMetIDs = {  
    'Silo': 'SILO',
    'BoM' : 'BoM',
    'ERA5': 'ERA5',
    'CPC' :'CPC',
    'CMIP5': 'CMIP5'
};



                
var metDatePanel = function() {  
      // Start date panel  
      var dateLabel = ui.Label('2) Select Time:', {fontSize: '14.5px', color: '#0070BF', padding: '0 0 0 5px'}); 
      var startYearLabel = ui.Label('Year:', {fontSize: '14.5px', margin: '8px 8px 8px 25px'});  
      var startYearSlider = ui.Slider({min: 1960, max: 2099, value: 2018, step: 1}); 
      startYearSlider.style().set('stretch', 'horizontal'); 
      var startYearPanel = ui.Panel([startYearLabel, startYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
      //var startDateLabel = ui.Label('Start Date:', {fontSize: '14.5px', margin: '12px 8px 8px 25px'});  
      var timePanel = ui.Panel([dateLabel,startYearPanel]);
      // Meteorology source panel  
      var metLabel = ui.Label('3) Select Meteorology:', {padding: '5px 0px 0px 5px', fontSize: '14.5px', color: '#0070BF'});  
      var metSelect = ui.Select({items: metNames, value: 'Silo', style: {stretch: 'horizontal'}});  
      var metPanel = ui.Panel([metLabel, metSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
      
      // Temperature mode panel
      var viewInfoLabel = ui.Label('4) Temperature Mode:', {padding: '5px 0px 0px 5px', fontSize: '14.5px', color: '#0070BF'});
      var viewSelect = ui.Select({items: tempNames ,value: 'EHF',style:{stretch: 'horizontal'}});
      var viewPanel = ui.Panel([viewInfoLabel, viewSelect], ui.Panel.Layout.Flow('horizontal'),{stretch: 'horizontal'});
      
      // RCP mode panel
      var CO2InfoLabel = ui.Label('5) Warming Scenario:', {padding: '5px 0px 0px 5px', fontSize: '14.5px', color: '#0070BF'});
      var CO2Select = ui.Select({items: rcpNames ,value: 'RCP45',style:{stretch: 'horizontal'}});
      var CO2Panel = ui.Panel([CO2InfoLabel, CO2Select], ui.Panel.Layout.Flow('horizontal'),{stretch: 'horizontal'});
      
      //startYearSlider.onChange(function(inYear) {   
      //    //var startDate = ee.Date.fromYMD(inYear,1,1).format('Y-MM-ddd').getInfo();    
      //    //var endDate = ee.Date.fromYMD(inYear,12,31).format('Y-MM-ddd').getInfo();    
      //    //metSelect = ui.Select({items: metNames, value: 'Silo Gridded Data', style: {stretch: 'horizontal'}});
      //    //startDateSlider = ui.DateSlider({start: startDate, end: endDate, value: startDate});
      //    //startDateSlider.style().set('stretch', 'horizontal');
      //    //startDatePanel.remove(startDatePanel.widgets().get(1));
      //    //startDatePanel.insert(2, startDateSlider);
      //    metPanel.remove(metPanel.widgets().get(1));
      //    metPanel.add(metSelect);
      //});
      var headDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),{margin: '12px 0px 5px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});
      return ui.Panel([timePanel,metPanel,viewPanel,CO2Panel,headDivider]);
};

//// View panel
//var viewPanel = function() {
//  
//  //var viewInfoLabel = ui.Label('4) Temperature Mode:', {fontSize: '14.5px', margin: '8px 8px 8px 8px'});
//  var viewInfoLabel = ui.Label('4) Temperature Mode:', {padding: '5px 0px 0px 5px', fontSize: '14.5px', color: '#0070BF'});
//  
//  
//  var viewSelect = ui.Select({
//    items: ['By EHF','By Tmax','By Tmin'],
//    value: 'By EHF',
//    style: {margin: '3px 75px 5px 8px', stretch: 'horizontal'}
//  });
//  
//  var viewPanel = ui.Panel([viewInfoLabel, viewSelect], ui.Panel.Layout.Flow('horizontal'),
//    {stretch: 'horizontal', margin: '5px 0 0 0'});
//  
//  viewSelect.onChange(function(selected) {
//      timeModePanel.clear();
//      if (selected == 'By EHF')  { setTimePanel('By EHF')}
//      if (selected == 'By Tmax') { setTimePanel('By Tmax')}
//      if (selected == 'By Tmin') { setTimePanel('By Tmin')}
//    });
//  var inputDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
//        {margin: '12px 0px 5px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});
//  return ui.Panel([viewPanel,inputDivider]);
//  //return viewPanel;
//  
//};

var getDate      = function(metDatePanel) {  
                    
                        var year = metDatePanel.widgets().get(0).widgets().get(1).widgets().get(1).getValue(); 
                        return year;
                    };

var getMetSource = function(metDatePanel) {

                        return metDatePanel.widgets().get(1).widgets().get(1).getValue();
                    };

var getMode      = function(metDatePanel) {  
                    
                        var Mode = metDatePanel.widgets().get(2).widgets().get(1).getValue();
                        return Mode;
                    };
                    

var getRCP      = function(metDatePanel) {  
                    
                        var rcp = metDatePanel.widgets().get(3).widgets().get(1).getValue();
                        return rcp;
                    };

var getLayerCheck = function(label, value, layerPos, units) {  
                    var checkLayer = ui.Checkbox({label: label, value: value,    
                        style: {fontWeight: '100px', fontSize: '14px', margin: '0px 3px 3px 3px'}}); 
                        checkLayer.onChange(function(checked) {    
                            var mapLayer = map.layers().get(layerPos);   
                            mapLayer.setShown(checked); 
                        }); 
                        var legendSubtitle = ui.Label(units,{fontSize: '13px', fontWeight: '50px', margin: '1px 3px 0px 2px'});

                        return ui.Panel([checkLayer,legendSubtitle],ui.Panel.Layout.flow('horizontal'));
};


var getLegendContinuous = function(maxVal, colPals) {
  
  var vis = {min: 0, max: maxVal, palette: colPals};

  var makeColorBarParams = function(palette) {
    return {
      bbox: [0, 0, 1, 0.1],
      dimensions: '120x10',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    };
  };

  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(vis.palette),
    style: {stretch: 'horizontal', margin: '5px 8px 0px 8px', height: '18px'},
  });

  var legendLabels = ui.Panel({
    widgets: [
      ui.Label(vis.min, {margin: '4px 8px'}),
      ui.Label((vis.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'}),
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  var legendPanel = ui.Panel({
    widgets: [colorBar, legendLabels],
    style: {
      margin: '3px 10px 8px 0px',
    }});
  
  return legendPanel;
};

var getLegendDiscrete = function(labels, colPals) {

  var legendPanel = ui.Panel({
    style: {
      padding: '2px 9px 8px 5px',
      position: 'bottom-left'
    }
  });

  var makeRow = function(colPals, labels) {
    var colorBox = ui.Label({
      style: {
        padding: '10px',
        margin: '0px 0 4px 8px',
        fontSize: '13.5px',
        backgroundColor: colPals
      }
    });

    var description = ui.Label({value: labels, style: {margin: '2px 1px 4px 6px', fontSize: '13.5px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  };
  
  for (var i = 0; i < labels.length; i++) {
    legendPanel.add(makeRow(colPals[i], labels[i]));
  }
  
  return legendPanel;
};




var getLegend = function() {
  var footDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
    {margin: '10px 0px 6px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});
  
  var legendPanel = ui.Panel({
    widgets:[
      footDivider,
      ui.Label('️Legend',{fontWeight:'bold',fontSize:'20px',margin:'8px 3px 8px 8px'}),
      ui.Label('Heat wave numbers',{fontWeight:'bold',fontSize:'16px',margin:'2px 3px 0px 8px'}),
      getLegendContinuous(10,colPals.Spectral),
      ui.Label('Heat wave magnitude',{fontWeight:'bold',fontSize:'16px',margin:'2px 3px 0px 8px'}),
      getLegendDiscrete(['Small (0 – 10)','Moderate (10 – 20)','High (20 – 30)','Very High (30 – 40)','Hazardous (> 40)'],
      ['#FEFF54','#EF8532','#EA3423','#8C1B4B','#741425'])
    ],
    style:{
      margin: '0px 0px 0px 0px',
      position: 'bottom-left'
    }
  });
  return legendPanel;
};


function functocol(year){
    // Original string 
    var str = 'users/tensorflow/Aus_EHF/Merged_Tmean_'; 
    // Joining the strings together
    var stryear   = year.toString();
    var asset = str.concat(stryear); 
    var img = ee.Image(asset);
    var meantemp = multibandstoImageCollection(img);
    var newcoll = meantemp.map(function(image){
    var start = stryear.concat('-11-01');
    start = ee.Date(start);
    var dateindex = image.get('system:index');
    //var dateofimage = dateList(dateindex);
    var index = ee.Number.parse(dateindex);
    //var len = parseInt(index);
    var date = start.advance(index,'day');
    var month = date.get('month');
    //var date = ee.Date(daily_coll.get(len));
    return ee.Image(image).setMulti({
            'system:time_start' : date,
            'system:time_end'   : date,
            'month'             : month
    });
    });
    return newcoll;
}

function multibandstoImageCollection(image) {
  function selectBand(image) {
    return function(bandName) {
      return image.select([bandName]).rename('EHF');
    }
  }
  var bandNames = image.bandNames()
  return ee.ImageCollection.fromImages(bandNames.map(selectBand(image)))
}

function heatwave(imgcoll,maxThresh){

  var dataset = imgcoll.map(function(img){
       return img.addBands(ee.Image.constant(0).toDouble().rename('counter'));
    }).sort('system:time_start');
  
  function heatSpells(img, list){
    var prev = ee.Image(ee.List(list).get(-1));
    var hot = img.select([0]).gt(maxThresh);
    var accum = prev.select('counter').add(hot).rename('counter');
    var out = img.select([0]).addBands(img.select('counter').where(hot.eq(1),accum));
    return ee.List(list).add(out);
  }
  
  // create first image for iteration
  var first = ee.List([ee.Image(dataset.first())]);
  // apply dry speall iteration function
  var lists = dataset.iterate(heatSpells,first); // get the max value
  lists = ee.List(lists).slice(1,null);
  return ee.ImageCollection.fromImages(lists);
  

}

function silontemp(year,tempmode){
  var stryear = year.toString();
  var start = stryear.concat('-11-01');
  start = ee.Date(start);
  var end   = start.advance(5,'month');
  var yearofsilo = ee.ImageCollection(silo).filterDate(start,end);
  //print(yearofsilo)
  if (tempmode == 'Tmax'){
    var newsilo    = yearofsilo.map(function(image){
    var maxtemp  = image.select('max_temp');
    maxtemp = maxtemp.rename('Tmax');
    var date =  image.get('system:time_start');
    date = ee.Date(date);
    var month = date.get('month');
    return maxtemp.setMulti({
            'system:time_start' :date,
            'system:time_end'   :date,
            'month'             :month
    });
  });
  }else if(tempmode == 'Tmin'){
    newsilo    = yearofsilo.map(function(image){
    var mintemp  = image.select('min_temp');
    mintemp = mintemp.rename('Tmin');
    var date =  image.get('system:time_start');
    date = ee.Date(date);
    var month = date.get('month');
    return mintemp.setMulti({
            'system:time_start' :date,
            'system:time_end'   :date,
            'month'             :month
    });
  });
  }else if(tempmode == 'EHF'){
    newsilo    = yearofsilo.map(function(image){
    var maxtemp  = image.select('max_temp');
    maxtemp = maxtemp.rename('Tmax');
    var mintemp  = image.select('min_temp');
    mintemp = mintemp.rename('Tmin');
    
    var meantemp = maxtemp.add(mintemp).divide(2);
    meantemp = meantemp.rename('EHF');
    var date =  image.get('system:time_start');
    date = ee.Date(date);
    var month = date.get('month');
    return meantemp.setMulti({
            'system:time_start' :date,
            'system:time_end'   :date,
            'month'             :month
    });
  });
  }
  
  return newsilo;
}





// HWN mean how many discrete heatwave events for the selected season.
// HWM means the sum of EHF on all days classed as heatwave days, divide by the number of such days.
// HWA refers to the hottest day of the hottest heatwave of the year. 
// The hottest heatwave is the one with the highest average EHF across all days of the heatwave
// The hottest day of this heatwave is also selected, based on the day within the heatwave with the highest EHF.
// HWF the number of days in the sum of the duration of all four events.
// HWF is the sum of days that belong to a period of at least 3 consecutive days where EHF is positive

function itt1(img, list){
    // get last image
    var prev = ee.Image(ee.List(list).get(-1));
    // find areas gt 1 threshold (gt==1, lt==0)
    var hot =  prev.select('subwave1').eq(1);
    // add previous day counter to today's counter
    var accum = img.select('subwave1').add(hot).rename('xcounter');
    // create a result image for iteration
    var out = img.addBands(accum);
    return ee.List(list).add(out);
}


function itt2(img, list){
    // get last image
    var prev = ee.Image(ee.List(list).get(-1));
    // find areas eq 1 and eq 0
    var hot =  img.select('xcounter').eq(0).and(prev.select('xcounter').eq(1));
    // add previous day counter to today's counter
    var accum = img.select('xcounter').add(hot).rename('xcounter1');
    // create a result image for iteration
    var out = img.addBands(accum);
    return ee.List(list).add(out);
}

function itt3(img, list){
    // get last image
    var prev = ee.Image(ee.List(list).get(-1));
    // find areas eq 1 and eq 0
    var hot =  img.select('heat_identity').eq(1).and(prev.select('heat_identity').eq(0));
    // add previous day counter to today's counter
    var accum = img.select('newcounter').add(hot).rename('accumpoint');
    // create a result image for iteration
    var out = img.addBands(accum);
    return ee.List(list).add(out);
}

function itt4(img, list){
    var prev = ee.Image(ee.List(list).get(-1));
    var hot  = img.select('counter').gt(0);
    //var accumEHF = prev.select('mEHF').multiply(hot).add(img.select('mEHF')).rename('accumEHF')
    //var accumEHF = part1;
    //var prevs = prev.select('mEHF').rename('accumEHF')
    img = img.select('accumEHF').where(hot.eq(1),prev.select('accumEHF').add(img.select('accumEHF')))
    //var accum = img.select('mEHF').multiply(hot);
    //var accum = prev.select('mEHF').multiply(hot).add(img.select('mEHF')).rename('tEHF');
    var out = img;
    //var accumEHF = img.select('tEHF').where(hot.eq(1),accum);
    //var out = img.addBands(accumEHF.toDouble());
    return ee.List(list).add(out);
  }

//print(HWFcol)
// create first image for iteration

function silotemp(year){
  var stryear = year.toString();
  var start = stryear.concat('-11-01');
  start = ee.Date(start);
  var end   = start.advance(5,'month');
  var yearofsilo = ee.ImageCollection(silo).filterDate(start,end);
  //print(yearofsilo)
  var newsilo    = yearofsilo.map(function(image){
    var maxtemp  = image.select('max_temp');
    var mintemp  = image.select('min_temp');
    var meantemp = maxtemp.add(mintemp).divide(2);
    meantemp = meantemp.rename('Tmean');
    //#############################//
    //Before 2017, 'date' property name is 'Date'
    //After  2017, 'date' property name is 'date'
    //#############################//
    var date =  image.get('system:time_start');
    date = ee.Date(date);
    var month = date.get('month');
    return meantemp.setMulti({
            'system:time_start' :date,
            'system:time_end'   :date,
            'month'             :month
    });
  });
  return newsilo;
}


// Run button
var runButton = ui.Button({label: 'Run',  style: {stretch: 'horizontal'}});               
                
// Control panel\n
var controlPanel = ui.Panel({  
                              layout: ui.Panel.Layout.flow('vertical'),  
                              style: {width: '350px', maxWidth: '350px'}
                          });
// Map panel\n
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(135.18,-25.92,5);
map.setControlVisibility({fullscreenControl: false});
ui.root.clear();
var init_panels = ui.SplitPanel({firstPanel: controlPanel,secondPanel: map});
ui.root.add(init_panels);
var infoPanel = infoPanel();
var pointSelectPanel = pointSelectPanel(map);
var metDatePanel = metDatePanel();
//var viewPanel    = viewPanel();
//map.remove(legendPanel);
var legendPanel = getLegend();
//legendPanel.remove(legendPanel.widgets().get(1));
controlPanel.add(infoPanel).add(pointSelectPanel).add(metDatePanel).add(runButton);
controlPanel.add(legendPanel);
  // Run calculations, linked to submit button\n
runButton.onClick(function() {
      // Input parameters:
      
      
      var metSource = getMetSource(metDatePanel);
      
      //print(metSource)
      
      var inMet     = inMetIDs[metSource];
      //print(inMet)
      
      var metDate   = getDate(metDatePanel);
      
      //print(metDate)
      
      var mode   = getMode(metDatePanel);
      
      var tempmode = inModeIDs[mode];
      
      var rcpmode = getRCP(metDatePanel);
      
      var pt        = getCoords(pointSelectPanel);
      //print(pt)
      // Meteorology 
      // Original string
      if (inMet != 'CMIP5'){
        var str = 'users/tensorflow/Aus_'+inMet+'_'+mode+'/Merged_'+tempmode+'_';
      } 
      else {
        
        str = 'users/tensorflow/Aus_'+inMet+'_'+mode+'/Merged_'+rcpmode+'_'+tempmode+'_';
        
      }

      // Joining the strings together
      //print(str)
      var stryear   = metDate.toString();
      var asset = str.concat(stryear); 
      
      var tempcol = silontemp(stryear,tempmode);
      
      
      var img = ee.Image(asset);
      var meantemp = multibandstoImageCollection(img);
      var EHF_Dataset = meantemp.map(function(image){
      var start = stryear.concat('-11-01');
      start = ee.Date(start);
      var dateindex = image.get('system:index');
      //var dateofimage = dateList(dateindex);
      var index = ee.Number.parse(dateindex);
      //var len = parseInt(index);
      var date = start.advance(index,'day');
      var month = date.get('month');
      //var date = ee.Date(daily_coll.get(len));
      return ee.Image(image).setMulti({
              'system:time_start' : date,
              'system:time_end'   : date,
              'month'             : month
      });
      });
      
      //print(EHF_Dataset)
      var HWFdataset = heatwave(EHF_Dataset,0).map(function(img){
       return img.addBands(ee.Image.constant(0).toDouble().rename('newcounter'));
      }).sort('system:time_start');
      

      
      var HWFcol = HWFdataset.map(function(img){
          var newcounter = img.select('newcounter');
          var subcount1 = newcounter.where(img.select('counter').eq(3),1);
          var subcount2 = newcounter.where(img.select('counter').gt(3),1);
          return img.addBands(subcount1.rename('subwave1')).addBands(subcount2.rename('subwave2'));
      });
      
      
      var first1   = ee.List([ee.Image(HWFcol.first())]);
      // reverse the  imglist
      var n = HWFcol.size();
      
      var HWFcols = ee.List(HWFcol.toList(n)).reverse();
      // make it into imgcoll
      HWFcols     = ee.ImageCollection.fromImages(HWFcols);
      var list1   = HWFcols.iterate(itt1,first1);
      list1       = ee.List(list1).slice(1,null);
      var HWFcoln = ee.ImageCollection.fromImages(list1);
      
      //print(HWFcoln);
      
      HWFcoln = HWFcoln.select([0,1,2,4,5])
        
      var first2 = ee.List([ee.Image(HWFcoln.first())]);
      var list2 = HWFcoln.iterate(itt2,first2);
      list2 = ee.List(list2).slice(1,null).reverse();
      var HWFcolns = ee.ImageCollection.fromImages(list2);
      
      //print(HWFcolns)
      HWFcolns = HWFcolns.map(function(img){
          var EHF       = img.select('EHF');
          var subwave2  = img.select('subwave2');
          var xcounter1 = img.select('xcounter1');
          var nheat     = subwave2.add(xcounter1);
          var mEHF      = nheat.multiply(EHF);
          var accumEHF      = mEHF;
          return img.addBands(nheat.rename('heat_identity')).addBands(mEHF.rename('mEHF')).addBands(accumEHF.rename('accumEHF'));
      });
      
      //print(HWFcolns)
      HWFcolns = HWFcolns.select([0,1,2,6,7,8])
      
      var first3 = ee.List([ee.Image(HWFcolns.first())]);
      
      
      HWFcolns = ee.List(HWFcolns.toList(n)).reverse();
      HWFcolns     = ee.ImageCollection.fromImages(HWFcolns);
      var list3 = HWFcolns.iterate(itt3,first3);
      list3 = ee.List(list3).slice(1,null).reverse();
      HWFcolns = ee.ImageCollection.fromImages(list3);
      
      //print(HWFcolns)
      
      HWFcolnt = HWFcolns.select([1,6]);
      var first4 = ee.List([ee.Image(HWFcolns.first())]);
      // apply EHF iteration function
      var list4 = HWFcolns.iterate(itt4,first4); // get the max value
      list4 = ee.List(list4).slice(1,null);
      var HWFcolnt = ee.ImageCollection.fromImages(list4);
      
      var EHFcollection = pkg_join.InnerJoin(HWFcolns.select([0,1,3,4,6]), HWFcolnt, pkg_join.filterTimeEq);

      EHFcollection = EHFcollection.map(function(img){
      
      var accumEHF     = img.select('accumEHF').multiply(img.select('accumpoint')).rename('accumEHF');
      var accumcounter = img.select('counter').multiply(img.select('accumpoint')).rename('maxlens');
      var meanEHF      = accumEHF.divide(accumcounter);
      var mEHF         = img.select('mEHF');
      return mEHF.addBands(meanEHF.rename('meanEHF')).addBands(img.select('accumpoint')).addBands(accumcounter).addBands(accumEHF).copyProperties(img,img.propertyNames());
      
      });
      
      var HWD     = EHFcollection.select('maxlens').reduce(ee.Reducer.max());
      
      HWD = HWD.rename("HWD");
      
      var HWA     = EHFcollection.select('mEHF').reduce(ee.Reducer.max());
      
      HWA = HWA.rename("HWA");
      
      var HWF     = EHFcollection.select('maxlens').reduce(ee.Reducer.sum());
      
      HWF = HWF.rename("HWF");
      
      var HWA_Sum = EHFcollection.select('meanEHF').reduce(ee.Reducer.sum());
      
      var HWN     = EHFcollection.select('accumpoint').reduce(ee.Reducer.sum());
      
      HWN = HWN.rename("HWN");
      
      var HWM     = HWA_Sum.divide(HWN);
      
      HWM = HWM.rename("HWM");
      
      map.clear();
      map.setOptions('TERRAIN');
      //map.setOptions('Dark', {'Dark':baseMap.darkTheme}, []); 
      map.centerObject(pt,initialZoom);  
      //map.addLayer(metMap.select('windSpeed'), {palette: colPals.SpectralFancy, min: 0, max: 10},'Wind Speed', true, 0.3); 
      
      
      var layerPanel = ui.Panel({
          widgets: [ui.Label('Map Layers',{fontWeight:'bold',fontSize:'16px',margin:'3px 3px 8px 3px'}),
          getLayerCheck('Heat wave numbers', true, 3, ''),
          getLayerCheck('Heat wave magnitude', false, 2, ''),
          getLayerCheck('Heat wave amplitude', false, 1, ''),
          getLayerCheck('Heat wave duration', false, 0,''),
          //getLegend('10', colPals.SpectralFancy),
          //getLegend('10', colPals.SpectralFancy),
          getLayerCheck('Heat wave frequency', false, 4, ''),
      ],
          style: {
              margin: '0px 0px 0px 0px',
              position: 'bottom-left'
      }});
      
      
      // Legend:
      //map.remove(legendPanel)
      //var legendPanel = getLegend();
      
      //legendPanel.remove(legendPanel.widgets().get(1));
      //legendPanel = getLegend();
      //controlPanel.add(legendPanel);
      
      var chartWrapper = ui.Panel({widgets:[],style: {position:'bottom-right', width:'400px', maxHeight: '90%'}}); 
      var chartPanel   = ui.Panel({widgets:[],style: {margin: '8px -8px -8px -8px'}}); 
      ui.root.onResize(function(deviceInfo){    
              map.remove(chartWrapper);
              chartWrapper = ui.Panel({      
                              widgets: [],      
                              style: {position:'bottom-right', width:'400px', maxHeight: '90%'}  
                              });  
              chartPanel = ui.Panel({      
                              widgets: [],   
                              style: {margin: '8px -8px -8px -8px'}    
              });
              
              var tchart     = ui.Chart.image.series(tempcol.select(tempmode), pt, ee.Reducer.first(), 5000).setOptions({     
                                title: tempmode+' timer series',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: tempmode,    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });
              
              var hchart     = ui.Chart.image.series(EHF_Dataset.select('EHF'), pt, ee.Reducer.first(), 5000).setOptions({     
                                title: tempmode+' timer series',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: tempmode,    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });

              var mChart     = ui.Chart.image.series(HWFcolns.select('mEHF'),   pt, ee.Reducer.first(), 5000).setOptions({     
                                title: 'Active heat wave events',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: 'Active heat wave events',    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });
              
              //var ccChart    = ui.Chart.image.series(HWFcolns.select('counter'),pt, ee.Reducer.first(), 5000).setOptions({     
              //                  title: 'Active heat wave counts',     
              //                  titleTextStyle: {fontSize: '15'}, 
              //                  vAxis:{
              //                         title: 'Count',    
              //                         titleTextStyle: {fontSize: '12'},    
              //                        },   
              //                  hAxis:{     
              //                        title: 'Date',
              //                        titleTextStyle: {fontSize: '12'},   
              //                        }
              //                  });
              //var urlimgget = HWN.clip(geometry).getDownloadURL({
              //                  region: JSON.stringify(geometry.bounds().getInfo()),
              //                  name: 'HWN_Output'+"_"+stryear,
              //                  crs: 'EPSG:4326',
              //                  scale: 5000
              //                  })
              //var link = ui.Chart(
              //                  [
              //                    ['HWs'],
              //                    ['<a target="_blank" href='+urlimgget+'>'+'Heat Wave Number Output Download</a>']
              //                  ], 'Table',
              //                   {allowHtml: true});
              //var linkPanel = ui.Panel([link]);
              
              //map.addLayer(linkPanel)
              chartPanel.add(tchart).add(hchart).add(mChart);   
              
              var hideChartMode = true;   
              
              var hideShowChartButton = ui.Button({      
                  label: 'Hide Charts',      
                  onClick: function() {       
                  hideChartMode = !hideChartMode;     
                  hideShowChartButton.setLabel(hideChartMode ? 'Hide Charts': 'Show Charts');       
                  if (!hideChartMode) {     
                      chartPanel.clear();         
                      chartWrapper.style().set({width: '97px'});        
                  } 
                  else{
              var tchart     = ui.Chart.image.series(tempcol.select(tempmode), pt, ee.Reducer.first(), 5000).setOptions({     
                                title: tempmode+' timer series',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: tempmode,    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });

              var hchart     = ui.Chart.image.series(EHF_Dataset.select('EHF'), pt, ee.Reducer.first(), 5000).setOptions({     
                                title: tempmode+' timer series',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: tempmode,    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });
              var mChart     = ui.Chart.image.series(HWFcolns.select('mEHF'),   pt, ee.Reducer.first(), 5000).setOptions({     
                                title: 'Active heat wave events',     
                                titleTextStyle: {fontSize: '15'}, 
                                vAxis:{
                                       title: 'Active heat wave events',    
                                       titleTextStyle: {fontSize: '12'},    
                                      },   
                                hAxis:{     
                                      title: 'Date',
                                      titleTextStyle: {fontSize: '12'},   
                                      }
                                });
              
              //var ccChart    = ui.Chart.image.series(HWFcolns.select('counter'),pt, ee.Reducer.first(), 5000).setOptions({     
              //                  title: 'Heat wave number counts',     
              //                  titleTextStyle: {fontSize: '15'}, 
              //                  vAxis:{
              //                         title: 'Count',    
              //                         titleTextStyle: {fontSize: '12'},    
              //                        },   
              //                  hAxis:{     
              //                        title: 'Date',
              //                        titleTextStyle: {fontSize: '12'},   
              //                        }
              //                  });
                                
              //var urlimgget = HWN.clip(geometry).getDownloadURL({
              //                  region: JSON.stringify(geometry.bounds().getInfo()),
              //                  name: 'HWN_Output'+"_"+stryear,
              //                  crs: 'EPSG:4326',
              //                  scale: 5000
              //                  })
              //var link = ui.Chart(
              //                  [
              //                    ['HWs'],
              //                    ['<a target="_blank" href='+urlimgget+'>'+'Heat Wave Number Output Download</a>']
              //                  ], 'Table',
              //                   {allowHtml: true});
              //var linkPanel = ui.Panel([link]);
              
                  chartPanel.add(tchart).add(hchart).add(mChart);         
                  chartWrapper.style().set({width: '400px'});        
                  }      
              },        
              style: {padding: '0', margin: '0'}    
              });    
              chartWrapper.add(hideShowChartButton).add(chartPanel);    
              if (deviceInfo.is_desktop & deviceInfo.width > 900) {     
                    map.add(chartWrapper);    
              }  
        });  
      
      map.add(layerPanel);
      
      //map.addLayer(griddedTraj.divide(nTraj/100).selfMask(),{palette: colPals.Grays, min: 1, max: 100}, 'Trajectory Density', false, 0.85);
      map.addLayer(HWA,{min:0,max:50,palette:colPals.Spectral},'heatwave amplitude',false);
      map.addLayer(HWD,{min:0,max:30,palette:colPals.Spectral},'max Heatwave Spells',false);
      map.addLayer(HWM,{min:0,max:40,palette:['#FEFF54','#EF8532','#EA3423','#8C1B4B','#741425']},'heatwave magnitude',false);
      map.addLayer(HWF,{min:0,max:100,palette:colPals.Spectral},'total heatwave days',false);
      map.addLayer(HWN.clip(geometry),{min:0,max:10,palette:colPals.Spectral},'heat wave number',true);
      
      
      

      
      //map.addLayer(meanTimeStepsMonth.style({color: 'black', width: 0.85}),{},'Trajectories',true,0.7);
      map.addLayer(ee.FeatureCollection(pt).style({color: '#FF0000', pointShape: 'circle'}),{},'Point Location');  
      //map.addLayer(windArrows.style({color: '#FFF', width: 0.9}),{},'Wind Arrows',true,0.3);  
      
      // update coordinates upon map click after first load\n  
      map.onClick(function(coords) {   
          pointSelectPanel.widgets().get(1).widgets().get(1).widgets().get(1).setValue(coords.lon);    
          pointSelectPanel.widgets().get(1).widgets().get(1).widgets().get(3).setValue(coords.lat);
      });
});                


