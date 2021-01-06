# Heat wave tracker: a multi-method, multi-source heat wave measurement toolkit based on Google Earth Engine

## Modeling framework

A multi-characteristic heat wave framework is used to estimate historical and future projected heat waves across Australia. A Google Earth Engine-based toolkit named heat wave tracker (HWT) is developed, which can be used for dynamic visualization, extraction, and processing of complex heat wave events.

**Table 1.** Long-term climate data for heat wave measurement.

| Name     | Spatial Resolution                                          | Time period | 
| -------- | ----------------------------------------------------------- | ----------|
| SILO     | 0.05*0.05                                                   | 1920-2020 |
| ERA5     | 0.25*025                                                    | 1979-2020 |
| CPC      | 0.5*0.5                                                     | 1979-2020 |
| CMIP5    | 0.25*0.25                                                   | 1950-2099 |

Click the following links to get the access. The corresponding links are:
*  SLIO: https://www.eodatascience.com/
*  CPC: https://psl.noaa.gov/data/gridded/data.cpc.globaltemp.html
*  ERA5: https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_DAILY
*  CMIP5:https://developers.google.com/earth-engine/datasets/catalog/NASA_NEX-GDDP

**Figure 1.** The model UI, and toolkit link: https://tensorflow.users.earthengine.app/view/heat-wave-tracker
![](fig/HWT.png)

## Updates

* 2021-01-06

## Known issues
*   CPC data missing 2005

