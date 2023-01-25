# Get latest posts
This will get the latest posts. The server will respond with up to 10 posts, but in this example, there are only 2 on the server. The first post was created by `userTwo` and the second by `userOne` (there is an implied `userZero` that has not posted anything).

> GET `/api/posts`
```JSON
{
    "success": true,
    "data": [
        {
            "id": 1,
            "user": {
                "id": 1,
                "username": "UserOne",
                "colour": "#808080",
                "glyph": "h",
                "nPosts": 1,
                "nFollowing": 1
            },
            "timestamp": 1610000000000,
            "recipe": [
                "Instruction one",
                "Instruction two"
            ],
            "body": "This is the second post"
        },
        {
            "id": 0,
            "user": {
                "id": 2,
                "username": "UserTwo",
                "colour": "#aa8877",
                "glyph": ",",
                "nPosts": 1,
                "nFollowing": 0
            },
            "timestamp": 1600000000000,
            "recipe": [
                "Instruction one",
                "Instruction two"
            ],
            "body": "This is the first post"
        }
    ]
}
```

# Get specific user with posts and following list
This will get `userOne`, their latest posts (up to 10), and the latest people they are following (up to 10). In this case, they have only posted one post and followed one user.

> GET `/api/user?id=1&posts&following`
```JSON
{
    "success": true,
    "data": {
        "id": 1,
        "username": "UserOne",
        "colour": "#808080",
        "glyph": "h",
        "nPosts": 1,
        "nFollowing": 1,
        "posts": [
            {
                "id": 1,
                "user": 1,
                "timestamp": 1610000000000,
                "recipe": [
                    "Instruction one",
                    "Instruction two"
                ],
                "body": "This is the second post"
            }
        ],
        "following": {
            "id": 0,
            "username": "UserZero",
            "colour": "#7788aa",
            "glyph": "-",
            "nPosts": 0,
            "nFollowing": 2
        }
    }
}
```

# Get a user by a username that does not exist
This will attempt to get `UserNaN`, who does not exist.

> GET `/api/user?username=userNan
```JSON
{
    "success": false,
    "message": "User 'UserNaN' not found!"
}
```
