/**
 * @file Client side JS
 * @author Tom Boddaert
 */


/* -- Constants -- */

/** Regex to validate usernames */
const USERNAME_REGEX = /^[a-zA-Z0-9_.\-+ = !*|]{1,20}$/;
/** The list of valid glyphs */
const VALID_GLYPHS
    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@£$%^&*()[{]};:\'"\\|/?,<.>';

/** Regex to validate recipe instructions */
const INSTRUCTION_REGEX = /^[A-Za-z0-9,.\- ]{1,100}$/;


/* -- Helper functions -- */

/** Add a catch callback to make the response an error, with a connection message
 * @param { Promise } request
 * @returns { Promise }
 */
function jsonBodyErrorToResponse( request ) {
  return request
    .then( res => res.json() )
    .catch( () => ( {
      success: false,
      message: 'Connection error!\nMake sure you are connected to a network\n\tthen try again'
    } ) );
}

/** Add the error to the main container
 * @param { string } message
 * @param { any } pageData
 */
function errorToMain( message, pageData ) {
  let errorElem = main.getElementsByClassName( 'error' )[ 0 ];

  if ( errorElem === undefined ) {
    errorElem = document.createElement( 'span' );
    errorElem.classList.add( 'error' );
    main.prepend( errorElem );
  }

  errorElem.innerText = `${ message }\n`;

  if ( message.startsWith( 'Connection error!' ) ) {
    const reloadElem = document.createElement( 'input' );
    reloadElem.setAttribute( 'type', 'button' );
    reloadElem.setAttribute( 'value', 'Try again' );
    reloadElem.addEventListener( 'click', () => {
      newPageData = pageData;
      changePage( currentPage );
    }, { once: true } );

    errorElem.appendChild( reloadElem );
  }

  errorElem.scrollIntoView( { behavior: 'smooth', block: 'center' } );
}

/** Create a new MouseEvent to simulate a click
 * @returns { MouseEvent }
 */
function newSimulateClickEvent() {
  return new MouseEvent( 'click', {
    view:       window,
    bubbles:    true,
    cancelable: true
  } );
}

/** Shallow compare two arrays
 * @param { Array } a1
 * @param { Array } a2
 * @returns { boolean }
 */
function shallowCompare( a1, a2 ) {
  if ( a1.length !== a2.length )
    return false;

  for ( let i = 0; i < a1.length; i++ )
    if ( a1[ i ] !== a2[ i ] )
      return false;

  return true;
}


/* -- Dark mode -- */
/* (this code was originally written for https://github.com/stevenaeola/proglabs_js/pull/39) */

let darkMode;
let dmSelector;
let logoElem;
let logo;

/** Set the page theme
 * @param { boolean } dark - true if dark mode
 */
function setTheme( dark ) {
  // Add or remove the dark class to root
  if ( dark ) {
    document.lastChild.classList.add( 'dark' );
    logo?.postMessage( 'dark', '*' );
  } else {
    document.lastChild.classList.remove( 'dark' );
    logo?.postMessage( 'light', '*' );
  }

  // Set the option in the local storage to make it persistent
  localStorage.setItem( 'dark', dark.toString() );
}

/** Run when the dark mode selector is clicked
 * @param { MouseEvent } ev
 */
function dmClick( ev ) {
  darkMode = !darkMode;
  ev.target.innerText = darkMode ? '🌕' : '🌑';
  setTheme( darkMode );
}

darkMode = ( () => {
  // Get the dark mode setting stored as in local storage (as a string)
  const storedModeText = localStorage.getItem( 'dark' );
  // Convert the string to a boolean | undefined
  const storedMode = {
    true:  true,
    false: false
  }[ storedModeText ];

  // If the mode was not set, then default to the browser's dark mode setting
  return storedMode ?? window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
} )();

// Set the initial theme
if ( darkMode )
  setTheme( darkMode );


/* -- Profile -- */

let loggedInId;

/** Login to a user
 * @param { object } user
 */
function login( user ) {
  loggedInId = user.id;

  // Show the feed navbar element
  navButtons.feed.classList.remove( 'hidden' );

  // Get the profile navbar element
  const profileElem = navButtons.profile;

  // Remove the login text
  profileElem.innerText = '';

  // Set the username data attribute
  profileElem.setAttribute( 'data-user-username', `@${ user.username }` );

  // Set the glyph data attribute
  profileElem.setAttribute( 'data-user-glyph', user.glyph );
  // Set the user's colour
  profileElem.style.setProperty( '--glyph-colour', user.colour );
}

/** Logout */
function logout() {
  loggedInId = undefined;

  // Hide the feed navbar element
  navButtons.feed.classList.add( 'hidden' );

  // Get the profile navbar element
  const profileElem = navButtons.profile;

  // Add the login text
  profileElem.innerText = 'Login';

  // Unset the username data attribute
  profileElem.removeAttribute( 'data-user-username' );

  // Unset the glyph data attribute
  profileElem.removeAttribute( 'data-user-glyph' );
  // Unset the user's colour
  profileElem.style.removeProperty( '--glyph-colour' );
}


/* -- Nav bar -- */

let nav;
let navButtons;
let currentPage = 'posts';

/** Run when the nav bar is clicked
 * @param { MouseEvent } ev
 */
function navClick( ev ) {
  // Get the target page from the data attribute
  const targetPage = ev.target.getAttribute( 'data-page-id' );
  // If the target page has not changed, stop
  if ( targetPage === null || targetPage === currentPage )
    return;

  console.log( `switching to ${ targetPage }` );
  // Change the page to the target page
  changePage( targetPage );
}


/* -- Main container -- */

let main;


/* -- End loader -- */

let endCallback;


/* -- Pages -- */

const templates = {};
let newPageData;

/** Change the page
 * @param { string } targetPage
 * @param { boolean= } update
 */
async function changePage( targetPage, update = true ) {
  // Remove the end callback
  if ( update )
    endCallback = undefined;

  // Remove the active class from the current page button
  navButtons[ currentPage ]?.classList.remove( 'active' );
  // Add the active class to the target page button
  navButtons[ targetPage ]?.classList.add( 'active' );

  currentPage = targetPage;
  // Delete all the children of the main container
  // eslint-disable-next-line no-unmodified-loop-condition
  while ( main.hasChildNodes() && update )
    main.removeChild( main.firstChild );

  // Initialise the new page
  if ( !update )
    return;

  window.scrollTo( 0, 0 );
  await initPage[ currentPage ]();

  // Unset the new page data
  newPageData = undefined;
}

/**
 * @name InitFunction
 * @function
 * @returns { Promise }
 * @async
 */

/** Functions to initialise the pages
 * @type { Object< string, InitFunction > }
 */
const initPage = {
  async profile() {
    // If the logged in id is undefined, show the login page
    if ( loggedInId === undefined ) {
      const loginElem = construct.login();

      main.appendChild( loginElem );
      return;
    }

    // Extend the user page
    newPageData ??= [];
    newPageData[ 0 ] = loggedInId;
    newPageData[ 1 ] ??= 'posts';
    newPageData[ 2 ] = true;
    await changePage( 'user' );

    // Set the current page as profile without update
    await changePage( 'profile', false );

    // Create a profile options element
    const profileElem = construct.profile();
    main.prepend( profileElem );

    const displayed = [];
    const addEditButtons = () => {
      // Get all post bodies
      const posts = main.getElementsByClassName( 'post' );

      // Add an edit button to each post
      for ( const post of posts ) {
        const postId = post.getAttribute( 'data-post-id' );
        if ( displayed.includes( postId ) )
          continue;
        displayed.push( postId );

        const edit = document.createElement( 'input' );
        edit.setAttribute( 'type', 'button' );
        edit.setAttribute( 'value', 'Edit' );
        edit.style.height = 'fit-content';
        edit.style.width = 'fit-content';
        post.appendChild( edit );

        // Listen for click events on the edit button
        edit.addEventListener( 'click', () => {
          newPageData = postId;
          changePage( 'postEdit' );
        } );
      }
    };

    const append = endCallback;
    const callback = () => {
      append();
      addEditButtons();
      endCallback = callback;
    };
    endCallback = callback;

    addEditButtons();
  },
  async signUp() {
    const signUpElem = construct.signUp();

    main.appendChild( signUpElem );
  },
  async profileEdit() {
    // Get the current user from the server
    const response = await jsonBodyErrorToResponse(
      fetch( `/api/user?id=${ loggedInId }` )
    );

    // If the response is an error, show it
    if ( !response.success )
      return errorToMain( response.message );

    const editElem = construct.profileEdit( response.data );
    main.appendChild( editElem );
  },
  async postNew() {
    const newElem = construct.postNew();
    main.appendChild( newElem );
  },
  async postEdit() {
    // Get the post from the server
    const response = await jsonBodyErrorToResponse(
      fetch( `/api/post?id=${ newPageData }` )
    );

    // If the response is an error, show it
    if ( !response.success )
      return errorToMain( response.message, newPageData );

    const editElem = construct.postEdit( response.data );
    main.appendChild( editElem );
  },
  async feed() {
    const displayedPosts = [];
    let offset = 0;

    const append = async () => {
      // Get the latest posts from the server
      const response = await jsonBodyErrorToResponse(
        fetch( `/api/followingposts?id=${ loggedInId }&n=10&o=${ offset }` )
      );

      // If the response is an error, show it
      if ( !response.success )
        return errorToMain( response.message );

      // Get the data
      const { data } = response;

      for ( const post of data ) {
        if ( displayedPosts.includes( post.id ) )
          continue;

        // For each post, create a post element and append it to the main container
        const postElem = construct.post( post );
        main.appendChild( postElem );
        displayedPosts.push( post.id );
      }

      offset += 10;
      if ( data.length === 10 )
        endCallback = append;
    };

    await append();
  },
  async posts() {
    // Add the search box
    const search = construct.search();
    main.appendChild( search );

    const displayedPosts = [];
    let offset = 0;

    const append = async () => {
      // Get the latest posts from the server
      const response = await jsonBodyErrorToResponse(
        fetch( `/api/posts?n=10&o=${ offset }` )
      );

      // If the response is an error, show it
      if ( !response.success )
        return errorToMain( response.message );

      // Get the data
      const { data } = response;

      for ( const post of data ) {
        if ( displayedPosts.includes( post.id ) )
          continue;

        // For each post, create a post element and append it to the main container
        const postElem = construct.post( post );
        main.appendChild( postElem );
        displayedPosts.push( post.id );
      }

      offset += 10;
      if ( data.length === 10 )
        endCallback = append;
    };

    await append();
  },
  async users() {
    // Add the search box
    const search = construct.search();
    main.appendChild( search );

    const displayedUsers = [];
    let offset = 0;

    const append = async () => {
      // Get the latest users from the server
      const response = await jsonBodyErrorToResponse(
        fetch( `/api/users?n=10&o=${ offset }` )
      );

      // If the response is an error, show it
      if ( !response.success )
        return errorToMain( response.message );

      // Get the data
      const { data } = response;

      for ( const user of data ) {
        if ( displayedUsers.includes( user.id ) )
          continue;

        // For each user, create a user and append it to the main container
        const userElem = construct.user( user );
        main.appendChild( userElem );
        displayedUsers.push( user.id );
      }

      offset += 10;
      if ( data.length === 10 )
        endCallback = append;
    };

    await append();
  },
  async user() {
    if ( newPageData[ 0 ] === loggedInId && !newPageData[ 2 ] )
      // await so that newPageData is not unset
      // eslint-disable-next-line no-return-await
      return await changePage( 'profile' );

    const type = newPageData[ 1 ];

    // Get the user from the server
    const response = await jsonBodyErrorToResponse(
      fetch( `/api/user?id=${ newPageData[ 0 ] }&${ type }=10` )
    );

    if ( !response.success )
      return errorToMain( response.message, newPageData );

    // Get the data
    const { data } = response;

    // Create the user element and append it to the main container
    const userElem = construct.user( data );
    main.appendChild( userElem );

    const pageData = newPageData;
    const displayed = [];
    let offset = 0;

    const append = async () => {
      // Get the user's posts or following from the server
      // Get the user from the server
      const response2 = await jsonBodyErrorToResponse(
        fetch( `/api/user?id=${ data.id }&${ type }=10,${ offset }` )
      );

      if ( !response2.success )
        return errorToMain( response2.message, pageData );

      // Get the data
      const { data: data2 } = response2;

      let length;
      switch ( type ) {
        case 'posts':
          for ( const post of data2.posts ) {
            if ( displayed.includes( post.id ) )
              continue;

            // For each post, create a post and append it to the main container
            const postElem = construct.post( post );
            postElem.classList.add( 'no-user' );
            main.appendChild( postElem );
            displayed.push( post.id );
          }
          length = data2.posts.length;
          break;

        case 'following':
          for ( const following of data2.following ) {
            if ( displayed.includes( following.id ) )
              continue;

            // For each user, create a user and append it to the main container
            const followingElem = construct.user( following );
            followingElem.classList.add( 'no-border' );
            main.appendChild( followingElem );
            displayed.push( following.id );
          }
          length = data2.following.length;
          break;

        default:
          return;
      }

      offset += 10;
      if ( length >= 10 )
        endCallback = append;
    };

    let textElem;
    switch ( type ) {
      case 'posts':
        // Create the posts title
        textElem = document.createElement( 'div' );
        textElem.classList.add( 'no-border' );
        textElem.innerText = 'Posts:';
        textElem.style.fontSize = '1.5rem';
        main.appendChild( textElem );
        break;

      case 'following':
        // Create the following title
        textElem = document.createElement( 'div' );
        textElem.classList.add( 'no-border' );
        textElem.innerText = 'Following:';
        textElem.style.fontSize = '1.5rem';
        main.appendChild( textElem );
        break;

      default:
        break;
    }

    await append();

    // If not logged in or if the logged in user is the current user,
    //  stop here
    if ( loggedInId === undefined || data.id === loggedInId )
      return;

    // Send the request to check if the logged in user is following the current user
    let followResponse = await jsonBodyErrorToResponse(
      fetch( `/api/follow?id=${ loggedInId }&follow=${ data.id }` )
    );

    // If there was an error, show it
    if ( !followResponse.success )
      return errorToMain( followResponse.message, newPageData );

    let isFollowing = followResponse.data;

    // Create a follow element
    const followElem = document.createElement( 'input' );
    followElem.setAttribute( 'type', 'button' );
    followElem.setAttribute( 'value', isFollowing ? 'Unfollow' : 'Follow' );

    // Add it to the user element
    userElem.appendChild( followElem );

    followElem.addEventListener( 'click', async () => {
      // Send the request to add the follow
      followResponse = await jsonBodyErrorToResponse(
        fetch(
          isFollowing
            ? `/api/follow?id=${ loggedInId }&follow=${ data.id }`
            : '/api/follow',
          isFollowing
            ? { method: 'DELETE' }
            : {
              method:  'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify( {
                id:     loggedInId,
                follow: data.id
              } )
            }
        )
      );

      // If there was an error, show it
      if ( !followResponse.success )
        return errorToMain( followResponse.message, pageData );

      // Invert following and update the text
      isFollowing = !isFollowing;
      followElem.setAttribute( 'value', isFollowing ? 'Unfollow' : 'Follow' );
    } );
  },
  async search() {
    const [ type, query ] = newPageData;

    const searchElem = construct.search( query, type );
    main.appendChild( searchElem );

    const displayed = [];
    let offset = 0;

    const append = async () => {
      // Get the search results from the server
      const response = await jsonBodyErrorToResponse(
        fetch( `/api/search${
          type === 'posts' ? 'posts' : 'users'
        }?query=${ encodeURI( query ) }&n=10&o=${ offset }` )
      );

      // If the response is an error, show it
      if ( !response.success )
        return errorToMain( response.message, [ type, query ] );

      // Get the data
      const { data } = response;

      for ( const entry of data ) {
        if ( displayed.includes( entry.id ) )
          continue;
        displayed.push( entry.id );

        // For each entry, create an element and append it to the main container
        let elem;
        switch ( type ) {
          case 'posts':
            elem = construct.post( entry );
            break;

          case 'users':
            elem = construct.user( entry );
            break;

          default:
            continue;
        }

        main.appendChild( elem );
      }

      offset += 10;
      if ( data.length === 10 )
        endCallback = append;
    };

    await append();
  }
};

const construct = {
  profile() {
    // Clone the Profile template
    const profileElem = templates.Profile.content.cloneNode( true )
      .children[ 0 ];

    profileElem.addEventListener( 'click', ( { target } ) => {
      const action = target.getAttribute( 'data-action' );

      switch ( action ) {
        case 'edit':
          changePage( 'profileEdit' );
          break;

        case 'new-post':
          changePage( 'postNew' );
          break;

        case 'logout':
          logout();
          changePage( 'posts' );
          break;

        default:
          break;
      }
    } );

    return profileElem;
  },
  profileEdit( data ) {
    // Clone the profile edit template
    const editElem = templates.SignUp.content.cloneNode( true )
      .children[ 0 ];

    // Get the error element
    const errorElem = editElem.getElementsByClassName( 'error' )[ 0 ];

    editElem.addEventListener( 'submit', async event => {
      event.preventDefault();

      const formData = new FormData( editElem );

      // Validate the username
      if ( !USERNAME_REGEX.test( formData.get( 'username' ) ) ) {
        errorElem.innerText = 'Invalid username!';
        return;
      }

      // Create the new user
      const newUser = {
        username: formData.get( 'username' ),
        glyph:    formData.get( 'glyph' ),
        colour:   formData.get( 'colour' )
      };

      // Create the user update
      const userUpdate = {};
      for ( const [ key, newValue ] of Object.entries( newUser ) )
        if ( newValue !== data[ key ] )
          userUpdate[ key ] = newValue;

      // If nothing has changed, exit
      if ( Object.keys( userUpdate ).length === 0 )
        changePage( 'profile' );

      // Send the request to create a new user
      const response = await jsonBodyErrorToResponse(
        fetch(
          `/api/user?id=${ loggedInId }`,
          {
            method:  'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( userUpdate )
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      login( { ...data, ...userUpdate } );
      changePage( 'profile' );
    } );

    // Get the username input
    const usernameElem = editElem.querySelector( '[ name = "username" ]' );
    // Set the username
    usernameElem.value = data.username;

    // When the username is changed, validate it
    usernameElem.addEventListener( 'input', () => {
      const username = usernameElem.value;

      // Validate the typed username, if invalid, make the border red
      if ( USERNAME_REGEX.test( username ) )
        usernameElem.classList.remove( 'invalid' );
      else
        usernameElem.classList.add( 'invalid' );
    } );

    // Get the glyph input
    const glyphInputElem = editElem.getElementsByClassName( 'sign-up-glyph-input' )[ 0 ];
    // Get the glyph
    const glyphElem = glyphInputElem.getElementsByClassName( 'sign-up-glyph' )[ 0 ];

    // Randomise the glyph order
    const glyphs = [ ...VALID_GLYPHS ].sort( () => Math.random() - 0.5 );
    // Set the current glyph
    let glyphIndex = glyphs.findIndex( glyph => glyph === data.glyph );
    glyphElem.value = glyphs[ glyphIndex ];

    // When the last or next buttons are pressed, change the glyph
    glyphInputElem.addEventListener( 'click', ( { target } ) => {
      const indexDelta = target.classList.contains( 'sign-up-glyph-last' )
        ? -1
        : target.classList.contains( 'sign-up-glyph-next' )
          ? 1
          : 0;

      glyphIndex = ( glyphIndex + indexDelta + glyphs.length ) % glyphs.length;

      glyphElem.value = glyphs[ glyphIndex ];
    } );

    // Get the colour input
    const colourElem = editElem.querySelector( '[ name = "colour" ]' );
    // Set the initial colour
    colourElem.value = data.colour;
    glyphElem.style.color = colourElem.value;

    // When the colour is changed, update the glyph
    colourElem.addEventListener( 'input', () => {
      glyphElem.style.color = colourElem.value;
    } );

    // Change the text of the submit button to Save
    const submitButton = editElem.querySelector( '[ type = "submit" ]' );
    submitButton.setAttribute( 'value', 'Save' );

    // Create the delete element
    const deleteElem = document.createElement( 'input' );
    deleteElem.setAttribute( 'type', 'button' );
    deleteElem.style.borderColor = 'var(--fg-error)';
    deleteElem.setAttribute( 'value', 'Delete' );
    editElem.appendChild( deleteElem );

    deleteElem.addEventListener( 'click', async () => {
      const confirmed = deleteElem.getAttribute( 'data-confirm' );

      if ( confirmed === null ) {
        // Change the button to a confirm button
        deleteElem.setAttribute( 'data-confirm', '' );
        deleteElem.setAttribute( 'value', 'Confirm deletion' );

        setTimeout( () => {
          if ( deleteElem ) {
            // Change the button to a delete button after 3 seconds
            deleteElem.removeAttribute( 'data-confirm' );
            deleteElem.setAttribute( 'value', 'Delete' );
          }
        }, 3000 );
        return;
      }

      // Send the request to delete the user
      const response = await jsonBodyErrorToResponse(
        fetch(
          `/api/user?id=${ loggedInId }`,
          {
            method: 'DELETE'
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      logout();
      changePage( 'posts' );
    } );

    return editElem;
  },
  login() {
    // Clone the Login template
    const loginElem = templates.Login.content.cloneNode( true )
      .children[ 0 ];

    // Get the error element
    const errorElem = loginElem.getElementsByClassName( 'error' )[ 0 ];

    loginElem.addEventListener( 'submit', async event => {
      event.preventDefault();
      const { submitter } = event;

      const action = submitter.getAttribute( 'data-login-action' );

      const formData = new FormData( loginElem );

      let response;

      switch ( action ) {
        case 'login':
          // Validate the username
          if ( !USERNAME_REGEX.test( formData.get( 'username' ) ) ) {
            errorElem.innerText = 'Invalid username!';
            return;
          }

          response = await jsonBodyErrorToResponse(
            fetch( `/api/user?username=${ formData.get( 'username' ) }` )
          );

          // If the user was not found, or there was another error,
          //  show the error
          if ( !response.success ) {
            errorElem.innerText = response.message;
            return;
          }

          login( response.data );
          changePage( 'profile' );

          break;

        case 'signUp':
          // Validate the username
          if (
            !USERNAME_REGEX.test( formData.get( 'username' ) )
                && formData.get( 'username' ) !== ''
          ) {
            errorElem.innerText = 'Invalid username!';
            return;
          }

          newPageData = formData.get( 'username' );

          changePage( 'signUp' );
          break;

        default:
          break;
      }
    } );

    const usernameElem = loginElem.querySelector( '[ name = "username" ]' );
    usernameElem.addEventListener( 'input', () => {
      const username = usernameElem.value;

      // Validate the typed username, if invalid, make the border red
      if ( USERNAME_REGEX.test( username ) )
        usernameElem.classList.remove( 'invalid' );
      else
        usernameElem.classList.add( 'invalid' );
    } );

    return loginElem;
  },
  signUp() {
    // Clone the SignUp template
    const signUpElem = templates.SignUp.content.cloneNode( true )
      .children[ 0 ];

    // Get the error element
    const errorElem = signUpElem.getElementsByClassName( 'error' )[ 0 ];

    signUpElem.addEventListener( 'submit', async event => {
      event.preventDefault();

      const formData = new FormData( signUpElem );

      // Validate the username
      if ( !USERNAME_REGEX.test( formData.get( 'username' ) ) ) {
        errorElem.innerText = 'Invalid username!';
        return;
      }

      // Create the new user
      const newUser = {
        username: formData.get( 'username' ),
        glyph:    formData.get( 'glyph' ),
        colour:   formData.get( 'colour' )
      };

      // Send the request to create a new user
      const response = await jsonBodyErrorToResponse(
        fetch(
          '/api/user',
          {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( newUser )
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      // Set the id to the returned id
      newUser.id = response.data;

      login( newUser );
      changePage( 'profile' );
    } );

    // Get the username input
    const usernameElem = signUpElem.querySelector( '[ name = "username" ]' );
    // Set the username to the saved one, if it exists
    if ( newPageData )
      usernameElem.value = newPageData;

    // When the username is changed, validate it
    usernameElem.addEventListener( 'input', () => {
      const username = usernameElem.value;

      // Validate the typed username, if invalid, make the border red
      if ( USERNAME_REGEX.test( username ) )
        usernameElem.classList.remove( 'invalid' );
      else
        usernameElem.classList.add( 'invalid' );
    } );

    // Get the glyph input
    const glyphInputElem = signUpElem.getElementsByClassName( 'sign-up-glyph-input' )[ 0 ];
    // Get the glyph
    const glyphElem = glyphInputElem.getElementsByClassName( 'sign-up-glyph' )[ 0 ];

    // Randomise the glyph order
    const glyphs = [ ...VALID_GLYPHS ].sort( () => Math.random() - 0.5 );
    // Set the current glyph to the first glyph
    let glyphIndex = 0;
    glyphElem.value = glyphs[ glyphIndex ];

    // When the last or next buttons are pressed, change the glyph
    glyphInputElem.addEventListener( 'click', ( { target } ) => {
      const indexDelta = target.classList.contains( 'sign-up-glyph-last' )
        ? -1
        : target.classList.contains( 'sign-up-glyph-next' )
          ? 1
          : 0;

      glyphIndex = ( glyphIndex + indexDelta + glyphs.length ) % glyphs.length;

      glyphElem.value = glyphs[ glyphIndex ];
    } );

    // Get the colour input
    const colourElem = signUpElem.querySelector( '[ name = "colour" ]' );
    // Set the initial colour
    colourElem.value = darkMode ? '#dddddd' : '#333333';
    glyphElem.style.color = colourElem.value;

    // When the colour is changed, update the glyph
    colourElem.addEventListener( 'input', () => {
      glyphElem.style.color = colourElem.value;
    } );

    return signUpElem;
  },
  post( data ) {
    // Clone the Post template
    const postElem = templates.Post.content.cloneNode( true )
      .children[ 0 ];

    // Set the id data attribute
    postElem.setAttribute( 'data-post-id', data.id.toString() );

    // Get the user element on the post
    const userElem = postElem.getElementsByClassName( 'post-user' )[ 0 ];
    // Set the user's data attributes
    userElem.setAttribute( 'data-user-glyph', data.user.glyph );
    userElem.setAttribute( 'data-user-username', data.user.username );
    // Set the aria label attribute
    userElem.setAttribute( 'aria-label', data.user.username );
    // Set the user's colour
    userElem.style.setProperty( '--glyph-colour', data.user.colour );

    userElem.addEventListener( 'click', () => {
      newPageData = [ data.user.id, 'posts' ];
      changePage( 'user' );
    } );

    // Set the recipe text
    const recipeElem = postElem.getElementsByClassName( 'post-recipe' )[ 0 ];
    for ( const instruction of data.recipe ) {
      // Create a new list entry for the instruction and add it to the list
      const instructionElem = document.createElement( 'li' );
      instructionElem.innerText = instruction;
      recipeElem.appendChild( instructionElem );
    }

    // Get the body element
    const bodyElem = postElem.getElementsByClassName( 'post-body' )[ 0 ];
    bodyElem.innerText = data.body;
    const postDate = new Date( data.timestamp );
    bodyElem.setAttribute( 'data-datetime', `${
      postDate.getUTCDate().toString()
        .padStart( 2, '0' )
    }/${
      ( postDate.getUTCMonth() + 1 ).toString()
        .padStart( 2, '0' )
    }/${
      postDate.getUTCFullYear()
    } ${
      postDate.getUTCHours().toString()
        .padStart( 2, '0' )
    }:${
      postDate.getUTCMinutes().toString()
        .padStart( 2, '0' )
    }` );

    // Return the saturated element
    return postElem;
  },
  postNew() {
    // Clone the PostNew template
    const newElem = templates.PostNew.content.cloneNode( true )
      .children[ 0 ];

    // Get the error element
    const errorElem = newElem.getElementsByClassName( 'error' )[ 0 ];

    newElem.addEventListener( 'submit', async event => {
      event.preventDefault();

      const formData = new FormData( newElem );

      const instructionList = formData.getAll( 'recipe' );

      // Validate the instructions
      if ( instructionList.length === 0 ) {
        errorElem.innerText = 'You must have at least one recipe step!';
        return;
      }
      if ( instructionList.some( instruction => !INSTRUCTION_REGEX.test( instruction ) ) ) {
        errorElem.innerText = 'Invalid recipe step!';
        return;
      }

      // Create the post
      const newPost = {
        user:   loggedInId,
        recipe: instructionList,
        body:   formData.get( 'body' )
      };

      // Send the request to create a new post
      const response = await jsonBodyErrorToResponse(
        fetch(
          '/api/post',
          {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( newPost )
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      // Go to the user's page
      changePage( 'profile' );
    } );

    // Get the instruction list
    const instructions = newElem.getElementsByClassName( 'post-new-recipe' )[ 0 ];

    // Get the new instruction button
    const newInstruction = newElem.querySelector( '[ type = "button" ]' );

    newInstruction.addEventListener( 'click', () => {
      // If the length is 20 elements or more, show an error
      if ( instructions.childElementCount === 19 )
        newInstruction.setAttribute( 'hidden', '' );

      // Clone the PostNewInstruction template
      const instruction = templates.PostNewInstruction.content.cloneNode( true )
        .children[ 0 ];

      instructions.appendChild( instruction );
    } );

    instructions.addEventListener( 'click', ( { target } ) => {
      const action = target.getAttribute( 'data-action' );

      if ( !action )
        return;

      // Get the instruction element
      const instruction = target.parentElement;

      switch ( action ) {
        case 'delete':
          // Remove the instruction element
          instruction.remove();
          break;

        case 'up':
          // Move the instruction up
          if ( instruction.previousElementSibling )
            instruction.parentNode.insertBefore( instruction, instruction.previousElementSibling );
          break;

        case 'down':
          // Move the instruction down
          if ( instruction.nextElementSibling )
            instruction.parentNode.insertBefore( instruction.nextElementSibling, instruction );
          break;

        default:
          break;
      }
    } );

    instructions.addEventListener( 'input', ( { target } ) => {
      // Validate the instruction
      if ( INSTRUCTION_REGEX.test( target.value ) )
        target.classList.remove( 'invalid' );
      else
        target.classList.add( 'invalid' );
    } );

    return newElem;
  },
  postEdit( data ) {
    // Clone the PostNew template
    const editElem = templates.PostNew.content.cloneNode( true )
      .children[ 0 ];

    // Get the error element
    const errorElem = editElem.getElementsByClassName( 'error' )[ 0 ];

    editElem.addEventListener( 'submit', async () => {
      const formData = new FormData( editElem );

      const recipe = formData.getAll( 'recipe' );

      // Validate the instructions
      if ( recipe.some( instruction => !INSTRUCTION_REGEX.test( instruction ) ) ) {
        errorElem.innerText = 'Invalid recipe step!';
        return;
      }

      // Get the post body
      const newBody = formData.get( 'body' );

      // Create the post update with the body if changed
      const postUpdate = newBody === data.body
        ? {}
        : { body: newBody };

      // If the recipe has changed, add it to the update
      if ( !shallowCompare( recipe, data.recipe ) )
        postUpdate.recipe = recipe;

      // If nothing has changed, exit
      if ( Object.keys( postUpdate ).length === 0 )
        changePage( 'profile' );

      // Send the request to update the post
      const response = await jsonBodyErrorToResponse(
        fetch(
          `/api/post?id=${ data.id }`,
          {
            method:  'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( postUpdate )
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      // Go to the user's page
      changePage( 'profile' );
    } );

    // Get the instruction list
    const instructions = editElem.getElementsByClassName( 'post-new-recipe' )[ 0 ];

    // Set the current instructions
    for ( const instruction of data.recipe ) {
      // Clone the PostNewInstruction template
      const instructionElem = templates.PostNewInstruction.content.cloneNode( true )
        .children[ 0 ];

      // Set the instruction
      instructionElem.querySelector( '[ name = "recipe" ]' ).value = instruction;
      instructions.appendChild( instructionElem );
    }

    // Get the new instruction button
    const newInstruction = editElem.querySelector( '[ type = "button" ]' );

    newInstruction.addEventListener( 'click', () => {
      // If the length is 20 elements or more, show an error
      if ( instructions.childElementCount === 19 )
        newInstruction.setAttribute( 'hidden', '' );

      // Clone the PostNewInstruction template
      const instruction = templates.PostNewInstruction.content.cloneNode( true )
        .children[ 0 ];

      instructions.appendChild( instruction );
    } );

    instructions.addEventListener( 'click', ( { target } ) => {
      const action = target.getAttribute( 'data-action' );

      if ( !action )
        return;

      // Get the instruction element
      const instruction = target.parentElement;

      switch ( action ) {
        case 'delete':
          // Remove the instruction element
          instruction.remove();
          break;

        case 'up':
          // Move the instruction up
          if ( instruction.previousElementSibling )
            instruction.parentNode.insertBefore( instruction, instruction.previousElementSibling );
          break;

        case 'down':
          // Move the instruction down
          if ( instruction.nextElementSibling )
            instruction.parentNode.insertBefore( instruction.nextElementSibling, instruction );
          break;

        default:
          break;
      }
    } );

    instructions.addEventListener( 'input', ( { target } ) => {
      // Validate the instruction
      if ( INSTRUCTION_REGEX.test( target.value ) )
        target.classList.remove( 'invalid' );
      else
        target.classList.add( 'invalid' );
    } );

    // Get the body element
    const body = editElem.querySelector( '[ name = "body" ]' );
    // Set the body
    body.value = data.body;

    // Create the delete element
    const deleteElem = document.createElement( 'input' );
    deleteElem.setAttribute( 'type', 'button' );
    deleteElem.style.borderColor = 'var(--fg-error)';
    deleteElem.setAttribute( 'value', 'Delete' );
    editElem.appendChild( deleteElem );

    deleteElem.addEventListener( 'click', async () => {
      const confirmed = deleteElem.getAttribute( 'data-confirm' );

      if ( confirmed === null ) {
        // Change the button to a confirm button
        deleteElem.setAttribute( 'data-confirm', '' );
        deleteElem.setAttribute( 'value', 'Confirm deletion' );

        setTimeout( () => {
          if ( deleteElem ) {
            // Change the button to a delete button after 3 seconds
            deleteElem.removeAttribute( 'data-confirm' );
            deleteElem.setAttribute( 'value', 'Delete' );
          }
        }, 3000 );
        return;
      }

      // Send the request to delete the user
      const response = await jsonBodyErrorToResponse(
        fetch(
          `/api/post?id=${ data.id }`,
          {
            method: 'DELETE'
          }
        )
      );

      // If there was an error, show it
      if ( !response.success ) {
        errorElem.innerText = response.message;
        return;
      }

      changePage( 'profile' );
    } );

    // Get the submit button
    const saveButton = editElem.querySelector( '[ type = "submit" ]' );
    saveButton.setAttribute( 'value', 'Save' );

    return editElem;
  },
  user( data ) {
    // Clone the User template
    const userElem = templates.User.content.cloneNode( true )
      .children[ 0 ];

    // Set the id data attribute
    userElem.setAttribute( 'data-user-id', data.id.toString() );

    // Set the glyph attribute
    userElem.setAttribute( 'data-user-glyph', data.glyph );
    // Set the glyph colour attribute
    userElem.style.setProperty( '--glyph-colour', data.colour );

    // Get the info element
    const infoElem = userElem.getElementsByClassName( 'user-info' )[ 0 ];

    // Set the username
    const usernameElem = infoElem.getElementsByClassName( 'user-username' )[ 0 ];
    usernameElem.innerText = `@${ data.username }`;
    usernameElem.addEventListener( 'click', () => {
      newPageData = [ data.id, 'posts' ];
      changePage( 'user' );
    } );

    // Get the figures element
    const figuresElem = infoElem.getElementsByClassName( 'user-figures' )[ 0 ];

    // Set the number of posts
    const nPostsElem = figuresElem.getElementsByClassName( 'user-nposts' )[ 0 ];
    nPostsElem.innerText = `Posts: ${ data.nPosts }`;
    nPostsElem.addEventListener( 'click', () => {
      newPageData = [ data.id, 'posts' ];
      changePage( 'user' );
    } );

    // Set the number of people the user is following, or if private, remove the
    //  number of posts element
    const nFollowingElem = figuresElem.getElementsByClassName( 'user-nfollowing' )[ 0 ];
    nFollowingElem.innerText = `Following: ${ data.nFollowing }`;
    nFollowingElem.addEventListener( 'click', () => {
      newPageData = [ data.id, 'following' ];
      changePage( 'user' );
    } );

    return userElem;
  },
  search( value, type ) {
    // Clone the search template
    const searchElem = templates.Search.content.cloneNode( true )
      .children[ 0 ];

    if ( value !== undefined )
      searchElem.querySelector( '[ type = "text" ]' )
        .value = value;

    searchElem.addEventListener( 'submit', async event => {
      event.preventDefault();

      const formData = new FormData( searchElem );
      const query = formData.get( 'query' );

      newPageData = [ type ?? currentPage, query ];
      changePage( 'search' );
    }, { once: true } );

    return searchElem;
  }
};


/* -- On load -- */

window.addEventListener( 'DOMContentLoaded', () => {
  /* -- Add keyboard click for accessibility -- */

  /* Code adapted from https://github.com/tomBoddaert/tomBoddaert.github.io/blob/01fe1d85a91d6c08cbf741c42e4ed6faa54e3367/rawPages/resources/main.ts#L17 */
  document.addEventListener( 'keyup', event => {
    if (
      ( event.key === 'Enter' || event.key === ' ' )
          && document.activeElement?.tagName !== 'input'
    )
      document.activeElement?.dispatchEvent( newSimulateClickEvent() );
  } );

  /* -- Dark mode -- */

  // Get the dark mode selector
  dmSelector = document.getElementById( 'dm-selector' );

  // Get the logo
  logoElem = document.getElementById( 'logo' );
  logo = logoElem.contentWindow;

  // Set the dark mode selector's initial emoji
  if ( darkMode )
    dmSelector.innerText = '🌕';
  // Add dmClick as a click event listener on the dark mode selector
  dmSelector.addEventListener( 'click', dmClick );


  /* -- Nav bar -- */

  // Get the nav bar
  nav = document.getElementsByTagName( 'nav' )[ 0 ];

  // Get the nav bar buttons and label by page-id
  navButtons = ( () => {
    const buttons = {};
    for ( const c of nav.children )
      buttons[ c.getAttribute( 'data-page-id' ) ] = c;

    return buttons;
  } )();

  nav.addEventListener( 'click', navClick );


  /* -- Main container -- */

  // Get the main container
  main = document.getElementsByTagName( 'main' )[ 0 ];


  /* -- End observer -- */

  // Get the end element
  const end = document.getElementById( 'End' );

  const observer = new IntersectionObserver( async observation => {
    if ( observation.length === 0 || !observation.at( 0 ).isIntersecting )
      return;

    if ( endCallback ) {
      // Get the callback and unset it so it isn't triggered
      //  while it's running
      const currentEndCallback = endCallback;
      endCallback = undefined;

      // Call the callback
      await currentEndCallback();
    }
  } );
  observer.observe( end );


  /* -- Pages -- */

  // Get the templates
  const templateElems = document.getElementsByTagName( 'template' );
  for ( const template of templateElems )
    templates[ template.getAttribute( 'id' ) ] = template;

  /* -- Logo -- */
  logo.addEventListener( 'click', () => {
    logoElem.animate(
      [ { transform: 'rotate( 0deg )' }, { transform: 'rotate( 360deg )' } ],
      {
        fill:     'forwards',
        duration: 1000,
        easing:   'ease-in-out'
      }
    );
  } );

  // Load the initial page
  initPage[ currentPage ]();
} );


/* -- On message -- */

window.addEventListener( 'message', e => {
  if ( e.data === 'logoLoad' )
    logo?.postMessage( darkMode ? 'dark' : 'light', '*' );
} );


/* -- On before unload -- */

// Scroll to the top on unload, so if refreshed, it
//  goes to the top of the page
window.addEventListener( 'beforeunload', () => window.scrollTo( 0, 0 ) );
