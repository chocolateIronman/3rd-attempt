'use strict';

var { Pool } = require('pg');

var createError = require('../utils/error').createError;
var stall = require('../utils/stall').stall;

var thePool = null;
var theConfig = null;


const errors = {
  PARAMETER_ERROR:-1,
  DATABASE_ERROR:-2,
  INTERNAL_ERROR:-3
}

var initialise = function (url, needsSSL) {
    if (needsSSL == true) {
      url += "?sslmode=require"
    }
  
    if (thePool) {
      thePool.end();
    };
  
    theConfig = null;
  
    theConfig = {
      connectionString: url,
      ssl: needsSSL
    };
  
    thePool = new Pool(theConfig);
  };
  


  var test = async function(arg){

    await stall(500, createError(errors.PARAMETER_ERROR,"bad parameter!"));
    
  }

  var getIncidents=async function(sticker_uuid)
  {
      var result=null;
      
      var query="SELECT * FROM public.\"Incidents\" where public.\"Incidents\".\"QRid\"=$1;";
      var parameters = [sticker_uuid];
      try{
          var response=await thePool.query(query,parameters);
          result=response.rows;
      }catch(e){
          throw(createError(errors.PARAMETER_ERROR,e.message));
      }
      return result;
  }

  var getResponses=async function(sticker_uuid)
  {
      var result=null;
      
      var query="SELECT * FROM public.\"Response\" where public.\"Response\".\"id\"=$1;";
      var parameters = [sticker_uuid];
      try{
          var response=await thePool.query(query,parameters);
          result=response.rows;
      }catch(e){
          throw(createError(errors.PARAMETER_ERROR,e.message));
      }
      return result;
  }

  var postStickers=async function(body)
  {
      var result=[];
      var parameters=[true];
      
      for(var index=0;index<body.num_requested;index++)
      {var query = "INSERT INTO \"public\".\"Stickers\" (\"generated\") VALUES ($1) RETURNING \"QRid\",\"generated\";";
      try
      {
        var response=await thePool.query(query,parameters);
        var rows=response.rows;
        if(rows && rows.length>0)
        {
            result.push({id:rows[0].QRid});
        }
    }catch(e){
        throw(createError(errors.PARAMETER_ERROR,e.message));
    }}
    return result;


  }
  var postIncidents=async function(body)
  {
      var result=null;
      //var parameters=[date,postcode,lat,lon];

      var parameters=[body.sticker_uuid,body.date];
      
      var query = "INSERT INTO \"public\".\"Incidents\" (\"QRid\",\"date\") VALUES ($1,$2) RETURNING \"id\";";
      //var query = "INSERT INTO \"public\".\"Incidents\" (\"QRid\",\"date\",\"postcode\",\"lat\",\"lon\") VALUES ($1,$2,$3,$4,$5) RETURNING \"id\",\"QRid\",\"date\",\"postcode\",\"lat\",\"lon\";";
      try{
        var response=await thePool.query(query,parameters);
        result=response.rows;
    }catch(e){
        throw(createError(errors.PARAMETER_ERROR,e.message));
    }
    return result;


  }
  var postResponse=async function(body)
  {
    var result=null;
    console.log(body);
    var has_apologised= body.has_apologised;
    var sticker_uuid= body.sticker_uuid;
    var queryselect =0;
    var apologyPN=0;
    var apologyRec=false;
    var parameters;
    var query="";
    
    if (body.apologyRec!=null)
    {
        apologyRec=body.apologyRec;
        queryselect+=2;
    }
    if (body.apologyPN!=null)
    {
        apologyPN=body.apologyPN;
        queryselect+= 1;
    }

    switch(queryselect){
        case 0: //if only has_apologised and sticker_uuid are present
        var parameters=[has_apologised,sticker_uuid];
        var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\") VALUES ($2,$1) RETURNING \"id\",\"report\",\"apologyRec\",\"apologyPN\";";
        break;
        case 1: //if only has_apologised, sticker_uuid and apologyPN are present
        var parameters=[has_apologised,sticker_uuid,apologyPN];
        var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\",\"apologyPN\") VALUES ($2,$1,$3) RETURNING \"id\",\"report\",\"apologyRec\",\"apologyPN\";";
        break;
        case 2: //if only has_apologised, sticker_uuid and apologyPN are present
        var parameters=[has_apologised,sticker_uuid,apologyRec];
        var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\",\"apologyRec\") VALUES ($2,$1,$3) RETURNING \"id\",\"report\",\"apologyRec\",\"apologyPN\";";
        break;
        case 3: //if only has_apologised, sticker_uuid and apologyPN are present
        var parameters=[has_apologised,sticker_uuid,apologyRec,apologyPN];
        var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\",\"apologyRec\",\"apologyPN\") VALUES ($2,$1,$3,$4) RETURNING \"id\",\"report\",\"apologyRec\",\"apologyPN\";";
        break;
        default:
        break;

    }
/*     if ((apologyPN!=null)&&(apologyRec!=null))
    {
        parameters=[has_apologised,sticker_uuid,apologyPN,apologyRec];
        query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\") VALUES ($2,$1,$3,$4) RETURNING \"id\",\"report\";";
    }
    if ((apologyPN!=null)&&(apologyRec!=null))
    {
        parameters=[has_apologised,sticker_uuid,apologyPN,apologyRec];
        query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\") VALUES ($2,$1,$3,$4) RETURNING \"id\",\"report\";";
    } */
    //var btnPressed=false;
    //var btnPN=0;
    //      var parameters=[has_apologised,sticker_uuid];
    //var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\",\"apologyRec\",\"apologyPN\") VALUES ($1,$2,$3,$4) RETURNING \"id\",\"report\",\"apologyRec\",\"apologyPN\";";
    //      var query = "INSERT INTO \"public\".\"Response\" (\"id\",\"report\") VALUES ($2,$1) RETURNING \"id\",\"report\";";
    try{
        var response=await thePool.query(query,parameters);
        result=response.rows;
    }catch(e){
        throw(createError(errors.PARAMETER_ERROR,e.message));
    }
    return result;
  }

  module.exports={
      errors:errors,
      initialise:initialise,
      getIncidents:getIncidents,
      getResponses:getResponses,
      postStickers:postStickers,
      postIncidents:postIncidents,
      postResponse:postResponse
  };