/**
 * @file Tests the server.js file (testing HTTP requests)
 * @author Tom Boddaert
 */


import fs from 'fs/promises';
import request from 'supertest';

import { getData } from '../api.js';
import db from '../db';
import { app } from '../server.js';


// Add some data to the test database
db.addUser( 'u1', '#868686', 'j', true );
db.addUser( 'u2', '#686868', 'k', false );
db.addPost( 0, 'recipe_string', 'hello world' );
db.addPost( 1, 'recipe_string2', 'hello planet' );


test( 'GET index', async () => {
  // Send a GET request to /
  const res = await request( app )
    .get( '/' )
    // Check that the content type starts with text/html
    .expect( 'Content-Type', /^text\/html;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the response text is the index.html file
  expect( res.text ).toBe( await fs.readFile( './index.html', 'utf-8' ) );
} );


test( 'GET /api/user', async () => {
  // Get the newest user
  const [ user ] = getData( 'users', {} );

  // Send a GET request to /api/user, with the newest user id
  const res = await request( app )
    .get( `/api/user?id=${ user.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful and that the data matches the user
  expect( res.body ).toMatchObject( {
    success: true,
    data:    user
  } );
} );


test( 'GET /api/users', async () => {
  // Send a GET request to /api/users
  const res = await request( app )
    .get( '/api/users' )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful and that the data matches the newest users list
  expect( res.body ).toMatchObject( {
    success: true,
    data:    getData( 'users', {} )
  } );
} );


test( 'POST /api/user', async () => {
  const expectedUser = { username: 'u3', colour: '#aaaaff', glyph: 'l', followingPublic: false };

  // Send a POST request to /api/user
  const res = await request( app )
    .post( '/api/user' )
    // Add the new user
    .send( expectedUser )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Get the new id from the response
  const { data: id } = res.body;
  // Check that the new user matches the expected user
  expect( db.getUser( id ) ).toMatchObject( {
    id,
    username: expectedUser.username,
    colour:   expectedUser.colour,
    glyph:    expectedUser.glyph
  } );
} );


test( 'PATCH /api/user', async () => {
  // Get the newest user
  const [ user ] = getData( 'users', { n: 1 } );

  // Generate a new username, guaranteed to be different
  const newUsername = ( () => {
    if ( user.username.length > 8 ) {
      return user.username.slice( 0, user.username.length - 1 );
    }
    return user.username + user.username;
  } )();

  // Send a PATCH request to /api/user, with the newest id
  const res = await request( app )
    .patch( `/api/user?id=${ user.id }` )
    // Update the username
    .send( { username: newUsername } )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res.body ).toMatchObject( { success: true, data: true } );
  // Check that the user matches the updated user
  expect( db.getUser( user.id ) ).toMatchObject( { ...user, username: newUsername } );
} );


test( 'DELETE /api/user', async () => {
  // Get the newest user
  const [ { id } ] = db.getUsers( 1, 0 );

  // Send a DELETE request to /api/user, with the latest user id
  const res = await request( app )
    .delete( `/api/user?id=${ id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res.body ).toMatchObject( { success: true, data: true } );
  // Check that the user has been deleted
  expect( db.existsUser( id ) ).toBe( false );
} );


// Tests that should error


test( 'GET /api/user, with invalid id', async () => {
  const promises = [];

  // Send a GET request to /api/user, with no user id
  promises.push(
    request( app )
      .get( '/api/user' )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'No id parameter provided!'
        } );
      } )
  );

  // Send a GET request to /api/user, with an empty user id
  promises.push(
    request( app )
      .get( '/api/user?id=' )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid id parameter provided!'
        } );
      } )
  );

  // Send a GET request to /api/user, with user id = 'a'
  promises.push(
    request( app )
      .get( '/api/user?id=a' )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid id parameter provided!'
        } );
      } )
  );

  // Send a GET request to /api/user, with user id = 'a'
  promises.push(
    request( app )
      .get( '/api/user?id=a' )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid id parameter provided!'
        } );
      } )
  );

  const nexId = ( () => {
    let id = 2;
    while ( db.existsUser( id ) )
      id++;
    return id;
  } )();

  // Send a GET request to /api/user, with user id = an unused id
  promises.push(
    request( app )
      .get( `/api/user?id=${ nexId }` )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: `User '${ nexId }' not found!`
        } );
      } )
  );

  // Wait for all checks to be completed
  await Promise.all( promises );
} );


test( 'GET /api/user, with invalid posts parameters', async () => {
  const promises = [];

  // Choose an existing id
  const userId = ( () => {
    for ( let id = 0; id < 10; id++ )
      if ( db.existsUser( id ) )
        return id;

    throw new Error( 'No users with id < 10 exist! This is a bug in the test!' );
  } )();

  // Send a GET request to /api/user, with posts = 'a'
  promises.push(
    request( app )
      .get( `/api/user?id=${ userId }&posts=a` )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid posts parameter provided!'
        } );
      } )
  );

  // Send a GET request to /api/user, with too many posts arguments
  promises.push(
    request( app )
      .get( `/api/user?id=${ userId }&posts=1,1,1` )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid posts parameter provided!'
        } );
      } )
  );

  // Wait for all checks to be completed
  await Promise.all( promises );
} );


test( 'GET /api/user, with invalid following parameters', async () => {
  const promises = [];

  // Choose an existing id
  const userId = ( () => {
    for ( let id = 0; id < 10; id++ )
      if ( db.existsUser( id ) )
        return id;

    throw new Error( 'No users with id < 10 exist! This is a bug in the test!' );
  } )();

  // Send a GET request to /api/user, with following = 'a'
  promises.push(
    request( app )
      .get( `/api/user?id=${ userId }&following=a` )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid following parameter provided!'
        } );
      } )
  );

  // Send a GET request to /api/user, with too many following arguments
  promises.push(
    request( app )
      .get( `/api/user?id=${ userId }&following=1,1,1` )
      .expect( 'Content-Type', /^application\/json;?/ )
      // Check that the response status is OK
      .expect( 200 )
      .then( res => {
        // Check that the response is the correct error
        expect( res.body ).toMatchObject( {
          success: false,
          message: 'Invalid following parameter provided!'
        } );
      } )
  );

  // Wait for all checks to be completed
  await Promise.all( promises );
} );
