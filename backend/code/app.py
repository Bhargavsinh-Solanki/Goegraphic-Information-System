from flask import Flask, jsonify
from flask_cors import CORS
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import psycopg2
from psycopg2.extras import RealDictCursor
from numpy import sin, cos
from math import sqrt
from flask import request
import logging

app = Flask(__name__)
CORS(app)
query_Study_Name ="select distinct(study_name) from animals ;" 
query_animals="select * from animals limit 50 ; "

def generateKeyForIndividual(study,individual,type,epsilon=0):
    res=str(type).replace("#","")+"#"+str(study).replace("#","")+"#"+str(individual)+"#"+str(epsilon);
    return res
def getKey(study,type,epsilon=0):

    return str(type).replace("#","")+"#"+str(study).replace("#","")+"#"+str(epsilon);

def greatCircle(lat1,lon1,lat2,lon2,r=None,verbose=False):
    '''Compute the great circle distance on a sphere
    <lat1>, <lat2>: scalar float or nd-array, latitudes in degree for
                    location 1 and 2.
    <lon1>, <lon2>: scalar float or nd-array, longitudes in degree for
                    location 1 and 2.
    <r>: scalar float, spherical radius.
    Return <arc>: great circle distance on sphere.
    '''
    from numpy import sin, cos
    if r is None:
        r=6371000. #m
    d2r=lambda x:x*np.pi/180
    lat1,lon1,lat2,lon2=map(d2r,[lat1,lon1,lat2,lon2])
    dlon=abs(lon1-lon2)
    numerator=(cos(lat2)*sin(dlon))**2 + \
            (cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(dlon))**2
    numerator=np.sqrt(numerator)
    denominator=sin(lat1)*sin(lat2)+cos(lat1)*cos(lat2)*cos(dlon)
    dsigma=np.arctan2(numerator,denominator)
    arc=r*dsigma
    return arc
def getBearing(lat1,lon1,lat2,lon2):
    '''Compute bearing from point 1 to point2
    Args:
        lat1,lat2 (float or ndarray): scalar float or nd-array, latitudes in
            degree for location 1 and 2.
        lon1,lon2 (float or ndarray): scalar float or nd-array, longitudes in
            degree for location 1 and 2.
    Returns:
        theta (float or ndarray): (forward) bearing in degree.
    NOTE that the bearing from P1 to P2 is in general not the same as that
    from P2 to P1.
    '''
    from numpy import sin, cos
    d2r=lambda x:x*np.pi/180
    lat1,lon1,lat2,lon2=map(d2r,[lat1,lon1,lat2,lon2])
    dlon=lon2-lon1
    theta=np.arctan2(sin(dlon)*cos(lat2),
            cos(lat1)*sin(lat2)-sin(lat1)*cos(lat2)*cos(dlon))
    theta=theta/np.pi*180
    theta=(theta+360)%360
    return theta
def getCrossTrackDistance(lat1,lon1,lat2,lon2,lat3,lon3,r=None):
    '''Compute cross-track distance
    Args:
        lat1, lon1 (float): scalar float or nd-array, latitudes and longitudes in
                        degree, start point of the great circle.
        lat2, lon2 (float): scalar float or nd-array, latitudes and longitudes in
                        degree, end point of the great circle.
        lat3, lon3 (float): scalar float or nd-array, latitudes and longitudes in
                        degree, a point away from the great circle.
    Returns:
        dxt (float): great cicle distance between point P3 to the closest point
                  on great circle that connects P1 and P2.
                  NOTE that the sign of dxt tells which side of the 3rd point
                  P3 is on.
    See also getCrossTrackPoint(), getAlongTrackDistance().
    '''
    from numpy import sin
    if r is None:
        r=6371000.  #m
    # get angular distance between P1 and P3
    delta13=greatCircle(lat1,lon1,lat3,lon3,r=1.)
    # bearing between P1, P3
    theta13=getBearing(lat1,lon1,lat3,lon3)*np.pi/180
    # bearing between P1, P2
    theta12=getBearing(lat1,lon1,lat2,lon2)*np.pi/180
    dtheta=np.arcsin(sin(delta13)*sin(theta13-theta12))
    dxt=r*dtheta
    return dxt
def distanceGC(a,b):
    '''Great circle distance
    Args:
        a (tuple): (lat, lon) coordinates of point A.
        b (tuple): (lat, lon) coordinates of point B.
    Returns:
        result (float): great circle distance from A to B, on unit sphere.
    '''
    return greatCircle(a[0],a[1],b[0],b[1],r=1)
def point_line_distanceGC(point,start,end):
    '''Shortest distance between a point and a great circle curve on unit sphere
    Args:
        point (tuple): (lonQ, lat) coordinates of a point on unit sphere.
        start (tuple): (lon, lat) coordinates of the starting point of a curve
            on unit sphere.
        end (tuple): (lon, lat) coordinates of the end point of a curve
            on unit sphere.
    Returns:
        result (float): shortest distance from point to line.
    '''
    if (start == end):
        return distanceGC(point, start)/np.pi*180.
    else:
        dxt=getCrossTrackDistance(start[0],start[1],
                end[0],end[1],
                point[0],point[1],
                r=1)
        dxt=abs(dxt/np.pi*180)
        return dxt
def rdpGC(points, epsilon):
    '''Geodesic version of rdp.
    Args:
        points (list): list of (lon, lat) coordinates on unit sphere.
        epsilon (float): error threshold.
    Returns:
        results (list): a list of (lon, lat) coordinates of simplified curve.
    '''
    dmax = 0.0
    index = 0
    for i in range(1, len(points) - 1):
       
        d = point_line_distanceGC((points[i][2],points[i][3]), (points[0][2],points[0][3]), (points[-1][2],points[-1][3]))
        if d > dmax:
            index = i
            dmax = d
    if dmax >= epsilon:
        results = rdpGC(points[:index+1], epsilon)[:-1] + rdpGC(points[index:], epsilon)
    else:
        results=[points[0],points[-1]]
    return results

def checkFromDB(key):
    query= "select * from analysis_results where search_key='{0}'; ".format(key)
    geojsons=None
    with psycopg2.connect(dbname ="gis", user ="postgres",password = "5425981o") as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute( query)
            result = cursor.fetchone()
            if result :
                if result["result_value"] :
                    geojsons= result["result_value"]
                    print("KEY Found : "+key)
                else:
                    print("CALCULATION IS NEEDED FOR KEY : " +key)

            else:
                print("CALCULATION IS NEEDED FOR KEY : " +key)
                    
    return geojsons
def insertKeyValue(key,geojsons):
    queryToInject= "insert into analysis_results values ('{0}' , '{1}'); ".format(key,json.dumps(geojsons))
    with psycopg2.connect(dbname ="gis", user ="postgres",password = "5425981o") as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute( queryToInject)
            print("NEW KEY IS INSERTED : ",key)
            return True;
    return False;
                
@app.route('/getAnimalsWithLastLocation', methods=["POST"])
def getAnimalsWithLastLocation():
    input_json = request.get_json(force=True) 
    study_name= input_json["study_name"]
    df = pd.read_csv('../../data/'+study_name+".csv")
    
    res=df.dropna(subset=['lat', 'long']).sort_values('timestamp',ascending=False).groupby(['study_name', 'individual_local_identifier'])
    res=res.tail(1)
    res_arr=res.to_numpy()
    geojsons = []
    key=getKey(study_name,"Point")
    checkRes=checkFromDB(key)
    if checkRes :
        geojsons=checkRes
        return jsonify(geojsons), 200
    

    for result in res_arr:
        print(result)
# [3518789882 '2017-08-08 20:15:30.000' -7.06778 41.318558
#  'Tadarida teniotis' 20 'Bat3_3D6001852B978'
#  '3D flights of European free-tailed bats']
        key2=generateKeyForIndividual(study_name,result[6],"Point")

        geojsons.append({
                     "type": "Feature",
                            "id": key2,
                        "properties": {
                            "id":str(result[0]),
                            "name": key2,
                            "timestamp":str(result[1]),
                            "long":str(result[2]),
                            "lat":str(result[3]),
                            "study_name":input_json["study_name"],
                    "type": "Point",

                        },
                        "geometry": {
                    "type": "Point",
                    "coordinates": [result[2],result[3]]
                }        })
                
    insertKeyValue(key,geojsons)

    
    return jsonify(geojsons), 200

@app.route('/getAnimalsWithFirstLocation', methods=["POST"])
def getAnimalsWithFirstLocation():
    input_json = request.get_json(force=True) 
    study_name= input_json["study_name"]
    df = pd.read_csv('../../data/'+study_name+".csv")
    
    res=df.dropna(subset=['lat', 'long']).sort_values('timestamp',ascending=True).groupby(['study_name', 'individual_local_identifier'])
    res=res.tail(1)
    res_arr=res.to_numpy()
    geojsons = []
    key=getKey(study_name,"Start_Point")
    checkRes=checkFromDB(key)
    if checkRes :
        geojsons=checkRes
        return jsonify(geojsons), 200
    

    for result in res_arr:
        print(result)
# [3518789882 '2017-08-08 20:15:30.000' -7.06778 41.318558
#  'Tadarida teniotis' 20 'Bat3_3D6001852B978'
#  '3D flights of European free-tailed bats']
        key2=generateKeyForIndividual(study_name,result[6],"Start_Point")

        geojsons.append({
                     "type": "Feature",
                            "id": key2,
                        "properties": {
                            "id":str(result[0]),
                            "name": key2,
                            "timestamp":str(result[1]),
                            "long":str(result[2]),
                            "lat":str(result[3]),
                            "study_name":input_json["study_name"],
                    "type": "Start_Point",

                        },
                        "geometry": {
                    "type": "Point",
                    "coordinates": [result[2],result[3]]
                }        })
                
    insertKeyValue(key,geojsons)

    
    return jsonify(geojsons), 200

@app.route('/getAnimalsLifeTimeSimplifiedPaths', methods=["POST"])
def getAnimalsLifeTimeSimplifiedPaths():
    input_json = request.get_json(force=True) 
    study_name_sample=input_json["study_name"];
    all_Study_names=['3D flights of European free-tailed bats',
     'Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018',
      'Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest',
        'Black-backed jackal, Etosha National Park, Namibia',
         'Blue and fin whales Southern California 2014-2015 - Fastloc GPS data',
        #   'Caspian Gulls - Poland', 
          
          'Common Crane Lithuania GPS, 2016',
            'Fin whales Gulf of California 2001 - Argos data', 
            'Galapagos Albatrosses',
            #  'Long-tailed ducks GLS 2018',
             'Short-eared Owl, North America',
             'Migrations of Common Terns (Sterna hirundo)'
             ,'MPIAB White Stork Oriental Argos',
             'Peregrine Falcon, High Arctic Institute, northwest Greenland',
             'Pernis_apivorus_Byholm _Finland',
             'Red Kite MPI-AB Baden-Wuerttemberg'
             ]
    geojsons=[]
    print(study_name_sample)
    if study_name_sample in all_Study_names:
        
    # a multidict containing POST data
        epsilon=15
        if study_name_sample =='3D flights of European free-tailed bats':
                epsilon=0.015
        elif study_name_sample == 'Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018':
            epsilon=0.02
        elif study_name_sample == 'Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest':
            epsilon=0.21
        elif study_name_sample == 'Black-backed jackal, Etosha National Park, Namibia':
            epsilon=0.05
        elif study_name_sample == 'Blue and fin whales Southern California 2014-2015 - Fastloc GPS data':
            epsilon=0.05
        # elif study_name_sample == 'Caspian Gulls - Poland':          
            # epsilon=0.0
        elif study_name_sample == 'Common Crane Lithuania GPS, 2016':
            epsilon=0.5
        elif study_name_sample == 'Fin whales Gulf of California 2001 - Argos data':
            epsilon= 0.1
        elif study_name_sample == 'Galapagos Albatrosses':
            epsilon= 0.07
        # elif study_name_sample == 'Long-tailed ducks GLS 2018':
        #     epsilon=15
        elif study_name_sample == 'Short-eared Owl, North America':
                epsilon=7
        elif study_name_sample == 'Migrations of Common Terns (Sterna hirundo)':
            epsilon=10
        elif study_name_sample == 'MPIAB White Stork Oriental Argos':
            epsilon=3
        elif study_name_sample == 'Peregrine Falcon, High Arctic Institute, northwest Greenland':
            epsilon=2
        elif study_name_sample == 'Pernis_apivorus_Byholm _Finland':
            epsilon=19
        elif study_name_sample == 'Red Kite MPI-AB Baden-Wuerttemberg':
            epsilon=0.15

        else :
            epsilon=7


        key=getKey(study_name_sample,"Line",epsilon=epsilon)
        # key=str(study_name_sample)+"#"+str(epsilon);
        checkRes=checkFromDB(key)
        if checkRes :
            geojsons=checkRes
            return jsonify(geojsons), 200



        columns = (
   'search_key', 'result_value')
        result=None 
                
        df = pd.read_csv('../../data/'+study_name_sample+".csv",parse_dates=True)
        df['timestamp']= pd.to_datetime(df['timestamp'])
        res2=df.dropna(subset=['lat', 'long','timestamp']).sort_values('timestamp',ascending=False).groupby(['study_name', 'individual_local_identifier'])
       
#Long-tailed ducks GLS 2018.csv  Epsilon:20
#3D flights of European free-tailed bats.csv Epsilon:0.015
#Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018.csv Epsilon:0.02
#Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest.csv Epsilon:0.21
#Black-backed jackal, Etosha National Park, Namibia.csv Epsilon:0.05
#Blue and fin whales Southern California 2014-2015 - Fastloc GPS data Epsilon:0.05
#Caspian Gulls - Poland Epsilon: NA (should be <0.03 => data size  2200  )
#Common Crane Lithuania GPS, 2016 Epsilon: 0.5
#Fin whales Gulf of California 2001 - Argos data Epsilon: 0.1
#Galapagos Albatrosses Epsilon: 0.07
#Long-tailed ducks GLS 2018 Epsilon: 15
       
        
        for name, group in res2:
            key2=generateKeyForIndividual(name[0],name[1],"Line",epsilon)
            # checkResult=checkFromDB(key2)
            
            tuple_group=list(tuple(a.tolist()) for a in group.to_numpy())
            simplified_for_each_individual=rdpGC(tuple_group,epsilon);
            # mydict[name[0]+"#!#"+name[1] ]=simplified_for_each_individual;
            simplified_df = pd.DataFrame(simplified_for_each_individual, columns =list(df.columns))
            # simplified_df["location"]=(simplified_df["long"],simplified_df["lat"])
            simplified_array=simplified_df[["long","lat"]].to_numpy()

            geojsons.append(
                
                {
                     "type": "Feature",
                            "id": key2,
                        
                          "properties": {
                            "name": key2,
                            "study_name":input_json["study_name"],
                            "individual_local_identifier":str(name[1]),
                            "type":"Line"
                        },
                        "geometry": {
                    "type": "LineString",
                    "coordinates":simplified_array.tolist()
                }        }
                    )
        insertKeyValue(key,geojsons)
    return json.dumps(geojsons), 200

 
  
@app.route('/getStudyNames', methods=["GET"])
def getStudyNames():
    results=[
        {'name':'3D flights of European free-tailed bats','type':'Aerial'},
     {'name':'Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018','type':'Aerial'},
      {'name':'Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest','type':'Aerial'},
       {'name': 'Black-backed jackal, Etosha National Park, Namibia','type':'Terrestrial'},
         {'name':'Blue and fin whales Southern California 2014-2015 - Fastloc GPS data','type':'Aquatic'},
        #   {'name':'Caspian Gulls - Poland','type':'Aerial'}, 
          
         {'name': 'Common Crane Lithuania GPS, 2016','type':'Aerial'},
          {'name':  'Fin whales Gulf of California 2001 - Argos data','type':'Aquatic'}, 
           {'name': 'Galapagos Albatrosses','type':'Aerial'},
            # {'name': 'Long-tailed ducks GLS 2018','type':'Aquatic'},
            {"name": 'Short-eared Owl, North America',"type":"Aerial"} ,      
            {"name": 'Migrations of Common Terns (Sterna hirundo)', "type":"Aerial"} ,      
            {"name": 'MPIAB White Stork Oriental Argos', "type":"Aerial"} ,   
               {"name": 'Peregrine Falcon, High Arctic Institute, northwest Greenland',  "type":"Aerial"} ,
                    {"name": 'Pernis_apivorus_Byholm _Finland',
         "type":"Aerial"} ,      {"name": 'Red Kite MPI-AB Baden-Wuerttemberg',
         "type":"Aerial"} ,

            ]
  
    return jsonify(results), 200

