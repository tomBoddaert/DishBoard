/**
 * @file Tests the database.js file (testing database requests)
 * @author Tom Boddaert
 */


import db from './db';


// Add some data to the test database
db.addUser( 'u1', '#868686', 'j', true );
db.addUser( 'u2', '#686868', 'k', false );
db.addPost( 0, Date.now(), 'recipe_string', 'hello world' );
db.addPost( 1, Date.now(), 'recipe_string2', 'hello planet' );


test( 'add a user to the database', () => {
  const expectedUser = {
    username: 'us3rn4m3',
    colour:   '#fed987',
    glyph:    'h'
  };

  // Add a new user and get the resulting id
  const id = db.addUser( expectedUser.username, expectedUser.colour, expectedUser.glyph, true );
  // Check that the new user exists
  expect( db.existsUser( id ) ).toBe( true );

  // Check that the new user matches the expected user
  expect( db.getUser( id ) ).toMatchObject( { ...expectedUser, id } );
} );


test( 'follow a user', () => {
  // Get the two newest users
  const [ { id: user }, { id: follow } ] = db.getUsers( 2, 0 );
  // Check that they user is not already following the 'follow'
  expect( db.existsUserFollow( user, follow ) ).toBe( false );

  // Follow the 'follow' from the user
  db.addUserFollow( user, follow );
  // Check that the user is following the 'follow'
  expect( db.existsUserFollow( user, follow ) ).toBe( true );
} );


test( 'unfollow a user', () => {
  // Get the two newest users
  const [ { id: user }, { id: follow } ] = db.getUsers( 2, 0 );
  // If the user is not already following the 'follow', add the follow
  if ( !db.existsUserFollow( user, follow ) )
    db.addUserFollow( user, follow );

  // Check that the user is following the 'follow'
  expect( db.existsUserFollow( user, follow ) ).toBe( true );

  // Unfollow the 'follow' from the user
  db.deleteUserFollow( user, follow );
  // Check that the user is not following the 'follow'
  expect( db.existsUserFollow( user, follow ) ).toBe( false );
} );


test( 'delete a user from the database', () => {
  // Get the newest user
  const [ { id: user } ] = db.getUsers( 1, 0 );
  // Make sure that existsUser is working correctly
  expect( db.existsUser( user ) ).toBe( true );

  // Delete the user
  db.deleteUser( user );
  // Check that the user has been deleted
  expect( db.existsUser( user ) ).toBe( false );
} );


test( 'update a user\'s username', () => {
  // Get the newest user
  const [ { id: user, username: oldUsername } ] = db.getUsers( 1, 0 );

  // Generate a new username, guaranteed to be different
  const newUsername = ( () => {
    if ( oldUsername.length > 8 ) {
      return oldUsername.slice( 0, oldUsername.length - 1 );
    }
    return oldUsername + oldUsername;
  } )();

  // Update the username
  db.updateUserUsername( user, newUsername );

  // Get the new username
  const { username } = db.getUser( user );
  // Check that the username has been updated
  expect( username ).toBe( newUsername );
} );


test( 'add a post to the database', () => {
  const expectedPost = {
    recipe: 'the recipe',
    body:   'Hello World!'
  };

  // Get the newest user
  const [ { id: userId } ] = db.getUsers( 1, 0 );
  // Add a post and get the resulting id
  const id = db.addPost( userId, Date.now(), expectedPost.recipe, expectedPost.body );
  // Check that the new post exists
  expect( db.existsPost( id ) ).toBe( true );

  // Get the timestamp
  const { timestamp } = db.getPost( id );
  // Check that the timestamp was within the last 10ms (should take 0-1)
  const timeDelta = Date.now() - timestamp;
  expect( timeDelta >= 0 && timeDelta < 10 ).toBe( true );

  // Check that the new post matches the expected post
  expect( db.getPost( id ) ).toMatchObject( { ...expectedPost, id, timestamp } );
} );


test( 'update a post\'s body', () => {
  // Get the newest post
  const [ { id, body } ] = db.getPosts( 1, 0 );

  // Add some text to the body to guarantee that it will be different
  const expectedBody = `${ body } \n`;
  // Update the post's body
  db.updatePostBody( id, expectedBody );

  // Get the new body
  const { body: newBody } = db.getPost( id );
  // Check that it has been updated
  expect( newBody ).toBe( expectedBody );
} );


test( 'delete a post', () => {
  // Get the newest post
  const [ { id } ] = db.getPosts( 1, 0 );
  // Make sure that existsPost is working correctly
  expect( db.existsPost( id ) ).toBe( true );

  // Delete the post
  db.deletePost( id );
  // Check that the post has been deleted
  expect( db.existsPost( id ) ).toBe( false );
} );
