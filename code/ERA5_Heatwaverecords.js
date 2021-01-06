var P95_W = ee.Image("users/tensorflow/World_EHF/World_TP95"),
    imageCollection = ee.ImageCollection("ECMWF/ERA5/DAILY"),
    Dot = /* color: #d63000 */ee.Geometry.Point([-66.32099335215963, -33.04072966251858]),
    world = ee.FeatureCollection("users/tensorflow/continent_polygons"),
    P95 = ee.Image("users/tensorflow/Aus_ERA5_P95"),
    TX90 = ee.Image("users/tensorflow/Aus_ERA5_TX90"),
    TN90 = ee.Image("users/tensorflow/Aus_ERA5_TN90");
//var Asia = ee.FeatureCollection(world).filterMetadata('continent','equals','Asia')
//var geometry_Asia = Asia.geometry();
//
//var NorthAmerica = ee.FeatureCollection(world).filterMetadata('continent','equals','North America')
//var geometry_NorthAmerica = NorthAmerica.geometry();
//
//var Europe = ee.FeatureCollection(world).filterMetadata('continent','equals','Europe')
//var geometry_Europe = Europe.geometry();
//
//var Africa = ee.FeatureCollection(world).filterMetadata('continent','equals','Africa')
//var geometry_Africa = Africa.geometry();
//
//
//var SouthAmerica = ee.FeatureCollection(world).filterMetadata('continent','equals','South America')
//var geometry_SouthAmerica = SouthAmerica.geometry();
//
//Map.addLayer(geometry_SouthAmerica)
//
var Australia = ee.FeatureCollection(world).filterMetadata('continent','equals','Australia')
var geometry_Australia = Australia.geometry();

//var northsphere = ee.FeatureCollection(world).filterMetadata('continent','not_contains','Australia');
//northsphere = ee.FeatureCollection(northsphere).filterMetadata('continent','not_contains','South America');
//northsphere = ee.FeatureCollection(northsphere).filterMetadata('continent','not_contains','Africa');
//northsphere = ee.FeatureCollection(northsphere).filterMetadata('continent','not_contains','Oceania');
//northsphere = ee.FeatureCollection(northsphere).filterMetadata('continent','not_contains','Antarctica');
//var geometry_northsphere = northsphere.geometry();


//var southsphere =       ee.FeatureCollection(world).filterMetadata('continent','not_contains','Europe');
//southsphere     = ee.FeatureCollection(southsphere).filterMetadata('continent','not_contains','North America');
//southsphere     = ee.FeatureCollection(southsphere).filterMetadata('continent','not_contains','Asia');
//southsphere     = ee.FeatureCollection(southsphere).filterMetadata('continent','not_contains','Antarctica');
//var geometry_southsphere = southsphere.geometry();

//Map.addLayer(geometry_northsphere)
//Map.addLayer(geometry_southsphere)

//var eracol = ee.ImageCollection(imageCollection).filterDate('2019-05-01','2019-10-01');

function moveavg(ImgCol, win_back, win_forw) {
    if (typeof win_back === 'undefined') { win_back = 0; }
    if (typeof win_forw === 'undefined') { win_forw = 0; }

    win_back = ee.Number(win_back);
    win_forw = ee.Number(win_forw);

    // print(win_back, win_forw, n);
    var n = ImgCol.size();
    var y = ImgCol.toList(n);
    //print(y.get(1));
    // print(win_back, win_forw, n);

    // 1. i: [0, win_back - 1], I = [0, i+win_forw]
    var headval = ee.List.sequence(0, win_back.subtract(1)) //index begin at 0
        // .aside(print, 'head')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1);
            var I_end = I_beg.subtract(win_back).max(0); //end exclusive, so add 1
            //print(I_beg)
            //print(I_end)
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_end,I_beg)).mean();
            var tempimage = avgmean.subtract(P95);
            tempimage = tempimage.rename('Tmean_Sig');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
            
        });
    // 2. i: [(n - win_forw), n - 1], I = [i - win_forw, n]
    var tailval = ee.List.sequence(n.subtract(win_back), n.subtract(1))
        // .aside(print,'tail')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1).min(n);
            var I_end = I_beg.subtract(win_back);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_end,I_beg)).mean();
            var tempimage = avgmean.subtract(P95);
            tempimage = tempimage.rename('Tmean_Sig');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    // 3. i: [win_back, n - win_forw - 1], I = [i - win_back, i + win_forw]
    var midval = ee.List.sequence(win_back, n.subtract(win_back).subtract(1))
        // .aside(print, 'mid')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1);
            var I_end = I_beg.subtract(win_back);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_end,I_beg)).mean();
            var tempimage = avgmean.subtract(P95);
            tempimage = tempimage.rename('Tmean_Sig');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });

    var ymov = headval.cat(midval).cat(tailval);
    // print('ans', ans);
    return ee.ImageCollection(ymov);
}

function moveacc(ImgCol, win_back, win_forw) {
    if (typeof win_back === 'undefined') { win_back = 0; }
    if (typeof win_forw === 'undefined') { win_forw = 0; }

    win_back = ee.Number(win_back);
    win_forw = ee.Number(win_forw);

    // print(win_back, win_forw, n);
    var n = ImgCol.size();
    var y = ImgCol.toList(n);
    //print(y.get(1));
    // print(win_back, win_forw, n);

    // 1. i: [0, win_back - 1], I = [0, i+win_forw]
    var headval = ee.List.sequence(0, win_back.subtract(1)) //index begin at 0
        // .aside(print, 'head')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1);
            var I_mid = I_beg.subtract(3).max(0);
            var I_end = I_beg.subtract(win_back).max(0); //end exclusive, so add 1
            //print(I_beg)
            //print(I_end)
            var image = ee.Image(y.get(i));
            var avgmean_1 = ee.ImageCollection(y.slice(I_mid,I_beg)).mean();
            var avgmean_2 = ee.ImageCollection(y.slice(I_end,I_mid.add(1))).mean();
            var tempimage = avgmean_1.subtract(avgmean_2);
            tempimage = tempimage.rename('Tmean_Acc');
            tempimage = tempimage.max(1);
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
            
        });
    // 2. i: [(n - win_forw), n - 1], I = [i - win_forw, n]
    var tailval = ee.List.sequence(n.subtract(win_forw), n.subtract(1))
        // .aside(print,'tail')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1).min(n);
            var I_mid = I_beg.subtract(3);
            var I_end = I_beg.subtract(win_back);
            var image = ee.Image(y.get(i));
            var avgmean_1 = ee.ImageCollection(y.slice(I_mid,I_beg)).mean();
            var avgmean_2 = ee.ImageCollection(y.slice(I_end,I_mid)).mean();
            var tempimage = avgmean_1.subtract(avgmean_2);
            tempimage = tempimage.rename('Tmean_Acc');
            tempimage = tempimage.max(1);
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    // 3. i: [win_back, n - win_forw - 1], I = [i - win_back, i + win_forw]
    var midval = ee.List.sequence(win_back, n.subtract(win_forw).subtract(1))
        // .aside(print, 'mid')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.add(1);
            var I_mid = I_beg.subtract(3);
            var I_end = I_beg.subtract(win_back);
            var image = ee.Image(y.get(i));
            var avgmean_1 = ee.ImageCollection(y.slice(I_mid,I_beg)).mean();
            var avgmean_2 = ee.ImageCollection(y.slice(I_end,I_mid)).mean();
            var tempimage = avgmean_1.subtract(avgmean_2);
            tempimage = tempimage.rename('Tmean_Acc');
            tempimage = tempimage.max(1);
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });

    var ymov = headval.cat(midval).cat(tailval);
    // print('ans', ans);
    return ee.ImageCollection(ymov);
}


function movesevenxavg(ImgCol, win_back, win_forw) {
    if (typeof win_back === 'undefined') { win_back = 0; }
    if (typeof win_forw === 'undefined') { win_forw = 0; }

    win_back = ee.Number(win_back);
    win_forw = ee.Number(win_forw);

    // print(win_back, win_forw, n);
    var n = ImgCol.size();
    var y = ImgCol.toList(n);
    //print(y.get(1));
    // print(win_back, win_forw, n);

    // 1. i: [0, win_back - 1], I = [0, i+win_forw]
    var headval = ee.List.sequence(0, win_back.subtract(1)) //index begin at 0
        // .aside(print, 'head')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.subtract(win_back).max(0);
            var I_end = i.add(win_forw).add(1); //end exclusive, so add 1
            //print(I_beg)
            //print(I_end)
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            var tempimage = avgmean.subtract(TX90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
            
        });
    // 2. i: [(n - win_forw), n - 1], I = [i - win_forw, n]
    var tailval = ee.List.sequence(n.subtract(win_forw), n.subtract(1))
        // .aside(print,'tail')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.subtract(win_back);
            var I_end = i.add(win_forw).add(1).min(n);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            var tempimage = avgmean.subtract(TX90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    // 3. i: [win_back, n - win_forw - 1], I = [i - win_back, i + win_forw]
    var midval = ee.List.sequence(win_back, n.subtract(win_forw).subtract(1))
        // .aside(print, 'mid')
        .map(function(i) {
            i = ee.Number(i);
            //var I_beg = i;
            //var I_end = i.add(win_forw).add(1);
            //var image = ee.Image(y.get(i));
            //var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            
            var I_beg = i.subtract(win_back);
            var I_end = i.add(win_forw).add(1);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            
            var tempimage = avgmean.subtract(TX90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });

    var ymov = headval.cat(midval).cat(tailval);
    // print('ans', ans);
    return ee.ImageCollection(ymov);
}
function movesevennavg(ImgCol, win_back, win_forw) {
    if (typeof win_back === 'undefined') { win_back = 0; }
    if (typeof win_forw === 'undefined') { win_forw = 0; }

    win_back = ee.Number(win_back);
    win_forw = ee.Number(win_forw);

    // print(win_back, win_forw, n);
    var n = ImgCol.size();
    var y = ImgCol.toList(n);
    //print(y.get(1));
    // print(win_back, win_forw, n);

    // 1. i: [0, win_back - 1], I = [0, i+win_forw]
    var headval = ee.List.sequence(0, win_back.subtract(1)) //index begin at 0
        // .aside(print, 'head')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.subtract(win_back).max(0);
            var I_end = i.add(win_forw).add(1); //end exclusive, so add 1
            //print(I_beg)
            //print(I_end)
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            var tempimage = avgmean.subtract(TN90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
            
        });
    // 2. i: [(n - win_forw), n - 1], I = [i - win_forw, n]
    var tailval = ee.List.sequence(n.subtract(win_forw), n.subtract(1))
        // .aside(print,'tail')
        .map(function(i) {
            i = ee.Number(i);
            var I_beg = i.subtract(win_back);
            var I_end = i.add(win_forw).add(1).min(n);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            var tempimage = avgmean.subtract(TN90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    // 3. i: [win_back, n - win_forw - 1], I = [i - win_back, i + win_forw]
    var midval = ee.List.sequence(win_back, n.subtract(win_forw).subtract(1))
        // .aside(print, 'mid')
        .map(function(i) {
            i = ee.Number(i);
            //var I_beg = i;
            //var I_end = i.add(win_forw).add(1);
            //var image = ee.Image(y.get(i));
            //var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            
            var I_beg = i.subtract(win_back);
            var I_end = i.add(win_forw).add(1);
            var image = ee.Image(y.get(i));
            var avgmean = ee.ImageCollection(y.slice(I_beg, I_end)).mean();
            
            var tempimage = avgmean.subtract(TN90);
            tempimage = tempimage.rename('EHF');
            return image.addBands(tempimage);
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });

    var ymov = headval.cat(midval).cat(tailval);
    // print('ans', ans);
    return ee.ImageCollection(ymov);
}




function meanfunc(img){
  var tmean = img.select('mean_2m_air_temperature').subtract(ee.Image(273.15));
  return tmean.rename('Tmean').copyProperties(img,img.propertyNames())
}

function maxfunc(img){
  var tmax = img.select('maximum_2m_air_temperature').subtract(ee.Image(273.15));
  return tmax.rename('Tmax').copyProperties(img,img.propertyNames())
}

function minfunc(img){
  var tmin = img.select('minimum_2m_air_temperature').subtract(ee.Image(273.15));
  return tmin.rename('Tmin').copyProperties(img,img.propertyNames())
}


function EHFfunc(img){
  var Acc  = img.select('Tmean_Acc');
  var Sig = img.select('Tmean_Sig');
  var EHF = Acc.multiply(Sig);
  return EHF.rename('EHF').copyProperties(img,img.propertyNames());//img.propertyNames()
}

function export_img(img, folder, task){
    Export.image.toAsset({
          image : img,
          description: task,
          assetId: folder.concat('/').concat(task),
          //range: [-0.125, -90.125, 179.875, 90.125],
          //dimensions:"1440x721",
          crs:"EPSG:4326",
          scale: 25000,
          region: geometry_Australia.bounds(),
          //crsTransform: [0.25, 0, -180, 0, -0.25, 89.875],
          maxPixels: 1e13
    });
}

var filterTimeEq = ee.Filter.equals({
  leftField : 'system:time_end',
  rightField: 'system:time_end'
});

function joinfea(feature) {return ee.Image(feature.get('primary')).addBands(feature.get('secondary'));}

function InnerJoin(primary, secondary, filter, join) {
    join = typeof join !== 'undefined' ?  join : ee.Join.inner();
    var JoinedImgCol_raw = join.apply(primary, secondary, filter);
    var joinedImgCol = JoinedImgCol_raw.map(joinfea);
    return ee.ImageCollection(joinedImgCol);
}

function strcon(x) {return ee.String('EHF_').cat(ee.Date(x).format('YYYY_MM_dd'));}

var i = 2019;

var startdate = i.toString()+'-07-01';
var enddate   = (i+1).toString()+'-07-01';

var eracol = ee.ImageCollection(imageCollection).filterDate(startdate,enddate);
//eracol = eracol.map(meanfunc);


//#############################################################################################
// EHF collection calculation
//var movesig = moveavg(eracol,3,3);
//var moveacc = moveacc(eracol,33,33);
//var sigacc = InnerJoin(movesig,moveacc,filterTimeEq);
//var EHF_Dataset = sigacc.map(EHFfunc);

//############################################################################################
// Tmax collection calculation

//eracol = eracol.map(maxfunc);
//var EHF_Dataset = movesevenxavg(eracol, 7, 7);


//#############################################
// Tmin collection calculation
eracol = eracol.map(minfunc);
var EHF_Dataset = movesevennavg(eracol, 7, 7);


//#############################################

var stryear  = i.toString();
var startEHF = stryear.concat('-11-01');
startEHF = ee.Date(startEHF);
var endEHF   = startEHF.advance(5,'month');

EHF_Dataset = EHF_Dataset.filterDate(startEHF,endEHF);

var img_out = EHF_Dataset.toArray();
var ids = ee.List(EHF_Dataset.aggregate_array('system:time_start')).map(strcon);
img_out = img_out.arraySlice(1, -1).arrayProject([0]).arrayFlatten([ids]);//convert into image;
var outstr = 'Merged_Tmin_'+i.toString();
export_img(img_out, 'Aus_ERA5_Tmin', outstr);


//}
//print(img_out)
//Export.image.toDrive({
//  image:HWD,
//  description:"World_HWD",
//  assetId:"users/tensorflow/World_EHF/World_HWD",
//  dimensions:"1440x721",
//  crs:"EPSG:4326",
//  crsTransform: [0.25, 0, -180, 0, -0.25, 90],
//  maxPixels:1e10
//})
//var n = EHF_Dataset.size();
//
/*

function heatSpells(img, list){
    // get previous image
    var prev = ee.Image(ee.List(list).get(-1));
    // find areas gt precipitation threshold (gt==0, lt==1)
    var hot = img.select([0]).gt(maxThresh);
    // add previous day counter to today's counter
    var accum = prev.select('counter').add(hot).rename('counter');
    // create a result image for iteration
    // precip < thresh will equal the accumulation of counters
    // otherwise it will equal zero
    var out = img.select([0]).addBands(img.select('counter').where(hot.eq(1),accum)).uint8();
    return ee.List(list).add(out);
}


function heatwave(imgcoll,maxThresh){

  var dataset = imgcoll.map(function(img){
       return img.addBands(ee.Image.constant(0).uint8().rename('counter'));
    }).sort('system:time_start');
  
  function heatSpells(img, list){
    // get previous image
    var prev = ee.Image(ee.List(list).get(-1));
    // find areas gt precipitation threshold (gt==0, lt==1)
    var hot = img.select([0]).gt(maxThresh);
    // add previous day counter to today's counter
    var accum = prev.select('counter').add(hot).rename('counter');
    // create a result image for iteration
    // precip < thresh will equal the accumulation of counters
    // otherwise it will equal zero
    var out = img.select([0]).addBands(img.select('counter').where(hot.eq(1),accum)).uint8();
    return ee.List(list).add(out);
  }
  
  // create first image for iteration
  var first = ee.List([ee.Image(dataset.first())]);
  // apply dry speall iteration function
  var lists = dataset.iterate(heatSpells,first); // get the max value
  lists = ee.List(lists).slice(1,null);
  return ee.ImageCollection.fromImages(lists);
  

}


// HWN mean how many discrete heatwave events for the selected season.

// HWM means the sum of EHF on all days classed as heatwave days, divide by the number of such days.

// HWA refers to the hottest day of the hottest heatwave of the year. 
// The hottest heatwave is the one with the highest average EHF across all days of the heatwave
// The hottest day of this heatwave is also selected, based on the day within the heatwave with the highest EHF.
   

// HWF the number of days in the sum of the duration of all four events.


//HWF is the sum of days that belong to a period of at least 3 consecutive days where EHF is positive

//var testcol = heatwave(EHF_Dataset,0)
//print(testcol)
var HWFdataset = heatwave(EHF_Dataset,0).map(function(img){
       return img.addBands(ee.Image.constant(0).uint8().rename('newcounter'));
    }).sort('system:time_start');

//print(HWFdataset);

//var n = HWFdataset.size();
//var y = HWFdataset.toList(n);
//
//var newdataset = ee.ImageCollection.fromImages(y.slice(1,n));
//
//
var HWFcol = HWFdataset.map(function(img){
    var newcounter = img.select('newcounter');
    var subcount1 = newcounter.where(img.select('counter').eq(3),1);
    var subcount2 = newcounter.where(img.select('counter').gt(3),1);
    return img.addBands(subcount1.rename('subwave1')).addBands(subcount2.rename('subwave2'));
});

Map.addLayer(HWFdataset.select('counter'));

var HWFcol = HWFcol.map(function(img){
  
    var cur_date = img.get('system:time_start');
    var nxt_date = ee.Date(cur_date).advance(1,'day');
    var trd_date = ee.Date(cur_date).advance(2,'day');
    var nxt_img  = ee.ImageCollection(HWFcol).filterMetadata('system:time_start','equals',nxt_date).first();
    var trd_img  = ee.ImageCollection(HWFcol).filterMetadata('system:time_start','equals',trd_date).first();
    var newcounter = img.select('newcounter');
    if ((nxt_img.select('subwave1').eq(1)) || (trd_img.select('subwave1').eq(1)))
    {
       newcounter   = newcounter.where(img.select('subwave1').eq(0),1);
    }
    //subwave3 = subwave3.rename('subwave3');
    
    //if (subwave3.eq(2)){
    //  subwave3 = subwave3.subtract(1);
    //}
    var subwave = newcounter.where(img.select('subwave2').eq(1),1);
    //var heatwaveEHF  = subwave.multiply(img.select('EHF'));
    return img.addBands(subwave.rename('heatwaveEHF'));

});
//
//
//print(HWFcol);
//
var HWA = HWFcol.select('heatwaveEHF').reduce(ee.Reducer.min());

Map.addLayer(HWA.clip(geometry),{min:0,max:50,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'heatwave amplitude');


//Map.addLayer(HWFcol.select('subwave'));

//function heatmove(img, list){
//    // get previous image
//    var prev = ee.Image(ee.List(list).get(-1));
//    // find areas gt precipitation threshold (gt==0, lt==1)
//    var hot = img.select('subwave').gt(0);
//    // add previous day counter to today's counter
//    var accum = prev.select('subwave').add(hot).rename('subwave');
//    // create a result image for iteration
//    // precip < thresh will equal the accumulation of counters
//    // otherwise it will equal zero
//    var out = img.select('subwave').addBands(img.select('subwave').where(hot.eq(0),accum)).uint8();
//    return ee.List([]).add(out);
//  }
//  
//var firsthwf = ee.List([ee.Image(HWFcol.first())]);
//  // apply dry speall iteration function
//var moveheatcol = ee.ImageCollection.fromImages(HWFcol.iterate(heatmove,firsthwf));
//
//var n = moveheatcol.size();
//var y = moveheatcol.toList(n);
//
//moveheatcol = ee.ImageCollection.fromImages(y.slice(1,n));
//
//var firsthwf = ee.List([ee.Image(moveheatcol.first())]);
//  // apply dry speall iteration function
//moveheatcol = ee.ImageCollection.fromImages(moveheatcol.iterate(heatmove,firsthwf));


//Map.addLayer(moveheatcol.select('subwave'));


//var HWFcol_2 = newdataset.map(function(img){
//    var newcounter = img.select('newcounter');
//    var subcount = newcounter.where(img.select('counter').gt(3),1);
//    return img.addBands(subcount.rename('subwave2')).uint8();
//});
//
//print(HWFcol_2);

//var HWFcol_q = HWFcol_1.map(function(img){
//  if (img.select('subwave1').eq(1)) {
//      var cur_date = img.get('system:time_start');
//      var pre_date = ee.Date(cur_date).advance(-1,'day');
//      var yst_date = ee.Date(cur_date).advance(-2,'day');
//      var pre_img  = ee.ImageCollection(newdataset).filterMetadata('system:time_start','equals',pre_date).first();
//      var yst_img  = ee.ImageCollection(newdataset).filterMetadata('system:time_start','equals',yst_date).first();
//      pre_img      = pre_img.select('subwave1').add(1);
//      yst_img      = yst_img.select('subwave1').add(1);
//    
//  }
//    return img.select('subwave1');
//});

//var HWFcol = pkg_join.InnerJoin(HWFcol_2, HWFcol_q, pkg_join.filterTimeEq);

//print(HWFcol)

//var HWFcols = HWFcol.map(function(img){
//    var subwave1 = img.select('subwave1');
//    var subwave2 = img.select('subwave2');
//    var subwave  = subwave1.add(subwave2);
//    
//    return img.addBands(subwave.rename('heat_identity'));
//});
//
//Map.addLayer(HWFcols.select('heat_identity'))

//
//var HWFcol = newdataset.map(function(img){
//    var newcounter = img.select('newcounter');
//    var subcount = newcounter.where(img.select('counter').eq(3),1);
//    return img.addBands(subcount.rename('subwave1')).uint8();
//});
//
//var HWF = HWFcol.select('subwave').reduce(ee.Reducer.sum());
//Map.addLayer(HWF.clip(geometry),{min:0,max:10,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Total heatwave days');

//Export.image.toDrive({
//  image: HWF.clip(geometry),
//  description: 'HWF',
//  scale: 5000,
//  region: geometry.bounds()
//});


//HWD is the longest consecutive window where EHF is positive. HWA is where the EHF is at its highest value of the season


//var HWD = heatwave(EHF_Dataset,0).select('counter').reduce(ee.Reducer.max());

//Map.addLayer(HWD.clip(geometry),{min:0,max:30,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Max Heatwave Spells');

//Export.image.toDrive({
//  image: HWD.clip(geometry),
//  description: 'HWD',
//  scale: 5000,
//  region: geometry.bounds()
//});
//HWA is the peak day, or amplitude, of the hottest event (HWA), where the EHF is at its highest value of the season
//

//var HWA = EHF_Dataset.reduce(ee.Reducer.max());
//Map.addLayer(HWA.clip(geometry),{min:0,max:40,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Max EHF');


//Export.image.toDrive({
//  image: HWA.clip(geometry),
//  description: 'HWA',
//  scale: 5000,
//  region: geometry.bounds()
//});
//HWT is employed for the first time in this study and is computed as the start day of the first seasonal event, relative to the 1st of November

//var HWTcol = heatwave(EHF_Dataset,0).select('counter').map(function(img){
//    var counter = img.select('counter')
//    var days    = ee.Date(img.get('system:time_start')).difference(startdate,'day');
//    days        = ee.Image(days).uint8();
//    var onset   = days.mask(counter.gte(3));
//    return img.addBands(onset.rename('onset')).copyProperties(img,img.propertyNames());
//});
//
//
//var HWT = HWTcol.select('onset').reduce(ee.Reducer.firstNonNull());
////print(HWT)
//Map.addLayer(HWT.clip(geometry),{min:0,max:150,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Onset of heatwave');

//Export.image.toDrive({
//  image: HWT.clip(geometry),
//  description: 'HWT',
//  scale: 5000,
//  region: geometry.bounds()
//});


//Map.addLayer(movesig.first());
//Map.addLayer(moveacc.first());

*/
