![The logo with the letters DB in the middle of a minimalist line drawing of a plate](/docs/logo.png)

# DishBoard

This is a social media / recipe sharing website made for a Uni project.

## Use

Go to `http://localhost:8080/` by default (configurable in [.env](/.env))

### Login / Sign up

To login or sign up, click the `Login` button in the navigation bar at the top.
![A button with the text Login](/docs/login_button.png)

This will take you to the login page.
![A page with a username box and login and sign up buttons](/docs/login_page.png)

Clicking `Sign Up` will bring you to the sign up page.
![A page with a username box, glyph and colour selectors and a sign up button](/docs/sign_up_page.png)

### Feed

The feed has posts ordered from newest to oldest.
![A post with a user, recipe and some text](/docs/post.png)

Clicking on the user will bring you to the user page.

### Users

The users page has the registered users from newest to oldest.
![A user with a glyph, and the number of posts and people they are following](/docs/user.png)

## Starting

To install the required modules, run `npm i`  
To start the server in dev mode, run `npm run start-dev`  
To start the server in production mode, run `npm run start`

## API

The API is available at `/api`.
The documentation is in [docs/API.md](/docs/API.md).

## NPM Scripts

- `lint` - lint the code with eslint and stylelint
- `test` - run jest tests on unix-like systems
- `test_windows` - run jest tests on Windows
- `start` - start the server in production mode
- `start-dev` - start the server in dev mode (no db and sample data)
