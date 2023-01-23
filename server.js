/**
 * @file Manages the HTTP server
 * @author Tom Boddaert
 */


/** The lifetime of the browser cache for the resources directory, in ms */
const STATIC_CACHE_LIFETIME = 86_400_000;


import fs from 'fs/promises';
import express from 'express';
import compression from 'compression';
import { randomBytes } from 'crypto';

import { APIError, getData, addData, deleteData, updateData } from './api.js';

/** Run the function and catch API errors,
 * and transform them into a response
 * @param { Function } call
 * @param { ...any } args
 * @returns { Array< Object< string, any > | number | undefined > }
 */
function createAPIResult( call, ...args ) {
  try {
    return [ { success: true, data: call( ...args ) }, undefined ];
  } catch ( e ) {
    let result, status;
    if ( e instanceof APIError ) {
      // Bad request
      result = { success: false, message: e.message };

      // Copy the HTTP status from the error
      status = e.status;
    } else {
      // Server error
      result = { success: false, message: 'Internal error!' };
      console.error( e );
    }

    return [ result, status ];
  }
}

/** Send a result as a response
 * @param { Response } res
 * @param { Function } call
 * @param { ...any } args
 */
function sendAPIResult( res, call, ...args ) {
  const [ result, status ] = createAPIResult( call, ...args );

  if ( status !== undefined )
    res.status( status );

  res.json( result );
}

// Create the app
export const app = express();

// Enable compression
app.use( compression() );

// Parse the body as json
app.use( express.json() );

// Serve the static resources
app.use( '/resources', express.static( './resources', { maxage: STATIC_CACHE_LIFETIME } ) );

// Serve the web page
app.get( '/', async ( req, res ) => {
  // Get the index page from the file
  const nonce = randomBytes( 32 ).toString( 'base64' );
  const page = ( await fs.readFile( './index.html', 'utf-8' ) )
    .replace( '#script-nonce#', nonce );

  // Set the CSP to only load scripts and object from self
  res.set(
    'Content-Security-Policy',
    `base-uri 'self'; script-src 'self' 'nonce-${ nonce }' 'unsafe-inline'; object-src 'self'`
  );
  res.set( 'Cache-control', `public, max-age=${ STATIC_CACHE_LIFETIME }` );
  res.contentType( 'text/html' );
  res.end( page );
} );

// Define the GET method for the API
app.get( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;

  sendAPIResult( res, getData, type, req.query );
} );

// Define the POST method for the API
app.post( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;

  sendAPIResult( res, addData, type, req.body );
} );

// Define the DELETE method for the API
app.delete( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;

  sendAPIResult( res, deleteData, type, req.query );
} );

// Define the PATCH method for the API
app.patch( '/api/:type', ( req, res ) => {
  // Get the object of the request
  const { type } = req.params;

  sendAPIResult( res, updateData, type, req.query, req.body );
} );
