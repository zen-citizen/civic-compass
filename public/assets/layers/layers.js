ol.proj.proj4.register(proj4);
//ol.proj.get("EPSG:3857").setExtent([8600216.557842, 1428746.551873, 8673286.709245, 1482178.303073]);
var wms_layers = [];

var format__0 = new ol.format.GeoJSON();
var features__0 = format__0.readFeatures(json__0, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__0 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__0.addFeatures(features__0);
var lyr__0 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__0, 
                style: style__0,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_0.png" /> '
            });
var format_OtherInformation_1 = new ol.format.GeoJSON();
var features_OtherInformation_1 = format_OtherInformation_1.readFeatures(json_OtherInformation_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_OtherInformation_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_OtherInformation_1.addFeatures(features_OtherInformation_1);
var lyr_OtherInformation_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_OtherInformation_1, 
                style: style_OtherInformation_1,
                popuplayertitle: "Other Information",
                interactive: true,
                title: '<img src="styles/legend/OtherInformation_1.png" /> Other Information'
            });
var format__2 = new ol.format.GeoJSON();
var features__2 = format__2.readFeatures(json__2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__2.addFeatures(features__2);
var lyr__2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__2, 
                style: style__2,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_2.png" /> '
            });
var format_Constituencies_3 = new ol.format.GeoJSON();
var features_Constituencies_3 = format_Constituencies_3.readFeatures(json_Constituencies_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Constituencies_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Constituencies_3.addFeatures(features_Constituencies_3);
var lyr_Constituencies_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Constituencies_3, 
                style: style_Constituencies_3,
                popuplayertitle: "Constituencies",
                interactive: true,
                title: '<img src="styles/legend/Constituencies_3.png" /> Constituencies'
            });
var format__4 = new ol.format.GeoJSON();
var features__4 = format__4.readFeatures(json__4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__4.addFeatures(features__4);
var lyr__4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__4, 
                style: style__4,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_4.png" /> '
            });
var format_PoliceJurisdiction_5 = new ol.format.GeoJSON();
var features_PoliceJurisdiction_5 = format_PoliceJurisdiction_5.readFeatures(json_PoliceJurisdiction_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PoliceJurisdiction_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PoliceJurisdiction_5.addFeatures(features_PoliceJurisdiction_5);
var lyr_PoliceJurisdiction_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PoliceJurisdiction_5, 
                style: style_PoliceJurisdiction_5,
                popuplayertitle: "Police Jurisdiction",
                interactive: true,
                title: '<img src="styles/legend/PoliceJurisdiction_5.png" /> Police Jurisdiction'
            });
var format_RevenueOffices_6 = new ol.format.GeoJSON();
var features_RevenueOffices_6 = format_RevenueOffices_6.readFeatures(json_RevenueOffices_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_RevenueOffices_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_RevenueOffices_6.addFeatures(features_RevenueOffices_6);
var lyr_RevenueOffices_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_RevenueOffices_6, 
                style: style_RevenueOffices_6,
                popuplayertitle: "Revenue Offices",
                interactive: true,
                title: '<img src="styles/legend/RevenueOffices_6.png" /> Revenue Offices'
            });
var format__7 = new ol.format.GeoJSON();
var features__7 = format__7.readFeatures(json__7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__7.addFeatures(features__7);
var lyr__7 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__7, 
                style: style__7,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_7.png" /> '
            });
var format__8 = new ol.format.GeoJSON();
var features__8 = format__8.readFeatures(json__8, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__8 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__8.addFeatures(features__8);
var lyr__8 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__8, 
                style: style__8,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_8.png" /> '
            });
var format__9 = new ol.format.GeoJSON();
var features__9 = format__9.readFeatures(json__9, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource__9 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource__9.addFeatures(features__9);
var lyr__9 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource__9, 
                style: style__9,
                popuplayertitle: "",
                interactive: true,
                title: '<img src="styles/legend/_9.png" /> '
            });
var format_RevenueClassification_10 = new ol.format.GeoJSON();
var features_RevenueClassification_10 = format_RevenueClassification_10.readFeatures(json_RevenueClassification_10, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_RevenueClassification_10 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_RevenueClassification_10.addFeatures(features_RevenueClassification_10);
var lyr_RevenueClassification_10 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_RevenueClassification_10, 
                style: style_RevenueClassification_10,
                popuplayertitle: "Revenue Classification",
                interactive: true,
                title: '<img src="styles/legend/RevenueClassification_10.png" /> Revenue Classification'
            });
var format_BBMPInformation_11 = new ol.format.GeoJSON();
var features_BBMPInformation_11 = format_BBMPInformation_11.readFeatures(json_BBMPInformation_11, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_BBMPInformation_11 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_BBMPInformation_11.addFeatures(features_BBMPInformation_11);
var lyr_BBMPInformation_11 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_BBMPInformation_11, 
                style: style_BBMPInformation_11,
                popuplayertitle: "BBMP Information",
                interactive: true,
                title: '<img src="styles/legend/BBMPInformation_11.png" /> BBMP Information'
            });

        var lyr_OSMStandard_12 = new ol.layer.Tile({
            'title': 'OSM Standard',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' &middot; <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, CC-BY-SA</a>',
                url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });
var group_BangaloreOSM = new ol.layer.Group({
                                layers: [lyr_OSMStandard_12,],
                                fold: "open",
                                title: "Bangalore OSM"});
var group_BBMPWards = new ol.layer.Group({
                                layers: [lyr_BBMPInformation_11,],
                                fold: "open",
                                title: "BBMP Wards"});
var group_BLRVillageNames = new ol.layer.Group({
                                layers: [lyr_RevenueClassification_10,],
                                fold: "open",
                                title: "BLR - Village Names"});
var group_BLRHobli = new ol.layer.Group({
                                layers: [lyr__9,],
                                fold: "open",
                                title: "BLR - Hobli"});
var group_BLRTaluks = new ol.layer.Group({
                                layers: [lyr__8,],
                                fold: "open",
                                title: "BLR - Taluks"});
var group_GramaPanchayat = new ol.layer.Group({
                                layers: [lyr__7,],
                                fold: "open",
                                title: "Grama Panchayat"});
var group_RevenueOfficesInformation = new ol.layer.Group({
                                layers: [lyr_RevenueOffices_6,],
                                fold: "open",
                                title: "Revenue Offices Information"});
var group_PoliceStationLimits = new ol.layer.Group({
                                layers: [lyr_PoliceJurisdiction_5,],
                                fold: "open",
                                title: "Police Station Limits"});
var group_BLRTrafficPolice = new ol.layer.Group({
                                layers: [lyr__4,],
                                fold: "open",
                                title: "BLR Traffic Police"});
var group_Assembly = new ol.layer.Group({
                                layers: [lyr_Constituencies_3,],
                                fold: "open",
                                title: "Assembly"});
var group_Parliament = new ol.layer.Group({
                                layers: [lyr__2,],
                                fold: "open",
                                title: "Parliament"});
var group_BLRPincode = new ol.layer.Group({
                                layers: [lyr_OtherInformation_1,],
                                fold: "open",
                                title: "BLR - Pincode"});
var group_District = new ol.layer.Group({
                                layers: [lyr__0,],
                                fold: "open",
                                title: "District"});

lyr__0.setVisible(true);lyr_OtherInformation_1.setVisible(true);lyr__2.setVisible(true);lyr_Constituencies_3.setVisible(true);lyr__4.setVisible(true);lyr_PoliceJurisdiction_5.setVisible(true);lyr_RevenueOffices_6.setVisible(true);lyr__7.setVisible(true);lyr__8.setVisible(true);lyr__9.setVisible(true);lyr_RevenueClassification_10.setVisible(true);lyr_BBMPInformation_11.setVisible(true);lyr_OSMStandard_12.setVisible(true);
var layersList = [group_District,group_BLRPincode,group_Parliament,group_Assembly,group_BLRTrafficPolice,group_PoliceStationLimits,group_RevenueOfficesInformation,group_GramaPanchayat,group_BLRTaluks,group_BLRHobli,group_BLRVillageNames,group_BBMPWards,group_BangaloreOSM];
lyr__0.set('fieldAliases', {'Name': ' District', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr_OtherInformation_1.set('fieldAliases', {'Name': 'Name', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'full_id': 'full_id', 'osm_id': 'osm_id', 'osm_type': 'osm_type', 'boundary': 'boundary', 'name:kn': 'name:kn', 'type': 'type', 'postal_code': 'Pincode', });
lyr__2.set('fieldAliases', {'Name': 'Parliament', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr_Constituencies_3.set('fieldAliases', {'Name': ' Assembly', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr__4.set('fieldAliases', {'Name': 'Traffic Station', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'OBJECTID_12': 'OBJECTID_12', 'KGISPS_BOUNDID': 'KGISPS_BOUNDID', 'PS_BOUNDName': 'Police Station Limit', 'PS_BOUNDCode': 'PS_BOUNDCode', 'KGISPS_SUB_DIV_BOUNDID': 'KGISPS_SUB_DIV_BOUNDID', 'Date': 'Date', 'Traffic_PS': 'Traffic Station', 'Shape.STArea()': 'Shape.STArea()', 'Shape.STLength()': 'Shape.STLength()', });
lyr_PoliceJurisdiction_5.set('fieldAliases', {'Name': ' Police Station', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'OBJECTID': 'OBJECTID', 'KGISPS_BOUNDID': 'KGISPS_BOUNDID', 'PS_BOUNDName': 'PS_BOUNDName', 'PS_BOUNDCode': 'PS_BOUNDCode', 'KGISPS_SUB_DIVID': 'KGISPS_SUB_DIVID', 'Shape.STArea()': 'Shape.STArea()', 'Shape.STLength()': 'Shape.STLength()', });
lyr_RevenueOffices_6.set('fieldAliases', {'Name': 'Name', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'SRO_Code': 'SRO_Code', 'DRO_Code': 'DRO_Code', 'DRO_Name': 'DRO', 'SRO_Name': 'SRO', 'SRO_Name_Kannada': 'SRO_Name_Kannada', 'SRO_Short_Name': 'SRO_Short_Name', 'SRO_Short_Name_Kannada': 'SRO_Short_Name_Kannada', 'Shape.STArea()': 'Shape.STArea()', 'Shape.STLength()': 'Shape.STLength()', 'OBJECTID_1': 'OBJECTID_1', });
lyr__7.set('fieldAliases', {'Name': ' Grama Panchayat', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr__8.set('fieldAliases', {'Name': ' Taluk', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr__9.set('fieldAliases', {'Name': ' Hobli', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr_RevenueClassification_10.set('fieldAliases', {'Name': ' Village', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'snippet': 'snippet', });
lyr_BBMPInformation_11.set('fieldAliases', {'Name': 'Ward Number', 'description': 'description', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMode': 'altitudeMode', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'Ward Name': 'Ward Name', 'Subdivision': 'Subdivision', 'Division': 'Division', 'Zone': 'Zone', 'Assembly__MLA__Constituency_': 'Assembly__MLA__Constituency_', 'Parliament__MP__Constituency': 'Parliament__MP__Constituency', });
lyr__0.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr_OtherInformation_1.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'full_id': 'TextEdit', 'osm_id': 'TextEdit', 'osm_type': 'TextEdit', 'boundary': 'TextEdit', 'name:kn': 'TextEdit', 'type': 'TextEdit', 'postal_code': 'TextEdit', });
lyr__2.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr_Constituencies_3.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr__4.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'OBJECTID_12': 'TextEdit', 'KGISPS_BOUNDID': 'TextEdit', 'PS_BOUNDName': 'TextEdit', 'PS_BOUNDCode': 'TextEdit', 'KGISPS_SUB_DIV_BOUNDID': 'TextEdit', 'Date': 'TextEdit', 'Traffic_PS': 'TextEdit', 'Shape.STArea()': 'TextEdit', 'Shape.STLength()': 'TextEdit', });
lyr_PoliceJurisdiction_5.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'OBJECTID': 'Range', 'KGISPS_BOUNDID': 'Range', 'PS_BOUNDName': 'TextEdit', 'PS_BOUNDCode': 'TextEdit', 'KGISPS_SUB_DIVID': 'Range', 'Shape.STArea()': 'TextEdit', 'Shape.STLength()': 'TextEdit', });
lyr_RevenueOffices_6.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'SRO_Code': 'Range', 'DRO_Code': 'Range', 'DRO_Name': 'TextEdit', 'SRO_Name': 'TextEdit', 'SRO_Name_Kannada': 'TextEdit', 'SRO_Short_Name': 'TextEdit', 'SRO_Short_Name_Kannada': 'TextEdit', 'Shape.STArea()': 'TextEdit', 'Shape.STLength()': 'TextEdit', 'OBJECTID_1': 'Range', });
lyr__7.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr__8.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr__9.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr_RevenueClassification_10.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'snippet': 'TextEdit', });
lyr_BBMPInformation_11.set('fieldImages', {'Name': 'TextEdit', 'description': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMode': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', 'Ward Name': 'TextEdit', 'Subdivision': 'TextEdit', 'Division': 'TextEdit', 'Zone': 'TextEdit', 'Assembly__MLA__Constituency_': 'TextEdit', 'Parliament__MP__Constituency': 'TextEdit', });
lyr__0.set('fieldLabels', {'Name': 'inline label - always visible', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr_OtherInformation_1.set('fieldLabels', {'Name': 'hidden field', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'full_id': 'hidden field', 'osm_id': 'hidden field', 'osm_type': 'hidden field', 'boundary': 'hidden field', 'name:kn': 'hidden field', 'type': 'hidden field', 'postal_code': 'inline label - visible with data', });
lyr__2.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr_Constituencies_3.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr__4.set('fieldLabels', {'Name': 'hidden field', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'OBJECTID_12': 'hidden field', 'KGISPS_BOUNDID': 'hidden field', 'PS_BOUNDName': 'hidden field', 'PS_BOUNDCode': 'hidden field', 'KGISPS_SUB_DIV_BOUNDID': 'hidden field', 'Date': 'hidden field', 'Traffic_PS': 'inline label - always visible', 'Shape.STArea()': 'hidden field', 'Shape.STLength()': 'hidden field', });
lyr_PoliceJurisdiction_5.set('fieldLabels', {'Name': 'inline label - always visible', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'OBJECTID': 'hidden field', 'KGISPS_BOUNDID': 'hidden field', 'PS_BOUNDName': 'hidden field', 'PS_BOUNDCode': 'hidden field', 'KGISPS_SUB_DIVID': 'hidden field', 'Shape.STArea()': 'hidden field', 'Shape.STLength()': 'hidden field', });
lyr_RevenueOffices_6.set('fieldLabels', {'Name': 'hidden field', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'inline label - visible with data', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'SRO_Code': 'hidden field', 'DRO_Code': 'hidden field', 'DRO_Name': 'inline label - always visible', 'SRO_Name': 'inline label - always visible', 'SRO_Name_Kannada': 'hidden field', 'SRO_Short_Name': 'hidden field', 'SRO_Short_Name_Kannada': 'hidden field', 'Shape.STArea()': 'hidden field', 'Shape.STLength()': 'hidden field', 'OBJECTID_1': 'hidden field', });
lyr__7.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr__8.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr__9.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr_RevenueClassification_10.set('fieldLabels', {'Name': 'inline label - visible with data', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'snippet': 'hidden field', });
lyr_BBMPInformation_11.set('fieldLabels', {'Name': 'inline label - always visible', 'description': 'hidden field', 'timestamp': 'hidden field', 'begin': 'hidden field', 'end': 'hidden field', 'altitudeMode': 'hidden field', 'tessellate': 'hidden field', 'extrude': 'hidden field', 'visibility': 'hidden field', 'drawOrder': 'hidden field', 'icon': 'hidden field', 'Ward Name': 'inline label - always visible', 'Subdivision': 'inline label - always visible', 'Division': 'inline label - always visible', 'Zone': 'inline label - always visible', 'Assembly__MLA__Constituency_': 'hidden field', 'Parliament__MP__Constituency': 'hidden field', });
lyr_BBMPInformation_11.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});