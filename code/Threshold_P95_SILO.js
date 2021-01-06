var image = ee.Image("users/tensorflow/Maxtemp_Aus/Maxtemp_1981"),
    table = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
function funcmax(year){
    // Original string 
    var str = 'users/tensorflow/Maxtemp_Aus/Maxtemp_'; 
    // Joining the strings together
    var stryear   = year.toString();
    var value = str.concat(stryear); 
    var pathimg = ee.Image(value);
    var maxtemp = multimaxbandstoImageCollection(pathimg);
    var newcoll = maxtemp.map(function(img){
    var start = stryear.concat('-01-01');
    start = ee.Date(start);
    var dateindex = img.get('system:index');
    //var dateofimage = dateList(dateindex);
    var index = ee.Number.parse(dateindex);
    //var len = parseInt(index);
    var date = start.advance(index,'day');
    var month = date.get('month');
    //var date = ee.Date(daily_coll.get(len));
    return ee.Image(img).setMulti({
            'system:time_start' : date,
            'system:time_end'   : date,
            'month'             : month
    });
    });
    //var imgcol_1 = newcoll.filterMetadata('month','equals',1);
    //var imgcol_2 = newcoll.filterMetadata('month','equals',2);
    //var imgcol_3 = newcoll.filterMetadata('month','equals',3);
    //var imgcol_11 = newcoll.filterMetadata('month','equals',11);
    //var imgcol_3 = newcoll.filterMetadata('month','equals',12);
    //var seasonalcol = imgcol_1.merge(imgcol_2).merge(imgcol_3).merge(imgcol_11).merge(imgcol_12);
    //var seasonalcol = imgcol_1.merge(imgcol_2).merge(imgcol_3);
    
    return newcoll;
}

function funcmin(year){
    // Original string 
    var str = 'users/tensorflow/Mintemp_Aus/Mintemp_'; 
    // Joining the strings together
    var stryear   = year.toString();
    var value = str.concat(stryear); 
    var pathimg = ee.Image(value);
    var mintemp = multiminbandstoImageCollection(pathimg);
    var newcoll = mintemp.map(function(img){
    var start = stryear.concat('-01-01');
    start = ee.Date(start);
    var dateindex = img.get('system:index');
    //var dateofimage = dateList(dateindex);
    var index = ee.Number.parse(dateindex);
    //var len = parseInt(index);
    var date = start.advance(index,'day');
    var month = date.get('month');
    //var date = ee.Date(daily_coll.get(len));
    return ee.Image(img).setMulti({
            'system:time_start' : date,
            'system:time_end'   : date,
            'month'             : month
    });
    });
    //var imgcol_1 = newcoll.filterMetadata('month','equals',1);
    //var imgcol_2 = newcoll.filterMetadata('month','equals',2);
    //var imgcol_3 = newcoll.filterMetadata('month','equals',3);
    //var imgcol_11 = newcoll.filterMetadata('month','equals',11);
    //var imgcol_3 = newcoll.filterMetadata('month','equals',12);
    //var seasonalcol = imgcol_1.merge(imgcol_2).merge(imgcol_3).merge(imgcol_11).merge(imgcol_12);
    //var seasonalcol = imgcol_1.merge(imgcol_2).merge(imgcol_3);
    
    return newcoll;
}

function multimaxbandstoImageCollection(image) {
  function selectBand(image) {
    return function(bandName) {
      return image.select([bandName]).rename('Tmax');
    }
  }
  var bandNames = image.bandNames()
  return ee.ImageCollection.fromImages(bandNames.map(selectBand(image)))
}


function multiminbandstoImageCollection(image) {
  function selectBand(image) {
    return function(bandName) {
      return image.select([bandName]).rename('Tmin');
    }
  }
  var bandNames = image.bandNames()
  return ee.ImageCollection.fromImages(bandNames.map(selectBand(image)))
}

//var pkg_join  = require('users/geogismx/mountain_solar:join.js');

//var maxcol0 = funcmax(1981);
//var mincol0 = funcmin(1981);
//
//var strcol = pkg_join.InnerJoin(maxcol0, mincol0, pkg_join.filterTimeEq);
//
//var i;
//for (i = 1982; i < 2011; i++) {
//
//  var maxcol = funcmax(i);
//  var mincol = funcmin(i);
//  
//  var tempcol = pkg_join.InnerJoin(maxcol, mincol, pkg_join.filterTimeEq);
//  strcol     = strcol.merge(tempcol);
//  
//}

var silo = ee.ImageCollection('projects/eo-datascience-public/assets/silo_daily');

var strcol = ee.ImageCollection(silo).filterDate('1960-01-01','1990-01-01');
  //print(yearofsilo)
//var newsilo    = yearofsilo.map(function(image){
//    var maxtemp  = image.select('max_temp');
//    var mintemp  = image.select('min_temp');
//    var meantemp = maxtemp.add(mintemp).divide(2);
//    meantemp = meantemp.rename('Tmean');
//    //#############################//
//    //Before 2017, 'date' property name is 'Date'
//    //After  2017, 'date' property name is 'date'
//    //#############################//
//    var date =  image.get('Date');
//    date = ee.Date(date);
//    var month = date.get('month');
//    return meantemp.setMulti({
//            'system:time_start' :date,
//            'system:time_end'   :date,
//            'month'             :month
//    });
//});


//strcol = strcol.map(function(img){
//    var tmax = img.select('Tmax');
//    var tmin = img.select('Tmin');
//    var tmean = tmax.add(tmin).divide(2).rename('Tmean');
//    //var date = ee.Date(daily_coll.get(len));
//    return ee.Image(tmean).copyProperties(img,img.propertyNames())
//    });
    
strcol = strcol.map(function(img){
    var tmax = img.select('max_temp');
    var tmin = img.select('min_temp');
    var tmean = tmax.add(tmin).divide(2).rename('Tmean');
    //var date = ee.Date(daily_coll.get(len));
    return ee.Image(tmean).copyProperties(img,img.propertyNames())
    });

//print(strcol)
//print(strcol)
var xt95 = strcol.reduce(ee.Reducer.percentile([95]));

//Map.addLayer(xt95);
var Australia = ee.FeatureCollection(table).filterMetadata('country_na','equals','Australia')
//var geometry = Australia.geometry();
Export.image.toAsset({
  image: xt95,
  description: 'Aus_Tmean_60_90_P95',
  region: Australia.geometry().bounds(),
  scale:  5000,
  crs:  'EPSG:4326'
})


