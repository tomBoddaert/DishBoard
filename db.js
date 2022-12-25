/**
 * @file Manages the data.json file as a database.
 * @author Tom Boddaert
 */


// If this were actually for production, this file
//  would be replaced by one to communicate with
//  an actual database, rather than just using the
//  data.json file

import fs from 'fs';

// Testing data
let data = {
  users:      {},
  posts:      {},
  userIds:    [],
  postIds:    [],
  nextUserId: 0,
  nextPostId: 0
};


// Database methods


/** Stringify the database
 * @param { ...any } args
 * @returns { string }
 */
export function stringify( ...args ) {
  return JSON.stringify( data, ...args );
}


let onProductionDB = false;

/** Check if the production database is being used
 * @returns { boolean }
 */
export function usingProductionDB() {
  return onProductionDB;
}

/** Switches from the testing database to the production database
 * @throws
 */
export function useProductionDB() {
  if ( onProductionDB )
    return;

  onProductionDB = true;

  try {
    // Load the data from the file
    data = JSON.parse( fs.readFileSync( 'data.json', 'utf-8' ) );
  } catch ( e ) {
    if ( e.code === 'ENOENT' )
      data = JSON.parse( fs.readFileSync( 'data.json.template', 'utf-8' ) );
    else
      throw e;
  }


  // Exit code adapted from https://stackoverflow.com/a/14032965

  // Stop the program from closing instantly
  process.stdin.resume();

  // Save the data when the process is terminated or crashes
  // eslint-disable-next-line jsdoc/require-jsdoc
  function terminationHandler( signal, code ) {
    // Save the data to the file
    console.log( `Received ${ signal }, saving data...` );
    fs.writeFileSync( 'data.json', JSON.stringify( data ) );

    // Exit the process
    console.log( 'Exiting...' );
    process.exit( code );
  }

  // When Ctrl+C is pressed, run the termination handler
  process.on( 'SIGINT', signal => terminationHandler( signal, 0 ) );
  // When the process is terminated, run the termination handler
  process.on( 'SIGTERM', signal => terminationHandler( signal, 0 ) );
  // If the process errors, run the termination handler
  process.on( 'uncaughtException', () => terminationHandler( 'uncaughtException', 1 ) );

  // When the process is restarted by nodemon, run the termination handler
  //  (may not work on Windows)
  process.on( 'SIGUSR2', signal => terminationHandler( signal, 0 ) );


  // Save the data to the file every minute
  setInterval( () => {
    console.log( 'Saving data...' );
    fs.writeFileSync( 'data.json', JSON.stringify( data ) );
  }, 1000 * 60 );
}


// User methods


/** Check if a user exists
 * @param { number } id
 * @returns { boolean }
 */
export function existsUser( id ) {
  return id in data.users;
}

/** Check if a username is in use
 * @param { string } username
 * @returns { boolean }
 */
export function existsUsername( username ) {
  return Object.values( data.users )
    .some( user => user.username === username );
}

/** Check if a user is following another user
 * @param { number } id
 * @param { number } follow
 * @returns { boolean }
 */
export function existsUserFollow( id, follow ) {
  return data.users[ id ].following.includes( follow );
}


/** Filter a user to its exposed values, and copy
 * @param { object } user
 * @returns { object }
 */
const filterUser = (
  { id: userId, username, colour, glyph, posts, following, followingPublic }
) => (
  {
    id:     userId,
    username,
    colour,
    glyph,
    nPosts: posts.length,
    ...followingPublic
      ? {
        nFollowing: following.length
      }
      : {}
  }
);

/** Get a user
 * @param { number } id
 * @returns { object }
 */
export function getUser( id ) {
  return filterUser( data.users[ id ] );
}

/** Get a user by username
 * @param { string } username
 * @returns { object }
 */
export function getUserByUsername( username ) {
  return filterUser(
    Object.values( data.users )
      .find( user => user.username === username )
  );
}

/** Get a user's last n posts with an offset of o
 * @param { number } id
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getUserPosts( id, n, o ) {
  return data.users[ id ]?.posts.slice( o, o + n )
    .map( postId => getPost( postId ) );
}

/** Get the last n users the user followed with an offset of o
 * @param { number } id
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getUserFollowing( id, n, o ) {
  return data.users[ id ]?.following.slice( o, o + n )
    .map( followingId => getUser( followingId ) );
}

/** Get the user's following public setting
 * @param { number } id
 * @returns { boolean }
 */
export function getUserFollowingPublic( id ) {
  return data.users[ id ]?.followingPublic;
}

/** Get the last n users to sign up with an offset of o
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getUsers( n, o ) {
  return data.userIds.slice( o, o + n )
    .map( userId => getUser( userId ) );
}


/** Add a new user to the database
 * @param { string } username
 * @param { string } colour
 * @param { string } glyph
 * @param { boolean } followingPublic
 * @returns { number }
 */
export function addUser( username, colour, glyph, followingPublic ) {
  const id = data.nextUserId++;
  data.users[ id ] = {
    id,
    username,
    colour,
    glyph,
    posts:     [],
    following: [],
    followingPublic
  };

  data.userIds.unshift( id );

  return id;
}

/** Follow a user form another user
 * @param { number } id
 * @param { number } follow
 */
export function addUserFollow( id, follow ) {
  data.users[ id ].following.unshift( follow );
}


/** Delete a user from the database
 * @param { number } id
 */
export function deleteUser( id ) {
  const user = data.users[ id ];

  for ( const postId of [ ...user.posts ] )
    deletePost( postId );

  for ( const { id: followerId } of Object.values( data.users ).filter(
    follower => follower.following.includes( id )
  ) )
    deleteUserFollow( followerId, id );

  data.userIds.splice( data.userIds.indexOf( id ), 1 );
  delete data.users[ id ];
}

/** Unfollow a user from another user
 * @param { number } id
 * @param { number } followId
 */
export function deleteUserFollow( id, followId ) {
  const user = data.users[ id ];

  user.following.splice( user.following.indexOf( followId ), 1 );
}


/** Update a user's username
 * @param { number } id
 * @param { string } username
 */
export function updateUserUsername( id, username ) {
  const user = data.users[ id ];

  user.username = username;
}

/** Update a user's colour
 * @param { number } id
 * @param { string } colour
 */
export function updateUserColour( id, colour ) {
  const user = data.users[ id ];

  user.colour = colour;
}

/** Update a user's glyph
 * @param { number } id
 * @param { string } glyph
 */
export function updateUserGlyph( id, glyph ) {
  const user = data.users[ id ];

  user.glyph = glyph;
}

/** Update a user's following public setting
 * @param { number } id
 * @param { boolean } followingPublic
 */
export function updateUserFollowingPublic( id, followingPublic ) {
  const user = data.users[ id ];

  user.followingPublic = followingPublic;
}


// Post methods


/** Check if a post exists
 * @param { number } id
 * @returns { boolean }
 */
export function existsPost( id ) {
  return id in data.posts;
}


/** Filter a post to its exposed values, and copy
 * @param { object } post
 * @returns { object }
 */
const filterPost = post => ( {
  ...post,
  recipe: [ ...post.recipe ]
} );

/** Get a post
 * @param { number } id
 * @returns { object }
 */
export function getPost( id ) {
  return filterPost( data.posts[ id ] );
}

/** Get the last n posts with an offset of o
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getPosts( n, o ) {
  return data.postIds.slice( o, o + n )
    .map( postId => getPost( postId ) )
    .map( post => {
      return { ...filterPost( post ), user: getUser( post.user ) };
    } );
}


/** Add a new post to the database
 * @param { number } user
 * @param { number } timestamp
 * @param { string } recipe
 * @param { string } body
 * @returns { number }
 */
export function addPost( user, timestamp, recipe, body ) {
  const id = data.nextPostId++;
  data.posts[ id ] = {
    id,
    user,
    timestamp,
    recipe,
    body
  };

  data.users[ user ].posts.unshift( id );
  data.postIds.unshift( id );

  return id;
}


/** Delete a post from the database
 * @param { number } id
 */
export function deletePost( id ) {
  const post = data.posts[ id ];

  data.users[ post.user ].posts.splice( data.users[ post.user ].posts.indexOf( id ), 1 );
  data.postIds.splice( data.postIds.indexOf( id ), 1 );

  delete data.posts[ id ];
}


/** Update the post's recipe
 * @param { number } id
 * @param { string } recipe
 */
export function updatePostRecipe( id, recipe ) {
  const post = data.posts[ id ];

  post.recipe = recipe;
}

/** Update the post's body
 * @param { number } id
 * @param { string } body
 */
export function updatePostBody( id, body ) {
  const post = data.posts[ id ];

  post.body = body;
}


export default {
  stringify,
  usingProductionDB,
  useProductionDB,

  existsUser,
  existsUsername,
  existsUserFollow,
  getUser,
  getUserByUsername,
  getUserPosts,
  getUserFollowing,
  getUserFollowingPublic,
  getUsers,
  addUser,
  addUserFollow,
  deleteUser,
  deleteUserFollow,
  updateUserUsername,
  updateUserColour,
  updateUserGlyph,
  updateUserFollowingPublic,

  existsPost,
  getPost,
  getPosts,
  addPost,
  deletePost,
  updatePostRecipe,
  updatePostBody
};
