import db from './db.js';


/** Error for bad API calls */
export class APIError extends Error {
  /**
   * @param {string} message
   * @param {number=} status
  */
  constructor( message, status ) {
    super( message );
    this.name = 'DBError';
    this.status = status;
  }
}


/** Regex to validate usernames */
const USERNAME_REGEX = /^[a-zA-Z0-9_.\-+=!*|]{1,20}$/;
/** Regex to validate colours */
const COLOUR_REGEX = /^#[0-9a-f]{6}$/;
/** The list of valid glyphs */
const VALID_GLYPHS
    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@£$%^&*()[{]};:\'"\\|/?,<.>';

/** Check that the value was provided, otherwise throw an error
 * @param {any} value
 * @param {string} name
 */
function validateParamGiven( value, name ) {
  // If the value was not provided, throw an error
  if ( value === undefined )
    throw new APIError( `No ${ name } parameter provided!` );
}

/** Check that the value was provided and is the correct type
 * @param {any} value
 * @param {string} name
 * @param {string} type
 */
function validateParamType( value, name, type ) {
  // If the value was not provided, throw an error
  validateParamGiven( value, name );

  // If the value is not of the correct type, throw an error
  if ( typeof value !== type )
    throw new APIError( `Invalid ${ name } parameter provided!` );
}

/** Check that the value was provided, and parse it as an integer
 * @param { string | number } value
 * @param {string} name
 * @returns {number}
 */
function validateParamParseInt( value, name ) {
  // If the value was not provided, throw an error
  validateParamGiven( value, name );

  // Parse the value as an integer, if it is not an integer, throw an error
  value = parseInt( value );
  if ( isNaN( value ) )
    throw new APIError( `Invalid ${ name } parameter provided!` );

  return value;
}

/** Parse the value as an integer with a default value
 * @param { string | number | undefined } value
 * @param {string} name
 * @param {number} defaultValue
 * @returns {number}
 */
function validateParamParseIntDefault( value, name, defaultValue ) {
  // Parse the value as an integer with default, if it is not an integer, throw an error
  value = parseInt( value ?? defaultValue );
  if ( isNaN( value ) )
    throw new APIError( `Invalid ${ name } parameter provided!` );

  return value;
}


/** Get data
 * @param {string} type
 * @param {{ [ key: string ]: string }} options
 * @returns {any}
 */
export function getData( type, options ) {
  let result, id, n, o;

  switch ( type ) {
    case 'user':
      console.log( `user: ${ JSON.stringify( options ) }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( id ) )
        throw new APIError( `User '${ id }' not found!` );

      result = db.getUser( id );

      // If the user's posts were requested, get them
      if ( 'posts' in options ) {
        // Get the number of posts and offset, if provided
        const postsOptions = options.posts.split( ',' )
          .filter( x => x )
          .map( x => parseInt( x ) );
        // If too many arguments were provided, throw an error
        if ( postsOptions.length > 2 )
          throw new APIError( 'Invalid posts parameter provided!' );

        // If any of the arguments are not integers, throw an error
        if ( postsOptions.some( x => isNaN( x ) ) )
          throw new APIError( 'Invalid posts parameter provided!' );

        // Get the number of posts and offset with default values
        n = postsOptions[ 0 ] || 10;
        o = postsOptions[ 1 ] || 0;

        // Get the posts, and add them to the result
        result.posts = db.getUserPosts( id, n, o );
      }

      // If the user's following list was requested and is public, get it
      if ( 'following' in options && db.getUserFollowingPublic( id ) ) {
        // Get the number of users and offset, if provided
        const followingOptions = options.following.split( ',' )
          .filter( x => x )
          .map( x => parseInt( x ) );
        // If too many arguments were provided, throw an error
        if ( followingOptions.length > 2 )
          throw new APIError( 'Invalid following parameter provided!' );

        // If any of the arguments are not integers, throw an error
        if ( followingOptions.some( x => isNaN( x ) ) )
          throw new APIError( 'Invalid following parameter provided!' );

        // Get the number of users and offset with default values
        n = followingOptions[ 0 ] || 10;
        o = followingOptions[ 1 ] || 0;

        // Get the users, and add them to the result
        result.following = db.getUserFollowing( id, n, o );
      }

      break;

    case 'post':
      console.log( `post: ${ JSON.stringify( options ) }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the post does not exist, throw an error
      if ( !db.existsPost( id ) )
        throw new APIError( `Post '${ id }' not found!` );

      result = db.getPost( id );

      // If the post's user was not excluded, get it
      if ( !( '-user' in options ) )
        result.user = db.getUser( result.user );

      break;

    case 'users':
      console.log( `users: ${ JSON.stringify( options ) }` );

      // Get the number of users with default value and parse it as an integer
      n = validateParamParseIntDefault( options.n, 'n', 10 );

      // Get the offset with default value and parse it as an integer
      o = validateParamParseIntDefault( options.o, 'o', 0 );

      // Get the users
      result = db.getUsers( n, o );
      break;

    case 'posts':
      console.log( `posts: ${ JSON.stringify( options ) }` );

      // Get the number of posts with default value and parse it as an integer
      n = validateParamParseIntDefault( options.n, 'n', 10 );

      // Get the offset with default value and parse it as an integer
      o = validateParamParseIntDefault( options.o, 'o', 0 );

      // Get the posts
      result = db.getPosts( n, o );

      // result.map( post => {
      //   post.user = getData( 'user', { id: post.user } );
      // } );

      break;

    case 'log':
      // Log the data (for debugging)
      console.log( `log: ${ db.stringify( undefined, 2 ) }` );
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!' );
  }

  return result;
}

/** Add data
 * @param {string} type
 * @param {{ [ key: string ]: string }} options
 * @returns { number | boolean }
 */
export function addData( type, options ) {
  let result;

  switch ( type ) {
    case 'user':
      console.log( `add user: ${ JSON.stringify( options ) }` );

      // If the username is not provided, throw an error
      validateParamGiven( options.username, 'username' );

      // If the username is not valid, throw an error
      if ( typeof options.username !== 'string' || !USERNAME_REGEX.test( options.username ) )
        throw new APIError( 'Invalid username provided!' );

      // If the color is not provided, throw an error
      validateParamGiven( options.colour, 'colour' );

      // If the color is not valid, throw an error
      if ( typeof options.colour !== 'string' || !COLOUR_REGEX.test( options.colour ) )
        throw new APIError( 'Invalid colour provided!' );

      // If the glyph is not provided, throw an error
      validateParamGiven( options.glyph, 'glyph' );

      // If the glyph is not valid, throw an error
      if (
        typeof options.glyph !== 'string'
                || options.glyph.length !== 1
                || !VALID_GLYPHS.includes( options.glyph )
      )
        throw new APIError( 'Invalid glyph provided!' );

      // If followingPublic is not provided or is not a boolean, throw an error
      validateParamType( options.followingPublic, 'followingPublic', 'boolean' );

      // Add the user and get the id
      result = db.addUser(
        options.username,
        options.colour,
        options.glyph,
        options.followingPublic
      );

      break;

    case 'post':
      console.log( `add post: ${ JSON.stringify( options ) }` );

      // If the user id is not provided or is not a number, throw an error
      validateParamType( options.user, 'user', 'number' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( options.user ) )
        throw new APIError( `User '${ options.user }' not found!` );

      // If the recipe is not provided, throw an error
      validateParamGiven( options.recipe, 'recipe' );

      // TODO: validate and parse recipe

      // If the body is not provided or is not a string, throw an error
      validateParamType( options.body, 'body', 'string' );

      // Add the post
      result = db.addPost( options.user, options.recipe, options.body );

      break;

    case 'follow':
      console.log( `follow: ${ JSON.stringify( options ) }` );

      // If the user id is not provided or is not a number, throw an error
      validateParamType( options.id, 'id', 'number' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( options.id ) )
        throw new APIError( `User '${ options.id }' not found!` );

      // If the user to follow id is not provided or is not a number, throw an error
      validateParamType( options.follow, 'follow', 'number' );

      // If the user to follow does not exist, throw an error
      if ( !db.existsUser( options.follow ) )
        throw new APIError( `User '${ options.follow }' not found!` );

      // If the user is already following the user to follow, throw an error
      if ( db.existsUserFollow( options.id, options.follow ) )
        throw new APIError( `User '${
          options.id
        }' is already following '${
          options.follow
        }'!` );

      // Add the follow
      db.addUserFollow( options.id, options.follow );

      // Return true
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!' );
  }

  return result;
}

/** Delete data
 * @param {string} type
 * @param {{ [ key: string ]: string }} idOptions
 * @param {{ [ key: string ]: string }} options
 * @returns {boolean}
 */
export function deleteData( type, options ) {
  let result, id, followId;

  switch ( type ) {
    case 'user':
      console.log( `remove user: ${ JSON.stringify( options ) }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( id ) )
        throw new APIError( `User '${ id }' not found!` );

      // Delete the user
      db.deleteUser( id );

      // Return true
      result = true;
      break;

    case 'post':
      console.log( `remove post: ${ JSON.stringify( options ) }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the post does not exist, throw an error
      if ( !db.existsPost( options.id ) )
        throw new APIError( `Post '${ id }' not found!` );

      // Delete the post
      db.deletePost( id );

      // Return true
      result = true;
      break;

    case 'follow':
      console.log( `unfollow: ${ JSON.stringify( options ) }` );

      // Parse the user id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( id ) )
        throw new APIError( `User '${ id }' not found!` );

      // Parse the follower id as an integer, if it was not provided or is not an integer,
      //  throw an error
      followId = validateParamParseInt( options.follow, 'follow' );

      // If the user to follow does not exist, throw an error
      if ( !db.existsUser( followId ) )
        throw new APIError( `User '${ followId }' not found!` );

      // If the user is not following the follow, throw an error
      if ( !db.existsUserFollow( id, followId ) )
        throw new APIError( `User '${
          options.id
        }' is not following '${
          options.follow
        }'!` );

      // Unfollow
      db.deleteUserFollow( id, followId );

      // Return true
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!' );
  }

  return result;
}

export function patchData( type, idOptions, options ) {
  let result;

  switch ( type ) {
    case 'user':
      console.log( `update user: ${
        JSON.stringify( idOptions )
      }, ${
        JSON.stringify( options )
      }` );

      // If the user id is not provided or is not a number, throw an error
      validateParamType( idOptions.id, 'id', 'number' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( idOptions.id ) )
        throw new APIError( `User '${ idOptions.id }' not found!` );

      // If the username is provided, attempt to update it
      if ( options.username !== undefined ) {
        // If the username is not valid, throw an error
        if (
          typeof options.username !== 'string'
                    || !USERNAME_REGEX.test( options.username )
        )
          throw new APIError( 'Invalid username provided!' );

        db.updateUserUsername( idOptions.id, options.username );
      }

      // If the colour is provided, attempt to update it
      if ( options.colour !== undefined ) {
        // If the color is not valid, throw an error
        if ( typeof options.colour !== 'string' || !COLOUR_REGEX.test( options.colour ) )
          throw new APIError( 'Invalid colour provided!' );

        db.updateUserColour( idOptions.id, options.colour );
      }

      // If the glyph is provided, attempt to update it
      if ( options.glyph !== undefined ) {
        // If the glyph is not valid, throw an error
        if (
          typeof options.glyph !== 'string'
                    || options.glyph.length !== 1
                    || !VALID_GLYPHS.includes( options.glyph )
        )
          throw new APIError( 'Invalid glyph provided!' );

        db.updateUserGlyph( idOptions.id, options.glyph );
      }

      // If the followingPublic is provided, attempt to update it
      if ( options.followingPublic !== undefined ) {
        // If followingPublic is not provided or is not a boolean, throw an error
        validateParamType( options.followingPublic, 'followingPublic', 'boolean' );

        db.updateUserGlyph( idOptions.id, options.followingPublic );
      }

      // Return true
      result = true;
      break;

    case 'post':
      console.log( `update post: ${
        JSON.stringify( idOptions )
      }, ${
        JSON.stringify( options )
      }` );

      // If the post id is not provided or is not a number, throw an error
      validateParamType( idOptions.id, 'id', 'number' );

      // If the post does not exist, throw an error
      if ( !db.existsPost( idOptions.id ) )
        throw new APIError( `Post '${ idOptions.id }' not found!` );

      // If the recipe is provided, attempt to update it
      if ( options.recipe !== undefined ) {
        // If the recipe is not valid, throw an error
        // TODO: validate and parse recipe

        db.updatePostRecipe( idOptions.id, options.recipe );
      }

      // If the body is provided, attempt to update it
      if ( options.body !== undefined ) {
        // If the body is not a string, throw an error
        validateParamType( options.body, 'body', 'string' );

        db.updatePostRecipe( idOptions.id, options.recipe );
      }

      // Return true
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!' );
  }

  return result;
}
