/**
 * @file Manages API requests
 * @author Tom Boddaert
 */


import db from './db.js';


/** Error for bad API calls */
export class APIError extends Error {
  /** Error for bad API calls
   * @param { string } message
   * @param { number= } status
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

/** Regex to validate recipe instructions */
const INSTRUCTION_REGEX = /^[A-Za-z0-9,.\- ]{1,100}$/;

/** Check that the value was provided, otherwise throw an error
 * @param { any } value
 * @param { string } name
 * @throws { APIError }
 */
function validateParamGiven( value, name ) {
  // If the value was not provided, throw an error
  if ( value === undefined )
    throw new APIError( `No ${ name } parameter provided!` );
}

/** Check that the value was provided and is the correct type
 * @param { any } value
 * @param { string } name
 * @param { string } type
 * @throws { APIError }
 */
function validateParamType( value, name, type ) {
  // If the value was not provided, throw an error
  validateParamGiven( value, name );

  // If the value is not of the correct type, throw an error
  if ( typeof value !== type )
    throw new APIError( `Invalid ${ name } parameter provided!` );
}

/** Check that the value was provided and is an instance of the correct class
 * @param { any } value
 * @param { string } name
 * @param { any } Class
 * @throws { APIError }
 */
function validateParamInstanceOf( value, name, Class ) {
  // If the value was not provided, throw an error
  validateParamGiven( value, name );

  // If the value is not of the correct type, throw an error
  if ( !( value instanceof Class ) )
    throw new APIError( `Invalid ${ name } parameter provided!` );
}

/** Check that the value was provided, and parse it as an integer
 * @param { string | number } value
 * @param { string } name
 * @returns { number }
 * @throws { APIError }
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
 * @param { string } name
 * @param { number } defaultValue
 * @returns { number }
 * @throws { APIError }
 */
function validateParamParseIntDefault( value, name, defaultValue ) {
  // Parse the value as an integer with default, if it is not an integer, throw an error
  value = parseInt( value ?? defaultValue );
  if ( isNaN( value ) )
    throw new APIError( `Invalid ${ name } parameter provided!` );

  return value;
}

/** Parse the value as an integer with a default value
 * @param { string } value
 * @param { string } name
 * @param { number[] } defaultValues
 * @returns { number[] }
 * @throws { APIError }
 */
function validateParamParseIntListDefault( value, name, ...defaultValues ) {
  // Split the values by ,
  let values = value.split( ',' );
  // eslint-disable-next-line no-extra-parens
  if ( values.length === 0 || ( values.length === 1 && values[ 0 ] === '' ) )
    // Copy to avoid overwriting of the original by the caller
    return [ ...defaultValues ];

  // If too many values were provided, throw an error
  if ( values.length > defaultValues.length )
    throw new APIError( `Invalid ${ name } parameter provided!` );

  // Default the values if left empty and parse them as integers
  values = defaultValues
    .map( ( d, i ) => values[ i ] ? values[ i ] : d )
    .map( x => parseInt( x ) );

  // If any of the arguments are not integers, throw an error
  if ( values.some( x => isNaN( x ) || x < 0 ) )
    throw new APIError( `Invalid ${ name } parameter provided!` );

  return values;
}


/** Get data
 * @param { string } type
 * @param { Object< string, string > } options
 * @returns { any }
 * @throws { APIError }
 */
export function getData( type, options ) {
  let result, id, n, o, follow;

  switch ( type ) {
    case 'user':
      console.log( `user: ${ JSON.stringify( options ) }` );

      // If neither the id or username parameters are provided, throw an error
      if ( options.id === undefined && options.username === undefined )
        throw new APIError( 'No id or username parameter provided!' );

      // If both the id and username parameters are provided, throw an error
      if ( options.id !== undefined && options.username !== undefined )
        throw new APIError( 'username and id parameters both provided!' );

      if ( options.id !== undefined ) {
        // Parse the id as an integer, if it was not provided or is not an integer,
        //  throw an error
        id = validateParamParseInt( options.id, 'id' );

        // If the user does not exist, throw an error
        if ( !db.existsUser( id ) )
          throw new APIError( `User '${ id }' not found!` );

        result = db.getUser( id );
      } else {
        // If the username is not valid, throw an error
        if ( typeof options.username !== 'string' || !USERNAME_REGEX.test( options.username ) )
          throw new APIError( 'Invalid username provided!' );

        // If the user does not exist, throw an error
        if ( !db.existsUsername( options.username ) )
          throw new APIError( `User '${ options.username }' not found!` );

        result = db.getUserByUsername( options.username );
      }

      // If the user's posts were requested, get them
      if ( 'posts' in options ) {
        // Get the number of posts and offset, if provided and error if they are not
        //  integers, with defaults
        [ n, o ] = validateParamParseIntListDefault( options.posts, 'posts', 10, 0 );

        // Get the posts, and add them to the result
        result.posts = db.getUserPosts( id, n, o );
      }

      // If the user's following list was requested, get it
      if ( 'following' in options ) {
        // Get the number of users and offset, if provided and error if they are not
        //  integers, with defaults
        [ n, o ] = validateParamParseIntListDefault( options.following, 'following', 10, 0 );

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
      else
        delete result.user;

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

      break;

    case 'follow':
      console.log( `follow: ${ JSON.stringify( options ) }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( options.id, 'id' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( id ) )
        throw new APIError( `User '${ id }' not found!` );

      // Parse the follow id as an integer, if it was not provided or is not an integer,
      //  throw an error
      follow = validateParamParseInt( options.follow, 'follow' );

      // If the follow does not exist, throw an error
      if ( !db.existsUser( follow ) )
        throw new APIError( `User '${ follow }' not found!` );

      result = db.existsUserFollow( id, follow );

      break;

    case 'log':
      if ( db.usingProductionDB() )
        throw new APIError( 'Invalid API object request!', 404 );

      // Log the data (for debugging)
      console.log( `log: ${ db.stringify( undefined, 2 ) }` );
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!', 404 );
  }

  return result;
}

/** Add data
 * @param { string } type
 * @param { Object< string, any > } options
 * @returns { number | boolean }
 * @throws { APIError }
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

      // If the username is already in use, throw an error
      if ( db.existsUsername( options.username ) )
        throw new APIError( 'Username already in use!' );

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

      // Add the user and get the id
      result = db.addUser(
        options.username,
        options.colour,
        options.glyph
      );

      break;

    case 'post':
      console.log( `add post: ${ JSON.stringify( options ) }` );

      // If the user id is not provided or is not a number, throw an error
      validateParamType( options.user, 'user', 'number' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( options.user ) )
        throw new APIError( `User '${ options.user }' not found!` );

      // If the recipe is not provided, or it is not an array, throw an error
      validateParamInstanceOf( options.recipe, 'recipe', Array );

      // If the recipe is empty or too long, throw an error
      if ( options.recipe.length === 0 || options.recipe.length > 20 )
        throw new APIError( 'Invalid recipe parameter provided!' );

      // If any of the recipe instructions are not strings, or do not match the instruction regex,
      //  throw an error
      for ( const instruction of options.recipe )
        if ( typeof instruction !== 'string' || !INSTRUCTION_REGEX.test( instruction ) )
          throw new APIError( 'Invalid recipe parameter provided!' );

      // If the body is not provided or is not a string, throw an error
      validateParamType( options.body, 'body', 'string' );

      // Add the post
      result = db.addPost(
        options.user,
        Date.now(),
        options.recipe,
        options.body
      );

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
      throw new APIError( 'Invalid API object request!', 404 );
  }

  return result;
}

/** Delete data
 * @param { string } type
 * @param { Object< string, string > } options
 * @returns { boolean }
 * @throws { APIError }
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
      throw new APIError( 'Invalid API object request!', 404 );
  }

  return result;
}

/** Update data
 * @param { string } type
 * @param { Object< string, string > } idOptions
 * @param { Object< string, any > } options
 * @returns { any }
 * @throws { APIError }
 */
export function updateData( type, idOptions, options ) {
  let result, id;

  switch ( type ) {
    case 'user':
      console.log( `update user: ${
        JSON.stringify( idOptions )
      }, ${
        JSON.stringify( options )
      }` );

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( idOptions.id, 'id' );

      // If the user does not exist, throw an error
      if ( !db.existsUser( id ) )
        throw new APIError( `User '${ id }' not found!` );

      // If the username is provided, attempt to update it
      if ( options.username !== undefined ) {
        // If the username is not valid, throw an error
        if (
          typeof options.username !== 'string'
            || !USERNAME_REGEX.test( options.username )
        )
          throw new APIError( 'Invalid username provided!' );

        // If the username is already in use, throw an error
        if ( db.existsUsername( options.username ) )
          throw new APIError( 'Username already in use!' );

        db.updateUserUsername( id, options.username );
      }

      // If the colour is provided, attempt to update it
      if ( options.colour !== undefined ) {
        // If the color is not valid, throw an error
        if ( typeof options.colour !== 'string' || !COLOUR_REGEX.test( options.colour ) )
          throw new APIError( 'Invalid colour provided!' );

        db.updateUserColour( id, options.colour );
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

        db.updateUserGlyph( id, options.glyph );
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

      // Parse the id as an integer, if it was not provided or is not an integer,
      //  throw an error
      id = validateParamParseInt( idOptions.id, 'id' );

      // If the post does not exist, throw an error
      if ( !db.existsPost( id ) )
        throw new APIError( `Post '${ id }' not found!` );

      // If the recipe is provided, attempt to update it
      if ( options.recipe !== undefined ) {
        // If the recipe is not an array, throw an error
        validateParamInstanceOf( options.recipe, 'recipe', Array );

        // If the recipe is empty or too long, throw an error
        if ( options.recipe.length === 0 || options.recipe.length > 20 )
          throw new APIError( 'Invalid recipe parameter provided!' );

        // If any of the recipe instructions are not strings, or do not match the instruction regex,
        //  throw an error
        for ( const instruction of options.recipe )
          if ( typeof instruction !== 'string' || !INSTRUCTION_REGEX.test( instruction ) )
            throw new APIError( 'Invalid recipe parameter provided!' );

        db.updatePostRecipe( id, options.recipe );
      }

      // If the body is provided, attempt to update it
      if ( options.body !== undefined ) {
        // If the body is not a string, throw an error
        validateParamType( options.body, 'body', 'string' );

        db.updatePostRecipe( id, options.recipe );
      }

      // Return true
      result = true;
      break;

    default:
      // If the type is not dealt with above, throw an error
      throw new APIError( 'Invalid API object request!', 404 );
  }

  return result;
}
