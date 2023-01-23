/**
 * @file Manages the data.json file as a database.
 * @author Tom Boddaert
 */


// If this were actually for production, this file
//  would be replaced by one to communicate with
//  an actual database, rather than just using the
//  data.json file


import fs from 'fs';


// Constants


/** The lifetime of the caches in ms */
const CACHE_LIFETIME = 15_000;


// Data


// Empty data
let data = {
  users:      {},
  posts:      {},
  userIds:    [],
  postIds:    [],
  nextUserId: 0,
  nextPostId: 0
};


// Algorithms


/** I couldn't get a similarity algorithm working properly
 * so, this is my own algorithm. It scales really badly.
 * This file is supposed to be replaced in production, use
 * a searching algorithm in the replacement database to do
 * this.
 * @param { string } s1
 * @param { string } s2
 * @returns { number }
 */
function badSimilarityAlgorithm( s1, s2 ) {
  // Convert the strings to a consistent case
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  // Make the shortest string s2
  if ( s1.length < s2.length )
    [ s2, s1 ] = [ s1, s2 ];

  // Enumerate s1 (not an enum)
  const s1Entries = Object.entries( s1 );

  // For each character in s2
  return [ ...s2 ].map( ( kc, k ) => s1Entries
    // Filter by same characters
    .filter( ( [ , a ] ) => a === kc )
    .map( ( [ i ] ) => {
      // Very important line of code that fixes a bug that took me about an hour
      //  to find because I don't like JS and forgot that all keys (even in arrays)
      //  are represented as strings because that was a sensible idea /s
      // Fix: https://rustup.rs/

      // Basically, I was trying to add a number to a key but JS coerced it
      //  into a string so the index was wrong (e.g. '5' + 0 = '50').
      //  TypeScript would have caught this.
      i = parseInt( i );
      let score = 0;

      // Starting at the point of the matching character,
      //  compare the subsequent characters
      for ( let j = 0; j < s2.length - k; j++ ) {
        const s1c = s1[ i + j ];
        const s2c = s2[ k + j ];

        // If either s1c or s2c are undefined, stop
        if ( s1c === undefined || s2c === undefined )
          break;

        if ( s1c === s2c )
        // If this character matches, add the length to the total
          score += j + 1;
        else
        // If it doesn't match, stop
          break;
      }

      return score;
    } )
    .reduce( ( prev, curr ) => curr > prev ? curr : prev, 0 ) )
    .reduce( ( prev, curr ) => curr > prev ? curr : prev, 0 );

  // This function is kind of just a glorified find now but it
  //  used to do more, which is why it's so complicated for what
  //  it does. It still works though.
}


// Database methods


/** Stringify the database
 * This function should only give data on the current state
 * of the database if an actual database is used, rather than
 * converting the whole database to a JSON string
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
    if ( e.code !== 'ENOENT' )
      throw e;

    // If the file does not exist, it should have already been set
    //  above
  }


  // Exit code adapted from https://stackoverflow.com/a/14032965
  //  by Emil Condrea, 25/12/2012, last accessed 12/01/2023

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
  { id: userId, username, colour, glyph, posts, following }
) => (
  {
    id:         userId,
    username,
    colour,
    glyph,
    nPosts:     posts.length,
    nFollowing: following.length
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

/** Get the last n posts from the users followed with an offset of o
 * @param { number } id
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getUserFollowingPosts( id, n, o ) {
  return data.postIds
    .map( postId => getPost( postId ) )
    .filter( ( { user } ) => data.users[ id ].following.includes( user ) )
    .slice( o, o + n )
    .map( post => (
      { ...filterPost( post ), user: getUser( post.user ) }
    ) );
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

// The search is cached because it takes a while to run
//  and the result is likely to be used again soon
//  (with an offset)
const userSearchCache = {};

/** Search for a user by username
 * @param { string } query
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getUsersSearch( query, n, o ) {
  if ( userSearchCache[ query ] === undefined ) {
    setTimeout( () => {
      // After the lifetime has ended, remove it from the cache
      delete userSearchCache[ query ];
    }, CACHE_LIFETIME );

    // Do the search and add it to the cache
    userSearchCache[ query ] = Object.values( data.users )
      // Get the closeness to all usernames and get the ids
      .map( user => [ user.id, badSimilarityAlgorithm( user.username, query ) ] )
      // Remove any irrelevant results
      .filter( ( [ , score ] ) => score >= query.length )
      // Sort the results
      .sort( ( [ , scoreA ], [ , scoreB ] ) => scoreB - scoreA )
      // Get the ids
      .map( ( [ id ] ) => id );
  }

  // Return the data
  return userSearchCache[ query ]
    .slice( o, o + n )
    .map( id => getUser( id ) );
}


/** Add a new user to the database
 * @param { string } username
 * @param { string } colour
 * @param { string } glyph
 * @returns { number }
 */
export function addUser( username, colour, glyph ) {
  const id = data.nextUserId++;
  data.users[ id ] = {
    id,
    username,
    colour,
    glyph,
    posts:     [],
    following: []
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
    .map( post => (
      { ...filterPost( post ), user: getUser( post.user ) }
    ) );
}

// The search is cached because it takes a while to run
//  and the result is likely to be used again soon
//  (with an offset)
const postSearchCache = {};

/** Get the last n posts with an offset of o
 * @param { string } query
 * @param { number } n
 * @param { number } o
 * @returns { object[] }
 */
export function getPostsSearch( query, n, o ) {
  if ( postSearchCache[ query ] === undefined ) {
    setTimeout( () => {
      // After the lifetime has ended, remove it from the cache
      delete postSearchCache[ query ];
    }, CACHE_LIFETIME );

    // Do the search and add it to the cache
    postSearchCache[ query ] = Object.values( data.posts )
      // Get the closeness to all post recipes and bodies
      .map( post => {
        const recipeScore = post.recipe
          .map( instruction => badSimilarityAlgorithm( instruction, query ) )
          .reduce( ( prev, curr ) => curr > prev ? curr : prev, 0 );

        const bodyScore = badSimilarityAlgorithm( post.body, query );
        const score = recipeScore > bodyScore ? recipeScore : bodyScore;
        return [ post.id, score ];
      } )
      // Remove any irrelevant results
      .filter( ( [ , score ] ) => score >= query.length / 2 )
      // Sort the results
      .sort( ( [ , scoreA ], [ , scoreB ] ) => scoreB - scoreA )
      // Get the ids
      .map( ( [ id ] ) => id );
  }

  // Return the data
  return postSearchCache[ query ]
    .slice( o, o + n )
    .map( id => {
      const post = getPost( id );
      const user = getUser( post.user );
      return {
        ...post,
        user
      };
    } );
}


/** Add a new post to the database
 * @param { number } user
 * @param { number } timestamp
 * @param { Array< string > } recipe
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
  getUserFollowingPosts,
  getUsers,
  getUsersSearch,
  addUser,
  addUserFollow,
  deleteUser,
  deleteUserFollow,
  updateUserUsername,
  updateUserColour,
  updateUserGlyph,

  existsPost,
  getPost,
  getPosts,
  getPostsSearch,
  addPost,
  deletePost,
  updatePostRecipe,
  updatePostBody
};
