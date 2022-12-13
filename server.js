import fs from 'fs/promises';
import express from 'express';

import { useProductionDB } from './db.js';
import { APIError, getData, addData, deleteData, patchData } from './api.js';

// Create the app
export const app = express();

// Parse the body as json
app.use( express.json() );

// Serve the static resources
app.use( '/resources', express.static( './resources' ) );

// Serve the web page
app.get( '/', async ( req, res ) => {
  // Get the index page from the file
  const page = await fs.readFile( './index.html', 'utf-8' );

  res.contentType( 'text/html' );
  res.end( page );
} );

// Add the GET method to the API
app.get( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;
  let result;

  try {
    // Get the data from the database and wrap it
    result = { success: true, data: getData( type, req.query ) };
  } catch ( e ) {
    if ( e instanceof APIError ) {
      // Bad request
      result = { success: false, message: e.message };

      // If the HTTP status was set in the error, add it to the request
      if ( e.status !== undefined )
        res.status( e.status );
    } else {
      // Server error
      result = { status: 'error', message: 'Internal error!' };
      console.error( e );
    }
  }

  res.contentType( 'application/json' );
  res.json( result );
} );

// Add the POST method to the API
app.post( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;
  let result;

  try {
    // Add the data to the database and wrap the response
    result = { success: true, data: addData( type, req.body ) };
  } catch ( e ) {
    if ( e instanceof APIError ) {
      // Bad request
      result = { success: false, message: e.message };

      // If the HTTP status was set in the error, add it to the request
      if ( e.status !== undefined )
        res.status( e.status );
    } else {
      // Server error
      result = { status: 'error', message: 'Internal error!' };
      console.error( e );
    }
  }

  res.contentType( 'application/json' );
  res.json( result );
} );

// Add the DELETE method to the API
app.delete( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;
  let result;

  try {
    // Delete the data from the database and wrap the response
    result = { success: true, data: deleteData( type, req.query ) };
  } catch ( e ) {
    if ( e instanceof APIError ) {
      // Bad request
      result = { success: false, message: e.message };

      // If the HTTP status was set in the error, add it to the request
      if ( e.status !== undefined )
        res.status( e.status );
    } else {
      // Server error
      result = { status: 'error', message: 'Internal error!' };
      console.error( e );
    }
  }

  res.contentType( 'application/json' );
  res.json( result );
} );

// Add the PATCH method to the API
app.patch( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;
  let result;

  try {
    // Patch the data with the database and wrap the response
    result = { success: true, data: patchData( type, req.body ) };
  } catch ( e ) {
    if ( e instanceof APIError ) {
      // Bad request
      result = { success: false, message: e.message };

      // If the HTTP status was set in the error, add it to the request
      if ( e.status !== undefined )
        res.status( e.status );
    }
  }

  res.contentType( 'application/json' );
  res.json( result );
} );


// Switch to the production database
useProductionDB();

// Listen for requests
app.listen( 8080, () => console.log( 'Listening on http://localhost:8080/' ) );
