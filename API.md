# DrinkShare API

## Responses

Every response that returns a `200` HTTP status code, will be JSON encoded. The data will be in one of the two formats:

<table>
  <tr>
    <th>Key</th> <th>Value</th> <th>Condition</th>
  </tr>
  <tr>
    <td><code>success</code></td> <td><code>boolean</code></td>
  </tr>
  <tr>
    <td><code>data</code></td> <td><code>any</code></td> <td>if success</td>
  </tr>
  <tr>
    <td><code>message</code></td> <td><code>string</code></td> <td>unless success</td>
  </tr>
</table>

## Arrays

Arrays of type `Type` are denoted by `Type[]`

## Objects

An object `Object` with options `op1` and `op2` is denoted `Object<op1, op2>`

### User

<table>
  <tr>
    <th>Key</th> <th>Value</th> <th>Condition</th>
  </tr>
  <tr>
    <td><code>id</code></td> <td><code>integer</code></td>
  </tr>
  <tr>
    <td><code>username</code></td> <td><code>string</code>, <code style="display: block;">/^[a-zA-Z0-9_.\-+=!*|]{1,20}$/</code></td>
  </tr>
  <tr>
    <td><code>colour</code></td> <td><code>string</code>, <code style="display: block;">/^#[0-9a-f]{6}$/</code></td>
  </tr>
  <tr>
    <td><code>glyph</code></td> <td><code>character</code>, <code style="display: block;">/^[!"$-*,.-&lt;&gt;-^a-}£]$/</code></td>
  </tr>
  <tr>
    <td><code>nPosts</code></td> <td><code>integer</code></td>
  </tr>
  <tr>
    <td><code>nFollowing</code></td> <td><code>integer</code></td>
  </tr>
  <tr>
    <td><code>posts</code></td> <td><code>Post<-user>[]</code></td> <td>if option: posts</td>
  </tr>
  <tr>
    <td><code>following</code></td> <td><code>User[]</code></td> <td>if option: users</td>
  </tr>
</table>

### Post

<table>
  <tr>
    <th>Key</th> <th>Value</th> <th>Condition</th>
  </tr>
  <tr>
    <td><code>id</code></td> <td><code>integer</code></td>
  </tr>
  <tr>
    <td><code>user</code></td> <td><code>User</code></td> <td>unless option: -user</td>
  </tr>
  <tr>
    <td><code>timestamp</code></td> <td><code>integer</code>, <div>milliseconds since epoch</div></td>
  </tr>
  <tr>
    <td><code>recipe</code></td> <td><code>string[]</code> <div>string: <code>/^[A-Za-z0-9,.\- ]{1,100}$/</code></div> <div>Array length between 0 and 20 inclusive</div></td>
  </tr>
  <tr>
    <td><code>body</code></td> <td><code>string</code></td>
  </tr>
</table>

# `/api/user`

## GET

Get information about a user.

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

#### `posts`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>number</td> <td><code>integer</code></td> <td>Default: <code>10</code></td>
  </tr>
  <tr>
    <td>offset</td> <td><code>integer</code></td> <td>Default: <code>0</code></td>
  </tr>
</table>

#### `following`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>number</td> <td><code>integer</code></td> <td>Default: <code>10</code></td>
  </tr>
  <tr>
    <td>offset</td> <td><code>integer</code></td> <td>Default: <code>0</code></td>
  </tr>
</table>

### Response data

`User`
- with posts option if `posts` parameter provided, with posts from newest to oldest
  - Length of posts will be less than or equal to the number argument
  - The offset of the latest post is the offset argument
- with following option if `following` parameter provided, with the following list from newest to oldest
  - Length of following list will be less than or equal to the number argument
  - The offset of the latest following user is the offset argument

## POST

Create a new user

### Body

The body must be JSON encoded. This is a representation of a user.

<table>
  <tr>
    <th>Key</th> <th>Value</th>
  </tr>
  <tr>
    <td><code>username</code></td> <td><code>string</code>, <code style="display:block;">/^[a-zA-Z0-9_.\-+=!*|]{1,20}$/</code></td>
  </tr>
  <tr>
    <td><code>colour</code></td> <td><code>string</code>, <code style="display:block;">/^#[0-9a-f]{6}$/</code></td>
  </tr>
  <tr>
    <td><code>glyph</code></td> <td><code>character</code>, <code style="display: block;">/^[!"$-*,.-&lt;&gt;-^a-}£]$/</code></td>
  </tr>
</table>

### Response data

`integer`
- the id of the new user

## PATCH

### Parameters

#### `id`

<table>
  <tr>
    <td>Condition</td> <td>Unless <code>username</code></td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

#### `username`

<table>
  <tr>
    <td>Condition</td> <td>Unless <code>id</code</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>username</td> <td><code>string</code>, <code style="display: block;">/^[a-zA-Z0-9_.\-+=!*|]{1,20}$/</code></td>
  </tr>
</table>

### Body

The body must be JSON encoded. This is a partial representation of a user.

<table>
  <tr>
    <th>Key</th> <th>Value</th> <th>Optional</th>
  </tr>
  <tr>
    <td><code>username</code></td> <td><code>string</code>, <code style="display:block;">/^[a-zA-Z0-9_.\-+=!*|]{1,20}$/</code></td> <td>yes</td>
  </tr>
  <tr>
    <td><code>colour</code></td> <td><code>string</code>, <code style="display:block;">/^#[0-9a-f]{6}$/</code></td> <td>yes</td>
  </tr>
  <tr>
    <td><code>glyph</code></td> <td><code>character</code>, <code style="display: block;">/^[!"$-*,.-&lt;&gt;-^a-}£]$/</code></td> <td>yes</td>
  </tr>
</table>

### Response data

`true`

## DELETE

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

### Response data

`true`

# `/api/post`

## GET

Get information about a post.

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

#### `-user`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
</table>

### Response data

`Post`
- with -user option if `-user` parameter provided

## POST

Create a new post

### Body

The body must be JSON encoded. This is a representation of the user.

<table>
  <tr>
    <th>Key</th> <th>Value</th>
  </tr>
  <tr>
    <td><code>user</code></td> <td><code>integer</code> (user's id)</td>
  </tr>
  <tr>
    <td><code>recipe</code></td> <td><code>string[]</code> <div>string: <code>/^[A-Za-z0-9,.\- ]{1,100}$/</code></div> <div>Array length between 0 and 20 inclusive</div></td>
  </tr>
  <tr>
    <td><code>body</code></td> <td><code>string</code></td>
  </tr>
</table>

### Response data

`integer`
- the id of the new post

## PATCH

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

### Body

The body must be JSON encoded. This is a partial representation of a post.

<table>
  <tr>
    <th>Key</th> <th>Value</th> <th>Optional</th>
  </tr>
  <tr>
    <td><code>user</code></td> <td><code>integer</code> (user's id)</td> <td>yes</td>
  </tr>
  <tr>
    <td><code>recipe</code></td> <td><code>string[]</code> <div>string: <code>/^[A-Za-z0-9,.\- ]{1,100}$/</code></div> <div>Array length between 0 and 20 inclusive</div></td> <td>yes</td>
  </tr>
  <tr>
    <td><code>body</code></td> <td><code>string</code></td> <td>yes</td>
  </tr>
</table>

### Response data

`true`

## DELETE

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

### Response data

`true`

# `/api/users`

## GET

### Parameters

#### `n`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <td>Default</td> <td><code>10</code></td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>number</td> <td><code>integer</code></td>
  </tr>
</table>

#### `o`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <td>Default</td> <td><code>0</code></td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>offset</td> <td><code>integer</code></td>
  </tr>
</table>

### Response data

`User[]` in order from newest to oldest with a maximum length of the `n` parameter, and offset of the `o` parameter

# `/api/posts`

## GET

### Parameters

#### `n`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <td>Default</td> <td><code>10</code></td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>number</td> <td><code>integer</code></td>
  </tr>
</table>

#### `o`

<table>
  <tr>
    <td>Optional</td> <td>yes</td>
  </tr>
  <tr>
    <td>Default</td> <td><code>0</code></td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>offset</td> <td><code>integer</code></td>
  </tr>
</table>

### Response data

`Post[]` in order from newest to oldest with a maximum length of the `n` parameter, and offset of the `o` parameter

# `/api/follow`

## GET

Check if a user is following another user

### Parameters

#### `id`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>id</td> <td><code>integer</code></td>
  </tr>
</table>

#### `follow`

<table>
  <tr>
    <td>Optional</td> <td>no</td>
  </tr>
  <tr>
    <th>Arguments</th>
  </tr>
  <tr>
    <td>follow</td> <td><code>integer</code></td>
  </tr>
</table>

### Response data

`boolean`, `true` if the user (`id`) follows the follow (`follow`)

## POST

Follow a user

### Body

The body must be JSON encoded.

<table>
  <tr>
    <th>Key</th> <th>Value</th>
  </tr>
  <tr>
    <td><code>id</code></td> <td><code>integer</code>, the id of the user</td>
  </tr>
  <tr>
    <td><code>follow</code></td> <td><code>integer</code>, the id of the user to follow</td>
  </tr>
</table>

### Response data

`true`

## DELETE

Unfollow a user

### Body

The body must be JSON encoded.

<table>
  <tr>
    <th>Key</th> <th>Value</th>
  </tr>
  <tr>
    <td><code>id</code></td> <td><code>integer</code>, the id of the user</td>
  </tr>
  <tr>
    <td><code>follow</code></td> <td><code>integer</code>, the id of the user to unfollow</td>
  </tr>
</table>

### Response data

`true`
