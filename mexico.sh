#!/bin/bash

mkdir -p build

# Download.
curl -z build/estados.zip -o build/estados.zip http://mapserver.inegi.org.mx/MGN/mge2010v5_0.zip
curl -z build/municipios.zip -o build/municipios.zip http://mapserver.inegi.org.mx/MGN/mgm2010v5_0.zip

# Decompress.
unzip -od build build/estados.zip
unzip -od build build/municipios.zip

# Reproject to WGS84.
ogr2ogr build/states.shp build/Entidades_2010_5.shp -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"
ogr2ogr build/municipalities.shp build/Municipios_2010_5.shp -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"

# shp2json - convert shapefiles to GeoJSON.
# ndjson-map - map property names and coerce numeric properties.
# geo2topo - convert GeoJSON to TopoJSON.
# toposimplify - simplify TopoJSON.
# topoquantize - quantize TopoJSON.
geo2topo -n \
  states=<(shp2json -n build/states.shp \
    | ndjson-map 'd.properties = {state_code: +d.properties.CVE_ENT, state_name: d.properties.NOM_ENT}, d') \
  municipalities=<(shp2json -n build/municipalities.shp \
    | ndjson-map 'd.properties = {state_code: +d.properties.CVE_ENT, mun_code: +d.properties.CVE_MUN, mun_name: d.properties.NOM_MUN}, d') \
  | toposimplify -s 1e-7 \
  | topoquantize 1e5 \
  > mx.json
