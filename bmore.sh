#!/bin/bash -x

mkdir -p build

# Download.
curl -z build/estados.zip -o build/estados.zip http://mapserver.inegi.org.mx/MGN/mge2010v5_0.zip
curl -z build/municipios.zip -o build/municipios.zip http://mapserver.inegi.org.mx/MGN/mgm2010v5_0.zip

# Decompress.
unzip -od build build/estados.zip
unzip -od build build/municipios.zip

# Compute the scale and translate for 960×600 inset by 10px.
TRANSFORM=$(shp2json build/Entidades_2010_5.shp \
  | ndjson-map -r d3=d3-geo 'p = d3.geoIdentity().reflectY(true).fitExtent([[10, 10], [960 - 10, 600 - 10]], d), "d3.geoIdentity().reflectY(true).scale(" + p.scale() + ").translate([" + p.translate() + "])"' \
  | tr -d '"')

# shp2json - convert shapefiles to GeoJSON.
# ndjson-map - map property names and coerce numeric properties.
# geoproject - scale and translate to fit in 960×500.
# geo2topo - convert GeoJSON to TopoJSON.
# toposimplify - simplify TopoJSON.
# topoquantize - quantize TopoJSON.
geo2topo -n \
  states=<(shp2json -n build/Entidades_2010_5.shp \
    | ndjson-map 'd.properties = {state_code: +d.properties.CVE_ENT, state_name: d.properties.NOM_ENT}, d' \
    | geoproject -n ${TRANSFORM}) \
  municipalities=<(shp2json -n build/Municipios_2010_5.shp \
    | ndjson-map 'd.properties = {state_code: +d.properties.CVE_ENT, mun_code: +d.properties.CVE_MUN, mun_name: d.properties.NOM_MUN}, d' \
    | geoproject -n ${TRANSFORM}) \
  | toposimplify -p 1 \
  | topoquantize 1e5 \
  > mx.json
