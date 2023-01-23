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
db.addUser( 'u1', '#868686', 'j' );
db.addUser( 'u2', '#686868', 'k' );
db.addPost( 0, 0, [ 'recipe_instruction' ], 'hello world' );
db.addPost( 1, 0, [ 'recipe2_instruction', 'recipe2_instruction2' ], 'hello planet' );


test( 'GET index', async () => {
  // Send a GET request to /
  const res = await request( app )
    .get( '/' )
    // Check that the content type starts with text/html
    .expect( 'Content-Type', /^text\/html;?/ )
    // Check that the response status is OK
    .expect( 200 );

  const nonce = /'nonce-([^']+)'/.exec( res.headers[ 'content-security-policy' ] )[ 1 ];

  // Check that the response text is the index.html file
  expect( res.text ).toBe(
    ( await fs.readFile( './index.html', 'utf-8' ) )
      .replace( '#script-nonce#', nonce )
  );
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


test( 'POST /api/user', async () => {
  const expectedUser = {
    username: 'u3',
    colour:   '#aaaaff',
    glyph:    'l'
  };

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
    ...expectedUser
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

  // Send a PATCH request to /api/user
  const res = await request( app )
    .patch( `/api/user?id=${ user.id }` )
    // Update the username
    .send( { username: newUsername } )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res.body )
    .toMatchObject( { success: true, data: true } );
  // Check that the user matches the updated user
  expect( db.getUser( user.id ) )
    .toMatchObject( { ...user, username: newUsername } );
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


test( 'GET /api/post', async () => {
  // Get the latest post
  const [ post ] = getData( 'posts', { n: 1 } );

  // Send a GET request to /api/post
  const res = await request( app )
    .get( `/api/post?id=${ post.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful and that the data matches the newest users list
  expect( res.body ).toMatchObject( {
    success: true,
    data:    post
  } );
} );


test( 'POST /api/post', async () => {
  const [ user ] = getData( 'users', { n: 1 } );

  // Create a new post
  const newPost = {
    user:   user.id,
    recipe: [ 'instruction 1', 'instruction 2' ],
    body:   'body 1'
  };

  // Send a POST request to /api/post
  const res = await request( app )
    .post( '/api/post' )
    // Add the new post
    .send( newPost )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Get the new id from the response
  const { data: id } = res.body;
  // Check that the new post matches the expected user
  expect( db.getPost( id ) ).toMatchObject( {
    id,
    ...newPost
  } );

} );


test( 'PATCH /api/post', async () => {
  // Get the newest post
  const [ post ] = getData( 'posts', { n: 1 } );
  post.user = post.user.id;

  // Generate a new body
  const newBody = `${ post } (edited)`;

  // Send a PATCH request to /api/post
  const res = await request( app )
    .patch( `/api/post?id=${ post.id }` )
    // Update the body
    .send( { body: newBody } )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res.body )
    .toMatchObject( { success: true, data: true } );
  // Check that the post matches the updated post
  expect( db.getPost( post.id ) )
    .toMatchObject( { ...post, body: newBody } );
} );


test( 'DELETE /api/post', async () => {
  // Get the newest post
  const [ post ] = db.getPosts( 1, 0 );

  const res = await request( app )
    .delete( `/api/post?id=${ post.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res.body )
    .toMatchObject( { success: true, data: true } );
  // Check that the post no longer exists
  expect( db.existsPost( post.id ) ).toBe( false );
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


test( 'GET /api/searchUsers', async () => {
  // Create a new user
  const newUser = {
    username: 'abcdefghijkl',
    colour:   '#aaaaaa',
    glyph:    'g'
  };

  // Add the user to the database
  db.addUser(
    newUser.username,
    newUser.colour,
    newUser.glyph
  );

  // Send a GET request to /api/searchUsers with
  //  a similar username
  const res = await request( app )
    .get( '/api/searchUsers?query=cdefhij&n=1' )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check the search result matches the expected user
  expect( res.body )
    .toMatchObject( {
      success: true,
      data:    [ newUser ]
    } );
} );


test( 'GET /api/posts', async () => {
  // Send a GET request to /api/posts
  const res = await request( app )
    .get( '/api/posts' )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  expect( res.body )
    .toMatchObject( {
      success: true,
      data:    db.getPosts( 10, 0 )
    } );
} );


test( 'GET /api/searchPosts', async () => {
  // Get the newest user
  const [ user ] = db.getUsers( 1, 0 );

  // Create a new post
  const newPost = {
    user:      user,
    timestamp: 5,
    recipe:    [ 'instruction1', 'abcdefghijkl' ],
    body:      'body1'
  };

  // Add the post to the database
  db.addPost(
    newPost.user.id,
    newPost.timestamp,
    newPost.recipe,
    newPost.body
  );

  user.nPosts++;

  // Send a GET request to /api/searchUsers with
  //  a similar username
  const res = await request( app )
    .get( '/api/searchPosts?query=cdefhij&n=1' )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check the search result matches the expected user
  expect( res.body )
    .toMatchObject( {
      success: true,
      data:    [ newPost ]
    } );
} );


test( 'GET and POST /api/follow and GET /api/followingPosts', async () => {
  // Create two new users
  const newUser1 = {
    username: 'followUser1',
    colour:   '#111111',
    glyph:    'a'
  };
  newUser1.id = db.addUser(
    newUser1.username,
    newUser1.colour,
    newUser1.glyph
  );

  const newUser2 = {
    username: 'followUser2',
    colour:   '#222222',
    glyph:    'b'
  };
  newUser2.id = db.addUser(
    newUser2.username,
    newUser2.colour,
    newUser2.glyph
  );

  // Send a POST request to /api/follow
  const res1 = await request( app )
    .post( '/api/follow' )
    // Add the follow
    .send( { id: newUser1.id, follow: newUser2.id } )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res1.body )
    .toMatchObject( { success: true, data: true } );
  // Check that the follow has been added
  expect( db.existsUserFollow( newUser1.id, newUser2.id ) )
    .toBe( true );

  // Send a GET request to /api/follow
  const res2 = await request( app )
    .get( `/api/follow?id=${ newUser1.id }&follow=${ newUser2.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res2.body )
    .toMatchObject( { success: true, data: true } );

  // Create two new posts
  const newPost1 = {
    user:   newUser1.id,
    recipe: [ 'r1' ],
    body:   'b1'
  };
  newPost1.id = db.addPost( newPost1.user, 0, newPost1.recipe, newPost1.body );

  const newPost2 = {
    user:   newUser2.id,
    recipe: [ 'r2' ],
    body:   'b2'
  };
  newPost2.id = db.addPost( newPost2.user, 0, newPost2.recipe, newPost2.body );

  // Send the request to get user1's following posts
  const res3 = await request( app )
    .get( `/api/followingPosts?id=${ newUser1.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res3.body )
    .toMatchObject( { success: true, data: [ { ...newPost2, user: newUser2 } ] } );

  // Send the request to get user2's following posts
  const res4 = await request( app )
    .get( `/api/followingPosts?id=${ newUser2.id }` )
    // Check that the content type starts with application/json
    .expect( 'Content-Type', /^application\/json;?/ )
    // Check that the response status is OK
    .expect( 200 );

  // Check that the request was successful
  expect( res4.body )
    .toMatchObject( { success: true, data: [] } );
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
          message: 'No id or username parameter provided!'
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
