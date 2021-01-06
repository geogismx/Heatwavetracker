var silo = ee.ImageCollection("projects/eo-datascience-public/assets/silo_daily"),
    table = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
var Australia = ee.FeatureCollection(table).filterMetadata('country_na','equals','Australia')
var geometry = Australia.geometry();
var silos = silo.filterDate('1979-01-01','2000-01-01');

function siloset(image){
    var idno =  image.get('id_no');
    var date =  image.get('Date');
    var lens = ee.String(idno).length();
    var year = ee.String(idno).slice(0,4);
    var no   = ee.String(idno).slice(5,lens);
    no       = ee.Number.parse(no);
    return image.setMulti({
            'system:time_start' :date,
            'system:time_end'   :date,
            'year'              :year,
            'no'                :no 
    });
}

function silotemp(year){
  var stryear = year.toString();
  var start = stryear.concat('-11-01');
  start = ee.Date(start);
  var end   = start.advance(5,'month');
  var yearofsilo = ee.ImageCollection(silo).filterDate(start,end);
  //print(yearofsilo)
  return yearofsilo;
}

var silotempcol = silos.map(siloset);

//var tempcol = silotempcol.select('max_temp').filter(ee.Filter.gte('no',144)).filter(ee.Filter.lte('no',158));

var i = 2018;
var EHFcol = silotemp(i);
//EHFcol     = EHFcol.map(siloset);

function newmovenormal(eratempcol, ImgCol) {

    var n = ImgCol.size();
    var y = ImgCol.toList(n);

    var tempval = ee.List.sequence(0,n.subtract(1)).map(function(i) {
            //i = ee.Number(i);
            var image     = ee.Image(y.get(i));
            
            var date      = image.get('system:time_start');
            var I_beg     = ee.Date(date).advance(-7,'day');
            var I_end     = ee.Date(date).advance(7,'day');
            var id_beg    = ee.Date(I_beg).getRelative('day', 'year');
            var id_end    = ee.Date(I_end).getRelative('day', 'year');
            
            //if (id_end.lt(id_beg)){
            //  var strcol_1 = eracols.select('Tmax').filter(ee.Filter.and(ee.Filter.gte('no',id_beg),ee.Filter.lte('no',365)));
            //  var strcol_2 = eracols.select('Tmax').filter(ee.Filter.and(ee.Filter.gte('no',0),ee.Filter.lte('no',id_end)));
            //  var strcol   = strcol_1.merge(strcol_2);
            //  
            //}else{
            //  strcol    = eracols.select('Tmax').filter(ee.Filter.and(ee.Filter.gte('no',id_beg),ee.Filter.lte('no',id_end)));
            //}
            var strcol    = silotempcol.select('min_temp').filter(ee.Filter.and(ee.Filter.gte('no',id_beg),ee.Filter.lte('no',id_end)));
            var TP90 = strcol.reduce(ee.Reducer.percentile([90]));
            var tempimage = image.select('min_temp').subtract(TP90);
            tempimage = tempimage.rename('EHF');
            return tempimage.copyProperties(image,image.propertyNames());
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    return ee.ImageCollection(tempval);
}

function newmovexcept(eratempcol, ImgCol) {

    var n = ImgCol.size();
    var y = ImgCol.toList(n);

    var tempval = ee.List.sequence(0,n.subtract(1)).map(function(i) {
            //i = ee.Number(i);
            var image     = ee.Image(y.get(i));
            
            var date      = image.get('system:time_start');
            var I_beg     = ee.Date(date).advance(-7,'day');
            var I_end     = ee.Date(date).advance(7,'day');
            var id_beg    = ee.Date(I_beg).getRelative('day', 'year');
            var id_end    = ee.Date(I_end).getRelative('day', 'year');
            
            var strcol_1 = silotempcol.select('min_temp').filter(ee.Filter.and(ee.Filter.gte('no',id_beg),ee.Filter.lte('no',365)));
            var strcol_2 = silotempcol.select('min_temp').filter(ee.Filter.and(ee.Filter.gte('no',0),ee.Filter.lte('no',id_end)));
            var strcol   = strcol_1.merge(strcol_2);
            var TP90 = strcol.reduce(ee.Reducer.percentile([90]));
            var tempimage = image.select('min_temp').subtract(TP90);
            tempimage = tempimage.rename('EHF');
            return tempimage.copyProperties(image,image.propertyNames());
            //return ee.ImageCollection(y.slice(I_beg, I_end)).mean().copyProperties(y.get(i), prop_global);
        });
    return ee.ImageCollection(tempval);
}

//var tempcol = silotempcol.select('max_temp').filter(ee.Filter.gte('no',144)).filter(ee.Filter.lte('no',158));


var startdate = i.toString()+'-11-01';
var mid1date  = i.toString()+'-12-25';
var mid2date  = (i+1).toString()+'-01-08';
var enddate   = (i+1).toString()+'-04-01';


var yearcol_1 = ee.ImageCollection(EHFcol).filterDate(startdate,mid1date);
var yearcol_2 = ee.ImageCollection(EHFcol).filterDate(mid1date,mid2date);
var yearcol_3 = ee.ImageCollection(EHFcol).filterDate(mid2date,enddate);
//print(yearcol_3)
//EHFcol     = EHFcol.map(siloset);

var EHF_Dataset_1 = newmovenormal(silotempcol, yearcol_1);

//print(EHF_Dataset_1)

var EHF_Dataset_2 = newmovexcept(silotempcol, yearcol_2);

//print(EHF_Dataset_2)

var EHF_Dataset_3 = newmovenormal(silotempcol, yearcol_3);

//print(EHF_Dataset_3)

var EHF_Dataset   = EHF_Dataset_1.merge(EHF_Dataset_2).merge(EHF_Dataset_3);

print(EHF_Dataset)


var img_out = EHF_Dataset.toArray();

var ids = ee.List(EHF_Dataset.aggregate_array('date')).map(function(x) {return ee.String('EHF_').cat(ee.Date(x).format('YYYY_MM_dd'));});

img_out = img_out.arraySlice(1, -1).arrayProject([0]).arrayFlatten([ids]);//convert into image;

print(img_out)


function export_img(img, folder, task){
    Export.image.toAsset({
          image : img,
          description: task,
          assetId: folder.concat('/').concat(task), 
          region: geometry.bounds(),
          scale :5000,
          maxPixels: 1e13
    });
}

var outstr  = 'Merged_Tmin_'+ i.toString();
export_img(img_out, 'Aus_BoM_Tmin', outstr);
